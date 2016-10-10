/*  Authors: Karl McGuinness & Jordan Melberg */
/** Copyright © 2016, Okta, Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
 
var yargs = require('yargs');
var url = require('url');
var restify = require('restify');
var loki = require('lokijs');
var passport = require('passport-restify');
var Strategy = require('passport-oauth2-jwt-bearer').Strategy;
var bunyan = require('bunyan');

/**
 * Parse Arguments
 */

var argv = yargs
.usage('\nLaunches Acme Health REST Resource Server\n\n' +
'Usage:\n\t$0 -iss {issuer} -aud {audience}', {
  issuer: {
    description: 'Issuer URI for Authorization Server',
    required: true,
    alias: 'iss',
    string: true
  },
  audience: {
    description: 'Audience URI for Resource Server',
    required: true,
    alias: 'aud',
    default: 'http://api.example.com',
    string: true
  }
})
.example('\t$0 --aud https://example.oktapreview.com/as/aus7xbiefo72YS2QW0h7 --aud http://api.example.com', '')
.argv;


/**
 * Globals
 */

var log = new bunyan.createLogger({name: 'acme-health-server'});

var strategy = new Strategy(
  {
    audience: argv.audience,
    issuer: argv.issuer,
    metadataUrl: argv.issuer + '/.well-known/oauth-authorization-server',
    loggingLevel: 'debug'
  }, function(token, done) {
    // done(err, user, info)
    return done(null, token);
  });

var server = restify.createServer(
  {
    log: log,
    serializers: restify.bunyan.serializers
  });

// Local DB
var db = new loki('AcmeHealth');
var appointments = db.addCollection('appointments', {});

/**
 * Middleware Configuration
 */

server.use(restify.requestLogger());
server.use(restify.bodyParser());
server.use(passport.initialize());
passport.use(strategy);

// Add CORS Access
server.use(restify.CORS());
restify.CORS.ALLOW_HEADERS.push("authorization");
restify.CORS.ALLOW_HEADERS.push("withcredentials");
restify.CORS.ALLOW_HEADERS.push("x-requested-with");
restify.CORS.ALLOW_HEADERS.push("x-forwarded-for");
restify.CORS.ALLOW_HEADERS.push("x-customheader");
restify.CORS.ALLOW_HEADERS.push("user-agent");
restify.CORS.ALLOW_HEADERS.push("keep-alive");
restify.CORS.ALLOW_HEADERS.push("host");
restify.CORS.ALLOW_HEADERS.push("accept");
restify.CORS.ALLOW_HEADERS.push("connection");
restify.CORS.ALLOW_HEADERS.push("content-type");


server.on('after', restify.auditLogger({log: log}));

/**
 * Routes
 */

// Post appointment
server.post({path: '/appointments'}, function(req, res, next) {
  var newAppointment = req.params;

  // Update required schema fields
  newAppointment.status = "REQUESTED";
  newAppointment.created = new Date();
  newAppointment.lastUpdated = new Date();
  newAppointment.startTime = new Date(req.params.startTime);
  newAppointment.location = "Office";

  // Format endTime
  var endTime = new Date(newAppointment.startTime);
  newAppointment.endTime = new Date(endTime.setHours(endTime.getHours() + 1));

  // Insert into DB
  var insertAppointment = appointments.insert( newAppointment );
  try {
    res.send(201, newAppointment);
  } catch (err) { res.send(400, err); }
  
  return next();
  
});

// Update appointment
// Scopes Required: 'appointments:confirm' AND/OR 'appointments:cancel' AND/OR 'appointments:edit'
server.put({path: '/appointments/:_id'},
  passport.authenticate('oauth2-jwt-bearer', { session: false,
    scopes: ['appointments:confirm'] || ['appointments:cancel'] || ['appointments:edit'] }),
  function response(req, res, next) {

      // Manually update "lastUpdated" field
      var editAppointment = req.params;
      editAppointment.lastUpdated = new Date();

      // Remove param from json
      delete editAppointment["_id"];
      
      try {
        appointments.update(editAppointment);
        res.send(200, editAppointment);
      } catch (err) {  res.send(400, err);  }

      return next();
    });

// Delete appointment
// Scope Required: 'appointments:cancel'
server.del({path: '/appointments/:id'},
  passport.authenticate('oauth2-jwt-bearer', { session: false, scopes: ['appointments:cancel'] }),
  function response(req, res, next) {
    var removeAppointment = appointments.findOne({"$loki" : req.params.id}).data();
    try {
      appointments.remove(removeAppointment);
      res.send(204);
    } catch (err) { res.send(404, err);  }
    
    return next();
  });

// Scope Required: 'appointments:read'
server.get({path: '/appointments/:filter'},
  passport.authenticate('oauth2-jwt-bearer', { session: false , scopes: ['appointments:read']}),
  function respond(req, res, next) {
    var patientQuery = appointments.chain().find(
      {
        $or: [
          {'patientId' : req.params.filter},
          {'providerId' : req.params.filter}
        ]
      }).data();
    console.log("\n\nPatients: " + patientQuery + "\n\n");
    var all = appointments.chain().find({}).data();
    console.log(JSON.stringify(all, null, 4));
    res.send(200, patientQuery);
    
    return next();
  });

// Return available providers
// Scope Required: 'providers:read'
server.get({path: '/providers'},
  passport.authenticate('oauth2-jwt-bearer', { session: false, scopes: ['providers:read'] }),
  function respond(req, res, next) {

    // Id given is Okta user_id/sub
    res.send(200,
      [
        {
          "id" : "00u80l4aziQTF1NNH0h7",
          "name" : "Dr. John Doe",
          "profileImageUrl" : "https://raw.githubusercontent.com/jmelberg/acmehealth-swift/master/AcmeHealth/Assets.xcassets/0000001.imageset/0000001.png"
        },
        {
          "id" : "00u80l8xca6FLKQyT0h7",
          "name" : "Dr. Jane Doe",
          "profileImageUrl" : "https://raw.githubusercontent.com/jmelberg/acmehealth-swift/master/AcmeHealth/Assets.xcassets/0000002.imageset/0000002.png"
        },
        {
          "id" : "00u80l8xcoPyO4q3w0h7",
          "name" : "Dr. Richard Roe",
          "profileImageUrl" : "https://raw.githubusercontent.com/jmelberg/acmehealth-swift/master/AcmeHealth/Assets.xcassets/0000003.imageset/0000003.png"
        }
      ]
    );

    return next();
  }
  );

// Delete all from db
server.get({path: '/delete'},
  function respond(req, res, next) {
    var removeAll = appointments.chain().remove();
    console.log("Removed all entries from database");
    res.send(204);
    
    return next();
  });

server.listen(8088, '0.0.0.0', function() {
  log.info('listening: %s', server.url);
});
