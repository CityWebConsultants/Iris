/*jslint node: true, nomen:true*/
"use strict";

//The queue holds the events of the current type to be processed in the current queue

var queue = {};

//The function that runs the next event in the chain

var run = function (eventid, hookname, value, callback) {

    value.pid = eventid;
    value.hookname = hookname;
    if (callback) {
        value.callback = callback;
    }
    
    queue[eventid].events[0][hookname].event(value);

};

//The trigger function is exposed and called from external modules/files to trigger an event

var trigger = function (event, value, callback) {

    var eventid = Math.floor(new Date()),
        modules = [];

    //Create a list of active node.js modules (modules are only required once so this will not reinstall them), it just allows them to be accessed here.

    Object.keys(require('module')._cache).forEach(function (element, index) {

        modules.push(require(element));

    });

    //Add modules to the array if they contain the triggered event

    modules.forEach(function (element, index) {

        if (element[event]) {

            if (!queue[eventid]) {

                queue[eventid] = {};
                queue[eventid].events = [];

            }

            queue[eventid].events.push(element);

        }

    });
    
    //If no hook return false
    
    if (!queue[eventid]) {
                
        process.nextTick(function () {
            
            process.emit("complete_" + event, false, event);
            
        });
        
        return false;
        
    }
    
    console.log("Running event: " + event);
    console.log(queue[eventid].events); // This line slows down events sufficiently to prevent crashes!

    //Sort the modules in order of the rank of that event function within them
    
    queue[eventid].events.sort(function (a, b) {

        if (a[event].rank > b[event].rank) {
            return 1;
        }

        if (a[event].rank < b[event].rank) {
            return -1;
        }

        return 0;

    });


    //Run the next event in the chain

    run(eventid, event, value, callback);

};

//When that event has finished by emiting the "next" event to the node.js process, remove the event from the chain and run the next one

process.on("next", function (data) {

    process.nextTick(function () {
        queue[data.pid].events.shift();
        if (queue[data.pid].events.length > 0) {

            run(data.pid, data.hookname, data);

        } else {

            //If the queue is finished (no more in the chain) run a complete event on the process object that anything can listen to. Include the data that was returned.

            delete queue[data.pid];

            //Run a callback if one is set
            
            if (data.callback) {

                data.callback(data);

            }
            
            console.log("completed event: " + data.hookname);
            process.emit("complete_" + data.hookname, data, data.hookname);

        }
    });
});

//Exports the modules array so that modules can be added to it and the trigger function.

module.exports = trigger;
