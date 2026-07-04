import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { aiClient } from '@/services/ai/client'

// Pre-defined premium templates for popular goals
const GOAL_TEMPLATES: Record<string, {
  goal: { title: string; description: string; level: 'long_term' }
  roadmaps: { title: string; description: string }[]
  tasks: { title: string; description: string; estimatedMinutes: number }[]
}> = {
  "Crack GATE": {
    goal: { title: "Secure a Top Rank in the GATE Exam", description: "Master core engineering subjects, solve mock papers, and qualify for premium PSU/Postgrad opportunities.", level: "long_term" },
    roadmaps: [{ title: "GATE Subject-Wise Practice & Prep", description: "Systematic revision of technical subjects and engineering mathematics." }],
    tasks: [
      { title: "Review previous year's GATE syllabus and weightage", description: "Analyze high-weightage topics and core subjects.", estimatedMinutes: 90 },
      { title: "Draft a 12-week GATE study timeline", description: "Map out study hours, revision slots, and full-length test dates.", estimatedMinutes: 60 },
      { title: "Attempt first diagnostic GATE mock test", description: "Assess current baseline scoring and identify areas of improvement.", estimatedMinutes: 180 }
    ]
  },
  "Prepare for GRE": {
    goal: { title: "Target 325+ in GRE & Secure University Admits", description: "Master GRE Verbal reasoning, quantitative analysis, and analytical writing.", level: "long_term" },
    roadmaps: [{ title: "GRE Verbal & Quant Mastery", description: "Study prep materials, practice flashcards, and solve quantitative grids." }],
    tasks: [
      { title: "Solve GRE diagnostic quant & verbal sets", description: "Determine current scoring range and review errors.", estimatedMinutes: 120 },
      { title: "Study 50 high-frequency GRE vocabulary words", description: "Learn context and sentences for advanced words.", estimatedMinutes: 45 },
      { title: "Outline GRE essay formats & read sample responses", description: "Understand scoring criteria for AWA.", estimatedMinutes: 60 }
    ]
  },
  "Become Software Engineer": {
    goal: { title: "Become a Full-Stack Software Engineer", description: "Master computer science fundamentals, full-stack technologies, and systems architecture.", level: "long_term" },
    roadmaps: [{ title: "Full-Stack Portfolio Roadmap", description: "Design, build, and deploy a responsive web application." }],
    tasks: [
      { title: "Select portfolio roadmap stack & draft tech specs", description: "Decide database, framework (e.g. Next.js), and core features.", estimatedMinutes: 60 },
      { title: "Setup codebase repository and configure initial dependencies", description: "Initialize Git and test connection to database.", estimatedMinutes: 45 },
      { title: "Build core landing page UI with Tailwind and Lucide icons", description: "Create a modern, clean, and responsive landing interface.", estimatedMinutes: 120 }
    ]
  },
  "Become Product Manager": {
    goal: { title: "Transition into Product Management", description: "Master product discovery, roadmap prioritization, and stakeholder communication.", level: "long_term" },
    roadmaps: [{ title: "Product Case Study Portfolio", description: "Research, analyze, and write a complete product teardown and feature spec." }],
    tasks: [
      { title: "Select target product for the case study teardown", description: "Pick a product you use daily with obvious feature opportunities.", estimatedMinutes: 60 },
      { title: "Conduct user feedback research & compile paint points", description: "Interview 3 users or analyze app store reviews for feedback.", estimatedMinutes: 120 },
      { title: "Draft Feature PRD (Product Requirements Document)", description: "Define goals, user stories, success metrics, and MVP scope.", estimatedMinutes: 180 }
    ]
  },
  "Become Data Scientist": {
    goal: { title: "Become a Proficient Data Scientist", description: "Master statistics, machine learning algorithms, and data visualization.", level: "long_term" },
    roadmaps: [{ title: "Predictive Analytics Roadmap", description: "Clean data, build models, and deploy a interactive data dashboard." }],
    tasks: [
      { title: "Select dataset from Kaggle and define predicting goal", description: "Understand data fields and prepare clean target variables.", estimatedMinutes: 60 },
      { title: "Write Python scripts for exploratory data analysis (EDA)", description: "Generate correlation matrices, histograms, and summary stats.", estimatedMinutes: 120 },
      { title: "Build and train initial random forest classifier model", description: "Evaluate model using precision, recall, and F1 scores.", estimatedMinutes: 90 }
    ]
  },
  "Become Designer": {
    goal: { title: "Become a Professional UI/UX Designer", description: "Master Figma, typography, visual hierarchies, and user research.", level: "long_term" },
    roadmaps: [{ title: "Mobile App Redesign Portfolio", description: "Select a popular app and completely rebuild its user experience." }],
    tasks: [
      { title: "Conduct heuristic evaluation of current app flows", description: "Identify navigation hurdles and usability friction points.", estimatedMinutes: 90 },
      { title: "Create low-fidelity wireframes in Figma", description: "Map out key screens and user navigation flow.", estimatedMinutes: 120 },
      { title: "Develop high-fidelity UI library & component states", description: "Define custom colors, type scales, and button variations.", estimatedMinutes: 180 }
    ]
  },
  "Build Startup": {
    goal: { title: "Build and Launch a Scalable Tech Startup", description: "Validate a business model, launch an MVP, and acquire initial customer segments.", level: "long_term" },
    roadmaps: [{ title: "Startup Customer Validation Phase", description: "Identify core target personas and conduct validation interviews." }],
    tasks: [
      { title: "Draft Lean Canvas and define value proposition", description: "Outline problem, solution, customer segments, and revenue streams.", estimatedMinutes: 60 },
      { title: "Schedule and conduct 5 customer problem interviews", description: "Validate if target users suffer from the hypothesized pain points.", estimatedMinutes: 180 },
      { title: "Create a simple landing page to capture email signups", description: "Describe value proposition and add waitlist form.", estimatedMinutes: 120 }
    ]
  },
  "Launch MVP": {
    goal: { title: "Launch Minimum Viable Product to Market", description: "Build the most vital features and release them to collect early feedback.", level: "long_term" },
    roadmaps: [{ title: "MVP Core Feature Buildout", description: "Develop and deploy the single most valuable workflow." }],
    tasks: [
      { title: "Define strict MVP feature boundaries", description: "List must-haves and push nice-to-haves to v2.", estimatedMinutes: 45 },
      { title: "Build core authentication and workspace dashboard", description: "Ensure user login and base state works securely.", estimatedMinutes: 180 },
      { title: "Deploy MVP application to hosting platform (Vercel/Fly.io)", description: "Test live performance and database connections.", estimatedMinutes: 60 }
    ]
  },
  "Save Money": {
    goal: { title: "Optimize Personal Budget & Save $10k+", description: "Establish strict expense budgets, reduce waste, and build emergency cash reserve.", level: "long_term" },
    roadmaps: [{ title: "Expense Audit & Subscriptions Trim", description: "Audit bank statements and eliminate unnecessary expenditures." }],
    tasks: [
      { title: "Download and analyze past 3 months of bank statements", description: "Categorize spending into food, rent, entertainment, etc.", estimatedMinutes: 120 },
      { title: "Cancel unused subscriptions and recurring charges", description: "Review app store, streaming, and premium services.", estimatedMinutes: 30 },
      { title: "Establish weekly discretionary spending allowance", description: "Set up warning limits and transfer savings automatically.", estimatedMinutes: 45 }
    ]
  },
  "Invest": {
    goal: { title: "Build a Diverse Investment Portfolio", description: "Allocate assets across stocks, index funds, and alternative holdings.", level: "long_term" },
    roadmaps: [{ title: "Investment Allocation Plan", description: "Define risk profile and construct automated index fund transfers." }],
    tasks: [
      { title: "Determine personal risk tolerance and asset targets", description: "Choose equity, debt, and cash split.", estimatedMinutes: 45 },
      { title: "Set up brokerage account and automatic recurring transfers", description: "Enable automated monthly index fund purchases.", estimatedMinutes: 60 },
      { title: "Read 3 core chapters of 'The Simple Path to Wealth'", description: "Align on long-term buy-and-hold investing philosophy.", estimatedMinutes: 120 }
    ]
  },
  "Become Financially Independent": {
    goal: { title: "Achieve Financial Independence & Retire Early", description: "Build assets yielding passive income sufficient to cover all living expenses.", level: "long_term" },
    roadmaps: [{ title: "FIRE Roadmap & Asset Goal Setup", description: "Calculate net worth targets and establish passive income streams." }],
    tasks: [
      { title: "Calculate FIRE Number based on annual expenses", description: "Apply 25x rule to yearly budget requirements.", estimatedMinutes: 60 },
      { title: "Audit current net worth and list active/passive assets", description: "Outline debts, properties, and brokerage balances.", estimatedMinutes: 90 },
      { title: "Identify secondary passive income side-hustle channels", description: "Evaluate digital products, SaaS, or dividend portfolios.", estimatedMinutes: 120 }
    ]
  },
  "Lose Weight": {
    goal: { title: "Reach Target Body Fat % & Build Vitality", description: "Establish caloric deficit, clean nutrition, and consistent training habits.", level: "long_term" },
    roadmaps: [{ title: "Daily Calorie Budget & Meal Planning", description: "Establish exact macro-nutritional goals and meal plan structure." }],
    tasks: [
      { title: "Calculate Total Daily Energy Expenditure (TDEE)", description: "Define daily target calorie deficit (e.g. 500 kcal limit).", estimatedMinutes: 30 },
      { title: "Design standard healthy weekly meal plan", description: "Pre-plan high-volume, nutrient-dense whole food options.", estimatedMinutes: 60 },
      { title: "Clear kitchen pantry of processed snacks and sweets", description: "Remove distractions from the environment.", estimatedMinutes: 30 }
    ]
  },
  "Gain Muscle": {
    goal: { title: "Build Lean Muscle Mass & Strength", description: "Execute progressive resistance training and optimize protein intake.", level: "long_term" },
    roadmaps: [{ title: "Strength Training Splits & Progress Log", description: "Design a 4-day compound weight lifting program." }],
    tasks: [
      { title: "Select strength training split (e.g. Upper/Lower, PPL)", description: "Decide weekly schedule and workout exercises.", estimatedMinutes: 45 },
      { title: "Calculate daily protein intake requirement", description: "Aim for 1.6g - 2.2g of protein per kg of body weight.", estimatedMinutes: 15 },
      { title: "Record baseline weights for bench, squat, and deadlift", description: "Establish progressive overload targets.", estimatedMinutes: 60 }
    ]
  },
  "Improve Fitness": {
    goal: { title: "Enhance Cardiovascular Fitness & Health", description: "Improve VO2 max, muscular endurance, and active mobility.", level: "long_term" },
    roadmaps: [{ title: "Cardio & Mobility Consistency Plan", description: "Schedule running, swimming, and flexibility sessions." }],
    tasks: [
      { title: "Design a 3-workout weekly cardio schedule", description: "Include Zone 2 base runs and one HIIT session.", estimatedMinutes: 45 },
      { title: "Create a 15-minute daily morning mobility routine", description: "Focus on hip, thoracic spine, and shoulder range of motion.", estimatedMinutes: 30 },
      { title: "Take base resting heart rate (RHR) and record weight", description: "Set baseline metrics for monthly cardio tracking.", estimatedMinutes: 20 }
    ]
  },
  "Read More Books": {
    goal: { title: "Build Consistent Reading & Knowledge Systems", description: "Read 24+ books yearly across diverse genres.", level: "long_term" },
    roadmaps: [{ title: "Annual Reading Challenge setup", description: "Curate book lists and structure note-taking layouts." }],
    tasks: [
      { title: "Select first 3 non-fiction books for the quarter", description: "Acquire copies or add to digital reader.", estimatedMinutes: 30 },
      { title: "Designate a dedicated 30-minute daily reading slot", description: "Usually first thing in the morning or before bed.", estimatedMinutes: 15 },
      { title: "Setup book notes repository in journal folder", description: "Create template for summaries and action items.", estimatedMinutes: 30 }
    ]
  },
  "Learn AI": {
    goal: { title: "Master Practical Artificial Intelligence & LLMs", description: "Understand prompt engineering, transformer models, and AI integrations.", level: "long_term" },
    roadmaps: [{ title: "AI Application Build & Prompts Lab", description: "Create custom GPT agents and API integrations." }],
    tasks: [
      { title: "Take introductory course on Large Language Models (LLMs)", description: "Understand vectors, attention mechanism, and generation parameters.", estimatedMinutes: 90 },
      { title: "Practice structured prompt engineering techniques", description: "Learn few-shot prompting, chain-of-thought, and system instructions.", estimatedMinutes: 60 },
      { title: "Build a node script calling the Gemini API", description: "Test custom system prompts and text generation locally.", estimatedMinutes: 120 }
    ]
  },
  "Learn Programming": {
    goal: { title: "Master Modern Coding and Web Development", description: "Develop logical thinking, master JavaScript/TypeScript, and build web roadmaps.", level: "long_term" },
    roadmaps: [{ title: "Programming Fundamentals Lab", description: "Write scripts, solve algorithms, and understand core language syntax." }],
    tasks: [
      { title: "Complete introductory JavaScript lessons and variables", description: "Learn arrays, objects, functions, and control flow.", estimatedMinutes: 90 },
      { title: "Build a simple interactive HTML/JS calculator", description: "Implement DOM manipulation and event handlers.", estimatedMinutes: 120 },
      { title: "Solve 5 basic algorithmic challenges on freeCodeCamp", description: "Practice logic and string/array manipulations.", estimatedMinutes: 60 }
    ]
  },
  "Improve Productivity": {
    goal: { title: "Master Personal Organization & Output", description: "Implement time-blocking, task management frameworks, and prevent procrastination.", level: "long_term" },
    roadmaps: [{ title: "Productivity System Setup", description: "Configure calendar view, task pipelines, and review habits." }],
    tasks: [
      { title: "Implement Time Blocking in daily routine", description: "Divide day into color-coded deep focus and admin segments.", estimatedMinutes: 45 },
      { title: "Establish standard Sunday Weekly Review routine", description: "Define template for auditing incomplete tasks and next priorities.", estimatedMinutes: 30 },
      { title: "Install website blockers and filter social media notifications", description: "Reduce environmental friction during focus blocks.", estimatedMinutes: 30 }
    ]
  }
}

// GET onboarding status
export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'userId is required' } },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { onboardingCompleted: true },
    })

    return NextResponse.json({
      data: {
        onboardingCompleted: user?.onboardingCompleted ?? false,
      },
    })
  } catch (error) {
    return NextResponse.json({ data: { onboardingCompleted: false } })
  }
}

// POST onboarding actions
export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json()
    const { action, userId, answers } = body

    if (!action) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'action is required' } },
        { status: 400 }
      )
    }

    // ACTION: ANALYZE - Generate onboarding workspace recommendations
    if (action === 'analyze') {
      if (!answers) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: 'answers is required for analyze action' } },
          { status: 400 }
        )
      }

      const { goals = [], customGoals = [], lifeStage = 'general', commitments = [], focusedHours = '2–4 hours', aiRole = 'Mix of Everything (Recommended)' } = answers as {
        goals?: string[]
        customGoals?: string[]
        lifeStage?: string
        commitments?: string[]
        focusedHours?: string
        aiRole?: string
      }

      const allGoalsList = [...goals, ...customGoals]

      // Call AI to personalize if key is configured, otherwise fallback to premium mock
      let aiResultStr: string | null = null
      
      const apiKey = process.env.OPENROUTER_API_KEY || ''
      const isApiKeyPlaceholder = apiKey.includes('your-key-here') || apiKey === ''

      if (!isApiKeyPlaceholder) {
        try {
          const prompt = `You are the AI Chief of Staff for a Life Operating System (LifeOS).
Based on the following user details, construct a premium, highly personalized, realistic workspace layout.
Details:
- Stage of Life: ${lifeStage}
- Core Commitments: ${commitments.join(', ')}
- Daily Focused Hours Available: ${focusedHours}
- Preferred AI Helper Style: ${aiRole}
- Selected Goals: ${goals.join(', ')}
- Custom Goals: ${customGoals.join(', ')}

Return a JSON object conforming exactly to this structure:
{
  "goals": [
    { "title": "A strong, action-oriented goal title", "description": "Compelling explanation of why and what this goal achieves", "level": "long_term" }
  ],
  "roadmaps": [
    { "title": "A roadmap title that supports a goal", "description": "Details of the roadmap deliverables", "goalIndex": 0 }
  ],
  "tasks": [
    { "title": "Specific, actionable task title", "description": "Instructions for completion", "estimatedMinutes": 60, "roadmapIndex": 0 }
  ],
  "routines": [
    { "title": "Routine block title (e.g. Morning Workout, Deep Work focus block)", "description": "Brief instruction", "timeOfDay": "morning / afternoon / evening", "durationMinutes": 60 }
  ],
  "memories": [
    { "key": "user.facts.life_stage", "value": "${lifeStage}", "memoryType": "fact" },
    { "key": "user.preferences.ai_role", "value": "${aiRole}", "memoryType": "preference" },
    { "key": "user.patterns.focused_hours", "value": "${focusedHours}", "memoryType": "pattern" },
    { "key": "user.facts.commitments", "value": "${commitments.join(', ')}", "memoryType": "fact" }
  ]
}

Ensure all roadmapIndices and goalIndices are correctly mapped numbers (0-indexed). Create 1-2 goals, 1-2 roadmaps per goal, 2-3 tasks per roadmap, and 2-3 routines that fit their routine commitments. Return ONLY raw JSON. No markdown backticks, no triple quotes.`

          aiResultStr = await aiClient.gateway(userId, {
            taskType: 'large',
            prompt,
            systemPrompt: 'You are an onboarding assistant returning strict JSON matching the requested schema.'
          })
        } catch (e) {
          console.warn('AI compilation failed, falling back to local builder:', e)
        }
      }

      let parsedPayload: any = null

      if (aiResultStr) {
        try {
          const cleaned = aiResultStr.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
          parsedPayload = JSON.parse(cleaned)
        } catch (e) {
          console.warn('Failed to parse AI JSON response, falling back to local builder:', e)
        }
      }

      // High-quality local builder fallback
      if (!parsedPayload) {
        const generatedGoals: any[] = []
        const generatedRoadmaps: any[] = []
        const generatedTasks: any[] = []
        const generatedRoutines: any[] = []
        const generatedMemories: any[] = [
          { key: 'user.facts.life_stage', value: lifeStage, memoryType: 'fact' },
          { key: 'user.preferences.ai_role', value: aiRole, memoryType: 'preference' },
          { key: 'user.patterns.focused_hours', value: focusedHours, memoryType: 'pattern' },
          { key: 'user.facts.commitments', value: commitments.join(', '), memoryType: 'fact' }
        ]

        // Populate goals based on choices
        allGoalsList.forEach((goalTitle, gIdx) => {
          const template = GOAL_TEMPLATES[goalTitle]
          if (template) {
            generatedGoals.push({
              title: template.goal.title,
              description: template.goal.description,
              level: template.goal.level
            })
            
            // Map roadmaps
            const currentGoalIndex = generatedGoals.length - 1
            template.roadmaps.forEach((proj, pIdx) => {
              generatedRoadmaps.push({
                title: proj.title,
                description: proj.description,
                goalIndex: currentGoalIndex
              })

              const currentRoadmapIndex = generatedRoadmaps.length - 1
              template.tasks.forEach((tsk) => {
                generatedTasks.push({
                  title: tsk.title,
                  description: tsk.description,
                  estimatedMinutes: tsk.estimatedMinutes,
                  roadmapIndex: currentRoadmapIndex
                })
              })
            })
          } else {
            // Dynamic custom goal generator
            generatedGoals.push({
              title: goalTitle,
              description: `Structured roadmap to successfully complete: "${goalTitle}"`,
              level: 'long_term'
            })

            const currentGoalIndex = generatedGoals.length - 1
            generatedRoadmaps.push({
              title: `Milestone Phase 1: ${goalTitle}`,
              description: `Initial planning, validation and foundational setups.`,
              goalIndex: currentGoalIndex
            })

            const currentRoadmapIndex = generatedRoadmaps.length - 1
            generatedTasks.push(
              {
                title: `Formulate 12-week roadmap for: ${goalTitle}`,
                description: `Define checkpoints, key objectives, and weekly habits.`,
                estimatedMinutes: 60,
                roadmapIndex: currentRoadmapIndex
              },
              {
                title: `List primary learning resources and tools required for: ${goalTitle}`,
                description: `Identify books, courses, equipment or tools to help you "${goalTitle}".`,
                estimatedMinutes: 45,
                roadmapIndex: currentRoadmapIndex
              }
            )
          }
        })

        // Generate Routines based on Commitments
        commitments.forEach((comm) => {
          if (comm === 'Gym' || comm === 'Sports') {
            generatedRoutines.push({
              title: `${comm} Fitness Routine`,
              description: 'Consistent daily workout or training session for physical wellness.',
              timeOfDay: 'morning',
              durationMinutes: 60
            })
          } else if (comm === 'Job' || comm === 'Startup' || comm === 'Business') {
            generatedRoutines.push({
              title: `Focused ${comm} Session`,
              description: 'Deep focus time block dedicated to professional advancement.',
              timeOfDay: 'afternoon',
              durationMinutes: 180
            })
          } else if (comm === 'School' || comm === 'College' || comm === 'Coaching') {
            generatedRoutines.push({
              title: `Lectures & Study Session`,
              description: 'Attending lectures, taking core notes, and completing assignments.',
              timeOfDay: 'morning',
              durationMinutes: 240
            })
          } else if (comm === 'Family Responsibilities') {
            generatedRoutines.push({
              title: 'Family Quality Time',
              description: 'Relaxed connection, dining, and assisting with family chores.',
              timeOfDay: 'evening',
              durationMinutes: 90
            })
          } else if (comm === 'Freelancing') {
            generatedRoutines.push({
              title: 'Freelance Deep Work Block',
              description: 'Working on client deliverables and pitching active proposals.',
              timeOfDay: 'evening',
              durationMinutes: 120
            })
          }
        })

        // Add standard fallback if lists are empty
        if (generatedGoals.length === 0) {
          generatedGoals.push({
            title: "Achieve Personal Excellence",
            description: "Personal focus plan to establish routines, productivity habits, and work systems.",
            level: "long_term"
          })
          generatedRoadmaps.push({
            title: "Workspace Configuration",
            description: "Customize filters, dashboards, and settings.",
            goalIndex: 0
          })
          generatedTasks.push({
            title: "Set up LifeOS morning routine checklist",
            description: "Configure habits and tasks for active daily checkins.",
            estimatedMinutes: 30,
            roadmapIndex: 0
          })
        }

        parsedPayload = {
          goals: generatedGoals,
          roadmaps: generatedRoadmaps,
          tasks: generatedTasks,
          routines: generatedRoutines,
          memories: generatedMemories
        }
      }

      return NextResponse.json({ data: parsedPayload })
    }

    // ACTION: COMPLETE - Save edited onboarding data in a transactional batch
    if (action === 'complete') {
      if (!userId || !body.data) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: 'userId and data object are required for complete action' } },
          { status: 400 }
        )
      }

      const { goals = [], roadmaps = [], tasks = [], routines = [], memories = [], lifeStage = 'general', focusedHours = '2-4 hours', aiRole = 'Mix of Everything' } = body.data

      // Create transaction
      const transactionResult = await prisma.$transaction(async (tx) => {
        // 1. Create Goals Concurrently
        const createdGoals = await Promise.all(
          goals.map((g: any) =>
            tx.goal.create({
              data: {
                userId,
                title: g.title,
                description: g.description || '',
                level: g.level || 'long_term',
                status: 'active',
                priority: 3,
              }
            })
          )
        )

        // 2. Create Roadmaps Concurrently
        const createdRoadmaps = await Promise.all(
          roadmaps.map((p: any) => {
            const associatedGoalId = p.goalIndex !== undefined && p.goalIndex < createdGoals.length 
              ? createdGoals[p.goalIndex].id 
              : null

            return tx.roadmap.create({
              data: {
                userId,
                title: p.title,
                description: p.description || '',
                status: 'planning',
                priority: 3,
                goalId: associatedGoalId
              }
            })
          })
        )

        // 3. Create Roadmap Steps Concurrently
        const createdStepsPromise = Promise.all(
          tasks.map((t: any, idx: number) => {
            const associatedProj = t.roadmapIndex !== undefined && t.roadmapIndex < createdRoadmaps.length
              ? createdRoadmaps[t.roadmapIndex]
              : null
            
            if (!associatedProj) return null

            return tx.roadmapStep.create({
              data: {
                roadmapId: associatedProj.id,
                title: t.title,
                description: t.description || '',
                order: idx + 1,
                isCompleted: false
              }
            })
          }).filter(Boolean)
        )

        // 4. Create Routines Concurrently
        const createdRoutinesPromise = Promise.all(
          routines.map((r: any) =>
            tx.routine.create({
              data: {
                userId,
                title: r.title,
                description: r.description || '',
                routineType: r.timeOfDay || 'flexible',
                timeOfDay: r.timeOfDay === 'morning' ? '08:00' : r.timeOfDay === 'afternoon' ? '14:00' : r.timeOfDay === 'evening' ? '19:00' : '09:00',
                durationMinutes: r.durationMinutes || 60,
                isFlexible: true,
                status: 'active'
              }
            })
          )
        )

        // 5. Upsert Memories Concurrently
        const upsertedMemoriesPromise = Promise.all(
          memories.map((m: any) =>
            tx.aIMemory.upsert({
              where: { userId_key: { userId, key: m.key } },
              update: { value: m.value, memoryType: m.memoryType || 'fact', confidence: 1.0 },
              create: { userId, key: m.key, value: m.value, memoryType: m.memoryType || 'fact', confidence: 1.0 }
            })
          )
        )

        // Await all independent child insertions in parallel
        await Promise.all([createdStepsPromise, createdRoutinesPromise, upsertedMemoriesPromise])

        // 6. Update User Preferences & Onboarding Completed Status
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            onboardingCompleted: true,
            preferences: {
              lifeStage,
              focusedHours,
              aiRole,
            }
          }
        })

      }, {
        timeout: 20000
      })

      return NextResponse.json({ data: transactionResult })
    }

    return NextResponse.json(
      { error: { code: 'INVALID_ACTION', message: 'Action not supported' } },
      { status: 400 }
    )
  } catch (error) {
    console.error('Onboarding POST failed:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to process onboarding action' } },
      { status: 500 }
    )
  }
}
