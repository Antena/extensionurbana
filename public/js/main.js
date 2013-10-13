var mapBounds = new google.maps.LatLngBounds(new google.maps.LatLng(-33.3622363713, -66.4197717386), new google.maps.LatLng(-33.2251227271, -66.2673854768));
var mapMinZoom = 5;
var mapMaxZoom = 15;

var map;
function initialize() {
    var mapOptions = {
        zoom: 12,
        center: mapBounds.getCenter(),
        mapTypeId: google.maps.MapTypeId.SATELLITE
    };
    map = new google.maps.Map(document.getElementById('map-canvas'),
        mapOptions);
}

google.maps.event.addDomListener(window, 'load', initialize);