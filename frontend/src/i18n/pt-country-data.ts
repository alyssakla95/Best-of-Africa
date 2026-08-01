const DESCRIPTIONS: Readonly<Record<string, string>> = {
  DZ: 'A Argélia é o maior país de África e dispõe de importantes reservas de petróleo e gás natural.',
  EG: 'O Egipto liga África à Ásia e possui uma economia diversificada e acesso estratégico ao Canal do Suez.',
  LY: 'A Líbia possui as maiores reservas comprovadas de petróleo de África e atravessa um processo de reconstrução política.',
  MA: 'Marrocos possui uma economia norte-africana diversificada, com actividade relevante no turismo, na agricultura e nos fosfatos.',
  MR: 'A Mauritânia dispõe de recursos importantes, tendo o minério de ferro e a pesca entre as principais exportações.',
  SD: 'O Sudão atravessa uma transição política e possui potencial agrícola e mineral significativo.',
  TN: 'A Tunísia possui uma economia diversificada, com turismo, indústria transformadora e extracção de fosfatos.',
  BJ: 'O Benim possui uma economia apoiada no porto e nas exportações de algodão.',
  BF: 'O Burquina Faso é um país sem litoral cuja economia inclui mineração de ouro e produção de algodão.',
  CV: 'Cabo Verde é um arquipélago cuja economia inclui turismo e remessas da diáspora.',
  CI: 'A Costa do Marfim é o maior produtor mundial de cacau e uma das maiores economias da África Ocidental.',
  GM: 'A Gâmbia é um pequeno país ribeirinho cuja economia inclui turismo e agricultura.',
  GH: 'O Gana é um importante produtor de ouro, cacau e petróleo.',
  GN: 'A Guiné possui as maiores reservas mundiais de bauxite e depósitos importantes de minério de ferro.',
  GW: 'A Guiné-Bissau é um pequeno país costeiro cuja principal indústria exportadora assenta na castanha de caju.',
  LR: 'A Libéria reconstrói a sua economia após o conflito, com actividade nos sectores do minério de ferro, borracha e silvicultura.',
  ML: 'O Mali é um país sem litoral com mineração de ouro e potencial agrícola.',
  NE: 'O Níger exporta urânio e desenvolve a produção petrolífera.',
  NG: 'A Nigéria é a economia mais populosa de África, com actividade importante no petróleo, gás e tecnologia financeira.',
  SN: 'O Senegal possui actividade no turismo, pesca e novas explorações de petróleo e gás.',
  SL: 'A Serra Leoa reconstrói a sua economia com exportações de diamantes, minério de ferro e produtos agrícolas.',
  TG: 'O Togo funciona como corredor de trânsito, com extracção de fosfatos e um porto importante em Lomé.',
  BI: 'O Burundi é um pequeno país sem litoral cujas exportações incluem café e chá.',
  KM: 'As Comores são um arquipélago exportador de baunilha, cravinho e ilangue-ilangue.',
  DJ: 'O Jibuti ocupa uma posição portuária estratégica no Corno de África e dispõe de infra-estruturas logísticas importantes.',
  ER: 'A Eritreia possui potencial mineiro e acesso estratégico ao Mar Vermelho.',
  ET: 'A Etiópia é o segundo país mais populoso de África, com actividade crescente na indústria transformadora e na agricultura.',
  KE: 'O Quénia é uma das maiores economias da África Oriental e um centro regional de finanças, tecnologia e comércio.',
  MG: 'Madagáscar possui biodiversidade excepcional e actividade na baunilha, mineração e turismo.',
  MW: 'O Maláui possui uma economia agrícola, tendo o tabaco e o chá entre as principais exportações.',
  MU: 'A Maurícia é uma economia insular de rendimento elevado com serviços financeiros, turismo e indústria têxtil.',
  MZ: 'Moçambique possui grandes reservas de gás natural liquefeito e procura afirmar-se como exportador de energia.',
  RW: 'O Ruanda desenvolve serviços e infra-estruturas tecnológicas no quadro da sua estratégia económica.',
  ST: 'São Tomé e Príncipe é um pequeno arquipélago com produção de cacau e potencial petrolífero emergente.',
  SC: 'As Seicheles são uma economia insular de rendimento elevado fortemente ligada ao turismo.',
  SO: 'A Somália reconstrói a sua economia com exportações pecuárias e remessas da diáspora.',
  SS: 'O Sudão do Sul é o país mais jovem de África e possui reservas petrolíferas importantes.',
  TZ: 'A Tanzânia possui recursos naturais diversificados, incluindo ouro, gás natural e activos turísticos.',
  UG: 'O Uganda possui uma economia agrícola, produção petrolífera emergente e um sector tecnológico em crescimento.',
  AO: 'Angola é um dos maiores produtores africanos de petróleo e possui mineração de diamantes e esforços de diversificação.',
  CM: 'Os Camarões são uma das maiores economias da África Central, com petróleo, agricultura e infra-estruturas portuárias.',
  CF: 'A República Centro-Africana possui potencial em ouro e diamantes, condicionado por instabilidade persistente.',
  TD: 'O Chade produz petróleo e exporta produtos agrícolas e pecuários.',
  CD: 'A República Democrática do Congo possui vastos recursos minerais, incluindo cobalto, cobre e coltan.',
  CG: 'A República do Congo produz petróleo e possui actividade na silvicultura e nos serviços portuários.',
  GQ: 'A Guiné Equatorial é um produtor importante de petróleo e possui um dos PIB por habitante mais elevados de África.',
  GA: 'O Gabão procura diversificar a sua economia petrolífera através do manganês, madeira e turismo ecológico.',
  BW: 'O Botsuana possui uma economia fortemente ligada aos diamantes, com turismo e instituições consolidadas.',
  SZ: 'Essuatíni possui produção de açúcar, indústria têxtil e serviços financeiros em crescimento.',
  LS: 'O Lesoto é um reino montanhoso com exportações de água e indústria têxtil.',
  NA: 'A Namíbia possui urânio, diamantes e potencial crescente no hidrogénio verde.',
  ZA: 'A África do Sul é a economia mais industrializada do continente, com mineração, finanças e indústria transformadora.',
  ZM: 'A Zâmbia é um dos maiores produtores africanos de cobre e possui actividade no turismo e na agricultura.',
  ZW: 'O Zimbabué possui recursos minerais, incluindo ouro, platina e lítio, além de potencial agrícola.',
};

export function portugueseCountryDescription(code: string | null | undefined, fallback = ''): string {
  return code ? DESCRIPTIONS[code.toUpperCase()] || fallback : fallback;
}

export function readerCountryName(code: string | null | undefined, fallback: string, language: string): string {
  if (language !== 'pt' || !code) return fallback;
  try {
    const normalizedCode = code.toUpperCase();
    const preAgreementNames: Readonly<Record<string, string>> = { EG: 'Egipto' };
    return preAgreementNames[normalizedCode]
      || new Intl.DisplayNames(['pt-PT'], { type: 'region' }).of(normalizedCode)
      || fallback;
  } catch {
    return fallback;
  }
}
