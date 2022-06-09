var socket = new window.WebSocket("wss://" + window.location.host);

socket.onmessage = function(event) {
  console.log("WebSocket message received:", event.data);
  let message = JSON.parse(event.data);
  switch (message.msgType) {
    case 'lobbyUpdate':
      lobbyUpdated(message.players);
      break;
    case 'updateGameState':
      if (message.state == "starting") {
        preGameStart(message.cooldown);
      }
      break;
    case 'updateGameSettings':
      gameSettings = message.settings;
      break;
    case 'assignGunID':
      playerGameData.gunID = message.GunID;
    case 'updateWeaponDefinitions':
      weaponDefinitions = message.weapons;
    case 'playerListUpdated':
      playerList = message.players;
    case 'kill':
      enemyKilled();
  }
};

let initMsg = { "msgType":"join" }
socket.onopen = () => {
  socket.send(JSON.stringify(initMsg));
};