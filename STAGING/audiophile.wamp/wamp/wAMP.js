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
var INDEX_FINISHED 		= 0;
var INDEX_FAILED_LOAD 	= 3;

var PLAY_MODE_NORMAL 	= 0;
var PLAY_MODE_REPEAT 	= 1;
var PLAY_MODE_SHUFFLE 	= 2;

var PLAYLIST_POS_END 	= -1;
var PLAYLIST_POS_NEXT 	= -2;

var CURRENT_PLAYLIST_PLNAME = "Now Playing";
var RECENT_PLAY_PLNAME = "Recently Played";
var FAVORITE_MARK_PLNAME = "Favorited";
var NOT_FAVORITE_MARK_PLNAME = "Not Favorited";
var PLNAME_DESC_PATH 	= 9999999;
var PLNAME_DESC_ALBUM 	= 9999998;
var PLNAME_DESC_ARTIST 	= 9999997;
var PLNAME_DESC_GENRE 	= 9999996;


var MAX_HIST_LIST		= 24;

function FormatHTTP(str)
{
	var strPath = "";
				
	var i = 0;
				
	while (i < str.length)
	{
		c = str.charAt(i++);
		(c != ' ') ? (strPath += c) : (strPath += '%20');
	}
	
	return strPath;
};

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

// Changes XML to JSON
function xmlToJson(xml) 
{
  
  // Create the return object
  var obj = {};

  if (xml.nodeType == 1) { // element
    // do attributes
    if (xml.attributes.length > 0) {
    obj["@attributes"] = {};
      for (var j = 0; j < xml.attributes.length; j++) {
        var attribute = xml.attributes.item(j);
        obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
      }
    }
  } else if (xml.nodeType == 3) { // text
    obj = xml.nodeValue;
  }

  // do children
  if (xml.hasChildNodes()) {
    for(var i = 0; i < xml.childNodes.length; i++) {
      var item = xml.childNodes.item(i);
      var nodeName = item.nodeName;
      if (typeof(obj[nodeName]) == "undefined") {
        obj[nodeName] = xmlToJson(item);
      } else {
        if (typeof(obj[nodeName].length) == "undefined") {
          var old = obj[nodeName];
          obj[nodeName] = [];
          obj[nodeName].push(old);
        }
        obj[nodeName].push(xmlToJson(item));
      }
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

var arrayKeepAlive = [];
var arrayKeepAlive2 = [];
var arrayKeepAlive3 = [];
var arrayKeepAlive4 = [];
var arrayKeepAlive5 = [];

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
		arrayKeepAlive3.push(objParam);
		reqObject.funcError = funcError;
		reqObject.funcCallback = funcCallback;
		reqObject.onservicecallback = function(status) 
		{
			//console.log("Service callback:" + reqObject.tempCircRef);
		
			clearTimeout(reqObject.ret);
		
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

		arrayKeepAlive4.push(reqObject.onservicecallback);
		
		arrayKeepAlive5.push(strService);
		
		arrayKeepAlive2.push(reqObject.call(strService, objParam));
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

/********************************
 * LastFM
 ********************************/
var lastfm = new LastFM({
			apiKey    : '03164f37686e29a8af8c368071204b8a',
			apiSecret : 'fd6eb5357b415ead8c67793edfb6dd1b'
		});


/********************************
 * Options class
 ********************************/
// constants for options database
var OPT_ID_SKIN = 1;
var OPT_ID_BASS = 2;
var OPT_ID_TREB = 3;
var OPT_ID_TRANS = 4;
var OPT_ID_HEADPHONE_IN = 5;
var OPT_ID_HEADPHONE_OUT = 6;
var OPT_ID_MID = 7;
var OPT_ID_NO_INDEXER = 8;
var OPT_ID_EQ = 9;
var OPT_ID_NO_LOAD = 10;
var OPT_ID_SHUF_REP = 11;
var OPT_ID_ALBUM_ORD = 12;
var OPT_ID_LAST_INDEX = 13;
var OPT_ID_INDEX_DIR = 14;
var OPT_ID_WAMP_VERSION = 15;
var OPT_ID_LAST_FM_SESS = 16;
var OPT_ID_LAST_FM_UNAME = 17;
var OPT_ID_LAST_FM_PAS_MD = 18;
var OPT_ID_URL_LAST = 19;

var ORIENTATION_UNLOCKED 	= 0;
var ORIENTATION_PORTRAIT 	= 1;
var ORIENTATION_LANDSCAPE	= 2;

var BACK_PICTURE = -1;

var iLastFMCheckCount = 0;

var objOptions = 
{
	strLastFMSess: 0,
	strLastFMUName: "",
	strLastFMPassMd: "",
	bFakeLastFMPass: 0,
	optUseBreadC: true,
	dbOptions: 0,
	fBass: 0.5,
	fTreble: 0.5,
	fMid: 0.5,
	bOptVis: false,
	iOrientationMode: ORIENTATION_UNLOCKED,
	skinNum: 0,
	bBgActive: 0,
	bYTubeActive: 0,
	fSongTransition: 0.0,
	iPauseOnHOut: 1,
	iPlayOnHIn: 0,
	iFinishedLoadingDB: 0,
	funcRestDefCB: 0,
	bNoLoadFlag: 0,
	bCheckDir: 1,
	timeLastIndex: 0,
	bMutedYouTube: 1,
	strIndexingDir: "/media/internal",
	bKeepAlbumOrder: 1,
	strVersion: 0,
	arrayURLHist: [],
	iURLHistPos: -1,
	arrayEQVals: [String.fromCharCode(127), 
				  String.fromCharCode(127), 
				  String.fromCharCode(127), 
				  String.fromCharCode(127), 
				  String.fromCharCode(127), 
				  String.fromCharCode(127)],
	
	
	SetAlbumOrderOp: function(bOrderOn)
	{
		objOptions.bKeepAlbumOrder = bOrderOn;
	
		if (objOptions.bKeepAlbumOrder)
		{
			document.getElementById('btnAlbumOrder').innerHTML = 
											"Keep Album Order: On";
			objOptions.UpdateOption(OPT_ID_ALBUM_ORD, "1");
		}
		else
		{
			document.getElementById('btnAlbumOrder').innerHTML = 
											"Keep Album Order: Off";
			objOptions.UpdateOption(OPT_ID_ALBUM_ORD, "0");
		}
	},
	
	URLHistAddTo: function()
	{
		var strURL = objOptions.urlInput.value;
		objOptions.iURLHistPos++;
	
		if (objOptions.iURLHistPos)
		{
			objOptions.backBut.className = "classURLBut classURLButActive";
			objOptions.arrayURLHist.length = objOptions.iURLHistPos+1;
		}
		
		objOptions.forwardBut.className = "classURLBut";
				
		objOptions.funcURLCallBack(objOptions.arrayURLHist[objOptions.iURLHistPos] = strURL);
	},
	
	URLHistBack: function(strURL)
	{
		// Uninitialized state (Go has not been hit yet)
		if (objOptions.iURLHistPos <= -1)
		{
			objOptions.iURLHistPos = -1
			objOptions.backBut.className = "classURLBut";
			objOptions.arrayURLHist.length = 0;
			return;
		}
		
		// Move the current pointer back one
		objOptions.iURLHistPos--;
		
		// If we have no history left, update everything to reflect that
		if (objOptions.iURLHistPos <= 0)
		{
			objOptions.iURLHistPos = 0;
			objOptions.backBut.className = "classURLBut";
		}
		
		// Update the forward button as appropriate
		if (objOptions.iURLHistPos < (objOptions.arrayURLHist.length-1))
		{
			objOptions.forwardBut.className = "classURLBut classURLButActive";
		}
		
		// Load the proper history string		
		objOptions.funcURLCallBack(objOptions.urlInput.value = objOptions.arrayURLHist[objOptions.iURLHistPos]);
	},
	
	URLHistForward: function(strURL)
	{
		objOptions.iURLHistPos++;
	
		if (objOptions.iURLHistPos >= objOptions.arrayURLHist.length-1)
		{
			objOptions.iURLHistPos = objOptions.arrayURLHist.length-1;
			objOptions.forwardBut.className = "classURLBut";
		}
		
		if (objOptions.iURLHistPos > 0)
		{
			objOptions.backBut.className = "classURLBut classURLButActive";
		}
		
		objOptions.funcURLCallBack(objOptions.urlInput.value = objOptions.arrayURLHist[objOptions.iURLHistPos]);
	},
	
		
	URLHistSetButtons: function(urlInput, backBut, forwardBut, addBookmarkBut, funcCallBack)
	{
		objOptions.urlInput = urlInput;
		objOptions.backBut = backBut;
		backBut.addEventListener(START_EV, objOptions.URLHistBack, false);
		objOptions.forwardBut = forwardBut;
		forwardBut.addEventListener(START_EV, objOptions.URLHistForward, false);
		objOptions.addBookmarkBut = addBookmarkBut;
		objOptions.funcURLCallBack = funcCallBack;
	},
	
	LastFMFixButText: function()
	{
		if (objOptions.strLastFMSess != 0)
		{
			document.getElementById('btnLastFM').innerHTML = "Sign-Out of Last.fm";
			$('#idLastFMLogInBtn')[0].innerHTML = 'Sign-Out';
		}
		else
		{
			document.getElementById('btnLastFM').innerHTML = "Sign-In to Last.fm";
			$('#idLastFMLogInBtn')[0].innerHTML = 'Sign-In';
		}
	},
	
	Init: function()
	{
	
		document.getElementById('btnYTubeUnMute').addEventListener(START_EV, function()
		{
			if (objOptions.bMutedYouTube = !objOptions.bMutedYouTube)
				YTubeMute();
			else
				YTubeUnMute();
			
		}, false);
	
		document.getElementById('btnLastFM').addEventListener(START_EV, function()
		{
			$('#idLastFMShow')[0].className = "";
		}, false);
	
		document.getElementById('btnAlbumOrder').addEventListener(START_EV, function()
		{
			objOptions.SetAlbumOrderOp(!objOptions.bKeepAlbumOrder);
		}, false);
							
		
		document.getElementById('btnCloseOptions').addEventListener(START_EV, function()
		{
			document.getElementById('idOptions').style.display = "none";
			$('#idLastFMShow')[0].className = "classHideLastFM";
		});
		
		document.getElementById('btnSwitchColor').addEventListener(START_EV, function()
		{
			objOptions.PickNextSkin();
		});
		document.getElementById('btnRestoreDefaults').addEventListener(START_EV, function()
		{
			objOptions.ClearUserData();
			document.getElementById('idOptions').style.display = "none";
		});
		
		document.getElementById('btnPauseOnHPOut').addEventListener(START_EV, function()
		{
			objOptions.iPauseOnHOut = !(objOptions.iPauseOnHOut);
			objOptions.UpdateOption(OPT_ID_HEADPHONE_OUT,
									Number(objOptions.iPauseOnHOut).toString());
			this.innerHTML = 'Headphone Out Pause: ' +
								((objOptions.iPauseOnHOut) ? "On" : "Off");				
		});
		document.getElementById('btnPlayOnHPIn').addEventListener(START_EV, function()
		{
			objOptions.iPlayOnHIn = !(objOptions.iPlayOnHIn);
			objOptions.UpdateOption(OPT_ID_HEADPHONE_IN,
									Number(objOptions.iPlayOnHIn).toString());
			this.innerHTML = 'Headphone In Play: ' +
								((objOptions.iPlayOnHIn) ? "On" : "Off");				
		});
		document.getElementById('btnUseBG').addEventListener(START_EV, function()
		{
			objOptions.SetBGImg();
		});
		
		document.getElementById('btnSetIndexDir').addEventListener(START_EV, function()
		{
			document.getElementById('idIndexFldClose').style.display = "block";
			sceneSplash.OnFirst();
		});
		
		document.getElementById('btnSearchDirFA').addEventListener(START_EV, function()
		{
			objOptions.bCheckDir = !objOptions.bCheckDir;
			
			if (objOptions.bCheckDir)
			{
				this.innerHTML = "Search Dir For Artwork: On";
			}
			else
			{
				this.innerHTML = "Search Dir For Artwork: Off";
			}
		}, false);
		
		document.getElementById('idLastFMLogInBtn').addEventListener(START_EV, function()
		{		
			if (objOptions.strLastFMSess != 0)
			{
				objOptions.strLastFMSess = 0;
				
				objOptions.UpdateOption(OPT_ID_LAST_FM_SESS, '');
				
				sceneDialog.funcClick = function()
				{
					$('#idLastFMShow')[0].className = "classHideLastFM";
					objOptions.LastFMFixButText();
				};
			
				document.getElementById('idTellUser').innerHTML = 
						'You have been signed out of Last.fm.';
			
				sceneDialog.Open(0, "Ok");
			}
			else
			{
				var bSavePass = 1;
				
				objOptions.strLastFMUName = 
								document.getElementById('idLastFMUN').value;
				
				var checkPass = document.getElementById('idLastFMPass').value;
				
				var params;
				
				if ((objOptions.bFakeLastFMPass) && (checkPass == 'cakeisgood'))
				{
					bNoSavePass = 0;
					params = {
						username: objOptions.strLastFMUName, 
						md5password: objOptions.strLastFMPassMd
					};
				}
				else
				{
					objOptions.strLastFMPassMd = checkPass;
					params = {
						username: objOptions.strLastFMUName, 
						password: objOptions.strLastFMPassMd
					};
				}
				
				lastfm.auth.getMobileSession(params, {success: function(data)
				{
					console.log("Good Auth last.fm");
					objOptions.strLastFMSess = data.session;
					
					var str = JSON.stringify(objOptions.strLastFMSess);
					
					console.log(str);
					
					objOptions.UpdateOption(OPT_ID_LAST_FM_SESS, 
											str);
											
					objOptions.UpdateOption(OPT_ID_LAST_FM_UNAME, 
											objOptions.strLastFMUName);
					
					if (bSavePass)
					{
						objOptions.UpdateOption(OPT_ID_LAST_FM_PAS_MD, 
											md5(objOptions.strLastFMUName + 
													md5(objOptions.strLastFMPassMd)));
					}
					
					sceneDialog.funcClick = function()
					{
						$('#idLastFMShow')[0].className = "classHideLastFM";
						objOptions.LastFMFixButText();
					};
				
					document.getElementById('idTellUser').innerHTML = 
							'You should be logged in now to Last.fm and Audiophile will start scrobbling your songs.  You will be automatically logged in every time you start Audiophile (and if you do not want auto login, you will need to program that yourself).  Email blaclyx@yahoo.com if you want help on that.';
				
					sceneDialog.Open(0, "Ok");
				}, error: function(code, message){
					sceneDialog.funcClick = function()
					{
						$('#idLastFMShow')[0].className = "classHideLastFM";
						objOptions.LastFMFixButText();
					};
				
					document.getElementById('idTellUser').innerHTML = 
							'Last.fm log-in failed.  Here is why: ' + code + " - " + message;
				
					sceneDialog.Open(0, "Ok");
				}});
			}
		});
		
		document.getElementById('idLastFMUN').addEventListener('keydown', 
			function(event)
			{
				if (event.keyCode == '13') 
					event.preventDefault();
			});
		
		document.getElementById('idLastFMUN').addEventListener('keyup', 
			function(event)
			{
				if (event.keyCode == '13')
					event.preventDefault();
			});
		
		document.getElementById('idLastFMUN').addEventListener(START_EV, 
			function(event)
			{
				if (window.PalmSystem)
					window.PalmSystem.keyboardShow(2);
			});
			
		document.getElementById('idLastFMPass').addEventListener('keydown', 
			function(event)
			{
				if (event.keyCode == '13') 
					event.preventDefault();
			});
		
		document.getElementById('idLastFMPass').addEventListener('keyup', 
			function(event)
			{
				if (event.keyCode == '13')
					event.preventDefault();
			});
		
		document.getElementById('idLastFMPass').addEventListener(START_EV, 
			function(event)
			{
				if (window.PalmSystem)
					window.PalmSystem.keyboardShow(2);
			});
	},
	
	IndexDirVis: function()
	{
		if (objOptions.bNoLoadFlag == 0)
		{
			document.getElementById('textFolder').innerHTML = 
										objOptions.strIndexingDir;
		}
		else if (objOptions.bNoLoadFlag == 1)
		{
			document.getElementById('textFolder').innerHTML = 
										"webOS Indexer with Warning";
		}
		else
		{
			document.getElementById('textFolder').innerHTML = 
										"webOS Indexer";
		}
	},
	
	PickNextSkin: function()
	{

		document.getElementById('idShowImgBG').style.display = 'none';
	
		this.skinNum = ++this.skinNum % arraySkins.length;	
	
		if (this.skinNum)
		{
			document.getElementById('idPlayer').style.backgroundImage = "none";
			this.UpdateOption(OPT_ID_SKIN, this.skinNum);
			this.SetSkin();
		}
		else
		{
			document.getElementById('idPlayer').style.cssText = "";
			document.getElementById('idTitleOne').style.cssText = "";
			document.getElementById('idArtistOne').style.cssText = "";
		}
	},
	
	BGSetProper: function(strTest)
	{
		if (strTest == "landscape")
		{
			document.getElementById('idShowImgBGImg').style.display = 'none';
			document.getElementById('idShowImgBG').style.display = 'block';
		}
		else
		{
			document.getElementById('idShowImgBGImg').style.display = 'block';
			document.getElementById('idShowImgBG').style.display = 'none';
		}
	},
		
	HandleTap: function(event)
	{
		if (!hasTouch)
			return;
			
		if (event.touches.length < 2)
			return;
			
		objOptions.YTubeHidePlayerCntTog();
	},
	
	YTubeHidePlayerCntTog: function()
	{
		var dom = document.getElementById('idPlayer');
		
		if (dom.className.indexOf('classHideForYouTube') != -1)
		{
			dom.className = dom.className.replace(' classHideForYouTube', "");
		}
		else if (objOptions.bYTubeActive)
		{
			dom.className += ' classHideForYouTube';
			document.getElementById('idBanHidePlayer').innerHTML = 'Show Player';
			return;
		}
		document.getElementById('idBanHidePlayer').innerHTML = 'Hide Player';
	},
	
	SetYouTubeBG: function()
	{
		document.getElementById('idYouTube').style.top = "0px";
		
		document.getElementById('idPlayer').style.backgroundColor = "transparent";
		document.getElementById('idPlayer').style.backgroundImage = "none";
		
		document.getElementById('idDJPlayer').style.backgroundColor = "transparent";
		
		document.getElementById('btnYTubeUnMute').className = "";
		document.getElementById('btnYTubeUnMute').style.display = "block";
		
		if (!objOptions.bYTubeActive)
		{
			document.addEventListener(START_EV, 
									objOptions.HandleTap, 
									true);
		}
		
		objOptions.bYTubeActive = 1;
	},
	
	SetBGImg: function()
	{
		if (objOptions.bYTubeActive)
		{
			objOptions.bYTubeActive = 0;
			document.getElementById('btnYTubeUnMute').style.display = "none";
			document.getElementById('idYouTube').style.top = "";
			document.removeEventListener(START_EV, 
								objOptions.HandleTap, 
								true);
			document.getElementById('idPlayer').style.backgroundImage = "";
		}
		
		document.getElementById('idPlayer').style.backgroundColor = "transparent";
		document.getElementById('idDJPlayer').style.backgroundColor = "transparent";

		var strTest = objOptions.GetOrientation();
		
		if (objOptions.bBgActive == true)
		{
			objOptions.BGSetProper(strTest);
			
			return;
		}
	
		objOptions.bBgActive = false;
	
	
		this.UpdateOption(OPT_ID_SKIN, "-1");
		
		var parameters = {
            "keys":["wallpaper"],
         	};
		
		CallPalmService("palm://com.palm.systemservice/getPreferences",
						parameters,
						true,
						function(responseData)
						{
							//console.log(JSON.stringify(responseData));
			
							if (responseData.wallpaper)
							{

								document.getElementById('idShowImgBGImg').src = 
													responseData.wallpaper.wallpaperFile;

								document.getElementById('idShowImgBG')
												.style.backgroundImage =
														  "url(file://" +
															responseData.wallpaper.wallpaperFile +
															")";
								objOptions.BGSetProper(strTest);
							}

						},
						function(response)
						{
							console.log("Error setting BGimg:" + JSON.stringify(response));

						},
						function()
						{
							var strTest = objOptions.GetOrientation();
							document.getElementById('idShowImgBGImg').src = 
													"test.png";

							document.getElementById('idShowImgBG')
												.style.backgroundImage =
												  "url(" +
													"test.png" +
													")";
							objOptions.BGSetProper(strTest);
						});

	},
	
	SetSkin: function()
	{
		if (objOptions.bYTubeActive)
		{
			objOptions.bYTubeActive = 0;
			document.getElementById('btnYTubeUnMute').style.display = "none";
			document.getElementById('idYouTube').style.top = '';
			document.removeEventListener(START_EV, 
								objOptions.HandleTap, 
								true);
			document.getElementById('idPlayer').style.backgroundImage = "";								
		}
		
		document.getElementById('idPlayer').style.backgroundColor = 
												arraySkins[this.skinNum].background;
		document.getElementById('idTitleOne').style.color = 
												arraySkins[this.skinNum].title;
		document.getElementById('idArtistOne').style.color = 
												arraySkins[this.skinNum].artist;
		document.getElementById('idDJPlayer').style.backgroundColor = 
												arraySkins[this.skinNum].background;
	},
	
	GetDeviceInfo: function()
	{

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
				//strCurOrientation = window.PalmSystem.screenOrientation;
			
				/*if (strCurOrientation == "up" || strCurOrientation == "down")
					return "landscape";
				else if (strCurOrientation == "left" || strCurOrientation == "right")
					return "portrait";
				else 	*/if (window.innerWidth > 840)
					return "landscape";
				else
					return "portrait";
			}
			else
			{
				if (window.innerWidth > 840)
					return "landscape";
				else
					return "portrait";
			}
		}
	},
	
	/*AddImageCallBack: function(objSong, strThm, strSmall, strLarge)
	{
		var me = this;
				
		if (!(strSmall) || (strSmall == ""))
		{
			this.strBackground = "";
		}
		
		//console.log(strThm);
		
		objOptions.dbOptions.transaction(function (sql) 
		{  
			sql.executeSql("UPDATE 'audio_img_cache' SET imgThm = ? " +
						   "WHERE album = ? AND artist = ?", 
							[strThm, objSong.album, objSong.artist]);
		});	
			
		//console.log(strSmall);
	
		objOptions.dbOptions.transaction(function (sql) 
		{  
			sql.executeSql("UPDATE 'audio_img_cache' SET imgSmall = ? " +
						   "WHERE album = ? AND artist = ?", 
							[strSmall, objSong.album, objSong.artist]);
		});	

		//console.log(strSmall);
	
		objOptions.dbOptions.transaction(function (sql) 
		{  
			sql.executeSql("UPDATE 'audio_img_cache' SET imgLarge = ? " +
						   "WHERE album = ? AND artist = ?", 
							[strLarge, objSong.album, objSong.artist]);
		});	

		objSongIndex.SetImageThm(objSong, strThm);
		objSongIndex.SetImageSmall(objSong, strSmall);
		objSongIndex.SetImageLarge(objSong, strLarge);
		
	},
	
	CheckDBForImg: function(objSong, bDontCheckLastFM)
	{
		return;
		this.dbOptions.transaction(function(sql) 
		{
			sql.executeSql("SELECT * FROM 'audio_img_cache' WHERE album = ? AND artist = ?", 
						   [objSong.album, objSong.artist],
						   function(transaction, results) 
						   {
								var iNumEntries = results.rows.length;
								
								if (!iNumEntries)
								{
									if (bDontCheckLastFM)
										return;
								
									objOptions.dbOptions.transaction(function(sql) 
									{
										sql.executeSql("INSERT OR REPLACE INTO " +
												"'audio_img_cache' (album, artist) VALUES (?, ?)", 
												[objSong.album, objSong.artist]);
									});
									
									var me = this;
	
									// Create a cache object
									var cache = new LastFMCache();

									// Create a LastFM object 
									var lastfm = new LastFM({
										apiKey    : '03164f37686e29a8af8c368071204b8a',
										apiSecret : 'fd6eb5357b415ead8c67793edfb6dd1b',
										cache     : cache
									});

									//console.log("Checking Last.fm: " + iLastFMCheckCount++);
									
									// Load some artist info. 
									lastfm.album.getInfo({artist: objSong.artist, 
														  album: objSong.album}, 
											{success: 
												function(data){
													//console.log("Callback returned");
													objOptions.AddImageCallBack(objSong,
																	data.album.image[0]["#text"],
																	data.album.image[1]["#text"],
																	data.album.image[2]["#text"]);
												}, 
											error: function(code, message){
													console.log("Last.fm Error, no image:" +
																 message);
													objSongIndex.NoImageError(objSong);
												}
											});
								}
								else
								{
									var row = results.rows.item(0);
								
									//console.log("Should get here the second time");
								
									objSongIndex.SetImageThm(objSong, row['imgThm']);
									objSongIndex.SetImageSmall(objSong, row['imgSmall']);
									objSongIndex.SetImageLarge(objSong, row['imgLarge']);
								}
							},
							function(trans, error) 
							{
								console.log("Error getting artwork from DB':" + error);
								objSongIndex.NoImageError(objSong);
							}
						);
		});
	},*/
	
	ClearUserData: function()
	{
		objOptions.arrayEQVals = [String.fromCharCode(127), 
				  String.fromCharCode(127), 
				  String.fromCharCode(127), 
				  String.fromCharCode(127), 
				  String.fromCharCode(127), 
				  String.fromCharCode(127)];
		this.dbOptions.transaction(function(sql) 
		{
			//sql.executeSql("DROP TABLE 'audio_img_cache'");
			sql.executeSql("DROP TABLE 'audio_opt'");
			sql.executeSql("CREATE TABLE 'audio_opt' " +
								"(optID INTEGER PRIMARY KEY, val TEXT)",
						   []);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_SKIN, "0"]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_BASS, "0.5"]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_TREB, "0.5"]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_TRANS, "0.0"]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_HEADPHONE_OUT, "1"]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_EQ, objOptions.arrayEQVals.join('')]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_NO_INDEXER, "0"]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_LAST_INDEX, "0"]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_NO_LOAD, "0"]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_INDEX_DIR, "/media/internal"]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_HEADPHONE_IN, "0"]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_ALBUM_ORD, "1"]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_WAMP_VERSION, WAMP_VERSION]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_LAST_FM_SESS, ""]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_LAST_FM_UNAME, ""]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_LAST_FM_PAS_MD, ""]);	
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_URL_LAST, ""]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_SHUF_REP, "0"]);							
		});
		objOptions.bBgActive = false;
		
		objOptions.skinNum = 0;
		objOptions.timeLastIndex = 0;
		objOptions.SetSkin();
		objOptions.fBass = 0.5;
		objwAMP.SetBass(objOptions.fBass);
		objOptions.fTreble = 0.5;
		objwAMP.SetTreble(objOptions.fTreble);
		objOptions.fSongTransition = 0.0;
		objwAMP.SetSongTransition(objOptions.fSongTransition);
		objwAMP.SetMode(0);
		objOptions.iPauseOnHOut = 1;
		objOptions.iPlayOnHIn = 0;
		objOptions.SetAlbumOrderOp(1);
		document.getElementById('btnPauseOnHPOut').innerHTML = 
								'Headphone Out Pause: ' +
								((objOptions.iPauseOnHOut) ? "On" : "Off");
		document.getElementById('btnPlayOnHPIn').innerHTML = 
								'Headphone In Play: ' +
								((objOptions.iPlayOnHIn) ? "On" : "Off");	
									
		if (objOptions.funcRestDefCB)
			objOptions.funcRestDefCB();
	},
	
	RegisterRestoreDefaultCB: function(funcRestDefCB)
	{
		objOptions.funcRestDefCB = funcRestDefCB;
	},
	
	SetwAMPVals: function()
	{
		objwAMP.SetBass(objOptions.fBass);
		objwAMP.SetTreble(objOptions.fTreble);
		objwAMP.SetSongTransition(objOptions.fSongTransition);
		objwAMP.SetFullEQ();
	},
	
	LoadDatabase: function()
	{
		objOptions.dbOptions = openDatabase('wAMPdb', 
								 '1.0' /*version*/, 
								 'database for storing user settings', 
								 65536 /*max size*/);

		/*this.dbOptions.transaction(function(sql) 
		{
			sql.executeSql("DROP TABLE 'audio_img_cache'");
			sql.executeSql("DROP TABLE 'audio_opt'");
			sql.executeSql("DROP TABLE 'audio_cur_song'");
		}
		
		return;*/
								 
		objOptions.dbOptions.transaction(function (sql) 
		{  
			sql.executeSql("CREATE TABLE IF NOT EXISTS 'audio_opt' " +
								"(optID INTEGER PRIMARY KEY, val TEXT)",
						   [],
						   function() 
						   {
								//console.log("Created/Checked 'audio_opt DB'");
							},
						   function(trans, error) 
						   {
								console.log("Error creating/checking 'audio_opt DB':" + 
											error);
						   }
						);
			sql.executeSql("SELECT * FROM 'audio_opt'", 
						   [],
						   function(transaction, results) 
						   {
						   
								try
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
												break;
											case OPT_ID_TREB:
												objOptions.fTreble = Number(row['val']);
												break;
											case OPT_ID_MID:
												objOptions.fMid = Number(row['val']);
												break;
											case OPT_ID_TRANS:
												objOptions.fSongTransition = Number(row['val']);
												break;
											case OPT_ID_HEADPHONE_OUT:
												objOptions.iPauseOnHOut = Number(row['val']);
												break;
											case OPT_ID_HEADPHONE_IN:
												objOptions.iPlayOnHIn = Number(row['val']);
												break;
											case OPT_ID_EQ:
												objOptions.arrayEQVals = row['val'].split('');
												break;
											case OPT_ID_NO_LOAD:
												objOptions.bNoLoadFlag = Number(row['val']);
												break;
											case OPT_ID_SHUF_REP:
												objwAMP.SetMode(Number(row['val']));
												break;
											case OPT_ID_ALBUM_ORD:
												objOptions.SetAlbumOrderOp(Number(row['val']));
												break;
											case OPT_ID_LAST_INDEX:
												objOptions.timeLastIndex = 
														0|(Number(row['val'])/1000);
												break;
											case OPT_ID_INDEX_DIR:
												objOptions.strIndexingDir = row['val'];
												break;
											case OPT_ID_WAMP_VERSION:
												objOptions.strVersion = row['val'];
												break;
											case OPT_ID_LAST_FM_SESS:
												objOptions.strLastFMSess = row['val'];
												if (objOptions.strLastFMSess)
												{
													objOptions.strLastFMSess = 
																JSON.parse(objOptions.strLastFMSess);
												}
												break;
											case OPT_ID_LAST_FM_UNAME:
												objOptions.strLastFMUName = row['val'];
												var dom = document.getElementById('idLastFMUN');
												dom.value = objOptions.strLastFMUName;
												break;
											case OPT_ID_LAST_FM_PAS_MD:
												objOptions.strLastFMPassMd = row['val'];
												var dom = document.getElementById('idLastFMPass');
												if (objOptions.strLastFMPassMd != '')
												{
													objOptions.bFakeLastFMPass = 1;
													dom.value = "cakeisgood";
												}
												break;
											case OPT_ID_URL_LAST:
												document.getElementById('idURLFilter').value = row['val'];
												break;
											}
										}
										objOptions.iFinishedLoadingDB = 1;
									}
								}
								catch(e)
								{
									console.log(e);
								}
								objOptions.LastFMFixButText();
								sceneSplash.LoadSplash();
							},
							function(transaction, error) 
							{
								console.log("Error");
								objOptions.bNoLoadFlag = 1;
								sceneSplash.LoadSplash();
							});
		});
		
	},

	LoadPLDB: function()
	{
		
		objOptions.dbOptions.transaction(function (sql) 
		{  
			sql.executeSql("CREATE TABLE IF NOT EXISTS 'audio_cur_song' " +
							"(name TEXT, desc TEXT, startIndex INTEGER, " +
							"curPos INTEGER, jsonPL BLOB)",
						   [],
						   function() 
						   {console.log("Created/Checked PL DB DB'");},
						   function(trans, error) 
						   {
								console.log("Error creating/checking 'PL DB':" + error);
						   }
						);
			
			sql.executeSql("SELECT * FROM 'audio_cur_song' WHERE name = ?", 
					[RECENT_PLAY_PLNAME],
					function(transaction, results) 
					{
							
						try
						{
							var iNumEntries = results.rows.length;
												
							if ((!iNumEntries) || (objOptions.bNoLoadFlag == 1))
							{
								// Delete the entries no being used
								objOptions.dbOptions.transaction(function(sql) 
								{
									sql.executeSql("INSERT OR REPLACE INTO " +
											"'audio_cur_song' (name, desc, startIndex, " +
											"curPos, jsonPL) VALUES (?, 'Last Played Songs', " +
											"0, 0, '')", 
									[RECENT_PLAY_PLNAME],
									function(result) 
									{
										console.log("Created Raw Entry");
										objwAMP.SetRecentPlayRaw();									
									},
									function(sql, error) {
										console.log("Error:" + error.message);
										objwAMP.SetRecentPlayRaw();
									});
								});
							}
							else if (iNumEntries > 1)
							{
								try
								{
									var row = results.rows.item(0);
							
									var strPlayed = row['jsonPL'];
								
									objwAMP.SetRecentPlayRaw(strPlayed);
									
									// Delete the entries not being used
									objOptions.dbOptions.transaction(function(sql) 
									{
										sql.executeSql("DELETE FROM 'audio_cur_song' " + 
													"WHERE name = ? AND jsonPL != ?", 
												[RECENT_PLAY_PLNAME, strPlayed]);
									});
								}
								catch (e) {console.log(e);}								
							}
							else
							{
								try
								{
									var row = results.rows.item(0);
							
									var strPlayed = row['jsonPL'];
								
									objwAMP.SetRecentPlayRaw(strPlayed);
								}
								catch (e) {console.log(e);}
									
							}
						}
						catch(e)
						{
							console.log("error");
							objwAMP.SetRecentPlayRaw();
						}
						
					},
					function(sql, error) {
						console.log("Error:" + error.message);
						objwAMP.SetRecentPlayRaw();
					});
						
			sql.executeSql("SELECT * FROM 'audio_cur_song' WHERE name = ?", 
					[CURRENT_PLAYLIST_PLNAME],
					function(transaction, results) 
					{
							
						try
						{
							var iNumEntries = results.rows.length;
												
							if ((!iNumEntries) || (objOptions.bNoLoadFlag == 1))
							{
								sql.executeSql("INSERT OR REPLACE INTO " +
										"'audio_cur_song' (name, desc, startIndex, " +
										"curPos, jsonPL) VALUES (?, 'Current Playlist', " +
										"0, 0, '[]')", 
								[CURRENT_PLAYLIST_PLNAME],
								function(result) {/*console.log("Test" + result);*/},
								function(sql, error) {
									console.log("Error:" + error.message);
								});
							}
							else if (iNumEntries > 1)
							{
									var row = results.rows.item(0);
							
									var iIndex = row['startIndex'];
									var iPos = row['curPos'];
									var strPL = row['jsonPL'];
								
									var arrayPL = JSON.parse(strPL);
									objwAMP.BufferPL(iIndex, iPos, arrayPL);
									
									// Delete the entries no being used
									objOptions.dbOptions.transaction(function(sql) 
									{
										sql.executeSql("DELETE FROM 'audio_cur_song' " + 
													"WHERE name = ? AND jsonPL != ?", 
												[CURRENT_PLAYLIST_PLNAME, strPL]);
									});
							}
							else
							{
								try
								{
									var row = results.rows.item(0);
							
									var iIndex = row['startIndex'];
									var iPos = row['curPos'];
									var strPL = row['jsonPL'];
								
									var arrayPL = JSON.parse(strPL);
									objwAMP.BufferPL(iIndex, iPos, arrayPL);
								}
								catch (e) {console.log(e);}
									
							}
						}
						catch(e)
						{
							console.log("error");
						}
						
						if (!objOptions.bNoLoadFlag)
							objSongIndex.FinishedAddingSongs();
						
					},
					function(sql, error) {
						console.log("Error:" + error.message);
						if (!objOptions.bNoLoadFlag)
							objSongIndex.FinishedAddingSongs();
					});
		});
	},
	
	SetDefaults: function()
	{
		this.dbOptions.transaction(function (sql) 
		{  
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_SKIN, "0"]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_BASS, "0.5"]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_TREB, "0.5"]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_TRANS, "0.0"]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_HEADPHONE_OUT, "1"]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_EQ, objOptions.arrayEQVals.join('')]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_NO_LOAD, "0"]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_LAST_INDEX, "0"]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_ALBUM_ORD, "1"]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_SHUF_REP, "0"]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_INDEX_DIR, "/media/internal"]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_LAST_FM_SESS, ""]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_LAST_FM_UNAME, ""]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_LAST_FM_PAS_MD, ""]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_URL_LAST, ""]);							
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_WAMP_VERSION, "0"]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_HEADPHONE_IN, "0"],
							function()
							{
								objOptions.strVersion = "v1";
								objOptions.iFinishedLoadingDB = 1;
							});					
		});
	},

	SetCurrentVersion: function()
	{
		objOptions.UpdateOption(OPT_ID_WAMP_VERSION, WAMP_VERSION);
	},
	
	UpdateLastIndexTime: function()
	{
		objOptions.UpdateOption(OPT_ID_LAST_INDEX, (new Date()).getTime());
	},
	
	ResetIndexTime: function()
	{
		objOptions.UpdateOption(OPT_ID_LAST_INDEX, "-1");
		objOptions.timeLastIndex = -1;
	},
	
	SafeIndexTimeSet: function()
	{
		objOptions.UpdateOption(OPT_ID_LAST_INDEX, "-2");
		objOptions.timeLastIndex = 0;	
	},
	
	GetMostPlayed: function(funcCallback)
	{

		var arrayToSort = objSongIndex.arrayIndex.slice(0);
	
		arrayToSort.sort(function(a, b)
		{
			if (!a.playCount)
				return 1;
			else if (!b.playCount)
				return -1;
			
			return b.playCount-a.playCount;
		});
	
		if (arrayToSort.length > 25)
			arrayToSort = arrayToSort.slice(0,25);
		
		funcCallback(arrayToSort);
	},

	GetFavorites: function(funcCallback)
	{
		this.dbOptions.transaction(function (sql) 
		{  
			sql.executeSql("SELECT * FROM 'audio_cur_song' WHERE name = ?", 
						[FAVORITE_MARK_PLNAME],
						   function(transaction, results) 
						   {
								var arrayRet = new Array();
								
								var iNumEntries = results.rows.length;
						
								for (var i=0; i<iNumEntries; i++)
								{
									var row = results.rows.item(i);
									var objInfo = new Object();
									
									objInfo.type = row['startIndex'];
									objInfo.name = row['desc'];
									
									arrayRet.push(objInfo);
								}
								
								funcCallback(arrayRet);
						   },
						   function(sql, error) 
						   {
								funcCallback(new Array());
								console.log("Error:" + error.message);
						   });
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
		
	UpdateLastPlayed: function(strPathToInc)
	{		
		var i = objSongIndex.objQuickIndexLoc[strPathToInc];
		
		if (typeof(i) == 'undefined')
			return;
		
		if (!objSongIndex.arrayIndex[i].playCount)
			objSongIndex.arrayIndex[i].playCount = 1;
		else
			objSongIndex.arrayIndex[i].playCount++;
		
		objSongIndex.arrayIndex[i].lastPlayed = (new Date()).getTime();
		
		var parameters = {
			"objects": [objSongIndex.arrayIndex[i]]
		};

		CallPalmService('palm://com.palm.db/merge', 
				parameters,
				false,
				function(response)
				{
					console.log(JSON.stringify(response));
				},
				function(response)
				{
					console.log("error" + JSON.stringify(response));
				});
	},
	
	MarkItemFav: function(str, type)
	{
		objOptions.UpdateItemFavStatus(str, type, FAVORITE_MARK_PLNAME);
	},
	
	MarkItemNotFav: function(str, type)
	{
		objOptions.UpdateItemFavStatus(str, type, NOT_FAVORITE_MARK_PLNAME);
	},
	
	UpdateItemFavStatus: function(str, type, fav)
	{
		this.dbOptions.transaction(function (sql) 
		{  
			sql.executeSql("SELECT * FROM 'audio_cur_song' WHERE desc = ? AND startIndex = ?", 
						   [str, type],
						   function(transaction, results) 
						   {
								console.log("Here in Select * for fav");
						   
								var iNumEntries = results.rows.length;
								
								console.log("We have num entries: " + iNumEntries);
								
								if (!iNumEntries)
								{
									// This is a new entry, so Insert
									objOptions.dbOptions.transaction(function(sql) 
									{
										sql.executeSql("INSERT OR REPLACE INTO " +
												"'audio_cur_song' (desc, startIndex, name) " +
												"VALUES (?, ?, ?)", 
												[str, type, fav]);
									});
								}
								else
								{
									// This is a new entry, so Insert
									objOptions.dbOptions.transaction(function(sql) 
									{
										sql.executeSql("UPDATE 'audio_cur_song' " +
													"SET name = ? " +
													"WHERE desc = ? AND startIndex = ?", 
													[fav, str, type]);
									});
								}
							},
							function(sql, error) {
								console.log("Error:" + error.message);
						   });
		});
	},
		
	Draw: function()
	{					
		document.getElementById('idOptions').style.display = "block";	
	}
};

function LiObject(strHash, strText)
{
	this.IdHash = strHash;
	this.DisplayText = strText;
}

var IN_INDEX_ONLY = 1;
var IN_INDEX_BOTH = 2;

function ArtAlbVisit(strArtist, strAlbum)
{
	this.strArtist = strArtist;
	this.strAlbum = strAlbum;

	this.CheckEqual = function(objArtAlb)
	{
		return (this.strArtist.toLowerCase() == 
						objArtAlb.strArtist.toLowerCase()) && 
				(this.strAlbum.toLowerCase() == 
						objArtAlb.strAlbum.toLowerCase());
	}
}

var objSongIndex =
{
	// Var to store the original index
	arrayIndex: new Array(),
	
	// Need to define these for now until we fix the non-WebOS version
	arrayGenres: {},
	arrayArtists: {},
	arrayAlbums: {},
	arrayTitles: {},
	arrayPLs: 0,
	bKindRegistered: 0,
	
	arrayVisitCheck: new Array(),
		
	bNeedPermission: 0,
	bGotPermission: 0,
	iPermissionCheckCount: 0,
	bNoMediaIndexer: 0,
	tmoutFailSafe: 0,
	objQuickFindImg: new Object(),
	objQuickIndexLoc: new Object(),
	
	
	Init: function(funcGood, funcError)
	{
		objSongIndex.funcGood = funcGood;
		objSongIndex.funcError = funcError;
		
		setTimeout(function()
		{
			objSongIndex.FirstStageInit();
		}, 1);
	},
			

	AltInit: function()
	{
		console.log("Entering AltInit");
		
		objSongIndex.funcGood = function()
		{
			console.log("Indexer Called Back from alt path");
			
			objwAMP.iIndexStatus = INDEX_FINISHED;
		
			objwAMP.funcIndexStart(INDEX_FINISHED);
		};
		
		objSongIndex.funcError = function()
		{
			objwAMP.iIndexStatus = INDEX_FAILED_LOAD;
		
			objwAMP.funcIndexStart(INDEX_FAILED_LOAD);		
		};
		
		parameters = {
            query: {
                from: 'com.palm.media.audio.file:1',
                limit: 1
            }
        };
		
		CallPalmService('palm://com.palm.db/find', 
						parameters,
						false,
						function(response)
						{
							console.log("Return from find");
							objSongIndex.bNeedPermission = 0;
							objSongIndex.GetJustPre();
						},
						function(response)
						{
							console.log("Return from find with error");
						
							objSongIndex.bNeedPermission = 1;
							objSongIndex.RequestMediaPermission(1);
						},
						function()
						{
							objSongIndex.bNeedPermission = 1;
							
							setTimeout(function()
							{
								objSongIndex.RequestMediaPermission(1);
							}, 2000);
						});
						
		objOptions.LoadPLDB();
	},
	
	RequestMediaPermission: function(bUseJustPre)
	{		
		console.log("Entering Request Media Permission");
		
		var strInitError = "AudiophileHD was unable to obtain permission to use the built in Media Indexer.  This is most likely due to you not clicking to allow access to Indexer when prompted.  If you were not prompted to allow access, or if you clicked 'Allow' but are still seeing this message, you should try a different indexing method.";
		
		var parameters = {
			rights: {
				read: [
					'com.palm.media.audio.file:1'
				]
			}
		};
	
		CallPalmService('palm://com.palm.mediapermissions/request', 
				parameters,
				false,
				function(response)
				{
					if (response.returnValue && response.isAllowed)
					{
						objSongIndex.bGotPermission = 1;
						objSongIndex.GetJustPre();
					}
					else
					{
						sceneDialog.funcClick = function()
						{
							objSongIndex.funcError();
						};
						
						document.getElementById('idTellUser').innerHTML = strInitError;
						sceneDialog.Open(0,"Ok");
						
						objSongIndex.bGotPermission = 0;
					}
				},
				function(response)
				{
					sceneDialog.funcClick = function()
					{
						objSongIndex.funcError();
					};
					
					document.getElementById('idTellUser') = strInitError;
					sceneDialog.Open(0,"Ok");
						
					objSongIndex.bGotPermission = 0;
				},
				function()
				{
					objSongIndex.bGotPermission = 1;
					objSongIndex.GetJustPre();
				});
	},
	
	GetJustPre: function()
	{	
		console.log("Entering GetJustPre");
		
		objSongIndex.arrayPreSongs = new Array();

		parameters = {
			query: {
				from: 'com.palm.media.audio.file:1',
			}
		};

		CallPalmService('palm://com.palm.db/find', 
				parameters,
				false,
				function(response)
				{									
					audiofiles = response.results;
					if (response.next)
					{
						objSongIndex.WorkWithFuckingLimitAPI(audiofiles,
															response.next,
															1);	
					}
					else
					{
						objSongIndex.SetJustPreArray(audiofiles);
					}
				},
				function(response)
				{
					if (objSongIndex.bGotPermission)
					{
						sceneDialog.funcClick = function()
						{
							objSongIndex.funcError();
						};
						
						document.getElementById('idTellUser') = "It appears that you are suffering from the Media Indexer Permission bug.  You should try a different indexing method.";
						sceneDialog.Open(0,"Ok");
							
						objSongIndex.bGotPermission = 0;
					}
					else
					{				
						sceneDialog.funcClick = function()
						{
							objSongIndex.funcError();
						};
						
						document.getElementById('idTellUser') = "AudiophileHD cannot access the media indexer. Please email blaclynx@yahoo.com for further assistance.";
						sceneDialog.Open(0,"Ok");
							
						objSongIndex.bGotPermission = 0;
					}
				},
				function()
				{
					//objSongIndex.ExtractPreIndexData(new Array());
					
					objSongIndex.arrayIndex = OfflineArray;
					
					for (var k=0; k<objSongIndex.arrayIndex.length; k++)
					{
						var objSong = objSongIndex.arrayIndex[k];
					
						objSong.imgSmall = "res/player/noimgsm.png";
						objSong.imgThumb = "res/player/noimgthm.png";
						objSong.imgLarge = "res/player/spinimg.png";
					}
					
					var response = new Object();
					response.results = objSongIndex.arrayIndex;
					
					objSongIndex.FinishedAddingSongs(response);
				});
	},
	
	WorkWithFuckingLimitAPI: function(arrayAppend, pageNext, bJustPre)
	{
		console.log("Entering WWFLAPI");
		
		objSongIndex.arrayPreSongs = objSongIndex.arrayPreSongs.concat(arrayAppend);
	
		parameters = {
			query: {
				from: 'com.palm.media.audio.file:1',
				"page": pageNext
			}
		};
	
		CallPalmService('palm://com.palm.db/find', 
						parameters,
						false,
						function(response)
						{									
							console.log("Returned from Pre find");
							audiofiles = response.results;
							
							if (response.next)
							{
								objSongIndex.WorkWithFuckingLimitAPI(audiofiles,
																	response.next,
																	bJustPre);	
							}
							else
							{
								objSongIndex.SetJustPreArray(audiofiles);
							}
						},
						function()
						{
							console.log("Error");

							objSongIndex.SetJustPreArray(new Array());
						});
	},
	
	SetJustPreArray: function(arrayAppend)
	{
		console.log("Enter SetJustPreArray");
		objSongIndex.arrayPreSongs = objSongIndex.arrayPreSongs.concat(arrayAppend);
	
		while (objSongIndex.arrayPreSongs.length)
		{	
			var objPreIndexItm = objSongIndex.arrayPreSongs.pop();
			
			if (objPreIndexItm.isRingtone)
				continue;
			
			var objSong;
			
			try
			{
				objSong = new Object();
				
				
				objSong.path = objPreIndexItm.path;
				objSong.name = 
						objPreIndexItm.path.substr(objPreIndexItm.path.lastIndexOf('//') + 
													1);
				
				//console.log("ObjSong: " + objSong.path);

					objSong.title = 
								(objPreIndexItm.title != "Unknown Title") ? 
										objPreIndexItm.title :
										objSong.name;
					objSong.artist = objPreIndexItm.artist;
					if (objSong.artist == "Unknown Artist")
						objSong.artist = "[Unknown]";					
					objSong.album = objPreIndexItm.album;
					if (objSong.album == "Unknown Album")
						objSong.album = "[Unknown]";
					objSong.albumArtist = 0;
					objSong.genre = objPreIndexItm.genre;
					if (objSong.genre == "Unknown Genre")
						objSong.genre = "[Unknown]";
					objSong.track = objPreIndexItm.track.position;
					if (objPreIndexItm.thumbnails.length)
					{
						objSong.imgSmall = "/var/luna/data/extractfs" + 
								encodeURIComponent(objPreIndexItm.thumbnails[0].data) + 
								":64:64:3";
						objSong.imgThumb = "/var/luna/data/extractfs" + 
								encodeURIComponent(objPreIndexItm.thumbnails[0].data) + 
								":32:32:3";
						objSong.imgLarge = "/var/luna/data/extractfs" + 
								encodeURIComponent(objPreIndexItm.thumbnails[0].data) + 
								":100:100:3";
					}
					else
					{
						objSong.imgSmall = "res/player/noimgsm.png";
						objSong.imgThumb = "res/player/noimgthm.png";
						objSong.imgLarge = "res/player/spinimg.png";
					}
					
				objSongIndex.CleanSong(objSong);
				objSongIndex.arrayIndex.push(objSong);
			
			}
			catch (e)
			{
				console.log("Error:" + e);
			}
		}
		
		objSongIndex.FinishedAddingSongs();
	},
	
	FirstStageInit: function()
	{
		ProfilerTickAndRestart("FirstStateInit:");	
			
		if (!objwAMP.iIndexCallbackCnt)
		{
			objSongIndex.funcGood();
			return;
		}
		
		CallPalmService('palm://com.palm.db/putKind',
				objSongIndex.SongSchema,
				false,
				function(ret)
				{
					console.log("Path kind registered" + JSON.stringify(ret));
					objSongIndex.bKindRegistered = 1;
					objSongIndex.ThirdStageInit();
				},
				function(e)
				{
					console.log("Error registering path kind:" + 
								JSON.stringify(e));
					objSongIndex.bKindRegistered = -1;
					objSongIndex.ThirdStageInit();
				},
				function()
				{
					objSongIndex.bKindRegistered = 1;
					objSongIndex.ThirdStageInit();
				});
	},
	
	ThirdStageInit: function()
	{
		ProfilerTickAndRestart("ThirdStageInit");
	
		objSongIndex.arrayExisting = new Array();
	
		if (objSongIndex.bKindRegistered == -1)
		{
			objSongIndex.GetPreSongs(new Array());
		}
		else
		{
		
			var parameters = {
				query: {
					from: SongSchema_ID,
					orderBy: "path"
				}
			};
		
			objSongIndex.bPreventProFromFix = 0;
			objSongIndex.bLostDB8Data = 0;
		
			CallPalmService('palm://com.palm.db/find', 
							parameters,
							false,
							function(response)
							{
								console.log("Return from first cust find");
								
								objSongIndex.arrayCurFiles = response.results;
								objSongIndex.next = response.next;
								
								if (response.next)
								{
									//console.log('Multi-page, so we get next');

									objSongIndex.FuckYouHP(objSongIndex.arrayCurFiles,
															objSongIndex.next);	
								}
								else
								{
									objSongIndex.GetPreSongs(objSongIndex.arrayCurFiles);
								}
							},
							function(e)
							{
			var strError = "A permission Error occured while trying to access the custom song DB.  Please report the error to blaclynx@yahoo.com.";
								
								sceneDialog.funcClick = function()
								{
									objSongIndex.GetPreSongs(new Array());
								};
								
								document.getElementById('idTellUser').innerHTML = strError;
								document.getElementById('idButtonGoesHere').innerHTML = "Ok";
								document.getElementById('idDialog').style.display = "block";
							
							},
							function()
							{
								objSongIndex.arrayIndex = OfflineArray;
								
								for (var k=0; k<objSongIndex.arrayIndex.length; k++)
								{
									var objSong = objSongIndex.arrayIndex[k];
								
									objSong.imgSmall = "res/player/noimgsm.png";
									objSong.imgThumb = "res/player/noimgthm.png";
									objSong.imgLarge = "res/player/spinimg.png";
								}
								
								var response = new Object();
								response.results = objSongIndex.arrayIndex;
								
								objOptions.LoadPLDB();
							});
						
		}
	},
	
	FuckYouHP: function(arrayAppend, pageNext)
	{
		console.log("Starting Get Next Page (at FYHP)");
		
		objSongIndex.arrayExisting = objSongIndex.arrayExisting.concat(arrayAppend);
	
		var parameters = {
			query: {
				from: SongSchema_ID,
				orderBy: "path",
				"page": pageNext
			}
		};
		
		CallPalmService('palm://com.palm.db/find', 
						parameters,
						false,
						function(response)
						{
							//console.log("Return from GetNextPage call");
							
							objSongIndex.arrayCurFiles = response.results;
							objSongIndex.next = response.next;
							
							if (response.next)
							{
								objSongIndex.FuckYouHP(objSongIndex.arrayCurFiles,
														objSongIndex.next);	
							}
							else
							{
								objSongIndex.GetPreSongs(objSongIndex.arrayCurFiles);
							}
						},
						function()
						{	
							objSongIndex.GetPreSongs(new Array());
						});
	
	},
	
	GetPreSongs: function(arrayCurFiles)
	{			
		ProfilerTickAndRestart("GetPreSongs");
		
		objSongIndex.arrayExisting = objSongIndex.arrayExisting.concat(arrayCurFiles);
	
		var iFront = objSongIndex.arrayExisting.length;
		
		while (iFront--)
		{
			var objFromBefore = objSongIndex.arrayExisting[iFront];
			var objSong = objwAMP.hashPaths[objFromBefore.path];
			
			if ((objSong) && (objSong.dirty == "clean"))
			{
				objFromBefore.found = 1;
				objwAMP.hashPaths[objFromBefore.path] = objFromBefore;
			}
		}
		
		objSongIndex.arrayExisting = 0;
		
		setTimeout(function()
		{
			objSongIndex.GetMetadataFromPlugin();
		}, 1);
	},
	
	GetMetadataFromPlugin: function()
	{	
		ProfilerTickAndRestart("GetMetadataFromPlugin");
		
		objSongIndex.fakeForIn = [];
		
		objSongIndex.cnt = 0;
		
		for (var i in objwAMP.hashPaths)
			objSongIndex.fakeForIn.push(i);
		
		if (objSongIndex.fakeForIn.length)
			setTimeout(objSongIndex.WorkAroundScriptTimeout, 1);
		else
			setTimeout(objSongIndex.SkipToEnd, 1);
	},
			
	WorkAroundScriptTimeout: function()
	{
		var objSong = objwAMP.hashPaths[objSongIndex.fakeForIn[objSongIndex.cnt++]];
		
		objwAMP.funcUpdateMetaData(objSongIndex.cnt, objSongIndex.fakeForIn.length, objSong.path);
		
		while (objSong.found)
		{
			objSongIndex.arrayIndex.push(objSong);
			if (objSongIndex.cnt >= objSongIndex.fakeForIn.length)
			{
				setTimeout(objSongIndex.SkipToEnd, 1);
				return;
			}
		
			objSong = objwAMP.hashPaths[objSongIndex.fakeForIn[objSongIndex.cnt++]];
			objwAMP.funcUpdateMetaData(objSongIndex.cnt, objSongIndex.fakeForIn.length, objSong.path);
		}
		
		if (!objSong.found)
		{	
			try
			{
				var objTemp = objwAMP.GetMetadata(objSong.path);
				
				//console.log("Returned from GetMetadata");
				
				objSong.artist = objTemp.artist;
				objSong.albumArtist = objTemp.albumArtist;
				objSong.title = objTemp.title;
				objSong.genre = objTemp.genre;
				objSong.album = objTemp.album;
				objSong.track = objTemp.track;
				
				var bFound = 0;
					
				if (objOptions.bCheckDir)
				{
					var path = objSong.path;
					
					var str = objwAMP.CheckForImg(path.substring(0,
											path.lastIndexOf('/')));
					
					if (str != "-1")
					{
						str = path.substring(0, path.lastIndexOf('/')) +
													"/" + str;
					
						bFound = 1;

						objSong.imgSmall = str;
						objSong.imgThumb = str;
						objSong.imgLarge = str;

					}
				}
				
				if (!bFound)
				{
					objSong.imgSmall = "res/player/noimgsm.png";
					objSong.imgThumb = "res/player/noimgthm.png";
					objSong.imgLarge = "res/player/spinimg.png";
				}
			
				objSongIndex.CleanSong(objSong);
				objSong.dirty = "clean";
				
				// TODO: Need to add a batch update
			}
			catch (e)
			{
				console.log(strJSON);
				console.log(e);
			}
		}
		
		//console.log("About to push");
		
		objSongIndex.arrayIndex.push(objSong);
		
		//console.log("Pushed");
	
		if (objSongIndex.cnt < objSongIndex.fakeForIn.length)
			setTimeout(objSongIndex.WorkAroundScriptTimeout, 1);
		else
			setTimeout(objSongIndex.SkipToEnd, 1);
	},
		
		
	SkipToEnd: function()
	{
		console.log("Finished :-) :-) :-) :-)");
		
		objwAMP.hashPaths = 0;
		
		console.log("About to run DB8 stuff");
		
		setTimeout(function(){
			objOptions.LoadPLDB();
		}, 1);
	
	},
	
	FinishedAddingSongs: function()
	{
		ProfilerTickAndRestart('FinishedAddingSongs');
		
		sceneSplash.ShowPlayer();
		paneControls.SetValsFromDB();
		
		objSongIndex.objAlbums = new Object();
		objSongIndex.objArtists = new Object();
		objSongIndex.objGenres = new Object();
		objSongIndex.arrayTitles = new Array();
		
		for (var i=0; i<objSongIndex.arrayIndex.length; i++)
		{
			try
			{
				var objAlbumEntry = new Object();
				objAlbumEntry.category = "Album: ";
				var objArtistEntry = new Object();
				var objTitleEntry = new Object();
				objTitleEntry.category = "Title: ";
								
				objSongIndex.objQuickIndexLoc[objSongIndex.arrayIndex[i].path] = i;
				
				objTitleEntry.keyword = objSongIndex.arrayIndex[i].title;
				

				objAlbumEntry.album = objSongIndex.arrayIndex[i].album;
				objTitleEntry.desc = "(Album: " +
										objSongIndex.arrayIndex[i].album;
				
				objAlbumEntry.albumArtist = objSongIndex.arrayIndex[i].albumArtist;
				
				objAlbumEntry.artist = objArtistEntry.artist = objSongIndex.arrayIndex[i].artist;
				objTitleEntry.desc += " Artist: " +
										objSongIndex.arrayIndex[i].artist;
			
				var strGenre = objSongIndex.arrayIndex[i].genre.toLowerCase();
				var strCheck = objSongIndex.objGenres[strGenre];
				if (!strCheck ||
						(strCheck > 
								objSongIndex.arrayIndex[i].genre))
				{
					objSongIndex.objGenres[strGenre] = objSongIndex.arrayIndex[i].genre;
				}
				
				objArtistEntry.genre = objAlbumEntry.genre = objSongIndex.arrayIndex[i].genre;
				objTitleEntry.desc += " Genre: " + 
									  objSongIndex.arrayIndex[i].genre +
									  ")";
				
				if (objAlbumEntry.albumArtist)
				{
					objAlbumEntry.strUseForUnique = objAlbumEntry.album + 
												'-' +
												objAlbumEntry.albumArtist;
				}
				else
				{
					objAlbumEntry.strUseForUnique = objAlbumEntry.album + 
												'-' +
												objAlbumEntry.artist;
				}
			
				var strAlbum = objAlbumEntry.strUseForUnique.toLowerCase();
				var objAlbCheck = objSongIndex.objAlbums[strAlbum];
				if (!objAlbCheck || !objAlbCheck.album ||
						(objAlbCheck.album > objAlbumEntry.album))
				{
					objSongIndex.objAlbums[strAlbum] = objAlbumEntry;
				}
								
				if (objSongIndex.arrayIndex[i].imgLarge &&
					(objSongIndex.arrayIndex[i].imgLarge !=
						"res/player/spinimg.png"))
				{
					objSongIndex.objAlbums[strAlbum].imgLarge =
									objSongIndex.arrayIndex[i].imgLarge;
					objSongIndex.objAlbums[strAlbum].imgSmall =
									objSongIndex.arrayIndex[i].imgSmall;
					objSongIndex.objAlbums[strAlbum].imgThumb =
									objSongIndex.arrayIndex[i].imgThumb;
					objSongIndex.objQuickFindImg[objSongIndex.arrayIndex[i].path] = 
									objSongIndex.arrayIndex[i].imgLarge;
				
				}
				else
				{
					var bFound = 0;
				
					if (objOptions.bCheckDir)
					{
						var path = objSongIndex.arrayIndex[i].path;
						
						var str = objwAMP.CheckForImg(path.substring(0,
												path.lastIndexOf('/')));
						
						if (str != "-1")
						{
							str = path.substring(0, path.lastIndexOf('/')) +
														"/" + str;
							var objSong = objSongIndex.arrayIndex[i];
							bFound = 1;
							objSong.imgSmall = str;
							objSong.imgThumb = str;
							objSong.imgLarge = str;
							objSongIndex.objQuickFindImg[path] = 
									objSongIndex.objAlbums[strAlbum].imgLarge;			
						}
					}
				
				
				}
				
				var strArtist = objSongIndex.arrayIndex[i].artist.toLowerCase();
				var objArtCheck = objSongIndex.objArtists[strArtist];
				if (!objArtCheck || !objArtCheck.artist ||
						(objArtCheck.artist > objArtistEntry.artist))
				{
					objSongIndex.objArtists[strArtist] = objArtistEntry;
				}
				
				
				objSongIndex.arrayTitles.push(objTitleEntry);
			
			}
			catch(e)
			{
				console.log(e);
				continue;
			}
		}
		
		setTimeout(function()
		{
			objSongIndex.FinishSearchIndex();
		}, 1);
	},
			
	FinishSearchIndex: function()
	{	
		ProfilerTickAndRestart("FinishSearchIndex");
		
		try
		{
			objSongIndex.arraySearchIndex = new Array();
		
			objSongIndex.arrayGenres = new Array();
			
			for (var i in objSongIndex.objGenres)
			{
				var strGenre = objSongIndex.objGenres[i];
				objSongIndex.arraySearchIndex.push({'category':"Genre: ",
								'keyword':strGenre,
								'desc': ''});
				objSongIndex.objGenres[i] =
					objSongIndex.arrayGenres.push(strGenre) - 1;
			}

			//console.log("About to deal with arrayArtists");
			
			objSongIndex.arrayArtists = new Array();
			
			for (var i in objSongIndex.objArtists)
			{
				var structArtist = objSongIndex.objArtists[i];
				objSongIndex.arraySearchIndex.push({'category':"Artist: ",
								'keyword':structArtist.artist,
								'desc': "(Genre: " + structArtist.genre + ')'});
				objSongIndex.objArtists[i] = 
							objSongIndex.arrayArtists.push(structArtist.artist) - 1;
			}

			
			//console.log("About to deal with arrayAlbums");
			
			objSongIndex.arrayAlbums = new Array();
			
			for (var i in objSongIndex.objAlbums)
			{
				var structAlbum = objSongIndex.objAlbums[i];
				var strDesc = "(Artist: " +
										structAlbum.artist +
										" Genre: " + 
										structAlbum.genre +
										')';
				objSongIndex.arraySearchIndex.push({'category':"Album: ",
								'keyword':structAlbum.album,
								'desc': strDesc});
				objSongIndex.objAlbums[i] = 
							objSongIndex.arrayAlbums.push(structAlbum) - 1;
			}
			
			//console.log("About to deal with arrayTitles");
			
			objSongIndex.arraySearchIndex = 
						objSongIndex.arraySearchIndex.concat(objSongIndex.arrayTitles);
			
			var i = objSongIndex.arraySearchIndex.length;
			while(i--)
				objSongIndex.arraySearchIndex[i]._kind = SearchSchema_ID;
			
			//console.log("About to do Just Type stuff");
			
			var parameters = { "ids": [objwAMP.objParam]}
		
			CallPalmService('palm://com.palm.db/get', 
							parameters,
							false,
							function(response)
							{							
								var arg = response.results;
								try
								{
									/*console.log("Response from get of JustType:" +
												JSON.stringify(response));*/
									paneSongList.objBufferedObj = arg[0];
									paneSongList.HandleJustType(paneSongList.objBufferedObj);
								}
								catch (e) {console.log("Issue with JT:" + e);}
								
								try
								{
									objSongIndex.HandleSearchKind(objSongIndex.arraySearchIndex);
								}
								catch (e)
								{
									console.log("Guess JT ain't happening this time");
								}
								
							});
		
			objSongIndex.arrayRawPaths = 0;
		}
		catch(e)
		{
			var strError = "An error occured while building the index.  Please email the following error to blaclynx@yahoo.com:";
				
			strError += e;
			
			document.getElementById('idTellUser').innerHTML = strError;
			document.getElementById('idButtonGoesHere').innerHTML = "Ok";
			document.getElementById('idDialog').style.display = "block";
			sceneSplash.ShowPlayer();
			return;
		}
		
		setTimeout(function()
		{
			objSongIndex.funcGood();
		}, 10);
		objSongIndex.RefreshSongKind();
	},
	
	
	HandleSearchKind: function(arraySearchIndex)
	{
	
		console.log("HandleSearchKind starting");
	
		var parameters = {"id":SearchSchema_ID};
		
		CallPalmService("palm://com.palm.db/delKind",
				parameters,
				false,
				function()
				{
					console.log("Here after delKind");
					
					CallPalmService('palm://com.palm.db/putKind',
							objSongIndex.SearchSchema,
							false,
							function()
							{
								console.log("Here after putKind");
							
								var permObj = [
								{
									"type":"db.kind",
									"object":SearchSchema_ID,
									"caller":"com.palm.launcher",
									"operations":{"read":"allow"}
								}];
								
								var parameters = {"permissions":permObj};
								
								CallPalmService("palm://com.palm.db/putPermissions",
										parameters,
										false,
										function(response)
										{
											console.log("Here after permissions");
										
											var arrayStandIn = arraySearchIndex.slice(0);
										
											var parameters = {
												"objects": arrayStandIn
											};
										
											CallPalmService('palm://com.palm.db/put', 
													parameters,
													false,
													function(response)
													{															
														objSongIndex.arraySearchIndex = 0;
													},
													function(response)
													{
														console.log("Error:" + 
															JSON.stringify(response));
													});
										},
										function(resposne)
										{
											console.log("Error:" + 
															JSON.stringify(response));
										
										});
								
							});	
				});
	
	},
	
	NoImageError: function(objSong)
	{
		objSong.imgSmall = "res/player/noimgsm.png";
		objSong.imgThumb = "res/player/noimgthm.png";
		objSong.imgLarge = "res/player/spinimg.png";
	},
	
	SetImageThm: function(objSong, strThm)
	{
		if (!strThm)
			objSong.imgThumb = "res/player/noimgthm.png";
		else
			objSong.imgThumb = strThm;
	},
	
	SetImageSmall: function(objSong, strSmall)
	{
		if (!strSmall)
			objSong.imgSmall = "res/player/noimgsm.png"; 
		else
			objSong.imgSmall = strSmall;
	},
	
	SetImageLarge: function(objSong, strLarge)
	{
		if (!strLarge)
			objSong.imgLarge = "res/player/spinimg.png"; 
		else
			objSong.imgLarge = strLarge;
	},
	
	RefreshSongKind: function(arrayPathIndex)
	{
		var parameters = {"id":SongSchema_ID};
		
		CallPalmService("palm://com.palm.db/delKind",
				parameters,
				false,
				function()
				{
					console.log("Here after songscheme delKind");
					
					CallPalmService('palm://com.palm.db/putKind',
							objSongIndex.SongSchema,
							false,
							function()
							{
								console.log("Here after songscheme Put Kind");
							
								var arrayStandIn = objSongIndex.arrayIndex.map(function(x)
								{
									x._kind = SongSchema_ID;
									return x;
								});
								
								//console.log(JSON.stringify(arrayStandIn));
								
								var parameters = {
									"objects": arrayStandIn
								};
										
								CallPalmService('palm://com.palm.db/put', 
												parameters,
												false,
												function(response)
												{
													//console.log("Success:" + JSON.stringify(response));
												},
												function(response)
												{
													console.log('error:' + JSON.stringify(response));
												});
								
							},
							function(response)
							{
								console.log('error:' + JSON.stringify(response));
							});	
				},
				function(response)
				{
					console.log('error:' + JSON.stringify(response));
				});
	
	},
	
	CleanSong: function(objSong)
	{
		if ((!objSong.genre) || (objSong.genre == "") || (objSong.genre == "(null)"))
			objSong.genre = "[Unknown]";
		if ((!objSong.artist) || (objSong.artist == "") || (objSong.artist == "(null)"))
			objSong.artist = "[Unknown]";				
		if ((!objSong.album) || (objSong.album == "") || (objSong.album == "(null)"))
			objSong.album = "[Unknown]";						
		if ((!objSong.title) || (objSong.title == "") || (objSong.title == "(null)"))
			objSong.title = "[Unknown]";
		if ((!objSong.path) || (objSong.path == "") || (objSong.path == "(null)"))
			objSong.path = "[Unknown]";
		if ((!objSong.name) || (objSong.name == "") || (objSong.name == "(null)"))
			objSong.name = "[Unknown]";	
	},
	

		
	// To delete the indexes:
	// luna-send -n 1 -a com.epik.audiophilehd luna://com.palm.db/delKind '{"id":"com.epik.pathindex:1"}'
	// luna-send -n 1 -a com.epik.audiophilehd luna://com.palm.db/delKind '{"id":"com.epik.searchindex:1"}'
		

	PlayAll: function(iTrackArg)
	{
		var iTrack = iTrackArg;
		
		if (!iTrack)
			iTrack = 0;
		
		if (!(this.arrayIndex[iTrack]) || 
			 (this.arrayIndex[iTrack].length == 0))
			return -1;
		
		objwAMP.SetPlaylist(iTrack, this.arrayIndex);
	},
	
	SaveCurPlaylist: function(iTrack)
	{
		var strPL = JSON.stringify(objwAMP.GetPlaylist(iTrack));
	
		objOptions.dbOptions.transaction(function (sql) 
		{  
			sql.executeSql("UPDATE 'audio_cur_song' SET jsonPL = ? " +
							"WHERE name = ?", 
							[strPL, CURRENT_PLAYLIST_PLNAME]);
		});
	},
	
	SaveCurPos: function(iCurPos)
	{
		objOptions.dbOptions.transaction(function (sql) 
		{  
			sql.executeSql("UPDATE 'audio_cur_song' SET curPos = ? " +
							"WHERE name = ?", 
							[iCurPos, CURRENT_PLAYLIST_PLNAME]);
		});	
	},
	
	SaveCurIndex: function(iIndex)
	{
		objOptions.dbOptions.transaction(function (sql) 
		{  
			sql.executeSql("UPDATE 'audio_cur_song' SET startIndex = ? " +
							"WHERE name = ?", 
							[iIndex, CURRENT_PLAYLIST_PLNAME]);
		});	
	
	},


	SongSchema: {
    "id": SongSchema_ID,
    "owner": OWNDER_STR,
	"indexes": [
		{
            "name": "path",
            "props": [
                {
                    "name": "path" 
                } 
            ] 
        }
	]},
	
	SearchSchema: {
    "id": SearchSchema_ID,
    "owner": OWNDER_STR,
	"indexes": [
		{
            "name": "keyword",
            "props": [
                {
                    "name": "keyword" 
                } 
            ] 
        }
	]}
	
}

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
	
	arrayPLRaw: [],
	
	objImageCache: new Object(),
	
	iIndexCallbackCnt: 0,
	iIndexPLCnt: 0,
	arrayFoundPLs: [],
	
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
			this.plugIn.CheckDir = function()
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

	
	/*****************************
	 * Rerun the indexer
	 *****************************/
	RedoIndexer: function()
	{
		this.plugIn.RedoIndex();
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
	
	CheckIndex: function(funcIndexStart, 
						funcUpdateFoundCount, 
						funcUpdateMetaData)
	{
		objwAMP.funcIndexStart = funcIndexStart;
		objwAMP.hashPaths = {};
		objwAMP.funcUpdateFoundCount = funcUpdateFoundCount;
		objwAMP.funcUpdateMetaData = funcUpdateMetaData;
	},
	
	AddToIndex: function(str, modstate)
	{				
		var ext = str.lastIndexOf('.');
		
		ext = str.substr(ext+1);
		
		if (ext.toLowerCase() == 'm3u')
		{
			objwAMP.iIndexPLCnt++;
			objwAMP.arrayFoundPLs.push(str);
		}
		else
		{
			var objSong = {"path":str,
						   "dirty": modstate,
						   "found": 0};
			
			objSong.name = str.substr(str.lastIndexOf('/') + 1)
			
			objwAMP.hashPaths[str] = objSong;
			objwAMP.iIndexCallbackCnt++;
		}
		
		objwAMP.funcUpdateFoundCount(objwAMP.iIndexCallbackCnt, objwAMP.iIndexPLCnt);
		
	},
	
	/******************************
	 * Callback for reindex
	 ******************************/
	FinishIndex: function(strPath)
	{				
		//console.log("Finished");
		
		objwAMP.funcUpdateFoundCount(objwAMP.iIndexCallbackCnt, objwAMP.iIndexPLCnt);
		
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
		
		objwAMP.quickNameLookUp = {};
		
		for (i in objwAMP.hashPaths)
			objwAMP.quickNameLookUp[objwAMP.hashPaths[i].name] = i;
		
		objwAMP.iIndexStatus = objSongIndex.Init(function()
		{
			console.log("Indexer Called Back");
			
			objwAMP.iIndexStatus = INDEX_FINISHED;
		
			objwAMP.funcIndexStart(INDEX_FINISHED);
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
		//objOptions.UpdateLastPlayed(strNewPath);
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
		
		//localStorage[epik.audiophile.curtime] = objState.CurTime;
		
		//objSongIndex.SaveCurPos(objState.CurTime);
	
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
		
		paneScrub.iLastFmCntDn = 100;
		
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
		
		objwAMP.arraySongStartObj[iTrackNum].scrobbleThis = 1;
		
		if (artist && artist != "0")
			objwAMP.arraySongStartObj[iTrackNum].artist = artist;
		else
		{
			objwAMP.arraySongStartObj[iTrackNum].artist = path;
			objwAMP.arraySongStartObj[iTrackNum].scrobbleThis = 0;	
		}
		
		if (title && title != "0")
		{
			objwAMP.arraySongStartObj[iTrackNum].title = title;
		}
		else
		{
			var iFindName = path.lastIndexOf('/') + 1;
			objwAMP.arraySongStartObj[iTrackNum].scrobbleThis = 0;
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
		
		if (objwAMP.arraySongStartObj[iTrack].scrobbleThis)
		{
			paneScrub.bLastFmDirty = 1;
			paneScrub.iLastFmCntDn = 100;
			paneScrub.strLastFmTitle = objSong.title;
			paneScrub.strLastFmArtist = objSong.artist;
		}
		else
		{
			paneScrub.bLastFmDirty = 0;
			paneScrub.iLastFmCntDn = 1;
		}
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
	
	DirectOpen: function(str, iTrack)
	{
		objwAMP.CallOpenSong(str, iTrack, 1);
		this.iOpenIndex[iTrack] = -1;
	
	},
	
	CallOpenSong: function(str, iTrack, bIsSafeish)
	{
		if ((typeof str == "string") && 
			((str.indexOf("/media/internal") == 0) ||
			 (str.indexOf("http") == 0) ||
			 (str.indexOf("file") == 0)))
		{
			console.log("Opening: " + str);
			this.plugIn.Open(str, iTrack);
		}
	},
	
	CallSetNext: function(str, transition, iTrack, bIsSafeish)
	{
		if (isNaN(transition))
			transition = 0.0;

		if (typeof str == "string")
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
	
		return (this.plugIn.CheckDir("/media/internal/music", 1, bCreate) | 0);
	},

	CheckFile: function(strFile)
	{
		return (this.plugIn.CheckDir(strFile, 0, 0) | 0);
	},
	
	ProcessXMLPl: function(xml)
	{
		objwAMP.funcURLCallB(xml, objwAMP.HandleURL);
	},
	
	ProcessM3UPl: function(m3u)
	{
		objwAMP.funcM3U(m3u, objwAMP.HandleURL);
	},
	
	ProcessError: function(a, b, c)
	{
		console.log("Error:" + a + b + c);
	},
	
	HandleUrl: function(url, 
						iTrack, 
						funcCallBackXML,
						funcM3U,
						funcCallBackSong)
	{
		objwAMP.funcURLCallB = funcCallBackXML;
		objwAMP.HandleURL = url;
		objwAMP.funcM3U = funcM3U;
		
		var retVal = [];
		
		var ext = url.lastIndexOf('.');
		
		if (ext == -1)
			return;
		
		ext = url.substr(ext);
		
		if (ext.length == 1)
			return;
		
		ext = ext.substr(1);
		
		switch (ext.toLowerCase())
		{
		case "xml":
			$.ajax({
				type: "GET",
				url: url,
				dataType: "xml",
				success: objwAMP.ProcessXMLPl
			});
			return 0;
		case "m3u":
			console.log("Getting to the right AJAX call");
			$.ajax({
				type: "GET",
				url: url,
				success: objwAMP.ProcessM3UPl,
				error: objwAMP.ProcessError
			});
			return 0;			
		case "mp3":
		case "flac":
		case "aac":
		case "wma":
		case "m4a":
		case "ra":
			funcCallBackSong(FormatHTTP(url));
		}
		
		return -1;
	}
}
