import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, setDoc, doc, getDoc } from 'firebase/firestore';
import { 
  Assessment, 
  Submission, 
  ScheduleEvent, 
  Organization, 
  Course, 
  EnrollmentRequest, 
  UserProgress, 
  AttendanceRecord, 
  Material, 
  ChatMessage, 
  OrgJoinRequest, 
  OrgMember, 
  AppNotification 
} from '../types';
import { useAuth } from './AuthContext';
import { sendPushNotification } from '../lib/pushNotifications';
import { sanitizeForFirestore } from '../lib/sanitize';

interface AppState {
  organizations: Organization[];
  courses: Course[];
  enrollmentRequests: EnrollmentRequest[];
  orgJoinRequests: OrgJoinRequest[];
  orgMembers: OrgMember[];
  userProgress: UserProgress[];
  materials: Material[];
  attendanceRecords: AttendanceRecord[];
  assessments: Assessment[];
  submissions: Submission[];
  scheduleEvents: ScheduleEvent[];
  messages: ChatMessage[];
  notifications: AppNotification[];
  
  addOrganization: (org: Organization) => Promise<void>;
  updateOrganization: (id: string, updates: Partial<Organization>) => Promise<void>;
  deleteOrganization: (id: string) => Promise<void>;
  addCourse: (course: Course) => Promise<void>;
  updateCourse: (courseId: string, updates: Partial<Course>) => Promise<void>;
  addEnrollmentRequest: (req: EnrollmentRequest) => Promise<void>;
  updateEnrollmentRequest: (id: string, status?: 'approved' | 'rejected' | 'cancelled' | 'pending', paymentStatus?: 'unpaid' | 'paid', rejectionReason?: string) => Promise<void>;
  cancelEnrollmentRequest: (id: string) => Promise<void>;
  openCourseAdmission: (courseId: string, sessionId?: string) => Promise<void>;
  closeCourseAdmission: (courseId: string) => Promise<void>;
  createCourseAdmissionSession: (courseId: string, sessionData: { name: string; startDate?: string; endDate?: string; applicationDeadline?: string; academicYear?: string; notes?: string; autoOpen?: boolean }) => Promise<void>;
  updateCourseAdmissionSession: (courseId: string, sessionId: string, updates: Partial<AdmissionSession>) => Promise<void>;
  addOrgJoinRequest: (req: OrgJoinRequest) => Promise<void>;
  updateOrgJoinRequest: (id: string, status: 'approved' | 'rejected') => Promise<void>;
  addOrgMember: (member: OrgMember) => Promise<void>;
  updateOrgMember: (id: string, updates: Partial<OrgMember>) => Promise<void>;
  deleteOrgMember: (id: string) => Promise<void>;
  updateProgress: (progress: UserProgress) => Promise<void>;
  addMaterial: (material: Material) => Promise<void>;
  addAttendanceRecord: (record: AttendanceRecord) => Promise<void>;
  sendMessage: (msg: ChatMessage) => Promise<void>;
  addAssessment: (assessment: Assessment) => Promise<void>;
  addSubmission: (submission: Submission) => Promise<void>;
  updateSubmissionScore: (id: string, score: number, feedback?: string, detailedAnswers?: QuestionAnswer[], manualScore?: number) => Promise<void>;
  addScheduleEvent: (event: ScheduleEvent) => Promise<void>;
  updateScheduleEvent: (id: string, updates: Partial<ScheduleEvent>) => Promise<void>;
  deleteScheduleEvent: (id: string) => Promise<void>;
  addNotification: (notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

// Helper function to extract user data whether stored as an object or legacy array
const getUserData = (data: Record<string, unknown> | undefined): Record<string, unknown> => {
  if (!data) return {};
  if (Array.isArray(data.user)) {
    return (data.user[0] as Record<string, unknown>) || {};
  }
  return (data.user as Record<string, unknown>) || {};
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useAuth();
  
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollmentRequests, setEnrollmentRequests] = useState<EnrollmentRequest[]>([]);
  const [orgJoinRequests, setOrgJoinRequests] = useState<OrgJoinRequest[]>([]);
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Helper to update personalInformation within the user object of a backpack document
  const updateBackpackPersonalInfo = async (userId: string, updates: Record<string, unknown>) => {
    if (!userId) return;
    const docRef = doc(db, 'backpack', userId);
    try {
      const docSnap = await getDoc(docRef);
      const data = docSnap.exists() ? docSnap.data() : {};
      const userObj = getUserData(data);
      const personalInfo = (userObj.personalInformation as Record<string, unknown>) || {};
      
      const updatedPersonalInfo = {
        ...personalInfo,
        ...sanitizeForFirestore(updates)
      };

      const updatedUser = sanitizeForFirestore({
        ...userObj,
        personalInformation: updatedPersonalInfo
      });

      await setDoc(docRef, { user: updatedUser }, { merge: true });
    } catch (err) {
      console.error(`updateBackpackPersonalInfo for user ${userId} failed:`, err);
    }
  };

  // Helper to update arrays within the user object of a backpack document
  const updateBackpackUserField = async <T extends { id?: string }>(
    userId: string,
    field: string,
    updateFn: (currentList: T[]) => T[]
  ) => {
    if (!userId) return;
    const docRef = doc(db, 'backpack', userId);
    try {
      const docSnap = await getDoc(docRef);
      const data = docSnap.exists() ? docSnap.data() : {};
      const userObj = getUserData(data);
      const currentList: T[] = Array.isArray(userObj[field]) ? userObj[field] as T[] : [];
      const updatedList = updateFn(currentList);
      const updatedUser = sanitizeForFirestore({
        ...userObj,
        [field]: updatedList
      });
      await setDoc(docRef, { user: updatedUser }, { merge: true });
    } catch (err) {
      console.error(`Error updating ${field} in backpack/${userId}:`, err);
    }
  };

  const addNotification = (notifData: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
    const newNotif: AppNotification = {
      ...notifData,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    };

    setNotifications(prev => [newNotif, ...prev]);

    // Send push notification if granted
    sendPushNotification(newNotif.title, {
      body: newNotif.message,
      linkUrl: newNotif.linkUrl
    });
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Fetch all global data and user-specific data from backpack documents
  useEffect(() => {
    const loadAllBackpackData = async () => {
      try {
        const backpackSnap = await getDocs(collection(db, 'backpack'));
        
        const allOrganizations: Organization[] = [];
        const allCourses: Course[] = [];
        const allEnrollments: EnrollmentRequest[] = [];
        const allOrgJoinRequests: OrgJoinRequest[] = [];
        const allMembers: OrgMember[] = [];
        const allProgress: UserProgress[] = [];
        const allMaterials: Material[] = [];
        const allAttendance: AttendanceRecord[] = [];
        const allAssessments: Assessment[] = [];
        const allSubmissions: Submission[] = [];
        const allScheduleEvents: ScheduleEvent[] = [];

        backpackSnap.docs.forEach(docSnap => {
          const data = docSnap.data();
          const userObj = getUserData(data);
          const personalInfo = (userObj.personalInformation as Record<string, unknown>) || {};

          // Extract organization from user.personalInformation map
          if (
            personalInfo.role === 'organization' ||
            personalInfo.orgType ||
            personalInfo.registrationId ||
            personalInfo.accreditationStatus ||
            personalInfo.isAccredited
          ) {
            allOrganizations.push({
              id: (personalInfo.id as string) || docSnap.id,
              name: (personalInfo.fullname as string) || (personalInfo.name as string) || 'Unnamed Organization',
              description: (personalInfo.description as string) || '',
              logoUrl: personalInfo.logoUrl as string | undefined,
              ownerId: (personalInfo.ownerId as string) || docSnap.id,
              baseCurrency: (personalInfo.baseCurrency as string) || 'USD',
              location: personalInfo.location as string | undefined,
              orgType: (personalInfo.orgType as 'basic' | 'higher' | 'vocational') || 'basic',
              kycVerified: (personalInfo.kycVerified as boolean) ?? false,
              kycDocumentUrl: personalInfo.kycDocumentUrl as string | undefined,
              address: personalInfo.address as string | undefined,
              registrationId: personalInfo.registrationId as string | undefined,
              isAccredited: (personalInfo.isAccredited as boolean) ?? false,
              accreditingBody: personalInfo.accreditingBody as string | undefined,
              accreditationStatus: (personalInfo.accreditationStatus as 'accredited' | 'pending' | 'unaccredited') || (personalInfo.isAccredited ? 'accredited' : 'unaccredited'),
              accreditationDocUrl: personalInfo.accreditationDocUrl as string | undefined,
              motto: personalInfo.motto as string | undefined,
              phone: personalInfo.phone as string | undefined,
              website: personalInfo.website as string | undefined,
              themeColor: personalInfo.themeColor as string | undefined,
              academicHighlights: personalInfo.academicHighlights as string[] | undefined,
              isDeleted: (personalInfo.isDeleted as boolean) ?? false,
              paystackSubaccount: personalInfo.paystackSubaccount as Organization['paystackSubaccount']
            });
          }

          if (Array.isArray(userObj.courses)) allCourses.push(...userObj.courses);
          if (Array.isArray(userObj.enrollmentRequests)) allEnrollments.push(...userObj.enrollmentRequests);
          if (Array.isArray(userObj.orgJoinRequests)) allOrgJoinRequests.push(...userObj.orgJoinRequests);
          if (Array.isArray(userObj.orgMembers)) allMembers.push(...userObj.orgMembers);
          if (Array.isArray(userObj.userProgress)) allProgress.push(...userObj.userProgress);
          if (Array.isArray(userObj.materials)) allMaterials.push(...userObj.materials);
          if (Array.isArray(userObj.attendance)) allAttendance.push(...userObj.attendance);
          if (Array.isArray(userObj.assessments)) allAssessments.push(...userObj.assessments);
          if (Array.isArray(userObj.submissions)) allSubmissions.push(...userObj.submissions);
          if (Array.isArray(userObj.scheduleEvents)) allScheduleEvents.push(...userObj.scheduleEvents);
        });

        // Deduplicate arrays by id
        const dedupeById = <T extends { id?: string }>(arr: T[]): T[] => {
          const map = new Map<string, T>();
          arr.forEach(item => {
            if (item.id) map.set(item.id, item);
          });
          return Array.from(map.values());
        };

        setOrganizations(dedupeById(allOrganizations));
        setCourses(dedupeById(allCourses));
        setEnrollmentRequests(dedupeById(allEnrollments));
        setOrgJoinRequests(dedupeById(allOrgJoinRequests));
        setUserProgress(dedupeById(allProgress));
        setMaterials(dedupeById(allMaterials));
        setAttendanceRecords(allAttendance);
        setAssessments(dedupeById(allAssessments));
        setSubmissions(dedupeById(allSubmissions));
        setScheduleEvents(dedupeById(allScheduleEvents));
        setOrgMembers(dedupeById(allMembers));

      } catch (err) {
        console.error("loadAllBackpackData failed:", err);
      }
    };

    loadAllBackpackData();
  }, [currentUser]);

  // Organization Operations (stored inside backpack/{userId} -> user -> personalInformation)
  const updateOrganization = async (id: string, updates: Partial<Organization>) => {
    const cleaned = sanitizeForFirestore(updates);
    const existingOrg = organizations.find(o => o.id === id || o.ownerId === id);
    const targetUid = existingOrg?.ownerId || existingOrg?.id || (id.startsWith('org_') ? id.replace('org_', '') : id) || currentUser?.id || '';
    
    if (targetUid) {
      const personalUpdates: Record<string, unknown> = { ...cleaned };
      if (updates.name) personalUpdates.fullname = updates.name;
      await updateBackpackPersonalInfo(targetUid, personalUpdates);
    }
    
    setOrganizations(prev => prev.map(o => (o.id === id || o.ownerId === id || o.id === targetUid) ? { ...o, ...cleaned } : o));
  };

  const deleteOrganization = async (id: string) => {
    const existingOrg = organizations.find(o => o.id === id || o.ownerId === id);
    const targetUid = existingOrg?.ownerId || existingOrg?.id || (id.startsWith('org_') ? id.replace('org_', '') : id) || currentUser?.id || '';
    
    if (targetUid) {
      await updateBackpackPersonalInfo(targetUid, { isDeleted: true });
    }
    
    setOrganizations(prev => prev.map(o => (o.id === id || o.ownerId === id || o.id === targetUid) ? { ...o, isDeleted: true } : o));
  };

  const addOrganization = async (org: Organization) => {
    const cleaned = sanitizeForFirestore(org);
    const targetUid = org.ownerId || org.id || currentUser?.id || '';
    if (targetUid) {
      await updateBackpackPersonalInfo(targetUid, {
        id: org.id || targetUid,
        name: org.name,
        fullname: org.name,
        description: org.description,
        logoUrl: org.logoUrl,
        ownerId: targetUid,
        baseCurrency: org.baseCurrency,
        location: org.location,
        orgType: org.orgType,
        kycVerified: org.kycVerified ?? false,
        kycDocumentUrl: org.kycDocumentUrl,
        address: org.address,
        registrationId: org.registrationId,
        isAccredited: org.isAccredited ?? false,
        accreditingBody: org.accreditingBody,
        accreditationStatus: org.accreditationStatus || (org.isAccredited ? 'accredited' : 'unaccredited'),
        accreditationDocUrl: org.accreditationDocUrl,
        motto: org.motto,
        phone: org.phone,
        website: org.website,
        themeColor: org.themeColor,
        academicHighlights: org.academicHighlights,
        isDeleted: false,
        role: 'organization',
        paystackSubaccount: org.paystackSubaccount
      });
    }
    setOrganizations(prev => [...prev.filter(o => o.id !== org.id && o.ownerId !== targetUid), { ...cleaned, id: org.id || targetUid, ownerId: targetUid }]);
  };
  
  // Course Operations (stored in backpack/{orgId}.user.courses)
  const addCourse = async (course: Course) => {
    const cleaned = sanitizeForFirestore(course);
    const targetUid = course.orgId || currentUser?.id || '';

    await updateBackpackUserField<Course>(targetUid, 'courses', (list) => [...list.filter(c => c.id !== course.id), cleaned]);
    setCourses(prev => [...prev.filter(c => c.id !== course.id), cleaned]);
  };

  const updateCourse = async (courseId: string, updates: Partial<Course>) => {
    const cleaned = sanitizeForFirestore(updates);
    const existingCourse = courses.find(c => c.id === courseId);
    if (!existingCourse) return;
    
    const targetUid = existingCourse.orgId || currentUser?.id || '';
    await updateBackpackUserField<Course>(targetUid, 'courses', (list) => 
      list.map(c => c.id === courseId ? { ...c, ...cleaned } : c)
    );
    setCourses(prev => prev.map(c => c.id === courseId ? { ...c, ...cleaned } : c));
  };

  // Enrollment Request Operations (stored in backpack/{userId}.user.enrollmentRequests & org's backpack)
  const addEnrollmentRequest = async (req: EnrollmentRequest) => {
    // Check if there was an existing request for this user and course (e.g. previously rejected or cancelled)
    const existingReq = enrollmentRequests.find(r => r.userId === req.userId && r.courseId === req.courseId);
    let reapplicationHistory = req.reapplicationHistory || [];

    if (existingReq && (existingReq.status === 'rejected' || existingReq.status === 'cancelled')) {
      const pastRecord: ReapplicationRecord = {
        id: existingReq.id,
        sessionId: existingReq.sessionId,
        sessionName: existingReq.sessionName,
        appliedAt: existingReq.appliedAt || new Date().toISOString(),
        status: existingReq.status,
        rejectedAt: existingReq.rejectedAt,
        rejectionReason: existingReq.rejectionReason
      };
      reapplicationHistory = [
        ...(existingReq.reapplicationHistory || []),
        pastRecord
      ];
    }

    const payload: EnrollmentRequest = {
      ...req,
      reapplicationHistory
    };
    const cleaned = sanitizeForFirestore(payload);

    // Store in student's backpack (replacing any existing request for same course or id)
    if (req.userId) {
      await updateBackpackUserField<EnrollmentRequest>(req.userId, 'enrollmentRequests', (list) => [
        ...list.filter(r => r.id !== req.id && !(r.courseId === req.courseId && r.userId === req.userId)),
        cleaned
      ]);
    }
    // Also store in org's backpack if distinct
    if (req.orgId && req.orgId !== req.userId) {
      await updateBackpackUserField<EnrollmentRequest>(req.orgId, 'enrollmentRequests', (list) => [
        ...list.filter(r => r.id !== req.id && !(r.courseId === req.courseId && r.userId === req.userId)),
        cleaned
      ]);
    }

    setEnrollmentRequests(prev => [
      ...prev.filter(r => r.id !== req.id && !(r.courseId === req.courseId && r.userId === req.userId)),
      cleaned
    ]);

    // Send notification to organization / course owner
    if (req.orgId) {
      addNotification({
        userId: req.orgId,
        title: 'New Admission Application',
        message: `${req.userName || 'A student'} applied for "${req.courseTitle || 'Course'}"${req.sessionName ? ` (${req.sessionName})` : ''}.`,
        type: 'enrollment',
        linkUrl: `/dashboard`
      });
    }
  };

  const updateEnrollmentRequest = async (
    id: string, 
    status?: 'approved' | 'rejected' | 'cancelled' | 'pending', 
    paymentStatus?: 'unpaid' | 'paid',
    rejectionReason?: string
  ) => {
    const req = enrollmentRequests.find(r => r.id === id);
    const updates: Partial<EnrollmentRequest> = {};
    if (status) updates.status = status;
    if (paymentStatus) updates.paymentStatus = paymentStatus;
    if (status === 'rejected') {
      updates.rejectedAt = new Date().toISOString();
      if (rejectionReason) updates.rejectionReason = rejectionReason;
      if (req?.sessionId) updates.rejectedSessionId = req.sessionId;
    }

    if (req) {
      if (req.userId) {
        await updateBackpackUserField<EnrollmentRequest>(req.userId, 'enrollmentRequests', (list) =>
          list.map(r => r.id === id ? { ...r, ...updates } : r)
        );
      }
      if (req.orgId && req.orgId !== req.userId) {
        await updateBackpackUserField<EnrollmentRequest>(req.orgId, 'enrollmentRequests', (list) =>
          list.map(r => r.id === id ? { ...r, ...updates } : r)
        );
      }

      if (status && status !== 'cancelled') {
        const sessionInfo = req.sessionName ? ` for ${req.sessionName}` : '';
        addNotification({
          userId: req.userId,
          title: `Enrollment Application ${status.toUpperCase()}`,
          message: status === 'approved'
            ? `Congratulations! Your admission application for "${req.courseTitle || 'the course'}"${sessionInfo} has been approved.`
            : `Your application for "${req.courseTitle || 'the course'}"${sessionInfo} was declined.${rejectionReason ? ` Note: ${rejectionReason}` : ' You may reapply in the next admission session.'}`,
          type: 'enrollment',
          linkUrl: `/course/${req.courseId}`
        });
      }

      // Automatically sync approved student into orgMembers roster if not already present
      if (status === 'approved' && req.userEmail) {
        const cleanEmail = req.userEmail.toLowerCase();
        const targetOrgId = req.orgId || `org_${req.userId}`;
        const alreadyMember = orgMembers.some(
          m => m.email?.toLowerCase() === cleanEmail && (m.orgId === targetOrgId || m.orgId === req.orgId)
        );
        if (!alreadyMember) {
          const newMember: OrgMember = {
            id: generateId('member'),
            orgId: targetOrgId,
            name: req.userName || 'Enrolled Student',
            email: cleanEmail,
            role: 'student',
            department: req.courseTitle || 'Enrolled Program',
            courseIds: req.courseId ? [req.courseId] : [],
            joinedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            status: 'active',
            requiresPayment: req.paymentStatus === 'unpaid',
            requiresDocuments: false,
          };
          addOrgMember(newMember).catch(err => console.warn('Could not auto-add enrolled student to org members', err));
        }
      }
    }

    setEnrollmentRequests(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const cancelEnrollmentRequest = async (id: string) => {
    const req = enrollmentRequests.find(r => r.id === id);
    if (!req) return;

    const updates: Partial<EnrollmentRequest> = {
      status: 'cancelled',
      cancelledAt: new Date().toISOString()
    };

    if (req.userId) {
      await updateBackpackUserField<EnrollmentRequest>(req.userId, 'enrollmentRequests', (list) =>
        list.map(r => r.id === id ? { ...r, ...updates } : r)
      );
    }
    if (req.orgId && req.orgId !== req.userId) {
      await updateBackpackUserField<EnrollmentRequest>(req.orgId, 'enrollmentRequests', (list) =>
        list.map(r => r.id === id ? { ...r, ...updates } : r)
      );
    }

    // Add in-app notification
    addNotification({
      userId: req.userId,
      title: 'Course Application Cancelled',
      message: `Your application for "${req.courseTitle || 'Course'}" has been cancelled.`,
      type: 'info'
    });

    setEnrollmentRequests(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  // Admission Session Management (Restricted strictly to organizations / organization admins)
  const openCourseAdmission = async (courseId: string, sessionId?: string) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    // Students and instructors cannot manage sessions or open/close admission
    const isOrgOrAdmin = currentUser?.role === 'organization' || currentUser?.role === 'admin' || (course.orgId === currentUser?.id || course.orgId === `org_${currentUser?.id}`);
    if (!isOrgOrAdmin) {
      console.warn("Permission denied: Only organizations can manage course sessions and admissions.");
      return;
    }

    const sessions = course.admissionSessions ? [...course.admissionSessions] : [];
    let activeSession = sessionId ? sessions.find(s => s.id === sessionId) : sessions.find(s => s.status === 'open');

    // If no active session exists or specified session not open, activate/open it
    if (!activeSession) {
      if (sessions.length > 0) {
        // Open the most recent session
        sessions[0] = { ...sessions[0], status: 'open' };
        activeSession = sessions[0];
      } else {
        // Create an initial session
        const currentYear = new Date().getFullYear();
        const initialSession: AdmissionSession = {
          id: generateId('ses'),
          name: `${currentYear}/${currentYear + 1} Academic Session`,
          status: 'open',
          startDate: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString()
        };
        sessions.push(initialSession);
        activeSession = initialSession;
      }
    } else {
      // Mark selected session as open
      const updatedSessions = sessions.map(s => s.id === activeSession!.id ? { ...s, status: 'open' as const } : s);
      sessions.splice(0, sessions.length, ...updatedSessions);
    }

    const updates: Partial<Course> = {
      admissionStatus: 'open',
      activeSessionId: activeSession.id,
      activeSessionName: activeSession.name,
      admissionSessions: sessions
    };

    await updateCourse(courseId, updates);
  };

  const closeCourseAdmission = async (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    // Students and instructors cannot manage sessions or open/close admission
    const isOrgOrAdmin = currentUser?.role === 'organization' || currentUser?.role === 'admin' || (course.orgId === currentUser?.id || course.orgId === `org_${currentUser?.id}`);
    if (!isOrgOrAdmin) {
      console.warn("Permission denied: Only organizations can manage course sessions and admissions.");
      return;
    }

    const sessions = (course.admissionSessions || []).map(s => 
      s.id === course.activeSessionId ? { ...s, status: 'closed' as const, closedAt: new Date().toISOString() } : s
    );

    const updates: Partial<Course> = {
      admissionStatus: 'closed',
      admissionSessions: sessions
    };

    await updateCourse(courseId, updates);
  };

  const createCourseAdmissionSession = async (
    courseId: string, 
    sessionData: { 
      name: string; 
      startDate?: string; 
      endDate?: string; 
      applicationDeadline?: string; 
      academicYear?: string; 
      notes?: string; 
      autoOpen?: boolean; 
    }
  ) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    // Students and instructors cannot manage sessions
    const isOrgOrAdmin = currentUser?.role === 'organization' || currentUser?.role === 'admin' || (course.orgId === currentUser?.id || course.orgId === `org_${currentUser?.id}`);
    if (!isOrgOrAdmin) {
      console.warn("Permission denied: Only organizations can create course admission sessions.");
      return;
    }

    const newSessionId = generateId('ses');
    const autoOpen = sessionData.autoOpen !== false; // default true

    const newSession: AdmissionSession = {
      id: newSessionId,
      name: sessionData.name.trim(),
      status: autoOpen ? 'open' : 'closed',
      startDate: sessionData.startDate,
      endDate: sessionData.endDate,
      applicationDeadline: sessionData.applicationDeadline,
      academicYear: sessionData.academicYear,
      notes: sessionData.notes,
      createdAt: new Date().toISOString()
    };

    // If opening new session, close old active sessions
    let sessions = course.admissionSessions ? [...course.admissionSessions] : [];
    if (autoOpen) {
      sessions = sessions.map(s => ({ ...s, status: 'closed' as const, closedAt: s.closedAt || new Date().toISOString() }));
    }
    sessions = [newSession, ...sessions];

    const updates: Partial<Course> = {
      admissionSessions: sessions,
      ...(autoOpen ? {
        admissionStatus: 'open',
        activeSessionId: newSession.id,
        activeSessionName: newSession.name
      } : {})
    };

    await updateCourse(courseId, updates);
  };

  const updateCourseAdmissionSession = async (courseId: string, sessionId: string, updates: Partial<AdmissionSession>) => {
    const course = courses.find(c => c.id === courseId);
    if (!course || !course.admissionSessions) return;

    // Students and instructors cannot manage sessions
    const isOrgOrAdmin = currentUser?.role === 'organization' || currentUser?.role === 'admin' || (course.orgId === currentUser?.id || course.orgId === `org_${currentUser?.id}`);
    if (!isOrgOrAdmin) {
      console.warn("Permission denied: Only organizations can edit course admission sessions.");
      return;
    }

    const sessions = course.admissionSessions.map(s => s.id === sessionId ? { ...s, ...updates } : s);
    const updatedCourseData: Partial<Course> = { admissionSessions: sessions };

    if (updates.name && course.activeSessionId === sessionId) {
      updatedCourseData.activeSessionName = updates.name;
    }
    if (updates.status && course.activeSessionId === sessionId) {
      updatedCourseData.admissionStatus = updates.status;
    }

    await updateCourse(courseId, updatedCourseData);
  };

  // Org Join Requests (stored in backpack/{userId}.user.orgJoinRequests & org's backpack)
  const addOrgJoinRequest = async (req: OrgJoinRequest) => {
    const cleaned = sanitizeForFirestore(req);
    if (req.userId) {
      await updateBackpackUserField<OrgJoinRequest>(req.userId, 'orgJoinRequests', (list) => [...list.filter(r => r.id !== req.id), cleaned]);
    }
    if (req.orgId && req.orgId !== req.userId) {
      await updateBackpackUserField<OrgJoinRequest>(req.orgId, 'orgJoinRequests', (list) => [...list.filter(r => r.id !== req.id), cleaned]);
    }
    setOrgJoinRequests(prev => [...prev.filter(r => r.id !== req.id), cleaned]);
  };

  const updateOrgJoinRequest = async (id: string, status: 'approved' | 'rejected') => {
    const req = orgJoinRequests.find(r => r.id === id);
    if (req) {
      if (req.userId) {
        await updateBackpackUserField<OrgJoinRequest>(req.userId, 'orgJoinRequests', (list) =>
          list.map(r => r.id === id ? { ...r, status } : r)
        );
      }
      if (req.orgId && req.orgId !== req.userId) {
        await updateBackpackUserField<OrgJoinRequest>(req.orgId, 'orgJoinRequests', (list) =>
          list.map(r => r.id === id ? { ...r, status } : r)
        );
      }
      addNotification({
        userId: req.userId,
        title: `Member Join Request ${status.toUpperCase()}`,
        message: `Your request to join ${req.orgName} was ${status}.`,
        type: 'info',
        linkUrl: `/dashboard`
      });
    }
    setOrgJoinRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  // Org Members (stored in backpack/{orgId}.user.orgMembers and orgMembers collection)
  const addOrgMember = async (member: OrgMember) => {
    const cleaned = sanitizeForFirestore(member);
    const targetUid = member.orgId?.startsWith('org_') ? member.orgId.replace('org_', '') : (member.orgId || currentUser?.id || '');
    if (targetUid) {
      await updateBackpackUserField<OrgMember>(targetUid, 'orgMembers', (list) => [...list.filter(m => m.id !== member.id), cleaned]);
    }
    setOrgMembers(prev => [...prev.filter(m => m.id !== member.id), cleaned]);
  };

  const updateOrgMember = async (id: string, updates: Partial<OrgMember>) => {
    const member = orgMembers.find(m => m.id === id);
    if (member && member.orgId) {
      const targetUid = member.orgId.startsWith('org_') ? member.orgId.replace('org_', '') : member.orgId;
      await updateBackpackUserField<OrgMember>(targetUid, 'orgMembers', (list) =>
        list.map(m => m.id === id ? { ...m, ...updates } : m)
      );
    }
    setOrgMembers(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const deleteOrgMember = async (id: string) => {
    const member = orgMembers.find(m => m.id === id);
    if (member) {
      const isEnrolled = enrollmentRequests.some(r => r.userEmail?.toLowerCase() === member.email?.toLowerCase() || r.userId === member.userId || r.userId === member.id);
      if (member.role === 'student' && (member.status !== 'invited' || isEnrolled)) {
        alert("🔒 Enforced Safeguard: Students who have enrolled into a course cannot be deleted. You can Suspend, Reactivate, or Mark as Graduated instead.");
        return;
      }
    }
    if (member && member.orgId) {
      const targetUid = member.orgId.startsWith('org_') ? member.orgId.replace('org_', '') : member.orgId;
      await updateBackpackUserField<OrgMember>(targetUid, 'orgMembers', (list) =>
        list.filter(m => m.id !== id)
      );
    }
    setOrgMembers(prev => prev.filter(m => m.id !== id));
  };

  // User Progress (stored in backpack/{userId}.user.userProgress)
  const updateProgress = async (progress: UserProgress) => {
    const progressId = progress.id || `prog_${progress.userId}_${progress.courseId}`;
    const cleaned = sanitizeForFirestore({ ...progress, id: progressId });

    if (progress.userId) {
      await updateBackpackUserField<UserProgress>(progress.userId, 'userProgress', (list) => {
        const existingIdx = list.findIndex(p => p.userId === progress.userId && p.courseId === progress.courseId);
        if (existingIdx >= 0) {
          const updated = [...list];
          updated[existingIdx] = cleaned;
          return updated;
        }
        return [...list, cleaned];
      });
    }

    setUserProgress(prev => {
      const idx = prev.findIndex(p => p.userId === progress.userId && p.courseId === progress.courseId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = cleaned;
        return updated;
      }
      return [...prev, cleaned];
    });
  };

  // Materials (stored in backpack/{targetId}.user.materials)
  const addMaterial = async (material: Material) => {
    const matId = material.id || `mat_${Math.random().toString(36).substring(2, 15)}`;
    const cleaned = sanitizeForFirestore({ ...material, id: matId });
    const targetUid = currentUser?.id || '';

    if (targetUid) {
      await updateBackpackUserField<Material>(targetUid, 'materials', (list) => [...list, cleaned]);
    }
    setMaterials(prev => [...prev, cleaned]);
  };

  // Attendance Records (stored in backpack/{targetId}.user.attendance)
  const addAttendanceRecord = async (record: AttendanceRecord) => {
    const attId = record.id || `att_${Date.now()}_${record.courseId}`;
    const cleaned = sanitizeForFirestore({ ...record, id: attId });
    const targetUid = currentUser?.id || '';

    if (targetUid) {
      await updateBackpackUserField<AttendanceRecord>(targetUid, 'attendance', (list) => [...list, cleaned]);
    }
    setAttendanceRecords(prev => [...prev, cleaned]);
  };

  // Assessments (stored in backpack/{targetId}.user.assessments)
  const addAssessment = async (assessment: Assessment) => {
    const cleaned = sanitizeForFirestore(assessment);
    const targetUid = currentUser?.id || '';

    if (targetUid) {
      await updateBackpackUserField<Assessment>(targetUid, 'assessments', (list) => [...list.filter(a => a.id !== assessment.id), cleaned]);
    }
    setAssessments(prev => [...prev.filter(a => a.id !== assessment.id), cleaned]);
  };

  // Submissions (stored in student's backpack & course instructor's backpack)
  const addSubmission = async (submission: Submission) => {
    const cleaned = sanitizeForFirestore(submission);
    if (submission.userId) {
      await updateBackpackUserField<Submission>(submission.userId, 'submissions', (list) => [...list.filter(s => s.id !== submission.id), cleaned]);
    }
    setSubmissions(prev => [...prev.filter(s => s.id !== submission.id), cleaned]);
  };

  const updateSubmissionScore = async (id: string, score: number, feedback?: string, detailedAnswers?: QuestionAnswer[], manualScore?: number) => {
    const sub = submissions.find(s => s.id === id);
    const updatedFields: Partial<Submission> = {
      score,
      feedback: feedback || '',
      status: 'graded',
      gradedAt: new Date().toISOString()
    };
    if (detailedAnswers) updatedFields.answers = detailedAnswers;
    if (manualScore !== undefined) updatedFields.manualScore = manualScore;

    if (sub && sub.userId) {
      await updateBackpackUserField<Submission>(sub.userId, 'submissions', (list) =>
        list.map(s => s.id === id ? { ...s, ...updatedFields } : s)
      );
    }
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, ...updatedFields } : s));
  };

  // Schedule Events (stored in backpack/{targetId}.user.scheduleEvents)
  const addScheduleEvent = async (event: ScheduleEvent) => {
    const cleaned = sanitizeForFirestore(event);
    const targetUid = currentUser?.id || '';

    if (targetUid) {
      await updateBackpackUserField<ScheduleEvent>(targetUid, 'scheduleEvents', (list) => [...list.filter(e => e.id !== event.id), cleaned]);
    }
    setScheduleEvents(prev => [...prev.filter(e => e.id !== event.id), cleaned]);
  };

  const updateScheduleEvent = async (id: string, updates: Partial<ScheduleEvent>) => {
    const targetUid = currentUser?.id || '';
    if (targetUid) {
      await updateBackpackUserField<ScheduleEvent>(targetUid, 'scheduleEvents', (list) =>
        list.map(e => e.id === id ? { ...e, ...updates } : e)
      );
    }

    setScheduleEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    if (updates.isActive) {
      const evt = scheduleEvents.find(e => e.id === id);
      // Organization and instructors who initiated should not get call notification
      const isInitiator = currentUser?.id && (evt?.instructorId === currentUser.id || evt?.creatorId === currentUser.id || evt?.orgId === currentUser.id);
      if (evt && !isInitiator) {
        addNotification({
          title: `📹 Live Class Started: ${evt.title}`,
          message: `The live stream for this class has officially started. Click to join now!`,
          type: 'live_class',
          linkUrl: `/course/${evt.courseId}?liveCall=true`
        });
      }
    }
  };

  const deleteScheduleEvent = async (id: string) => {
    const targetUid = currentUser?.id || '';
    if (targetUid) {
      await updateBackpackUserField<ScheduleEvent>(targetUid, 'scheduleEvents', (list) =>
        list.filter(e => e.id !== id)
      );
    }
    setScheduleEvents(prev => prev.filter(e => e.id !== id));
  };

  // Real-time course chat messages
  const sendMessage = async (msg: ChatMessage) => {
    const cleaned = sanitizeForFirestore(msg);
    const course = courses.find(c => c.id === msg.courseId);
    const targetUid = course?.orgId || currentUser?.id || '';
    await updateBackpackUserField<ChatMessage>(targetUid, 'messages', (list) => [...list, cleaned]);
  };

  return (
    <AppContext.Provider value={{
      organizations, courses, enrollmentRequests, orgJoinRequests, orgMembers, userProgress, materials, attendanceRecords, assessments, submissions, scheduleEvents, notifications,
      addOrganization, updateOrganization, deleteOrganization, addCourse, updateCourse, addEnrollmentRequest, updateEnrollmentRequest, cancelEnrollmentRequest, openCourseAdmission, closeCourseAdmission, createCourseAdmissionSession, updateCourseAdmissionSession, addOrgJoinRequest, updateOrgJoinRequest, addOrgMember, updateOrgMember, deleteOrgMember, updateProgress, addMaterial, addAttendanceRecord, sendMessage, addAssessment, addSubmission, updateSubmissionScore, addScheduleEvent, updateScheduleEvent, deleteScheduleEvent, addNotification, markNotificationRead, markAllNotificationsRead, clearNotifications
    }}>
      {children}
    </AppContext.Provider>
  );

};

// eslint-disable-next-line react-refresh/only-export-components
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};
