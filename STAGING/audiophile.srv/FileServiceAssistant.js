function require(lib) {
   return IMPORTS.require(lib);
}


var ListAssistant = function () {};
ListAssistant.prototype.run = function(future) {
	var fs = require("fs"); //load fs library locally
	var dir = this.controller.args.directory;
	
	fs.readdir(dir, function(err, items) {
		if(err) {
			throw err;
		} else {
			var path = require("path"); //load path library
			var dirList = [];
			var fileList = [];
			for(var i=0; i<items.length; i++) {
				var fullPath = dir + "/" + items[i];
				var stat = fs.statSync(fullPath);
				if(stat.isFile()) { //is a file
					var ext = path.extname(items[i]);
					if(ext==".mp3" || ext==".wav" || ext==".wma" || ext==".flac" || ext==".FLAC" || ext== ".acc" || ext==".m4a") {
						fileList.push({name:items[i], path:fullPath, parent:dir, isdir:false});
					}
				} else { //is a directory
					dirList.push({name:items[i], path:fullPath, parent:dir, isdir:true});
				}
			}
			dirList.sort(jsonArraySort("name", false, lowercase));
			fileList.sort(jsonArraySort("name", false, lowercase));
			future.result = {items: [{mydir: dirList, myfile: fileList}] };
		}
	});
};

function jsonArraySort(field, reverse, primer) {
	reverse = (reverse) ? -1 : 1;
	return function(a, b) {
		a = a[field];
		b = b[field];
		if (typeof(primer) != 'undefined'){
			a = primer(a);
			b = primer(b);
		}
		if (a<b) return -1;
		if (a>b) return 1;
		return 0;
	};
};

function lowercase(string) {
	return string.toLowerCase();
};

var DeleteFileAssistant = function () {};
DeleteFileAssistant.prototype.run = function(future) {
	var fs = require("fs"); //load fs library locally
	var dfile = this.controller.args.file; //filepath parameter
	var dlisting = fs.unlink(dfile);
	future.result = { items: dlisting };
};


