// Atlas app
var atlasApp = angular.module('atlas', ['atlas.controllers', 'atlas.directives', 'ui.slider', 'google.map']);

// Controllers
var controllers = angular.module('atlas.controllers', []);

controllers.controller('AppController', ['$scope', function($scope) {
//    console.log($scope.map);        //TODO(gb): Remove trace!!!
}])

controllers.controller('MapController', ['$scope', function($scope) {

}])

controllers.controller('LayerController', ['$scope', function($scope) {
    $scope.urbanFootprintOpacity = 0.5;

}])

// Directives
var directives = angular.module('atlas.directives', []);