---
title: systems
description: "a system design map of how signals move through my life, devices, agents, authority gates, and records."
hero_title: systems
hero_summary: "how signals move through my life, devices, agents, authority gates, and records."
map_label: system topology
map_principle: "life produces signals. records hold facts. i direct agents. agents verify and persist changes back to the record that owns them."
map_domains:
  - label: career
    detail: opportunities, applications, project activity
    sources:
      - id: linkedin
        label: LinkedIn
        mode: manual
        kind: signal
      - id: x
        label: X
        mode: manual
        kind: signal
      - id: instagram
        label: Instagram
        mode: manual
        kind: signal
      - id: gmail
        label: Gmail
        mode: scheduled
        kind: record
      - id: github
        label: GitHub
        mode: event
        kind: record
  - label: learning
    detail: degree records, research, reading
    sources:
      - id: chrome
        label: Chrome
        mode: manual
        kind: signal
      - id: apple_books
        label: Apple Books
        mode: manual
        kind: signal
      - id: nyu
        label: NYU
        mode: manual
        kind: record
      - id: files
        label: Files
        mode: local
        kind: record
  - label: wellbeing
    detail: measurements, appointments, care
    sources:
      - id: zocdoc
        label: Zocdoc
        mode: manual
        kind: signal
      - id: physical_measurement
        label: physical measurements
        mode: scheduled
        kind: signal
      - id: withings
        label: Withings
        mode: scheduled
        kind: record
      - id: apple_health
        label: Apple Health
        mode: local
        kind: record
  - label: personal
    detail: messages, plans, people
    sources:
      - id: real_life
        label: real life
        mode: manual
        kind: signal
      - id: people
        label: people
        mode: manual
        kind: signal
      - id: imessage
        label: Messages
        mode: local
        kind: record
      - id: notes
        label: Notes
        mode: local
        kind: record
map_nodes:
  - id: life
    label: life areas
    title: signals from life
    detail: services, devices, and real-world inputs produce changes worth noticing.
    items: []
  - id: snap_store
    label: records
    title: authoritative records
    detail: facts stay in the service or local record that owns them rather than inside the model.
    items:
      - provider events
      - scheduled scans
      - local reads
      - manual capture
  - id: admin
    label: private index
    title: admin.anipotts.com
    detail: blockers, approvals, verified changes, and provenance in one private view.
    items: []
  - id: ani
    label: human authority
    title: ani potts
    detail: i set direction, grant authority, resolve ambiguity, and own final decisions.
    items: []
  - id: agents
    label: workers
    title: codex + claude code
    detail: workers execute bounded tasks and return consequential or uncertain work to me.
    items:
      - codex
      - claude code
  - id: work
    label: authorized work
    title: bounded task
    detail: execution stays inside task, context, device, and action limits.
    items: []
  - id: record
    label: verify + persist
    title: verified update
    detail: deterministic checks attach evidence before changes return to the record that owns the state.
    items: []
  - id: calendar
    label: scheduled
    title: Google Calendar
    detail: commitments and time-based triggers span every life area.
    items: []
  - id: credentials
    label: credentials
    title: 1Password
    detail: credential access enables an authorized action but does not grant authority.
    items: []
  - id: infrastructure
    label: transport
    title: Tailnet
    detail: a private network connects the iPhone, MacBook, and always-on Mac mini runtime.
    items: []
map_foundation_label: execution substrate
map_foundations:
  - id: calendar
    title: Google Calendar
    role: shared schedule
    detail: cross-domain commitments and time-based starts
    state: active
  - id: github
    title: GitHub
    role: cloud record
    detail: repositories, commits, issues, and deployment proof
    state: active
  - id: mac_mini
    title: Mac mini
    role: local runtime
    detail: 24/7 working state, recent context, and agent execution
    state: active
  - id: one_password
    title: 1Password
    role: credential access
    detail: credentials for already-authorized work
    state: active
  - id: tailnet
    title: Tailnet
    role: private transport
    detail: encrypted connectivity between my active devices
    state: active
  - id: external_ssd
    title: external SSD
    role: cold archive
    detail: long-term recovery copies
    state: planned
map_device_label: tailnet
map_devices:
  - id: iphone
    title: iPhone
    detail: observation and approval
  - id: macbook
    title: MacBook
    detail: primary operator console
  - id: mac_mini
    title: Mac mini
    detail: always-on remote runtime
map_authority_label: execution policy
map_authority_modes:
  - id: own
    label: within policy
    detail: contained and reversible operation
  - id: with_me
    label: approval required
    detail: external effect, ambiguity, or irreversible consequence
  - id: mixed
    label: bounded handoff
    detail: worker prepares, control plane authorizes, worker resumes
map_relationships:
  - id: signals_to_records
    source: life
    destination: snap_store
    authority: mixed
    kind: signal
    detail: events, local reads, and manual observation enter the record that owns the fact.
  - id: records_to_ani
    source: snap_store
    destination: ani
    authority: mixed
    kind: signal
    detail: relevant changes and current context come into my view.
  - id: calendar_to_ani
    source: calendar
    destination: ani
    authority: own
    kind: scheduled
    detail: scheduled commitments and checks create time-based starts.
  - id: ani_to_agents
    source: ani
    destination: agents
    authority: own
    kind: authorized
    detail: i assign a bounded job, context, device, and action limit.
  - id: agents_to_ani
    source: agents
    destination: ani
    authority: with_me
    kind: needs_human
    detail: ambiguity, changed goals, and consequential actions return to me.
  - id: agents_to_credentials
    source: agents
    destination: credentials
    authority: own
    kind: credential
    detail: authorized work can request credentials without exposing their values to the model.
  - id: agents_to_infrastructure
    source: agents
    destination: infrastructure
    authority: own
    kind: transport
    detail: agents reach the appropriate device through the private network.
  - id: agents_to_record
    source: agents
    destination: record
    authority: own
    kind: verified_update
    detail: completed work is checked and paired with evidence.
  - id: record_to_records
    source: record
    destination: snap_store
    authority: mixed
    kind: verified_update
    detail: verified changes return to the authoritative record and become context for the next decision.
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
