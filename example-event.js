/**
 * Created by sguilly on 16/07/2015.
 */
var Cam = require('./lib/onvif').Cam;

Cam.LoadWsdl(['event'],function () {
  var cam = new Cam({
    hostname: '192.168.0.31',
    username: 'admin',
    password: 'pbjsteam'
  });


  cam.CreatePullPointSubscription().then(function(value)
  {
    console.log('done2=',value);

    cam.pullEvents().then(function(value)
    {
      console.log('event=',JSON.stringify(value,null,3));
    })
  }).catch(function (error) {

    console.log(error);
  });


});

