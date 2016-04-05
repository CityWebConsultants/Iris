if (!window.iris) {

  iris = {};

}

// Set iris server

iris.server = document.location.protocol + "//" + document.location.hostname + ":" + document.location.port;

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
