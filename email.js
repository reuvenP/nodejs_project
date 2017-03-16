var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport('smtps://targil666%40walla.co.il:qwerty12@out.walla.co.il:587');

module.exports = transporter;
