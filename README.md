# Scope
LaserTag in the browser with Recoil hardware

Most chromium based browsers are compatable

## Installation
```
$ cd Scope
$ npm install
$ sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ./selfsigned.key -out selfsigned.crt
$ node index.js
```

