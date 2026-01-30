import React, { useState } from 'react';
import { MonthlyData } from '../types';
import { formatCurrency, formatPercent } from '../utils';

interface AmortizationTableProps {
  data: MonthlyData[];
}

const AmortizationTable: React.FC<AmortizationTableProps> = ({ data }) => {
  const [planType, setPlanType] = useState<'H' | 'P' | 'F'>('H');
  const hasFixedPlan = data[0]?.fEffectiveRate > 0;

  // Aggregate data by year for the table
  const yearlyData = React.useMemo(() => {
    const years: Record<number, any> = {};
    
    data.forEach(m => {
      if (!years[m.year]) {
        years[m.year] = {
          year: m.year,
          // H-Plan Stats
          hInterest: 0,
          hPrincipal: 0,
          hTotal: 0,
          hBalanceEnd: m.hRemainingBalance,
          hAvgRate: 0,
          hIsCapped: false, // Flag for the year
          // P-Plan Stats
          pInterest: 0,
          pPrincipal: 0,
          pTotal: 0,
          pBalanceEnd: m.pRemainingBalance,
          pAvgRate: 0,
          // Fixed-Plan Stats
          fInterest: 0,
          fPrincipal: 0,
          fTotal: 0,
          fBalanceEnd: m.fRemainingBalance,
          fAvgRate: 0,
          
          // Extra Repayment
          totalExtra: 0,
          
          count: 0
        };
      }
      
      const yearEntry = years[m.year];
      
      // Accumulate H-Plan
      yearEntry.hInterest += m.hInterestPayment;
      yearEntry.hPrincipal += m.hPrincipalPayment;
      yearEntry.hTotal += m.hMonthlyPayment;
      yearEntry.hBalanceEnd = m.hRemainingBalance; 
      yearEntry.hAvgRate += m.hEffectiveRate;
      if (m.isCapTriggered) yearEntry.hIsCapped = true;

      // Accumulate P-Plan
      yearEntry.pInterest += m.pInterestPayment;
      yearEntry.pPrincipal += m.pPrincipalPayment;
      yearEntry.pTotal += m.pMonthlyPayment;
      yearEntry.pBalanceEnd = m.pRemainingBalance;
      yearEntry.pAvgRate += m.pEffectiveRate;

      // Accumulate Fixed Plan
      yearEntry.fInterest += m.fInterestPayment;
      yearEntry.fPrincipal += m.fPrincipalPayment;
      yearEntry.fTotal += m.fMonthlyPayment;
      yearEntry.fBalanceEnd = m.fRemainingBalance;
      yearEntry.fAvgRate += m.fEffectiveRate;
      
      // Accumulate Extra Repayment
      if (m.extraRepayment) {
          yearEntry.totalExtra += m.extraRepayment;
      }

      yearEntry.count += 1;
    });

    return Object.values(years).map((y: any) => ({
      ...y,
      hAvgRate: y.hAvgRate / y.count,
      pAvgRate: y.pAvgRate / y.count,
      fAvgRate: y.fAvgRate / y.count,
      hAvgMonthly: y.hTotal / y.count,
      pAvgMonthly: y.pTotal / y.count,
      fAvgMonthly: y.fTotal / y.count
    }));
  }, [data]);

  const getActivePlanLabel = () => {
      if (planType === 'H') return 'H按 (H-Plan)';
      if (planType === 'P') return 'P按 (P-Plan)';
      if (planType === 'F') return '定息 (Fixed)';
      return '';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
           <h3 className="text-sm font-bold text-slate-700">年度供款詳情表</h3>
           <p className="text-xs text-slate-500 mt-1">
             目前顯示：{getActivePlanLabel()} 數據
           </p>
        </div>
        
        <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
            <button
                onClick={() => setPlanType('H')}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${planType === 'H' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                H按
            </button>
            <button
                onClick={() => setPlanType('P')}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${planType === 'P' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                P按
            </button>
            {hasFixedPlan && (
                <button
                    onClick={() => setPlanType('F')}
                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${planType === 'F' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    定息
                </button>
            )}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">年份</th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">平均利率</th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-slate-800 uppercase tracking-wider bg-slate-100">每月供款 (平均)</th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">年利息支出</th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">年償還本金</th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-orange-600 uppercase tracking-wider">額外還款</th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">貸款餘額</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {yearlyData.map((row) => {
                // Select data based on active plan
                let avgRate, avgMonthly, interest, principal, balance, color;
                let showCapWarning = false;

                if (planType === 'H') {
                    avgRate = row.hAvgRate;
                    avgMonthly = row.hAvgMonthly;
                    interest = row.hInterest;
                    principal = row.hPrincipal;
                    balance = row.hBalanceEnd;
                    color = 'text-orange-600';
                    showCapWarning = row.hIsCapped;
                } else if (planType === 'P') {
                    avgRate = row.pAvgRate;
                    avgMonthly = row.pAvgMonthly;
                    interest = row.pInterest;
                    principal = row.pPrincipal;
                    balance = row.pBalanceEnd;
                    color = 'text-slate-600';
                } else {
                    avgRate = row.fAvgRate;
                    avgMonthly = row.fAvgMonthly;
                    interest = row.fInterest;
                    principal = row.fPrincipal;
                    balance = row.fBalanceEnd;
                    color = 'text-purple-600';
                }

                return (
                  <tr key={row.year} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{row.year}</td>
                    <td className={`px-4 py-4 whitespace-nowrap text-sm text-right font-medium ${color}`}>
                        {formatPercent(avgRate)}
                        {showCapWarning && (
                           <span className="ml-1.5 inline-flex items-center text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold" title="該年度有月份觸發封頂位">
                               已封頂
                           </span>
                        )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-bold text-indigo-700 bg-slate-50">
                        {formatCurrency(avgMonthly)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-slate-600">{formatCurrency(interest)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-slate-600">{formatCurrency(principal)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-bold text-orange-600">
                        {row.totalExtra > 0 ? formatCurrency(row.totalExtra) : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-slate-500">{formatCurrency(balance)}</td>
                  </tr>
                );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AmortizationTable;