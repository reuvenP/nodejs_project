var myapp = angular.module('myapp', ['ngRoute']);

myapp.config(function ($routeProvider) {
    $routeProvider
        .when('/home', {
            templateUrl: 'SPA/views/home.html'
        });

        // .when('/branches', {
        //     templateUrl: 'SPA/views/branches.html',
        //     controller  : 'branchesController',
        //     controllerAs : 'branches'
        // })
});
