import { THEME_STORAGE_KEY } from "../theme-constants";

/**
 * Inline script to prevent flash of wrong theme (FOWT).
 * Reads localStorage before first paint and applies .dark class if needed.
 * This is a server component — no "use client" directive.
 */
export function ThemeScript() {
  const script = `
(function(){
  try {
    var t = localStorage.getItem('${THEME_STORAGE_KEY}');
    var d = 'dark';
    if (t === 'light') d = '';
    else if (t === 'system') d = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : '';
    if (d) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  } catch(e) {
    document.documentElement.classList.add('dark');
  }
})()`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
