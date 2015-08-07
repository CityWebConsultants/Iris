//Administrator

var adminAuth = {
  "secretkey": C.config.secretkey,
  "apikey": C.config.apikey
};

C.testing.get("/auth/checkauth", {
  "credentials": adminAuth
}).then(function (data) {

  console.log(data);

});

