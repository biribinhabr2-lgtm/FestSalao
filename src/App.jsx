import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './components/ui/Toast'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Escalas from './pages/Escalas'
import Eventos from './pages/Eventos'
import Avisos from './pages/Avisos'
import Checklists from './pages/Checklists'
import Financeiro from './pages/Financeiro'
import Configuracoes from './pages/Configuracoes'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout><Dashboard /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/escalas" element={
        <ProtectedRoute>
          <Layout><Escalas /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/eventos" element={
        <ProtectedRoute>
          <Layout><Eventos /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/avisos" element={
        <ProtectedRoute>
          <Layout><Avisos /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/checklists" element={
        <ProtectedRoute>
          <Layout><Checklists /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/financeiro" element={
        <ProtectedRoute adminOnly>
          <Layout><Financeiro /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/configuracoes" element={
        <ProtectedRoute adminOnly>
          <Layout><Configuracoes /></Layout>
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
