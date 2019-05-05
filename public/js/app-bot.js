var totalPago =0;
$(document).ready(function(){
  $("#BtnPay").click(function(){
    totalPago = "Q "+totalPago;
    var pago = {
      value: totalPago.toString()
    }
    sendDialog(pago)
  $('#PanelPay').modal("hide");
  });

  //$("#PanelPay").show();
});

var socket = io.connect('http://localhost:8010');
var botui = new BotUI('api-bot');
getLocation();
function getLocation() {
  if (navigator.geolocation) {
    return navigator.geolocation.getCurrentPosition(staredBOT);
  } else {
    console.log("Geolocation is not supported by this browser.")
    x.innerHTML = "Geolocation is not supported by this browser.";
  }
}
function setLocation(position) {
  console.log(position)
  return {
    latitude : position.coords.latitude,
    longitude : position.coords.longitude
  }
}


function Dist(lat1, lon1, lat2, lon2){
  rad = function(x) {return x*Math.PI/180;}
  var R     = 6378.137;                     //Radio de la tierra en km
  var dLat  = rad( lat2 - lat1 );
  var dLong = rad( lon2 - lon1 );
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLong/2) * Math.sin(dLong/2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = R * c;
  return d.toFixed(3);                      //Retorna tres decimales
}

function staredBOT(position){
  var distanciaMenor= null;
  $.getJSON('https://mcgeo-804d3.firebaseio.com/fields.json', function(data) {
    jQuery.each(data, function(i, val) {
      var coords = val.geoPointValue;
      var latLng = {
        lat : coords['latitude'],
        long : coords['longitude']
      }
      var dist = Dist(position.coords.latitude,position.coords.longitude,latLng.lat,latLng.long)
      if(distanciaMenor==null) {
        distanciaMenor={
          distancia: dist,
          nombre: val.nombre
        }
      }
      else if(distanciaMenor.distancia>dist) {
        distanciaMenor={
          distancia: dist,
          nombre: val.nombre
        }
      }

    });
    botui.message.add({ // show a message
      human: false,
      photo: 'img/cashier.png',
      content: '¡Hola! el restaurante más cercano es '+ distanciaMenor.nombre+' soy tu ayudante virtual '
    }).then(function () {
      botui.message.add({ // show a message
        human: false,
        delay: 2000,
        loading: true,
        photo: 'img/cashier.png',
        content: '¿Quieres comprar una Romana Tocino? ![Romana Tocino](https://mcdonalds.com.gt/wp-content/uploads/2019/02/04WebSiteCorporativo_640x640-1.png)'
      })
    }).then(function () { // wait till its shown
      return botui.action.button({
        delay: 2000,
        action: [
          { // show only one button
            text: 'Sí',
            value: 'sí quiero romana tocino'
          },
          { // show only one button
            text: 'No',
            value: 'no'
          },
        ]
      })
    }).then(function (res) { // wait till its shown
      sendDialog(res);
    });
  });
}


function constructMessage(data){
  if(data.intentName=='Flujo.Compra.Romana.Tocino'){
    var cantidaOpciones=0;
    var opciones = data.parameters.opcion;
    for (var i = 0; i < data.parameters.opcion.length; i++) {
      if(opciones[i].number) cantidaOpciones+=opciones[i].number
      else cantidaOpciones+=1
    }
  }
  if(data.intentName=='No.Romana'){
    botui.message.add({
      content: data.response,
      delay: 500,
    })
    .then(function () { // wait till its shown
      return botui.action.button({
        action: [
          { // show only one button
            text: 'Sí quiero Romana Tocino',
            value: 'sí'
          },
          { // show only one button
            text: 'Quiero pedir algo más',
            value: 'otros productos'
          },
        ]
      })
    }).then(function (res) { // wait till its shown
      sendDialog(res)
    })
  }
  else if(cantidaOpciones!=data.parameters.cantidad && data.parameters.opcion.length!=0 ){
    console.log(data.parameters.opcion)
    botui.message.add({
      photo: 'img/cashier.png',
      content: "Podrías favor especificar la cantidad de tus hamburguesas con pollo grilled, crispy y carne",
      delay: 500,
    })
    .then(function () { // wait till its shown
      return botui.action.text({ // show 'text' action
      action: {
        placeholder: ''
      }
    });
  }).then(function (res) { // wait till its shown
    sendDialog(res)
  })
  }
  else if(data.parameters.metodoPago=='tarjeta'&&data.parameters.pago==''){
    //$("#PanelPay").show();
    $('#PanelPay').modal();
    totalPago = data.parameters.cantidad*46;
    $('#BtnPay').html('Pagar Q'+totalPago);
  }
  else{
    botui.message.add({
      photo: 'img/cashier.png',
      content: data.response,
      delay: 500,
    })
    .then(function () { // wait till its shown
      return botui.action.text({ // show 'text' action
      action: {
        placeholder: ''
      }
    });
  }).then(function (res) { // wait till its shown
    if(data.parameters.cantidad && data.parameters.opcion.length==0){
      var str = res.value;
      str = str.toLowerCase();
      str = str.replace(new RegExp('otra|otro',"g"), "1");
      str = str.replace(new RegExp('de',"g"), "");
      res = {
        value:str
      }
    }
    sendDialog(res)

  })
}

}

function sendDialog(res){
socket.emit('fromClient', { client : res.value });
}


socket.on('fromServer', function (data) { // recieveing a reply from server.
constructMessage(data)
});
