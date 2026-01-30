import { BASELINE_2026, getMarketDataForYear, MARKET_CYCLES, STAMP_DUTY_TIERS } from './constants';
import { MonthlyData, SimulationResult, PlanResult, SimulationMode, StressTestResult, AffordabilityResult, RefinanceResult } from './types';

// Helper to calculate stamp duty based on property price
const calculateStampDuty = (price: number): number => {
  for (const tier of STAMP_DUTY_TIERS) {
    if (price <= tier.limit) {
      if (tier.type === 0) return tier.fee;
      return price * (tier.fee / 100);
    }
  }
  return price * 0.0425; // Fallback max
};

export const calculateMortgage = (
  loanAmount: number,
  tenureYears: number,
  mode: SimulationMode,
  customPrime: number,
  customHibor: number,
  pDiscount: number,
  hSpread: number,
  hCapDiscount: number,
  propertyPrice: number,
  downPayment: number,
  enableRefinance: boolean,
  refinanceRebatePercent: number,
  enableFixedPlan: boolean,
  fixedRate: number,
  fixedLockPeriod: number,
  // New Props for ML
  enableMortgageLink: boolean,
  mortgageLinkAmount: number
): SimulationResult => {
  const monthlyData: MonthlyData[] = [];
  
  // State for H-Plan
  let hBalance = loanAmount;
  let hTotalInterest = 0;
  let hTotalPayment = 0;
  let hMaxPayment = 0;
  let hMinPayment = Number.MAX_VALUE;
  let hTotalMLInterest = 0; // Accumulated ML Savings

  // State for P-Plan
  let pBalance = loanAmount;
  let pTotalInterest = 0;
  let pTotalPayment = 0;
  let pTotalMLInterest = 0; // Accumulated ML Savings

  // State for Fixed Plan
  let fBalance = loanAmount;
  let fTotalInterest = 0;
  let fTotalPayment = 0;
  let fMaxPayment = 0;
  let fMinPayment = Number.MAX_VALUE;

  // State for Refinance
  const refinanceBreakdown: RefinanceResult['breakdown'] = [];
  let totalRefinanceGain = 0;
  let totalRefinanceRebate = 0;
  let totalRefinanceFee = 0;
  
  const totalMonths = tenureYears * 12;
  const ML_CAP_PERCENT = 0.5; // Standard HK Mortgage Link Cap: 50% of outstanding balance

  for (let month = 1; month <= totalMonths; month++) {
    const yearIndex = Math.floor((month - 1) / 12);
    
    // DETERMINE RATES BASED ON MODE
    let currentHibor: number;
    let currentPrime: number;
    let marketDesc: string;

    if (mode === SimulationMode.Custom) {
      currentHibor = customHibor;
      currentPrime = customPrime;
      marketDesc = "自訂固定利率";
    } else {
      // Historical / Dynamic Cycle
      const market = getMarketDataForYear(yearIndex);
      currentHibor = market.hibor;
      currentPrime = market.prime;
      marketDesc = market.desc;
    }
    
    const remainingMonths = totalMonths - month + 1;

    // --- P-PLAN CALCULATION ---
    const pPlanRatePercent = Math.max(0, currentPrime - pDiscount);
    const pMonthlyRate = pPlanRatePercent / 100 / 12;

    let pMonthlyPayment = 0;
    if (pMonthlyRate === 0) {
        pMonthlyPayment = pBalance / remainingMonths;
    } else {
        pMonthlyPayment = (pBalance * pMonthlyRate) / (1 - Math.pow(1 + pMonthlyRate, -remainingMonths));
    }
    if (month === totalMonths) pMonthlyPayment = pBalance + (pBalance * pMonthlyRate);

    const pInterest = pBalance * pMonthlyRate;
    
    // ML Calculation for P-Plan
    // Note: Mortgage Link interest rate typically matches the mortgage rate (P-Plan rate in this case)
    let pMLInterest = 0;
    if (enableMortgageLink) {
        // Cap is 50% of outstanding balance
        const effectiveMLBalance = Math.min(mortgageLinkAmount, pBalance * ML_CAP_PERCENT);
        pMLInterest = effectiveMLBalance * pMonthlyRate;
    }
    pTotalMLInterest += pMLInterest;

    const pPrincipal = pMonthlyPayment - pInterest;

    pBalance -= pPrincipal;
    if (pBalance < 0) pBalance = 0;

    pTotalInterest += pInterest;
    pTotalPayment += pMonthlyPayment;

    // --- H-PLAN CALCULATION ---
    // Use hCapDiscount for the Cap Rate
    const capRatePercent = Math.max(0, currentPrime - hCapDiscount);
    
    const hPlanFormulaRate = currentHibor + hSpread;
    const hEffectiveRatePercent = Math.min(hPlanFormulaRate, capRatePercent);
    const isCapTriggered = hPlanFormulaRate >= capRatePercent;
    const hMonthlyRate = hEffectiveRatePercent / 100 / 12;

    let hMonthlyPayment = 0;
    if (hMonthlyRate === 0) {
        hMonthlyPayment = hBalance / remainingMonths;
    } else {
        hMonthlyPayment = (hBalance * hMonthlyRate) / (1 - Math.pow(1 + hMonthlyRate, -remainingMonths));
    }
    if (month === totalMonths) hMonthlyPayment = hBalance + (hBalance * hMonthlyRate);

    const hInterest = hBalance * hMonthlyRate;

    // ML Calculation for H-Plan
    let hMLInterest = 0;
    if (enableMortgageLink) {
        // Cap is 50% of outstanding balance
        const effectiveMLBalance = Math.min(mortgageLinkAmount, hBalance * ML_CAP_PERCENT);
        hMLInterest = effectiveMLBalance * hMonthlyRate;
    }
    hTotalMLInterest += hMLInterest;

    const hPrincipal = hMonthlyPayment - hInterest;
    
    hBalance -= hPrincipal;
    if (hBalance < 0) hBalance = 0;
    
    hTotalInterest += hInterest;
    hTotalPayment += hMonthlyPayment;
    if (hMonthlyPayment > hMaxPayment) hMaxPayment = hMonthlyPayment;
    if (hMonthlyPayment < hMinPayment) hMinPayment = hMonthlyPayment;

    // --- FIXED PLAN CALCULATION ---
    let fEffectiveRatePercent = 0;
    // If within lock period (years), use fixed rate
    if (enableFixedPlan && yearIndex < fixedLockPeriod) {
        fEffectiveRatePercent = fixedRate;
    } else {
        // Otherwise revert to P-Plan rate (Prime - Discount)
        fEffectiveRatePercent = pPlanRatePercent;
    }

    let fMonthlyPayment = 0;
    let fInterest = 0;
    let fPrincipal = 0;

    if (enableFixedPlan) {
        const fMonthlyRate = fEffectiveRatePercent / 100 / 12;
        if (fMonthlyRate === 0) {
            fMonthlyPayment = fBalance / remainingMonths;
        } else {
            fMonthlyPayment = (fBalance * fMonthlyRate) / (1 - Math.pow(1 + fMonthlyRate, -remainingMonths));
        }
        if (month === totalMonths) fMonthlyPayment = fBalance + (fBalance * fMonthlyRate);

        fInterest = fBalance * fMonthlyRate;
        fPrincipal = fMonthlyPayment - fInterest;
        fBalance -= fPrincipal;
        if (fBalance < 0) fBalance = 0;

        fTotalInterest += fInterest;
        fTotalPayment += fMonthlyPayment;
        if (fMonthlyPayment > fMaxPayment) fMaxPayment = fMonthlyPayment;
        if (fMonthlyPayment < fMinPayment) fMinPayment = fMonthlyPayment;
    }

    // --- REFINANCE CALCULATION (Every 24 Months) ---
    // Check if simulation is enabled, it is a 2-year mark (24, 48...), and not the very last month
    if (enableRefinance && month % 24 === 0 && month < totalMonths) {
       // Refinance based on H-Plan Balance (Assuming H-Plan is the choice)
       // Note: Using H-Plan balance for refinance simulation.
       const currentBalance = hBalance; 
       
       const rebateAmount = currentBalance * (refinanceRebatePercent / 100);
       const legalFee = BASELINE_2026.REFINANCE_LEGAL_FEE_ESTIMATE;
       
       // Only count if positive gain
       if (rebateAmount > legalFee) {
           const netGain = rebateAmount - legalFee;
           totalRefinanceGain += netGain;
           totalRefinanceRebate += rebateAmount;
           totalRefinanceFee += legalFee;
           
           refinanceBreakdown.push({
               year: month / 12,
               remainingBalance: currentBalance,
               rebateAmount,
               legalFee,
               netGain
           });
       }
    }

    // --- PUSH DATA ---
    monthlyData.push({
      month,
      year: BASELINE_2026.START_YEAR + yearIndex,
      hibor: currentHibor,
      prime: currentPrime,
      marketDesc,
      
      hEffectiveRate: hEffectiveRatePercent,
      hMonthlyPayment,
      hInterestPayment: hInterest,
      hPrincipalPayment: hPrincipal,
      hRemainingBalance: hBalance,
      isCapTriggered,
      hMortgageLinkInterest: hMLInterest,
      hNetInterest: hInterest - hMLInterest,

      pEffectiveRate: pPlanRatePercent,
      pMonthlyPayment,
      pInterestPayment: pInterest,
      pPrincipalPayment: pPrincipal,
      pRemainingBalance: pBalance,
      pMortgageLinkInterest: pMLInterest,

      // Fixed Plan
      fEffectiveRate: fEffectiveRatePercent,
      fMonthlyPayment: enableFixedPlan ? fMonthlyPayment : 0,
      fInterestPayment: enableFixedPlan ? fInterest : 0,
      fPrincipalPayment: enableFixedPlan ? fPrincipal : 0,
      fRemainingBalance: enableFixedPlan ? fBalance : 0,
    });
  }

  const cashRebate = loanAmount * (BASELINE_2026.CASH_REBATE_PERCENT / 100);

  const hPlanResult: PlanResult = {
    totalInterest: hTotalInterest,
    totalPayment: hTotalPayment,
    netTotalCost: hTotalPayment - cashRebate - hTotalMLInterest, // Net Cost includes ML savings
    maxPayment: hMaxPayment,
    minPayment: hMinPayment === Number.MAX_VALUE ? 0 : hMinPayment,
    totalMortgageLinkSavings: hTotalMLInterest,
    netTotalInterest: hTotalInterest - hTotalMLInterest
  };

  const pPlanResult: PlanResult = {
    totalInterest: pTotalInterest,
    totalPayment: pTotalPayment,
    netTotalCost: pTotalPayment - cashRebate - pTotalMLInterest, // Net Cost includes ML savings
    maxPayment: Math.max(...monthlyData.map(m => m.pMonthlyPayment)),
    minPayment: Math.min(...monthlyData.map(m => m.pMonthlyPayment)),
    totalMortgageLinkSavings: pTotalMLInterest,
    netTotalInterest: pTotalInterest - pTotalMLInterest
  };

  let fixedPlanResult: PlanResult | undefined;
  if (enableFixedPlan) {
      fixedPlanResult = {
        totalInterest: fTotalInterest,
        totalPayment: fTotalPayment,
        netTotalCost: fTotalPayment - cashRebate, 
        maxPayment: fMaxPayment,
        minPayment: fMinPayment === Number.MAX_VALUE ? 0 : fMinPayment,
      };
  }

  // --- STRESS TEST CALCULATION ---
  let maxCyclePrime = 0;
  let maxCycleYearDesc = "未知";
  
  Object.values(MARKET_CYCLES).forEach(m => {
      if (m.prime > maxCyclePrime) {
          maxCyclePrime = m.prime;
          maxCycleYearDesc = m.desc;
      }
  });

  const stressRateVal = Math.max(0, maxCyclePrime - pDiscount);
  const stressMonthlyRate = stressRateVal / 100 / 12;
  const stressPayment = (loanAmount * stressMonthlyRate) / (1 - Math.pow(1 + stressMonthlyRate, -totalMonths));

  const stressTestResult: StressTestResult = {
      maxPrime: maxCyclePrime,
      maxEffectiveRate: stressRateVal,
      monthlyPayment: stressPayment,
      marketDesc: maxCycleYearDesc
  };

  // --- AFFORDABILITY CALCULATION ---
  const stampDuty = calculateStampDuty(propertyPrice);
  const agencyFee = propertyPrice * (BASELINE_2026.AGENCY_FEE_PERCENT / 100);
  const legalFee = BASELINE_2026.LEGAL_FEE_ESTIMATE;
  const totalUpfrontCash = downPayment + stampDuty + agencyFee + legalFee;

  const initialPrime = monthlyData[0].prime;
  const initialCapRate = Math.max(0, initialPrime - pDiscount);
  const initialCapMonthlyRate = initialCapRate / 100 / 12;
  const approvalMonthlyPayment = (loanAmount * initialCapMonthlyRate) / (1 - Math.pow(1 + initialCapMonthlyRate, -totalMonths));
  
  const minIncomeRequired = approvalMonthlyPayment / 0.5;

  return {
    monthlyData,
    cashRebate,
    hPlan: hPlanResult,
    pPlan: pPlanResult,
    fixedPlan: fixedPlanResult,
    savings: pTotalPayment - hTotalPayment,
    fixedSavings: fixedPlanResult ? hTotalPayment - fixedPlanResult.totalPayment : 0, 
    simulationMode: mode,
    stressTest: stressTestResult,
    affordability: {
      stampDuty,
      agencyFee,
      legalFee,
      totalUpfrontCash,
      minIncomeRequired
    },
    refinance: {
        enabled: enableRefinance,
        totalNetGain: totalRefinanceGain,
        totalRebateAmount: totalRefinanceRebate,
        totalLegalFee: totalRefinanceFee,
        breakdown: refinanceBreakdown
    },
    mortgageLink: {
        enabled: enableMortgageLink,
        depositAmount: mortgageLinkAmount
    }
  };
};

export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('zh-HK', { style: 'currency', currency: 'HKD', maximumFractionDigits: 0 }).format(val);
};

export const formatPercent = (val: number) => {
  return `${val.toFixed(2)}%`;
};