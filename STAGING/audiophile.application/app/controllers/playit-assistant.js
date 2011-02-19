var PlayitAssistant = Class.create(
{

  	initialize: function(myM,myI) 
	{
/* FOR DEBUGGING PUT THE FOLLOWING INTO WINDOWS COMMAND PROMPT...
palm-log -d usb --system-log-level=info
palm-log -f -d usb com.epikmayo.audiophile
*/ 
		this.SongModel = myM;
		this.myIndex = myI;
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
	    this.myPSeconds = 0;
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
	    Mojo.Event.listen(this.controller.get("myplaypause"),Mojo.Event.tap, this.myTapPlayPause.bind(this));
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
// UPON THIS SCENE ACTIVATING

// START TIMER WHICH FIRES AFTER 1 SECOND AND THEN CALLS THE PLUGIN ONCE IT HAS INITIALLY LOADED
        this.myInterval = setInterval(this.myLoadTimer.bind(this),1000);
	},

	deactivate: function(event)
	{
// UPON THIS SCENE DEACTIVATING
	},

	myLoadTimer: function()
	{	
// THIS TIMER IS USED ONCE ONLY UPON SCENE EXISTING FOR ONE SECOND, THEN NEVER AGAIN
// AFTER ONE SECOND HAS ELAPSED IT IS SAFE TO CALL THE PLUGIN FOR THE FIRST TIME
		if(this.myPSeconds == 1) {
			this.myPSeconds = null;
// CALL JS FUNCTION TO LOAD THE CURRENT SONG
Mojo.Log.info("PLAYIT myLoadTimer CALLED JS myOpenNew");
			this.myOpenNew();
// ONCE SONG IS LOADED WE CAN PLAY IT			
Mojo.Log.info("PLAYIT myLoadTimer CALLED PLUGIN Play");
			this.controller.get('wAMPPlugin').Play();
		};
        this.myPSeconds++;
	},

	myOpenNew: function()
	{
// CALLED BY myNextTrack OR myPrevTrack
// FORCE NEXT SONG TO START
		try
		{
// CALL THE PLUGIN TO LOAD THE SONG
// THIS PLUGIN METHOD REMEMBERS AND AUTOMATICALLY APPLIES THE LAST PLAY/PAUSE STATE TO THE SONG    		
Mojo.Log.info("PLAYIT myOpenNew CALLED PLUGIN Open");
			this.controller.get('wAMPPlugin').Open(this.SongModel.items[this.myIndex].path);
// SINCE myNextTrack MAY TEMPORARILY SET THIS VALUE TO FALSE UNTIL THE SONG OPENS, THEN SET IT BACK NOW THAT THE SONG HAS OPENED
			this.myIsPlaying = 1;
// UPDATE THE SONG INFO DISPLAYED TO THE USER                                   
			this.controller.get('mysonglabel').innerHTML = this.SongModel.items[this.myIndex].name;
			this.controller.get('mypathlabel').innerHTML = '<marquee behavior="scroll" direction="left" scrollamount="5">' + this.SongModel.items[this.myIndex].path +  '</marquee>';
Mojo.Log.info("PLAYIT CALLING myMetaInterval");
        	this.myMetaInterval = setInterval(this.myGetMetadata.bind(this),2000);
		}
		catch(e)
		{
			Mojo.Controller.errorDialog(e);
		}
	    this.myLoadNext();
	},
	
	myLoadNext: function()
	{
// CALLED BY activate OR myNextTrack OR myPrevTrack
// CALLED WHENEVER A SONG HAS STARTED PLAYING
// THIS FUNCTION LOADS THE NEXT TRACK WHILE THE CURRENT TRACK IS PLAYING
// MAKES THE NEXT TRACK READY TO BE USED FOR CROSSFADE OR GAPLESS PLAYBACK BASED ON this.mySyncTime

// CLEARING THIS TIMER KILLS THE INITIAL myLoadTimer
// ALSO CLEARING THIS TIMER KILLS ANY EXISTING INSTANCES OF myTimer
        clearInterval(this.myInterval);
// SET NEW TIMER TO DISPLAY SYNCED ELAPSED TRACK TIME TO USER
Mojo.Log.info("PLAYIT myLoadNext SETTING NEW INTERVAL");
        this.myInterval = setInterval(this.myTimer.bind(this),1000);
		var myNewIndex = this.myIndex + 1;
		try
		{
// CALL THE PLUGIN TO LOAD THE NEXT SONG   
// THIS PLUGIN METHOD KNOWS WHEN TO AUTOMATICALLY PLAY THIS NEXT SONG BASED ON THE INTEGER VALUE PASSED TO IT
Mojo.Log.info("PLAYIT FUNCTION myLoadNext IS ATTEMPTING TO CALL PLUGIN OpenNext WITH INDEX: " + myNewIndex + " SONG: " + this.SongModel.items[myNewIndex].path); 		
			this.controller.get('wAMPPlugin').OpenNext(this.SongModel.items[myNewIndex].path,0);
// WOULD PREFER TO CALL THE METHOD WITH A DYNAMIC VALUE CALLED this.mySyncTime BUT CURRENTLY NOT WORKING
//			this.controller.get('wAMPPlugin').OpenNext(this.SongModel.items[this.myIndex + 1].path,this.mySyncTime);
		}
		catch(e)
		{
			Mojo.Controller.errorDialog(e);
		}
	},
	
	myTapPlayPause: function(event)
	{
// CALLED BY THE USER CLICKING THE PLAYPAUSE BUTTON
		try
		{
// IF USER WANTS TO DEACTIVATE THE PAUSE BUTTON AND WE'RE NOT WAITING TO OPEN A NEW SONG THEN
// UNPAUSE THE CURRENT TRACK
			if (this.myIsPlaying == 0 && this.myWaitingToOpen == 0) {
Mojo.Log.info("PLAYIT myTapPlayPause CALLED PLUGIN Play");
				this.controller.get('wAMPPlugin').Play();
// MAKE SURE THE CORRECT BUTTON IS DISPLAYED TO THE USER	            
                this.controller.get('myplaypause').removeClassName("myplay");
                this.controller.get('myplaypause').addClassName("mypause");	                       
	    		this.myIsPlaying = 1;
// ELSE IF USER WANTS TO DEACTIVATE THE PAUSE BUTTON AND WE ARE WAITING TO OPEN A NEW SONG THEN
// OPEN THE NEW SONG, THEN TELL IT TO START PLAYING (BECAUSE THE PLUGIN ADHERES TO THE LAST PLAY/PAUSE STATE, WHICH IN THIS CASE WAS PAUSE)
			}else if (this.myIsPlaying == 0 && this.myWaitingToOpen == 1){
				this.myWaitingToOpen = 0;
Mojo.Log.info("PLAYIT myTapPlayPause CALLED JS myOpenNew");
				this.myOpenNew();
Mojo.Log.info("PLAYIT myTapPlayPause CALLED PLUGIN Play");
				this.controller.get('wAMPPlugin').Play();
                this.controller.get('myplaypause').removeClassName("myplay");
                this.controller.get('myplaypause').addClassName("mypause");	                       
        	}else{
// ELSE USER WANTS TO ACTIVATE THE PAUSE BUTTON SO PAUSE THE CURRENT TRACK
Mojo.Log.info("PLAYIT myTapPlayPause CALLED PLUGIN Pause");
				this.controller.get('wAMPPlugin').Pause();
                this.controller.get('myplaypause').removeClassName("mypause");
                this.controller.get('myplaypause').addClassName("myplay");	                       
	    		this.myIsPlaying = 0;
        	};
		}
		catch(e)
		{
			Mojo.Controller.errorDialog(e);
		}
	},
	
	myNextTrack: function(event)
	{
// CALLED BY THE USER CLICKING THE NEXT TRACK BUTTON

// IF THE CURRENT TRACK IS NOT THE LAST TRACK IN THE LIST, THEN        
        if(this.myIndex < this.SongModel.items.length-1) {
                this.myIndex++;
        }else{
                this.myIndex = 0;
        };
// IF THE PAUSE BUTTON IS ACTIVATED THEN DON'T CALL myOpenNew JUST YET 
// BECAUSE IT WILL START PLAYING THE NEXT SONG ANYWAY
		if (this.myIsPlaying == 0) {
// SET FLAG THAT WE'RE WAITING FOR THE PAUSE BUTTON TO BE DEACTIVATED BY THE USER
// THEN WE'LL CALL myOpenNew FROM WITHIN myTapPlayPause
			this.myWaitingToOpen = 1;		
		}else{
// TEMPORARILY INDICATE PLAYING FALSE SO THAT myTimer DOES NOT CALL ANY OTHER FUNCTIONS IN THE MEANTIME
			this.myIsPlaying = 0;
// CALL THE JS PLAY FUNCTION
			this.myOpenNew();
		};
// UPDATE THE SONG INFO DISPLAYED TO THE USER                                   
		this.controller.get('mysonglabel').innerHTML = this.SongModel.items[this.myIndex].name;
		this.controller.get('mypathlabel').innerHTML = '<marquee behavior="scroll" direction="left" scrollamount="5">' + this.SongModel.items[this.myIndex].path +  '</marquee>';
Mojo.Log.info("PLAYIT CALLING myMetaInterval");
        this.myMetaInterval = setInterval(this.myGetMetadata.bind(this),2000);
	},
	
	myPrevTrack: function(event)
	{
// CALLED BY THE USER CLICKING THE PREVIOUS TRACK BUTTON

// IF THE CURRENT TRACK IS NOT THE FIRST TRACK IN THE LIST, THEN        
        if(this.myIndex > 0) {
                this.myIndex--;
        }else{
                this.myIndex = 0;
        };
// IF THE PAUSE BUTTON IS ACTIVATED THEN DON'T CALL myOpenNew JUST YET 
// BECAUSE IT WILL START PLAYING THE PREVIOUS SONG ANYWAY
		if (this.myIsPlaying == 0) {
// SET FLAG THAT WE'RE WAITING FOR THE PAUSE BUTTON TO BE DEACTIVATED BY THE USER
// THEN WE'LL CALL myOpenNew FROM WITHIN myTapPlayPause
			this.myWaitingToOpen = 1;		
		}else{
// CALL THE JS PLAY FUNCTION
			this.myOpenNew();
		};
// UPDATE THE SONG INFO DISPLAYED TO THE USER                                   
		this.controller.get('mysonglabel').innerHTML = this.SongModel.items[this.myIndex].name;
		this.controller.get('mypathlabel').innerHTML = '<marquee behavior="scroll" direction="left" scrollamount="5">' + this.SongModel.items[this.myIndex].path +  '</marquee>';
Mojo.Log.info("PLAYIT CALLING myMetaInterval");
        this.myMetaInterval = setInterval(this.myGetMetadata.bind(this),2000);
	},

	myGetMetadata: function()
	{	
Mojo.Log.info("PLAYIT CALLED JS FUNCTION myGetMetadata");
		try{
				var strTmp = this.controller.get('wAMPPlugin').GetMetadata();
Mojo.Log.info("METADATA STRING " + Object.toJSON(strTmp));
//Mojo.Log.info("PLAYIT METADATA: " + Mojo.parseJSON(strTmp));
//				var allMetadata = Mojo.parseJSON(strTmp);
				this.myMetadata = Object.toJSON(strTmp);
				this.controller.get('mymarquee').innerHTML = '<marquee id="m" behavior="scroll" direction="left" scrollamount="4">' + this.myMetadata +  '</marquee>';
        		clearInterval(this.myMetaInterval);
		} catch (e) { 
			Mojo.Log.error("Error happened: %j", e); 
		};
	},
	
	mySongEnded: function()
	{	
// CALLED BY myTimer UPON CURRENT SONG FINISHING PLAYING
// NOTE THAT THE NEXT SONG AUTOMATICALLY STARTS PLAYING
// SO NEED TO REFLECT CURRENT SONG IN UI TO USER
// THAT WILL BE ACCOMPLISHED BY CALLING myLoadNext
	
// INCREMENT THE INDEX TO REFLECT THE CURRENT SONG
        this.myIndex++;
// UPDATE THE SONG INFO DISPLAYED TO THE USER                                   
		this.controller.get('mysonglabel').innerHTML = this.SongModel.items[this.myIndex].name;
		this.controller.get('mypathlabel').innerHTML = '<marquee behavior="scroll" direction="left" scrollamount="5">' + this.SongModel.items[this.myIndex].path +  '</marquee>';
Mojo.Log.info("PLAYIT CALLING myMetaInterval");
        this.myMetaInterval = setInterval(this.myGetMetadata.bind(this),2000);
		
Mojo.Log.info("PLAYIT IS NOW PLAYING SONG AT: " + this.SongModel.items[this.myIndex].path);               
// IF WE REACHED END OF PLAYLIST
		if(this.myIndex >= this.SongModel.items.length - 1){
// RESET INDEX BACK TO BEGINNING
// SET TO NEGATIVE ONE BECAUSE myLoadNext WILL INCREMENT IT
			this.myIndex = 0;
			this.myIndex--;
		};
Mojo.Log.info("PLAYIT FUNCTION mySongEnded SET myIndex: " + this.myIndex);
Mojo.Log.info("PLAYIT FUNCTION mySongEnded NOW CALLING FUNCTION myLoadNext()");
// CUE THE NEXT SONG AND UPDATE UI TO USER
		this.myLoadNext();
	},

	myTimer: function()
	{
// THIS FUNCTION GETS THE CURRENT PLAYING STATE AND UPDATES THE SCRUBBER
	  if(this.myIsPlaying == 1){
		try {
		
			var StateString = this.controller.get('wAMPPlugin').GetState();
			
			// Uncomment this to see what the plugin is passing
			//Mojo.Log.info(StateString);
			
			this.PluginState = Mojo.parseJSON(StateString); // or j = JSON.parse(j)
			
//			Mojo.Log.info(this.PluginState["CurPos"]);
//			Mojo.Log.info(this.PluginState["EndAmt"]);
			
			// we want to avoid repeated divisions, so only set this if we change
			//	song (not implemented) or first start.  We use 9999 as the trigger
			//	because of floating point issues.
			if (this.fTimeScale == 9999)
			{
				this.fTimeScale = 1/this.PluginState["EndAmt"];
			};
			
			// This is less than zero only on a song transition
			if ((this.iSongLen < 0) || (this.iSongLen != this.PluginState["EndAmt"]))
			{
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
//					Mojo.Log.info(GetMin);
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
//			this.ProgressModel.value = this.fTimeScale * this.PluginState["CurPos"];
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
//				Mojo.Log.info(GetMin);
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
// THE FOLLOWING ALWAYS OCCURS (OUTSIDE OF IF/ELSE STATEMENTS ABOVE)			
			ProgressString = ProgressString + "|" + this.strSongLenStr;
			this.controller.get(myptime).update(ProgressString);
//			this.ProgressModel.title = ProgressString;
//			this.controller.modelChanged(this.ProgressModel);
            this.controller.modelChanged(this.myScrubberModel);	

			var pluginSong = this.PluginState["CurrentSongPath"];
			pluginSong = pluginSong.toString();
			var jsSong = this.SongModel.items[this.myIndex].path;
			if(jsSong == pluginSong) {
			}else{
Mojo.Log.info("PLAYIT myTimer FOUND END OF SONG. NOW CALLING FUNCTION mySongEnded()");
				this.mySongEnded();
			};
// END OF TRY   
		} catch (e) { Mojo.Log.error("Error happened: %j", e); }
// END IF
	  };
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
		this.controller.get('wAMPPlugin').SetSpeed(myvalue);
/*
// FOR REVERSE ORDER
		if (event.value <=3)
		{ myvalue = (event.value+1) * 0.25; }
		else
		{ myvalue = event.value - 2; }
*/
	},

	mySetVolume: function(event)
	{	
		var myvalue = (event.value/100 * 3);
		myvalue = myvalue.toString();
		this.controller.get('wAMPPlugin').SetVol(myvalue);
	},

	mySetTreble: function(event)
	{	
		var myvalue = (event.value/100 * 3);
		myvalue = myvalue.toString();
		this.controller.get('wAMPPlugin').SetTreble(myvalue);
	},

	mySetBass: function(event)
	{	
		var myvalue = (event.value/100 * 3);
		myvalue = myvalue.toString();
		this.controller.get('wAMPPlugin').SetBass(myvalue);
	},

	myScrubberChange: function(event)
	{
// CALLED REPEATEDLY WHILE USER IS DRAGGING THE SCRUBBER
    	this.myScrubberValue = event.value;
// APPLY AN UPPER LIMITER ON THE TRAVEL OF THE SCRUBBER TO AVOID ERRORS
    	if(this.myScrubberValue > 950) {
    		this.myScrubberValue = 950;
    	};
				Mojo.Log.info("PLAYIT myScrubberChange CALLED event.value: " + event.value);
	},

	myScrubberEnd: function()
	{
// CALLED WHEN USER STOPS DRAGGING THE SCRUBBER
// ADJUST THE AUDIO OBJECT TIME ACCORDINGLY
        var mynewtime = ((this.myScrubberValue*0.001) * this.PluginState["EndAmt"]);
				Mojo.Log.info("PLAYIT myScrubberEnd SET mynewtime: " + mynewtime);
		this.controller.get('wAMPPlugin').Seek(mynewtime);
// ADJUST THE SCRUBBER POSITION
        this.myScrubberModel.value = this.myScrubberValue;
//        this.controller.modelChanged(this.myScrubberModel);
	},

	handleCommand: function(event)
	{
// IF THE USER PERFORMED A BACK SWIPE GESTURE,
// THEN OVERRIDE IT WITH A CUSTOM FUNCTION
        if (event.type == Mojo.Event.back) {
            event.stop();
            event.stopPropagation();
// INDICATE THAT WE ARE COMING FROM playit SCENE
			myGlobal.myprevscene = "playit";
// SHOULDN'T NEED TO PAUSE IT NOW, BUT OTHER METHOD IN setup IS CURRENTLY NOT WORKING
Mojo.Log.info("PLAYIT handleCommand CALLED PLUGIN Pause");
			this.controller.get('wAMPPlugin').Pause();
// SEND USER TO THE home SCENE VIA PUSH NOT POP, SO THAT THE CURRENT SONG KEEPS PLAYING
//	        Mojo.Controller.stageController.pushScene("home",this.myModel.items[this.myIndex].parent);
	        Mojo.Controller.stageController.pushScene("home","/media/internal");
        }
	},

	cleanup: function(event)
	{
// UPON THE APP CLOSING, UNLOAD ALL VARIABLES
        Mojo.Event.stopListening(this.controller.get("myplaypause"),Mojo.Event.tap, this.myTapPlayPause.bind(this));
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
        this.myPSeconds = null;
		this.myWaitingToOpen = null;	
        this.PluginState = null;	
		this.mySyncTime = null;
        this.initialSong = null;
        this.showMetadata = null;
        this.myMetadata = null;
	},

	
	
});
