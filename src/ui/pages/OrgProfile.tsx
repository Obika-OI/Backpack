import { useParams, Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../../store/AppContext";
import { useAuth } from "../../store/AuthContext";
import { Building, MapPin, DollarSign, BookOpen, Send, ShieldCheck, ArrowLeft } from "lucide-react";
import { useState } from "react";

export const OrgProfile = () => {
    const { orgId } = useParams();
    const navigate = useNavigate();
    const { organizations, courses, enrollmentRequests, addEnrollmentRequest } = useAppContext();
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState<string | null>(null);

    const org = organizations.find(o => o.id === orgId);
    
    if (!org) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Building className="w-16 h-16 mb-4 text-slate-600" />
                <h2 className="text-2xl font-bold text-white mb-2">Organization Not Found</h2>
                <p>The organization you are looking for does not exist or has been removed.</p>
                <button onClick={() => navigate('/explore')} className="mt-6 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition">
                    Browse Organizations
                </button>
            </div>
        );
    }

    const orgCourses = courses.filter(c => c.orgId === org.id || c.orgId === org.ownerId);

    const handleEnroll = async (courseId: string, courseTitle: string) => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        setLoading(courseId);
        try {
            const reqId = `req_${crypto.randomUUID()}`;
            await addEnrollmentRequest({
                id: reqId,
                userId: currentUser.id,
                userName: currentUser.name,
                orgId: org.id,
                courseId,
                courseTitle,
                status: 'pending'
            });
        } finally {
            setLoading(null);
        }
    };

    const getRequestStatus = (courseId: string) => {
        if (!currentUser) return null;
        const req = enrollmentRequests.find(r => r.userId === currentUser.id && r.courseId === courseId);
        return req?.status;
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-12">
            <Link to="/explore" className="inline-flex items-center text-sm font-medium text-slate-400 hover:text-white transition">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Explore
            </Link>

            {/* Profile Header */}
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-900/50 to-transparent"></div>
                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-24 h-24 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-900/50 transform rotate-3">
                        <Building className="w-12 h-12 text-white -rotate-3" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">{org.name}</h1>
                    <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-6">{org.description}</p>
                    <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-semibold text-slate-400">
                        <span className="flex items-center px-4 py-2 bg-slate-800 rounded-full border border-slate-700">
                            <MapPin className="w-4 h-4 mr-2 text-indigo-400" /> {org.location}
                        </span>
                        <span className="flex items-center px-4 py-2 bg-slate-800 rounded-full border border-slate-700">
                            <DollarSign className="w-4 h-4 mr-1 text-emerald-400" /> Accepts {org.baseCurrency}
                        </span>
                    </div>
                </div>
            </div>

            {/* Course Offerings */}
            <div>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                    <BookOpen className="w-6 h-6 mr-3 text-indigo-400" /> Available Courses
                </h2>
                
                {orgCourses.length === 0 ? (
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
                        <p className="text-slate-400 text-lg">This organization hasn't published any courses yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {orgCourses.map(course => {
                            const status = getRequestStatus(course.id);
                            return (
                                <div key={course.id} className="bg-slate-900 border border-slate-700 hover:border-indigo-500/50 p-6 rounded-2xl transition group flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-bold text-xl text-white mb-2 group-hover:text-indigo-400 transition">{course.title}</h3>
                                        <p className="text-slate-400 text-sm mb-4 line-clamp-3">{course.description}</p>
                                        
                                        {(course.requirements || course.applicationProcess) && (
                                            <div className="mb-6 space-y-2">
                                                {course.requirements && (
                                                    <div className="text-xs bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
                                                        <span className="font-semibold text-slate-300 block mb-1">Requirements:</span>
                                                        <span className="text-slate-400 line-clamp-2">{course.requirements}</span>
                                                    </div>
                                                )}
                                                {course.applicationProcess && (
                                                    <div className="text-xs bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
                                                        <span className="font-semibold text-slate-300 block mb-1">Process:</span>
                                                        <span className="text-slate-400 line-clamp-2">{course.applicationProcess}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="pt-4 border-t border-slate-800 flex flex-col justify-between space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-lg text-white">
                                                {course.price > 0 ? `${course.currency} ${course.price}` : "Free"}
                                            </span>
                                            {course.paymentTerms === 'installment' && (
                                                <span className="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-full border border-indigo-500/20">
                                                    Installments
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex justify-end">
                                            {status === 'approved' ? (
                                                <span className="text-emerald-400 text-sm font-bold flex items-center bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                                                    <ShieldCheck className="w-4 h-4 mr-2" /> Enrolled
                                                </span>
                                            ) : status === 'pending' ? (
                                                <span className="text-amber-400 text-sm font-bold px-3 py-1.5 bg-amber-500/10 rounded-lg border border-amber-500/20">Pending Review</span>
                                            ) : (
                                                <button 
                                                    onClick={() => handleEnroll(course.id, course.title)}
                                                    disabled={loading === course.id}
                                                    className="w-full justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition flex items-center"
                                                >
                                                    {loading === course.id ? 'Requesting...' : 'Enroll Now'} <Send className="w-4 h-4 ml-2" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
