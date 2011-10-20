<?php

define('CACHE_DIR', realpath(__DIR__ . '/cache/'));


/**
 * Returns the results of a call to https://api.github.com
 * 
 * @param string $uri
 * @param bool $useCache 
 * @return GitHubResponse
 */
function getApiResults($uri, $useCache=true) 
{    
    // deal with relative urls automatically 
    if (substr($uri, 0, 4) != 'http') {
        if (substr($uri, 0, 1) == '/') {
            $uri = substr($uri, 1); // chop initial /
        }

        $uri = 'https://api.github.com/'.$uri;                 
    }
            
    if ($useCache) {
        $cached = readCacheData($uri);
        if ($cached !== false) {
            return $cached; 
        }        
    }
        
    $ch = curl_init($uri);
    curl_setopt($ch, CURLOPT_HEADER, 1); // include headers
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    //curl_setopt($ch, CURLINFO_HEADER_OUT, true);
    
    $response = curl_exec($ch); 
    $info = curl_getinfo($ch);
    
    $headers = trim(substr($response, 0, $info['header_size']));
    $body    = substr($response, $info['header_size']);
    
    // break apart headers into     
    $headerData = array();
    foreach(explode("\r\n", $headers) as $line) {
        if (substr($line, 0, 5) == 'HTTP/') {
            continue; 
        }
        $split = strpos($line, ':'); 
        $key = substr($line, 0, $split);
        $val = substr($line, $split+2); 
        $headerData[$key] = $val; 
    }
    
    $ghResponse = new GitHubResponse($headerData, $body);    
    writeCacheData($uri, $ghResponse);
    return $ghResponse;
}

/**
 * Writes the data (json) into a cache file
 * 
 * @param string $uri
 * @param GitHubResponse $data 
 */
function writeCacheData($uri, GitHubResponse $data)
{
    $file = cacheFileName($uri);
    $fp = fopen($file, 'w');
    $toWrite = serialize($data); 
    fwrite($fp, $toWrite);
}

/**
 * Reads data from the cache for the uri, returns
 * null if nothing exists
 * 
 * @param string $uri 
 * @return GitHubResponse
 */
function readCacheData($uri)
{
    $file = cacheFileName($uri);
    if (!file_exists($file)) {
        return false; 
    }
    
    $data = file_get_contents($file); 
    if ($data === false) {
        return false; 
    } else {
        return unserialize($data);
    }
}

/**
 * Creates a common name for the URI when caching
 * 
 * @param type $uri 
 */
function cacheFileName($uri)
{
    return CACHE_DIR . '/' . sha1($uri) . '.cache';
}


/**
 * Encapsulates the GitHub response
 */
class GitHubResponse 
{
    /** @var Array */
    protected $_meta;
    
    /** @var string */
    protected $_data; 
    
    public function __construct(Array $meta, $data) 
    {
       $this->_meta = $meta; 
       $this->_data = $data; 
    }
    
    /**
     * Return the meta information (http headers) 
     * that were in cluded
     * 
     * @return Array
     */
    public function getMeta()
    {
        return $this->_meta;
    }
    
    /**
     * Return the data from the response
     * 
     * @return string
     */
    public function getData()
    {
        return $this->_data;
    }
    
    /**
     * Returns URI to the first page of results
     * 
     * @return type  
     */
    public function getLinkFirst()
    {
        return $this->getLink('first');            
    }
    
    /**
     * Returns URI to the NEXT page of results
     */
    public function getLinkNext()
    {
        return $this->getLink('next');            
    }
    
    /**
     * Returns URI to the LAST page of results
     */
    public function getLinkLast()
    {
        return $this->getLink('last');
    }
    
    /**
     * Returns URI to the PREVIOUS page of results
     * 
     * @return string
     */
    public function getLinkPrev()
    {
        return $this->getLink('prev');
    }
    
    /**
     * Gets link specificed by the relationship $rel (next, last)
     * 
     * @param string $relToFind
     */
    public function getLink($relToFind)
    {
        if (!isset($this->_meta['Link'])) {
            return false; 
        }
        
        $link = $this->_meta['Link'];
        $links = explode(', ', $link);
        
        foreach ($links as $test)
        {
            preg_match('/<([^>]*)>; rel="([^"]*)/', $test, $matches);
            $uri = $matches[1];
            $rel = $matches[2]; 
            
            if ($rel == $relToFind) {
                return $uri; 
            }
        }
        
        return false; 
    }
}