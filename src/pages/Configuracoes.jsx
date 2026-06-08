import { useState, useEffect } from 'react'
import {
  Plus, Trash2, Edit3, Save, Building, Users,
  Layers, Tag, Briefcase, Eye, EyeOff, KeyRound,
  ShieldCheck, UserPlus, Mail, Lock
} from 'lucide-react'
import Modal from '../components/ui/Modal'
import { useToast } from '../components/ui/Toast'
import { useAuth } from '../context/AuthContext'

const SETORES_INIT = ['Recreação','Eventos','Limpeza','Recepção','Cozinha','Gestão']
const CARGOS_INIT  = ['Administrador','Coordenadora','Monitora','Monitor','Auxiliar','Recepcionista']
const TURNOS_INIT  = ['Manhã (08:00–14:00)','Tarde (14:00–20:00)','Noite (18:00–00:00)','Integral (08:00–18:00)','Abertura (07:30–13:30)','Fechamento (16:00–22:00)']
const CATS_INIT    = ['Festas','Diária','Eventos','Insumos','Fornecedores','RH','Manutenção','Administrativo']

/* ── fora do componente para evitar re-criação a cada render ── */
function addToList(list, setList, val, setVal, onError) {
  if (!val.trim()) return
  if (list.includes(val.trim())) { onError('Item já existe'); return }
  setList(l => [...l, val.trim()])
  setVal('')
}
function removeFromList(list, setList, val) {
  if (!confirm(`Remover "${val}"?`)) return
  setList(l => l.filter(x => x !== val))
}

function ListEditor({ label, list, setList, newVal, setNewVal, placeholder, onError }) {
  return (
    <div>
      <div style={{ fontSize:13,fontWeight:700,color:'var(--text-2)',marginBottom:8,textTransform:'uppercase',letterSpacing:'.06em' }}>{label}</div>
      <div style={{ display:'flex', gap:6, marginBottom:8 }}>
        <input
          className="form-input"
          placeholder={placeholder}
          value={newVal}
          onChange={e => setNewVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addToList(list, setList, newVal, setNewVal, onError))}
        />
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          style={{ flexShrink:0 }}
          onClick={() => addToList(list, setList, newVal, setNewVal, onError)}
        >
          <Plus size={13}/>
        </button>
      </div>
      <div style={{ border:'1.5px solid var(--border)', borderRadius:'var(--radius-sm)', overflow:'hidden' }}>
        {list.length === 0 && (
          <div style={{ padding:'14px', textAlign:'center', color:'var(--text-3)', fontSize:13 }}>Nenhum item cadastrado</div>
        )}
        {list.map((item, i) => (
          <div key={item} style={{ display:'flex',alignItems:'center',padding:'9px 14px',borderBottom:i<list.length-1?'1px solid var(--border)':'none',background:'var(--surface)' }}>
            <span style={{ flex:1, fontSize:13.5 }}>{item}</span>
            <button
              onClick={() => removeFromList(list, setList, item)}
              style={{ color:'var(--text-3)',background:'none',border:'none',cursor:'pointer',padding:2,display:'flex',alignItems:'center' }}
            >
              <Trash2 size={13}/>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

/* Hook para lista persistida em localStorage */
function useLocalList(key, initial) {
  const [list, setList] = useState(() => {
    try {
      const saved = localStorage.getItem(key)
      return saved ? JSON.parse(saved) : initial
    } catch { return initial }
  })
  function setAndSave(updater) {
    setList(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      localStorage.setItem(key, JSON.stringify(next))
      return next
    })
  }
  return [list, setAndSave]
}

export default function Configuracoes() {
  const toast = useToast()
  const { listLocalUsers, createUser, removeUser, toggleUserAtivo, updateUserPassword, profile: myProfile } = useAuth()

  const [tab, setTab] = useState('usuarios')
  const [empresa, setEmpresa] = useState(() => {
    try {
      const saved = localStorage.getItem('feste_empresa')
      return saved ? JSON.parse(saved) : {
        nome: myProfile?.empresa_nome || 'Brinquedoteca Alegria',
        segmento: 'Brinquedoteca', cnpj: '', email: '', telefone: '', endereco: ''
      }
    } catch {
      return { nome: myProfile?.empresa_nome || 'Brinquedoteca Alegria', segmento: 'Brinquedoteca', cnpj: '', email: '', telefone: '', endereco: '' }
    }
  })
  const [setores, setSetores] = useLocalList('feste_cfg_setores', SETORES_INIT)
  const [cargos,  setCargos]  = useLocalList('feste_cfg_cargos',  CARGOS_INIT)
  const [turnos,  setTurnos]  = useLocalList('feste_cfg_turnos',  TURNOS_INIT)
  const [cats,    setCats]    = useLocalList('feste_cfg_cats',    CATS_INIT)
  const [newSetor, setNewSetor] = useState('')
  const [newCargo, setNewCargo] = useState('')
  const [newTurno, setNewTurno] = useState('')
  const [newCat, setNewCat]     = useState('')

  /* ── Usuários ── */
  const [usuarios, setUsuarios] = useState([])
  const [modalUsuario, setModalUsuario] = useState(false)
  const [modalSenha, setModalSenha] = useState(null) // email do usuário a alterar senha
  const [showPass, setShowPass] = useState(false)
  const [showPassConf, setShowPassConf] = useState(false)
  const [formUsuario, setFormUsuario] = useState({
    nome: '', email: '', password: '', confirmPassword: '',
    cargo: 'Monitora', setor: 'Recreação', role: 'funcionario'
  })
  const [novaSenha, setNovaSenha] = useState('')
  const [novaSenhaConf, setNovaSenhaConf] = useState('')
  const [showNovaSenha, setShowNovaSenha] = useState(false)

  function reloadUsers() {
    setUsuarios(listLocalUsers().map(u => u.profile ? { ...u.profile, email: u.email } : u))
  }

  useEffect(() => {
    reloadUsers()
    const handler = () => reloadUsers()
    window.addEventListener('festeventos_users_changed', handler)
    return () => window.removeEventListener('festeventos_users_changed', handler)
  }, [])

  async function handleCreateUser() {
    const { nome, email, password, confirmPassword, cargo, setor, role } = formUsuario
    if (!nome.trim())      { toast.error('Nome obrigatório'); return }
    if (!email.trim())     { toast.error('E-mail obrigatório'); return }
    if (!password)         { toast.error('Senha obrigatória'); return }
    if (password.length < 6) { toast.error('Senha deve ter pelo menos 6 caracteres'); return }
    if (password !== confirmPassword) { toast.error('As senhas não coincidem'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error('E-mail inválido'); return }

    try {
      await createUser({ email, password, nome, cargo, setor, role })
      toast.success(`Usuário ${nome} criado com sucesso!`)
      setModalUsuario(false)
      reloadUsers()
    } catch (err) {
      toast.error(err.message)
    }
  }

  function handleToggleAtivo(email) {
    try {
      toggleUserAtivo(email)
      reloadUsers()
      toast.success('Status atualizado.')
    } catch (err) {
      toast.error(err.message)
    }
  }

  function handleRemove(email, nome) {
    if (!confirm(`Remover o acesso de ${nome}? Esta ação não pode ser desfeita.`)) return
    try {
      removeUser(email)
      reloadUsers()
      toast.success(`Acesso de ${nome} removido.`)
    } catch (err) {
      toast.error(err.message)
    }
  }

  function handleAlterarSenha() {
    if (!novaSenha)              { toast.error('Digite a nova senha'); return }
    if (novaSenha.length < 6)   { toast.error('Senha deve ter pelo menos 6 caracteres'); return }
    if (novaSenha !== novaSenhaConf) { toast.error('As senhas não coincidem'); return }
    try {
      updateUserPassword(modalSenha, novaSenha)
      toast.success('Senha alterada com sucesso!')
      setModalSenha(null); setNovaSenha(''); setNovaSenhaConf('')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const tabs = [
    ['usuarios',  'Usuários & Acessos', Users],
    ['empresa',   'Empresa',            Building],
    ['setores',   'Setores & Cargos',   Layers],
    ['turnos',    'Turnos',             Tag],
    ['financeiro','Categorias Fin.',    Briefcase],
  ]

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Configurações</h1>
          <p className="page-subtitle">Personalize o sistema para sua empresa</p>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom:16 }}>
        {tabs.map(([id, label, Icon]) => (
          <div key={id} className={`tab-item ${tab===id?'active':''}`} onClick={() => setTab(id)}
            style={{ display:'flex', alignItems:'center', gap:6 }}>
            <Icon size={13}/> {label}
          </div>
        ))}
      </div>

      {/* ══ ABA: USUÁRIOS ══ */}
      {tab === 'usuarios' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div>
              <div style={{ fontSize:13.5, color:'var(--text-2)' }}>
                Apenas o administrador cria e gerencia os acessos ao sistema.
              </div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => {
              setFormUsuario({ nome:'', email:'', password:'', confirmPassword:'', cargo:'Monitora', setor:'Recreação', role:'funcionario' })
              setShowPass(false); setShowPassConf(false)
              setModalUsuario(true)
            }}>
              <UserPlus size={14}/> Novo Usuário
            </button>
          </div>

          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>E-mail</th>
                    <th>Cargo / Setor</th>
                    <th>Perfil</th>
                    <th>Status</th>
                    <th style={{ width:110 }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map(u => {
                    const isMe = u.email === myProfile?.email || u.id === myProfile?.id
                    return (
                      <tr key={u.id || u.email}>
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <div style={{
                              width:32,height:32,borderRadius:'50%',
                              background: u.role==='admin' ? 'var(--accent)' : 'var(--teal)',
                              color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',
                              fontSize:12,fontWeight:700,flexShrink:0
                            }}>
                              {u.nome?.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight:600, fontSize:13.5 }}>{u.nome}</div>
                              {isMe && <div style={{ fontSize:10.5, color:'var(--accent)', fontWeight:600 }}>Você</div>}
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize:13, color:'var(--text-2)' }}>{u.email}</td>
                        <td style={{ fontSize:13, color:'var(--text-2)' }}>
                          {u.cargo}<br/>
                          <span style={{ fontSize:11.5, color:'var(--text-3)' }}>{u.setor}</span>
                        </td>
                        <td>
                          <span className={`badge ${u.role==='admin'?'badge-orange':'badge-teal'}`}>
                            {u.role==='admin' ? '👑 Admin' : '👤 Funcionário'}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => !isMe && handleToggleAtivo(u.email)}
                            className={`badge ${u.ativo ? 'badge-green' : 'badge-red'}`}
                            style={{ cursor: isMe ? 'default' : 'pointer', border:'none', opacity: isMe ? .6 : 1 }}
                            title={isMe ? 'Não é possível desativar sua própria conta' : ''}
                          >
                            {u.ativo ? 'Ativo' : 'Inativo'}
                          </button>
                        </td>
                        <td>
                          <div style={{ display:'flex', gap:4 }}>
                            <button
                              className="btn btn-icon btn-ghost btn-sm"
                              title="Alterar senha"
                              onClick={() => { setModalSenha(u.email); setNovaSenha(''); setNovaSenhaConf(''); setShowNovaSenha(false) }}
                            >
                              <KeyRound size={13}/>
                            </button>
                            {!isMe && (
                              <button
                                className="btn btn-icon btn-danger btn-sm"
                                title="Remover acesso"
                                onClick={() => handleRemove(u.email, u.nome)}
                              >
                                <Trash2 size={13}/>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {usuarios.length === 0 && (
                    <tr><td colSpan={6}>
                      <div className="empty-state">
                        <div className="empty-icon">👥</div>
                        <div className="empty-title">Nenhum usuário cadastrado</div>
                        <div className="empty-desc">Crie o primeiro usuário clicando em "Novo Usuário".</div>
                      </div>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ marginTop:12, padding:'12px 16px', background:'var(--surface-2)', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)', fontSize:12.5, color:'var(--text-2)', lineHeight:1.6 }}>
            <strong>ℹ️ Como funciona:</strong> O administrador cria os usuários aqui com e-mail e senha. O funcionário usa essas credenciais para fazer login. Somente o administrador pode criar, desativar ou remover acessos.
          </div>
        </div>
      )}

      {/* ══ ABA: EMPRESA ══ */}
      {tab === 'empresa' && (
        <div className="card" style={{ maxWidth:600 }}>
          <div className="card-header"><span className="card-title">Dados da Empresa</span></div>
          <div className="card-body" style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div className="form-group">
              <label className="form-label">Nome da empresa</label>
              <input className="form-input" value={empresa.nome} onChange={e => setEmpresa(v => ({...v, nome: e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Segmento</label>
              <input className="form-input" placeholder="Ex: Brinquedoteca, Salão de Festas, Escola…" value={empresa.segmento} onChange={e => setEmpresa(v => ({...v, segmento: e.target.value}))} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">CNPJ</label>
                <input className="form-input" placeholder="00.000.000/0001-00" value={empresa.cnpj} onChange={e => setEmpresa(v => ({...v, cnpj: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Telefone</label>
                <input className="form-input" placeholder="(00) 00000-0000" value={empresa.telefone} onChange={e => setEmpresa(v => ({...v, telefone: e.target.value}))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">E-mail de contato</label>
              <input type="email" className="form-input" value={empresa.email} onChange={e => setEmpresa(v => ({...v, email: e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Endereço</label>
              <input className="form-input" placeholder="Rua, número, cidade…" value={empresa.endereco} onChange={e => setEmpresa(v => ({...v, endereco: e.target.value}))} />
            </div>
            <button className="btn btn-primary btn-sm" style={{ alignSelf:'flex-start' }} onClick={() => { localStorage.setItem('feste_empresa', JSON.stringify(empresa)); toast.success('Configurações da empresa salvas!') }}>
              <Save size={14}/> Salvar configurações
            </button>
          </div>
        </div>
      )}

      {/* ══ ABA: SETORES & CARGOS ══ */}
      {tab === 'setores' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, maxWidth:800 }}>
          <div className="card"><div className="card-body">
            <ListEditor label="Setores" list={setores} setList={setSetores} newVal={newSetor} setNewVal={setNewSetor} placeholder="Ex: Recreação…" onError={toast.error} />
          </div></div>
          <div className="card"><div className="card-body">
            <ListEditor label="Cargos" list={cargos} setList={setCargos} newVal={newCargo} setNewVal={setNewCargo} placeholder="Ex: Monitor…" onError={toast.error} />
          </div></div>
        </div>
      )}

      {/* ══ ABA: TURNOS ══ */}
      {tab === 'turnos' && (
        <div className="card" style={{ maxWidth:500 }}>
          <div className="card-body">
            <ListEditor label="Tipos de Turno" list={turnos} setList={setTurnos} newVal={newTurno} setNewVal={setNewTurno} placeholder="Ex: Manhã (08:00–14:00)…" onError={toast.error} />
          </div>
        </div>
      )}

      {/* ══ ABA: CATEGORIAS FINANCEIRAS ══ */}
      {tab === 'financeiro' && (
        <div className="card" style={{ maxWidth:500 }}>
          <div className="card-body">
            <ListEditor label="Categorias Financeiras" list={cats} setList={setCats} newVal={newCat} setNewVal={setNewCat} placeholder="Ex: Festas, Manutenção…" onError={toast.error} />
          </div>
        </div>
      )}

      {/* ══ Modal: criar novo usuário ══ */}
      <Modal
        open={modalUsuario}
        onClose={() => setModalUsuario(false)}
        title="Criar Novo Usuário"
        footer={
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => setModalUsuario(false)}>Cancelar</button>
            <button className="btn btn-primary btn-sm" onClick={handleCreateUser}>
              <UserPlus size={13}/> Criar Acesso
            </button>
          </>
        }
      >
        {/* Tipo de perfil */}
        <div className="form-group">
          <label className="form-label">Tipo de acesso</label>
          <div style={{ display:'flex', gap:8 }}>
            <button type="button"
              className={`btn btn-sm ${formUsuario.role==='funcionario' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex:1, justifyContent:'center',
                background: formUsuario.role==='funcionario' ? 'var(--teal)' : undefined,
                borderColor: formUsuario.role==='funcionario' ? 'var(--teal)' : undefined,
              }}
              onClick={() => setFormUsuario(f => ({ ...f, role:'funcionario' }))}
            >
              👤 Funcionário
            </button>
            <button type="button"
              className={`btn btn-sm ${formUsuario.role==='admin' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex:1, justifyContent:'center' }}
              onClick={() => setFormUsuario(f => ({ ...f, role:'admin' }))}
            >
              👑 Administrador
            </button>
          </div>
          {formUsuario.role === 'admin' && (
            <div style={{ marginTop:6, padding:'8px 12px', background:'var(--yellow-light)', borderRadius:'var(--radius-sm)', fontSize:12.5, color:'var(--yellow)', fontWeight:600 }}>
              ⚠️ Administradores têm acesso total ao sistema, incluindo financeiro e configurações.
            </div>
          )}
        </div>

        <div className="divider" />

        {/* Dados pessoais */}
        <div className="form-group">
          <label className="form-label">Nome completo <span>*</span></label>
          <input className="form-input" placeholder="Nome do usuário"
            value={formUsuario.nome} onChange={e => setFormUsuario(f => ({...f, nome: e.target.value}))} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Cargo</label>
            <select className="form-input form-select" value={formUsuario.cargo}
              onChange={e => setFormUsuario(f => ({...f, cargo: e.target.value}))}>
              {cargos.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Setor</label>
            <select className="form-input form-select" value={formUsuario.setor}
              onChange={e => setFormUsuario(f => ({...f, setor: e.target.value}))}>
              {setores.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="divider" />

        {/* Credenciais de login */}
        <div style={{ fontSize:12, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:10 }}>
          <Mail size={12} style={{ display:'inline',marginRight:5 }}/>Credenciais de login
        </div>
        <div className="form-group">
          <label className="form-label">E-mail <span>*</span></label>
          <input type="email" className="form-input" placeholder="email@exemplo.com"
            value={formUsuario.email} onChange={e => setFormUsuario(f => ({...f, email: e.target.value}))} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Senha <span>*</span></label>
            <div style={{ position:'relative' }}>
              <input type={showPass ? 'text' : 'password'} className="form-input"
                placeholder="Mínimo 6 caracteres" style={{ paddingRight:40 }}
                value={formUsuario.password} onChange={e => setFormUsuario(f => ({...f, password: e.target.value}))} />
              <button type="button" onClick={() => setShowPass(s => !s)}
                style={{ position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',color:'var(--text-3)',background:'none',border:'none',cursor:'pointer',display:'flex' }}>
                {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Confirmar senha <span>*</span></label>
            <div style={{ position:'relative' }}>
              <input type={showPassConf ? 'text' : 'password'} className="form-input"
                placeholder="Repita a senha" style={{ paddingRight:40 }}
                value={formUsuario.confirmPassword} onChange={e => setFormUsuario(f => ({...f, confirmPassword: e.target.value}))} />
              <button type="button" onClick={() => setShowPassConf(s => !s)}
                style={{ position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',color:'var(--text-3)',background:'none',border:'none',cursor:'pointer',display:'flex' }}>
                {showPassConf ? <EyeOff size={15}/> : <Eye size={15}/>}
              </button>
            </div>
          </div>
        </div>
        <div style={{ fontSize:12, color:'var(--text-3)' }}>
          O usuário usará este e-mail e senha para fazer login no sistema.
        </div>
      </Modal>

      {/* ══ Modal: alterar senha ══ */}
      <Modal
        open={!!modalSenha}
        onClose={() => setModalSenha(null)}
        title="Alterar Senha"
        footer={
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => setModalSenha(null)}>Cancelar</button>
            <button className="btn btn-primary btn-sm" onClick={handleAlterarSenha}>
              <Lock size={13}/> Salvar nova senha
            </button>
          </>
        }
      >
        <div style={{ padding:'10px 14px', background:'var(--surface-2)', borderRadius:'var(--radius-sm)', fontSize:13, color:'var(--text-2)', marginBottom:4 }}>
          Alterando senha de: <strong>{modalSenha}</strong>
        </div>
        <div className="form-group">
          <label className="form-label">Nova senha <span>*</span></label>
          <div style={{ position:'relative' }}>
            <input type={showNovaSenha ? 'text' : 'password'} className="form-input"
              placeholder="Mínimo 6 caracteres" style={{ paddingRight:40 }}
              value={novaSenha} onChange={e => setNovaSenha(e.target.value)} />
            <button type="button" onClick={() => setShowNovaSenha(s => !s)}
              style={{ position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',color:'var(--text-3)',background:'none',border:'none',cursor:'pointer',display:'flex' }}>
              {showNovaSenha ? <EyeOff size={15}/> : <Eye size={15}/>}
            </button>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Confirmar nova senha <span>*</span></label>
          <input type="password" className="form-input" placeholder="Repita a senha"
            value={novaSenhaConf} onChange={e => setNovaSenhaConf(e.target.value)} />
        </div>
      </Modal>
    </div>
  )
}
