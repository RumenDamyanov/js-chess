// Shared helper utilities for JS Chess apps
// PGN & move handling core (extracted to reduce duplication across framework variants)
// Exposes a global window.JSChessPGN object with utility functions.

(function(){
	if (window.JSChessPGN) return; // idempotent

	function resultTag(status){
		switch(status){
			case 'white_wins':
			case 'checkmate': // fallback; actual side may not be encoded yet
				return '1-0';
			case 'black_wins':
				return '0-1';
			case 'draw':
			case 'stalemate':
				return '1/2-1/2';
			default:
				return '*';
		}
	}

	function defaultHeaders(meta){
		const d = new Date().toISOString().slice(0,10);
		return {
			Event: meta?.event || 'JS Chess Casual Game',
			Site: meta?.site || 'Local',
			Date: meta?.date || d,
			Round: meta?.round || '-',
			White: meta?.white || 'Player',
			Black: meta?.black || 'AI',
			Result: meta?.result || resultTag(meta?.status)
		};
	}

	function buildPGN(gameState, meta){
		if(!gameState || !Array.isArray(gameState.move_history) || !gameState.move_history.length) return '';
		const headers = defaultHeaders({ ...meta, status: gameState.status });
		const lines = [];
		Object.entries(headers).forEach(([k,v])=> lines.push(`[${k} "${v}"]`));
		lines.push('');
		const moves = gameState.move_history;
		let row = '';
		moves.forEach((mv, idx)=>{
			const san = mv.notation || (mv.from+mv.to);
			if(idx % 2 === 0){ // white move
				const num = Math.floor(idx/2)+1;
				row = `${num}. ${san}`;
				// if last move and no corresponding black, push now
				if(idx === moves.length-1){
					lines.push(row.trim());
					row='';
				}
			} else { // black move
				row += ` ${san}`;
				lines.push(row.trim());
				row='';
			}
		});
		lines.push(resultTag(gameState.status));
		return lines.join('\n');
	}

	// Very lightweight coordinate-move PGN parser (expects tokens e2e4 etc.)
	function parseCoordinateMoves(pgnText){
		if(!pgnText) return [];
		const tokens = pgnText.split(/\s+/).filter(Boolean).filter(t=>!t.startsWith('['));
		const moves = [];
		for(const tok of tokens){
			if(/^[0-9]+\./.test(tok)) continue; // move numbers
			if(/^(1-0|0-1|1\/2-1\/2|\*)$/.test(tok)) continue; // results
			if(/^[a-h][1-8][a-h][1-8]$/.test(tok)) moves.push(tok);
		}
		return moves;
	}

	// Replay a sequence of coordinate moves using provided async callbacks
	// ctx: { startNewGame:()=>Promise, makeMove:(from,to)=>Promise, afterEach?:(idx,from,to)=>void|Promise }
	async function replayCoordinateMoves(moves, ctx){
		if(!Array.isArray(moves) || !moves.length) return;
		await ctx.startNewGame();
		for(const mv of moves){
			const from = mv.slice(0,2); const to = mv.slice(2,4);
			await ctx.makeMove(from,to);
			if(ctx.afterEach) await ctx.afterEach(from,to);
		}
	}

	window.JSChessPGN = { resultTag, build: buildPGN, parseCoordinateMoves, replayCoordinateMoves };
		// Lightweight shared accessor for current player name (graceful fallback)
		window.JSChessPlayer = {
			getName(){
				// Try common input / display spans
				const inp = document.getElementById('player-name');
				if (inp && inp.value) return inp.value.trim();
				const disp = document.getElementById('player-display');
				if (disp && disp.textContent) return disp.textContent.trim();
				return 'Player';
			}
		};

		// Low-risk enhancement: auto-sync player name display and refresh PGN header when name changes
		document.addEventListener('DOMContentLoaded', () => {
			const input = document.getElementById('player-name');
			const display = document.getElementById('player-display');
			if(!input) return; // Vue or other frameworks might not have an input; noop
			function sync(){
				const name = (input.value || '').trim() || 'Player';
				if(display) display.textContent = name;
				// If PGN already exists, rebuild with updated player name
				const out = document.getElementById('pgn-output');
				if(out && out.value && window.chessGame?.gameState?.move_history?.length){
					try {
						out.value = buildPGN(window.chessGame.gameState, { white: name, black: 'AI' });
					} catch { /* silent */ }
				}
			}
			input.addEventListener('input', sync);
			sync(); // initial sync
		});
})();
