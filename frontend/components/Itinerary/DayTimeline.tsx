import React from 'react';
import { MapPin, Navigation, Clock, Coffee, Utensils, Moon } from 'lucide-react';

interface DayTimelineProps {
  days: any[];
}

export default function DayTimeline({ days }: DayTimelineProps) {
  return (
    <div className="space-y-8">
      {days.map((day, idx) => (
        <div key={idx} className="bg-white border border-slate-200 shadow-card rounded-card p-6">
          <div className="border-b border-slate-100 pb-3 mb-6 flex justify-between items-center">
            <h3 className="text-lg font-bold text-darkNavy">
              Day {day.day_number} — {day.date}
            </h3>
            <span className="text-xs bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-pill">
              {day.activities.length} activities planned
            </span>
          </div>

          <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-6">
            {day.activities.map((act: any, aIdx: number) => (
              <div key={aIdx} className="relative">
                {/* Timeline Dot */}
                <span className="absolute -left-[31px] top-1.5 bg-primary border-4 border-white w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-sm"></span>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded">
                      {act.time}
                    </span>
                    <h4 className="text-xs font-bold text-darkNavy flex items-center gap-1.5">
                      <MapPin size={12} className="text-primary" /> {act.location}
                    </h4>
                  </div>
                  
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    {act.description}
                  </p>

                  <div className="flex items-center gap-3 pt-1.5">
                    {act.google_maps_link && (
                      <a
                        href={act.google_maps_link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-primary hover:text-blue-700 font-semibold flex items-center gap-1"
                      >
                        <Navigation size={10} /> View on Maps
                      </a>
                    )}
                    {act.cost > 0 && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        Est. Cost: ₹{act.cost}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Day Meal Plan Row */}
          {day.meals && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <h4 className="text-xs font-bold text-darkNavy mb-3 flex items-center gap-1">
                <Utensils size={14} className="text-tealAccent" /> Curated Meal Recommendations
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Breakfast */}
                {day.meals.breakfast && (
                  <div className="bg-slate-50 border border-slate-100 rounded-btn p-3 space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                      <span className="flex items-center gap-1"><Coffee size={10} /> BREAKFAST</span>
                      <span className="text-tealAccent">★ {day.meals.breakfast.rating || '4.0'}</span>
                    </div>
                    <h5 className="text-xs font-bold text-darkNavy truncate">{day.meals.breakfast.restaurant_name}</h5>
                    <p className="text-[9px] text-slate-500 leading-tight truncate">{day.meals.breakfast.cuisine}</p>
                    {day.meals.breakfast.deep_link && (
                      <a 
                        href={day.meals.breakfast.deep_link} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[9px] text-primary font-bold hover:underline block pt-1"
                      >
                        Book on Zomato
                      </a>
                    )}
                  </div>
                )}

                {/* Lunch */}
                {day.meals.lunch && (
                  <div className="bg-slate-50 border border-slate-100 rounded-btn p-3 space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                      <span className="flex items-center gap-1"><Utensils size={10} /> LUNCH</span>
                      <span className="text-tealAccent">★ {day.meals.lunch.rating || '4.2'}</span>
                    </div>
                    <h5 className="text-xs font-bold text-darkNavy truncate">{day.meals.lunch.restaurant_name}</h5>
                    <p className="text-[9px] text-slate-500 leading-tight truncate">{day.meals.lunch.cuisine}</p>
                    {day.meals.lunch.deep_link && (
                      <a 
                        href={day.meals.lunch.deep_link} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[9px] text-primary font-bold hover:underline block pt-1"
                      >
                        Book on Zomato
                      </a>
                    )}
                  </div>
                )}

                {/* Dinner */}
                {day.meals.dinner && (
                  <div className="bg-slate-50 border border-slate-100 rounded-btn p-3 space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                      <span className="flex items-center gap-1"><Moon size={10} /> DINNER</span>
                      <span className="text-tealAccent">★ {day.meals.dinner.rating || '4.4'}</span>
                    </div>
                    <h5 className="text-xs font-bold text-darkNavy truncate">{day.meals.dinner.restaurant_name}</h5>
                    <p className="text-[9px] text-slate-500 leading-tight truncate">{day.meals.dinner.cuisine}</p>
                    {day.meals.dinner.deep_link && (
                      <a 
                        href={day.meals.dinner.deep_link} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[9px] text-primary font-bold hover:underline block pt-1"
                      >
                        Book on Zomato
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
