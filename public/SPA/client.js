var app = angular.module('myApp', ['ngAnimate', 'ui.bootstrap', 'ngRoute']);
$.getScript("SPA/views/editUserInit.js");

app.controller('mainCtrl', ['$http', mainCtrl]);
function mainCtrl($http) {
    var ctrl = this;
    ctrl.myUser = null;
    $http({
        method: 'GET',
        url: '/users/getUserByCookie'
    }).then(function successCallback(res) {
        ctrl.myUser = res.data;
    }, function errorCallback(response) {
        ctrl.myUser = null;
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
            $scope.$parent.main.myUser = res.data;
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

app.controller('userDetailsCtrl', ['$uibModalInstance', 'editUserInit', 'user', userDetailsCtrl]);
function userDetailsCtrl($uibModalInstance, editUserInit, user) {
    var ctrl = this;
    ctrl.user = user;
    ctrl.rawPassword = "";

    $uibModalInstance.rendered.then(function () {
        editUserInit();
    });

    ctrl.ok = function () {
        if (ctrl.rawPassword) {
            var publicKey = $("#publicKey").val();
            var encrypter = new JSEncrypt();
            encrypter.setPublicKey(publicKey);
            ctrl.user.encryptedPassword = encrypter.encrypt(ctrl.rawPassword);
        }

        $uibModalInstance.close(ctrl.user);
    };

    ctrl.cancel = function () {
        $uibModalInstance.dismiss();
    };
}

app.controller('usersController', ['$routeParams', '$uibModal', '$http', '$scope', 'usersService', usersController]);
function usersController($routeParams, $uibModal, $http, $scope, usersService) {
    var ctrl = this;
    ctrl.usersList = [];
    usersService.getUsers().then(
        function (users) {
            ctrl.usersList = users;
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

    var openDetailsModal = function(user) {
        var modal = $uibModal.open({
            animation: true,
            backdrop: 'static',
            windowsClass: 'center-modal',
            size: 'md',
            templateUrl: 'SPA/views/editUser.html',
            controller: userDetailsCtrl,
            controllerAs: 'userDetails',
            bindToController: true,
            scope: $scope.$parent,
            resolve: {
                user: function () { return user; }
            }
        });
        return modal;
    };

    ctrl.addUser = function() {
        var modal = openDetailsModal({}); //new user
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

    ctrl.editUser = function (user) {
        var modal = openDetailsModal(angular.copy(user));
        modal.result.then(function(userResult) {
            var req = {
                method: 'PUT',
                url: '/users/editUser/' + user._id,
                data: { user: userResult }
            };
            $http(req).then(
                function (res) {
                    angular.copy(res.data, user);
                    delete(ctrl.error);
                }, function (res) {
                    ctrl.error = res.status + ' - ' + res.statusText + ": " + (res.data.message ? res.data.message : res.data);
                })
        });
    };
}
