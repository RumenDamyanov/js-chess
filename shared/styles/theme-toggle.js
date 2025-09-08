// Lightweight theme toggle shared across apps (idempotent)
(function(){
	if(window.JSChessTheme) return;
	const STORAGE_KEY='jschess-theme';
	const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
	let current = localStorage.getItem(STORAGE_KEY) || 'dark'; // Default to dark mode

	function apply(theme){
		current = theme === 'dark' ? 'dark' : 'light';
		if(current==='dark') document.documentElement.setAttribute('data-theme','dark');
		else document.documentElement.removeAttribute('data-theme');
		localStorage.setItem(STORAGE_KEY,current);
		const btn=document.getElementById('theme-toggle-btn');
		if(btn){
			btn.textContent = current==='dark' ? '☀️' : '🌙'; // Icon-only buttons
			btn.setAttribute('aria-label', current==='dark' ? 'Switch to light mode' : 'Switch to dark mode');
		}
	}

	window.JSChessTheme = {
		toggle(){ apply(current==='dark'?'light':'dark'); },
		set: apply,
		get(){ return current; }
	};

	document.addEventListener('DOMContentLoaded', ()=> apply(current));
})();
