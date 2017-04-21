process.env.DISPLAY = ':0';
process.env.DBUS_SESSION_BUS_ADDRESS = 'unix:path=/run/dbus/system_bus_socket';
var dbus = require('dbus-native');
var sessionBus = dbus.sessionBus();
var args = process.argv.slice(2);
for( let i = 0; i < args.length; i++) {
  var address = args[i];
  address = address.toUpperCase().replace(/:/g, '_');
  connectDevice(address);
}

function connectDevice(address) {
  sessionBus.getService('org.bluez').getInterface(
    '/',
    'org.freedesktop.DBus.ObjectManager' , (err, obj) => {
        console.log(err);
        console.log(obj);
        obj.on('InterfacesAdded', (err, int) => {
          console.log(err);
          console.log(int);
        });
    });

  sessionBus.getService('org.bluez').getInterface(
      '/org/bluez/hci0',
      'org.bluez.Adapter1', function(err, notifications) {
      //notifications.SetDiscoveryFilter(['6d480f4991d34a18be290d27f4109c23']);
      notifications.StartDiscovery();
  });

  sessionBus.getService('org.bluez').getInterface(
      `/org/bluez/hci0/dev_${address}`,
      'org.bluez.Device1', function(err, device) {
      device.Connect();
      sessionBus.getService('org.bluez').getInterface(
          `/org/bluez/hci0/dev_${address}`,
          'org.freedesktop.DBus.Properties', function(err, properties) {
          properties.on('PropertiesChanged', (name, res) => {
            for(let i = 0; i < res.length; i++) {
              if(res[i][0] == 'Connected'){
                if(!res[i][1][1][0]){
                  console.log('DISCONNECTED:' + address);
                  device.Connect();
                }
              }
            }
          });
      });

      sessionBus.getService('org.bluez').getInterface(
          `/org/bluez/hci0/dev_${address}/service0017/char0018`,
          'org.bluez.GattCharacteristic1', function(err, characteristic) {
          characteristic.StartNotify();

          sessionBus.getService('org.bluez').getInterface(
              `/org/bluez/hci0/dev_${address}/service0017/char0018`,
              'org.freedesktop.DBus.Properties', function(err, properties) {
              properties.on('PropertiesChanged', (name, res) => {
                console.log(address + ":" + res[0][1][1][0].data);
              });
          });
      });
  });

}
