// Atlas app
var atlasApp = angular.module('atlas', ['atlas.controllers', 'atlas.directives', 'atlas.factories', 'ui.slider', 'google.map']);

// Directives
var directives = angular.module('atlas.directives', []);
directives.directive('flatuiCheckbox', function($timeout) {
    return {
        require: 'ngModel',
        link: function(scope, element, attrs, ngModel) {
            var slider = $("#"+attrs.flatuiCheckbox);
            element.on('toggle', function() {
                if (!!ngModel.$viewValue) {
                    slider.slider("disable");
                    scope.$apply();
                } else {
                    slider.slider("enable");
                    scope.$apply();
                }

                ngModel.$setViewValue(!ngModel.$viewValue);
            })
        }
    }
})
directives.directive('onCollapse', function() {
    return function(scope, element, attrs) {
        $(element).on('hide.bs.collapse', function () {
            scope[attrs.onCollapse] = false;
            scope.$apply();
        })

        $(element).on('show.bs.collapse', function () {
            scope[attrs.onCollapse] = true;
            scope.$apply();
        })
    }
})
directives.directive('swallowClick', function() {
    return function(scope, element, attrs) {
        $(element).click(function(event) {
            event.stopPropagation();
        })
    }
})
directives.directive('preventClick', function() {
    return function(scope, element, attrs) {
        $(element).click(function(event) {
            event.preventDefault();
        })
    }
})
directives.directive('tooltip', function() {
    return function(scope, element, attrs) {
        $(element).tooltip({
            title: attrs.tooltip,
            placement: attrs.placement || "top"
        })
    }
})
directives.directive('chart', function() {
    return function(scope, element, attrs) {
        var margin = {top: 20, right: 40, bottom: 0, left: 20},
            width = 160,
            height = 120,
            separation = 60;

        var start_year = 1990, end_year = 2010;

        var c = d3.scale.category10();

        var x = d3.scale.linear()
            .range([0, width]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .tickValues([1990,2000,2010])
            .orient("top");

        var formatYears = d3.format("0000");
        xAxis.tickFormat(formatYears);

        var svg = d3.select($(element)[0]).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


        x.domain([start_year, end_year]);
        var xScale = d3.scale.linear()
            .domain([start_year, end_year])
            .range([0, width]);

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + 0 + ")")
            .call(xAxis);

        var data = [
            {
                values: [[1990,0.633046073853], [2000,0.429026387625], [2010,0.27738795614]],
                name: "Fragmentación de Adjacencia",
                desc: 'El <strong>Indicador de Fragmentación de Adyacencia</strong> mide la frecuencia en qué áreas construidas están rodeadas por espacios verdes o fuentes de agua. Es decir, este indicador mide la frecuencia en que los pixeles construidos son adyacentes a pixeles no construidos. Los valores de este índice varían entre 0 y 1, representando los valores más altos la mayor frecuencia de pixeles construidos adyacentes a espacios abiertos. Los pixeles empleados en estas imágenes satelitales tienen una resolución de 30 por 30 metros, esta resolución permite una buena medición de la fragmentación de las áreas construidas a escala individual de los edificios, es decir permite medir la fragmentación a nivel micro de los espacios abiertos dentro y alrededor de la ciudad.'
            },
            {
                values: [[1990,0.501846628495], [2000,0.407905606772], [2010,0.314881183383]],
                name: "Fragmentación de Apertura",
                desc: 'El <strong>Indicador de Fragmentación de Apertura</strong> mide la proporción de espacio abierto en un círculo de 1km2 medido alrededor de cada pixel construido. El radio de este círculo (586 metros) corresponde con la distancia a cubrir en una caminata recreativa de 10 minutos. El Índice de Fragmentación de Apertura es un indicador de la cantidad de espacio abierto a una distancia caminable para las distintas partes de la ciudad, es decir mide la cantidad de espacio abierto en cada barrio. En síntesis, este indicador mide el promedio de los espacios abiertos (no construidos) en un área de 1 km2.'
            }
        ]

        var rScale = d3.scale.linear()
            .domain([0, 1])
            .range([0, 15]);

        for (var j = 0; j < data.length; j++) {
            var g = svg.append("g")
                .attr("class","index")

            var circles = g.selectAll("circle")
                .data(data[j].values)
                .enter()
                .append("circle");

            var text = g.selectAll("text")
                .data(data[j]['values'])
                .enter()
                .append("text");

            circles
                .attr("cx", function(d, i) { return xScale(d[0]); })
                .attr("cy", j*separation+20)
                .attr("r", function(d) { return rScale(d[1]); })
                .style("fill", function(d) { return c(j); });

            text
                .attr("y", j*separation+25)
                .attr("x",function(d, i) { return xScale(d[0])-5; })
                .attr("class","value")
                .text(function(d){ return d[1].toFixed(2); })
                .style("fill", function(d) { return c(j); })
                .style("display","none");

            var label = g.append("text")
                .attr("y", j*separation+45)
                .attr("x",0)
                .attr("class","label")
                .text(data[j]['name'])
                .style("fill", function(d) { return c(j); })

            var hoverarea = g.append("rect")
                .attr("x", -20)
                .attr("y", j*separation)
                .attr("width", width+40)
                .attr("height", separation)
                .attr("class", "hoverarea");

            hoverarea.tooltip(function(d,i) {
                return {
                    cssClass: 'tooltip data fade bottom in',
                    type: 'fixed',
                    gravity: 'bottom',
                    content: data[j]['desc'],
                    displacement: [0,0]
                }
            })
        }
    }
})

// Factories
var factories = angular.module('atlas.factories', []);

factories.factory('TileLayer', [function() {
    return {
        create: function(scope, city, options) {

            var layer = new google.maps.ImageMapType({
                getTileUrl: function(coord, zoom) {
                    var proj = scope.map.getProjection();
                    var z2 = Math.pow(2, zoom);
                    var tileXSize = 256 / z2;
                    var tileYSize = 256 / z2;
                    var tileBounds = new google.maps.LatLngBounds(
                        proj.fromPointToLatLng(new google.maps.Point(coord.x * tileXSize, (coord.y + 1) * tileYSize)),
                        proj.fromPointToLatLng(new google.maps.Point((coord.x + 1) * tileXSize, coord.y * tileYSize))
                    );
                    var ymax = 1 << zoom;
                    var y = ymax - coord.y -1;
                    if (scope.mapOptions.mapBounds.intersects(tileBounds) && (scope.mapOptions.mapMinZoom <= zoom) && (zoom <= scope.mapOptions.mapMaxZoom))
                        return "tiles/" + city + "/" + options.type + "/" + scope.selection[options.name].moment + "/" + zoom + "/" + coord.x + "/" + y + ".png";
                    else
                        return "http://www.maptiler.org/img/none.png";
                },
                tileSize: new google.maps.Size(256, 256),
                isPng: true,

                opacity: options.opacity
            });

            scope.$watch(options.name + '.opacity', function(oldValue, newValue) {
                if (scope.map) {
                    scope.map.overlayMapTypes.getAt(options.zIndex).setOpacity(newValue)
                }
            })

            return layer;
        }
    }
}])

// Controllers
var controllers = angular.module('atlas.controllers', []);
controllers.controller('AppController', ['$scope',  'TileLayer', function($scope,  TileLayer) {
    $scope.selection = {
        city: "sample",
        urbanFootprint: {
            visible: true,
            moment: "t0"
        },
        urbanArea: {
            visible: true,
            moment: "t0"
        },
        newDevelopment: {
            visible: true,
            moment: "t0_t1"
        }
    }

    $scope.controlsVisible = true;
    $scope.mapTypeId = 'satellite';

    $scope.urbanArea = {
        name: "urbanArea",
        type: "urban_area",
        opacity: 0.5,
        zIndex: 0
    }

    $scope.urbanFootprint = {
        name: "urbanFootprint",
        type: "urban_footprint",
        opacity: 0.5,
        zIndex: 1
    }

    $scope.newDevelopment = {
        name: "newDevelopment",
        type: "new_development",
        opacity: 0.5,
        zIndex: 2
    }

    $scope.toggleLayerVisibility = function(layer) {
        var visible = $scope.selection[layer.name].visible;
        layer.layer.setOpacity(visible ? $scope[layer.name].opacity : 0);
        $scope.$apply();
    }

    $scope.setLayerMoment = function(layer, moment) {
        removeLayer(layer);
        $scope.selection[layer.name].moment = moment;
        addLayer($scope[layer.name]);
    }

    $scope.initLayers = function() {
        addLayer($scope.urbanFootprint);
        addLayer($scope.urbanArea);
        addLayer($scope.newDevelopment);
    }

    function removeLayer(layer) {
        $scope.map.overlayMapTypes.removeAt(layer.zIndex, layer.layer);
    }

    function addLayer(layer) {
        layer.layer = TileLayer.create($scope, $scope.selection.city, layer);
        $scope.map.overlayMapTypes.insertAt(layer.zIndex, layer.layer);
    }

    $scope.toggleControlsVisibility = function() {
        $scope.controlsVisible = !$scope.controlsVisible;
    }

    $scope.zoomOut = function() {
        $scope.map.setZoom($scope.map.getZoom()-1)
    }

    $scope.zoomIn = function() {
        $scope.map.setZoom($scope.map.getZoom()+1)
    }

    $scope.setMapType = function(type) {
        $scope.mapTypeId = type;
        $scope.map.setMapTypeId(type);
    }
}])