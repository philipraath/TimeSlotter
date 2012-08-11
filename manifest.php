<?php
    header('Content-Type: text/cache-manifest');
    echo "CACHE MANIFEST\n";
    
    $hashes = "";
    
    $dir = new RecursiveDirectoryIterator(".");
    foreach (new RecursiveIteratorIterator ($dir) as $file){
        if (	$file->IsFile() &&
          	  $file->getFileName() != 'cache.manifest' &&
          	  $file->getFileName() != 'manifest.php' &&
          	  substr($file->getFileName(), 0, 1) != '.' &&
							substr($dir, 0, 4) != ".git"  && 
							substr($dir, 0, 4) != "dev1"  && 
							substr($dir, 0, 4) != "dev2"  && 
							substr($dir, 0, 4) != "dev3"  && 
							substr($dir, 0, 7) != "staging"
						)
        {
            echo $file . "\n";
            $hashes .= md5_file($file);
        }
    }
    echo "# Hash: " . md5($hashes) . "\n";
?>