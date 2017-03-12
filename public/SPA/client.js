var app = angular.module('myApp', ['ngAnimate', 'ui.bootstrap', 'ngRoute']);
$.getScript("SPA/views/editUserInit.js");

app.controller('mainCtrl', ['$http', mainCtrl]);
function mainCtrl($http) {
    var ctrl = this;
    ctrl.user = null;
    $http({
        method: 'GET',
        url: '/users/getUserByCookie'
    }).then(function successCallback(res) {
        ctrl.user = res.data;
    }, function errorCallback(response) {
        ctrl.user = null;
    });
}

app.controller('loginCtrl', ['$http', '$scope', loginCtrl]);
function loginCtrl($http, $scope){
    var ctrl = this;
    $('.side-nav li').removeClass('active');

    ctrl.login = function() {
        var hash = CryptoJS.SHA1(ctrl.username + ':' + ctrl.password + ':' + ctrl.random);
        var hash_Base64 = hash.toString(CryptoJS.enc.Base64);
        var req = {
            method: 'POST',
            url: '/users/login',
            data: {username: ctrl.username, hashedLogin: hash_Base64}
        };
        $http(req).then(function(res) {
            ctrl.loginError = null;
            $scope.$parent.main.user = res.data;
            gotoHome();
        },
        function (res) {
            ctrl.loginError = res.data;
        });
    };
}

app.factory('usersService', ['$http', '$q', function ($http, $q) {
    var usersList = [];
    var getUsers = function () {
        var deferred = $q.defer();
        $http.get('/users/getUsers').then(function (response) {
            usersList = response.data;
            deferred.resolve(usersList);
        }, function (response) {
            deferred.reject(response);
        });

        return deferred.promise;
    };

    var deleteUser = function (userId) {
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
            templateUrl: 'login.html',
            controller: 'loginCtrl',
            controllerAs: 'login'
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

app.controller('editUserCtrl', ['$uibModalInstance', 'editUserInit', 'user', 'returnUrl', editUserCtrl]);
function editUserCtrl($uibModalInstance, editUserInit, user, returnUrl) {
    var ctrl = this;
    ctrl.user = user;

    $uibModalInstance.rendered.then(function () {
        editUserInit();
    });

    $uibModalInstance.closed.then(function () {
        window.location = returnUrl;
    });

    ctrl.ok = function () {
        $uibModalInstance.close();
    };

    ctrl.cancel = function () {
        $uibModalInstance.dismiss();
    };
}

app.controller('userDetailsCtrl', ['$uibModalInstance', 'editUserInit', 'user', userDetailsCtrl]);
function userDetailsCtrl($uibModalInstance, editUserInit, user) {
    var ctrl = this;
    ctrl.user = user;

    $uibModalInstance.rendered.then(function () {
        editUserInit();
    });

    ctrl.ok = function () {
        $uibModalInstance.close(ctrl.user);
    };

    ctrl.cancel = function () {
        $uibModalInstance.dismiss();
    };
}

app.controller('usersController', ['$routeParams', '$uibModal', '$http', 'usersService', usersController]);
function usersController($routeParams, $uibModal, $http, usersService) {
    var ctrl = this;
    usersList = [];
    usersService.getUsers().then(
        function (users) {
            ctrl.usersList = users;
            if ($routeParams.operation && $routeParams.username) {
                for (var i = 0; i < ctrl.usersList.length; i++) {
                    if (ctrl.usersList[i].username === $routeParams.username) {
                        $uibModal.open({
                            animation: true,
                            backdrop: 'static',
                            windowsClass: 'center-modal',
                            size: 'md',
                            templateUrl: 'SPA/views/editUser.html',
                            controller: editUserCtrl,
                            controllerAs: 'ctrl',
                            resolve: {
                                user: function () {
                                    return ctrl.usersList[i];
                                },
                                returnUrl: function () {
                                    return '/#/users';
                                }
                            }
                        });
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

    ctrl.editUser = function (user) {
        window.location = "/#/users/edit/" + user.username;
    };

    ctrl.addUser = function() {
        var modal = $uibModal.open({
            animation: true,
            backdrop: 'static',
            windowsClass: 'center-modal',
            size: 'md',
            templateUrl: 'SPA/views/editUser.html',
            controller: userDetailsCtrl,
            controllerAs: 'userDetails',
            resolve: {
                user: function () { return {}; }
            }
        });
        modal.result.then(function(user) {
            var req = {
                method: 'POST',
                url: '/users/addUser',
                data: { user: user }
            };
            $http(req).then(
                function (res) {
                    usersService.getUsers().then(function (users) {
                        ctrl.usersList = users;
                    })
                }, function (res) {
                    ctrl.error = res.status + ' - ' + res.statusText + ": " + res.data.message;
            })
        });
    };
}
