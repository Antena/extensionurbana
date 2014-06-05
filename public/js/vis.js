var vis = angular.module('atlas.vis', []);

vis.directive('indexes', function() {
    return function(scope, element, attrs) {
        var margin = {top: 20, right: 40, bottom: 0, left: 20},
            width = 200,
            height = 400,
            heights = { fragmentation: 0, builtUp: 350 }

        var start_year = 1990, end_year = 2010;

        var x = d3.scale.linear()
            .range([0, width]);

        var xScale = d3.scale.linear()
            .domain([0,2])
            .range([0, width]);

        var rScale = d3.scale.linear()
            .domain([0, 1])
            .range([0, 15]);

        var xAxisDescrete = d3.svg.axis()
            .scale(x)
            .tickValues([1990,2000,2010])
            .tickFormat(d3.format("0000"))
            .orient("top");

        var svg = d3.select($(element)[0]).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

        var fragmentation = svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + (margin.top + heights.fragmentation) + ")");

        var builtUp = svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + (margin.top + heights.builtUp) + ")");

        x.domain([start_year, end_year]);

        fragmentation.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + 0 + ")")
            .call(xAxisDescrete);

        var edge = fragmentation.append("g")
            .attr("class", "edge-index");

        var openness = fragmentation.append("g")
            .attr("class", "openness-index")
            .attr("transform", "translate(0,60)")

        builtUp.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + 0 + ")")
            .call(xAxisDescrete);

        scope.updateVis = function(city) {
            console.log(city);        //TODO(gb): Remove trace!!!

            var edgeData = [city.t0_edge, city.t1_edge, city.t2_edge],
                opennessData = [city.t0_open, city.t1_open, city.t2_open]

            // Edge Index
            var edgeCircles = edge.selectAll("circle")
                .data(edgeData)
            edgeCircles.enter().append("circle")
                .attr("cx", function(d, i) { return xScale(i) })
                .attr("cy", 25)
                .attr("r", 0)
            edgeCircles
                .transition()
                .delay(500)
                .attr("r", function(d) { return rScale(d) })
            var edgeText = edge.selectAll("text")
                .data(edgeData)
            edgeText.enter().append("text")
                .attr("class", "index-value")
                .attr("x", function(d, i) { return xScale(i) })
                .attr("y", 55)
                .attr("text-anchor", "middle");
            edgeText
                .transition()
                .delay(500)
                .text(function(d) { return parseFloat(d).toFixed(2); });

            // Openness Index
            var opennessCircles = openness.selectAll("circle")
                .data(opennessData)
            opennessCircles.enter().append("circle")
                .attr("cx", function(d, i) { return xScale(i) })
                .attr("cy", 25)
                .attr("r", 0)
            opennessCircles
                .transition()
                .delay(500)
                .attr("r", function(d) { return rScale(d) })
            var opennessText = openness.selectAll("text")
                .data(opennessData)
            opennessText.enter().append("text")
                .attr("class", "index-value")
                .attr("x", function(d, i) { return xScale(i) })
                .attr("y", 55)
                .attr("text-anchor", "middle");
            opennessText
                .transition()
                .delay(500)
                .text(function(d) { return parseFloat(d).toFixed(2); });

        }
    }
})

