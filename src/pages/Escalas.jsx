import { useState } from 'react'
import { format, addDays, subDays, startOfWeek, eachDayOfInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Trash2, Edit3, Clock, Loader2, X } from 'lucide-react'
import Modal from '../components/ui/Modal'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/ui/Toast'
import { useTable, useFuncionarios } from '../hooks/useDb'
import { mockEscalas } from '../data/mockData'

/* Lê turnos salvos em Configurações → localStorage */
function loadTurnos() {
  try {
    const saved = localStorage.getItem('feste_cfg_turnos')
    if (saved) return JSON.parse(saved)
  } catch {}
  return ['Manhã (08:00–14:00)','Tarde (14:00–20:00)','Noite (18:00–00:00)',
          'Integral (08:00–18:00)','Abertura (07:30–13:30)','Fechamento (16:00–22:00)']
}

/* "Manhã (08:00–14:00)" → { nome:"Manhã", horario:"08:00–14:00" } */
function parseTurno(str) {
  const m = str.match(/^(.+?)\s*\(([^)]+)\)$/)
  if (m) return { nome: m[1].trim(), horario: m[2].trim() }
  return { nome: str.trim(), horario: '' }
}

const TIPOS   = ['Normal','Evento','Abertura','Folga','Férias','Plantão']
const SETORES = ['Recreação','Eventos','Limpeza','Recepção','Cozinha','Gestão']

/* Paleta de cores para turnos dinâmicos */
const PALETA_BG   = ['#FEF9C3','#CCFBF1','#FFEDD5','#EDE9FE','#DCFCE7','#FEE2E2','#DBEAFE','#FCE7F3']
const PALETA_TEXT = ['#CA8A04','#0D9488','#F97316','#7C3AED','#16A34A','#DC2626','#1D4ED8','#BE185D']

function getTurnoStyle(nome, allNomes) {
  const idx = allNomes.indexOf(nome) % PALETA_BG.length
  const i   = idx >= 0 ? idx : Math.abs(nome.charCodeAt(0)) % PALETA_BG.length
  return { bg: PALETA_BG[i], text: PALETA_TEXT[i] }
}

function Avatar({ nome, size=26 }) {
  const init   = nome?.split(' ').slice(0,2).map(w=>w[0]).join('')||'?'
  const colors = ['#F97316','#0D9488','#3B82F6','#8B5CF6','#EC4899','#10B981']
  return (
    <div style={{width:size,height:size,borderRadius:'50%',background:colors[nome?.charCodeAt(0)%colors.length]||'#F97316',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*.38,fontWeight:700,flexShrink:0}}>{init}</div>
  )
}

export default function Escalas() {
  const { isAdmin } = useAuth()
  const toast = useToast()
  const { rows: escalas, loading, add, update, remove } = useTable('escalas', {
    select:   '*, usuarios!funcionario_id(nome)',
    orderBy:  'data',
    orderAsc: true,
    seedData: mockEscalas,
  })
  const { funcionarios } = useFuncionarios()

  /* Turnos do Configurações */
  const [turnosRaw]   = useState(loadTurnos)
  const turnosParsed  = turnosRaw.map(parseTurno)
  const turnoNomes    = turnosParsed.map(t => t.nome)

  const [view, setView]           = useState('semana')
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem]   = useState(null)
  const [filterSetor, setFilterSetor] = useState('')
  const [hoveredId, setHoveredId] = useState(null)

  const emptyForm = {
    funcionario_id:'', data: format(new Date(),'yyyy-MM-dd'),
    turno:'', horario:'', setor:'Recreação', tipo:'Normal', observacoes:''
  }
  const [form, setForm] = useState(emptyForm)

  const weekDays = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) })

  function nomeFuncionario(es) {
    return es.usuarios?.nome || es.funcionario || '?'
  }

  const filtered = escalas.filter(e => !filterSetor || e.setor === filterSetor)

  function openCreate(date='') {
    setEditItem(null)
    setForm({ ...emptyForm, data: date || format(new Date(),'yyyy-MM-dd') })
    setModalOpen(true)
  }
  function openEdit(item) {
    setEditItem(item)
    setForm({
      funcionario_id: item.funcionario_id||'',
      data: item.data, turno: item.turno, horario: item.horario,
      setor: item.setor, tipo: item.tipo, observacoes: item.observacoes||''
    })
    setModalOpen(true)
  }

  /* Ao selecionar turno, auto-preenche horário */
  function handleTurnoChange(nome) {
    const t = turnosParsed.find(t => t.nome === nome)
    setForm(f => ({ ...f, turno: nome, horario: t?.horario || f.horario }))
  }

  async function handleSave() {
    if (!form.data || !form.turno) { toast.error('Selecione o turno e a data'); return }
    const func    = funcionarios.find(f => f.id === form.funcionario_id)

    async function trySave(fn, payload) {
      let r = await fn(payload)
      if (r.error?.message?.includes('funcionario') && !r.error?.message?.includes('funcionario_id')) {
        const { funcionario: _, ...sem } = payload
        r = await fn(sem)
      }
      return r
    }

    const payload = { ...form, funcionario: func?.nome || form.funcionario || '' }

    if (editItem) {
      const { error } = await trySave(p => update(editItem.id, p), payload)
      if (error) { toast.error('Erro: ' + error.message); return }
      toast.success('Escala atualizada!')
    } else {
      if (!form.funcionario_id) { toast.error('Selecione o funcionário'); return }
      const { error } = await trySave(p => add(p), payload)
      if (error) { toast.error('Erro: ' + error.message); return }
      toast.success('Escala adicionada!')
    }
    setModalOpen(false)
  }

  async function handleDelete(id, e) {
    if (e) e.stopPropagation()
    if (!confirm('Excluir esta escala?')) return
    const { error } = await remove(id)
    if (error) { toast.error('Erro: ' + error.message); return }
    toast.success('Escala removida.')
  }

  const escalasDodia = (date) => filtered.filter(e => e.data === format(date,'yyyy-MM-dd'))

  if (loading) return (
    <div className="page" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:300 }}>
      <Loader2 size={28} className="animate-spin" style={{ color:'var(--accent)' }}/>
    </div>
  )

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Escalas</h1>
          <p className="page-subtitle">Gerencie turnos e jornadas da equipe</p>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          <select className="form-input form-select" style={{ width:'auto' }} value={filterSetor} onChange={e=>setFilterSetor(e.target.value)}>
            <option value="">Todos os setores</option>
            {SETORES.map(s=><option key={s}>{s}</option>)}
          </select>
          <div style={{ display:'flex', border:'1.5px solid var(--border-2)', borderRadius:'var(--radius-sm)', overflow:'hidden' }}>
            {['semana','lista'].map(v=>(
              <button key={v} className="btn btn-ghost btn-sm" style={{ borderRadius:0, background:view===v?'var(--surface-2)':'' }} onClick={()=>setView(v)}>
                {v==='semana'?'Semana':'Lista'}
              </button>
            ))}
          </div>
          {isAdmin && (
            <button className="btn btn-primary btn-sm" onClick={()=>openCreate()}>
              <Plus size={14}/> Nova Escala
            </button>
          )}
        </div>
      </div>

      {view === 'semana' ? (
        <div className="card">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderBottom:'1px solid var(--border)' }}>
            <button className="btn btn-icon btn-secondary btn-sm" onClick={()=>setWeekStart(d=>subDays(d,7))}><ChevronLeft size={15}/></button>
            <span style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:14 }}>
              {format(weekStart,'d MMM',{locale:ptBR})} – {format(addDays(weekStart,6),'d MMM yyyy',{locale:ptBR})}
            </span>
            <button className="btn btn-icon btn-secondary btn-sm" onClick={()=>setWeekStart(d=>addDays(d,7))}><ChevronRight size={15}/></button>
          </div>

          <div style={{ overflowX:'auto' }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,minmax(120px,1fr))', minWidth:700 }}>
              {weekDays.map(day => {
                const isToday     = format(day,'yyyy-MM-dd')===format(new Date(),'yyyy-MM-dd')
                const dayEscalas  = escalasDodia(day)
                return (
                  <div key={day.toString()} style={{
                    minHeight:160, padding:'10px',
                    borderRight:'1px solid var(--border)', borderBottom:'1px solid var(--border)',
                    background: isToday?'#FFF7F3':'var(--surface)',
                  }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                      <div>
                        <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--text-3)' }}>
                          {format(day,'EEE',{locale:ptBR})}
                        </div>
                        <div style={{ fontSize:15, fontWeight:800, color:isToday?'var(--accent)':'var(--text)', lineHeight:1 }}>
                          {format(day,'d')}
                        </div>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={()=>openCreate(format(day,'yyyy-MM-dd'))}
                          style={{ width:22,height:22,borderRadius:4,background:'transparent',border:'1.5px dashed var(--border-2)',color:'var(--text-3)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:12 }}
                        >+</button>
                      )}
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                      {dayEscalas.map(es => {
                        const style = getTurnoStyle(es.turno, turnoNomes)
                        const isHov = hoveredId === es.id
                        return (
                          <div
                            key={es.id}
                            onMouseEnter={() => isAdmin && setHoveredId(es.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            onClick={() => isAdmin && openEdit(es)}
                            style={{
                              position:'relative',
                              padding:'4px 7px', borderRadius:4,
                              cursor: isAdmin?'pointer':'default',
                              background: style.bg, color: style.text,
                              fontSize:10.5, fontWeight:600, lineHeight:1.3,
                            }}
                          >
                            {nomeFuncionario(es).split(' ')[0]}<br/>
                            <span style={{ fontWeight:400 }}>{es.horario || es.turno}</span>

                            {/* Botão excluir (aparece no hover) */}
                            {isAdmin && isHov && (
                              <button
                                onClick={e => handleDelete(es.id, e)}
                                style={{
                                  position:'absolute', top:2, right:2,
                                  width:14, height:14,
                                  background:'rgba(0,0,0,.25)',
                                  border:'none', borderRadius:3,
                                  cursor:'pointer', display:'flex',
                                  alignItems:'center', justifyContent:'center',
                                  color:'#fff', padding:0,
                                }}
                                title="Excluir"
                              >
                                <X size={9}/>
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Legenda dinâmica */}
          <div style={{ padding:'12px 20px', borderTop:'1px solid var(--border)', display:'flex', flexWrap:'wrap', gap:8 }}>
            {turnoNomes.map((nome, i) => {
              const s = getTurnoStyle(nome, turnoNomes)
              return (
                <div key={nome} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11.5, color:'var(--text-2)' }}>
                  <div style={{ width:10,height:10,borderRadius:2,background:s.bg,flexShrink:0 }}/>{nome}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* Vista lista */
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Funcionário</th><th>Data</th><th>Turno</th><th>Horário</th>
                  <th>Setor</th><th>Tipo</th>
                  {isAdmin && <th style={{ width:80 }}>Ações</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.length===0 && (
                  <tr><td colSpan={7}>
                    <div className="empty-state"><div className="empty-icon">📅</div><div className="empty-title">Nenhuma escala</div></div>
                  </td></tr>
                )}
                {filtered.sort((a,b)=>a.data.localeCompare(b.data)).map(es => {
                  const style = getTurnoStyle(es.turno, turnoNomes)
                  return (
                    <tr key={es.id}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <Avatar nome={nomeFuncionario(es)}/><span style={{ fontWeight:600 }}>{nomeFuncionario(es)}</span>
                        </div>
                      </td>
                      <td style={{ fontSize:13, color:'var(--text-2)' }}>{format(new Date(es.data+'T00:00'),'dd/MM/yyyy')}</td>
                      <td>
                        <span style={{ padding:'3px 8px', borderRadius:99, fontSize:11.5, fontWeight:600, background:style.bg, color:style.text }}>
                          {es.turno}
                        </span>
                      </td>
                      <td style={{ fontSize:13, color:'var(--text-2)', display:'flex', alignItems:'center', gap:5 }}>
                        <Clock size={12}/>{es.horario}
                      </td>
                      <td style={{ fontSize:13, color:'var(--text-2)' }}>{es.setor}</td>
                      <td><span className="badge badge-gray">{es.tipo}</span></td>
                      {isAdmin && (
                        <td>
                          <div style={{ display:'flex', gap:4 }}>
                            <button className="btn btn-icon btn-ghost btn-sm" onClick={()=>openEdit(es)}><Edit3 size={13}/></button>
                            <button className="btn btn-icon btn-danger btn-sm" onClick={e=>handleDelete(es.id,e)}><Trash2 size={13}/></button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal criar/editar */}
      <Modal
        open={modalOpen}
        onClose={()=>setModalOpen(false)}
        title={editItem ? 'Editar Escala' : 'Nova Escala'}
        footer={
          <>
            <button className="btn btn-secondary btn-sm" onClick={()=>setModalOpen(false)}>Cancelar</button>
            <button className="btn btn-primary btn-sm" onClick={handleSave}>{editItem?'Salvar':'Adicionar'}</button>
          </>
        }
      >
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Funcionário <span>*</span></label>
            <select className="form-input form-select" value={form.funcionario_id} onChange={e=>setForm(f=>({...f,funcionario_id:e.target.value}))}>
              <option value="">Selecione…</option>
              {funcionarios.map(f=><option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Data <span>*</span></label>
            <input type="date" className="form-input" value={form.data} onChange={e=>setForm(f=>({...f,data:e.target.value}))}/>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Turno <span>*</span></label>
            <select
              className="form-input form-select"
              value={form.turno}
              onChange={e=>handleTurnoChange(e.target.value)}
            >
              <option value="">Selecione o turno…</option>
              {turnoNomes.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
            {turnoNomes.length === 0 && (
              <span className="form-hint">Cadastre turnos em Configurações → Turnos</span>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Horário</label>
            <input
              className="form-input"
              placeholder="08:00–14:00"
              value={form.horario}
              onChange={e=>setForm(f=>({...f,horario:e.target.value}))}
            />
            <span className="form-hint">Preenchido automaticamente ao escolher o turno</span>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Setor</label>
            <select className="form-input form-select" value={form.setor} onChange={e=>setForm(f=>({...f,setor:e.target.value}))}>
              {SETORES.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Tipo</label>
            <select className="form-input form-select" value={form.tipo} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))}>
              {TIPOS.map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Observações</label>
          <textarea className="form-input form-textarea" value={form.observacoes} onChange={e=>setForm(f=>({...f,observacoes:e.target.value}))} placeholder="Informações adicionais…"/>
        </div>
      </Modal>
    </div>
  )
}
