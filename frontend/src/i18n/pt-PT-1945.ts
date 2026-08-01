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
  [/\batual(mente|ização|izações)?\b/gi, (value: string) => value.replace(/atual/gi, 'actual')],
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
  'Explore': 'Explorar',
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
  'Read evidence in layers: definition, value, comparison, coverage, time period and limitation. This stops a large number, positive movement or high ranking from being mistaken for a complete conclusion.':
    'Leia os dados por camadas: definição, valor, comparação, cobertura, período e limitação. Isto evita que um número elevado, uma evolução positiva ou uma classificação alta sejam confundidos com uma conclusão completa.',
  'A value is evidence, not a verdict.': 'Um valor é um dado, não um veredicto.',
  'BOA Trust Protocol': 'Protocolo de confiança da BOA',
  'Intelligence trust protocol': 'Protocolo de confiança da inteligência',
  'Live, source-bound intelligence': 'Inteligência em directo, limitada às fontes',
  'Traceable by design.': 'Rastreável desde a concepção.',
  'Read editorial standards': 'Ler as normas editoriais',
  'Editorial standards →': 'Normas editoriais →',
  'View method +': 'Ver o método +',
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
  'Browse All Continent Summits →': 'Consultar todas as cimeiras do continente →',
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
};

const PHRASE_RULES = Object.entries(PORTUGUESE_INTERFACE_PHRASES)
  .sort(([left], [right]) => right.length - left.length)
  .map(([english, portuguese]) => {
    const escaped = english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const prefix = /^[A-Za-z0-9]/.test(english) ? '\\b' : '';
    const suffix = /[A-Za-z0-9]$/.test(english) ? '\\b' : '';
    return [new RegExp(`${prefix}${escaped}${suffix}`, 'g'), portuguese] as const;
  });

export function translatePortugueseInterfaceText(value: string): string | undefined {
  const exact = PORTUGUESE_INTERFACE_PHRASES[value];
  if (exact) return applyPortuguese1945Orthography(exact);

  const translated = PHRASE_RULES.reduce(
    (result, [pattern, replacement]) => result.replace(pattern, replacement),
    value,
  );
  return translated === value ? undefined : applyPortuguese1945Orthography(translated);
}
