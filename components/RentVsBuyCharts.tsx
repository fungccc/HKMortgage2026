import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { RentVsBuyResult } from '../types';
import { formatCurrency } from '../utils';

interface RentVsBuyChartsProps {
  data: RentVsBuyResult;
}

const RentVsBuyCharts: React.FC<RentVsBuyChartsProps> = ({ data }) => {
  const finalDiff = data.finalBuyNetWorth - data.finalRentNetWorth;
  const isBuyBetter = finalDiff > 0;

  return (
    <div className="space-y-6">
       
       {/* Summary Card */}
       <div className={`p-6 rounded-xl border ${isBuyBetter ? 'bg-indigo-50 border-indigo-100' : 'bg-orange-50 border-orange-100'}`}>
          <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-full ${isBuyBetter ? 'bg-indigo-100 text-indigo-600' : 'bg-orange-100 text-orange-600'}`}>
                  {isBuyBetter ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                  ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                  )}
              </div>
              <div>
                  <h3 className={`text-xl font-bold ${isBuyBetter ? 'text-indigo-900' : 'text-orange-900'}`}>
                      {isBuyBetter ? '模擬結果：買樓淨值較高' : '模擬結果：租樓淨值較高'}
                  </h3>
                  <p className={`text-sm ${isBuyBetter ? 'text-indigo-700' : 'text-orange-700'} mt-1`}>
                      預計期末資產淨值差距： <span className="font-bold text-lg">{formatCurrency(Math.abs(finalDiff))}</span>
                  </p>
              </div>
          </div>
          
          {data.breakEvenYear && isBuyBetter && (
              <div className="mt-4 pt-4 border-t border-indigo-200/50 flex items-center text-sm text-indigo-800">
                  <span className="font-bold mr-2">模擬黃金交叉點:</span> 第 {data.breakEvenYear} 年後，買樓資產淨值開始超越租樓。
              </div>
          )}
       </div>

       {/* Net Worth Chart */}
       <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-2">資產淨值走勢對比 (Net Worth)</h3>
            <p className="text-xs text-slate-500 mb-6">
                比較「買樓後資產淨值」(樓價 - 按揭餘額) 與 「租樓 + 模擬投資組合價值」。
                <br/>假設租樓情境下，首期資金及每月供租差額均作投資。
            </p>

            <div className="w-full h-[350px] min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <AreaChart
                        data={data.yearlyData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorBuy" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorRent" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                        <YAxis 
                            tickFormatter={(val) => `$${(val / 1000000).toFixed(1)}M`} 
                            axisLine={false} 
                            tickLine={false}
                            tick={{fill: '#64748b', fontSize: 12}}
                        />
                        <Tooltip 
                            formatter={(value: number, name: string) => [formatCurrency(value), name === 'buyNetWorth' ? '買樓淨值' : '租樓淨值']}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            labelStyle={{ color: '#334155', fontWeight: 'bold' }}
                        />
                        <Legend wrapperStyle={{paddingTop: '20px'}}/>
                        <Area 
                            type="monotone" 
                            dataKey="buyNetWorth" 
                            name="買樓淨值" 
                            stroke="#4f46e5" 
                            fillOpacity={1} 
                            fill="url(#colorBuy)" 
                        />
                        <Area 
                            type="monotone" 
                            dataKey="rentNetWorth" 
                            name="租樓淨值" 
                            stroke="#f97316" 
                            fillOpacity={1} 
                            fill="url(#colorRent)" 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
       </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Key Assumptions Display */}
             <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                 <h4 className="font-bold text-slate-700 text-sm mb-3 uppercase">情境假設</h4>
                 <div className="space-y-2 text-sm">
                     <div className="flex justify-between">
                         <span className="text-slate-500">起始月租</span>
                         <span className="font-medium text-slate-800">{formatCurrency(data.initialRent)} (回報 {data.rentalYield.toFixed(2)}%)</span>
                     </div>
                     <div className="flex justify-between">
                         <span className="text-slate-500">樓價升幅</span>
                         <span className="font-medium text-slate-800">每年 +{(data.yearlyData[data.yearlyData.length-1].propertyValue / data.yearlyData[0].propertyValue * 100 / data.yearlyData.length - 100 / data.yearlyData.length).toFixed(1)}% (複合)</span>
                     </div>
                      {/* Simple math to approximate displayed growth for context */}
                 </div>
             </div>
             
             {/* Final Comparison Table */}
             <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                 <table className="min-w-full text-sm">
                     <thead className="bg-slate-100">
                         <tr>
                             <th className="py-2 px-4 text-left font-bold text-slate-600">期末比較 (第 {data.yearlyData.length} 年)</th>
                             <th className="py-2 px-4 text-right font-bold text-slate-600">金額</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                         <tr>
                             <td className="py-2 px-4 text-slate-600">物業估值</td>
                             <td className="py-2 px-4 text-right font-medium text-slate-800">{formatCurrency(data.yearlyData[data.yearlyData.length-1].propertyValue)}</td>
                         </tr>
                         <tr>
                             <td className="py-2 px-4 text-slate-600">按揭餘額</td>
                             <td className="py-2 px-4 text-right text-red-500">-{formatCurrency(data.yearlyData[data.yearlyData.length-1].outstandingLoan)}</td>
                         </tr>
                         <tr className="bg-indigo-50/50">
                             <td className="py-2 px-4 font-bold text-indigo-700">買樓總淨值</td>
                             <td className="py-2 px-4 text-right font-bold text-indigo-700">{formatCurrency(data.finalBuyNetWorth)}</td>
                         </tr>
                         <tr className="bg-orange-50/50">
                             <td className="py-2 px-4 font-bold text-orange-700">租樓總淨值 (投資組合)</td>
                             <td className="py-2 px-4 text-right font-bold text-orange-700">{formatCurrency(data.finalRentNetWorth)}</td>
                         </tr>
                     </tbody>
                 </table>
             </div>
        </div>

    </div>
  );
};

export default RentVsBuyCharts;