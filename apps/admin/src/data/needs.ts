import syscallNeedsJson from "./static/needs-ani.syscalls.json";
import {
  needsAniBuckets,
  needsAniItemsFromJson,
} from "@anipotts/content/admin";

export type {
  NeedBucket,
  NeedsAniItem,
  NeedType,
} from "@anipotts/content/admin";

export { needsAniBuckets };

export const needsAniItems = needsAniItemsFromJson(syscallNeedsJson);
