//Angular stuff, split off into another file

angular.element(document).ready(function () {
  angular.bootstrap(document, ['app']);
});

var app = angular.module("app", [], function ($interpolateProvider) {
  $interpolateProvider.startSymbol('##');
  $interpolateProvider.endSymbol('##');
});

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