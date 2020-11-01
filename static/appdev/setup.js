// variables
let username;
let storedUsername;
let gunChoice;
let phoneInfo = {};

let fullScreenPermBtn = document.getElementById("fullscreenPerm");
let wakeLockPermBtn = document.getElementById("wakeLockPerm");
let locationPermBtn = document.getElementById("locationPerm");

window.onload = function() {
  checkPhoneInfo();
  storedUsername = localStorage.getItem("username");
  if (storedUsername != undefined) {
    document.getElementById("username").value = storedUsername;
  }
  document.getElementById("splash").style.display = "none";
  document.getElementById("ftsetup").style.display = "block";
  document.getElementById("setupusername").style.display = "grid";
  fullScreenPermBtn.addEventListener("click", enterFullscreen);
  wakeLockPermBtn.addEventListener("click", setWakeLock);
  locationPermBtn.addEventListener("click", allowGPS);
  document.getElementById("splash").style.display = "none";
};

function submitUsername() {
  username = document.getElementById("username").value;
  // if ((username == "") && (storedUsername != undefined)) {
  //   username = storedUsername;
  // }
  if (username == "") {
    alert("You can't play without a username :/");
  } else if (username.length > 13) {
    alert("Username cannot be longer than 13.1473894 characters");
  } else if (username.replace(/ /g, '').length < 2) {
    alert("Username cannot be shorter than 2 characters");
  } else {
    localStorage.setItem("username", username);
    let usernamejson = {"msgType":"setUsername","username":username};
    socket.send(JSON.stringify(usernamejson));
    showPhoneSetupMenu();
    document.getElementById("setupusername").style.display = "none";
  }
}

function allowGPS() {
  if (navigator.geolocation) {
    console.log(navigator.geolocation.getCurrentPosition(geoSuccess, (error)=>{
      switch(error.code) {
        case error.PERMISSION_DENIED:
          alert("Looks like location is denied. You will most likely have to enable it in your browsers settings.");
          break;
        case error.POSITION_UNAVAILABLE:
          alert("Looks like geolocation is available but also unavailable? (What?!?)");
          break;
        case error.TIMEOUT:
          alert("ARRG! Somehow gps timed out.");
          break;
        case error.UNKNOWN_ERROR:
          alert("Ouch. Gps exists but raised an unknown error.");
          break;
      }
    }));
  } else {
    alert("Hmm, looks like your browser doesn't support geolocation... or its disabled.");
  }
}

function geoSuccess(position) {
  if (position != undefined) {
    console.log("GPS is enabled.");
    locationPermBtn.classList.add("permAllowed");
    phoneInfo.locationEnabled = true;
    checkPerms();
  }
}

function bleSuccess() {
  document.getElementById("lobby").style.display = "grid";
  document.getElementById("setupgun").style.display = "none";
  document.getElementById("ftsetup").style.display = "none";
  socket.send(JSON.stringify({'msgType':'setState', 'state':'lobby'}));
}
function bleFailure(error) {
  document.getElementById("connectGunbtn").classList.add('greenbtn');
  document.getElementById("connectGunbtn").classList.remove('disabledbtn');
}
function bleSetLoading() {
  document.getElementById("connectGunbtn").classList.add('disabledbtn');
  document.getElementById("connectGunbtn").classList.remove('greenbtn');
}

function showPhoneSetupMenu() {
  if (phoneInfo.wakeLockAvailable) {
    wakeLockPermBtn.style.display = "grid";
  } else {
    wakeLockPermBtn.style.display = "none";
  }
  if (phoneInfo.locationEnabled) {
    locationPermBtn.style.display = "none";
  } else {
    locationPermBtn.style.display = "grid";
  }
  if (phoneInfo.fullscreenAvailable) {
    fullScreenPermBtn.style.display = "grid";
  } else {
    fullScreenPermBtn.style.display = "none";
  }

  document.getElementById("setupphone").style.display = "grid";
}

function showGunSetupMenu() {
  document.getElementById("setupgun").style.display = "grid";
}

function checkPerms() {
  let ready = true;
  if (phoneInfo.fullscreenAvailable) {
    if (fullscreen != true) {
      ready = false;
    }
  }
  if (phoneInfo.wakeLockAvailable) {
    if (wakeLock == null) {
      ready = false;
    }
  }
  if (!phoneInfo.locationEnabled) {
    ready = false;
  }
  if (ready) {
    showGunSetupMenu();
    document.getElementById("setupphone").style.display = "none";
  }
}
