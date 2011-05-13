/***********************************
 * wAMP() - Handler Object for the Plugin
 *
 * This object is designed to handle interfacing with the plugin.
 *	because of the way Luna handles hybrid apps, it cannot just
 *	be set it and forget it at this point.  But it is meant to be
 *	as close as possible to that.
 ************************************/

 // Stupid JSling stuff
 /*global Mojo*/
 /*global $*/
 /*global window*/
 
// Stupid javascript for not having constants stuff
var LIST_TYPE_FF		= true;
var LIST_TYPE_INDEX 	= false;

// these are the status of the index
var INDEX_NOT_READY_YET = 0;
var INDEX_ALREADY_RUN 	= 1;
var INDEX_FIRST_RUN 	= 2;
var INDEX_FAILED_LOAD 	= 3;

var PLAY_MODE_NORMAL 	= 0;
var PLAY_MODE_REPEAT 	= 1;
var PLAY_MODE_SHUFFLE 	= 2;

var PLAYLIST_POS_END 	= -1;
var PLAYLIST_POS_NEXT 	= -2;


// Fast implementation for array unique
//	modified to select for the particular song property
uniqueArray = function(array, strProp) 
{
	if (strProp)
	{
		r = new Array();
		var o = {}, i, l = array.length;
        for(i=0; i<l;i+=1) o[array[i][strProp]] = array[i][strProp];
        for(i in o)
		{	
			var obj = new Object();
			obj[strProp] = o[i];
			r.push(obj);
		}
        return r;
	}
	else
	{
		r = new Array();
		var o = {}, i, l = array.length;
        for(i=0; i<l;i+=1) o[array[i]] = array[i];
        for(i in o)
		{
			var obj = new Object();
			obj = o[i];
			r.push(obj);
		}
        return r;
	}
};

isArray = function(obj) 
{
	return obj.constructor == Array;
};

/*******************************
 * Sort the song list by the specified property
 *******************************/
sortSongList = function(arraySongs, strSortByProp)
{
	objwAMP.strSortKey = strSortByProp;
 
	arraySongs.sort(function(a, b)
					{
						var strA=a[strSortByProp].toLowerCase(), strB=b[strSortByProp].toLowerCase()
						
						// Make sure the Unknown Tag is last
						if (strA.indexOf('[unknown') != -1)
							return 1;
						if (strB.indexOf('[unknown') != -1)
							return -1;
						
						if (strA < strB) //sort string ascending
							return -1;
						if (strA > strB)
							return 1;
						return 0; //default return value (no sorting)
					});
	
	return arraySongs;
};

/*******************************
 * This returns a filtered list based on the
 *	the property we are filtering, and the filter string
 *******************************/
filterSongs = function(arraySongs, strProp, strValue)
 {

	var funcFilter = function (x)
	{
		return (x[strProp] == strValue);
	};
	
	return arraySongs.filter(funcFilter);
 }

String.prototype.capitalize = function() 
{
    return this.charAt(0).toUpperCase() + this.slice(1);
}

String.prototype.getFirstLetter = function()
{
	return this.charAt(0).toUpperCase();
}

String.prototype.getSecondLetter = function()
{
	return this.charAt(1).toUpperCase();
}

// constants for options database
var OPT_ID_SKIN = 1;
var OPT_ID_BASS = 2;
var OPT_ID_TREB = 3;


var ORIENTATION_UNLOCKED 	= 0;
var ORIENTATION_PORTRAIT 	= 1;
var ORIENTATION_LANDSCAPE	= 2;


var objOptions = 
{

	optUseBreadC: true,
	dbOptions: 0,
	fBass: 1.0,
	fTreble: 1.0,
	bOptVis: false,
	iOrientationMode: ORIENTATION_UNLOCKED,
	
	GetOrientation: function()
	{
		if (iOrientationMode == ORIENTATION_PORTRAIT)
			return "portrait";
		else if (iOrientationMode == ORIENTATION_LANDSCAPE)
			return "landscape";
		else
			return window.orientation ? "landscape" : "portrait";
	},
	
	LoadDatabase: function()
	{
		this.dbOptions = openDatabase('wAMPdb', 
								 '1.0' /*version*/, 
								 'database for storing user settings', 
								 65536 /*max size*/);


		this.dbOptions.transaction(function (sql) 
		{  
			sql.executeSql("CREATE TABLE IF NOT EXISTS 'audio_opt' " +
							"(optID INTEGER PRIMARY KEY, val TEXT)"
						);
		});

 
		this.dbOptions.transaction(function(sql) 
		{
			sql.executeSql("SELECT * FROM 'audio_opt'", 
						   [],
						   function(transaction, results) 
						   {
								var iNumEntries = 
											results.rows.length;
											
								if (!iNumEntries)
									objOptions.SetDefaults();
								else
								{
									for (var i=0; i<iNumEntries; i++)
									{
										var row = results.rows.item(i);
										
										switch (row['optID'])
										{
										case OPT_ID_SKIN:
											objSkin.skinNum = Number(row['val']);
											break;
										case OPT_ID_BASS:
											objOptions.fBass = Number(row['val']);
											objOptions.fSaveBass = row['val'];
											break;
										case OPT_ID_TREB:
											objOptions.fTreble = Number(row['val']);
											objOptions.fSaveTreble = row['val']
											break;
										}
									}
									
									objOptions.SetPluginControls();
								}	
							},
							function(transaction, error) 
							{
								console.log("Could not read: " + error.message);
							});
		});

	},
	
	SetPluginControls: function()
	{
		if (!(objwAMP.checkIfPluginInit()))
		{
			setTimeout(function() {objOptions.SetPluginControls();}, 1000);
			return;
		}
	
		objwAMP.SetBass(this.fSaveBass);
		objwAMP.SetTreble(this.fSaveTreble);
	},
	
	SetDefaults: function()
	{
		this.dbOptions.transaction(function (sql) 
		{  
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_SKIN, "1"]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_BASS, "1.0"]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_TREB, "1.0"]);
		});
	
	},

	
	UpdateOption: function(id, strVal)
	{
		this.dbOptions.transaction(function (sql) 
		{  
			sql.executeSql("UPDATE 'audio_opt' SET val = ? WHERE optID = ?", 
						   [strVal, id],
						   function(result) {},
						   function(sql, error) {alert("Error:" + error);});
		});
	},
		
	Draw: function()
	{
		this.bOptVis = true;
		
		var strCurrentScene = $.mobile.activePage.selector;
		
		var divModalLook = $('<div></div>', 
							{
								"id":"idModelBack",
								css: {
									'position': 'fixed',
									'top': '0px',
									'left': '0px',
									'width':'100%',
									'height': '100%',
									'z-index': '9000',
									'opacity': '0.5',
									'background': objSkin.theme[objSkin.skinNum].option.modalbg
									}
							}).appendTo($(strCurrentScene));
							
		var divOverlay = $('<div></div>', 
							{
								"id":"idMainBack",
								css: {
									'position': 'fixed',
									'top': '10%',
									'background-color': 
											objSkin.theme[objSkin.skinNum].option.topbgcolor,
									'left': '10%',
									'bottom':'10%',
									'right': '10%',
									'z-index': '9999',
									'background-image': 'none',
									'color': objSkin.theme[objSkin.skinNum].option.txtcolor
									}
							}).appendTo($(strCurrentScene));
							
		var btnClose = $('<span id="btnClose" class="' +
								objSkin.theme[objSkin.skinNum].dialog.btnclstheme +
								'"><span>' +
								'Close</span></span>)').appendTo(divOverlay);
		var btnSwitchTheme = $('<span id="btnSwitchTheme" class="' +
								objSkin.theme[objSkin.skinNum].dialog.btntheme +
								'"><span>' +
								'Switch Theme</span></span>)').appendTo(divOverlay);
		var btnRedoIndex = $('<span id="btnRedoIndex" class="' +
								objSkin.theme[objSkin.skinNum].dialog.btntheme +
								'"><span>' +
								'Redo Index</span></span>)').appendTo(divOverlay);

		
		
		btnClose.click(function() {objOptions.Close();});
		btnSwitchTheme.click(function() 
		{
			objSkin.pickNextSkin();
			$('#idModelBack').remove();
			$('#idMainBack').remove();
			var strCurrentScene = $.mobile.activePage;
			strCurrentScene.jqmData("Reload", "Refresh");
			$.mobile.changePage(strCurrentScene, "none", false, false);
		});
		btnRedoIndex.click(function() {objOptions.RerunIndex();});
	
	},
	
	RerunIndex: function()
	{	
		this.Close();
		
		objwAMP.RedoIndexer();
		$('#idButtonGoesHere').unbind();
		$('#idButtonGoesHere').hide();		
		
		$('#idTellUser').html("Please wait while the indexer is rerun.<br> " +
								  "Once it has finished the app will go back" +
								  " to the indexer.");
	
		this.sceneReturnTo = $.mobile.activePage;
	
		$('#idButtonGoesHere').removeClass();
		$('#idButtonGoesHere').addClass(objSkin.theme[objSkin.skinNum].dialog.btntheme);
		
		$('#idButtonGoesHere span').text("Re-Index Finished");
	
		$('#idButtonGoesHere').click(function () 
		{
			$.mobile.changePage(objOptions.sceneReturnTo, "slidedown", false, false);
		});
	
		$.mobile.changePage($('#idDialog'), "slideup", false, false);
	
	},
	
	Close: function()
	{
		this.bOptVis = false;
	
		$('#idModelBack').remove();
		$('#idMainBack').remove();
	}
};


function ObjectHash(strProp, strHashPrefix)
{
	if (!strProp)
		this.bStringProp = false;
	else
		this.bStringProp = true;

	this.strProp = strProp;
	this.length = 0;
	
	if (strHashPrefix)
		this.strHashPrefix = strHashPrefix;
	else
		this.strHashPrefix = "";
	this.iUniqueID = 1;
	this.objByVal = new Object();
	this.objByHash = new Object();
   
	ObjectHash.prototype.removeItemByProp = function(strPropVal)
	{
		var hashVal = this.objByVal[strPropVal];
	
		if (typeof(bHasItem) != 'undefined') {
			this.length--;
			delete this.objByHash[hashVal];
			delete this.objByVal[in_val];
		}
	}

	ObjectHash.prototype.removeItemByHash = function(in_hash)
	{
		var valObj = this.objByHash[in_hash];
	
		if (typeof(bHasItem) != 'undefined') {
			this.length--;
			
			var itrPoint;
			if (this.bStringProp)
				itrPoint = valObj[this.strProp];
			else
				itrPoint = valObj;
				
			delete this.objByVal[itrPoint];
			delete this.objByHash[in_hash];
		}
	}
	
	ObjectHash.prototype.getHash = function(strPropVal) 
	{
		var bHasItem = this.objByVal[strPropVal];
		
		if (typeof(bHasItem) == 'undefined')
			return 0;
		
		return bHasItem;
	}
	
	ObjectHash.prototype.getVal = function(in_hash) 
	{
		var bHasItem = this.objByHash[in_hash];
		
		if (typeof(bHasItem) == 'undefined')
			return 0;
		
		return bHasItem;
	}

	/*ObjectHash.prototype.getAllItemsArray = function()
	{
		return this.objByHash;
	}*/
	
	ObjectHash.prototype.getValArray = function()
	{
		return this.objByVal;
	}
	
	ObjectHash.prototype.addItem = function(objSong)
	{
		var itrPoint;
		if (this.bStringProp)
			itrPoint = objSong[this.strProp];
		else
			itrPoint = objSong;
	
		if (typeof(this.objByVal[itrPoint]) == 'undefined') 
		{
			this.length++;
			var iHash = this.strHashPrefix + Number(this.iUniqueID++).toString();
			this.objByVal[itrPoint] = iHash;
			this.objByHash[iHash] = objSong;
			return iHash;
		}
		else 
		{
			// Item has already been added to the hash table
			//	so just return the hash val
			return this.objByVal[itrPoint];
		}
	}
	
	ObjectHash.prototype.hasItemByVal = function(strAltProp)
	{
		return typeof(this.objByVal[strAltProp]) != 'undefined';
	}
	
	ObjectHash.prototype.hasItemByHash = function(in_hash)
	{
		return typeof(this.objByHash[in_hash]) != 'undefined';
	}	

	ObjectHash.prototype.clear = function()
	{
		for (var i in this.objByHash) 
		{
			delete this.objByHash[i];
		}

		for (var i in this.objByVal) 
		{
			delete this.objByVal[i];
		}
		
		this.length = 0;
	}
}

function CategoryHash(strProp, strCatIDPrefix)
{
	this.strProp = strProp;
	this.strCatIDPrefix = strCatIDPrefix;
	this.htCatItems = new ObjectHash(strProp, strCatIDPrefix);
	this.objCatArrays = new Object();
	
	CategoryHash.prototype.addItem = function (objSongItem)
	{
		if ((!(objSongItem[this.strProp])) || (objSongItem[this.strProp] == ""))
		{
			objSongItem[this.strProp] = "[Unknown " + this.strProp.capitalize() + "]";
		}

		hashVal = this.htCatItems.addItem(objSongItem);

		if (typeof(this.objCatArrays[hashVal]) == 'undefined')
			this.objCatArrays[hashVal] = new Array();
		
		this.objCatArrays[hashVal].push(objSongItem);
	}
	
	CategoryHash.prototype.getCategoryItems = function()
	{
		return this.htCatItems.getValArray();
	}
	
	CategoryHash.prototype.getItemHash = function(strCatID)
	{
		return this.htCatItems.getHash(strCatID);
	}
	
	CategoryHash.prototype.getCatFromHash = function(strHash)
	{
		return this.htCatItems.getVal(strHash);
	}

	CategoryHash.prototype.getSongArray = function(hashVal)
	{
		return this.objCatArrays[hashVal];
	}
}	

function LiObject(strHash, strText)
{
	this.IdHash = strHash;
	this.DisplayText = strText;
}

function SongIndex()
{
	// Var to store the original index
	this.arrayIndex = 0;
	
	// Create a hash table for each type of data we need to store
	// create a hash table for all songs
	//  will be indexed by song path
	this.htFullSongHash = new ObjectHash("path");
	
	// create a hash for artist
	this.htArtistHash = new CategoryHash("artist", "art_");
	
	// create a hash for albums
	this.htAlbumHash = new CategoryHash("album", "alb_");
	
	// create a hash for genre
	this.htGenreHash = new CategoryHash("genre", "gen_");

	this.addArray = function (arraySongs)
	{
		this.arrayIndex = arraySongs;
	
		for (var i = 0; i < arraySongs.length; i++)
			this.addSong(arraySongs[i]);
	}
	
	this.addSong = function(objSong)
	{
		this.htFullSongHash.addItem(objSong);
		this.htArtistHash.addItem(objSong);
		this.htAlbumHash.addItem(objSong);
		this.htGenreHash.addItem(objSong);	
	}

	this.PlayAll = function()
	{
		return this.arrayIndex;
	}
	
	this.buildAristList = function()
	{
		var retArray = new Array();
		
		var arrayCatItems = this.htArtistHash.getCategoryItems();
		
		for (var i in arrayCatItems)
		{
			var hash = this.htArtistHash.getItemHash(i);
			retArray.push(new LiObject(hash, i));
		}
		
		return sortSongList(retArray, "DisplayText");
	}
	
	this.buildAlbumList = function()
	{
		var retArray = new Array();
		
		var arrayCatItems = this.htAlbumHash.getCategoryItems();
		
		for (var i in arrayCatItems)
		{
			var hash = this.htAlbumHash.getItemHash(i);
			retArray.push(new LiObject(hash, i));
		}
		
		return sortSongList(retArray, "DisplayText");
	}
	
	this.buildGenreList = function()
	{
		var retArray = new Array();
		
		var arrayCatItems = this.htGenreHash.getCategoryItems();
		
		for (var i in arrayCatItems)
		{
			var hash = this.htGenreHash.getItemHash(i);
			retArray.push(new LiObject(hash, i));
		}
		
		return sortSongList(retArray, "DisplayText");
	}
	
	this.buildTitleList = function()
	{
		var retArray = new Array();
		
		var arraySongItems = this.htFullSongHash.getValArray();
		
		for (var i in arraySongItems)
		{
			var hash = this.htFullSongHash.getHash(i);
			var objSongItem = this.htFullSongHash.getVal(hash);
	
			if (!(objSongItem.title) || (objSongItem.title == ""))
				retArray.push(new LiObject(hash, objSongItem.name));
			else
				retArray.push(new LiObject(hash, objSongItem.title));
			
			
		}
		
		return sortSongList(retArray, "DisplayText");
	}
	
	this.goBack = function(arrayPrior)
	{
		this.arrayAlt = arrayPrior;
	}
	
	this.buildSubList = function (strHash, arraySubset)
	{
	
		var strCatID = strHash.substr(0, 4);
		
		if (strCatID == "alt_")
			strCatID = strHash.substr(4, 4);
		
		if (objOptions.optUseBreadC)
		{
			if (strCatID == "art_")
			{
				var tmpArray = new Array();
				
				for (var i=0; i<arraySubset.length; i++)
				{
					tmpArray.push(arraySubset[i]);	
				}

				this.arrayAlt = tmpArray;

				tmpArray = uniqueArray(tmpArray, "album");

				var retArray = new Array();
			
				for (var i=0; i<tmpArray.length; i++)
				{
					var hash = this.htAlbumHash.getItemHash(tmpArray[i].album);
					hash = "alt_" + hash;
			
					retArray.push(new LiObject(hash, tmpArray[i].album));
			
				}
							
				return sortSongList(retArray, "DisplayText");
			}
			else if (strCatID == "gen_")
			{
				var tmpArray = new Array();
				
				for (var i=0; i<arraySubset.length; i++)
				{
					tmpArray.push(arraySubset[i]);	
				}

				this.arrayAlt = tmpArray;

				tmpArray = uniqueArray(tmpArray, "artist");

				var retArray = new Array();
			
				for (var i=0; i<tmpArray.length; i++)
				{
					var hash = this.htArtistHash.getItemHash(tmpArray[i].artist);
					hash = "alt_" + hash;
			
					retArray.push(new LiObject(hash, tmpArray[i].artist));
			
				}
				
				return sortSongList(retArray, "DisplayText");
			}
			else
			{
				this.arrayAlt = arraySubset;

				var retArray = new Array();
			
				for (var i=0; i<arraySubset.length; i++)
				{
					var hash = this.htFullSongHash.getHash(arraySubset[i].path);
			
					var objSongItem = this.htFullSongHash.getVal(hash);
			
					if (!(objSongItem.title) || (objSongItem.title == ""))
						retArray.push(new LiObject(hash, objSongItem.name));
					else
						retArray.push(new LiObject(hash, objSongItem.title));
			
				}
							
				return sortSongList(retArray, "DisplayText");
			}
		}
		else
		{
			this.arrayAlt = arraySubset;

			var retArray = new Array();
		
			for (var i=0; i<arraySubset.length; i++)
			{
				var hash = this.htFullSongHash.getHash(arraySubset[i].path);
		
				var objSongItem = this.htFullSongHash.getVal(hash);
		
				if (!(objSongItem.title) || (objSongItem.title == ""))
					retArray.push(new LiObject(hash, objSongItem.name));
				else
					retArray.push(new LiObject(hash, objSongItem.title));
		
			}
					
			return sortSongList(retArray, "DisplayText");
		}
		
	}
	
	this.buildPlayList = function(arrayList)
	{
		var arraySongs = new Array();
		
		for(var i=0; i<arrayList.length;i++)
		{
			var arrayTemp = this.getObjectFromHash(arrayList[i]);
			
			if (isArray(arrayTemp))
			{
				for(var j=0; j<arrayTemp.length;j++)
				{
					arraySongs.push(arrayTemp[j]);
				}
			}
			else
			{
				arraySongs.push(arrayTemp);
			}
		}

		return arraySongs;
	}
	
	this.getObjectFromHash = function (strHash)
	{
		
		if (strHash.substr(0, 4) == "alt_")
		{
			var test = strHash.substr(0, 4);
			var strCatHash = strHash.substr(4);
			var strCatID = strHash.substr(4, 4);
			
			var strVal;
			
			if (strCatID == "art_")
			{
				strVal = this.htArtistHash.getCatFromHash(strCatHash);
				
				var arrayTest = filterSongs(this.arrayAlt, "artist", strVal.artist);
				
				return arrayTest;
				
			}
			else if (strCatID == "alb_")
			{
				strVal = this.htAlbumHash.getCatFromHash(strCatHash);
				
				return filterSongs(this.arrayAlt, "album", strVal.album);
			}
			else if (strCatID == "gen_")
			{
				strVal = this.htGenreHash.getCatFromHash(strCatHash);
				
				return filterSongs(this.arrayAlt, "genre", strVal.genre);
			}	
			
		} 
		else if (isNaN(strHash-0))
		{
			var strCatID = strHash.substr(0, 4);
		
			if (strCatID == "art_")
				return this.htArtistHash.getSongArray(strHash);
			else if (strCatID == "alb_")
				return this.htAlbumHash.getSongArray(strHash);
			else if (strCatID == "gen_")
				return this.htGenreHash.getSongArray(strHash);			
		
		}
		else
		{
			return this.htFullSongHash.getVal(strHash);
		}
	}
}

var objSongIndex = new SongIndex();



var objwAMP = 
{
// Private:
	
	arrayExtList: new Array(".mp3",".wma",".m4a",".aac",".flac",".ogg",".ra",".ram",".wav",".mp2",".mp1",".mpg",".als",".ors",".mp4",".3gp",".wmv"),
	
	// this is the current path we are on, set to root dir
	strCurrentPath: "/media/internal", 
	
	// this is an enum to tell whether we are using FileFolder type io or
	//	full indexing type io
	indexType: 0,
	
	mutexLikeCheck: 0,
	
	bShuffle: false,
	bRepeat: false,
	
	// This will hold the song list for viewing
	arrayPlaylist: new Array(),
		
	objectLsCache: new Object(),

	// this will be true if indexer failed to load
	bFolderOnly: false,
	
	isWebOS: (/webOS/gi).test(navigator.appVersion),
	
	iSongIndex: 0,
	iOpenIndex: -1,
	
	fTransition: 0.0,
	
// Public:

	checkOS: function()
	{
	
		if (this.isWebOS)
		{
			this.plugIn = document.getElementById('wAMPPlugin');
			this.plugIn.StartSong = function(str) {objwAMP.StartSong(str);};
			this.plugIn.FinishIndex = function(str) {objwAMP.FinishIndex(str);};
			this.plugIn.FinishSeek = function(str) {objwAMP.FinishSeek(str);};
		}
		else
		{
			this.plugIn = new Object();
			this.plugIn.StartSong = function() {objwAMP.StartSong();};
			this.plugIn.FinishIndex = function(str) {objwAMP.FinishIndex(str);};
			this.plugIn.FinishSeek = function(str) {objwAMP.FinishSeek(str);};
			this.plugIn.bNextSet = false;
			
			this.plugIn.strSongState = "101";
			
			this.plugIn.Ping = function () {return 'Pong';};
								
			this.plugIn.GetFullIndex = function () 
			{
				return '{"iIndexingStatus":4, "strCurSearchDir":"Test",' +
					   '"arrayFileList": [' +
							'{"name":"ice_ice_baby.mp3", "path":"/media/internal/ice_ice_baby.mp3", "artist":"Vanilla Ice", "album":"alllllvin", "genre":"rap", "title":"Ice Ice Baby", "isdir":false},' +
							'{"name":"every_rose.ogg", "path":"/media/internal/every_rose.ogg", "artist":"Poison", "album":"alllllvin", "genre":"rock", "title":"Every Rose Has It\'s Thorn", "isdir": false},' +
							'{"name":"3333333", "path":"/media/internal/the_cave.flac", "artist":"Mumford and Sons", "album":"alllllvin", "genre":"alternative", "title":"The Cave", "isdir": false},' +
							'{"name":"the_cave.flac", "path":"/media/internal/path4", "artist":"Leonard Skinner", "album":"alllllvin", "genre":"classic rock", "title":"Freebird", "isdir": false},' +
							'{"name":"5555", "path":"/media/internal", "artist":"Sting", "album":"Sting", "genre":"contemporary", "title":"Fields of Gold", "isdir": false},' +
							'{"name":"666666666666", "path":"/media/internal/path5", "artist":"Queen", "album":"alllllvin", "genre":"rock", "title":"I Want To Break Free", "isdir": false},' +
							'{"name":"hhehrtt", "path":"/media/internal/path6", "artist":"Led Zepplin", "album":"", "genre":"classic rock", "title":"Stairway To Heaven", "isdir": false},' +
							'{"name":"88", "path":"/media/internal/path7", "artist":"Kanasas", "album":"alllllvin", "genre":"classic rock", "title":"Dust in the wind", "isdir": false},' +
							'{"name":"999999999", "path":"/media/internal/path8", "artist":"Queen", "album":"", "genre":"", "title":"Highlander Theme Song", "isdir": false},' +
							'{"name":"aaaaaaaa", "path":"/media/internal/path9", "artist":"", "album":"", "genre":"", "title":"The Simpsons theme", "isdir": false},' +
							'{"name":"hhfdgfdi sdfgh", "path":"/media/internal/path10", "artist":"Britney", "album":"alllllvin", "genre":"pop", "title":"Hit Me Baby One More Time", "isdir": false},' +
							'{"name":"cccccc", "path":"/media/internal/path11", "artist":"The Killers", "album":"alllllvin", "genre":"pop", "title":"Mr. Brightside", "isdir": false},' +
							'{"name":"ddddddd", "path":"/media/internal/path12", "artist":"Lady Gaga", "album":"alllllvin", "genre":"pop", "title":"Poker Face", "isdir": false},' +
							'{"name":"tytttyyty", "path":"/media/internal/path13", "artist":"Cartman", "album":"", "genre":"", "title":"Cartman doing poker face", "isdir": false},' +
							'{"name":"fff ffff ffff", "path":"/media/internal/path14", "artist":"Bruce", "album":"", "genre":"rock", "title":"Born in the U.S.A.", "isdir": false},' +
							'{"name":"jjkjkjkkkl jjkjuu", "path":"/media/internal/path15", "artist":"", "album":"alllllvin", "genre":"classical", "title":"Winter", "isdir": false},' +
							'{"name":"vvfvvfvf", "path":"/media/internal/path16", "artist":"Tori Amos", "album":"alllllvin", "genre":"pop", "title":"Crucify", "isdir": false},' +
							'{"name":"hhyhyy", "path":"/media/internal/path17", "artist":"", "album":"alllllvin", "genre":"techno", "title":"Crucify (remix)", "isdir": false},' + 
							'{"name":"xzdffffef snhhn", "path":"/media/internal/path18", "artist":"Groove Coverage", "album":"alllllvin", "genre":"techno", "title":"Poison", "isdir": false},' +
							'{"name":"adjfk kk", "path":"/media/internal/path19", "artist":"Groove Coverage", "album":"alllllvin", "genre":"techno", "title":"20th Century Digital Girl", "isdir": false}' +
						']}';
			}
			
			this.plugIn.GetCurrentDirLS = function ()
			{
				return '{"finishedIndexing":true, ' +
					   '"arrayFileList": [' +
							'{"name":"ice_ice_baby.mp3", "path":"/media/internal/ice_ice_baby.mp3", "artist":"Vanilla Ice", "album":"alllllvin", "genre":"rap", "title":"Ice Ice Baby", "isdir":false},' +
							'{"name":"every_rose.ogg", "path":"/media/internal/every_rose.ogg", "artist":"Poison", "album":"alllllvin", "genre":"rock", "title":"Every Rose Has It\'s Thorn", "isdir": false},' +
							'{"name":"wallpaper", "path":"/media/internal/wallpaper", "artist":"Mumford and Sons", "album":"alllllvin", "genre":"alternative", "title":"The Cave", "isdir": true},' +
							'{"name":"the_cave.flac", "path":"/media/internal/path4", "artist":"Leonard Skinner", "album":"alllllvin", "genre":"classic rock", "title":"Freebird", "isdir": false},' +
							'{"name":"f_o_g.wma", "path":"/media/internal", "artist":"Sting", "album":"Sting", "genre":"contemporary", "title":"Fields of Gold", "isdir": false},' +
							'{"name":"queen(I want to break free).mp3", "path":"/media/internal/path5", "artist":"Queen", "album":"alllllvin", "genre":"rock", "title":"I Want To Break Free", "isdir": false},' +
							'{"name":"stairway.mp3", "path":"/media/internal/path6", "artist":"Led Zepplin", "album":"", "genre":"classic rock", "title":"Stairway To Heaven", "isdir": false},' +
							'{"name":"dustinThewind.mp3", "path":"/media/internal/path7", "artist":"Kanasas", "album":"alllllvin", "genre":"classic rock", "title":"Dust in the wind", "isdir": false},' +
							'{"name":"ringtones", "path":"/media/internal/ringtones", "artist":"Queen", "album":"", "genre":"", "title":"Highlander Theme Song", "isdir": true},' +
							'{"name":"simpson_homer.mp3", "path":"/media/internal/path9", "artist":"", "album":"", "genre":"", "title":"The Simpsons theme", "isdir": false},' +
							'{"name":"hitmeonemoretime.bad", "path":"/media/internal/path10", "artist":"Britney", "album":"alllllvin", "genre":"pop", "title":"Hit Me Baby One More Time", "isdir": false},' +
							'{"name":"mrbright.ogg", "path":"/media/internal/path11", "artist":"The Killers", "album":"alllllvin", "genre":"pop", "title":"Mr. Brightside", "isdir": false},' +
							'{"name":"pokerface.mp3", "path":"/media/internal/path12", "artist":"Lady Gaga", "album":"poker face", "genre":"pop", "title":"Poker Face", "isdir": false},' +
							'{"name":"southpart.mp3", "path":"/media/internal/path13", "artist":"Cartman", "album":"", "genre":"", "title":"Cartman doing poker face", "isdir": false},' +
							'{"name":"born_usa.txt", "path":"/media/internal/path14", "artist":"Bruce", "album":"", "genre":"rock", "title":"Born in the U.S.A.", "isdir": false},' +
							'{"name":"winter.doc", "path":"/media/internal/path15", "artist":"", "album":"alllllvin", "genre":"classical", "title":"Winter", "isdir": false},' +
							'{"name":"crucify.mp3", "path":"/media/internal/path16", "artist":"Tori Amos", "album":"alllllvin", "genre":"pop", "title":"Crucify", "isdir": false},' +
							'{"name":"curcity(remix).flac", "path":"/media/internal/path17", "artist":"", "album":"alllllvin", "genre":"techno", "title":"Crucify (remix)", "isdir": false},' + 
							'{"name":"music", "path":"/media/internal/music", "artist":"Groove Coverage", "album":"alllllvin", "genre":"techno", "title":"Poison", "isdir": true},' +
							'{"name":"groovecov.mp3", "path":"/media/internal/path19", "artist":"Groove Coverage", "album":"alllllvin", "genre":"techno", "title":"20th Century Digital Girl", "isdir": false}' +
						']}';
			};
			
			this.plugIn.RedoIndex = function() 
			{
				objwAMP.FinishIndex('{"iIndexingStatus":4, "strCurSearchDir":"Test",' +
					   '"arrayFileList": [' +
							'{"name":"ice_ice_baby.mp3", "path":"/media/internal/ice_ice_baby.mp3", "artist":"Vanilla Ice", "album":"alllllvin", "genre":"rap", "title":"Ice Ice Baby", "isdir":false},' +
							'{"name":"every_rose.ogg", "path":"/media/internal/every_rose.ogg", "artist":"Poison", "album":"alllllvin", "genre":"rock", "title":"Every Rose Has It\'s Thorn", "isdir": false},' +
							'{"name":"3333333", "path":"/media/internal/the_cave.flac", "artist":"Mumford and Sons", "album":"alllllvin", "genre":"alternative", "title":"The Cave", "isdir": false},' +
							'{"name":"the_cave.flac", "path":"/media/internal/path4", "artist":"Leonard Skinner", "album":"alllllvin", "genre":"classic rock", "title":"Freebird", "isdir": false},' +
							'{"name":"5555", "path":"/media/internal", "artist":"Sting", "album":"Sting", "genre":"contemporary", "title":"Fields of Gold", "isdir": false},' +
							'{"name":"666666666666", "path":"/media/internal/path5", "artist":"Queen", "album":"alllllvin", "genre":"rock", "title":"I Want To Break Free", "isdir": false},' +
							'{"name":"hhehrtt", "path":"/media/internal/path6", "artist":"Led Zepplin", "album":"", "genre":"classic rock", "title":"Stairway To Heaven", "isdir": false},' +
							'{"name":"88", "path":"/media/internal/path7", "artist":"Kanasas", "album":"alllllvin", "genre":"classic rock", "title":"Dust in the wind", "isdir": false},' +
							'{"name":"999999999", "path":"/media/internal/path8", "artist":"Queen", "album":"", "genre":"", "title":"Highlander Theme Song", "isdir": false},' +
							'{"name":"aaaaaaaa", "path":"/media/internal/path9", "artist":"", "album":"", "genre":"", "title":"The Simpsons theme", "isdir": false},' +
							'{"name":"hhfdgfdi sdfgh", "path":"/media/internal/path10", "artist":"Britney", "album":"alllllvin", "genre":"pop", "title":"Hit Me Baby One More Time", "isdir": false},' +
							'{"name":"cccccc", "path":"/media/internal/path11", "artist":"The Killers", "album":"alllllvin", "genre":"pop", "title":"Mr. Brightside", "isdir": false},' +
							'{"name":"ddddddd", "path":"/media/internal/path12", "artist":"Lady Gaga", "album":"alllllvin", "genre":"pop", "title":"Poker Face", "isdir": false},' +
							'{"name":"tytttyyty", "path":"/media/internal/path13", "artist":"Cartman", "album":"", "genre":"", "title":"Cartman doing poker face", "isdir": false},' +
							'{"name":"fff ffff ffff", "path":"/media/internal/path14", "artist":"Bruce", "album":"", "genre":"rock", "title":"Born in the U.S.A.", "isdir": false},' +
							'{"name":"jjkjkjkkkl jjkjuu", "path":"/media/internal/path15", "artist":"", "album":"alllllvin", "genre":"classical", "title":"Winter", "isdir": false},' +
							'{"name":"vvfvvfvf", "path":"/media/internal/path16", "artist":"Tori Amos", "album":"alllllvin", "genre":"pop", "title":"Crucify", "isdir": false},' +
							'{"name":"hhyhyy", "path":"/media/internal/path17", "artist":"", "album":"alllllvin", "genre":"techno", "title":"Crucify (remix)", "isdir": false},' + 
							'{"name":"xzdffffef snhhn", "path":"/media/internal/path18", "artist":"Groove Coverage", "album":"alllllvin", "genre":"techno", "title":"Poison", "isdir": false},' +
							'{"name":"adjfk kk", "path":"/media/internal/path19", "artist":"Groove Coverage", "album":"alllllvin", "genre":"techno", "title":"20th Century Digital Girl", "isdir": false}' +
						']}');
			};
			
			this.plugIn.iTestVar = 0;
			
			this.plugIn.Open = function()	
			{
				objwAMP.plugIn.iTestVar = 0;
				objwAMP.plugIn.bNextSet = false;
			
				setTimeout(function() 
						  {
							objwAMP.plugIn.StartSong();
						  }, 100);
			};
			
			
			this.plugIn.SetNext = function() 
			{
				objwAMP.plugIn.bNextSet = true;
			};
			this.plugIn.Play = function() 
			{
				objwAMP.plugIn.intervalTest = setInterval(function () {							
							objwAMP.plugIn.iTestVar++;
							
							if (objwAMP.plugIn.iTestVar > 28)
							{
								if (objwAMP.plugIn.bNextSet == true)
								{
									objwAMP.plugIn.StartSong();
									objwAMP.plugIn.iTestVar = 0;
									objwAMP.plugIn.strSongState = "101";
									objwAMP.plugIn.bNextSet = false;
								}
								else
								{
									objwAMP.plugIn.strSongState = "103";
								}
							}
							
							objScrub.setCurTime(objwAMP.plugIn.iTestVar);
						}, 1000);
			};
			this.plugIn.Pause = function() 
			{
				clearInterval(objwAMP.plugIn.intervalTest);
			};
			this.plugIn.GetState = function() 
			{
				return '{"CurPos":' + Number(objwAMP.plugIn.iTestVar).toString() + 
					   ', "SongState":' + objwAMP.plugIn.strSongState +
					   ', "EndAmt":28, "NextSongState":107}';
			};
			this.plugIn.SetSpeed = function() {};
			this.plugIn.SetVol = function() {};
			this.plugIn.SetTreble = function() {};
			this.plugIn.SetBass = function() {};
			this.plugIn.Seek = function(iTime) {objwAMP.plugIn.iTestVar = iTime;};
		}
	},

	
	/*****************************
	 * Rerun the indexer
	 *****************************/
	RedoIndexer: function()
	{
		this.plugIn.RedoIndex();
	},
	
	
	/******************************
	 * Create the plugin html object code
	 ******************************/
	CreatePluginHook: function()
	{
	    this.pluginObj = window.document.createElement("object");
    
		this.pluginObj.id = "wAMPPlugin";
		this.pluginObj.type = "application/x-palm-remote";
		this.pluginObj.setAttribute("style", 
									"position:fixed; top:470px; left:0px; height:1px; width:1px;");
		this.pluginObj['x-palm-pass-event'] = true;
    
        var param1 = window.document.createElement("param");
		param1.name = "appid";
		param1.value = "org.epikmayo.audiophile";
		
		var param2 = window.document.createElement("param");
		param2.name = "exe";
		param2.value = "wAMP_plugin";
		
		this.pluginObj.appendChild(param1);
		this.pluginObj.appendChild(param2);
	
		this.df = window.document.createDocumentFragment();
		this.df.appendChild(this.pluginObj);
		
		console.log("Finished creating plugin obj");
		
	},
	
	FinishPluginInit: function()
	{
		$('body').append(objwAMP._df);
	},
	
	/******************************
	 * Helper Debug function
	 ******************************/
	Log: function(str, obj)
	{
		console.log(str);
		
		if (obj)
		{
			console.log(JSON.stringify(obj));
		}
	},
	
	/******************************
	 * This function is checks whether the plugin has been
	 *	loaded yet or not
	 *
	 * Returns true - if loaded / false - if not loaded yet
	 ******************************/
	checkIfPluginInit: function()
	{
		try
		{
			//console.log("Start Here");
			if (this.plugIn.Ping)
			{
				//console.log("Better if we get here");
				if (this.plugIn.Ping() == "Pong")
				{
					//console.log("At least we are getting here");
					return true;
				}
				else
				{
					//console.log("No response to Ping");
					return false;
				}
			}
			else
			{
				//console.log("Ping hook not available");
				return false;
			}
		}
		catch (err) 
		{
			console.log(err);
			return false;
		}
	},
	
	/******************************
	 * Run the indexer for the first time
	 ******************************/
	RunIndexer: function()
	{
		var strJSON = 0
		try
		{
			strJSON = this.plugIn.GetFullIndex();
			
		}
		catch (err) {console.log(err);}
		
		return strJSON;
	},

	
	/******************************
	 * Check if the index was previously run
	 ******************************/
	GetIndexerStatus: function()
	{
		var strJSON = this.RunIndexer();
		
		if (!strJSON)
		{
			this.jsonIndex = new Object();
			this.jsonIndex.iIndexingStatus = 0;
			return this.jsonIndex;
		}
		
		// We get here if there was something in the JSON string, so parse it
		try
		{
			this.jsonIndex = JSON.parse(strJSON);
		} 
		catch(e) 
		{
			console.log(e);
			this.jsonIndex = new Object();
			this.jsonIndex.iIndexingStatus = -1;
		}
		return this.jsonIndex;
	},
	
	/******************************
	 * This function gets the ls of whatever the current dir is set to
	 *
	 * Returns: An array of objects which is made up of
	 *			the songs and dirs in a particular file
	 ******************************/
	getDirFileList: function()
	{
		
		try
		{
			// Check if we have already visited this dir previously
			if (this.objectLsCache[this.strCurrentPath])
			{
				// If we have, just return what we found before
				return this.objectLsCache[this.strCurrentPath];
			}
			else
			{	
				// this is the first time we have visited this dir
				//	so build the ls of it
			
				var objCache = new Object;
				
				// Seperate everything into three arrays, dirs/playbel/unknown
				objCache.Dir = new Array();
				objCache.Playable = new Array();
				objCache.Unknown = new Array();
				
			
				// Have the plugin get the info for the available files
				//	and pass it to the js app via JSON formatted string
				var strJSON = this.plugIn.GetCurrentDirLS(this.strCurrentPath);
			
				//this.Log(strJSON);
			
				// If our return string is NULL, it means that no sub dirs exist
				//	and no songs exist in that folder, so create an item to go up
				//	one dir
				if (!strJSON)
				{
					var objAppendItem = {
						isdir : true,
						name : "No Song Files Found\nClick to return to previous dir",
						path : this.strCurrentPath.substr(0,this.strCurrentPath.lastIndexOf("/"))
					};
					
					objCache.Dir.push(objAppendItem);
					
					this.objectLsCache[this.strCurrentPath] = objCache;
					return this.objectLsCache[this.strCurrentPath];
				}
			
				// We get here if there was something in the JSON string, so parse it
				var jsonFileList = JSON.parse(strJSON);
				
				// If the current directory is not the root dir, then provide
				//	a method for going up one dir
				if (this.strCurrentPath !== "/media/internal")
				{
					var objAppendItem = {
						artist : "",
						album : "",
						genre : "",
						title : "",
						isdir : true,
						name : "..",
						path : this.strCurrentPath.substr(0,this.strCurrentPath.lastIndexOf("/"))
					};
					
					objCache.Dir.push(objAppendItem);
				}
				
				for (var i=0; i < jsonFileList.arrayFileList.length; i++)
				{
					if (jsonFileList.arrayFileList[i].isdir)
					{
						objCache.Dir.push(jsonFileList.arrayFileList[i]);
						continue;
					}
					
					var iIndex = jsonFileList.arrayFileList[i].name.lastIndexOf(".")
					
					if (iIndex == -1)
					{
						objCache.Unknown.push(jsonFileList.arrayFileList[i]);
						continue;
					}
					
					var strExt = jsonFileList.arrayFileList[i].name.slice(iIndex).toLowerCase();
					var bIsPlayable = false;
					
					for (var j = 0; j < this.arrayExtList.length; j++) 
					{
					
						if (this.arrayExtList[j] == strExt) 
						{
							bIsPlayable = true;
							break; 
						}
					}
				
					if (bIsPlayable)
						objCache.Playable.push(jsonFileList.arrayFileList[i]);
					else
						objCache.Unknown.push(jsonFileList.arrayFileList[i]);
				
				}
				
				this.objectLsCache[this.strCurrentPath] = objCache;
				return this.objectLsCache[this.strCurrentPath];
			}
		}
		catch (err) {console.log(err);}
		
	},
	
	
	/******************************
	 * This function gets the current path for folder ls
	 *
	 * Returns: A string with the current path
	 ******************************/
	getCurrentPath: function()
	{
		return this.strCurrentPath;
	},
	/******************************
	 * This function sets the current path for folder ls
	 *
	 * Returns: None
	 ******************************/
	setCurrentPath: function(strDir)
	{
		this.strCurrentPath = strDir;
	},
	
	 /******************************
	  * Deal with playback mode
	  * var PLAY_MODE_NORMAL = 0;
	  * var PLAY_MODE_REPEAT = 0;
	  * var PLAY_MODE_SHUFFLE = 0;
	  ******************************/
	SetMode: function(iMode)
	{
		switch(iMode)
		{
			case PLAY_MODE_SHUFFLE:
				this.bShuffle = true;
				this.bRepeat = false;
				break;
			case PLAY_MODE_REPEAT:
				this.bShuffle = false;
				this.bRepeat = true;
				break;
			case PLAY_MODE_NORMAL:
				this.bShuffle = false;
				this.bRepeat = false;	
		}
		
		this.SetNextSong();
	},
	GetMode: function()
	{
		if (this.bShuffle == true)
			return PLAY_MODE_SHUFFLE;
		else if (this.bRepeat == true)
			return PLAY_MODE_REPEAT;
		else
			return PLAY_MODE_NORMAL;
	},
	
	
	 /*******************************
	 * Tell the plugin to pause
	 *******************************/
	pause: function()
	{
		this.plugIn.Pause();
	},
	 
	 /*******************************
	 * Tell the plugin to play
	 *******************************/
	play: function()
	{
		this.plugIn.Play();
	},
	  

	/*******************************
	 * This function gets the current state
	 *******************************/
	getState: function()
	{
		var StateString = this.plugIn.GetState();
		
		this.objPluginState = JSON.parse(StateString);
		
		return this.objPluginState;
	},
	 
	/*******************************
	 * Set the speed control
	 *******************************/
	SetSpeed: function(fSpeed)
	{
		this.plugIn.SetSpeed(fSpeed);
	},
	 
	 /*******************************
	 * Set the vol control
	 *******************************/
	SetVol: function(fVol)
	{
		this.plugIn.SetVol(fVol);
	},
	 
	/*******************************
	 * Set the treble control
	 *******************************/
	SetTreble: function(fTreb)
	{
		this.plugIn.SetTreble(fTreb);
	},
	 
	 /*******************************
	 * Set the bass control
	 *******************************/
	SetBass: function(fBass)
	{
		this.plugIn.SetBass(fBass);
	},

	 /*******************************
	 * Set the midrange control
	 *******************************/
	SetMid: function(fMid)
	{
		this.plugIn.SetMid(fMid);
	},
	
	 /*******************************
	 * Seek a part of the song
	 *******************************/
	Seek: function(iNewTime, funcFinishFunc)
	{
		this.funcSeekFinishFunc = funcFinishFunc;
		this.plugIn.Seek(iNewTime);
	}, 


	
	/*********************************
	 * Callback function called by the plugin to
	 *	let the javascript know when a song has started.
	 *********************************/
	StartSong: function(strJSON)
	{	
		objwAMP.strJSON = strJSON;
		
		console.log('In callback');
		
		setTimeout(function()
		{
			objwAMP.AvoidPluginCall()
		}, 1);
	},
	/*********************************
	 * Need this to avoid calling the plugin
	 *  from the plugin callback
	 *********************************/
	AvoidPluginCall: function()
	{	

		var bJSONParseGood = false
		
		try
		{
			this.objSongInfo = JSON.parse(objwAMP.strJSON);
			bJSONParseGood = true;
		}
		catch(e) {console.log("No luck with JSON: " + objwAMP.strJSON);}
		
		if ((bJSONParseGood) && this.objSongInfo["error"])
		{
			this.OpenNextSong();
			return;
		}
		
		if (this.iOpenIndex == -1)
			this.SetIndex(this.iNextIndex);
		else
		{
			this.SetIndex(this.iOpenIndex);
			this.iOpenIndex = -1;
		}
		
		this.SetNextSong();
		var strName;
		var strArtist;
		
		// Given the choice, use the most recent song metadata info
		if (bJSONParseGood == true)
		{
			if (this.objSongInfo.Metadata.title)
				strName = this.objSongInfo.Metadata.title;
			else
				strName = this.objSongInfo.name;
			
			if (this.objSongInfo.Metadata.artist)
				strArtist = this.objSongInfo.Metadata.artist;
			else
				strArtist = this.objSongInfo.path;
		
		}
		else
		{
		
			if (this.arrayPlaylist[this.GetIndex()].title)
				strName = this.arrayPlaylist[this.GetIndex()].title;
			else
				strName = this.arrayPlaylist[this.GetIndex()].name;
			
			if (this.arrayPlaylist[this.iSongIndex].artist)
				strArtist = this.arrayPlaylist[this.iSongIndex].artist;
			else
				strArtist = this.arrayPlaylist[this.iSongIndex].path;
		}

		$('#nameGoesHere').text(strName);
		$('#artistGoesHere').text(strArtist);
		
		$('.songlistener').trigger('songtrans');
	},
	
	/******************************
	 * Callback for reindex
	 ******************************/
	FinishIndex: function(strJSON)
	{	
		objwAMP.strIndexJSON = strJSON;
		
		setTimeout(function()
		{
			objwAMP.AvoidIndexPluginCall()
		}, 1);
	},
	/*********************************
	 * Need this to avoid calling the plugin
	 *  from the plugin callback
	 *********************************/
	AvoidIndexPluginCall: function()
	{
		this.jsonIndex = JSON.parse(this.strIndexJSON);
		objSongIndex.addArray(this.jsonIndex.arrayFileList);
		$('#idButtonGoesHere').show();
	},
	
	/*******************************
	 * Called after plugin finishes seeking
	 *******************************/
	FinishSeek: function(strNewTime)
	{
		objwAMP.strNewSeekTime = strNewTime;
		setTimeout(function()
		{
			objwAMP.AvoidSeekPluginCall()
		}, 1);
	},
	/*********************************
	 * Need this to avoid calling the plugin
	 *  from the plugin callback
	 *********************************/
	AvoidSeekPluginCall: function()
	{
		var iRet = parseFloat(objwAMP.strNewSeekTime);
		if (isNaN(iRet))
		{
			console.log(objwAMP.strNewSeekTime);
			iRet = 0;
		}
		this.funcSeekFinishFunc(iRet);
	},
	
	
	
	/******************************
	 * Gets the file list based on which option we are using
	 ******************************/
	getPlayList: function()
	{
		if (!(this.arrayPlaylist))
			this.arrayPlaylist = new Array();
	
		return this.arrayPlaylist
	},
	/*************************************
	 * Empty the playlist
	 *************************************/
	emptyPlaylist: function()
	{
		this.arrayPlaylist = 0;
		this.SetIndex(0);
	},
		
	setPlayList: function(arraySongs)
	{
		this.arrayPlaylist = arraySongs;
	},

	AddSong: function(objSong, iPosition)
	{
		if (iPosition)
		{
			switch (iPosition)
			{
			case PLAYLIST_POS_END:
				this.AddSongToPlaylist(objSong);
				break;
			case PLAYLIST_POS_NEXT:
				this.AddSongNext(objSong);
				break
			default:
				this.arrayPlaylist.splice(iPosition,
										  0,
										  objSong);
				this.SetNextSong();
			}
		}
		else
			AddSongToPlaylist(objSong);
	},
	
	AddSongToPlaylist: function(objSong)
	{
		if (!this.arrayPlaylist)
		{
			this.arrayPlaylist = new Array();
			this.arrayPlaylist.push(objSong);
			this.OpenSong(0);
		}
		else
			this.arrayPlaylist.push(objSong);
		
		this.SetNextSong();
	},
	
	AddSongNext: function(objSong)
	{
		if (!this.arrayPlaylist)
		{
			this.AddSongToPlayList(objSong);
		}
		else
		{
			var iCurIndex = this.GetIndex();
		
			this.arrayPlaylist.splice(iCurIndex + 1,
									0,
									objSong);
			this.SetNextSong(iCurIndex + 1);
		}
		
	},
	
	AddSongNow: function(objSong)
	{
		if (!this.arrayPlaylist)
		{
			this.AddSongToPlayList(objSong);
		}
		else
		{
			this.arrayPlaylist.splice(this.GetIndex(),
									0,
									objSong);
			this.OpenSong();
		}
		
	},
	
	setSongTransitionType: function (strTransition)
	{
		var fTransition = parseFloat(strTransition);
		this.fTransition = Number(fTransition).toFixed(1);
		console.log("New transition is: " + this.fTransition);
	},
	
	/******************************
	 * Tell the plugin handler which song to start playing
	 ******************************/
	SetIndex: function(iIndex)
	{
		this.iSongIndex = iIndex;
	},
	GetIndex: function()
	{
		return this.iSongIndex;
	},
	
	 
	/******************************
	 * Tell the plugin handler which song to start playing
	 ******************************/	
	GetNextIndex: function()
	{
	
		if (!(this.arrayPlaylist))
			return -1;
	
		var iRet = this.GetIndex();
	
		if (this.bShuffle == true)
			iRet = Math.floor(Math.random()*this.arrayPlaylist.length);
		else
		{
			iRet++;
			if (this.bRepeat == true)
				iRet = iRet % this.arrayPlaylist.length;
			else
			{
				if (iRet >= this.arrayPlaylist.length)
					return -1;
			}
		}
		
		return iRet;
	},
	 
	 /******************************
	 * Tell the plugin handler which song to start playing
	 ******************************/
	 getPreviousIndex: function()
	 {
		if (!(this.arrayPlaylist))
			return -1;	 
	 
		var iRet = this.GetIndex();

		if (his.bShuffle == true)
			iRet = Math.floor(Math.random()*this.arrayPlaylist.length);
		else
		{
			iRet--;
			if (iRet < 0)
			{
				if (this.bRepeat)
					iRet = this.arrayPlaylist.length - 1;
				else
					iRet = 0;
			}
		}	

		return iRet;
	 },
	 
	 
	/*******************************
	 * Tell the plugin to load the song at the current index
	 * 	or you can pass it an index variable
	 *******************************/
	 OpenSong: function(iIndex)
	 {	 
		if (typeof(iIndex) != "undefined")
		{
			if (iIndex >= this.arrayPlaylist.length)
				iIndex = this.arrayPlaylist.length - 1;
			this.SetIndex(iIndex);
		}
			
		this.plugIn.Open(this.arrayPlaylist[this.GetIndex()].path);
		this.iOpenIndex = this.GetIndex();
	 },
	
	
	/*******************************
	 * Tell the plugin to use a new next song
	 *******************************/
	SetNextSong: function(iIndex)
	{	
		if (!this.arrayPlaylist || !this.arrayPlaylist.length)
			return;
	
		if (iIndex)
		{
			if (iIndex == -1)
				return;
		
			this.plugIn.SetNext(this.arrayPlaylist[iIndex].path);
			this.iNextIndex = iIndex;
			return;
		}
	
		var iNextIndex = this.GetNextIndex();
		
		if (iNextIndex == -1)
			return;
		
		this.plugIn.SetNext(this.arrayPlaylist[iNextIndex].path, 
								Number(this.fTransition).toFixed(1));
		this.iNextIndex = iNextIndex;
	},

	
	 /*******************************
	 * Tell the plugin to Play the next song
	 *******************************/
	 OpenNextSong: function()
	 {
		var iNextIndex = this.GetNextIndex();
		
		if (iNextIndex == -1)
		{
			scenePlay.ForcePause();
		}
		else
		{
			this.SetIndex(iNextIndex);
			this.plugIn.Open(this.arrayPlaylist[this.GetIndex()].path);
			this.iOpenIndex = this.GetIndex();
		}

	},
		
	 
	 /*******************************
	 * Tell the plugin to play the previous song
	 *******************************/
	OpenPrevSong: function()
	{
		var iPrevIndex = this.getPreviousIndex();
	 
	 	if (iNextIndex == -1)
		{
			scenePlay.ForcePause();
		}
		else
		{
			this.SetIndex(iPrevIndex);
			this.plugIn.Open(this.arrayPlaylist[iPrevIndex].path);
			this.iOpenIndex = this.GetIndex();
		}
	}
}
