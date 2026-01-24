/* eslint-disable @typescript-eslint/no-explicit-any */
// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  error?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  message: string
  data: {
    items: T[]
    pagination: {
      currentPage: number
      totalPages: number
      totalItems: number
      itemsPerPage: number
      hasNext: boolean
      hasPrev: boolean
      nextPage: number | null
      prevPage: number | null
    }
    meta?: {
      search?: string
      filter?: Record<string, any>
    }
  }
}

// Pagination Parameters
export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
  sort?: string
  isActive?: boolean
  [key: string]: any
}

// Auth Types
export interface LoginCredentials {
  email?: string
  userName?: string
  password: string
}

export interface AuthResponse {
  admin: Admin
  token: string
}

// Admin Types
export interface Admin {
  _id: string
  userName: string
  email: string
  phone?: string
  roleId: Role
  isActive: boolean
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
}

export interface CreateAdminInput {
  userName: string
  email: string
  password: string
  roleId: string
  phone?: string
}

export interface UpdateAdminInput {
  userName?: string
  email?: string
  phone?: string
  isActive?: boolean
  roleId?: string
}

// Role Types
export interface Role {
  _id: string
  name: string
  permissions: Permission[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateRoleInput {
  name: string
  permissions: string[]
}

export interface UpdateRoleInput {
  name?: string
  permissions?: string[]
  isActive?: boolean
}

// Permission Types
export interface Permission {
  _id: string
  name: string
  resource: string
  action: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// New types for grouped permissions
export interface PermissionGroup {
  resource: string
  permissions: Permission[]
}

export interface GroupedPermissionsResponse {
  success: boolean
  message: string
  data: PermissionGroup[]
  count: number
}

export type CreatePermissionInput = Pick<
  Permission,
  "name" | "resource" | "action" | "description"
>
export type UpdatePermissionInput = Partial<
  Pick<Permission, "name" | "resource" | "action" | "description" | "isActive">
>

export type PermissionResource =
  | "admin"
  | "roles"
  | "permissions"
  | "users"
  | "faculties"
  | "universities"
  | "courses"
  | "enrollments"
  | "lessons"
  | "topics"

export type PermissionAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "export"
  | "import"

// University Types
export interface University {
  _id: string
  name:
  | {
    en: string
    ar?: string
    he?: string
  }
  | string // Support both multilingual and simple string for display
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateUniversityInput {
  name: {
    en: string
    ar?: string
    he?: string
  }
}

export interface UpdateUniversityInput {
  name?: {
    en: string
    ar?: string
    he?: string
  }
  isActive?: boolean
}

// Faculty Types
export interface Faculty {
  _id: string
  name:
  | {
    en: string
    ar?: string
    he?: string
  }
  | string // Support both multilingual and simple string for display
  universityId: University | string
  no_academic_year: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateFacultyInput {
  name: {
    en: string
    ar?: string
    he?: string
  }
  universityId: string
  no_academic_year: number
}

export interface UpdateFacultyInput {
  name?: {
    en: string
    ar?: string
    he?: string
  }
  universityId?: string
  no_academic_year?: number
  isActive?: boolean
}

// User Types
export interface User {
  _id: string
  fullName: string
  email: string
  phone?: string
  universityId: University
  facultyId: Faculty
  academicYear: string
  semester: string
  enrollmentIds: string[]
  progressIds: string[]
  blocked: boolean
  emailVerified: boolean
  devices: Device[]
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
}

export interface Device {
  deviceId: string
  deviceName: string
  deviceType: "mobile" | "desktop" | "tablet"
  userAgent: string
  ipAddress: string
  isVerified: boolean
  lastUsed: Date
  createdAt: Date
}

export interface CreateUserInput {
  fullName: string
  email: string
  password: string
  universityId: string
  facultyId: string
  academicYear: string
  semester: string
  phone?: string
}

export interface UpdateUserInput {
  fullName?: string
  email?: string
  phone?: string
  universityId?: string
  facultyId?: string
  academicYear?: string
  semester?: string
}

// Course Types
export interface Course {
  _id: string
  name:
  | {
    en: string
    ar?: string
    he?: string
  }
  | string
  aboutCourse:
  | {
    en: string
    ar?: string
    he?: string
  }
  | string
  whatWillYouLearn:
  | Array<{
    en: string
    ar?: string
    he?: string
  }>
  | string[]
  numberOfCourseHours: number
  coursePrice: number
  discount: number
  facultyIds: Faculty[] | string[]
  instructorId: Admin | string
  instructorPercentage: number
  imageUrl: string
  introductoryVideoUrl: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  discountedPrice?: number
  totalLearningOutcomes?: number
}

export interface CreateCourseInput {
  name: {
    en: string
    ar?: string
    he?: string
  }
  aboutCourse: {
    en: string
    ar?: string
    he?: string
  }
  whatWillYouLearn: Array<{
    en: string
    ar?: string
    he?: string
  }>
  numberOfCourseHours: number
  coursePrice: number
  discount?: number
  facultyIds: string[]
  instructorId: string
  instructorPercentage: number
  imageUrl: string
  introductoryVideoUrl: string
}

export interface UpdateCourseInput {
  name?: {
    en: string
    ar?: string
    he?: string
  }
  aboutCourse?: {
    en: string
    ar?: string
    he?: string
  }
  whatWillYouLearn?: Array<{
    en: string
    ar?: string
    he?: string
  }>
  numberOfCourseHours?: number
  coursePrice?: number
  discount?: number
  facultyIds?: string[]
  instructorId?: string
  instructorPercentage?: number
  imageUrl?: string
  introductoryVideoUrl?: string
  isActive?: boolean
}

export interface CourseStats {
  total: number
  active: number
  inactive: number
  averagePrice: number
  averageHours: number
  totalRevenue: number
}

// Topic Types
export interface Topic {
  _id: string
  name:
  | {
    en: string
    ar?: string
    he?: string
  }
  | string
  courseId: Course | string
  topicsPrice: number
  discount: number
  order: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  discountedPrice?: number
  finalPrice?: number
  savingsAmount?: number
  hasDiscount?: boolean
}

export interface CreateTopicInput {
  name: {
    en: string
    ar?: string
    he?: string
  }
  courseId: string
  topicsPrice: number
  discount?: number
}

export interface UpdateTopicInput {
  name: {
    en: string
    ar?: string
    he?: string
  }
  courseId?: string
  topicsPrice?: number
  discount?: number
  isActive?: boolean
}

export interface TopicStats {
  total: number
  active: number
  inactive: number
  averagePrice: number
  totalWithDiscount: number
  averageDiscount: number
  totalRevenue: number
}

export interface ReorderTopicsInput {
  topicOrders: Array<{
    topicId: string
    order: number
  }>
}

// Lesson Types
export interface Lesson {
  _id: string
  name:
  | {
    en: string
    ar?: string
    he?: string
  }
  | string
  description:
  | {
    en: string
    ar?: string
    he?: string
  }
  | string
  topicId: Topic | string
  main_recording_url: string | { id: string; name: string; videoUrl: string }
  recording_gvo_url?: string | { id: string; name: string; videoUrl: string }
  recording_vvt_url?: string | { id: string; name: string; videoUrl: string }
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateLessonInput {
  name: {
    en: string
    ar?: string
    he?: string
  }
  description?: {
    en: string
    ar?: string
    he?: string
  }
  topicId: string
  main_recording_url: string
  recording_gvo_url?: string
  recording_vvt_url?: string
}

export interface UpdateLessonInput {
  name?: {
    en: string
    ar?: string
    he?: string
  }
  description?: {
    en: string
    ar?: string
    he?: string
  }
  topicId?: string
  main_recording_url?: string
  recording_gvo_url?: string
  recording_vvt_url?: string
  isActive?: boolean
}

export interface LessonStats {
  total: number
  active: number
  inactive: number
}

export interface ReorderLessonsInput {
  reorderData: Array<{
    lessonId: string
    newOrder: number
  }>
}

// Error Types
export interface ValidationError {
  field: string
  message: string
}

export interface ApiError {
  success: false
  message: string
  errors?: ValidationError[]
  error?: string
}

// Enrollment Types
export interface Enrollment {
  _id: string
  userId: User
  courseId: Course
  enrollmentType: 'full_course' | 'individual_topic' | 'free_course'
  fullAccess: boolean
  purchasedTopics: Topic[]
  totalAmount: number
  discountAmount: number
  finalAmount: number
  currency: 'usd' | 'eur' | 'gbp' | 'aed'
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled'
  paypalPayment?: {
    orderId: string
    captureId?: string
    amount: number
    currency: string
    status: string
    payerEmail?: string
    payerName?: string
    createTime?: string
    updateTime?: string
  }
  expiresAt?: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateEnrollmentInput {
  courseId: string
  fullAccess: boolean
  purchasedTopics?: string[]
  currency?: 'usd' | 'eur' | 'gbp' | 'aed'
}

export interface UpdateEnrollmentInput {
  fullAccess?: boolean
  purchasedTopics?: string[]
  totalAmount?: number
  discountAmount?: number
  finalAmount?: number
  paymentStatus?: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled'
  isActive?: boolean
  expiresAt?: Date
}

export interface RefundRequest {
  amount?: number
}

export interface EnrollmentStats {
  totalEnrollments: number
  completedPayments: number
  pendingPayments: number
  totalRevenue: number
  fullAccessEnrollments: number
  individualTopicEnrollments: number
}

export interface EnrollmentFilters {
  status?: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled' | 'all'
  isActive?: boolean
  fullAccess?: boolean
  courseId?: string
  userId?: string
  startDate?: string
  endDate?: string
}

// Video Library Types
export interface VideoLibrary {
  _id: string;
  name: string; // Backend returns string, not multilingual object
  videoUrl: string;
  videoType: string;
  fileSize: number;
  entityType: 'lesson' | 'course';
  uploadedBy: {
    _id: string;
    userName: string;
    email: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface VideoLibraryResponse {
  success: boolean;
  message: string;
  data: {
    docs: VideoLibrary[];
    totalDocs: number;
    limit: number;
    totalPages: number;
    page: number;
    pagingCounter: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    prevPage: number | null;
    nextPage: number | null;
    meta: {
      filter: {
        isActive: boolean;
      };
    };
  };
}

export interface CreateVideoLibraryInput {
  name: {
    en: string;
    ar?: string;
    he?: string;
  };
  videoUrl: string;
  videoType: string;
  fileSize?: number;
  entityType: 'lesson' | 'course';
  uploadedBy?: string;
}

export interface UpdateVideoLibraryInput {
  name?: {
    en?: string;
    ar?: string;
    he?: string;
  };
  isActive?: boolean;
}

export interface VideoLibraryQueryParams extends PaginationParams {
  entityType?: 'lesson' | 'course';
  videoType?: string;
  uploadedBy?: string;
  isActive?: boolean;
  search?: string;
  fileSizeMin?: number;
  fileSizeMax?: number;
  language?: 'en' | 'ar' | 'he' | 'all';
  includePresignedUrls?: boolean;
}

export interface VideoLibraryStats {
  totalVideos: number;
  totalFileSize: number;
  averageFileSize: number;
  videoTypes: { [key: string]: number };
}

export interface VideoForSelect {
  id: string;
  name: string;
  videoUrl: string;
}

// Quiz Types
export const QuizType = {
  COURSE: 'course',
  TOPIC: 'topic',
  LESSON: 'lesson',
  FREECOURSE: 'freeCourse',
  SECTION: 'section',
} as const

export type QuizType = typeof QuizType[keyof typeof QuizType]

export const QuestionType = {
  MCQ: 'mcq',
} as const

export type QuestionType = typeof QuestionType[keyof typeof QuestionType]

export const QuizAttemptStatus = {
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  ABANDONED: 'abandoned',
  EXPIRED: 'expired',
} as const

export type QuizAttemptStatus = typeof QuizAttemptStatus[keyof typeof QuizAttemptStatus]

export interface MCQOption {
  text: {
    en: string;
    ar?: string;
    he?: string;
  };
  isCorrect: boolean;
  order?: number;
}

export interface Question {
  question: {
    en: string;
    ar?: string;
    he?: string;
  };
  type: QuestionType;
  options: MCQOption[];
  explanation?: {
    en: string;
    ar?: string;
    he?: string;
  };
  points: number;
  order?: number;
}

export interface Quiz {
  _id: string;
  title: {
    en: string;
    ar?: string;
    he?: string;
  } | string;
  description?: {
    en: string;
    ar?: string;
    he?: string;
  } | string;
  quizType: QuizType;
  entityId: string;
  questions: Question[];
  totalPoints: number;
  passingScore: number;
  timeLimit?: number;
  maxAttempts?: number;
  showCorrectAnswers: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateQuizInput {
  title: {
    en: string;
    ar?: string;
    he?: string;
  };
  description?: {
    en: string;
    ar?: string;
    he?: string;
  };
  quizType: QuizType;
  entityId: string;
  questions: Question[];
  passingScore?: number;
  timeLimit?: number;
  maxAttempts?: number;
  showCorrectAnswers?: boolean;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
}

export interface UpdateQuizInput {
  title?: {
    en: string;
    ar?: string;
    he?: string;
  };
  description?: {
    en: string;
    ar?: string;
    he?: string;
  };
  questions?: Question[];
  passingScore?: number;
  timeLimit?: number;
  maxAttempts?: number;
  showCorrectAnswers?: boolean;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  isActive?: boolean;
}

export interface QuizAnswer {
  questionOrder: number;
  selectedOptions: number[];
}

export interface QuizSubmission {
  answers: QuizAnswer[];
}

export interface QuestionResult {
  questionOrder: number;
  selectedOptions: number[];
  correctOptions: number[];
  isCorrect: boolean;
  order?: number;
  pointsEarned: number;
  maxPoints: number;
  timeSpent?: number;
}

export interface QuizAttempt {
  attemptNumber: number;
  status: QuizAttemptStatus;
  startedAt: Date;
  completedAt?: Date;
  timeSpent?: number;
  answers: QuizAnswer[];
  results?: QuestionResult[];
  totalScore: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  ipAddress?: string;
  userAgent?: string;
}

export interface QuizProgress {
  _id: string;
  userId: string;
  quizId: string;
  attempts: QuizAttempt[];
  bestScore: number;
  bestPercentage: number;
  totalAttempts: number;
  passedAttempts: number;
  isPassed: boolean;
  lastAttemptAt: Date;
  firstAttemptAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuizStatistics {
  totalUsers: number;
  passedUsers: number;
  failedUsers: number;
  passRate: number;
  averageBestScore: number;
  averageBestPercentage: number;
  totalAttempts: number;
  averageAttempts: number;
}

export interface QuizLeaderboardEntry {
  userId: {
    _id: string;
    fullName: string;
    email: string;
  };
  bestScore: number;
  bestPercentage: number;
  totalAttempts: number;
  isPassed: boolean;
  lastAttemptAt: Date;
}

export interface QuizQueryParams extends PaginationParams {
  quizType?: QuizType;
  entityId?: string;
  isActive?: boolean;
}

export interface DuplicateQuizInput {
  entityId: string;
  quizType?: QuizType;
  newTitle?: {
    en: string;
    ar?: string;
    he?: string;
  };
}

// Free Course Types
export const ContentItemType = {
  FILE: 'file',
  VIDEO: 'video',
  QUIZ: 'quiz',
} as const

export type ContentItemType = typeof ContentItemType[keyof typeof ContentItemType]

export interface ContentItem {
  _id: string;
  type: ContentItemType;
  title: {
    en: string;
    ar?: string;
    he?: string;
  };
  resourceId?: string; // AttachedFile, VideoLibrary, or Quiz ID
  url?: string; // For external videos
  order?: number;
}

export interface Section {
  _id: string;
  title: {
    en: string;
    ar?: string;
    he?: string;
  };
  description?: {
    en: string;
    ar?: string;
    he?: string;
  };
  isVisible: boolean;
  contentItems: ContentItem[];
  order?: number;
}

export interface FreeCourse {
  _id: string;
  name: {
    en: string;
    ar?: string;
    he?: string;
  } | string;
  overview: {
    en: string;
    ar?: string;
    he?: string;
  } | string;
  universityId: University | string;
  facultyId: Faculty | string;
  instructorId: Admin | string;
  imageUrl: string;
  sections: Section[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  totalSections?: number;
  totalContentItems?: number;
}

export interface CreateFreeCourseInput {
  name: {
    en: string;
    ar?: string;
    he?: string;
  };
  overview: {
    en: string;
    ar?: string;
    he?: string;
  };
  universityId: string;
  facultyId: string;
  instructorId: string;
  imageUrl: string;
  sections?: Section[];
}

export interface UpdateFreeCourseInput {
  name?: {
    en: string;
    ar?: string;
    he?: string;
  };
  overview?: {
    en: string;
    ar?: string;
    he?: string;
  };
  universityId?: string;
  facultyId?: string;
  instructorId?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export interface CreateSectionInput {
  title: {
    en: string;
    ar?: string;
    he?: string;
  };
  description?: {
    en: string;
    ar?: string;
    he?: string;
  };
  isVisible?: boolean;
  contentItems?: ContentItem[];
}

export interface UpdateSectionInput {
  title?: {
    en: string;
    ar?: string;
    he?: string;
  };
  description?: {
    en: string;
    ar?: string;
    he?: string;
  };
  isVisible?: boolean;
  order?: number;
}

export interface CreateContentItemInput {
  type: ContentItemType;
  title: {
    en: string;
    ar?: string;
    he?: string;
  };
  resourceId?: string;
  url?: string;
}

export interface FreeCourseQueryParams extends PaginationParams {
  universityId?: string;
  facultyId?: string;
  instructorId?: string;
  isActive?: boolean;
}

export interface FreeCourseEnrollment extends Enrollment {
  freeCourseId: FreeCourse;
  enrollmentType: 'free_course';
}

// Progress Tracking Types
export type VideoType = "main" | "gvo" | "vvt";

export interface VideoProgress {
  lessonId: string;
  videoType: VideoType;
  watchedDuration: number;
  totalDuration: number;
  lastWatchedPosition: number;
  completionPercentage: number;
  isCompleted: boolean;
  watchCount: number;
  firstWatchedAt: string;
  lastWatchedAt: string;
}

export interface LessonProgress {
  lessonId: string;
  isCompleted: boolean;
  completedAt?: string;
  timeSpent: number;
  videosProgress: VideoProgress[];
  firstAccessedAt: string;
  lastAccessedAt: string;
}

export interface TopicProgress {
  topicId: string;
  isCompleted: boolean;
  completedAt?: string;
  lessonsProgress: LessonProgress[];
  completedLessons: number;
  totalLessons: number;
  completionPercentage: number;
  timeSpent: number;
  firstAccessedAt: string;
  lastAccessedAt: string;
}

export interface Progress {
  _id: string;
  userId: string;
  courseId: string;
  enrollmentId: string;
  topicsProgress: TopicProgress[];
  completedTopics: number;
  totalTopics: number;
  completedLessons: number;
  totalLessons: number;
  courseCompletionPercentage: number;
  totalTimeSpent: number;
  isCourseCompleted: boolean;
  startedAt: string;
  completedAt?: string;
  lastAccessedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProgressSummary {
  userId: string;
  courseId: string;
  enrollmentId: string;
  completedTopics: number;
  totalTopics: number;
  completedLessons: number;
  totalLessons: number;
  courseCompletionPercentage: number;
  totalTimeSpent: number;
  totalTimeSpentFormatted: string;
  isCourseCompleted: boolean;
  startedAt: string;
  completedAt?: string;
  lastAccessedAt: string;
  topicsProgress: Array<{
    topicId: string;
    isCompleted: boolean;
    completedAt?: string;
    completedLessons: number;
    totalLessons: number;
    completionPercentage: number;
    timeSpent: number;
    timeSpentFormatted: string;
  }>;
}

export interface ProgressWithCourse {
  course: Course;
  enrollment: Enrollment;
  progress: Progress;
  instructorPercentage: number;
  imageUrl: string;
  introductoryVideoUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};


export interface TopicProgressDetail {
  topicId: {
    _id: string;
    name: {
      en: string;
      ar?: string;
      he?: string;
    };
    topicsPrice: number;
    discount: number;
  };
  isCompleted: boolean;
  completedAt?: string;
  completedLessons: number;
  totalLessons: number;
  completionPercentage: number;
  timeSpent: number;
  timeSpentFormatted: string;
  lessonsProgress: Array<{
    lesson: {
      _id: string;
      name: {
        en: string;
        ar?: string;
        he?: string;
      };
      description: {
        en: string;
        ar?: string;
        he?: string;
      };
      main_recording_url: string;
      recording_gvo_url: string;
      recording_vvt_url: string;
    };
    isCompleted: boolean;
    completedAt?: string;
    timeSpent: number;
    timeSpentFormatted: string;
    videosProgress: VideoProgress[];
    lastAccessedAt: string;
  }>;
}

export interface LessonProgressDetail {
  lessonId: string;
  topicId: string;
  isCompleted: boolean;
  completedAt?: string;
  timeSpent: number;
  timeSpentFormatted: string;
  videosProgress: VideoProgress[];
  firstAccessedAt: string;
  lastAccessedAt: string;
}

export interface CourseStatistics {
  totalUsers: number;
  completedUsers: number;
  inProgressUsers: number;
  completionRate: number;
  averageCompletion: number;
  averageTimeSpent: number;
  totalTimeSpent: number;
}

export interface LeaderboardEntry {
  rank: number;
  user: {
    _id: string;
    fullName: string;
    email: string;
  };
  completionPercentage: number;
  completedLessons: number;
  totalLessons: number;
  totalTimeSpent: number;
  totalTimeSpentFormatted: string;
  isCourseCompleted: boolean;
  completedAt?: string;
}

// Progress Request Types
export interface InitializeProgressRequest {
  enrollmentId: string;
  courseId: string;
}

export interface MarkLessonViewedRequest {
  enrollmentId: string;
  lessonId: string;
  topicId: string;
}

export interface MarkLessonCompletedRequest {
  enrollmentId: string;
  lessonId: string;
  topicId: string;
}

export interface UpdateVideoProgressRequest {
  enrollmentId: string;
  lessonId: string;
  topicId: string;
  videoType: VideoType;
  watchedDuration: number;
  totalDuration: number;
  currentPosition: number;
}

export interface AddTimeSpentRequest {
  enrollmentId: string;
  lessonId: string;
  topicId: string;
  seconds: number;
}

export interface ResetProgressRequest {
  userId: string;
}

export interface DeleteProgressRequest {
  userId: string;
}

// Progress Query Parameters
export interface ProgressQueryParams extends PaginationParams {
  courseId?: string;
  userId?: string;
  isCompleted?: boolean;
}