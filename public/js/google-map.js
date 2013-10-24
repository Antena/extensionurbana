angular.module('google.map', []).value('mapOptions',{}).directive('googleMap', ['mapOptions', '$timeout', function(mapOptions, $timeout) {
    mapOptions = mapOptions || {};
    return {
        compile: function(element, attributes) {
            var height = $(window).height() - $("#header").height();
            $(element).height(height);
            return function(scope, elem, attrs) {

                scope.mapOptions = {
                    mapBounds : new google.maps.LatLngBounds(new google.maps.LatLng(-33.3622363713, -66.4197717386), new google.maps.LatLng(-33.2251227271, -66.2673854768)),
                    mapMinZoom : parseInt(attrs.minZoom),
                    mapMaxZoom : parseInt(attrs.maxZoom)
                }

                function initialize() {
                    var mapOptions = {
                        zoom: parseInt(attrs.zoom),
                        center: scope.mapOptions.mapBounds.getCenter(),
                        mapTypeId: google.maps.MapTypeId.SATELLITE,
                        minZoom: scope.mapOptions.mapMinZoom,
                        maxZoom: scope.mapOptions.mapMaxZoom,
                        streetViewControl: false,
                        panControl: false,
                        zoomControl: false,
                        mapTypeControl: false
                    };

                    scope.map = new google.maps.Map($(elem)[0], mapOptions);
                    scope.initLayers();
                }

                // Late-bind to prevent compiler clobbering
                $timeout(initialize, 0, true);
            }
        }
    }
}]);