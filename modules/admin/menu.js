CM.admin.globals.menu = {


};

CM.admin.globals.registerMenuItem = function (name, file) {

  CM.admin.globals.menu[name] = {};

  C.app.get("/admin/" + name.toLowerCase(), function (req, res) {

    if (CM.admin.globals.checkAdmin(req)) {

      res.sendFile(file);

    } else {

      res.redirect("/admin");

    }

  });

};

C.app.get("/admin/menu", function (req, res) {

  if (CM.admin.globals.checkAdmin(req)) {

    var output = '<header><div id="logo"><a href="/admin"></a></div>';

    output += '<ul class="main-menu">';
    Object.keys(CM.admin.globals.menu).forEach(function (element) {

      output += '<li><a href="/admin/' + element + '">' + element + '</a></li>';

    });

    output += '<li><a href="/admin/logout/">Log out</a></li>';

    output += '</ul></header>';

    res.send(output);

  } else {

    res.redirect("/admin");

  }

});
