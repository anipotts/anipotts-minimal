---
slug: stop-ending-your-day-with-fix-the-bug
title: stop ending your day with "fix the bug"
summary: vague todos waste context. specific prompts let claude code start from the right file.
tags: [claude-code, productivity, ai-tools]
status: published
published_at: 2026-04-07
---

I used to end my day with todos like "fix auth" and "clean up API" and then wake up the next morning having no idea what I actually meant.

Fix auth how? Which auth? The login flow? The token refresh? The middleware? I'd spend the first 20 minutes of my next session just rebuilding the context I had the night before.

This is 10x worse with Claude Code. When you hand a vague todo to an AI coding agent, it doesn't just lose context. It actively goes searching for context. And that search costs tokens, time, and often sends the session in the wrong direction entirely.

So I started writing specific todos. Not "fix auth" but "the /api/auth/refresh endpoint returns 401 when the token has more than 2 hours left. Check the expiry comparison in middleware/auth.ts line 47. The gte should probably be lte."

The difference is night and day. A vague prompt means Claude Code will: read your entire auth directory, grep for related tests, maybe check your git log, read 4-5 files trying to understand the system, then ask you a clarifying question anyway. That's 30+ tool calls before any actual work happens.

A specific prompt means it opens the one file, goes to the line, sees the issue, fixes it, runs the test. Done in under 10 tool calls.

I started doing this for everything. Instead of "add dark mode" I write "add a dark mode toggle to the settings page. Use the existing ThemeContext in src/contexts/theme.tsx. The toggle should go in the appearance section of SettingsPanel.tsx after the font size selector. Store preference in localStorage key 'theme-preference'."

It takes me maybe 2 extra minutes to write a specific todo at the end of a session. But it saves 10+ minutes of wasted context-building at the start of the next one. And with Claude Code, those saved minutes are also saved dollars because every file read and grep is a tool call that costs tokens.

The real unlock: I started writing these specific todos AS the last message in my Claude Code session before I close it. So when I resume the session the next day, Claude already has the specific context loaded. No preamble needed. It just starts working.

Your end-of-day todo is a prompt for tomorrow's AI agent. Write it like one.
