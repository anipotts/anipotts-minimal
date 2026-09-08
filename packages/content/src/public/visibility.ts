export function isPublicProject(record: { public_state?: unknown }): boolean {
  return record.public_state === "featured" || record.public_state === "listed";
}

export function isPublishedWriting(record: { status?: unknown }): boolean {
  return record.status === "published";
}
