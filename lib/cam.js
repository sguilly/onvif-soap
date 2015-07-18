/**
 * Created by sguilly on 16/07/2015.
 */
var locks = require('locks');

var uuid = require('node-uuid');

var Q = require('q');
const soap = require('soap');

var device;
var mutexDevice = locks.createMutex();
var mutexMedia = locks.createMutex();
var mutexPTZ = locks.createMutex();
var event;
var media;
var ptz;

var getDevice = function()
{

  var deferred = Q.defer();
  if(device)
  {
    deferred.resolve(device);
  }
  else
  {
    soap.createClient('./lib/devicemgmt.wsdl', function(err, client) {

      if (err) {
        console.log('ERR=', err);
        deferred.reject(err);
      }
      else {


        //client.addSoapHeader("<xsi:MessageID>urn:uuid:"+uuid.v1()+"</xsi:MessageID>","","","");
        //client.addSoapHeader("<xsi:ReplyTo><xsi:Address>http://www.w3.org/2005/08/addressing/anonymous</xsi:Address></xsi:ReplyTo>");

        device = client;
        console.log('Device Mgmt is ready !!!');

        console.log('--- Available Functions ---');

        /*
        for(var fu in device.DeviceService.DevicePort)
        {
          if(typeof device.DeviceService.DevicePort[fu] === "function") {
            // its a function if you get here
            console.log(fu);
          }
        }*/

        console.log('----------------------');

        deferred.resolve(device);
      }
    });
  }
  return deferred.promise;

};

var getPTZ = function()
{

  var deferred = Q.defer();
  if(ptz)
  {
    deferred.resolve(ptz);
  }
  else
  {
    soap.createClient('./lib/ptz.wsdl', function(err, client) {

      if (err) {
        console.log('ERR=', err);
        deferred.reject(err);
      }
      else {


        //client.addSoapHeader("<xsi:MessageID>urn:uuid:"+uuid.v1()+"</xsi:MessageID>","","","");
        //client.addSoapHeader("<xsi:ReplyTo><xsi:Address>http://www.w3.org/2005/08/addressing/anonymous</xsi:Address></xsi:ReplyTo>");

        ptz = client;
        console.log('PTZ Mgmt is ready !!!');

        console.log('--- Available Functions ---');


         for(var fu in ptz.PTZService.PTZPort)
         {
         if(typeof ptz.PTZService.PTZPort[fu] === "function") {
         // its a function if you get here
         console.log(fu);
         }
         }

        console.log('----------------------');

        deferred.resolve(ptz);
      }
    });
  }
  return deferred.promise;

};

var getEvent = function()
{

  var deferred = Q.defer();
  if(event)
  {
    deferred.resolve(event);
  }
  else
  {
    soap.createClient('./lib/event.wsdl', function(err, client) {

      if (err) {
        console.log('ERR=', err);
        deferred.reject(err);
      }
      else {


        //client.addSoapHeader("<xsi:MessageID>urn:uuid:"+uuid.v1()+"</xsi:MessageID>","","","");
        //client.addSoapHeader("<xsi:ReplyTo><xsi:Address>http://www.w3.org/2005/08/addressing/anonymous</xsi:Address></xsi:ReplyTo>");

        event = client;
        console.log('Event is ready !!!');

        console.log('--- Available Functions ---');

        /*
        for(var fu in event.EventService.EventPort)
        {
          if(typeof event.EventService.EventPort[fu] === "function") {
            // its a function if you get here
            console.log(fu);
          }
        }
        */

        console.log('----------------------');

        deferred.resolve(device);
      }
    });
  }
  return deferred.promise;

};

var getMedia = function()
{

  var deferred = Q.defer();
  if(media)
  {
    deferred.resolve(media);
  }
  else
  {
    soap.createClient('./lib/media.wsdl', function(err, client) {

      if (err) {
        console.log('ERR=', err);
        deferred.reject(err);
      }
      else {


        //client.addSoapHeader("<xsi:MessageID>urn:uuid:"+uuid.v1()+"</xsi:MessageID>","","","");
        //client.addSoapHeader("<xsi:ReplyTo><xsi:Address>http://www.w3.org/2005/08/addressing/anonymous</xsi:Address></xsi:ReplyTo>");

        media = client;
        console.log('Media is ready !!!');

        console.log('--- Available Functions ---');

       /*
        for(var fu in media.MediaService.MediaPort)
        {
          if(typeof media.MediaService.MediaPort[fu] === "function") {
            // its a function if you get here
            console.log(fu);
          }
        }*/

        console.log('----------------------');

        deferred.resolve(media);
      }
    });
  }
  return deferred.promise;

};


var Cam = function(options) {

  this.hostname = options.hostname;
  this.username = options.username;
  this.password = options.password;
  this.port = options.port ? options.port : 80;

};

Cam.LoadWsdl = function(callback) {
  getDevice().then(function()
  {
    getEvent().then(function()
    {
      getMedia().then(function()
      {
        getPTZ().then(function()
        {
          callback.call(null);
        });
      });
    });

  });
};

Cam.prototype.deviceCtrl = function(name) {

  var deferred = Q.defer();

  var that = this;

  mutexDevice.lock(function () {
    device.setSecurity(new soap.WSSecurity(that.username, that.password,'PasswordDigest'));
    device.setEndpoint('http://'+that.hostname+'/onvif/device_service');

    if(device.DeviceService.DevicePort[name]) {
      device.DeviceService.DevicePort[name](function(err,values)
      {
        if(err)
        {
          deferred.reject(err)
        }
        else{
          deferred.resolve(values);
        }
      });
    }
    else{
      console.log(name+' -> la méthode n\'existe pas');
      deferred.reject();
    }
    mutexDevice.unlock();
  });

  return deferred.promise;
};

Cam.prototype.mediaCtrl = function(name,input) {

  console.log('mediaCtrl=',name);
  var deferred = Q.defer();

  var that = this;

  mutexMedia.lock(function () {

    console.log('call media');
    media.setSecurity(new soap.WSSecurity(that.username, that.password,'PasswordDigest'));
    media.setEndpoint('http://'+that.hostname+'/onvif/media_service');

    if(media.MediaService.MediaPort[name]) {


      if(input)
      {
        media.MediaService.MediaPort[name](input,function(err,values)
        {
          if(err)
          {
            deferred.reject(err)
          }
          else{
            deferred.resolve(values);
          }
        });
      }
      else{
        media.MediaService.MediaPort[name](function(err,values)
        {
          if(err)
          {
            deferred.reject(err)
          }
          else{
            deferred.resolve(values);
          }
        });
      }



    }
    else{
      console.log(name+' -> la méthode n\'existe pas');
      deferred.reject('not found');
    }
    mutexMedia.unlock();
  });

  return deferred.promise;
};

Cam.prototype.ptzCtrl = function(name,input) {

  console.log('ptzCtrl=',name);
  var deferred = Q.defer();

  var that = this;

  mutexPTZ.lock(function () {

    console.log('call media');
    ptz.setSecurity(new soap.WSSecurity(that.username, that.password,'PasswordDigest'));
    ptz.setEndpoint('http://'+that.hostname+'/onvif/media_service');

    if(ptz.PTZService.PTZPort[name]) {


      if(input)
      {
        media.PTZService.PTZPort[name](input,function(err,values)
        {
          if(err)
          {
            deferred.reject(err)
          }
          else{
            deferred.resolve(values);
          }
        });
      }
      else{
        media.PTZService.PTZPort[name](function(err,values)
        {
          if(err)
          {
            deferred.reject(err)
          }
          else{
            deferred.resolve(values);
          }
        });
      }



    }
    else{
      console.log(name+' -> la méthode n\'existe pas');
      deferred.reject('not found');
    }
    mutexPTZ.unlock();
  });

  return deferred.promise;
};


module.exports = {
  Cam: Cam
};
