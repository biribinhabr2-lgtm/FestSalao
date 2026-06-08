import { useMemo } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Users, PartyPopper, Bell, CheckSquare,
  Clock, Calendar, ChevronRight, TrendingUp, AlertCircle, Loader2
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTable } from '../hooks/useDb'
import { mockEscalas, mockEventos, mockAvisos, mockExecucoes, mockMovimentacoes } from '../data/mockData'

const today = format(new Date(), 'yyyy-MM-dd')

function StatusBadge({ status }) {
  const map = { 'Em andamento':'badge-orange', 'Agendado':'badge-blue', 'Concluído':'badge-green', 'Pendente':'badge-yellow' }
  return <span className={`badge ${map[status]||'badge-gray'}`}>{status}</span>
}

function Avatar({ nome, size = 28 }) {
  const init   = nome?.split(' ').slice(0,2).map(w=>w[0]).join('') || '?'
  const colors = ['#F97316','#0D9488','#3B82F6','#8B5CF6','#EC4899','#10B981']
  const color  = colors[nome?.charCodeAt(0) % colors.length] || '#F97316'
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:color, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*.38, fontWeight:700, flexShrink:0 }}>
      {init}
    </div>
  )
}

export default function Dashboard() {
  const { isAdmin, profile } = useAuth()

  /* Lê dos mesmos stores que as outras páginas usam */
  const { rows: escalas,   loading: l1 } = useTable('escalas',            { seedData: mockEscalas,       orderBy: 'data',       orderAsc: true  })
  const { rows: eventos,   loading: l2 } = useTable('eventos',            { seedData: mockEventos,       orderBy: 'data',       orderAsc: true  })
  const { rows: avisos,    loading: l3 } = useTable('avisos',             { seedData: mockAvisos,        orderBy: 'criado_em',  orderAsc: false })
  const { rows: execucoes, loading: l4 } = useTable('checklist_execucoes',{ seedData: mockExecucoes,     orderBy: 'data',       orderAsc: false })
  const { rows: movs,      loading: l5 } = useTable('movimentacoes_caixa',{ seedData: mockMovimentacoes, orderBy: 'data',       orderAsc: false })

  const loading = l1 || l2 || l3 || l4 || l5

  /* ── Derivações ── */
  const escalasHoje    = useMemo(() => escalas.filter(e => e.data === today), [escalas])
  const eventosHoje    = useMemo(() => eventos.filter(e => e.data === today), [eventos])
  const eventosProximos= useMemo(() => eventos.filter(e => e.data > today && e.status !== 'Concluído').slice(0,4), [eventos])

  /* avisos não lidos — respeita chave local do usuário */
  const lsLidosKey  = `feste_avisos_lidos_${profile?.id||'demo'}`
  function getLidos() { try { return JSON.parse(localStorage.getItem(lsLidosKey)||'[]') } catch { return [] } }
  const avisosNaoLidos = useMemo(() => avisos.filter(a => !a.lido && !getLidos().includes(a.id)), [avisos])

  const checksPendentes= useMemo(() => execucoes.filter(e => e.status !== 'Concluído' && e.data === today), [execucoes])

  /* financeiro do mês */
  const thisMonth = today.slice(0,7)
  const totFin = useMemo(() => {
    const mes = movs.filter(m => m.data?.slice(0,7) === thisMonth)
    const e   = mes.filter(m=>m.tipo==='entrada').reduce((s,m)=>s+Number(m.valor),0)
    const s   = mes.filter(m=>m.tipo==='saida').reduce((s,m)=>s+Number(m.valor),0)
    return { entradas:e, saidas:s, saldo:e-s }
  }, [movs])

  function nomeFuncionario(es) {
    return es.usuarios?.nome || es.funcionario || '?'
  }

  if (loading) return (
    <div className="page" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:300 }}>
      <Loader2 size={28} className="animate-spin" style={{ color:'var(--accent)' }}/>
    </div>
  )

  return (
    <div className="page">
      {/* Saudação */}
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:800, color:'var(--text)' }}>
          Bom dia, {profile?.nome?.split(' ')[0] || 'usuário'} 👋
        </h1>
        <p style={{ fontSize:13.5, color:'var(--text-2)', marginTop:2 }}>
          {format(new Date(), "EEEE, d 'de' MMMM", { locale:ptBR })} — aqui está o resumo do dia
        </p>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon orange"><Users size={20}/></div>
          <div><div className="stat-value">{escalasHoje.length}</div><div className="stat-label">Funcionários hoje</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon teal"><PartyPopper size={20}/></div>
          <div><div className="stat-value">{eventosHoje.length}</div><div className="stat-label">Festas hoje</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow"><Bell size={20}/></div>
          <div><div className="stat-value">{avisosNaoLidos.length}</div><div className="stat-label">Avisos não lidos</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><CheckSquare size={20}/></div>
          <div><div className="stat-value">{checksPendentes.length}</div><div className="stat-label">Checklists pendentes</div></div>
        </div>
      </div>

      <div className="two-col">
        {/* Coluna esquerda */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Agenda do dia */}
          <div className="card">
            <div className="card-header">
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <Calendar size={16} style={{ color:'var(--accent)' }}/>
                <span className="card-title">Agenda do Dia</span>
              </div>
              <span className="badge badge-orange">{format(new Date(),'dd/MM')}</span>
            </div>
            {eventosHoje.length === 0 && escalasHoje.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📅</div>
                <div className="empty-title">Nenhum item hoje</div>
                <div className="empty-desc">Não há festas ou escalas programadas para hoje.</div>
              </div>
            ) : (
              <div>
                {eventosHoje.map(ev => (
                  <div key={ev.id} className="list-item">
                    <div style={{ width:40,height:40,borderRadius:8,background:'var(--accent-light)',color:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0 }}>🎉</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13.5,fontWeight:600 }}>{ev.nome}</div>
                      <div style={{ fontSize:12,color:'var(--text-2)',marginTop:2 }}>{ev.horario_inicio}–{ev.horario_fim}</div>
                    </div>
                    <StatusBadge status={ev.status}/>
                  </div>
                ))}
                {escalasHoje.map(es => (
                  <div key={es.id} className="list-item">
                    <div style={{ width:40,height:40,borderRadius:8,background:'var(--teal-light)',color:'var(--teal)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0 }}>⏰</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13.5,fontWeight:600 }}>{nomeFuncionario(es)}</div>
                      <div style={{ fontSize:12,color:'var(--text-2)',marginTop:2 }}>{es.horario} · {es.setor} · {es.turno}</div>
                    </div>
                    <span className={`badge ${es.tipo==='Evento'?'badge-orange':'badge-teal'}`}>{es.tipo}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Próximos eventos */}
          <div className="card">
            <div className="card-header">
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <PartyPopper size={16} style={{ color:'var(--accent)' }}/>
                <span className="card-title">Próximos Eventos</span>
              </div>
              <a href="/eventos" style={{ fontSize:12,color:'var(--accent)',fontWeight:600 }}>Ver todos</a>
            </div>
            {eventosProximos.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎂</div>
                <div className="empty-title">Sem eventos futuros</div>
              </div>
            ) : (
              <div>
                {eventosProximos.map(ev => (
                  <div key={ev.id} className="list-item">
                    <div style={{ width:38,height:38,borderRadius:8,background:'var(--surface-2)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                      <span style={{ fontSize:10,fontWeight:700,color:'var(--accent)' }}>{format(new Date(ev.data+'T00:00'),'MMM',{locale:ptBR}).toUpperCase()}</span>
                      <span style={{ fontSize:16,fontWeight:800,lineHeight:1,color:'var(--text)' }}>{format(new Date(ev.data+'T00:00'),'dd')}</span>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13.5,fontWeight:600 }}>{ev.nome}</div>
                      <div style={{ fontSize:12,color:'var(--text-2)',marginTop:2 }}>{ev.horario_inicio}–{ev.horario_fim} · {ev.criancas} crianças</div>
                    </div>
                    <span className="badge badge-blue">{ev.tipo}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Checklists pendentes */}
          {checksPendentes.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <AlertCircle size={16} style={{ color:'var(--yellow)' }}/>
                  <span className="card-title">Checklists Pendentes</span>
                </div>
              </div>
              {checksPendentes.map(ex => {
                const itens  = Array.isArray(ex.itens) ? ex.itens : []
                const total  = itens.length
                const feitos = itens.filter(i=>i.feito).length
                const pct    = total > 0 ? Math.round((feitos/total)*100) : 0
                return (
                  <div key={ex.id} className="list-item">
                    <div style={{ width:38,height:38,borderRadius:8,background:'var(--yellow-light)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:18 }}>📋</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13.5,fontWeight:600 }}>{ex.modelo_nome}</div>
                      <div style={{ marginTop:6 }}>
                        <div className="progress-bar"><div className="progress-fill" style={{ width:`${pct}%` }}/></div>
                        <div style={{ fontSize:11,color:'var(--text-3)',marginTop:3 }}>{feitos}/{total} itens · {ex.responsavel}</div>
                      </div>
                    </div>
                    <span style={{ fontSize:14,fontWeight:800,color:pct===100?'var(--green)':'var(--yellow)' }}>{pct}%</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Coluna direita */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Equipe hoje */}
          <div className="card">
            <div className="card-header">
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <Users size={16} style={{ color:'var(--accent)' }}/>
                <span className="card-title">Equipe Hoje</span>
              </div>
              <span className="badge badge-gray">{escalasHoje.length} pessoa(s)</span>
            </div>
            {escalasHoje.length === 0 ? (
              <div className="empty-state" style={{ padding:28 }}>
                <div className="empty-icon">👥</div><div className="empty-title">Ninguém escalado</div>
              </div>
            ) : (
              <div>
                {escalasHoje.map(es => (
                  <div key={es.id} className="list-item">
                    <Avatar nome={nomeFuncionario(es)}/>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13.5,fontWeight:600 }}>{nomeFuncionario(es)}</div>
                      <div style={{ fontSize:11.5,color:'var(--text-2)' }}>{es.horario} · {es.setor}</div>
                    </div>
                    <span className={`badge ${es.turno==='Manhã'?'badge-yellow':es.turno==='Tarde'?'badge-teal':'badge-orange'}`}>{es.turno}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Avisos recentes */}
          <div className="card">
            <div className="card-header">
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <Bell size={16} style={{ color:'var(--accent)' }}/>
                <span className="card-title">Avisos Recentes</span>
              </div>
              {avisosNaoLidos.length > 0 && (
                <span className="badge badge-orange">{avisosNaoLidos.length} novo(s)</span>
              )}
            </div>
            {avisos.length === 0 ? (
              <div className="empty-state" style={{ padding:24 }}>
                <div className="empty-icon">🔔</div><div className="empty-title">Sem avisos</div>
              </div>
            ) : avisos.slice(0,3).map(av => (
              <div key={av.id} className="list-item" style={{ gap:10 }}>
                <div style={{ width:8,height:8,borderRadius:'50%',flexShrink:0,marginTop:4, background:(!av.lido&&!getLidos().includes(av.id))?'var(--accent)':'var(--border-2)' }}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13.5,fontWeight:(!av.lido&&!getLidos().includes(av.id))?600:400,color:(!av.lido&&!getLidos().includes(av.id))?'var(--text)':'var(--text-2)' }}>{av.titulo}</div>
                  <div style={{ fontSize:11.5,color:'var(--text-3)',marginTop:2 }}>{av.destinatarios} · {av.autor}</div>
                </div>
              </div>
            ))}
            <div style={{ padding:'10px 16px', borderTop:'1px solid var(--border)' }}>
              <a href="/avisos" style={{ fontSize:13,color:'var(--accent)',fontWeight:600,display:'flex',alignItems:'center',gap:4 }}>
                Ver todos os avisos <ChevronRight size={14}/>
              </a>
            </div>
          </div>

          {/* Mini financeiro (admin) */}
          {isAdmin && (
            <div className="card">
              <div className="card-header">
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <TrendingUp size={16} style={{ color:'var(--accent)' }}/>
                  <span className="card-title">Financeiro — {format(new Date(),'MMM/yy',{locale:ptBR}).toUpperCase()}</span>
                </div>
              </div>
              <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:13,color:'var(--text-2)' }}>Entradas</span>
                  <span style={{ fontSize:15,fontWeight:700,color:'var(--green)' }}>R$ {totFin.entradas.toLocaleString('pt-BR',{minimumFractionDigits:2})}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:13,color:'var(--text-2)' }}>Saídas</span>
                  <span style={{ fontSize:15,fontWeight:700,color:'var(--red)' }}>R$ {totFin.saidas.toLocaleString('pt-BR',{minimumFractionDigits:2})}</span>
                </div>
                <div className="divider"/>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:13,fontWeight:700 }}>Saldo</span>
                  <span style={{ fontSize:17,fontWeight:800,color:totFin.saldo>=0?'var(--green)':'var(--red)',fontFamily:'var(--font-display)' }}>
                    R$ {totFin.saldo.toLocaleString('pt-BR',{minimumFractionDigits:2})}
                  </span>
                </div>
                <a href="/financeiro" style={{ fontSize:12.5,color:'var(--accent)',fontWeight:600,display:'flex',alignItems:'center',gap:4,marginTop:2 }}>
                  Abrir financeiro <ChevronRight size={13}/>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
