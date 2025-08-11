(function(){
  const STORAGE_KEY = 'jschess-theme';
  const root = document.documentElement;

  function applyTheme(theme){
    if(theme === 'light') {
      root.setAttribute('data-theme','light');
    } else if(theme === 'dark') {
      root.setAttribute('data-theme','dark');
    } else {
      root.removeAttribute('data-theme');
    }
  }

  function getPreferred(){
    const stored = localStorage.getItem(STORAGE_KEY);
    if(stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function toggle(){
    const current = root.getAttribute('data-theme') || getPreferred();
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
    updateButton(next);
  }

  function updateButton(theme){
    const btn = document.getElementById('theme-toggle-btn');
    if(!btn) return;
    btn.textContent = theme === 'dark' ? '☀️ Light' : '🌙 Dark';
    btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }

  // Init
  const initial = getPreferred();
  applyTheme(initial);
  requestAnimationFrame(()=>updateButton(initial));

  // Expose
  window.JSChessTheme = { toggle, apply: applyTheme };
})();
