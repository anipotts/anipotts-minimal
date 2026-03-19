import {
  FONT_FACE,
  BRAND_BLUE,
  IG_URL,
  PORTFOLIO_URL,
  waitForFont,
} from "./shared";

const STYLES = `
  ${FONT_FACE}

  :host {
    display: inline-block;
    max-width: 320px;
    width: 100%;
  }

  .card {
    border-left: 3px solid ${BRAND_BLUE};
    padding: 1rem 1.25rem;
    border-radius: 0 8px 8px 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    opacity: 0;
    transition: opacity 400ms ease;
  }

  .card.loaded { opacity: 1; }

  :host([variant="dark"]) .card,
  :host(:not([variant])) .card {
    background: rgba(255, 255, 255, 0.04);
  }

  :host([variant="light"]) .card {
    background: rgba(0, 0, 0, 0.025);
  }

  .name {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.9375rem;
    font-weight: 400;
    margin: 0 0 0.25rem;
  }

  :host([variant="dark"]) .name,
  :host(:not([variant])) .name {
    color: rgba(255, 255, 255, 0.9);
  }

  :host([variant="light"]) .name {
    color: rgba(0, 0, 0, 0.85);
  }

  .bio {
    font-size: 0.8125rem;
    line-height: 1.4;
    margin: 0 0 0.75rem;
  }

  :host([variant="dark"]) .bio,
  :host(:not([variant])) .bio {
    color: rgba(255, 255, 255, 0.5);
  }

  :host([variant="light"]) .bio {
    color: rgba(0, 0, 0, 0.45);
  }

  .links {
    display: flex;
    gap: 0.75rem;
  }

  .links a {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.6875rem;
    text-decoration: none;
    transition: color 150ms ease;
  }

  :host([variant="dark"]) .links a,
  :host(:not([variant])) .links a {
    color: rgba(255, 255, 255, 0.35);
  }

  :host([variant="light"]) .links a {
    color: rgba(0, 0, 0, 0.3);
  }

  .links a:hover,
  .links a:focus-visible {
    color: ${BRAND_BLUE};
  }

  .links a:focus-visible {
    outline: 1px solid ${BRAND_BLUE};
    outline-offset: 3px;
    border-radius: 2px;
  }
`;

class AniPottsCard extends HTMLElement {
  static observedAttributes = ["variant"];

  private shadow: ShadowRoot;
  private card: HTMLDivElement;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = STYLES;

    this.card = document.createElement("div");
    this.card.className = "card";

    const name = document.createElement("p");
    name.className = "name";
    name.textContent = "ani potts";

    const bio = document.createElement("p");
    bio.className = "bio";
    bio.textContent =
      this.getAttribute("bio") || "building things on the internet";

    const links = document.createElement("div");
    links.className = "links";

    const igLink = document.createElement("a");
    igLink.href = IG_URL;
    igLink.target = "_blank";
    igLink.rel = "noopener noreferrer";
    igLink.textContent = "ig";

    const siteLink = document.createElement("a");
    siteLink.href = PORTFOLIO_URL;
    siteLink.target = "_blank";
    siteLink.rel = "noopener noreferrer";
    siteLink.textContent = "site";

    const ghLink = document.createElement("a");
    ghLink.href = "https://github.com/anipotts";
    ghLink.target = "_blank";
    ghLink.rel = "noopener noreferrer";
    ghLink.textContent = "gh";

    links.appendChild(igLink);
    links.appendChild(siteLink);
    links.appendChild(ghLink);

    this.card.appendChild(name);
    this.card.appendChild(bio);
    this.card.appendChild(links);

    this.shadow.appendChild(style);
    this.shadow.appendChild(this.card);
  }

  connectedCallback() {
    const bio = this.getAttribute("bio");
    if (bio) {
      const bioEl = this.card.querySelector(".bio");
      if (bioEl) bioEl.textContent = bio;
    }
    waitForFont(this.card);
  }
}

if (!customElements.get("ani-potts-card")) {
  customElements.define("ani-potts-card", AniPottsCard);
}
