/* FOR DEBUGGING On the device PUT THE FOLLOWING INTO WINDOWS COMMAND PROMPT...
palm-log -d usb --system-log-level=info
palm-log -f -d usb com.epikmayo.audiophile
*/ 

var backManager = 
{

	handleBackGesture: function(e)
	{
		
		/*if (e.keyCode == 86)
		{
			if ($('body').hasClass("classVeer"))
				$('body').removeClass("classVeer");
			else
				$('body').addClass("classVeer");
			return;
		}*/
		
		if (e.keyCode != 27)
		{
			return;
		}
	
		e.preventDefault();
		e.stopPropagation();
	
		if ($('#idFiltHere').hasClass('classAnimateFilterUp'))
		{
			$('#idFiltHere').removeClass('classAnimateFilterUp');
			return;
		}
	
		if (objOptions.bOptVis)
		{
			objOptions.Close();
			return;
		}
	
		var strCurrentScene = $('.classShowPage').get(0).id;

		if (strCurrentScene == "idSplash")
			return;
		else if (strCurrentScene == "idIndex")
		{
			if (scenePlay.iFirstRun)
				return;
			else
				ChangePage($('#idPlayer'));
		}
		else if (strCurrentScene == "idList")
		{
			ChangePage($('#idIndex'));
		}
		else if (strCurrentScene == "idPlayer")
		{
			if (scenePlay.bFilterUp)
			{
				SpinningWheel.cancelAction();		
				SpinningWheel.close();
				scenePlay.bFilterUp = false;
			}
			else
				ChangePage($('#idIndex'));
		}
		else if (strCurrentScene = "idPlaylist")
		{
			ChangePage($('#idPlayer'));
		}
	}

}


var scenePlaylist =
{
	ScrollBox: new wScroll(),

	Init: function()
	{
		$('.classPLRemove').live(START_EV, function() 
		{
			var divParent = $(this).parent();
			var iIndex = Number(divParent.attr('id').substr(6));
		
			divParent.hide(500);
			objwAMP.getPlayList().splice(iIndex, 1);
			if (iIndex == objwAMP.GetIndex())
				objwAMP.OpenSong(iIndex);
			divParent.remove();
			
			var iCount = 0;
			$('#idPlyLstUL').children().each(function()
			{
				if($(this).is('.nowplaying'))
					objwAMP.SetIndex(iCount);
				this.id = 'plyls_' + iCount++;
			});
			
			
			scenePlaylist.ScrollBox.RecalcBottom();
			
		});
	},

	BuildPlaylist: function()
	{
		var test = $('#idPlyLstUL').children().remove();
		var ulPlyLs = $('#idPlyLstUL').get(0);
		
		var arrayPlList = objwAMP.getPlayList();
		
		var strListHTML = "";
				
		for(var i=0; i<arrayPlList.length; i++)
		{
		
			var strTitle;
			var strArtist;
		
			var objSong = arrayPlList[i];
			
			if (objSong.title)
				strTitle = objSong.title;
			else
				strTitle = objSong.name;
			
			if (objSong.artist)
				strArtist = objSong.artist;
			else
				strArtist = objSong.path;
			
			strListHTML += '<li id="plyls_' + 
							Number(i).toString() +
							'">' +
							'<span class="playlistTxt">' +
							strTitle +
							'<br>' +
							strArtist +
							'</span>' +
							'<span class="playlistSideImg"></span></li>';
		
		}
		
		ulPlyLs.innerHTML = strListHTML;
		
		$('#plyls_' + objwAMP.GetIndex()).addClass('nowplaying');
		
		var liClone = 0;
		
		$('#idPlyLstUL li').children('.playlistSideImg')
			.drag("init",
				  function(ev, dd)
				  {
				  	var liParent = $(this).parent();
					liClone = liParent.clone();
					var posOffset = liParent.offset();
					liClone.data("TopOffset", 
									posOffset.top);
					liClone.data("LeftOffset",
									posOffset.left);
					liClone.addClass('classDragging')
							.appendTo($('#idPlaylist'));
					
					var iSaveHeight = liParent.height();
					liParent.css("height", iSaveHeight);
					liClone.css({
							"left": posOffset.left,
							"top": posOffset.top});
					liParent.children().hide();
					liParent.css("background", "#888");
				  })
			.drag("start",
				  function( ev, dd )
				  {
					return liClone;
				  })
			.drag(function( ev, dd )
				  {
					clearInterval(scenePlaylist.intScroll);
				  
					var iTopOffset = $( dd.proxy ).data("TopOffset");
					var iLeftOffset = $( dd.proxy ).data("LeftOffset");
					$( dd.proxy ).css({
						top: iTopOffset + dd.deltaY,
						left: iLeftOffset + dd.deltaX
					});
					
					if (ev.pageY > 330)
					{
						if (scenePlaylist.ScrollBox.y <= 
										scenePlaylist.ScrollBox.maxScrollY)
							return;
					
						scenePlaylist.ScrollBox.scrollTo(8, 0, true);
						dd.update();	
						scenePlaylist.intScroll 
									= setInterval(function()
										{
											scenePlaylist.ScrollBox.scrollTo(8, 
																			 0,
																			 true);
											
											dd.update();
											
											if (scenePlaylist.ScrollBox.y <= 
													scenePlaylist.ScrollBox.maxScrollY)
												clearInterval(scenePlaylist.intScroll);
										}, 50);
					}
					else if (ev.pageY < 40)
					{
						if (scenePlaylist.ScrollBox.y >= 0)
							return;
					
						scenePlaylist.ScrollBox.scrollTo(-8, 0, true);
						dd.update();	
						scenePlaylist.intScroll 
									= setInterval(function()
										{
											scenePlaylist.ScrollBox.scrollTo(-8, 
																			 0,
																			 true);
											
											dd.update();
											
											if (scenePlaylist.ScrollBox.y >= 0)
												clearInterval(scenePlaylist.intScroll);
										}, 50);		
					}
					
				  })
			.drag("end",
				  function( ev, dd )
				  {	
					var liParent = $(this).parent();
					liParent.css("background", "");  
				  
					liParent.children().show();
					$( dd.proxy ).remove();
					clearInterval(scenePlaylist.intScroll);
					
					var liLast = $('#idPlyLstUL').children().last();
					var posOffset = liLast.offset();
					
					var iLowPoint = posOffset.top + liLast.height();

					if (ev.pageY > iLowPoint)
					{
						if (liLast.attr('id') == liParent.attr('id'))
							liLast = liLast.prev();
						liParent.detach();
						liParent.insertAfter(liLast);
					}
					else if (ev.pageY < 40)
					{
						$('#idPlyLstUL').children().each(function()
						{
							var posOffset = $(this).offset();
							
							if ((posOffset.top > 20) && (posOffset.top < 60))
							{
								liParent.detach();
								liParent.insertBefore($(this));
								return false;
							}
						});
					}
					
					var iIndex = objwAMP.GetIndex();
					
					var iCount = 0;
					var arrayNewPL = $('#idPlyLstUL').children().map(function()
					{
						var idOld = Number(this.id.substr(6));
						if($(this).is('.nowplaying'))
							objwAMP.SetIndex(iCount);
						this.id = 'plyls_' + iCount++;
						return arrayPlList[idOld];
					});
					
					objwAMP.setPlayList(arrayNewPL);
					objwAMP.SetNextSong();
					
				  });
				  
			$('#idPlyLstUL li').drop("init",
									function( ev, dd)
									{
										return (this != $(dd.drag).parent().get(0));
									})
							   .drop("start",
									function( ev, dd )
									{
										var posPosition = $(this).offset();
										$(dd.drag).parent().detach();
										
										if (ev.pageY < (posPosition.top + 
																	$(this).height()/2))
											$(dd.drag).parent().insertAfter($(this));
										else
											$(dd.drag).parent().insertBefore($(this));
										
										dd.update();
									});
			
			$.drop({ 
				tolerance: function( event, proxy, target )
				{ 
					var iTemp = event.pageY - target.top;
					return ((iTemp > 0) && (iTemp < target.height))
				}
			});
	},

	PlayClickedSong: function(event, domTarget)
	{
		if (domTarget.nodeName != "LI")
		{
			var jqobjParent = $(domTarget).parents('li');
			
			if (jqobjParent.length == 0)
				return;
			else
				domTarget = jqobjParent.get(0);
		}
		
		var iNewSong = Number(domTarget.id.substr(6));
		objwAMP.OpenSong(iNewSong);
	},
	
	HandleSwipe: function(event, iSwipeDir)
	{
	
		var domTarget = event.target;
	
		if (!domTarget)
			return;

		if (domTarget.nodeName != "LI")
		{
		
			var jqobjParent = $(domTarget).parents('li');
			
			
			if (jqobjParent.length == 0)
				return;
			else
				domTarget = jqobjParent.get(0);
		}
		
		if ($(domTarget).children('div').length == 0)
		{
			$(domTarget).children(
				'.playlistSideImg').animate(
					{'clip':
					 'rect(0px, 120px, 70px, 120px)'}, 200);
		
			var divElem = $('<div class="classPLRemove">Remove</div>');
			divElem.appendTo($(domTarget));
			divElem.animate({'clip':'rect(0px, 110px, 50px, 0px)'}, 200);
		}
		else
		{			
			$(domTarget).children(
				'.playlistSideImg').animate(
					{'clip':
					 'rect(0px, 120px, 70px, 0px)'}, 200);
		
			$(domTarget).children('div').animate({'clip':
									'rect(0px, 0px, 50px, 0px)'}, 200);
		}
	},
	
	UpdateHighlight: function()
	{
		$('#idPlyLstUL li').removeClass();
		$('#plyls_' + objwAMP.GetIndex()).addClass('nowplaying');
	}
	
}



var PLAYER_PAUSED_STATE = 0;
var PLAYER_PLAY_STATE = 1;

var ADD_TYPE_CLEAR_PLAYLIST = 0;
var ADD_TYPE_ADD_TO_TOP = 1;
var ADD_TYPE_PLAY_NEXT = 2;
var ADD_TYPE_ADD_TO_BOTTOM = 3;

var STATE_WAIT_PERIOD = 300;

var scenePlay = {

	iCurSkin: 0,
	iFirstRun: 0,
	iPausePlayState: PLAYER_PLAY_STATE,
	bHideVol: false,
	bPlayOnLoad: false,
	bFilterUp: false,
	fVolScale: 0,
	fVolAmt: 0.5,
	iPauseOnHOut: 1,
	iPlayOnHIn: 0,
	iFirstRun: 1,
	iOneState: 0,
	
	InitMyDiv: function()
	{
		this.Record = new RecordSpin($('#idRecPane'));
		this.Record.Init();
		
		objwAMP.funcImgGenCB = function(strArtist, strAlbum)
		{
			console.log("About to call CheckLastFM with Art: " +
						strArtist + " Album: " + strAlbum);
			scenePlay.Record.CheckLastFM(strArtist, strAlbum);
		
		};
		
		this.ScrubOne = new MusScrubber();
		this.ScrubOne.Init($('#idScrubOne'));
		
		$('#idPlayer').children(".classVolAdjust").bind(START_EV, function()
		{
			if ($('#idVolVertAdj').is(":visible"))		
				$('#idVolVertAdj').hide(0);
			else
				$('#idVolVertAdj').show(0);	
		});
		
		$('#idVolKnob').drag("start",function( ev, dd )
		{
			var div = $(this).prev(); 
	
			dd.limit = div.offset();
			dd.limit.bottom = dd.limit.top + div.outerHeight() - $( this ).outerHeight();
			dd.limit.visAdjust = $('#idVolVertAdj').offset().top;
		})
		.drag(function( ev, dd )
		{
			var iTop = Math.min(dd.limit.bottom, 
								Math.max(dd.limit.top, dd.offsetY));
			
			var iRelTop = iTop - dd.limit.visAdjust;
			
			var fVal = (iRelTop - $('#idVolVerAdjTarg').position().top) * 
						scenePlay.fVolScale;
						
			$(this).css("top", iRelTop);
			$('#idVolDisplayBar').attr("style", 
									   "clip: rect(" + 
											(iRelTop - 20) +
											"px, auto, 400px, auto);");
			scenePlay.SetVol(fVal);
			
		});
		
		$('#idSpeedKnob').drag("start",function( ev, dd )
		{
			var div = $('#idSpeedHorAdjTarg'); 
	
			dd.limit = div.offset();
			dd.limit.right = dd.limit.left + div.outerWidth() - $( this ).width();
			dd.limit.iVisAdj = $('#idSpeedCtl').offset().left;
		})
		.drag(function( ev, dd )
		{
			clearTimeout(scenePlay.timeoutNormSpd);
		
			var iLeft = Math.min(dd.limit.right, 
								Math.max(dd.limit.left, dd.offsetX));
			
			var iRelLeft = iLeft - dd.limit.iVisAdj;
			
			var fVal;
			
			if (iRelLeft > 145)
			{
				var div = $('#idHorDisplayBarR');
			
				$(this).css("left", iRelLeft);
			
				fVal = iLeft - 145 - dd.limit.left;
				fVal *= scenePlay.fSpdFastScl;
				fVal = 1 - fVal;
				
				$('#idHorDisplayBarL').attr("style", 
						"display: none");
				div.attr("style", 
						"clip: rect(auto, " +
						(iRelLeft - 145) +
						"px, auto, 0px);");
			}
			else if (iRelLeft >= 125)
			{
				fVal = 1;
				$(this).css("left", iRelLeft);
				$('#idHorDisplayBarR').attr("style", 
						"display: none");
				$('#idHorDisplayBarL').attr("style", 
						"display: none");
				scenePlay.timeoutNormSpd = setTimeout(function()
											{
												$('#idSpeedKnob').css("left", '135px');
											}, 1000);
			}
			else
			{
			
				fVal = (iLeft - dd.limit.left);
				fVal *= scenePlay.fSpdSlowScl;
				fVal = 4 - fVal;
				
				$('#idHorDisplayBarR').attr("style", 
						"display: none");
				$(this).css("left", iRelLeft);
				$('#idHorDisplayBarL').attr("style", 
						"clip: rect(auto, 152px, auto, " + 
						Number(iRelLeft + 10).toString() +
						"px);");
			}
			
			//console.log(fVal);
			
			objwAMP.SetSpeed(fVal);
			
		});
		scenePlay.fSpdSlowScl = 3/125;

		$('#idTransitionKnob').drag("start",function( ev, dd )
		{
			var div = $('#idTransitionAdjTarg'); 
	
			dd.limit = div.offset();
			dd.limit.right = dd.limit.left + div.outerWidth() - $( this ).width() + 5;
			dd.limit.iVisAdj = $('#idTransitionCtl').offset().left;
		})
		.drag(function( ev, dd )
		{
			clearTimeout(scenePlay.timeoutNormSpd);
		
			var iLeft = Math.min(dd.limit.right, 
								Math.max(dd.limit.left, dd.offsetX));
			
			var iRelLeft = iLeft - dd.limit.iVisAdj;
			
			var fVal;
			
			if (iRelLeft > 120)
			{
				var div = $('#idTHorDisplayBarR');
			
				$(this).css("left", iRelLeft);
			
				fVal = iLeft - 120 - dd.limit.left;
				fVal *= scenePlay.fTranGapScl;
				
				$('#idTHorDisplayBarL').attr("style", 
						"display: none");
				div.attr("style", 
						"clip: rect(auto, " +
						(iRelLeft - 120) +
						"px, auto, 0px);");
			}
			else if (iRelLeft >= 110)
			{
				fVal = 0.0;
				$(this).css("left", iRelLeft);
				$('#idTHorDisplayBarR').attr("style", 
						"display: none");
				$('#idTHorDisplayBarL').attr("style", 
						"display: none");
				scenePlay.timeoutNormSpd = setTimeout(function()
											{
												$('#idTransitionKnob').css("left", '112px');
											}, 1000);
			}
			else
			{
			
				fVal = (iLeft - dd.limit.left);
				fVal *= scenePlay.fTranCrossScl;
				fVal = fVal - 10;
				
				$('#idTHorDisplayBarR').attr("style", 
						"display: none");
				$(this).css("left", iRelLeft);
				$('#idTHorDisplayBarL').attr("style", 
						"clip: rect(auto, 152px, auto, " + 
						Number(iRelLeft + 10).toString() +
						"px);");
			}
			
			objwAMP.SetSongTransition(fVal);
			
		});
		scenePlay.fTranCrossScl = 10/110;

						
		this.SetVol(this.fVolAmt);
		
		$('#btnplay').click(function() {scenePlay.PlayPauseChange(PLAYER_PLAY_STATE);});
		$('#btnpause').click(function() {scenePlay.PlayPauseChange(PLAYER_PAUSED_STATE);});
		$('#btndir').click(function() {ChangePage($('#idIndex'));});
		$('#btnnext').click(function() {objwAMP.OpenNextSong();});
		$('#btnprev').click(function() {objwAMP.OpenPrevSong();});
		$('#btneq').click(function() 
		{
				scenePlay.ShowFilters();
		});
		
		$('#idBtnApply').click(function() {scenePlay.FilterDone();});
		$('#idBtnCancel').click(function() {scenePlay.FilterReset();});
		
		$('#btnshuf').click(function() 
		{
			scenePlay.ModeControl(PLAY_MODE_REPEAT);
		});
		
		$('#btnrep').click(function() 
		{
			scenePlay.ModeControl(PLAY_MODE_NORMAL);
		});
		
		$('#btnnormal').click(function() 
		{
			scenePlay.ModeControl(PLAY_MODE_SHUFFLE);
		});		
		
		$('#btnplylst').click(function()
		{
			ChangePage($('#idPlaylist'));
		});
					
		this.objBassControl = new PalmKnobControl(objOptions.fBass);
		this.objBassControl.init(-15, 195, 160, "idFiltHere", 
								function(fSet) 
								{
									scenePlay.SetBass(fSet);
								},
								"Bass"
								);		
		
		this.objTrebControl = new PalmKnobControl(objOptions.fTreble);
		this.objTrebControl.init(145, 195, 160, "idFiltHere", 
								function(fSet) 
								{
									scenePlay.SetTreble(fSet);
								},
								"Treble"
								);
		
		var me = this;
		
		//scenePlay.UpdateState();
		
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
				
				if (me.iPauseOnHOut)
				{
					if (status["state"] == "up")
					{
						me.PlayPauseChange(PLAYER_PAUSED_STATE);
						return;
					}
				}
				
				if (me.iPlayOnHIn)
				{
					if (status["state"] == "down")
					{
						me.PlayPauseChange(PLAYER_PLAY_STATE);
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
			
				console.log(JSON.stringify(status));
			
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
							scenePlay.PlayPauseChange(PLAYER_PAUSED_STATE);
							break;
						case "play":
							scenePlay.PlayPauseChange(PLAYER_PLAY_STATE);
							break;
						case "stop":
							scenePlay.PlayPauseChange(PLAYER_PAUSED_STATE);
							break;
						case "repeat-all":
							scenePlay.ModeControl(PLAY_MODE_REPEAT);
							break;
						case "repeat-track":
							scenePlay.ModeControl(PLAY_MODE_REPEAT);
							break;
						case "repeat-none":
							scenePlay.ModeControl(PLAY_MODE_NORMAL);
							break;
						case "shuffle-on":
							scenePlay.ModeControl(PLAY_MODE_SHUFFLE);
							break;
						case "shuffle-off":
							scenePlay.ModeControl(PLAY_MODE_NORMAL);
							break;
					}
	
				}
			}
			
			reqObject.call("luna://com.palm.keys/media/status", parameters );
		}
		
	},
	
	Display: function()
	{
		if (scenePlay.iFirstRun)
		{
			scenePlay.iFirstRun = 0;
	
			this.ScrubOne.bScrubInProgress = false;
	
			this.fVolScale = 1/($('#idVolVerAdjTarg').height() - $('#idVolKnob').height());
			
			console.log($('#idVolVerAdjTarg').height() + " - " + $('#idVolKnob').height() +
						" - " + $('#idVolVerAdjTarg').offset().top + " - " +
						$('#idVolVertAdj').offset().top);
			
			var iRelTop = $('#idVolVerAdjTarg').height() * 
								scenePlay.fVolAmt - 
								$('#idVolKnob').height()/2 + 
								$('#idVolVerAdjTarg').offset().top -
								$('#idVolVertAdj').offset().top + 5;
			$('#idVolKnob').css("top", iRelTop);
			$('#idVolDisplayBar').attr("style", 
										"clip: rect(" + 
										(iRelTop - 20) + 
										"px, auto, 400px, auto);");
			
			$('#idVolVertAdj').hide();
		
			$('#idSpeedKnob').css("left", '135px');
			$('#idHorDisplayBarR').attr("style", 
										"display: none");
			$('#idHorDisplayBarL').attr("style", 
										"display: none");
			scenePlay.fSpdFastScl = 0.5/($('#idSpeedHorAdjTarg').width() - 145 - 36);
			
			this.objTrebControl.RestoreVal(objOptions.fTreble);
			this.objBassControl.RestoreVal(objOptions.fBass);
			this.ScrubOne.OrientChange();
		}
	
		var fTranVal = Number(objwAMP.GetSongTransition());
		
		if (fTranVal > 0.5)
		{
			var iLeft = fTranVal * ($('#idTransitionAdjTarg').width() - 130 - 36)/10;
			iLeft += 130;
			$('#idTransitionKnob').css("left", iLeft);
			$('#idTHorDisplayBarL').attr("style", 
						"display: none");
			$('#idTHorDisplayBarR').attr("style", 
						"clip: rect(auto, " +
						(iLeft - 130) +
						"px, auto, 0px);");
		
		}
		else if (fTranVal < -0.5)
		{
			var iLeft = fTranVal + 10;
			iLeft *= 10.5;
			iLeft += $('#idTransitionAdjTarg').offset().left;
			//iLeft += $('#idTransitionCtl').offset().left
		
			$('#idTransitionKnob').css("left", iLeft-21);
			$('#idTHorDisplayBarR').attr("style", 
							"display: none");	
			$('#idTHorDisplayBarL').attr("style", 
						"clip: rect(auto, 152px, auto, " + 
						iLeft +
						"px);");							
		}
		else
		{
			$('#idTransitionKnob').css("left", '112px');
			$('#idTHorDisplayBarR').attr("style", 
							"display: none");
			$('#idTHorDisplayBarL').attr("style", 
							"display: none");
		}
		scenePlay.fTranGapScl = 10/($('#idTransitionAdjTarg').width() - 120 - 30);	
	

		this.PlayPauseChange(scenePlay.iPausePlayState);	
		this.ModeControl(objwAMP.GetMode());
	},
	
	UpdateState: function()
	{
		//console.log("Entering UpdateState");
	
		clearTimeout(scenePlay.timoutOneState);
		
		if (scenePlay.iOneState)
			return;
		
		scenePlay.iOneState = 1;
			
		this.PluginState = objwAMP.GetState();
			
		if (this.PluginState.EndTime != this.ScrubOne.iEndTime)
				this.ScrubOne.SetEndTime(this.PluginState.EndTime);

		this.ScrubOne.SetCurTime(this.PluginState.CurTime);
				
		scenePlay.timoutOneState = setTimeout(function() 
										{
											scenePlay.UpdateState();
										}, STATE_WAIT_PERIOD);

		scenePlay.iOneState = 0;
	},

	ShowFilters: function () 
	{
		$('#idVolVertAdj').hide();
		$('#idFiltHere').addClass('classAnimateFilterUp');
	},
	
	FilterDone: function() 
	{
		$('#idFiltHere').removeClass('classAnimateFilterUp');
		objwAMP.SetNextSong();
	
		objOptions.UpdateOption(OPT_ID_BASS, this.objBassControl.GetVal());
		objOptions.UpdateOption(OPT_ID_TREB, this.objTrebControl.GetVal());
		objOptions.UpdateOption(OPT_ID_TRANS, objwAMP.GetSongTransition());
	},

	FilterReset: function() 
	{		
		this.objBassControl.RestoreVal(0.5);
		objwAMP.SetBass(1.0);
		
		this.objTrebControl.RestoreVal(0.5);
		objwAMP.SetTreble(1.0);
		
		$('#idSpeedKnob').css("left", '135px');
		$('#idHorDisplayBarR').attr("style", 
						"display: none");
		$('#idHorDisplayBarL').attr("style", 
						"display: none");
		objwAMP.SetSpeed(1.0);
		
		$('#idTransitionKnob').css("left", '112px');
		$('#idTHorDisplayBarR').attr("style", 
						"display: none");
		$('#idTHorDisplayBarL').attr("style", 
						"display: none");
		objwAMP.SetSongTransition(0.0);
		objwAMP.SetNextSong();
	},
	
	SetTreble: function(event)
	{	
		var myvalue = (event * 2);
		objwAMP.SetTreble(myvalue);
	},

	SetBass: function(event)
	{	
		var myvalue = (event * 2);
		objwAMP.SetBass(myvalue);
	},
	
	ForcePause: function()
	{
		this.PlayPauseChange(PLAYER_PAUSED_STATE);
	},
		
		
	SetVol: function(fVol)
	{
		fVol = 1 - fVol;
	
		$('#idPlayer').children(".classVolAdjust").hide();
		if (fVol > 0.75)
			$('#btnsound100').show();
		if (fVol > 0.5)
			$('#btnsound75').show();
		else if (fVol > 0.25)
			$('#btnsound50').show();
		else if (fVol > 0.01)
			$('#btnsound25').show();
		else
		{
			fVol = 0;
			$('#btnmute').show();
		}
		
		scenePlay.fVolAmt = fVol;

		objwAMP.SetVol(fVol);
	},
	
	PlayPauseChange: function(iState)
	{
		if (iState == PLAYER_PLAY_STATE)
		{
			this.iPausePlayState = PLAYER_PLAY_STATE;
			objwAMP.play();
			this.Record.Start();
			$('#btnplay').hide();
			$('#btnpause').show();
			scenePlay.UpdateState();
		}
		else
		{
			this.iPausePlayState = PLAYER_PAUSED_STATE;
			objwAMP.pause();
			this.bPlayOnLoad = false;
			this.Record.Stop();
			$('#btnplay').show();
			$('#btnpause').hide();
			clearTimeout(scenePlay.timoutOneState);
		}
	},
	
	ModeControl: function(iMode)
	{
		objwAMP.SetMode(iMode);
		
		switch(iMode)
		{
			case PLAY_MODE_SHUFFLE:
				$('#btnshuf').show();
				$('#btnrep').hide();
				$('#btnnormal').hide();
				break;
			case PLAY_MODE_REPEAT:
				$('#btnshuf').hide();
				$('#btnrep').show();
				$('#btnnormal').hide();
				break;
			case PLAY_MODE_NORMAL:
				$('#btnshuf').hide();
				$('#btnrep').hide();
				$('#btnnormal').show();
		}
	}
	
}

var sceneList = {
	
	arrayBreadC: new Array(),
	
	InitMyDiv: function()
	{
		$("#idListFilter" ).keyup(function(event, ui)
		{
			sceneList.ScrollBox.filterList(this.value.toLowerCase());
		});
		
		this.ScrollBox = new wScroll();
	},
	
	SetTopImg: function(iImagePath)
	{	
		this.iImagePath = iImagePath;
	
		if (isNaN(iImagePath))
		{
			$('#idListHeader').attr('class', 'classFolderIndex');
		}
		else
		{
			switch (iImagePath)
			{
				case 0:
					$('#idListHeader').attr('class', 'classTitleIndex');
					break;
				case 1:
					$('#idListHeader').attr('class', 'classAlbumIndex');
					break;
				case 2:
					$('#idListHeader').attr('class', 'classArtistIndex');
					break;
				case 3:
					$('#idListHeader').attr('class', 'classGenreIndex');
			}
		}
	},
	
	LoadImages: function()
	{		
		if (this.iDisplayType == LIST_TYPE_INDEX)
		{
			this.ScrollBox.IndexDraw(this.arrayFirst, 
									 $("#idScroller").get(0),
									 function(e, domTarget)
									 {
										sceneList.IndexClick(e, domTarget);
									 });
		}
		else
		{
			this.ScrollBox.FileDraw(this.objFirst, 
									$("#idScroller").get(0),
									function(e, domTarget)
									 {
										sceneList.FFClick(e, domTarget);
									 });
		}
			
	},
	
	ClearImages: function()
	{
		$("#idListFilter" ).val("");
		$("#idUlList").empty();
	},
	
	IndexClick: function(event, domTarget)
	{
		var strID = domTarget.id;
	
		var iAddType = ADD_TYPE_CLEAR_PLAYLIST;

		if (strID == "sel_all")
		{
			var arrayListItems = $('#idUlList').children(':visible');
			var arraySelected = new Array();
			for (var i = 0; i < arrayListItems.length; i++) 
			{
				var item = $(arrayListItems[i]);
				if (item.is(".selallclass") || item.is(".noshrink"))
					continue;			
				arraySelected.push(item[0].id);
			}
		
			var arrayNewPlaylist = objSongIndex.buildPlayList(arraySelected);
			objwAMP.setPlayList(arrayNewPlaylist);
			objwAMP.OpenSong(0);
			scenePlay.iPausePlayState = PLAYER_PLAY_STATE;
			ChangePage($('#idPlayer'));
			return;
		}
		
		
		var retObj = objSongIndex.getObjectFromHash(strID);
		
		if (isArray(retObj))
		{
			this.arrayFirst = objSongIndex.buildSubList(strID, retObj);
			
			this.ClearImages();
			if (--this.iImagePath < 0)
				this.iImagePath = 0;
			this.SetTopImg(this.iImagePath);
			this.LoadImages();
		}
		else
		{
			switch (iAddType)
			{
			case ADD_TYPE_CLEAR_PLAYLIST:
				var arrayNewPlaylist = new Array();
				arrayNewPlaylist.push(retObj);
				objwAMP.setPlayList(arrayNewPlaylist);
				objwAMP.OpenSong(0);
				scenePlay.iPausePlayState = PLAYER_PLAY_STATE;
				ChangePage($('#idPlayer'));
				break;
			}
		}
	},

	FFClick: function(event, domTarget)
	{
		var iAddType = ADD_TYPE_CLEAR_PLAYLIST;

		var strID = domTarget.id;
		
		if (strID == "sel_all")
		{
			var arrayListItems = $('#idUlList').children(':visible');
			var arraySelected = new Array();
			for (var i = 0; i < arrayListItems.length; i++) 
			{
				var item = $(arrayListItems[i]);
				if (item.get(0).id.indexOf( "pla_" ) == -1)
					continue;			
				arraySelected.push(item[0].id);
			}
		
			var arrayNewPlaylist = new Array();
			
			for (var i = 0; i < arraySelected.length; i++)
			{
				var iIndex = Number(arraySelected[i].slice(4));
				
				arrayNewPlaylist.push(this.objFirst.Playable[iIndex]);
			}
			
			objwAMP.setPlayList(arrayNewPlaylist);
			objwAMP.OpenSong(0);
			scenePlay.iPausePlayState = PLAYER_PLAY_STATE;
			ChangePage($('#idPlayer'));
			return;
		}
		
		if (strID.indexOf( "dir_" ) != -1)
		{
			var iIndex = Number(strID.slice(4));
			var strPath = this.objFirst.Dir[iIndex].path;
		
			console.log(strPath);
		
			objwAMP.setCurrentPath(strPath);
			this.objFirst = objwAMP.getDirFileList();
			
			this.ClearImages();
			this.LoadImages();
		}
		else if (strID.indexOf( "pla_" ) != -1)
		{
			switch (iAddType)
			{
			case ADD_TYPE_CLEAR_PLAYLIST:
				var iIndex = Number(strID.slice(4));			
				var arrayNewPlaylist = new Array();
				arrayNewPlaylist.push(this.objFirst.Playable[iIndex]);
				objwAMP.setPlayList(arrayNewPlaylist);
				objwAMP.OpenSong(0);
				scenePlay.iPausePlayState = PLAYER_PLAY_STATE;
				ChangePage($('#idPlayer'));
				break;
			}
		}
		else if (strID.indexOf( "unk_" ) != -1)
		{
			switch (iAddType)
			{
			case ADD_TYPE_CLEAR_PLAYLIST:
				var iIndex = Number(strID.slice(4));			
				objwAMP.AddSongNow(this.objFirst.Unknown[iIndex]);
				scenePlay.iPausePlayState = PLAYER_PLAY_STATE;
				ChangePage($('#idPlayer'));
				break;
			}
		}
	}
}

function handleSceneIndexOut()
{
	sceneIndex.resetButtons();
}

var sceneIndex = {

	bFileOnly: false,

	InitMyDiv: function()
	{
		if (!this.bFileOnly)
		{
			this.btnPlayAll = new widwAMPIndex($("#idFirstIndex"), PlayAll);
			this.btnAlbumIndex = new widwAMPIndex($("#idSecondIndex"), DrawAlbum);
			this.btnArtistIndex = new widwAMPIndex($("#idThirdIndex"), DrawArtist);
			this.btnGenreIndex = new widwAMPIndex($("#idFourthIndex"), DrawGenre);
			this.btnTitleIndex = new widwAMPIndex($("#idFifthIndex"), DrawTitle);
		}
		this.btnFolderIndex = new widwAMPIndex($("#idSixthIndex"), DrawDir);			
		this.btnOptionIndex = new widwAMPIndex($('#idSeventhIndex'),
												function()
												{
													objOptions.Draw();
												});
		
		document.addEventListener("mouseout", handleSceneIndexOut(), false);
	
	},
	
	LoadImages: function()
	{
		if (this.bFileOnly)
		{
			DrawDir();
			return;
		}	
	},

	resetButtons: function()
	{
		this.btnPlayAll.resetButton();
		this.btnAlbumIndex.resetButton();
		this.btnArtistIndex.resetButton();
		this.btnFolderIndex.resetButton();
		this.btnGenreIndex.resetButton();
		this.btnTitleIndex.resetButton();
		this.btnOptionIndex.resetButton();
	},
	
	ClearImages: function()
	{
		if (!this.bFileOnly)
		{
			this.btnPlayAll.CleanUp();
			this.btnAlbumIndex.CleanUp();
			this.btnArtistIndex.CleanUp();
			this.btnGenreIndex.CleanUp();
			this.btnTitleIndex.CleanUp();
			this.btnFolderIndex.CleanUp();		
			document.removeEventListener("mouseout", handleSceneIndexOut(), false);
		}
	}
}


var sceneSplash = {

	iDoubleCheck: 0,

	InitWAMP: function()
	{
		objOptions.LoadDatabase();
		sceneIndex.InitMyDiv();
		sceneList.InitMyDiv();
		scenePlaylist.Init();
		scenePlay.InitMyDiv();
	},

	FinishIndex: function(iIndexStatus)
	{
		clearTimeout(sceneSplash.timoutFailsafe);
		
		this.iDoubleCheck = -1;
	
		if (iIndexStatus == INDEX_FAILED_LOAD)
		{
			objwAMP.bFolderOnly = true; 
			$('#idTellUser').text("The indexer failed to run properly last time.  " + 
								  "wAMP will only be able to run in Folder Only " + 
								  "View until you are able to successfully run the" + 
								  " indexer. You can rerun the indexer from the " +
								  "options menu.");
								  
			$('#idButtonGoesHere').removeClass();
			$('#idButtonGoesHere').addClass('wampButton');
		
			$('#idButtonGoesHere span').text("Continue");
								  
			$('#idButtonGoesHere').click(function () 
			{
				sceneIndex.bFileOnly = true;
				widStatusPill.Stop();
				ChangePage($('#idIndex'));
			});
			ChangePage($('#idDialog'));
		}
		else
			ChangePage($('#idIndex'));
	},
	
	FailSafe: function()
	{
		if (this.iDoubleCheck == -1)
			return;
	
		sceneSplash.timoutFailsafe = setTimeout(function()
		{
			if (this.iDoubleCheck++ > 6)
			{
				objwAMP.bFolderOnly = true; 
				$('#idTellUser').text("The indexer is taking longer then it should, and may " +
									  "be having problems.  As a result, Audiophile will " +
									  "run in safemode until you are able to rerun the indexer " + 
									  "from the options menu.  In safemode, you will only be able " +
									  "to run access files using Folder view.");
									  
				$('#idButtonGoesHere').removeClass();
				$('#idButtonGoesHere').addClass('wampButton');
			
				$('#idButtonGoesHere span').text("Continue");
									  
				$('#idButtonGoesHere').click(function () 
				{
					sceneIndex.bFileOnly = true;
					widStatusPill.Stop();
					ChangePage($('#idIndex'));
				});
				ChangePage($('#idDialog'));
			
			}
			else
			{
				sceneSplash.FailSafe()
			}
		}, 10000); 
	},
	
	LoadSplash: function()
	{

		var me = this;
		
		if (!(objwAMP.checkIfPluginInit()))
		{
			setTimeout(function() {sceneSplash.LoadSplash();}, 100);
			return;
		}
		
		clearTimeout(sceneSplash.timeoutCheckPlug);
		this.iDoubleCheck++;		
		
		this.InitWAMP();
		widStatusPill.Start();
		
		objwAMP.CheckIndex(function(iIndexStatus) {sceneSplash.FinishIndex(iIndexStatus);});
		
		this.FailSafe();
	}		
}

/******************************************************************************
******************************************************************************
 * WIDGETS
******************************************************************************
 *****************************************************************************/
function DrawArtist()
{
	sceneList.iDisplayType = LIST_TYPE_INDEX;
	sceneList.arrayFirst = objSongIndex.buildAristList();
	sceneList.SetTopImg(2);
	ChangePage($('#idList'));
}

function DrawGenre()
{
	sceneList.iDisplayType = LIST_TYPE_INDEX;
	sceneList.arrayFirst = objSongIndex.buildGenreList();
	sceneList.SetTopImg(3);
	ChangePage($('#idList'));
}

function DrawTitle()
{
	sceneList.iDisplayType = LIST_TYPE_INDEX;
	sceneList.arrayFirst = objSongIndex.buildTitleList();
	sceneList.SetTopImg(0);
	ChangePage($('#idList'));
}

function DrawAlbum()
{
	sceneList.iDisplayType = LIST_TYPE_INDEX;
	sceneList.arrayFirst = objSongIndex.buildAlbumList();
	sceneList.SetTopImg(1);
	ChangePage($('#idList'));
}

function DrawDir()
{
	sceneList.iDisplayType = LIST_TYPE_FF;
	sceneList.SetTopImg("f");
	sceneList.objFirst = objwAMP.getDirFileList();
	ChangePage($('#idList'));
}

function PlayAll()
{
	objwAMP.SetMode(PLAY_MODE_SHUFFLE);
	objwAMP.setPlayList(objSongIndex.PlayAll());
	objwAMP.OpenNextSong();
	scenePlay.iPausePlayState = PLAYER_PLAY_STATE;
	ChangePage($('#idPlayer'));
}


/******************************
 * Record class
 ******************************
function RecordSpin()
{
	this.strImgWrapperID = "divRecord" + 
						   Number(Math.floor(Math.random() * 
						   					 10000)).toString();
	this.strRecordWrapperID = "divRecWrap" + 
							  Number(Math.floor(Math.random() * 
							  					10000)).toString();
	this.strImage = "divRecImg" + 
					Number(Math.floor(Math.random() * 
									  10000)).toString();

	this.iDegCount = 0;
	
	this.spin = function()
	{
		var divRotate = document.getElementById(this.strImgWrapperID);
		divRotate.className = "recordpicspin";
		divRotate.setAttribute("style", this.strStyleString);
	
		divRotate = document.getElementById(this.strImage);
	
		if (divRotate)
		{
			divRotate.className = "recordpicspin";
			divRotate.setAttribute("style", this.strStyleString);
		}
	}

	this.stop = function()
	{
		var divRotate = document.getElementById(this.strImgWrapperID);
		divRotate.className = "recordpic";
		divRotate.setAttribute("style", this.strStyleString);
		
		divRotate = document.getElementById(this.strImage);
		
		if (divRotate)
		{
			divRotate.className = "recordpicspin";
			divRotate.setAttribute("style", this.strStyleString);
		}
	}

	this.init = function(iLeftCoord, iTopCoord, iSize, iImgSize, strDivParent)
	{

		this.originX = iSize/2;
		this.originY = iSize/2
	
		this.strDivParent = strDivParent;
		var divParent = document.getElementById(strDivParent);
		
		var divWrapper = document.createElement("div");
		divWrapper.className = "recordwrapper";
		divWrapper.setAttribute("style","top:" +
							Number(iTopCoord).toString() + "px; left:" +
							Number(iLeftCoord).toString() + "px; ");
		divParent.appendChild(divWrapper);
		divWrapper.id = this.strRecordWrapperID;
		divParent = divWrapper;
		
		divWrapper = document.createElement("div");
		divWrapper.className = "recordparent";
		divParent.appendChild(divWrapper);
		
		divWrapper = document.createElement("div");
		divWrapper.className = "recordspin";
		divParent.appendChild(divWrapper);
		
		divWrapper = document.createElement("div");
		divWrapper.className = "recordhole";
		divParent.appendChild(divWrapper);
		
		var iPicLeft = this.originX - iImgSize/2;
		var iPicTop = this.originY - iImgSize/2;
		
		divWrapper = document.createElement("div");
		divWrapper.className = "recordpic";
		this.strStyleString = "top:" + 
							  Number(iPicTop).toString() + 
							  "px; left:" +
							  Number(iPicLeft).toString() + 
							  "px; ";
		divWrapper.setAttribute("style", this.strStyleString);
		divWrapper.id = this.strImgWrapperID;
		divParent.appendChild(divWrapper);
		
	};

	this.addImage = function(strArtist, strAlbum)
	{
		var imgImage = document.getElementById(this.strImage);
	
		if (imgImage)
			document.getElementById(this.strImgWrapperID).removeChild(imgImage);
	
		this.checkLastFM(strArtist, strAlbum);
	}

	this.addImageCallBack = function(data)
	{
		var strImgPath = data;
		
		if (!(strImgPath) || (strImgPath == ""))
			return;
	
		var divParent = document.getElementById(this.strImgWrapperID);
		
		var imgAlbum = document.createElement("img");
		imgAlbum.className = "recordpic";
		imgAlbum.setAttribute("src", strImgPath);
		imgAlbum.id = this.strImage;
		
		divParent.appendChild(imgAlbum);
	}


	this.checkLastFM = function(strArtist, strAlbum)
	{
	
		console.log("In checkLast");
	
		// Create a cache object 
		var cache = new LastFMCache();

		// Create a LastFM object 
		var lastfm = new LastFM({
			apiKey    : '03164f37686e29a8af8c368071204b8a',
			apiSecret : 'fd6eb5357b415ead8c67793edfb6dd1b',
			cache     : cache
		});

		// Load some artist info. 
		lastfm.album.getInfo({artist: strArtist, album: strAlbum}, 
				{success: 
					function(data){
						console.log("Callback returned");
						this.addImageCallBack(data.album.image[0]["#text"]);
					}.bind(this), 
					error: function(code, message){
						console.log("Nope" + message);
						this.addImageCallBack("");
					}.bind(this)
				});

	}
}*/

var INV_PI = 1/3.14159265;

function PalmKnobControl(fStart)
{
	this.angle = 0;
	this.startAngle = 0;
	this.slices = Math.PI/6;	// 12 slices

	this.iLocked = 0;
	
	this.funcCallback = null;
	this.originX = 0;
	this.originY = 0;
	this.strDivParent = null;
	this.strStyleString = null;
	
	this.bVis = false;
	
	this.iRotateDeg = fStart;
	
	// Create a name for the div.  To make it transparent
	//	to the user in case we want to create multiples,
	//	we add a random number to the div so we don't
	//	have two with the same name.
	this.strDivWrapperID = "divSpinControl" + Number(Math.floor(Math.random() * 10000)).toString();
	this.strImgBackIDW = "imgBackW" + Number(Math.floor(Math.random() * 10000)).toString();
	this.strImgBackIDB = "imgBackB" + Number(Math.floor(Math.random() * 10000)).toString();
	this.strImgFrontID = "imgFront" + Number(Math.floor(Math.random() * 10000)).toString();

	this.handleEvent = function (e) 
	{ 
		if (e.type == 'mousedown') 
		{
			this.rotateStart(e);
		} 
		else if (e.type == 'mousemove') 
		{
			this.rotateMove(e);
		} 
		else if (e.type == 'mouseup')
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
		
		this.strDivParent = strDivParent;
		var divParent = document.getElementById(strDivParent);
		
		this.strStyleString = "height:" +
							Number(iSize).toString() + "px; width:" +
							Number(iSize).toString() + "px; ";
		
		var divWrapper = document.createElement("div");
		divWrapper.className = "rotateableparent";
		divWrapper.setAttribute("style","top:" + Number(iTopCoord).toString() + "px; left:" +
							Number(iLeftCoord).toString() + "px; " +
							"height:" +
							Number(iSize).toString() + "px; width:" +
							Number(iSize).toString() + "px; ");
		divWrapper.id = this.strDivWrapperID;
		
		var divLabel = document.createElement("div");
		divLabel.className = "rotateablelbl";
		divLabel.innerHTML = strLabelText;
		divWrapper.appendChild(divLabel); 
		
		var divDisplay = document.createElement("div");
		divDisplay.className = "rotateabledisplay";
		divDisplay.setAttribute("style",this.strStyleString);
		var imgDisplay = document.createElement("img");
		imgDisplay.setAttribute("src", "res/knob/display.png");
		imgDisplay.className = "rotateabledisplay";
		imgDisplay.setAttribute("height",Number(iSize).toString() + "px");
		imgDisplay.setAttribute("width",Number(iSize).toString() + "px");
		divDisplay.appendChild(imgDisplay);
		divWrapper.appendChild(divDisplay); 
			
		divDisplay = document.createElement("div");
		divDisplay.className = "rotateablefront";
		divDisplay.setAttribute("style",this.strStyleString);
		divDisplay.id = this.strImgFrontID;
		var divDot = $('<div></div>', {
							"css": 
							{
								'position': 'absolute',
								'height': Number(iSize/20).toString() + 'px',
								'width': Number(iSize/20).toString() + 'px',
								'-webkit-border-radius': Number(iSize/40).toString() + 'px',
								'left': Number(iSize/2 - iSize/40).toString() + 'px',
								'top': Number(iSize/4 + iSize/20).toString() + 'px',
								'background-color': "#FFF"
							}});
		divDot.appendTo($(divDisplay));
		divWrapper.appendChild(divDisplay);						
		
		
		// Draw the background circles
		
		
		this.strStyleStringB = "top:" + Number(iSize/4).toString() + 
							"px; left:" +
							Number(iSize/2).toString() + "px; " +
							"height:" +
							Number(iSize/2).toString() + "px; width:" +
							Number(iSize/4).toString() + 
											"px; -webkit-border-bottom-right-radius: " +
							Number(iSize/4).toString() + "px; -webkit-border-top-right-radius: " + 
							Number(iSize/4).toString() + "px; -webkit-transform-origin: 0px " + 
							Number(iSize/4).toString() + "px; " +
							'background: #FFF;';
		
		this.strStyleStringW = "top:" + Number(iSize/4).toString() + 
							"px; left:" +
							Number(iSize/4).toString() + "px; " +
							"height:" +
							Number(iSize/2).toString() + "px; width:" +
							Number(iSize/4).toString() + 
											"px; -webkit-border-bottom-left-radius: " +
							Number(iSize/4).toString() + "px; -webkit-border-top-left-radius: " + 
							Number(iSize/4).toString() + "px; " + 
							"-webkit-transform-origin: " +
								Number(iSize/4).toString() + "px " + 
								Number(iSize/4).toString() + "px; " +
							"background: #000;";
							
		var divDisplay = document.createElement("div");
		divDisplay.className = "rotateablebackcircb";
		divDisplay.id = this.strImgBackIDB;
		divDisplay.setAttribute("style",this.strStyleStringB);
		divWrapper.appendChild(divDisplay);

		divDisplay = document.createElement("div");
		divDisplay.className = "rotateablebackcircbackb";
		divDisplay.setAttribute("style",this.strStyleStringB);
		divWrapper.appendChild(divDisplay); 
						
		divDisplay = document.createElement("div");
		divDisplay.className = "rotateablebackcircw";
		divDisplay.setAttribute("style",this.strStyleStringW);
		divDisplay.id = this.strImgBackIDW;
		divWrapper.appendChild(divDisplay); 

		divDisplay = document.createElement("div");
		divDisplay.setAttribute("style",this.strStyleStringW);
		divDisplay.className = "rotateablebackcircbackw";
		divWrapper.appendChild(divDisplay); 
		
		divWrapper.addEventListener('mousedown', this, false);
		
		divParent.appendChild(divWrapper);
		
		this.angle = this.convertAndDraw(this.iRotateDeg);
	};
	
	this.uninit = function()
	{
		var divWrapper = document.getElementById(this.strDivWrapperID);
		divWrapper.removeEventListener('mousedown', this, false);
		
		var divParent = document.getElementById(this.strDivParent);
		divParent.removeChild(divWrapper);
		
		this.strDivWrapperID = null;
		this.strDivBlckScrub = null;
		this.strDivWhteScrub = null;
		this.strEndTime = null;
		this.strCurTime = null;
		this.iWaitForUpdate = 0;
		this.iEndTime = 0;
		this.iCurTime = 0;
	};
	
	
	this.rotateStart = function(e) 
	{
	
		var pos = $('#' + this.strDivWrapperID).offset();
		var iSize = $('#' + this.strDivWrapperID).width();
	
		this.originX = iSize/2 + pos.left;
		this.originY = iSize/2 + pos.top;
	
		if (this.active)
			this.rotateStop();
		
		this.active = 1;
	
		var divWrapper = document.getElementById(this.strDivWrapperID);
	
		e.preventDefault();
		
		var startX = e.pageX - this.originX;
		var startY = e.pageY - this.originY;
		
		var fATAN2 = Math.atan2(startY, startX)* 180 * INV_PI;
		
		if (fATAN2 < 0)
			fATAN2 += 360;
		
		this.startAngle = this.angle;
		
		this.fLastAngle = fATAN2 - this.angle;
		
		divWrapper.addEventListener('mousemove', this, false);
		divWrapper.addEventListener('mouseup', this, false);
	
	};
	
	
	this.rotateMove = function(e) 
	{
		var dx = e.pageX - this.originX;
		var dy = e.pageY - this.originY;
		var fATAN2 = Math.atan2(dy, dx) * 180 * INV_PI;
		
		if (fATAN2 < 0)
			fATAN2 += 360;
		
		if (this.fLastAngle < fATAN2)
			this.angle+= 5;
		else
			this.angle -= 5;
		
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
		
		var divWrapper = document.getElementById(this.strDivWrapperID);
	
		/*var divOutput = document.getElementById("output");
		divOutput.innerHTML = Number(this.angle).toString();*/
	
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
	
		divWrapper.removeEventListener('mousemove', this, false);
		divWrapper.removeEventListener('mouseup', this, false);
		
		this.convertAndReturn();
		
	};
	
	this.rotateProtected = function(fDeg)
	{
		
		var divFront = document.getElementById(this.strImgFrontID);

		divFront.setAttribute("style", this.strStyleString + 
					"-webkit-transform:rotate(" + 
					Number(fDeg).toString() + "deg);");
					
		var divBackactive;
		var divBack;

		var strStyleStringActive;
		var strStyleStringInactive;
		
		if ((fDeg > 224) && (fDeg <= 360))
		{
			divBackactive = document.getElementById(this.strImgBackIDB);
			strStyleStringActive = this.strStyleStringB;
			divBack = document.getElementById(this.strImgBackIDW);
			strStyleStringInactive = this.strStyleStringW;
		}
		else if ((fDeg >= 0) && (fDeg < 136))
		{
			divBackactive = document.getElementById(this.strImgBackIDW);
			strStyleStringActive = this.strStyleStringW;
			divBack = document.getElementById(this.strImgBackIDB);
			strStyleStringInactive = this.strStyleStringB;
		}

		divBackactive.setAttribute("style",  strStyleStringActive + "-webkit-transform:rotate(" + 
					Number(fDeg).toString() + "deg);");
					
		divBack.setAttribute("style", strStyleStringInactive + "z-index: 26");
	
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

