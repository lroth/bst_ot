// main app
var app = angular.module('app', ['vr.directives.slider']);

// Controller
app.controller('AppCtrl', function ($scope, $http) {
    // default values
    $scope.name                 = '';

    // constant value
    $scope.state_pension        = 5811;

    // user data
    $scope.age                  = 40;
    $scope.salary               = 30000;
    $scope.saved_money          = 60000;
    $scope.monthly_payments     = 300;
    $scope.retirement_age       = 65;
    $scope.increase_salary      = 1;
    $scope.income               = 30000;

    // results
    $scope.shortfall            = 0;
    $scope.private_pension      = 0;
    $scope.occupational_pension = 0;
    $scope.total                = 0;
    $scope.future_earnings      = 0;
    $scope.free                 = 0;

    // helpers
    $scope.age_diff             = 0;
    $scope.increased_salary     = 0;

    // round helper
    function round (num) {
        return Number(num).toFixed(2);
    }

    // calculate
    function calc () {
        $scope.age_diff = $scope.retirement_age - $scope.age;
        // $scope.saved_money      = round($scope.salary * Math.pow(1.05, $scope.retirement_age - $scope.age));
        // $scope.monthly_payments = round(($scope.salary * 12) * ((Math.pow(1.05, $scope.retirement_age - $scope.age) - 1)/0.05));

        //estimate increase by every 5 years before you retire (%)
        $scope.increased_salary     = (1 * $scope.salary) * (Math.pow((1 + $scope.increase_salary/100), $scope.age_diff / 5));
        $scope.occupational_pension = $scope.increased_salary * (($scope.retirement_age - 30)/80);
        $scope.private_pension      = ($scope.saved_money * (Math.pow(0.05, $scope.age_diff))) +
                                      (
                                        ($scope.monthly_payments * 12) *
                                        ((Math.pow(0.05, $scope.age_diff))/0.05))
                                      * 0.05;
        // debugger;
        $scope.total     = $scope.private_pension + $scope.occupational_pension + $scope.state_pension;
        $scope.shortfall = $scope.income - $scope.total;
        $scope.free      = $scope.total * 0.25;

        // console.log($scope.retirement_age, 'controller');
        $scope.d3Data = {
            'salary':               1 * $scope.salary,
            'age':                  $scope.age,
            'retirement_age':       $scope.retirement_age,
            'increased_salary':     $scope.increased_salary,
            'shortfall':            $scope.shortfall,
            'private_pension':      $scope.private_pension,
            'occupational_pension': $scope.occupational_pension,
            'state_pension':        $scope.state_pension,
            'total':                $scope.total,
            'income':               $scope.income
        }
    }

    // watch for changes of this values
    $scope.$watch('increase_salary + name + age + retirement_age + salary + income + saved_money + monthly_payments', calc);


});


// d3js directive
app.directive('d3Chart', [function() {
    return {
        restrict: 'EA',
        scope: {
            data: '=' // bi-directional data-binding
        },
        link: function(scope, element, attrs) {
            var container_width = document.getElementById('results').offsetWidth;

            // get size from attributes
            // var width  = (attrs.width) || 200,
            var width  = container_width || 200,
                proportion = 0.4,
                height = (attrs.height) || 100;

            var margin = {top: 30, right: 20, bottom: 30, left: 80},
                width  = width - margin.left - margin.right,
                height = height - margin.top - margin.bottom;

            var formatCurrency = function(d) { return "£" + d; };

            // Adds the svg canvas
            var svg = d3.select(element[0])
                .append("svg")
                    .style('background', 'rgba(0, 0, 0, 0.05)')
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                .html('<defs><pattern id="diagonalHatch" patternUnits="userSpaceOnUse" width="4" height="4"><path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" /></pattern></defs>')
                .append("g")
                    .attr("transform",
                          "translate(" + margin.left + "," + margin.top + ")");

            // Set the ranges
            var x = d3.scale.linear().range([0, width - width * proportion]);
            var x_death = d3.scale.linear().range([width - width * proportion, width]);
            var y = d3.scale.linear().range([height, 0]);

            // Define the axes
            var keywords = ['Age now', 'Retirement Age'];

            // watch for data changes and re-render
            scope.$watch('data', function(newVals, oldVals) {
              return scope.render(newVals);
            }, true);

            scope.render = function(data) {

                var xAxis = d3.svg.axis().scale(x)
                    .orient("bottom")
                    .tickFormat(function(d, i) { return keywords[i] + ' ' + d });

                var yAxis = d3.svg.axis().scale(y)
                    .orient("left").tickFormat(formatCurrency);

                // console.log(data, 'directive');
                // remove all previous items before render
                svg.selectAll('*').remove();

                // If we don't pass any data, return out of the element
                if (!data) return;

                // set data values
                x.domain([data.age, data.retirement_age]);
                y.domain([0, data.increased_salary + (data.increased_salary / 5)]);

                var live = [
                    {'x': data.age, 'y': data.salary},
                    {'x': data.retirement_age, 'y': data.increased_salary}
                ];

                var area = d3.svg.area()
                    .x(function(d) { return x(d.x); })
                    .y0(height)
                    .y1(function(d) { return y(d.y); });

                // draw main chart
                svg.append("path").attr("class", "area").attr("d", area(live));

                // draw rects on the right
                var bar = svg.append("g")
                    .attr("transform", "translate("+ (width - width * proportion) + ","+height+")");

                // shortfall pension
                var shortfall = height - y(data.shortfall + data.private_pension + data.occupational_pension + data.state_pension)
                bar.append("rect")
                    .attr("width", width * proportion)
                    .attr("class", "shortfall_rect")
                    .attr("transform", "translate(0, "+ (-1 * shortfall) +")")
                    .attr("height", shortfall);
                // label
                bar.append("text")
                    .attr("x", (width * proportion) / 2)
                    .attr("y", -1 * shortfall - 10)
                    .style("text-anchor", "middle")
                    .text('Desired retirement income');

                bar.append("line")
                    .attr("x1", 0)
                    .attr("x2", width * proportion)
                    .attr("y1", -1 * (height - y(data.income)))
                    .attr("y2", -1 * (height - y(data.income)))
                    .attr("stroke-dasharray", "10, 10")
                    .attr("class", "marker-line");
                // debugger;
                // private pension
                var private_pos = height - y(data.private_pension + data.occupational_pension + data.state_pension)
                bar.append("rect")
                    .attr("width", width * proportion)
                    .attr("class", "private_rect")
                    .attr("transform", "translate(0, "+ (-1 * private_pos) +")")
                    .attr("height", private_pos);

                // occupational pension
                var occupational_pos = height - y(data.occupational_pension+data.state_pension)
                bar.append("rect")
                    .attr("width", width * proportion)
                    .attr("class", "occupation_rect")
                    .attr("transform", "translate(0, "+ (-1 * occupational_pos) +")")
                    .attr("height", occupational_pos);

                // state pension
                var state_pos = height - y(data.state_pension)
                bar.append("rect")
                    .attr("width", width * proportion)
                    .attr("class", "state_rect")
                    .attr("transform", "translate(0, "+ (-1 * state_pos) +")")
                    .attr("height", state_pos);


                xAxis.tickValues(x.domain());
                // Add the X Axis
                svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + height + ")")
                    .call(xAxis);

                // xAxis.domain([0, 100]);
                xAxis.scale(x_death);
                svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + height + ")")
                    .call(xAxis)
                .append("text")
                    .attr("x", width)
                    .attr("y", 22)
                    .attr("text-anchor", "end")
                    .text('Death');

                // Add the Y Axis
                svg.append("g")
                    .attr("class", "y axis")
                    .call(yAxis);

                // add death yAxis
                yAxis.tickValues("");
                svg.append("g")
                    .attr("class", "y axis")
                    .attr("transform", "translate(" + (width - width * proportion) + ",0)")
                    .call(yAxis);
                svg.append("g")
                    .attr("class", "y axis")
                    .attr("transform", "translate(" + (width) + ",0)")
                    .call(yAxis);
// debugger;
                //
            }
        }
    };
  }]);
