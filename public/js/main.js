// Atlas app
var atlasApp = angular.module('atlas', ['atlas.controllers', 'atlas.directives', 'atlas.factories', 'ui.slider', 'google.map']);

// Directives
var directives = angular.module('atlas.directives', []);

// Factories
var factories = angular.module('atlas.factories', []);

factories.factory('TileLayer', [function() {
    return {
        create: function(scope, options) {

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
                        return "img/tiles/sample/urban_footprint/t0/" + zoom + "/" + coord.x + "/" + y + ".png";
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
    $scope.urbanFootprint = {
        name: "urbanFootprint",
        opacity: 0.5,
        zIndex: 0
    }

    $scope.urbanArea = {
        name: "urbanArea",
        opacity: 0.5,
        zIndex: 1
    }

    $scope.initLayers = function() {
        addLayer($scope.urbanFootprint);
        addLayer($scope.urbanArea);
    }

    function addLayer(layer) {
        layer.layer = TileLayer.create($scope, layer);
        $scope.map.overlayMapTypes.insertAt(layer.zIndex, layer.layer);
    }
}])