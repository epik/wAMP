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
		this.pluginObj.width = 1;
		this.pluginObj.height = 1;
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
			
			this.Log(strJSON);
			
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
	
	
	/*******************************
	 * Get the name of the currently playing son
	 *******************************/
	wAMP.prototype.getCurrentSongName = function()
	{
		return this.arrayPlayingArray[this.iSongIndex].name;
	}
	
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
		
		do 
		{
			if (this.iPlayMode == PLAY_MODE_RANDOM)
				iRet = Math.floor(Math.random()*this.arrayPlayingArray.length);
			else
				iRet = (iRet + 1) % this.arrayPlayingArray.length;
				
		} while (this.isPlayable(iRet) == false);
		
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
		
		$('wAMPPlugin').SetNext(this.arrayPlayingArray[this.getNextIndex()].path);
	 };
	 
	 /*******************************
	 * Tell the plugin to Play the next song
	 *******************************/
	 wAMP.prototype.OpenNextSong = function()
	 {
		this.setIndex(this.getNextIndex());
	 
		$('wAMPPlugin').Open(this.arrayPlayingArray[this.iSongIndex].path);
		
		$('wAMPPlugin').SetNext(this.arrayPlayingArray[this.getNextIndex()].path);
	};
	 
	 /*******************************
	 * Tell the plugin to Play the next song
	 *******************************/
	 wAMP.prototype.endCurSong = function()
	 {		
		this.setIndex(this.getNextIndex());
		
		$('wAMPPlugin').SetNext(this.arrayPlayingArray[this.getNextIndex()].path);
	};
	 
	 /*******************************
	 * Tell the plugin to play the previous song
	 *******************************/
	 wAMP.prototype.OpenPrevSong = function()
	 {
		this.setIndex(this.getPreviousIndex());
	 
		$('wAMPPlugin').Open(this.arrayPlayingArray[this.iSongIndex].path);
		
		$('wAMPPlugin').SetNext(this.arrayPlayingArray[this.getNextIndex()].path);
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
	 wAMP.prototype.Pause = function()
	 {
		$('wAMPPlugin').Pause();
	 };
	 
	 /*******************************
	 * Tell the plugin to play
	 *******************************/
	 wAMP.prototype.Play = function()
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
	 
	 /*******************************
	  * Get metadata
	  *******************************/
	 wAMP.prototype.getMetadata = function()
	 {
		var strJSON = $('wAMPPlugin').GetMetadata();
		
		if (!(strJSON))
			return this.objLastGoodMetadata;
		
		var objMetadata = JSON.parse(strJSON);
		if (objMetadata)
			this.objLastGoodMetadata = objMetadata;
		
		return objMetadata;
	 }
 }

