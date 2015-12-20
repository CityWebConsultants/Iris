// Create global iris object if it doesn't yet exist

if (!window.iris) {

  window.iris = {};

}

// Make socket connection and listen for events

if (window.io) {
  iris.socketreceiver = io(document.location.protocol + "//" + document.location.hostname + ":" + document.location.port);

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

            // Loop over entities in loader and check it's not already there as this can happen with more than one similar loader on the page

            var present;

            loader.entities.forEach(function (currentEntity) {

              if (currentEntity === iris.fetchedEntities[entity.entityType][entity.eid]) {

                present = true;

              }

            })

            if (!present) {
              loader.entities.push(iris.fetchedEntities[entity.entityType][entity.eid]);
            }

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

            if (loader.entities.length > parseInt(loader.query.limit)) {

              loader.entities.length = parseInt(loader.query.limit);

            }

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
