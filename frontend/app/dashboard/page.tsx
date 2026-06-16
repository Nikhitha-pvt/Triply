"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getTrips } from '@/lib/api';
import Navbar from '@/components/shared/Navbar';
import { Plane, Map, Calendar, ArrowRight, AlertCircle, Plus } from 'lucide-react';

export default function DashboardPage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Read session
    const activeUser = localStorage.getItem('triply_user');
    const parsedUser = activeUser ? JSON.parse(activeUser) : null;
    setUser(parsedUser);

    async function fetchTrips() {
      if (!parsedUser) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await getTrips();
        setTrips(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTrips();

    // Listen for auth changes
    const handleAuthChange = () => {
      const u = localStorage.getItem('triply_user');
      const pUser = u ? JSON.parse(u) : null;
      setUser(pUser);
      if (pUser) {
        // Fetch trips
        getTrips().then(setTrips).catch(err => setError(err.message)).finally(() => setLoading(false));
      } else {
        setTrips([]);
        setLoading(false);
      }
    };
    window.addEventListener('triply-auth-change', handleAuthChange);

    return () => {
      window.removeEventListener('triply-auth-change', handleAuthChange);
    };
  }, []);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-50 pt-24 pb-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-darkNavy flex items-center gap-2">
              <Plane className="text-primary" /> Past Trips
            </h1>
            <p className="text-sm text-slate-500 mt-1">Manage and view your generated itineraries</p>
          </div>
          <Link href="/plan" className="bg-primary text-white font-bold py-2 px-4 rounded-btn flex items-center gap-2 hover:bg-primary-dark transition shadow-sm">
            <Plus size={18} /> New Trip
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-card mb-6 flex items-center gap-3 text-sm">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {!user ? (
          <div className="bg-white border border-slate-200 rounded-card p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-400">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-lg font-bold text-darkNavy mb-2">Access Denied</h2>
            <p className="text-slate-500 text-sm max-w-sm mb-6">Please sign in to your Triply AI account to view your past trips and saved itineraries.</p>
            <button
              onClick={() => window.dispatchEvent(new Event('triply-open-login'))}
              className="bg-primary text-white font-bold py-2.5 px-6 rounded-btn hover:bg-primary-dark transition shadow-md shadow-blue-500/20"
            >
              Sign In / Sign Up
            </button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-card h-48 border border-slate-100 animate-pulse"></div>
            ))}
          </div>
        ) : trips.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-card p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Map size={32} className="text-slate-300" />
            </div>
            <h2 className="text-lg font-bold text-darkNavy mb-2">No trips planned yet</h2>
            <p className="text-slate-500 text-sm max-w-sm mb-6">You haven't generated any itineraries yet. Let's start planning your next big adventure.</p>
            <Link href="/plan" className="text-primary font-bold hover:underline flex items-center gap-1">
              Start Planning <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip: any) => {
              const req = trip.trip_request;
              const isPending = trip.status === 'pending';
              const isFailed = trip.status === 'failed';
              
              let statusStyle = "bg-green-100 text-green-700";
              let statusLabel = "Completed";
              if (isPending) {
                statusStyle = "bg-amber-100 text-amber-700";
                statusLabel = "Generating...";
              } else if (isFailed) {
                statusStyle = "bg-red-100 text-red-700";
                statusLabel = "Failed";
              }

              return (
                <div key={trip.id} className="bg-white border border-slate-200 rounded-card p-5 shadow-sm hover:shadow-md transition flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${statusStyle}`}>
                      {statusLabel}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {new Date(trip.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {req ? (
                    <>
                      <h3 className="text-lg font-extrabold text-darkNavy mb-1">
                        {req.destination}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mb-4">
                        <Map size={12} className="opacity-50" /> {req.origin} to {req.destination}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-3 mb-5 border-t border-slate-50 pt-4">
                        <div className="text-[10px]">
                          <span className="text-slate-400 font-bold block mb-0.5 uppercase tracking-wider">Dates</span>
                          <span className="text-slate-700 font-semibold flex items-center gap-1">
                            <Calendar size={10} /> 
                            {new Date(req.start_date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                          </span>
                        </div>
                        <div className="text-[10px]">
                          <span className="text-slate-400 font-bold block mb-0.5 uppercase tracking-wider">Budget</span>
                          <span className="text-slate-700 font-semibold">
                            ₹{req.budget_inr?.toLocaleString() || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 text-sm text-slate-500 italic py-4">Incomplete Data</div>
                  )}
                  
                  <div className="mt-auto pt-4 border-t border-slate-100">
                    {isPending ? (
                      <Link href={`/plan/generating?id=${trip.id}`} className="text-amber-600 text-xs font-bold hover:underline flex items-center justify-center gap-1">
                        View Progress <ArrowRight size={14} />
                      </Link>
                    ) : isFailed ? (
                      <button className="text-slate-400 text-xs font-bold cursor-not-allowed flex items-center justify-center gap-1 w-full">
                        Cannot View
                      </button>
                    ) : (
                      <Link href={`/itinerary/${trip.id}`} className="text-primary text-xs font-bold hover:underline flex items-center justify-center gap-1">
                        View Itinerary <ArrowRight size={14} />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
