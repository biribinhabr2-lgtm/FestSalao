import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, Clock, Users, Edit3, Trash2, Eye, Loader2, Link2, UserPlus, RefreshCw, CalendarPlus } from 'lucide-react'
import Modal from '../components/ui/Modal'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/ui/Toast'
import { useTable, useFuncionarios } from '../hooks/useDb'
import { mockEventos } from '../data/mockData'
import {
  useEventosExternos,
  criarEventoExterno,
  atualizarEventoExterno,
  getAlocacao,
  salvarAlocacao,
} from '../hooks/useAgendaExterna'

const STATUS_LIST  = ['Agendado','Em andamento','Concluído','Cancelado']
const TIPOS        = ['Aniversário','Corporativo','Escolar','Temático','Outro']
const STATUS_CLASS = { 'Agendado':'badge-blue','Em andamento':'badge-orange','Concluído':'badge-green','Cancelado':'badge-red','confirmada':'badge-green','orcamento':'badge-blue','cancelada':'badge-red' }

const today = format(new Date(), 'yyyy-MM-dd')
const em6m  = format(new Date(Date.now() + 180 * 86400_000), 'yyyy-MM-dd')
// Para histórico também carregamos 1 ano atrás
const ha1a  = format(new Date(Date.now() - 365 * 86400_000), 'yyyy-MM-dd')

function StatusBadge({ status }) {
  return <span className={`badge ${STATUS_CLASS[status]||'badge-gray'}`}>{status}</span>
}

function Campo({ label, value }) {
  if (!value && value !== 0) return null
  return (
    <div style={{ background:'var(--surface-2)', borderRadius:'var(--radius-sm)', padding:'10px 14px' }}>
      <div style={{ fontSize:11, color:'var(--text-3)', marginBottom:3 }}>{label}</div>
      <div style={{ fontWeight:600, fontSize:13.5 }}>{value}</div>
    </div>
  )
}

/* ── Card evento local ── */
function EventoCard({ ev, onView, onEdit, onDelete, isAdmin }) {
  const dateObj = new Date(ev.data + 'T00:00')
  const isToday = ev.data === today
  const isPast  = ev.data < today
  const tipoIcon = { 'Aniversário':'🎂','Corporativo':'🏢','Escolar':'🎒' }
  const resps = Array.isArray(ev.responsaveis) ? ev.responsaveis : (ev.responsaveis ? JSON.parse(ev.responsaveis) : [])

  return (
    <div className="card" style={{ opacity:isPast&&ev.status!=='Concluído'?.7:1 }}
      onMouseEnter={e=>e.currentTarget.style.boxShadow='var(--shadow)'}
      onMouseLeave={e=>e.currentTarget.style.boxShadow=''}>
      <div style={{ padding:'16px 18px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:38,height:38,borderRadius:8,background:'var(--accent-light)',color:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0 }}>
              {tipoIcon[ev.tipo]||'🎉'}
            </div>
            <div>
              <div style={{ fontFamily:'var(--font-display)',fontWeight:700,fontSize:14.5,lineHeight:1.2 }}>{ev.nome}</div>
              <div style={{ fontSize:11.5,color:'var(--text-3)',marginTop:2 }}>{ev.tipo}</div>
            </div>
          </div>
          <StatusBadge status={ev.status}/>
        </div>
        <div style={{ display:'flex',flexDirection:'column',gap:6,fontSize:12.5,color:'var(--text-2)' }}>
          <div style={{ display:'flex',alignItems:'center',gap:6 }}>
            📅 <span style={{ fontWeight:isToday?700:400, color:isToday?'var(--accent)':'inherit' }}>
              {isToday?'Hoje — ':''}{format(dateObj,"EEEE, d 'de' MMMM",{locale:ptBR})}
            </span>
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:6 }}>
            <Clock size={13}/> Prep: {ev.horario_prep} · Início: {ev.horario_inicio} · Fim: {ev.horario_fim}
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:6 }}>
            <Users size={13}/> {ev.criancas} crianças
          </div>
        </div>
        {resps.length > 0 && (
          <div style={{ display:'flex',flexWrap:'wrap',gap:5,marginTop:10 }}>
            {resps.map(r=>(
              <div key={r} style={{ display:'flex',alignItems:'center',gap:4,padding:'3px 8px',background:'var(--surface-2)',borderRadius:99,fontSize:11,fontWeight:500 }}>
                <div style={{ width:14,height:14,borderRadius:'50%',background:'var(--accent)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:700 }}>{r[0]}</div>
                {r.split(' ')[0]}
              </div>
            ))}
          </div>
        )}
        <div style={{ display:'flex',gap:6,marginTop:12,paddingTop:12,borderTop:'1px solid var(--border)' }}>
          <button className="btn btn-secondary btn-sm" style={{ flex:1,justifyContent:'center' }} onClick={()=>onView(ev)}><Eye size={13}/> Detalhes</button>
          {isAdmin && <>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={()=>onEdit(ev)}><Edit3 size={13}/></button>
            <button className="btn btn-danger btn-icon btn-sm" onClick={()=>onDelete(ev.id)}><Trash2 size={13}/></button>
          </>}
        </div>
      </div>
    </div>
  )
}

/* ── Card evento externo ── */
function EventoExternoCard({ ev, onView, onAlocar, onEditar, onEscala, isAdmin }) {
  const dateObj = new Date(ev.data + 'T00:00')
  const isToday = ev.data === today
  const isPast  = ev.data < today
  const resps   = getAlocacao(ev._ext_id)

  return (
    <div className="card" style={{ opacity:isPast?.7:1, borderLeft:'4px solid #6366f1' }}
      onMouseEnter={e=>e.currentTarget.style.boxShadow='var(--shadow)'}
      onMouseLeave={e=>e.currentTarget.style.boxShadow=''}>
      <div style={{ padding:'16px 18px' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10 }}>
          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
            <div style={{ width:38,height:38,borderRadius:8,background:'#ede9fe',color:'#6366f1',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0 }}>🔗</div>
            <div>
              <div style={{ fontFamily:'var(--font-display)',fontWeight:700,fontSize:14.5,lineHeight:1.2 }}>{ev.titulo}</div>
              <div style={{ display:'flex',alignItems:'center',gap:4,fontSize:11.5,color:'#6366f1',marginTop:2,fontWeight:600 }}>
                <Link2 size={10}/> Sistema externo
                {ev.customer_nome && <span style={{ color:'var(--text-3)',fontWeight:400 }}>· {ev.customer_nome}</span>}
              </div>
            </div>
          </div>
          <StatusBadge status={ev.status}/>
        </div>

        <div style={{ display:'flex',flexDirection:'column',gap:6,fontSize:12.5,color:'var(--text-2)' }}>
          <div style={{ display:'flex',alignItems:'center',gap:6 }}>
            📅 <span style={{ fontWeight:isToday?700:400, color:isToday?'var(--accent)':'inherit' }}>
              {isToday?'Hoje — ':''}{format(dateObj,"EEEE, d 'de' MMMM",{locale:ptBR})}
            </span>
          </div>
          {(ev.hora_inicio||ev.hora_fim) && (
            <div style={{ display:'flex',alignItems:'center',gap:6 }}>
              <Clock size={13}/> {ev.hora_inicio}{ev.hora_fim?` – ${ev.hora_fim}`:''}
            </div>
          )}
          {(ev.convidados > 0 || ev.criancas > 0) && (
            <div style={{ display:'flex',alignItems:'center',gap:12 }}>
              {ev.convidados > 0 && <span><Users size={13} style={{ verticalAlign:'middle' }}/> {ev.convidados} convidados</span>}
              {ev.criancas  > 0 && <span>👶 {ev.criancas} crianças</span>}
            </div>
          )}
          {ev.local && <div>📍 {ev.local}</div>}
          {ev.tema  && <div>🎨 {ev.tema}</div>}
          {ev.valor > 0 && <div>💰 R$ {Number(ev.valor).toLocaleString('pt-BR',{minimumFractionDigits:2})}</div>}
        </div>

        {resps.length > 0 && (
          <div style={{ display:'flex',flexWrap:'wrap',gap:5,marginTop:10 }}>
            {resps.map(r=>(
              <div key={r} style={{ display:'flex',alignItems:'center',gap:4,padding:'3px 8px',background:'#ede9fe',borderRadius:99,fontSize:11,fontWeight:500,color:'#6366f1' }}>
                <div style={{ width:14,height:14,borderRadius:'50%',background:'#6366f1',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:700 }}>{r[0]}</div>
                {r.split(' ')[0]}
              </div>
            ))}
          </div>
        )}

        <div style={{ display:'flex',gap:5,marginTop:12,paddingTop:12,borderTop:'1px solid var(--border)',flexWrap:'wrap' }}>
          <button className="btn btn-secondary btn-sm" style={{ flex:1,justifyContent:'center',minWidth:80 }} onClick={()=>onView(ev)}><Eye size={13}/> Detalhes</button>
          {isAdmin && <>
            <button className="btn btn-ghost btn-sm" style={{ color:'#6366f1',borderColor:'#c4b5fd' }} onClick={()=>onEditar(ev)} title="Editar no sistema externo"><Edit3 size={13}/></button>
            <button className="btn btn-ghost btn-sm" style={{ color:'#6366f1',borderColor:'#c4b5fd' }} onClick={()=>onAlocar(ev)} title="Alocar equipe"><UserPlus size={13}/></button>
            <button className="btn btn-ghost btn-sm" style={{ color:'var(--accent)',borderColor:'var(--accent)' }} onClick={()=>onEscala(ev)} title="Adicionar à escala"><CalendarPlus size={13}/></button>
          </>}
        </div>
      </div>
    </div>
  )
}

export default function Eventos() {
  const { isAdmin, profile } = useAuth()
  const toast = useToast()
  const { rows: eventos, loading, add, update, remove } = useTable('eventos', { seedData: mockEventos, orderBy: 'data', orderAsc: true })
  const { add: addAviso } = useTable('avisos', { seedData: [] })
  const { add: addEscala } = useTable('escalas', { seedData: [] })
  const { funcionarios } = useFuncionarios()

  const { eventos: extEventos, loading: loadingExt, erro: erroExt, recarregar } = useEventosExternos(ha1a, em6m)

  const [modalOpen, setModalOpen]         = useState(false)
  const [viewModal, setViewModal]         = useState(null)
  const [editItem, setEditItem]           = useState(null)
  const [filterStatus, setFilterStatus]   = useState('')
  const [tab, setTab]                     = useState('futuros')
  const [respInput, setRespInput]         = useState('')
  const [publicarAviso, setPublicarAviso] = useState(false)
  const [sincronizarExt, setSincronizarExt] = useState(false)
  const [mostrarExternos, setMostrarExternos] = useState(true)

  /* Editar evento externo */
  const EXT_STATUS = ['orcamento','confirmada','cancelada']
  const [editExtModal, setEditExtModal] = useState(null)
  const [editExtForm,  setEditExtForm]  = useState({})
  const [savingExt,    setSavingExt]    = useState(false)

  function openEditExt(ev) {
    setEditExtModal(ev)
    setEditExtForm({
      title:        ev.titulo === ev.customer_nome ? '' : ev.titulo,
      guests_count: ev.convidados || '',
      start_time:   ev.hora_inicio || '',
      end_time:     ev.hora_fim    || '',
      status:       ev.status      || 'orcamento',
      notes:        ev.descricao   || '',
    })
  }
  async function handleSaveExt() {
    setSavingExt(true)
    try {
      const payload = {
        title:        editExtForm.title       || undefined,
        guests_count: editExtForm.guests_count !== '' ? Number(editExtForm.guests_count) : undefined,
        start_time:   editExtForm.start_time  || undefined,
        end_time:     editExtForm.end_time    || undefined,
        status:       editExtForm.status      || undefined,
        notes:        editExtForm.notes       || undefined,
      }
      await atualizarEventoExterno(editExtModal._ext_id, payload)
      toast.success('Evento atualizado no sistema externo!')
      setEditExtModal(null)
      recarregar()
    } catch (e) {
      toast.error('Erro ao salvar: ' + e.message)
    } finally {
      setSavingExt(false)
    }
  }

  /* Escala para evento externo */
  const TURNOS_LS = (() => { try { const s = localStorage.getItem('feste_cfg_turnos'); return s ? JSON.parse(s) : [] } catch { return [] } })()
  const TURNOS_DEFAULT = ['Manhã (08:00–14:00)','Tarde (14:00–20:00)','Integral (08:00–18:00)']
  const TURNOS = TURNOS_LS.length > 0 ? TURNOS_LS : TURNOS_DEFAULT
  const SETORES_ESC = ['Recreação','Eventos','Limpeza','Recepção','Cozinha','Gestão']

  const [escalaModal,  setEscalaModal]  = useState(null)
  const [escalaForm,   setEscalaForm]   = useState({})
  const [savingEscala, setSavingEscala] = useState(false)

  function openEscala(ev) {
    setEscalaModal(ev)
    const turno = TURNOS[0] || ''
    const horario = turno.match(/\(([^)]+)\)/)?.[1] || ''
    setEscalaForm({
      funcionario_id: '',
      data:           ev.data,
      turno,
      horario,
      setor:          'Eventos',
      tipo:           'Evento',
      observacoes:    `Evento externo: ${ev.titulo}${ev.customer_nome ? ' — ' + ev.customer_nome : ''}`,
    })
  }
  async function handleSaveEscala() {
    if (!escalaForm.funcionario_id) { toast.error('Selecione o funcionário'); return }
    setSavingEscala(true)
    const func = funcionarios.find(f => f.id === escalaForm.funcionario_id)
    const { error } = await addEscala({ ...escalaForm, funcionario: func?.nome || '' })
    setSavingEscala(false)
    if (error) { toast.error('Erro: ' + error.message); return }
    toast.success('Escala adicionada!')
    setEscalaModal(null)
  }

  /* Alocação de equipe para eventos externos */
  const [alocModal, setAlocModal]   = useState(null)   // evento externo selecionado
  const [alocResps, setAlocResps]   = useState([])
  const [alocInput, setAlocInput]   = useState('')
  const [, forceRender]             = useState(0)       // força re-render após salvar alocação

  function openAlocar(ev) {
    setAlocModal(ev)
    setAlocResps(getAlocacao(ev._ext_id))
    setAlocInput('')
  }
  function addAlocResp() {
    if (!alocInput.trim() || alocResps.includes(alocInput.trim())) return
    setAlocResps(r => [...r, alocInput.trim()])
    setAlocInput('')
  }
  function removeAlocResp(r) { setAlocResps(p => p.filter(x=>x!==r)) }
  function salvarAloc() {
    salvarAlocacao(alocModal._ext_id, alocResps)
    setAlocModal(null)
    forceRender(n => n+1)
    toast.success('Equipe salva!')
  }

  const emptyForm = { nome:'', data:'', horario_prep:'09:00', horario_inicio:'10:00', horario_fim:'13:00', tipo:'Aniversário', status:'Agendado', criancas:20, responsaveis:[], observacoes:'' }
  const [form, setForm] = useState(emptyForm)

  const futuros  = eventos.filter(e => e.data >= today)
  const passados = eventos.filter(e => e.data <  today)
  const extFuturos  = extEventos.filter(e => e.data >= today)
  const extPassados = extEventos.filter(e => e.data <  today)

  const baseLocal = tab==='futuros' ? futuros  : passados
  const baseExt   = mostrarExternos ? (tab==='futuros' ? extFuturos : extPassados) : []
  const filteredLocal = filterStatus ? baseLocal.filter(e=>e.status===filterStatus) : baseLocal
  const filteredExt   = filterStatus ? baseExt.filter(e=>e.status===filterStatus)   : baseExt

  const todos = [
    ...filteredLocal.map(e=>({...e, _tipo:'local'})),
    ...filteredExt.map(e=>({...e, _tipo:'externo'})),
  ].sort((a,b) => (a.data||'').localeCompare(b.data||''))

  function parseResps(ev) {
    if (Array.isArray(ev?.responsaveis)) return ev.responsaveis
    try { return JSON.parse(ev?.responsaveis||'[]') } catch { return [] }
  }

  function openCreate() { setEditItem(null); setForm(emptyForm); setRespInput(''); setPublicarAviso(false); setSincronizarExt(false); setModalOpen(true) }
  function openEdit(ev) {
    setEditItem(ev)
    setForm({ nome:ev.nome, data:ev.data, horario_prep:ev.horario_prep, horario_inicio:ev.horario_inicio, horario_fim:ev.horario_fim, tipo:ev.tipo, status:ev.status, criancas:ev.criancas, responsaveis:parseResps(ev), observacoes:ev.observacoes||'' })
    setRespInput(''); setModalOpen(true)
  }
  function addResp() {
    if (!respInput.trim()) return
    setForm(f=>({...f, responsaveis:[...f.responsaveis, respInput.trim()]})); setRespInput('')
  }
  function removeResp(r) { setForm(f=>({...f, responsaveis:f.responsaveis.filter(x=>x!==r)})) }

  async function handleSave() {
    if (!form.nome || !form.data) { toast.error('Nome e data são obrigatórios'); return }

    async function tryAdd(payload) {
      let r = await add(payload)
      if (r.error?.message?.includes('responsaveis')) { const { responsaveis:_, ...sem }=payload; r=await add(sem) }
      return r
    }
    async function tryUpdate(id, payload) {
      let r = await update(id, payload)
      if (r.error?.message?.includes('responsaveis')) { const { responsaveis:_, ...sem }=payload; r=await update(id,sem) }
      return r
    }

    const payload = { ...form, responsaveis: JSON.stringify(form.responsaveis) }
    if (editItem) {
      const { error } = await tryUpdate(editItem.id, payload)
      if (error) { toast.error('Erro: '+error.message); return }
      toast.success('Evento atualizado!')
    } else {
      const { error } = await tryAdd(payload)
      if (error) { toast.error('Erro: '+error.message); return }

      if (sincronizarExt) {
        try {
          await criarEventoExterno({ titulo:form.nome, data:form.data, hora_inicio:form.horario_inicio, hora_fim:form.horario_fim, criancas:form.criancas })
          recarregar()
          toast.success('Criado e sincronizado com o sistema externo!')
        } catch (e) {
          toast.error('Criado localmente, falhou no externo: '+e.message)
        }
      }
      if (publicarAviso) {
        const dataFmt = form.data ? format(new Date(form.data+'T00:00'),"dd/MM/yyyy",{locale:ptBR}) : ''
        await addAviso({ titulo:`🎉 Evento agendado: ${form.nome}`, mensagem:`Novo evento para ${dataFmt}.\nTipo: ${form.tipo} · ${form.criancas} crianças\nHorário: ${form.horario_inicio}–${form.horario_fim}`+(form.observacoes?`\n\nObs: ${form.observacoes}`:''), tipo:'Geral', prioridade:'normal', destinatarios:'Todos', expira_em:form.data, autor:profile?.nome||'Admin', lido:false })
        if (!sincronizarExt) toast.success('Evento criado e aviso publicado!')
      } else if (!sincronizarExt) {
        toast.success('Evento criado!')
      }
    }
    setModalOpen(false)
  }

  async function handleDelete(id) {
    if (!confirm('Excluir este evento?')) return
    const { error } = await remove(id)
    if (error) { toast.error('Erro: '+error.message); return }
    toast.success('Evento excluído.')
  }

  if (loading) return (
    <div className="page" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:300 }}>
      <Loader2 size={28} className="animate-spin" style={{ color:'var(--accent)' }}/>
    </div>
  )

  const totalFuturos = futuros.length + (mostrarExternos ? extFuturos.length : 0)

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Eventos</h1>
          <p className="page-subtitle">
            {totalFuturos} evento(s) futuros
            {mostrarExternos && extFuturos.length > 0 && (
              <span style={{ color:'#6366f1', marginLeft:4 }}>· {extFuturos.length} do sistema externo</span>
            )}
          </p>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          <select className="form-input form-select" style={{ width:'auto' }} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
            <option value="">Todos os status</option>
            {STATUS_LIST.map(s=><option key={s}>{s}</option>)}
          </select>
          <button
            className={`btn btn-sm ${erroExt ? 'btn-ghost' : mostrarExternos ? 'btn-secondary' : 'btn-ghost'}`}
            style={{ gap:6, color: erroExt?'#ef4444': mostrarExternos?'#6366f1':'var(--text-3)', borderColor: erroExt?'#ef4444': mostrarExternos?'#6366f1':undefined }}
            onClick={() => erroExt ? recarregar() : setMostrarExternos(s=>!s)}
            title={erroExt ? 'Clique para tentar novamente' : 'Mostrar/ocultar eventos externos'}
          >
            {loadingExt ? <Loader2 size={12} className="animate-spin"/> : <Link2 size={13}/>}
            {erroExt ? 'Reconectar' : `Externos${extEventos.length > 0 ? ` (${extEventos.length})` : ''}`}
          </button>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={recarregar} title="Atualizar eventos externos">
            <RefreshCw size={13} style={{ color:'var(--text-3)' }}/>
          </button>
          {isAdmin && <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={14}/> Novo Evento</button>}
        </div>
      </div>

      {/* Erro API externa */}
      {erroExt && (
        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:12.5, color:'#ef4444', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'var(--radius-sm)', padding:'10px 14px', marginBottom:12 }}>
          ⚠️ <span><strong>Sistema externo indisponível:</strong> {erroExt}</span>
          <button className="btn btn-ghost btn-sm" style={{ marginLeft:'auto', color:'#ef4444', fontSize:11 }} onClick={recarregar}>
            {loadingExt ? <Loader2 size={11} className="animate-spin"/> : 'Tentar novamente'}
          </button>
        </div>
      )}

      <div className="tabs" style={{ marginBottom:16 }}>
        <div className={`tab-item ${tab==='futuros'?'active':''}`} onClick={()=>setTab('futuros')}>
          Futuros <span className="badge badge-blue" style={{ marginLeft:6 }}>{futuros.length+(mostrarExternos?extFuturos.length:0)}</span>
        </div>
        <div className={`tab-item ${tab==='passados'?'active':''}`} onClick={()=>setTab('passados')}>
          Histórico <span className="badge badge-gray" style={{ marginLeft:6 }}>{passados.length+(mostrarExternos?extPassados.length:0)}</span>
        </div>
      </div>

      {mostrarExternos && extEventos.length > 0 && (
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#6366f1', marginBottom:12, fontWeight:500 }}>
          <div style={{ width:12, height:12, borderRadius:2, background:'#6366f1' }}/>
          Borda roxa = evento do sistema externo · atualiza a cada 60s
        </div>
      )}

      {todos.length === 0 ? (
        <div className="card"><div className="empty-state"><div className="empty-icon">🎉</div><div className="empty-title">Nenhum evento encontrado</div></div></div>
      ) : (
        <div className="three-col">
          {todos.map(ev =>
            ev._tipo === 'externo'
              ? <EventoExternoCard key={ev.id} ev={ev} onView={setViewModal} onAlocar={openAlocar} onEditar={openEditExt} onEscala={openEscala} isAdmin={isAdmin}/>
              : <EventoCard key={ev.id} ev={ev} isAdmin={isAdmin} onView={setViewModal} onEdit={openEdit} onDelete={handleDelete}/>
          )}
        </div>
      )}

      {/* ── Modal detalhe ── */}
      {viewModal && (
        <Modal open={!!viewModal} onClose={()=>setViewModal(null)} title="Detalhes do Evento" size="lg"
          footer={
            <>
              {viewModal._externo && isAdmin && <>
                <button className="btn btn-sm" style={{ background:'#6366f1',color:'#fff',border:'none' }} onClick={()=>{ setViewModal(null); openEditExt(viewModal) }}>
                  <Edit3 size={13}/> Editar
                </button>
                <button className="btn btn-sm" style={{ background:'#6366f1',color:'#fff',border:'none' }} onClick={()=>{ setViewModal(null); openAlocar(viewModal) }}>
                  <UserPlus size={13}/> Equipe
                </button>
                <button className="btn btn-sm btn-secondary" onClick={()=>{ setViewModal(null); openEscala(viewModal) }}>
                  <CalendarPlus size={13}/> Escala
                </button>
              </>}
              <button className="btn btn-secondary btn-sm" onClick={()=>setViewModal(null)}>Fechar</button>
            </>
          }>
          {viewModal._externo ? (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:52,height:52,borderRadius:12,background:'#ede9fe',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26 }}>🔗</div>
                <div>
                  <h2 style={{ fontFamily:'var(--font-display)',fontWeight:800,fontSize:20 }}>{viewModal.titulo}</h2>
                  <div style={{ display:'flex',gap:8,marginTop:4 }}>
                    <span style={{ display:'flex',alignItems:'center',gap:4,fontSize:12,fontWeight:600,color:'#6366f1' }}><Link2 size={11}/> Sistema externo</span>
                    <StatusBadge status={viewModal.status}/>
                  </div>
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <Campo label="📅 Data"        value={format(new Date(viewModal.data+'T00:00'),'dd/MM/yyyy')}/>
                <Campo label="⏰ Início"       value={viewModal.hora_inicio}/>
                <Campo label="🏁 Fim"          value={viewModal.hora_fim}/>
                <Campo label="🏷 Tipo"         value={viewModal.tipo !== 'Externo' ? viewModal.tipo : null}/>
                <Campo label="👥 Convidados"   value={viewModal.convidados != null && viewModal.convidados > 0 ? String(viewModal.convidados) : null}/>
                <Campo label="👶 Crianças"     value={viewModal.criancas  > 0 ? String(viewModal.criancas)  : null}/>
                <Campo label="📍 Local"        value={viewModal.local}/>
                <Campo label="🎨 Tema"         value={viewModal.tema}/>
                <Campo label="💰 Valor total"  value={viewModal.valor > 0 ? `R$ ${Number(viewModal.valor).toLocaleString('pt-BR',{minimumFractionDigits:2})}` : null}/>
                <Campo label="💵 Entrada/Sinal" value={viewModal.entrada > 0 ? `R$ ${Number(viewModal.entrada).toLocaleString('pt-BR',{minimumFractionDigits:2})} ${viewModal.entradaPaga ? '✅ paga' : '⏳ pendente'}` : null}/>
                <Campo label="👤 Cliente"      value={viewModal.customer_nome}/>
                <Campo label="📞 Telefone"     value={viewModal.customer_telefone}/>
                <Campo label="📧 E-mail"       value={viewModal.customer_email}/>
              </div>

              {viewModal.descricao && (
                <div style={{ background:'var(--surface-2)',borderRadius:'var(--radius-sm)',padding:'12px 16px' }}>
                  <div style={{ fontSize:11,color:'var(--text-3)',marginBottom:4,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em' }}>Notas</div>
                  <div style={{ fontSize:13.5,lineHeight:1.5 }}>{viewModal.descricao}</div>
                </div>
              )}

              {/* Equipe alocada */}
              {(() => { const r = getAlocacao(viewModal._ext_id); return r.length > 0 ? (
                <div>
                  <div style={{ fontSize:12,fontWeight:700,color:'var(--text-2)',marginBottom:8,textTransform:'uppercase',letterSpacing:'.06em' }}>Equipe Alocada</div>
                  <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
                    {r.map(n=><div key={n} style={{ display:'flex',alignItems:'center',gap:6,padding:'5px 12px',background:'#ede9fe',borderRadius:99,fontSize:12.5,fontWeight:500,color:'#6366f1' }}>{n}</div>)}
                  </div>
                </div>
              ) : null })()}

              <div style={{ fontSize:12,color:'var(--text-3)',textAlign:'center' }}>
                Este evento é gerenciado no sistema externo. Use "Alocar Equipe" para atribuir funcionários.
              </div>
            </div>
          ) : (
            /* Detalhe evento local */
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:52,height:52,borderRadius:12,background:'var(--accent-light)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26 }}>
                  {{'Aniversário':'🎂','Corporativo':'🏢','Escolar':'🎒'}[viewModal.tipo]||'🎉'}
                </div>
                <div>
                  <h2 style={{ fontFamily:'var(--font-display)',fontWeight:800,fontSize:20 }}>{viewModal.nome}</h2>
                  <div style={{ display:'flex',gap:8,marginTop:4 }}>
                    <span className="badge badge-blue">{viewModal.tipo}</span>
                    <StatusBadge status={viewModal.status}/>
                  </div>
                </div>
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                {[['📅 Data',format(new Date(viewModal.data+'T00:00'),'dd/MM/yyyy')],['👶 Crianças',`${viewModal.criancas}`],['⏰ Prep.',viewModal.horario_prep],['🎉 Início',viewModal.horario_inicio],['🏁 Fim',viewModal.horario_fim]].map(([l,v])=>(
                  <div key={l} style={{ background:'var(--surface-2)',borderRadius:'var(--radius-sm)',padding:'10px 14px' }}>
                    <div style={{ fontSize:11,color:'var(--text-3)',marginBottom:3 }}>{l}</div>
                    <div style={{ fontWeight:600,fontSize:13.5 }}>{v}</div>
                  </div>
                ))}
              </div>
              {parseResps(viewModal).length>0 && (
                <div>
                  <div style={{ fontSize:12,fontWeight:700,color:'var(--text-2)',marginBottom:8,textTransform:'uppercase',letterSpacing:'.06em' }}>Responsáveis</div>
                  <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
                    {parseResps(viewModal).map(r=><div key={r} style={{ display:'flex',alignItems:'center',gap:6,padding:'5px 12px',background:'var(--surface-2)',borderRadius:99,fontSize:12.5,fontWeight:500 }}><div style={{ width:18,height:18,borderRadius:'50%',background:'var(--accent)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700 }}>{r[0]}</div>{r}</div>)}
                  </div>
                </div>
              )}
              {viewModal.observacoes && <div style={{ background:'var(--surface-2)',borderRadius:'var(--radius-sm)',padding:'12px 16px' }}><div style={{ fontSize:11,color:'var(--text-3)',marginBottom:4,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em' }}>Observações</div><div style={{ fontSize:13.5,lineHeight:1.5 }}>{viewModal.observacoes}</div></div>}
            </div>
          )}
        </Modal>
      )}

      {/* ── Modal alocação de equipe ── */}
      {alocModal && (
        <Modal open={!!alocModal} onClose={()=>setAlocModal(null)} title={`Alocar Equipe — ${alocModal.titulo}`} size="md"
          footer={<><button className="btn btn-secondary btn-sm" onClick={()=>setAlocModal(null)}>Cancelar</button><button className="btn btn-primary btn-sm" style={{ background:'#6366f1',border:'none' }} onClick={salvarAloc}>Salvar</button></>}>
          <div style={{ fontSize:13,color:'var(--text-2)',marginBottom:16 }}>
            📅 {format(new Date(alocModal.data+'T00:00'),'dd/MM/yyyy')} · {alocModal.hora_inicio}{alocModal.hora_fim?` – ${alocModal.hora_fim}`:''}
          </div>
          <div className="form-group">
            <label className="form-label">Adicionar funcionário</label>
            <div style={{ display:'flex', gap:6 }}>
              <select className="form-input form-select" value={alocInput} onChange={e=>setAlocInput(e.target.value)}>
                <option value="">Selecione…</option>
                {funcionarios.filter(f=>!alocResps.includes(f.nome)).map(f=><option key={f.id} value={f.nome}>{f.nome}</option>)}
              </select>
              <button type="button" className="btn btn-secondary btn-sm" style={{ flexShrink:0 }} onClick={addAlocResp}>Add</button>
            </div>
          </div>
          {alocResps.length > 0 ? (
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:8 }}>
              {alocResps.map(r=>(
                <div key={r} style={{ display:'flex',alignItems:'center',gap:6,padding:'5px 12px',background:'#ede9fe',borderRadius:99,fontSize:12.5,fontWeight:500,color:'#6366f1' }}>
                  {r} <span style={{ cursor:'pointer', fontWeight:700 }} onClick={()=>removeAlocResp(r)}>×</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize:13, color:'var(--text-3)', marginTop:8 }}>Nenhum funcionário alocado ainda.</div>
          )}
        </Modal>
      )}

      {/* ── Modal editar evento externo ── */}
      {editExtModal && (
        <Modal open={!!editExtModal} onClose={()=>setEditExtModal(null)}
          title={`Editar — ${editExtModal.titulo}`} size="md"
          footer={<>
            <button className="btn btn-secondary btn-sm" onClick={()=>setEditExtModal(null)}>Cancelar</button>
            <button className="btn btn-primary btn-sm" style={{ background:'#6366f1',border:'none' }} onClick={handleSaveExt} disabled={savingExt}>
              {savingExt ? <Loader2 size={13} className="animate-spin"/> : 'Salvar no sistema externo'}
            </button>
          </>}>
          <div style={{ fontSize:12.5,color:'var(--text-2)',marginBottom:14,display:'flex',alignItems:'center',gap:6 }}>
            <Link2 size={13} color="#6366f1"/> As alterações serão enviadas para o sistema externo via API.
          </div>
          <div className="form-group">
            <label className="form-label">Título</label>
            <input className="form-input" value={editExtForm.title||''} onChange={e=>setEditExtForm(f=>({...f,title:e.target.value}))} placeholder={editExtModal.customer_nome||'Nome do evento'}/>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nº de convidados</label>
              <input type="number" className="form-input" min={0} value={editExtForm.guests_count||''} onChange={e=>setEditExtForm(f=>({...f,guests_count:e.target.value}))} placeholder="0"/>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input form-select" value={editExtForm.status||'orcamento'} onChange={e=>setEditExtForm(f=>({...f,status:e.target.value}))}>
                {EXT_STATUS.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Início</label>
              <input type="time" className="form-input" value={editExtForm.start_time||''} onChange={e=>setEditExtForm(f=>({...f,start_time:e.target.value}))}/>
            </div>
            <div className="form-group">
              <label className="form-label">Fim</label>
              <input type="time" className="form-input" value={editExtForm.end_time||''} onChange={e=>setEditExtForm(f=>({...f,end_time:e.target.value}))}/>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notas / Observações</label>
            <textarea className="form-input form-textarea" value={editExtForm.notes||''} onChange={e=>setEditExtForm(f=>({...f,notes:e.target.value}))} placeholder="Detalhes do evento…"/>
          </div>
        </Modal>
      )}

      {/* ── Modal adicionar escala para evento externo ── */}
      {escalaModal && (
        <Modal open={!!escalaModal} onClose={()=>setEscalaModal(null)}
          title={`Nova Escala — ${escalaModal.titulo}`} size="md"
          footer={<>
            <button className="btn btn-secondary btn-sm" onClick={()=>setEscalaModal(null)}>Cancelar</button>
            <button className="btn btn-primary btn-sm" onClick={handleSaveEscala} disabled={savingEscala}>
              {savingEscala ? <Loader2 size={13} className="animate-spin"/> : 'Adicionar Escala'}
            </button>
          </>}>
          <div style={{ fontSize:12.5,color:'var(--text-2)',marginBottom:14 }}>
            📅 {format(new Date(escalaModal.data+'T00:00'),'dd/MM/yyyy')} · {escalaModal.hora_inicio}{escalaModal.hora_fim ? ` – ${escalaModal.hora_fim}` : ''}
            {escalaModal.convidados > 0 && ` · ${escalaModal.convidados} convidados`}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Funcionário *</label>
              <select className="form-input form-select" value={escalaForm.funcionario_id||''} onChange={e=>setEscalaForm(f=>({...f,funcionario_id:e.target.value}))}>
                <option value="">Selecione…</option>
                {funcionarios.map(f=><option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Data</label>
              <input type="date" className="form-input" value={escalaForm.data||''} onChange={e=>setEscalaForm(f=>({...f,data:e.target.value}))}/>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Turno</label>
              <select className="form-input form-select" value={escalaForm.turno||''} onChange={e=>{
                const h = e.target.value.match(/\(([^)]+)\)/)?.[1] || ''
                setEscalaForm(f=>({...f,turno:e.target.value,horario:h}))
              }}>
                <option value="">Selecione…</option>
                {TURNOS.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Setor</label>
              <select className="form-input form-select" value={escalaForm.setor||'Eventos'} onChange={e=>setEscalaForm(f=>({...f,setor:e.target.value}))}>
                {SETORES_ESC.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Observações</label>
            <textarea className="form-input form-textarea" rows={2} value={escalaForm.observacoes||''} onChange={e=>setEscalaForm(f=>({...f,observacoes:e.target.value}))}/>
          </div>
        </Modal>
      )}

      {/* ── Modal criar/editar ── */}
      <Modal open={modalOpen} onClose={()=>setModalOpen(false)} title={editItem?'Editar Evento':'Novo Evento'} size="lg"
        footer={<><button className="btn btn-secondary btn-sm" onClick={()=>setModalOpen(false)}>Cancelar</button><button className="btn btn-primary btn-sm" onClick={handleSave}>{editItem?'Salvar':'Criar'}</button></>}>
        <div className="form-group"><label className="form-label">Nome <span>*</span></label><input className="form-input" value={form.nome} onChange={e=>setForm(f=>({...f,nome:e.target.value}))} placeholder="Ex: Festa da Sofia"/></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Data <span>*</span></label><input type="date" className="form-input" value={form.data} onChange={e=>setForm(f=>({...f,data:e.target.value}))}/></div>
          <div className="form-group"><label className="form-label">Tipo</label><select className="form-input form-select" value={form.tipo} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))}>{TIPOS.map(t=><option key={t}>{t}</option>)}</select></div>
        </div>
        <div className="form-row" style={{ gridTemplateColumns:'1fr 1fr 1fr' }}>
          {[['Preparação','horario_prep'],['Início','horario_inicio'],['Encerramento','horario_fim']].map(([l,k])=>(
            <div className="form-group" key={k}><label className="form-label">{l}</label><input type="time" className="form-input" value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}/></div>
          ))}
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Nº crianças</label><input type="number" className="form-input" min={1} value={form.criancas} onChange={e=>setForm(f=>({...f,criancas:+e.target.value}))}/></div>
          <div className="form-group"><label className="form-label">Status</label><select className="form-input form-select" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>{STATUS_LIST.map(s=><option key={s}>{s}</option>)}</select></div>
        </div>
        <div className="form-group">
          <label className="form-label">Responsáveis</label>
          <div style={{ display:'flex',gap:6 }}>
            <select className="form-input form-select" value={respInput} onChange={e=>setRespInput(e.target.value)}>
              <option value="">Selecione…</option>
              {funcionarios.map(f=><option key={f.id}>{f.nome}</option>)}
            </select>
            <button type="button" className="btn btn-secondary btn-sm" style={{ flexShrink:0 }} onClick={addResp}>Add</button>
          </div>
          {form.responsaveis.length>0 && <div className="chip-list" style={{ marginTop:6 }}>{form.responsaveis.map(r=><div key={r} className="chip">{r}<span className="chip-remove" onClick={()=>removeResp(r)}>×</span></div>)}</div>}
        </div>
        <div className="form-group"><label className="form-label">Observações</label><textarea className="form-input form-textarea" value={form.observacoes} onChange={e=>setForm(f=>({...f,observacoes:e.target.value}))} placeholder="Tema, detalhes, fornecedores…"/></div>

        {!editItem && (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <div style={{ display:'flex',alignItems:'flex-start',gap:10,padding:'12px 16px',background:sincronizarExt?'#ede9fe':'var(--surface-2)',borderRadius:'var(--radius-sm)',border:`1.5px solid ${sincronizarExt?'#6366f1':'var(--border)'}`,cursor:'pointer',transition:'all .15s' }} onClick={()=>setSincronizarExt(s=>!s)}>
              <input type="checkbox" checked={sincronizarExt} onChange={e=>setSincronizarExt(e.target.checked)} onClick={e=>e.stopPropagation()} style={{ width:16,height:16,accentColor:'#6366f1',flexShrink:0,marginTop:2,cursor:'pointer' }}/>
              <div>
                <div style={{ fontSize:13.5,fontWeight:600,color:'var(--text)',display:'flex',alignItems:'center',gap:6 }}><Link2 size={13} color="#6366f1"/> Sincronizar com o sistema externo</div>
                <div style={{ fontSize:12,color:'var(--text-2)',marginTop:2 }}>Cria o evento também na agenda do seu outro site.</div>
              </div>
            </div>
            <div style={{ display:'flex',alignItems:'flex-start',gap:10,padding:'12px 16px',background:publicarAviso?'var(--accent-light)':'var(--surface-2)',borderRadius:'var(--radius-sm)',border:`1.5px solid ${publicarAviso?'var(--accent)':'var(--border)'}`,cursor:'pointer',transition:'all .15s' }} onClick={()=>setPublicarAviso(s=>!s)}>
              <input type="checkbox" checked={publicarAviso} onChange={e=>setPublicarAviso(e.target.checked)} onClick={e=>e.stopPropagation()} style={{ width:16,height:16,accentColor:'var(--accent)',flexShrink:0,marginTop:2,cursor:'pointer' }}/>
              <div>
                <div style={{ fontSize:13.5,fontWeight:600,color:'var(--text)' }}>🔔 Publicar como aviso para a equipe</div>
                <div style={{ fontSize:12,color:'var(--text-2)',marginTop:2 }}>Cria automaticamente um aviso em "Avisos".</div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
