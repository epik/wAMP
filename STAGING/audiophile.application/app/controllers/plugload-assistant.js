/*********************************************
I would make this all nice and spiffy, but since Palm is killing
mojo, I don't see the point.  Cheers.

Also, screw JSlint whitespace checking.

FOR DEBUGGING PUT THE FOLLOWING INTO WINDOWS COMMAND PROMPT...
palm-log -d usb --system-log-level=info
palm-log -f -d usb com.epikmayo.audiophile
*/ 
/*global $*/

var PlugloadAssistant = Class.create(
{
  	initialize: function(objWAMP) 
	{
		this.objwAMP = objWAMP;
	},

	activate: function()
	{
		// Need to give the plugin time to load and register
		//	so call it after a set interval
		this.myInterval = setInterval(this.LoadSplash.bind(this),1000);
	},
		
	LoadSplash: function()
	{	
		if (!(this.objwAMP.checkIfPluginInit()))
			return;
		
		var iIndexStatus = this.objwAMP.GetIndexStatus();
		
		this.objwAMP.Log("What is going on " + iIndexStatus);
		
		if(iIndexStatus === INDEX_NOT_READY_YET)
			return;
		
		clearInterval(this.myInterval);
		
		var me = this;
		
		this.NotReadyYetFunc = function(str)
		{
			if (!(me.iFirstCall))
			{
				me.iFirstCall = 0;
				me.divCurrentLoadTime = window.document.createElement("div");
				me.divCurrentLoadTime.id = "idSpashBackBox";
				me.divCurrentLoadTime.setAttribute('style', "position:absolute; font-family:cour; left:10%; right:" + 
													Number(90 - me.iFirstCall++).toString() + 
													"%; opacity:0.80; top:70%; z-index:2;  height:1.5em; color:#ffffff; background-color:#000000");
				$('idSplashAddToDiv').appendChild(me.divCurrentLoadTime);
				me.divStatus = window.document.createElement("div");
				me.divStatus.id = "idSpashUpdateBox";
				me.divStatus.setAttribute('style', "position:absolute; font-family:cour; left:10%; right:10%; top:70%; z-index:3; height:1.5em; color:#ffffff");
				$('idSplashAddToDiv').appendChild(me.divStatus);
				$('idSpashUpdateBox').innerHTML = Number(me.iFirstCall++).toString();
				$('idSpashUpdateBox').innerHTML = str;
			}
			

			var strFinish;
			
			if (me.iFirstCall<30)
			{
				strFinish = "left: 10%; -webkit-border-bottom-left-radius: 0.75em; -webkit-border-top-left-radius: 0.75em;";
			
				me.divCurrentLoadTime.setAttribute('style', "position:absolute; font-family:cour;" + strFinish +
													"right:" + Number(90 - me.iFirstCall).toString() + 
													"%; opacity:0.80; top:70%; z-index:2;  height:1.5em; color:#ffffff; background-color:#000000");
			}
			else if (me.iFirstCall<35)
			{
				strFinish = "left: " + Number(me.iFirstCall-20).toString() + "%; -webkit-border-bottom-left-radius: 0.6em; -webkit-border-top-left-radius: 0.6em;";
			
				me.divCurrentLoadTime.setAttribute('style', "position:absolute; font-family:cour;" + strFinish +
													"right:" + Number(90 - me.iFirstCall).toString() + 
													"%; opacity:0.80; top:70%; z-index:2;  height:1.5em; color:#ffffff; background-color:#000000");
			}
			else if (me.iFirstCall<40)
			{
				strFinish = "left: " + Number(me.iFirstCall-20).toString() + "%; -webkit-border-bottom-left-radius: 0.5em; -webkit-border-top-left-radius: 0.5em;";
			
				me.divCurrentLoadTime.setAttribute('style', "position:absolute; font-family:cour;" + strFinish +
													"right:" + Number(90 - me.iFirstCall).toString() + 
													"%; opacity:0.80; top:70%; z-index:2;  height:1.5em; color:#ffffff; background-color:#000000");
			}
			else if ((me.iFirstCall>70) && (me.iFirstCall<76))
			{
				strFinish = "right: " + Number(90 - me.iFirstCall).toString() + "%; -webkit-border-bottom-right-radius: 0.5em; -webkit-border-top-right-radius: 0.5em;";
				
				me.divCurrentLoadTime.setAttribute('style', "position:absolute; font-family:cour;" + 
													strFinish + "left:" + Number(me.iFirstCall-20).toString() +
													"%; opacity:0.80; top:70%; z-index:2;  height:1.5em; color:#ffffff; background-color:#000000");
			}
			else if ((me.iFirstCall>75)&& (me.iFirstCall<81))
			{
				strFinish = "right: " + Number(90 - me.iFirstCall).toString() + "%; -webkit-border-bottom-right-radius: 0.6em; -webkit-border-top-right-radius: 0.6em;";
				
				me.divCurrentLoadTime.setAttribute('style', "position:absolute; font-family:cour;" + 
													strFinish + "left:" + Number(me.iFirstCall-20).toString() +
													"%; opacity:0.80; top:70%; z-index:2;  height:1.5em; color:#ffffff; background-color:#000000");
			}
			else if (me.iFirstCall>80)
			{
				strFinish = "right: 10%; -webkit-border-bottom-right-radius: 0.75em; -webkit-border-top-right-radius: 0.75em;";
				
				me.divCurrentLoadTime.setAttribute('style', "position:absolute; font-family:cour;" + 
													strFinish + "left:" + Number(me.iFirstCall-20).toString() +
													"%; opacity:0.80; top:70%; z-index:2;  height:1.5em; color:#ffffff; background-color:#000000");
			}
			else
			{
				me.divCurrentLoadTime.setAttribute('style', "position:absolute; font-family:cour; left:" +
												Number(me.iFirstCall-20).toString() + 
												"%; right:" + 
												Number(90 - me.iFirstCall).toString() +
												"%; opacity:0.80; top:70%; z-index:2;  height:1.5em; -webkit-box-shadow: inset 5px 5px 5px #888; color:#ffffff; background-color:#000000");
			}
			
			if (me.iFirstCall++ == 110)
				me.iFirstCall = 1;


			$('idSpashUpdateBox').innerHTML = str;

		};
		
		if (iIndexStatus === INDEX_FIRST_RUN)
		{
			this.controller.showAlertDialog({   
				onChoose: function(value) {me.myInterval = setInterval(me.UpdateUser.bind(this),50);},
				title: "Indexing",
				message: "This appears to be the first time you have run wAMP, which will now search through your files and locate any media files.  This process may take a while, and may cause the phone to slow down while it is running  Please be patient.",
				choices:[    
					{label: "OK", value:"", type:'dismiss'}    
				]
			});
		}
		else if (iIndexStatus == INDEX_FAILED_LOAD)
		{
			this.controller.showAlertDialog({   
				onChoose: function() {me.objwAMP.bFolderOnly = true; 
									  Mojo.Controller.stageController.swapScene("indexview",
																			me.objwAMP);
									},
				title: "Indexing",
				message: "The indexer failed to run properly last time.  wAMP will only be able to run in Folder Only View until you are able to successfully run the indexer. You can rerun the indexer from the options menu.",
				choices:[    
					{label: "OK", value:"", type:'dismiss'}    
				]
			});
		}
		else
		{
			this.objwAMP.LoadIndex(this.NotReadyYetFunc);
			this.objwAMP.initPluginInterface();
			Mojo.Controller.stageController.swapScene("indexview",this.objwAMP);
		}
	},
		
	UpdateUser: function()
	{
		
		if (!(this.objwAMP.RunFirstIndex(this.NotReadyYetFunc)))
			return;
			
		// Plugin has been initialized, so load the dir structure
		clearInterval(this.myInterval);
		
		this.objwAMP.initPluginInterface();
		Mojo.Controller.stageController.swapScene("indexview",this.objwAMP);
	},
	
	cleanup: function(event)
	{
	// UPON THE APP CLOSING, UNLOAD ALL VARIABLES
		
	}

});
