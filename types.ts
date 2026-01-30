export interface MortgageParams {
  loanAmount: number;
  tenureYears: number;
  simulationMode: SimulationMode;
  customPrime: number;
  customHibor: number;
}

export enum SimulationMode {
  Historical = 'HISTORICAL',
  Custom = 'CUSTOM',
}

export interface MonthlyData {
  month: number;
  year: number;
  hibor: number;
  prime: number;
  marketDesc: string;
  
  // H-Plan Data
  hEffectiveRate: number;
  hMonthlyPayment: number;
  hInterestPayment: number;
  hPrincipalPayment: number;
  hRemainingBalance: number;
  isCapTriggered: boolean;
  hMortgageLinkInterest: number; // New: Interest earned from ML
  hNetInterest: number;          // New: Interest paid - Interest earned

  // P-Plan Data
  pEffectiveRate: number;
  pMonthlyPayment: number;
  pInterestPayment: number;
  pPrincipalPayment: number;
  pRemainingBalance: number;
  pMortgageLinkInterest: number; // New

  // Fixed Plan Data (New)
  fEffectiveRate: number;
  fMonthlyPayment: number;
  fInterestPayment: number;
  fPrincipalPayment: number;
  fRemainingBalance: number;
  
  // Repayment Info
  extraRepayment?: number; // New: Partial repayment amount made this month
}

export interface PlanResult {
  totalInterest: number;
  totalPayment: number;
  netTotalCost: number;
  maxPayment: number;
  minPayment: number;
  // New ML fields
  totalMortgageLinkSavings?: number;
  netTotalInterest?: number;
}

export interface StressTestResult {
  maxPrime: number;
  maxEffectiveRate: number;
  monthlyPayment: number;
  marketDesc: string;
}

export interface AffordabilityResult {
  stampDuty: number;
  agencyFee: number;
  legalFee: number;
  totalUpfrontCash: number; // Down payment + fees
  minIncomeRequired: number; // Based on DSR
}

export interface RefinanceResult {
  enabled: boolean;
  totalNetGain: number; // Total Rebate - Total Legal Fees
  totalRebateAmount: number; // Gross Rebate
  totalLegalFee: number; // Gross Fees
  breakdown: {
    year: number;
    remainingBalance: number;
    rebateAmount: number;
    legalFee: number;
    netGain: number;
  }[];
}

export interface RentVsBuyResult {
  enabled: boolean;
  initialRent: number;
  rentalYield: number; // calculated
  breakEvenYear: number | null; // The year buying becomes better than renting
  finalBuyNetWorth: number;
  finalRentNetWorth: number;
  yearlyData: {
    year: number;
    buyNetWorth: number; // Property Value - Loan + Accumulated Cashflow Diff (if positive)
    rentNetWorth: number; // Investment Portfolio Value
    propertyValue: number;
    outstandingLoan: number;
    rentPaidCumulative: number;
    buyCostCumulative: number; // Interest + Mgmt Fee + Transaction Costs
  }[];
}

export interface SimulationResult {
  monthlyData: MonthlyData[];
  cashRebate: number;
  hPlan: PlanResult;
  pPlan: PlanResult;
  fixedPlan?: PlanResult; // New optional result
  savings: number; // Positive means H-Plan is cheaper than P-Plan
  fixedSavings?: number; // Comparison vs H-Plan
  simulationMode: SimulationMode;
  stressTest: StressTestResult;
  affordability: AffordabilityResult;
  refinance: RefinanceResult;
  mortgageLink: {
    enabled: boolean;
    depositAmount: number;
  };
  partialRepayment?: {
      enabled: boolean;
      amount: number;
      year: number;
  };
  rentVsBuy: RentVsBuyResult;
}

export enum ViewMode {
  Summary = 'SUMMARY',
  Schedule = 'SCHEDULE',
  RentVsBuy = 'RENT_VS_BUY',
}