import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/user/Dashboard'
import JoinQueue from './pages/user/JoinQueue'
import QueueStatus from './pages/user/QueueStatus'
import History from './pages/user/History'
import AdminDashboard from './pages/admin/AdminDashboard'
import ServiceManagement from './pages/admin/ServiceManagement'
import QueueManagement from './pages/admin/QueueManagement'
import Reports from './pages/admin/Reports'

function getHomePath(role) {
  if (role === 'admin') return '/admin'
  if (role === 'tutor') return '/tutor'
  return '/dashboard'
}

function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser } = useApp()
  if (!currentUser) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to={getHomePath(currentUser.role)} replace />
  }
  return children
}

function AppRoutes() {
  const { currentUser } = useApp()

  return (
    <Routes>
      <Route
        path="/login"
        element={
          currentUser ? (
            <Navigate to={getHomePath(currentUser.role)} replace />
          ) : (
            <Login />
          )
        }
      />
      <Route
        path="/register"
        element={
          currentUser ? (
            <Navigate to={getHomePath(currentUser.role)} replace />
          ) : (
            <Register />
          )
        }
      />

      <Route element={<ProtectedRoute allowedRoles={['student']}><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/join-queue" element={<JoinQueue />} />
        <Route path="/queue-status" element={<QueueStatus />} />
        <Route path="/history" element={<History />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['tutor', 'admin']}><Layout /></ProtectedRoute>}>
        <Route path="/tutor" element={<AdminDashboard />} />
        <Route path="/tutor/queues" element={<QueueManagement />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin']}><Layout /></ProtectedRoute>}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/services" element={<ServiceManagement />} />
        <Route path="/admin/queues" element={<QueueManagement />} />
        <Route path="/admin/reports" element={<Reports />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  )
}
