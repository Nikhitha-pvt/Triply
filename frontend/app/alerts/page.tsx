"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getPriceAlerts, deletePriceAlert } from '@/lib/api';
import Navbar from '@/components/shared/Navbar';
import { Bell, Trash2, TrendingDown, ArrowRight, AlertTriangle, Car, Home } from 'lucide-react';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAlerts();
  }, []);

  async function fetchAlerts() {
    setLoading(true);
    try {
      const data = await getPriceAlerts();
      setAlerts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deletePriceAlert(id);
      setAlerts(alerts.filter(a => a.id !== id));
    } catch (err: any) {
      alert("Failed to delete alert: " + err.message);
    }
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-50 pt-24 pb-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-darkNavy flex items-center gap-2">
              <Bell className="text-primary" /> Price Alerts
            </h1>
            <p className="text-sm text-slate-500 mt-1">Track target prices for flights, buses, and hotels</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-card mb-6 flex items-center gap-3 text-sm">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="bg-white rounded-card h-32 border border-slate-100 animate-pulse"></div>
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-card p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <TrendingDown size={32} className="text-slate-300" />
            </div>
            <h2 className="text-lg font-bold text-darkNavy mb-2">No Active Alerts</h2>
            <p className="text-slate-500 text-sm max-w-sm mb-6">You are not tracking any prices right now. You can set price alerts from your itinerary page when replanning segments.</p>
            <Link href="/dashboard" className="text-primary font-bold hover:underline flex items-center gap-1">
              Go to Dashboard <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert: any) => {
              const isMet = alert.status === 'met';
              const isTransport = alert.segment_type === 'transport';
              const Icon = isTransport ? Car : Home;
              const provider = isTransport ? alert.segment_data?.provider : alert.segment_data?.name;
              const originalPrice = isTransport ? alert.segment_data?.price_inr : alert.segment_data?.total_price_inr;

              return (
                <div key={alert.id} className={`bg-white border ${isMet ? 'border-green-200 shadow-md' : 'border-slate-200 shadow-sm'} rounded-card p-5 flex flex-col md:flex-row items-center gap-6 transition`}>
                  <div className="w-full md:w-auto flex-shrink-0 flex items-center justify-center md:justify-start">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isMet ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'}`}>
                      <Icon size={24} />
                    </div>
                  </div>
                  
                  <div className="flex-1 w-full text-center md:text-left space-y-1">
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <span className="text-[10px] uppercase font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                        {alert.segment_type}
                      </span>
                      {isMet && (
                        <span className="text-[10px] uppercase font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded">
                          Target Reached!
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-darkNavy">{provider || 'Unknown Provider'}</h3>
                    <div className="text-xs text-slate-500 flex justify-center md:justify-start gap-4">
                      <span>Trip: {alert.trip_id.substring(0, 8)}...</span>
                      <span>Created: {new Date(alert.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="w-full md:w-auto flex flex-row md:flex-col items-center justify-between md:justify-center border-t border-slate-100 pt-4 md:border-none md:pt-0">
                    <div className="text-center">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Target Price</div>
                      <div className="text-xl font-black text-darkNavy">₹{alert.target_price_inr.toLocaleString()}</div>
                      {originalPrice && (
                        <div className="text-[10px] text-slate-400 line-through">₹{originalPrice.toLocaleString()}</div>
                      )}
                    </div>
                  </div>

                  <div className="w-full md:w-auto flex justify-center mt-4 md:mt-0">
                    <button 
                      onClick={() => handleDelete(alert.id)}
                      className="text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition"
                      title="Delete Alert"
                    >
                      <Trash2 size={20} />
                    </button>
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
