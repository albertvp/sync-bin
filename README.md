syncBin
=======

NodeJS file directory synchronization via http. Done with express and request modules.

## Cloud Installation
Install the module on your project:

```
npm install sync-bin
```

Init  a stand-alone server instance:
```javascript
var sync = require('sync-bin');

sync.start(sync.init(),true);
```

or add it to your express app:
```javascript
sync.config.host = '127.0.0.1';
sync.config.port = '8080';
sync.config.serve = 'assets';

sync.start(app);
```

## Client requester

```javascript
sync.get('files/from','files/to',function(dir){
	if (dir.error) return console.log('ERROR',dir.error);
	console.log('Synchronizing!');
});
```

## Configuration
Customize the configuration to specify the correct routes:

Hooks are used to collect data for emails:

```javascript
{
	host: 'localhost',
	port: 8060,
	url: 'sync',
	key: 'path',
	delay: 10,
	serve: 'files'
}
```