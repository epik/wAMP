/* FOR DEBUGGING PUT THE FOLLOWING INTO WINDOWS COMMAND PROMPT...
palm-log -d usb --system-log-level=info
palm-log -f -d usb com.epikmayo.audiophile
*/ 

var PAUSED_STATE = 0;
var PLAY_STATE = 1;

var globalobjwAMP;

var g_iPlayAll = 0;

var PlaysongAssistant = Class.create(
{

  	initialize: function(objwAMP) 
	{
		objwAMP.bHasStartedPlayer = true;
	
		this.objwAMP = objwAMP;
		globalobjwAMP = objwAMP;
		Mojo.Log.info("PLAYIT initialize myIndex: ");
		this.iEndTime = 0;
		this.bShuffleOn = false;
		this.bSoundVis = false;
		this.bVolSelectVis = false;
		this.iPausePlayState = PAUSED_STATE;
		this.iCheckingSongTrans = 0;
		this.strShortSongCheat = "";
		this.bHideVol = false;
	},

  	setup: function() 
	{	
		try
		{
			if(this.objwAMP.strPrevScene == "home2")
			{
				this.objwAMP.strPrevScene = "playsong";
			};

			// INITIALIZE ALL GLOBAL VARIABLES
			this.myIsPlaying = 0;
			
			// LISTEN TO ALL OF THE ELEMENTS ON THE SCREEN
			document.getElementById("btnprev").addEventListener('click', this.myPrevTrack.bind(this), false);
			document.getElementById("btnnext").addEventListener('click', this.myNextTrack.bind(this), false);
			document.getElementById("btnnoshuf").addEventListener('click', this.mySetShuffle.bind(this), false);
			document.getElementById("btnshuf").addEventListener('click', this.mySetShuffle.bind(this), false);
			document.getElementById("btnvol").addEventListener('click', this.mySetVolume.bind(this), false);
			document.getElementById("btnmute").addEventListener('click', this.mySetVolume.bind(this), false);
			document.getElementById("btnplay").addEventListener('click', this.myPlayPause.bind(this), false);
			document.getElementById("btnpause").addEventListener('click', this.myPlayPause.bind(this), false);
			document.getElementById("btndir").addEventListener('click', this.showDirectory.bind(this), false);
			document.getElementById("btnshowfilter").addEventListener('mousedown', this.showFilters.bind(this), false);
			document.getElementById("btnshowfilter").addEventListener('mousemove', this.showFilters.bind(this), false);
			
			this.controller.setupWidget(Mojo.Menu.appMenu, newsMenuAttr, newsMenuModel);
		
			this.Record = new RecordSpin();
			this.Record.init(60, 68, 200, 44, "addhere");
		
			this.objScrub = new PalmMyScruber();
			this.objwAMP.registerFunctions(this.setTitle.bind(this), 
											this.setArtistAndAlbum.bind(this));
			this.objScrub.init(20, 120, 20, 1.5, "addhere", this.objwAMP.seek.bind(this.objwAMP));
			this.objScrub.setEndTime(this.iEndTime);
			this.intervalStateCheck = setInterval(this.myTimer.bind(this),800);
			this.intervalSongPlayingCheck = setInterval(this.mySongCheck.bind(this),5000);
			this.SoundAdjust = new VertAdjust();
			this.SoundAdjust.init("addhere", this.myChangeVol.bind(this));
			
			this.objBassControl = new PalmKnobControl();
			this.objBassControl.init(0, 290, 160, "addhere", this.mySetBass, "Bass");
			
			this.objTrebControl = new PalmKnobControl();
			this.objTrebControl.init(161, 290, 160, "addhere", this.mySetTreble, "Treble");
		
		} catch (e) { 
			Mojo.Log.error("Error happened: %j", e); 
		};
  	},
	
	activate: function(event)
	{
		try
		{
			if ((this.objwAMP.iPlayVal != -1) && (g_iPlayAll != this.objwAMP.iPlayVal))
			{
				this.myOpenNew();
				
				if (this.objwAMP.iPlayVal == 1)
					g_iPlayAll = 1;
			}
			
		} catch (e) { 
			Mojo.Log.error("Error happened: %j", e); 
		};
	},
	
	getPicture: function(strAlbum)
	{

	},
	
	successFunc: function(data)
	{
		this.objwAMP.Log("Text:" + JSON.stringify(data.album.image[3]));
		this.objwAMP.Log("Text:" + JSON.stringify(data.album.image));
	
		for (i in data.album.image[3])
			this.objwAMP.Log("Sucess:" + i);
	},
			
	errorFunc: function(code, message)
	{
		this.objwAMP.Log("Error, didn't work: " + message);
	},
	
	setTitle: function(strTitle)
	{
		$('nameGoesHere').innerHTML = strTitle;
	},
	
	setArtistAndAlbum: function(strArtist, strAlbum)
	{
		$('artistGoesHere').innerHTML = strArtist;
		
		if (strAlbum)
		{
			this.objwAMP.Log("***********HERE***********");
			this.Record.addImage(strArtist, strAlbum);
		}
	},
	
	showFilters: function () 
	{
		try
		{			
			SpinningWheel.addSlot({"0.0": 'Gapless Transition', "-4.0": 'Crossfade' }, 'right');
			
			SpinningWheel.setCancelAction(this.cancel.bind(this));
			SpinningWheel.setDoneAction(this.done.bind(this));
			SpinningWheel.setScrollEndAction(this.done.bind(this));

			SpinningWheel.open();
			
			this.objBassControl.setVisible(true);

			this.objTrebControl.setVisible(true);

		} catch (e) { 
			Mojo.Log.error("Error happened: %j", e); 
		};
	},
	
	done: function() 
	{
		var results = SpinningWheel.getSelectedValues();
		this.objwAMP.setSongTransitionType(results.keys);
		this.objBassControl.setVisible(false);
		this.objTrebControl.setVisible(false);
	},

	cancel: function() 
	{
		this.objBassControl.setVisible(false);
		this.objTrebControl.setVisible(false);
	},
	
	cleanup: function(event)
	{
		try
		{
		
			clearInterval(this.intervalStateCheck);
		
			// UPON THIS SCENE DEACTIVATING
			if (this.objTrebControl)
			{
				this.objTrebControl.uninit();
				this.objTrebControl = null;
				this.objBassControl.uninit();
				this.objBassControl = null;
			}
			this.objScrub.uninit();
			this.objScrub = null;
			
			SpinningWheel = null;
			
			document.getElementById("btnprev").removeEventListener('click', this.myPrevTrack, false);
			document.getElementById("btnnext").removeEventListener('click', this.myNextTrack, false);
			document.getElementById("btnnoshuf").removeEventListener('click', this.mySetShuffle, false);
			document.getElementById("btnshuf").removeEventListener('click', this.mySetShuffle, false);
			document.getElementById("btnvol").removeEventListener('click', this.mySetVolume, false);
			document.getElementById("btnmute").removeEventListener('click', this.mySetVolume, false);
			document.getElementById("btnplay").removeEventListener('click', this.myPlayPause, false);
			document.getElementById("btnpause").removeEventListener('click', this.myPlayPause, false);
			document.getElementById("btndir").removeEventListener('click', this.showDirectory, false);
			document.getElementById("btnshowfilter").removeEventListener('mousedown', this.showFilters, false);
			document.getElementById("btnshowfilter").removeEventListener('mousemove', this.showFilters, false);

		} catch (e) { 
			Mojo.Log.error("Error happened: %j", e); 
		};
	},
	
	myPlayPause: function(event)
	{
		if (this.iPausePlayState == PAUSED_STATE)
		{
			this.iPausePlayState = PLAY_STATE
			this.objwAMP.play();
			this.Record.spin();
			document.getElementById("btnpause").style.visibility = "visible";
			document.getElementById("btnplay").style.visibility = "hidden";
		}
		else
		{
			this.iPausePlayState = PAUSED_STATE
			this.objwAMP.pause();
			this.Record.stop();
			document.getElementById("btnplay").style.visibility = "visible";
			document.getElementById("btnpause").style.visibility = "hidden";
		}	
	
	},
	
	myOpenNew: function()
	{
		try
		{   		
			this.objwAMP.OpenCurrentSong();
			if (this.iPausePlayState == PAUSED_STATE)
				this.myPlayPause();
		}
		catch(e)
		{
			Mojo.Controller.errorDialog(e);
		}
	    //this.myLoadNext();
	},
	
	myNextTrack: function(event)
	{	
		// CALLED BY THE USER CLICKING THE NEXT TRACK BUTTON
		this.objwAMP.Log("Next");
		
		this.objwAMP.OpenNextSong();
	},
	
	mySetShuffle: function(event)
	{
		if (this.bShuffleOn)
		{
			this.bShuffleOn = false;
			this.objwAMP.setRandomPlay(false);
			this.objwAMP.setNextSong();
			document.getElementById("btnnoshuf").style.visibility = "visible";
			document.getElementById("btnshuf").style.visibility = "hidden";
		}
		else
		{
			this.bShuffleOn = true;
			this.objwAMP.setRandomPlay(true);
			this.objwAMP.setNextSong();
			document.getElementById("btnshuf").style.visibility = "visible";
			document.getElementById("btnnoshuf").style.visibility = "hidden";
		}	
		
	},
	
	myPrevTrack: function(event)
	{
		// CALLED BY THE USER CLICKING THE Prev TRACK BUTTON
		this.objwAMP.Log("Prev");
		
		this.objwAMP.OpenPrevSong();
	},

	myGetMetadata: function()
	{	

	},
	

	myTimer: function()
	{
		var GetMin;
	
		try {
		
			this.PluginState = this.objwAMP.getState();
	
			this.objwAMP.Log("End Val is: " + this.PluginState["EndAmt"]);
	
			this.objScrub.setEndTime(this.PluginState["EndAmt"]);
	
			this.objScrub.setCurTime(this.PluginState["CurPos"]);

		} catch (e) { Mojo.Log.error("Error happened: %j", e); }
		
	},
	
	mySongCheck: function()
	{
	
		try {
		
			this.SecondPluginState = this.objwAMP.getState();
	
			if (this.SecondPluginState["NextSongState"] == 108)
			{
				Mojo.Log.info("Function about to call advanceIndex");
		
				Mojo.Log.info("mySong Function after advanceIndex");
		
				this.objwAMP.setNextSong();
				
				this.objwAMP.advanceIndex();
				
				Mojo.Log.info("mySong Function after setNext");
			}
	
		} catch (e) { Mojo.Log.error("Error happened in mySongCheck()" + e); }	
		
	},
	
	mySetSpeed: function(event)
	{	

		this.objwAMP.setSpeed(event);
	},

	mySetVolume: function(event)
	{	
		if (this.bSoundVis)
		{
			this.SoundAdjust.cleanUp();
			document.getElementById("btnmute").setAttribute("style","border:3px solid #000;");
			document.getElementById("btnvol").setAttribute("style","border:3px solid #000;");
			if (this.bHideVol)
				document.getElementById("btnvol").style.visibility = "hidden";
		}
		else
		{
			document.getElementById("btnmute").setAttribute("style","border:3px solid #FFF;");
			document.getElementById("btnvol").setAttribute("style","border:3px solid #FFF;");
			if (this.bHideVol)
				document.getElementById("btnvol").style.visibility = "hidden";
		}
			
		this.bSoundVis = !(this.bSoundVis);
		this.SoundAdjust.setVisibility(this.bSoundVis);
	},
		
		
	myChangeVol: function(fVal)
	{
		if (fVal < .05)
		{
			document.getElementById("btnvol").style.visibility = "hidden";
			this.bHideVol = true;
		}
		else
		{
			document.getElementById("btnvol").style.visibility = "visible";
			this.bHideVol = false;
		}
	
		var myvalue = (fVal * 3);
		myvalue = myvalue.toString();
		this.objwAMP.setVol(myvalue);
	},

	mySetTreble: function(event)
	{	
		var myvalue = (event * 3);
		myvalue = myvalue.toString();
		globalobjwAMP.setTreble(myvalue);
	},

	mySetBass: function(event)
	{	
		var myvalue = (event * 3);
		myvalue = myvalue.toString();
		globalobjwAMP.setBass(myvalue);
	},

	handleCommand: function(event)
	{
		// IF THE USER PERFORMED A BACK SWIPE GESTURE,
        if (event.type == Mojo.Event.back) 
		{
			event.preventDefault();
			this.showDirectory();
        }
	},

	showDirectory: function()
	{
		// Go back to the index screen
		this.objwAMP.myPrevious = "playit";
		Mojo.Controller.stageController.pushScene("indexview",this.objwAMP);
	},
	
	cleanup: function(event)
	{

	},

});

		 
function PalmMyScruber()
{

	this.controller = null;

	// Create a name for the div.  To make it transparent
	//	to the user in case we want to create multiples,
	//	we add a random number to the div so we don't
	//	have two with the same name.
	this.strDivWrapperID = "divScrubControl" + Number(Math.floor(Math.random() * 1000)).toString();
	this.strDivBlckScrub = "divBlckScrub" + Number(Math.floor(Math.random() * 1000)).toString();
	this.strDivWhteScrub = "divBlckScrub" + Number(Math.floor(Math.random() * 1000)).toString();
	this.strEndTime = "0:00";
	this.strCurTime = "0:00";
	
	this.iWaitForUpdate = -1;
	
	this.iEndTime = 0;
	this.iCurTime = 0;
	this.fEndConvertToSec = 0;
	this.fEndConvertToDist = 0;	
	this.iSliderLimit = 0;
	this.iRightScale = 0;
	this.iLeftScale = 0;
	this.iRightLimit = 0;
	
	this.funcCallback = null;
	this.strDivParent = null;
	this.strStyleString = null;
	
	
	this.handleEvent = function (e) 
	{ 
		if (e.type == 'mousedown') 
		{
			this.pickStart(e);
		} 
		else if (e.type == 'mousemove') 
		{
			this.pickMove(e);
		} 
		else if (e.type == 'mouseup')
		{
			this.pickStop(e);
		}
		
	};

	this.setEndTime = function(iEndTimeInSec)
	{
		try
		{
			if (isNaN(iEndTimeInSec))
				iEndTimeInSec = 0;
		
			this.iEndTime = iEndTimeInSec;
			// create a factor to convert scrubber loc to secs
			this.fEndConvertToSec = iEndTimeInSec * this.iRightScale;
			// create a factor to convert secs to scrubber loc
			if (iEndTimeInSec)
				this.fEndConvertToDist = this.iRightLimit / iEndTimeInSec;
			else
				this.fEndConvertToDist = 0;
				
			this.strEndTime = this.convertNumSecToString(iEndTimeInSec);
			this.draw(0);
		}
		catch(e)
		{
			Mojo.Controller.errorDialog(e);
		}
	};
	
	this.setCurTime = function(iCurTimeInSec)
	{
		if (this.iWaitForUpdate == -2)
		{
			this.iCurTime = iCurTimeInSec;
			this.strCurTime = this.convertNumSecToString(iCurTimeInSec);
		}
		else if (this.iWaitForUpdate != -1)
		{
			var iCheck = Math.abs(this.iWaitForUpdate - iCurTimeInSec);
			if (iCheck <= 5)
			{
				this.iCurTime = iCurTimeInSec;
				this.strCurTime = this.convertNumSecToString(iCurTimeInSec);
				this.draw(iCurTimeInSec * this.fEndConvertToDist);
				document.getElementById(this.strDivParent).removeChild(
												document.getElementById("divNewPop"));
				this.iWaitForUpdate = -1;
			}
			else
			{
				return;
			}
		}
		else
		{
			this.iCurTime = iCurTimeInSec;
			this.strCurTime = this.convertNumSecToString(iCurTimeInSec);
			this.draw(iCurTimeInSec * this.fEndConvertToDist);
		}
	};
	
	this.draw = function(iTime)
	{
		try
		{
	
			var strFullTime = this.strCurTime + "|" + this.strEndTime;
			
			$(this.strDivBlckScrub).setAttribute("style", 
						"clip: rect(0px " + Number(iTime + this.iLeftScale).toString() + "px 480px 0px)");
								
			document.getElementById(this.strDivBlckScrub).innerHTML = strFullTime;
			document.getElementById(this.strDivWhteScrub).innerHTML = strFullTime;
		
		} catch (e) { Mojo.Log.info("Error around line 529: " + e); }
	};
	
	this.init = function (iLeftCoord, iBottomCoord, iRightCoord, fEMHeight, strDivParent, funcCallBack) 
	{
		try
		{	
			this.strStyleString = "bottom:" + Number(iBottomCoord).toString() + "px; left:" +
								Number(iLeftCoord).toString() + "px; right:" +
								Number(iRightCoord).toString() + "px; height:" +
								Number(fEMHeight).toString() + "em;";
		
			this.funcCallBack = funcCallBack;
		
			// Kludge bececause of how stupid mojo is with points
			this.iLeftScale = iLeftCoord + 5;
			
			// this is the inverse of the scrubber width.  It uses a kludge factor because of issues
			//	I had with mojo locations.  Having it here saves divides later
			this.iRightScale = 1/((document.body.clientWidth*.90) - (iRightCoord + iLeftCoord));
			
			// this is the width of the scrubber.  It uses a kludge factor because of issues
			//	I had with mojo locations.
			this.iRightLimit = .95 * ((document.body.clientWidth*.90) - (iRightCoord + iLeftCoord))
		
			this.iSliderLimit = ((document.body.clientWidth*.90) - (iRightCoord + iLeftCoord));
		
			this.strDivParent = strDivParent;
			var divParent = document.getElementById(strDivParent);
			
			var divWrapper = document.createElement("div");
			divWrapper.className = "scrubwrap";
			divWrapper.setAttribute("style",this.strStyleString);
			divWrapper.id = this.strDivWrapperID;
			
			this.strStyleString = "bottom:" + Number(iBottomCoord).toString() + "px; left:" +
								Number(iLeftCoord+5).toString() + "px; right:" +
								Number(iRightCoord+5).toString() + "px; height:" +
								Number(fEMHeight).toString() + "em;";

			var divDisplay = document.createElement("div");
			divDisplay.className = "scruber";
			divDisplay.id = this.strDivWhteScrub;
			divDisplay.setAttribute("style",this.strStyleString);
			divWrapper.appendChild(divDisplay); 
			
			
			divDisplay = document.createElement("div");
			divDisplay.className = "scruberop";
			divDisplay.setAttribute("style",this.strStyleString + " clip:rect(0px 0px 480px 0px);");
			divDisplay.id = this.strDivBlckScrub;
			divWrapper.appendChild(divDisplay); 
			
			divWrapper.addEventListener('mousedown', this, false);
			divParent.appendChild(divWrapper);
			
			this.draw(0);
		}
		catch(e)
		{
			Mojo.Controller.errorDialog(e);
		}
	};
	
	this.uninit = function()
	{
		var divWrapper = document.getElementById(this.strDivWrapperID);
		divWrapper.removeEventListener('mousedown', this, false);
		
		var divParent = document.getElementById(this.strDivParent);
		divParent.removeChild(divWrapper);
		
		this.strDivWrapperID = null;
		this.strDivBlckScrub = null;
		this.strDivWhteScrub = null;
		this.strEndTime = null;
		this.strCurTime = null;
		this.funcCallback = null;
		this.strDivParent = null;
		this.strStyleString = null;
	};
	
	this.pickStart = function(e) 
	{
		this.iWaitForUpdate = -2;
	
		var divNewPop = document.createElement("div");
		divNewPop.id = "divNewPop";
		divNewPop.className = "scrubpopup";
		document.getElementById(this.strDivParent).appendChild(divNewPop);
	
	
		var iDivTouchPoint = e.pageX - this.iLeftScale;

		// Kludge bececause of how stupid mojo is with points
		if (iDivTouchPoint < 0)
			iDivTouchPoint = 0;
		else if (iDivTouchPoint > this.iRightLimit)
			iDivTouchPoint = this.iRightLimit;

		this.iCurSelectedTime = iDivTouchPoint * this.fEndConvertToSec;
		
		this.draw(iDivTouchPoint);
		
		divNewPop.innerHTML = this.convertNumSecToString(this.iCurSelectedTime);
			
		var divWrapper = document.getElementById(this.strDivWrapperID);
		
		document.getElementById(this.strDivBlckScrub).style.clip = 
							"rect(0px " + Number(iDivTouchPoint + this.iLeftScale).toString() + "px 480px 0px)";
		
		divWrapper.addEventListener('mousemove', this, false);
		divWrapper.addEventListener('mouseup', this, false);
		
	};

	this.pickMove = function(e) 
	{	
		var iDivTouchPoint = e.pageX - this.iLeftScale;
	
		// Kludge bececause of how stupid mojo is with points
		if (iDivTouchPoint < 0)
			iDivTouchPoint = 0;
		else if (iDivTouchPoint > this.iRightLimit)
			iDivTouchPoint = this.iRightLimit;
		
		
		this.iCurSelectedTime = iDivTouchPoint * this.fEndConvertToSec;
		
		this.draw(iDivTouchPoint);
		
		document.getElementById("divNewPop").innerHTML = this.convertNumSecToString(this.iCurSelectedTime);
		
		var divWrapper = document.getElementById(this.strDivWrapperID);
		
		document.getElementById(this.strDivBlckScrub).style.clip = 
							"rect(0px " + Number(iDivTouchPoint + this.iLeftScale).toString() + "px 480px 0px)";
		
	};
	
	this.pickStop = function(e) 
	{
	
		var iDivTouchPoint = e.pageX - this.iLeftScale;
	
		// Kludge bececause of how stupid mojo is with points
		if (iDivTouchPoint < 0)
			iDivTouchPoint = 0;
		else if (iDivTouchPoint > this.iRightLimit)
			iDivTouchPoint = this.iRightLimit;
		
		this.draw(iDivTouchPoint);
		
		this.iCurSelectedTime = iDivTouchPoint * this.fEndConvertToSec;
			
		document.getElementById("divNewPop").innerHTML = "Wait...";
			
		var divWrapper = document.getElementById(this.strDivWrapperID);
		divWrapper.removeEventListener('mousemove', this, false);
		divWrapper.removeEventListener('mouseup', this, false);
		
		this.iWaitForUpdate = this.iCurSelectedTime;
		
		this.funcCallBack(Math.floor(this.iEndTime * iDivTouchPoint * this.iRightScale));
	};

	
	this.convertNumSecToString = function(iNumSec)
	{
		var ProgressString;
	
		iNumSec = Math.floor(iNumSec)
	
		if (iNumSec <= 0)
		{
			ProgressString = "0:00";
		}
		else if (iNumSec < 10)
		{
			ProgressString = "0:0"+Number(iNumSec).toString();
		}
		else if (iNumSec < 60)
		{
			ProgressString = "0:"+Number(iNumSec).toString();
		}
		else
		{
			// first get the minutes part of the number without division
			GetMin = iNumSec * .01667;
			ProgressString = Number(Math.floor(GetMin)).toString();
			
			// Now subtract out the number of minute to get seconds
			GetMin = Math.floor(GetMin) * 60;
			GetMin = iNumSec - GetMin;
			
			// now finish the string
			if (GetMin == 60)
			{
				ProgressString = ProgressString + ":00";
			}
			else if (GetMin < 10)
			{
				ProgressString = ProgressString + ':0' + Number(GetMin).toString();
			}
			else
			{
				ProgressString = ProgressString + ':' + Number(GetMin).toString();
			}
		}
		
		return ProgressString;
	};
	
};
		 
var INV_PI = 1/3.14159265;

function PalmKnobControl()
{
	this.controller = null;
	this.angle = 0;
	this.startAngle = 0;
	this.slices = Math.PI/6;	// 12 slices

	this.iLocked = 0;
	
	this.funcCallback = null;
	this.originX = 0;
	this.originY = 0;
	this.strDivParent = null;
	this.strStyleString = null;
	
	// Create a name for the div.  To make it transparent
	//	to the user in case we want to create multiples,
	//	we add a random number to the div so we don't
	//	have two with the same name.
	this.strDivWrapperID = "divSpinControl" + Number(Math.floor(Math.random() * 10000)).toString();
	this.strImgBackIDW = "imgBackW" + Number(Math.floor(Math.random() * 10000)).toString();
	this.strImgBackIDB = "imgBackB" + Number(Math.floor(Math.random() * 10000)).toString();
	this.strImgFrontID = "imgFront" + Number(Math.floor(Math.random() * 10000)).toString();
	this.strImgFrontIDWF = "imgFrontWF" + Number(Math.floor(Math.random() * 10000)).toString();

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

	this.setVisible = function(bVisible)
	{
		var divWrapper = document.getElementById(this.strDivWrapperID);
		
		divWrapper.style.visibility = ((bVisible)?"visibl":"hidden");
	
	};
	
	this.init = function(iLeftCoord, iTopCoord, iSize, strDivParent, funcCallBack, strLabelText) 
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
		
		var divLabel = document.createElement("div");
		divLabel.className = "rotateablelbl";
		divLabel.innerHTML = strLabelText;
		divWrapper.appendChild(divLabel); 
		
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
		
		
		divDisplay = document.createElement("div");
		divDisplay.className = "rotateablefront";
		divDisplay.setAttribute("style",this.strStyleString + " -webkit-transform:rotate(-45deg)");
		divDisplay.id = this.strImgFrontIDWF;
		imgDisplay = document.createElement("img");
		imgDisplay.setAttribute("src", "res/knob/frontwf.png");
		imgDisplay.className = "rotateablefront";
		imgDisplay.id = this.strImgFrontID;
		imgDisplay.setAttribute("height",Number(iSize).toString() + "px");
		imgDisplay.setAttribute("width",Number(iSize).toString() + "px");
		divDisplay.appendChild(imgDisplay);
		divWrapper.appendChild(divDisplay); 
		
		// Draw the background circles
		
		
		this.strStyleStringB = "top:" + Number(iSize/4).toString() + "px; left:" +
							Number(iSize/2).toString() + "px; " +
							"height:" +
							Number(iSize/2).toString() + "px; width:" +
							Number(iSize/4).toString() + "px; -webkit-border-bottom-right-radius: " +
							Number(iSize/4).toString() + "px; -webkit-border-top-right-radius: " + 
							Number(iSize/4).toString() + "px; -webkit-transform-origin: 0px " + 
							Number(iSize/4).toString() + "px; "
		
		this.strStyleStringW = "top:" + Number(iSize/4).toString() + "px; left:" +
							Number(iSize/4).toString() + "px; " +
							"height:" +
							Number(iSize/2).toString() + "px; width:" +
							Number(iSize/4).toString() + "px; -webkit-border-bottom-left-radius: " +
							Number(iSize/4).toString() + "px; -webkit-border-top-left-radius: " + 
							Number(iSize/4).toString() + "px; -webkit-transform-origin: " +
							Number(iSize/4).toString() + "px " + Number(iSize/4).toString() + "px; "
							
		var divDisplay = document.createElement("div");
		divDisplay.className = "rotateablebackcircb";
		divDisplay.id = this.strImgBackIDB;
		divDisplay.setAttribute("style",this.strStyleStringB);
		divWrapper.appendChild(divDisplay);

		divDisplay = document.createElement("div");
		divDisplay.className = "rotateablebackcircbackb";
		divDisplay.setAttribute("style",this.strStyleStringB);
		divWrapper.appendChild(divDisplay); 
						
		divDisplay = document.createElement("div");
		divDisplay.className = "rotateablebackcircw";
		divDisplay.setAttribute("style",this.strStyleStringW);
		divDisplay.id = this.strImgBackIDW;
		divWrapper.appendChild(divDisplay); 

		divDisplay = document.createElement("div");
		divDisplay.setAttribute("style",this.strStyleStringW);
		divDisplay.className = "rotateablebackcircbackw";
		divWrapper.appendChild(divDisplay); 
		
		divWrapper.addEventListener('mousedown', this, false);
		
		divWrapper.style.visibility = "hidden";
		
		divParent.appendChild(divWrapper);
	};
	
	this.uninit = function()
	{
		var divWrapper = document.getElementById(this.strDivWrapperID);
		divWrapper.removeEventListener('mousedown', this, false);
		
		var divParent = document.getElementById(this.strDivParent);
		divParent.removeChild(divWrapper);
		
		this.strDivWrapperID = null;
		this.strDivBlckScrub = null;
		this.strDivWhteScrub = null;
		this.strEndTime = null;
		this.strCurTime = null;
		this.iWaitForUpdate = 0;
		this.iEndTime = 0;
		this.iCurTime = 0;
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
		var divFrontWF = document.getElementById(this.strImgFrontIDWF);

		divFront.setAttribute("style", this.strStyleString + 
					"-webkit-transform:rotate(" + 
					Number(fDeg).toString() + "deg);");
					
		divFrontWF.setAttribute("style", this.strStyleString + 
					"-webkit-transform:rotate(" + 
					Number(fDeg-45).toString() + "deg);");
		
		var divBackactive;
		var divBack;

		var strStyleStringActive;
		var strStyleStringInactive;
		
		if ((fDeg > 224) && (fDeg <= 360))
		{
			divBackactive = document.getElementById(this.strImgBackIDB);
			strStyleStringActive = this.strStyleStringB;
			divBack = document.getElementById(this.strImgBackIDW);
			strStyleStringInactive = this.strStyleStringW;
		}
		else if ((fDeg >= 0) && (fDeg < 136))
		{
			divBackactive = document.getElementById(this.strImgBackIDW);
			strStyleStringActive = this.strStyleStringW;
			divBack = document.getElementById(this.strImgBackIDB);
			strStyleStringInactive = this.strStyleStringB;
		}

		divBackactive.setAttribute("style",  strStyleStringActive + "-webkit-transform:rotate(" + 
					Number(fDeg).toString() + "deg);");
					
		divBack.setAttribute("style", strStyleStringInactive + "z-index: 26");
	
	}
	
	this.convertAndReturn = function()
	{
		var fRetVal;
		
		if (this.angle < 224)
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
 * Original license below (this code is licensed at per the rest of the code
 *	which is allowed under the MIT license so long as the below is present)
 * ------------------------ 
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
	slotData: new Array(),
	bRunOnce: 1,

	/**
	 *
	 * Event handler
	 *
	 */

	handleEvent: function (e) 
	{
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
		} 
		else if ((e.type == 'mouseup') || (e.type == 'mouseout'))
		{
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

	onOrientationChange: function (e) 
	{
		window.scrollTo(0, 0);
		this.swWrapper.style.top = window.innerHeight + window.pageYOffset + 'px';
		this.calculateSlotsWidth();
	},
	
	onScroll: function (e) 
	{
		this.swWrapper.style.top = window.innerHeight + window.pageYOffset + 'px';
	},

	lockScreen: function (e) 
	{
		e.preventDefault();
		e.stopPropagation();
	},


	/**
	 *
	 * Initialization
	 *
	 */

	reset: function () 
	{
		this.slotEl = [];

		this.activeSlot = null;
		
		this.swWrapper = undefined;
		this.swSlotWrapper = undefined;
		this.swSlots = undefined;
		this.swFrame = undefined;
	},

	calculateSlotsWidth: function () 
	{
		var div = this.swSlots.getElementsByTagName('div');
		for (var i = 0; i < div.length; i += 1) {
			this.slotEl[i].slotWidth = div[i].offsetWidth;
		}
	},

	create: function () 
	{
		var i, l, out, ul, div;

		this.bRunOnce = 0;
		
		this.reset();	// Initialize object variables

		// Create the Spinning Wheel main wrapper
		div = document.createElement('div');
		div.id = 'sw-wrapper';
		div.style.top = window.innerHeight + window.pageYOffset + 'px';		// Place the SW down the actual viewing screen
		div.style.webkitTransitionProperty = '-webkit-transform';
		div.innerHTML = '<div id="sw-header"><div id="sw-cancel">Cancel</' + 
						'div><div id="sw-done">Apply</' + 
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
			ul.slotMaxScroll = this.swSlotWrapper.clientHeight - ul.clientHeight;
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

	open: function () 
	{
		if (this.bRunOnce)
			this.create();

		this.swWrapper.style.webkitTransitionTimingFunction = 'ease-out';
		this.swWrapper.style.webkitTransitionDuration = '400ms';
		this.swWrapper.style.webkitTransform = 'translate3d(0, -300px, 0)';
	},
	
	
	/**
	 *
	 * Unload
	 *
	 */

	unload: function () 
	{
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
	
	close: function () 
	{
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

	addSlot: function (values, style, defaultValue) 
	{
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

	getSelectedValues: function () 
	{
		var index, count,
		    i, l,
			keys = [], values = [];

		for (i in this.slotEl) {
			// Remove any residual animation
			//this.slotEl[i].removeEventListener('webkitTransitionEnd', this, false);
			//this.slotEl[i].style.webkitTransitionDuration = '0';

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

	setPosition: function (slot, pos) 
	{
		this.slotEl[slot].slotYPosition = pos;
		this.slotEl[slot].style.webkitTransform = 'translate3d(0, ' + pos + 'px, 0)';
	},
	
	scrollStart: function (e) 
	{
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
		this.swFrame.addEventListener('mouseout', this, false);
		
		return true;
	},

	scrollMove: function (e) 
	{
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
	
	scrollEnd: function (e) 
	{
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

	scrollTo: function (slotNum, dest, runtime) 
	{
		this.slotEl[slotNum].style.webkitTransitionDuration = runtime ? runtime : '100ms';
		this.setPosition(slotNum, dest ? dest : 0);

		// If we are outside of the boundaries go back to the sheepfold
		if (this.slotEl[slotNum].slotYPosition > 0 || this.slotEl[slotNum].slotYPosition < this.slotEl[slotNum].slotMaxScroll) {
			this.slotEl[slotNum].addEventListener('webkitTransitionEnd', this, false);
		}
		
		//this.scrollEndAction();
	},
	
	scrollToValue: function (slot, value) 
	{
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
	
	backWithinBoundaries: function (e) 
	{
		e.target.removeEventListener('webkitTransitionEnd', this, false);

		this.scrollTo(e.target.slotPosition, e.target.slotYPosition > 0 ? 0 : e.target.slotMaxScroll, '150ms');
		return false;
	},


	/**
	 *
	 * Buttons
	 *
	 */

	tapDown: function (e) 
	{
		e.currentTarget.addEventListener('mousemove', this, false);
		e.currentTarget.addEventListener('mouseup', this, false);
		e.currentTarget.className = 'sw-pressed';
	},

	tapCancel: function (e) 
	{
		e.currentTarget.removeEventListener('mousemove', this, false);
		e.currentTarget.removeEventListener('mouseup', this, false);
		e.currentTarget.className = '';
	},
	
	tapUp: function (e) 
	{
		this.tapCancel(e);

		if (e.currentTarget.id == 'sw-cancel') {
			this.cancelAction();
		} else {
			this.doneAction();
		}
		
		this.close();
	},

	setCancelAction: function (action) 
	{
		this.cancelAction = action;
	},

	setDoneAction: function (action) 
	{
		this.doneAction = action;
	},
	
	setScrollEndAction: function (action)
	{
		this.scrollEndAction = action;
	},
	
	cancelAction: function () 
	{
		return false;
	},

	cancelDone: function () 
	{
		return true;
	}
};

function VertAdjust()
{
	this.controller = null;
	
	// Create a name for the div.  To make it transparent
	//	to the user in case we want to create multiples,
	//	we add a random number to the div so we don't
	//	have two with the same name.
	this.strDivWrapperID = "divVolControl" + Number(Math.floor(Math.random() * 10000)).toString();
	this.strDivKnob = "divVolKnob" + Number(Math.floor(Math.random() * 10000)).toString();

	this.funcCallback = null;
	this.strDivParent = null;
	this.strStyleString = null;
	
	// we need this in case the DOM loses focus without throwing a mouseup event
	this.bDirty = false;
	
	this.handleEvent = function (e) 
	{ 
		if (e.type == 'mousedown') 
		{
			this.volSelStart(e);
		} 
		else if (e.type == 'mousemove') 
		{
			this.volSelMove(e);
		} 
		else if (e.type == 'mouseup')
		{
			this.volSelStop(e);
		}
		
	};

	
	this.draw = function(iYCoordFromTop)
	{
		var iCalcTop = document.getElementById(this.strDivWrapperID).offsetTop;
				
		iCalcTop = iYCoordFromTop - iCalcTop;
		iCalcTop = 250 - iCalcTop - 5;
	
		if (iCalcTop > 227)
			iCalcTop = 227;
		else if (iCalcTop < 0)
			iCalcTop = 0;
	
		document.getElementById(this.strDivKnob).setAttribute("style", "bottom:" +
														Number(iCalcTop+105).toString() +
														"px;");
							
	};
	
	this.init = function (strDivParent, funcCallBack) 
	{
		try
		{	

			this.funcCallBack = funcCallBack;
		
			this.strDivParent = strDivParent;
			var divParent = document.getElementById(strDivParent);
			
			var divWrapper = document.createElement("div");
			divWrapper.className = "vertselectboxwrapper";
			divWrapper.setAttribute("style",this.strStyleString);
			divWrapper.id = this.strDivWrapperID;

			
			var divBack = document.createElement("div");
			divBack.className = "vertselectbox";
			divWrapper.appendChild(divBack); 
			
			this.strStyleString = "bottom:0px";
			var divDisplay = document.createElement("div");
			divDisplay.className = "vertselectknob";
			divDisplay.id = this.strDivKnob;
			divWrapper.appendChild(divDisplay); 
			
			divWrapper.addEventListener('mousedown', this, false);
			divParent.appendChild(divWrapper);
			
			this.draw(document.getElementById(this.strDivWrapperID).offsetTop + 125);
		}
		catch(e)
		{
			Mojo.Controller.errorDialog(e);
		}
	};
	
	this.uninit = function()
	{
		var divKnob = document.getElementById(this.strDivWrapperID);
		divKnob.removeEventListener('mousedown', this, false);
		
		this.strDivWrapperID = null;
		this.strDivKnob = null;
		this.funcCallback = null;
		this.strDivParent = null;
		this.strStyleString = null;
	};
	
	this.setVisibility = function(bVisSet)
	{
		document.getElementById(this.strDivWrapperID).style.visibility = 
												((bVisSet)?"visible":"hidden");
	}
	
	this.volSelStart = function(e)
	{
	
		this.bDirty = true;
	
		var divWrapper = document.getElementById(this.strDivWrapperID);
	
		var divKnob = document.getElementById(this.strDivKnob);
	
		divWrapper.addEventListener('mousemove', this, false);
		divWrapper.addEventListener('mouseup', this, false);
	
		this.draw(e.pageY);
	};
	
	// This is to avoid repeated divisions
	this.fScale250 = 1/250;
	
	this.volSelMove = function(e)
	{
		this.draw(e.pageY);
		
		var iCalcTop = document.getElementById(this.strDivWrapperID).offsetTop;
		iCalcTop = e.pageY - iCalcTop;
		iCalcTop = 250 - iCalcTop;
	
		if (iCalcTop > 227)
			iCalcTop = 227;
		else if (iCalcTop < 0)
			iCalcTop = 0;
		
		this.funcCallBack(iCalcTop * this.fScale250);
	};
	
	this.cleanUp = function()
	{
		if (this.bDirty)
		{
			var divWrapper = document.getElementById(this.strDivWrapperID);
		
			this.bDirty = false;
		
			divWrapper.removeEventListener('mousemove', this, false);
			divWrapper.removeEventListener('mouseup', this, false);
		}
	};
	
	this.volSelStop = function(e)
	{
		var divWrapper = document.getElementById(this.strDivWrapperID);
	
		this.bDirty = false;
	
		divWrapper.removeEventListener('mousemove', this, false);
		divWrapper.removeEventListener('mouseup', this, false);
		
		var iCalcTop = document.getElementById(this.strDivWrapperID).offsetTop;
		iCalcTop = e.pageY - iCalcTop;
		iCalcTop = 250 - iCalcTop;
	
		if (iCalcTop > 227)
			iCalcTop = 227;
		else if (iCalcTop < 0)
			iCalcTop = 0;
		
		this.funcCallBack(iCalcTop * this.fScale250);
	
	};

};

/******************************
 * Record class
 ******************************/
function RecordSpin()
{
	this.strImgWrapperID = "divRecord" + Number(Math.floor(Math.random() * 10000)).toString();
	this.strRecordWrapperID = "divRecWrap" + Number(Math.floor(Math.random() * 10000)).toString();
	this.strImage = "divRecImg" + Number(Math.floor(Math.random() * 10000)).toString();

	this.iDegCount = 0;
	
	this.spin = function()
	{
		var divRotate = document.getElementById(this.strImgWrapperID);
		divRotate.className = "recordpicspin";
		divRotate.setAttribute("style", this.strStyleString);
	
		divRotate = document.getElementById(this.strImage);
	
		if (divRotate)
		{
			divRotate.className = "recordpicspin";
			divRotate.setAttribute("style", this.strStyleString);
		}
	}

	this.stop = function()
	{
		var divRotate = document.getElementById(this.strImgWrapperID);
		divRotate.className = "recordpic";
		divRotate.setAttribute("style", this.strStyleString);
		
		divRotate = document.getElementById(this.strImage);
		divRotate.className = "recordpicspin";
		divRotate.setAttribute("style", this.strStyleString);
	}

	this.init = function(iLeftCoord, iTopCoord, iSize, iImgSize, strDivParent) 
	{

		this.originX = iSize/2;
		this.originY = iSize/2
	
		this.strDivParent = strDivParent;
		var divParent = document.getElementById(strDivParent);
		
		var divWrapper = document.createElement("div");
		divWrapper.className = "recordwrapper";
		divWrapper.setAttribute("style","top:" +
							Number(iTopCoord).toString() + "px; left:" +
							Number(iLeftCoord).toString() + "px; ");
		divParent.appendChild(divWrapper);
		divWrapper.id = this.strRecordWrapperID;
		divParent = divWrapper;
		
		divWrapper = document.createElement("div");
		divWrapper.className = "recordparent";
		divParent.appendChild(divWrapper);
		
		divWrapper = document.createElement("div");
		divWrapper.className = "recordspin";
		divParent.appendChild(divWrapper);
		
		divWrapper = document.createElement("div");
		divWrapper.className = "recordhole";
		divParent.appendChild(divWrapper);
		
		var iPicLeft = this.originX - iImgSize/2;
		var iPicTop = this.originY - iImgSize/2;
		
		divWrapper = document.createElement("div");
		divWrapper.className = "recordpic";
		this.strStyleString = "top:" + Number(iPicTop).toString() + "px; left:" +
							Number(iPicLeft).toString() + "px; "
		divWrapper.setAttribute("style", this.strStyleString);
		divWrapper.id = this.strImgWrapperID;
		divParent.appendChild(divWrapper);
		
	};

	this.addImage = function(strArtist, strAlbum)
	{
		var imgImage = document.getElementById(this.strImage);
	
		if (imgImage)
			document.getElementById(this.strImgWrapperID).removeChild(imgImage);
	
		this.checkLastFM(strArtist, strAlbum);
	}

	this.addImageCallBack = function(data)
	{
		var strImgPath = data;
		
		if (!(strImgPath) || (strImgPath == ""))
			return;
	
		var divParent = document.getElementById(this.strImgWrapperID);
		
		var imgAlbum = document.createElement("img");
		imgAlbum.className = "recordpic";
		imgAlbum.setAttribute("src", strImgPath);
		imgAlbum.id = this.strImage;
		
		divParent.appendChild(imgAlbum);
	}


	this.checkLastFM = function(strArtist, strAlbum)
	{
	
		Mojo.Log.info("In checkLast");
	
		/* Create a cache object */
		var cache = new LastFMCache();

		/* Create a LastFM object */
		var lastfm = new LastFM({
			apiKey    : '03164f37686e29a8af8c368071204b8a',
			apiSecret : 'fd6eb5357b415ead8c67793edfb6dd1b',
			cache     : cache
		});

		/* Load some artist info. */
		lastfm.album.getInfo({artist: strArtist, album: strAlbum}, 
				{success: 
					function(data){
						Mojo.Log.info("Callback returned");
						this.addImageCallBack(data.album.image[0]["#text"]);
					}.bind(this), 
					error: function(code, message){
						Mojo.Log.info("Nope" + message);
						this.addImageCallBack("");
					}.bind(this)
				});

	}



}