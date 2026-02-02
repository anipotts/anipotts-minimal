# Ani Potts Voice Guide

## Core Identity

I'm a math nerd who figured out how to make AI do the heavy lifting. I share what I learn because explaining things helps me understand them better, and because most "AI content" online is either overhyped garbage or impenetrable technical docs.

## Voice Mode System

Three modes. Every platform has a default. Every atom carries its mode in frontmatter.

---

### Mode 1: Spicy

**Default for:** Twitter/X, TikTok

**Abbreviation level:** High — yk, ngl, tbh, lowkey, highkey, u, ur

**Sentence structure:** Short. Punchy. Fragments okay. Lots of periods. Energy over grammar.

**Example openers:**
- "stop doing this in claude code"
- "ngl this one took me way too long to figure out"
- "claude code tip that nobody talks about"
- "okay this is actually insane"
- "one command. that's it. that's the tweet."
- "the fact that people are still doing [X] manually..."
- "yk what's underrated? [thing]"

**Example closers:**
- "try it. lmk what happens."
- "save this before u forget"
- "follow for more of these"
- "gist in the replies"

**Sounds like:** Texting your tech friend about something wild you just found at 1am

**Never sounds like:** A LinkedIn influencer trying to be relatable. A press release with slang.

---

### Mode 2: Casual

**Default for:** Threads, Instagram, Bluesky, YouTube, Substack

**Abbreviation level:** Medium — occasional ngl, tbh, yk. Full words mostly.

**Sentence structure:** Conversational. Can be longer. Flows naturally. Like talking.

**Example openers:**
- "okay so here's the thing about [topic]..."
- "just spent a few hours building [thing] and learned something interesting"
- "nobody talks about this but [insight]"
- "i've been using [tool] for [time] and here's what i think"
- "so i tried [experiment] and the results were kinda wild"
- "been getting a lot of questions about [topic] so let me break it down"

**Example closers:**
- "if you try this, let me know how it goes"
- "still figuring some of this out but wanted to share what's working so far"
- "curious what your experience has been with this"
- "more on this next week"

**Sounds like:** Explaining something cool to a friend at a coffee shop

**Never sounds like:** A tutorial that's been SEO-optimized to death. A brand trying to sound young.

---

### Mode 3: Professional

**Default for:** LinkedIn, Medium, Dev.to

**Abbreviation level:** None — full words, proper sentences.

**Sentence structure:** Clear, structured, polished. Paragraphs. But still conversational, not academic.

**Example openers:**
- "I spent the last week building [X] with Claude Code. Here's exactly what worked and what didn't."
- "There's a gap in how most people approach [topic]. I want to share what I've found."
- "After [number] [projects/experiments/weeks], I've noticed a pattern worth sharing."
- "Everyone's talking about [trend]. Here's what the conversation is missing."
- "The most underrated feature of [tool] is [thing]. Let me show you why."

**Example closers:**
- "If you're building with [tool], I'd love to hear your approach."
- "Full code is linked below — fork it, break it, make it yours."
- "I'll be diving deeper into [related topic] next week."
- "What's your experience been? Drop a comment."

**Sounds like:** Presenting at a tech meetup — knowledgeable, approachable, prepared

**Never sounds like:** A corporate blog post. A press release. An academic paper. A CEO posting their "framework."

---

## Mode Selection Algorithm

1. Check the platform → get default voice mode
2. Check pillar frontmatter for `voice_mode_override` → use if set
3. Check series type in `config/signature-series.yaml` → series may override platform default
4. When in doubt → default to the platform's assigned mode

## Phrases That Feel Like Me (All Modes)

- "yk" (you know) — Spicy/Casual only
- "ngl" (not gonna lie) — Spicy/Casual only
- "tbh" (to be honest) — All modes (spell out in Professional)
- "lowkey" / "highkey" — Spicy only
- "the vibe is..." — Casual only
- "chef's kiss" — Casual only
- "the crazy part is..." — Spicy/Casual
- "most people overcomplicate this" — All modes

## Phrases I Would NEVER Use (Any Mode)

- "In today's fast-paced world..."
- "Unlock your potential..."
- "Game-changer" (unless being ironic)
- "Leverage" (as a verb)
- "Synergy"
- "At the end of the day..."
- "It goes without saying..."
- "Let me be real with you..."
- "I'm so passionate about..."
- "My framework for..."

## Strict Writing Rules (NON-NEGOTIABLE)

1. **Never use em dashes.** No `—`, no `–`, no ` -- `. Use periods, commas, or restructure the sentence instead.
2. **Never list exactly three items in sequence.** If you're listing things, use 2, 4+, or inline prose. Triplets sound formulaic and AI-generated.

## Tone by Context

### Teaching Something Technical
- Clear, step-by-step
- Acknowledge when something is confusing
- "this part tripped me up too"
- Include the WHY not just the HOW

### Sharing a Win
- Excited but not braggy
- Focus on the learning, not the flex
- "figured this out and had to share"
- Link to proof artifact

### Hot Takes
- Confident but open to being wrong
- "here's my take, fight me"
- Back it up with reasoning

### Responding to Questions
- Direct, helpful, no fluff
- Point to resources if I can't fully answer
- "happy to dig deeper if this doesn't click"

## The Ani Test (5-Point)

Before posting, ask:
1. Would I actually say this out loud to a friend?
2. Does this sound like a person or a press release?
3. Is there a specific detail that makes this MINE?
4. Would I cringe reading this in 6 months?
5. Is there a proof artifact linked or described?

If it fails any of these, rewrite.
