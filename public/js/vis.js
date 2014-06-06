var vis = angular.module('atlas.vis', []);

vis.directive('indexes', function() {
    return function(scope, element, attrs) {
        var margin = {top: 20, right: 25, bottom: 0, left: 25},
            width = 236 - margin.left - margin.right,
            height = 400,
            ypos = { fragmentation: 0, builtUp: 150 },
            builtUpHeight = 100;


        var years = [1990, 2000, 2010],
            start_year = 1990,
            end_year = 2010;

        var x = d3.scale.linear()
            .range([0, width]);

        var x0 = d3.scale.ordinal()
            .rangeRoundBands([0, width], .1);

        var y = d3.scale.linear()
            .range([builtUpHeight, 0]);

        var color = d3.scale.ordinal()
            .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

        var xScale = d3.scale.linear()
            .domain([0,2])
            .range([0, width]);

        var rScale = d3.scale.linear()
            .domain([0, 1])
            .range([0, 15]);

        var xAxisDescrete = d3.svg.axis()
            .scale(x)
            .tickValues(years)
            .tickFormat(d3.format("0000"))
            .orient("top");

        var xAxis = d3.svg.axis()
            .scale(x0)
            .orient("bottom");

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .tickFormat(d3.format(".2s"));

        var svg = d3.select($(element)[0]).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

        var fragmentation = svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + (margin.top + ypos.fragmentation) + ")");

        var builtUp = svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + (margin.top + ypos.builtUp) + ")");

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

        scope.updateVis = function(city) {
            var edgeData = [city.t0_edge, city.t1_edge, city.t2_edge],
                opennessData = [city.t0_open, city.t1_open, city.t2_open],
                builtUpData = [
                    {
                        year: 1990,
                        rural: parseFloat(city.t0_rural_urban),
                        suburban: parseFloat(city.t0_suburban_urban),
                        urban: parseFloat(city.t0_urban_urban)
                    },
                    {
                        year: 2000,
                        rural: parseFloat(city.t1_rural_urban),
                        suburban: parseFloat(city.t1_suburban_urban),
                        urban: parseFloat(city.t1_urban_urban)
                    },
                    {
                        year: 2010,
                        rural: parseFloat(city.t2_rural_urban),
                        suburban: parseFloat(city.t2_suburban_urban),
                        urban: parseFloat(city.t2_urban_urban)
                    }
                ];

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
                .attr("r", rScale)
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
                .attr("r", rScale)
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

            // Built-up
            color.domain(d3.keys(builtUpData[0]).filter(function(key) { return key !== "year"; }));
            builtUpData.forEach(function(d) {
                var y0 = 0;
                d.values = color.domain().map(function(type) { return { type: type, y0: y0, y1: y0 += +d[type] }});
                d.total = d.values[d.values.length - 1].y1;
            })
            builtUpData.sort(function(a, b) { return b.total - a.total; });
            x0.domain(builtUpData.map(function(d) { return d.year; }));
            y.domain([0, d3.max(builtUpData, function(d) { return d.total; })]);
            var builtUpGroups = builtUp.selectAll(".year-bargroup")
                .data(builtUpData)
            builtUpGroups.enter().append("g")
                .attr("class", "year-bargroup")
                .attr("transform", function(d, i) {
                    return "translate(" + (xScale(i)-x0.rangeBand()/2) + ",0)";
                })
            var builtUpRects = builtUpGroups.selectAll("rect")
                .data(function(d) { return d.values; })
            builtUpRects.enter().append("rect")
                .attr("width", x0.rangeBand())
//                .attr("x", function(d) { return x1(d.type); })
                .attr("y", builtUpHeight)
                .attr("height", 0)
                .style("fill", function(d) { return color(d.type); })
            builtUpRects
                .transition()
                .delay(500)
                .attr("y", function(d) { return y(d.y1); })
                .attr("height", function(d) { return y(d.y0) - y(d.y1); })
        }
    }
})

