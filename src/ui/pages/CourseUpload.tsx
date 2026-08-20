import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAppContext } from "../../store/AppContext";
import { useAuth } from "../../store/AuthContext";
import { CourseModule } from "../../types";
import { FileUpload } from "../components/FileUpload";
import { KnowledgeCityBanner } from "../components/KnowledgeCityBanner";
import { generateId } from "../../lib/id";
import {
    Plus, X, UploadCloud, CheckCircle2, FileText,
    Video, CheckSquare, Square, Building2, ShieldAlert, ArrowRight
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

    const [requiredDocList, setRequiredDocList] = useState<string[]>([
        "Government ID / Passport",
        "Previous Academic Certificate",
        "Curriculum Vitae (CV)"
    ]);
    const [newDocName, setNewDocName] = useState("");

    const [qualificationTitle, setQualificationTitle] = useState("");
    const [qualificationType, setQualificationType] = useState<'bachelors' | 'masters' | 'doctorate' | 'diploma' | 'certificate' | 'professional' | 'other'>('certificate');

    const [selectedOrgId, setSelectedOrgId] = useState("");
    const [loading, setLoading] = useState(false);

    // Admission Session & Intake Controls
    const [initialAdmissionStatus, setInitialAdmissionStatus] = useState<'open' | 'closed'>('open');
    const [sessionName, setSessionName] = useState(() => {
        const year = new Date().getFullYear();
        return `${year}/${year + 1} Academic Session`;
    });
    const [applicationDeadline, setApplicationDeadline] = useState("");

    const [modules, setModules] = useState<CourseModule[]>(() => [
        { id: generateId('mod'), title: "", content: "", media: [] }
    ]);

    if (!currentUser || (currentUser.role !== 'organization' && currentUser.role !== 'instructor')) {
        return (
            <div className="max-w-2xl mx-auto py-16 text-center space-y-6">
                <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/20">
                    <ShieldAlert className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Individual Uploads Restricted</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
                    Backpack is an institutional learning platform. Only verified partner organizations and affiliated instructors with organizational permission can upload courses.
                </p>
                <KnowledgeCityBanner variant="instructor" />
            </div>
        );
    }

    // Check organization permissions for instructors
    const myOrgMemberships = orgMembers.filter(m => m.email === currentUser.email && (m.status === 'active' || !m.status));
    const approvedOrgs = currentUser.role === 'instructor'
        ? organizations.filter(org => myOrgMemberships.some(m => m.orgId === org.id || m.orgId === org.ownerId))
        : [];

    // If an instructor is logged in but has NO affiliated organization with permission, block individual upload
    if (currentUser.role === 'instructor' && approvedOrgs.length === 0) {
        return (
            <div className="max-w-3xl mx-auto py-10 space-y-8 animate-in fade-in">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 text-center space-y-5 shadow-sm">
                    <div className="w-16 h-16 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto border border-indigo-500/20">
                        <Building2 className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Organizational Permission Required
                        </h2>
                        <p className="text-slate-600 dark:text-slate-300 text-sm max-w-lg mx-auto leading-relaxed">
                            On Backpack, instructors <strong>cannot upload courses as individuals</strong>. All courses must be published under an authorized partner organization where you have active instructor membership and permission.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                        <Link
                            to="/explore"
                            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2"
                        >
                            <span>Explore & Join Organizations</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link
                            to="/onboard"
                            className="w-full sm:w-auto px-6 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition"
                        >
                            <span>Register Your Organization</span>
                        </Link>
                    </div>
                </div>

                {/* Redirect to Knowledge City for individual / freelance instructors */}
                <KnowledgeCityBanner variant="instructor" />
            </div>
        );
    }

    const addModule = () => {
        setModules([...modules, { id: generateId('mod'), title: "", content: "", media: [] }]);
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
            media: [...currentMedia, { id: generateId('med'), name: mediaName, url, type: fileType }]
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

    const handleAddRequiredDoc = () => {
        if (!newDocName.trim()) return;
        if (!requiredDocList.includes(newDocName.trim())) {
            setRequiredDocList([...requiredDocList, newDocName.trim()]);
        }
        setNewDocName("");
    };

    const handleRemoveRequiredDoc = (docToRemove: string) => {
        setRequiredDocList(requiredDocList.filter(d => d !== docToRemove));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        const orgIdToUse = currentUser.role === 'organization' ? currentUser.id : selectedOrgId;
        if (!orgIdToUse) {
            alert("Please select the authorized partner organization sponsoring this course.");
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

        const initialSessionId = generateId('ses');
        const effectiveSessionName = sessionName.trim() || `${new Date().getFullYear()}/${new Date().getFullYear() + 1} Academic Session`;
        const initialSession = {
            id: initialSessionId,
            name: effectiveSessionName,
            status: initialAdmissionStatus,
            startDate: new Date().toISOString().split('T')[0],
            applicationDeadline: applicationDeadline || undefined,
            createdAt: new Date().toISOString()
        };

        try {
            await addCourse({
                id: generateId('c'),
                orgId: orgIdToUse,
                title,
                description,
                price: Number(price) || 0,
                currency,
                paymentTermsAllowed,
                installmentInterval: allowInstallments ? installmentInterval : undefined,
                qualificationTitle: qualificationTitle.trim() || undefined,
                qualificationType,
                instructorName: currentUser.role === 'instructor' ? currentUser.name : undefined,
                instructorId: currentUser.role === 'instructor' ? currentUser.id : undefined,
                admissionStatus: initialAdmissionStatus,
                activeSessionId: initialSessionId,
                activeSessionName: effectiveSessionName,
                admissionSessions: [initialSession],
                requirements: studentReqList.join('\n'),
                requiredDocuments: requiredDocList,
                modules
            });
            navigate("/dashboard");
        } catch (err) {
            console.error("Failed to upload course", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-8 space-y-8 animate-in fade-in">
            {/* Knowledge City notice for freelance creators (instructor only) */}
            {currentUser?.role === 'instructor' && (
                <KnowledgeCityBanner variant="instructor" />
            )}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center">
                        <UploadCloud className="w-8 h-8 mr-3 text-indigo-500" />
                        Create Institutional Course
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        {currentUser.role === 'organization'
                            ? "Publish an accredited curriculum for your organization."
                            : "Publish a course under your verified organization's sponsorship."}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Info */}
                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-6 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-3">
                        Institutional Sponsorship & Course Overview
                    </h2>

                    {currentUser.role === 'instructor' && (
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                                Sponsoring Organization <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                value={selectedOrgId}
                                onChange={(e) => setSelectedOrgId(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                            >
                                <option value="" disabled>Select an approved organization with instructor permission</option>
                                {approvedOrgs.map(org => (
                                    <option key={org.id} value={org.id}>{org.name}</option>
                                ))}
                            </select>
                            <p className="text-xs text-slate-400 mt-1">
                                Instructors can only publish courses under authorized partner organizations.
                            </p>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                            Course Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Master of Software Architecture"
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                            Course Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Detailed overview of the curriculum and learning outcomes..."
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 h-28 text-sm leading-relaxed"
                        />
                    </div>

                    {/* Degree & Qualification */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                                Awarded Qualification Type
                            </label>
                            <select
                                value={qualificationType}
                                onChange={(e) => setQualificationType(e.target.value as 'bachelors' | 'masters' | 'doctorate' | 'diploma' | 'certificate' | 'professional' | 'other')}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
                            >
                                <option value="certificate">Professional Certificate</option>
                                <option value="diploma">Diploma</option>
                                <option value="bachelors">Bachelor's Degree (Higher Ed)</option>
                                <option value="masters">Master's Degree (Higher Ed)</option>
                                <option value="doctorate">Doctorate (Higher Ed)</option>
                                <option value="professional">Professional License</option>
                                <option value="other">Other Credential</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                                Qualification Title (Optional)
                            </label>
                            <input
                                type="text"
                                value={qualificationTitle}
                                onChange={(e) => setQualificationTitle(e.target.value)}
                                placeholder="e.g. Certified Cloud Practitioner"
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
                            />
                        </div>
                    </div>

                    {/* Tuition & Terms */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                                Tuition Fee (0 for Free) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="0"
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                                Currency
                            </label>
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
                            >
                                <option value="NGN">NGN (Nigerian Naira)</option>
                                <option value="GHS">GHS (Ghanaian Cedi)</option>
                                <option value="KES">KES (Kenyan Shilling)</option>
                                <option value="ZAR">ZAR (South African Rand)</option>
                                <option value="USD">USD (US Dollar)</option>
                            </select>
                        </div>
                    </div>

                    {/* Payment Terms Tick Boxes */}
                    {Number(price) > 0 && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                Permitted Payment Options (Select One or Both)
                            </label>
                            <div className="flex flex-wrap gap-4">
                                <button
                                    type="button"
                                    onClick={() => setAllowPayInFull(!allowPayInFull)}
                                    className="flex items-center space-x-2 text-xs font-semibold text-slate-800 dark:text-slate-200"
                                >
                                    {allowPayInFull ? <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> : <Square className="w-4 h-4 text-slate-400" />}
                                    <span>Allow Full Payment</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAllowInstallments(!allowInstallments)}
                                    className="flex items-center space-x-2 text-xs font-semibold text-slate-800 dark:text-slate-200"
                                >
                                    {allowInstallments ? <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> : <Square className="w-4 h-4 text-slate-400" />}
                                    <span>Allow 3-Split Installments</span>
                                </button>
                            </div>
                            {allowInstallments && (
                                <div className="pt-2 flex items-center gap-3">
                                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                        Installment Billing Interval:
                                    </label>
                                    <select
                                        value={installmentInterval}
                                        onChange={(e) => setInstallmentInterval(e.target.value as 'weekly' | 'monthly' | 'custom')}
                                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="monthly">Monthly (Every 30 days)</option>
                                        <option value="weekly">Weekly (Every 7 days)</option>
                                        <option value="custom">Flexible / Milestone Based</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Requirements & Required Documents Configuration */}
                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-6 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-3 flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-indigo-500" />
                        Application Requirements & Document Checklist
                    </h2>

                    {/* Required Documents from Students */}
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                Required Documents for Admission Review
                            </label>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Students must upload these documents when applying for organization review.
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newDocName}
                                onChange={(e) => setNewDocName(e.target.value)}
                                placeholder="e.g. High School Transcript, National ID"
                                className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                                type="button"
                                onClick={handleAddRequiredDoc}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add Document Requirement</span>
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                            {requiredDocList.map((doc) => (
                                <span
                                    key={doc}
                                    className="inline-flex items-center px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold"
                                >
                                    <span>{doc}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveRequiredDoc(doc)}
                                        className="ml-2 text-indigo-400 hover:text-red-500 transition"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Criteria & Guidelines */}
                    <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Student Eligibility Criteria
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newStudentReq}
                                onChange={(e) => setNewStudentReq(e.target.value)}
                                placeholder="e.g. Basic understanding of JavaScript, Grade 12 completion"
                                className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                                type="button"
                                onClick={handleAddStudentReq}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add Criteria</span>
                            </button>
                        </div>

                        {studentReqList.length > 0 && (
                            <ul className="space-y-1.5 pt-1">
                                {studentReqList.map((req, idx) => (
                                    <li key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200">
                                        <span>• {req}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveStudentReq(idx)}
                                            className="text-slate-400 hover:text-red-500 transition p-1"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Admission Intake Session Configuration */}
                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-6 shadow-sm">
                    <div className="border-b border-slate-200 dark:border-slate-700 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                            <span className={`w-2.5 h-2.5 rounded-full mr-2.5 ${initialAdmissionStatus === 'open' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                            Admission Intake Session & Enrollment Controls
                        </h2>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold w-fit ${
                            initialAdmissionStatus === 'open' 
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                                : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                        }`}>
                            {initialAdmissionStatus === 'open' ? 'ADMISSION OPENS ON PUBLISH' : 'ADMISSION CLOSED INITIALLY'}
                        </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Backpack organises student applications into admission intake sessions. You can open and close admissions anytime from your dashboard, and launch new sessions so rejected applicants can reapply.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                                Initial Intake Session Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={sessionName}
                                onChange={(e) => setSessionName(e.target.value)}
                                placeholder="e.g. 2026/2027 Session, Spring 2026 Cohort"
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                                Application Deadline (Optional)
                            </label>
                            <input
                                type="date"
                                value={applicationDeadline}
                                onChange={(e) => setApplicationDeadline(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
                            />
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">
                                Initial Admission Status
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                {initialAdmissionStatus === 'open' 
                                    ? 'Students can apply immediately upon publishing this course.' 
                                    : 'Course will be visible but admissions will remain closed until opened.'}
                            </span>
                        </div>
                        <div className="flex items-center space-x-2 shrink-0">
                            <button
                                type="button"
                                onClick={() => setInitialAdmissionStatus('open')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                                    initialAdmissionStatus === 'open'
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                }`}
                            >
                                Open
                            </button>
                            <button
                                type="button"
                                onClick={() => setInitialAdmissionStatus('closed')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                                    initialAdmissionStatus === 'closed'
                                        ? 'bg-red-600 text-white shadow-sm'
                                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                }`}
                            >
                                Closed
                            </button>
                        </div>
                    </div>
                </div>

                {/* Course Modules */}
                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Curriculum Modules</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Upload module text, lecture materials, images, and videos.</p>
                        </div>
                        <button
                            type="button"
                            onClick={addModule}
                            className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-xl text-xs font-bold transition flex items-center border border-indigo-200 dark:border-indigo-800"
                        >
                            <Plus className="w-3.5 h-3.5 mr-1" /> Add Module
                        </button>
                    </div>

                    <div className="space-y-5">
                        {modules.map((mod, index) => (
                            <div key={mod.id} className="bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 relative group">
                                {modules.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeModule(index)}
                                        className="absolute top-4 right-4 p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Module {index + 1} Title
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={mod.title}
                                        onChange={(e) => updateModule(index, "title", e.target.value)}
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-xs"
                                        placeholder="e.g. Introduction to Cloud Fundamentals"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Module Content (Markdown or Text)
                                    </label>
                                    <textarea
                                        required
                                        value={mod.content}
                                        onChange={(e) => updateModule(index, "content", e.target.value)}
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 h-24 text-xs font-mono"
                                        placeholder="Enter lesson contents, reading notes, and assignments..."
                                    />
                                </div>

                                {/* Media upload */}
                                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Module Media & Attachments
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
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                                            {mod.media.map(mediaItem => (
                                                <div key={mediaItem.id} className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                                    <div className="flex items-center space-x-2 truncate">
                                                        {mediaItem.type === 'image' && <img src={mediaItem.url} alt={mediaItem.name} className="w-8 h-8 rounded object-cover shrink-0" />}
                                                        {mediaItem.type === 'video' && <Video className="w-4 h-4 text-purple-500 shrink-0" />}
                                                        {mediaItem.type === 'document' && <FileText className="w-4 h-4 text-blue-500 shrink-0" />}
                                                        <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">{mediaItem.name}</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeModuleMedia(index, mediaItem.id)}
                                                        className="text-slate-400 hover:text-red-500 p-1"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
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

                <div className="flex justify-end pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl font-bold flex items-center transition shadow-lg shadow-indigo-600/25 text-sm"
                    >
                        {loading ? 'Publishing Course...' : 'Publish Institutional Course'} <CheckCircle2 className="w-5 h-5 ml-2" />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CourseUpload;
