import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Calendar, PartyPopper, Bell,
  CheckSquare, DollarSign, Settings, LogOut, ChevronRight
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const adminNav = [
  { to: '/',            icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/escalas',     icon: Calendar,        label: 'Escalas' },
  { to: '/eventos',     icon: PartyPopper,     label: 'Eventos' },
  { to: '/avisos',      icon: Bell,            label: 'Avisos' },
  { to: '/checklists',  icon: CheckSquare,     label: 'Checklists' },
  { to: '/financeiro',  icon: DollarSign,      label: 'Financeiro' },
  { to: '/configuracoes', icon: Settings,      label: 'Configurações' },
]

const funcNav = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/escalas',    icon: Calendar,        label: 'Minha Escala' },
  { to: '/avisos',     icon: Bell,            label: 'Avisos' },
  { to: '/checklists', icon: CheckSquare,     label: 'Checklists' },
]

export default function Sidebar({ open, onClose }) {
  const { profile, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()
  const nav = isAdmin ? adminNav : funcNav

  const initials = profile?.nome
    ? profile.nome.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : '?'

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${open ? 'open' : ''}`}
        onClick={onClose}
      />

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🎪</div>
          <div>
            <div className="sidebar-logo-text">{profile?.empresa_nome || 'FestEventos'}</div>
            <div className="sidebar-logo-sub">Gestão de Espaço</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {nav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer user */}
        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={handleLogout} title="Sair">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <div className="user-name">{profile?.nome || 'Usuário'}</div>
              <div className="user-role">{profile?.cargo || (isAdmin ? 'Admin' : 'Funcionário')}</div>
            </div>
            <LogOut size={14} style={{ color: 'rgba(255,255,255,.35)', flexShrink: 0 }} />
          </div>
        </div>
      </aside>
    </>
  )
}
