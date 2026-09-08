import { sourceContentRecordsFromProjection } from "@anipotts/content/admin";
import adminPublicContent from "../../../../packages/content/generated/admin-public-content.json";

export const sourceContentRecords = sourceContentRecordsFromProjection(
  adminPublicContent.source_records,
);
