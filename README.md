# AcmeHealth Server

The projects serves as the backend for the AcmeHealth system. It performs simple OAuth token validation and CRUD operations for appointements. After configuring this project, you must also deploy one of the front end applications.

The front end projects are available in [Angular single page application](https://github.com/jmelberg/acmehealth-spa) or a [Swift mobile app](https://github.com/jmelberg/acmehealth-swift).

## Project Setup In a Nutshell
### Download Cocoapods (ruby)
```$ sudo gem install cocoapods```

### Install NodeJS
```$ brew install node```

### Clone Repository
```$ git clone git@github.com:jmelberg/acmehealth-server.git```

### Install Node
**Note:** Version 6.9.4 works out of the box. Please use this over any other versions of node.
```
$ npm install -g n
$ n 6.9.4
```

### Install the Server
``` $ npm install --no-optional```

### Run the Server:
``` $ node server.js --iss "https://example.oktapreview.com/oauth2/aus7xbiefo72YS2QW0h7" --aud "http://localhost:8080"```
