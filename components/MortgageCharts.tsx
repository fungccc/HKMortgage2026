import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  BarChart,
  Bar
} from 'recharts';
import { MonthlyData } from '../types';
import { formatCurrency, formatPercent } from '../utils';

interface MortgageChartsProps {
  data: MonthlyData[];
}

const MortgageCharts: React.FC<MortgageChartsProps> = ({ data }) => {
  // 1. Existing Yearly Snapshot Data (for Rates & Balances)
  const yearlySnapshotData = data.filter((d) => d.month % 12 === 0 || d.month === 1);
  const isCustomMode = data[0]?.marketDesc === "自訂固定利率";
  const hasFixedPlan = data[0]?.fEffectiveRate > 0;
  const hasML = data[0]?.hMortgageLinkInterest > 0;

  // 2. New Aggregated Data (for Interest vs Principal & Cumulative Totals)
  const aggregatedData = useMemo(() => {
    const result: any[] = [];
    let accHInterest = 0;
    let accPInterest = 0;
    let accHNetInterest = 0; // Net after ML

    // Group by year
    const years = new Set(data.map(d => d.year));
    
    years.forEach(year => {
        const monthsInYear = data.filter(d => d.year === year);
        
        // Sum up yearly totals
        const yearHInterest = monthsInYear.reduce((sum, d) => sum + d.hInterestPayment, 0);
        const yearHNetInterest = monthsInYear.reduce((sum, d) => sum + d.hNetInterest, 0);
        const yearHPrincipal = monthsInYear.reduce((sum, d) => sum + d.hPrincipalPayment, 0);
        const yearPInterest = monthsInYear.reduce((sum, d) => sum + d.pInterestPayment, 0);

        // Update Cumulative
        accHInterest += yearHInterest;
        accHNetInterest += yearHNetInterest;
        accPInterest += yearPInterest;

        result.push({
            year,
            hInterest: yearHInterest,
            hPrincipal: yearHPrincipal,
            cumulativeHInterest: accHInterest,
            cumulativeHNetInterest: accHNetInterest,
            cumulativePInterest: accPInterest,
        });
    });

    return result;
  }, [data]);

  // Custom Dot for Capped Rate
  const CustomizedDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload.isCapTriggered) {
      return (
        <svg x={cx - 5} y={cy - 5} width={10} height={10} viewBox="0 0 10 10">
          <circle cx="5" cy="5" r="4" fill="#ef4444" stroke="#fff" strokeWidth="2" />
        </svg>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      
      {/* Chart 1: Rate Comparison (Line Chart) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-2">利率走勢預覽</h3>
        <p className="text-sm text-slate-500 mb-6">
            {isCustomMode 
                ? "自訂固定利率模式：假設整個還款期利率維持不變。" 
                : "歷史週期模式：模擬香港過去 30 年的經濟週期波動。"}
             <span className="font-bold text-orange-500 ml-1">橙線</span> 為 H按實際利率，<span className="text-red-500 font-bold ml-1">● 紅點</span> 代表觸發封頂位。
        </p>
        <div className="w-full h-[350px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <LineChart
              data={yearlySnapshotData}
              margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="year" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#64748b', fontSize: 12}} 
              />
              <YAxis 
                domain={[0, 'auto']} 
                tickFormatter={(val) => `${val}%`} 
                axisLine={false} 
                tickLine={false}
                tick={{fill: '#64748b', fontSize: 12}}
                label={{ value: '年利率 (%)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
              />
              <Tooltip 
                formatter={(value: number, name: string, props: any) => {
                   if (name === "H按 實際利率" && props.payload.isCapTriggered) {
                       return [`${formatPercent(value)} (已封頂)`, name];
                   }
                   return formatPercent(value);
                }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                labelStyle={{ color: '#334155', fontWeight: 'bold' }}
              />
              <Legend wrapperStyle={{paddingTop: '20px'}}/>
              
              <Line 
                type="stepAfter" 
                dataKey="prime" 
                name="最優惠利率 (Prime)" 
                stroke="#e2e8f0" 
                strokeDasharray="3 3"
                strokeWidth={2}
                dot={false}
              />
               <Line 
                type="stepAfter" 
                dataKey="hibor" 
                name="1個月 HIBOR" 
                stroke="#cbd5e1" 
                strokeDasharray="5 5"
                strokeWidth={1}
                dot={false}
              />
              <Line 
                type="stepAfter" 
                dataKey="pEffectiveRate" 
                name="P按 / 封頂位" 
                stroke="#475569" 
                strokeWidth={3}
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="hEffectiveRate" 
                name="H按 實際利率" 
                stroke="#f97316" 
                strokeWidth={3}
                dot={<CustomizedDot />}
              />
              {hasFixedPlan && (
                  <Line 
                    type="stepAfter" 
                    dataKey="fEffectiveRate" 
                    name="定息計劃利率" 
                    stroke="#a855f7" 
                    strokeWidth={3}
                    dot={false}
                  />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chart 2: Principal vs Interest Breakdown (Stacked Bar) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-2">H按 供款成份分析</h3>
            <p className="text-xs text-slate-500 mb-6">
                顯示每年供款中 <span className="text-emerald-500 font-bold">本金</span> 與 <span className="text-red-400 font-bold">利息</span> 的比例變化。
                <br/>可見初期供款大部分用於償還利息 (息多本少)。
            </p>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart
                  data={aggregatedData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  stackOffset="expand" // Option: use 'expand' for % view, or remove for absolute values. Let's use absolute for clear amounts.
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                  <YAxis 
                    tickFormatter={(val) => `$${val/1000}k`} 
                    axisLine={false} 
                    tickLine={false}
                    tick={{fill: '#64748b', fontSize: 10}}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [formatCurrency(value), name]}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    labelStyle={{ color: '#334155', fontWeight: 'bold' }}
                    cursor={{fill: '#f1f5f9'}}
                  />
                  <Legend wrapperStyle={{paddingTop: '20px', fontSize: '12px'}}/>
                  <Bar dataKey="hPrincipal" name="償還本金" stackId="a" fill="#10b981" />
                  <Bar dataKey="hInterest" name="償還利息" stackId="a" fill="#f87171" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Cumulative Interest (Line) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-2">累積利息支出對比</h3>
            <p className="text-xs text-slate-500 mb-6">
                隨著年期增加，H按與 P按的累積利息差距。
                {hasML && <span className="text-cyan-600 block mt-1">青色線為使用 Mortgage Link 後的淨利息。</span>}
            </p>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart
                  data={aggregatedData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorHAcc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                  <YAxis 
                    tickFormatter={(val) => `$${val/10000}w`} 
                    axisLine={false} 
                    tickLine={false}
                    tick={{fill: '#64748b', fontSize: 10}}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [formatCurrency(value), name]}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    labelStyle={{ color: '#334155', fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{paddingTop: '20px', fontSize: '12px'}}/>
                  <Area type="monotone" dataKey="cumulativePInterest" name="P按 累積利息" stroke="#94a3b8" fill="none" strokeWidth={2} strokeDasharray="5 5"/>
                  <Area type="monotone" dataKey="cumulativeHInterest" name="H按 累積利息" stroke="#6366f1" fill="url(#colorHAcc)" strokeWidth={2} />
                  {hasML && (
                       <Area type="monotone" dataKey="cumulativeHNetInterest" name="H按 淨利息 (連 ML)" stroke="#06b6d4" fill="none" strokeWidth={2} strokeDasharray="3 3"/>
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
      </div>

      {/* Chart 4: Balance Comparison (Area Chart) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-6">貸款餘額比較</h3>
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart
              data={yearlySnapshotData}
              margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorHBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <YAxis 
                tickFormatter={(val) => `$${val / 1000000}M`} 
                axisLine={false} 
                tickLine={false}
                tick={{fill: '#64748b', fontSize: 12}}
                label={{ value: '百萬港元', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [formatCurrency(value), name]}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                labelStyle={{ color: '#334155', fontWeight: 'bold' }}
              />
              <Legend wrapperStyle={{paddingTop: '20px'}}/>
              <Area 
                type="monotone" 
                dataKey="hRemainingBalance" 
                name="H按 餘額" 
                stroke="#6366f1" 
                fillOpacity={1} 
                fill="url(#colorHBalance)" 
              />
              <Area 
                type="monotone" 
                dataKey="pRemainingBalance" 
                name="P按 餘額" 
                stroke="#94a3b8" 
                fillOpacity={0.3} 
                fill="#cbd5e1" 
              />
              {hasFixedPlan && (
                 <Area 
                    type="monotone" 
                    dataKey="fRemainingBalance" 
                    name="定息 餘額" 
                    stroke="#d8b4fe" 
                    fillOpacity={0.2} 
                    fill="#e9d5ff" 
                  />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default MortgageCharts;