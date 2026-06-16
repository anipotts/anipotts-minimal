---
title: quantercise
subtitle: quant prep with postgres, drizzle, stripe, and sandboxed python grading.
description: Built a quant interview prep app with 400+ problems, a Python editor, KaTeX math rendering, instant grading, and user progress. Next.js, TypeScript, Postgres, Drizzle, Stripe, and sandboxed Python grading.
year: "2024-"
category: product
role: Founder and Engineer
duration: Ongoing
status: live
featured: true
sort_order: 100
link_live: https://quantercise.com
tags: [Next.js, TypeScript, Postgres, Drizzle, Stripe, Python]
technical:
  - title: Stack Evolution
    content: Started as a MERN stack app, migrated to Next.js 15 with React 19 for better DX and performance. Backend runs on AWS Lambda for sandboxed Python execution, with Aurora Postgres for problem storage. Recently completed a migration from Aurora to Neon for cost optimization and better serverless compatibility.
  - title: Problem Engine
    content: Problems support 5 answer types. Numeric with tolerance, exact string matching, single-choice MCQ, multi-choice MCQ, and Python coding challenges. Answer specifications are stored server-side only to prevent cheating. The grading system runs entirely on Lambda with isolated execution contexts.
  - title: Editor and Math Rendering
    content: Monaco Editor powers the Python coding experience with syntax highlighting and autocomplete. KaTeX handles mathematical notation rendering across all problems. Both integrate cleanly with the Next.js App Router through client components.
  - title: Gamification
    content: Points system awards 10/20/30 for easy/medium/hard problems with first-attempt bonuses. Daily streak tracking with 24-hour grace period. Leaderboards support daily, weekly, and all-time periods. User stats track progress by difficulty level.
roadmap:
  - { text: "Aurora to Neon migration", status: done }
  - { text: "Public user profiles", status: done }
  - { text: "Chrome extension for mental math drills", status: done }
  - { text: "CLI for terminal-based practice", status: in-progress }
  - { text: "Fix LaTeX parsing edge cases", status: in-progress }
  - { text: "Polish coding problems (NumPy, SciPy)", status: in-progress }
  - { text: "Open source core platform", status: planned }
  - { text: "Firm-specific problem packs", status: planned }
---

Quantercise started as my own quant interview prep tool and turned into a full product: 400+ problems, real-time Python execution, math rendering, progress tracking, and payments.
