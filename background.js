function changeMonacoTheme(theme_json) {
  let cur_theme = document.documentElement.attributes['theme'].value;
  let mode = '';
  if (cur_theme == 'dark') {
    mode = '-dark';
  }
  let scriptContent = 'monaco.editor.defineTheme(\'colab'+ mode +'\', ' +
  'JSON.parse(\'' + JSON.stringify(theme_json) + '\') ); ' +
  'monaco.editor.setTheme(\'colab'+ mode +'\'); '
    let script = document.createElement('script');
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
          let filename = result.filename;
          chrome.storage.sync.get([filename + '1', filename + '2', filename + '3'], function(result2) {
            let theme_json = result2[filename + '1'] + result2[filename + '2'] + result2[filename + '3'];
            theme_json = JSON.parse(theme_json);
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