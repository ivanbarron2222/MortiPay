import type { LoanTermMonths, MotorcycleCatalogItem } from "../data/motorcycles";

export type LoanEstimateInput = {
  motorcyclePrice: number;
  downPayment: number;
  months: LoanTermMonths;
  annualInterestRate: number;
};

export type LoanEstimateResult = {
  principal: number;
  monthlyInterestRate: number;
  monthlyPayment: number;
  totalPayable: number;
};

export function estimateLoan({
  motorcyclePrice,
  downPayment,
  months,
  annualInterestRate,
}: LoanEstimateInput): LoanEstimateResult {
  const principal = Math.max(motorcyclePrice - downPayment, 0);
  const monthlyInterestRate = annualInterestRate / 12 / 100;

  if (principal === 0 || months <= 0) {
    return {
      principal: 0,
      monthlyInterestRate,
      monthlyPayment: 0,
      totalPayable: 0,
    };
  }

  const totalInterest = principal * monthlyInterestRate * months;
  const totalPayable = principal + totalInterest;
  const monthlyPayment = totalPayable / months;

  return {
    principal,
    monthlyInterestRate,
    monthlyPayment,
    totalPayable,
  };
}

export function getDefaultLoanSetup(item: MotorcycleCatalogItem) {
  return {
    downPayment: item.downPaymentOptions[0] ?? 0,
    months: item.availableTerms[0] ?? 12,
    annualInterestRate: 12,
  };
}

export function formatPhpCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(amount);
}
