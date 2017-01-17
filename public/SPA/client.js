var app = angular.module('myapp', ['ngAnimate', 'ui.bootstrap', 'ngRoute']);

app.factory('usersService', ['$http', '$q', function($http, $q) {
    var usersList = [];
    var getUsers = function() {
        var deferred = $q.defer();
        $http.get('/users/getUsers').then(function(response) {
            usersList = response.data;
            deferred.resolve(usersList);
        }, function(response) {
            deferred.reject(response);
        });

        return deferred.promise;
    };

    var deleteUser = function(userId) {
        var deferred = $q.defer();
        $http.delete('/users/deleteUser/' + userId)
            .then(function (response) {
                usersList = response.data;
                deferred.resolve(usersList);
            }, function (response) {
                deferred.reject(response);
        });

        return deferred.promise;
    };

    var usersService = {};
    usersService.getUsers = getUsers;
    usersService.deleteUser = deleteUser;
    return usersService;
}]);

app.config(function ($routeProvider) {
    $routeProvider
        .when('/login', {
            templateUrl: 'login.html'
        })

        .when('/home', {
            templateUrl: 'SPA/views/home.html'
        })

        .when('/users/:operation?/:username?', {
            templateUrl: 'SPA/views/users.html',
            controller: 'usersController',
            controllerAs: 'users'
        })

        .otherwise({
            redirect: '/'
        });
});

app.controller('userDetailsCtrl', ['user', '$uibModalInstance', 'returnUrl', userDetailsCtrl]);
function userDetailsCtrl(user, $uibModalInstance, returnUrl) {
    var ctrl = this;
    ctrl.user = user;

    ctrl.ok = function() {
        $uibModalInstance.close();
        window.location = returnUrl;
    };

    ctrl.cancel = function() {
        $uibModalInstance.dismiss();
        window.location = returnUrl;
    };
}

function openModalController($uibModal, model, controller, modelParamName, templateUrl, returnUrl) {
    var resolve = {};
    resolve[modelParamName] = function() {
        return model;
    };
    resolve['returnUrl'] = function() {
        return returnUrl;
    };

    $uibModal.open({
        animation: true,
        backdrop: 'static',
        windowsClass: 'center-modal',
        size: 'sm',
        templateUrl: templateUrl,
        controller: controller,
        keyboard: false,
        controllerAs: 'ctrl',
        resolve: resolve
    });
}

app.controller('usersController', ['$routeParams', '$uibModal', 'usersService', usersController]);
function usersController($routeParams, $uibModal, usersService) {
    var ctrl = this;
    usersList = [];
    usersService.getUsers().then(
        function (users) {
            ctrl.usersList = users;
            if ($routeParams.operation && $routeParams.username) {
                for (var i=0; i < ctrl.usersList.length; i++) {
                    if (ctrl.usersList[i].username === $routeParams.username) {
                        openModalController($uibModal, ctrl.usersList[i], userDetailsCtrl, 'user', 'editUserDetails.html', '/#/users');
                        break;
                    }
                }
            }
        }, function (response) {
            ctrl.error = response.status + ' - ' + response.statusText + ": " + response.data;
        }
    );

    ctrl.deleteUser = function (user) {
        //TODO modal confirm box
        usersService.deleteUser(user._id)
            .then(function (users) {
                ctrl.usersList = users;
            }, function (response) {
                ctrl.error = response.status + ' - ' + response.statusText + ": " + response.data;
         });
    };

    ctrl.editUser = function(user) {
        window.location = "/#/users/edit/" + user.username;
    };
}
