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
}])