import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plane, Bell, LayoutDashboard, Map, Menu, X, Sparkles, User, LogOut, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const navLinks = [
  { href: '/plan', label: 'Plan Trip', icon: <Map size={16} /> },
  { href: '/dashboard', label: 'My Trips', icon: <LayoutDashboard size={16} /> },
  { href: '/alerts', label: 'Alerts', icon: <Bell size={16} /> },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === '/';

  // Auth State
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });

    // Load active Supabase session
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const userObj = {
          email: session.user.email,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0]
        };
        setUser(userObj);
        localStorage.setItem('triply_user', JSON.stringify(userObj));
      } else {
        setUser(null);
        localStorage.removeItem('triply_user');
      }
    };
    fetchSession();

    // Listen to active Supabase Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const userObj = {
          email: session.user.email,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0]
        };
        setUser(userObj);
        localStorage.setItem('triply_user', JSON.stringify(userObj));
      } else {
        setUser(null);
        localStorage.removeItem('triply_user');
      }
      window.dispatchEvent(new Event('triply-auth-change'));
    });

    // Handle cross-component auth sync
    const handleAuthChange = () => {
      const updatedUser = localStorage.getItem('triply_user');
      setUser(updatedUser ? JSON.parse(updatedUser) : null);
    };
    window.addEventListener('triply-auth-change', handleAuthChange);

    // Open login modal event (e.g. from dashboard)
    const handleOpenLogin = () => {
      setShowAuthModal(true);
      setIsSignup(false);
    };
    window.addEventListener('triply-open-login', handleOpenLogin);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('triply-auth-change', handleAuthChange);
      window.removeEventListener('triply-open-login', handleOpenLogin);
      subscription.unsubscribe();
    };
  }, []);

  const navBg = isHome
    ? scrolled
      ? 'bg-white/92 backdrop-blur-xl border-b border-slate-200/60 shadow-sm'
      : 'bg-transparent'
    : 'bg-white/92 backdrop-blur-xl border-b border-slate-200/60 shadow-sm';

  const logoColor = isHome && !scrolled ? 'text-white' : 'text-[#0F2044]';
  const linkColor = isHome && !scrolled ? 'text-white/80 hover:text-white' : 'text-slate-600 hover:text-[#1D4ED8]';
  const activeColor = isHome && !scrolled ? 'text-white font-bold' : 'text-[#1D4ED8] font-bold';
  const menuIconColor = isHome && !scrolled ? 'text-white' : 'text-slate-600';

  // Handle Authentication submit
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (isSignup) {
      if (!email || !password || !name) {
        setAuthError('All fields are required');
        return;
      }
      
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password,
        options: {
          data: { name }
        }
      });

      if (error) {
        setAuthError(error.message);
        return;
      }

      setAuthSuccess('Registration successful! Logging in...');
      setTimeout(() => {
        setShowAuthModal(false);
        resetAuthFields();
      }, 1000);
    } else {
      if (!email || !password) {
        setAuthError('Email and password are required');
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password
      });

      if (error) {
        setAuthError(error.message);
        return;
      }

      setAuthSuccess('Login successful!');
      setTimeout(() => {
        setShowAuthModal(false);
        resetAuthFields();
      }, 1000);
    }
  };

  const handleBypassAuth = () => {
    const mockUser = {
      email: 'demo@triply.ai',
      name: 'Demo Traveller'
    };
    setUser(mockUser);
    localStorage.setItem('triply_user', JSON.stringify(mockUser));
    window.dispatchEvent(new Event('triply-auth-change'));
    setAuthSuccess('Logged in using Demo Account!');
    setTimeout(() => {
      setShowAuthModal(false);
      resetAuthFields();
    }, 1000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('triply_user');
    setUser(null);
    window.dispatchEvent(new Event('triply-auth-change'));
  };

  const resetAuthFields = () => {
    setEmail('');
    setPassword('');
    setName('');
    setAuthError('');
    setAuthSuccess('');
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300 ${navBg}`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className={`flex items-center gap-2.5 font-black text-xl tracking-tight ${logoColor} transition-colors duration-300`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isHome && !scrolled ? 'bg-white/20' : 'bg-[#1D4ED8]'} transition-all duration-300`}>
              <Plane size={16} className={isHome && !scrolled ? 'text-white' : 'text-white'} strokeWidth={2.5} />
            </div>
            <span style={{ fontFamily: 'Outfit, sans-serif' }}>Triply <span className={isHome && !scrolled ? 'text-white/70' : 'text-[#0D9488]'}>AI</span></span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon }) => {
              const isActive = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive ? activeColor + ' bg-[#1D4ED8]/8' : linkColor
                  }`}
                >
                  {icon}
                  {label}
                </Link>
              );
            })}
          </div>

          {/* CTA / Auth Menu */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 bg-slate-100 rounded-pill p-1 pl-3 border border-slate-200">
                <span className="text-xs font-bold text-darkNavy">Hi, {user.name}</span>
                <button
                  onClick={handleLogout}
                  className="bg-white text-red-500 p-2 rounded-full hover:bg-red-50 transition border border-slate-200 shadow-sm"
                  title="Logout"
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setShowAuthModal(true); setIsSignup(false); }}
                className="flex items-center gap-1.5 bg-white text-slate-700 text-xs font-bold px-4 py-2 rounded-xl hover:bg-slate-50 transition border border-slate-200 shadow-sm"
              >
                <User size={14} /> Sign In
              </button>
            )}

            <Link
              href="/plan"
              className="flex items-center gap-2 bg-[#1D4ED8] text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all duration-200 hover:bg-[#1741B6] hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5"
            >
              <Sparkles size={15} />
              Plan My Trip
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className={`md:hidden p-2 rounded-lg ${menuIconColor} transition-colors`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            id="mobile-menu-toggle"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-[#0F2044]/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />

        {/* Panel */}
        <div
          className={`absolute top-0 right-0 bottom-0 w-72 bg-white shadow-2xl transition-transform duration-300 ${
            mobileOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <Link href="/" className="flex items-center gap-2 font-black text-lg text-[#0F2044]" onClick={() => setMobileOpen(false)}>
              <div className="w-7 h-7 rounded-lg bg-[#1D4ED8] flex items-center justify-center">
                <Plane size={14} className="text-white" strokeWidth={2.5} />
              </div>
              Triply AI
            </Link>
            <button onClick={() => setMobileOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>

          {/* Nav Links */}
          <div className="p-4 space-y-1">
            {navLinks.map(({ href, label, icon }) => {
              const isActive = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-[#1D4ED8]/8 text-[#1D4ED8] font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <span className={isActive ? 'text-[#1D4ED8]' : 'text-slate-400'}>{icon}</span>
                  {label}
                </Link>
              );
            })}
          </div>

          {/* User state in mobile menu */}
          <div className="p-5 border-t border-slate-100 mt-4">
            {user ? (
              <div className="space-y-3">
                <div className="text-xs font-bold text-darkNavy">Logged in as {user.name}</div>
                <button
                  onClick={() => { handleLogout(); setMobileOpen(false); }}
                  className="flex items-center justify-center gap-2 w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2.5 rounded-xl text-sm transition"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setShowAuthModal(true); setIsSignup(false); setMobileOpen(false); }}
                className="flex items-center justify-center gap-2 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-sm transition"
              >
                <User size={16} /> Sign In / Signup
              </button>
            )}
          </div>

          {/* Bottom CTA */}
          <div className="absolute bottom-8 left-4 right-4">
            <Link
              href="/plan"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 w-full bg-[#1D4ED8] text-white font-bold py-3.5 rounded-xl hover:bg-[#1741B6] transition-colors shadow-lg shadow-blue-500/20"
            >
              <Sparkles size={16} />
              Plan My Trip
            </Link>
          </div>
        </div>
      </div>

      {/* AUTH MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-[#0F2044]/60 backdrop-blur-sm"
            onClick={() => setShowAuthModal(false)}
          />

          {/* Card Container */}
          <div className="relative w-full max-w-sm bg-white rounded-card shadow-2xl border border-slate-200 p-6 overflow-hidden z-10 animate-fade-in-up">
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition p-1"
            >
              <X size={18} />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                <Lock size={22} />
              </div>
              <h3 className="text-lg font-black text-darkNavy">
                {isSignup ? 'Create Account' : 'Welcome Back'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {isSignup ? 'Sign up to start saving your travel plans' : 'Sign in to access your personal itineraries'}
              </p>
            </div>

            {authError && (
              <div className="mb-4 p-2.5 bg-red-50 border border-red-250 text-red-600 rounded-btn text-xs font-semibold">
                {authError}
              </div>
            )}
            {authSuccess && (
              <div className="mb-4 p-2.5 bg-green-50 border border-green-250 text-tealAccent rounded-btn text-xs font-semibold">
                {authSuccess}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {isSignup && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-slate-300 rounded-btn p-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. niks@triply.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded-btn p-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-btn p-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md shadow-blue-500/20"
              >
                {isSignup ? 'Register' : 'Login'}
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-4 text-slate-400 text-[10px] font-bold uppercase tracking-wider">or</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <button
                type="button"
                onClick={handleBypassAuth}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition border border-slate-200"
              >
                Bypass Auth (Use Demo Account)
              </button>
            </form>

            <div className="mt-5 text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
              {isSignup ? (
                <span>
                  Already have an account?{' '}
                  <button 
                    onClick={() => { setIsSignup(false); setAuthError(''); }}
                    className="text-primary font-bold hover:underline"
                  >
                    Login here
                  </button>
                </span>
              ) : (
                <span>
                  New to Triply?{' '}
                  <button 
                    onClick={() => { setIsSignup(true); setAuthError(''); }}
                    className="text-primary font-bold hover:underline"
                  >
                    Create account
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
