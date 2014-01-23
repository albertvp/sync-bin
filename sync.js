var Sync = exports,
	fs = require('fs'),
	fspath = require('path'),
	qs = require('querystring'),
	request = require('request'),
	to = from = '', p = fspath.sep, pro = process.cwd();

var config = Sync.config = require('./config');
Sync.files = [];

Sync.route = function(app,st){
	if (!app) console.log('ERROR NO APP');
	if (typeof st==='function') app.use(st( process.cwd()+p+config.serve ));
	console.log('Route',config.url,typeof st);

	app.get('/'+config.url, Sync.read);
};

Sync.get = function(fr,t,cbk){
	from = fr;
	to = t;
	if (!fs.existsSync(pro+p+to)) {
		var r = '[Not exists] Destination directory: '+pro+p+to;
		console.log(r);
		return cbk({ error: r });
	}
	var obj = {}, dir = {};
	obj[config.key] = from;
	var url = 'http://'+config.host+':'+config.port+'/'+config.url+'?'+qs.stringify(obj);

	console.log('REQUEST',url);
	request(url, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
	    try {
	    	dir = JSON.parse(body);
	    } catch(e){ console.log('ERROR',e) }

	    console.log('BODY',dir);
		if (typeof dir!='object') return cbk({ error: 'Failed directory response.' });

	    Sync.write(dir);
	    setTimeout(Sync.download,200);
	  } else console.log(error,body);
	});

	console.log('Request done:',from,to);
};

Sync.read = function (req,res) {
	var dir = req.query[config.key];

	function dirTree(filename) {
		if (!fs.existsSync(filename)) return undefined;
	    var stats = fs.lstatSync(filename),
	        info = {
	            path: fspath.normalize(filename.replace(pro,'').replace(config.serve,'').replace(from,'')).split(p).join('/'),
	            name: fspath.basename(filename)
	        };
	    if (stats.isDirectory()) {
	        info.type = "folder";
	        info.childs = {}; 
	        var children = fs.readdirSync(filename).map(function(child) {
	            if (child.charAt(0)!=='.') info.childs[child] = dirTree(filename + p + child);
	        });
	        info.mtime = stats.mtime.toString();
	        //info.ctime = stats.ctime.toString();
	    } else {
	        // Assuming it's a file. In real life it could be a symlink or ...
	        info.type = "file";
	        info.size = stats.size;
	        info.mtime = stats.mtime.toString();
	        //info.ctime = stats.ctime.toString();
	    }
	    return info;
	}

	if (typeof dir!='string'){
		console.log('Parameter',config.key,'not in query');
		res.send({ error: 'Bad querystring.'});
		return;
	} 
	
	dir = dirTree(pro+p+config.serve+p+dir);
	try { dir = JSON.stringify(dir); } catch(e){ dir = undefined }
	res.send( dir || { error: 'No directory' });
};

Sync.write = function(dir){
	if (!dir || dir.error) return;

	if (dir.type==='folder'){
		for (var c in dir.childs){
			if (dir.childs[c].type==='folder' && !fs.existsSync(pro+p+to+dir.childs[c].path))
				try { fs.mkdirSync(pro+p+to+dir.childs[c].path); } catch(e) { console.log('ERROR DIR',e); }
			Sync.write(dir.childs[c],to+dir.path);
		}
	}  else if (dir.type==='file') {
		if (fs.existsSync(pro+p+to+dir.path)){
			var stat = fs.lstatSync(pro+p+to+dir.path), l = Date(stat.ctime), d = Date(dir.mtime);
			if (dir.size===stat.size){ // comprobar fechas
				return;
			}
			//console.log('DIFF SIZE',dir.path);
		} //else console.log('NOT EXISTS',dir.path)

		Sync.files.push(dir);
	}
};

Sync.download = function(){
	function rename(file){
		//console.log('RENAME',file);
		if (fs.existsSync(file+'.tmp')) {
			if (fs.lstatSync(file+'.tmp').size)
				fs.rename(file+'.tmp',file,function(err){
					if (err) {
						console.log('ERROR RENAMING',err);
						setTimeout(function(){ rename(file); },1000);
					} else console.log('DONE',file);
				});
		}
	}
	if (Sync.files.length){
		//console.log('FILES',Sync.files);
		var file = Sync.files.shift(),
			filename = fspath.normalize(pro+p+to+file.path.split('/').join(p));

		console.log('REQUEST',file.path);
		request('http://'+config.host+':'+config.port+'/'+from+file.path)
			.on('error',function(err){
				Sync.files.push(file);
				console.log('FAILED',filename);
			})
			.on('end',function(){
				rename(filename);
				setTimeout(Sync.download,config.delay);
			})
			.pipe(fs.createWriteStream(filename+'.tmp'));
	} else {
		console.log('FILES SYNCHRONIZED!');
		setTimeout(function(){
			if (Sync.files.length)
				return Sync.download();
			//process.exit(1);
		},10000);
	}
};
