var express = require('express');
var rsa = require('../rsa');
var email = require('../email');
var router = express.Router();
var users = require('../users_manage');
var debug = require('debug')('nodejs-project:users');

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

router.post('/login', function (req, res, next) {
    users.authenticator(req, res, next);
});

router.get('/logout', function (req, res, next) {
    debug('logging out');
    req.logout();
    req.session.regenerate(function (err) {
        debug('logged out');
        res.redirect('/');
    });
});

router.get('/getUserByCookie', function(req, res,next) {
    if (!req.user) {
        return res.status(401).send('Not logged-in');
    }
    return res.json(req.user);
});

router.get('/getUsers', function (req, res, next) {
    if (!req.user) {
        return res.status(401).send('You must login first to view the neighbours');
    }

    users.getUsers(!req.user.isAdmin, function (error, users) {
        if (error) {
            return res.status(500).send(error);
        }

        res.json(users);
    });
});

router.get('/getUser/:userId', function (req, res, next) {
    users.getUserById(req.params.userId, function (error, user) {
        if (error) {
            return res.status(500).send(error);
        }
        delete(user._doc.password);
        delete(user._doc.recoveryNumber);
        res.json(user);
    });
});

function checkLoggedIn(req, res, next) {
    if (!req.user) {
        return res.status(401).send('You must login first');
    }
    next();
}

function checkAdmin(req, res, next) {
    if (!req.user || !req.user.isAdmin) {
        return res.status(401).send('You must login as admin for that operation');
    }
    next();
}

function checkAdminOrSelfOperation(req, res, next) {
    if (!req.user.isAdmin && req.user._id != req.params.userId) {
        return res.status(401).send('You cannot do this operation on other users');
    }
    next();
}

function decryptPassword(encryptedPassword) {
    if (encryptedPassword) {
        var buffer = Buffer.from(encryptedPassword, "base64");
        var decryptedPassword = rsa.decrypt(buffer);
        var password = decryptedPassword.toString();
        return password;
    }
}

router.put('/editUser/:userId', checkLoggedIn, checkAdminOrSelfOperation, validateUser, function (req, res, next) {
    var user = req.body.user;
    delete(user.isDeleted);
    delete(user.password);
    delete(user.recoveryNumber);

    if (user.encryptedPassword) {
        var password = decryptPassword(user.encryptedPassword);
        if (!password) {
            return res.status(401).send("Password cannot be empty!!!");
        }
        user.password = password;
    }

    if (!req.user.isAdmin) {
        delete(user.isAdmin);
        delete(user.isBlocked);
    }
    users.editUser(user, function(error, newUser) {
        if (error) {
           return res.status(500).send(error);
        }
        delete(newUser._doc.password);
        delete(newUser._doc.recoveryNumber);
        return res.json(newUser);
    });
});


function checkDeletePermission(req, res, next) {
    if (!req.user || !req.user.isAdmin){
        return res.status(401).send('Must login with active admin account for deleting users');
    }
    if (req.user._id == req.params.userId) {
         return res.status(401).send('You cannot delete yourself');
    }
    next();
}

function validateUser(req, res, next) {
    //TODO validate user in req.body
    next();
}

router.delete('/deleteUser/:userId', checkDeletePermission, function (req, res, next) {
    users.deleteUser(req.params.userId, function(error) {
        if (error) {
            return res.status(500).send(error);
        }
        res.send();
    });
});

router.post('/addUser', validateUser, function(req, res, next) {
    var user = req.body.user;
    if (!user.isBlocked && (!req.user || !req.user.isAdmin)) {
        return res.status(401).send('Must login with active admin account for adding unblocked users');
    }
    user.password = decryptPassword(user.encryptedPassword);
    if (!user.password) {
        return res.status(401).send("Password cannot be empty!");
    }

    users.addUser(user, function(error, newUser) {
        if (error) {
            return res.status(500).send(error);
        }
        delete(newUser._doc.password);
        delete(newUser._doc.recoveryNumber);
        return res.json(newUser);
    });
});

router.get('/forgotPassword/:username', function(req, res, next) {
    users.getUserByUsername(req.params.username, function(error, user /*usersList*/) {
        if (error) {
            return res.status(500).send(error);
        }
        //var user = usersList.find(function(u) { return u.username === req.params.username; });
        if (!user || user.isBlocked) {
            return res.status(500).send("Unknown or blocked user '" + req.params.username + "'");
        }
        user.recoveryNumber = Math.floor((Math.random() * 2000000000));
        users.editUser(user, function(error, newUser) {
            if (error) {
                return res.status(500).send(error);
            }
            var mailOptions = {
                from: '"Vaad Bait" <targil666@walla.co.il>',
                to: newUser.email,
                subject: 'Password recovery link for neighbor',
                text: 'The recovery link is http://localhost:' + req.socket.localPort + '/users/recover/' + newUser.username + '?recoveryNumber=' + newUser.recoveryNumber
            };
            // send mail with defined transport object
            email.sendMail(mailOptions, function(error, info){
                if (error) {
                    return res.status(500).send(error);
                }
                res.send('Recovery link was sent to ' + newUser.email);
            });
        });
    });
});

router.get('/recover/:username', function (req, res, next) {
    if (req.params.username && req.query.recoveryNumber) {
        var recoveryNumber;
        try {
            recoveryNumber = parseInt(req.query.recoveryNumber);
        }
        catch (e) {
            return res.status(500).send('Invalid recovery link');
        }

        users.getUserByUsername(req.params.username, function (error, user) {
            if (user && !user.isBlocked && user.recoveryNumber === recoveryNumber) {
                users.deleteRecoveryNumber(user._id, function(err) {
                    if (err) {
                        return res.status(500).send(err);
                    }
                    req.logout();
                    req.session.regenerate(function(err) {
                        if (err) {
                            return res.status(500).send(err);
                        }
                        req.login(user, function(err) {
                            if (err) {
                                return res.status(500).send(err);
                            }

                            delete(user._doc.password);
                            //res.json(user);
                            res.redirect('/#/home/editUser');
                        });
                    });
                });
            }
            else if (!user || user.isBlocked) {
                return res.status(500).send("Unknown or blocked user '" + req.params.username + "'");
            }
            else {
                return res.status(500).send('Invalid recovery link');
            }
        }, function () {
            return res.status(500).send('Invalid recovery link');
        });
    }
    else {
        return res.status(500).send('Invalid recovery link');
    }
});

module.exports = router;
