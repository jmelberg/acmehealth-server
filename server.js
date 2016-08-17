var url = require('url');
var restify = require('restify');
var mongodb = require('mongodb');
var passport = require('passport-restify');
var Strategy = require('passport-oauth2-jwt-bearer').Strategy;
var ObjectID = mongodb.ObjectID;

var audience = 'Jw1nyzbsNihSuOETY3R1';
var issuer =   'https://jordandemo.oktapreview.com/as/ors6hokuutxf4qXr80h7';

// var metadataUrl = 'http://rain.okta1.com:1802/.well-known/openid-configuration';
var metadataUrl = 'https://jordandemo.oktapreview.com/.well-known/openid-configuration';

// Database url
var url = 'mongodb://localhost:27017/'
var collection;
mongodb.MongoClient.connect(url, function(err, db) {
  if (err == null){
      console.log("connected successfully");
      collection = db.collection('appointments');
  }
});

var server = restify.createServer();
server.use(restify.bodyParser());
server.use(
  function crossOrigin(req,res,next){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    return next();
  }
);

server.use(passport.initialize());
var strategy = new Strategy({
  audience: audience,
  issuer: issuer,
  metadataUrl: metadataUrl,
  loggingLevel: 'debug'
}, function(token, done) {
  // done(err, user, info)
  return done(null, token);
});
passport.use(strategy);


// Add CORS Access
server.use(restify.CORS());
restify.CORS.ALLOW_HEADERS.push( "authorization"        );
restify.CORS.ALLOW_HEADERS.push( "withcredentials"      );
restify.CORS.ALLOW_HEADERS.push( "x-requested-with"     );
restify.CORS.ALLOW_HEADERS.push( "x-forwarded-for"      );
restify.CORS.ALLOW_HEADERS.push( "x-real-ip"            );
restify.CORS.ALLOW_HEADERS.push( "x-customheader"       );
restify.CORS.ALLOW_HEADERS.push( "user-agent"           );
restify.CORS.ALLOW_HEADERS.push( "keep-alive"           );
restify.CORS.ALLOW_HEADERS.push( "host"                 );
restify.CORS.ALLOW_HEADERS.push( "accept"               );
restify.CORS.ALLOW_HEADERS.push( "connection"           );
restify.CORS.ALLOW_HEADERS.push( "content-type"         );


// Post appointment
server.post({path: '/appointments'}, function(req, res, next) {
  var appointment = req.params;
  console.log("Received: ", req.params)

  // Update required schema fields
  appointment.status = "REQUESTED";
  appointment.created = new Date();
  appointment.lastUpdated = new Date();
  appointment.startTime = new Date(req.params.startTime);
  appointment.location = "Office";

  // Format endTime
  var endTime = new Date(appointment.startTime);
  appointment.endTime = new Date(endTime.setHours(endTime.getHours() + 1));

  var status_code;

  // Insert into DB
  collection.insertOne( appointment, function(err, result) {
    if(err == null){
      console.log("Inserted appointment [" + result["ops"][0]["_id"] + "] into collection");
      res.send(status_code,
        {
          "id": result["ops"][0]["_id"],
          "status": appointment.status,
          "created": appointment.created,
          "lastUpdated": appointment.lastUpdated,
          "comment": appointment.comment,
          "startTime": appointment.startTime,
          "endTime": appointment.endTime,
          "location": appointment.location,
          "providerId": appointment.providerId,
          "patientId" : appointment.patientId,
          "patient" : appointment.patient
        }
    );
    return next(); 
    } else {
      console.log("An error occureed");
      res.send(status_code,
        {
          "id": result["ops"][0]["_id"],
          "status": appointment.status,
          "created": appointment.created,
          "lastUpdated": appointment.lastUpdated,
          "comment": appointment.comment,
          "startTime": appointment.startTime,
          "endTime": appointment.endTime,
          "location": appointment.location,
          "providerId": appointment.providerId,
          "patientId" : appointment.patientId,
          "patient" : appointment.patient

        }
      );
      return next(); 
    }
  });
});

// Update appointment
server.put({path: '/appointments/:_id'},
  passport.authenticate('oauth2-jwt-bearer', { session: false, scopes: ['appointments:write'] }),
  function response(req, res, next) {
  // Manually update "lastUpdated" field
  var editAppointment = req.params;
  editAppointment.lastUpdated = new Date();

  collection.updateOne( {"_id":ObjectID(req.params["_id"])},
   {
    'created' : editAppointment.created,
    'lastUpdate': editAppointment.lastUpdated,
    'comment' : editAppointment.comment,
    'status' : editAppointment.status,
    'startTime' : editAppointment.startTime,
    'endTime' : editAppointment.endTime,
    'location' : editAppointment.location,
    'providerId' : editAppointment.providerId,
    'patientId' : editAppointment.patientId,
    'patient' : editAppointment.patient
   }, true );
  var updated = collection.find({"_id":ObjectID(req.params["_id"])}).toArray(function(err, result) {
    if(err) {res.send(err); }
    else if (result.length) {console.log("Found: ", result[0])}
    else { console.log("None found") ;}
  })
  res.send(200, editAppointment);
  return next();
});

// Delete appointment
server.del({path: '/appointments/:id'},
  passport.authenticate('oauth2-jwt-bearer', { session: false, scopes: ['appointments:write'] }),
  function response(req, res, next) {
  collection.deleteOne({"_id":ObjectID(req.params.id)},
    function (err, results) {
      if (err) { res.send(err); }
      else {
        console.log("Removed entity");
        res.send(204);}
    });
  return next();
});

// Scope Required: 'appointments:read'
server.get({path: '/appointments'},
  passport.authenticate('oauth2-jwt-bearer', { session: false , scopes: ['appointments:read']}),
  function respond(req, res, next) {
    var cursor = collection.find({}).sort({'startTime' : 1}).toArray(function (err, result) {
    if (err) {  res.send(err); }
    else if (result.length) { console.log("Found: ", result.length); }
    else { console.log("None found"); }
    res.send(200, result);
    });
    return next();
  }
);

// Return available providers
// Scope Required: 'API'

server.get({path: '/providers'},
  passport.authenticate('oauth2-jwt-bearer', { session: false, scopes: ['providers:read'] }),
  function respond(req, res, next) {
    res.send(200,
    [
      {
        "id" : "00u7vh4zm1l7YIjPB0h7",
        "name" : "Dr. John Doe"
      },
      {
        "id" : "00u7vg8f6mBaaa8cw0h7",
        "name" : "Dr. Jane Doe"
      },
      {
        "id" : "00u7vfod51Q0RBghC0h7",
        "name" : "Dr. Richard Roe"
      }
    ]
  );
    return next();
  }
);

// Delete all from db
server.get({path: '/delete'},
    passport.authenticate('oauth2-jwt-bearer', { session: false, scopes: ['appointments:write'] }),
    function respond(req, res, next) {
    var cursor = collection.find({}).toArray(function (err, result) {
      if (err) { res.send(err);}
      else {
        collection.deleteMany({});
        console.log("Removed all entries from database");
        res.send(204);
      }
    });
    return next();
});


server.listen(8088, function() {
  console.log('listening: %s', server.url);
});
