// PGN generation, save slots, autosave & import for vanilla JS version
(function(){
  const SAVE_KEY='vanillaSaveSlotsV1';
  const AUTOSAVE_KEY='vanillaAutosaveV1';
  let saveSlots={};
  let chessReady = false; // becomes true once initial gameId detected (first game started)
  function loadSlots(){
    try{ saveSlots=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}')||{} }catch{ saveSlots={} }
    updateSlotLabels();
  }
  function persistSlots(){ localStorage.setItem(SAVE_KEY, JSON.stringify(saveSlots)) }
  function snapshot(){
    // Consider a game "active" if a gameId exists even if gameState not yet populated (race on init)
    if(!window.chessGame || !window.chessGame.gameId) return null;
    const gs = window.chessGame.gameState || {};
    return {
      gameId: window.chessGame.gameId,
      move_history: gs.move_history || [],
      status: gs.status || 'unknown',
      active_color: gs.active_color || 'white',
      whiteTime: window.gameConfig?.timers.white||0,
      blackTime: window.gameConfig?.timers.black||0,
      orientation: window.gameConfig?.getPlayerColor?.()||'white',
  fen: gs.fen || window.chessGame?.currentFEN || '',
      savedAt: Date.now()
    };
  }
  function generatePGN(){
    if(!window.chessGame?.gameState?.move_history?.length){ setPGN(''); return }
    const playerName = window.JSChessPlayer?.getName?.() || 'Player';
    const text = window.JSChessPGN.build(window.chessGame.gameState, { white: playerName, black: 'AI' });
    setPGN(text);
  }
  function setPGN(text){
    const out=document.getElementById('pgn-output');
    if(out){ out.value=text; }
    const disabled=!text;
    ['pgn-copy-btn','pgn-download-btn','pgn-refresh-btn'].forEach(id=>{
      const btn=document.getElementById(id); if(btn) btn.disabled=disabled;
    });
  }
  function copyPGN(){ const out=document.getElementById('pgn-output'); if(!out||!out.value) return; navigator.clipboard.writeText(out.value).then(()=> message('PGN copied','success')); }
  // Fallback copy (older browsers)
  function legacyCopy(text){
    const ta=document.createElement('textarea'); ta.style.position='fixed'; ta.style.opacity='0'; ta.value=text; document.body.appendChild(ta); ta.select(); try{ document.execCommand('copy'); }catch{} document.body.removeChild(ta); }
  function copyPGN(){ const out=document.getElementById('pgn-output'); if(!out||!out.value) return; (navigator.clipboard?navigator.clipboard.writeText(out.value).catch(()=>legacyCopy(out.value)):legacyCopy(out.value)); message('PGN copied','success'); }
  function downloadPGN(){ const out=document.getElementById('pgn-output'); if(!out||!out.value) return; const blob=new Blob([out.value],{type:'text/plain'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`game-${Date.now()}.pgn`; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),2000); message('PGN downloaded','info'); }
  function refreshPGN(){ generatePGN(); message('PGN regenerated','info'); }
  function updateSlotLabels(){ for(let i=1;i<=3;i++){ const el=document.getElementById(`slot-${i}-time`); if(!el) continue; const data=saveSlots[i]; if(!data){ el.textContent='Empty'; } else { const d=new Date(data.savedAt); el.textContent=d.toLocaleTimeString(); } } }
  function updateSlotButtonsState(){
    const allBtns = document.querySelectorAll('.save-slots button[data-action]');
    allBtns.forEach(btn=>{
      if(!chessReady){ btn.disabled=true; return; }
      const slot = btn.getAttribute('data-slot');
      const action = btn.getAttribute('data-action');
      const hasData = !!saveSlots[slot];
      if(action==='save'){
        btn.disabled=false; // always allow save once ready
      } else { // load/delete
        btn.disabled=!hasData;
      }
    });
  }
  function saveSlot(n){
    // Active if gameId exists
    if(!window.chessGame || !window.chessGame.gameId){ message('No active game','error'); return; }
    if(saveSlots[n] && !confirm(`Overwrite slot ${n}?`)) return;
    const snap = snapshot();
    if(!snap){ message('Nothing to save','warning'); return; }
    saveSlots[n]=snap; persistSlots(); updateSlotLabels(); generatePGN(); message(`Saved to slot ${n}`,'success');
    updateSlotButtonsState();
  }
  async function loadSlot(n){ const data=saveSlots[n]; if(!data){ message('Empty slot','warning'); return;} message(`Loading slot ${n}...`,'info');
    // Apply orientation before creating the game so AI color logic matches
    if(data.orientation && window.gameConfig){
      document.getElementById('player-color').value=data.orientation;
      window.gameConfig.config.playerColor=data.orientation;
      window.gameConfig.updateBoardOrientation();
      window.gameConfig.updateOrientationIndicator();
    }
    await window.chessGame.startNewGame({suppressAIMove:true});
    for(const mv of data.move_history){
      try {
        await window.chessGame.api.makeMove(window.chessGame.gameId,{from:mv.from,to:mv.to});
        const st=await window.chessGame.api.getGame(window.chessGame.gameId);
        window.chessGame.gameState=st; window.chessGame.currentFEN=st.fen;
        window.chessGame.updateBoard(); window.chessGame.updateGameInfo(); window.chessGame.updateMoveHistory();
      } catch(e){ Debug && Debug.warn && Debug.warn('slotReplay','Replay move failed', mv, e); break; }
    }
    window.gameConfig.timers.white=data.whiteTime||0; window.gameConfig.timers.black=data.blackTime||0; window.gameConfig.updateTimerDisplay(); if(data.orientation && window.gameConfig.getPlayerColor()!==data.orientation){ document.getElementById('player-color').value=data.orientation; window.gameConfig.config.playerColor=data.orientation; window.gameConfig.updateBoardOrientation(); window.gameConfig.updateOrientationIndicator(); }
    generatePGN(); message(`Slot ${n} loaded`,'success'); }
  function deleteSlot(n){ if(!saveSlots[n]) return; if(!confirm(`Delete slot ${n}?`)) return; delete saveSlots[n]; persistSlots(); updateSlotLabels(); updateSlotButtonsState(); message(`Slot ${n} deleted`,'info'); }
  function autosave(){ const snap=snapshot(); if(!snap) return; localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(snap)); }
  function tryRestoreAutosave(){ try{ const raw=localStorage.getItem(AUTOSAVE_KEY); if(!raw) return; const data=JSON.parse(raw); if(!data.move_history?.length) return; message('Restoring autosave...','info'); (async()=>{
      if(data.orientation && window.gameConfig){
        document.getElementById('player-color').value=data.orientation;
        window.gameConfig.config.playerColor=data.orientation;
        window.gameConfig.updateBoardOrientation();
        window.gameConfig.updateOrientationIndicator();
      }
      await window.chessGame.startNewGame({suppressAIMove:true});
      for(const mv of data.move_history){
        try {
          await window.chessGame.api.makeMove(window.chessGame.gameId,{from:mv.from,to:mv.to});
          const st=await window.chessGame.api.getGame(window.chessGame.gameId); window.chessGame.gameState=st; window.chessGame.currentFEN=st.fen; window.chessGame.updateBoard(); window.chessGame.updateGameInfo(); window.chessGame.updateMoveHistory();
        } catch(e){ Debug && Debug.warn && Debug.warn('autosaveReplay','Replay move failed', mv, e); break; }
      }
      window.gameConfig.timers.white=data.whiteTime||0; window.gameConfig.timers.black=data.blackTime||0; window.gameConfig.updateTimerDisplay(); if(data.orientation && window.gameConfig.getPlayerColor()!==data.orientation){ document.getElementById('player-color').value=data.orientation; window.gameConfig.config.playerColor=data.orientation; window.gameConfig.updateBoardOrientation(); window.gameConfig.updateOrientationIndicator(); }
      generatePGN(); message('Autosave restored','success'); })(); }catch{} }
  function message(msg,type='info'){ if(window.JSChessMessages){ window.JSChessMessages.showMessage(msg,type,{duration:2000}); } }
  function handleMoveChange(){ generatePGN(); autosave(); }
  function bindUI(){
    const copyBtn=document.getElementById('pgn-copy-btn'); if(copyBtn) copyBtn.addEventListener('click',copyPGN);
    const dlBtn=document.getElementById('pgn-download-btn'); if(dlBtn) dlBtn.addEventListener('click',downloadPGN);
    const refBtn=document.getElementById('pgn-refresh-btn'); if(refBtn) refBtn.addEventListener('click',refreshPGN);
    document.querySelectorAll('.save-slots button[data-action]').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        const slot=parseInt(btn.getAttribute('data-slot'),10);
        const action=btn.getAttribute('data-action');
        if(action==='save') saveSlot(slot); else if(action==='load') loadSlot(slot); else if(action==='delete') deleteSlot(slot);
      });
    });
    const importToggle=document.getElementById('pgn-import-toggle');
    const importPanel=document.getElementById('pgn-import-panel');
    const importInput=document.getElementById('pgn-import-input');
    const importRun=document.getElementById('pgn-import-run');
    const importClear=document.getElementById('pgn-import-clear');
  if(importToggle){ importToggle.addEventListener('click',()=>{ const opening=importPanel.style.display==='none'; importPanel.style.display= opening ? 'block':'none'; importToggle.textContent= opening ? 'Close':'Import'; importToggle.setAttribute('aria-expanded', opening ? 'true':'false'); }); }
    if(importInput){ importInput.addEventListener('input',()=>{ const has=!!importInput.value.trim(); importRun.disabled=!has; importClear.disabled=!has; }); }
    if(importClear){ importClear.addEventListener('click',()=>{ importInput.value=''; importRun.disabled=true; importClear.disabled=true; }); }
    if(importRun){ importRun.addEventListener('click',()=>importPGN(importInput.value.trim())); }
  }
  async function importPGN(text){
    if(!text) return; const moves = window.JSChessPGN.parseCoordinateMoves(text);
    if(!moves.length){ message('No importable moves','error'); return }
    await window.chessGame.startNewGame({suppressAIMove:true});
    for(const mv of moves){
      try {
        await window.chessGame.api.makeMove(window.chessGame.gameId,{from:mv.slice(0,2),to:mv.slice(2,4)});
        const st=await window.chessGame.api.getGame(window.chessGame.gameId); window.chessGame.gameState=st; window.chessGame.currentFEN=st.fen; window.chessGame.updateBoard(); window.chessGame.updateGameInfo(); window.chessGame.updateMoveHistory();
      } catch(e){ Debug && Debug.warn && Debug.warn('importReplay','Replay move failed', mv, e); break; }
    }
    generatePGN(); message('PGN imported','success'); const panel=document.getElementById('pgn-import-panel'); if(panel) panel.style.display='none'; const toggle=document.getElementById('pgn-import-toggle'); if(toggle) toggle.textContent='Import'; const input=document.getElementById('pgn-import-input'); if(input) input.value='';
  }
  // Hook into game updates by monkey patching updateMoveHistory once
  const origUpdateMoveHistory=ChessGame.prototype.updateMoveHistory;
  ChessGame.prototype.updateMoveHistory=function(){ origUpdateMoveHistory.apply(this,arguments); handleMoveChange(); };
  const origStartNew=ChessGame.prototype.startNewGame;
  ChessGame.prototype.startNewGame=async function(){ await origStartNew.apply(this,arguments); chessReady=true; updateSlotButtonsState(); handleMoveChange(); };
  document.addEventListener('DOMContentLoaded',()=>{
    loadSlots();
    bindUI();
    updateSlotButtonsState();
    tryRestoreAutosave();
    // Detect already-started game (initial startNewGame happened before patch)
    const readyCheck = setInterval(()=>{
      if(window.chessGame && window.chessGame.gameId){
        if(!chessReady){ chessReady=true; handleMoveChange(); updateSlotButtonsState(); }
        clearInterval(readyCheck);
      }
    },150);
    setTimeout(()=>clearInterval(readyCheck), 5000); // safety stop
  });
})();
