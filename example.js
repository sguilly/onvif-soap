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



    cam1.deviceCtrl('GetDeviceInformation').then(function (values) {
      console.log(values);
    });
/*
  cam1.deviceCtrl('GetServices').then(function (values) {
    console.log(values);
  });

  cam1.mediaCtrl('GetSnapshotUri').then(function (values) {
    console.log(values);
  });*/



  //  cam1.deviceCtrl('GetDeviceInformation').then(function(values) {
  //    console.log(values);
  //  });
  //
  //cam2.deviceCtrl('GetDeviceInformation').then(function(values) {
  //  console.log(values);
  //});










});

