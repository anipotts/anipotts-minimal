# site open PR triage, 2026-06-24

Archived: 2026-06-27.

This triage packet is historical. The stale branches and PRs it discussed have
been closed, absorbed, or deleted.

## PR #72, admin-solid fleet dashboard MVP

PR: https://github.com/anipotts/anipotts.com/pull/72

State:

- draft
- stale
- merge-conflicted against current main
- original checks were green on 2026-06-24
- touched `apps/admin-solid` dashboard shell files that have since been
  superseded by merged control-plane work

Recommendation:

- close as superseded after this admin content-inventory branch lands
- do not merge or refresh directly
- useful intent has already been absorbed into the live read-only control-plane
  direction through PRs #75, #76, #77, and #78
- any remaining visual/sidebar ideas should be reimplemented from current main,
  not conflict-resolved from PR #72

## PR #73, public site links and homepage cards

PR: https://github.com/anipotts/anipotts.com/pull/73

State:

- draft
- old but small
- original checks were green on 2026-06-23
- current main still has the `/claude` writing link and the same homepage making
  selection that PR #73 changes

Recommendation:

- keep parked unless Ani wants that small public cleanup to deploy
- if wanted, refresh or cherry-pick the two-line diff onto current main and open
  a clean PR
- do not merge the stale draft as-is without rerunning checks

## current site direction

Admin work should continue from current main with read-only operator dashboard
slices. The next shipped implementation should be `/content`, a read-only
public-site content inventory that exposes source refs and editability
candidates without any save, publish, sync, or outbound-send path.
