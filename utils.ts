import { BASELINE_2026, getMarketDataForYear, MARKET_CYCLES, STAMP_DUTY_TIERS } from './constants';
import { MonthlyData, SimulationResult, PlanResult, SimulationMode, StressTestResult, AffordabilityResult, RefinanceResult, RentVsBuyResult } from './types';

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

// New Helper: Rent vs Buy Calculation
const calculateRentVsBuy = (
    monthlyData: MonthlyData[],
    propertyPrice: number,
    initialUpfrontCash: number, // DownPayment + Fees
    initialRent: number,
    rentIncreaseRate: number, // % per year
    propertyAppreciationRate: number, // % per year
    investmentReturnRate: number, // % per year
    managementFee: number // monthly
): RentVsBuyResult => {
    
    const yearlyData = [];
    let currentPropertyValue = propertyPrice;
    let currentRent = initialRent;
    
    // Rent Scenario Portfolio
    // Starts with the cash you would have used to buy the house
    let rentPortfolio = initialUpfrontCash; 
    
    // Buy Scenario "Extra Savings" Portfolio
    // If Buying is cheaper than Renting in a month, invest the difference
    let buyPortfolio = 0;

    let totalRentPaid = 0;
    let totalBuyUnrecoverableCost = 0; // Interest + Mgmt Fee + Initial Fees (simplified amortized)

    let breakEvenYear: number | null = null;

    // Use monthly data to drive the timeline
    const years = monthlyData[monthlyData.length - 1].year - monthlyData[0].year + 1;
    const startYear = monthlyData[0].year;

    for (let i = 0; i < years; i++) {
        const yearLabel = startYear + i;
        
        // Process 12 months for this year
        for (let m = 1; m <= 12; m++) {
            const globalMonthIndex = i * 12 + (m - 1);
            if (globalMonthIndex >= monthlyData.length) break;

            const monthData = monthlyData[globalMonthIndex];
            
            // 1. Costs Comparison
            // Buy Cost (Cashflow out) = Mortgage Payment + Mgmt Fee
            const buyCashOut = monthData.hMonthlyPayment + managementFee;
            
            // Rent Cost (Cashflow out) = Rent
            const rentCashOut = currentRent;

            // 2. Opportunity Cost Investment
            // We assume the individual has a budget equal to Max(BuyCost, RentCost).
            // The difference is invested into the respective portfolio.
            
            if (buyCashOut > rentCashOut) {
                // Renting is cheaper this month -> Invest the savings
                const savings = buyCashOut - rentCashOut;
                rentPortfolio += savings;
            } else {
                // Buying is cheaper this month -> Invest the savings
                const savings = rentCashOut - buyCashOut;
                buyPortfolio += savings;
            }

            // 3. Investment Growth (Monthly Compounding)
            rentPortfolio *= (1 + (investmentReturnRate / 100 / 12));
            buyPortfolio *= (1 + (investmentReturnRate / 100 / 12));

            // Accumulate Stats
            totalRentPaid += currentRent;
            totalBuyUnrecoverableCost += (monthData.hInterestPayment + managementFee);
        }

        // End of Year Adjustments
        // 1. Property Appreciation
        currentPropertyValue *= (1 + (propertyAppreciationRate / 100));
        
        // 2. Rent Inflation
        currentRent *= (1 + (rentIncreaseRate / 100));

        // 3. Snapshot for Year End
        // Get remaining loan balance at end of this year (from month 12 of this year)
        const yearEndMonthIndex = Math.min((i + 1) * 12 - 1, monthlyData.length - 1);
        const outstandingLoan = monthlyData[yearEndMonthIndex].hRemainingBalance;

        // Net Worth Calculation
        // Buy: (Property Value - Loan) + (Any savings accumulated if mortgage < rent)
        const buyNetWorth = (currentPropertyValue - outstandingLoan) + buyPortfolio;
        
        // Rent: The Investment Portfolio
        const rentNetWorth = rentPortfolio;

        if (breakEvenYear === null && buyNetWorth > rentNetWorth) {
            breakEvenYear = i + 1;
        }

        yearlyData.push({
            year: i + 1,
            buyNetWorth,
            rentNetWorth,
            propertyValue: currentPropertyValue,
            outstandingLoan,
            rentPaidCumulative: totalRentPaid,
            buyCostCumulative: totalBuyUnrecoverableCost // Note: doesn't include initial fees in this running total for simplicity, but net worth does account for them implicitly via starting portfolio
        });
    }

    return {
        enabled: true,
        initialRent,
        rentalYield: (initialRent * 12 / propertyPrice) * 100,
        breakEvenYear,
        finalBuyNetWorth: yearlyData[yearlyData.length - 1].buyNetWorth,
        finalRentNetWorth: yearlyData[yearlyData.length - 1].rentNetWorth,
        yearlyData
    };
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
  mortgageLinkAmount: number,
  // New Props for Partial Repayment
  enablePartialRepayment: boolean,
  partialRepaymentAmount: number,
  partialRepaymentYear: number,
  // New Props for Rent vs Buy
  rvbInitialRent: number,
  rvbRentIncrease: number,
  rvbPropertyAppreciation: number,
  rvbInvestmentReturn: number,
  rvbManagementFee: number
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
    const currentYearNum = month / 12;
    
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

    // --- HANDLE PARTIAL REPAYMENT EVENT ---
    let extraRepaymentThisMonth = 0;
    // Trigger at the end of the selected year (e.g., Year 3 means month 36)
    if (enablePartialRepayment && month === partialRepaymentYear * 12) {
        extraRepaymentThisMonth = partialRepaymentAmount;
    }

    // --- P-PLAN CALCULATION ---
    // Apply Repayment First (if any)
    if (extraRepaymentThisMonth > 0) {
        pBalance -= extraRepaymentThisMonth;
        if (pBalance < 0) pBalance = 0;
    }

    const pPlanRatePercent = Math.max(0, currentPrime - pDiscount);
    const pMonthlyRate = pPlanRatePercent / 100 / 12;

    let pMonthlyPayment = 0;
    if (pBalance <= 0) {
        pMonthlyPayment = 0;
    } else if (pMonthlyRate === 0) {
        pMonthlyPayment = pBalance / remainingMonths;
    } else {
        pMonthlyPayment = (pBalance * pMonthlyRate) / (1 - Math.pow(1 + pMonthlyRate, -remainingMonths));
    }
    // Final month adjustment handled loosely here, exact principal logic below

    const pInterest = pBalance * pMonthlyRate;
    
    // ML Calculation for P-Plan
    let pMLInterest = 0;
    if (enableMortgageLink && pBalance > 0) {
        const effectiveMLBalance = Math.min(mortgageLinkAmount, pBalance * ML_CAP_PERCENT);
        pMLInterest = effectiveMLBalance * pMonthlyRate;
    }
    pTotalMLInterest += pMLInterest;

    let pPrincipal = pMonthlyPayment - pInterest;
    
    // Check if overpaid
    if (pBalance - pPrincipal < 0) {
        pPrincipal = pBalance;
        pMonthlyPayment = pPrincipal + pInterest;
    }

    pBalance -= pPrincipal;
    pTotalInterest += pInterest;
    pTotalPayment += pMonthlyPayment;
    if (extraRepaymentThisMonth > 0) pTotalPayment += extraRepaymentThisMonth; // Add extra payment to total cost

    // --- H-PLAN CALCULATION ---
    // Apply Repayment First
    if (extraRepaymentThisMonth > 0) {
        hBalance -= extraRepaymentThisMonth;
        if (hBalance < 0) hBalance = 0;
    }

    const capRatePercent = Math.max(0, currentPrime - hCapDiscount);
    const hPlanFormulaRate = currentHibor + hSpread;
    const hEffectiveRatePercent = Math.min(hPlanFormulaRate, capRatePercent);
    const isCapTriggered = hPlanFormulaRate >= capRatePercent;
    const hMonthlyRate = hEffectiveRatePercent / 100 / 12;

    let hMonthlyPayment = 0;
    if (hBalance <= 0) {
        hMonthlyPayment = 0;
    } else if (hMonthlyRate === 0) {
        hMonthlyPayment = hBalance / remainingMonths;
    } else {
        hMonthlyPayment = (hBalance * hMonthlyRate) / (1 - Math.pow(1 + hMonthlyRate, -remainingMonths));
    }

    const hInterest = hBalance * hMonthlyRate;

    // ML Calculation for H-Plan
    let hMLInterest = 0;
    if (enableMortgageLink && hBalance > 0) {
        const effectiveMLBalance = Math.min(mortgageLinkAmount, hBalance * ML_CAP_PERCENT);
        hMLInterest = effectiveMLBalance * hMonthlyRate;
    }
    hTotalMLInterest += hMLInterest;

    let hPrincipal = hMonthlyPayment - hInterest;
    
    // Check if overpaid
    if (hBalance - hPrincipal < 0) {
        hPrincipal = hBalance;
        hMonthlyPayment = hPrincipal + hInterest;
    }
    
    hBalance -= hPrincipal;
    hTotalInterest += hInterest;
    hTotalPayment += hMonthlyPayment;
    if (extraRepaymentThisMonth > 0) hTotalPayment += extraRepaymentThisMonth; // Add extra payment to total cost

    // Min/Max tracking (exclude 0 payments after early finish)
    if (hMonthlyPayment > 0) {
        if (hMonthlyPayment > hMaxPayment) hMaxPayment = hMonthlyPayment;
        if (hMonthlyPayment < hMinPayment) hMinPayment = hMonthlyPayment;
    }

    // --- FIXED PLAN CALCULATION ---
    if (extraRepaymentThisMonth > 0) {
        fBalance -= extraRepaymentThisMonth;
        if (fBalance < 0) fBalance = 0;
    }

    let fEffectiveRatePercent = 0;
    if (enableFixedPlan && yearIndex < fixedLockPeriod) {
        fEffectiveRatePercent = fixedRate;
    } else {
        fEffectiveRatePercent = pPlanRatePercent;
    }

    let fMonthlyPayment = 0;
    let fInterest = 0;
    let fPrincipal = 0;

    if (enableFixedPlan) {
        const fMonthlyRate = fEffectiveRatePercent / 100 / 12;
        if (fBalance <= 0) {
            fMonthlyPayment = 0;
        } else if (fMonthlyRate === 0) {
            fMonthlyPayment = fBalance / remainingMonths;
        } else {
            fMonthlyPayment = (fBalance * fMonthlyRate) / (1 - Math.pow(1 + fMonthlyRate, -remainingMonths));
        }

        fInterest = fBalance * fMonthlyRate;
        fPrincipal = fMonthlyPayment - fInterest;
        
        if (fBalance - fPrincipal < 0) {
            fPrincipal = fBalance;
            fMonthlyPayment = fPrincipal + fInterest;
        }

        fBalance -= fPrincipal;
        fTotalInterest += fInterest;
        fTotalPayment += fMonthlyPayment;
        if (extraRepaymentThisMonth > 0) fTotalPayment += extraRepaymentThisMonth;
        
        if (fMonthlyPayment > 0) {
            if (fMonthlyPayment > fMaxPayment) fMaxPayment = fMonthlyPayment;
            if (fMonthlyPayment < fMinPayment) fMinPayment = fMonthlyPayment;
        }
    }

    // --- REFINANCE CALCULATION ---
    // If partial repayment happened, balance is lower, so rebate will be lower.
    // We use H-Plan balance for simulation.
    if (enableRefinance && month % 24 === 0 && month < totalMonths) {
       const currentBalance = hBalance; 
       
       const rebateAmount = currentBalance * (refinanceRebatePercent / 100);
       const legalFee = BASELINE_2026.REFINANCE_LEGAL_FEE_ESTIMATE;
       
       if (currentBalance > 0 && rebateAmount > legalFee) {
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
      
      // Track extra repayment
      extraRepayment: extraRepaymentThisMonth > 0 ? extraRepaymentThisMonth : undefined
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
    minPayment: Math.min(...monthlyData.map(m => m.pMonthlyPayment > 0 ? m.pMonthlyPayment : Number.MAX_VALUE)),
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

  // --- STRESS TEST CALCULATION (Simplified: based on original loan amount) ---
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

  // --- RENT VS BUY CALCULATION ---
  const rentVsBuyResult = calculateRentVsBuy(
      monthlyData,
      propertyPrice,
      totalUpfrontCash,
      rvbInitialRent,
      rvbRentIncrease,
      rvbPropertyAppreciation,
      rvbInvestmentReturn,
      rvbManagementFee
  );

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
    },
    partialRepayment: {
        enabled: enablePartialRepayment,
        amount: partialRepaymentAmount,
        year: partialRepaymentYear
    },
    rentVsBuy: rentVsBuyResult
  };
};

export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('zh-HK', { style: 'currency', currency: 'HKD', maximumFractionDigits: 0 }).format(val);
};

export const formatPercent = (val: number) => {
  return `${val.toFixed(2)}%`;
};