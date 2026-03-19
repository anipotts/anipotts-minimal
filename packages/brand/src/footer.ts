import { FONT_FACE, HOVER_COLOR, IG_URL, waitForFont } from "./shared";

const STYLES = `
  ${FONT_FACE}

  :host {
    display: block;
    position: relative;
    width: 100%;
    pointer-events: none;
  }

  :host([fixed]) {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
  }

  footer {
    text-align: center;
    padding: 1.5rem 1rem;
    pointer-events: auto;
  }

  a {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.6875rem;
    line-height: 1rem;
    letter-spacing: 0.02em;
    text-decoration: none;
    transition: color 150ms ease, opacity 300ms ease;
    opacity: 0;
    position: relative;
  }

  a.loaded { opacity: 1; }

  a::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    right: 0;
    height: 1px;
    background: ${HOVER_COLOR};
    transform: scaleX(0);
    transition: transform 200ms ease;
  }

  a:hover::after,
  a:focus-visible::after {
    transform: scaleX(1);
  }

  /* Dark variant (default) */
  :host([variant="dark"]) a,
  :host(:not([variant])) a {
    color: rgba(255, 255, 255, 0.3);
  }
  :host([variant="dark"]) a:hover,
  :host([variant="dark"]) a:focus-visible,
  :host(:not([variant])) a:hover,
  :host(:not([variant])) a:focus-visible {
    color: ${HOVER_COLOR};
  }

  /* Light variant */
  :host([variant="light"]) a {
    color: rgba(0, 0, 0, 0.25);
  }
  :host([variant="light"]) a:hover,
  :host([variant="light"]) a:focus-visible {
    color: ${HOVER_COLOR};
  }

  a:focus-visible {
    outline: 1px solid ${HOVER_COLOR};
    outline-offset: 4px;
    border-radius: 2px;
  }
`;

class AniPottsFooter extends HTMLElement {
  static observedAttributes = ["variant", "fixed", "z"];

  private shadow: ShadowRoot;
  private link: HTMLAnchorElement;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = STYLES;

    const footer = document.createElement("footer");
    this.link = document.createElement("a");
    this.link.href = IG_URL;
    this.link.target = "_blank";
    this.link.rel = "noopener noreferrer";
    this.link.textContent = "built by ani potts";
    footer.appendChild(this.link);

    this.shadow.appendChild(style);
    this.shadow.appendChild(footer);
  }

  connectedCallback() {
    const z = this.getAttribute("z");
    if (z) this.style.zIndex = z;
    waitForFont(this.link);
  }

  attributeChangedCallback(
    name: string,
    _old: string | null,
    val: string | null,
  ) {
    if (name === "z") {
      this.style.zIndex = val || "auto";
    }
  }
}

if (!customElements.get("ani-potts-footer")) {
  customElements.define("ani-potts-footer", AniPottsFooter);
}
