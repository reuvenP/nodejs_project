var users = require('../users_manage');
var express = require('express');
var router = express.Router();

router.post('/', function(req, res, next) {
    users.authenticator(req, res, next);
});

module.exports = router;