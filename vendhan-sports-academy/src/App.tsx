/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/*
IMAGE CHANGE GUIDE - Vendhan Sports Academy
==========================================

LOGO:
- Location: Navbar component (around line 180)
- Current: /uploads/academy logo.png
- To change: Replace the src in the img tag with your new logo path

HERO BACKGROUND:
- Location: Hero component (around line 301)
- Current: Unsplash sports image
- To change: Replace the src URL with your own image path

GALLERY IMAGES:
- Location: GallerySection component (around line 509)
- Current: Automatically loads from /uploads/public/images/ directory
- To add: Place image files in /workspaces/Vendhan/vendhan-sports-academy/uploads/public/images/
- Supported: jpg, jpeg, png, gif, webp

TRAINING PROGRAM IMAGES:
- Location: ProgramsSection component (around line 392)
- Current: Stored in database, fallback to Unsplash
- To change: Use admin panel to update program.image field
- Upload via: /api/upload-image endpoint

FACILITY RENTAL IMAGES:
- Location: FacilityRental component (around line 457)
- Current: Two static Unsplash images
- To change: Replace the src URLs with your own facility images

FACILITY IMAGES:
- Location: FacilitySection component (around line 632)
- Current: Stored in database, fallback to Unsplash
- To change: Use admin panel to update facility.image field
- Upload via: /api/upload-image endpoint

CAMP POSTER IMAGES:
- Location: CampSection component (around line 885)
- Current: Stored in database, fallback to Unsplash
- To change: Use admin panel to update camp.posterUrl field
- Upload via: /api/upload-image endpoint

UPLOAD PROCESS:
1. Place images in /uploads/ directory
2. Use /uploads/filename.jpg as the path
3. For database images: Use admin panel or API endpoints
4. For automatic gallery: Just add files to /uploads/public/images/

*/

import React, { useState, useEffect, useMemo, Component } from 'react';
import { 
  Menu, X, Phone, Mail, Instagram, Facebook, Twitter, 
  Calendar, Trophy, Users, MapPin, ChevronRight, 
  Award, Clock, CheckCircle2, Star, Plus, Trash2, Edit2,
  LogOut, Shield, Camera, Image as ImageIcon, Info,
  ArrowRight, Filter, Search, User, Settings, UserCheck,
  Activity, Dumbbell, Heart, Zap, Bike, Moon, Sun, Newspaper, BookOpen, FileText, Award as AwardIcon,
  Upload, Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, onSnapshot, query, orderBy, addDoc, 
  updateDoc, deleteDoc, doc, getDoc, setDoc,
  where, Timestamp
} from 'firebase/firestore';
import { 
  signInWithPopup, GoogleAuthProvider, onAuthStateChanged, 
  signOut, User as FirebaseUser 
} from 'firebase/auth';
import { db, auth } from './firebase';
import { cn } from './lib/utils';
import { 
  Program, Coach, Event, GalleryItem, Booking, 
  Camp, Registration, Update, UserProfile,
  SportsNews
} from './types';
import { Toaster, toast } from 'sonner';

// --- Error Handling ---

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

class ErrorBoundary extends Component<any, any> {
  constructor(props: any) {
    super(props);
    (this as any).state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    const { hasError, error } = (this as any).state;
    const { children } = (this as any).props;

    if (hasError) {
      let message = "Something went wrong.";
      try {
        const parsed = JSON.parse(error.message);
        if (parsed.error) message = parsed.error;
      } catch (e) {
        message = error.message || message;
      }

      return (
        <div className="h-screen flex items-center justify-center p-4 bg-neutral-50 dark:bg-neutral-950">
          <div className="max-w-md w-full bg-white dark:bg-neutral-900 p-8 rounded-3xl shadow-xl border border-neutral-100 dark:border-neutral-800 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <Info size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-4 dark:text-white">Application Error</h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-8">{message}</p>
            <button 
              onClick={() => window.location.reload()}
              className="btn btn-primary w-full"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return children;
  }
}

// --- Components ---

const Navbar = ({ user, isAdmin, onLogin, onLogout, activeSection, onNavClick }: any) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', id: 'home' },
    { name: 'Programs', id: 'programs' },
    { name: 'Facility', id: 'facility' },
    { name: 'Awards', id: 'awards' },
    { name: 'Tournaments', id: 'tournaments' },
    { name: 'Events', id: 'events' },
    { name: 'Gallery', id: 'gallery' },
    { name: 'Camp', id: 'camp' },
    { name: 'Coaches', id: 'coaches' },
  ];

  if (isAdmin) {
    navLinks.push({ name: 'Admin', id: 'admin' });
  }

  const handleLinkClick = (id: string) => {
    onNavClick(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      isScrolled ? "bg-white dark:bg-neutral-900 shadow-md py-2" : "bg-transparent py-4"
    )}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
        <div 
          className="flex flex-col items-center cursor-pointer" 
          onClick={() => handleLinkClick('home')}
        >
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center overflow-hidden shadow-lg border-2 border-primary/20 mb-1">
            {/* LOGO CHANGE: Update the src below to change the academy logo */}
            {/* Current: Uses /uploads/academy logo.png */}
            {/* To change: Replace the src with your new logo path */}
            <img 
              src="/uploads/academy%20logo.png" 
              alt="Academy Logo" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-center">
            <h1 className={cn("text-sm font-black leading-none tracking-tighter", isScrolled ? "text-primary dark:text-primary-light" : "text-white")}>
              VENDHAN
            </h1>
            <p className={cn("text-[8px] uppercase font-bold tracking-[0.2em]", isScrolled ? "text-neutral-500 dark:text-neutral-400" : "text-white/80")}>
              Sports Academy
            </p>
          </div>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleLinkClick(link.id)}
              className={cn(
                "text-sm font-semibold transition-colors hover:text-accent",
                activeSection === link.id 
                  ? "text-accent" 
                  : isScrolled ? "text-neutral-700 dark:text-neutral-300" : "text-white"
              )}
            >
              {link.name}
            </button>
          ))}
          
          <div className="flex items-center gap-4 border-l border-neutral-200 dark:border-neutral-700 pl-6">
            {user ? (
              <div className="flex items-center gap-4">
                <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border-2 border-primary" />
                <button 
                  onClick={onLogout}
                  className={cn(
                    "p-2 rounded-full transition-colors",
                    isScrolled ? "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300" : "hover:bg-white/10 text-white"
                  )}
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button onClick={onLogin} className="btn btn-accent py-2 px-4 text-sm">
                Login
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center gap-4 md:hidden">
          <button 
            className={cn("p-2", isScrolled ? "text-neutral-700 dark:text-neutral-300" : "text-white")}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-full left-0 right-0 bg-white dark:bg-neutral-900 shadow-xl border-t border-neutral-100 dark:border-neutral-800 p-4"
          >
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => handleLinkClick(link.id)}
                  className={cn(
                    "text-left px-4 py-2 rounded-lg text-sm font-semibold",
                    activeSection === link.id ? "bg-primary/10 text-primary" : "text-neutral-700 dark:text-neutral-300"
                  )}
                >
                  {link.name}
                </button>
              ))}
              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                {user ? (
                  <div className="flex items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                      <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full" />
                      <span className="text-sm font-medium dark:text-white">{user.displayName}</span>
                    </div>
                    <button onClick={onLogout} className="text-red-500 p-2">
                      <LogOut size={18} />
                    </button>
                  </div>
                ) : (
                  <button onClick={onLogin} className="w-full btn btn-primary">
                    Login with Google
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Hero = ({ onExplore }: { onExplore: () => void }) => {
  // HERO SECTION BACKGROUND IMAGE: Change the main hero background image
  // Current: Unsplash sports image
  // To change: Replace the src URL with your own image path (e.g., /uploads/hero-image.jpg)
  // For local images: Upload to /uploads/ directory and use /uploads/filename.jpg
  
  return (
    <section id="home" className="relative h-screen flex items-center overflow-hidden">
      {/* Background Images */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10" />
        <img 
          src="https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1920&auto=format&fit=crop" 
          alt="Hero Background" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="relative z-20 max-w-7xl mx-auto px-4 md:px-8 w-full">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl"
        >
          <span className="inline-block px-4 py-1 bg-accent text-white rounded-full text-xs font-bold uppercase tracking-widest mb-6">
            Vendhan Sports Academy
          </span>
          <h1 className="text-5xl md:text-7xl text-white font-display font-black leading-tight mb-6">
            UNLEASH THE <span className="text-accent">POWER</span> WITHIN
          </h1>
          <p className="text-xl text-white/80 mb-10 leading-relaxed">
            Where champions are forged through discipline, tradition, and modern excellence. Join us to transform your potential into performance.
          </p>
          <div className="flex flex-wrap gap-4">
            <button onClick={onExplore} className="btn btn-primary text-lg px-8">
              Explore Programs <ArrowRight size={20} />
            </button>
            <button className="btn btn-outline border-white text-white hover:bg-white hover:text-primary text-lg px-8">
              Watch Video
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: 'Medals Won', value: '500+', icon: Award },
            { label: 'World Records', value: '10+', icon: Trophy },
            { label: 'Years Excellence', value: '15+', icon: Clock },
            { label: 'Students Trained', value: '2000+', icon: Users },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="flex items-center gap-4 text-white"
            >
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-accent">
                <stat.icon size={24} />
              </div>
              <div>
                <div className="text-2xl font-black">{stat.value}</div>
                <div className="text-xs uppercase tracking-wider text-white/60">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const ProgramsSection = ({ programs, onEnroll }: { programs: Program[], onEnroll: (p: Program) => void }) => {
  // TRAINING PROGRAMMES IMAGES: Program images are stored in the database
  // To add/change images: Use the admin panel to update program images
  // Images should be uploaded via /api/upload-image endpoint
  // Default fallback: Unsplash sports image
  
  return (
    <section id="programs" className="section-padding bg-white dark:bg-neutral-950">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl mb-4 dark:text-white">TRAINING PROGRAMS</h2>
        <div className="w-20 h-1.5 bg-accent mx-auto rounded-full" />
        <p className="mt-6 text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
          We offer specialized training across various disciplines, combining traditional techniques with modern sports science.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {programs.map((program, i) => (
          <motion.div
            key={program.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="card group"
          >
            <div className="relative h-64 overflow-hidden">
              <img 
                src={program.image || `https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=800&auto=format&fit=crop`} 
                alt={program.name} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              {/* PROGRAM IMAGES: Each training program displays its own image
              // To change: Use admin panel to update program.image field
              // Upload images via /api/upload-image endpoint
              // Fallback: Unsplash sports image if no image is set */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div className="p-8">
              <h3 className="text-2xl mb-3 dark:text-white">{program.name}</h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6 line-clamp-3">
                {program.description}
              </p>
              <button 
                onClick={() => onEnroll(program)}
                className="w-full btn btn-outline group-hover:bg-primary group-hover:text-white"
              >
                Enroll Now
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

const FacilityRental = ({ onBook }: { onBook: () => void }) => {
  return (
    <section id="facility" className="bg-primary text-white overflow-hidden relative">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-white/5 skew-x-12 transform translate-x-1/4" />
      
      <div className="section-padding relative z-10 flex flex-col lg:flex-row items-center gap-16">
        <div className="lg:w-1/2">
          <h2 className="text-4xl md:text-5xl mb-6">FACILITY RENTAL</h2>
          <p className="text-xl text-white/80 mb-10 leading-relaxed">
            We offer world-class sports infrastructure for rent, suitable for practice sessions, tournaments, and private events.
          </p>
          
          <div className="space-y-6 mb-10">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h4 className="font-bold text-lg">Court / Ground Rental</h4>
                <p className="text-white/60">Available at a fixed price per hour for teams and groups.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h4 className="font-bold text-lg">Per Person Access</h4>
                <p className="text-white/60">Pricing available based on number of participants for individual practice.</p>
              </div>
            </div>
          </div>

          <button onClick={onBook} className="btn btn-accent text-lg px-10">
            Book Our Facilities <Calendar size={20} />
          </button>
        </div>

        <div className="lg:w-1/2 grid grid-cols-2 gap-4">
          {/* FACILITY RENTAL IMAGES: Static images for facility showcase
          // To change: Replace the src URLs with your own facility images
          // Upload to /uploads/ directory and use /uploads/filename.jpg
          // Current: Two Unsplash images showing sports facilities */}
          <img src="https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=400&h=500&auto=format&fit=crop" alt="Facility 1" className="rounded-2xl shadow-2xl" referrerPolicy="no-referrer" />
          <img src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=400&h=500&auto=format&fit=crop" alt="Facility 2" className="rounded-2xl shadow-2xl mt-8" referrerPolicy="no-referrer" />
        </div>
      </div>
    </section>
  );
};

const EventsSection = ({ events, onRegister }: { events: Event[], onRegister: (e: Event) => void }) => {
  return (
    <section id="events" className="section-padding bg-white dark:bg-neutral-950">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
        <div>
          <h2 className="text-4xl md:text-5xl mb-4 dark:text-white">UPCOMING EVENTS</h2>
          <div className="w-20 h-1.5 bg-accent rounded-full" />
        </div>
        <p className="text-neutral-600 dark:text-neutral-400 max-w-md">
          Join our community events, tournaments, and world record attempts.
        </p>
      </div>

      <div className="space-y-6">
        {events.map((event, i) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="flex flex-col md:flex-row items-center gap-8 p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all"
          >
            <div className="w-full md:w-32 h-32 bg-primary/5 dark:bg-primary/10 rounded-2xl flex flex-col items-center justify-center text-primary dark:text-primary-light shrink-0">
              <span className="text-3xl font-black">{new Date(event.date).getDate()}</span>
              <span className="text-xs uppercase font-bold tracking-widest">
                {new Date(event.date).toLocaleString('default', { month: 'short' })}
              </span>
            </div>
            <div className="flex-grow">
              <h3 className="text-xl font-bold mb-2 dark:text-white">{event.title}</h3>
              <p className="text-neutral-600 dark:text-neutral-400 line-clamp-2">{event.description}</p>
            </div>
            <div className="w-full md:w-auto">
              {event.registrationEnabled ? (
                <button 
                  onClick={() => onRegister(event)}
                  className="w-full md:w-auto btn btn-primary"
                >
                  Register Now
                </button>
              ) : (
                <span className="text-neutral-400 dark:text-neutral-500 text-sm font-medium">No Registration Required</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

const GallerySection = ({ items }: { items: GalleryItem[] }) => {
  // GALLERY IMAGES: Images are automatically loaded from /uploads/public/images/ directory
  // To add more images: Place image files in /workspaces/Vendhan/vendhan-sports-academy/uploads/public/images/
  // Supported formats: jpg, jpeg, png, gif, webp
  // Images will appear in the gallery with category "Gallery"
  
  const [filter, setFilter] = useState('All');
  const categories = ['All', ...new Set(items.map(item => item.category))];

  const filteredItems = filter === 'All' 
    ? items 
    : items.filter(item => item.category === filter);

  return (
    <section id="gallery" className="section-padding bg-neutral-100 dark:bg-neutral-900">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl mb-4 dark:text-white">GALLERY</h2>
        <div className="w-20 h-1.5 bg-accent mx-auto rounded-full" />
      </div>

      <div className="flex flex-wrap justify-center gap-4 mb-12">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={cn(
              "px-6 py-2 rounded-full text-sm font-bold transition-all",
              filter === cat ? "bg-primary text-white" : "bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-primary/10"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <AnimatePresence mode='popLayout'>
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative aspect-square rounded-2xl overflow-hidden group cursor-pointer"
            >
              <img 
                src={item.url} 
                alt="Gallery" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white font-bold uppercase tracking-widest text-xs">{item.category}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
};

const SportsNewsTicker = ({ news }: { news: any[] }) => {
  if (news.length === 0) return null;
  return (
    <div className="bg-neutral-900 text-white py-2 overflow-hidden border-b border-white/10 relative">
      <div className="flex items-center absolute left-0 top-0 h-full px-4 bg-neutral-900 z-10 font-bold text-[10px] uppercase tracking-widest border-r border-white/10">
        Sports News
      </div>
      <motion.div 
        animate={{ x: [0, -1000] }}
        transition={{ repeat: Infinity, duration: 30, ease: 'linear' }}
        className="flex whitespace-nowrap pl-32"
      >
        {news.map((item) => (
          <span key={item.id} className="mx-8 flex items-center gap-2 text-sm">
            <span className="w-1.5 h-1.5 bg-primary rounded-full" />
            {item.title || item.text}
          </span>
        ))}
        {/* Repeat to ensure continuous flow */}
        {news.map((item) => (
          <span key={`${item.id}-dup`} className="mx-8 flex items-center gap-2 text-sm">
            <span className="w-1.5 h-1.5 bg-primary rounded-full" />
            {item.title || item.text}
          </span>
        ))}
      </motion.div>
    </div>
  );
};

const FacilitySection = ({ facilities }: { facilities: any[] }) => {
  if (facilities.length === 0) return null;
  return (
    <section id="facility" className="py-24 bg-neutral-50 dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 dark:text-white">World-Class <span className="text-primary">Facilities</span></h2>
          <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
            Our academy is equipped with state-of-the-art infrastructure to provide the best training environment for our athletes.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {facilities.map((facility) => (
            <motion.div 
              key={facility.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="group bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-neutral-100 dark:border-neutral-800"
            >
              <div className="h-64 overflow-hidden">
                <img 
                  src={facility.image || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop"} 
                  alt={facility.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                {/* FACILITY IMAGES: Each facility displays its own image
                // To change: Use admin panel to update facility.image field
                // Upload images via /api/upload-image endpoint
                // Fallback: Unsplash sports facility image if no image is set */}
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-4 dark:text-white">{facility.name}</h3>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {facility.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const AwardSection = ({ awards }: { awards: any[] }) => {
  if (awards.length === 0) return null;
  return (
    <section id="awards" className="py-24 bg-white dark:bg-neutral-900 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 dark:text-white">Awards & <span className="text-primary">Achievements</span></h2>
            <p className="text-neutral-600 dark:text-neutral-400 max-w-xl">
              Celebrating the excellence and hard work of our athletes and coaches on the national and international stage.
            </p>
          </div>
          <Trophy size={64} className="text-accent opacity-20 hidden md:block" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {awards.map((award) => (
            <motion.div 
              key={award.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex gap-6 p-6 bg-neutral-50 dark:bg-neutral-800/50 rounded-3xl border border-neutral-100 dark:border-neutral-800"
            >
              <div className="shrink-0 w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <AwardIcon size={32} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent mb-1 block">{award.date}</span>
                <h3 className="text-xl font-bold mb-2 dark:text-white leading-tight">{award.title}</h3>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm line-clamp-2">{award.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const TournamentSection = ({ tournaments }: { tournaments: any[] }) => {
  if (tournaments.length === 0) return null;
  return (
    <section id="tournaments" className="py-24 bg-neutral-950 text-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Upcoming <span className="text-primary">Tournaments</span></h2>
          <p className="text-white/50 max-w-2xl mx-auto">
            Join the competition and showcase your skills in our upcoming regional and national level tournaments.
          </p>
        </div>
        <div className="space-y-4">
          {tournaments.map((tournament) => (
            <motion.div 
              key={tournament.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="group bg-white/5 hover:bg-white/10 p-6 md:p-8 rounded-3xl border border-white/10 transition-all flex flex-col md:flex-row md:items-center gap-8"
            >
              <div className="md:w-32 shrink-0">
                <div className="text-3xl font-black text-primary">{new Date(tournament.date).getDate()}</div>
                <div className="text-xs uppercase tracking-widest text-white/40 font-bold">
                  {new Date(tournament.date).toLocaleString('default', { month: 'short', year: 'numeric' })}
                </div>
              </div>
              <div className="flex-grow">
                <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">{tournament.title}</h3>
                <div className="flex flex-wrap gap-4 text-sm text-white/60">
                  <span className="flex items-center gap-2"><MapPin size={14} className="text-accent" /> {tournament.location}</span>
                  <span className="flex items-center gap-2"><Clock size={14} className="text-accent" /> Starts 9:00 AM</span>
                </div>
              </div>
              <div className="md:w-48 shrink-0">
                <button className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-primary hover:text-white transition-all">
                  Register Now
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const CoachesSection = ({ coaches }: { coaches: Coach[] }) => {
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);

  return (
    <section id="coaches" className="py-24 bg-white dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 dark:text-white">Our <span className="text-primary">Experts</span></h2>
          <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
            Learn from the best. Our coaches bring years of professional experience and a passion for developing talent.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {coaches.map((coach) => (
            <motion.div 
              key={coach.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              onClick={() => setSelectedCoach(coach)}
              className="group cursor-pointer"
            >
              <div className="relative aspect-[3/4] rounded-3xl overflow-hidden mb-6">
                <img 
                  src={coach.image} 
                  alt={coach.name}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                  <button className="w-full py-3 bg-white text-black font-bold text-xs uppercase tracking-widest rounded-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    View Profile
                  </button>
                </div>
              </div>
              <h3 className="text-xl font-bold dark:text-white group-hover:text-primary transition-colors">{coach.name}</h3>
              <p className="text-primary font-bold text-xs uppercase tracking-widest mb-2">{coach.role}</p>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm line-clamp-2">{coach.bio}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Coach Detail Modal */}
      <AnimatePresence>
        {selectedCoach && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-neutral-900 w-full max-w-4xl rounded-[2rem] overflow-hidden shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setSelectedCoach(null)}
                className="absolute top-6 right-6 z-10 w-10 h-10 bg-black/10 dark:bg-white/10 rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="h-80 md:h-full">
                  <img 
                    src={selectedCoach.image} 
                    alt={selectedCoach.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-8 md:p-12">
                  <p className="text-primary font-bold text-sm uppercase tracking-widest mb-2">{selectedCoach.role}</p>
                  <h2 className="text-4xl font-bold mb-6 dark:text-white">{selectedCoach.name}</h2>
                  
                  <div className="space-y-8">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-3">Biography</h4>
                      <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        {selectedCoach.bio}
                      </p>
                    </div>

                    {selectedCoach.achievements && selectedCoach.achievements.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-3">Key Achievements</h4>
                        <ul className="space-y-2">
                          {selectedCoach.achievements.map((ach, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm dark:text-white">
                              <Trophy size={16} className="text-primary shrink-0 mt-0.5" />
                              <span>{ach}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedCoach.certificates && selectedCoach.certificates.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-3">Certifications</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedCoach.certificates.map((cert, i) => (
                            <span key={i} className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs font-medium dark:text-neutral-300 flex items-center gap-2">
                              <AwardIcon size={14} className="text-primary" />
                              {cert}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-12 pt-8 border-t border-neutral-100 dark:border-neutral-800">
                    <button 
                      onClick={() => { setSelectedCoach(null); document.getElementById('join')?.scrollIntoView({ behavior: 'smooth' }); }}
                      className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                    >
                      Book a Session
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

const CampSection = ({ camps, onRegister }: { camps: Camp[], onRegister: (c: Camp) => void }) => {
  // SUMMER CAMP POSTERS: Camp poster images are stored in the database
  // To add/change posters: Use the admin panel to update camp posterUrl
  // Images should be uploaded via /api/upload-image endpoint
  // Default fallback: Unsplash camp image
  
  if (camps.length === 0) return null;

  return (
    <section id="camp" className="section-padding bg-accent/5 dark:bg-accent/10">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl mb-4 dark:text-white">SEASONAL CAMPS</h2>
        <div className="w-20 h-1.5 bg-primary mx-auto rounded-full" />
      </div>

      {camps.map((camp) => (
        <div key={camp.id} className="bg-white dark:bg-neutral-900 rounded-3xl shadow-xl overflow-hidden flex flex-col lg:flex-row border border-accent/20 dark:border-accent/30">
          <div className="lg:w-1/2 relative h-96 lg:h-auto">
            <img 
              src={camp.posterUrl || "https://images.unsplash.com/photo-1472162072942-cd5147eb3902?q=80&w=800&auto=format&fit=crop"} 
              alt={camp.title} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {/* CAMP POSTER IMAGES: Each camp displays its poster image
            // To change: Use admin panel to update camp.posterUrl field
            // Upload images via /api/upload-image endpoint
            // Fallback: Unsplash camp image if no poster is set */}
            <div className="absolute top-6 left-6 bg-accent text-white px-6 py-2 rounded-full font-bold shadow-lg">
              {camp.type}
            </div>
          </div>
          <div className="lg:w-1/2 p-8 md:p-12">
            <h3 className="text-3xl md:text-4xl mb-6 dark:text-white">{camp.title}</h3>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="flex items-center gap-3">
                <Calendar className="text-primary dark:text-primary-light" size={24} />
                <div>
                  <p className="text-[10px] uppercase text-neutral-400 font-bold">Dates</p>
                  <p className="font-semibold dark:text-white">{new Date(camp.startDate).toLocaleDateString()} - {new Date(camp.endDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="text-primary dark:text-primary-light" size={24} />
                <div>
                  <p className="text-[10px] uppercase text-neutral-400 font-bold">Timing</p>
                  <p className="font-semibold dark:text-white">6:00 AM - 9:00 AM</p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h4 className="font-bold mb-4 flex items-center gap-2 dark:text-white">
                <Zap className="text-accent" size={20} /> Activities
              </h4>
              <div className="flex flex-wrap gap-2">
                {camp.activities.map((act, i) => {
                  const colors = [
                    'bg-primary/5 text-primary border-primary/10',
                    'bg-accent/5 text-accent border-accent/10',
                    'bg-green-50 text-green-600 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30',
                    'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30',
                    'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900/30'
                  ];
                  const colorClass = colors[i % colors.length];
                  return (
                    <span key={i} className={cn("px-3 py-1 rounded-lg text-xs font-medium border", colorClass)}>
                      {act}
                    </span>
                  );
                })}
              </div>
            </div>

            <p className="text-neutral-600 dark:text-neutral-400 mb-10 leading-relaxed text-sm whitespace-pre-line">
              {camp.details}
            </p>

            <button onClick={() => onRegister(camp)} className="btn btn-primary w-full md:w-auto px-12 text-lg">
              Book Your Spot
            </button>
          </div>
        </div>
      ))}
    </section>
  );
};

const CampRegistrationModal = ({ isOpen, onClose, camp }: { isOpen: boolean, onClose: () => void, camp: Camp | null }) => {
  const [formData, setFormData] = useState({
    parentName: '',
    childName: '',
    age: '',
    email: '',
    phone: '',
    registrationType: 'full' as 'full' | 'weekly'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !camp) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'camp',
          targetId: camp.id,
          ...formData
        })
      });
      
      if (response.ok) {
        toast.success('Registration successful! We will contact you soon.');
        onClose();
      } else {
        throw new Error('Failed to register');
      }
    } catch (error) {
      toast.error('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="bg-primary p-6 text-white flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">Camp Registration</h3>
            <p className="text-white/60 text-xs uppercase tracking-widest">{camp.title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-neutral-400 dark:text-neutral-500 mb-1">Parent Name</label>
              <input 
                type="text" 
                required 
                className="input-field" 
                value={formData.parentName}
                onChange={(e) => setFormData({...formData, parentName: e.target.value})}
                placeholder="Enter your name"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-neutral-400 dark:text-neutral-500 mb-1">Child Name</label>
              <input 
                type="text" 
                required 
                className="input-field" 
                value={formData.childName}
                onChange={(e) => setFormData({...formData, childName: e.target.value})}
                placeholder="Enter child's name"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-neutral-400 dark:text-neutral-500 mb-1">Child Age</label>
              <input 
                type="number" 
                required 
                min="3"
                max="18"
                className="input-field" 
                value={formData.age}
                onChange={(e) => setFormData({...formData, age: e.target.value})}
                placeholder="Age"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-neutral-400 dark:text-neutral-500 mb-1">Phone Number</label>
              <input 
                type="tel" 
                required 
                className="input-field" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})}
                placeholder="+91 00000 00000"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold uppercase text-neutral-400 dark:text-neutral-500 mb-1">Email Address</label>
            <input 
              type="email" 
              required 
              className="input-field" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="email@example.com"
            />
          </div>

          <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800">
            <label className="block text-xs font-bold uppercase text-neutral-400 dark:text-neutral-500 mb-3">Registration Type</label>
            <div className="flex gap-4">
              <label className={cn(
                "flex-1 flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all",
                formData.registrationType === 'full' 
                  ? "border-primary bg-primary/5 dark:bg-primary/10" 
                  : "border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
              )}>
                <div className="flex items-center gap-2">
                  <input 
                    type="radio" 
                    name="regType" 
                    checked={formData.registrationType === 'full'}
                    onChange={() => setFormData({...formData, registrationType: 'full'})}
                    className="hidden"
                  />
                  <span className="text-sm font-bold dark:text-white">Full Camp</span>
                </div>
                {camp.fullPrice && <span className="text-primary dark:text-primary-light font-bold">₹{camp.fullPrice}</span>}
              </label>
              
              <label className={cn(
                "flex-1 flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all",
                formData.registrationType === 'weekly' 
                  ? "border-primary bg-primary/5 dark:bg-primary/10" 
                  : "border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
              )}>
                <div className="flex items-center gap-2">
                  <input 
                    type="radio" 
                    name="regType" 
                    checked={formData.registrationType === 'weekly'}
                    onChange={() => setFormData({...formData, registrationType: 'weekly'})}
                    className="hidden"
                  />
                  <span className="text-sm font-bold dark:text-white">Weekly</span>
                </div>
                {camp.weeklyPrice && <span className="text-primary dark:text-primary-light font-bold">₹{camp.weeklyPrice}</span>}
              </label>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full btn btn-primary py-4 text-lg"
          >
            {isSubmitting ? 'Processing...' : 'Confirm Registration'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const JoinForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    program: 'Silambam'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'program',
          parentName: formData.name,
          email: formData.email,
          phone: formData.phone,
          program: formData.program
        })
      });

      if (response.ok) {
        toast.success('Application submitted! We will contact you shortly.');
        setFormData({ name: '', email: '', phone: '', program: 'Silambam' });
      } else {
        throw new Error('Failed to submit');
      }
    } catch (error) {
      toast.error('Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="join" className="section-padding bg-white dark:bg-neutral-950">
      <div className="max-w-4xl mx-auto bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl overflow-hidden border border-neutral-100 dark:border-neutral-800 flex flex-col md:flex-row">
        <div className="md:w-2/5 bg-primary p-12 text-white flex flex-col justify-center">
          <h2 className="text-4xl mb-6">Become a Champion</h2>
          <p className="text-white/70 mb-8">
            Fill out the form to start your journey with Vendhan Sports Academy. Our team will contact you shortly.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Phone size={20} className="text-accent" />
              <span>+91 98765 43210</span>
            </div>
            <div className="flex items-center gap-4">
              <MapPin size={20} className="text-accent" />
              <span>Oddanchathram, Tamilnadu</span>
            </div>
            <div className="flex items-center gap-4">
              <Mail size={20} className="text-accent" />
              <span>info@vendhansports.com</span>
            </div>
          </div>
        </div>
        <div className="md:w-3/5 p-12">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-bold mb-2 dark:text-white">Full Name</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="John Doe" 
                required 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold mb-2 dark:text-white">Email</label>
                <input 
                  type="email" 
                  className="input-field" 
                  placeholder="john@example.com" 
                  required 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 dark:text-white">Phone</label>
                <input 
                  type="tel" 
                  className="input-field" 
                  placeholder="+91 00000 00000" 
                  required 
                  value={formData.phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setFormData({...formData, phone: val});
                  }}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 dark:text-white">Select Program</label>
              <select 
                className="input-field"
                value={formData.program}
                onChange={(e) => setFormData({...formData, program: e.target.value})}
              >
                <option>Silambam</option>
                <option>Football</option>
                <option>Yoga</option>
                <option>Athletics</option>
                <option>Skating</option>
              </select>
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full btn btn-primary py-4">
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

const Footer = ({ academyInfo }: { academyInfo: any }) => {
  return (
    <footer className="bg-neutral-900 text-white pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <div className="flex flex-col items-start gap-4 mb-6">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center overflow-hidden shadow-xl border border-white/10">
                <img 
                  src="https://api.dicebear.com/7.x/initials/svg?seed=VSA&backgroundColor=f27d26" 
                  alt="Academy Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h2 className="text-2xl font-black leading-none tracking-tighter">{academyInfo?.name || "VENDHAN"}</h2>
                <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-white/40 mt-1">Sports Academy</p>
              </div>
            </div>
            <p className="text-white/50 max-w-md leading-relaxed">
              {academyInfo?.motto || "Empowering the next generation of athletes through traditional wisdom and modern training techniques. Join us in our mission to create world-class champions."}
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-6 uppercase tracking-widest text-xs text-accent">Academy Info</h4>
            <ul className="space-y-4 text-white/60 text-sm">
              <li className="flex items-center gap-2"><MapPin size={14} className="text-primary" /> {academyInfo?.location || "Oddanchathram, Tamilnadu"}</li>
              <li className="flex items-center gap-2"><Phone size={14} className="text-primary" /> 95666 72112 | 86086 49937</li>
              <li className="flex items-center gap-2"><Trophy size={14} className="text-primary" /> Est. {academyInfo?.established || "2015"}</li>
              {academyInfo?.stats && (
                <>
                  <li className="flex items-center gap-2"><Users size={14} className="text-primary" /> {academyInfo.stats.students}+ Students</li>
                  <li className="flex items-center gap-2"><UserCheck size={14} className="text-primary" /> {academyInfo.stats.coaches}+ Coaches</li>
                </>
              )}
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 uppercase tracking-widest text-xs text-accent">Follow Us</h4>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary transition-colors">
                <Twitter size={20} />
              </a>
            </div>
          </div>
        </div>
        
        <div className="pt-10 border-t border-white/10 text-center text-white/30 text-xs">
          © {new Date().getFullYear()} {academyInfo?.name || "Vendhan Sports Academy"}. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
};

// --- Admin Add Modal ---

const AdminAddModal = ({ type, initialData, onClose, onSuccess }: { type: string, initialData?: any, onClose: () => void, onSuccess: () => void }) => {
  const [formData, setFormData] = useState<any>(initialData || {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    const data = new FormData();
    data.append('file', file);

    try {
      const response = await fetch('/api/process-file', {
        method: 'POST',
        body: data
      });
      const res = await response.json();
      if (res.text) {
        setFormData((prev: any) => ({
          ...prev,
          content: res.text,
          description: prev.description || res.text.substring(0, 150) + '...',
          bio: prev.bio || res.text
        }));
        toast.success('Text extracted from file successfully!');
      } else {
        toast.error(res.error || 'Failed to process file');
      }
    } catch (error) {
      toast.error('Error uploading file');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    const data = new FormData();
    data.append('image', file);

    try {
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: data
      });
      const res = await response.json();
      if (res.url) {
        setFormData((prev: any) => ({
          ...prev,
          image: res.url,
          url: res.url // for gallery
        }));
        toast.success('Image uploaded successfully!');
      } else {
        toast.error(res.error || 'Failed to upload image');
      }
    } catch (error) {
      toast.error('Error uploading image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const isEdit = !!initialData?.id;
    const url = type === 'academy-info' ? '/api/academy-info' : (isEdit ? `/api/${type}/${initialData.id}` : `/api/${type}`);
    const method = type === 'academy-info' ? 'PUT' : (isEdit ? 'PUT' : 'POST');

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          date: formData.date || new Date().toISOString().split('T')[0],
          createdAt: formData.createdAt || new Date().toISOString()
        })
      });
      if (response.ok) {
        toast.success(isEdit ? 'Updated successfully' : 'Added successfully');
        onSuccess();
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      toast.error('Failed to save item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFields = () => {
    const commonImageField = (
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500">Image</label>
        <div className="flex gap-4 items-center">
          {formData.image || formData.url ? (
            <img src={formData.image || formData.url} className="w-16 h-16 object-cover rounded-lg border border-neutral-200" alt="Preview" />
          ) : (
            <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center text-neutral-400">
              <ImageIcon size={24} />
            </div>
          )}
          <label className="cursor-pointer bg-neutral-100 dark:bg-neutral-800 px-4 py-2 rounded-xl text-xs font-bold hover:bg-neutral-200 transition-colors">
            {isUploadingImage ? 'Uploading...' : 'Upload Image'}
            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploadingImage} />
          </label>
          <input 
            type="text" 
            placeholder="Or enter Image URL" 
            className="input-field flex-grow text-xs" 
            value={formData.image || formData.url || ''} 
            onChange={e => setFormData({...formData, image: e.target.value, url: e.target.value})} 
          />
        </div>
      </div>
    );

    switch (type) {
      case 'announcements':
        return (
          <>
            <input type="text" placeholder="Title" required className="input-field" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} />
            <textarea placeholder="Content" required className="input-field min-h-[150px]" value={formData.content || formData.text || ''} onChange={e => setFormData({...formData, content: e.target.value, text: e.target.value})} />
            <select className="input-field" value={formData.type || 'general'} onChange={e => setFormData({...formData, type: e.target.value})}>
              <option value="general">General</option>
              <option value="important">Important</option>
              <option value="event">Event</option>
            </select>
          </>
        );
      case 'programs':
        return (
          <>
            <input type="text" placeholder="Title" required className="input-field" value={formData.title || formData.name || ''} onChange={e => setFormData({...formData, title: e.target.value, name: e.target.value})} />
            <textarea placeholder="Description" required className="input-field min-h-[100px]" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
            <input type="text" placeholder="Schedule (e.g. Mon, Wed 4-6 PM)" className="input-field" value={formData.schedule || ''} onChange={e => setFormData({...formData, schedule: e.target.value})} />
            {commonImageField}
          </>
        );
      case 'coaches':
        return (
          <>
            <input type="text" placeholder="Name" required className="input-field" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
            <input type="text" placeholder="Role" required className="input-field" value={formData.role || ''} onChange={e => setFormData({...formData, role: e.target.value})} />
            <textarea placeholder="Bio" required className="input-field min-h-[100px]" value={formData.bio || ''} onChange={e => setFormData({...formData, bio: e.target.value})} />
            {commonImageField}
          </>
        );
      case 'events':
        return (
          <>
            <input type="text" placeholder="Title" required className="input-field" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} />
            <div className="grid grid-cols-2 gap-4">
              <input type="date" required className="input-field" value={formData.date || ''} onChange={e => setFormData({...formData, date: e.target.value})} />
              <input type="time" required className="input-field" value={formData.time || ''} onChange={e => setFormData({...formData, time: e.target.value})} />
            </div>
            <input type="text" placeholder="Location" required className="input-field" value={formData.location || ''} onChange={e => setFormData({...formData, location: e.target.value})} />
            <textarea placeholder="Description" required className="input-field min-h-[100px]" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
            {commonImageField}
          </>
        );
      case 'facilities':
        return (
          <>
            <input type="text" placeholder="Facility Name" required className="input-field" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
            <textarea placeholder="Description" required className="input-field min-h-[100px]" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
            {commonImageField}
          </>
        );
      case 'awards':
        return (
          <>
            <input type="text" placeholder="Award Title" required className="input-field" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} />
            <input type="date" className="input-field" value={formData.date || ''} onChange={e => setFormData({...formData, date: e.target.value})} />
            <textarea placeholder="Description" required className="input-field min-h-[100px]" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
            {commonImageField}
          </>
        );
      case 'tournaments':
        return (
          <>
            <input type="text" placeholder="Tournament Title" required className="input-field" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} />
            <div className="grid grid-cols-2 gap-4">
              <input type="date" required className="input-field" value={formData.date || ''} onChange={e => setFormData({...formData, date: e.target.value})} />
              <input type="text" placeholder="Location" className="input-field" value={formData.location || ''} onChange={e => setFormData({...formData, location: e.target.value})} />
            </div>
            <textarea placeholder="Description" required className="input-field min-h-[100px]" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
            {commonImageField}
          </>
        );
      case 'sports-news':
        return (
          <>
            <input type="text" placeholder="Title" required className="input-field" value={formData.title || formData.text || ''} onChange={e => setFormData({...formData, title: e.target.value, text: e.target.value})} />
            <input type="text" placeholder="Category" className="input-field" value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})} />
          </>
        );
      case 'academy-info':
        return (
          <>
            <input type="text" placeholder="Academy Name" required className="input-field" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
            <input type="text" placeholder="Motto" required className="input-field" value={formData.motto || ''} onChange={e => setFormData({...formData, motto: e.target.value})} />
            <input type="text" placeholder="Location" required className="input-field" value={formData.location || ''} onChange={e => setFormData({...formData, location: e.target.value})} />
            <div className="grid grid-cols-2 gap-4">
              <input type="number" placeholder="Established Year" required className="input-field" value={formData.established || ''} onChange={e => setFormData({...formData, established: e.target.value})} />
              <input type="number" placeholder="Students Count" required className="input-field" value={formData.students || ''} onChange={e => setFormData({...formData, students: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input type="number" placeholder="Coaches Count" required className="input-field" value={formData.coaches || ''} onChange={e => setFormData({...formData, coaches: e.target.value})} />
              <input type="number" placeholder="Programs Count" required className="input-field" value={formData.programs || ''} onChange={e => setFormData({...formData, programs: e.target.value})} />
            </div>
          </>
        );
      case 'gallery':
        return commonImageField;
      case 'camps':
        return (
          <>
            <input type="text" placeholder="Camp Title" required className="input-field" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} />
            <input type="text" placeholder="Camp Type (e.g. Summer Camp)" required className="input-field" value={formData.type || ''} onChange={e => setFormData({...formData, type: e.target.value})} />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase text-neutral-400 font-bold mb-1">Start Date</label>
                <input type="date" required className="input-field" value={formData.startDate || ''} onChange={e => setFormData({...formData, startDate: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-neutral-400 font-bold mb-1">End Date</label>
                <input type="date" required className="input-field" value={formData.endDate || ''} onChange={e => setFormData({...formData, endDate: e.target.value})} />
              </div>
            </div>
            <textarea placeholder="Details" required className="input-field min-h-[100px]" value={formData.details || ''} onChange={e => setFormData({...formData, details: e.target.value})} />
            <input type="text" placeholder="Poster URL" className="input-field" value={formData.posterUrl || ''} onChange={e => setFormData({...formData, posterUrl: e.target.value})} />
            <input type="text" placeholder="Activities (comma separated)" className="input-field" value={Array.isArray(formData.activities) ? formData.activities.join(', ') : formData.activities || ''} onChange={e => setFormData({...formData, activities: e.target.value.split(',').map(s => s.trim())})} />
            <div className="grid grid-cols-2 gap-4">
              <input type="number" placeholder="Full Price" className="input-field" value={formData.fullPrice || ''} onChange={e => setFormData({...formData, fullPrice: parseInt(e.target.value)})} />
              <input type="number" placeholder="Weekly Price" className="input-field" value={formData.weeklyPrice || ''} onChange={e => setFormData({...formData, weeklyPrice: parseInt(e.target.value)})} />
            </div>
          </>
        );
      default:
        return <p>Form for {type} not fully implemented yet.</p>;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-neutral-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <h3 className="text-xl font-bold dark:text-white">{initialData?.id ? 'Edit' : 'Add New'} {type.replace('-', ' ')}</h3>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
            <X size={20} className="dark:text-white" />
          </button>
        </div>
        
        <div className="p-8 max-h-[70vh] overflow-y-auto">
          {(type === 'announcements' || type === 'coaches' || type === 'programs') && (
            <div className="mb-6 p-4 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm dark:text-white">Upload Content from File</h4>
                  <p className="text-xs text-neutral-500">Support .txt and .docx files</p>
                </div>
                <label className="cursor-pointer bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary-dark transition-all">
                  <Upload size={16} />
                  {isProcessingFile ? 'Processing...' : 'Choose File'}
                  <input type="file" className="hidden" accept=".txt,.docx" onChange={handleFileUpload} disabled={isProcessingFile} />
                </label>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {renderFields()}
            <div className="pt-4 flex gap-4">
              <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl font-bold border border-neutral-200 dark:border-neutral-700 dark:text-white">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="flex-1 btn btn-primary py-3">{isSubmitting ? 'Saving...' : (initialData?.id ? 'Update Item' : 'Add Item')}</button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

// --- Admin Panel ---

const AdminPanel = ({ user }: { user: FirebaseUser }) => {
  const [activeTab, setActiveTab] = useState('programs');
  const [data, setData] = useState<any>({
    programs: [],
    coaches: [],
    events: [],
    gallery: [],
    camps: [],
    registrations: [],
    announcements: [],
    'sports-news': [],
    facilities: [],
    awards: [],
    tournaments: [],
    'academy-info': []
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const fetchAdminData = async () => {
    try {
      const [
        programsRes, 
        coachesRes, 
        eventsRes, 
        galleryRes, 
        campsRes, 
        registrationsRes,
        announcementsRes,
        sportsNewsRes,
        facilitiesRes,
        awardsRes,
        tournamentsRes,
        academyInfoRes
      ] = await Promise.all([
        fetch('/api/programs').then(r => r.json()),
        fetch('/api/coaches').then(r => r.json()),
        fetch('/api/events').then(r => r.json()),
        fetch('/api/gallery').then(r => r.json()),
        fetch('/api/camps').then(r => r.json()),
        fetch('/api/registrations').then(r => r.json()),
        fetch('/api/announcements').then(r => r.json()),
        fetch('/api/sports-news').then(r => r.json()),
        fetch('/api/facilities').then(r => r.json()),
        fetch('/api/awards').then(r => r.json()),
        fetch('/api/tournaments').then(r => r.json()),
        fetch('/api/academy-info').then(r => r.json())
      ]);

      setData({
        programs: programsRes,
        coaches: coachesRes,
        events: eventsRes,
        gallery: galleryRes,
        camps: campsRes,
        registrations: registrationsRes,
        announcements: announcementsRes,
        'sports-news': sportsNewsRes,
        facilities: facilitiesRes,
        awards: awardsRes,
        tournaments: tournamentsRes,
        'academy-info': [academyInfoRes]
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleDelete = async (coll: string, id: string) => {
    if (window.confirm('Are you sure?')) {
      try {
        // Note: Delete endpoints not fully implemented in server.ts yet
        // but this is the pattern
        const response = await fetch(`/api/${coll}/${id}`, { method: 'DELETE' });
        if (response.ok) {
          toast.success('Deleted successfully');
          fetchAdminData();
        } else {
          throw new Error('Failed to delete');
        }
      } catch (error) {
        toast.error('Delete failed');
      }
    }
  };

  const tabs = [
    { id: 'programs', name: 'Programs', icon: Dumbbell },
    { id: 'coaches', name: 'Coaches', icon: Users },
    { id: 'events', name: 'Events', icon: Calendar },
    { id: 'facilities', name: 'Facilities', icon: MapPin },
    { id: 'awards', name: 'Awards', icon: AwardIcon },
    { id: 'tournaments', name: 'Tournaments', icon: Trophy },
    { id: 'gallery', name: 'Gallery', icon: ImageIcon },
    { id: 'camps', name: 'Camps', icon: Zap },
    { id: 'announcements', name: 'Announcements', icon: Bell },
    { id: 'sports-news', name: 'Sports News', icon: Newspaper },
    { id: 'academy-info', name: 'Academy Info', icon: Info },
    { id: 'registrations', name: 'Registrations', icon: User },
  ];

  return (
    <div className="pt-24 min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl mb-2 dark:text-white">Admin Dashboard</h1>
            <p className="text-neutral-500 dark:text-neutral-400">Manage academy content and registrations</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">{user.email}</span>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Shield size={20} />
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Tabs */}
          <div className="lg:w-64 space-y-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                  activeTab === tab.id ? "bg-primary text-white shadow-lg" : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                )}
              >
                <tab.icon size={18} />
                {tab.name}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-grow bg-white dark:bg-neutral-900 rounded-3xl shadow-xl p-8 border border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl capitalize dark:text-white">{activeTab.replace('-', ' ')}</h2>
              {activeTab !== 'registrations' && activeTab !== 'academy-info' && (
                <button 
                  onClick={() => {
                    setEditingItem(null);
                    setIsModalOpen(true);
                  }}
                  className="btn btn-primary py-2 px-4 text-sm"
                >
                  <Plus size={18} /> Add New
                </button>
              )}
            </div>

            {isModalOpen && (
              <AdminAddModal 
                type={activeTab} 
                initialData={editingItem}
                onClose={() => {
                  setIsModalOpen(false);
                  setEditingItem(null);
                }} 
                onSuccess={() => {
                  setIsModalOpen(false);
                  setEditingItem(null);
                  fetchAdminData();
                }}
              />
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-neutral-100 dark:border-neutral-800 text-neutral-400 text-xs uppercase tracking-widest">
                    <th className="pb-4 font-bold">{activeTab === 'registrations' ? 'User / Target' : 'Details'}</th>
                    <th className="pb-4 font-bold">{activeTab === 'registrations' ? 'Contact Info' : 'Status/Meta'}</th>
                    <th className="pb-4 font-bold text-right">{activeTab === 'registrations' ? 'Date' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800">
                  {data[activeTab]?.map((item: any) => {
                    const getTargetName = (reg: any) => {
                      if (reg.type === 'event') return data.events.find((e: any) => e.id === reg.targetId)?.title || 'Unknown Event';
                      if (reg.type === 'camp') return data.camps.find((c: any) => c.id === reg.targetId)?.title || 'Unknown Camp';
                      if (reg.type === 'program') return reg.program || 'Unknown Program';
                      return 'Unknown';
                    };

                    const formatDate = (dateStr: string) => {
                      if (!dateStr) return 'N/A';
                      try {
                        return new Date(dateStr).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                      } catch (e) {
                        return dateStr;
                      }
                    };

                    if (activeTab === 'registrations') {
                      return (
                        <tr key={item.id} className="group hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                          <td className="py-4">
                            <div className="font-bold dark:text-white">{item.childName || item.parentName || 'Anonymous'}</div>
                            <div className="text-[10px] text-primary dark:text-primary-light font-bold uppercase tracking-wider mt-1">
                              {item.type}: {getTargetName(item)}
                            </div>
                            {item.parentName && item.childName && (
                              <div className="text-[10px] text-neutral-400 mt-0.5">Parent: {item.parentName}</div>
                            )}
                          </td>
                          <td className="py-4">
                            <div className="text-sm dark:text-neutral-300">{item.email}</div>
                            <div className="text-xs text-neutral-500 dark:text-neutral-500">{item.phone}</div>
                          </td>
                          <td className="py-4 text-right">
                            <div className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{formatDate(item.createdAt)}</div>
                            <button 
                              onClick={() => handleDelete('registrations', item.id)}
                              className="mt-2 p-1.5 text-neutral-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={item.id} className="group hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            {(item.image || item.url) && (
                              <img src={item.image || item.url} className="w-10 h-10 rounded-lg object-cover border border-neutral-100 dark:border-neutral-800" alt="Item" />
                            )}
                            <div>
                              <div className="font-bold dark:text-white">{item.name || item.title || 'Untitled'}</div>
                              <div className="text-xs text-neutral-500 dark:text-neutral-500 line-clamp-1">
                                {item.description || item.category || item.details || item.content || item.excerpt || item.role || 'No details'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-full text-[10px] font-bold uppercase tracking-widest dark:text-neutral-300">
                            {item.status || item.type || item.category || 'Active'}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => {
                                setEditingItem(item);
                                setIsModalOpen(true);
                              }}
                              className="p-2 text-neutral-400 hover:text-primary transition-colors"
                            >
                              <Edit2 size={16} />
                            </button>
                            {activeTab !== 'academy-info' && (
                              <button 
                                onClick={() => handleDelete(activeTab, item.id)}
                                className="p-2 text-neutral-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {(!data[activeTab] || data[activeTab].length === 0) && (
                    <tr>
                      <td colSpan={3} className="py-12 text-center text-neutral-400 italic">
                        No items found in this category.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [loading, setLoading] = useState(true);
  const [isCampModalOpen, setIsCampModalOpen] = useState(false);
  const [selectedCamp, setSelectedCamp] = useState<Camp | null>(null);
  
  // Data States
  const [programs, setPrograms] = useState<Program[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [camps, setCamps] = useState<Camp[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [awards, setAwards] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [sportsNews, setSportsNews] = useState<SportsNews[]>([]);
  const [academyInfo, setAcademyInfo] = useState<any>(null);

  // Data Fetching Effect
  const fetchData = async () => {
    try {
      const [
        programsRes, 
        coachesRes, 
        eventsRes, 
        galleryRes, 
        campsRes, 
        announcementsRes, 
        sportsNewsRes, 
        academyInfoRes,
        facilitiesRes,
        awardsRes,
        tournamentsRes
      ] = await Promise.all([
        fetch('/api/programs').then(r => r.json()),
        fetch('/api/coaches').then(r => r.json()),
        fetch('/api/events').then(r => r.json()),
        fetch('/api/gallery').then(r => r.json()),
        fetch('/api/camps').then(r => r.json()),
        fetch('/api/announcements').then(r => r.json()),
        fetch('/api/sports-news').then(r => r.json()),
        fetch('/api/academy-info').then(r => r.json()),
        fetch('/api/facilities').then(r => r.json()),
        fetch('/api/awards').then(r => r.json()),
        fetch('/api/tournaments').then(r => r.json())
      ]);

      setPrograms(programsRes);
      setCoaches(coachesRes);
      setEvents(eventsRes);
      setGallery(galleryRes);
      setCamps(campsRes);
      setAnnouncements(announcementsRes);
      setSportsNews(sportsNewsRes);
      setAcademyInfo(academyInfoRes);
      setFacilities(facilitiesRes);
      setAwards(awardsRes);
      setTournaments(tournamentsRes);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load academy data');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auth Effect
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const adminEmail = "vendhanftpwatch@gmail.com";
        setIsAdmin(u.email === adminEmail);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubAuth();
  }, []);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success('Logged in successfully!');
    } catch (error) {
      toast.error('Login failed');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    toast.success('Logged out');
    setActiveSection('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavClick = (sectionId: string) => {
    setActiveSection(sectionId);
    if (sectionId === 'admin') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        const offset = 80;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      } else if (sectionId === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
  };

  const handleEnroll = (program: Program) => {
    handleNavClick('join');
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-primary text-white">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-12 h-12 border-4 border-white border-t-transparent rounded-full mb-4"
        />
        <p className="font-display font-bold tracking-widest uppercase text-xs">Loading Academy...</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="relative">
        <Toaster position="top-center" />
        <Navbar 
          user={user} 
          isAdmin={isAdmin} 
          onLogin={handleLogin} 
          onLogout={handleLogout}
          activeSection={activeSection}
          onNavClick={handleNavClick}
        />
        <SportsNewsTicker news={sportsNews} />

        {activeSection === 'admin' && isAdmin ? (
          <AdminPanel user={user!} />
        ) : (
          <main>
            <Hero onExplore={() => setActiveSection('programs')} />
            
            {/* Announcements Section */}
            {announcements.length > 0 && (
              <section className="py-8 bg-primary/5 dark:bg-primary/10 border-y border-primary/10 dark:border-primary/20">
                <div className="container mx-auto px-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center text-primary">
                      <Bell size={20} />
                    </div>
                    <h2 className="text-xl font-bold dark:text-white">Latest Announcements</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {announcements.map((ann) => (
                      <div key={ann.id} className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-neutral-600 dark:text-neutral-400 text-xs">{ann.date}</p>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest",
                            ann.type === 'important' ? "bg-red-100 text-red-600" : "bg-primary/10 text-primary"
                          )}>
                            {ann.type || 'General'}
                          </span>
                        </div>
                        <h3 className="font-bold text-sm mb-1 dark:text-white">{ann.title}</h3>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-3">{ann.content || ann.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            <ProgramsSection programs={programs} onEnroll={handleEnroll} />
            <FacilitySection facilities={facilities} />
            <AwardSection awards={awards} />
            <TournamentSection tournaments={tournaments} />
            <FacilityRental onBook={() => setActiveSection('join')} />
            <EventsSection events={events} onRegister={() => setActiveSection('join')} />
            <GallerySection items={gallery} />
            <CampSection camps={camps} onRegister={(camp) => { setSelectedCamp(camp); setIsCampModalOpen(true); }} />
            <CoachesSection coaches={coaches} />
            <JoinForm />
          </main>
        )}

        <Footer academyInfo={academyInfo} />
        <CampRegistrationModal 
          isOpen={isCampModalOpen} 
          onClose={() => setIsCampModalOpen(false)} 
          camp={selectedCamp} 
        />
      </div>
    </ErrorBoundary>
  );
}
