
function changeCssTheme(page_css) {
  cur_theme = document.documentElement.attributes['theme'].value
  if (cur_theme == 'dark') {
    css_rules = 'html[theme=dark] {' + page_css + '}';
    chrome.storage.sync.set({'mode': '-dark'});
  }
  else {
    css_rules = 'html {' + page_css + '}';
  }
  var style = document.createElement('style');
  style.appendChild(document.createTextNode(css_rules));
  document.documentElement.appendChild(style);
  chrome.runtime.sendMessage('changeMonaco' + cur_theme);
}

function loadContent(){
    var jsInitChecktimer = setInterval (checkForPage, 150);
    function checkForPage () {
        if (  document.getElementsByTagName('html').length >= 1) {
            clearInterval (jsInitChecktimer);
            chrome.storage.sync.get('page_css', function(result) {
              changeCssTheme(result.page_css);
            });
        }
    }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.update) { 
    loadContent();
  }  
  sendResponse(sender);
});

chrome.storage.sync.get('extension_active', function(result) {
  if (result.extension_active){
    loadContent();
  }
});