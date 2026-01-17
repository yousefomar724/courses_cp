import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "./lib/queryClient";
import { useAuthStore } from "./stores/auth-store";
import { LoginPage } from "./pages/login-page";
import { DashboardLayout } from "./components/layout/dashboard-layout";
import { DashboardHome } from "./pages/dashboard-home";
import { AdminsPage } from "./pages/admins-page";
import { UsersPage } from "./pages/users-page";
import { UniversitiesPage } from "./pages/universities-page";
import { FacultiesPage } from "./pages/faculties-page";
import { RolesPage } from "./pages/roles-page";
import { CoursesPage } from "./pages/course/courses-page";
import { CreateCourse } from "./pages/course/create-update-course";
import { TopicsPage } from "./pages/course/topic/topics-page";
import { LessonsPage } from "./pages/course/lesson/lessons-page";
import { CreateUpdateLesson } from "./pages/course/lesson/create-update-lesson";
import { LoadingSpinner } from "./components/ui/loading-spinner";
import { CourseFilesPage } from "./pages/course/course-files/course-files-page";
import { TopicFilesPage } from "./pages/course/topic/topic-files-page";
import { LessonFilesPage } from "./pages/course/lesson/lesson-files-page";
import { EnrollmentsPage } from "./pages/enrollments-page";
import { VideosLibraryPage } from "./pages/videos-library-page";
import { QuizzesPage } from "./pages/quizzes-page";
import { CreateUpdateQuiz } from "./pages/quiz/create-update-quiz";
import { QuizStatisticsPage } from "./pages/quiz/quiz-statistics-page";
import { QuizLeaderboardPage } from "./pages/quiz/quiz-leaderboard-page";
import FreeCoursesPage from "./pages/free-courses-page";
import CreateUpdateFreeCourse from "./pages/free-course/create-update-free-course";
import SectionsPage from "./pages/free-course/sections-page";
import CreateUpdateSection from "./pages/free-course/create-update-section";
import ContentItemsPage from "./pages/free-course/content-items-page";
import CreateUpdateContentItem from "./pages/free-course/create-update-content-item";
import { FreeCourseEnrollmentsPage } from "./pages/free-course/free-course-enrollments-page";
import { CourseProgressPage } from "./pages/progress/course-progress-page";
import { CourseLeaderboardPage } from "./pages/progress/course-leaderboard-page";
import { ProgressListPage } from "./pages/progress/progress-list-page";

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Auth Route Component (redirect to dashboard if already authenticated)
function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Auth Routes */}
          <Route
            path="/login"
            element={
              <AuthRoute>
                <LoginPage />
              </AuthRoute>
            }
          />

          {/* Dashboard Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardHome />} />
            <Route path="admins" element={<AdminsPage />} />
            <Route path="roles" element={<RolesPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="universities" element={<UniversitiesPage />} />
            <Route path="faculties" element={<FacultiesPage />} />
            <Route path="courses" element={<CoursesPage />} />
            <Route path="enrollments" element={<EnrollmentsPage />} />
            <Route path="quizzes" element={<QuizzesPage />} />
            <Route path="quizzes/new" element={<CreateUpdateQuiz />} />
            <Route path="quizzes/:id/edit" element={<CreateUpdateQuiz />} />
            <Route path="quizzes/:id/statistics" element={<QuizStatisticsPage />} />
            <Route path="quizzes/:id/leaderboard" element={<QuizLeaderboardPage />} />
            <Route path="videos-library" element={<VideosLibraryPage />} />
            <Route path="free-courses" element={<FreeCoursesPage />} />
            <Route path="free-courses/create" element={<CreateUpdateFreeCourse />} />
            <Route path="free-courses/:id/edit" element={<CreateUpdateFreeCourse />} />
            <Route path="free-courses/:freeCourseId/sections" element={<SectionsPage />} />
            <Route path="free-courses/:freeCourseId/sections/create" element={<CreateUpdateSection />} />
            <Route path="free-courses/:freeCourseId/sections/:sectionId/edit" element={<CreateUpdateSection />} />
            <Route path="free-courses/:freeCourseId/sections/:sectionId/content" element={<ContentItemsPage />} />
            <Route path="free-courses/:freeCourseId/sections/:sectionId/content/create" element={<CreateUpdateContentItem />} />
            <Route path="free-courses/:freeCourseId/enrollments" element={<FreeCourseEnrollmentsPage />} />
            {/* Content item editing disabled - view only */}
            <Route path="courses/new" element={<CreateCourse />} />
            <Route path="courses/:id/edit" element={<CreateCourse />} />
            <Route path="courses/:courseId/topics" element={<TopicsPage />} />
            <Route
              path="courses/:courseId/topics/:topicId/lessons"
              element={<LessonsPage />}
            />
            <Route
              path="courses/:courseId/topics/:topicId/lessons/create"
              element={<CreateUpdateLesson />}
            />
            <Route
              path="courses/:courseId/topics/:topicId/lessons/:lessonId/edit"
              element={<CreateUpdateLesson />}
            />
            <Route
              path="courses/:courseId/files"
              element={<CourseFilesPage />}
            />
            <Route
              path="courses/:courseId/topics/:topicId/files"
              element={<TopicFilesPage />}
            />
            <Route
              path="courses/:courseId/topics/:topicId/lessons/:lessonId/files"
              element={<LessonFilesPage />}
            />
            <Route
              path="courses/:courseId/progress"
              element={<CourseProgressPage />}
            />
            <Route
              path="courses/:courseId/leaderboard"
              element={<CourseLeaderboardPage />}
            />
            <Route path="progress" element={<ProgressListPage />} />
          </Route>

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
