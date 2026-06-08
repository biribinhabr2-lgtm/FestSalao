/**
 * FestEventos — Setup inicial do Supabase
 * Executa: node scripts/setup.mjs
 */

const SUPABASE_URL = 'https://ihueonlyamcjqzfadlif.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlodWVvbmx5YW1janF6ZmFkbGlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDk0NDk2NywiZXhwIjoyMDk2NTIwOTY3fQ.6ICgEStMWzBAG5VVjl23EpzT927ZWEwGSkSg3NI_8yc'

const ADMIN_EMAIL    = 'biribinhabr2@gmail.com'
const ADMIN_PASSWORD = 'guigui99'
const ADMIN_NOME     = 'Administrador'
const EMPRESA_NOME   = 'Brinquedoteca Alegria'

const base = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY }

async function api(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}${path}`, { headers: base, ...opts })
  const text = await res.text()
  let json; try { json = JSON.parse(text) } catch { json = text }
  return { ok: res.ok, status: res.status, data: json }
}

async function main() {
  console.log('🚀 FestEventos — Setup do Supabase\n')

  // ── Passo 1: verificar se o schema foi aplicado ──────────
  console.log('1. Verificando banco de dados...')
  const check = await api('/rest/v1/usuarios?limit=0')

  if (!check.ok) {
    console.log('\n' + '═'.repeat(56))
    console.log('⚠️  SCHEMA NÃO ENCONTRADO')
    console.log('═'.repeat(56))
    console.log('\nA tabela "usuarios" ainda não existe no banco.')
    console.log('Siga estes passos:\n')
    console.log('  1. Acesse: https://supabase.com/dashboard/project/ihueonlyamcjqzfadlif/sql/new')
    console.log('  2. Abra o arquivo: supabase/schema.sql')
    console.log('  3. Cole TODO o conteúdo no editor')
    console.log('  4. Clique em RUN')
    console.log('  5. Execute este script novamente: node scripts/setup.mjs')
    console.log('\n' + '═'.repeat(56))
    process.exit(1)
  }
  console.log('   ✓ Schema encontrado')

  // ── Passo 2: empresa ─────────────────────────────────────
  console.log('\n2. Configurando empresa...')
  let empresaId
  const empRes = await api('/rest/v1/empresas?select=id,nome&limit=1')
  if (empRes.ok && empRes.data.length > 0) {
    empresaId = empRes.data[0].id
    console.log(`   ✓ Empresa: "${empRes.data[0].nome}" (${empresaId})`)
  } else {
    const nova = await api('/rest/v1/empresas', {
      method: 'POST',
      headers: { ...base, 'Prefer': 'return=representation' },
      body: JSON.stringify({ nome: EMPRESA_NOME, segmento: 'Brinquedoteca' }),
    })
    if (!nova.ok) { console.error('   ✗ Erro ao criar empresa:', nova.data); process.exit(1) }
    empresaId = nova.data[0].id
    console.log(`   ✓ Empresa criada: "${EMPRESA_NOME}"`)
  }

  // ── Passo 3: verificar se admin já existe ────────────────
  console.log('\n3. Verificando usuário admin...')
  const listRes = await api('/auth/v1/admin/users?page=1&per_page=50')
  const existingUser = listRes.ok ? listRes.data.users?.find(u => u.email === ADMIN_EMAIL) : null

  let userId
  if (existingUser) {
    userId = existingUser.id
    console.log(`   ✓ Usuário já existe: ${ADMIN_EMAIL} (${userId})`)
  } else {
    console.log(`   Criando usuário: ${ADMIN_EMAIL}...`)

    // Tenta criar passando empresa_id no metadata (necessário para o trigger)
    const createRes = await api('/auth/v1/admin/users', {
      method: 'POST',
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: {
          nome: ADMIN_NOME,
          cargo: 'Administrador',
          setor: 'Gestão',
          role: 'admin',
          empresa_id: empresaId,
        }
      }),
    })

    if (createRes.ok) {
      userId = createRes.data.id
      console.log(`   ✓ Usuário criado: ${ADMIN_EMAIL}`)
    } else {
      // Se falhou, pode ser que o trigger tentou inserir mas empresa_id não estava no contexto
      // Tenta uma segunda vez com approach alternativo
      console.log(`   ⚠️  Tentativa 1 falhou, tentando alternativa...`)

      // Verifica se o usuário foi criado mesmo assim (às vezes falha o trigger mas o user existe)
      const checkAgain = await api('/auth/v1/admin/users?page=1&per_page=50')
      const maybeCreated = checkAgain.ok ? checkAgain.data.users?.find(u => u.email === ADMIN_EMAIL) : null

      if (maybeCreated) {
        userId = maybeCreated.id
        console.log(`   ✓ Usuário encontrado após erro de trigger: ${userId}`)
      } else {
        console.error('\n   ✗ Não foi possível criar o usuário.')
        console.error('   Erro:', JSON.stringify(createRes.data))
        console.error('\n   Possível causa: trigger on_auth_user_created com problema.')
        console.error('   Solução: execute este SQL no Supabase SQL Editor:')
        console.error('\n   DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;')
        console.error('   (depois rode o script de novo)')
        process.exit(1)
      }
    }
  }

  // ── Passo 4: garantir perfil admin na tabela usuarios ────
  console.log('\n4. Configurando perfil admin...')
  const perfilRes = await api(`/rest/v1/usuarios?id=eq.${userId}&select=id,role`)

  if (perfilRes.ok && perfilRes.data.length > 0) {
    // Atualiza para garantir role=admin
    await api(`/rest/v1/usuarios?id=eq.${userId}`, {
      method: 'PATCH',
      headers: { ...base, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ empresa_id: empresaId, nome: ADMIN_NOME, cargo: 'Administrador', setor: 'Gestão', role: 'admin', ativo: true }),
    })
    console.log('   ✓ Perfil atualizado → role: admin')
  } else {
    // Insere manualmente (caso trigger não tenha criado)
    const insertRes = await api('/rest/v1/usuarios', {
      method: 'POST',
      headers: { ...base, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ id: userId, empresa_id: empresaId, nome: ADMIN_NOME, cargo: 'Administrador', setor: 'Gestão', role: 'admin', ativo: true }),
    })
    if (!insertRes.ok) { console.error('   ✗ Erro ao inserir perfil:', insertRes.data); process.exit(1) }
    console.log('   ✓ Perfil admin criado manualmente')
  }

  // ── Sucesso! ─────────────────────────────────────────────
  console.log('\n' + '═'.repeat(56))
  console.log('✅  CONFIGURAÇÃO CONCLUÍDA!\n')
  console.log(`  📧  E-mail : ${ADMIN_EMAIL}`)
  console.log(`  🔑  Senha  : ${ADMIN_PASSWORD}`)
  console.log(`  🏢  Empresa: ${EMPRESA_NOME}`)
  console.log(`  🆔  User ID: ${userId}`)
  console.log('\n  Acesse o sistema e faça login. 🎉')
  console.log('═'.repeat(56))
}

main().catch(e => { console.error('\n❌ Erro fatal:', e.message); process.exit(1) })
