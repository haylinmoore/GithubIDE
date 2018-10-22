<?php
    
    function startsWith($haystack, $needle)
    {
         $length = strlen($needle);
         return (substr($haystack, 0, $length) === $needle);
    }
    
    function endsWith($haystack, $needle) {
        // search forward starting from end minus needle length characters
        if ($needle === '') {
            return true;
        }
        $diff = \strlen($haystack) - \strlen($needle);
        return $diff >= 0 && strpos($haystack, $needle, $diff) !== false;
    }
        
    $key = "86fb269d190d2c85f6e0468ceca42a20";

    if ($_GET['key'] != $key){
        header('HTTP/1.0 403 Forbidden');

        echo 'You are forbidden!';
        die();
    }
    

    if ($_GET['req'] === "files"){
        $path = '../';
        header('Content-Type: application/json');
        $files = array();
        foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($path)) as $filename)
        {
            $filename = substr($filename, 2);
            if (endsWith($filename, ".") || startsWith($filename, "/ultimumide/")){
                continue;
            } else {
                $files[$filename] = array($filename, file_get_contents(".." . $filename));
            }
            
        }
        echo json_encode($files);
        
        
    }
