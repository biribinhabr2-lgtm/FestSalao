import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

function getSupabase() {
  if (!supabaseUrl || !supabaseKey) return null
  return createClient(supabaseUrl, supabaseKey)
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' }
  }

  const path = event.path.replace('/.netlify/functions/api', '').replace('/api', '')
  const method = event.httpMethod
  let body = {}
  try { body = JSON.parse(event.body || '{}') } catch (_) {}

  const supabase = getSupabase()

  /* ── Health check ── */
  if (path === '/health' || path === '') {
    return {
      statusCode: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, timestamp: new Date().toISOString() }),
    }
  }

  if (!supabase) {
    return {
      statusCode: 503,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Supabase not configured' }),
    }
  }

  /* ── Auth: verify JWT ── */
  const token = (event.headers.authorization || '').replace('Bearer ', '')
  if (!token) {
    return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Unauthorized' }) }
  }
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
  if (authErr || !user) {
    return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Invalid token' }) }
  }

  /* ── Fetch user profile (to check role) ── */
  const { data: profile } = await supabase.from('usuarios').select('role, empresa_id').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'
  const empresaId = profile?.empresa_id

  try {
    /* ── Users ── */
    if (path === '/users' && method === 'GET') {
      if (!isAdmin) return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: 'Forbidden' }) }
      const { data, error } = await supabase.from('usuarios').select('*').eq('empresa_id', empresaId)
      if (error) throw error
      return { statusCode: 200, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify(data) }
    }

    /* ── Invite user (admin only, uses service key to create auth user) ── */
    if (path === '/invite' && method === 'POST') {
      if (!isAdmin) return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: 'Forbidden' }) }
      const { email, nome, cargo, setor, role } = body
      const { data: authData, error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: { nome, cargo, setor, role, empresa_id: empresaId }
      })
      if (inviteErr) throw inviteErr
      return { statusCode: 200, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true, user: authData.user }) }
    }

    /* ── Financial report (sensitive, admin only) ── */
    if (path === '/relatorio-financeiro' && method === 'GET') {
      if (!isAdmin) return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: 'Forbidden' }) }
      const { data, error } = await supabase
        .from('movimentacoes_caixa')
        .select('*')
        .eq('empresa_id', empresaId)
        .gte('data', body.data_inicio || '2024-01-01')
        .lte('data', body.data_fim || new Date().toISOString().slice(0,10))
      if (error) throw error
      const entradas = data.filter(m=>m.tipo==='entrada').reduce((s,m)=>s+m.valor,0)
      const saidas   = data.filter(m=>m.tipo==='saida').reduce((s,m)=>s+m.valor,0)
      return {
        statusCode: 200,
        headers: { ...CORS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ movimentacoes: data, totais: { entradas, saidas, saldo: entradas - saidas } }),
      }
    }

    return {
      statusCode: 404,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: `Route not found: ${method} ${path}` }),
    }
  } catch (err) {
    console.error('API error:', err)
    return {
      statusCode: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    }
  }
}
