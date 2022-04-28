function changeMonacoTheme(theme_json) {
  let cur_theme = document.documentElement.attributes['theme'].value;
  let mode = '';
  if (cur_theme == 'dark') {
    mode = '-dark';
  }
  var scriptContent = 'monaco.editor.defineTheme(\'colab'+ mode +'\', ' +
  'JSON.parse(\'' + JSON.stringify(theme_json) + '\') ); ' +
  'monaco.editor.setTheme(\'colab'+ mode +'\'); '
    var script = document.createElement('script');
    script.id = 'tmpScript';
    script.type = "text/javascript";
    script.appendChild(document.createTextNode(scriptContent));
    (document.body || document.head || document.documentElement).appendChild(script);
}


chrome.tabs.onUpdated.addListener( function (tabId, changeInfo, tab) {
  if (changeInfo.status == 'complete') {
    chrome.storage.sync.get(['extension_active','filename','user_added'], function(result) {
      if (result.extension_active) {
        if (result.user_added) {
          chrome.storage.sync.get(filename, function(result) {
            let theme_json = result.filename;
            // set monaco
            chrome.scripting.executeScript({
              target: {tabId: tabId},
              func: changeMonacoTheme,
              args: [theme_json],
              world: 'MAIN',
            });
          });
        }
        else {
          fetch('themes/'+ result.filename +'.json')
          .then(data => data.json())
          .then(theme_json => {
            // set monaco
            chrome.scripting.executeScript({
              target: {tabId: tabId},
              func: changeMonacoTheme,
              args: [theme_json],
              world: 'MAIN',
            });
          });
        }
      }  
    });
  }
})