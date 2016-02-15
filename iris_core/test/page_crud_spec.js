var frisby = require('frisby');
var config = require('./test_config');
var utils = require('./test_utils');

var generateString = utils.generateString;
var formatParams = utils.formatParams;

var baseURL = config.baseURL;
var user = config.adminUser;

var pageQuery = {
      credentials: user.auth,
      entities: ["page"],
      queries: [{
        field: "eid",
        operator: "IS",
        value: ""
      }]
    };

var prepareQuery = function() {
  return formatParams({
      credentials: JSON.stringify(user.auth),
      queries: JSON.stringify(pageQuery.queries),
      entities: JSON.stringify(pageQuery.entities)
  });
};

var pageContent = {
  title: generateString(10),
  body: generateString(100),
  path: 'test/' + generateString(5)
};

frisby.create('Request auth key')
  .post(baseURL + '/api/login',
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
  .post(baseURL + '/entity/create/page',
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
        .get(baseURL + '/fetch' + prepareQuery())
        .inspectJSON()
        .expectStatus(200)
        .expectHeaderContains('content-type', 'application/json')
        .afterJSON(function (res) {

          frisby.create('Edit a page')
            .post(baseURL + '/entity/edit/page/' + pageContent.eid,
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
                .post(baseURL + '/entity/delete/page/' + pageContent.eid,
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
