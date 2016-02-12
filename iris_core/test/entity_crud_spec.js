var frisby = require('frisby');

var user = {
  login: {
    username: "foo",
    password: "foo"
  },
  auth: {
    token: "",
    userid: "1"
  }
};

var pageQuery = {
      credentials: user.auth,
      entities: ["page"],
      queries: [{
        field: "eid",
        operator: "IS",
        value: ""
      }]
    };

var generateString = function (stringLength) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    for( var i=0; i < stringLength; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}

var formatParams = function (params) {
    return "?" + Object
      .keys(params)
      .map(function (key) {
        return key + "=" + params[key]
      })
      .join("&")
}

var prepareQuery = function() {
  return formatParams({
      credentials: JSON.stringify(user.auth),
      queries: JSON.stringify(pageQuery.queries),
      entities: JSON.stringify(pageQuery.entities)
  });
}

var pageContent = {
  title: generateString(10),
  body: generateString(100),
  path: 'test/' + generateString(5)
}

frisby.create('Request auth key')
  .post('http://www.iris.local:4000/api/login',
    user.login,
  { json: true })
  .expectStatus(200)
  .expectHeaderContains('content-type', 'application/json')
  .expectJSONTypes({
    userid: String,
    token: String
  })
  .afterJSON(function (res) {
    user.auth.token = res.token;

  })
  .inspectJSON()
  .toss();

frisby.create('Create a page')
  .post('http://www.iris.local:4000/entity/create/page',
    {
      credentials: user.auth,
      title: pageContent.title,
      body: pageContent.body,
      path: pageContent.path
    },
    { json: true })
    .expectStatus(200)
    .expectHeaderContains('content-type', 'application/json')
    .inspectJSON()
    .afterJSON(function (res) {

      pageQuery.queries[0].value = pageContent.eid = res.eid;

      frisby.create('Fetch a page')
        .get('http://www.iris.local:4000/fetch' + prepareQuery())
        .inspectJSON()
        .expectStatus(200)
        .expectHeaderContains('content-type', 'application/json')
        .afterJSON(function (res) {

          frisby.create('Edit a page')
            .post('http://www.iris.local:4000/entity/edit/page/' + pageContent.eid,
              {
                credentials: user.auth,
                body: pageContent.body + 'edited'
              },
              { json: true })
            .inspectJSON()
            .expectStatus(200)
            .expectHeaderContains('content-type', 'application/json')
            .afterJSON(function (res) {

              frisby.create('Delete a page')
                .post('http://www.iris.local:4000/entity/delete/page/' + pageContent.eid,
                {
                  credentials: user.auth,
                },
                { json: true })
                .expectStatus(200)
                .expectHeaderContains('content-type', 'application/json')
                .inspectJSON()
                .toss();
            })
          .toss()
        })
       .toss()
    })
   .toss();
