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

function scale(hex_str, c) {
  if (hex_str.length > 6) {
    hex_str = hex_str.substring(1,7);
  }
  let rgb = parseInt(hex_str, 16);
  let r = Math.min(0xff0000,(rgb & 0xff0000) * c) & 0xff0000;
  let g = Math.min(0xff00, (rgb & 0xff00) * c) & 0xff00;
  let b = Math.min(0xff, (rgb & 0xff) * c) & 0xff;
  return '#' + (0xf000000 + r + g + b).toString(16).substring(1);
}

function hex_is_light(hex_str) {
  if (hex_str.length > 6) {
    hex_str = hex_str.substring(1,7);
  }
  let rgb = parseInt(hex_str, 16);
  let r = (rgb & 0xff0000) >> 16;
  let g = (rgb & 0xff00) >> 8;
  let b = (rgb & 0xff);
  return ((r*0.299 + g*0.587 + b*0.114) / 255) > 0.50;
}

function getCssTheme(theme_json) {
  let fg = theme_json.colors['editor.foreground'];
  let bg = theme_json.colors['editor.background'];
  let bg_extra_1 = scale(bg, 0.952);
  let bg_extra_2 = scale(bg, 0.833);
  let bg_less_1 = scale(bg, 1.05);
  let fg_less_1 = scale(fg, 0.952);
  let fg_extra_1 = scale(fg, 1.05);
  let bg_light = scale(bg, 1.15);
  if (hex_is_light(bg)) {
    bg_light = bg;
    bg_extra_1 = scale(bg, 1.05);
    bg_extra_2 = scale(bg, 1.1);
    bg_less_1 = scale(bg, 0.952);
    fg_less_1 = scale(fg, 1.05);
    fg_extra_1 = scale(fg, 0.952);
  }


  var m = []
  for (let i = 0; i < theme_json.rules.length; i++) {
    if (theme_json.rules[i].token.match('string')) {
      if (theme_json.rules[i].hasOwnProperty('foreground')) {
        let color = scale(theme_json.rules[i].foreground, 1);
        m.push[color];
      }
    }
    if (theme_json.rules[i].token.match('keyword')) {
      if (theme_json.rules[i].hasOwnProperty('foreground')) {
        let color = scale(theme_json.rules[i].foreground, 1)
        m.push[color];
      }
    }
    if (m.length >= 2) { break; }
  }
  if (m.length < 2) { m = [fg, fg]; }

  var markdown = fg;

  var error_color = null;
  for (let i = 0; i < theme_json.rules.length; i++) {
    if (theme_json.rules[i].token.match('error')) {
      if (theme_json.rules[i].hasOwnProperty('foreground')) {
        error_color = scale(theme_json.rules[i].foreground, 1);
      }
    }
    if (error_color != null) { break; }
  }
  if (error_color == null) { error_color = fg; }

  let css = `--colab-anchor-color: 
  --colab-callout-color: 
  --code-cell-background: 
  --colab-border-color:
  --colab-divider-color:
  --colab-highlighted-surface-color: 
  --colab-icon-color: 
  --colab-input-placeholder-color: 
  --colab-primary-surface-color: 
  --colab-primary-text-color: 
  --colab-secondary-text-color: 
  --colab-tertiary-text-color: 
  --colab-secondary-surface-color: 
  --colab-error_color-icon-color: 
  --colab-title-color: 
  --colab-toolbar-button-color: 
  --colab-form-field-underline-color: 
  --colab-local-diff-background: 
  --colab-merged-diff-background: `;

  var fillers = [
    m[0],
    m[1],
    bg,
    bg_extra_2,
    bg_extra_1,
    bg_less_1,
    fg,
    fg_less_1,
    bg_light,
    markdown,
    fg_extra_1,
    fg_extra_1,
    bg_extra_1,
    error_color,
    fg,
    fg,
    fg_less_1,
    bg_extra_2,
    bg_extra_1
  ]
  css = css.split('\n');
  for (let i = 0; i < css.length; i++ ) {
    css[i] += fillers[i] + ' !important;';
  }
  let css_constant = `\n--colab-active-execution-icon-color: var(--colab-icon-color) !important;
  --primary-color: var(--colab-anchor-color) !important;
  --hairline-button-primary: var(--primary-color) !important;
  --hairline-button-secondary:var(--primary-color) !important;
  --light-theme-secondary-color: var(--colab-input-placeholder-color) !important;`;
  return css.join('\n') + css_constant;
}

function changeCssTheme(page_css) {
  let cur_theme = document.documentElement.attributes['theme'].value;
  let css_rules = '';
  if (cur_theme == 'dark') {
    css_rules = 'html[theme=dark] {' + page_css + '}';
  }
  else {
    css_rules = 'html {' + page_css + '}';
  }
  var style = document.createElement('style');
  style.appendChild(document.createTextNode(css_rules));
  document.documentElement.appendChild(style);
}

function select_theme(filename) {
  chrome.storage.sync.set({'filename' : filename});
  chrome.storage.sync.set({'user_added' : false});
  chrome.storage.sync.get('extension_active', function(result) {
    if (result.extension_active) {
      chrome.tabs.query({active : true, lastFocusedWindow : true}, function (tabs) {
        var tabId = tabs[0].id;
        fetch('themes/'+ filename +'.json')
        .then(data => data.json())
        .then(theme_json => {
          // create css
          var page_css = getCssTheme(theme_json);
          chrome.storage.sync.set({'page_css' : page_css});
          // set monaco
          chrome.scripting.executeScript({
            target: {tabId: tabId},
            func: changeMonacoTheme,
            args: [theme_json],
            world: 'MAIN',
          });
        });
        // send css to service workers
        chrome.tabs.sendMessage(tabId,{update:true});
      });
    }
  });
}

function select_added_theme(filename) {
  chrome.storage.sync.set({'filename' : filename});
  chrome.storage.sync.set({'user_added' : true});
  chrome.storage.sync.get('extension_active', function(result) {
    if (result.extension_active) {
      chrome.tabs.query({active : true, lastFocusedWindow : true}, function (tabs) {
        var tabId = tabs[0].id;
        chrome.storage.sync.get(filename, function(result) {
          let theme_json = result.filename;
          var page_css = getCssTheme(theme_json);
          chrome.storage.sync.set({'page_css' : page_css});
          // set monaco
          chrome.scripting.executeScript({
            target: {tabId: tabId},
            func: changeMonacoTheme,
            args: [theme_json],
            world: 'MAIN',
          });
        });
        // send css to service workers
        chrome.tabs.sendMessage(tabId,{update:true});
      });
    }
  });
}

// modify popup html page
var xhr = new XMLHttpRequest();
xhr.onreadystatechange = function () {
  if (this.readyState == 4 && this.status == 200) {
    var theme_list = JSON.parse(xhr.responseText);
    var selectList = document.getElementById('colab_themes_choice')

    chrome.storage.sync.get('user_files', function(result) {

      if (result.user_files) {
        for (let i = 0; i < result.user_files.length; i++) {
          var opt = document.createElement("option");
          opt.user_added = true;
          opt.value = result.user_files[i];
          opt.innerHTML = result.user_files[i];
          selectList.appendChild(opt);
        }
      }
    });

    Object.keys(theme_list).forEach(function(key) {
      var opt = document.createElement("option");
      opt.value = theme_list[key];
      opt.innerHTML = theme_list[key];
      selectList.appendChild(opt);
    });
    selectList.onchange = function() {
      if (this.user_added) {
        select_added_theme(this.value);
      }
      else {
        select_theme(this.value);
      }
    };
    chrome.storage.sync.get('filename', function(result) {
      if (result.filename) {
        selectList.value = result.filename;
      }
    });
  }
};

xhr.open("GET", 'themes/themelist.json', true);
xhr.send();

document.getElementById('on_off').onchange = function() {
  chrome.storage.sync.set({"extension_active": this.checked});
  if (this.checked) {
    chrome.tabs.query({active : true, lastFocusedWindow : true}, function (tabs) {
      chrome.storage.sync.get('filename', function(result) {
        if (result.filename) {
          select_theme(result.filename);
        }
      });
    });
  }
};

chrome.storage.sync.get('extension_active', function(result) {
  document.getElementById('on_off').checked = result.extension_active;
});

var errorMsg = document.getElementById('errorMsg');
document.getElementById('upload').addEventListener('change', readFile);

function readFile() {
  errorMsg.innerHTML = ''
  var files = this.files;
  if (files.length != 1) {
    errorMsg.innerHTML = "Please select a file.<br/>";
    return;
  }
  if (files[0].type != 'application/json') {
    errorMsg.innerHTML = 'The file must be a JSON file.<br/>';
    return;
  }
  var reader = new FileReader();
  reader.onload = function(event) {
    if (event.target.result.length > 8000) {
      errorMsg.innerHTML = 'The file is too large.<br/>';
      return;
    }
    var filename = files[0].name.slice(0,-5);
    goodMsg.innerHTML += filename + ' has been added to the list!<br/>';
    chrome.storage.sync.set({[filename] : event.target.result});

    chrome.storage.sync.get('user_files', function(result) {
      if (result.user_files) {
        result.user_files.push(filename);
        chrome.storage.sync.set({'user_files' : result.user_files});
      }
      else {
        chrome.storage.sync.set({'user_files' : [filename]});
      }
    });
  }
  reader.readAsText(files[0]);
}