'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import {
  ArrowRight,
  Bot,
  Brain,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Compass,
  Heart,
  ListTodo,
  Lock,
  Plus,
  Play,
  RotateCcw,
  Smile,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  X,
  Zap,
  Activity,
  AlertCircle,
  Menu,
  Moon,
  Sun,
  Shield,
  MessageSquare,
  Sparkle,
  Layers,
  ChevronRight,
  BookOpen
} from 'lucide-react'
import { Button, Card, Badge } from '@/components/ui'

// Mock Data for simulator presets
const SIMULATOR_PRESETS = [
  {
    title: 'Crack CAT, get placed and stay fit',
    goals: [
      { text: 'Acing CAT Quantitative & Verbal sections', icon: Target, category: 'Academic' },
      { text: 'Securing Software Engineering Placement', icon: Compass, category: 'Career' },
      { text: 'Maintain a 3x weekly workout routine', icon: Heart, category: 'Health' }
    ],
    roadmap: [
      { phase: 'Phase 1: Foundations (Months 1-3)', details: 'Daily Quant fundamentals, build portfolio site, 3x cardio blocks.' },
      { phase: 'Phase 2: Practice & Prep (Months 4-6)', details: 'Verbal mocks, DSA coding challenges, introduce high-intensity intervals.' },
      { phase: 'Phase 3: Peak Performance (Months 7-8)', details: 'Full-length CAT mocks, placement interviews, active rest days.' }
    ],
    schedule: [
      { time: '07:00 AM - 08:00 AM', label: '🏃 Morning Cardio Run (Active Workout)', tag: 'Health', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
      { time: '09:00 AM - 11:30 AM', label: '🧠 CAT Quant Mock & Review (Deep Work)', tag: 'Academic', color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
      { time: '01:30 PM - 03:00 PM', label: '💻 Placement prep: DSA & System Design', tag: 'Career', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
      { time: '05:00 PM - 06:00 PM', label: '💬 AI Coach Check-in: Strategy adjustment', tag: 'AI Assist', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' }
    ]
  },
  {
    title: 'Launch a SaaS startup and run a half-marathon',
    goals: [
      { text: 'Build & launch an AI productivity product', icon: Target, category: 'Career' },
      { text: 'Run 21K under 2 hours in December', icon: Activity, category: 'Fitness' },
      { text: 'Establish a healthy 7-hour sleep routine', icon: Heart, category: 'Wellness' }
    ],
    roadmap: [
      { phase: 'Phase 1: Validation & Base Mileage', details: 'Conduct 20 user interviews, launch landing page, 15km weekly base mileage.' },
      { phase: 'Phase 2: MVP Development & Tempo Runs', details: 'Build core AI gateway backend, tempo interval runs, sleep hygiene habits.' },
      { phase: 'Phase 3: Beta Launch & Endurance', details: 'Onboard beta users, run 18k long runs, optimize sleep schedules.' }
    ],
    schedule: [
      { time: '06:30 AM - 08:00 AM', label: '👟 Tempo Interval Running (Cardio)', tag: 'Fitness', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
      { time: '09:30 AM - 12:00 PM', label: '⚡ Coding AI Gateway & Core API (Deep Work)', tag: 'Career', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
      { time: '02:00 PM - 03:30 PM', label: '📊 User interview reviews & positioning pitch', tag: 'Career', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
      { time: '09:00 PM - 09:30 PM', label: '🕯️ Wind-down prep & meditation block', tag: 'Wellness', color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' }
    ]
  },
  {
    title: 'Transition to AI research and read 24 books',
    goals: [
      { text: 'Publish deep learning paper in ML venue', icon: Brain, category: 'Learning' },
      { text: 'Read 2 books per month (Non-fiction & ML)', icon: BookOpen, category: 'Growth' },
      { text: 'Improve energy levels through nutrition', icon: Heart, category: 'Wellness' }
    ],
    roadmap: [
      { phase: 'Phase 1: Literature Review & Diet Sync', details: 'Read 15 foundational papers, track macro-nutrients, read 4 books.' },
      { phase: 'Phase 2: Experiments & Consistency', details: 'Train research models, structure 30-min reading blocks, test glucose profiles.' },
      { phase: 'Phase 3: Paper Drafting & Review', details: 'Write LaTeX manuscript, submit to ML conference, finalize books 20-24.' }
    ],
    schedule: [
      { time: '08:00 AM - 08:45 AM', label: '📖 Read "Atomic Habits" (Growth Block)', tag: 'Growth', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
      { time: '09:30 AM - 12:30 PM', label: '🧪 AI Model Training & LaTeX drafting (Deep Work)', tag: 'Learning', color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
      { time: '03:00 PM - 04:30 PM', label: '🍎 Meal prep: Nutrition tracker & food review', tag: 'Wellness', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
      { time: '07:30 PM - 08:30 PM', label: '💬 AI Coach reflection: energy level review', tag: 'AI Assist', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' }
    ]
  }
]

export function LandingPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const [activePreset, setActivePreset] = useState(0)
  const [simulatorStep, setSimulatorStep] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Schedule optimizer states
  const [scheduleState, setScheduleState] = useState<'normal' | 'sick' | 'meeting' | 'sleep'>('normal')

  // UI Screen Mockup states
  const [activeTab, setActiveTab] = useState<'dashboard' | 'coach' | 'roadmaps' | 'analytics'>('dashboard')

  // FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  // Typing simulator state for Coach Chat
  const [coachInput, setCoachInput] = useState('')
  const [chatMessages, setChatMessages] = useState([
    { sender: 'coach', text: 'Welcome back! I noticed you slept 8.2 hours last night and your focus levels have been highest before noon. Ready to lock in?' },
  ])
  const [coachTyping, setCoachTyping] = useState(false)

  // Handle Preset change with simulated AI execution sequence
  const handlePresetSelect = (index: number) => {
    if (animating) return
    setActivePreset(index)
    setSimulatorStep(0)
    setAnimating(true)
  }

  useEffect(() => {
    if (!animating) return

    const timers = [
      setTimeout(() => setSimulatorStep(1), 800),    // Extracting Goals
      setTimeout(() => setSimulatorStep(2), 2000),   // Generating Roadmaps
      setTimeout(() => setSimulatorStep(3), 3200),   // Creating Daily Plan
      setTimeout(() => {
        setSimulatorStep(4)
        setAnimating(false)
      }, 4400) // Completed
    ]

    return () => timers.forEach(clearTimeout)
  }, [animating, activePreset])

  // Trigger default animation on load
  useEffect(() => {
    setAnimating(true)
    setSimulatorStep(0)
  }, [])

  // Send message simulator for AI Coach
  const sendCoachMessage = (text: string) => {
    if (!text.trim() || coachTyping) return
    const newMsg = { sender: 'user', text }
    setChatMessages((prev) => [...prev, newMsg])
    setCoachInput('')
    setCoachTyping(true)

    // Simulate AI thinking and replying
    setTimeout(() => {
      let reply = "I've logged that context in your long-term memory. I'll adjust today's routines to support you."
      if (text.toLowerCase().includes('overwhelm') || text.toLowerCase().includes('stressed')) {
        reply = "I understand. I'm dynamically buffering your afternoon. Let's push the DSA prep to tomorrow and insert a 45-minute recovery walk now. How does that sound?"
      } else if (text.toLowerCase().includes('focus') || text.toLowerCase().includes('work')) {
        reply = "Understood. Locking down notifications. Your calendar is clear for the next 2 hours. Go deep!"
      }
      setChatMessages((prev) => [...prev, { sender: 'coach', text: reply }])
      setCoachTyping(false)
    }, 1500)
  }

  // Adaptive scheduling mock details
  const getOptimizerSchedule = () => {
    switch (scheduleState) {
      case 'sick':
        return [
          { time: '08:00 AM - 09:00 AM', label: '🍵 Morning Hydration & Vitamin sync', tag: 'Recovery', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', important: true },
          { time: '10:00 AM - 12:00 PM', label: '💤 Rest & Recovery Sleep block', tag: 'Rest', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
          { time: '02:00 PM - 03:00 PM', label: '🌱 Light 20-min reading or reflection', tag: 'Growth', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
          { time: '05:00 PM - 06:00 PM', label: '💬 AI Coach: Health status check-in', tag: 'AI Assist', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
          { time: 'AI Note', label: '⚠️ SICK PROTOCOL: Heavy cognitive blocks postponed. Focus on immune recovery.', tag: 'Status Alert', color: 'bg-red-500/10 text-red-600 border border-red-500/20' }
        ]
      case 'meeting':
        return [
          { time: '07:00 AM - 08:00 AM', label: '🏃 Morning Cardio Run (Active Workout)', tag: 'Health', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
          { time: '09:00 AM - 11:00 AM', label: '🧠 CAT Quant Mock & Review (Deep Work)', tag: 'Academic', color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
          { time: '11:00 AM - 12:30 PM', label: '💻 Placement prep: DSA coding challenges', tag: 'Career', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
          { time: '02:00 PM - 03:30 PM', label: '🤝 [NEW] Unexpected client sync & presentation', tag: 'Conflict Resolved', color: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/25', important: true },
          { time: '04:00 PM - 05:00 PM', label: '💬 AI Coach Check-in: Strategy adjustment', tag: 'AI Assist', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' }
        ]
      case 'sleep':
        return [
          { time: '07:00 AM - 08:00 AM', label: '🧘 Light Morning Stretch (No intense workout today)', tag: 'Adjustment', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
          { time: '09:30 AM - 10:30 AM', label: '💬 Daily Review & Coach check-in', tag: 'AI Assist', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
          { time: '11:00 AM - 01:00 PM', label: '🧠 CAT Quant Practice (Shortened Focus Block)', tag: 'Academic', color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
          { time: '03:00 PM - 04:30 PM', label: '💤 20-min Power Nap & light admin duties', tag: 'Fatigue Buffer', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', important: true },
          { time: 'AI Note', label: '⚠️ FATIGUE RISK: 4.2h sleep detected. Focus blocks shortened by 30% to prevent burnout.', tag: 'Status Alert', color: 'bg-orange-500/10 text-orange-600 border border-orange-500/20' }
        ]
      default:
        return [
          { time: '07:00 AM - 08:00 AM', label: '🏃 Morning Cardio Run (Active Workout)', tag: 'Health', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
          { time: '09:00 AM - 11:30 AM', label: '🧠 CAT Quant Mock & Review (Deep Work)', tag: 'Academic', color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
          { time: '01:30 PM - 03:00 PM', label: '💻 Placement prep: DSA & System Design', tag: 'Career', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
          { time: '05:00 PM - 06:00 PM', label: '💬 AI Coach Check-in: Strategy adjustment', tag: 'AI Assist', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' }
        ]
    }
  }

  return (
    <div className="min-h-screen bg-bg text-text-primary overflow-x-hidden selection:bg-accent selection:text-accent-text font-sans pb-1">
      {/* 1. Header/Navigation */}
      <header className="sticky top-0 z-50 w-full border-b-2 border-border bg-bg/90 backdrop-blur-md transition-all">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-accent text-lg font-bold text-accent-text neo-border neo-transition group-hover:scale-105">
                L
              </div>
              <span className="text-xl font-bold tracking-tight font-heading">LifeOS</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-text-secondary">
              <a href="#problem" className="hover:text-text-primary transition-colors">Struggles</a>
              <a href="#how-it-works" className="hover:text-text-primary transition-colors">Paradigm</a>
              <a href="#simulator" className="hover:text-text-primary transition-colors">Simulator</a>
              <a href="#daily-planning" className="hover:text-text-primary transition-colors">Daily Plan</a>
              <a href="#faq" className="hover:text-text-primary transition-colors">FAQ</a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-sm neo-border hover:bg-bg-secondary neo-transition bg-surface active:translate-y-[1px]"
              aria-label="Toggle Theme"
            >
              {!mounted ? <span className="h-4 w-4 block" /> : theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <Link href="/login" className="hidden sm:inline-flex">
              <Button variant="outline" size="sm" className="h-9 px-4">
                Sign In
              </Button>
            </Link>

            <Link href="/signup">
              <Button variant="primary" size="sm" className="h-9 px-4 text-xs sm:text-sm">
                Get Started
              </Button>
            </Link>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 md:hidden rounded-sm neo-border bg-surface"
              aria-label="Toggle mobile menu"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden border-t-2 border-border bg-bg p-4 flex flex-col gap-4 animate-fade-in">
            <a
              href="#problem"
              onClick={() => setIsMenuOpen(false)}
              className="text-sm font-semibold text-text-secondary hover:text-text-primary py-1"
            >
              Struggles
            </a>
            <a
              href="#how-it-works"
              onClick={() => setIsMenuOpen(false)}
              className="text-sm font-semibold text-text-secondary hover:text-text-primary py-1"
            >
              Paradigm
            </a>
            <a
              href="#simulator"
              onClick={() => setIsMenuOpen(false)}
              className="text-sm font-semibold text-text-secondary hover:text-text-primary py-1"
            >
              Simulator
            </a>
            <a
              href="#daily-planning"
              onClick={() => setIsMenuOpen(false)}
              className="text-sm font-semibold text-text-secondary hover:text-text-primary py-1"
            >
              Daily Plan
            </a>
            <a
              href="#faq"
              onClick={() => setIsMenuOpen(false)}
              className="text-sm font-semibold text-text-secondary hover:text-text-primary py-1"
            >
              FAQ
            </a>
            <div className="flex flex-col gap-2 pt-2 border-t border-border">
              <Link href="/login" onClick={() => setIsMenuOpen(false)} className="w-full">
                <Button variant="outline" className="w-full">Sign In</Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-12 pb-20 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Background Grid Accent */}
        <div className="absolute inset-0 bg-[radial-gradient(var(--color-bg-secondary)_1.5px,transparent_1.5px)] [background-size:24px_24px] pointer-events-none opacity-60" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            <Badge variant="default" className="mb-4 bg-accent-light text-ai-accent neo-border font-mono px-3 py-1 font-bold text-xs uppercase tracking-wider">
              ✨ Introducing the AI Life Operating System
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-heading leading-[1.05] text-text-primary mb-6">
              Stop Planning <br />
              <span className="bg-accent text-accent-text px-2 py-0.5 rounded-sm neo-border inline-block rotate-[-1deg] my-1 sm:my-0">Your Life.</span> <br className="hidden sm:inline" />
              Start Living It.
            </h1>

            <p className="text-lg md:text-xl text-text-secondary max-w-2xl font-medium leading-relaxed mb-8">
              LifeOS translates your outcomes into dynamic roadmaps and designs your perfect daily schedule, automatically. Focus on execution, we&apos;ll handle the strategy.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" className="w-full sm:w-auto bg-accent text-accent-text font-bold text-lg px-8 py-6 h-auto flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]">
                  Get Started <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>

              <a href="#simulator" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto font-bold text-lg px-8 py-6 h-auto flex items-center justify-center gap-2 hover:bg-bg-secondary">
                  <Play className="h-4 w-4 fill-current" /> Watch Demo
                </Button>
              </a>
            </div>

            <div className="mt-8 flex items-center gap-6 text-sm text-text-secondary font-semibold font-mono">
              <span className="flex items-center gap-1.5 text-emerald-500">
                <Check className="h-4 w-4 stroke-[3]" /> Get started in 2 minutes
              </span>
              <span className="flex items-center gap-1.5 text-indigo-500">
                <Shield className="h-4 w-4" /> GDPR Compliant & Private
              </span>
            </div>
          </div>

          {/* Hero Right: Interactive Dashboard Preview */}
          <div className="lg:col-span-5 relative w-full flex justify-center">
            {/* Neo Brutalist Frame */}
            <div className="w-full max-w-md bg-surface p-6 neo-border neo-shadow-lg rounded-lg relative overflow-hidden group">
              {/* Top Banner */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b-2 border-border">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400 border border-border" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400 border border-border" />
                  <div className="w-3 h-3 rounded-full bg-green-400 border border-border" />
                </div>
                <div className="font-mono text-xs font-bold text-text-secondary uppercase flex items-center gap-1 bg-accent-light px-2 py-0.5 rounded-sm border border-border">
                  <Bot className="h-3.5 w-3.5 text-ai-accent" /> chief of staff ACTIVE
                </div>
              </div>

              {/* Status Header */}
              <div className="space-y-2 mb-5">
                <div className="text-xs font-bold font-mono text-text-tertiary uppercase">Today&apos;s Focus Meter</div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-5 bg-bg-secondary rounded-sm border-2 border-border overflow-hidden p-[2px]">
                    <div className="h-full bg-accent rounded-sm border-r border-border animate-pulse w-[78%]" />
                  </div>
                  <span className="font-mono text-sm font-bold">78% Depth</span>
                </div>
              </div>

              {/* Focus Activity Block */}
              <div className="bg-bg p-4 neo-border rounded-sm mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold uppercase text-ai-accent flex items-center gap-1">
                    <Zap className="h-3 w-3 fill-current" /> current focus block
                  </span>
                  <Badge variant="default" className="bg-violet-500/10 text-violet-600 dark:text-violet-400 font-mono text-[10px] font-bold">
                    Quant Prep
                  </Badge>
                </div>
                <div className="font-heading text-lg font-bold">CAT Prep: Quantitative Section Mocks</div>
                <div className="text-xs text-text-secondary font-medium mt-1 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> 9:00 AM - 11:30 AM (2.5h) • Focus block mapped to morning energy peak
                </div>
              </div>

              {/* Active Roadmap Progress */}
              <div className="space-y-3 mb-4">
                <div className="text-xs font-bold font-mono text-text-tertiary uppercase">Strategic Roadmaps</div>

                <div className="flex items-center justify-between text-sm font-bold bg-bg-secondary p-2.5 rounded-sm border border-border">
                  <span className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-emerald-500" /> Crack CAT Exams
                  </span>
                  <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-sm">
                    Phase 2: Prep (82%)
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm font-bold bg-bg-secondary p-2.5 rounded-sm border border-border">
                  <span className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500" /> Stay Fit & Run Half-Marathon
                  </span>
                  <span className="font-mono text-xs text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-sm">
                    Phase 1: Mileage (45%)
                  </span>
                </div>
              </div>

              {/* AI Memory Widget */}
              <div className="bg-purple-500/5 border border-purple-500/20 p-3.5 rounded-sm flex items-start gap-3">
                <Brain className="h-5 w-5 text-ai-accent shrink-0 mt-0.5" />
                <div className="text-xs text-text-secondary font-medium leading-normal">
                  <span className="font-bold text-ai-accent">Cognitive Memory logged:</span> Focus levels drop by 15% after 2 consecutive hours of coding. Mapped 15-minute hydration breaks between study blocks.
                </div>
              </div>
            </div>

            {/* Offset Shadow Graphic Decorator */}
            <div className="absolute -bottom-4 -right-4 w-full max-w-md h-[420px] bg-bg-tertiary neo-border -z-10 rounded-lg hidden sm:block" />
          </div>
        </div>
      </section>

      {/* 3. Social Proof Section */}
      <section className="border-y-2 border-border bg-bg-secondary py-12 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="font-mono text-xs font-bold text-text-tertiary uppercase tracking-widest mb-6">
            TRUSTED BY PRODUCTIVE MINDS FROM WORLD-CLASS INSTITUTIONS & TEAMS
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-60 dark:opacity-80">
            <span className="font-heading text-lg font-bold text-text-primary tracking-tight">STANFORD UNIV.</span>
            <span className="font-heading text-lg font-bold text-text-primary tracking-tight">MIT</span>
            <span className="font-heading text-lg font-bold text-text-primary tracking-tight">STRIPE</span>
            <span className="font-heading text-lg font-bold text-text-primary tracking-tight">Y COMBINATOR</span>
            <span className="font-heading text-lg font-bold text-text-primary tracking-tight">GOOGLE</span>
            <span className="font-heading text-lg font-bold text-text-primary tracking-tight">PRODUCT HUNT #1</span>
          </div>

          <div className="mt-8 flex justify-center gap-6 text-xs font-mono font-bold text-text-secondary">
            <span>🚀 10,000+ early users</span>
            <span>⚡ 5,000,000+ planning decisions run</span>
          </div>
        </div>
      </section>

      {/* 4. The Problem Section */}
      <section id="problem" className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center border-b-2 border-border border-dashed">
        <Badge variant="default" className="mb-4 bg-red-500/10 text-error neo-border font-mono px-3 py-1 font-bold text-xs uppercase tracking-wider">
          ⚠️ The Productivity Trap
        </Badge>

        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading leading-tight mb-4 text-text-primary">
          Traditional Apps Make You Work For Them
        </h2>
        <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-16">
          Task managers, habit trackers, and calendars operate in silos. They force you to spend your precious mental energy scheduling instead of executing.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card variant="default" className="bg-surface text-left neo-border p-6 neo-shadow-sm hover:neo-shadow transition-all group">
            <div className="w-10 h-10 flex items-center justify-center rounded-sm bg-red-500/10 text-error border-2 border-border font-mono font-bold text-lg mb-6 group-hover:rotate-6 transition-transform">
              ❌
            </div>
            <h3 className="font-heading text-xl font-bold mb-3 text-text-primary">Goal Fragmentation</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              You want to crack placement exams, build a startup, and run. But without structure, you jump erratically from task to task, making zero headway.
            </p>
          </Card>

          <Card variant="default" className="bg-surface text-left neo-border p-6 neo-shadow-sm hover:neo-shadow transition-all group">
            <div className="w-10 h-10 flex items-center justify-center rounded-sm bg-red-500/10 text-error border-2 border-border font-mono font-bold text-lg mb-6 group-hover:rotate-[-6deg] transition-transform">
              ❌
            </div>
            <h3 className="font-heading text-xl font-bold mb-3 text-text-primary">App Fatigue</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Switching constantly between Notion, Todoist, Google Calendar, and sheets. You spend more time organizing, sorting, and tagging tasks than completing them.
            </p>
          </Card>

          <Card variant="default" className="bg-surface text-left neo-border p-6 neo-shadow-sm hover:neo-shadow transition-all group">
            <div className="w-10 h-10 flex items-center justify-center rounded-sm bg-red-500/10 text-error border-2 border-border font-mono font-bold text-lg mb-6 group-hover:rotate-6 transition-transform">
              ❌
            </div>
            <h3 className="font-heading text-xl font-bold mb-3 text-text-primary">Planning Fatigue</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Staring at a 100-item to-do list with zero direction. You spend 2 hours designing a weekly layout, only to abandon it by Tuesday due to burnout.
            </p>
          </Card>
        </div>
      </section>

      {/* 5. The Solution Section (Flow Paradigm) */}
      <section id="how-it-works" className="py-20 md:py-28 bg-bg-secondary border-b-2 border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="default" className="mb-4 bg-accent-light text-ai-accent neo-border font-mono px-3 py-1 font-bold text-xs uppercase tracking-wider">
            ✨ The paradigm shift
          </Badge>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading leading-tight mb-4 text-text-primary">
            One Single Flow. Zero Overhead.
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-16">
            LifeOS is built on a single, continuous loop that takes the stress out of daily planning. Define outcomes. Let the AI manage the rest.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 relative items-start">
            {/* Flow Card 1: Goals */}
            <div className="flex flex-col items-center">
              <div className="w-full bg-surface p-6 rounded-lg neo-border neo-shadow-sm text-center relative group">
                <div className="w-12 h-12 bg-accent text-accent-text rounded-sm border-2 border-border flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                  1
                </div>
                <h3 className="font-heading text-lg font-bold mb-2">1. Define Outcomes</h3>
                <p className="text-xs text-text-secondary">
                  Specify high-level goals with deadlines and motivations (e.g. Crack UPSC, stay fit, build app).
                </p>
              </div>
            </div>

            {/* Flow Card 2: Roadmap */}
            <div className="flex flex-col items-center">
              <div className="w-full bg-surface p-6 rounded-lg neo-border neo-shadow-sm text-center relative group font-bold">
                <div className="w-12 h-12 bg-indigo-400 text-white rounded-sm border-2 border-border flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                  2
                </div>
                <h3 className="font-heading text-lg font-bold mb-2">2. AI Roadmap</h3>
                <p className="text-xs text-text-secondary">
                  The AI architecture generates a phased breakdown, milestones, and daily task dependencies.
                </p>
              </div>
            </div>

            {/* Flow Card 3: Daily Plan */}
            <div className="flex flex-col items-center">
              <div className="w-full bg-surface p-6 rounded-lg neo-border neo-shadow-sm text-center relative group font-bold">
                <div className="w-12 h-12 bg-violet-400 text-white rounded-sm border-2 border-border flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                  3
                </div>
                <h3 className="font-heading text-lg font-bold mb-2">3. Daily Schedule</h3>
                <p className="text-xs text-text-secondary">
                  Every morning, the AI builds today&apos;s schedule based on calendars, routines, and energy.
                </p>
              </div>
            </div>

            {/* Flow Card 4: Progress */}
            <div className="flex flex-col items-center">
              <div className="w-full bg-surface p-6 rounded-lg neo-border neo-shadow-sm text-center relative group font-bold">
                <div className="w-12 h-12 bg-emerald-400 text-white rounded-sm border-2 border-border flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                  4
                </div>
                <h3 className="font-heading text-lg font-bold mb-2">4. Life Progress</h3>
                <p className="text-xs text-text-secondary">
                  Execution metrics, habit analysis, and long-term memory updates feed directly back to adjust roadmaps.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Interactive Demo Section */}
      <section id="simulator" className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b-2 border-border border-dashed">
        <div className="text-center mb-12">
          <Badge variant="default" className="mb-4 bg-purple-500/10 text-ai-accent neo-border font-mono px-3 py-1 font-bold text-xs uppercase tracking-wider">
            🔮 Live Interactive Simulator
          </Badge>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading leading-tight mb-4 text-text-primary">
            See the AI Engine in Action
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Choose one of the life scenarios below to watch how the AI automatically translates broad outcomes into action.
          </p>
        </div>

        {/* Preset Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {SIMULATOR_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handlePresetSelect(idx)}
              className={`p-4 rounded-sm neo-border text-left font-semibold text-sm neo-transition cursor-pointer ${activePreset === idx
                ? 'bg-accent text-accent-text neo-shadow-sm'
                : 'bg-surface text-text-primary hover:bg-bg-secondary'
                }`}
            >
              <div className="font-mono text-xs text-text-secondary dark:text-text-primary uppercase mb-1">Preset {idx + 1}</div>
              <div className="font-heading text-md">{preset.title}</div>
            </button>
          ))}
        </div>

        {/* Simulator Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Simulator Left Pane: Input and Roadmap Progress */}
          <div className="lg:col-span-6 flex flex-col justify-between bg-surface neo-border p-6 rounded-lg neo-shadow-sm min-h-[380px]">
            <div className="space-y-6">
              {/* Input Area */}
              <div>
                <label className="neo-label mb-2 block">User Intent</label>
                <div className="w-full p-3 bg-bg border-2 border-border rounded-sm font-mono text-sm font-semibold flex items-center justify-between">
                  <span className="truncate">{SIMULATOR_PRESETS[activePreset].title}</span>
                  {animating ? (
                    <span className="flex h-2 w-2 relative shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ai-accent opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-ai-accent"></span>
                    </span>
                  ) : (
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  )}
                </div>
              </div>

              {/* Progress Steps */}
              <div className="space-y-4 font-mono text-xs">
                {/* Step 1: Extract Goals */}
                <div className={`flex items-start gap-3 transition-opacity ${simulatorStep >= 1 ? 'opacity-100' : 'opacity-30'}`}>
                  <div className={`w-5 h-5 rounded-full border border-border flex items-center justify-center shrink-0 ${simulatorStep >= 1 ? 'bg-accent text-accent-text font-bold' : ''
                    }`}>
                    {simulatorStep > 1 ? '✓' : '1'}
                  </div>
                  <div>
                    <div className="font-bold uppercase text-text-primary">1. Extracting Intent & Building Goals</div>
                    {simulatorStep >= 1 && (
                      <div className="mt-2 space-y-1.5 pl-2 border-l border-border animate-fade-in">
                        {SIMULATOR_PRESETS[activePreset].goals.map((g, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-text-secondary text-[11px]">
                            <g.icon className="h-3 w-3 text-ai-accent" />
                            <span>[{g.category}] {g.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 2: Roadmaps */}
                <div className={`flex items-start gap-3 transition-opacity ${simulatorStep >= 2 ? 'opacity-100' : 'opacity-30'}`}>
                  <div className={`w-5 h-5 rounded-full border border-border flex items-center justify-center shrink-0 ${simulatorStep >= 2 ? 'bg-indigo-400 text-white font-bold' : ''
                    }`}>
                    {simulatorStep > 2 ? '✓' : '2'}
                  </div>
                  <div>
                    <div className="font-bold uppercase text-text-primary">2. Designing Milestone Roadmaps</div>
                    {simulatorStep >= 2 && (
                      <div className="mt-2 space-y-1.5 pl-2 border-l border-border animate-fade-in">
                        {SIMULATOR_PRESETS[activePreset].roadmap.map((r, i) => (
                          <div key={i} className="text-[11px] text-text-secondary leading-normal">
                            <span className="font-bold text-indigo-500">{r.phase}:</span> {r.details}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs font-mono font-bold text-text-tertiary">
              <span>Model Routing: Medium Planner</span>
              <span>Centralized AI Gateway</span>
            </div>
          </div>

          {/* Simulator Right Pane: Schedule Output */}
          <div className="lg:col-span-6 bg-surface neo-border p-6 rounded-lg neo-shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                <span className="neo-label">Today&apos;s AI Schedule Output</span>
                {simulatorStep >= 3 ? (
                  <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 font-mono text-[10px] font-bold">
                    READY FOR TODAY
                  </Badge>
                ) : (
                  <Badge variant="default" className="bg-bg-secondary text-text-tertiary font-mono text-[10px]">
                    GENERATING Plan...
                  </Badge>
                )}
              </div>

              {simulatorStep >= 3 ? (
                <div className="space-y-3">
                  {SIMULATOR_PRESETS[activePreset].schedule.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-bg hover:bg-bg-secondary rounded-sm border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 group transition-all"
                      style={{ animation: `fade-in 0.3s ease-out forwards ${idx * 0.1}s` }}
                    >
                      <div>
                        <div className="text-xs font-bold font-mono text-text-secondary">{item.time}</div>
                        <div className="text-sm font-bold text-text-primary mt-0.5">{item.label}</div>
                      </div>
                      <Badge variant="default" className={`self-start sm:self-center font-mono text-[9px] uppercase px-1.5 py-0.5 ${item.color}`}>
                        {item.tag}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
                  <span className="font-mono text-xs text-text-secondary">Synthesizing roadmap & focus parameters...</span>
                </div>
              )}
            </div>

            {simulatorStep === 4 && (
              <div className="mt-6 bg-accent-light border border-accent/30 p-3 rounded-sm text-xs font-medium text-text-primary animate-fade-in flex items-center justify-between">
                <span>✨ This schedule is fully synced with your Google Calendar!</span>
                <button
                  onClick={() => handlePresetSelect(activePreset)}
                  className="font-bold underline text-ai-accent flex items-center gap-0.5 hover:text-indigo-600 font-mono text-[11px]"
                >
                  <RotateCcw className="h-3 w-3" /> Re-Run
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 7. Why It Feels Different (Comparison) */}
      <section className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b-2 border-border border-dashed">
        <div className="text-center mb-16">
          <Badge variant="default" className="mb-4 bg-blue-500/10 text-secondary neo-border font-mono px-3 py-1 font-bold text-xs uppercase tracking-wider">
            ⚖️ Side-by-Side Comparison
          </Badge>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading leading-tight mb-4 text-text-primary">
            Why It Feels Completely Different
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Traditional tools force you to be the planner, manager, and reviewer. LifeOS offloads the system management so you can concentrate purely on execution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Traditional Apps Card */}
          <div className="bg-surface p-6 rounded-lg border-2 border-border neo-shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border">
                <div className="w-8 h-8 rounded-sm bg-red-500/10 border-2 border-border flex items-center justify-center font-bold text-sm">
                  ❌
                </div>
                <h3 className="font-heading text-lg font-bold">Traditional To-Do & Calendar Apps</h3>
              </div>

              <ul className="space-y-4 text-sm text-text-secondary font-medium">
                <li className="flex items-start gap-2.5">
                  <X className="h-4 w-4 text-error shrink-0 mt-0.5" />
                  <span><strong>Manual overhead:</strong> You must organize, drag, tag, and schedule tasks yourself.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X className="h-4 w-4 text-error shrink-0 mt-0.5" />
                  <span><strong>Rigid blocking:</strong> If a meeting runs over, your entire schedule is ruined and requires manual replanning.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X className="h-4 w-4 text-error shrink-0 mt-0.5" />
                  <span><strong>Stressful backlogs:</strong> Unfinished tasks pile up into a massive list that makes you feel guilty.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X className="h-4 w-4 text-error shrink-0 mt-0.5" />
                  <span><strong>No energy context:</strong> Pushes high-focus work into time slots where you are completely exhausted.</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-border font-mono text-xs text-text-tertiary">
              Outcome: Overthinking, task fatigue, and burnout.
            </div>
          </div>

          {/* LifeOS Card */}
          <div className="bg-accent-light/35 p-6 rounded-lg border-2 border-border neo-shadow-sm flex flex-col justify-between relative overflow-hidden">
            {/* Top Right Corner Highlight */}
            <div className="absolute top-0 right-0 bg-accent text-accent-text font-mono text-[9px] font-bold uppercase tracking-wider px-3 py-1 border-b-2 border-l-2 border-border">
              RECOMMENDED
            </div>

            <div>
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border">
                <div className="w-8 h-8 rounded-sm bg-emerald-500/10 border-2 border-border flex items-center justify-center font-bold text-sm text-emerald-500">
                  ✓
                </div>
                <h3 className="font-heading text-lg font-bold">LifeOS AI Life Operating System</h3>
              </div>

              <ul className="space-y-4 text-sm text-text-primary font-medium">
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5 stroke-[3]" />
                  <span><strong>AI-designed plan:</strong> You manage outcomes; the AI builds, schedules, and estimates time for tasks.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5 stroke-[3]" />
                  <span><strong>Adaptive rescheduling:</strong> When life gets disrupted, the AI shifts priorities instantly without user friction.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5 stroke-[3]" />
                  <span><strong>Zero-backlog philosophy:</strong> Pending tasks go back to the roadmap pool to be rescheduled when optimal.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5 stroke-[3]" />
                  <span><strong>Energy-mapping:</strong> Schedules heavy cognitive deep-work blocks during your recorded high-focus hours.</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-border font-mono text-xs text-text-tertiary">
              Outcome: True mental clarity, consistent velocity, and life balance.
            </div>
          </div>
        </div>
      </section>

      {/* 8. Core Outcomes Grid */}
      <section className="py-20 md:py-28 bg-bg-secondary border-b-2 border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="default" className="mb-4 bg-emerald-500/10 text-emerald-600 neo-border font-mono px-3 py-1 font-bold text-xs uppercase tracking-wider">
              🎯 Designed for outcomes
            </Badge>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading leading-tight mb-4 text-text-primary">
              Not Features. Actual Transformations.
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              We don&apos;t give you buttons and checklists. We give you a system that helps you become the person you want to be.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Outcome 1 */}
            <Card variant="raised" className="bg-surface p-6 flex flex-col justify-between h-full hover:scale-[1.01] transition-transform">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-sm bg-accent text-accent-text flex items-center justify-center border-2 border-border">
                  <Target className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-lg font-bold text-text-primary">Intelligent Goal Planning</h3>
                <p className="text-sm text-text-secondary leading-normal">
                  Outcomes contain deadlines, constraints, and dependencies. AI handles breakdown so you never have to wonder where to start.
                </p>
              </div>
            </Card>

            {/* Outcome 2 */}
            <Card variant="raised" className="bg-surface p-6 flex flex-col justify-between h-full hover:scale-[1.01] transition-transform">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-sm bg-blue-400 text-white flex items-center justify-center border-2 border-border">
                  <Calendar className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-lg font-bold text-text-primary">Dynamic Daily Scheduling</h3>
                <p className="text-sm text-text-secondary leading-normal">
                  Your plan is generated daily based on energy patterns, routines, and Google/Outlook calendar events.
                </p>
              </div>
            </Card>

            {/* Outcome 3 */}
            <Card variant="raised" className="bg-surface p-6 flex flex-col justify-between h-full hover:scale-[1.01] transition-transform">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-sm bg-purple-400 text-white flex items-center justify-center border-2 border-border">
                  <Brain className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-lg font-bold text-text-primary">Long-Term AI Memory</h3>
                <p className="text-sm text-text-secondary leading-normal">
                  Recalls your historical task completion speeds, focus blockers, and feedback, creating a personalized baseline.
                </p>
              </div>
            </Card>

            {/* Outcome 4 */}
            <Card variant="raised" className="bg-surface p-6 flex flex-col justify-between h-full hover:scale-[1.01] transition-transform">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-sm bg-red-400 text-white flex items-center justify-center border-2 border-border">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-lg font-bold text-text-primary">Adaptive Scheduling</h3>
                <p className="text-sm text-text-secondary leading-normal">
                  Got sick or held up in a traffic jam? One click updates the system, shifting focus tasks to later buffers seamlessly.
                </p>
              </div>
            </Card>

            {/* Outcome 5 */}
            <Card variant="raised" className="bg-surface p-6 flex flex-col justify-between h-full hover:scale-[1.01] transition-transform">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-sm bg-orange-400 text-white flex items-center justify-center border-2 border-border">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-lg font-bold text-text-primary">Personal AI Coaching</h3>
                <p className="text-sm text-text-secondary leading-normal">
                  Proactive chats assist you in reflecting, diagnosing friction points, and helping you build lasting, positive life habits.
                </p>
              </div>
            </Card>

            {/* Outcome 6 */}
            <Card variant="raised" className="bg-surface p-6 flex flex-col justify-between h-full hover:scale-[1.01] transition-transform">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-sm bg-emerald-400 text-white flex items-center justify-center border-2 border-border">
                  <Heart className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-lg font-bold text-text-primary">True Balanced Living</h3>
                <p className="text-sm text-text-secondary leading-normal">
                  Automatically budgets time for workouts, rest blocks, meals, and family. We actively prevent toxic hustle culture.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 9. Daily Planning Hero Feature Section */}
      <section id="daily-planning" className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b-2 border-border border-dashed">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* Left Text */}
          <div className="lg:col-span-5 text-left">
            <Badge variant="default" className="mb-4 bg-accent-light text-ai-accent neo-border font-mono px-3 py-1 font-bold text-xs uppercase tracking-wider">
              ⚡ HERO FEATURE: THE ADAPTIVE SCHEDULE
            </Badge>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading leading-tight mb-4 text-text-primary">
              A Schedule That Adapts When Life Happens
            </h2>

            <p className="text-lg text-text-secondary font-medium leading-relaxed mb-6">
              Rigid calendars fail because life is unpredictable. LifeOS uses dynamic optimization algorithms to shift, resize, and reallocate tasks when calendar conflicts or energy dips occur.
            </p>

            <div className="space-y-4 mb-8">
              <div className="font-mono text-xs font-bold text-text-secondary uppercase">SIMULATE REAL LIFE DISRUPTIONS:</div>
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() => setScheduleState('normal')}
                  className={`px-3 py-2 rounded-sm text-xs font-bold border-2 border-border neo-transition cursor-pointer ${scheduleState === 'normal' ? 'bg-accent text-accent-text' : 'bg-surface hover:bg-bg-secondary'
                    }`}
                >
                  🟢 Normal day (Optimized)
                </button>
                <button
                  onClick={() => setScheduleState('sick')}
                  className={`px-3 py-2 rounded-sm text-xs font-bold border-2 border-border neo-transition cursor-pointer ${scheduleState === 'sick' ? 'bg-accent text-accent-text' : 'bg-surface hover:bg-bg-secondary'
                    }`}
                >
                  🤒 Got Sick / Low Energy
                </button>
                <button
                  onClick={() => setScheduleState('meeting')}
                  className={`px-3 py-2 rounded-sm text-xs font-bold border-2 border-border neo-transition cursor-pointer ${scheduleState === 'meeting' ? 'bg-accent text-accent-text' : 'bg-surface hover:bg-bg-secondary'
                    }`}
                >
                  🤝 Unexpected Meeting added
                </button>
                <button
                  onClick={() => setScheduleState('sleep')}
                  className={`px-3 py-2 rounded-sm text-xs font-bold border-2 border-border neo-transition cursor-pointer ${scheduleState === 'sleep' ? 'bg-accent text-accent-text' : 'bg-surface hover:bg-bg-secondary'
                    }`}
                >
                  🥱 Slept 4 hours last night
                </button>
              </div>
            </div>

            <div className="text-sm font-semibold text-text-secondary border-l-2 border-border pl-4">
              {scheduleState === 'normal' && "💡 Showing optimal daily plan designed for standard morning focus peaks and Google Calendar events."}
              {scheduleState === 'sick' && "💡 The AI immediately enters sick mode: removes the Quant focus block, reserves recovery slots, and alerts you to rest."}
              {scheduleState === 'meeting' && "💡 An unexpected meeting is detected at 2:00 PM. The AI slides placement prep coding around it, preserving focus blocks."}
              {scheduleState === 'sleep' && "💡 Sleep tracker log notifies AI of high fatigue. To prevent burnout, focus blocks are shortened by 30% and regular stretching blocks are scheduled."}
            </div>
          </div>

          {/* Right Schedule Output (Dynamic animations) */}
          <div className="lg:col-span-7 bg-surface p-6 rounded-lg neo-border neo-shadow-md relative">
            <div className="flex items-center justify-between pb-3 border-b-2 border-border mb-4 font-mono text-xs font-bold text-text-secondary uppercase">
              <span>Today&apos;s AI Generated Schedule</span>
              <span>Saturday, July 4</span>
            </div>

            <div className="space-y-3 min-h-[290px] transition-all duration-300">
              {getOptimizerSchedule().map((item, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-sm border border-border flex items-center justify-between gap-3 transition-all duration-300 ${item.important ? 'ring-2 ring-accent bg-accent/5' : 'bg-bg hover:bg-bg-secondary'
                    }`}
                >
                  <div className="text-left">
                    <span className="font-mono text-xs text-text-secondary font-bold block">{item.time}</span>
                    <span className="text-sm font-bold text-text-primary mt-0.5">{item.label}</span>
                  </div>
                  <Badge variant="default" className={`font-mono text-[9px] uppercase px-1.5 py-0.5 shrink-0 ${item.color}`}>
                    {item.tag}
                  </Badge>
                </div>
              ))}
            </div>

            {/* AI Reasoning indicator */}
            <div className="mt-4 pt-3 border-t border-border flex items-center gap-2.5 text-xs text-text-secondary font-medium">
              <Bot className="h-4 w-4 text-ai-accent shrink-0" />
              <span>
                {scheduleState === 'normal' && "AI Reasoned: Quantitative math scheduled for 9:00 AM because focus metrics are highest in the morning."}
                {scheduleState === 'sick' && "AI Reasoned: Focus tasks cleared. Sleep/rest intervals scheduled to prioritize recovery and reduce stress."}
                {scheduleState === 'meeting' && "AI Reasoned: Preserved Quantitative prep in the morning. Shifted DSA prep to adjust for client meeting."}
                {scheduleState === 'sleep' && "AI Reasoned: High Fatigue. Substituted running with low-intensity stretch. Shortened deep work sessions."}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Interactive UI Screen Previews */}
      <section className="py-20 md:py-28 bg-bg-secondary border-b-2 border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="default" className="mb-4 bg-purple-500/10 text-ai-accent neo-border font-mono px-3 py-1 font-bold text-xs uppercase tracking-wider">
            💻 Premium UI Screenshots (Live Interactive Mockup)
          </Badge>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading leading-tight mb-4 text-text-primary">
            A Clean, High-Fidelity Interface
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-12">
            Explore the different modules of the LifeOS client interface. No placeholders. Drag, drop, check and chat.
          </p>

          {/* Screen Tabs Selector */}
          <div className="flex flex-wrap justify-center gap-2.5 mb-8">
            {(['dashboard', 'coach', 'roadmaps', 'analytics'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 rounded-sm text-sm font-bold border-2 border-border neo-transition cursor-pointer uppercase font-mono ${activeTab === tab ? 'bg-accent text-accent-text neo-shadow-sm' : 'bg-surface text-text-primary hover:bg-bg-tertiary'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Screenshot Render Box */}
          <div className="mx-auto max-w-4xl bg-surface neo-border rounded-lg neo-shadow-lg overflow-hidden text-left">
            {/* Window Bar */}
            <div className="bg-bg border-b-2 border-border px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-400 border border-border" />
                <span className="w-3 h-3 rounded-full bg-yellow-400 border border-border" />
                <span className="w-3 h-3 rounded-full bg-green-400 border border-border" />
              </div>
              <span className="font-mono text-xs text-text-secondary uppercase font-bold">lifeos - client - {activeTab}.exe</span>
              <div className="w-12" />
            </div>

            <div className="p-6 min-h-[380px] bg-bg">
              {/* Tab Content: Dashboard */}
              {activeTab === 'dashboard' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                  <div className="md:col-span-2 space-y-4">
                    <Card variant="default" className="bg-surface border-2 border-border">
                      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-border">
                        <span className="font-heading text-md font-bold flex items-center gap-2">
                          <ListTodo className="h-4 w-4 text-accent" /> Active Daily Checklist
                        </span>
                        <Badge variant="default" className="font-mono text-[9px] bg-emerald-500/10 text-emerald-600 font-bold">3 of 5 Done</Badge>
                      </div>
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2 text-sm text-text-secondary line-through">
                          <div className="w-4.5 h-4.5 rounded-sm border-2 border-border bg-accent text-accent-text flex items-center justify-center text-xs">✓</div>
                          <span>Morning Cardio run (Completed at 7:45 AM)</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-text-primary font-semibold">
                          <div className="w-4.5 h-4.5 rounded-sm border-2 border-border flex items-center justify-center shrink-0"></div>
                          <span>CAT Quantitative Mock Exam (Target: 2.5h)</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-text-primary font-semibold">
                          <div className="w-4.5 h-4.5 rounded-sm border-2 border-border flex items-center justify-center shrink-0"></div>
                          <span>Build Portfolio projects showcase section</span>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Energy Meter */}
                  <div className="space-y-4">
                    <Card variant="raised" className="bg-surface border-2 border-border flex flex-col justify-between h-full">
                      <div className="space-y-2">
                        <div className="font-mono text-xs font-bold text-text-tertiary uppercase">BIORHYTHM SYNC</div>
                        <h4 className="font-heading text-lg font-bold">Midday Energy Peak</h4>
                        <p className="text-xs text-text-secondary leading-relaxed">
                          Your physical focus peaks at 11:30 AM. AI has locked down notifications to maximize cognitive depth.
                        </p>
                      </div>
                      <div className="mt-4 flex items-center gap-2 border-2 border-border bg-emerald-500/5 p-2 rounded-sm">
                        <Activity className="h-4 w-4 text-emerald-500" />
                        <span className="font-mono text-xs font-bold text-emerald-600">Peak State Active</span>
                      </div>
                    </Card>
                  </div>
                </div>
              )}

              {/* Tab Content: Coach */}
              {activeTab === 'coach' && (
                <div className="flex flex-col h-[320px] bg-surface rounded-md border-2 border-border p-4 animate-fade-in justify-between">
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4">
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                        {msg.sender === 'coach' && (
                          <div className="w-7 h-7 rounded-sm bg-accent text-accent-text flex items-center justify-center border border-border text-xs shrink-0 font-bold">
                            🤖
                          </div>
                        )}
                        <div className={`p-3 rounded-md text-xs max-w-[80%] leading-relaxed ${msg.sender === 'user'
                          ? 'bg-accent text-accent-text border border-border font-bold'
                          : 'bg-bg-secondary text-text-primary border border-border'
                          }`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}

                    {coachTyping && (
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-sm bg-accent text-accent-text flex items-center justify-center border border-border text-xs shrink-0 font-bold">
                          🤖
                        </div>
                        <div className="p-2.5 rounded-md text-xs bg-bg-secondary text-text-secondary border border-border animate-pulse">
                          LifeOS Coach is reflecting...
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input suggestion tags */}
                  <div className="flex gap-2 mb-2 flex-wrap">
                    <button
                      onClick={() => sendCoachMessage("I'm feeling stressed and overwhelmed today.")}
                      className="text-[10px] font-bold border border-border bg-bg hover:bg-bg-secondary px-2 py-1 rounded-sm neo-transition cursor-pointer text-text-primary"
                    >
                      💡 I&apos;m overwhelmed
                    </button>
                    <button
                      onClick={() => sendCoachMessage("Can you lock my focus block now?")}
                      className="text-[10px] font-bold border border-border bg-bg hover:bg-bg-secondary px-2 py-1 rounded-sm neo-transition cursor-pointer text-text-primary"
                    >
                      ⚡ Lock focus block
                    </button>
                  </div>

                  {/* Message Input Box */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={coachInput}
                      onChange={(e) => setCoachInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendCoachMessage(coachInput)}
                      className="flex-1 px-3 py-2 text-xs neo-border rounded-sm bg-bg text-text-primary"
                      placeholder="Type a message to your Chief of Staff..."
                    />
                    <Button
                      variant="primary"
                      onClick={() => sendCoachMessage(coachInput)}
                      className="px-4 text-xs h-auto"
                    >
                      Send
                    </Button>
                  </div>
                </div>
              )}

              {/* Tab Content: Roadmaps */}
              {activeTab === 'roadmaps' && (
                <div className="bg-surface rounded-md border-2 border-border p-4 animate-fade-in h-[320px] overflow-y-auto">
                  <div className="flex items-center gap-2.5 mb-4 pb-2 border-b border-border">
                    <Target className="h-5 w-5 text-indigo-500" />
                    <div>
                      <h4 className="font-heading text-sm font-bold text-text-primary">Goal Roadmap: Complete CAT Quantitative Preparation</h4>
                      <span className="font-mono text-[10px] text-text-tertiary uppercase">Phase 2 of 3 (Active)</span>
                    </div>
                  </div>

                  {/* Timeline tree */}
                  <div className="relative pl-6 border-l-2 border-dashed border-border space-y-4">
                    {/* Node 1 */}
                    <div className="relative">
                      <div className="absolute -left-[30px] top-0.5 w-4.5 h-4.5 rounded-full bg-emerald-500 border border-border flex items-center justify-center text-[9px] text-white">✓</div>
                      <div>
                        <div className="text-xs font-bold text-text-primary">Phase 1: Arithmetic & Algebra Fundamentals</div>
                        <div className="text-[11px] text-text-secondary mt-0.5">Completed 45 days ago. Average mock speed: 1.2 min/question.</div>
                      </div>
                    </div>

                    {/* Node 2 */}
                    <div className="relative">
                      <div className="absolute -left-[30px] top-0.5 w-4.5 h-4.5 rounded-full bg-accent border border-border flex items-center justify-center text-[9px] text-accent-text font-bold">⚡</div>
                      <div>
                        <div className="text-xs font-bold text-text-primary">Phase 2: Geometry & Number Theory (Active)</div>
                        <div className="text-[11px] text-text-secondary mt-0.5">Focusing on high-weightage geometry. 82% complete. Next milestone: Geometry Mock exam.</div>
                      </div>
                    </div>

                    {/* Node 3 */}
                    <div className="relative">
                      <div className="absolute -left-[30px] top-0.5 w-4.5 h-4.5 rounded-full bg-bg-secondary border border-border flex items-center justify-center text-[9px]"></div>
                      <div>
                        <div className="text-xs font-bold text-text-tertiary">Phase 3: Full Length Mocks & Strategy Optimization</div>
                        <div className="text-[11px] text-text-tertiary mt-0.5">Locks 3 weeks before CAT exam. Focus on testing pacing and error reduction.</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content: Analytics */}
              {activeTab === 'analytics' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">

                  <Card variant="default" className="bg-surface border-2 border-border text-center flex flex-col justify-center items-center py-6">
                    <div className="text-3xl font-extrabold font-heading text-emerald-500">92%</div>
                    <div className="font-mono text-xs font-bold text-text-secondary uppercase mt-2">CONSISTENCY SCORE</div>
                    <p className="text-[11px] text-text-tertiary mt-1 px-3">Top 3% of LifeOS users. Average deviation under 15m.</p>
                  </Card>

                  <Card variant="default" className="bg-surface border-2 border-border text-center flex flex-col justify-center items-center py-6">
                    <div className="text-3xl font-extrabold font-heading text-indigo-500">28.4 hrs</div>
                    <div className="font-mono text-xs font-bold text-text-secondary uppercase mt-2">DEEP WORK TIME</div>
                    <p className="text-[11px] text-text-tertiary mt-1 px-3">This week. Peak focus interval: 9:30 AM - 11:15 AM.</p>
                  </Card>

                  <Card variant="default" className="bg-surface border-2 border-border text-center flex flex-col justify-center items-center py-6">
                    <div className="text-3xl font-extrabold font-heading text-pink-500">8.4 / 10</div>
                    <div className="font-mono text-xs font-bold text-text-secondary uppercase mt-2">LIFE BALANCE INDEX</div>
                    <p className="text-[11px] text-text-tertiary mt-1 px-3">Excellent health & rest allocation this week.</p>
                  </Card>

                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 11. Testimonials Section */}
      <section className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b-2 border-border border-dashed">
        <div className="text-center mb-16">
          <Badge variant="default" className="mb-4 bg-emerald-500/10 text-emerald-600 neo-border font-mono px-3 py-1 font-bold text-xs uppercase tracking-wider">
            ❤️ USER STORIES
          </Badge>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading leading-tight mb-4 text-text-primary">
            Loved by High-Achievers
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            See how early users are regaining control of their focus, reducing anxiety, and building meaningful lives.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card variant="default" className="bg-surface p-6 neo-border neo-shadow-sm flex flex-col justify-between text-left">
            <p className="text-sm text-text-secondary italic leading-relaxed mb-6">
              &quot;I used to spend hours arranging my Notion boards and Google Calendar blocks. With LifeOS, I just enter my high-level goals. The AI schedules my days based on when I focus best. It&apos;s a game-changer.&quot;
            </p>
            <div className="flex items-center gap-3 pt-4 border-t border-border mt-auto">
              <div className="w-10 h-10 rounded-sm bg-accent text-accent-text flex items-center justify-center font-bold border border-border">
                AR
              </div>
              <div>
                <div className="text-sm font-bold text-text-primary">Arjun Rao</div>
                <div className="text-xs text-text-secondary">Software Engineer, YC Startup</div>
              </div>
            </div>
          </Card>

          <Card variant="default" className="bg-surface p-6 neo-border neo-shadow-sm flex flex-col justify-between text-left">
            <p className="text-sm text-text-secondary italic leading-relaxed mb-6">
              &quot;Preparing for CAT and balancing my final placements was incredibly stressful. LifeOS acts as my chief of staff. If I sleep poorly or get an unexpected interview, the AI adjusts my prep time instantly.&quot;
            </p>
            <div className="flex items-center gap-3 pt-4 border-t border-border mt-auto">
              <div className="w-10 h-10 rounded-sm bg-indigo-400 text-white flex items-center justify-center font-bold border border-border">
                SK
              </div>
              <div>
                <div className="text-sm font-bold text-text-primary">Sneha Kapoor</div>
                <div className="text-xs text-text-secondary">MBA Candidate, IIM</div>
              </div>
            </div>
          </Card>

          <Card variant="default" className="bg-surface p-6 neo-border neo-shadow-sm flex flex-col justify-between text-left">
            <p className="text-sm text-text-secondary italic leading-relaxed mb-6">
              &quot;As a solo founder, my to-do list was massive. The LifeOS AI coaching and zero-backlog design completely cured my procrastination. I focus on what actually moves the needle instead of admin work.&quot;
            </p>
            <div className="flex items-center gap-3 pt-4 border-t border-border mt-auto">
              <div className="w-10 h-10 rounded-sm bg-violet-400 text-white flex items-center justify-center font-bold border border-border">
                MD
              </div>
              <div>
                <div className="text-sm font-bold text-text-primary">Marcus Dubois</div>
                <div className="text-xs text-text-secondary">Founder, DevFlow</div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* 12. Pricing Section Removed */}

      {/* 13. FAQ Section */}
      <section id="faq" className="py-20 md:py-28 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 border-b-2 border-border border-dashed text-left">
        <div className="text-center mb-16">
          <Badge variant="default" className="mb-4 bg-purple-500/10 text-ai-accent neo-border font-mono px-3 py-1 font-bold text-xs uppercase tracking-wider">
            💬 HELP & SUPPORT
          </Badge>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading leading-tight mb-4 text-text-primary">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-text-secondary max-w-xl mx-auto text-center">
            Everything you need to know about the AI Life Operating System.
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              q: 'How does LifeOS protect my privacy and data?',
              a: 'Privacy is our highest priority. All goals, schedules, and conversations are fully encrypted. We run on a centralized AI Gateway with strict security parameters, and we never sell your data or use it to train public models.'
            },
            {
              q: 'How does the AI daily planning engine work?',
              a: 'Every morning, the planning engine analyzes your long-term goals, roadmaps, routines, energy history, and connected calendars. It then optimizes your day into logical blocks, ensuring your heavy focus tasks align with your highest energy times.'
            },
            {
              q: 'Can I edit the plans generated by the AI?',
              a: 'Yes, absolutely! The AI is your Chief of Staff, not your boss. You can drag and drop schedule items, mark tasks as complete, edit details, or tell the AI to "postpone this focus block" in the chat, and it will rebuild the schedule around your changes.'
            },
            {
              q: 'Does this replace my existing calendar?',
              a: 'No, it syncs seamlessly with it. LifeOS connects with Google Calendar and Outlook. It reads your meetings, classes, and appointments, scheduling your focus and recovery blocks in the remaining open spaces.'
            },
            {
              q: 'What makes this different from Notion or Todoist?',
              a: 'Notion and Todoist are static containers. They store your tasks, but require you to spend hours organizing and scheduling them. LifeOS is an active system: you define goals once, and the AI actively plans, tracks, structures, and adapts your schedule daily.'
            }
          ].map((item, idx) => (
            <div key={idx} className="bg-surface rounded-sm border-2 border-border neo-shadow-sm overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-5 text-left font-bold font-heading flex items-center justify-between gap-4 cursor-pointer text-sm sm:text-base text-text-primary hover:bg-bg-secondary"
              >
                <span>{item.q}</span>
                <ChevronDown className={`h-4.5 w-4.5 shrink-0 transition-transform duration-normal ${openFaq === idx ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-text-secondary leading-relaxed border-t border-border/10 bg-bg-secondary/20 animate-fade-in">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 14. Final CTA Section */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
        <div className="bg-accent rounded-lg border-4 border-border p-12 neo-shadow-lg relative overflow-hidden text-accent-text">
          <div className="absolute inset-0 bg-[radial-gradient(#111111_1.5px,transparent_1.5px)] [background-size:20px_20px] pointer-events-none opacity-[0.08]" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-heading tracking-tight leading-tight">
              &quot;Your future is built one day at a time.&quot;
            </h2>
            <p className="text-base sm:text-lg font-medium max-w-xl mx-auto opacity-90 leading-relaxed">
              Stop wondering what to do next. Let your personal Chief of Staff handle the details, so you can focus on building your best life.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-surface text-text-primary border-2 border-border font-bold text-md px-8 py-5 h-auto hover:bg-bg-secondary hover:neo-shadow active:translate-y-[1px]">
                  Start Building Your Best Life
                </Button>
              </Link>
            </div>

            <div className="text-xs font-mono font-bold opacity-75 pt-2">
              SETUP IN 2 MINUTES • PERSONAL CHIEF OF STAFF POWERED BY ADVANCED AI
            </div>
          </div>
        </div>
      </section>

      {/* 15. SaaS Footer */}
      <footer className="border-t-2 border-border bg-surface py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & description */}
          <div className="space-y-4 text-left">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-accent text-md font-bold text-accent-text neo-border">
                L
              </div>
              <span className="text-lg font-bold tracking-tight font-heading">LifeOS</span>
            </Link>
            <p className="text-xs text-text-secondary leading-relaxed">
              The premium, AI-powered Personal Life Operating System helping you achieve goals without burnout.
            </p>

          </div>

          {/* Links col 1 */}
          <div className="space-y-3 text-left">
            <div className="font-mono text-xs font-bold text-text-primary uppercase tracking-wider">Product</div>
            <ul className="space-y-2 text-xs text-text-secondary font-medium">
              <li><a href="#simulator" className="hover:text-text-primary transition-colors font-bold">Interactive Demo</a></li>
              <li><a href="#daily-planning" className="hover:text-text-primary transition-colors font-bold">Daily Planning</a></li>
              <li><a href="#faq" className="hover:text-text-primary transition-colors font-bold">FAQ</a></li>
            </ul>
          </div>

          {/* Links col 2 */}
          <div className="space-y-3 text-left">
            <div className="font-mono text-xs font-bold text-text-primary uppercase tracking-wider">Company</div>
            <ul className="space-y-2 text-xs text-text-secondary font-medium">
              <li><Link href="/about" className="hover:text-text-primary transition-colors font-bold">About Us</Link></li>
              <li><Link href="/privacy" className="hover:text-text-primary transition-colors font-bold">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-text-primary transition-colors font-bold">Terms of Service</Link></li>
              <li><Link href="/contact" className="hover:text-text-primary transition-colors font-bold">Contact Support</Link></li>
            </ul>
          </div>

          {/* Newsletter Signup */}
          <div className="space-y-3 text-left">
            <div className="font-mono text-xs font-bold text-text-primary uppercase tracking-wider">Stay Focused</div>
            <p className="text-xs text-text-secondary">
              Subscribe to get actionable weekly insights on focus, energy, and life planning.
            </p>
            <div className="flex gap-1.5 pt-1.5">
              <input
                type="email"
                className="px-2.5 py-1.5 text-xs border border-border rounded-sm bg-bg flex-1 focus:outline-none text-text-primary"
                placeholder="email@address.com"
              />
              <Button variant="primary" size="sm" className="px-3 text-xs bg-accent text-accent-text">
                Join
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-border/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-text-tertiary">
          <span>&copy; {new Date().getFullYear()} LifeOS Inc. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-text-primary transition-colors">Twitter</a>
            <a href="#" className="hover:text-text-primary transition-colors">GitHub</a>
            <a href="#" className="hover:text-text-primary transition-colors">Discord</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
