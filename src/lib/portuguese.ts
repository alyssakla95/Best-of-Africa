/** Deterministic pt-PT normalisation using spellings from before AO90. */
type Replacement = string | ((match: string, ...groups: string[]) => string);
const REPLACEMENTS: ReadonlyArray<readonly [RegExp, Replacement]> = [
    [/\bsetor(es|ial|iais)?\b/gi, 'sector$1'],
    [/\batividade(s)?\b/gi, 'actividade$1'],
    [/\bativo(s|a|as)?\b/gi, 'activo$1'],
    [/\batual(mente|ização|izações)?\b/gi, 'actual$1'],
    [/\bprojeto(s)?\b/gi, 'projecto$1'],
    [/\bobjetivo(s)?\b/gi, 'objectivo$1'],
    [/\bperspetiva(s)?\b/gi, 'perspectiva$1'],
    [/\bdiretor(es|a|as)?\b/gi, 'director$1'],
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
    [/\bplaneja\b/gi, 'planeia'],
    [/\bplanejam\b/gi, 'planeiam'],
    [/\bplanejado(s|a|as)?\b/gi, 'planeado$1'],
    [/\bgerenciamento\b/gi, 'gestão'],
    [/\bgovernança\b/gi, 'governação'],
    [/\bdemanda(s)?\b/gi, 'procura$1'],
    [/\bmanufatura(s)?\b/gi, 'indústria transformadora'],
    [/\bmanufatureiras?\b/gi, 'industriais'],
    [/\bmanufatureiros?\b/gi, 'industriais'],
    [/\bsocioeconômicos?\b/gi, (match) => match.toLowerCase().endsWith('s') ? 'socioeconómicos' : 'socioeconómico'],
    [/\bsocioeconômicas?\b/gi, (match) => match.toLowerCase().endsWith('s') ? 'socioeconómicas' : 'socioeconómica'],
    [/\bcronograma(s)?\b/gi, 'calendário$1'],
    [/\bforça coletiva\b/gi, 'força colectiva'],
    [/\bgovernos estaduais\b/gi, 'governos dos estados'],
    [/\bse beneficiar de\b/gi, 'beneficiar de'],
    [/\bse beneficiar da\b/gi, 'beneficiar da'],
    [/\bse beneficiar do\b/gi, 'beneficiar do'],
    [/\bpriorizar\b/gi, 'dar prioridade a'],
    [/\bindústrias de processamento\b/gi, 'indústrias de transformação'],
    [/\bEla citou\b/g, 'Citou'],
    [/\bEle disse:/g, 'Afirmou:'],
    [/\brecursos domésticos\b/gi, 'recursos internos'],
    [/\bestão remodelando\b/gi, 'estão a transformar'],
    [/\brumo à/gi, 'no sentido da'],
    [/\bsediará/gi, 'acolherá'],
    [/\bsediarão/gi, 'acolherão'],
    [/\bcúpula(s)?\b/gi, 'cimeira$1'],
    [/\bvitrine(s)?\b/gi, 'montra$1'],
    [/\brodada(s)?\b/gi, 'ronda$1'],
    [/\bcoalizão\b/gi, 'coligação'],
    [/\bcoalizões\b/gi, 'coligações'],
    [/\bpoderá se tornar\b/gi, 'poderá tornar-se'],
    [/\bpodem se tornar\b/gi, 'podem tornar-se'],
    [/\bpolo(s)?\b/gi, 'pólo$1'],
    [/\bCopa do Mundo\b/g, 'Campeonato do Mundo'],
    [/\bregistrou\b/gi, 'registou'],
    [/\bregistraram\b/gi, 'registaram'],
    [/\btreinamento(s)?\b/gi, 'formação'],
    [/\bfator(es)?\b/gi, 'factor$1'],
    [/\bcomissionamento de\b/gi, 'entrada ao serviço de'],
    [/\btransações\b/gi, 'transacções'],
    [/\btransação\b/gi, 'transacção'],
    [/\bNorth Kordofan\b/gi, 'Cordofão do Norte'],
    [/\belétric([oa]s?)\b/gi, 'eléctric$1'],
    [/\brodovia(s)?\b/gi, 'estrada$1'],
    [/\bcidade chave\b/gi, 'cidade estratégica'],
    [/\bevidências de satélite\b/gi, 'imagens de satélite'],
    [/\bpadrões de direitos humanos\b/gi, 'normas de direitos humanos'],
    [/\bYoY\b/g, 'em termos homólogos'],
    [/\balta de (?=\d)/gi, 'aumento de '],
    [/\bem agosto de\b/gi, 'em Agosto de'],
    [/\bem março\b/gi, 'em Março'],
    [/\bfaturas\b/gi, (match) => /^[A-Z]/.test(match) ? 'Facturas' : 'facturas'],
    [/\bfatura\b/gi, (match) => /^[A-Z]/.test(match) ? 'Factura' : 'factura'],
    [/\bGastos de viagem luxuosos\b/g, 'Despesas de viagem luxuosas'],
    [/\bgastos\b/gi, 'despesas'],
    [/\bgasto\b/gi, 'despesa'],
    [/\bsobre os despesas\b/gi, 'sobre as despesas'],
    [/\bregras de política\b/gi, 'regras internas'],
    [/\bjustificativa\b/gi, 'justificação'],
    [/\bFacturas vazadas\b/g, 'Facturas divulgadas'],
    [/\bprovocam raiva\b/gi, 'provocam indignação'],
    [/\bem Cape Town\b/gi, 'na Cidade do Cabo'],
    [/\bCape Town\b/g, 'Cidade do Cabo'],
    [/\bdurante maio[‑-]junho\b/gi, 'entre Maio e Junho'],
    [/\bsua participação\b/gi, 'a sua participação'],
    [/\bseus subsídios\b/gi, 'os seus subsídios'],
    [/\blongo[‑-]prazo\b/gi, 'longo prazo'],
    [/\bLiberia\b/g, 'Libéria'],
    [/\bde sua zona\b/gi, 'da sua zona'],
    [/\bcerimônia\b/gi, 'cerimónia'],
    [/\bEla alertou\b/g, 'Alertou'],
    [/\bEle enfatizou\b/g, 'Salientou'],
    [/\benfatizou\b/gi, 'salientou'],
    [/\bvinculou\b/gi, 'associou'],
    [/\baproveitar essa oportunidade\b/gi, 'aproveitar esta oportunidade'],
    [/\borientar seu trabalho\b/gi, 'orientar o seu trabalho'],
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
    [/\bem uma\b/gi, (match) => /^[A-Z]/.test(match) ? 'Numa' : 'numa'],
    [/\bem um\b/gi, (match) => /^[A-Z]/.test(match) ? 'Num' : 'num'],
    [/\bótim([oa]s?)\b/gi, 'óptim$1'],
    [/\$([0-9]+(?:\.[0-9]+)?)\s+billion\b/gi, (_match: string, amount: string) => `$${amount.replace('.', ',')} mil milhões`],
    [/\$([0-9]+(?:\.[0-9]+)?)\s+million\b/gi, (_match: string, amount: string) => `$${amount.replace('.', ',')} milhões`],
    [/(\d)\.(\d)/g, '$1,$2'],
];

export const PORTUGUESE_SECTOR_NAMES: Readonly<Record<string, string>> = {
    'Agriculture & Agribusiness': 'Agricultura e agro-indústria',
    'Energy & Mining': 'Energia e mineração',
    'Finance & Investment': 'Finanças e investimento',
    'Healthcare & Pharma': 'Saúde e indústria farmacêutica',
    'Infrastructure & Construction': 'Infra-estruturas e construção',
    'Technology & Innovation': 'Tecnologia e inovação',
    'Tourism & Hospitality': 'Turismo e hotelaria',
};

export function portugueseSectorName(value: string | null | undefined): string | null {
    if (value == null) return null;
    return PORTUGUESE_SECTOR_NAMES[value] || normalisePortuguesePortugal1945(value) || value;
}

export function portugueseCountryName(code: string | null | undefined, fallback: string | null | undefined): string | null {
    if (!fallback && !code) return null;
    if (!code) return fallback || null;
    try {
        const normalizedCode = code.toUpperCase();
        const preAgreementNames: Readonly<Record<string, string>> = { EG: 'Egipto' };
        return preAgreementNames[normalizedCode]
            || new Intl.DisplayNames(['pt-PT'], { type: 'region' }).of(normalizedCode)
            || fallback
            || normalizedCode;
    } catch {
        return fallback || code;
    }
}

export function normalisePortuguesePortugal1945(value: string | null | undefined): string | null {
    if (value == null) return null;
    return REPLACEMENTS.reduce(
        (text, [pattern, replacement]) => typeof replacement === 'string'
            ? text.replace(pattern, replacement)
            : text.replace(pattern, replacement),
        value,
    );
}
