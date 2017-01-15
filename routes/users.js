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

router.get('/getUsers', function (req, res, next) {
    if (!req.user) {
        return res.status(401).send('You must login first to view the neighbours');
    }
    users.getUsers(function (users) {
        for (var i = 0; i < users.length; i++) {
            if (users[i]._id.toString() == req.user._id.toString()) {
                users[i]._doc.myUser = true;
                break;
            }
        }
        res.json(users);
    }, function (error) {
        res.status(500).send(error);
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

router.delete('/deleteUser/:userId', checkDeletePermission, function (req, res, next) {
    users.deleteUser(req.params.userId,
        function (users) {
            res.json(users);
        }, function (error) {
            res.status(500).send(error);
        });
});

module.exports = router;
