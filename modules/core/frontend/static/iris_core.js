if (!window.iris) {

  window.iris = {};

}

// Set iris server

iris.server = document.location.protocol + "//" + document.location.hostname + ":" + document.location.port;

document.addEventListener("DOMContentLoaded", function (event) {

  // socket.io and liveupdates

  if (window.io) {

    iris.socketreceiver = io(iris.server);

  }

  if (iris.socketreceiver) {

    var liveUpdaters = document.querySelectorAll("[data-liveupdate]");

    var liveEmbed;

    for (var i = 0; i < liveUpdaters.length; i += 1) {

      var embedID = liveUpdaters[i].getAttribute("data-liveupdate");

      iris.socketreceiver.emit("liveEmbedRegister", embedID)

    }

    iris.socketreceiver.on("liveUpdate", function (data) {

      var block = document.querySelector('[data-liveupdate="' + data.id + '"]');

      block.innerHTML = data.content;

    })

  }

});

// Function for reading cookies

(function () {
  var cookies;

  function readCookie(name, c, C, i) {
    if (cookies) {
      return cookies[name];
    }

    c = document.cookie.split('; ');
    cookies = {};

    for (i = c.length - 1; i >= 0; i--) {
      C = c[i].split('=');
      cookies[C[0]] = C[1];
    }

    return cookies[name];
  }

  iris.readCookie = readCookie;

})();

if (iris.readCookie("userid")) {

  iris.credentials = {
    "userid": iris.readCookie("userid"),
    "token": iris.readCookie("token"),
  };

}
