import { FONT_FACE, BRAND_BLUE, IG_URL, waitForFont } from "./shared";

const STYLES = `
  ${FONT_FACE}

  :host {
    display: block;
    position: fixed;
    z-index: 40;
    pointer-events: none;
  }

  :host(:not([position])),
  :host([position="bottom-right"]) {
    bottom: 1rem;
    right: 1rem;
  }

  :host([position="bottom-left"]) {
    bottom: 1rem;
    left: 1rem;
  }

  :host([position="top-right"]) {
    top: 1rem;
    right: 1rem;
  }

  :host([position="top-left"]) {
    top: 1rem;
    left: 1rem;
  }

  a {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.625rem;
    font-weight: 400;
    text-decoration: none;
    opacity: 0;
    transition: opacity 300ms ease, color 150ms ease;
    pointer-events: auto;
    user-select: none;
  }

  a.loaded {
    opacity: 0.15;
  }

  a:hover {
    opacity: 1 !important;
    color: ${BRAND_BLUE} !important;
  }

  a:focus-visible {
    opacity: 1 !important;
    color: ${BRAND_BLUE} !important;
    outline: 1px solid ${BRAND_BLUE};
    outline-offset: 3px;
    border-radius: 2px;
  }

  /* Dark variant (default) */
  :host([variant="dark"]) a,
  :host(:not([variant])) a {
    color: rgba(255, 255, 255, 0.8);
  }

  /* Light variant */
  :host([variant="light"]) a {
    color: rgba(0, 0, 0, 0.6);
  }

  .tooltip {
    position: absolute;
    bottom: 100%;
    right: 0;
    margin-bottom: 6px;
    font-size: 0.625rem;
    white-space: nowrap;
    padding: 3px 8px;
    border-radius: 4px;
    opacity: 0;
    transform: translateY(4px);
    transition: opacity 150ms ease, transform 150ms ease;
    pointer-events: none;
  }

  :host([variant="dark"]) .tooltip,
  :host(:not([variant])) .tooltip {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.7);
  }

  :host([variant="light"]) .tooltip {
    background: rgba(0, 0, 0, 0.06);
    color: rgba(0, 0, 0, 0.5);
  }

  a:hover .tooltip {
    opacity: 1;
    transform: translateY(0);
  }
`;

class AniPottsWatermark extends HTMLElement {
  static observedAttributes = ["variant", "position", "z"];

  private shadow: ShadowRoot;
  private link: HTMLAnchorElement;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = STYLES;

    this.link = document.createElement("a");
    this.link.href = IG_URL;
    this.link.target = "_blank";
    this.link.rel = "noopener noreferrer";
    this.link.textContent = "AP";

    const tooltip = document.createElement("span");
    tooltip.className = "tooltip";
    tooltip.textContent = "built by ani potts";
    this.link.appendChild(tooltip);

    this.shadow.appendChild(style);
    this.shadow.appendChild(this.link);
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
      this.style.zIndex = val || "40";
    }
  }
}

if (!customElements.get("ani-potts-watermark")) {
  customElements.define("ani-potts-watermark", AniPottsWatermark);
}
