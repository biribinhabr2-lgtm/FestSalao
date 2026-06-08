import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { pathname } = useLocation()

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Header
          pathname={pathname}
          onMenuToggle={() => setSidebarOpen(s => !s)}
        />
        <main className="fade-in">{children}</main>
      </div>
    </div>
  )
}
