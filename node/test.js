var sys = require("sys");
var GitHubApi = require("github").GitHubApi;
var cache = require('./Cache.js').CreateCache("./cache", console.log);

/*
cache.get('some-key-blah', function(key, hit, data) {
    if (hit) {
        
        console.log('HIT! Got back: "' + data + '"');
        
    } else {        
        console.log('MISS, writing data');
        this.write(key, key);
    }
});
*/
var github = new GitHubApi(true);

cache.get('watchers', function(cacheKey, hit, data) {   
    if (hit) {
        console.log("HIT!", data);
    } else {
        console.log("MISS!");        
        github.getRepoApi().getRepoWatchers("PushButtonLabs", "PushButtonEngine", function(err, watchers) {
            cache.write(cacheKey, watchers);
            console.log(watchers);
        });    
   }   
});


