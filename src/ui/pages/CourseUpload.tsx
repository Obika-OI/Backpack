import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../store/AppContext";
import { useAuth } from "../../store/AuthContext";
import { CourseModule } from "../../types";
import { FileUpload } from "../components/FileUpload";
import { 
    Plus, X, UploadCloud, CheckCircle2, DollarSign, FileText, 
    Layers, Video, CheckSquare, Square
} from "lucide-react";

const CourseUpload = () => {
    const navigate = useNavigate();
    const { addCourse, orgMembers, organizations } = useAppContext();
    const { currentUser } = useAuth();
    
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [currency, setCurrency] = useState("NGN");
    
    // Payment terms tick box state (select one or both)
    const [allowPayInFull, setAllowPayInFull] = useState(true);
    const [allowInstallments, setAllowInstallments] = useState(true);
    const [installmentInterval, setInstallmentInterval] = useState<'weekly' | 'monthly' | 'custom'>('monthly');

    // Itemized Requirements State
    const [studentReqList, setStudentReqList] = useState<string[]>([]);
    const [newStudentReq, setNewStudentReq] = useState("");

    const [processStepList, setProcessStepList] = useState<string[]>([]);
    const [newProcessStep, setNewProcessStep] = useState("");

    const [instructorReqList, setInstructorReqList] = useState<string[]>([]);
    const [newInstructorReq, setNewInstructorReq] = useState("");

    const [qualificationTitle, setQualificationTitle] = useState("");
    const [qualificationType, setQualificationType] = useState<'bachelors' | 'masters' | 'doctorate' | 'diploma' | 'certificate' | 'professional' | 'other'>('certificate');

    const [selectedOrgId, setSelectedOrgId] = useState("");
    const [loading, setLoading] = useState(false);
    
    const [modules, setModules] = useState<CourseModule[]>([
        { id: `m${crypto.randomUUID()}`, title: "", content: "", media: [] }
    ]);

    if (!currentUser || (currentUser.role !== 'organization' && currentUser.role !== 'instructor')) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Access Denied</h2>
                <p className="text-slate-500 dark:text-slate-400">Only organizations and instructors can create courses.</p>
            </div>
        );
    }

    const myOrgMemberships = orgMembers.filter(m => m.email === currentUser.email);
    const approvedOrgs = currentUser.role === 'instructor' 
        ? organizations.filter(org => myOrgMemberships.some(m => m.orgId === org.id || m.orgId === org.ownerId))
        : [];

    const addModule = () => {
        setModules([...modules, { id: `m${crypto.randomUUID()}`, title: "", content: "", media: [] }]);
    };

    const updateModule = (index: number, field: keyof CourseModule, value: unknown) => {
        const newModules = [...modules];
        newModules[index] = { ...newModules[index], [field]: value };
        setModules(newModules);
    };

    const removeModule = (index: number) => {
        setModules(modules.filter((_, i) => i !== index));
    };

    const addModuleMedia = (index: number, url: string, fileType: 'image' | 'video' | 'document') => {
        const newModules = [...modules];
        const currentMedia = newModules[index].media || [];
        const mediaName = `${fileType.charAt(0).toUpperCase() + fileType.slice(1)} file ${currentMedia.length + 1}`;
        newModules[index] = {
            ...newModules[index],
            media: [...currentMedia, { id: `med_${crypto.randomUUID()}`, name: mediaName, url, type: fileType }]
        };
        setModules(newModules);
    };

    const removeModuleMedia = (moduleIndex: number, mediaId: string) => {
        const newModules = [...modules];
        if (newModules[moduleIndex].media) {
            newModules[moduleIndex].media = newModules[moduleIndex].media!.filter(m => m.id !== mediaId);
        }
        setModules(newModules);
    };

    // Requirement helper handlers
    const handleAddStudentReq = () => {
        if (!newStudentReq.trim()) return;
        setStudentReqList([...studentReqList, newStudentReq.trim()]);
        setNewStudentReq("");
    };

    const handleRemoveStudentReq = (idx: number) => {
        setStudentReqList(studentReqList.filter((_, i) => i !== idx));
    };

    const handleAddProcessStep = () => {
        if (!newProcessStep.trim()) return;
        setProcessStepList([...processStepList, newProcessStep.trim()]);
        setNewProcessStep("");
    };

    const handleRemoveProcessStep = (idx: number) => {
        setProcessStepList(processStepList.filter((_, i) => i !== idx));
    };

    const handleAddInstructorReq = () => {
        if (!newInstructorReq.trim()) return;
        setInstructorReqList([...instructorReqList, newInstructorReq.trim()]);
        setNewInstructorReq("");
    };

    const handleRemoveInstructorReq = (idx: number) => {
        setInstructorReqList(instructorReqList.filter((_, i) => i !== idx));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        
        const orgIdToUse = currentUser.role === 'organization' ? currentUser.id : selectedOrgId;
        if (!orgIdToUse) {
            alert("Please select an organization.");
            return;
        }

        const targetOrg = organizations.find(o => o.id === orgIdToUse || o.ownerId === orgIdToUse);
        const isHigherEduOrg = targetOrg?.orgType === 'higher';
        const isHigherDegree = ['bachelors', 'masters', 'doctorate'].includes(qualificationType);

        if (isHigherDegree && !isHigherEduOrg) {
            alert("Higher education degrees (Bachelors, Masters, Doctorate) can only be offered by Higher Education Institutions.");
            return;
        }

        // Determine payment terms allowed
        let paymentTermsAllowed: 'one-time' | 'installment' | 'both' = 'both';
        if (allowPayInFull && allowInstallments) {
            paymentTermsAllowed = 'both';
        } else if (allowPayInFull) {
            paymentTermsAllowed = 'one-time';
        } else if (allowInstallments) {
            paymentTermsAllowed = 'installment';
        }

        setLoading(true);

        try {
            await addCourse({
                id: `c_${crypto.randomUUID()}`,
                orgId: orgIdToUse,
                title,
                description,
                price: Number(price),
                currency,
                paymentTermsAllowed,
                installmentInterval: allowInstallments ? installmentInterval : undefined,
                qualificationTitle: qualificationTitle.trim() || undefined,
                qualificationType,
                instructorName: currentUser.role === 'instructor' ? currentUser.name : undefined,
                instructorId: currentUser.role === 'instructor' ? currentUser.id : undefined,
                requirements: studentReqList.join('\n'),
                applicationProcess: processStepList.join('\n'),
                instructorRequirements: instructorReqList.join('\n'),
                modules
            });
            navigate("/dashboard");
        } catch(err) {
            console.error("Failed to upload course", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-8 flex items-center">
                <UploadCloud className="w-8 h-8 mr-3 text-indigo-400" />
                Upload New Course
            </h1>

            <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in">
                {/* Basic Info */}
                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-700 pb-4">Basic Information</h2>
                    
                    {currentUser.role === 'instructor' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Organization</label>
                            <select
                                required
                                value={selectedOrgId}
                                onChange={(e) => setSelectedOrgId(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="" disabled>Select an organization</option>
                                {approvedOrgs.map(org => (
                                    <option key={org.id} value={org.id}>{org.name}</option>
                                ))}
                            </select>
                            {approvedOrgs.length === 0 && (
                                <p className="text-xs text-amber-400 mt-2">You must join an organization before you can create a course.</p>
                            )}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Course Title</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                            placeholder="e.g. Introduction to React Native"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Description</label>
                        <textarea
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 h-32"
                            placeholder="What will students learn in this course?"
                        />
                    </div>

                    {/* Qualification & Instructor Assignment */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Qualification / Award Title</label>
                            <input
                                type="text"
                                value={qualificationTitle}
                                onChange={(e) => setQualificationTitle(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                placeholder="e.g. Bachelor of Science in Computer Science, Diploma in Tech"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Qualification Type</label>
                            <select
                                value={qualificationType}
                                onChange={(e) => setQualificationType(e.target.value as 'bachelors' | 'masters' | 'doctorate' | 'diploma' | 'certificate' | 'professional' | 'other')}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="certificate">Certificate</option>
                                <option value="diploma">Diploma</option>
                                <option value="professional">Professional Certification</option>
                                <option value="other">Other Award</option>
                                {((currentUser.role === 'organization' && organizations.find(o => o.id === currentUser.id || o.ownerId === currentUser.id)?.orgType === 'higher') ||
                                  (currentUser.role === 'instructor' && organizations.find(o => o.id === selectedOrgId || o.ownerId === selectedOrgId)?.orgType === 'higher')) ? (
                                    <>
                                        <option value="bachelors">Bachelor's Degree (B.Sc / B.A)</option>
                                        <option value="masters">Master's Degree (M.Sc / MBA)</option>
                                        <option value="doctorate">Doctorate Degree (Ph.D)</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="bachelors" disabled>Bachelor's Degree (Higher Education Only)</option>
                                        <option value="masters" disabled>Master's Degree (Higher Education Only)</option>
                                        <option value="doctorate" disabled>Doctorate Degree (Higher Education Only)</option>
                                    </>
                                )}
                            </select>
                            {!((currentUser.role === 'organization' && organizations.find(o => o.id === currentUser.id || o.ownerId === currentUser.id)?.orgType === 'higher') ||
                               (currentUser.role === 'instructor' && organizations.find(o => o.id === selectedOrgId || o.ownerId === selectedOrgId)?.orgType === 'higher')) && (
                                <p className="text-xs text-amber-500 dark:text-amber-400 mt-1">
                                    Higher education degrees (Bachelors, Masters, Doctorate) are restricted to Higher Education Institutions.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Pricing & Payment Terms */}
                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-4 mb-4 flex items-center">
                        <DollarSign className="w-5 h-5 mr-2 text-indigo-400" /> Pricing & Payment Terms
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Course Fee</label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Currency</label>
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="NGN">NGN (₦)</option>
                                <option value="USD">USD ($)</option>
                                <option value="KES">KES (KSh)</option>
                                <option value="ZAR">ZAR (R)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Allowed Payment Terms for Enrollees (Tick to select one or both)</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div 
                                onClick={() => {
                                    if (allowPayInFull && !allowInstallments) return;
                                    setAllowPayInFull(!allowPayInFull);
                                }}
                                className={`p-4 rounded-xl border flex items-start space-x-3 cursor-pointer transition select-none ${
                                    allowPayInFull 
                                        ? 'bg-indigo-600/10 border-indigo-500 text-slate-900 dark:text-white' 
                                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                                }`}
                            >
                                <div className="mt-0.5 text-indigo-400">
                                    {allowPayInFull ? <CheckSquare className="w-5 h-5 text-indigo-500" /> : <Square className="w-5 h-5 text-slate-400" />}
                                </div>
                                <div>
                                    <div className="text-sm font-bold">Pay in Full (One-time payment)</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Allow students to pay total course fee upfront</div>
                                </div>
                            </div>

                            <div 
                                onClick={() => {
                                    if (allowInstallments && !allowPayInFull) return;
                                    setAllowInstallments(!allowInstallments);
                                }}
                                className={`p-4 rounded-xl border flex items-start space-x-3 cursor-pointer transition select-none ${
                                    allowInstallments 
                                        ? 'bg-indigo-600/10 border-indigo-500 text-slate-900 dark:text-white' 
                                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                                }`}
                            >
                                <div className="mt-0.5 text-indigo-400">
                                    {allowInstallments ? <CheckSquare className="w-5 h-5 text-indigo-500" /> : <Square className="w-5 h-5 text-slate-400" />}
                                </div>
                                <div>
                                    <div className="text-sm font-bold">Flexible Installments</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Allow students to pay in recurring split installments</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {allowInstallments && (
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Installment Frequency</label>
                            <select
                                value={installmentInterval}
                                onChange={(e) => setInstallmentInterval(e.target.value as 'weekly' | 'monthly' | 'custom')}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="monthly">Monthly Installments (3 equal payments)</option>
                                <option value="weekly">Weekly Installments (4 equal payments)</option>
                                <option value="custom">Custom Milestone Payments</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* Requirements & Process - Itemized Builder */}
                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-8">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-4 mb-2 flex items-center">
                            <Layers className="w-5 h-5 mr-2 text-indigo-400" /> Course Requirements & Admission Process
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Add admission requirements (including required documents, transcripts, prerequisites) and process steps item by item.
                        </p>
                    </div>

                    {/* 1. Student Admission Requirements & Documents */}
                    <div className="space-y-3">
                        <label className="block text-sm font-bold text-slate-900 dark:text-white">
                            Student Admission Requirements & Required Documents (Add One by One)
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newStudentReq}
                                onChange={(e) => setNewStudentReq(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddStudentReq(); } }}
                                placeholder="e.g. High School Transcript PDF / National ID / Basic JavaScript knowledge"
                                className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                                type="button"
                                onClick={handleAddStudentReq}
                                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add Requirement</span>
                            </button>
                        </div>

                        {studentReqList.length > 0 ? (
                            <ul className="space-y-2 pt-2">
                                {studentReqList.map((req, idx) => (
                                    <li key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-800 dark:text-slate-200">
                                        <span className="flex items-center">
                                            <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2.5"></span>
                                            {req}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveStudentReq(idx)}
                                            className="text-slate-400 hover:text-red-500 transition p-1"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-xs text-slate-400 italic">No admission requirements or required documents added yet.</p>
                        )}
                    </div>

                    {/* 2. Application Process Steps */}
                    <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <label className="block text-sm font-bold text-slate-900 dark:text-white">
                            Application Process Steps (Add One by One)
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newProcessStep}
                                onChange={(e) => setNewProcessStep(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddProcessStep(); } }}
                                placeholder="e.g. Step 1: Online Application Form Submission"
                                className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                                type="button"
                                onClick={handleAddProcessStep}
                                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add Process Step</span>
                            </button>
                        </div>

                        {processStepList.length > 0 ? (
                            <ol className="space-y-2 pt-2">
                                {processStepList.map((step, idx) => (
                                    <li key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-800 dark:text-slate-200">
                                        <span className="flex items-center font-medium">
                                            <span className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 text-xs font-bold flex items-center justify-center mr-3">
                                                {idx + 1}
                                            </span>
                                            {step}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveProcessStep(idx)}
                                            className="text-slate-400 hover:text-red-500 transition p-1"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <p className="text-xs text-slate-400 italic">No application process steps added yet.</p>
                        )}
                    </div>

                    {/* 3. Instructor Employment Requirements */}
                    <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <label className="block text-sm font-bold text-slate-900 dark:text-white">
                            Instructor Employment Requirements (Add One by One)
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newInstructorReq}
                                onChange={(e) => setNewInstructorReq(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddInstructorReq(); } }}
                                placeholder="e.g. 3+ years experience teaching full-stack web dev"
                                className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                                type="button"
                                onClick={handleAddInstructorReq}
                                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add Requirement</span>
                            </button>
                        </div>

                        {instructorReqList.length > 0 ? (
                            <ul className="space-y-2 pt-2">
                                {instructorReqList.map((req, idx) => (
                                    <li key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-800 dark:text-slate-200">
                                        <span className="flex items-center">
                                            <span className="w-2 h-2 rounded-full bg-amber-500 mr-2.5"></span>
                                            {req}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveInstructorReq(idx)}
                                            className="text-slate-400 hover:text-red-500 transition p-1"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-xs text-slate-400 italic">No instructor requirements added yet.</p>
                        )}
                    </div>
                </div>

                {/* Modules with Image, Video, and Document Upload */}
                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4 mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Course Modules</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Upload module content along with images, videos, and documents.</p>
                        </div>
                        <button
                            type="button"
                            onClick={addModule}
                            className="px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-lg text-sm font-bold transition flex items-center"
                        >
                            <Plus className="w-4 h-4 mr-1" /> Add Module
                        </button>
                    </div>

                    <div className="space-y-6">
                        {modules.map((mod, index) => (
                            <div key={mod.id} className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 relative group space-y-4">
                                {modules.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeModule(index)}
                                        className="absolute top-4 right-4 p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-md transition opacity-0 group-hover:opacity-100"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                                
                                <div>
                                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Module {index + 1} Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={mod.title}
                                        onChange={(e) => updateModule(index, "title", e.target.value)}
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                        placeholder="e.g. Getting Started"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Module Content</label>
                                    <textarea
                                        required
                                        value={mod.content}
                                        onChange={(e) => updateModule(index, "content", e.target.value)}
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 h-24 font-mono text-sm"
                                        placeholder="Enter text or markdown content..."
                                    />
                                </div>

                                {/* Media Upload Section for Image, Video, and Documents */}
                                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Upload Module Assets (Image, Video, Document)
                                    </label>
                                    
                                    <div className="flex flex-wrap gap-2">
                                        <FileUpload
                                            label="Upload Image"
                                            accept="image/*"
                                            onUpload={(url) => addModuleMedia(index, url, 'image')}
                                        />
                                        <FileUpload
                                            label="Upload Video"
                                            accept="video/*"
                                            onUpload={(url) => addModuleMedia(index, url, 'video')}
                                        />
                                        <FileUpload
                                            label="Upload Document"
                                            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip"
                                            onUpload={(url) => addModuleMedia(index, url, 'document')}
                                        />
                                    </div>

                                    {mod.media && mod.media.length > 0 && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                            {mod.media.map(mediaItem => (
                                                <div key={mediaItem.id} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                                    <div className="flex items-center space-x-3 overflow-hidden">
                                                        {mediaItem.type === 'image' && (
                                                            <img src={mediaItem.url} alt={mediaItem.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                                                        )}
                                                        {mediaItem.type === 'video' && (
                                                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                                                                <Video className="w-5 h-5" />
                                                            </div>
                                                        )}
                                                        {mediaItem.type === 'document' && (
                                                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                                                                <FileText className="w-5 h-5" />
                                                            </div>
                                                        )}
                                                        <div className="truncate">
                                                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{mediaItem.name}</p>
                                                            <span className="text-[10px] text-slate-400 uppercase font-semibold">{mediaItem.type}</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeModuleMedia(index, mediaItem.id)}
                                                        className="text-slate-400 hover:text-red-400 p-1.5 transition ml-2 shrink-0"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-semibold flex items-center transition-colors shadow-lg shadow-indigo-500/20"
                    >
                        {loading ? 'Publishing...' : 'Publish Course'} <CheckCircle2 className="w-5 h-5 ml-2" />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CourseUpload;
