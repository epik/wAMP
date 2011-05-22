/*************************
 * Scene Changer Function
 *************************/
 var SLIDE_DOWN = 0;
 
 
function ChangePage(jqobjNewPage, iAnimationType)
{
	console.log("here");
	jqobjNewPage.trigger("pagebeforeshow");

	jqobjNewPage.show(200);
	setTimeout(function()
	{
		$('.classShowPage').trigger('pagehide');
		$('.classShowPage').removeClass('classShowPage');
		jqobjNewPage.addClass('classShowPage');
		jqobjNewPage.attr("style","");
		jqobjNewPage.trigger('pageshow');
	}, 200);

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
	
	this.iEndTime = 0;
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
		
			this.iEndTime = iEndTimeInSec;
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
		console.log(this.fDistToSec);
	
		clearTimeout(this.timeoutHideNum);
		var me = this;
		var point = hasTouch ? e.changedTouches[0] : e;
		
		console.log(point.offsetX);
		
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