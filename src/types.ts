export type Role = 'student' | 'organization' | 'instructor';

export interface User {
  id: string;
  name: string;
  role: Role;
  email: string;
}

export interface Organization {
  id: string;
  name: string;
  description: string;
  logoUrl?: string;
  ownerId: string;
  baseCurrency: string;
  location?: string;
  orgType?: 'basic' | 'higher' | 'vocational';
}

export interface Course {
  id: string;
  orgId: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  paymentTerms?: 'one-time' | 'installment';
  requirements?: string;
  applicationProcess?: string;
  instructorRequirements?: string;
  modules: CourseModule[];
}

export interface CourseModule {
  id: string;
  title: string;
  content: string;
}

export interface OrgJoinRequest {
  id: string;
  userId: string;
  orgId: string;
  userName: string;
  orgName: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface EnrollmentRequest {
  id: string;
  userId: string;
  orgId: string;
  courseId: string;
  status: 'pending' | 'approved' | 'rejected';
  userName?: string;
  courseTitle?: string;
}

export interface UserProgress {
  id?: string;
  userId: string;
  courseId: string;
  completedModuleIds: string[];
  performanceScore: number;
}

export interface AttendanceRecord {
  id?: string;
  courseId: string;
  date: string;
  records: Record<string, boolean>; // userId -> isPresent
}

export interface Material {
  id?: string;
  courseId: string;
  title: string;
  url: string;
  type: 'pdf' | 'doc' | 'video' | 'link';
}

export interface OrgMember {
  id: string;
  orgId: string;
  userId?: string;
  name: string;
  email: string;
  role: 'instructor' | 'student';
  department?: string;
  courseIds?: string[];
  joinedAt: string;
  status: 'active' | 'invited' | 'pending' | 'graduated';
}

export interface ChatMessage {
  id?: string;
  courseId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface Assessment {
  id: string;
  courseId: string;
  title: string;
  type: 'assignment' | 'test' | 'exam' | 'project';
  maxScore: number;
  dueDate: string;
  isGroup?: boolean;
}

export interface Submission {
  id: string;
  assessmentId: string;
  userId: string;
  courseId: string;
  submittedAt: string;
  content: string; // URL or text
  score?: number;
  feedback?: string;
  status: 'submitted' | 'graded';
}

export interface ScheduleEvent {
  id: string;
  courseId: string;
  title: string;
  date: string;
  time: string;
  durationMins: number;
  type: 'lecture' | 'meeting' | 'exam';
  meetingUrl?: string; // For the video call
  isActive?: boolean;
}
