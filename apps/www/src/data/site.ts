export const siteConfig = {
  name: "Ani Potts",
  fullName: "Anirudh Pottammal",
  title: "Software Engineer",
  location: "NYC",
  bio: "ani potts. previously worked on real-time agent i/o at structured ai (YC F25) and our bad habit.",
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
  { name: "writing", path: "/writing" },
  { name: "making", path: "/making" },
  { name: "orchestrating", path: "/orchestrating" },
] as const;
