/*********************************************
I would make this all nice and spiffy, but since Palm is killing
mojo, I don't see the point.  Cheers.

Also, screw JSlint whitespace checking.

FOR DEBUGGING PUT THE FOLLOWING INTO WINDOWS COMMAND PROMPT...
palm-log -d usb --system-log-level=info
palm-log -f -d usb com.epikmayo.audiophile
*/ 

var FILTER_MODE_NONE = 0;
var FILTER_MODE_BY_PROP = 1;

var HomeAssistant = Class.create(
{
  	initialize: function(objWAMP, strProp, strKey) 
	{
	
		if (objWAMP.isHomeInit) 
		{
			//End up here HomeAssistant has already been called once
			this.objwAMP = objWAMP;
		}
		else
		{
			objWAMP.Log("Initing");
			//If not, then this is the first time, so we need to init the objWAMP
			this.objwAMP = objWAMP;
			this.objwAMP.isHomeInit = 1;
			this.objwAMP.setCurrentPath("/media/internal");
		};
		
		this.myModel = new Object();
		
		if (objWAMP.getFolderView() == false)
		{
			if(this.objwAMP.strSortKey == "title")
			{
				this.iFilterMode = FILTER_MODE_NONE;
				this.myModel.items = this.objwAMP.getFileList();
			}
			else if (strProp)
			{
				this.iFilterMode = FILTER_MODE_NONE;
				this.myModel.items = this.objwAMP.FilterSongs(strProp, strKey);
			}
			else
			{
				this.iFilterMode = FILTER_MODE_BY_PROP;
				this.myModel.items = uniqueArray(this.objwAMP.getFileList(),this.objwAMP.strSortKey);
			}		
		}
		else
		{
			this.iFilterMode = FILTER_MODE_NONE;
			this.myModel.items = this.objwAMP.getFileList();
		}
		
		
	},

	
	// SETUP THE LIST WIDGET TO DISPLAY THE FILE FOLDER LISTING
  	setup: function() 
	{
		var me = this;
	
		// Setup the list
		this.controller.setupWidget("myListWidget", 
									{ 
										itemTemplate: 'home/myItemTemplate', 
										listTemplate: 'home/myListTemplate', 
										swipeToDelete: false, 
										reorderable: false,
										formatters:{itemOutput: this.RenderListItem.bind(this)}
									}, 
									this.myModel);
        this.controller.listen('myListWidget',Mojo.Event.listTap, this.myTap.bindAsEventListener(this)); 
		
		var imgHeader = window.document.createElement("img");
		imgHeader.className = "indexviewButton";
		
		this.objwAMP.Log(this.objwAMP.strImgPath);
		imgHeader.setAttribute("src", this.objwAMP.strImgPath);
		
		this.objwAMP.Log(imgHeader);
		$("idListHeaderDiv").appendChild(imgHeader);
		
		this.controller.setupWidget(Mojo.Menu.appMenu, newsMenuAttr, newsMenuModel);
	},

	activate: function()
	{
		
	},
	
	RenderListItem: function(propertyValue, model) 
	{
		if (this.objwAMP.getFolderView())
		{
			if (model.isdir)
				model.itemOutput = '<img src="res/folder.jpg" style="height:49px; width:72px" />' + model.name;
			else
				model.itemOutput = model.name;
		}
		else
		{
			if (this.iFilterMode == FILTER_MODE_BY_PROP)
			{
				model.itemOutput = model[this.objwAMP.strSortKey];
			}
			else
			{
				model.itemOutput = model.title;
			}
		}
	},
	
	myTap: function(event)
	{
		// CALLED BY USER CLICKING ON THE LIST WIDGET
	
		if (this.myModel.items[event.index].isdir == true)
		{
			// IF THEY TAPPED ON A FOLDER, THEN FETCH THE FOLDER LISTING
			this.objwAMP.setCurrentPath(this.myModel.items[event.index].path);
			Mojo.Controller.stageController.pushScene("home", this.objwAMP);
		}
		else
		{
			// IF THEY TAPPED ON A SONG, THEN PLAY IT
		
			if (this.iFilterMode == FILTER_MODE_BY_PROP)
			{

				this.objwAMP.Log("In the filter mode SortKey:" + this.objwAMP.strSortKey);
				this.objwAMP.Log("Item:" + this.myModel.items[event.index][this.objwAMP.strSortKey]);
			
				Mojo.Controller.stageController.pushScene("home", 
														  this.objwAMP, 
														  this.objwAMP.strSortKey,
														  this.myModel.items[event.index][this.objwAMP.strSortKey]);
			}
			else
			{
				this.objwAMP.setPlayList(this.myModel.items.slice());
				this.objwAMP.setIndex(event.index);
				Mojo.Controller.stageController.popScenesTo();
				Mojo.Controller.stageController.swapScene({name: 'playsong', disableSceneScroller: true}, this.objwAMP);
			}
		};	
	},

	handleCommand: function(event)
	{
		// IF THE USER PERFORMED A BACK SWIPE GESTURE,
        if (event.type == Mojo.Event.back) 
		{
			// Go back to the index screen
			this.objwAMP.myPrevious = "home";
			Mojo.Controller.stageController.popScene(this.objwAMP);
        }
	},

	cleanup: function(event)
	{
		// UPON THE APP CLOSING, UNLOAD ALL VARIABLES
		this.controller.stopListening('myListWidget',Mojo.Event.listTap, this.myTap.bindAsEventListener(this)); 
		this.myModel = null;
	}

});
