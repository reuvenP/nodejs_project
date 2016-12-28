var users = require('../users_manage');
var express = require('express');
var router = express.Router();

router.post('/', users.authenticator);

module.exports = router;
