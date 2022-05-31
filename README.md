# Scope
LaserTag in the browser with Recoil hardware

## Compatability
Currently only chromium based browsers support the web bluetooth api that is required for Scope to work. (Chrome, Brave, etc.)
If your browser is older, you might need to enable the `#experimental-web-platform-features` flag in `about://flags`.

**Devices running iOS are not supported.**

## Installation (\*nix)
```
$ git clone https://github.com/DroopCat/Scope.git
$ cd Scope
$ npm install
$ node server.js
```
