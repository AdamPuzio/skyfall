# Skyfall Server Monitor

Skyfall is a simple server monitoring application. There are 2 parts, the server (web app) 
and the satellites. The server opens connections to different satellites and streams data 
(such as server load) back to the web app. Skyfall is easily configurable to connect to 
different servers and stacks, as well as to be able to stream different data.

## Installation
    npm install
	
To run both the server and satellite:

``` bash
$ node app.js
```
	
To run just the server:

``` bash
$ node server.js
```
	
To run just the satellite:

``` bash
$ node satellite.js
```

### Sample Installation

Skyfall can be installed and run immediately on a machine to see how it works. Simply run 
the install and then go to [http://localhost:3000](http://localhost:3000). 

## Configuration

[NConf](https://github.com/flatiron/nconf) is the configuration module of choice. It has 
been set up in `config/app-config.js` to be able to parse no config file, a default config 
file or take command line arguments or environmental variables to either set config variables 
or load specific config files. It will automatically attempt to load `config/config.js`.

``` bash
$ NODE_ENV=production app.js
```
This will attempt to load the config file `config/env/production.json`.

``` bash
$ app.js --config test
```
This will attempt to load the config file `config/test.json`

## Modules

Skyfall is designed to be a window into your servers. While there is a basic server load monitor 
built in, the real power is in the ability to customize and create your own Skyfall modules. 
Each module should be built with both server-and-client-side functionality in mind. Skyfall 
modules reside in `/skyfall_modules` and must include both a `satellite.js` and `skyfall.json` 
file.

## Docs & Resources
### Node.js Modules
* [Express](https://github.com/visionmedia/express)
* [EJS](https://github.com/visionmedia/ejs)
* [EJS-Locals](https://github.com/RandomEtc/ejs-locals)
* [LESS Middleware](https://github.com/emberfeather/less.js-middleware)
* [Socket.io](https://github.com/learnboost/socket.io/)
* [Socket.io Client](https://github.com/LearnBoost/socket.io-client)
* [Async](https://github.com/caolan/async)
* [Underscore.js](https://github.com/jashkenas/underscore)
* [NConf](https://github.com/flatiron/nconf)

### Front-end Libraries
* [Bootstrap](https://github.com/twbs/bootstrap)