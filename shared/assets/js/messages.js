// Shared message utility for JS Chess apps (vanilla, jQuery)
// Provides consistent styling, ARIA live region handling, and stacking behavior.
(function(global){
  function ensureRegion(){
    var region = document.getElementById('game-messages');
    if(!region){
      region = document.createElement('div');
      region.id = 'game-messages';
      region.className = 'game-messages-region';
      region.setAttribute('aria-live','polite');
      region.setAttribute('aria-atomic','false');
      document.body.appendChild(region);
    }
    return region;
  }

  function showMessage(message, type, options){
    options = options || {};
    var duration = options.duration == null ? 3000 : options.duration;
    var dismissible = options.dismissible !== false; // default true
    var region = ensureRegion();

    var wrapper = document.createElement('div');
    wrapper.className = 'game-message message-' + (type || 'info');
    wrapper.setAttribute('role','status');
    wrapper.setAttribute('data-type', type || 'info');

    var text = document.createElement('span');
    text.className = 'message-text';
    text.textContent = message;
    wrapper.appendChild(text);

    if (dismissible) {
      var closeBtn = document.createElement('button');
      closeBtn.className = 'message-close';
      closeBtn.setAttribute('aria-label','Dismiss message');
      closeBtn.innerHTML = '×';
      closeBtn.addEventListener('click', function(){
        if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
      });
      wrapper.appendChild(closeBtn);
    }

    region.appendChild(wrapper);

    if (duration > 0) {
      setTimeout(function(){
        if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
      }, duration);
    }
  }

  global.JSChessMessages = { showMessage: showMessage };
})(window);
