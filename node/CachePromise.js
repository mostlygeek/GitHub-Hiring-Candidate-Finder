var fs = require('fs'),
    fsPromise = require('./fs-promise');

exports.Cache = function(cacheDir, debug)
{
    var stats = fs.lstatSync(cacheDir); 
    if (!stats.isDirectory()) {
        throw cacheDir + " is not a directory";
    }
    
    debug = debug || function() {}; // empty function
    
    // return a brand new object..     
    return {
        _dir : cacheDir, 
        $debug : debug,
        
        get : function(key, fillFn) {
            var file = this.cacheName(key), 
                context = this;
                
            var Promise = require("./promise").Promise;
            var promise = new Promise();
            
            fs.readFile(file, function(err, data) {
                if (err) {
                    /**
                     * Have the handler function resolve the 
                     * promise when it finishes what it needs to 
                     * do.
                     */
                    fillFn.call(context, key, promise);
                } else {
                    /**
                     * Resolve promise immediately with the 
                     * data from the cache. 
                     */
                    promise.resolve(JSON.parse(data));
                }
            });  
            
            return promise;
        },
        
        write: function(key, data)
        {
            var file = this.cacheName(key), 
                context = this;
                
            fs.writeFile(file, JSON.stringify(data), function(err) {
                if (err) {
                    context.$debug("Cache write error: " + err);
                }
            });            
        },
        
        
        cacheName : function(key) 
        {
            var shasum = require('crypto').createHash('sha1');
            shasum.update(key);
            return this._dir + '/' + shasum.digest('hex');
        }        
    };
}   