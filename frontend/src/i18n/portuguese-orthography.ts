/** Mechanical European Portuguese spelling rules used by shared chrome. */
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
  [/\bdireção\b/gi, 'direcção'], [/\bseleção\b/gi, 'selecção'],
  [/\bproteção\b/gi, 'protecção'], [/\bcoleção\b/gi, 'colecção'],
  [/\binteração\b/gi, 'interacção'], [/\btransação\b/gi, 'transacção'],
  [/\badoção\b/gi, 'adopção'], [/\bação\b/gi, 'acção'], [/\bações\b/gi, 'acções'],
  [/\bfato(s)?\b/gi, 'facto$1'], [/\bcontato(s)?\b/gi, 'contacto$1'],
  [/\binfraestrutura(s)?\b/gi, 'infra-estrutura$1'],
  [/\beconômic([oa]s?)\b/gi, 'económic$1'], [/\bacadêm([oa]s?)\b/gi, 'académic$1'],
  [/\bprêmio(s)?\b/gi, 'prémio$1'], [/\bplanejamento\b/gi, 'planeamento'],
  [/\bgerenciamento\b/gi, 'gestão'], [/\bgovernança\b/gi, 'governação'],
  [/\bdemanda(s)?\b/gi, 'procura$1'], [/\bequipe(s)?\b/gi, 'equipa$1'],
  [/\busuários\b/gi, 'utilizadores'], [/\busuário\b/gi, 'utilizador'],
  [/\btrilhão\b/gi, 'bilião'], [/\btrilhões\b/gi, 'biliões'],
  [/\bbilhão\b/gi, 'mil milhões'], [/\bbilhões\b/gi, 'mil milhões'],
  [/\bônibus\b/gi, 'autocarro'], [/\btrens\b/gi, 'comboios'], [/\btrem\b/gi, 'comboio'],
  [/\bcelulares\b/gi, 'telemóveis'], [/\bcelular\b/gi, 'telemóvel'],
  [/\bcaminhões\b/gi, 'camiões'], [/\bcaminhão\b/gi, 'camião'],
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
