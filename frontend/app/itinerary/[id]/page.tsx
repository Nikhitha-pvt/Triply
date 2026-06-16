"use client";

import React, { useEffect, useState } from 'react';
import { getItinerary, getPdfExportUrl, replanSegment, updateItinerary } from '@/lib/api';
import Navbar from '@/components/shared/Navbar';
import { 
  CalendarDays, 
  Map, 
  CreditCard, 
  Car, 
  Home, 
  Utensils, 
  Briefcase,
  AlertTriangle,
  Download,
  Share2,
  HelpCircle,
  X,
  RefreshCw,
  Check
} from 'lucide-react';
import DayTimeline from '@/components/Itinerary/DayTimeline';
import BudgetBreakdown from '@/components/Budget/BudgetBreakdown';
import PackingChecklist from '@/components/Packing/PackingChecklist';
import CrowdHeatmap from '@/components/Heatmap/CrowdHeatmap';

const DEMO_ITINERARY = {
  "trip_request": {
    "origin": "Vijaywada",
    "destination": "Chennai",
    "start_date": "2026-06-20",
    "end_date": "2026-06-22",
    "adults": 5,
    "children": 0,
    "infants": 0,
    "budget_inr": 45000.0,
    "trip_purpose": "Family",
    "transport_modes": ["Train", "Cab"],
    "accommodation_type": "3-star",
    "diet_type": "Vegetarian",
    "cuisines": ["South Indian", "North Indian"],
    "meal_budget_per_day": 800.0,
    "split_type": "custom",
    "traveller_names": ["Niks", "Venky", "Krish", "Keerthi", "Rishi"]
  },
  "days": [
    {
      "day_number": 1,
      "date": "2026-06-20",
      "activities": [
        {
          "time": "08:00 AM",
          "location": "Transit from Vijaywada",
          "description": "Board the train from Vijaywada to Chennai Central. Enjoy the 6-hour comfortable express ride with your family.",
          "google_maps_link": "https://www.google.com/maps/search/?api=1&query=Vijaywada+to+Chennai+train",
          "cost": 0
        },
        {
          "time": "02:30 PM",
          "location": "Saravana Bhavan (Lunch)",
          "description": "Head over to Saravana Bhavan for an authentic South Indian vegetarian feast.",
          "google_maps_link": "https://www.google.com/maps/search/?api=1&query=Saravana+Bhavan+Chennai",
          "cost": 400
        },
        {
          "time": "04:30 PM",
          "location": "Marina Beach & Santhome Cathedral",
          "description": "Take a pleasant sunset stroll on Marina Beach, fly kites, and visit the historical Santhome Cathedral nearby.",
          "google_maps_link": "https://www.google.com/maps/search/?api=1&query=Marina+Beach+Chennai",
          "cost": 0
        }
      ],
      "meals": {
        "breakfast": { "restaurant_name": "Train Pantry", "cuisine": "South Indian", "rating": 3.8, "avg_cost_for_two": 150, "google_maps_link": "https://google.com", "deep_link": "https://zomato.com" },
        "lunch": { "restaurant_name": "Saravana Bhavan (Lunch)", "cuisine": "Vegetarian South Indian", "rating": 4.3, "avg_cost_for_two": 350, "google_maps_link": "https://google.com", "deep_link": "https://www.zomato.com/search?q=Saravana+Bhavan+Chennai" },
        "dinner": { "restaurant_name": "Murugan Idli Shop", "cuisine": "South Indian Tiffins", "rating": 4.4, "avg_cost_for_two": 250, "google_maps_link": "https://google.com", "deep_link": "https://www.zomato.com/search?q=Murugan+Idli+Shop+Chennai" }
      }
    },
    {
      "day_number": 2,
      "date": "2026-06-21",
      "activities": [
        {
          "time": "09:00 AM",
          "location": "Mahabalipuram Shore Temples Excursion",
          "description": "Drive to Mahabalipuram to explore the rock-cut Shore Temples, Pancha Rathas, and Krishna's Butterball. A rich heritage UNESCO site.",
          "google_maps_link": "https://www.google.com/maps/search/?api=1&query=Mahabalipuram+temples",
          "cost": 250
        },
        {
          "time": "03:30 PM",
          "location": "Kapaleeshwarar Temple (Mylapore)",
          "description": "Explore the grand Dravidian architecture of Mylapore Kapaleeshwarar Temple. Walk through local shopping streets around the temple tank.",
          "google_maps_link": "https://www.google.com/maps/search/?api=1&query=Kapaleeshwarar+Temple+Chennai",
          "cost": 0
        }
      ],
      "meals": {
        "breakfast": { "restaurant_name": "Hotel Saravana Grand", "cuisine": "South Indian", "rating": 4.1, "avg_cost_for_two": 250, "google_maps_link": "https://google.com", "deep_link": "https://www.zomato.com/search?q=Saravana+Grand+Chennai" },
        "lunch": { "restaurant_name": "Anjappar Chettinad", "cuisine": "Chettinad Vegetarian", "rating": 4.0, "avg_cost_for_two": 500, "google_maps_link": "https://google.com", "deep_link": "https://www.zomato.com/search?q=Anjappar+Chettinad+Chennai" },
        "dinner": { "restaurant_name": "Buhari Restaurant (Dinner)", "cuisine": "North Indian & Biryani", "rating": 4.2, "avg_cost_for_two": 600, "google_maps_link": "https://google.com", "deep_link": "https://www.zomato.com/search?q=Buhari+Chennai" }
      }
    },
    {
      "day_number": 3,
      "date": "2026-06-22",
      "activities": [
        {
          "time": "09:00 AM",
          "location": "Mylapore Heritage Stroll & Shopping",
          "description": "Shop for traditional silk sarees, brass lamps, and enjoy filter coffee in the cultural heart of Mylapore.",
          "google_maps_link": "https://www.google.com/maps/search/?api=1&query=Mylapore+market",
          "cost": 0
        },
        {
          "time": "12:00 PM",
          "location": "Comfort Inn Chennai (Checkout)",
          "description": "Checkout of the hotel and pack luggage, preparing for return departure.",
          "google_maps_link": "https://www.google.com/maps/search/?api=1&query=Comfort+Inn+Chennai",
          "cost": 0
        },
        {
          "time": "03:00 PM",
          "location": "Transit to Vijaywada",
          "description": "Board the return train back to Vijaywada, ending your memorable Chennai family holiday.",
          "google_maps_link": "https://www.google.com/maps/search/?api=1&query=Chennai+to+Vijaywada+train",
          "cost": 0
        }
      ],
      "meals": {
        "breakfast": { "restaurant_name": "Mylapore Filter Coffee", "cuisine": "Tiffins & Coffee", "rating": 4.5, "avg_cost_for_two": 100, "google_maps_link": "https://google.com", "deep_link": "https://www.zomato.com/search?q=Mylapore+Filter+Coffee" },
        "lunch": { "restaurant_name": "Saravana Bhavan (Lunch)", "cuisine": "Meals & South Indian", "rating": 4.3, "avg_cost_for_two": 350, "google_maps_link": "https://google.com", "deep_link": "https://www.zomato.com/search?q=Saravana+Bhavan+Chennai" },
        "dinner": { "restaurant_name": "Hometown Diner", "cuisine": "Quick bites", "rating": 3.9, "avg_cost_for_two": 200, "google_maps_link": "https://google.com", "deep_link": "https://www.zomato.com" }
      }
    }
  ],
  "transport_options": [
    { "id": "trans_train_demo", "provider": "Indian Railways (Express)", "mode": "Train", "class_type": "Train - 3AC", "departure_time": "08:00 AM", "arrival_time": "02:00 PM", "duration": "6h 00m", "price_inr": 1200, "booking_link": "https://www.redbus.in/train-tickets/vijayawada-to-chennai-trains", "details": "Express Train. Preferred berth: Lower Berth requested. Catering services available on-board." },
    { "id": "trans_cab_demo", "provider": "MakeMyTrip Outstation", "mode": "Cab", "class_type": "Sedan (Dzire)", "departure_time": "07:00 AM", "arrival_time": "01:30 PM", "duration": "6h 30m", "price_inr": 6500, "booking_link": "https://www.makemytrip.com/cabs/outstation-cabs.html", "details": "One-way outstation cab." }
  ],
  "accommodation_options": [
    { "id": "hotel_demo", "name": "Comfort Inn Chennai", "rating": 4.2, "location": "Mylapore, Chennai", "amenities": ["WiFi", "AC", "Breakfast included", "Elevator"], "price_per_night_inr": 2800, "total_price_inr": 5600, "booking_link": "https://www.booking.com/hotel/in/comfort-inn-chennai.html" },
    { "id": "hotel_demo_2", "name": "Grand Palace Hotel", "rating": 4.5, "location": "T. Nagar, Chennai", "amenities": ["WiFi", "AC", "Breakfast included", "Pool"], "price_per_night_inr": 4200, "total_price_inr": 8400, "booking_link": "https://www.booking.com/hotel/in/grand-palace-chennai.html" }
  ],
  "budget_breakdown": {
    "transport_cost": 6000,
    "accommodation_cost": 5600,
    "food_cost": 12000,
    "activities_cost": 2500,
    "buffer_cost": 2610,
    "total_cost": 28710,
    "overspent": false
  },
  "group_split": {
    "shares": [
      { "name": "Niks", "amount_owed": 5742.0 },
      { "name": "Venky", "amount_owed": 5742.0 },
      { "name": "Krish", "amount_owed": 5742.0 },
      { "name": "Keerthi", "amount_owed": 5742.0 },
      { "name": "Rishi", "amount_owed": 5742.0 }
    ],
    "settlement_transactions": [
      { "debtor": "Venky", "creditor": "Niks", "amount": 5742.0 },
      { "debtor": "Krish", "creditor": "Niks", "amount": 5742.0 },
      { "debtor": "Keerthi", "creditor": "Niks", "amount": 5742.0 },
      { "debtor": "Rishi", "creditor": "Niks", "amount": 5742.0 }
    ]
  },
  "packing_list": [
    { "category": "Clothing", "items": [{ "name": "Lightweight cotton shirts", "checked": false }, { "name": "Comfortable walking shoes", "checked": false }, { "name": "Traditional outfits (for temples)", "checked": false }] },
    { "category": "Electronics", "items": [{ "name": "Mobile chargers", "checked": false }, { "name": "Power bank", "checked": false }] },
    { "category": "Documents", "items": [{ "name": "Aadhar ID Cards", "checked": false }, { "name": "Train tickets", "checked": false }] }
  ],
  "crowd_heatmap": [
    { "date": "2026-06-17", "crowd_level": "amber", "reason": "Standard summer tourist crowd", "events": ["Mylapore market bazaar"] },
    { "date": "2026-06-18", "crowd_level": "amber", "reason": "Standard summer tourist crowd", "events": ["Weekly temple stroll"] },
    { "date": "2026-06-19", "crowd_level": "amber", "reason": "Standard summer tourist crowd", "events": ["Heritage art walk"] },
    { "date": "2026-06-20", "crowd_level": "amber", "reason": "Weekend arrival rush", "events": ["Marina beach sunset carnival"] },
    { "date": "2026-06-21", "crowd_level": "red", "reason": "Peak temple visitor day (Sunday)", "events": ["Weekly Market Day"] },
    { "date": "2026-06-22", "crowd_level": "amber", "reason": "Standard weekday traffic", "events": ["Mylapore local fair"] }
  ],
  "risk_score": 85.0,
  "risk_factors": [
    { "factor": "Summer Temperatures", "score": 15, "description": "High humidity and temperature in Chennai; keep hydrated." }
  ],
  "weather_forecast": [
    { "date": "2026-06-20", "temp_c": 34, "condition": "Sunny / Hot" },
    { "date": "2026-06-21", "temp_c": 33, "condition": "Partly Cloudy" },
    { "date": "2026-06-22", "temp_c": 35, "condition": "Sunny" }
  ]
};

export default function ItineraryPage({ params }: { params: { id: string } }) {
  const [itinerary, setItinerary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Tooltip & Toast States
  const [showRiskTooltip, setShowRiskTooltip] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);

  // Replanning Modal States
  const [showReplanModal, setShowReplanModal] = useState(false);
  const [replanType, setReplanType] = useState<'transport' | 'hotel'>('transport');
  const [replanOptions, setReplanOptions] = useState<any[]>([]);
  const [loadingReplan, setLoadingReplan] = useState(false);
  const [selectedNewOption, setSelectedNewOption] = useState<any>(null);
  const [replanMessage, setReplanMessage] = useState('');

  useEffect(() => {
    async function fetchData() {
      if (params.id === 'demo-trip') {
        setItinerary(DEMO_ITINERARY);
        setLoading(false);
        return;
      }
      try {
        const data = await getItinerary(params.id);
        setItinerary(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !itinerary) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-6 bg-white rounded-card shadow-card animate-fade-in-up">
          <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-lg font-bold text-darkNavy mb-2">Failed to load itinerary</h2>
          <p className="text-slate-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const { trip_request, days, transport_options, accommodation_options, budget_breakdown, group_split, packing_list, crowd_heatmap, risk_score, risk_factors, weather_forecast } = itinerary;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Map size={16} /> },
    { id: 'timeline', label: 'Day-by-Day', icon: <CalendarDays size={16} /> },
    { id: 'budget', label: 'Budget', icon: <CreditCard size={16} /> },
    { id: 'transport', label: 'Transport', icon: <Car size={16} /> },
    { id: 'stay', label: 'Stay', icon: <Home size={16} /> },
    { id: 'packing', label: 'Packing', icon: <Briefcase size={16} /> },
    { id: 'heatmap', label: 'Heatmap', icon: <AlertTriangle size={16} /> },
  ];

  // Handle Share Click
  const handleShareClick = async () => {
    const link = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Triply AI: ${trip_request.origin} to ${trip_request.destination}`,
          text: `Check out my travel plan to ${trip_request.destination}!`,
          url: link,
        });
      } catch (err) {
        console.log("Navigator share failed", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(link);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 2200);
      } catch (err) {
        console.error("Clipboard copy failed", err);
      }
    }
  };

  // Open Replan dialog
  const openReplan = async (type: 'transport' | 'hotel') => {
    setReplanType(type);
    setReplanOptions([]);
    setSelectedNewOption(null);
    setReplanMessage('');
    setShowReplanModal(true);
    setLoadingReplan(true);

    try {
      const currentOptions = type === 'transport' ? transport_options : accommodation_options;
      const excludeIds = currentOptions.map((o: any) => o.id);
      
      const data = await replanSegment(params.id, type, excludeIds);
      setReplanOptions(data);
      if (data.length === 0) {
        setReplanMessage('No alternative options found matching your constraints.');
      }
    } catch (err: any) {
      setReplanMessage('Error retrieving replan alternatives.');
    } finally {
      setLoadingReplan(false);
    }
  };

  // Save new selected option from Replan modal
  const handleReplanSelectSubmit = async () => {
    if (!selectedNewOption) return;
    setLoadingReplan(true);

    try {
      const updatedItinerary = { ...itinerary };

      if (replanType === 'transport') {
        // Swap transport option
        updatedItinerary.transport_options = [selectedNewOption, ...transport_options.filter((o: any) => o.id !== selectedNewOption.id)];
        
        // Recalculate transport subtotal
        const totalPsg = trip_request.adults + trip_request.children + trip_request.infants;
        const newTransTotal = selectedNewOption.price_inr * totalPsg;
        updatedItinerary.budget_breakdown.transport_cost = newTransTotal;
      } else {
        // Swap stay option
        updatedItinerary.accommodation_options = [selectedNewOption, ...accommodation_options.filter((o: any) => o.id !== selectedNewOption.id)];
        
        // Recalculate accommodation subtotal
        const stayDays = maxDays((trip_request.end_date), (trip_request.start_date));
        const newStayTotal = selectedNewOption.price_per_night_inr * stayDays;
        updatedItinerary.budget_breakdown.accommodation_cost = newStayTotal;
      }

      // Recalculate complete budget totals
      const subtotal = updatedItinerary.budget_breakdown.transport_cost + 
                        updatedItinerary.budget_breakdown.accommodation_cost + 
                        updatedItinerary.budget_breakdown.food_cost + 
                        updatedItinerary.budget_breakdown.activities_cost;
      const buffer = roundDec(subtotal * 0.1);
      const total = roundDec(subtotal + buffer);

      updatedItinerary.budget_breakdown.buffer_cost = buffer;
      updatedItinerary.budget_breakdown.total_cost = total;
      updatedItinerary.budget_breakdown.overspent = total > trip_request.budget_inr;

      // Update Group split shares
      if (updatedItinerary.group_split) {
        const numP = updatedItinerary.group_split.shares.length || 1;
        const equalShare = roundDec(total / numP);
        updatedItinerary.group_split.shares.forEach((s: any) => {
          s.amount_owed = equalShare;
        });
        if (updatedItinerary.group_split.settlement_transactions) {
          updatedItinerary.group_split.settlement_transactions.forEach((tx: any) => {
            tx.amount = equalShare;
          });
        }
      }

      // Save to database
      if (params.id !== 'demo-trip') {
        await updateItinerary(params.id, {
          itinerary_json: updatedItinerary,
          total_cost_inr: total,
          risk_score: updatedItinerary.risk_score
        });
      }

      // Update local state
      setItinerary(updatedItinerary);
      setShowReplanModal(false);
    } catch (err: any) {
      setReplanMessage(err.message || 'Failed to apply changes.');
    } finally {
      setLoadingReplan(false);
    }
  };

  function roundDec(num: number): number {
    return Math.round(num * 100) / 100;
  }

  function maxDays(d1: string, d2: string): number {
    const t1 = new Date(d1).getTime();
    const t2 = new Date(d2).getTime();
    return Math.max(Math.ceil((t1 - t2) / 86400000), 1);
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-50 pb-20 pt-16 relative">
      
      {/* Toast Feedback */}
      {showShareToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-tealAccent text-white text-xs font-bold px-4 py-2.5 rounded-pill shadow-xl flex items-center gap-1.5 animate-bounce-subtle">
          <Check size={14} /> Itinerary link copied to clipboard!
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-darkNavy">
              {trip_request.origin} to {trip_request.destination}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {new Date(trip_request.start_date).toLocaleDateString()} - {new Date(trip_request.end_date).toLocaleDateString()} • {trip_request.adults} Adults
            </p>
          </div>
          <div className="flex gap-2">
            <a 
              href={params.id === 'demo-trip' ? '#' : getPdfExportUrl(params.id)}
              onClick={(e) => {
                if (params.id === 'demo-trip') {
                  e.preventDefault();
                  alert("PDF export is only available for custom generated itineraries!");
                }
              }}
              target={params.id === 'demo-trip' ? undefined : "_blank"}
              rel="noreferrer"
              className="p-2 border border-slate-200 rounded-btn text-slate-600 hover:bg-slate-50 transition"
              title="Download PDF"
            >
              <Download size={18} />
            </a>
            <button 
              onClick={handleShareClick}
              className="p-2 bg-primary text-white rounded-btn hover:bg-primary-dark transition shadow-sm"
              title="Share Itinerary"
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="max-w-4xl mx-auto px-4 overflow-x-auto hide-scrollbar">
          <div className="flex space-x-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 border-b-2 text-sm font-bold whitespace-nowrap transition-colors ${
                  activeTab === tab.id 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div 
                className="bg-white p-4 rounded-card border border-slate-200 shadow-sm text-center relative cursor-pointer group"
                onMouseEnter={() => setShowRiskTooltip(true)}
                onMouseLeave={() => setShowRiskTooltip(false)}
                onClick={() => setShowRiskTooltip(!showRiskTooltip)}
              >
                <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-center gap-1">
                  Risk Score <HelpCircle size={10} className="text-slate-400" />
                </div>
                <div className={`text-xl font-black mt-1 ${risk_score < 70 ? 'text-red-500' : 'text-tealAccent'}`}>
                  {risk_score}/100
                </div>

                {/* Risk Score explanation Tooltip */}
                {showRiskTooltip && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 bg-slate-900/95 backdrop-blur-sm text-white text-[10px] p-2.5 rounded-lg shadow-xl text-left leading-relaxed z-35 font-medium border border-white/10">
                    <p className="font-bold text-primary mb-1">What is Risk Score?</p>
                    The Risk Score measures the safety and compliance of your itinerary. Penalities are applied for overspending the budget, monsoon/rain forecasts, infant safety needs, and mobility barriers. Higher is better/safer.
                  </div>
                )}
              </div>
              <div className="bg-white p-4 rounded-card border border-slate-200 shadow-sm text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Est. Cost</div>
                <div className="text-xl font-black mt-1 text-darkNavy">
                  ₹{budget_breakdown.total_cost.toLocaleString()}
                </div>
              </div>
              <div className="bg-white p-4 rounded-card border border-slate-200 shadow-sm text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Duration</div>
                <div className="text-xl font-black mt-1 text-darkNavy">
                  {days.length} Days
                </div>
              </div>
              <div className="bg-white p-4 rounded-card border border-slate-200 shadow-sm text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Theme</div>
                <div className="text-lg font-black mt-1 text-primary">
                  {trip_request.trip_purpose}
                </div>
              </div>
            </div>

            {/* Quick Actions (Replanning) */}
            <div className="bg-primary/5 border border-primary/10 rounded-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-darkNavy">Not happy with the options?</h4>
                <p className="text-xs text-slate-500 mt-0.5">Customize specific segments using our What-If Replanning agent.</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button 
                  onClick={() => openReplan('transport')}
                  className="flex-1 sm:flex-initial bg-white text-primary text-xs font-bold px-4 py-2 border border-primary/20 rounded-btn shadow-sm hover:bg-slate-50 transition"
                >
                  Replan Transport
                </button>
                <button 
                  onClick={() => openReplan('hotel')}
                  className="flex-1 sm:flex-initial bg-white text-primary text-xs font-bold px-4 py-2 border border-primary/20 rounded-btn shadow-sm hover:bg-slate-50 transition"
                >
                  Replan Stay
                </button>
              </div>
            </div>
            
            {/* Risk Factors Highlight */}
            {risk_factors && risk_factors.length > 0 && (
              <div className="bg-white p-5 rounded-card border border-slate-200 shadow-sm animate-fade-in-up">
                <h3 className="text-sm font-bold text-darkNavy mb-3 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-500" /> Safety & Context Advisories
                </h3>
                <div className="space-y-3">
                  {risk_factors.map((rf: any, i: number) => (
                    <div key={i} className="flex gap-3 items-start bg-slate-50 p-3 rounded-btn border border-slate-100">
                      <div className={`mt-0.5 w-2 h-2 rounded-full ${rf.score > 15 ? 'bg-red-500' : 'bg-amber-400'}`}></div>
                      <div>
                        <div className="text-xs font-bold text-darkNavy">{rf.factor}</div>
                        <div className="text-[10px] text-slate-500">{rf.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Timeline Tab */}
        {activeTab === 'timeline' && (
          <div className="animate-fade-in-up">
            <DayTimeline days={days} />
          </div>
        )}

        {/* Budget Tab */}
        {activeTab === 'budget' && (
          <div className="animate-fade-in-up">
            <BudgetBreakdown budget={budget_breakdown} groupSplit={group_split} tripRequest={trip_request} />
          </div>
        )}

        {/* Transport Tab */}
        {activeTab === 'transport' && (
          <div className="space-y-4 animate-fade-in-up">
            <h3 className="text-sm font-bold text-darkNavy uppercase tracking-wider mb-2">Transport Options</h3>
            {transport_options.map((opt: any, idx: number) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-card p-4 shadow-sm flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded">{opt.mode}</span>
                    <span className="text-xs font-bold text-darkNavy">{opt.provider}</span>
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    {opt.departure_time} ➔ {opt.arrival_time} • {opt.duration}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">{opt.details}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-darkNavy">₹{opt.price_inr.toLocaleString()}</div>
                  <a href={opt.booking_link} target="_blank" rel="noreferrer" className="text-[10px] text-primary font-bold hover:underline block pt-1">
                    Book Now
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stay Tab */}
        {activeTab === 'stay' && (
          <div className="space-y-4 animate-fade-in-up">
            <h3 className="text-sm font-bold text-darkNavy uppercase tracking-wider mb-2">Accommodation Options</h3>
            {accommodation_options.map((hotel: any, idx: number) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-card p-4 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-bold text-darkNavy">{hotel.name}</h4>
                    <span className="text-[10px] bg-tealAccent/10 text-tealAccent font-bold px-2 py-0.5 rounded">★ {hotel.rating}</span>
                  </div>
                  <div className="text-xs text-slate-500 font-medium flex items-center gap-1 mb-2">
                    <Map size={12} /> {hotel.location}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {hotel.amenities.map((am: string, i: number) => (
                      <span key={i} className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{am}</span>
                    ))}
                  </div>
                </div>
                <div className="text-right border-t border-slate-100 pt-3 md:border-none md:pt-0">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Total for Stay</div>
                  <div className="text-xl font-black text-darkNavy">₹{hotel.total_price_inr.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-500 mb-1">(₹{hotel.price_per_night_inr.toLocaleString()} / night)</div>
                  <a href={hotel.booking_link} target="_blank" rel="noreferrer" className="inline-block bg-primary text-white text-xs font-bold px-4 py-2 rounded-btn hover:bg-primary-dark transition shadow-sm mt-1">
                    View & Book
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Packing Tab */}
        {activeTab === 'packing' && (
          <div className="animate-fade-in-up">
            <PackingChecklist items={packing_list} />
          </div>
        )}

        {/* Heatmap Tab */}
        {activeTab === 'heatmap' && (
          <div className="animate-fade-in-up">
            <CrowdHeatmap data={crowd_heatmap} />
          </div>
        )}
      </div>
      </div>

      {/* REPLAN MODAL */}
      {showReplanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-[#0F2044]/65 backdrop-blur-sm"
            onClick={() => setShowReplanModal(false)}
          />

          <div className="relative bg-white w-full max-w-md rounded-card shadow-2xl border border-slate-200 p-6 z-10 animate-fade-in-up">
            <button 
              onClick={() => setShowReplanModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition p-1"
            >
              <X size={18} />
            </button>

            <h3 className="text-base font-black text-darkNavy mb-1 flex items-center gap-2">
              <RefreshCw size={18} className="text-primary" /> What-If Segment Replanning
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Re-executing the agent logic to find safer/better alternative option candidates:
            </p>

            {replanMessage && (
              <div className="mb-4 p-2.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-btn text-xs font-medium">
                {replanMessage}
              </div>
            )}

            {loadingReplan ? (
              <div className="py-10 text-center flex flex-col items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="text-xs text-slate-500 font-medium animate-pulse">Running specialized agent pipelines...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1">
                  {replanOptions.map((opt: any) => {
                    const isSelected = selectedNewOption?.id === opt.id;
                    return (
                      <div 
                        key={opt.id}
                        onClick={() => setSelectedNewOption(opt)}
                        className={`p-3.5 border rounded-btn cursor-pointer transition flex justify-between items-center ${
                          isSelected 
                            ? 'bg-primary/5 border-primary shadow-sm' 
                            : 'border-slate-200 bg-white hover:border-slate-400'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-darkNavy">
                            {replanType === 'transport' ? opt.provider : opt.name}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {replanType === 'transport' 
                              ? `${opt.mode} • ${opt.departure_time} - ${opt.arrival_time} • ${opt.class_type}`
                              : `★ ${opt.rating} • ${opt.location}`
                            }
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-darkNavy">
                            ₹{replanType === 'transport' ? opt.price_inr.toLocaleString() : opt.price_per_night_inr.toLocaleString()}
                          </span>
                          <span className="text-[9px] text-slate-400 block font-semibold">
                            {replanType === 'transport' ? 'per person' : '/ night'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setShowReplanModal(false)}
                    className="flex-1 border border-slate-350 hover:bg-slate-50 text-slate-650 font-bold py-2 rounded-xl text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReplanSelectSubmit}
                    disabled={!selectedNewOption}
                    className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-2 rounded-xl text-xs transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-500/10"
                  >
                    Apply New Segment
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
