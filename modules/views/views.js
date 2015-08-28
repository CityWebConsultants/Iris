C.registerModule("views");

C.app.get("/admin/views/create/:type/form", function (req, res) {

  if (C.dbCollections[req.params.type]) {

    var tree = C.dbCollections[req.params.type].schema.tree;

    var fields = [];

    Object.keys(tree).forEach(function (field) {

      if (tree[field].type === String) {

        fields.push(field);

      }

    });

    res.send(fields);

  };

});

C.app.post("/views/create/:type", function (req, res) {
  
  var fs = require("fs");
  
  req.body.type = req.params.type;

  if (req.authPass.roles.indexOf("admin") !== -1) {

    fs.writeFileSync(C.sitePath + "/configurations/views/" + req.params.type+"_"+req.body.title+".JSON", JSON.stringify(req.body), "utf8");

  } else {

    res.redirect("/admin");

  }


});

C.app.get("/admin/views/create/:type", function (req, res) {

  if (req.authPass.roles.indexOf("admin") !== -1) {

    res.sendFile(__dirname + "/templates/views.html");

  } else {

    res.redirect("/admin");

  }

});
