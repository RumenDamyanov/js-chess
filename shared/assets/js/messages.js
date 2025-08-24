// Shared ephemeral message system (idempotent)
(function(){
	if(window.JSChessMessages) return;
	const QUEUE_LIMIT=6;
	function ensureRegion(){
		let region=document.getElementById('game-messages');
		if(!region){
			region=document.createElement('div');
			region.id='game-messages';
			region.className='game-messages-region';
			region.setAttribute('aria-live','polite');
			document.body.appendChild(region);
		}
		return region;
	}
	function showMessage(text,type='info',opts={}){
		const region=ensureRegion();
		const msg=document.createElement('div');
		msg.className=`game-message ${type}`;
		msg.textContent=text;
		region.prepend(msg); // newest visually on top due to normal column
		while(region.children.length>QUEUE_LIMIT){ region.lastChild.remove(); }
		const duration = opts.duration || 2000;
		setTimeout(()=>{ msg.classList.add('removing'); setTimeout(()=>msg.remove(),500); }, duration);
	}
	window.JSChessMessages={ showMessage };
})();
