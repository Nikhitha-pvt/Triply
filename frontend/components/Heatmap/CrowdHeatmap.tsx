import React from 'react';
import { Calendar, Info } from 'lucide-react';

interface CrowdHeatmapProps {
  data: any[];
}

export default function CrowdHeatmap({ data }: CrowdHeatmapProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-card p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-darkNavy uppercase tracking-wider flex items-center gap-2">
            <Calendar size={16} className="text-primary" /> Crowd & Events Heatmap
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Expected crowd levels for your travel dates based on historical data and local events.
          </p>
        </div>

        <div className="space-y-4 mt-6">
          {data.map((day: any, idx: number) => {
            const dateStr = new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
            let bgColor = 'bg-slate-50';
            let dotColor = 'bg-slate-300';
            let textColor = 'text-slate-500';
            let label = 'Unknown';

            if (day.crowd_level.toLowerCase() === 'red') {
              bgColor = 'bg-red-50 border-red-100';
              dotColor = 'bg-red-500';
              textColor = 'text-red-700';
              label = 'Very Busy';
            } else if (day.crowd_level.toLowerCase() === 'amber') {
              bgColor = 'bg-amber-50 border-amber-100';
              dotColor = 'bg-amber-400';
              textColor = 'text-amber-700';
              label = 'Moderate';
            } else if (day.crowd_level.toLowerCase() === 'green') {
              bgColor = 'bg-green-50 border-green-100';
              dotColor = 'bg-green-500';
              textColor = 'text-green-700';
              label = 'Quiet / Low';
            }

            return (
              <div key={idx} className={`p-4 rounded-btn border ${bgColor} flex flex-col md:flex-row gap-4 items-start md:items-center`}>
                <div className="w-32 flex-shrink-0">
                  <div className="text-xs font-bold text-darkNavy">{dateStr}</div>
                  <div className={`text-[10px] font-bold uppercase mt-1 flex items-center gap-1.5 ${textColor}`}>
                    <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
                    {label}
                  </div>
                </div>
                
                <div className="flex-1 space-y-1 border-l-2 border-black/5 pl-4 md:border-l-0 md:pl-0">
                  <div className="text-sm font-semibold text-slate-700 flex items-start gap-1.5">
                    <Info size={14} className="mt-0.5 flex-shrink-0 opacity-50" />
                    <span>{day.reason}</span>
                  </div>
                  
                  {day.events && day.events.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2 pl-5">
                      {day.events.map((ev: string, i: number) => (
                        <span key={i} className="text-[10px] bg-white border border-slate-200 text-slate-500 px-2 py-0.5 rounded shadow-sm">
                          {ev}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
