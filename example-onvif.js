/**
 * Created by sguilly on 20/07/15.
 */

var
  http = require('http'),
  Cam = require('onvif').Cam;

new Cam({
    hostname: '192.168.0.31',
  username: 'admin',
  password: 'pbjsteam'
  //path: '/onvif/events_service'
}, function(err) {
  this.relativeMove({x: 0, y: 0.1});

  //this.getSnapshotUri(function(err, values) {
  //
  //  console.log('values=',values);
  //});

  //this.createPullPointSubscription(function(a,b,c)
  //{
  //  console.log(a,b,c);
  //})
});
