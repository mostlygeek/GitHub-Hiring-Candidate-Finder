var Promise = require('./promise').Promise;

var max = 5; 
var running = 0; 
var queue = []; 

setInterval(function() {    
    
    if (running == max) {
        return; 
    }
    
    var thingToRun = queue.shift(); 
    
    if (typeof(thingToRun) == "function") {
        
        running++;
        console.log("running something: " + running);
        
        thingToRun.call(this).then(function(d) {
            running--; 
            console.log("completed: " + d);
        });         
    }
}, 50);


for (var i=0; i<10; i++) {
    
    (function(id) {
        console.log("Creating: " + id); 
        queue.push(function() {

           var prom = new Promise();

           setTimeout(function() {
               prom.resolve("done: " + id);
           }, 1000);

           return prom;    
        });
        
    })(i);
}

