var myapp = angular.module('myapp', ['ngRoute']);

myapp.config(function ($routeProvider) {
    $routeProvider
        .when('/login', {
            templateUrl: 'login.html'
        })

        .when('/home', {
            templateUrl: 'SPA/views/home.html'
        })

        .when('/users', {
            templateUrl: 'SPA/views/users.html',
            controller: 'usersController',
            controllerAs: 'users'
        })

        .otherwise({
            templateUrl: 'SPA/views/home.html'
        });
});

myapp.controller('usersController', ['$http', usersController]);
function usersController($http) {
    var ctrl = this;
    //usersList = [];
    $http.get('/users/getUsers').then(
        function (response) {
            ctrl.usersList = response.data;
        }, function (response) {
            ctrl.error = response.status + ' - ' + response.statusText + ": " + response.data;
        });

    ctrl.deleteUser = function (user) {
        //TODO modal confirm box
        $http.delete('/users/deleteUser/' + user._id).then(
            function (response) {
                ctrl.usersList = response.data;
            }, function (response) {
                ctrl.error = response.status + ' - ' + response.statusText + ": " + response.data;
            });
    }
}
