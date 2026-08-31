---
title: systems
description: "a personal map for noticing what matters, organizing context, and deciding what agents can watch, prepare, or act on with me."
hero_title: systems
hero_summary: "i keep a map of the work, people, plans, ideas, and responsibilities moving through my life. it helps me see what matters, decide what needs me, and let agents help with the rest."
map_label: how it moves
map_principle: "this map shows what agents can notice, watch, prepare, act on, check, and record, and where they work on their own, with me, or through a mix of both."
map_domains:
  - label: career
    children:
      - projects
      - applications
      - content
  - label: learning
    children:
      - school
      - research
      - skills
  - label: wellbeing
    children:
      - health
      - routines
      - energy
  - label: personal
    children:
      - plans + trips
      - family + friends
      - people i know online
map_nodes:
  - id: life
    label: attention loop
    title: life brings things into view
    detail: career, learning, wellbeing, and personal life keep giving me things to notice.
    items: []
  - id: snap_store
    label: snap + store
    title: capture what matters
    detail: thoughts, plans, and things i save get a place to land before they disappear.
    items:
      - journal
      - notes + reminders
      - saved posts + articles
      - videos + watch history
  - id: admin
    label: my private dashboard
    title: admin.anipotts.com
    detail: one view of what changed, what needs me, and what can keep moving.
    items:
      - gated by cloudflare access
  - id: ani
    label: execution loop
    title: ani
    detail: i decide what needs my judgment and what can keep moving.
    items: []
  - id: agents
    label: agents
    title: codex + claude code
    detail: each agent gets one clear job and only the context it needs.
    items:
      - codex
      - claude code
  - id: work
    label: inside the loop
    title: watch · prepare · act
    detail: the job moves as far as i have said it can.
    items: []
  - id: record
    label: returns
    title: check + record
    detail: what happened, what changed, and what still needs me.
    items: []
map_foundation_label: what keeps the context grounded
map_foundations:
  - id: calendar
    title: calendar
    detail: starts scheduled checks
  - id: github
    title: github
    detail: keeps project history
  - id: mac_mini
    title: mac mini
    detail: recent context, kept local
  - id: external_ssd
    title: external ssd
    detail: long-term archive, planned
map_authority_label: how work moves
map_authority_modes:
  - id: own
    label: on its own
    detail: clear work that is easy to undo
  - id: with_me
    label: with me
    detail: judgment, permission, or a real consequence
  - id: mixed
    label: a mix of both
    detail: agents prepare, i decide, agents continue
map_relationships:
  - id: life_to_snap
    source: life
    destination: snap_store
    authority: mixed
    detail: things worth keeping get captured while i can still add the meaning behind them.
  - id: snap_to_admin
    source: snap_store
    destination: admin
    authority: own
    detail: captured context moves into one private view.
  - id: admin_to_ani
    source: admin
    destination: ani
    authority: with_me
    detail: choices, permissions, consequences, and unclear results come back to me.
  - id: ani_to_agents
    source: ani
    destination: agents
    authority: mixed
    detail: i set the job, the context, and how far it can go.
  - id: agents_to_work
    source: agents
    destination: work
    authority: own
    detail: agents carry clear, contained work forward.
  - id: work_to_record
    source: work
    destination: record
    authority: own
    detail: finished work gets checked and recorded with what changed.
  - id: record_to_admin
    source: record
    destination: admin
    authority: mixed
    detail: the verified result returns to the private dashboard.
  - id: record_to_ani
    source: record
    destination: ani
    authority: with_me
    detail: anything still waiting on me returns with the context to decide.
principles_label: what agents can help with
principles:
  - label: notice
    title: bring what changed into view
    detail: changes across calendars, projects, saved posts and articles, videos and watch history, and everyday life become visible before they disappear.
  - label: watch
    title: keep an eye on what moves
    detail: agents can follow schedules, deadlines, project state, or patterns and surface the parts worth my attention.
  - label: prepare
    title: make the next decision easier
    detail: agents gather context, compare options, and prepare work so i can decide from a clear starting point.
  - label: act
    title: carry clear work forward
    detail: trusted work that is easy to undo can continue on its own. choices that affect other people, money, privacy, or commitments come back to me.
  - label: check
    title: keep the verified result
    detail: completed work returns with what changed, what was checked, and anything still waiting on me.
writing_label: the idea behind it
featured_writing:
  title: awareness is alpha
  href: /writing/awareness-is-alpha
  detail: "why i keep the system centered on awareness, ownership, and knowing when my attention matters."
tools_label: pieces i have made public
public_tools:
  - title: coding agent tips
    href: https://github.com/anipotts/coding-agent-tips
    detail: patterns i keep after seeing how agents behave in real repositories.
  - title: imessage mcp
    href: /projects/imessage-mcp
    detail: a private, read-only way to explore message history while the data stays local.
---
