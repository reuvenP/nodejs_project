var express = require('express');
var rsa = require('../rsa');
var router = express.Router();
var users = require('../users_manage');
var debug = require('debug')('nodejs-project:users');

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

router.post('/login', function (req, res, next) {
    users.authenticator(req, res, next, '/#/home', '/#/login');
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
    users.getUser(req.params.userId, function (error, user) {
        if (error) {
            return res.status(500).send(error);
        }
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

router.put('/editUser/:userId', checkLoggedIn, checkAdminOrSelfOperation, validateUser, function (req, res, next) {
    var user = req.body.user;
    if (user.encryptedPassword) {
        var buffer = Buffer.from(user.encryptedPassword, "base64");
        var decryptedPassword = rsa.decrypt(buffer);
        var password = decryptedPassword.toString();
        if (!password) {
            return res.status(401).send("Password cannot be empty!!!");
        }
        user.password = password;
    }
    if (!req.user.isAdmin) {
        delete(user.isAdmin);
        delete(user.isActive);
        delete(user.recoveryNumber);
    }
    users.editUser(user, function(error, newUser) {
        if (error) {
           return res.status(500).send(error);
        }
        delete(newUser._doc.password);
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
    users.deleteUser(req.params.userId, function(error, users) {
        if (error) {
            return res.status(500).send(error);
        }
        return res.json(users);
    });
});


router.post('/addUser', checkAdmin, validateUser, function(req, res, next) {
    users.addUser(req.body.user, function(error, newUser) {
        if (error) {
            return res.status(500).send(error);
        }
        delete(newUser._doc.password);
        return res.json(newUser);
    });
});

module.exports = router;
