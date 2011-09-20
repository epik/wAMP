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


/*************************
 * Status Pill
 *
 * A bar that shows progress, and displays the string sent to it
 *************************/
var StatusPill =
{
	iTime: 0,
	bAnimate: true,
	tmoutAnim: 0,
	
	iRightStop: 0,
	iLeftStart: 0,
	
	Animate: function()
	{
		this.divPill.style.cssText =  "clip: rect(0px " + 
								Number(this.iTime + 100).toString() + 
							  "px 1024px " + 
								Number(this.iTime).toString() + 
							  "px);";

		
		this.iTime += 3;
		
		if (this.iTime >= this.iRightStop)
			this.iTime = -100;
			
		if (this.bAnimate)
		{
			this.tmoutAnim = setTimeout(function() {StatusPill.Animate();}, 100);
		}
	},
	
	Init: function()
	{
		this.divPill = document.getElementById('idSplashPill');
		this.DisplayText(objwAMP.StatusString);
		this.iTime = 0;
	},
	
	Start: function()
	{
		this.bAnimate = true;
		setTimeout(function() {StatusPill.Animate();}, 100);
	},
	
	FindingMode: function(iSongFound, iPLFound)
	{		
		this.divPill.innerHTML = "Finding Files: Found " + iSongFound + 
							" Music Files : " + iPLFound + " Playlists";
	},
	
	ProcessMode: function(iPos, iTot, strPath)
	{		
		this.divPill.innerHTML = "Getting Metadata: " + iPos + "/" + iTot + " " + strPath;
	},
	
	Stop: function()
	{
		this.bAnimate = false;
		clearTimeout(this.tmoutAnim);
	},
	
	DisplayText: function(str)
	{
		this.divPill.innerHTML = str;
	},
	
	Resize: function()
	{
		this.iRightStop = this.divPill.clientWidth;
	},
	
	CleanUp: function()
	{
	}
}


/*************************
 * wAMPIndex
 *
 * Makes the index divs into buttons
 *************************/
/*************************
 * wAMPIndex
 *
 * Makes the index divs into buttons
 *************************/
function wAMPIndex(domParent, funcButtonDwn)
{
	this.funcButtonDwn = funcButtonDwn;
	this.domParent = domParent;
	
	this.handleEvent = function (e) 
	{ 
		if (e.type == START_EV)
		{
			this.ButtonDown(e);
		} 	
	}
		
	wAMPIndex.prototype.ButtonDown = function(e)
	{
		this.funcButtonDwn(e);
	};
	
	wAMPIndex.prototype.CleanUp = function()
	{
		this._unbind(START_EV);
	}

	wAMPIndex.prototype._bind = function (type, el)
	{
		if (!(el))
			el = this.domParent;
		el.addEventListener(type, this, false);
	}

	wAMPIndex.prototype._unbind = function (type, el)
	{
		if (!(el))
			el = this.domParent;
		el.removeEventListener(type, this, false);
	}

	this._bind(START_EV);
}


/*******************************************************
 * Scrubber control
 *******************************************************/
var ARM_DEG_FINISH		= 22;
		 		 		 
function MusScrubber()
{
	this.strEndTime = "0:00";
	this.strCurTime = "0:00";
	
	this.domScrubDiv = 0;
	this.domScrubFill = 0;
	this.domScrubEmpt = 0;
	
	this.iEndTimeInSec = 0;
	this.fEndConvertDist = 0;
	this.fDistToSec = 0;
	this.fInvEnd = 0;
	this.iTickInProgress = -999;
	
	this.iLowCue = 0;
	
	this.iHighCue = 999999;
	
	this.arrayCue = new Array();
	
	this.domArm = 0;
	
	this.iCueCount = 0;
	
	this.bScrubInProgress = false;
	
	this.handleEvent = function (e) 
	{ 
		if (e.type == START_EV) 
		{
			if (e.target && 
				e.target.className &&
				!e.target.className.indexOf('classCue'))
			{
				this.HandleCue(Number(e.target.id.substr(6)));
			}
			else
			{
				this.PickStart(e);
			}
		} 
		else if (e.type == MOVE_EV) 
		{
			this.PickMove(e);
		} 
		else if (e.type == END_EV)
		{
			this.PickStop(e);
		}
		
	}

	MusScrubber.prototype.AddCue = function()
	{
		var i = 0;
		
		var obj = new Object();
		obj.iCueTime = this.iCurTime;
		obj.iID = this.iCueCount++;
		
		while (i < this.arrayCue.length)
		{
			if (this.arrayCue[i] > obj.iCueTime)
			{
				break;
			}
			
			i++;
		}
		
		if (i == 0)
			this.arrayCue.unshift(obj);
		else if (i >= this.arrayCue.length)
			this.arrayCue.push(obj);
		else
		{
			this.arrayCue.splice(i-1,
								 0,
								 obj);
		}
		
		var iLeftPos = this.iCurTime *this.fSecToDist;
		
		var cue = document.createElement('DIV');
		cue.id = 'idCue_' + obj.iID;
		cue.className = 'classCueTarget';
		cue.style.left = iLeftPos + "px";
		
		cue.innerHTML = '<div id="idCup_' + 
						   obj.iID + 
						   '" style="left:9px;" class="classCuePnt"></div>';
		
		this.domScrubDiv.appendChild(cue);
		
	}

	MusScrubber.prototype.HandleCue = function(iId)
	{
		this.RemoveCue(iId);
	}
	
	MusScrubber.prototype.RemoveCue = function(iId)
	{
		var cue = document.getElementById('idCue_' + iId);
		
		this.domScrubDiv.removeChild(cue);
		
		var i = 0;
		while (i < this.arrayCue.length)
		{
			if (this.arrayCue[i].iID == iId)
			{
				this.arrayCue.splice(i,1);
				break;
			}
			i++;
		}
	}
	
	MusScrubber.prototype.ClearCues = function()
	{
		if (!this.domScrubDiv)
			return;
		
		var arrayCueDoms = this.domScrubDiv.getElementsByClassName('classCueTarget');
		
		if (!arrayCueDoms)
			return;
		
		var i = arrayCueDoms.length;
		while (i--)
			this.domScrubDiv.removeChild(arrayCueDoms[i]);
		
		this.arrayCue = new Array();
	}
	
	MusScrubber.prototype.PrepCue = function()
	{
		this.iLowCue = 0;
		this.iHighCue = 999999;
		
		if (!this.arrayCue.length)
		{
			return;
		}
		else
		{
			var i = 0;
			while ((i<this.arrayCue.length) &&
				   (this.arrayCue[i].iCueTime < this.iCurTime))
			{
				i++;
			}
		
			if (i == 0)
				this.iHighCue = this.arrayCue[i].iCueTime;
			else if (i == this.arrayCue.length)
				this.iLowCue = this.arrayCue[i-1].iCueTime;
			else
			{
				this.iHighCue = this.arrayCue[i].iCueTime;
				this.iLowCue = this.arrayCue[i-1].iCueTime;
			}
			
		}
	}

	MusScrubber.prototype.OrientChange = function()
	{	
		this.iWidth = this.domScrubDiv.offsetWidth;
		this.iLeftCoord = DomOffsetLeftCalc(this.domScrubDiv);
		this.iInvWidth = 1/this.iWidth;
		this.fDistToSec = this.iEndTimeInSec * this.iInvWidth;
		this.fSecToDist = this.iWidth * this.fInvEnd;
	}
	
	MusScrubber.prototype.SetEndTime = function(iEndTimeInSec)
	{
			if (iEndTimeInSec == this.iEndTimeInSec)
				return;
			
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
		
		//this.bScrubInProgress = 0;
	}
	
	MusScrubber.prototype.CallbackAfterSeek = function(iCurTimeInSec)
	{
		this.bScrubInProgress = 0;
		
		if (iCurTimeInSec < 0)
			iCurTimeInSec = 0;
		else if (iCurTimeInSec > this.iEndTimeInSec)
			iCurTimeInSec = this.iEndTimeInSec;
		
		this.iCurTime = iCurTimeInSec;
		this.strCurTime = this.ConvertNumSecToString(iCurTimeInSec);
		this.Draw(iCurTimeInSec * this.fSecToDist );
	}
	
	MusScrubber.prototype.SetCurTime = function(iCurTimeInSec)
	{
		if (!this.bScrubInProgress)
		{
			if (iCurTimeInSec < 0)
				iCurTimeInSec = 0;
			else if (iCurTimeInSec > this.iEndTimeInSec)
				iCurTimeInSec = this.iEndTimeInSec;
			this.iCurTime = iCurTimeInSec;
			this.strCurTime = this.ConvertNumSecToString(iCurTimeInSec);
			this.Draw(iCurTimeInSec * this.fSecToDist );
		}
	}
	
	MusScrubber.prototype.SetBPM = function(iBPM)
	{
		this.iBPM = iBPM;
	}
	
	MusScrubber.prototype.Draw = function(iTimePos)
	{

			this.domScrubFill.style.cssText = "clip: rect(0px " + 
											Number(iTimePos).toString() + 
											"px 1024px 0px)";
		
			var fRotAmt = 22 * this.fInvEnd * this.iCurTime;
											
			this.domArm.style.webkitTransform = "rotate(" + fRotAmt + "deg)";
			
			this.domScrubFill.innerHTML =
						this.domScrubEmpt.innerHTML = this.strCurTime + 
																	"|" + 
																	this.strEndTime +
																	" &nbsp; BPM: " + 
														(this.iBPM ? 
															this.iBPM : "Please Wait");
	}
	
	MusScrubber.prototype.Init = function (domDivParent, 
										   domPopUp,
										   domArm,
										   iTrack) 
	{
		try
		{	
			this.iTrack = iTrack;
		
			this.domArm = domArm;
			this.domScrubDiv = domDivParent;
			this.domScrubFill = 
						domDivParent.getElementsByClassName('classScrub')[0];
			this.domScrubEmpt = 
						domDivParent.getElementsByClassName('classScrubOp')[0];
			this.OrientChange();
						
			this.domScrubDiv.addEventListener(START_EV, 
													   this, 
													   false);
			
			this.divNewPop = domPopUp;
			this.divNewPop.className = 'classHideScrubPop';						
			this.iPopUpVisible = false;
			
			
			this.Draw(0);
		}
		catch(e)
		{
			console.log(e);
		}
	}
		
	MusScrubber.prototype.ClearPopup = function()
	{
		var me = this;
		clearTimeout(this.timeoutHideNum);
		this.divNewPop.innerHTML = "Wait...";
		this.divNewPop.className = '';
	
		this.iCurTime = this.iLastGoodTouchPoint * this.fDistToSec;

		this.bScrubInProgress = 1;
		
		objwAMP.Seek((0 | this.iCurTime), function(iCurTime, iTrack)
		{
			me.CallbackAfterSeek(iCurTime, iTrack);
		}, me.iTrack);
		
		this.timeoutHideNum = setTimeout(function() 
								{
									me.divNewPop.className = 'classHideScrubPop';
								}, 500);
	}
	
	MusScrubber.prototype.PickStart = function(e) 
	{	
		clearTimeout(this.timeoutHideNum);
		var me = this;
		var point = hasTouch ? e.changedTouches[0] : e;
		
		var offsetX = point.pageX - this.iLeftCoord;
		
		this.bScrubInProgress = 1;
			
		this.iLastGoodTouchPoint = offsetX;
		
		
		this.iCurTime = offsetX * this.fDistToSec;
		
		this.Draw(offsetX);
	
		this.divNewPop.innerHTML = this.ConvertNumSecToString(this.iCurTime);
		this.divNewPop.className = '';	
		this.timeoutHideNum = setTimeout(function() {me.ClearPopup();}, 2000);
		
		this.domScrubDiv.addEventListener(MOVE_EV, this, false);
		this.domScrubDiv.addEventListener(END_EV, this, false);
	
	}

	MusScrubber.prototype.PickMove = function(e) 
	{	
	
		var point = hasTouch ? e.changedTouches[0] : e;
		
		var offsetX = point.pageX - this.iLeftCoord;
		
		if (offsetX > this.iWidth)
			offsetX = this.iWidth;
		
		var me = this;
	
		clearTimeout(this.timeoutHideNum);
	
		this.iLastGoodTouchPoint = offsetX;
		
		this.iCurTime = offsetX * this.fDistToSec;
		
		this.Draw(offsetX);
		
		this.divNewPop.innerHTML = this.ConvertNumSecToString(this.iCurTime);
		this.divNewPop.className = '';
		this.timeoutHideNum = setTimeout(function() {me.ClearPopup();}, 2000);
		
	}
	
	MusScrubber.prototype.PickStop = function(e) 
	{
		clearTimeout(this.timeoutHideNum);

		var point = hasTouch ? e.changedTouches[0] : e;
	
		var offsetX = point.pageX - this.iLeftCoord;
	
		this.domScrubDiv.removeEventListener(MOVE_EV, this, false);
		this.domScrubDiv.removeEventListener(END_EV, this, false);
		

		this.iLastGoodTouchPoint = offsetX;
		
		this.Draw(this.iLastGoodTouchPoint);
		
		this.ClearPopup();
		
	}


	MusScrubber.prototype.TickBack = function()
	{
		clearTimeout(this.timeoutHideNum);
		var me = this;
		
		if (this.iTickInProgress == -999)
			this.iTickInProgress = this.iCurTime-1;
		else
			this.iTickInProgress--;
		
		this.iTickInProgress = Math.max(this.iLowCue,
									this.iTickInProgress);
		
		if (this.iTickInProgress < 0)
			this.iTickInProgress = 0;
				
		this.divNewPop.innerHTML = this.ConvertNumSecToString(this.iTickInProgress);
		this.divNewPop.className = '';
		this.timeoutHideNum = setTimeout(function() 
		{
			me.divNewPop.innerHTML = "Wait...";
			objwAMP.Seek(me.iTickInProgress, function(iCurTime, iTrack)
			{
				me.SetCurTime(iCurTime);
				me.iTickInProgress = -999;
				me.divNewPop.className = 'classHideScrubPop';
			}, me.iTrack);
		}, 5000);
	}

	MusScrubber.prototype.TickNeutral = function()
	{
		clearTimeout(this.timeoutHideNum);
		var me = this;
		
		if (this.iTickInProgress == -999)
			this.iTickInProgress = this.iCurTime;
				
		this.divNewPop.innerHTML = this.ConvertNumSecToString(this.iTickInProgress);
		this.divNewPop.className = '';
		this.timeoutHideNum = setTimeout(function() 
		{
			me.divNewPop.innerHTML = "Wait...";
			objwAMP.Seek(me.iTickInProgress, function(iCurTime, iTrack)
			{
				me.SetCurTime(iCurTime);
				me.iTickInProgress = -999;
				me.divNewPop.className = 'classHideScrubPop';
			}, me.iTrack);
		}, 5000);
	
	}
	
	MusScrubber.prototype.TickForward = function()
	{
		clearTimeout(this.timeoutHideNum);
		var me = this;
		
		if (this.iTickInProgress == -999)
			this.iTickInProgress = this.iCurTime+1;
		else
			this.iTickInProgress++;
		
		this.iTickInProgress = Math.min(this.iHighCue,
									this.iTickInProgress);
		
		if (this.iTickInProgress > this.iEndTimeInSec-1)
			this.iTickInProgress = this.iEndTimeInSec-1;
		
		this.divNewPop.innerHTML = this.ConvertNumSecToString(this.iTickInProgress);
		this.divNewPop.className = '';
		this.timeoutHideNum = setTimeout(function() 
		{
			me.divNewPop.innerHTML = "Wait...";
			objwAMP.Seek(me.iTickInProgress, function(iCurTime, iTrack)
			{
				me.SetCurTime(iCurTime);
				me.iTickInProgress = -999;
				me.divNewPop.className = 'classHideScrubPop';	
			}, me.iTrack);
		}, 5000);
	}
	
	MusScrubber.prototype.TickForce = function()
	{
		var me = this;
	
		clearTimeout(this.timeoutHideNum);
		this.divNewPop.innerHTML = "Wait...";
		objwAMP.Seek(me.iTickInProgress, function(iCurTime, iTrack)
		{
			me.SetCurTime(iCurTime);
			me.iTickInProgress = -999;
			me.divNewPop.className = 'classHideScrubPop';	
		}, me.iTrack);
	}
	
	MusScrubber.prototype.ConvertNumSecToString = function(iNumSec)
	{
		var strProgressString;
	
		iNumSec = (0 | iNumSec);
	
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
			GetMin = (iNumSec * .01667) | 0;
			strProgressString = Number(GetMin).toString();
			
			// Now subtract out the number of minute to get seconds
			GetMin *= 60;
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
function RecordSpin(domParentDiv)
{
	this.fAngle = 0;
	this.bSpin = REC_SPIN_STILL;
	this.fSecCount = 0;
	this.fLastAngle = 0;
	this.tmoutFinishCircle = 0;
	this.domTargetDiv = 
					domParentDiv.getElementsByClassName('classRecTarget')[0];
	this.domSpinner = domParentDiv.getElementsByClassName('classSpinner')[0];
	this.strBackground = "";
	
	this.objScrub = 0;
	
	this.domTargetDiv.addEventListener(START_EV, this, false);
	
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
	
		var pos = DomOffsetCalc(this.domSpinner, paneScrub.iPortULReference);
		this.originX = pos.left + this.domSpinner.offsetWidth/2;
		this.originY = pos.top + this.domSpinner.offsetHeight/2;
	
		this.objScrub.TickNeutral();
	
		var point = hasTouch ? e.changedTouches[0] : e;
	
		this.fAngle = GetRotationDegrees(this.domSpinner);
		
		this.domSpinner.style.webkitTransform = "rotate(" + 
										(this.fAngle) + "deg)";
	
		if (this.bSpin == REC_SPIN_ON)
		{
			this.domSpinner.className = 
						this.domSpinner.className.replace(' classRecordSpin',
														  '');
			this.bSpin = REC_SPIN_TOUCH_PAUSE;
		}
			
		e.preventDefault();
		
		var startX = point.pageX - this.originX;
		var startY = point.pageY - this.originY;
		
		var fATAN2 = Math.atan2(startY, startX) * 180 * INV_PI;
		
		if (fATAN2 < 0)
			fATAN2 += 360;
				
		this.fLastAngle = fATAN2;
		
		this.domTargetDiv.addEventListener(MOVE_EV,	this, false);
		this.domTargetDiv.addEventListener(END_EV, this, false);
	
		if (this.objScrub)
			this.objScrub.PrepCue();
	};
	
	
	RecordSpin.prototype.RotateMove = function(e) 
	{
		var point = hasTouch ? e.changedTouches[0] : e;
	
		var dx = point.pageX - this.originX;
		var dy = point.pageY - this.originY;
		var fATAN2 = Math.atan2(dy, dx) * 180 * INV_PI;
		
		if (fATAN2 < 0)
			fATAN2 += 360;
		
		if (this.fLastAngle < fATAN2)
		{
			if (this.objScrub)
				this.objScrub.TickForward();
			
			this.fAngle += 5;
		}
		else
		{
			if (this.objScrub)
				this.objScrub.TickBack();
		
			this.fAngle -= 5;	
		}
		
		if (this.fAngle > 360)
			this.fAngle -= 360;
		if (this.fAngle < 0)
			this.fAngle += 360;
		
		this.domSpinner.style.webkitTransform = "rotate(" + 
										(this.fAngle) + "deg)";
		
		this.fLastAngle = fATAN2;
					
	};
	
	RecordSpin.prototype.RotateStop = function(e) 
	{	
		this.domTargetDiv.removeEventListener(MOVE_EV, this, false);
		this.domTargetDiv.removeEventListener(END_EV, this, false);
		
		this.objScrub.TickForce();
		
		if (this.fAngle > 340)
		{
			this.domSpinner.style.webkitTransform = "";
			
			if (this.bSpin == REC_SPIN_TOUCH_PAUSE)
			{
				this.domSpinner.className += ' classRecordSpin';
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
				me.domSpinner.style.webkitTransform = "";
				me.domSpinner.className += ' classRecordSpin';
			}
			else
			{										
				me.domSpinner.style.webkitTransform = "rotate(" + 
										(me.fAngle) + "deg)";
										
				me.FinishCircle();
			}
		
		}, 55);
	
	};
	
	RecordSpin.prototype.QuickStop = function()
	{
		this.bSpin = REC_SPIN_STILL;
		clearTimeout(this.tmoutFinishCircle);
		this.domSpinner.className = 
						this.domSpinner.className.replace(' classRecordSpin',
														  '');
	};
	
	RecordSpin.prototype.Stop = function()
	{
		this.bSpin = REC_SPIN_STILL;
		if (this.tmoutFinishCircle)
			clearTimeout(this.tmoutFinishCircle);
	
		this.fAngle = GetRotationDegrees(this.domSpinner);
		
		this.domSpinner.className = 
						this.domSpinner.className.replace(' classRecordSpin',
														  '');
		
		this.domSpinner.style.webkitTransform = "rotate(" + 
										(this.fAngle) + "deg)";
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
			this.domSpinner.className += ' classRecordSpin';
		}
	}

	RecordSpin.prototype.Init = function(objScrub)
	{
		this.objScrub = objScrub;
	};

	RecordSpin.prototype.AddImage = function(strBackgroundPath)
	{	
		console.log(strBackgroundPath);
		this.domSpinner.style.backgroundImage = 'url("'+strBackgroundPath+'")';
	}
}

var PI = 3.14159265;

function PalmKnobControl(fStart)
{
	this.angle = 0;
	this.startAngle = 0;

	this.iLocked = 0;
	
	this.funcCallback = null;
	this.originX = 0;
	this.originY = 0;

	this.width = 0;
	
	this.iRotateDeg = fStart;
	
	this.domDivWrapper = 0;
	this.domDivot = 0;
	this.divTarget = 0;
	
	this.handleEvent = function (e) 
	{ 
		if (e.type == START_EV) 
		{
			this.rotateStart(e);
		} 
		else if (e.type == MOVE_EV) 
		{
			this.rotateMove(e);
		} 
		else if (e.type == END_EV)
		{
			this.rotateStop(e);
		}
	};
	
	this.init = function(iLeftCoord, 
						 iTopCoord, 
						 iSize, 
						 strDivParent, 
						 funcCallBack, 
						 strLabelText,
						 strLeftColor,
						 strRightClor)
	{

		this.funcCallBack = funcCallBack;
		
		var divParent = document.getElementById(strDivParent);
		
		this.width = iSize;
		
		var divWrapper = document.createElement("div");
		divWrapper.className = "rotateableparent";
		divWrapper.style.cssText = "top:" + Number(iTopCoord).toString() + "px; left:" +
							Number(iLeftCoord).toString() + "px; " +
							"height:" +
							Number(iSize).toString() + "px; width:" +
							Number(iSize).toString() + "px; ";
		
		var divLabel = document.createElement("div");
		divLabel.className = "rotateablelbl";
		divLabel.innerHTML = strLabelText;
		divWrapper.appendChild(divLabel); 
		
		this.divTarget = document.createElement("div");
		this.divTarget.className = "rotateabletarget";
		this.divTarget = divWrapper.appendChild(this.divTarget); 
		
		var divDisplay = document.createElement("div");
		divDisplay.className = "rotateabledisplay";
		divDisplay.style.cssText = "height:" +
							Number(iSize).toString() + "px; width:" +
							Number(iSize).toString() + "px; ";
		var imgDisplay = document.createElement("img");
		imgDisplay.src = "res/knob/display.png";
		imgDisplay.className = "rotateabledisplay";
		imgDisplay.style.height = Number(iSize).toString() + "px";
		imgDisplay.style.width = Number(iSize).toString() + "px";
		divDisplay.appendChild(imgDisplay);
		divWrapper.appendChild(divDisplay); 
			
		this.domDivot = document.createElement("div");
		this.domDivot.className = "rotateablefront";
		
		var imgDot = document.createElement("img");
		imgDot.setAttribute("height", "20px");
		imgDot.setAttribute("width", "20px");
		imgDot.setAttribute("src", "res/knob/divot.png");
		imgDot.setAttribute("style", 'position: relative; ' +
								'left: -10px; ' +
								'top: -10px; '
							);
							
		this.domDivot.appendChild(imgDot);
		this.domDivot = divWrapper.appendChild(this.domDivot);						
		 
		this.divTarget.addEventListener(START_EV, this, false);
		
		this.domDivWrapper = divParent.appendChild(divWrapper);
		
		this.angle = this.convertAndDraw(this.iRotateDeg);
	};
	
	this.uninit = function()
	{
		this.divTarget.removeEventListener(START_EV, this, false);
	};
	
	
	this.rotateStart = function(e) 
	{
		var point = hasTouch ? e.changedTouches[0] : e;
	
		var pos = DomOffsetCalc(this.domDivWrapper);
		var iSize = this.domDivWrapper.offsetWidth;
	
		this.originX = iSize/2 + pos.left;
		this.originY = iSize/2 + pos.top;
	
		if (this.active)
			this.rotateStop();
		
		this.active = 1;
	
		e.preventDefault();
		
		var startX = point.pageX - this.originX;
		var startY = point.pageY - this.originY;
		
		var fATAN2 = Math.atan2(startY, startX)* 180 * INV_PI;
		
		if (fATAN2 < 0)
			fATAN2 += 360;
		
		this.startAngle = this.angle;
		
		this.fLastAngle = fATAN2 - this.angle;
		
		this.divTarget.addEventListener(MOVE_EV, this, false);
		this.divTarget.addEventListener(END_EV, this, false);
	
	};
	
	
	this.rotateMove = function(e) 
	{
		var point = hasTouch ? e.changedTouches[0] : e;
	
		var dx = point.pageX - this.originX;
		var dy = point.pageY - this.originY;
		var fATAN2 = Math.atan2(dy, dx) * 180 * INV_PI;
		
		if (fATAN2 < 0)
			fATAN2 += 360;
		
		if (this.fLastAngle < fATAN2)
			this.angle+= 6;
		else
			this.angle -= 6;
		
		this.angle %= 360;
	
		
		this.fLastAngle = fATAN2;

		this.strDebug;
		
		if (this.angle < 0)
			this.angle += 360;
			
		if (this.angle > 180)
		{
			if (this.angle < 225)
			{
				this.angle = 225;
				this.fLastATAN2 = fATAN2;
				this.iLocked = -1;
			}
		}
		else if (this.angle > 135)
		{
			this.angle = 135;
			this.fLastATAN2 = fATAN2;
			this.iLocked = 1;
		}
		
		this.rotateProtected(this.angle);
		this.convertAndReturn();
					
	};
	
	this.rotateStop = function(e) 
	{
		this.active = 0;
		
		if (Math.abs(this.startAngle - this.angle) > 10)
		{
			if (this.angle < 20)
			{
				this.angle = 0;
				
				this.rotateProtected(this.angle);
			}
			else if (this.angle > 340)
			{
				this.angle = 360;
				
				this.rotateProtected(this.angle);
					
				this.angle = 0;
			}
		
		}
	
		this.divTarget.removeEventListener(MOVE_EV, this, false);
		this.divTarget.removeEventListener(END_EV, this, false);
		
		this.convertAndReturn();
		
	};
	
	var INV_180 = 1/180;
	
	this.rotateProtected = function(fDeg)
	{
		this.domDivot.style.top = 
					(this.width/2 - 
							Math.cos( -PI * fDeg * INV_180) * this.width * 0.15)  
					+ "px";
		this.domDivot.style.left = 
					(this.width/2 - 
							Math.sin( -PI * fDeg * INV_180) * this.width * 0.15)
					+ "px";			
	}
	
	this.GetVal = function()
	{
		var fRetVal;
	
		if (this.angle < 224)
		{
			fRetVal = 0.5 + (this.angle * .0037037);
			if (fRetVal > 0.99999) fRetVal = 1.0;
		}
		else
		{
			fRetVal = (this.angle - 225) * .0037037;
		}
		
		return fRetVal;
	}
	
	this.convertAndReturn = function()
	{
		var fRetVal;
		
		if (this.angle < 224)
		{
			fRetVal = 0.5 + (this.angle * .0037037);
			if (fRetVal > 0.99999) fRetVal = 1.0;
		}
		else
		{
			fRetVal = (this.angle - 225) * .0037037;
		}
	
		this.funcCallBack(fRetVal);
	};
	
	this.RestoreVal = function(fVal)
	{
		this.iRotateDeg = fVal;
		this.angle = this.convertAndDraw(fVal);
	}
	
	this.convertAndDraw = function(fVal)
	{		
		if (fVal < 0.5)
		{
			fVal = (fVal * 135 * 2) + 225;
		}
		else
		{
			fVal = (fVal - 0.5) * 2 * 135;
		}
		
		this.rotateProtected(fVal);
		return fVal;
	}
	
};
