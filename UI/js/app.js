// main app
var app = angular.module('app', ['vr.directives.slider']);

// Controller
app.controller('AppCtrl', function ($scope, $http) {
    $scope.csv_data      = false;
    $scope.widget_height = '0px';
    $scope.tips          = {};

    // dictionaries
    $scope.periods    = [0, 1, 4, 8, 13, 26, 52, 104];
    $scope.paid_names = ['Paid Monthly', 'Paid Weekly'];
    $scope.max_amount = [8333, 1923];
    $scope.min_value  = [5, 0];
    $scope.min_cover  = [100, 23];
    $scope.divides    = [4.33, 0.23];

    // default values
    $scope.paid_type         = 0;
    $scope.amount            = 0;
    $scope.amount_monthly    = 0;
    $scope.send_email        = false;
    $scope.age_range_error   = false;
    $scope.cover_value_error = false;
    $scope.result_min_error  = false;

    // default results
    $scope.personal_guaranteed        = 0;
    $scope.personal_reviewable        = 0;
    $scope.budget_personal_guaranteed = 0;
    $scope.budget_personal_reviewable = 0;

    $scope.personal_guaranteed_info        = '';
    $scope.personal_reviewable_info        = '';
    $scope.budget_personal_guaranteed_info = '';
    $scope.budget_personal_reviewable_info = '';

    $http({
        method: 'GET',
        url: 'UI/js/csv.json'
    }).success(function(data, status, headers, config) {
        $scope.csv_data      = data;
        $scope.widget_height = 'auto';
    });

    // paid switcher
    $scope.changePaid = function () {
        $scope.paid_type = +(!$scope.paid_type);
        $scope.amount = Math.round($scope.amount * get_divide());
    }

    $scope.toggleHelp = function (idx) {
        $scope.tips[idx] = !$scope.tips[idx];
    }

    // check max amount value
    function check_amount () {
        // limit amount based on paid type
        $scope.amount = Math.min($scope.amount, $scope.max_amount[$scope.paid_type]);
        // save amount monthly that will be used for calculations
        if ($scope.paid_type) {
            $scope.amount_monthly = round($scope.amount * $scope.divides[0]);
        } else {
            $scope.amount_monthly = round($scope.amount);
        }
        // check the min cover value
        fix_min_value();
    }

    function round (num) {
        return Number(num).toFixed(2);
    }

    // get range base on age_end
    function get_range (age_end) {
        if (age_end <= 60)
            return '50 - 60';

        if (age_end <= 65)
            return '61 - 65';

        return '66 - 70';
    }

    // get future price multiplier
    function get_multiplier (idx) {
        return $scope.csv_data[$scope.age_start][get_range($scope.age_end)][idx][$scope.period];
    }

    // weekly, monthly
    function get_divide () {
        return $scope.divides[$scope.paid_type];
    }

    // minimum price value (weekly, monthly)
    function get_min_value () {
        return $scope.min_value[$scope.paid_type];
    }

    function fix_min_value () {
        //fix value for calc
        if ($scope.amount_monthly < $scope.min_cover[$scope.paid_type]) {
            $scope.amount_monthly = $scope.min_cover[$scope.paid_type];
        }

        //validation
        if ($scope.amount > 0 && $scope.amount < $scope.min_cover[$scope.paid_type]) {
            $scope.cover_value_error = 'Cover amount cannot be less than ' + $scope.min_cover[$scope.paid_type];
        } else {
            $scope.cover_value_error = ''
        }
    }

    // calc single price value
    function calc_value (idx, min) {
        var value = $scope.amount_monthly * get_multiplier(idx);
        if (value) {
            //if min
            if (value < min) {
                $scope.result_min_error = 'under the minimum £5 monthly premium';

                return 'N/A';
            } else {
                $scope.result_min_error = false;
            }
            return round(Math.max(value, min || 0));
        }
        return 0;
    }

    function calc_info (idx, min) {
        var info = $scope.amount_monthly + ' x ' + get_multiplier(idx) + ' = ' + calc_value(idx, min);
        if (min) {
            info = info + ' (minimum: ' + min + ')';
        }

        return info;
    }

    // calculate
    function calc () {
        if ($scope.csv_data && $scope.amount > 0) {
            // new data from scope update
            var min_value = get_min_value();

            // calculate
            $scope.personal_guaranteed        = calc_value(0, min_value);
            $scope.personal_reviewable        = calc_value(1, min_value);
            $scope.budget_personal_guaranteed = calc_value(2, min_value);
            $scope.budget_personal_reviewable = calc_value(3, min_value);

            // infos
            $scope.personal_guaranteed_info        = calc_info(0, min_value);
            $scope.personal_reviewable_info        = calc_info(1, min_value);
            $scope.budget_personal_guaranteed_info = calc_info(2, min_value);
            $scope.budget_personal_reviewable_info = calc_info(3, min_value);
        }
    }

    function check_age_range () {
        if ($scope.csv_data) {
            if ($scope.age_start > $scope.age_end) {
                $scope.age_range_error = 'Client age at start cannot be greater than age at end';
            } else {
                // min 5 years diff
                if ($scope.age_end - $scope.age_start < 5) {
                    $scope.age_range_error = 'Minimum policy term is 5 years';
                } else {
                    $scope.age_range_error = '';
                }
            }
        }
    }

    // watch for changes of this values
    $scope.$watch('age_start + age_end', check_age_range);
    $scope.$watch('amount + paid_type', check_amount);
    $scope.$watch('amount + age_start + age_end + paid_type + period', calc);

    // translate - 0 -> 7 to set of $scope.periods
    $scope.translateFn = function (value) {
        return $scope.periods[value];
    }
});
