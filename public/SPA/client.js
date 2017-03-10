var app = angular.module('myapp', ['ngAnimate', 'ui.bootstrap', 'ngRoute']);
$.getScript("SPA/views/editUserInit.js");

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

// app.factory('userDetailsInit', [function () {
//     var init = function () {
//         $('#contact_form').bootstrapValidator({
//             // To use feedback icons, ensure that you use Bootstrap v3.1.0 or later
//             feedbackIcons: {
//                 valid: 'glyphicon glyphicon-ok',
//                 invalid: 'glyphicon glyphicon-remove',
//                 validating: 'glyphicon glyphicon-refresh'
//             },
//             fields: {
//                 first_name: {
//                     validators: {
//                         stringLength: {
//                             min: 2,
//                         },
//                         notEmpty: {
//                             message: 'Please supply your first name'
//                         }
//                     }
//                 },
//                 last_name: {
//                     validators: {
//                         stringLength: {
//                             min: 2,
//                         },
//                         notEmpty: {
//                             message: 'Please supply your last name'
//                         }
//                     }
//                 },
//                 email: {
//                     validators: {
//                         notEmpty: {
//                             message: 'Please supply your email address'
//                         },
//                         emailAddress: {
//                             message: 'Please supply a valid email address'
//                         }
//                     }
//                 },
//                 phone: {
//                     validators: {
//                         notEmpty: {
//                             message: 'Please supply your phone number'
//                         },
//                         phone: {
//                             country: 'US',
//                             message: 'Please supply a vaild phone number with area code'
//                         }
//                     }
//                 },
//                 address: {
//                     validators: {
//                         stringLength: {
//                             min: 8,
//                         },
//                         notEmpty: {
//                             message: 'Please supply your street address'
//                         }
//                     }
//                 },
//                 state: {
//                     validators: {
//                         stringLength: {
//                             min: 4,
//                         },
//                         notEmpty: {
//                             message: 'Please supply your city'
//                         }
//                     }
//                 },
//                 city: {
//                     validators: {
//                         notEmpty: {
//                             message: 'Please select your state'
//                         }
//                     }
//                 },
//                 comment: {
//                     validators: {
//                         stringLength: {
//                             min: 10,
//                             max: 200,
//                             message: 'Please enter at least 10 characters and no more than 200'
//                         },
//                         notEmpty: {
//                             message: 'Please supply a description of your project'
//                         }
//                     }
//                 }
//             }
//         }).on('success.form.bv', function (e) {
//             $('#success_message').slideDown({opacity: "show"}, "slow") // Do something ...
//             $('#contact_form').data('bootstrapValidator').resetForm();
//
//             // Prevent form submission
//             e.preventDefault();
//
//             // Get the form instance
//             var $form = $(e.target);
//
//             // Get the BootstrapValidator instance
//             var bv = $form.data('bootstrapValidator');
//
//             // Use Ajax to submit form data
//             $.post($form.attr('action'), $form.serialize(), function (result) {
//                 console.log(result);
//             }, 'json');
//         });
//     };
//     return init;
// }]);

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

app.controller('usersController', ['$routeParams', '$uibModal', 'usersService', usersController]);
function usersController($routeParams, $uibModal, usersService) {
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
}
