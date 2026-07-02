export type NewsletterClaim = {
  claim: string;
  status: "source_backed" | "needs_proof";
  source_refs: string[];
};

export type NewsletterSection = {
  kind: "opening" | "note" | "receipt" | "worklog" | "close";
  heading?: string;
  label?: string;
  body: string;
  items?: string[];
  source_refs?: string[];
  thread_beat?: string;
};

export type NewsletterClose = {
  kind: "close";
  body: string;
  cta: string;
};

export type NewsletterPipeline = {
  lane: "backfill" | "new_draft" | "evergreen";
  stage: "ready_for_review" | "voice_pass" | "needs_source" | "fallback_ready";
  energy: "low" | "medium";
  next_action: string;
};

export type NewsletterDraft = {
  id: string;
  slug: string;
  status: "idea" | "draft" | "preview" | "ready_for_review" | "blocked";
  title: string;
  subject: string;
  summary: string;
  dek: string;
  audience: string;
  source_refs: { ref: string; use: string }[];
  spine: string[];
  hook: NewsletterSection;
  sections: NewsletterSection[];
  close: NewsletterClose;
  claims: NewsletterClaim[];
  x_thread_beats: string[];
  blocked_actions: string[];
  preview_notes: string;
  source_fixture: string;
  preview_fixture: string;
  pipeline: NewsletterPipeline;
};

export const newsletterDraftsSource = {
  source_doc: "docs/newsletter-content-structure.md",
  system_doc: "docs/newsletter-system.md",
  mode: "read_only_static_draft_preview",
  blocked:
    "No D1 write, archive publish, send, schedule, worker, endpoint, DNS, auth, env, or secret mutation.",
};

const blockedLiveActions = [
  "write production d1 issue",
  "publish archive page",
  "send test email",
  "broadcast to subscribers",
  "change DNS",
  "change auth or Cloudflare Access",
  "modify env or secrets",
  "change workers or endpoints",
  "add admin write path",
];

export const newsletterDrafts: NewsletterDraft[] = [
  {
    id: "newsletter-draft-agents-execute-awareness-closes-loop",
    slug: "agents-execute-awareness-closes-the-loop",
    status: "ready_for_review",
    title: "agents execute. awareness closes the loop.",
    subject: "agents execute. awareness closes the loop.",
    summary:
      "a practical note on why agent work gets better when the system can show intent, authority, proof, and current state.",
    dek: "this is the spine for anipotts.com, admin.anipotts.com, and the way i want agents to work around me instead of asking me to hold every thread in my head.",
    audience:
      "builders using coding agents across multiple repos, machines, and live surfaces",
    source_fixture:
      "docs/newsletter-drafts/agents-execute-awareness-closes-the-loop.json",
    preview_fixture: "apps/admin/src/pages/newsletter/[slug].astro",
    pipeline: {
      lane: "new_draft",
      stage: "ready_for_review",
      energy: "low",
      next_action:
        "read once for voice, then decide whether it becomes the first newsletter issue or a public blog post",
    },
    source_refs: [
      {
        ref: "AGENTS.md",
        use: "authority, lanes, hard stops, and proof expectations",
      },
      {
        ref: "docs/admin-v2-architecture.md",
        use: "admin control-plane direction and operator dashboard model",
      },
      {
        ref: "apps/admin/src/pages/index.astro",
        use: "current admin overview and safe-next framing",
      },
      {
        ref: "apps/admin/src/pages/proof.astro",
        use: "proof surface for route, deploy, auth, and content evidence",
      },
    ],
    spine: ["intent", "authority", "operation", "proof", "state"],
    hook: {
      kind: "opening",
      body: "agents are good at executing. the part that keeps breaking is awareness: what is allowed, what changed, what is blocked, and what proof exists.",
      source_refs: ["AGENTS.md", "docs/admin-v2-architecture.md"],
      thread_beat:
        "execution without awareness turns into another thing i have to supervise.",
    },
    sections: [
      {
        kind: "note",
        heading: "the useful loop",
        body: "the loop i keep coming back to is intent, authority, operation, proof, state. what did i ask for, what was allowed, what happened, how do we know, and what is true now. when that loop is visible, agents can move faster without making the system feel loose.",
        source_refs: ["AGENTS.md", "docs/admin-v2-architecture.md"],
        thread_beat:
          "the loop is not ceremony. it is what lets work continue without re-reading a whole chat.",
      },
      {
        kind: "receipt",
        label: "admin as memory",
        body: "admin.anipotts.com is becoming the place where this state shows up. not a giant dashboard. just the things i need to know next: safe work, blocked work, content drafts, deploy proof, passkey proof, and repo state.",
        source_refs: [
          "apps/admin/src/pages/index.astro",
          "apps/admin/src/pages/proof.astro",
        ],
        thread_beat:
          "the dashboard should lower supervision load, not create a new inbox.",
      },
      {
        kind: "worklog",
        heading: "what this changes",
        body: "the site work is already moving this way. public copy is becoming structured content. admin has the content editor. passkey auth is taking over the boundary. deploys prove which target moved. the same pattern can run the newsletter pipeline.",
        items: [
          "public writing can be drafted without pretending it is ready",
          "admin can show the next safe content action",
          "publish and send paths stay separate from writing",
          "proof can travel with the draft before anything goes live",
        ],
        source_refs: [
          "apps/admin/src/pages/content/edit/[pageKey].astro",
          "docs/newsletter-content-structure.md",
        ],
        thread_beat:
          "writing gets easier when the draft already knows what proof it needs.",
      },
      {
        kind: "close",
        body: "the goal is not more autonomy for its own sake. the goal is less stale state. agents execute, awareness closes the loop, and i only step in where my judgment actually matters.",
      },
    ],
    close: {
      kind: "close",
      body: "this should become the short manifesto spine for the site and newsletter. keep it direct, practical, and tied to visible admin proof.",
      cta: "draft only. review voice before public publishing or email.",
    },
    claims: [
      {
        claim:
          "the repo uses explicit safe lanes and hard stops to separate normal work from gated actions",
        status: "source_backed",
        source_refs: ["AGENTS.md"],
      },
      {
        claim:
          "admin already exposes content, proof, deploys, passkey auth, and route state",
        status: "source_backed",
        source_refs: ["apps/admin/src/pages/index.astro"],
      },
      {
        claim:
          "newsletter writing should remain separate from send and schedule paths",
        status: "source_backed",
        source_refs: ["docs/newsletter-system.md"],
      },
      {
        claim:
          "this draft is ready for voice review but not approved for public publishing",
        status: "needs_proof",
        source_refs: [
          "docs/newsletter-drafts/agents-execute-awareness-closes-the-loop.json",
        ],
      },
    ],
    x_thread_beats: [
      "agents are good at executing. awareness is the part that keeps breaking.",
      "what did i ask for, what was allowed, what happened, how do we know, what is true now.",
      "that is the whole loop.",
      "admin should lower supervision load, not become a second inbox.",
      "drafts should know what proof they need before they try to publish.",
      "send paths and writing paths should stay separate until the system is boring.",
      "agents execute. awareness closes the loop.",
    ],
    blocked_actions: blockedLiveActions,
    preview_notes:
      "lead candidate for first issue. strong spine, still needs ani voice pass before public use.",
  },
  {
    id: "newsletter-draft-first-thing-agents-need-control-plane",
    slug: "first-thing-agents-need-control-plane",
    status: "draft",
    title: "the first thing your agents need is a control plane",
    subject: "the first thing your agents need is a control plane",
    summary:
      "every coding agent gets more useful when it knows what it is allowed to do, what proof it owes, and when it needs to come back to me.",
    dek: "what i am learning from turning admin.anipotts.com into a read-only operator dashboard first, then a content review surface, then a guarded write path.",
    audience:
      "builders running coding agents across real repos, live sites, and operational state",
    source_fixture:
      "docs/newsletter-drafts/first-thing-agents-need-control-plane.json",
    preview_fixture:
      "docs/newsletter-drafts/first-thing-agents-need-control-plane.preview.html",
    pipeline: {
      lane: "evergreen",
      stage: "voice_pass",
      energy: "low",
      next_action:
        "tighten intro and decide whether it should be a companion to the awareness draft",
    },
    source_refs: [
      {
        ref: "AGENTS.md",
        use: "repo authority model, safe lanes, hard gates, NEEDS-ANI rules, and proof expectations",
      },
      {
        ref: "docs/admin-v2-architecture.md",
        use: "admin v2 direction and control-plane framing",
      },
      {
        ref: "docs/content-admin-editor-brief.md",
        use: "read-only content inventory and admin editing progression",
      },
      {
        ref: "packages/content/src/admin/content.ts",
        use: "Astro admin static content inventory and preview-only model",
      },
      {
        ref: "docs/newsletter-content-structure.md",
        use: "newsletter draft issue contract and gated work list",
      },
    ],
    spine: ["intent", "authority", "operation", "proof", "state"],
    hook: {
      kind: "opening",
      body: "every coding agent i use eventually runs into the same boring problem: it can make a change, but it needs a system around it for responsibility.",
      source_refs: ["AGENTS.md", "docs/admin-v2-architecture.md"],
      thread_beat:
        "the useful split is simple: safe lanes can move, hard gates come back to me.",
    },
    sections: [
      {
        kind: "note",
        heading: "safe lanes versus hard gates",
        body: "i want agents to move quickly when the blast radius is small. if the work is safe, the agent should inspect, edit, verify, commit, push, and open a PR without waiting on me. if the work touches dns, auth, secrets, env, production content, outbound sends, live endpoints, payments, or destructive cleanup, it needs explicit authority. the control plane makes that split obvious before anything gets touched.",
        source_refs: ["AGENTS.md"],
        thread_beat:
          "safe lanes let agents move without asking me for permission every five minutes.",
      },
      {
        kind: "receipt",
        label: "proof beats trust",
        body: "if a decision only lives in chat, it barely exists. i want the useful state in commits, PRs, handoff docs, deploy runs, screenshots, and blocked-action lists. the next agent should be able to continue from the artifact instead of guessing what happened in the previous conversation.",
        source_refs: ["AGENTS.md", "docs/content-admin-editor-brief.md"],
        thread_beat:
          "proof is what lets the next agent continue without inheriting chat memory.",
      },
      {
        kind: "note",
        heading: "NEEDS-ANI as a human syscall queue",
        body: "the human queue should be tiny. i do not want a dashboard full of agent homework. i want the few calls only i can make: approve this, choose between these options, do this account-side action, provide this secret, decide whether this public copy sounds like me.",
        source_refs: ["AGENTS.md", "docs/admin-v2-architecture.md"],
        thread_beat:
          "a good human queue is small enough to answer from my phone.",
      },
      {
        kind: "worklog",
        heading: "admin as the control plane",
        body: "this is why admin.anipotts.com starts read-only. i need one place where content, fleet state, handoffs, approvals, and proof are legible. only after that is boring do i want write buttons. live controls come after the foundation.",
        items: [
          "read-only operator dashboard first",
          "content inventory and preview states next",
          "guarded writes only after the authority model is real",
          "live gates visible before live controls exist",
        ],
        source_refs: [
          "docs/admin-v2-architecture.md",
          "docs/content-admin-editor-brief.md",
          "packages/content/src/admin/content.ts",
        ],
        thread_beat:
          "the control plane maps what i meant to what was allowed to what changed.",
      },
    ],
    close: {
      kind: "close",
      body: "the version of this i want is boring in the best way. agents know what they can do next, what proof they owe, and when the right move is to return one clear decision to me.",
      cta: "draft only. review for tone, claims, and source refs before any archive or send path.",
    },
    claims: [
      {
        claim:
          "agents in this repo can complete safe lanes end to end but must stop at true gates",
        status: "source_backed",
        source_refs: ["AGENTS.md"],
      },
      {
        claim: "NEEDS-ANI is defined as a narrow human syscall queue",
        status: "source_backed",
        source_refs: ["AGENTS.md"],
      },
      {
        claim:
          "admin content work should move from read-only inventory to previews before publish paths",
        status: "source_backed",
        source_refs: ["AGENTS.md", "docs/content-admin-editor-brief.md"],
      },
      {
        claim:
          "admin.anipotts.com should become the practical web surface for editing public-site text, previewing changes, reviewing fleet state, and returning decisions",
        status: "source_backed",
        source_refs: ["AGENTS.md"],
      },
    ],
    x_thread_beats: [
      "every coding agent i use eventually runs into the same boring problem: it needs a place to put responsibility.",
      "that is what i mean by a control plane.",
      "the useful contract is intent -> authority -> operation -> proof -> state.",
      "safe lanes let agents move without asking me for permission every five minutes.",
      "hard gates keep dns, auth, secrets, sends, live endpoints, and irreversible actions behind explicit authority.",
      "proof beats trust because the next agent has to continue from the artifact.",
      "NEEDS-ANI is my human syscall queue: approval, choice, account action, identity, payment, secret setup, final taste.",
      "admin.anipotts.com should make state legible before it makes state mutable.",
      "the system i want is boring: agents know what they can do next.",
    ],
    blocked_actions: blockedLiveActions,
    preview_notes:
      "newsletter-first outline with thread-compatible beats. keep practical, source-backed, and specific to anipotts-com/admin.",
  },
  {
    id: "newsletter-draft-durable-agent-workflows-proof-loops",
    slug: "durable-agent-workflows-proof-loops",
    status: "draft",
    title: "durable agent workflows are proof loops",
    subject: "durable agent workflows are proof loops",
    summary:
      "a note that connects durable workflows, admin proof, and the carousel set into one practical explanation.",
    dek: "the carousel says learn durable workflows. the longer version is that durable work is mostly about knowing what happened after the agent stops typing.",
    audience:
      "builders turning agent demos into systems that can pause, resume, and prove state",
    source_fixture:
      "docs/newsletter-drafts/durable-agent-workflows-proof-loops.json",
    preview_fixture: "apps/admin/src/pages/newsletter/[slug].astro",
    pipeline: {
      lane: "backfill",
      stage: "needs_source",
      energy: "medium",
      next_action:
        "attach the carousel review assets and choose one public proof screenshot before publishing",
    },
    source_refs: [
      {
        ref: "apps/admin/src/pages/content/carousels.astro",
        use: "read-only carousel review surface for durable agent workflows",
      },
      {
        ref: "apps/admin/src/data/static/carousels/durable_agent_workflows_v2.json",
        use: "source manifest for four carousel posts and twenty-four slides",
      },
      {
        ref: "apps/admin/src/pages/proof.astro",
        use: "admin proof model and durable evidence surface",
      },
      {
        ref: "docs/newsletter-content-structure.md",
        use: "draft issue shape and blocked live actions",
      },
    ],
    spine: ["state", "idempotency", "approval", "trace", "reconcile"],
    hook: {
      kind: "opening",
      body: "durable workflows sound like infrastructure jargon until an agent gets interrupted halfway through real work. then the boring pieces become the whole product.",
      source_refs: [
        "apps/admin/src/data/static/carousels/durable_agent_workflows_v2.json",
      ],
      thread_beat:
        "the agent has to know where it stopped and what is safe to repeat.",
    },
    sections: [
      {
        kind: "note",
        heading: "durability is not just retry",
        body: "retry is one piece. the larger problem is remembering intent, preserving state, avoiding duplicate side effects, and knowing when a human approval is still required. that is why idempotent tools and proof logs matter more than clever prompts.",
        source_refs: ["apps/admin/src/pages/proof.astro"],
        thread_beat:
          "a retry without state is just a faster way to make the same mistake twice.",
      },
      {
        kind: "receipt",
        label: "the carousel packet",
        body: "the current carousel set has four posts and twenty-four rendered slides. admin can inspect the crops, captions, freshness, and review state without posting or scheduling anything.",
        source_refs: [
          "apps/admin/src/pages/content/carousels.astro",
          "apps/admin/src/data/static/carousels/durable_agent_workflows_v2.json",
        ],
        thread_beat:
          "the media can be reviewed as proof material before it becomes distribution.",
      },
      {
        kind: "worklog",
        heading: "what the workflow needs",
        body: "a production agent workflow needs clear state before it needs more model calls. it needs checkpoints, replay-safe operations, approval gates, traces, and a reconciliation pass at the end.",
        items: [
          "persist the current operation before the tool call",
          "make the tool safe to repeat or detect the duplicate",
          "store proof close to the action",
          "reconcile the final state before calling the work done",
        ],
        source_refs: ["docs/admin-v2-architecture.md"],
        thread_beat:
          "the last step is not output. the last step is reconciling state.",
      },
      {
        kind: "close",
        body: "that is the practical version of durable workflows for me: pause, resume, prove, reconcile. if the system can do that, the agent can be trusted with more boring work.",
      },
    ],
    close: {
      kind: "close",
      body: "pair this with the carousel assets after one visual proof is selected.",
      cta: "draft only. choose proof media before archive or send.",
    },
    claims: [
      {
        claim:
          "the admin carousel route is read-only and does not post or schedule",
        status: "source_backed",
        source_refs: ["apps/admin/src/pages/content/carousels.astro"],
      },
      {
        claim:
          "the durable agent workflows carousel manifest contains four posts and twenty-four slides",
        status: "source_backed",
        source_refs: [
          "apps/admin/src/data/static/carousels/durable_agent_workflows_v2.json",
        ],
      },
      {
        claim:
          "production workflow claims need one selected public proof artifact before publishing",
        status: "needs_proof",
        source_refs: [
          "docs/newsletter-drafts/durable-agent-workflows-proof-loops.json",
        ],
      },
    ],
    x_thread_beats: [
      "durable workflows sound abstract until the agent gets interrupted.",
      "then state is the product.",
      "retry is not enough.",
      "the system has to remember intent, avoid duplicate side effects, and preserve proof.",
      "the carousel is distribution material, but admin treats it as review material first.",
      "pause, resume, prove, reconcile.",
    ],
    blocked_actions: blockedLiveActions,
    preview_notes:
      "backfill candidate tied to carousel support material. needs one proof screenshot or public visual before publish.",
  },
  {
    id: "newsletter-draft-writing-when-low-energy",
    slug: "writing-when-low-energy",
    status: "draft",
    title: "how i keep writing when i do not feel like writing",
    subject: "how i keep writing when i do not feel like writing",
    summary:
      "a low-energy content pipeline that starts from receipts, rough notes, and admin drafts instead of a blank page.",
    dek: "the point is not to force a big essay every day. the point is to keep useful raw material moving until i have enough energy to make it sound like me.",
    audience:
      "builders who want a content system that still works on low-energy days",
    source_fixture: "docs/newsletter-drafts/writing-when-low-energy.json",
    preview_fixture: "apps/admin/src/pages/newsletter/[slug].astro",
    pipeline: {
      lane: "evergreen",
      stage: "fallback_ready",
      energy: "low",
      next_action:
        "use this as the recurring fallback issue when no fresh essay is ready",
    },
    source_refs: [
      {
        ref: "apps/www/src/content/writing/stop-ending-your-day-with-fix-the-bug.md",
        use: "existing post about specific prompts and next-day continuity",
      },
      {
        ref: "docs/newsletter-content-structure.md",
        use: "draft issue shape and low-risk preview model",
      },
      {
        ref: "apps/admin/src/pages/content/edit/[pageKey].astro",
        use: "admin content editor that can hold drafts before publish",
      },
      {
        ref: "apps/admin/src/pages/newsletter.astro",
        use: "newsletter queue where drafts can sit without sending",
      },
    ],
    spine: [
      "receipt",
      "rough pass",
      "voice pass",
      "proof pass",
      "publish later",
    ],
    hook: {
      kind: "opening",
      body: "some days i do not want to write. that should not break the system. the system should still collect receipts, keep drafts warm, and leave me one clear next action.",
      source_refs: [
        "apps/www/src/content/writing/stop-ending-your-day-with-fix-the-bug.md",
      ],
      thread_beat:
        "low energy days need smaller writing tasks, not fake motivation.",
    },
    sections: [
      {
        kind: "note",
        heading: "start from receipts",
        body: "the easiest writing source is work that already happened. commits, screenshots, admin proof, route checks, and rough handoff notes are all better than a blank page. the first pass should collect those receipts without trying to sound finished.",
        source_refs: ["apps/admin/src/pages/proof.astro"],
        thread_beat:
          "collecting proof is a writing task when writing feels too heavy.",
      },
      {
        kind: "worklog",
        heading: "split the job",
        body: "the pipeline should split writing into smaller jobs so i can do one of them on a bad day. collect source, outline the beats, make it sound like me, check claims, then decide where it goes.",
        items: [
          "source pass: collect commits, pages, screenshots, and notes",
          "rough pass: turn receipts into plain sentences",
          "voice pass: remove generic phrasing and make it sound like me",
          "proof pass: keep only claims with public evidence or mark them blocked",
          "publish pass: choose blog, newsletter, or keep it in admin",
        ],
        source_refs: ["docs/newsletter-content-structure.md"],
        thread_beat:
          "the pipeline should let me make progress without doing the whole essay at once.",
      },
      {
        kind: "receipt",
        label: "existing habit",
        body: "the same pattern already works for coding: a specific next prompt beats a vague todo. writing can use the same trick. end the day with the next draft action, not a hope that tomorrow feels easier.",
        source_refs: [
          "apps/www/src/content/writing/stop-ending-your-day-with-fix-the-bug.md",
        ],
        thread_beat:
          "a draft note is just an instruction for the next version of me.",
      },
      {
        kind: "close",
        body: "the fallback is simple: if i cannot write, i collect proof. if i cannot polish, i leave a specific next edit. if i cannot publish, i keep the draft visible in admin.",
      },
    ],
    close: {
      kind: "close",
      body: "this can become the recurring content pipeline note and the operating rule for future newsletter drafts.",
      cta: "draft only. keep send and schedule blocked.",
    },
    claims: [
      {
        claim:
          "the admin editor can hold draft state before a public publish decision",
        status: "source_backed",
        source_refs: ["apps/admin/src/pages/content/edit/[pageKey].astro"],
      },
      {
        claim:
          "the existing writing post argues for specific next-session prompts",
        status: "source_backed",
        source_refs: [
          "apps/www/src/content/writing/stop-ending-your-day-with-fix-the-bug.md",
        ],
      },
      {
        claim:
          "a recurring low-energy content pipeline should not send or schedule email automatically",
        status: "source_backed",
        source_refs: ["docs/newsletter-system.md"],
      },
    ],
    x_thread_beats: [
      "some days i do not want to write. the system should survive that.",
      "proof collection is still writing work.",
      "a rough pass is allowed to sound rough.",
      "the voice pass is where it becomes mine.",
      "the proof pass keeps the draft honest.",
      "if i cannot publish, i keep the draft visible in admin.",
    ],
    blocked_actions: blockedLiveActions,
    preview_notes:
      "recurring fallback issue. useful when no fresh essay is ready and the system needs one concrete next writing action.",
  },
];
