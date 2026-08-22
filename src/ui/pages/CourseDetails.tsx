import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useAppContext } from "../../store/AppContext";
import { useAuth } from "../../store/AuthContext";
import { Book, MessageSquare, FileText, CheckCircle, Send, Upload, Paperclip, Users, Award, Calendar, Video, Info, X, Clock, CreditCard, Rocket, Building, DoorOpen, DoorClosed, RotateCcw, Settings2, UserCheck, Mail, ExternalLink } from "lucide-react";
import { LiveKitCall } from "../components/LiveKitCall";
import { ChatMessage, SpecialNeedsAccommodation } from "../../types";
import { LunchGames } from "../components/LunchGames";
import { CourseAssessments } from "../components/CourseAssessments";
import { CourseSchedule } from "../components/CourseSchedule";
import { OrgUserOnboarding } from "../components/OrgUserOnboarding";
import { CourseCertificate } from "../components/CourseCertificate";
import { FileUpload } from "../components/FileUpload";
import { EnrollmentModal } from "../components/EnrollmentModal";
import { CoursePaymentModal } from "../components/CoursePaymentModal";
import { CourseJoinModal } from "../components/CourseJoinModal";
import { AdmissionSessionManagerModal } from "../components/AdmissionSessionManagerModal";
import { EditCourseAdmissionModal } from "../components/EditCourseAdmissionModal";
import { generateId } from "../../lib/id";
import { db } from "../../lib/firebase";
import { collection, query, where, onSnapshot, setDoc, doc } from "firebase/firestore";

const CourseDetails = () => {
    const { courseId } = useParams();
    const { courses, updateCourse, userProgress, updateProgress, materials, addMaterial, sendMessage, enrollmentRequests, addEnrollmentRequest, updateEnrollmentRequest, orgMembers, scheduleEvents, addScheduleEvent, organizations } = useAppContext();
    const { currentUser } = useAuth();
    const [isCallActiveInApp, setIsCallActiveInApp] = useState(() => 
        typeof window !== 'undefined' && window.location.search.includes('liveCall=true')
    );
    const [activeTab, setActiveTab] = useState<'info' | 'modules' | 'materials' | 'chat' | 'lunch' | 'people' | 'assessments' | 'schedule' | 'certificate'>('info');
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [showSessionModal, setShowSessionModal] = useState(false);
    const [showEditAdmissionModal, setShowEditAdmissionModal] = useState(false);
    
    // Chat state
    const [chatMsg, setChatMsg] = useState("");
    const [chatAttachmentUrl, setChatAttachmentUrl] = useState("");
    const [chatAttachmentType, setChatAttachmentType] = useState<'image' | 'video' | 'document' | undefined>(undefined);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const chatBottomRef = useRef<HTMLDivElement>(null);
    
    // Materials state
    const [newMatTitle, setNewMatTitle] = useState("");
    const [newMatUrl, setNewMatUrl] = useState("");
    const [matUploadMode, setMatUploadMode] = useState<'file' | 'url'>('file');
    const [selectedMatFile, setSelectedMatFile] = useState<File | null>(null);
    const [isUploadingMat, setIsUploadingMat] = useState(false);

    // Module edit state
    const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
    const [editModuleTitle, setEditModuleTitle] = useState("");
    const [editModuleContent, setEditModuleContent] = useState("");
    const [isAddingModule, setIsAddingModule] = useState(false);

    const course = courses.find(c => c.id === courseId);
    const progress = userProgress.find(p => p.courseId === courseId && p.userId === currentUser?.id);
    const courseMaterials = materials.filter(m => m.courseId === courseId);
    
    const progressPercentage = course && course.modules.length > 0 
        ? ((progress?.completedModuleIds.length || 0) / course.modules.length) * 100 
        : 0;
    
    // Access check logic
    const isStudent = currentUser?.role === 'student';
    const isOrganization = currentUser?.role === 'organization';

    const myOrgMemberRecords = orgMembers.filter(m => m.email?.toLowerCase() === currentUser?.email?.toLowerCase());
    const onboardedCourseIds = myOrgMemberRecords.flatMap(m => m.courseIds || []);
    
    const myEnrollment = enrollmentRequests.find(r => r.userId === currentUser?.id && r.courseId === courseId);
    const myInvite = orgMembers.find(m => 
        m.email?.toLowerCase() === currentUser?.email?.toLowerCase() && 
        m.status === 'invited' && 
        (m.courseIds?.includes(courseId as string) || m.orgId === course?.orgId)
    );
    const isStudentApproved = myEnrollment?.status === 'approved';
    const isStudentPaidOrFree = !course || course.price === 0 || myEnrollment?.paymentStatus === 'paid';
    const hasStudentAccess = isStudentApproved && isStudentPaidOrFree;

    const hasInstructorAccess = onboardedCourseIds.includes(courseId as string);
    const hasOrgAccess = isOrganization && (course?.orgId === currentUser?.id || course?.orgId === `org_${currentUser?.id}`);

    const hasAccess = hasStudentAccess || hasInstructorAccess || hasOrgAccess;
    const canStartVideoCall = !isStudent && (hasOrgAccess || hasInstructorAccess || currentUser?.role === 'organization' || currentUser?.role === 'instructor');
    const canManageSessions = isOrganization || hasOrgAccess || currentUser?.role === 'admin';

    const isAdmissionOpen = course?.admissionStatus !== 'closed';
    const isReapplicationCandidate = myEnrollment?.status === 'rejected';

    const myOrg = organizations.find(o => o.ownerId === currentUser?.id || o.id === currentUser?.id || o.id === course?.orgId);
    const courseOrg = organizations.find(o => o.id === course?.orgId || o.ownerId === course?.orgId) || myOrg;
    const organisationName = (courseOrg?.name || "organisation").toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const courseTitle = (course?.title || "course").toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const participantDisplayName = currentUser?.role === 'organization'
        ? (myOrg?.name || currentUser?.name || "Organization")
        : (currentUser?.name || "Participant");

    const activeCall = scheduleEvents.find(e => e.courseId === courseId && e.isActive);
    
    const handleStartCall = async () => {
        if (!courseId) return;
        const timestamp = Date.now();
        const roomName = `${organisationName}-${courseTitle}-${timestamp}`;
        const meetingUrl = `https://meet.jit.si/${roomName}`;
        await addScheduleEvent({
            id: generateId('ev'),
            courseId,
            title: "Live Class Session",
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString(),
            durationMins: 60,
            type: 'lecture',
            meetingUrl,
            isActive: true
        });
        setIsCallActiveInApp(true);
    };

    const handleEnrollSubmit = async (
        paymentMethod: 'one-time' | 'installment', 
        documents?: Record<string, string>,
        additionalDocs?: Array<{ id: string; name: string; url: string }>,
        notes?: string,
        sessionId?: string,
        sessionName?: string,
        accommodationsRequested?: SpecialNeedsAccommodation
    ) => {
        if (!currentUser || !course) return;
        await addEnrollmentRequest({
            id: generateId('req'),
            userId: currentUser.id,
            userName: currentUser.name,
            userEmail: currentUser.email,
            orgId: course.orgId,
            courseId: course.id,
            courseTitle: course.title,
            status: 'pending',
            paymentStatus: 'unpaid',
            paymentMethod,
            documents,
            additionalDocuments: additionalDocs,
            studentNotes: notes,
            sessionId: sessionId || course.activeSessionId,
            sessionName: sessionName || course.activeSessionName,
            accommodationsRequested,
            appliedAt: new Date().toISOString()
        });
        setShowEnrollModal(false);
    };

    // Real-time Firestore discussions sync
    useEffect(() => {
        if (!courseId) return;

        try {
            const q = query(
                collection(db, 'discussions'),
                where('courseId', '==', courseId)
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const msgs: ChatMessage[] = [];
                snapshot.forEach(docSnap => {
                    msgs.push(docSnap.data() as ChatMessage);
                });
                msgs.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
                setChatMessages(msgs);
            }, (err) => {
                console.warn("Discussions realtime listener fallback:", err);
            });

            return () => unsubscribe();
        } catch (e) {
            console.warn("Discussions listener setup:", e);
        }
    }, [courseId]);

    // Scroll chat to bottom on new messages
    useEffect(() => {
        if (activeTab === 'chat') {
            chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages, activeTab]);

    if (!course) return <div className="text-center py-12 text-slate-500 dark:text-slate-400">Course not found.</div>;

    const renderAccessBlocker = () => (
        <div className="max-w-2xl mx-auto py-16 text-center space-y-6 animate-in fade-in slide-in-from-bottom-4">
            {myInvite ? (
                <>
                    <div className="w-16 h-16 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto border border-indigo-500/20">
                        <Mail className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">You Have Been Invited!</h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-sm leading-relaxed">
                        <strong className="text-slate-900 dark:text-white">{courseOrg?.name || 'The sponsoring institution'}</strong> has invited you to join <strong className="text-slate-900 dark:text-white">{course.title}</strong>.
                    </p>
                    {myInvite.inviteNote && (
                        <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-xs text-indigo-800 dark:text-indigo-300 max-w-md mx-auto border border-indigo-200 dark:border-indigo-800 text-left">
                            <span className="font-bold block mb-1">Note from Institution:</span>
                            "{myInvite.inviteNote}"
                        </div>
                    )}
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <button
                            type="button"
                            onClick={() => setShowJoinModal(true)}
                            className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition shadow-lg shadow-indigo-600/20 text-sm"
                        >
                            <UserCheck className="w-4 h-4 mr-2 shrink-0" /> Accept Invitation & Join Course
                        </button>
                        <button
                            type="button"
                            onClick={async () => {
                                if (confirm("Are you sure you want to decline this course invitation?")) {
                                    await deleteOrgMember(myInvite.id);
                                }
                            }}
                            className="inline-flex items-center px-5 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition text-sm"
                        >
                            <Trash2 className="w-4 h-4 mr-2 shrink-0" /> Decline
                        </button>
                    </div>
                </>
            ) : myEnrollment?.status === 'pending' ? (
                <>
                    <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/20">
                        <Clock className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Application Under Review</h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-sm leading-relaxed">
                        Your application for <strong className="text-slate-900 dark:text-white">{course.title}</strong> ({myEnrollment.sessionName || course.activeSessionName || 'Current Session'}) has been submitted and is currently being reviewed by the organization. No tuition payment is due until accepted.
                    </p>
                    <Link to="/dashboard" className="inline-flex items-center px-6 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl font-bold text-sm transition">
                        Return to Dashboard
                    </Link>
                </>
            ) : myEnrollment?.status === 'approved' && course.price > 0 && myEnrollment?.paymentStatus !== 'paid' ? (
                <>
                    <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Application Accepted!</h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-sm leading-relaxed">
                        Congratulations! Your application for <strong className="text-slate-900 dark:text-white">{course.title}</strong> has been approved. Please complete your tuition payment below to unlock full classroom access.
                    </p>
                    <button
                        onClick={() => setShowPaymentModal(true)}
                        className="inline-flex items-center px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition shadow-lg shadow-emerald-600/20 text-sm"
                    >
                        <CreditCard className="w-4 h-4 mr-2" /> Pay Tuition ({course.currency} {course.price.toLocaleString()})
                    </button>
                </>
            ) : isReapplicationCandidate ? (
                <>
                    {course.admissionStatus === 'closed' ? (
                        <>
                            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto border border-red-500/20">
                                <DoorClosed className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Admissions Currently Closed</h2>
                            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-sm leading-relaxed">
                                Your application for the previous session was declined. Admissions for <strong className="text-slate-900 dark:text-white">{course.title}</strong> are currently closed. You will be eligible to reapply as soon as the organization opens the next admission session.
                            </p>
                            {myEnrollment.rejectionReason && (
                                <div className="max-w-md mx-auto p-3.5 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900/40 text-xs text-red-800 dark:text-red-300 text-left">
                                    <span className="font-bold block mb-1">Feedback from Reviewer:</span>
                                    "{myEnrollment.rejectionReason}"
                                </div>
                            )}
                            <div className="pt-2">
                                <button
                                    disabled
                                    className="inline-flex items-center px-6 py-3 bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-xl font-bold text-sm cursor-not-allowed"
                                >
                                    <DoorClosed className="w-4 h-4 mr-2" /> Admissions Closed (Awaiting Next Intake)
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="w-16 h-16 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto border border-indigo-500/20">
                                <RotateCcw className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Admissions Open — Reapply Now</h2>
                            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-sm leading-relaxed">
                                A new admission intake (<strong className="text-indigo-600 dark:text-indigo-400">{course.activeSessionName || 'Current Session'}</strong>) is currently open! You can submit a fresh reapplication with updated credentials.
                            </p>
                            {myEnrollment.rejectionReason && (
                                <div className="max-w-md mx-auto p-3.5 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 text-left">
                                    <span className="font-bold block mb-1">Previous Session Feedback:</span>
                                    "{myEnrollment.rejectionReason}"
                                </div>
                            )}
                            <button
                                onClick={() => setShowEnrollModal(true)}
                                className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition shadow-lg shadow-indigo-600/20 text-sm"
                            >
                                <RotateCcw className="w-4 h-4 mr-2" /> Reapply for Admission ({course.activeSessionName || 'New Session'})
                            </button>
                        </>
                    )}
                </>
            ) : course.admissionStatus === 'closed' ? (
                <>
                    <div className="w-16 h-16 bg-slate-500/10 text-slate-500 rounded-2xl flex items-center justify-center mx-auto border border-slate-500/20">
                        <DoorClosed className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Admissions Currently Closed</h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-sm leading-relaxed">
                        The sponsoring organization is not currently accepting new student applications for <strong className="text-slate-900 dark:text-white">{course.title}</strong>. Please check back when the next admission session opens.
                    </p>
                    <button
                        disabled
                        className="inline-flex items-center px-6 py-3 bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-xl font-bold text-sm cursor-not-allowed"
                    >
                        <DoorClosed className="w-4 h-4 mr-2" /> Admissions Closed
                    </button>
                </>
            ) : isOrganization ? (
                <>
                    <div className="w-16 h-16 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto border border-indigo-500/20">
                        <Book className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Organization Account</h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-sm leading-relaxed">
                        Organization accounts cannot enroll in courses. You can manage and view the classroom for your own institution's courses.
                    </p>
                    <Link to="/dashboard" className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition shadow-lg shadow-indigo-600/20 text-sm">
                        Go to Organization Dashboard
                    </Link>
                </>
            ) : (
                <>
                    <div className="w-16 h-16 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto border border-indigo-500/20">
                        <Book className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Application Required</h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-sm leading-relaxed">
                        Submit an application for the <strong className="text-indigo-600 dark:text-indigo-400">{course.activeSessionName || 'current intake session'}</strong> of <strong className="text-slate-900 dark:text-white">{course.title}</strong>. No tuition payment is charged today.
                    </p>
                    <button
                        onClick={() => setShowEnrollModal(true)}
                        className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition shadow-lg shadow-indigo-600/20 text-sm"
                    >
                        <Send className="w-4 h-4 mr-2" /> Apply for Course ({course.activeSessionName || 'Current Session'})
                    </button>
                </>
            )}
        </div>
    );


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
                id: generateId('mod'),
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
        if (!course) return;

        let finalUrl = newMatUrl.trim();
        let finalType: 'document' | 'image' | 'video' | 'pdf' | 'link';

        if (matUploadMode === 'file') {
            if (!selectedMatFile) {
                alert("Please select a file to upload from your device.");
                return;
            }
            setIsUploadingMat(true);
            try {
                finalUrl = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(selectedMatFile);
                });

                const mime = selectedMatFile.type.toLowerCase();
                if (mime.includes('pdf')) finalType = 'pdf';
                else if (mime.includes('image')) finalType = 'image';
                else if (mime.includes('video')) finalType = 'video';
                else finalType = 'document';
            } catch (err) {
                console.error("Error reading material file:", err);
                alert("Failed to process file upload.");
                setIsUploadingMat(false);
                return;
            }
        } else {
            if (!finalUrl) {
                alert("Please enter a valid resource URL.");
                return;
            }
            if (finalUrl.toLowerCase().includes('.pdf')) finalType = 'pdf';
            else if (/\.(jpg|jpeg|png|webp|gif)$/i.test(finalUrl)) finalType = 'image';
            else if (/\.(mp4|webm|mov)$/i.test(finalUrl)) finalType = 'video';
            else finalType = 'link';
        }

        await addMaterial({
            id: generateId('mat'),
            courseId: course.id,
            title: newMatTitle.trim() || selectedMatFile?.name || 'Uploaded Material',
            url: finalUrl,
            type: finalType,
            uploadedAt: new Date().toISOString().split('T')[0]
        });

        setNewMatTitle("");
        setNewMatUrl("");
        setSelectedMatFile(null);
        setIsUploadingMat(false);
    };

    const handleSendMsg = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!chatMsg.trim() && !chatAttachmentUrl) || !currentUser || !course) return;
        
        const newMsgId = generateId('msg');
        const now = Number(new Date());
        const newMsg: ChatMessage = {
            id: newMsgId,
            courseId: course.id,
            senderId: currentUser.id,
            senderName: currentUser.name || "Anonymous",
            senderRole: currentUser.role,
            text: chatMsg.trim(),
            timestamp: now,
            fileUrl: chatAttachmentUrl || undefined,
            fileType: chatAttachmentType,
        };
        
        // Write to Firestore discussions collection for instantaneous real-time sync across all devices
        try {
            await setDoc(doc(db, 'discussions', newMsgId), newMsg);
        } catch (e) {
            console.error("Error writing message to Firestore discussions:", e);
        }

        // Also broadcast via AppContext
        await sendMessage(newMsg);
        
        setChatMessages(prev => [...prev.filter(m => m.id !== newMsgId), newMsg]);
        setChatMsg("");
        setChatAttachmentUrl("");
        setChatAttachmentType(undefined);
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        {courseOrg && (
                            <Link 
                                to={`/org/${courseOrg.id || course.orgId}`}
                                className="inline-flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20"
                            >
                                <Building className="w-3.5 h-3.5 mr-1" /> {courseOrg.name}
                            </Link>
                        )}
                        <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-lg border ${
                            isAdmissionOpen 
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                                : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                        }`}>
                            {isAdmissionOpen ? (
                                <>
                                    <DoorOpen className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                                    Admission: Open ({course.activeSessionName || 'Current Session'})
                                </>
                            ) : (
                                <>
                                    <DoorClosed className="w-3.5 h-3.5 mr-1 text-red-500" />
                                    Admission: Closed
                                </>
                            )}
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{course.title}</h1>
                    <p className="text-slate-500 dark:text-slate-400 max-w-2xl">{course.description}</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    {canManageSessions && (
                        <button
                            onClick={() => setShowSessionModal(true)}
                            className="flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold rounded-xl transition text-xs border border-slate-200 dark:border-slate-600 shadow-sm"
                        >
                            <Settings2 className="w-4 h-4 mr-1.5 text-indigo-500" />
                            Manage Admission Sessions
                        </button>
                    )}

                    {canStartVideoCall && (
                        isCallActiveInApp ? (
                            <div className="flex items-center px-4 py-2 bg-emerald-500/10 text-emerald-400 font-bold rounded-lg border border-emerald-500/20 text-sm whitespace-nowrap">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse mr-2" /> Live Call Active
                            </div>
                        ) : (
                            <button onClick={handleStartCall} className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition whitespace-nowrap shadow-sm">
                                <Video className="w-4 h-4 mr-2" /> Start Live Class
                            </button>
                        )
                    )}
                </div>
            </div>

            
            {isCallActiveInApp && (
                <div className="mb-6">
                    <LiveKitCall 
                        roomName={activeCall?.meetingUrl?.split("/").pop() || `${organisationName}-${courseTitle}-room`} 
                        participantName={participantDisplayName}
                        userRole={currentUser?.role}
                        onClose={() => setIsCallActiveInApp(false)}
                    />
                </div>
            )}

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
                <button onClick={() => setActiveTab('certificate')} className={`px-4 py-3 font-medium text-sm flex items-center transition-colors ${activeTab === 'certificate' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}>
                    <Award className="w-4 h-4 mr-2" /> Certificate
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
                    <Rocket className="w-4 h-4 mr-2" /> Lunch Box
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 min-h-[400px]">
                {!hasAccess && isStudent && activeTab !== 'info' ? renderAccessBlocker() : (
                    <>
                {activeTab === 'info' && (
                    <div className="p-6 md:p-8 space-y-8 animate-in fade-in">
                        <div>
                            {!hasAccess && isStudent && renderAccessBlocker()}
                            
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Admission & Guidelines</h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        Official admission criteria, program qualifications, required verification documents, and enrollment process.
                                    </p>
                                </div>
                                {!isStudent && (
                                    <button
                                        onClick={() => setShowEditAdmissionModal(true)}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-2 shadow-sm self-start sm:self-auto shrink-0"
                                    >
                                        <Settings2 className="w-4 h-4" />
                                        <span>Edit Admission & Guidelines</span>
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Left Column */}
                                <div className="space-y-6">
                                    {/* Qualification Awarded */}
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Program & Awarded Qualification</h3>
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                                            <div className="flex items-center space-x-2">
                                                <Award className="w-5 h-5 text-indigo-500" />
                                                <span className="font-bold text-slate-900 dark:text-white text-sm capitalize">
                                                    {course.qualificationType ? `${course.qualificationType} Award` : 'Certificate of Completion'}
                                                </span>
                                            </div>
                                            {course.qualificationTitle && (
                                                <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-1.5 pl-7">
                                                    Qualification Title: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{course.qualificationTitle}</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Admission Status & Active Session */}
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Admission Status & Intake Session</h3>
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 space-y-2.5">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-semibold text-slate-600 dark:text-slate-400">Current Intake Session</span>
                                                <span className="font-bold text-indigo-600 dark:text-indigo-400">{course.activeSessionName || 'General Intake Session'}</span>
                                            </div>
                                            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                                                <span className="font-semibold text-slate-600 dark:text-slate-400">Admission Status</span>
                                                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                                    course.admissionStatus === 'closed'
                                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                                }`}>
                                                    {course.admissionStatus === 'closed' ? 'Admissions Closed' : 'Accepting Applications'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Student Admission Guidelines */}
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Student Admission Guidelines</h3>
                                        <div className="text-slate-900 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 leading-relaxed text-xs">
                                            {course.requirements ? (
                                                <ul className="space-y-1.5 list-disc pl-5">
                                                    {course.requirements.split('\n').filter(Boolean).map((req, idx) => (
                                                        <li key={idx}>{req.replace(/^•\s*/, '')}</li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-slate-500 italic">Open admission. No prerequisites required.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Required Verification Documents */}
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Required Verification Documents for Admission</h3>
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                                            {course.requiredDocuments && course.requiredDocuments.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {course.requiredDocuments.map((doc, idx) => (
                                                        <span key={idx} className="inline-flex items-center px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 rounded-lg shadow-2xs">
                                                            <FileText className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
                                                            {doc}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-slate-500 italic text-xs">No document upload required for admission.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-6">
                                    {/* Enrollment Procedure */}
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Enrollment Procedure</h3>
                                        <div className="text-slate-900 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 leading-relaxed text-xs">
                                            {course.applicationProcess ? (
                                                <ol className="space-y-2">
                                                    {course.applicationProcess.split('\n').filter(Boolean).map((step, idx) => (
                                                        <li key={idx} className="flex items-start">
                                                            <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center mr-2 mt-0.5 shrink-0">
                                                                {idx + 1}
                                                            </span>
                                                            <span>{step.replace(/^\d+\.\s*/, '')}</span>
                                                        </li>
                                                    ))}
                                                </ol>
                                            ) : (
                                                <p className="text-slate-500 italic">Standard automatic enrollment upon payment.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Instructor Qualifications */}
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Instructor Qualifications</h3>
                                        <div className="text-slate-900 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 leading-relaxed text-xs">
                                            {course.instructorRequirements ? (
                                                <ul className="space-y-1.5 list-disc pl-5">
                                                    {course.instructorRequirements.split('\n').filter(Boolean).map((req, idx) => (
                                                        <li key={idx}>{req.replace(/^•\s*/, '')}</li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-slate-500 italic">All instructors are verified by the organization.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Payment Options */}
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Payment Availability & Installment Plan</h3>
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 space-y-2 text-xs">
                                            <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
                                                <span>Allowed Payment Terms</span>
                                                <span className="text-indigo-600 dark:text-indigo-400 capitalize">
                                                    {course.paymentTermsAllowed === 'both' ? 'One-time & Installment Plans Available' : course.paymentTermsAllowed === 'installment' ? 'Installment Plan Only' : 'One-Time Payment Only'}
                                                </span>
                                            </div>
                                            {course.paymentTermsAllowed !== 'one-time' && (
                                                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
                                                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                                        <span>Installment Interval</span>
                                                        <span className="font-bold capitalize">{course.installmentInterval || 'monthly'}</span>
                                                    </div>
                                                    {course.customMilestonesText && (
                                                        <p className="text-slate-500 text-[11px] mt-1 bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                                                            <span className="font-bold">Milestones: </span>{course.customMilestonesText}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
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
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Course Modules</h2>
                            {!isStudent && !isAddingModule && (
                                <button 
                                    onClick={() => {
                                        setIsAddingModule(true);
                                        setEditingModuleId(null);
                                        setEditModuleTitle("");
                                        setEditModuleContent("");
                                    }}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-slate-900 dark:text-white rounded-lg text-sm font-bold transition-colors"
                                >
                                    + Add Module
                                </button>
                            )}
                        </div>

                        {(isAddingModule || editingModuleId) && (
                            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 mb-6">
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">{editingModuleId ? 'Edit Module' : 'New Module'}</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Module Title</label>
                                        <input type="text" value={editModuleTitle || ''} onChange={e => setEditModuleTitle(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 text-sm text-slate-900 dark:text-white" placeholder="e.g. Introduction to Physics" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Module Content</label>
                                        <textarea value={editModuleContent || ''} onChange={e => setEditModuleContent(e.target.value)} rows={5} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 text-sm text-slate-900 dark:text-white mb-2" placeholder="Content text, video links, etc." />
                                        <FileUpload 
                                            label="Attach File / Video"
                                            onUpload={(url, type) => {
                                                const markdown = type === 'image' ? `\n![Image](${url})` : type === 'video' ? `\n[Video Link](${url})` : `\n[Document Link](${url})`;
                                                setEditModuleContent(prev => prev + markdown);
                                            }}
                                        />
                                    </div>
                                    <div className="flex justify-end space-x-2 pt-2">
                                        <button onClick={() => { setIsAddingModule(false); setEditingModuleId(null); }} className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors">Cancel</button>
                                        <button onClick={handleSaveModule} disabled={!editModuleTitle || !editModuleContent} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-slate-900 dark:text-white rounded-lg text-sm font-bold transition-colors">Save Module</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {course.modules.length === 0 && !isAddingModule && (
                            <div className="text-center py-8 text-slate-500 dark:text-slate-400">No modules available yet.</div>
                        )}

                        {course.modules.map((mod, i) => {
                            const isCompleted = progress?.completedModuleIds.includes(mod.id);
                            return (
                                <div key={mod.id} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
                                    <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
                                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">Module {i + 1}: {mod.title}</h3>
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
                                                        setEditModuleTitle(mod.title || '');
                                                        setEditModuleContent(mod.content || '');
                                                        setIsAddingModule(false);
                                                    }}
                                                    className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors"
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
                                    <div className="prose prose-invert max-w-none text-slate-600 dark:text-slate-300 space-y-4">
                                        <p className="whitespace-pre-wrap">{mod.content}</p>

                                        {mod.media && mod.media.length > 0 && (
                                            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Module Attachments & Media</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {mod.media.map((med) => (
                                                        <div key={med.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 shadow-sm">
                                                            {med.type === 'image' && (
                                                                <div className="space-y-2">
                                                                    <img src={med.url} alt={med.name} className="w-full max-h-64 object-cover rounded-lg border border-slate-200 dark:border-slate-700" />
                                                                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{med.name}</div>
                                                                </div>
                                                            )}
                                                            {med.type === 'video' && (
                                                                <div className="space-y-2">
                                                                    <video src={med.url} controls className="w-full max-h-64 rounded-lg bg-black" />
                                                                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{med.name}</div>
                                                                </div>
                                                            )}
                                                            {med.type === 'document' && (
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center space-x-2.5 overflow-hidden">
                                                                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                                                                            <FileText className="w-4 h-4" />
                                                                        </div>
                                                                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{med.name}</span>
                                                                    </div>
                                                                    <a href={med.url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-500 text-xs font-bold rounded-lg transition shrink-0 ml-2">
                                                                        View / Download
                                                                    </a>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {activeTab === 'materials' && (
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Library & Resources</h2>
                        </div>
                        
                        {!isStudent && (
                            <form onSubmit={handleAddMaterial} className="mb-8 p-5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                        Add New Library Item / Resource
                                    </span>
                                    <div className="flex items-center bg-slate-200 dark:bg-slate-800 p-1 rounded-lg">
                                        <button
                                            type="button"
                                            onClick={() => setMatUploadMode('file')}
                                            className={`px-3 py-1 rounded text-xs font-bold transition ${matUploadMode === 'file' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
                                        >
                                            Upload File from Computer
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setMatUploadMode('url')}
                                            className={`px-3 py-1 rounded text-xs font-bold transition ${matUploadMode === 'url' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
                                        >
                                            Enter Web Link / URL
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Material Title</label>
                                        <input
                                            type="text"
                                            value={newMatTitle || ''}
                                            onChange={e => setNewMatTitle(e.target.value)}
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white"
                                            placeholder="e.g. Course Syllabus PDF, Lecture Slides"
                                        />
                                    </div>

                                    {matUploadMode === 'file' ? (
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Select File from Device</label>
                                            <input
                                                type="file"
                                                onChange={e => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        setSelectedMatFile(file);
                                                        if (!newMatTitle) {
                                                            setNewMatTitle(file.name.replace(/\.[^/.]+$/, ""));
                                                        }
                                                    }
                                                }}
                                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs text-slate-900 dark:text-white file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-950 dark:file:text-indigo-300"
                                            />
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Resource Link / URL</label>
                                            <input
                                                type="url"
                                                value={newMatUrl || ''}
                                                onChange={e => setNewMatUrl(e.target.value)}
                                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white"
                                                placeholder="https://..."
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end pt-2">
                                    <button
                                        type="submit"
                                        disabled={isUploadingMat}
                                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center transition shadow-sm disabled:opacity-50"
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        <span>{isUploadingMat ? "Uploading File..." : "Add to Library"}</span>
                                    </button>
                                </div>
                            </form>
                        )}

                        <div className="space-y-3">
                            {courseMaterials.length === 0 ? (
                                <p className="text-slate-500 dark:text-slate-400 text-center py-8">No materials have been uploaded yet.</p>
                            ) : (
                                courseMaterials.map(mat => (
                                    <a key={mat.id} href={mat.url} target="_blank" rel="noreferrer" className="flex items-center p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-500 rounded-xl transition-colors group">
                                        <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-lg flex items-center justify-center mr-4 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                            <Paperclip className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-900 dark:text-white truncate">{mat.title}</p>
                                            <p className="text-xs text-slate-500 uppercase font-semibold">{mat.type || 'DOCUMENT'}</p>
                                        </div>
                                        <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline ml-2">
                                            Open / Download
                                        </div>
                                    </a>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'chat' && (
                    <div className="flex flex-col h-[600px] bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                                    <MessageSquare className="w-5 h-5 text-indigo-500 mr-2" />
                                    Course Live Discussion
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Real-time interactive room for students, instructors & staff
                                </p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="flex items-center text-xs font-semibold px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/20">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1.5"></span>
                                    Live Sync
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-900/40">
                            {chatMessages.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
                                        <MessageSquare className="w-6 h-6" />
                                    </div>
                                    <p className="text-slate-700 dark:text-slate-300 font-semibold text-sm">No messages yet in this discussion.</p>
                                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Be the first to post a question, start a topic, or share materials!</p>
                                </div>
                            ) : (
                                chatMessages.map((msg) => {
                                    const isMe = msg.senderId === currentUser?.id;
                                    const timeStr = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                                    const role = msg.senderRole;

                                    return (
                                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}>
                                            <div className="flex items-center space-x-2 px-1 text-[11px] text-slate-500 dark:text-slate-400">
                                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                                    {isMe ? 'You' : (msg.senderName || 'User')}
                                                </span>
                                                {role && (
                                                    <span className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold ${
                                                        role === 'organization' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' :
                                                        role === 'instructor' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                                                        role === 'admin' ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400' :
                                                        'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                                    }`}>
                                                        {role}
                                                    </span>
                                                )}
                                                {timeStr && <span>• {timeStr}</span>}
                                            </div>

                                            <div className={`p-3.5 rounded-2xl max-w-[80%] sm:max-w-[70%] shadow-sm ${
                                                isMe 
                                                    ? 'bg-indigo-600 text-white rounded-br-none' 
                                                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-bl-none'
                                            }`}>
                                                {msg.text && (
                                                    <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                                                        {msg.text}
                                                    </p>
                                                )}

                                                {msg.fileUrl && (
                                                    <div className="mt-2.5 pt-2 border-t border-white/20 dark:border-slate-700">
                                                        {msg.fileType === 'image' ? (
                                                            <div className="rounded-xl overflow-hidden bg-black/5 border border-white/10 max-w-sm">
                                                                <img 
                                                                    src={msg.fileUrl} 
                                                                    alt="attachment" 
                                                                    className="w-full max-h-60 object-cover hover:scale-105 transition duration-200" 
                                                                />
                                                            </div>
                                                        ) : msg.fileType === 'video' ? (
                                                            <div className="rounded-xl overflow-hidden bg-black max-w-sm">
                                                                <video src={msg.fileUrl} controls className="w-full max-h-60" />
                                                            </div>
                                                        ) : (
                                                            <a 
                                                                href={msg.fileUrl} 
                                                                target="_blank" 
                                                                rel="noreferrer" 
                                                                className={`flex items-center p-2.5 rounded-xl border text-xs font-semibold transition ${
                                                                    isMe 
                                                                        ? 'bg-indigo-700/60 border-indigo-400 text-white hover:bg-indigo-700' 
                                                                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 hover:border-indigo-500'
                                                                }`}
                                                            >
                                                                <Paperclip className="w-4 h-4 mr-2 flex-shrink-0" />
                                                                <span className="truncate mr-2 flex-1">Document Attachment</span>
                                                                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={chatBottomRef} />
                        </div>
                        
                        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                            {chatAttachmentUrl && (
                                <div className="mb-3 flex items-center justify-between bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 p-2.5 rounded-xl">
                                    <div className="flex items-center space-x-2 text-xs text-indigo-700 dark:text-indigo-300 font-medium truncate">
                                        <Paperclip className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                                        <span className="truncate">Attached {chatAttachmentType || 'file'} ready to send</span>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => { setChatAttachmentUrl(""); setChatAttachmentType(undefined); }} 
                                        className="p-1 hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded-lg text-indigo-600 dark:text-indigo-400 transition"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            <form onSubmit={handleSendMsg} className="flex items-center space-x-2">
                                <FileUpload 
                                    label=""
                                    onUpload={(url, type) => {
                                        setChatAttachmentUrl(url);
                                        setChatAttachmentType(type);
                                    }}
                                />
                                <input 
                                    type="text" 
                                    value={chatMsg}
                                    onChange={e => setChatMsg(e.target.value)}
                                    placeholder="Write a message to the class..."
                                    className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <button 
                                    type="submit" 
                                    disabled={!chatMsg.trim() && !chatAttachmentUrl} 
                                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl transition font-semibold flex items-center justify-center shadow-sm"
                                >
                                    <Send className="w-4 h-4 sm:mr-1.5" />
                                    <span className="hidden sm:inline text-xs font-bold">Send</span>
                                </button>
                            </form>
                        </div>
                    </div>
                )}
                
                {activeTab === 'people' && !isStudent && (
                    <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-900">
                        <OrgUserOnboarding courseId={course.id} />
                    </div>
                )}
                
                {activeTab === 'assessments' && (
                    <div className="p-4 sm:p-6 bg-slate-950">
                        <CourseAssessments courseId={course.id} isStudent={isStudent} />
                    </div>
                )}
                {activeTab === 'certificate' && (
                    <CourseCertificate course={course} isStudent={isStudent} progress={progressPercentage} />
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
                    </>
                )}
            </div>
            {showEnrollModal && (
                <EnrollmentModal
                    course={course}
                    isReapplication={isReapplicationCandidate}
                    previousRequest={myEnrollment}
                    onClose={() => setShowEnrollModal(false)}
                    onEnroll={handleEnrollSubmit}
                />
            )}

            {showPaymentModal && myEnrollment && (
                <CoursePaymentModal
                    course={course}
                    request={myEnrollment}
                    onClose={() => setShowPaymentModal(false)}
                    onPaymentSuccess={async () => {
                        await updateEnrollmentRequest(myEnrollment.id, undefined, 'paid');
                        setShowPaymentModal(false);
                    }}
                />
            )}

            {showJoinModal && myInvite && (
                <CourseJoinModal
                    course={course}
                    invite={myInvite}
                    onClose={() => setShowJoinModal(false)}
                    onJoinSuccess={() => setShowJoinModal(false)}
                />
            )}

            {showSessionModal && (
                <AdmissionSessionManagerModal
                    course={course}
                    onClose={() => setShowSessionModal(false)}
                />
            )}

            {showEditAdmissionModal && (
                <EditCourseAdmissionModal
                    course={course}
                    isOpen={showEditAdmissionModal}
                    onClose={() => setShowEditAdmissionModal(false)}
                    onSave={async (updates) => {
                        await updateCourse(course.id, updates);
                    }}
                />
            )}
        </div>
    );
};

export default CourseDetails;
