var socket = new window.WebSocket("wss://" + window.location.host);

socket.onmessage = function(event) {
  console.log("WebSocket message received:", event.data);
  let message = JSON.parse(event.data);
  if (message.msgType == 'lobbyListUpdated') {
    lobbyUpdated(message.players);
  } else if (message.msgType == 'updateGameState') {
    if (message.state == "starting") {
      preGameStart(message.cooldown);
    }
  } else if (message.msgType == 'updateGameSettings') {
    gameSettings = message.settings;
  } else if (message.msgType == 'assignGunID') {
    playerGameData.gunID = message.GunID;
  } else if (message.msgType == 'updateWeaponDefinitions') {
    weaponDefinitions = message.weapons;
  } else if (message.msgType == 'playerListUpdated') {
    playerList = message.players;
  } else if (message.msgType == 'kill') {
    enemyKilled();
  }
};

let clientInformation = { "msgType":"init", "client":"player" }
socket.onopen = () => {
  socket.send(JSON.stringify(clientInformation));
};

setTimeout(()=>{
  //socket.send("Hello!");
}, 500);
