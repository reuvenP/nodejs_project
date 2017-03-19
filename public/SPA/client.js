var app = angular.module('myApp', ['ngAnimate', 'ui.bootstrap', 'ngRoute']);
$.getScript("SPA/views/editUserInit.js");

app.controller('mainCtrl', ['usersService', mainCtrl]);
function mainCtrl(usersService) {
    var vm = this;
    vm.myUser = null;

    vm.showMessage = function(message, type, title) {
        vm.message = message;
        if (type) {
            vm.messageType = 'alert-' + type;
        }
        else {
            vm.messageType = 'alert-info';
        }

        if (title) {
            vm.messageTitle = title;
        }
        else {
            delete(vm.messageTitle);
        }
    };

    vm.clearMessage = function() {
        delete(vm.message);
    };

    usersService.getUserByCookie().then(
        function successCallback(res) {
            vm.myUser = res.data;
        }, function errorCallback(res) {
            vm.myUser = null;
        }
    );
}

app.controller('loginCtrl', ['$scope', 'usersService', loginCtrl]);
function loginCtrl($scope, usersService){
    var vm = this;
    vm.main = findMainCtrl($scope);
    vm.main.clearMessage();
    $('.side-nav li').removeClass('active');

    vm.login = function() {
        var hash = CryptoJS.SHA1(vm.username + ':' + vm.password + ':' + vm.random);
        var hash_Base64 = hash.toString(CryptoJS.enc.Base64);
        usersService.login(vm.username, hash_Base64).then(
            function(res) {
                vm.main.myUser = res.data;
                gotoHome();
                vm.main.showMessage('Welcome ' + vm.main.myUser.name);
            },
            function (res) {
                vm.main.showMessage(res.data, 'danger', 'Login error');
            }
        );
    };

    vm.forgotPassword = function() {
        usersService.forgotPassword(vm.username).then(
            function(res) {
                vm.main.showMessage(res.data, 'info');
            }, function (res) {
                vm.main.showMessage(res.data, 'danger');
            }
        );
    };

    vm.signup = function() {
        usersService.openUserEditModal($scope).then(
            function (newUser) {
                newUser.isBlocked = true;
                usersService.addUser(newUser).then(
                    function () {
                        vm.main.showMessage('User created successfully, but it is blocked until the admin approves it');
                    }, function (res) {
                        vm.main.showMessage(res.data, 'danger');
                    }
                );
            }
        );
    }
}

app.controller('homeCtrl', ['$scope', '$routeParams', 'usersService', homeCtrl]);
function homeCtrl($scope, $routeParams, usersService) {
    $scope.home =  $scope.home || {};
    var vm = $scope.home;
    vm.main = findMainCtrl($scope);
    vm.main.clearMessage();

    if ($routeParams.operation === 'editUser') {
        var modal = usersService.openUserEditModal($scope, vm.main.myUser);
        modal.then(
            function(updatedUser) {
                usersService.editUser(updatedUser).then(function(res) {
                    vm.main.showMessage('User updated successfully');
                    window.location = '/#/home';
            }, function (res) {
                    vm.main.showMessage(res.data, 'danger');
                window.location = '/#/home';
            })}
        );
    }
}

app.factory('usersService', ['$http', '$q', '$uibModal', usersService]);
function usersService($http, $q, $uibModal) {
    var usersService = {};
    usersService.usersList = [];

    function refreshUsersList(newUsersList) {
        usersService.usersList.length = 0;
        for(var i = 0, len = newUsersList.length; i < len; ++i) {
            usersService.usersList[i] = newUsersList[i];
        }
    }

    function replaceUserInList(oldUser, newUser) {
        for(var i = 0, len = usersService.usersList.length; i < len; ++i) {
            if (usersService.usersList[i]._id === oldUser._id) {
                usersService.usersList[i] = newUser;
            }
        }
    }

    function deleteUserFromList(userId) {
        var newUserList = [];
        for(var i = 0, j = 0, len = usersService.usersList.length; i < len; ++i) {
            if (usersService.usersList[i]._id != userId) {
                newUserList[j++] = usersService.usersList[i];
            }
        }
        refreshUsersList(newUserList);
    }

    var refreshUsers = function () {
        var deferred = $q.defer();
        $http.get('/users/getUsers').then(function (res) {
            refreshUsersList(res.data);
            deferred.resolve();
        }, function (res) {
            deferred.reject(res);
        });

        return deferred.promise;
    };

    var deleteUser = function (userId) {
        var deferred = $q.defer();
        $http.delete('/users/deleteUser/' + userId)
            .then(function (res) {
                deleteUserFromList(userId);
                deferred.resolve(userId);
            }, function (res) {
                deferred.reject(res);
            });

        return deferred.promise;
    };

    var addUser = function(user) {
        var deferred = $q.defer();
        var req = {
            method: 'POST',
            url: '/users/addUser',
            data: { user: user }
        };
        $http(req).then(
            function (res) {
                usersService.usersList.push(res.data);
                deferred.resolve(res.data);
            }, function (res) {
                deferred.reject(res);
            }
        );

        return deferred.promise;
    };

    var editUser = function(user) {
        var deferred = $q.defer();
        var req = {
        method: 'PUT',
            url: '/users/editUser/' + user._id,
            data: { user: user }
        };
        $http(req).then(
            function (res) {
                replaceUserInList(user, res.data);
                deferred.resolve(res.data);
            }, function (res) {
                deferred.reject(res);
            }
        );

        return deferred.promise;
    };

    var login = function(username, hashedLogin) {
        var req = {
            method: 'POST',
            url: '/users/login',
            data: {username: username, hashedLogin: hashedLogin}
        };
        return $http(req);
    };

    var getUserByCookie = function() {
        var req = {
            method: 'GET',
            url: '/users/getUserByCookie'
        };
        return $http(req);
    };

    var forgotPassword = function(username) {
        var req = {
            method: 'GET',
            url: '/users/forgotPassword/' + username
        };
        return $http(req);
    };

    var openUserEditModal = function($scope, user) {
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
                user: function () {
                    return user;
                }
            }
        });
        return modal.result;
    };

    usersService.refreshUsers = refreshUsers;
    usersService.deleteUser = deleteUser;
    usersService.addUser = addUser;
    usersService.editUser = editUser;
    usersService.login = login;
    usersService.getUserByCookie = getUserByCookie;
    usersService.forgotPassword = forgotPassword;
    usersService.openUserEditModal = openUserEditModal;

    return usersService;
}

app.config(function ($routeProvider) {
    $routeProvider
        .when('/login', {
            templateUrl: 'login.html',
            controller: 'loginCtrl',
            controllerAs: 'login'
        })

        .when('/home/:operation?', {
            templateUrl: 'SPA/views/home.html',
            controller: 'homeCtrl',
            controllerAs: 'home'
        })

        .when('/users', {
            templateUrl: 'SPA/views/users.html',
            controller: 'usersController',
            controllerAs: 'users'
        })

        .when('/', {
            templateUrl: 'SPA/views/home.html',
            controller: 'homeCtrl',
            controllerAs: 'home'
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
    vm.main.clearMessage();

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

app.controller('usersController', ['$scope', 'usersService', usersController]);
function usersController($scope, usersService) {
    var vm = this;
    vm.main = findMainCtrl($scope);
    vm.usersList = usersService.usersList;
    vm.main.clearMessage();

    usersService.refreshUsers().then(
        function (res) {
            vm.main.clearMessage();
        },
        function (res) {
            vm.main.showMessage(res.status + ' - ' + res.statusText + ": " + (res.data.message || res.data.errmsg || res.data), 'danger', 'Error');
        }
    );

    vm.deleteUser = function (user) {
        //TODO modal confirm box
        usersService.deleteUser(user._id).then(
            function (res) {
                vm.main.showMessage('User deleted successfully');
            },
            function (res) {
                vm.main.showMessage(res.status + ' - ' + res.statusText + ": " + (res.data.message || res.data.errmsg || res.data), 'danger', 'Error');
            }
        );
    };

    vm.addUser = function() {
        var modal =  usersService.openUserEditModal($scope); //new user
        modal.then(function(user) {
            usersService.addUser(user).then(
                function (res) {
                    vm.main.showMessage('User added successfully');
                }, function (res) {
                    vm.main.showMessage(res.status + ' - ' + res.statusText + ": " + (res.data.message || res.data.errmsg || res.data), 'danger', 'Error');
                }
            )
        });
    };

    vm.editUser = function (user) {
        var modal = usersService.openUserEditModal($scope, angular.copy(user));
        modal.then(function(userResult) {
            usersService.editUser(userResult).then(
                function (res) {
                    vm.main.showMessage('User updated successfully');
                }, function (res) {
                    vm.main.showMessage(res.status + ' - ' + res.statusText + ": " + (res.data.message || res.data.errmsg || res.data), 'danger', 'Error');
                }
            )
        });
    };
}
