var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
app.use(express.static('public'));

io.on('connection', function(socket) {
  var room;

  socket.on('join', function(data){
    room = data['room'];
    var io_room = io.sockets.adapter.rooms[room];
    if (io_room === undefined || io_room.length < 2){
      console.log('joined', socket.id, 'to room', room );
      socket.join(room);
      io_room = io.sockets.adapter.rooms[room];
      if (io_room.length == 2)
        socket.broadcast.to(room).emit('requestOffer');
    } else {
      console.log('NOT joined', socket.id, 'to room', room, 'FULL' );
      room = null;
      io.to(socket.id).emit('error', 'full room');
    }
    });

    socket.on('invite', function (sdp){
      socket.broadcast.to(room).emit('invite', sdp);
    });

    socket.on('OK', function (sdp) {
      socket.broadcast.to(room).emit('OK', sdp);
    });

    socket.on('candidate', function(cand){
      socket.broadcast.to(room).emit('candidate', cand);
    });

    socket.on('error', function (error) {
      socket.broadcast.to(room).emit('error', error);
    });

    socket.on('bye', function () {
      console.log('bye', room, socket.id);
      socket.broadcast.to(room).emit('bye');
      socket.leave(room);
      room = null;
    });

    socket.on('disconnect', function () {
      socket.broadcast.to(room).emit('bye');
      console.log('disconnected', room, socket.id);
    });
});

http.listen(8000, function() {
  console.log('listening on localhost:8000')
});
