var io = require('socket.io-client');
var frisby = require('frisby');
var config = require('./test_config');
var utils = require('./test_utils');

var admin = config.adminUser.login;
var baseurl = config.baseURL;

var generateString = utils.generateString;

var authenticated_user1, authenticated_user2, authenticated_user3;

var user1 = generateString(8);
var user2 = generateString(8);
var user3 = generateString(8);

console.log(user1);

frisby.create('Set first time user')
  .post(baseurl + '/api/user/first',
   admin,
   { json: true })
  .after(function (res) {
    frisby.create('Request auth key')
      .post(baseurl + '/api/login',
        admin,
        { json: true })
      .expectStatus(200)
      .expectHeaderContains('content-type', 'application/json')
      .expectJSONTypes({
        userid: String,
        token: String
      })
      .afterJSON(function (res) {
        admin = res;
        console.log(admin, 'admin');
        frisby.create('admin should be able create testuser1')
          .post(baseurl + '/entity/create/user',
            {
              username: user1,
              password: 'test1',
              roles: ['authenticated'],
              credentials: admin
            },
            { json: true })
          .expectStatus(200)
          .expectHeaderContains('content-type', 'application/json')
          .afterJSON(function (res) {
            authenticated_user1 = res;
            
            frisby.create('testuser1 should be able to request auth key')
              .post(baseurl + '/api/login',
                { "username": user1, "password": "test1" },
                { json: true })
              .expectStatus(200)
              .expectHeaderContains('content-type', 'application/json')
              .expectJSONTypes({
                userid: String,
                token: String
              })
              .afterJSON(function (res) {
                
                var socket = io(baseurl);
                socket.on("connect", function () {
                  if (res.userid) {

                    socket.emit('pair', {
                      credentials: res
                    });
                  } else {
                    console.log("Anonymous connected with Iris")
                  }
                });
                
                // listen for tesuser3 being created
                socket.on("entityCreate", function (data) {
                  expect(data.username).toEqual(user3);
                  socket.disconnect();
                });
              })
              .toss();
          })
          .toss();

        frisby.create('admin should be able create testuser1')
          .post(baseurl + '/entity/create/user',
            {
              username: user2,
              password: 'test2',
              roles: ['authenticated'],
              credentials: res
            },
            { json: true })
          .expectStatus(200)
          .expectHeaderContains('content-type', 'application/json')
          .afterJSON(function (res) {
            authenticated_user2 = res;
            
            frisby.create('testuser2 should be able to request auth key')
              .post(baseurl + '/api/login',
                { "username": user2, "password": "test2" },
                { json: true })
              .expectStatus(200)
              .expectHeaderContains('content-type', 'application/json')
              .expectJSONTypes({
                userid: String,
                token: String
              })
              .afterJSON(function (res) {
                var socket = io(baseurl);
                socket.on("connect", function () {
                  if (res.userid) {
                    socket.emit('pair', {
                      credentials: res
                    });

                  } else {
                    console.log("Anonymous connected with Iris")
                  }

                });
                
                // listen for tesuser3 being created
                socket.on("entityCreate", function (data) {
                  expect(data.username).toEqual(user3);
                  socket.disconnect();
                });
                
                //connect as anonymous and listen to entityCreate of testuser3
                var anon_socket = io(baseurl);
                anon_socket.on("entityCreate", function (data) {
                  expect(data.username).toEqual(user3);
                  anon_socket.disconnect();
                });

                frisby.create('create testuser and emit entityCreate')
                  .post(baseurl + '/entity/create/user',
                    {
                      username: user3,
                      password: 'test3',
                      roles: ['authenticated'],
                      credentials: admin
                    },

                    { json: true })
                  .expectStatus(200)
                  .expectHeaderContains('content-type', 'application/json')
                  .afterJSON(function (res) {
                    authenticated_user3 = res;

                    frisby.create('Delete test user 1')
                      .post(baseurl + '/entity/delete/user/' + authenticated_user1.eid,
                        {
                          credentials: admin,
                        },
                        { json: true })
                      .expectStatus(200)
                      .toss();
                      
                    frisby.create('Delete test user 2')
                      .post(baseurl + '/entity/delete/user/' + authenticated_user2.eid,
                        {
                          credentials: admin,
                        },
                        { json: true })
                      .expectStatus(200)
                      .toss();
                      
                    frisby.create('Delete test user 2')
                      .post(baseurl + '/entity/delete/user/' + authenticated_user3.eid,
                        {
                          credentials: admin,
                        },
                        { json: true })
                      .expectStatus(200)
                      .toss();
                  })
                  .toss();

              })
              .toss();
          })
          .toss();
      })
      .toss();
    })
  .toss();
//   });

// });