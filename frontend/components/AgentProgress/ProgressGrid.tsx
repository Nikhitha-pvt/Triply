import React, { useEffect } from 'react';
import { useWebSocket, AgentStatus } from '../../hooks/useWebSocket';
import { Loader2, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

interface ProgressGridProps {
  planId: string;
  onGenerationComplete: (itinerary: any) => void;
}

export default function ProgressGrid({ planId, onGenerationComplete }: ProgressGridProps) {
  const { agents, progress, isCompleted, finalItinerary, error } = useWebSocket(planId);

  useEffect(() => {
    if (isCompleted && finalItinerary) {
      // Delay slightly for smooth transition
      const timer = setTimeout(() => {
        onGenerationComplete(finalItinerary);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isCompleted, finalItinerary, onGenerationComplete]);

  // Map icons based on status
  const renderAgentIcon = (status: AgentStatus['status']) => {
    switch (status) {
      case 'running':
        return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
      case 'done':
        return <CheckCircle2 className="w-5 h-5 text-tealAccent" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  // Get status color coding
  const getCardClasses = (status: AgentStatus['status']) => {
    switch (status) {
      case 'running':
        return 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm';
      case 'done':
        return 'border-tealAccent/20 bg-tealAccent/[0.02]';
      case 'error':
        return 'border-red-200 bg-red-50/50';
      default:
        return 'border-slate-200 bg-white opacity-60';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      
      {/* Top Card with Global Progress Bar */}
      <div className="bg-white border border-slate-200 shadow-card rounded-card p-6 text-center">
        <h2 className="text-xl font-bold text-darkNavy">AI Agent Workspace</h2>
        <p className="text-xs text-slate-500 mt-1">Our specialized agents are building your custom day-by-day plan...</p>
        
        {/* Global Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2.5 mt-6 relative overflow-hidden">
          <div 
            className="bg-gradient-to-r from-primary to-tealAccent h-2.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between items-center text-xs font-semibold mt-2">
          <span className="text-slate-400">Planning trip...</span>
          <span className="text-primary">{progress}%</span>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-btn text-xs font-semibold">
            {error}
          </div>
        )}
      </div>

      {/* Grid of Agent Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.values(agents).map((agent) => (
          <div
            key={agent.name}
            className={`border rounded-card p-4 transition-all duration-300 flex items-start space-x-3 ${getCardClasses(
              agent.status
            )}`}
          >
            <div className="mt-0.5">{renderAgentIcon(agent.status)}</div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-darkNavy truncate">{agent.name}</h4>
                <span 
                  className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-pill ${
                    agent.status === 'running' 
                      ? 'bg-primary/10 text-primary animate-pulse'
                      : agent.status === 'done'
                      ? 'bg-tealAccent/10 text-tealAccent'
                      : agent.status === 'error'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {agent.status}
                </span>
              </div>
              
              <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed font-medium">
                {agent.message}
              </p>

              {/* Show result snippet if complete */}
              {agent.status === 'done' && agent.partial_result && (
                <div className="mt-2 text-[10px] bg-slate-50 border border-slate-100 rounded p-2 text-slate-600 font-mono overflow-x-auto whitespace-pre-wrap">
                  {agent.name === 'Safety & Context Agent' && (
                    <span>Constraint flags: {JSON.stringify(agent.partial_result.special_flags)}</span>
                  )}
                  {agent.name === 'Travel Agent' && (
                    <span>Transport options sorted by budget.</span>
                  )}
                  {agent.name === 'Accommodation Agent' && (
                    <span>Hotel listings retrieved successfully.</span>
                  )}
                  {agent.name === 'Food Agent' && (
                    <span>Meal schedules planned successfully.</span>
                  )}
                  {agent.name === 'Itinerary Agent' && (
                    <span>Plan details formatted.</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
