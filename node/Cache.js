var crypto = require('crypto'), 
    fs = require('fs');
/**
 * Test that a cache container works as expected 
 */
function Cacheable(cacheDir, debug)
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
                    context.$debug(err);
                    cacheHandler.call(context, key, false);
                } else {
                    // successfully got data                    
                    cacheHandler.call(context, key, true, JSON.parse(data));
                }

            });            
        },
        
        write   : function(key, data)
        {
            var file = this.cacheName(key), 
                context = this;             
            
            fs.writeFile(file, JSON.stringify(data), function(err) {
                context.$debug("Cache write error: " + err);
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

var cache = Cacheable('./cache');
cache.get('some-key-blah', function(key, hit, data) {
    if (hit) {
        
        console.log('HIT! Got back: "' + data + '"');
        
    } else {        
        console.log('MISS, writing data');
        this.write(key, key);
    }
});

cache.get('some-key-blah2', function(key, hit, data) {
    if (hit) {
        
        console.log('HIT! Got back: "' + data + '"');
        
    } else {        
        console.log('MISS, writing data');
        this.write(key, key);
    }
});