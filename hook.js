/*jslint node: true, nomen:true*/

"use strict";

//The current event being run (has a name and a value)

var currentevent = {};

//The queue holds the events of the current type to be processed in the current queue

var queue = [];

//The eventsqueue is the future event types that will be run 

var eventsqueue = [];

//The function that runs the next event in the chain

var run = function (value) {
    if (queue[0]) {
        queue[0][currentevent.name].event(value);
    }
};

//The trigger function is exposed and called from external modules/files to trigger an event

var trigger = function (event, value) {

    //If the queue is empty start the new event

    if (queue.length === 0) {

        console.log("\nRunning event: " + event + "\nProcessing value: " + value);

        currentevent = {
            name: event,
            value: value
        };
        
        //Create a list of active node.js modules (modules are only required once so this will not reinstall them), it just allows them to be accessed here.

        var modules = [];

        Object.keys(require('module')._cache).forEach(function (element, index) {
   
            modules.push(require(element));
    
        });

        //Add modules to the array if they contain the triggered event

        modules.forEach(function (element, index) {

            if (element[event]) {

                queue.push(element);

            }

        });

        //Sort the modules in order of the rank of that event function within them

        queue.sort(function (a, b) {

            if (a[event].rank > b[event].rank) {
                return 1;
            }

            if (a[event].rank < b[event].rank) {
                return -1;
            }

            return 0;

        });

        //Run the next event in the chain

        run(value);

    } else {

        //Put the event in the event queue if there is already an event being processed 

        eventsqueue.push({
            name: event,
            value: value
        });

    }
};

//When that event has finished by emiting the "next" event to the node.js process, remove the event from the chain and run the next one

process.on("next", function (data) {

    queue.shift();
    if (queue.length > 0) {

        run(data);

    } else {

        //If the queue is finished (no more in the chain) run a complete event on the process object that anything can listen to. Include the data that was returned.

        console.log("Event '" + currentevent.name + "' has finished with an output of : " + data);
        process.emit("complete_" + currentevent.name, data, currentevent.name);

        if (eventsqueue.length > 0) {
            trigger(eventsqueue[0].name, eventsqueue[0].value);
            eventsqueue.shift();
        }
    }

});

//Exports the modules array so that modules can be added to it and the trigger function.

module.exports = trigger;