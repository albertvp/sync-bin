var main = require('../main'),
	sync = main.start(main.init(),true);

setTimeout(function(){
	sync.get('from','files/to',function(dir){
		if (dir.error) return console.log('ERROR',dir.error);
		console.log('Synchronizing!');
	});
},1000);