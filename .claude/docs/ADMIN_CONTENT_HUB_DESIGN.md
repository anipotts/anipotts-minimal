# Admin Content Hub Design
## Unified Cross-Platform Publishing for anipotts.com
*Design Document - January 2026*

---

## Current State

### What You Have
- **thoughts.anipotts.com** - Supabase-powered blog
- **Admin at /admin** - Two tabs: Monitor + Editor
- **ContentManager.tsx** - CRUD for thoughts
- **Fields**: id, slug, title, summary, content, tags, published, views

### What You Want
1. Draft content once, publish everywhere
2. Tag content by project (Quantercise, personal, etc.)
3. Cross-post to: Substack, Medium, Dev.to, LinkedIn, Twitter
4. Unified interface to manage all content
5. Track what's published where

---

## Proposed Architecture

### New Database Schema

```sql
-- Enhanced thoughts table
CREATE TABLE thoughts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT NOT NULL, -- Markdown

  -- New fields for content hub
  project TEXT, -- 'quantercise', 'personal', 'paragon', null
  content_type TEXT DEFAULT 'article', -- 'article', 'thread', 'note'

  -- Publishing status per platform
  published_anipotts BOOLEAN DEFAULT false,
  published_substack BOOLEAN DEFAULT false,
  published_medium BOOLEAN DEFAULT false,
  published_devto BOOLEAN DEFAULT false,
  published_linkedin BOOLEAN DEFAULT false,
  published_twitter BOOLEAN DEFAULT false,

  -- External URLs (after publishing)
  url_substack TEXT,
  url_medium TEXT,
  url_devto TEXT,
  url_linkedin TEXT,
  url_twitter TEXT,

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  canonical_url TEXT, -- For SEO
  featured_image TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ, -- When first published anywhere

  -- Analytics
  views INTEGER DEFAULT 0
);

-- Platform credentials (encrypted)
CREATE TABLE platform_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT UNIQUE NOT NULL, -- 'substack', 'medium', etc.
  credentials JSONB, -- Encrypted tokens/keys
  enabled BOOLEAN DEFAULT false,
  last_synced TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Publishing history
CREATE TABLE publish_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thought_id UUID REFERENCES thoughts(id),
  platform TEXT NOT NULL,
  status TEXT, -- 'success', 'failed', 'pending'
  external_url TEXT,
  error_message TEXT,
  published_at TIMESTAMPTZ DEFAULT NOW()
);
```

### API Integrations

#### 1. Substack (Limited API)
- **Status**: No public API
- **Workaround**: Email-to-post (Substack supports posting via email)
- **Alternative**: Manual copy-paste with formatting preserved

#### 2. Medium API
- **Status**: Official API available
- **Endpoint**: `https://api.medium.com/v1/`
- **Auth**: OAuth2 or Integration Token
- **Capabilities**: Create posts, get user info
```typescript
// Medium API integration
const publishToMedium = async (thought: Thought) => {
  const response = await fetch(`https://api.medium.com/v1/users/${userId}/posts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MEDIUM_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: thought.title,
      contentFormat: 'markdown',
      content: thought.content,
      tags: thought.tags,
      canonicalUrl: `https://thoughts.anipotts.com/${thought.slug}`,
      publishStatus: 'public'
    })
  });
  return response.json();
};
```

#### 3. Dev.to API
- **Status**: Full API available
- **Endpoint**: `https://dev.to/api/`
- **Auth**: API Key
- **Capabilities**: Full CRUD
```typescript
// Dev.to API integration
const publishToDevTo = async (thought: Thought) => {
  const response = await fetch('https://dev.to/api/articles', {
    method: 'POST',
    headers: {
      'api-key': DEVTO_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      article: {
        title: thought.title,
        body_markdown: thought.content,
        published: true,
        tags: thought.tags.slice(0, 4), // Dev.to max 4 tags
        canonical_url: `https://thoughts.anipotts.com/${thought.slug}`
      }
    })
  });
  return response.json();
};
```

#### 4. LinkedIn API
- **Status**: Limited (Share API only)
- **Endpoint**: `https://api.linkedin.com/v2/shares`
- **Auth**: OAuth2
- **Capabilities**: Share posts (not full articles)
```typescript
// LinkedIn Share API
const shareToLinkedIn = async (thought: Thought) => {
  // LinkedIn requires UGC Posts API for longer content
  const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LINKEDIN_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      author: `urn:li:person:${LINKEDIN_USER_ID}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: `${thought.title}\n\n${thought.summary}\n\nRead more: https://thoughts.anipotts.com/${thought.slug}`
          },
          shareMediaCategory: 'ARTICLE',
          media: [{
            status: 'READY',
            originalUrl: `https://thoughts.anipotts.com/${thought.slug}`
          }]
        }
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
    })
  });
  return response.json();
};
```

#### 5. Twitter/X API
- **Status**: API v2 available (paid tiers)
- **Endpoint**: `https://api.twitter.com/2/tweets`
- **Auth**: OAuth2
- **Capabilities**: Post tweets, threads
```typescript
// Twitter/X API for threads
const postToTwitter = async (thought: Thought, contentType: 'link' | 'thread') => {
  if (contentType === 'link') {
    // Simple link share
    return twitterClient.v2.tweet({
      text: `${thought.title}\n\n${thought.summary}\n\nhttps://thoughts.anipotts.com/${thought.slug}`
    });
  } else {
    // Thread from content
    const tweets = splitIntoThread(thought.content);
    // Post as thread...
  }
};
```

---

## New Admin UI Design

### Tab Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  ADMIN_ROOT  │ Monitor │ Editor │ Publish │ Platforms │ Stats  │
└─────────────────────────────────────────────────────────────────┘
```

#### Tab 1: Monitor (existing)
- Analytics dashboard
- Recent views
- Traffic sources

#### Tab 2: Editor (enhanced)
- Same markdown editor
- **New**: Project selector dropdown
- **New**: Content type selector (article/thread/note)
- **New**: Featured image upload

#### Tab 3: Publish (NEW)
- List all drafts ready to publish
- Platform checkboxes for each
- One-click "Publish to All"
- Status indicators (published/pending/failed)

#### Tab 4: Platforms (NEW)
- Connect/disconnect platforms
- OAuth flows for each
- API key management
- Test connection buttons

#### Tab 5: Stats (NEW)
- Cross-platform analytics
- Which posts perform best where
- Engagement comparison

### New Publish Tab UI

```tsx
// apps/thoughts/src/app/admin/PublishManager.tsx

export default function PublishManager() {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [publishing, setPublishing] = useState<Record<string, boolean>>({});

  const platforms = [
    { id: 'anipotts', name: 'thoughts.anipotts.com', icon: '🏠', enabled: true },
    { id: 'substack', name: 'Substack', icon: '📧', enabled: false },
    { id: 'medium', name: 'Medium', icon: '📝', enabled: true },
    { id: 'devto', name: 'Dev.to', icon: '👩‍💻', enabled: true },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼', enabled: true },
    { id: 'twitter', name: 'Twitter/X', icon: '🐦', enabled: true },
  ];

  const handlePublish = async (thoughtId: string, platformIds: string[]) => {
    setPublishing({ ...publishing, [thoughtId]: true });

    for (const platformId of platformIds) {
      try {
        await publishToPlatform(thoughtId, platformId);
      } catch (error) {
        console.error(`Failed to publish to ${platformId}:`, error);
      }
    }

    setPublishing({ ...publishing, [thoughtId]: false });
  };

  return (
    <div className="space-y-4">
      <h2>Ready to Publish</h2>

      {thoughts.filter(t => !t.published_anipotts).map(thought => (
        <div key={thought.id} className="border rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3>{thought.title}</h3>
              <p className="text-sm text-gray-500">{thought.summary}</p>
              {thought.project && (
                <span className="badge">{thought.project}</span>
              )}
            </div>

            <div className="flex gap-2">
              {platforms.map(platform => (
                <button
                  key={platform.id}
                  disabled={!platform.enabled || thought[`published_${platform.id}`]}
                  onClick={() => handlePublish(thought.id, [platform.id])}
                  className={`p-2 rounded ${
                    thought[`published_${platform.id}`]
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {platform.icon}
                  {thought[`published_${platform.id}`] && '✓'}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => handlePublish(thought.id, platforms.filter(p => p.enabled).map(p => p.id))}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
          >
            Publish to All
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## Implementation Plan

### Phase 1: Database & Backend (Week 1)
1. Update Supabase schema with new fields
2. Create publish_history table
3. Create platform_credentials table
4. Add new server actions for publishing

### Phase 2: Platform Integrations (Week 2)
1. Implement Medium API integration
2. Implement Dev.to API integration
3. Implement Twitter/X API integration
4. Implement LinkedIn Share API
5. Create OAuth flows for each

### Phase 3: Admin UI (Week 3)
1. Add Publish tab to AdminCommandCenter
2. Add Platforms tab for credential management
3. Add project selector to Editor
4. Add publishing status indicators

### Phase 4: Automation & Polish (Week 4)
1. Add scheduled publishing
2. Add content repurposing (article → thread)
3. Add cross-platform analytics
4. Add canonical URL handling for SEO

---

## Quick Start: What You Can Do Now

### Step 1: Update Supabase Table
Run this migration in Supabase SQL editor:

```sql
-- Add new columns to existing thoughts table
ALTER TABLE thoughts
ADD COLUMN IF NOT EXISTS project TEXT,
ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'article',
ADD COLUMN IF NOT EXISTS published_substack BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS published_medium BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS published_devto BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS published_linkedin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS published_twitter BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS url_substack TEXT,
ADD COLUMN IF NOT EXISTS url_medium TEXT,
ADD COLUMN IF NOT EXISTS url_devto TEXT,
ADD COLUMN IF NOT EXISTS url_linkedin TEXT,
ADD COLUMN IF NOT EXISTS url_twitter TEXT,
ADD COLUMN IF NOT EXISTS canonical_url TEXT,
ADD COLUMN IF NOT EXISTS featured_image TEXT,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
```

### Step 2: Get API Keys
- **Medium**: https://medium.com/me/settings/security → Integration tokens
- **Dev.to**: https://dev.to/settings/extensions → Generate API Key
- **Twitter**: https://developer.twitter.com/en/portal/dashboard
- **LinkedIn**: https://www.linkedin.com/developers/apps

### Step 3: Store in .env.local
```bash
MEDIUM_TOKEN=your_medium_token
DEVTO_API_KEY=your_devto_key
TWITTER_BEARER_TOKEN=your_twitter_token
LINKEDIN_ACCESS_TOKEN=your_linkedin_token
```

---

## Content Strategy Integration

### Tagging System for Projects

```typescript
const PROJECT_TAGS = {
  quantercise: {
    label: 'Quantercise',
    color: 'blue',
    defaultTags: ['quant', 'interview', 'finance', 'probability'],
  },
  paragon: {
    label: 'Paragon Global',
    color: 'green',
    defaultTags: ['investing', 'startup'],
  },
  personal: {
    label: 'Personal',
    color: 'purple',
    defaultTags: ['life', 'thoughts'],
  },
  technical: {
    label: 'Technical',
    color: 'orange',
    defaultTags: ['programming', 'engineering'],
  },
};
```

### Content Type Formatting

| Type | Primary Platform | Secondary | Format |
|------|-----------------|-----------|--------|
| Article | thoughts.anipotts.com | Medium, Dev.to | Full markdown |
| Thread | Twitter | LinkedIn | 280-char chunks |
| Note | Twitter | - | Single tweet |

---

## Security Considerations

1. **API keys stored encrypted** in Supabase (use vault or encrypt)
2. **OAuth tokens refreshed** automatically
3. **Rate limiting** respected for each platform
4. **Audit log** of all publish actions
5. **Rollback capability** (unpublish if needed)

---

## Cost Analysis

| Platform | API Cost | Notes |
|----------|----------|-------|
| Medium | Free | 500 posts/month limit |
| Dev.to | Free | Unlimited |
| Twitter | $100/mo | Basic API access |
| LinkedIn | Free | 100 posts/day limit |
| Substack | Free | No API (manual) |

**Total**: ~$100/month for Twitter API (optional)

---

*This design document is ready for implementation. Start with Phase 1 (database) while you manually cross-post, then automate incrementally.*
