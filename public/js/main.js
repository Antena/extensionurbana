// Atlas app
var atlasApp = angular.module('atlas', ['atlas.controllers', 'atlas.directives', 'atlas.factories', 'ui.slider', 'google.map']);

// Directives
var directives = angular.module('atlas.directives', []);

// Factories
var factories = angular.module('atlas.factories', []);

factories.factory('TileLayer', [function() {
    return {
        create: function(map, options, opacity) {
            return new google.maps.ImageMapType({
                getTileUrl: function(coord, zoom) {
                    var proj = map.getProjection();
                    var z2 = Math.pow(2, zoom);
                    var tileXSize = 256 / z2;
                    var tileYSize = 256 / z2;
                    var tileBounds = new google.maps.LatLngBounds(
                        proj.fromPointToLatLng(new google.maps.Point(coord.x * tileXSize, (coord.y + 1) * tileYSize)),
                        proj.fromPointToLatLng(new google.maps.Point((coord.x + 1) * tileXSize, coord.y * tileYSize))
                    );
                    var ymax = 1 << zoom;
                    var y = ymax - coord.y -1;
                    if (options.mapBounds.intersects(tileBounds) && (options.mapMinZoom <= zoom) && (zoom <= options.mapMaxZoom))
                        return "img/tiles/sample/urban_footprint/t0/" + zoom + "/" + coord.x + "/" + y + ".png";
                    else
                        return "http://www.maptiler.org/img/none.png";
                },
                tileSize: new google.maps.Size(256, 256),
                isPng: true,

                opacity: opacity
            });
        }
    }
}])

// Controllers
var controllers = angular.module('atlas.controllers', []);
controllers.controller('AppController', ['$scope',  'TileLayer', function($scope,  TileLayer) {
    $scope.layerOpacity = 0.5;

    $scope.$watch('layerOpacity', function(oldValue, newValue) {
        if ($scope.map) {
            $scope.map.overlayMapTypes.getAt(0).setOpacity(newValue)
        }
    })

    $scope.initLayers = function() {
        var layer = TileLayer.create($scope.map, $scope.mapOptions, $scope.layerOpacity);
        $scope.map.overlayMapTypes.insertAt(0, layer);
        $scope.layer = layer;
    }
}])