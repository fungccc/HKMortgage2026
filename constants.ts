export const BASELINE_2026 = {
  START_YEAR: 2026,
  // Removed static PRIME_RATE, will use getPrimeRateForYear
  PLAN_SPREAD: 1.3, // H + 1.3%
  CAP_SPREAD: 1.75, // P - 1.75%
  CASH_REBATE_PERCENT: 1.5,
  AGENCY_FEE_PERCENT: 1.0, // 1% Commission
  LEGAL_FEE_ESTIMATE: 15000, // Approx legal fee
  REFINANCE_LEGAL_FEE_ESTIMATE: 4500, // Cheaper legal fee for refinancing
};

// HK Stamp Duty (AVD - Scale 2) as of 2024 Budget
// [Threshold, Fee/Rate]
// Rate type: 0 = fixed amount, 1 = percentage
export const STAMP_DUTY_TIERS = [
  { limit: 3000000, fee: 100, type: 0 },
  { limit: 3528240, fee: 1.5, type: 1 }, // Special formula usually applies in transition, simplifying to standard brackets for simulation
  { limit: 4500000, fee: 1.5, type: 1 },
  { limit: 6000000, fee: 2.25, type: 1 },
  { limit: 9000000, fee: 3.0, type: 1 },
  { limit: 20000000, fee: 3.75, type: 1 },
  { limit: Infinity, fee: 4.25, type: 1 },
];

// 模擬 30 年經濟週期 (參照香港 1996-2026 歷史走勢的特徵)
// 包含：高息震盪期、低息量寬期、利率正常化期
interface MarketCondition {
  prime: number; // Big P
  hibor: number; // 1M Hibor
  desc: string;
}

export const MARKET_CYCLES: Record<number, MarketCondition> = {
  // 第 1-5 年: 利率回落期 (模擬由現時高位回落)
  0: { prime: 5.25, hibor: 2.5, desc: "利率回落" },
  1: { prime: 5.00, hibor: 1.8, desc: "溫和復甦" },
  2: { prime: 5.00, hibor: 1.2, desc: "資金充裕" },
  3: { prime: 5.00, hibor: 1.0, desc: "資金充裕" },
  4: { prime: 5.00, hibor: 0.8, desc: "低息環境" }, // H按優勢極大

  // 第 6-10 年: 超低息時代 (類似 2010-2015)
  5: { prime: 5.00, hibor: 0.25, desc: "量化寬鬆" },
  6: { prime: 5.00, hibor: 0.3, desc: "量化寬鬆" },
  7: { prime: 5.00, hibor: 0.4, desc: "量化寬鬆" },
  8: { prime: 5.125, hibor: 0.8, desc: "輕微調整" },
  9: { prime: 5.25, hibor: 1.5, desc: "溫和通脹" },

  // 第 11-15 年: 加息週期 (類似 2022-2024)
  10: { prime: 5.50, hibor: 2.8, desc: "加息初期" },
  11: { prime: 6.00, hibor: 3.8, desc: "顯著加息" },
  12: { prime: 7.50, hibor: 5.5, desc: "高通脹壓抑" }, // Cap Triggered
  13: { prime: 7.00, hibor: 4.8, desc: "高位橫行" },
  14: { prime: 6.25, hibor: 3.5, desc: "高位回落" },

  // 第 16-20 年: 經濟波動 / 危機模擬 (類似 1997)
  15: { prime: 8.00, hibor: 6.5, desc: "金融波動" },
  16: { prime: 9.00, hibor: 8.0, desc: "流動性緊張" }, // P按與H按皆昂貴
  17: { prime: 7.00, hibor: 5.0, desc: "危機緩解" },
  18: { prime: 6.00, hibor: 3.0, desc: "經濟修復" },
  19: { prime: 5.50, hibor: 2.0, desc: "回復平穩" },

  // 第 21-30 年: 長期平穩區間
  20: { prime: 5.25, hibor: 1.5, desc: "新常態" },
};

export const getMarketDataForYear = (yearIndex: number): MarketCondition => {
  // If year is defined in cycle, use it
  if (MARKET_CYCLES[yearIndex]) {
    return MARKET_CYCLES[yearIndex];
  }
  
  // Default fallback for > 20 years (Assume Stable)
  const cycleKey = Math.min(yearIndex, 20); 
  return MARKET_CYCLES[cycleKey] || { prime: 5.375, hibor: 2.8, desc: "平穩期" };
};