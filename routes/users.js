var express = require('express');
var router = express.Router();
var users = require('../users_manage');
var debug = require('debug')('nodejs-project:users');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/login', function(req, res, next) {
    users.authenticator(req, res, next, '/#/home', '/#/login');
});

router.get('/logout', function(req, res, next) {
    debug('logging out');
    req.logout();
    req.session.regenerate(function(err) {
        debug('logged out');
        res.redirect('/');
    });
});

module.exports = router;
