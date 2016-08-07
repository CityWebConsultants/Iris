var io = require('socket.io-client');
var frisby = require('frisby');
var utils = require('../test_utils');
var config = require('../test_config');
var generateString = utils.generateString;

var admin = config.adminUser.login;
var baseurl = config.baseURL;
var user1 = generateString(5);
var user2 = generateString(5);
var admin;

describe('Admin', function () {
    
  beforeEach(function() {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
  });
  
  it('admin should be able to create a user and listen to socket', function () {
    
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
        var socket = io(baseurl);
        socket.on("connect", function () {
            if (res.userid) {

                socket.emit('pair', {
                    credentials: admin
                });
            } else {
                    console.log("admin connected with Iris");
            }
        });
                
                // listen for tesuser3 being created
        socket.on("entityCreate", function (data) {
            
           expect(data.username).not.toEqual(null);
            
            socket.disconnect();
        });
        
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
            frisby.create('admin should be able create testuser2')
              .post(baseurl + '/entity/create/user',
                {
                  username: user2,
                  password: 'test1',
                  roles: ['authenticated'],
                  credentials: admin
                },
                { json: true })
              .expectStatus(200)
              .expectHeaderContains('content-type', 'application/json')
              .afterJSON(function (res) {
               
               
              })
              .toss();
           
          })
          .toss();

      }).toss();
    });
});