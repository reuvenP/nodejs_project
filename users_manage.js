var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('./models/user');
var debug = require('debug')('nodejs-project:users');
var sha1 = require('sha1');

passport.use(new LocalStrategy(
    { usernameField: 'username', passwordField: 'hashedLogin'},
    function(username, hashedLogin, done) {
        User.findOne({username: username}, function (error, user) {
            if (error) {
                debug("Login error: " + error);
                return done(error);
            }
            if (!user) {
                debug("Login no user: " + error);
                return done(null, false, { message: "User '" + username + "' doesn't exist" });
            }

            //password cannot be checked here since we need the random number from the session.
            //the authentication continues in /login post (login.js)
            return done(null, user);
        });
    }
));

passport.serializeUser(function(user, done) {
    done(null, user._id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

var exporter = {};
exporter.authenticator = function(req, res, next) {
    passport.authenticate('local', function (err, user, info) {
        debug("start");
        //get user object from LocalStrategy
        if (err) {
            debug(err);
            //req.flash('error', err);
            return next(err);
        }
        if (!user) {
            // debug("Unknown user '" + req.body.username + "'");
            // req.flash('error', info.message);
            // return res.redirect('/login');
            err = "Unknown user '" + req.body.username + "'";
            debug(err);
            //req.flash('error', err);
            return next(err);
        }

        //check the login details that were hashed by random number
        var realHash = sha1(user.username + ':' + user.password + ':' + req.session.random);
        if (realHash !== req.body.hashedLogin) {
            err = "Wrong password for '" + user.username + "'";
            debug(err);
            //req.flash('error', err);
            return next(err);
        }

        // If we are here then authentication was successful.
        req.logIn(user, function (err) {
            if (err) {
                debug(err);
                //req.flash('error', err);
                return next(err);
            }

            debug("Logged as: " + user.username);
            return res.redirect('/');
            // var flashedReferer = req.flash('referer') || ['/'];
            // var referer = flashedReferer[0];
            // return res.redirect(referer);
        });
    })(req, res, next);
};

module.exports = exporter;
