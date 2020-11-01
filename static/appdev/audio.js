var audioContext = new AudioContext();
var gunSounds = [];

function playSound(sound) {
  var source = audioContext.createBufferSource();
  source.buffer = gunSounds[sound];
  source.connect(audioContext.destination);
  source.start(0);
}

function loadSound(url) {
  var request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';
  request.onload = function() {
    audioContext.decodeAudioData(request.response, function(buffer) {
      gunSounds.push(buffer);
    }, (error)=>{console.log(error)});
  }
  request.send();
}
