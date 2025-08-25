/**
 * TypeScript adapter: delegates to shared pgn-core (JSChessPGNSavesCore) for PGN & save logic.
 * Keeps same public initPGNSaves API for existing bootstrap code.
 */
import { GameController } from './game-controller.js';

declare global { interface Window { JSChessPGNSavesCore?: any; __tsPGNSavesManager?: any; initPGNSaves?: (c:GameController)=>void; } }

export function initPGNSaves(controller: GameController){
  const w = window as Window;
  if(w.__tsPGNSavesManager) return;
  if(!w.JSChessPGNSavesCore){
    console.warn('[PGN] Core script not yet loaded; deferring init');
    // Defer until DOMContentLoaded then retry once
    document.addEventListener('DOMContentLoaded', ()=> {
      if(!w.__tsPGNSavesManager && w.JSChessPGNSavesCore){ initPGNSaves(controller); }
    }, { once: true });
    return;
  }
  w.__tsPGNSavesManager = w.JSChessPGNSavesCore.createManager({
    saveKey: 'tsSaveSlotsV1',
    autosaveKey: 'tsAutosaveV1',
    getGame: ()=>({
      gameId: controller.getGameId(),
      gameState: controller.getGameState(),
      api: (controller as any)['apiClient'],
      currentFEN: controller.getGameState()?.fen,
      startNewGame: (opts:any)=> controller.startNewGame(opts),
      updateBoard: ()=>{}, updateGameInfo: ()=>{}, updateMoveHistory: ()=>{}
    }),
    getPlayerName: ()=> (window as any).JSChessPlayer?.getName?.() || controller.getConfig().playerName || 'Player',
    getOrientation: ()=> controller.getConfig().playerColor,
    setOrientation: (color:string)=>{ const select=document.getElementById('player-color') as HTMLSelectElement | null; if(select){ select.value=color; select.dispatchEvent(new Event('change')); } },
    showMessage: (msg:string,type:string)=> (window as any).JSChessMessages?.showMessage(msg,type,{duration:2000})
  });
  // Hook controller events to core manager
  controller.on('gameStateChanged', ()=>{ w.__tsPGNSavesManager.handleMoveChange(); });
  controller.on('gameStarted', ()=>{ w.__tsPGNSavesManager.markReady(); });
}

window.initPGNSaves = initPGNSaves;
export {};
