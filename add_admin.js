var User = require('./models/user');

User.create({
    name: 'Dan Zilberstein',
    username: 'dzilbers',
    password: '123',
    email: 'aba4000@gmail.com',
    admin: true
}, function(err, user) {
    if (err) throw err;
    console.log('User created:' + user);
});
