/**
 * Created by sguilly on 16/07/2015.
 */
var Cam = require('./lib/onvif').Cam;

Cam.LoadWsdl(function () {
  var cam = new Cam({
    hostname: '192.168.0.31',
    username: 'admin',
    password: 'pbjsteam'
  });

  var cam1 = new Cam({
    hostname: '192.168.0.19',
    username: 'admin',
    password: 'pbjsteam'
  });

  var cam2 = new Cam({
    hostname: '192.168.0.33',
    username: 'admin',
    password: 'pbjsteam'
  });



    cam.exec('device','GetDeviceInformation').then(function (values) {
      console.log(values);
    }).catch(function (error) {
      // Handle any error from all above steps
      console.log(error);
    });



  cam.exec('media','GetProfiles').then(function (values) {
    //console.log(JSON.stringify(values,null,3));
    console.log(values.Profiles[0].attributes.token);

    cam.exec('media','GetSnapshotUri',{ProfileToken: values.Profiles[0].attributes.token}).then(function (values) {
      console.log(values);
    })
      .catch(function (error) {
        // Handle any error from all above steps
        console.log(error);
      });




  }).catch(function (error) {
    // Handle any error from all above steps
    console.log(error);
  });

});

