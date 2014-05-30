angular.module('atlas.sidebar', [])
    .directive('sidebar', ['$location', function($location) {
        return function(scope, element, attrs) {
            var sidebarHeight = $(window).height() - $("#header").height();
            $(element)
                .height(sidebarHeight)
                .css("max-height", sidebarHeight)
                .css("top", $("#header").height())

            scope.slideVisible = false;

            setTimeout(function() {
                scope.slideShow();
            }, 1000)

            scope.slideShow = function() {
                $(element).animate({
                    left: "0px"
                }, function() {
                    scope.slideVisible = true;
                    scope.$apply();
                })
            }

            scope.slideHide = function() {
                $(element).animate({
                    left: -$(element)[0].clientWidth + 18
                }, function() {
                    scope.slideVisible = false;
                    scope.$apply();
                })
            }

            scope.slideToggle = function() {
                if (scope.slideVisible) {
                    scope.slideHide()
                } else {
                    scope.slideShow();
                }
            }

            scope.openSlide = function(path) {
                $location.path(path);
                scope.slideShow();
            }
        }
    }])