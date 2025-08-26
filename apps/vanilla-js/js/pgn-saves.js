// DRY refactored: delegate to shared core manager
(function(){
  if(!window.JSChessPGNSavesCore){ console.warn('PGN core not loaded'); return; }
  const manager = window.JSChessPGNSavesCore.createManager({
    saveKey: 'vanillaSaveSlotsV1',
    autosaveKey: 'vanillaAutosaveV1',
    getGame: ()=> window.chessGame,
    getPlayerName: ()=> window.JSChessPlayer?.getName?.() || 'Player',
    getOrientation: ()=> window.gameConfig?.getPlayerColor?.() || 'white',
    setOrientation: (color)=>{ if(window.gameConfig){ document.getElementById('player-color').value=color; window.gameConfig.config.playerColor=color; window.gameConfig.updateBoardOrientation && window.gameConfig.updateBoardOrientation(); window.gameConfig.updateOrientationIndicator && window.gameConfig.updateOrientationIndicator(); } },
    showMessage: (msg,type)=> window.JSChessMessages && window.JSChessMessages.showMessage(msg,type,{duration:2000})
  });
  // Patch game methods to notify manager
  const origUpdate=ChessGame.prototype.updateMoveHistory;
  ChessGame.prototype.updateMoveHistory=function(){ origUpdate.apply(this,arguments); manager.handleMoveChange(); };
  const origStart=ChessGame.prototype.startNewGame;
  ChessGame.prototype.startNewGame=async function(){ await origStart.apply(this,arguments); manager.markReady(); };
})();
