var T = {};

(function () {
  function CustomEvent ( event, params ) {
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    var evt = document.createEvent( 'CustomEvent' );
    evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
    return evt;
   }

  CustomEvent.prototype = window.Event.prototype;

  window.CustomEvent = CustomEvent;
})();

T.newData = new CustomEvent('newdata');

T.observer = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {

    if (mutation.attributeName === "data-queries") {

      //      console.log(mutation.target.getAttribute("data-queries"))

      T.initTemplate(mutation.target);

    }

  });

});

T.findRoot = function () {

  //Get location of node.js server

  var root = "";

  //get location of node.js server

  var scripts = document.getElementsByTagName('script');

  var i;

  for (i = 0; i < scripts.length; i += 1) {

    var script = scripts[i];

    if (script.src.indexOf("entity_views/templates.js") !== -1) {

      var root = script.src.replace("entity_views/templates.js", "");

    };

  };

  return root;

};

T.data = {};
T.templates = {};

T.initTemplate = function (element) {

  if (!element.getAttribute("data-entities")) {

    console.error("Query must have an element");
    return false;

  };

  //Check if a template already has this element inside it, if it does remove it

  if (T.getTemplate(element)) {

    var template = T.getTemplate(element);

    var index = template.elements.indexOf(element);

    if (index > -1) {
      template.elements.splice(index, 1);
    }

    //Delete template if no more elements stored inside

    if (!template.elements.length) {

      //      delete T.templates[template.querystring];

    }

  };

  T.observer.observe(element, {
    attributes: true
  });

  var queries = [];

  // Check if element has any queries

  if (element.getAttribute("data-queries")) {

    // Process list of queries into array

    element.getAttribute("data-queries").split(",").forEach(function (query) {

      // Split query into sub sections

      var query = query.split("|");

      // Skip empty queries

      if (!query[2]) {

        return false;

      }

      try {

        JSON.parse(query[2]);

      } catch (e) {

        console.log(query[2]);
        console.log(e);
        return false;

      };

      queries.push({

        field: query[0],
        comparison: query[1],
        compare: JSON.parse(query[2])

      });

    });

  }

  var query = {

    entities: element.getAttribute("data-entities").split(","),
    queries: queries,

  }

  //Check if limit is supplied

  if (element.getAttribute("data-limit")) {

    query.limit = parseInt(element.getAttribute("data-limit"), 10);

  };

  if (element.getAttribute("data-sort")) {

    query.sort = JSON.parse(element.getAttribute("data-sort"));

  };

  if (element.getAttribute("data-skip")) {

    query.skip = parseInt(element.getAttribute("data-skip"), 10);

  };

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

  //Check if template exists

  if (T.templates[querystring]) {

    T.templates[querystring].elements.push(element)

    T.runTemplateQuery(T.templates[querystring], false);

  } else {

    //Add template keyed by query string

    T.templates[querystring] = {

      elements: [element],
      query: query,
      data: {},
      getDataArray: function () {

        output = [];

        for (entity in T.templates[querystring].data) {

          entity = T.templates[querystring].data[entity];

          output.push(entity);

        }

        return output;

      },
      querystring: querystring,
      checkQuery: function (entity) {

        var outcome = true;

        // Check if type is present inside the entity

        if (T.templates[querystring].query.entities.indexOf(entity.entityType) === -1) {

          return false;

        };

        // Check if template contains any queries

        if (T.templates[querystring].query.queries) {

          var queries = T.templates[querystring].query.queries;

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

                if (entity[query.field].toLowerCase().indexOf(query.compare.toLowerCase()) === -1) {

                  outcome = false;

                }
                break;
            }

          });

          return outcome;

        }

      }

    }

    element.setAttribute("data-querystring", querystring);

    T.runTemplateQuery(T.templates[querystring], true);

  }

};

T.runTemplateQuery = function (template, isNew) {

  var request = new XMLHttpRequest();

  request.open('GET', T.findRoot() + "fetch" + template.querystring, true);

  request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

  request.onload = function () {

    if (request.status >= 200 && request.status < 400) {

      var data = JSON.parse(request.responseText);


      data.response.forEach(function (entity) {

        // Add entity to shared entity database

        T.data[entity._id] = entity;

        template.data[entity._id] = entity;

      });

      //Run DOM event on all elements in template

      template.elements.forEach(function (domElement) {

        domElement.dispatchEvent(T.newData);

      });

    } else {

      console.error(request.status);

    }

  };

  request.send();

};

T.getTemplate = function (domElement) {

  for (template in T.templates) {

    if (T.templates[template].elements.indexOf(domElement) !== -1) {

      return T.templates[template];

    };

  };

};

$(document).ready(function () {

  $.each($("*[data-entities]"), function (index, element) {

    T.initTemplate(element);

  });

});

//Set up socket.io listener

T.receiver = io(T.findRoot());

T.upsertEntity = function (data) {

  var relevant = false;

  // Update in global data if entity already in global data

  if (T.data[data._id]) {

    for (property in data) {

      T.data[data._id][property] = data[property];

    };

  }

  for (template in T.templates) {

    template = T.templates[template];

    if (template.checkQuery(data)) {

      relevant = true;

      // If the template query does match the entity and the entity is not in the template, add it. Also add to global data.

      if (!template.data[data._id]) {

        var entity = data;

        T.data[data._id] = entity;
        template.data[data._id] = T.data[data._id];

      }

    } else if (template.data[data._id]) {

      // If the entity doesn't match the template query and is present in the template's list of entities, remove it

      delete template.data[data._id];

    }

  };

  // Clean up unused entities from global data

  if (!relevant && T.data[data._id]) {

    delete T.data[data._id];

  }

  $.each($("*[data-entities]"), function (index, element) {

    element.dispatchEvent(T.newData);

  });

};

T.receiver.on('entityCreate', function (data) {

  if (data) {

    T.upsertEntity(data);

  }

});

T.receiver.on('entityUpdate', function (data) {

  if (data) {

    T.upsertEntity(data);

  }

});

T.receiver.on('entityDelete', function (data) {

  delete T.data[data._id];

  for (template in T.templates) {

    var template = T.templates[template];

    //Check if template data contains the right kind of entity

      if (template.data[data._id]) {

        delete template.data[data._id];

      };

  };

  $.each($("*[data-entities]"), function (index, element) {

    element.dispatchEvent(T.newData);

  });

});

//Angular stuff, split off into another file

angular.element(document).ready(function () {
  angular.bootstrap(document, ['app']);
});

var app = angular.module("app", []);

app.controller("C", ["$scope", "$element", "$attrs", "$timeout", function ($scope, $element, $attrs, $timeout) {

  $attrs.$observe("queries", function (val) {

    T.initTemplate($element[0]);

  })

  $element[0].addEventListener('newdata', function () {

    $scope.fetched = T.getTemplate($element[0]).getDataArray();
    $scope.data = T.getTemplate($element[0]).getDataArray();

    $scope.$apply();

  }, false);

      }]);


app.filter('html_filter', ['$sce', function ($sce) {
  return function (text) {
    return $sce.trustAsHtml(text);
  };
}]);
