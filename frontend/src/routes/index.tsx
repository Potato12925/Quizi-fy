import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Layouts
import AdminLayout from '@/layouts/AdminLayout';
import TeacherLayout from '@/layouts/TeacherLayout';
import StudentLayout from '@/layouts/StudentLayout';

// Pages
import Home from '@/pages/Home';
import Login from '@/pages/auth/Login';

// Admin Pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminClasses from '@/pages/admin/AdminClasses';
import AdminSubjects from '@/pages/admin/AdminSubjects';

// Teacher Pages
import TeacherDashboard from '@/pages/teacher/TeacherDashboard';
import TeacherAIGenerator from '@/pages/teacher/TeacherAIGenerator';
import TeacherQuestionBank from '@/pages/teacher/TeacherQuestionBank';
import TeacherResources from '@/pages/teacher/TeacherResources';
import TeacherStats from '@/pages/teacher/TeacherStats';
import TeacherSettings from '@/pages/teacher/TeacherSettings';

// Student Pages
import StudentDashboard from '@/pages/student/StudentDashboard';
import StudentHistory from '@/pages/student/StudentHistory';
import StudentPractice from '@/pages/student/StudentPractice';
import StudentPracticeSetup from '@/pages/student/StudentPracticeSetup';
import StudentPracticeDetail from '@/pages/student/StudentPracticeDetail';
import StudentProgress from '@/pages/student/StudentProgress';
import StudentResults from '@/pages/student/StudentResults';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  // Admin Routes
  {
    path: '/admin',
    element: <ProtectedRoute allowedRoles={['admin']} />,
    children: [
      {
        path: '',
        element: <AdminLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/admin/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <AdminDashboard />,
          },
          {
            path: 'users',
            element: <AdminUsers />,
          },
          {
            path: 'classes',
            element: <AdminClasses />,
          },
          {
            path: 'subjects',
            element: <AdminSubjects />,
          },
        ]
      }
    ],
  },
  // Teacher Routes
  {
    path: '/teacher',
    element: <ProtectedRoute allowedRoles={['teacher']} />,
    children: [
      {
        path: '',
        element: <TeacherLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/teacher/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <TeacherDashboard />,
          },
          {
            path: 'ai-generator',
            element: <TeacherAIGenerator />,
          },
          {
            path: 'question-bank',
            element: <TeacherQuestionBank />,
          },
          {
            path: 'resources',
            element: <TeacherResources />,
          },
          {
            path: 'stats',
            element: <TeacherStats />,
          },
          {
            path: 'settings',
            element: <TeacherSettings />,
          },
        ]
      }
    ],
  },
  // Student Routes
  {
    path: '/student',
    element: <ProtectedRoute allowedRoles={['student']} />,
    children: [
      {
        path: '',
        element: <StudentLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/student/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <StudentDashboard />,
          },
          {
            path: 'history',
            element: <StudentHistory />,
          },
          {
            path: 'practice',
            element: <StudentPractice />,
          },
          {
            path: 'practice/setup',
            element: <StudentPracticeSetup />,
          },
          {
            path: 'practice/:id',
            element: <StudentPracticeDetail />,
          },
          {
            path: 'progress',
            element: <StudentProgress />,
          },
          {
            path: 'results',
            element: <Navigate to="/student/history" replace />,
          },
          {
            path: 'results/:id',
            element: <StudentResults />,
          },

        ]
      }
    ],
  },
]);


