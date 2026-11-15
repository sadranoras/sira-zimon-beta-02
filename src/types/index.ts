export type GradeLevel = 'دهم' | 'یازدهم' | 'دوازدهم' | 'جامع کنکور';
export type StudentGrade = 'دهم' | 'یازدهم' | 'دوازدهم' | 'فارغ‌التحصیل';
export type StudyField = 'علوم تجربی' | 'ریاضی و فیزیک' | 'ادبیات و علوم انسانی';
export type CourseCategory = 'زیست‌شناسی' | 'شیمی' | 'فیزیک' | 'ریاضی' | 'جمع‌بندی CPR';
export type ExamDifficulty = 'استاندارد' | 'سطح کنکور' | 'چالشی';
export type QuestionDifficulty = 'ساده' | 'متوسط' | 'دشوار';
export type BookletCategory = 'جزوه کلاسی' | 'نکات ترکیبی' | 'بانک تست' | 'برنامه راهبردی';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  phone?: string;
  grade: StudentGrade;
  field: StudyField;
  diamondActive: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AdminRecord {
  uid: string;
  email: string;
  grantedBy: string;
  createdAt?: unknown;
}

export interface CourseLesson {
  id: string;
  order: number;
  title: string;
  durationMinutes: number;
  isFreePreview: boolean;
  videoTopic: string;
  videoUrl?: string;
  bookletTitle?: string;
  bookletUrl?: string;
  keyPoints: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Course {
  id: string;
  title: string;
  subtitle: string;
  instructor: string;
  instructorTitle: string;
  grade: GradeLevel;
  category: CourseCategory;
  price: number;
  discountPrice?: number;
  durationHours: number;
  sessionsCount: number;
  imageUrl: string;
  description: string;
  isDiamondIncluded: boolean;
  featured: boolean;
  isSeedOnly?: boolean;
  lessons?: CourseLesson[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ExamQuestion {
  id: string;
  order: number;
  subject: string;
  topic: string;
  stem: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correctOption: number; // 0..3
  explanation: string;
  difficulty: QuestionDifficulty;
  createdAt?: unknown;
}

export interface Exam {
  id: string;
  title: string;
  code: string;
  subject: string;
  grade: GradeLevel;
  strategyWeek: string;
  scheduledDate: string;
  durationMinutes: number;
  totalQuestions: number;
  difficulty: ExamDifficulty;
  isActive: boolean;
  isDiamondIncluded: boolean;
  price: number;
  description: string;
  isSeedOnly?: boolean;
  questions?: ExamQuestion[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ExamAttempt {
  id: string;
  userId: string;
  studentName: string;
  examId: string;
  examTitle: string;
  correctCount: number;
  wrongCount: number;
  blankCount: number;
  totalQuestions: number;
  percentage: number;
  taraz: number;
  estimatedRank: number;
  timeSpentSeconds: number;
  answersMap: Record<string, number>;
  submittedAt?: unknown;
  submittedAtIso?: string;
}

export interface Booklet {
  id: string;
  title: string;
  subject: string;
  grade: GradeLevel;
  category: BookletCategory;
  pagesCount: number;
  fileSizeLabel: string;
  isFree: boolean;
  price: number;
  description: string;
  summaryContent: string;
  isSeedOnly?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Article {
  id: string;
  title: string;
  author: string;
  category: string;
  readMinutes: number;
  excerpt: string;
  content: string;
  publishedDate: string;
  featured: boolean;
  isSeedOnly?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  courseTitle: string;
  completedLessonIds: string[];
  enrolledAt?: unknown;
  updatedAt?: unknown;
}

export interface Order {
  id: string;
  userId: string;
  studentName: string;
  studentEmail: string;
  itemTitles: string[];
  itemIds: string[];
  includesDiamond: boolean;
  totalAmount: number;
  status: 'paid' | 'pending' | 'cancelled';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CartItem {
  id: string;
  type: 'course' | 'booklet' | 'diamond';
  title: string;
  subtitle: string;
  price: number;
}

export type TicketSubject =
  | 'زیست‌شناسی'
  | 'شیمی'
  | 'فیزیک'
  | 'ریاضی'
  | 'مشاوره و انتخاب رشته'
  | 'فنی و ثبت‌نام';

export type TicketStatus = 'open' | 'answered' | 'closed';

export interface Ticket {
  id: string;
  userId: string;
  studentName: string;
  studentEmail: string;
  subject: TicketSubject;
  courseTitle: string;
  title: string;
  questionBody: string;
  status: TicketStatus;
  instructorName: string;
  instructorReply: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  createdAtIso?: string;
}

export type NotificationPriority = 'شروع آزمون' | 'یادآور ۲۴ ساعته' | 'فوری' | 'تغییر زمان';
export type NotificationTargetGrade = 'همه' | GradeLevel;

export interface ExamNotification {
  id: string;
  examId: string;
  examTitle: string;
  title: string;
  message: string;
  targetGrade: NotificationTargetGrade;
  priority: NotificationPriority;
  scheduledStartIso: string;
  scheduledStartLabel: string;
  isActive: boolean;
  createdBy: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  createdAtIso?: string;
}

export interface UserNotificationState {
  userId: string;
  readNotificationIds: string[];
  subscribedExamIds: string[];
  remindMinutesBefore: 15 | 30 | 60 | 1440;
  browserAlertsEnabled: boolean;
  updatedAt?: unknown;
}

export type ThemeMode = 'light' | 'dark';

export type LiveClassStatus = 'scheduled' | 'live' | 'ended';
export type LiveClassMessageType = 'chat' | 'question' | 'hand-raise';

export type LiveClassMediaMode = 'none' | 'camera' | 'screen';

export interface LiveClass {
  id: string;
  title: string;
  courseId: string;
  courseTitle: string;
  instructorName: string;
  grade: GradeLevel;
  subject: string;
  scheduledLabel: string;
  startTimeIso?: string;
  endTimeIso?: string;
  status: LiveClassStatus;
  boardTitle: string;
  boardContent: string;
  streamUrl: string;
  isFree: boolean;
  isBoardOpen?: boolean;
  hostMediaMode?: LiveClassMediaMode;
  hostMicEnabled?: boolean;
  hostUid?: string;
  createdBy: string;
  isSeedOnly?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface LiveClassParticipant {
  userId: string;
  displayName: string;
  role: 'student' | 'instructor';
  canPublishMedia: boolean;
  cameraRequested: boolean;
  cameraActive: boolean;
  micActive: boolean;
  updatedAt?: unknown;
}

export interface LiveClassSignal {
  id: string;
  fromUid: string;
  toUid: string;
  type: 'offer' | 'answer' | 'ice';
  payload: string;
  createdAt?: unknown;
}

export interface LiveClassMessage {
  id: string;
  userId: string;
  senderName: string;
  senderRole: 'student' | 'instructor';
  messageType: LiveClassMessageType;
  text: string;
  isPinned: boolean;
  isAnswered: boolean;
  createdAt?: unknown;
  createdAtIso?: string;
}

export interface LiveClassStroke {
  id: string;
  color: string;
  width: number;
  path: string;
  createdBy: string;
  createdAt?: unknown;
}

export type StudentTab =
  | 'overview'
  | 'courses'
  | 'exams'
  | 'analyzer'
  | 'major-sim'
  | 'tickets'
  | 'notifications'
  | 'orders'
  | 'profile';

export type AppView =
  | 'home'
  | 'courses'
  | 'course-detail'
  | 'exams'
  | 'exam-runner'
  | 'report-card'
  | 'booklets'
  | 'articles'
  | 'live-classroom'
  | 'student-panel'
  | 'admin-panel';
