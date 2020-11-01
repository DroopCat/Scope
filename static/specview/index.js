var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");
var mapImage = new Image();
mapImage.src = "/assets/imgs/map.png";
window.onload = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  draw();
};
window.onresize = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
};

var input1 = document.getElementById("slider1");
var input2 = document.getElementById("slider2");
var input3 = document.getElementById("slider3");
var input4 = document.getElementById("slider4");
let mapWidth = 0;
let mapHeight = 0;
var rotation = 0;
var scale = 300;
var x = 50;
var y = 50;

var testCord = 0;
var testCordOther = 0;

function draw() {
  rotation = rotation + ((((input1.value-rotation)%360)+540)%360-180) / 15
  if (rotation > 360) {
    rotation = rotation - 360;
  } else if (rotation < 0) {
    rotation = 360 + rotation;
  }
  //rotation = rotation + (input1.value - rotation) / 15;
  scale = scale + (input4.value - scale) / 20;
  x = x + (input2.value - x) / 15; // smooth stuff
  y = y + (input3.value - y) / 15;
  mapWidth = mapImage.width * (scale / 30); // get a fancy ratio thing
  mapHeight = mapImage.height * (scale / 30);

  window.requestAnimationFrame(draw); // request animation frame before for performance
  context.setTransform(1, 0, 0, 1, 0, 0); // reset transformation matrix
  context.clearRect(0, 0, canvas.width, canvas.height); // clear teh scream

  //Draw the frame
  let mappedY = mapHeight * (y / 100);
  let mappedX = mapWidth * (x / 100);
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
  drawAtPosition([redacted], [redacted], mapWidth, mapHeight, rotation, ()=>{
    context.fillStyle = "purple";
    context.fillRect(-5, -5, 10, 10);
  });
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

//THE CODE THAT IS DISTRACTING
//Console message
let spacing = "5px";
let styles = `padding: ${spacing}; color: white; font-style:
         italic; border: ${spacing} solid crimson; font-size: 2em; border-radius: 30px; text-indent: 5px`;
console.log("%cHey, what are you doing in here?!?!", styles);

//Socket stuff
let socket = new window.WebSocket("wss://" + window.location.host);
let clientInformation = { msgType: "init", client: "spectator" };
socket.onmessage = function (event) {
  console.log("WebSocket message received:", event.data);
};
socket.onopen = () => {
  socket.send(JSON.stringify(clientInformation));
};

function drawAtPosition(longitude, latitude, mapWidth, mapHeight, rat, drawCode) {
  let finalLongitude = scaleNum(longitude, [redacted], [redacted], 0, 100);
  let finalLatitude = scaleNum(latitude, [redacted], [redacted], 100, 0);
  let xCords = (mapWidth / 100)*finalLongitude;
  let yCords = (mapHeight / 100)*finalLatitude;
  context.save();
  context.translate(xCords, yCords);
  context.rotate(0 - toRadians(rat));
  drawCode();
  context.restore();
}

const scaleNum = (num, in_min, in_max, out_min, out_max) => {
  return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}
