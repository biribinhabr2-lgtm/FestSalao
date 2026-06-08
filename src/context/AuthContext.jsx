import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

/* ── Usuários padrão do sistema (nunca removíveis) ── */
const DEFAULT_USERS = {
  'biribinhabr2@gmail.com': {
    id: 'admin-master',
    email: 'biribinhabr2@gmail.com',
    password: 'guigui99',
    profile: {
      id: 'admin-master',
      nome: 'Administrador',
      cargo: 'Administrador',
      role: 'admin',
      empresa_id: 'empresa-1',
      empresa_nome: 'Brinquedoteca Alegria',
      setor: 'Gestão',
      ativo: true,
    }
  }
}

const STORAGE_KEY = 'festeventos_users'

/* Carrega / inicializa usuários cadastrados localmente */
function loadUsers() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? { ...DEFAULT_USERS, ...JSON.parse(saved) } : { ...DEFAULT_USERS }
  } catch {
    return { ...DEFAULT_USERS }
  }
}

function saveUsers(users) {
  // Nunca persiste os usuários padrão — só os cadastrados pelo admin
  const extras = {}
  for (const [k, v] of Object.entries(users)) {
    if (!DEFAULT_USERS[k]) extras[k] = v
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(extras))
}

function isConfigured() {
  const url = import.meta.env.VITE_SUPABASE_URL
  return url && url !== 'https://placeholder.supabase.co' && url.includes('supabase.co')
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isConfigured()) {
      const saved = localStorage.getItem('festeventos_session')
      if (saved) {
        try {
          const { user: u, profile: p } = JSON.parse(saved)
          setUser(u); setProfile(p)
        } catch (_) {}
      }
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    try {
      const { data } = await supabase
        .from('usuarios')
        .select('*, empresas(nome)')
        .eq('id', userId)
        .single()
      if (data) setProfile({ ...data, empresa_nome: data.empresas?.nome })
    } catch (_) {}
    setLoading(false)
  }

  /* ── Login ── */
  async function signIn(email, password) {
    if (!isConfigured()) {
      const users = loadUsers()
      const found = users[email.toLowerCase()]
      if (!found || found.password !== password) throw new Error('E-mail ou senha incorretos.')
      if (!found.profile.ativo) throw new Error('Usuário inativo. Fale com o administrador.')
      const u = { id: found.id, email: found.email }
      setUser(u); setProfile(found.profile)
      localStorage.setItem('festeventos_session', JSON.stringify({ user: u, profile: found.profile }))
      return
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  /* ── Logout ── */
  async function signOut() {
    if (!isConfigured()) {
      localStorage.removeItem('festeventos_session')
      setUser(null); setProfile(null)
      return
    }
    await supabase.auth.signOut()
    setProfile(null)
  }

  /* ── Criar usuário (admin only — modo local) ── */
  async function createUser({ email, password, nome, cargo, setor, role }) {
    if (!isConfigured()) {
      const users = loadUsers()
      const key = email.toLowerCase().trim()
      if (users[key]) throw new Error('Já existe um usuário com este e-mail.')
      const id = `user-${Date.now()}`
      const newUser = {
        id,
        email: key,
        password,
        profile: {
          id,
          nome,
          cargo,
          setor,
          role,
          empresa_id: profile?.empresa_id || 'empresa-1',
          empresa_nome: profile?.empresa_nome || 'Brinquedoteca Alegria',
          ativo: true,
        }
      }
      users[key] = newUser
      saveUsers(users)
      return newUser
    }
    // Supabase: chama Netlify Function para criar via service key
    const session = await supabase.auth.getSession()
    const token = session.data.session?.access_token
    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email, nome, cargo, setor, role }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Erro ao criar usuário.')
    }
    return res.json()
  }

  /* ── Atualizar senha de usuário (admin) ── */
  function updateUserPassword(email, newPassword) {
    const users = loadUsers()
    const key = email.toLowerCase().trim()
    if (!users[key]) throw new Error('Usuário não encontrado.')
    users[key] = { ...users[key], password: newPassword }
    saveUsers(users)
  }

  /* ── Listar usuários cadastrados (admin) ── */
  function listLocalUsers() {
    return Object.values(loadUsers())
  }

  /* ── Desativar/ativar usuário (admin) ── */
  function toggleUserAtivo(email) {
    const users = loadUsers()
    const key = email.toLowerCase().trim()
    if (!users[key]) return
    users[key] = { ...users[key], profile: { ...users[key].profile, ativo: !users[key].profile.ativo } }
    saveUsers(users)
    // Recarregar lista em componentes via evento
    window.dispatchEvent(new Event('festeventos_users_changed'))
  }

  /* ── Remover usuário (admin, nunca o próprio) ── */
  function removeUser(email) {
    const key = email.toLowerCase().trim()
    if (DEFAULT_USERS[key]) throw new Error('Não é possível remover o administrador principal.')
    if (user?.email?.toLowerCase() === key) throw new Error('Você não pode remover sua própria conta.')
    const users = loadUsers()
    delete users[key]
    saveUsers(users)
    window.dispatchEvent(new Event('festeventos_users_changed'))
  }

  const isAdmin = profile?.role === 'admin'

  return (
    <AuthContext.Provider value={{
      user, profile, loading, isAdmin,
      signIn, signOut,
      createUser, updateUserPassword,
      listLocalUsers, toggleUserAtivo, removeUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
