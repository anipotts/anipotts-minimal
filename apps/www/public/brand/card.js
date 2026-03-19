"use strict";var AniPottsCard=(()=>{var f="https://fonts.gstatic.com/s/jetbrainsmono/v21/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjPVmUsaaDhw.woff2",d="#61abea",r="#61abea",h="https://instagram.com/anipottsbuilds",p="https://anipotts.com",m=`
  @font-face {
    font-family: 'JetBrains Mono';
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: url(${f}) format('woff2');
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6,
      U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122,
      U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
  }
`,u=`
  :host([variant="dark"]) a,
  :host(:not([variant])) a {
    color: rgba(255, 255, 255, 0.4);
  }
  :host([variant="dark"]) a:hover,
  :host([variant="dark"]) a:focus-visible,
  :host(:not([variant])) a:hover,
  :host(:not([variant])) a:focus-visible {
    color: ${d};
    text-shadow: 0 0 6px rgba(0, 0, 0, 0.4), 0 0 2px rgba(255, 255, 255, 0.1);
  }
  :host([variant="light"]) a {
    color: rgba(0, 0, 0, 0.35);
  }
  :host([variant="light"]) a:hover,
  :host([variant="light"]) a:focus-visible {
    color: ${d};
    text-shadow: 0 0 6px rgba(255, 255, 255, 0.5), 0 0 2px rgba(255, 255, 255, 0.3);
  }
  a:focus-visible {
    outline: 1px solid ${d};
    outline-offset: 4px;
    border-radius: 2px;
  }
`;function b(c,t=1500){document.fonts.ready.then(()=>c.classList.add("loaded")),setTimeout(()=>c.classList.add("loaded"),t)}var g=`
  ${m}

  :host {
    display: inline-block;
    max-width: 320px;
    width: 100%;
  }

  .card {
    border-left: 3px solid ${r};
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
    color: ${r};
  }

  .links a:focus-visible {
    outline: 1px solid ${r};
    outline-offset: 3px;
    border-radius: 2px;
  }
`,s=class extends HTMLElement{constructor(){super(),this.shadow=this.attachShadow({mode:"open"});let t=document.createElement("style");t.textContent=g,this.card=document.createElement("div"),this.card.className="card";let o=document.createElement("p");o.className="name",o.textContent="ani potts";let l=document.createElement("p");l.className="bio",l.textContent=this.getAttribute("bio")||"building things on the internet";let a=document.createElement("div");a.className="links";let e=document.createElement("a");e.href=h,e.target="_blank",e.rel="noopener noreferrer",e.textContent="ig";let n=document.createElement("a");n.href=p,n.target="_blank",n.rel="noopener noreferrer",n.textContent="site";let i=document.createElement("a");i.href="https://github.com/anipotts",i.target="_blank",i.rel="noopener noreferrer",i.textContent="gh",a.appendChild(e),a.appendChild(n),a.appendChild(i),this.card.appendChild(o),this.card.appendChild(l),this.card.appendChild(a),this.shadow.appendChild(t),this.shadow.appendChild(this.card)}connectedCallback(){let t=this.getAttribute("bio");if(t){let o=this.card.querySelector(".bio");o&&(o.textContent=t)}b(this.card)}};s.observedAttributes=["variant"];customElements.get("ani-potts-card")||customElements.define("ani-potts-card",s);})();
