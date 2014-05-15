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
    $scope.divides    = [13 / 3, 3 / 13];

    // default values
    $scope.paid_type       = 0;
    $scope.amount          = 0;
    $scope.send_email      = false;
    $scope.age_range_error = false;

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

    // pdf action - TODO: fill in with data
    $scope.getPdf = function () {
        var doc = new jsPDF();
        doc.text(20, 20, ($scope.personal_guaranteed).toString());
        doc.text(20, 30, 'This is client-side Javascript, pumping out a PDF.');
        doc.save('Test.pdf');
    }

    // paid switcher
    $scope.changePaid = function () {
        $scope.paid_type = +(!$scope.paid_type);
        $scope.amount    = Math.round($scope.amount * get_divide());
    }

    // open/close send email form
    $scope.sendEmail = function () {
        $scope.send_email = !$scope.send_email;
    }

    // send email action
    $scope.triggerSendEmail = function () {
        // TODO: validate email and send this to some
        // php backend script and send email
    }

    // print - TODO: decide what we should do - print current layout or some other?
    $scope.print = function (container_id) {
        // var content = document.getElementById(container_id).innerHTML;
        // var popup   = window.open('', '_blank', 'width=300,height=300');
        // popup.document.open()
        // popup.document.write('<html><body onload="window.print()">' + content + '</html>');
        // popup.document.close();

        // OR JUST
        window.print();
    }

    $scope.toggleHelp = function (idx) {
        $scope.tips[idx] = !$scope.tips[idx];
    }

    // check max amount value
    function check_amount () {
        $scope.amount = Math.min($scope.amount, $scope.max_amount[$scope.paid_type]);
    }

    function round (num) {
        return Math.round(num * 100) / 100;
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

    // calc single price value
    function calc_value (idx, min) {
        var value = $scope.amount * get_multiplier(idx);
        return round(Math.max(value, min || 0));
    }

    function calc_info (idx, min) {
        var info = $scope.amount + ' x ' + get_multiplier(idx) + ' = ' + calc_value(idx);
        if (min) {
            info = info + ' (minimum: ' + min + ')';
        }
        return info;
    }

    // calculate
    function calc () {
        if ($scope.csv_data) {
            // new data from scope update
            // console.log($scope.age_start, 'age_start');
            // console.log($scope.age_end, 'age_end');
            // console.log($scope.amount, 'amount');
            // console.log($scope.paid_type, 'paid_type');
            // console.log($scope.period, 'period');

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
                $scope.age_range_error = '';
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
