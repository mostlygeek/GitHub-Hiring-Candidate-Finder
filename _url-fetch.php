<?php

define('CACHE_DIR', realpath(__DIR__ . '/cache/'));


/**
 * Returns the results of a call to https://api.github.com
 * 
 * @param string $uri
 * @param bool $useCache 
 * @return array('meta' => header data/other, 'data' => json decoded object)
 */
function getApiResults($uri, $useCache=true) 
{    
    if (substr($uri, 0, 1) == '/') {
        $uri = substr($uri, 1); // chop initial /
    }
    
    $uri = 'https://api.github.com/'.$uri; 
        
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
    
    $data = array('meta' => $headerData, 'body' => $body); 
    writeCacheData($uri, $data);
    return $data;    
}

/**
 * Writes the data (json) into a cache file
 * 
 * @param string $uri
 * @param string $data 
 */
function writeCacheData($uri, $data)
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