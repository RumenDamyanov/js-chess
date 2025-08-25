// DRY refactored: delegate to shared core manager
(function(){
  if(!window.JSChessPGNSavesCore){ console.warn('PGN core not loaded'); return; }
  const manager = window.JSChessPGNSavesCore.createManager({
    saveKey: 'jquerySaveSlotsV2',
    autosaveKey: 'jqueryAutosaveV2',
    getGame: ()=> window.chessGame,
    getPlayerName: ()=> window.JSChessPlayer?.getName?.() || 'Player',
    getOrientation: ()=> window.gameConfig?.getPlayerColor?.() || 'white',
    setOrientation: (color)=>{ if(window.gameConfig){ document.getElementById('player-color').value=color; window.gameConfig.config.playerColor=color; window.gameConfig.updateBoardOrientation && window.gameConfig.updateBoardOrientation(); window.gameConfig.updateOrientationIndicator && window.gameConfig.updateOrientationIndicator(); } },
    showMessage: (msg,type)=> window.JSChessMessages && window.JSChessMessages.showMessage(msg,type,{duration:2000})
  });
  // Patch once chessGame prototype present
  const int=setInterval(()=>{
    if(window.chessGame && window.chessGame.updateMoveHistory){
      const proto=window.chessGame.__proto__;
      if(!proto.__pgnPatched){
        const origUpdate=proto.updateMoveHistory; proto.updateMoveHistory=function(){ origUpdate.apply(this,arguments); manager.handleMoveChange(); };
        const origStart=proto.startNewGame; proto.startNewGame=async function(){ await origStart.apply(this,arguments); manager.markReady(); };
        proto.__pgnPatched=true;
      }
      clearInterval(int);
    }
  },120);
})();
