// Angular bootstrap app
angular.element(document).ready(function () {
  angular.bootstrap(document, ['app']);
});

function C($scope, $attrs, $http) {

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
  
  $http({
    url: "/fetch",
    method: "GET",
    params: {
      "entities[]": entities,
      "queries[]": finalQueries
    },
    paramSerializer: '$httpParamSerializerJQLike'
  }).then(function (response) {

    $scope.data = response.data.response;

  }, function (response) {

    console.error(response);

  });


};

var app = angular.module("app", []);

app.controller("C", ["$scope", "$attrs", "$http", C])

app.directive('entity', function () {
  return {
    scope: {
      datasource: '=',
    },
    controller: function ($scope) {



    }

  };
});
