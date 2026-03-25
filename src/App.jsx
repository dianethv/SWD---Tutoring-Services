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

function ProtectedRoute({ children, allowedRole }) {
  const { currentUser } = useApp()
  if (!currentUser) return <Navigate to="/login" replace />
  if (allowedRole && currentUser.role !== allowedRole) {
    return <Navigate to={currentUser.role === 'admin' ? '/admin' : '/dashboard'} replace />
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
            <Navigate to={currentUser.role === 'admin' ? '/admin' : '/dashboard'} replace />
          ) : (
            <Login />
          )
        }
      />
      <Route
        path="/register"
        element={
          currentUser ? (
            <Navigate to={currentUser.role === 'admin' ? '/admin' : '/dashboard'} replace />
          ) : (
            <Register />
          )
        }
      />

      <Route element={<ProtectedRoute allowedRole="student"><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/join-queue" element={<JoinQueue />} />
        <Route path="/queue-status" element={<QueueStatus />} />
        <Route path="/history" element={<History />} />
      </Route>

      <Route element={<ProtectedRoute allowedRole="admin"><Layout /></ProtectedRoute>}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/services" element={<ServiceManagement />} />
        <Route path="/admin/queues" element={<QueueManagement />} />
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
