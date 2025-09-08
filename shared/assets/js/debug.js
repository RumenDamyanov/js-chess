/**
 * Shared Debug System for JS Chess frameworks
 * Lightweight (cookie-based) category toggling & panel.
 * Frameworks: vanilla-js, vanilla-ts, jQuery, Vue.
 */
;(function(){
  if(window.Debug) return; // Prevent redefining

  class DebugClass {
    static categories = {
      gameController: { enabled: false, description: 'Game state & flow control' },
      chessBoard: { enabled: false, description: 'Board rendering & interaction' },
      apiClient: { enabled: false, description: 'API communication' },
      configManager: { enabled: false, description: 'Configuration management' },
      chatManager: { enabled: false, description: 'Chat functionality' },
      moveValidation: { enabled: false, description: 'Move validation & rules' },
      boardRendering: { enabled: false, description: 'Visual board updates' },
      userInput: { enabled: false, description: 'User interaction handling' },
      aiEngine: { enabled: false, description: 'AI scheduling & moves' }
    }
    static isEnabled = false;
    static notificationTimeout = null;

    static init(){
      this.loadSettings();
      this.ensureButton();
      this.createOrSyncPanel();
      this.setupListeners();
      this.updateUI();
      this.showInitNotification();
    }

    static ensureButton(){
      let btn = document.getElementById('debug-btn');
      if(!btn){
        const headerControls = document.querySelector('.header-controls');
        if(!headerControls){
          // Retry after a short delay for frameworks like Vue that render asynchronously
          setTimeout(()=> this.ensureButton(), 100);
          return;
        }
        btn = document.createElement('button');
        btn.id='debug-btn';
        btn.className='btn btn-debug';
        btn.title='Toggle Debug';
        btn.textContent='🐛';
  btn.setAttribute('aria-haspopup','true');
  btn.setAttribute('aria-expanded','false');
  btn.setAttribute('aria-controls','debug-panel');
  btn.addEventListener('click', ()=> this.togglePanel());
        headerControls.appendChild(btn);
      }
    }

    static createOrSyncPanel(){
      let panel = document.getElementById('debug-panel');
      if(!panel){
  panel = document.createElement('div');
  panel.id='debug-panel';
  panel.className='debug-panel';
  panel.style.display='none';
  panel.setAttribute('role','dialog');
  panel.setAttribute('aria-modal','false');
  panel.setAttribute('aria-label','Debug panel');
  panel.setAttribute('tabindex','-1');
        document.body.appendChild(panel);
      }
      panel.innerHTML = this.panelHTML();
    }

    static panelHTML(){
      const cats = Object.entries(this.categories).map(([k,c])=>`<div class="debug-category"><label><input type="checkbox" data-cat="${k}" ${c.enabled?'checked':''} ${this.isEnabled?'':'disabled'}> <span class="debug-cat-name">${k}</span><span class="debug-cat-desc">${c.description}</span></label></div>`).join('');
  return `<div class="debug-header"><h3>🐛 Debug</h3><button class="debug-close" data-action="close">×</button></div><div class="debug-content"><div class="debug-master"><label><input type="checkbox" id="debug-master" ${this.isEnabled?'checked':''}> Enable Debug</label></div><div class="debug-categories">${cats}</div><div class="debug-actions"><button class="btn btn-small" data-action="enableAll">Enable All</button><button class="btn btn-small" data-action="disableAll">Disable All</button><button class="btn btn-small" data-action="clearConsole">Clear Console</button><button class="btn btn-small" data-action="testAll">Test All</button></div><div class="debug-info"><small>Settings persist via cookies. Use window.Debug.log(cat, ...) or console helper 'debug.*'.</small></div></div>`;
    }

    static setupListeners(){
      document.addEventListener('click', (e)=>{
        const t = e.target;
        if(!(t instanceof HTMLElement)) return;
        if(t.id==='debug-master'){
          this.isEnabled = t.checked; this.saveSettings(); this.updateUI(); this.showNotification(`Debug ${this.isEnabled?'enabled':'disabled'}`);
        } else if(t.dataset.action==='close'){ this.closePanel(); }
        else if(t.dataset.action==='enableAll'){ this.setAll(true); }
        else if(t.dataset.action==='disableAll'){ this.setAll(false); }
  else if(t.dataset.action==='clearConsole'){ console.clear(); this.showNotification('Console cleared'); }
  else if(t.dataset.action==='testAll'){ this.testAll(); }
      });
      document.addEventListener('change', (e)=>{
        const t = e.target;
        if(!(t instanceof HTMLInputElement)) return;
        if(t.dataset.cat){
          const cat = t.dataset.cat; this.categories[cat].enabled = t.checked; this.saveSettings(); this.showNotification(`${cat} ${t.checked?'on':'off'}`);
        }
      });
    }

    static setAll(state){
      Object.keys(this.categories).forEach(k=> this.categories[k].enabled = state);
      this.saveSettings();
      this.createOrSyncPanel();
      this.updateUI();
      this.showNotification(state? 'All enabled':'All disabled');
    }

  static togglePanel(){ const p=document.getElementById('debug-panel'); const btn=document.getElementById('debug-btn'); if(p){ const show=p.style.display==='none'; p.style.display= show?'block':'none'; if(btn) btn.setAttribute('aria-expanded', show?'true':'false'); if(show){ p.focus({preventScroll:true}); } } }
    static closePanel(){ const p=document.getElementById('debug-panel'); if(p) p.style.display='none'; }

    static loadSettings(){
      const master = this.getCookie('debug_enabled'); this.isEnabled = master==='true';
      Object.keys(this.categories).forEach(cat=>{ const v=this.getCookie('debug_'+cat); if(v!==null) this.categories[cat].enabled = v==='true'; });
    }
    static saveSettings(){ this.setCookie('debug_enabled', this.isEnabled); Object.entries(this.categories).forEach(([k,c])=> this.setCookie('debug_'+k, c.enabled)); }
    static getCookie(n){ const value = `; ${document.cookie}`; const parts=value.split(`; ${n}=`); if(parts.length===2) return parts.pop().split(';').shift(); return null; }
    static setCookie(name,value,days=365){ const ex=new Date(); ex.setTime(ex.getTime()+days*864e5); document.cookie = `${name}=${value};expires=${ex.toUTCString()};path=/`; }

    static updateUI(){ const btn=document.getElementById('debug-btn'); if(btn) btn.className=`btn btn-debug ${this.isEnabled?'debug-active':''}`; }
    static showNotification(msg){ if(this.notificationTimeout) clearTimeout(this.notificationTimeout); let n=document.getElementById('debug-notification'); if(!n){ n=document.createElement('div'); n.id='debug-notification'; n.className='debug-notification'; document.body.appendChild(n);} n.textContent=msg; n.style.display='block'; this.notificationTimeout=setTimeout(()=> n.style.display='none',3000); }
    static showInitNotification(){ if(!this.isEnabled) return; const enabledCats=Object.entries(this.categories).filter(([,c])=>c.enabled).map(([k])=>k); if(enabledCats.length) this.showNotification('Debug: '+enabledCats.join(', ')); }

    static log(category, ...args){ if(!this.isEnabled) return; const cat=this.categories[category]; if(!cat||!cat.enabled) return; const ts=new Date().toLocaleTimeString(); console.log(`[${ts}] [${category}]`, ...args); }
    static warn(category, ...args){ if(!this.isEnabled) return; const cat=this.categories[category]; if(!cat||!cat.enabled) return; const ts=new Date().toLocaleTimeString(); console.warn(`[${ts}] [${category}] WARN:`, ...args); }
    static error(category, ...args){ if(!this.isEnabled) return; const cat=this.categories[category]; if(!cat||!cat.enabled) return; const ts=new Date().toLocaleTimeString(); console.error(`[${ts}] [${category}] ERROR:`, ...args); }
  static testAll(){ const prev=this.isEnabled; if(!prev){ this.isEnabled=true; } Object.keys(this.categories).forEach(k=>{ this.categories[k].enabled=true; }); this.saveSettings(); Object.keys(this.categories).forEach(k=>{ this.log(k,'Test log'); this.warn(k,'Test warn'); this.error(k,'Test error'); }); this.showNotification('Test logs emitted'); this.createOrSyncPanel(); this.updateUI(); }
  }

  window.Debug = DebugClass;
  document.addEventListener('DOMContentLoaded', ()=> DebugClass.init());
  // Also try to initialize after a delay for frameworks that render asynchronously
  setTimeout(()=> { if(!document.getElementById('debug-btn')) DebugClass.init(); }, 500);
})();
