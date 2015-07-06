var async1 = function (input) {

  return new Promise(function (yes, no) {
    
    console.log("Waiting for first promise...");

    setTimeout(function () {

      yes(input.toUpperCase());

    }, 1000);

  });

};

var async2 = function (input) {
  
  console.log("Waiting for second promise...");

  return new Promise(function (yes, no) {

    setTimeout(function () {

     yes(input + "!");

    }, 500);

  });

};

var async3 = function(input){
  
  console.log("Done! Output is "+input);
  
};

async1("hello")
  .then(async2)
  .then(async3);