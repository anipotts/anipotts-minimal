#!/usr/bin/env node

import { readFileSync } from "node:fs";

export function hasCurrentApproval(input, expectedSha, expectedActor) {
  const reviews = Array.isArray(input) ? input : input.reviews || [];
  const comments = Array.isArray(input) ? [] : input.comments || [];
  const latestByActor = new Map();
  for (const review of reviews) {
    if (!review?.user?.login || !review.submitted_at) continue;
    const current = latestByActor.get(review.user.login);
    if (!current || current.submitted_at < review.submitted_at) {
      latestByActor.set(review.user.login, review);
    }
  }
  const review = latestByActor.get(expectedActor);
  if (review?.state === "APPROVED" && review?.commit_id === expectedSha) {
    return true;
  }
  const command = `/approve-release ${expectedSha}`;
  return comments.some(
    (comment) =>
      comment?.user?.login === expectedActor &&
      comment?.author_association === "OWNER" &&
      comment?.body?.trim() === command,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [reviewsPath, expectedSha, expectedActor = "anipotts"] =
    process.argv.slice(2);
  if (!reviewsPath || !expectedSha) {
    console.error(
      "usage: current-sha-approval.mjs <reviews-json> <sha> [actor]",
    );
    process.exit(2);
  }
  const evidence = JSON.parse(readFileSync(reviewsPath, "utf8"));
  if (!hasCurrentApproval(evidence, expectedSha, expectedActor)) {
    console.error(
      `exact approval from ${expectedActor} is required for ${expectedSha}`,
    );
    process.exit(1);
  }
  console.log(`approval_actor=${expectedActor}`);
  console.log(`approval_sha=${expectedSha}`);
}
