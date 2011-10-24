
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
var repos = [  'PushButtonLabs/PushButtonEngine'
             , 'mikechambers/as3corelib' 
             , 'robertpenner/as3-signals'
             , 'AdamAtomic/flixel'
             , 'robotlegs/robotlegs-framework'
             , 'flexunit/flexunit'             
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
                   targetRepos : 0                   
                   /** add in other scoring fields we want to track */
               };
               
               var prom = apiFetch('/users/' + login); 
               userPromises.push(prom);

               prom.then(function(response) {
                   usersFetched++;

                   //console.log(Math.round(usersFetched/totalUsers * 100) + "% done");
                   
                   var u = users[login], r = response.data; // too lazy to type .. 

                   var keys = ['login', 'email', 'name', 'hireable', 
                               'public_gists', 'public_repos', 'followers', 
                               'created_at', 'location', 'bio', 'company',
                               'html_url'];
                
                   keys.forEach(function(key) {                    
                        if (r.hasOwnProperty(key)) {
                            u[key] = r[key];
                        }                    
                   });
                   
                   /**
                    * this should assign data into the users array, and 
                    * do some tabulations.. 
                    */
               });               
           }
           
           users[login].targetRepos++;           
       });
   });
   
   
   
    Promise.all(userPromises).then(function(userProfiles) {
        var sortedUsers = [];       

        for (var login in users) {          
            // determine a score for the user 
            (function(user) {
                sortedUsers.push(user); 

                var score = 0;

                // lets do some math
                if (user.public_gists) {
                    score += (user.public_gists * 10);
                }

                if (user.public_repos) {
                    score += (user.public_repos * 25);
                }

                if (user.followers) {
                    score += (user.followers * 100);
                }

                user.score = score;
            })(users[login]);
        }

        sortedUsers.sort(function(a, b) {
            return (b.targetRepos - a.targetRepos);   
        });
        
        sortedUsers.slice(0, 30).forEach(function(u) {
            var row = [u.targetRepos, 
                       u.login, 
                       u.score, 
                       u.html_url, u.hireable,
                       u.followers, 
                       u.created_at];
            
            console.log(u.targetRepos, u.score, u.html_url); 
        });
      
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
            host : 'api.github.com', 
            path : uri
        }, function(res) {           
           var bodyData = '';
           
           res.on('data', function(chunk) {
              bodyData += chunk; 
           }).on('end', function() {
               
               var decoded; 
               
               try {
                   decoded = JSON.parse(bodyData);
               } catch (e) {
                   console.log(bodyData);
                   console.log(e);
               }
               
               var response = {
                   headers : res.headers, 
                   data    : decoded
               };
               
               console.log("Fetched: " + uri);
               
               cache.write(cacheKey, response); 
               promise.resolve(response);               
           });
        });        
    });
}