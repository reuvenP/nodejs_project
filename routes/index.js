var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.header("Cache-Control", "no-cache, no-store, must-revalidate");
    res.header("Pragma", "no-cache");
    res.header("Expires",0);
    res.render('index', { title: 'Express', user: req.user });
});

router.get('/index.html', function(req, res, next) {
    res.redirect('/');
});

router.get('/login.html', function(req, res, next) {
    var flashedErrors = req.flash('error') || [null];
    var error = flashedErrors[0];
    req.session.random = Math.floor((Math.random() * 2000000000) + 1);
    res.render("login", {title: "Login", random: req.session.random, error: error });
});

module.exports = router;
