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
directives.directive('typeahead', ['$http', function($http) {
    function parseCity(cityStr) {
        var parts = cityStr.split("#");
        return {
            id: parts[0],
            name: parts[1],
            province: parts[2]
        }
    }

    return function(scope, element, attrs) {
        $http.get("/data/cities.csv").success(function(data) {
            // Build data source
            var cities = [];
            $.each($.csv.toObjects(data), function(idx, city){
                cities.push(city.id+"#"+city.name+"#"+city.province);
            })

            $(element).typeahead({
                source: cities,
                updater: function(item) {
                    var city = parseCity(item);
                    scope.loadCity(city.id);
                    return city.name;
                },
                matcher: function(item) {
                    var city = parseCity(item);
                    return city.name.toLowerCase().indexOf(this.query) >= 0 || city.province.toLowerCase().indexOf(this.query) >= 0;
                },
                highlighter: function(item) {
                    var city = parseCity(item);
                    return city.name + ", " + city.province;
                }
            })
        })

    }
}])
directives.directive('axis', function() {
    return function(scope, element, attrs) {
        var margin = {top: 20, right: 40, bottom: 0, left: 20},
            width = 200,
            height = 10;

        var start_year = 1990, end_year = 2010;

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

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + 0 + ")")
            .call(xAxis);
    }
})
directives.directive('chart', function() {
    return function(scope, element, attrs) {
        var margin = {top: 0, right: 40, bottom: 0, left: 20},
            width = 200,
            height = 45;

        var start_year = 1990, end_year = 2010;

        var c = d3.scale.category10();

        var x = d3.scale.linear()
            .range([0, width]);

        var svg = d3.select($(element)[0]).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        x.domain([start_year, end_year]);
        var xScale = d3.scale.linear()
            .domain([start_year, end_year])
            .range([0, width]);

        var data = [
            {
                values: [[1990,0.633046073853], [2000,0.429026387625], [2010,0.27738795614]],
                name: "Fragmentación de Adjacencia",
                id: "edge",
                desc: 'El <strong>Indicador de Fragmentación de Adyacencia</strong> mide la frecuencia en qué áreas construidas están rodeadas por espacios verdes o fuentes de agua. Es decir, este indicador mide la frecuencia en que los pixeles construidos son adyacentes a pixeles no construidos. Los valores de este índice varían entre 0 y 1, representando los valores más altos la mayor frecuencia de pixeles construidos adyacentes a espacios abiertos. Los pixeles empleados en estas imágenes satelitales tienen una resolución de 30 por 30 metros, esta resolución permite una buena medición de la fragmentación de las áreas construidas a escala individual de los edificios, es decir permite medir la fragmentación a nivel micro de los espacios abiertos dentro y alrededor de la ciudad.'
            },
            {
                values: [[1990,0.501846628495], [2000,0.407905606772], [2010,0.314881183383]],
                name: "Fragmentación de Apertura",
                id: "openness",
                desc: 'El <strong>Indicador de Fragmentación de Apertura</strong> mide la proporción de espacio abierto en un círculo de 1km2 medido alrededor de cada pixel construido. El radio de este círculo (586 metros) corresponde con la distancia a cubrir en una caminata recreativa de 10 minutos. El Índice de Fragmentación de Apertura es un indicador de la cantidad de espacio abierto a una distancia caminable para las distintas partes de la ciudad, es decir mide la cantidad de espacio abierto en cada barrio. En síntesis, este indicador mide el promedio de los espacios abiertos (no construidos) en un área de 1 km2.'
            }
        ]

        var rScale = d3.scale.linear()
            .domain([0, 1])
            .range([0, 15]);

        var index = data.filter(function(d) { return d.id == attrs.chart })[0];

        var g = svg.append("g")
            .attr("class","index " + index['id']);

        var circles = g.selectAll("circle")
            .data(index.values)
            .enter()
            .append("circle");

        var text = g.selectAll("text")
            .data(index['values'])
            .enter()
            .append("text");

        circles
            .attr("cx", function(d, i) { return xScale(d[0]); })
            .attr("cy", 20)
            .attr("r", function(d) { return rScale(d[1]); });


        text
            .attr("y", 45)
            .attr("x",function(d, i) { return xScale(d[0]); })
            .attr("class","value")
            .attr("text-anchor", "middle")
            .text(function(d){ return d[1].toFixed(2); });
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
                        return "tiles/" + city.dirname + "/" + options.type + "/" + scope.selection[options.name].moment + "/" + zoom + "/" + coord.x + "/" + y + ".png";
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
controllers.controller('AppController', ['$scope',  'TileLayer', '$http', function($scope,  TileLayer, $http) {
    $scope.selection = {
        urbanArea: {
            visible: true,
            moment: "t0"
        },
        urbanFootprint: {
            visible: true,
            moment: "t0"
        },
        newDevelopment: {
            visible: true,
            moment: "t0_t1"
        },
        zoning: {
            visible: false
        }
    }

    $scope.controlsVisible = true;
    $scope.chartVisible  = false;
    $scope.chartWindowVisible  = true;
    $scope.introChart = true;
    $scope.edgeChartVisible = false;
    $scope.opennessChartVisible = false;
    $scope.mapTypeId = 'satellite';
    $scope.features = [];

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

    $scope.zoning = {
        name: "zoning",
        type: "zoning",
        opacity: 0.5,
        zIndex: 3
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

    $scope.loadCityData = function() {
        $http.get("/data/cities.csv").success(function(data) {
            $scope.cities = $.csv.toObjects(data);
        })
    }

    $scope.loadCity = function(cityId) {
        var city = findCityById(cityId);
        $scope.selection.city = city;
        addLayer($scope.urbanFootprint);
        addLayer($scope.urbanArea);
        addLayer($scope.newDevelopment);
        addGeoJsonLayer($scope.zoning);
        var sw = city.boundsSW.split(","),
            ne = city.boundsNE.split(",");
        $scope.panTo(parseFloat(sw[0]),parseFloat(sw[1]),parseFloat(ne[0]),parseFloat(ne[1]));
    }

    function findCityById(cityId) {
        var find = $scope.cities.filter(function (city) { return city.id == cityId });
        return find.length > 0 ? find[0] : null;
    }

    function removeLayer(layer) {
        $scope.map.overlayMapTypes.removeAt(layer.zIndex, layer.layer);
    }

    function addLayer(layer) {
        layer.layer = TileLayer.create($scope, $scope.selection.city, layer);
        $scope.map.overlayMapTypes.insertAt(layer.zIndex, layer.layer);
    }

    var colors = d3.scale.category20();

    function addGeoJsonLayer(layer) {

        $http.get('/zoning/' + $scope.selection.city.dirname + '.json').success(function(data) {
            var geoJSON = new GeoJSON(data, {
                "strokeOpacity": layer.opacity,
                "strokeWeight": 1,
                "fillColor": "#000000",
                "strokeColor": "#000000",
                "fillOpacity": layer.opacity,
                "visible" : false
            });

            if (!geoJSON.error) {
                var polygons = [];
                for (var i=0; i<geoJSON.length; i++) {
                    var feature = geoJSON[i];
                    feature.fillColor = colors(feature.geojsonProperties.ZONIF);
                    feature.strokeColor = colors(feature.geojsonProperties.ZONIF);
                    polygons.push(feature);
                    google.maps.event.addListener(feature, "mousemove", function(event) {
                        $("#currentZoning").text(this.geojsonProperties.ZONIF);
                    });
                    google.maps.event.addListener(feature, "mouseout", function(event) {
                        $("#currentZoning").text("-");
                    });
                    feature.setMap($scope.map);
                }
                $scope.features = polygons;
                console.log("Loaded " + i + " polygons for " + $scope.selection.city);
            }

            $scope.$watch('zoning.opacity', function(oldValue, newValue) {
                if ($scope.map) {
                    for (var i=0; i<$scope.features.length; i++) {
                        $scope.features[i].setOptions({
                            fillOpacity: newValue,
                            strokeOpacity: newValue
                        })
                    }
                }
            })
        })
    }

    $scope.toggleZoningLayerVisibility = function() {
        // Turn off/on all other layers
        var visible = !$scope.selection.zoning.visible;
        setLayerVisibility($scope.urbanArea, visible);
        setLayerVisibility($scope.urbanFootprint, visible);
        setLayerVisibility($scope.newDevelopment, visible);

        for (var i=0; i<$scope.features.length; i++) {
            $scope.features[i].setOptions({
                visible: $scope.selection.zoning.visible
            })
        }
        $scope.$apply();
    }

    function setLayerVisibility(layer, visible) {
        if (!visible) {
            $scope.selection[layer.name]._visible = $scope.selection[layer.name].visible;
        }
        visible = visible && $scope.selection[layer.name]._visible;
        layer.layer.setOpacity(visible ? layer.opacity : 0);
        $scope.selection[layer.name].visible = visible;
        visible ? $("#"+layer.name+"Check").checkbox('check') : $("#"+layer.name+"Check").checkbox('uncheck');
        visible ? $("#"+layer.name+"Slider").slider('enable') : $("#"+layer.name+"Slider").slider('disable');
    }

    $scope.toggleControlsVisibility = function() {
        $scope.controlsVisible = !$scope.controlsVisible;
    }

    $scope.toggleChartVisibility = function() {
        $scope.chartWindowVisible = !$scope.chartWindowVisible;
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
        if (type == "terrain") {
            $scope.map.setOptions({
                styles: [
                    {
                        "elementType": "labels",
                        "stylers": [
                            { "visibility": "simplified" }
                        ]
                    },{
                        "featureType": "road.arterial",
                        "stylers": [
                            { "visibility": "off" }
                        ]
                    },{
                        "featureType": "road.local",
                        "stylers": [
                            { "visibility": "off" }
                        ]
                    },{
                    }
                ]
            })
        } else {
            $scope.map.setOptions({
                styles: []
            })
        }
    }
}])