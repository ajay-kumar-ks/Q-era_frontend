import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/common/ProtectedRoute'
import AdminRoute from './components/common/AdminRoute'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import QuestionsPage from './pages/questions/QuestionsPage'
import QuestionDetailPage from './pages/questions/QuestionDetailPage'
import CreateQuestionPage from './pages/questions/CreateQuestionPage'
import ExamsPage from './pages/exams/ExamsPage'
import ExamDetailPage from './pages/exams/ExamDetailPage'
import CreateExamPage from './pages/exams/CreateExamPage'
import AttendExamPage from './pages/exams/AttendExamPage'
import ExamResultPage from './pages/exams/ExamResultPage'
import ExamLeaderboardPage from './pages/exams/ExamLeaderboardPage'
import GlobalLeaderboardPage from './pages/leaderboard/GlobalLeaderboardPage'
import MyProfilePage from './pages/profile/MyProfilePage'
import PublicProfilePage from './pages/profile/PublicProfilePage'
import BookmarksPage from './pages/bookmarks/BookmarksPage'
import NotificationsPage from './pages/notifications/NotificationsPage'
import ReviewsPage from './pages/reviews/ReviewsPage'
import CalendarPage from './pages/calendar/CalendarPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import UserManagementPage from './pages/admin/UserManagementPage'
import ContentModerationPage from './pages/admin/ContentModerationPage'
import ExamManagementPage from './pages/admin/ExamManagementPage'
import ImportExportPage from './pages/admin/ImportExportPage'
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage'
import AdminApprovalPage from './pages/admin/AdminApprovalPage'
import TutorPage from './pages/ai/TutorPage'
import { useAuth } from './context/AuthContext'
import Loader from './components/common/Loader'


function HomeRedirect() {
  const { isAuthenticated, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-200">
        <Loader />
      </div>
    )
  }
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/questions" element={<QuestionsPage />} />
          <Route path="/questions/:id" element={<QuestionDetailPage />} />
          <Route path="/questions/create" element={<CreateQuestionPage />} />
          <Route path="/exams" element={<ExamsPage />} />
          <Route path="/exams/create" element={<CreateExamPage />} />
          <Route path="/exams/:id" element={<ExamDetailPage />} />
          <Route path="/exams/:id/attend" element={<AttendExamPage />} />
          <Route path="/exams/:id/result/:aid" element={<ExamResultPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/leaderboard/exam/:id" element={<ExamLeaderboardPage />} />
          <Route path="/leaderboard" element={<GlobalLeaderboardPage />} />
          <Route path="/profile/me" element={<MyProfilePage />} />
          <Route path="/profile/:uid" element={<PublicProfilePage />} />
          <Route path="/bookmarks" element={<BookmarksPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/tutor" element={<TutorPage />} />
        </Route>
      </Route>

      <Route element={<AdminRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<UserManagementPage />} />
          <Route path="/admin/moderation" element={<ContentModerationPage />} />
          <Route path="/admin/exams" element={<ExamManagementPage />} />
          <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
          <Route path="/admin/approvals" element={<AdminApprovalPage />} />
          <Route path="/admin/import-export" element={<ImportExportPage />} />
        </Route>
      </Route>


      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
