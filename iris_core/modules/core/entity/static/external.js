iris.fetchEntities = function (baseurl, variableName, query) {

  // Remove trailing slash

  if (baseurl.indexOf("/") === baseurl.length - 1) {

    baseurl = baseurl.substring(0, baseurl.length - 1);

  }

  function formatParams(params) {
    return "?" + Object
      .keys(params)
      .map(function (key) {
        return key + "=" + params[key]
      })
      .join("&")
  }

  var sendQuery = {
    queryList: JSON.stringify([{

      queries: query.queries,
      entities: query.entities,
      limit: query.limit,
      sort: query.sort,
      skip: query.skip

      }])
  };

  var querystring = formatParams(sendQuery);

  var request = new XMLHttpRequest();

  request.open('GET', baseurl + "/fetch" + querystring, true);

  request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

  request.onload = function () {

    if (request.status >= 200 && request.status < 400) {

      try {

        var fetched = request.response;

        result = JSON.parse(fetched).response;

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



          })

        }

        document.dispatchEvent(iris.entityListUpdate);

      } catch (e) {

        console.log(e);

      }

    }

  }

  if (window.io) {

    iris.socketreceiver = io(baseurl);

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

  request.send();

}
