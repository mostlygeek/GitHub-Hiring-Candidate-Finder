#!/usr/bin/env php
<?php

require('_url-fetch.php');
if (!is_writable(__DIR__ . '/cache')) {
    die('Cache directory is not writable');
}

$data = getApiResults('repos/PushButtonLabs/PushButtonEngine/watchers');
print_r($data);