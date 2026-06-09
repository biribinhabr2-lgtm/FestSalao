import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  /* CORS */
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, PATCH, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST' && req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' })

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceKey  = process.env.SUPABASE_SERVICE_KEY
  if (!supabaseUrl || !serviceKey) {
    return res.status(503).json({ error: 'Supabase não configurado' })
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  /* Verifica se quem chamou é admin */
  const token = (req.headers.authorization || '').replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Não autenticado' })

  const { data: { user: caller }, error: authErr } = await supabase.auth.getUser(token)
  if (authErr || !caller) return res.status(401).json({ error: 'Token inválido' })

  const { data: callerProfile } = await supabase
    .from('usuarios')
    .select('role, empresa_id')
    .eq('id', caller.id)
    .single()

  if (callerProfile?.role !== 'admin') {
    return res.status(403).json({ error: 'Apenas administradores podem criar usuários' })
  }

  /* ── PATCH: alterar senha de outro usuário ── */
  if (req.method === 'PATCH') {
    const { userId, password: newPassword } = req.body
    if (!userId || !newPassword) return res.status(400).json({ error: 'userId e password são obrigatórios' })
    const { error } = await supabase.auth.admin.updateUserById(userId, { password: newPassword })
    if (error) return res.status(400).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  const { email, password, nome, cargo, setor, role } = req.body
  if (!email || !password || !nome) {
    return res.status(400).json({ error: 'email, password e nome são obrigatórios' })
  }

  /* Cria o usuário via Admin API */
  const { data: authData, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      nome, cargo, setor, role,
      empresa_id: callerProfile.empresa_id,
    },
  })

  if (createErr) return res.status(400).json({ error: createErr.message })

  /* Garante que o perfil está correto (caso trigger não tenha rodado) */
  await supabase
    .from('usuarios')
    .upsert({
      id:         authData.user.id,
      empresa_id: callerProfile.empresa_id,
      email,
      nome, cargo, setor, role,
      ativo: true,
    }, { onConflict: 'id' })

  return res.status(200).json({ ok: true, id: authData.user.id })
}
