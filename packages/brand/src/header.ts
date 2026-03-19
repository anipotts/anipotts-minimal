import {
  FONT_FACE,
  HOVER_COLOR,
  IG_URL,
  VARIANT_STYLES,
  waitForFont,
} from "./shared";

const STYLES = `
  ${FONT_FACE}

  :host {
    display: block;
    pointer-events: none;
  }

  header {
    pointer-events: auto;
  }

  :host([position="top-center"]) header,
  :host(:not([position])) header {
    text-align: center;
  }

  :host([position="top-left"]) header {
    text-align: left;
    padding-left: 1.5rem;
  }

  :host([position="top-right"]) header {
    text-align: right;
    padding-right: 1.5rem;
  }

  :host([fixed]) { position: fixed; }
  :host(:not([fixed])) { position: absolute; }

  :host {
    top: 2rem;
    left: 0;
    right: 0;
    z-index: 50;
  }

  a {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.875rem;
    line-height: 1.25rem;
    text-decoration: none;
    transition: color 150ms ease, text-shadow 150ms ease, opacity 300ms ease;
    opacity: 0;
  }

  a.loaded { opacity: 1; }

  ${VARIANT_STYLES}

  @media (max-width: 640px) {
    :host { top: 2.5rem; }
    :host([position="top-left"]) header { padding-left: 1rem; }
    :host([position="top-right"]) header { padding-right: 1rem; }
  }
`;

class AniPottsHeader extends HTMLElement {
  static observedAttributes = ["position", "variant", "fixed", "z"];

  private shadow: ShadowRoot;
  private link: HTMLAnchorElement;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = STYLES;

    const header = document.createElement("header");
    this.link = document.createElement("a");
    this.link.href = IG_URL;
    this.link.target = "_blank";
    this.link.rel = "noopener noreferrer";
    this.link.textContent = "ani potts";
    header.appendChild(this.link);

    this.shadow.appendChild(style);
    this.shadow.appendChild(header);
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
      this.style.zIndex = val || "50";
    }
  }
}

if (!customElements.get("ani-potts-header")) {
  customElements.define("ani-potts-header", AniPottsHeader);
}
