/* FOR DEBUGGING On the device PUT THE FOLLOWING INTO WINDOWS COMMAND PROMPT...
palm-log -d usb --system-log-level=info
palm-log -f -d usb com.epikmayo.audiophile
*/ 


var backManager = 
{

	handleBackGesture: function(e)
	{
		
		if (e.keyCode != 27)
		{
			return;
		}
	
		e.preventDefault();
		e.stopPropagation();
	
		if (objOptions.bOptVis)
		{
			objOptions.Close();
			return;
		}
	
		var strCurrentScene = $.mobile.activePage.selector;

		if (strCurrentScene == "#idSplash")
			return;
		else if (strCurrentScene == "#idIndex")
		{
			if (scenePlay.iFirstRun == 0)
				return;
			else
				$.mobile.changePage($('#idPlayer'), "slide", true, false);
		}
		else if (strCurrentScene == "#idList")
		{
			$.mobile.changePage($('#idIndex'), "slide", true, false);
		}
		else if (strCurrentScene == "#idPlayer")
		{
			if (scenePlay.bFilterUp)
			{
				SpinningWheel.cancelAction();		
				SpinningWheel.close();
				scenePlay.bFilterUp = false;
			}
			else
				$.mobile.changePage($('#idIndex'), "slide", false, false);
		}
		else if (strCurrentScene = "#idPlaylist")
		{
			$.mobile.changePage($('#idPlayer'), "slide", true, false);
		}
	}

}


var scenePlaylist =
{

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

	SkinMyDiv: function()
	{
		$('#idPlaylistPicture').css({
			'background-image': "url(" + 
					objSkin.theme[objSkin.skinNum].playlist.bgimg +
					")"
		});
	},

	BuildPlaylist: function()
	{
		$('#idPlyLstUL').children().remove();
		
		var strBuildLI = "";
		
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
		
		$('#idPlyLstUL').html(strListHTML);
		
		this.ScrollBox = new ScrollBox();
		$('#plyls_' + objwAMP.GetIndex()).addClass('nowplaying');
		
		var liClone = 0;
		
		$('.playlistSideImg')
			.drag("init",
				  function(ev, dd)
				  {
				  	var liParent = $(this).parent();
					liClone = liParent.clone();
					var posOffset = liParent.offset();
					liClone.jqmData("TopOffset", 
									posOffset.top);
					liClone.jqmData("LeftOffset",
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
				  
					var iTopOffset = $( dd.proxy ).jqmData("TopOffset");
					var iLeftOffset = $( dd.proxy ).jqmData("LeftOffset");
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
					else if (ev.pageY < 72)
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
						liParent.detach();
						liParent.insertAfter(liLast);
					}
					else if (ev.pageY < 73)
					{
						$('#idPlyLstUL').children().each(function()
						{
							var posOffset = $(this).offset();
							
							if ((posOffset.top > 65) && (posOffset.top < 93))
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
		
		
		if ($(domTarget).children('div').jqmData("DeleteShown") != "true")
		{
			$(domTarget).children('div').jqmData("DeleteShown", "true");
			
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
			$(domTarget).children('div').jqmData("DeleteShown", "false");
			
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
	iPausePlayState: PLAYER_PAUSED_STATE,
	bSoundVis: false,
	bHideVol: false,
	bPlayOnLoad: false,
	bFilterUp: false,
	
	Initialize: function()
	{
		this.Record = new RecordSpin();
		this.Record.init(60, 73, 200, 44, "idRecord");
		
		objScrub.init(10, 300, 300, 1.5, "idScrubber");
		
		$('#btnplay').click(function() {scenePlay.PlayPauseChange();});
		$('#btnpause').click(function() {scenePlay.PlayPauseChange();});
		$('#btndir').click(function() {$.mobile.changePage($('#idIndex'), "slide", false, false)});
		$('#btnvol').click(function() {scenePlay.VolumeControl();});
		$('#btnmute').click(function() {scenePlay.VolumeControl();});
		$('#btnnext').click(function() {objwAMP.OpenNextSong();});
		$('#btnprev').click(function() {objwAMP.OpenPrevSong();});
		$('#btneq').click(function() 
		{
			if (scenePlay.bFilterUp)
			{
				SpinningWheel.cancelAction();		
				SpinningWheel.close();
				scenePlay.bFilterUp = false;
			}
			else
				scenePlay.ShowFilters();
		});
		
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
			$.mobile.changePage($('#idPlaylist'), "slide", false, false);
		});
		
		this.SoundAdjust = new VertAdjust();
		this.SoundAdjust.init("idVolControl", function (val) {scenePlay.ChangeVol(val);});
		
		setTimeout(function() {scenePlay.UpdateState();}, 300);
		
		this.objBassControl = new PalmKnobControl(objOptions.fBass);
		this.objBassControl.init(0, 300, 160, "idFiltHere", 
								function(fSet) 
								{
									scenePlay.SetBass(fSet);
								},
								"Bass"
								);		
		
		this.objTrebControl = new PalmKnobControl(objOptions.fTreble);
		this.objTrebControl.init(161, 300, 160, "idFiltHere", 
								function(fSet) 
								{
									scenePlay.SetTreble(fSet);
								},
								"Treble"
								);
		
		SpinningWheel.addSlot({"0.0": 'Gapless Transition', "-4.0": 'Crossfade' }, 'right');
		
		SpinningWheel.setCancelAction(function() {scenePlay.FilterCancel();});
		SpinningWheel.setDoneAction(function() {scenePlay.FilterDone();});
		SpinningWheel.setScrollEndAction(function() {scenePlay.FilterDone();});
		
	},
	
	LoadImages: function()
	{
		if ((this.iCurSkin != objSkin.skinNum) || (this.iFirstRun == 0))
		{
			this.iCurSkin = objSkin.skinNum;
			
			this.iFirstRun = 1;
			
			$('#divNameplate').css("background-image", "url(" + 
								objSkin.theme[objSkin.skinNum].player.nameplate + ")"); 
			$('#btneq').css("background-image", "url(" + 
								objSkin.theme[objSkin.skinNum].player.eqbtn + ")"); 
			$('#btnplay').css("background-image", "url(" + 
								objSkin.theme[objSkin.skinNum].player.playbtn + ")"); 		
			$('#btnprev').css("background-image", "url(" + 
								objSkin.theme[objSkin.skinNum].player.prevsongbtn + ")"); 
			$('#btnpause').css("background-image", "url(" + 
								objSkin.theme[objSkin.skinNum].player.pausebtn + ")"); 
			$('#btnnext').css("background-image", "url(" + 
								objSkin.theme[objSkin.skinNum].player.nextsongbtn + ")"); 							
			$('#btnvol').css("background-image", "url(" + 
								objSkin.theme[objSkin.skinNum].player.volbtn + ")"); 
			$('#btnmute').css("background-image", "url(" + 
								objSkin.theme[objSkin.skinNum].player.mutebtn + ")"); 
			$('#btnshuf').css("background-image", "url(" + 
								objSkin.theme[objSkin.skinNum].player.shufflebtn + ")"); 
			$('#btnnormal').css("background-image", "url(" + 
								objSkin.theme[objSkin.skinNum].player.normalbtn + ")"); 
			$('#btnrep').css("background-image", "url(" + 
								objSkin.theme[objSkin.skinNum].player.repeatbtn + ")");
			$('#btndir').css("background-image", "url(" + 
								objSkin.theme[objSkin.skinNum].player.indexbtn + ")");
			$('#btnplylst').css("background-image", "url(" + 
								objSkin.theme[objSkin.skinNum].player.playlistbtn + ")");								
		}
		
		if (this.bPlayOnLoad)
		{
			if (this.iPausePlayState == PLAYER_PAUSED_STATE)
			{
				this.PlayPauseChange();
			}
		}
		
		
		this.ModeControl(objwAMP.GetMode());
	},
	
	UpdateState: function()
	{
		this.PluginState = objwAMP.getState();
	
		if ((this.PluginState["SongState"] == 103) || 
			(this.PluginState["SongState"] == 102))
		{
			if (this.iPausePlayState == PLAYER_PLAY_STATE)
			{
				this.PlayPauseChange();
			}
			
			$('#nameGoesHere').text("");
			$('#artistGoesHere').text("");
			objScrub.setEndTime(0);
			objScrub.setCurTime(0);
			this.bPlayOnLoad = false;
			return;
		}
	
		if (this.PluginState["EndAmt"] != objScrub.iEndTime)
			objScrub.setEndTime(this.PluginState["EndAmt"]);
	
		objScrub.setCurTime(this.PluginState["CurPos"]);
		
		setTimeout(function() {scenePlay.UpdateState();}, STATE_WAIT_PERIOD);
	},

	ShowFilters: function () 
	{
		try
		{	
			this.bFilterUp = true;
		
			SpinningWheel.open();
			
			this.fOldBassVal = this.objBassControl.GetVal();
			this.fOldTrebVal = this.objTrebControl.GetVal();
			
			this.objBassControl.setVisible(true);
			this.objTrebControl.setVisible(true);
			
			

		} catch (e) { 
			console.log("Error happened: %j", e); 
		};
	},
	
	FilterDone: function() 
	{
		this.bFilterUp = false;
	
		var results = SpinningWheel.getSelectedValues();
		objwAMP.setSongTransitionType(results.keys);
		this.objBassControl.setVisible(false);
		objOptions.UpdateOption(OPT_ID_BASS, this.objBassControl.GetVal());
		this.objTrebControl.setVisible(false);
		objOptions.UpdateOption(OPT_ID_TREB, this.objTrebControl.GetVal());
	},

	FilterCancel: function() 
	{
		this.bFilterUp = false;
	
		this.objBassControl.setVisible(false);
		this.objTrebControl.setVisible(false);
		
		this.objBassControl.RestoreVal(this.fOldBassVal);
		objwAMP.SetBass(this.fOldBassVal);
		
		this.objTrebControl.RestoreVal(this.fOldBassVal);
		objwAMP.SetTreble(this.fOldTrebleVal);
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
		this.iPausePlayState = PLAYER_PAUSED_STATE
		objwAMP.pause();
		this.Record.stop();
		$('#btnplay').show();
		$('#btnpause').hide();
	},
	
	VolumeControl: function(event)
	{	
		if (this.bSoundVis)
		{
			this.SoundAdjust.cleanUp();
		}
			
		this.bSoundVis = !(this.bSoundVis);
		this.SoundAdjust.setVisibility(this.bSoundVis);
	},
		
		
	ChangeVol: function(fVal)
	{
		if (fVal < .05)
		{
			document.getElementById("btnvol").style.visibility = "hidden";
			this.bHideVol = true;
		}
		else
		{
			document.getElementById("btnvol").style.visibility = "visible";
			this.bHideVol = false;
		}
	
		var myvalue = (fVal * 0.87);
		myvalue = myvalue.toString();
		objwAMP.SetVol(myvalue);
	},
	
	PlayPauseChange: function()
	{
		if (this.iPausePlayState == PLAYER_PAUSED_STATE)
		{
			this.iPausePlayState = PLAYER_PLAY_STATE
			objwAMP.play();
			this.Record.spin();
			$('#btnplay').hide();
			$('#btnpause').show();
		}
		else
		{
			this.iPausePlayState = PLAYER_PAUSED_STATE
			objwAMP.pause();
			this.bPlayOnLoad = false;
			this.Record.stop();
			$('#btnplay').show();
			$('#btnpause').hide();
		}
	},
	
	/******************************
	* Deal with playback mode
	* var PLAY_MODE_NORMAL = 0;
	* var PLAY_MODE_REPEAT = 0;
	* var PLAY_MODE_SHUFFLE = 0;	
	******************************/
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
	
	SetTopImg: function(iImagePath)
	{
	
		this.iImagePath = iImagePath;
	
		if (isNaN(iImagePath))
		{
			this.strImgPath = objSkin.theme[objSkin.skinNum].index.file;
		}
		else
		{
			switch (iImagePath)
			{
				case 0:
					this.strImgPath = objSkin.theme[objSkin.skinNum].index.title;
					break;
				case 1:
					this.strImgPath = objSkin.theme[objSkin.skinNum].index.album;
					break;
				case 2:
					this.strImgPath = objSkin.theme[objSkin.skinNum].index.artist;
					break;
				case 3:
					this.strImgPath = objSkin.theme[objSkin.skinNum].index.genre;
			}
		}
	},
	
	LoadImages: function()
	{	
	
		$('<img />',{
				"src": this.strImgPath,
				"class": "indexviewButton"
			}).appendTo($('#idListHeader'));
		
		$('#idListFooter').css("background", 
							objSkin.theme[objSkin.skinNum].list.footerColor);
			
		$("#idListFilter" ).keyup(function(event, ui)
		{
			sceneList.ScrollBox.filterList(this.value.toLowerCase());
		});
	
		if (this.iDisplayType == LIST_TYPE_INDEX)
		{
			this.ScrollBox = new ScrollBox();
			
			this.ScrollBox.IndexDraw(this.arrayFirst, "idScroller");
		}
		else
		{
			this.ScrollBox = new ScrollBox();
			
			this.ScrollBox.FileDraw(this.objFirst, "idScroller");
		}
			
	},
	
	ClearImages: function()
	{
	
		$('#idListHeader').empty();
		$('#idOptionButton').empty();
		$("#idListFilter" ).unbind('keyup');
		$("#idListFilter" ).val("");
		
		this.ScrollBox.ListDestroy();
		
		this.ScollBox = 0;
	},
	
	FastChangeImages: function()
	{
		$('#idListHeader').empty();
		this.SetTopImg(this.iImagePath);
		$('<img />',{
				"src": this.strImgPath,
				"class": "indexviewButton"
			}).appendTo($('#idListHeader'));
		$('#idListFooter').css("background", 
				objSkin.theme[objSkin.skinNum].list.footerColor);
	},
	
	IndexClick: function(strID, bLongPress)
	{

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
			scenePlay.bPlayOnLoad = true;
			$.mobile.changePage($('#idPlayer'), "slide", true, false);
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
				scenePlay.bPlayOnLoad = true;
				$.mobile.changePage($('#idPlayer'), "slide", true, false);
				break;
			}
		}
	},

	FFClick: function(strID, bLongPress)
	{
		var iAddType = ADD_TYPE_CLEAR_PLAYLIST;

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
			scenePlay.bPlayOnLoad = true;
			$.mobile.changePage($('#idPlayer'), "slide", true, false);
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
				scenePlay.bPlayOnLoad = true;
				$.mobile.changePage($('#idPlayer'), "slide", true, false);
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
				scenePlay.bPlayOnLoad = true;
				$.mobile.changePage($('#idPlayer'), "slide", true, false);
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
		this.btnPlayAll = new widwAMPIndex($("#idPlayAllIndex"), PlayAll);
		this.btnAlbumIndex = new widwAMPIndex($("#idAlbumIndex"), DrawAlbum);
		this.btnArtistIndex = new widwAMPIndex($("#idArtistIndex"), DrawArtist);
		this.btnGenreIndex = new widwAMPIndex($("#idGenreIndex"), DrawGenre);
		this.btnTitleIndex = new widwAMPIndex($("#idTitleIndex"), DrawTitle);
		this.btnFolderIndex = new widwAMPIndex($("#idFolderIndex"), DrawDir);			
		this.btnOptionIndex = new widwAMPIndex($('#idOptionIndex'),
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
	
		var me = this;
		
		
		var strImgPlayAll = objSkin.theme[objSkin.skinNum].index.playAll;
		var strImgAlbum = objSkin.theme[objSkin.skinNum].index.album;
		var strImgArtist = objSkin.theme[objSkin.skinNum].index.artist;
		var strImgGenre = objSkin.theme[objSkin.skinNum].index.genre;
		var strImgTitle = objSkin.theme[objSkin.skinNum].index.title;
		var strImgFile = objSkin.theme[objSkin.skinNum].index.file;
		
		$('#idPlayAllIndex').css("background-image", "url(" +
										strImgPlayAll +
										")");
		
		$('#idAlbumIndex').css("background-image", "url(" +
										strImgAlbum +
										")");

		$('#idArtistIndex').css("background-image", "url(" +
										strImgArtist +
										")");

		$('#idGenreIndex').css("background-image", "url(" +
										strImgGenre +
										")");
			
		$('#idTitleIndex').css("background-image", "url(" +
										strImgTitle +
										")");

		$('#idFolderIndex').css("background-image", "url(" +
										strImgFile +
										")");
		
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

	LoadSplash: function()
	{
		var me = this;
		
		if (!(objwAMP.checkIfPluginInit()))
		{
			setTimeout(function() {sceneSplash.LoadSplash();}, 100);
			return;
		}
		
		var jsonIndexer = objwAMP.GetIndexerStatus();
		
		if(jsonIndexer.iIndexingStatus == 0)
		{
			setTimeout(function() {sceneSplash.LoadSplash();}, 100);
			return;
		}
		
		StatusPill.Init(340);
		
		console.log("Test");
		
		if ((jsonIndexer.iIndexingStatus == 1) || (jsonIndexer.iIndexingStatus == 3))
		{
		
			$('#idTellUser').html("This appears to be the first time you have run " +
								  "Audiophile or you are using an old version." +
								  "The program will now take a few minutes to " +
								  "search through your memory card " +
								  "and locate any media files.  Once it has finished, it" +
								  " will create two files on your memory card, ~wamp.tmp " +
								  " and wamp.index.<p>  If the process fails for some reason" +
								  " or the indexing takes longer than 5 minutes, you can" +
								  " restart Audiophile and it will run without an" +
								  " Index.<p>");
		
			$('#idButtonGoesHere').removeClass();
			$('#idButtonGoesHere').addClass(objSkin.theme[objSkin.skinNum].dialog.btntheme);
			
			$('#idButtonGoesHere span').text("Run Index");
		
			$('#idButtonGoesHere').click(function () 
			{
				setTimeout(function() {sceneSplash.WaitForFirstIndex();}, 20);
				$.mobile.changePage($('#idSplash'), "slidedown", false, false);
			});
	
			$.mobile.changePage($('#idDialog'), "slideup", false, false);
		}
		else if (jsonIndexer.iIndexingStatus == -1)
		{
				objwAMP.bFolderOnly = true; 
				$('#idTellUser').text("The indexer failed to run properly last time.  " + 
									  "wAMP will only be able to run in Folder Only " + 
									  "View until you are able to successfully run the" + 
									  " indexer. You can rerun the indexer from the " +
									  "options menu.");
									  
				$('#idButtonGoesHere').removeClass();
				$('#idButtonGoesHere').addClass(objSkin.theme[objSkin.skinNum].dialog.btntheme);
			
				$('#idButtonGoesHere span').text("OK");
									  
				$('#idButtonGoesHere').click(function () 
				{
					sceneIndex.bFileOnly = true;
				
					$.mobile.changePage($('#idIndex'), 
										"slide", 
										false, 
										false);
				});
				$.mobile.changePage($('#idDialog'), "slideup", false, false);
		}
		else
		{
			setTimeout(function() {sceneSplash.WaitForIndexUpdate();}, 20);
		}
	
	},
	
	WaitForIndexUpdate: function()
	{
		var jsonIndexer;
		jsonIndexer = objwAMP.GetIndexerStatus();
		if (jsonIndexer.iIndexingStatus == 4)
		{
			objSongIndex.addArray(jsonIndexer.arrayFileList);
			$.mobile.changePage($('#idIndex'), 
								"slide", 
								false, 
								false);
		}
		else if (jsonIndexer.iIndexingStatus == -1)
		{
			objwAMP.bFolderOnly = true; 
			$('#idTellUser').text("A problem occured while the indexer was " +
								  " running.  Audiophile will only be able to" +
								  " run in Folder Only View until you are" + 
								  "able to successfully run the indexer. " +
								  "You can rerun the indexer from the " +
								  "options menu.");
			
			$('#idButtonGoesHere').removeClass();
			$('#idButtonGoesHere').addClass(objSkin.theme[objSkin.skinNum].dialog.btntheme);
			$('#idButtonGoesHere span').text("OK");
								
			$('#idButtonGoesHere').click(function () 
			{
				sceneIndex.bFileOnly = true;
			
				$.mobile.changePage($('#idIndex'), 
									"slide", 
									false, 
									false);
			});
			$.mobile.changePage($('#idDialog'), "slideup", false, false);
		}
		else
		{
			StatusPill.Animate("Loading: Checking For Changes");
			setTimeout(function() {sceneSplash.WaitForIndexUpdate();}, 20);
		}
	},
	
	WaitForFirstIndex: function()
	{
		var jsonIndexer = objwAMP.GetIndexerStatus();
		if (jsonIndexer.iIndexingStatus == 4)
		{
			objSongIndex.addArray(jsonIndexer.arrayFileList);
			$.mobile.changePage($('#idIndex'), 
								"slide", 
								false, 
								false);
		}
		else if ((jsonIndexer.iIndexingStatus == -1) ||
				 (jsonIndexer.iIndexingStatus == 0))
		{
			objwAMP.bFolderOnly = true; 
			$('#idTellUser').text("A problem occured while the indexer was " +
								  " running.  Audiophile will only be able to" +
								  " run in Folder Only View until you are" + 
								  "able to successfully run the indexer. " +
								  "You can rerun the indexer from the " +
								  "options menu.");
			
			$('#idButtonGoesHere').removeClass();
			$('#idButtonGoesHere').addClass(objSkin.theme[objSkin.skinNum].dialog.btntheme);
			$('#idButtonGoesHere span').text("OK");
								  
			$('#idButtonGoesHere').click(function () 
			{
				sceneIndex.bFileOnly = true;
			
				$.mobile.changePage($('#idIndex'), 
									"slide", 
									false, 
									false);
			});
			$.mobile.changePage($('#idDialog'), "slideup", false, false);
		}
		else
		{
			var iStrLen = jsonIndexer.strCurSearchDir.length;
			var strStatus = "Indexing: " + 
							jsonIndexer.strCurSearchDir.substr(iStrLen - 18);
		
			StatusPill.Animate(strStatus);
			setTimeout(function() {sceneSplash.WaitForFirstIndex();}, 20);
		}
	}
		
}


/******************************************************************************
******************************************************************************
 * WIDGETS
******************************************************************************
 *****************************************************************************/
function wAMPIndex(strImgPath, strDiv, iTop, funcButtonUp)
{
	this.iButtonDown = 0;
	this.strDiv = "#" + strDiv;
	this.strDivName = strDiv;
	this.iTop = iTop;
	this.strImgPath = strImgPath;
	
	this.funcButtonUp = funcButtonUp;
	
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
	
	wAMPIndex.prototype.ButtonUp = function()
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
		
	wAMPIndex.prototype.ButtonDown = function()
	{
		this.iButtonDown = 1;
		
		var add = $("<div />", {
						"id":"delete_" + this.strDivName,
						"style":"top:" + 
							Number(this.iTop+3).toString() + 
							"px; left:5px; position:fixed; " +
							"background-color: #444; opacity:" +
							" 0.50; height:66px; width:310px;" +
							" z-index:2;"
					});
		$(this.strDiv).append(add);
		this.bGreyChild = true;
		
		var str = "delete_" + this.strDivName;
		this._bind("mouseout", document.getElementById(str));
		this.bMouseOutLis = true;
	};
	
	wAMPIndex.prototype.MouseOut = function()
	{
		this.iButtonDown = 0;
		
		var str = "delete_" + this.strDivName;
		this._unbind("mouseout", document.getElementById(str));
		this.bMouseOutLis = false;
		$("#delete_" + this.strDivName).remove();
		this.bGreyChild = false;
	};

	wAMPIndex.prototype.resetButton = function()
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

	wAMPIndex.prototype.CleanUp = function()
	{
	
		this.resetButton();
		
		this._unbind(START_EV);
		this._unbind(END_EV);
		
	}

	wAMPIndex.prototype._bind = function (type, el)
	{
		if (!(el))
			el = document.getElementById(this.strDivName); //this.strParent);
		el.addEventListener(type, this, false);
	}

	wAMPIndex.prototype._unbind = function (type, el)
	{
		if (!(el))
			el = document.getElementById(this.strDivName); //this.strParent);
		el.removeEventListener(type, this, false);
	}

	this._bind(START_EV);
	this._bind(END_EV);
	
}

function DrawArtist()
{
	sceneList.iDisplayType = LIST_TYPE_INDEX;
	sceneList.arrayFirst = objSongIndex.buildAristList();
	sceneList.SetTopImg(2);
	$.mobile.changePage($('#idList'), "slide", false, false);
}

function DrawGenre()
{
	sceneList.iDisplayType = LIST_TYPE_INDEX;
	sceneList.arrayFirst = objSongIndex.buildGenreList();
	sceneList.SetTopImg(3);
	$.mobile.changePage($('#idList'), "slide", false, false)
}

function DrawTitle()
{
	sceneList.iDisplayType = LIST_TYPE_INDEX;
	sceneList.arrayFirst = objSongIndex.buildTitleList();
	sceneList.SetTopImg(0);
	$.mobile.changePage($('#idList'), "slide", false, false)
}

function DrawAlbum()
{
	sceneList.iDisplayType = LIST_TYPE_INDEX;
	sceneList.arrayFirst = objSongIndex.buildAlbumList();
	sceneList.SetTopImg(1);
	$.mobile.changePage($('#idList'), "slide", false, false)
}

function DrawDir()
{
	sceneList.iDisplayType = LIST_TYPE_FF;
	sceneList.SetTopImg("f");
	sceneList.objFirst = objwAMP.getDirFileList();
	$.mobile.changePage($('#idList'), "slide", false, false);
}

function PlayAll()
{
	objwAMP.SetMode(PLAY_MODE_SHUFFLE);
	objwAMP.setPlayList(objSongIndex.PlayAll());
	objwAMP.OpenNextSong();
	scenePlay.bPlayOnLoad = true;
	$.mobile.changePage($('#idPlayer'), "slide", true, false);
}


/******************************
 * Record class
 ******************************/
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
						this.addImageCallBack(data.album.image[0]["#text"]);
					}.bind(this), 
					error: function(code, message){
						console.log("Nope" + message);
						this.addImageCallBack("");
					}.bind(this)
				});

	}
}


var SCRUB_IN_PROCSS 	= -2;
var SCRUB_NORMAL 		= -1;
var SCRUB_WAIT_FOR_PLUG = -3

var ARM_DEG_FINISH		= 22;
		 		 		 
var objScrub = 
{

	// Create a name for the div.  To make it transparent
	//	to the user in case we want to create multiples,
	//	we add a random number to the div so we don't
	//	have two with the same name.
	strDivWrapperID: "divScrubControl" + 
					 Number(Math.floor(Math.random() * 1000)).toString(),
	strDivBlckScrub: "divBlckScrub" + 
					 Number(Math.floor(Math.random() * 1000)).toString(),
	strDivWhteScrub: "divWhteScrub" + 
					 Number(Math.floor(Math.random() * 1000)).toString(),
	strEndTime: "0:00",
	strCurTime: "0:00",
	
	iEndTime: -1,
	
	strDivParent: null,
	strStyleString: null,
	
	fEndConvertDist: 0,
	
	iWaitForUpdate: -1,
	
	handleEvent: function (e) 
	{ 
		if (e.type == START_EV) 
		{
			this.pickStart(e);
		} 
		else if (e.type == MOVE_EV) 
		{
			this.pickMove(e);
		} 
		else if (e.type == END_EV)
		{
			this.pickStop(e);
		}
		
	},

	setEndTime: function(iEndTimeInSec)
	{
		try
		{
			if (isNaN(iEndTimeInSec))
				iEndTimeInSec = 0;
		
			this.iEndTime = iEndTimeInSec;
			// create a factor to convert scrubber loc to secs
			this.fSecToDist = this.iWidth / iEndTimeInSec;
			this.fDistToSec = iEndTimeInSec * this.iInvWidth;			
			this.fInvEnd = 1/iEndTimeInSec;
			this.strEndTime = this.convertNumSecToString(iEndTimeInSec);
		}
		catch(e)
		{
			console.log(e);
		}
	},
	
	setCurTime: function(iCurTimeInSec)
	{
		if (this.iWaitForUpdate == SCRUB_IN_PROCSS)
		{
			return;
		}
		else if (this.iWaitForUpdate == SCRUB_WAIT_FOR_PLUG)
		{
			this.iCurTime += STATE_WAIT_PERIOD/1000;
			this.strCurTime = 
						this.convertNumSecToString(this.iCurTime);
			this.draw(this.iCurTime * this.fSecToDist);
			return;
		}
		else if (this.iWaitForUpdate == SCRUB_NORMAL)
		{
			this.iCurTime = iCurTimeInSec;
			this.strCurTime = this.convertNumSecToString(iCurTimeInSec);
			this.draw(iCurTimeInSec * this.fSecToDist );
		}
		else if (this.iWaitForUpdate >= 0)
		{
			this.iCurTime = this.iWaitForUpdate;
			this.strCurTime = this.convertNumSecToString(this.iWaitForUpdate);
			this.draw(this.iWaitForUpdate * this.fSecToDist );
			this.iWaitForUpdate = SCRUB_NORMAL;
		}
	},
	
	draw: function(iTime)
	{
		try
		{
	
			var strFullTime = this.strCurTime + "|" + this.strEndTime;
			
			$("#" + 
				this.strDivBlckScrub).get(0).setAttribute("style", 
											this.strStyleString + 
											"clip: rect(0px " + 
											Number(iTime + 
												this.iLeftCoord).toString() + 
											"px 480px 0px)");

			var fRotAmt = 22 * this.fInvEnd * this.iCurTime;
											
			$('#btnarm').attr("style", "-webkit-transform: rotate(" + fRotAmt + "deg)");
			
			document.getElementById(this.strDivBlckScrub).innerHTML = 
																strFullTime;
			document.getElementById(this.strDivWhteScrub).innerHTML = 
																strFullTime;
		
		} catch (e) { console.log(e); }
	},
	
	init: function (iLeftCoord, iTopCoord, iWidth, fEMHeight, strDivParent) 
	{
		try
		{	
			this.strStyleString = "top:" + Number(iTopCoord).toString() + 
								"px; left:" +
								Number(iLeftCoord).toString() + "px; width:" +
								Number(iWidth).toString() + "px; height:" +
								Number(fEMHeight).toString() + "em;";

			this.iLeftCoord = iLeftCoord;
			
			this.iWidth = iWidth;
			
			this.iInvWidth = 1/iWidth;

			this.strDivParent = strDivParent;
			var divParent = document.getElementById(strDivParent);
			
			var divWrapper = document.createElement("div");
			divWrapper.className = "scrubwrap";
			divWrapper.setAttribute("style",this.strStyleString);
			divWrapper.id = this.strDivWrapperID;
			
			this.strStyleString = "top:" + Number(iTopCoord).toString() + 
								"px; left:" +
								Number(iLeftCoord).toString() + "px; width:" +
								Number(iWidth-16).toString() + "px; height:" +
								Number(fEMHeight).toString() + "em;";

			var divDisplay = document.createElement("div");
			divDisplay.className = "scruber";
			divDisplay.id = this.strDivWhteScrub;
			divDisplay.setAttribute("style",this.strStyleString);
			divWrapper.appendChild(divDisplay); 
			
			
			divDisplay = document.createElement("div");
			divDisplay.className = "scruberop";
			divDisplay.setAttribute("style",
									this.strStyleString + 
										" clip:rect(0px 0px 480px 0px);");
			divDisplay.id = this.strDivBlckScrub;
			divWrapper.appendChild(divDisplay); 
			
			divWrapper.addEventListener(START_EV, this, false);
			divParent.appendChild(divWrapper);
			
			this.divNewPop = $("<div></div>",
						{
							"id": "divNewPop",
							"class": "scrubpopup"
						});
			
			this.divNewPop.hide();
			
			this.divNewPop.appendTo($('#'+this.strDivParent));
			
			this.iPopUpVisible = false;
			
			this.draw(0);
		}
		catch(e)
		{
			console.log(e);
		}
	},
	
	uninit: function()
	{
		$('#' + this.strDivParent).empty();
		
		this.strDivWrapperID = null;
		this.strDivBlckScrub = null;
		this.strDivWhteScrub = null;
		this.strEndTime = null;
		this.strCurTime = null;
		this.funcCallback = null;
		this.strDivParent = null;
		this.strStyleString = null;
	},
	
	clearPopup: function()
	{
		clearTimeout(this.timeoutHideNum);
		this.divNewPop.text("Wait...");
		this.divNewPop.show();
	
		this.iCurTime = this.iLastGoodTouchPoint * this.fDistToSec;

		this.iWaitForUpdate = SCRUB_WAIT_FOR_PLUG;
		
		objwAMP.Seek(Math.floor(this.iCurTime), function(iCurTime)
		{
			objScrub.iWaitForUpdate = iCurTime;
		});
		
		this.timeoutHideNum = setTimeout(function() 
								{
									$('#divNewPop').hide();
								}, 500);
	},
	
	pickStart: function(e) 
	{
		clearTimeout(this.timeoutHideNum);
		var me = this;
		var point = hasTouch ? e.changedTouches[0] : e;
		
		this.iWaitForUpdate = SCRUB_IN_PROCSS;
	
		var domTarget = point.target;
		
		if (!domTarget)
			return;
		
		if (domTarget.nodeName.toLowerCase() == "#text")
			domTarget = $(domTarget).parent().get(0);
	
		if((domTarget.id != this.strDivBlckScrub ) &&
		   (domTarget.id != this.strDivWhteScrub ))
		{
			return;
		}
	
		var iDivTouchPoint = point.pageX - this.iLeftCoord;

		this.iLastGoodTouchPoint = iDivTouchPoint;
		
		this.iCurTime = iDivTouchPoint * this.fDistToSec;
		
		this.draw(iDivTouchPoint);
	
		this.divNewPop.text(this.convertNumSecToString(this.iCurTime));
		this.divNewPop.show();	
		this.timeoutHideNum = setTimeout(function() {me.clearPopup();}, 2000);
			
		var divWrapper = document.getElementById(this.strDivWrapperID);
		
		divWrapper.addEventListener(MOVE_EV, this, false);
		divWrapper.addEventListener(END_EV, this, false);
	
	},

	pickMove: function(e) 
	{	
	
		var point = hasTouch ? e.changedTouches[0] : e;
	
		var domTarget = point.target;
		
		if (!domTarget)
			return;
		
		if (domTarget.nodeName.toLowerCase() == "#text")
			domTarget = $(domTarget).parent().get(0);
	
		if((domTarget.id != this.strDivBlckScrub ) &&
		   (domTarget.id != this.strDivWhteScrub ))
		{
			return;
		}
	
		var me = this;
	
		clearTimeout(this.timeoutHideNum);
	
		var iDivTouchPoint = point.pageX - this.iLeftCoord;
	
		this.iLastGoodTouchPoint = iDivTouchPoint;
		
		this.iCurTime = iDivTouchPoint * this.fDistToSec;
		
		this.draw(iDivTouchPoint);
		
		this.divNewPop.text(this.convertNumSecToString(this.iCurTime));
		this.divNewPop.show();
		this.timeoutHideNum = setTimeout(function() {me.clearPopup();}, 2000);
		
	},
	
	pickStop: function(e) 
	{
		clearTimeout(this.timeoutHideNum);

		var point = hasTouch ? e.changedTouches[0] : e;
	
		var divWrapper = document.getElementById(this.strDivWrapperID);
		divWrapper.removeEventListener(MOVE_EV, this, false);
		divWrapper.removeEventListener(END_EV, this, false);
		
		var domTarget = point.target;
				
		if (domTarget && domTarget.nodeName.toLowerCase() == "#text")
			domTarget = $(domTarget).parent().get(0);
	
		if(domTarget && 
		   (domTarget.id != this.strDivBlckScrub ) &&
		   (domTarget.id != this.strDivWhteScrub ))
		{
			this.iLastGoodTouchPoint = point.pageX - this.iLeftCoord;
		}
		
		this.draw(this.iLastGoodTouchPoint);
		
		this.clearPopup();
		
	},

	
	convertNumSecToString: function(iNumSec)
	{
		var ProgressString;
	
		iNumSec = Math.floor(iNumSec)
	
		if (iNumSec <= 0)
		{
			ProgressString = "0:00";
		}
		else if (iNumSec < 10)
		{
			ProgressString = "0:0"+Number(iNumSec).toString();
		}
		else if (iNumSec < 60)
		{
			ProgressString = "0:"+Number(iNumSec).toString();
		}
		else
		{
			// first get the minutes part of the number without division
			GetMin = iNumSec * .01667;
			ProgressString = Number(Math.floor(GetMin)).toString();
			
			// Now subtract out the number of minute to get seconds
			GetMin = Math.floor(GetMin) * 60;
			GetMin = iNumSec - GetMin;
			
			// now finish the string
			if (GetMin == 60)
			{
				ProgressString = ProgressString + ":00";
			}
			else if (GetMin < 10)
			{
				ProgressString = ProgressString + ':0' + Number(GetMin).toString();
			}
			else
			{
				ProgressString = ProgressString + ':' + Number(GetMin).toString();
			}
		}
		
		return ProgressString;
	}
	
};


function VertAdjust()
{
	this.controller = null;
	
	// Create a name for the div.  To make it transparent
	//	to the user in case we want to create multiples,
	//	we add a random number to the div so we don't
	//	have two with the same name.
	this.strDivWrapperID = "divVolControl" + Number(Math.floor(Math.random() * 10000)).toString();
	this.strDivKnob = "divVolKnob" + Number(Math.floor(Math.random() * 10000)).toString();

	this.funcCallback = null;
	this.strDivParent = null;
	this.strStyleString = null;
	
	// we need this in case the DOM loses focus without throwing a mouseup event
	this.bDirty = false;
	
	this.handleEvent = function (e) 
	{ 
		if (e.type == 'mousedown') 
		{
			this.volSelStart(e);
		} 
		else if (e.type == 'mousemove') 
		{
			this.volSelMove(e);
		} 
		else if (e.type == 'mouseup')
		{
			this.volSelStop(e);
		}
		
	};

	
	this.draw = function(iYCoordFromTop)
	{
				
		iCalcTop = 350 - iYCoordFromTop;
	
		if (iCalcTop > 243)
			iCalcTop = 243;
		else if (iCalcTop < 23)
			iCalcTop = 23;
	
		document.getElementById(this.strDivKnob).setAttribute("style", "top:" +
														Number(250 - iCalcTop).toString() +
														"px; " + this.strStyleString);
							
	};
	
	this.init = function (strDivParent, funcCallBack) 
	{
		try
		{	

			this.funcCallBack = funcCallBack;
		
			this.strDivParent = strDivParent;
			var divParent = document.getElementById(strDivParent);
			
			var divWrapper = document.createElement("div");
			divWrapper.className = "vertselectboxwrapper";
			divWrapper.id = this.strDivWrapperID;

			
			var divBack = document.createElement("div");
			divBack.className = "vertselectbox";
			divBack.setAttribute("style", 
								 "background-image: url(" + 
								 	objSkin.theme[objSkin.skinNum].player.volsliderback + 
								 	");");
			divWrapper.appendChild(divBack); 
			
			this.strStyleString = "background-image: url(" + 
								  objSkin.theme[objSkin.skinNum].player.volsliderknob + 
								  ");";
			var divDisplay = document.createElement("div");
			divDisplay.className = "vertselectknob";
			divDisplay.id = this.strDivKnob;
			divBack.appendChild(divDisplay); 
			
			divWrapper.addEventListener('mousedown', this, false);
			divParent.appendChild(divWrapper);
			
			this.draw(225);
		}
		catch(e)
		{
			console.log(e);
		}
	};
	
	this.uninit = function()
	{
		var divKnob = document.getElementById(this.strDivWrapperID);
		divKnob.removeEventListener('mousedown', this, false);
		
		this.strDivWrapperID = null;
		this.strDivKnob = null;
		this.funcCallback = null;
		this.strDivParent = null;
		this.strStyleString = null;
	};
	
	this.setVisibility = function(bVisSet)
	{
		document.getElementById(this.strDivWrapperID).style.visibility = 
												((bVisSet)?"visible":"hidden");
	}
	
	this.volSelStart = function(e)
	{
		this.bDirty = true;
	
		var divWrapper = document.getElementById(this.strDivWrapperID);
	
		divWrapper.addEventListener('mousemove', this, false);
		divWrapper.addEventListener('mouseup', this, false);
	
		this.draw(e.pageY);
		this.retVol(e.pageY);
	};
	
	// This is to avoid repeated divisions
	this.fScale125 = 1/125;
	
	this.retVol = function(iVal)
	{
	
		iCalcTop = 350 - iVal;
	
		if (iCalcTop > 243)
			iCalcTop = 243;
		else if (iCalcTop < 23)
			iCalcTop = 0;
		
		console.log(iCalcTop * this.fScale125);
		
		this.funcCallBack(iCalcTop * this.fScale125);
	
	};
	
	this.volSelMove = function(e)
	{
		this.draw(e.pageY);
		this.retVol(e.pageY);
	};
	
	this.cleanUp = function()
	{
		if (this.bDirty)
		{
			var divWrapper = document.getElementById(this.strDivWrapperID);
		
			this.bDirty = false;
		
			divWrapper.removeEventListener('mousemove', this, false);
			divWrapper.removeEventListener('mouseup', this, false);
		}
	};
	
	this.volSelStop = function(e)
	{
		var divWrapper = document.getElementById(this.strDivWrapperID);
	
		this.bDirty = false;
	
		divWrapper.removeEventListener('mousemove', this, false);
		divWrapper.removeEventListener('mouseup', this, false);
		
		this.draw(e.pageY);
		this.retVol(e.pageY);
	};

};

var INV_PI = 1/3.14159265;

function PalmKnobControl(fStart)
{
	this.controller = null;
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

	this.setVisible = function(bVisible)
	{

		if (this.bVis)
			$("#"+this.strDivWrapperID).hide();
		else
			$("#"+this.strDivWrapperID).show();
		
		this.bVis = !this.bVis;
		
	};
	
	this.init = function(iLeftCoord, iTopCoord, iSize, strDivParent, funcCallBack, strLabelText) 
	{

		this.funcCallBack = funcCallBack;
	
		this.originX = iSize/2 + iLeftCoord;
		this.originY = iSize/2 + iTopCoord;
	
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
								'background-color': objSkin.theme[objSkin.skinNum].filter.leftcolor
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
							"background: " +
									objSkin.theme[objSkin.skinNum].filter.rightcolor + ';';
		
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
							"background: " +
									objSkin.theme[objSkin.skinNum].filter.leftcolor + ';';
							
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
		
		$(divWrapper).hide();
		
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
		this.convertAndDraw(fVal);
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

/*************************
 * Status Pill
 *
 * A bar that shows progress, and displays the string sent to it
 *************************/
var StatusPill =
{

	divPill: 0,
	iTime: -91,
	
	Animate: function(strDisplay)
	{
		this.divPill.css(
		{
			"clip": "rect(0px " + 
							Number(this.iTime + 100).toString() + 
						  "px 480px " + 
							Number(this.iTime).toString() + 
						  "px)"
		});
		
		
		if (this.iTime++ == 310)
			this.iTime = -91;

		this.divPill.text(strDisplay);
	},
	
	Init: function(iTop)
	{
		this.divPill = $('<div></div>',
						{
							"id": "idSpashBackBox",
							css: 
							{
								"position":"absolute",
								"font-family":"cour",
								"left":"20px",
								"right":"20px",
								"padding-left":"5px",
								"top": Number(iTop).toString() + "px", 
								"z-index":"2",
								"height":"25px",
								"-webkit-border-radius": "15px",
								"color": objSkin.theme[objSkin.skinNum].splash.updatetxt,
								"background-color": objSkin.theme[objSkin.skinNum].splash.updatebg
							},
							text: "Loading...."
						}).appendTo($('#idSplashAddToDiv'));
		this.Animate("Loading....");
	}
	
}

/**
 * Original license below (this code is licensed at per the rest of the code
 *	which is allowed under the MIT license so long as the below is present)
 * ------------------------ 
  * 
 * Find more about the Spinning Wheel function at
 * http://cubiq.org/spinning-wheel-on-webkit-for-iphone-ipod-touch/11
 *
 * Copyright (c) 2009 Matteo Spinelli, http://cubiq.org/
 * Released under MIT license
 * http://cubiq.org/dropbox/mit-license.txt
 * 
 * Version 1.4 - Last updated: 2009.07.09
 * 
 */

var SpinningWheel = {
	cellHeight: 44,
	friction: 0.003,
	slotData: new Array(),
	bRunOnce: 1,

	/**
	 *
	 * Event handler
	 *
	 */

	handleEvent: function (e) 
	{
		if (e.type == 'mousedown') {
			this.lockScreen(e);
			if (e.currentTarget.id == 'sw-cancel' || e.currentTarget.id == 'sw-done') {
				this.tapDown(e);
			} else if (e.currentTarget.id == 'sw-frame') {
				this.scrollStart(e);
			}
		} else if (e.type == 'mousemove') {
			this.lockScreen(e);
			
			if (e.currentTarget.id == 'sw-cancel' || e.currentTarget.id == 'sw-done') {
				this.tapCancel(e);
			} else if (e.currentTarget.id == 'sw-frame') {
				this.scrollMove(e);
			}
		} 
		else if ((e.type == 'mouseup') || (e.type == 'mouseout'))
		{
			if (e.currentTarget.id == 'sw-cancel' || e.currentTarget.id == 'sw-done') {
				this.tapUp(e);
			} else if (e.currentTarget.id == 'sw-frame') {
				this.scrollEnd(e);
			}
		} else if (e.type == 'orientationchange') {
			this.onOrientationChange(e);
		} else if (e.type == 'scroll') {
			this.onScroll(e);
		}
	},


	/**
	 *
	 * Global events
	 *
	 */

	onOrientationChange: function (e) 
	{
		window.scrollTo(0, 0);
		this.swWrapper.style.top = window.innerHeight + window.pageYOffset + 'px';
		this.calculateSlotsWidth();
	},
	
	onScroll: function (e) 
	{
		this.swWrapper.style.top = window.innerHeight + window.pageYOffset + 'px';
	},

	lockScreen: function (e) 
	{
		e.preventDefault();
		e.stopPropagation();
	},


	/**
	 *
	 * Initialization
	 *
	 */

	reset: function () 
	{
		this.slotEl = [];

		this.activeSlot = null;
		
		this.swWrapper = undefined;
		this.swSlotWrapper = undefined;
		this.swSlots = undefined;
		this.swFrame = undefined;
	},

	calculateSlotsWidth: function () 
	{
		var div = this.swSlots.getElementsByTagName('div');
		for (var i = 0; i < div.length; i += 1) {
			this.slotEl[i].slotWidth = div[i].offsetWidth;
		}
	},

	create: function () 
	{
		var i, l, out, ul, div;

		this.bRunOnce = 0;
		
		this.reset();	// Initialize object variables

		// Create the Spinning Wheel main wrapper
		div = document.createElement('div');
		div.id = 'sw-wrapper';
		// Place the SW down the actual viewing screen
		div.style.top = window.innerHeight + window.pageYOffset + 'px';
		div.style.webkitTransitionProperty = '-webkit-transform';
		div.innerHTML = '<div id="sw-header"><div id="sw-cancel">Cancel</' + 
						'div><div id="sw-done">Apply</' + 
						'div></' + 
						'div><div id="sw-slots-wrapper"><div id="sw-slots"></' 
						+ 'div></' + 'div><div id="sw-frame"></' + 'div>';
						
		document.body.appendChild(div);

		this.swWrapper = div;													// The SW wrapper
		this.swSlotWrapper = document.getElementById('sw-slots-wrapper');		// Slots visible area
		this.swSlots = document.getElementById('sw-slots');						// Pseudo table element (inner wrapper)
		this.swFrame = document.getElementById('sw-frame');						// The scrolling controller

		// Create HTML slot elements
		for (l = 0; l < this.slotData.length; l += 1) {
			// Create the slot
			ul = document.createElement('ul');
			out = '';
			for (i in this.slotData[l].values) {
				out += '<li>' + this.slotData[l].values[i] + '<' + '/li>';
			}
			ul.innerHTML = out;

			div = document.createElement('div');		// Create slot container
			div.className = this.slotData[l].style;		// Add styles to the container
			div.appendChild(ul);
	
			// Append the slot to the wrapper
			this.swSlots.appendChild(div);
			
			ul.slotPosition = l;			// Save the slot position inside the wrapper
			ul.slotYPosition = 0;
			ul.slotWidth = 0;
			ul.slotMaxScroll = this.swSlotWrapper.clientHeight - ul.clientHeight;
			
			// Add default transition
			ul.style.webkitTransitionTimingFunction = 'cubic-bezier(0, 0, 0.2, 1)';
			
			this.slotEl.push(ul);			// Save the slot for later use
			
			// Place the slot to its default position (if other than 0)
			if (this.slotData[l].defaultValue) {
				this.scrollToValue(l, this.slotData[l].defaultValue);	
			}
		}
		
		this.calculateSlotsWidth();
		
		// Global events
		document.addEventListener('mousedown', this, false);			// Prevent page scrolling
		document.addEventListener('mousemove', this, false);			// Prevent page scrolling
		// Optimize SW on orientation change
		window.addEventListener('orientationchange', this, true);		
		window.addEventListener('scroll', this, true);				// Reposition SW on page scroll

		// Cancel/Done buttons events
		document.getElementById('sw-cancel').addEventListener('mousedown', this, false);
		document.getElementById('sw-done').addEventListener('mousedown', this, false);

		// Add scrolling to the slots
		this.swFrame.addEventListener('mousedown', this, false);
	},

	open: function () 
	{
		if (this.bRunOnce)
			this.create();
		else
			$('#sw-wrapper').show();
			
		this.swWrapper.style.webkitTransitionTimingFunction = 'ease-out';
		this.swWrapper.style.webkitTransitionDuration = '400ms';
		this.swWrapper.style.webkitTransform = 'translate3d(0, -300px, 0)';
	},
	
	
	/**
	 *
	 * Unload
	 *
	 */

	unload: function () 
	{
		clearTimeout(this.timeoutCheck);

		this.swFrame.removeEventListener('mousedown', this, false);

		document.getElementById('sw-cancel').removeEventListener('mousedown', this, false);
		document.getElementById('sw-done').removeEventListener('mousedown', this, false);

		document.removeEventListener('mousedown', this, false);
		document.removeEventListener('mousemove', this, false);
		window.removeEventListener('orientationchange', this, true);
		window.removeEventListener('scroll', this, true);
		
		this.slotData = [];
		this.cancelAction = function () {
			return false;
		};
		
		this.cancelDone = function () {
			return true;
		};
		
		this.reset();
		
		document.body.removeChild(document.getElementById('sw-wrapper'));
	},
	
	close: function () 
	{
		this.swWrapper.style.webkitTransitionTimingFunction = 'ease-in';
		this.swWrapper.style.webkitTransitionDuration = '400ms';
		this.swWrapper.style.webkitTransform = 'translate3d(0, 0, 0)';
		
		$('#sw-wrapper').hide();
		this.timeoutCheck = setTimeout(function() {SpinningWheel.backWithinBoundaries();}, 200);
	},


	/**
	 *
	 * Generic methods
	 *
	 */

	addSlot: function (values, style, defaultValue) 
	{
		if (!style) {
			style = '';
		}
		
		style = style.split(' ');

		for (var i = 0; i < style.length; i += 1) {
			style[i] = 'sw-' + style[i];
		}
		
		style = style.join(' ');

		var obj = { 'values': values, 'style': style, 'defaultValue': defaultValue };
		this.slotData.push(obj);
	},

	getSelectedValues: function () 
	{
		var index, count,
		    i, l,
			keys = [], values = [];

		for (i in this.slotEl) {
			// Remove any residual animation
			clearTimeout(this.timeoutCheck);
			//this.slotEl[i].style.webkitTransitionDuration = '0';

			if (this.slotEl[i].slotYPosition > 0) {
				this.setPosition(i, 0);
			} else if (this.slotEl[i].slotYPosition < this.slotEl[i].slotMaxScroll) {
				this.setPosition(i, this.slotEl[i].slotMaxScroll);
			}

			index = -Math.round(this.slotEl[i].slotYPosition / this.cellHeight);

			count = 0;
			for (l in this.slotData[i].values) {
				if (count == index) {
					keys.push(l);
					values.push(this.slotData[i].values[l]);
					break;
				}
				
				count += 1;
			}
		}

		return { 'keys': keys, 'values': values };
	},


	/**
	 *
	 * Rolling slots
	 *
	 */

	setPosition: function (slot, pos) 
	{
		this.slotEl[slot].slotYPosition = pos;
		this.slotEl[slot].style.webkitTransform = 'translate3d(0, ' + pos + 'px, 0)';
	},
	
	scrollStart: function (e) 
	{
		// Find the clicked slot
		var xPos = e.clientX - this.swSlots.offsetLeft;
		// Clicked position minus left offset (should be 11px)

		// Find tapped slot
		var slot = 0;
		for (var i = 0; i < this.slotEl.length; i += 1) {
			slot += this.slotEl[i].slotWidth;
			
			if (xPos < slot) {
				this.activeSlot = i;
				break;
			}
		}

		// If slot is readonly do nothing
		if (this.slotData[this.activeSlot].style.match('readonly')) {
			this.swFrame.removeEventListener('mousemove', this, false);
			this.swFrame.removeEventListener('mouseup', this, false);
			return false;
		}

		clearTimeout(this.timeoutCheck);	// Remove transition event (if any)
		// Remove any residual transition
		this.slotEl[this.activeSlot].style.webkitTransitionDuration = '0';		
		
		// Stop and hold slot position
		var theTransform = window.getComputedStyle(this.slotEl[this.activeSlot]).webkitTransform;
		theTransform = new WebKitCSSMatrix(theTransform).m42;
		if (theTransform != this.slotEl[this.activeSlot].slotYPosition) {
			this.setPosition(this.activeSlot, theTransform);
		}
		
		this.startY = e.clientY;
		this.scrollStartY = this.slotEl[this.activeSlot].slotYPosition;
		this.scrollStartTime = e.timeStamp;

		this.swFrame.addEventListener('mousemove', this, false);
		this.swFrame.addEventListener('mouseup', this, false);
		this.swFrame.addEventListener('mouseout', this, false);
		
		return true;
	},

	scrollMove: function (e) 
	{
		var topDelta = e.clientY - this.startY;

		if (this.slotEl[this.activeSlot].slotYPosition > 0 || 
					this.slotEl[this.activeSlot].slotYPosition < 
					this.slotEl[this.activeSlot].slotMaxScroll) 
		{
			topDelta /= 2;
		}
		
		this.setPosition(this.activeSlot, this.slotEl[this.activeSlot].slotYPosition + topDelta);
		this.startY = e.clientY;

		// Prevent slingshot effect
		if (e.timeStamp - this.scrollStartTime > 80) {
			this.scrollStartY = this.slotEl[this.activeSlot].slotYPosition;
			this.scrollStartTime = e.timeStamp;
		}
	},
	
	scrollEnd: function (e) 
	{
		this.swFrame.removeEventListener('mousemove', this, false);
		this.swFrame.removeEventListener('mouseup', this, false);

		// If we are outside of the boundaries, let's go back to the sheepfold
		if (this.slotEl[this.activeSlot].slotYPosition > 0 || 
					this.slotEl[this.activeSlot].slotYPosition < 
					this.slotEl[this.activeSlot].slotMaxScroll) 
		{
			this.scrollTo(this.activeSlot, 
						  (this.slotEl[this.activeSlot].slotYPosition > 0) ? 
								0 : 
								this.slotEl[this.activeSlot].slotMaxScroll);
			return false;
		}

		// Lame formula to calculate a fake deceleration
		var scrollDistance = this.slotEl[this.activeSlot].slotYPosition - this.scrollStartY;

		// The drag session was too short
		if (scrollDistance < this.cellHeight / 1.5 && scrollDistance > -this.cellHeight / 1.5) {
			if (this.slotEl[this.activeSlot].slotYPosition % this.cellHeight) {
				this.scrollTo(this.activeSlot, Math.round(this.slotEl[this.activeSlot].slotYPosition / this.cellHeight) * this.cellHeight, '100ms');
			}

			return false;
		}

		var scrollDuration = e.timeStamp - this.scrollStartTime;

		var newDuration = (2 * scrollDistance / scrollDuration) / this.friction;
		var newScrollDistance = (this.friction / 2) * (newDuration * newDuration);
		
		if (newDuration < 0) {
			newDuration = -newDuration;
			newScrollDistance = -newScrollDistance;
		}

		var newPosition = this.slotEl[this.activeSlot].slotYPosition + newScrollDistance;

		if (newPosition > 0) {
			// Prevent the slot to be dragged outside the visible area (top margin)
			newPosition /= 2;
			newDuration /= 3;

			if (newPosition > this.swSlotWrapper.clientHeight / 4) {
				newPosition = this.swSlotWrapper.clientHeight / 4;
			}
		} else if (newPosition < this.slotEl[this.activeSlot].slotMaxScroll) {
			// Prevent the slot to be dragged outside the visible area (bottom margin)
			newPosition = (newPosition - this.slotEl[this.activeSlot].slotMaxScroll) / 2 + this.slotEl[this.activeSlot].slotMaxScroll;
			newDuration /= 3;
			
			if (newPosition < this.slotEl[this.activeSlot].slotMaxScroll - this.swSlotWrapper.clientHeight / 4) {
				newPosition = this.slotEl[this.activeSlot].slotMaxScroll - this.swSlotWrapper.clientHeight / 4;
			}
		} else {
			newPosition = Math.round(newPosition / this.cellHeight) * this.cellHeight;
		}

		this.scrollTo(this.activeSlot, Math.round(newPosition), Math.round(newDuration) + 'ms');
 
		return true;
	},

	scrollTo: function (slotNum, dest, runtime) 
	{
		this.slotEl[slotNum].style.webkitTransitionDuration = runtime ? runtime : '100ms';
		this.setPosition(slotNum, dest ? dest : 0);

		// If we are outside of the boundaries go back to the sheepfold
		if (this.slotEl[slotNum].slotYPosition > 0 || 
					this.slotEl[slotNum].slotYPosition < 
					this.slotEl[slotNum].slotMaxScroll) 
		{
			this.timeoutCheck = setTimeout(function() {SpinningWheel.backWithinBoundaries();}, 200);
		}
		
		//this.scrollEndAction();
	},
	
	scrollToValue: function (slot, value) 
	{
		var yPos, count, i;

		setTimeout(this.timeoutCheck);
		this.slotEl[slot].style.webkitTransitionDuration = '0';
		
		count = 0;
		for (i in this.slotData[slot].values) {
			if (i == value) {
				yPos = count * this.cellHeight;
				this.setPosition(slot, yPos);
				break;
			}
			
			count -= 1;
		}
	},
	
	backWithinBoundaries: function () 
	{
		clearTimeout(this.timeoutCheck);

		for (var i=0; i<this.slotEl.length; i++)
		{
			this.scrollTo(i, this.slotEl[i].slotYPosition > 0 ? 
										0 : 
										this.slotEl[i].slotMaxScroll, '150ms');
		}
		return false;
	},


	/**
	 *
	 * Buttons
	 *
	 */

	tapDown: function (e) 
	{
		e.currentTarget.addEventListener('mousemove', this, false);
		e.currentTarget.addEventListener('mouseup', this, false);
		e.currentTarget.className = 'sw-pressed';
	},

	tapCancel: function (e) 
	{
		e.currentTarget.removeEventListener('mousemove', this, false);
		e.currentTarget.removeEventListener('mouseup', this, false);
		e.currentTarget.className = '';
	},
	
	tapUp: function (e) 
	{
		this.tapCancel(e);

		if (e.currentTarget.id == 'sw-cancel') {
			this.cancelAction();
		} else {
			this.doneAction();
		}
		
		this.close();
	},

	setCancelAction: function (action) 
	{
		this.cancelAction = action;
	},

	setDoneAction: function (action) 
	{
		this.doneAction = action;
	},
	
	setScrollEndAction: function (action)
	{
		this.scrollEndAction = action;
	},
	
	cancelAction: function () 
	{
		return false;
	},

	cancelDone: function () 
	{
		return true;
	}
};