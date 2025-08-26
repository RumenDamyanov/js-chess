// Shared PGN + Save Slots + Autosave + Import core
// Provides a framework-agnostic manager used by vanilla and jQuery variants.
// Each app supplies adapter callbacks for game operations & orientation handling.
(function(){
  if(window.JSChessPGNSavesCore) return; // idempotent

  function createManager(cfg){
    const {
      saveKey, autosaveKey,
      getGame, getPlayerName,
      getOrientation, setOrientation,
      showMessage
    } = cfg;

    let saveSlots = {};
    let chessReady = false;

    function loadSlots(){
      try { saveSlots = JSON.parse(localStorage.getItem(saveKey)||'{}')||{}; } catch { saveSlots = {}; }
      updateSlotLabels();
    }
    function persistSlots(){ localStorage.setItem(saveKey, JSON.stringify(saveSlots)); }

    function snapshot(){
      const game = getGame();
      if(!game || !game.gameId) return null;
      const gs = game.gameState || {};
      return {
        gameId: game.gameId,
        move_history: gs.move_history || [],
        status: gs.status || 'unknown',
        active_color: gs.active_color || 'white',
        whiteTime: window.gameConfig?.timers.white || 0,
        blackTime: window.gameConfig?.timers.black || 0,
        orientation: getOrientation(),
        fen: gs.fen || game.currentFEN || '',
        savedAt: Date.now()
      };
    }

    function generatePGN(){
      const game = getGame();
      if(!game?.gameState?.move_history?.length){ setPGN(''); return; }
      const playerName = getPlayerName();
      const text = window.JSChessPGN?.build ? window.JSChessPGN.build(game.gameState, { white: playerName, black: 'AI' }) : '';
      setPGN(text);
    }
    function setPGN(text){
      const out = document.getElementById('pgn-output');
      if(out) out.value = text;
      const disabled = !text;
      ['pgn-copy-btn','pgn-download-btn','pgn-refresh-btn'].forEach(id=>{
        const btn=document.getElementById(id); if(btn) btn.disabled=disabled;
      });
    }

    function legacyCopy(text){
      const ta=document.createElement('textarea'); ta.style.position='fixed'; ta.style.opacity='0'; ta.value=text; document.body.appendChild(ta); ta.select();
      try{ document.execCommand('copy'); }catch{}
      document.body.removeChild(ta);
    }
    function copyPGN(){ const out=document.getElementById('pgn-output'); if(!out||!out.value) return; (navigator.clipboard?navigator.clipboard.writeText(out.value).catch(()=>legacyCopy(out.value)):legacyCopy(out.value)); showMessage && showMessage('PGN copied','success'); }
    function downloadPGN(){ const out=document.getElementById('pgn-output'); if(!out||!out.value) return; const blob=new Blob([out.value],{type:'text/plain'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`game-${Date.now()}.pgn`; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),2000); showMessage && showMessage('PGN downloaded','info'); }
    function refreshPGN(){ generatePGN(); showMessage && showMessage('PGN regenerated','info'); }

    function updateSlotLabels(){ for(let i=1;i<=3;i++){ const el=document.getElementById(`slot-${i}-time`); if(!el) continue; const data=saveSlots[i]; el.textContent = data ? new Date(data.savedAt).toLocaleTimeString() : 'Empty'; } }
    function updateSlotButtonsState(){ document.querySelectorAll('.save-slots button[data-action]').forEach(btn=>{ if(!chessReady){ btn.disabled=true; return; } const slot=btn.getAttribute('data-slot'); const action=btn.getAttribute('data-action'); const has=!!saveSlots[slot]; if(action==='save') btn.disabled=false; else btn.disabled=!has; }); }

    function saveSlot(n){ const game=getGame(); if(!game||!game.gameId){ showMessage && showMessage('No active game','error'); return; } if(saveSlots[n] && !confirm(`Overwrite slot ${n}?`)) return; const snap=snapshot(); if(!snap){ showMessage && showMessage('Nothing to save','warning'); return; } saveSlots[n]=snap; persistSlots(); updateSlotLabels(); generatePGN(); showMessage && showMessage(`Saved to slot ${n}`,'success'); updateSlotButtonsState(); }

    async function replayMoves(moves){
      const game=getGame(); if(!game) return;
      for(const mv of moves){
        try {
          await game.api.makeMove(game.gameId,{from:mv.from,to:mv.to});
          const st=await game.api.getGame(game.gameId);
          game.gameState=st; game.currentFEN=st.fen;
          game.updateBoard && game.updateBoard();
          game.updateGameInfo && game.updateGameInfo();
          game.updateMoveHistory && game.updateMoveHistory();
        } catch(e){ window.Debug && Debug.warn && Debug.warn('replay','Replay move failed', mv, e); break; }
      }
    }

    async function loadSlot(n){ const data=saveSlots[n]; if(!data){ showMessage && showMessage('Empty slot','warning'); return; } showMessage && showMessage(`Loading slot ${n}...`,'info'); if(data.orientation) setOrientation(data.orientation); await getGame().startNewGame({suppressAIMove:true}); await replayMoves(data.move_history||[]); window.gameConfig && (window.gameConfig.timers.white=data.whiteTime||0, window.gameConfig.timers.black=data.blackTime||0, window.gameConfig.updateTimerDisplay&&window.gameConfig.updateTimerDisplay()); generatePGN(); showMessage && showMessage(`Slot ${n} loaded`,'success'); }
    function deleteSlot(n){ if(!saveSlots[n]) return; if(!confirm(`Delete slot ${n}?`)) return; delete saveSlots[n]; persistSlots(); updateSlotLabels(); updateSlotButtonsState(); showMessage && showMessage(`Slot ${n} deleted`,'info'); }

    function autosave(){ const snap=snapshot(); if(!snap) return; localStorage.setItem(autosaveKey, JSON.stringify(snap)); }
    function tryRestoreAutosave(){ try{ const raw=localStorage.getItem(autosaveKey); if(!raw) return; const data=JSON.parse(raw); if(!data.move_history?.length) return; showMessage && showMessage('Restoring autosave...','info'); (async()=>{ if(data.orientation) setOrientation(data.orientation); await getGame().startNewGame({suppressAIMove:true}); await replayMoves(data.move_history||[]); window.gameConfig && (window.gameConfig.timers.white=data.whiteTime||0, window.gameConfig.timers.black=data.blackTime||0, window.gameConfig.updateTimerDisplay&&window.gameConfig.updateTimerDisplay()); generatePGN(); showMessage && showMessage('Autosave restored','success'); })(); }catch{} }

    function bindUI(){
      document.getElementById('pgn-copy-btn')?.addEventListener('click',copyPGN);
      document.getElementById('pgn-download-btn')?.addEventListener('click',downloadPGN);
      document.getElementById('pgn-refresh-btn')?.addEventListener('click',refreshPGN);
      document.querySelectorAll('.save-slots button[data-action]').forEach(btn=>{ btn.addEventListener('click',()=>{ const slot=parseInt(btn.getAttribute('data-slot'),10); const action=btn.getAttribute('data-action'); if(action==='save') saveSlot(slot); else if(action==='load') loadSlot(slot); else if(action==='delete') deleteSlot(slot); }); });
      const toggle=document.getElementById('pgn-import-toggle');
      const panel=document.getElementById('pgn-import-panel');
      const input=document.getElementById('pgn-import-input');
      const run=document.getElementById('pgn-import-run');
      const clear=document.getElementById('pgn-import-clear');
      if(toggle) toggle.addEventListener('click',()=>{ if(!panel) return; const opening=panel.style.display==='none'; panel.style.display= opening?'block':'none'; toggle.textContent= opening?'Close':'Import'; toggle.setAttribute('aria-expanded', opening?'true':'false'); });
      if(input) input.addEventListener('input',()=>{ const has=!!input.value.trim(); if(run) run.disabled=!has; if(clear) clear.disabled=!has; });
      if(clear) clear.addEventListener('click',()=>{ if(input) input.value=''; if(run) run.disabled=true; clear.disabled=true; });
      if(run) run.addEventListener('click',()=>importPGN(input.value.trim()));
    }

    async function importPGN(text){ if(!text) return; const moves=window.JSChessPGN?.parseCoordinateMoves? window.JSChessPGN.parseCoordinateMoves(text):[]; if(!moves.length){ showMessage && showMessage('No importable moves','error'); return; } await getGame().startNewGame({suppressAIMove:true}); for(const mv of moves){ try{ await getGame().api.makeMove(getGame().gameId,{from:mv.slice(0,2),to:mv.slice(2,4)}); const st=await getGame().api.getGame(getGame().gameId); getGame().gameState=st; getGame().currentFEN=st.fen; getGame().updateBoard&&getGame().updateBoard(); getGame().updateGameInfo&&getGame().updateGameInfo(); getGame().updateMoveHistory&&getGame().updateMoveHistory(); }catch(e){ window.Debug && Debug.warn && Debug.warn('importReplay','Replay move failed', mv, e); break; } } generatePGN(); showMessage && showMessage('PGN imported','success'); const panel=document.getElementById('pgn-import-panel'); if(panel) panel.style.display='none'; const toggle=document.getElementById('pgn-import-toggle'); if(toggle) toggle.textContent='Import'; const input=document.getElementById('pgn-import-input'); if(input) input.value=''; }

    function handleMoveChange(){ generatePGN(); autosave(); }

    function init(){ loadSlots(); bindUI(); updateSlotButtonsState(); tryRestoreAutosave(); // detect ready game
      const readyInt=setInterval(()=>{ const game=getGame(); if(game && game.gameId){ if(!chessReady){ chessReady=true; updateSlotButtonsState(); handleMoveChange(); } clearInterval(readyInt); } },150); setTimeout(()=>clearInterval(readyInt),5000); }

    init();

    return {
      handleMoveChange, markReady: ()=>{ if(!chessReady){ chessReady=true; updateSlotButtonsState(); handleMoveChange(); } },
      saveSlot, loadSlot, deleteSlot, importPGN, generatePGN
    };
  }

  window.JSChessPGNSavesCore = { createManager };
})();
