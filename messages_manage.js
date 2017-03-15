/**
 * Created by Home on 15/03/2017.
 */
var Message = require('./models/message');

function addMessage(sender, room, text, link, img, isOnlyForConnected) {
    var message = new Message({
        sender: sender,
        room: room,
        text: text,
        link: link,
        img: img,
        isOnlyForConnected: isOnlyForConnected
    });
    message.save(function (err) {
        if (err) throw err;
    });
}

addMessage('me', 'r1', 'bla', 'http://bla.com', undefined, false);
