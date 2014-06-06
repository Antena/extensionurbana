// Atlas app
var atlasApp = angular.module('atlas', [
    'atlas.controllers',
    'atlas.directives',
    'atlas.factories',
    'atlas.vis',
    'ui.slider',
    'google.map',
    'angular-intro',
    'atlas.sidebar'
]);

atlasApp.config(['$httpProvider', '$routeProvider', '$locationProvider', function($httpProvider, $routeProvider, $locationProvider) {
    //stuff to allow s3 json loading (CORS)
    $httpProvider.defaults.useXDomain = true;
    //delete $httpProvider.defaults.headers.common['X-Requested-With'];
    $routeProvider
        .when('/', {
            templateUrl: '/views/home.html'
        })
        .when('/atributos', {
            templateUrl: '/views/atributos.html'
        })
        .when('/metricas1', {
            templateUrl: '/views/metricas1.html'
        })
        .when('/metricas2', {
            templateUrl: '/views/metricas2.html'
        })
        .when('/bibliografia', {
            templateUrl: '/views/bibliografia.html'
        })
        .when('/contacto', {
            templateUrl: '/views/contacto.html'
        })
        .otherwise({
            redirectTo: '/'
        });
    }
]);

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
            province: parts[2],
            displayName:parts[3]
        }
    }

    function normalizeCityName(s){

        var translate_re = /[áéíóúñ]/g;
        var translate = {
            "á": "a", "í": "i", "ú": "u",
            "ó": "o", "é": "e"   // probably more to come
        };

        return ( s.replace(translate_re, function(match) {
            return translate[match];
        }) );
    }



    return function(scope, element, attrs) {
        $http.get("/data/cities.csv").success(function(data) {
            // Build data source
            var cities = [];
            $.each($.csv.toObjects(data), function(idx, city){
                cities.push(city.id+"#"+city.name+"#"+city.province+"#"+city.displayName);
            })

            $(element).typeahead({
                source: cities,
                updater: function(item) {
                    var city = parseCity(item);
                    scope.loadCity(city.id);
                    return city.displayName;
                },
                matcher: function(item) {
                    var city = parseCity(item);

                    var normalizedQuery= normalizeCityName(this.query.toLowerCase());
                    var normalizedCityName = normalizeCityName(city.displayName.toLowerCase());
                    var normalizedProvince = normalizeCityName(city.province.toLowerCase());
                    return normalizedCityName.indexOf(normalizedQuery) >= 0 || normalizedProvince.indexOf(normalizedQuery) >= 0;
                },
                highlighter: function(item) {
                    var city = parseCity(item);
                    return city.displayName;
                }
            })
        })

    }
}])

// Factories
var factories = angular.module('atlas.factories', []);

factories.factory('TileLayer', [function() {
    return {
        create: function(scope, city, options) {
            var layerOpacity = options.visible ? options.opacity : 0;
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
                    //aca deberían ir los bound  de la ciudad que estas
                    if (scope.currentBound.intersects(tileBounds) && (scope.mapOptions.mapMinZoom <= zoom) && (zoom <= scope.mapOptions.mapMaxZoom))
                        return "https://s3-sa-east-1.amazonaws.com/cipuv/tiles/" + city.dirname + "/" + options.type + "/" + scope.selection[options.name].moment + "/" + zoom + "/" + coord.x + "/" + y + ".png";
                    else
                        return "http://www.maptiler.org/img/none.png";
                },
                tileSize: new google.maps.Size(256, 256),
                isPng: true,
                opacity: layerOpacity
            });

            scope.$watch(options.name + '.opacity', function(oldValue, newValue) {
                if (scope.map) {
                    var opacity = options.visible ? newValue : 0;
                    scope.map.overlayMapTypes.getAt(options.zIndex).setOpacity(opacity)
                }
            })

            return layer;
        }
    }
}])

// Controllers
var controllers = angular.module('atlas.controllers', []);
controllers.controller('AppController', ['$scope',  'TileLayer', '$http', '$location', function($scope,  TileLayer, $http, $location) {
    $scope.location = $location;
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
        layer.visible = $scope.selection[layer.name].visible !== false;
        layer.layer.setOpacity(layer.visible ? $scope[layer.name].opacity : 0);
        $scope.$apply();
    }

    $scope.setLayerMoment = function(layer, moment) {
        removeLayer(layer);
        $scope.selection[layer.name].moment = moment;
        addLayer($scope[layer.name]);
    }

    $scope.loadCityData = function(callback) {
        $http.get("/data/cities.csv").success(function(data) {
            $scope.cities = $.csv.toObjects(data);

            // Process city data
            $scope.cities.map(function(city) {
                var sw = city.boundsSW.split(","),
                    ne = city.boundsNE.split(","),
                    swCorner = new google.maps.LatLng(sw[0],sw[1]),
                    neCorner = new google.maps.LatLng(ne[0],ne[1]);
                city.bounds = new google.maps.LatLngBounds(swCorner,neCorner);
            })

            if (callback) callback.call();
        })
    }

    $scope.loadCity = function(cityId) {
        var city = findCityById(cityId);
        $scope.selection.city = city;

        // Remove older layers and add new ones
        if ($scope.urbanArea.layer) removeLayer($scope.urbanArea)
        addLayer($scope.urbanArea);
        if ($scope.urbanFootprint.layer) removeLayer($scope.urbanFootprint)
        addLayer($scope.urbanFootprint);
        if ($scope.newDevelopment.layer) removeLayer($scope.newDevelopment)
        addLayer($scope.newDevelopment);
        addGeoJsonLayer($scope.zoning);
//        $scope.updateVis(city);

        var sw = city.boundsSW.split(","),
            ne = city.boundsNE.split(",");

        var myLatlng = new google.maps.LatLng(sw[0],sw[1]);
        var myLatlngTwo = new google.maps.LatLng(ne[0],ne[1]);

        var tileBounds = new google.maps.LatLngBounds(
            myLatlng,
            myLatlngTwo
        );

        $scope.currentBound = tileBounds;

        $scope.panTo(parseFloat(sw[0]),parseFloat(sw[1]),parseFloat(ne[0]),parseFloat(ne[1]));
        $scope.slideHide();
        $scope.$apply();
    }

    $scope.resetSelection = function() {
        $scope.selection.city = null;
        if ($scope.newDevelopment.layer) removeLayer($scope.newDevelopment)
        $scope.newDevelopment.layer = null;
        $scope.newDevelopment.visible = false;
        if ($scope.urbanFootprint.layer) removeLayer($scope.urbanFootprint)
        $scope.urbanFootprint.layer = null;
        $scope.urbanFootprint.visible = false;
        if ($scope.urbanArea.layer) removeLayer($scope.urbanArea)
        $scope.urbanArea.layer = null;
        $scope.urbanArea.visible = false;
        $scope.$apply();
    }

    function findCityById(cityId) {
        var find = $scope.cities.filter(function (city) { return city.id == cityId });
        return find.length > 0 ? find[0] : null;
    }

    function removeLayer(layer) {
        $scope.map.overlayMapTypes.removeAt(layer.zIndex, layer.layer);
    }

    function addLayer(layer) {
        layer.visible = $scope.selection[layer.name].visible !== false;
        layer.layer = TileLayer.create($scope, $scope.selection.city, layer);
        $scope.map.overlayMapTypes.insertAt(layer.zIndex, layer.layer);
    }

    var colors = d3.scale.category20();

    function addGeoJsonLayer(layer) {

        if (!$scope.features[$scope.selection.city.dirname]) {

            var zoningUrl = "https://s3-sa-east-1.amazonaws.com/cipuv/zoning/" + $scope.selection.city.dirname + '/' + $scope.selection.city.name + '.json';

            $http.get(zoningUrl).success(function(data) {
                var geoJSON = new GeoJSON(data, {
                    "strokeOpacity": layer.opacity,
                    "strokeWeight": 1,
                    "fillColor": "#000000",
                    "strokeColor": "#000000",
                    "fillOpacity": layer.opacity,
                    "visible" : $scope.selection.zoning.visible
                });

                if (!geoJSON.error) {
                    var polygons = [];
                    for (var i=0; i<geoJSON.length; i++) {
                        var feature = geoJSON[i];
                        if(feature==null)
                            console.log('null feature');
                        if(feature!=null && feature.geojsonProperties){
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

                    }
                    $scope.features[$scope.selection.city.dirname] = polygons;
                }

                $scope.$watch('zoning.opacity', function(oldValue, newValue) {
                    if ($scope.map) {
                        for (var i=0; i<$scope.features[$scope.selection.city.dirname].length; i++) {
                            $scope.features[$scope.selection.city.dirname][i].setOptions({
                                fillOpacity: newValue,
                                strokeOpacity: newValue
                            })
                        }
                    }
                })
            })
        } else {

            for (var i=0; i<$scope.features[$scope.selection.city.dirname].length; i++) {
                $scope.features[$scope.selection.city.dirname][i].setOptions({
                    visible: $scope.selection.zoning.visible,
                    fillOpacity: layer.opacity,
                    strokeOpacity: layer.opacity
                })
            }
        }
    }

    $scope.toggleZoningLayerVisibility = function() {
        if($scope.selection.city.zoning=="False"){
            return
        }
        // Turn off/on all other layers
        var visible = !$scope.selection.zoning.visible;
        setLayerVisibility($scope.urbanArea, visible);
        setLayerVisibility($scope.urbanFootprint, visible);
        setLayerVisibility($scope.newDevelopment, visible);

        for (var i=0; i<$scope.features[$scope.selection.city.dirname].length; i++) {
            $scope.features[$scope.selection.city.dirname][i].setOptions({
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

    $scope.resetMap = function() {
        $scope.map.setZoom(5);
        $scope.map.setCenter(new google.maps.LatLng(-36.7427549,-62.4812459));
    }

    $scope.page = 1;
    $scope.setPage = function(page) {
        if (page < 1) page = 1;
        if (page > 6) page = 6;
        $scope.page = page;
    }

    // Intro.js
    $scope.introStep = 0;
    $scope.shouldResetSelection = false;
    $scope.IntroOptions = {
        steps:[
            {
                element: document.querySelector('#step1'),
                intro: "Busque municipios por nombre o provincia."
            },
            {
                intro: "" +
                    "<div class='text-center'>" +
                    "<img src='http://google-maps-utility-library-v3.googlecode.com/svn/trunk/markerclusterer/images/m1.png' />" +
                    "<img src='http://google-maps-utility-library-v3.googlecode.com/svn/trunk/markerclusterer/images/m2.png' />" +
                    "</div>" +
                    "Los municipios se agrupan en clústeres. Haga click para acercar el mapa al clúster deseado.",
                position: 'right'
            },
            {
                element: document.querySelector(".cityLabel"),
                intro: "" +
                    "<div class='text-center'>" +
                    "<img src='/images/city-label.png' />" +
                    "</div>" +
                    "Haga click en la etiqueta de un municipio para ver las imágenes satelitales e información de zonificación."
            },
            {
                element: document.querySelector('#controls'),
                intro: "" +
                    "<div class='text-center'>" +
                    "<img src='/images/controls-check.png' />" +
                    "</div>" +
                    "Active o desactive las capas individualmente" +
                    "<div class='text-center'>" +
                    "<img src='/images/controls-years.png' />" +
                    "</div>" +
                    "Seleccione el año de las imágenes satelitales." +
                    "<div class='text-center'>" +
                    "<img src='/images/controls-slider.png' />" +
                    "</div>" +
                    "Controle la opacidad de cada capa.",
                position: "left"
            },
            {
                element: document.querySelector("#data .alert"),
                intro: "Analice los índices de fragmentación",
                position: "right"
            }
        ],
        showStepNumbers: false,
        exitOnOverlayClick: true,
        exitOnEsc:true,
        nextLabel: 'Siguiente',
        prevLabel: 'Anterior',
        skipLabel: 'Saltear',
        doneLabel: '<strong>Comenzar</strong>'
    };

    $scope.BeforeChangeEvent = function(e, f) {
        ++$scope.introStep;
        if ($scope.introStep == 4 && !$scope.selection.city) {
            $scope.shouldResetSelection = true;
            $scope.loadCity("1");
        }
    };

    $scope.CompletedEvent = function() {
        if ($scope.introStep == $scope.IntroOptions.steps.length) {
            $scope.introStep = 0;
            $scope.introJs.exit();
            if ($scope.shouldResetSelection) {
                $scope.shouldResetSelection = false;
                $scope.resetAll();
            }
        }
    }

    $scope.resetAll = function() {
        $scope.resetSelection();
        $scope.resetMap();
    }

    $scope.ExitEvent = function() {
        $scope.introStep = 0;
        $scope.shouldResetSelection = false;
    }
}])