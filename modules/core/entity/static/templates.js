// Create global iris object if it doesn't yet exist

function irisReady(fn) {

  if (document.readyState !== 'loading') {

    fn();

  }

  else {

    document.addEventListener('DOMContentLoaded', fn);

  }

}

if (!window.iris) {

  window.iris = {};

}

// Make socket connection and listen for events

irisReady(function () {

  if (window.io && iris.server) {

    iris.socketreceiver = io(iris.server);

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
          queries = query.queries;

        // Check if entity type fits in this query

        if (entityTypes.indexOf(entity.entityType) !== -1) {

          // check if there is a queries object

          if (!queries || !queries.length) {

            queries = [];

          }

          queries.forEach(function (query) {

            //Process query based on operator

            switch (query.operator) {

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

              // Loop over entities in loader and check it's not already there as this can happen with more than one similar loader on the page

              var present;

              loader.entities.forEach(function (currentEntity) {

                if (currentEntity.eid === entity.eid) {

                  present = true;

                }

              });

              if (!present) {

                loader.entities.push(iris.fetchedEntities[entity.entityType][entity.eid]);
              }

              updated.push(entity);

            }

            else {

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
                });

              }
              else if (direction === "desc") {

                loader.entities.sort(function asc(a, b) {

                  if (a[property] > b[property]) {

                    return -1;

                  }

                  if (a[property] < b[property]) {

                    return 1;

                  }

                  return 0;

                });

              }

            };

            if (loader.query && loader.query.sort) {

              Object.keys(loader.query.sort).forEach(function (sorter) {

                sort(sorter, loader.query.sort[sorter]);

              });

            }

            if (loader.query && loader.query.limit) {

              if (loader.entities.length > parseInt(loader.query.limit)) {

                loader.entities.length = parseInt(loader.query.limit);

              }

            }

          }

        }

      });

      if (updating && (!updated.length && !inserted.length)) {

        // Nothing was updated, means this entity doesn't belong anymore. So delete it.

        iris.deleteEntity(entity);

      }

      // Send event

      var detail = {
        entities: {}
      };

      detail.entities[entity.entityType] = [entity];

      detail.event = 'update';

      iris.entityListUpdate.detail = detail;

      document.dispatchEvent(iris.entityListUpdate);

    }

  };

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

          });

        }

      });

    }

    // Send event

    var detail = {
      entities: {}
    };

    detail.entities[entity.entityType] = [entity];

    iris.entityListUpdate.detail = detail;

    detail.event = 'delete';

    document.dispatchEvent(iris.entityListUpdate);

  };
});

iris.entityListUpdate = new Event('entityListUpdate');

iris.fetchEntities = function (variableName, query) {

  var baseurl;

  if (!iris.server) {

    iris.log("error", "You need to initialise Iris with a base url for entity fetching to work. Try setting iris.server to the location of the Iris server.");

    return false;

  }
  else {

    baseurl = iris.server;

  }

  // Remove trailing slash

  if (baseurl.indexOf("/") === baseurl.length - 1) {

    baseurl = baseurl.substring(0, baseurl.length - 1);

  }

  function formatParams(params) {

    return "?" + Object

        .keys(params)

        .map(function (key) {

          if (params[key]) {

            return key + "=" + params[key];

          }

        })

        .join("&");
  }

  var sendQuery = {};

  sendQuery.queries = query.queries ? JSON.stringify(query.queries) : undefined;

  sendQuery.entities = JSON.stringify(query.entities);

  sendQuery.limit = query.limit ? JSON.stringify(query.limit) : undefined;

  sendQuery.sort = query.sort ? JSON.stringify(query.sort) : undefined;

  sendQuery.skip = query.skip ? JSON.stringify(query.skip) : undefined;

  sendQuery.credentials = JSON.stringify(iris.credentials);

  var querystring = formatParams(sendQuery);

  var request = new XMLHttpRequest();

  request.open('GET', baseurl + "/fetch" + querystring, true);

  request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

  request.onload = function () {

    if (request.status >= 200 && request.status < 400) {

      try {

        var fetched = request.response;

        var grouped = {};

        var result = JSON.parse(fetched).response;

        if (variableName) {

          result ? null : result = [];

          window.iris ? null : window.iris = {};

          window.iris.fetchedEntities ? null : window.iris.fetchedEntities = {};

          window.iris.fetched ? null : window.iris.fetched = {};

          window.iris.fetched[variableName] = {
            query: query,
            entities: []
          };

          result.forEach(function (entity) {

            if (!grouped[entity.entityType]) {

              grouped[entity.entityType] = [JSON.parse(JSON.stringify(entity))];

            }

            else {

              grouped[entity.entityType].push(JSON.parse(JSON.stringify(entity)));

            }

            window.iris.fetchedEntities[entity.entityType] ? null : window.iris.fetchedEntities[entity.entityType] = {};

            // Check if entity already in list

            if (window.iris.fetchedEntities[entity.entityType][entity.eid]) {

              Object.keys(entity).forEach(function (property) {

                window.iris.fetchedEntities[entity.entityType][entity.eid][property] = entity[property];

              });

              window.iris.fetched[variableName].entities.push(window.iris.fetchedEntities[entity.entityType][entity.eid]);

            }
            else {

              window.iris.fetchedEntities[entity.entityType][entity.eid] = entity;

              window.iris.fetched[variableName].entities.push(entity);

            }

          });

        }

        iris.entityListUpdate.detail = {
          entities: grouped,
          event: 'fetch'
        };

        document.dispatchEvent(iris.entityListUpdate);

      }
      catch (e) {

        console.log(e);

      }

    }

  };

  request.send();

};

// Function for prefetching entity data, used by the entity module itself when using Iris entity templates

iris.entityPreFetch = function (result, variableName, query) {

  if (variableName) {

    result ? null : result = [];

    window.iris ? null : window.iris = {};

    window.iris.fetchedEntities ? null : window.iris.fetchedEntities = {};

    window.iris.fetched ? null : window.iris.fetched = {};

    window.iris.fetched[variableName] = {
      query: query,
      entities: []
    };

    result.forEach(function (entity) {

      window.iris.fetchedEntities[entity.entityType] ? null : window.iris.fetchedEntities[entity.entityType] = {};

      window.iris.fetchedEntities[entity.entityType][entity.eid] = entity;

      window.iris.fetched[variableName].entities.push(entity);

    });

  }

};
