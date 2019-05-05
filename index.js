var app = require('express')();
var server = require('http').Server(app);
var http = require('http');
var api = require('./api');
const express = require('express')
const path = require('path')
app.set('port', process.env.PORT || 8010);
app.set('view engine', 'ejs')

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

var conn = function() {
  app.use(express.static(path.join(__dirname, 'public')))
  //app.listen(8010, () => console.log(`Listening on 8010`))
  app.get('/', function(req, res, next) {
    res.render('index', { title: 'botUI_dialogflow' });
  });
};


var fromClient = function() {
  console.log("socket on")
  var io = require('socket.io')(server);
  io.on('connection', function (socket) {
    console.log("Cliente conectado")
    socket.on('fromClient', function (data) {
      console.log("Cliente envió: ",data)
      api.getRes(data.client).then(function(res){
        console.log("Server: ",res)
        socket.emit('fromServer', res);
      });
    });
  });
}
module.exports = {conn,fromClient}
conn()
fromClient()
