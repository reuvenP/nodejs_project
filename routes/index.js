var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/login.html', function(req, res, next) {
    req.session.random = Math.floor((Math.random() * 2000000000) + 1);
    res.header("Cache-Control", "no-cache, no-store, must-revalidate");
    res.header("Pragma", "no-cache");
    res.header("Expires",0);
    res.render("login", {title: "Login", random: req.session.random});
});

module.exports = router;
