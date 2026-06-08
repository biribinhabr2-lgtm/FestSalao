import { Menu, Bell, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const PAGE_TITLES = {
  '/':              'Dashboard',
  '/escalas':       'Escalas',
  '/eventos':       'Eventos',
  '/avisos':        'Avisos',
  '/checklists':    'Checklists',
  '/financeiro':    'Financeiro',
  '/configuracoes': 'Configurações',
}

export default function Header({ pathname, onMenuToggle }) {
  const title = PAGE_TITLES[pathname] || 'FestEventos'
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })

  return (
    <header className="header">
      <button className="menu-toggle" onClick={onMenuToggle} aria-label="Menu">
        <Menu size={20} />
      </button>

      <div style={{ flex: 1 }}>
        <div className="header-title">{title}</div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'capitalize' }}>{today}</div>
      </div>

    </header>
  )
}
