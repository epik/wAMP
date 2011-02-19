function AppAssistant(appController) {
  	console.info("AppAssistant")
  	this.appController = appController;
}

function StageAssistant(stageController) {
  	var queryParams = document.URL.toQueryParams();
    myGlobal = {};
    myGlobal.myranonce = null;
	myGlobal.myprevscene = "home";
  	this.stageController = stageController;
	this.stageController.pushScene("home", new wAMP());
}

