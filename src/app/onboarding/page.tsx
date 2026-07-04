'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Button, Input, Badge } from '@/components/ui'
import {
  Bot,
  Sparkles,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  Trash2,
  Mail,
  Lock,
  User,
  AlertCircle,
  GraduationCap,
  Briefcase,
  Rocket,
  DollarSign,
  Activity,
  Heart,
  Smile,
  Music,
  PlusCircle,
  Clock,
  Compass,
  Edit2,
  HelpCircle,
  Eye,
  CheckCircle2,
  LogOut
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

// Step index definitions
const STEP_AUTH = 1
const STEP_WELCOME = 2
const STEP_GOALS = 3
const STEP_LIFE_STAGE = 4
const STEP_ROUTINE = 5
const STEP_AI_HELP = 6
const STEP_ANALYZING = 7
const STEP_REVIEW = 8

const GOALS_DATA: Record<string, Array<{ title: string; desc: string; icon: string }>> = {
  "Education & Exams": [
    { title: "Crack GATE", desc: "Graduate Aptitude Test in Engineering for PSU/M.Tech", icon: "🎓" },
    { title: "Prepare for GRE", desc: "Graduate Record Examinations for US/Global Grad study", icon: "🏫" },
    { title: "Prepare for GMAT", desc: "Graduate Management Admission Test for MBA", icon: "📊" },
    { title: "Prepare for CAT", desc: "Common Admission Test for elite IIM programs", icon: "🐆" },
    { title: "Prepare for UPSC", desc: "Civil Services Examination for administrative roles", icon: "🏛️" },
    { title: "Prepare for CA", desc: "Chartered Accountant professional exams", icon: "🧾" },
    { title: "Prepare for CFA", desc: "Chartered Financial Analyst investment exams", icon: "📈" },
    { title: "Prepare for JEE", desc: "Joint Entrance Examination for engineering (IITs)", icon: "📐" },
    { title: "Prepare for NEET", desc: "National Eligibility cum Entrance Test for medicine", icon: "🩺" },
    { title: "Prepare for NEET PG", desc: "Postgraduate medical entrance exams", icon: "🔬" },
    { title: "Prepare for SSC", desc: "Staff Selection Commission exams for government posts", icon: "🦁" },
    { title: "Prepare for Banking Exams", desc: "IBPS, SBI, and RBI banking sector recruitments", icon: "🏦" },
    { title: "Prepare for IELTS", desc: "English language proficiency for immigration", icon: "💬" },
    { title: "Prepare for TOEFL", desc: "Academic English test for international studies", icon: "📝" },
    { title: "Prepare for SAT", desc: "Standardized undergraduate college admissions in US", icon: "🇺🇸" },
    { title: "Prepare for Government Exams", desc: "Various state & central civil examinations", icon: "📜" },
    { title: "Improve College Grades", desc: "Boost GPA, master courses and study better", icon: "✍️" },
    { title: "Complete Certification", desc: "AWS, PMP, Scrum, Salesforce, or technical certs", icon: "🏅" },
    { title: "Learn New Skills", desc: "Develop technical, business or creative competencies", icon: "🚀" }
  ],
  "Career": [
    { title: "Get Placement", desc: "Secure campus hiring and first career job", icon: "🎓" },
    { title: "Switch Jobs", desc: "Move to a better company or transition roles", icon: "🔄" },
    { title: "Get Promotion", desc: "Advance to senior level or executive management", icon: "🔺" },
    { title: "Land Remote Job", desc: "Work from anywhere in the world with flex hours", icon: "🌍" },
    { title: "Crack Interviews", desc: "Excel at Leetcode, system design & behavioral runs", icon: "🗣️" },
    { title: "Build Portfolio", desc: "Showcase code, designs, or business case studies", icon: "📁" },
    { title: "Freelancing", desc: "Offer consulting or contract work directly to clients", icon: "💻" },
    { title: "Become Software Engineer", desc: "Build systems, code, and master frameworks", icon: "🖥️" },
    { title: "Become Product Manager", desc: "Guide product roadmap, specs, and user strategy", icon: "🗺️" },
    { title: "Become Data Scientist", desc: "Analyze data models, train ML systems, write math", icon: "🧮" },
    { title: "Become Designer", desc: "Build wireframes, design UI assets and premium UX", icon: "🎨" }
  ],
  "Startup & Business": [
    { title: "Build Startup", desc: "Ideate, register, and launch a tech venture", icon: "🚀" },
    { title: "Launch MVP", desc: "Ship the initial functional product to customers", icon: "📦" },
    { title: "Get First Customer", desc: "Perform sales, run ads, and validate value", icon: "🤝" },
    { title: "Increase Revenue", desc: "Optimize pricing, upsells, and sales funnels", icon: "💸" },
    { title: "Raise Funding", desc: "Pitch angels, seed funds, or venture capital", icon: "🏦" },
    { title: "Grow Business", desc: "Hire staff, scale distribution, expand markets", icon: "📈" },
    { title: "Build Personal Brand", desc: "Establish expertise in public domains", icon: "⭐" },
    { title: "Grow LinkedIn", desc: "Write regular content, network, get visibility", icon: "💼" },
    { title: "Grow Instagram", desc: "Build visual aesthetic, reels, and page audience", icon: "📸" },
    { title: "Become Content Creator", desc: "Vlog, blog, podcast, or write newsletters", icon: "🎙️" }
  ],
  "Finance": [
    { title: "Save Money", desc: "Build emergency savings, reduce lifestyle creep", icon: "🐷" },
    { title: "Invest", desc: "Build stock portfolio, real estate, and crypto holdings", icon: "📈" },
    { title: "Increase Income", desc: "Add side-hustles, freelancing, or get a raise", icon: "💰" },
    { title: "Become Financially Independent", desc: "Cross the threshold of passive income coverage", icon: "🔓" },
    { title: "Track Expenses", desc: "Log daily cashflows to curb impulse spendings", icon: "📊" },
    { title: "Reduce Debt", desc: "Eliminate student loans, credit cards and interest", icon: "📉" }
  ],
  "Health": [
    { title: "Lose Weight", desc: "Burn fat, count daily calorie budgets", icon: "⚖️" },
    { title: "Gain Muscle", desc: "Progressive overload lifting and protein macro tracking", icon: "💪" },
    { title: "Improve Fitness", desc: "Boost VO2 max, run speeds, and body endurance", icon: "🏃" },
    { title: "Build Healthy Habits", desc: "Hydration, sleep hygiene, daily steps target", icon: "🍏" },
    { title: "Sleep Better", desc: "Track deep sleep, avoid screens before bed", icon: "🛌" },
    { title: "Eat Healthier", desc: "High protein, whole foods, home-cooked dinners", icon: "🥗" },
    { title: "Reduce Stress", desc: "Maintain balance, control work pressure, block boundaries", icon: "🧘" },
    { title: "Meditation", desc: "Mindful breathing exercises for mental calm", icon: "✨" }
  ],
  "Relationships": [
    { title: "Spend More Time With Family", desc: "Schedule dedicated family hours & weekends", icon: "🏡" },
    { title: "Improve Relationship", desc: "Intimate date nights, couples counseling, active talks", icon: "❤️" },
    { title: "Make New Friends", desc: "Join clubs, attend events, grow social networks", icon: "👋" },
    { title: "Better Work-Life Balance", desc: "Log off work on time, protect personal weekends", icon: "⚖️" },
    { title: "Improve Communication", desc: "Practice active listening, conflict resolutions", icon: "💬" }
  ],
  "Personal Growth": [
    { title: "Read More Books", desc: "Set annual reading goals, take detailed notes", icon: "📚" },
    { title: "Learn AI", desc: "Master prompts, APIs, vector stores, and agent logic", icon: "🤖" },
    { title: "Learn Programming", desc: "Write React, Python, or standard algorithmic systems", icon: "💻" },
    { title: "Learn Language", desc: "Practice daily vocabulary in a foreign tongue", icon: "🗣️" },
    { title: "Improve Productivity", desc: "Time block schedules, organize tasks in inbox", icon: "⚡" },
    { title: "Public Speaking", desc: "Confident presentations and clear voice controls", icon: "🎤" },
    { title: "Writing", desc: "Publish essays, journaling, or writing a novel", icon: "✍️" },
    { title: "Music", desc: "Learn music theory, scales, or digital production", icon: "🎵" },
    { title: "Photography", desc: "Master aperture settings, lighting, edits", icon: "📷" },
    { title: "Travel", desc: "Visit new places, learn cultures, take photos", icon: "✈️" }
  ],
  "Hobbies": [
    { title: "Guitar", desc: "Learn chords, riffs, and favorite songs", icon: "🎸" },
    { title: "Piano", desc: "Play scales, sight-reading, classical or pop", icon: "🎹" },
    { title: "Singing", desc: "Vocal exercises, pitch training, song runs", icon: "🎤" },
    { title: "Drawing", desc: "Sketching characters, digital painting, shading", icon: "✏️" },
    { title: "Dancing", desc: "Learn street styles, contemporary, or routines", icon: "💃" },
    { title: "Cooking", desc: "Master knife work, regional recipes, plating", icon: "🍳" },
    { title: "Gaming", desc: "Play narrative games, esports, or design maps", icon: "🎮" },
    { title: "Photography", desc: "Capture street compositions and landscape views", icon: "📸" },
    { title: "Content Creation", desc: "Video editing, reels, vlogs, scripting", icon: "🎬" }
  ]
}

const LIFE_STAGES = [
  { name: "School Student", icon: "🎒" },
  { name: "College Student", icon: "🎓" },
  { name: "Working Professional", icon: "💼" },
  { name: "Founder", icon: "🚀" },
  { name: "Freelancer", icon: "💻" },
  { name: "Job Seeker", icon: "🔍" },
  { name: "Researcher", icon: "🔬" },
  { name: "Homemaker", icon: "🏡" },
  { name: "Retired", icon: "🌴" },
  { name: "Other", icon: "✨" }
]

const ROUTINE_COMMITMENTS = [
  "School", "College", "Job", "Startup", "Business", "Coaching", "Gym", "Sports", "Family Responsibilities", "Freelancing", "Other"
]

const FOCUS_HOURS_OPTIONS = [
  "Less than 1 hour", "1–2 hours", "2–4 hours", "4–6 hours", "More than 6 hours", "It depends"
]

const AI_ROLES = [
  { name: "Coach", desc: "Pushes your boundaries and keeps your energy high.", icon: "⚡" },
  { name: "Mentor", desc: "Provides high-level direction, perspective, and career guidance.", icon: "🧠" },
  { name: "Planner", desc: "Organizes your scheduling, routines, and maps milestones.", icon: "📅" },
  { name: "Accountability Partner", desc: "Direct, straightforward, and alerts you of slipped targets.", icon: "🎯" },
  { name: "Strategic Advisor", desc: "Framework and system analysis driven, tactical execution.", icon: "🛡️" },
  { name: "Mix of Everything (Recommended)", desc: "Adapts dynamically based on your goals and routine patterns.", icon: "✨", recommended: true }
]

const CUSTOM_GOAL_SUGGESTIONS = [
  "I want to become a pilot.",
  "I want to buy my first house.",
  "I want to retire early.",
  "I want to write a book.",
  "I want to become financially independent."
]

export default function OnboardingRedesignPage() {
  const router = useRouter()
  const { user, isAuthenticated, setUser, signOut } = useAuthStore()

  // Onboarding Wizard States
  const [step, setStep] = useState(1)
  
  // Step 1: Auth States
  const [email, setEmail] = useState('')
  const [emailCheckLoading, setEmailCheckLoading] = useState(false)
  const [emailChecked, setEmailChecked] = useState(false)
  const [userExistsInDb, setUserExistsInDb] = useState(false)
  const [authName, setAuthName] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  // Step 2: Welcome States
  // Skippable flow or start

  // Step 3: Goals States
  const [activeGoalCategory, setActiveGoalCategory] = useState("Education & Exams")
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [customGoalInput, setCustomGoalInput] = useState('')
  const [customGoals, setCustomGoals] = useState<string[]>([])

  // Step 4: Life Stage States
  const [selectedLifeStage, setSelectedLifeStage] = useState('')

  // Step 5: Routine States
  const [selectedCommitments, setSelectedCommitments] = useState<string[]>([])
  const [selectedFocusHours, setSelectedFocusHours] = useState('2–4 hours')

  // Step 6: AI Help States
  const [selectedAiRole, setSelectedAiRole] = useState('Mix of Everything (Recommended)')

  // Step 7: AI Analysis States
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [analysisText, setAnalysisText] = useState('Architecting your profile...')
  const [generatedPayload, setGeneratedPayload] = useState<any>(null)

  // Step 8: Review & Edit States
  const [editableGoals, setEditableGoals] = useState<any[]>([])
  const [editableRoadmaps, setEditableRoadmaps] = useState<any[]>([])
  const [editableTasks, setEditableTasks] = useState<any[]>([])
  const [editableRoutines, setEditableRoutines] = useState<any[]>([])
  const [editableMemories, setEditableMemories] = useState<any[]>([])
  
  // Edit modals or inline controllers
  const [isSaving, setIsSaving] = useState(false)

  // Sync auth state: If user is already logged in, skip Step 1
  useEffect(() => {
    if (isAuthenticated && user && step === STEP_AUTH) {
      setStep(STEP_WELCOME)
    }
  }, [isAuthenticated, user, step])

  // AUTH LOGIC
  async function handleCheckEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || emailCheckLoading) return
    
    setEmailCheckLoading(true)
    setAuthError('')
    try {
      const res = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email.trim())}`)
      const resJson = await res.json()
      if (resJson.data) {
        setUserExistsInDb(resJson.data.exists)
        if (resJson.data.name) {
          setAuthName(resJson.data.name)
        }
        setEmailChecked(true)
      } else {
        throw new Error(resJson.error?.message || 'Check failed')
      }
    } catch (err: any) {
      setAuthError(err.message || 'Verification failed. Try again.')
    } finally {
      setEmailCheckLoading(false)
    }
  }

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (authLoading) return

    setAuthLoading(true)
    setAuthError('')

    const emailTrim = email.trim()
    const nameTrim = authName.trim()
    const passwordTrim = authPassword.trim()

    try {
      if (userExistsInDb) {
        // Log in
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailTrim, password: passwordTrim }),
        })
        const result = await res.json()
        if (!res.ok) throw new Error(result.error?.message || 'Login failed')
        
        setUser(result.data)
        setStep(STEP_WELCOME)
      } else {
        // Sign up
        if (!nameTrim || !passwordTrim) {
          throw new Error('Name and password are required')
        }
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailTrim, name: nameTrim, password: passwordTrim }),
        })
        const result = await res.json()
        if (!res.ok) throw new Error(result.error?.message || 'Failed to create user')
        
        // Log in right after sign up
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailTrim, password: passwordTrim }),
        })
        const loginResult = await loginRes.json()
        if (!loginRes.ok) throw new Error(loginResult.error?.message || 'Failed to auto-sign in')
        
        setUser(loginResult.data)
        setStep(STEP_WELCOME)
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication error')
    } finally {
      setAuthLoading(false)
    }
  }

  // MOCK GOOGLE AUTHENTICATION
  async function handleMockGoogleAuth() {
    setAuthLoading(true)
    setAuthError('')
    
    const mockEmail = `google.${Math.floor(Math.random() * 10000)}@gmail.com`
    const mockName = 'Google Explorer'
    const mockPassword = 'GoogleAuthMockedPassword123!'

    try {
      // 1. Check if mock user somehow exists
      const resCheck = await fetch(`/api/auth/check-email?email=${encodeURIComponent(mockEmail)}`)
      const resCheckJson = await resCheck.json()
      
      if (resCheckJson.data && !resCheckJson.data.exists) {
        // 2. Create mock user
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: mockEmail, name: mockName, password: mockPassword }),
        })
        if (!res.ok) throw new Error('Google Signup Simulation failed')
      }

      // 3. Log in
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: mockEmail, password: mockPassword }),
      })
      const loginResult = await loginRes.json()
      if (!loginRes.ok) throw new Error('Google Login Simulation failed')

      setUser(loginResult.data)
      setStep(STEP_WELCOME)
    } catch (err: any) {
      setAuthError(err.message || 'Google Auth simulation failed')
    } finally {
      setAuthLoading(false)
    }
  }

  // SKIP FLOW completely
  async function handleSkipOnboarding() {
    if (!user) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          userId: user.id,
          data: {
            goals: [{ title: 'Achieve Personal Goals', description: 'Start structuring your life goals with AI.', level: 'long_term' }],
            roadmaps: [{ title: 'Get Started', description: 'Begin configuring your routines and tasks.', goalIndex: 0 }],
            tasks: [{ title: 'Review LifeOS settings', description: 'Complete your dynamic check-in.', estimatedMinutes: 15, roadmapIndex: 0 }],
            routines: [],
            memories: [{ key: 'user.facts.life_stage', value: 'General User', memoryType: 'fact' }],
            lifeStage: 'general',
            focusedHours: '2-4 hours',
            aiRole: 'Mix of Everything'
          }
        }),
      })
      if (res.ok) {
        router.push('/')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  // STEP CONTROLS
  const nextStep = () => setStep((prev) => prev + 1)
  const prevStep = () => setStep((prev) => prev - 1)

  // GOALS SELECTORS
  const toggleGoal = (goalTitle: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goalTitle)
        ? prev.filter((g) => g !== goalTitle)
        : [...prev, goalTitle]
    )
  }

  const addCustomGoal = () => {
    if (!customGoalInput.trim()) return
    if (!customGoals.includes(customGoalInput.trim())) {
      setCustomGoals((prev) => [...prev, customGoalInput.trim()])
    }
    setCustomGoalInput('')
  }

  const removeCustomGoal = (goal: string) => {
    setCustomGoals((prev) => prev.filter((g) => g !== goal))
  }

  // LIFE STAGE SELECTORS
  const selectLifeStage = (stage: string) => {
    setSelectedLifeStage(stage)
  }

  // ROUTINE SELECTORS
  const toggleCommitment = (commit: string) => {
    setSelectedCommitments((prev) =>
      prev.includes(commit)
        ? prev.filter((c) => c !== commit)
        : [...prev, commit]
    )
  }

  // AI ANALYZING TRIGGER
  const triggerAIAnalysis = async () => {
    if (!user) return
    setStep(STEP_ANALYZING)
    setAnalysisProgress(10)
    setAnalysisText('Reviewing your selections...')

    // Start a faux timer for loading micro-copy
    const interval = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval)
          return 90
        }
        const nextVal = prev + 15
        if (nextVal >= 80) setAnalysisText('Writing initial memories & routines...')
        else if (nextVal >= 50) setAnalysisText('Generating matching roadmaps & tasks...')
        else if (nextVal >= 30) setAnalysisText('Drafting customizable goals...')
        return nextVal
      })
    }, 450)

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze',
          userId: user.id,
          answers: {
            goals: selectedGoals,
            customGoals: customGoals,
            lifeStage: selectedLifeStage,
            commitments: selectedCommitments,
            focusedHours: selectedFocusHours,
            aiRole: selectedAiRole
          }
        }),
      })

      const resJson = await res.json()
      clearInterval(interval)
      setAnalysisProgress(100)

      if (resJson.data) {
        setGeneratedPayload(resJson.data)
        setEditableGoals(resJson.data.goals || [])
        setEditableRoadmaps(resJson.data.roadmaps || [])
        setEditableTasks(resJson.data.tasks || [])
        setEditableRoutines(resJson.data.routines || [])
        setEditableMemories(resJson.data.memories || [])
        
        // Timeout to make progress feel premium
        setTimeout(() => {
          setStep(STEP_REVIEW)
        }, 300)
      } else {
        throw new Error(resJson.error?.message || 'Analysis failed')
      }
    } catch (err) {
      clearInterval(interval)
      setStep(STEP_AI_HELP)
      alert('AI Generation timed out or failed. Re-trying with local setup.')
    }
  }

  // EDIT METHODS (REVIEW SCREEN)
  // Goals
  const handleEditGoalText = (index: number, newTitle: string) => {
    setEditableGoals((prev) => prev.map((g, i) => i === index ? { ...g, title: newTitle } : g))
  }
  const handleDeleteGoal = (index: number) => {
    setEditableGoals((prev) => prev.filter((_, i) => i !== index))
    // Clean roadmaps associated with this goal index
    setEditableRoadmaps((prev) => prev.filter((p) => p.goalIndex !== index).map((p) => p.goalIndex > index ? { ...p, goalIndex: p.goalIndex - 1 } : p))
  }
  const handleAddGoalDirectly = () => {
    setEditableGoals((prev) => [...prev, { title: "New Custom Goal", description: "Define description", level: "long_term" }])
  }

  // Roadmaps
  const handleEditRoadmapText = (index: number, newTitle: string) => {
    setEditableRoadmaps((prev) => prev.map((p, i) => i === index ? { ...p, title: newTitle } : p))
  }
  const handleDeleteRoadmap = (index: number) => {
    setEditableRoadmaps((prev) => prev.filter((_, i) => i !== index))
    setEditableTasks((prev) => prev.filter((t) => t.roadmapIndex !== index).map((t) => t.roadmapIndex > index ? { ...t, roadmapIndex: t.roadmapIndex - 1 } : t))
  }
  const handleAddRoadmapDirectly = (goalIndex: number) => {
    setEditableRoadmaps((prev) => [...prev, { title: "New Roadmap", description: "Workspace milestone", goalIndex }])
  }

  // Tasks
  const handleEditTaskText = (index: number, newTitle: string) => {
    setEditableTasks((prev) => prev.map((t, i) => i === index ? { ...t, title: newTitle } : t))
  }
  const handleEditTaskMinutes = (index: number, minutes: number) => {
    setEditableTasks((prev) => prev.map((t, i) => i === index ? { ...t, estimatedMinutes: minutes } : t))
  }
  const handleDeleteTask = (index: number) => {
    setEditableTasks((prev) => prev.filter((_, i) => i !== index))
  }
  const handleAddTaskDirectly = (roadmapIndex: number) => {
    setEditableTasks((prev) => [...prev, { title: "New Action Item", description: "", estimatedMinutes: 45, roadmapIndex }])
  }

  // Routines
  const handleEditRoutineText = (index: number, newTitle: string) => {
    setEditableRoutines((prev) => prev.map((r, i) => i === index ? { ...r, title: newTitle } : r))
  }
  const handleEditRoutineTimeOfDay = (index: number, newTimeOfDay: string) => {
    setEditableRoutines((prev) => prev.map((r, i) => i === index ? { ...r, timeOfDay: newTimeOfDay } : r))
  }
  const handleEditRoutineDuration = (index: number, newDuration: number) => {
    setEditableRoutines((prev) => prev.map((r, i) => i === index ? { ...r, durationMinutes: newDuration } : r))
  }
  const handleDeleteRoutine = (index: number) => {
    setEditableRoutines((prev) => prev.filter((_, i) => i !== index))
  }
  const handleAddRoutineDirectly = () => {
    setEditableRoutines((prev) => [...prev, { title: "Custom Routine Block", description: "", timeOfDay: "morning", durationMinutes: 60 }])
  }

  // SAVE SETUP TO DB
  const saveOnboardingSetup = async () => {
    if (!user || isSaving) return
    setIsSaving(true)
    
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          userId: user.id,
          data: {
            goals: editableGoals,
            roadmaps: editableRoadmaps,
            tasks: editableTasks,
            routines: editableRoutines,
            memories: editableMemories,
            lifeStage: selectedLifeStage,
            focusedHours: selectedFocusHours,
            aiRole: selectedAiRole
          }
        })
      })

      if (res.ok) {
        // Redraw route guards in auth store
        const userWithOnboarding = { ...user, onboardingCompleted: true }
        setUser(userWithOnboarding)
        router.push('/')
      } else {
        throw new Error('Save operation failed')
      }
    } catch (e) {
      alert('Failed to save setup. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const totalSteps = 6

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 neo-transition">
      <div className="w-full max-w-3xl">
        
        {/* Top Header Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-accent text-[10px] font-bold text-accent-text neo-border">
              L
            </div>
            <span className="text-sm font-bold tracking-tight">LifeOS</span>
          </div>
          {isAuthenticated && (
            <button
              onClick={async () => {
                await signOut()
                setStep(STEP_AUTH)
                router.push('/onboarding')
              }}
              className="flex items-center gap-1.5 rounded-sm border-2 border-border bg-surface hover:bg-error-bg/10 px-2 py-1.5 text-xs font-bold text-error neo-transition cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          )}
        </div>
        
        {/* TOP STATUS BAR (Hidden during Loading and Review steps) */}
        {step <= STEP_AI_HELP && (
          <div className="mb-6 flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-text-secondary">
              <span>Personalizing LifeOS</span>
              <span>Step {step} of {totalSteps}</span>
            </div>
            <div className="w-full bg-bg-tertiary h-2 rounded-full overflow-hidden neo-border">
              <div 
                className="bg-accent h-full transition-all duration-300" 
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* STEP CARD RENDERING */}
        <Card variant="raised" padding="lg" className="w-full relative overflow-hidden bg-surface animate-fade-in">
          
          {/* STEP 1: AUTHENTICATION */}
          {step === STEP_AUTH && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-sm bg-accent text-2xl font-bold text-accent-text neo-shadow-sm neo-border">
                  <Bot className="h-7 w-7 text-accent-text" />
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight">Access Your Chief of Staff</h1>
                <p className="text-sm text-text-secondary">
                  Create a secure operational profile or log in to resume your OS.
                </p>
              </div>

              {authError && (
                <div className="p-3 bg-error-bg text-error text-xs font-semibold rounded-sm border-2 border-error flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {/* Main Auth Buttons */}
              <div className="space-y-3">
                <Button 
                  onClick={handleMockGoogleAuth} 
                  variant="primary" 
                  className="w-full flex items-center justify-center gap-3 py-6"
                  disabled={authLoading}
                >
                  <svg className="h-5 w-5 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.785 0 3.32.675 4.5 1.785l2.42-2.42C17.655 1.915 15.115 1 12.24 1 6.58 1 2 5.58 2 11.24s4.58 10.24 10.24 10.24c5.995 0 9.98-4.215 9.98-10.155 0-.615-.055-1.21-.165-1.785H12.24z"/>
                  </svg>
                  Continue with Google
                </Button>

                {/* Email Transition Box */}
                {!emailChecked ? (
                  <form onSubmit={handleCheckEmail} className="space-y-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="neo-label">Continue with Email</label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@domain.com"
                          className="neo-input flex-1"
                        />
                        <Button type="submit" disabled={emailCheckLoading}>
                          {emailCheckLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleAuthSubmit} className="space-y-4 animate-fade-in border-2 border-border p-4 bg-bg-secondary rounded-sm">
                    <div className="flex items-center justify-between border-b-2 border-border pb-2 mb-2">
                      <span className="text-xs font-bold text-text-secondary">{email}</span>
                      <button 
                        type="button" 
                        onClick={() => setEmailChecked(false)} 
                        className="text-[10px] font-bold text-accent uppercase hover:underline"
                      >
                        Change
                      </button>
                    </div>

                    {!userExistsInDb && (
                      <div className="flex flex-col gap-1.5">
                        <label className="neo-label">Full Name</label>
                        <input
                          type="text"
                          required
                          value={authName}
                          onChange={(e) => setAuthName(e.target.value)}
                          placeholder="Alex Mercer"
                          className="neo-input"
                        />
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                      <label className="neo-label">Password</label>
                      <input
                        type="password"
                        required
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="••••••••"
                        className="neo-input"
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={authLoading}>
                      {authLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        userExistsInDb ? 'Sign In to OS' : 'Create Operational Account'
                      )}
                    </Button>
                  </form>
                )}

                <Button 
                  variant="ghost" 
                  className="w-full flex items-center justify-center gap-3 opacity-60 cursor-not-allowed" 
                  disabled
                >
                  <AppleIcon className="h-5 w-5 shrink-0" />
                  Continue with Apple (Coming Soon)
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: WELCOME SCREEN */}
          {step === STEP_WELCOME && (
            <div className="space-y-6 text-center py-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-sm bg-accent/10 border-2 border-accent neo-shadow-sm">
                <Sparkles className="h-8 w-8 text-accent animate-pulse" />
              </div>
              
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight">Welcome to AI Life OS 👋</h1>
                <p className="text-base text-text-secondary max-w-md mx-auto">
                  Let&apos;s personalize your experience. We will extract goals, roadmaps, and custom focus blocks based on your profile.
                </p>
                <div className="inline-block py-1 px-3 bg-accent-light dark:bg-accent/10 rounded-full border-2 border-accent border-dashed text-xs font-bold text-accent">
                  ⚡ Personalization takes less than 2 minutes
                </div>
              </div>

              <div className="pt-6 grid grid-cols-2 gap-4 max-w-md mx-auto">
                <Button onClick={() => handleSkipOnboarding()} variant="ghost" className="py-5" disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Skip for now
                </Button>
                <Button onClick={nextStep} variant="primary" className="py-5">
                  Start Personalization
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: GOALS (What are you currently working towards?) */}
          {step === STEP_GOALS && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold">What are you currently working towards?</h2>
                <p className="text-sm text-text-secondary">Select multiple templates or write your own custom goals below.</p>
              </div>

              {/* Category selector pills */}
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-none">
                {Object.keys(GOALS_DATA).map((catName) => (
                  <button
                    key={catName}
                    onClick={() => setActiveGoalCategory(catName)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-bold whitespace-nowrap border-2 border-border rounded-sm neo-transition",
                      activeGoalCategory === catName 
                        ? "bg-accent text-accent-text neo-shadow-sm" 
                        : "bg-surface hover:bg-bg-secondary"
                    )}
                  >
                    {catName}
                  </button>
                ))}
              </div>

              {/* Cards grid */}
              <div className="grid gap-3 sm:grid-cols-2 max-h-[300px] overflow-y-auto pr-1">
                {GOALS_DATA[activeGoalCategory].map((g) => {
                  const isSelected = selectedGoals.includes(g.title)
                  return (
                    <div
                      key={g.title}
                      onClick={() => toggleGoal(g.title)}
                      className={cn(
                        "p-4 border-2 border-border rounded-sm cursor-pointer text-left neo-transition flex gap-3 items-start select-none",
                        isSelected 
                          ? "bg-accent/5 border-accent neo-shadow-sm" 
                          : "bg-surface hover:bg-bg-secondary"
                      )}
                    >
                      <div className="text-2xl mt-1">{g.icon}</div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold">{g.title}</h4>
                          {isSelected && <Check className="h-4 w-4 text-accent shrink-0" />}
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed">{g.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Custom Goal Input */}
              <div className="border-t-2 border-border pt-4 space-y-3">
                <div className="flex flex-col gap-1.5">
                  <label className="neo-label">🎯 Custom Goal</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customGoalInput}
                      onChange={(e) => setCustomGoalInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addCustomGoal()}
                      placeholder="e.g. I want to buy my first house, retire early, write a book..."
                      className="neo-input flex-1"
                    />
                    <Button onClick={addCustomGoal}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Suggestions quick tags */}
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] font-bold text-text-tertiary uppercase">Try:</span>
                  {CUSTOM_GOAL_SUGGESTIONS.map((sug) => {
                    const exists = customGoals.includes(sug) || selectedGoals.includes(sug)
                    if (exists) return null
                    return (
                      <button
                        key={sug}
                        onClick={() => setCustomGoals((prev) => [...prev, sug])}
                        className="text-[10px] font-semibold border border-dashed border-border-light hover:border-accent hover:text-accent rounded-sm px-2 py-0.5"
                      >
                        {sug}
                      </button>
                    )
                  })}
                </div>

                {/* Custom Goal Chips */}
                {customGoals.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-3 bg-bg-secondary rounded-sm border-2 border-dashed border-border animate-fade-in">
                    {customGoals.map((cg) => (
                      <Badge 
                        key={cg} 
                        variant="accent" 
                        className="flex items-center gap-1 py-1 px-2.5 text-xs text-accent border border-accent bg-accent-light"
                      >
                        <span>{cg}</span>
                        <Trash2 
                          onClick={() => removeCustomGoal(cg)} 
                          className="h-3 w-3 cursor-pointer text-accent hover:text-error hover:scale-110 ml-1 shrink-0" 
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Wizard Nav */}
              <div className="flex justify-between items-center pt-4">
                <Button onClick={prevStep} variant="ghost">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={nextStep} 
                  disabled={selectedGoals.length === 0 && customGoals.length === 0}
                  variant="primary"
                >
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: LIFE STAGE */}
          {step === STEP_LIFE_STAGE && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold">Choose Your Life Stage</h2>
                <p className="text-sm text-text-secondary">We will organize matching categories and tasks based on this stage.</p>
              </div>

              {/* Stage grid */}
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 max-h-[300px] overflow-y-auto pr-1">
                {LIFE_STAGES.map((ls) => {
                  const isSelected = selectedLifeStage === ls.name
                  return (
                    <div
                      key={ls.name}
                      onClick={() => selectLifeStage(ls.name)}
                      className={cn(
                        "p-4 border-2 border-border rounded-sm cursor-pointer text-center neo-transition select-none flex flex-col items-center gap-2",
                        isSelected 
                          ? "bg-accent/5 border-accent neo-shadow-sm font-bold" 
                          : "bg-surface hover:bg-bg-secondary"
                      )}
                    >
                      <div className="text-3xl">{ls.icon}</div>
                      <span className="text-xs tracking-tight">{ls.name}</span>
                    </div>
                  )
                })}
              </div>

              {/* Wizard Nav */}
              <div className="flex justify-between items-center pt-4">
                <Button onClick={prevStep} variant="ghost">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={nextStep} 
                  disabled={!selectedLifeStage}
                  variant="primary"
                >
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 5: ROUTINE COMMITMENTS */}
          {step === STEP_ROUTINE && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-extrabold">Your Daily Routine</h2>
                <p className="text-sm text-text-secondary">Select your current commitments to structure your schedule.</p>
              </div>

              {/* Commitments chips grid */}
              <div className="space-y-2">
                <label className="neo-label">Active Daily Commitments</label>
                <div className="flex flex-wrap gap-2">
                  {ROUTINE_COMMITMENTS.map((comm) => {
                    const isSelected = selectedCommitments.includes(comm)
                    return (
                      <button
                        key={comm}
                        onClick={() => toggleCommitment(comm)}
                        className={cn(
                          "px-3.5 py-2 text-xs font-bold border-2 border-border rounded-sm neo-transition",
                          isSelected
                            ? "bg-accent text-accent-text neo-shadow-sm"
                            : "bg-surface hover:bg-bg-secondary"
                        )}
                      >
                        {comm}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Focused Hours Slider/Buttons */}
              <div className="space-y-3 pt-4 border-t-2 border-border">
                <div className="flex flex-col gap-1">
                  <label className="neo-label">How many focused hours do you usually have?</label>
                  <p className="text-xs text-text-secondary">For completing goals and self-improvement tasks.</p>
                </div>
                <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
                  {FOCUS_HOURS_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setSelectedFocusHours(opt)}
                      className={cn(
                        "px-3 py-2 text-xs font-bold border-2 border-border rounded-sm neo-transition",
                        selectedFocusHours === opt 
                          ? "bg-accent text-accent-text neo-shadow-sm" 
                          : "bg-surface hover:bg-bg-secondary"
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Wizard Nav */}
              <div className="flex justify-between items-center pt-4">
                <Button onClick={prevStep} variant="ghost">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={nextStep} 
                  disabled={selectedCommitments.length === 0}
                  variant="primary"
                >
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 6: AI HELP PROFILE */}
          {step === STEP_AI_HELP && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold">Choose Your AI Coach Personality</h2>
                <p className="text-sm text-text-secondary">This defines how the Chief of Staff interacts, triggers insights, and coaches you.</p>
              </div>

              {/* List items */}
              <div className="grid gap-3 sm:grid-cols-2 max-h-[300px] overflow-y-auto pr-1">
                {AI_ROLES.map((role) => {
                  const isSelected = selectedAiRole === role.name
                  return (
                    <div
                      key={role.name}
                      onClick={() => setSelectedAiRole(role.name)}
                      className={cn(
                        "p-4 border-2 border-border rounded-sm cursor-pointer text-left neo-transition flex gap-3 select-none relative",
                        isSelected 
                          ? "bg-accent/5 border-accent neo-shadow-sm" 
                          : "bg-surface hover:bg-bg-secondary"
                      )}
                    >
                      {role.recommended && (
                        <span className="absolute top-2 right-2 text-[8px] font-bold uppercase tracking-wider bg-success text-white px-1.5 py-0.5 rounded-sm shrink-0 border border-border">
                          Recommended
                        </span>
                      )}
                      <div className="text-2xl mt-1">{role.icon}</div>
                      <div className="flex-1 space-y-1 pr-6">
                        <h4 className="text-sm font-bold">{role.name}</h4>
                        <p className="text-xs text-text-secondary leading-relaxed">{role.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Wizard Nav */}
              <div className="flex justify-between items-center pt-4">
                <Button onClick={prevStep} variant="ghost">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={triggerAIAnalysis}
                  variant="primary"
                >
                  Generate My LifeOS
                  <Sparkles className="h-4 w-4 ml-2 animate-pulse" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 7: AI ANALYSIS LOADING */}
          {step === STEP_ANALYZING && (
            <div className="py-12 space-y-8 flex flex-col items-center justify-center text-center">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-accent border-dashed animate-spin flex items-center justify-center" />
                <Bot className="h-8 w-8 text-accent absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-bounce" />
              </div>

              <div className="space-y-2 max-w-sm">
                <h3 className="text-xl font-bold">Constructing Workspace Profile</h3>
                <p className="text-xs font-semibold text-accent uppercase tracking-widest">{analysisText}</p>
                <p className="text-xs text-text-secondary">Generating life areas, prioritizing milestones, building weekly blocks...</p>
              </div>

              <div className="w-full max-w-xs bg-bg-tertiary h-2 rounded-full overflow-hidden neo-border">
                <div 
                  className="bg-accent h-full transition-all duration-300"
                  style={{ width: `${analysisProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* STEP 8: REVIEW SCREEN */}
          {step === STEP_REVIEW && (
            <div className="space-y-6 text-left">
              <div className="border-b-2 border-border pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-5 w-5 text-accent animate-pulse" />
                  <h2 className="text-2xl font-extrabold">Your AI Generated LifeOS Draft</h2>
                </div>
                <p className="text-sm text-text-secondary">
                  Our Chief of Staff generated the following structure. Review and edit any titles, durations, or items before writing to your operating system.
                </p>
              </div>

              {/* Dynamic review section tabs or grids */}
              <div className="space-y-6 max-h-[450px] overflow-y-auto pr-1">
                
                {/* 1. Goals review */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-text-secondary flex items-center gap-2">
                      <Compass className="h-4 w-4 text-accent" />
                      Goals ({editableGoals.length})
                    </h3>
                    <button 
                      onClick={handleAddGoalDirectly} 
                      className="text-xs font-bold text-accent flex items-center gap-1 hover:underline"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Goal
                    </button>
                  </div>
                  <div className="space-y-2">
                    {editableGoals.map((g, idx) => (
                      <div key={idx} className="flex gap-2 items-center p-3 border-2 border-border bg-bg rounded-sm animate-fade-in">
                        <input
                          type="text"
                          value={g.title}
                          onChange={(e) => handleEditGoalText(idx, e.target.value)}
                          className="bg-transparent font-semibold text-sm flex-1 outline-none border-b border-transparent focus:border-accent focus:bg-surface px-1"
                        />
                        <button 
                          onClick={() => handleDeleteGoal(idx)} 
                          className="text-text-tertiary hover:text-error p-1 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Roadmaps review */}
                <div className="space-y-3 pt-4 border-t-2 border-border border-dashed">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-text-secondary flex items-center gap-2">
                      <Rocket className="h-4 w-4 text-accent" />
                      Roadmaps ({editableRoadmaps.length})
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {editableGoals.map((goal, gIdx) => {
                      const goalRoadmaps = editableRoadmaps.filter((p) => p.goalIndex === gIdx)
                      return (
                        <div key={gIdx} className="space-y-2 pl-3 border-l-2 border-accent/20">
                          <span className="text-[10px] font-bold text-text-tertiary uppercase">Roadmaps for: {goal.title}</span>
                          
                          {goalRoadmaps.map((p, origIdx) => {
                            // Find actual index in editableRoadmaps
                            const pIdx = editableRoadmaps.findIndex((ep) => ep.title === p.title && ep.goalIndex === p.goalIndex)
                            return (
                              <div key={origIdx} className="flex gap-2 items-center p-2.5 border-2 border-border bg-bg-secondary rounded-sm animate-fade-in">
                                <input
                                  type="text"
                                  value={p.title}
                                  onChange={(e) => handleEditRoadmapText(pIdx, e.target.value)}
                                  className="bg-transparent text-xs font-bold flex-1 outline-none border-b border-transparent focus:border-accent focus:bg-surface px-1"
                                />
                                <button 
                                  onClick={() => handleDeleteRoadmap(pIdx)} 
                                  className="text-text-tertiary hover:text-error p-1 transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )
                          })}
                          
                          <button
                            onClick={() => handleAddRoadmapDirectly(gIdx)}
                            className="text-[10px] font-bold text-accent flex items-center gap-0.5 hover:underline"
                          >
                            <Plus className="h-3 w-3" /> Add Roadmap
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* 3. Tasks review */}
                <div className="space-y-3 pt-4 border-t-2 border-border border-dashed">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-text-secondary flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-accent" />
                      Tasks ({editableTasks.length})
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {editableRoadmaps.map((proj, pIdx) => {
                      const projTasks = editableTasks.filter((t) => t.roadmapIndex === pIdx)
                      return (
                        <div key={pIdx} className="space-y-2 pl-3 border-l-2 border-border-light">
                          <span className="text-[10px] font-bold text-text-tertiary uppercase">Tasks for Roadmap: {proj.title}</span>
                          
                          {projTasks.map((t, origTIdx) => {
                            const tIdx = editableTasks.findIndex((et) => et.title === t.title && et.roadmapIndex === t.roadmapIndex)
                            return (
                              <div key={origTIdx} className="flex gap-2 items-center p-2 border-2 border-border bg-bg-secondary rounded-sm animate-fade-in">
                                <input
                                  type="text"
                                  value={t.title}
                                  onChange={(e) => handleEditTaskText(tIdx, e.target.value)}
                                  className="bg-transparent text-xs flex-1 outline-none border-b border-transparent focus:border-accent focus:bg-surface px-1"
                                />
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <input
                                    type="number"
                                    value={t.estimatedMinutes || ''}
                                    onChange={(e) => handleEditTaskMinutes(tIdx, parseInt(e.target.value) || 0)}
                                    className="w-12 text-center text-xs font-mono font-bold bg-surface border-2 border-border py-0.5 px-1 rounded-sm outline-none"
                                    placeholder="Min"
                                  />
                                  <span className="text-xs text-text-secondary font-bold font-mono shrink-0">min</span>
                                </div>
                                <button 
                                  onClick={() => handleDeleteTask(tIdx)} 
                                  className="text-text-tertiary hover:text-error p-0.5 transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )
                          })}
                          
                          <button
                            onClick={() => handleAddTaskDirectly(pIdx)}
                            className="text-[10px] font-bold text-accent flex items-center gap-0.5 hover:underline"
                          >
                            <Plus className="h-3 w-3" /> Add Task
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* 4. Routines review */}
                <div className="space-y-3 pt-4 border-t-2 border-border border-dashed">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-text-secondary flex items-center gap-2">
                      <Clock className="h-4 w-4 text-accent" />
                      Weekly Routines & Commitments ({editableRoutines.length})
                    </h3>
                    <button 
                      onClick={handleAddRoutineDirectly} 
                      className="text-xs font-bold text-accent flex items-center gap-1 hover:underline"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Routine
                    </button>
                  </div>
                  <div className="space-y-2">
                    {editableRoutines.map((r, idx) => (
                      <div key={idx} className="flex gap-2 items-center p-2.5 border-2 border-border bg-bg rounded-sm animate-fade-in">
                        <span className="text-sm">{r.timeOfDay === 'morning' ? '🌅' : r.timeOfDay === 'afternoon' ? '☀️' : r.timeOfDay === 'evening' ? '🌆' : '🌙'}</span>
                        <input
                          type="text"
                          value={r.title}
                          onChange={(e) => handleEditRoutineText(idx, e.target.value)}
                          className="bg-transparent text-xs font-semibold flex-1 outline-none border-b border-transparent focus:border-accent focus:bg-surface px-1"
                        />
                        <select
                          value={r.timeOfDay}
                          onChange={(e) => handleEditRoutineTimeOfDay(idx, e.target.value)}
                          className="bg-surface text-[10px] font-extrabold uppercase font-mono border-2 border-border rounded-sm py-0.5 px-1 outline-none focus:border-accent cursor-pointer"
                        >
                          <option value="morning">Morning</option>
                          <option value="afternoon">Afternoon</option>
                          <option value="evening">Evening</option>
                          <option value="night">Night</option>
                        </select>
                        <div className="flex items-center gap-1 shrink-0">
                          <input
                            type="number"
                            value={r.durationMinutes}
                            onChange={(e) => handleEditRoutineDuration(idx, parseInt(e.target.value) || 0)}
                            className="w-16 bg-surface text-center text-xs font-mono font-bold border-2 border-border rounded-sm py-0.5 outline-none focus:border-accent"
                            min={1}
                          />
                          <span className="text-[10px] font-bold text-text-tertiary">min</span>
                        </div>
                        <button 
                          onClick={() => handleDeleteRoutine(idx)} 
                          className="text-text-tertiary hover:text-error p-1 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. Memories preview */}
                <div className="space-y-3 pt-4 border-t-2 border-border border-dashed">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-text-secondary flex items-center gap-2">
                      <Bot className="h-4 w-4 text-accent" />
                      AI Memory Profile
                    </h3>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 p-3 bg-bg-secondary rounded-sm border-2 border-dashed border-border text-xs leading-relaxed">
                    {editableMemories.map((m, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-surface border-2 border-border p-2 rounded-sm">
                        <div>
                          <p className="text-[9px] font-bold text-text-tertiary uppercase">{m.key.replace('user.', '')}</p>
                          <p className="font-semibold text-text-primary capitalize">{m.value}</p>
                        </div>
                        <Badge variant="default" className="text-[8px] tracking-widest uppercase">{m.memoryType}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Wizard Nav */}
              <div className="flex justify-between items-center pt-4 border-t-2 border-border">
                <Button onClick={() => setStep(STEP_AI_HELP)} variant="ghost" disabled={isSaving}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={saveOnboardingSetup} 
                  variant="primary" 
                  disabled={isSaving || editableGoals.length === 0}
                  className="px-8 font-extrabold py-5 neo-shadow-md"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Architecting DB...
                    </>
                  ) : (
                    <>
                      Confirm & Enter App
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

        </Card>
      </div>
    </div>
  )
}

function AppleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20.94c1.88-1.06 3.07-2.62 3.07-4.57 0-3.09-2.5-5.59-5.59-5.59S3.89 13.28 3.89 16.37c0 1.95 1.19 3.51 3.07 4.57" />
      <path d="M12 10.78a3.11 3.11 0 1 0 0-6.22 3.11 3.11 0 0 0 0 6.22z" />
      <path d="M9.41 16.37a2.59 2.59 0 1 1 5.18 0" />
    </svg>
  )
}
