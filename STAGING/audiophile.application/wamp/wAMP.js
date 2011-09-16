/***********************************
 * wAMP() - Handler Object for the Plugin
 *
 * This object is designed to handle interfacing with the plugin.
 *	because of the way Luna handles hybrid apps, it cannot just
 *	be set it and forget it at this point.  But it is meant to be
 *	as close as possible to that.
 ************************************/
 
 var Mojo = new Object;
 
// Stupid javascript for not having constants stuff
var LIST_TYPE_FF		= true;
var LIST_TYPE_INDEX 	= false;

// these are the status of the index
var INDEX_NOT_READY_YET = 0;
var INDEX_ALREADY_RUN 	= 1;
var INDEX_FAILED_LOAD 	= 3;

var PLAY_MODE_NORMAL 	= 0;
var PLAY_MODE_REPEAT 	= 1;
var PLAY_MODE_SHUFFLE 	= 2;

var PLAYLIST_POS_END 	= -1;
var PLAYLIST_POS_NEXT 	= -2;

// Create Global "extend" method
function Extend(obj, extObj) 
{
    if (arguments.length > 2) 
	{
        for (var a = 1; a < arguments.length; a++) 
		{
			for (var i in arguments[a]) 
			{
				obj[i] = arguments[a][i];
			}
        }
    } 
	else 
	{
        for (var i in extObj) 
		{
            obj[i] = extObj[i];
        }
    }
    return obj;
};

function GetTransformPoint(el) 
{
    // get the computed style object for the element
    var style = window.getComputedStyle(domElement);
    // this string will be in the form 'matrix(a, b, c, d, tx, ty)'
    var transformString = style['-webkit-transform']
                       || style['-moz-transform']
                       || style['transform'] ;
    if (!transformString || transformString == 'none')
        return 0;
    var splits = transformString.split(',');
	return {"top": splits[5],
			"left": splits[4]};
}

function GetTransformLeft(el) 
{
    // get the computed style object for the element
    var style = window.getComputedStyle(domElement);
    // this string will be in the form 'matrix(a, b, c, d, tx, ty)'
    var transformString = style['-webkit-transform']
                       || style['-moz-transform']
                       || style['transform'] ;
    if (!transformString || transformString == 'none')
        return 0;
    var splits = transformString.split(',');
	return splits[4];
}

function GetTransformTop(el)
{
    // get the computed style object for the element
    var style = window.getComputedStyle(domElement);
    // this string will be in the form 'matrix(a, b, c, d, tx, ty)'
    var transformString = style['-webkit-transform']
                       || style['-moz-transform']
                       || style['transform'] ;
    if (!transformString || transformString == 'none')
        return 0;
    var splits = transformString.split(',');
	return splits[5];
} 

function DomOffsetCalc(el, iAdjLeft, iAdjTop) 
{
	var left = el.offsetLeft,
		top = el.offsetTop;
		
	while (el = el.offsetParent) {
		left += el.offsetLeft;
		top += el.offsetTop;
	} 

	if (iAdjLeft)
		left = left + iAdjLeft 
	
	if (iAdjTop)
		top = top + iAdjTop;
	
	return { left: left, top: top };
}
	
function DomOffsetTopCalc(el, iAdjTop) {
	var top = el.offsetTop;
		
	while (el = el.offsetParent) {
		top += el.offsetTop;
	} 

	if (iAdjTop)
		top = top + iAdjTop;
	
	return top;
}

function DomOffsetLeftCalc(el, iAdjLeft) 
{
	var left = el.offsetLeft;
		
	while (el = el.offsetParent) {
		left += el.offsetLeft;
	} 

	if (iAdjLeft)
		left = left + iAdjLeft
	
	return left;
}


function Filter(array, fun)
{
    var t = Object(array);
    var len = t.length >>> 0;

    var res = [];
    for (var i = 0; i < len; i++)
    {
      if (i in t)
      {
        if (fun(t[i]))
          res.push(t[i]);
      }
    }

    return res;
};



// Production steps of ECMA-262, Edition 5, 15.4.4.19
// Reference: http://es5.github.com/#x15.4.4.19
if (!Array.prototype.map) {
  Array.prototype.map = function(callback, thisArg) {

    var T, A, k;

    if (this == null) {
      throw new TypeError(" this is null or not defined");
    }

    // 1. Let O be the result of calling ToObject passing the |this| value as the argument.
    var O = Object(this);

    // 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".
    // 3. Let len be ToUint32(lenValue).
    var len = O.length >>> 0;

    // 4. If IsCallable(callback) is false, throw a TypeError exception.
    // See: http://es5.github.com/#x9.11
    if ({}.toString.call(callback) != "[object Function]") {
      throw new TypeError(callback + " is not a function");
    }

    // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
    if (thisArg) {
      T = thisArg;
    }

    // 6. Let A be a new array created as if by the expression new Array(len) where Array is
    // the standard built-in constructor with that name and len is the value of len.
    A = new Array(len);

    // 7. Let k be 0
    k = 0;

    // 8. Repeat, while k < len
    while(k < len) {

      var kValue, mappedValue;

      // a. Let Pk be ToString(k).
      //   This is implicit for LHS operands of the in operator
      // b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.
      //   This step can be combined with c
      // c. If kPresent is true, then
      if (k in O) {

        // i. Let kValue be the result of calling the Get internal method of O with argument Pk.
        kValue = O[ k ];

        // ii. Let mappedValue be the result of calling the Call internal method of callback
        // with T as the this value and argument list containing kValue, k, and O.
        mappedValue = callback.call(T, kValue, k, O);

        // iii. Call the DefineOwnProperty internal method of A with arguments
        // Pk, Property Descriptor {Value: mappedValue, Writable: true, Enumerable: true, Configurable: true},
        // and false.

        // In browsers that support Object.defineProperty, use the following:
        // Object.defineProperty(A, Pk, { value: mappedValue, writable: true, enumerable: true, configurable: true });

        // For best browser support, use the following:
        A[ k ] = mappedValue;
      }
      // d. Increase k by 1.
      k++;
    }

    // 9. return A
    return A;
  };      
}

// Fast implementation for array unique
//	modified to select for the particular song property
UniqueArray = function(array, strProp) 
{
	if (strProp)
	{
		r = new Array();
		var o = {}, i, l = array.length;
        for(i=0; i<l;i+=1)
		{
		
			try
			{
				o[array[i][strProp].toLowerCase()] = array[i];
			} catch(e) 
			{
				console.log("What is killing us: " + array[i][strProp]);
				console.log("Issue with unique: " + strProp);
				console.log("Let's just check: " + array[i].path);
			}
		}
        for(i in o)
		{	
			var obj = new Object();
			obj = o[i];
			r.push(obj);
		}
        return r;
	}
	else
	{
		r = new Array();
		var o = {}, i, l = array.length;
        for(i=0; i<l;i+=1)
		{
			try
			{
				o[array[i].toLowerCase()] = array[i];
			} catch (e) {}
		}
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
SortArray = function(arraySongs)
{
	var newArray = arraySongs.slice(0);

	newArray.sort(function(a, b)
					{
						var strA;
						var strB;
						
						try
						{
							strA=a.toLowerCase();
						} catch(e) {return 1;};
						
						try
						{
							strB=b.toLowerCase();
						} catch(e) {return -1;};
						
						// Make sure the Unknown Tag is last
						if (strA == '[unknown]')
							return 1;
						if (strB == '[unknown]')
							return -1;
						
						if (strA < strB) //sort string ascending
							return -1;
						if (strA > strB)
							return 1;
						return 0; //default return value (no sorting)
					});
	
	return newArray;
};

SortArrayInvF = function(arraySongs)
{
	var newArray = arraySongs.slice(0);

	newArray.sort(function(a, b)
					{
						if ((!a) || (a == '[Unknown]'))
							return -1;
						if ((!b) || (b == '[Unknown]'))
							return 1;

						return b.toLowerCase().localeCompare(a.toLowerCase());
					});
	
	return newArray;
};

SortArrayByParam = function(arraySongs, strParam, bCaseSensative)
{
	var newArray = arraySongs.slice(0);

	newArray.sort(function(a, b)
					{
						var strA;
						var strB;
						
						if (!a)
							return 1;
						if (!b)
							return -1;
						
						if (bCaseSensative)
						{
							strA=a[strParam]; 
							strB=b[strParam];
						}
						else
						{
							try
							{
								strA=a[strParam].toLowerCase();
							} catch(e) {return 1;};
							
							try
							{
								strB=b[strParam].toLowerCase();
							} catch(e) {return -1;};
						}
						
						// Make sure the Unknown Tag is last
						if (strA == '[unknown]')
							return 1;
						if (strB == '[unknown]')
							return -1;
						
						if (strA < strB) //sort string ascending
							return -1;
						if (strA > strB)
							return 1;
						return 0; //default return value (no sorting)
					});
	
	return newArray;
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

String.prototype.ReplaceAll = function(replace, with_this) 
{
	var str;
	
	try
	{
		str = this.replace(new RegExp(replace, 'g'),with_this);
	}
	catch (e)
	{
		str = this;
		
		// reg expression failed, so have to do it the slow way
		while (str.indexOf(replace) != -1)
		{
			str = str.replace(replace, with_this);
		}
	}
		
	return str;
}

var arrayKeepAlive = new Array();

/***************************
 * Call a Palm Service
 ***************************/

 
 
 function CallPalmService(strService, 
						 objParam, 
						 subscribe, 
						 funcCallback, 
						 funcError,
						 funcFakeIt)
{
	if (window.PalmSystem) 
	{
		//console.log("Calling System Service: " + strService);
	
		var reqObject = new PalmServiceBridge();
		
		arrayKeepAlive.push(reqObject);
		
		reqObject.tempCircRef = (Math.random()*9999) | 0;
		
		//console.log("Service:" + strService + " has num:" + reqObject.tempCircRef);
		
		if (subscribe)
		{
			objParam.subscribe = true;
		}
		else
		{
			if (objParam.subscribe)
			{
				objParam.subscribe = null;
				delete objParam.subscribe;
			}
		}
		
		objParam.$activity = {
			activityId: window.PalmSystem.activityId
		};

		objParam = JSON.stringify(objParam);
		reqObject.funcError = funcError;
		reqObject.funcCallback = funcCallback;
		reqObject.onservicecallback = function(status) 
		{
			//console.log("Service callback:" + reqObject.tempCircRef);
		
			try
			{
				status = JSON.parse(status);
				//console.log(JSON.stringify(status));
			}
			catch(e) 
			{
				if (reqObject.funcError)
					reqObject.funcError(e);
				else
					console.log(e);
				return;
			};
			
			if (reqObject.funcError)
			{
				if (status.errorCode || status.returnValue == false)
				{
					reqObject.funcError(status);
					return;
				}
			}
			
			if (reqObject.funcCallback)
				reqObject.funcCallback(status);
		};
		try
		{
			reqObject.call(strService, objParam);
		} catch(e) 
		{
			console.log("Call Serv Err:" + e);
		}
	}
	else
	{
		if (funcFakeIt)
			setTimeout(funcFakeIt(), 500);
	}
}

var timeTmp = 0;
var curMethod = 0;
function ProfilerStart(str)
{
	console.log("--S-Profiler for[" + str + "]");
	curMethod = str;
	timeTmp = (new Date()).getTime();
}

function ProfilerTick()
{
	console.log((new Date()).getTime() - timeTmp);
}

function ProfilerTickAndRestart(str)
{
	var tmp = (new Date()).getTime();
	console.log("**E*(" + curMethod + "):" + (tmp - timeTmp));
	curMethod = str;
	console.log("--S-[" + str + "]");
	timeTmp = (new Date()).getTime();
}

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
var OPT_ID_TRANS = 4;
var OPT_ID_HEADPHONE_IN = 5;
var OPT_ID_HEADPHONE_OUT = 6;

var ORIENTATION_UNLOCKED 	= 0;
var ORIENTATION_PORTRAIT 	= 1;
var ORIENTATION_LANDSCAPE	= 2;

var BACK_PICTURE = -1;

var objOptions = 
{

	optUseBreadC: true,
	dbOptions: 0,
	fBass: 0.5,
	fTreble: 0.5,
	bOptVis: false,
	iOrientationMode: ORIENTATION_UNLOCKED,
	skinNum: 0,
	skinOldSkin: 0,
	fSongTransition: 0.0,
	
	PickNextSkin: function()
	{
		if (this.skinNum == BACK_PICTURE)
		{
			$('body').removeClass('skinBG');
			this.skinNum = this.skinOldSkin;
		}
		
		this.skinOldSkin = this.skinNum;
		this.skinNum = ++this.skinNum % arraySkins.length;		
		console.log("Skin Num: " + this.skinNum);
		console.log("Skin Name: " + arraySkins[this.skinNum]);
		
		this.UpdateOption(OPT_ID_SKIN, this.skinNum);
		this.SetSkin();
	},
	
	SetBGImg: function()
	{
		this.UpdateOption(OPT_ID_SKIN, "-1");
	
		this.skinOldSkin = this.skinNum;
		$('body').removeClass(arraySkins[this.skinNum]);
		this.skinNum = BACK_PICTURE;
		
		var reqObject = new PalmServiceBridge();
		
		var parameters = {
            "keys":["wallpaper"],
            "subscribe":false
         	};
		parameters.$activity = {
			activityId: window.PalmSystem.activityId
		};
		
		parameters = JSON.stringify(parameters);
		reqObject.onservicecallback = function(responseData) 
		{
			responseData = JSON.parse(responseData);
			
			console.log(JSON.stringify(responseData));
			
			if (responseData.wallpaper)
			{
				$('#idShowImgBG').css("background-image",
							  "url(file://" +
								responseData.wallpaper.wallpaperFile +
								")");
				$('body').addClass('skinBG');
			}
		};
		reqObject.call('palm://com.palm.systemservice/getPreferences', parameters );
	},
	
	SetSkin: function()
	{
		try
		{			
			$('body').removeClass(arraySkins[this.skinOldSkin]);
			$('body').addClass(arraySkins[this.skinNum]);
		}
		catch(e) {console.log("Error in setting theme: " + e);}
	},
	
	GetDeviceInfo: function()
	{
		if (window.PalmSystem) 
		{
			var objDeviceInfo = JSON.parse(window.PalmSystem.deviceInfo);
		   
			if (objDeviceInfo.screenHeight < 470)
			{
				$('body').addClass("classVeer");
			}
			else if (objDeviceInfo.screenHeight < 490)
			{
				$('body').addClass("classPre");
			}
			else if (objDeviceInfo.screenWidth < 500)
			{
				$('body').addClass("classPreThree");
			}
			else
			{
				$('body').addClass("classTouchPad");
			}
		}
		
		//$('body').addClass("classVeer");
	},
		
	GetOrientation: function()
	{
		if (this.iOrientationMode == ORIENTATION_PORTRAIT)
			return "portrait";
		else if (this.iOrientationMode == ORIENTATION_LANDSCAPE)
			return "landscape";
		else
		{
			var strCurOrientation = "landscape";
			if (window.PalmSystem)
			{
				strCurOrientation = window.PalmSystem.screenOrientation;
			
				if (strCurOrientation == "up" || strCurOrientation == "down")
					return "landscape";
				else
					return "portrait";
			}
			else
			{
				if (window.innerWidth > 8500)
					return "landscape";
				else
					return "portrait";
			}
		}
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
											objOptions.skinNum = Number(row['val']);
											if (objOptions.skinNum == -1)
												objOptions.SetBGImg();
											else
												objOptions.SetSkin();
											break;
										case OPT_ID_BASS:
											objOptions.fBass = Number(row['val']);
											objwAMP.SetBass(objOptions.fBass * 2);
											break;
										case OPT_ID_TREB:
											objOptions.fTreble = Number(row['val']);
											objwAMP.SetTreble(objOptions.fTreble * 2);
											break;
										case OPT_ID_TRANS:
											objOptions.fSongTransition = Number(row['val']);
											objwAMP.SetSongTransition(objOptions.fSongTransition);
											break;
										case OPT_ID_HEADPHONE_OUT:
											scenePlay.iPauseOnHOut = Number(row['val']);
											break;
										case OPT_ID_HEADPHONE_IN:
											scenePlay.iPlayOnHIn = Number(row['val']);
											break;
										}
									}
									
								}	
							},
							function(transaction, error) 
							{
								console.log("Could not read: " + error.message);
							});
		});

	},

	
	SetDefaults: function()
	{
		this.dbOptions.transaction(function (sql) 
		{  
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_SKIN, "1"]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_BASS, "0.5"]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_TREB, "0.5"]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_TRANS, "0.0"]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_HEADPHONE_OUT, "1"]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_HEADPHONE_IN, "0"]);
		});
	
	},

	
	UpdateOption: function(id, strVal)
	{
		this.dbOptions.transaction(function (sql) 
		{  
			sql.executeSql("INSERT OR REPLACE INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
						   [id, strVal],
						   function(result) {/*console.log("Test" + result);*/},
						   function(sql, error) {
								console.log("Error:" + error.message);
						   });
		});
	},
		
	Draw: function()
	{
		if ($('#idVolVertAdj').length != 0)
			$('#idVolVertAdj').hide();
	
		this.bOptVis = true;
		
		var strCurrentScene = '#' + $('.classShowPage').get(0).id;
		
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
									'opacity': '0.5'
									}
							}).appendTo($(strCurrentScene));
							
		var divOverlay = $('<div id="idMainBack"></div>').appendTo($(strCurrentScene));
							
		var btnClose = $('<span id="btnClose" class="wampButtonClose"><span>' +
								'Close</span></span>)').appendTo(divOverlay);
		var btnSwitchTheme = $('<span id="btnSwitchTheme" class="wampButton"><span>' +
								'Switch Color</span></span>)').appendTo(divOverlay);
		var btnBGTheme = $('<span  class="wampButton"><span>' +
								'Use Background</span></span>)').appendTo(divOverlay);
		var btnRedoIndex = $('<span id="btnRedoIndex" class="wampButton"><span>' +
								'Redo Index</span></span>)').appendTo(divOverlay);
		var btnHdpnOutOp = $('<span class="wampButton"><span>' +
								'Pause On Headphone<br>Removal:' +
								((scenePlay.iPauseOnHOut) ? "On" : "Off") +
								'</span></span>)').appendTo(divOverlay);
		var btnHdpnInOp = $('<span class="wampButton"><span>' +
								'Resume On Headphone<br>In: ' +
								((scenePlay.iPlayOnHIn) ? "On" : "Off") +
								'</span></span>)').appendTo(divOverlay);		
		
		btnClose.click(function() {objOptions.Close();});
		btnSwitchTheme.click(function() 
		{
			objOptions.PickNextSkin();
			$('#idModelBack').remove();
			$('#idMainBack').remove();
			ChangePage($(strCurrentScene));
		});
		btnRedoIndex.click(function() {objOptions.RerunIndex();});
		btnHdpnOutOp.click(function()
		{
			scenePlay.iPauseOnHOut = !(scenePlay.iPauseOnHOut);
			objOptions.UpdateOption(OPT_ID_HEADPHONE_OUT,
									Number(scenePlay.iPauseOnHOut).toString());
			btnHdpnOutOp.html('<span>' +
								'Pause On Headphone<br>Removal:' +
								((scenePlay.iPauseOnHOut) ? "On" : "Off") +
								'</span>');				
		});
		btnHdpnInOp.click(function()
		{
			scenePlay.iPlayOnHIn = !(scenePlay.iPlayOnHIn);
			objOptions.UpdateOption(OPT_ID_HEADPHONE_IN,
									Number(scenePlay.iPlayOnHIn).toString());
			btnHdpnInOp.html('<span>' +
								'Resume On Headphone<br>In: ' +
								((scenePlay.iPlayOnHIn) ? "On" : "Off") +
								'</span>');				
		});
		btnBGTheme.click(function()
		{
			objOptions.SetBGImg();
			$('#idModelBack').remove();
			$('#idMainBack').remove();
			ChangePage($(strCurrentScene));
		});
	
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
	
		var strCurrentScene = '#' + $('.classShowPage').get(0).id;
	
		$('#idButtonGoesHere').removeClass();
		$('#idButtonGoesHere').addClass(objSkin.theme[objSkin.skinNum].dialog.btntheme);
		
		$('#idButtonGoesHere span').text("Re-Index Finished");
	
		$('#idButtonGoesHere').click(function () 
		{
			ChangePage($(strCurrentScene));
		});
	
		ChangePage($('#idDialog'));
	
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

	this.Init = function (funcGood)
	{
		this.arrayIndex = [];
	
		for (var i in objwAMP.hashPaths)
		{
			var obj = objwAMP.GetMetadata(i);
			obj.path = i;
			this.arrayIndex.push(obj);
			this.addSong(obj);
		}
		
		funcGood();
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
	
	arrayExtList: 
			new Array(".mp3",".wma",".m4a",".aac",".flac",".ogg",".ra",".ram",".wav",".mp2",".mp1",".als"),
	
	// this is the current path we are on, set to root dir
	strCurrentPath: ["/media/internal", "/media/internal"],
	
	// this is an enum to tell whether we are using FileFolder type io or
	//	full indexing type io
	indexType: 0,
	
	mutexLikeCheck: 0,
	
	bShuffle: false,
	bRepeat: false,
	
	funcTextBanner: 0,
	
	// This will hold the song list for viewing
	arrayPlaylist: [[],[]],
		
	objectLsCache: new Object(),

	// this will be true if indexer failed to load
	bFolderOnly: false,
	
	isWebOS: ((window.PalmSystem) ? true : false),
	
	iSongIndex: [0, 0],
	iOpenIndex: [-1, -1],
	iNextIndex: [1, 1],
	
	fTransition: 0.0,
	
	funcIndexStart: 0,
	iIndexStatus: 0,
	
	bReinitInProgress: false,
	
	funcImgGenCB: 0,
	
	funcUpdatePLCallback: 0,
	
	funcPauseCallback: 0,
	
	funcNowPlaying: 0,
	
	funcSeekFinishFunc: [0, 0],
	
	tmoutSonTransDB: 0,
	tmoutTrebSet: 0,
	tmoutBassSet: 0,
	tmoutMidSet: 0,
	tmoutEQSet: 0,
	
	strNewSeekTime: [0, 0],
	
	arraySongStartObj: new Array(),

	bTrackNew: [0, 0],
	
	objParam: 0,
	
	objBufPL: new Object(),
	
	tmoutKeepAlive: 0,
	
	iBlockCount: 0,
	
	iBPM: 0,
	
	arrayPLRaw: {},
	
	objImageCache: new Object(),
	
	iIndexCallbackCnt: 0,
	
// Public:

	StatusString: "Attempting To Start Player Plug-In",
	
	BufferPL: function(iIndex, iPos, iArray)
	{
		objwAMP.arrayPlaylist[0] = iArray;
		objwAMP.bBuffer = 1;
		objwAMP.iIndex = iIndex;
		objwAMP.iPos = iPos;
		
		if (objwAMP.funcUpdatePLCallback)
		{
			objwAMP.OpenSong(0, objwAMP.iIndex);
			objwAMP.Seek(objwAMP.iPos, function() {}, 0);
			objwAMP.funcUpdatePLCallback(iArray);
		}
		else
			objwAMP.funcUpdatePLCallback = -1;
	},
	
	StartIndex: function()
	{		
		this.plugIn.StartIndex(objOptions.timeLastIndex,
								objOptions.strIndexingDir);
	},
	
	CopyPLForDJ: function()
	{
		this.arrayPlaylist[1] = this.arrayPlaylist[0].slice(0);
	},
	
	KeepAlive: function()
	{
		clearTimeout(objwAMP.tmoutKeepAlive);
		
		parameters =  
		{
			id: OWNDER_STR,
			duration_ms: '900000'
		}
		
		CallPalmService('palm://com.palm.power/com/palm/power/activityStart', 
							parameters,
							false,
							function(response)
							{
								objwAMP.tmoutKeepAlive = setTimeout(function()
								{
									objwAMP.KeepAlive();
								}, 110000);
							},
							function(response)
							{
								console.log("Error: " + JSON.stringify(response));
							});
	},
		
	CheckOS: function(obj)
	{
		this.plugIn = obj;
		
		this.plugIn.StartSong = function(path, artist, title, iTrack) 
		{
			objwAMP.StartSong(path, artist, title, iTrack);
		};
		this.plugIn.AddToIndex = function(str, lastMod)
		{
			objwAMP.AddToIndex(str, lastMod);
		};
		this.plugIn.FinishIndex = function() 
		{
			objwAMP.FinishIndex();
		};
		this.plugIn.FinishSeek = function(str, iTrack) 
		{
			//console.log('FinishSeek:' + str + ' ' + iTrack);
			objwAMP.FinishSeek(str, iTrack);
		};
		
		if (!this.isWebOS)
		{
			this.plugIn.bNextSet = false;
			
			this.plugIn.strSongState = "101";
			
			this.plugIn.Ping = function () {return 'Pong';};
											
			this.plugIn.StartIndex = function() 
			{
				setTimeout(function () 
				{
					objwAMP.plugIn.AddToIndex('test', "dirty");
					objwAMP.plugIn.FinishIndex();
				}, 1000);
			};
			
			this.plugIn.SetEQ = function() {};
			
			this.plugIn.GetCurrentDirLS = function ()
			{
				return '{"finishedIndexing":true, ' +
					   '"arrayFileList": [' +
							'{"name":"ice_ice_baby.mp3", "path":"/media/internal/ice_ice_baby.mp3", "artist":"Vanilla Ice", "album":"Ice Ice Baby", "genre":"rap", "title":"Ice Ice Baby", "isdir":false},' +
							'{"name":"every_rose.ogg", "path":"/media/internal/every_rose.ogg", "artist":"Poison", "album":"alllllvin", "genre":"rock", "title":"Every Rose Has It\'s Thorn", "isdir": false},' +
							'{"name":"wallpaper", "path":"/media/internal/wallpaper", "artist":"Mumford and Sons", "album":"alllllvin", "genre":"alternative", "title":"The Cave", "isdir": true},' +
							'{"name":"the_cave.flac", "path":"/media/internal/path4", "artist":"Leonard Skinner", "album":"alllllvin", "genre":"classic rock", "title":"Freebird", "isdir": false},' +
							'{"name":"f_o_g.wma", "path":"/media/internal", "artist":"Sting", "album":"Sting", "genre":"contemporary", "title":"Fields of Gold", "isdir": false},' +
							'{"name":"queen(I want to break free).mp3", "path":"/media/internal/path5", "artist":"Queen", "album":"Greatest Hits", "genre":"rock", "title":"I Want To Break Free", "isdir": false},' +
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
			
			this.plugIn.GetMetadata = function(str)
			{
				return new Object();
			};
			
			this.plugIn.iTestVar = 0;
			
			this.plugIn.Open = function(str, iTrack)	
			{
				objwAMP.plugIn.iTestVar = 0;
				objwAMP.plugIn.bNextSet = false;
			
				setTimeout(function() 
				{
					var i=0;
					
					while (i < OfflineArray.length)
					{
						if (str == OfflineArray[i].path)
						{
						
							objwAMP.plugIn.StartSong(OfflineArray[i].path, 
											OfflineArray[i].title,
											OfflineArray[i].artist,
											iTrack);
							return;
						}
						i++;
					}
				}, 100);
			};
			
			
			this.plugIn.SetNext = function() 
			{
				objwAMP.plugIn.bNextSet = true;
			};
			this.plugIn.playonce = 0;
			
			this.plugIn.Play = function() 
			{
				if (!objwAMP.plugIn.playonce)
				{
					console.log("Play Once Play: " + ++objwAMP.plugIn.playonce);
					objwAMP.plugIn.intervalTest = setInterval(function () {							
								objwAMP.plugIn.iTestVar++;
							}, 1000);
				}
			};
			this.plugIn.Pause = function() 
			{
				clearInterval(objwAMP.plugIn.intervalTest);
			};
			this.plugIn.GetCurTime = function() 
			{
				return Number(objwAMP.plugIn.iTestVar).toString();
			};
			this.plugIn.GetEndTime = function() 
			{
				return "280";
			};
			this.plugIn.SetSpeed = function() {};
			this.plugIn.SetVol = function() {};
			this.plugIn.SetTreble = function() {};
			this.plugIn.SetBass = function() {};
			this.plugIn.SetMid = function() {};
			this.plugIn.Seek = function(iTime, iTrack) 
			{
				objwAMP.plugIn.iTestVar = iTime;
				setTimeout(function()
				{
					objwAMP.FinishSeek(iTime, iTrack);
				}, 100); ;
			};
			this.plugIn.SetMetadataPath = function(str) {};
			this.plugIn.GetBPM = function(i) {return "100";};
			this.plugIn.SetNoNext = function(i) {};
			this.plugIn.GetAvgMagString = function() 
			{
				var array = new Array(256);
				
				for (var i=0;i<256;i++)
				{
					array[i] = 0|(Math.random() * 110);
				}
				
				return array.join('');
			};
			this.plugIn.CheckMusicDir = function()
			{
				return "1" | 0;
			};
			this.plugIn.GetFreqString = function() 
			{
				var array = new Array(128);
				
				for (var i=0;i<128;i++)
				{
					array[i] = 0|(Math.random() * 110);
				}
				
				return array.join('');
			};
			
			this.plugIn.CheckPathForImg = function()
			{
				return "-1";
			}
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
	
	CheckIndex: function(funcIndexStart)
	{
		objwAMP.funcIndexStart = funcIndexStart;
		objwAMP.hashPaths = {};
	},
	
	AddToIndex: function(str, modstate)
	{				
		var objSong = {"path":str,
					   "dirty": modstate,
					   "found": 0};
		
		objSong.name = str.substr(str.lastIndexOf('/') + 1)
		
		objwAMP.hashPaths[str] = objSong;
		objwAMP.iIndexCallbackCnt++;
	},
	
	/******************************
	 * Callback for reindex
	 ******************************/
	FinishIndex: function(strPath)
	{				
		//console.log("Finished");
		
		setTimeout(function()
		{
			objwAMP.IndexerCallbackFinish()
		}, 10);
	},
	
	/******************************
	 * Check if the index was previously run
	 ******************************/
	IndexerCallbackFinish: function()
	{
		ProfilerStart("IndexerCallbackFinish");
		
		objwAMP.iIndexStatus = objSongIndex.Init(function()
		{
			console.log("Indexer Called Back");
		
			objwAMP.funcIndexStart(!INDEX_FAILED_LOAD);
		},
		function()
		{
			objwAMP.iIndexStatus = INDEX_FAILED_LOAD;
		
			objwAMP.funcIndexStart(INDEX_FAILED_LOAD);		
		});
	
	},
	
	SetRecentPlayRaw: function(strRaw)
	{
		if (!strRaw)
			objwAMP.arrayPLRaw = new Array();
		else
			objwAMP.arrayPLRaw = strRaw.split('\\\\');
	},
	
	AddSongToRecentPlay: function(strNewPath)
	{
		if (objwAMP.arrayPLRaw.length)
		{
			objwAMP.arrayPLRaw = objwAMP.arrayPLRaw.filter(function(element)
			{
				return (element != strNewPath);
			});
		
			while (objwAMP.arrayPLRaw.length >= 25)
				objwAMP.arrayPLRaw.shift();
				
		}
		
		objwAMP.arrayPLRaw.push(strNewPath);
		
		objOptions.UpdateLastPlayed(objwAMP.arrayPLRaw.join('\\\\'), strNewPath);
	},
	
	GetRecentPlay: function()
	{
		return objwAMP.arrayPLRaw; 
	},
	
	/******************************
	 * This function gets the ls of whatever the current dir is set to
	 *
	 * Returns: An array of objects which is made up of
	 *			the songs and dirs in a particular file
	 ******************************/
	GetDirFileList: function(iTrackArg)
	{
		var iTrack;
		
		if (!iTrackArg)
			iTrack = 0;
		else
			iTrack = iTrackArg;
		
		try
		{
			// Check if we have already visited this dir previously
			if (this.objectLsCache[this.strCurrentPath[iTrack]])
			{
				// If we have, just return what we found before
				return this.objectLsCache[this.strCurrentPath[iTrack]];
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
				var strJSON = this.plugIn.GetCurrentDirLS(this.strCurrentPath[iTrack]);
			
				//this.Log(strJSON);
			
				// If our return string is NULL, it means that no sub dirs exist
				//	and no songs exist in that folder, so create an item to go up
				//	one dir
				if (!strJSON)
				{
					var objAppendItem = {
						isdir : true,
						name : "No Song Files Found\\nClick to return to previous dir",
						path : this.strCurrentPath[iTrack]
										.substr(0,this.strCurrentPath.lastIndexOf("/"))
					};
					
					objCache.Dir.push(objAppendItem);
					
					this.objectLsCache[this.strCurrentPath[iTrack]] = objCache;
					return this.objectLsCache[this.strCurrentPath[iTrack]];
				}
			
				// We get here if there was something in the JSON string, so parse it
				var jsonFileList = JSON.parse(strJSON);
				
				// If the current directory is not the root dir, then provide
				//	a method for going up one dir
				if (this.strCurrentPath[iTrack] !== "/media/internal")
				{
					var objAppendItem = {
						artist : "",
						album : "",
						genre : "",
						title : "",
						isdir : true,
						name : "..",
						path : this.strCurrentPath[iTrack]
										.substring(0,this.strCurrentPath[iTrack].lastIndexOf("/"))
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
					
					jsonFileList.arrayFileList[i].artist = 
											jsonFileList.arrayFileList[i].path;
				
					jsonFileList.arrayFileList[i].title = 
											jsonFileList.arrayFileList[i].name;
				
					if (bIsPlayable)
						objCache.Playable.push(jsonFileList.arrayFileList[i]);
					else
						objCache.Unknown.push(jsonFileList.arrayFileList[i]);
				
				}
				
				this.objectLsCache[this.strCurrentPath[iTrack]] = objCache;
				return this.objectLsCache[this.strCurrentPath[iTrack]];
			}
		}
		catch (err) {console.log(err);}
		
	},
	
	GetDirOnly: function(path)
	{	
		try
		{
			// Seperate everything into three arrays, dirs/playbel/unknown
			var Dir = new Array();
		
			// Have the plugin get the info for the available files
			//	and pass it to the js app via JSON formatted string
			var strJSON = this.plugIn.GetCurrentDirLS(path);
		
			// If our return string is NULL, it means that no sub dirs exist
			//	and no songs exist in that folder, so create an item to go up
			//	one dir
			if (!strJSON)
			{
				var objAppendItem = {
					isdir : true,
					name : "No Song Files Found\\nClick to return to previous dir",
					path : path.substr(0,path.lastIndexOf("/"))
				};
				
				Dir.push(objAppendItem);
			}
		
			// We get here if there was something in the JSON string, so parse it
			var jsonFileList = JSON.parse(strJSON);
			
			// If the current directory is not the root dir, then provide
			//	a method for going up one dir
			if (path !== "/media/internal")
			{
				var objAppendItem = {
					"isdir" : true,
					"name" : "..",
					"path" : path.substring(0,path.lastIndexOf("/"))
				};
				
				Dir.push(objAppendItem);
			}
			
			for (var i=0; i < jsonFileList.arrayFileList.length; i++)
			{
				if (jsonFileList.arrayFileList[i].isdir)
				{
					Dir.push(jsonFileList.arrayFileList[i]);
					continue;
				}
			}
			
			return Dir;
		}
		catch (e)
		{
			return -1;
		}
	},
	
	/******************************
	 * Show spectrum data
	 *****************************/
	
	
	/******************************
	 * This function gets the current path for folder ls
	 *
	 * Returns: A string with the current path
	 ******************************/
	getCurrentPath: function(iTrack)
	{
		if (!iTrack)
			iTrqck = 0;
	
		return this.strCurrentPath[iTrack];
	},
	/******************************
	 * This function sets the current path for folder ls
	 *
	 * Returns: None
	 ******************************/
	SetCurrentPath: function(strDir, iTrack)
	{
		if (!iTrack)
			iTrack = 0;
	
		this.strCurrentPath[iTrack] = strDir;
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
		
		if (objwAMP.checkIfPluginInit())
			this.SetNextSong();
		
		objOptions.UpdateOption(OPT_ID_SHUF_REP, iMode.toString());
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
	pause: function(iTrack)
	{
		if (!iTrack)
			iTrack = 0;
			
		this.plugIn.Pause(iTrack);
	},
	 
	 /*******************************
	 * Tell the plugin to play
	 *******************************/
	play: function(iTrack)
	{
		if (!iTrack)
			iTrack = 0;
	
		this.plugIn.Play(iTrack);
	},
	  

	/*******************************
	 * This function gets the current state
	 *******************************/
	GetState: function(iTrack)
	{
		if (!iTrack)
			iTrack = 0;
		
		var objState = new Object;
	
		try
		{
			objState.EndTime = Number(this.plugIn.GetEndTime(iTrack));
			//console.log(objState.EndTime);
			objState.CurTime = Number(this.plugIn.GetCurTime(iTrack));
			//console.log(objState.CurTime);
			objwAMP.iBPM = objState.BPM = Number(this.plugIn.GetBPM(iTrack));
			//console.log(objState.BPM);
		}
		catch(e) 
		{
			console.log(e);
			
			if (isNaN(objState.EndTime))
			{
				objState.EndTime = 0;
				objState.CurTime = 0;
			}
			else
				objState.CurTime = 0;
			
			objState.BPM = objwAMP.iBPM;
		}
			
		objSongIndex.SaveCurPos(objState.CurTime);
	
		return objState;
	},
	 
	/*******************************
	 * Set the speed control
	 *******************************/
	SetSpeed: function(fSpeed, iTrackNum)
	{
		//console.log(fSpeed);

		if (!iTrackNum)
			iTrackNum = 0;
	
		this.plugIn.SetSpeed(fSpeed, iTrackNum);
	},
	 
	 /*******************************
	 * Set the vol control
	 *******************************/
	SetVol: function(fVol, iTrack)
	{
		//console.log("Vol:" + fVol);
		
		this.plugIn.SetVol(fVol, iTrack);
	},
	 
	/*******************************
	 * Set the treble control
	 *******************************/
	SetTreble: function(fTreb, iTrackNum)
	{
		clearTimeout(objwAMP.tmoutTrebSet);
		
		objwAMP.tmoutTrebSet = setTimeout(function()
		{
			objOptions.UpdateOption(OPT_ID_TREB, 
									Number(fTreb).toString());
		
		}, 300);
		
		if (!iTrackNum)
			iTrackNum = 0;
		
		this.plugIn.SetTreble(fTreb * 2, iTrackNum);
	},
	 
	 /*******************************
	 * Set the bass control
	 *******************************/
	SetBass: function(fBass, iTrackNum)
	{	
		clearTimeout(objwAMP.tmoutBassSet);
		
		objwAMP.tmoutBassSet = setTimeout(function()
		{
			objOptions.UpdateOption(OPT_ID_BASS, 
									Number(fBass).toString());
		
		}, 300);
	
		if (!iTrackNum)
			iTrackNum = 0;
	
		this.plugIn.SetBass(fBass * 2, iTrackNum);
	},

	 /*******************************
	 * Set the midrange control
	 *******************************/
	SetMid: function(fMid, iTrackNum)
	{
		clearTimeout(objwAMP.tmoutMidSet);
		
		objwAMP.tmoutMidSet = setTimeout(function()
		{
			objOptions.UpdateOption(OPT_ID_MID, 
									Number(fMid).toString());
		
		}, 300);
	
		if (!iTrackNum)
			iTrackNum = 0;
	
		this.plugIn.SetMid(fMid * 2, iTrackNum);
	},
	
	 /*******************************
	 * Set an EQ coefficient
	 *******************************/
	SetEQCoef: function(iEQFreqID, fCoef)
	{	
		clearTimeout(objwAMP.tmoutEQSet);
	
		var iToFixed = (255 * fCoef) | 0;
		
		objOptions.arrayEQVals[iEQFreqID] = String.fromCharCode(iToFixed);
		
		objwAMP.tmoutEQSet = setTimeout(function()
		{
			objOptions.UpdateOption(OPT_ID_EQ, 
									objOptions.arrayEQVals.join(''));
		
		}, 300);
		
		this.plugIn.SetEQ(objOptions.arrayEQVals.join(''));
	}, 
	
	SetFullEQ: function()
	{	
		this.plugIn.SetEQ(objOptions.arrayEQVals.join(''));
	},
	
	 /*******************************
	 * Seek a part of the song
	 *******************************/
	Seek: function(iNewTime, funcFinishFunc, iTrackNum)
	{
		//console.log("Seek:" + iNewTime + " " + iTrackNum);
		
		if (!iTrackNum)
			iTrackNum = 0;
	
		this.funcSeekFinishFunc[iTrackNum] = funcFinishFunc;
		this.plugIn.Seek(iNewTime, iTrackNum);
	}, 

	RegisterPauseFunc: function(funcPauseFunc)
	{
		objwAMP.funcPauseCallback = funcPauseFunc;
	
	},
	
	/*********************************
	 * Callback function called by the plugin to
	 *	let the javascript know when a song has started.
	 *********************************/
	StartSong: function(path, artist, title, iTrackNumArg)
	{	
		var iTrackNum = iTrackNumArg;
		
		if ((!iTrackNum) || isNaN(iTrackNum))
			iTrackNum = 0;
		
		//console.log(path);
		
		//console.log(artist);
		
		//console.log(title);
		
		objwAMP.arraySongStartObj[iTrackNum] = new Object();

		objwAMP.arraySongStartObj[iTrackNum].path = path;
		
		if (artist && artist != "0")
			objwAMP.arraySongStartObj[iTrackNum].artist = artist;
		else
			objwAMP.arraySongStartObj[iTrackNum].artist = path;
		
		if (title && title != "0")
			objwAMP.arraySongStartObj[iTrackNum].title = title;
		else
		{
			var iFindName = path.lastIndexOf('/') + 1;
			
			objwAMP.arraySongStartObj[iTrackNum].title = path.substr(iFindName);
		}
		
		objwAMP.bTrackNew[iTrackNum] = 1;
		
		setTimeout(function()
		{
			objwAMP.AvoidPluginCall()
		}, 10);
	},
	/*********************************
	 * Need this to avoid calling the plugin
	 *  from the plugin callback
	 *********************************/
	AvoidPluginCall: function()
	{	
		objwAMP.KeepAlive();
		
		var iTrack = objwAMP.bTrackNew.length;
		
		while ((iTrack--) && (!objwAMP.bTrackNew[iTrack])) {};
	
		var objSong = objwAMP.arraySongStartObj[iTrack];
	
		if (!objSong.path)
		{
			console.log("Handling bad song");
			
			var iCheckIndex = this.GetNextIndex(iTrack);
			
			if ((objwAMP.iNextIndex[iTrack] == -1) ||
				(iCheckIndex == -1))
			{
				if (objwAMP.funcPauseCallback)
					objwAMP.funcPauseCallback(iTrack);
					
				objwAMP.funcTextBanner("Pick Another Song", "", iTrack);
				
				return;
			}
			
			this.SetIndex(this.iNextIndex[iTrack], iTrack);
			this.SetIndex(this.GetNextIndex(iTrack), iTrack);
			this.OpenNextSong(iTrack);
			return;
		}
		
		
		if (this.iOpenIndex[iTrack] == -1)
			this.SetIndex(this.iNextIndex[iTrack], iTrack);
		else
		{
			this.SetIndex(this.iOpenIndex[iTrack], iTrack);
			this.iOpenIndex[iTrack] = -1;
		}
		
		this.SetNextSong(iTrack);
		
		objwAMP.funcTextBanner(objSong.title, objSong.artist, iTrack);

		objSongIndex.SaveCurIndex(this.GetIndex(iTrack));

		objwAMP.AddSongToRecentPlay(objSong.path);
		
		if (objwAMP.funcNowPlaying)
			objwAMP.funcNowPlaying(this.GetIndex(iTrack), iTrack);
		
		//console.log("Calling Path from avoid:" + objSong.path);
		
		objwAMP.funcImgGenCB(objSong.path);
	},
	
	RegisterTextBanner: function(funcTextBanner)
	{
		objwAMP.funcTextBanner = funcTextBanner;
	},
	
	// Function to register call back for show album art
	RegisterImgGen: function(funcImgGenCB)
	{
		objwAMP.funcImgGenCB = funcImgGenCB;
	},
	
	RegisterSongTrans: function(funcSongTransition)
	{
		objwAMP.funcSongTransition = funcSongTransition;
	},
	
	RegisterNowPlaying: function(funcNowPlaying)
	{
		objwAMP.funcNowPlaying = funcNowPlaying;
	},
	
	/******************************
	 * Callback for reindex
	 ******************************/
	FinishReindex: function(strJSON)
	{	
		objwAMP.strIndexJSON = strJSON;
		
		setTimeout(function()
		{
			objwAMP.AvoidReindexPluginCall()
		}, 10);
	},
	/*********************************
	 * Need this to avoid calling the plugin
	 *  from the plugin callback
	 *********************************/
	AvoidReindexPluginCall: function()
	{
		this.jsonIndex = JSON.parse(this.strIndexJSON);
		objSongIndex.addArray(this.jsonIndex.arrayFileList);
		document.getElementById('idButtonGoesHere').style.display = "block";
	},
	
	
	/*******************************
	 * Called after plugin finishes seeking
	 *******************************/
	FinishSeek: function(strNewTime, iTrack)
	{
		//console.log("Finish Seek:" + strNewTime + " " + iTrack);
		objwAMP.strNewSeekTime[iTrack] = strNewTime;
		setTimeout(function()
		{
			objwAMP.AvoidSeekPluginCall(iTrack)
		}, 5);
	},
	/*********************************
	 * Need this to avoid calling the plugin
	 *  from the plugin callback
	 *********************************/
	AvoidSeekPluginCall: function(iTrack)
	{
		console.log("Finish avoid seek:" + iTrack);
		
		if (!iTrack)
			iTrack = 0;
		
		var iRet = parseFloat(objwAMP.strNewSeekTime[iTrack]);
		if (isNaN(iRet))
		{
			console.log(objwAMP.strNewSeekTime[iTrack]);
			iRet = 0;
		}
		
		if (this.funcSeekFinishFunc[iTrack])
			this.funcSeekFinishFunc[iTrack](iRet, iTrack);
	},
	
	/******************************
	 * Gets the file list based on which option we are using
	 ******************************/
	GetPlaylist: function(iTrack)
	{
		if (!(this.arrayPlaylist[iTrack]))
			this.arrayPlaylist[iTrack] = new Array();
	
		return this.arrayPlaylist[iTrack]
	},
	
	PLSize: function(iTrack)
	{
		if (!(this.arrayPlaylist[iTrack]))
			return 0;
		else
			return this.arrayPlaylist[iTrack].length;
	},

	RegisterPLCallback: function(funcUpdatePLCallback)
	{
		if (this.funcUpdatePLCallback == -1)
		{
			objwAMP.OpenSong(0, objwAMP.iIndex);
			objwAMP.Seek(objwAMP.iPos);	
			funcUpdatePLCallback(this.arrayPlaylist[0]);
		}
		
		this.funcUpdatePLCallback = funcUpdatePLCallback;
	},
	
	EmptyPlaylist: function(iTrack)
	{
		this.arrayPlaylist[iTrack] = new Array();
		this.SetIndex(0, iTrack);
		
		objSongIndex.SaveCurPlaylist(iTrack);
		if (this.funcUpdatePLCallback)
			this.funcUpdatePLCallback(this.arrayPlaylist[iTrack],
									  iTrack);
	},
	
	SetPlaylist: function(iTrack, arraySongs, bSkipDB8Update)
	{
		this.arrayPlaylist[iTrack] = arraySongs;
		
		try
		{
			if (!bSkipDB8Update)
				objSongIndex.SaveCurPlaylist(iTrack);
		}
		catch(e)
		{
			document.getElementById('idTellUser').innerHTML = 'Error: There was an error trying to save the playlist. ' +
					  'The playlist will not be saved on exit at this time. ' +
					  'Please report the following to blaclynx@yahoo.com:' + 
						e;
			document.getElementById('idButtonGoesHere').innerHTML = "Ok";
			document.getElementById('idDialog').style.display = "block";
		}
		
		try
		{
			if (this.funcUpdatePLCallback)
			{
				this.funcUpdatePLCallback(this.arrayPlaylist[iTrack],
										  iTrack);
			}
		}
		catch(e)
		{
			document.getElementById('idTellUser').innerHTML = 'Error: There was an error trying to display the playlist. ' +
					  'Please report the following to blaclynx@yahoo.com:' + 
						e;
			document.getElementById('idButtonGoesHere').innerHTML = "Ok";
			document.getElementById('idDialog').style.display = "block";
		}		
		
		this.SetNextSong(iTrack);
	},

	MoveSong: function(iTrack, oldPos, newPos)
	{
		var tmp = this.arrayPlaylist[iTrack].splice(oldPos, 1);
		this.arrayPlaylist[iTrack].splice(newPos, 0, tmp[0]);
		var iCur = this.GetIndex(iTrack);
		
		if (iCur == oldPos)
			this.SetIndex(newPos, iTrack);
		else if ((iCur >= newPos) && (iCur <= oldPos))
			this.SetIndex(++iCur, iTrack);
		else if ((iCur <= newPos) && (iCur >= oldPos))
			this.SetIndex(--iCur, iTrack);
		this.SetPlaylist(0, this.arrayPlaylist[iTrack]);
	},
	
	AppendPlaylist: function(arrayNewPL, iTrack, iIntoPnt)
	{
		if (iIntoPnt == null)
		{
			this.arrayPlaylist[iTrack] = 
					objwAMP.GetPlaylist(iTrack).concat(arrayNewPL);
		}
		else
		{
			if (isNaN(iIntoPnt))
			{
				console.log("Should not have sent this val:" + iIntoPnt);
				iIntoPnt = 0;
			}
			
			var arrayCur = objwAMP.GetPlaylist(iTrack);
			this.arrayPlaylist[iTrack] = 
					arrayCur.slice(0, iIntoPnt).concat(arrayNewPL,
													  arrayCur.slice(iIntoPnt));

			var iCur = this.GetIndex(iTrack);													  
			
			if (iCur >= iIntoPnt)
			{
				this.SetIndex((iCur+arrayNewPL.length), iTrack);
			}
		}
		
		objSongIndex.SaveCurPlaylist(iTrack);
		if (this.funcUpdatePLCallback)
			this.funcUpdatePLCallback(this.arrayPlaylist[iTrack]);
		this.SetNextSong(iTrack);
	},

	RemoveSong: function(iIndex, iTrack)
	{
		if (!iTrack)
			iTrack = 0;
		
		this.arrayPlaylist[iTrack].splice(iIndex, 1);
		
		var iCurSong = this.GetIndex(iTrack);
		
		if (iCurSong >= iIndex)
		{
			iCurSong--;
			this.SetIndex(iCurSong, iTrack);
		}			
		
		objSongIndex.SaveCurPlaylist();
		if (this.funcUpdatePLCallback)
			this.funcUpdatePLCallback(this.arrayPlaylist[iTrack]);
		this.SetNextSong(iTrack);
	},
	
	AddSong: function(objSong, iTrack, iPosition)
	{
		if ((iPosition != null) && 
			(this.arrayPlaylist[iTrack]) &&
			(iPosition < this.arrayPlaylist[iTrack].length))
		{
			if (isNaN(iPosition))
				iPosition = 0;
			
			switch (iPosition)
			{
			case PLAYLIST_POS_END:
				this.AddSongToPlaylist(objSong, iTrack);
				break;
			case PLAYLIST_POS_NEXT:
				this.AddSongNext(objSong, iTrack);
				break
			default:
				this.arrayPlaylist[iTrack].splice(iPosition,
										  0,
										  objSong);
				var iCurSong = this.GetIndex(iTrack);						  
				if (iPosition <= iCurSong)
					this.SetIndex(++iCurSong, iTrack);
				this.SetNextSong(iTrack);
			}
		}
		else
			this.AddSongToPlaylist(objSong, iTrack);
		
		objSongIndex.SaveCurPlaylist(0);
		
		if (this.funcUpdatePLCallback)
			this.funcUpdatePLCallback(this.arrayPlaylist[iTrack]);
	},
	
	AddSongToPlaylist: function(objSong, iTrack)
	{
		if (!this.arrayPlaylist[iTrack])
		{
			this.arrayPlaylist[iTrack] = new Array();
			this.arrayPlaylist[iTrack].push(objSong);
			this.OpenSong(0, iTrack);
		}
		else
			this.arrayPlaylist[iTrack].push(objSong);
		
		this.SetNextSong(iTrack);
	},
	
	AddSongNext: function(objSong, iTrack)
	{
		if (!this.arrayPlaylist[iTrack])
		{
			this.AddSongToPlayList(objSong, iTrack);
		}
		else
		{
			var iCurIndex = this.GetIndex(iTrack);
		
			this.arrayPlaylist[iTrack].splice(iCurIndex + 1,
									0,
									objSong);
			this.SetNextSong(iTrack, iCurIndex + 1);
		}
		
	},
	
	AddSongNow: function(objSong, iTrack)
	{
		this.AddSong(objSong, iTrack, this.GetIndex(iTrack));
	},
	
	SetSongTransition: function (fTransition)
	{
		clearTimeout(objwAMP.tmoutSonTransDB);
		
		objwAMP.tmoutSonTransDB = setTimeout(function()
		{
			objOptions.UpdateOption(OPT_ID_TRANS, 
									Number(fTransition).toString());
			objwAMP.SetNextSong(0);
		}, 400);
		this.fTransition = Number(fTransition).toFixed(1);
	},
	
	GetSongTransition: function()
	{
		return this.fTransition;
	},
	
	/******************************
	 * Tell the plugin handler which song to start playing
	 ******************************/
	SetIndex: function(iIndex, iTrack)
	{
		this.iSongIndex[iTrack] = iIndex;
	},
	GetIndex: function(iTrack)
	{
		return this.iSongIndex[iTrack];
	},
	
	GetCurSongPath: function(iTrack)
	{
		return objwAMP.arraySongStartObj[iTrack].path;
	},
	 
	/******************************
	 * Tell the plugin handler which song to start playing
	 ******************************/	
	GetNextIndex: function(iTrack)
	{
	
		if (!iTrack)
			iTrack = 0;
		
		if (!(this.arrayPlaylist[iTrack]) || (this.arrayPlaylist[iTrack].length == 0))
			return -1;	
	
		var iRet = this.GetIndex(iTrack);
	
		if (this.bShuffle == true)
			iRet = (Math.random()*this.arrayPlaylist[iTrack].length) | 0;
		else
		{
			iRet++;
			if (this.bRepeat == true)
				iRet = iRet % this.arrayPlaylist[iTrack].length;
			else
			{
				if (iRet >= this.arrayPlaylist[iTrack].length)
					return -1;
			}
		}
		
		return iRet;
	},
	 
	 /******************************
	 * Tell the plugin handler which song to start playing
	 ******************************/
	 getPreviousIndex: function(iTrack)
	 {
		if (!iTrack)
			iTrack = 0;
		
		if (!(this.arrayPlaylist[iTrack]) || (this.arrayPlaylist[iTrack].length == 0))
			return -1;	 
	 
		var iRet = this.GetIndex(iTrack);

		if (this.bShuffle == true)
			iRet = (Math.random()*this.arrayPlaylist[0].length) | 0;
		else
		{
			iRet--;
			if (iRet < 0)
			{
				if (this.bRepeat)
					iRet = this.arrayPlaylist[0].length - 1;
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
	 OpenSong: function(iTrack, iIndex)
	 {	 
	 	if (!iTrack)
			iTrack = 0;
		
		if (!(this.arrayPlaylist[iTrack]) || !(this.arrayPlaylist[iTrack].length))
			return;
		
		if (typeof(iIndex) != "undefined")
		{
			if (iIndex >= this.arrayPlaylist[iTrack].length)
				iIndex = this.arrayPlaylist[iTrack].length - 1;
			else if (iIndex < 0)
				iIndex = 0;
			this.SetIndex(iIndex, iTrack);
		}
			
		objwAMP.CallOpenSong(this.arrayPlaylist[iTrack][this.GetIndex(iTrack)].path, iTrack);
		this.iOpenIndex[iTrack] = this.GetIndex(iTrack);
	 },
	
	CallOpenSong: function(str, iTrack)
	{
		if ((typeof str == "string") && 
					(str.indexOf('/media/internal') != -1))
		{
			console.log("Opening: " + str);
			this.plugIn.Open(str, iTrack);
		}
	},
	
	CallSetNext: function(str, transition, iTrack)
	{
		if (isNaN(transition))
			transition = 0.0;

		if ((typeof str == "string") && 
					(str.indexOf('/media/internal') != -1))
		{
			console.log("Opening: " + str + " with:" + transition);
			this.plugIn.SetNext(str, transition, iTrack);
		}
		else
		{
			this.plugIn.SetNoNext(iTrack);
		}
	
	},
	
	/*******************************
	 * Tell the plugin to use a new next song
	 *******************************/
	SetNextSong: function(iTrack, iIndex)
	{	
		if (!iTrack)
			iTrack = 0;
		
		if (!this.arrayPlaylist[0] || !this.arrayPlaylist[0].length)
		{
			objwAMP.CallSetNext(0, 0, iTrack);
			return;
		}
	
		if ((this.arrayPlaylist[0].length == 1) &&
			 (this.bRepeat != true))
		{
			objwAMP.CallSetNext(0, 0, iTrack);
			return;
		}
	
		if (iIndex)
		{
			if (iIndex == -1)
			{
				this.iNextIndex[iTrack] = -1;
				objwAMP.CallSetNext(0, 0, iTrack);
				return;
			}
			
			var iBad = 0;
			
			try
			{
				objwAMP.CallSetNext(this.arrayPlaylist[0][iIndex].path,
									this.fTransition,
									iTrack);
			}
			catch (e)
			{
				console.log(e);
				iBad = 1;
				objwAMP.CallSetNext(0, 0, iTrack);
				return 0;
			}
			
			if (!iBad)
				this.iNextIndex[iTrack] = iIndex;
				
			return;
		}
	
		var iNextIndex = this.GetNextIndex(iTrack);
		
		if (iNextIndex == -1)
			return;
		
		try
		{
			if (!this.arrayPlaylist[0][iNextIndex])
			{
				objwAMP.CallSetNext(this.arrayPlaylist[0][0].path, 
									this.fTransition, iTrack);
			}
		
			objwAMP.CallSetNext(this.arrayPlaylist[0][iNextIndex].path, 
								this.fTransition, iTrack);
		}
		catch (e)
		{
			console.log(e);
			return 0;
		}					
							
		this.iNextIndex[iTrack] = iNextIndex;
	},

	
	 /*******************************
	 * Tell the plugin to Play the next song
	 *******************************/
	 OpenNextSong: function(iTrack)
	 {
	 	if (!iTrack)
			iTrack = 0;
	 
		var iNextIndex = this.GetNextIndex(iTrack);
		
		console.log("Open Next Song:" + iNextIndex);
		
		if (iNextIndex == -1)
		{
			return -1;
		}
		else
		{
			this.SetIndex(iNextIndex, iTrack);
			objwAMP.CallOpenSong(this.arrayPlaylist[0][this.GetIndex(iTrack)].path, iTrack);
			this.iOpenIndex[iTrack] = this.GetIndex(iTrack);
		}

	},
		
	 
	 /*******************************
	 * Tell the plugin to play the previous song
	 *******************************/
	OpenPrevSong: function(iTrack)
	{
		if (!iTrack)
			iTrack = 0;
	
		var iPrevIndex = this.getPreviousIndex(iTrack);
	 
	 	if (iPrevIndex == -1)
		{
			return -1;
		}
		else
		{
			this.SetIndex(iPrevIndex, iTrack);
			objwAMP.CallOpenSong(this.arrayPlaylist[0][iPrevIndex].path, iTrack);
			this.iOpenIndex[iTrack] = this.GetIndex(iTrack);
		}
	},
	
	GetAlbumArtist: function(strPath)
	{
		this.plugIn.SetMetadataPath(strPath);
		
		var str = this.plugIn.GetMetadata(5);
		if (str == '0')
			return 0;
		else
			return str;
	},
	
	/**********************
	 * Get metadata for a son
	 **********************/
	GetMetadata: function(strPath)
	{
		var obj = new Object();
		
		//console.log("Getting Metadata for " + strPath);
		
		this.plugIn.SetMetadataPath(strPath);
		
		obj.name = strPath.lastIndexOf('/') + 1;
		
		obj.genre = this.plugIn.GetMetadata(0);
		if (obj.genre == '0')
			obj.genre = '[Unknown]';
		
		obj.artist = this.plugIn.GetMetadata(1);
		if (obj.artist == '0')
			obj.artist = '[Unknown]';

		obj.album = this.plugIn.GetMetadata(2);
		if (obj.album == '0')
			obj.album = '[Unknown]';
		//console.log("Album:" + obj.album);
		
		obj.title = this.plugIn.GetMetadata(3);
		if (obj.title == '0')	
			obj.title = strPath.substr(obj.name);
	
		//console.log("Title:" + obj.title);
		

		//console.log("Genre:" + obj.genre);
		
		obj.track = this.plugIn.GetMetadata(4);
		if (obj.track == '0')
			obj.track = 0;
			
		//console.log("Track:" + obj.track);
		
		obj.albumArtist = this.plugIn.GetMetadata(5);
		if (obj.albumArtist == '0')
			obj.albumArtist = 0;
		
		return obj;
	},
	
	GetMetadataForPre: function(path)
	{
		var obj = new Object();
		
		console.log("Getting Metadata for " + strPath);
		
		this.plugIn.SetMetadataPath(strPath);	
		obj.albumArtist = this.plugIn.GetMetadata(5);
	},
	
	SetCrossfade: function(fPaneOneFade)
	{
		if (this.plugIn.SetCrossfade)
			this.plugIn.SetCrossfade(fPaneOneFade);
	},
	
	GetFreqStr: function(iTrack)
	{
		if (!iTrack)
			iTrack = 0;
	
		var str = this.plugIn.GetFreqString(iTrack);
	
		//console.log("Freq String: " + str.charCodeAt(100));
	
		return str;
	},
	
	GetAvgMagStr: function(iTrack)
	{
		if (!iTrack)
			iTrack = 0;
	
		var str = this.plugIn.GetAvgMagString(iTrack);
	
		//console.log("Freq String: " + str.charCodeAt(100));
	
		return str;
	},
	
	CheckForImg: function(strPath)
	{
		if (objwAMP.objImageCache[strPath])
			return objwAMP.objImageCache[strPath];
			
		return objwAMP.objImageCache[strPath] = 
							this.plugIn.CheckPathForImg(strPath);
	},
	
	CheckMusicDir: function(bCreate)
	{
		bCreate = bCreate | 0;
	
		return (this.plugIn.CheckMusicDir(bCreate) | 0);
	}
}
