// Add a member to a group

iris.route.post("/groups/addMember/:groupid/:member", function (req, res) {

  var fetch = {
    entities: ["group"],
    queries: [{
      field: "eid",
      "operator": "is",
      "value": parseInt(req.params.groupid)
    }]
  }

  iris.hook("hook_entity_fetch", req.authPass, null,
    fetch
  ).then(function (groupResult) {

      if (groupResult.length) {

        if (groupResult[0].members.indexOf(parseInt(req.params.member)) !== -1) {

          res.status(400).send("Member already in group");

        } else {

          // Check if user exists on system

          var fetch = {
            entities: ["user"],
            queries: [{
              field: "eid",
              "operator": "is",
              "value": parseInt(req.params.member)
    }]
          }

          iris.hook("hook_entity_fetch", req.authPass, null, fetch).then(function (userResult) {

            if (userResult.length) {

              // All OK, try to add member to group

              groupResult[0].members.push(parseInt(req.params.member));

              // Update entity

              iris.hook("hook_entity_edit", req.authPass, groupResult[0], groupResult[0]).then(function (success) {

              }, function (fail) {

                res.status(400).send(fail);

              })

            } else {

              res.status(400).send("Not a valid member");

            }

          }, function (fail) {

            res.status(400).send(fail);

          })

        }


      } else {

        res.status(400).send("Not a valid group")

      }
    },
    function (fail) {

      res.status(400).send(fail);

    });


})

// Remove member from group

// Add a member to a group

iris.route.post("/groups/removeMember/:groupid/:member", function (req, res) {

  var fetch = {
    entities: ["group"],
    queries: [{
      field: "eid",
      "operator": "is",
      "value": req.params.groupid
    }]
  }

  iris.hook("hook_entity_fetch", req.authPass, null, fetch).then(function (groupResult) {

      if (groupResult.length) {

        if (groupResult[0].members.indexOf(parseInt(req.params.member)) === -1) {

          res.status(400).send("Member not in group");

        } else {


          // All OK, try to add member to group

          var memberIndex = groupResult[0].members.indexOf(parseInt(req.params.member));

          groupResult[0].members.splice(memberIndex, 1);

          // Update entity

          iris.hook("hook_entity_edit", req.authPass, groupResult[0], groupResult[0]).then(function (success) {

            res.send(success);

          }, function (fail) {

            res.status(400).send(fail);

          })

        }


      } else {

        res.status(400).send("Not a valid group")

      }
    },
    function (fail) {

      res.status(400).send(fail);

    });


})
