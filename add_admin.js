var User = require('./models/user');

User.create({
    name: 'Dan Zilberstein',
    username: 'dzilbers',
    password: '123',
    email: 'aba4000@gmail.com',
    apartment: 2,
    admin: true
}, function(err, user) {
    if (err) throw err;
    console.log('User created:' + user);
});

User.create({
    name: 'Dan Zilberstein0',
    username: 'dzilbers0',
    password: '123',
    email: 'aba40000@gmail.com',
    apartment: 1,
    admin: true
}, function(err, user) {
    if (err) throw err;
    console.log('User created:' + user);
});
