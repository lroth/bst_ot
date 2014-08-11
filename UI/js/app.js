// main app
var app = angular.module('app', ['vr.directives.slider']);

// Controller
app.controller('AppCtrl', function ($scope, $http) {
    // default values
    $scope.name             = '';
    $scope.age              = 0;
    $scope.salary           = 0;
    $scope.saved_money      = 0;
    $scope.monthly_payments = 0;
    $scope.retirement_age   = 60;
    $scope.increase_salary  = 0;
    $scope.income           = 0;

    function round (num) {
        return Number(num).toFixed(2);
    }

    // calculate
    function calc () {
        $scope.saved_money      = round($scope.salary * Math.pow(1.05, $scope.retirement_age - $scope.age));
        $scope.monthly_payments = round(($scope.salary * 12) * ((Math.pow(1.05, $scope.retirement_age - $scope.age) - 1)/0.05));

        // console.log($scope.retirement_age, 'controller');
        $scope.d3Data = {
            'salary':         $scope.salary,
            'age':            $scope.age,
            'retirement_age': $scope.retirement_age
        }
    }

    // watch for changes of this values
    $scope.$watch('name + age + retirement_age + salary', calc);


});


// d3js directive
app.directive('d3Chart', [function() {
    return {
        restrict: 'EA',
        scope: {
            data: '=' // bi-directional data-binding
        },
        link: function(scope, element, attrs) {
            // get size from attributes
            var width  = (attrs.width) || 200,
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
                .append("g")
                    .attr("transform",
                          "translate(" + margin.left + "," + margin.top + ")");

            // Set the ranges
            console.log([0, width - 200]);
            var x = d3.scale.linear().range([0, width - 200]);
            var y = d3.scale.linear().range([height, 0]);


            // Define the axes
            var xAxis = d3.svg.axis().scale(x)
                .orient("bottom");

            var yAxis = d3.svg.axis().scale(y)
                .orient("left").ticks(5).tickFormat(formatCurrency);

            // watch for data changes and re-render
            scope.$watch('data', function(newVals, oldVals) {
              return scope.render(newVals);
            }, true);

            scope.render = function(data) {
                console.log(data, 'directive');
                // remove all previous items before render
                svg.selectAll('*').remove();

                // If we don't pass any data, return out of the element
                if (!data) return;

                // set data values
                x.domain([data.age, data.retirement_age]);
                y.domain([0, data.salary]);
// debugger;
                xAxis.tickValues(x.domain());
                // Add the X Axis
                svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + height + ")")
                    .call(xAxis);

                // Add the Y Axis
                svg.append("g")
                    .attr("class", "y axis")
                    .call(yAxis);

                // line
                // create a line function that can convert data[] into x and y points
                var line = d3.svg.line()
                    // assign the X function to plot our line as we wish
                    .x(function(d,i) {
                        // verbose logging to show what's actually being done
                        console.log('Plotting X value for data point: ' + d + ' using index: ' + i + ' to be at: ' + x(i) + ' using our xScale.');
                        // return the X coordinate where we want to plot this datapoint
                        return x(i);
                    })
                    .y(function(d, i) {
                        // verbose logging to show what's actually being done
                        console.log('Plotting Y value for data point: ' + d + ' to be at: ' + y(d) + " using our yScale.");
                        // return the Y coordinate where we want to plot this datapoint
                        return y(d);
                    });

                // generate dataset
                var ages   = d3.range(data.age, data.retirement_age);
                // var salary = d3.range(0, data.salary);
                // var area_data = d3.range(data.age, data.retirement_age).map(function(i) { return {'age': i } });
                svg.append("svg:path").attr("d", line(ages));
            }
        }
    };
  }]);
