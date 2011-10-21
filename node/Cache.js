var crypto = require('crypto'), 
    fs = require('fs');
/**
 * A dead simple caching container 
 */
exports.CreateCache = function(cacheDir, debug)
{
    var stats = fs.lstatSync(cacheDir); 
    if (!stats.isDirectory()) {
        throw cacheDir + " is not a directory";
    }
    
    debug = debug || function() {}; // empty function
    
    return {
        _dir    : cacheDir, 
        $debug  : debug,
        
        get : function(key, cacheHandler) 
        {
            var file = this.cacheName(key), 
                context = this;
            fs.readFile(file, function(err, data) {
                if (err) {
                    cacheHandler.call(context, key, false);
                } else {
                    cacheHandler.call(context, key, true, JSON.parse(data));
                }

            });            
        },
        
        write   : function(key, data)
        {
            var file = this.cacheName(key), 
                context = this;             
            
            fs.writeFile(file, JSON.stringify(data), function(err) {
                if (err) {
                    context.$debug("Cache write error: " + err);
                }
            });            
        },
        
        cacheName : function (key) 
        {
            var shasum = crypto.createHash('sha1');
            shasum.update(key);
            return this._dir + '/' + shasum.digest('hex');
        }
    }
}