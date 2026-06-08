/**
 * useDb — Camada de dados unificada
 * Modo Supabase: lê/escreve no banco real
 * Modo demo: persiste no localStorage (não perde ao navegar)
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export function isSupabaseMode() {
  const url = import.meta.env.VITE_SUPABASE_URL || ''
  return url.length > 10 && !url.includes('placeholder')
}

/* ── Hook genérico de tabela ── */
export function useTable(tableName, opts = {}) {
  const { profile } = useAuth()
  const {
    select    = '*',
    orderBy   = 'criado_em',
    orderAsc  = false,
    seedData  = [],          // dados iniciais para modo demo
  } = opts

  const lsKey = `feste_${tableName}`
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(true)
  const mode = isSupabaseMode() ? 'supabase' : 'local'

  /* ── Carregar ── */
  const load = useCallback(async () => {
    setLoading(true)

    if (mode === 'local') {
      const saved = localStorage.getItem(lsKey)
      if (saved) {
        try { setRows(JSON.parse(saved)); } catch { setRows(seedData) }
      } else {
        // primeira vez: usa seed e salva
        localStorage.setItem(lsKey, JSON.stringify(seedData))
        setRows(seedData)
      }
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from(tableName)
      .select(select)
      .order(orderBy, { ascending: orderAsc })

    if (!error) setRows(data || [])
    setLoading(false)
  }, [tableName, mode])

  useEffect(() => { load() }, [load])

  /* ── Persistir local ── */
  function saveLocal(next) {
    localStorage.setItem(lsKey, JSON.stringify(next))
    setRows(next)
  }

  /* ── Inserir ── */
  async function add(item) {
    if (mode === 'local') {
      const n = { id: `l_${Date.now()}`, criado_em: new Date().toISOString(), ...item }
      saveLocal([n, ...rows])
      return { data: n, error: null }
    }
    const { data, error } = await supabase
      .from(tableName)
      .insert({ ...item, empresa_id: profile?.empresa_id, criado_por: profile?.id })
      .select(select)
      .single()
    if (!error) setRows(r => [data, ...r])
    return { data, error }
  }

  /* ── Atualizar ── */
  async function update(id, changes) {
    if (mode === 'local') {
      const next = rows.map(r => r.id === id ? { ...r, ...changes } : r)
      saveLocal(next)
      return { data: next.find(r => r.id === id), error: null }
    }
    const { data, error } = await supabase
      .from(tableName)
      .update(changes)
      .eq('id', id)
      .select(select)
      .single()
    if (!error) setRows(r => r.map(x => x.id === id ? data : x))
    return { data, error }
  }

  /* ── Remover ── */
  async function remove(id) {
    if (mode === 'local') {
      saveLocal(rows.filter(r => r.id !== id))
      return { error: null }
    }
    const { error } = await supabase.from(tableName).delete().eq('id', id)
    if (!error) setRows(r => r.filter(x => x.id !== id))
    return { error }
  }

  /* ── Upsert item inline (ex: marcar checklist) ── */
  function patchLocal(id, changes) {
    const next = rows.map(r => r.id === id ? { ...r, ...changes } : r)
    saveLocal(next)
  }

  return { rows, loading, add, update, remove, reload: load, setRows, patchLocal, mode }
}

/* ── Hook de funcionários (lê tabela usuarios) ── */
export function useFuncionarios() {
  const { listLocalUsers } = useAuth()
  const [funcionarios, setFuncionarios] = useState([])
  const [loading, setLoading] = useState(true)
  const mode = isSupabaseMode() ? 'supabase' : 'local'

  useEffect(() => {
    async function load() {
      if (mode === 'local') {
        const users = listLocalUsers().map(u => ({
          id:    u.id,
          nome:  u.profile?.nome  || u.email,
          cargo: u.profile?.cargo || 'Funcionário',
          setor: u.profile?.setor || 'Geral',
          ativo: u.profile?.ativo ?? true,
          role:  u.profile?.role  || 'funcionario',
          email: u.email,
        }))
        setFuncionarios(users.filter(u => u.ativo))
        setLoading(false)
        return
      }
      const { data } = await supabase
        .from('usuarios')
        .select('id, nome, cargo, setor, ativo, role')
        .eq('ativo', true)
        .order('nome')
      setFuncionarios(data || [])
      setLoading(false)
    }
    load()
  }, [mode])

  return { funcionarios, loading }
}
