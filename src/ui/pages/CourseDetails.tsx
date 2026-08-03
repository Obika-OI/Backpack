import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAppContext } from "../../store/AppContext";
import { useAuth } from "../../store/AuthContext";
import { Book, MessageSquare, FileText, CheckCircle, Send, Upload, Paperclip, Coffee, Users, Award, Calendar, Video, Info } from "lucide-react";
import { ChatMessage } from "../../types";
import { LunchGames } from "../components/LunchGames";
import { CourseAssessments } from "../components/CourseAssessments";
import { CourseSchedule } from "../components/CourseSchedule";
import { OrgUserOnboarding } from "../components/OrgUserOnboarding";

const CourseDetails = () => {
    const { courseId } = useParams();
    const { courses, updateCourse, userProgress, updateProgress, materials, addMaterial, sendMessage, enrollmentRequests, orgMembers } = useAppContext();
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState<'info' | 'modules' | 'materials' | 'chat' | 'lunch' | 'people' | 'assessments' | 'schedule'>('info');
    
    // Chat state
    const [chatMsg, setChatMsg] = useState("");
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    
    // Materials state
    const [newMatTitle, setNewMatTitle] = useState("");
    const [newMatUrl, setNewMatUrl] = useState("");

    // Module edit state
    const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
    const [editModuleTitle, setEditModuleTitle] = useState("");
    const [editModuleContent, setEditModuleContent] = useState("");
    const [isAddingModule, setIsAddingModule] = useState(false);

    const course = courses.find(c => c.id === courseId);
    const progress = userProgress.find(p => p.courseId === courseId && p.userId === currentUser?.id);
    const courseMaterials = materials.filter(m => m.courseId === courseId);
    
    // Access check logic
    const isStudent = currentUser?.role === 'student';
    const isOrganization = currentUser?.role === 'organization';

    const myOrgMemberRecords = orgMembers.filter(m => m.email === currentUser?.email);
    const onboardedCourseIds = myOrgMemberRecords.flatMap(m => m.courseIds || []);
    
    const hasStudentAccess = enrollmentRequests.some(r => r.userId === currentUser?.id && r.courseId === courseId && r.status === 'approved');
    const hasInstructorAccess = onboardedCourseIds.includes(courseId as string);
    const hasOrgAccess = isOrganization && (course?.orgId === currentUser?.id || course?.orgId === `org_${currentUser?.id}`);

    const hasAccess = hasStudentAccess || hasInstructorAccess || hasOrgAccess;

    useEffect(() => {
        // Use Firebase realtime listeners if needed in the future
    }, [courseId]);

    if (!course) return <div className="text-center py-12 text-slate-400">Course not found.</div>;
    if (!hasAccess && isStudent) return <div className="text-center py-12 text-slate-400">You do not have access to this course.</div>;

    const handleCompleteModule = (moduleId: string) => {
        if (!currentUser || !isStudent) return;
        const completed = progress?.completedModuleIds || [];
        if (!completed.includes(moduleId)) {
            updateProgress({
                userId: currentUser.id,
                courseId: course.id,
                completedModuleIds: [...completed, moduleId],
                performanceScore: progress?.performanceScore || 85
            });
        }
    };

    const handleSaveModule = async () => {
        if (!editModuleTitle || !editModuleContent) return;
        
        const newModules = [...course.modules];
        if (editingModuleId) {
            const index = newModules.findIndex(m => m.id === editingModuleId);
            if (index !== -1) {
                newModules[index] = { ...newModules[index], title: editModuleTitle, content: editModuleContent };
            }
        } else {
            newModules.push({
                id: `mod_${crypto.randomUUID()}`,
                title: editModuleTitle,
                content: editModuleContent
            });
        }
        
        await updateCourse(course.id, { modules: newModules });
        setEditingModuleId(null);
        setIsAddingModule(false);
        setEditModuleTitle("");
        setEditModuleContent("");
    };

    const handleDeleteModule = async (moduleId: string) => {
        if (!confirm("Are you sure you want to delete this module?")) return;
        const newModules = course.modules.filter(m => m.id !== moduleId);
        await updateCourse(course.id, { modules: newModules });
    };

    const handleAddMaterial = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMatTitle || !newMatUrl) return;
        await addMaterial({
            courseId: course.id,
            title: newMatTitle,
            url: newMatUrl,
            type: 'link'
        });
        setNewMatTitle("");
        setNewMatUrl("");
    };

    const handleSendMsg = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatMsg.trim() || !currentUser) return;
        
        const newMsg: ChatMessage = {
            id: `msg_${crypto.randomUUID()}`,
            courseId: course.id,
            senderId: currentUser.id,
            senderName: currentUser.name,
            text: chatMsg,
            timestamp: new Date().getTime()
        };
        
        await sendMessage(newMsg);
        setChatMessages([...chatMessages, newMsg]); // Local optimistic update
        setChatMsg("");
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">{course.title}</h1>
                    <p className="text-slate-400 max-w-2xl">{course.description}</p>
                </div>
                {!isStudent && (
                    <button className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition whitespace-nowrap shadow-sm">
                        <Video className="w-4 h-4 mr-2" /> Start Video Call
                    </button>
                )}
            </div>

            <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-700 pb-px overflow-x-auto">
                <button onClick={() => setActiveTab('info')} className={`px-4 py-3 font-medium text-sm flex items-center transition-colors ${activeTab === 'info' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}>
                    <Info className="w-4 h-4 mr-2" /> Requirements
                </button>
                <button onClick={() => setActiveTab('modules')} className={`px-4 py-3 font-medium text-sm flex items-center transition-colors ${activeTab === 'modules' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}>
                    <Book className="w-4 h-4 mr-2" /> Modules
                </button>
                <button onClick={() => setActiveTab('materials')} className={`px-4 py-3 font-medium text-sm flex items-center transition-colors ${activeTab === 'materials' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}>
                    <FileText className="w-4 h-4 mr-2" /> Library & Materials
                </button>
                <button onClick={() => setActiveTab('assessments')} className={`px-4 py-3 font-medium text-sm flex items-center transition-colors ${activeTab === 'assessments' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}>
                    <Award className="w-4 h-4 mr-2" /> {isStudent ? 'Transcripts' : 'Assessments'}
                </button>
                <button onClick={() => setActiveTab('schedule')} className={`px-4 py-3 font-medium text-sm flex items-center transition-colors ${activeTab === 'schedule' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}>
                    <Calendar className="w-4 h-4 mr-2" /> Timetable
                </button>
                <button onClick={() => setActiveTab('chat')} className={`px-4 py-3 font-medium text-sm flex items-center transition-colors ${activeTab === 'chat' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}>
                    <MessageSquare className="w-4 h-4 mr-2" /> Discussions
                </button>
                {!isStudent && (
                    <button onClick={() => setActiveTab('people')} className={`px-4 py-3 font-medium text-sm flex items-center transition-colors ${activeTab === 'people' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}>
                        <Users className="w-4 h-4 mr-2" /> People & Invites
                    </button>
                )}
                <button onClick={() => setActiveTab('lunch')} className={`px-4 py-3 font-medium text-sm flex items-center transition-colors ${activeTab === 'lunch' ? 'text-pink-600 dark:text-pink-400 border-b-2 border-pink-600 dark:border-pink-400 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}>
                    <Coffee className="w-4 h-4 mr-2" /> Lunch & Casual Games
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 min-h-[400px]">
                {activeTab === 'info' && (
                    <div className="p-6 md:p-8 space-y-8 animate-in fade-in">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">Course Requirements & Terms</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Payment Terms</h3>
                                        <p className="text-slate-900 dark:text-white font-medium bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                                            {course.paymentTerms === 'installment' ? 'Installment Plan Available' : 'One-Time Payment'}
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Student Requirements</h3>
                                        <div className="text-slate-900 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 whitespace-pre-wrap">
                                            {course.requirements || "No specific student requirements provided."}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Application Process</h3>
                                        <div className="text-slate-900 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 whitespace-pre-wrap">
                                            {course.applicationProcess || "Standard automatic enrollment."}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Instructor Requirements</h3>
                                        <div className="text-slate-900 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 whitespace-pre-wrap">
                                            {course.instructorRequirements || "No specific instructor requirements provided."}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'modules' && (
                    <div className="p-6 space-y-4">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">Course Modules</h2>
                            {!isStudent && !isAddingModule && (
                                <button 
                                    onClick={() => {
                                        setIsAddingModule(true);
                                        setEditingModuleId(null);
                                        setEditModuleTitle("");
                                        setEditModuleContent("");
                                    }}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold transition-colors"
                                >
                                    + Add Module
                                </button>
                            )}
                        </div>

                        {(isAddingModule || editingModuleId) && (
                            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 mb-6">
                                <h3 className="font-bold text-lg text-white mb-4">{editingModuleId ? 'Edit Module' : 'New Module'}</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 mb-1">Module Title</label>
                                        <input type="text" value={editModuleTitle} onChange={e => setEditModuleTitle(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white" placeholder="e.g. Introduction to Physics" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 mb-1">Module Content</label>
                                        <textarea value={editModuleContent} onChange={e => setEditModuleContent(e.target.value)} rows={5} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white" placeholder="Content text, video links, etc." />
                                    </div>
                                    <div className="flex justify-end space-x-2 pt-2">
                                        <button onClick={() => { setIsAddingModule(false); setEditingModuleId(null); }} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors">Cancel</button>
                                        <button onClick={handleSaveModule} disabled={!editModuleTitle || !editModuleContent} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-colors">Save Module</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {course.modules.length === 0 && !isAddingModule && (
                            <div className="text-center py-8 text-slate-400">No modules available yet.</div>
                        )}

                        {course.modules.map((mod, i) => {
                            const isCompleted = progress?.completedModuleIds.includes(mod.id);
                            return (
                                <div key={mod.id} className="bg-slate-900 border border-slate-700 rounded-xl p-6">
                                    <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
                                        <h3 className="font-bold text-lg text-white">Module {i + 1}: {mod.title}</h3>
                                        {isStudent && (
                                            isCompleted ? (
                                                <span className="flex items-center text-emerald-400 text-sm font-semibold whitespace-nowrap"><CheckCircle className="w-4 h-4 mr-1"/> Completed</span>
                                            ) : (
                                                <button onClick={() => handleCompleteModule(mod.id)} className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
                                                    Mark Complete
                                                </button>
                                            )
                                        )}
                                        {!isStudent && (
                                            <div className="flex space-x-2">
                                                <button 
                                                    onClick={() => {
                                                        setEditingModuleId(mod.id);
                                                        setEditModuleTitle(mod.title);
                                                        setEditModuleContent(mod.content);
                                                        setIsAddingModule(false);
                                                    }}
                                                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteModule(mod.id)}
                                                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="prose prose-invert max-w-none text-slate-300">
                                        <p className="whitespace-pre-wrap">{mod.content}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {activeTab === 'materials' && (
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">Library & Resources</h2>
                        </div>
                        
                        {!isStudent && (
                            <form onSubmit={handleAddMaterial} className="mb-8 p-4 bg-slate-900 rounded-xl border border-slate-700 flex items-end space-x-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Material Title</label>
                                    <input type="text" required value={newMatTitle} onChange={e => setNewMatTitle(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white" placeholder="e.g. Course Syllabus PDF" />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Resource URL</label>
                                    <input type="url" required value={newMatUrl} onChange={e => setNewMatUrl(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white" placeholder="https://..." />
                                </div>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-sm font-medium flex items-center h-[38px]">
                                    <Upload className="w-4 h-4 mr-2" /> Upload
                                </button>
                            </form>
                        )}

                        <div className="space-y-3">
                            {courseMaterials.length === 0 ? (
                                <p className="text-slate-400 text-center py-8">No materials have been uploaded yet.</p>
                            ) : (
                                courseMaterials.map(mat => (
                                    <a key={mat.id} href={mat.url} target="_blank" rel="noreferrer" className="flex items-center p-4 bg-slate-900 border border-slate-700 hover:border-slate-500 rounded-xl transition-colors group">
                                        <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-lg flex items-center justify-center mr-4 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                            <Paperclip className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">{mat.title}</p>
                                            <p className="text-xs text-slate-500">{mat.type.toUpperCase()}</p>
                                        </div>
                                    </a>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'chat' && (
                    <div className="flex flex-col h-[500px]">
                        <div className="p-4 border-b border-slate-700">
                            <h2 className="text-xl font-bold text-white">Class Discussion</h2>
                        </div>
                        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-900/50">
                            {chatMessages.length === 0 ? (
                                <p className="text-center text-slate-500 mt-10">Start the conversation!</p>
                            ) : (
                                chatMessages.map((msg, i) => {
                                    const isMe = msg.senderId === currentUser?.id;
                                    return (
                                        <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                            <span className="text-xs text-slate-500 mb-1">{isMe ? 'You' : msg.senderName}</span>
                                            <div className={`px-4 py-2 rounded-2xl max-w-[70%] ${isMe ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
                                                {msg.text}
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                        <form onSubmit={handleSendMsg} className="p-4 border-t border-slate-700 flex space-x-2 bg-slate-800 rounded-b-2xl">
                            <input 
                                type="text" 
                                value={chatMsg}
                                onChange={e => setChatMsg(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <button type="submit" disabled={!chatMsg.trim()} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center">
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                )}
                
                {activeTab === 'people' && !isStudent && (
                    <div className="p-4 sm:p-6 bg-slate-900">
                        <OrgUserOnboarding courseId={course.id} />
                    </div>
                )}
                
                {activeTab === 'assessments' && (
                    <div className="p-4 sm:p-6 bg-slate-950">
                        <CourseAssessments courseId={course.id} isStudent={isStudent} />
                    </div>
                )}

                {activeTab === 'schedule' && (
                    <div className="p-4 sm:p-6 bg-slate-950">
                        <CourseSchedule courseId={course.id} isStudent={isStudent} />
                    </div>
                )}

                {activeTab === 'lunch' && (
                    <div className="p-4 sm:p-6">
                        <LunchGames />
                    </div>
                )}
            </div>
        </div>
    );
};

export default CourseDetails;
