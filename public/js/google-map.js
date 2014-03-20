angular.module('google.map', []).value('mapOptions',{}).directive('googleMap', ['mapOptions', '$timeout', function(mapOptions, $timeout) {
    mapOptions = mapOptions || {};
    return {
        compile: function(element, attributes) {
            var height = $(window).height() - $("#header").height();
            $(element).height(height);
            return function(scope, elem, attrs) {

                scope.mapOptions = {
                    mapMinZoom : parseInt(attrs.minZoom),
                    mapMaxZoom : parseInt(attrs.maxZoom)
                }

                function initialize() {
                    var mapOptions = {
                        zoom: parseInt(attrs.zoom),
                        center: new google.maps.LatLng(-36.7427549,-62.4812459),
                        mapTypeId: google.maps.MapTypeId.SATELLITE,
                        minZoom: scope.mapOptions.mapMinZoom,
                        maxZoom: scope.mapOptions.mapMaxZoom,
                        streetViewControl: false,
                        panControl: false,
                        zoomControl: false,
                        mapTypeControl: false
                    };

                    scope.map = new google.maps.Map($(elem)[0], mapOptions);
                    scope.loadCityData();
                }

                // Late-bind to prevent compiler clobbering
                $timeout(initialize, 0, true);

                scope.panTo = function(s,w,n,e) {
                    var bounds = new google.maps.LatLngBounds(new google.maps.LatLng(s,w),new google.maps.LatLng(n,e));
                    scope.map.fitBounds(bounds);
                }
            }
        }
    }
}]);