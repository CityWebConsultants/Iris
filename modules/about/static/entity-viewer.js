// Angular bootstrap app
angular.element(document).ready(function () {
  angular.bootstrap(document, ['app']);
});

function C($scope, $attrs, $http) {

  if ($attrs.entities) {

    var entities = $attrs.entities.split(",");

  }

  var queries = [];

  queries.push({
    "comparison": "IS",
    "compare": "adventure",
    "field": "type"
  });

  $http({
    url: "/fetch",
    method: "GET",
    params: {
      "entities[]": entities,
      "queries[]": queries
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
