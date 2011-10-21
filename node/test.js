var sys = require("sys");
var GitHubApi = require("github").GitHubApi;
/*
var github = new GitHubApi(true);
github.getRepoApi().getRepoWatchers("PushButtonLabs", "PushButtonEngine", function(err, watchers) {
   if (!err) {
       watchers.forEach(function(userName) {
           github.getUserApi().show(userName, function(e, user) {
              console.log(e, user); 
           });
       });
   } else {
       console.log(err);
   }   
})
*/;


var github = new GitHubApi(console.log); // log debug to console


var cache = Cache('/path/to/cacheDir', console.log);
cache.get('repos/popengine/blah/watchers', function(key, callback) {
    github.getRepoApi().getRepoWatchers("PushButtonLabs", "PushButtonEngine",  function(err, watchers) {            
        if (!err) {
            cache.write(key, watchers); 
            callback(err, watchers);
        }        
    });
}, function(err, watchers) {
    // handle the data here
});


function Cache(cacheDir, debug)
{
    return {
        _dir    : cacheDir, 
        $debug  : debug,
        
        get     : function(key, fillFn, dataFn) 
        {
            
        },
        
        write   : function(key, data)
        {
            
        },
        
        createFilename : function (key) 
        {
            
        }
    }
}

