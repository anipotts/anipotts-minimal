"use strict";var AniPottsFooter=(()=>{var h="https://fonts.gstatic.com/s/jetbrainsmono/v21/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjPVmUsaaDhw.woff2",o="#61abea";var n="https://instagram.com/anipottsbuilds";var s=`
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
    color: ${o};
    text-shadow: 0 0 6px rgba(0, 0, 0, 0.4), 0 0 2px rgba(255, 255, 255, 0.1);
  }
  :host([variant="light"]) a {
    color: rgba(0, 0, 0, 0.35);
  }
  :host([variant="light"]) a:hover,
  :host([variant="light"]) a:focus-visible {
    color: ${o};
    text-shadow: 0 0 6px rgba(255, 255, 255, 0.5), 0 0 2px rgba(255, 255, 255, 0.3);
  }
  a:focus-visible {
    outline: 1px solid ${o};
    outline-offset: 4px;
    border-radius: 2px;
  }
`;function r(e,t=1500){document.fonts.ready.then(()=>e.classList.add("loaded")),setTimeout(()=>e.classList.add("loaded"),t)}var c=`
  ${s}

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
    background: ${o};
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
    color: ${o};
  }

  /* Light variant */
  :host([variant="light"]) a {
    color: rgba(0, 0, 0, 0.25);
  }
  :host([variant="light"]) a:hover,
  :host([variant="light"]) a:focus-visible {
    color: ${o};
  }

  a:focus-visible {
    outline: 1px solid ${o};
    outline-offset: 4px;
    border-radius: 2px;
  }
`,a=class extends HTMLElement{constructor(){super(),this.shadow=this.attachShadow({mode:"open"});let t=document.createElement("style");t.textContent=c;let i=document.createElement("footer");this.link=document.createElement("a"),this.link.href=n,this.link.target="_blank",this.link.rel="noopener noreferrer",this.link.textContent="built by ani potts",i.appendChild(this.link),this.shadow.appendChild(t),this.shadow.appendChild(i)}connectedCallback(){let t=this.getAttribute("z");t&&(this.style.zIndex=t),r(this.link)}attributeChangedCallback(t,i,l){t==="z"&&(this.style.zIndex=l||"auto")}};a.observedAttributes=["variant","fixed","z"];customElements.get("ani-potts-footer")||customElements.define("ani-potts-footer",a);})();
