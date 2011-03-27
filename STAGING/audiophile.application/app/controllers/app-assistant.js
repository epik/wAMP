function AppAssistant(appController) {
  	console.info("AppAssistant")
  	this.appController = appController;
	objGlobalwAMP = new wAMP();
	objGlobalwAMP.CreatePluginHook();
}

function StageAssistant(stageController) {
  	var queryParams = document.URL.toQueryParams();
    myGlobal = {};
    myGlobal.myranonce = null;
	myGlobal.myprevscene = "home";
  	this.stageController = stageController;
	
	StageAssistant.prototype.setup = function() {
	  // Setup Application Menu with an About entry
	  //
	  newsMenuAttr = {omitDefaultItems: true};
	  newsMenuModel = {
		visible: true,
		items: [
		  {label: "Redo Index", command: 'do-aboutNews'},
		]
	  };
	};

	StageAssistant.prototype.handleCommand = function(event) {
	  var currentScene = this.controller.activeScene();
	  if(event.type == Mojo.Event.command) {
		switch(event.command) {
		  case 'do-aboutNews':
			objGlobalwAMP.clearIndex();
			currentScene.showAlertDialog({
			  onChoose: function(value) {},
			  title: "Redo Index",
			  message: "Next time you run this program it will rerun the indexer.",
			  choices:[
			   {label: "OK", value:""}
			  ]
			});
		  break;
		}
	  }
	};
	
	stageController.window.document.body.appendChild(objGlobalwAMP.df);	
	this.stageController.pushScene("plugload", objGlobalwAMP);
}
