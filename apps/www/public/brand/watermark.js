"use strict";var AniPottsWatermark=(()=>{var h="https://fonts.gstatic.com/s/jetbrainsmono/v21/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjPVmUsaaDhw.woff2",i="#61abea",a="#61abea",s="https://instagram.com/anipottsbuilds";var r=`
  @font-face {
    font-family: 'JetBrains Mono';
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: url(${h}) format('woff2');
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6,
      U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122,
      U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
  }
`,d=`
  :host([variant="dark"]) a,
  :host(:not([variant])) a {
    color: rgba(255, 255, 255, 0.4);
  }
  :host([variant="dark"]) a:hover,
  :host([variant="dark"]) a:focus-visible,
  :host(:not([variant])) a:hover,
  :host(:not([variant])) a:focus-visible {
    color: ${i};
    text-shadow: 0 0 6px rgba(0, 0, 0, 0.4), 0 0 2px rgba(255, 255, 255, 0.1);
  }
  :host([variant="light"]) a {
    color: rgba(0, 0, 0, 0.35);
  }
  :host([variant="light"]) a:hover,
  :host([variant="light"]) a:focus-visible {
    color: ${i};
    text-shadow: 0 0 6px rgba(255, 255, 255, 0.5), 0 0 2px rgba(255, 255, 255, 0.3);
  }
  a:focus-visible {
    outline: 1px solid ${i};
    outline-offset: 4px;
    border-radius: 2px;
  }
`;function l(n,t=1500){document.fonts.ready.then(()=>n.classList.add("loaded")),setTimeout(()=>n.classList.add("loaded"),t)}var c=`
  ${r}

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
    color: ${a} !important;
  }

  a:focus-visible {
    opacity: 1 !important;
    color: ${a} !important;
    outline: 1px solid ${a};
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
`,e=class extends HTMLElement{constructor(){super(),this.shadow=this.attachShadow({mode:"open"});let t=document.createElement("style");t.textContent=c,this.link=document.createElement("a"),this.link.href=s,this.link.target="_blank",this.link.rel="noopener noreferrer",this.link.textContent="AP";let o=document.createElement("span");o.className="tooltip",o.textContent="built by ani potts",this.link.appendChild(o),this.shadow.appendChild(t),this.shadow.appendChild(this.link)}connectedCallback(){let t=this.getAttribute("z");t&&(this.style.zIndex=t),l(this.link)}attributeChangedCallback(t,o,p){t==="z"&&(this.style.zIndex=p||"40")}};e.observedAttributes=["variant","position","z"];customElements.get("ani-potts-watermark")||customElements.define("ani-potts-watermark",e);})();
