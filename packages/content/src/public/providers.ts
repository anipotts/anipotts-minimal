export interface WorkflowProvider {
  label: string;
  icon?: string;
  image?: string;
  darkImage?: string;
  mono?: boolean;
}
export const workflowProviders: Record<string, WorkflowProvider> = {
  messages: {
    label: "Messages",
    image: "/brand/sources/messages.png",
  },
  gmail: { label: "Gmail", icon: "logos:google-gmail" },
  calendar: { label: "Google Calendar", icon: "logos:google-calendar" },
  notes: { label: "Apple Notes", image: "/brand/sources/notes.png" },
  youtube: { label: "YouTube", icon: "logos:youtube-icon" },
  x: { label: "X", icon: "simple-icons:x", mono: true },
  instagram: {
    label: "Instagram",
    image: "/brand/sources/instagram.jpg",
  },
  chrome: { label: "Chrome", icon: "logos:chrome" },
  linkedin: { label: "LinkedIn", image: "/brand/sources/linkedin.jpg" },
  spotify: { label: "Spotify", image: "/brand/sources/spotify.jpg" },
  whatsapp: { label: "WhatsApp", image: "/brand/sources/whatsapp.jpg" },
  granola: { label: "Granola", image: "/brand/sources/granola.png" },
  mercury: { label: "Mercury", image: "/brand/sources/mercury.jpg" },
  stripe: { label: "Stripe", image: "/brand/sources/stripe.jpg" },
  "mac-mini": { label: "Mac mini", image: "/brand/sources/mac-mini.png" },
  github: { label: "GitHub", icon: "simple-icons:github", mono: true },
  linear: { label: "Linear", icon: "simple-icons:linear", mono: true },
  tailscale: { label: "Tailscale", icon: "simple-icons:tailscale", mono: true },
  "1password": {
    label: "1Password",
    image: "/brand/sources/1password.png",
  },
  obsidian: { label: "Obsidian", image: "/brand/sources/obsidian.svg" },
  codex: {
    label: "Codex",
    image: "/brand/sources/codex-light.png",
    darkImage: "/brand/sources/codex.png",
  },
  claude: { label: "Claude Code", icon: "logos:claude-icon" },
};
