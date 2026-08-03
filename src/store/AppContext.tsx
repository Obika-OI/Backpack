import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, updateDoc, doc, setDoc } from 'firebase/firestore';
import { Assessment, Submission, ScheduleEvent, Organization, Course, EnrollmentRequest, UserProgress, AttendanceRecord, Material, ChatMessage, OrgJoinRequest, OrgMember } from '../types';
import { useAuth } from './AuthContext';

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
  
  addOrganization: (org: Organization) => Promise<void>;
  addCourse: (course: Course) => Promise<void>;
  updateCourse: (courseId: string, updates: Partial<Course>) => Promise<void>;
  addEnrollmentRequest: (req: EnrollmentRequest) => Promise<void>;
  updateEnrollmentRequest: (id: string, status: 'approved' | 'rejected') => Promise<void>;
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
  updateSubmissionScore: (id: string, score: number, feedback: string) => Promise<void>;
  addScheduleEvent: (event: ScheduleEvent) => Promise<void>;
  updateScheduleEvent: (id: string, updates: Partial<ScheduleEvent>) => Promise<void>;
}

const AppContext = createContext<AppState | undefined>(undefined);

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

  useEffect(() => {
    const fetchGlobalData = async () => {
      try {
        const orgSnap = await getDocs(collection(db, 'organizations'));
        setOrganizations(orgSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Organization)));

        const courseSnap = await getDocs(collection(db, 'courses'));
        setCourses(courseSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course)));

        const memSnap = await getDocs(collection(db, 'orgMembers'));
        setOrgMembers(memSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as OrgMember)));
      } catch (err) {
        console.error(err);
      }
    };
    fetchGlobalData();
  }, []);

  useEffect(() => {
    if (currentUser) {
      const fetchUserData = async () => {
        try {
          const reqSnap = await getDocs(collection(db, 'enrollmentRequests'));
          setEnrollmentRequests(reqSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as EnrollmentRequest)));

          const orgReqSnap = await getDocs(collection(db, 'orgJoinRequests'));
          setOrgJoinRequests(orgReqSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as OrgJoinRequest)));

          const progSnap = await getDocs(collection(db, 'userProgress'));
          setUserProgress(progSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProgress)));

          const matSnap = await getDocs(collection(db, 'materials'));
          setMaterials(matSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Material)));

          const attSnap = await getDocs(collection(db, 'attendance'));
          setAttendanceRecords(attSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord)));
          
          const asstSnap = await getDocs(collection(db, 'assessments'));
          setAssessments(asstSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assessment)));
          
          const subSnap = await getDocs(collection(db, 'submissions'));
          setSubmissions(subSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission)));
          
          const schSnap = await getDocs(collection(db, 'scheduleEvents'));
          setScheduleEvents(schSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduleEvent)));
        } catch (err) {
          console.error(err);
        }
      };
      fetchUserData();
    } else {
      const clearData = () => {
        setEnrollmentRequests([]);
        setOrgJoinRequests([]);
        setUserProgress([]);
        setMaterials([]);
        setAttendanceRecords([]);
        setAssessments([]);
        setSubmissions([]);
        setScheduleEvents([]);
      };
      clearData();
    }
  }, [currentUser]);

  const addOrganization = async (org: Organization) => {
    await setDoc(doc(db, 'organizations', org.id), org);
    setOrganizations(prev => [...prev, org]);
  };
  
  const addCourse = async (course: Course) => {
    await setDoc(doc(db, 'courses', course.id), course);
    setCourses(prev => [...prev, course]);
  };

  const updateCourse = async (courseId: string, updates: Partial<Course>) => {
    const courseRef = doc(db, 'courses', courseId);
    await updateDoc(courseRef, updates);
    setCourses(prev => prev.map(c => c.id === courseId ? { ...c, ...updates } : c));
  };

  const addEnrollmentRequest = async (req: EnrollmentRequest) => {
    await setDoc(doc(db, 'enrollmentRequests', req.id), req);
    setEnrollmentRequests(prev => [...prev, req]);
  };

  const updateEnrollmentRequest = async (id: string, status: 'approved' | 'rejected') => {
    await updateDoc(doc(db, 'enrollmentRequests', id), { status });
    setEnrollmentRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const addOrgJoinRequest = async (req: OrgJoinRequest) => {
    await setDoc(doc(db, 'orgJoinRequests', req.id), req);
    setOrgJoinRequests(prev => [...prev, req]);
  };

  const updateOrgJoinRequest = async (id: string, status: 'approved' | 'rejected') => {
    await updateDoc(doc(db, 'orgJoinRequests', id), { status });
    setOrgJoinRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const addOrgMember = async (member: OrgMember) => {
    await setDoc(doc(db, 'orgMembers', member.id), member);
    setOrgMembers(prev => [...prev.filter(m => m.id !== member.id), member]);
  };

  const updateOrgMember = async (id: string, updates: Partial<OrgMember>) => {
    await updateDoc(doc(db, 'orgMembers', id), updates);
    setOrgMembers(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const deleteOrgMember = async (id: string) => {
    try {
      await updateDoc(doc(db, 'orgMembers', id), { status: 'rejected' });
    } catch {
      // ignore
    }
    setOrgMembers(prev => prev.filter(m => m.id !== id));
  };

  const updateProgress = async (progress: UserProgress) => {
    const existing = userProgress.find(p => p.userId === progress.userId && p.courseId === progress.courseId);
    if (existing && existing.id) {
      await updateDoc(doc(db, 'userProgress', existing.id), { ...progress });
      setUserProgress(prev => prev.map(p => p.id === existing.id ? { ...p, ...progress } : p));
    } else {
      const docRef = await addDoc(collection(db, 'userProgress'), progress);
      setUserProgress(prev => [...prev, { ...progress, id: docRef.id }]);
    }
  };

  const addMaterial = async (material: Material) => {
    const docRef = await addDoc(collection(db, 'materials'), material);
    setMaterials(prev => [...prev, { ...material, id: docRef.id }]);
  };

  const addAttendanceRecord = async (record: AttendanceRecord) => {
    const docRef = await addDoc(collection(db, 'attendance'), record);
    setAttendanceRecords(prev => [...prev, { ...record, id: docRef.id }]);
  };

  const addAssessment = async (assessment: Assessment) => {
    await setDoc(doc(db, 'assessments', assessment.id), assessment);
    setAssessments(prev => [...prev, assessment]);
  };

  const addSubmission = async (submission: Submission) => {
    await setDoc(doc(db, 'submissions', submission.id), submission);
    setSubmissions(prev => [...prev, submission]);
  };

  const updateSubmissionScore = async (id: string, score: number, feedback: string) => {
    await updateDoc(doc(db, 'submissions', id), { score, feedback, status: 'graded' });
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, score, feedback, status: 'graded' } : s));
  };

  const addScheduleEvent = async (event: ScheduleEvent) => {
    await setDoc(doc(db, 'scheduleEvents', event.id), event);
    setScheduleEvents(prev => [...prev, event]);
  };

  const updateScheduleEvent = async (id: string, updates: Partial<ScheduleEvent>) => {
    await updateDoc(doc(db, 'scheduleEvents', id), updates);
    setScheduleEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const sendMessage = async (msg: ChatMessage) => {
    await addDoc(collection(db, 'messages'), msg);
  };

  return (
    <AppContext.Provider value={{
      organizations, courses, enrollmentRequests, orgJoinRequests, orgMembers, userProgress, materials, attendanceRecords, assessments, submissions, scheduleEvents,
      addOrganization, addCourse, updateCourse, addEnrollmentRequest, updateEnrollmentRequest, addOrgJoinRequest, updateOrgJoinRequest, addOrgMember, updateOrgMember, deleteOrgMember, updateProgress, addMaterial, addAttendanceRecord, sendMessage, addAssessment, addSubmission, updateSubmissionScore, addScheduleEvent, updateScheduleEvent
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
