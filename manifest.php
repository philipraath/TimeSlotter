<?php
    header('Content-Type: text/cache-manifest');
    echo "CACHE MANIFEST\n";
    
    $hashes = "";
    
    $dir = new RecursiveDirectoryIterator(".");
    foreach (new RecursiveIteratorIterator ($dir) as $file){
        if ($file->IsFile()) {
          if ( $file->getFileName() != 'manifest.php' && (substr($file, 2 , 4) != '.git') && ($file->getFileName() != '.DS_Store') ) {
            print $file. "\n";
            $hashes .= md5_file($file);
          }
        }
    }
    echo "http://code.jquery.com/mobile/1.1.0/jquery.mobile-1.1.0.min.css" . "\n";
    echo "http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js" . "\n";
    echo "https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.18/jquery-ui.min.js" . "\n";
    echo "http://code.jquery.com/mobile/1.1.0/jquery.mobile-1.1.0.min.js" . "\n";
    echo "# Hash: " . md5($hashes) . "\n";
?>