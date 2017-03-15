/**
 * Created by reuvenp on 3/15/2017.
 */
var mongo = require("mongoose");
var Schema = mongo.Schema;
var debug = require("debug")("sess:message");

var userConnStr = 'mongodb://localhost/project';
var db = mongo.createConnection();
db.on('connecting', function() { debug('Connecting to MongoDB: '); });
db.on('connected', function() { debug('Connected to MongoDB: '); });
db.on('disconnecting', function() { debug('Disconnecting to MongoDB: '); });
db.on('disconnected', function() { debug('Disconnected to MongoDB: '); });
db.on('reconnected', function() { debug('Reconnected to MongoDB: '); });
db.on('error', function(err) { debug('Error to MongoDB: ' + err); });
db.on('open', function() { debug('MongoDB open : '); });
db.on('close', function() { debug('MongoDB close: '); });
process.on('SIGINT', function() { db.close(function () { process.exit(0); });});
db.open(userConnStr);

var Message = db.model('Message', new Schema({
    sender: String,
    submitDate: Date,
    room: String,
    content: {
        text: String,
        link: String,
        img: {data: Buffer, contentType: String}
    },
    isOnlyForConnected: Boolean,
    vote: {
        isPositive: Boolean,
        ip: String
    }
}));

module.exports = Message;