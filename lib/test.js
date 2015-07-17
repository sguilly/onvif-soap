/**
 * Created by sguilly on 16/07/2015.
 */
var soap = require('soap');

var device;

soap.createClient('devicemgmt.wsdl', function(err, client) {


  if(err)
  {
    console.log('ERR=',err);
  }
  else
  {
    client.setSecurity(new soap.WSSecurity('admin', 'pbjsteam','PasswordDigest'));
    client.setEndpoint('http://192.168.0.19/onvif/device_service');

    device = client;

    device.DeviceService.DevicePort.GetDeviceInformation(function(err,value)
    {

      if(err)
      {
        console.log(err);
      }
      else
      {
        console.log('value');
        console.log(value);


      }

    });

  }
});
