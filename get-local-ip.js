const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (interface.family === 'IPv4' && !interface.internal) {
        console.log(`Your local IP address is: ${interface.address}`);
        console.log(`Add this to your Django ALLOWED_HOSTS: '${interface.address}'`);
        console.log(`Use this URL for mobile testing: http://${interface.address}:8000`);
        return interface.address;
      }
    }
  }
}

getLocalIP();