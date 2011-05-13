var objSkin = 
{
	skinNum:0,
	numSkinsAvailable: 7,
	
	pickNextSkin: function()
	{
		this.skinNum = ++this.skinNum % this.numSkinsAvailable;
		$('body').css({'background-color': objSkin.theme[objSkin.skinNum].background.bgcolor, 
							'background-image': "url(" + objSkin.theme[objSkin.skinNum].background.bgimg + ")",
							'background-repeat': 'no-repeat'});
							
		objOptions.UpdateOption(OPT_ID_SKIN, this.skinNum);
	},
	
	theme: 
	[
		// Default
		{
			"background": 
			{
				"bgcolor":"#2D2D2D",
				"bgimg":"res/themes/default/background.png"
			},
			"dialog":
			{
				"btntheme": "wampButton",
				"btnclstheme": "wampButtonClose"
			},
			"splash": 
			{ 
				"imgPath":"res/themes/default/splash.png",
				"updatetxt":"#FFF",
				"updatebg":"red"
			},
			"index":
			{
				"playAll":"res/themes/default/playallimg.png",
				"album":"res/themes/default/albumimg.png",
				"artist":"res/themes/default/artistimg.png",
				"genre":"res/themes/default/genreimg.png",
				"title":"res/themes/default/titleimg.png",
				"file":"res/themes/default/fileimg.png"
			},
			"list":
			{
				"optionImg":"res/options.png",
				"footerColor": "black"
			},
			"player":
			{
				"eqbtn": "res/eqsm.png",
				"mutebtn": "res/themes/default/playcont/mutesm.png",
				"nextsongbtn": "res/themes/default/playcont/nextsongsm.png",
				"shufflebtn": "res/themes/default/playcont/shufflesm.png",
				"repeatbtn": "res/themes/default/playcont/repeatsm.png",
				"normalbtn": "res/themes/default/playcont/normalsm.png",
				"pausebtn": "res/themes/default/playcont/pausesm.png",				
				"playlistbtn": "res/musplicon.png",
				"indexbtn": "res/themes/default/playcont/playlistsm.png",		
				"playbtn": "res/themes/default/playcont/playsm.png",				
				"prevsongbtn": "res/themes/default/playcont/prevsongsm.png",
				"volbtn": "res/themes/default/playcont/volsm.png",
				"scrubbgcolor": "#fff",
				"scrubfgcolor": "#000",
				"scruboutline": "#fff",
				"volsliderback": "res/volselect/volselectbacksm.png",
				"volsliderknob": "res/volselect/slidersm.png",
				"optionImg":"res/themebt.png"
			},
			"filter":
			{
				"leftcolor":"#000",
				"rightcolor":"#FFF"
			},
			"option":
			{
				"modalbg": "#2D2D2D",
				"topbgcolor": "#000"
			},
			"playlist":
			{
				"bgimg": "res/themes/default/indexbg.png",
				"selectImg": "res/listslectbtn.png"
			}
		},
		// brown
		{
			"background": 
			{
				"bgcolor":"#000",
				"bgimg":"res/themes/brown/background.png"
			},
			"dialog":
			{
				"btntheme": "wampButton",
				"btnclstheme": "wampButtonClose"
			},
			"splash": 
			{ 
				"imgPath":"res/themes/default/splash.png",
				"updatetxt":"#000",
				"updatebg":"red"
			},
			"index":
			{
				"playAll":"res/themes/default/playallimg.png",
				"album":"res/themes/default/albumimg.png",
				"artist":"res/themes/default/artistimg.png",
				"genre":"res/themes/default/genreimg.png",
				"title":"res/themes/default/titleimg.png",
				"file":"res/themes/default/folderimg.png"
			},
			"list":
			{
				"optionImg":"res/options.png",
				"footerColor": "black"
			},
			"player":
			{
				"eqbtn": "res/eqsm.png",
				"mutebtn": "res/themes/default/playcont/mutesm.png",
				"nextsongbtn": "res/themes/default/playcont/nextsongsm.png",
				"shufflebtn": "res/themes/default/playcont/shufflesm.png",
				"repeatbtn": "res/themes/default/playcont/repeatsm.png",
				"normalbtn": "res/themes/default/playcont/normalsm.png",
				"pausebtn": "res/themes/default/playcont/pausesm.png",				
				"playlistbtn": "res/musplicon.png",
				"indexbtn": "res/themes/default/playcont/playlistsm.png",	
				"playbtn": "res/themes/default/playcont/playsm.png",				
				"prevsongbtn": "res/themes/default/playcont/prevsongsm.png",
				"volbtn": "res/themes/default/playcont/volsm.png",
				"scrubbgcolor": "#FFF",
				"scrubfgcolor": "#000",
				"scruboutline": "#FFF",
				"volsliderback": "res/volselect/volselectbacksm.png",
				"volsliderknob": "res/volselect/slidersm.png",
				"optionImg":"res/themebt.png"
			},
			"filter":
			{
				"leftcolor":"#000",
				"rightcolor":"#FFF"
			},
			"option":
			{
				"modalbg": "#7A5229",
				"topbgcolor": "#000"
			},
			"playlist":
			{
				"bgimg": "res/themes/brown/indexbg.png",
				"selectImg": "res/listslectbtn.png"
			}
		},
		// blue
		{
			"background": 
			{
				"bgcolor":"#00F",
				"bgimg":"res/themes/blue/background.png"
			},
			"dialog":
			{
				"btntheme": "wampButton",
				"btnclstheme": "wampButtonClose"
			},
			"splash": 
			{ 
				"imgPath":"res/themes/default/splash.png",
				"updatetxt":"#000",
				"updatebg":"red"
			},
			"index":
			{
				"playAll":"res/themes/default/playallimg.png",
				"album":"res/themes/default/albumimg.png",
				"artist":"res/themes/default/artistimg.png",
				"genre":"res/themes/default/genreimg.png",
				"title":"res/themes/default/titleimg.png",
				"file":"res/themes/default/fileimg.png"
			},
			"list":
			{
				"optionImg":"res/options.png",
				"footerColor": "black"
			},
			"player":
			{
				"eqbtn": "res/eqsm.png",
				"mutebtn": "res/themes/default/playcont/mutesm.png",
				"nextsongbtn": "res/themes/default/playcont/nextsongsm.png",
				"shufflebtn": "res/themes/default/playcont/shufflesm.png",
				"repeatbtn": "res/themes/default/playcont/repeatsm.png",
				"normalbtn": "res/themes/default/playcont/normalsm.png",
				"pausebtn": "res/themes/default/playcont/pausesm.png",				
				"playlistbtn": "res/musplicon.png",
				"indexbtn": "res/themes/default/playcont/playlistsm.png",	
				"playbtn": "res/themes/default/playcont/playsm.png",				
				"prevsongbtn": "res/themes/default/playcont/prevsongsm.png",
				"volbtn": "res/themes/default/playcont/volsm.png",
				"scrubbgcolor": "#FFF",
				"scrubfgcolor": "#000",
				"scruboutline": "#FFF",
				"volsliderback": "res/volselect/volselectbacksm.png",
				"volsliderknob": "res/volselect/slidersm.png",
				"optionImg":"res/themebt.png"
			},
			"filter":
			{
				"leftcolor":"#000",
				"rightcolor":"#00F"
			},
			"option":
			{
				"modalbg": "blue",
				"topbgcolor": "#000"
			},
			"playlist":
			{
				"bgimg": "res/themes/blue/indexbg.png",
				"selectImg": "res/listslectbtn.png"
			}
		},
		// green
		{
			"background": 
			{
				"bgcolor":"green",
				"bgimg":"res/themes/green/background.png"
			},
			"dialog":
			{
				"btntheme": "wampButton",
				"btnclstheme": "wampButtonClose"
			},
			"splash": 
			{ 
				"imgPath":"res/themes/green/splash.png",
				"updatetxt":"#FFF",
				"updatebg":"red"
			},
			"index":
			{
				"playAll":"res/themes/default/playallimg.png",
				"album":"res/themes/default/albumimg.png",
				"artist":"res/themes/default/artistimg.png",
				"genre":"res/themes/default/genreimg.png",
				"title":"res/themes/default/titleimg.png",
				"file":"res/themes/default/fileimg.png"
			},
			"list":
			{
				"optionImg":"res/options.png",
				"footerColor": "black"
			},
			"player":
			{
				"eqbtn": "res/eqsm.png",
				"mutebtn": "res/themes/default/playcont/mutesm.png",
				"nextsongbtn": "res/themes/default/playcont/nextsongsm.png",
				"shufflebtn": "res/themes/default/playcont/shufflesm.png",
				"repeatbtn": "res/themes/default/playcont/repeatsm.png",
				"normalbtn": "res/themes/default/playcont/normalsm.png",				
				"pausebtn": "res/themes/default/playcont/pausesm.png",				
				"playlistbtn": "res/musplicon.png",
				"indexbtn": "res/themes/default/playcont/playlistsm.png",	
				"playbtn": "res/themes/default/playcont/playsm.png",				
				"prevsongbtn": "res/themes/default/playcont/prevsongsm.png",
				"volbtn": "res/themes/default/playcont/volsm.png",
				"scrubbgcolor": "#FFF",
				"scrubfgcolor": "#000",
				"scruboutline": "#FFF",
				"volsliderback": "res/volselect/volselectbacksm.png",
				"volsliderknob": "res/volselect/slidersm.png",
				"optionImg":"res/themebt.png"
			},
			"filter":
			{
				"leftcolor":"#000",
				"rightcolor":"green"
			},
			"option":
			{
				"modalbg": "green",
				"topbgcolor": "#000"
			},
			"playlist":
			{
				"bgimg": "res/themes/green/indexbg.png",
				"selectImg": "res/listslectbtn.png"
			}
		},
		// pink
		{
			"background": 
			{
				"bgcolor":"#B2248F",
				"bgimg":"res/themes/pink/background.png"
			},
			"dialog":
			{
				"btntheme": "wampButton",
				"btnclstheme": "wampButtonClose"
			},
			"splash": 
			{ 
				"imgPath":"res/themes/default/splash.png",
				"updatetxt":"#000",
				"updatebg":"red"
			},
			"index":
			{
				"playAll":"res/themes/default/playallimg.png",
				"album":"res/themes/default/albumimg.png",
				"artist":"res/themes/default/artistimg.png",
				"genre":"res/themes/default/genreimg.png",
				"title":"res/themes/default/titleimg.png",
				"file":"res/themes/default/fileimg.png"
			},
			"list":
			{
				"optionImg":"res/options.png",
				"footerColor": "black"
			},
			"player":
			{
				"eqbtn": "res/eqsm.png",
				"mutebtn": "res/themes/default/playcont/mutesm.png",
				"nextsongbtn": "res/themes/default/playcont/nextsongsm.png",
				"shufflebtn": "res/themes/default/playcont/shufflesm.png",
				"repeatbtn": "res/themes/default/playcont/repeatsm.png",
				"normalbtn": "res/themes/default/playcont/normalsm.png",	
				"pausebtn": "res/themes/default/playcont/pausesm.png",				
				"playlistbtn": "res/musplicon.png",
				"indexbtn": "res/themes/default/playcont/playlistsm.png",	
				"playbtn": "res/themes/default/playcont/playsm.png",				
				"prevsongbtn": "res/themes/default/playcont/prevsongsm.png",
				"volbtn": "res/themes/default/playcont/volsm.png",
				"scrubbgcolor": "#FFF",
				"scrubfgcolor": "#000",
				"scruboutline": "#FFF",
				"volsliderback": "res/volselect/volselectbacksm.png",
				"volsliderknob": "res/volselect/slidersm.png",
				"optionImg":"res/themebt.png"
			},
			"filter":
			{
				"leftcolor":"#000",
				"rightcolor":"#B2248F"
			},
			"option":
			{
				"modalbg": "#B2248F",
				"topbgcolor": "#000"
			},
			"playlist":
			{
				"bgimg": "res/themes/pink/indexbg.png",
				"selectImg": "res/listslectbtn.png"
			}
		},		
		// purple
		{
			"background": 
			{
				"bgcolor":"#52127C",
				"bgimg":"res/themes/purple/background.png"
			},
			"dialog":
			{
				"btntheme": "wampButton",
				"btnclstheme": "wampButtonClose"
			},
			"splash": 
			{ 
				"imgPath":"res/themes/default/splash.png",
				"updatetxt":"#000",
				"updatebg":"red"
			},
			"index":
			{
				"playAll":"res/themes/default/playallimg.png",
				"album":"res/themes/default/albumimg.png",
				"artist":"res/themes/default/artistimg.png",
				"genre":"res/themes/default/genreimg.png",
				"title":"res/themes/default/titleimg.png",
				"file":"res/themes/default/fileimg.png"
			},
			"list":
			{
				"optionImg":"res/options.png",
				"footerColor": "black"
			},
			"player":
			{
				"eqbtn": "res/eqsm.png",
				"mutebtn": "res/themes/default/playcont/mutesm.png",
				"nextsongbtn": "res/themes/default/playcont/nextsongsm.png",
				"shufflebtn": "res/themes/default/playcont/shufflesm.png",
				"repeatbtn": "res/themes/default/playcont/repeatsm.png",
				"normalbtn": "res/themes/default/playcont/normalsm.png",	
				"pausebtn": "res/themes/default/playcont/pausesm.png",				
				"playlistbtn": "res/musplicon.png",
				"indexbtn": "res/themes/default/playcont/playlistsm.png",	
				"playbtn": "res/themes/default/playcont/playsm.png",				
				"prevsongbtn": "res/themes/default/playcont/prevsongsm.png",
				"volbtn": "res/themes/default/playcont/volsm.png",
				"scrubbgcolor": "#FFF",
				"scrubfgcolor": "#000",
				"scruboutline": "#FFF",
				"volsliderback": "res/volselect/volselectbacksm.png",
				"volsliderknob": "res/volselect/slidersm.png",
				"optionImg":"res/themebt.png"
			},
			"filter":
			{
				"leftcolor":"#000",
				"rightcolor":"#52127C"
			},
			"option":
			{
				"modalbg": "#52127C",
				"topbgcolor": "#000"
			},
			"playlist":
			{
				"bgimg": "res/themes/purple/indexbg.png",
				"selectImg": "res/listslectbtn.png"
			}
		},
		// red
		{
			"background": 
			{
				"bgcolor":"#990000",
				"bgimg":"res/themes/red/background.png"
			},
			"dialog":
			{
				"btntheme": "wampButton",
				"btnclstheme": "wampButtonClose"
			},
			"splash": 
			{ 
				"imgPath":"res/themes/default/splash.png",
				"updatetxt":"#FFF",
				"updatebg":"red"
			},
			"index":
			{
				"playAll":"res/themes/default/playallimg.png",
				"album":"res/themes/default/albumimg.png",
				"artist":"res/themes/default/artistimg.png",
				"genre":"res/themes/default/genreimg.png",
				"title":"res/themes/default/titleimg.png",
				"file":"res/themes/default/fileimg.png"
			},
			"list":
			{
				"optionImg":"res/options.png",
				"footerColor": "black"
			},
			"player":
			{
				"eqbtn": "res/eqsm.png",
				"mutebtn": "res/themes/default/playcont/mutesm.png",
				"nextsongbtn": "res/themes/default/playcont/nextsongsm.png",
				"shufflebtn": "res/themes/default/playcont/shufflesm.png",
				"repeatbtn": "res/themes/default/playcont/repeatsm.png",
				"normalbtn": "res/themes/default/playcont/normalsm.png",	
				"pausebtn": "res/themes/default/playcont/pausesm.png",				
				"playlistbtn": "res/musplicon.png",
				"indexbtn": "res/themes/default/playcont/playlistsm.png",				
				"playbtn": "res/themes/default/playcont/playsm.png",				
				"prevsongbtn": "res/themes/default/playcont/prevsongsm.png",
				"volbtn": "res/themes/default/playcont/volsm.png",
				"scrubbgcolor": "#FFF",
				"scrubfgcolor": "#000",
				"scruboutline": "#FFF",
				"volsliderback": "res/volselect/volselectbacksm.png",
				"volsliderknob": "res/volselect/slidersm.png",
				"optionImg":"res/themebt.png"
			},
			"filter":
			{
				"leftcolor":"#000",
				"rightcolor":"#990000"
			},
			"option":
			{
				"modalbg": "#990000",
				"topbgcolor": "#000"
			},
			"playlist":
			{
				"bgimg": "res/themes/red/indexbg.png",
				"selectImg": "res/listslectbtn.png"
			}
		}
	]
 }