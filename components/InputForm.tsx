import React, { useState } from 'react';
import { BASELINE_2026 } from '../constants';
import { SimulationMode } from '../types';
import { formatCurrency } from '../utils';

interface InputFormProps {
  propertyPrice: number;
  setPropertyPrice: (val: number) => void;
  downPayment: number;
  setDownPayment: (val: number) => void;
  loanAmount: number; // Derived
  tenureYears: number;
  setTenureYears: (val: number) => void;
  simulationMode: SimulationMode;
  setSimulationMode: (mode: SimulationMode) => void;
  customPrime: number;
  setCustomPrime: (val: number) => void;
  customHibor: number;
  setCustomHibor: (val: number) => void;
  pDiscount: number;
  setPDiscount: (val: number) => void;
  hSpread: number;
  setHSpread: (val: number) => void;
  hCapDiscount: number;
  setHCapDiscount: (val: number) => void;
  // Fixed Plan Props
  enableFixedPlan: boolean;
  setEnableFixedPlan: (val: boolean) => void;
  fixedRate: number;
  setFixedRate: (val: number) => void;
  fixedLockPeriod: number;
  setFixedLockPeriod: (val: number) => void;
  // Refinance Props
  enableRefinance: boolean;
  setEnableRefinance: (val: boolean) => void;
  refinanceRebatePercent: number;
  setRefinanceRebatePercent: (val: number) => void;
  // Mortgage Link Props
  enableMortgageLink: boolean;
  setEnableMortgageLink: (val: boolean) => void;
  mortgageLinkAmount: number;
  setMortgageLinkAmount: (val: number) => void;
  // Partial Repayment Props
  enablePartialRepayment: boolean;
  setEnablePartialRepayment: (val: boolean) => void;
  partialRepaymentAmount: number;
  setPartialRepaymentAmount: (val: number) => void;
  partialRepaymentYear: number;
  setPartialRepaymentYear: (val: number) => void;
  // Rent vs Buy Props
  rvbInitialRent: number;
  setRvbInitialRent: (val: number) => void;
  rvbRentIncrease: number;
  setRvbRentIncrease: (val: number) => void;
  rvbPropertyAppreciation: number;
  setRvbPropertyAppreciation: (val: number) => void;
  rvbInvestmentReturn: number;
  setRvbInvestmentReturn: (val: number) => void;
  rvbManagementFee: number;
  setRvbManagementFee: (val: number) => void;
  
  onSimulate: () => void;
  onOpenTerms?: () => void;
}

// Helper Component for Accordion Sections
const FormSection: React.FC<{
  title: string;
  step: number;
  isOpen: boolean;
  onToggle: () => void;
  summary?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, step, isOpen, onToggle, summary, children }) => {
  return (
    <div className={`border border-slate-200 rounded-xl overflow-hidden transition-all duration-300 ${isOpen ? 'shadow-md bg-white ring-1 ring-indigo-50/50' : 'bg-white hover:bg-slate-50'}`}>
      <button 
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left focus:outline-none"
      >
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${isOpen ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
            {step}
          </div>
          <div className="flex flex-col">
            <span className={`text-sm font-bold ${isOpen ? 'text-slate-800' : 'text-slate-600'}`}>{title}</span>
            {!isOpen && summary && <div className="text-xs text-slate-400 mt-0.5">{summary}</div>}
          </div>
        </div>
        <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
           </svg>
        </div>
      </button>
      
      <div 
        className={`transition-[max-height,opacity] duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="p-4 pt-0 border-t border-slate-100/50">
          <div className="pt-4 space-y-5">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

const InputForm: React.FC<InputFormProps> = ({
  propertyPrice,
  setPropertyPrice,
  downPayment,
  setDownPayment,
  loanAmount,
  tenureYears,
  setTenureYears,
  simulationMode,
  setSimulationMode,
  customPrime,
  setCustomPrime,
  customHibor,
  setCustomHibor,
  pDiscount,
  setPDiscount,
  hSpread,
  setHSpread,
  hCapDiscount,
  setHCapDiscount,
  enableFixedPlan,
  setEnableFixedPlan,
  fixedRate,
  setFixedRate,
  fixedLockPeriod,
  setFixedLockPeriod,
  enableRefinance,
  setEnableRefinance,
  refinanceRebatePercent,
  setRefinanceRebatePercent,
  enableMortgageLink,
  setEnableMortgageLink,
  mortgageLinkAmount,
  setMortgageLinkAmount,
  enablePartialRepayment,
  setEnablePartialRepayment,
  partialRepaymentAmount,
  setPartialRepaymentAmount,
  partialRepaymentYear,
  setPartialRepaymentYear,
  rvbInitialRent,
  setRvbInitialRent,
  rvbRentIncrease,
  setRvbRentIncrease,
  rvbPropertyAppreciation,
  setRvbPropertyAppreciation,
  rvbInvestmentReturn,
  setRvbInvestmentReturn,
  rvbManagementFee,
  setRvbManagementFee,
  onSimulate,
  onOpenTerms,
}) => {
  // State for Accordion
  const [openSection, setOpenSection] = useState<number>(1);
  const toggleSection = (section: number) => setOpenSection(openSection === section ? 0 : section);

  const ltvPercent = propertyPrice > 0 ? (loanAmount / propertyPrice) * 100 : 0;

  const handleLtvChange = (newLtv: number) => {
      const newLoanAmount = propertyPrice * (newLtv / 100);
      const newDownPayment = propertyPrice - newLoanAmount;
      setDownPayment(Math.round(newDownPayment));
  };

  return (
    <div className="space-y-3">
      
      {/* 1. Mortgage Setup */}
      <FormSection 
        title="按揭基本設定" 
        step={1} 
        isOpen={openSection === 1} 
        onToggle={() => toggleSection(1)}
        summary={`${formatCurrency(loanAmount)} / ${tenureYears}年`}
      >
          {/* Property Price */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">物業價值</label>
            <div className="relative rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-slate-400 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                value={propertyPrice || ''}
                onChange={(e) => setPropertyPrice(parseFloat(e.target.value))}
                className="block w-full rounded-lg border-slate-300 py-2.5 pl-7 pr-12 focus:border-indigo-500 focus:ring-indigo-500 text-slate-800 font-semibold border"
                placeholder="7,000,000"
              />
            </div>
          </div>

          {/* Down Payment & LTV Slider */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase">首期金額</label>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ltvPercent > 90 ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
                    按揭成數: {ltvPercent.toFixed(1)}%
                </span>
            </div>
            
            <div className="relative rounded-md shadow-sm mb-3">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-slate-400 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                value={downPayment || ''}
                onChange={(e) => setDownPayment(parseFloat(e.target.value))}
                className="block w-full rounded-lg border-slate-300 py-2.5 pl-7 pr-12 focus:border-indigo-500 focus:ring-indigo-500 text-slate-800 font-semibold border"
                placeholder="2,000,000"
              />
            </div>

            {/* Interactive LTV Slider */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={ltvPercent}
                    onChange={(e) => handleLtvChange(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 mb-2 block"
                />
                <div className="relative h-4 w-full text-[10px] text-slate-400 font-medium">
                    <button onClick={() => handleLtvChange(40)} className="absolute -translate-x-1/2 hover:text-indigo-600 transition-colors" style={{ left: '40%' }}>4成</button>
                    <button onClick={() => handleLtvChange(50)} className="absolute -translate-x-1/2 hover:text-indigo-600 transition-colors" style={{ left: '50%' }}>5成</button>
                    <button onClick={() => handleLtvChange(60)} className="absolute -translate-x-1/2 hover:text-indigo-600 transition-colors" style={{ left: '60%' }}>6成</button>
                    <button onClick={() => handleLtvChange(70)} className="absolute -translate-x-1/2 hover:text-indigo-600 transition-colors" style={{ left: '70%' }}>7成</button>
                    <button onClick={() => handleLtvChange(80)} className="absolute -translate-x-1/2 hover:text-indigo-600 transition-colors" style={{ left: '80%' }}>8成</button>
                    <button onClick={() => handleLtvChange(90)} className="absolute -translate-x-1/2 hover:text-indigo-600 transition-colors" style={{ left: '90%' }}>9成</button>
                </div>
            </div>
          </div>

          {/* Loan Amount Display */}
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex justify-between items-center">
             <span className="text-xs text-slate-500 font-bold uppercase">貸款額</span>
             <span className={`text-lg font-bold ${loanAmount > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>
                {formatCurrency(loanAmount)}
             </span>
          </div>

          {/* Tenure */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
               <label className="block text-xs font-bold text-slate-500 uppercase">還款年期</label>
               <span className="font-bold text-indigo-600 text-sm">{tenureYears} 年</span>
            </div>
            <input
              type="range"
              min="5"
              max="30"
              step="1"
              value={tenureYears}
              onChange={(e) => setTenureYears(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>
      </FormSection>

      {/* 2. Rate Environment */}
      <FormSection 
        title="利率環境與計劃" 
        step={2} 
        isOpen={openSection === 2} 
        onToggle={() => toggleSection(2)}
        summary={simulationMode === SimulationMode.Historical ? "歷史週期模擬" : `自訂 (H=${customHibor}%, P=${customPrime}%)`}
      >
        {/* Mode Toggle */}
        <div className="bg-slate-100 p-1 rounded-lg flex mb-4">
          <button
            onClick={() => setSimulationMode(SimulationMode.Historical)}
            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
              simulationMode === SimulationMode.Historical
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            歷史週期
          </button>
          <button
            onClick={() => setSimulationMode(SimulationMode.Custom)}
            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
              simulationMode === SimulationMode.Custom
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            自訂固定
          </button>
        </div>
        
        {/* Bank Plan Terms */}
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-3">
            <div className="flex justify-between items-center">
                 <h3 className="text-[10px] font-bold text-slate-500 uppercase">銀行計劃 (Bank Offer)</h3>
                 <span className="text-[10px] text-slate-400">P按 = P - {pDiscount}%</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                   <label className="block text-[10px] font-medium text-slate-500 mb-1">H按息差 (Spread)</label>
                   <div className="relative rounded-md shadow-sm">
                      <input
                        type="number"
                        step="0.1"
                        value={hSpread}
                        onChange={(e) => setHSpread(parseFloat(e.target.value))}
                        className="block w-full rounded border-slate-300 py-1 px-2 focus:border-indigo-500 focus:ring-indigo-500 text-sm border"
                      />
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                         <span className="text-slate-400 text-xs">%</span>
                      </div>
                   </div>
                </div>
                 <div>
                   <label className="block text-[10px] font-medium text-slate-500 mb-1">封頂位折扣 (Cap)</label>
                   <div className="relative rounded-md shadow-sm">
                      <input
                        type="number"
                        step="0.05"
                        value={hCapDiscount}
                        onChange={(e) => setHCapDiscount(parseFloat(e.target.value))}
                        className="block w-full rounded border-slate-300 py-1 px-2 focus:border-indigo-500 focus:ring-indigo-500 text-sm border"
                      />
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                         <span className="text-slate-400 text-xs">%</span>
                      </div>
                   </div>
                </div>
            </div>
        </div>

        {/* Fixed Plan Toggle */}
        <div className="border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between mb-2">
                 <label htmlFor="enableFixedPlan" className="text-sm font-medium text-slate-700">定息計劃 (Fixed Plan)</label>
                 <div className="relative inline-block w-10 h-5 align-middle select-none transition duration-200 ease-in">
                    <input type="checkbox" name="enableFixedPlan" id="enableFixedPlan" checked={enableFixedPlan} onChange={(e) => setEnableFixedPlan(e.target.checked)} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-slate-300 checked:right-0 checked:border-indigo-600"/>
                    <label htmlFor="enableFixedPlan" className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${enableFixedPlan ? 'bg-indigo-600' : 'bg-slate-300'}`}></label>
                </div>
            </div>

            {enableFixedPlan && (
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-100 grid grid-cols-2 gap-3 animate-fade-in-up">
                    <div>
                       <label className="block text-[10px] font-medium text-purple-800 mb-1">定息利率 (%)</label>
                       <input
                        type="number"
                        step="0.1"
                        value={fixedRate}
                        onChange={(e) => setFixedRate(parseFloat(e.target.value))}
                        className="block w-full rounded border-purple-200 py-1 px-2 text-sm border focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div>
                       <label className="block text-[10px] font-medium text-purple-800 mb-1">鎖定期 (年)</label>
                       <input
                        type="number"
                        min="1"
                        max="10"
                        value={fixedLockPeriod}
                        onChange={(e) => setFixedLockPeriod(parseFloat(e.target.value))}
                        className="block w-full rounded border-purple-200 py-1 px-2 text-sm border focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                </div>
            )}
        </div>

        {simulationMode === SimulationMode.Custom && (
          <div className="bg-white rounded-lg p-3 border border-slate-200 grid grid-cols-2 gap-3 mt-3 animate-fade-in-up">
             <div>
               <label className="block text-[10px] font-medium text-slate-500 mb-1">自訂 Prime (%)</label>
               <input type="number" step="0.125" value={customPrime} onChange={(e) => setCustomPrime(parseFloat(e.target.value))} className="w-full text-sm border-slate-300 rounded border py-1 px-2"/>
             </div>
             <div>
               <label className="block text-[10px] font-medium text-slate-500 mb-1">自訂 HIBOR (%)</label>
               <input type="number" step="0.1" value={customHibor} onChange={(e) => setCustomHibor(parseFloat(e.target.value))} className="w-full text-sm border-slate-300 rounded border py-1 px-2"/>
             </div>
          </div>
        )}
      </FormSection>

      {/* 3. Mortgage Link */}
      <FormSection 
        title="Mortgage Link" 
        step={3} 
        isOpen={openSection === 3} 
        onToggle={() => toggleSection(3)}
        summary={enableMortgageLink ? `已啟用 (${formatCurrency(mortgageLinkAmount)})` : "未啟用"}
      >
         <div className="flex items-center justify-between mb-3">
             <div className="flex flex-col">
                 <label htmlFor="enableMortgageLink" className="text-sm font-medium text-slate-700">高息存款掛鈎</label>
                 <span className="text-[10px] text-slate-400">存款享按揭利率，抵銷利息支出</span>
             </div>
             <div className="relative inline-block w-10 h-5 align-middle select-none transition duration-200 ease-in">
                <input type="checkbox" name="enableMortgageLink" id="enableMortgageLink" checked={enableMortgageLink} onChange={(e) => setEnableMortgageLink(e.target.checked)} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-slate-300 checked:right-0 checked:border-cyan-600"/>
                <label htmlFor="enableMortgageLink" className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${enableMortgageLink ? 'bg-cyan-600' : 'bg-slate-300'}`}></label>
            </div>
         </div>
         
         {enableMortgageLink && (
            <div className="animate-fade-in-up">
                 <div className="flex items-center mb-1">
                    <label className="block text-xs font-medium text-slate-600 mr-2">預計存款金額</label>
                     <div className="group relative">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-slate-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 pointer-events-none text-center">
                            上限通常為剩餘按揭餘額的 50%。
                        </div>
                    </div>
                 </div>
                 <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                     <span className="text-slate-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    value={mortgageLinkAmount}
                    onChange={(e) => setMortgageLinkAmount(parseFloat(e.target.value))}
                    className="block w-full rounded-lg border-slate-300 py-2 pl-7 pr-4 focus:border-cyan-500 focus:ring-cyan-500 text-sm border"
                  />
                </div>
            </div>
         )}
      </FormSection>

      {/* 4. Refinance Strategy */}
      <FormSection 
        title="轉按策略 (Refinance)" 
        step={4} 
        isOpen={openSection === 4} 
        onToggle={() => toggleSection(4)}
        summary={enableRefinance ? `已啟用 (每2年)` : "未啟用"}
      >
        <div className="flex items-center justify-between mb-3">
             <div className="flex flex-col">
                 <label htmlFor="enableRefinance" className="text-sm font-medium text-slate-700">模擬每2年轉按</label>
                 <span className="text-[10px] text-slate-400">賺取現金回贈 (扣除律師費)</span>
             </div>
             <div className="relative inline-block w-10 h-5 align-middle select-none transition duration-200 ease-in">
                <input type="checkbox" name="enableRefinance" id="enableRefinance" checked={enableRefinance} onChange={(e) => setEnableRefinance(e.target.checked)} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-slate-300 checked:right-0 checked:border-emerald-600"/>
                <label htmlFor="enableRefinance" className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${enableRefinance ? 'bg-emerald-600' : 'bg-slate-300'}`}></label>
            </div>
        </div>

        {enableRefinance && (
            <div className="animate-fade-in-up">
                 <label className="block text-xs font-medium text-slate-600 mb-1">預計轉按回贈 %</label>
                 <div className="relative rounded-md shadow-sm">
                  <input
                    type="number"
                    step="0.1"
                    value={refinanceRebatePercent}
                    onChange={(e) => setRefinanceRebatePercent(parseFloat(e.target.value))}
                    className="block w-full rounded-lg border-slate-300 py-2 pl-3 pr-8 focus:border-emerald-500 focus:ring-emerald-500 text-sm border"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-slate-500 text-xs">%</span>
                  </div>
                </div>
            </div>
        )}
      </FormSection>

      {/* 5. Partial Repayment */}
      <FormSection 
        title="提前還款 (Partial Repayment)" 
        step={5} 
        isOpen={openSection === 5} 
        onToggle={() => toggleSection(5)}
        summary={enablePartialRepayment ? `第${partialRepaymentYear}年還 ${formatCurrency(partialRepaymentAmount)}` : "未啟用"}
      >
        <div className="flex items-center justify-between mb-3">
             <div className="flex flex-col">
                 <label htmlFor="enablePartialRepayment" className="text-sm font-medium text-slate-700">模擬提前部分還款</label>
                 <span className="text-[10px] text-slate-400">一筆過還款以節省利息</span>
             </div>
             <div className="relative inline-block w-10 h-5 align-middle select-none transition duration-200 ease-in">
                <input type="checkbox" name="enablePartialRepayment" id="enablePartialRepayment" checked={enablePartialRepayment} onChange={(e) => setEnablePartialRepayment(e.target.checked)} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-slate-300 checked:right-0 checked:border-orange-500"/>
                <label htmlFor="enablePartialRepayment" className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${enablePartialRepayment ? 'bg-orange-500' : 'bg-slate-300'}`}></label>
            </div>
        </div>

        {enablePartialRepayment && (
            <div className="space-y-4 animate-fade-in-up">
                 {/* Amount */}
                 <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">還款金額</label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="text-slate-400 sm:text-sm">$</span>
                      </div>
                      <input
                        type="number"
                        value={partialRepaymentAmount}
                        onChange={(e) => setPartialRepaymentAmount(parseFloat(e.target.value))}
                        className="block w-full rounded-lg border-slate-300 py-2 pl-7 pr-4 focus:border-orange-500 focus:ring-orange-500 text-sm border"
                      />
                    </div>
                 </div>

                 {/* Timing */}
                 <div>
                    <div className="flex justify-between items-center mb-1">
                       <label className="block text-xs font-medium text-slate-600">於第幾年年底進行？</label>
                       <span className="font-bold text-orange-600 text-sm">第 {partialRepaymentYear} 年</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max={Math.max(1, tenureYears - 1)}
                      step="1"
                      value={partialRepaymentYear}
                      onChange={(e) => setPartialRepaymentYear(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                 </div>
            </div>
        )}
      </FormSection>

      {/* 6. Rent vs Buy */}
      <FormSection 
        title="租樓 vs 買樓 (Rent vs Buy)" 
        step={6} 
        isOpen={openSection === 6} 
        onToggle={() => toggleSection(6)}
        summary={`月租 ${formatCurrency(rvbInitialRent)} (假設)`}
      >
         <div className="space-y-4">
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">相若單位月租</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-slate-400 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    value={rvbInitialRent}
                    onChange={(e) => setRvbInitialRent(parseFloat(e.target.value))}
                    className="block w-full rounded-lg border-slate-300 py-2 pl-7 pr-12 focus:border-indigo-500 focus:ring-indigo-500 text-slate-800 font-semibold border"
                  />
                </div>
                <div className="text-[10px] text-slate-400 mt-1">租金回報率: {((rvbInitialRent * 12 / propertyPrice) * 100).toFixed(2)}%</div>
             </div>
             
             <div className="grid grid-cols-2 gap-3">
                <div>
                   <label className="block text-[10px] font-medium text-slate-500 mb-1">預計租金升幅 (%/年)</label>
                   <input
                    type="number"
                    step="0.1"
                    value={rvbRentIncrease}
                    onChange={(e) => setRvbRentIncrease(parseFloat(e.target.value))}
                    className="block w-full rounded border-slate-300 py-1 px-2 text-sm border"
                  />
                </div>
                <div>
                   <label className="block text-[10px] font-medium text-slate-500 mb-1">管理費 ($/月)</label>
                   <input
                    type="number"
                    step="100"
                    value={rvbManagementFee}
                    onChange={(e) => setRvbManagementFee(parseFloat(e.target.value))}
                    className="block w-full rounded border-slate-300 py-1 px-2 text-sm border"
                  />
                </div>
             </div>

             <div className="grid grid-cols-2 gap-3">
                <div>
                   <label className="block text-[10px] font-medium text-slate-500 mb-1">樓價升幅 (%/年)</label>
                   <input
                    type="number"
                    step="0.1"
                    value={rvbPropertyAppreciation}
                    onChange={(e) => setRvbPropertyAppreciation(parseFloat(e.target.value))}
                    className="block w-full rounded border-slate-300 py-1 px-2 text-sm border"
                  />
                </div>
                <div>
                   <label className="block text-[10px] font-medium text-slate-500 mb-1">投資回報 (%/年)</label>
                   <input
                    type="number"
                    step="0.1"
                    value={rvbInvestmentReturn}
                    onChange={(e) => setRvbInvestmentReturn(parseFloat(e.target.value))}
                    className="block w-full rounded border-slate-300 py-1 px-2 text-sm border"
                  />
                </div>
             </div>
             <p className="text-[10px] text-slate-400 italic">假設「租樓」會將首期資金及每月開支差額作投資。</p>
         </div>
      </FormSection>

      <button
        onClick={onSimulate}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-200 transition-all duration-200 flex justify-center items-center mt-4 active:scale-[0.98]"
      >
        <span className="mr-2">更新分析結果</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </button>

      <div className="mt-8 pt-6 border-t border-slate-200 text-slate-400 text-[10px] leading-relaxed hidden lg:block">
        <button 
          onClick={onOpenTerms}
          className="font-bold mb-1 hover:text-indigo-600 transition-colors underline"
        >
          免責聲明及使用條款：
        </button>
        <div>
          此工具僅供參考。銀行批核結果以「貸款確認書」為準。市場利率波動無法準確預測。
        </div>
      </div>
    </div>
  );
};

export default InputForm;