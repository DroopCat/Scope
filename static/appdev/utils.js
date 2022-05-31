let wakeLock = null;
let fullscreen = false;

//  Wakelock stuff
async function setWakeLock() {
  wakeLockPermBtn.classList.add("permAllowed");
  if ('wakeLock' in navigator) {
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => {
        console.log('Screen Wake Lock was released');
      });
      console.log('Screen Wake Lock is active');
    } catch (err) {
      console.error(`${err.name}, ${err.message}`);
    }
  }
  checkPerms();
}
function releaseWakeLock() {
  try {
    wakeLock.release();
  } catch (err) {
    console.error(`${err.name}, ${err.message}`);
  }
}

//  Fullscreen stuff
function enterFullscreen() {
  document.documentElement.requestFullscreen();
  screen.orientation.lock('portrait');
  fullscreen = true;
  fullScreenPermBtn.classList.add("permAllowed");
  checkPerms();
}
function exitFullscreen() {
  document.exitFullscreen();
}


function checkPhoneInfo() {
  navigator.permissions.query({name:'geolocation'}).then((result)=>{
    if (result.state == "granted") {
      phoneInfo.locationEnabled = true;
    } else {
      phoneInfo.locationEnabled = false;
    }
    if ("geolocation" in document.documentElement) {
      phoneInfo.locationAvailable = true;
    } else {
      phoneInfo.locationAvailable = false;
    }
    if ("requestFullscreen" in document.documentElement) {
      phoneInfo.fullscreenAvailable = true;
    } else {
      phoneInfo.fullscreenAvailable = false;
    }
    if ("wakeLock" in navigator) {
      phoneInfo.wakeLockAvailable = true;
    } else {
      phoneInfo.wakeLockAvailable = false;
    }
    if ("bluetooth" in navigator) {
      phoneInfo.bluetoothAvailable = true;
    } else {
      phoneInfo.bluetoothAvailable = false;
    }
    result.onchange = (event) => {
      if (event.target.state == "granted") {
        geoSuccess(1);
      }
    }
  });
}
