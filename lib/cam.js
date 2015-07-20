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

var clients = [];

var createClient = function(name,wsdl,serviceName,portName,listFunctions)
{

  var deferred = Q.defer();

    soap.createClient(wsdl, function(err, client) {

      if (err) {
        console.log('ERR=', err);
        deferred.reject(err);
      }
      else {


        //client.addSoapHeader("<xsi:MessageID>urn:uuid:"+uuid.v1()+"</xsi:MessageID>","","","");
        //client.addSoapHeader("<xsi:ReplyTo><xsi:Address>http://www.w3.org/2005/08/addressing/anonymous</xsi:Address></xsi:ReplyTo>");


        console.log(name,' is ready !!!');

        client.functions = client[serviceName][portName];
        client.serviceName = serviceName;
        client.portName = portName;

        if(listFunctions)
        {
          console.log('--- Available Functions ---');
          for(var fu in client.functions)
          {
            if(typeof client.functions[fu] === "function") {
              // its a function if you get here
              console.log(fu);
            }
          }
          console.log('----------------------');
        }

        client.mutex = locks.createMutex();
        client.cache = [];


        clients[name] = client;

        deferred.resolve(client);
      }
    });

  return deferred.promise;

};

var Cam = function(options) {

  this.hostname = options.hostname;
  this.username = options.username;
  this.password = options.password;
  this.port = options.port ? options.port : 80;

};

Cam.LoadWsdl = function(array,callback) {

  var all = false;

  if (typeof array === "function") {

    all = true;

    callback = array;
    array = [];

  }

  var promises = [];

  if(array.indexOf('device')!= -1 || all)
  {
    //console.log('load device');

    promises.push(createClient('device','./lib/devicemgmt.wsdl','DeviceService','DevicePort'));

  }

  if(array.indexOf('ptz')!= -1 || all)
  {
    //console.log('load ptz');

    promises.push(createClient('ptz','./lib/ptz.wsdl','PTZService','PTZPort'));

  }

  if(array.indexOf('media')!= -1 || all)
  {
    //console.log('load media');

    promises.push(createClient('media','./lib/media.wsdl','MediaService','MediaPort'));

  }

  if(array.indexOf('event')!= -1 || all)
  {
    //console.log('load event');

    promises.push(createClient('event','./lib/event.wsdl','EventService','EventPort'));

  }

  Q.allSettled(promises)
    .then(function (results) {
      callback.call(null);
    });
};

Cam.prototype.exec = function(client,name,input,fromCache) {

  console.log(client,'Ctrl=',name);
  var deferred = Q.defer();

  if(clients[client])
  {

    var that = this;

    var onvifClient = clients[client];

    console.log(fromCache,' > cache=',onvifClient.cache);

    if(fromCache && onvifClient.cache[name])
    {
      console.log('from cache: '+name+' =');//,onvifClient.cache[name]);
      deferred.resolve(onvifClient.cache[name]);
    }
    else
    {
      //console.log('Try to lock client');

      onvifClient.mutex.lock(function () {

        //console.log('set Endpoint:','http://'+that.hostname+'/onvif/'+client+'_service');
        onvifClient.setSecurity(new soap.WSSecurity(that.username, that.password,'PasswordDigest'));
        onvifClient.setEndpoint('http://'+that.hostname+'/onvif/'+client+'_service');

        //console.log(onvifClient);

        if(onvifClient.functions[name]) {


          if(input)
          {
            //console.log('call with input');
            onvifClient[onvifClient.serviceName][onvifClient.portName][name](input,function(err,values)
            {
              if(err)
              {
                deferred.reject(err)
              }
              else{

                clients[client].cache[name] = values;
                deferred.resolve(values);
              }
            });
          }
          else{
            //console.log('call without input');

            onvifClient[onvifClient.serviceName][onvifClient.portName][name](function(err,values)
            {
              if(err)
              {
                deferred.reject(err)
              }
              else{
                clients[client].cache[name] = values;
                deferred.resolve(values);
              }
            });
          }



        }
        else{
          console.log(name+' -> la méthode n\'existe pas');
          deferred.reject('not found');
        }
        clients[client].mutex.unlock();
      });
    }



  }
  else{
    console.log('client not exist');
    deferred.reject('client not exist');
  }



  return deferred.promise;
};



Cam.prototype.RelativeMove = function(x,y) {

  var that = this;

  return that.exec('media','GetProfiles',null,true)
    .then(function (values) {

      console.log('ProfileToken=',values.Profiles[0].attributes.token)

      var ptz = {
        "PanTilt" : {
          "attributes": {

            x: x,
            y: y,
            'xmlns:tptz': 'http://www.onvif.org/ver10/schema'

          }
        }
      };

      return that.exec('ptz', 'RelativeMove', {
        ProfileToken: values.Profiles[0].attributes.token,
        Translation: ptz
      })
    });
};

Cam.prototype.CreatePullPointSubscription = function() {

  var deferred = Q.defer();

  //console.log('CPS=',clients['event']);

  clients['event'].setSecurity(new soap.WSSecurity(this.username, this.password,'PasswordDigest'));
  clients['event'].setEndpoint('http://'+this.hostname+'/onvif/'+'event_service');

  clients['event'].EventService.EventPort.CreatePullPointSubscription({InitialTerminationTime: 'PT10M'},function(err,value)
  {

    console.log('done');
    if(err)
    {
      console.log(err);
      deferred.reject(err);
    }
    else {
      clients['event'].pullUrl = value['SubscriptionReference']['Address'];
      clients['event']. terminationTime = value['TerminationTime'];

      deferred.resolve(value);
    }
  });

  return deferred.promise;
};

Cam.prototype.pullEvents = function()
{
  console.log('pullEvents');
  var deferred = Q.defer();

  clients['event'].setEndpoint(clients['event'].pullUrl);


  clients['event'].EventService.PullPointSubscription.PullMessages({Timeout: 'PT10M', MessageLimit : 1024  },function(err,value,body)
  {
    if(err)
    {
      deferred.reject(err);

    }
    else {

      deferred.resolve(value);
    }
  });

  return deferred.promise;

};

module.exports = {
  Cam: Cam
};
