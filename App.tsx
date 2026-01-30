import React, { useState, useEffect } from 'react';
import InputForm from './components/InputForm';
import SummaryCards from './components/SummaryCards';
import MortgageCharts from './components/MortgageCharts';
import RentVsBuyCharts from './components/RentVsBuyCharts';
import AmortizationTable from './components/AmortizationTable';
import TermsModal from './components/TermsModal';
import { calculateMortgage } from './utils';
import { SimulationResult, ViewMode, SimulationMode } from './types';

const App: React.FC = () => {
  // Replace direct loanAmount state with Property Price and Down Payment
  const [propertyPrice, setPropertyPrice] = useState<number>(7000000);
  const [downPayment, setDownPayment] = useState<number>(2000000);
  
  // Derived loan amount (cannot be negative)
  const loanAmount = Math.max(0, propertyPrice - downPayment);

  const [tenureYears, setTenureYears] = useState<number>(30);
  
  // New State for Custom Rates
  const [simulationMode, setSimulationMode] = useState<SimulationMode>(SimulationMode.Historical);
  const [customPrime, setCustomPrime] = useState<number>(5.375);
  const [customHibor, setCustomHibor] = useState<number>(3.5);

  // Bank Plan Settings
  const [pDiscount, setPDiscount] = useState<number>(1.75); // P - 1.75%
  const [hSpread, setHSpread] = useState<number>(1.3);    // H + 1.3%
  const [hCapDiscount, setHCapDiscount] = useState<number>(1.75); // Cap at P - 1.75%

  // Fixed Plan Settings
  const [enableFixedPlan, setEnableFixedPlan] = useState<boolean>(false);
  const [fixedRate, setFixedRate] = useState<number>(4.5);
  const [fixedLockPeriod, setFixedLockPeriod] = useState<number>(3);

  // Refinance Settings
  const [enableRefinance, setEnableRefinance] = useState<boolean>(false);
  const [refinanceRebatePercent, setRefinanceRebatePercent] = useState<number>(1.5);

  // Mortgage Link Settings
  const [enableMortgageLink, setEnableMortgageLink] = useState<boolean>(false);
  const [mortgageLinkAmount, setMortgageLinkAmount] = useState<number>(500000);

  // Partial Repayment Settings
  const [enablePartialRepayment, setEnablePartialRepayment] = useState<boolean>(false);
  const [partialRepaymentAmount, setPartialRepaymentAmount] = useState<number>(500000);
  const [partialRepaymentYear, setPartialRepaymentYear] = useState<number>(3);

  // Rent vs Buy Settings
  const [rvbInitialRent, setRvbInitialRent] = useState<number>(18000);
  const [rvbRentIncrease, setRvbRentIncrease] = useState<number>(2.0); // 2% annual increase
  const [rvbPropertyAppreciation, setRvbPropertyAppreciation] = useState<number>(3.0); // 3% annual
  const [rvbInvestmentReturn, setRvbInvestmentReturn] = useState<number>(5.0); // 5% annual
  const [rvbManagementFee, setRvbManagementFee] = useState<number>(1500);

  const [result, setResult] = useState<SimulationResult | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Summary);

  // Default to true to force popup on load
  const [showTerms, setShowTerms] = useState<boolean>(true);

  const handleSimulate = () => {
    if (!loanAmount || !tenureYears) return;
    const calcResult = calculateMortgage(
      loanAmount, 
      tenureYears,
      simulationMode,
      customPrime,
      customHibor,
      pDiscount,
      hSpread,
      hCapDiscount,
      propertyPrice,
      downPayment,
      enableRefinance,
      refinanceRebatePercent,
      enableFixedPlan,
      fixedRate,
      fixedLockPeriod,
      enableMortgageLink,
      mortgageLinkAmount,
      enablePartialRepayment,
      partialRepaymentAmount,
      partialRepaymentYear,
      rvbInitialRent,
      rvbRentIncrease,
      rvbPropertyAppreciation,
      rvbInvestmentReturn,
      rvbManagementFee
    );
    setResult(calcResult);
  };

  // Run simulation on mount
  useEffect(() => {
    handleSimulate();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen pb-12 bg-[#f8fafc] text-slate-800">
      <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
      
      {/* Glass Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 border-b border-slate-200/60 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 group cursor-default">
             <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center shadow-indigo-200 shadow-lg group-hover:scale-105 transition-transform">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                 <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
               </svg>
             </div>
             <div>
               <h1 className="text-lg font-bold text-slate-800 tracking-tight leading-tight">香港按揭 <span className="text-indigo-600">2026</span></h1>
               <div className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Mortgage Simulator</div>
             </div>
          </div>
          <div className="hidden sm:block">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
              v1.0.0
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Sticky Input Form */}
          <div className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-24 transition-all duration-300">
             <InputForm 
               propertyPrice={propertyPrice}
               setPropertyPrice={setPropertyPrice}
               downPayment={downPayment}
               setDownPayment={setDownPayment}
               loanAmount={loanAmount}
               tenureYears={tenureYears}
               setTenureYears={setTenureYears}
               simulationMode={simulationMode}
               setSimulationMode={setSimulationMode}
               customPrime={customPrime}
               setCustomPrime={setCustomPrime}
               customHibor={customHibor}
               setCustomHibor={setCustomHibor}
               pDiscount={pDiscount}
               setPDiscount={setPDiscount}
               hSpread={hSpread}
               setHSpread={setHSpread}
               hCapDiscount={hCapDiscount}
               setHCapDiscount={setHCapDiscount}
               enableRefinance={enableRefinance}
               setEnableRefinance={setEnableRefinance}
               refinanceRebatePercent={refinanceRebatePercent}
               setRefinanceRebatePercent={setRefinanceRebatePercent}
               enableFixedPlan={enableFixedPlan}
               setEnableFixedPlan={setEnableFixedPlan}
               fixedRate={fixedRate}
               setFixedRate={setFixedRate}
               fixedLockPeriod={fixedLockPeriod}
               setFixedLockPeriod={setFixedLockPeriod}
               enableMortgageLink={enableMortgageLink}
               setEnableMortgageLink={setEnableMortgageLink}
               mortgageLinkAmount={mortgageLinkAmount}
               setMortgageLinkAmount={setMortgageLinkAmount}
               enablePartialRepayment={enablePartialRepayment}
               setEnablePartialRepayment={setEnablePartialRepayment}
               partialRepaymentAmount={partialRepaymentAmount}
               setPartialRepaymentAmount={setPartialRepaymentAmount}
               partialRepaymentYear={partialRepaymentYear}
               setPartialRepaymentYear={setPartialRepaymentYear}
               // RVB
               rvbInitialRent={rvbInitialRent}
               setRvbInitialRent={setRvbInitialRent}
               rvbRentIncrease={rvbRentIncrease}
               setRvbRentIncrease={setRvbRentIncrease}
               rvbPropertyAppreciation={rvbPropertyAppreciation}
               setRvbPropertyAppreciation={setRvbPropertyAppreciation}
               rvbInvestmentReturn={rvbInvestmentReturn}
               setRvbInvestmentReturn={setRvbInvestmentReturn}
               rvbManagementFee={rvbManagementFee}
               setRvbManagementFee={setRvbManagementFee}
               onSimulate={handleSimulate}
               onOpenTerms={() => setShowTerms(true)}
             />
             
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-6">
            {result ? (
              <div className="animate-fade-in-up space-y-6">
                
                {/* Dashboard Toolbar */}
                <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center border-b border-slate-200 pb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">模擬分析結果</h2>
                    <p className="text-sm text-slate-500 mt-1">基於 {result.simulationMode === SimulationMode.Historical ? '30年歷史週期' : '固定利率'} 假設推算</p>
                  </div>
                  
                  <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm mt-4 sm:mt-0">
                    <button
                      onClick={() => setViewMode(ViewMode.Summary)}
                      className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all ${viewMode === ViewMode.Summary ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                      </svg>
                      圖表概覽
                    </button>
                    <button
                      onClick={() => setViewMode(ViewMode.RentVsBuy)}
                      className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all ${viewMode === ViewMode.RentVsBuy ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                      </svg>
                      租買比較
                    </button>
                    <button
                      onClick={() => setViewMode(ViewMode.Schedule)}
                      className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all ${viewMode === ViewMode.Schedule ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clipRule="evenodd" />
                      </svg>
                      供款明細
                    </button>
                  </div>
                </div>

                {/* Conditional View Rendering */}
                {viewMode === ViewMode.Summary && (
                   <>
                    <SummaryCards result={result} />
                    <MortgageCharts data={result.monthlyData} />
                   </>
                )}

                {viewMode === ViewMode.RentVsBuy && (
                    <RentVsBuyCharts data={result.rentVsBuy} />
                )}

                {viewMode === ViewMode.Schedule && (
                   <AmortizationTable data={result.monthlyData} />
                )}
                
              </div>
            ) : (
               <div className="h-96 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                 <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                 </div>
                 <p className="font-medium text-slate-500">請在左側輸入資料開始模擬</p>
                 <p className="text-xs text-slate-400 mt-1">支援歷史週期與固定利率分析</p>
               </div>
            )}
            
             {/* Mobile Disclaimer */}
             <div className="block lg:hidden mt-8 pt-8 border-t border-slate-200 text-slate-400 text-[11px] leading-relaxed">
                <button 
                  onClick={() => setShowTerms(true)}
                  className="font-bold text-slate-500 mb-2 hover:text-indigo-600 transition-colors underline"
                >
                  免責聲明及使用條款
                </button>
                <div>本工具僅供參考。銀行批核結果以「貸款確認書」為準。使用前請詳閱條款。</div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;