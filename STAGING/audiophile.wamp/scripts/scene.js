/* FOR DEBUGGING On the device PUT THE FOLLOWING INTO WINDOWS COMMAND PROMPT...
palm-log -d usb --system-log-level=info
palm-log -f -d usb com.epik.audiophilehd

For debugging from putty:
tail -f /var/log/messages
*/ 

var PRO_MODE = ADVANCE_OPT;

var hasTouch = 'ontouchstart' in window;
var START_EV = hasTouch ? 'touchstart' : 'mousedown';
var MOVE_EV = hasTouch ? 'touchmove' : 'mousemove';
var END_EV = hasTouch ? 'touchend' : 'mouseup';
var CLICK_EV = 'click';
var TRANS_END = 'webkitTransitionEnd';
var STATE_WAIT_PERIOD = 300;

var INV_PI = 1/3.14159265;
var PI = 3.14159265;
var QUARTER_PI = PI * 0.25;
var THREE_QUARTER_PI = PI * 0.75;
var HALF_PI = PI * 0.5;

var PLAYER_PAUSED_STATE = 0;
var PLAYER_PLAY_STATE = 1;

var VOL_STATE_MUTE 	= 0;
var VOL_STATE_25 	= 1;
var VOL_STATE_50 	= 2;
var VOL_STATE_75 	= 3;
var VOL_STATE_100 	= 4;


// State variables to let Show know which bottom to recalc
var NONE_SB = 0;
var GENRE_SB = 1;
var ARTIST_SB = 2;
var ALBUM_SB = 3;
var TITLE_SB = 4;
var FOLDER_SB = 5;
var SEARCH_SB = 6;
var PLAYALL_SB = 7;
var YTUBE_SB = 8;
var LIST_SB = 9;
var INTERNET_SB = 10;

var backManager = 
{

	handleBackGesture: function(e)
	{
	
	}
}

var DJ_KNOB_SCALE_FACT = PI * 0.21;
var DJ_KNOB_TWO_SCALE_FACT = PI * 0.42;
var INV_DJ_KNOB_SCALE_FACT = 1/DJ_KNOB_SCALE_FACT;
var INV_DJ_KNOB_TWO_SCALE_FACT = 1/DJ_KNOB_TWO_SCALE_FACT;
var DJ_PI_SLIDE_DIF = PI * 0.04;

var DJ_PL_ITEM_HEIGHT = 52;

var sceneDJ =
{
	bFirstRun: 1,
	tmoutScrubPopOne: 0,
	tmoutScrubPopTwo: 0,
	iPausePlayState: [PLAYER_PAUSED_STATE, PLAYER_PAUSED_STATE],
	djRecordOne: 0,
	djRecordTwo: 0,
	bGettingStateOne: 0,
	bGettingStateTwo: 0,
	timoutOneState: 0,
	timoutTwoState: 0,
	fPrevFade: 0.5,
	iIgnoreNextNP: [0, 0],
	iIsPLPaneOut: [0, 0],
	DJPLScrollBox: [0, 0],
	arrayPLList: [0,0],
	
	InitMyDiv: function()
	{
		document.getElementById('idDJOneTitArtInf').addEventListener(START_EV, function()
		{
			document.getElementById('idDJOnePickSong').style.display = "block";
			sceneDJ.DJPLScrollBox[0].RecalcBottom();
			sceneDJ.DJPLScrollBox[0].YScrollTo(1, 0, true);
		}, false);
		document.getElementById('idDJTwoTitArtInf').addEventListener(START_EV, function()
		{
			document.getElementById('idDJTwoPickSong').style.display = "block";
			sceneDJ.DJPLScrollBox[1].RecalcBottom();
			sceneDJ.DJPLScrollBox[1].YScrollTo(1, 0, true);
		}, false);
		
		document.getElementById('idDJOneClosePick').addEventListener(START_EV, function()
		{
			document.getElementById('idDJOnePickSong').style.display = "none";
		}, false);
		document.getElementById('idDJTwoClosePick').addEventListener(START_EV, function()
		{
			document.getElementById('idDJTwoPickSong').style.display = "none";
		}, false);
	
		this.djScrubOne = new MusScrubber();
		this.djScrubOne.Init(document.getElementById('idDJScrubOne'), 
						   document.getElementById('idDJOnePop'),
						   document.getElementById('idDJRecArmOne'),
						   0);
		this.djScrubTwo = new MusScrubber();
		this.djScrubTwo.Init(document.getElementById('idDJScrubTwo'), 
						   document.getElementById('idDJTwoPop'),
						   document.getElementById('idDJRecArmTwo'),
						   1);
		this.djRecordOne = 
				new RecordSpin(document.getElementById('idDJPaneOne'));
		this.djRecordTwo = 
				new RecordSpin(document.getElementById('idDJPaneTwo'));
		
		document.getElementById('btnDJOnecue').addEventListener(START_EV, function() 
		{
			sceneDJ.djScrubOne.AddCue();
		});
		
		document.getElementById('btnDJTwocue').addEventListener(START_EV, function() 
		{
			sceneDJ.djScrubTwo.AddCue();
		});
		
		document.getElementById('btnDJOneplay').addEventListener(START_EV, function() 
		{
			sceneDJ.PlayPauseOne(PLAYER_PLAY_STATE);
		});
		document.getElementById('btnDJOnepause').addEventListener(START_EV, function() 
		{
			sceneDJ.PlayPauseOne(PLAYER_PAUSED_STATE);
		});
		document.getElementById('btnDJOneprev').addEventListener(START_EV, function() 
		{
			objwAMP.OpenPrevSong(0);
		});
		document.getElementById('btnDJOnenext').addEventListener(START_EV, function() 
		{
			objwAMP.OpenNextSong(0);
		});

		document.getElementById('btnDJTwoplay').addEventListener(START_EV, function() 
		{
			sceneDJ.PlayPauseTwo(PLAYER_PLAY_STATE);
		});
		document.getElementById('btnDJTwopause').addEventListener(START_EV, function() 
		{
			sceneDJ.PlayPauseTwo(PLAYER_PAUSED_STATE);
		});
		document.getElementById('btnDJTwoprev').addEventListener(START_EV, function() 
		{	
			objwAMP.OpenPrevSong(1);
		});
		document.getElementById('btnDJTwonext').addEventListener(START_EV, function() 
		{
			objwAMP.OpenNextSong(1);
		});
				
		document.getElementById('idCrossOverSwitch').addEventListener(START_EV, function(ev)
		{	
			var pos = {"left":DomOffsetLeftCalc(this)};

			pos.fix = this.firstChild.offsetWidth;
			pos.rightlim = domParent.offsetWidth - pos.fix + 1;
			pos.fix *= 0.5;
			
			var funcMove = function(e)
			{
				e.preventDefault();
				
				var point = hasTouch ? e.changedTouches[0] : e;
				
				clearTimeout(sceneDJ.tmoutScrubPopOne);
				clearTimeout(sceneDJ.tmoutScrubPopTwo);
				
				var iLeft = Math.min(pos.rightlim, 
									Math.max(0, point.pageX - pos.left - pos.fix));
				
				document.getElementById('idCrossOverKnob').style.webkitTransform =
											"translate3d(" +
											 iLeft + "px, 0px, 0px)";
											 
				var fVal = iLeft / pos.rightlim;
				
				if ((fVal > .46) && (fVal < .54))
					fVal = .5;
				
				objwAMP.SetCrossfade(fVal);
				
				sceneDJ.fPrevFade = fVal;
				
				var txtVal = (((1-fVal) * 100)|0) + '%';
				document.getElementById('idDJOnePop').innerHTML = txtVal;
				document.getElementById('idDJOnePop').className = '';

				txtVal = (0|(fVal * 100)) + '%';
				document.getElementById('idDJTwoPop').innerHTML = txtVal;
				document.getElementById('idDJTwoPop').className = '';
				
				sceneDJ.tmoutScrubPopOne = setTimeout(function()
				{
					document.getElementById('idDJOnePop').className = 'classHideScrubPop';
				}, 1000);
				
				sceneDJ.tmoutScrubPopTwo = setTimeout(function()
				{
					document.getElementById('idDJTwoPop').className = 'classHideScrubPop';
				}, 1000);
			}
			
			funcMove(ev);
			
			document.getElementById('idCrossOverSwitch').addEventListener(MOVE_EV, funcMove, false);
			document.getElementById('idCrossOverKnob').addEventListener(MOVE_EV, funcMove, false);
			
			var funcEnd = function()
			{
				document.getElementById('idCrossOverSwitch').removeEventListener(MOVE_EV, funcMove, false);
				document.getElementById('idCrossOverSwitch').removeEventListener(END_EV, funcEnd, false);
				document.getElementById('idCrossOverKnob').removeEventListener(MOVE_EV, funcMove, false);
				document.getElementById('idCrossOverKnob').removeEventListener(END_EV, funcEnd, false);				
			}
			
			document.getElementById('idCrossOverSwitch')
											.addEventListener(END_EV, funcEnd, false);
			document.getElementById('idCrossOverKnob')
											.addEventListener(END_EV, funcMove, false);
			
		}, false);
		
		var iTempRad = 180;
		var iStartY = iTempRad + Math.cos( -THREE_QUARTER_PI ) * iTempRad - 20;
		var iStartX = iTempRad + Math.sin( -THREE_QUARTER_PI ) * iTempRad - 20;
		var domBut = document.getElementById('idDJOneSpeedKnob');
		domBut.style.top = iStartY + 'px';
		domBut.style.left = iStartX + 'px';
		
		domBut = document.getElementById('idDJTwoSpeedKnob');
		domBut.style.top = iStartY + 'px';
		domBut.style.left = iStartX + 'px';
		
		iStartY = iTempRad + Math.cos( -QUARTER_PI ) * iTempRad + 11;
		iStartX = iTempRad + Math.sin( -QUARTER_PI ) * iTempRad - 20;
		
		domBut = document.getElementById('idDJOneVolKnob');
		domBut.style.top = iStartY + 'px';
		domBut.style.left = iStartX + 'px';
		
		domBut = document.getElementById('idDJTwoVolKnob');
		domBut.style.top = iStartY + 'px';
		domBut.style.left = iStartX + 'px';
		
		
		var funcDJSpeedDrag = function(me, event, dd, domPop, tmout)
		{
			clearTimeout(tmout);
			
			var point = hasTouch ? event.touches[0] : event;
			
			var angle = Math.atan2( point.pageX - dd.centerX, 
									point.pageY - dd.centerY );

			if (angle >= -HALF_PI)
			{
				tmout = setTimeout(function()
				{
					domPop.className = 'classHideScrubPop';
				}, 1000);
				return tmout;
			}
			
			var fCalcVal = angle + THREE_QUARTER_PI;
			
			var txtVal = "x";
			
			if (Math.abs(fCalcVal) > DJ_KNOB_SCALE_FACT)
			{
				if (fCalcVal < 0)
				{
					objwAMP.SetSpeed(0.5, 0);
					txtVal += "2";
				}
				else
				{
					objwAMP.SetSpeed(4, 0);
					txtVal += "0.25";
				}
			}
			else
			{
				me.style.top = (dd.radius + Math.cos( angle ) * dd.radius - 20) + "px";
				me.style.left =	(dd.radius + Math.sin( angle ) * dd.radius - 20) + "px";
			
				if (Math.abs(fCalcVal) < 0.05)
				{
					objwAMP.SetSpeed(1, 0);
					txtVal += "1";
				}
				else if (fCalcVal < 0)
				{
					fCalcVal *= -INV_DJ_KNOB_TWO_SCALE_FACT;
					fCalcVal = 1.0 - fCalcVal;
					objwAMP.SetSpeed(fCalcVal, 0);
					txtVal += Number(1/fCalcVal).toFixed(2);
				}
				else
				{
					fCalcVal *= INV_DJ_KNOB_SCALE_FACT;
					fCalcVal = 1 + 3*fCalcVal;
					objwAMP.SetSpeed(fCalcVal, 0);
					txtVal += Number(1/fCalcVal).toFixed(2);
				}
			}
			
			domPop.innerHTML = txtVal;
			domPop.className = '';

			tmout = setTimeout(function()
			{
				domPop.className = 'classHideScrubPop';
			}, 1000);
		
			return tmout;
		};
		
		document.getElementById('idDJOneSpeedKnob').addEventListener(START_EV,
		function(ev)
		{
			var me = this;
			var pos = DomOffsetCalc(this.parentNode);

			var dd = {"trigger": 0,
					  "radius": 180};
			
			dd.centerX = pos.left + dd.radius;
			dd.centerY = pos.top + dd.radius;
		
			var funcDragSO = function(event)
			{
				sceneDJ.tmoutScrubPopOne = funcDJSpeedDrag(me, 
										event, 
										dd, 
										document.getElementById('idDJOnePop'),
										sceneDJ.tmoutScrubPopOne);
			}
		
			var funcDropSO = function()
			{
				document.removeEventListener(MOVE_EV, funcDragSO, false);
				document.removeEventListener(END_EV, funcDropSO, false);
			}
		
			document.addEventListener(MOVE_EV, funcDragSO, false);
			document.addEventListener(END_EV, funcDropSO, false);
		
		});
		
		document.getElementById('idDJTwoSpeedKnob').addEventListener(START_EV,
		function(ev)
		{
			var me = this;
			var pos = DomOffsetCalc(this.parentNode);

			var dd = {"trigger": 0,
					  "radius": 180};
			
			dd.centerX = pos.left + dd.radius;
			dd.centerY = pos.top + dd.radius;
		
			var funcDragST = function(event)
			{
				sceneDJ.tmoutScrubPopTwo = funcDJSpeedDrag(me, 
										event, 
										dd, 
										document.getElementById('idDJTwoPop'),
										sceneDJ.tmoutScrubPopTwo);
			}
		
			var funcDropST = function()
			{
				document.removeEventListener(MOVE_EV, funcDragST, false);
				document.removeEventListener(END_EV, funcDropST, false);
			}
		
			document.addEventListener(MOVE_EV, funcDragST, false);
			document.addEventListener(END_EV, funcDropST, false);
		
		});
		
		
		var funcDJVolDrag = function(me, event, dd, domPop, tmout)
		{
			clearTimeout(tmout);
			
			var point = hasTouch ? event.touches[0] : event;
			
			var angle = Math.atan2(point.pageX - dd.centerX, 
								   point.pageY - 34 - dd.centerY );

			var txtVal = 'x';

			if (angle > -DJ_PI_SLIDE_DIF)
			{
				objwAMP.SetVol(0.0, 0);
				txtVal += '0.0';
			}
			else
			{

				var fCalcVal = angle + DJ_PI_SLIDE_DIF;
				fCalcVal *= -INV_DJ_KNOB_TWO_SCALE_FACT;
			
				if (fCalcVal > 1.0)
				{
					objwAMP.SetVol(1.0, 0);
					txtVal += '2.0';
				}
				else
				{
					if ((fCalcVal > 0.45) &&
						(fCalcVal < 0.55))
					{
						fCalcVal = 0.5;
					}
						
					txtVal += Number(fCalcVal * 2).toFixed(2);
					objwAMP.SetVol(fCalcVal, 0);
					
					me.style.top = (dd.radius + Math.cos( angle ) * dd.radius + 11) + "px";
					me.style.left =	(dd.radius + Math.sin( angle ) * dd.radius - 20) + "px";
				}
			}
			
			domPop.innerHTML = txtVal;
			domPop.className = '';

			tmout = setTimeout(function()
			{
				domPop.className = 'classHideScrubPop';
			}, 1000);
		
			return tmout;
		};

		document.getElementById('idDJOneVolKnob').addEventListener(START_EV,
		function(ev)
		{
			var pos = DomOffsetCalc(this.parentNode);
			var me = this;
			
			var dd = {"radius": 180};
			dd.centerX = pos.left + dd.radius;
			dd.centerY = pos.top + dd.radius;
			
			var funcDragVO = function(event)
			{
				sceneDJ.tmoutScrubPopOne = funcDJVolDrag(me, 
										event, 
										dd, 
										document.getElementById('idDJOnePop'),
										sceneDJ.tmoutScrubPopOne);
			}
		
			var funcDropVO = function()
			{
				document.removeEventListener(MOVE_EV, funcDragVO, false);
				document.removeEventListener(END_EV, funcDropVO, false);
			}
		
			document.addEventListener(MOVE_EV, funcDragVO, false);
			document.addEventListener(END_EV, funcDropVO, false);
		});

		document.getElementById('idDJTwoVolKnob').addEventListener(START_EV,
		function(ev)
		{
			var pos = DomOffsetCalc(this.parentNode);
			var me = this;
			
			var dd = {"radius": 180};
			dd.centerX = pos.left + dd.radius;
			dd.centerY = pos.top + dd.radius;
			
			var funcDragVO = function(event)
			{
				sceneDJ.tmoutScrubPopTwo = funcDJVolDrag(me, 
										event, 
										dd, 
										document.getElementById('idDJTwoPop'),
										sceneDJ.tmoutScrubPopTwo);
			}
		
			var funcDropVO = function()
			{
				document.removeEventListener(MOVE_EV, funcDragVO, false);
				document.removeEventListener(END_EV, funcDropVO, false);
			}
		
			document.addEventListener(MOVE_EV, funcDragVO, false);
			document.addEventListener(END_EV, funcDropVO, false);
		});
		
		sceneDJ.DJPLScrollBox[0] = new iScroll('idDJOnePLWrapper', {
			altTouchTarget: document.getElementById('idDJPLOneCover'),
			onBeforeScrollStart: function(event)
			{
				sceneDJ.OnPLBeforeScrollStart(0, 
											  'idDJOnePLScroller', 
											  this.y, 
											  event);
			},
			onAnimationEnd: function()
			{
				sceneDJ.OnAnimationEnd(0, 
									  'idDJOnePLScroller', 
									  this.y);
			},
			onScrollMove: function()
			{
				sceneDJ.OnScrollMove(0, 
									'idDJOnePLScroller', 
									this.y,
									event);
			},
			hScroll: false,
			onClick: function(event)
			{				
				sceneDJ.OnPLClick(0, 'idDJOnePLWrapper', this.y, event);
			}
		});
		
		sceneDJ.DJPLScrollBox[0].iTouchDownIndex = -1;
		sceneDJ.DJPLScrollBox[0].iStartIndex = -1;
		sceneDJ.DJPLScrollBox[0].iEndIndex = -1;
		sceneDJ.DJPLScrollBox[0].iIndivMargin = DJ_PL_ITEM_HEIGHT;
		
		sceneDJ.DJPLScrollBox[1] = new iScroll('idDJTwoPLWrapper', {
			altTouchTarget: document.getElementById('idDJPLTwoCover'),
			hScroll: false,
			onBeforeScrollStart: function(event)
			{
				sceneDJ.OnPLBeforeScrollStart(1, 
											  'idDJTwoPLScroller', 
											  this.y, 
											  event);
			},
			onAnimationEnd: function()
			{
				sceneDJ.OnAnimationEnd(1, 
									  'idDJTwoPLScroller', 
									  this.y);
			},
			onScrollMove: function()
			{
				sceneDJ.OnScrollMove(1, 
									'idDJTwoPLScroller', 
									this.y,
									event);
			},
			onClick: function(event)
			{				
				sceneDJ.OnPLClick(1, 'idDJTwoPLWrapper', this.y, event);
			}
		});
		
		sceneDJ.DJPLScrollBox[1].iTouchDownIndex = -1;
		sceneDJ.DJPLScrollBox[1].iStartIndex = -1;
		sceneDJ.DJPLScrollBox[1].iEndIndex = -1;
		sceneDJ.DJPLScrollBox[1].iIndivMargin = DJ_PL_ITEM_HEIGHT;
		
	},
	
	OnScrollMove: function(iTrack, str, y, event)
	{

	},
	
	OnAnimationEnd: function(iTrack, str, y)
	{
		if (!sceneDJ.arrayPLList[iTrack] || !sceneDJ.arrayPLList[iTrack].length)
			return;
		
		var vertY = -1 * y / sceneDJ.DJPLScrollBox[iTrack].iIndivMargin;
		vertY = Math.max(0|(vertY-10), 0);
		
		var strListHTML = sceneDJ.arrayPLList[iTrack][vertY]
									.replace('" class=', 
										'" style="margin-top:' + 
										(vertY++ * 
											sceneDJ.DJPLScrollBox[iTrack].iIndivMargin) +
										'px;" class=');
											
		strListHTML += sceneDJ.arrayPLList[iTrack].slice(vertY, vertY+20).join('');
		
		document.getElementById(str).innerHTML = strListHTML;
		
		this.iTouchDownIndex = -1;
	},
	
	OnPLBeforeScrollStart: function(iTrack, str, y, event)
	{
		if (!sceneDJ.arrayPLList[iTrack] || !sceneDJ.arrayPLList[iTrack].length)
			return;
	
		event.preventDefault();

		var iIndex = 0|(-1 * y / 
							sceneDJ.DJPLScrollBox[iTrack].iIndivMargin);
		
		sceneDJ.DJPLScrollBox[iTrack].iTouchDownIndex = iIndex;
		
		var iStartIndex;
		var strListHTML = "";
		
		if (iIndex > SCROLL_NUM_PRELOAD)
		{
			iStartIndex = iIndex - SCROLL_NUM_PRELOAD;
			
			strListHTML = sceneDJ.arrayPLList[iTrack][iStartIndex]
										.replace('" class=', 
										'" style="margin-top:' + 
										[iStartIndex * 
										sceneDJ.DJPLScrollBox[iTrack].iIndivMargin] +
										'px;" class=');
										
			iStartIndex++;

		}
		else
		{
			iStartIndex = 0;
		}
		
		//console.log("strListHTML:" + strListHTML);
		
		var iEnd = Math.min(iIndex+SCROLL_NUM_PRELOAD, 
							sceneDJ.arrayPLList[iTrack].length);
		
		strListHTML += sceneDJ.arrayPLList[iTrack].slice(iStartIndex, iEnd).join('');
		
		sceneDJ.DJPLScrollBox[iTrack].iStartIndex = iStartIndex;
		sceneDJ.DJPLScrollBox[iTrack].iEndIndex = iEnd;
		
		document.getElementById(str).innerHTML = strListHTML;
	},
	
	OnPLClick: function(iTrack, str, y, event)
	{				
		point = hasTouch ? event.changedTouches[0] : event;
	
		var iIndex = (-1 * y) + point.pageY - 
				DomOffsetTopCalc(document.getElementById(str),
								this.y); 
		iIndex = 0|(iIndex / 
						sceneDJ.DJPLScrollBox[0].iIndivMargin );
				
		objwAMP.OpenSong(iTrack, iIndex);
		if (iTrack)
			sceneDJ.PlayPauseTwo(PLAYER_PLAY_STATE);
		else
			sceneDJ.PlayPauseOne(PLAYER_PLAY_STATE);
		sceneDJ.DrawNowPlaying(iIndex, iTrack);
		sceneDJ.iIgnoreNextNP[iTrack] = 1;
	},
	
	PlaceBannerTxt: function(strTitle, strArtist, iTrack)
	{
		if (iTrack == 0)
		{
			sceneDJ.djScrubOne.ClearCues();
			var strText = strTitle.substr(0, 11);
			if (strTitle.length > 11)
				strText += "...";
			strText += "/";
			strText += strArtist.substr(0, 7);
			document.getElementById('idDJOneTitArtInf').innerHTML = strText;
		}
		else
		{
			sceneDJ.djScrubTwo.ClearCues();
			var strText = strTitle.substr(0, 12);
			if (strTitle.length > 12)
				strText += "...";
			strText += "/";
			strText += strArtist;
			document.getElementById('idDJTwoTitArtInf').innerHTML = strText;
		}	
	},
	
	PlayPauseOne: function(iState)
	{
		if (iState == PLAYER_PLAY_STATE)
		{
			//visPlayMode[0] = 1;
			//RenderVis(0);
			this.iPausePlayState[0] = PLAYER_PLAY_STATE;
			objwAMP.play(0);
			document.getElementById('btnDJOneplay').style.display = "none";
			document.getElementById('btnDJOnepause').style.display = "block";
			this.djRecordOne.Start();
			if (!this.bGettingStateOne)
			{
				this.bGettingStateOne = 1;
				this.StartStateUpdatesOne();
			}
		}
		else
		{
			//visPlayMode[0] = 0;
			this.iPausePlayState[0] = PLAYER_PAUSED_STATE;
			objwAMP.pause(0);
			this.bPlayOnLoad = false;
			document.getElementById('btnDJOneplay').style.display = "block";
			document.getElementById('btnDJOnepause').style.display = "none";
			this.djRecordOne.Stop();
			this.StopStateUpdatesOne();
			this.bGettingStateOne = 0;
		}
	},
	
	PlayPauseTwo: function(iState)
	{
		if (iState == PLAYER_PLAY_STATE)
		{
			//visPlayMode[1] = 1;
			//RenderVis(1);		
			this.iPausePlayState[1] = PLAYER_PLAY_STATE;
			objwAMP.play(1);
			document.getElementById('btnDJTwoplay').style.display = "none";
			document.getElementById('btnDJTwopause').style.display = "block";
			this.djRecordTwo.Start();
			if (!this.bGettingStateTwo)
			{
				this.bGettingStateTwo = 1;
				this.StartStateUpdatesTwo();
			}
		}
		else
		{
			//visPlayMode[1] = 0;
			this.iPausePlayState[1] = PLAYER_PAUSED_STATE;
			objwAMP.pause(1);
			this.bPlayOnLoad = false;
			document.getElementById('btnDJTwoplay').style.display = "block";
			document.getElementById('btnDJTwopause').style.display = "none";
			this.djRecordTwo.Stop();
			this.StopStateUpdatesTwo();
			this.bGettingStateTwo = 0;
		}
	},
	
	StartStateUpdatesOne: function()
	{
		this.bRunStateOneUpdate = true;
		this.UpdateStateOne();
	},
	
	StopStateUpdatesOne: function()
	{
		this.bRunStateOneUpdate = false;
	},
	
	UpdateStateOne: function()
	{
		//console.log("Entering UpdateState One");
	
		clearTimeout(this.timoutOneState);
			
		this.PluginStateOne = objwAMP.GetState(0);
			
		this.djScrubOne.SetEndTime(this.PluginStateOne.EndTime);

		this.djScrubOne.SetCurTime(this.PluginStateOne.CurTime);
				
		if (this.bRunStateOneUpdate)
		{
			this.timoutOneState = setTimeout(function() 
										{
											sceneDJ.UpdateStateOne();
										}, STATE_WAIT_PERIOD);
		}
		
	},
	
	StartStateUpdatesTwo: function()
	{
		this.bRunStateTwoUpdate = true;
		this.UpdateStateTwo();
	},
	
	StopStateUpdatesTwo: function()
	{
		this.bRunStateTwoUpdate = false;
	},
	
	UpdateStateTwo: function()
	{
		//console.log("Entering UpdateState Two");
	
		clearTimeout(this.timoutTwoState);
			
		this.PluginStateTwo = objwAMP.GetState(1);
			
		this.djScrubTwo.SetEndTime(this.PluginStateTwo.EndTime);

		this.djScrubTwo.SetCurTime(this.PluginStateTwo.CurTime);
				
		if (this.bRunStateTwoUpdate)
		{
			this.timoutTwoState = setTimeout(function() 
										{
											sceneDJ.UpdateStateTwo();
										}, STATE_WAIT_PERIOD);
		}

	},
	
	ShowDJ: function()
	{
		if (window.PalmSystem)
		{
			var strCurOrientation = window.PalmSystem.screenOrientation;
			
			if (strCurOrientation == "left")
				window.PalmSystem.setWindowOrientation("left");
			else
				window.PalmSystem.setWindowOrientation("right");
		}
		
		if (this.bFirstRun)
		{
			this.djScrubOne.OrientChange();
			this.djScrubTwo.OrientChange();
		
			this.djRecordOne.Init(this.djScrubOne);
			this.djRecordTwo.Init(this.djScrubTwo);
			this.bFirstRun = 0;
		}
		
		document.getElementById('idPlaylistScroller').innerHTML = "";
		sceneDJ.arrayPLList[0] = panePlaylist.arrayPLList;
		sceneDJ.arrayPLList[1] = panePlaylist.arrayPLList.map(function(item)
						{
							return item.replace("plyls_", "plyd2_");
						});

		document.getElementById('idDJOnePLScroller').style.height =
											(sceneDJ.arrayPLList[0].length *
												DJ_PL_ITEM_HEIGHT) + "px";
		document.getElementById('idDJTwoPLScroller').style.height =
											(sceneDJ.arrayPLList[1].length *
												DJ_PL_ITEM_HEIGHT) + "px";
	
		panePlaylist.jqobjPLToUpdate = 
							document.getElementById('idDJOnePLScroller');
		objwAMP.RegisterTextBanner(sceneDJ.PlaceBannerTxt);
		objwAMP.RegisterNowPlaying(function(iIndex, iTrack)
		{
			sceneDJ.DrawNowPlaying(iIndex, iTrack);
		});
		
		var knob = document.getElementById('idCrossOverKnob');
		
		var iFade = document.getElementById('idCrossOverSwitch').offsetWidth - 
									knob.offsetWidth + 1;
		iFade *= this.fPrevFade;
		knob.style.webkitTransform = "translate3d(" +
										 iFade + "px, 0px, 0px)";
		
		objwAMP.SetCrossfade(this.fPrevFade);
		
		this.PlayPauseOne(this.iPausePlayState[0]);
		this.PlayPauseTwo(this.iPausePlayState[1]);
		
		objwAMP.CopyPLForDJ();
		
		objwAMP.OpenSong(1);
	},
	
	DrawNowPlaying: function(iIndex, iTrack)
	{
		//console.log("Here with iTrack: " + iTrack);
		
		if (sceneDJ.iIgnoreNextNP[iTrack] == 1)
		{
			sceneDJ.iIgnoreNextNP[iTrack] = 0;
			return;
		}
		
		var jqobjScroller = iTrack ? 
						document.getElementById('idDJTwoPLScroller') : 
						document.getElementById('idDJOnePLScroller');
		
		var strListHTML = jqobjScroller.innerHTML;
		
		var strFind = iIndex + '" class="';
		var strReplace = iIndex + '" class="nowplaying '
		
		strListHTML = strListHTML.replace('" class="nowplaying', '" class="');
		strListHTML = strListHTML.replace(strFind, strReplace);

		jqobjScroller.innerHTML = strListHTML;
		
		if (sceneDJ.iIsPLPaneOut[iTrack])
		{
			var iPos = jqobjScroller.getElementsByClassName('nowplaying');
			
			if (iPos)
				iPos = iPos[0];
			
			sceneDJ.DJPLScrollBox[iTrack].YScrollTo(-1 * iPos.offsetTop);
		}
	},
	
	HideDJ: function()
	{
		document.getElementById('idDJOnePLScroller').innerHTML = "";
		panePlaylist.jqobjPLToUpdate = 
							document.getElementById('idPlaylistScroller');
		objwAMP.RegisterTextBanner(paneScrub.PlaceBannerText);
		objwAMP.RegisterNowPlaying(function(iIndex)
		{
			panePlaylist.DrawNowPlaying(iIndex);
		});
		objwAMP.SetCrossfade(0.0);
		this.PlayPauseTwo(PLAYER_PAUSED_STATE);
		if (window.PalmSystem)
			window.PalmSystem.setWindowOrientation("free");
	},
	
	CleanUp: function()
	{
	
	}
}


var paneEQ =
{
	iSpeedLeft: 0,
	iSpeedTop: 0,

	InitMyPane: function()
	{
		document.getElementById('idEQsm').addEventListener(START_EV,
										function() 
				{
					objwAMP.SetFullEQ();
					var dom = document.getElementById('idEQPane');
					
					if (dom.className.indexOf('showEQ') != -1)
					{
						dom.style.webkitTransform = "";
						dom.className = strSaveOrientation;
					}
					else
					{
						dom.style.webkitTransform = 'translate3d(0px, 0px, 0px)';
						dom.className = 'showEQ ' + strSaveOrientation;
					}
				}, false);

		if (PRO_MODE)
		{
			var funcEQ = function(me, eqNum, event)
			{	
				event.preventDefault();
				
				var pos = {"top":DomOffsetTopCalc(me)};

				pos.fix = me.firstChild.offsetHeight;
				pos.botlim = me.offsetHeight - pos.fix + 1;
				pos.fix *= 0.5;
				
				var funcMoveIndEQ = function(e)
				{
					e.preventDefault();
					
					var point = hasTouch ? e.changedTouches[0] : e;
					
					var fSliderVal = Math.min(pos.botlim, 
										Math.max(0, point.pageY - pos.top - pos.fix));
					
					me.firstChild.style.webkitTransform =
												"translate3d(0px, " +
												 fSliderVal + "px, 0px)";
												 
					objwAMP.SetEQCoef(eqNum, (1 - fSliderVal/pos.botlim));
				}
				
				funcMoveIndEQ(event);
				
				me.addEventListener(MOVE_EV, funcMoveIndEQ, false);
				me.firstChild.addEventListener(MOVE_EV, funcMoveIndEQ, false);
				
				var funcEndIndiv = function()
				{
					me.removeEventListener(MOVE_EV, funcMoveIndEQ, false);
					me.removeEventListener(END_EV, funcEndIndiv, false);
					me.firstChild.removeEventListener(MOVE_EV, funcMoveIndEQ, false);
					me.firstChild.removeEventListener(END_EV, funcEndIndiv, false);				
				}
				
				me.addEventListener(END_EV, funcEndIndiv, false);
				me.firstChild.addEventListener(END_EV, funcEndIndiv, false);
				
			};
			
			document.getElementById('idFreq0Targ').addEventListener(START_EV,
			function(event)
			{
				funcEQ(this, 0, event);
			});
			
			document.getElementById('idFreq1Targ').addEventListener(START_EV,
			function(event)
			{
				funcEQ(this, 1, event);
			});
			
			document.getElementById('idFreq2Targ').addEventListener(START_EV,
			function(event)
			{
				funcEQ(this, 2, event);
			});
			
			document.getElementById('idFreq3Targ').addEventListener(START_EV,
			function(event)
			{
				funcEQ(this, 3, event);
			});
			
			document.getElementById('idFreq4Targ').addEventListener(START_EV,
			function(event)
			{
				funcEQ(this, 4, event);
			});
			
			document.getElementById('idFreq5Targ').addEventListener(START_EV,
			function(event)
			{
				funcEQ(this, 5, event);
			});
		}
		else
		{
			var array = document.getElementById('idEQPane')
									.getElementsByClassName('classEQTarget');
									
			var i = array.length;
			
			while (i--)
				array[i].style.display = "none";
				
			var array = document.getElementById('idEQPane')
									.getElementsByClassName('classEQKnob');
									
			var i = array.length;
			
			while (i--)
				array[i].style.display = "none";	
			
			var dom = document.getElementById('idEQPane');
			
			dom.style.textAlign = "center"; 
			dom.style.fontSize = "40px"; 
			dom.style.fontWeight = "bold"; 
			dom.style.color = "red"; 
			dom.style.lineHeight = "200%";
			dom.innerHTML =
					'<p style="margin-top:50px"><br> AudiophileHD Pro</p>'; 				  
		}
		
		document.getElementById('idEQPane').addEventListener(START_EV, 
		function(ev)
		{
			if (ev.target.id != "idEQPane")
				return false;
			
			var me = this;
			
			me.style.webkitTransitionDuration = "0s";
			
			var point = hasTouch ? ev.changedTouches[0] : ev;
			
			var iStart = point.pageY;
			
			var funcMove = function(event)
			{
				if (event.target.id != "idEQPane")
					return false;
					
				event.preventDefault();
				
				var point = hasTouch ? event.changedTouches[0] : event;
				
				var deltaY = point.pageY - iStart;
				
				if (deltaY > 0)
					return;
				else
				{
					me.style.webkitTransform = 'translate3d(0px, ' +
														deltaY + 
														'px, 0px)';
				}
			}
		
			var funcEnd = function(event)
			{
				me.removeEventListener(MOVE_EV, funcMove, false);
				me.removeEventListener(END_EV, funcEnd, false);
				
				me.style.webkitTransitionDuration = "";
			
				var point = hasTouch ? event.changedTouches[0] : event;
				
				if ((point.pageY - iStart) < -50)
				{
					me.style.webkitTransform = "";
					me.className = strSaveOrientation;
				}
				else
					me.style.webkitTransform = 'translate3d(0px, 0px, 0px)';
			}
			
			me.addEventListener(MOVE_EV, funcMove, false);
			me.addEventListener(END_EV, funcEnd, false);
		});

	},
	
	SetEQPos: function ()
	{
		var dom = document.getElementById("idFreqK_0");
		
		if (!dom)
			return;
		
		var iScaleBy = dom.parentNode.offsetHeight - dom.offsetHeight;
	
		var strVals = objOptions.arrayEQVals.join('');
	
		for (var i=0; i<6; i++)
		{
			var iTransVal = (1-strVals.charCodeAt(i)/255) * iScaleBy;
			//console.log(iTransVal);
			document.getElementById("idFreqK_" + i).style.webkitTransform = 
													"translate3d(0px, " + 
													iTransVal +
													"px, 0px)";
		}
		
		objwAMP.SetFullEQ();
	},
	
	ChangeOrientation: function (strOrientation)
	{

	}

}

var paneControls =
{

	iPausePlayState: PLAYER_PAUSED_STATE,
	bSoundVis: false,
	fVolScale: 0,
	fVolAmt: 0.5,
	bGettingState: 0,
	bFinishedInit: 0,
	tmoutScrubPop: 0,
	
	InitMyPane: function()
	{	
				
		this.objBassControl = new PalmKnobControl(0.5);
		this.objBassControl.init(0, 0, 160, "idBassCntl", 
								function(fSet) 
								{
									clearTimeout(paneControls.tmoutScrubPop);
									paneControls.SetBass(fSet);
									var dom = document.getElementById('idScrubPop1');
									dom.innerHTML = ("x" + Number(fSet * 2).toFixed(1));
									dom.className = ""
									paneControls.tmoutScrubPop = setTimeout(function()
									{
										dom.className = "classHideScrubPop";
										paneControls.tmoutScrubPop = 0;
										dom = 0;
									}, 1000);
								},
								"Bass"
								);		
		
		this.objTrebControl = new PalmKnobControl(0.5);
		this.objTrebControl.init(0, 0, 160, "idTrebCntl", 
								function(fSet) 
								{
									clearTimeout(paneControls.tmoutScrubPop);
									paneControls.SetTreble(fSet);
									var dom = document.getElementById('idScrubPop1');
									dom.innerHTML = ("x" + Number(fSet * 2).toFixed(1));
									dom.className = ""
									paneControls.tmoutScrubPop = setTimeout(function()
									{
										dom.className = "classHideScrubPop";
										paneControls.tmoutScrubPop = 0;
										dom = 0;
									}, 1000);
								},
								"Treble"
								);
		
		this.objVolControl = new PalmKnobControl(0.5);
		this.objVolControl.init(0, 0, 160, "idVolKnob", 
								function(fSet) 
								{
									clearTimeout(paneControls.tmoutScrubPop);
									paneControls.SetVol(fSet);
									var dom = document.getElementById('idScrubPop1');
									dom.innerHTML = ("x" + Number(fSet * 2).toFixed(1));
									dom.className = ""
									paneControls.tmoutScrubPop = setTimeout(function()
									{
										dom.className = "classHideScrubPop";
										paneControls.tmoutScrubPop = 0;
										dom = 0;
									}, 1000);
								},
								"Vol"
								);
		
		document.getElementById('idoptionssm').addEventListener(START_EV, function()
		{
			objOptions.Draw();
		});
		
		document.getElementById('btnplay').addEventListener(START_EV,
				function() {paneControls.PlayPauseChange(PLAYER_PLAY_STATE);});
		document.getElementById('btnpause').addEventListener(START_EV, 
				function() {paneControls.PlayPauseChange(PLAYER_PAUSED_STATE);});
		document.getElementById('btnprev').addEventListener(START_EV, 
				function() {objwAMP.OpenPrevSong();});
		document.getElementById('btnnext').addEventListener(START_EV, 
				function() {objwAMP.OpenNextSong();});
		
		document.getElementById('btncue').addEventListener(START_EV, function() 
		{
			paneScrub.ScrubOne.AddCue();
		});
		
		if (PRO_MODE)
		{
			document.getElementById('idDJsm').addEventListener(START_EV, 
											function() 
									{
										paneScrub.ToggleDJMode();
									}, false);
			document.getElementById('idNormsm')
						.addEventListener(START_EV, function() 
						{
							paneScrub.ToggleDJMode();
						});
		}
		else
		{
			document.getElementById('idDJAd').addEventListener(START_EV, 
						function() 
						{
							document.getElementById('idDJAd').style.display = 
																		"none";
						},
						false);
			document.getElementById('idDJsm')
						.addEventListener(START_EV, function() 
						{
							document.getElementById('idDJAd').style.display = 
																		"block";
						});
		}
		
		objwAMP.RegisterPauseFunc(function()
		{
			paneControls.PlayPauseChange(PLAYER_PAUSED_STATE);
		});
		
		document.getElementById('btnshuf').addEventListener(START_EV, function() 
		{
			paneControls.ModeControl(PLAY_MODE_REPEAT);
		});
		
		document.getElementById('btnrep').addEventListener(START_EV, function() 
		{
			paneControls.ModeControl(PLAY_MODE_NORMAL);
		});
		
		document.getElementById('btnnormal').addEventListener(START_EV, function() 
		{
			paneControls.ModeControl(PLAY_MODE_SHUFFLE);
		});	

		document.getElementById('idSpeedKnob').addEventListener(START_EV,
		function(ev)
		{
			var me = this;
			
			var div = document.getElementById('idSpeedSlider'); 
			
			var dd = {'left':DomOffsetLeftCalc(div, paneScrub.iPortULReference)};
			
			dd.rightlim = div.clientWidth - this.clientWidth;
			
			dd.fix = this.clientWidth/2;
			
			var funcSpeedDrag = function(event)
			{
				clearTimeout(paneControls.tmoutScrubPop);
			
				var point = hasTouch ? event.touches[0] : event;
			
				var iLeft = Math.min(dd.rightlim, 
									Math.max(0, point.pageX - dd.left - dd.fix));
				
				me.style.webkitTransform = "translate3d(" +
											 iLeft + "px, -" +
											 iLeft + "px, 0px)";
							 
				var fVal = iLeft/dd.rightlim;
				
				var txtVal = "x";
				
				fVal = 1 - fVal;
				
				if (fVal < 0.4)
				{
					fVal += 0.5;
					txtVal += Number(1/fVal).toFixed(2);
					objwAMP.SetSpeed(fVal);
				}
				else if (fVal > 0.6)
				{
					fVal = fVal * 6;
					fVal -= 2;
					txtVal += Number(1/fVal).toFixed(2);
					objwAMP.SetSpeed(fVal);
				}
				else
				{
					txtVal += "1.0";
					objwAMP.SetSpeed(1.0);
				}
				
				var dom = document.getElementById('idScrubPop1');
				dom.innerHTML = txtVal;
				txtVal = 0;
				dom.className = ""
				paneControls.tmoutScrubPop = setTimeout(function()
				{
					dom.className = "classHideScrubPop";
					paneControls.tmoutScrubPop = 0;
					dom = 0;
				}, 1000);
			}
		
			var funcSpeedDrop = function()
			{
				document.removeEventListener(MOVE_EV, funcSpeedDrag, false);
				document.removeEventListener(END_EV, funcSpeedDrop, false);
			}
		
			document.addEventListener(MOVE_EV, funcSpeedDrag, false);
			document.addEventListener(END_EV, funcSpeedDrop, false);
		}, false);
		
		var funcTransKnob = function( ev )
		{
			var me = this;
			
			var div = document.getElementById('idTransSlider'); 
	
			var dd = {'left': 
						DomOffsetLeftCalc(div, paneScrub.iPortULReference)};
			dd.rightlim = div.offsetWidth - this.offsetWidth;
			dd.fix = this.offsetWidth * 0.5;

			var funcDrag = function( event )
			{

				var point = hasTouch ? event.touches[0] : event;
				
				clearTimeout(paneControls.tmoutScrubPop);
			
				var iLeft = Math.min(dd.rightlim, 
									Math.max(0, point.pageX - dd.left - dd.fix));
									
				me.style.webkitTransform = "translate3d(" +
											 iLeft + "px, " +
											 iLeft + "px, 0px)";
							 
				var fVal = iLeft/dd.rightlim;
				
				var txtVal = "";
				
				if ((fVal < 0.4) || (fVal > 0.6))
				{
					fVal -= 0.5;
					fVal *= -20;
					objwAMP.SetSongTransition(fVal);
					
					if (fVal > 0)
						txtVal = "+";
						
					txtVal += Math.round(fVal) + " secs";
				}
				else
				{
					objwAMP.SetSongTransition(0.0);
					
					txtVal = "0 secs";
				}
				
				var dom = document.getElementById('idScrubPop1');
				dom.innerHTML = txtVal;
				txtVal = 0;
				dom.className = "";
				paneControls.tmoutScrubPop = setTimeout(function()
				{
					dom.className = "classHideScrubPop";
					paneControls.tmoutScrubPop = 0;
					dom = 0;
				}, 1000);
				
			}
		
			var funcDrop = function()
			{
				document.removeEventListener(MOVE_EV, funcDrag, false);
				document.removeEventListener(END_EV, funcDrop, false);
			}
		
			document.addEventListener(MOVE_EV, funcDrag, false);
			document.addEventListener(END_EV, funcDrop, false);
		
		};
		
		document.getElementById('idTransKnob').addEventListener(START_EV, funcTransKnob, false);
		
		objOptions.RegisterRestoreDefaultCB(function()
		{
			paneControls.SetValsFromDB();
		});
	
		if (window.PalmSystem) 
		{
			// Headset control
		
			var reqObject = new PalmServiceBridge();
			
			var parameters = {};
			parameters.subscribe = true;
			parameters.$activity = {
				activityId: window.PalmSystem.activityId
			};

			parameters = JSON.stringify(parameters);
			reqObject.onservicecallback = function(status) 
			{
				status = JSON.parse(status);
				
				//console.log("Headphone: " + JSON.stringify(status));
				
				if (objOptions.iPauseOnHOut)
				{
					if (status["state"] == "up")
					{
						paneControls.PlayPauseChange(PLAYER_PAUSED_STATE);
						return;
					}
				}
				
				if (objOptions.iPlayOnHIn)
				{
					if (status["state"] == "down")
					{
						paneControls.PlayPauseChange(PLAYER_PLAY_STATE);
						return;
					}
				}
				
			};
			reqObject.call("palm://com.palm.keys/headset/status", parameters );
		
			// Bluetooth controls
		
			var reqObject = new PalmServiceBridge();
			
			var parameters = {};
			parameters.subscribe = true;
			parameters.$activity = {
				activityId: window.PalmSystem.activityId
			};

			parameters = JSON.stringify(parameters);
			reqObject.onservicecallback = function(status) 
			{
			
				status = JSON.parse(status);
			
				//console.log(JSON.stringify(status));
			
				var state = status.state;

				if (state === "up")
				{
					var key = status.key;
	
					switch (key)
					{
					// this looks strange, but there may be events we need to translate
					
						case "next":
							objwAMP.OpenNextSong();
							break;
						case "prev":
							objwAMP.OpenPrevSong();
							break;
						case "pause":
							paneControls.PlayPauseChange(PLAYER_PAUSED_STATE);
							break;
						case "play":
							paneControls.PlayPauseChange(PLAYER_PLAY_STATE);
							break;
						case "stop":
							paneControls.PlayPauseChange(PLAYER_PAUSED_STATE);
							break;
						case "repeat-all":
							paneControls.ModeControl(PLAY_MODE_REPEAT);
							break;
						case "repeat-track":
							paneControls.ModeControl(PLAY_MODE_REPEAT);
							break;
						case "repeat-none":
							paneControls.ModeControl(PLAY_MODE_NORMAL);
							break;
						case "shuffle-on":
							paneControls.ModeControl(PLAY_MODE_SHUFFLE);
							break;
						case "shuffle-off":
							paneControls.ModeControl(PLAY_MODE_NORMAL);
							break;
					}
	
				}
			}
			
			reqObject.call("luna://com.palm.keys/media/status", parameters );
		}
	},
	
	SetValsFromDB: function()
	{
		var dom = document.getElementById('idTransKnob');
		
		var iPosDist = document.getElementById('idTransSlider').offsetWidth - 
															dom.offsetWidth;
		
		var iCalc = objOptions.fSongTransition * -0.05;
		iCalc += 0.5;
		
		iCalc *= iPosDist;
		
		dom.style.webkitTransform = "translate3d(" +
										 iCalc + "px, " +
										 iCalc + "px, 0px)";

		paneControls.objBassControl.RestoreVal(objOptions.fBass);						
		paneControls.objTrebControl.RestoreVal(objOptions.fTreble);
		
		paneEQ.SetEQPos();
		
		var dom = document.getElementById('idSpeedKnob');
		
		var iPosDist = document.getElementById('idSpeedSlider').offsetWidth - 
															dom.offsetWidth;
		
		iPosDist *= 0.5;
		
		dom.style.webkitTransform = "translate3d(" +
										 iPosDist + "px, -" +
										 iPosDist + "px, 0px)";
	},
	
	SetVol: function(fVol)
	{
		objwAMP.SetVol(fVol);
	},
	
	SetTreble: function(event)
	{	
		var myvalue = (event);
		objwAMP.SetTreble(myvalue);
	},

	SetBass: function(event)
	{	
		var myvalue = (event);
		objwAMP.SetBass(myvalue);
	},
	
	ModeControl: function(iMode)
	{
		objwAMP.SetMode(iMode);
		
		switch(iMode)
		{
			case PLAY_MODE_SHUFFLE:
				document.getElementById('btnshuf').style.display = "block";
				document.getElementById('btnrep').style.display = "none";
				document.getElementById('btnnormal').style.display = "none";
				break;
			case PLAY_MODE_REPEAT:
				document.getElementById('btnshuf').style.display = "none";
				document.getElementById('btnrep').style.display = "block";
				document.getElementById('btnnormal').style.display = "none";
				break;
			case PLAY_MODE_NORMAL:
				document.getElementById('btnshuf').style.display = "none";
				document.getElementById('btnrep').style.display = "none";
				document.getElementById('btnnormal').style.display = "block";
		}
	},
	
	PlayPauseChange: function(iState)
	{
		if (iState == PLAYER_PLAY_STATE)
		{
			visPlayMode[0] = 1;
			RenderVis(0);
			this.iPausePlayState = PLAYER_PLAY_STATE;
			objwAMP.play();
			document.getElementById('btnplay').style.display = "none";
			document.getElementById('btnpause').style.display = "block";
			paneScrub.SpinRecOne(1);
			if (!paneControls.bGettingState)
			{
				paneControls.bGettingState = 1;
				paneScrub.StartStateUpdates();
			}
			if (window.PalmSystem)
				win.postMessage("Play", "*");
		}
		else
		{
			visPlayMode[0] = 0;
		
			this.iPausePlayState = PLAYER_PAUSED_STATE;
			objwAMP.pause();
			this.bPlayOnLoad = false;
			document.getElementById('btnplay').style.display = "block";
			document.getElementById('btnpause').style.display = "none";			
			paneScrub.SpinRecOne(0);
			paneScrub.StopStateUpdates();
			paneControls.bGettingState = 0;
			if (window.PalmSystem)
				win.postMessage("Pause", "*");
		}
	},
	
	ChangeOrientation: function (strOrientation)
	{
		document.getElementById('idFiltHere').className = strOrientation;
		document.getElementById('idTextBannerOne').className = strOrientation;
		
		if (paneScrub.recRecordOne)
		{
			paneControls.ModeControl(objwAMP.GetMode());
			paneControls.PlayPauseChange(paneControls.iPausePlayState);
		}
	}
}

var REC_TRIG_DIR_LEFT = 1;
var REC_TRIG_DIR_RIGHT = 2;
var REC_TRIG_DIR_BOTH = 3;

var paneScrub =
{
	
	bRunStateUpdate: false,	
	// Timeout used to halt the player slide animation on
	//	mouse down
	bPlayerMv: 0,
	tmoutPlayerMv: 0,
	iLastFmCntDn: 1,
	bLastFmDirty: 0,
	bDJModeOn: 0,
	
	// Used to track the relative upper left cornor of the
	//	portrait view.
	//
	//	The record is +125px relative to this
	iPortULReference: 0,
	
	Draw: function()
	{
		if (paneScrub.iPortULReference > 125)
			paneScrub.iPortULReference = 125;
		else if (paneScrub.iPortULReference < -125)
			paneScrub.iPortULReference = -125;
	
	
		document.getElementById('idRecPaneOne').style.webkitTransform =
										 "translate3d(" +
										 Number(paneScrub.iPortULReference).toString() +
										 "px, 0px, 0px)";

		document.getElementById('idIndex').style.webkitTransform =
										 "translate3d(" +
										 (paneScrub.iPortULReference*2) +
										 "px, 0px, 0px)";
										 
		document.getElementById('idPLPane').style.webkitTransform =
										 "translate3d(" +
										 (paneScrub.iPortULReference*2) +
										 "px, 0px, 0px)";	
	},	
	

	InitMyPane: function ()
	{	
		this.ScrubOne = new MusScrubber();
		this.ScrubOne.Init(document.getElementById('idScrubOne'), 
						   document.getElementById('idScrubPop1'),
						   document.getElementById('idRecArmOne'));
		this.recRecordOne = new RecordSpin(document.getElementById('idRecPaneOne'));
		
		var funcSnapToPos = function(iMovDir, iTime, iTarget)
		{
			if (!paneScrub.bPlayerMv)
				return;
		
			var newDist = Math.abs(paneScrub.iPortULReference -
									iTarget);
			newDist = (newDist/2) ? newDist : 1;
			newDist *= iMovDir;
		
			if (paneScrub.iPortULReference == iTarget)
			{
				paneScrub.Draw();
				document.getElementById('idPLPaneFix').style.display = "block";
				if (document.getElementById('idRecPaneOne')
									.className.indexOf('classPLVis') != -1)
				{
					setTimeout(function()
					{
						panePlaylist.PLScrollBox.refresh();
					}, 300);
				}
				return;
			}
			
			if (paneScrub.iPortULReference < iTarget)
			{
				paneScrub.iPortULReference += newDist;
				if (paneScrub.iPortULReference >= iTarget)
				{
					paneScrub.Draw();
					paneScrub.iPortULReference = iTarget;
					document.getElementById('idPLPaneFix').style.display = "block";
					if (document.getElementById('idRecPaneOne')
									.className.indexOf('classPLVis') != -1)
					{
						setTimeout(function()
						{
							panePlaylist.PLScrollBox.refresh();
						}, 300);
					}
					return;
				}
			}
			else
			{
				paneScrub.iPortULReference += newDist;
				if (paneScrub.iPortULReference <= iTarget)
				{
					paneScrub.Draw();
					paneScrub.iPortULReference = iTarget;
					if (document.getElementById('idRecPaneOne')
									.className.indexOf('classPLVis') != -1)
					{
						setTimeout(function()
						{
							panePlaylist.PLScrollBox.RecalcBottom();
						}, 300);
					}
					document.getElementById('idPLPaneFix').style.display = "block";
					return;
				}
			}
	
			paneScrub.Draw();
			
			paneScrub.tmoutPlayerMv = setTimeout(function() 
			{
				funcSnapToPos(iMovDir, iTime, iTarget);
			}, iTime);
		}
		
		document.getElementById('idRecPaneOne').addEventListener(START_EV, 
		function(ev)
		{
			var point = hasTouch ? ev.touches[0] : ev;
			
			if (ev.target.id != "idRecOne")
				return false;

			if (document.getElementById('idPlayer').className.indexOf('portrait') == -1)
				return false;	

			ev.preventDefault();
				
			document.getElementById('idPLPaneFix').style.display = "none";
				
			paneScrub.bPlayerMv = 0;
			clearTimeout(paneScrub.tmoutPlayerMv);
			paneScrub.tmoutPlayerMv = 0;
			
			var dd = {"last": 0};
			dd.iScaleFactor = 0;
			dd.startX = point.pageX;
			
			var funcDragRec = function(event)
			{	
				var point = hasTouch ? event.touches[0] : event;
			
				var deltaX = point.pageX - dd.startX;
			
				if (deltaX > dd.last)
				{
					if (++dd.iScaleFactor <= 0)
						dd.iScaleFactor = 1;
					paneScrub.iPortULReference += dd.iScaleFactor;
				}
				else if (deltaX < dd.last)
				{
					if (--dd.iScaleFactor >= 0)
						dd.iScaleFactor = -1;
					paneScrub.iPortULReference += dd.iScaleFactor;
				}
				
				dd.last = deltaX;
				paneScrub.Draw();
			}
			
			var funcDropRec = function()
			{			
				document.removeEventListener(MOVE_EV, funcDragRec, false);
				document.removeEventListener(END_EV, funcDropRec, false);
				
				if (paneScrub.iPortULReference == 0)
				{
					document.getElementById('idPLPaneFix').style.display = "block";
					document.getElementById('idRecPaneOne').className = 
											'classRecordPane ' +
											strSaveOrientation;
					return;
				}
				
				paneScrub.bPlayerMv = 1;
			
				if (document.getElementById('idRecPaneOne')
										.className.indexOf('classIndexVis') != -1)
				{
					if (paneScrub.iPortULReference > 100)
					{
						document.getElementById('idRecPaneOne').className = 
											'classRecordPane classPLVis ' +
											strSaveOrientation;
						funcSnapToPos(1, 800, 125);
					}
					else if (paneScrub.iPortULReference > 0)
					{
						document.getElementById('idRecPaneOne').className = 
											'classRecordPane ' +
											strSaveOrientation;
						funcSnapToPos(-1, 800, 0); 
					}
					else if (paneScrub.iPortULReference > -100)
					{
						document.getElementById('idRecPaneOne').className = 
											'classRecordPane ' +
											strSaveOrientation;
						funcSnapToPos(1, 800, 0); 
					}
					else
						funcSnapToPos(-1, 800, -125); 	
				}
				else if (document.getElementById('idRecPaneOne')
										.className.indexOf('classPLVis') != -1)
				{
					if (paneScrub.iPortULReference < -100)
					{
						document.getElementById('idRecPaneOne').className = 
											'classRecordPane classIndexVis ' +
											strSaveOrientation;
						funcSnapToPos(-1, 800, -125);
					}
					else if (paneScrub.iPortULReference < 0)
					{
						document.getElementById('idRecPaneOne').className = 
											'classRecordPane ' +
											strSaveOrientation;
						funcSnapToPos(1, 800, 0); 
					}
					else if (paneScrub.iPortULReference < 100)
					{
						document.getElementById('idRecPaneOne').className = 
											'classRecordPane ' +
											strSaveOrientation;
						funcSnapToPos(-1, 800, 0); 
					}
					else
						funcSnapToPos(1, 800, 125); 	
				}
				else
				{
					if (paneScrub.iPortULReference > 10)
					{
						document.getElementById('idRecPaneOne').className = 
											'classRecordPane classIndexVis ' +
											strSaveOrientation;
						funcSnapToPos(1, 800, 125);
					}
					else if (paneScrub.iPortULReference < -10)
					{
						document.getElementById('idRecPaneOne').className = 
											'classRecordPane classPLVis ' +
											strSaveOrientation;
						funcSnapToPos(-1, 800, -125);
					}
					else if (paneScrub.iPortULReference > 0)
						funcSnapToPos(-1, 800, 0);
					else
						funcSnapToPos(1, 800, 0);
				}
			}
		
			document.addEventListener(MOVE_EV, funcDragRec, false);
			document.addEventListener(END_EV, funcDropRec, false);
		});
		
		document.getElementById('idBannerGetDetail')
										.addEventListener(START_EV, function(e)
		{
			if (!panePlaylist.objCurSong)
				return;
			
			var idBanArtDet = document.getElementById('idBanArtDet');
			
			if (panePlaylist.objCurSong.path != objwAMP.GetCurSongPath(0))
			{
				idBanArtDet.style.display = "none";
				document.getElementById('idBanAlbDet').style.display = "none";
				document.getElementById('idBanGenDet').style.display = "none";
				document.getElementById('idBanYTbDet').style.display = "none";
				document.getElementById('idBanSavDet').style.display = "none";
				document.getElementById('idForYTubeSearch').style.display = "none";
				document.getElementById('idBanNoInfo').style.display = "block";
			}
			else
			{
				idBanArtDet.innerHTML = panePlaylist.objCurSong.artist;
				idBanArtDet.style.display = "block";
				document.getElementById('idBanAlbDet').innerHTML = 
											panePlaylist.objCurSong.album;
				document.getElementById('idBanAlbDet').style.display = "block";
				document.getElementById('idBanGenDet').innerHTML = 
												panePlaylist.objCurSong.genre;
				document.getElementById('idBanGenDet').style.display = "block";
				document.getElementById('idForYTubeSearch').style.display = "block";
				document.getElementById('idYTubeQ').value =
												panePlaylist.objCurSong.artist;
				if (objOptions.bYTubeActive)
				{
					document.getElementById('idBanSavDet').innerHTML =
															"Stop YouTube";
					document.getElementById('idBanYTbDet').innerHTML =
															"Different Video";
				}
				else
				{
					document.getElementById('idBanYTbDet').innerHTML =
																"YouTube It";
					document.getElementById('idBanSavDet').innerHTML =
															"Save WebOS";
				}
				document.getElementById('idBanSavDet').style.display = "block";
				document.getElementById('idBanYTbDet').style.display = "block";
				document.getElementById('idBanNoInfo').style.display = "none";
				
			}
						
			document.getElementById('idBannerDetailPane').className = '';
			
		}, false);
		
		document.getElementById('idYTubeQ').addEventListener(
		'keydown', 
		function(event) 
		{
			if (event.keyCode == '13') 
			{
				event.preventDefault();
				if (PRO_MODE)
				{
					YouTubeBackground(document.getElementById('idYTubeQ').value);
				}
				else
				{
					var func = function() 
					{
						document.getElementById('idDJAd').removeEventListener(START_EV, 
													func,
													false);
						document.getElementById('idDJAd').style.display = "none";
					}
					
					document.getElementById('idDJAd').addEventListener(START_EV, 
													func,
													false);
					document.getElementById('idDJAd').style.display = "block";
				}
				document.getElementById('idBannerDetailPane').className = 'classHideUp';
				
				document.getElementById('idYTubeQ').value = '';
					
				if (window.PalmSystem)
				{
					//console.log("Should hide");
					window.PalmSystem.keyboardHide();
				}
			}
		});
		
		document.getElementById('idYTubeQ').addEventListener(START_EV, function()
		{
			if (window.PalmSystem)
				window.PalmSystem.keyboardShow(2);			
		});
		
		document.getElementById('idBannerDetailPane').addEventListener(START_EV, function(ev)
			{
				
				var domTarget = ev.target;
				
				if (ev.target.id == "idYTubeQ")
				{
					return;
				}
				
				if ((ev.target.id == "idYTubeNeedForLine") ||
					(ev.target.id == "idForYTubeSearchForm") ||
					(ev.target.id == "idForYTubeSearch"))
				{
					document.getElementById('idYTubeQ').focus();
					if (window.PalmSystem)
						window.PalmSystem.keyboardShow(2);
					return;
				}
				
				if (ev.target.nodeType != 1)
				{
					domTarget = ev.target.parentNode;
				}
				
				if (domTarget)
				{
					if (domTarget.id == 'idBanArtDet')
					{
						var iIndex = 
							objSongIndex.objArtists[panePlaylist.
													objCurSong.artist.toLowerCase()];
						
						if (isNaN(iIndex))
						{
							document.getElementById('idBannerDetailPane').className = 
																	'classHideUp';
							return;
						}
						
						panePlaylist.bPLDragOut = 0;
						
						var classFilter = 'classArt_' + iIndex;
						paneSongList.strFilterCls = classFilter;
							
						var domAP = document.getElementById('idAlbumPicker');
						domAP.innerHTML = domAP.innerHTML.replace(/y: list-item;/g, 'y: none;')
														 .replace(/classUniSubPan/g, 
																		'HclassTitleSubPaneHide');
				
						var elements = domAP.getElementsByClassName(classFilter);
				
						var i = elements.length;
				
						while(i--)
						{
							elements[i].style.display = 'list-item';
							elements[i].parentNode.className = 'classUniSubPan'
						}
						
						document.getElementById('idAlbumWrapper').className += 
										' classShowPickedCat classTopLevelPickedCat ';
						
						paneSongList.Show();
						
						document.getElementById('idPickerButDiv').style.display = "block";
						paneSongList.AlbumScrollBox.RecalcBottom();
						paneSongList.AlbumScrollBox.YScrollTo(0);
					}
					else if (domTarget.id == 'idBanAlbDet')
					{
						var strLookUp;

						if (panePlaylist.objCurSong.albumArtist)
						{
							strLookUp = panePlaylist.objCurSong.album + 
										'-' + 
										panePlaylist.objCurSong.albumArtist;
						}
						else
						{
							strLookUp = panePlaylist.objCurSong.album + 
										'-' + 
										panePlaylist.objCurSong.artist;					
						}
										
										
						var iIndex = objSongIndex.objAlbums[strLookUp.toLowerCase()];
						
						if (isNaN(iIndex))
						{
							document.getElementById('idBannerDetailPane').className = 'classHideUp';
							return;
						}
						
						panePlaylist.bPLDragOut = 0;
						
						var strID = "Alb_" + iIndex;
						var classFilter = 'classAlb_' + iIndex;
						paneSongList.strFilterCls = classFilter;
						
						var domAlbum = document.getElementById(strID);

						document.getElementById('idAlbViewScroller').innerHTML = 
									domAlbum.childNodes[2].innerHTML;
						

						if (domAlbum.childNodes[1].outerHTML)
						{
							console.log("JUST FOR FIRST RUN, GET RID OF IF STATEMENT IF WORKS");
							document.getElementById('idAlbViewText').innerHTML =
									domAlbum.childNodes[1].outerHTML;
						}
						else
							document.getElementById('idAlbViewText')
											.appendChild(domAlbum.childNodes[1].cloneNode(true));

						document.getElementById('idAlbViewWrapper').className +=
								' classShowPickedCat classTopLevelPickedCat ';

						paneSongList.Show();
						
						document.getElementById('idPickerButDiv').style.display = "block";
						paneSongList.AlbViewScrollBox.RecalcBottom();
						paneSongList.AlbViewScrollBox.YScrollTo(0);
					}
					else if (domTarget.id == 'idBanGenDet')
					{
						var iIndex = 
							objSongIndex.objGenres[panePlaylist.objCurSong.genre.toLowerCase()];
						
						if (isNaN(iIndex))
						{
							document.getElementById('idBannerDetailPane').className = 'classHideUp';
							return;
						}
						
						panePlaylist.bPLDragOut = 0;
						
						var classFilter = 'classGen_' + iIndex;
						paneSongList.strFilterCls = classFilter;
						
						var domAP = document.getElementById('idArtistUL');
						domAP.innerHTML = domAP.innerHTML.replace(/y: list-item;/g, 'y: none;')
														 .replace(/classUniSubPan/g, 
																		'HclassTitleSubPaneHide');
				
						var elements = domAP.getElementsByClassName(classFilter);
				
						var i = elements.length;
				
						while(i--)
						{
							elements[i].style.display = 'list-item';
							elements[i].parentNode.className = 'classUniSubPan'
						}
					
						elements = 0;
					
						document.getElementById('idArtistWrapper').className +=
										' classShowPickedCat classTopLevelPickedCat ';							
						paneSongList.ArtistScrollBox.RecalcBottom();
						paneSongList.ArtistScrollBox.YScrollTo(0);
						
						paneSongList.Show();
						
						document.getElementById('idPickerButDiv').style.display = "block";
					}
					else if (domTarget.id == 'idBanYTbDet')
					{
						if (PRO_MODE)
						{
							YouTubeBackground(document
											.getElementById('idYTubeQ').value);
						}
						else
						{
							var func = function() 
							{
								document.getElementById('idDJAd')
											.removeEventListener(START_EV, 
															func,
															false);
								document.getElementById('idDJAd').style.display = 
																	"none";
							}
							
							document.getElementById('idDJAd')
											.addEventListener(START_EV, 
															func,
															false);
							document.getElementById('idDJAd').style.display = 
																	"block";
						}
						
						document.getElementById('idYTubeQ').value = '';
							
						if (window.PalmSystem)
						{
							window.PalmSystem.keyboardHide();
						}
					}
					else if (domTarget.id == 'idBanSavDet')
					{
						if (objOptions.bYTubeActive)
							objOptions.SetSkin();
						else
							ShowVidInframe('vkt6N1WJTdY');
					}
					else if (domTarget.id == 'idBanHidePlayer')
					{
						objOptions.YTubeHidePlayerCntTog();
					}
				}
				
				document.getElementById('idBannerDetailPane').className = 'classHideUp';
				
			}, false);
		
	},
	
	SpinRecOne: function(bSpin)
	{
		if (bSpin)
			this.recRecordOne.Start();
		else
			this.recRecordOne.Stop();
	},
	
	StartStateUpdates: function()
	{
		paneScrub.bRunStateUpdate = true;
		paneScrub.UpdateState();
	},
	
	StopStateUpdates: function()
	{
		paneScrub.bRunStateUpdate = false;
	},
	
	UpdateState: function()
	{
		//console.log("Entering UpdateState");
			
		this.PluginState = objwAMP.GetState(0);
			
		this.ScrubOne.SetEndTime(this.PluginState.EndTime);

		this.ScrubOne.SetCurTime(this.PluginState.CurTime);
		
		this.ScrubOne.SetBPM(this.PluginState.BPM);
		
		if (paneScrub.bRunStateUpdate)
		{
			paneScrub.timoutOneState = setTimeout(function() 
										{
											paneScrub.UpdateState();
										}, STATE_WAIT_PERIOD);
		}
		
		if ((objOptions.strLastFMSess) && (paneScrub.bLastFmDirty))
		{
			if (paneScrub.iLastFmCntDn)
				paneScrub.iLastFmCntDn--;
			else
			{
				var param = {"track": paneScrub.strLastFmTitle,
							"timestamp": ((new Date()).getTime()/1000)|0,
							"artist": paneScrub.strLastFmArtist
							};
				
				lastfm.track.scrobble(param, 
							objOptions.strLastFMSess, 
							{
								success: function(data, textStatus, jqXHR){
									console.log("success");
								}, error: function(jqXHR, textStatus, errorThrown){
									console.log("Last.fm scrobble error: " + jqXHR.responseText);
								}
							});
			
			
				paneScrub.iLastFmCntDn = 1;
				paneScrub.bLastFmDirty = 0;
			}	
		}
		
		paneScrub.iOneState = 0;
	},
	
	PlaceBannerText: function(strTitle, strArtist, iTrack)
	{
		document.getElementById('idBannerGetDetail').style.display = "block";
		paneScrub.ScrubOne.ClearCues();
	
		var strToBanner = iTrack ? "Turn Table 2: " : "Turn Table 1: ";
		strToBanner += strTitle;
		strToBanner += '(' + strArtist + ')';
		
/*		if (window.PalmSystem)
			window.PalmSystem.addBannerMessage(strToBanner);*/
		

		document.getElementById('idTitleOne').innerHTML = strTitle;
		document.getElementById('idArtistOne').innerHTML = strArtist;
	
		if (!window.PalmSystem)
			return;
	
		setTimeout(function()
		{
			try
			{
				win.postMessage("title=" + strTitle, "*");
				win.postMessage("artist=" + strArtist, "*");
			}
			catch(e)
			{
				win = window.open('dashboard.html', 
								  "_blank", 
								  "attributes={\"window\":\"dashboard\"}");

				if (win.PalmSystem)
				{
					win.PalmSystem.stageReady();
				}
				
				setTimeout(function()
				{
					win.postMessage("title=" + strTitle, "*");
					win.postMessage("artist=" + strArtist, "*");
				}, 500);
			}
		}, 500);
		
	},
	
	PlaceArt: function(strPath)
	{
		var str = objSongIndex.objQuickFindImg[strPath];
		
		if (!str || str.indexOf("/var/luna/data") == -1)
			str = "res/player/spinimg.png";
		
		paneScrub.recRecordOne.AddImage(str);
	},
	
	
	ToggleDJMode: function()
	{
		paneScrub.bDJModeOn = !paneScrub.bDJModeOn;
		
		if (paneScrub.bDJModeOn)
		{
			document.getElementById("idDJPlayer").style.display = "block";
			document.getElementById("idPlayer").style.display = "none";
			paneScrub.iPortULReference = 0;
			sceneDJ.ShowDJ();
		}
		else
		{
			sceneDJ.HideDJ();
			document.getElementById("idPlayer").style.display = "block";
			document.getElementById("idDJPlayer").style.display = "none";			
			SecondResize();
			panePlaylist.objScrollToUpdate.YScrollTo(-1, 0, true);
		}
	},
	
    ChangeOrientation: function (strOrientation)
	{
		if (paneScrub.bDJModeOn)
			return;
	
		var dom = document.getElementById('idEQPane');
		if (dom.className.charAt(0) != 's')
			dom.className = strOrientation;
		else
			dom.className = 'showEQ ' + strOrientation;
			
		document.getElementById("idScrubOne").className =
											'scrubwrap ' + strOrientation;

		document.getElementById("idRecOne").className =
											'classRecord ' + strOrientation;
		
		document.getElementById('idUnderRecord').className = 
													strOrientation;
			
		if (paneScrub.ScrubOne)
			paneScrub.ScrubOne.OrientChange();
			
		if (paneScrub.recRecordOne)
			paneScrub.recRecordOne.Init(this.ScrubOne);
			
		document.getElementById('idRecPaneOne').style.cssText = "";
		document.getElementById('idRecPaneOne').className = 
										'classRecordPane ' +
										strOrientation;
		paneScrub.iPortULReference = 0;
		paneScrub.tmoutPlayerMv = 0;
		paneScrub.bPlayerMv = 0;
		document.getElementById('idIndex').style.cssText = "";
		document.getElementById('idPLPane').style.cssText = "";
	},
	
	CleanUp: function()
	{
	
	}
}

var paneIndex =
{

	bFileOnly: true,
	iCurActive: NONE_SB,
	iWrapperOffsetTop: 70,
	iWrapperHeight: 546,
	
	InitMyPane: function ()
	{
		document.getElementById('idPickerNotReady')
							.addEventListener(START_EV, function()
		{
			document.getElementById('idPickerNotReady').style.display = "none";
			paneIndex.iCurActive = FOLDER_SB;
			paneIndex.DrawFolder();
		}, false);
		
		document.getElementById('idPLDragPane')
								.addEventListener('webkitTransitionEnd',
											paneIndex.HandleDragListPop,
											false);					  	 
		
		this.btnPlayAllIndex = 
					new wAMPIndex(document.getElementById('idPlayAll'),
											function()
											{
												paneIndex.DrawPlayAll();
											});
		this.btnSearchIndex = 
					new wAMPIndex(document.getElementById('idSearch'),
											function()
											{
												paneIndex.DrawSearch();
											});		
		this.btnAlbumIndex = 
					new wAMPIndex(document.getElementById('idAlbum'),
											function()
											{
												paneIndex.DrawAlbum();
											});
		this.btnArtistIndex = 
					new wAMPIndex(document.getElementById('idArtist'),
											function()
											{
												paneIndex.DrawArtist();
											});
		this.btnGenreIndex = 
						new wAMPIndex(document.getElementById('idGenre'),
											function()
											{
												paneIndex.DrawGenre();
											});
		this.btnTitleIndex = 
						new wAMPIndex(document.getElementById('idTitle'),
											function()
											{
												paneIndex.DrawTitle();
											});
		this.btnFolderIndex = 
						new wAMPIndex(document.getElementById('idFolder'),
											function()
											{
												paneIndex.DrawFolder();
											});
	},
		
	BuildPLDragList: function()
	{	
		
		paneIndex.PLScrollBox = new iScroll('idPLDragWrap', {
			onClick: function(event)
			{
				point = hasTouch ? event.changedTouches[0] : event;
			
				var iIndex = (-1 * this.y) + point.pageY - 
									paneIndex.iWrapperOffsetTop;  
				iIndex = 0|(iIndex / this.iIndivMargin );
				
				//console.log('You clicked:' + iIndex);
				
				objwAMP.OpenSong(0, iIndex);
				paneControls.PlayPauseChange(PLAYER_PLAY_STATE);
				panePlaylist.DrawNowPlaying(iIndex);
				panePlaylist.iIgnoreNextNP = 1;

			},
			altTouchTarget: document.getElementById('idPLDragCover'),
			onBeforeScrollStart: function(event)
			{
				if (!panePlaylist.arrayPLList || !panePlaylist.arrayPLList.length)
					return;
			
				event.preventDefault();

				var iIndex = 0|(-1 * this.y / this.iIndivMargin);
				
				this.iTouchDownIndex = iIndex;
				
				var iStartIndex;
				var strListHTML = "";
				
				if (iIndex > SCROLL_NUM_PRELOAD)
				{
					var strFirstChild = panePlaylist.jqobjPLToUpdate.innerHTML;

					iStartIndex = iIndex - SCROLL_NUM_PRELOAD;
					
					strListHTML = panePlaylist.arrayPLList[iStartIndex]
												.replace('" class=', 
												'" style="margin-top:' + 
												[iStartIndex * this.iIndivMargin] +
												'px;" class=');
												
					iStartIndex++;

				}
				else
				{
					iStartIndex = 0;
				}
				
				//console.log("strListHTML:" + strListHTML);
				
				var iEnd = Math.min(iIndex+SCROLL_NUM_PRELOAD, 
									panePlaylist.arrayPLList.length);
				
				strListHTML += panePlaylist.arrayPLList.slice(iStartIndex, iEnd).join('');
				
				this.iStartIndex = iStartIndex;
				this.iEndIndex = iEnd;
				
				panePlaylist.jqobjPLToUpdate.innerHTML = strListHTML;
				
			},
			onAnimationEnd: function()
			{	
				if (!panePlaylist.arrayPLList || !panePlaylist.arrayPLList.length)
					return;
				
				var vertY = -1 * this.y / this.iIndivMargin;
				vertY = Math.max(0|(vertY-10), 0);
				
				var strListHTML = panePlaylist.arrayPLList[vertY]
													.replace('" class=', 
													'" style="margin-top:' + 
													(vertY++ * this.iIndivMargin) +
													'px;" class=');
													
				strListHTML += panePlaylist.arrayPLList.slice(vertY, vertY+20).join('');
				
				panePlaylist.jqobjPLToUpdate.innerHTML = strListHTML;
				
				this.iTouchDownIndex = -1;
			},
			hScroll: false,
			onLongPress: function(lpX, lpY)
			{			
				var tmoutScroll = 0;
				
				document.getElementById('blockInput').style.display = "block";
				
				var iIndex = (-1 * this.y) + lpY - paneIndex.iWrapperOffsetTop; 
				iIndex = 0|(iIndex / this.iIndivMargin );
				
				//console.log('You clicked: ' + iIndex);
				paneIndex.PLScrollBox.IgnoreInput();
				
				panePlaylist.liParent = 
								document.getElementById('plyls_' + iIndex);
				panePlaylist.liClone = document.createElement('LI');
				panePlaylist.liClone.id = "deleteTheClone";
				panePlaylist.liClone.className = 
									panePlaylist.liParent.claseName + 
									' classDragging';
				
				panePlaylist.liClone.innerHTML = 
										panePlaylist.liParent.innerHTML;
				
				var posOffset = DomOffsetCalc(panePlaylist.liParent,
												-300,
												this.y);
				
				panePlaylist.liClone = 
						document.getElementById('idPlayer').appendChild(panePlaylist.liClone);
						
				panePlaylist.liClone.style.left = posOffset.left + 'px';
				panePlaylist.liClone.style.top = posOffset.top + 'px';

				panePlaylist.liParent.className = 
						panePlaylist.liParent.className.replace('classPLLiItem"', 
																'classPLLiItemDrag"');
				
				panePlaylist.arrayPLList[iIndex] = 
						panePlaylist.arrayPLList[iIndex].replace('classPLLiItem"', 
																'classPLLiItemDrag"');
				
				var dom = document.getElementById('idDeletePLItem')
				dom.className =	strSaveOrientation;
				
				var divTrash = new Object;
				divTrash.left = dom.offsetLeft;
				divTrash.top = dom.offsetTop;
				divTrash.right = divTrash.left + dom.offsetWidth;
				divTrash.bottom = divTrash.top + dom.offsetHeight;
				divTrash.bInDelElem = false;
				divTrash.me = dom;
			
				var dd = new Object();
				dd.original = posOffset.top;
				dd.startX = lpX;
				dd.startY = lpY;
				dd.newIndex = iIndex;
				dd.TopOut = paneIndex.iWrapperOffsetTop;
				dd.BottomOut = dd.TopOut + paneIndex.iWrapperHeight;
				dd.ScrollToUse = this;
				
				dom = 0;
			
				var funcHandleDrag = function(event)
				{	
					clearInterval(tmoutScroll);
					
					event.preventDefault();
					
					panePlaylist.liParent = 
									document.getElementById('plyls_' + iIndex);
					
					var point = hasTouch ? event.changedTouches[0] : event;
				  
					panePlaylist.liClone.style.webkitTransform = 'translate3d(' +
										(point.pageX - dd.startX) + 'px, ' +
										(point.pageY - dd.startY) +'px, 0px)';
					
					if ((point.pageX > divTrash.left) &&
							(point.pageX < divTrash.right) &&
							(point.pageY > divTrash.top) &&
							(point.pageY < divTrash.bottom))
					{
						if (!divTrash.bInDelElem)
						{
							divTrash.bInDelElem = true;
							divTrash.me.style.backgroundColor = "#DDD";
						}
					}
					else
					{
						if (divTrash.bInDelElem)
						{
							divTrash.bInDelElem = false;
							divTrash.me.style.backgroundColor = "";
						}
						
						var funcMoveItem = function()
						{
							panePlaylist.liParent = 
									document.getElementById('plyls_' + iIndex);
	
							
							var domPrev = panePlaylist.liParent.previousSibling;
							var domNext = panePlaylist.liParent.nextSibling;
							
							if (domPrev &&
								DomOffsetTopCalc(domPrev, dd.ScrollToUse.y) > point.pageY)
							{
								var tmp = panePlaylist.arrayPLList[dd.newIndex];
								panePlaylist.arrayPLList[dd.newIndex] = 
											panePlaylist.arrayPLList[dd.newIndex-1];
								panePlaylist.arrayPLList[dd.newIndex-1] = tmp;
								dd.newIndex--;
								paneIndex.PLScrollBox.YScrollTo(-2, 0, true);
							
							}
							else if (domNext &&
								DomOffsetTopCalc(domNext, dd.ScrollToUse.y) < point.pageY)
							{
								var tmp = panePlaylist.arrayPLList[dd.newIndex];
								panePlaylist.arrayPLList[dd.newIndex] = 
											panePlaylist.arrayPLList[dd.newIndex+1];
								panePlaylist.arrayPLList[dd.newIndex+1] = tmp;
								dd.newIndex++;
								paneIndex.PLScrollBox.YScrollTo(2, 0, true);
							}
							
							domNext = 0;
							domPrev = 0;
						}
						
						if (point.pageY < dd.TopOut)
						{
							tmoutScroll = setInterval(function()
							{
								funcMoveItem();
								if (dd.newIndex > 0)
								{
									paneIndex.PLScrollBox.YScrollTo(-5, 
																		0, 
																		true);
								}
							}, 30);
						}
						else if (point.pageY > dd.BottomOut)
						{
							tmoutScroll = setInterval(function()
							{
								funcMoveItem();
								if (dd.newIndex < 
											panePlaylist.arrayPLList.length-1)
								{
									paneIndex.PLScrollBox.YScrollTo(5, 
																	   0, 
																	   true);
								}
							}, 30);
						}
						else
						{
							funcMoveItem();
							paneIndex.PLScrollBox.stop();
						}
					}
				};
				
				var funcHandleDrop = function(event)
				{
					clearInterval(tmoutScroll);
					
					document.getElementById('blockInput').style.display = "none";
					
					panePlaylist.liParent = 
									document.getElementById('plyls_' + iIndex);
					
					var point = hasTouch ? event.changedTouches[0] : event;
					
					paneIndex.PLScrollBox.AllowInput();
					document.removeEventListener(MOVE_EV, funcHandleDrag, false);
					document.removeEventListener(END_EV, funcHandleDrop, false);
					
					divTrash.me.className =	'classHideTrash ' + strSaveOrientation;
					divTrash.me = 0;
					
					if (divTrash.bInDelElem)
					{
						panePlaylist.DeletePlaylistItem(panePlaylist.liParent);
						panePlaylist.liClone.parentNode
											.removeChild(panePlaylist.liClone);
						divTrash = 0;
						return;
					}
					
					divTrash = 0;
					
					panePlaylist.liClone.style.webkitTransitionDuration = ".3s";
					
					var funcSnapBackEnd = function()
					{
						panePlaylist.liClone.removeEventListener('webkitTransitionEnd',
															funcSnapBackEnd,
															false);
						
						panePlaylist.liClone.parentNode
											.removeChild(panePlaylist.liClone);
					};
					
					panePlaylist.liClone.addEventListener('webkitTransitionEnd',
															funcSnapBackEnd,
															false);
					
					panePlaylist.liClone.style.webkitTransform = 'translate3d(0px, ' + 
										(DomOffsetTopCalc(panePlaylist.liParent, 
															dd.ScrollToUse.y) -
												dd.original) +
										'px, 0px)';
				
										
					if (objwAMP.PLSize(0) < 2)
						return;
						
					objwAMP.MoveSong(0, iIndex, dd.newIndex);
				};

				
				document.addEventListener(MOVE_EV, funcHandleDrag, false);
				document.addEventListener(END_EV, funcHandleDrop, false);
			}
		});
		
		paneIndex.PLScrollBox.iTouchDownIndex = -1;
		paneIndex.PLScrollBox.iStartIndex = -1;
		paneIndex.PLScrollBox.iEndIndex = -1;
		paneIndex.PLScrollBox.iIndivMargin = PL_PANE_DIV_SIZE;
	},
	
	DrawPlayAll: function(arraySongList)
	{
		if (paneIndex.bFileOnly)
		{
			sceneSplash.StillLoadingMsg(PLAYALL_SB)
			return;
		}
		
		try
		{
			if (objSongIndex.PlayAll(0) == -1)
				return;
			if (objwAMP.OpenNextSong() == -1)
				return;
			objwAMP.SetMode(PLAY_MODE_SHUFFLE);
			paneControls.ModeControl(PLAY_MODE_SHUFFLE);
			paneControls.PlayPauseChange(PLAYER_PLAY_STATE);
		}
		catch(e)
		{
			document.getElementById('idTellUser').innerHTML = 
					'Fatal Error: Please report the following to blaclynx@yahoo.com:' + 
					e;
			document.getElementById('idButtonGoesHere').innerHTML = 'Ok';
			document.getElementById('idDialog').style.display = "block";
		}
	},
	
	DrawSearch: function(arraySongList)
	{
		if (paneIndex.bFileOnly)
		{
			sceneSplash.StillLoadingMsg(SEARCH_SB)
			return;
		}
	
		paneSongList.Empty();
		paneSongList.ClearSearch();
		document.getElementById('idSearchWrapper').className = 
												'classWrapper classTopLevelPickedCat';
		document.getElementById('idSearchFull').className = 
													'classPickerCat classShowPickedCat';
		
		panePlaylist.bPLDragOut = 0;
		paneSongList.Show(SEARCH_SB);
		
		if (window.PalmSystem)
		{
			//console.log("Keyboard Should Show");
			window.PalmSystem.keyboardShow(2);
		}
	},
	
	DrawAlbum: function(arraySongList)
	{
		if (paneIndex.bFileOnly)
		{
			sceneSplash.StillLoadingMsg(ALBUM_SB)
			return;
		}	
		
		paneSongList.Empty();

		document.getElementById('idAlbumWrapper').className +=
								' classShowPickedCat classTopLevelPickedCat ';
		
		panePlaylist.bPLDragOut = 0;
		paneSongList.Show(ALBUM_SB);
	},

	DrawArtist: function(arraySongList)
	{
		if (paneIndex.bFileOnly)
		{
			sceneSplash.StillLoadingMsg(ARTIST_SB)
			return;
		}
	
		paneSongList.Empty();

		document.getElementById('idArtistWrapper').className +=
								' classShowPickedCat classTopLevelPickedCat ';
		
		panePlaylist.bPLDragOut = 0;
		paneSongList.Show(ARTIST_SB);
	},
	
	DrawGenre: function(arraySongList)
	{
		if (paneIndex.bFileOnly)
		{
			sceneSplash.StillLoadingMsg(GENRE_SB)
			return;
		}
	
		paneSongList.Empty();
		document.getElementById('idGenreWrapper').className +=
								' classShowPickedCat classTopLevelPickedCat ';
		
		panePlaylist.bPLDragOut = 0;
		paneSongList.Show(GENRE_SB);
	},

	DrawTitle: function(arraySongList)
	{
		if (paneIndex.bFileOnly)
		{
			sceneSplash.StillLoadingMsg(TITLE_SB)
			return;
		}
	
		paneSongList.Empty();
		paneSongList.ClearTitleFilter();
		document.getElementById('idTitleWrapper').className += ' classTopLevelPickedCat';
		document.getElementById('idTitleCont').className += ' classShowPickedCat';
		
		panePlaylist.bPLDragOut = 0;
		paneSongList.Show(TITLE_SB);
	},
	
	DrawFolder: function(arraySongList)
	{
		paneSongList.Empty();
		paneSongList.BuildFileList();
	
		document.getElementById('idFolderWrapper').className +=
								' classShowPickedCat classTopLevelPickedCat ';
		
		panePlaylist.bPLDragOut = 0;
		paneSongList.Show(FOLDER_SB);
	},
	
	DrawList: function(arraySongList, bPLs)
	{
		paneSongList.Empty();
		
		if (bPLs)
			paneSongList.BuildPLs(arraySongList);
		else
			paneSongList.BuildRecentList(arraySongList);
	
		document.getElementById('idListWrapper').className +=
								' classShowPickedCat classTopLevelPickedCat ';
		
		panePlaylist.bPLDragOut = 0;
		paneSongList.Show(LIST_SB);
	},
	
	HandleDragListPop: function()
	{
		if (panePlaylist.bPLDragOut == 2)
			return;
		
		paneIndex.PLScrollBox.YScrollTo(0);
		panePlaylist.bPLDragOut = 2;
	},
	
	ShowPLDragPane: function()
	{
		if (panePlaylist.bPLDragOut)
			return;
			
		panePlaylist.bPLDragOut = 1;
		document.getElementById('idPlaylistScroller').innerHTML = "";
		document.getElementById('idPLDragPane').className = 
												"show " + strSaveOrientation;
		document.getElementById('idPLDropPane').className = 
												"show " + strSaveOrientation;
		document.getElementById('idPickerPaneInstructions').style.display = "block";
		panePlaylist.jqobjPLToUpdate = 
							document.getElementById('idPLDragScroller');
		panePlaylist.objScrollToUpdate = paneIndex.PLScrollBox;
	},
	
	HidePLDragPane: function()
	{
		document.getElementById('idPLDragScroller').innerHTML = "";
		panePlaylist.jqobjPLToUpdate = 
						document.getElementById('idPlaylistScroller');
		panePlaylist.objScrollToUpdate = panePlaylist.PLScrollBox;
		panePlaylist.PLScrollBox.YScrollTo(0);
		document.getElementById('idPLDragPane').className = strSaveOrientation;
		document.getElementById('idPLDropPane').className = strSaveOrientation;
		document.getElementById('idPickerPaneInstructions').style.display = "none";
	},
	
    ChangeOrientation: function (strOrientation)
	{
		document.getElementById('idIndex').className = strOrientation;
	
		if (document.getElementById('idPLDragPane').className.charAt(0) == 's')
			document.getElementById('idPLDragPane').className = 
													"show " + strOrientation;
		else
			document.getElementById('idPLDragPane').className = 
														strOrientation;
		
		if (document.getElementById('idPLDropPane').className.charAt(0) == 's')
			document.getElementById('idPLDropPane').className = 
													"show " + strOrientation;
		else
			document.getElementById('idPLDropPane').className = 
														strOrientation;
		
		document.getElementById('idPickerPaneInstructions')
					.className = strOrientation;
	},
	
	CleanUp: function()
	{
		document.getElementById('idPLDragPane')
								.removeEventListener('webkitTransitionEnd',
											paneIndex.HandleDragListPop,
											false);					  	 
		
		this.btnPlayAllIndex.CleanUp();
		this.btnPlayAllIndex = 0;
		this.btnSearchIndex.CleanUp();
		this.btnSearchIndex = 0;
		this.btnAlbumIndex.CleanUp();
		this.btnAlbumIndex = 0;
		this.btnArtistIndex.CleanUp();
		this.btnArtistIndex = 0;
		this.btnGenreIndex.CleanUp();
		this.btnGenreIndex = 0;
		this.btnTitleIndex.CleanUp();
		this.btnTitleIndex = 0;
		this.btnFolderIndex.CleanUp();
		this.btnFolderIndex = 0;
	}
}

var SCROLL_NUM_PRELOAD = 100;
var PL_PANE_DIV_SIZE = 52;

var panePlaylist =
{
	PLScrollBox: 0,
	bScrollerInit: 0,
	bFirstPL: 0,
	liClone: 0,
	liParent: 0,
	iPrevIndex: 0,
	bPLDragOut: 0,
	jqobjPLToUpdate: 0,
	objScrollToUpdate: 0,
	arrayPLList: [],
	objCurSong: 0,
	iWrapperOffsetTop: 0,
	iWrapperHeight: 344,
	
	InitMyPane: function()
	{	
		panePlaylist.jqobjPLToUpdate = 
							document.getElementById('idPlaylistScroller');
		panePlaylist.objScrollToUpdate = panePlaylist.PLScrollBox;
		
		document.getElementById('idPLHead').addEventListener(START_EV, function()
		{
			document.getElementById('idPLOptDetailPane').className = "";
		}, false);
		
		document.getElementById('idPLOptDetailPane').addEventListener(START_EV, function(ev)
			{
				
				var domTarget = ev.target;
							
				if (ev.target.nodeType != 1)
				{
					domTarget = ev.target.parentNode;
				}
				
				if (domTarget)
				{
					if (domTarget.id == 'idPLOptClear')
					{
						objwAMP.EmptyPlaylist(0);
					}
					else if (domTarget.id == 'idPLOptRec')
					{
						if (paneIndex.bFileOnly)
							sceneSplash.StillLoadingMsg(TITLE_SB)
						else
							paneIndex.DrawList(objwAMP.GetRecentPlay());
					}
					else if (domTarget.id == 'idPLOptFreq')
					{
						if (paneIndex.bFileOnly)
							sceneSplash.StillLoadingMsg(TITLE_SB)
						else
						{
							objOptions.GetMostPlayed(function(array)
							{
								paneIndex.DrawList(array);
							});
						}
					}
					else if (domTarget.id == 'idPLInternet')
					{
						document.getElementById('idInternetWrapper').className = 
																'classWrapper classTopLevelPickedCat';
						document.getElementById('idInternet').className = 
																	'classPickerCat classShowPickedCat';
						
						panePlaylist.bPLDragOut = 0;
						paneSongList.Show(INTERNET_SB);
						
						paneSongList.bInternetDirty = 1;
						
						if (window.PalmSystem)
						{
							//console.log("Keyboard Should Show");
							window.PalmSystem.keyboardShow(7);
						}
					}
					else if (domTarget.id == 'idPLPlaylists')
					{
						paneIndex.DrawList(objwAMP.arrayFoundPLs, 1);
					}
				}
				
				
				
				document.getElementById('idPLOptDetailPane').className = "classHidePLOpt";
				
			}, false);
		
		document.getElementById('idClearPL').addEventListener(START_EV, function()
		{
			objwAMP.EmptyPlaylist(0);
		}, false);
	
		if (panePlaylist.bFirstPL != 1)
		{
			objwAMP.RegisterPLCallback(function(arrayPL) 
			{
				panePlaylist.bFirstPL = 1;
			
				panePlaylist.DrawPlaylist(arrayPL);
			});
		}
		
		/*document.getElementById('idPLPaneFix').addEventListener(END_EV, function() 
		{
		
			if (panePlaylist.bFix)
			{	
				document.getElementById('idDeletePLItem').className =
													'classHideTrash ' + strSaveOrientation;
				panePlaylist.liClone.parentNode.removeChild(panePlaylist.liClone);
				panePlaylist.bFix = false;
			}
			
		}, false);*/
		
		objwAMP.RegisterNowPlaying(function(iIndex)
		{
			panePlaylist.DrawNowPlaying(iIndex);
		});
		
	},

	DeletePlaylistItem: function(jqobjDel)
	{
		var iIndex = Number(jqobjDel.id.substr(6));
		
		jqobjDel.parentNode.removeChild(jqobjDel);
		
		objwAMP.RemoveSong(iIndex);	
	},
	
	BuildScroller: function()
	{
		panePlaylist.PLScrollBox = new iScroll('idPlaylistWrapper', {
			altTouchTarget: document.getElementById('idPLCoverPane'),
			onBeforeScrollStart: function(event)
			{				
				if (!panePlaylist.arrayPLList || !panePlaylist.arrayPLList.length)
					return;
			
				event.preventDefault();

				var iIndex = 0|(-1 * this.y / this.iIndivMargin);
				
				this.iTouchDownIndex = iIndex;
				
				var iStartIndex;
				var strListHTML = "";
				
				if (iIndex > SCROLL_NUM_PRELOAD)
				{
					var strFirstChild = panePlaylist.jqobjPLToUpdate.innerHTML;

					iStartIndex = iIndex - SCROLL_NUM_PRELOAD;
					
					strListHTML = panePlaylist.arrayPLList[iStartIndex]
												.replace('" class=', 
												'" style="margin-top:' + 
												[iStartIndex * this.iIndivMargin] +
												'px;" class=');
												
					iStartIndex++;

				}
				else
				{
					iStartIndex = 0;
				}
				
				//console.log("strListHTML:" + strListHTML);
				
				var iEnd = Math.min(iIndex+SCROLL_NUM_PRELOAD, 
									panePlaylist.arrayPLList.length);
				
				strListHTML += panePlaylist.arrayPLList.slice(iStartIndex, iEnd).join('');
				
				this.iStartIndex = iStartIndex;
				this.iEndIndex = iEnd;
				
				panePlaylist.jqobjPLToUpdate.innerHTML = strListHTML;
				
			},
			onAnimationEnd: function()
			{	
				if (!panePlaylist.arrayPLList || !panePlaylist.arrayPLList.length)
					return;
				
				var vertY = -1 * this.y / this.iIndivMargin;
				vertY = Math.max(0|(vertY-10), 0);
				
				var strListHTML = panePlaylist.arrayPLList[vertY]
													.replace('" class=', 
													'" style="margin-top:' + 
													(vertY++ * this.iIndivMargin) +
													'px;" class=');
													
				strListHTML += panePlaylist.arrayPLList.slice(vertY, vertY+20).join('');
				
				panePlaylist.jqobjPLToUpdate.innerHTML = strListHTML;
				
				this.iTouchDownIndex = -1;
			},
			hScroll: false,
			onClick: function(event)
			{				
				point = hasTouch ? event.changedTouches[0] : event;
			
				var iIndex = (-1 * this.y) + point.pageY - 
									panePlaylist.iWrapperOffsetTop; 
									
				iIndex = 0|(iIndex / this.iIndivMargin );
				
				//console.log('You clicked:' + iIndex);
				
				objwAMP.OpenSong(0, iIndex);
				paneControls.PlayPauseChange(PLAYER_PLAY_STATE);
				panePlaylist.DrawNowPlaying(iIndex);

			},
			onLongPress: function(lpX, lpY)
			{			
				var tmoutScroll = 0;
				
				document.getElementById('blockInput').style.display = "block";
				
				var iIndex = (-1 * this.y) + lpY - panePlaylist.iWrapperOffsetTop; 
				iIndex = 0|(iIndex / this.iIndivMargin );
				
				//console.log('You clicked: ' + iIndex);
				panePlaylist.PLScrollBox.IgnoreInput();
				
				panePlaylist.liParent = 
								document.getElementById('plyls_' + iIndex);
				panePlaylist.liClone = document.createElement('LI');
				panePlaylist.liClone.id = "deleteTheClone";
				panePlaylist.liClone.className = 
									panePlaylist.liParent.claseName + 
									' classDragging';
				
				panePlaylist.liClone.innerHTML = 
										panePlaylist.liParent.innerHTML;
				
				var posOffset = DomOffsetCalc(panePlaylist.liParent,
												2 * paneScrub.iPortULReference,
												this.y);
				
				panePlaylist.liClone = 
						document.getElementById('idPlayer').appendChild(panePlaylist.liClone);
						
				panePlaylist.liClone.style.left = posOffset.left + 'px';
				panePlaylist.liClone.style.top = posOffset.top + 'px';

				panePlaylist.liParent.className = 
						panePlaylist.liParent.className.replace('classPLLiItem"', 
																'classPLLiItemDrag"');
				
				panePlaylist.arrayPLList[iIndex] = 
						panePlaylist.arrayPLList[iIndex].replace('classPLLiItem"', 
																'classPLLiItemDrag"');
				
				var dom = document.getElementById('idDeletePLItem')
				dom.className =	strSaveOrientation;
				
				var divTrash = new Object;
				divTrash.left = dom.offsetLeft;
				divTrash.top = dom.offsetTop;
				divTrash.right = divTrash.left + dom.offsetWidth;
				divTrash.bottom = divTrash.top + dom.offsetHeight;
				divTrash.bInDelElem = false;
				divTrash.me = dom;
			
				var dd = new Object();
				dd.original = posOffset.top;
				dd.startX = lpX;
				dd.startY = lpY;
				dd.newIndex = iIndex;
				dd.TopOut = panePlaylist.iWrapperOffsetTop;
				dd.BottomOut = dd.TopOut + panePlaylist.iWrapperHeight;
				dd.ScrollToUse = this;
				
				var funcHandleDrag = function(event)
				{				
					clearInterval(tmoutScroll);
					
					event.preventDefault();
					
					panePlaylist.liParent = 
									document.getElementById('plyls_' + iIndex);
					
					var point = hasTouch ? event.changedTouches[0] : event;
				  
					panePlaylist.liClone.style.webkitTransform = 'translate3d(' +
										(point.pageX - dd.startX) + 'px, ' +
										(point.pageY - dd.startY) +'px, 0px)';
					
					if ((point.pageX > divTrash.left) &&
							(point.pageX < divTrash.right) &&
							(point.pageY > divTrash.top) &&
							(point.pageY < divTrash.bottom))
					{
						if (!divTrash.bInDelElem)
						{
							divTrash.bInDelElem = true;
							divTrash.me.style.backgroundColor = "#DDD";
						}
					}
					else
					{
						if (divTrash.bInDelElem)
						{
							divTrash.bInDelElem = false;
							divTrash.me.style.backgroundColor = "";
						}
						
						var funcMoveItem = function()
						{
							panePlaylist.liParent = 
									document.getElementById('plyls_' + iIndex);
	
							
							var domPrev = panePlaylist.liParent.previousSibling;
							var domNext = panePlaylist.liParent.nextSibling;
							
							if (domPrev &&
								DomOffsetTopCalc(domPrev, dd.ScrollToUse.y) > point.pageY)
							{
								var tmp = panePlaylist.arrayPLList[dd.newIndex];
								panePlaylist.arrayPLList[dd.newIndex] = 
											panePlaylist.arrayPLList[dd.newIndex-1];
								panePlaylist.arrayPLList[dd.newIndex-1] = tmp;
								dd.newIndex--;
								panePlaylist.PLScrollBox.YScrollTo(-2, 0, true);
							
							}
							else if (domNext &&
								DomOffsetTopCalc(domNext, dd.ScrollToUse.y) < point.pageY)
							{
								var tmp = panePlaylist.arrayPLList[dd.newIndex];
								panePlaylist.arrayPLList[dd.newIndex] = 
											panePlaylist.arrayPLList[dd.newIndex+1];
								panePlaylist.arrayPLList[dd.newIndex+1] = tmp;
								dd.newIndex++;
								panePlaylist.PLScrollBox.YScrollTo(2, 0, true);
							}
							
							domNext = 0;
							domPrev = 0;
						}
						
						if (point.pageY < dd.TopOut)
						{
							tmoutScroll = setInterval(function()
							{
								funcMoveItem();
								if (dd.newIndex > 0)
								{
									panePlaylist.PLScrollBox.YScrollTo(-5, 
																		0, 
																		true);
								}
							}, 30);
						}
						else if (point.pageY > dd.BottomOut)
						{
							tmoutScroll = setInterval(function()
							{
								funcMoveItem();
								if (dd.newIndex < 
											panePlaylist.arrayPLList.length-1)
								{
									panePlaylist.PLScrollBox.YScrollTo(5, 
																	   0, 
																	   true);
								}
							}, 30);
						}
						else
						{
							funcMoveItem();
							panePlaylist.PLScrollBox.stop();
						}
					}
				};
				
				var funcHandleDrop = function(event)
				{
					clearInterval(tmoutScroll);
					
					document.getElementById('blockInput').style.display = "none";
					
					panePlaylist.liParent = 
									document.getElementById('plyls_' + iIndex);
					
					var point = hasTouch ? event.changedTouches[0] : event;
					
					panePlaylist.PLScrollBox.AllowInput();
					document.removeEventListener(MOVE_EV, funcHandleDrag, false);
					document.removeEventListener(END_EV, funcHandleDrop, false);
					
					divTrash.me.className =	'classHideTrash ' + strSaveOrientation;
					divTrash.me = 0;
					
					if (divTrash.bInDelElem)
					{
						panePlaylist.DeletePlaylistItem(panePlaylist.liParent);
						panePlaylist.liClone.parentNode
											.removeChild(panePlaylist.liClone);
						divTrash = 0;
						return;
					}
					
					divTrash = 0;
					
					panePlaylist.liClone.style.webkitTransitionDuration = ".3s";
					
					var funcSnapBackEnd = function()
					{
						panePlaylist.liClone.removeEventListener('webkitTransitionEnd',
															funcSnapBackEnd,
															false);
						
						panePlaylist.liClone.parentNode
											.removeChild(panePlaylist.liClone);
					};
					
					panePlaylist.liClone.addEventListener('webkitTransitionEnd',
															funcSnapBackEnd,
															false);
					
					panePlaylist.liClone.style.webkitTransform = 'translate3d(0px, ' + 
										(DomOffsetTopCalc(panePlaylist.liParent, 
															dd.ScrollToUse.y) -
												dd.original) +
										'px, 0px)';
				
										
					if (objwAMP.PLSize(0) < 2)
						return;
						
					objwAMP.MoveSong(0, iIndex, dd.newIndex);
				};
				
				document.addEventListener(MOVE_EV, funcHandleDrag, false);
				document.addEventListener(END_EV, funcHandleDrop, false);
			}
		});
		
		panePlaylist.PLScrollBox.iTouchDownIndex = -1;
		panePlaylist.PLScrollBox.iStartIndex = -1;
		panePlaylist.PLScrollBox.iEndIndex = -1;
		panePlaylist.PLScrollBox.iIndivMargin = PL_PANE_DIV_SIZE;
	},

	
	DrawNowPlaying: function(iCurPlayIndex)
	{		
		panePlaylist.arrayPLList[panePlaylist.iPrevIndex] = 
							panePlaylist.arrayPLList[panePlaylist.iPrevIndex].replace(
																'class="nowplaying ',
																  'class="');
						
		panePlaylist.arrayPLList[iCurPlayIndex] = 
					panePlaylist.arrayPLList[iCurPlayIndex].replace('class="',
														'class="nowplaying ');
			  
		panePlaylist.PLScrollBox.YScrollTo(-1 * iCurPlayIndex * PL_PANE_DIV_SIZE);
		
		panePlaylist.iPrevIndex = iCurPlayIndex;
		
		panePlaylist.objCurSong = objwAMP.arrayPlaylist[0][iCurPlayIndex];
	},
	
	DrawPlaylist: function(arrayPL)
	{	
		if (!panePlaylist.bScrollerInit)
		{
			panePlaylist.bScrollerInit = true;
			panePlaylist.BuildScroller();
			paneIndex.BuildPLDragList();
			panePlaylist.objScrollToUpdate = panePlaylist.PLScrollBox;
		}
	
		panePlaylist.iPrevIndex = 0;
		
		panePlaylist.arrayPLList.length = 0;
		
		if (!arrayPL || !arrayPL.length)
		{
			document.getElementById('idPLDragScroller').innerHTML = "";
			document.getElementById('idPlaylistScroller').innerHTML = "";
		}
		else
		{
			for(var i=0; i<arrayPL.length; i++)
			{
				var strListHTML = "";
			
				var objSong = arrayPL[i];
				
				if (!objSong)
					continue;
				
				strListHTML = '<li id="plyls_';
				strListHTML += Number(i).toString();
				strListHTML += '" class="classPLLiItem">';
				strListHTML += objSong.title.substr(0, 24);
				if (objSong.title.length > 24)
					strListHTML += "...";
				strListHTML += '<br>&nbsp;&nbsp;';
				strListHTML += objSong.artist.substr(0, 22);
				if (objSong.artist.length > 22)
					strListHTML += "...";
				strListHTML += '</li>';
				
				panePlaylist.arrayPLList.push(strListHTML);
			}
		}
		
		document.getElementById('idPLDragScroller').style.height = 
						(PL_PANE_DIV_SIZE * panePlaylist.arrayPLList.length) + "px";
		document.getElementById('idPlaylistScroller').style.height = 
						(PL_PANE_DIV_SIZE * panePlaylist.arrayPLList.length) + "px";
		
		panePlaylist.PLScrollBox.RecalcBottom();
		paneIndex.PLScrollBox.RecalcBottom();
		
		panePlaylist.iPrevIndex = objwAMP.GetIndex(0);
		
		if ((panePlaylist.arrayPLList.length) && 
			(panePlaylist.iPrevIndex < panePlaylist.arrayPLList.length))
		{
			panePlaylist.arrayPLList[panePlaylist.iPrevIndex] = 
					panePlaylist.arrayPLList[panePlaylist.iPrevIndex].replace(
														'class="',
														'class="nowplaying ');
		}
		
		panePlaylist.objScrollToUpdate.YScrollTo(-1, 0, true);
	},
	
	ChangeOrientation: function(strOrientation)
	{
		if (strOrientation == "portrait")
			panePlaylist.iWrapperOffsetTop = 302;
		else
			panePlaylist.iWrapperOffsetTop = 192;
		
		document.getElementById('idPLPane').className = strOrientation;

		document.getElementById('idPLOptHider').className = strOrientation;
		
		var dom = document.getElementById('idDeletePLItem');
		
		if (dom.className.charAt(0) == 'c')
			dom.className = "classHideTrash " + strOrientation;
		else
			dom.className = strOrientation;
		
		if (panePlaylist.bScrollerInit)
		{
			panePlaylist.PLScrollBox.RecalcBottom();
			paneIndex.PLScrollBox.RecalcBottom();
			panePlaylist.objScrollToUpdate.YScrollTo(-1, 0, true);
		}
	}
}

var TITLE_LI_HEIGHT = 40;

/************************************
 *
 * paneSongList
 *
 ************************************/
var paneSongList =
{
	strFilterCls: 0,
	objFile: 0,
	objBufferedObj: 0,
	BufferedArrayTiles: 0,
	inInsert: 0,
	FolderScrollBox: 0,
	
	// Only empty wrappers that were used
	bArtistDirty: 0,
	bGenreDirty: 0,
	bAlbumDirty: 0,
	bAlbumViewDirty: 0,
	bTitleDirty: 0,
	bFolderDirty: 0,
	bSearchDirty: 0,
	bListDirty: 0,
	bYTubeDirty: 0,
	bInternetDirty: 0,
	bShowFavOnly: 0,
	
	arrayQuickLookUp: [[],[]],
	quickLookUpAdj: [],
	arrayQuickScrDom: [],
	
	QuickScrollR: function(e)
	{
		var point = hasTouch ? e.touches[0] : e;
		
		e.preventDefault(e);
		
		var dom = document.getElementById('idFastScrollR');
		
		var iPos = point.pageY - DomOffsetTopCalc(dom);
		
		dom = dom.offsetHeight;
		iPos = iPos/dom;
		
		var arrayVis = Filter(document.getElementById('idPickerWrapper').childNodes,
										function(elem)
										{
											return (elem.nodeType == 1) && 
													(elem.className
													.indexOf('classShowPickedCat') != -1);
										});
	
		if (arrayVis.length == 1)
		{
				switch (arrayVis[0].id)
				{
				case "idGenreWrapper":
					iPos *= paneSongList.GenreScrollBox.scrollerH;
					paneSongList.GenreScrollBox.YScrollTo(-iPos);
					break;
				case "idArtistWrapper":
					iPos *= paneSongList.ArtistScrollBox.scrollerH;
					paneSongList.ArtistScrollBox.YScrollTo(-iPos);
					break;
				case "idAlbumWrapper":
					iPos *= paneSongList.AlbumScrollBox.scrollerH;
					paneSongList.AlbumScrollBox.YScrollTo(-iPos);
					break;
				case "idTitleCont":
					iPos *= paneSongList.TitleScrollBox.scrollerH;
					paneSongList.TitleScrollBox.YScrollTo(-iPos);
					break;
				case "idAlbViewWrapper":
					iPos *= paneSongList.AlbViewScrollBox.scrollerH;
					paneSongList.AlbViewScrollBox.YScrollTo(-iPos);
					break;
				case "idFolderWrapper":
					iPos *= paneSongList.FolderScrollBox.scrollerH;
					paneSongList.FolderScrollBox.YScrollTo(-iPos);
					break;
				case "idSearchFull":
					iPos *= paneSongList.SearchScrollBox.scrollerH;
					paneSongList.SearchScrollBox.YScrollTo(-iPos);
					break;
				case "idYTubeWrapper":
					iPos *= paneSongList.YTubeScrollBox.scrollerH;
					paneSongList.YTubeScrollBox.YScrollTo(-iPos);
					break;
				case "idListWrapper":
					iPos *= paneSongList.ListScrollBox.scrollerH;
					paneSongList.ListScrollBox.YScrollTo(-iPos);
					break;
				}
			}
			else
			{
				// Figure out which side has which div
				//	then figure out which side the user clicked
				var iIndex = 0;
			
				// iIndex = classSecLevelPickedCat
				if (arrayVis[1].className.indexOf('classSecLevelPickedCat') != -1)
					iIndex = 1;
				
				switch (arrayVis[iIndex].id)
				{
				case "idGenreWrapper":
					iPos *= paneSongList.GenreScrollBox.scrollerH;
					paneSongList.GenreScrollBox.YScrollTo(-iPos);
					break;
				case "idArtistWrapper":
					iPos *= paneSongList.ArtistScrollBox.scrollerH;
					paneSongList.ArtistScrollBox.YScrollTo(-iPos);
					break;
				case "idAlbumWrapper":
					iPos *= paneSongList.AlbumScrollBox.scrollerH;
					paneSongList.AlbumScrollBox.YScrollTo(-iPos);
					break;
				case "idTitleCont":
					iPos *= paneSongList.TitleScrollBox.scrollerH;
					paneSongList.TitleScrollBox.YScrollTo(-iPos);
					break;
				}
			};
	},
	
	QuickScrollL: function(e)
	{
		var point = hasTouch ? e.touches[0] : e;
		
		e.preventDefault(e);
		
		var dom = document.getElementById('idFastScrollR');
		
		var iPos = point.pageY - DomOffsetTopCalc(dom);
		
		dom = dom.offsetHeight;
		iPos = iPos/dom;
		
		var arrayVis = Filter(document.getElementById('idPickerWrapper').childNodes,
										function(elem)
										{
											return (elem.nodeType == 1) && 
													(elem.className
													.indexOf('classShowPickedCat') != -1);
										});
	
		if (arrayVis.length > 1)
		{
				// Figure out which side has which div
				//	then figure out which side the user clicked
				var iIndex = 1;
			
				// iIndex = classSecLevelPickedCat
				if (arrayVis[1].className.indexOf('classSecLevelPickedCat') != -1)
					iIndex = 0;
				
				switch (arrayVis[iIndex].id)
				{
				case "idGenreWrapper":
					iPos *= paneSongList.GenreScrollBox.scrollerH;
					paneSongList.GenreScrollBox.YScrollTo(-iPos);
					break;
				case "idArtistWrapper":
					iPos *= paneSongList.ArtistScrollBox.scrollerH;
					paneSongList.ArtistScrollBox.YScrollTo(-iPos);
					break;
				case "idAlbumWrapper":
					iPos *= paneSongList.AlbumScrollBox.scrollerH;
					paneSongList.AlbumScrollBox.YScrollTo(-iPos);
					break;
				case "idTitleCont":
					iPos *= paneSongList.TitleScrollBox.scrollerH;
					paneSongList.TitleScrollBox.YScrollTo(-iPos);
					break;
				}
			};
	},
	
	//*********************
	// InitMyPane
	//
	// Called on program load
	//*********************/
	InitMyPane: function()
	{
		var funcURLCallback = function(strUrl)
		{	
			$('#idLoadIndicator')[0].style.display = "block";
			
			$.ajax({
				url: strUrl,
				type:'HEAD',
				error: function()
				{
					sceneDialog.funcClick = function()
					{
						$('#idLoadIndicator')[0].style.display = "none";
					};
				
					document.getElementById('idTellUser').innerHTML = 
							"Unable to open link, please check to make sure you entered it correctly.";
				
					sceneDialog.Open(0, "Ok");
				},
				success: function()
				{
					objOptions.UpdateOption(OPT_ID_URL_LAST, strUrl);
					
					$('#idOpenLink')[0].style.display = "block";
					objwAMP.HandleUrl(document.getElementById('idURLFilter').value,
								  0, 
								  xmlfunc, 
								  m3uFunc, 
								  musFunc);
				}
			});
		
		}
		
		objOptions.URLHistSetButtons(document.getElementById('idURLFilter'),
							document.getElementById('idInternetBack'),
							document.getElementById('idInternetForward'),
							document.getElementById('idInternetBookMark'),
							funcURLCallback);
		
		paneSongList.arrayQuickScrDom[0] = 
					document.getElementById('idFastScrollR');
		
		paneSongList.arrayQuickScrDom[1] = 
					document.getElementById('idFastScrollL');
		
		document.getElementById('idFastScrollL').style.display = 'none';
		
		document.getElementById('idFastScrollR').addEventListener(START_EV,
				paneSongList.QuickScrollR, false);

		document.getElementById('idFastScrollR').addEventListener(MOVE_EV,
				paneSongList.QuickScrollR, false);

		document.getElementById('idFastScrollL').addEventListener(START_EV,
				paneSongList.QuickScrollL, false);

		document.getElementById('idFastScrollL').addEventListener(MOVE_EV,
				paneSongList.QuickScrollL, false);

		paneSongList.InternetScrollBox = new iScroll('idInternetWrapper',
			{
				onClick: function(e)
				{
					var target = e.target;
					if (target.nodeType != 1)
						target = target.parentNode;
			
					if (target.className != 'xmltarget')
						return;
					
					var iIndex = Number(target.id.substr(4));
				
					var strPath = paneSongList.remoteXML[iIndex].path;
					
					objwAMP.DirectOpen(strPath, 0);

				},
				hScroll: false,
				onLongPress: paneSongList.DragFunction
			});
		
		// Set up the scrollers
		paneSongList.GenreScrollBox = new iScroll('idGenreWrapper', {
			onRefresh: function()
			{
				if (this.wrapper.className.indexOf('classSecLevelPickedCat') != -1)
				{
					paneSongList.PrepStickyHeader('idGenreUL', 1, 
										this.scrollerH, 'idGenreStickyHead');
					this.iPrepNum = 1;
				}
				else
				{
					this.iPrepNum = 0;
					paneSongList.PrepStickyHeader('idGenreUL', 0, 
										this.scrollerH, 'idGenreStickyHead');
				}
				paneSongList.bGenreDirty = 1;
			},
			onAnimationEnd: function()
			{
				if (visPlayMode[0])
					FastDraw();
			},
			callEachPos: function(x, y)
			{
				paneSongList.StickyHeader(y, 'clpgen_', 
								'idGenreStickyHead', 30, this.iPrepNum);
			},
			onBeforeScrollStart: function(event)
			{
				if (visPlayMode[0])
					SlowDraw();
				event.preventDefault();
			},
			onClick: function(e)
			{
				var domTarget = e.target;
				
				if (domTarget.className == 'classEasyExclude')
					domTarget = domTarget.parentNode;
			
				if (domTarget.className == 'classCatImgBox')
				{
					var point = hasTouch ? e.changedTouches[0] : e;
				
					var offset = DomOffsetCalc(domTarget, 0, this.y);
					
					if (point.pageX < (offset.left + 40) &&
						point.pageY < (offset.top + 40))
					{
						domTarget = domTarget.parentNode;
						paneSongList.HandleFavoriteEvent(domTarget, PLNAME_DESC_GENRE);
						return;
					}
				}
				else
					return;
			
				domTarget = domTarget.parentNode;
				var strID = domTarget.id;
							
				var classFilter = 'class' + strID;

				paneSongList.strFilterCls = classFilter;

				document.getElementById('idPickerButDiv').style.display = "block";
				
				var dom = document.getElementById('idGenreWrapper');
				
				if (dom.className.indexOf("classCatSideView") != -1)
				{
					var domAP = document.getElementById('idArtistUL');
					domAP.innerHTML = domAP.innerHTML.replace(/y: list-item;/g, 'y: none;')
													 .replace(/classUniSubPan/g, 
																	'HclassTitleSubPaneHide');
			
					var elements = domAP.getElementsByClassName(classFilter);
			
					var i = elements.length;
			
					while(i--)
					{
						elements[i].style.display = 'list-item';
						elements[i].parentNode.className = 'classUniSubPan'
					}
				
					elements = 0;
				
					document.getElementById('idArtistWrapper').className +=
									' classShowPickedCat classSecLevelPickedCat ';							
					paneSongList.ArtistScrollBox.RecalcBottom();
					paneSongList.ArtistScrollBox.YScrollTo(0);
				}
				else
				{
					var tmp = paneSongList.arrayQuickScrDom[0];
					
					(paneSongList.arrayQuickScrDom[0] =
							paneSongList.arrayQuickScrDom[1]).style.display = 'block';
		
					paneSongList.arrayQuickScrDom[1] = tmp; 
				
					var domAP = document.getElementById('idArtistUL');
					domAP.innerHTML = domAP.innerHTML.replace(/y: list-item;/g, 'y: none;')
													 .replace(/classUniSubPan/g, 
																	'HclassTitleSubPaneHide');
			
					var elements = domAP.getElementsByClassName(classFilter);
			
					var i = elements.length;
			
					while(i--)
					{
						elements[i].style.display = 'list-item';
						elements[i].parentNode.className = 'classUniSubPan'
					}
				
					elements = 0;
			
					document.getElementById('idArtistWrapper').className +=
									' classShowPickedCat classSecLevelPickedCat ';							
					paneSongList.ArtistScrollBox.RecalcBottom();
					paneSongList.ArtistScrollBox.YScrollTo(0);
					
					dom.className = 
						"classWrapper classPickerCat classCatSideView classShowPickedCat";
					
					dom.style.width = "165px";
					
					paneSongList.GenreScrollBox.RecalcBottom();
					var iScrollTo = DomOffsetTopCalc(domTarget) - DomOffsetTopCalc(dom);
					paneSongList.GenreScrollBox.YScrollTo(-iScrollTo + 30);
				}
				
				dom = 0;
			},
			hScroll: false,
			onLongPress: paneSongList.DragFunction
			});
		
		paneSongList.ArtistScrollBox = new iScroll('idArtistWrapper', {
			onRefresh: function()
			{
				if (this.wrapper.className.indexOf('classSecLevelPickedCat') != -1)
				{
					paneSongList.PrepStickyHeader('idArtistUL', 1, 
												this.scrollerH, 'idArtistStickyHead');
					this.iPrepNum = 1;
				}
				else
				{
					this.iPrepNum = 0;
					paneSongList.PrepStickyHeader('idArtistUL', 0, 
												this.scrollerH, 'idArtistStickyHead');
				}
				paneSongList.bArtistDirty = 1;
			},
			onAnimationEnd: function()
			{
				if (visPlayMode[0])
					FastDraw();
			},
			onBeforeScrollStart: function(event)
			{
				if (visPlayMode[0])
					SlowDraw();
				event.preventDefault();
			},
			callEachPos: function(x, y)
			{
				paneSongList.StickyHeader(y, 'clpart_',
											'idArtistStickyHead', 
											30,
											this.iPrepNum);
			},
			onClick: function(e)
			{
				var domTarget = e.target;
			
				if (domTarget.className == 'classEasyExclude')
					domTarget = domTarget.parentNode;
			
				if (domTarget.className == 'classCatImgBox')
				{
					var point = hasTouch ? e.changedTouches[0] : e;
				
					var offset = DomOffsetCalc(domTarget, 0, this.y);
					
					if (point.pageX < (offset.left + 40) &&
						point.pageY < (offset.top + 40))
					{
						domTarget = domTarget.parentNode;
						paneSongList.HandleFavoriteEvent(domTarget, PLNAME_DESC_ARTIST);
						return;
					}
				}
				else
					return;
			
				domTarget = domTarget.parentNode;
				var strID = domTarget.id;
							
				var classFilter = 'class' + strID;

				paneSongList.strFilterCls = classFilter;

				document.getElementById('idPickerButDiv').style.display = "block";
				
				var dom = document.getElementById('idArtistWrapper');
				
				if (dom.className.indexOf("classSecLevelPickedCat") != -1)
				{
					document.getElementById('idGenreWrapper').className = 
										"classWrapper classPickerCat";
				
					var domAP = document.getElementById('idAlbumPicker');
					domAP.innerHTML = domAP.innerHTML.replace(/y: list-item;/g, 'y: none;')
													 .replace(/classUniSubPan/g, 
																	'HclassTitleSubPaneHide');
			
					var elements = domAP.getElementsByClassName(classFilter);
			
					var i = elements.length;
			
					while(i--)
					{
						elements[i].style.display = 'list-item';
						elements[i].parentNode.className = 'classUniSubPan'
					}
				
					
					document.getElementById('idAlbumWrapper').className +=
									' classShowPickedCat classSecLevelPickedCat ';							
					paneSongList.AlbumScrollBox.RecalcBottom();
					paneSongList.AlbumScrollBox.YScrollTo(0);
					
					dom.className = 
						"classWrapper classPickerCat classCatSideView classShowPickedCat";
					
					dom.style.width = "165px";
					
					paneSongList.ArtistScrollBox.RecalcBottom();
					var iScrollTo = DomOffsetTopCalc(domTarget) -
							DomOffsetTopCalc(dom);
					paneSongList.ArtistScrollBox.YScrollTo(-iScrollTo + 30);
					
				}
				else if (dom.className.indexOf("classCatSideView") != -1)
				{
					var domAP = document.getElementById('idAlbumPicker');
					domAP.innerHTML = domAP.innerHTML.replace(/y: list-item;/g, 'y: none;')
													 .replace(/classUniSubPan/g, 
																	'HclassTitleSubPaneHide');
			
					var elements = domAP.getElementsByClassName(classFilter);
			
					var i = elements.length;
			
					while(i--)
					{
						elements[i].style.display = 'list-item';
						elements[i].parentNode.className = 'classUniSubPan'
					}
			
					document.getElementById('idAlbumWrapper').className +=
									' classShowPickedCat classSecLevelPickedCat ';							
					paneSongList.AlbumScrollBox.RecalcBottom();
					paneSongList.AlbumScrollBox.YScrollTo(0);
							
				}
				else
				{
					paneSongList.arrayQuickScrDom[0] = 
								document.getElementById('idFastScrollL');
		
					paneSongList.arrayQuickScrDom[1] = 
								document.getElementById('idFastScrollR');

					document.getElementById('idFastScrollL').style.display = 'block';
					
					var domAP = document.getElementById('idAlbumPicker');
					domAP.innerHTML = domAP.innerHTML.replace(/y: list-item;/g, 'y: none;')
													 .replace(/classUniSubPan/g, 
																	'HclassTitleSubPaneHide');
			
					var elements = domAP.getElementsByClassName(classFilter);
			
					var i = elements.length;
			
					while(i--)
					{
						elements[i].style.display = 'list-item';
						elements[i].parentNode.className = 'classUniSubPan'
					}
			
					document.getElementById('idAlbumWrapper').className +=
									' classShowPickedCat classSecLevelPickedCat ';							
					paneSongList.AlbumScrollBox.RecalcBottom();
					paneSongList.AlbumScrollBox.YScrollTo(0);
							
					dom.className = 
						"classWrapper classPickerCat classCatSideView classShowPickedCat";
					
					dom.style.width = "165px";
					
					paneSongList.ArtistScrollBox.RecalcBottom();
					var iScrollTo = DomOffsetTopCalc(domTarget) -
							DomOffsetTopCalc(dom);
					paneSongList.ArtistScrollBox.YScrollTo(-iScrollTo + 30);
				}
				
				dom = 0;
			},
			hScroll: false,
			onLongPress: paneSongList.DragFunction
			});
	
		paneSongList.AlbumScrollBox = new iScroll('idAlbumWrapper', {
			onRefresh: function()
			{
				if (this.wrapper.className.indexOf('classSecLevelPickedCat') != -1)
				{
					paneSongList.PrepStickyHeader('idAlbumPicker', 1, 
												this.scrollerH, 'idAlbumStickyHead');
					this.iPrepNum = 1;
				}
				else
				{
					this.iPrepNum = 0;
					paneSongList.PrepStickyHeader('idAlbumPicker', 0, 
												this.scrollerH, 'idAlbumStickyHead');
				}
				paneSongList.bAlbumDirty = 1;
			},
			onAnimationEnd: function()
			{
				if (visPlayMode[0])
					FastDraw();
			},
			callEachPos: function(x, y)
			{
				paneSongList.StickyHeader(y, 
										'clpalb_', 
										'idAlbumStickyHead', 
										30,
										this.iPrepNum);
			},
			onBeforeScrollStart: function(event)
			{
				if (visPlayMode[0])
					SlowDraw();
				event.preventDefault();
			},
			onClick: function(e)
			{
				var domTarget = e.target;
			
				if (domTarget.className == 'classImgHolder')
				{
					var point = hasTouch ? e.changedTouches[0] : e;
				
					var offset = DomOffsetCalc(domTarget, 0, this.y);
					
					if (point.pageX < (offset.left + 60) &&
						point.pageY < (offset.top + 50))
					{
						domTarget = domTarget.parentNode;
						paneSongList.HandleFavoriteEvent(domTarget, PLNAME_DESC_ALBUM);
						return;
					}
				}
				else
					return;
			
				domTarget = domTarget.parentNode;
							
				var classFilter = 'classAlb_' + domTarget.id.substr(4);
				
				paneSongList.strFilterCls = classFilter;
				
				document.getElementById('idPickerButDiv').style.display = "block";
				
				var dom = document.getElementById('idAlbumWrapper');
				
				if (dom.className.indexOf("classSecLevelPickedCat") != -1)
				{					
					document.getElementById('idArtistWrapper').className = 
										"classWrapper classPickerCat";
					
					document.getElementById('idAlbViewScroller').innerHTML = 
								domTarget.childNodes[2].innerHTML;
			
					if (domTarget.childNodes[1].outerHTML)
					{
						console.log("JUST FOR FIRST RUN, GET RID OF IF STATEMENT IF WORKS");
						document.getElementById('idAlbViewText').innerHTML =
								domTarget.childNodes[1].outerHTML;
					}
					else
						document.getElementById('idAlbViewText')
										.appendChild(domTarget.childNodes[1].cloneNode(true));

					paneSongList.AlbViewScrollBox.YScrollTo(0);
					document.getElementById('idAlbViewWrapper').className +=
									' classShowPickedCat classSecLevelPickedCat ';
					
					paneSongList.AlbViewScrollBox.RecalcBottom();

					
					dom.className = 
						"classWrapper classPickerCat classCatSideView classShowPickedCat";
					
					dom.style.width = "165px";
					
					paneSongList.AlbumScrollBox.RecalcBottom();
					var iScrollTo = DomOffsetTopCalc(domTarget) - 
															DomOffsetTopCalc(dom);
					paneSongList.AlbumScrollBox.YScrollTo(-iScrollTo + 30);
				}
				else if (dom.className.indexOf("classCatSideView") != -1)
				{
					
					document.getElementById('idAlbViewScroller').innerHTML = 
								domTarget.childNodes[2].innerHTML;
			
					if (domTarget.childNodes[1].outerHTML)
					{
						console.log("JUST FOR FIRST RUN, GET RID OF IF STATEMENT IF WORKS");
						document.getElementById('idAlbViewText').innerHTML =
								domTarget.childNodes[1].outerHTML;
					}
					else
						document.getElementById('idAlbViewText')
										.appendChild(domTarget.childNodes[1].cloneNode(true));

					paneSongList.AlbViewScrollBox.YScrollTo(0);
					document.getElementById('idAlbViewWrapper').className +=
							' classShowPickedCat classSecLevelPickedCat ';
					paneSongList.AlbViewScrollBox.RecalcBottom();
				
				}
				else
				{
					paneSongList.arrayQuickScrDom[0] = 
								document.getElementById('idFastScrollL');
		
					paneSongList.arrayQuickScrDom[1] = 
								document.getElementById('idFastScrollR');

					document.getElementById('idFastScrollL').style.display = 'block';
					
					document.getElementById('idAlbViewScroller').innerHTML = 
								domTarget.childNodes[2].innerHTML;
			
					document.getElementById('idAlbViewText').innerHTML =
								domTarget.childNodes[1].outerHTML;

					paneSongList.AlbViewScrollBox.YScrollTo(0);
					
					document.getElementById('idAlbViewWrapper').className +=
							' classShowPickedCat classSecLevelPickedCat ';
			
					dom.style.width = '165px';
					dom.className += " classCatSideView ";
					
					paneSongList.AlbViewScrollBox.RecalcBottom();
					
					paneSongList.AlbumScrollBox.RecalcBottom();
					var iScrollTo = DomOffsetTopCalc(domTarget) -
							DomOffsetTopCalc(dom);
					paneSongList.AlbumScrollBox.YScrollTo(-iScrollTo + 30);
										
				}
				
				dom = 0;
			},
			hScroll: false,
			onLongPress: paneSongList.DragFunction
			});

		paneSongList.TitleScrollBox = new iScroll('idTitleWrapper', {
			onRefresh: function()
			{
				paneSongList.PrepStickyHeader('idTitleScroller', 0, 
											this.scrollerH, 'idTitleStickyHead');
				paneSongList.bTitleDirty = 1;
			},
			onAnimationEnd: function()
			{
				if (visPlayMode[0])
					FastDraw();
			},
			onBeforeScrollStart: function(event)
			{
				if (visPlayMode[0])
					SlowDraw();
				event.preventDefault();
			},
			callEachPos: function(x, y)
			{
				paneSongList.StickyHeader(y, 'clp_', 
										'idTitleStickyHead', 40, 0);
			},
			onClick: function(e)
			{
				var domTarget = e.target;
						
				if (domTarget.id == "idTitleWrapper")
					return;
						
				if (domTarget.nodeType != 1)
				{
					domTarget = domTarget.parentNode;
				}
				
				if (domTarget.nodeName != 'LI')
					return;
			
				var point = hasTouch ? e.changedTouches[0] : e;
			
				if (point.pageX < DomOffsetLeftCalc(domTarget) + 40)
				{
					paneSongList.HandleFavoriteEvent(domTarget, PLNAME_DESC_PATH);
					return;
				}
			
				var iIndex = Number(domTarget.id.substr(4));
				
				objwAMP.EmptyPlaylist(0);
				objwAMP.AddSong(objSongIndex.arrayIndex[iIndex], 0);
				objwAMP.OpenSong(0, 0);
				paneSongList.Close();
				paneControls.PlayPauseChange(PLAYER_PLAY_STATE);
			},
			hScroll: false,
			onLongPress: paneSongList.DragFunction
		});

		paneSongList.ListScrollBox = new iScroll('idListWrapper', {
			onRefresh: function()
			{
				paneSongList.bListDirty = 1;
			},
			onAnimationEnd: function()
			{	
			},
			onBeforeScrollStart: function(event)
			{
				event.preventDefault();
			},
			onClick: function(e)
			{
				var domTarget = e.target;
			
				if (domTarget.id == "idListWrapper")
					return;
			
				if (domTarget.nodeType != 1)
				{
					domTarget = domTarget.parentNode;
				}
				
				if (domTarget.nodeName != 'LI')
					return;
				
				var iIndex;
				
				if (domTarget.id.indexOf('PL_') == 0)
				{
					console.log("Getting this far");
					
					var m3uFunc = function(m3u, url)
					{
						
						var listData = [];
						var pathParent = url.substr(0, url.lastIndexOf('/')+1);
						 
						var lines = m3u.split("\n");
						var index = 0;
						var songData = null, displayName = null;
						for (var length = lines.length;index < length;index++) 
						{
							var line = lines[index].replace(/^\s+/, '').replace(/\s+$/, '');
							if (line.length > 0)
							{
								if (line == "#EXTM3U") 
									continue;
								else if (line.indexOf("#EXTINF:") == 0) 
								{
									var extinf = line.replace("#EXTINF:",'');
									var parts = extinf.split(",");
									var songLength = parseInt(parts[0]);
									if (songLength)
										songData = {length: songLength};

									var parsedDisplayName = 
												parts.splice(1,parts.length - 1).join(",").replace(/^\s+/, '').replace(/\s+$/, '');
									if (parsedDisplayName.length > 0)
										displayName = parsedDisplayName;
								}
								else if (line.charAt(0) != '#')
								{ 
						
									var path="", i=0, check=1;
									while (i < line.length)
									{
										var char = line.charAt(i++);
							
										if (char == '\\')
											path += '/';
										else
											path += char;
									}
						
									if (path.charAt(1) == ':')
									{
										var name = path.substr(path.lastIndexOf('/')+1);
								
										path = objwAMP.quickNameLookUp[name];
										if (!path)
										{
											songData = null;
											displayName = null;
											continue;
										}
									}
									else if (path.indexOf('http://') == 0)
									{
										path = FormatHTTP(path);
										check = 0;
									}
									else if (path.charAt(0) == '.')
									{
										if (path.charAt(1) == '.')
										{
											path = path.substr(2);
											path = pathParent.substring(0, path.lastIndexOf('/')) + path;
										}
										else
										{
											path = path.substr(2);
											path = pathParent + path;	
										}
									}
									else if (path.charAt(0) != '/')
										path = pathParent + path;
							
									// Check to see if the path works
									if (check)
									{
										if (!objwAMP.CheckFile(check))
										{
											var name = path.substr(path.lastIndexOf('/')+1);
											
											path = objwAMP.quickNameLookUp[name];
											if (!path)
											{
												songData = null;
												displayName = null;
												continue;
											}
										}
									}
							
									if (!displayName)
										displayName = path.substr(path.lastIndexOf('/')+1);
							
									console.log(path);
							
									listData.push({path: path, artist: path, title: displayName})
									
									songData = null;
									displayName = null;
								}
							}
						}

						paneSongList.remoteXML = listData;
						
						var str = "";
						
						objwAMP.EmptyPlaylist(0);
						
						for (var i=0; i<listData.length; i++)
						{
							var iIndexPath = objSongIndex.objQuickIndexLoc[listData[i].path]; 
						
							objwAMP.AddSong(objSongIndex.arrayIndex[iIndexPath], 0);
						}
						
						objwAMP.OpenSong(0, 0);
						paneSongList.Close();
						paneControls.PlayPauseChange(PLAYER_PLAY_STATE);
						
						$('#idLoadIndicator')[0].style.display = "none";
						$('#idOpenLink')[0].style.display = "none";
						paneSongList.Close();
						paneControls.PlayPauseChange(PLAYER_PLAY_STATE);
					};
					
					iIndex = Number(domTarget.id.substr(3));
					var path = 'file://' + objwAMP.arrayFoundPLs[iIndex];
					
					console.log(path);
					
					objwAMP.HandleUrl(path, 0, 0, m3uFunc);
					
					return;
				}
				
				iIndex = Number(domTarget.id.substr(4));
				
				objwAMP.EmptyPlaylist(0);
				objwAMP.AddSong(objSongIndex.arrayIndex[iIndex], 0);
				objwAMP.OpenSong(0, 0);
				paneSongList.Close();
				paneControls.PlayPauseChange(PLAYER_PLAY_STATE);
			},
			hScroll: false,
			onLongPress: paneSongList.DragFunction
		});
		
		paneSongList.AlbViewScrollBox = new iScroll('idAlbVWrapper', {
			onRefresh: function()
			{
				paneSongList.bAlbumViewDirty = 1;
			},
			onClick: function(e)
			{
				var domTarget = e.target;
				
				if (domTarget.nodeName == 'LI')
					iIndex = Number(domTarget.id.substr(4));
				else
				{
					domTarget = domTarget.parentNode;
					if (domTarget.nodeName != 'LI')
						return;
					else
						iIndex = Number(domTarget.id.substr(4));
				}
			
				objwAMP.EmptyPlaylist(0);
				objwAMP.AddSong(objSongIndex.arrayIndex[iIndex], 0);
				objwAMP.OpenSong(0, 0);
				paneSongList.Close();
				paneControls.PlayPauseChange(PLAYER_PLAY_STATE);
			
			},
			onLongPress: paneSongList.DragFunction
		});
		
		paneSongList.YTubeScrollBox = new iScroll('idYTubeWrapper', {
			onRefresh: function()
			{
				paneSongList.bYTubeDirty = 1;
			},
			onAnimationEnd: function()
			{
				if (visPlayMode[0])
					FastDraw();
			},
			onBeforeScrollStart: function(event)
			{
				if (visPlayMode[0])
					SlowDraw();
			}
		});
		
		paneSongList.SearchScrollBox = new iScroll('idSearchWrapper', {
			onRefresh: function()
			{
				paneSongList.PrepStickyHeader('idSearchScroller', 0, 
												this.scrollerH, 'idSearchStickyHead');
				paneSongList.bSearchDirty = 1;
			},
			onAnimationEnd: function()
			{	
				if (visPlayMode[0])
					FastDraw();
			},
			onBeforeScrollStart: function(event)
			{
				paneSongList.PrepStickyHeader('idSearchScroller', 0, 
												this.scrollerH, 'idSearchStickyHead');
				event.preventDefault();
				if (visPlayMode[0])
					SlowDraw();
			},
			callEachPos: function(x, y)
			{
				paneSongList.StickyHeader(y, 'idSP_', 'idSearchStickyHead', 40, 0);
			},
			onClick: function(e)
			{
				var domTarget = e.target;
				
				if (domTarget.id == "idTitleWrapper")
						return;
						
				if (domTarget.nodeType != 1)
					domTarget = domTarget.parentNode;
				
				if ((domTarget.nodeName != 'LI') ||
					(domTarget.className.indexOf('listItemHeader') != -1))
					return;
				
				if (domTarget.id.substr(0, 2) == 'ge')
				{
					var iIndex = Number(domTarget.id.substr(3));
					
					var classFilter = 'classGen_' + iIndex;
					paneSongList.strFilterCls = classFilter;
			
					var dom = document.getElementById('idArtistUL');
			
					dom.innerHTML = dom.innerHTML.replace(/y: list-item;/g, 'y: none;')
													 .replace(/classUniSubPan/g, 
																	'HclassTitleSubPaneHide');
			
					var elements = dom.getElementsByClassName(classFilter);
			
					var i = elements.length;
			
					while(i--)
					{
						elements[i].style.display = 'list-item';
						elements[i].parentNode.className = 'classUniSubPan'
					}
					
					paneSongList.AlbumScrollBox.YScrollTo(0);
					dom = document.getElementById('idArtistWrapper');
					dom.className += ' classShowPickedCat classTopLevelPickedCat ';
			
					paneSongList.Show();
			
					dom.style.display = "block";
			
					document.getElementById('idPickerButDiv').style.display = "block";
					paneSongList.ArtistScrollBox.RecalcBottom();		
					document.getElementById('idSearchFull').style.display = 'none';
					
				}
				else if (domTarget.id.substr(0, 2) == 'ar')
				{
					var iIndex = Number(domTarget.id.substr(3));
					
					var classFilter = 'classArt_' + iIndex;
					paneSongList.strFilterCls = classFilter;
				
					var dom = document.getElementById('idAlbumPicker');
					dom.innerHTML = dom.innerHTML.replace(/y: list-item;/g, 'y: none;')
													 .replace(/classUniSubPan/g, 
																	'HclassTitleSubPaneHide');
			
					var elements = dom.getElementsByClassName(classFilter);
			
					var i = elements.length;
			
					while(i--)
					{
						elements[i].style.display = 'list-item';
						elements[i].parentNode.className = 'classUniSubPan'
					}
			
					paneSongList.AlbumScrollBox.YScrollTo(0);
					document.getElementById('idAlbumWrapper').className += 
							' classShowPickedCat classTopLevelPickedCat ';
			
					paneSongList.Show();
			
					document.getElementById('idAlbumWrapper').style.display = "block";
					document.getElementById('idPickerButDiv').style.display = "block";
					paneSongList.AlbumScrollBox.RecalcBottom();

					
					document.getElementById('idSearchFull').style.display = 'none';
				}
				else if (domTarget.id.substr(0, 2) == 'al')
				{
					var iIndex = Number(domTarget.id.substr(3));
					
					var strID = "Alb_" + iIndex;
					var classFilter = 'classAlb_' + iIndex;
					paneSongList.strFilterCls = classFilter;
			
					var domAlbum = document.getElementById(strID);

					document.getElementById('idAlbViewScroller').innerHTML = 
								domAlbum.childNodes[2].innerHTML;
			
					if (domAlbum.childNodes[1].outerHTML)
					{
						console.log("JUST FOR FIRST RUN, GET RID OF IF STATEMENT IF WORKS");
						document.getElementById('idAlbViewText').innerHTML =
								domAlbum.childNodes[1].outerHTML;
					}
					else
						document.getElementById('idAlbViewText')
										.appendChild(domAlbum.childNodes[1].cloneNode(true));

					paneSongList.AlbViewScrollBox.YScrollTo(0);
					document.getElementById('idAlbViewWrapper').className +=
							' classShowPickedCat classTopLevelPickedCat ';

					paneSongList.Show();
			
					document.getElementById('idAlbViewWrapper').style.display = 'block';
					document.getElementById('idPickerButDiv').style.display = 'block';
					paneSongList.AlbViewScrollBox.RecalcBottom();
				
					document.getElementById('idSearchFull').style.display = 'none';
					
				}
				else if (domTarget.id.substr(0, 2) == 'ti')
				{
					var iIndex = Number(domTarget.id.substr(3));
					
					objwAMP.EmptyPlaylist(0);
					objwAMP.AddSong(objSongIndex.arrayIndex[iIndex], 0);
					objwAMP.OpenSong(0, 0);
					paneSongList.Close();
					paneControls.PlayPauseChange(PLAYER_PLAY_STATE);
				}
			},
			hScroll: false,
			onLongPress: paneSongList.DragFunction});
		
		paneSongList.funcJumpToTop = function(e)
		{
			
			var point = hasTouch ? e.touches[0] : e;
				
			var arrayVis = Filter(document.getElementById('idPickerWrapper').childNodes,
										function(elem)
										{
											return (elem.nodeType == 1) && 
													(elem.className
													.indexOf('classShowPickedCat') != -1);
										});
					
			if (arrayVis.length == 1)
			{
				switch (arrayVis[0].id)
				{
				case "idGenreWrapper":
					paneSongList.GenreScrollBox.YScrollTo(0);
					break;
				case "idArtistWrapper":
					paneSongList.ArtistScrollBox.YScrollTo(0);
					break;
				case "idAlbumWrapper":
					paneSongList.AlbumScrollBox.YScrollTo(0);
					break;
				case "idTitleCont":
					paneSongList.TitleScrollBox.YScrollTo(0);
					break;
				case "idAlbViewWrapper":
					paneSongList.AlbViewScrollBox.YScrollTo(0);
					break;
				case "idFolderWrapper":
					paneSongList.FolderScrollBox.YScrollTo(0);
					break;
				case "idSearchFull":
					paneSongList.SearchScrollBox.YScrollTo(0);
					break;
				case "idYTubeWrapper":
					paneSongList.YTubeScrollBox.YScrollTo(0);
					break;
				case "idListWrapper":
					paneSongList.ListScrollBox.YScrollTo(0);
					break;
				}
			}
			else
			{
				// Figure out which side has which div
				//	then figure out which side the user clicked
				var iIndex = 0;
			
				// iIndex = classSecLevelPickedCat
				if (arrayVis[1].className.indexOf('classSecLevelPickedCat') != -1)
					iIndex = 1;
				
				// iIndex = dom clicked on
				if (point.pageX < DomOffsetLeftCalc(arrayVis[iIndex]))
					iIndex = !iIndex;
				
				switch (arrayVis[iIndex].id)
				{
				case "idGenreWrapper":
					paneSongList.GenreScrollBox.YScrollTo(0);
					break;
				case "idArtistWrapper":
					paneSongList.ArtistScrollBox.YScrollTo(0);
					break;
				case "idAlbumWrapper":
					paneSongList.AlbumScrollBox.YScrollTo(0);
					break;
				case "idAlbViewWrapper":
					paneSongList.AlbViewScrollBox.YScrollTo(0);
					break;
				}
			}
		};
		
		document.getElementById('idPickerJumpTop').addEventListener(START_EV,
														paneSongList.funcJumpToTop,
														false);
		
		var m3uFunc = function(m3u, url)
			{
				var listData = [];
				var pathParent = url.substr(0, url.lastIndexOf('/')+1);
				 
				var lines = m3u.split("\n");
				var index = 0;
				var songData = null, displayName = null;
				for (var length = lines.length;index < length;index++) 
				{
					var line = lines[index].replace(/^\s+/, '').replace(/\s+$/, '');
					if (line.length > 0)
					{
						if (line == "#EXTM3U") 
							continue;
						else if (line.indexOf("#EXTINF:") == 0) 
						{
							var extinf = line.replace("#EXTINF:",'');
							var parts = extinf.split(",");
							var songLength = parseInt(parts[0]);
							if (songLength)
								songData = {length: songLength};

							var parsedDisplayName = 
										parts.splice(1,parts.length - 1).join(",").replace(/^\s+/, '').replace(/\s+$/, '');
							if (parsedDisplayName.length > 0)
								displayName = parsedDisplayName;
						}
						else if (line.charAt(0) != '#')
						{ 
				
							var path="", i=0, check=1;
							while (i < line.length)
							{
								var char = line.charAt(i++);
					
								if (char == '\\')
									path += '/';
								else
									path += char;
							}
				
							if (path.charAt(1) == ':')
							{
								var name = path.substr(path.lastIndexOf('/')+1);
						
								path = objwAMP.quickNameLookUp[name];
								if (!path)
								{
									songData = null;
									displayName = null;
									continue;
								}
							}
							else if (path.indexOf('http://') == 0)
							{
								path = FormatHTTP(path);
								check = 0;
							}
							else if (path.charAt(0) == '.')
							{
								if (path.charAt(1) == '.')
								{
									path = path.substr(2);
									path = pathParent.substring(0, path.lastIndexOf('/')) + path;
								}
								else
								{
									path = path.substr(2);
									path = pathParent + path;	
								}
							}
							else if (path.charAt(0) != '/')
								path = pathParent + path;
					
							// Check to see if the path works
							if (check)
							{
								if (!objwAMP.CheckFile(check))
								{
									var name = path.substr(path.lastIndexOf('/')+1);
									
									path = objwAMP.quickNameLookUp[name];
									if (!path)
									{
										songData = null;
										displayName = null;
										continue;
									}
								}
							}
					
							if (!displayName)
								displayName = path.substr(path.lastIndexOf('/')+1);
					
							listData.push({path: path, artist: path, title: displayName})
							
							songData = null;
							displayName = null;
						}
					}
				}

				paneSongList.remoteXML = listData;
				
				var str = "";
						
				for (var i=0; i<listData.length; i++)
				{
					str += '<li id="xml_' + i +
								 '" class="xmltarget">' + 
									listData[i].title + '</li>';
				}
				
				$('#idLoadIndicator')[0].style.display = "none";
				$('#idOpenLink')[0].style.display = "none";
				
				document.getElementById('idInternetUL').innerHTML = str;
				paneSongList.InternetScrollBox.RecalcBottom();
			};
		
		var xmlfunc = function(xml)
			{
				var arrayNew = [];
				
				$(xml).find("track").each(function () {
					var children = this.childNodes;
					var song = {};
					
					for (var i=0;i<children.length;i++)
					{
						if (children[i].nodeType != 1)
							continue;
						
						if (children[i].tagName == "title")
							song.title = children[i].textContent;
						else if (children[i].tagName == "artist")
							song.artist = children[i].textContent;
						else if (children[i].tagName == "location")
							song.path = FormatHTTP(children[i].textContent);
					}
					
					if (song.path)
					{
						if (!song.title)
							song.title = song.path.substr(song.path.lastIndexOf('/') + 1);
					
						if (!song.artist)
							song.artist = song.path;
					
						arrayNew.push(song);
					}
				});
				
				paneSongList.remoteXML = arrayNew;
				
				var str = "";
				
				for (var i=0; i<arrayNew.length; i++)
				{
					str += '<li id="xml_' + i +
						 '" class="xmltarget">' + arrayNew[i].title + '</li>';
				}
				
				$('#idLoadIndicator')[0].style.display = "none";
				$('#idOpenLink')[0].style.display = "none";
				
				document.getElementById('idInternetUL').innerHTML = str;
				paneSongList.InternetScrollBox.RecalcBottom();
			};
		
		var musFunc = function(mus)
		{
			objwAMP.DirectOpen(mus, 0);
			paneControls.PlayPauseChange(PLAYER_PLAY_STATE);
			
			$('#idLoadIndicator')[0].style.display = "none";
			$('#idOpenLink')[0].style.display = "none";
		};
		
		var funcHandleInternet = function()
		{
			objOptions.URLHistAddTo();
			return;
		};
				
		document.getElementById('idAddXMLPL').addEventListener(START_EV, 
			function(event)
			{
				if (paneSongList.remoteXML && paneSongList.remoteXML.length)
					objwAMP.AppendPlaylist(paneSongList.remoteXML, 0);
			});
		
		document.getElementById('idURLFilter').addEventListener('keydown', 
			function(event)
			{
				if (event.keyCode == '13') 
					event.preventDefault();
			});
		
		document.getElementById('idURLFilter').addEventListener('keyup', 
			function(event)
			{
				if (event.keyCode == '13')
				{
					event.preventDefault();
					
					funcHandleInternet();
				}
			});
		
		document.getElementById('idURLFilter').addEventListener(START_EV, 
			function(event)
			{
				if (window.PalmSystem)
					window.PalmSystem.keyboardShow(7);
			});
		
		document.getElementById('idInternetGo').addEventListener(START_EV, 
			function(event)
			{				
				funcHandleInternet();
			});
		
		document.getElementById('idListFilter').addEventListener('keydown', 
			function(event)
			{
				if (event.keyCode == '13') 
					event.preventDefault();
			});
		
		document.getElementById('idListFilter').addEventListener('keyup', 
			function(event)
			{
				if (event.keyCode == '13') 
					event.preventDefault();
				else
					paneSongList.SearchIndex(this.value.toLowerCase());
			});
		
		document.getElementById('idListFilter' ).addEventListener(START_EV, 
			function(event)
			{
				if (window.PalmSystem)
					window.PalmSystem.keyboardShow(2);
				
				paneSongList.SearchIndex(this.value.toLowerCase());
			});
		
		document.getElementById('idTitleFilter').addEventListener('keydown', 
			function(event)
			{
				if (event.keyCode == '13') 
					event.preventDefault();
			});		
		
		document.getElementById('idTitleFilter').addEventListener('keyup', 
			function(event)
			{
				if (event.keyCode == '13') 
					event.preventDefault();
				else
					paneSongList.FilterTitles(this.value.toLowerCase());
			});
		
		document.getElementById('idTitleFilter').addEventListener(START_EV, 
			function(event)
			{
				if (window.PalmSystem)
					window.PalmSystem.keyboardShow(2);
				
				paneSongList.FilterTitles(this.value.toLowerCase());
			});
		
		document.getElementById('idbtnfavfilt').addEventListener(START_EV, function()
		{
			if (paneSongList.bShowFavOnly)
			{
				paneSongList.bShowFavOnly = 0;
				
				document.getElementById('idGenreUL').className = 'classPickerSub';
				document.getElementById('idArtistUL').className = 'classPickerSub';
				document.getElementById('idAlbumPicker').className = 'classPickerSub';
				document.getElementById('idTitleScroller').className = 'classScroller';
				
				if (paneSongList.bArtistDirty == 1)
				{
					paneSongList.ArtistScrollBox.RecalcBottom();
				}
				
				if (paneSongList.bGenreDirty == 1)
				{
					paneSongList.GenreScrollBox.RecalcBottom();
				}
				
				if (paneSongList.bAlbumDirty == 1)
				{
					paneSongList.AlbumScrollBox.RecalcBottom();
					paneSongList.AlbumScrollBox.YScrollTo(1, 100, true);
				}
				
				if (paneSongList.bTitleDirty == 1)
				{
					paneSongList.TitleScrollBox.RecalcBottom();
				}
				
				document.getElementById('idbtnfavfilt').className = '';
			}
			else
			{
				paneSongList.bShowFavOnly = 1;
				
				document.getElementById('idGenreUL').className = 
												'classPickerSub classShowFavOnly';
				document.getElementById('idArtistUL').className = 
												'classPickerSub classShowFavOnly';
				document.getElementById('idAlbumPicker').className = 
												'classPickerSub classShowFavOnly';
				document.getElementById('idTitleScroller').className = 
												'classScroller classShowFavOnly';
				
				if (paneSongList.bArtistDirty == 1)
				{
					paneSongList.ArtistScrollBox.RecalcBottom();
				}
				
				if (paneSongList.bGenreDirty == 1)
				{
					paneSongList.GenreScrollBox.RecalcBottom();
				}
				
				if (paneSongList.bAlbumDirty == 1)
				{
					paneSongList.AlbumScrollBox.RecalcBottom();
					paneSongList.AlbumScrollBox.YScrollTo(1, 100, true);
				}
				
				if (paneSongList.bTitleDirty == 1)
				{
					paneSongList.TitleScrollBox.RecalcBottom();
				}
				
				document.getElementById('idbtnfavfilt').className = 'classBtnFavIsClicked';
			}
			
		}, false);
				
		document.getElementById('idPickerCloseBtn')
								.addEventListener(START_EV,
											function() 
											{
												paneSongList.Close();
												paneIndex.iCurActive = NONE_SB;
											},
											false);
													  
		document.getElementById('idPlayAllBtn').addEventListener(START_EV,
								function()
		{	
			var arrayNewPlaylist = 
					paneSongList.GetSongsFromClassString(paneSongList.strFilterCls);
						
			objwAMP.SetPlaylist(0, arrayNewPlaylist);				
			objwAMP.OpenSong(0, 0);
			paneSongList.Close();
			paneControls.PlayPauseChange(PLAYER_PLAY_STATE);
		}, false);
		
		document.getElementById('idPlayDirBtn').addEventListener(START_EV,
								function()
		{	
			var arrayNewPlaylist = paneSongList.objFile.Playable.slice(0);
							
			objwAMP.SetPlaylist(0, arrayNewPlaylist);
			objwAMP.OpenSong(0, 0);
			paneSongList.Close();
			paneControls.PlayPauseChange(PLAYER_PLAY_STATE);
		}, false);		
		
		document.getElementById('idAddToPLBtn').addEventListener(START_EV,
								function()
		{			
			var arrayNewPlaylist = 
					paneSongList.GetSongsFromClassString(paneSongList.strFilterCls);
			
			if (!objwAMP.PLSize(0))
			{
				objwAMP.SetPlaylist(0, arrayNewPlaylist);
				objwAMP.OpenSong(0, 0);
				paneControls.PlayPauseChange(PLAYER_PLAY_STATE);
			}
			else
				objwAMP.AppendPlaylist(arrayNewPlaylist, 0);
			
		
		}, false);
		
		document.getElementById('idbtnalbum').addEventListener(START_EV,
									function()
		{
			if (paneIndex.bFileOnly)
			{
				sceneSplash.StillLoadingMsg(ALBUM_SB)
				return;
			}
			
			paneSongList.Empty();
			document.getElementById('idAlbumWrapper').className +=
							'classShowPickedCat classTopLevelPickedCat';
			
			paneSongList.AlbumScrollBox.RecalcBottom();
			paneSongList.AlbumScrollBox.YScrollTo(0);
			
		}, false);
		
		document.getElementById('idbtngenre').addEventListener(START_EV,
									function()
		{
			if (paneIndex.bFileOnly)
			{
				sceneSplash.StillLoadingMsg(GENRE_SB)
				return;
			}
			
			paneSongList.Empty();
			document.getElementById('idGenreWrapper').className +=
							' classShowPickedCat classTopLevelPickedCat ';
			
			paneSongList.GenreScrollBox.RecalcBottom();
			paneSongList.GenreScrollBox.YScrollTo(0);
			
		}, false);
		
		document.getElementById('idbtnartist').addEventListener(START_EV,
									function()
		{
			if (paneIndex.bFileOnly)
			{
				sceneSplash.StillLoadingMsg(ARTIST_SB)
				return;
			}
			
			paneSongList.Empty();
			document.getElementById('idArtistWrapper').className +=
					' classShowPickedCat classTopLevelPickedCat ';
			
			paneSongList.ArtistScrollBox.RecalcBottom();
			paneSongList.ArtistScrollBox.YScrollTo(0);
			
		}, false);
		
		
		// ***** Event listener for the title button on right of
		//			picker pane
		
		// Make sure we can clean up mem at end
		paneSongList.funcBtnTitle = function()
		{
			// If Indexer has not returned
			if (paneIndex.bFileOnly)
			{
				sceneSplash.StillLoadingMsg(TITLE_SB)
				return;
			}
			
			var y = paneSongList.TitleScrollBox.y;
			
			// Clear previously displayed info
			paneSongList.Empty();
			paneSongList.ClearTitleFilter();
			
			// show title
			document.getElementById('idTitleWrapper').className += ' classTopLevelPickedCat';
			document.getElementById('idTitleCont').className += ' classShowPickedCat';
			
			paneSongList.TitleScrollBox.RecalcBottom();
			paneSongList.TitleScrollBox.YScrollTo(y);
		}
		
		document.getElementById('idbtntitle').addEventListener(START_EV,
									paneSongList.funcBtnTitle, false);
		
		document.getElementById('idbtnfolder').addEventListener(START_EV,
									function()
		{
			paneIndex.ShowPLDragPane();
			document.getElementById('idPickerNotReady').style.display = "none";
			
			paneSongList.Empty();
			paneSongList.BuildFileList(FOLDER_SB);
	
			document.getElementById('idFolderWrapper').className += 
								' classShowPickedCat classTopLevelPickedCat ';
			
			paneSongList.FolderScrollBox.RecalcBottom();
			paneSongList.FolderScrollBox.YScrollTo(0);

		}, false);
	},

	GetSongsFromClassString: function(strClass)
	{
		var arrayNewPlaylist = [];

		if ((strClass.indexOf('classAlb') != -1) &&
			objOptions.bKeepAlbumOrder)
		{
			var elements = document.getElementById('idAlbumScroller')
										.getElementsByClassName(strClass);
			
			for(var i=0; i<elements.length; i++)
			{
				if (elements[i].nodeName != "LI")
					continue;
					
				var iNum = Number(elements[i].id.substr(4));
							
				arrayNewPlaylist.push(objSongIndex.arrayIndex[iNum]);
			};
		}
		else
		{
			var elements = document.getElementById('idTitleScroller')
										.getElementsByClassName(strClass);
			
			for(var i=0; i<elements.length; i++)
			{
				var iNum = Number(elements[i].id.substr(4));
							
				arrayNewPlaylist.push(objSongIndex.arrayIndex[iNum]);
			};
		}
		
		return arrayNewPlaylist;
	},
	
	// paneSongList.inInsert - 1: landscape view
	// paneSongList.inInsert - 2: add to top
	// paneSongList.inInsert - 3: add to bottom of playlist
	DragFunction: function(lpX, lpY, target)
	{
		if (!target)
			return;
		
		if ((target.nodeName == 'UL') ||
			(target.className.indexOf('classScroller') != -1) ||
			(target.className.indexOf('classWrapper') != -1))
		{
			return;
		}

		if ((target.nodeName != "LI") && 
			(target.className.indexOf('classIndivAlb') == -1))
		{
			while (target.className.indexOf('classScroller') == -1 &&
				   target.nodeName != "LI" &&
				   target.className.indexOf('classIndivAlb') == -1)
			{
				target = target.parentNode;
			}

			if (target.className.indexOf('classScroller') != -1)
				return;

		}
		
		document.getElementById('blockInput').style.display = "block";
		
		var strID = target.id;
		
		var bIsFolderV = 0;
		var bIsXML = 0;
		
		var classString;
		var dragString;
			
		if (target.lastChild)
			dragString = target.lastChild.nodeValue;
		
		if ((strID.indexOf("Gen_") == 0) ||
			(strID.indexOf("Art_") == 0))
		{
			paneSongList.strDomIdFilter = 'class' + strID;
			classString = 'classPickDragRec';
		}
		else if (strID.indexOf("Alb_") == 0)
		{
			paneSongList.strDomIdFilter = 'class' + strID;
			classString = 'classPickDragRec';
			
			dragString = target.childNodes[1].firstChild.nodeValue;
		}
		else if ((strID.indexOf("tit_") == 0) ||
				 (strID.indexOf("lit_") == 0))
		{
			paneSongList.strDomIdFilter = Number(strID.substr(4));
			
			classString = 'classPickDragSong';	
		}
		else if (strID.indexOf("sng_") == 0)
		{
			paneSongList.strDomIdFilter = Number(strID.substr(4));
			
			classString = 'classPickDragSong';
			
			dragString = target.lastChild.nodeValue;
		}
		else if (strID.indexOf("ti_") == 0)
		{
			paneSongList.strDomIdFilter = Number(strID.substr(3));
			
			classString = 'classPickDragSong';
		}
		else if (strID.indexOf("al_") == 0)
		{
			var iIndex = Number(strID.substr(3));
			paneSongList.strDomIdFilter = 'classAlb_' + iIndex;
			
			classString = 'classPickDragRec';
		}
		else if (strID.indexOf("ar_") == 0)
		{
			var iIndex = Number(strID.substr(3));
			paneSongList.strDomIdFilter = 'classArt_' + iIndex;
			
			classString = 'classPickDragRec';
		}
		else if (strID.indexOf("ge_") == 0)
		{
			var iIndex = Number(strID.substr(3));
			paneSongList.strDomIdFilter = 'classGen_' + iIndex;
			
			classString = 'classPickDragRec';
		}
		else if (strID.indexOf("dir_") == 0)
		{
			bIsFolderV = 2;
			var iIndex = Number(strID.substr(4));
			paneSongList.strDomIdFilter =
							paneSongList.objFile.Dir[iIndex].path;
							
			classString = 'classPickDragRec';
		}
		else if (strID.indexOf("sgf_") == 0)
		{
			bIsFolderV = 1;
			paneSongList.strDomIdFilter = Number(strID.substr(4));
			
			classString = 'classPickDragSong';
		}
		else if (strID.indexOf("xml_") == 0)
		{
			bIsXML = 1;
			paneSongList.strDomIdFilter = Number(strID.substr(4));
			
			classString = 'classPickDragSong';
		}
		else
		{
			// in case the StrID was not recognized, end
			return;
		}
		
		paneSongList.GenreScrollBox.IgnoreInput();
		paneSongList.ArtistScrollBox.IgnoreInput();
		paneSongList.AlbumScrollBox.IgnoreInput();
		paneSongList.TitleScrollBox.IgnoreInput();
		paneSongList.AlbViewScrollBox.IgnoreInput();
		paneSongList.FolderScrollBox.IgnoreInput();
		paneSongList.SearchScrollBox.IgnoreInput();
		
		paneSongList.liAddSource = target;
		
		paneSongList.liClone = document.createElement('DIV');
		paneSongList.liClone.className = classString;
		paneSongList.liClone.style.left = (lpX-75) + "px";
		paneSongList.liClone.style.top = (lpY-75) + "px";
		paneSongList.liClone.innerHTML = dragString;
		
		document.getElementById('idPlayer').appendChild(paneSongList.liClone);

		
		paneSongList.liAddSource.style.background = "#888";
		paneSongList.liAddSource.style.color = "#000";

		var domDB = document.getElementById('idPLDragWrap');
		
		var dd = DomOffsetCalc(domDB);
		dd.left -= 300;
		dd.startX = lpX;
		dd.startY = lpY;
		dd.BottomOut = dd.top + domDB.clientHeight;
		
		dd.ScrollToUse = paneIndex.PLScrollBox;
		
		domDB = document.getElementById('idPLDropBot');
		var domDT = document.getElementById('idPLDropTop');
		
		dd.portT = new Object();
		dd.portB = new Object();
		dd.portT.left = 220;
		dd.portT.top = 130;
		dd.portB.left = 220;
		dd.portB.top = DomOffsetTopCalc(domDB) + 300;
		
		dd.portT.overallBottom = dd.portB.top + 
									domDB.clientHeight;
		dd.portT.overallRight = dd.portT.left + 
									domDT.clientWidth;
		dd.portT.firstBottom = dd.portT.top + 
									domDT.clientHeight;
		
		domDT = 0;
		domDB = 0;
		
		paneSongList.liPlaceHolder = document.createElement('LI');
		paneSongList.liPlaceHolder.className = 'classDragIndicator';
		
		paneSongList.jqobjTop = 0;
		paneSongList.inInsert = 0;
	
		var iIndex = -1 * paneIndex.PLScrollBox.y / paneIndex.PLScrollBox.iIndivMargin;
		iIndex = 0|(iIndex);
	
		paneSongList.jqobjTop = document.getElementById('plyls_' + iIndex);
	
		var funcHandleDrag = function(event)
		{				
				
			event.preventDefault();
			
			clearInterval(paneSongList.intScroll);
		
			var point = hasTouch ? event.touches[0] : event;
		  
			paneSongList.liClone.style.webkitTransform = 'translate3d(' +
								(point.pageX - dd.startX) + 'px, ' +
								(point.pageY - dd.startY) +'px, 0px)';
								
			
			if (strSaveOrientation == 'landscape')
			{
			
				if (point.pageX > dd.left)
				{
					
					if (paneSongList.inInsert != 1)
					{
						paneSongList.inInsert = 1;
						
						if (paneSongList.jqobjTop)
						{
							var jqobjNext = paneSongList.jqobjTop.nextSibling;
						
							while (jqobjNext &&
									DomOffsetTopCalc(jqobjNext, 
															dd.ScrollToUse.y) < 
																	point.pageY)
							{
								paneSongList.jqobjTop = jqobjNext;
								jqobjNext = paneSongList.jqobjTop.nextSibling;
							}
							
							if (DomOffsetTopCalc(paneSongList.jqobjTop, 
														dd.ScrollToUse.y) < 
																point.pageY)
							{
								paneSongList.liPlaceHolder =
										paneSongList.jqobjTop.parentNode
												.insertBefore(paneSongList.liPlaceHolder,
															paneSongList.jqobjTop);
							}
							else
							{
								paneSongList.liPlaceHolder =
											paneSongList.jqobjTop.parentNode
												.insertBefore(paneSongList.liPlaceHolder,
															 paneSongList.jqobjTop.nextSibling);
							}
						}
						else
						{
							paneSongList.liPlaceHolder =
										document.getElementById('idPLDragScroller')
														.appendChild(paneSongList.liPlaceHolder);
						}
					}
					else
					{
						//console.log("Here too");
						
						var domPrev = paneSongList.liPlaceHolder.previousSibling
						var domNext = paneSongList.liPlaceHolder.nextSibling;
						if (domPrev &&
							DomOffsetTopCalc(domPrev, dd.ScrollToUse.y) > point.pageY)
						{
							paneSongList.liPlaceHolder = 
									paneSongList.liPlaceHolder.parentNode
											.removeChild(paneSongList.liPlaceHolder);
							domPrev.parentNode.insertBefore(paneSongList.liPlaceHolder,
															domPrev);
						}
						else if (domNext &&
							DomOffsetTopCalc(domNext, dd.ScrollToUse.y) < point.pageY)
						{
							paneSongList.liPlaceHolder = 
									paneSongList.liPlaceHolder.parentNode
											.removeChild(paneSongList.liPlaceHolder);
							domNext.parentNode.insertBefore(paneSongList.liPlaceHolder,
															domNext.nextSibling);
						}
						
						domNext = 0;
						domPrev = 0;
					
					}
				}
				else
				{
					if (paneSongList.inInsert)
					{
						
						paneSongList.inInsert = 0;
						
						if (paneSongList.liPlaceHolder &&
							paneSongList.liPlaceHolder.parentNode)
						{							
							paneSongList.liPlaceHolder =
									paneSongList.liPlaceHolder.parentNode
												.removeChild(paneSongList.liPlaceHolder);
						}
						
						if (paneSongList.inInsert != 1)
						{
							document.getElementById('idPLDropTop').className = '';
							document.getElementById('idPLDropBot').className = '';
						}
					}
				}
			}
			else
			{
				if ((point.pageX > dd.portT.left) && 
					(point.pageX < dd.portT.overallRight) &&
					(point.pageY > dd.portT.top) &&
					(point.pageY < dd.portT.overallBottom))
				{
					if (point.pageY < dd.portT.firstBottom)
					{
						// if in portrait top div
						if (paneSongList.inInsert != 2)
						{
							paneSongList.inInsert = 2;
							document.getElementById('idPLDropTop').className = 
														'classDropTargGlow';
						}
						
						return;
					}
					else if (point.pageY > dd.portB.top)
					{
						// if in portrait bottom div
						if (paneSongList.inInsert != 3)
						{
							paneSongList.inInsert = 3;
							document.getElementById('idPLDropBot').className = 'classDropTargGlow';
						}
						
						return;					
					}
				}
				
				if (paneSongList.inInsert)
				{
					if (paneSongList.liPlaceHolder.parentNode)
					{
						paneSongList.liPlaceHolder = 
								paneSongList.liPlaceHolder.parentNode
											.removeChild(paneSongList.liPlaceHolder);
					}
					
					document.getElementById('idPLDropTop').className = '';
					document.getElementById('idPLDropBot').className = '';
				}
				
				paneSongList.inInsert = 0;
			}
			
			return false;
		}
		
		var funcHandleDrop = function(event)
		{
			dd = 0;
			
			clearInterval(paneSongList.intScroll);
			
			document.getElementById('blockInput').style.display = "none";
			
			document.removeEventListener(MOVE_EV, funcHandleDrag, false);
			document.removeEventListener(END_EV, funcHandleDrop, false);
		  
			paneSongList.GenreScrollBox.AllowInput();
			paneSongList.ArtistScrollBox.AllowInput();
			paneSongList.AlbumScrollBox.AllowInput();
			paneSongList.TitleScrollBox.AllowInput();
			paneSongList.AlbViewScrollBox.AllowInput();
			paneSongList.FolderScrollBox.AllowInput();
			paneSongList.SearchScrollBox.AllowInput();
			
			var point = hasTouch ? event.changedTouches[0] : event;
		 
			paneSongList.liClone.parentNode.removeChild(paneSongList.liClone);

			paneSongList.liAddSource.style.cssText = ""; 
		 
			if (paneSongList.inInsert == 1)
			{
				var jqobjNext = paneSongList.liPlaceHolder.nextSibling;
				
				var iIntoPnt;
				
				if (jqobjNext)
				{
					iIntoPnt = Number(jqobjNext.id.substr(6));
				}

				if (bIsFolderV)
				{
					if (bIsFolderV == 1)
					{
						objwAMP.AddSong(paneSongList.objFile.Playable[paneSongList.strDomIdFilter],
									0,
									iIntoPnt);
					}
					else
					{
						var str = objwAMP.getCurrentPath(0);
						objwAMP.SetCurrentPath(paneSongList.strDomIdFilter, 0);
						
						var obj = objwAMP.GetDirFileList(0);
						objwAMP.AppendPlaylist(obj.Playable, 
												0, 
												iIntoPnt);
						objwAMP.SetCurrentPath(str, 0);
					}
				}
				else if (bIsXML)
				{
					objwAMP.AddSong(paneSongList.remoteXML[paneSongList.strDomIdFilter],
									0,
									iIntoPnt);
				}
				else if (isNaN(paneSongList.strDomIdFilter))
				{

					var arrayNewPlaylist = 
							paneSongList.GetSongsFromClassString(paneSongList.strDomIdFilter);
								
					objwAMP.AppendPlaylist(arrayNewPlaylist, 0, iIntoPnt);
				}
				else
				{
					objwAMP.AddSong(objSongIndex.arrayIndex[paneSongList.strDomIdFilter],
									0,
									iIntoPnt);
				}
			}
			else if (paneSongList.inInsert > 1)
			{
				var iIntoPnt;
				
				if (paneSongList.inInsert == 2)
					iIntoPnt = 0;
				
				if (bIsFolderV)
				{
					if (bIsFolderV == 1)
					{
						objwAMP.AddSong(paneSongList.objFile.Playable[paneSongList.strDomIdFilter],
									0,
									iIntoPnt);
					}
					else
					{
						var str = objwAMP.getCurrentPath(0);
						objwAMP.SetCurrentPath(paneSongList.strDomIdFilter, 0);
						
						var obj = objwAMP.GetDirFileList(0);
						objwAMP.AppendPlaylist(obj.Playable, 
												0, 
												iIntoPnt);
						objwAMP.SetCurrentPath(str, 0);
					}
				}
				else if (bIsXML)
				{
					objwAMP.AddSong(paneSongList.remoteXML[paneSongList.strDomIdFilter],
									0,
									iIntoPnt);
				}
				else if (isNaN(paneSongList.strDomIdFilter))
				{
					var arrayNewPlaylist = 
							paneSongList.GetSongsFromClassString(paneSongList.strDomIdFilter);
								
					objwAMP.AppendPlaylist(arrayNewPlaylist, 0, iIntoPnt);
				}
				else
				{
					objwAMP.AddSong(objSongIndex.arrayIndex[paneSongList.strDomIdFilter],
									0,
									iIntoPnt);
				}
			}

			if (paneSongList.liPlaceHolder.parentNode)
			{
				paneSongList.liPlaceHolder.parentNode
											.removeChild(paneSongList.liPlaceHolder);
				paneSongList.liPlaceHolder = 0;
			}
						
			document.getElementById('idPLDropTop').className = '';
			document.getElementById('idPLDropBot').className = '';
		}
		
		document.addEventListener(MOVE_EV, funcHandleDrag, false);
		document.addEventListener(END_EV, funcHandleDrop, false);
	},

	Show: function(iShowBox)
	{
		paneSongList.iTitFiltLen = 0;
		document.getElementById('idPickerButDiv').style.display = "none";
		document.getElementById('idPickerPane').className = strSaveOrientation;

		paneIndex.ShowPLDragPane();
		paneScrub.recRecordOne.QuickStop();
		
		switch(iShowBox)
		{
		case GENRE_SB:
			paneSongList.GenreScrollBox.RecalcBottom();
			paneSongList.GenreScrollBox.YScrollTo(0);
			break;
		case ARTIST_SB:
			paneSongList.ArtistScrollBox.RecalcBottom();
			paneSongList.ArtistScrollBox.YScrollTo(0);
			break;
		case ALBUM_SB:
			paneSongList.AlbumScrollBox.RecalcBottom();
			paneSongList.AlbumScrollBox.YScrollTo(0);
			break;
		case TITLE_SB:
			paneSongList.TitleScrollBox.RecalcBottom();
			paneSongList.StickyHeader(paneSongList.TitleScrollBox.y, 'clp_', 
									'idTitleStickyHead', 40, 0);
			break;
		case FOLDER_SB:
			paneSongList.FolderScrollBox.RecalcBottom();
			paneSongList.FolderScrollBox.YScrollTo(0);
			break;
		case SEARCH_SB:
			document.getElementById('idListFilter').focus();
			paneSongList.bSearchDirty = 1;
			break;				
		case LIST_SB:
			paneSongList.ListScrollBox.RecalcBottom();
			paneSongList.ListScrollBox.YScrollTo(0);
		}

	},
	
	BuildPLs: function(arrayPLs)
	{
		var strHTML = "";
		var i = 0;
		while(i<arrayPLs.length)
		{
			var iPL = arrayPLs[i];
			
			strHTML += '<li id="PL_' + i + '" class="classtitlePL">' + (i+1) + '.&nbsp ';
			strHTML += iPL + '</li>';
			
			i++;
		}
	
		document.getElementById('idListUL').innerHTML = strHTML;	
	},
	
	BuildRecentList: function(arrayRecent)
	{
		var strHTML = "";
		var i = arrayRecent.length;
		var iCnt = 1;
		while(i--)
		{
			var iIndex = objSongIndex.objQuickIndexLoc[arrayRecent[i]];
			var objSong = objSongIndex.arrayIndex[iIndex];
			
			if (!objSong || arrayRecent[i] != objSong.path)
			{
				console.log("Problem, RecentSongList(" + 
								arrayRecent[i] + 
								") path mismatch: " +
								((objSong) ? objSong.path : "No Obj Found"));
				continue;
			}
			
			strHTML += '<li id="lit_' + iIndex + '" class="classtitlePL">'
			strHTML += (iCnt++) + ". &nbsp " + objSong.title + " (" + objSong.artist;
			strHTML += ')</li>';
		}
	
		document.getElementById('idListUL').innerHTML = strHTML;
	},
	
	BuildDirList: function()
	{
		var tmp = objwAMP.GetDirFileList();
	
		sceneSplash.Dir = SortArrayByParam(tmp.Dir,
										'name');
	
		var strLiString = "";
		
		for (var i = 0; i < sceneSplash.Dir.length; i++)
		{	
			strLiString += '<li id="pdir_' + i + '" class="classFolderVDir">';
				strLiString += '<div class="classCatImgBox">';
				strLiString += '</div>';
			strLiString += sceneSplash.Dir[i].name;
			strLiString += '</li>';
		}

		document.getElementById('idUseUL').innerHTML = strLiString;
	
	},
	
	BuildFileList: function()
	{
	
		paneSongList.objFile = objwAMP.GetDirFileList();
	
		paneSongList.objFile.Dir = SortArrayByParam(paneSongList.objFile.Dir,
										'name');
										
		paneSongList.objFile.Playable = SortArrayByParam(paneSongList.objFile.Playable,
										'name');
	
		var strLiString = "";
		
		
		for (var i = 0; i < paneSongList.objFile.Dir.length; i++)
		{	
			strLiString += '<li id="dir_' + i + '" class="classFolderVDir">';
				strLiString += '<div class="classCatImgBox">';
				strLiString += '</div>';
			strLiString += paneSongList.objFile.Dir[i].name;
			strLiString += '</li>';
		}
		

		for (var i = 0; i < paneSongList.objFile.Playable.length; i++)
		{	
			strLiString += '<li id="sgf_'; 
						strLiString += i;
						strLiString += '" class="classFolderVPlayable">';
				strLiString += '<div class="classCatImgBox">';
				strLiString += '</div>';
			strLiString += paneSongList.objFile.Playable[i].name;
			strLiString += '</li>';
		}

		document.getElementById('idFolderUL').innerHTML = strLiString;

	},
	
	BuildSongListDiv: function()
	{
		ProfilerTickAndRestart("BuildSongListDiv");
		
		if (!objSongIndex.arrayIndex.length)
		{
			sceneDialog.funcYes = function()
			{
				objOptions.ResetIndexTime();
			};
			
			sceneDialog.funcNo = function()
			{
				objOptions.SetCurrentVersion();
				objOptions.UpdateLastIndexTime();				
			};
		
			document.getElementById('idTellUser').innerHTML = 
				"Audiophile's indexer failed to find any music files.  Would you like to select a different a indexing method next time you start up?  If you have no music files on your pad, or in the directory you wanted Audiophile to search, click No and you won't see this message again.";
			sceneDialog.Open(1);
			return;
		}
	
		var strLiString = "";
		var arraySorted;
		var iArtistUnknown = 0;
		var iGenreUnknown = 0;
		var arrayGenreForSearch = [];
		var arrayArtistForSearch = [];
		var arrayAlbumForSearch = [];
		var arrayTitleForSearch = [];
		
		var charSep;
		var oldSep = 'null';
		var iClpCnt = 0;
		var bFixFirst = 1;
		paneSongList.objTrackNumFav = new Object();
		
		try
		{
			var iGenreUnknown = objSongIndex.objGenres['[unknown]'];
			
			arraySorted = SortArrayInvF(objSongIndex.arrayGenres);
			while(arraySorted.length)
			{	
				var strGenre = arraySorted.pop();
				
				charSep = strGenre.getFirstLetter();
				
				if (charSep != oldSep)
				{
					if (oldSep != 'null')
						strLiString += '</ul>';
				
					paneSongList.objTrackNumFav['clpgen_' + iClpCnt] = 0;
		
					strLiString += '<ul id="clpgen_' + (iClpCnt++) + 
									'" class="classUniSubPan"><div class="listItemHeader">' +
									charSep + '</div>';
					oldSep = charSep;
				}
				
				
				var i = objSongIndex.objGenres[strGenre.toLowerCase()];
				
				if (isNaN(i))
					continue;
				
				strLiString += '<li id="Gen_'+i+'" class="classwScrollTarg classGen_'+i+'">';
						
					// Div for adding images to
					strLiString += '<div id="idImgGen_' + i + '" class="classCatImgBox"></div>';
					// Name of the Genre
					strLiString += strGenre;
				strLiString += '</li>';
				
				arrayGenreForSearch.push('<li id="ge_'+i+
							'" class="HclassTitleSubPaneHide">'+
							strGenre +'</li>');
			}
			
			document.getElementById('idGenreUL').innerHTML = strLiString;
		}
		catch(e)
		{
			console.log(e);
		}
		
		strLiString = "";
		
		try
		{
			var iArtistUnknown = objSongIndex.objArtists['[unknown]'];
			
			oldSep = 'null';
			iClpCnt = 0;
			
			arraySorted = SortArrayInvF(objSongIndex.arrayArtists);
			while(arraySorted.length)
			{	
				var strArtist = arraySorted.pop();
				
				charSep = strArtist.getFirstLetter();
				
				if (charSep != oldSep)
				{
					if (oldSep != 'null')
						strLiString += '</ul>';
				
					paneSongList.objTrackNumFav['clpart_' + iClpCnt] = 0;
		
					strLiString += '<ul id="clpart_' + (iClpCnt++) + 
									'" class="classUniSubPan"><div class="listItemHeader">' +
									charSep + '</div>';
					oldSep = charSep;
				}
				
				var i = objSongIndex.objArtists[strArtist.toLowerCase()];
				
				if (isNaN(i))
					continue;
				
				strLiString += '<li id="Art_' +
								i +
								'" class="classwScrollTarg classArt_' + 
								i + 
								'" style="display: list-item;">';
					// Div for adding images to
					strLiString += '<div id="idImgArt_' + i + '" class="classCatImgBox"></div>';
					// Name of the Album
					strLiString += strArtist;
				strLiString += '</li>';
				
				arrayArtistForSearch.push('<li id="ar_'+i+
							'" class="HclassTitleSubPaneHide">'+
							strArtist +'</li>');
			}
			
			strLiString += '</ul>';
			
			document.getElementById('idArtistUL').innerHTML = strLiString;
		}
		catch (e)
		{
			console.log(e);
		}
			
		strLiString = "";
		
		var arraySongs = new Array(objSongIndex.arrayAlbums.length);
		var iUnkIndex = objSongIndex.objAlbums['[unknown]-[unknown]'];
		
		try
		{
			arraySorted = objSongIndex.arrayAlbums.slice(0);
			
			arraySorted.sort(function(a, b)
					{
						if ((!a) || (!a.album) || (a.album == '[Unknown]'))
							return -1;
						if ((!b) || (!b.album) || (b.album == '[Unknown]'))
							return 1;

						return b.album.toLowerCase().localeCompare(a.album.toLowerCase());
					});
					
			oldSep = 'null';
			iClpCnt = 0;

			paneSongList.objAlbNumFav = new Object();

			while(arraySorted.length)
			{	
				var objAlb = arraySorted.pop();
				
				charSep = objAlb.album.getFirstLetter();
				
				if (charSep != oldSep)
				{
					if (oldSep != 'null')
						strLiString += '</div>';
				
					paneSongList.objTrackNumFav['clpalb_' + iClpCnt] = 0;
		
					strLiString += '<div id="clpalb_' + (iClpCnt++) + 
									'" class="classUniSubPan"><div class="listItemHeader">' +
									charSep + '</div>';
					oldSep = charSep;
				}
				
				var strLookUp;
				if (objAlb.albumArtist)
					strLookUp = objAlb.album + '-' + objAlb.albumArtist;
				else
					strLookUp = objAlb.album + '-' + objAlb.artist;
					
				var i = objSongIndex.objAlbums[strLookUp.toLowerCase()];
				
				if (isNaN(i))
					continue;
				
				// Outer Album div
				strLiString += '<div id="Alb_' + i + 
					'" style="display: list-item;" class="classIndivAlb classAlb_'+i+'">';
					
					// Div to make it easier to modify images
					strLiString += '<div id="idImgAlb_'+i+'" class="classImgHolder"><img height="99" width="99" src="res/player/noimgsm.png" class="classCatImgBox" /></div><div class="classAlbumText">';
						strLiString += objAlb.album;
					strLiString += '<p>';
						strLiString += (objAlb.albumArtist) ? objAlb.albumArtist : objAlb.artist;
					strLiString += '</p></div><div class="classAlbUlScroller"><ul id="idAlb_'+i+'" class="classPickerSub"></ul></div></div>';
				
				arrayAlbumForSearch.push('<li id="al_'+i+
								'" class="HclassTitleSubPaneHide">'+
								objAlb.album+'</li>');
				
				arraySongs[i] = new Array(60);
			}
			
			strLiString += '</div>';
			
			document.getElementById('idAlbumPicker').innerHTML = strLiString;
		}
		catch(e)
		{
			console.log(e);
		}
		
		var i = objSongIndex.arrayIndex.length;
		
		var arrayTitles = [];
		
		while(i--)
		{
			try
			{
				var iAlbIndex;
				var iArtIndex;
				var iGenIndex;
				
				var objAlb = objSongIndex.arrayIndex[i];
				
				var strAlbum;
				if (objAlb.albumArtist)
					strAlbum = objAlb.album + '-' + objAlb.albumArtist;
				else
					strAlbum = objAlb.album + '-' + objAlb.artist;
				
				iAlbIndex = objSongIndex.objAlbums[strAlbum.toLowerCase()];
					
				var strArtist = objSongIndex.arrayIndex[i].artist.toLowerCase();
				
				iArtIndex = objSongIndex.objArtists[strArtist];
				
				var strGenre = objSongIndex.arrayIndex[i].genre.toLowerCase();
				
				iGenIndex = objSongIndex.objGenres[strGenre];
				
				var strGenreCls = 'classGen_' + iGenIndex;
				var strArtistCls = 'classArt_' + iArtIndex;
				var strAlbumCls = 'classAlb_' + iAlbIndex;
				
				var strClassForTitle = 'class="' + 
										strGenreCls + ' ' + 
										strArtistCls + ' ' + 
										strAlbumCls;
				
				arrayTitles.push(new 
							TitleIndexStruct(objSongIndex.arrayIndex[i].title,
											 objSongIndex.arrayIndex[i].artist,
											 i,
											 strClassForTitle));
				
				var strLi = '<li id="sng_' + i + '" ' + strClassForTitle + '">';
				
				var iTrack = objSongIndex.arrayIndex[i].track;
				
				if ((!iTrack) || (iTrack > 1000))
					strLi += '<span class="classTrackNumSpan"></span>';
				else
					strLi += '<span class="classTrackNumSpan">' + 
							 iTrack + '</span>';
				
				strLi += objSongIndex.arrayIndex[i].title + '</li>';
				
				if (iAlbIndex == iUnkIndex)
				{
					arraySongs[iUnkIndex].push(strLi);
				}
				else
				{
					if ((!isNaN(iTrack)) && 
						(iTrack <= 60) &&
						(iTrack > 0) &&
						(!arraySongs[iAlbIndex][(0|iTrack)-1]))
					{
						arraySongs[iAlbIndex][(0|iTrack)-1] = strLi;
					}
					else
					{
						arraySongs[iAlbIndex].push(strLi);
					}
				}
				
				var domAlbumDiv = 
						document.getElementById('Alb_' + iAlbIndex);
				if (domAlbumDiv.className.indexOf(strGenreCls) == -1)
					domAlbumDiv.className += ' ' + strGenreCls;
				
				if (domAlbumDiv.className.indexOf(strArtistCls) == -1)
					domAlbumDiv.className += ' ' + strArtistCls;
					
				/*jqobjAlbumDiv.children('.classAlbViewArtLn')
								.text(objSongIndex.arrayArtists[iArtIndex]);*/
					
				var domArtistDiv = 
								document.getElementById('Art_' + iArtIndex);
				if (domArtistDiv.className.indexOf(strGenreCls) == -1)
					domArtistDiv.className += ' ' + strGenreCls;
			}
			catch(e)
			{
				console.log(e);
			}
		}
		
		if (objSongIndex.arrayAlbums)
		{
			for(var i=0; i<objSongIndex.arrayAlbums.length; i++)
			{	
				if (arraySongs[i])
				{
					var domObj = document.getElementById('idAlb_' + i);
					
					if (domObj)
						domObj.innerHTML = arraySongs[i].join('');
				}
			}
		}
		
		try
		{
			arrayTitles.sort(TitleIndexStrSort);
		}
		catch(e)
		{
			console.log(e);
		}
		
		charSep = arrayTitles[0].strTitle.getFirstLetter();
		
		paneSongList.objTrackNumFav['clp_0'] = 0;
		
		strLiString = '<ul id="clp_0" class="classUniSubPan"><li class="listItemHeader">' +
						charSep + '</li>';
		
		iClpCnt = 1;
		
		for(var i=0; i<arrayTitles.length; i++)
		{	
			try
			{
				var curChar = arrayTitles[i].strTitle.getFirstLetter();
				
				if (charSep != curChar)
				{
					charSep = curChar;
					paneSongList.objTrackNumFav['clp_' + iClpCnt] = 0;
					strLiString += '</ul><ul id="clp_' + (iClpCnt++) + '" class="classUniSubPan"><li class="listItemHeader">' +
							charSep + '</li>';
				}
				
				var strInterMed = arrayTitles[i].strTitle +
									' (' + 
									arrayTitles[i].strArtist +
									')</li>';
				
				strLiString += '<li ' + arrayTitles[i].strClass +
									' classtitle-li classUniSubPan" id="tit_' + 
									arrayTitles[i].iIndex +
									'" ' +
									'>';
				// div for doing favorites
				strLiString += strInterMed;
				
				arrayTitleForSearch.push('<li id="ti_' + 
										arrayTitles[i].iIndex + 
										'" class="HclassTitleSubPaneHide">' +
										strInterMed);
				
			}
			catch(e)
			{
				console.log(e);
			}

		}
		
		strLiString += '</ul>';
		
		document.getElementById('idTitleScroller').innerHTML = strLiString;
		
		// Draw search Div
		strLiString = '<ul id="idSP_0" class="HclassTitleSubPaneHide">';
		strLiString += '<li class="listItemHeader">Genre</li>';
		strLiString += arrayGenreForSearch.join('');
		
		strLiString += '</ul><ul id="idSP_1" class="HclassTitleSubPaneHide">';
		strLiString += '<li class="listItemHeader">Artist</li>';
		strLiString += arrayArtistForSearch.join('');
		
		strLiString += '</ul><ul id="idSP_2" class="HclassTitleSubPaneHide">';
		strLiString += '<li class="listItemHeader">Album</li>';
		strLiString += arrayAlbumForSearch.join('');
		
		strLiString += '</ul><ul id="idSP_3" class="HclassTitleSubPaneHide">';
		strLiString += '<li class="listItemHeader">Title</li>';
		strLiString += arrayTitleForSearch.join('');
		
		strLiString += '</ul>';
		
		document.getElementById('idSearchScroller').innerHTML = strLiString;
	
		try
		{
			if (paneSongList.objBufferedObj)
				paneSongList.HandleJustType(paneSongList.objBufferedObj, 
											arrayTitles);
			else
				paneSongList.BufferedArrayTiles = arrayTitles;
		}
		catch (e)
		{
			console.log(e);
		}
	
		
		objOptions.GetFavorites(function(arrayFavs) {paneSongList.UpdateFavorites(arrayFavs);});
	},
	
	UpdateFavorites: function(arrayFavs)
	{
		ProfilerTickAndRestart("UpdateFavorites");
		
		while (arrayFavs.length)
		{
			var objEntry = arrayFavs.pop();
			if (!objEntry.name || 
				typeof(objEntry.name) != 'string')
			{
				continue;
			}
			
			var iIndex;
			var domTarget;
		
			switch (objEntry.type)
			{
			case PLNAME_DESC_PATH:
				iIndex = objSongIndex.objQuickIndexLoc[objEntry.name];
				if (!iIndex)
					continue;
				domTarget = document.getElementById('tit_' + iIndex);
				break;
			case PLNAME_DESC_ALBUM:
				iIndex = objSongIndex.objAlbums[objEntry.name.toLowerCase()];
				if (!iIndex)
					continue;
				domTarget = document.getElementById('Alb_' + iIndex);			
				break;
			case PLNAME_DESC_ARTIST:
				iIndex = objSongIndex.objArtists[objEntry.name.toLowerCase()];
				if (!iIndex)
					continue;
				domTarget = document.getElementById('Art_' + iIndex);	
				break;
			case PLNAME_DESC_GENRE:
				iIndex = objSongIndex.objGenres[objEntry.name.toLowerCase()];
				if (!iIndex)
					continue;
				domTarget = document.getElementById('Gen_' + iIndex);				
				break;
			default:
				continue;
			}
		
			if (!domTarget)
				continue;
			
			domTarget.className += ' classMarkAsFav';
			
			domTarget = domTarget.parentNode;
			
			var iNumFav = paneSongList.objTrackNumFav[domTarget.id];
				
			if (iNumFav <= 0)
			{
				paneSongList.objTrackNumFav[domTarget.id] = 1;
				domTarget.className += ' classMarkAsFav';
			}
			else
				paneSongList.objTrackNumFav[domTarget.id] = iNumFav + 1;
		}
		setTimeout(function() {paneSongList.UpdateImages();}, 100);
	},
	
	
	HandleFavoriteEvent: function(domTarget, type)
	{
		if (domTarget.className.indexOf('classMarkAsFav') != -1)
		{	
			domTarget.className =
						domTarget.className.replace(' classMarkAsFav', '');
			
			var iIndex = Number(domTarget.id.substr(4));
			
			if (PLNAME_DESC_ARTIST == type)
			{
				strID = objSongIndex.arrayArtists[iIndex];
			}
			else if (PLNAME_DESC_ALBUM == type)
			{
				strID = objSongIndex.arrayAlbums[iIndex].strUseForUnique;
			}
			else if (PLNAME_DESC_GENRE == type)
			{
				strID = objSongIndex.arrayGenres[iIndex];
			} 
			else if (type == PLNAME_DESC_PATH)
			{
				strID = objSongIndex.arrayIndex[iIndex].path;
			}
			else
				return;
			
			if (!strID)
				return;
			
			domTarget = domTarget.parentNode;
			
			var iNumFav = paneSongList.objTrackNumFav[domTarget.id];
			
			if (iNumFav <= 1)
			{
				paneSongList.objTrackNumFav[domTarget.id] = 0;
				domTarget.className =
						domTarget.className.replace(' classMarkAsFav', '');
			}
			else
				paneSongList.objTrackNumFav[domTarget.id] = iNumFav - 1;

			
			objOptions.MarkItemNotFav(strID,type);
			
		}
		else
		{
			domTarget.className += ' classMarkAsFav';
			
			var iIndex = Number(domTarget.id.substr(4));
			
			if (PLNAME_DESC_ARTIST == type)
			{
				strID = objSongIndex.arrayArtists[iIndex];
			}
			else if (PLNAME_DESC_ALBUM == type)
			{
				strID = objSongIndex.arrayAlbums[iIndex].strUseForUnique;
			}
			else if (PLNAME_DESC_GENRE == type)
			{
				strID = objSongIndex.arrayGenres[iIndex];
			} 
			else if (type == PLNAME_DESC_PATH)
			{
				strID = objSongIndex.arrayIndex[iIndex].path;
			}
			else
				return;
			
			if (!strID)
				return;
			
			domTarget = domTarget.parentNode;
			
			var iNumFav = paneSongList.objTrackNumFav[domTarget.id];
			
			if (iNumFav <= 0)
			{
				paneSongList.objTrackNumFav[domTarget.id] = 1;
				domTarget.className += ' classMarkAsFav';
			}
			else
				paneSongList.objTrackNumFav[domTarget.id] = iNumFav + 1;
			
			objOptions.MarkItemFav(strID,type);
		}
	},
	
	PrepStickyHeader: function(str, iSide, scrollerH, strSticky)
	{	
		var dom, lim;
		paneSongList.quickLookUpAdj[iSide] = 
							DomOffsetTopCalc((dom = document.getElementById(str)));
		
		if ((lim = dom.childNodes.length) == 0)
		{
			paneSongList.arrayQuickLookUp[iSide].length = 0;
			return;
		}
		
		var myArray;
		
		(myArray = paneSongList.arrayQuickLookUp[iSide]).length = lim;
		
		paneSongList.arrayQuickScrDom[iSide].innerHTML = "";
		var iQSheight = paneSongList.arrayQuickScrDom[iSide].offsetHeight/scrollerH;
		
		var iFirstZero = 1, startTop = DomOffsetTopCalc(dom), iTop, child;
		var tmp;
		
		for (var i = 0; i<lim; i++)
		{
			if (iTop = ((child = dom.childNodes[i]).offsetTop))
			{
				myArray[i] = {"top": (iTop + startTop),
							"char": null};
			}
			else
			{
				myArray[i] = {"top": 0,
							"char": null};
			}
				
			if (child.className.indexOf('HclassTitleSubPaneHide') != -1)
				continue;
			
			if ((iTop || iFirstZero) && scrollerH)
			{
				var div = document.createElement('div');
				myArray[i].char = div.innerHTML = child.firstChild.innerHTML;
				
				if (iFirstZero)
				{
					document.getElementById(strSticky).innerHTML = 
												div.innerHTML;
					iFirstZero = 0;
				}
				
				div.style.width = '20px';
				div.style.position = 'absolute';
				div.style.top = (iQSheight*iTop) + 'px';
				paneSongList.arrayQuickScrDom[iSide].appendChild(div);
			}
		};
	},
	
	StickyHeader: function(y, str, strSticky, iStickH, iSide)
	{
		var tmpArray;
		if (!((tmpArray = paneSongList.arrayQuickLookUp[iSide]).length))
			return;
		
		var domSticky = document.getElementById(strSticky);
		
		if (y >= 0)
		{
			domSticky.style.webkitTransform = 
									'translate3d(0,' + 
									y + 'px, 0)';
			return;
		}
		
		y -= paneSongList.quickLookUpAdj[iSide];
		
		var i = 0, cLastGood = tmpArray[0].char, len = tmpArray.length, tmp;
		
		while (i<len)
		{
			if ((tmp = tmpArray[i++]).char == null)
				continue;
		
			var iCalc = tmp.top + y;
			
			if (iCalc > iStickH)
			{
				domSticky.innerHTML = cLastGood;
				domSticky.style.webkitTransform = 
									'translate3d(0,0,0)';
				return;
			}
			else if (iCalc > 0)
			{
				domSticky.innerHTML = cLastGood;
				domSticky.style.webkitTransform = 
									'translate3d(0,' + 
									(iCalc - iStickH) + 'px, 0)';
				return;
			}
			
			cLastGood = tmp.char;
		}
		
		domSticky.innerHTML = cLastGood;
		domSticky.style.webkitTransform = 'translate3d(0,0,0)';
	},
	
	HandleJustType: function(objJTRet, arrayTitles)
	{
		if (paneSongList.BufferedArrayTiles)
			arrayTitles = paneSongList.BufferedArrayTiles;
		else
			return;
	
		if (!objJTRet)
			return;
	
		var i;
		paneSongList.Empty();
		if (objJTRet.category == "Album: ")
		{
			i = objSongIndex.arrayAlbums.length;
			while ((i--) && 
					(objJTRet.keyword != objSongIndex.arrayAlbums[i].album)) {};
						
			if (i<0)
				return; 
			
			var iIndex = i;
			
			var strID = "Alb_" + iIndex;
			var classFilter = 'classAlb_' + iIndex;
			paneSongList.strFilterCls = classFilter;
			
			var domAlbum = document.getElementById(strID);

			document.getElementById('idAlbViewScroller').innerHTML = 
						domAlbum.childNodes[2].innerHTML;
			
			document.getElementById('idAlbViewText').innerHTML =
						domAlbum.childNodes[1].outerHTML;

			paneSongList.AlbViewScrollBox.YScrollTo(0);
			document.getElementById('idAlbViewWrapper').className +=
					' classShowPickedCat classTopLevelPickedCat ';

			paneSongList.Show();
			
			document.getElementById('idAlbViewWrapper').style.display = 'block';
			document.getElementById('idPickerButDiv').style.display = 'block';
			paneSongList.AlbViewScrollBox.RecalcBottom();
				
		}
		else if (objJTRet.category == "Genre: ")
		{
			i = objSongIndex.objGenres[objJTRet.keyword];
		
			var classFilter = 'classGen_' + i;
			paneSongList.strFilterCls = classFilter;
			
			var dom = document.getElementById('idArtistUL');
			
			dom.innerHTML = dom.innerHTML.replace(/y: list-item;/g,
												   'y: none;')
										.replace(/classUniSubPan/g,
												 'HclassTitleSubPaneHide');
			
			var arrayArtChild = dom.getElementsByClassName(classFilter);
			var i = arrayArtChild.length;
			while (i--)
			{
				arrayArtChild[i].style.display = "list-item";
				elements[i].parentNode.className = 'classUniSubPan'
			}
			
			paneSongList.AlbumScrollBox.YScrollTo(0);
			dom = document.getElementById('idArtistWrapper');
			dom.className += ' classShowPickedCat classTopLevelPickedCat ';
			
			paneSongList.Show();
			
			dom.style.display = "block";
			
			document.getElementById('idPickerButDiv').style.display = "block";
			paneSongList.ArtistScrollBox.RecalcBottom();		
		}
		else if (objJTRet.category == "Artist: ")
		{
			i = objSongIndex.objArtists[objJTRet.keyword];
	
			var classFilter = 'classArt_' + i;
			paneSongList.strFilterCls = classFilter;
				
			var dom = document.getElementById('idAlbumPicker');
			dom.innerHTML = dom.innerHTML.replace(/y: list-item;/g, 'y: none;')
											.replace(/classUniSubPan/g,
														   'HclassTitleSubPaneHide');
			
			var elements = dom.getElementsByClassName(classFilter);
			
			var i = elements.length;
			
			while(i--)
			{
				arrayArtChild[i].style.display = "list-item";
				elements[i].parentNode.className = 'classUniSubPan'
			}
			
			paneSongList.AlbumScrollBox.YScrollTo(0);
			document.getElementById('idAlbumWrapper').className += 
							' classShowPickedCat classTopLevelPickedCat ';
			
			paneSongList.Show();
			
			document.getElementById('idAlbumWrapper').style.display = "block";
			document.getElementById('idPickerButDiv').style.display = "block";
			paneSongList.AlbumScrollBox.RecalcBottom();

		}
		else if (objJTRet.category == "Title: ")
		{
			//console.log("At least we are in title: " + objJTRet.keyword);
		
			i = arrayTitles.length;
			while ((i--) && 
					(objJTRet.keyword != arrayTitles[i].strTitle)) 
			{
				//console.log(arrayTitles[i].strTitle);
			};
						
			if (i<0)
				return; 
		
			var iIndex = arrayTitles[i].iIndex;
			
			if (panePlaylist.bFirstPL != 1)
			{
			
				panePlaylist.bFirstPL = 1;
			
				objwAMP.RegisterPLCallback(function() 
				{
			
					objwAMP.RegisterPLCallback(function(arrayPL) 
					{
						panePlaylist.DrawPlaylist(arrayPL);
					});
			
					objwAMP.EmptyPlaylist(0);
					objwAMP.AddSong(objSongIndex.arrayIndex[iIndex]);
					objwAMP.OpenSong(0, 0);
					paneControls.PlayPauseChange(PLAYER_PLAY_STATE);
				});
			}
			else
			{
				objwAMP.EmptyPlaylist(0);
				objwAMP.AddSong(objSongIndex.arrayIndex[iIndex]);
				objwAMP.OpenSong(0, 0);
				paneControls.PlayPauseChange(PLAYER_PLAY_STATE);
			}
		}
	
	},
	
	ClearSearch: function()
	{			
		paneSongList.iTitFiltLen = 0;
		document.getElementById('idSearchScroller').innerHTML = 
				document.getElementById('idSearchScroller').innerHTML.replace(/classUniSubPan/g,
														   'HclassTitleSubPaneHide');
		document.getElementById('idSearchStickyHead').style.display = 'none';
	},
	
	ClearTitleFilter: function()
	{
		paneSongList.iTitFiltLen = 0;
		var dom = document.getElementById('idTitleScroller');
		
		dom.innerHTML = dom.innerHTML.replace(/HclassTitleSubPaneHide/g,
														   'classUniSubPan');

		paneSongList.TitleScrollBox.RecalcBottom();
	},
	
	SearchIndex: function(strVal)
	{		
		if (!strVal || !strVal.length)
		{
			paneSongList.ClearSearch();
			return;
		}
		
		if (paneSongList.iTitFiltLen > strVal.length)
		{
			paneSongList.ClearSearch();
		}
		
		paneSongList.iTitFiltLen = strVal.length;
		
		var liObj = 0;
		var ulObj = 0;
		var bVis = 0;
		
		var arrayUlObjs = document.getElementById('idSearchScroller').childNodes;
		
		var jlen = arrayUlObjs.length;
		
		for (var j=0; j<jlen; j++)
		{
			bVis = 0;
			ulObj = arrayUlObjs[j];
			
			var len = ulObj.childNodes.length;
			
			for (var i=1; i < len; i++)
			{
				liObj = ulObj.childNodes[i];
				
				
				if (liObj.innerHTML.toLowerCase().indexOf( strVal ) != -1)
				{
					liObj.className = 'classUniSubPan';
					bVis = 1;
				}
				else
				{
					liObj.className = 'HclassTitleSubPaneHide';
				}
			};
			
			if (bVis)
				ulObj.className = 'classUniSubPan';
			else
				ulObj.className = 'HclassTitleSubPaneHide';
		};

		paneSongList.SearchScrollBox.RecalcBottom();
		
		if (document.getElementById('idSearchStickyHead')
										.style.display != "block")
		{
			document.getElementById('idSearchStickyHead').style.display = "block";
			paneSongList.StickyHeader(paneSongList.SearchScrollBox.y, 
									  'idSP_', 
									  'idSearchStickyHead',
									  40,
									  0);
		}
	},
	
	FilterTitles: function(strVal)
	{
		if (!strVal || !strVal.length)
		{
			paneSongList.ClearTitleFilter();
			return;
		}
		
		if (paneSongList.iTitFiltLen > strVal.length)
		{
			paneSongList.ClearTitleFilter();
		}
		
		paneSongList.iTitFiltLen = strVal.length;
		
		var liObj = 0;
		var ulObj = 0;
		var bVis = 0;
		
		var arrayUlObjs = document.getElementById('idTitleScroller').childNodes;
		
		var len = arrayUlObjs.length;
		
		for (var j=0; j<len; j++)
		{
			bVis = 0;
			ulObj = arrayUlObjs[j];
			
			for (var i=1; i < ulObj.childNodes.length; i++)
			{
				liObj = ulObj.childNodes[i];
				
				if (liObj.innerHTML.toLowerCase().indexOf( strVal ) == -1)
				{
					liObj.className = liObj.className.replace('classUniSubPan',
														'HclassTitleSubPaneHide');
				}
				else
					bVis = 1;
			};
			
			if (bVis)
			{
				ulObj.className = ulObj.className.replace('HclassTitleSubPaneHide',
													'classUniSubPan');
			}
			else
			{
				ulObj.className = ulObj.className.replace('classUniSubPan',
													'HclassTitleSubPaneHide');
			}
		};

		liObj = 0;
		
		paneSongList.TitleScrollBox.RecalcBottom();
	},
	
	UpdateImages: function()
	{
		ProfilerTickAndRestart("UpdateImages");
		
		var jlen = objSongIndex.arrayAlbums.length;
		
		var limGenArray = new Array(objSongIndex.arrayGenres.length);
		var limArtArray = new Array(objSongIndex.arrayArtists.length);
		
		for(var j=0; j<jlen; j++)
		{		
			var objAlbum = objSongIndex.arrayAlbums[j];
			
			if (!objAlbum.imgLarge)
			{
				objAlbum.imgSmall = "res/player/noimgsm.png";
				objAlbum.imgThumb = "res/player/noimgthm.png";
				objAlbum.imgLarge = "res/player/spinimg.png";
			}
			
			document.getElementById('idImgAlb_' + j).innerHTML = 
													'<img height="64" width="64" ' +
													'src="' +
													objAlbum.imgSmall +
													'" class="classCatImgBox" />';

			var strClassString = document.getElementById('Alb_' + j).className;
			var arrayClasses = strClassString.split(' ');
			
			var len = arrayClasses.length;
			
			for(var i=2; i<len; i++)
			{
				if (arrayClasses[i].lastIndexOf('Gen') != -1)
				{
					iIndex = Number(arrayClasses[i].substr(9));
					
					var objCheck = limGenArray[iIndex];
					
					if (!objCheck)
					{
						objCheck = limGenArray[iIndex] = new Object();
						limGenArray[iIndex].iCheckAmt = 0;
						limGenArray[iIndex].domGen = 
										document.getElementById('idImgGen_' + iIndex);
					}
					
					if (objCheck.iCheckAmt > 9)
						continue;
					
					if (objCheck.iCheckAmt == 9)
					{
						objCheck.domGen.innerHTML = objCheck.oldInner +
										  '<div class="classEasyExclude" style="left: 79px; top: 64px; background-image: url(res/player/moreimgthm.png);"></div>'
					
						objCheck.iCheckAmt = 99;
					}
					else
					{
						if (objCheck.iCheckAmt == 8)
						{
							objCheck.oldInner = objCheck.domGen.innerHTML;
						}
						
						objCheck.domGen.innerHTML += 
												'<div class="classEasyExclude" style="left: ' +
												((objCheck.iCheckAmt % 3) * 27 + 25) +
												'px; top: ' +
												((0|(objCheck.iCheckAmt / 3)) * 12 + 40) +
												'px; background-image: url(' +
												objAlbum.imgThumb +
												');"></div>';		
						objCheck.iCheckAmt++;
					}
				}
				else if (arrayClasses[i].lastIndexOf('Art') != -1)
				{
					iIndex = Number(arrayClasses[i].substr(9));
					
					var objCheck = limArtArray[iIndex];
					
					if (!objCheck)
					{
						objCheck = limArtArray[iIndex] = new Object();
						limArtArray[iIndex].iCheckAmt = 0;
						limArtArray[iIndex].domArt = 
										document.getElementById('idImgArt_' + iIndex);
					}
					
					if (objCheck.iCheckAmt > 9)
						continue;
					
					if (objCheck.iCheckAmt == 9)
					{
						objCheck.domArt.innerHTML = objCheck.oldInner +
									'<div class="classEasyExclude" style="left: ' +
									(2 * 27 + 25) +
									'px; top: ' +
									(2 * 12 + 40) +
									'px; background-image: url(res/player/moreimgthm.png);"></div>'
					
						objCheck.iCheckAmt = 99;
					}
					else
					{
						if (objCheck.iCheckAmt == 8)
						{
							objCheck.oldInner = objCheck.domArt.innerHTML;
						}
						
						objCheck.domArt.innerHTML += 
												'<div class="classEasyExclude" style="left: ' +
												((objCheck.iCheckAmt % 3) * 27 + 25) +
												'px; top: ' +
												((0|(objCheck.iCheckAmt / 3)) * 12 + 40) +
												'px; background-image: url(' +
												objAlbum.imgThumb +
												');"></div>';		
						objCheck.iCheckAmt++;
					}
				}
			
			}
		}
	
		if (objOptions.strVersion != WAMP_VERSION)
			objOptions.SetCurrentVersion();
	
		objOptions.UpdateLastIndexTime();
	
		if (panePlaylist.objCurSong.path)
			paneScrub.PlaceArt(panePlaylist.objCurSong.path);
	
		ProfilerTickAndRestart("?");
		console.log("Finished");
	},
	
	Empty: function()
	{
		document.getElementById('idPickerButDiv').style.display = "none";
		paneSongList.arrayQuickScrDom[0].innerHTML = "";
		paneSongList.arrayQuickScrDom[1].innerHTML = "";
		paneSongList.arrayQuickScrDom[0] = 
					document.getElementById('idFastScrollR');
		
		paneSongList.arrayQuickScrDom[1] = 
					document.getElementById('idFastScrollL');
		
		document.getElementById('idFastScrollL').style.display = 'none';

		var dom = 0;
		
		if (window.PalmSystem)
			window.PalmSystem.keyboardHide();
		
		if (paneSongList.bAlbumViewDirty == 1)
		{
			paneSongList.bAlbumViewDirty = 0;
			document.getElementById('idAlbViewText').innerHTML = '';
			document.getElementById('idAlbViewScroller').innerHTML = '';
			
			dom = document.getElementById('idAlbViewWrapper');
			dom.className = "classPickerCat";
			dom.style.cssText = "";
			document.getElementById('idAlbViewText').style.cssText = '';
		}
		
		if (paneSongList.bArtistDirty == 1)
		{
			paneSongList.bArtistDirty = 0;
			dom = document.getElementById('idArtistWrapper');
			dom.className = "classWrapper classPickerCat";
			dom.style.cssText = "";
			dom = document.getElementById('idArtistUL');
			dom.innerHTML = dom.innerHTML.replace(/y: none;/g, 'y: list-item;')
										.replace(/HclassTitleSubPaneHide/g,
														   'classUniSubPan');
			document.getElementById('idArtistScroller').style.cssText = '';
		}
		
		if (paneSongList.bSearchDirty == 1)
		{
			paneSongList.bSearchDirty = 0;
			dom = document.getElementById('idSearchWrapper');
			dom.className = "classWrapper";
			dom.style.cssText = '';
			dom = document.getElementById('idSearchFull');
			dom.className = "classPickerCat";
			dom.style.cssText = '';
			document.getElementById('idListFilter').value = "";
		}
		
		if (paneSongList.bGenreDirty == 1)
		{
			paneSongList.bGenreDirty = 0;
			dom = document.getElementById('idGenreWrapper');
			dom.className = "classWrapper classPickerCat";
			dom.style.cssText = "";
			document.getElementById('idGenreScroller').style.cssText = '';
		}
		
		if (paneSongList.bAlbumDirty == 1)
		{
			paneSongList.bAlbumDirty = 0;
			dom = document.getElementById('idAlbumWrapper');
			dom.className = "classWrapper classPickerCat";
			dom.style.cssText = "";
			dom = document.getElementById('idAlbumPicker');
			dom.style.cssText = '';
			dom.innerHTML = dom.innerHTML.replace(/y: none;/g, 'y: list-item;')
										.replace(/HclassTitleSubPaneHide/g,
														   'classUniSubPan');
		}
		
		if (paneSongList.bTitleDirty == 1)
		{
			paneSongList.bTitleDirty = 0;
			dom = document.getElementById('idTitleWrapper');
			dom.className = dom.className.replace(' classTopLevelPickedCat', '');
			dom.style.cssText = '';
			dom = document.getElementById('idTitleCont');
			dom.className = dom.className.replace(' classShowPickedCat', '');
			dom.style.cssText = '';
			document.getElementById('idTitleFilter').value = "";
		}
		
		if (paneSongList.bFolderDirty == 1)
		{
			paneSongList.bFolderDirty = 0;
			dom = document.getElementById('idFolderWrapper');
			dom.className = "classWrapper classPickerCat";
			dom.style.cssText = "";
			document.getElementById('idFolderUL').innerHTML = "";
		}
		
		if (paneSongList.bListDirty == 1)
		{
			paneSongList.bListDirty = 0;
			dom = document.getElementById('idListWrapper');
			dom.className = "classWrapper classPickerCat";
			dom.style.cssText = "";
		}
		
		if (paneSongList.bInternetDirty == 1)
		{
			document.getElementById('idInternet').className = "classPickerCat";
			document.getElementById('idInternetWrapper').className = "classWrapper";
		}
		
		if (paneSongList.bYTubeDirty == 1)
		{
			paneSongList.bYTubeDirty = 0;
			dom = document.getElementById('idYTubeWrapper');
			dom.className = "classWrapper classPickerCat";
			dom.style.cssText = "";
			document.getElementById('idPickerPaneInstructions').innerHTML = '<P style="margin:0px 0px 0px 14px">Long Press Icon to Add to Playlist/Long Press Playlist Item to Reorder Playlist (will work with normal playlist view)</p>';
		}
		
		dom = 0;
	},
	
	Close: function()
	{
		if (panePlaylist.bPLDragOut)
			paneIndex.HidePLDragPane();
		
		paneIndex.iCurActive = NONE_SB;
	
		document.getElementById('idPickerPane').className = 
				'classPickerHide ' + strSaveOrientation;

		paneSongList.Empty();

		if (paneControls.iPausePlayState == PLAYER_PLAY_STATE)
			paneScrub.recRecordOne.Start();

		if (visPlayMode[0])
			FastDraw();
	},
	
	ChangeOrientation: function (strOrientation)
	{
		var dom = document.getElementById('idPickerPane');
		
		if (dom.className.indexOf('classPickerHide') != -1)
			dom.className = 'classPickerHide ' + strOrientation;
		else
			dom.className = strOrientation;
	},
	
	CleanUp: function()
	{
		document.getElementById('idbtntitle').removeEventListener(START_EV,
									paneSongList.funcBtnTitle, false);
		paneSongList.funcBtnTitle = 0;
		
		document.getElementById('idPickerJumpTop').addEventListener(START_EV,
														paneSongList.funcJumpToTop,
														false);
		paneSongList.funcJumpToTop = 0;
	
	}
}

var scenePlayer =
{
	InitMyDiv: function ()
	{	
		paneIndex.InitMyPane();
		paneScrub.InitMyPane();
		paneControls.InitMyPane();
		panePlaylist.InitMyPane();
		paneSongList.InitMyPane();
		paneEQ.InitMyPane();
	},
	
	// Change the style dependant on orientation
    ChangeOrientation: function (strOrientation)
	{		
		
		document.getElementById('idPlayer').className = 'classPage classShowPage ' + 
									strOrientation;
		
		paneScrub.ChangeOrientation(strOrientation);
		
		paneControls.ChangeOrientation(strOrientation);
		
		paneEQ.ChangeOrientation(strOrientation);
		
		paneIndex.ChangeOrientation(strOrientation);
		panePlaylist.ChangeOrientation(strOrientation);
		paneSongList.ChangeOrientation(strOrientation);	
	},
	
	CleanUp: function()
	{
		paneSongList.CleanUp();
		paneIndex.CleanUp();
	}
}

function TitleIndexStruct(strTitle, strArtist, iIndex, strClass)
{
	this.strTitle = strTitle;
	this.iIndex = iIndex;
	this.strClass = strClass;
	this.strArtist = strArtist;
}

function TitleIndexStrSort(a, b)
{
	var strA = a.strTitle.toLowerCase();
	var strB = b.strTitle.toLowerCase();
	
	if (strA < strB) //sort string ascending
		return -1;
		
	if (strA > strB)
		return 1;
		
	return 0;
}

var sceneSplash = 
{
	FolderScrollBox: 0,
	bLoaded: 0,
	UseScrollBox: 0,
	bInitFirstEVList: 0,
	
	StillLoadingMsg: function(iCurActive)
	{
		paneIndex.iCurActive = iCurActive;
		document.getElementById('idPickerNotReady').style.display = "block";
		document.getElementById('idPickerButDiv').style.display = "none";
		document.getElementById('idPickerPane').className = strSaveOrientation;
	},
	
	ShowPlayer: function()
	{
		if (window.PalmSystem)
		{
			//console.log("Connecting browser");
			winYouTube.connectBrowserServer();
		}
		
		window.removeEventListener("resize", FirstResize, false);
		window.addEventListener("resize", SecondResize, false);
	
		document.getElementById('idSplash').className = 'classPage';
	
		StatusPill.Stop();
		StatusPill.CleanUp();
	
		scenePlayer.ChangeOrientation(strSaveOrientation);
	
		paneControls.SetValsFromDB();
	
		if (!paneSongList.FolderScrollBox)
		{
			paneSongList.FolderScrollBox = new iScroll('idFolderWrapper', {
				onRefresh: function()
				{
					paneSongList.bFolderDirty = 1;
				},
				onClick: function(e, domTarget)
				{
					if (domTarget.className != "classCatImgBox")
							return;
					
					domTarget = domTarget.parentNode;
					
					if (domTarget.id.substr(0, 3) == 'dir')
					{
						var iIndex = Number(domTarget.id.substr(4));
						
						objwAMP.SetCurrentPath(paneSongList.objFile.Dir[iIndex].path)
					
						document.getElementById('idFolderUL').innerHTML = "";
						paneSongList.FolderScrollBox.YScrollTo(0);
						paneSongList.BuildFileList();
						paneSongList.FolderScrollBox.RecalcBottom();
					}
					else
					{
						var iIndex = Number(domTarget.id.substr(4));
					
						objwAMP.EmptyPlaylist(0);
						objwAMP.AddSong(paneSongList.objFile.Playable[iIndex], 0);
						objwAMP.OpenSong(0, 0);
						paneSongList.Close();
						paneControls.PlayPauseChange(PLAYER_PLAY_STATE);
					}
				},
				hScroll: false,
				onLongPress: paneSongList.DragFunction
			});
		}
	},
	
	InitWAMP: function()
	{
		objwAMP.StatusString = "Permissions Checked, Loading Preferences";
		
		objwAMP.StatusString = "Preferences Loaded, Building the Record Player";
		
		objwAMP.RegisterTextBanner(paneScrub.PlaceBannerText);
		objwAMP.RegisterImgGen(paneScrub.PlaceArt);
		
		scenePlayer.InitMyDiv();
		sceneDJ.InitMyDiv();
	},

	FinishIndex: function(iIndexStatus)
	{
		document.getElementById('idLoadIndicator').style.display = "none";
		
		objwAMP.StatusString = "Indexer Finished, Putting Your Songs In Their Cases";
		
		paneIndex.bFileOnly = false;
		
		var domIndexFin = document.getElementById('idTheIndexerHasFinished');
		
		var funcHideIndex = function()
		{
			domIndexFin.style.display = "none";
			domIndexFin.removeEventListener(START_EV, funcHideIndex, false);
		}
		
		domIndexFin.addEventListener(START_EV, funcHideIndex, false);
		
		if (document.getElementById('idPlayer')
					.className.indexOf('classShowPage') != -1)
		{
			domIndexFin.style.display = "block";
						
			setTimeout(funcHideIndex, 2000);
			
			setTimeout(function()
			{
				console.log("In this one?");
				
				paneSongList.BuildSongListDiv();
				
				document.getElementById('idPickerNotReady').style.display = "none";
			
				switch (paneIndex.iCurActive)
				{
				case GENRE_SB:
					paneIndex.DrawGenre();
					break;
				case TITLE_SB:
					paneIndex.DrawTitle();
					break;
				case ARTIST_SB:
					paneIndex.DrawArtist();
					break;
				case ALBUM_SB:
					paneIndex.DrawAlbum();
				}
			}, 1);
		}		
		else
		{
			sceneSplash.ShowPlayer();
			setTimeout(function()
			{
				console.log("In this one");
				paneSongList.BuildSongListDiv();
			}, 1);
		}
	},

	LoadSplash: function()
	{
		if (!(objwAMP.checkIfPluginInit()))
		{
			setTimeout(function() {sceneSplash.LoadSplash();}, 100);
			return;
		}	
		
		clearTimeout(sceneSplash.tmoutJailFail);
		
		if ((objOptions.timeLastIndex == 0) ||
			(objOptions.strVersion != WAMP_VERSION))
		{
			objOptions.timeLastIndex = 0;
			document.getElementById('idLoadIndicator').style.display = "none";
			sceneSplash.OnFirst();
		}
		else if (objOptions.timeLastIndex == -1)
		{
			objOptions.SafeIndexTimeSet();
			sceneSplash.ContinueLoadSplash();
		}
		else if (objOptions.timeLastIndex == -2)
		{
			sceneDialog.funcClick = function()
			{
				objOptions.timeLastIndex = 0;
				document.getElementById('idLoadIndicator').style.display = "none";
				sceneSplash.OnFirst();			
			};
			
			document.getElementById('idTellUser').innerHTML = 
				'Audiophile failed to index properly last time.  Please select a different indexing method.  You may also email blaclynx@yahoo.com for further help.';
			
			sceneDialog.Open(0);
		}
		else
			sceneSplash.ContinueLoadSplash();
			
	},
	
	BackFromFolder: function()
	{
		document.getElementById('idUseUL').innerHTML = "";
		document.getElementById("idUseWrapper").style.display = "none";
		document.getElementById("idUseWhichMode").style.display = "block";
		document.getElementById("idBotUseInstructions").style.display = "none";
		document.getElementById('idUsePickInst').style.display = "none";
		document.getElementById('idUseBtnInst').style.display = "block";
	},
	
	UseMusicFolder: function(e)
	{
		if (objwAMP.CheckMusicDir(0))
		{
			sceneDialog.funcYes = function()
			{
				objOptions.bNoLoadFlag = 0;
				objOptions.UpdateOption(OPT_ID_NO_LOAD, "0");
				objOptions.strIndexingDir = "/media/internal/music";
				objOptions.UpdateOption(OPT_ID_INDEX_DIR, objOptions.strIndexingDir);
				sceneDialog.Close();
				document.getElementById('idIndexFldSel').style.display = "none";
				sceneSplash.ContinueLoadSplash();
			}
			
			sceneDialog.funcNo = function()
			{
			
			}
			
			if (!sceneSplash.bLoaded)
			{
				document.getElementById('idTellUser').innerHTML = 
				'Please confirm that you would like Audiophile to only scan the directory "music" when looking for music files. Once you click Yes below, the Indexer will start. <b>It should not take more than 30 seconds</b> even if your entire drive is filled with music.  If it does take longer than that, you should restart Audiophile and select a different Indexer options.';
			}
			else
			{
				document.getElementById('idTellUser').innerHTML = 
				'Please confirm that you would like Audiophile to only scan the directory "music" when looking for music files.';
			}
			
			sceneDialog.Open(1);
		}
		else
		{
			sceneDialog.funcYes = function()
			{
				if (objwAMP.CheckMusicDir(1))
				{
					objOptions.bNoLoadFlag = 0;
					objOptions.UpdateOption(OPT_ID_NO_LOAD, "0");
					objOptions.strIndexingDir = "/media/internal/music";
					objOptions.UpdateOption(OPT_ID_INDEX_DIR, objOptions.strIndexingDir);
					sceneDialog.Close();
					document.getElementById('idIndexFldSel').style.display = "none";
					sceneSplash.ContinueLoadSplash();
				}
				else
				{
					sceneDialog.funcClick = 0;
					
					document.getElementById('idTellUser').innerHTML = 
							'Audiophile could not create a directory named "music".  Please click OK and select another indexer option.';
				
					sceneDialog.ResetButton();
				}
			};
		
			sceneDialog.funcNo = function()
			{
				
			};
			
			if (!sceneSplash.bLoaded)
			{
				document.getElementById('idTellUser').innerHTML = 
				'Audiophile did not locate a directory called "music" (note that directory names are case sensitive).  Would you like Audiophile to create one for you?  Click No to go back to the selection screen. If you click Yes, the Indexer will start. <b>It should not take more than 30 seconds</b> even if your entire drive is filled with music.  If it does take longer than that, you should restart Audiophile and select a different Indexer options.';
			}
			else
			{
				document.getElementById('idTellUser').innerHTML = 
				'Audiophile did not locate a directory called "music" (note that directory names are case sensitive).  Would you like Audiophile to create one for you?  Click No to go back to the selection screen.';
			}
				
			sceneDialog.Open(1);
		}
	},
	
	ConfirmUseAll: function(e)
	{
		sceneDialog.funcYes = function()
		{
			objOptions.bNoLoadFlag = 0;
			objOptions.UpdateOption(OPT_ID_NO_LOAD, "0");
			objOptions.strIndexingDir = "/media/internal";
			objOptions.UpdateOption(OPT_ID_INDEX_DIR, objOptions.strIndexingDir);
			sceneDialog.Close();
			document.getElementById('idIndexFldSel').style.display = "none";
			sceneSplash.ContinueLoadSplash();
		};
		
		sceneDialog.funcNo = function()
		{
			
		};
		
		if (!sceneSplash.bLoaded)
		{
			document.getElementById('idTellUser').innerHTML = 
				"Please be aware that selecting this option may cause slower load times, and may cause Audiophile to crash on start up.  It you have problems, you can select a different directory from the options menu. Once you click Yes below, the Indexer will start. <b>It should not take more than 30 seconds</b> seconds even if your entire drive is filled with music.  If it does take longer than that, you should restart Audiophile and select a different Indexer options.";
		}
		else
		{
			document.getElementById('idTellUser').innerHTML = 
				"Please be aware that selecting this option may cause slower load times, and may cause Audiophile to crash on start up.  It you have problems, you can select a different directory from the options menu.";
		}
		sceneDialog.Open(1);	
	},
	
	ConfirmUseWebOS: function(e)
	{
		sceneDialog.funcYes = function()
		{
			objOptions.bNoLoadFlag = 2;
			objOptions.UpdateOption(OPT_ID_NO_LOAD, "2");
			sceneDialog.Close();
			document.getElementById('idIndexFldSel').style.display = "none";
			sceneSplash.ContinueLoadSplash();			
		};
		
		sceneDialog.funcNo = function()
		{
			
		};
		
		if (!sceneSplash.bLoaded)
		{
			document.getElementById('idTellUser').innerHTML = 
				"This option should only be selected if you have had problems with Audiophile loading in the past, and only have mp3 and aac files.  You will not be able to use all of Audiophile's features if you select this option.  Once you click Yes below, the Indexer will start. <b>It should not take more than 30 seconds</b> even if your entire drive is filled with music.  If it does take longer than that, you should restart Audiophile and select a different Indexer options.";
		}
		else
		{
			document.getElementById('idTellUser').innerHTML = 
				"This option should only be selected if you have had problems with Audiophile loading in the past, and only have mp3 and aac files.  You will not be able to use all of Audiophile's features if you select this option."
		}
		sceneDialog.Open(1);
	},
	
	PickFolder: function()
	{
		if (!paneSongList.UseScroller)
		{
			document.getElementById('idUseContinueBtn').addEventListener(START_EV,
				function(e)
				{
					if (!sceneSplash.bLoaded)
					{
						sceneDialog.funcYes = function()
						{
							objOptions.bNoLoadFlag = 0;
							objOptions.UpdateOption(OPT_ID_NO_LOAD, "0");
							objOptions.UpdateOption(OPT_ID_INDEX_DIR, 
														objOptions.strIndexingDir);
							sceneDialog.Close();
							document.getElementById('idIndexFldSel').style.display = "none";
							sceneSplash.ContinueLoadSplash();								
						};
					
						document.getElementById('idTellUser').innerHTML = 
							"Please confirm that you would like to use &#91;" +
							objOptions.strIndexingDir +
							"&#93; as the indexing directory.  Once you click Yes, the indexer will start.  <b>It should not take more than 30 seconds</b>  If it does take longer than that, you should restart Audiophile and select a different Indexer options.";
						sceneDialog.Open(1);
					}
					else
					{
						objOptions.bNoLoadFlag = 0;
						objOptions.UpdateOption(OPT_ID_NO_LOAD, "0");
						objOptions.UpdateOption(OPT_ID_INDEX_DIR, 
													objOptions.strIndexingDir);
						sceneDialog.Close();
						document.getElementById('idIndexFldSel').style.display = "none";
						sceneSplash.ContinueLoadSplash();					
					}
				
				}, false);
			
			paneSongList.UseScrollBox = new iScroll('idUseWrapper', {
				onClick: function(e, domTarget)
				{
					if (domTarget.className != "classCatImgBox")
						return;
					
					domTarget = domTarget.parentNode;
					
					if (domTarget.id.substr(0, 4) == 'pdir')
					{
						var iIndex = Number(domTarget.id.substr(5));
						
						objwAMP.SetCurrentPath(sceneSplash.Dir[iIndex].path)
					
						document.getElementById('idFolderUL').innerHTML = "";
						paneSongList.UseScrollBox.YScrollTo(0);
						paneSongList.BuildDirList();
						paneSongList.UseScrollBox.RecalcBottom();
					}
				},
				hScroll: false,
				onLongPress: function(x, y, domTarget)
				{				
					if (domTarget.className != "classCatImgBox")
						return;
						
					domTarget = domTarget.parentNode;
					
					if (domTarget.id.substr(0, 4) == 'pdir')
					{
						var iIndex = Number(domTarget.id.substr(5));
						
						objOptions.strIndexingDir = 
											sceneSplash.Dir[iIndex].path;

						var dom = document.getElementById('idUseCurSelected');
											
						dom.innerHTML =	"<b>Currently Selected:</b> "+objOptions.strIndexingDir;
						
						document.getElementById('idUseContinueBtn').style.display = "block";
						
						dom = 0;
					}
				}
			});
		}
		
		objwAMP.SetCurrentPath("/media/internal");
		document.getElementById('idUseUL').innerHTML = "";
		document.getElementById("idUseWrapper").style.display = "block";
		document.getElementById("idUseWhichMode").style.display = "none";
		document.getElementById("idBotUseInstructions").style.display = "block";
		document.getElementById('idUsePickInst').style.display = "block";
		document.getElementById('idUseBtnInst').style.display = "none";
		paneSongList.UseScrollBox.YScrollTo(0);
		paneSongList.BuildDirList();
		paneSongList.UseScrollBox.RecalcBottom();
	},
	
	HandleUseFirstChoice: function(e)
	{
		var target = e.target;
		
		if (target.nodeType != 1)
			target = target.parentNode;
		
		e.preventDefault();
		
		switch (target.id)
		{
		case "idUseMusic":
			sceneSplash.UseMusicFolder();
			break;
		case "idUseAll":
			sceneSplash.ConfirmUseAll();
			break;
		case "idUseCustom":
			sceneSplash.PickFolder();
			break;
		case "idUseWebOS":
			sceneSplash.ConfirmUseWebOS();
			break;
		}
	},
	
	OnFirst: function()
	{
		if (!sceneSplash.bInitFirstEVList)
		{
			sceneSplash.bInitFirstEVList = 1;
			
			document.getElementById('idUseWhichMode').addEventListener(START_EV,
				sceneSplash.HandleUseFirstChoice, false);
			
			document.getElementById('idIndexFldClose').addEventListener(START_EV,
				sceneSplash.HideFirstChBox, false);
				
			document.getElementById('idUseWrapBack').addEventListener(START_EV,
				sceneSplash.BackFromFolder, false);
		}
		
		document.getElementById("idUseWrapper").style.display = "none";
		document.getElementById("idUseWhichMode").style.display = "block";
		document.getElementById('idIndexFldSel').style.display = "block";
	},

	HideFirstChBox: function()
	{
		document.getElementById('idIndexFldSel').style.display = "none";
	},
	

	ContinueLoadSplash: function()
	{
		objOptions.IndexDirVis();
		
		if (sceneSplash.bLoaded)
		{
			sceneDialog.funcClick = 0;
			document.getElementById('idTellUser').innerHTML = 
				"Your selection will take effect the next time you load Audiophile.";
			sceneDialog.Open(0, "Ok");
			objOptions.ResetIndexTime();
			return;
		}
		
		document.getElementById('idLoadIndicator').style.display = "block";
		
		sceneSplash.bLoaded = 1;
		
		var me = this;
		
		StatusPill.Resize();
		
		objwAMP.CheckIndex(function(iIndexStatus) 
			{
				sceneSplash.FinishIndex(iIndexStatus);
			},
			function(iSongCount, iPLCount)
			{
				setTimeout(StatusPill.FindingMode(iSongCount, iPLCount), 1);
			},
			function(iPos, iTot, strPath)
			{
				StatusPill.ProcessMode(iPos, iTot, strPath);
			});
			
		
		//StatusPill.Start();
		
		this.InitWAMP();
		
		objOptions.SetwAMPVals();
		
		if (!objOptions.bNoLoadFlag)
			objwAMP.StartIndex();
		else
		{
			if (objOptions.bNoLoadFlag == 1)
			{
				sceneDialog.funcClick = function()
				{
					objSongIndex.AltInit();
					sceneDialog.funcClick = 0;
				}
				
				document.getElementById('idTellUser').innerHTML = "Audiophile failed to load properly last time. Audiophile will use the built in Media Indexer, which means that the Indexer will not detect certain files. You can switch which Indexer to use in the options menu.  You can also turn off this warning message in the options. <p> Please note that Audiophile will not save your playlist unless this warning message is turned off.<p>";
				document.getElementById('idButtonGoesHere').innerHTML = 'Ok';
				document.getElementById('idDialog').style.display = "block";
			}
			else
				objSongIndex.AltInit();
		}
		
		objwAMP.StatusString = "Player is Rocking, Checking the Indexer";
		
	},

	CleanUp: function()
	{
		sceneSplash = 0;
	}
}

var sceneDialog = 
{
	bVisible: false,
	funcClick: 0,
	funcYes: 0,
	funcNo: 0,

	DoClick: function(event)
	{
		if (sceneDialog.funcClick)
				sceneDialog.funcClick(event);
		sceneDialog.Close();
	},
	
	DoYes: function(event)
	{
		if (sceneDialog.funcYes)
				sceneDialog.funcYes(event);
		sceneDialog.Close();
	},
	
	DoNo: function(event)
	{
		if (sceneDialog.funcNo)
				sceneDialog.funcNo(event);
		sceneDialog.Close();
	},
	
	InitMyDiv: function ()
	{
		document.getElementById('idButtonGoesHere')
				.addEventListener(START_EV, sceneDialog.DoClick, false);
				
		document.getElementById('idYesButton')
				.addEventListener(START_EV, sceneDialog.DoYes, false);
				
		document.getElementById('idNoButton')
				.addEventListener(START_EV, sceneDialog.DoNo, false);
	},
	
	Close: function ()
	{
		document.getElementById('idDialog').style.display = "none";
		sceneDialog.ResetButton();
		sceneDialog.bVisible = false;
	},
	
	Open: function(bMode, str)
	{
		if (bMode)
			sceneDialog.ShowYesNo();
		if (str)
			document.getElementById('idButtonGoesHere').innerHTML = str;
		document.getElementById('idDialog').style.display = "block";
		sceneDialog.bVisible = true;
	},
	
	ShowYesNo: function()
	{
		document.getElementById('idButtonGoesHere').style.display = 'none';
		document.getElementById('idYesButton').style.display = 'block';
		document.getElementById('idNoButton').style.display = 'block';	
	},
	
	ResetButton: function()
	{
		document.getElementById('idButtonGoesHere').style.display = 'block';
		document.getElementById('idYesButton').style.display = 'none';
		document.getElementById('idNoButton').style.display = 'none';	
	},
	
	CleanUp: function()
	{
		document.getElementById('idButtonGoesHere')
				.removeEventListener(START_EV, sceneDialog.DoClick, false);
		document.getElementById('idYesButton')
				.removeEventListener(START_EV, sceneDialog.DoYes, false);
		document.getElementById('idNoButton')
				.removeEventListener(START_EV, sceneDialog.DoNo, false);
	}
}