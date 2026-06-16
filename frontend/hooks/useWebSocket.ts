import { useState, useEffect, useRef } from 'react';

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

export interface AgentStatus {
  name: string;
  status: 'waiting' | 'running' | 'done' | 'error';
  message: string;
  partial_result: any;
}

export const useWebSocket = (planId: string | null) => {
  const [agents, setAgents] = useState<Record<string, AgentStatus>>({
    "Safety & Context Agent": { name: "Safety & Context Agent", status: 'waiting', message: 'Waiting to start...', partial_result: null },
    "Travel Agent": { name: "Travel Agent", status: 'waiting', message: 'Waiting to start...', partial_result: null },
    "Accommodation Agent": { name: "Accommodation Agent", status: 'waiting', message: 'Waiting to start...', partial_result: null },
    "Food Agent": { name: "Food Agent", status: 'waiting', message: 'Waiting to start...', partial_result: null },
    "Itinerary Agent": { name: "Itinerary Agent", status: 'waiting', message: 'Waiting to start...', partial_result: null },
  });
  
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [finalItinerary, setFinalItinerary] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!planId) return;

    const wsUrl = `${WS_BASE_URL}/api/ws/plan/${planId}`;
    logger("Connecting to WebSocket:", wsUrl);
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle completed itinerary
        if (data.status === 'complete') {
          setIsCompleted(true);
          setProgress(100);
          setFinalItinerary(data.itinerary);
          ws.close();
          return;
        }

        // Handle error states
        if (data.status === 'error') {
          setError(data.message);
          ws.close();
          return;
        }

        // Handle agent progress events
        if (data.agent) {
          const agentName = data.agent;
          const status = data.status;
          const message = data.message;
          const partialResult = data.partial_result;

          setAgents((prev) => {
            const updated = {
              ...prev,
              [agentName]: {
                name: agentName,
                status,
                message,
                partial_result: partialResult,
              },
            };

            // Calculate progress bar percentage
            // 5 agents total: Safety, Travel, Lodging, Food, Itinerary
            const list = Object.values(updated) as AgentStatus[];
            const doneCount = list.filter((a) => a.status === 'done').length;
            const runningCount = list.filter((a) => a.status === 'running').length;
            
            const percentage = Math.min(Math.round(((doneCount * 20) + (runningCount * 10))), 95);
            setProgress(percentage);
            
            return updated;
          });
        }
      } catch (err) {
        console.error('Error parsing WS message:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      setError('Connection dropped. Retrying...');
    };

    ws.onclose = () => {
      logger('WebSocket connection closed.');
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [planId]);

  function logger(...args: any[]) {
    console.log('[WebSocket Hook]', ...args);
  }

  return {
    agents,
    progress,
    isCompleted,
    finalItinerary,
    error,
  };
};
