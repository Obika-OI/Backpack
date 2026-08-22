export type Role = 'student' | 'organization' | 'instructor' | 'admin';

export interface PaystackSubaccount {
  subaccount_code: string;
  business_name: string;
  bank_code: string;
  bank_name?: string;
  account_number: string;
  account_name?: string;
  percentage_charge: number; // e.g., 90 (%) goes to provider, 10% to platform
  description?: string;
  is_verified?: boolean;
  updatedAt?: string;
}

export interface PaystackSplitTransaction {
  id: string;
  reference: string;
  courseId: string;
  courseTitle: string;
  studentId: string;
  studentEmail: string;
  providerId: string;
  providerType: 'organization' | 'instructor';
  providerName: string;
  subaccountCode: string;
  totalAmount: number;
  providerShareAmount: number;
  platformFeeAmount: number;
  percentageCharge: number;
  currency: string;
  status: 'initialized' | 'success' | 'failed';
  createdAt: string;
  paymentUrl?: string;
}

export interface UserDocument {
  id: string;
  title: string;
  url: string;
  category: 'cv' | 'certificate' | 'id_proof' | 'transcript' | 'other';
  uploadedAt: string;
}

export interface SpecialNeedsAccommodation {
  categories?: ('visual' | 'hearing' | 'adhd_dyslexia' | 'mobility' | 'chronic_health' | 'other')[];
  extraTimeMultiplier?: number; // 1.0 = none, 1.5 = +50%, 2.0 = +100%
  dyslexiaFont?: boolean;
  colorFilter?: 'none' | 'soft-yellow' | 'sepia' | 'calm-green' | 'high-contrast-dark' | 'high-contrast-light';
  textSize?: 'normal' | 'large' | 'xlarge';
  lineSpacing?: 'normal' | 'relaxed' | 'double';
  screenReaderAssist?: boolean;
  readingRuler?: boolean;
  reducedMotion?: boolean;
  healthConditionsNotes?: string;
  emergencyCarePlan?: string;
}

export interface User {
  id: string;
  name: string;
  role: Role;
  email: string;
  bio?: string;
  headline?: string;
  cvUrl?: string;
  kycVerified?: boolean;
  kycDocumentUrl?: string;
  userDocuments?: UserDocument[];
  accommodations?: SpecialNeedsAccommodation;
  paystackSubaccount?: PaystackSubaccount;
  createdAt?: string;

  // Organization attributes stored directly in personalInformation map
  description?: string;
  location?: string;
  baseCurrency?: string;
  orgType?: 'basic' | 'higher' | 'vocational';
  address?: string;
  registrationId?: string;
  isAccredited?: boolean;
  accreditingBody?: string;
  accreditationStatus?: 'accredited' | 'pending' | 'unaccredited';
  accreditationDocUrl?: string;
  ownerId?: string;
  logoUrl?: string;
  motto?: string;
  phone?: string;
  website?: string;
  themeColor?: string;
  academicHighlights?: string[];
  isDeleted?: boolean;
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
  kycVerified?: boolean;
  kycDocumentUrl?: string;
  address?: string;
  registrationId?: string;
  isAccredited?: boolean;
  accreditingBody?: string;
  accreditationStatus?: 'accredited' | 'pending' | 'unaccredited';
  accreditationDocUrl?: string;
  motto?: string;
  phone?: string;
  website?: string;
  themeColor?: string;
  academicHighlights?: string[];
  isDeleted?: boolean;
  paystackSubaccount?: PaystackSubaccount;
}

export interface AdmissionSession {
  id: string;
  name: string; // e.g. "2026/2027 Session", "Fall 2026 Cohort", "Batch A - 2026"
  status: 'open' | 'closed';
  startDate?: string;
  endDate?: string;
  applicationDeadline?: string;
  academicYear?: string;
  notes?: string;
  createdAt: string;
  closedAt?: string;
}

export interface Course {
  id: string;
  orgId: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  paymentTerms?: 'one-time' | 'installment';
  paymentTermsAllowed?: 'one-time' | 'installment' | 'both';
  installmentInterval?: 'weekly' | 'monthly' | 'custom';
  customMilestonesText?: string;
  qualificationTitle?: string;
  qualificationType?: 'bachelors' | 'masters' | 'doctorate' | 'diploma' | 'certificate' | 'professional' | 'other';
  instructorName?: string;
  instructorId?: string;
  requiredDocuments?: string[];
  requirements?: string;
  applicationProcess?: string;
  instructorRequirements?: string;
  admissionStatus?: 'open' | 'closed'; // 'open' = accepting applications, 'closed' = admissions closed
  activeSessionId?: string;
  activeSessionName?: string;
  admissionSessions?: AdmissionSession[];
  modules: CourseModule[];
  certificateConfig?: { enabled: boolean; logoUrl?: string; signatureUrl?: string; customText?: string; orgName?: string; gradeLevel?: string; authorizedSealUrl?: string; qualificationTitle?: string };
}

export interface CourseModuleMedia {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video' | 'document';
}

export interface CourseModule {
  id: string;
  title: string;
  content: string;
  fileUrls?: string[];
  media?: CourseModuleMedia[];
}

export interface OrgJoinRequest {
  id: string;
  userId: string;
  orgId: string;
  userName: string;
  orgName: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface ReapplicationRecord {
  id: string;
  sessionId?: string;
  sessionName?: string;
  appliedAt: string;
  status: 'rejected' | 'cancelled';
  rejectedAt?: string;
  rejectionReason?: string;
}

export interface EnrollmentRequest {
  id: string;
  userId: string;
  orgId: string;
  courseId: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  paymentStatus?: 'unpaid' | 'paid';
  userName?: string;
  userEmail?: string;
  courseTitle?: string;
  paymentMethod?: 'one-time' | 'installment';
  sessionId?: string;
  sessionName?: string;
  documents?: Record<string, string>; // docName -> fileUrl
  additionalDocuments?: Array<{ id: string; name: string; url: string }>;
  requirementAnswers?: Record<string, string>;
  studentNotes?: string;
  accommodationsRequested?: SpecialNeedsAccommodation;
  requirementFileUrl?: string;
  appliedAt?: string;
  cancelledAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  rejectedSessionId?: string;
  reapplicationHistory?: ReapplicationRecord[];
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
  role: 'instructor' | 'student' | 'admin';
  department?: string;
  courseIds?: string[];
  joinedAt: string;
  status: 'active' | 'invited' | 'pending' | 'graduated' | 'suspended';
  requiresPayment?: boolean;
  requiresDocuments?: boolean;
  requiredDocNames?: string[];
  inviteNote?: string;
}

export interface ChatMessage {
  id?: string;
  courseId: string;
  senderId: string;
  senderName: string;
  senderRole?: Role;
  text: string;
  timestamp: number;
  fileUrl?: string;
  fileType?: 'image' | 'video' | 'document';
  fileName?: string;
}

export interface OrgChatMessage {
  id: string;
  orgId: string;
  senderId: string;
  senderName: string;
  senderEmail?: string;
  senderRole?: Role;
  recipientId?: string; // If set, 1-on-1 direct message between sender and recipient in org. If null/empty, org lounge public message.
  recipientName?: string;
  text: string;
  timestamp: number;
  fileUrl?: string;
  fileName?: string;
  fileType?: 'image' | 'video' | 'document';
}

export type QuestionType = 'mcq' | 'short_answer' | 'long_answer' | 'project';

export interface AssessmentQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  points: number;
  options?: string[]; // for MCQ
  correctOptionIndex?: number; // for MCQ auto-mark
  acceptableAnswers?: string[]; // for Short Answer auto-mark (multiple acceptable variations, case-insensitive)
  rubricGuidelines?: string; // for Long answer / Project
  attachmentUrl?: string; // Optional brief or prompt attachment
  attachmentName?: string;
  allowFileUpload?: boolean;
}

export interface QuestionAnswer {
  questionId: string;
  type: QuestionType;
  selectedOptionIndex?: number;
  textAnswer?: string;
  fileUrl?: string;
  fileName?: string;
  autoScore?: number;
  manualScore?: number;
  finalScore?: number;
  feedback?: string;
  isAutoMarked?: boolean;
}

export interface Assessment {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  instructions?: string;
  type: 'assignment' | 'test' | 'exam' | 'project';
  maxScore: number;
  dueDate: string;
  isGroup?: boolean;
  questions?: AssessmentQuestion[];
  projectBriefUrl?: string;
  projectBriefName?: string;
  allowFileUpload?: boolean;
  timeLimitMinutes?: number;
  createdAt?: string;
}

export interface Submission {
  id: string;
  assessmentId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  courseId: string;
  submittedAt: string;
  content?: string;
  fileUrl?: string;
  fileName?: string;
  answers?: QuestionAnswer[];
  autoScore?: number;
  manualScore?: number;
  score?: number;
  feedback?: string;
  status: 'submitted' | 'graded';
  gradedAt?: string;
  gradedBy?: string;
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
  creatorId?: string;
  instructorId?: string;
  orgId?: string;
}

export interface AppNotification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: 'live_class' | 'enrollment' | 'grade' | 'material' | 'info';
  read: boolean;
  createdAt: string;
  linkUrl?: string;
}

