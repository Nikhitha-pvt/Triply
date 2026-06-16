import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { DollarSign, MessageCircle, AlertCircle } from 'lucide-react';

interface BudgetBreakdownProps {
  budget: any;
  groupSplit: any;
  tripRequest: any;
}

const COLORS = ['#1D4ED8', '#0D9488', '#F59E0B', '#EF4444', '#64748B'];

export default function BudgetBreakdown({ budget, groupSplit, tripRequest }: BudgetBreakdownProps) {
  // Local state for checking who contributes/spends
  const [payers, setPayers] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (groupSplit) {
      const initial: Record<string, boolean> = {};
      groupSplit.shares.forEach((share: any) => {
        const nameLower = share.name.toLowerCase();
        // Check for kid, child, baby, or infant to uncheck by default
        const isDependent = nameLower.includes('child') || 
                            nameLower.includes('kid') || 
                            nameLower.includes('baby') || 
                            nameLower.includes('infant');
        initial[share.name] = !isDependent;
      });
      setPayers(initial);
    }
  }, [groupSplit]);

  const chartData = [
    { name: 'Transport', value: budget.transport_cost },
    { name: 'Accommodation', value: budget.accommodation_cost },
    { name: 'Food', value: budget.food_cost },
    { name: 'Activities', value: budget.activities_cost },
    { name: 'Buffer', value: budget.buffer_cost },
  ].filter(item => item.value > 0);

  // Dynamic calculations based on payers state
  const activePayers = Object.keys(payers).filter(name => payers[name]);
  const activePayersCount = activePayers.length || 1;
  const sharePerPayer = Math.round((budget.total_cost / activePayersCount) * 100) / 100;

  const dynamicShares = groupSplit 
    ? groupSplit.shares.map((share: any) => {
        const isPayer = payers[share.name] ?? true;
        return {
          name: share.name,
          amount_owed: isPayer ? sharePerPayer : 0
        };
      })
    : [];

  const dynamicTransactions: any[] = [];
  if (activePayers.length > 1) {
    const creditor = activePayers[0]; // first active payer paid for everything
    for (let i = 1; i < activePayers.length; i++) {
      dynamicTransactions.push({
        debtor: activePayers[i],
        creditor: creditor,
        amount: sharePerPayer
      });
    }
  }

  // Generate WhatsApp Share Message
  const getWhatsAppShareLink = () => {
    if (!groupSplit) return '#';
    let text = `*Hey team! ✈️ Here is our Triply AI trip budget split summary for ${tripRequest.destination}:*\n\n`;
    text += `• Total Budget: ₹${budget.total_cost.toLocaleString()}\n`;
    text += `• Accommodation: ₹${budget.accommodation_cost.toLocaleString()}\n`;
    text += `• Transport: ₹${budget.transport_cost.toLocaleString()}\n`;
    text += `• Food: ₹${budget.food_cost.toLocaleString()}\n\n`;
    text += `*Individual Shares (Projected Splits):*\n`;
    
    dynamicShares.forEach((share: any) => {
      text += `- ${share.name}: ₹${share.amount_owed.toLocaleString()}\n`;
    });
    
    if (dynamicTransactions.length > 0) {
      text += `\n*Settlement Plan:*\n`;
      dynamicTransactions.forEach((tx: any) => {
        text += `- ${tx.debtor} pays ₹${tx.amount.toLocaleString()} to ${tx.creditor}\n`;
      });
    }
    
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  };

  const progressPercent = Math.min((budget.total_cost / tripRequest.budget_inr) * 100, 100);
  const isOverspent = budget.total_cost > tripRequest.budget_inr;

  return (
    <div className="space-y-6">
      
      {/* Target Cost Comparison Card */}
      <div className="bg-white border border-slate-200 shadow-card rounded-card p-6">
        <h3 className="text-sm font-bold text-darkNavy mb-4 uppercase tracking-wider flex items-center gap-1.5">
          <DollarSign size={16} className="text-primary" /> Cost vs Target Budget
        </h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-slate-50 border border-slate-100 rounded-btn p-3 text-center">
            <span className="text-[10px] font-bold text-slate-400">TARGET BUDGET</span>
            <div className="text-base font-extrabold text-slate-650">₹{tripRequest.budget_inr.toLocaleString()}</div>
          </div>
          <div className={`border rounded-btn p-3 text-center ${isOverspent ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
            <span className="text-[10px] font-bold text-slate-400">TOTAL ESTIMATED</span>
            <div className={`text-base font-extrabold ${isOverspent ? 'text-red-600' : 'text-tealAccent'}`}>
              ₹{budget.total_cost.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Budget Progress Bar */}
        <div className="space-y-1">
          <div className="w-full bg-slate-100 rounded-full h-2 relative overflow-hidden">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${isOverspent ? 'bg-red-500' : 'bg-primary'}`}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] font-semibold text-slate-400">
            <span>0%</span>
            <span>{isOverspent ? 'Exceeded Budget!' : 'Within target budget'}</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Grid: Chart & Group split details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Doughnut Chart */}
        <div className="bg-white border border-slate-200 shadow-card rounded-card p-6 flex flex-col justify-between">
          <h4 className="text-xs font-bold text-darkNavy mb-4 uppercase tracking-wider">Expense Distribution</h4>
          
          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => `₹${Number(value).toLocaleString()}`}
                  contentStyle={{ fontSize: 10, borderRadius: 8, border: '1px solid #E2E8F0' }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-[10px] font-semibold mt-4">
            {chartData.map((entry, index) => (
              <div key={entry.name} className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                <span className="text-slate-500 truncate">{entry.name} ({Math.round((entry.value / budget.total_cost) * 100)}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Group Splits */}
        {groupSplit ? (
          <div className="bg-white border border-slate-200 shadow-card rounded-card p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-darkNavy uppercase tracking-wider flex items-center justify-between">
                <span>Group Cost Split</span>
                <span className="text-[10px] bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded">
                  {tripRequest.split_type === 'equal' ? 'Equal Split' : 'Custom Split'}
                </span>
              </h4>

              {/* Shares Table */}
              <div className="border border-slate-100 rounded overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-left text-slate-400 font-bold">
                      <th className="p-2">Name</th>
                      <th className="p-2 text-center">Spends?</th>
                      <th className="p-2 text-right">Owed Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dynamicShares.map((share: any) => (
                      <tr key={share.name} className="border-b border-slate-100 text-slate-605 font-semibold">
                        <td className="p-2">{share.name}</td>
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            checked={payers[share.name] ?? true}
                            onChange={() => {
                              setPayers(prev => {
                                const next = { ...prev, [share.name]: !prev[share.name] };
                                // Keep at least one active payer
                                const activeCount = Object.values(next).filter(Boolean).length;
                                if (activeCount === 0) return prev;
                                return next;
                              });
                            }}
                            className="accent-primary cursor-pointer w-4.5 h-4.5 rounded"
                          />
                        </td>
                        <td className="p-2 text-right">₹{share.amount_owed.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Debt Settlement Plan */}
              {dynamicTransactions.length > 0 && (
                <div className="space-y-2 mt-4">
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Settlement Plan</h5>
                  <div className="bg-slate-50 border border-slate-100 rounded-btn p-3 space-y-1.5 text-xs text-slate-650 font-semibold">
                    {dynamicTransactions.map((tx: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-1">
                        <span className="text-red-500">{tx.debtor}</span>
                        <span className="text-[10px] text-slate-400">pays</span>
                        <span className="text-tealAccent font-extrabold">₹{tx.amount.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-400">to</span>
                        <span className="text-primary">{tx.creditor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <p className="text-[10px] text-slate-400 italic mt-2 leading-normal">
                * Note: This is a projected cost split for planning purposes. Check/uncheck group members (e.g. uncheck kids) to override who shares the trip expenses.
              </p>
            </div>

            {/* WhatsApp Share Button */}
            <a
              href={getWhatsAppShareLink()}
              target="_blank"
              rel="noreferrer"
              className="mt-6 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white text-xs font-bold py-2.5 px-4 rounded-btn transition shadow-sm"
            >
              <MessageCircle size={16} /> Share Split on WhatsApp
            </a>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 shadow-card rounded-card p-6 flex flex-col justify-center items-center text-center opacity-60">
            <AlertCircle size={24} className="text-slate-400" />
            <h4 className="text-xs font-bold text-darkNavy mt-2">Single Traveller</h4>
            <p className="text-[10px] text-slate-500 mt-1 max-w-[200px]">Expense splitter and WhatsApp share alerts appear when Adults &gt; 1.</p>
          </div>
        )}
      </div>
    </div>
  );
}
