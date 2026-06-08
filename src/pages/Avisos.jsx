import { useState } from 'react'
import { format, isPast } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, Trash2, Edit3, Eye, Clock, Users, Loader2 } from 'lucide-react'
import Modal from '../components/ui/Modal'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/ui/Toast'
import { useTable } from '../hooks/useDb'
import { mockAvisos } from '../data/mockData'

const TIPOS      = ['Geral','Setor','Cargo','Urgente']
const PRIORIDADES= ['normal','alta','urgente']
const TIPO_COLORS= { 'Geral':'badge-gray','Setor':'badge-teal','Cargo':'badge-blue','Urgente':'badge-red' }
const TIPO_ICONS = { 'Geral':'📢','Setor':'👥','Cargo':'👤','Urgente':'⚠️' }

export default function Avisos() {
  const { isAdmin, profile } = useAuth()
  const toast = useToast()
  const { rows: avisos, loading, add, update, remove, patchLocal } = useTable('avisos', {
    seedData: mockAvisos,
    orderBy:  'criado_em',
    orderAsc: false,
  })

  const [modalOpen, setModalOpen]   = useState(false)
  const [viewModal, setViewModal]   = useState(null)
  const [editItem, setEditItem]     = useState(null)
  const [filterTipo, setFilterTipo] = useState('')
  const [showLidos, setShowLidos]   = useState(false)
  const emptyForm = { titulo:'', mensagem:'', tipo:'Geral', destinatarios:'Todos', prioridade:'normal', expira_em:'' }
  const [form, setForm] = useState(emptyForm)

  /* leituras locais — controla quais avisos este usuário leu */
  const lsLidosKey = `feste_avisos_lidos_${profile?.id||'demo'}`
  function getLidos() { try { return JSON.parse(localStorage.getItem(lsLidosKey)||'[]') } catch { return [] } }
  function marcarLido(id) {
    const lidos = getLidos()
    if (!lidos.includes(id)) { localStorage.setItem(lsLidosKey, JSON.stringify([...lidos, id])) }
    patchLocal(id, { lido: true })
  }
  function isLido(av) { return av.lido || getLidos().includes(av.id) }

  const naoLidos = avisos.filter(a => !isLido(a)).length

  const filtered = avisos
    .filter(a => !filterTipo || a.tipo === filterTipo)
    .filter(a => showLidos ? isLido(a) : !isLido(a) || isAdmin)
    .sort((a,b) => { const m={urgente:0,alta:1,normal:2}; return (m[a.prioridade]||2)-(m[b.prioridade]||2) })

  function openCreate() { setEditItem(null); setForm(emptyForm); setModalOpen(true) }
  function openEdit(av) {
    setEditItem(av)
    setForm({ titulo:av.titulo, mensagem:av.mensagem, tipo:av.tipo, destinatarios:av.destinatarios, prioridade:av.prioridade, expira_em:av.expira_em||'' })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.titulo || !form.mensagem) { toast.error('Título e mensagem são obrigatórios'); return }
    const payload = { ...form, autor: profile?.nome || 'Admin', lido: false }
    if (editItem) {
      const { error } = await update(editItem.id, payload)
      if (error) { toast.error('Erro: '+error.message); return }
      toast.success('Aviso atualizado!')
    } else {
      const { error } = await add(payload)
      if (error) { toast.error('Erro: '+error.message); return }
      toast.success('Aviso publicado!')
    }
    setModalOpen(false)
  }

  async function handleDelete(id) {
    if (!confirm('Excluir este aviso?')) return
    const { error } = await remove(id)
    if (error) { toast.error('Erro: '+error.message); return }
    toast.success('Aviso excluído.')
  }

  if (loading) return (
    <div className="page" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:300 }}>
      <Loader2 size={28} className="animate-spin" style={{ color:'var(--accent)' }}/>
    </div>
  )

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Avisos</h1>
          <p className="page-subtitle">
            {naoLidos > 0 && <><span style={{ color:'var(--accent)',fontWeight:700 }}>{naoLidos} não lido(s)</span> · </>}
            {avisos.length} aviso(s) no total
          </p>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          <select className="form-input form-select" style={{ width:'auto' }} value={filterTipo} onChange={e=>setFilterTipo(e.target.value)}>
            <option value="">Todos</option>
            {TIPOS.map(t=><option key={t}>{t}</option>)}
          </select>
          <button className={`btn btn-sm ${showLidos?'btn-primary':'btn-secondary'}`} onClick={()=>setShowLidos(s=>!s)}>
            {showLidos?'Mostrar não lidos':'Mostrar lidos'}
          </button>
          {isAdmin && <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={14}/> Novo Aviso</button>}
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {filtered.length === 0 && (
          <div className="card"><div className="empty-state"><div className="empty-icon">🔔</div><div className="empty-title">Nenhum aviso encontrado</div><div className="empty-desc">Todos os avisos foram lidos ou não há avisos disponíveis.</div></div></div>
        )}
        {filtered.map(av => {
          const lido    = isLido(av)
          const expirado= av.expira_em && isPast(new Date(av.expira_em+'T23:59'))
          return (
            <div key={av.id} className="card" style={{
              borderLeft:`3px solid ${av.prioridade==='urgente'?'var(--red)':av.prioridade==='alta'?'var(--accent)':'var(--border)'}`,
              opacity: expirado ? .55 : 1,
            }}>
              <div style={{ padding:'14px 18px' }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                  <div style={{ width:38,height:38,borderRadius:8,background:'var(--surface-2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0 }}>
                    {TIPO_ICONS[av.tipo]||'📢'}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
                      {!lido && <div style={{ width:8,height:8,borderRadius:'50%',background:'var(--accent)',flexShrink:0 }}/>}
                      <span style={{ fontFamily:'var(--font-display)',fontWeight:lido?400:700,fontSize:15 }}>{av.titulo}</span>
                      {expirado && <span className="badge badge-red">Expirado</span>}
                    </div>
                    <p style={{ fontSize:13.5,color:'var(--text-2)',lineHeight:1.5,marginBottom:10,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden' }}>{av.mensagem}</p>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:8, alignItems:'center' }}>
                      <span className={`badge ${TIPO_COLORS[av.tipo]||'badge-gray'}`}>{av.tipo}</span>
                      <span className="badge badge-gray"><Users size={10}/> {av.destinatarios}</span>
                      {av.prioridade==='alta' && <span className="badge badge-orange">Alta prioridade</span>}
                      {av.prioridade==='urgente' && <span className="badge badge-red">Urgente</span>}
                      <span style={{ fontSize:11.5,color:'var(--text-3)',marginLeft:'auto',display:'flex',alignItems:'center',gap:4 }}>
                        <Clock size={11}/> {av.autor}
                        {av.expira_em && ` · Expira ${format(new Date(av.expira_em+'T00:00'),'dd/MM',{locale:ptBR})}`}
                      </span>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                    <button className="btn btn-icon btn-ghost btn-sm" onClick={()=>setViewModal(av)}><Eye size={13}/></button>
                    {!lido && !isAdmin && <button className="btn btn-ghost btn-sm" onClick={()=>marcarLido(av.id)} style={{ fontSize:12 }}>Marcar lido</button>}
                    {isAdmin && <>
                      <button className="btn btn-icon btn-ghost btn-sm" onClick={()=>openEdit(av)}><Edit3 size={13}/></button>
                      <button className="btn btn-icon btn-danger btn-sm" onClick={()=>handleDelete(av.id)}><Trash2 size={13}/></button>
                    </>}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Detail */}
      {viewModal && (
        <Modal open={!!viewModal} onClose={()=>setViewModal(null)} title="Aviso" size="lg"
          footer={<div style={{ display:'flex',gap:8,width:'100%' }}>
            {!isLido(viewModal) && <button className="btn btn-primary btn-sm" onClick={()=>{marcarLido(viewModal.id);setViewModal(null)}}>Marcar como lido</button>}
            <button className="btn btn-secondary btn-sm" style={{ marginLeft:'auto' }} onClick={()=>setViewModal(null)}>Fechar</button>
          </div>}>
          <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
            <div style={{ display:'flex',alignItems:'center',gap:10 }}>
              <div style={{ width:48,height:48,borderRadius:10,background:'var(--surface-2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24 }}>{TIPO_ICONS[viewModal.tipo]}</div>
              <div><h2 style={{ fontFamily:'var(--font-display)',fontWeight:800,fontSize:18 }}>{viewModal.titulo}</h2>
                <div style={{ display:'flex',gap:8,marginTop:4 }}>
                  <span className={`badge ${TIPO_COLORS[viewModal.tipo]||'badge-gray'}`}>{viewModal.tipo}</span>
                  <span className="badge badge-gray"><Users size={10}/> {viewModal.destinatarios}</span>
                </div>
              </div>
            </div>
            <div style={{ background:'var(--surface-2)',borderRadius:'var(--radius-sm)',padding:'16px',fontSize:14,lineHeight:1.65 }}>{viewModal.mensagem}</div>
            <div style={{ display:'flex',gap:16,fontSize:12.5,color:'var(--text-3)' }}>
              <span>Por: {viewModal.autor}</span>
              {viewModal.expira_em && <span>Expira: {format(new Date(viewModal.expira_em+'T00:00'),'dd/MM/yyyy')}</span>}
            </div>
          </div>
        </Modal>
      )}

      {/* Create/Edit */}
      <Modal open={modalOpen} onClose={()=>setModalOpen(false)} title={editItem?'Editar Aviso':'Novo Aviso'}
        footer={<><button className="btn btn-secondary btn-sm" onClick={()=>setModalOpen(false)}>Cancelar</button><button className="btn btn-primary btn-sm" onClick={handleSave}>{editItem?'Salvar':'Publicar'}</button></>}>
        <div className="form-group"><label className="form-label">Título <span>*</span></label><input className="form-input" placeholder="Título do aviso" value={form.titulo} onChange={e=>setForm(f=>({...f,titulo:e.target.value}))}/></div>
        <div className="form-group"><label className="form-label">Mensagem <span>*</span></label><textarea className="form-input form-textarea" style={{ minHeight:110 }} value={form.mensagem} onChange={e=>setForm(f=>({...f,mensagem:e.target.value}))}/></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Tipo</label><select className="form-input form-select" value={form.tipo} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))}>{TIPOS.map(t=><option key={t}>{t}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Prioridade</label><select className="form-input form-select" value={form.prioridade} onChange={e=>setForm(f=>({...f,prioridade:e.target.value}))}>{PRIORIDADES.map(p=><option key={p}>{p}</option>)}</select></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Destinatários</label><input className="form-input" placeholder="Todos, Monitores…" value={form.destinatarios} onChange={e=>setForm(f=>({...f,destinatarios:e.target.value}))}/></div>
          <div className="form-group"><label className="form-label">Expira em</label><input type="date" className="form-input" value={form.expira_em} onChange={e=>setForm(f=>({...f,expira_em:e.target.value}))}/></div>
        </div>
      </Modal>
    </div>
  )
}
