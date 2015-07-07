// Example module
var exports = {

  dependencies: ['mongodb', 'auth'],

  globals: {
    fetchGroup: function() {

    }
  },

  hook_fetch_group: {
    rank: 0,
    event: function (data) {

    };
  }

}
