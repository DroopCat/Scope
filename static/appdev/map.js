var canvas = document.getElementById("mainCanvas");
var mapParent = document.getElementById("mapContainer");
var context = canvas.getContext("2d");
var mapImage = new Image();
var positionWatcher = null;
mapImage.src = "/assets/imgs/map.png";
window.onload = () => {
  canvas.width = mapParent.clientWidth;
  canvas.height = mapParent.clientHeight;
};
// window.onresize = () => {
//   canvas.width = mapParent.clientWidth;
//   canvas.height = mapParent.clientHeight;
// };

var sensor = new AbsoluteOrientationSensor();
sensor.addEventListener("reading", (e) => handleSensor(e));

var rotation = 0;
var scale = 300;
var currentX = 50;
var currentY = 50;
var inputX = 0;
var inputY = 0;
var mapEnable = true;
var heading = 0;

function draw() {
  rotation = rotation + (((((0-heading)-rotation)%360)+540)%360-180) / 15
  if (rotation > 360) {
    rotation = rotation - 360;
  } else if (rotation < 0) {
    rotation = 360 + rotation;
  }
  scale = scale + (35 - scale) / 20;
  currentX = currentX + (inputX - currentX) / 15;
  currentY = currentY + (inputY - currentY) / 15;
  let mapWidth = mapImage.width * (scale / 30);
  let mapHeight = mapImage.height * (scale / 30);
  if (mapEnable) {
    window.requestAnimationFrame(draw);
  }
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);

  //Draw the frame
  let mappedY = mapHeight * (currentY / 100);
  let mappedX = mapWidth * (currentX / 100);
  context.translate(canvas.width / 2, canvas.height / 2); // Set context to center
  var angle = Math.atan(mappedY / mappedX);
  var magnitude = Math.sqrt(Math.pow(mappedY, 2) + Math.pow(mappedX, 2)); // Get the hypotinuse thingy
  var finalAngle = angle + toRadians(rotation);
  var finalx = Math.sin(finalAngle) * magnitude;
  var finaly = Math.cos(finalAngle) * magnitude;
  context.translate(0 - finaly, 0 - finalx);
  context.rotate(toRadians(rotation));
  context.save();
  context.drawImage(mapImage, 0, 0, mapWidth, mapHeight);
  drawBox(50, 50, rotation);
}

function toRadians(x) {
  return (Math.PI / 180) * x;
}

function drawBox(x, y, rat) {
  context.save();
  context.translate(x, y);
  context.rotate(0 - toRadians(rat));
  context.fillStyle = "red";
  context.fillRect(-10, -10, 20, 20); //Tiny square in the corner
  context.restore();
}

function startMap() {
  sensor.start();
  let options = {
    enableHighAccuracy: true,
    timeout: 60000,
    maximumAge: 0
  }
  positionWatcher = navigator.geolocation.watchPosition(posChanged, (error)=>{console.log(error)}, options);
  canvas.width = mapParent.clientWidth;
  canvas.height = mapParent.clientHeight;
  rotation = 0;
  scale = 300;
  x = 50;
  y = 50;
  mapEnable = true;
  draw();
}

function stopMap() {
  sensor.stop();
  mapEnable = false;
  navigator.geolocation.clearWatch(positionWatcher);
}

function posChanged(position) {
  inputY = longitudeToRatio(position.coords.longitude);
  inputX = latitudeToRatio(position.coords.latitude);
}

function compassHeading(alpha, beta, gamma) {
  // Convert degrees to radians
  var alphaRad = alpha * (Math.PI / 180);
  var betaRad = beta * (Math.PI / 180);
  var gammaRad = gamma * (Math.PI / 180);
  // Calculate equation components
  var cA = Math.cos(alphaRad);
  var sA = Math.sin(alphaRad);
  var cB = Math.cos(betaRad);
  var sB = Math.sin(betaRad);
  var cG = Math.cos(gammaRad);
  var sG = Math.sin(gammaRad);
  // Calculate A, B, C rotation components
  var rA = - cA * sG - sA * sB * cG;
  var rB = - sA * sG + cA * sB * cG;
  var rC = - cB * cG;
  // Calculate compass heading
  var compassHeading = Math.atan(rA / rB);
  // Convert from half unit circle to whole unit circle
  if(rB < 0) {
    compassHeading += Math.PI;
  }else if(rA < 0) {
    compassHeading += 2 * Math.PI;
  }
  // Convert radians to degrees
  compassHeading *= 180 / Math.PI;

  return compassHeading;
}

// window.addEventListener('deviceorientation', function(evt) {
// heading = compassHeading(evt.alpha, evt.beta, evt.gamma);
//   // Do something with 'heading'...
// }, false);

function handleSensor(e){
  let orientation = toEuler(e.target.quaternion);
  heading = compassHeading(orientation.yaw, orientation.pitch, orientation.roll) + 180;
  if (isNaN(heading)) {
    heading = 0;
  }
}

function longitudeToRatio(longitude) {
  //return scaleNum(longitude, [redacted], [redacted], 100, 0);
  return 50;
}

function latitudeToRatio(latitude) {
  //return scaleNum(latitude, [redacted], [redacted], 0, 100);
  return 50;
}

const scaleNum = (num, in_min, in_max, out_min, out_max) => {
  return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

function toEuler(q) {
      let orientation = {};
      // roll
      let sinr_cosp = 2 * (q[3] * q[0] + q[1] * q[2]);
      let cosr_cosp = 1 - 2 * (q[0] * q[0] + q[1] * q[1]);
      orientation.roll = Math.atan2(sinr_cosp, cosr_cosp);

      // pitch
      let pitch = 0;
      let sinp = 2 * (q[3] * q[1] - q[2] * q[0]);
      if (Math.abs(sinp) >= 1) {
        if (sinp > 0){
          orientation.pitch = Math.asin(1);
        }else{
          orientation.pitch = Math.asin(-1);
        }
      } else {
        orientation.pitch = Math.asin(sinp);
      }

      // yaw
      let siny_cosp = 2 * (q[3] * q[2] + q[0] * q[1]);
      let cosy_cosp = 1 - 2 * (q[1] * q[1] + q[2] * q[2]);
      orientation.yaw = Math.atan2(siny_cosp, cosy_cosp);

      orientation.yaw = orientation.yaw * (180/Math.PI);
      orientation.pitch = orientation.pitch * (180/Math.PI);
      orientation.roll = orientation.roll * (180/Math.PI);
      if (orientation.yaw < 0) {
        orientation.yaw = orientation.yaw + 360;
      }

      return orientation;
}
