var apiai = require('apiai');
var app = apiai("2c08ac37bd1d4bc98344ca480ac37121");
// Function which returns speech from api.ai
var getRes = function(query) {
 var request = app.textRequest(query, {
 sessionId: '<unique session id>'
 });
const responseFromAPI = new Promise(
 function (resolve, reject) {
request.on('error', function(error) {
 reject(error);
});
request.on('response', function(response) {
  console.log(response)
  data = {
    intentName : response.result.metadata.intentName,
    response : response.result.fulfillment.speech,
    parameters : response.result.parameters
  }
 resolve(data);
});
});
request.end();
return responseFromAPI;
};
// test the command :
//getRes('hello').then(function(res){console.log(res)});
module.exports = {getRes}
