angular.module('google.map', []).value('mapOptions',{}).directive('googleMap', ['mapOptions', '$timeout', function(mapOptions, $timeout) {
    mapOptions = mapOptions || {};

    return {
        compile: function(element, attributes) {
            var height = $(window).height() - $("#header").height();
            $(element).height(height);
            return function(scope, elem, attrs) {

                function addCityLabels() {
                    var markers = [];
                    for (var i=0; i<scope.cities.length; i++) {
                        var city = scope.cities[i];
                        var marker = new MarkerWithLabel({
                            position: city.bounds.getCenter(),
                            labelContent: city.displayName,
                            labelAnchor: google.maps.Point(50, 0),
                            labelClass: "cityLabel",
                            cityId: city.id,
                            icon: {}
                        });
                        markers.push(marker)
                        google.maps.event.addListener(marker, "click", function (e) { scope.loadCity(this.cityId); });
                    }
                    new MarkerClusterer(scope.map, markers);
                }

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
                    scope.loadCityData(addCityLabels);
                    google.maps.event.addListenerOnce(scope.map, 'idle', function(){
                        scope.startIntro();
                    });
                }

                // Late-bind to prevent compiler clobbering
                $timeout(initialize, 0, true);

                scope.panTo = function(s,w,n,e) {
                    var bounds = new google.maps.LatLngBounds(new google.maps.LatLng(s,w),new google.maps.LatLng(n,e));
                    scope.panToBounds(bounds);
                }

                scope.panToBounds = function(bounds) {
                    scope.map.fitBounds(bounds);
                }
            }
        }
    }
}]);