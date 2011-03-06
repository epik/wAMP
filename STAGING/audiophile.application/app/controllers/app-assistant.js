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
	
	stageController.window.document.body.appendChild(objGlobalwAMP.df);
	this.stageController.pushScene("plugload", objGlobalwAMP);
}
