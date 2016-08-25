# acmehealth-server
Node Server for CRUD API Management Operations

## Project Setup In a Nutshell
### Download Cocoapods (ruby)
```$ sudo gem intall cocoapods```
### Install NodeJS
```$ brew install node```
### Clone Repositories
#### Server
```$ git clone git@github.com:jmelberg/acmehealth-server.git```
#### SPA
```$ git clone git@github.com:jmelberg/acmehealth-spa.git```
#### iOS
```$ git clone git@github.com:jmelberg/acmehealth-swift.git```
### Install Repository Dependencies
#### Server
``` $ npm install```
#### SPA
``` $ npm install http-server -g```
#### iOS
``` $ pod install```   (Takes some time)
### Run the Project
#### Server:
``` $ node server.js --iss "https://example.oktapreview.com/as/aus7xbiefo72YS2QW0h7" --aud "http://localhost:8080"```
#### SPA:
```$ http-server```
#### iOS:
Open `OpenIDConnectSwift.xcworkspace` -> Run 
