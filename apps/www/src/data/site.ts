export const siteConfig = {
  name: "Ani Potts",
  title: "agent systems + product",
  location: "NYC",
  bio: "i build with agents and write about the systems that keep the work coherent.",
  shortBio: "ani potts, nyc",
  url: "https://anipotts.com",
  domain: "anipotts.com",
  email: "contact@anipotts.com",
  handle: "@anipottsbuilds",
  github: "anipotts",
  ogImage: "/og-image.png",
  headshot: "/images/ani-potts-headshot.png",
  version: "4.0.0",
} as const;

export const navItems = [
  { name: "making", path: "/making" },
  { name: "writing", path: "/writing" },
  { name: "systems", path: "/systems" },
  { name: "contact", path: "/#contact" },
] as const;
