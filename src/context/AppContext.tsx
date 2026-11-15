import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  auth,
  BOOTSTRAP_ADMIN_EMAIL,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import {
  DIAMOND_PACKAGE,
  SEED_ARTICLES,
  SEED_BOOKLETS,
  SEED_COURSES,
  SEED_EXAM_NOTIFICATIONS,
  SEED_EXAMS,
  SEED_LIVE_CLASSES,
} from '../data/seedData';
import type {
  AdminRecord,
  AppView,
  Article,
  Booklet,
  CartItem,
  Course,
  CourseLesson,
  Enrollment,
  Exam,
  ExamAttempt,
  ExamNotification,
  ExamQuestion,
  GradeLevel,
  LiveClass,
  LiveClassMediaMode,
  LiveClassMessage,
  LiveClassMessageType,
  LiveClassParticipant,
  LiveClassSignal,
  LiveClassStatus,
  LiveClassStroke,
  NotificationPriority,
  NotificationTargetGrade,
  Order,
  StudentGrade,
  StudentTab,
  StudyField,
  ThemeMode,
  Ticket,
  TicketStatus,
  TicketSubject,
  UserNotificationState,
  UserProfile,
} from '../types';
import { normalizeIranPhone, phoneToSyntheticEmail, slugifySafeId } from '../utils/formatters';
import { analyzeKonkurResult, getBenchmarkForDifficulty } from '../utils/konkurAnalytics';

interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextValue {
  user: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  hasDiamondAccess: boolean;
  authLoading: boolean;
  dataLoading: boolean;
  catalogFromFirestore: boolean;

  theme: ThemeMode;
  toggleTheme: () => void;

  view: AppView;
  setView: (view: AppView) => void;
  studentPanelTab: StudentTab;
  setStudentPanelTab: (tab: StudentTab) => void;
  openStudentPanelTab: (tab: StudentTab) => void;
  selectedCourseId: string | null;
  openCourseDetail: (courseId: string) => void;
  selectedExamId: string | null;
  startExamRunner: (examId: string) => void;
  selectedAttempt: ExamAttempt | null;
  openReportCard: (attempt: ExamAttempt) => void;
  selectedLiveClassId: string | null;
  openLiveClass: (classId?: string) => void;

  courses: Course[];
  exams: Exam[];
  booklets: Booklet[];
  articles: Article[];
  liveClasses: LiveClass[];
  enrollments: Enrollment[];
  examAttempts: ExamAttempt[];
  orders: Order[];
  tickets: Ticket[];
  examNotifications: ExamNotification[];
  notificationState: UserNotificationState;
  unreadNotificationsCount: number;

  // Admin datasets
  allUsers: UserProfile[];
  allOrders: Order[];
  allAttempts: ExamAttempt[];
  allTickets: Ticket[];
  adminRecords: AdminRecord[];

  // Cart
  cart: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  checkoutCart: () => Promise<boolean>;

  // Auth & Profile
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  openAuthModal: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithPhonePassword: (
    phone: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string }>;
  registerWithPhonePassword: (
    displayName: string,
    phone: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateMyProfile: (displayName: string, grade: StudentGrade, field: StudyField) => Promise<void>;

  // Course & Exam interactions
  fetchCourseLessons: (courseId: string) => Promise<CourseLesson[]>;
  fetchExamQuestions: (examId: string) => Promise<ExamQuestion[]>;
  isEnrolledInCourse: (courseId: string) => boolean;
  toggleLessonComplete: (courseId: string, courseTitle: string, lessonId: string) => Promise<void>;
  submitExamAttempt: (
    exam: Exam,
    questions: ExamQuestion[],
    answersMap: Record<string, number>,
    timeSpentSeconds: number,
    options?: { isAutoTimeout?: boolean }
  ) => Promise<ExamAttempt>;

  // Admin actions
  seedDatabase: () => Promise<void>;
  saveCourse: (course: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>, existingId?: string) => Promise<string>;
  deleteCourse: (courseId: string) => Promise<void>;
  saveCourseLesson: (
    courseId: string,
    lesson: Omit<CourseLesson, 'id' | 'createdAt' | 'updatedAt'>,
    existingLessonId?: string
  ) => Promise<void>;
  deleteCourseLesson: (courseId: string, lessonId: string) => Promise<void>;

  saveExam: (exam: Omit<Exam, 'id' | 'createdAt' | 'updatedAt'>, existingId?: string) => Promise<string>;
  deleteExam: (examId: string) => Promise<void>;
  saveExamQuestion: (
    examId: string,
    question: Omit<ExamQuestion, 'id' | 'createdAt'>,
    existingQuestionId?: string
  ) => Promise<void>;
  deleteExamQuestion: (examId: string, questionId: string) => Promise<void>;

  saveBooklet: (booklet: Omit<Booklet, 'id' | 'createdAt' | 'updatedAt'>, existingId?: string) => Promise<void>;
  deleteBooklet: (bookletId: string) => Promise<void>;
  saveArticle: (article: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>, existingId?: string) => Promise<void>;
  deleteArticle: (articleId: string) => Promise<void>;

  toggleUserDiamond: (targetUid: string, currentState: boolean) => Promise<void>;
  updateOrderStatus: (orderId: string, status: 'paid' | 'pending' | 'cancelled') => Promise<void>;
  grantAdminRole: (targetUid: string, email: string) => Promise<void>;
  revokeAdminRole: (targetUid: string) => Promise<void>;

  // Ticketing actions
  createTicket: (payload: {
    subject: TicketSubject;
    courseTitle: string;
    title: string;
    questionBody: string;
  }) => Promise<boolean>;
  replyToTicket: (
    ticketId: string,
    instructorName: string,
    instructorReply: string,
    status: Extract<TicketStatus, 'answered' | 'closed'>
  ) => Promise<void>;
  closeTicket: (ticketId: string) => Promise<void>;
  deleteTicket: (ticketId: string) => Promise<void>;

  // Notification actions
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: (notificationIds: string[]) => Promise<void>;
  toggleExamReminder: (examId: string) => Promise<void>;
  updateNotificationPreferences: (
    remindMinutesBefore: 15 | 30 | 60 | 1440,
    browserAlertsEnabled: boolean
  ) => Promise<void>;
  saveExamNotification: (
    payload: {
      examId: string;
      examTitle: string;
      title: string;
      message: string;
      targetGrade: NotificationTargetGrade;
      priority: NotificationPriority;
      scheduledStartIso: string;
      scheduledStartLabel: string;
      isActive: boolean;
    },
    existingId?: string
  ) => Promise<void>;
  toggleExamNotificationActive: (notification: ExamNotification) => Promise<void>;
  deleteExamNotification: (notificationId: string) => Promise<void>;

  // Live online classroom actions
  saveLiveClass: (
    payload: {
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
    },
    existingId?: string
  ) => Promise<string | undefined>;
  updateLiveClassBoard: (
    classId: string,
    boardTitle: string,
    boardContent: string,
    streamUrl?: string
  ) => Promise<void>;
  setLiveClassStatus: (liveClass: LiveClass, status: LiveClassStatus) => Promise<void>;
  toggleLiveClassBoard: (liveClass: LiveClass, isBoardOpen: boolean) => Promise<void>;
  updateHostMediaState: (
    classId: string,
    mediaMode: LiveClassMediaMode,
    micEnabled: boolean
  ) => Promise<void>;
  deleteLiveClass: (classId: string) => Promise<void>;
  subscribeLiveClassMessages: (
    classId: string,
    callback: (messages: LiveClassMessage[]) => void
  ) => () => void;
  sendLiveClassMessage: (
    classId: string,
    text: string,
    messageType: LiveClassMessageType
  ) => Promise<boolean>;
  updateLiveClassMessageModeration: (
    classId: string,
    messageId: string,
    patch: { isPinned?: boolean; isAnswered?: boolean }
  ) => Promise<void>;
  deleteLiveClassMessage: (classId: string, messageId: string) => Promise<void>;
  subscribeLiveClassStrokes: (
    classId: string,
    callback: (strokes: LiveClassStroke[]) => void
  ) => () => void;
  addLiveClassStroke: (
    classId: string,
    stroke: { color: string; width: number; path: string }
  ) => Promise<void>;
  clearLiveClassStrokes: (classId: string, strokeIds: string[]) => Promise<void>;
  subscribeLiveClassParticipants: (
    classId: string,
    callback: (participants: LiveClassParticipant[]) => void
  ) => () => void;
  upsertMyLiveClassPresence: (
    classId: string,
    patch: { cameraRequested?: boolean; cameraActive?: boolean; micActive?: boolean }
  ) => Promise<void>;
  setParticipantMediaPermission: (
    classId: string,
    targetUserId: string,
    allowed: boolean
  ) => Promise<void>;
  subscribeLiveClassSignals: (
    classId: string,
    callback: (signals: LiveClassSignal[]) => void
  ) => () => void;
  sendLiveClassSignal: (
    classId: string,
    toUid: string,
    type: 'offer' | 'answer' | 'ice',
    payload: string
  ) => Promise<void>;
  consumeLiveClassSignal: (classId: string, signalId: string) => Promise<void>;

  toasts: ToastMessage[];
  notify: (text: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);

  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('biomaze_theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      // ignore storage errors
    }
    return 'light';
  });

  const [view, setView] = useState<AppView>('home');
  const [studentPanelTab, setStudentPanelTab] = useState<StudentTab>('overview');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [selectedAttempt, setSelectedAttempt] = useState<ExamAttempt | null>(null);
  const [selectedLiveClassId, setSelectedLiveClassId] = useState<string | null>(null);

  const [firestoreCourses, setFirestoreCourses] = useState<Course[] | null>(null);
  const [firestoreExams, setFirestoreExams] = useState<Exam[] | null>(null);
  const [firestoreBooklets, setFirestoreBooklets] = useState<Booklet[] | null>(null);
  const [firestoreArticles, setFirestoreArticles] = useState<Article[] | null>(null);
  const [firestoreExamNotifications, setFirestoreExamNotifications] = useState<
    ExamNotification[] | null
  >(null);
  const [firestoreLiveClasses, setFirestoreLiveClasses] = useState<LiveClass[] | null>(null);

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [examAttempts, setExamAttempts] = useState<ExamAttempt[]>(() => {
    try {
      const saved = localStorage.getItem('biomaze_local_attempts');
      return saved ? (JSON.parse(saved) as ExamAttempt[]) : [];
    } catch {
      return [];
    }
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [notificationState, setNotificationState] = useState<UserNotificationState>({
    userId: '',
    readNotificationIds: [],
    subscribedExamIds: [],
    remindMinutesBefore: 30,
    browserAlertsEnabled: false,
  });

  // Admin datasets
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allAttempts, setAllAttempts] = useState<ExamAttempt[]>([]);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [adminRecords, setAdminRecords] = useState<AdminRecord[]>([]);

  // Cart
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem('biomaze_cart');
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const notify = useCallback((text: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('biomaze_cart', JSON.stringify(cart));
    } catch {
      // ignore storage errors
    }
  }, [cart]);

  useEffect(() => {
    const isDark = theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    try {
      localStorage.setItem('biomaze_theme', theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Public catalog listeners
  useEffect(() => {
    const unsubCourses = onSnapshot(
      query(collection(db, 'courses'), orderBy('createdAt', 'desc')),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Course, 'id'>) }));
        setFirestoreCourses(list);
        setDataLoading(false);
      },
      (err) => {
        console.error(err);
        setFirestoreCourses([]);
        setDataLoading(false);
      }
    );

    const unsubExams = onSnapshot(
      query(collection(db, 'exams'), orderBy('createdAt', 'desc')),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Exam, 'id'>) }));
        setFirestoreExams(list);
      },
      (err) => {
        console.error(err);
        setFirestoreExams([]);
      }
    );

    const unsubBooklets = onSnapshot(
      query(collection(db, 'booklets'), orderBy('createdAt', 'desc')),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Booklet, 'id'>) }));
        setFirestoreBooklets(list);
      },
      (err) => {
        console.error(err);
        setFirestoreBooklets([]);
      }
    );

    const unsubArticles = onSnapshot(
      query(collection(db, 'articles'), orderBy('createdAt', 'desc')),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Article, 'id'>) }));
        setFirestoreArticles(list);
      },
      (err) => {
        console.error(err);
        setFirestoreArticles([]);
      }
    );

    const unsubExamNotifications = onSnapshot(
      query(collection(db, 'examNotifications'), orderBy('createdAt', 'desc')),
      (snap) => {
        const list = snap.docs.map((d) => {
          const raw = d.data() as Omit<ExamNotification, 'id'> & {
            createdAt?: { toDate?: () => Date };
          };
          return {
            id: d.id,
            ...raw,
            createdAtIso: raw.createdAt?.toDate?.()?.toISOString() || new Date(0).toISOString(),
          };
        });
        setFirestoreExamNotifications(list);
      },
      (err) => {
        console.error(err);
        setFirestoreExamNotifications([]);
      }
    );

    const unsubLiveClasses = onSnapshot(
      query(collection(db, 'liveClasses'), orderBy('createdAt', 'desc')),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<LiveClass, 'id'>),
        }));
        setFirestoreLiveClasses(list);
      },
      (err) => {
        console.error(err);
        setFirestoreLiveClasses([]);
      }
    );

    return () => {
      unsubCourses();
      unsubExams();
      unsubBooklets();
      unsubArticles();
      unsubExamNotifications();
      unsubLiveClasses();
    };
  }, []);

  // Auth listener & profile bootstrap
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setUserProfile(null);
        setIsAdmin(false);
        setEnrollments([]);
        setOrders([]);
        setTickets([]);
        setNotificationState({
          userId: '',
          readNotificationIds: [],
          subscribedExamIds: [],
          remindMinutesBefore: 30,
          browserAlertsEnabled: false,
        });
        setAllUsers([]);
        setAllOrders([]);
        setAllAttempts([]);
        setAllTickets([]);
        setAdminRecords([]);
        setAuthLoading(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          const phoneMatch = currentUser.email?.match(/^u(09\d{9})@phone\.biomaze\.ir$/i);
          const extractedPhone = phoneMatch ? phoneMatch[1] : undefined;
          const newProfile: UserProfile = {
            uid: currentUser.uid,
            displayName: currentUser.displayName || 'دانش‌آموز ماز',
            email: currentUser.email || '',
            ...(extractedPhone ? { phone: extractedPhone } : {}),
            grade: 'دوازدهم',
            field: 'علوم تجربی',
            diamondActive: false,
          };
          await setDoc(userRef, {
            ...newProfile,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          setUserProfile(newProfile);
        } else {
          setUserProfile(snap.data() as UserProfile);
        }

        // Check RBAC admin status
        const isBootstrapAdmin =
          currentUser.emailVerified &&
          currentUser.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
        if (isBootstrapAdmin) {
          setIsAdmin(true);
        } else {
          const adminSnap = await getDoc(doc(db, 'admins', currentUser.uid));
          setIsAdmin(adminSnap.exists());
        }
      } catch (err) {
        console.error('Error initializing user profile:', err);
      } finally {
        setAuthLoading(false);
      }
    });
    return () => unsub();
  }, []);

  // User-scoped real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const unsubProfile = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        if (snap.exists()) {
          setUserProfile(snap.data() as UserProfile);
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}`)
    );

    const unsubEnrollments = onSnapshot(
      query(collection(db, 'enrollments'), where('userId', '==', user.uid)),
      (snap) => {
        setEnrollments(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Enrollment, 'id'>) })));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'enrollments')
    );

    const unsubAttempts = onSnapshot(
      query(collection(db, 'examAttempts'), where('userId', '==', user.uid)),
      (snap) => {
        const remote = snap.docs.map((d) => {
          const raw = d.data() as Omit<ExamAttempt, 'id'> & {
            submittedAt?: { toDate?: () => Date };
          };
          const iso =
            raw.submittedAtIso ||
            raw.submittedAt?.toDate?.()?.toISOString() ||
            new Date(0).toISOString();
          return {
            id: d.id,
            ...raw,
            submittedAtIso: iso,
          };
        });
        remote.sort((a, b) => (b.submittedAtIso || '').localeCompare(a.submittedAtIso || ''));
        setExamAttempts(remote);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'examAttempts')
    );

    const unsubOrders = onSnapshot(
      query(collection(db, 'orders'), where('userId', '==', user.uid)),
      (snap) => {
        setOrders(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, 'id'>) })));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'orders')
    );

    const unsubTickets = onSnapshot(
      query(collection(db, 'tickets'), where('userId', '==', user.uid)),
      (snap) => {
        const list = snap.docs.map((d) => {
          const raw = d.data() as Omit<Ticket, 'id'> & {
            createdAt?: { toDate?: () => Date };
          };
          return {
            id: d.id,
            ...raw,
            createdAtIso: raw.createdAt?.toDate?.()?.toISOString() || new Date(0).toISOString(),
          };
        });
        list.sort((a, b) => (b.createdAtIso || '').localeCompare(a.createdAtIso || ''));
        setTickets(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'tickets')
    );

    const unsubNotificationState = onSnapshot(
      doc(db, 'userNotificationStates', user.uid),
      (snap) => {
        if (snap.exists()) {
          setNotificationState(snap.data() as UserNotificationState);
        } else {
          setNotificationState({
            userId: user.uid,
            readNotificationIds: [],
            subscribedExamIds: [],
            remindMinutesBefore: 30,
            browserAlertsEnabled: false,
          });
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `userNotificationStates/${user.uid}`)
    );

    return () => {
      unsubProfile();
      unsubEnrollments();
      unsubAttempts();
      unsubOrders();
      unsubTickets();
      unsubNotificationState();
    };
  }, [user]);

  // Admin-scoped real-time subscriptions
  useEffect(() => {
    if (!user || !isAdmin) return;

    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        setAllUsers(snap.docs.map((d) => d.data() as UserProfile));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'users')
    );

    const unsubAllOrders = onSnapshot(
      collection(db, 'orders'),
      (snap) => {
        setAllOrders(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, 'id'>) })));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'orders')
    );

    const unsubAllAttempts = onSnapshot(
      collection(db, 'examAttempts'),
      (snap) => {
        setAllAttempts(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ExamAttempt, 'id'>) })));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'examAttempts')
    );

    const unsubAllTickets = onSnapshot(
      collection(db, 'tickets'),
      (snap) => {
        const list = snap.docs.map((d) => {
          const raw = d.data() as Omit<Ticket, 'id'> & {
            createdAt?: { toDate?: () => Date };
          };
          return {
            id: d.id,
            ...raw,
            createdAtIso: raw.createdAt?.toDate?.()?.toISOString() || new Date(0).toISOString(),
          };
        });
        list.sort((a, b) => (b.createdAtIso || '').localeCompare(a.createdAtIso || ''));
        setAllTickets(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'tickets')
    );

    const unsubAdmins = onSnapshot(
      collection(db, 'admins'),
      (snap) => {
        setAdminRecords(snap.docs.map((d) => d.data() as AdminRecord));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'admins')
    );

    return () => {
      unsubUsers();
      unsubAllOrders();
      unsubAllAttempts();
      unsubAllTickets();
      unsubAdmins();
    };
  }, [user, isAdmin]);

  const hasAutoSeededRef = React.useRef(false);

  const seedDatabase = useCallback(async () => {
    if (!user || !isAdmin) {
      notify('فقط مدیر سیستم مجاز به همگام‌سازی پایگاه داده است.', 'error');
      return;
    }

    try {
      // Phase 1: Write parent/root catalog collections first so parent documents exist in Firestore
      const parentBatch = writeBatch(db);

      for (const course of SEED_COURSES) {
        const courseRef = doc(db, 'courses', course.id);
        const existingCourse = await getDoc(courseRef);
        const coursePayload: Record<string, unknown> = {
          title: course.title,
          subtitle: course.subtitle,
          instructor: course.instructor,
          instructorTitle: course.instructorTitle,
          grade: course.grade,
          category: course.category,
          price: course.price,
          durationHours: course.durationHours,
          sessionsCount: course.sessionsCount,
          imageUrl: course.imageUrl,
          description: course.description,
          isDiamondIncluded: course.isDiamondIncluded,
          featured: course.featured,
          createdAt: existingCourse.exists()
            ? existingCourse.data().createdAt
            : serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        if (typeof course.discountPrice === 'number') {
          coursePayload.discountPrice = course.discountPrice;
        }
        parentBatch.set(courseRef, coursePayload);
      }

      for (const exam of SEED_EXAMS) {
        const examRef = doc(db, 'exams', exam.id);
        const existingExam = await getDoc(examRef);
        parentBatch.set(examRef, {
          title: exam.title,
          code: exam.code,
          subject: exam.subject,
          grade: exam.grade,
          strategyWeek: exam.strategyWeek,
          scheduledDate: exam.scheduledDate,
          durationMinutes: exam.durationMinutes,
          totalQuestions: exam.totalQuestions,
          difficulty: exam.difficulty,
          isActive: exam.isActive,
          isDiamondIncluded: exam.isDiamondIncluded,
          price: exam.price,
          description: exam.description,
          createdAt: existingExam.exists()
            ? existingExam.data().createdAt
            : serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      for (const booklet of SEED_BOOKLETS) {
        const bRef = doc(db, 'booklets', booklet.id);
        const existingBooklet = await getDoc(bRef);
        parentBatch.set(bRef, {
          title: booklet.title,
          subject: booklet.subject,
          grade: booklet.grade,
          category: booklet.category,
          pagesCount: booklet.pagesCount,
          fileSizeLabel: booklet.fileSizeLabel,
          isFree: booklet.isFree,
          price: booklet.price,
          description: booklet.description,
          summaryContent: booklet.summaryContent,
          createdAt: existingBooklet.exists()
            ? existingBooklet.data().createdAt
            : serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      for (const article of SEED_ARTICLES) {
        const aRef = doc(db, 'articles', article.id);
        const existingArticle = await getDoc(aRef);
        parentBatch.set(aRef, {
          title: article.title,
          author: article.author,
          category: article.category,
          readMinutes: article.readMinutes,
          excerpt: article.excerpt,
          content: article.content,
          publishedDate: article.publishedDate,
          featured: article.featured,
          createdAt: existingArticle.exists()
            ? existingArticle.data().createdAt
            : serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      await parentBatch.commit();

      // Phase 2: Write subcollections and dependent collections now that parents exist
      const childBatch = writeBatch(db);

      for (const course of SEED_COURSES) {
        for (const lesson of course.lessons) {
          const lessonRef = doc(db, 'courses', course.id, 'lessons', lesson.id);
          const existingLesson = await getDoc(lessonRef);
          childBatch.set(lessonRef, {
            order: lesson.order,
            title: lesson.title,
            durationMinutes: lesson.durationMinutes,
            isFreePreview: lesson.isFreePreview,
            videoTopic: lesson.videoTopic,
            videoUrl: (lesson.videoUrl || '').trim().slice(0, 2000),
            bookletTitle: (lesson.bookletTitle || '').trim().slice(0, 200),
            bookletUrl: (lesson.bookletUrl || '').trim().slice(0, 2000),
            keyPoints: lesson.keyPoints,
            createdAt: existingLesson.exists()
              ? existingLesson.data().createdAt
              : serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      }

      for (const exam of SEED_EXAMS) {
        for (const q of exam.questions) {
          const qRef = doc(db, 'exams', exam.id, 'questions', q.id);
          const existingQ = await getDoc(qRef);
          childBatch.set(qRef, {
            order: q.order,
            subject: q.subject,
            topic: q.topic,
            stem: q.stem,
            option1: q.option1,
            option2: q.option2,
            option3: q.option3,
            option4: q.option4,
            correctOption: q.correctOption,
            explanation: q.explanation,
            difficulty: q.difficulty,
            createdAt: existingQ.exists()
              ? existingQ.data().createdAt
              : serverTimestamp(),
          });
        }
      }

      for (const notif of SEED_EXAM_NOTIFICATIONS) {
        const nRef = doc(db, 'examNotifications', notif.id);
        const existingNotif = await getDoc(nRef);
        childBatch.set(nRef, {
          examId: notif.examId,
          examTitle: notif.examTitle,
          title: notif.title,
          message: notif.message,
          targetGrade: notif.targetGrade,
          priority: notif.priority,
          scheduledStartIso: notif.scheduledStartIso,
          scheduledStartLabel: notif.scheduledStartLabel,
          isActive: notif.isActive,
          createdBy: existingNotif.exists()
            ? existingNotif.data().createdBy
            : user.uid,
          createdAt: existingNotif.exists()
            ? existingNotif.data().createdAt
            : serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      for (const lc of SEED_LIVE_CLASSES) {
        const lcRef = doc(db, 'liveClasses', lc.id);
        const existingLc = await getDoc(lcRef);
        childBatch.set(lcRef, {
          title: lc.title,
          courseId: lc.courseId,
          courseTitle: lc.courseTitle,
          instructorName: lc.instructorName,
          grade: lc.grade,
          subject: lc.subject,
          scheduledLabel: lc.scheduledLabel,
          status: lc.status,
          boardTitle: lc.boardTitle,
          boardContent: lc.boardContent,
          streamUrl: lc.streamUrl,
          isFree: lc.isFree,
          createdBy: existingLc.exists()
            ? existingLc.data().createdBy
            : user.uid,
          createdAt: existingLc.exists()
            ? existingLc.data().createdAt
            : serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      await childBatch.commit();
      notify('تمام دوره‌ها، آزمون‌ها، کلاس‌های آنلاین، جزوات، مقالات و اعلان‌ها در پایگاه داده ذخیره شدند.', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'seedDatabase');
    }
  }, [user, isAdmin, notify]);

  // Auto-seed once when Admin enters and Firestore catalog is empty
  useEffect(() => {
    if (
      !hasAutoSeededRef.current &&
      user &&
      isAdmin &&
      firestoreCourses !== null &&
      firestoreExams !== null &&
      firestoreCourses.length === 0 &&
      firestoreExams.length === 0
    ) {
      hasAutoSeededRef.current = true;
      void seedDatabase();
    }
  }, [user, isAdmin, firestoreCourses, firestoreExams, seedDatabase]);

  const catalogFromFirestore = Boolean(
    (firestoreCourses && firestoreCourses.length > 0) ||
      (firestoreExams && firestoreExams.length > 0)
  );

  const courses: Course[] = useMemo(() => {
    if (firestoreCourses && firestoreCourses.length > 0) return firestoreCourses;
    return SEED_COURSES;
  }, [firestoreCourses]);

  const exams: Exam[] = useMemo(() => {
    if (firestoreExams && firestoreExams.length > 0) return firestoreExams;
    return SEED_EXAMS;
  }, [firestoreExams]);

  const booklets: Booklet[] = useMemo(() => {
    if (firestoreBooklets && firestoreBooklets.length > 0) return firestoreBooklets;
    return SEED_BOOKLETS;
  }, [firestoreBooklets]);

  const articles: Article[] = useMemo(() => {
    if (firestoreArticles && firestoreArticles.length > 0) return firestoreArticles;
    return SEED_ARTICLES;
  }, [firestoreArticles]);

  const examNotifications: ExamNotification[] = useMemo(() => {
    if (firestoreExamNotifications && firestoreExamNotifications.length > 0) {
      return firestoreExamNotifications;
    }
    return SEED_EXAM_NOTIFICATIONS;
  }, [firestoreExamNotifications]);

  const liveClasses: LiveClass[] = useMemo(() => {
    if (firestoreLiveClasses && firestoreLiveClasses.length > 0) {
      return firestoreLiveClasses;
    }
    return SEED_LIVE_CLASSES;
  }, [firestoreLiveClasses]);

  const unreadNotificationsCount = useMemo(() => {
    const readSet = new Set(notificationState.readNotificationIds);
    return examNotifications.filter((n) => n.isActive && !readSet.has(n.id)).length;
  }, [examNotifications, notificationState.readNotificationIds]);

  const hasDiamondAccess = useMemo(() => {
    if (userProfile?.diamondActive) return true;
    return orders.some((o) => o.includesDiamond && o.status === 'paid');
  }, [userProfile, orders]);

  const openCourseDetail = useCallback((courseId: string) => {
    setSelectedCourseId(courseId);
    setView('course-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const startExamRunner = useCallback((examId: string) => {
    setSelectedExamId(examId);
    setView('exam-runner');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openReportCard = useCallback((attempt: ExamAttempt) => {
    setSelectedAttempt(attempt);
    setSelectedExamId(attempt.examId);
    setView('report-card');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openStudentPanelTab = useCallback((targetTab: StudentTab) => {
    setStudentPanelTab(targetTab);
    setView('student-panel');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openLiveClass = useCallback((classId?: string) => {
    if (classId) setSelectedLiveClassId(classId);
    setView('live-classroom');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openAuthModal = useCallback(() => {
    setIsAuthModalOpen(true);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setIsAuthModalOpen(false);
      notify('ورود به حساب کاربری با موفقیت انجام شد.', 'success');
    } catch (err) {
      console.error(err);
      notify('ورود با حساب گوگل انجام نشد. لطفاً دوباره تلاش کنید.', 'error');
    }
  }, [notify]);

  const mapAuthErrorMessage = (err: unknown): string => {
    const code =
      typeof err === 'object' && err !== null && 'code' in err
        ? String((err as { code?: unknown }).code)
        : '';
    switch (code) {
      case 'auth/operation-not-allowed':
        return 'ورود با شماره تلفن و رمز عبور (Email/Password) هنوز در پنل Firebase Authentication پروژه فعال نشده است. از کنسول فایربیس گزینه Email/Password را Enable کنید.';
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'شماره موبایل یا رمز عبور نادرست است.';
      case 'auth/email-already-in-use':
        return 'این شماره موبایل قبلاً ثبت‌نام شده است. از تب ورود وارد شوید.';
      case 'auth/weak-password':
        return 'رمز عبور باید حداقل ۶ کاراکتر باشد.';
      case 'auth/too-many-requests':
        return 'تعداد تلاش‌های ناموفق زیاد بود. لطفاً چند دقیقه دیگر تلاش کنید.';
      default:
        return 'خطا در برقراری ارتباط با سرویس احراز هویت. لطفاً دوباره تلاش کنید.';
    }
  };

  const signInWithPhonePassword = useCallback(
    async (phone: string, password: string): Promise<{ ok: boolean; error?: string }> => {
      const normalized = normalizeIranPhone(phone);
      if (!normalized) {
        return { ok: false, error: 'لطفاً شماره موبایل معتبر با فرمت ۰۹۱۲۳۴۵۶۷۸۹ وارد کنید.' };
      }
      if (!password || password.length < 6) {
        return { ok: false, error: 'رمز عبور باید حداقل ۶ کاراکتر باشد.' };
      }
      try {
        const syntheticEmail = phoneToSyntheticEmail(normalized);
        await signInWithEmailAndPassword(auth, syntheticEmail, password);
        setIsAuthModalOpen(false);
        notify('با موفقیت وارد حساب کاربری خود شدید.', 'success');
        return { ok: true };
      } catch (err) {
        console.error('Phone sign-in error:', err);
        return { ok: false, error: mapAuthErrorMessage(err) };
      }
    },
    [notify]
  );

  const registerWithPhonePassword = useCallback(
    async (
      displayName: string,
      phone: string,
      password: string
    ): Promise<{ ok: boolean; error?: string }> => {
      const cleanName = displayName.trim();
      if (cleanName.length < 2) {
        return { ok: false, error: 'لطفاً نام و نام خانوادگی خود را وارد کنید.' };
      }
      const normalized = normalizeIranPhone(phone);
      if (!normalized) {
        return { ok: false, error: 'شماره موبایل معتبر با شروع ۰۹ وارد کنید.' };
      }
      if (!password || password.length < 6) {
        return { ok: false, error: 'رمز عبور باید حداقل ۶ کاراکتر باشد.' };
      }
      try {
        const syntheticEmail = phoneToSyntheticEmail(normalized);
        const cred = await createUserWithEmailAndPassword(auth, syntheticEmail, password);
        await updateProfile(cred.user, { displayName: cleanName });

        // Explicitly create/ensure profile with student's displayName and normalized phone
        const profilePayload: UserProfile = {
          uid: cred.user.uid,
          displayName: cleanName,
          email: syntheticEmail,
          phone: normalized,
          grade: 'دوازدهم',
          field: 'علوم تجربی',
          diamondActive: false,
        };
        await setDoc(doc(db, 'users', cred.user.uid), {
          ...profilePayload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setUserProfile(profilePayload);
        setIsAuthModalOpen(false);
        notify('ثبت‌نام با شماره موبایل با موفقیت انجام شد.', 'success');
        return { ok: true };
      } catch (err) {
        console.error('Phone register error:', err);
        return { ok: false, error: mapAuthErrorMessage(err) };
      }
    },
    [notify]
  );

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setView('home');
    notify('از حساب کاربری خود خارج شدید.', 'info');
  }, [notify]);

  const updateMyProfile = useCallback(
    async (displayName: string, grade: StudentGrade, field: StudyField) => {
      if (!user) return;
      const path = `users/${user.uid}`;
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          displayName: displayName.trim() || 'دانش‌آموز ماز',
          grade,
          field,
          updatedAt: serverTimestamp(),
        });
        notify('مشخصات پروفایل با موفقیت ذخیره شد.', 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    },
    [user, notify]
  );

  const fetchCourseLessons = useCallback(async (courseId: string): Promise<CourseLesson[]> => {
    try {
      const snap = await getDocs(
        query(collection(db, 'courses', courseId, 'lessons'), orderBy('order', 'asc'))
      );
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CourseLesson, 'id'>) }));
      }
    } catch (err) {
      console.error(err);
    }
    const seedMatch = SEED_COURSES.find((c) => c.id === courseId);
    return seedMatch?.lessons ?? [];
  }, []);

  const fetchExamQuestions = useCallback(async (examId: string): Promise<ExamQuestion[]> => {
    try {
      const snap = await getDocs(
        query(collection(db, 'exams', examId, 'questions'), orderBy('order', 'asc'))
      );
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ExamQuestion, 'id'>) }));
      }
    } catch (err) {
      console.error(err);
    }
    const seedMatch = SEED_EXAMS.find((e) => e.id === examId);
    return seedMatch?.questions ?? [];
  }, []);

  const isEnrolledInCourse = useCallback(
    (courseId: string) => {
      const course = courses.find((c) => c.id === courseId);
      if (hasDiamondAccess && course?.isDiamondIncluded) return true;
      return enrollments.some((e) => e.courseId === courseId);
    },
    [courses, enrollments, hasDiamondAccess]
  );

  const toggleLessonComplete = useCallback(
    async (courseId: string, courseTitle: string, lessonId: string) => {
      if (!user) {
        notify('برای ثبت پیشرفت در جلسات ابتدا وارد حساب کاربری شوید.', 'info');
        return;
      }
      const existing = enrollments.find((e) => e.courseId === courseId);
      const currentIds = existing?.completedLessonIds ?? [];
      const nextIds = currentIds.includes(lessonId)
        ? currentIds.filter((id) => id !== lessonId)
        : [...currentIds, lessonId];

      const enrollmentId = existing?.id || `${user.uid}_${courseId}`;
      try {
        if (existing) {
          await updateDoc(doc(db, 'enrollments', enrollmentId), {
            completedLessonIds: nextIds,
            updatedAt: serverTimestamp(),
          });
        } else {
          // Ensure parent course exists in Firestore before creating enrollment
          const courseSnap = await getDoc(doc(db, 'courses', courseId));
          if (!courseSnap.exists()) {
            notify('این دوره هنوز در پایگاه داده ثبت نشده است؛ وضعیت جلسه به صورت موقت نمایش داده می‌شود.', 'info');
            return;
          }
          await setDoc(doc(db, 'enrollments', enrollmentId), {
            userId: user.uid,
            courseId,
            courseTitle,
            completedLessonIds: nextIds,
            enrolledAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `enrollments/${enrollmentId}`);
      }
    },
    [user, enrollments, notify]
  );

  const submitExamAttempt = useCallback(
    async (
      exam: Exam,
      questions: ExamQuestion[],
      answersMap: Record<string, number>,
      timeSpentSeconds: number,
      options?: { isAutoTimeout?: boolean }
    ): Promise<ExamAttempt> => {
      let correctCount = 0;
      let wrongCount = 0;

      for (const q of questions) {
        const chosen = answersMap[q.id];
        if (chosen === undefined || chosen === null) continue;
        if (chosen === q.correctOption) {
          correctCount += 1;
        } else {
          wrongCount += 1;
        }
      }

      const totalQ = Math.max(1, questions.length);
      const benchmark = getBenchmarkForDifficulty(exam.difficulty);
      const stats = analyzeKonkurResult({
        totalQuestions: totalQ,
        correctCount,
        wrongCount,
        cohortMean: benchmark.meanPercentage,
        cohortStdDev: benchmark.stdDevPercentage,
        totalParticipants: benchmark.totalParticipants,
      });
      const attemptId = slugifySafeId('attempt');

      const attempt: ExamAttempt = {
        id: attemptId,
        userId: user?.uid ?? 'guest',
        studentName: userProfile?.displayName || user?.displayName || 'داوطلب مهمان',
        examId: exam.id,
        examTitle: exam.title,
        correctCount,
        wrongCount,
        blankCount: stats.blankCount,
        totalQuestions: totalQ,
        percentage: stats.percentage,
        taraz: stats.taraz,
        estimatedRank: stats.estimatedRank,
        timeSpentSeconds,
        answersMap,
        submittedAtIso: new Date().toISOString(),
      };

      if (user) {
        try {
          const examDoc = await getDoc(doc(db, 'exams', exam.id));
          if (examDoc.exists()) {
            await setDoc(doc(db, 'examAttempts', attemptId), {
              userId: user.uid,
              studentName: attempt.studentName,
              examId: attempt.examId,
              examTitle: attempt.examTitle,
              correctCount: attempt.correctCount,
              wrongCount: attempt.wrongCount,
              blankCount: attempt.blankCount,
              totalQuestions: attempt.totalQuestions,
              percentage: attempt.percentage,
              taraz: attempt.taraz,
              estimatedRank: attempt.estimatedRank,
              timeSpentSeconds: attempt.timeSpentSeconds,
              answersMap: attempt.answersMap,
              submittedAt: serverTimestamp(),
            });
          } else {
            // Save locally if catalog wasn't yet synced by admin
            setExamAttempts((prev) => {
              const next = [attempt, ...prev];
              localStorage.setItem('biomaze_local_attempts', JSON.stringify(next));
              return next;
            });
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `examAttempts/${attemptId}`);
        }
      } else {
        setExamAttempts((prev) => {
          const next = [attempt, ...prev];
          localStorage.setItem('biomaze_local_attempts', JSON.stringify(next));
          return next;
        });
      }

      setSelectedAttempt(attempt);
      setSelectedExamId(exam.id);
      setView('report-card');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      notify(
        options?.isAutoTimeout
          ? 'زمان آزمون به پایان رسید؛ پاسخ‌برگ شما به‌صورت خودکار ثبت و کارنامه صادر شد.'
          : 'پاسخ‌برگ شما ثبت و کارنامه جامع محاسبه شد.',
        options?.isAutoTimeout ? 'info' : 'success'
      );
      return attempt;
    },
    [user, userProfile, notify]
  );

  // Cart actions
  const addToCart = useCallback(
    (item: CartItem) => {
      setCart((prev) => {
        if (prev.some((x) => x.id === item.id)) {
          notify('این مورد هم‌اکنون در سبد خرید شما قرار دارد.', 'info');
          return prev;
        }
        notify(`«${item.title}» به سبد خرید اضافه شد.`, 'success');
        return [...prev, item];
      });
      setIsCartOpen(true);
    },
    [notify]
  );

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const checkoutCart = useCallback(async (): Promise<boolean> => {
    if (cart.length === 0) return false;
    if (!user) {
      notify('برای تکمیل ثبت‌نام و فعال‌سازی دوره‌ها ابتدا وارد حساب کاربری خود شوید.', 'info');
      setIsAuthModalOpen(true);
      return false;
    }

    const totalAmount = cart.reduce((sum, item) => sum + item.price, 0);
    const includesDiamond = cart.some((item) => item.id === DIAMOND_PACKAGE.id);
    const orderId = slugifySafeId('order');

    try {
      await setDoc(doc(db, 'orders', orderId), {
        userId: user.uid,
        studentName: userProfile?.displayName || user.displayName || 'دانش‌آموز ماز',
        studentEmail: user.email || '',
        itemTitles: cart.map((i) => i.title),
        itemIds: cart.map((i) => i.id),
        includesDiamond,
        totalAmount,
        status: 'paid',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Create enrollments for purchased courses that exist in Firestore
      for (const item of cart) {
        if (item.type === 'course') {
          const courseSnap = await getDoc(doc(db, 'courses', item.id));
          if (courseSnap.exists()) {
            const enrId = `${user.uid}_${item.id}`;
            await setDoc(doc(db, 'enrollments', enrId), {
              userId: user.uid,
              courseId: item.id,
              courseTitle: item.title,
              completedLessonIds: [],
              enrolledAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        }
      }

      setCart([]);
      setIsCartOpen(false);
      setView('student-panel');
      notify('ثبت‌نام با موفقیت تکمیل شد و دسترسی‌های شما فعال گردید.', 'success');
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `orders/${orderId}`);
    }
  }, [cart, user, userProfile, notify]);

  // --- Admin CRUD Handlers ---
  const saveCourse = useCallback(
    async (
      course: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>,
      existingId?: string
    ): Promise<string> => {
      const id = existingId || slugifySafeId('course');
      const ref = doc(db, 'courses', id);
      const payload: Record<string, unknown> = {
        title: course.title,
        subtitle: course.subtitle,
        instructor: course.instructor,
        instructorTitle: course.instructorTitle,
        grade: course.grade,
        category: course.category,
        price: Number(course.price),
        durationHours: Number(course.durationHours),
        sessionsCount: Number(course.sessionsCount),
        imageUrl: course.imageUrl,
        description: course.description,
        isDiamondIncluded: Boolean(course.isDiamondIncluded),
        featured: Boolean(course.featured),
        updatedAt: serverTimestamp(),
      };
      if (typeof course.discountPrice === 'number' && course.discountPrice >= 0) {
        payload.discountPrice = Number(course.discountPrice);
      }

      try {
        const snap = await getDoc(ref);
        if (snap.exists()) {
          await setDoc(ref, { ...payload, createdAt: snap.data().createdAt });
          notify('دوره با موفقیت ویرایش شد.', 'success');
        } else {
          await setDoc(ref, { ...payload, createdAt: serverTimestamp() });
          notify('دوره جدید با موفقیت ایجاد شد.', 'success');
        }
        return id;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `courses/${id}`);
      }
    },
    [notify]
  );

  const deleteCourse = useCallback(
    async (courseId: string) => {
      try {
        await deleteDoc(doc(db, 'courses', courseId));
        notify('دوره حذف شد.', 'info');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `courses/${courseId}`);
      }
    },
    [notify]
  );

  const saveCourseLesson = useCallback(
    async (
      courseId: string,
      lesson: Omit<CourseLesson, 'id' | 'createdAt' | 'updatedAt'>,
      existingLessonId?: string
    ) => {
      const lessonId = existingLessonId || slugifySafeId('lesson');
      const ref = doc(db, 'courses', courseId, 'lessons', lessonId);
      const payload = {
        order: Number(lesson.order),
        title: lesson.title.trim(),
        durationMinutes: Number(lesson.durationMinutes),
        isFreePreview: Boolean(lesson.isFreePreview),
        videoTopic: lesson.videoTopic.trim(),
        videoUrl: (lesson.videoUrl || '').trim().slice(0, 2000),
        bookletTitle: (lesson.bookletTitle || '').trim().slice(0, 200),
        bookletUrl: (lesson.bookletUrl || '').trim().slice(0, 2000),
        keyPoints: lesson.keyPoints.trim().slice(0, 4000),
        updatedAt: serverTimestamp(),
      };

      try {
        const courseSnap = await getDoc(doc(db, 'courses', courseId));
        if (!courseSnap.exists()) {
          const seedCourse = SEED_COURSES.find((c) => c.id === courseId);
          if (seedCourse) {
            const cPayload: Record<string, unknown> = {
              title: seedCourse.title,
              subtitle: seedCourse.subtitle,
              instructor: seedCourse.instructor,
              instructorTitle: seedCourse.instructorTitle,
              grade: seedCourse.grade,
              category: seedCourse.category,
              price: seedCourse.price,
              durationHours: seedCourse.durationHours,
              sessionsCount: seedCourse.sessionsCount,
              imageUrl: seedCourse.imageUrl,
              description: seedCourse.description,
              isDiamondIncluded: seedCourse.isDiamondIncluded,
              featured: seedCourse.featured,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };
            if (typeof seedCourse.discountPrice === 'number') {
              cPayload.discountPrice = seedCourse.discountPrice;
            }
            await setDoc(doc(db, 'courses', seedCourse.id), cPayload);
          }
        }

        const snap = await getDoc(ref);
        if (snap.exists()) {
          await setDoc(ref, { ...payload, createdAt: snap.data().createdAt });
          notify('جلسه با موفقیت ویرایش شد.', 'success');
        } else {
          await setDoc(ref, { ...payload, createdAt: serverTimestamp() });
          notify('جلسه جدید به دوره اضافه شد.', 'success');
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `courses/${courseId}/lessons/${lessonId}`);
      }
    },
    [notify]
  );

  const deleteCourseLesson = useCallback(
    async (courseId: string, lessonId: string) => {
      try {
        await deleteDoc(doc(db, 'courses', courseId, 'lessons', lessonId));
        notify('جلسه حذف شد.', 'info');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `courses/${courseId}/lessons/${lessonId}`);
      }
    },
    [notify]
  );

  const saveExam = useCallback(
    async (exam: Omit<Exam, 'id' | 'createdAt' | 'updatedAt'>, existingId?: string): Promise<string> => {
      const id = existingId || slugifySafeId('exam');
      const ref = doc(db, 'exams', id);
      const payload = {
        title: exam.title,
        code: exam.code,
        subject: exam.subject,
        grade: exam.grade,
        strategyWeek: exam.strategyWeek,
        scheduledDate: exam.scheduledDate,
        durationMinutes: Number(exam.durationMinutes),
        totalQuestions: Number(exam.totalQuestions),
        difficulty: exam.difficulty,
        isActive: Boolean(exam.isActive),
        isDiamondIncluded: Boolean(exam.isDiamondIncluded),
        price: Number(exam.price),
        description: exam.description,
        updatedAt: serverTimestamp(),
      };

      try {
        const snap = await getDoc(ref);
        if (snap.exists()) {
          await setDoc(ref, { ...payload, createdAt: snap.data().createdAt });
          notify('آزمون ویرایش شد.', 'success');
        } else {
          await setDoc(ref, { ...payload, createdAt: serverTimestamp() });
          notify('آزمون جدید ایجاد شد.', 'success');
        }
        return id;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `exams/${id}`);
      }
    },
    [notify]
  );

  const deleteExam = useCallback(
    async (examId: string) => {
      try {
        await deleteDoc(doc(db, 'exams', examId));
        notify('آزمون حذف شد.', 'info');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `exams/${examId}`);
      }
    },
    [notify]
  );

  const saveExamQuestion = useCallback(
    async (
      examId: string,
      question: Omit<ExamQuestion, 'id' | 'createdAt'>,
      existingQuestionId?: string
    ) => {
      const qId = existingQuestionId || slugifySafeId('q');
      const ref = doc(db, 'exams', examId, 'questions', qId);
      const payload = {
        order: Number(question.order),
        subject: question.subject,
        topic: question.topic,
        stem: question.stem,
        option1: question.option1,
        option2: question.option2,
        option3: question.option3,
        option4: question.option4,
        correctOption: Number(question.correctOption),
        explanation: question.explanation,
        difficulty: question.difficulty,
      };

      try {
        const snap = await getDoc(ref);
        if (snap.exists()) {
          await setDoc(ref, { ...payload, createdAt: snap.data().createdAt });
          notify('سوال ویرایش شد.', 'success');
        } else {
          await setDoc(ref, { ...payload, createdAt: serverTimestamp() });
          notify('سوال جدید به آزمون اضافه شد.', 'success');
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `exams/${examId}/questions/${qId}`);
      }
    },
    [notify]
  );

  const deleteExamQuestion = useCallback(
    async (examId: string, questionId: string) => {
      try {
        await deleteDoc(doc(db, 'exams', examId, 'questions', questionId));
        notify('سوال حذف شد.', 'info');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `exams/${examId}/questions/${questionId}`);
      }
    },
    [notify]
  );

  const saveBooklet = useCallback(
    async (booklet: Omit<Booklet, 'id' | 'createdAt' | 'updatedAt'>, existingId?: string) => {
      const id = existingId || slugifySafeId('booklet');
      const ref = doc(db, 'booklets', id);
      const payload = {
        title: booklet.title,
        subject: booklet.subject,
        grade: booklet.grade,
        category: booklet.category,
        pagesCount: Number(booklet.pagesCount),
        fileSizeLabel: booklet.fileSizeLabel,
        isFree: Boolean(booklet.isFree),
        price: Number(booklet.price),
        description: booklet.description,
        summaryContent: booklet.summaryContent,
        updatedAt: serverTimestamp(),
      };
      try {
        const snap = await getDoc(ref);
        if (snap.exists()) {
          await setDoc(ref, { ...payload, createdAt: snap.data().createdAt });
          notify('جزوه ویرایش شد.', 'success');
        } else {
          await setDoc(ref, { ...payload, createdAt: serverTimestamp() });
          notify('جزوه جدید ثبت شد.', 'success');
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `booklets/${id}`);
      }
    },
    [notify]
  );

  const deleteBooklet = useCallback(
    async (bookletId: string) => {
      try {
        await deleteDoc(doc(db, 'booklets', bookletId));
        notify('جزوه حذف شد.', 'info');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `booklets/${bookletId}`);
      }
    },
    [notify]
  );

  const saveArticle = useCallback(
    async (article: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>, existingId?: string) => {
      const id = existingId || slugifySafeId('article');
      const ref = doc(db, 'articles', id);
      const payload = {
        title: article.title,
        author: article.author,
        category: article.category,
        readMinutes: Number(article.readMinutes),
        excerpt: article.excerpt,
        content: article.content,
        publishedDate: article.publishedDate,
        featured: Boolean(article.featured),
        updatedAt: serverTimestamp(),
      };
      try {
        const snap = await getDoc(ref);
        if (snap.exists()) {
          await setDoc(ref, { ...payload, createdAt: snap.data().createdAt });
          notify('مقاله ویرایش شد.', 'success');
        } else {
          await setDoc(ref, { ...payload, createdAt: serverTimestamp() });
          notify('مقاله جدید منتشر شد.', 'success');
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `articles/${id}`);
      }
    },
    [notify]
  );

  const deleteArticle = useCallback(
    async (articleId: string) => {
      try {
        await deleteDoc(doc(db, 'articles', articleId));
        notify('مقاله حذف شد.', 'info');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `articles/${articleId}`);
      }
    },
    [notify]
  );

  const toggleUserDiamond = useCallback(
    async (targetUid: string, currentState: boolean) => {
      try {
        await updateDoc(doc(db, 'users', targetUid), {
          diamondActive: !currentState,
          updatedAt: serverTimestamp(),
        });
        notify(!currentState ? 'اشتراک الماس کاربر فعال شد.' : 'اشتراک الماس کاربر غیرفعال شد.', 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${targetUid}`);
      }
    },
    [notify]
  );

  const updateOrderStatus = useCallback(
    async (orderId: string, status: 'paid' | 'pending' | 'cancelled') => {
      try {
        await updateDoc(doc(db, 'orders', orderId), {
          status,
          updatedAt: serverTimestamp(),
        });
        notify('وضعیت سفارش به‌روزرسانی شد.', 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
      }
    },
    [notify]
  );

  const grantAdminRole = useCallback(
    async (targetUid: string, email: string) => {
      if (!user) return;
      try {
        await setDoc(doc(db, 'admins', targetUid), {
          uid: targetUid,
          email,
          grantedBy: user.uid,
          createdAt: serverTimestamp(),
        });
        notify(`دسترسی مدیریت به ${email} اعطا شد.`, 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `admins/${targetUid}`);
      }
    },
    [user, notify]
  );

  const revokeAdminRole = useCallback(
    async (targetUid: string) => {
      try {
        await deleteDoc(doc(db, 'admins', targetUid));
        notify('دسترسی مدیریت لغو شد.', 'info');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `admins/${targetUid}`);
      }
    },
    [notify]
  );

  // --- Ticketing CRUD Handlers ---
  const createTicket = useCallback(
    async (payload: {
      subject: TicketSubject;
      courseTitle: string;
      title: string;
      questionBody: string;
    }): Promise<boolean> => {
      if (!user) {
        notify('برای ارسال تیکت آموزشی ابتدا وارد حساب کاربری شوید.', 'info');
        return false;
      }
      const ticketId = slugifySafeId('ticket');
      try {
        await setDoc(doc(db, 'tickets', ticketId), {
          userId: user.uid,
          studentName: userProfile?.displayName || user.displayName || 'دانش‌آموز ماز',
          studentEmail: user.email || '',
          subject: payload.subject,
          courseTitle: payload.courseTitle.trim(),
          title: payload.title.trim(),
          questionBody: payload.questionBody.trim(),
          status: 'open',
          instructorName: '',
          instructorReply: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        notify('سوال شما با موفقیت ثبت شد و به دپارتمان مربوطه ارجاع داده شد.', 'success');
        return true;
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `tickets/${ticketId}`);
      }
    },
    [user, userProfile, notify]
  );

  const replyToTicket = useCallback(
    async (
      ticketId: string,
      instructorName: string,
      instructorReply: string,
      status: Extract<TicketStatus, 'answered' | 'closed'>
    ) => {
      try {
        await updateDoc(doc(db, 'tickets', ticketId), {
          instructorName: instructorName.trim() || 'تیم علمی زیست‌ماز',
          instructorReply: instructorReply.trim(),
          status,
          updatedAt: serverTimestamp(),
        });
        notify('پاسخ استاد ثبت و وضعیت تیکت به‌روزرسانی شد.', 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `tickets/${ticketId}`);
      }
    },
    [notify]
  );

  const closeTicket = useCallback(
    async (ticketId: string) => {
      try {
        await updateDoc(doc(db, 'tickets', ticketId), {
          status: 'closed',
          updatedAt: serverTimestamp(),
        });
        notify('تیکت بسته شد.', 'info');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `tickets/${ticketId}`);
      }
    },
    [notify]
  );

  const deleteTicket = useCallback(
    async (ticketId: string) => {
      try {
        await deleteDoc(doc(db, 'tickets', ticketId));
        notify('تیکت حذف شد.', 'info');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `tickets/${ticketId}`);
      }
    },
    [notify]
  );

  // --- Exam Notification Handlers ---
  const persistNotificationState = useCallback(
    async (next: Omit<UserNotificationState, 'userId' | 'updatedAt'>) => {
      if (!user) return;
      const ref = doc(db, 'userNotificationStates', user.uid);
      const payload = {
        userId: user.uid,
        readNotificationIds: next.readNotificationIds.slice(0, 200),
        subscribedExamIds: next.subscribedExamIds.slice(0, 100),
        remindMinutesBefore: next.remindMinutesBefore,
        browserAlertsEnabled: Boolean(next.browserAlertsEnabled),
        updatedAt: serverTimestamp(),
      };
      try {
        await setDoc(ref, payload);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `userNotificationStates/${user.uid}`);
      }
    },
    [user]
  );

  const markNotificationRead = useCallback(
    async (notificationId: string) => {
      if (!user) return;
      if (notificationState.readNotificationIds.includes(notificationId)) return;
      await persistNotificationState({
        ...notificationState,
        readNotificationIds: [...notificationState.readNotificationIds, notificationId],
      });
    },
    [user, notificationState, persistNotificationState]
  );

  const markAllNotificationsRead = useCallback(
    async (notificationIds: string[]) => {
      if (!user) return;
      const merged = Array.from(
        new Set([...notificationState.readNotificationIds, ...notificationIds])
      );
      await persistNotificationState({
        ...notificationState,
        readNotificationIds: merged,
      });
      notify('همه اعلان‌های آزمون به عنوان خوانده‌شده علامت‌گذاری شدند.', 'success');
    },
    [user, notificationState, persistNotificationState, notify]
  );

  const toggleExamReminder = useCallback(
    async (examId: string) => {
      if (!user) {
        notify('برای فعال‌سازی یادآور آزمون ابتدا وارد حساب کاربری خود شوید.', 'info');
        return;
      }
      const exists = notificationState.subscribedExamIds.includes(examId);
      const nextIds = exists
        ? notificationState.subscribedExamIds.filter((id) => id !== examId)
        : [...notificationState.subscribedExamIds, examId];
      await persistNotificationState({
        ...notificationState,
        subscribedExamIds: nextIds,
      });
      notify(
        exists
          ? 'یادآور زمان شروع این آزمون غیرفعال شد.'
          : 'یادآور شروع این آزمون در پنل شخصی شما فعال شد.',
        exists ? 'info' : 'success'
      );
    },
    [user, notificationState, persistNotificationState, notify]
  );

  const updateNotificationPreferences = useCallback(
    async (remindMinutesBefore: 15 | 30 | 60 | 1440, browserAlertsEnabled: boolean) => {
      if (!user) return;
      await persistNotificationState({
        ...notificationState,
        remindMinutesBefore,
        browserAlertsEnabled,
      });
      notify('تنظیمات اطلاع‌رسانی آزمون با موفقیت ذخیره شد.', 'success');
    },
    [user, notificationState, persistNotificationState, notify]
  );

  const saveExamNotification = useCallback(
    async (
      payload: {
        examId: string;
        examTitle: string;
        title: string;
        message: string;
        targetGrade: NotificationTargetGrade;
        priority: NotificationPriority;
        scheduledStartIso: string;
        scheduledStartLabel: string;
        isActive: boolean;
      },
      existingId?: string
    ) => {
      if (!user || !isAdmin) return;
      const id = existingId || slugifySafeId('notif');
      const ref = doc(db, 'examNotifications', id);

      try {
        // Ensure referenced exam exists in Firestore if pointing to a seed exam
        if (payload.examId !== 'general') {
          const examSnap = await getDoc(doc(db, 'exams', payload.examId));
          if (!examSnap.exists()) {
            const seedExam = SEED_EXAMS.find((e) => e.id === payload.examId);
            if (seedExam) {
              await setDoc(doc(db, 'exams', seedExam.id), {
                title: seedExam.title,
                code: seedExam.code,
                subject: seedExam.subject,
                grade: seedExam.grade,
                strategyWeek: seedExam.strategyWeek,
                scheduledDate: seedExam.scheduledDate,
                durationMinutes: seedExam.durationMinutes,
                totalQuestions: seedExam.totalQuestions,
                difficulty: seedExam.difficulty,
                isActive: seedExam.isActive,
                isDiamondIncluded: seedExam.isDiamondIncluded,
                price: seedExam.price,
                description: seedExam.description,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            }
          }
        }

        const snap = await getDoc(ref);
        const data = {
          examId: payload.examId,
          examTitle: payload.examTitle.trim(),
          title: payload.title.trim(),
          message: payload.message.trim(),
          targetGrade: payload.targetGrade,
          priority: payload.priority,
          scheduledStartIso: payload.scheduledStartIso.trim(),
          scheduledStartLabel: payload.scheduledStartLabel.trim(),
          isActive: Boolean(payload.isActive),
          updatedAt: serverTimestamp(),
        };

        if (snap.exists()) {
          await setDoc(ref, {
            ...data,
            createdBy: snap.data().createdBy,
            createdAt: snap.data().createdAt,
          });
          notify('اعلان زمان‌بندی آزمون ویرایش شد.', 'success');
        } else {
          await setDoc(ref, {
            ...data,
            createdBy: user.uid,
            createdAt: serverTimestamp(),
          });
          notify('اعلان جدید زمان شروع آزمون منتشر شد.', 'success');
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `examNotifications/${id}`);
      }
    },
    [user, isAdmin, notify]
  );

  const toggleExamNotificationActive = useCallback(
    async (notification: ExamNotification) => {
      if (!user || !isAdmin) return;
      const ref = doc(db, 'examNotifications', notification.id);
      try {
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          await saveExamNotification({
            examId: notification.examId,
            examTitle: notification.examTitle,
            title: notification.title,
            message: notification.message,
            targetGrade: notification.targetGrade,
            priority: notification.priority,
            scheduledStartIso: notification.scheduledStartIso,
            scheduledStartLabel: notification.scheduledStartLabel,
            isActive: !notification.isActive,
          }, notification.id);
          return;
        }
        await updateDoc(ref, {
          isActive: !notification.isActive,
          updatedAt: serverTimestamp(),
        });
        notify(
          !notification.isActive ? 'اعلان فعال و برای دانش‌آموزان نمایش داده می‌شود.' : 'اعلان موقتاً غیرفعال شد.',
          'info'
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `examNotifications/${notification.id}`);
      }
    },
    [user, isAdmin, saveExamNotification, notify]
  );

  const deleteExamNotification = useCallback(
    async (notificationId: string) => {
      try {
        await deleteDoc(doc(db, 'examNotifications', notificationId));
        notify('اعلان حذف شد.', 'info');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `examNotifications/${notificationId}`);
      }
    },
    [notify]
  );

  // --- Live Online Classroom Handlers ---
  const ensureLiveClassParentExists = useCallback(
    async (classId: string) => {
      const ref = doc(db, 'liveClasses', classId);
      const snap = await getDoc(ref);
      if (snap.exists()) return true;
      if (!user || !isAdmin) return false;
      const seedMatch = SEED_LIVE_CLASSES.find((lc) => lc.id === classId);
      if (!seedMatch) return false;
      if (seedMatch.courseId !== 'general') {
        const courseSnap = await getDoc(doc(db, 'courses', seedMatch.courseId));
        if (!courseSnap.exists()) {
          const seedCourse = SEED_COURSES.find((c) => c.id === seedMatch.courseId);
          if (seedCourse) {
            const payload: Record<string, unknown> = {
              title: seedCourse.title,
              subtitle: seedCourse.subtitle,
              instructor: seedCourse.instructor,
              instructorTitle: seedCourse.instructorTitle,
              grade: seedCourse.grade,
              category: seedCourse.category,
              price: seedCourse.price,
              durationHours: seedCourse.durationHours,
              sessionsCount: seedCourse.sessionsCount,
              imageUrl: seedCourse.imageUrl,
              description: seedCourse.description,
              isDiamondIncluded: seedCourse.isDiamondIncluded,
              featured: seedCourse.featured,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };
            if (typeof seedCourse.discountPrice === 'number') {
              payload.discountPrice = seedCourse.discountPrice;
            }
            await setDoc(doc(db, 'courses', seedCourse.id), payload);
          }
        }
      }
      await setDoc(ref, {
        title: seedMatch.title,
        courseId: seedMatch.courseId,
        courseTitle: seedMatch.courseTitle,
        instructorName: seedMatch.instructorName,
        grade: seedMatch.grade,
        subject: seedMatch.subject,
        scheduledLabel: seedMatch.scheduledLabel,
        status: seedMatch.status,
        boardTitle: seedMatch.boardTitle,
        boardContent: seedMatch.boardContent,
        streamUrl: seedMatch.streamUrl,
        isFree: seedMatch.isFree,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return true;
    },
    [user, isAdmin]
  );

  const saveLiveClass = useCallback(
    async (
      payload: {
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
      },
      existingId?: string
    ): Promise<string | undefined> => {
      if (!user || !isAdmin) return undefined;
      const id = existingId || slugifySafeId('live');
      const ref = doc(db, 'liveClasses', id);

      try {
        if (payload.courseId !== 'general') {
          const courseSnap = await getDoc(doc(db, 'courses', payload.courseId));
          if (!courseSnap.exists()) {
            const seedCourse = SEED_COURSES.find((c) => c.id === payload.courseId);
            if (seedCourse) {
              const cPayload: Record<string, unknown> = {
                title: seedCourse.title,
                subtitle: seedCourse.subtitle,
                instructor: seedCourse.instructor,
                instructorTitle: seedCourse.instructorTitle,
                grade: seedCourse.grade,
                category: seedCourse.category,
                price: seedCourse.price,
                durationHours: seedCourse.durationHours,
                sessionsCount: seedCourse.sessionsCount,
                imageUrl: seedCourse.imageUrl,
                description: seedCourse.description,
                isDiamondIncluded: seedCourse.isDiamondIncluded,
                featured: seedCourse.featured,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              };
              if (typeof seedCourse.discountPrice === 'number') {
                cPayload.discountPrice = seedCourse.discountPrice;
              }
              await setDoc(doc(db, 'courses', seedCourse.id), cPayload);
            }
          }
        }

        const snap = await getDoc(ref);
        const existingData = snap.exists() ? snap.data() : null;
        const cleanStart = (payload.startTimeIso || '').trim().slice(0, 60);
        const cleanEnd = (payload.endTimeIso || '').trim().slice(0, 60);

        const data: Record<string, unknown> = {
          title: payload.title.trim(),
          courseId: payload.courseId || 'general',
          courseTitle: payload.courseTitle.trim() || 'کلاس آنلاین مستقل',
          instructorName: payload.instructorName.trim(),
          grade: payload.grade,
          subject: payload.subject.trim(),
          scheduledLabel: payload.scheduledLabel.trim(),
          status: payload.status,
          boardTitle: payload.boardTitle.trim(),
          boardContent: payload.boardContent.trim(),
          streamUrl: payload.streamUrl.trim(),
          isFree: Boolean(payload.isFree),
          isBoardOpen: existingData && typeof existingData.isBoardOpen === 'boolean' ? existingData.isBoardOpen : true,
          hostMediaMode: existingData?.hostMediaMode || 'none',
          hostMicEnabled: Boolean(existingData?.hostMicEnabled),
          hostUid: existingData?.hostUid || '',
          updatedAt: serverTimestamp(),
        };
        if (cleanStart) {
          data.startTimeIso = cleanStart;
        }
        if (cleanEnd) {
          data.endTimeIso = cleanEnd;
        }

        if (snap.exists()) {
          await setDoc(ref, {
            ...data,
            createdBy: snap.data().createdBy,
            createdAt: snap.data().createdAt,
          });
          notify('اطلاعات کلاس آنلاین به‌روزرسانی شد.', 'success');
        } else {
          await setDoc(ref, {
            ...data,
            createdBy: user.uid,
            createdAt: serverTimestamp(),
          });
          notify('کلاس آنلاین جدید با موفقیت ایجاد شد.', 'success');
        }
        return id;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `liveClasses/${id}`);
      }
    },
    [user, isAdmin, notify]
  );

  const updateLiveClassBoard = useCallback(
    async (classId: string, boardTitle: string, boardContent: string, streamUrl?: string) => {
      if (!user || !isAdmin) return;
      try {
        await ensureLiveClassParentExists(classId);
        const patch: Record<string, unknown> = {
          boardTitle: boardTitle.trim(),
          boardContent: boardContent.trim(),
          updatedAt: serverTimestamp(),
        };
        if (typeof streamUrl === 'string') {
          patch.streamUrl = streamUrl.trim();
        }
        await updateDoc(doc(db, 'liveClasses', classId), patch);
        notify('تخته و جزوه زنده کلاس برای همه دانش‌آموزان به‌روزرسانی شد.', 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `liveClasses/${classId}`);
      }
    },
    [user, isAdmin, ensureLiveClassParentExists, notify]
  );

  const setLiveClassStatus = useCallback(
    async (liveClass: LiveClass, status: LiveClassStatus) => {
      if (!user || !isAdmin) return;
      try {
        await ensureLiveClassParentExists(liveClass.id);
        await updateDoc(doc(db, 'liveClasses', liveClass.id), {
          status,
          updatedAt: serverTimestamp(),
        });
        const label =
          status === 'live'
            ? 'کلاس آنلاین به صورت زنده آغاز شد.'
            : status === 'ended'
              ? 'جلسه کلاس آنلاین پایان یافت.'
              : 'وضعیت کلاس به برنامه‌ریزی‌شده تغییر یافت.';
        notify(label, status === 'live' ? 'success' : 'info');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `liveClasses/${liveClass.id}`);
      }
    },
    [user, isAdmin, ensureLiveClassParentExists, notify]
  );

  const deleteLiveClass = useCallback(
    async (classId: string) => {
      try {
        await deleteDoc(doc(db, 'liveClasses', classId));
        notify('کلاس آنلاین حذف شد.', 'info');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `liveClasses/${classId}`);
      }
    },
    [notify]
  );

  const subscribeLiveClassMessages = useCallback(
    (classId: string, callback: (messages: LiveClassMessage[]) => void) => {
      if (!user) {
        callback([]);
        return () => {};
      }
      const q = query(collection(db, 'liveClasses', classId, 'messages'), orderBy('createdAt', 'asc'));
      return onSnapshot(
        q,
        (snap) => {
          const list = snap.docs.map((d) => {
            const raw = d.data() as Omit<LiveClassMessage, 'id'> & {
              createdAt?: { toDate?: () => Date };
            };
            return {
              id: d.id,
              ...raw,
              createdAtIso: raw.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            };
          });
          callback(list);
        },
        (err) => {
          console.error(err);
          callback([]);
        }
      );
    },
    [user]
  );

  const sendLiveClassMessage = useCallback(
    async (
      classId: string,
      text: string,
      messageType: LiveClassMessageType
    ): Promise<boolean> => {
      if (!user) {
        notify('برای ارسال پیام یا پرسش در کلاس آنلاین ابتدا وارد حساب کاربری خود شوید.', 'info');
        return false;
      }
      const clean = text.trim();
      if (!clean) return false;

      const msgId = slugifySafeId('msg');
      try {
        const classDoc = await getDoc(doc(db, 'liveClasses', classId));
        if (!classDoc.exists()) {
          if (isAdmin) {
            await ensureLiveClassParentExists(classId);
          } else {
            notify('این جلسه کلاس هنوز توسط مدیر در پایگاه داده فعال نشده است.', 'info');
            return false;
          }
        }
        await setDoc(doc(db, 'liveClasses', classId, 'messages', msgId), {
          userId: user.uid,
          senderName: userProfile?.displayName || user.displayName || 'کاربر ماز',
          senderRole: isAdmin ? 'instructor' : 'student',
          messageType,
          text: clean.slice(0, 1200),
          isPinned: false,
          isAnswered: false,
          createdAt: serverTimestamp(),
        });
        return true;
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `liveClasses/${classId}/messages/${msgId}`);
      }
    },
    [user, userProfile, isAdmin, ensureLiveClassParentExists, notify]
  );

  const updateLiveClassMessageModeration = useCallback(
    async (
      classId: string,
      messageId: string,
      patch: { isPinned?: boolean; isAnswered?: boolean }
    ) => {
      if (!user || !isAdmin) return;
      try {
        await updateDoc(doc(db, 'liveClasses', classId, 'messages', messageId), patch);
      } catch (err) {
        handleFirestoreError(
          err,
          OperationType.UPDATE,
          `liveClasses/${classId}/messages/${messageId}`
        );
      }
    },
    [user, isAdmin]
  );

  const deleteLiveClassMessage = useCallback(
    async (classId: string, messageId: string) => {
      try {
        await deleteDoc(doc(db, 'liveClasses', classId, 'messages', messageId));
      } catch (err) {
        handleFirestoreError(
          err,
          OperationType.DELETE,
          `liveClasses/${classId}/messages/${messageId}`
        );
      }
    },
    []
  );

  const subscribeLiveClassStrokes = useCallback(
    (classId: string, callback: (strokes: LiveClassStroke[]) => void) => {
      const q = query(collection(db, 'liveClasses', classId, 'strokes'), orderBy('createdAt', 'asc'));
      return onSnapshot(
        q,
        (snap) => {
          const list = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<LiveClassStroke, 'id'>),
          }));
          callback(list);
        },
        (err) => {
          console.error(err);
          callback([]);
        }
      );
    },
    []
  );

  const addLiveClassStroke = useCallback(
    async (classId: string, stroke: { color: string; width: number; path: string }) => {
      if (!user || !isAdmin) return;
      const strokeId = slugifySafeId('st');
      try {
        await ensureLiveClassParentExists(classId);
        await setDoc(doc(db, 'liveClasses', classId, 'strokes', strokeId), {
          color: stroke.color,
          width: stroke.width,
          path: stroke.path.slice(0, 4000),
          createdBy: user.uid,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(
          err,
          OperationType.CREATE,
          `liveClasses/${classId}/strokes/${strokeId}`
        );
      }
    },
    [user, isAdmin, ensureLiveClassParentExists]
  );

  const clearLiveClassStrokes = useCallback(
    async (classId: string, strokeIds: string[]) => {
      if (!user || !isAdmin || strokeIds.length === 0) return;
      try {
        const batch = writeBatch(db);
        for (const sId of strokeIds) {
          batch.delete(doc(db, 'liveClasses', classId, 'strokes', sId));
        }
        await batch.commit();
        notify('تخته وایت‌برد پاک شد.', 'info');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `liveClasses/${classId}/strokes`);
      }
    },
    [user, isAdmin, notify]
  );

  const toggleLiveClassBoard = useCallback(
    async (liveClass: LiveClass, isBoardOpen: boolean) => {
      if (!user || !isAdmin) return;
      try {
        await ensureLiveClassParentExists(liveClass.id);
        await updateDoc(doc(db, 'liveClasses', liveClass.id), {
          isBoardOpen,
          updatedAt: serverTimestamp(),
        });
        notify(
          isBoardOpen ? 'تخته هوشمند کلاس باز شد.' : 'تخته هوشمند کلاس بسته شد.',
          'info'
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `liveClasses/${liveClass.id}`);
      }
    },
    [user, isAdmin, ensureLiveClassParentExists, notify]
  );

  const updateHostMediaState = useCallback(
    async (classId: string, mediaMode: LiveClassMediaMode, micEnabled: boolean) => {
      if (!user || !isAdmin) return;
      try {
        await ensureLiveClassParentExists(classId);
        await updateDoc(doc(db, 'liveClasses', classId), {
          hostMediaMode: mediaMode,
          hostMicEnabled: Boolean(micEnabled),
          hostUid: mediaMode === 'none' && !micEnabled ? '' : user.uid,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `liveClasses/${classId}`);
      }
    },
    [user, isAdmin, ensureLiveClassParentExists]
  );

  const subscribeLiveClassParticipants = useCallback(
    (classId: string, callback: (participants: LiveClassParticipant[]) => void) => {
      if (!user) {
        callback([]);
        return () => {};
      }
      const q = query(
        collection(db, 'liveClasses', classId, 'participants'),
        orderBy('updatedAt', 'desc')
      );
      return onSnapshot(
        q,
        (snap) => {
          callback(snap.docs.map((d) => d.data() as LiveClassParticipant));
        },
        (err) => {
          console.error(err);
          callback([]);
        }
      );
    },
    [user]
  );

  const upsertMyLiveClassPresence = useCallback(
    async (
      classId: string,
      patch: { cameraRequested?: boolean; cameraActive?: boolean; micActive?: boolean }
    ) => {
      if (!user) return;
      const pRef = doc(db, 'liveClasses', classId, 'participants', user.uid);
      try {
        const classSnap = await getDoc(doc(db, 'liveClasses', classId));
        if (!classSnap.exists()) {
          if (isAdmin) {
            await ensureLiveClassParentExists(classId);
          } else {
            return;
          }
        }
        const existing = await getDoc(pRef);
        const prev = existing.exists() ? (existing.data() as LiveClassParticipant) : null;
        const canPublish = isAdmin ? true : Boolean(prev?.canPublishMedia);
        await setDoc(pRef, {
          userId: user.uid,
          displayName: userProfile?.displayName || user.displayName || 'کاربر ماز',
          role: isAdmin ? 'instructor' : 'student',
          canPublishMedia: canPublish,
          cameraRequested:
            patch.cameraRequested !== undefined
              ? Boolean(patch.cameraRequested)
              : Boolean(prev?.cameraRequested),
          cameraActive: canPublish
            ? patch.cameraActive !== undefined
              ? Boolean(patch.cameraActive)
              : Boolean(prev?.cameraActive)
            : false,
          micActive: canPublish
            ? patch.micActive !== undefined
              ? Boolean(patch.micActive)
              : Boolean(prev?.micActive)
            : false,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.error('Presence sync error:', err);
      }
    },
    [user, userProfile, isAdmin, ensureLiveClassParentExists]
  );

  const setParticipantMediaPermission = useCallback(
    async (classId: string, targetUserId: string, allowed: boolean) => {
      if (!user || !isAdmin) return;
      const pRef = doc(db, 'liveClasses', classId, 'participants', targetUserId);
      try {
        const snap = await getDoc(pRef);
        if (!snap.exists()) return;
        const data = snap.data() as LiveClassParticipant;
        await setDoc(pRef, {
          userId: data.userId,
          displayName: data.displayName,
          role: data.role,
          canPublishMedia: allowed,
          cameraRequested: allowed ? false : false,
          cameraActive: allowed ? data.cameraActive : false,
          micActive: allowed ? data.micActive : false,
          updatedAt: serverTimestamp(),
        });
        notify(
          allowed
            ? `دسترسی وب‌کم و میکروفن برای ${data.displayName} فعال شد.`
            : `دسترسی تصویر و صدای ${data.displayName} بسته شد.`,
          allowed ? 'success' : 'info'
        );
      } catch (err) {
        handleFirestoreError(
          err,
          OperationType.UPDATE,
          `liveClasses/${classId}/participants/${targetUserId}`
        );
      }
    },
    [user, isAdmin, notify]
  );

  const subscribeLiveClassSignals = useCallback(
    (classId: string, callback: (signals: LiveClassSignal[]) => void) => {
      if (!user) {
        callback([]);
        return () => {};
      }
      const q = query(
        collection(db, 'liveClasses', classId, 'signals'),
        where('toUid', '==', user.uid)
      );
      return onSnapshot(
        q,
        (snap) => {
          callback(
            snap.docs.map((d) => ({
              id: d.id,
              ...(d.data() as Omit<LiveClassSignal, 'id'>),
            }))
          );
        },
        (err) => {
          console.error(err);
          callback([]);
        }
      );
    },
    [user]
  );

  const sendLiveClassSignal = useCallback(
    async (
      classId: string,
      toUid: string,
      type: 'offer' | 'answer' | 'ice',
      payload: string
    ) => {
      if (!user || !toUid) return;
      const signalId = slugifySafeId('sig');
      try {
        await setDoc(doc(db, 'liveClasses', classId, 'signals', signalId), {
          fromUid: user.uid,
          toUid,
          type,
          payload: payload.slice(0, 12000),
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        console.error('Signal send error:', err);
      }
    },
    [user]
  );

  const consumeLiveClassSignal = useCallback(
    async (classId: string, signalId: string) => {
      try {
        await deleteDoc(doc(db, 'liveClasses', classId, 'signals', signalId));
      } catch {
        // ignore if already removed
      }
    },
    []
  );

  // Foreground scheduled-exam reminder check for logged-in student
  const alertedIdsRef = React.useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!user) return;
    const checkUpcoming = () => {
      const now = Date.now();
      const leadMs = notificationState.remindMinutesBefore * 60 * 1000;
      for (const notif of examNotifications) {
        if (!notif.isActive || !notif.scheduledStartIso) continue;
        const startMs = Date.parse(notif.scheduledStartIso);
        if (Number.isNaN(startMs)) continue;
        const diff = startMs - now;
        const isSubscribed = notificationState.subscribedExamIds.includes(notif.examId);
        if ((isSubscribed || notif.priority === 'فوری') && diff > 0 && diff <= leadMs) {
          if (!alertedIdsRef.current.has(notif.id)) {
            alertedIdsRef.current.add(notif.id);
            notify(`یادآور آزمون: ${notif.title} (${notif.scheduledStartLabel})`, 'info');
            if (
              notificationState.browserAlertsEnabled &&
              typeof window !== 'undefined' &&
              'Notification' in window &&
              window.Notification.permission === 'granted'
            ) {
              new window.Notification(notif.title, { body: notif.scheduledStartLabel });
            }
          }
        }
      }
    };
    checkUpcoming();
    const timer = setInterval(checkUpcoming, 60000);
    return () => clearInterval(timer);
  }, [user, examNotifications, notificationState, notify]);

  return (
    <AppContext.Provider
      value={{
        user,
        userProfile,
        isAdmin,
        hasDiamondAccess,
        authLoading,
        dataLoading,
        catalogFromFirestore,
        theme,
        toggleTheme,
        view,
        setView,
        studentPanelTab,
        setStudentPanelTab,
        openStudentPanelTab,
        selectedCourseId,
        openCourseDetail,
        selectedExamId,
        startExamRunner,
        selectedAttempt,
        openReportCard,
        selectedLiveClassId,
        openLiveClass,
        courses,
        exams,
        booklets,
        articles,
        liveClasses,
        enrollments,
        examAttempts,
        orders,
        tickets,
        examNotifications,
        notificationState,
        unreadNotificationsCount,
        allUsers,
        allOrders,
        allAttempts,
        allTickets,
        adminRecords,
        cart,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        clearCart,
        checkoutCart,
        isAuthModalOpen,
        setIsAuthModalOpen,
        openAuthModal,
        signInWithGoogle,
        signInWithPhonePassword,
        registerWithPhonePassword,
        signOut,
        updateMyProfile,
        fetchCourseLessons,
        fetchExamQuestions,
        isEnrolledInCourse,
        toggleLessonComplete,
        submitExamAttempt,
        seedDatabase,
        saveCourse,
        deleteCourse,
        saveCourseLesson,
        deleteCourseLesson,
        saveExam,
        deleteExam,
        saveExamQuestion,
        deleteExamQuestion,
        saveBooklet,
        deleteBooklet,
        saveArticle,
        deleteArticle,
        toggleUserDiamond,
        updateOrderStatus,
        grantAdminRole,
        revokeAdminRole,
        createTicket,
        replyToTicket,
        closeTicket,
        deleteTicket,
        markNotificationRead,
        markAllNotificationsRead,
        toggleExamReminder,
        updateNotificationPreferences,
        saveExamNotification,
        toggleExamNotificationActive,
        deleteExamNotification,
        saveLiveClass,
        updateLiveClassBoard,
        setLiveClassStatus,
        toggleLiveClassBoard,
        updateHostMediaState,
        deleteLiveClass,
        subscribeLiveClassMessages,
        sendLiveClassMessage,
        updateLiveClassMessageModeration,
        deleteLiveClassMessage,
        subscribeLiveClassStrokes,
        addLiveClassStroke,
        clearLiveClassStrokes,
        subscribeLiveClassParticipants,
        upsertMyLiveClassPresence,
        setParticipantMediaPermission,
        subscribeLiveClassSignals,
        sendLiveClassSignal,
        consumeLiveClassSignal,
        toasts,
        notify,
        dismissToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
