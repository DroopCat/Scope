(function () {
  "use strict";

  const configAddress = "e6f59d14-8230-4a5c-b22f-c062b1d329e3";
  const telemetryAddress = "e6f59d12-8230-4a5c-b22f-c062b1d329e3";
  const controlAddress = "e6f59d13-8230-4a5c-b22f-c062b1d329e3";
  const recoilServiceAddress = "e6f59d10-8230-4a5c-b22f-c062b1d329e3";
  function isBitSet(position, byte) {
    return (byte >> position) & 1;
  }
  const weaponDefinition = {
    triggerMode: 0x01,
    rateOfFire: 5,
    muzzleFlashMode: 0x1,
    flashParam1: 7,
    flashParam2: 10,
    narrowIrPower: 125,
    wideIrPower: 0,
    muzzleLedPower: 255,
    motorPower: 18,
  };
  var lastAmmo = 0;
  var lastButtonCount = {
    trigger: 0,
    reload: 0,
    radio: 0,
    power: 0,
    recoil: 0,
  };
  var lastShotCount = 0;
  var packetCounter = null;

  class RecoilGun {
    constructor() {
      this._EVENTS = {};
      this._CONFIGCHAR = null;
      this._CONTROLCHAR = null;
      this._TELEMETRYCHAR = null;
      this._QUEUE = [];

      this.gunSettings = {
        shotId: 0,
        currentWeaponSlot: 0,
        ammo: 0,
        recoil: true,
        flashOnShot: true,
        weaponOverride: 0xff,
      };
      this.isConnected = false;
      this.telemetry = {};
      this.buttons = {};
    }

    connect() {
      return new Promise(async (resolve, reject) => {
        this._queue(() => this._connect().then(()=>resolve()).catch(()=>reject()));
      });
    }

    _connect() {
      return new Promise(async (resolve, reject) => {
        let device, server, service;
        let controlCharacteristic,
          configCharacteristic,
          telemetryCharacteristic;
        let filters = [{ namePrefix: "SRG" }];
        let options = {};
        options.filters = filters;
        options.optionalServices = [recoilServiceAddress];

        try {
          /* Request device */
          device = await navigator.bluetooth.requestDevice(options);

          /* Connect to GATT */
          console.log("Connecting to GATT Server...");
          device.addEventListener(
            "gattserverdisconnected",
            this._disconnect.bind(this)
          );
          server = await device.gatt.connect();

          /* Fetch characteristics */
          service = await server.getPrimaryService(recoilServiceAddress);
          controlCharacteristic = await service.getCharacteristic(
            controlAddress
          );
          configCharacteristic = await service.getCharacteristic(configAddress);
          telemetryCharacteristic = await service.getCharacteristic(
            telemetryAddress
          );

          this._CONFIGCHAR = configCharacteristic;
          this._CONTROLCHAR = controlCharacteristic;
          this._TELEMETRYCHAR = telemetryCharacteristic;
          this.isConnected = true;
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    }

    startTelemetry() {
      return new Promise(async (resolve, reject) => {
        try {
          this._TELEMETRYCHAR.addEventListener(
            "characteristicvaluechanged",
            this._handleTelemetry.bind(this)
          );
          //await this._TELEMETRYCHAR.startNotifications();
          //resolve();
          this._queue(() => this._TELEMETRYCHAR.startNotifications().then(resolve()));
        } catch (e) {
          reject(e);
        }
      });
    }

    stopTelemetry() {
      return new Promise(async (resolve, reject) => {
        try {
          await this._TELEMETRYCHAR.stopNotifications();
          this._TELEMETRYCHAR.removeEventListener(
            "characteristicvaluechanged",
            this._handleTelemetry.bind(this)
          );
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    }

    switchWeapon(slot) {
      this.gunSettings.currentWeaponSlot = slot;
      return this.sendControlPacket(0x0000);
      //this._queue(() => this._sendControlPacket(0x0000));
    }

    setGunId(shotId) {
      this.gunSettings.shotId = shotId;
      this.sendControlPacket(0x0000);
    }

    powerOff() {
      this.sendControlPacket(0x0020);
    }

    recoil() {
      this.sendControlPacket(0x0008);
    }

    flash() {
      this.sendControlPacket(0x0010);
    }

    shoot() {
      this.sendControlPacket(0x0001);
    }

    removeClip() {
      this.sendControlPacket(0x0002);
    }

    loadClip(ammoCount) {
      this.gunSettings.ammo = ammoCount;
      this.sendControlPacket(0x0004);
    }

    updateSettings(newSettings) {
      Object.assign(this.gunSettings, newSettings);
      //this._updateShotConfig();
      this._queue(() => this._updateShotConfig());
      this.sendControlPacket(0x0000);
    }

    _disconnect() {
      console.log("Disconnected from GATT Server...");

      this.isConnected = false;
      if (this._EVENTS["disconnected"]) {
        this._EVENTS["disconnected"]();
      }
    }

    sendControlPacket(controlAction) {
      this._queue(() => this._sendControlPacket(controlAction));
    }

    _sendControlPacket(controlAction) {
      return new Promise(async (resolve, reject) => {
        let buffer = new ArrayBuffer(7);
        let view = new DataView(buffer, 0);
        packetCounter += 1;
        if (packetCounter > 15) {
          packetCounter = 0;
        }
        view.setUint8(0, packetCounter << 4); //Must be changed or command will not be accepted
        view.setUint16(2, controlAction, true);
        view.setUint8(4, this.gunSettings.shotId);
        view.setUint8(5, this.gunSettings.currentWeaponSlot);
        view.setUint8(6, this.gunSettings.ammo);
        try {
          await this._CONTROLCHAR.writeValue(buffer);
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    }

    _updateShotConfig() {
      return new Promise(async (resolve, reject) => {
        let buffer = new ArrayBuffer(5);
        let view = new DataView(buffer, 0);
        let autoFeedback = 0x00;
        if (this.gunSettings.flashOnShot) {
          autoFeedback = autoFeedback | 0x2;
        }
        if (this.gunSettings.recoil) {
          autoFeedback = autoFeedback | 0x1;
        }
        view.setUint16(0, 16, true); // Write to the shot config table
        view.setUint8(2, 2); // shot config is 2 bytes long
        view.setUint8(3, autoFeedback); // first nibble is auto feedback
        view.setUint8(4, this.gunSettings.weaponOverride);
        try {
          await this._CONFIGCHAR.writeValue(buffer);
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    }

    _handleTelemetry(event) {
      let value = event.target.value;
      let telemetry = {};
      let buttonByte = value.getUint8(2);
      telemetry.buttons = {};

      telemetry.buttons.trigger = isBitSet(0, buttonByte);
      telemetry.buttons.reload = isBitSet(1, buttonByte);
      telemetry.buttons.radio = isBitSet(2, buttonByte);
      telemetry.buttons.power = isBitSet(4, buttonByte);
      telemetry.buttons.recoil = isBitSet(5, buttonByte);

      this.buttons = telemetry.buttons;

      telemetry.buttonCount = {};
      telemetry.buttonCount.trigger = value.getUint8(3) & 0x0f;
      telemetry.buttonCount.reload = (value.getUint8(3) & 0xf0) >> 4;
      telemetry.buttonCount.radio = value.getUint8(4) & 0x0f;
      telemetry.buttonCount.reset = (value.getUint8(4) & 0xf0) >> 4;
      telemetry.buttonCount.power = value.getUint8(5) & 0x0f;
      telemetry.buttonCount.recoil = (value.getUint8(5) & 0xf0) >> 4;

      if (telemetry.buttonCount.trigger != lastButtonCount.trigger) {
        if (this._EVENTS["triggerBtn"]) {
          this._EVENTS["triggerBtn"](telemetry.buttonCount.trigger);
        }
      }
      if (telemetry.buttonCount.reload != lastButtonCount.reload) {
        if (this._EVENTS["reloadBtn"]) {
          this._EVENTS["reloadBtn"](telemetry.buttonCount.reload);
        }
      }
      if (telemetry.buttonCount.radio != lastButtonCount.radio) {
        if (this._EVENTS["radioBtn"]) {
          this._EVENTS["radioBtn"](telemetry.buttonCount.radio);
        }
      }
      if (telemetry.buttonCount.power != lastButtonCount.power) {
        if (this._EVENTS["powerBtn"]) {
          this._EVENTS["powerBtn"](telemetry.buttonCount.power);
        }
      }
      if (telemetry.buttonCount.recoil != lastButtonCount.recoil) {
        if (this._EVENTS["recoilBtn"]) {
          this._EVENTS["recoilBtn"](telemetry.buttonCount.recoil);
        }
      }
      lastButtonCount = Object.assign({}, telemetry.buttonCount);

      telemetry.batteryVoltage = value.getInt16(6, true);
      telemetry.ammo = value.getUint8(14);
      telemetry.flags = value.getUint8(15);
      telemetry.weaponType = value.getUint8(16);

      if (telemetry.ammo != lastAmmo) {
        if (this._EVENTS["ammoChanged"]) {
          this._EVENTS["ammoChanged"](telemetry.ammo);
        }
      }
      lastAmmo = telemetry.ammo;

      telemetry.IrEvent1 = {};
      telemetry.IrEvent1.rawPayload = value.getUint16(8, true);
      telemetry.IrEvent1.sensor = (value.getUint8(10) & 0xf0) >> 4;
      telemetry.IrEvent1.shooterID = value.getUint8(9) >> 2;
      telemetry.IrEvent1.weaponID = (value.getUint16(8, true) >> 6) & 0x0f;
      telemetry.IrEvent1.plasmaRounds = (value.getUint8(8) >> 3) & 0x07;
      telemetry.IrEvent1.shotCount = value.getUint8(8) & 0x07;
      telemetry.IrEvent1.eventCount = value.getUint8(10) & 0x0f;
      if (telemetry.IrEvent1.sensor == 0) {
        telemetry.IrEvent1.exists = false;
      } else {
        telemetry.IrEvent1.exists = true;
        if (telemetry.IrEvent1.shotCount != lastShotCount) {
          if (this._EVENTS["irEvent"]) {
            this._EVENTS["irEvent"](telemetry.IrEvent1);
          }
          lastShotCount = telemetry.IrEvent1.shotCount;
        }
      }

      telemetry.IrEvent2 = {};
      telemetry.IrEvent2.rawPayload = value.getUint16(11, true);
      telemetry.IrEvent2.sensor = (value.getUint8(13) & 0xf0) >> 4;
      telemetry.IrEvent2.shooterID = value.getUint8(12) >> 2;
      telemetry.IrEvent2.weaponID = (value.getUint16(11, true) >> 6) & 0x0f;
      telemetry.IrEvent2.plasmaRounds = (value.getUint8(11) >> 3) & 0x07;
      telemetry.IrEvent2.shotCount = value.getUint8(11) & 0x07;
      telemetry.IrEvent2.eventCount = value.getUint8(13) & 0x0f;
      if (telemetry.IrEvent2.sensor == 0) {
        telemetry.IrEvent2.exists = false;
      } else {
        telemetry.IrEvent2.exists = true;
        if (telemetry.IrEvent2.shotCount != lastShotCount) {
          console.log(lastShotCount);
          if (this._EVENTS["irEvent"]) {
            this._EVENTS["irEvent"](telemetry.IrEvent2);
          }
          lastShotCount = telemetry.IrEvent2.shotCount;
        }
      }

      if (this._EVENTS["telemetry"]) {
        this._EVENTS["telemetry"](telemetry);
      }
      this.telemetry = telemetry;
    }

    get weaponProfile() {
      return Object.assign({}, weaponDefinition);
    }

    setWeaponProfile(weaponProfile, slot) {
      return new Promise(async (resolve, reject) => {
        this._queue(() => this._setWeaponProfile(weaponProfile, slot).then(()=>resolve()).catch((e)=>reject(e)));
      });
    }

    _setWeaponProfile(weaponProfile, slot) {
      return new Promise(async (resolve, reject) => {
        //let powerIR1 = Math.round((255/100)*weaponProfile.irBeamPwr);
        //let powerIR2 = Math.round((255/100)*weaponProfile.irConePwr);
        //let muzzleLed = Math.round((255/100)*weaponProfile.muzzleLedPwr);
        //let recoil = Math.round((255/100)*weaponProfile.recoil);

        let buffer = new ArrayBuffer(12);
        let view = new DataView(buffer);
        let id = Math.min(Math.max(slot, 0), 11);
        //Tell the gun to update the weapon definition config table
        view.setUint16(0, id, true); // Set tag
        view.setUint8(2, 0x09); // Set value length

        view.setUint8(3, weaponProfile.triggerMode); //TriggerMode
        view.setUint8(4, weaponProfile.rateOfFire); //RateOfFire
        view.setUint8(5, weaponProfile.narrowIrPower); //PowerIR1 - long range
        view.setUint8(6, weaponProfile.wideIrPower); //PowerIR2 - short range
        view.setUint8(7, weaponProfile.muzzleLedPower); //PowerLED1
        view.setUint8(8, 0xff); //PowerLED2
        view.setUint8(9, weaponProfile.motorPower); //PowerMotor
        view.setUint8(
          10,
          ((weaponProfile.muzzleFlashMode /*input*/ & 0x0f) << 4) |
            (0x00 /*input*/ & 0x0f)
        ); //FlashLED1 and FlashLED2
        view.setUint8(
          11,
          ((weaponProfile.flashParam2 /*input*/ & 0x0f) << 4) |
            (weaponProfile.flashParam2 /*input*/ & 0x0f)
        ); //FlashParam1 and FlashParam2
        try {
          await this._CONFIGCHAR.writeValue(buffer);
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    }

    on(e, f) {
      this._EVENTS[e] = f;
    }

    _queue(f) {
			var that = this;
			
			function run() {
				if (!that._QUEUE.length) {
					that._WORKING = false; 
					return;
				}
				
				that._WORKING = true;
				(that._QUEUE.shift()()).then(() => run());
			}
			
			that._QUEUE.push(f);
			
			if (!that._WORKING) run();	
		}
  }

  window.RecoilGun = new RecoilGun();
})();
