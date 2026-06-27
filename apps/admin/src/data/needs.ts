import syscallNeedsJson from "./static/needs-ani.syscalls.json";

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

export const needsAniItems = syscallNeedsJson as NeedsAniItem[];

export const needsAniBuckets: Array<{
  bucket: NeedBucket;
  title: string;
  detail: string;
}> = [
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
