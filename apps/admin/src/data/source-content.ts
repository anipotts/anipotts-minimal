import {
  recordsFromSourceModules,
  summarizeSourceContentRecords,
} from "@anipotts/content/admin";

const projectModules = import.meta.glob<string>(
  "../../../www/src/content/projects/*.md",
  {
    eager: true,
    import: "default",
    query: "?raw",
  },
);

const writingModules = import.meta.glob<string>(
  "../../../www/src/content/writing/*.md",
  {
    eager: true,
    import: "default",
    query: "?raw",
  },
);

export const sourceContentRecords = [
  ...recordsFromSourceModules("projects", projectModules),
  ...recordsFromSourceModules("writing", writingModules),
];

export const sourceContentSummary =
  summarizeSourceContentRecords(sourceContentRecords);
