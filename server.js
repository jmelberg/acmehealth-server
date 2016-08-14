var restify = require('restify');
var mongodb = require('mongodb');
var ObjectID = mongodb.ObjectID;

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
          "patient" : appointment.patient
        }
      );
      return next(); 
    }
  });
   
});

// Update appointment
server.put({path: '/appointments/:_id'}, function response(req, res, next) {
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
server.del({path: '/appointments/:id'}, function response(req, res, next) {
  collection.deleteOne({"_id":ObjectID(req.params.id)},
    function (err, results) {
      if (err) { res.send(err); }
      else {
        console.log("Removed entity");
        res.send(204);}
    });
  return next();
});

server.get({path: '/appointments'}, function respond(req, res, next) {
  var cursor = collection.find({}).sort({'startTime' : 1}).toArray(function (err, result) {
    if (err) {  res.send(err); }
    else if (result.length) { console.log("Found: ", result.length); }
    else { console.log("None found"); }
    res.send(200, result);
  });
  return next();
});

// Return available providers
server.get({path: '/providers'}, function respond(req, res, next) {
  res.send(200,
    [
      {
        "id" : "0000001",
        "name" : "Dr. John Doe"
      },
      {
        "id" : "0000002",
        "name" : "Dr. Jane Doe"
      },
      {
        "id" : "0000003",
        "name" : "Dr. Richard Roe"
      }
    ]
  );
  return next();
});

// Delete all from db
server.get({path: '/delete'}, function respond(req, res, next) {
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