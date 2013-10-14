angular.module('google.map', []).value('mapOptions',{}).directive('googleMap', ['mapOptions', '$timeout', function(mapOptions, $timeout) {
    mapOptions = mapOptions || {};
    return {
        require: 'ngModel',
        compile: function(element, attributes) {
            return function(scope, elem, attrs, ngModel) {


                var mapBounds = new google.maps.LatLngBounds(new google.maps.LatLng(-33.3622363713, -66.4197717386), new google.maps.LatLng(-33.2251227271, -66.2673854768));
                var mapMinZoom = 5;
                var mapMaxZoom = 15;

                var map;
                var maptiler = new google.maps.ImageMapType({
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
                        if (mapBounds.intersects(tileBounds) && (mapMinZoom <= zoom) && (zoom <= mapMaxZoom))
                            return "img/tiles/sample/urban_footprint/t0/" + zoom + "/" + coord.x + "/" + y + ".png";
                        else
                            return "http://www.maptiler.org/img/none.png";
                    },
                    tileSize: new google.maps.Size(256, 256),
                    isPng: true,

                    opacity: 0.5
                })

                function initialize() {

                    var mapOptions = {
                        zoom: 12,
                        center: mapBounds.getCenter(),
                        mapTypeId: google.maps.MapTypeId.SATELLITE,
                        minZoom: mapMinZoom,
                        maxZoom: mapMaxZoom,
                        streetViewControl: false
                    };
                    map = new google.maps.Map($(elem)[0], mapOptions);
                    map.overlayMapTypes.insertAt(0, maptiler);
                }

                // Late-bind to prevent compiler clobbering
                $timeout(initialize, 0, true);
            }
        }
    }
}]);