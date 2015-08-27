// Angular bootstrap app

angular.element(document).ready(function () {
  angular.bootstrap(document, ['app']);
});

var C = {};

C.entityFetch = function ($scope, $attrs, $http, $sce) {

  var root = "";

  //get location of node.js server

  var scripts = document.getElementsByTagName('script');

  var i;

  for (i = 0; i < scripts.length; i += 1) {

    var script = scripts[i];

    if (script.src.indexOf("entity_views/entity-viewer.js") !== -1) {

      var root = script.src.replace("entity_views/entity-viewer.js", "");

    };

  };

  //Set up socket.io listener

  C.receiver = io(root);

  C.receiver.on('entityUpdate', function (data) {
    fetch()
  });

  var watchers = {};

  var fetch = function () {

    var finalQueries = [];

    if ($attrs.entities) {

      var entities = $attrs.entities.split(",");

    }

    if ($attrs.queries) {

      var queries = $attrs.queries.split(",");

      queries.forEach(function (query) {

        var query = query.split(":");

        var query = {

          "comparison": query[1],
          "field": query[0],
          "compare": query[2]

        }

        //Set up watch event for wildcards

        if (query.compare === "*") {

          if (!watchers['search_' + query.field]) {
            $scope.$watch('search_' + query.field, function () {
              fetch();
            });
            watchers['search_' + query.field] = true;
          }

        };

        finalQueries.push(query);

      });

    }

    var processedQueries = [];

    //Generate any search queries

    finalQueries.forEach(function (currentQuery, index) {

      if (currentQuery.compare === "*") {

        if ($scope["search_" + currentQuery.field] && $scope["search_" + currentQuery.field].length > 1) {

          currentQuery.compare = $scope["search_" + currentQuery.field];
          processedQueries.push(currentQuery);

        } else {

          processedQueries.push(currentQuery);

        }

      } else {

        processedQueries.push(currentQuery);

      }

    });

    $http({
      url: root + "fetch",
      method: "GET",
      params: {
        "entities[]": entities,
        "queries[]": processedQueries
      },
      paramSerializer: '$httpParamSerializerJQLike'
    }).then(function (response) {

      if (!$attrs.parent) {

        $scope.data = response.data.response;

      } else {

        $scope.current = response.data.response[$attrs.entities][0];

      }

    }, function (error) {

      console.log(error);

    });

  }

  fetch();

};

var app = angular.module("app", []);

app.filter('html_filter', ['$sce', function ($sce) {
  return function (text) {
    return $sce.trustAsHtml(text);
  };
}]);

app.controller("C", ["$scope", "$attrs", "$http", "$sce", C.entityFetch])
