'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import IntakeForm from '../../components/Intake/IntakeForm';
import ProgressGrid from '../../components/AgentProgress/ProgressGrid';
import Navbar from '../../components/shared/Navbar';
import '../../lib/i18n'; // Force i18n initialization on client side

export default function PlanPage() {
  const [planId, setPlanId] = useState<string | null>(null);
  const router = useRouter();

  const handlePlanCreated = (id: string) => {
    setPlanId(id);
  };

  const handleGenerationComplete = (itinerary: any) => {
    router.push(`/itinerary/${planId}`);
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-bgPage text-darkNavy flex flex-col items-center justify-center p-4 pt-20 relative overflow-hidden">
        {/* Decorative Glow Elements */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-tealAccent/5 blur-[120px] pointer-events-none"></div>

        <div className="w-full max-w-4xl z-10 py-8">
          {!planId ? (
            <IntakeForm onPlanCreated={handlePlanCreated} />
          ) : (
            <ProgressGrid
              planId={planId}
              onGenerationComplete={handleGenerationComplete}
            />
          )}
        </div>
      </main>
    </>
  );
}
