'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Sparkles, Map, Shield, TrendingDown, Mic, FileText,
  ChevronRight, Star, Zap, Globe, Users, Plane, Train,
  Hotel, Utensils, ArrowRight, Check, Play, ChevronDown
} from 'lucide-react';
import Navbar from '../components/shared/Navbar';

/* ──────────────────────────────────────────────────────────
   ANIMATED COUNTER
   ────────────────────────────────────────────────────────── */
function Counter({ end, suffix = '', prefix = '' }: { end: number; suffix?: string; prefix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const duration = 1800;
        const step = Math.ceil(end / (duration / 16));
        const timer = setInterval(() => {
          start = Math.min(start + step, end);
          setVal(start);
          if (start >= end) clearInterval(timer);
        }, 16);
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

/* ──────────────────────────────────────────────────────────
   AGENT CARD (animated)
   ────────────────────────────────────────────────────────── */
const AGENTS = [
  { icon: Shield,   label: 'Safety Agent',      color: '#EF4444', bg: 'rgba(239,68,68,0.08)',   delay: 0 },
  { icon: Train,    label: 'Transport Agent',    color: '#1D4ED8', bg: 'rgba(29,78,216,0.08)',  delay: 0.3 },
  { icon: Hotel,    label: 'Accommodation',      color: '#7C3AED', bg: 'rgba(124,58,237,0.08)', delay: 0.6 },
  { icon: Utensils, label: 'Food Agent',         color: '#F97316', bg: 'rgba(249,115,22,0.08)', delay: 0.9 },
  { icon: TrendingDown, label: 'Budget Agent',   color: '#0D9488', bg: 'rgba(13,148,136,0.08)', delay: 1.2 },
  { icon: Map,      label: 'Itinerary Agent',    color: '#10B981', bg: 'rgba(16,185,129,0.08)', delay: 1.5 },
];

function AgentOrbit() {
  return (
    <div className="relative w-64 h-64 md:w-80 md:h-80 mx-auto">
      {/* Center Hub */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1D4ED8] to-[#0D9488] flex items-center justify-center shadow-xl shadow-blue-500/30 animate-pulse-glow">
          <Sparkles className="text-white" size={32} />
        </div>
        {/* Orbit ring */}
        <div className="absolute inset-4 rounded-full border-2 border-dashed border-blue-200/40 animate-spin-slow" />
      </div>
      {/* Agent icons around the hub */}
      {AGENTS.map((a, i) => {
        const angle = (i / AGENTS.length) * 360;
        const rad = (angle * Math.PI) / 180;
        const r = 100;
        const x = 50 + (r / 1.6) * Math.cos(rad);
        const y = 50 + (r / 1.6) * Math.sin(rad);
        const Icon = a.icon;
        return (
          <div
            key={a.label}
            className="absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 animate-fade-in"
            style={{
              left: `${x}%`,
              top:  `${y}%`,
              animationDelay: `${a.delay}s`,
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md border border-white/60 animate-float"
              style={{
                background: a.bg,
                animationDelay: `${i * 0.4}s`,
              }}
              title={a.label}
            >
              <Icon size={20} style={{ color: a.color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   FEATURES DATA
   ────────────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: Zap,
    color: '#F59E0B',
    gradient: 'from-amber-400/10 to-amber-500/5',
    title: 'Parallel AI Agents',
    desc: 'Six specialized agents run simultaneously — safety, transport, stays, food, budget & more. Results in seconds, not minutes.',
  },
  {
    icon: Mic,
    color: '#1D4ED8',
    gradient: 'from-blue-400/10 to-blue-500/5',
    title: 'Voice Input',
    desc: 'Just speak your travel idea. Our AI extracts destinations, dates, budget, and preferences from natural language.',
  },
  {
    icon: Globe,
    color: '#0D9488',
    gradient: 'from-teal-400/10 to-teal-500/5',
    title: 'Real-Time Data',
    desc: 'Live bus & train timings, weather forecasts, crowd heatmaps, and dynamic pricing — always up to date.',
  },
  {
    icon: Shield,
    color: '#EF4444',
    gradient: 'from-red-400/10 to-red-500/5',
    title: 'Safety Intelligence',
    desc: 'AI-powered risk scoring for every destination with weather warnings, crowd alerts, and local safety advisories.',
  },
  {
    icon: TrendingDown,
    color: '#7C3AED',
    gradient: 'from-purple-400/10 to-purple-500/5',
    title: 'Price Alerts',
    desc: 'Set a target price for any transport or hotel. Get notified the moment prices drop to your budget.',
  },
  {
    icon: FileText,
    color: '#10B981',
    gradient: 'from-emerald-400/10 to-emerald-500/5',
    title: 'PDF & WhatsApp Share',
    desc: 'Export your full itinerary as a beautiful PDF. Share with your group via WhatsApp in one click.',
  },
];

/* ──────────────────────────────────────────────────────────
   JOURNEY STEPS
   ────────────────────────────────────────────────────────── */
const STEPS = [
  {
    num: '01',
    title: 'Describe Your Trip',
    desc: 'Type or speak your travel idea — destination, dates, budget, group size, and preferences.',
    color: '#1D4ED8',
  },
  {
    num: '02',
    title: 'AI Agents Run in Parallel',
    desc: 'Six specialized agents simultaneously research safety, transport, hotels, food, budget and crowd data.',
    color: '#0D9488',
  },
  {
    num: '03',
    title: 'Review Your Itinerary',
    desc: 'Get a complete day-by-day plan with options to replan any segment, set price alerts, and export as PDF.',
    color: '#7C3AED',
  },
];

/* ──────────────────────────────────────────────────────────
   POPULAR DESTINATIONS
   ────────────────────────────────────────────────────────── */
const DESTINATIONS = [
  { name: 'Goa', tag: 'Beaches', emoji: '🏖️',  gradient: 'from-orange-400 to-pink-500' },
  { name: 'Manali', tag: 'Mountains', emoji: '🏔️', gradient: 'from-blue-400 to-indigo-600' },
  { name: 'Jaipur', tag: 'Heritage', emoji: '🏰', gradient: 'from-amber-400 to-red-500' },
  { name: 'Kerala', tag: 'Nature', emoji: '🌿', gradient: 'from-green-400 to-teal-600' },
  { name: 'Ladakh', tag: 'Adventure', emoji: '🏕️', gradient: 'from-slate-400 to-blue-600' },
  { name: 'Mumbai', tag: 'City', emoji: '🏙️', gradient: 'from-purple-400 to-pink-600' },
];

/* ──────────────────────────────────────────────────────────
   TESTIMONIALS
   ────────────────────────────────────────────────────────── */
const TESTIMONIALS = [
  {
    name: 'Priya Sharma',
    role: 'Planned a Goa trip for 6 friends',
    text: 'Triply AI planned our entire Goa trip in 2 minutes — hotels, transport, restaurants and even safety tips. Saved us hours of research!',
    stars: 5,
  },
  {
    name: 'Rahul Mehta',
    role: 'Solo backpacker, Ladakh',
    text: 'The budget agent kept me perfectly on track. Got a complete Ladakh itinerary with real bus timings and best campsites within my ₹25k budget.',
    stars: 5,
  },
  {
    name: 'Sneha Iyer',
    role: 'Honeymooner, Kerala',
    text: 'The voice input is magic — I just talked about what I wanted and it generated a romantic Kerala itinerary with everything pre-planned. Loved it!',
    stars: 5,
  },
];

/* ──────────────────────────────────────────────────────────
   MAIN PAGE COMPONENT
   ────────────────────────────────────────────────────────── */
export default function HomePage() {
  const [typedText, setTypedText] = useState('');
  const phrases = [
    'Plan Goa with 5 friends for ₹30,000 each',
    'Weekend trip to Manali from Delhi under ₹15,000',
    'Kerala honeymoon for 7 days in December',
    'Solo backpacking Ladakh in July, ₹20,000 budget',
  ];
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const phrase = phrases[phraseIdx];
    let timeout: NodeJS.Timeout;
    if (!deleting && charIdx < phrase.length) {
      timeout = setTimeout(() => setCharIdx(c => c + 1), 45);
    } else if (!deleting && charIdx === phrase.length) {
      timeout = setTimeout(() => setDeleting(true), 2400);
    } else if (deleting && charIdx > 0) {
      timeout = setTimeout(() => setCharIdx(c => c - 1), 22);
    } else if (deleting && charIdx === 0) {
      setDeleting(false);
      setPhraseIdx(p => (p + 1) % phrases.length);
    }
    setTypedText(phrase.substring(0, charIdx));
    return () => clearTimeout(timeout);
  }, [charIdx, deleting, phraseIdx]);

  return (
    <>
      <Navbar />
      <main>
        {/* ════════════════════════════════════════
            HERO SECTION
            ════════════════════════════════════════ */}
        <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16">
          {/* Background gradient */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, #0F2044 0%, #1a3a7a 40%, #0c4a4a 100%)',
            }}
          />
          {/* Mesh grid overlay */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
          {/* Glowing blobs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl animate-float-slow"
               style={{ background: 'radial-gradient(circle, #1D4ED8 0%, transparent 70%)' }} />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-15 blur-3xl animate-float"
               style={{ background: 'radial-gradient(circle, #0D9488 0%, transparent 70%)', animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5 blur-3xl"
               style={{ background: 'radial-gradient(circle, #7C3AED 0%, transparent 70%)' }} />

          <div className="relative z-10 container-app text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/90 text-xs font-semibold px-4 py-2 rounded-full mb-8 animate-fade-in-up backdrop-blur-sm">
              <Sparkles size={13} className="text-amber-300" />
              Powered by Google Gemini AI · 6 Parallel Agents
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6 animate-fade-in-up delay-100">
              Plan Your Perfect{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #60A5FA, #34D399)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Indian Trip
              </span>
              <br />
              <span className="text-3xl md:text-5xl lg:text-6xl text-white/70 font-bold">in Under 2 Minutes</span>
            </h1>

            {/* Subtitle */}
            <p className="text-white/65 text-base md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up delay-200">
              Six AI agents simultaneously plan your safety, transport, hotels, food, budget, and crowd schedule — creating a complete itinerary automatically.
            </p>

            {/* Typewriter Search Box */}
            <div className="max-w-2xl mx-auto mb-8 animate-fade-in-up delay-300">
              <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-1.5 shadow-2xl shadow-black/30">
                <div className="bg-white rounded-xl px-5 py-4 flex items-center gap-3">
                  <Sparkles size={18} className="text-[#1D4ED8] flex-shrink-0" />
                  <span className="text-slate-500 text-sm md:text-base flex-1 text-left min-h-[24px]">
                    {typedText}
                    <span className="animate-pulse text-[#1D4ED8] ml-0.5">|</span>
                  </span>
                  <Link
                    href="/plan"
                    id="hero-plan-btn"
                    className="flex-shrink-0 bg-[#1D4ED8] text-white text-sm font-bold px-5 py-2.5 rounded-lg flex items-center gap-1.5 hover:bg-[#1741B6] transition-all hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5"
                  >
                    Plan It <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14 animate-fade-in-up delay-400">
              <Link
                href="/plan"
                id="hero-start-planning"
                className="flex items-center gap-2 bg-white text-[#0F2044] font-bold px-8 py-4 rounded-xl text-base hover:bg-white/90 hover:shadow-xl hover:shadow-white/20 hover:-translate-y-1 transition-all duration-200"
              >
                <Sparkles size={18} className="text-[#1D4ED8]" />
                Start Planning for Free
              </Link>
              <Link
                href="/itinerary/demo-trip"
                className="flex items-center gap-2 bg-white/10 border border-white/20 text-white font-semibold px-8 py-4 rounded-xl text-base hover:bg-white/15 hover:-translate-y-1 transition-all duration-200 backdrop-blur-sm"
              >
                <Play size={16} />
                See Demo
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-white/50 text-xs animate-fade-in-up delay-500">
              {['Free to use', 'No signup required', 'Works for all Indian cities', '6 AI agents in parallel'].map(b => (
                <span key={b} className="flex items-center gap-1.5">
                  <Check size={12} className="text-green-400" /> {b}
                </span>
              ))}
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 animate-bounce-subtle">
            <ChevronDown size={24} />
          </div>
        </section>

        {/* ════════════════════════════════════════
            STATS SECTION
            ════════════════════════════════════════ */}
        <section className="py-16 bg-white border-b border-slate-100">
          <div className="container-app">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { val: 50000, suffix: '+', label: 'Trips Planned', color: '#1D4ED8' },
                { val: 6, suffix: '', label: 'AI Agents', color: '#0D9488' },
                { val: 500, suffix: '+', label: 'Destinations', color: '#7C3AED' },
                { val: 2, suffix: 'min', label: 'Avg. Plan Time', color: '#F97316', prefix: '<' },
              ].map(({ val, suffix, label, color, prefix }) => (
                <div key={label} className="animate-fade-in-up">
                  <div className="text-3xl md:text-4xl font-black mb-1" style={{ color }}>
                    <Counter end={val} suffix={suffix} prefix={prefix} />
                  </div>
                  <div className="text-slate-500 text-sm font-medium">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            AGENT VISUALIZATION SECTION
            ════════════════════════════════════════ */}
        <section className="py-24 bg-gradient-to-br from-slate-50 to-blue-50/30">
          <div className="container-app">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              {/* Left: Agent Visual */}
              <div className="order-2 md:order-1">
                <AgentOrbit />
              </div>

              {/* Right: Text */}
              <div className="order-1 md:order-2">
                <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-[#1D4ED8] text-xs font-bold px-3 py-1.5 rounded-full mb-6">
                  <Zap size={12} /> How It Works
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-[#0F2044] mb-6 leading-tight">
                  Six AI Agents,{' '}
                  <span
                    style={{
                      background: 'linear-gradient(135deg, #1D4ED8, #0D9488)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    Working in Parallel
                  </span>
                </h2>
                <p className="text-slate-500 text-base leading-relaxed mb-8">
                  Unlike other travel apps that fetch data one step at a time, Triply AI runs all its specialized agents simultaneously using a multi-agent orchestration system — delivering a complete itinerary in under 2 minutes.
                </p>
                <div className="space-y-4">
                  {AGENTS.map((a) => {
                    const Icon = a.icon;
                    return (
                      <div key={a.label} className="flex items-center gap-4 animate-fade-in-up">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: a.bg }}
                        >
                          <Icon size={18} style={{ color: a.color }} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-[#0F2044]">{a.label}</div>
                        </div>
                        <div className="ml-auto">
                          <span className="text-[10px] font-bold bg-green-50 text-green-600 px-2 py-0.5 rounded-full">LIVE</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            FEATURES SECTION
            ════════════════════════════════════════ */}
        <section className="py-24 bg-white">
          <div className="container-app">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-100 text-[#0D9488] text-xs font-bold px-3 py-1.5 rounded-full mb-6">
                <Star size={12} /> Features
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-[#0F2044] mb-4">
                Everything You Need to{' '}
                <span
                  style={{
                    background: 'linear-gradient(135deg, #1D4ED8, #0D9488)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Travel Smarter
                </span>
              </h2>
              <p className="text-slate-500 max-w-xl mx-auto">
                Triply AI goes beyond just suggesting places — it plans every detail, monitors prices, and keeps you safe.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map(({ icon: Icon, color, gradient, title, desc }, i) => (
                <div
                  key={title}
                  className={`feature-card card rounded-2xl p-7 group cursor-default animate-fade-in-up`}
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 bg-gradient-to-br ${gradient} group-hover:scale-110 transition-transform duration-200`}
                  >
                    <Icon size={22} style={{ color }} />
                  </div>
                  <h3 className="text-lg font-bold text-[#0F2044] mb-2">{title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            HOW IT WORKS (STEPS)
            ════════════════════════════════════════ */}
        <section className="py-24 bg-gradient-to-br from-[#0F2044] to-[#1a3a7a]">
          <div className="container-app">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
                Go from Idea to Itinerary
                <br />
                <span
                  style={{
                    background: 'linear-gradient(135deg, #60A5FA, #34D399)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  in 3 Simple Steps
                </span>
              </h2>
              <p className="text-white/50 max-w-xl mx-auto">
                No more spending hours on travel blogs and price comparison sites.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Connector lines */}
              <div className="hidden md:block absolute top-16 left-[calc(33%_-_24px)] right-[calc(33%_-_24px)] h-0.5 bg-gradient-to-r from-[#1D4ED8]/40 via-[#0D9488]/40 to-[#7C3AED]/40" />

              {STEPS.map(({ num, title, desc, color }, i) => (
                <div
                  key={num}
                  className="relative text-center animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.2}s` }}
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white font-black text-xl shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${color}, ${color}aa)`, boxShadow: `0 8px 24px ${color}40` }}
                  >
                    {num}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-14">
              <Link
                href="/plan"
                id="steps-cta-btn"
                className="inline-flex items-center gap-2 bg-white text-[#0F2044] font-bold px-8 py-4 rounded-xl text-base hover:bg-white/90 hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
              >
                Try It Now — It&apos;s Free <ChevronRight size={18} />
              </Link>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            POPULAR DESTINATIONS
            ════════════════════════════════════════ */}
        <section className="py-24 bg-white">
          <div className="container-app">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-100 text-orange-600 text-xs font-bold px-3 py-1.5 rounded-full mb-6">
                <Globe size={12} /> Popular Destinations
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-[#0F2044]">
                Where Do You Want to Go?
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {DESTINATIONS.map(({ name, tag, emoji, gradient }, i) => (
                <Link
                  key={name}
                  href={`/plan?destination=${encodeURIComponent(name)}`}
                  className={`relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br ${gradient} group cursor-pointer animate-fade-in-up`}
                  style={{ animationDelay: `${i * 0.08}s`, minHeight: '140px' }}
                >
                  {/* Dark overlay */}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-200 rounded-2xl" />
                  <div className="relative z-10">
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-200 inline-block">{emoji}</div>
                    <h3 className="text-xl font-black text-white">{name}</h3>
                    <p className="text-white/75 text-xs font-semibold uppercase tracking-wider">{tag}</p>
                  </div>
                  <div className="absolute bottom-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight size={18} className="text-white" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            TESTIMONIALS
            ════════════════════════════════════════ */}
        <section className="py-24 bg-slate-50">
          <div className="container-app">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-yellow-50 border border-yellow-100 text-yellow-600 text-xs font-bold px-3 py-1.5 rounded-full mb-6">
                <Star size={12} className="fill-yellow-400 text-yellow-400" /> Traveler Stories
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-[#0F2044]">
                Loved by Thousands of Indian Travelers
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {TESTIMONIALS.map(({ name, role, text, stars }, i) => (
                <div
                  key={name}
                  className="card rounded-2xl p-7 animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.15}s` }}
                >
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: stars }).map((_, s) => (
                      <Star key={s} size={14} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6 italic">&ldquo;{text}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1D4ED8] to-[#0D9488] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#0F2044]">{name}</div>
                      <div className="text-[11px] text-slate-400">{role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            FINAL CTA SECTION
            ════════════════════════════════════════ */}
        <section className="py-24 bg-gradient-to-br from-[#1D4ED8] to-[#0D9488]">
          <div className="container-app text-center">
            <div className="max-w-3xl mx-auto">
              <div className="w-20 h-20 rounded-3xl bg-white/15 flex items-center justify-center mx-auto mb-8 animate-float">
                <Plane size={36} className="text-white" />
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
                Your Next Indian Adventure
                <br />
                Starts Here
              </h2>
              <p className="text-white/70 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
                Join thousands of travelers who use Triply AI to plan smarter, travel better, and stay within budget.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/plan"
                  id="final-cta-btn"
                  className="flex items-center gap-2 bg-white text-[#1D4ED8] font-black px-10 py-4 rounded-xl text-lg hover:bg-white/95 hover:shadow-2xl hover:-translate-y-1 transition-all duration-200"
                >
                  <Sparkles size={20} />
                  Plan My Trip Now
                </Link>
                <Link
                  href="/itinerary/demo-trip"
                  className="flex items-center gap-2 border-2 border-white/30 text-white font-bold px-10 py-4 rounded-xl text-base hover:bg-white/10 hover:-translate-y-1 transition-all duration-200"
                >
                  <Users size={18} />
                  View Sample Itineraries
                </Link>
              </div>
              <p className="text-white/40 text-xs mt-8">
                No account needed · No hidden fees · Works for all Indian cities &amp; states
              </p>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            FOOTER
            ════════════════════════════════════════ */}
        <footer className="bg-[#0F2044] py-12">
          <div className="container-app">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2.5 text-white">
                <div className="w-8 h-8 rounded-lg bg-[#1D4ED8] flex items-center justify-center">
                  <Plane size={16} className="text-white" strokeWidth={2.5} />
                </div>
                <span className="font-black text-lg" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Triply <span className="text-[#0D9488]">AI</span>
                </span>
              </div>
              <div className="flex items-center gap-8 text-white/40 text-sm">
                <Link href="/plan" className="hover:text-white/70 transition-colors">Plan Trip</Link>
                <Link href="/dashboard" className="hover:text-white/70 transition-colors">My Trips</Link>
                <Link href="/alerts" className="hover:text-white/70 transition-colors">Alerts</Link>
              </div>
              <div className="text-white/30 text-xs">
                © 2025 Triply AI. Built with Gemini AI.
              </div>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
