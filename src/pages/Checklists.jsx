import { useState } from 'react'
import { format } from 'date-fns'
import { Plus, Trash2, Edit3, ChevronDown, ChevronUp, X, UserCheck, Loader2 } from 'lucide-react'
import Modal from '../components/ui/Modal'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/ui/Toast'
import { useTable, useFuncionarios } from '../hooks/useDb'
import { mockChecklistModelos, mockExecucoes } from '../data/mockData'

const RECORRENCIAS = ['Diária','Semanal','Mensal','Por evento','Sob demanda']
const SETORES      = ['Geral','Recreação','Limpeza','Eventos','Recepção','Cozinha']
const STATUS_MAP   = { 'Concluído':'badge-green','Em andamento':'badge-orange','Pendente':'badge-yellow' }

/* ── Fora do componente pai para evitar loop de re-render ── */
function ExecucaoCard({ ex, isAdmin, today, onCheck, onDelete, expanded, onToggle }) {
  const itens  = Array.isArray(ex.itens) ? ex.itens : []
  const total  = itens.length
  const feitos = itens.filter(i => i.feito).length
  const pct    = total > 0 ? Math.round((feitos / total) * 100) : 0
  const open   = expanded

  return (
    <div className="card" style={{ marginBottom:10 }}>
      <div
        style={{ padding:'14px 18px', cursor:'pointer', userSelect:'none' }}
        onClick={onToggle}
      >
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:42,height:42,borderRadius:8,background:'var(--surface-2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0 }}>
            📋
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:'var(--font-display)',fontWeight:700,fontSize:14 }}>{ex.modelo_nome}</div>
            <div style={{ display:'flex', gap:10, alignItems:'center', marginTop:2 }}>
              <span style={{ fontSize:12,color:'var(--text-2)' }}>{ex.responsavel}</span>
              {isAdmin && ex.data !== today && (
                <span style={{ fontSize:11.5,color:'var(--text-3)' }}>
                  {format(new Date(ex.data+'T00:00'),'dd/MM/yyyy')}
                </span>
              )}
            </div>
            <div style={{ marginTop:6 }}>
              <div className="progress-bar">
                <div className={`progress-fill ${pct===100?'green':''}`} style={{ width:`${pct}%` }}/>
              </div>
              <div style={{ fontSize:11,color:'var(--text-3)',marginTop:3 }}>{feitos}/{total} itens concluídos</div>
            </div>
          </div>
          <div style={{ display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6,flexShrink:0 }}>
            <span className={`badge ${STATUS_MAP[ex.status]||'badge-gray'}`}>{ex.status}</span>
            <span style={{ fontSize:14,fontWeight:800,color:pct===100?'var(--green)':pct>0?'var(--accent)':'var(--text-3)' }}>{pct}%</span>
          </div>
          {isAdmin && (
            <button
              className="btn btn-icon btn-danger btn-sm"
              onClick={e => { e.stopPropagation(); onDelete(ex.id) }}
              title="Remover atribuição"
            >
              <Trash2 size={12}/>
            </button>
          )}
          {open
            ? <ChevronUp size={16} style={{ color:'var(--text-3)',flexShrink:0 }}/>
            : <ChevronDown size={16} style={{ color:'var(--text-3)',flexShrink:0 }}/>
          }
        </div>
      </div>

      {open && (
        <div style={{ borderTop:'1px solid var(--border)' }}>
          {itens.map(it => (
            <div key={it.id} className="check-item">
              <input
                type="checkbox"
                checked={it.feito}
                onChange={() => onCheck(ex.id, it.id)}
                disabled={isAdmin || ex.data !== today}
              />
              <div style={{ flex:1 }}>
                <span className={`check-label ${it.feito?'done':''}`}>{it.descricao}</span>
                {it.obrigatorio && !it.feito && (
                  <span style={{ fontSize:10.5,color:'var(--red)',marginLeft:8,fontWeight:600 }}>Obrigatório</span>
                )}
              </div>
            </div>
          ))}
          {isAdmin && (
            <div style={{ padding:'10px 16px',borderTop:'1px solid var(--border)',background:'var(--surface-2)' }}>
              <span style={{ fontSize:11.5,color:'var(--text-3)' }}>
                Somente o funcionário atribuído pode marcar os itens.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Componente principal ── */
export default function Checklists() {
  const { isAdmin, profile } = useAuth()
  const toast = useToast()

  const { rows: modelos,   loading: lm, add: addModelo,   update: updateModelo, remove: removeModelo }   = useTable('checklist_modelos',    { seedData: mockChecklistModelos })
  const { rows: execucoes, loading: le, add: addExec,      remove: removeExec,   setRows: setExecs }      = useTable('checklist_execucoes',   { seedData: mockExecucoes, orderBy: 'data', orderAsc: false })
  const { funcionarios } = useFuncionarios()

  const [tab, setTab]         = useState('hoje')
  const [expanded, setExpanded] = useState({})

  /* Modelos */
  const [modalModelo, setModalModelo] = useState(false)
  const [editModelo, setEditModelo]   = useState(null)
  const [formModelo, setFormModelo]   = useState({ nome:'', setor:'Geral', recorrencia:'Diária', itens:[] })
  const [novoItem, setNovoItem]       = useState('')

  /* Atribuição */
  const [modalAtribuir, setModalAtribuir]   = useState(false)
  const [atribuirModelo, setAtribuirModelo] = useState(null)
  const [atribuirForm, setAtribuirForm]     = useState({ funcionario_id:'', data: format(new Date(),'yyyy-MM-dd') })

  const today = format(new Date(),'yyyy-MM-dd')

  const execHoje = execucoes.filter(e => {
    if (e.data !== today) return false
    if (isAdmin) return true
    return e.funcionario_id === profile?.id
  })
  const execHist = execucoes.filter(e => {
    if (e.data === today) return false
    if (isAdmin) return true
    return e.funcionario_id === profile?.id
  })

  function toggleExpand(id) { setExpanded(s => ({ ...s, [id]: !s[id] })) }

  /* Marcar item — normaliza itens (pode vir como string JSON do Supabase) */
  function checkItem(execId, itemId) {
    setExecs(prev => prev.map(ex => {
      if (ex.id !== execId) return ex
      const rawItens = typeof ex.itens === 'string'
        ? (() => { try { return JSON.parse(ex.itens) } catch { return [] } })()
        : (ex.itens || [])
      const itens  = rawItens.map(it => it.id===itemId ? {...it,feito:!it.feito} : it)
      const total  = itens.length
      const feitos = itens.filter(i=>i.feito).length
      const status = feitos===total?'Concluído':feitos>0?'Em andamento':'Pendente'
      return { ...ex, itens, status }
    }))
  }

  /* Remover execução */
  async function deleteExec(id) {
    if (!confirm('Remover esta atribuição?')) return
    const { error } = await removeExec(id)
    if (error) { toast.error('Erro: '+error.message); return }
    toast.success('Atribuição removida.')
  }

  /* Atribuir checklist */
  function abrirAtribuir(modelo) {
    setAtribuirModelo(modelo)
    setAtribuirForm({ funcionario_id:'', data: today })
    setModalAtribuir(true)
  }
  async function confirmarAtribuicao() {
    if (!atribuirForm.funcionario_id) { toast.error('Selecione um funcionário'); return }
    const func = funcionarios.find(f => f.id===atribuirForm.funcionario_id)
    const jaExiste = execucoes.find(e =>
      e.modelo_id===atribuirModelo.id &&
      e.data===atribuirForm.data &&
      e.funcionario_id===atribuirForm.funcionario_id
    )
    if (jaExiste) { toast.error(`${func?.nome} já possui este checklist nessa data`); return }
    const payload = {
      modelo_id:      atribuirModelo.id,
      modelo_nome:    atribuirModelo.nome,
      data:           atribuirForm.data,
      responsavel:    func?.nome || '?',
      funcionario_id: atribuirForm.funcionario_id,
      status:         'Pendente',
      itens:          JSON.stringify(atribuirModelo.itens.map(i=>({...i,feito:false}))),
    }
    // tenta com todos os campos; se falhar por coluna faltando, tenta sem funcionario_id
    let result = await addExec(payload)
    if (result.error?.message?.includes('funcionario_id') || result.error?.message?.includes('responsavel') || result.error?.message?.includes('modelo_nome')) {
      const { funcionario_id: _fi, responsavel: _r, modelo_nome: _mn, ...semExtra } = payload
      result = await addExec({ ...semExtra, responsavel: func?.nome || '?' })
    }
    if (result.error) { toast.error('Erro: '+result.error.message); return }
    toast.success(`Checklist atribuído a ${func?.nome}!`)
    setModalAtribuir(false)
    setTab('hoje')
  }

  /* Modelos CRUD */
  function openCreateModelo() {
    setEditModelo(null); setFormModelo({ nome:'',setor:'Geral',recorrencia:'Diária',itens:[] }); setNovoItem(''); setModalModelo(true)
  }
  function openEditModelo(m) {
    setEditModelo(m); setFormModelo({ nome:m.nome,setor:m.setor,recorrencia:m.recorrencia,itens:[...m.itens] }); setNovoItem(''); setModalModelo(true)
  }
  function addItemModelo() {
    if (!novoItem.trim()) return
    setFormModelo(f=>({...f,itens:[...f.itens,{id:`ni${Date.now()}`,descricao:novoItem.trim(),obrigatorio:false}]}))
    setNovoItem('')
  }
  function removeItemModelo(id) { setFormModelo(f=>({...f,itens:f.itens.filter(i=>i.id!==id)})) }
  function toggleObrigatorio(id) { setFormModelo(f=>({...f,itens:f.itens.map(i=>i.id===id?{...i,obrigatorio:!i.obrigatorio}:i)})) }
  async function saveModelo() {
    if (!formModelo.nome) { toast.error('Nome obrigatório'); return }
    const payload = { nome: formModelo.nome, setor: formModelo.setor, recorrencia: formModelo.recorrencia, itens: JSON.stringify(formModelo.itens) }

    // Retry defensivo: remove campos que a tabela não reconheça
    async function tryOp(fn, p) {
      let r = await fn(p)
      if (r.error?.message?.includes("'itens'")) {
        const { itens: _, ...sem } = p; r = await fn(sem)
      }
      if (r.error?.message?.includes("'setor'") || r.error?.message?.includes("'recorrencia'")) {
        const { setor: _s, recorrencia: _r, ...sem } = p; r = await fn(sem)
      }
      return r
    }

    if (editModelo) {
      const { error } = await tryOp(p => updateModelo(editModelo.id, p), payload)
      if (error) { toast.error('Erro ao atualizar: ' + error.message); return }
      toast.success('Modelo atualizado!')
    } else {
      const { error } = await tryOp(p => addModelo(p), payload)
      if (error) { toast.error('Erro ao criar: ' + error.message); return }
      toast.success('Modelo criado!')
    }
    setModalModelo(false)
  }
  async function deleteModelo(id) {
    if (!confirm('Excluir este modelo?')) return
    const { error } = await removeModelo(id)
    if (error) { toast.error('Erro: '+error.message); return }
    toast.success('Modelo excluído.')
  }

  /* Normaliza itens que podem vir como JSON string do Supabase */
  function parseExec(ex) {
    const itens = typeof ex.itens === 'string' ? (() => { try { return JSON.parse(ex.itens) } catch { return [] } })() : (ex.itens||[])
    return { ...ex, itens }
  }
  function parseModelo(m) {
    const itens = typeof m.itens === 'string' ? (() => { try { return JSON.parse(m.itens) } catch { return [] } })() : (m.itens||[])
    return { ...m, itens }
  }

  if (lm || le) return (
    <div className="page" style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:300 }}>
      <Loader2 size={28} className="animate-spin" style={{ color:'var(--accent)' }}/>
    </div>
  )

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Checklists</h1>
          <p className="page-subtitle">
            {isAdmin ? 'Atribua tarefas à equipe e acompanhe o progresso' : 'Suas tarefas atribuídas pelo administrador'}
          </p>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom:16 }}>
        <div className={`tab-item ${tab==='hoje'?'active':''}`} onClick={()=>setTab('hoje')}>
          Hoje
          {execHoje.filter(e=>e.status!=='Concluído').length>0 && (
            <span className="badge badge-orange" style={{ marginLeft:6 }}>
              {execHoje.filter(e=>e.status!=='Concluído').length}
            </span>
          )}
        </div>
        <div className={`tab-item ${tab==='historico'?'active':''}`} onClick={()=>setTab('historico')}>Histórico</div>
        {isAdmin && (
          <div className={`tab-item ${tab==='modelos'?'active':''}`} onClick={()=>setTab('modelos')}>
            Modelos <span className="badge badge-gray" style={{ marginLeft:6 }}>{modelos.length}</span>
          </div>
        )}
      </div>

      {/* ── HOJE ── */}
      {tab==='hoje' && (
        <div>
          {execHoje.length===0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-icon">{isAdmin?'📋':'✅'}</div>
                <div className="empty-title">{isAdmin?'Nenhum checklist atribuído hoje':'Nenhuma tarefa para você hoje'}</div>
                <div className="empty-desc">{isAdmin?'Acesse "Modelos" e atribua checklists.':'O administrador ainda não atribuiu tarefas.'}</div>
                {isAdmin && <button className="btn btn-primary btn-sm" style={{ marginTop:10 }} onClick={()=>setTab('modelos')}>Gerenciar modelos</button>}
              </div>
            </div>
          ) : execHoje.map(ex => {
            const parsed = parseExec(ex)
            return (
              <ExecucaoCard
                key={ex.id}
                ex={parsed}
                isAdmin={isAdmin}
                today={today}
                onCheck={checkItem}
                onDelete={deleteExec}
                expanded={!!expanded[ex.id]}
                onToggle={()=>toggleExpand(ex.id)}
              />
            )
          })}
        </div>
      )}

      {/* ── HISTÓRICO ── */}
      {tab==='historico' && (
        <div>
          {execHist.length===0 ? (
            <div className="card"><div className="empty-state"><div className="empty-icon">📋</div><div className="empty-title">Sem histórico</div></div></div>
          ) : execHist.map(ex => {
            const parsed = parseExec(ex)
            return (
              <ExecucaoCard
                key={ex.id}
                ex={parsed}
                isAdmin={isAdmin}
                today={today}
                onCheck={checkItem}
                onDelete={deleteExec}
                expanded={!!expanded[ex.id]}
                onToggle={()=>toggleExpand(ex.id)}
              />
            )
          })}
        </div>
      )}

      {/* ── MODELOS (admin) ── */}
      {tab==='modelos' && isAdmin && (
        <div>
          <div style={{ display:'flex',justifyContent:'flex-end',marginBottom:12 }}>
            <button className="btn btn-primary btn-sm" onClick={openCreateModelo}><Plus size={14}/> Novo Modelo</button>
          </div>
          {modelos.length===0 ? (
            <div className="card"><div className="empty-state"><div className="empty-icon">📋</div><div className="empty-title">Nenhum modelo criado</div></div></div>
          ) : modelos.map(m => {
            const parsed = parseModelo(m)
            return (
              <div key={m.id} className="card" style={{ marginBottom:10 }}>
                <div style={{ padding:'14px 18px',display:'flex',alignItems:'center',gap:12 }}>
                  <div style={{ width:42,height:42,borderRadius:8,background:'var(--accent-light)',color:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0 }}>📋</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:'var(--font-display)',fontWeight:700,fontSize:14 }}>{m.nome}</div>
                    <div style={{ display:'flex',gap:8,marginTop:4,flexWrap:'wrap' }}>
                      <span className="badge badge-gray">{m.setor}</span>
                      <span className="badge badge-teal">{m.recorrencia}</span>
                      <span style={{ fontSize:12,color:'var(--text-3)' }}>{parsed.itens.length} itens</span>
                    </div>
                  </div>
                  <div style={{ display:'flex',gap:6,flexWrap:'wrap',justifyContent:'flex-end' }}>
                    <button className="btn btn-primary btn-sm" onClick={()=>abrirAtribuir(parsed)}><UserCheck size={13}/> Atribuir</button>
                    <button className="btn btn-icon btn-ghost btn-sm" onClick={()=>openEditModelo(parsed)}><Edit3 size={13}/></button>
                    <button className="btn btn-icon btn-danger btn-sm" onClick={()=>deleteModelo(m.id)}><Trash2 size={13}/></button>
                  </div>
                </div>
                <div style={{ borderTop:'1px solid var(--border)',padding:'8px 18px 12px' }}>
                  {parsed.itens.slice(0,3).map(it=>(
                    <div key={it.id} style={{ display:'flex',alignItems:'center',gap:8,padding:'4px 0',fontSize:13,color:'var(--text-2)' }}>
                      <div style={{ width:14,height:14,borderRadius:3,border:'1.5px solid var(--border-2)',flexShrink:0 }}/>
                      {it.descricao}{it.obrigatorio&&<span style={{ fontSize:10,color:'var(--red)',fontWeight:600 }}>*</span>}
                    </div>
                  ))}
                  {parsed.itens.length>3&&<div style={{ fontSize:12,color:'var(--text-3)',marginTop:4 }}>+ {parsed.itens.length-3} itens</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal atribuir */}
      <Modal open={modalAtribuir} onClose={()=>setModalAtribuir(false)} title={`Atribuir: ${atribuirModelo?.nome||''}`}
        footer={<><button className="btn btn-secondary btn-sm" onClick={()=>setModalAtribuir(false)}>Cancelar</button><button className="btn btn-primary btn-sm" onClick={confirmarAtribuicao}><UserCheck size={13}/> Atribuir</button></>}>
        <div style={{ background:'var(--surface-2)',borderRadius:'var(--radius-sm)',padding:'12px 16px',fontSize:13,color:'var(--text-2)',lineHeight:1.5 }}>
          O funcionário selecionado poderá visualizar e marcar os itens na data indicada.
        </div>
        <div className="form-group">
          <label className="form-label">Funcionário <span>*</span></label>
          <select className="form-input form-select" value={atribuirForm.funcionario_id} onChange={e=>setAtribuirForm(f=>({...f,funcionario_id:e.target.value}))}>
            <option value="">Selecione…</option>
            {funcionarios.map(f=><option key={f.id} value={f.id}>{f.nome} — {f.cargo}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Data</label>
          <input type="date" className="form-input" value={atribuirForm.data} onChange={e=>setAtribuirForm(f=>({...f,data:e.target.value}))}/>
        </div>
      </Modal>

      {/* Modal modelo */}
      <Modal open={modalModelo} onClose={()=>setModalModelo(false)} title={editModelo?'Editar Modelo':'Novo Modelo'} size="lg"
        footer={<><button className="btn btn-secondary btn-sm" onClick={()=>setModalModelo(false)}>Cancelar</button><button className="btn btn-primary btn-sm" onClick={saveModelo}>{editModelo?'Salvar':'Criar'}</button></>}>
        <div className="form-group"><label className="form-label">Nome <span>*</span></label><input className="form-input" placeholder="Ex: Abertura Diária" value={formModelo.nome} onChange={e=>setFormModelo(f=>({...f,nome:e.target.value}))}/></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Setor</label><select className="form-input form-select" value={formModelo.setor} onChange={e=>setFormModelo(f=>({...f,setor:e.target.value}))}>{SETORES.map(s=><option key={s}>{s}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Recorrência</label><select className="form-input form-select" value={formModelo.recorrencia} onChange={e=>setFormModelo(f=>({...f,recorrencia:e.target.value}))}>{RECORRENCIAS.map(r=><option key={r}>{r}</option>)}</select></div>
        </div>
        <div className="form-group">
          <label className="form-label">Itens</label>
          <div style={{ display:'flex',gap:6,marginBottom:8 }}>
            <input className="form-input" placeholder="Descrição do item…" value={novoItem} onChange={e=>setNovoItem(e.target.value)} onKeyDown={e=>e.key==='Enter'&&(e.preventDefault(),addItemModelo())}/>
            <button type="button" className="btn btn-secondary btn-sm" style={{ flexShrink:0 }} onClick={addItemModelo}>Add</button>
          </div>
          <div style={{ border:'1.5px solid var(--border)',borderRadius:'var(--radius-sm)',overflow:'hidden' }}>
            {formModelo.itens.length===0&&<div style={{ padding:'18px',textAlign:'center',color:'var(--text-3)',fontSize:13 }}>Nenhum item</div>}
            {formModelo.itens.map((it,idx)=>(
              <div key={it.id} style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderBottom:idx<formModelo.itens.length-1?'1px solid var(--border)':'none',background:'var(--surface)' }}>
                <span style={{ fontSize:12,color:'var(--text-3)',width:20,textAlign:'right',flexShrink:0 }}>{idx+1}</span>
                <span style={{ flex:1,fontSize:13.5 }}>{it.descricao}</span>
                <button type="button" onClick={()=>toggleObrigatorio(it.id)} style={{ fontSize:11,padding:'2px 8px',borderRadius:99,border:'1.5px solid',cursor:'pointer',fontWeight:600,background:it.obrigatorio?'var(--red-light)':'var(--surface-2)',color:it.obrigatorio?'var(--red)':'var(--text-3)',borderColor:it.obrigatorio?'#FECACA':'var(--border)' }}>
                  {it.obrigatorio?'Obrig.':'Opcional'}
                </button>
                <button type="button" onClick={()=>removeItemModelo(it.id)} style={{ color:'var(--text-3)',background:'none',border:'none',cursor:'pointer',display:'flex',padding:2 }}><X size={14}/></button>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  )
}
