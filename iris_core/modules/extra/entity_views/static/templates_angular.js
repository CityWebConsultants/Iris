// Create global iris object if it doesn't yet exist

if (!window.iris) {

  window.iris = {};

}

// Get root object

iris.findRoot = function () {

  //Get location of node.js server

  var root = "";

  //get location of node.js server

  var scripts = document.getElementsByTagName('script');

  var i;

  for (i = 0; i < scripts.length; i += 1) {

    var script = scripts[i];

    if (script.src.indexOf("modules/entity_views/templates_angular.js") !== -1) {

      var root = script.src.replace("modules/entity_views/templates_angular.js", "");

    };

  };

  return root;

};

// Make socket connection and listen for events

if (window.io) {
  iris.socketreceiver = io(iris.findRoot());

  iris.socketreceiver.on('entityCreate', function (data) {

    if (data) {

      iris.checkQuery(data);

    }

  });

  iris.socketreceiver.on('entityUpdate', function (data) {

    if (data) {

      iris.checkQuery(data, true);

    }

  });

  iris.socketreceiver.on('entityDelete', function (data) {

    iris.deleteEntity(data);

  });

}

// Bootstrap angular app automatically. Put in new start and end symbols so as not to clash with handlebars

angular.element(document).ready(function () {
  angular.bootstrap(document, ['iris']);
});

iris.angular = angular.module("iris", [], function ($interpolateProvider) {
  $interpolateProvider.startSymbol('##');
  $interpolateProvider.endSymbol('##');
});


iris.angular.controller("iris-template", ["$scope", "$element", "$attrs", "$timeout", function ($scope, $element, $attrs, $timeout) {

  // Read ng-template property and see if template exists

  var template = $element[0].getAttribute("ng-iris-template");

  if (iris.fetched && iris.fetched[template]) {

    $scope.data = iris.fetched[template].entities;

  }

  // Listen for the event.
  document.addEventListener('entityListUpdate', function (e) {

    $scope.data = iris.fetched[template].entities;
    $scope.$apply();

  }, false);

}]);

//   HTML Filter for showing HTML

iris.angular.filter('html_filter', ['$sce', function ($sce) {
  return function (text) {
    return $sce.trustAsHtml(text);
  };
}]);

// Function for checking if a query is active

iris.checkQuery = function (entity, updating) {

  // Run through all queries

  if (iris.fetched) {

    var updated = [];
    var inserted = [];

    Object.keys(iris.fetched).forEach(function (loader) {

      var outcome = true;

      var loader = iris.fetched[loader],
        query = loader.query,
        entityTypes = query.entities,
        queries = query.queries

      // Check if entity type fits in this query

      if (entityTypes.indexOf(entity.entityType) !== -1) {

        // check if there is a queries object

        if (!queries || !queries.length) {

          queries = [];

        }

        queries.forEach(function (query) {

          //Process query based on operator

          switch (query.comparison) {

            case "IS":

              if (JSON.stringify(entity[query.field]) !== JSON.stringify(query.compare)) {

                outcome = false;

              }
              break;
            case "IN":

              if (entity[query.field].indexOf(query.compare) === -1) {

                outcome = false;

              }
              break;

            case "CONTAINS":

              if (entity[query.field].toString().toLowerCase().indexOf(query.compare.toString().toLowerCase()) === -1) {

                outcome = false;

              }
              break;
          }

        });

        // Check outcome and add/update entity where appropriate

        if (outcome) {

          // Check if entity already exists in entity list. If so it must be an update

          if (iris.fetchedEntities[entity.entityType] && iris.fetchedEntities[entity.entityType][entity.eid]) {

            // Loop over already loaded entities properties and update (can't do a straight = update as that would wipe any references)

            Object.keys(entity).forEach(function (property) {

              iris.fetchedEntities[entity.entityType][entity.eid][property] = entity[property];

            });

            updated.push(entity);

          } else {

            if (!iris.fetchedEntities[entity.entityType]) {

              iris.fetchedEntities[entity.entityType] = {};

            }

            iris.fetchedEntities[entity.entityType][entity.eid] = entity;
            loader.entities.push(iris.fetchedEntities[entity.entityType][entity.eid]);

            inserted.push(entity);

          }

          // Check if sort is present and run it if so

          var sort = function (property, direction) {

            if (direction === "asc") {

              loader.entities.sort(function asc(a, b) {
                if (a[property] < b[property]) {
                  return -1;
                }
                if (a[property] > b[property]) {
                  return 1;
                }
                return 0;
              })

            } else if (direction === "desc") {

              loader.entities.sort(function asc(a, b) {
                if (a[property] > b[property]) {
                  return -1;
                }
                if (a[property] < b[property]) {
                  return 1;
                }
                return 0;
              })

            }

          }

          if (loader.query && loader.query.sort) {

            Object.keys(loader.query.sort).forEach(function (sorter) {

              sort(sorter, loader.query.sort[sorter])

            })

          }

          if (loader.query && loader.query.limit) {

            loader.entities.length = parseInt(loader.query.limit);

          }

        }

      }

    })

    if (updating && (!updated.length && !inserted.length)) {

      // Nothing was updated, means this entity doesn't belong anymore. So delete it.

      iris.deleteEntity(entity);

    }

    // Send event

    document.dispatchEvent(iris.entityListUpdate);

  }

}

iris.deleteEntity = function (entity) {

  // First delete from main entity store if present

  if (iris.fetchedEntities && iris.fetchedEntities[entity.entityType] && iris.fetchedEntities[entity.entityType][entity.eid]) {

    delete iris.fetchedEntities[entity.entityType][entity.eid];

  }

  // Delete from any entity loaders present

  if (iris.fetched) {

    Object.keys(iris.fetched).forEach(function (loader) {

      loader = iris.fetched[loader];

      if (loader.entities) {

        // Loop over all the entities loaded in the loader

        loader.entities.forEach(function (loaderEntity, loaderEntityIndex) {

          if (loaderEntity.eid.toString() === entity.eid.toString()) {

            loader.entities.splice(loaderEntityIndex, 1);

          }

        })

      }

    });

  }

  // Send event

  document.dispatchEvent(iris.entityListUpdate);

}

iris.entityListUpdate = new Event('entityListUpdate');
