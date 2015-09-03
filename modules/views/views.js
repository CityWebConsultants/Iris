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

    // Static JSON version of view

    fs.writeFileSync(C.sitePath + "/configurations/views/" + req.params.type + "_" + req.body.title + ".JSON", JSON.stringify(req.body), "utf8");

    var queries = [];

    req.body.conditions.forEach(function (query) {

      queries.push(query.field + ":" + query.operator.toUpperCase() + ":" + query.value);

    });

    var queries = queries.join(",");

    var output = '<div ng-controller="C" entities="' + req.params.type + '" queries="' + queries + '">';

    output += "<span ng-repeat='field in data." + req.params.type + "'>";

    req.body.fields.forEach(function (element) {

      if (JSON.parse(element.allowhtml)) {

        output += "<" + element.wrapper + " " + "class='" + element.class + "'" + "ng-bind-html='field." + element.field + " | html_filter'" + ">" + "< /" + element.wrapper + ">";

      } else {

        output += "<" + element.wrapper + " class='" + element.class + "'" + " >" + "{{field." + element.field + "}}" + "</" + element.wrapper + ">";

      }

    });

    output += "</span>";

    output += "</div>";

    fs.writeFileSync(C.sitePath + "/configurations/frontend/templates/" + req.params.type + "_" + req.body.title.split(" ").join("-") + ".html", output, "utf8");

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
