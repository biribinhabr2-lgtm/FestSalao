import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, Clock, Users, Edit3, Trash2, Eye, Loader2 } from 'lucide-react'
import Modal from '../components/ui/Modal'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/ui/Toast'
import { useTable, useFuncionarios } from '../hooks/useDb'
import { mockEventos } from '../data/mockData'

const STATUS_LIST = ['Agendado','Em andamento','Concluído','Cancelado']
const TIPOS       = ['Aniversário','Corporativo','Escolar','Temático','Outro']
const STATUS_CLASS = { 'Agendado':'badge-blue','Em andamento':'badge-orange','Concluído':'badge-green','Cancelado':'badge-red' }

function StatusBadge({ status }) {
  return <span className={`badge ${STATUS_CLASS[status]||'badge-gray'}`}>{status}</span>
}

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

export default function Eventos() {
  const { isAdmin } = useAuth()
  const toast = useToast()
  const { rows: eventos, loading, add, update, remove } = useTable('eventos', { seedData: mockEventos, orderBy: 'data', orderAsc: true })
  const { funcionarios } = useFuncionarios()

  const [modalOpen, setModalOpen]     = useState(false)
  const [viewModal, setViewModal]     = useState(null)
  const [editItem, setEditItem]       = useState(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [tab, setTab]                 = useState('futuros')
  const [respInput, setRespInput]     = useState('')

  const emptyForm = { nome:'', data:'', horario_prep:'09:00', horario_inicio:'10:00', horario_fim:'13:00', tipo:'Aniversário', status:'Agendado', criancas:20, responsaveis:[], observacoes:'' }
  const [form, setForm] = useState(emptyForm)

  const today   = format(new Date(),'yyyy-MM-dd')
  const futuros = eventos.filter(e => e.data >= today)
  const passados= eventos.filter(e => e.data <  today)
  const base    = tab==='futuros' ? futuros : passados
  const filtered= filterStatus ? base.filter(e=>e.status===filterStatus) : base

  /* normaliza responsaveis que pode vir como string JSON do Supabase */
  function parseResps(ev) {
    if (Array.isArray(ev?.responsaveis)) return ev.responsaveis
    try { return JSON.parse(ev?.responsaveis || '[]') } catch { return [] }
  }

  function openCreate() {
    setEditItem(null); setForm(emptyForm); setRespInput(''); setModalOpen(true)
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

    // Tenta com responsaveis; se coluna não existir no banco, tenta sem
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
      toast.success('Evento criado!')
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

  return (
    <div className="page">
      <div className="page-header">
        <div><h1 className="page-title">Eventos</h1><p className="page-subtitle">{futuros.length} evento(s) futuros programados</p></div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          <select className="form-input form-select" style={{ width:'auto' }} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
            <option value="">Todos os status</option>
            {STATUS_LIST.map(s=><option key={s}>{s}</option>)}
          </select>
          {isAdmin && <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={14}/> Novo Evento</button>}
        </div>
      </div>

      <div className="tabs" style={{ marginBottom:16 }}>
        <div className={`tab-item ${tab==='futuros'?'active':''}`} onClick={()=>setTab('futuros')}>
          Futuros <span className="badge badge-blue" style={{ marginLeft:6 }}>{futuros.length}</span>
        </div>
        <div className={`tab-item ${tab==='passados'?'active':''}`} onClick={()=>setTab('passados')}>
          Histórico <span className="badge badge-gray" style={{ marginLeft:6 }}>{passados.length}</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card"><div className="empty-state"><div className="empty-icon">🎉</div><div className="empty-title">Nenhum evento encontrado</div></div></div>
      ) : (
        <div className="three-col">
          {filtered.map(ev=><EventoCard key={ev.id} ev={ev} isAdmin={isAdmin} onView={setViewModal} onEdit={openEdit} onDelete={handleDelete}/>)}
        </div>
      )}

      {/* Detail */}
      {viewModal && (
        <Modal open={!!viewModal} onClose={()=>setViewModal(null)} title="Detalhes do Evento" size="lg"
          footer={<button className="btn btn-secondary btn-sm" onClick={()=>setViewModal(null)}>Fechar</button>}>
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
      </Modal>
    </div>
  )
}
