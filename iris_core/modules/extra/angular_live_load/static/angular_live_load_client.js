// Bootstrap angular app automatically. Put in new start and end symbols so as not to clash with handlebars

if (!window.iris) {

  window.iris = {};

}

iris.angular = angular.module("iris", []);

function irisReady(fn) {
  if (document.readyState != 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

irisReady(function () {

  // Hide angular-list

  var hidden = document.querySelectorAll(".hide-angular-list");

  for (var i = 0; i < hidden.length; i += 1) {

    hidden[i].style.display = "none";

  }

  // Show angular bits

  var shown = document.querySelectorAll(".show-angular-list");

  for (var i = 0; i < shown.length; i += 1) {

    shown[i].style.display = "block";

  }

  iris.angular.controller("iris-template", ["$scope", "$element", "$attrs", "$timeout", function ($scope, $element, $attrs, $timeout) {

    // Read ng-template property and see if template exists

    var template = $element[0].getAttribute("ng-iris-template");

    $scope.credentials = iris.credentials;

    if (iris.fetched && iris.fetched[template]) {

      $scope[template] = iris.fetched[template].entities;

    }

    // Listen for the event.
    document.addEventListener('entityListUpdate', function (e) {
            
      if (iris.fetched[template] && iris.fetched[template].entities) {

        $scope[template] = iris.fetched[template].entities;

      }

      $scope.$apply();

    }, false);


}]);

  //   HTML Filter for showing HTML

  iris.angular.filter('html_filter', ['$sce', function ($sce) {
    return function (text) {
      return $sce.trustAsHtml(text);
    };

}])
  angular.bootstrap(document, ['iris']);

})
