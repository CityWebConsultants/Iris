app.directive("messageReply", function ($compile) {
  return {
    restrict: "E",
    scope: {
      message: '=',
      sendReply: '=',
      reply: '=',
      userid: '='
    },
    templateUrl: "/static/messageReply.html",
    compile: function (tElement, tAttr) {
      var contents = tElement.contents().remove();
      var compiledContents;
      return function (scope, iElement, iAttr) {
        if (!compiledContents) {
          compiledContents = $compile(contents);
        }
        compiledContents(scope, function (clone, scope) {
          iElement.append(clone);
        });
      };
    }
  };
});

var auth = function ($scope, $http, $timeout, $rootScope) {

  $rootScope.loggedin = false;

  $http.get("/checkauth").then(function (data) {

    if (data.data.response !== "anonymous") {

      $rootScope.loggedin = data.data.response;

    };

  });

  $scope.login = function () {

    data = {};
    data.username = $scope.username;
    data.password = $scope.password;

    $http.post("/login", data).then(function (result) {

      if (result.data.status === 200) {

        $rootScope.loggedin = result.data.response;

      };

    }, function (error) {

      console.log(error);

    });

  }

  $scope.logout = function () {

    $http.post("/logout");
    $rootScope.loggedin = false;

  };


};

var groups = function ($scope, $http, $timeout, $rootScope) {

  var startScroll = true;

  $scope.$on('ngRepeatFinished', function (ngRepeatFinishedEvent) {

    if (startScroll) {

      var objDiv = document.querySelector(".chat-thread");

      objDiv.scrollTop = objDiv.scrollHeight

      startScroll = false;

    }

  });

  // Edit link to focus message

  $(document).on("click", ".message-tools__edit", function (e) {

    var idToEdit = $(this).parent().attr('data-id');

    $(".message-content[data-id='" + idToEdit + "']").get(0).focus();

  });

  // Save message on focus

  var restoreMessage = true;
  var existingMessage = '';

  $(document).on("focus", ".message-content", function (e) {

    restoreMessage = true;

    // Save the existing message
    existingMessage = $(this).html();

  });

  $(document).on("blur", ".message-content", function (e) {

    // Restore the existing message

    if (restoreMessage) {
      $(this).html(existingMessage);
    }

  });

  // Enter to edit message

  $(document).on("keydown", ".message-content", function (e) {

    if (e.keyCode == 13) {

      e.preventDefault();

      var id = $(e.target).attr("data-id");

      var content = $(e.target).text();

      message = {
        "userid": $rootScope.loggedin,
        "groupid": $scope.activegroup,
        "content": content,
        "type": "text"
      }

      //Send message

      message = JSON.stringify(message);

      $http.post("/entity/edit/message/" + id, message, function (data, err) {

        console.log(data);
        console.log(err);

      });

      restoreMessage = false;

    }

  });

  $(document).on("click", ".message-tools__delete", function (e) {

    var idToDelete = $(this).parent().attr('data-id');

    var confirmation = confirm("Are you sure you want to delete this message?");

    if (confirmation) {

      $http.post("/entity/delete/message/" + idToDelete, {}, function (data, err) {

        console.log(data);
        console.log(err);

      });

    }

  });

  var checkSize = function () {

    if (window.innerWidth < 688) {

      $scope.mobile = true;

      $timeout(function () {

        $scope.$apply();

      });

    } else {

      $scope.mobile = false;

      $timeout(function () {

        $scope.$apply();

      });

    }

  };

  checkSize();

  window.onresize = function () {

    checkSize();

  };

  // Enable scroll-to-bottom on new messages by having the scrollbar at the bottom

  T.chatScroll = false;

  $('.chat-thread').on('scroll', function (e) {

    var thread = document.querySelector('.chat-thread');

    if (thread.scrollHeight - thread.offsetHeight === thread.scrollTop) {

      T.chatScroll = true;

    } else {

      T.chatScroll = false;

    }

  });

  T.receiver.on("entityCreate", function (data) {

    var objDiv = document.querySelector(".chat-thread");

    if (data && (data.userid === $rootScope.loggedin || T.chatScroll)) {

      if (data.groupid === $scope.activegroup) {

        objDiv.scrollTop = objDiv.scrollHeight

      }

    }

  });

  $scope.section = "recent";

  $scope.check121 = function (userid) {

    $scope.section = "recent";

    $http({
      url: "/fetch",
      method: "GET",
      params: {
        "entities[]": ['group'],
        "queries[]": [{
          field: "members",
          comparison: "IN",
          compare: {
            userid: userid
          }
        }, {
          field: "members",
          comparison: "IN",
          compare: {
            userid: $scope.loggedin
          },

        }, {
          field: "is121",
          comparison: "IS",
          compare: true
        }]
      },
      paramSerializer: '$httpParamSerializerJQLike'
    }).then(function (response) {

      //Check if group actually exists

      if (response.data.response[0]) {

        $scope.$$childTail.activegroup = response.data.response[0]._id;

      } else {

        group = {
          "name": "default",
          "is121": true,
          "members": [{
            userid: $scope.loggedin
          }, {
            userid: userid
          }]
        }

        //Send message

        group = JSON.stringify(group);

        $http.post("/entity/create/group", group).then(function (response, err) {

          $scope.$$childTail.activegroup = response.data._id;

        });

      }

    }, function (error) {

      console.log(error);

    });

  };

  $scope.newMessage = function (group, content) {

    message = {
      "userid": $scope.loggedin,
      "groupid": group,
      "content": content,
      "type": "text"
    }

    //Send message

    message = JSON.stringify(message);

    $http.post("/entity/create/message", message, function (data, err) {

      console.log(data);
      console.log(err);

    });

    //Clear message

    $scope.newpost = "";

  };

};

var messages = function ($scope, $http) {

  $scope.newpost = "";

  $scope.newMessage = function () {

    message = {
      "userid": "1",
      "groupid": '55e05ee3430b5d3f0debf048',
      "content": $scope.newpost,
      "type": "text"
    }

    //Send message

    message = JSON.stringify(message);

    $http.post("/entity/create/message", message, function (data, err) {

      console.log(data);
      console.log(err);

    });

    //Clear message

    $scope.newpost = "";

  };

  $scope.reply = {};

  $scope.sendReply = function (messageid, groupid) {

    var content = $scope.reply.content[messageid];
    var replyTo = messageid;

    message = {
      "userid": "1",
      "groupid": groupid,
      "content": content,
      "replyTo": replyTo,
      "type": "text"
    }

    message = JSON.stringify(message);

    $http.post("/entity/create/message", message, function (data, err) {

      console.log(data);
      console.log(err);

    });

  };

};

//User search

$(document).on('keyup', '#search_users', function () {

  var search = $("#search_users").val();

  if (search.length > 1) {

    $("#userlist").attr("data-queries", "name|CONTAINS|" + JSON.stringify(search));

  }

});

app.controller("messages", ["$scope", "$http", messages])
app.controller("groups", ["$scope", "$http", "$timeout", "$rootScope", groups])
app.controller("auth", ["$scope", "$http", "$timeout", "$rootScope", auth])

app.directive('onFinishRender', function ($timeout) {
  return {
    restrict: 'A',
    link: function (scope, element, attr) {
      if (scope.$last === true) {
        $timeout(function () {
          scope.$emit('ngRepeatFinished');
        });
      }
    }
  }
});
