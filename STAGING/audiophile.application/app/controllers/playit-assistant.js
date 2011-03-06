var PlayitAssistant = Class.create(
{

  	initialize: function(objwAMP) 
	{
/* FOR DEBUGGING PUT THE FOLLOWING INTO WINDOWS COMMAND PROMPT...
palm-log -d usb --system-log-level=info
palm-log -f -d usb com.epikmayo.audiophile
*/ 
		this.objwAMP = objwAMP;
		this.iCheckingSongTrans = 0;
		Mojo.Log.info("PLAYIT initialize myIndex: ");
        this.myScrubberModel = null;
        this.myScrubberModel = {};
        this.myScrubberValue = 0;
		this.mySyncTime = 0;
        this.PluginState = null;
        this.initialSong = 1;
        this.showMetadata = 0;
        this.myMetadata = " ";
			//Mojo.Log.info("PLAYIT initialize myIndex: " + this.myIndex + " SongModel: " + Object.toJSON(this.SongModel));
	},

  	setup: function() 
	{	
// DETECT IF THIS IS NOT THE FIRST TIME THIS SCENE HAS BEEN CALLED BY home
// THIS MIGHT MEAN THAT A SONG IS ALREADY PLAYING
// SO PAUSE IT BEFORE LAUNCHING THE CURRENTLY DESIRED SONG
		if(myGlobal.myprevscene == "home2"){
			myGlobal.myprevscene = "playit";
// IDEALLY PAUSE IT HERE, BUT CURRENTLY NOT WORKING
// SO AM PAUSING IT IN handleCommand UPON LEAVING THIS SCENE INSTEAD
//			this.controller.get('wAMPPlugin').Pause();
		};

// INITIALIZE ALL GLOBAL VARIABLES
	    this.myIsPlaying = 0;
		this.myWaitingToOpen = 0;	
		this.fTimeScale = 9999;
		this.iSongLen = -1;
		this.strSongLenStr = "";
		this.EqModel = {
	            value: 34,
	    };
		this.VolumeModel = {
	            value: 33,
	    };
		this.SpeedModel = {
	            value: 2,
	    };
        this.ProgressModel = {
            value: 0,
			title: "0:00|0:00"
		};
        this.myScrubberModel = {
                value: 0,
                maxValue: 1000,
                minValue: 0
        };
		
// SETUP ALL OF THE ELEMENTS ON THE SCREEN
		this.controller.setupWidget('myprev', "", "");
		this.controller.setupWidget('myplaypause', "", "");
		this.controller.setupWidget('mynext', "", "");
		
		this.controller.setupWidget("myspeed", 
					    this.attributes = { 
								'minValue': 0,
								'maxValue': 4,
								'round':false,
	                    },this.SpeedModel);
	                    
		this.controller.setupWidget("myvolume", 
					    this.attributes = { 
								'minValue': 0,
								'maxValue': 100
	                    },this.VolumeModel);
	                    
		this.controller.setupWidget("mytreble", 
					    this.attributes = { 
								'minValue': 0,
								'maxValue': 100
	                    },this.EqModel);
	                    
		this.controller.setupWidget("mybass", 
					    this.attributes = { 
								'minValue': 0,
								'maxValue': 100
	                    },this.EqModel);
	                    
		this.controller.setupWidget("myscrubber", 
					    this.attributes = { 
				                sliderProperty: "value",
				                round: true
	                    },this.myScrubberModel);
/*	
// WE ARE CURRENTLY USING THE SCRUBBER IN LIEU OF THE PROGRESS PILL                    
		this.controller.setupWidget("myprogress", 
			        this.attributes = {},
			        this.ProgressModel);
*/					

// LISTEN TO ALL OF THE ELEMENTS ON THE SCREEN
	    //Mojo.Event.listen(this.controller.get("myplaypause"),Mojo.Event.tap, this.myTapPlayPause.bind(this));
	    Mojo.Event.listen(this.controller.get("myprev"),Mojo.Event.tap, this.myPrevTrack.bind(this));
	    Mojo.Event.listen(this.controller.get("mynext"),Mojo.Event.tap, this.myNextTrack.bind(this));
		Mojo.Event.listen(this.controller.get("myspeed"), Mojo.Event.propertyChange, this.mySetSpeed.bind(this));
		Mojo.Event.listen(this.controller.get("myvolume"), Mojo.Event.propertyChange, this.mySetVolume.bind(this));
		Mojo.Event.listen(this.controller.get("mytreble"), Mojo.Event.propertyChange, this.mySetTreble.bind(this));
		Mojo.Event.listen(this.controller.get("mybass"), Mojo.Event.propertyChange, this.mySetBass.bind(this));
        Mojo.Event.listen(this.controller.get("myscrubber"), Mojo.Event.propertyChange, this.myScrubberChange.bind(this));
        Mojo.Event.listen(this.controller.get("myscrubber"), Mojo.Event.sliderDragEnd, this.myScrubberEnd.bind(this));

		this.controller.get(myptime).update("0:00|0:00");
  	},

	activate: function(event)
	{
		this.myOpenNew();
		this.intervalStateCheck = setInterval(this.myTimer.bind(this),500);
	},

	deactivate: function(event)
	{
	// UPON THIS SCENE DEACTIVATING
	},
	
	myOpenNew: function()
	{
		try
		{   		
			this.objwAMP.OpenCurrentSong();
			this.objwAMP.Play();
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
	
	myPrevTrack: function(event)
	{
		// CALLED BY THE USER CLICKING THE Prev TRACK BUTTON
		this.objwAMP.Log("Prev");
		
		this.objwAMP.OpenPrevSong();
	},

	myGetMetadata: function()
	{	
		clearInterval(this.myMetaInterval);
		try{
			this.controller.get('mysonglabel').innerHTML = this.objwAMP.getCurrentSongName();
			allMetadata = this.objwAMP.getMetadata();
			for (var str in allMetadata)
			{
				var strOut = str.replace(/_/g, " ");
				this.myMetadata = String(strOut).toUpperCase() + " = " + allMetadata[str] + " | " + this.myMetadata;
			}
			
			this.controller.get('mymarquee').innerHTML = '<marquee id="m" behavior="scroll" direction="left" scrollamount="4">' + this.myMetadata +  '</marquee>';
		} catch (e) { 
			Mojo.Log.error("Error happened: %j", e); 
		};
	},
	

	myTimer: function()
	{
		try {
		
			this.PluginState = this.objwAMP.getState();
			
			// Run this only on a song transition
			if ((this.fTimeScale == 9999) || (this.iSongLen != this.PluginState["EndAmt"]))
			{
				if (this.fTimeScale == 9999)
					this.myMetaInterval = setInterval(this.myGetMetadata.bind(this),2000);
					
				this.fTimeScale = 1/this.PluginState["EndAmt"];
				this.iSongLen = this.PluginState["EndAmt"];
				
				if (this.PluginState["EndAmt"] == 0)
				{
					this.strSongLenStr = "0:00";
				}
				else if (this.PluginState["EndAmt"] < 10)
				{
					this.strSongLenStr = "0:0"+Number(this.PluginState["EndAmt"]).toString();
				}
				else if (this.PluginState["EndAmt"] < 60)
				{
					this.strSongLenStr = "0:"+Number(this.PluginState["EndAmt"]).toString();
				}
				else
				{
					// first get the minutes part of the number without division
					GetMin = this.PluginState["EndAmt"] * .01667;
					this.strSongLenStr = Number(Math.floor(GetMin)).toString();
					
					// Now subtract out the number of minute to get seconds
					GetMin = Math.floor(GetMin) * 60;
					GetMin = this.PluginState["EndAmt"] - GetMin;
					
					// now finish the string
					if (GetMin == 60)
					{
						this.strSongLenStr = this.strSongLenStr+":00";
					}
					else if (GetMin < 10)
					{
						this.strSongLenStr = this.strSongLenStr+':0'+Number(GetMin).toString();
					}
					else
					{
						this.strSongLenStr = this.strSongLenStr+':'+Number(GetMin).toString();
					}
				}
			}
			
			// Note, this could go over 1 from rounding errors, or because
			//	we pad the end of the song
            this.myScrubberModel.value = this.fTimeScale * this.PluginState["CurPos"] * 1000;
			
			// Decare the title string variable
			var ProgressString;
			
			if (this.PluginState["CurPos"] == 0)
			{
				ProgressString = "0:00";
			}
			else if (this.PluginState["CurPos"] < 10)
			{
				ProgressString = "0:0"+Number(this.PluginState["CurPos"]).toString();
			}
			else if (this.PluginState["CurPos"] < 60)
			{
				ProgressString = "0:"+Number(this.PluginState["CurPos"]).toString();
			}
			else
			{
				// first get the minutes part of the number without division
				GetMin = this.PluginState["CurPos"] * .01667;
				ProgressString = Number(Math.floor(GetMin)).toString();
				
				// Now subtract out the number of minute to get seconds
				GetMin = Math.floor(GetMin) * 60;
				GetMin = this.PluginState["CurPos"] - GetMin;
				
				// now finish the string
				if (GetMin == 60)
				{
					ProgressString = ProgressString+":00";
				}
				else if (GetMin < 10)
				{
					ProgressString = ProgressString+':0'+Number(GetMin).toString();
				}
				else
				{
					ProgressString = ProgressString+':'+Number(GetMin).toString();
				}
			}
			
			ProgressString = ProgressString + "|" + this.strSongLenStr;
			this.controller.get('myptime').innerHTML = ProgressString;
			this.controller.modelChanged(this.myScrubberModel);	
	
			if ((this.PluginState["SongState"] == 107) && (this.iCheckingSongTrans == 0))
			{
				this.strCurrentSongPath = this.PluginState["CurrentSongPath"];
				this.iCheckingSongTrans = 1;
			}
			
			if ((this.iCheckingSongTrans) && (this.strCurrentSongPath != this.PluginState["CurrentSongPath"]))
			{
				this.objwAMP.endCurSong();
				this.iCheckingSongTrans = 0;
				this.myMetaInterval = setInterval(this.myGetMetadata.bind(this),2000);
			}
 
		} catch (e) { Mojo.Log.error("Error happened: %j", e); }
	},
	
	mySetSpeed: function(event)
	{	
		var myvalue;
		if (event.value > 2)
		{
			myvalue = (5 - event.value) * 0.25;
		}
		else
		{
			myvalue = 3 - event.value;
		}
		myvalue = myvalue.toString();
		this.objwAMP.setSpeed(myvalue);
	},

	mySetVolume: function(event)
	{	
		var myvalue = (event.value/100 * 3);
		myvalue = myvalue.toString();
		this.objwAMP.setVol(myvalue);
	},

	mySetTreble: function(event)
	{	
		var myvalue = (event.value/100 * 3);
		myvalue = myvalue.toString();
		this.objwAMP.setTreble(myvalue);
	},

	mySetBass: function(event)
	{	
		var myvalue = (event.value/100 * 3);
		myvalue = myvalue.toString();
		this.objwAMP.setBass(myvalue);
	},

	myScrubberChange: function(event)
	{
		// CALLED REPEATEDLY WHILE USER IS DRAGGING THE SCRUBBER
    	this.myScrubberValue = event.value;
		// APPLY AN UPPER LIMITER ON THE TRAVEL OF THE SCRUBBER TO AVOID ERRORS
    	if(this.myScrubberValue > 990) {
    		this.myScrubberValue = 990;
    	};
		
	},

	myScrubberEnd: function()
	{
		// CALLED WHEN USER STOPS DRAGGING THE SCRUBBER
		// ADJUST THE AUDIO OBJECT TIME ACCORDINGLY
        var mynewtime = ((this.myScrubberValue*0.001) * this.PluginState["EndAmt"]);
		this.objwAMP.seek(mynewtime);
		// ADJUST THE SCRUBBER POSITION
        this.myScrubberModel.value = this.myScrubberValue;
	},

	handleCommand: function(event)
	{
		// IF THE USER PERFORMED A BACK SWIPE GESTURE,
        if (event.type == Mojo.Event.back) 
		{
			// Go back to the index screen
			this.objwAMP.myPrevious = "playit";
			Mojo.Controller.stageController.pushScene("indexview",this.objwAMP);
        }
	},

	cleanup: function(event)
	{
// UPON THE APP CLOSING, UNLOAD ALL VARIABLES
        //Mojo.Event.stopListening(this.controller.get("myplaypause"),Mojo.Event.tap, this.myTapPlayPause.bind(this));
        Mojo.Event.stopListening(this.controller.get("myprev"),Mojo.Event.tap, this.myPrevTrack.bind(this));
        Mojo.Event.stopListening(this.controller.get("mynext"),Mojo.Event.tap, this.myNextTrack.bind(this));
        Mojo.Event.stopListening(this.controller.get("myscrubber"), Mojo.Event.propertyChange, this.myScrubberChange.bind(this));
        Mojo.Event.stopListening(this.controller.get("myscrubber"), Mojo.Event.sliderDragEnd, this.myScrubberEnd.bind(this));
        this.SongModel = null;
		this.EqModel = null;
		this.VolumeModel = null;
		this.SpeedModel = null;
        this.myIndex = null;
        this.myIsPlaying = null;
		this.myWaitingToOpen = null;	
        this.PluginState = null;	
		this.mySyncTime = null;
        this.initialSong = null;
        this.showMetadata = null;
        this.myMetadata = null;
	},

	
	
});
