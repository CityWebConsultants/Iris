var frisby = require('frisby');

var utils = require('./test_utils');

var generateString = utils.generateString;
var formatParams = utils.formatParams;

// @todo refactor to fit with other.
// @todo add exports for helper functions.
var adminUser = {
    login: {
        username: "foo",
        password: "foo"
    },
    auth: {
        token: "",
        userid: "1"
    }
};

var user = function() {

    return {

        login: {
            username: generateString(5),
            password: generateString(10)
        },
        auth: {
            token: "",
            userid: "",
            roles: ['authenticated']
        },
        setToken: function(token) {
            this.auth.token = token;
        },
        setUserID: function(id){
            this.auth.userid = id;
        },
        setRoles: function(roles) {
          this.auth.roles = roles;
        }
        /*setAdmin: function(){
          //readConfig
        }*/
    };
}

testUser = new user();

frisby.create('Request auth key')
  .post('http://www.iris.local:4000/api/login',
      adminUser.login,
      { 
        json: true
      }
  )
  .expectStatus(200)
  .expectHeaderContains('content-type', 'application/json')
  .expectJSONTypes({
      userid: String,
      token: String
  })
  .afterJSON(function (res) {
      adminUser.auth.token = res.token;

      frisby.create('Create a user')
          .post('http://www.iris.local:4000/entity/create/user',
            {
                credentials: adminUser.auth,
                username: testUser.login.username,
                password: testUser.login.password,
                roles:  testUser.auth.roles
            },
            { json: true })
          .expectStatus(200)
          .expectHeaderContains('content-type', 'application/json')
          .expectJSONTypes({
              eid: Number,
              roles: Array,
              username: String,
              password: String,
              entityType: String
          })
          .inspectJSON()
          .afterJSON(function (res) {
                testUser.setUserID(res.eid);
                testUser.setRoles(res.roles);

                frisby.create('Update user roles with admin')
                    .post('http://www.iris.local:4000/entity/edit/user/' + testUser.auth.userid,
                    {
                        credentials: adminUser.auth
                        /*roles: {['authenticated','admin']}*/
                    },
                    { json : true })
                    .expectStatus(200)
                    .inspectJSON()
                    .expectHeaderContains('content-type', 'application/json')
                    .after(
                      
                    )
                    .toss()        
                    
            })
            .toss()
  })
  .inspectJSON()
  .toss();



