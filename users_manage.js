var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('./models/user');
var debug = require('debug')('nodejs-project:users');
var sha1 = require('sha1');

passport.use(new LocalStrategy(
    {usernameField: 'username', passwordField: 'hashedLogin'},
    function (username, hashedLogin, done) {
        User.findOne({username: username, isActive: true}, function (error, user) {
            if (error) {
                debug("Login error: " + error);
                return done(error);
            }
            if (!user) {
                debug("Login no user: " + error);
                return done(null, false, {message: "User '" + username + "' doesn't exist"});
            }

            //password cannot be checked here since we need the random number from the session.
            //the authentication continues in userAuthenticator soon
            return done(null, user);
        });
    }
));

passport.serializeUser(function (user, done) {
    done(null, user._id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        if (err) return done(err, null);
        if (!user.isActive) return done(null, null);
        done(null, user);
    });
});

function handleError(error, req, res, redirectTo) {
    debug(error);
    req.flash('error', error);
    res.redirect(redirectTo);
}

var userAuthenticator = function (req, res, next, redirectOk, redirectFail) {
    passport.authenticate('local', function (err, user, info) {
        debug("start");
        //get user object from LocalStrategy
        if (err) {
            return handleError('User authentication failed: ' + err, req, res, redirectFail);
        }
        if (!user) {
            return handleError("Unknown user '" + req.body.username + "'", req, res, redirectFail);
        }

        //check the login details that were hashed by random number
        var realHash = sha1(user.username + ':' + user.password + ':' + req.session.random);
        if (realHash !== req.body.hashedLogin) {
            return handleError("Wrong password for '" + user.username + "'", req, res, redirectFail);
        }

        // If we are here then authentication was successful.
        req.logIn(user, function (err) {
            if (err) {
                return handleError("Login error for '" + user.username + "'", req, res, redirectFail);
            }

            debug("Logged as: " + user.username);
            return res.redirect(redirectOk);
            // var flashedReferer = req.flash('referer') || ['/'];
            // var referer = flashedReferer[0];
            // return res.redirect(referer);
        });
    })(req, res, next);
};

var getUsers = function(then) {
    var query = User.find({isActive: true});
    query.select('-password');
    query.exec(function (err, users) {
        then(err, users);
    });
};

var deleteUser = function(userId, then) {
    User.findById(userId, function (err, user) {
        if (err) return then(err, []);

        user.isActive = false;
        user.save(function (err) {
            if (err) return then(err, []);
            getUsers(then);
        });
    });
};

var exporter = {};
exporter.authenticator = userAuthenticator;
exporter.getUsers = getUsers;
exporter.deleteUser = deleteUser;

module.exports = exporter;
