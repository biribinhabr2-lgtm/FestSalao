import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogIn, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Credenciais inválidas. Verifique e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  async function loginDemo(type) {
    setError('')
    setLoading(true)
    const credentials = {
      admin: { email: 'admin@festeventos.com', password: '123456' },
      func:  { email: 'func@festeventos.com',  password: '123456' },
    }
    const { email: e, password: p } = credentials[type]
    setEmail(e)
    setPassword(p)
    try {
      await signIn(e, p)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-shell">
      {/* Left panel */}
      <div className="login-left">
        <div className="login-left-bg" />
        <div className="login-left-decor" />
        <div className="login-left-content">
          <div className="login-brand">
            <div className="login-brand-icon">🎪</div>
            <div>
              <div className="login-brand-name">FestEventos</div>
              <div className="login-brand-tagline">Plataforma de Gestão</div>
            </div>
          </div>
          <h1 className="login-hero-title">
            Gestão completa<br />para sua <span>brinquedoteca</span>
          </h1>
          <p className="login-hero-desc">
            Escalas, eventos, avisos, checklists e financeiro — tudo integrado
            em uma plataforma moderna, rápida e fácil de usar.
          </p>
          <div className="login-features">
            {['Escalas flexíveis', 'Gestão de eventos', 'Avisos em tempo real', 'Checklists automáticos', 'Controle financeiro', 'Multi-empresa'].map(f => (
              <div key={f} className="login-feature">
                <div className="login-feature-dot" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="login-right">
        <div className="login-form-wrap fade-in">
          <h2 className="login-form-title">Bem-vindo de volta</h2>
          <p className="login-form-sub">Faça login para acessar o sistema</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input
                type="email"
                className="form-input"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Senha</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex'
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                padding: '10px 14px', background: 'var(--red-light)', color: 'var(--red)',
                borderRadius: 'var(--radius-sm)', fontSize: 13, border: '1px solid #FECACA'
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={loading}
              style={{ justifyContent: 'center', marginTop: 4 }}
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Entrando…</>
                : <><LogIn size={16} /> Entrar</>
              }
            </button>
          </form>

        </div>
      </div>
    </div>
  )
}
