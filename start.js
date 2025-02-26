require("dotenv").config();

var express = require("express"); // For web server
var Axios = require("axios"); // A Promised base http client
var bodyParser = require("body-parser"); // Receive JSON format

// Set up Express web server
var app = express();
app.use(bodyParser.json());
app.use(express.static(__dirname + "/www"));

// This is for web server to start listening to port 3000
app.set("port", 3000);
var server = app.listen(app.get("port"), function () {
  console.log("Server listening on port " + server.address().port);
});

//-------------------------------------------------------------------
// Configuration for your Forge account
// Initialize the 2-legged OAuth2 client, and
// set specific scopes
//-------------------------------------------------------------------
var FORGE_CLIENT_ID = process.env.FORGE_CLIENT_ID;
var FORGE_CLIENT_SECRET = process.env.FORGE_CLIENT_SECRET;
var access_token = "";
var scopes = "data:read data:write";
const querystring = require("querystring");
console.log(btoa(FORGE_CLIENT_ID + ":" + FORGE_CLIENT_SECRET));
// const res = await fetch(ENDPOINT_AUTODESK_AUTHENTICATION_TOKEN, {
//   method: "POST",
//   headers: {
//     "Content-Type": "application/x-www-form-urlencoded",
//   },
//   body: new URLSearchParams({
//     client_id: CLIENT_ID,
//     grant_type: "refresh_token",
//     refresh_token: refresh_token,
//     scope: "data:read",
//   }),
// });

// // Route /api/forge/oauth
app.get("/api/forge/oauth", function (req, res) {
  Axios({
    method: "POST",
    url: "https://developer.api.autodesk.com/authentication/v2/token",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      Authorization: `Basic ${btoa(
        FORGE_CLIENT_ID + ":" + FORGE_CLIENT_SECRET
      )}`,
    },
    data: querystring.stringify({
      // client_id: FORGE_CLIENT_ID,
      // client_secret: FORGE_CLIENT_SECRET,
      grant_type: "client_credentials",
      scope: scopes,
    }),
  })
    .then(function (response) {
      // Success
      access_token = response.data.access_token;
      console.log(response);
      res.send(
        '<p>Authentication success!</p><a href="/api/forge/recap/photoscene/add">Add a photoscene</a>'
      );
    })
    .catch(function (error) {
      // Failed
      console.log(error);
      res.send("Failed to authenticate");
    });
});

// Route /api/forge/recap/photoscene/add
// Creates and initializes a photoscene for reconstruction.
app.get("/api/forge/recap/photoscene/add", function (req, res) {
  Axios({
    method: "POST",
    url: "https://developer.api.autodesk.com/photo-to-3d/v1/photoscene",
    headers: {
      "content-type": "application/json",
      Authorization: "Bearer " + access_token,
    },
    data: querystring.stringify({
      scenename: "myscenename",
      format: "rcm",
    }),
  })
    .then(function (response) {
      // Success
      console.log(response);
      if (response.data.Error) {
        res.send(response.data.Error.msg);
      }
      var photosceneId = response.data.Photoscene.photosceneid;
      var nextLink =
        "/api/forge/recap/photoscene/upload?photosceneid=" + photosceneId;
      res.send(
        '<p>Photoscene added!</p><a href="' +
          nextLink +
          '">Upload files to photoscene</a>'
      );
    })
    .catch(function (error) {
      // Failed
      console.log(error);
      res.send("Failed to create a photoscene");
    });
});

// Route /api/forge/recap/photoscene/upload
// Adds one or more files to a photoscene.
app.get("/api/forge/recap/photoscene/upload", function (req, res) {
  var photosceneId = req.query.photosceneid;
  Axios({
    method: "POST",
    url: "https://developer.api.autodesk.com/photo-to-3d/v1/file",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      Authorization: "Bearer " + access_token,
    },
    data: querystring.stringify({
      photosceneid: photosceneId,
      type: "image",
      'file[0]': 'https://raw.githubusercontent.com/RealityVirtually2019/ideateAR/master/Assets/AutoDesk/leapcontroller1.jpg',
      'file[1]': 'https://raw.githubusercontent.com/RealityVirtually2019/ideateAR/master/Assets/AutoDesk/leapcontroller2.jpg',
      'file[2]': 'https://raw.githubusercontent.com/RealityVirtually2019/ideateAR/master/Assets/AutoDesk/leapcontroller3.jpg',
      'file[3]': 'https://raw.githubusercontent.com/RealityVirtually2019/ideateAR/master/Assets/AutoDesk/leapcontroller4.jpg',
      'file[4]': 'https://raw.githubusercontent.com/RealityVirtually2019/ideateAR/master/Assets/AutoDesk/leapcontroller5.jpg',
      'file[5]': 'https://raw.githubusercontent.com/RealityVirtually2019/ideateAR/master/Assets/AutoDesk/leapcontroller6.jpg',
      'file[6]': 'https://raw.githubusercontent.com/RealityVirtually2019/ideateAR/master/Assets/AutoDesk/leapcontroller7.jpg',
      'file[7]': 'https://raw.githubusercontent.com/RealityVirtually2019/ideateAR/master/Assets/AutoDesk/leapcontroller8.jpg',
      'file[8]': 'https://raw.githubusercontent.com/RealityVirtually2019/ideateAR/master/Assets/AutoDesk/leapcontroller9.jpg'
    }),
  })
    .then(function (response) {
      // Success
      console.log(response);
      if (response.data.Error) {
        res.send(response.data.Error.msg);
      }
      console.log(JSON.stringify(response.data.Files));
      var nextLink =
        "/api/forge/recap/photoscene/process?photosceneid=" + photosceneId;
      res.send(
        '<p>Files added to photoscene!</p><a href="' +
          nextLink +
          '">Begin processing photoscene</a>'
      );
    })
    .catch(function (error) {
      // Failed
      console.log(error);
      res.send("Failed to upload files to photoscene");
    });
});

// Route /api/forge/recap/photoscene/process
// Starts photoscene processing.
app.get("/api/forge/recap/photoscene/process", function (req, res) {
  var photosceneId = req.query.photosceneid;
  Axios({
    method: "POST",
    url:
      "https://developer.api.autodesk.com/photo-to-3d/v1/photoscene/" +
      photosceneId,
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      Authorization: "Bearer " + access_token,
    },
  })
    .then(function (response) {
      // Success
      console.log(response);
      if (response.data.Error) {
        res.send(response.data.Error.msg);
      }
      var nextLink =
        "/api/forge/recap/photoscene/checkprogress?photosceneid=" +
        photosceneId;
      res.send(
        '<p>Photoscene is being processed!</p><a href="' +
          nextLink +
          '">Check progress of photoscene</a>'
      );
    })
    .catch(function (error) {
      // Failed
      console.log(error);
      res.send("Failed to process files in photoscene");
    });
});

// Route /api/forge/recap/photoscene/checkprogress
// Returns the processing progress and status of a photoscene.
app.get("/api/forge/recap/photoscene/checkprogress", function (req, res) {
  var photosceneId = req.query.photosceneid;
  Axios({
    method: "GET",
    url:
      "https://developer.api.autodesk.com/photo-to-3d/v1/photoscene/" +
      photosceneId +
      "/progress",
    headers: {
      "content-type": "application/json",
      Authorization: "Bearer " + access_token,
    },
  })
    .then(function (response) {
      // Success
      console.log(response);
      console.log(response.data);
      if (response.data.Error) {
        res.send(response.data.Error.msg);
      }
      if (
        response.data.Photoscene &&
        response.data.Photoscene.progressmsg == "DONE"
      ) {
        var nextLink =
          "/api/forge/recap/photoscene/result?photosceneid=" + photosceneId;
        res.send(
          '<p>Photoscene process is complete!</p><a href="' +
            nextLink +
            '">View result of photoscene</a>'
        );
      } else {
        var nextLink =
          "/api/forge/recap/photoscene/delete?photosceneid=" + photosceneId;
        res.send(
          '<p>Photoscene is not ready, this may take a while. Try refreshing <a href="/api/forge/recap/photoscene/checkprogress?photosceneid=' +
            photosceneId +
            '">this page</a>. Progress: ' +
            response?.data?.Photoscene?.progress || 0 +
            "%...</p>"
        );
      }
    })
    .catch(function (error) {
      // Failed
      console.log(error);
      res.send("Failed to check progress of photoscene");
    });
});

// Route /api/forge/recap/photoscene/result
// Returns a time-limited HTTPS link to an output file of the specified format.
app.get("/api/forge/recap/photoscene/result", function (req, res) {
  var photosceneId = req.query.photosceneid;
  Axios({
    method: "GET",
    url:
      "https://developer.api.autodesk.com/photo-to-3d/v1/photoscene/" +
      photosceneId
    //   +
    //   "?format=obj"
      ,
    headers: {
      "content-type": "application/json",
      Authorization: "Bearer " + access_token,
    },
  })
    .then(function (response) {
      // Success
      console.log(response);
      if (response.data.Error) {
        res.send(response.data.Error.msg);
      }
      if (
        response.data.Photoscene &&
        response.data.Photoscene.progressmsg == "DONE"
      ) {
        var nextLink =
          "/api/forge/recap/photoscene/delete?photosceneid=" + photosceneId;
        res.send(
          "<p>Success! This is the scene link:</p><p>" +
            response.data.Photoscene.scenelink +
            "</p>" +
            'Would you like to <a href="' +
            nextLink +
            '">delete photoscene</a>?'
        );
      } else {
        res.send(
          'Photoscene is not ready. Try refreshing <a href="/api/forge/recap/photoscene/checkprogress?photosceneid=' +
            photosceneId +
            '">this page</a>. Progress: ' +
            response?.data?.Photoscene?.progress +
            "%..."
        );
      }
    })
    .catch(function (error) {
      // Failed
      console.log(error);
      res.send("Failed to get result of photoscene");
    });
});

// Route /api/forge/recap/photoscene/delete
// Deletes a photoscene and its associated assets (images, output files, ...).
app.get("/api/forge/recap/photoscene/delete", function (req, res) {
  var photosceneId = req.query.photosceneid;
  Axios({
    method: "DELETE",
    url:
      "https://developer.api.autodesk.com/photo-to-3d/v1/photoscene/" +
      photosceneId,
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      Authorization: "Bearer " + access_token,
    },
  })
    .then(function (response) {
      // Success
      console.log(response);
      if (response.data.Error) {
        res.send(response.data.Error.msg);
      }
      res.send("<p>Photoscene deleted!</p>");
    })
    .catch(function (error) {
      // Failed
      console.log(error);
      res.send("Failed to delete photoscene");
    });
});
