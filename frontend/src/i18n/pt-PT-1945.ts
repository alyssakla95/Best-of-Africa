/**
 * Portuguese (Portugal), orthography preceding the 1990 agreement.
 *
 * This catalogue is application source. It is deliberately independent of
 * the publication translation service and must remain reviewable in Git.
 */
export const PORTUGUESE_LOCALE = 'pt-PT';
export const PORTUGUESE_ORTHOGRAPHY = '1945';

type OrthographyReplacement = readonly [RegExp, string | ((substring: string, ...args: string[]) => string)];

const ORTHOGRAPHY_REPLACEMENTS: ReadonlyArray<OrthographyReplacement> = [
  [/\bsetor(es|ial|iais)?\b/gi, (value: string) => value.replace(/setor/gi, 'sector')],
  [/\batividade(s)?\b/gi, (value: string) => value.replace(/atividade/gi, 'actividade')],
  [/\bativo(s|a|as)?\b/gi, (value: string) => value.replace(/ativo/gi, 'activo')],
  [/\batual(mente|ização|izações|izado|izada|izados|izadas)?\b/gi, (value: string) => value.replace(/atual/gi, 'actual')],
  [/\bprojeto(s)?\b/gi, (value: string) => value.replace(/projeto/gi, 'projecto')],
  [/\bobjetivo(s)?\b/gi, (value: string) => value.replace(/objetivo/gi, 'objectivo')],
  [/\bperspetiva(s)?\b/gi, (value: string) => value.replace(/perspetiva/gi, 'perspectiva')],
  [/\bdiretor(es|a|as)?\b/gi, (value: string) => value.replace(/diretor/gi, 'director')],
  [/\bdireção\b/gi, 'direcção'],
  [/\bseleção\b/gi, 'selecção'],
  [/\bproteção\b/gi, 'protecção'],
  [/\bcoleção\b/gi, 'colecção'],
  [/\binteração\b/gi, 'interacção'],
  [/\btransação\b/gi, 'transacção'],
  [/\badoção\b/gi, 'adopção'],
  [/\bação\b/gi, 'acção'],
  [/\bações\b/gi, 'acções'],
  [/\bfato(s)?\b/gi, 'facto$1'],
  [/\bcontato(s)?\b/gi, 'contacto$1'],
  [/\binfraestrutura(s)?\b/gi, 'infra-estrutura$1'],
  [/\beconômic([oa]s?)\b/gi, 'económic$1'],
  [/\bacadêmic([oa]s?)\b/gi, 'académic$1'],
  [/\bprêmio(s)?\b/gi, 'prémio$1'],
  [/\bplanejamento\b/gi, 'planeamento'],
  [/\bgerenciamento\b/gi, 'gestão'],
  [/\bgovernança\b/gi, 'governação'],
  [/\bdemanda(s)?\b/gi, 'procura$1'],
  [/\bequipe(s)?\b/gi, 'equipa$1'],
  [/\busuários\b/gi, 'utilizadores'],
  [/\busuário\b/gi, 'utilizador'],
  [/\btrilhão\b/gi, 'bilião'],
  [/\btrilhões\b/gi, 'biliões'],
  [/\bbilhão\b/gi, 'mil milhões'],
  [/\bbilhões\b/gi, 'mil milhões'],
  [/\bônibus\b/gi, 'autocarro'],
  [/\btrens\b/gi, 'comboios'],
  [/\btrem\b/gi, 'comboio'],
  [/\bcelulares\b/gi, 'telemóveis'],
  [/\bcelular\b/gi, 'telemóvel'],
  [/\bcaminhões\b/gi, 'camiões'],
  [/\bcaminhão\b/gi, 'camião'],
  [/\bem uma\b/gi, (value: string) => /^[A-Z]/.test(value) ? 'Numa' : 'numa'],
  [/\bem um\b/gi, (value: string) => /^[A-Z]/.test(value) ? 'Num' : 'num'],
  [/\bótim([oa]s?)\b/gi, 'óptim$1'],
];

export function applyPortuguese1945Orthography(value: string): string {
  return ORTHOGRAPHY_REPLACEMENTS.reduce(
    (result, [pattern, replacement]) => typeof replacement === 'string'
      ? result.replace(pattern, replacement)
      : result.replace(pattern, replacement),
    value,
  );
}

/**
 * Source-owned copy that still appears directly in routed components. Keyed
 * strings are supplied by dict.ts; these exact phrases cover the evidence
 * dashboards and shared asynchronous states while those components are moved
 * to explicit translation keys.
 */
export const PORTUGUESE_INTERFACE_PHRASES: Readonly<Record<string, string>> = {
  'Loading the complete evidence ledger': 'A carregar o registo completo de evidência',
  'Evidence-ledger request interrupted': 'Pedido do registo de evidência interrompido',
  'The official performance record is available, but the publishing ledger did not load.': 'O registo oficial de desempenho está disponível, mas não foi possível carregar o registo de publicações.',
  'Retry this independent request without reloading the sector-performance evidence already on the page.': 'Repita este pedido independente sem voltar a carregar a evidência de desempenho sectorial já apresentada na página.',
  'Retry evidence ledger': 'Repetir o pedido do registo de evidência',
  'Download sector evidence': 'Descarregar a evidência sectorial',
  'Download regional evidence': 'Descarregar a evidência regional',
  'Source breadth and concentration': 'Amplitude e concentração das fontes',
  'Publisher breadth, authority and concentration are shown separately from story volume. The concentration readings make an imbalanced evidence window visible instead of allowing a long source list to conceal it.': 'A diversidade, a autoridade e a concentração dos editores são apresentadas separadamente do volume de publicações. As medidas de concentração tornam visível um conjunto de evidência desequilibrado, em vez de permitirem que uma lista extensa de fontes o oculte.',
  'Leading source share': 'Peso da principal fonte',
  'of 30-day records': 'dos registos de 30 dias',
  'Countries without a story': 'Países sem publicações',
  'this week': 'esta semana',
  'Most-covered country:': 'País com maior cobertura:',
  '% of the seven-day ledger. The four leading sources account for': '% do registo de sete dias. As quatro principais fontes representam',
  '% of the 30-day ledger.': '% do registo de 30 dias.',
  'Skip to main content': 'Saltar para o conteúdo principal',
  'US$': 'US$',
  'US$4': 'US$4',
  '% annual change': '% de variação anual',
  '% of adults': '% dos adultos',
  '% of employment': '% do emprego',
  '% of merchandise exports': '% das exportações de mercadorias',
  '% of output': '% da produção',
  'kg per hectare': 'kg por hectare',
  'per 1 million people': 'por milhão de pessoas',
  'per 1,000 people': 'por 1 000 pessoas',
  'per 100 people': 'por 100 pessoas',
  'per 100,000 adults': 'por 100 000 adultos',
  'visitors': 'visitantes',
  'Loading recorded reader activity…': 'A carregar a actividade registada dos leitores…',
  'Audience evidence could not be loaded.': 'Não foi possível carregar os dados de audiência.',
  'No estimate has been substituted for the missing measurement.': 'Nenhuma estimativa substituiu a medição em falta.',
  'Reader habit and retention': 'Hábitos e retenção dos leitores',
  'These are recorded product events, not estimates of market size, brand awareness, paying subscribers or revenue.': 'Estes são eventos registados no produto, não estimativas da dimensão do mercado, do reconhecimento da marca, dos assinantes pagantes ou da receita.',
  'Manage corporate and institutional API access keys.': 'Gerir as chaves de acesso à API de empresas e instituições.',
  'Contact name': 'Nome do contacto',
  'Contact email': 'Correio electrónico do contacto',
  'Access tier': 'Nível de acesso',
  'Market-Entry Pilot Applications': 'Candidaturas ao projecto-piloto de entrada no mercado',
  'Structured decision scopes, research baselines and success measures awaiting human qualification.': 'Âmbitos de decisão estruturados, bases de investigação e medidas de sucesso que aguardam qualificação humana.',
  'Current research process': 'Processo actual de investigação',
  'Review status': 'Estado da revisão',
  'Record scope questions, fit assessment and follow-up work.': 'Registar questões de âmbito, a avaliação da adequação e o trabalho de seguimento.',
  'Concierge and booking submissions with the preliminary brief already sent.': 'Pedidos de concierge e de reserva cujo resumo preliminar já foi enviado.',
  'Contact Messages': 'Mensagens de contacto',
  'Submissions from the contact page.': 'Mensagens enviadas através da página de contacto.',
  'Sign-ups for summits and forums.': 'Inscrições em cimeiras e fóruns.',
  'Intelligence: Coverage Gaps': 'Inteligência: lacunas de cobertura',
  'Measured gaps in the actual publication record — thinnest sectors, silent countries and unclassified stories.': 'Lacunas medidas no registo real de publicações — sectores com menor cobertura, países sem publicações e histórias sem classificação.',
  'Measuring recent coverage...': 'A medir a cobertura recente...',
  'No measurable coverage gaps identified.': 'Não foram identificadas lacunas de cobertura mensuráveis.',
  'Manage verified RSS, API and scraper endpoints feeding the platform.': 'Gerir fontes RSS, API e pontos de recolha verificados que alimentam a plataforma.',
  'Add Source': 'Adicionar fonte',
  'Add a verified source': 'Adicionar uma fonte verificada',
  'The ingestion worker will poll this endpoint on the selected interval. Use the publisher’s canonical feed or API URL.': 'O sistema de recolha consultará este ponto no intervalo seleccionado. Utilize a fonte canónica ou o endereço da API do editor.',
  'Publisher or source name': 'Nome do editor ou da fonte',
  'Source type': 'Tipo de fonte',
  'Publisher page': 'Página do editor',
  'Country code (optional)': 'Código do país (facultativo)',
  'Why is this change necessary? (e.g., Tone issues, unsupported claims, missing context...)': 'Por que razão é necessária esta alteração? (por exemplo, problemas de tom, afirmações sem suporte ou contexto em falta...)',
  'Country Hubs': 'Dossiês por país',
  'Restricted Access': 'Acesso restrito',
  'Monitoring editorial content operations.': 'A acompanhar as operações de conteúdo editorial.',
  'Verify and calibrate editorial content.': 'Rever e calibrar o conteúdo editorial.',
  'Identifies narrative gaps and stale reporting.': 'Identifica lacunas narrativas e informação desactualizada.',
  'This consolidates recent editorial feedback into updated publishing rules. The process typically takes 30-60 seconds.': 'Esta operação consolida os comentários editoriais recentes em regras de publicação actualizadas. O processo demora habitualmente entre 30 e 60 segundos.',
  'Rejecting an article will remove it from circulation and log the reason for editorial review.': 'A rejeição de um artigo retira-o de circulação e regista o motivo para revisão editorial.',
  'Admin Access': 'Acesso de administração',
  'Intelligence Access': 'Acesso à inteligência',
  'Access Denied': 'Acesso negado',
  'Bespoke travel, site visits, and corporate services for doing business in Africa.': 'Viagens por medida, visitas a instalações e serviços empresariais para desenvolver actividade em África.',
  'Verified forums, summits, and roundtables focused on African markets when records are available.': 'Fóruns, cimeiras e mesas-redondas verificados e centrados nos mercados africanos, quando existem registos disponíveis.',
  'A focused briefing of currently published, source-attributed reporting from across Africa.': 'Uma síntese focada da informação actualmente publicada e atribuída às fontes em toda a África.',
  'Source-attributed photography attached to BOA-Story reporting.': 'Fotografia atribuída à fonte e associada às publicações da BOA-Story.',
  'Independent reporting and intelligence from across Africa.': 'Informação independente e inteligência de toda a África.',
  'A verifiable ledger of BOA-Story publishing, country coverage, sectors and attributed sources.': 'Um registo verificável das publicações da BOA-Story, da cobertura por país e sector e das fontes atribuídas.',
  'Access your Reader Member account and complete reader product.': 'Aceda à sua conta de Membro Leitor e ao produto completo para leitores.',
  'Weekly dispatches on African business, culture, and emerging stories, no noise, no filter.': 'Boletins semanais sobre negócios, cultura e histórias emergentes de África, sem ruído nem filtros.',
  'Structured country briefs and sector analyses from the BOA evidence desk.': 'Sínteses nacionais estruturadas e análises sectoriais preparadas pela equipa de evidência da BOA.',
  'Search thousands of African business intelligence briefings, country profiles, and sector analysis.': 'Pesquise milhares de sínteses de inteligência empresarial africana, perfis de países e análises sectoriais.',
  'Review first-party campaign impressions, clicks, click-through rate and configured budget.': 'Consulte as impressões e os cliques registados directamente, a taxa de cliques e o orçamento configurado da campanha.',
  'Real, grounded stories about African lives, cities, creators, and everyday opportunity.': 'Histórias reais e fundamentadas sobre vidas, cidades, criadores e oportunidades quotidianas em África.',
  'A research-led starting point for planning business travel across African cities.': 'Um ponto de partida assente em investigação para planear viagens de negócios em cidades africanas.',
  'Archive page for African participation at the FIFA World Cup 2026.': 'Página de arquivo sobre a participação africana no Campeonato do Mundo da FIFA de 2026.',
  'this sector guide': 'este guia sectorial',
  'Page views': 'Visualizações de páginas',
  'Provision API access': 'Conceder acesso à API',
  'This credential is shown once. Copy it into the client’s secure secret store before closing.': 'Esta credencial é apresentada uma única vez. Antes de fechar, copie-a para o arquivo seguro de segredos do cliente.',
  'Create a scoped client identity and hourly request allowance.': 'Criar uma identidade de cliente com âmbito definido e um limite horário de pedidos.',
  'Save review': 'Guardar revisão',
  'Adding source…': 'A adicionar a fonte…',
  'Add source': 'Adicionar fonte',
  'Curate: personal byline + front-page preference': 'Selecção editorial: assinatura pessoal e preferência para a primeira página',
  'Remove from your library': 'Remover da sua biblioteca',
  'Save to your library': 'Guardar na sua biblioteca',
  'Unlock every story': 'Desbloquear todas as histórias',
  'This briefing draws on the original reporting below:': 'Esta síntese baseia-se nas publicações originais abaixo:',
  'From US$4/month · cancel anytime': 'A partir de US$4/mês · cancele a qualquer momento',
  'Failed to load clients': 'Não foi possível carregar os clientes',
  'Client access provisioned': 'Acesso do cliente concedido',
  'Failed to provision client': 'Não foi possível conceder acesso ao cliente',
  'Failed to load inbox': 'Não foi possível carregar a caixa de entrada',
  'Pilot review updated': 'Revisão do projecto-piloto actualizada',
  'Failed to update pilot review': 'Não foi possível actualizar a revisão do projecto-piloto',
  'Failed to load intelligence recommendations': 'Não foi possível carregar as recomendações de inteligência',
  'Failed to load sources': 'Não foi possível carregar as fontes',
  'Delete this source?': 'Eliminar esta fonte?',
  'Source deleted': 'Fonte eliminada',
  'Failed to delete source': 'Não foi possível eliminar a fonte',
  'Source added to the ingestion registry': 'Fonte adicionada ao registo de recolha',
  'Failed to create source': 'Não foi possível criar a fonte',
  'Failed to submit feedback:': 'Não foi possível enviar os comentários:',
  'BOA-Story Report': 'Relatório da BOA-Story',
  'Editorial review': 'Revisão editorial',
  'Editorial standards review': 'Revisão das normas editoriais',
  "Hello! I'm here to help. Ask me anything about African markets, investments, or our recent coverage.": 'Olá! Estou aqui para ajudar. Pergunte-me sobre os mercados africanos, investimentos ou a nossa cobertura recente.',
  'Sorry, I encountered an error while trying to process your request. Please try again.': 'Ocorreu um erro ao processar o seu pedido. Tente novamente.',
  'Access expired, please renew': 'O acesso expirou; renove-o',
  'Lower value': 'Valor inferior',
  'Higher value': 'Valor superior',
  'Failed to load country events:': 'Não foi possível carregar os eventos do país:',
  'Name is required': 'O nome é obrigatório',
  'Registration failed:': 'Não foi possível concluir a inscrição:',
  'this dashboard': 'este painel',
  'Learn More': 'Saber mais',
  'Administrative access granted.': 'Acesso de administração concedido.',
  'Story curated': 'História seleccionada',
  'Now a magazine story: personal byline, preferred on the front.': 'Agora é uma história de revista: assinatura pessoal e preferência na primeira página.',
  'Back to briefing coverage with the desk byline.': 'De volta à cobertura de síntese com a assinatura da equipa editorial.',
  'Curation failed': 'A selecção editorial falhou',
  'Check your admin token and try again.': 'Verifique o seu código de administração e tente novamente.',
  'Feedback logged. Editorial rules updated.': 'Comentários registados. Regras editoriais actualizadas.',
  'Rejection Failed': 'A rejeição falhou',
  'Check logs for details.': 'Consulte os registos para obter pormenores.',
  'Scanning for stale content...': 'A procurar conteúdo desactualizado...',
  'Audit failed.': 'A auditoria falhou.',
  'Editorial rules updated successfully.': 'Regras editoriais actualizadas com êxito.',
  'Update failed.': 'A actualização falhou.',
  'Select an event before registering': 'Seleccione um evento antes de se inscrever',
  'The recorded value of goods and services produced in the economy.': 'O valor registado dos bens e serviços produzidos na economia.',
  'Use it to understand market scale, then compare it with population and growth rather than reading it alone.': 'Utilize-o para compreender a dimensão do mercado e compare-o depois com a população e o crescimento, em vez de o interpretar isoladamente.',
  'The annual change in inflation-adjusted economic output.': 'A variação anual da produção económica corrigida da inflação.',
  'Use it to identify acceleration or contraction and investigate which sectors are driving the change.': 'Utilize-a para identificar aceleração ou contracção e investigar que sectores determinam a variação.',
  'The annual change in consumer prices.': 'A variação anual dos preços no consumidor.',
  'Use it when assessing household demand, operating costs, pricing power and monetary-policy pressure.': 'Utilize-a ao avaliar a procura das famílias, os custos operacionais, o poder de fixação de preços e a pressão da política monetária.',
  'Net foreign direct investment inflows as a share of the economy.': 'Entradas líquidas de investimento directo estrangeiro em percentagem da economia.',
  'Use it as evidence of recorded cross-border capital flows, then verify the projects and sectors behind the number.': 'Utilize-a como evidência dos fluxos de capital transfronteiriços registados e verifique depois os projectos e sectores subjacentes ao valor.',
  'The provider estimate of the resident population.': 'A estimativa da população residente fornecida pela entidade de origem.',
  'Use it to size the potential market alongside income, urbanisation, age structure and access conditions.': 'Utilize-a para dimensionar o mercado potencial em conjunto com o rendimento, a urbanização, a estrutura etária e as condições de acesso.',
  'Exports plus imports of goods and services as a share of GDP.': 'Exportações e importações de bens e serviços em percentagem do PIB.',
  'Use it to understand how exposed the economy is to regional and global trade.': 'Utilize-a para compreender o grau de exposição da economia ao comércio regional e mundial.',
  'Use this observation with its stated period and compare it with related indicators before making a decision.': 'Utilize esta observação com o período indicado e compare-a com indicadores relacionados antes de tomar uma decisão.',
  'Country brief': 'Síntese nacional',
  'Investment outlook': 'Perspectivas de investimento',
  'Briefing report': 'Relatório de síntese',
  'Daily breakfast for two': 'Pequeno-almoço diário para duas pessoas',
  'Executive lounge access': 'Acesso ao salão executivo',
  'Rooftop spa access': 'Acesso ao spa no terraço',
  'Security Review': 'Revisão de segurança',
  'Sector data unavailable | BOA-Story': 'Dados sectoriais indisponíveis | BOA-Story',
  'Continental data unavailable | BOA-Story': 'Dados continentais indisponíveis | BOA-Story',
  'Failed to parse user info': 'Não foi possível interpretar os dados do utilizador',
  'Failed to load preferences': 'Não foi possível carregar as preferências',
  'Loading page': 'A carregar a página',
  'Loading…': 'A carregar…',
  'Loading...': 'A carregar...',
  'Try again': 'Tentar novamente',
  'Retry': 'Tentar novamente',
  'Back': 'Voltar',
  'Close': 'Fechar',
  'Open': 'Abrir',
  'Search': 'Pesquisar',
  'Learn more': 'Saber mais',
  'Read more': 'Ler mais',
  'View all': 'Ver tudo',
  'Countries': 'Países',
  'Country dossiers': 'Dossiês por país',
  'Countries in scope': 'Países abrangidos',
  'Evidence source': 'Fonte dos dados',
  'Dataset status': 'Estado do conjunto de dados',
  'Current evidence release': 'Edição actual dos dados',
  'Official measures': 'Indicadores oficiais',
  'Official series': 'Séries oficiais',
  'Inspect': 'Consultar',
  'Limit:': 'Limite:',
  'In plain language:': 'Em linguagem clara:',
  'Questions to check next': 'Questões a verificar a seguir',
  'Full dossier': 'Dossiê completo',
  'Briefing reports': 'Relatórios de síntese',
  'Official dataset request failed': 'Não foi possível obter o conjunto de dados oficial',
  'Retry official data': 'Voltar a carregar os dados oficiais',
  'Retry dashboard': 'Voltar a carregar o painel',
  'The continental economic record could not be loaded.':
    'Não foi possível carregar o registo económico continental.',
  'Retry the official-data dashboard or continue to individual country dossiers.':
    'Volte a carregar o painel de dados oficiais ou prossiga para os dossiês de cada país.',

  'African Market Intelligence | BOA-Story': 'Inteligência dos Mercados Africanos | BOA-Story',
  'Official multi-indicator African sector performance, country breadth, structural conditions and decision diligence.':
    'Desempenho sectorial africano assente em vários indicadores oficiais, cobertura por país, condições estruturais e diligência para a decisão.',
  'BOA evidence desk': 'Gabinete de dados da BOA',
  'Market performance': 'Desempenho dos mercados',
  'African markets, measured sector by sector.': 'Os mercados africanos, medidos sector a sector.',
  'Read official measures of output, access, infrastructure, investment and operating conditions—without unsupported composite scores or newsroom-volume proxies.':
    'Consulte indicadores oficiais de produção, acesso, infra-estruturas, investimento e condições operacionais — sem índices compósitos sem fundamento nem indicadores baseados no volume de notícias.',
  'Open continental economy': 'Abrir a economia continental',
  'Compare country records': 'Comparar registos nacionais',
  'Sector dossiers': 'Dossiês sectoriais',
  'Market intelligence sections': 'Secções de inteligência de mercado',
  'The sector-performance record could not be loaded.': 'Não foi possível carregar o registo de desempenho sectorial.',
  'Cross-sector comparison': 'Comparação entre sectores',
  'Compare sectors without hiding what the numbers mean': 'Compare sectores sem ocultar o significado dos números',
  'Each sector uses the measure that fits it. Read the measure’s name and unit before comparing movement or country coverage. BOA does not blend unrelated measures into one score.':
    'Cada sector utiliza o indicador que lhe é adequado. Leia o nome e a unidade antes de comparar a evolução ou a cobertura por país. A BOA não combina indicadores sem relação entre si numa pontuação única.',
  'the market-intelligence dashboard': 'o painel de inteligência de mercado',
  'From indicator to informed judgment': 'Do indicador ao juízo fundamentado',
  'A fuller way to understand sector performance': 'Uma leitura mais completa do desempenho sectorial',
  'Performance is not one number. A useful reading connects the sector’s recorded level, its direction of change, how widely that direction appears across countries, and the conditions that may support or constrain it.':
    'O desempenho não se resume a um número. Uma leitura útil relaciona o nível registado pelo sector, a direcção da mudança, a amplitude dessa mudança entre países e as condições que a podem apoiar ou limitar.',
  'Eight-sector comparison': 'Comparação de oito sectores',
  'What the latest available country data shows': 'O que revelam os dados nacionais mais recentes',
  'The large value is the middle country reading. “Higher” only describes direction; whether it is favourable depends on what the indicator measures.':
    'O valor em destaque é a leitura do país mediano. «Mais elevado» descreve apenas a direcção; saber se é favorável depende do que o indicador mede.',
  'Middle country reading ·': 'Leitura do país mediano ·',
  'versus the previous available reading': 'face à leitura anterior disponível',
  'countries reading higher': 'países com uma leitura superior',
  'of 54 countries covered': 'dos 54 países abrangidos',
  'Detailed sector guides': 'Guias sectoriais pormenorizados',
  'Understand each sector one measure at a time': 'Compreenda cada sector, indicador a indicador',
  'Start with the main measure, then use the three supporting measures to see structure and operating conditions. The questions at the end show what still requires investigation.':
    'Comece pelo indicador principal e utilize depois os três indicadores complementares para analisar a estrutura e as condições operacionais. As questões finais mostram o que ainda exige investigação.',
  'Middle reading across': 'Leitura mediana em',
  'countries ·': 'países ·',
  '· half of the countries fall between': '· metade dos países situa-se entre',
  'and': 'e',
  'What this measures:': 'O que este indicador mede:',
  'median change': 'variação mediana',
  '% rising': '% em subida',
  '% coverage': '% de cobertura',
  'Open complete performance dossier': 'Abrir o dossiê completo de desempenho',
  'Evidence discipline': 'Disciplina na utilização dos dados',
  'How to read the market record': 'Como interpretar o registo de mercado',
  'The dashboard is designed to preserve differences between growth, scale, access, concentration, cost and capacity rather than collapsing them into an unsupported score.':
    'O painel preserva as diferenças entre crescimento, escala, acesso, concentração, custo e capacidade, em vez de as reduzir a uma pontuação sem fundamento.',
  'Published methodology': 'Metodologia publicada',
  'Performance matrix': 'Matriz de desempenho',
  'Sectors measured': 'Sectores medidos',
  'Official signals': 'Indicadores oficiais',
  'primary and supporting series': 'séries principais e complementares',
  'sector dossiers': 'dossiês sectoriais',
  'African markets': 'mercados africanos',
  'Average data coverage': 'Cobertura média dos dados',
  'average share of 54 countries represented': 'percentagem média dos 54 países representados',
  'Establish the level': 'Determinar o nível',
  'Read the latest median and its unit. This describes the middle reporting country, not the continent’s combined market size and not every country.':
    'Leia a mediana mais recente e a respectiva unidade. Este valor descreve o país declarante central, não a dimensão conjunta do mercado continental nem todos os países.',
  'Test the direction': 'Avaliar a direcção',
  'Compare the median change with the share of countries moving higher. A positive median with narrow country breadth may reflect a concentrated rather than widespread shift.':
    'Compare a variação mediana com a proporção de países em subida. Uma mediana positiva com pouca amplitude geográfica pode reflectir uma mudança concentrada, e não generalizada.',
  'Examine operating conditions': 'Examinar as condições operacionais',
  'Read access, infrastructure, cost, capacity and investment measures alongside the headline. They can explain important constraints without proving causation.':
    'Leia os indicadores de acesso, infra-estruturas, custo, capacidade e investimento juntamente com o indicador principal. Podem explicar limitações importantes sem provar causalidade.',
  'Check decision relevance': 'Verificar a relevância para a decisão',
  'Move from the continental pattern to country dossiers, local regulation, competition, demand, currency exposure and implementation conditions before making a market decision.':
    'Antes de tomar uma decisão de mercado, passe do padrão continental para os dossiês nacionais, a regulamentação local, a concorrência, a procura, a exposição cambial e as condições de execução.',
  'Primary performance': 'Desempenho principal',
  'Each sector has one named output, spending, credit, adoption or external-demand proxy. Its scope and limitation are visible beside the value.':
    'Cada sector dispõe de um indicador identificado de produção, despesa, crédito, adopção ou procura externa. O âmbito e a limitação surgem junto do valor.',
  'Supporting dimensions': 'Dimensões complementares',
  'Three additional indicators test market structure or operating conditions. Their own units, years and country coverage remain intact.':
    'Três indicadores adicionais analisam a estrutura do mercado ou as condições operacionais. As respectivas unidades, anos e cobertura nacional permanecem intactos.',
  'No automatic verdict': 'Sem veredicto automático',
  'Higher is not always better: rising lending rates, grid losses or concentration can be adverse or contextual. No field is converted into a return forecast or investment recommendation.':
    'Um valor mais elevado nem sempre é melhor: a subida das taxas de crédito, as perdas de rede ou a concentração podem ser adversas ou depender do contexto. Nenhum campo é convertido numa previsão de rendibilidade ou recomendação de investimento.',
  'Headline values are country medians. Country leaders, laggards, middle-half dispersion and breadth show how much continental summaries conceal.':
    'Os valores principais são medianas nacionais. Os países dianteiros e atrasados, a dispersão da metade central e a amplitude geográfica revelam o que os resumos continentais ocultam.',

  'Continental Economic Overview | BOA-Story': 'Panorama Económico Continental | BOA-Story',
  'Official continental and regional economic, trade, investment and sector-performance indicators across Africa’s 54 markets.':
    'Indicadores oficiais continentais e regionais de economia, comércio, investimento e desempenho sectorial nos 54 mercados africanos.',
  'Continental economy': 'Economia continental',
  'Africa’s economy in one verifiable record.': 'A economia africana num registo verificável.',
  'Move from continental scale to regional concentration, sector conditions and country evidence. Every figure keeps its unit, period, coverage and limitation visible.':
    'Passe da escala continental para a concentração regional, as condições sectoriais e os dados de cada país. Cada valor mantém visíveis a unidade, o período, a cobertura e as limitações.',
  'Open sector intelligence': 'Abrir a inteligência sectorial',
  'Continental dashboard sections': 'Secções do painel continental',
  'Official continental record': 'Registo continental oficial',
  'How large is the economy, and which way is it moving?': 'Qual é a dimensão da economia e em que direcção evolui?',
  'A total adds reported country values together. A median shows the middle country and gives every country equal weight. The cards state which method is used.':
    'Um total soma os valores comunicados pelos países. Uma mediana mostra o país central e atribui o mesmo peso a cada país. Os cartões indicam o método utilizado.',
  'the continental overview': 'o panorama continental',
  'Narrated reporting': 'Reportagens narradas',
  'Listen to the evidence behind the wider picture': 'Ouça os dados que sustentam o quadro geral',
  'These are narrated, source-linked editorial briefings. They provide current reporting context and remain separate from the official economic measures above.':
    'Estas sínteses editoriais narradas estão ligadas às respectivas fontes. Fornecem contexto jornalístico actual e mantêm-se separadas dos indicadores económicos oficiais apresentados acima.',
  'Briefing': 'Síntese',
  'min audio': 'min de áudio',
  'Open source-linked article': 'Abrir o artigo ligado à fonte',
  'The economic record is complete above. This API response does not yet contain a narrated-briefing index, so no unrelated regional data has been substituted in its place.':
    'O registo económico completo encontra-se acima. Esta resposta ainda não inclui o índice das sínteses narradas; por isso, não foram apresentados dados regionais sem relação com esta secção.',
  'Build the continental picture': 'Construir o quadro continental',
  'Read the economy as connected evidence, not isolated rankings': 'Leia a economia como dados interligados, não como classificações isoladas',
  'Economic size, real growth, inflation, trade, investment and population describe different parts of the same landscape. Their relationship is more informative than any one headline figure.':
    'A dimensão económica, o crescimento real, a inflação, o comércio, o investimento e a população descrevem partes diferentes da mesma realidade. A relação entre estes elementos é mais esclarecedora do que qualquer valor isolado.',
  'Practical conclusion:': 'Conclusão prática:',
  'use this overview to frame questions and identify patterns. Use the regional comparison to test geographic concentration, the sector view to examine operating structure, and country dossiers for decision-level detail.':
    'utilize este panorama para formular questões e identificar padrões. Recorra à comparação regional para avaliar a concentração geográfica, à perspectiva sectorial para examinar a estrutura operacional e aos dossiês nacionais para obter o pormenor necessário à decisão.',
  'Trade, prices and investment': 'Comércio, preços e investimento',
  'The other numbers needed for context': 'Os restantes valores necessários para o contexto',
  'official measures in total': 'indicadores oficiais no total',
  'countries · observations': 'países · observações',
  'Country comparison': 'Comparação entre países',
  'Which countries record the largest values?': 'Que países registam os valores mais elevados?',
  'Each list ranks only the named measure. A country’s position does not mean it is the “best” market, safest investment or strongest overall economy.':
    'Cada lista ordena apenas o indicador identificado. A posição de um país não significa que seja o «melhor» mercado, o investimento mais seguro ou a economia globalmente mais forte.',
  'Five-region comparison': 'Comparação das cinco regiões',
  'How Africa’s regions differ': 'Como diferem as regiões africanas',
  'GDP, population and foreign investment are added across countries. Growth, inflation and investment use the middle country reading. Each card shows how many countries supplied the data.':
    'O PIB, a população e o investimento estrangeiro são somados entre países. O crescimento, a inflação e o investimento utilizam a leitura do país mediano. Cada cartão indica quantos países forneceram dados.',
  'countries': 'países',
  'Africa': 'África',
  'Open countries': 'Abrir países',
  'Official sector series': 'Séries sectoriais oficiais',
  'Sector performance across Africa': 'Desempenho sectorial em África',
  'Eight sector dossiers combine a primary performance proxy with three structural or operating dimensions. Incompatible units remain separate.':
    'Oito dossiês sectoriais combinam um indicador principal de desempenho com três dimensões estruturais ou operacionais. As unidades incompatíveis permanecem separadas.',
  '% coverage ·': '% de cobertura ·',
  'Open full performance dossier': 'Abrir o dossiê completo de desempenho',
  'Method and comparability': 'Método e comparabilidade',
  'Continental record': 'Registo continental',
  'Regional comparison': 'Comparação regional',
  'Sector performance': 'Desempenho sectorial',
  '1. Begin with scale': '1. Começar pela escala',
  'GDP and population establish the size of recorded economic activity and the number of people in scope. Neither figure alone describes productivity, distribution, household welfare or market accessibility.':
    'O PIB e a população estabelecem a dimensão da actividade económica registada e o número de pessoas abrangidas. Nenhum dos valores, por si só, descreve a produtividade, a distribuição, o bem-estar das famílias ou a acessibilidade do mercado.',
  '2. Add momentum': '2. Acrescentar a dinâmica',
  'Real GDP growth indicates the direction and pace of inflation-adjusted output. Compare it with its observation period and country coverage before describing momentum as current or continent-wide.':
    'O crescimento real do PIB indica a direcção e o ritmo da produção ajustada à inflação. Compare-o com o período de observação e a cobertura nacional antes de descrever a dinâmica como actual ou continental.',
  '3. Examine stability and financing': '3. Examinar a estabilidade e o financiamento',
  'Inflation affects purchasing power and operating costs, while foreign direct investment records a form of external capital flow. High or rising values require country-specific explanation.':
    'A inflação afecta o poder de compra e os custos operacionais, enquanto o investimento directo estrangeiro regista uma forma de fluxo de capital externo. Valores elevados ou em subida exigem uma explicação específica por país.',
  '4. Inspect distribution': '4. Examinar a distribuição',
  'Regional totals and country rankings show where recorded values are concentrated. Medians and coverage reveal the typical reporting country and how much of Africa the comparison actually represents.':
    'Os totais regionais e as classificações nacionais mostram onde se concentram os valores registados. As medianas e a cobertura revelam o país declarante típico e a parte de África efectivamente representada.',
  'Largest economies': 'Maiores economias',
  'Fastest real growth': 'Crescimento real mais rápido',
  'Largest net FDI inflows': 'Maiores entradas líquidas de IDE',
  'Recorded GDP': 'PIB registado',
  'Population': 'População',
  'Median real growth': 'Crescimento real mediano',
  'Median inflation': 'Inflação mediana',
  'Recorded net FDI': 'IDE líquido registado',
  'Median fixed investment': 'Investimento fixo mediano',
  'Methodology': 'Metodologia',
  'World Bank World Development Indicators': 'Indicadores do Desenvolvimento Mundial do Banco Mundial',
  'current US$': 'US$ correntes',
  'current US$ per person': 'US$ correntes por pessoa',
  '% of GDP': '% do PIB',
  '% of population': '% da população',
  '% of service exports': '% das exportações de serviços',
  'percentage points': 'pontos percentuais',
  'people': 'pessoas',
  'sum': 'soma',
  'country median': 'mediana nacional',
  'derived balance': 'saldo calculado',
  'accelerating': 'em aceleração',
  'slowing': 'em desaceleração',
  'steady': 'estável',
  'North': 'Norte',
  'West': 'Ocidental',
  'Central': 'Central',
  'East': 'Oriental',
  'Southern': 'Austral',

  'Recorded economic output': 'Produção económica registada',
  'Population represented': 'População representada',
  'Median real GDP growth': 'Crescimento real mediano do PIB',
  'Median consumer inflation': 'Inflação mediana dos preços no consumidor',
  'Recorded net FDI inflows': 'Entradas líquidas de IDE registadas',
  'Recorded exports': 'Exportações registadas',
  'Recorded imports': 'Importações registadas',
  'Recorded trade difference': 'Diferença comercial registada',
  'Median GDP per person': 'PIB mediano por pessoa',
  'Median fixed-investment intensity': 'Intensidade mediana do investimento fixo',
  'Median current-account balance': 'Saldo mediano da balança corrente',
  'Sum of the latest reported nominal GDP values across African economies.':
    'Soma dos valores mais recentes do PIB nominal comunicados pelas economias africanas.',
  'Current-dollar GDP is affected by inflation and exchange rates and does not measure welfare or investability.':
    'O PIB em dólares correntes é afectado pela inflação e pelas taxas de câmbio e não mede o bem-estar nem a aptidão para investimento.',
  'Total population across all 54 African countries in scope.':
    'População total dos 54 países africanos abrangidos.',
  'Population scale is not equivalent to addressable demand, purchasing power or formal-market size.':
    'A dimensão da população não equivale à procura acessível, ao poder de compra nem à dimensão do mercado formal.',
  'The middle country-level real output growth reading across reporting economies.':
    'Leitura central do crescimento real da produção nacional entre as economias declarantes.',
  'A median gives each country equal weight and should not be read as continent-wide weighted growth.':
    'Uma mediana atribui o mesmo peso a cada país e não deve ser interpretada como crescimento ponderado de todo o continente.',
  'The middle latest-reported annual consumer-price change across reporting economies.':
    'Variação anual central mais recente dos preços no consumidor entre as economias declarantes.',
  'Observation years vary and national CPI baskets, controls and measurement quality differ.':
    'Os anos de observação variam, tal como os cabazes nacionais do IPC, os controlos e a qualidade da medição.',
  'Sum of latest reported net foreign direct investment inflows.':
    'Soma das entradas líquidas de investimento directo estrangeiro comunicadas mais recentemente.',
  'FDI can be volatile, negative, transaction-driven or routed through holding structures; it is not committed project capital.':
    'O IDE pode ser volátil, negativo, resultar de transacções ou passar por estruturas de participações; não representa capital comprometido com projectos.',
  'Sum of latest reported exports of goods and services.':
    'Soma das exportações de bens e serviços comunicadas mais recentemente.',
  'Sum of latest reported imports of goods and services.':
    'Soma das importações de bens e serviços comunicadas mais recentemente.',
  'Different observation years and current-dollar valuation prevent a strict same-period continental total.':
    'Os diferentes anos de observação e a avaliação em dólares correntes impedem um total continental rigoroso para o mesmo período.',
  'Exports less imports from the two recorded goods-and-services totals.':
    'Exportações menos importações, calculadas a partir dos dois totais registados de bens e serviços.',
  'This is a derived cross-country record, not a synchronized continental balance-of-payments statement.':
    'Trata-se de um registo calculado entre países, e não de uma balança de pagamentos continental sincronizada.',
  'The middle nominal GDP-per-capita reading across reporting economies.':
    'Leitura central do PIB nominal por habitante entre as economias declarantes.',
  'GDP per person is not household income and conceals distribution, prices and informality.':
    'O PIB por pessoa não é o rendimento das famílias e oculta a distribuição, os preços e a informalidade.',
  'The middle gross fixed capital formation share across reporting countries.':
    'Quota central da formação bruta de capital fixo entre os países declarantes.',
  'The series combines public and private fixed assets and does not establish project quality or returns.':
    'A série combina activos fixos públicos e privados e não determina a qualidade nem a rendibilidade dos projectos.',
  'The middle external current-account position across reporting countries.':
    'Posição externa central da balança corrente entre os países declarantes.',
  'Observation years vary; deficits can reflect investment or vulnerability and require financing analysis.':
    'Os anos de observação variam; os défices podem reflectir investimento ou vulnerabilidade e exigem uma análise do financiamento.',
  'Continental and regional totals sum each country’s latest verified observation; medians retain equal country weight and are not GDP-weighted. Each field carries its reporting-country count and observation range. Values from different years are never presented as a same-year national-accounts identity, and no indicator is converted into an investment score, forecast or recommendation.':
    'Os totais continentais e regionais somam a observação verificada mais recente de cada país; as medianas mantêm o mesmo peso por país e não são ponderadas pelo PIB. Cada campo indica o número de países declarantes e o intervalo de observação. Os valores de anos diferentes nunca são apresentados como uma identidade de contas nacionais do mesmo ano, e nenhum indicador é convertido numa pontuação, previsão ou recomendação de investimento.',

  'Agriculture & Agribusiness': 'Agricultura e agro-indústria',
  'Energy & Mining': 'Energia e minas',
  'Finance & Investment': 'Finanças e investimento',
  'Healthcare & Pharma': 'Saúde e indústria farmacêutica',
  'Infrastructure & Construction': 'Infra-estruturas e construção',
  'Manufacturing & Industry': 'Indústria transformadora e indústria',
  'Technology & Innovation': 'Tecnologia e inovação',
  'Tourism & Hospitality': 'Turismo e hotelaria',
  'Agriculture, forestry and fishing value-added growth': 'Crescimento do valor acrescentado da agricultura, silvicultura e pesca',
  'Industry including construction value-added growth': 'Crescimento do valor acrescentado da indústria, incluindo a construção',
  'Domestic credit to private sector by banks': 'Crédito bancário interno ao sector privado',
  'Current health expenditure per capita': 'Despesa corrente de saúde por habitante',
  'Gross fixed capital formation growth': 'Crescimento da formação bruta de capital fixo',
  'Manufacturing value-added growth': 'Crescimento do valor acrescentado da indústria transformadora',
  'Individuals using the internet': 'Pessoas que utilizam a Internet',
  'Travel services share of service exports': 'Peso dos serviços de viagens nas exportações de serviços',
  'Median annual real growth': 'Crescimento real anual mediano',
  'Median annual real industrial growth': 'Crescimento real industrial anual mediano',
  'Median private-sector credit depth': 'Profundidade mediana do crédito ao sector privado',
  'Median annual spending growth': 'Crescimento anual mediano da despesa',
  'Median annual real investment growth': 'Crescimento real anual mediano do investimento',
  'Median digital adoption': 'Adopção digital mediana',
  'Median travel-export concentration': 'Concentração mediana das exportações de viagens',

  'Sign in to your Best of Africa membership with a secure email verification code.':
    'Inicie sessão na sua conta Best of Africa através de um código seguro de verificação por correio electrónico.',
  'Member Portal': 'Portal do membro',
  'LOGIN SUCCESSFUL': 'SESSÃO INICIADA',
  'Redirecting to Intelligence Feed...': 'A encaminhar para o fluxo de inteligência...',
  'Email Address': 'Endereço de correio electrónico',
  'Requesting Code...': 'A pedir o código...',
  'Send Verification Code': 'Enviar código de verificação',
  'We sent a 6-digit verification code to': 'Enviámos um código de verificação de 6 algarismos para',
  'Verification Code': 'Código de verificação',
  'Verifying...': 'A verificar...',
  'Verify Code': 'Verificar código',
  'Use a different email': 'Utilizar outro endereço',
  'Apply for Membership': 'Pedir adesão',
  'SECURE CONNECTION: TLS 1.3 / OTP AUTH': 'LIGAÇÃO SEGURA: TLS 1.3 / AUTENTICAÇÃO OTP',
  "We'll email you a six-digit verification code. No password needed.":
    'Enviaremos por correio electrónico um código de verificação de seis algarismos. Não é necessária palavra-passe.',
  'We&apos;ll email you a six-digit verification code. No password needed.':
    'Enviaremos por correio electrónico um código de verificação de seis algarismos. Não é necessária palavra-passe.',
  'The page you are looking for is unavailable.': 'A página que procura não está acessível.',
  'Page Not Found': 'Página não encontrada',
  'Return Home': 'Voltar ao início',

  'How BOA-Story collects, uses, retains, and protects reader and account information.':
    'Como a BOA-Story recolhe, utiliza, conserva e protege as informações dos leitores e das contas.',
  'Privacy Policy': 'Política de privacidade',
  'Last Updated: July 2026': 'Última actualização: Julho de 2026',
  'On this page': 'Nesta página',
  '1. Data Collection': '1. Recolha de dados',
  'We collect information you provide directly, including account details, briefing preferences, newsletter subscriptions, bookmarks, contact messages and pilot applications.':
    'Recolhemos as informações que fornece directamente, incluindo dados da conta, preferências de sínteses, subscrições de boletins, marcadores, mensagens de contacto e candidaturas a projectos-piloto.',
  'For first-party audience measurement, each recorded reader event includes the page or content identifier, event time, reading or playback progress when applicable, a hashed session identifier, the connecting IP address and a one-way SHA-256 fingerprint of the normalized browser user-agent. The raw user-agent string is not stored in the engagement table.':
    'Para a medição própria da audiência, cada evento registado inclui o identificador da página ou do conteúdo, a hora do evento, o progresso de leitura ou reprodução quando aplicável, um identificador de sessão cifrado, o endereço IP da ligação e uma impressão digital SHA-256 unidireccional do agente do navegador normalizado. A cadeia original do agente do navegador não é guardada na tabela de participação.',
  '2. Use of Information': '2. Utilização das informações',
  'We use your data to:': 'Utilizamos os seus dados para:',
  'Provide personalized market intelligence.': 'Fornecer inteligência de mercado personalizada.',
  'Analyze platform usage trends.': 'Analisar tendências de utilização da plataforma.',
  'Measure briefing use, return visits, high-progress reading, audio completion and saved content.':
    'Medir a utilização das sínteses, as visitas repetidas, o avanço da leitura, a conclusão do áudio e os conteúdos guardados.',
  'Protect the service, investigate abuse and distinguish repeated activity.':
    'Proteger o serviço, investigar utilizações abusivas e distinguir actividade repetida.',
  'Communicate important updates.': 'Comunicar actualizações importantes.',
  '3. Data Protection': '3. Protecção dos dados',
  'We use technical and organizational safeguards intended to reduce unauthorized access, loss, or misuse. No online service can guarantee absolute security. We do not sell personal information.':
    'Utilizamos salvaguardas técnicas e organizativas destinadas a reduzir o acesso não autorizado, a perda ou a utilização indevida. Nenhum serviço em linha pode garantir segurança absoluta. Não vendemos informações pessoais.',
  'Raw audience events and their IP addresses and user-agent fingerprints are available only through authenticated operator reporting. Public pages do not expose individual event records.':
    'Os eventos originais de audiência, os respectivos endereços IP e as impressões digitais do agente do navegador apenas estão acessíveis em relatórios autenticados para operadores. As páginas públicas não expõem registos de eventos individuais.',
  '4. Retention': '4. Conservação',
  'Reader engagement events, including stored IP addresses and user-agent fingerprints, are retained for no more than 90 days. Account, subscription, bookmark, contact and commercial records are retained for as long as needed to provide the service, meet legal obligations or resolve a request.':
    'Os eventos de participação dos leitores, incluindo os endereços IP e as impressões digitais do agente do navegador guardados, são conservados por um período máximo de 90 dias. Os registos de conta, subscrição, marcadores, contacto e relações comerciais são conservados enquanto forem necessários para prestar o serviço, cumprir obrigações legais ou resolver um pedido.',
  '5. Your Rights': '5. Os seus direitos',
  'You may ask about personal information associated with you, request correction or deletion where applicable, or object to particular processing. Requests are assessed under the privacy law that applies to the service and requester, including PIPEDA for eligible Canadian requests and other applicable regional privacy rules.':
    'Pode pedir informações sobre os dados pessoais que lhe estão associados, solicitar a rectificação ou eliminação quando aplicável, ou opor-se a determinados tratamentos. Os pedidos são avaliados segundo a legislação de privacidade aplicável ao serviço e ao requerente, incluindo a PIPEDA para os pedidos canadianos elegíveis e outras normas regionais aplicáveis.',
  '6. Contact': '6. Contacto',
  'For privacy concerns, use the': 'Para questões de privacidade, utilize o',
  'secure contact form': 'formulário de contacto seguro',
  'and identify the request as a privacy matter.': 'e identifique o pedido como matéria de privacidade.',
  'See also:': 'Consulte também:',
  'Terms of Service': 'Termos de utilização',
  'Contact Us': 'Contacte-nos',

  'The terms governing use of the Best of Africa platform and its content.':
    'Os termos que regem a utilização da plataforma Best of Africa e dos seus conteúdos.',
  'Last Updated: June 2026': 'Última actualização: Junho de 2026',
  '1. Acceptance of Terms': '1. Aceitação dos termos',
  'By accessing the Best of Africa platform, you agree to these terms. Usage of premium intelligence requires a valid subscription.':
    'Ao aceder à plataforma Best of Africa, aceita estes termos. A utilização da inteligência premium exige uma subscrição válida.',
  '2. Intellectual Property': '2. Propriedade intelectual',
  'All reports, analysis, and content are the property of Best of Africa. Redistribution without license is prohibited.':
    'Todos os relatórios, análises e conteúdos são propriedade da Best of Africa. É proibida a redistribuição sem licença.',
  '3. Disclaimer': '3. Exclusão de responsabilidade',
  'Market intelligence is provided for informational purposes only and does not constitute financial advice.':
    'A inteligência de mercado é fornecida exclusivamente para fins informativos e não constitui aconselhamento financeiro.',
  '4. Termination': '4. Cessação',
  'We reserve the right to terminate access for violation of these terms.':
    'Reservamo-nos o direito de cessar o acesso em caso de violação destes termos.',

  'Sign in to access your settings': 'Inicie sessão para aceder às suas definições',
  'Your account, preferences, and subscription live behind a secure login.':
    'A sua conta, preferências e subscrição estão protegidas por um início de sessão seguro.',
  'Sign In': 'Iniciar sessão',
  'Manage your Best of Africa account, preferences, and subscription.':
    'Faça a gestão da sua conta Best of Africa, das preferências e da subscrição.',
  'Settings': 'Definições',
  'Control Center': 'Centro de controlo',
  'Manage your account, preferences, and subscription.': 'Faça a gestão da sua conta, preferências e subscrição.',
  'Profile Details': 'Dados do perfil',
  'Personal information and professional credentials.': 'Informações pessoais e credenciais profissionais.',
  'Full Name': 'Nome completo',
  'Professional Role / Organization': 'Função profissional / organização',
  'Account Tier': 'Plano da conta',
  'Access valid until Dec 2026': 'Acesso válido até Dezembro de 2026',
  'Intelligence Parameters': 'Parâmetros de inteligência',
  'Choose the countries, sectors and formats used to assemble your current briefing.':
    'Escolha os países, sectores e formatos utilizados para compor a sua síntese actual.',
  'Tracked Countries': 'Países acompanhados',
  'Tracked Sectors': 'Sectores acompanhados',
  'Notifications': 'Notificações',
  'Configure how you receive intelligence alerts.': 'Configure a forma como recebe os alertas de inteligência.',
  'Security': 'Segurança',
  'Change Password': 'Alterar palavra-passe',
  'Two-Factor Authentication': 'Autenticação de dois factores',
  'Session': 'Sessão',
  'Securely sign out of your account on all devices.':
    'Termine a sessão da sua conta de forma segura em todos os dispositivos.',
  'Sign Out': 'Terminar sessão',

  'Reach Best of Africa for media inquiries, partnership opportunities, or support.':
    'Contacte a Best of Africa para pedidos da comunicação social, oportunidades de parceria ou assistência.',
  'Contact': 'Contacto',
  'Contact Best of Africa': 'Contactar a Best of Africa',
  'For media inquiries, partnership opportunities, or support.':
    'Para pedidos da comunicação social, oportunidades de parceria ou assistência.',
  'Message Sent': 'Mensagem enviada',
  'Thank you for reaching out. We will review your inquiry shortly.':
    'Obrigado pelo seu contacto. Analisaremos o seu pedido em breve.',
  'Send Another': 'Enviar outra',
  'Send us a message': 'Envie-nos uma mensagem',
  'We typically respond within 24 business hours.': 'Respondemos habitualmente no prazo de 24 horas úteis.',
  'Name': 'Nome',
  'Your Name': 'O seu nome',
  'Organization': 'Organização',
  'Company / Institution': 'Empresa / instituição',
  'Email': 'Correio electrónico',
  'Inquiry Type': 'Tipo de pedido',
  'Select Inquiry Type': 'Seleccione o tipo de pedido',
  'Market Entry Pilot': 'Projecto-piloto de entrada no mercado',
  'Security / Procurement Review': 'Análise de segurança / contratação',
  'Strategic Partnership': 'Parceria estratégica',
  'Media / Press': 'Comunicação social / imprensa',
  'Report Access': 'Acesso a relatórios',
  'Technical Support': 'Assistência técnica',
  'Other': 'Outro',
  'Message': 'Mensagem',
  'How can we assist you?': 'Como podemos ajudá-lo?',
  'Sending...': 'A enviar...',
  'Send Message': 'Enviar mensagem',
  'Press Inquiries': 'Pedidos da imprensa',
  'Use the form above and select a press-related subject.':
    'Utilize o formulário acima e seleccione um assunto relacionado com a imprensa.',
  'General Support': 'Assistência geral',
  'Use the form above so the request is recorded and routed.':
    'Utilize o formulário acima para que o pedido seja registado e encaminhado.',
  'Failed to submit': 'Não foi possível enviar',
  'An unknown error occurred': 'Ocorreu um erro desconhecido',

  'African Market-Entry Intelligence for Global Organizations':
    'Inteligência para a entrada de organizações globais nos mercados africanos',
  'A focused BOA-Story pilot for organizations comparing African markets, documenting risks and preparing evidence-backed entry decisions.':
    'Um projecto-piloto específico da BOA-Story para organizações que comparam mercados africanos, documentam riscos e preparam decisões de entrada sustentadas por dados.',
  'Enterprise market-entry pilot': 'Projecto-piloto empresarial de entrada no mercado',
  'Make an African market-entry decision with evidence you can trace.':
    'Tome uma decisão de entrada num mercado africano com dados rastreáveis.',
  'BOA-Story helps companies, investors, institutions and their advisers compare candidate African markets, identify what is known, expose what is missing and prepare the next diligence decision before capital or operating commitments are made.':
    'A BOA-Story ajuda empresas, investidores, instituições e respectivos consultores a comparar mercados africanos candidatos, identificar o que se sabe, revelar o que falta e preparar a decisão de diligência seguinte antes de assumir compromissos de capital ou operacionais.',
  'Discuss a pilot': 'Debater um projecto-piloto',
  'Review trust disclosures': 'Consultar as informações de confiança',
  'Primary buyer and decision': 'Comprador principal e decisão',
  'Primary buyer': 'Comprador principal',
  'Corporate strategy, investment, growth and market-entry teams worldwide':
    'Equipas de estratégia empresarial, investimento, crescimento e entrada no mercado em todo o mundo',
  'Recurring decision': 'Decisão recorrente',
  'Which country and sector conditions justify deeper entry diligence, and which risks must be resolved first?':
    'Que condições nacionais e sectoriais justificam uma diligência de entrada mais profunda e que riscos devem ser resolvidos primeiro?',
  'Product state': 'Estado do produto',
  'Production-deployed and ready for a bounded design-partner pilot with measurable decision criteria.':
    'Em produção e pronto para um projecto-piloto delimitado com um parceiro de concepção e critérios de decisão mensuráveis.',
  'Enterprise page sections': 'Secções da página empresarial',
  'Who it is for': 'A quem se destina',
  'One buyer, one consequential decision.': 'Um comprador, uma decisão com consequências.',
  'Good pilot fit': 'Perfil adequado ao projecto-piloto',
  'Not represented as': 'Não é apresentado como',
  'Decision workflow': 'Fluxo de decisão',
  'From expansion question to diligence plan.': 'Da questão de expansão ao plano de diligência.',
  'The product is organized around a recurring market-entry decision, not around producing more information.':
    'O produto está organizado em torno de uma decisão recorrente de entrada no mercado, não da produção de mais informação.',
  'Pilot scope': 'Âmbito do projecto-piloto',
  'A bounded four-week evidence pilot.': 'Um projecto-piloto de dados delimitado a quatro semanas.',
  'One target sector, up to three candidate countries and one internal decision. The boundary is deliberate: it makes usefulness measurable and prevents broad platform capability from hiding a weak commercial outcome.':
    'Um sector-alvo, até três países candidatos e uma decisão interna. O limite é deliberado: torna a utilidade mensurável e impede que a amplitude da plataforma oculte um resultado comercial fraco.',
  'Commercial terms': 'Condições comerciais',
  'Fixed scope and fixed fee are proposed after discovery. No public price, SLA or outcome guarantee is claimed until the service model has been validated with design partners.':
    'O âmbito e o preço fixos são propostos após a fase de diagnóstico. Não se anuncia um preço público, um acordo de nível de serviço ou uma garantia de resultados enquanto o modelo de serviço não for validado com parceiros de concepção.',
  'Success measures': 'Medidas de êxito',
  'Measure usefulness before claiming value.': 'Meça a utilidade antes de reivindicar valor.',
  'These are pilot measurement categories, not published customer results. Baselines and targets are agreed with each design partner.':
    'Estas são categorias de medição do projecto-piloto, não resultados publicados de clientes. Os valores de referência e os objectivos são acordados com cada parceiro de concepção.',
  'Commercial status': 'Estado comercial',
  'Ready for a measurable design-partner pilot.': 'Pronto para um projecto-piloto mensurável com um parceiro de concepção.',
  'BOA-Story combines deployed software, evidence controls and client infrastructure in a fixed decision scope. Each pilot records its research baseline, delivery cycle, evidence traceability and unresolved diligence work so the participating organization can assess practical value against its existing process.':
    'A BOA-Story combina software em produção, controlos dos dados e infra-estrutura de cliente num âmbito de decisão fixo. Cada projecto-piloto regista o ponto de partida da investigação, o ciclo de entrega, a rastreabilidade dos dados e o trabalho de diligência por resolver, para que a organização participante possa avaliar o valor prático face ao processo existente.',
  'Apply for a pilot': 'Candidatar-se a um projecto-piloto',
  'Open Trust Center': 'Abrir o Centro de Confiança',
  'Frame the decision': 'Enquadrar a decisão',
  'Define the expansion question, target sector, candidate countries, time horizon, decision owner and evidence threshold before research begins.':
    'Defina a questão de expansão, o sector-alvo, os países candidatos, o horizonte temporal, o responsável pela decisão e o limiar de dados antes do início da investigação.',
  'Build the evidence file': 'Construir o processo de dados',
  'Assemble official indicators, attributed reporting, trade evidence, operating conditions and dated source records for each candidate market.':
    'Reúna indicadores oficiais, reportagens atribuídas, dados comerciais, condições operacionais e registos de fontes datados para cada mercado candidato.',
  'Compare without false precision': 'Comparar sem falsa precisão',
  'Separate directly comparable indicators from proxies, identify contradictions and show where the evidence is too thin to support a conclusion.':
    'Separe os indicadores directamente comparáveis dos indicadores indirectos, identifique contradições e mostre onde os dados são insuficientes para sustentar uma conclusão.',
  'Prepare the decision brief': 'Preparar a síntese de decisão',
  'Deliver a plain-language comparison, risk register, opportunity conditions, source ledger and prioritized diligence questions.':
    'Apresente uma comparação em linguagem clara, um registo de riscos, condições de oportunidade, um livro de fontes e questões de diligência ordenadas por prioridade.',
  'Monitor what could change': 'Acompanhar o que pode mudar',
  'Track new evidence, policy developments and execution signals against the assumptions recorded in the original decision file.':
    'Acompanhe novos dados, desenvolvimentos de política e sinais de execução face aos pressupostos registados no processo de decisão original.',
  'Market-entry question': 'Questão de entrada no mercado',
  'A written decision statement, scope, assumptions and exclusions agreed at the start.':
    'Uma declaração escrita da decisão, do âmbito, dos pressupostos e das exclusões acordada no início.',
  'Three-country evidence dossier': 'Dossiê de dados de três países',
  'A dated comparison of up to three candidate markets for one target sector.':
    'Uma comparação datada de até três mercados candidatos para um sector-alvo.',
  'Executive decision brief': 'Síntese executiva da decisão',
  'A concise finding with evidence boundaries, counter-signals and unresolved questions.':
    'Uma conclusão concisa com limites dos dados, sinais contrários e questões por resolver.',
  'Claim and source ledger': 'Livro de afirmações e fontes',
  'A traceable record connecting material conclusions to the evidence supplied.':
    'Um registo rastreável que liga as conclusões materiais aos dados fornecidos.',
  'Diligence register': 'Registo de diligência',
  'Prioritized questions for legal, tax, regulatory, operating and local-market specialists.':
    'Questões ordenadas por prioridade para especialistas jurídicos, fiscais, regulamentares, operacionais e do mercado local.',
  'Closeout review': 'Revisão de encerramento',
  'A working session to test whether the evidence is sufficient for the next internal decision.':
    'Uma sessão de trabalho para verificar se os dados são suficientes para a próxima decisão interna.',
  'Time to a usable brief': 'Tempo até uma síntese utilizável',
  'Record the baseline research cycle and compare it with the pilot delivery cycle.':
    'Registe o ciclo de investigação de referência e compare-o com o ciclo de entrega do projecto-piloto.',
  'Evidence traceability': 'Rastreabilidade dos dados',
  'Measure how many material claims can be followed to a dated, named source record.':
    'Meça quantas afirmações materiais podem ser seguidas até um registo de fonte identificado e datado.',
  'Decision clarity': 'Clareza da decisão',
  'Confirm whether decision-makers can distinguish known facts, supported interpretation and unresolved risk.':
    'Confirme se os decisores conseguem distinguir factos conhecidos, interpretações sustentadas e riscos por resolver.',
  'Diligence readiness': 'Preparação da diligência',
  'Count the unanswered questions converted into assigned, testable follow-up work.':
    'Conte as questões sem resposta convertidas em trabalho de seguimento atribuído e verificável.',

  'Apply for a Market-Entry Pilot': 'Candidatura a um projecto-piloto de entrada no mercado',
  'Submit a structured application for a measurable BOA-Story African market-entry intelligence pilot.':
    'Apresente uma candidatura estruturada a um projecto-piloto mensurável da BOA-Story para inteligência de entrada nos mercados africanos.',
  'Pilot overview': 'Panorama do projecto-piloto',
  'Structured pilot application': 'Candidatura estruturada ao projecto-piloto',
  'Define the decision before the work begins.': 'Defina a decisão antes do início do trabalho.',
  'This application establishes the markets being compared, the decision to be supported, your present research baseline and the result that would make a pilot useful. It is an application for operator review, not a purchase or a promise of acceptance.':
    'Esta candidatura estabelece os mercados a comparar, a decisão a apoiar, o seu ponto de partida actual de investigação e o resultado que tornaria útil o projecto-piloto. É uma candidatura sujeita à análise de um operador, não uma compra nem uma promessa de aceitação.',
  'Application recorded': 'Candidatura registada',
  'Your decision scope is ready for review.': 'O âmbito da sua decisão está pronto para análise.',
  'The operator inbox now contains the full application and its measurement baseline. Keep the reference below for your records. A human review determines whether the question is sufficiently defined and suitable for a pilot.':
    'A caixa de entrada do operador contém agora a candidatura completa e o respectivo valor de referência. Guarde a referência abaixo. Uma análise humana determinará se a questão está suficientemente definida e se é adequada a um projecto-piloto.',
  'Application reference': 'Referência da candidatura',
  'Status: New — awaiting operator review': 'Estado: nova — aguarda análise do operador',
  'Return to pilot overview': 'Voltar ao panorama do projecto-piloto',
  'Review data and procurement controls': 'Consultar os controlos de dados e contratação',
  'Applicant': 'Candidato',
  'Who owns or materially supports the decision?': 'Quem é responsável pela decisão ou lhe presta apoio material?',
  'Full name': 'Nome completo',
  'Work email': 'Correio electrónico profissional',
  'Role or title': 'Função ou cargo',
  'Organization type': 'Tipo de organização',
  'Decision scope': 'Âmbito da decisão',
  'Describe one decision that can be evaluated within a bounded pilot.':
    'Descreva uma decisão que possa ser avaliada num projecto-piloto delimitado.',
  'Sector or operating category': 'Sector ou categoria operacional',
  'For example: logistics, fintech, agribusiness': 'Por exemplo: logística, tecnologia financeira, agro-indústria',
  'Candidate African markets': 'Mercados africanos candidatos',
  'Name one required market and up to two alternatives. This is deliberately limited to keep the pilot comparable.':
    'Indique um mercado obrigatório e até duas alternativas. O limite é deliberado para manter o projecto-piloto comparável.',
  'Required': 'Obrigatório',
  'First candidate market': 'Primeiro mercado candidato',
  'Second candidate market': 'Segundo mercado candidato',
  'Optional': 'Facultativo',
  'Third candidate market': 'Terceiro mercado candidato',
  'Decision question': 'Questão de decisão',
  'State the decision, not a broad topic. Minimum 20 characters.':
    'Indique a decisão, não um tema amplo. Mínimo de 20 caracteres.',
  'Which market should we prioritize for…': 'Que mercado devemos priorizar para…',
  'Decision deadline, if known': 'Prazo da decisão, se conhecido',
  'Measurement baseline': 'Valor de referência',
  'A useful pilot must be judged against the process it is intended to improve.':
    'Um projecto-piloto útil deve ser avaliado face ao processo que pretende melhorar.',
  'Include the people, sources, time or external support normally involved. Minimum 20 characters.':
    'Inclua as pessoas, fontes, tempo ou apoio externo habitualmente envolvidos. Mínimo de 20 caracteres.',
  'How is this research handled today?': 'Como é realizada actualmente esta investigação?',
  'Examples include time saved, evidence coverage, risks surfaced or decisions narrowed. Minimum 20 characters.':
    'Os exemplos incluem tempo poupado, cobertura dos dados, riscos identificados ou decisões delimitadas. Mínimo de 20 caracteres.',
  'What measurable result would make the pilot useful?':
    'Que resultado mensurável tornaria útil o projecto-piloto?',
  'Information boundary': 'Limite das informações',
  'Do not submit confidential, personal, regulated, privileged or commercially sensitive information. Use a generalized decision description. Detailed material should only be considered after appropriate terms and a separately agreed handling process.':
    'Não envie informações confidenciais, pessoais, regulamentadas, privilegiadas ou comercialmente sensíveis. Utilize uma descrição generalizada da decisão. Os elementos pormenorizados só devem ser considerados após a definição de condições adequadas e de um processo de tratamento acordado separadamente.',
  'I confirm that this application contains no confidential or sensitive information.':
    'Confirmo que esta candidatura não contém informações confidenciais nem sensíveis.',
  'Review sequence': 'Sequência de análise',
  'Before applying': 'Antes da candidatura',
  'Review the public pilot scope and current controls. The application does not create a service contract, guarantee acceptance or establish that BOA-Story has delivered a verified client outcome.':
    'Consulte o âmbito público do projecto-piloto e os controlos actuais. A candidatura não cria um contrato de serviço, não garante a aceitação nem demonstra que a BOA-Story tenha produzido um resultado verificado para um cliente.',
  'Read the pilot scope': 'Ler o âmbito do projecto-piloto',
  'Open the Trust Center': 'Abrir o Centro de Confiança',
  'Company or corporate team': 'Empresa ou equipa empresarial',
  'Exporter or trade operator': 'Exportador ou operador comercial',
  'Professional adviser': 'Consultor profissional',
  'Investor or financial institution': 'Investidor ou instituição financeira',
  'Public-sector institution': 'Instituição do sector público',
  'Nonprofit or development organization': 'Organização sem fins lucrativos ou de desenvolvimento',
  'Other organization': 'Outra organização',
  'Confirm that the application contains no confidential or sensitive information.':
    'Confirme que a candidatura não contém informações confidenciais nem sensíveis.',
  'The application could not be recorded. Please try again.':
    'Não foi possível registar a candidatura. Tente novamente.',

  'Current BOA-Story security controls, infrastructure, data handling, service health and procurement disclosures.':
    'Controlos actuais de segurança, infra-estrutura, tratamento de dados, estado do serviço e informações de contratação da BOA-Story.',
  'Trust Center': 'Centro de Confiança',
  'Security, data handling and operational evidence.': 'Segurança, tratamento de dados e provas operacionais.',
  'Review the controls operating today, the data services involved and the procurement questions that should be resolved for a specific deployment.':
    'Consulte os controlos actualmente em funcionamento, os serviços de dados envolvidos e as questões de contratação que devem ser resolvidas para uma instalação específica.',
  'View live deep health': 'Consultar o estado técnico pormenorizado',
  'Request a security review': 'Pedir uma análise de segurança',
  'Trust Center sections': 'Secções do Centro de Confiança',
  'Implemented today': 'Implementado actualmente',
  'Product and operational controls.': 'Controlos do produto e das operações.',
  'These statements describe repository behavior and deployed health checks. They are not third-party attestations.':
    'Estas declarações descrevem o comportamento do repositório e as verificações de estado instaladas. Não constituem atestados de terceiros.',
  'Procurement disclosures': 'Informações de contratação',
  'What an enterprise buyer should not assume.': 'O que um comprador empresarial não deve pressupor.',
  "Missing assurances are stated directly so a pilot can be scoped around the buyer's actual risk requirements.":
    'As garantias em falta são indicadas directamente, para que o projecto-piloto seja delimitado segundo os requisitos de risco efectivos do comprador.',
  'Data map': 'Mapa dos dados',
  'Where platform data is processed.': 'Onde são tratados os dados da plataforma.',
  'The production architecture is Cloudflare-native. Optional specialist services receive only the material needed for the configured task.':
    'A arquitectura de produção assenta na Cloudflare. Os serviços especializados facultativos recebem apenas os elementos necessários à tarefa configurada.',
  'Operational evidence': 'Provas operacionais',
  'Lightweight, liveness, readiness and deep-health endpoints are public.':
    'Os pontos de acesso de estado básico, actividade, prontidão e estado pormenorizado são públicos.',
  'Worker telemetry persists in D1 and is pruned after seven days.':
    'A telemetria dos processos é guardada em D1 e eliminada após sete dias.',
  'Publishing, translation and optimization queues have bounded retries.':
    'As filas de publicação, tradução e optimização têm um número limitado de novas tentativas.',
  'R2 is preferred for media; the current Alyssa deployment reports healthy KV media fallback.':
    'O R2 é preferido para conteúdos multimédia; a instalação Alyssa actual comunica um recurso alternativo KV saudável.',
  'The current deployment reports degraded email delivery because no verified sender is configured.':
    'A instalação actual comunica uma entrega de correio electrónico degradada porque não está configurado um remetente verificado.',
  'Before sensitive or regulated use': 'Antes de uma utilização sensível ou regulamentada',
  'A buyer should complete a security review, define permitted data, agree retention and deletion requirements, establish incident contacts, determine contractual service levels and confirm whether independent testing or certification is mandatory. BOA-Story should not receive confidential, regulated or personal datasets until those controls are agreed.':
    'O comprador deve concluir uma análise de segurança, definir os dados permitidos, acordar requisitos de conservação e eliminação, estabelecer contactos para incidentes, determinar níveis de serviço contratuais e confirmar se são obrigatórios ensaios ou certificações independentes. A BOA-Story não deve receber conjuntos de dados confidenciais, regulamentados ou pessoais enquanto esses controlos não estiverem acordados.',
  'Privacy policy': 'Política de privacidade',
  'Contact for review': 'Contacto para análise',
  'Administrative routes require an administrator key or administrator-authorized token.':
    'As rotas administrativas exigem uma chave de administrador ou um testemunho autorizado por um administrador.',
  'Client passwords and API keys are stored as hashes; newly provisioned raw API keys are returned once.':
    'As palavras-passe dos clientes e as chaves da API são guardadas sob a forma de resumos criptográficos; as novas chaves originais da API são devolvidas uma única vez.',
  'State-changing browser requests are protected by origin and CSRF checks.':
    'Os pedidos do navegador que alteram o estado são protegidos por verificações de origem e CSRF.',
  'Production error responses use request identifiers and do not return internal exception details.':
    'As respostas de erro de produção utilizam identificadores de pedido e não devolvem pormenores de excepções internas.',
  'Content is quarantined until a separate source-grounded editorial audit approves publication.':
    'O conteúdo permanece em quarentena até que uma auditoria editorial separada e sustentada por fontes aprove a publicação.',
  'Translation, audio, reporting and publication outputs are checked through deep health, not binding reachability alone.':
    'Os resultados de tradução, áudio, elaboração de relatórios e publicação são verificados pelo estado técnico pormenorizado, e não apenas pela acessibilidade das ligações.',
  'Scheduled jobs are isolated so one service failure does not terminate unrelated maintenance work.':
    'As tarefas programadas são isoladas para que a falha de um serviço não interrompa trabalhos de manutenção sem relação entre si.',
  'Deployment secrets and account-specific Cloudflare bindings are excluded from source control.':
    'Os segredos da instalação e as ligações Cloudflare específicas de cada conta são excluídos do controlo de versões.',
  'SOC 2 and ISO 27001': 'SOC 2 e ISO 27001',
  'Not certified': 'Não certificado',
  'BOA-Story does not currently claim SOC 2 or ISO 27001 certification.':
    'A BOA-Story não declara actualmente certificação SOC 2 ou ISO 27001.',
  'Independent penetration test': 'Teste de penetração independente',
  'Not yet claimed': 'Ainda não declarado',
  'No current third-party penetration-test report or attestation is published.':
    'Não está publicado qualquer relatório ou atestado actual de teste de penetração realizado por terceiros.',
  'Data-processing agreement': 'Acordo de tratamento de dados',
  'Not standardized': 'Não normalizado',
  'A production DPA is not presently offered as a standard self-serve document. Pilot data requirements must be reviewed before contract.':
    'Não é actualmente disponibilizado um acordo de tratamento de dados de produção como documento normalizado de auto-serviço. Os requisitos de dados do projecto-piloto devem ser analisados antes do contrato.',
  'Service-level agreement': 'Acordo de nível de serviço',
  'No public SLA': 'Sem acordo público de nível de serviço',
  'The public service has health monitoring and failure isolation, but no contractual uptime or support-response commitment is published.':
    'O serviço público dispõe de monitorização de estado e isolamento de falhas, mas não publica um compromisso contratual de disponibilidade ou prazo de resposta da assistência.',
  'Accessibility conformance': 'Conformidade de acessibilidade',
  'No external attestation': 'Sem atestado externo',
  'The product uses responsive layouts, keyboard-focus states and semantic controls, but no VPAT or independent WCAG audit is claimed.':
    'O produto utiliza disposições adaptáveis, estados de foco por teclado e controlos semânticos, mas não declara um VPAT nem uma auditoria WCAG independente.',
  'Business continuity': 'Continuidade da actividade',
  'Technical resilience implemented': 'Resiliência técnica implementada',
  'The platform uses Cloudflare-managed services, queues, retries, fallbacks and internal recovery. A customer-facing BCP/DR policy is not yet published.':
    'A plataforma utiliza serviços geridos pela Cloudflare, filas, novas tentativas, mecanismos alternativos e recuperação interna. Ainda não está publicada uma política de continuidade e recuperação destinada aos clientes.',
  'Source and editorial quality': 'Qualidade das fontes e editorial',
  'Controls documented': 'Controlos documentados',
  'Attribution, evidence boundaries, editorial audit, translation validation and publication-quality checks are implemented.':
    'Estão implementados a atribuição, os limites dos dados, a auditoria editorial, a validação das traduções e os controlos de qualidade da publicação.',
  'Insurance and legal assurance': 'Seguro e garantia jurídica',
  'Not represented': 'Não declarado',
  'No professional-liability coverage, legal opinion or investment-advice authorization is represented on this site.':
    'Este sítio não declara cobertura de responsabilidade profissional, parecer jurídico nem autorização para aconselhamento de investimento.',
  'Articles, sources, country records, preferences, account records, audit history and operational metadata.':
    'Artigos, fontes, registos nacionais, preferências, registos de conta, histórico de auditoria e metadados operacionais.',
  'Cache and session-related values; it also stores media when R2 is unavailable in the selected account.':
    'Valores relacionados com memória intermédia e sessões; também guarda conteúdos multimédia quando o R2 não está disponível na conta seleccionada.',
  'Embeddings used for semantic retrieval.': 'Representações vectoriais utilizadas na pesquisa semântica.',
  'Operational and usage events used to observe platform behavior.':
    'Eventos operacionais e de utilização usados para observar o comportamento da plataforma.',
  'Specialist processing services': 'Serviços especializados de tratamento',
  'The minimum supplied evidence required for translation, classification, speech or retrieval tasks.':
    'O conjunto mínimo de dados fornecidos necessário para tarefas de tradução, classificação, voz ou pesquisa.',

  'About BOA-Story': 'Sobre a BOA-Story',
  'Strategic implication': 'Implicação estratégica',
  'Supported takeaways': 'Conclusões sustentadas',
  'The deeper decision brief': 'A síntese de decisão aprofundada',
  'What still needs verification': 'O que ainda exige verificação',

  'Concierge & Corporate Services': 'Concierge e serviços empresariais',
  'Executive Travel': 'Viagens executivas',
  'Market Entry Support': 'Apoio à entrada no mercado',
  'Multi-City Package': 'Pacote para várias cidades',
  'Our Expertise': 'A nossa especialização',
  'Planning support for multi-city visits, including requirements that may need licensed guides, translators or transport providers.':
    'Apoio ao planeamento de visitas a várias cidades, incluindo requisitos que possam exigir guias, intérpretes ou transportadores licenciados.',
  'Primary Destination(s)': 'Destino ou destinos principais',
  'Private Client Services': 'Serviços para clientes privados',
  'Request Received': 'Pedido recebido',
  'Site Visit Coordination': 'Coordenação de visitas ao local',
  'Site Visits': 'Visitas ao local',
  'Specific Requirements & Dates': 'Requisitos e datas específicos',
  'Submit Another Request': 'Enviar outro pedido',
  'Submit an Inquiry': 'Enviar um pedido',

  'Checked': 'Verificado',
  'Country reporting brief': 'Síntese de informação nacional',
  'Current-account balance ·': 'Saldo da balança corrente ·',
  'Every value keeps the period published by its provider. The retrieval date records when BOA checked the source; it never makes an older observation look new.':
    'Cada valor mantém o período publicado pelo fornecedor. A data de recolha regista quando a BOA verificou a fonte; nunca apresenta uma observação antiga como se fosse nova.',
  'Evidence quality': 'Qualidade dos dados',
  'Evidence status': 'Estado dos dados',
  'Exports ·': 'Exportações ·',
  'Imports ·': 'Importações ·',
  'Member evidence dossier': 'Dossiê de dados para membros',
  'Observation period:': 'Período de observação:',
  'Official country evidence': 'Dados nacionais oficiais',
  'Published evidence': 'Dados publicados',
  'Recorded difference': 'Diferença registada',
  'Sectors evidenced': 'Sectores documentados',
  'Source-linked country reporting': 'Informação nacional ligada às fontes',
  'Sources checked': 'Fontes verificadas',
  'Sources:': 'Fontes:',
  'source records reviewed': 'registos de fontes analisados',
  'All 54 country hubs are open in member preview.':
    'Os centros dos 54 países estão abertos na antevisão para membros.',
  'Continental dashboard': 'Painel continental',
  'Continue through the continental index': 'Continuar pelo índice continental',

  'BOA-Story Network': 'Rede BOA-Story',
  'Check back later for newly scheduled summits.': 'Volte mais tarde para consultar novas cimeiras agendadas.',
  'Confirmation code': 'Código de confirmação',
  'Event records could not be loaded': 'Não foi possível carregar os registos de eventos',
  'Exclusive': 'Exclusivo',
  'Loading scheduled events…': 'A carregar os eventos agendados…',
  'Media/Press': 'Comunicação social/imprensa',
  'No upcoming events': 'Sem eventos próximos',
  'Register Interest': 'Registar interesse',
  'Standard Pass': 'Passe normal',
  'Summits & Executive Forums': 'Cimeiras e fóruns executivos',
  'The service did not return a verified schedule. No placeholder events are being shown.':
    'O serviço não devolveu um calendário verificado. Não são apresentados eventos fictícios.',
  'Ticket Type': 'Tipo de bilhete',
  'VIP Delegate': 'Delegado VIP',
  "You're on the list!": 'Está na lista!',
  'Your registration is stored. Keep this confirmation code for attendance enquiries.':
    'A sua inscrição está guardada. Conserve este código de confirmação para questões relativas à participação.',

  'Curated for You': 'Seleccionado para si',
  'Current briefing': 'Síntese actual',
  'Latest Dispatches': 'Últimas publicações',
  'Make the briefing yours': 'Adapte a síntese aos seus interesses',
  'Set your briefing preferences': 'Definir as preferências da síntese',
  'Source-attributed coverage': 'Cobertura com fontes atribuídas',
  'Top Story': 'História principal',
  'to unlock a personalised briefing.': 'para abrir uma síntese personalizada.',
  'Browse all reporting': 'Consultar todas as reportagens',
  'Photo desk': 'Gabinete de fotografia',
  'Source record ·': 'Registo da fonte ·',
  'The reporting, seen at its source.': 'A reportagem vista na sua fonte.',

  'All stories': 'Todas as histórias',
  'Built for consequential decisions': 'Concebido para decisões com consequências',
  'Choose interests': 'Escolher interesses',
  'Enter Intelligence': 'Entrar na inteligência',
  'Explore the market-entry pilot': 'Explorar o projecto-piloto de entrada no mercado',
  'From signal to continental context.': 'Do sinal ao contexto continental.',
  'Independent by design': 'Independente por concepção',
  'Latest reporting': 'Reportagens mais recentes',
  'Stories worth your time': 'Histórias que merecem o seu tempo',
  'Support once': 'Apoiar uma vez',
  'Support reporting built for the long view.': 'Apoie reportagens concebidas para uma perspectiva de longo prazo.',
  'The intelligence platform': 'A plataforma de inteligência',
  'View membership': 'Consultar a adesão',

  'Add': 'Adicionar',
  'Decision Workspace': 'Área de trabalho de decisão',
  'Decision flow': 'Fluxo de decisão',
  'Evidence file': 'Processo de dados',
  'Export workspace': 'Exportar a área de trabalho',
  'Monitor': 'Acompanhar',
  'No monitored subjects yet.': 'Ainda não existem assuntos acompanhados.',
  'Priority watchlist': 'Lista de acompanhamento prioritária',
  'Saved research': 'Investigação guardada',

  'Buy me a coffee': 'Ofereça-me um café',
  'Coverage Breakdown': 'Distribuição da cobertura',
  'Coverage data is loading as stories are published.':
    'Os dados de cobertura são carregados à medida que as histórias são publicadas.',
  'Every editorial decision above has a story attached to it. Read them here.':
    'Cada decisão editorial acima tem uma história associada. Leia-as aqui.',
  'Ko-fi goal progress': 'Progresso do objectivo no Ko-fi',
  'No updates available right now.': 'Não existem actualizações neste momento.',
  'Read the work': 'Ler o trabalho',
  'Reporting activity ledger': 'Registo da actividade de reportagem',
  'Reporting activity,': 'Actividade de reportagem,',
  'See the stories behind all of this.': 'Veja as histórias que sustentam tudo isto.',
  'Topics being covered': 'Temas abrangidos',
  'View Trends': 'Ver tendências',
  "Where we're reporting": 'Onde estamos a fazer reportagem',
  'backers only': 'apenas para apoiantes',
  'of $': 'de $',
  'on the record.': 'registada.',

  '. Entering it below will authorize this device.':
    '. Ao introduzi-lo abaixo, autorizará este dispositivo.',
  'Access Expired': 'Acesso expirado',
  'Access your': 'Aceda à sua',
  'Check your email': 'Consulte o seu correio electrónico',
  'Continue': 'Continuar',
  'Enter the email address associated with your Ko-fi membership.':
    'Introduza o endereço de correio electrónico associado à sua adesão no Ko-fi.',
  'Founding Members': 'Membros fundadores',
  'Intelligence.': 'Inteligência.',
  'New code sent, check your inbox.': 'Foi enviado um novo código; consulte a sua caixa de entrada.',
  'Not a member yet?': 'Ainda não é membro?',
  'Re-enter member email': 'Voltar a introduzir o endereço do membro',
  'Renew on Ko-fi →': 'Renovar no Ko-fi →',
  'Unlock Access on Ko-fi →': 'Abrir o acesso no Ko-fi →',
  'Unrestricted': 'Sem restrições',
  'Your 30-day access token has expired. Re-enter your member email to get a fresh one, or renew your membership on Ko-fi.':
    'O seu testemunho de acesso de 30 dias expirou. Volte a introduzir o endereço de correio electrónico de membro para obter um novo, ou renove a adesão no Ko-fi.',

  '&apos;s market position': ' — posição no mercado',
  'Audit trail': 'Rasto de auditoria',
  'Build a defensible market narrative': 'Construir uma narrativa de mercado defensável',
  'Country market evidence toolkit': 'Instrumentos de dados do mercado nacional',
  'Current-account balance': 'Saldo da balança corrente',
  'Current-account value': 'Valor da balança corrente',
  'Do not overclaim': 'Não exagere as conclusões',
  'Evidence first. Interpretation second. Verification before action.':
    'Primeiro os dados. Depois a interpretação. Verificação antes da acção.',
  'Evidence-to-action framework': 'Quadro dos dados à acção',
  'External position': 'Posição externa',
  'How to use it': 'Como utilizar',
  'Latest evidence': 'Dados mais recentes',
  'Observation': 'Observação',
  'Official economic record': 'Registo económico oficial',
  'Official-source refresh in progress': 'Actualização das fontes oficiais em curso',
  'Read the indicators with context': 'Ler os indicadores no seu contexto',
  'Return to': 'Voltar a',
  'Sector evidence collection is active': 'A recolha de dados sectoriais está activa',
  'Sector research map': 'Mapa de investigação sectorial',
  'Start here': 'Começar aqui',
  'The country record remains accessible while the platform retrieves the first verified provider snapshot. No placeholder value is substituted.':
    'O registo nacional permanece acessível enquanto a plataforma recolhe o primeiro instantâneo verificado do fornecedor. Não é utilizado qualquer valor fictício.',
  'The verified external-sector record is being refreshed; the platform does not manufacture a zero or estimate.':
    'O registo verificado do sector externo está a ser actualizado; a plataforma não inventa um zero nem uma estimativa.',
  'These counts measure source-linked BOA research records for':
    'Estas contagens medem os registos de investigação da BOA ligados às fontes para',
  'This sequence helps a policy, investment or communications team turn verified evidence into an understandable position without overstating what the data proves.':
    'Esta sequência ajuda uma equipa de política, investimento ou comunicação a transformar dados verificados numa posição compreensível sem exagerar o que os dados demonstram.',
  'Upcoming verification touchpoints': 'Próximos momentos de verificação',
  'Verified source assembly continues': 'A reunião de fontes verificadas prossegue',
  'What it measures': 'O que mede',
  'Where the evidence base is deepest': 'Onde a base de dados é mais profunda',
  'country hub': 'centro do país',

  'Expect your first dispatch on Sunday. In the meantime, dive into our latest stories.':
    'Receberá a primeira publicação no Domingo. Entretanto, leia as nossas histórias mais recentes.',
  'Free weekly dispatches, cities, founders, opportunities. No noise. Unsubscribe anytime.':
    'Publicações semanais gratuitas sobre cidades, fundadores e oportunidades. Sem ruído. Cancele quando quiser.',
  'No spam. Unsubscribe anytime.': 'Sem mensagens indesejadas. Cancele quando quiser.',
  'Read latest stories': 'Ler as histórias mais recentes',
  'Ready to go deeper?': 'Pronto para aprofundar?',
  'Sample Dispatch': 'Exemplo de publicação',
  'Sunday · 5 min read': 'Domingo · 5 min de leitura',
  'Support the project on Ko-fi.': 'Apoie o projecto no Ko-fi.',
  'Weekly briefing': 'Síntese semanal',
  "You're on the list": 'Está na lista',
  "You've been unsubscribed — no more dispatches will be sent to that address. Changed your mind? Sign up again below.":
    'A subscrição foi cancelada — não serão enviadas mais publicações para esse endereço. Mudou de ideias? Volte a inscrever-se abaixo.',

  'All briefing reports': 'Todos os relatórios de síntese',
  'Archive building': 'Arquivo em construção',
  'Legacy record': 'Registo anterior',
  'Prepared': 'Preparado',
  'Report request failed': 'O pedido do relatório falhou',
  'Report unavailable': 'Relatório inacessível',
  'Section': 'Secção',
  'The briefing archive could not be loaded.': 'Não foi possível carregar o arquivo de sínteses.',
  'The first scheduled briefs have not been stored yet.':
    'As primeiras sínteses programadas ainda não foram guardadas.',
  'This briefing could not be loaded.': 'Não foi possível carregar esta síntese.',
  'This report predates structured storage.': 'Este relatório é anterior ao armazenamento estruturado.',

  'Continue through the evidence index': 'Continuar pelo índice de dados',
  'No results for "': 'Sem resultados para «',
  'Research answer': 'Resposta da investigação',
  'Start with a country, sector, company, project or decision question.':
    'Comece por um país, sector, empresa, projecto ou questão de decisão.',
  'Try different keywords or a broader search term': 'Experimente palavras-chave diferentes ou um termo de pesquisa mais amplo',
  'What are you researching?': 'O que está a investigar?',

  '% CTR': '% de CTR',
  'Budget:': 'Orçamento:',
  'Campaign Analytics': 'Análise da campanha',
  'Campaign records are isolated by sponsoring organization.':
    'Os registos da campanha são isolados por organização patrocinadora.',
  'Clicks': 'Cliques',
  'Configured Budget': 'Orçamento configurado',
  'Corporate Partner Portal': 'Portal do parceiro empresarial',
  'Delivery Trajectory': 'Evolução da entrega',
  'First-party delivery records for sponsored content, with no inferred return or impact score.':
    'Registos próprios da entrega de conteúdo patrocinado, sem rendibilidade inferida nem pontuação de impacto.',
  'How this is measured': 'Como é medido',
  'Impressions': 'Impressões',
  'Inquire About Sponsorships': 'Pedir informações sobre patrocínios',
  'Member preview opens subscriber editorial benefits, but it does not expose private partner campaign data. Sign in with the sponsoring organization’s authorized account to retrieve its delivery record.':
    'A antevisão para membros abre as vantagens editoriais dos subscritores, mas não expõe dados privados das campanhas dos parceiros. Inicie sessão com a conta autorizada da organização patrocinadora para obter o respectivo registo de entrega.',
  'No Active Campaigns': 'Sem campanhas activas',
  'No delivery recorded yet': 'Ainda não existe entrega registada',
  'Partner authorization required': 'É necessária autorização do parceiro',
  'Sponsor Dashboard': 'Painel do patrocinador',

  '5 min read': '5 min de leitura',
  'Verified source record': 'Registo de fonte verificado',
  'A geographically balanced starting point for comparing business-travel options.':
    'Um ponto de partida geograficamente equilibrado para comparar opções de viagens de negócios.',
  'Business Travel Guide': 'Guia de viagens de negócios',
  'Business-travel starting points': 'Pontos de partida para viagens de negócios',
  'Human Research Support': 'Apoio humano à investigação',
  'Request Custom Itinerary': 'Pedir um itinerário personalizado',
  'Request itinerary research': 'Pedir investigação de itinerário',
  'Research Shortlist': 'Lista restrita da investigação',
  'Research disclosure:': 'Informação sobre a investigação:',
  'Submit a brief for itinerary research. A request is not a booking or a promise of rates, benefits or availability.':
    'Envie uma síntese para investigação do itinerário. Um pedido não é uma reserva nem uma promessa de preços, vantagens ou disponibilidade.',
  'Travel with confidence.': 'Viaje com confiança.',
  'Verify Current Conditions': 'Verificar as condições actuais',
  'Last updated': 'Última actualização',
  'Latest results': 'Resultados mais recentes',
  'Live': 'Em directo',
  'Next fixture': 'Próximo encontro',
  'Still standing': 'Ainda em competição',
  'Upcoming fixtures': 'Próximos encontros',

  '; its change from the previous available value is':
    '; a sua variação face ao valor anterior disponível é',
  'Highest recorded values': 'Valores registados mais elevados',
  'How the figures were prepared': 'Como foram preparados os valores',
  'How widespread the direction is:': 'Amplitude geográfica da direcção:',
  'Important caution:': 'Advertência importante:',
  'Lowest recorded values': 'Valores registados mais baixos',
  'Main measure': 'Indicador principal',
  'Middle reading from': 'Leitura central de',
  'No single number explains a sector. These measures add information about structure, access, capacity, cost or operating conditions. Their different units must remain separate.':
    'Nenhum número isolado explica um sector. Estes indicadores acrescentam informação sobre estrutura, acesso, capacidade, custo ou condições operacionais. As suas diferentes unidades devem permanecer separadas.',
  'Official sector-performance guide': 'Guia oficial de desempenho sectorial',
  'Official snapshot retrieved': 'Instantâneo oficial recolhido em',
  'Questions the numbers cannot answer alone': 'Questões a que os números não podem responder sozinhos',
  'Return to Market Intelligence or retry the official-data request.':
    'Volte à Inteligência de Mercado ou repita o pedido de dados oficiais.',
  'Supporting evidence': 'Dados complementares',
  'The result in plain language': 'O resultado em linguagem clara',
  'The sector-performance dossier could not be loaded.':
    'Não foi possível carregar o dossiê de desempenho sectorial.',
  'These lists show only the main measure. “Highest” does not automatically mean strongest, safest or most attractive.':
    'Estas listas mostram apenas o indicador principal. «Mais elevado» não significa automaticamente mais forte, mais seguro ou mais atractivo.',
  'Three other measures to read alongside the main one':
    'Três outros indicadores para ler juntamente com o principal',
  'Typical reporting country:': 'País declarante típico:',
  'What it cannot prove:': 'O que não pode provar:',
  'What it cannot tell you by itself:': 'O que não pode indicar por si só:',
  'What the evidence establishes': 'O que os dados estabelecem',
  'What this means:': 'O que isto significa:',
  'What to investigate next': 'O que investigar a seguir',
  'country series.': 'séries nacionais.',
  'the middle value is': 'o valor central é',

  // Shared navigation, accessibility, media and account states.
  'Primary navigation': 'Navegação principal',
  'Primary mobile navigation': 'Navegação principal em dispositivo móvel',
  'Toggle menu': 'Abrir ou fechar o menu',
  'Sections': 'Secções',
  'Sections on this page': 'Secções desta página',
  'Menu & top': 'Menu e início',
  'Return to the main menu and top of page': 'Voltar ao menu principal e ao início da página',
  'Close section menu': 'Fechar o menu de secções',
  'BOA-Story home': 'Página inicial da BOA-Story',
  'Footer': 'Rodapé',
  'Privacy': 'Privacidade',
  'Terms': 'Termos',
  'Trust': 'Confiança',
  'Enterprise': 'Empresas',
  'Support BOA': 'Apoiar a BOA',
  'Support independent reporting': 'Apoiar a informação independente',
  'African evidence, reporting and context in one place.': 'Dados, informação e contexto africanos num só lugar.',
  'Independent reporting, country records and market intelligence designed to make complex developments understandable without reducing them to unsupported claims.':
    'Informação independente, registos nacionais e inteligência de mercado concebidos para tornar compreensíveis evoluções complexas, sem as reduzir a afirmações sem fundamento.',
  'BOA-Story. All rights reserved.': 'BOA-Story. Todos os direitos reservados.',
  'Best of Africa. All rights reserved.': 'Best of Africa. Todos os direitos reservados.',
  'Alerts': 'Alertas',
  'All read': 'Tudo lido',
  'No notifications yet': 'Ainda não há notificações',
  "We'll alert you when new intelligence matches your interests": 'Enviaremos um alerta quando houver nova informação correspondente aos seus interesses',
  'Manage alert preferences →': 'Gerir preferências de alertas →',
  'Add to Audio Queue': 'Adicionar à fila de áudio',
  'Save for Later': 'Guardar para mais tarde',
  'Source-linked reporting': 'Informação ligada às fontes',
  'Featured': 'Em destaque',
  'Back 15 seconds': 'Recuar 15 segundos',
  'Forward 15 seconds': 'Avançar 15 segundos',
  'Previous track': 'Faixa anterior',
  'Next track': 'Faixa seguinte',
  'Close player': 'Fechar o leitor',
  'Playback speed': 'Velocidade de reprodução',
  'Show queue': 'Mostrar a fila',
  'Up Next': 'A seguir',
  'Volume level': 'Nível do volume',
  'Checking audio availability...': 'A verificar a disponibilidade do áudio...',
  'Preparing audio...': 'A preparar o áudio...',
  'Generate Audio': 'Gerar áudio',
  'Listen to article': 'Ouvir o artigo',
  'Listen to this story': 'Ouvir esta história',

  // Entry pages, briefing, search and saved library.
  'Intelligence for decisions across Africa.': 'Inteligência para decisões em toda a África.',
  'One Africa briefing. Your countries and sectors.': 'Uma síntese sobre África. Os seus países e sectores.',
  'Open Africa Briefing': 'Abrir a síntese sobre África',
  'For diaspora and globally connected readers': 'Para a diáspora e leitores ligados ao mundo',
  'For organizations worldwide deciding which African market deserves deeper entry diligence—and which risks must be resolved first.':
    'Para organizações de todo o mundo que decidem que mercado africano exige uma análise de entrada mais profunda — e que riscos devem ser resolvidos primeiro.',
  'Structured country intelligence, market coverage and decision-ready briefings for investors, companies, governments and institutions operating across the continent.':
    'Inteligência nacional estruturada, cobertura de mercados e sínteses prontas para apoiar decisões de investidores, empresas, governos e instituições que actuam no continente.',
  'Follow current, source-attributed reporting without reconciling fragmented sources yourself. Start with the concise briefing, then move into country records and official market evidence when you need more depth.':
    'Acompanhe informação actual atribuída às fontes sem ter de conciliar registos fragmentados. Comece pela síntese concisa e passe depois aos registos nacionais e aos dados oficiais de mercado quando precisar de maior profundidade.',
  'Move from live reporting to country intelligence and continent-wide evidence without switching products.':
    'Passe da informação em directo para a inteligência nacional e para os dados de todo o continente sem mudar de produto.',
  'Membership funds the reporting, infrastructure and research behind BOA-Story.':
    'A subscrição financia a informação, a infra-estrutura e a investigação da BOA-Story.',
  'Your Africa Briefing': 'A sua síntese sobre África',
  'Return here for a concise view of the latest verified reporting, then follow the evidence into the countries and sectors relevant to you.':
    'Regresse aqui para uma visão concisa da informação verificada mais recente e siga depois os dados relativos aos países e sectores que lhe interessam.',
  'Set your country and sector preferences': 'Defina as suas preferências de países e sectores',
  'Choose the countries and sectors you follow to assemble a more relevant briefing from the reporting currently available.':
    'Escolha os países e sectores que acompanha para reunir uma síntese mais pertinente a partir da informação actualmente disponível.',
  'Search stories, countries, topics...': 'Pesquisar histórias, países e temas...',
  'No results found. Press Enter to search.': 'Não foram encontrados resultados. Prima Enter para pesquisar.',
  'Latest Updates': 'Actualizações mais recentes',
  'Country Stories': 'Histórias por país',
  'Market Sector': 'Sector de mercado',
  'Open Analyst Console': 'Abrir a consola de análise',
  'Search countries, sectors or companies': 'Pesquisar países, sectores ou empresas',
  'Search the intelligence graph': 'Pesquisar o grafo de inteligência',
  'Intelligence Search': 'Pesquisa de inteligência',
  'This search request did not complete. Country records and the latest source-linked reporting remain available directly.':
    'Não foi possível concluir esta pesquisa. Os registos nacionais e a informação mais recente ligada às fontes continuam disponíveis directamente.',
  'Search saved items...': 'Pesquisar elementos guardados...',
  'Organise evidence, monitor priority markets and carry research into the next decision.':
    'Organize os dados, acompanhe os mercados prioritários e leve a investigação até à decisão seguinte.',
  'Track countries, sectors, companies, projects, regulations or corridors important to your mandate.':
    'Acompanhe países, sectores, empresas, projectos, regulamentos ou corredores importantes para o seu mandato.',
  'Remove from saved': 'Retirar dos elementos guardados',

  // Articles, countries and evidence interpretation.
  'A source-bounded reading of the article’s established facts, implications, limitations and unresolved verification questions.':
    'Uma leitura limitada às fontes sobre os factos estabelecidos pelo artigo, as implicações, as limitações e as questões de verificação ainda por resolver.',
  'Evidence and implications': 'Dados e implicações',
  'Limits and counter-signals': 'Limites e sinais contrários',
  'Open claim ledger': 'Abrir o registo de afirmações',
  'Additional context': 'Contexto adicional',
  'Evidence table': 'Quadro de dados',
  'Country Landscape': 'Panorama nacional',
  'Economic and trade record': 'Registo económico e comercial',
  'Inspect source window': 'Consultar o período das fontes',
  'Sign in to inspect source coverage, review status, methodology and known evidence limitations. BOA does not display fabricated preview scores.':
    'Inicie sessão para consultar a cobertura das fontes, o estado da revisão, a metodologia e as limitações conhecidas dos dados. A BOA não apresenta pontuações de demonstração fabricadas.',
  'The country evidence request did not complete. The published stories, sector coverage and official country record on this page remain the current source layer.':
    'Não foi possível concluir o pedido de dados nacionais. As histórias publicadas, a cobertura sectorial e o registo oficial do país nesta página continuam a constituir a base documental actual.',
  'projection': 'projecção',
  'observation': 'observação',
  'of GDP': 'do PIB',
  'Choose any country above to inspect its full reporting and intelligence record.':
    'Escolha um dos países acima para consultar o respectivo registo completo de informação e inteligência.',
  'Search evidence': 'Pesquisar dados',
  'The directory request did not complete. The continental evidence dashboard and source-linked search remain open.':
    'Não foi possível concluir o pedido ao directório. O painel continental de dados e a pesquisa ligada às fontes continuam disponíveis.',

  // Market intelligence, country dossiers and structured reports.
  'A transparent ledger of what was published, which markets and sectors were covered, and which attributed sources appear in the current evidence file.':
    'Um registo transparente do que foi publicado, dos mercados e sectores abrangidos e das fontes atribuídas que constam do processo documental actual.',
  'Backers see exactly which countries and topics are getting research attention, updated as new stories are added.':
    'Os apoiantes vêem exactamente que países e temas recebem atenção da investigação, com actualização à medida que são acrescentadas novas histórias.',
  'Where we’re reporting': 'Onde estamos a acompanhar',
  'Countries in focus': 'Países em destaque',
  'Open to all · No login required': 'Aberto a todos · Não é necessário iniciar sessão',
  'Country briefs and sector analyses, structured for reading.': 'Sínteses nacionais e análises sectoriais, estruturadas para leitura.',
  'Every report is stored and served as structured sections — narrative, tables and definitions rendered natively, never as raw generated markup.':
    'Cada relatório é guardado e apresentado em secções estruturadas — narrativa, quadros e definições apresentados nativamente, nunca como marcação em bruto.',
  'Country briefs and sector analyses are produced by the daily reporting worker and appear here once stored.':
    'As sínteses nacionais e as análises sectoriais são preparadas pelo serviço diário de informação e surgem aqui depois de guardadas.',
  'Open structured report': 'Abrir o relatório estruturado',
  'Reports generated before the structured-report rebuild stored no readable sections. New scheduled runs store full narrative and data sections.':
    'Os relatórios anteriores à reconstrução do formato estruturado não guardaram secções legíveis. As novas execuções programadas guardam a narrativa e os quadros completos.',
  'A decision-ready record of official economic observations, trade evidence, sector research depth and verification priorities. It does not score a country from headlines or treat reporting volume as market performance.':
    'Um registo de observações económicas oficiais, dados comerciais, profundidade da investigação sectorial e prioridades de verificação, pronto para apoiar decisões. Não classifica um país a partir de títulos nem trata o volume de informação como desempenho de mercado.',
  'A value is evidence, not a verdict. Use the explanation and caution under each observation before comparing countries or presenting a market case.':
    'Um valor é um dado, não um veredicto. Leia a explicação e a advertência de cada observação antes de comparar países ou apresentar um caso de mercado.',
  'Read the reporting year and provider first. The recorded balance describes the covered period; it does not predict the next one.':
    'Leia primeiro o ano de referência e o fornecedor. O saldo registado descreve o período abrangido; não prevê o período seguinte.',
  'What this toolkit can—and cannot—tell you': 'O que este conjunto de ferramentas pode — e não pode — indicar',
  'Understand and communicate': 'Compreender e comunicar',
  'Trade and cross-border exposure': 'Comércio e exposição transfronteiriça',
  'Sources and freshness': 'Fontes e actualidade',
  'Inspect provider record': 'Consultar o registo do fornecedor',
  'Open official resource': 'Abrir o recurso oficial',
  'Return shortly for provider links and freshness records. The platform will retain the last verified snapshot after the first successful retrieval.':
    'Regresse em breve para consultar as ligações dos fornecedores e os registos de actualidade. A plataforma conservará o último instantâneo verificado após a primeira recolha bem sucedida.',

  // Events, travel, contact and membership journeys.
  'Browse event records only when dates, locations and registration details are available from the event system.':
    'Consulte registos de eventos apenas quando o sistema disponibilizar datas, locais e dados de inscrição.',
  'Retry event records': 'Repetir o pedido de eventos',
  'Select ticket': 'Seleccionar bilhete',
  'Select ticket type': 'Seleccionar o tipo de bilhete',
  'Registering...': 'A efectuar a inscrição...',
  "You're Registered!": 'A sua inscrição está concluída!',
  'Check your email for full details.': 'Consulte o seu correio electrónico para obter todos os pormenores.',
  'Register Another Person': 'Inscrever outra pessoa',
  'Organization / Company': 'Organização / Empresa',
  'Work Email': 'Correio electrónico profissional',
  'Service Required': 'Serviço pretendido',
  'Select service': 'Seleccionar o serviço',
  'Other Inquiry': 'Outro pedido',
  'Please provide initial details regarding your required travel dates, group size, and primary objectives...':
    'Indique as datas de viagem pretendidas, a dimensão do grupo e os objectivos principais...',
  'Submit a brief for travel, site-visit or market-entry research. We confirm scope, available support, providers and costs before any engagement begins.':
    'Envie uma síntese para investigação de viagens, visitas ao local ou entrada no mercado. Confirmamos o âmbito, o apoio disponível, os fornecedores e os custos antes do início de qualquer serviço.',
  'Requirements differ by country and city. We review each request individually and distinguish research support from services that require an independently verified local provider.':
    'Os requisitos variam consoante o país e a cidade. Analisamos cada pedido individualmente e distinguimos o apoio à investigação dos serviços que exigem um fornecedor local verificado de forma independente.',
  'Source-linked market research and meeting preparation. Introductions, legal advice and visa services require separate confirmation.':
    'Investigação de mercado ligada às fontes e preparação de reuniões. As apresentações, o aconselhamento jurídico e os serviços de vistos exigem confirmação separada.',
  'Our concierge team will review your requirements and reach out within 24 hours to begin orchestrating your engagement.':
    'A nossa equipa de concierge analisará os seus requisitos e entrará em contacto no prazo de 24 horas para começar a organizar o serviço.',
  'Compare established properties by city, then verify current rates, availability, entry requirements and transport arrangements directly before booking.':
    'Compare estabelecimentos reconhecidos por cidade e confirme directamente os preços actuais, a disponibilidade, os requisitos de entrada e o transporte antes de reservar.',
  'Rates and services are not verified in real time': 'Os preços e serviços não são verificados em tempo real',
  'These properties are presented as research candidates, not as partners or endorsements. Confirm every rate, policy and service directly with the property.':
    'Estes estabelecimentos são apresentados como opções para investigação, não como parceiros ou recomendações. Confirme directamente com o estabelecimento todos os preços, políticas e serviços.',
  'Security, connectivity, transport and amenities can change. Confirm them with the property and current official guidance.':
    'A segurança, a conectividade, o transporte e as comodidades podem mudar. Confirme-os com o estabelecimento e nas orientações oficiais actuais.',
  'Email address': 'Endereço de correio electrónico',
  'Your email address': 'O seu endereço de correio electrónico',
  'Stay close to Africa’s story.': 'Acompanhe de perto a história de África.',
  'Weekly stories sent to your inbox.': 'Histórias semanais enviadas para a sua caixa de correio.',
  'Sign out': 'Terminar sessão',
  'Active Membership': 'Subscrição activa',
  'Current Tier': 'Nível actual',
  'Included in your membership': 'Incluído na sua subscrição',
  'Manage subscription on Ko-fi': 'Gerir a subscrição no Ko-fi',
  'Behind-the-scenes data and updates.': 'Dados e actualizações dos bastidores.',
  'Full narrative reports and deep dives.': 'Relatórios narrativos completos e análises aprofundadas.',
  'Stories from across the 54 nations.': 'Histórias dos 54 países.',

  // Plain-language help and trust layer.
  'Plain-language page guide': 'Guia da página em linguagem clara',
  'Start here · no specialist background required': 'Comece aqui · não são necessários conhecimentos especializados',
  'What this page is for': 'Para que serve esta página',
  'A reliable reading order': 'Uma ordem de leitura fiável',
  'How to read': 'Como ler',
  'Useful terms on this page': 'Termos úteis nesta página',
  'What you should understand': 'O que deve compreender',
  'Worked example': 'Exemplo desenvolvido',
  'Close page guide': 'Fechar o guia da página',
  'Back to': 'Voltar a',
  'Manage corporate sponsorship delivery and review first-party impression, click and click-through records. Access is strictly limited to corporate partners.':
    'Faça a gestão da entrega de patrocínios empresariais e consulte os registos próprios de impressões, cliques e taxa de cliques. O acesso é estritamente reservado aos parceiros empresariais.',
  'Open secure sign-in': 'Abrir o início de sessão seguro',
  'You do not have any active sponsorship campaigns running right now. Contact your account manager to launch one.':
    'Não tem actualmente nenhuma campanha de patrocínio activa. Contacte o seu gestor de conta para iniciar uma campanha.',
  'Daily impressions and clicks will appear here as this campaign runs.':
    'As impressões e os cliques diários aparecerão aqui durante a campanha.',
  'BOA-Story': 'BOA-Story',
  'BOA': 'BOA',
  'BOA-': 'BOA-',
  'Best of Africa': 'Best of Africa',
  'Currency Brief: NGN Stabilizing against USD': 'Síntese cambial: o NGN estabiliza face ao USD',
  'Market Alert: Mozambique Energy Sector Surge': 'Alerta de mercado: forte avanço do sector energético de Moçambique',
  'Policy Update: AfCFTA Implementation Readiness': 'Actualização de política: preparação para aplicar a ZCLCAf',
  'LIVE': 'EM DIRECTO',
  'ESC': 'ESC',
  'Select': 'Seleccionar',
  'Browse All Continent Summits &rarr;': 'Consultar todas as cimeiras continentais &rarr;',
  'Browse All Continent Summits →': 'Consultar todas as cimeiras continentais →',
  'MARKET CONTEXT': 'CONTEXTO DE MERCADO',
  'The': 'O',
  'Gov/Policy': 'Governo/Política',
  'Investor': 'Investidor',
  'NGO': 'ONG',
  'Target Vectors': 'Vectores prioritários',
  'Admin': 'Administração',
  'Photo:': 'Fotografia:',
  'VIEW:': 'VISTA:',
  '7-day skill performance': 'Desempenho das funções nos últimos sete dias',
  'Avg ms': 'Média em ms',
  'Core OS v1.0.0': 'Sistema central v1.0.0',
  'Core System': 'Sistema central',
  'Done': 'Concluído',
  'Fail': 'Falha',
  'Latest Published': 'Publicação mais recente',
  'Pipeline': 'Fluxo de trabalho',
  'Recent Tasks (': 'Tarefas recentes (',
  'Runs': 'Execuções',
  'Sources': 'Fontes',
  'Dispatch': 'Despacho',
  'Ko-fi ↗': 'Ko-fi ↗',
  'Africa,': 'África,',
  'African nation': 'nação africana',
  'Booking.com': 'Booking.com',
  'Expedia': 'Expedia',
  'Check-in': 'Entrada',
  'Check-out': 'Saída',
  'No credit card required to request. Availabilty confirmed in 2h.':
    'Não é necessário cartão de crédito para efectuar o pedido. Disponibilidade confirmada no prazo de duas horas.',
  'Save $': 'Poupe $',
  'More': 'Mais',
  'Market-intelligence guide': 'Guia de inteligência de mercado',
  'Understand sector performance without specialist training.':
    'Compreenda o desempenho sectorial sem formação especializada.',
  'This page compares named measures of output, demand, access, capacity, cost and operating conditions. It does not turn unlike evidence into a single unsupported score.':
    'Esta página compara indicadores identificados de produção, procura, acesso, capacidade, custo e condições operacionais. Não transforma dados incomparáveis numa pontuação única sem fundamento.',
  'You should leave knowing what changed, how widespread it was, how countries differ, how recent the evidence is and which questions still need investigation.':
    'No final, deverá saber o que mudou, qual foi a amplitude da mudança, como diferem os países, quão recentes são os dados e que questões ainda exigem investigação.',
  'Identify the main performance measure and read its exact unit.':
    'Identifique o principal indicador de desempenho e leia a respectiva unidade exacta.',
  'Separate scale from growth: a large market can grow slowly, while a small market can grow quickly.':
    'Separe dimensão de crescimento: um grande mercado pode crescer lentamente, enquanto um mercado pequeno pode crescer depressa.',
  'Use country coverage and the middle-half range to see whether a continental figure is broadly representative.':
    'Utilize a cobertura nacional e o intervalo da metade central para avaliar se um valor continental é amplamente representativo.',
  'Compare the supporting measures separately; access, cost, infrastructure and output do not mean the same thing.':
    'Compare separadamente os indicadores complementares; acesso, custo, infra-estruturas e produção não significam o mesmo.',
  'Check the period and previous observation before describing a movement as current or sustained.':
    'Confirme o período e a observação anterior antes de descrever uma evolução como actual ou sustentada.',
  'Read the limitation and diligence questions before treating the evidence as an opportunity, risk or recommendation.':
    'Leia as limitações e as questões de diligência antes de interpretar os dados como oportunidade, risco ou recomendação.',
  'Performance proxy': 'Indicador indirecto de desempenho',
  'A measurable indicator used to represent one part of sector activity; it is not the whole sector.':
    'Um indicador mensurável utilizado para representar uma parte da actividade sectorial; não representa todo o sector.',
  'The middle country after values are ordered, giving each reporting country equal weight.':
    'O país central depois de ordenados os valores, atribuindo o mesmo peso a cada país declarante.',
  'Breadth': 'Amplitude',
  'How many comparable countries moved in the stated direction.':
    'O número de países comparáveis que evoluíram na direcção indicada.',
  'Dispersion': 'Dispersão',
  'How far country readings are spread apart rather than clustered around one value.':
    'O grau de dispersão dos valores nacionais, em vez da sua concentração em torno de um único valor.',
  'Country-dossier guide': 'Guia do dossiê nacional',
  'Build a country view from facts, change and context.':
    'Construa uma visão do país a partir de factos, evolução e contexto.',
  'The dossier combines dated country indicators, sector evidence, trade and economic context, and linked sources. Each section answers a different question about the country.':
    'O dossiê combina indicadores nacionais datados, dados sectoriais, contexto comercial e económico e fontes ligadas. Cada secção responde a uma questão diferente sobre o país.',
  'You should understand the country’s scale, recent direction, structural strengths, constraints and the age and coverage of the supporting evidence.':
    'Deverá compreender a dimensão do país, a evolução recente, os pontos fortes estruturais, os condicionalismos e a antiguidade e cobertura dos dados de apoio.',
  'Confirm the country, latest observation date and source.':
    'Confirme o país, a data da observação mais recente e a fonte.',
  'Read the plain-language overview before comparing detailed measures.':
    'Leia a visão geral em linguagem clara antes de comparar os indicadores pormenorizados.',
  'Separate current conditions from longer-term structural characteristics.':
    'Distinga as condições actuais das características estruturais de longo prazo.',
  'Keep currency totals, percentages and per-person figures in their own units.':
    'Mantenha os totais monetários, as percentagens e os valores por pessoa nas respectivas unidades.',
  'Use sector and trade sections to add context rather than infer causation.':
    'Utilize as secções sectoriais e comerciais para acrescentar contexto, não para inferir causalidade.',
  'Open primary sources and compare countries on like-for-like periods for important decisions.':
    'Abra as fontes primárias e compare os países em períodos equivalentes antes de tomar decisões importantes.',
  'Latest observation': 'Observação mais recente',
  'The newest available official value, which may predate today because reporting is delayed.':
    'O valor oficial disponível mais recente, que pode ser anterior à data actual devido a atrasos na publicação.',
  'Per capita': 'Por habitante',
  'A total divided by population, useful for scale-adjusted comparison.':
    'Um total dividido pela população, útil para comparações ajustadas à dimensão.',
  'Structural': 'Estrutural',
  'A persistent feature of an economy rather than a short-term movement.':
    'Uma característica persistente de uma economia, em vez de uma evolução de curto prazo.',
  'Source date': 'Data da fonte',
  'When the underlying observation was measured, not merely when this page retrieved it.':
    'A data em que a observação subjacente foi medida, não apenas a data em que esta página a recolheu.',
  'Story and briefing guide': 'Guia de histórias e sínteses',
  'Separate established facts, analysis and open questions.':
    'Distinga factos estabelecidos, análise e questões em aberto.',
  'Stories and briefings explain events using named actors, dates, evidence and context. Analysis can clarify significance without turning uncertainty into fact.':
    'As histórias e as sínteses explicam acontecimentos através de intervenientes identificados, datas, dados e contexto. A análise pode esclarecer o significado sem transformar a incerteza em facto.',
  'You should understand what happened, why it matters, which claims are directly supported and what remains uncertain or contested.':
    'Deverá compreender o que aconteceu, por que razão é importante, que afirmações têm apoio directo e o que permanece incerto ou contestado.',
  'Read the publication date, update date and central summary.':
    'Leia a data de publicação, a data de actualização e a síntese principal.',
  'Identify the event, decision or evidence that supports the headline.':
    'Identifique o acontecimento, a decisão ou os dados que sustentam o título.',
  'Distinguish direct facts and attributed claims from interpretation.':
    'Distinga os factos directos e as afirmações atribuídas da interpretação.',
  'Check source links and the dates of the evidence.':
    'Confirme as ligações das fontes e as datas dos dados.',
  'Use related context to understand what preceded the event.':
    'Utilize o contexto relacionado para compreender o que precedeu o acontecimento.',
  'Treat forecasts and implications as conditional, not guaranteed outcomes.':
    'Trate as previsões e implicações como condicionais, não como resultados garantidos.',
  'Attribution': 'Atribuição',
  'Naming who supplied a claim, estimate or opinion.':
    'Identificação de quem forneceu uma afirmação, estimativa ou opinião.',
  'Analysis': 'Análise',
  'Reasoned interpretation of evidence rather than a newly observed fact.':
    'Interpretação fundamentada dos dados, e não um facto recentemente observado.',
  'Primary source': 'Fonte primária',
  'The original institution, filing, dataset, speech or document behind a claim.':
    'A instituição, o registo, o conjunto de dados, o discurso ou o documento original subjacente a uma afirmação.',
  'Uncertainty': 'Incerteza',
  'What the available evidence cannot yet establish confidently.':
    'Aquilo que os dados disponíveis ainda não permitem estabelecer com segurança.',
  'Reporting': 'Informação',
  'Source-attributed stories and a concise current briefing.':
    'Histórias com fontes atribuídas e uma síntese actual concisa.',
  'Country hubs': 'Dossiês nacionais',
  'Coverage, sectors and context for all 54 nations.':
    'Cobertura, sectores e contexto para os 54 países.',
  'Comparable sector measures and official market evidence.':
    'Indicadores sectoriais comparáveis e dados oficiais de mercado.',
  'Listen': 'Ouvir',
  'Clear, consistent audio briefings for listening on the move.':
    'Sínteses sonoras claras e coerentes para ouvir em mobilidade.',
  'Explore': 'Explorar',
  'Freshness': 'Actualidade',
  'Last successful source retrieval': 'Última obtenção bem sucedida da fonte',
  'Source refresh': 'Actualização da fonte',
  'Official source refresh completed successfully': 'A actualização da fonte oficial foi concluída com êxito',
  'Official source refresh is in progress': 'A actualização da fonte oficial está em curso',
  'Latest source check failed 1; the last verified snapshot is retained':
    'A última verificação da fonte falhou em 1; conserva-se o último registo verificado',
  'The official source is overdue for a successful refresh; the last verified snapshot is retained':
    'A fonte oficial aguarda uma actualização bem sucedida; conserva-se o último registo verificado',
  'What the record establishes—and what a decision still requires':
    'O que o registo permite estabelecer — e aquilo de que uma decisão ainda necessita',
  'This is a structured reading of the published indicators, not a forecast. It connects scale, momentum, prices, external flows and capital formation while preserving each measure’s own period and coverage.':
    'Esta é uma leitura estruturada dos indicadores publicados, não uma previsão. Relaciona dimensão, evolução, preços, fluxos externos e formação de capital, preservando o período e a cobertura próprios de cada medida.',
  '1 recorded across 1 countries.': '1 registado em 1 países.',
  'Use country and regional shares to locate concentration; do not treat the total as equally accessible demand.':
    'Utilize as parcelas nacionais e regionais para localizar a concentração; não trate o total como procura igualmente acessível.',
  'Typical growth and prices': 'Crescimento e preços típicos',
  '1 median real growth and 1 median inflation.': '1 de crescimento real mediano e 1 de inflação mediana.',
  'Check country-level growth composition, currency conditions and the exact inflation observation year before budgeting.':
    'Verifique a composição do crescimento nacional, as condições monetárias e o ano exacto da observação da inflação antes de elaborar o orçamento.',
  'Separate goods from services and identify the countries, products, corridors and currencies driving the balance.':
    'Separe bens de serviços e identifique os países, produtos, corredores e moedas que determinam o saldo.',
  '1 median fixed investment across 1 reporting countries.': '1 de investimento fixo mediano em 1 países declarantes.',
  'Inspect public/private composition, project execution, financing costs and asset quality.':
    'Examine a composição pública e privada, a execução dos projectos, os custos de financiamento e a qualidade dos activos.',
  '1 median current-account balance.': '1 de saldo mediano da balança corrente.',
  'Assess reserve cover, debt service, exchange-rate regime and the durability of financing country by country.':
    'Avalie a cobertura das reservas, o serviço da dívida, o regime cambial e a sustentabilidade do financiamento em cada país.',
  'Next check:': 'Verificação seguinte:',
  'Practical use by audience': 'Utilização prática por público',
  'Use the record to shortlist where scale, momentum and financing conditions warrant deeper country, company and transaction diligence.':
    'Utilize o registo para seleccionar os casos em que a dimensão, a evolução e as condições de financiamento justificam uma análise mais profunda do país, da empresa e da transacção.',
  'Translate the macro record into demand, route-to-market, input-cost, currency, logistics, workforce and regulatory assumptions.':
    'Converta o registo macroeconómico em pressupostos sobre procura, acesso ao mercado, custos de factores, moeda, logística, mão-de-obra e regulação.',
  'Compare regional and country gaps, then test whether policy, infrastructure and financing interventions address the binding constraint.':
    'Compare as lacunas regionais e nacionais e verifique depois se as intervenções de política, infra-estrutura e financiamento resolvem o constrangimento determinante.',
  'Record the indicator code, unit, period, country coverage and caveat in every downstream model or client presentation.':
    'Registe o código do indicador, a unidade, o período, a cobertura nacional e a ressalva em todos os modelos ou apresentações destinados a clientes.',
  'Compare scale, people, capital and operating pressure together':
    'Compare conjuntamente dimensão, população, capital e pressão operacional',
  'Shares use the sum of the five regional records shown on this page. Growth and inflation remain equal-country medians and should not be read as weighted regional rates.':
    'As parcelas utilizam a soma dos cinco registos regionais apresentados nesta página. O crescimento e a inflação continuam a ser medianas com igual peso por país e não devem ser lidos como taxas regionais ponderadas.',
  'Median growth': 'Crescimento mediano',
  'Fixed investment': 'Investimento fixo',
  'Interpretation boundary:': 'Limite de interpretação:',
  'Limited-coverage signal': 'Sinal com cobertura limitada',
  'Broad upward movement': 'Movimento ascendente generalizado',
  'Broad downward movement': 'Movimento descendente generalizado',
  'Mixed country movement': 'Evolução nacional mista',
  'Where the headline is broad, narrow or incomplete': 'Onde o sinal principal é generalizado, restrito ou incompleto',
  'This matrix puts movement, country breadth, dispersion and coverage beside one another. It helps identify which patterns deserve country-level investigation; it does not rank investment attractiveness.':
    'Esta matriz reúne a evolução, a amplitude nacional, a dispersão e a cobertura. Ajuda a identificar os padrões que justificam investigação nacional; não classifica a atractividade do investimento.',
  'Median change': 'Variação mediana',
  'Countries moving higher': 'Países com valor crescente',
  'Country coverage': 'Cobertura nacional',
  'Investigate countries and evidence': 'Investigar países e elementos comprovativos',
  'Sector and measure': 'Sector e medida',
  'Evidence pattern': 'Padrão dos dados',
  '% higher': '% com valor superior',
  'How to use it:': 'Como utilizar:',
  'start with evidence pattern and coverage, inspect the highest and lowest recorded countries, then open the sector dossier to test supporting conditions and unanswered diligence questions.':
    'comece pelo padrão dos dados e pela cobertura, examine os países com valores mais altos e mais baixos e abra depois o dossiê sectorial para testar as condições de apoio e as questões de diligência por responder.',
  'Countries with a positive reading': 'Países com leitura positiva',
  'What it cannot establish:': 'O que não permite estabelecer:',
  'Highest recorded countries': 'Países com valores registados mais altos',
  'Lowest recorded countries': 'Países com valores registados mais baixos',
  'From continental signal to an evidence-ready decision': 'Do sinal continental a uma decisão sustentada por elementos comprovativos',
  'Specify country, customer, product, time horizon, capital at risk and the decision that the evidence must support.':
    'Especifique o país, o cliente, o produto, o horizonte temporal, o capital em risco e a decisão que os elementos comprovativos devem sustentar.',
  'Build the comparison set': 'Construir o conjunto de comparação',
  'Choose plausible countries and compare the same indicator, unit, observation period and coverage before interpreting differences.':
    'Escolha países plausíveis e compare o mesmo indicador, unidade, período de observação e cobertura antes de interpretar diferenças.',
  'Test market structure': 'Testar a estrutura do mercado',
  'Add demand, competition, prices, regulation, infrastructure, labour, logistics, financing and currency evidence.':
    'Acrescente dados sobre procura, concorrência, preços, regulação, infra-estrutura, trabalho, logística, financiamento e moeda.',
  'Confirm licensing, ownership restrictions, tax, repatriation, procurement, land, data, standards and local-partner requirements.':
    'Confirme licenças, restrições de propriedade, fiscalidade, repatriamento, contratação, terrenos, dados, normas e requisitos relativos a parceiros locais.',
  'Stress-test the case': 'Submeter o caso a cenários adversos',
  'Model adverse exchange-rate, inflation, demand, delay, financing-cost and policy scenarios before committing resources.':
    'Modele cenários adversos de câmbio, inflação, procura, atraso, custo de financiamento e política antes de afectar recursos.',
  'What the comparison terms mean': 'O significado dos termos de comparação',
  'The middle country reading after values are ordered. It limits the influence of very large economies but is not a continental total.':
    'A leitura do país intermédio depois de ordenados os valores. Limita a influência das economias muito grandes, mas não constitui um total continental.',
  'The middle country-level change versus each market’s preceding available observation. Observation intervals may differ.':
    'A variação nacional intermédia face à observação disponível anterior de cada mercado. Os intervalos de observação podem diferir.',
  'The share of reporting countries moving higher. It shows how widely a direction appears, not how economically large those countries are.':
    'A parcela dos países declarantes cujo valor aumenta. Mostra a amplitude de uma direcção, não a dimensão económica desses países.',
  'Reporting countries divided by all 54 African countries. Missing countries reduce confidence and remain visible.':
    'Países declarantes divididos pelos 54 países africanos. Os países em falta reduzem a confiança e permanecem visíveis.',
  'The range between the lower and upper quartiles. A wide range signals substantial cross-country dispersion.':
    'O intervalo entre os quartis inferior e superior. Um intervalo amplo assinala uma dispersão nacional considerável.',
  'A position on one named measure, not an overall judgment of quality, opportunity, risk or investability.':
    'Uma posição numa única medida identificada, não uma avaliação global de qualidade, oportunidade, risco ou aptidão para investimento.',
  'Decision brief': 'Síntese para decisão',
  'Decision matrix': 'Matriz de decisão',
  'Decision questions': 'Questões para decisão',
  'Economic scale': 'Dimensão económica',
  'External capital': 'Capital externo',
  'External financing position': 'Posição de financiamento externo',
  'FDI share': 'Parcela do IDE',
  'GDP share': 'Parcela do PIB',
  'Net FDI share': 'Parcela do IDE líquido',
  'Population share': 'Parcela da população',
  'Regional concentration ledger': 'Registo de concentração regional',
  'Region': 'Região',
  'Investor or lender': 'Investidor ou financiador',
  'Operating company': 'Empresa operacional',
  'Government or institution': 'Governo ou instituição',
  'Research or advisory team': 'Equipa de investigação ou consultoria',
  'Highest recorded markets': 'Mercados com valores registados mais altos',
  'Lowest recorded markets': 'Mercados com valores registados mais baixos',
  'Median reading': 'Leitura mediana',
  'Middle 50%': '50% central',
  'middle half': 'metade central',
  'Observed range:': 'Intervalo observado:',
  'Core definitions': 'Definições fundamentais',
  'Practical research protocol': 'Protocolo prático de investigação',
  'Verify implementation': 'Verificar a execução',
  'Leader or laggard': 'Posição superior ou inferior',
  'of recorded GDP': 'do PIB registado',
  'Verify whether flows represent greenfield projects, acquisitions, reinvested earnings or exceptional transactions.':
    'Verifique se os fluxos representam projectos de raiz, aquisições, lucros reinvestidos ou transacções excepcionais.',
  '[dynamic] in latest recorded net FDI inflows.': '[dynamic] nos últimos fluxos líquidos de IDE registados.',
  '[dynamic] median current-account balance.': '[dynamic] de saldo mediano da balança corrente.',
  '[dynamic] median fixed investment across reporting countries.': '[dynamic] de investimento fixo mediano nos países declarantes.',
  '[dynamic] median real growth and median inflation.': '[dynamic] de crescimento real mediano e de inflação mediana.',
  '[dynamic] recorded across countries.': '[dynamic] registado nos países.',
  '[dynamic] recorded exports-minus-imports difference.': '[dynamic] de diferença registada entre exportações e importações.',
  'in latest recorded net FDI inflows.': 'nos últimos fluxos líquidos de IDE registados.',
  'median current-account balance.': 'de saldo mediano da balança corrente.',
  'median fixed investment across reporting countries.': 'de investimento fixo mediano nos países declarantes.',
  'median real growth and median inflation.': 'de crescimento real mediano e de inflação mediana.',
  'recorded across countries.': 'registado nos países.',
  'recorded exports-minus-imports difference.': 'de diferença registada entre exportações e importações.',
  'NY.GDP.MKTP.CD': 'NY.GDP.MKTP.CD',
  'NY.GDP.MKTP.KD.ZG': 'NY.GDP.MKTP.KD.ZG',
  'FP.CPI.TOTL.ZG': 'FP.CPI.TOTL.ZG',
  'BX.KLT.DINV.CD.WD': 'BX.KLT.DINV.CD.WD',
  'NE.EXP.GNFS.CD+NE.IMP.GNFS.CD': 'NE.EXP.GNFS.CD+NE.IMP.GNFS.CD',
  'NE.GDI.FTOT.ZS': 'NE.GDI.FTOT.ZS',
  'BN.CAB.XOKA.GD.ZS': 'BN.CAB.XOKA.GD.ZS',
  'Verified national reporting': 'Informação nacional verificada',
  'Source-linked record': 'Registo ligado à fonte',
  'Economic and demand scale': 'Dimensão económica e da procura',
  '1 official macroeconomic observations; population and GDP retain their reported periods.':
    '1 observações macroeconómicas oficiais; a população e o PIB mantêm os respectivos períodos declarados.',
  'Test addressable customers, purchasing power, informality and subnational concentration.':
    'Avalie os clientes acessíveis, o poder de compra, a informalidade e a concentração subnacional.',
  'Growth and fiscal outlook': 'Perspectivas de crescimento e fiscais',
  'Observed + labelled projection': 'Observado + projecção identificada',
  'Historical observations are separated from IMF estimate or projection fields.':
    'As observações históricas estão separadas dos campos de estimativa ou projecção do FMI.',
  'Stress-test revenue and costs against growth, inflation, debt, fiscal and currency scenarios.':
    'Submeta as receitas e os custos a cenários de crescimento, inflação, dívida, situação fiscal e moeda.',
  '1 plus 1 supporting indicators across reporting African markets.':
    '1 e mais 1 indicadores complementares nos mercados africanos declarantes.',
  'Verify the selected measure directly for 1 and compare it with peers using the official series.':
    'Verifique directamente a medida seleccionada para 1 e compare-a com países semelhantes através da série oficial.',
  'Trade and logistics': 'Comércio e logística',
  '1 exports, imports and balance for the stated periods.': '1: exportações, importações e saldo nos períodos indicados.',
  'IMF external-balance evidence for the stated period.': 'Dados do FMI sobre o saldo externo no período indicado.',
  'Add commodity, corridor, port, border, freight, insurance and delivery-time evidence for the proposed route.':
    'Acrescente dados sobre mercadorias, corredores, portos, fronteiras, frete, seguro e prazo de entrega para a rota proposta.',
  'Competition and pricing': 'Concorrência e preços',
  'Source-led verification': 'Verificação orientada pelas fontes',
  '1 recent country1 records from 1 distinct attributed sources.':
    '1 registos nacionais1 recentes provenientes de 1 fontes distintas e atribuídas.',
  'Identify current competitors, substitutes, price points, margins, procurement channels and customer switching costs from primary filings and fieldwork.':
    'Identifique concorrentes actuais, substitutos, níveis de preços, margens, canais de contratação e custos de mudança dos clientes através de documentos primários e trabalho de campo.',
  'Regulation and market entry': 'Regulação e entrada no mercado',
  'Official verification route': 'Via oficial de verificação',
  '1 official portals are linked for registration, investment, visa or tourism checks.':
    'Estão ligados 1 portais oficiais para verificações de registo, investimento, vistos ou turismo.',
  'Confirm the current legal instrument, licence, ownership, tax, repatriation, standards, data and local-partner requirements with the responsible authority.':
    'Confirme junto da autoridade responsável o instrumento jurídico vigente e os requisitos de licença, propriedade, fiscalidade, repatriamento, normas, dados e parceiros locais.',
  'The decision workspace could not load its verified records.': 'Não foi possível carregar os registos verificados do espaço de decisão.',
  'Retry evidence workspace': 'Repetir o carregamento do espaço documental',
  'Official external-sector source': 'Fonte oficial do sector externo',
  'Country and sector decision workspace': 'Espaço de decisão por país e sector',
  'Build a traceable market case from official observations': 'Construa um caso de mercado rastreável a partir de observações oficiais',
  'Select a country and sector to connect macroeconomics, labelled projections, trade, operating benchmarks, official entry portals and source-linked records. Every section states what the evidence supports and what still requires primary verification.':
    'Seleccione um país e um sector para relacionar macroeconomia, projecções identificadas, comércio, referências operacionais, portais oficiais de entrada e registos ligados às fontes. Cada secção declara o que os dados sustentam e o que ainda exige verificação primária.',
  'Official country code 1': 'Código oficial do país 1',
  '1 records in this exportable ledger': '1 registos neste livro exportável',
  'Decision readiness register': 'Registo de preparação da decisão',
  'What is evidenced now, and what must be verified next': 'O que está documentado agora e o que deve ser verificado em seguida',
  'Next verification:': 'Verificação seguinte:',
  'Evidence state': 'Estado dos dados',
  'Current record': 'Registo actual',
  'Next verification': 'Verificação seguinte',
  'Observed country indicators': 'Indicadores nacionais observados',
  'Inspect official provider': 'Examinar o fornecedor oficial',
  'Estimate or projection': 'Estimativa ou projecção',
  'Historical observation': 'Observação histórica',
  'Current dated outlook inputs': 'Dados datados das perspectivas actuais',
  'Real GDP growth': 'Crescimento real do PIB',
  'Current account': 'Balança corrente',
  '· estimate or projection': '· estimativa ou projecção',
  'Trade and external position': 'Comércio e posição externa',
  'Recorded cross-border evidence': 'Dados transfronteiriços registados',
  'IMF external-balance evidence, explicitly labelled': 'Dados do FMI sobre o saldo externo, expressamente identificados',
  'Inspect external-sector source': 'Examinar a fonte do sector externo',
  'Median country reading': 'Leitura nacional mediana',
  'Country evidence:': 'Dados nacionais:',
  'records are indexed for': 'registos estão indexados para',
  '; coverage is not market performance.': '; a cobertura não representa o desempenho do mercado.',
  'Official market-entry verification': 'Verificação oficial da entrada no mercado',
  'Go to the responsible authority before committing capital': 'Consulte a autoridade responsável antes de afectar capital',
  'The linked portals establish where current registration, investment, visa and sector requirements must be checked. They do not replace legal, tax or technical advice.':
    'Os portais ligados indicam onde devem ser verificados os requisitos vigentes de registo, investimento, vistos e sector. Não substituem aconselhamento jurídico, fiscal ou técnico.',
  'Open full country dossier': 'Abrir o dossiê nacional completo',
  'Open authority': 'Abrir a autoridade',
  'Legal form, ownership restrictions, beneficial ownership, registration sequence and statutory filings.':
    'Forma jurídica, restrições de propriedade, beneficiário efectivo, sequência de registo e declarações obrigatórias.',
  'Tax and repatriation': 'Fiscalidade e repatriamento',
  'Corporate and indirect tax, withholding, customs, transfer pricing, incentives, exchange controls and profit repatriation.':
    'Imposto sobre sociedades e impostos indirectos, retenção, alfândegas, preços de transferência, incentivos, controlos cambiais e repatriamento de lucros.',
  'Operating licence, technical standards, product registration, data rules, environmental approval and regulator reporting.':
    'Licença de exploração, normas técnicas, registo de produtos, regras sobre dados, aprovação ambiental e informação ao regulador.',
  'Land, utilities, labour, immigration, procurement, local content, logistics, insurance and dispute resolution.':
    'Terrenos, serviços públicos, trabalho, imigração, contratação, conteúdo local, logística, seguros e resolução de litígios.',
  'Downloadable source ledger': 'Livro de fontes descarregável',
  'Inspect the records behind the workspace': 'Examine os registos que sustentam o espaço de decisão',
  '1 recent country records': '1 registos nacionais recentes',
  'are shown because each retains an attributed source and publication date.':
    'são apresentados porque cada um conserva uma fonte atribuída e a data de publicação.',
  'Evidence CSV': 'Dados em CSV',
  'Country-wide evidence': 'Dados do conjunto do país',
  'Evidence freshness': 'Actualidade dos dados',
  'Retrieval time and observation period are separate. A recent check does not turn an older annual observation into current-year data.':
    'O momento de obtenção e o período de observação são distintos. Uma verificação recente não transforma uma observação anual anterior em dados do ano corrente.',
  'Country workspace': 'Espaço nacional',
  'Decision workspace': 'Espaço de decisão',
  'Attributed sources': 'Fontes atribuídas',
  'Balance': 'Saldo',
  'Corporate establishment': 'Constituição da empresa',
  'Currency': 'Moeda',
  'Decision area': 'Área de decisão',
  'External balance ·': 'Saldo externo ·',
  'Fiscal balance': 'Saldo orçamental',
  'Full snapshot JSON': 'Registo completo em JSON',
  'GDP per person': 'PIB por pessoa',
  'Government debt': 'Dívida pública',
  'IMF scenario anchors': 'Referências de cenário do FMI',
  'Implementation conditions': 'Condições de execução',
  'Inflation': 'Inflação',
  'Macroeconomic record': 'Registo macroeconómico',
  'National currency recorded': 'Moeda nacional registada',
  'Observation:': 'Observação:',
  'Primary link': 'Ligação primária',
  'Provider-by-provider status': 'Estado por fornecedor',
  'Sector': 'Sector',
  'Sector benchmark': 'Referência sectorial',
  'Sector permissions': 'Autorizações sectoriais',
  'Top recorded export partners': 'Principais parceiros de exportação registados',
  'Top recorded import partners': 'Principais parceiros de importação registados',
  'USD per person': 'USD por pessoa',
  '. Totals do not establish sector demand, margins or route economics.':
    '. Os totais não permitem estabelecer a procura sectorial, as margens ou a economia da rota.',
  'These are provider estimates or projections where their year is':
    'Estes valores são estimativas ou projecções do fornecedor quando o respectivo ano é',
  'or later. They are scenario inputs, not BOA forecasts.':
    'ou posterior. Constituem dados para cenários, não previsões da BOA.',
  '· exports': '· exportações',
  '· imports': '· importações',
  'Official country code': 'Código oficial do país',
  'recent country records': 'registos nacionais recentes',
  'records in this exportable ledger': 'registos neste livro exportável',
  'sector-specific records': 'registos específicos do sector',
  '-decision-workspace': '-decision-workspace',
  'Official provider': 'Fornecedor oficial',
  'country evidence snapshot': 'instantâneo documental nacional',
  '1 country evidence snapshot': 'instantâneo documental nacional de 1',
  '1 recent country1 records plus 1 official provider records from 1 distinct attributed sources.':
    '1 registo nacional recente, acrescido de 1 registo de fornecedor oficial, proveniente de 1 fonte atribuída distinta.',
  'The provider snapshot contains no numeric forward estimate for this country.':
    'O instantâneo do fornecedor não contém uma estimativa prospectiva numérica para este país.',
  'Use the dated historical observations in the macroeconomic record and inspect the provider status below before constructing a scenario. No projection has been inferred.':
    'Utilize as observações históricas datadas do registo macroeconómico e examine abaixo o estado do fornecedor antes de construir um cenário. Não foi inferida qualquer projecção.',
  'The ledger combines': 'O livro combina',
  'dated official-provider snapshots with': 'instantâneos datados de fornecedores oficiais com',
  '. Reporting coverage is supporting context, not a substitute for official market data.':
    '. A cobertura jornalística constitui contexto de apoio, não substitui dados oficiais de mercado.',
  'Review': 'Revisão',
  'Evidence policy': 'Política documental',
  'Critical claims require editorial review': 'As afirmações críticas exigem revisão editorial',
  'Summaries must remain source-bound and factual': 'As sínteses devem permanecer factuais e ligadas às fontes',
  'Updated with the live dataset': 'Actualizado com o conjunto de dados em directo',
  'Intelligence trust protocol': 'Protocolo de confiança da inteligência',
  'BOA Trust Protocol': 'Protocolo de confiança da BOA',
  'Live, source-bound intelligence': 'Inteligência actual ligada às fontes',
  'View method +': 'Ver método +',
  'Read editorial standards': 'Ler as normas editoriais',
  'Traceable by design.': 'Rastreável desde a concepção.',
  'Editorial standards →': 'Normas editoriais →',
  'Dossiê nacional assente em fontes': 'Dossiê nacional assente em fontes',
  'Registo nacional assente em fontes oficiais e cobertura editorial atribuída':
    'Registo nacional assente em fontes oficiais e cobertura editorial atribuída',
  'Narration is still generating for this article.': 'A narração deste artigo ainda está a ser produzida.',
  'New stories published': 'Novas histórias publicadas',
  'Regional briefing updated': 'Síntese regional actualizada',
  'Strategic briefing ready': 'Síntese estratégica pronta',
  'Dashboard': 'Painel',
  'Market-Entry Pilot': 'Projecto-piloto de entrada no mercado',
  'Degraded': 'Degradado',
  'Done (24h)': 'Concluídas (24 h)',
  'Failed': 'Com falha',
  'Idle': 'Inactivo',
  'Operational': 'Operacional',
  'Pending': 'Pendente',
  'Queued': 'Em fila',
  'Running': 'Em execução',
  'Stalled': 'Interrompido',
  'Daily Breakfast for Two': 'Pequeno-almoço diário para duas pessoas',
  'Early Check-in / Late Checkout': 'Entrada antecipada / saída tardia',
  'Executive Lounge Access': 'Acesso ao salão executivo',
  'High-Speed WiFi': 'Wi-Fi de alta velocidade',
  'Partner Hotel Credit': 'Crédito no hotel parceiro',
  'Room Upgrade': 'Melhoria de quarto',
  'A travel specialist will contact you shortly to plan your trip.':
    'Um especialista em viagens contactá-lo-á em breve para planear a sua deslocação.',
  'Our concierge team will confirm your exclusive rate within 2 hours.':
    'A nossa equipa de concierge confirmará o seu preço exclusivo no prazo de duas horas.',
  'Email Digest': 'Síntese por correio electrónico',
  'New Reports': 'Novos relatórios',
  'Real-time Alerts': 'Alertas em tempo real',
  'African regions': 'Regiões africanas',
  'Countries covered': 'Países abrangidos',
  'Stories published': 'Histórias publicadas',
  'Total reads': 'Total de leituras',
  'A large economy does not automatically mean high household purchasing power or easy market entry.':
    'Uma grande economia não significa automaticamente elevado poder de compra das famílias nem facilidade de entrada no mercado.',
  'A national rate can conceal large differences between food, housing, energy and regions.':
    'Uma taxa nacional pode ocultar grandes diferenças entre alimentação, habitação, energia e regiões.',
  'A single large transaction can move the ratio sharply; it is not a stand-alone measure of investment quality.':
    'Uma única grande transacção pode alterar fortemente o rácio; não constitui, por si só, uma medida da qualidade do investimento.',
  'Definitions, reporting periods and country coverage can differ. Inspect the provider record before comparison.':
    'As definições, os períodos de referência e a cobertura nacional podem diferir. Consulte o registo do fornecedor antes de comparar.',
  'High trade intensity can signal integration and also exposure to external shocks.':
    'Uma elevada intensidade comercial pode indicar integração, mas também exposição a choques externos.',
  'One year can be affected by base effects, commodity cycles or weather; inspect several years before concluding.':
    'Um único ano pode ser afectado por efeitos de base, ciclos das matérias-primas ou condições meteorológicas; examine vários anos antes de concluir.',
  'Population is not the same as addressable demand or purchasing power.':
    'População não equivale a procura acessível nem a poder de compra.',
  'All Results': 'Todos os resultados',
  'Articles': 'Artigos',
  "A contemporary five-star anchor for investors moving through the AfCFTA's fastest-opening market.":
    'Uma referência contemporânea de cinco estrelas para investidores que operam num dos mercados em abertura mais rápida ao abrigo da ZCLCAf.',
  "A design icon above the V&A Waterfront, pairing world-class hospitality with boardrooms fit for the continent's biggest deals.":
    'Um ícone de arquitectura sobre a V&A Waterfront, que combina hotelaria de nível mundial com salas de administração adequadas aos maiores negócios do continente.',
  'A legendary palace hotel blending Moorish grandeur with modern executive comfort — a landmark for high-level meetings in North Africa.':
    'Um lendário hotel-palácio que combina a grandiosidade mourisca com o conforto executivo moderno — uma referência para reuniões de alto nível no Norte de África.',
  'A luxury lifestyle resort offering an effortlessly chic business retreat — ideal for executive retreats and strategy offsites.':
    'Um complexo de luxo que proporciona um retiro empresarial elegante — ideal para encontros executivos e sessões externas de estratégia.',
  "East Africa's diplomatic and tech hub, from a tower designed around the executive traveller.":
    'Uma base no centro diplomático e tecnológico da África Oriental, numa torre concebida para o viajante executivo.',
  "The 'Grand Dame' of Maputo — a historic, palatial hotel with the finest executive amenities and secure conference facilities in the capital.":
    'A «Grande Dama» de Maputo — um hotel histórico e palaciano, com excelentes comodidades executivas e instalações seguras para conferências na capital.',
  "The calm, secure base of choice in Africa's most walkable capital — minutes from the convention centre.":
    'Uma base tranquila e segura numa das capitais africanas mais fáceis de percorrer a pé, a poucos minutos do centro de convenções.',
  "West Africa's premier business address on Victoria Island, with the conference infrastructure and security serious deal-making demands.":
    'Uma referência empresarial da África Ocidental em Victoria Island, com as infra-estruturas para conferências e a segurança exigidas por negociações importantes.',
  'Change in the middle reading': 'Variação do valor central',
  'Countries reading higher': 'Países com valor superior',
  'Countries with usable data': 'Países com dados utilizáveis',
  'Save': 'Guardar',
  'Saved': 'Guardado',
  'Track Topic': 'Acompanhar tema',
  'Tracking': 'Em acompanhamento',
  'Added to Queue': 'Adicionado à fila',
  'Audio not available': 'Áudio não disponível',
  'Multimodal': 'Multimodal',
  'Paused': 'Em pausa',
  'Playing': 'Em reprodução',
  'OPPORTUNITY': 'OPORTUNIDADE',
  'RISK': 'RISCO',
  'Country': 'País',
  'Strategic Market': 'Mercado estratégico',
  'Switch to comfortable layout': 'Mudar para a disposição espaçosa',
  'Switch to compact layout': 'Mudar para a disposição compacta',
  'Unknown error': 'Erro desconhecido',
  'Acme Corp': 'Empresa ABC',
  'Complete Registration': 'Concluir inscrição',
  'John Doe': 'João Silva',
  'Developing': 'Em desenvolvimento',
  'Stable': 'Estável',
  'Watchlist': 'Sob observação',
  'Your question': 'A sua pergunta',
  'Some text remains in English because translation could not be completed. Try again shortly.':
    'Algum texto permanece em inglês porque não foi possível concluir a tradução. Tente novamente dentro de instantes.',
  'Translating this page…': 'A traduzir esta página…',
  'Balanced reporting.': 'Cobertura equilibrada.',
  'General': 'Geral',
  'Logistics, Labor.': 'Logística e trabalho.',
  'ROI, Deals, Risk.': 'Retorno, operações e risco.',
  'Stability, Regs.': 'Estabilidade e regulamentação.',
  'Menu': 'Menu',
  'Open complete menu': 'Abrir o menu completo',
  'INTERACTIVE': 'INTERACTIVO',
  'STATIC (A11Y)': 'ESTÁTICO (ACESSIBILIDADE)',
  'CONNECTING TO NEWSROOM...': 'A LIGAR À REDACÇÃO...',
  'LOADING SYSTEM STATUS...': 'A CARREGAR O ESTADO DO SISTEMA...',
  'Audio narration of this briefing.': 'Narração sonora desta síntese.',
  'Controls are available at the bottom of your screen.': 'Os controlos estão disponíveis na parte inferior do ecrã.',
  'Listen to this article': 'Ouvir este artigo',
  'Now Playing globally': 'Em reprodução no leitor global',
  'Pause': 'Pausa',
  'Play': 'Reproduzir',
  'Audio Briefing': 'Síntese sonora',
  'Volume': 'Volume',
  'Ready for new message': 'Pronto para uma nova mensagem',
  'A need to reconcile fragmented public evidence before specialist diligence.':
    'Necessidade de conciliar dados públicos fragmentados antes da diligência especializada.',
  'A source of guaranteed forecasts, rankings or business outcomes.':
    'Uma fonte de previsões, classificações ou resultados empresariais garantidos.',
  'A substitute for in-country counsel or commercial diligence.':
    'Um substituto do aconselhamento no país ou da diligência comercial.',
  'A team willing to test usefulness against an existing research process.':
    'Uma equipa disposta a testar a utilidade face a um processo de investigação existente.',
  'An organization comparing two or three African markets for expansion, investment or partnership.':
    'Uma organização que compare dois ou três mercados africanos para expansão, investimento ou parceria.',
  'Comprehensive coverage of every African market and sector.':
    'Cobertura integral de todos os mercados e sectores africanos.',
  'Investment, legal, tax or regulatory advice.':
    'Aconselhamento financeiro, jurídico, fiscal ou regulamentar.',
  'One named sector, decision owner and internal deadline.':
    'Um sector identificado, um responsável pela decisão e um prazo interno.',
  'Can available evidence support useful comparison without overstating certainty?':
    'Podem os dados disponíveis sustentar uma comparação útil sem exagerar o grau de certeza?',
  'Can the result be compared with the applicant’s current research process?':
    'Pode o resultado ser comparado com o processo de investigação actual do requerente?',
  'Fit review': 'Avaliação da adequação',
  'Is there one clear decision, one sector and no more than three markets?':
    'Existe uma decisão clara, um sector e um máximo de três mercados?',
  'Measurement check': 'Verificação da medição',
  'Only suitable applications move to a separately defined scope and commercial discussion.':
    'Apenas as candidaturas adequadas avançam para um âmbito definido separadamente e para discussão comercial.',
  'Pilot proposal': 'Proposta de projecto-piloto',
  'Recording application…': 'A registar a candidatura…',
  'Scope check': 'Verificação do âmbito',
  'Submit pilot application': 'Enviar candidatura ao projecto-piloto',
  'AUTHENTICATED': 'AUTENTICADO',
  'EMAIL': 'CORREIO ELECTRÓNICO',
  'LOADING': 'A CARREGAR',
  'OTP': 'CÓDIGO DE UTILIZAÇÃO ÚNICA',
  'PASSWORDLESS LOGIN': 'ENTRADA SEM PALAVRA-PASSE',
  'SUCCESS': 'CONCLUÍDO',
  'VERIFICATION REQUIRED': 'VERIFICAÇÃO NECESSÁRIA',
  'The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.':
    'A página que procura pode ter sido removida, ter mudado de nome ou estar temporariamente inacessível.',
  'Edit Profile': 'Editar perfil',
  'Guest User': 'Utilizador convidado',
  'Save Changes': 'Guardar alterações',
  'Controls': 'Controlos',
  'Operations': 'Operações',
  'African entrepreneur overlooking a city': 'Empresário africano com vista para uma cidade',
  'Countries in Directory': 'Países no directório',
  'Back independent African coverage and unlock full stories, audio and personalized reading tools.':
    'Apoie a cobertura africana independente e aceda a histórias completas, áudio e instrumentos de leitura personalizados.',
  'Every story & report, in full': 'Todas as histórias e todos os relatórios, na íntegra',
  'Founding members vote on what we cover next': 'Os membros fundadores votam nos próximos temas a cobrir',
  'Independent coverage': 'Cobertura independente',
  'It continues with the detail and context that make this more than a headline, and there is much more still to read below.':
    'O texto prossegue com o pormenor e o contexto que o tornam mais do que um título, e há ainda muito mais para ler abaixo.',
  'The brief goes deeper here — the numbers, the background, and how it connects across the region, available in full for members.':
    'A síntese aprofunda aqui os números, os antecedentes e as ligações regionais, disponíveis na íntegra para os membros.',
  'Submit Inquiry': 'Enviar pedido',
  'Submitting...': 'A enviar...',
  'hub, scores, narratives, sector trends, and more.': 'dossiê, indicadores, narrativas, tendências sectoriais e muito mais.',
  'official external-sector outlook': 'panorama oficial do sector externo',
  'official trade record': 'registo oficial do comércio',
  'From the Atlantic to the Indian Ocean, open every country hub and move directly into its reporting record.':
    'Do Atlântico ao Índico, abra qualquer dossiê nacional e consulte directamente o respectivo registo documental.',
  'No country records matched the selected region.': 'Nenhum registo nacional corresponde à região seleccionada.',
  'Register for Event': 'Inscrever-se no evento',
  'Registration Confirmed': 'Inscrição confirmada',
  'We have received your registration details.': 'Recebemos os seus dados de inscrição.',
  'Corporate strategy': 'Estratégia empresarial',
  'Export leaders': 'Responsáveis pela exportação',
  'Growth teams': 'Equipas de crescimento',
  'Investment committees': 'Comités de investimento',
  'Market-entry counsel': 'Consultores de entrada no mercado',
  'Trade advisers': 'Consultores de comércio',
  'Compare markets': 'Comparar mercados',
  'Configure briefings': 'Configurar sínteses',
  'No saved research matches': 'Nenhuma investigação guardada corresponde à pesquisa',
  'Review country records': 'Rever registos nacionais',
  'Save decision-relevant reporting, briefings and reports here, then export the workspace for your team.':
    'Guarde aqui cobertura, sínteses e relatórios relevantes para a decisão e exporte depois o espaço de trabalho para a sua equipa.',
  'Track scheduled events': 'Acompanhar eventos agendados',
  'Try a broader search term.': 'Experimente um termo de pesquisa mais abrangente.',
  'Your evidence file is empty': 'O seu dossiê documental está vazio',
  'Resend code': 'Reenviar código',
  'Resending...': 'A reenviar...',
  'Communicate proportionately': 'Comunicar de forma proporcional',
  'Connect the mechanism': 'Estabelecer o mecanismo',
  'Decision framework': 'Quadro de decisão',
  'Define the decision': 'Definir a decisão',
  'Each indicator explains what it measures, how it supports a decision and what could make a quick conclusion unreliable.':
    'Cada indicador explica o que mede, como apoia uma decisão e o que pode tornar pouco fiável uma conclusão precipitada.',
  'Economic indicators': 'Indicadores económicos',
  'Explain how policy, infrastructure, demand, costs, trade access or financing could link the observation to the sector in question.':
    'Explique como a política, as infra-estruturas, a procura, os custos, o acesso comercial ou o financiamento podem ligar a observação ao sector em causa.',
  'Exports': 'Exportações',
  'How to use': 'Como utilizar',
  'Identify what could reverse the conclusion: outdated data, currency effects, concentration, regulatory change, execution constraints or a one-off transaction.':
    'Identifique o que pode inverter a conclusão: dados desactualizados, efeitos cambiais, concentração, alterações regulamentares, limitações de execução ou uma operação excepcional.',
  'Imports': 'Importações',
  'Lead with what is supported, label projections, disclose limitations and provide direct source links so another reader can reproduce the reasoning.':
    'Comece pelo que é sustentado, identifique as projecções, revele as limitações e forneça ligações directas às fontes para que outro leitor possa reproduzir o raciocínio.',
  'List the primary documents and local checks required before a public claim, allocation decision or partnership commitment.':
    'Enumere os documentos primários e as verificações locais necessários antes de uma afirmação pública, decisão de afectação ou compromisso de parceria.',
  'Loading verified records': 'A carregar registos verificados',
  'Market interpretation': 'Interpretação do mercado',
  'Name the audience, sector, time horizon and decision the evidence must support. A broad “country opportunity” claim is too vague to verify.':
    'Identifique o público, o sector, o horizonte temporal e a decisão que os dados devem sustentar. Uma afirmação genérica de «oportunidade nacional» é demasiado vaga para ser verificada.',
  'No synthetic country score': 'Sem pontuação nacional sintética',
  'Observed evidence': 'Dados observados',
  'Official observations retain the period and unit supplied by their provider. Retrieval dates are recorded separately.':
    'As observações oficiais conservam o período e a unidade fornecidos pela entidade de origem. As datas de recolha são registadas separadamente.',
  'Projection': 'Projecção',
  'Provider projection': 'Projecção da entidade de origem',
  'Quote the exact indicator, value, provider and reporting period. Keep an observation separate from your interpretation.':
    'Indique exactamente o indicador, o valor, a entidade de origem e o período de referência. Separe a observação da sua interpretação.',
  'Recorded observation': 'Observação registada',
  'Sector evidence': 'Dados sectoriais',
  'Set verification gates': 'Definir etapas de verificação',
  'State the observation': 'Enunciar a observação',
  'Test the counter-case': 'Testar a hipótese contrária',
  'The source record is being assembled from official providers.': 'O registo documental está a ser reunido a partir de fontes oficiais.',
  'There is no opaque “image strength” or “diplomacy” score. Evidence quality and missing diligence are shown directly.':
    'Não existe uma pontuação opaca de «força de imagem» ou «diplomacia». A qualidade dos dados e a diligência em falta são apresentadas directamente.',
  'Trade position': 'Posição comercial',
  'Use the communication framework only after checking the linked source, current policy position and sector-specific conditions.':
    'Utilize o quadro de comunicação apenas depois de verificar a fonte ligada, a posição política actual e as condições próprias do sector.',
  'Values are presented with their provider, reporting period and retrieval date. Older observations are never made to look current.':
    'Os valores são apresentados com a entidade de origem, o período de referência e a data de recolha. As observações antigas nunca são apresentadas como actuais.',
  'Verification before advocacy': 'Verificação antes da promoção',
  'under review': 'em revisão',
  'Get the weekly dispatch': 'Receber o boletim semanal',
  'Join the founding reader community': 'Juntar-se à comunidade de leitores fundadores',
  'Subscribing...': 'A subscrever...',
  'Briefing Report | BOA-Story': 'Relatório de síntese | BOA-Story',
  'Structured briefing report from the BOA evidence desk.': 'Relatório estruturado da equipa documental da BOA.',
  'Compare Ghana and Rwanda for manufacturing investment': 'Comparar o Gana e o Ruanda para investimento industrial',
  'Lithium, railways and export corridors': 'Lítio, caminhos-de-ferro e corredores de exportação',
  'Nigerian companies operating in Kenya': 'Empresas nigerianas com actividade no Quénia',
  'Solar projects in East Africa': 'Projectos solares na África Oriental',
  'Only recorded delivery events are shown.': 'São apresentados apenas os eventos de entrega registados.',
  'Sponsor Analytics | BOA-Story Dashboard': 'Análise para patrocinadores | Painel BOA-Story',
  'Energy': 'Energia',
  'Technology': 'Tecnologia',
  'African supporters celebrating': 'Adeptos africanos a festejar',
  'The African run at this World Cup has ended. Verified results retained by the sports feed are listed below.':
    'A participação africana neste Campeonato do Mundo terminou. Os resultados verificados conservados pelo serviço desportivo são apresentados abaixo.',
  'The tournament has ended. This page no longer presents seeded teams or fixtures as live information.':
    'O torneio terminou. Esta página já não apresenta equipas pré-seleccionadas nem jogos como informação em directo.',
  'higher does not automatically mean better': 'um valor superior não significa automaticamente um resultado melhor',
  'versus each country’s previous available value': 'face ao valor anterior disponível de cada país',
  'Ghana': 'Gana',
  'Kigali': 'Kigali',
  'Lagos': 'Lagos',
  'Nairobi': 'Nairobi',
  'Eko Hotel & Suites': 'Eko Hotel & Suites',
  'Kempinski Gold Coast City': 'Kempinski Gold Coast City',
  'Kigali Serena Hotel': 'Kigali Serena Hotel',
  'La Mamounia': 'La Mamounia',
  'Luxury African Eco-Lodge': 'Alojamento ecológico africano de luxo',
  'Polana Serena Hotel': 'Polana Serena Hotel',
  'The Mora Zanzibar': 'The Mora Zanzibar',
  'The Silo Hotel': 'The Silo Hotel',
  'Villa Rosa Kempinski': 'Villa Rosa Kempinski',
  'The provider was checked; no numeric series was substituted or estimated.':
    'A entidade de origem foi consultada; nenhuma série numérica foi substituída nem estimada.',
  "Each sector combines a primary official performance proxy with three structural or operating dimensions. Country-level observations use the latest available annual records in the World Bank WDI bulk release retrieved 18 July 2026. Values are cross-country medians, not continental totals; comparison values are median changes versus each country's preceding observation; breadth is the share of reporting markets moving higher. Higher is not automatically better for contextual or adverse indicators. Series with different units are never combined into a synthetic score or investment ranking.":
    'Cada sector combina um indicador oficial principal de desempenho com três dimensões estruturais ou operacionais. As observações nacionais utilizam os registos anuais mais recentes da edição em massa dos Indicadores do Desenvolvimento Mundial do Banco Mundial, recolhida em 18 de Julho de 2026. Os valores são medianas entre países, não totais continentais; as comparações são variações medianas face à observação anterior de cada país; a amplitude corresponde à proporção de mercados declarantes com subida. Um valor superior não é automaticamente melhor nos indicadores contextuais ou adversos. Séries com unidades diferentes nunca são combinadas numa pontuação sintética nem numa classificação de investimento.',
  'Each sector combines a primary official performance proxy with three structural or operating dimensions. Country-level observations use the latest available annual records within the retrieval window. Values are cross-country medians, not continental totals; comparison values are median changes versus each country’s preceding observation; breadth is the share of reporting markets moving higher. Higher is not automatically better for contextual or adverse indicators. Series with different units are never combined into a synthetic score or investment ranking.':
    'Cada sector combina um indicador oficial principal de desempenho com três dimensões estruturais ou operacionais. As observações nacionais utilizam os registos anuais mais recentes disponíveis na janela de recolha. Os valores são medianas entre países, não totais continentais; as comparações são variações medianas face à observação anterior de cada país; a amplitude corresponde à proporção de mercados declarantes com subida. Um valor superior não é automaticamente melhor nos indicadores contextuais ou adversos. Séries com unidades diferentes nunca são combinadas numa pontuação sintética nem numa classificação de investimento.',
  'Article count and views are stored first-party delivery records. No engagement, reach, return or impact estimate is inferred.':
    'A contagem de artigos e as visualizações são registos directos de distribuição. Não se infere qualquer estimativa de interacção, alcance, retorno ou impacto.',
  'Campaign created successfully': 'Campanha criada com êxito',
  'Campaign deleted': 'Campanha eliminada',
  'Campaign is already active': 'A campanha já está activa',
  'Campaign launched successfully': 'Campanha lançada com êxito',
  'Campaign not found': 'Campanha não encontrada',
  'Campaign paused': 'Campanha em pausa',
  'Campaign updated successfully': 'Campanha actualizada com êxito',
  'Impressions and clicks are counted first-party delivery events. CTR is clicks divided by impressions. No ROI, reach multiplier or credibility score is inferred.':
    'As impressões e os cliques são eventos directos de distribuição. A taxa de cliques corresponde aos cliques divididos pelas impressões. Não se infere retorno do investimento, multiplicador de alcance nem pontuação de credibilidade.',
  'No valid fields to update': 'Não existem campos válidos para actualizar',
  'name is required': 'O nome é obrigatório',
  'Country not found': 'País não encontrado',
  'Official observations retain their provider reporting period and unit. Retrieval time is shown separately and never changes an observation year. IMF projections are labelled separately from historical values. An empty provider response is never converted to a zero. The last verified snapshot is retained; World Bank goods-and-services totals can substitute for an unavailable UN Comtrade merchandise record, and an IMF current-account outlook is shown as external-sector evidence when neither provider returns verified trade totals.':
    'As observações oficiais conservam o período de referência e a unidade da entidade de origem. A data de recolha é apresentada separadamente e nunca altera o ano observado. As projecções do FMI são identificadas separadamente dos valores históricos. Uma resposta vazia da entidade de origem nunca é convertida em zero. Conserva-se o último retrato verificado; os totais de bens e serviços do Banco Mundial podem substituir um registo de mercadorias indisponível da UN Comtrade, e o panorama da conta corrente do FMI é apresentado como dado do sector externo quando nenhuma das entidades devolve totais comerciais verificados.',
  'The first verified official-source snapshot is being assembled. Retry shortly.':
    'O primeiro retrato verificado de fontes oficiais está a ser reunido. Tente novamente dentro de instantes.',
  'These are the country table observations currently recorded by BOA-Story. This endpoint does not infer GDP growth or stability from media, engagement or image fields.':
    'Estas são as observações da tabela nacional actualmente registadas pela BOA-Story. Este serviço não infere crescimento do PIB nem estabilidade a partir de notícias, interacções ou elementos de imagem.',
  'Invalid region': 'Região inválida',
  'The briefing is source-linked. Numeric fields describe BOA-Story coverage and audience activity only; no stability or sentiment score is inferred.':
    'A síntese está ligada às fontes. Os campos numéricos descrevem apenas a cobertura da BOA-Story e a actividade do público; não se infere qualquer pontuação de estabilidade ou sentimento.',
  'BOA-Story does not infer sentiment, investment readiness or tourism appeal from article count, engagement or sector mentions. Use the source-linked recommendations and primary evidence instead.':
    'A BOA-Story não infere sentimento, preparação para investimento nem atractivo turístico a partir do número de artigos, das interacções ou das menções sectoriais. Utilize as recomendações ligadas às fontes e os dados primários.',
  'First-party article views only. No social multiplier, inferred reach or directional trend is applied.':
    'Apenas visualizações directas de artigos. Não é aplicado qualquer multiplicador social, alcance inferido ou tendência direccional.',
  'Sector not found': 'Sector não encontrado',
  'A reporting-led watchlist ordered by BOA-Story coverage volume and recency. It is not an opportunity score, market-performance ranking or investment recommendation.':
    'Uma lista de acompanhamento editorial ordenada pelo volume e pela actualidade da cobertura da BOA-Story. Não é uma pontuação de oportunidade, uma classificação de desempenho do mercado nem uma recomendação de investimento.',
  'Admin access required': 'É necessário acesso administrativo',
  'Article summaries do not replace audited accounts, legal instruments, regulatory filings or implementation data.':
    'As sínteses dos artigos não substituem contas auditadas, instrumentos jurídicos, registos regulamentares nem dados de execução.',
  'Article volume is reporting coverage, not market opportunity or country performance.':
    'O volume de artigos representa cobertura editorial, não oportunidade de mercado nem desempenho nacional.',
  'BOA-Story does not calculate a reality-versus-perception score from headlines, engagement, diplomacy or image fields. The replacement fields report weekly editorial coverage and descriptive audience activity only.':
    'A BOA-Story não calcula uma pontuação de realidade face à percepção a partir de títulos, interacções, diplomacia ou elementos de imagem. Os campos de substituição apresentam apenas a cobertura editorial semanal e a actividade descritiva do público.',
  'BOA-Story does not infer market volatility, supply-chain health or confidence from article engagement or headline synthesis. Coverage fields describe platform reporting activity only.':
    'A BOA-Story não infere volatilidade do mercado, robustez da cadeia de abastecimento nem confiança a partir da interacção com artigos ou da síntese de títulos. Os campos de cobertura descrevem apenas a actividade editorial da plataforma.',
  'Country and sector concentration': 'Concentração por país e sector',
  'Every consequential conclusion requires verification against the primary documents identified in the briefing.':
    'Toda a conclusão com consequências exige verificação nos documentos primários identificados na síntese.',
  'Missing required fields: sector_id, country_code, year': 'Faltam campos obrigatórios: sector, país e ano',
  'No comparable real-growth sector series has been saved yet.':
    'Ainda não foi guardada qualquer série sectorial comparável de crescimento real.',
  'No sector analysis available. Request generation via admin.':
    'Não existe análise sectorial disponível. Solicite a preparação através da administração.',
  'Premium tier required for this report': 'Este relatório exige o nível Premium',
  'Publishers represented in the current evidence file': 'Publicações representadas no dossiê documental actual',
  'Ranks only the directly comparable annual real-growth WDI proxies for agriculture, broad industry, fixed investment and manufacturing. It does not compare incompatible credit, digital-adoption, health-spending or travel-receipts series.':
    'Classifica apenas os indicadores anuais directamente comparáveis de crescimento real dos Indicadores do Desenvolvimento Mundial para agricultura, indústria em sentido amplo, investimento fixo e indústria transformadora. Não compara séries incompatíveis de crédito, adopção digital, despesa de saúde ou receitas de viagens.',
  'Report not found': 'Relatório não encontrado',
  'The briefing is bounded by the latest 15 published records and can omit developments outside that window.':
    'A síntese está limitada aos 15 registos publicados mais recentes e pode omitir acontecimentos fora dessa janela.',
  'The official performance series for this sector has not been saved yet.':
    'A série oficial de desempenho deste sector ainda não foi guardada.',
  'The official sector series could not be retrieved and no verified snapshot has been saved yet.':
    'Não foi possível recolher a série sectorial oficial e ainda não existe um retrato verificado guardado.',
  'This source-linked briefing analyzes BOA-Story reporting records. It does not infer investment readiness, stability, safety or economic performance from coverage or engagement.':
    'Esta síntese ligada às fontes analisa os registos publicados pela BOA-Story. Não infere preparação para investimento, estabilidade, segurança ou desempenho económico a partir da cobertura ou da reacção do público.',
  'Velocity is the observed change in BOA-Story publishing volume between consecutive 30-day windows. It is not CAGR, deal flow, project count or sector performance.':
    'A velocidade é a variação observada no volume de publicação da BOA-Story entre períodos consecutivos de 30 dias. Não representa uma taxa de crescimento anual composta, fluxo de operações, número de projectos nem desempenho sectorial.',
  'Weekly points are published BOA-Story article counts. Direction describes coverage momentum, not market performance.':
    'Os pontos semanais correspondem à contagem de artigos publicados pela BOA-Story. A direcção descreve a evolução da cobertura, não o desempenho do mercado.',
  'date not recorded': 'data não registada',
  'zero published records in the evidence window': 'zero registos publicados na janela documental',
  'Page views are first-party article view events recorded during the latest 30 days. They are not divided or transformed into an estimate of unique monthly readers.':
    'As visualizações de página são eventos directos de leitura de artigos registados nos últimos 30 dias. Não são divididas nem transformadas numa estimativa de leitores mensais únicos.',
  'Name, email, and message are required': 'O nome, o correio electrónico e a mensagem são obrigatórios',
  'No verified transactional email provider and sender are configured':
    'Não estão configurados uma entidade e um remetente verificados para correio electrónico transaccional',
  'Thank you for your inquiry. We will respond shortly.': 'Obrigado pelo seu pedido. Responderemos em breve.',
  'AI status check failed': 'A verificação do serviço de informação falhou',
  'Database connection failed': 'A ligação à base de dados falhou',
  'Durable Objects unavailable': 'O serviço de estado persistente está inacessível',
  'KV cache unavailable': 'A memória intermédia está inacessível',
  'Media storage unavailable': 'O armazenamento de conteúdos multimédia está inacessível',
  'Rate limit KV unavailable': 'O controlo de frequência está inacessível',
  'Vectorize query failed': 'A consulta do índice de pesquisa falhou',
  'Worker output check failed': 'A verificação do serviço de publicação falhou',
  'Language': 'Idioma',
  'Photo': 'Fotografia',
  'Photography source': 'Fonte da fotografia',
  'Remove': 'Remover',
  'A reenviar...': 'A reenviar...',
  'Reenviar código': 'Reenviar código',
  'Download ready': 'Transferência pronta',
  'Generating PDF Briefing...': 'A preparar a síntese em PDF...',
  'Link copied to clipboard': 'Ligação copiada para a área de transferência',
  'Removed from Library': 'Removido da biblioteca',
  'Saved to Library': 'Guardado na biblioteca',
  'An error occurred. Please try again.': 'Ocorreu um erro. Tente novamente.',
  'Registration failed': 'A inscrição falhou',
  'Registration successful!': 'Inscrição concluída com êxito!',
  'Itinerary Request Received': 'Pedido de itinerário recebido',
  'VIP Booking Request Sent': 'Pedido de reserva VIP enviado',
  'Network error. Please try again.': 'Erro de rede. Tente novamente.',
  'Please enter a valid 6-digit code': 'Introduza um código válido de seis algarismos',
  'Verification failed': 'A verificação falhou',
  'Failed to save settings.': 'Não foi possível guardar as definições.',
  'Settings saved successfully.': 'Definições guardadas com êxito.',
  'Failed to submit request. Please try again.': 'Não foi possível enviar o pedido. Tente novamente.',
  'Event registration recorded': 'Inscrição no evento registada',
  'Failed to register. Please try again.': 'Não foi possível concluir a inscrição. Tente novamente.',
  'Bookmark removed': 'Marcador removido',
  'Failed to resend. Please try again.': 'Não foi possível reenviar. Tente novamente.',
  'Invalid verification code. Please try again.': 'Código de verificação inválido. Tente novamente.',
  'No active': 'Sem adesão activa',
  'No active membership found for this email.': 'Não foi encontrada uma adesão activa para este correio electrónico.',
  'That code has expired. Please request a new one.': 'O código expirou. Solicite um novo código.',
  'Your membership has expired. Please renew on Ko-fi to restore access.':
    'A sua adesão expirou. Renove-a no Ko-fi para recuperar o acesso.',
  'expired': 'expirado',
  "You're already subscribed with this email.": 'Este correio electrónico já está inscrito.',
  'Equipas actualizadas': 'Equipas actualizadas',
  'A síntese está limitada aos 15 registos publicados mais recentes e pode omitir acontecimentos fora dessa janela.':
    'A síntese está limitada aos 15 registos publicados mais recentes e pode omitir acontecimentos fora dessa janela.',
  'As sínteses dos artigos não substituem contas auditadas, instrumentos jurídicos, registos regulamentares nem dados de execução.':
    'As sínteses dos artigos não substituem contas auditadas, instrumentos jurídicos, registos regulamentares nem dados de execução.',
  'Esta síntese ligada às fontes analisa os registos publicados pela BOA-Story. Não infere preparação para investimento, estabilidade, segurança ou desempenho económico a partir da cobertura ou da reacção do público.':
    'Esta síntese ligada às fontes analisa os registos publicados pela BOA-Story. Não infere preparação para investimento, estabilidade, segurança ou desempenho económico a partir da cobertura ou da reacção do público.',
  'O volume de artigos representa cobertura editorial, não oportunidade de mercado nem desempenho nacional.':
    'O volume de artigos representa cobertura editorial, não oportunidade de mercado nem desempenho nacional.',
  'Toda a conclusão com consequências exige verificação nos documentos primários identificados na síntese.':
    'Toda a conclusão com consequências exige verificação nos documentos primários identificados na síntese.',
  'ligado às fontes': 'ligado às fontes',
  'zero registos publicados na janela documental': 'zero registos publicados na janela documental',
  'Read evidence in layers: definition, value, comparison, coverage, time period and limitation. This stops a large number, positive movement or high ranking from being mistaken for a complete conclusion.':
    'Leia os dados por camadas: definição, valor, comparação, cobertura, período e limitação. Isto evita que um número elevado, uma evolução positiva ou uma classificação alta sejam confundidos com uma conclusão completa.',
  'A value is evidence, not a verdict.': 'Um valor é um dado, não um veredicto.',
  'Inspect provider record ↗': 'Consultar o registo do fornecedor ↗',
  'Open report': 'Abrir o relatório',
  'Every photograph shown here is attached to a specific published report and carries a visible credit linking back to the publisher or rights holder. Illustrative and generated imagery is excluded.':
    'Cada fotografia aqui apresentada está associada a um relatório publicado específico e inclui um crédito visível com ligação ao editor ou ao titular dos direitos. São excluídas imagens ilustrativas e geradas.',
  'Something went wrong': 'Ocorreu um erro',
  "This page didn't load properly. Reloading usually fixes it, you might just be on an older version of the site.":
    'Esta página não foi carregada correctamente. Em geral, voltar a carregá-la resolve o problema; poderá estar a usar uma versão anterior do sítio.',
  'Reload this page': 'Voltar a carregar esta página',
  'Back to home': 'Voltar ao início',
  'Member preview · Subscription content temporarily open': 'Pré-visualização de membro · Conteúdo de subscrição temporariamente aberto',
  'Member preview mode — all subscription content is temporarily open': 'Modo de pré-visualização de membro — todo o conteúdo de subscrição está temporariamente aberto',
  'Premium Access': 'Acesso premium',
  'Log in to access your curated briefings, market analytics, and VIP concierge portal.':
    'Inicie sessão para aceder às suas sínteses seleccionadas, análises de mercado e portal de concierge VIP.',
  'Active Narrative Lens': 'Perspectiva narrativa activa',
  'Adaptive Intelligence': 'Inteligência adaptativa',
  'Configure the narrative lens and calibrate data vectors.': 'Configure a perspectiva narrativa e calibre os vectores de dados.',
  'Draft Briefing': 'Preparar síntese',
  'Identify Opps': 'Identificar oportunidades',
  'Summarize Risks': 'Resumir riscos',
  'Market Context': 'Contexto de mercado',
  'Refine parameters...': 'Aperfeiçoar parâmetros...',
  'Mission Control': 'Centro de controlo',
  'Define your operational parameters.': 'Defina os seus parâmetros operacionais.',
  'Operational Role': 'Função operacional',
  'Priority Markets': 'Mercados prioritários',
  'Strategic Sectors': 'Sectores estratégicos',
  'Delivery Format': 'Formato de entrega',
  'Strategic Overview': 'Panorama estratégico',
  'Live Intelligence Map': 'Mapa de inteligência em directo',
  'Standard Activity': 'Actividade normal',
  'High Volume Interest': 'Interesse de elevado volume',
  'Signal Strength': 'Força do sinal',
  'Top Intelligence': 'Informação principal',
  'Dominant Sector': 'Sector dominante',
  'Emerging Narratives': 'Narrativas emergentes',
  'Stability Index': 'Índice de estabilidade',
  'Coverage includes': 'A cobertura inclui',
  'new reports': 'novos relatórios',
  'from the last 24 hours. The primary narrative thread is': 'das últimas 24 horas. O principal fio narrativo é',
  ', which is currently outpacing broader regional currents.': ', que actualmente avança mais depressa do que as tendências regionais mais amplas.',
  'market is': 'o mercado está',
  'today, driven by dynamic shifts in': 'hoje, impulsionado por alterações em',
  'No country values were supplied to this view.': 'Não foram fornecidos valores nacionais para esta vista.',
  'Africa at the World Cup': 'África no Campeonato do Mundo',
  'Africa still standing': 'África continua em prova',
  'African nations at the FIFA World Cup — view fixtures and standings': 'Selecções africanas no Campeonato do Mundo da FIFA — consulte os jogos e as classificações',
  'Dismiss World Cup banner': 'Fechar o anúncio do Campeonato do Mundo',
  'Fixtures and standings update automatically from a live sports feed.': 'Os jogos e as classificações são actualizados automaticamente a partir de uma fonte desportiva em directo.',
  'Next': 'Seguinte',
  'Today': 'Hoje',
  'Tomorrow': 'Amanhã',
  'flying the flag': 'a representar o continente',
  'on the world stage.': 'no palco mundial.',
  'Follow the coverage →': 'Acompanhar a cobertura →',
  "We're following every African story at the tournament, the cities, the fans, and the everyday energy beyond the scoreline.":
    'Acompanhamos todas as histórias africanas no torneio, as cidades, os adeptos e a vida para além do resultado.',
  'Teams updated': 'Selecções actualizadas',
  'Story Updates': 'Actualizações das histórias',
  'Posts': 'Publicações',
  'Story': 'História',
  'Browse countries': 'Consultar países',
  'Key Upcoming Summits': 'Principais cimeiras futuras',
  'No upcoming summits scheduled for this region.': 'Não há cimeiras futuras programadas para esta região.',
  'View Agenda': 'Ver o programa',
  'Register': 'Inscrever-se',
  'Confirmation Code': 'Código de confirmação',
  'Job Title': 'Cargo',
  'Director': 'Director',
  'Dietary Requirements (Optional)': 'Requisitos alimentares (facultativo)',
  'Vegetarian, Gluten-free, etc.': 'Vegetariano, sem glúten, etc.',
  'Standard Access': 'Acesso normal',
  'VIP All-Access': 'Acesso VIP completo',
  'Media Pass': 'Credencial de imprensa',
  'Official Government Portals': 'Portais oficiais do Estado',
  'Business Setup': 'Constituição de empresas',
  'Commercial Portal': 'Portal comercial',
  'Experience': 'Experiência',
  'Visit': 'Visitar',
  'Open E-Visa': 'Abrir o visto electrónico',
  'Official portal for e-visas and entry requirements for': 'Portal oficial de vistos electrónicos e requisitos de entrada para',
  'Register your company and explore local partnership opportunities in': 'Registe a sua empresa e explore oportunidades de parceria local em',
  'Official tourism board info, hotels, and travel experiences.': 'Informações do organismo oficial de turismo, hotéis e experiências de viagem.',
  'The platform facilitates direct links to sovereign government assets for investor clarity.':
    'A plataforma disponibiliza ligações directas a recursos oficiais para dar maior clareza aos investidores.',
  'Featured Property': 'Estabelecimento em destaque',
  'Public Rate': 'Preço público',
  'Exclusive Corporate Rate': 'Preço empresarial exclusivo',
  'Compare Public Rates': 'Comparar preços públicos',
  'Request VIP Rate': 'Pedir preço VIP',
  'Contact Travel Desk': 'Contactar o serviço de viagens',
  'Compare': 'Comparar',
  'Complex Itinerary?': 'Itinerário complexo?',
  'Tell us about your trip': 'Fale-nos da sua viagem',
  'Multi-city flights': 'Voos com várias cidades',
  'Private transfers': 'Transferes privados',
  'Visa assistance': 'Apoio com vistos',
  'Translator services': 'Serviços de interpretação',
  'Let our specialized Africa travel partners handle logistics, transfers, and multi-city bookings.':
    'Permita que os nossos parceiros especializados em viagens em África tratem da logística, dos transferes e das reservas em várias cidades.',
  "Check availability on major platforms if you don't require corporate benefits.": 'Consulte a disponibilidade nas principais plataformas se não precisar de vantagens empresariais.',
  'No credit card required to request. Availability confirmed in 2h.': 'Não é necessário cartão de crédito para efectuar o pedido. Disponibilidade confirmada no prazo de duas horas.',
  'We earn a small commission when you book through these links at no extra cost to you.':
    'Recebemos uma pequena comissão quando reserva através destas ligações, sem qualquer custo adicional para si.',
  'Research on routes, accommodation and transport options, with provider availability and current terms confirmed before engagement.':
    'Investigação sobre rotas, alojamento e opções de transporte, com disponibilidade dos fornecedores e condições actuais confirmadas antes da contratação.',
  'By submitting this form, you consent to our team reviewing your requirements and communicating with you regarding concierge services. Your data is strictly confidential.':
    'Ao enviar este formulário, autoriza a nossa equipa a analisar os seus requisitos e a contactá-lo sobre os serviços de concierge. Os seus dados são estritamente confidenciais.',
  'Method and fair comparison': 'Método e comparação justa',
  'How countries differ:': 'Diferenças entre países:',
  'countries covered': 'países abrangidos',
  'countries higher': 'países com valor superior',
  'Half of reporting countries fall between': 'Metade dos países declarantes situa-se entre',
  'half of reporting countries sit between': 'metade dos países declarantes situa-se entre',
  'each supporting measure keeps its own unit, date and coverage. A higher reading is not always favourable.':
    'cada indicador complementar conserva a sua própria unidade, data e cobertura. Um valor mais elevado nem sempre é favorável.',
  'Understand the main measure first, then use three separate measures to see structure and operating conditions. Dates, country coverage and limitations remain visible throughout.':
    'Compreenda primeiro o indicador principal e utilize depois três indicadores distintos para observar a estrutura e as condições operacionais. As datas, a cobertura nacional e as limitações permanecem sempre visíveis.',
  'means the middle reported country recorded 4.2% real growth. It does not mean every country grew by 4.2%, that Africa’s combined economy grew at that exact rate, or that the same conditions persisted after the observation period.':
    'significa que o país declarante central registou um crescimento real de 4,2%. Não significa que todos os países tenham crescido 4,2%, que a economia conjunta de África tenha crescido exactamente a essa taxa ou que as mesmas condições tenham persistido após o período de observação.',
  '“Median real growth: 4.2%, 39 countries, observations from 2023–2024”': '«Crescimento real mediano: 4,2%, 39 países, observações de 2023–2024»',
  '% of comparable countries recorded a higher value, using': '% dos países comparáveis registaram um valor superior, com base em',
  '; they do not measure sector growth or investment returns. Open Market Intelligence for performance indicators and cross-country comparisons.':
    '; não medem o crescimento sectorial nem a rendibilidade do investimento. Abra a Inteligência de Mercado para consultar indicadores de desempenho e comparações entre países.',
  '(Subject to Avail.)': '(Sujeito a disponibilidade)',
  '/mo billed monthly': '/mês, facturado mensalmente',
  'Access renews automatically via Ko-fi': 'O acesso é renovado automaticamente através do Ko-fi',
  'Africa business intelligence': 'Inteligência empresarial africana',
  'African Luxury Concierge Desk': 'Serviço africano de concierge de luxo',
  'An established property included as a starting point for independent research. Confirm location, facilities, policies, rates and current operating conditions directly before making travel decisions.':
    'Um estabelecimento reconhecido, incluído como ponto de partida para investigação independente. Confirme directamente a localização, as instalações, as políticas, os preços e as condições actuais de funcionamento antes de tomar decisões de viagem.',
  'Ask a question...': 'Faça uma pergunta...',
  'Ask the Analyst': 'Perguntar ao analista',
  'Best of Africa Corporate Rates & Benefits': 'Preços e vantagens empresariais da Best of Africa',
  'Close −': 'Fechar −',
  'Explore Africa Briefing': 'Explorar a síntese sobre África',
  'Export PDF': 'Exportar PDF',
  'Independent reporting on African lives, cities, businesses and ideas—grounded in context, not stereotypes.':
    'Informação independente sobre vidas, cidades, empresas e ideias africanas — assente no contexto, não em estereótipos.',
  'Ivisa / Entry': 'Visto / Entrada',
  'Open Country Briefing': 'Abrir a síntese nacional',
  'Open Market Intelligence': 'Abrir a Inteligência de Mercado',
  'Pro Mode Active': 'Modo profissional activo',
  'Recommended': 'Recomendado',
  'Retry dossier': 'Voltar a carregar o dossiê',
  'Seek': 'Posição',
  'Source-grounded briefing': 'Síntese assente nas fontes',
  "Stay close to Africa's story.": 'Acompanhe de perto a história de África.',
  'Stories from the Continent': 'Histórias do continente',
  'TTS mode, Premium integration pending.': 'Modo de leitura sonora; integração premium pendente.',
  'This shortlist is informational. BOA-Story does not represent that it has a commercial relationship with the listed properties and does not guarantee prices, availability, security conditions or amenities.':
    'Esta lista é informativa. A BOA-Story não declara ter uma relação comercial com os estabelecimentos apresentados e não garante preços, disponibilidade, condições de segurança ou comodidades.',
  'Toolkit sections': 'Secções do conjunto de ferramentas',
  'Use the official macroeconomic and trade evidence above while country-sector records pass source review.':
    'Utilize os dados macroeconómicos e comerciais oficiais acima enquanto os registos por país e sector passam pela revisão das fontes.',
  'Verified Partner': 'Parceiro verificado',
  'VIP Direct': 'Acesso VIP directo',
  'Welcome back,': 'Bem-vindo de novo,',
  'coffees received so far. Each one goes directly toward keeping the platform live and the reporting going. This is what independent, community-backed journalism looks like.':
    'cafés recebidos até agora. Cada um contribui directamente para manter a plataforma activa e a informação em curso. É assim que funciona um jornalismo independente apoiado pela comunidade.',
  'e.g. Kenya tax reform, African data centres': 'por exemplo, reforma fiscal no Quénia, centros de dados africanos',
  'e.g. Lagos, Nigeria & Kigali, Rwanda': 'por exemplo, Lagos, Nigéria e Kigali, Ruanda',
  'I need to visit Maputo, then Beira...': 'Preciso de visitar Maputo e depois a Beira...',
  'About | BOA-Story': 'Sobre | BOA-Story',
  'Access Expired | BOA-Story': 'Acesso expirado | BOA-Story',
  'Africa Business Travel Guide | BOA-Story': 'Guia de viagens de negócios em África | BOA-Story',
  'Africa at the World Cup | BOA-Story': 'África no Campeonato do Mundo | BOA-Story',
  'Briefing Reports | BOA-Story': 'Relatórios de síntese | BOA-Story',
  'Concierge & Corporate Services | BOA-Story': 'Concierge e serviços empresariais | BOA-Story',
  'Member Access | BOA-Story': 'Acesso de membro | BOA-Story',
  'Membership | BOA-Story': 'Subscrição | BOA-Story',
  'Newsletter | BOA-Story': 'Boletim informativo | BOA-Story',
  'Photo Desk | BOA-Story': 'Arquivo fotográfico | BOA-Story',
  'Search | BOA-Story': 'Pesquisa | BOA-Story',
  'Stories | BOA-Story': 'Histórias | BOA-Story',
  'Subscribed | BOA-Story': 'Subscrição confirmada | BOA-Story',
  'Summits & Events | BOA-Story': 'Cimeiras e eventos | BOA-Story',
  'Supporter Feed | BOA-Story': 'Área dos apoiantes | BOA-Story',
  'Your Africa Briefing | BOA-Story': 'A sua síntese sobre África | BOA-Story',
  'Definition': 'Definição',
  'Value and unit': 'Valor e unidade',
  'Comparison': 'Comparação',
  'Coverage': 'Cobertura',
  'Timing': 'Período',
  'Boundary': 'Limitação',
  'Open guide': 'Abrir guia',
  'Hide guide': 'Ocultar guia',
  'Median': 'Mediana',
  'What exactly is measured, and what part of the economy or sector does it represent?':
    'O que é medido exactamente e que parte da economia ou do sector representa?',
  'Is it a dollar total, percentage, percentage-point change, number of people or per-person value?':
    'Trata-se de um total em dólares, de uma percentagem, de uma variação em pontos percentuais, de um número de pessoas ou de um valor por pessoa?',
  'Is the page comparing countries, periods, a median, a total or a previous observation?':
    'A página compara países, períodos, uma mediana, um total ou uma observação anterior?',
  'How many countries supplied usable data, and could missing countries change the continental picture?':
    'Quantos países forneceram dados utilizáveis e poderiam os países em falta alterar o panorama continental?',
  'Which years are represented, and do reporting delays limit claims about conditions today?':
    'Que anos estão representados e os atrasos na publicação limitam as conclusões sobre as condições actuais?',
  'What can the indicator support, and what requires other evidence or professional diligence?':
    'Que conclusões permite o indicador e o que exige outros dados ou diligência profissional?',
  'Three distinctions that prevent misleading conclusions': 'Três distinções que evitam conclusões enganadoras',
  'Size is not prosperity': 'Dimensão não é prosperidade',
  'Total GDP describes economic scale. GDP per person answers a different question and still does not directly measure household income or wellbeing.':
    'O PIB total descreve a dimensão económica. O PIB por pessoa responde a outra questão e continua a não medir directamente o rendimento das famílias nem o bem-estar.',
  'Nominal is not real': 'Nominal não é real',
  'Current-dollar values move with prices and exchange rates. Real growth is designed to show changes in output after adjusting for price movements.':
    'Os valores em dólares correntes variam com os preços e as taxas de câmbio. O crescimento real procura mostrar a evolução da produção depois de descontadas as variações de preços.',
  'Total is not typical': 'Total não é valor típico',
  'A continental or regional total can be dominated by large economies. A median describes the middle reporting country instead.':
    'Um total continental ou regional pode ser dominado pelas grandes economias. A mediana descreve, em alternativa, o país declarante central.',
  'How the performance framework fits together': 'Como se articula o quadro de desempenho',
  'The headline indicator captures one observable part of sector performance. Read its scope before treating it as a description of the entire sector.':
    'O indicador principal capta uma parte observável do desempenho do sector. Leia o seu âmbito antes de o considerar uma descrição de todo o sector.',
  'Access, cost, capacity, infrastructure and demand help explain operating conditions, but their different units must remain separate.':
    'O acesso, o custo, a capacidade, as infra-estruturas e a procura ajudam a explicar as condições operacionais, mas as respectivas unidades devem permanecer separadas.',
  'Country distribution': 'Distribuição por países',
  'Coverage, breadth and the middle-half range show whether the headline reflects many countries or hides substantial differences.':
    'A cobertura, a amplitude e o intervalo da metade central mostram se o valor principal reflecte muitos países ou oculta diferenças substanciais.',
  'How to build a complete sector view': 'Como construir uma visão completa do sector',
  'Level': 'Nível',
  'The latest value shows the recorded level for the named measure, not whether the sector is universally strong or weak.':
    'O valor mais recente mostra o nível registado para o indicador identificado, não se o sector é universalmente forte ou fraco.',
  'Change': 'Variação',
  'The comparison shows direction from the previous available observation; it may not represent exactly one calendar year.':
    'A comparação mostra a direcção desde a observação anterior disponível; pode não corresponder exactamente a um ano civil.',
  'Context': 'Contexto',
  'Country range, coverage, supporting indicators and diligence questions explain how much confidence and practical meaning to attach to the result.':
    'O intervalo entre países, a cobertura, os indicadores complementares e as questões de diligência explicam a confiança e o significado prático que podem ser atribuídos ao resultado.',
  'The middle country after values are ordered. It is not the total or arithmetic average.':
    'O país central depois de ordenados os valores. Não é o total nem a média aritmética.',
  'The share of Africa’s 54 countries with usable observations for that indicator.':
    'A proporção dos 54 países de África com observações utilizáveis para esse indicador.',
  'Prior observation': 'Observação anterior',
  'The previous available value for each country; it may not be exactly one year earlier.':
    'O valor anterior disponível para cada país; pode não corresponder exactamente ao ano precedente.',
  'Percentage point (pp)': 'Ponto percentual (pp)',
  'The direct difference between percentages: 10% to 12% is +2 pp, not +2%.':
    'A diferença directa entre percentagens: de 10% para 12% são +2 pp, não +2%.',
  'Continental-data guide': 'Guia dos dados continentais',
  'Read Africa-wide economic evidence carefully and confidently.':
    'Leia os dados económicos de toda a África com rigor e confiança.',
  'This page brings together official economic, population, trade, price, investment and sector measures. Some figures are country totals; others describe the middle reporting country.':
    'Esta página reúne indicadores oficiais sobre economia, população, comércio, preços, investimento e sectores. Alguns valores são totais nacionais; outros descrevem o país declarante central.',
  'You should be able to distinguish economic size from living standards, nominal values from real growth, and a regional total from a typical-country reading.':
    'Deverá conseguir distinguir a dimensão económica do nível de vida, os valores nominais do crescimento real e um total regional do valor de um país típico.',
  'Start with the indicator name, unit and aggregation method shown on the card.':
    'Comece pelo nome do indicador, pela unidade e pelo método de agregação apresentados no cartão.',
  'Check whether the figure is a total, median, percentage or per-person value.':
    'Confirme se o valor é um total, uma mediana, uma percentagem ou um valor por pessoa.',
  'Read the number of reporting countries and observation years before calling it continental.':
    'Leia o número de países declarantes e os anos de observação antes de classificar o valor como continental.',
  'Compare countries or regions only on the same indicator, unit and reasonably aligned period.':
    'Compare países ou regiões apenas com base no mesmo indicador, na mesma unidade e em períodos razoavelmente alinhados.',
  'Use the plain-language interpretation to understand the result, then read the stated caveat.':
    'Utilize a interpretação em linguagem clara para compreender o resultado e leia depois a ressalva indicada.',
  'Open the official source before using a figure in a consequential business or policy decision.':
    'Abra a fonte oficial antes de utilizar um valor numa decisão empresarial ou política com consequências importantes.',
  'Nominal value': 'Valor nominal',
  'A value measured in current prices; inflation and exchange rates can affect comparisons over time.':
    'Um valor medido a preços correntes; a inflação e as taxas de câmbio podem afectar as comparações ao longo do tempo.',
  'Real growth': 'Crescimento real',
  'Change after adjusting for price movements, intended to show changes in actual output.':
    'Variação depois de descontadas as oscilações de preços, destinada a mostrar mudanças na produção real.',
  'Aggregation': 'Agregação',
  'The rule used to combine country observations, such as a total or median.':
    'A regra utilizada para combinar observações nacionais, como um total ou uma mediana.',
  'The share of Africa’s 54 countries represented by usable observations.':
    'A proporção dos 54 países de África representada por observações utilizáveis.',
  'Page guide': 'Guia da página',
  'Understand what this page offers and how to use it.': 'Compreenda o que esta página oferece e como a utilizar.',
  'The introduction explains the page’s purpose. Major sections move from overview to detail, while links and controls let you inspect the underlying content.':
    'A introdução explica a finalidade da página. As secções principais avançam da visão geral para o pormenor, enquanto as ligações e os controlos permitem consultar o conteúdo subjacente.',
  'You should be able to find the main information, understand its context and move to the relevant story, country, event or intelligence page.':
    'Deverá conseguir encontrar a informação principal, compreender o seu contexto e seguir para a história, o país, o evento ou a página de inteligência pertinente.',
  'Read the title and introduction to confirm the page’s purpose.':
    'Leia o título e a introdução para confirmar a finalidade da página.',
  'Use the sticky main navigation and section navigation on long pages.':
    'Nas páginas extensas, utilize a navegação principal fixa e a navegação entre secções.',
  'Begin with summaries, then open supporting detail when needed.':
    'Comece pelas sínteses e abra depois os pormenores de apoio quando necessário.',
  'Check labels, dates and sources before relying on a claim.':
    'Confirme os rótulos, as datas e as fontes antes de confiar numa afirmação.',
  'Use clear action links to continue to the next relevant page.':
    'Utilize as ligações de acção para prosseguir para a página pertinente seguinte.',
  'Return to this guide whenever an unfamiliar term or structure appears.':
    'Volte a este guia sempre que encontrar um termo ou uma estrutura desconhecidos.',
  'Overview': 'Visão geral',
  'A concise orientation to the page, not a replacement for its supporting detail.':
    'Uma orientação concisa sobre a página, que não substitui os pormenores de apoio.',
  'Source': 'Fonte',
  'The publisher, institution or dataset from which information was obtained.':
    'O editor, a instituição ou o conjunto de dados de onde foi obtida a informação.',
  'Background needed to understand why a fact or event matters.':
    'O enquadramento necessário para compreender por que razão um facto ou acontecimento é importante.',
  'Updated': 'Actualizado',
  'When the page or dataset was most recently refreshed.':
    'A data da actualização mais recente da página ou do conjunto de dados.',
  'Apply for a Pilot': 'Candidatar-se a um projecto-piloto',
  'Supporter': 'Apoiador',
  'Founding Member': 'Membro fundador',
  'Founding Patron': 'Patrono fundador',
  'Become a Supporter': 'Tornar-se apoiador',
  'Become a Founding Member': 'Tornar-se membro fundador',
  'Become a Patron': 'Tornar-se patrono',
  'Access to stories and creator updates.': 'Acesso às histórias e às actualizações da equipa editorial.',
  'Direct input on future story coverage.': 'Participação directa nas futuras prioridades de cobertura.',
  'Name credited on the platform as a core sponsor.': 'Nome reconhecido na plataforma como patrocinador principal.',
  'Access to all published stories': 'Acesso a todas as histórias publicadas',
  'Behind-the-scenes creator updates': 'Actualizações dos bastidores da equipa editorial',
  'Early supporter badge on your profile': 'Distintivo de primeiro apoiador no seu perfil',
  'Everything in Supporter': 'Todas as vantagens do plano Apoiador',
  'Vote on the next story topic via monthly poll': 'Voto mensal sobre o tema da próxima história',
  'Early access to new drafts': 'Acesso antecipado a novos rascunhos',
  'Everything in Founding Member': 'Todas as vantagens do plano Membro fundador',
  'Monthly 1-on-1 chat about the project': 'Conversa individual mensal sobre o projecto',
  'Credited as a core sponsor in every published report': 'Reconhecimento como patrocinador principal em todos os relatórios publicados',
  'The quiet infrastructure bet paying off in Nairobi': 'A aposta discreta em infra-estruturas que começa a dar frutos em Nairobi',
  'Inside the fintech quietly banking the unbanked': 'Por dentro da empresa financeira digital que está a integrar quem não tinha conta bancária',
  'How smallholder co-ops are rewriting the export map': 'Como as cooperativas de pequenos produtores estão a redesenhar o mapa das exportações',
  'Daily summary of tracked markets.': 'Resumo diário dos mercados acompanhados.',
  'Immediate notification for high-volatility events.': 'Notificação imediata de acontecimentos de elevada volatilidade.',
  'When new premium reports are published.': 'Quando forem publicados novos relatórios para membros.',
  'Algeria': 'Argélia',
  'Cameroon': 'Camarões',
  "Côte d'Ivoire": 'Costa do Marfim',
  'Egypt': 'Egipto',
  'Morocco': 'Marrocos',
  'Nigeria': 'Nigéria',
  'South Africa': 'África do Sul',
  'Senegal': 'Senegal',
  'Tunisia': 'Tunísia',
  'FIFA World Cup 2026': 'Campeonato do Mundo da FIFA 2026',
  'BOA source-linked reporting': 'cobertura da BOA ligada às fontes',
  'Observation period': 'Período de observação',
  'external-sector record': 'registo do sector externo',
  'historical observations and separately labelled projections': 'observações históricas e projecções identificadas separadamente',
  'Business portal': 'Portal empresarial',
  'official portal': 'portal oficial',
  'Real value-added growth across reporting African economies.': 'Crescimento real do valor acrescentado nas economias africanas com dados disponíveis.',
  'National accounts measure primary-sector output; they do not isolate agribusiness margins, prices or listed-company returns.': 'As contas nacionais medem a produção do sector primário; não isolam margens da agro-indústria, preços nem rendimentos de empresas cotadas.',
  'Broad industrial output growth used as the comparable macro proxy for energy and extractive activity.': 'Crescimento amplo da produção industrial utilizado como indicador macroeconómico comparável da energia e da actividade extractiva.',
  'This broad series also includes manufacturing and construction; commodity prices and company returns require separate instruments.': 'Esta série ampla também inclui a indústria transformadora e a construção; os preços das matérias-primas e os rendimentos das empresas exigem indicadores próprios.',
  'Bank credit supplied to the private sector relative to economic output.': 'Crédito bancário concedido ao sector privado em relação à produção económica.',
  'Credit depth is a financial-intermediation proxy, not a measure of bank profitability, asset quality or investment returns.': 'A profundidade do crédito é um indicador da intermediação financeira, não uma medida da rentabilidade bancária, da qualidade dos activos ou do rendimento dos investimentos.',
  'Year-over-year change in per-capita health expenditure in current US dollars.': 'Variação homóloga da despesa de saúde por pessoa, em dólares correntes dos Estados Unidos.',
  'The measure includes public and private health spending and is affected by inflation and exchange rates; it is not pharmaceutical revenue.': 'A medida inclui a despesa pública e privada em saúde e é afectada pela inflação e pelas taxas de câmbio; não representa receitas farmacêuticas.',
  'Real growth in fixed-asset formation across reporting African economies.': 'Crescimento real da formação de activos fixos nas economias africanas com dados disponíveis.',
  'Fixed capital formation includes machinery and other assets as well as infrastructure and does not measure project bankability.': 'A formação de capital fixo inclui maquinaria e outros activos, além de infra-estruturas, e não mede a viabilidade financeira dos projectos.',
  'Real manufacturing value-added growth across reporting African economies.': 'Crescimento real do valor acrescentado da indústria transformadora nas economias africanas com dados disponíveis.',
  'National manufacturing output does not capture subsector margins, capacity utilisation or listed-company performance.': 'A produção industrial nacional não revela margens por sub-sector, utilização da capacidade nem o desempenho das empresas cotadas.',
  'Internet adoption and its annual change across reporting African economies.': 'Adopção da Internet e respectiva variação anual nas economias africanas com dados disponíveis.',
  'Adoption is a demand and access proxy, not technology-company revenue, venture funding or innovation productivity.': 'A adopção é um indicador da procura e do acesso, não das receitas das empresas tecnológicas, do capital de risco ou da produtividade da inovação.',
  'Travel services as a share of total service exports and the annual change across reporting African economies.': 'Serviços de viagens como parcela das exportações totais de serviços e respectiva variação anual nas economias africanas com dados disponíveis.',
  'The series covers business and personal travel and measures export concentration, not visitor counts, hotel profitability or domestic tourism.': 'A série abrange viagens de negócios e pessoais e mede a concentração das exportações, não o número de visitantes, a rentabilidade hoteleira ou o turismo interno.',
  'rising': 'a subir',
  'falling': 'a descer',
  'stable': 'estável',
  'Agriculture share of GDP': 'Peso da agricultura no PIB',
  'Productive structure': 'Estrutura produtiva',
  'Employment in agriculture': 'Emprego na agricultura',
  'Employment exposure': 'Exposição do emprego',
  'Cereal yield': 'Rendimento dos cereais',
  'Crop productivity': 'Produtividade agrícola',
  'Access to electricity': 'Acesso à electricidade',
  'Electricity access': 'Acesso à electricidade',
  'Renewable energy consumption': 'Consumo de energia renovável',
  'Renewable energy share': 'Peso da energia renovável',
  'Electric power transmission and distribution losses': 'Perdas na transmissão e distribuição de electricidade',
  'Grid losses': 'Perdas da rede',
  'Account ownership at a financial institution or mobile-money provider': 'Titularidade de conta numa instituição financeira ou num prestador de dinheiro móvel',
  'Financial account access': 'Acesso a contas financeiras',
  'Automated teller machines': 'Caixas automáticas',
  'Physical banking access': 'Acesso bancário físico',
  'Lending interest rate': 'Taxa de juro dos empréstimos',
  'Cost of bank credit': 'Custo do crédito bancário',
  'Current health expenditure': 'Despesa corrente de saúde',
  'Health-system funding': 'Financiamento do sistema de saúde',
  'Physicians': 'Médicos',
  'Physician capacity': 'Capacidade médica',
  'Hospital beds': 'Camas hospitalares',
  'Inpatient capacity': 'Capacidade de internamento',
  'Gross fixed capital formation': 'Formação bruta de capital fixo',
  'Investment intensity': 'Intensidade do investimento',
  'Air transport passengers carried': 'Passageiros transportados por via aérea',
  'Air traffic growth': 'Crescimento do tráfego aéreo',
  'Container port traffic': 'Tráfego portuário de contentores',
  'Port throughput growth': 'Crescimento do movimento portuário',
  'Manufacturing value added': 'Valor acrescentado da indústria transformadora',
  'Manufacturing weight': 'Peso da indústria transformadora',
  'Manufactured exports': 'Exportações de produtos transformados',
  'Export sophistication': 'Sofisticação das exportações',
  'Employment in industry': 'Emprego na indústria',
  'Industrial employment': 'Emprego industrial',
  'Mobile cellular subscriptions': 'Assinaturas de comunicações móveis',
  'Mobile connectivity': 'Conectividade móvel',
  'Fixed broadband subscriptions': 'Assinaturas de banda larga fixa',
  'Fixed broadband depth': 'Penetração da banda larga fixa',
  'Secure internet servers': 'Servidores seguros de Internet',
  'Digital transaction infrastructure': 'Infra-estrutura de transacções digitais',
  'International tourism receipts': 'Receitas do turismo internacional',
  'Reported inbound receipts': 'Receitas de entrada declaradas',
  'International tourism arrivals': 'Chegadas de turistas internacionais',
  'Reported international arrivals': 'Chegadas internacionais declaradas',
  'Shows how much national output remains directly tied to agriculture, forestry and fishing.': 'Mostra a proporção da produção nacional directamente ligada à agricultura, silvicultura e pesca.',
  'A larger share can indicate sector importance or limited diversification; it is not a profitability measure.': 'Um peso maior pode indicar a importância do sector ou uma diversificação limitada; não mede a rentabilidade.',
  'Measures the workforce share dependent on agricultural activity and structural transition.': 'Mede a parcela da população activa dependente da actividade agrícola e da transição estrutural.',
  'Employment shares do not show wages, informality, labour productivity or seasonal underemployment.': 'As parcelas de emprego não revelam salários, informalidade, produtividade do trabalho nem subemprego sazonal.',
  'Provides a comparable physical productivity signal for harvested cereal land.': 'Fornece um indicador físico comparável da produtividade das terras cerealíferas colhidas.',
  'Crop mix, weather, irrigation and input use differ materially; cereal yield does not represent all agriculture.': 'A combinação de culturas, o clima, a irrigação e os factores de produção variam significativamente; o rendimento cerealífero não representa toda a agricultura.',
  'Measures the population able to use electricity and the remaining addressable access gap.': 'Mede a população que pode utilizar electricidade e a lacuna de acesso ainda por colmatar.',
  'Connection does not establish reliability, affordability, available capacity or service quality.': 'A ligação não comprova fiabilidade, acessibilidade económica, capacidade disponível nem qualidade do serviço.',
  'Shows renewable sources in total final energy consumption, including traditional biomass.': 'Mostra as fontes renováveis no consumo final total de energia, incluindo a biomassa tradicional.',
  'A high share may reflect modern clean power or reliance on traditional biomass; generation mix must be checked separately.': 'Um peso elevado pode reflectir energia limpa moderna ou dependência da biomassa tradicional; a combinação de produção deve ser verificada separadamente.',
  'Indicates how much generated electricity is lost before billed consumption.': 'Indica a quantidade de electricidade produzida que se perde antes do consumo facturado.',
  'Higher values are generally adverse, but reporting quality and network geography affect comparability.': 'Valores mais elevados são geralmente desfavoráveis, mas a qualidade dos dados e a geografia da rede afectam a comparabilidade.',
  'Measures formal or mobile-money account penetration among adults.': 'Mede a penetração de contas formais ou de dinheiro móvel entre os adultos.',
  'Ownership does not show account activity, balances, credit access, affordability or consumer protection.': 'A titularidade não revela actividade da conta, saldos, acesso ao crédito, custos nem protecção do consumidor.',
  'Tracks the physical cash-access footprint of the regulated financial system.': 'Acompanha a presença física do acesso a numerário no sistema financeiro regulado.',
  'ATM density may decline as digital finance advances and should not be interpreted alone as financial-sector contraction.': 'A densidade de caixas automáticas pode diminuir à medida que as finanças digitais avançam e não deve, isoladamente, ser interpretada como contracção do sector financeiro.',
  'Shows the reported rate charged by banks on private-sector loans.': 'Mostra a taxa declarada cobrada pelos bancos nos empréstimos ao sector privado.',
  'Higher rates are generally restrictive; definitions, inflation and borrower risk differ across countries.': 'Taxas mais elevadas são geralmente restritivas; as definições, a inflação e o risco dos mutuários variam entre países.',
  'Measures current public and private health spending relative to the economy.': 'Mede a despesa corrente pública e privada em saúde em relação à economia.',
  'A higher share can reflect stronger resourcing, high costs or weak GDP; it does not measure outcomes or efficiency.': 'Um peso mais elevado pode reflectir mais recursos, custos elevados ou um PIB fraco; não mede resultados nem eficiência.',
  'Provides a comparable signal of physician availability relative to population.': 'Fornece um indicador comparável da disponibilidade de médicos em relação à população.',
  'National density obscures urban-rural distribution, specialisation, vacancies and quality of care.': 'A densidade nacional oculta a distribuição urbano-rural, a especialização, as vagas e a qualidade dos cuidados.',
  'Measures reported inpatient bed capacity relative to population.': 'Mede a capacidade declarada de camas de internamento em relação à população.',
  'Coverage is materially thinner and bed counts do not establish staffing, equipment, occupancy or clinical quality.': 'A cobertura é substancialmente mais reduzida e o número de camas não comprova pessoal, equipamento, ocupação nem qualidade clínica.',
  'Shows economy-wide spending on fixed assets relative to output.': 'Mostra a despesa em activos fixos no conjunto da economia em relação à produção.',
  'It includes public and private machinery, buildings and other assets, not only infrastructure projects.': 'Inclui maquinaria, edifícios e outros activos públicos e privados, não apenas projectos de infra-estruturas.',
  'Measures the latest annual change in passengers carried by registered air carriers.': 'Mede a variação anual mais recente dos passageiros transportados por companhias aéreas registadas.',
  'Carrier nationality, route networks and post-pandemic base effects can separate this series from destination demand.': 'A nacionalidade das transportadoras, as redes de rotas e os efeitos de base pós-pandemia podem afastar esta série da procura nos destinos.',
  'Measures annual movement in twenty-foot-equivalent container throughput.': 'Mede a variação anual do movimento de contentores em unidades equivalentes a vinte pés.',
  'Transshipment, commodity mix, port disruptions and missing ports affect country comparability.': 'O transbordo, a combinação de mercadorias, as perturbações portuárias e os portos sem dados afectam a comparabilidade entre países.',
  'Shows manufacturing value added as a share of total economic output.': 'Mostra o valor acrescentado da indústria transformadora como parcela da produção económica total.',
  'The share can fall while real output grows if other sectors expand faster.': 'O peso pode diminuir mesmo quando a produção real cresce, caso outros sectores se expandam mais depressa.',
  'Measures manufactured products within merchandise exports.': 'Mede os produtos transformados no conjunto das exportações de mercadorias.',
  'A higher share does not establish domestic value capture, complexity, margins or ownership.': 'Um peso superior não comprova retenção interna de valor, complexidade, margens nem propriedade.',
  'Tracks the workforce share employed in industry, including construction.': 'Acompanha a parcela da população activa empregada na indústria, incluindo a construção.',
  'The measure is broader than manufacturing and does not show wages, formality or productivity.': 'A medida é mais ampla do que a indústria transformadora e não revela salários, formalidade nem produtividade.',
  'Measures active mobile subscriptions relative to population.': 'Mede as assinaturas móveis activas em relação à população.',
  'Multiple SIM ownership means values can exceed 100 and does not establish device quality, coverage or affordability.': 'A utilização de vários cartões SIM permite valores superiores a 100 e não comprova qualidade dos aparelhos, cobertura nem acessibilidade económica.',
  'Measures fixed high-speed internet subscriptions relative to population.': 'Mede as assinaturas de Internet fixa de alta velocidade em relação à população.',
  'It excludes mobile broadband and can understate access where mobile networks dominate.': 'Exclui a banda larga móvel e pode subestimar o acesso onde predominam as redes móveis.',
  'Provides a supply-side signal of internet infrastructure able to host encrypted transactions.': 'Fornece um indicador da oferta de infra-estrutura de Internet capaz de alojar transacções cifradas.',
  'Cloud hosting location and server configuration make it an infrastructure proxy, not a digital-economy valuation.': 'A localização do alojamento em nuvem e a configuração dos servidores tornam-no um indicador de infra-estrutura, não uma avaliação da economia digital.',
  'Shows the latest reported inbound visitor receipts and their absolute movement.': 'Mostra as receitas mais recentes declaradas de visitantes estrangeiros e a respectiva variação absoluta.',
  'The current WDI release is dated for many countries and values are affected by exchange rates and pandemic-era reporting.': 'A edição actual dos WDI está desactualizada para muitos países e os valores são afectados pelas taxas de câmbio e pelos registos do período da pandemia.',
  'Shows the latest reported count of international inbound arrivals.': 'Mostra o número mais recente declarado de chegadas internacionais.',
  'The current WDI release is dated for many countries and national counting methods differ.': 'A edição actual dos WDI está desactualizada para muitos países e os métodos nacionais de contagem diferem.',
  'Which value chains convert farm output into higher-margin processing and exports?': 'Que cadeias de valor transformam a produção agrícola em processamento e exportações de maior margem?',
  'How exposed are yields and margins to rainfall, irrigation, fertiliser, seed and storage constraints?': 'Em que medida os rendimentos e as margens estão expostos a limitações de precipitação, irrigação, fertilizantes, sementes e armazenamento?',
  'Which land, food-safety, subsidy and trade rules change market-entry economics?': 'Que regras fundiárias, de segurança alimentar, subsídios e comércio alteram a economia da entrada no mercado?',
  'Where do logistics, cold-chain, finance and offtake gaps prevent scale?': 'Onde impedem a escala as lacunas na logística, cadeia de frio, financiamento e escoamento?',
  'What dependable generation, transmission and distribution capacity is actually available?': 'Que capacidade fiável de produção, transmissão e distribuição está efectivamente disponível?',
  'How do tariffs, subsidies, losses, collection rates and currency exposure affect project bankability?': 'Como afectam a viabilidade financeira dos projectos as tarifas, subsídios, perdas, taxas de cobrança e exposição cambial?',
  'Which projects have binding licences, financing, offtake agreements and construction milestones?': 'Que projectos dispõem de licenças vinculativas, financiamento, contratos de compra e marcos de construção?',
  'Does the renewable share reflect modern generation or traditional biomass dependence?': 'O peso renovável reflecte produção moderna ou dependência da biomassa tradicional?',
  'Is credit expansion reaching productive firms or concentrating risk in government and large borrowers?': 'A expansão do crédito chega às empresas produtivas ou concentra o risco no Estado e nos grandes mutuários?',
  'How do lending rates, inflation, currency volatility and non-performing loans affect real financing costs?': 'Como afectam os custos reais de financiamento as taxas de juro, a inflação, a volatilidade cambial e o crédito malparado?',
  'Which licensing, capital, foreign-ownership and consumer-protection rules shape entry?': 'Que regras de licenciamento, capital, propriedade estrangeira e protecção do consumidor condicionam a entrada?',
  'Where does account ownership translate into active deposits, payments, insurance, investment or credit use?': 'Onde se traduz a titularidade de contas em depósitos activos, pagamentos, seguros, investimento ou utilização de crédito?',
  'Which spending pools are public, insured, out-of-pocket or donor-financed?': 'Que parcelas da despesa são públicas, seguradas, pagas directamente ou financiadas por doadores?',
  'Where do workforce, beds, diagnostics, medicines and distribution create binding capacity gaps?': 'Onde criam o pessoal, as camas, o diagnóstico, os medicamentos e a distribuição lacunas críticas de capacidade?',
  'What reimbursement, registration, procurement and price-control rules govern commercial access?': 'Que regras de reembolso, registo, contratação e controlo de preços regem o acesso comercial?',
  'Which demand segments can support sustainable provision without treating unmet need as bankable demand?': 'Que segmentos de procura podem sustentar uma oferta duradoura sem confundir necessidades por satisfazer com procura financiável?',
  'Which announced projects have completed feasibility, permits, procurement, financing and land acquisition?': 'Que projectos anunciados concluíram viabilidade, licenças, contratação, financiamento e aquisição de terrenos?',
  'How are construction, demand, currency, offtake and sovereign risks allocated?': 'Como são distribuídos os riscos de construção, procura, câmbio, escoamento e risco soberano?',
  'Which ports, airports, corridors and urban systems face measurable capacity constraints?': 'Que portos, aeroportos, corredores e sistemas urbanos enfrentam limitações mensuráveis de capacidade?',
  'What maintenance obligations and lifecycle costs sit behind new capital formation?': 'Que obrigações de manutenção e custos do ciclo de vida acompanham a nova formação de capital?',
  'Which subsectors are gaining real output, domestic value added and export share?': 'Que sub-sectores estão a aumentar a produção real, o valor acrescentado interno e o peso nas exportações?',
  'How do power, logistics, inputs, skills, finance and capacity utilisation constrain margins?': 'Como limitam as margens a energia, a logística, os factores de produção, as competências, o financiamento e a utilização da capacidade?',
  'Which tariff, local-content, standards and industrial-zone regimes alter competitiveness?': 'Que regimes pautais, de conteúdo local, normas e zonas industriais alteram a competitividade?',
  'Where is industrial employment growth matched by productivity rather than low-value assembly?': 'Onde é o crescimento do emprego industrial acompanhado por produtividade, em vez de montagem de baixo valor?',
  'Does connectivity translate into affordable, reliable usage and digital transaction volume?': 'A conectividade traduz-se em utilização acessível e fiável e em volume de transacções digitais?',
  'Which markets have payment rails, cloud capacity, data centres, cybersecurity and technical talent?': 'Que mercados dispõem de infra-estruturas de pagamento, capacidade de nuvem, centros de dados, cibersegurança e talento técnico?',
  'How do data protection, localisation, licensing, tax and competition rules affect scaling?': 'Como afectam a expansão as regras de protecção e localização de dados, licenciamento, fiscalidade e concorrência?',
  'Where do adoption figures conceal device, affordability, rural coverage or enterprise-digitisation gaps?': 'Onde ocultam os números de adopção lacunas de equipamentos, acessibilidade económica, cobertura rural ou digitalização empresarial?',
  'Are arrivals, receipts, air capacity and accommodation demand recovering in the same markets?': 'As chegadas, receitas, capacidade aérea e procura de alojamento estão a recuperar nos mesmos mercados?',
  'How seasonal and concentrated are source markets, routes and visitor spending?': 'Quão sazonais e concentrados são os mercados de origem, as rotas e a despesa dos visitantes?',
  'Which visa, aviation, tax, land, conservation and licensing rules constrain growth?': 'Que regras de vistos, aviação, fiscalidade, terrenos, conservação e licenciamento limitam o crescimento?',
  'Do dated official series require validation against current tourism-board, airport and company disclosures?': 'As séries oficiais desactualizadas exigem validação perante divulgações actuais de organismos de turismo, aeroportos e empresas?',
  'TRADE': 'COMÉRCIO',
  'INVESTMENT': 'INVESTIMENTO',
  'REGISTRATION OPEN': 'INSCRIÇÕES ABERTAS',
  'upcoming': 'próximo',
  'registration_open': 'inscrições abertas',
  'The premier deal-making platform for African investments.': 'A principal plataforma para a concretização de investimentos em África.',
  "The world's largest mining investment event.": 'O maior evento mundial de investimento mineiro.',
  "Shaping the future of Africa's energy sector.": 'A moldar o futuro do sector energético africano.',
  'The largest tech and startup event in Africa.': 'O maior evento africano de tecnologia e empresas emergentes.',
  'Driving African agricultural transformation.': 'A impulsionar a transformação agrícola africana.',
  "Burundi's flagship trade exhibition connecting East African and Great Lakes businesses.": 'A principal feira comercial do Burundi, que liga empresas da África Oriental e da região dos Grandes Lagos.',
  "Eritrea's national festival of music, craft and culture, held annually at the Asmara Expo grounds.": 'Festival nacional da Eritreia dedicado à música, ao artesanato e à cultura, realizado anualmente no recinto da Asmara Expo.',
  "Niger's celebrated Tuareg and Wodaabe nomad gathering marking the end of the rainy season.": 'O célebre encontro nómada tuaregue e wodaabe do Níger, que assinala o fim da estação das chuvas.',
  "Somalia's landmark cultural gathering celebrating literature, ideas and the country's creative revival.": 'O encontro cultural de referência da Somália, dedicado à literatura, às ideias e à renovação criativa do país.',
  "South Sudan's official oil, gas and power conference on the country's energy future.": 'A conferência oficial do Sudão do Sul sobre petróleo, gás, electricidade e o futuro energético do país.',
  "Lesotho's leading celebration of Basotho heritage, music and mountain culture.": 'A principal celebração do património basotho, da música e da cultura de montanha do Lesoto.',
  "Malawi's renowned lakeside music festival on the shores of Lake Malawi, drawing global audiences.": 'O reconhecido festival de música à beira do Lago Malawi, que atrai público internacional.',
  "Mauritania's premier mining, energy and petroleum conference and exhibition.": 'A principal conferência e exposição da Mauritânia sobre mineração, energia e petróleo.',
  "Guinea's flagship bauxite, iron ore and critical-minerals investment symposium.": 'O principal simpósio de investimento da Guiné sobre bauxite, minério de ferro e minerais críticos.',
  "Madagascar's premier tourism trade fair (ITM), showcasing the island's biodiversity and hospitality.": 'A principal feira profissional de turismo de Madagáscar, que apresenta a biodiversidade e a hospitalidade da ilha.',
  "Sierra Leone's biggest live-music celebration, drawing West African and diaspora acts to the coast.": 'A maior celebração de música ao vivo da Serra Leoa, que reúne na costa artistas da África Ocidental e da diáspora.',
  "Togo's international forum on peace, security and sustainable development in Africa.": 'Fórum internacional do Togo sobre paz, segurança e desenvolvimento sustentável em África.',
  "Chad's international trade fair (FIN), a marketplace for Sahel and Central African commerce.": 'A feira internacional do Chade, um mercado para o comércio do Sahel e da África Central.',
  "Eswatini's internationally acclaimed music and arts festival, one of Africa's most celebrated.": 'Festival de música e artes de Essuatíni reconhecido internacionalmente, um dos mais celebrados de África.',
  'The Pan-African Music Festival, a UNESCO-recognised celebration of the continent’s musical heritage.': 'Festival Pan-Africano de Música reconhecido pela UNESCO, dedicado ao património musical do continente.',
  'Surfaced automatically from BOA-Story news coverage.': 'Identificado automaticamente a partir da cobertura noticiosa da BOA-Story.',
  "The Panafrican Film and Television Festival of Ouagadougou — the continent's largest and most prestigious celebration of African cinema.": 'O Festival Pan-Africano de Cinema e Televisão de Uagadugu, a maior e mais prestigiada celebração do cinema africano no continente.',
  "Zimbabwe's premier international travel and tourism trade fair, connecting African destinations with global buyers.": 'A principal feira internacional de viagens e turismo do Zimbabué, que liga destinos africanos a compradores mundiais.',
  "Southern Africa's flagship oil, gas and renewable energy conference, spotlighting Namibia's emerging offshore discoveries.": 'A principal conferência da África Austral sobre petróleo, gás e energias renováveis, com destaque para as novas descobertas marítimas da Namíbia.',
  "The continent's largest trade and investment fair, driving intra-African commerce under the AfCFTA.": 'A maior feira de comércio e investimento do continente, que promove o comércio intra-africano ao abrigo da ZCLCA.',
  "Tunisia's flagship gathering for international investors, entrepreneurs and policymakers across the Maghreb.": 'O principal encontro da Tunísia para investidores internacionais, empresários e decisores políticos do Magrebe.',
  "East Africa's largest manufacturing and trade exhibition, hosted by the Uganda Manufacturers Association.": 'A maior exposição industrial e comercial da África Oriental, organizada pela Associação dos Industriais do Uganda.',
  "Botswana's premier mining and natural-resources investment forum, from diamonds to critical minerals.": 'O principal fórum de investimento mineiro e em recursos naturais do Botsuana, dos diamantes aos minerais críticos.',
  "Central Africa's largest enterprise and trade exhibition, showcasing business across the CEMAC region.": 'A maior exposição empresarial e comercial da África Central, dedicada aos negócios em toda a região da CEMAC.',
  'The leading pan-African biennale of photography, drawing artists and curators from across the continent to Bamako.': 'A principal bienal pan-africana de fotografia, que reúne em Bamaco artistas e curadores de todo o continente.',
  "Seychelles' vibrant celebration of Creole heritage — music, cuisine, art and language across the islands.": 'A vibrante celebração do património crioulo das Seicheles, com música, gastronomia, arte e língua em todo o arquipélago.',
  "Gabon's international forum on innovation and development, convening heads of state, investors and institutions at the Cité de la Démocratie.": 'Fórum internacional do Gabão sobre inovação e desenvolvimento, que reúne chefes de Estado, investidores e instituições na Cité de la Démocratie.',
  "Djibouti's flagship investment forum, convened by its Sovereign Wealth Fund to spotlight ports, logistics and emerging-market opportunity.": 'O principal fórum de investimento do Jibuti, convocado pelo fundo soberano para destacar portos, logística e oportunidades em mercados emergentes.',
  "Liberia's first international mining and energy conference, spotlighting iron ore, critical minerals and a US$3bn investment wave.": 'A primeira conferência internacional da Libéria sobre mineração e energia, com destaque para minério de ferro, minerais críticos e uma vaga de investimento de 3 mil milhões de dólares.',
  "Equatorial Guinea's annual petroleum gathering in Malabo — licensing rounds, gas monetisation and upstream investment.": 'O encontro anual da Guiné Equatorial sobre petróleo em Malabo, dedicado a rondas de licenciamento, valorização do gás e investimento a montante.',
  "The Indian Ocean islands' economic forum, bringing regional business and investment leaders together to strengthen cross-island trade.": 'Fórum económico das ilhas do Oceano Índico, que reúne dirigentes empresariais e de investimento para reforçar o comércio entre ilhas.',
  "Sao Tome and Principe's investment forum mobilising partners behind its 2040 national sustainable-development strategy.": 'Fórum de investimento de São Tomé e Príncipe que mobiliza parceiros para a estratégia nacional de desenvolvimento sustentável até 2040.',
  'The 9th edition bringing together global energy leaders and Mozambique LNG stakeholders.': 'A 9.ª edição reúne dirigentes mundiais da energia e intervenientes no gás natural liquefeito de Moçambique.',
  "North Africa's premier oil and gas event connecting the Mediterranean energy corridor.": 'O principal evento de petróleo e gás do Norte de África, que liga o corredor energético do Mediterrâneo.',
  'Leading tech, digital infrastructure, and fintech forum for East Africa.': 'Fórum de referência da África Oriental sobre tecnologia, infra-estruturas digitais e tecnologia financeira.',
  'The largest international gathering of African private sector leaders.': 'O maior encontro internacional de dirigentes do sector privado africano.',
  '% of final energy use': '% do consumo final de energia',
  'UN Comtrade · external-sector record': 'UN Comtrade · registo do sector externo',
  "Exploring Mauritius as Africa's offshore financial center and gateway to Asia.": 'Análise da Maurícia como centro financeiro internacional de África e porta de entrada para a Ásia.',
  "Ethiopia's flagship investment event at the seat of the African Union.": 'O principal evento de investimento da Etiópia, na sede da União Africana.',
  "Spotlight on Tanzania's gold, nickel, and rare earth minerals sectors.": 'Destaque para os sectores do ouro, níquel e minerais de terras raras da Tanzânia.',
  'The rolling evidence window remains too concentrated by country or publisher.': 'A janela documental móvel continua demasiado concentrada por país ou entidade editora.',
  'Coverage diversity check failed': 'A verificação da diversidade da cobertura falhou',
  'The rolling evidence window has not yet met the all-country, publisher and global-source quality standard.': 'A janela documental móvel ainda não atingiu o padrão de qualidade exigido para a cobertura de todos os países, a diversidade de entidades editoras e as fontes mundiais.',
  'The active source network has not yet demonstrated sufficient recent, qualifying production.': 'A rede activa de fontes ainda não demonstrou produção recente e qualificada em quantidade suficiente.',
  'Source acquisition yield check failed': 'A verificação do rendimento da aquisição de fontes falhou',
  'Best launch value': 'Melhor valor de lançamento',
  'Cancel at any time': 'Cancele quando quiser',
  '/mo on monthly billing': '/mês na facturação mensal',
  'Reader Member': 'Membro leitor',
  'Sustaining Member': 'Membro de apoio',
  'Founding Backer': 'Apoiador fundador',
  'Choose Reader Member': 'Escolher Membro leitor',
  'Choose Sustaining Member': 'Escolher Membro de apoio',
  'Become a Founding Backer': 'Tornar-se Apoiador fundador',
  'Reader Members': 'Membros leitores',
  'Simple monthly billing · cancel at any time': 'Facturação mensal simples · cancele quando quiser',
  'Billed monthly · cancel at any time': 'Facturado mensalmente · cancele quando quiser',
  'The complete reader product at an accessible launch price.': 'O produto completo para leitores a um preço de lançamento acessível.',
  'The same complete access, with more support for evidence production.': 'O mesmo acesso completo, com maior apoio à produção documental.',
  'For readers who want to underwrite affordable access for others.': 'Para leitores que pretendam financiar um acesso acessível para outros.',
  'Complete reader access at the introductory price.': 'Acesso completo para leitores ao preço introdutório.',
  'Complete access with more support for evidence production.': 'Acesso completo com maior apoio à produção documental.',
  'Complete access while underwriting affordable reader membership.': 'Acesso completo enquanto financia uma adesão acessível para leitores.',
  'Focused market brief': 'Síntese de mercado focalizada',
  'Comparative entry pilot': 'Projecto-piloto comparativo de entrada',
  'Monitoring extension': 'Extensão de acompanhamento',
  '10 business days': '10 dias úteis',
  'Four weeks': 'Quatro semanas',
  'per month': 'por mês',
  'One-country evidence file': 'Dossier documental de um país',
  'Decision brief and source ledger': 'Síntese de decisão e registo de fontes',
  'Priority diligence questions': 'Questões prioritárias de diligência',
  '45-minute findings review': 'Revisão de resultados de 45 minutos',
  'Up to three candidate countries': 'Até três países candidatos',
  'All six published pilot deliverables': 'Os seis resultados definidos para o projecto-piloto',
  'One consolidated revision': 'Uma revisão consolidada',
  '60-minute closeout review': 'Revisão final de 60 minutos',
  'Weekly source monitoring': 'Acompanhamento semanal de fontes',
  'Monthly change memorandum': 'Memorando mensal de alterações',
  'Material-signal alerts': 'Alertas de sinais relevantes',
  'Cancel before the next month': 'Cancele antes do mês seguinte',
  'Introductory design-partner pricing': 'Preços introdutórios para parceiros de concepção',
  'A defined decision, a visible fee and limited buyer risk.': 'Uma decisão definida, um preço visível e risco limitado para o comprador.',
  'A lower-risk first engagement for one defined question in one country and one sector.': 'Um primeiro compromisso de menor risco para uma questão definida num país e num sector.',
  'The complete design-partner pilot for a team choosing between as many as three markets.': 'O projecto-piloto completo para uma equipa que compare até três mercados.',
  'Post-pilot monitoring of the assumptions and signals recorded in the completed decision file.': 'Acompanhamento posterior das premissas e dos sinais registados no dossier de decisão concluído.',
  'Recommended first pilot': 'Primeiro projecto-piloto recomendado',
  'Define the scope': 'Definir o âmbito',
  'Payment terms': 'Condições de pagamento',
  'Introductory design-partner pricing is published below. Applying is free; suitable work proceeds only after a written scope, evidence-access check and signed agreement. No outcome, forecast or acceptance is guaranteed.': 'Os preços introdutórios para parceiros de concepção são publicados abaixo. A candidatura é gratuita; o trabalho adequado só avança após a definição escrita do âmbito, a verificação do acesso às fontes e a assinatura de um acordo. Não se garante qualquer resultado, previsão ou aceitação.',
  'BOA-Story does not yet claim verified client outcomes or an independent commercial track record. These prices reflect that stage while preserving a professional, tightly bounded research engagement.': 'A BOA-Story ainda não reivindica resultados verificados de clientes nem um historial comercial independente. Estes preços reflectem essa fase, preservando um trabalho de investigação profissional e rigorosamente delimitado.',
  'No application fee. Fixed-scope work is billed 50% at commencement and 50% on delivery. Taxes, paid datasets, travel and external specialist advice are excluded unless separately agreed.': 'Não há taxa de candidatura. O trabalho de âmbito fixo é facturado em 50% no início e 50% na entrega. Impostos, bases de dados pagas, deslocações e pareceres de especialistas externos ficam excluídos, salvo acordo em contrário.',
  'Introductory prices apply only to the stated scope and may change after the design-partner phase. Any different scope receives a written quotation before commitment.': 'Os preços introdutórios aplicam-se apenas ao âmbito indicado e poderão mudar após a fase de parceiros de concepção. Qualquer âmbito diferente recebe um orçamento escrito antes do compromisso.',
  'Published introductory pricing': 'Preços introdutórios publicados',
  'US$750 fixed · one country · 10 business days': 'US$750 fixos · um país · 10 dias úteis',
  'US$1,800 fixed · up to three countries · four weeks': 'US$1 800 fixos · até três países · quatro semanas',
  'No fee to apply. Suitable work proceeds only after a written scope and agreement.': 'A candidatura é gratuita. O trabalho adequado só avança após a definição escrita do âmbito e a celebração de um acordo.',
  'Complete reader access from US$4 a month': 'Acesso completo para leitores a partir de US$4 por mês',
  'Complete BOA-Story reader access from US$4 per month at transparent introductory pricing.': 'Acesso completo à BOA-Story a partir de US$4 por mês, com preços introdutórios transparentes.',
  'Every published story and evidence brief in full': 'Todas as histórias publicadas e sínteses documentais na íntegra',
  'Country, sector and continental intelligence pages': 'Páginas de inteligência nacional, sectorial e continental',
  'Article audio, available translations and personal library': 'Áudio dos artigos, traduções disponíveis e biblioteca pessoal',
  'Everything in Reader Member': 'Todas as vantagens do plano Membro leitor',
  'Supports deeper country and sector evidence updates': 'Apoia actualizações documentais mais aprofundadas sobre países e sectores',
  'Early-member recognition while the product is being proven': 'Reconhecimento como membro inicial durante a consolidação do produto',
  'Everything in Sustaining Member': 'Todas as vantagens do plano Membro de apoio',
  'Optional founding-backer recognition on your profile': 'Reconhecimento facultativo como apoiador fundador no perfil',
  'Helps fund broader country coverage and source acquisition': 'Ajuda a financiar uma cobertura nacional mais ampla e a aquisição de fontes',
  'Do higher tiers unlock more reader features?': 'Os níveis superiores desbloqueiam mais funcionalidades para leitores?',
  'No. Every paid tier receives the complete reader product. Higher levels are voluntary support choices, not artificial feature restrictions.': 'Não. Todos os níveis pagos recebem o produto completo para leitores. Os níveis superiores são opções voluntárias de apoio, não restrições artificiais de funcionalidades.',
  'What is proven today?': 'O que está comprovado actualmente?',
  'The deployed product, published material and source links can be inspected now. BOA-Story does not present unverified subscriber numbers, testimonials or independent outcome claims.': 'O produto em funcionamento, o material publicado e as ligações às fontes podem ser examinados desde já. A BOA-Story não apresenta números de assinantes não verificados, testemunhos não comprovados nem alegações independentes de resultados.',
  'Introductory pricing while BOA-Story earns its track record. Every paid tier receives the same complete reader product; choose a higher level only if you want to support broader coverage.': 'Preços introdutórios enquanto a BOA-Story constrói o seu historial. Todos os níveis pagos recebem o mesmo produto completo; escolha um nível superior apenas se pretender apoiar uma cobertura mais ampla.',
  'Member content is temporarily open during preview. Pricing is shown now so the eventual offer is clear before payment is required.': 'O conteúdo para membros está temporariamente aberto durante a pré-visualização. Os preços são apresentados desde já para que a oferta futura seja clara antes de qualquer pagamento.',
  'Become a founding member to keep reading every story in full.': 'Torne-se membro leitor para continuar a ler todas as histórias na íntegra.',
  'Administration': 'Administração',
  'Search stories, countries and sectors.': 'Pesquisar histórias, países e sectores.',
  'Notifications unavailable': 'Notificações indisponíveis',
  'Could not reach the service. It will retry automatically.': 'Não foi possível contactar o serviço. A tentativa será repetida automaticamente.',
  'Access renews in': 'O acesso renova-se em',
  'days': 'dias',
  'African Countries': 'Países Africanos',
  'Source-grounded country records across all 54 African markets: reporting, official market evidence and national context.': 'Registos nacionais assentes em fontes para os 54 mercados africanos: reportagem, evidência oficial de mercado e contexto nacional.',
  'A valid email address is required': 'É necessário um endereço de correio electrónico válido',
  'Submission exceeds allowed field lengths': 'A submissão excede os comprimentos de campo permitidos',
  'Enter': 'Enter',
  'Open the analyst chat': 'Abrir o assistente de análise',
  'Close the analyst chat': 'Fechar o assistente de análise',
  'Send question': 'Enviar pergunta',
  'Toggle play queue': 'Mostrar ou ocultar a fila de reprodução',
  '6-digit verification code': 'Código de verificação de 6 dígitos',
  'Membership email address': 'Endereço de correio electrónico da adesão',
  'Member Preview': 'Pré-visualização de membro',
  'Live briefing scope': 'Âmbito da síntese em directo',
  'Every African country and every economic sector is checked': 'Todos os países africanos e todos os sectores económicos são verificados',
  'The evidence ledger refreshes every minute. Countries or sectors with zero current records remain visible as evidence gaps; they are never omitted or filled with assumptions.':
    'O registo documental é actualizado a cada minuto. Os países ou sectores sem registos actuais permanecem visíveis como lacunas documentais; nunca são omitidos nem preenchidos com suposições.',
  'Countries checked': 'Países verificados',
  'Sectors checked': 'Sectores verificados',
  'Complete 54-country ledger': 'Registo completo dos 54 países',
  'Current week compared with the preceding seven days. Zero is a real coverage result.':
    'Semana actual comparada com os sete dias anteriores. Zero é um resultado documental real.',
  'Open all country readings': 'Abrir todas as leituras nacionais',
  'Full sector ledger': 'Registo sectorial completo',
  'Published evidence across the rolling 30-day window.': 'Dados publicados na janela móvel de 30 dias.',
  'records ·': 'registos ·',
  'Ledger updated': 'Registo actualizado',
  'Continental briefing scope': 'Âmbito da síntese continental',
  'No African market or economic sector disappears from the briefing': 'Nenhum mercado africano nem sector económico desaparece da síntese',
  'The rolling evidence check covers every configured country and sector. A zero remains an explicit evidence gap, while official economic indicators retain their actual observation years.':
    'A verificação documental móvel abrange todos os países e sectores configurados. Um valor zero permanece uma lacuna documental explícita, enquanto os indicadores económicos oficiais conservam os respectivos anos de observação.',
  'Countries considered': 'Países considerados',
  'Sectors considered': 'Sectores considerados',
  'with 30-day records': 'com registos nos últimos 30 dias',
  'Inspect all country evidence states': 'Examinar o estado documental de todos os países',
  'Inspect every sector evidence state': 'Examinar o estado documental de todos os sectores',
  'The briefing explicitly checks all 54 African countries and every configured economic sector. A zero identifies no published record in the 30-day window and is not replaced with an inference.':
    'A síntese verifica explicitamente os 54 países africanos e todos os sectores económicos configurados. Um valor zero identifica a ausência de registos publicados na janela de 30 dias e não é substituído por uma inferência.',
  'Scale and demand': 'Dimensão e procura',
  'Prices and labour': 'Preços e trabalho',
  'Finance and external resilience': 'Financiamento e resiliência externa',
  'Trade and production': 'Comércio e produção',
  'Infrastructure and digital access': 'Infra-estruturas e acesso digital',
  'Human development': 'Desenvolvimento humano',
  'observed country indicators': 'indicadores nacionais observados',
  'Official observations are organised by the decision question they help answer. Every measure retains its year, unit, series code and direct provider link.':
    'As observações oficiais estão organizadas segundo a questão de decisão que ajudam a esclarecer. Cada medida conserva o ano, a unidade, o código da série e a ligação directa ao fornecedor.',
  'Official observations are organised by the decision question they help answer. Every measure retains its year, unit, series code, preceding change, observation history and direct provider link.':
    'As observações oficiais estão organizadas segundo a questão de decisão que ajudam a esclarecer. Cada medida conserva o ano, a unidade, o código da série, a variação anterior, o histórico de observações e a ligação directa ao fornecedor.',
  'Inspect complete provider record': 'Examinar o registo completo do fornecedor',
  'Series source': 'Fonte da série',
  'Underlying source': 'Fonte de origem',
  'latest observation': 'observação mais recente',
  'from the preceding observation': 'face à observação anterior',
  'Eight sector dossiers combine a primary performance proxy with five structural or operating dimensions. Incompatible units remain separate.':
    'Oito dossiês sectoriais combinam um indicador principal de desempenho com cinco dimensões estruturais ou operacionais. As unidades incompatíveis permanecem separadas.',
  'Understand the main measure first, then use five separate measures to examine structure, capacity, access, cost and operating conditions. Dates, country coverage and limitations remain visible throughout.':
    'Compreenda primeiro a medida principal e utilize depois cinco medidas distintas para examinar a estrutura, a capacidade, o acesso, o custo e as condições de operação. As datas, a cobertura nacional e as limitações permanecem sempre visíveis.',
  'Five other measures to read alongside the main one': 'Cinco outras medidas para ler juntamente com a principal',
  "Each sector combines a primary official performance proxy with five structural or operating dimensions. Country-level observations use the latest available annual records in the World Bank WDI bulk release retrieved 18 July 2026. Values are cross-country medians, not continental totals; comparison values are median changes versus each country's preceding observation; breadth is the share of reporting markets moving higher. Higher is not automatically better for contextual or adverse indicators. Series with different units are never combined into a synthetic score or investment ranking.":
    'Cada sector combina um indicador oficial principal de desempenho com cinco dimensões estruturais ou operacionais. As observações nacionais utilizam os registos anuais disponíveis mais recentes da edição em massa dos WDI do Banco Mundial, consultada em 18 de Julho de 2026. Os valores são medianas entre países, não totais continentais; os valores de comparação são variações medianas face à observação anterior de cada país; a amplitude corresponde à proporção dos mercados declarantes cujo valor subiu. Um valor superior não é automaticamente melhor no caso dos indicadores contextuais ou adversos. As séries com unidades diferentes nunca são combinadas num índice sintético nem numa classificação de investimento.',
  'Each sector combines a primary official performance proxy with five structural or operating dimensions. Country-level observations use the latest available annual records within the retrieval window. Values are cross-country medians, not continental totals; comparison values are median changes versus each country’s preceding observation; breadth is the share of reporting markets moving higher. Higher is not automatically better for contextual or adverse indicators. Series with different units are never combined into a synthetic score or investment ranking.':
    'Cada sector combina um indicador oficial principal de desempenho com cinco dimensões estruturais ou operacionais. As observações nacionais utilizam os registos anuais disponíveis mais recentes na janela de consulta. Os valores são medianas entre países, não totais continentais; os valores de comparação são variações medianas face à observação anterior de cada país; a amplitude corresponde à proporção dos mercados declarantes cujo valor subiu. Um valor superior não é automaticamente melhor no caso dos indicadores contextuais ou adversos. As séries com unidades diferentes nunca são combinadas num índice sintético nem numa classificação de investimento.',
  'Underlying authority:': 'Entidade de origem:',
  'Source institution': 'Instituição de origem',
  'WDI series record': 'Registo da série WDI',
  // Dynamic official-evidence metadata. These values arrive from the API and
  // therefore must be part of the coded locale rather than a worker-generated
  // page translation.
  'Basic water access': 'Acesso básico à água',
  'Trade intensity': 'Intensidade comercial',
  'Formal business entry': 'Entrada formal de empresas',
  'Median trade intensity': 'Intensidade comercial mediana',
  'Median formal business-entry density': 'Densidade mediana de entrada formal de empresas',
  'Median internet use': 'Utilização mediana da Internet',
  'Median electricity access': 'Acesso mediano à electricidade',
  'Median access to basic drinking water': 'Acesso mediano a água potável básica',
  'Median access to basic sanitation': 'Acesso mediano a saneamento básico',
  'Shows national coverage of basic drinking-water services, relevant to welfare and operating infrastructure.':
    'Mostra a cobertura nacional dos serviços básicos de água potável, relevante para o bem-estar e para as infra-estruturas operacionais.',
  'National access does not establish industrial supply, continuity, water quality or local network capacity.':
    'O acesso nacional não demonstra abastecimento industrial, continuidade, qualidade da água nem capacidade da rede local.',
  'National access does not establish industrial water availability, continuity, quality or local network capacity.':
    'O acesso nacional não demonstra disponibilidade de água industrial, continuidade, qualidade nem capacidade da rede local.',
  'Shows exports plus imports relative to output, providing context on cross-border exposure and input dependence.':
    'Mostra as exportações e importações em relação à produção, contextualizando a exposição transfronteiriça e a dependência de factores de produção.',
  'A high ratio does not establish route efficiency, margins, product sophistication or resilience.':
    'Um rácio elevado não demonstra a eficiência das rotas, as margens, a sofisticação dos produtos nem a resiliência.',
  'Places recorded external debt against national income as context for financing and foreign-exchange exposure.':
    'Compara a dívida externa registada com o rendimento nacional para contextualizar o financiamento e a exposição cambial.',
  'Maturity, currency, creditor, interest cost and public-private composition determine practical risk.':
    'O prazo, a moeda, o credor, o custo dos juros e a composição pública ou privada determinam o risco prático.',
  'Maturity, currency, creditor, interest cost and public/private composition determine the practical risk.':
    'O prazo, a moeda, o credor, o custo dos juros e a composição pública ou privada determinam o risco prático.',
  'Shows newly registered limited-liability firms relative to the working-age population.':
    'Mostra as novas sociedades de responsabilidade limitada registadas em relação à população em idade activa.',
  'Registration does not prove survival, scale, credit access, competition or a reduction in informality.':
    'O registo não prova sobrevivência, escala, acesso ao crédito, concorrência nem redução da informalidade.',
  'Provides a broad population-health and living-conditions outcome alongside health-system inputs.':
    'Apresenta um resultado amplo de saúde da população e condições de vida, juntamente com os recursos do sistema de saúde.',
  'Shows how much of the population is concentrated in urban areas where infrastructure, customers and services may cluster.':
    'Mostra a proporção da população concentrada em zonas urbanas onde se podem agrupar infra-estruturas, clientes e serviços.',
  'National definitions of urban areas differ, and urbanisation is not a direct measure of income or infrastructure quality.':
    'As definições nacionais de zona urbana diferem, e a urbanização não mede directamente o rendimento nem a qualidade das infra-estruturas.',
  'Shows the population share using the internet, an important route-to-market and information-access condition.':
    'Mostra a proporção da população que utiliza a Internet, uma condição importante de acesso ao mercado e à informação.',
  'The middle share of national populations living in urban areas.':
    'A proporção mediana das populações nacionais que vive em zonas urbanas.',
  'Urban classification differs by country and is not a direct measure of income, density or addressable demand.':
    'A classificação urbana difere entre países e não mede directamente o rendimento, a densidade nem a procura acessível.',
  'The middle labour-force participation rate across reporting economies.':
    'A taxa mediana de participação na força de trabalho entre as economias declarantes.',
  'The middle modelled unemployment reading across reporting African economies.':
    'A leitura mediana modelada do desemprego entre as economias africanas declarantes.',
  'Definitions and informality matter; a low rate can coexist with underemployment and vulnerable work.':
    'As definições e a informalidade são relevantes; uma taxa baixa pode coexistir com subemprego e trabalho vulnerável.',
  'The middle bank-credit-to-private-sector ratio among reporting countries.':
    'O rácio mediano do crédito bancário ao sector privado entre os países declarantes.',
  'Credit depth does not establish access for a particular firm, borrower quality, pricing or non-bank finance.':
    'A profundidade do crédito não demonstra acesso para uma empresa específica, qualidade dos mutuários, preço nem financiamento não bancário.',
  'Sum of latest reported reserves including gold across countries with observations.':
    'Soma das reservas comunicadas mais recentemente, incluindo ouro, nos países com observações.',
  'A cross-country sum is not a shared continental buffer; adequacy must be assessed against each country’s imports, debt and exchange-rate regime.':
    'Uma soma entre países não constitui uma reserva continental comum; a suficiência deve ser avaliada face às importações, à dívida e ao regime cambial de cada país.',
  'Sum of latest reported personal remittance receipts across reporting countries.':
    'Soma das remessas pessoais recebidas mais recentemente nos países declarantes.',
  'Channels, household distribution, informality and exchange-rate conversion differ; the total is not business revenue.':
    'Os canais, a distribuição entre agregados familiares, a informalidade e a conversão cambial diferem; o total não é receita empresarial.',
  'The middle external-debt-to-income ratio across reporting economies.':
    'O rácio mediano da dívida externa face ao rendimento entre as economias declarantes.',
  'The middle exports-plus-imports share of GDP across reporting economies.':
    'A proporção mediana das exportações e importações no PIB entre as economias declarantes.',
  'Trade intensity is not the ease, cost or profitability of a route and can be structurally high in small economies.':
    'A intensidade comercial não mede a facilidade, o custo nem a rentabilidade de uma rota e pode ser estruturalmente elevada em economias pequenas.',
  'The middle manufacturing value-added share across reporting economies.':
    'A proporção mediana do valor acrescentado da indústria transformadora entre as economias declarantes.',
  'This aggregate does not reveal subsector capability, capacity use, local content, productivity or margins.':
    'Este agregado não revela a capacidade dos subsectores, a utilização da capacidade, o conteúdo local, a produtividade nem as margens.',
  'The middle rate of new limited-liability registrations among reporting economies.':
    'A taxa mediana de novos registos de sociedades de responsabilidade limitada entre as economias declarantes.',
  'Registration is not survival, scale, informality reduction or proof that entry procedures are easy.':
    'O registo não significa sobrevivência, escala ou redução da informalidade, nem prova que os procedimentos de entrada sejam simples.',
  'The middle share of people using the internet across reporting African economies.':
    'A proporção mediana de pessoas que utilizam a Internet entre as economias africanas declarantes.',
  'Usage does not establish connection quality, affordability, device access or commercial digital readiness.':
    'A utilização não demonstra qualidade da ligação, comportabilidade, acesso a dispositivos nem preparação digital comercial.',
  'The middle fixed-broadband subscription rate across countries with a reported observation.':
    'A taxa mediana de assinaturas de banda larga fixa nos países com observação comunicada.',
  'Subscriptions are not unique users; business-grade speed, resilience and cost require operator-level evidence.':
    'As assinaturas não correspondem a utilizadores únicos; a velocidade, resiliência e custo empresariais exigem dados dos operadores.',
  'The middle population-access rate across all African countries in scope.':
    'A taxa mediana de acesso da população em todos os países africanos abrangidos.',
  'Access does not measure reliability, available capacity, tariff, outage frequency or connection quality.':
    'O acesso não mede a fiabilidade, a capacidade disponível, a tarifa, a frequência das interrupções nem a qualidade da ligação.',
  'The middle life-expectancy-at-birth observation across all countries in scope.':
    'A observação mediana da esperança de vida à nascença em todos os países abrangidos.',
  'This broad outcome is not a direct measure of workforce health, health-system capacity or a specific operating risk.':
    'Este resultado amplo não mede directamente a saúde da força de trabalho, a capacidade do sistema de saúde nem um risco operacional específico.',
  'The middle population coverage of at least basic drinking-water services.':
    'A cobertura populacional mediana de, pelo menos, serviços básicos de água potável.',
  'The middle population coverage of at least basic sanitation services.':
    'A cobertura populacional mediana de, pelo menos, serviços básicos de saneamento.',
  'National coverage can conceal large urban, rural and subnational gaps and does not establish service reliability.':
    'A cobertura nacional pode ocultar grandes diferenças urbanas, rurais e subnacionais e não demonstra a fiabilidade do serviço.',
  'Source breadth': 'Amplitude das fontes',
  'Who supplies the rolling evidence window': 'Quem fornece a janela documental móvel',
  'Publisher breadth and source quality are shown separately from story volume. A broad source list reduces concentration risk but does not replace checking the linked evidence.':
    'A amplitude dos editores e a qualidade das fontes são apresentadas separadamente do volume de histórias. Uma lista ampla de fontes reduz o risco de concentração, mas não substitui a verificação dos dados ligados.',
  'Publishers · 30 days': 'Editores · 30 dias',
  'Primary/global share': 'Proporção primária/global',
  'Leading attributed sources': 'Principais fontes atribuídas',
  'Primary or global': 'Primária ou global',
  'Established specialist': 'Especialista estabelecida',
  'Verified national': 'Nacional verificada',
  'Other attributed source': 'Outra fonte atribuída',
  'Publisher counts use attributed published records in the rolling 30-day window. Primary/global share includes quality-tier-four institutions and globally authoritative newsrooms; it measures evidence provenance, not truth by itself.':
    'A contagem de editores utiliza registos publicados e atribuídos na janela móvel de 30 dias. A proporção primária/global inclui instituições de nível quatro e redacções de autoridade mundial; mede a proveniência dos dados, não a sua veracidade isoladamente.',
};

const PORTUGUESE_INTERFACE_FRAGMENTS: Readonly<Record<string, string>> = {
  'Value': 'Valor',
  'unit': 'unidade',
  'and': 'e',
  'of': 'de',
  'for': 'para',
  'from': 'de',
  'with': 'com',
  'Definition': 'Definição',
  'Comparison': 'Comparação',
  'Coverage': 'Cobertura',
  'Timing': 'Período',
  'Boundary': 'Limitação',
  'Prepared': 'Preparado',
  'Section': 'Secção',
  'Observation': 'Observação',
  'Projection': 'Projecção',
  'change': 'variação',
  'countries higher': 'países com valor superior',
  'countries covered': 'países abrangidos',
  'under review': 'em revisão',
  'source-linked record': 'registo ligado à fonte',
  'source-linked records': 'registos ligados às fontes',
};

const normaliseInterfaceKey = (value: string) => value
  .replace(/[‘’]/g, "'")
  .replace(/[“”]/g, '"')
  .replace(/[–—]/g, '-')
  .replace(/\s+/g, ' ')
  .trim();

const NORMALISED_PORTUGUESE_INTERFACE_PHRASES = new Map<string, string>([
  ...Object.entries(PORTUGUESE_INTERFACE_PHRASES),
  ...Object.entries(PORTUGUESE_INTERFACE_FRAGMENTS),
].map(([english, portuguese]) => [normaliseInterfaceKey(english), portuguese]));

const translatePortugueseDynamicInterfaceText = (value: string): string | undefined => {
  let match: RegExpMatchArray | null;
  if ((match = value.match(/^(.+) recorded across (\d+) countries\.$/i))) {
    return `${match[1]} registados em ${match[2]} países.`;
  }
  if ((match = value.match(/^(.+)% median real growth and (.+)% median inflation\.$/i))) {
    return `Crescimento real mediano de ${match[1]}% e inflação mediana de ${match[2]}%.`;
  }
  if ((match = value.match(/^(.+)% of GDP median fixed investment across (\d+) reporting countries\.$/i))) {
    return `Investimento fixo mediano de ${match[1]}% do PIB em ${match[2]} países declarantes.`;
  }
  if ((match = value.match(/^(.+)% of GDP median current-account balance\.$/i))) {
    return `Saldo mediano da conta corrente de ${match[1]}% do PIB.`;
  }
  if ((match = value.match(/^Audit complete: (\d+) records checked and (\d+) refresh tasks created\.$/i))) {
    return `Auditoria concluída: ${match[1]} registos verificados e ${match[2]} tarefas de actualização criadas.`;
  }
  if ((match = value.match(/^(.+) as reported by the named official provider\.$/i))) {
    return `${match[1]}, conforme publicado pela entidade oficial identificada.`;
  }
  if ((match = value.match(/^Section (\d+)$/i))) return `Secção ${match[1]}`;
  if ((match = value.match(/^Prepared (.+)$/i))) return `Preparado em ${match[1]}`;
  if ((match = value.match(/^Last updated (.+)\.?$/i))) return `Última actualização: ${match[1]}.`;
  if ((match = value.match(/^Official snapshot retrieved (.+)$/i))) return `Instantâneo oficial consultado em ${match[1]}`;
  if ((match = value.match(/^Latest evidence (.+)$/i))) return `Evidência mais recente: ${match[1]}`;
  if ((match = value.match(/^Return to (.+) hub$/i))) return `Voltar ao dossiê de ${match[1]}`;
  if ((match = value.match(/^Capital:\s*(.+)$/i))) return `Capital: ${match[1]}`;
  if ((match = value.match(/^(\d+) source-linked (record|records)$/i))) {
    return `${match[1]} ${match[2].toLowerCase() === 'record' ? 'registo ligado à fonte' : 'registos ligados às fontes'}`;
  }
  if ((match = value.match(/^(\d+) recent country(-sector)? records plus (\d+) official provider records from (\d+) distinct attributed sources\.$/i))) {
    const scope = match[2] ? 'nacionais e sectoriais recentes' : 'nacionais recentes';
    return `${match[1]} registos ${scope}, acrescidos de ${match[3]} registos de fornecedores oficiais, provenientes de ${match[4]} fontes atribuídas distintas.`;
  }
  if ((match = value.match(/^(.+) country evidence snapshot$/i))) {
    return `Instantâneo documental nacional de ${match[1]}`;
  }
  if ((match = value.match(/^The ledger combines (\d+) dated official-provider snapshots with (\d+) (sector-specific records|recent country records)\. Reporting coverage is supporting context, not a substitute for official market data\.$/i))) {
    const reportingScope = match[3].toLowerCase() === 'sector-specific records' ? 'registos específicos do sector' : 'registos nacionais recentes';
    return `O livro combina ${match[1]} instantâneos datados de fornecedores oficiais com ${match[2]} ${reportingScope}. A cobertura jornalística constitui contexto de apoio, não substitui dados oficiais de mercado.`;
  }
  if ((match = value.match(/^(Projection|Observation)\s+(.+)$/i))) {
    return `${match[1].toLowerCase() === 'projection' ? 'Projecção' : 'Observação'} ${match[2]}`;
  }
  if ((match = value.match(/^Middle reading from (\d+) countries\s*(?:·|-)\s*(.+)$/i))) {
    return `Leitura mediana de ${match[1]} países · ${match[2]}`;
  }
  return undefined;
};

export function translatePortugueseInterfaceText(value: string): string | undefined {
  const key = normaliseInterfaceKey(value);
  const translated = NORMALISED_PORTUGUESE_INTERFACE_PHRASES.get(key)
    || translatePortugueseDynamicInterfaceText(key);
  return translated ? applyPortuguese1945Orthography(translated) : undefined;
}
