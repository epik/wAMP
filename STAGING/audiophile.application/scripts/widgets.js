/*************************
 NOTE: To ensure all constants are loaded,
	this must be declared after scene.js
**************************/

/*******************************
 * Handy function to get degree from rotation matrix
// Parameter element should be a DOM Element object.
// Returns the rotation of the element in degrees.
*********************************/
function GetRotationDegrees (domElement) 
{
    // get the computed style object for the element
    var style = window.getComputedStyle(domElement);
    // this string will be in the form 'matrix(a, b, c, d, tx, ty)'
    var transformString = style['-webkit-transform']
                       || style['-moz-transform']
                       || style['transform'] ;
    if (!transformString || transformString == 'none')
        return 0;
    var splits = transformString.split(',');
    // parse the string to get a and b
    var a = parseFloat(splits[0].substr(7));
    var b = parseFloat(splits[1]);
    // doing atan2 on b, a will give you the angle in radians
    var rad = Math.atan2(b, a);
    var deg = 180 * rad / Math.PI;
    // instead of having values from -180 to 180, get 0 to 360
    if (deg < 0) deg += 360;
    return deg;
}

/***********************
 * Check if an image exists
 ***********************/
function UrlExists(url)
{
    var http = new XMLHttpRequest();
	try
	{
		http.open('HEAD', url, false);
		http.send();
	}
	catch(e) {console.log(e)};
    return http.status!=404;
}

/*************************
 * Scene Changer Function
 *************************/
 
function ChangePage(jqobjNewPage)
{
	console.log("here");
	jqobjNewPage.trigger("pagebeforeshow");

	jqobjNewPage.show(200);
	$('.classShowPage').trigger('pagehide');
	$('.classShowPage').removeClass('classShowPage');
	setTimeout(function()
	{
		jqobjNewPage.addClass('classShowPage');
		jqobjNewPage.attr("style","");
		jqobjNewPage.trigger('pageshow');
	}, 200);

}

/*************************
 * Visualize spectrum data
 ************************/
function SpectrumVisualizer(jqobjCanvas)
{

	this.canvas = jqobjCanvas.get(0);
	this.ctx = canvas.getContext('2d');
	this.peak = new Array(256);

	this.arraySpecData = "asdfwerttytufgjxcvbdsfgASFDWERTYTUFDGH1234346556781234ADFSWERTFGJHasdfertyfgjhsdfg@$#%#$&^&*@#$%asdfsdgfertycvnghktyieytASDFHDSHQWERYczxXCCZXqwer34252352436346sdfgSGDdsfg%^&#@$%%^*%^*@#$%qwrewtysdfgsfgSFGSFGHDFGXZCVDSFGREY23543575432763464asdfwerttytufgjxcvbdsfgASFDWERTYTUFDGH1234346556781234ADFSWERTFGJHasdfertyfgjhsdfg@$#%#$&^&*@#$%asdfsdgfertycvnghktyieytASDFHDSHQWERYczxXCCZXqwer34252352436346sdfgSGDdsfg%^&#@$%%^*%^*@#$%qwrewtysdfgsfgSFGSFGHDFGXZCVDSFGREY23543575432763464asdfwerttytufgjxcvbdsfgASFDWERTYTUFDGH1234346556781234ADFSWERTFGJHasdfertyfgjhsdfg@$#%#$&^&*@#$%asdfsdgfertycvnghktyieytASDFHDSHQWERYczxXCCZXqwer34252352436346sdfgSGDdsfg%^&#@$%%^*%^*@#$%qwrewtysdfgsfgSFGSFGHDFGXZCVDSFGREY23543575432763464asdfwerttytufgjxcvbdsfgASFDWERTYTUFDGH1234346556781234ADFSWERTFGJHasdfertyfgjhsdfg@$#%#$&^&*@#$%asdfsdgfertycvnghktyieytASDFHDSHQWERYczxXCCZXqwer34252352436346sdfgSGDdsfg%^&#@$%%^*%^*@#$%qwrewtysdfgsfgSFGSFGHDFGXZCVDSFGREY23543575432763464asdfwerttytufgjxcvbdsfgASFDWERTYTUFDGH1234346556781234ADFSWERTFGJHasdfertyfgjhsdfg@$#%#$&^&*@#$%asdfsdgfertycvnghktyieytASDFHDSHQWERYczxXCCZXqwer34252352436346sdfgSGDdsfg%^&#@$%%^*%^*@#$%qwrewtysdfgsfgSFGSFGHDFGXZCVDSFGREY23543575432763464asdfwerttytufgjxcvbdsfgASFDWERTYTUFDGH1234346556781234ADFSWERTFGJHasdfertyfgjhsdfg@$#%#$&^&*@#$%asdfsdgfertycvnghktyieytASDFHDSHQWERYczxXCCZXqwer34252352436346sdfgSGDdsfg%^&#@$%%^*%^*@#$%qwrewtysdfgsfgSFGSFGHDFGXZCVDSFGREY23543575432763464asdfwerttytufgjxcvbdsfgASFDWERTYTUFDGH1234346556781234ADFSWERTFGJHasdfertyfgjhsdfg@$#%#$&^&*@#$%asdfsdgfertycvnghktyieytASDFHDSHQWERYczxXCCZXqwer34252352436346sdfgSGDdsfg%^&#@$%%^*%^*@#$%qwrewtysdfgsfgSFGSFGHDFGXZCVDSFGREY23543575432763464asdfwerttytufgjxcvbdsfgASFDWERTYTUFDGH1234346556781234ADFSWERTFGJHasdfertyfgjhsdfg@$#%#$&^&*@#$%asdfsdgfertycvnghktyieytASDFHDSHQWERYczxXCCZXqwer34252352436346sdfgSGDdsfg%^&#@$%%^*%^*@#$%qwrewtysdfgsfgSFGSFGHDFGXZCVDSFGREY23543575432763464asdfwerttytufgjxcvbdsfgASFDWERTYTUFDGH1234346556781234ADFSWERTFGJHasdfertyfgjhsdfg@$#%#$&^&*@#$%asdfsdgfertycvnghktyieytASDFHDSHQWERYczxXCCZXqwer34252352436346sdfgSGDdsfg%^&#@$%%^*%^*@#$%qwrewtysdfgsfgSFGSFGHDFGXZCVDSFGREY23543575432763464asdfwerttytufgjxcvbdsfgASFDWERTYTUFDGH1234346556781234ADFSWERTFGJHasdfertyfgjhsdfg@$#%#$&^&*@#$%asdfsdgfertycvnghktyieytASDFHDSHQWERYczxXCCZXqwer34252352436346sdfgSGDdsfg%^&#@$%%^*%^*@#$%qwrewtysdfgsfgSFGSFGHDFGXZCVDSFGREY23543575432763464asdfwerttytufgjxcvbdsfgASFDWERTYTUFDGH1234346556781234ADFSWERTFGJHasdfertyfgjhsdfg@$#%#$&^&*@#$%asdfsdgfertycvnghktyieytASDFHDSHQWERYczxXCCZXqwer34252352436346sdfgSGDdsfg%^&#@$%%^*%^*@#$%qwrewtysdfgsfgSFGSFGHDFGXZCVDSFGREY23543575432763464asdfwerttytufgjxcvbdsfgASFDWERTYTUFDGH1234346556781234ADFSWERTFGJHasdfertyfgjhsdfg@$#%#$&^&*@#$%asdfsdgfertycvnghktyieytASDFHDSHQWERYczxXCCZXqwer34252352436346sdfgSGDdsfg%^&#@$%%^*%^*@#$%qwrewtysdfgsfgSFGSFGHDFGXZCVDSFGREY23543575432763464asdfwerttytufgjxcvbdsfgASFDWERTYTUFDGH1234346556781234ADFSWERTFGJHasdfertyfgjhsdfg@$#%#$&^&*@#$%asdfsdgfertycvnghktyieytASDFHDSHQWERYczxXCCZXqwer34252352436346sdfgSGDdsfg%^&#@$%%^*%^*@#$%qwrewtysdfgsfgSFGSFGHDFGXZCVDSFGREY23543575432763464asdfwerttytufgjxcvbdsfgASFDWERTYTUFDGH1234346556781234ADFSWERTFGJHasdfertyfgjhsdfg@$#%#$&^&*@#$%asdfsdgfertycvnghktyieytASDFHDSHQWERYczxXCCZXqwer34252352436346sdfgSGDdsfg%^&#@$%%^*%^*@#$%qwrewtysdfgsfgSFGSFGHDFGXZCVDSFGREY23543575432763464asdfwerttytufgjxcvbdsfgASFDWERTYTUFDGH1234346556781234ADFSWERTFGJHasdfertyfgjhsdfg@$#%#$&^&*@#$%asdfsdgfertycvnghktyieytASDFHDSHQWERYczxXCCZXqwer34252352436346sdfgSGDdsfg%^&#@$%%^*%^*@#$%qwrewtysdfgsfgSFGSFGHDFGXZCVDSFGREY23543575432763464asdfwerttytufgjxcvbdsfgASFDWERTYTUFDGH1234346556781234ADFSWERTFGJHasdfertyfgjhsdfg@$#%#$&^&*@#$%asdfsdgfertycvnghktyieytASDFHDSHQWERYczxXCCZXqwer34252352436346sdfgSGDdsfg%^&#@$%%^*%^*@#$%qwrewtysdfgsfgSFGSFGHDFGXZCVDSFGREY23543575432763464asdfwerttytufgjxcvbdsfgASFDWERTYTUFDGH1234346556781234ADFSWERTFGJHasdfertyfgjhsdfg@$#%#$&^&*@#$%asdfsdgfertycvnghktyieytASDFHDSHQWERYczxXCCZXqwer34252352436346sdfgSGDdsfg%^&#@$%%^*%^*@#$%qwrewtysdfgsfgSFGSFGHDFGXZCVDSFGREY23543575432763464";

	this.iRed = 100;
	this.iGreen = 140;
	this.iBlue = 180;
	
	this.iCount = 0;
	
	SpectrumVisualizer.prototype.Draw = function() 
	{

		// Clear the canvas before drawing spectrum
		this.ctx.clearRect(0,0, canvas.width, canvas.height);

		this.iCount %= this.arraySpecData;
		
		for (var i = 0; i < 100; i++ )
		{
			// multiply spectrum by a zoom value
			var magnitude = this.arraySpecData.charCodeAt(i);
			this.arrayPeak[i] = (this.arrayPeak[i] > magnitude) ?
											(this.arrayPeak[i] - 1) :
											magnitude;
			
			this.iRed += 1;
			this.iGreen += 2;
			this.iBlue += 3;
			
			
			// Draw rectangle bars for each frequency bin
			this.ctx.colorMode(HSB, this.iRed, this.iGreen, this.iBlue);
			this.ctx.fillRect(i * 4, canvas.height, 3, -magnitude);
			
			// Draw rectangle bars for each frequency bin
			this.ctx.colorMode(HSB, this.iBlue, this.iGreen, this.iRed);
			this.ctx.fillRect(i * 4, this.arrayPeak[i], 3, 1);
		}
		
		this.iCount += 100;
	}

}

/*************************
 * Status Pill
 *
 * A bar that shows progress, and displays the string sent to it
 *************************/
var widStatusPill =
{
	iTime: 0,
	bAnimate: true,
	
	iRightStop: 0,
	iLeftStart: 0,
	
	Animate: function()
	{
		this.divPill.get(0).setAttribute("style", "clip: rect(0px " + 
								Number(this.iTime + 100).toString() + 
							  "px 1024px " + 
								Number(this.iTime).toString() + 
							  "px);");

		
		this.iTime += 3;
		
		if (this.iTime >= this.iRightStop)
			this.iTime = -100;
			
		if (this.bAnimate)
			setTimeout(function() {widStatusPill.Animate();}, 100);
	},
	
	Start: function()
	{
		this.bAnimate = true;
		setTimeout(function() {widStatusPill.Animate();}, 100);
	},
	
	Stop: function()
	{
		widStatusPill.bAnimate = false;
	},
	
	Init: function()
	{
		this.divPill = $('#idSplashPill');
		this.DisplayText("Loading....");
		var pos = this.divPill.position();	
		this.iTime = 0;
	},
	
	DisplayText: function(str)
	{
		this.divPill.text(str);
	},
	
	Resize: function()
	{
		var pos = $('#idSplashPill').position();
		this.iRightStop = $('#idSplashPill').width();
	}
	
}


/*************************
 * wAMPIndex
 *
 * Makes the index divs into buttons
 *************************/
function widwAMPIndex(jqobjParent, funcButtonUp)
{
	this.iButtonDown = 0;
	
	this.funcButtonUp = funcButtonUp;
	this.jqobjParent = jqobjParent;
	this.strDivName = this.jqobjParent.attr('id');
	
	this.bMouseDownLis = true;
	this.bMouseOutLis = false;
	this.bMouseUpLis = true;
	
	this.bGreyChild = false;
	
	this.handleEvent = function (e) 
	{ 
	
		if (e.type == START_EV)
		{
			this.ButtonDown(e);
		} 
		else if (e.type == END_EV)
		{
			this.ButtonUp(e);
		}
		else if (e.type == 'mouseout')
		{
			this.MouseOut(e);
		}
	
	}
	
	widwAMPIndex.prototype.ButtonUp = function()
	{
		if(this.iButtonDown)
		{
			var str = "delete_" + this.strDivName;
			this._unbind("mouseout", document.getElementById(str));
			this.bMouseOutLis = false;
			$("#delete_" + this.strDivName).remove();
			this.bGreyChild = false;
			this.funcButtonUp();
		}
		else
		{
			var str = "delete_" + this.strDivName;
			this._unbind("mouseout", document.getElementById(str));
			this.bMouseOutLis = false;
			$("#delete_" + this.strDivName).remove();
			this.bGreyChild = false;
		}
	};
		
	widwAMPIndex.prototype.ButtonDown = function()
	{
		this.iButtonDown = 1;
		
		var add = $("<div />", {
						"id":"delete_" + this.strDivName,
						"class":"classwAMPIndexBtn"
					});
		this.jqobjParent.append(add);
		this.bGreyChild = true;
		
		var str = "delete_" + this.strDivName;
		this._bind("mouseout", document.getElementById(str));
		this.bMouseOutLis = true;
	};
	
	widwAMPIndex.prototype.MouseOut = function()
	{
		this.iButtonDown = 0;
		
		var str = "delete_" + this.strDivName;
		this._unbind("mouseout", document.getElementById(str));
		this.bMouseOutLis = false;
		$("#delete_" + this.strDivName).remove();
		this.bGreyChild = false;
	};

	widwAMPIndex.prototype.resetButton = function()
	{
		if (this.bGreyChild)
		{
			var str = "delete_" + this.strDivName;
			
			if (this.bMouseOutLis)
			{
				this._unbind("mouseout", document.getElementById(str));
			}
			
			$("#delete_" + this.strDivName).remove();
		}
	}

	widwAMPIndex.prototype.CleanUp = function()
	{
	
		this.resetButton();
		
		this._unbind(START_EV);
		this._unbind(END_EV);
		
	}

	widwAMPIndex.prototype._bind = function (type, el)
	{
		if (!(el))
			el = this.jqobjParent.get(0);
		el.addEventListener(type, this, false);
	}

	widwAMPIndex.prototype._unbind = function (type, el)
	{
		if (!(el))
			el = this.jqobjParent.get(0);
		el.removeEventListener(type, this, false);
	}

	this._bind(START_EV);
	this._bind(END_EV);
}

var SCRUB_IN_PROCSS 	= -2;
var SCRUB_NORMAL 		= -1;
var SCRUB_WAIT_FOR_PLUG = -3

var ARM_DEG_FINISH		= 22;
		 		 		 
function MusScrubber()
{
	this.strEndTime = "0:00";
	this.strCurTime = "0:00";
	
	this.jqobjScrubDiv = 0;
	
	this.iEndTimeInSec = 0;
	this.fEndConvertDist = 0;
	this.fDistToSec = 0;
	this.fInvEnd = 0;
	
	this.bScrubInProgress = false;
	
	this.handleEvent = function (e) 
	{ 
		if (e.type == START_EV) 
		{
			this.PickStart(e);
		} 
		else if (e.type == MOVE_EV) 
		{
			this.PickMove(e);
		} 
		else if (e.type == END_EV)
		{
			this.PickStop(e);
		}
		
	},

	MusScrubber.prototype.OrientChange = function()
	{
		this.iWidth = this.jqobjScrubDiv.width();
		this.iLeftCoord = this.jqobjScrubDiv.offset().left;
		this.iInvWidth = 1/this.iWidth;
		this.fDistToSec = this.iEndTimeInSec * this.iInvWidth;
		this.fSecToDist = this.iWidth * this.fInvEnd;
	}
	
	MusScrubber.prototype.SetEndTime = function(iEndTimeInSec)
	{
		try
		{
			if (isNaN(iEndTimeInSec) || (iEndTimeInSec == 0))
			{
				iEndTimeInSec = 0;
				this.fSecToDist = 0;
				this.fInvEnd = 0;
			}
			else
			{
				// create a factor to convert scrubber loc to secs
				this.fInvEnd = 1/iEndTimeInSec;
				this.fSecToDist = this.iWidth * this.fInvEnd;
			}
		
			this.iEndTimeInSec = iEndTimeInSec;
			this.fDistToSec = iEndTimeInSec * this.iInvWidth;
			this.strEndTime = this.ConvertNumSecToString(iEndTimeInSec);
		}
		catch(e)
		{
			console.log(e);
		}
	}
	
	MusScrubber.prototype.CallbackAfterSeek = function(iCurTimeInSec)
	{
		this.bScrubInProgress = 0;
		
		this.iCurTime = iCurTimeInSec;
		this.strCurTime = this.ConvertNumSecToString(iCurTimeInSec);
		this.Draw(iCurTimeInSec * this.fSecToDist );
	}
	
	MusScrubber.prototype.SetCurTime = function(iCurTimeInSec)
	{
		if (!this.bScrubInProgress)
		{
			this.iCurTime = iCurTimeInSec;
			this.strCurTime = this.ConvertNumSecToString(iCurTimeInSec);
			this.Draw(iCurTimeInSec * this.fSecToDist );
		}
	}
	
	MusScrubber.prototype.Draw = function(iTimePos)
	{
		try
		{
			
			this.jqobjScrubDiv.children('.classScrub').attr("style", 
											"clip: rect(0px " + 
											Number(iTimePos).toString() + 
											"px 1024px 0px)");

			var fRotAmt = 22 * this.fInvEnd * this.iCurTime;
											
			$('#btnarm').attr("style", "-webkit-transform: rotate(" + fRotAmt + "deg)");
			
			this.jqobjScrubDiv.children().text(this.strCurTime + "|" + this.strEndTime);
		
		} 
		catch (e) 
		{ 
			//console.log(e); 
			alert(e);
		}
	}
	
	MusScrubber.prototype.Init = function (jqobjDivParent) 
	{
		try
		{	
			this.jqobjScrubDiv = jqobjDivParent;
			this.OrientChange();
						
			this.jqobjScrubDiv.get(0).addEventListener(START_EV, this, false);
			
			this.divNewPop = $('#idScrubPop');
			this.divNewPop.hide();						
			this.iPopUpVisible = false;
			
			
			this.Draw(0);
		}
		catch(e)
		{
			console.log(e);
			//alert(e);
		}
	}
		
	MusScrubber.prototype.ClearPopup = function()
	{
		var that = this;
		clearTimeout(this.timeoutHideNum);
		this.divNewPop.text("Wait...");
		this.divNewPop.show();
	
		this.iCurTime = this.iLastGoodTouchPoint * this.fDistToSec;

		this.bScrubInProgress = 1;
		
		objwAMP.Seek(Math.floor(this.iCurTime), function(iCurTime)
		{
			that.CallbackAfterSeek(iCurTime);
		});
		
		this.timeoutHideNum = setTimeout(function() 
								{
									$('#idScrubPop').hide(400);
								}, 500);
	}
	
	MusScrubber.prototype.PickStart = function(e) 
	{	
		clearTimeout(this.timeoutHideNum);
		var me = this;
		var point = hasTouch ? e.changedTouches[0] : e;
		
		this.bScrubInProgress = 1;

		this.iLastGoodTouchPoint = point.offsetX;
		
		this.iCurTime = point.offsetX * this.fDistToSec;
		
		this.Draw(point.offsetX);
	
		this.divNewPop.text(this.ConvertNumSecToString(this.iCurTime));
		this.divNewPop.show();	
		this.timeoutHideNum = setTimeout(function() {me.ClearPopup();}, 2000);
		
		this.jqobjScrubDiv.get(0).addEventListener(MOVE_EV, this, false);
		this.jqobjScrubDiv.get(0).addEventListener(END_EV, this, false);
	
	}

	MusScrubber.prototype.PickMove = function(e) 
	{	
	
		var point = hasTouch ? e.changedTouches[0] : e;
	
		var domTarget = point.target;
		
		var me = this;
	
		clearTimeout(this.timeoutHideNum);
	
		this.iLastGoodTouchPoint = point.offsetX;
		
		this.iCurTime = point.offsetX * this.fDistToSec;
		
		this.Draw(point.offsetX);
		
		this.divNewPop.text(this.ConvertNumSecToString(this.iCurTime));
		this.divNewPop.show();
		this.timeoutHideNum = setTimeout(function() {me.ClearPopup();}, 2000);
		
	}
	
	MusScrubber.prototype.PickStop = function(e) 
	{
		clearTimeout(this.timeoutHideNum);

		var point = hasTouch ? e.changedTouches[0] : e;
	
		this.jqobjScrubDiv.get(0).removeEventListener(MOVE_EV, this, false);
		this.jqobjScrubDiv.get(0).removeEventListener(END_EV, this, false);
		

		this.iLastGoodTouchPoint = point.offsetX;
		
		this.Draw(this.iLastGoodTouchPoint);
		
		this.ClearPopup();
		
	}

	
	MusScrubber.prototype.ConvertNumSecToString = function(iNumSec)
	{
		var strProgressString;
	
		iNumSec = Math.floor(iNumSec)
	
		if (iNumSec <= 0)
		{
			strProgressString = "0:00";
		}
		else if (iNumSec < 10)
		{
			strProgressString = "0:0"+Number(iNumSec).toString();
		}
		else if (iNumSec < 60)
		{
			strProgressString = "0:"+Number(iNumSec).toString();
		}
		else
		{
			// first get the minutes part of the number without division
			GetMin = iNumSec * .01667;
			strProgressString = Number(Math.floor(GetMin)).toString();
			
			// Now subtract out the number of minute to get seconds
			GetMin = Math.floor(GetMin) * 60;
			GetMin = iNumSec - GetMin;
			
			// now finish the string
			if (GetMin == 60)
			{
				strProgressString = strProgressString + 
									":00";
			}
			else if (GetMin < 10)
			{
				strProgressString = strProgressString + 
									':0' + 
									Number(GetMin).toString();
			}
			else
			{
				strProgressString = strProgressString + 
									':' + 
									Number(GetMin).toString();
			}
		}
		
		return strProgressString;
	}
	
};

var REC_SPIN_STILL = 0;
var REC_SPIN_TOUCH_PAUSE = 1;
var REC_SPIN_ON = 4;


/******************************
 * Record class
 ******************************/
function RecordSpin(jqobjParentDiv)
{
	this.fAngle = 0;
	this.bSpin = REC_SPIN_STILL;
	this.fSecCount = 0;
	this.fLastAngle = 0;
	this.tmoutFinishCircle = 0;
	this.jqobjTargetDiv = jqobjParentDiv.children('.classRecTarget');
	this.jqobjSpinner = jqobjParentDiv.children('.classSpinner');
	this.strBackground = "background-image: url(res/record/spinimg.png);";
	
	this.jqobjTargetDiv.get(0).addEventListener(START_EV, 
													this, 
													false);
	
	this.handleEvent = function (e) 
	{ 
		if (e.type == START_EV) 
		{
			this.RotateStart(e);
		} 
		else if (e.type == MOVE_EV) 
		{
			this.RotateMove(e);
		} 
		else if (e.type == END_EV)
		{
			this.RotateStop(e);
		}
	};
	
	RecordSpin.prototype.RotateStart = function(e) 
	{
		if (this.tmoutFinishCircle)
			clearTimeout(this.tmoutFinishCircle);
	
		this.fAngle = GetRotationDegrees(this.jqobjSpinner.get(0));
		
		this.jqobjSpinner.attr("style", 
								   this.strBackground + 
								   "-webkit-transform:rotate(" + 
										(this.fAngle) + "deg);");
	
		if (this.bSpin == REC_SPIN_ON)
		{
			this.jqobjSpinner.removeClass('classRecordSpin');
			this.bSpin = REC_SPIN_TOUCH_PAUSE;
		}
			
		e.preventDefault();
		
		var startX = e.pageX - this.originX;
		var startY = e.pageY - this.originY;
		
		var fATAN2 = Math.atan2(startY, startX) * 180 * INV_PI;
		
		if (fATAN2 < 0)
			fATAN2 += 360;
				
		this.fLastAngle = fATAN2;
		
		this.jqobjTargetDiv.get(0).addEventListener(MOVE_EV, 
													this, 
													false);
		this.jqobjTargetDiv.get(0).addEventListener(END_EV, 
													this, 
													false);
	
	};
	
	
	RecordSpin.prototype.RotateMove = function(e) 
	{
		var dx = e.pageX - this.originX;
		var dy = e.pageY - this.originY;
		var fATAN2 = Math.atan2(dy, dx) * 180 * INV_PI;
		
		if (fATAN2 < 0)
			fATAN2 += 360;
		
		if (this.fLastAngle < fATAN2)
			this.fAngle += 3.5;
		else
			this.fAngle -= 3.5;	
		
		if (this.fAngle > 360)
			this.fAngle -= 360;
		if (this.fAngle < 0)
			this.fAngle += 360;
		
		this.jqobjSpinner.attr("style", 
								   this.strBackground + 
								   "-webkit-transform:rotate(" + 
										(this.fAngle) + "deg);");
		
		this.fLastAngle = fATAN2;
					
	};
	
	RecordSpin.prototype.RotateStop = function(e) 
	{	
		this.jqobjTargetDiv.get(0).removeEventListener(MOVE_EV, 
													   this, 
													   false);
		this.jqobjTargetDiv.get(0).removeEventListener(END_EV, 
													   this, 
													   false);
		
		if (this.fAngle > 340)
		{
			this.jqobjSpinner.attr("style", 
								   this.strBackground);
			
			if (this.bSpin == REC_SPIN_TOUCH_PAUSE)
			{
				this.jqobjSpinner.addClass('classRecordSpin');
				this.bSpin = REC_SPIN_ON;
			}
			else
				this.bSpin = REC_SPIN_STILL;
							   
		}
		else
		{
			
			if (this.bSpin == REC_SPIN_TOUCH_PAUSE)
			{
				this.bSpin = REC_SPIN_ON;
				this.FinishCircle();
			}
			else
				this.bSpin = REC_SPIN_STILL;

		}
								  
	};

	RecordSpin.prototype.FinishCircle = function()
	{
		if ((this.bSpin == REC_SPIN_TOUCH_PAUSE) ||
			(this.bSpin == REC_SPIN_STILL))
			return;
	
		this.bSpin = REC_SPIN_ON;
	
		var me = this;
		
		this.tmoutFinishCircle = setTimeout(function()
		{
			me.fAngle += 10;
		
			if (me.fAngle >= 360)
			{
				me.jqobjSpinner.attr("style", 
								   me.strBackground);
				me.jqobjSpinner.addClass('classRecordSpin');
			}
			else
			{
				me.jqobjSpinner.attr("style", 
								   me.strBackground + 
								   "-webkit-transform:rotate(" + 
										(me.fAngle) + "deg);");
										
				me.FinishCircle();
			}
		
		}, 55);
	
	};
	
	RecordSpin.prototype.Stop = function()
	{
		this.bSpin = REC_SPIN_STILL;
		if (this.tmoutFinishCircle)
			clearTimeout(this.tmoutFinishCircle);
	
		this.fAngle = GetRotationDegrees(this.jqobjSpinner.get(0));
		
		this.jqobjSpinner.removeClass('classRecordSpin');
		
		this.jqobjSpinner.attr("style", 
								   this.strBackground + 
								   "-webkit-transform:rotate(" + 
										(this.fAngle) + "deg);");
	}
	
	RecordSpin.prototype.Start = function()
	{
		this.bSpin = REC_SPIN_ON;
	
		if ((this.fAngle != 0) && (this.fAngle < 340))
		{
			this.FinishCircle();
		}
		else
		{
			this.jqobjSpinner.addClass('classRecordSpin');
		}
	}

	RecordSpin.prototype.Init = function()
	{
		this.jqobjSpinner.attr("style", 
								   this.strBackground);
		var pos = this.jqobjSpinner.offset();
	
		this.originX = pos.left + this.jqobjSpinner.width()/2;
		this.originY = pos.top + this.jqobjSpinner.height()/2;
	};

	RecordSpin.prototype.AddImage = function(strArtist, strAlbum)
	{	
		this.CheckLastFM(strArtist, strAlbum);
	}

	RecordSpin.prototype.AddImageCallBack = function(data)
	{
		var strImgPath = data;
		var me = this;
		
		console.log(strImgPath);
		
		if (!(strImgPath) || (strImgPath == ""))
		{
			this.strBackground = "";
		}
		else
		{
			if (UrlExists(strImgPath))
			{
				//file exists
				console.log("All Good with spin img.");
				me.strBackground = "background-image: url(" + 
							 strImgPath + 
							 ");";
			}
			else
			{
				//file not exists
				console.log("Issue with the Ajax");
				me.strBackground = "";
			}
		}
		this.jqobjSpinner.attr("style", 
								   this.strBackground);
		
		this.jqobjSpinner.addClass('classRecordSpin');
	}


	RecordSpin.prototype.CheckLastFM = function(strArtist, strAlbum)
	{	
		this.jqobjSpinner.removeClass('classRecordSpin');
	
		if ((!strArtist) || (!strAlbum))
		{
			console.log("Bad data to Last.fm");
			me.AddImageCallBack("");
			return;
		}
	
		var me = this;
	
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
						console.log("Callback returned");
						me.AddImageCallBack(data.album.image[1]["#text"]);
					}.bind(this), 
					error: function(code, message){
						console.log("Nope" + message);
						me.AddImageCallBack("");
					}.bind(this)
				});

	}
}