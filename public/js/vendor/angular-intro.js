var ngIntroDirective = angular.module('angular-intro', []);

/**
 * TODO: Use isolate scope, but requires angular 1.2: http://plnkr.co/edit/a2c14O?p=preview
 * See: http://stackoverflow.com/q/18796023/237209
 */

ngIntroDirective.directive('ngIntroOptions', ['$timeout', '$parse', function ($timeout, $parse) {

    return {
        restrict: 'A',
        link: function(scope, element, attrs) {

            scope[attrs.ngIntroMethod] = function(step) {

                scope.introJs;

                if(typeof(step) === 'string') {
                    scope.introJs = introJs(step);
                } else {
                    scope.introJs = introJs();
                }

                scope.introJs.setOptions(scope.$eval(attrs.ngIntroOptions));

                if(attrs.ngIntroOncomplete) {
                    scope.introJs.oncomplete($parse(attrs.ngIntroOncomplete)(scope));
                }

                if(attrs.ngIntroOnexit) {
                    scope.introJs.onexit($parse(attrs.ngIntroOnexit)(scope));
                }

                if(attrs.ngIntroOnchange) {
                    scope.introJs.onchange($parse(attrs.ngIntroOnchange)(scope));
                }

                if(attrs.ngIntroOnbeforechange) {
                    scope.introJs.onbeforechange($parse(attrs.ngIntroOnbeforechange)(scope));
                }

                if(attrs.ngIntroOnafterchange) {
                    scope.introJs.onafterchange($parse(attrs.ngIntroOnafterchange)(scope));
                }

                if(typeof(step) === 'number') {
                    scope.introJs.goToStep(step).start();
                } else {
                    scope.introJs.start();
                }
            };

            if(attrs.ngIntroAutostart == 'true') {
                $timeout(function() {
                    $parse(attrs.ngIntroMethod)(scope)();
                });
            }
        }
    };
}]);
