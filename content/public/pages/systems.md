---
title: systems
description: "how i work with coding agents: define the task, retrieve context, work with agents, and review and complete."
hero_title: systems
hero_summary: "i've always used technology to get more out of my time, and now i work with agents to turn plans into actionable tasks while keeping my attention on the decisions that matter to me"
workflow:
  sources: [messages, gmail, calendar, notes, youtube, spotify, x, instagram, whatsapp, chrome, linkedin, granola, mercury, stripe]
  intro: |-
    over time i've built an intuition for how to approach things, but keeping up with information coming from every direction still takes attention.

    i use this system to piece together those everyday details, so i can put more thought into bigger questions about my future and decisions that need my judgment

  outro: "this is how i direct traces of context that my agents can use to better drive work forward, leaving me with way more time for the work i care about and people that are important"
  steps:
    - id: outcome
      marks: [mac-mini, github, linear]
      label: define the task
      detail: "i assess the current state to define new tasks or review existing ones"
    - id: context
      marks: [tailscale, 1password, obsidian]
      label: retrieve context
      detail: "i share the files, examples, and constraints that make the task specific"
    - id: work
      marks: [codex, claude]
      label: work with agents
      detail: "i answer questions and steer as the work takes shape"
    - id: check
      marks: [github, linear]
      label: review and complete
      detail: "i check the result, ask for changes, and make sure it is delivered and recorded"
  feedback: "we persist what we learn, and my agents carry that context into the next task"
# Retained experiment data. The public page renders workflow only.
lifecycle:
  {
    "status": "intended system",
    "domains": ["career", "learning", "wellbeing", "personal"],
    "workers": [
      {"id": "claude", "label": "Claude Code", "mark": "claude"},
      {"id": "codex", "label": "Codex", "mark": "openai"}
    ],
    "copy": {
      "caption": "requests → outcomes → learning",
      "context_hint": "retrieve, check, then ask",
      "human_hint": "unresolved questions pause here. an answer resumes the requesting stage.",
      "more_sources": "more sources",
      "transport": "Tailnet",
      "feedback_hint": "a separate task",
      "walkthrough_label": "walk through an example",
      "back": "back",
      "next": "next",
      "reset": "reset"
    },
    "principle": "requests become verified outcomes. decisions return to me. each outcome informs the next task.",
    "execution_label": "agent execution",
    "completion_rule": "A task is complete when nothing remains within its agreed scope, the outcome is verified, and an accurate record is saved. Execution receipts stay on the Mac mini; changes return to the record that owns them.",
    "pause_rule": "Missing information is retrieved before asking Ani. Stale or conflicting facts, required decisions, and unavailable information return to Ani. A paused task remains open. Recoverable failures retry while a useful recovery path exists; external waits resume on a relevant response or event.",
    "stages": [
      {
        "id": "request",
        "label": "request or trigger",
        "detail": "a request, watch, event, or schedule",
        "kind": "stage"
      },
      {
        "id": "understand",
        "label": "understand",
        "detail": "objective, scope, and what done means",
        "kind": "stage"
      },
      {
        "id": "gather",
        "label": "gather context",
        "detail": "retrieve relevant facts and access",
        "kind": "stage"
      },
      {
        "id": "act",
        "label": "act",
        "detail": "take the next authorized action",
        "kind": "stage"
      },
      {
        "id": "verify",
        "label": "verify",
        "detail": "check the outcome and remaining work",
        "kind": "stage"
      },
      {
        "id": "complete",
        "label": "record + complete",
        "detail": "save what happened, then close the task",
        "kind": "stage"
      }
    ],
    "support": [
      {
        "id": "context",
        "label": "personal context",
        "detail": "Retrieve task-relevant preferences, records, and documents. Check freshness and contradictions before using them. Ask Ani only when the needed information or decision remains unresolved.",
        "kind": "context",
        "mark": "ph:stack"
      },
      {
        "id": "records",
        "label": "personal records",
        "detail": "Gmail, Calendar, GitHub, Messages, Files, and Notes hold their respective facts. Verified changes return to the owning record.",
        "kind": "records"
      },
      {
        "id": "credentials",
        "label": "credential access",
        "detail": "1Password supplies access for an authorized action. Secret values stay out of model-visible context; access does not grant authority.",
        "kind": "credential"
      },
      {
        "id": "ani",
        "label": "ani",
        "detail": "direction + decisions",
        "kind": "human",
        "mark": "ap"
      },
      {
        "id": "runtime",
        "label": "runtime + transport",
        "detail": "The always-on Mac mini runs agents and keeps local execution receipts. Tailnet connects it to iPhone and MacBook. Ani is outside the device topology.",
        "kind": "runtime",
        "mark": "simple-icons:tailscale"
      },
      {
        "id": "archive",
        "label": "external SSD",
        "detail": "planned archive",
        "kind": "archive",
        "mark": "ph:hard-drive"
      },
      {
        "id": "feedback",
        "label": "follow-up",
        "detail": "A separate task asks how the outcome worked out and saves feedback for future decisions.",
        "kind": "feedback",
        "mark": "ph:arrow-counter-clockwise"
      }
    ],
    "sources": [
      {
        "id": "gmail",
        "label": "Gmail",
        "group": "records",
        "mark": "logos:google-gmail"
      },
      {
        "id": "calendar",
        "label": "Calendar",
        "group": "records",
        "mark": "logos:google-calendar"
      },
      {
        "id": "github",
        "label": "GitHub",
        "group": "records",
        "mark": "simple-icons:github"
      },
      {
        "id": "messages",
        "label": "Messages",
        "group": "records",
        "mark": "simple-icons:imessage"
      },
      {
        "id": "files",
        "label": "Files",
        "group": "records",
        "mark": "files"
      },
      {
        "id": "notes",
        "label": "Notes",
        "group": "records",
        "mark": "notes"
      },
      {
        "id": "1password",
        "label": "1Password",
        "group": "credentials",
        "mark": "simple-icons:1password"
      },
      {
        "id": "linkedin",
        "label": "LinkedIn",
        "group": "more",
        "mark": "logos:linkedin-icon"
      },
      {
        "id": "x",
        "label": "X",
        "group": "more",
        "mark": "simple-icons:x"
      },
      {
        "id": "instagram",
        "label": "Instagram",
        "group": "more",
        "mark": "logos:instagram-icon"
      },
      {
        "id": "chrome",
        "label": "Chrome",
        "group": "more",
        "mark": "logos:chrome"
      },
      {
        "id": "books",
        "label": "Books",
        "group": "more",
        "mark": "books"
      },
      {
        "id": "nyu",
        "label": "NYU",
        "group": "more",
        "mark": "nyu"
      },
      {
        "id": "withings",
        "label": "Withings",
        "group": "more",
        "mark": "withings"
      },
      {
        "id": "zocdoc",
        "label": "Zocdoc",
        "group": "more",
        "mark": "zocdoc"
      },
      {
        "id": "health",
        "label": "Health",
        "group": "more",
        "mark": "apple-health"
      }
    ],
    "devices": [
      {
        "id": "iphone",
        "label": "iPhone",
        "detail": "mobile access",
        "mark": "ph:device-mobile"
      },
      {
        "id": "macmini",
        "label": "Mac mini",
        "detail": "always on / local receipts",
        "mark": "mac-mini"
      },
      {
        "id": "macbook",
        "label": "MacBook",
        "detail": "desktop access",
        "mark": "ph:laptop"
      }
    ],
    "edges": [
      {
        "id": "start",
        "source": "request",
        "destination": "understand",
        "label": "",
        "detail": "A direct request or configured trigger starts a task.",
        "kind": "flow",
        "route": "direct"
      },
      {
        "id": "scope",
        "source": "understand",
        "destination": "gather",
        "label": "",
        "detail": "The objective determines which context is relevant.",
        "kind": "flow",
        "route": "direct"
      },
      {
        "id": "ready",
        "source": "gather",
        "destination": "act",
        "label": "",
        "detail": "Current context and sufficient authority enable action.",
        "kind": "flow",
        "route": "direct"
      },
      {
        "id": "check",
        "source": "act",
        "destination": "verify",
        "label": "",
        "detail": "Inspect the actual outcome of the action.",
        "kind": "flow",
        "route": "direct"
      },
      {
        "id": "finish",
        "source": "verify",
        "destination": "complete",
        "label": "scope satisfied",
        "detail": "Only verified work with no remaining scope proceeds to persistence.",
        "kind": "persist",
        "route": "direct"
      },
      {
        "id": "lookup",
        "source": "gather",
        "destination": "context",
        "label": "retrieve",
        "detail": "Retrieve missing facts before interrupting Ani.",
        "kind": "context",
        "route": "support"
      },
      {
        "id": "context_back",
        "source": "context",
        "destination": "gather",
        "label": "current context",
        "detail": "Return relevant facts with provenance; identify contradictions.",
        "kind": "context",
        "route": "support"
      },
      {
        "id": "read_records",
        "source": "records",
        "destination": "context",
        "label": "",
        "detail": "Consult the records that own the relevant facts.",
        "kind": "context",
        "route": "support"
      },
      {
        "id": "access",
        "source": "credentials",
        "destination": "context",
        "label": "access",
        "detail": "Request credentials through the secure access mechanism.",
        "kind": "credential",
        "route": "support"
      },
      {
        "id": "more_work",
        "source": "verify",
        "destination": "act",
        "label": "more work",
        "detail": "Continue useful execution when verification finds work remains.",
        "kind": "retry",
        "route": "right"
      },
      {
        "id": "missing_context",
        "source": "act",
        "destination": "gather",
        "label": "missing context",
        "detail": "Return to context gathering when execution needs additional facts.",
        "kind": "context",
        "route": "left"
      },
      {
        "id": "needs_me",
        "source": "context",
        "destination": "ani",
        "label": "needs me",
        "detail": "Unresolved information, conflicting facts, choices, or missing authority require Ani.",
        "kind": "human",
        "route": "support"
      },
      {
        "id": "decision",
        "source": "act",
        "destination": "ani",
        "label": "needs me",
        "detail": "Request a choice or permission at the point it is needed.",
        "kind": "human",
        "route": "right"
      },
      {
        "id": "answer",
        "source": "ani",
        "destination": "act",
        "label": "answer or decision",
        "detail": "Resume the requesting stage with Ani's decision. For an information question, retrieve context again.",
        "kind": "human",
        "route": "right"
      },
      {
        "id": "answer_context",
        "source": "ani",
        "destination": "gather",
        "label": "new information",
        "detail": "An answer about missing context returns to context gathering.",
        "kind": "human",
        "route": "support"
      },
      {
        "id": "new_goal",
        "source": "ani",
        "destination": "understand",
        "label": "changed objective",
        "detail": "A changed goal is understood before execution resumes.",
        "kind": "human",
        "route": "right"
      },
      {
        "id": "ani_start",
        "source": "ani",
        "destination": "request",
        "label": "request",
        "detail": "Ani can initiate work directly.",
        "kind": "human",
        "route": "outer"
      },
      {
        "id": "record_failed",
        "source": "complete",
        "destination": "complete",
        "label": "record failed",
        "detail": "Retry persistence without closing the task.",
        "kind": "retry",
        "route": "self"
      },
      {
        "id": "record_blocked",
        "source": "complete",
        "destination": "ani",
        "label": "needs me / answer",
        "detail": "An unresolved persistence failure leaves the task paused and returns to Ani.",
        "kind": "human",
        "route": "outer"
      },
      {
        "id": "answer_record",
        "source": "ani",
        "destination": "complete",
        "label": "resume recording",
        "detail": "An answer that resolves a persistence failure resumes recording. The task closes only after persistence succeeds.",
        "kind": "human",
        "route": "right"
      },
      {
        "id": "persist",
        "source": "complete",
        "destination": "records",
        "label": "save outcome",
        "detail": "Write changes to their owning records and retain provenance.",
        "kind": "persist",
        "route": "left"
      },
      {
        "id": "runtime_access",
        "source": "runtime",
        "destination": "act",
        "label": "runtime",
        "detail": "Devices and Tailnet support execution; credentials do not grant authority.",
        "kind": "transport",
        "route": "support"
      },
      {
        "id": "receipts",
        "source": "complete",
        "destination": "runtime",
        "label": "local receipts",
        "detail": "Keep execution receipts on the Mac mini.",
        "kind": "persist",
        "route": "support"
      },
      {
        "id": "archive_copy",
        "source": "complete",
        "destination": "archive",
        "label": "planned",
        "detail": "The planned external SSD branches from persistence.",
        "kind": "archive",
        "route": "support"
      },
      {
        "id": "followup",
        "source": "complete",
        "destination": "feedback",
        "label": "later",
        "detail": "Completion may schedule a separate follow-up task.",
        "kind": "feedback",
        "route": "support"
      },
      {
        "id": "followup_due",
        "source": "feedback",
        "destination": "request",
        "label": "follow-up due",
        "detail": "The due event starts a new task; it does not reopen a completed booking.",
        "kind": "feedback",
        "route": "outer"
      },
      {
        "id": "learn",
        "source": "feedback",
        "destination": "context",
        "label": "feedback",
        "detail": "Persist Ani's explicit feedback as context for future tasks.",
        "kind": "feedback",
        "route": "support"
      }
    ],
    "walkthrough": [
      {
        "title": "Find a barber",
        "detail": "I ask for a nearby barber who can handle curly hair.",
        "nodes": [
          "request",
          "ani"
        ],
        "edges": [
          "ani_start",
          "start"
        ]
      },
      {
        "title": "Retrieve what matters",
        "detail": "The agent retrieves my location and haircut preferences, checking that the information is current.",
        "nodes": [
          "understand",
          "gather",
          "context",
          "records"
        ],
        "edges": [
          "scope",
          "lookup",
          "context_back"
        ]
      },
      {
        "title": "Inspect the options",
        "detail": "The agent searches nearby shops and gathers Google Maps photos and other relevant evidence.",
        "nodes": [
          "act"
        ],
        "edges": [
          "ready"
        ]
      },
      {
        "title": "My choice",
        "detail": "I review the photos, choose a barber, and select a time that works for me.",
        "nodes": [
          "ani",
          "act"
        ],
        "edges": [
          "decision",
          "answer"
        ]
      },
      {
        "title": "Book the appointment",
        "detail": "The agent books my chosen appointment and checks the response.",
        "nodes": [
          "act",
          "verify"
        ],
        "edges": [
          "check"
        ]
      },
      {
        "title": "Use the confirmation",
        "detail": "Use the confirmation email's Add to calendar action. If it has none, check for an existing entry before creating an event.",
        "nodes": [
          "records",
          "act",
          "verify"
        ],
        "edges": [
          "more_work",
          "check"
        ]
      },
      {
        "title": "Verify and save",
        "detail": "Verify the booking and calendar details, then save the outcome in the appropriate records and keep a local receipt.",
        "nodes": [
          "verify",
          "complete",
          "records",
          "runtime"
        ],
        "edges": [
          "finish",
          "persist",
          "receipts"
        ]
      },
      {
        "title": "Booking complete",
        "detail": "The booking is confirmed, the calendar entry is verified, and what happened is recorded. This task is closed.",
        "nodes": [
          "complete"
        ],
        "edges": []
      },
      {
        "title": "A separate feedback loop",
        "detail": "After the appointment, a new task asks how I liked the cut. My answer records a preferred barber or informs the next search.",
        "nodes": [
          "feedback",
          "request",
          "ani",
          "context"
        ],
        "edges": [
          "followup",
          "followup_due",
          "learn"
        ]
      }
    ]
  }
# Compatibility data for retained experiments. The public page consumes lifecycle.
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
    href: /work/imessage-mcp
    detail: a private, read-only way to explore message history while the data stays local.
---
