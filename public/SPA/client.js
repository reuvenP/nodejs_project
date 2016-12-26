var myapp = angular.module('myapp', ['ngRoute']);

myapp.config(function ($routeProvider) {
    $routeProvider
        .when('/home', {
            templateUrl: 'SPA/views/home.html'
        })

        .when('/login', {
            templateUrl: 'login.html'
        })

        .otherwise({
            templateUrl: 'SPA/views/home.html'
        });
});
