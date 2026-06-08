import { addDays, subDays, format } from 'date-fns'

const today = new Date()
const fmt = (d, f = 'yyyy-MM-dd') => format(d, f)

export const mockFuncionarios = [
  { id: 'f1', nome: 'Ana Lima',      cargo: 'Monitora',    setor: 'Recreação', ativo: true, avatar: 'AL' },
  { id: 'f2', nome: 'Carlos Souza',  cargo: 'Monitor',     setor: 'Recreação', ativo: true, avatar: 'CS' },
  { id: 'f3', nome: 'Beatriz Melo',  cargo: 'Coordenadora',setor: 'Eventos',   ativo: true, avatar: 'BM' },
  { id: 'f4', nome: 'Diego Nunes',   cargo: 'Auxiliar',    setor: 'Limpeza',   ativo: true, avatar: 'DN' },
  { id: 'f5', nome: 'Fernanda Reis', cargo: 'Recepcionista',setor: 'Recepção', ativo: true, avatar: 'FR' },
  { id: 'f6', nome: 'Lucas Pinto',   cargo: 'Monitor',     setor: 'Recreação', ativo: false, avatar: 'LP' },
]

export const mockEscalas = [
  { id: 'e1', funcionario_id: 'f1', funcionario: 'Ana Lima',      data: fmt(today), turno: 'Manhã',  horario: '08:00–14:00', setor: 'Recreação', tipo: 'Normal' },
  { id: 'e2', funcionario_id: 'f2', funcionario: 'Carlos Souza',  data: fmt(today), turno: 'Tarde',  horario: '14:00–20:00', setor: 'Recreação', tipo: 'Normal' },
  { id: 'e3', funcionario_id: 'f3', funcionario: 'Beatriz Melo',  data: fmt(today), turno: 'Integral',horario: '10:00–18:00',setor: 'Eventos',   tipo: 'Evento' },
  { id: 'e4', funcionario_id: 'f5', funcionario: 'Fernanda Reis', data: fmt(today), turno: 'Manhã',  horario: '08:00–14:00', setor: 'Recepção',  tipo: 'Normal' },
  { id: 'e5', funcionario_id: 'f1', funcionario: 'Ana Lima',      data: fmt(addDays(today,1)), turno: 'Tarde', horario: '14:00–20:00', setor: 'Recreação', tipo: 'Normal' },
  { id: 'e6', funcionario_id: 'f4', funcionario: 'Diego Nunes',   data: fmt(addDays(today,1)), turno: 'Manhã', horario: '07:00–13:00', setor: 'Limpeza',   tipo: 'Normal' },
  { id: 'e7', funcionario_id: 'f2', funcionario: 'Carlos Souza',  data: fmt(subDays(today,1)), turno: 'Manhã', horario: '08:00–14:00', setor: 'Recreação', tipo: 'Abertura' },
  { id: 'e8', funcionario_id: 'f3', funcionario: 'Beatriz Melo',  data: fmt(addDays(today,3)), turno: 'Integral', horario: '10:00–20:00', setor: 'Eventos', tipo: 'Evento' },
]

export const mockEventos = [
  {
    id: 'ev1',
    nome: 'Festa da Sofia',
    data: fmt(today),
    horario_prep: '09:00', horario_inicio: '10:00', horario_fim: '13:00',
    responsavel: 'Beatriz Melo',
    status: 'Em andamento',
    tipo: 'Aniversário',
    criancas: 25,
    observacoes: 'Tema: Frozen. Bolo encomendado na confeitaria da esquina.',
    responsaveis: ['Beatriz Melo', 'Ana Lima'],
  },
  {
    id: 'ev2',
    nome: 'Festa do Gabriel',
    data: fmt(addDays(today, 2)),
    horario_prep: '13:00', horario_inicio: '14:00', horario_fim: '17:00',
    responsavel: 'Beatriz Melo',
    status: 'Agendado',
    tipo: 'Aniversário',
    criancas: 30,
    observacoes: 'Tema: Dinossauros. Solicitar balões extras.',
    responsaveis: ['Beatriz Melo', 'Carlos Souza'],
  },
  {
    id: 'ev3',
    nome: 'Festa da Valentina',
    data: fmt(addDays(today, 5)),
    horario_prep: '09:30', horario_inicio: '10:30', horario_fim: '13:30',
    responsavel: 'Ana Lima',
    status: 'Agendado',
    tipo: 'Aniversário',
    criancas: 20,
    observacoes: 'Tema: Sereia. Confirmar decoração.',
    responsaveis: ['Ana Lima'],
  },
  {
    id: 'ev4',
    nome: 'Evento Escola Municipal',
    data: fmt(addDays(today, 7)),
    horario_prep: '08:00', horario_inicio: '09:00', horario_fim: '12:00',
    responsavel: 'Beatriz Melo',
    status: 'Agendado',
    tipo: 'Corporativo',
    criancas: 60,
    observacoes: 'Visita de turma escolar. Atividades pedagógicas.',
    responsaveis: ['Beatriz Melo', 'Ana Lima', 'Carlos Souza'],
  },
  {
    id: 'ev5',
    nome: 'Festa do Theo',
    data: fmt(subDays(today, 3)),
    horario_prep: '14:00', horario_inicio: '15:00', horario_fim: '18:00',
    responsavel: 'Carlos Souza',
    status: 'Concluído',
    tipo: 'Aniversário',
    criancas: 18,
    observacoes: 'Tema: Carros.',
    responsaveis: ['Carlos Souza'],
  },
]

export const mockAvisos = [
  {
    id: 'av1',
    titulo: 'Reunião de equipe — Quinta-feira',
    mensagem: 'Lembramos que haverá reunião de equipe na quinta-feira às 18h30, após o expediente. Presença obrigatória de todos os monitores. Pauta: procedimentos de segurança e novidades para o próximo mês.',
    tipo: 'Geral',
    autor: 'Admin Demo',
    criado_em: fmt(subDays(today, 1), "yyyy-MM-dd'T'HH:mm"),
    expira_em: fmt(addDays(today, 5), 'yyyy-MM-dd'),
    destinatarios: 'Todos',
    lido: false,
    prioridade: 'alta',
  },
  {
    id: 'av2',
    titulo: 'Novo protocolo de limpeza dos brinquedos',
    mensagem: 'A partir de hoje, o protocolo de higienização dos brinquedos muda. Utilize agora o produto XY diluído a 1:10 e deixe agir por 5 minutos antes de enxaguar. O checklist foi atualizado.',
    tipo: 'Setor',
    autor: 'Admin Demo',
    criado_em: fmt(subDays(today, 2), "yyyy-MM-dd'T'HH:mm"),
    expira_em: null,
    destinatarios: 'Limpeza',
    lido: true,
    prioridade: 'normal',
  },
  {
    id: 'av3',
    titulo: 'Uniforme obrigatório a partir de segunda',
    mensagem: 'A partir da próxima segunda-feira o uso do uniforme completo é obrigatório durante todo o expediente. Camiseta laranja + calça ou bermuda preta. Em caso de dúvidas fale com a coordenação.',
    tipo: 'Geral',
    autor: 'Admin Demo',
    criado_em: fmt(subDays(today, 4), "yyyy-MM-dd'T'HH:mm"),
    expira_em: null,
    destinatarios: 'Todos',
    lido: false,
    prioridade: 'normal',
  },
  {
    id: 'av4',
    titulo: 'Escala de abertura aos sábados — rodízio',
    mensagem: 'O rodízio de abertura dos sábados foi atualizado. Consulte a nova escala na aba Escalas. O responsável pela abertura deverá chegar às 07h30.',
    tipo: 'Cargo',
    autor: 'Admin Demo',
    criado_em: fmt(subDays(today, 5), "yyyy-MM-dd'T'HH:mm"),
    expira_em: fmt(addDays(today, 30), 'yyyy-MM-dd'),
    destinatarios: 'Monitores',
    lido: true,
    prioridade: 'normal',
  },
]

export const mockChecklistModelos = [
  {
    id: 'cm1',
    nome: 'Abertura Diária',
    setor: 'Geral',
    recorrencia: 'Diária',
    itens: [
      { id: 'i1', descricao: 'Ligar luzes e ar-condicionado', obrigatorio: true },
      { id: 'i2', descricao: 'Conferir brinquedos e equipamentos', obrigatorio: true },
      { id: 'i3', descricao: 'Verificar limpeza e organização do espaço', obrigatorio: true },
      { id: 'i4', descricao: 'Checar estoque de materiais de limpeza', obrigatorio: false },
      { id: 'i5', descricao: 'Ligar o sistema de música', obrigatorio: false },
      { id: 'i6', descricao: 'Conferir caixa de primeiros socorros', obrigatorio: true },
    ]
  },
  {
    id: 'cm2',
    nome: 'Higienização Brinquedos',
    setor: 'Limpeza',
    recorrencia: 'Diária',
    itens: [
      { id: 'i7', descricao: 'Higienizar escorregadores', obrigatorio: true },
      { id: 'i8', descricao: 'Limpar piscina de bolinhas', obrigatorio: true },
      { id: 'i9', descricao: 'Desinfetar balanços e gangorras', obrigatorio: true },
      { id: 'i10', descricao: 'Higienizar brinquedos plásticos pequenos', obrigatorio: true },
      { id: 'i11', descricao: 'Lavar tapetes e almofadas', obrigatorio: false },
    ]
  },
  {
    id: 'cm3',
    nome: 'Preparação de Festa',
    setor: 'Eventos',
    recorrencia: 'Por evento',
    itens: [
      { id: 'i12', descricao: 'Montar decoração conforme tema', obrigatorio: true },
      { id: 'i13', descricao: 'Organizar mesas e cadeiras', obrigatorio: true },
      { id: 'i14', descricao: 'Verificar utensílios e louças', obrigatorio: true },
      { id: 'i15', descricao: 'Testar microfone e caixas de som', obrigatorio: false },
      { id: 'i16', descricao: 'Preparar área kids para o evento', obrigatorio: true },
      { id: 'i17', descricao: 'Checar banheiros e trocar toalhas', obrigatorio: true },
    ]
  },
  {
    id: 'cm4',
    nome: 'Limpeza Semanal',
    setor: 'Limpeza',
    recorrencia: 'Semanal',
    itens: [
      { id: 'i18', descricao: 'Lavar pisos com produto específico', obrigatorio: true },
      { id: 'i19', descricao: 'Limpar vidros e espelhos', obrigatorio: true },
      { id: 'i20', descricao: 'Desinfetar banheiros completamente', obrigatorio: true },
      { id: 'i21', descricao: 'Organizar depósito de materiais', obrigatorio: false },
      { id: 'i22', descricao: 'Revisar estoque e fazer pedidos', obrigatorio: false },
    ]
  },
]

export const mockExecucoes = [
  {
    id: 'ex1',
    modelo_id: 'cm1',
    modelo_nome: 'Abertura Diária',
    data: fmt(today),
    responsavel: 'Ana Lima',
    funcionario_id: 'f1',
    status: 'Em andamento',
    itens: [
      { id: 'i1', descricao: 'Ligar luzes e ar-condicionado', feito: true, obrigatorio: true },
      { id: 'i2', descricao: 'Conferir brinquedos e equipamentos', feito: true, obrigatorio: true },
      { id: 'i3', descricao: 'Verificar limpeza e organização do espaço', feito: false, obrigatorio: true },
      { id: 'i4', descricao: 'Checar estoque de materiais de limpeza', feito: false, obrigatorio: false },
      { id: 'i5', descricao: 'Ligar o sistema de música', feito: true, obrigatorio: false },
      { id: 'i6', descricao: 'Conferir caixa de primeiros socorros', feito: false, obrigatorio: true },
    ]
  },
  {
    id: 'ex2',
    modelo_id: 'cm2',
    modelo_nome: 'Higienização Brinquedos',
    data: fmt(today),
    responsavel: 'Diego Nunes',
    funcionario_id: 'f4',
    status: 'Pendente',
    itens: [
      { id: 'i7', descricao: 'Higienizar escorregadores', feito: false, obrigatorio: true },
      { id: 'i8', descricao: 'Limpar piscina de bolinhas', feito: false, obrigatorio: true },
      { id: 'i9', descricao: 'Desinfetar balanços e gangorras', feito: false, obrigatorio: true },
      { id: 'i10', descricao: 'Higienizar brinquedos plásticos pequenos', feito: false, obrigatorio: true },
      { id: 'i11', descricao: 'Lavar tapetes e almofadas', feito: false, obrigatorio: false },
    ]
  },
  {
    id: 'ex3',
    modelo_id: 'cm1',
    modelo_nome: 'Abertura Diária',
    data: fmt(subDays(today, 1)),
    responsavel: 'Carlos Souza',
    funcionario_id: 'f2',
    status: 'Concluído',
    itens: [
      { id: 'i1', descricao: 'Ligar luzes e ar-condicionado', feito: true, obrigatorio: true },
      { id: 'i2', descricao: 'Conferir brinquedos e equipamentos', feito: true, obrigatorio: true },
      { id: 'i3', descricao: 'Verificar limpeza e organização do espaço', feito: true, obrigatorio: true },
      { id: 'i4', descricao: 'Checar estoque de materiais de limpeza', feito: true, obrigatorio: false },
      { id: 'i5', descricao: 'Ligar o sistema de música', feito: true, obrigatorio: false },
      { id: 'i6', descricao: 'Conferir caixa de primeiros socorros', feito: true, obrigatorio: true },
    ]
  },
]

export const mockMovimentacoes = [
  { id: 'm1', tipo: 'entrada', descricao: 'Festa Sofia — pacote premium', categoria: 'Festas', valor: 1200, data: fmt(today), usuario: 'Admin Demo' },
  { id: 'm2', tipo: 'entrada', descricao: 'Diárias de recreação', categoria: 'Diária', valor: 340, data: fmt(today), usuario: 'Admin Demo' },
  { id: 'm3', tipo: 'saida',   descricao: 'Reposição de materiais de limpeza', categoria: 'Insumos', valor: 87.50, data: fmt(today), usuario: 'Admin Demo' },
  { id: 'm4', tipo: 'entrada', descricao: 'Festa Gabriel — depósito', categoria: 'Festas', valor: 600, data: fmt(subDays(today,1)), usuario: 'Admin Demo' },
  { id: 'm5', tipo: 'saida',   descricao: 'Pagamento fornecedor balões', categoria: 'Fornecedores', valor: 145, data: fmt(subDays(today,1)), usuario: 'Admin Demo' },
  { id: 'm6', tipo: 'saida',   descricao: 'Vale transporte funcionários', categoria: 'RH', valor: 320, data: fmt(subDays(today,2)), usuario: 'Admin Demo' },
  { id: 'm7', tipo: 'entrada', descricao: 'Escola municipal — evento', categoria: 'Eventos', valor: 2500, data: fmt(subDays(today,2)), usuario: 'Admin Demo' },
  { id: 'm8', tipo: 'saida',   descricao: 'Manutenção escorregador', categoria: 'Manutenção', valor: 180, data: fmt(subDays(today,3)), usuario: 'Admin Demo' },
  { id: 'm9', tipo: 'entrada', descricao: 'Festa Valentina — sinal', categoria: 'Festas', valor: 400, data: fmt(subDays(today,3)), usuario: 'Admin Demo' },
  { id: 'm10', tipo: 'saida',  descricao: 'Material de escritório', categoria: 'Administrativo', valor: 56, data: fmt(subDays(today,4)), usuario: 'Admin Demo' },
]

export const mockCategorias = [
  { id: 'c1', nome: 'Festas',         tipo: 'entrada', cor: '#F97316' },
  { id: 'c2', nome: 'Diária',         tipo: 'entrada', cor: '#10B981' },
  { id: 'c3', nome: 'Eventos',        tipo: 'entrada', cor: '#3B82F6' },
  { id: 'c4', nome: 'Insumos',        tipo: 'saida',   cor: '#EF4444' },
  { id: 'c5', nome: 'Fornecedores',   tipo: 'saida',   cor: '#8B5CF6' },
  { id: 'c6', nome: 'RH',             tipo: 'saida',   cor: '#EC4899' },
  { id: 'c7', nome: 'Manutenção',     tipo: 'saida',   cor: '#F59E0B' },
  { id: 'c8', nome: 'Administrativo', tipo: 'saida',   cor: '#6B7280' },
]
