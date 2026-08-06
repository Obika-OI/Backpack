import { useState } from "react";
import { useAppContext } from "../../store/AppContext";
import { useAuth } from "../../store/AuthContext";
import { CheckCircle, XCircle, Clock, BookOpen, TrendingUp, Award, PlayCircle, Eye, CreditCard } from "lucide-react";
import { AnalyticsOverview } from "../components/AnalyticsOverview";
import { StudentReviewModal } from "../components/StudentReviewModal";
import { CoursePaymentModal } from "../components/CoursePaymentModal";
import { EnrollmentRequest } from "../../types";
import { Link } from "react-router-dom";


const Dashboard = () => {
    const { enrollmentRequests, updateEnrollmentRequest, courses, userProgress, orgMembers } = useAppContext();
    const { currentUser } = useAuth();
    const [selectedReviewReq, setSelectedReviewReq] = useState<EnrollmentRequest | null>(null);
    const [paymentModalReq, setPaymentModalReq] = useState<EnrollmentRequest | null>(null);

    if (!currentUser) return <div>Please login.</div>;

    // Student Dashboard Logic
    const studentRequests = enrollmentRequests.filter(r => r.userId === currentUser.id);
    const approvedCoursesIds = studentRequests
        .filter(r => r.status === 'approved' && (courses.find(c => c.id === r.courseId)?.price === 0 || r.paymentStatus === 'paid'))
        .map(r => r.courseId);

    const enrolledCourses = courses.filter(c => approvedCoursesIds.includes(c.id));
    const averageScore = userProgress.filter(p => p.userId === currentUser.id).reduce((acc, curr) => acc + curr.performanceScore, 0) / (userProgress.filter(p => p.userId === currentUser.id).length || 1);

    if (currentUser.role === 'student') {
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">Student Dashboard</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-lg">Welcome back, {currentUser.name}</p>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center space-x-4">
                        <div className="p-3 bg-indigo-500/20 rounded-xl">
                            <BookOpen className="w-8 h-8 text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Enrolled Courses</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{enrolledCourses.length}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center space-x-4">
                        <div className="p-3 bg-emerald-500/20 rounded-xl">
                            <TrendingUp className="w-8 h-8 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Modules Completed</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                {userProgress.filter(p => p.userId === currentUser.id).reduce((acc, curr) => acc + curr.completedModuleIds.length, 0)}
                            </p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center space-x-4">
                        <div className="p-3 bg-amber-500/20 rounded-xl">
                            <Award className="w-8 h-8 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Average Score</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{averageScore.toFixed(0)}%</p>
                        </div>
                    </div>
                </div>

                {/* Applications & Payment Status */}
                {studentRequests.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center justify-between">
                            <span>My Course Applications & Tuition Status</span>
                            <span className="text-xs bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20">
                                {studentRequests.length} {studentRequests.length === 1 ? 'Application' : 'Applications'}
                            </span>
                        </h2>

                        <div className="space-y-3">
                            {studentRequests.map(req => {
                                const reqCourse = courses.find(c => c.id === req.courseId);
                                const isFree = !reqCourse || reqCourse.price === 0;
                                const isPaid = req.paymentStatus === 'paid';

                                return (
                                    <div key={req.id} className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <h3 className="font-bold text-slate-900 dark:text-white">{req.courseTitle || reqCourse?.title || "Course Application"}</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center flex-wrap gap-2">
                                                <span>Terms: <strong className="text-slate-700 dark:text-slate-300">{req.paymentMethod === 'installment' ? 'Installments' : 'Pay in Full'}</strong></span>
                                                {reqCourse && <span className="font-bold text-indigo-500 dark:text-indigo-400">({reqCourse.currency} {reqCourse.price.toLocaleString()})</span>}
                                            </p>
                                        </div>

                                        <div className="flex items-center space-x-3">
                                            {req.status === 'pending' && (
                                                <span className="px-3 py-1.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg text-xs font-bold flex items-center">
                                                    <Clock className="w-3.5 h-3.5 mr-1.5" /> Application Under Review (No Payment Due Yet)
                                                </span>
                                            )}

                                            {req.status === 'rejected' && (
                                                <span className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-bold flex items-center">
                                                    <XCircle className="w-3.5 h-3.5 mr-1.5" /> Application Declined
                                                </span>
                                            )}

                                            {req.status === 'approved' && (
                                                isFree || isPaid ? (
                                                    <div className="flex items-center space-x-2">
                                                        <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-bold flex items-center">
                                                            <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Accepted & Enrolled
                                                        </span>
                                                        <Link to={`/course/${req.courseId}`} className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition">
                                                            Go to Course
                                                        </Link>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center space-x-2">
                                                        <span className="px-3 py-1.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg text-xs font-bold flex items-center">
                                                            <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Accepted (Tuition Due)
                                                        </span>
                                                        <button
                                                            onClick={() => setPaymentModalReq(req)}
                                                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center shadow-lg shadow-emerald-600/20"
                                                        >
                                                            <CreditCard className="w-3.5 h-3.5 mr-1.5" /> Pay Tuition
                                                        </button>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Enrolled Courses */}
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">My Enrolled Courses</h2>
                    {enrolledCourses.length === 0 ? (
                        <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-700 border-dashed">
                            <p className="text-slate-500 dark:text-slate-400 mb-4">
                                {studentRequests.length > 0 
                                    ? "Your applications are being processed or awaiting tuition payment." 
                                    : "You haven't applied for any courses yet."}
                            </p>
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
                                    <div key={course.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 hover:border-slate-300 dark:border-slate-600 transition-colors group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-indigo-400 transition-colors"><Link to={`/course/${course.id}`}>{course.title}</Link></h3>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">{course.modules.length} Modules</p>
                                            </div>
                                            {percent >= 100 && <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full flex items-center"><Award className="w-3 h-3 mr-1"/> Completed</span>}
                                        </div>
                                        <div className="w-full bg-slate-50 dark:bg-slate-900 rounded-full h-2.5 mb-4 border border-slate-200 dark:border-slate-700/50">
                                            <div className="bg-indigo-500 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${Math.min(percent, 100)}%` }}></div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">{Math.min(percent, 100).toFixed(0)}% Complete</span>
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

                {paymentModalReq && courses.find(c => c.id === paymentModalReq.courseId) && (
                    <CoursePaymentModal
                        course={courses.find(c => c.id === paymentModalReq.courseId)!}
                        request={paymentModalReq}
                        onClose={() => setPaymentModalReq(null)}
                        onPaymentSuccess={async () => {
                            await updateEnrollmentRequest(paymentModalReq.id, undefined, 'paid');
                            setPaymentModalReq(null);
                        }}
                    />
                )}
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

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
                        {currentUser.role === 'organization' ? 'Organization Dashboard' : 'Instructor Dashboard'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg">Manage your students and courses.</p>
                </div>
            </div>

            {currentUser.role === 'organization' && (
                <AnalyticsOverview courses={myCourses} progressData={userProgress} enrollmentRequests={enrollmentRequests} />
            )}

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                            <Clock className="w-5 h-5 mr-2 text-indigo-400" />
                            Enrollment Applications & Review
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Review submitted student documents and application details before approving or rejecting enrollment.
                        </p>
                    </div>
                    <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-sm font-semibold rounded-full shrink-0">
                        {orgRequests.filter(r => r.status === 'pending').length} Pending
                    </span>
                </div>
                
                {orgRequests.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">No student enrollment requests yet.</div>
                ) : (
                    <div className="divide-y divide-slate-700/50">
                        {orgRequests.map(req => {
                            return (
                                <div key={req.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                                    <div>
                                        <div className="flex items-center space-x-3 mb-1">
                                            <p className="font-semibold text-slate-900 dark:text-white">{req.userName}</p>
                                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                                req.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                                                req.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                                                'bg-red-500/20 text-red-400'
                                            }`}>
                                                {req.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            Requested access to <span className="text-slate-800 dark:text-slate-200 font-semibold">{req.courseTitle}</span>
                                            {req.paymentMethod && (
                                                <span className="ml-2 text-xs text-indigo-400 font-medium">({req.paymentMethod === 'installment' ? 'Installments' : 'Paid in Full'})</span>
                                            )}
                                        </p>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => setSelectedReviewReq(req)}
                                            className="px-3.5 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-500 dark:text-indigo-400 rounded-lg text-xs font-bold transition flex items-center"
                                        >
                                            <Eye className="w-4 h-4 mr-1.5" /> Review Application
                                        </button>
                                        
                                        {req.status === 'pending' && (
                                            <>
                                                <button 
                                                    onClick={() => updateEnrollmentRequest(req.id, 'approved')}
                                                    className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors"
                                                    title="Quick Approve"
                                                >
                                                    <CheckCircle className="w-5 h-5" />
                                                </button>
                                                <button 
                                                    onClick={() => updateEnrollmentRequest(req.id, 'rejected')}
                                                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                                    title="Quick Reject"
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                 <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">My Courses</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {myCourses.map(course => (
                         <div key={course.id} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 rounded-xl">
                            <h3 className="font-bold text-slate-900 dark:text-white">{course.title}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{course.modules.length} Modules</p>
                            <Link to={`/course/${course.id}`} className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">View Classroom &rarr;</Link>
                         </div>
                     ))}
                 </div>
            </div>

            {selectedReviewReq && (
                <StudentReviewModal
                    request={selectedReviewReq}
                    course={courses.find(c => c.id === selectedReviewReq.courseId)}
                    onClose={() => setSelectedReviewReq(null)}
                    onApprove={(id) => updateEnrollmentRequest(id, 'approved')}
                    onReject={(id) => updateEnrollmentRequest(id, 'rejected')}
                />
            )}
        </div>
    );
};

export default Dashboard;
