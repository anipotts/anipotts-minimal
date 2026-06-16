---
slug: saturdays-are-for-claude-code
title: saturdays are for claude code
summary: business insider interviewed me about ai usage limits. the useful part was less the quote and more the workflow it forced.
tags: [claude-code, press, workflow, building]
status: published
published_at: 2026-04-13
---

A reporter from Business Insider reached out a couple weeks ago. He was writing about how usage limits on AI tools are changing the way people work. Somebody pointed him to me because I've been pretty vocal about how I use Claude Code. The article went live today: [Saturdays are for Claude: How AI limits are reshaping the workday](https://www.businessinsider.com/ai-usage-limits-causing-some-to-restructure-their-workday-2026-4).

He nailed the broad strokes. I do plan my work around session limits. I do save the hardest tasks for when I'm far from the cap. And yes, Saturdays are for Claude Code. That quote is real. My friends think I'm joking when I say that. I'm not.

But there's stuff the article couldn't capture because it's a 1200-word piece about multiple people, not a deep dive on one workflow.

## The actual numbers

I track everything. Every session, every tool call, every dollar.

My median Claude Code session runs about 31 minutes wall clock. But Claude is only _actively working_ for about 15 of those minutes. The rest is me: reading diffs, making decisions, approving tool calls. The bottleneck is never the AI. It's me.

Active tool rate holds steady at about 3.3 calls per minute for any session over 10 minutes. Claude doesn't slow down in long sessions. I do. Wall-time tool rate drops 8.8x from short sessions to marathons. That's 100% human idle time.

Sessions under 30 minutes are the sweet spot. Past an hour, more than half hit context limits and need compaction. That's when you lose coherence. So the usage limit forcing you to stop isn't just about tokens. It's preventing the session quality degradation that happens naturally anyway.

You can see all of this on [my Claude stats page](/claude). It's live, updated from my actual session logs.

## Why the limit is a feature

The article framed limits as a constraint. And for the other people interviewed, it clearly is. One guy described panic when his team hits the cap. I get that.

But for me, the forced pause has become genuinely useful. When I hit the limit I stop and review. Not because I want to. Because I have to. And every time, I catch something I would have missed if I'd kept going. A file I over-abstracted. A test I forgot. An approach that's working but not the right one.

The best sessions aren't the ones where Claude runs the longest. They're the ones where I front-loaded the context, kept the scope tight, and let it execute a focused plan. You learn that pretty fast when sessions cost real money (or cap your allowance).

## What I'm building with it

I've logged over 1,000 hours of Claude Code across 600+ sessions. Right now I'm running 5 Claude Code sessions across different projects in a given week. The admin dashboard for this site, a quantitative interview prep app, a Mac Mini monitoring system, and open source tooling for other Claude Code users. I built [Claudemon](/thoughts/i-built-a-monitor-for-my-claude-code-sessions) to watch all of them from one place.

The irony of getting interviewed about usage limits is that my entire workflow is designed to be maximally efficient with those limits. Specific prompts. Tight session scopes. [End-of-day todos written as agent instructions](/thoughts/stop-ending-your-day-with-fix-the-bug). Parallel agents in worktrees. None of this is because I'm trying to game the system. It's because it produces better code.

The limits just made me figure that out faster.
