import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { Plus, TrendingUp, TrendingDown, DollarSign, Trash2, Loader2 } from 'lucide-react'
import Modal from '../components/ui/Modal'
import { useToast } from '../components/ui/Toast'
import { useTable } from '../hooks/useDb'
import { mockMovimentacoes, mockCategorias } from '../data/mockData'

const today     = format(new Date(), 'yyyy-MM-dd')
const thisMonth = format(new Date(), 'yyyy-MM')

export default function Financeiro() {
  const toast = useToast()
  const { rows: movs, loading, add, remove } = useTable('movimentacoes_caixa', {
    seedData: mockMovimentacoes,
    orderBy: 'data',
    orderAsc: false,
  })

  const [modalOpen, setModalOpen]     = useState(false)
  const [filterMes, setFilterMes]     = useState(thisMonth)
  const [filterTipo, setFilterTipo]   = useState('')
  const [filterCat, setFilterCat]     = useState('')
  const emptyForm = { tipo:'entrada', descricao:'', categoria:'Festas', valor:'', data:today, obs:'' }
  const [form, setForm] = useState(emptyForm)

  const filtered = movs.filter(m => {
    if (filterMes  && m.data.slice(0,7) !== filterMes)  return false
    if (filterTipo && m.tipo !== filterTipo)              return false
    if (filterCat  && m.categoria !== filterCat)         return false
    return true
  }).sort((a,b) => b.data.localeCompare(a.data))

  const totals = useMemo(() => {
    const e = filtered.filter(m=>m.tipo==='entrada').reduce((s,m)=>s+Number(m.valor),0)
    const s = filtered.filter(m=>m.tipo==='saida').reduce((s,m)=>s+Number(m.valor),0)
    return { entradas:e, saidas:s, saldo:e-s }
  }, [filtered])

  const byCategoria = useMemo(() => {
    const map = {}
    filtered.forEach(m => {
      if (!map[m.categoria]) map[m.categoria] = { nome:m.categoria, total:0, tipo:m.tipo, count:0 }
      map[m.categoria].total += Number(m.valor)
      map[m.categoria].count++
    })
    return Object.values(map).sort((a,b)=>b.total-a.total)
  }, [filtered])

  async function handleSave() {
    if (!form.descricao || !form.valor || !form.data) { toast.error('Preencha todos os campos'); return }
    const { error } = await add({ ...form, valor: parseFloat(form.valor) })
    if (error) { toast.error('Erro: '+error.message); return }
    toast.success('Movimentação registrada!')
    setForm(emptyForm)
    setModalOpen(false)
  }

  async function handleDelete(id) {
    if (!confirm('Excluir esta movimentação?')) return
    const { error } = await remove(id)
    if (error) { toast.error('Erro: '+error.message); return }
    toast.success('Movimentação excluída.')
  }

  const fmt2 = v => `R$ ${Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2})}`

  if (loading) return (
    <div className="page" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:300 }}>
      <Loader2 size={28} className="animate-spin" style={{ color:'var(--accent)' }}/>
    </div>
  )

  return (
    <div className="page">
      <div className="page-header">
        <div><h1 className="page-title">Financeiro</h1><p className="page-subtitle">Controle de caixa e movimentações</p></div>
        <button className="btn btn-primary btn-sm" onClick={()=>{setForm(emptyForm);setModalOpen(true)}}>
          <Plus size={14}/> Nova Movimentação
        </button>
      </div>

      {/* Resumo */}
      <div className="stat-grid" style={{ gridTemplateColumns:'repeat(3,1fr)', marginBottom:20 }}>
        <div className="stat-card" style={{ borderTop:'3px solid var(--green)' }}>
          <div className="stat-icon green"><TrendingUp size={20}/></div>
          <div><div className="stat-value" style={{ color:'var(--green)',fontSize:22 }}>{fmt2(totals.entradas)}</div><div className="stat-label">Entradas</div></div>
        </div>
        <div className="stat-card" style={{ borderTop:'3px solid var(--red)' }}>
          <div className="stat-icon red"><TrendingDown size={20}/></div>
          <div><div className="stat-value" style={{ color:'var(--red)',fontSize:22 }}>{fmt2(totals.saidas)}</div><div className="stat-label">Saídas</div></div>
        </div>
        <div className="stat-card" style={{ borderTop:`3px solid ${totals.saldo>=0?'var(--green)':'var(--red)'}` }}>
          <div className={`stat-icon ${totals.saldo>=0?'green':'red'}`}><DollarSign size={20}/></div>
          <div><div className="stat-value" style={{ color:totals.saldo>=0?'var(--green)':'var(--red)',fontSize:22 }}>{fmt2(totals.saldo)}</div><div className="stat-label">Saldo</div></div>
        </div>
      </div>

      <div className="two-col">
        {/* Transações */}
        <div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
            <input type="month" className="form-input" style={{ width:'auto' }} value={filterMes} onChange={e=>setFilterMes(e.target.value)}/>
            <select className="form-input form-select" style={{ width:'auto' }} value={filterTipo} onChange={e=>setFilterTipo(e.target.value)}>
              <option value="">Entradas + Saídas</option>
              <option value="entrada">Só entradas</option>
              <option value="saida">Só saídas</option>
            </select>
            <select className="form-input form-select" style={{ width:'auto' }} value={filterCat} onChange={e=>setFilterCat(e.target.value)}>
              <option value="">Todas categorias</option>
              {mockCategorias.map(c=><option key={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div className="card">
            {filtered.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">💰</div><div className="empty-title">Nenhuma movimentação</div></div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Descrição</th><th>Categoria</th><th>Data</th><th style={{ textAlign:'right' }}>Valor</th><th style={{ width:50 }}></th></tr></thead>
                  <tbody>
                    {filtered.map(m=>(
                      <tr key={m.id}>
                        <td>
                          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                            <div style={{ width:28,height:28,borderRadius:6,flexShrink:0,background:m.tipo==='entrada'?'var(--green-light)':'var(--red-light)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13 }}>{m.tipo==='entrada'?'↑':'↓'}</div>
                            <span style={{ fontSize:13.5,fontWeight:500 }}>{m.descricao}</span>
                          </div>
                        </td>
                        <td><span className="badge badge-gray" style={{ fontSize:11 }}>{m.categoria}</span></td>
                        <td style={{ fontSize:13,color:'var(--text-2)' }}>{format(new Date(m.data+'T00:00'),'dd/MM/yy')}</td>
                        <td style={{ textAlign:'right',fontWeight:700,fontSize:14,color:m.tipo==='entrada'?'var(--green)':'var(--red)' }}>
                          {m.tipo==='entrada'?'+':'-'}{fmt2(m.valor).replace('R$ ','')}
                        </td>
                        <td><button className="btn btn-icon btn-danger btn-sm" onClick={()=>handleDelete(m.id)}><Trash2 size={12}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Por categoria + Fechamento */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="card">
            <div className="card-header"><span className="card-title">Por Categoria</span></div>
            <div style={{ padding:'8px 0' }}>
              {byCategoria.length === 0 ? (
                <div style={{ padding:'20px',textAlign:'center',color:'var(--text-3)',fontSize:13 }}>Nenhum dado</div>
              ) : byCategoria.map(cat => {
                const maxVal = Math.max(...byCategoria.map(c=>c.total))
                return (
                  <div key={cat.nome} style={{ padding:'10px 20px', borderBottom:'1px solid var(--border)' }}>
                    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5 }}>
                      <span style={{ fontSize:13,fontWeight:600 }}>{cat.nome}</span>
                      <span style={{ fontSize:13,fontWeight:700,color:cat.tipo==='entrada'?'var(--green)':'var(--red)' }}>{fmt2(cat.total)}</span>
                    </div>
                    <div className="progress-bar"><div className="progress-fill" style={{ width:`${(cat.total/maxVal)*100}%`,background:cat.tipo==='saida'?'var(--red)':undefined }}/></div>
                    <div style={{ fontSize:11,color:'var(--text-3)',marginTop:3 }}>{cat.count} movimentação(ões)</div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Fechamento de Caixa</span></div>
            <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:10 }}>
              <div className="form-group"><label className="form-label">Saldo físico conferido</label><input type="number" step="0.01" className="form-input" placeholder="0,00"/></div>
              <div className="form-group"><label className="form-label">Observações</label><textarea className="form-input" style={{ minHeight:60 }} placeholder="Divergências…"/></div>
              <button className="btn btn-primary btn-sm" onClick={()=>toast.success('Fechamento registrado!')}>Registrar Fechamento</button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={()=>setModalOpen(false)} title="Nova Movimentação"
        footer={<><button className="btn btn-secondary btn-sm" onClick={()=>setModalOpen(false)}>Cancelar</button><button className="btn btn-primary btn-sm" onClick={handleSave}>Registrar</button></>}>
        <div style={{ display:'flex',gap:8,marginBottom:8 }}>
          {['entrada','saida'].map(t=>(
            <button key={t} type="button" className={`btn btn-sm ${form.tipo===t?'btn-primary':'btn-secondary'}`}
              style={{ flex:1,justifyContent:'center',background:form.tipo===t?(t==='entrada'?'var(--green)':'var(--red)'):undefined,borderColor:form.tipo===t?(t==='entrada'?'var(--green)':'var(--red)'):undefined }}
              onClick={()=>setForm(f=>({...f,tipo:t}))}>
              {t==='entrada'?'↑ Entrada':'↓ Saída'}
            </button>
          ))}
        </div>
        <div className="form-group"><label className="form-label">Descrição <span>*</span></label><input className="form-input" placeholder="Ex: Festa Sofia" value={form.descricao} onChange={e=>setForm(f=>({...f,descricao:e.target.value}))}/></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Valor (R$) <span>*</span></label><input type="number" step="0.01" min="0" className="form-input" placeholder="0,00" value={form.valor} onChange={e=>setForm(f=>({...f,valor:e.target.value}))}/></div>
          <div className="form-group"><label className="form-label">Data <span>*</span></label><input type="date" className="form-input" value={form.data} onChange={e=>setForm(f=>({...f,data:e.target.value}))}/></div>
        </div>
        <div className="form-group"><label className="form-label">Categoria</label><select className="form-input form-select" value={form.categoria} onChange={e=>setForm(f=>({...f,categoria:e.target.value}))}>{mockCategorias.map(c=><option key={c.id}>{c.nome}</option>)}</select></div>
        <div className="form-group"><label className="form-label">Observações</label><textarea className="form-input" style={{ minHeight:60 }} value={form.obs} onChange={e=>setForm(f=>({...f,obs:e.target.value}))}/></div>
      </Modal>
    </div>
  )
}
