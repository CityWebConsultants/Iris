// Angular bootstrap app

angular.element(document).ready(function () {
  angular.bootstrap(document, ['app']);
});

var C = {};

C.entityFetch = function ($scope, $attrs, $http) {

  //get location of node.js server

  var scripts = document.getElementsByTagName('script'),
    script = scripts[scripts.length - 1].src;

  var root = script.replace("entity-viewer.js", "");

  //Set up socket.io listener

  C.receiver = io(root);

  if ($attrs.entities) {

    var entities = $attrs.entities.split(",");

  }

  var finalQueries = [];

  if ($attrs.queries) {

    var queries = $attrs.queries.split(",");

    queries.forEach(function (query) {

      var query = query.split(":");

      var query = {

        "comparison": query[1],
        "field": query[0],
        "compare": query[2]

      }

      finalQueries.push(query);

    });

  }

  C.receiver.on('entityUpdate', function (data) {
    fetch()
  });

  var fetch = function () {

    $http({
      url: root + "fetch",
      method: "GET",
      params: {
        "entities[]": entities,
        "queries[]": finalQueries
      },
      paramSerializer: '$httpParamSerializerJQLike'
    }).then(function (response) {

      $scope.data = response.data.response;

    }, function (response) {

      console.log(response);

    });

  }

  fetch();

};

var app = angular.module("app", []);

app.controller("C", ["$scope", "$attrs", "$http", C.entityFetch])
