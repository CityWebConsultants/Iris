// Angular bootstrap app

angular.element(document).ready(function () {
  angular.bootstrap(document, ['app']);
});

var C = {};

C.entityFetch = function ($scope, $attrs, $http, $sce, $rootScope, $timeout) {

  //Keep array of queries so that only last one gets pushed in

  $scope.queryCount = 0;

  $scope.query = {};
  $scope.entities;

  $attrs.$observe('queries', function (val) {

    fetch();

  });

  $attrs.$observe('entities', function (val) {

    fetch();

  });

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

  C.receiver.on('entityDelete', function (data) {
    fetch()
  });

  var watchers = {};

  var fetch = function () {

    $timeout(function () {

      if ($attrs.queries) {
        val = $attrs.queries.split("|");
      } else {

        val = [];

      }

      if (val[3] === "JSON") {

        val[2] = JSON.parse(val[2]);

      };

      $scope.entities = $attrs.entities;

      $scope.query.field = val[0];
      $scope.query.comparison = val[1];
      $scope.query.compare = val[2];

      if ($scope.query.compare === "*") {

        if (!watchers['search_' + $scope.query.field]) {
          $scope.$watch('search_' + $scope.query.field, function () {
            fetch();
          });
          watchers['search_' + $scope.query.field] = true;
        } else {

          var value = $scope["search_" + $scope.query.field];

          if (value && value.length > 2) {

            $scope.query.compare = value;

          } else {

            $scope.query.compare = null;

          }

        }

      };

      if (!$attrs.queries || $attrs.queries.length === 0) {

        $scope.query = [];

      }

      $scope.queryCount += 1;

      var queryId = $scope.queryCount;

      $http({
        url: root + "fetch",
        method: "GET",
        params: {
          "entities[]": $scope.entities,
          "queries[]": $scope.query,
          "timestamp": Math.random()
        },
        paramSerializer: '$httpParamSerializerJQLike'
      }).then(function (response) {

        if (queryId < $scope.queryCount) {

          return false;

        };

        if ($attrs.id) {

          $rootScope[$attrs.id] = response.data.response;

        };

        if (!$attrs.parent) {

          $scope.data = response.data.response;

          $timeout(function () {

            $scope.$apply();

          });

        } else {

          $scope.current = response.data.response[$attrs.entities][0];

          $timeout(function () {

            $scope.$apply();

          });

        }

      }, function (error) {

        console.log(error);

      });

    });

  }



};

app.controller("C", ["$scope", "$attrs", "$http", "$sce", "$rootScope", "$timeout", C.entityFetch])
