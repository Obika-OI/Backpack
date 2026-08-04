import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../store/AppContext";
import { useAuth } from "../../store/AuthContext";
import { Plus, X, UploadCloud, CheckCircle2 } from "lucide-react";

const CourseUpload = () => {
    const navigate = useNavigate();
    const { addCourse, orgMembers, organizations } = useAppContext();
    const { currentUser } = useAuth();
    
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [currency, setCurrency] = useState("NGN");
        const [requirements, setRequirements] = useState("");
    const [applicationProcess, setApplicationProcess] = useState("");
    const [instructorRequirements, setInstructorRequirements] = useState("");
    
    const [selectedOrgId, setSelectedOrgId] = useState("");
    const [loading, setLoading] = useState(false);
    
    const [modules, setModules] = useState([{ id: `m${crypto.randomUUID()}`, title: "", content: "" }]);

    if (!currentUser || (currentUser.role !== 'organization' && currentUser.role !== 'instructor')) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
                <p className="text-slate-400">Only organizations and instructors can create courses.</p>
            </div>
        );
    }

    const myOrgMemberships = orgMembers.filter(m => m.email === currentUser.email);
    const approvedOrgs = currentUser.role === 'instructor' 
        ? organizations.filter(org => myOrgMemberships.some(m => m.orgId === org.id || m.orgId === org.ownerId))
        : [];

    const addModule = () => {
        setModules([...modules, { id: `m${crypto.randomUUID()}`, title: "", content: "" }]);
    };

    const updateModule = (index: number, field: string, value: string) => {
        const newModules = [...modules];
        newModules[index] = { ...newModules[index], [field]: value };
        setModules(newModules);
    };

    const removeModule = (index: number) => {
        setModules(modules.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        
        const orgIdToUse = currentUser.role === 'organization' ? currentUser.id : selectedOrgId;
        if (!orgIdToUse) {
            alert("Please select an organization.");
            return;
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
                                requirements,
                applicationProcess,
                instructorRequirements,
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
            <h1 className="text-3xl font-bold text-white tracking-tight mb-8 flex items-center">
                <UploadCloud className="w-8 h-8 mr-3 text-indigo-400" />
                Upload New Course
            </h1>

            <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in">
                {/* Basic Info */}
                <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 space-y-6">
                    <h2 className="text-xl font-bold text-white mb-4 border-b border-slate-700 pb-4">Basic Information</h2>
                    
                    {currentUser.role === 'instructor' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Organization</label>
                            <select
                                required
                                value={selectedOrgId}
                                onChange={(e) => setSelectedOrgId(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500"
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
                        <label className="block text-sm font-medium text-slate-300 mb-1">Course Title</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500"
                            placeholder="e.g. Introduction to React Native"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                        <textarea
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-4 text-white focus:ring-2 focus:ring-indigo-500 h-32"
                            placeholder="What will students learn in this course?"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Price</label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Currency</label>
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="NGN">NGN</option>
                                <option value="KES">KES</option>
                                <option value="ZAR">ZAR</option>
                                <option value="USD">USD</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Requirements & Settings */}
                <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 space-y-6">
                    <h2 className="text-xl font-bold text-white border-b border-slate-700 pb-4 mb-4">Requirements & Process</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Student Requirements</label>
                            <textarea
                                value={requirements}
                                onChange={(e) => setRequirements(e.target.value)}
                                placeholder="E.g. Basic knowledge of HTML/CSS"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Application Process</label>
                            <textarea
                                value={applicationProcess}
                                onChange={(e) => setApplicationProcess(e.target.value)}
                                placeholder="E.g. Interview -> Code Test -> Admission"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Instructor Requirements</label>
                            <textarea
                                value={instructorRequirements}
                                onChange={(e) => setInstructorRequirements(e.target.value)}
                                placeholder="E.g. 5+ Years Industry Experience"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                            />
                        </div>
                    </div>
                </div>

                {/* Modules */}
                <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-4 mb-4">
                        <h2 className="text-xl font-bold text-white">Course Modules</h2>
                        <button
                            type="button"
                            onClick={addModule}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition flex items-center"
                        >
                            <Plus className="w-4 h-4 mr-1" /> Add Module
                        </button>
                    </div>

                    <div className="space-y-6">
                        {modules.map((mod, index) => (
                            <div key={mod.id} className="bg-slate-900 p-6 rounded-xl border border-slate-700 relative group">
                                {modules.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeModule(index)}
                                        className="absolute top-4 right-4 p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-md transition opacity-0 group-hover:opacity-100"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Module {index + 1} Title</label>
                                        <input
                                            type="text"
                                            required
                                            value={mod.title}
                                            onChange={(e) => updateModule(index, "title", e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500"
                                            placeholder="e.g. Getting Started"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Module Content</label>
                                        <textarea
                                            required
                                            value={mod.content}
                                            onChange={(e) => updateModule(index, "content", e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 h-24 font-mono text-sm"
                                            placeholder="Enter text or markdown content..."
                                        />
                                    </div>
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
