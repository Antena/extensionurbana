angular.module('google.map', []).value('mapOptions',{}).directive('googleMap', ['mapOptions', '$timeout', function(mapOptions, $timeout) {
    mapOptions = mapOptions || {};
    return {
        require: 'ngModel',
        compile: function(element, attributes) {
            return function(scope, elem, attrs, ngModel) {

                scope.mapOptions = {
                    mapBounds : new google.maps.LatLngBounds(new google.maps.LatLng(-33.3622363713, -66.4197717386), new google.maps.LatLng(-33.2251227271, -66.2673854768)),
                    mapMinZoom : 5,
                    mapMaxZoom : 15
                }

                function initialize() {
                    var mapOptions = {
                        zoom: parseInt(attrs.zoom),
                        center: scope.mapOptions.mapBounds.getCenter(),
                        mapTypeId: google.maps.MapTypeId.SATELLITE,
                        minZoom: scope.mapOptions.mapMinZoom,
                        maxZoom: scope.mapOptions.mapMaxZoom,
                        streetViewControl: false
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