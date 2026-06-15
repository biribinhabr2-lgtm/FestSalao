/**
 * api/agenda-externa.js — Proxy Vercel para a API externa de agenda
 * A chave EXTERNAL_API_KEY fica apenas no servidor (nunca exposta ao browser).
 * Rota: /api/agenda-externa?path=events&from=...&to=...
 *       /api/agenda-externa?path=events/<id>
 *       /api/agenda-externa?path=customers&search=...
 */

const BASE_URL = 'https://mjnjxhtkfmwhzatgpbox.supabase.co/functions/v1/api-v1'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(204).end()

  const apiKey = process.env.EXTERNAL_API_KEY
  if (!apiKey) {
    return res.status(503).json({ error: 'API externa não configurada (EXTERNAL_API_KEY ausente)' })
  }

  // Extrai o sub-path e os query params
  const { path = 'events', ...queryParams } = req.query
  const subPath = Array.isArray(path) ? path.join('/') : path

  const url = new URL(`${BASE_URL}/${subPath}`)
  Object.entries(queryParams).forEach(([k, v]) => {
    if (v) url.searchParams.set(k, v)
  })

  const fetchOpts = {
    method: req.method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  }

  if (req.method === 'POST' || req.method === 'PATCH') {
    fetchOpts.body = JSON.stringify(req.body)
  }

  try {
    const upstream = await fetch(url.toString(), fetchOpts)
    const text = await upstream.text()
    let data
    try { data = JSON.parse(text) } catch { data = { raw: text } }
    return res.status(upstream.status).json(data)
  } catch (err) {
    return res.status(502).json({ error: 'Falha ao contactar API externa: ' + err.message })
  }
}
