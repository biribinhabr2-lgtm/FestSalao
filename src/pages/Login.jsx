import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogIn, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react'

/* ── Features exibidas no painel esquerdo ── */
const FEATURES = [
  { icon: '📅', label: 'Escalas flexíveis' },
  { icon: '🎉', label: 'Gestão de eventos' },
  { icon: '🔔', label: 'Avisos em tempo real' },
  { icon: '✅', label: 'Checklists da equipe' },
  { icon: '💰', label: 'Controle financeiro' },
]

export default function Login() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const { signIn } = useAuth()
  const navigate   = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message || 'E-mail ou senha incorretos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Figtree:wght@400;500;600&display=swap');

        .lp-root {
          min-height: 100svh;
          display: flex;
          background: #F7F5F0;
          font-family: 'Figtree', sans-serif;
        }

        /* ── Painel esquerdo ── */
        .lp-left {
          display: none;
          position: relative;
          flex: 1 1 52%;
          background: #0E1C2F;
          overflow: hidden;
          padding: clamp(40px, 6vw, 72px);
          flex-direction: column;
          justify-content: space-between;
        }
        @media (min-width: 900px) { .lp-left { display: flex; } }

        /* Orbe animado */
        .lp-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          pointer-events: none;
        }
        .lp-orb-1 {
          width: 520px; height: 520px;
          background: radial-gradient(circle, rgba(249,115,22,.32) 0%, transparent 70%);
          top: -180px; right: -140px;
          animation: orbFloat 8s ease-in-out infinite;
        }
        .lp-orb-2 {
          width: 380px; height: 380px;
          background: radial-gradient(circle, rgba(13,148,136,.22) 0%, transparent 70%);
          bottom: -100px; left: -80px;
          animation: orbFloat 10s ease-in-out infinite reverse;
        }
        @keyframes orbFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50%       { transform: translateY(-30px) scale(1.06); }
        }

        /* Logo esquerda */
        .lp-brand {
          display: flex;
          align-items: center;
          gap: 14px;
          position: relative;
          z-index: 2;
        }
        .lp-brand-icon {
          width: 48px; height: 48px;
          background: #F97316;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 24px;
          flex-shrink: 0;
          box-shadow: 0 8px 24px rgba(249,115,22,.35);
        }
        .lp-brand-name {
          font-family: 'Syne', sans-serif;
          font-size: 22px; font-weight: 800;
          color: #fff;
          letter-spacing: -.3px;
        }
        .lp-brand-sub {
          font-size: 12px; color: rgba(255,255,255,.4);
          margin-top: 1px;
        }

        /* Bloco central esquerdo */
        .lp-hero {
          position: relative;
          z-index: 2;
        }
        .lp-hero-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 14px;
          background: rgba(249,115,22,.15);
          border: 1px solid rgba(249,115,22,.3);
          border-radius: 99px;
          font-size: 12px; font-weight: 600;
          color: #FB923C;
          margin-bottom: 22px;
          letter-spacing: .03em;
        }
        .lp-hero-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(32px, 4vw, 52px);
          font-weight: 800;
          color: #fff;
          line-height: 1.1;
          margin-bottom: 18px;
          letter-spacing: -.5px;
        }
        .lp-hero-title em {
          font-style: normal;
          color: #F97316;
        }
        .lp-hero-desc {
          font-size: 16px; color: rgba(255,255,255,.5);
          line-height: 1.7; max-width: 400px;
        }

        /* Features grid */
        .lp-features {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          position: relative;
          z-index: 2;
        }
        .lp-feat {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 16px;
          background: rgba(255,255,255,.055);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 10px;
          font-size: 13px; font-weight: 500; color: rgba(255,255,255,.75);
          backdrop-filter: blur(4px);
        }
        .lp-feat-icon {
          font-size: 18px; flex-shrink: 0;
        }

        /* ── Painel direito / formulário ── */
        .lp-right {
          flex: 1 1 48%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(28px, 6vw, 56px) clamp(20px, 5vw, 56px);
          min-height: 100svh;
        }

        .lp-form-card {
          width: 100%;
          max-width: 400px;
          animation: cardIn .4s ease both;
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Mobile brand (só aparece em mobile) */
        .lp-mobile-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 36px;
        }
        @media (min-width: 900px) { .lp-mobile-brand { display: none; } }
        .lp-mobile-brand-icon {
          width: 44px; height: 44px;
          background: #F97316;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 22px;
          box-shadow: 0 6px 20px rgba(249,115,22,.3);
          flex-shrink: 0;
        }
        .lp-mobile-brand-name {
          font-family: 'Syne', sans-serif;
          font-size: 20px; font-weight: 800;
          color: #0E1C2F; letter-spacing: -.2px;
        }
        .lp-mobile-brand-sub { font-size: 12px; color: #9CA3AF; margin-top: 1px; }

        /* Cabeçalho do form */
        .lp-form-heading {
          font-family: 'Syne', sans-serif;
          font-size: clamp(26px, 5vw, 32px);
          font-weight: 800;
          color: #0E1C2F;
          letter-spacing: -.4px;
          line-height: 1.15;
          margin-bottom: 6px;
        }
        .lp-form-sub {
          font-size: 15px; color: #6B7280; margin-bottom: 32px;
        }

        /* Grupos de campo */
        .lp-field { display: flex; flex-direction: column; gap: 7px; margin-bottom: 18px; }
        .lp-label {
          font-size: 13.5px; font-weight: 600; color: #374151;
          letter-spacing: .01em;
        }
        .lp-input-wrap { position: relative; }
        .lp-input {
          width: 100%;
          height: 52px;
          padding: 0 48px 0 16px;
          background: #fff;
          border: 1.5px solid #E5E1D8;
          border-radius: 12px;
          font-size: 15px; font-family: 'Figtree', sans-serif;
          color: #0E1C2F;
          transition: border-color .18s, box-shadow .18s;
          outline: none;
          box-shadow: 0 1px 3px rgba(0,0,0,.04);
        }
        .lp-input:focus {
          border-color: #F97316;
          box-shadow: 0 0 0 4px rgba(249,115,22,.12);
        }
        .lp-input::placeholder { color: #C4BEB4; }
        .lp-eye {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #9CA3AF; display: flex; padding: 4px;
          transition: color .15s;
        }
        .lp-eye:hover { color: #F97316; }

        /* Erro */
        .lp-error {
          display: flex; align-items: flex-start; gap: 8px;
          padding: 12px 16px;
          background: #FEF2F2; color: #DC2626;
          border: 1.5px solid #FECACA;
          border-radius: 10px;
          font-size: 13.5px; line-height: 1.45;
          margin-bottom: 18px;
        }

        /* Botão de entrar */
        .lp-btn {
          width: 100%; height: 52px;
          background: #F97316;
          color: #fff;
          border: none; border-radius: 12px;
          font-size: 16px; font-weight: 700; font-family: 'Figtree', sans-serif;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 9px;
          transition: background .18s, transform .15s, box-shadow .18s;
          box-shadow: 0 4px 16px rgba(249,115,22,.35);
          letter-spacing: .01em;
          margin-top: 8px;
        }
        .lp-btn:hover:not(:disabled) {
          background: #EA6A00;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(249,115,22,.4);
        }
        .lp-btn:active:not(:disabled) { transform: translateY(0); }
        .lp-btn:disabled { opacity: .65; cursor: not-allowed; }

        /* Footer */
        .lp-footer {
          margin-top: 28px;
          text-align: center;
          font-size: 12px; color: #C4BEB4; line-height: 1.6;
        }

        .lp-spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="lp-root">
        {/* ══ Painel Esquerdo (desktop) ══ */}
        <div className="lp-left">
          <div className="lp-orb lp-orb-1" />
          <div className="lp-orb lp-orb-2" />

          {/* Logo */}
          <div className="lp-brand">
            <div className="lp-brand-icon">🎪</div>
            <div>
              <div className="lp-brand-name">FestSalão</div>
              <div className="lp-brand-sub">Plataforma de Gestão</div>
            </div>
          </div>

          {/* Texto hero */}
          <div className="lp-hero">
            <div className="lp-hero-tag">
              <Sparkles size={12} /> Gestão inteligente
            </div>
            <h1 className="lp-hero-title">
              Tudo para sua<br /><em>brinquedoteca</em><br />em um lugar só
            </h1>
            <p className="lp-hero-desc">
              Escalas, eventos, checklists e financeiro — integrados numa plataforma moderna, rápida e fácil de usar.
            </p>
          </div>

          {/* Features */}
          <div className="lp-features">
            {FEATURES.map(f => (
              <div key={f.label} className="lp-feat">
                <span className="lp-feat-icon">{f.icon}</span>
                {f.label}
              </div>
            ))}
          </div>
        </div>

        {/* ══ Painel Direito — Formulário ══ */}
        <div className="lp-right">
          <div className="lp-form-card">

            {/* Logo mobile */}
            <div className="lp-mobile-brand">
              <div className="lp-mobile-brand-icon">🎪</div>
              <div>
                <div className="lp-mobile-brand-name">FestSalão</div>
                <div className="lp-mobile-brand-sub">Plataforma de Gestão</div>
              </div>
            </div>

            <h2 className="lp-form-heading">Bem-vindo<br />de volta</h2>
            <p className="lp-form-sub">Acesse sua conta para continuar</p>

            <form onSubmit={handleSubmit} noValidate>
              {/* E-mail */}
              <div className="lp-field">
                <label className="lp-label">E-mail</label>
                <div className="lp-input-wrap">
                  <input
                    className="lp-input"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    style={{ paddingRight: 16 }}
                  />
                </div>
              </div>

              {/* Senha */}
              <div className="lp-field">
                <label className="lp-label">Senha</label>
                <div className="lp-input-wrap">
                  <input
                    className="lp-input"
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="lp-eye"
                    onClick={() => setShowPass(s => !s)}
                    tabIndex={-1}
                    aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Erro */}
              {error && (
                <div className="lp-error" role="alert">
                  <span>⚠</span> {error}
                </div>
              )}

              {/* Botão */}
              <button type="submit" className="lp-btn" disabled={loading}>
                {loading
                  ? <><Loader2 size={18} className="lp-spin" /> Entrando…</>
                  : <><LogIn size={18} /> Entrar</>
                }
              </button>
            </form>

            <div className="lp-footer">
              Problemas de acesso? Fale com o administrador do sistema.
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
