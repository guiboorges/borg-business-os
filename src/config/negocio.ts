/**
 * O negócio que os 6 agentes servem.
 *
 * Para adaptar o BORG OS a outro negócio, edite SÓ este ficheiro: os agentes leem daqui
 * o contexto, o público, o preço, a meta e as notas-âncora do vault Obsidian.
 *
 * Os valores abaixo são de um negócio FICTÍCIO de exemplo ("Lumen").
 * Este ficheiro entra no system prompt (bloco estável), por isso não ponha aqui datas
 * ou números que mudam todos os dias — esses vêm das tools de dados.
 */
export const NEGOCIO = {
  nome: "Lumen",
  oQueE:
    "uma app de reservas para pequenos estúdios de yoga e pilates: o aluno reserva e paga num toque; o estúdio gere turmas, lista de espera e pacotes de aulas",
  clientes: "estúdios de yoga e pilates com 1 a 3 salas",
  nichos: "estúdios de yoga, pilates e dança",
  canalPrincipal: "Instagram",
  modelo: "subscrição mensal por estúdio",
  ticketMensal: "€49/mês",
  fase: "fase de aquisição dos primeiros clientes",
  equipa: "um único fundador",
  alternativas: "WhatsApp manual, folhas de Excel e agendadores genéricos",
  diferencial:
    "feito para estúdios pequenos + configurado por nós num dia + lembretes automáticos que reduzem as faltas",
  problemaDoCliente: "perco horas a responder a reservas no WhatsApp e os alunos faltam sem avisar",
  dorQuantificavel: "faltas por mês × preço da aula",
  pesquisaComIntencao: "software de reservas para estúdio de yoga",
  metaDoAno: "30 estúdios pagantes com MRR de €1.500 até dezembro",
  metaCurta: "MRR €1.500 até dezembro",
  correAds: false,
  idioma: "português (pt-PT)",

  // Notas do vault Obsidian que cada agente lê primeiro (caminhos relativos ao vault).
  notas: {
    visaoGeral: "00 - Contexto/MASTER-CONTEXT.md",
    metas: "00 - Contexto/Metas.md",
    decisoes: "00 - Contexto/Decisoes",
    estrategia: "01 - Estrategia",
    marca: "03 - Marketing/Posicionamento.md",
    site: "03 - Marketing/Site.md",
  },
} as const;

/** Bases de conhecimento partilhadas por todos os agentes (copiadas para o vault por `npm run seed:knowledge`). */
export const CONHECIMENTO = [
  "09 - Agentes/Conhecimento/g4-metodologia-completa.md",
  "09 - Agentes/Conhecimento/frameworks-por-agente.md",
];
