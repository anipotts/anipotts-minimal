"use strict";var AniPottsBrand=(()=>{var d="https://fonts.gstatic.com/s/jetbrainsmono/v21/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjPVmUsaaDhw.woff2",n="#61abea";var i="https://instagram.com/anipottsbuilds";var s=`
  @font-face {
    font-family: 'JetBrains Mono';
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: url(${d}) format('woff2');
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6,
      U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122,
      U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
  }
`,r=`
  :host([variant="dark"]) a,
  :host(:not([variant])) a {
    color: rgba(255, 255, 255, 0.4);
  }
  :host([variant="dark"]) a:hover,
  :host([variant="dark"]) a:focus-visible,
  :host(:not([variant])) a:hover,
  :host(:not([variant])) a:focus-visible {
    color: ${n};
    text-shadow: 0 0 6px rgba(0, 0, 0, 0.4), 0 0 2px rgba(255, 255, 255, 0.1);
  }
  :host([variant="light"]) a {
    color: rgba(0, 0, 0, 0.35);
  }
  :host([variant="light"]) a:hover,
  :host([variant="light"]) a:focus-visible {
    color: ${n};
    text-shadow: 0 0 6px rgba(255, 255, 255, 0.5), 0 0 2px rgba(255, 255, 255, 0.3);
  }
  a:focus-visible {
    outline: 1px solid ${n};
    outline-offset: 4px;
    border-radius: 2px;
  }
`;function h(e,t=1500){document.fonts.ready.then(()=>e.classList.add("loaded")),setTimeout(()=>e.classList.add("loaded"),t)}var p=`
  ${s}

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

  ${r}

  @media (max-width: 640px) {
    :host { top: 2.5rem; }
    :host([position="top-left"]) header { padding-left: 1rem; }
    :host([position="top-right"]) header { padding-right: 1rem; }
  }
`,o=class extends HTMLElement{constructor(){super(),this.shadow=this.attachShadow({mode:"open"});let t=document.createElement("style");t.textContent=p;let a=document.createElement("header");this.link=document.createElement("a"),this.link.href=i,this.link.target="_blank",this.link.rel="noopener noreferrer",this.link.textContent="ani potts",a.appendChild(this.link),this.shadow.appendChild(t),this.shadow.appendChild(a)}connectedCallback(){let t=this.getAttribute("z");t&&(this.style.zIndex=t),h(this.link)}attributeChangedCallback(t,a,l){t==="z"&&(this.style.zIndex=l||"50")}};o.observedAttributes=["position","variant","fixed","z"];customElements.get("ani-potts-header")||customElements.define("ani-potts-header",o);})();
