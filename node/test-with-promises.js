
var Promise = require('./promise');
var https = require('https');
var GitHubApi = require("github").GitHubApi;
var github = new GitHubApi(true);
var cache = require('./CachePromise').Cache('./cache', function(msg) {
    console.log("DEBUG: " + msg);
});

/**
 * Repositories to fetch watchers for
 */
var repos = ['PushButtonLabs/PushButtonEngine',
             'mikechambers/as3corelib', 
             'AdamAtomic/flixel'
            ];

var users = {};
var watcherPromises = []; // array of promises to fetch the watchers 

repos.forEach(function(repo) {
    
    var url = '/repos/' + repo + '/watchers?per_page=100';
    var repoWatchers = [];
    var promiseForWatchers = new Promise.Promise(); 
    
    watcherPromises.push(promiseForWatchers);
    
    apiFetch(url).then(function mergeWatchers(response) {    
        // create a list of users 
        response.data.forEach(function(user) {
            repoWatchers.push(user.login);
        });

        /**
         * continue fetching more if there are additional pages
         */
        if (response.headers.link) {
            var matches = response.headers.link.match(/<(.*)>; rel="next"/);
            if (matches && matches.length == 2) { // fetch the next page if it exists
                var urlParts = require('url').parse(matches[1]),
                    url = urlParts.pathname + urlParts.search;                                                
                
                apiFetch(url).then(mergeWatchers);
            } else {
                // no more users to fetch, so resolve the main promise
                promiseForWatchers.resolve(repoWatchers);
            }
        }
    });
}); 

/**
 * When all the watchers for the repositories have loaded this 
 * promise callback will execute. 
 * 
 * This will create a unique list of users and fetch the necessary
 * information about them. :)
 */
Promise.all(watcherPromises).then(function(repoWatchers) {
   
   var users = {}; // obj so we can sort users uniquely   
   var userPromises = []; // all the promises to fetch full user data
   var totalUsers = 0;
   var usersFetched = 0; // total users fetched
   
   repoWatchers.forEach(function(logins) {
       
       logins.forEach(function(login) {
           
           if (!users.hasOwnProperty(login)) {  
               totalUsers++;
               users[login] = {
                   keyRepos : 0                   
                   /** add in other scoring fields we want to track */
               };                              
           }
           
           users[login].keyRepos++;
           
           console.log("fetching /users/" + login);
           var prom = apiFetch('/users/' + login); 
           userPromises.push(prom);
           
           prom.then(function(response) {
               usersFetched++;
               
               console.log("Fetched:" + response.data.login + " (" + 
                   usersFetched + "/" + totalUsers + ")");
               /**
                * this should assign data into the users array, and 
                * do some tabulations.. 
                */
           });
           
       });
   });
   
   Promise.all(userPromises).then(function(userProfiles) {
      console.log(userProfiles); 
   });    
});


/**
 * fetch a URI, returning a promise for when it is done... :)
 */
function apiFetch(uri) {
    return cache.get(uri, function(cacheKey, promise) {
        var that = this; 
        that.$debug('MISS "' + cacheKey + '"');
        
        https.get( {
            host : '207.97.227.243', 
            path : uri
        }, function(res) {           
           var bodyData = '';
           
           res.on('data', function(chunk) {
              bodyData += chunk; 
           }).on('end', function() {               
               var data = {
                   headers : res.headers, 
                   data    : JSON.parse(bodyData)      
               }
               
               cache.write(cacheKey, data); 
               promise.resolve(data);               
           });
        });        
    });
}