var express = require('express');
var app = express();


var server = require('http').Server(app);
var io = require('socket.io')(server);

// WARNING: app.listen(80) will NOT work here!
app.use(express.static(__dirname + '/public'));

const usersMap = new Map();

io.on('connection', (socket) => {
  const { id } = socket;

  usersMap.set(id);
  console.log('New Connection: ' + id);
  console.log(usersMap);

  socket.on('disconnect', () => {
    console.log(`User id ${id} has disconnected`);
    usersMap.delete(id);
  });
  socket.on('reconnect', () => {
    console.log(`User id ${id} has reconnected`);
    usersMap.set(id, { id });
  });


  socket.emit('user-update', { name: 'test', usersMap });

  socket.on('movement', function (data) {
    socket.broadcast.emit('heard-movement', {...data, id});

    // console.log(data);
  });
});


server.listen(3000);