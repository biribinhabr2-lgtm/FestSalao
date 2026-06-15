import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, Clock, Users, Edit3, Trash2, Eye, Loader2, Link2 } from 'lucide-react'
import Modal from '../components/ui/Modal'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/ui/Toast'
import { useTable, useFuncionarios } from '../hooks/useDb'
import { mockEventos } from '../data/mockData'
import {
  fetchEventosExternos,
  criarEventoExterno,
  normalizeEventoExterno,
} from '../hooks/useAgendaExterna'

const STATUS_LIST  = ['Agendado','Em andamento','Concluído','Cancelado']
const TIPOS        = ['Aniversário','Corporativo','Escolar','Temático','Outro']
const STATUS_CLASS = { 'Agendado':'badge-blue','Em andamento':'badge-orange','Concluído':'badge-green','Cancelado':'badge-red' }

function StatusBadge({ status }) {
  return <span className={`badge ${STATUS_CLASS[status]||'badge-gray'}`}>{status}</span>
}

/* ── Card para eventos locais ── */
function EventoCard({ ev, onView, onEdit, onDelete, isAdmin }) {
  const dateObj = new Date(ev.data + 'T00:00')
  const isToday = ev.data === format(new Date(),'yyyy-MM-dd')
  const isPast  = ev.data < format(new Date(),'yyyy-MM-dd')
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
              <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:14.5, lineHeight:1.2 }}>{ev.nome}</div>
              <div style={{ fontSize:11.5, color:'var(--text-3)', marginTop:2 }}>{ev.tipo}</div>
            </div>
          </div>
          <StatusBadge status={ev.status}/>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:6, fontSize:12.5, color:'var(--text-2)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            📅 <span style={{ fontWeight:isToday?700:400, color:isToday?'var(--accent)':'inherit' }}>
              {isToday?'Hoje — ':''}{format(dateObj,'EEEE, d \'de\' MMMM',{locale:ptBR})}
            </span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <Clock size={13}/> Prep: {ev.horario_prep} · Início: {ev.horario_inicio} · Fim: {ev.horario_fim}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <Users size={13}/> {ev.criancas} crianças
          </div>
        </div>
        {resps.length > 0 && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:10 }}>
            {resps.map(r=>(
              <div key={r} style={{ display:'flex',alignItems:'center',gap:4,padding:'3px 8px',background:'var(--surface-2)',borderRadius:99,fontSize:11,fontWeight:500 }}>
                <div style={{ width:14,height:14,borderRadius:'50%',background:'var(--accent)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:700 }}>{r[0]}</div>
                {r.split(' ')[0]}
              </div>
            ))}
          </div>
        )}
        <div style={{ display:'flex', gap:6, marginTop:12, paddingTop:12, borderTop:'1px solid var(--border)' }}>
          <button className="btn btn-secondary btn-sm" style={{ flex:1, justifyContent:'center' }} onClick={()=>onView(ev)}><Eye size={13}/> Detalhes</button>
          {isAdmin && <>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={()=>onEdit(ev)}><Edit3 size={13}/></button>
            <button className="btn btn-danger btn-icon btn-sm" onClick={()=>onDelete(ev.id)}><Trash2 size={13}/></button>
          </>}
        </div>
      </div>
    </div>
  )
}

/* ── Card para eventos vindos do sistema externo ── */
function EventoExternoCard({ ev, onView }) {
  const dateObj = new Date(ev.data + 'T00:00')
  const isToday = ev.data === format(new Date(),'yyyy-MM-dd')
  const isPast  = ev.data < format(new Date(),'yyyy-MM-dd')

  return (
    <div className="card" style={{
        opacity: isPast ? .7 : 1,
        borderLeft: '4px solid #6366f1',
      }}
      onMouseEnter={e=>e.currentTarget.style.boxShadow='var(--shadow)'}
      onMouseLeave={e=>e.currentTarget.style.boxShadow=''}>
      <div style={{ padding:'16px 18px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:38,height:38,borderRadius:8,background:'#ede9fe',color:'#6366f1',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0 }}>
              🔗
            </div>
            <div>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:14.5, lineHeight:1.2 }}>{ev.titulo}</div>
              <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:11.5, color:'#6366f1', marginTop:2, fontWeight:600 }}>
                <Link2 size={10}/> Sistema externo
              </div>
            </div>
          </div>
          <span className={`badge ${STATUS_CLASS[ev.status] || 'badge-gray'}`}>{ev.status}</span>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:6, fontSize:12.5, color:'var(--text-2)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            📅 <span style={{ fontWeight:isToday?700:400, color:isToday?'var(--accent)':'inherit' }}>
              {isToday?'Hoje — ':''}{format(dateObj,'EEEE, d \'de\' MMMM',{locale:ptBR})}
            </span>
          </div>
          {(ev.hora_inicio || ev.hora_fim) && (
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <Clock size={13}/> {ev.hora_inicio}{ev.hora_fim ? ` – ${ev.hora_fim}` : ''}
            </div>
          )}
          {ev.tipo && ev.tipo !== 'Externo' && (
            <div style={{ fontSize:12, color:'var(--text-3)' }}>{ev.tipo}</div>
          )}
        </div>
        <div style={{ display:'flex', gap:6, marginTop:12, paddingTop:12, borderTop:'1px solid var(--border)' }}>
          <button className="btn btn-secondary btn-sm" style={{ flex:1, justifyContent:'center' }} onClick={()=>onView(ev)}>
            <Eye size={13}/> Detalhes
          </button>
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
  const { funcionarios } = useFuncionarios()

  const [modalOpen, setModalOpen]       = useState(false)
  const [viewModal, setViewModal]       = useState(null)
  const [editItem, setEditItem]         = useState(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [tab, setTab]                   = useState('futuros')
  const [respInput, setRespInput]       = useState('')
  const [publicarAviso, setPublicarAviso] = useState(false)
  const [sincronizarExterno, setSincronizarExterno] = useState(false)

  /* Eventos externos */
  const [eventosExternos, setEventosExternos] = useState([])
  const [loadingExt, setLoadingExt]           = useState(false)
  const [mostrarExternos, setMostrarExternos] = useState(true)

  useEffect(() => {
    async function load() {
      setLoadingExt(true)
      try {
        const hoje   = format(new Date(), 'yyyy-MM-dd')
        const em6m   = format(new Date(Date.now() + 180 * 86400_000), 'yyyy-MM-dd')
        const raw = await fetchEventosExternos(hoje, em6m)
        setEventosExternos(raw.map(normalizeEventoExterno))
      } catch {
        /* silencioso — API externa pode estar indisponível */
      } finally {
        setLoadingExt(false)
      }
    }
    load()
  }, [])

  const emptyForm = { nome:'', data:'', horario_prep:'09:00', horario_inicio:'10:00', horario_fim:'13:00', tipo:'Aniversário', status:'Agendado', criancas:20, responsaveis:[], observacoes:'' }
  const [form, setForm] = useState(emptyForm)

  const today    = format(new Date(),'yyyy-MM-dd')
  const futuros  = eventos.filter(e => e.data >= today)
  const passados = eventos.filter(e => e.data <  today)

  const extFuturos  = eventosExternos.filter(e => e.data >= today)
  const extPassados = eventosExternos.filter(e => e.data <  today)

  const baseLocal = tab==='futuros' ? futuros  : passados
  const baseExt   = tab==='futuros' ? extFuturos : extPassados

  const filteredLocal = filterStatus ? baseLocal.filter(e=>e.status===filterStatus) : baseLocal
  const filteredExt   = mostrarExternos
    ? (filterStatus ? baseExt.filter(e=>e.status===filterStatus) : baseExt)
    : []

  /* ordenados por data juntos */
  const todos = [
    ...filteredLocal.map(e=>({ ...e, _tipo:'local' })),
    ...filteredExt.map(e=>({ ...e, _tipo:'externo' })),
  ].sort((a,b) => a.data.localeCompare(b.data))

  function parseResps(ev) {
    if (Array.isArray(ev?.responsaveis)) return ev.responsaveis
    try { return JSON.parse(ev?.responsaveis || '[]') } catch { return [] }
  }

  function openCreate() {
    setEditItem(null); setForm(emptyForm); setRespInput(''); setPublicarAviso(false); setSincronizarExterno(false); setModalOpen(true)
  }
  function openEdit(ev) {
    setEditItem(ev)
    setForm({ nome:ev.nome, data:ev.data, horario_prep:ev.horario_prep, horario_inicio:ev.horario_inicio, horario_fim:ev.horario_fim, tipo:ev.tipo, status:ev.status, criancas:ev.criancas, responsaveis:parseResps(ev), observacoes:ev.observacoes||'' })
    setRespInput(''); setModalOpen(true)
  }
  function addResp() {
    if (!respInput.trim()) return
    setForm(f=>({ ...f, responsaveis:[...f.responsaveis, respInput.trim()] })); setRespInput('')
  }
  function removeResp(r) { setForm(f=>({ ...f, responsaveis:f.responsaveis.filter(x=>x!==r) })) }

  async function handleSave() {
    if (!form.nome || !form.data) { toast.error('Nome e data são obrigatórios'); return }

    async function tryAdd(payload) {
      let r = await add(payload)
      if (r.error?.message?.includes('responsaveis')) {
        const { responsaveis: _, ...sem } = payload
        r = await add(sem)
      }
      return r
    }
    async function tryUpdate(id, payload) {
      let r = await update(id, payload)
      if (r.error?.message?.includes('responsaveis')) {
        const { responsaveis: _, ...sem } = payload
        r = await update(id, sem)
      }
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

      /* Sincronizar com sistema externo */
      if (sincronizarExterno) {
        try {
          await criarEventoExterno({ titulo: form.nome, data: form.data })
          toast.success('Evento criado e sincronizado com o sistema externo!')
        } catch (e) {
          toast.error('Criado localmente, mas falhou no sistema externo: ' + e.message)
        }
      }

      /* Publicar como aviso */
      if (publicarAviso) {
        const dataFmt = form.data
          ? format(new Date(form.data + 'T00:00'), "dd/MM/yyyy", { locale: ptBR })
          : ''
        await addAviso({
          titulo:        `🎉 Evento agendado: ${form.nome}`,
          mensagem:      `Um novo evento foi agendado para ${dataFmt}.\n\nTipo: ${form.tipo} · ${form.criancas} crianças\nHorário: ${form.horario_inicio}–${form.horario_fim}` + (form.observacoes ? `\n\nObs: ${form.observacoes}` : ''),
          tipo:          'Geral',
          prioridade:    'normal',
          destinatarios: 'Todos',
          expira_em:     form.data,
          autor:         profile?.nome || 'Admin',
          lido:          false,
        })
        if (!sincronizarExterno) toast.success('Evento criado e aviso publicado!')
      } else if (!sincronizarExterno) {
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
          {/* Toggle externos */}
          <button
            className={`btn btn-sm ${mostrarExternos ? 'btn-secondary' : 'btn-ghost'}`}
            style={{ gap:6, color: mostrarExternos ? '#6366f1' : 'var(--text-3)', borderColor: mostrarExternos ? '#6366f1' : undefined }}
            onClick={()=>setMostrarExternos(s=>!s)}
            title="Mostrar/ocultar eventos do sistema externo"
          >
            <Link2 size={13}/>
            {loadingExt ? <Loader2 size={12} className="animate-spin"/> : 'Externos'}
          </button>
          {isAdmin && <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={14}/> Novo Evento</button>}
        </div>
      </div>

      <div className="tabs" style={{ marginBottom:16 }}>
        <div className={`tab-item ${tab==='futuros'?'active':''}`} onClick={()=>setTab('futuros')}>
          Futuros <span className="badge badge-blue" style={{ marginLeft:6 }}>{futuros.length + (mostrarExternos ? extFuturos.length : 0)}</span>
        </div>
        <div className={`tab-item ${tab==='passados'?'active':''}`} onClick={()=>setTab('passados')}>
          Histórico <span className="badge badge-gray" style={{ marginLeft:6 }}>{passados.length + (mostrarExternos ? extPassados.length : 0)}</span>
        </div>
      </div>

      {/* Legenda externa */}
      {mostrarExternos && eventosExternos.length > 0 && (
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#6366f1', marginBottom:12, fontWeight:500 }}>
          <div style={{ width:12, height:12, borderRadius:2, background:'#6366f1' }}/>
          Borda roxa = evento do seu outro sistema (somente leitura)
        </div>
      )}

      {todos.length === 0 ? (
        <div className="card"><div className="empty-state"><div className="empty-icon">🎉</div><div className="empty-title">Nenhum evento encontrado</div></div></div>
      ) : (
        <div className="three-col">
          {todos.map(ev =>
            ev._tipo === 'externo'
              ? <EventoExternoCard key={ev.id} ev={ev} onView={setViewModal}/>
              : <EventoCard key={ev.id} ev={ev} isAdmin={isAdmin} onView={setViewModal} onEdit={openEdit} onDelete={handleDelete}/>
          )}
        </div>
      )}

      {/* Detail */}
      {viewModal && (
        <Modal open={!!viewModal} onClose={()=>setViewModal(null)} title="Detalhes do Evento" size="lg"
          footer={<button className="btn btn-secondary btn-sm" onClick={()=>setViewModal(null)}>Fechar</button>}>
          {viewModal._externo ? (
            /* Detalhe evento externo */
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:52,height:52,borderRadius:12,background:'#ede9fe',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26 }}>🔗</div>
                <div>
                  <h2 style={{ fontFamily:'var(--font-display)',fontWeight:800,fontSize:20 }}>{viewModal.titulo}</h2>
                  <div style={{ display:'flex',gap:8,marginTop:4 }}>
                    <span style={{ display:'flex',alignItems:'center',gap:4,fontSize:12,fontWeight:600,color:'#6366f1' }}><Link2 size={11}/> Sistema externo</span>
                    <span className={`badge ${STATUS_CLASS[viewModal.status]||'badge-gray'}`}>{viewModal.status}</span>
                  </div>
                </div>
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                {[
                  ['📅 Data', format(new Date(viewModal.data+'T00:00'),'dd/MM/yyyy')],
                  viewModal.hora_inicio && ['⏰ Início', viewModal.hora_inicio],
                  viewModal.hora_fim    && ['🏁 Fim',    viewModal.hora_fim],
                  viewModal.tipo && viewModal.tipo !== 'Externo' && ['🏷 Tipo', viewModal.tipo],
                  viewModal.valor > 0   && ['💰 Valor',  `R$ ${Number(viewModal.valor).toFixed(2).replace('.',',')}`],
                ].filter(Boolean).map(([l,v])=>(
                  <div key={l} style={{ background:'var(--surface-2)',borderRadius:'var(--radius-sm)',padding:'10px 14px' }}>
                    <div style={{ fontSize:11,color:'var(--text-3)',marginBottom:3 }}>{l}</div>
                    <div style={{ fontWeight:600,fontSize:13.5 }}>{v}</div>
                  </div>
                ))}
              </div>
              {viewModal.descricao && (
                <div style={{ background:'var(--surface-2)',borderRadius:'var(--radius-sm)',padding:'12px 16px' }}>
                  <div style={{ fontSize:11,color:'var(--text-3)',marginBottom:4,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em' }}>Notas</div>
                  <div style={{ fontSize:13.5,lineHeight:1.5 }}>{viewModal.descricao}</div>
                </div>
              )}
              <div style={{ fontSize:12,color:'var(--text-3)',textAlign:'center' }}>
                Este evento é gerenciado no sistema externo e não pode ser editado aqui.
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

      {/* Create/Edit */}
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

        {/* Opções apenas na criação */}
        {!editItem && (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {/* Sincronizar com sistema externo */}
            <div style={{
              display:'flex', alignItems:'flex-start', gap:10,
              padding:'12px 16px',
              background: sincronizarExterno ? '#ede9fe' : 'var(--surface-2)',
              borderRadius:'var(--radius-sm)',
              border:`1.5px solid ${sincronizarExterno ? '#6366f1' : 'var(--border)'}`,
              cursor:'pointer', transition:'all .15s',
            }} onClick={()=>setSincronizarExterno(s=>!s)}>
              <input
                type="checkbox"
                checked={sincronizarExterno}
                onChange={e=>setSincronizarExterno(e.target.checked)}
                onClick={e=>e.stopPropagation()}
                style={{ width:16, height:16, accentColor:'#6366f1', flexShrink:0, marginTop:2, cursor:'pointer' }}
              />
              <div>
                <div style={{ fontSize:13.5, fontWeight:600, color:'var(--text)', display:'flex', alignItems:'center', gap:6 }}>
                  <Link2 size={13} color="#6366f1"/> Sincronizar com o sistema externo
                </div>
                <div style={{ fontSize:12, color:'var(--text-2)', marginTop:2 }}>
                  Cria o evento também na agenda do seu outro site.
                </div>
              </div>
            </div>

            {/* Publicar aviso */}
            <div style={{
              display:'flex', alignItems:'flex-start', gap:10,
              padding:'12px 16px',
              background: publicarAviso ? 'var(--accent-light)' : 'var(--surface-2)',
              borderRadius:'var(--radius-sm)',
              border:`1.5px solid ${publicarAviso ? 'var(--accent)' : 'var(--border)'}`,
              cursor:'pointer', transition:'all .15s',
            }} onClick={()=>setPublicarAviso(s=>!s)}>
              <input
                type="checkbox"
                checked={publicarAviso}
                onChange={e=>setPublicarAviso(e.target.checked)}
                onClick={e=>e.stopPropagation()}
                style={{ width:16, height:16, accentColor:'var(--accent)', flexShrink:0, marginTop:2, cursor:'pointer' }}
              />
              <div>
                <div style={{ fontSize:13.5, fontWeight:600, color:'var(--text)' }}>
                  🔔 Publicar como aviso para a equipe
                </div>
                <div style={{ fontSize:12, color:'var(--text-2)', marginTop:2 }}>
                  Cria automaticamente um aviso em "Avisos" com os detalhes deste evento.
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
