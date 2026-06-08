import { useState } from 'react'
import { format, addDays, subDays, startOfWeek, eachDayOfInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Calendar, Trash2, Edit3, Clock, X } from 'lucide-react'
import Modal from '../components/ui/Modal'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/ui/Toast'
import { mockEscalas as initialEscalas, mockFuncionarios } from '../data/mockData'

const TURNOS = ['Manhã','Tarde','Noite','Integral','Abertura','Fechamento']
const TIPOS  = ['Normal','Evento','Abertura','Folga','Férias','Plantão']
const SETORES = ['Recreação','Eventos','Limpeza','Recepção','Cozinha','Gestão']

function Avatar({ nome, size=26 }) {
  const init = nome?.split(' ').slice(0,2).map(w=>w[0]).join('')||'?'
  const colors = ['#F97316','#0D9488','#3B82F6','#8B5CF6','#EC4899','#10B981']
  const c = colors[nome?.charCodeAt(0)%colors.length]||'#F97316'
  return (
    <div style={{width:size,height:size,borderRadius:'50%',background:c,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*.38,fontWeight:700,flexShrink:0}}>{init}</div>
  )
}

const turnoColor = { 'Manhã':'#FEF9C3','Tarde':'#CCFBF1','Integral':'#FFEDD5','Noite':'#EDE9FE','Abertura':'#DCFCE7','Fechamento':'#FEE2E2' }
const turnoText  = { 'Manhã':'#CA8A04','Tarde':'#0D9488','Integral':'#F97316','Noite':'#7C3AED','Abertura':'#16A34A','Fechamento':'#DC2626' }

export default function Escalas() {
  const { isAdmin } = useAuth()
  const toast = useToast()
  const [escalas, setEscalas] = useState(initialEscalas)
  const [view, setView] = useState('semana') // semana | lista
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [filterSetor, setFilterSetor] = useState('')
  const [form, setForm] = useState({ funcionario_id:'', data:'', turno:'Manhã', horario:'08:00–14:00', setor:'Recreação', tipo:'Normal', obs:'' })

  const weekDays = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) })

  const filtered = escalas.filter(e => !filterSetor || e.setor === filterSetor)

  function openCreate(date = '') {
    setEditItem(null)
    setForm({ funcionario_id:'', data: date || format(new Date(),'yyyy-MM-dd'), turno:'Manhã', horario:'08:00–14:00', setor:'Recreação', tipo:'Normal', obs:'' })
    setModalOpen(true)
  }

  function openEdit(item) {
    setEditItem(item)
    setForm({ funcionario_id: item.funcionario_id, data: item.data, turno: item.turno, horario: item.horario, setor: item.setor, tipo: item.tipo, obs: item.obs||'' })
    setModalOpen(true)
  }

  function handleSave() {
    const func = mockFuncionarios.find(f=>f.id===form.funcionario_id)
    if (!func || !form.data) { toast.error('Preencha todos os campos obrigatórios'); return }
    if (editItem) {
      setEscalas(s => s.map(e => e.id===editItem.id ? { ...e, ...form, funcionario: func.nome } : e))
      toast.success('Escala atualizada!')
    } else {
      setEscalas(s => [...s, { id: `e${Date.now()}`, ...form, funcionario: func.nome }])
      toast.success('Escala adicionada!')
    }
    setModalOpen(false)
  }

  function handleDelete(id) {
    if (!confirm('Excluir esta escala?')) return
    setEscalas(s => s.filter(e=>e.id!==id))
    toast.success('Escala removida.')
  }

  const escalasDodia = (date) => filtered.filter(e => e.data === format(date,'yyyy-MM-dd'))

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Escalas</h1>
          <p className="page-subtitle">Gerencie turnos e jornadas da equipe</p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <select className="form-input form-select" style={{width:'auto'}} value={filterSetor} onChange={e=>setFilterSetor(e.target.value)}>
            <option value="">Todos os setores</option>
            {SETORES.map(s=><option key={s}>{s}</option>)}
          </select>
          <div style={{ display:'flex', border:'1.5px solid var(--border-2)', borderRadius:'var(--radius-sm)', overflow:'hidden' }}>
            {['semana','lista'].map(v=>(
              <button key={v} className={`btn btn-ghost btn-sm`} style={{ borderRadius:0, background: view===v?'var(--surface-2)':'' }} onClick={()=>setView(v)}>
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
          {/* Week navigation */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderBottom:'1px solid var(--border)' }}>
            <button className="btn btn-icon btn-secondary btn-sm" onClick={()=>setWeekStart(d=>subDays(d,7))}><ChevronLeft size={15}/></button>
            <span style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:14 }}>
              {format(weekStart,'d MMM',{locale:ptBR})} – {format(addDays(weekStart,6),'d MMM yyyy',{locale:ptBR})}
            </span>
            <button className="btn btn-icon btn-secondary btn-sm" onClick={()=>setWeekStart(d=>addDays(d,7))}><ChevronRight size={15}/></button>
          </div>

          {/* Week grid */}
          <div style={{ overflowX:'auto' }}>
            <div style={{ display:'grid', gridTemplateColumns:`repeat(7,minmax(120px,1fr))`, gap:0, minWidth:700 }}>
              {weekDays.map(day => {
                const isToday = format(day,'yyyy-MM-dd')===format(new Date(),'yyyy-MM-dd')
                const dayEscalas = escalasDodia(day)
                return (
                  <div key={day.toString()} style={{
                    minHeight:160, padding:'10px 10px', borderRight:'1px solid var(--border)',
                    borderBottom:'1px solid var(--border)', background: isToday?'#FFF7F3':'var(--surface)',
                    transition:'background .15s'
                  }}>
                    <div style={{ marginBottom:8, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div>
                        <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--text-3)' }}>
                          {format(day,'EEE',{locale:ptBR})}
                        </div>
                        <div style={{ fontSize:15, fontWeight:800, color: isToday?'var(--accent)':'var(--text)', lineHeight:1 }}>
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
                      {dayEscalas.map(es=>(
                        <div
                          key={es.id}
                          onClick={()=>isAdmin&&openEdit(es)}
                          style={{
                            padding:'4px 7px', borderRadius:4, cursor:isAdmin?'pointer':'default',
                            background: turnoColor[es.turno]||'var(--surface-2)',
                            color: turnoText[es.turno]||'var(--text)',
                            fontSize:10.5, fontWeight:600, lineHeight:1.3,
                          }}
                        >
                          {es.funcionario.split(' ')[0]}<br/>
                          <span style={{ fontWeight:400 }}>{es.horario}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Legend */}
          <div style={{ padding:'12px 20px', borderTop:'1px solid var(--border)', display:'flex', flexWrap:'wrap', gap:8 }}>
            {Object.entries(turnoColor).map(([k,v])=>(
              <div key={k} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11.5, color:'var(--text-2)' }}>
                <div style={{ width:10,height:10,borderRadius:2,background:v,flexShrink:0 }}/>
                {k}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Lista view */
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Funcionário</th>
                  <th>Data</th>
                  <th>Turno</th>
                  <th>Horário</th>
                  <th>Setor</th>
                  <th>Tipo</th>
                  {isAdmin && <th style={{ width:80 }}>Ações</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.sort((a,b)=>a.data.localeCompare(b.data)).map(es=>(
                  <tr key={es.id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <Avatar nome={es.funcionario} />
                        <span style={{ fontWeight:600 }}>{es.funcionario}</span>
                      </div>
                    </td>
                    <td style={{ color:'var(--text-2)', fontSize:13 }}>
                      {format(new Date(es.data+'T00:00'),'dd/MM/yyyy')}
                    </td>
                    <td>
                      <span style={{
                        padding:'3px 8px', borderRadius:99, fontSize:11.5, fontWeight:600,
                        background: turnoColor[es.turno]||'var(--surface-2)',
                        color: turnoText[es.turno]||'var(--text)',
                      }}>{es.turno}</span>
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
                          <button className="btn btn-icon btn-danger btn-sm" onClick={()=>handleDelete(es.id)}><Trash2 size={13}/></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {filtered.length===0 && (
                  <tr><td colSpan={7}>
                    <div className="empty-state"><div className="empty-icon">📅</div><div className="empty-title">Nenhuma escala encontrada</div></div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={()=>setModalOpen(false)}
        title={editItem ? 'Editar Escala' : 'Nova Escala'}
        footer={
          <>
            <button className="btn btn-secondary btn-sm" onClick={()=>setModalOpen(false)}>Cancelar</button>
            <button className="btn btn-primary btn-sm" onClick={handleSave}>
              {editItem ? 'Salvar alterações' : 'Adicionar'}
            </button>
          </>
        }
      >
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Funcionário <span>*</span></label>
            <select className="form-input form-select" value={form.funcionario_id} onChange={e=>setForm(f=>({...f,funcionario_id:e.target.value}))}>
              <option value="">Selecione…</option>
              {mockFuncionarios.filter(f=>f.ativo).map(f=><option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Data <span>*</span></label>
            <input type="date" className="form-input" value={form.data} onChange={e=>setForm(f=>({...f,data:e.target.value}))} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Turno</label>
            <select className="form-input form-select" value={form.turno} onChange={e=>setForm(f=>({...f,turno:e.target.value}))}>
              {TURNOS.map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Horário</label>
            <input className="form-input" placeholder="08:00–14:00" value={form.horario} onChange={e=>setForm(f=>({...f,horario:e.target.value}))} />
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
          <textarea className="form-input form-textarea" value={form.obs} onChange={e=>setForm(f=>({...f,obs:e.target.value}))} placeholder="Informações adicionais…" />
        </div>
      </Modal>
    </div>
  )
}
