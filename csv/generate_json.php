<?php

ini_set('auto_detect_line_endings', true);

$result = array();

function comma_to_dot ($num) {
    return str_replace(',', '.', $num);
}

$i = 0;
foreach (glob(__DIR__ . '/*.csv') as $csv_file) {
    if (($r = fopen($csv_file, 'r')) !== false) {
        while (($row = fgetcsv($r)) !== false) {
            // check for age range
            if (preg_match('/(\d+) - (\d+)/', $row[0], $matches)) {
                $age_range = $matches[0];
                // skip next line
                fgetcsv($r);
                continue;
            }

            if (isset($age_range) && ($age = array_shift($row))) {
                $result[$age][$age_range][$i] = array_map('comma_to_dot', $row);
            }
        }
        fclose($r);
        unset($age_range);
        $i++;
    }
}

file_put_contents('csv.txt', print_r($result, true));
file_put_contents('../UI/js/csv.json', json_encode($result));

echo 'done';