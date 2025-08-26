// Thin adapter re-exporting shared global Debug (shared/assets/js/debug.js)
// Maintains previous TypeScript API surface for minimal refactor impact.
export type DebugCategory =
  | 'gameController'
  | 'chessBoard'
  | 'apiClient'
  | 'configManager'
  | 'chatManager'
  | 'moveValidation'
  | 'boardRendering'
  | 'userInput'
  | 'aiEngine';

declare global { interface Window { Debug: any } }

export class Debug {
  private static ensure(){
    if(!window.Debug){ console.warn('Shared Debug system not yet loaded. Include shared/assets/js/debug.js before main TS bundle.'); return false; }
    return true;
  }
  static init(){ /* no-op retained for compatibility */ }
  static onConfigChange(_cb: ()=>void){ /* shared system handles UI itself now */ }
  static log(cat:DebugCategory, ...args:any[]){ if(this.ensure()) window.Debug.log(cat, ...args); }
  static info(cat:DebugCategory, ...args:any[]){ if(this.ensure()) window.Debug.log(cat, ...args); }
  static warn(cat:DebugCategory, ...args:any[]){ if(this.ensure()) window.Debug.warn(cat, ...args); }
  static error(cat:DebugCategory, ...args:any[]){ if(this.ensure()) window.Debug.error(cat, ...args); }
  static enable(){ if(this.ensure()){ window.Debug.isEnabled=true; window.Debug.saveSettings(); window.Debug.updateUI(); } }
  static disable(){ if(this.ensure()){ window.Debug.isEnabled=false; window.Debug.saveSettings(); window.Debug.updateUI(); } }
  static toggle(){ if(this.ensure()){ window.Debug.isEnabled=!window.Debug.isEnabled; window.Debug.saveSettings(); window.Debug.updateUI(); } }
  static enableCategory(cat:DebugCategory){ if(this.ensure()){ window.Debug.categories[cat].enabled=true; window.Debug.saveSettings(); } }
  static disableCategory(cat:DebugCategory){ if(this.ensure()){ window.Debug.categories[cat].enabled=false; window.Debug.saveSettings(); } }
  static toggleCategory(cat:DebugCategory){ if(this.ensure()){ window.Debug.categories[cat].enabled=!window.Debug.categories[cat].enabled; window.Debug.saveSettings(); } }
  static testAllCategories(){
    if(!this.ensure()) return;
    Object.keys(window.Debug.categories).forEach(k=>{
      this.log(k as DebugCategory, 'Test message');
      this.warn(k as DebugCategory, 'Warn test');
      this.error(k as DebugCategory, 'Error test');
    });
  }
  static getConfig(){ if(!this.ensure()) return { enabled:false, categories:{} }; return { enabled: window.Debug.isEnabled, categories: Object.fromEntries(Object.entries(window.Debug.categories).map(([k,v]:any)=>[k,v.enabled])) }; }
}

// Expose legacy console helper
(window as any).debug = {
  enable: ()=> Debug.enable(),
  disable: ()=> Debug.disable(),
  toggle: ()=> Debug.toggle(),
  test: ()=> Debug.testAllCategories(),
  enableCategory: (c:DebugCategory)=> Debug.enableCategory(c),
  disableCategory: (c:DebugCategory)=> Debug.disableCategory(c),
  toggleCategory: (c:DebugCategory)=> Debug.toggleCategory(c),
  getConfig: ()=> Debug.getConfig()
};
