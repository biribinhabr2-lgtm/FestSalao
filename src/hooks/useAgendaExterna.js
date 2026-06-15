/**
 * useAgendaExterna.js — Integração com a API externa de agenda
 * Proxy server-side: /api/agenda-externa (nunca expõe a chave no browser)
 */
import { useState, useEffect, useCallback } from 'react'

const POLL_INTERVAL = 60_000 // atualiza a cada 60s

/* ── Normalização ─────────────────────────────────────────────────────────── */
export function normalizeEventoExterno(ev) {
  const horaFmt = v => v ? String(v).slice(0, 5) : ''

  const customerNome =
    ev.customer?.name || ev.customer?.nome ||
    ev.customer_name  || ev.client_name    || ''

  /* Quando title é null, usa nome do cliente como título */
  const titulo = ev.title || ev.titulo || ev.name || customerNome || '(sem título)'

  const valor        = ev.total_cents   != null ? ev.total_cents   / 100 : Number(ev.valor   || 0)
  const entrada      = ev.deposit_cents != null ? ev.deposit_cents / 100 : 0
  const entradaPaga  = Boolean(ev.deposit_paid)
  /* A API usa guests_count */
  const convidados   = ev.guests_count != null ? Number(ev.guests_count) : Number(ev.guest_count || ev.guests || ev.convidados || 0)
  const criancas     = Number(ev.children_count || ev.children || ev.criancas || 0)

  return {
    id:               `ext_${ev.id}`,
    _externo:         true,
    _ext_id:          ev.id,
    titulo,
    data:             ev.date        || ev.data   || '',
    hora_inicio:      horaFmt(ev.start_time  || ev.hora_inicio),
    hora_fim:         horaFmt(ev.end_time    || ev.hora_fim),
    status:           ev.status      || 'confirmada',
    tipo:             ev.type        || ev.tipo   || ev.category || 'Externo',
    valor,
    entrada,
    entradaPaga,
    descricao:        ev.notes       || ev.description || ev.descricao || '',
    local:            ev.location    || ev.venue        || ev.local    || '',
    tema:             ev.theme       || ev.tema          || '',
    convidados,
    criancas,
    customer_id:      ev.customer?.id   || ev.customer_id   || null,
    customer_nome:    customerNome,
    customer_email:   ev.customer?.email || ev.customer_email || '',
    customer_telefone:ev.customer?.phone || ev.customer_phone || '',
    _raw: ev,
  }
}

/* ── Chamadas HTTP ─────────────────────────────────────────────────────────── */
export async function fetchEventosExternos(from, to) {
  const params = new URLSearchParams({ path: 'events' })
  if (from) params.set('from', from)
  if (to)   params.set('to',   to)
  const res  = await fetch(`/api/agenda-externa?${params}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  const data = await res.json()
  return Array.isArray(data) ? data : (data.events || data.data || [])
}

export async function criarEventoExterno({ titulo, data, hora_inicio, hora_fim, convidados, criancas, customer_id }) {
  const res = await fetch('/api/agenda-externa?path=events', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title:          titulo,
      date:           data,
      start_time:     hora_inicio || undefined,
      end_time:       hora_fim    || undefined,
      guest_count:    convidados  || undefined,
      children_count: criancas    || undefined,
      customer_id:    customer_id || undefined,
    }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || `Erro ${res.status}`)
  return json
}

export async function atualizarEventoExterno(id, changes) {
  const res = await fetch(`/api/agenda-externa?path=events/${id}`, {
    method:  'PATCH',
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
  const res  = await fetch(`/api/agenda-externa?${params}`)
  if (!res.ok) return []
  const data = await res.json()
  return Array.isArray(data) ? data : (data.customers || data.data || [])
}

/* ── Hook com polling ──────────────────────────────────────────────────────── */
export function useEventosExternos(from, to) {
  const [eventos,  setEventos]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [erro,     setErro]     = useState(null)

  const carregar = useCallback(async () => {
    try {
      const raw = await fetchEventosExternos(from, to)
      setEventos(raw.map(normalizeEventoExterno))
      setErro(null)
    } catch (e) {
      setErro(e.message || 'Falha ao conectar com o sistema externo')
    } finally {
      setLoading(false)
    }
  }, [from, to])

  useEffect(() => {
    carregar()
    const id = setInterval(carregar, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [carregar])

  return { eventos, loading, erro, recarregar: carregar }
}

/* ── Alocações de equipe (localStorage) ───────────────────────────────────── */
const LS_ALOC = 'festeventos_alocacoes_ext'

function getAlocacoes() {
  try { return JSON.parse(localStorage.getItem(LS_ALOC) || '{}') } catch { return {} }
}

export function getAlocacao(extId) {
  return getAlocacoes()[extId]?.responsaveis || []
}

export function salvarAlocacao(extId, responsaveis) {
  const all = getAlocacoes()
  all[extId] = { responsaveis }
  localStorage.setItem(LS_ALOC, JSON.stringify(all))
}
