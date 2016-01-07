document.addEventListener("DOMContentLoaded", function (event) {

  if (typeof Notification !== 'undefined') {

    Notification.requestPermission();

  } else {

    $('.notifications-area').prepend("<ul><li><b>Note:</b> Your browser doesn't appear to support the Web Notifications API. As a result, you won't be able to see part of this demo.</li></ul>");

  }

  T.receiver.on("entityCreate", function (data) {

    if (data && data.entityType === "notification") {

      var options = {};

      switch (data.type) {

        case "Info":
          options.icon = "/static/info.png";
          break;

        case "Warning":
          options.icon = "/static/warning.png";
          break;

        case "Error":
          options.icon = "/static/error.png";
          break;

      }

      if (typeof Notification !== 'undefined') {

        var n = new Notification(data.notification_body, options);

      }

    }

  });

});

// Notifications angular

var notifications = function ($scope, $http) {

  $scope.newNotificationType = "Info";

  $scope.newNotification = function () {

    var notification = {
      type: $scope.newNotificationType,
      notification_body: $scope.newNotificationBody
    }

    //Send message

    notification = JSON.stringify(notification);

    $http.post("/entity/create/notification", notification, function (data, err) {

      console.log(data);
      console.log(err);

    });

    //Clear message

    $scope.newNotificationType = "Info";
    $scope.newNotificationBody = "";

  };

};

app.controller("notifications", ["$scope", "$http", notifications]);
