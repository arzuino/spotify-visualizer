var ipc = require('ipc');
ipc.on('coverUrl', function(url) {
  document.getElementById('cover').style.visibility = "visible";
  document.getElementById('background').src = url;
  document.getElementById('cover').src = url;
});
ipc.on('nextSong', function(title, artist) {
  document.getElementById('title').innerHTML = title;
  document.getElementById('artist').innerHTML = artist;
  document.getElementById('track-info').style.visibility = "visible";
  document.getElementById('progressBarParent').style.visibility = "visible";
  document.getElementById('progressBarParent').style.animation = "none";
});
ipc.on('loadingText', function(text) {
  document.getElementById('loading').innerHTML = text;
});
ipc.on('progress', function(width) {
  document.getElementById('progressBar').style.width = (width + "%");
});
ipc.on('paused', function() {
  document.getElementById('progressBarParent').style.animation = "blinker 2s linear infinite";
});
document.onkeydown = function(e) {
  e = e || window.event;
  if (e.keyCode == 27) { //ESC
    require('remote').getCurrentWindow().close();
  }
  /*else if (e.keyCode == 84) { //T

  }*/
};
