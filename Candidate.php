<?php

class Candidate 
{
    /**
     * The Github data for the person
     * @var array
     */
    protected $_data; 
    public $login = 'unknown'; 
    
    protected $_scores = array(
        'watchTargetRepo' => 0,     // the repositories we're interested in
        'forkTargetRepo'  => 0,     // score for forking a target repo
        'forkScore'       => 0,     // the score for their forked repos
        
        // ....
    );
    
    public function __construct($login)
    {
        echo "  - Loading: /users/$login\n";
        $response = getApiResults("/users/$login");
        if ($response) {            
            $this->_data = json_decode($response->getData(), true);
            $this->login = $login;
            // tally up any scores we got.. 
        } else {
            throw new Exception('Could not load user: ' .$login);
        }
    }
    
    /**
     * Returns a user parameter, or $default if it doesn't exist
     * 
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    public function get($key, $default=null)
    {
        if (isset($this->_data[$key])) {
            return $this->_data[$key];
        } else {
            return $default;
        }
    }
    
    /**
     * Return all user data 
     * @return array
     */
    public function getAll()
    {
        return $this->_data;
    }
    
    /**
     * Returns the user's total score
     * 
     * @return int
     */
    public function getTotalScore()
    {
        $total = 0;
        foreach ($this->_scores as $score) {
            $total += $score;
        }
        return $total;
    }
    
    /**
     * Gives the user points for watching a target repo
     * @param string $repos the ID of the target repository, ie: mostlygeek/stuff
     */
    public function giveWatchTargetRepoPoints($repos /** unused for now */)
    {
        $this->_scores['watchTargetRepo']++;
    }
    
    public function giveForkTargetRepoPoints($repos /** unused for now */)
    {
        $this->_scores['forkTargetRepo']++;
    }
    
    
}