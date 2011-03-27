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
var INDEX_TYPE_FF	= true;
var INDEX_TYPE_ALL 	= false;

// these are the status of the index
var INDEX_NOT_READY_YET = 0;
var INDEX_ALREADY_RUN = 1;
var INDEX_FIRST_RUN = 2;

var PLAY_MODE_RANDOM = 1;
var PLAY_MODE_NORMAL = 0;

// Fast implementation for array unique
//	modified to select for the particular song property
uniqueArray = function(array, strProp) {
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
};

function wAMP()
{
// Private:
	
	// this is the current path we are on, set to root dir
	this.strCurrentPath = "/media/internal"; 
	
	// this is an enum to tell whether we are using FileFolder type io or
	//	full indexing type io
	this.indexType = 0;
	
	this.mutexLikeCheck = 0;
	
	this.iPlayMode = PLAY_MODE_NORMAL;
	
	// This will hold the song list for viewing
	this.arrayFileList = new Array();
	
	// This tracks which kind of song item view we have
	this.iSongViewType = INDEX_TYPE_FF;

	// This needs to be initialized to cut down on divs
	// it is the scaling variable to the total time
	this.fTimeScale == 9999
	
	this.arraySongProp = new Object();
	this.arraySongProp["album"] = new Object();
	this.arraySongProp["artist"] = new Object();
	this.arraySongProp["genre"] = new Object();
	this.arraySongProp["title"] = new Object();
	
// Public:


	/******************************
	 * Create the plugin html object code
	 ******************************/
	wAMP.prototype.CreatePluginHook = function()
	{
	    this.pluginObj = window.document.createElement("object");
    
		this.pluginObj.id = "wAMPPlugin";
		this.pluginObj.type = "application/x-palm-remote";
		this.pluginObj.setAttribute("style", "position:fixed; top:470px; left:0px; height:1px; width:1px;");
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
	};
	
	/******************************
	 * Helper Debug function
	 ******************************/
	wAMP.prototype.Log = function(str, obj)
	{
		Mojo.Log.info(str);
		
		if (obj)
		{
			Mojo.Log.info(JSON.stringify(obj));
		}
	};
	
	/******************************
	 * Clear the Index
	 ******************************/
	wAMP.prototype.clearIndex = function()
	{
		$('wAMPPlugin').ClearIndex();
	};
	
	/******************************
	 * This function is checks whether the plugin has been
	 *	loaded yet or not
	 *
	 * Returns true - if loaded / false - if not loaded yet
	 ******************************/
	wAMP.prototype.checkIfPluginInit = function()
	{
		try
		{
			if ($('wAMPPlugin').Ping)
			{
				//this.Log("Pinging");
				if ($('wAMPPlugin').Ping() === "Pong")
				{
					//this.Log("Got Pong resposne");
					return true;
				}
				else
				{
					//this.Log("No response to Ping");
					return false;
				}
			}
			else
			{
				//this.Log("Ping hook not available");
				return false;
			}
		}
		catch (err) 
		{
			//this.Log("Problem with ping" + err);
			return false;
		}
	};
	
	
	/******************************
	 * Check if the index was previously run
	 ******************************/
	wAMP.prototype.GetIndexStatus = function(funcNotReadyCallback)
	{
		var strRetVal = $('wAMPPlugin').RunYet();
		
		var objIndexStatu = JSON.parse(strRetVal);
		
		return objIndexStatu.iRunYet;
	};
	
	wAMP.prototype.LoadIndex = function(funcNotReadyCallback)
	{
		try
		{
			this.myInterval = setInterval(funcNotReadyCallback("Loading Index"),50);
		
			var strJSON = $('wAMPPlugin').GetFullIndex(this.strCurrentPath);
			
			if (!strJSON)
			{
				clearInterval(this.myInterval);
				return;
			}
			
			// We get here if there was something in the JSON string, so parse it
			var jsonFileList = JSON.parse(strJSON);
			
			this.arrayIndexLS = jsonFileList.arrayFileList;
			
			clearInterval(this.myInterval);
			
			return;
		}
		catch (err) {this.Log(err);}
	};
	
	/******************************
	 * Run the indexer for the first time
	 ******************************/
	wAMP.prototype.RunFirstIndex = function(funcNotReadyCallback)
	{
		try
		{
			var strJSON = $('wAMPPlugin').GetFullIndex(this.strCurrentPath);
			
			if (!strJSON)
				return;
			
			// We get here if there was something in the JSON string, so parse it
			var jsonFileList = JSON.parse(strJSON);
			
			if (jsonFileList.NotReadyYet)
			{
				var strForOutput = jsonFileList["NotReadyYet"];
			
				if (strForOutput.length > 18)
				{
					strForOutput = "..." + strForOutput.substr((strForOutput.length - 15), 15);
				}
			
				funcNotReadyCallback("Indexing: " + strForOutput);
				return 0;
			}
			
			this.arrayIndexLS = jsonFileList.arrayFileList;
			
			this.arrayI
			
			return 1;
		}
		catch (err) {this.Log(err);}
	};

	
	/******************************
	 * Gets the file list based on which option we are using
	 ******************************/
	wAMP.prototype.getPlayList = function()
	{
		this.arrayPlayingArray;
	};
	/******************************
	 * Sets the file list, useful for filtered and playlist results
	 ******************************/
	wAMP.prototype.setPlayList = function(arrayFileList)
	{
		this.arrayPlayingArray = arrayFileList;
	};
	
	/******************************
	 * Gets the file list based on which option we are using
	 ******************************/
	wAMP.prototype.getFileList = function()
	{
	
		this.arrayWorkingArray = ((this.iSongViewType == INDEX_TYPE_FF) ? this.getDirFileList() : this.getIndexFileList());
		
		return this.arrayWorkingArray;
	};
	
	
	/******************************
	 * This function gets the ls of whatever the current dir is set to
	 *
	 * Returns: An array of objects which is made up of
	 *			the songs and dirs in a particular file
	 ******************************/
	wAMP.prototype.getIndexFileList = function()
	{
		return this.arrayIndexLS;
	};
	
	
	/******************************
	 * This function gets the ls of whatever the current dir is set to
	 *
	 * Returns: An array of objects which is made up of
	 *			the songs and dirs in a particular file
	 ******************************/
	wAMP.prototype.getDirFileList = function()
	{
		
		try
		{
			// Check if we have already visited this dir previously
			if (this.arrayFileList[this.strCurrentPath])
			{
				// If we have, just return what we found before
				return this.arrayFileList[this.strCurrentPath];
			}
			else
			{	
				// this is the first time we have visited this dir
				//	so build the ls of it
			
				// Have the plugin get the info for the available files
				//	and pass it to the js app via JSON formatted string
				var strJSON = $('wAMPPlugin').GetCurrentDirLS(this.strCurrentPath, 0);
			
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
					
					this.arrayFileList[this.strCurrentPath] = [objAppendItem];
					return this.arrayFileList[this.strCurrentPath];
				}
			
				// We get here if there was something in the JSON string, so parse it
				var jsonFileList = JSON.parse(strJSON);
				//this.Log("Here is the JSON object", jsonFileList);
				
				this.arrayFileList[this.strCurrentPath] = jsonFileList.arrayFileList;	
			
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
					this.arrayFileList[this.strCurrentPath].splice(0, 0, objAppendItem);
				}
				
				return this.arrayFileList[this.strCurrentPath];
			}
		}
		catch (err) {this.Log(err);}
		
	};
	
	
	/******************************
	 * This function gets the current path for folder ls
	 *
	 * Returns: A string with the current path
	 ******************************/
	wAMP.prototype.getCurrentPath = function()
	{
		return this.strCurrentPath;
	};
	/******************************
	 * This function sets the current path for folder ls
	 *
	 * Returns: None
	 ******************************/
	wAMP.prototype.setCurrentPath = function(strDir)
	{
		this.strCurrentPath = strDir;
	};
	
	
	/******************************
	 * Get the type of view we are
	 ******************************/
	wAMP.prototype.getFolderView = function()
	{
		return ((this.iSongViewType == INDEX_TYPE_FF)? true : false);
	};
	/******************************
	 * Set the type of view we are
	 ******************************/
	wAMP.prototype.setFolderView = function(iViewType)
	{
		this.arrayWorkingArray = ((iViewType == INDEX_TYPE_FF) ? this.getDirFileList() : this.getIndexFileList());
		this.iSongViewType = ((iViewType == true)? INDEX_TYPE_FF : INDEX_TYPE_ALL);
	};
	
	
	/******************************
	 * Tell the plugin handler which song to start playing
	 ******************************/
	wAMP.prototype.setIndex = function(iIndex, strFilter)
	{
		this.iSongIndex = iIndex;
	};
	 
	/******************************
	 * Tell the plugin handler which song to start playing
	 ******************************/
	wAMP.prototype.getNextIndex = function(iIndex)
	{
		var iRet = this.iSongIndex;
		
		var iCheck;
		
		do 
		{
			if (this.iPlayMode == PLAY_MODE_RANDOM)
				iRet = Math.floor(Math.random()*this.arrayPlayingArray.length);
			else
				iRet = (iRet + 1) % this.arrayPlayingArray.length;
			
			iCheck = this.isPlayable(iRet);
		
		} while (!(iCheck));
		
		return iRet;
	};
	 
	 /******************************
	 * Tell the plugin handler which song to start playing
	 ******************************/
	 wAMP.prototype.getPreviousIndex = function(iIndex)
	 {
		var iRet = this.iSongIndex;
		
		do 
		{
			if (this.iPlayMode == PLAY_MODE_RANDOM)
				iRet = Math.floor(Math.random()*this.arrayPlayingArray.length);
			else
			{
				iRet--;
				if (iRet < 0)
					iRet = this.arrayPlayingArray.length - 1;
			}	
				
		} while (this.isPlayable(iRet) == false);
		
		return iRet;
	 };
	 
	 /******************************
	 * Tell the plugin handler to pick a random song
	 ******************************/
	 wAMP.prototype.indexRandomPlay = function()
	 {
		this.setFolderView(false);
		this.setPlayList(this.getFileList());
		this.iPlayMode = PLAY_MODE_RANDOM;
		this.iSongIndex = Math.floor(Math.random()*this.arrayPlayingArray.length);
	 };
	 
	 
	 /******************************
	 * Check if the song is playable
	 ******************************/
	 wAMP.prototype.isPlayable = function(iIndex)
	 {
		if (this.arrayPlayingArray[iIndex].isDir)
			return false;
		
		if (this.iSongViewType == INDEX_TYPE_ALL)
			return true;
		
		if (this.arrayPlayingArray[iIndex].isSong)
			return true;
			
		if (this.arrayPlayingArray[iIndex].isNotPlayable)
			return false;
		
		var strVal = $('wAMPPlugin').IsPlayable(this.arrayPlayingArray[iIndex].path)
		
		var objJSON = JSON.parse(strVal);
		
		if (objJSON.iPlayable == 0)
		{
			this.arrayPlayingArray[iIndex].isNotPlayable = 1;
			return false;
			
		}
		else
		{
			this.arrayPlayingArray[iIndex].isSong = 1;
			return true;
		}
		
	 };
	 
	 /******************************
	  * Tell the player to play randomly
	  ******************************/
	 wAMP.prototype.setRandomPlay = function(iRandom)
	 {
		this.iPlayMode = ((iRandom == true) ? PLAY_MODE_RANDOM : PLAY_MODE_NORMAL);
	 };
	 wAMP.prototype.getRandomPlay = function()
	 {
		return ((this.iPlayMode == PLAY_MODE_RANDOM) ? true : false);
	 };
	 
	 
	/*******************************
	 * Tell the plugin to load the song at the current index
	 * 	or you can pass it an index variable
	 *******************************/
	 wAMP.prototype.OpenCurrentSong = function(iIndex)
	 {
		if (iIndex)
			this.setIndex(iIndex);
	 
		$('wAMPPlugin').Open(this.arrayPlayingArray[this.iSongIndex].path);
	 };
	 
	 /*******************************
	 * Tell the plugin to Play the next song
	 *******************************/
	 wAMP.prototype.OpenNextSong = function()
	 {
		this.setIndex(this.getNextIndex());
	 
		$('wAMPPlugin').Open(this.arrayPlayingArray[this.iSongIndex].path);

	};
	
	
	/*******************************
	 * Tell the plugin to use a new next song
	 *******************************/
	 wAMP.prototype.setNextSong = function()
	 {		
		$('wAMPPlugin').SetNext(this.arrayPlayingArray[this.iSongIndex].path);
	};
	
	 
	 /*******************************
	 * Tell the plugin to Play the next song
	 *******************************/
	 wAMP.prototype.advanceIndex = function()
	 {		
	 
		var iIndex = this.getNextIndex();
	 
		this.Log("After GetNextIndex: " + iIndex);
	 
		this.setIndex(iIndex);
	};
	 
	 /*******************************
	 * Tell the plugin to play the previous song
	 *******************************/
	 wAMP.prototype.OpenPrevSong = function()
	 {
		this.setIndex(this.getPreviousIndex());
	 
		$('wAMPPlugin').Open(this.arrayPlayingArray[this.iSongIndex].path);
	 };
	 
	/*******************************
	 * Sort the song list by the specified property
	 *******************************/
	 wAMP.prototype.SortIndex = function(strSortByProp)
	 {
		this.strSortKey = strSortByProp;
	 
		this.arrayWorkingArray.sort(function(a, b){
										var strA=a[strSortByProp].toLowerCase(), strB=b[strSortByProp].toLowerCase()
										if (strA < strB) //sort string ascending
											return -1 
										if (strA > strB)
											return 1
										return 0 //default return value (no sorting)
									});
	 };
	 
	 
	 /*******************************
	 * Tell the plugin to pause
	 *******************************/
	 wAMP.prototype.pause = function()
	 {
		$('wAMPPlugin').Pause();
	 };
	 
	 /*******************************
	 * Tell the plugin to play
	 *******************************/
	 wAMP.prototype.play = function()
	 {
		$('wAMPPlugin').Play();
	 };
	  
	/*******************************
	 * This returns a filtered list based on the
	 *	the property we are filtering, and the filter string
	 *******************************/
	 wAMP.prototype.FilterSongs = function(strProp, strValue)
	 {
		
		this.strFilterStrProp = strProp;
		this.strFilterStrValue = strValue;
		
		var funcFilter = function (x)
		{
			return (x[this.strFilterStrProp] == this.strFilterStrValue);
		};
		
		return this.arrayIndexLS.filter(funcFilter.bind(this));
	 }

	/*******************************
	 * This function gets the current state
	 *******************************/
	 wAMP.prototype.getState = function()
	 {
		var StateString = $('wAMPPlugin').GetState();
		
		this.objPluginState = JSON.parse(StateString);
		
		return this.objPluginState;
	 }
	 
	/*******************************
	 * Set the speed control
	 *******************************/
	 wAMP.prototype.setSpeed = function(strSpeed)
	 {
		$('wAMPPlugin').SetSpeed(fSpeed);
	 }
	 
	 /*******************************
	 * Set the vol control
	 *******************************/
	 wAMP.prototype.setVol = function(strVol)
	 {
		$('wAMPPlugin').SetVol(strVol);
	 } 
	 
	/*******************************
	 * Set the treble control
	 *******************************/
	 wAMP.prototype.setTreble = function(strTreb)
	 {
		$('wAMPPlugin').SetTreble(strTreb);
	 } 
	 
	 /*******************************
	 * Set the bass control
	 *******************************/
	 wAMP.prototype.setBass = function(strBass)
	 {
		$('wAMPPlugin').SetBass(strBass);
	 }
	 
	 /*******************************
	 * Seek a part of the song
	 *******************************/
	 wAMP.prototype.seek = function(iNewTime)
	 {
		$('wAMPPlugin').Seek(iNewTime);
	 } 
	 
	 	
	/******************************
	 * Initialization function to register the
	 *	plugin callback
	 ******************************/
	wAMP.prototype.initPluginInterface = function(strJSON)
	{
		$('wAMPPlugin').startSong = this.startSong.bind(this);
	}
	
	/*********************************
	 * Register the scrubber so we can set the end
	 *********************************/
	 wAMP.prototype.registerFunctions = function(funcEndTime, funcTitle, funcArtistAndAlbum)
	 {
		this.funcEndTime = funcEndTime;
		this.funcTitle = funcTitle;
		this.funcArtistAndAlbum = funcArtistAndAlbum;
	 }
	
	/*********************************
	 * Callback function called by the plugin to
	 *	let the javascript know when a song has ended.
	 *********************************/
	wAMP.prototype.startSong = function(strJSON)
	{
		this.strJSON = strJSON;
		
		this.intervalStateCheck = setInterval(this.avoidPluginCall.bind(this),400);
	}
	
	/*********************************
	 * Need this to avoid calling the plugin
	 *  from the plugin callback
	 *********************************/
	wAMP.prototype.avoidPluginCall = function()
	{
		clearInterval(this.intervalStateCheck);
		if (this.mutexLikeCheck == 1)
			return;
		
		this.mutexLikeCheck = 1;
		
		this.objSongInfo = JSON.parse(this.strJSON);
		this.funcEndTime(this.objSongInfo["EndAmt"]);
		
		if (this.objSongInfo.Metadata["title"])
			this.funcTitle(this.objSongInfo.Metadata["title"]);
		else
			this.funcTitle(this.arrayPlayingArray[this.iSongIndex].name);
		
		if (this.objSongInfo.Metadata["artist"])
			this.funcArtistAndAlbum(this.objSongInfo.Metadata["artist"], this.objSongInfo.Metadata["artist"]);
		else
			this.funcArtistAndAlbum(this.arrayPlayingArray[this.iSongIndex].path);
		
		this.mutexLikeCheck = 0;
	}
 }

 /****************************************************
 -----------------------------------------------------
 NOTE: none of the functions below are used.  Because
 of some issues I found with mojo, these do not work.
 However, I eventually  want to combine everything, 
 so I am keeping these for reference.  
 
 The versions here work on chrome, but not mojo
 -----------------------------------------------------
 *****************************************************/
 
function SpinControl()
{
	this.active = 0;
	this.controller = null;
	this.angle = 0;
	this.startAngle = 0;
	this.slices = Math.PI/6;	// 12 slices

	this.iLocked = 0;
	
	this.strDebug = "";
	
	// Create a name for the div.  To make it transparent
	//	to the user in case we want to create multiples,
	//	we add a random number to the div so we don't
	//	have two with the same name.
	this.strDivWrapperID = "divSpinControl" + Number(Math.floor(Math.random() * 10000)).toString();
	this.strImgBackID = "imgBack" + Number(Math.floor(Math.random() * 10000)).toString();
	this.strImgBackID1 = "imgBackA" + Number(Math.floor(Math.random() * 10000)).toString();
	this.strImgBackID2 = "imgBackB" + Number(Math.floor(Math.random() * 10000)).toString();
	this.strImgFrontID = "imgFront" + Number(Math.floor(Math.random() * 10000)).toString();

	this.handleEvent = function (e) 
	{ 
		if (e.type == 'mousedown') 
		{
			this.rotateStart(e);
		} 
		else if (e.type == 'mousemove') 
		{
			this.rotateMove(e);
		} 
		else if (e.type == 'mouseup')
		{
			this.rotateStop(e);
		}
		
	};

	this.init = function(iLeftCoord, iTopCoord, iSize, strDivParent, funcCallBack) 
	{

		this.funcCallBack = funcCallBack;
	
		this.originX = iSize/2 + iLeftCoord;
		this.originY = iSize/2 + iTopCoord;
	
		this.strDivParent = strDivParent;
		var divParent = document.getElementById(strDivParent);
		
		this.strStyleString = "height:" +
							Number(iSize).toString() + "px; width:" +
							Number(iSize).toString() + "px; ";
		
		var divWrapper = document.createElement("div");
		divWrapper.className = "rotateableparent";
		divWrapper.setAttribute("style","top:" + Number(iTopCoord).toString() + "px; left:" +
							Number(iLeftCoord).toString() + "px; " +
							"height:" +
							Number(iSize).toString() + "px; width:" +
							Number(iSize).toString() + "px; ");
		divWrapper.id = this.strDivWrapperID;
		

		
		var divDisplay = document.createElement("div");
		divDisplay.className = "rotateabledisplay";
		divDisplay.setAttribute("style",this.strStyleString);
		var imgDisplay = document.createElement("img");
		imgDisplay.setAttribute("src", "res/knob/display.png");
		imgDisplay.className = "rotateabledisplay";
		imgDisplay.setAttribute("height",Number(iSize).toString() + "px");
		imgDisplay.setAttribute("width",Number(iSize).toString() + "px");
		divDisplay.appendChild(imgDisplay);
		divWrapper.appendChild(divDisplay); 
		
		
		divDisplay = document.createElement("div");
		divDisplay.className = "rotateableback";
		divDisplay.setAttribute("style",this.strStyleString);
		divDisplay.id = this.strImgBackID;
		imgDisplay = document.createElement("img");
		imgDisplay.setAttribute("src", "res/knob/back.png");
		imgDisplay.className = "rotateableback";
		imgDisplay.setAttribute("height",Number(iSize).toString() + "px");
		imgDisplay.setAttribute("width",Number(iSize).toString() + "px");
		divDisplay.appendChild(imgDisplay);
		divWrapper.appendChild(divDisplay); 
		
		divDisplay = document.createElement("div");
		divDisplay.className = "rotateablebackfill";
		divDisplay.setAttribute("style",this.strStyleString);
		divDisplay.id = this.strImgBackID1;
		imgDisplay = document.createElement("img");
		imgDisplay.setAttribute("src", "res/knob/back1.png");
		imgDisplay.className = "rotateablebackfill";
		imgDisplay.setAttribute("height",Number(iSize).toString() + "px");
		imgDisplay.setAttribute("width",Number(iSize).toString() + "px");
		divDisplay.appendChild(imgDisplay);
		divWrapper.appendChild(divDisplay); 
		
		
		divDisplay = document.createElement("div");
		divDisplay.className = "rotateablebackfill";
		divDisplay.setAttribute("style",this.strStyleString);
		divDisplay.id = this.strImgBackID2;
		imgDisplay = document.createElement("img");
		imgDisplay.setAttribute("src", "res/knob/back2.png");
		imgDisplay.className = "rotateablebackfill";
		imgDisplay.setAttribute("height",Number(iSize).toString() + "px");
		imgDisplay.setAttribute("width",Number(iSize).toString() + "px");
		divDisplay.appendChild(imgDisplay);
		divWrapper.appendChild(divDisplay); 
		
		divDisplay = document.createElement("div");
		divDisplay.className = "rotateablefront";
		divDisplay.setAttribute("style",this.strStyleString);
		divDisplay.id = this.strImgFrontID;
		
		imgDisplay = document.createElement("img");
		imgDisplay.setAttribute("src", "res/knob/front.png");
		imgDisplay.className = "rotateablefront";
		imgDisplay.id = this.strImgFrontID;
		imgDisplay.setAttribute("height",Number(iSize).toString() + "px");
		imgDisplay.setAttribute("width",Number(iSize).toString() + "px");
		divDisplay.appendChild(imgDisplay);
		divWrapper.appendChild(divDisplay); 
		
		
		divWrapper.addEventListener('mousedown', this, false);
		divParent.appendChild(divWrapper);
	};
	
	this.rotateStart = function(e) 
	{
	
		if (this.active)
			this.rotateStop();
		
		this.active = 1;
	
		var divWrapper = document.getElementById(this.strDivWrapperID);
	
		e.preventDefault();
		
		var startX = e.pageX - this.originX;
		var startY = e.pageY - this.originY;
		
		var fATAN2 = Math.atan2(startY, startX)* 180 * INV_PI;
		
		if (fATAN2 < 0)
			fATAN2 += 360;
		
		this.startAngle = this.angle;
		
		this.fLastAngle = fATAN2 - this.angle;
		
		divWrapper.addEventListener('mousemove', this, false);
		divWrapper.addEventListener('mouseup', this, false);
	
	};
	
	
	this.rotateMove = function(e) 
	{
		var dx = e.pageX - this.originX;
		var dy = e.pageY - this.originY;
		var fATAN2 = Math.atan2(dy, dx) * 180 * INV_PI;
		
		if (fATAN2 < 0)
			fATAN2 += 360;
		
		if (this.fLastAngle < fATAN2)
			this.angle+= 5;
		else
			this.angle -= 5;
		
		this.angle %= 360;
	
		
		this.fLastAngle = fATAN2;

		this.strDebug;
		
		if (this.angle < 0)
			this.angle += 360;
			
		if (this.angle > 180)
		{
			if (this.angle < 225)
			{
				this.angle = 225;
				this.fLastATAN2 = fATAN2;
				this.iLocked = -1;
			}
		}
		else if (this.angle > 135)
		{
			this.angle = 135;
			this.fLastATAN2 = fATAN2;
			this.iLocked = 1;
		}
		
		this.rotateProtected(this.angle);
		this.convertAndReturn();
					
	};
	
	this.rotateStop = function(e) 
	{
		this.active = 0;
		
		var divWrapper = document.getElementById(this.strDivWrapperID);
	
		/*var divOutput = document.getElementById("output");
		divOutput.innerHTML = Number(this.angle).toString();*/
	
		if (Math.abs(this.startAngle - this.angle) > 10)
		{
			if (this.angle < 20)
			{
				this.angle = 0;
				
				this.rotateProtected(this.angle);
			}
			else if (this.angle > 340)
			{
				this.angle = 360;
				
				this.rotateProtected(this.angle);
					
				this.angle = 0;
			}
		
		}
	
		divWrapper.removeEventListener('mousemove', this, false);
		divWrapper.removeEventListener('mouseup', this, false);
		
		this.convertAndReturn();
		
	};
	
	this.rotateProtected = function(fDeg)
	{
		
		var divFront = document.getElementById(this.strImgFrontID);
		var divBack = document.getElementById(this.strImgBackID);
		var divBack1 = document.getElementById(this.strImgBackID1);
		var divBack2 = document.getElementById(this.strImgBackID2);
		
		divFront.setAttribute("style", this.strStyleString + 
					"-webkit-transform:rotate(" + 
					Number(fDeg).toString() + "deg);");
		
		divBack.setAttribute("style", this.strStyleString + 
					"-webkit-transform:rotate(" + 
					Number(fDeg).toString() + "deg);");
	
		if ((fDeg > 224) && (fDeg < 315))
		{
	
			divBack1.setAttribute("style", this.strStyleString + 
					"-webkit-transform:rotate(" + 
					Number(fDeg+45).toString() + "deg);");
			divBack2.setAttribute("style", this.strStyleString);
		}
		else if ((fDeg > 45) && (fDeg < 136))
		{
					
			divBack2.setAttribute("style", this.strStyleString + 
					"-webkit-transform:rotate(" + 
					Number(fDeg-45).toString() + "deg);");
			divBack1.setAttribute("style", this.strStyleString);
		}
	
	}
	
	this.convertAndReturn = function()
	{
		var fRetVal;
		
		if (this.angle < 225)
		{
			fRetVal = 0.5 + (this.angle * .0037037);
			if (fRetVal > 0.99999) fRetVal = 1.0;
		}
		else
		{
			fRetVal = (this.angle - 225) * .0037037;
		}
	
		this.funcCallBack(fRetVal);
	};
	
};

/**
 * 
 * Find more about the Spinning Wheel function at
 * http://cubiq.org/spinning-wheel-on-webkit-for-iphone-ipod-touch/11
 *
 * Copyright (c) 2009 Matteo Spinelli, http://cubiq.org/
 * Released under MIT license
 * http://cubiq.org/dropbox/mit-license.txt
 * 
 * Version 1.4 - Last updated: 2009.07.09
 * 
 */

var SpinningWheel = {
	cellHeight: 44,
	friction: 0.003,
	slotData: [],


	/**
	 *
	 * Event handler
	 *
	 */

	handleEvent: function (e) {
		if (e.type == 'mousedown') {
			this.lockScreen(e);
			if (e.currentTarget.id == 'sw-cancel' || e.currentTarget.id == 'sw-done') {
				this.tapDown(e);
			} else if (e.currentTarget.id == 'sw-frame') {
				this.scrollStart(e);
			}
		} else if (e.type == 'mousemove') {
			this.lockScreen(e);
			
			if (e.currentTarget.id == 'sw-cancel' || e.currentTarget.id == 'sw-done') {
				this.tapCancel(e);
			} else if (e.currentTarget.id == 'sw-frame') {
				this.scrollMove(e);
			}
		} else if (e.type == 'mouseup') {
			if (e.currentTarget.id == 'sw-cancel' || e.currentTarget.id == 'sw-done') {
				this.tapUp(e);
			} else if (e.currentTarget.id == 'sw-frame') {
				this.scrollEnd(e);
			}
		} else if (e.type == 'webkitTransitionEnd') {
			if (e.target.id == 'sw-wrapper') {
				this.destroy();
			} else {
				this.backWithinBoundaries(e);
			}
		} else if (e.type == 'orientationchange') {
			this.onOrientationChange(e);
		} else if (e.type == 'scroll') {
			this.onScroll(e);
		}
	},


	/**
	 *
	 * Global events
	 *
	 */

	onOrientationChange: function (e) {
		window.scrollTo(0, 0);
		this.swWrapper.style.top = window.innerHeight + window.pageYOffset + 'px';
		this.calculateSlotsWidth();
	},
	
	onScroll: function (e) {
		this.swWrapper.style.top = window.innerHeight + window.pageYOffset + 'px';
	},

	lockScreen: function (e) {
		e.preventDefault();
		e.stopPropagation();
	},


	/**
	 *
	 * Initialization
	 *
	 */

	reset: function () {
		this.slotEl = [];

		this.activeSlot = null;
		
		this.swWrapper = undefined;
		this.swSlotWrapper = undefined;
		this.swSlots = undefined;
		this.swFrame = undefined;
	},

	calculateSlotsWidth: function () {
		var div = this.swSlots.getElementsByTagName('div');
		for (var i = 0; i < div.length; i += 1) {
			this.slotEl[i].slotWidth = div[i].offsetWidth;
		}
	},

	create: function () {
		var i, l, out, ul, div;

		this.reset();	// Initialize object variables

		// Create the Spinning Wheel main wrapper
		div = document.createElement('div');
		div.id = 'sw-wrapper';
		div.style.top = window.innerHeight + window.pageYOffset + 'px';		// Place the SW down the actual viewing screen
		div.style.webkitTransitionProperty = '-webkit-transform';
		div.innerHTML = '<div id="sw-header"><div id="sw-cancel">Cancel</' + 
						'div><div id="sw-done">Done</' + 
						'div></' + 
						'div><div id="sw-slots-wrapper"><div id="sw-slots"></' 
						+ 'div></' + 'div><div id="sw-frame"></' + 'div>';
						
		document.body.appendChild(div);

		this.swWrapper = div;													// The SW wrapper
		this.swSlotWrapper = document.getElementById('sw-slots-wrapper');		// Slots visible area
		this.swSlots = document.getElementById('sw-slots');						// Pseudo table element (inner wrapper)
		this.swFrame = document.getElementById('sw-frame');						// The scrolling controller

		// Create HTML slot elements
		for (l = 0; l < this.slotData.length; l += 1) {
			// Create the slot
			ul = document.createElement('ul');
			out = '';
			for (i in this.slotData[l].values) {
				out += '<li>' + this.slotData[l].values[i] + '<' + '/li>';
			}
			ul.innerHTML = out;

			div = document.createElement('div');		// Create slot container
			div.className = this.slotData[l].style;		// Add styles to the container
			div.appendChild(ul);
	
			// Append the slot to the wrapper
			this.swSlots.appendChild(div);
			
			ul.slotPosition = l;			// Save the slot position inside the wrapper
			ul.slotYPosition = 0;
			ul.slotWidth = 0;
			ul.slotMaxScroll = this.swSlotWrapper.clientHeight - ul.clientHeight - 42;
			ul.style.webkitTransitionTimingFunction = 'cubic-bezier(0, 0, 0.2, 1)';		// Add default transition
			
			this.slotEl.push(ul);			// Save the slot for later use
			
			// Place the slot to its default position (if other than 0)
			if (this.slotData[l].defaultValue) {
				this.scrollToValue(l, this.slotData[l].defaultValue);	
			}
		}
		
		this.calculateSlotsWidth();
		
		// Global events
		document.addEventListener('mousedown', this, false);			// Prevent page scrolling
		document.addEventListener('mousemove', this, false);			// Prevent page scrolling
		window.addEventListener('orientationchange', this, true);		// Optimize SW on orientation change
		window.addEventListener('scroll', this, true);				// Reposition SW on page scroll

		// Cancel/Done buttons events
		document.getElementById('sw-cancel').addEventListener('mousedown', this, false);
		document.getElementById('sw-done').addEventListener('mousedown', this, false);

		// Add scrolling to the slots
		this.swFrame.addEventListener('mousedown', this, false);
	},

	open: function () {
		this.create();

		this.swWrapper.style.webkitTransitionTimingFunction = 'ease-out';
		this.swWrapper.style.webkitTransitionDuration = '400ms';
		this.swWrapper.style.webkitTransform = 'translate3d(0, -260px, 0)';
	},
	
	
	/**
	 *
	 * Unload
	 *
	 */

	destroy: function () {
		this.swWrapper.removeEventListener('webkitTransitionEnd', this, false);

		this.swFrame.removeEventListener('mousedown', this, false);

		document.getElementById('sw-cancel').removeEventListener('mousedown', this, false);
		document.getElementById('sw-done').removeEventListener('mousedown', this, false);

		document.removeEventListener('mousedown', this, false);
		document.removeEventListener('mousemove', this, false);
		window.removeEventListener('orientationchange', this, true);
		window.removeEventListener('scroll', this, true);
		
		this.slotData = [];
		this.cancelAction = function () {
			return false;
		};
		
		this.cancelDone = function () {
			return true;
		};
		
		this.reset();
		
		document.body.removeChild(document.getElementById('sw-wrapper'));
	},
	
	close: function () {
		this.swWrapper.style.webkitTransitionTimingFunction = 'ease-in';
		this.swWrapper.style.webkitTransitionDuration = '400ms';
		this.swWrapper.style.webkitTransform = 'translate3d(0, 0, 0)';
		
		this.swWrapper.addEventListener('webkitTransitionEnd', this, false);
	},


	/**
	 *
	 * Generic methods
	 *
	 */

	addSlot: function (values, style, defaultValue) {
		if (!style) {
			style = '';
		}
		
		style = style.split(' ');

		for (var i = 0; i < style.length; i += 1) {
			style[i] = 'sw-' + style[i];
		}
		
		style = style.join(' ');

		var obj = { 'values': values, 'style': style, 'defaultValue': defaultValue };
		this.slotData.push(obj);
	},

	getSelectedValues: function () {
		var index, count,
		    i, l,
			keys = [], values = [];

		for (i in this.slotEl) {
			// Remove any residual animation
			this.slotEl[i].removeEventListener('webkitTransitionEnd', this, false);
			this.slotEl[i].style.webkitTransitionDuration = '0';

			if (this.slotEl[i].slotYPosition > 0) {
				this.setPosition(i, 0);
			} else if (this.slotEl[i].slotYPosition < this.slotEl[i].slotMaxScroll) {
				this.setPosition(i, this.slotEl[i].slotMaxScroll);
			}

			index = -Math.round(this.slotEl[i].slotYPosition / this.cellHeight);

			count = 0;
			for (l in this.slotData[i].values) {
				if (count == index) {
					keys.push(l);
					values.push(this.slotData[i].values[l]);
					break;
				}
				
				count += 1;
			}
		}

		return { 'keys': keys, 'values': values };
	},


	/**
	 *
	 * Rolling slots
	 *
	 */

	setPosition: function (slot, pos) {
		this.slotEl[slot].slotYPosition = pos;
		this.slotEl[slot].style.webkitTransform = 'translate3d(0, ' + pos + 'px, 0)';
	},
	
	scrollStart: function (e) {
		// Find the clicked slot
		var xPos = e.clientX - this.swSlots.offsetLeft;	// Clicked position minus left offset (should be 11px)

		// Find tapped slot
		var slot = 0;
		for (var i = 0; i < this.slotEl.length; i += 1) {
			slot += this.slotEl[i].slotWidth;
			
			if (xPos < slot) {
				this.activeSlot = i;
				break;
			}
		}

		// If slot is readonly do nothing
		if (this.slotData[this.activeSlot].style.match('readonly')) {
			this.swFrame.removeEventListener('mousemove', this, false);
			this.swFrame.removeEventListener('mouseup', this, false);
			return false;
		}

		this.slotEl[this.activeSlot].removeEventListener('webkitTransitionEnd', this, false);	// Remove transition event (if any)
		this.slotEl[this.activeSlot].style.webkitTransitionDuration = '0';		// Remove any residual transition
		
		// Stop and hold slot position
		var theTransform = window.getComputedStyle(this.slotEl[this.activeSlot]).webkitTransform;
		theTransform = new WebKitCSSMatrix(theTransform).m42;
		if (theTransform != this.slotEl[this.activeSlot].slotYPosition) {
			this.setPosition(this.activeSlot, theTransform);
		}
		
		this.startY = e.clientY;
		this.scrollStartY = this.slotEl[this.activeSlot].slotYPosition;
		this.scrollStartTime = e.timeStamp;

		this.swFrame.addEventListener('mousemove', this, false);
		this.swFrame.addEventListener('mouseup', this, false);
		
		return true;
	},

	scrollMove: function (e) {
		var topDelta = e.clientY - this.startY;

		if (this.slotEl[this.activeSlot].slotYPosition > 0 || this.slotEl[this.activeSlot].slotYPosition < this.slotEl[this.activeSlot].slotMaxScroll) {
			topDelta /= 2;
		}
		
		this.setPosition(this.activeSlot, this.slotEl[this.activeSlot].slotYPosition + topDelta);
		this.startY = e.clientY;

		// Prevent slingshot effect
		if (e.timeStamp - this.scrollStartTime > 80) {
			this.scrollStartY = this.slotEl[this.activeSlot].slotYPosition;
			this.scrollStartTime = e.timeStamp;
		}
	},
	
	scrollEnd: function (e) {
		this.swFrame.removeEventListener('mousemove', this, false);
		this.swFrame.removeEventListener('mouseup', this, false);

		// If we are outside of the boundaries, let's go back to the sheepfold
		if (this.slotEl[this.activeSlot].slotYPosition > 0 || this.slotEl[this.activeSlot].slotYPosition < this.slotEl[this.activeSlot].slotMaxScroll) {
			this.scrollTo(this.activeSlot, this.slotEl[this.activeSlot].slotYPosition > 0 ? 0 : this.slotEl[this.activeSlot].slotMaxScroll);
			return false;
		}

		// Lame formula to calculate a fake deceleration
		var scrollDistance = this.slotEl[this.activeSlot].slotYPosition - this.scrollStartY;

		// The drag session was too short
		if (scrollDistance < this.cellHeight / 1.5 && scrollDistance > -this.cellHeight / 1.5) {
			if (this.slotEl[this.activeSlot].slotYPosition % this.cellHeight) {
				this.scrollTo(this.activeSlot, Math.round(this.slotEl[this.activeSlot].slotYPosition / this.cellHeight) * this.cellHeight, '100ms');
			}

			return false;
		}

		var scrollDuration = e.timeStamp - this.scrollStartTime;

		var newDuration = (2 * scrollDistance / scrollDuration) / this.friction;
		var newScrollDistance = (this.friction / 2) * (newDuration * newDuration);
		
		if (newDuration < 0) {
			newDuration = -newDuration;
			newScrollDistance = -newScrollDistance;
		}

		var newPosition = this.slotEl[this.activeSlot].slotYPosition + newScrollDistance;

		if (newPosition > 0) {
			// Prevent the slot to be dragged outside the visible area (top margin)
			newPosition /= 2;
			newDuration /= 3;

			if (newPosition > this.swSlotWrapper.clientHeight / 4) {
				newPosition = this.swSlotWrapper.clientHeight / 4;
			}
		} else if (newPosition < this.slotEl[this.activeSlot].slotMaxScroll) {
			// Prevent the slot to be dragged outside the visible area (bottom margin)
			newPosition = (newPosition - this.slotEl[this.activeSlot].slotMaxScroll) / 2 + this.slotEl[this.activeSlot].slotMaxScroll;
			newDuration /= 3;
			
			if (newPosition < this.slotEl[this.activeSlot].slotMaxScroll - this.swSlotWrapper.clientHeight / 4) {
				newPosition = this.slotEl[this.activeSlot].slotMaxScroll - this.swSlotWrapper.clientHeight / 4;
			}
		} else {
			newPosition = Math.round(newPosition / this.cellHeight) * this.cellHeight;
		}

		this.scrollTo(this.activeSlot, Math.round(newPosition), Math.round(newDuration) + 'ms');
 
		return true;
	},

	scrollTo: function (slotNum, dest, runtime) {
		this.slotEl[slotNum].style.webkitTransitionDuration = runtime ? runtime : '100ms';
		this.setPosition(slotNum, dest ? dest : 0);

		// If we are outside of the boundaries go back to the sheepfold
		if (this.slotEl[slotNum].slotYPosition > 0 || this.slotEl[slotNum].slotYPosition < this.slotEl[slotNum].slotMaxScroll) {
			this.slotEl[slotNum].addEventListener('webkitTransitionEnd', this, false);
		}
	},
	
	scrollToValue: function (slot, value) {
		var yPos, count, i;

		this.slotEl[slot].removeEventListener('webkitTransitionEnd', this, false);
		this.slotEl[slot].style.webkitTransitionDuration = '0';
		
		count = 0;
		for (i in this.slotData[slot].values) {
			if (i == value) {
				yPos = count * this.cellHeight;
				this.setPosition(slot, yPos);
				break;
			}
			
			count -= 1;
		}
	},
	
	backWithinBoundaries: function (e) {
		e.target.removeEventListener('webkitTransitionEnd', this, false);

		this.scrollTo(e.target.slotPosition, e.target.slotYPosition > 0 ? 0 : e.target.slotMaxScroll, '150ms');
		return false;
	},


	/**
	 *
	 * Buttons
	 *
	 */

	tapDown: function (e) {
		e.currentTarget.addEventListener('mousemove', this, false);
		e.currentTarget.addEventListener('mouseup', this, false);
		e.currentTarget.className = 'sw-pressed';
	},

	tapCancel: function (e) {
		e.currentTarget.removeEventListener('mousemove', this, false);
		e.currentTarget.removeEventListener('mouseup', this, false);
		e.currentTarget.className = '';
	},
	
	tapUp: function (e) {
		this.tapCancel(e);

		if (e.currentTarget.id == 'sw-cancel') {
			this.cancelAction();
		} else {
			this.doneAction();
		}
		
		this.close();
	},

	setCancelAction: function (action) {
		this.cancelAction = action;
	},

	setDoneAction: function (action) {
		this.doneAction = action;
	},
	
	cancelAction: function () {
		return false;
	},

	cancelDone: function () {
		return true;
	}
};