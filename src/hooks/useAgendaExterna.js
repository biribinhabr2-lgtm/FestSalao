/**
 * useAgendaExterna.js — Consome a API externa de agenda via proxy /api/agenda-externa
 */

export async function fetchEventosExternos(from, to) {
  const params = new URLSearchParams({ path: 'events' })
  if (from) params.set('from', from)
  if (to)   params.set('to',   to)
  const res = await fetch(`/api/agenda-externa?${params}`)
  if (!res.ok) return []
  const data = await res.json()
  return Array.isArray(data) ? data : (data.events || data.data || [])
}

export async function criarEventoExterno({ titulo, data, customer_id }) {
  const res = await fetch('/api/agenda-externa?path=events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: titulo, date: data, customer_id }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || `Erro ${res.status}`)
  return json
}

export async function atualizarEventoExterno(id, changes) {
  const res = await fetch(`/api/agenda-externa?path=events/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(changes),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || `Erro ${res.status}`)
  return json
}

export async function buscarClientesExternos(search = '') {
  const params = new URLSearchParams({ path: 'customers', limit: '20' })
  if (search) params.set('search', search)
  const res = await fetch(`/api/agenda-externa?${params}`)
  if (!res.ok) return []
  const data = await res.json()
  return Array.isArray(data) ? data : (data.customers || data.data || [])
}

/** Converte evento externo para o formato visual do FestEventos */
export function normalizeEventoExterno(ev) {
  return {
    id:          `ext_${ev.id}`,
    _externo:    true,
    _ext_id:     ev.id,
    titulo:      ev.title || ev.titulo || '(sem título)',
    data:        ev.date  || ev.data   || '',
    hora_inicio: ev.start_time || ev.hora_inicio || '',
    hora_fim:    ev.end_time   || ev.hora_fim    || '',
    status:      ev.status     || 'confirmada',
    tipo:        ev.type       || ev.tipo        || 'Externo',
    valor:       ev.total_cents ? ev.total_cents / 100 : (ev.valor || 0),
    descricao:   ev.notes || ev.descricao || '',
    customer_id: ev.customer_id || null,
  }
}
