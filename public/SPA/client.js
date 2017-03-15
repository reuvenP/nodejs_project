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

function findMainCtrl($scope) {
    while ($scope && (!$scope.main || $scope.main.constructor.name !== 'mainCtrl')) {
        $scope = $scope.$parent;
    }
    if ($scope) {
        return $scope.main;
    }
}

app.controller('userDetailsCtrl', ['$uibModalInstance', '$scope', 'editUserInit', 'user', userDetailsCtrl]);
function userDetailsCtrl($uibModalInstance, $scope, editUserInit, user) {
    $scope.userDetails =  $scope.userDetails || {};
    var vm = $scope.userDetails;
    vm.main = findMainCtrl($scope);
    vm.newUser = !user;
    vm.user = user || {};
    vm.rawPassword = "";

    $uibModalInstance.rendered.then(function () {
        editUserInit();
    });

    vm.ok = function () {
        if (vm.rawPassword) {
            var publicKey = $("#publicKey").val();
            var encrypter = new JSEncrypt();
            encrypter.setPublicKey(publicKey);
            vm.user.encryptedPassword = encrypter.encrypt(vm.rawPassword);
        }

        $uibModalInstance.close(vm.user);
    };

    vm.cancel = function () {
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
            scope: $scope,
            resolve: {
                user: function () { return user; }
            }
        });
        return modal;
    };

    ctrl.addUser = function() {
        var modal = openDetailsModal(); //new user
        modal.result.then(function(user) {
            var req = {
                method: 'POST',
                url: '/users/addUser',
                data: { user: user }
            };
            $http(req).then(function (res) {
                delete(ctrl.error);
                ctrl.usersList.push(res.data);
            }, function (res) {
                ctrl.error = res.status + ' - ' + res.statusText + ": " + (res.data.message || res.data.errmsg || res.data);
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
                    angular.extend(user, res.data);
                    delete(ctrl.error);
                }, function (res) {
                    ctrl.error = res.status + ' - ' + res.statusText + ": " + (res.data.message || res.data.errmsg || res.data);
                })
        });
    };
}
