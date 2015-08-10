//Administrator

var adminAuth = {
  "secretkey": C.config.secretkey,
  "apikey": C.config.apikey,
};

var credentials = {};

C.testing.post("/auth/maketoken", {
  "credentials": adminAuth,
  "userid": "1"
}).then(function (data) {

  credentials = {
    "userid": "1",
    "token": JSON.parse(data).id,
  };

  checkAuth();

});

var checkAuth = function () {

  C.testing.get("/auth/checkauth", {
    "credentials": credentials
  }).then(function (data) {

    createGroup();

  });

};

var createGroup = function () {

  var group = {

    "name": "test",
    "members": [{
      "userid": "1"
    }, {
      "userid": "1"
    }],
    "type": "public",
    "is121": true,
    "credentials": credentials

  }
      
  C.testing.post("/entity/create/group", group).then(function (data) {

    console.log(data);

  });

};
