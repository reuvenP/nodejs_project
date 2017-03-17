var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('./models/user');
var debug = require('debug')('nodejs-project:users');
var sha1 = require('sha1');
var extend = require('util')._extend;

passport.use(new LocalStrategy(
    {usernameField: 'username', passwordField: 'hashedLogin'},
    function (username, hashedLogin, done) {
        User.findOne({ username: username, isDeleted: {$ne: true}, isBlocked: {$ne: true} }, function (error, user) {
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
        if (user.isDeleted || user.isBlocked) return done(null, null);
        delete(user._doc.password);
        delete(user._doc.recoveryNumber);
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
            //return handleError('User authentication failed: ' + err, req, res, redirectFail);
            return res.status(500).send('User authentication failed: ' + err);
        }
        if (!user) {
            //return handleError("Unknown user '" + req.body.username + "'", req, res, redirectFail);
            return res.status(401).send("Unknown or blocked user '" + req.body.username + "'");
        }

        //check the login details that were hashed by random number
        var realHash = sha1(user.username + ':' + user.password + ':' + req.session.random);
        if (realHash !== req.body.hashedLogin) {
            //return handleError("Wrong password for '" + user.username + "'", req, res, redirectFail);
            return res.status(401).send("Wrong password for '" + user.username + "'");
        }

        // If we are here then authentication was successful.
        delete(user._doc.password);
        delete(user._doc.recoveryNumber);
        req.logIn(user, function (err) {
            if (err) {
                //return handleError("Login error for '" + user.username + "'", req, res, redirectFail);
                return res.status(500).send("Login error for '" + user.username + "':" + err);
            }

            debug("Logged as: " + user.username);
            return res.json(user);
            //return res.redirect(redirectOk);
            // var flashedReferer = req.flash('referer') || ['/'];
            // var referer = flashedReferer[0];
            // return res.redirect(referer);
        });
    })(req, res, next);
};

var getUsers = function(onlyNotBlocked, then) {
    var query = onlyNotBlocked ? User.find({isDeleted: {$ne: true}, isBlocked: {$ne: true}}) : User.find({isDeleted: {$ne: true}});
    query.select('-password -recoveryNumber -isDeleted'); //TODO do -password -recoveryNumber in upper level
    query.exec(function (err, users) {
        then(err, users);
    });
};

var deleteUser = function(userId, then) {
    User.findById(userId, function (err, user) {
        if (err) return then(err, []);

        user.isDeleted = true;
        user.save(function (err) {
            if (err) return then(err, []);
            getUsers(true, then); //TODO don't auto reload
        });
    });
};

var getUserById = function(userId, then) {
    User.findById(userId, function (err, user) {
        if (err) return then(err, null);
        if (user && !user.isDeleted) {
            delete(user._doc.isDeleted);
            return then(null, user);
        }
        else {
            then("user not found", null)
        }
    });
};

var getUserByUsername = function(username, then) {
    User.find({username: username, isDeleted: {$ne: true}}, function (err, user) {
        if (err) return then(err, null);
        if (user) {
            delete(user[0]._doc.isDeleted);
            return then(null, user[0]);
        }
        else {
            then("user not found", null)
        }
    });
};

var editUser = function(user, then) {
    getUserById(user._id, function(err, current) {
        if (err) return then(err);
        extend(current, user);
        current.save(then)
    });
};

var addUser = function(user, then) {
    var newUser = new User();
    extend(newUser, user);
    newUser.save(then);
};

var deleteRecoveryNumber = function(userId, then) {
    getUserById(userId, function(err, user) {
        if (err) return then(err);
        //user.recoveryNumber = null; //TODO unmark!
        user.save(then)
    });
};

var exporter = {};
exporter.authenticator = userAuthenticator;
exporter.getUsers = getUsers;
exporter.getUserById = getUserById;
exporter.getUserByUsername = getUserByUsername;
exporter.deleteUser = deleteUser;
exporter.editUser = editUser;
exporter.addUser = addUser;
exporter.deleteRecoveryNumber = deleteRecoveryNumber;

module.exports = exporter;
