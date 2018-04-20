var ipc = require('ipc');
ipc.on('coverUrl', function(url) {
  document.getElementById('background').style.visibility = "visible";
  document.getElementById('cover').style.visibility = "visible";
  document.getElementById('background').src = url;
  document.getElementById('cover').src = url;
});
ipc.on('title', function(title) {
  document.getElementById('title').innerHTML = title;
  document.getElementById('track-info').style.opacity = 1;
  document.getElementById('myProgress').style.opacity = 1;
  document.getElementById('myProgress').style.animation = "none";
});
ipc.on('artist', function(artist) {
  document.getElementById('artist').innerHTML = artist;
});
ipc.on('loadingText', function(text) {
  document.getElementById('loading').innerHTML = text;
});
ipc.on('progress', function(width) {
  document.getElementById('myBar').style.width = (width + "%");
});
ipc.on('paused', function() {
  document.getElementById('myProgress').style.animation = "blinker 2s linear infinite";
});
document.onkeydown = function(e) {
  e = e || window.event;
  if (e.keyCode == 27) { //ESC
    require('remote').getCurrentWindow().close();
  }
  /*else if (e.keyCode == 84) { //T

  }*/
};
