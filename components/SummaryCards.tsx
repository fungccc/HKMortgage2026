import React, { useMemo } from 'react';
import { SimulationResult, SimulationMode } from '../types';
import { formatCurrency, formatPercent } from '../utils';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface SummaryCardsProps {
  result: SimulationResult;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ result }) => {
  const isHPlanCheaper = result.savings >= 0;
  const savingsAbs = Math.abs(result.savings);
  const hasML = result.mortgageLink.enabled && result.mortgageLink.depositAmount > 0;

  const renderPaymentRange = (min: number, max: number) => {
      if (min === max) return formatCurrency(max);
      return (
          <span className="text-xl">
             {formatCurrency(min)} <span className="text-sm text-slate-400 font-normal mx-1">至</span> {formatCurrency(max)}
          </span>
      );
  };

  // Calculate stress test increase
  const currentInitialPayment = result.monthlyData[0].hMonthlyPayment;
  const stressIncrease = result.stressTest.monthlyPayment - currentInitialPayment;
  // const stressIncreasePercent = (stressIncrease / currentInitialPayment) * 100;

  // Fixed Plan calculations
  const fixedIsCheaperThanH = (result.fixedSavings || 0) > 0;
  const fixedSavingsAbs = Math.abs(result.fixedSavings || 0);

  // Refinance Chart Data
  const refinanceChartData = useMemo(() => {
    if (!result.refinance.enabled || !result.refinance.breakdown) return [];
    let cumulative = 0;
    return result.refinance.breakdown.map(item => {
        cumulative += item.netGain;
        return {
            yearLabel: `${item.year}`,
            year: item.year,
            gain: item.netGain,
            cumulative: cumulative,
            rebate: item.rebateAmount,
            fee: item.legalFee
        };
    });
  }, [result.refinance]);

  return (
    <div className="grid grid-cols-1 gap-4 mb-8">
      {/* Comparison Header Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* H-Plan Column */}
            <div className={`relative ${isHPlanCheaper ? '' : 'opacity-75'}`}>
                {isHPlanCheaper && (
                    <div className="absolute -top-6 left-0 bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-1 rounded">較低息方案</div>
                )}
                <h3 className="text-lg font-bold text-slate-700 mb-4 border-b pb-2 border-slate-100">H按 (H-Plan)</h3>
                <div className="space-y-4">
                    {/* Primary KPI: Monthly Payment */}
                    <div>
                         <div className="text-sm text-slate-500 mb-1">
                            {result.simulationMode === SimulationMode.Custom ? '每月供款' : '每月供款 (波動範圍)'}
                        </div>
                        <div className={`text-2xl font-bold ${isHPlanCheaper ? 'text-indigo-600' : 'text-slate-700'}`}>
                            {renderPaymentRange(result.hPlan.minPayment, result.hPlan.maxPayment)}
                        </div>
                    </div>

                    {/* Secondary KPIs */}
                    <div>
                        <div className="text-sm text-slate-500">總利息支出</div>
                        <div className="text-lg font-semibold text-slate-600">{formatCurrency(result.hPlan.totalInterest)}</div>
                        {hasML && result.hPlan.netTotalInterest !== undefined && (
                            <div className="text-xs text-emerald-600 mt-1">
                                扣除 ML 後淨利息: <span className="font-bold">{formatCurrency(result.hPlan.netTotalInterest)}</span>
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="text-sm text-slate-500">全期總開支 (本+利)</div>
                        <div className="text-sm font-medium text-slate-500">{formatCurrency(result.hPlan.totalPayment)}</div>
                    </div>
                </div>
            </div>

            {/* VS Divider */}
            <div className="hidden md:flex items-center justify-center relative">
                <div className="absolute inset-y-0 left-1/2 border-l border-dashed border-slate-300"></div>
                <div className="bg-slate-50 p-2 rounded-full border border-slate-200 z-10 text-slate-400 text-sm font-bold">VS</div>
            </div>

            {/* P-Plan Column */}
            <div className={`relative ${!isHPlanCheaper ? '' : 'opacity-75'}`}>
                {!isHPlanCheaper && (
                    <div className="absolute -top-6 left-0 bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-1 rounded">較低息方案</div>
                )}
                <h3 className="text-lg font-bold text-slate-700 mb-4 border-b pb-2 border-slate-100">P按 (P-Plan)</h3>
                <div className="space-y-4">
                    {/* Primary KPI: Monthly Payment */}
                    <div>
                        <div className="text-sm text-slate-500 mb-1">
                            {result.simulationMode === SimulationMode.Custom ? '每月供款' : '每月供款 (波動範圍)'}
                        </div>
                         <div className={`text-2xl font-bold ${!isHPlanCheaper ? 'text-indigo-600' : 'text-slate-700'}`}>
                             {renderPaymentRange(result.pPlan.minPayment, result.pPlan.maxPayment)}
                        </div>
                    </div>

                     {/* Secondary KPIs */}
                    <div>
                        <div className="text-sm text-slate-500">總利息支出</div>
                        <div className="text-lg font-semibold text-slate-500">{formatCurrency(result.pPlan.totalInterest)}</div>
                        {hasML && result.pPlan.netTotalInterest !== undefined && (
                            <div className="text-xs text-emerald-600 mt-1">
                                扣除 ML 後淨利息: <span className="font-bold">{formatCurrency(result.pPlan.netTotalInterest)}</span>
                            </div>
                        )}
                    </div>
                    <div>
                         <div className="text-sm text-slate-500">全期總開支 (本+利)</div>
                        <div className={`text-sm font-bold ${!isHPlanCheaper ? 'text-indigo-600' : 'text-slate-700'}`}>{formatCurrency(result.pPlan.totalPayment)}</div>
                    </div>
                </div>
            </div>
         </div>

         {/* Savings Banner */}
         <div className={`mt-6 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between border ${isHPlanCheaper ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center">
                <div className={`${isHPlanCheaper ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-500'} p-2 rounded-full mr-3`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div>
                    <div className={`font-bold ${isHPlanCheaper ? 'text-green-900' : 'text-slate-700'}`}>
                        {isHPlanCheaper 
                            ? `選擇 H按 預計節省` 
                            : `H按 已觸發封頂位，與 P按 開支相同`}
                        {!isHPlanCheaper && savingsAbs > 0 && ` (P按反而更平 ${formatCurrency(savingsAbs)})`}
                    </div>
                    <div className="text-xs opacity-80">
                         {result.simulationMode === SimulationMode.Historical 
                            ? '基於30年週期模擬結果'
                            : `基於固定利率假設 (P=${result.monthlyData[0].prime}%, H=${result.monthlyData[0].hibor}%)`}
                    </div>
                </div>
            </div>
            {isHPlanCheaper && (
                <div className="mt-2 md:mt-0 text-2xl font-bold text-green-600">{formatCurrency(savingsAbs)}</div>
            )}
         </div>
      </div>

      {/* Mortgage Link Analysis Card (NEW) */}
      {hasML && result.hPlan.totalMortgageLinkSavings && (
          <div className="bg-cyan-50 border border-cyan-100 p-5 rounded-xl">
             <div className="flex items-start space-x-3 mb-4">
                 <div className="mt-1 bg-cyan-100 p-2 rounded-full text-cyan-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                 </div>
                 <div className="flex-1">
                     <h3 className="text-lg font-bold text-cyan-900">Mortgage Link 節省分析</h3>
                     <p className="text-xs text-cyan-700 mt-1">
                         利用 <span className="font-bold">{formatCurrency(result.mortgageLink.depositAmount)}</span> 存款掛鈎，賺取高息抵銷按揭支出。
                     </p>
                 </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="bg-white p-3 rounded-lg border border-cyan-100 shadow-sm">
                     <div className="text-xs text-slate-500 uppercase">總共節省利息</div>
                     <div className="text-xl font-bold text-cyan-700 mt-1">{formatCurrency(result.hPlan.totalMortgageLinkSavings)}</div>
                 </div>
                 <div className="bg-white p-3 rounded-lg border border-cyan-100 shadow-sm">
                     <div className="text-xs text-slate-500 uppercase">實際利息支出減少</div>
                     <div className="text-xl font-bold text-cyan-700 mt-1">
                         {formatPercent((result.hPlan.totalMortgageLinkSavings / result.hPlan.totalInterest) * 100)}
                     </div>
                 </div>
             </div>
          </div>
      )}
      
      {/* Fixed Plan Analysis Card (Optional) */}
      {result.fixedPlan && (
         <div className="bg-purple-50 border border-purple-100 p-5 rounded-xl">
            <div className="flex items-start space-x-3 mb-4">
                <div className="mt-1 bg-purple-100 p-2 rounded-full text-purple-600">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                   </svg>
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-purple-900">定息計劃比較 (Fixed Plan)</h3>
                    <p className="text-xs text-purple-700 mt-1">
                        與 H按 相比，定息計劃{fixedIsCheaperThanH ? '更划算' : '成本較高'}。
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-3 rounded-lg border border-purple-100 shadow-sm">
                    <div className="text-xs text-slate-500 uppercase">定息期內月供</div>
                    <div className="text-xl font-bold text-purple-800 mt-1">{formatCurrency(result.monthlyData?.[0]?.fMonthlyPayment || result.fixedPlan.maxPayment)}</div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-purple-100 shadow-sm">
                    <div className="text-xs text-slate-500 uppercase">全期總利息</div>
                    <div className="text-xl font-bold text-purple-800 mt-1">{formatCurrency(result.fixedPlan.totalInterest)}</div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-purple-100 shadow-sm flex flex-col justify-center">
                    <div className="text-xs text-slate-500 uppercase mb-1">對比 H按 總開支</div>
                    <div className={`text-lg font-bold ${fixedIsCheaperThanH ? 'text-green-600' : 'text-red-500'}`}>
                        {fixedIsCheaperThanH ? '平 ' : '貴 '} {formatCurrency(fixedSavingsAbs)}
                    </div>
                </div>
            </div>
         </div>
      )}

      {/* Refinance Gain Card (Enhanced with Chart) */}
      {result.refinance.enabled && result.refinance.totalNetGain > 0 && (
         <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-xl">
            <div className="flex items-start space-x-3 mb-4">
                <div className="mt-1 bg-emerald-100 p-2 rounded-full text-emerald-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-emerald-900">轉按策略收益分析</h3>
                    <p className="text-xs text-emerald-700 mt-1">
                        模擬每2年轉按一次，利用銀行現金回贈扣除律師費後的累積淨收益。
                    </p>
                </div>
            </div>

            {/* Total Summary Grid */}
            <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-white p-2 rounded border border-emerald-100 text-center">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">總回贈收入</div>
                    <div className="text-sm font-bold text-emerald-600">+{formatCurrency(result.refinance.totalRebateAmount)}</div>
                </div>
                <div className="bg-white p-2 rounded border border-emerald-100 text-center">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">總律師費成本</div>
                    <div className="text-sm font-bold text-red-500">-{formatCurrency(result.refinance.totalLegalFee)}</div>
                </div>
                <div className="bg-emerald-100 p-2 rounded border border-emerald-200 text-center">
                    <div className="text-[10px] text-emerald-800 uppercase font-bold">全期淨賺</div>
                    <div className="text-lg font-bold text-emerald-700">{formatCurrency(result.refinance.totalNetGain)}</div>
                </div>
            </div>
            
            {/* Cumulative Gain Chart - Fixed Height Container */}
            <div className="w-full mt-4 bg-white/60 rounded-lg p-2 border border-emerald-100/50">
                <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <BarChart data={refinanceChartData} margin={{top: 5, right: 0, bottom: 0, left: 0}}>
                            <XAxis 
                                dataKey="yearLabel" 
                                tick={{fontSize: 10, fill: '#64748b'}} 
                                axisLine={false} 
                                tickLine={false} 
                                interval={refinanceChartData.length > 10 ? 1 : 0}
                            />
                            <Tooltip 
                                cursor={{fill: '#ecfdf5', opacity: 0.5}}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-white p-3 border border-emerald-100 shadow-lg rounded-lg text-xs z-50">
                                                <div className="font-bold text-slate-700 mb-1">第 {data.year} 年底轉按</div>
                                                <div className="space-y-1">
                                                    <div className="flex justify-between gap-4">
                                                        <span className="text-slate-500">累計淨賺:</span>
                                                        <span className="font-bold text-emerald-600">{formatCurrency(data.cumulative)}</span>
                                                    </div>
                                                    <div className="border-t border-slate-100 my-1 pt-1"></div>
                                                    <div className="flex justify-between gap-4">
                                                        <span className="text-slate-500">是次淨賺:</span>
                                                        <span className="font-medium text-emerald-600">+{formatCurrency(data.gain)}</span>
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 text-right">
                                                        ({formatCurrency(data.rebate)} - {formatCurrency(data.fee)})
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="cumulative" radius={[4, 4, 0, 0]} name="累積收益">
                                {refinanceChartData.map((_entry, index) => (
                                    <Cell key={`cell-${index}`} fill={`rgba(16, 185, 129, ${0.4 + (index / refinanceChartData.length) * 0.6})`} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="text-center text-[10px] text-emerald-600/60 mt-1 font-medium">累積淨收益走勢 (年)</div>
            </div>

            {/* NEW: Detailed Breakdown Table */}
            <div className="mt-5 pt-4 border-t border-emerald-200">
                <div className="flex justify-between items-center mb-3">
                   <h4 className="text-xs font-bold text-emerald-800 uppercase">收益明細表 (Breakdown)</h4>
                </div>
                <div className="overflow-x-auto bg-white/50 rounded-lg border border-emerald-100">
                    <table className="w-full text-xs whitespace-nowrap">
                        <thead className="bg-emerald-100/50 text-emerald-800 font-semibold border-b border-emerald-100">
                            <tr>
                                <th className="py-2 px-3 text-left">年份</th>
                                <th className="py-2 px-3 text-right">轉按餘額</th>
                                <th className="py-2 px-3 text-right">現金回贈</th>
                                <th className="py-2 px-3 text-right">律師費</th>
                                <th className="py-2 px-3 text-right">淨收益</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-emerald-50">
                            {result.refinance.breakdown.map((item) => (
                                <tr key={item.year} className="hover:bg-emerald-50/50 transition-colors">
                                    <td className="py-2 px-3 text-left font-medium text-slate-600">第 {item.year} 年</td>
                                    <td className="py-2 px-3 text-right text-slate-500">{formatCurrency(item.remainingBalance)}</td>
                                    <td className="py-2 px-3 text-right text-emerald-600">+{formatCurrency(item.rebateAmount)}</td>
                                    <td className="py-2 px-3 text-right text-red-400">-{formatCurrency(item.legalFee)}</td>
                                    <td className="py-2 px-3 text-right font-bold text-emerald-700">+{formatCurrency(item.netGain)}</td>
                                </tr>
                            ))}
                        </tbody>
                         <tfoot className="bg-emerald-100/30 border-t border-emerald-100 font-bold text-emerald-900">
                             <tr>
                                <td className="py-2 px-3 text-left">總計</td>
                                <td className="py-2 px-3 text-right text-slate-400">-</td>
                                <td className="py-2 px-3 text-right">+{formatCurrency(result.refinance.totalRebateAmount)}</td>
                                <td className="py-2 px-3 text-right text-red-500">-{formatCurrency(result.refinance.totalLegalFee)}</td>
                                <td className="py-2 px-3 text-right">+{formatCurrency(result.refinance.totalNetGain)}</td>
                             </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
         </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Affordability & Upfront Cost Card */}
        <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl">
            <div className="flex items-start space-x-3 mb-4">
                <div className="mt-1 bg-blue-100 p-2 rounded-full text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-blue-900">置業門檻分析</h3>
                    <p className="text-xs text-blue-700 mt-1">
                        除首期外，一般需預留資金支付印花稅及雜費。
                    </p>
                </div>
            </div>
            
            <div className="space-y-3 bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">參考最低月入要求 (50% DSR)</span>
                    <span className="font-bold text-slate-800">{formatCurrency(result.affordability.minIncomeRequired)}</span>
                </div>
                 <div className="flex justify-between items-center text-sm border-t border-dashed border-slate-200 pt-2">
                    <span className="text-slate-500">首期</span>
                    <span className="font-medium text-slate-700">{formatCurrency(result.affordability.totalUpfrontCash - result.affordability.stampDuty - result.affordability.agencyFee - result.affordability.legalFee)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">印花稅 (AVD Scale 2)</span>
                    <span className="font-medium text-slate-700">{formatCurrency(result.affordability.stampDuty)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">代理佣金 (1%) + 律師費</span>
                    <span className="font-medium text-slate-700">{formatCurrency(result.affordability.agencyFee + result.affordability.legalFee)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-blue-100">
                    <span className="font-bold text-blue-900">參考預留現金總額</span>
                    <span className="font-bold text-xl text-blue-700">{formatCurrency(result.affordability.totalUpfrontCash)}</span>
                </div>
            </div>
        </div>

        {/* Stress Test Card */}
        <div className="bg-red-50 border border-red-100 p-5 rounded-xl">
            <div className="flex items-start space-x-3 mb-4">
                <div className="mt-1 bg-red-100 p-2 rounded-full text-red-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-red-800">歷史壓力測試</h3>
                    <p className="text-xs text-red-600 mt-1">
                        若重演歷史最差情況 ({result.stressTest.marketDesc})，負擔會增加多少？
                    </p>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-lg border border-red-100 shadow-sm">
                    <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold">最高月供</div>
                    <div className="text-xl font-bold text-red-700 mt-1">{formatCurrency(result.stressTest.monthlyPayment)}</div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-red-100 shadow-sm">
                    <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold">較首年增加</div>
                    <div className="text-lg font-bold text-red-600 mt-1">
                        +{formatCurrency(stressIncrease)}
                    </div>
                </div>
            </div>
             <p className="text-xs text-red-500 mt-3 text-center bg-white/50 p-1 rounded">
                假設利率升至 {formatPercent(result.stressTest.maxEffectiveRate)} (P={formatPercent(result.stressTest.maxPrime)})
             </p>
        </div>
      </div>
    </div>
  );
};

export default SummaryCards;