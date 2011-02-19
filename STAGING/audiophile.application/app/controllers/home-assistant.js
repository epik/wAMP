var HomeAssistant = Class.create(
{

  	initialize: function(myP) 
	{
/* FOR DEBUGGING PUT THE FOLLOWING INTO WINDOWS COMMAND PROMPT...
palm-log -d usb --system-log-level=info
palm-log -f -d usb com.epikmayo.audiophile
*/ 
  if (myGlobal.myranonce) {
// IF RETURNING TO THIS SCENE IN A GIVEN SESSION, THEN
         this.myPath = myP;
  }else{
// ELSE IF THIS IS THE FIRST TIME THE USER HAS EVER ACCESSED THIS SCENE, THEN
         myGlobal.myranonce = 1;         
         this.myPath = "/media/internal";
  };
// ALWAYS SET THE FOLLOWING VARIABLES  
         this.myPath2 = null;
         this.myIndex = 0;
         this.myModel = null;
         this.myModel = {};
         this.myModel2 = null;
         this.myModel2 = {};
         this.myModel = { 
             items : [ 
                        {notice:'retrieving file listing . . .'}
                     ] 
         };
         this.myModel2 = { 
             items : [] 
         };
	},

  	setup: function() 
	{
// SETUP THE LIST WIDGET TO DISPLAY THE FILE FOLDER LISTING
		this.controller.setupWidget("myListWidget", 
		 { 
			 itemTemplate: 'home/myItemTemplate', 
			 listTemplate: 'home/myListTemplate', 
	         swipeToDelete: false, 
	         reorderable: false
		 }, 
		 this.myModel);
         this.controller.listen('myListWidget',Mojo.Event.listTap, this.myTap.bindAsEventListener(this)); 
// GET ALL FOLDERS AND FILES AT this.myPath LOCATION
		this.controller.serviceRequest("palm://com.epikmayo.audiophile.service", {
			method: "list",
			parameters: {"directory": this.myPath},
			onSuccess: function(payload) {
				if(payload.items.length > 0){
//				Mojo.Log.info("NODEJS SUCCESS: " + Object.toJSON(payload.items[0]));
		            this.myModel.items = payload.items[0].mydir;
		            this.myModel2.items = payload.items[0].myfile;
		            this.myModel.items = this.myModel.items.concat(this.myModel2.items);
// REFRESH THE LIST WIDGET
		            this.controller.modelChanged(this.myModel);
// AUTOSCROLL TO THE TOP OF THE LIST WIDGET
		            this.controller.get('myListWidget').mojo.revealItem(0, false);                                    
				}else{
					Mojo.Controller.errorDialog("This folder is empty");
				};
			}.bind(this),
			onFailure: function(err) {
//			Mojo.Log.info("NODEJS FAILURE: " + JSON.stringify(err));
				Mojo.Controller.errorDialog("No songs were found at " + somepath);
			}.bind(this)
		});
		
		 
  	},

	myTap: function(event)
	{
// CALLED BY USER CLICKING ON THE LIST WIDGET
	         this.myPath2 = this.myModel.items[event.index].path;
	         this.myIndex = event.index;
	
		if(this.myModel.items[event.index].isdir == true){
// IF THEY TAPPED ON A FOLDER, THEN FETCH THE FOLDER LISTING
			Mojo.Controller.stageController.pushScene('home',this.myPath2);
		}else{
// IF THEY TAPPED ON A SONG, THEN PLAY IT
			this.myFetchSong();
		};	
	},

	myFetchSong: function(event)
	{
// CALLED BY myTap

// IN THE SETUP WE STORED FOLDERS IN ONE MODEL, AND FILES IN A SECOND MODEL, SO
// RECALCULATE THE INDEX AS IT PERTAINS TO THE SECOND MODEL ONLY
		this.myIndex = this.myIndex - Math.abs(this.myModel.items.length - this.myModel2.items.length);
// IF THIS SCENE WAS CALLED BY playit SCENE
// THEN A SONG IS PROBABLY ALREADY PLAYING
// SO INDICATE TO playit TO PAUSE THE CURRENTLY PLAYING SONG
		if(myGlobal.myprevscene == "playit"){
			myGlobal.myprevscene = "home2";
		};
// POP ALL SCENES IN ORDER TO START FRESH
			Mojo.Controller.stageController.popScenesTo();
			Mojo.Controller.stageController.swapScene('playit',this.myModel2,this.myIndex);
	},

	cleanup: function(event)
	{
// UPON THE APP CLOSING, UNLOAD ALL VARIABLES
		this.controller.stopListening('myListWidget',Mojo.Event.listTap, this.myTap.bindAsEventListener(this)); 
		this.myIndex = 0;
		this.myModel = null;
		this.myModel2 = null;
        this.myPath = null;
        this.myPath2 = null;
	},

	
	
});
