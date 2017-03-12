var express = require('express');
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

    users.getUsers(function (error, users) {
        if (error) {
            return res.status(500).send(error);
        }

        for (var i = 0; i < users.length; i++) {
            if (users[i]._id.toString() == req.user._id.toString()) {
                users[i]._doc.myUser = true;
                break;
            }
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
    if (!req.user || !req.user.admin) {
        return res.status(401).send('You must login as admin for that operation');
    }
    next();
}

function checkAdminOrSelfOperation(req, res, next) {
    if (!req.user.admin && req.user._id != req.params.userId) {
        return res.status(401).send('You cannot do this operation on other users');
    }
    next();
}

router.put('/updateUser/:userId', checkLoggedIn, checkAdminOrSelfOperation, validateUser, function (req, res, next) {
    var user = req.body.user;
    if (!req.user.admin) {
        delete(user.admin);
        delete(user.isActive);
        delete(user.recoveryNumber);
    }
    users.updateUser(user, function(error) {
       if (error) {
           return res.status(500).send(error);
       }
    });
});


function checkDeletePermission(req, res, next) {
    if (!req.user || !req.user.admin){
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
    users.addUser(req.body.user, function(error, user) {
        if (error) {
            return res.status(500).send(error);
        }
        return res.json(user);
    });
});

module.exports = router;
