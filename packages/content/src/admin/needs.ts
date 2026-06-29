export type NeedType =
  | "approve"
  | "choose"
  | "provide"
  | "perform"
  | "review-delete";

export type NeedBucket =
  | "unblockable_now"
  | "waiting_on_account_or_device"
  | "review_delete_packets";

export type NeedsAniItem = {
  id: string;
  type: NeedType;
  bucket: NeedBucket;
  owner: string;
  status: "open" | "closed";
  why: string;
  ani_action: string;
  agent_next: string;
  primary_action: string;
  proof: string;
  source: string;
  expires_stale: string;
  requires_ani: boolean;
};

export type NeedsAniBucketGroup = {
  bucket: NeedBucket;
  title: string;
  detail: string;
};

const needTypes = new Set<NeedType>([
  "approve",
  "choose",
  "provide",
  "perform",
  "review-delete",
]);

const needBuckets = new Set<NeedBucket>([
  "unblockable_now",
  "waiting_on_account_or_device",
  "review_delete_packets",
]);

export const needsAniBuckets: NeedsAniBucketGroup[] = [
  {
    bucket: "unblockable_now",
    title: "unblockable now",
    detail: "decisions that let a chief continue immediately",
  },
  {
    bucket: "waiting_on_account_or_device",
    title: "account or device",
    detail: "requires local auth, account UI, or a device-side step",
  },
  {
    bucket: "review_delete_packets",
    title: "review delete",
    detail: "source or local cleanup choices with proof requirements",
  },
];

export function needsAniItemsFromJson(value: unknown): NeedsAniItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isNeedsAniItem);
}

function isNeedsAniItem(value: unknown): value is NeedsAniItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;

  return (
    isString(item.id) &&
    isNeedType(item.type) &&
    isNeedBucket(item.bucket) &&
    isString(item.owner) &&
    (item.status === "open" || item.status === "closed") &&
    isString(item.why) &&
    isString(item.ani_action) &&
    isString(item.agent_next) &&
    isString(item.primary_action) &&
    isString(item.proof) &&
    isString(item.source) &&
    isString(item.expires_stale) &&
    typeof item.requires_ani === "boolean"
  );
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNeedType(value: unknown): value is NeedType {
  return isString(value) && needTypes.has(value as NeedType);
}

function isNeedBucket(value: unknown): value is NeedBucket {
  return isString(value) && needBuckets.has(value as NeedBucket);
}
