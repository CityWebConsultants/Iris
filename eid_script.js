process.on("dbReady", function () {
  try {
    for (var collection in C.dbCollections) {

      // for each collection

      // get all documents

      C.dbCollections[collection].find({}, function (err, docs) {

        console.log(collection)

        if (!err) {

          for (var doc in docs) {

            if (docs[doc].eID || docs[doc].eID === 0) {

              console.log(docs[doc].eID)

              docs[doc].eID = undefined;

              docs[doc].save(function (err) {

                if (err) {
                  console.log(err)
                }

              });

            }

          }

          console.log("Adding eId...");

          var eid = 0;

          for (var doc in docs) {

            console.log(docs[doc].entityType)

            docs[doc].eId = eid;

            console.log(eid)

            eid++;

            if (!docs[doc].entityAuthor) {

              docs[doc].entityAuthor = "admin";

            }

            docs[doc].save(function (err) {
console.log("save callback")
              if (err) {
                console.log(err)
              }

            });

          }

        }

      });

    }

  } catch (e) {
    console.log(e);
  }

});
