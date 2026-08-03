import { useAppContext } from "../../store/AppContext";
import { useAuth } from "../../store/AuthContext";
import { CheckCircle, XCircle, Clock, BookOpen, TrendingUp, Users, Award, PlayCircle } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
    const { enrollmentRequests, updateEnrollmentRequest, orgJoinRequests, updateOrgJoinRequest, courses, userProgress, orgMembers } = useAppContext();
    const { currentUser } = useAuth();

    if (!currentUser) return <div>Please login.</div>;

    // Student Dashboard Logic
    const studentRequests = enrollmentRequests.filter(r => r.userId === currentUser.id);
    const approvedCoursesIds = studentRequests.filter(r => r.status === 'approved').map(r => r.courseId);
    const enrolledCourses = courses.filter(c => approvedCoursesIds.includes(c.id));
    const averageScore = userProgress.filter(p => p.userId === currentUser.id).reduce((acc, curr) => acc + curr.performanceScore, 0) / (userProgress.filter(p => p.userId === currentUser.id).length || 1);

    if (currentUser.role === 'student') {
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Student Dashboard</h1>
                        <p className="text-slate-400 text-lg">Welcome back, {currentUser.name}</p>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex items-center space-x-4">
                        <div className="p-3 bg-indigo-500/20 rounded-xl">
                            <BookOpen className="w-8 h-8 text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400 font-medium">Enrolled Courses</p>
                            <p className="text-2xl font-bold text-white">{enrolledCourses.length}</p>
                        </div>
                    </div>
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex items-center space-x-4">
                        <div className="p-3 bg-emerald-500/20 rounded-xl">
                            <TrendingUp className="w-8 h-8 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400 font-medium">Modules Completed</p>
                            <p className="text-2xl font-bold text-white">
                                {userProgress.filter(p => p.userId === currentUser.id).reduce((acc, curr) => acc + curr.completedModuleIds.length, 0)}
                            </p>
                        </div>
                    </div>
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex items-center space-x-4">
                        <div className="p-3 bg-amber-500/20 rounded-xl">
                            <Award className="w-8 h-8 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400 font-medium">Average Score</p>
                            <p className="text-2xl font-bold text-white">{averageScore.toFixed(0)}%</p>
                        </div>
                    </div>
                </div>

                {/* Enrolled Courses */}
                <div>
                    <h2 className="text-xl font-bold text-white mb-4">My Learning Path</h2>
                    {enrolledCourses.length === 0 ? (
                        <div className="bg-slate-800/50 rounded-2xl p-8 text-center border border-slate-700 border-dashed">
                            <p className="text-slate-400 mb-4">You haven't enrolled in any courses yet.</p>
                            <Link to="/explore" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition inline-flex items-center">
                                Explore Organizations <BookOpen className="w-4 h-4 ml-2" />
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {enrolledCourses.map(course => {
                                const progress = userProgress.find(p => p.courseId === course.id && p.userId === currentUser.id);
                                const completedCount = progress?.completedModuleIds.length || 0;
                                const percent = course.modules.length > 0 ? (completedCount / course.modules.length) * 100 : 0;
                                
                                return (
                                    <div key={course.id} className="bg-slate-800 rounded-2xl border border-slate-700 p-6 hover:border-slate-600 transition-colors group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-bold text-lg text-white group-hover:text-indigo-400 transition-colors"><Link to={`/course/${course.id}`}>{course.title}</Link></h3>
                                                <p className="text-sm text-slate-400">{course.modules.length} Modules</p>
                                            </div>
                                            {percent >= 100 && <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full flex items-center"><Award className="w-3 h-3 mr-1"/> Completed</span>}
                                        </div>
                                        <div className="w-full bg-slate-900 rounded-full h-2.5 mb-4 border border-slate-700/50">
                                            <div className="bg-indigo-500 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${Math.min(percent, 100)}%` }}></div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-slate-300 font-medium">{Math.min(percent, 100).toFixed(0)}% Complete</span>
                                            {percent < 100 ? (
                                                <Link
                                                    to={`/course/${course.id}`}
                                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition flex items-center"
                                                >
                                                    <PlayCircle className="w-4 h-4 mr-2" /> Resume
                                                </Link>
                                            ) : (
                                                <span className="text-emerald-400 text-sm font-medium flex items-center">
                                                    Mastered <CheckCircle className="w-4 h-4 ml-1" />
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Organization/Instructor Dashboard Logic
    const myOrgMemberRecords = orgMembers.filter(m => m.email === currentUser.email);
    let assignedCourseIds: string[] = [];
    myOrgMemberRecords.forEach(record => {
        if (record.courseIds) {
            assignedCourseIds = [...assignedCourseIds, ...record.courseIds];
        }
    });

    const myCourses = currentUser.role === 'organization' 
        ? courses.filter(c => c.orgId === currentUser.id || c.orgId === `org_${currentUser.id}`)
        : courses.filter(c => assignedCourseIds.includes(c.id));
        
    const orgRequests = currentUser.role === 'organization'
        ? enrollmentRequests.filter(r => r.orgId === currentUser.id || r.orgId === `org_${currentUser.id}`)
        : enrollmentRequests.filter(r => assignedCourseIds.includes(r.courseId));
        
    const myOrgJoinRequests = orgJoinRequests.filter(r => r.orgId === currentUser.id);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
                        {currentUser.role === 'organization' ? 'Organization Dashboard' : 'Instructor Dashboard'}
                    </h1>
                    <p className="text-slate-400 text-lg">Manage your students and courses.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Quick Stats */}
                 <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex items-center space-x-4">
                    <div className="p-3 bg-indigo-500/20 rounded-xl">
                        <BookOpen className="w-8 h-8 text-indigo-400" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-400 font-medium">Active Courses</p>
                        <p className="text-2xl font-bold text-white">{myCourses.length}</p>
                    </div>
                </div>
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex items-center space-x-4">
                    <div className="p-3 bg-emerald-500/20 rounded-xl">
                        <Users className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-400 font-medium">Total Enrollments</p>
                        <p className="text-2xl font-bold text-white">{orgRequests.filter(r => r.status === 'approved').length}</p>
                    </div>
                </div>
            </div>

            {currentUser.role === 'organization' && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white flex items-center">
                            <Users className="w-5 h-5 mr-2 text-indigo-400" />
                            Instructor Requests
                        </h2>
                        <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-sm font-semibold rounded-full">
                            {myOrgJoinRequests.filter(r => r.status === 'pending').length} Pending
                        </span>
                    </div>
                    
                    {myOrgJoinRequests.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">No instructor requests yet.</div>
                    ) : (
                        <div className="divide-y divide-slate-700/50">
                            {myOrgJoinRequests.map(req => (
                                <div key={req.id} className="p-6 flex items-center justify-between hover:bg-slate-700/20 transition-colors">
                                    <div>
                                        <div className="flex items-center space-x-3 mb-1">
                                            <p className="font-semibold text-white">{req.userName}</p>
                                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                                req.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                                                req.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                                                'bg-red-500/20 text-red-400'
                                            }`}>
                                                {req.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-400">Requested to teach at <span className="text-slate-300 font-medium">{req.orgName}</span></p>
                                    </div>
                                    
                                    {req.status === 'pending' && (
                                        <div className="flex space-x-2">
                                            <button 
                                                onClick={() => updateOrgJoinRequest(req.id, 'approved')}
                                                className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors"
                                                title="Approve"
                                            >
                                                <CheckCircle className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={() => updateOrgJoinRequest(req.id, 'rejected')}
                                                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                                title="Reject"
                                            >
                                                <XCircle className="w-5 h-5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex items-center">
                        <Clock className="w-5 h-5 mr-2 text-indigo-400" />
                        Enrollment Requests
                    </h2>
                    <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-sm font-semibold rounded-full">
                        {orgRequests.filter(r => r.status === 'pending').length} Pending
                    </span>
                </div>
                
                {orgRequests.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">No enrollment requests yet.</div>
                ) : (
                    <div className="divide-y divide-slate-700/50">
                        {orgRequests.map(req => (
                            <div key={req.id} className="p-6 flex items-center justify-between hover:bg-slate-700/20 transition-colors">
                                <div>
                                    <div className="flex items-center space-x-3 mb-1">
                                        <p className="font-semibold text-white">{req.userName}</p>
                                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                            req.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                                            req.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                                            'bg-red-500/20 text-red-400'
                                        }`}>
                                            {req.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-400">Requested access to <span className="text-slate-300 font-medium">{req.courseTitle}</span></p>
                                </div>
                                
                                {req.status === 'pending' && (
                                    <div className="flex space-x-2">
                                        <button 
                                            onClick={() => updateEnrollmentRequest(req.id, 'approved')}
                                            className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors"
                                            title="Approve"
                                        >
                                            <CheckCircle className="w-5 h-5" />
                                        </button>
                                        <button 
                                            onClick={() => updateEnrollmentRequest(req.id, 'rejected')}
                                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                            title="Reject"
                                        >
                                            <XCircle className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
                 <h2 className="text-xl font-bold text-white mb-4">My Courses</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {myCourses.map(course => (
                         <div key={course.id} className="bg-slate-900 border border-slate-700 p-4 rounded-xl">
                            <h3 className="font-bold text-white">{course.title}</h3>
                            <p className="text-sm text-slate-400 mb-4">{course.modules.length} Modules</p>
                            <Link to={`/course/${course.id}`} className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">View Classroom &rarr;</Link>
                         </div>
                     ))}
                 </div>
            </div>
        </div>
    );
};

export default Dashboard;
