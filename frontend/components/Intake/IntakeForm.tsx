import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { voiceExtract, createTripPlan } from '../../lib/api';
import { Mic, MicOff, Calendar, Users, DollarSign, Briefcase, Truck, Hotel, Coffee, Plus, Minus, ArrowRight, ArrowLeft } from 'lucide-react';

interface IntakeFormProps {
  onPlanCreated: (planId: string) => void;
}

export default function IntakeForm({ onPlanCreated }: IntakeFormProps) {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<'form' | 'voice'>('form');
  const [isExtracting, setIsExtracting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields State
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    start_date: '',
    end_date: '',
    adults: 1,
    children: 0,
    infants: 0,
    budget_inr: 25000.0,
    trip_purpose: 'Leisure',
    transport_modes: ['Any'] as string[],
    transport_class: '3AC',
    accommodation_type: '3-star',
    amenities: [] as string[],
    diet_type: 'No restriction',
    cuisines: [] as string[],
    meal_budget_per_day: 800.0,
    additional_context: '',
    traveller_names: [] as string[],
    split_type: 'equal'
  });

  // i18n handler
  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  // Voice handler
  const { isListening, transcript, startListening, stopListening } = useVoiceInput(async (text) => {
    if (!text.trim()) return;
    setIsExtracting(true);
    setErrorMsg(null);
    try {
      const extracted = await voiceExtract(text);
      setFormData(prev => ({
        ...prev,
        ...extracted,
        // Keep additional context original text
        additional_context: text
      }));
      setMode('form'); // Switch to form so they can review
      setStep(6); // Skip to review step
    } catch (err: any) {
      setErrorMsg("Failed to extract voice details. Please use manual form mode.");
    } finally {
      setIsExtracting(false);
    }
  });

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      // Map app language to speech language
      const langMap: Record<string, string> = {
        en: 'en-IN',
        hi: 'hi-IN',
        te: 'te-IN',
        ta: 'ta-IN',
        kn: 'kn-IN'
      };
      startListening(langMap[i18n.language] || 'en-IN');
    }
  };

  const handleInputChange = (field: string, val: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: val };
      
      // Make sure traveler names list length matches adults count
      if (field === 'adults') {
        const num = intVal(val);
        let names = [...prev.traveller_names];
        if (names.length < num) {
          while (names.length < num) names.push('');
        } else {
          names = names.slice(0, num);
        }
        updated.traveller_names = names;
      }
      return updated;
    });
  };

  function intVal(val: any): number {
    return parseInt(val) || 0;
  }

  const handleMultiSelect = (field: 'transport_modes' | 'amenities' | 'cuisines', item: string) => {
    setFormData(prev => {
      const list = [...prev[field]];
      const idx = list.indexOf(item);
      if (idx > -1) {
        list.splice(idx, 1);
      } else {
        list.push(item);
      }
      return { ...prev, [field]: list };
    });
  };

  const validateStep = () => {
    if (step === 1) {
      if (!formData.origin.trim() || !formData.destination.trim()) return "Origin and Destination are required";
      if (formData.origin.toLowerCase() === formData.destination.toLowerCase()) return "Destination city must be different from origin";
      if (!formData.start_date || !formData.end_date) return "Dates are required";
      if (new Date(formData.start_date) > new Date(formData.end_date)) return "End date must be after start date";
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) {
      setErrorMsg(err);
      return;
    }
    setErrorMsg(null);
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setErrorMsg(null);
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    try {
      // Normalize traveler names: replace empty/whitespace strings with default values
      const normalizedNames = [...formData.traveller_names];
      for (let i = 0; i < formData.adults; i++) {
        if (!normalizedNames[i] || !normalizedNames[i].trim()) {
          normalizedNames[i] = `Traveller ${i + 1}`;
        }
      }

      const payload = {
        ...formData,
        traveller_names: normalizedNames
      };

      const planResp = await createTripPlan(payload);
      onPlanCreated(planResp.plan_id);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit plan. Please check API connection.");
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-cardSurface/90 border border-slate-200 shadow-card backdrop-blur-md rounded-card p-6 md:p-8">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-darkNavy">{t('title')}</h2>
          <p className="text-sm text-slate-500 mt-1">{t('tagline')}</p>
        </div>
        
        {/* Language Selector */}
        <select 
          value={i18n.language} 
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="border border-slate-300 rounded-btn px-2 py-1 text-xs bg-white text-darkNavy cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="en">English</option>
          <option value="hi">हिंदी (Hindi)</option>
          <option value="te">తెలుగు (Telugu)</option>
          <option value="ta">தமிழ் (Tamil)</option>
          <option value="kn">ಕನ್ನಡ (Kannada)</option>
        </select>
      </div>

      {/* MODE TOGGLER */}
      <div className="flex bg-slate-100 p-1 rounded-pill mb-6">
        <button
          onClick={() => { setMode('form'); setErrorMsg(null); }}
          className={`flex-1 py-2 text-xs font-semibold rounded-pill transition-all ${
            mode === 'form' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-darkNavy'
          }`}
        >
          {t('form_mode')}
        </button>
        <button
          onClick={() => { setMode('voice'); setErrorMsg(null); }}
          className={`flex-1 py-2 text-xs font-semibold rounded-pill transition-all ${
            mode === 'voice' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-darkNavy'
          }`}
        >
          {t('voice_mode')}
        </button>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-btn text-xs font-medium">
          {errorMsg}
        </div>
      )}

      {/* VOICE MODE LAYOUT */}
      {mode === 'voice' && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="relative">
            <button
              onClick={handleMicToggle}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse shadow-lg ring-4 ring-red-100' 
                  : 'bg-primary/10 text-primary hover:bg-primary/20'
              }`}
            >
              {isListening ? <MicOff size={32} /> : <Mic size={32} />}
            </button>
          </div>
          
          <h3 className="mt-6 text-sm font-semibold text-darkNavy">
            {isListening ? t('listening') : 'Tap mic to describe your trip'}
          </h3>
          <p className="mt-2 text-xs text-slate-500 max-w-sm px-4 leading-relaxed">
            E.g., "I want to plan a family trip from Delhi to Goa for 5 days next week. Budget is 40,000. We prefer 3-star hotel. We eat vegetarian food. Carrying an infant, need safety precautions."
          </p>

          {isListening && (
            <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-btn max-h-32 overflow-y-auto w-full text-left text-xs text-slate-700 italic">
              {transcript || 'Start speaking...'}
            </div>
          )}

          {isExtracting && (
            <div className="mt-6 flex items-center space-x-2 text-xs text-tealAccent font-semibold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-tealAccent animate-ping"></span>
              <span>Extracting details from voice...</span>
            </div>
          )}
        </div>
      )}

      {/* MANUAL FORM MODE LAYOUT */}
      {mode === 'form' && (
        <form 
          onSubmit={(e) => e.preventDefault()} 
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const target = e.target as HTMLElement;
              if (target.tagName !== 'TEXTAREA' && target.tagName !== 'BUTTON') {
                e.preventDefault();
                if (step < 6) {
                  handleNext();
                } else {
                  handleSubmit(e);
                }
              }
            }
          }}
          className="space-y-5"
        >
          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-1 mb-6">
            <div 
              className="bg-primary h-1 rounded-full transition-all duration-300"
              style={{ width: `${(step / 6) * 100}%` }}
            ></div>
          </div>

          {/* STEP 1: CORE TRIP DETAILS */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-darkNavy uppercase tracking-wider flex items-center gap-2">
                <Calendar size={16} className="text-primary" /> Step 1: Destination & Dates
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{t('origin')}</label>
                  <input
                    type="text"
                    placeholder="e.g. Delhi"
                    value={formData.origin}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => handleInputChange('origin', e.target.value)}
                    className="w-full border border-slate-300 rounded-btn p-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{t('destination')}</label>
                  <input
                    type="text"
                    placeholder="e.g. Goa"
                    value={formData.destination}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => handleInputChange('destination', e.target.value)}
                    className="w-full border border-slate-300 rounded-btn p-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{t('start_date')}</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    className="w-full border border-slate-300 rounded-btn p-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{t('end_date')}</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                    className="w-full border border-slate-300 rounded-btn p-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{t('purpose')}</label>
                <select
                  value={formData.trip_purpose}
                  onChange={(e) => handleInputChange('trip_purpose', e.target.value)}
                  className="w-full border border-slate-300 rounded-btn p-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none bg-white"
                >
                  <option value="Leisure">Leisure / Sightseeing</option>
                  <option value="Business">Business / Work</option>
                  <option value="Honeymoon">Honeymoon / Couple</option>
                  <option value="Family">Family Trip</option>
                  <option value="Solo">Solo Travel</option>
                  <option value="Group Outing">Group Outing</option>
                  <option value="Medical">Medical Travel</option>
                  <option value="Religious">Religious / Pilgrimage</option>
                  <option value="Adventure">Adventure / Trekking</option>
                </select>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-btn p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-slate-600">{t('budget')}</label>
                  <div className="flex items-center gap-1 bg-white border border-slate-350 rounded-btn px-2.5 py-1 shadow-sm focus-within:ring-1 focus-within:ring-primary focus-within:border-primary">
                    <span className="text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      min="1000"
                      max="1000000"
                      step="500"
                      value={formData.budget_inr}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        handleInputChange('budget_inr', val);
                      }}
                      className="w-24 text-xs font-extrabold text-darkNavy focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-right"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="300000"
                  step="1000"
                  value={formData.budget_inr}
                  onChange={(e) => handleInputChange('budget_inr', parseFloat(e.target.value))}
                  className="w-full accent-primary cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>₹1,000</span>
                  <span>₹1.5 Lakhs</span>
                  <span>₹3.0 Lakhs</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: TRAVELLERS */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-darkNavy uppercase tracking-wider flex items-center gap-2">
                <Users size={16} className="text-primary" /> Step 2: Passenger Count
              </h3>

              <div className="space-y-4">
                {/* Adults Stepper */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-btn border border-slate-100">
                  <div>
                    <h4 className="text-xs font-bold text-darkNavy">{t('adults')}</h4>
                    <p className="text-[10px] text-slate-400">Ages 13 and above</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => handleInputChange('adults', Math.max(1, formData.adults - 1))}
                      className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 text-darkNavy transition"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-xs font-bold w-4 text-center">{formData.adults}</span>
                    <button
                      type="button"
                      onClick={() => handleInputChange('adults', Math.min(20, formData.adults + 1))}
                      className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 text-darkNavy transition"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Children Stepper */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-btn border border-slate-100">
                  <div>
                    <h4 className="text-xs font-bold text-darkNavy">{t('children')}</h4>
                    <p className="text-[10px] text-slate-400">Ages 3 to 12</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => handleInputChange('children', Math.max(0, formData.children - 1))}
                      className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 text-darkNavy transition"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-xs font-bold w-4 text-center">{formData.children}</span>
                    <button
                      type="button"
                      onClick={() => handleInputChange('children', Math.min(10, formData.children + 1))}
                      className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 text-darkNavy transition"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Infants Stepper */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-btn border border-slate-100">
                  <div>
                    <h4 className="text-xs font-bold text-darkNavy">{t('infants')}</h4>
                    <p className="text-[10px] text-slate-400">Ages 0 to 2 (Triggers Baby Mode)</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => handleInputChange('infants', Math.max(0, formData.infants - 1))}
                      className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 text-darkNavy transition"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-xs font-bold w-4 text-center">{formData.infants}</span>
                    <button
                      type="button"
                      onClick={() => handleInputChange('infants', Math.min(5, formData.infants + 1))}
                      className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 text-darkNavy transition"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: TRANSPORT PREFERENCES */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-darkNavy uppercase tracking-wider flex items-center gap-2">
                <Truck size={16} className="text-primary" /> Step 3: Transport Preferences
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Transit Mode (Select multiple)</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Train', 'Bus', 'Flight', 'Cab', 'Any'].map((m) => {
                    const active = formData.transport_modes.includes(m);
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleMultiSelect('transport_modes', m)}
                        className={`p-3 border text-xs font-semibold rounded-btn transition text-center ${
                          active 
                            ? 'bg-primary/10 border-primary text-primary shadow-sm' 
                            : 'border-slate-300 hover:border-darkNavy text-slate-500'
                        }`}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Travel Class / Tier Preference</label>
                <input
                  type="text"
                  placeholder="e.g. 3AC, Sleeper, Economy, AC Bus"
                  value={formData.transport_class}
                  onChange={(e) => handleInputChange('transport_class', e.target.value)}
                  className="w-full border border-slate-300 rounded-btn p-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* STEP 4: STAY PREFERENCES */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-darkNavy uppercase tracking-wider flex items-center gap-2">
                <Hotel size={16} className="text-primary" /> Step 4: Accommodation Preferences
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Stay Accommodation Category</label>
                <select
                  value={formData.accommodation_type}
                  onChange={(e) => handleInputChange('accommodation_type', e.target.value)}
                  className="w-full border border-slate-300 rounded-btn p-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none bg-white"
                >
                  <option value="PG">Paying Guest (PG)</option>
                  <option value="Co-living">Co-Living Space</option>
                  <option value="Hostel">Backpacker Hostel</option>
                  <option value="Lodge">Local Lodge</option>
                  <option value="Budget Hotel (1-2 star)">Budget Hotel (1-2 Star)</option>
                  <option value="3-star">3-Star Comfort Hotel</option>
                  <option value="4-star">4-Star Premium Hotel</option>
                  <option value="5-star">5-Star Luxury Resort</option>
                  <option value="Homestay">Local Homestay / Villa</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Required Amenities (Select multiple)</label>
                <div className="grid grid-cols-3 gap-2">
                  {['WiFi', 'AC', 'Breakfast included', 'Parking', 'Kitchen', 'Elevator', 'Wheelchair access', 'Baby crib'].map((a) => {
                    const active = formData.amenities.includes(a);
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() => handleMultiSelect('amenities', a)}
                        className={`p-2 border text-[10px] font-semibold rounded-btn transition text-center ${
                          active 
                            ? 'bg-primary/10 border-primary text-primary shadow-sm' 
                            : 'border-slate-300 hover:border-darkNavy text-slate-500'
                        }`}
                      >
                        {a}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: FOOD PREFERENCES */}
          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-darkNavy uppercase tracking-wider flex items-center gap-2">
                <Coffee size={16} className="text-primary" /> Step 5: Food Preferences
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Diet Type</label>
                <select
                  value={formData.diet_type}
                  onChange={(e) => handleInputChange('diet_type', e.target.value)}
                  className="w-full border border-slate-300 rounded-btn p-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none bg-white"
                >
                  <option value="No restriction">No dietary restrictions</option>
                  <option value="Vegetarian">Vegetarian (Pure Veg)</option>
                  <option value="Non-Vegetarian">Non-Vegetarian</option>
                  <option value="Vegan">Vegan (Plant-based)</option>
                  <option value="Jain">Jain food</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Cuisines Preferred</label>
                <div className="grid grid-cols-3 gap-2">
                  {['South Indian', 'North Indian', 'Chinese', 'Continental', 'Street Food', 'Seafood', 'Fast Food'].map((c) => {
                    const active = formData.cuisines.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleMultiSelect('cuisines', c)}
                        className={`p-2 border text-[10px] font-semibold rounded-btn transition text-center ${
                          active 
                            ? 'bg-primary/10 border-primary text-primary shadow-sm' 
                            : 'border-slate-300 hover:border-darkNavy text-slate-500'
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Food Budget Per Day (per person): ₹{formData.meal_budget_per_day}</label>
                <input
                  type="range"
                  min="200"
                  max="3000"
                  step="100"
                  value={formData.meal_budget_per_day}
                  onChange={(e) => handleInputChange('meal_budget_per_day', parseFloat(e.target.value))}
                  className="w-full accent-primary cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                />
              </div>
            </div>
          )}

          {/* STEP 6: GROUP DETAILS & CONTEXT REVIEW */}
          {step === 6 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-darkNavy uppercase tracking-wider">
                Step 6: Review & Final Context
              </h3>

              {/* Group splitter names if Adults > 1 */}
              {formData.adults > 1 && (
                <div className="bg-slate-50 border border-slate-100 rounded-btn p-4 space-y-3">
                  <h4 className="text-xs font-bold text-darkNavy">Traveller Group Details</h4>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {Array.from({ length: formData.adults }).map((_, idx) => (
                      <div key={idx}>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">Traveller {idx+1} Name</label>
                        <input
                          type="text"
                          placeholder={`Name`}
                          value={formData.traveller_names[idx] || ''}
                          onChange={(e) => {
                            const newNames = [...formData.traveller_names];
                            newNames[idx] = e.target.value;
                            handleInputChange('traveller_names', newNames);
                          }}
                          className="w-full border border-slate-300 rounded-btn p-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-4 mt-2">
                    <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="radio" 
                        name="split" 
                        value="equal" 
                        checked={formData.split_type === 'equal'}
                        onChange={(e) => handleInputChange('split_type', e.target.value)}
                        className="accent-primary"
                      /> Equal cost split
                    </label>
                    <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="radio" 
                        name="split" 
                        value="custom"
                        checked={formData.split_type === 'custom'}
                        onChange={(e) => handleInputChange('split_type', e.target.value)}
                        className="accent-primary"
                      /> Custom split (simulation)
                    </label>
                  </div>
                </div>
              )}

              {/* Additional Context Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Tell us anything special (Medical, Infants, Safety requirements)
                </label>
                <textarea
                  rows={3}
                  value={formData.additional_context}
                  onChange={(e) => handleInputChange('additional_context', e.target.value)}
                  placeholder="e.g. Traveling with infant under 1 year. Senior citizen with knee joint pains (needs elevators, ground floor room). Solo female traveller safety focus."
                  className="w-full border border-slate-300 rounded-btn p-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none resize-none"
                ></textarea>
              </div>

              {/* Summary card */}
              <div className="border border-primary/20 bg-primary/5 rounded-btn p-4 text-xs space-y-1">
                <h4 className="font-bold text-primary mb-1">Summary of Request</h4>
                <div>📍 <strong>Route:</strong> {formData.origin} → {formData.destination}</div>
                <div>📅 <strong>Dates:</strong> {formData.start_date} to {formData.end_date}</div>
                <div>👥 <strong>Group:</strong> {formData.adults} Adults, {formData.children} Kids, {formData.infants} Babies</div>
                <div>💰 <strong>Budget:</strong> ₹{formData.budget_inr.toLocaleString()} (Meal: ₹{formData.meal_budget_per_day}/day)</div>
                <div>🛏️ <strong>Stay:</strong> {formData.accommodation_type} | 🍱 <strong>Diet:</strong> {formData.diet_type}</div>
              </div>
            </div>
          )}

          {/* NAV BUTTONS */}
          <div className="flex justify-between items-center pt-4">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-darkNavy border border-slate-300 rounded-btn px-4 py-2 hover:bg-slate-50 transition"
              >
                <ArrowLeft size={14} /> {t('back')}
              </button>
            ) : (
              <div></div> // Empty spacing
            )}

            {step < 6 ? (
              <button
                key="btn-next"
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1 text-xs font-semibold bg-primary hover:bg-blue-700 text-white rounded-btn px-4 py-2 shadow-sm transition"
              >
                {t('next')} <ArrowRight size={14} />
              </button>
            ) : (
              <button
                key="btn-submit"
                type="button"
                onClick={() => handleSubmit()}
                className="flex items-center gap-1.5 text-xs font-bold bg-tealAccent hover:bg-teal-700 text-white rounded-btn px-5 py-2 shadow-sm transition animate-pulse"
              >
                {t('submit')} <ArrowRight size={14} />
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
