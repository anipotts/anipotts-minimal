const FONT_URL =
  "https://fonts.gstatic.com/s/jetbrainsmono/v21/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjPVmUsaaDhw.woff2";

const HOVER_COLOR = "#61abea";

const STYLES = `
  @font-face {
    font-family: 'JetBrains Mono';
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: url(${FONT_URL}) format('woff2');
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6,
      U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122,
      U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
  }

  :host {
    display: block;
    pointer-events: none;
  }

  header {
    pointer-events: auto;
  }

  /* Position variants */
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

  /* Fixed vs absolute */
  :host([fixed]) {
    position: fixed;
  }

  :host(:not([fixed])) {
    position: absolute;
  }

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

  a.loaded {
    opacity: 1;
  }

  /* Dark variant (default) — light text on dark bg */
  :host([variant="dark"]) a,
  :host(:not([variant])) a {
    color: rgba(255, 255, 255, 0.4);
  }

  :host([variant="dark"]) a:hover,
  :host([variant="dark"]) a:focus-visible,
  :host(:not([variant])) a:hover,
  :host(:not([variant])) a:focus-visible {
    color: ${HOVER_COLOR};
    text-shadow: 0 0 6px rgba(0, 0, 0, 0.4), 0 0 2px rgba(255, 255, 255, 0.1);
  }

  /* Light variant — dark text on light bg */
  :host([variant="light"]) a {
    color: rgba(0, 0, 0, 0.35);
  }

  :host([variant="light"]) a:hover,
  :host([variant="light"]) a:focus-visible {
    color: ${HOVER_COLOR};
    text-shadow: 0 0 6px rgba(255, 255, 255, 0.5), 0 0 2px rgba(255, 255, 255, 0.3);
  }

  a:focus-visible {
    outline: 1px solid ${HOVER_COLOR};
    outline-offset: 4px;
    border-radius: 2px;
  }

  @media (max-width: 640px) {
    :host {
      top: 2.5rem;
    }

    :host([position="top-left"]) header {
      padding-left: 1rem;
    }

    :host([position="top-right"]) header {
      padding-right: 1rem;
    }
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
    this.link.href = "https://instagram.com/anipottsbuilds";
    this.link.target = "_blank";
    this.link.rel = "noopener noreferrer";
    this.link.textContent = "ani potts";
    header.appendChild(this.link);

    this.shadow.appendChild(style);
    this.shadow.appendChild(header);
  }

  connectedCallback() {
    // Apply z-index from attribute
    const z = this.getAttribute("z");
    if (z) this.style.zIndex = z;

    // Fade in once font is ready
    document.fonts.ready.then(() => {
      this.link.classList.add("loaded");
    });

    // Fallback: show after 1.5s even if font fails
    setTimeout(() => {
      this.link.classList.add("loaded");
    }, 1500);
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
