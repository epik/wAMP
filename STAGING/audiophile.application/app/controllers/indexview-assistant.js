var IndexviewAssistant = Class.create(
{
  	initialize: function(objwAMP) 
	{
		this.objwAMP = objwAMP;
		
		if (objwAMP.bFolderOnly)
		{
			objwAMP.setFolderView(true);
			Mojo.Controller.stageController.swapScene("home", objwAMP);
			objwAMP.strImgPath = "res/fileimg.jpg";
		}
	},

	setup: function()
	{
		
	},
	
	activate: function()
	{

		this.btnPlayAll = new wAMPIndex("res/playallimg.jpg", "idPlayAllIndex", 0, PlayAll, this.objwAMP);
		this.btnAlbumIndex = new wAMPIndex("res/albumimg.jpg", "idAlbumIndex", 73, DrawIndex, this.objwAMP, "album");
		this.btnArtistIndex = new wAMPIndex("res/artistimg.jpg", "idArtistIndex", 146, DrawIndex, this.objwAMP, "artist");
		this.btnTitleIndex = new wAMPIndex("res/titleimg.jpg", "idTitleIndex", 220, DrawIndex, this.objwAMP, "title");
		this.btnGenreIndex = new wAMPIndex("res/genreimg.jpg", "idGenreIndex", 294, DrawIndex, this.objwAMP, "genre");
		this.btnFolderIndex = new wAMPIndex("res/fileimg.jpg", "idFolderIndex", 368, DrawDir, this.objwAMP);		
	
		
		document.addEventListener("mouseout", this.resetButtons.bind(this), false);
	},
	
	deactivate: function(event)
	{
		this.btnPlayAll.CleanUp();
		this.btnAlbumIndex.CleanUp();
		this.btnArtistIndex.CleanUp();
		this.btnFolderIndex.CleanUp();
		this.btnGenreIndex.CleanUp();
		this.btnTitleIndex.CleanUp();
		
		document.removeEventListener("mouseout", this.resetButtons.bind(this), false);
	},
	
	resetButtons: function()
	{
		this.btnPlayAll.resetButton();
		this.btnAlbumIndex.resetButton();
		this.btnArtistIndex.resetButton();
		this.btnFolderIndex.resetButton();
		this.btnGenreIndex.resetButton();
		this.btnTitleIndex.resetButton();
	},
	
	handleCommand: function(event)
	{
		if (this.objwAMP.bHasStartedPlayer)
		{
			Mojo.Controller.stageController.popScenesTo("playsong", this.objwAMP);
		}
		else
		{
			return;
		}
	}
});

function wAMPIndex(strImgPath, strDiv, iTop, funcButtonUp, objwAMP, strSort)
{
	this.iButtonDown = 0;
	this.strDiv = strDiv;
	this.iTop = iTop;
	this.strImgPath = strImgPath;
	
	this.bMouseDownLis = true;
	this.bMouseOutLis = false;
	this.bMouseUpLis = true;
	
	this.bGreyChild = false;
	
	wAMPIndex.prototype.ButtonUp = function()
	{
		if (!(this.bGreyChild))
			return;
	
		if(this.iButtonDown)
		{
			var obj = document.getElementById("delete_" + this.strDivName);
			obj.removeEventListener("mouseout", this.MouseOut.bind(this), false);
			this.bMouseOutLis = false;
			$(this.strDiv).removeChild(obj);
			this.bGreyChild = false;
		
			objwAMP.strImgPath = this.strImgPath;
		
			funcButtonUp(objwAMP, strSort);
		}
		else
		{
			var obj = document.getElementById("delete_" + this.strDivName);
			obj.removeEventListener("mouseout", this.MouseOut.bind(this), false);
			this.bMouseOutLis = false;
			$(this.strDiv).removeChild(obj);
			this.bGreyChild = false;
		}
	};
		
	wAMPIndex.prototype.ButtonDown = function()
	{
		this.iButtonDown = 1;
		
		var add = document.createElement("div");
		add.setAttribute("style","top:" + Number(this.iTop).toString() + "px; left:0px; position:fixed; background-color: #444; opacity: 0.50; height:72px; width:320px; z-index:2;");
		add.id = "delete_" + this.strDivName;
		$(this.strDiv).appendChild(add);
		this.bGreyChild = true;
		
		add.addEventListener("mouseout", this.MouseOut.bind(this), false);
		this.bMouseOutLis = true;
	};
	
	wAMPIndex.prototype.MouseOut = function()
	{
		this.iButtonDown = 0;
		
		if (this.bGreyChild)
		{
			var obj = document.getElementById("delete_" + this.strDivName);
			obj.removeEventListener("mouseout", this.MouseOut.bind(this), false);
			this.bMouseOutLis = false;
			$(this.strDiv).removeChild(obj);
			this.bGreyChild = false;
		}
	};

	wAMPIndex.prototype.resetButton = function()
	{
		if (this.bGreyChild)
		{
			var obj = document.getElementById("delete_" + this.strDivName);
			
			if (this.bMouseOutLis)
			{
				obj.removeEventListener("mouseout", this.MouseOut.bind(this), false);
				this.bMouseOutLis = false;
			}
			
			$(this.strDiv).removeChild(obj);
			this.bGreyChild = false;
		}
	}

	wAMPIndex.prototype.CleanUp = function()
	{
	
		this.resetButton();
		
		$(this.strDiv).removeEventListener("mousedown", this.ButtonDown.bind(this), false);
		$(this.strDiv).removeEventListener("mouseup", this.ButtonUp.bind(this), false);
		
	}


	$(strDiv).addEventListener("mousedown", this.ButtonDown.bind(this), false);
	$(strDiv).addEventListener("mouseup", this.ButtonUp.bind(this), false);
	
}

function DrawIndex(objwAMP, strSortOn)
{
	objwAMP.setFolderView(false);
	objwAMP.SortIndex(strSortOn);
	Mojo.Controller.stageController.pushScene("home",objwAMP);
}

function DrawDir(objwAMP)
{
	objwAMP.setFolderView(true);
	Mojo.Controller.stageController.pushScene("home",objwAMP);
}

function PlayAll(objwAMP)
{
	objwAMP.indexRandomPlay();
	
	objwAMP.iPlayVal = 1;
	
	if (objwAMP.bHasStartedPlayer)
	{
		Mojo.Controller.stageController.popScenesTo("playsong", objwAMP);
	}
	else
	{
		Mojo.Controller.stageController.popScenesTo();
		Mojo.Controller.stageController.swapScene({name: 'playsong', disableSceneScroller: true}, objwAMP);
	}
	
}