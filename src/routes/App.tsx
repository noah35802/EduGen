import { Navigate, Route, Routes } from "react-router-dom";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { AdminActivityPage, AdminAnalyticsPage, AdminCoursesPage, AdminDashboard, AdminNotificationsPage, AdminSettingsPage, AdminStudentsPage, AdminSubjectsPage, AdminTeachersPage } from "../pages/admin/AdminPages";
import { ForgotPasswordPage, LoginPage, RegisterPage } from "../pages/auth/AuthPages";
import { LandingPage } from "../pages/LandingPage";
import { AINotesPage, AIQuizGeneratorPage, AITutorPage, FlashcardsPage, StudyPlannerPage } from "../pages/student/AIFeaturePages";
import { CourseDetailPage, MyCoursesPage } from "../pages/student/CoursesPages";
import { AssignmentsPage, AttendancePage, NotificationsPage, PerformancePage, ProfilePage, RecommendationsPage, ResourcesPage, SettingsPage, SubjectsPage, QuizzesPage } from "../pages/student/StudentUtilityPages";
import { StudentDashboard } from "../pages/student/StudentDashboard";
import { TeacherAIQuizGeneratorPage, TeacherAIReportsPage, TeacherAnalyticsPage, TeacherAssignmentsPage, TeacherCoursesPage, TeacherDashboard, TeacherNotificationsPage, TeacherProfilePage, TeacherSettingsPage, TeacherStudentsPage, TeacherUploadPage } from "../pages/teacher/TeacherPages";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      <Route path="/student" element={<DashboardLayout role="student" />}>
        <Route index element={<Navigate to="/student/dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="courses" element={<MyCoursesPage />} />
        <Route path="courses/:id" element={<CourseDetailPage />} />
        <Route path="subjects" element={<SubjectsPage />} />
        <Route path="assignments" element={<AssignmentsPage />} />
        <Route path="quizzes" element={<QuizzesPage />} />
        <Route path="ai-tutor" element={<AITutorPage />} />
        <Route path="ai-notes" element={<AINotesPage />} />
        <Route path="flashcards" element={<FlashcardsPage />} />
        <Route path="study-planner" element={<StudyPlannerPage />} />
        <Route path="recommendations" element={<RecommendationsPage />} />
        <Route path="performance" element={<PerformancePage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="/teacher" element={<DashboardLayout role="teacher" />}>
        <Route index element={<Navigate to="/teacher/dashboard" replace />} />
        <Route path="dashboard" element={<TeacherDashboard />} />
        <Route path="courses" element={<TeacherCoursesPage />} />
        <Route path="students" element={<TeacherStudentsPage />} />
        <Route path="notes" element={<TeacherUploadPage />} />
        <Route path="assignments" element={<TeacherAssignmentsPage />} />
        <Route path="quizzes" element={<TeacherAssignmentsPage />} />
        <Route path="ai-generator" element={<TeacherAIQuizGeneratorPage />} />
        <Route path="analytics" element={<TeacherAnalyticsPage />} />
        <Route path="ai-reports" element={<TeacherAIReportsPage />} />
        <Route path="resources" element={<TeacherUploadPage />} />
        <Route path="notifications" element={<TeacherNotificationsPage />} />
        <Route path="profile" element={<TeacherProfilePage />} />
        <Route path="settings" element={<TeacherSettingsPage />} />
      </Route>

      <Route path="/admin" element={<DashboardLayout role="admin" />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="students" element={<AdminStudentsPage />} />
        <Route path="teachers" element={<AdminTeachersPage />} />
        <Route path="courses" element={<AdminCoursesPage />} />
        <Route path="subjects" element={<AdminSubjectsPage />} />
        <Route path="analytics" element={<AdminAnalyticsPage />} />
        <Route path="activity" element={<AdminActivityPage />} />
        <Route path="notifications" element={<AdminNotificationsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
