---
slug: i-built-a-monitor-for-my-claude-code-sessions
title: I built a monitor for my Claude Code sessions
summary: Claude Code has no dashboard for multiple sessions. So I'm building one called Claudemon.
tags: [claude-code, claudemon, observability, building]
status: published
published_at: 2026-04-07
---

At any given time I've got like 3-5 Claude Code sessions running across different projects. One on a side project, one doing a refactor I kicked off before dinner, one on something else I already forgot about. And I have no idea what any of them are doing.

Claude Code doesn't have a dashboard. There's no "here's what all your agents are up to" view. You get one terminal per session. If you're not staring at it, you're blind.

So I started building something. I'm calling it Claudemon.

It monitors all your active Claude Code sessions from one place. Think Activity Monitor but for AI coding agents. From any browser, my phone, my iPad, whatever. I can see which sessions are active, what tools they're calling, token usage and cost in real time, and whether a session is stuck or actually making progress.

Still very much a work in progress. I'll be sharing screen recordings soon because some of the UI is stuff I haven't seen anyone else build for Claude Code and I think people will find it useful.

The real reason I started building it? I wanted to understand the internals of Claude Code. When you use CC every single day you start to notice patterns. Sessions that burn through tokens on file reads because they're searching for something they should already know. Sessions that get stuck in retry loops. Sessions that are weirdly efficient because the initial prompt happened to give perfect context.

But I couldn't _see_ any of this without instrumenting it. CC's session data is all there, it logs everything locally. The JSONL files in `~/.claude/projects/` are a goldmine. Nobody's building the observability layer on top though.

So I am.

Some things I've learned so far:

Sessions are surprisingly bursty. Nothing for 30 seconds, then 15 tool calls in 10 seconds. Once you see the rhythm you start writing better prompts because you can tell when CC is planning vs executing.

Cost correlates with context, not complexity. The expensive sessions aren't doing hard things. They're the ones where Claude keeps re-reading files because the initial prompt was too vague. Vague instructions are literally more expensive. (This connects to my specific todos thing from last post.)

The tool call distribution tells you everything. Healthy session: a few reads, burst of writes, bash command to test. Struggling session: read read read read read with no writes. If you see that pattern, your prompt was bad.

Everyone writes about prompting. How to talk to AI. Almost nobody writes about observing. How to understand what your agents are actually doing once you let them loose. You wouldn't deploy a production service without monitoring. Why are we running AI coding agents without it?

More posts coming on specific things I've found in the data. And yeah, screen recordings incoming.
