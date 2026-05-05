export interface InssBracket {
  upToCents: number;
  ratePercent: number;
}

export interface IrrfBracket {
  upToCents: number | null;
  ratePercent: number;
  deductionCents: number;
}

export interface LaborRuleSet {
  id: string;
  effectiveFrom: string;
  sourceLabel: string;
  overtimeMinimumPercent: number;
  nightMinimumPercent: number;
  nightStartHour: number;
  nightEndHour: number;
  nightHourFactor: number;
  dailyToleranceMinutes: number;
  fgtsEmployerPercent: number;
  irrfDependentDeductionCents: number;
  irrfSimplifiedDeductionLimitCents: number;
  irrfMonthlyReductionZeroLimitCents: number;
  irrfMonthlyReductionLinearLimitCents: number;
  irrfMonthlyReductionFixedCents: number;
  irrfMonthlyReductionFactor: number;
  inssEmployeeBrackets: InssBracket[];
  irrfMonthlyBrackets: IrrfBracket[];
}

const laborRuleSets: LaborRuleSet[] = [
  {
    id: "br-clt-2026-01",
    effectiveFrom: "2026-01-01",
    sourceLabel: "CLT art. 59/73 e tabela INSS vigente desde jan/2026",
    overtimeMinimumPercent: 50,
    nightMinimumPercent: 20,
    nightStartHour: 22,
    nightEndHour: 5,
    nightHourFactor: 8 / 7,
    dailyToleranceMinutes: 10,
    fgtsEmployerPercent: 8,
    irrfDependentDeductionCents: 18959,
    irrfSimplifiedDeductionLimitCents: 60720,
    irrfMonthlyReductionZeroLimitCents: 500000,
    irrfMonthlyReductionLinearLimitCents: 735000,
    irrfMonthlyReductionFixedCents: 97862,
    irrfMonthlyReductionFactor: 0.133145,
    inssEmployeeBrackets: [
      { upToCents: 162100, ratePercent: 7.5 },
      { upToCents: 290284, ratePercent: 9 },
      { upToCents: 435427, ratePercent: 12 },
      { upToCents: 847555, ratePercent: 14 },
    ],
    irrfMonthlyBrackets: [
      { upToCents: 242880, ratePercent: 0, deductionCents: 0 },
      { upToCents: 282665, ratePercent: 7.5, deductionCents: 18216 },
      { upToCents: 375105, ratePercent: 15, deductionCents: 39416 },
      { upToCents: 466468, ratePercent: 22.5, deductionCents: 67549 },
      { upToCents: null, ratePercent: 27.5, deductionCents: 90873 },
    ],
  },
];

export function getLaborRulesForDate(dateKey: string): LaborRuleSet {
  const sorted = [...laborRuleSets].sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
  return sorted.find((rules) => rules.effectiveFrom <= dateKey) ?? sorted[sorted.length - 1];
}

export function calculateProgressiveInssCents(grossCents: number, rules: LaborRuleSet): number {
  const contributionBaseCents = Math.min(
    Math.max(0, Math.round(grossCents)),
    rules.inssEmployeeBrackets[rules.inssEmployeeBrackets.length - 1]?.upToCents ?? 0
  );
  let previousLimitCents = 0;
  let discountCents = 0;

  for (const bracket of rules.inssEmployeeBrackets) {
    if (contributionBaseCents <= previousLimitCents) break;

    const taxableCents = Math.min(contributionBaseCents, bracket.upToCents) - previousLimitCents;
    discountCents += Math.round(taxableCents * (bracket.ratePercent / 100));
    previousLimitCents = bracket.upToCents;
  }

  return discountCents;
}

export function calculateIrrfCents(
  grossCents: number,
  inssDiscountCents: number,
  rules: LaborRuleSet,
  dependents = 0
): number {
  const legalBaseCents = Math.max(
    0,
    grossCents - inssDiscountCents - Math.max(0, dependents) * rules.irrfDependentDeductionCents
  );
  const simplifiedBaseCents = Math.max(0, grossCents - rules.irrfSimplifiedDeductionLimitCents);
  const taxableBaseCents = Math.min(legalBaseCents, simplifiedBaseCents);
  const bracket =
    rules.irrfMonthlyBrackets.find((item) => item.upToCents === null || taxableBaseCents <= item.upToCents) ??
    rules.irrfMonthlyBrackets[rules.irrfMonthlyBrackets.length - 1];
  const bracketTaxCents = Math.max(
    0,
    Math.round(taxableBaseCents * (bracket.ratePercent / 100)) - bracket.deductionCents
  );
  const monthlyReductionCents = calculateIrrfMonthlyReductionCents(grossCents, bracketTaxCents, rules);

  return Math.max(0, bracketTaxCents - monthlyReductionCents);
}

function calculateIrrfMonthlyReductionCents(grossCents: number, calculatedTaxCents: number, rules: LaborRuleSet) {
  if (grossCents <= rules.irrfMonthlyReductionZeroLimitCents) return calculatedTaxCents;
  if (grossCents > rules.irrfMonthlyReductionLinearLimitCents) return 0;

  return Math.min(
    calculatedTaxCents,
    Math.max(0, Math.round(rules.irrfMonthlyReductionFixedCents - rules.irrfMonthlyReductionFactor * grossCents))
  );
}
