// Bootstrap angular app automatically. Put in new start and end symbols so as not to clash with handlebars

function irisReady(fn) {
  if (document.readyState != 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

irisReady(function () {

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
}])

})
