#!/usr/bin/env php
<?php

require('_url-fetch.php');
require('Candidate.php');

define('POINTS_WATCH', 1); 
define('POINTS_FORK',  5);

if (!is_writable(__DIR__ . '/cache')) {
    die('Cache directory is not writable');
}

// test fetching all the watchers

// get the first page

$repositories = array(
    'PushButtonLabs/PushButtonEngine',
    'mikechambers/as3corelib',
    'AdamAtomic/flixel'
);

$candidates = array();
foreach ($repositories as $repos) {
    echo "Fetching $repos\n";
    $response = null;
    while (true) {   
        if (!isset($response)) {
            $response = getApiResults("repos/$repos/watchers");
        } else {
            $next = $response->getLinkNext();
            if ($next === false) {
                break; 
            }         
            $response = getApiResults($next);
        }

        $data = json_decode($response->getData(), true);
        foreach ($data as $user) {
            $login = $user['login'];
            
            if (!isset($candidates[$login])) {
                $candidates[$login] = new Candidate($login);
            }

            // give them  a watched repo point
            $candidates[$login]->giveWatchTargetRepoPoints($repos);
        }
    }    
}

echo "Total Number of Candidates: " . count($candidates) . "\n"; 

usort($candidates, function($a, $b) {
    return $b->getTotalScore() - $a->getTotalScore();
});

$top = array_slice($candidates, 0, 15);
echo "Top Candidates ... \n";
$c = 1; 
foreach ($top as $candidate) {
    /* @var $candidate Candidate */
    printf("% 5s) % 20s | % 3s | %s\n", 
            $c++, 
            $candidate->login, 
            $candidate->getTotalScore(),
            str_replace('api.github.com/users', 'github.com', $candidate->get('url')));    
}


/*if ($next !== false) {
    $response = getApiResults($next);
    print_r($response->getMeta());
    
    echo "First: " . $response->getLinkFirst() . "\n";
    echo "Prev: " . $response->getLinkPrev() . "\n";
    echo "Next: " . $response->getLinkNext() . "\n";
    echo "Last: " . $response->getLinkLast() . "\n";
    
}*/