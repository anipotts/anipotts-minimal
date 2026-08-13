-- 0044_public_identity_systems.sql
-- Converge the public homepage and systems identity in structured page_content.
-- 0043 belongs to the existing admin control slice and remains independent.
--
-- Rollback requires restoring the prior home and project versions from
-- version_history, then deleting the systems and awareness rows below.

UPDATE page_content
SET content = json_remove(
      json_set(
        content,
        '$.sections.intro.subheading',
        'i build with agents and write about the systems that keep the work coherent. business insider has covered how i work; previously, i worked on real-time agent i/o at structured ai (YC F25) and our bad habit, an atlantic records venture.',
        '$.sections.intro.rich_summary',
        json('[{"segments":[{"kind":"text","text":"i "},{"kind":"mention","key":"build"},{"kind":"text","text":" with "},{"kind":"mention","key":"agents"},{"kind":"text","text":" and "},{"kind":"mention","key":"write"},{"kind":"text","text":" about the "},{"kind":"mention","key":"systems"},{"kind":"text","text":" that keep the work coherent."}]},{"segments":[{"kind":"mention","key":"businessInsider"},{"kind":"text","text":" has covered how i work; previously, i worked on real-time agent i/o at "},{"kind":"cluster","segments":[{"kind":"mention","key":"structuredAi"},{"kind":"parens","segments":[{"kind":"mention","key":"yCombinatorF25"}]}]},{"kind":"text","text":" and "},{"kind":"cluster","segments":[{"kind":"mention","key":"badHabit","suffix":","},{"kind":"text","text":"an "},{"kind":"mention","key":"atlanticRecords"},{"kind":"text","text":" venture."}]}]}]'),
        '$.section_order',
        json('["intro","past_work","latest_thoughts"]'),
        '$.mentions.build',
        json('{"label":"build","href":"/making","presentation":"facet"}'),
        '$.mentions.agents',
        json('{"label":"agents","href":"/systems","presentation":"facet"}'),
        '$.mentions.write',
        json('{"label":"write","href":"/writing","presentation":"facet"}'),
        '$.mentions.systems',
        json('{"label":"systems","href":"/systems","presentation":"facet"}'),
        '$.proof_cards[1].href',
        '/projects/quantercise'
      ),
      '$.sections.about'
    ),
    version = version + 1,
    updated_at = '2026-08-13T22:30:00Z',
    updated_by = 'codex',
    version_history = json_insert(
      COALESCE(version_history, '[]'),
      '$[#]',
      json_object(
        'event', 'public_identity_converged',
        'source', 'drizzle/migrations/0044_public_identity_systems.sql',
        'summary', 'Replaced the homepage about section with a compact agent-operator identity and linked identity facets.'
      )
    )
WHERE page_key = 'home';

INSERT OR REPLACE INTO page_content (
  id, page_key, content, version, published, updated_at, updated_by, created_at, version_history
) VALUES (
  'page-systems-v1-2026-08-13',
  'systems',
  '{"title":"systems","description":"the operating system behind how ani works with agents: clear targets, durable context, visible proof, and real stopping conditions.","hero_title":"systems","hero_summary":"the machinery behind how i work: a clear target, durable context, visible proof, and a real stopping condition.","principles_label":"the loop","principles":[{"label":"target","title":"name the finished state","detail":"the agent gets a concrete outcome, exact boundaries, and the evidence that will close the work."},{"label":"context","title":"make state durable","detail":"branches, task history, and handoffs preserve enough context for the work to survive a pause."},{"label":"proof","title":"inspect the real surface","detail":"tests prove code behavior. live routes, provider state, and receipts prove the outcome people experience."},{"label":"stop","title":"close the loop","detail":"a stopping condition keeps motion tied to the solution and makes the next action obvious."}],"writing_label":"field note","featured_writing":{"title":"awareness is alpha","href":"/writing/awareness-is-alpha","detail":"the working thesis behind the system: awareness keeps ownership intact while more execution moves through agents."},"tools_label":"public tools","public_tools":[{"title":"coding agent tips","href":"https://github.com/anipotts/coding-agent-tips","detail":"evidence-backed patterns for agents working in production software."},{"title":"imessage mcp","href":"/projects/imessage-mcp","detail":"a read-only local tool for exploring message history with agents."}]}',
  1,
  1,
  '2026-08-13T22:30:00Z',
  'codex',
  '2026-08-13T22:30:00Z',
  '[{"event":"seeded","source":"drizzle/migrations/0044_public_identity_systems.sql","summary":"Seeded the canonical systems page."}]'
);

UPDATE page_content
SET content = json_set(
      content,
      '$.summary',
      'quant interview practice with 400+ problems, instant grading, and sandboxed python.',
      '$.body',
      'i built quantercise from my own interview-prep workflow. it now combines 400+ quant problems, instant grading, a browser-based python editor, math rendering, progress tracking, and payments in one focused practice loop.'
    ),
    version = version + 1,
    updated_at = '2026-08-13T22:30:00Z',
    updated_by = 'codex',
    version_history = json_insert(
      COALESCE(version_history, '[]'),
      '$[#]',
      json_object(
        'event', 'public_copy_refined',
        'source', 'drizzle/migrations/0044_public_identity_systems.sql',
        'summary', 'Replaced stale implementation history and roadmap copy with the stable product story.'
      )
    )
WHERE page_key = 'project:quantercise';

UPDATE page_content
SET content = json_set(
      content,
      '$.preview',
      'business insider interviewed me about ai usage limits. the forced pauses sharpened my workflow.',
      '$.body',
      replace('A reporter from Business Insider reached out a couple weeks ago. He was writing about how usage limits on AI tools are changing the way people work. Somebody pointed him to me because I''ve been pretty vocal about how I use Claude Code. The article went live today.\n\nHe nailed the broad strokes. I do plan my work around session limits. I do save the hardest tasks for when I''m far from the cap. And yes, Saturdays are for Claude Code. That quote is real. I mean it when I say it to my friends.', '\n', char(10))
    ),
    version = version + 1,
    updated_at = '2026-08-13T22:30:00Z',
    updated_by = 'codex'
WHERE page_key = 'writing:saturdays-are-for-claude-code';

UPDATE page_content
SET content = json_set(
      content,
      '$.preview',
      'claudemon makes parallel claude code sessions visible from one dashboard.',
      '$.body',
      replace('At any given time I''ve got several Claude Code sessions running across different projects. One is on a side project, another is doing a refactor I kicked off before dinner, and another has already slipped out of my attention. I wanted one clear view of all of them.\n\nClaude Code gives each session its own terminal. Claudemon adds the missing dashboard: one live view of what every agent is doing.\n\nSo I started building something. I''m calling it Claudemon.', '\n', char(10))
    ),
    version = version + 1,
    updated_at = '2026-08-13T22:30:00Z',
    updated_by = 'codex'
WHERE page_key = 'writing:i-built-a-monitor-for-my-claude-code-sessions';

UPDATE page_content
SET content = json_set(
      content,
      '$.body',
      replace('I used to end my day with todos like "fix auth" and "clean up API" and then wake up the next morning having no idea what I actually meant.\n\nFix auth how? Which auth? The login flow? The token refresh? The middleware? I''d spend the first 20 minutes of my next session just rebuilding the context I had the night before.\n\nThis is 10x worse with Claude Code. A vague todo sends an AI coding agent searching for context, which costs tokens and time and often sends the session in the wrong direction entirely.', '\n', char(10))
    ),
    version = version + 1,
    updated_at = '2026-08-13T22:30:00Z',
    updated_by = 'codex'
WHERE page_key = 'writing:stop-ending-your-day-with-fix-the-bug';

UPDATE page_content
SET content = json_set(
      content,
      '$.preview',
      'search becomes infrastructure while agents, memory, retrieval, and synthesis become the interface.',
      '$.body',
      replace('Classic search assumes users can translate intent into keywords\n\nThe next interface assumes the system already understands intent from context and history\n\nWhat changes first:\n\n- query boxes become fallback UX\n- ranking systems become orchestration systems\n- links become evidence for synthesized answers\n\nSearch becomes infrastructure. Agents become the primary interaction model.', '\n', char(10))
    ),
    version = version + 1,
    updated_at = '2026-08-13T22:30:00Z',
    updated_by = 'codex'
WHERE page_key = 'writing:search-will-be-dead-by-2030';

UPDATE page_content
SET content = json_set(
      content,
      '$.body',
      'Built a read-only macOS MCP server for local iMessage search, contact stats, streaks, and private on-device analytics. Published on npm as a small local-first tool.'
    ),
    version = version + 1,
    updated_at = '2026-08-13T22:30:00Z',
    updated_by = 'codex'
WHERE page_key = 'project:imessage-mcp';

UPDATE page_content
SET content = json_set(
      content,
      '$.body',
      'Built a self-contained Chrome extension for keyboard-driven mental math practice. Includes sound feedback, progress tracking, and Manifest V3 packaging. Everything runs in the browser.'
    ),
    version = version + 1,
    updated_at = '2026-08-13T22:30:00Z',
    updated_by = 'codex'
WHERE page_key = 'project:quantercise-extension';

UPDATE page_content
SET content = json_set(
      content,
      '$.body',
      'Archived Convex and Clerk app that preserved shared context across multiple LLMs. It had shared-context caching, model routing, prompt-chain UI, and Stripe billing. The archive is a useful product snapshot.'
    ),
    version = version + 1,
    updated_at = '2026-08-13T22:30:00Z',
    updated_by = 'codex'
WHERE page_key = 'project:chainedchat';
