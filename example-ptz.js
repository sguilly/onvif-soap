/**
 * Created by sguilly on 16/07/2015.
 */
var Cam = require('./lib/onvif').Cam;

Cam.LoadWsdl(['media','ptz'],function () {
  var cam = new Cam({
    hostname: '192.168.0.31',
    username: 'admin',
    password: 'pbjsteam'
  });


  cam.RelativeMove('0','-1').then(function(value)
  {
    console.log('done');


  }).catch(function (error) {

        console.log(error);
      });


});

