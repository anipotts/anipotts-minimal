import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { projectSchema, writingSchema } from "@anipotts/content/public/schema";

export const collections = {
  writing: defineCollection({
    loader: glob({ pattern: "*.md", base: "../../content/public/writing" }),
    schema: writingSchema,
  }),
  projects: defineCollection({
    loader: glob({ pattern: "*.md", base: "../../content/public/projects" }),
    schema: projectSchema,
  }),
};
