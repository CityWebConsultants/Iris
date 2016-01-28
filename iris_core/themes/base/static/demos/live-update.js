var liveUpdate = function ($scope, $http) {

  var ckeditorLoaded = false;

  // Update in parent data
  $scope.$watch('$parent.data', function (newData, oldData) {

    if (newData) {
      $scope.newPostTitle = newData[0].title;
      $scope.newPostBody = newData[0].body;
    }

    if (newData && newData[0].body && !ckeditorLoaded) {
      CKEDITOR.replace("example-editor");
      ckeditorLoaded = true;
    }

  });

  $scope.updatePost = function () {

    var update = {
      body: CKEDITOR.instances['example-editor'].getData(),
      title: $scope.newPostTitle
    }

    //Send message

    update = JSON.stringify(update);

    $http.post("/entity/edit/example/" + $scope.$parent.data[0]._id, update, function (data, err) {

      console.log(data);
      console.log(err);

    });

  };

};

app.controller("live-update", ["$scope", "$http", liveUpdate]);
