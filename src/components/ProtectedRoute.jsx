import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, profile, loading, isAdmin } = useAuth()

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', flexDirection:'column', gap:12 }}>
        <div style={{ width:36, height:36, border:'3px solid var(--border)', borderTopColor:'var(--accent)', borderRadius:'50%' }} className="animate-spin" />
        <span style={{ fontSize:13, color:'var(--text-3)' }}>Carregando…</span>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />

  return children
}
