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
			setTimeout(function() {StatusPill.Animate();}, 50);
	},
	
	Init: function()
	{
		this.divPill = $('#idSplashPill');
		this.DisplayText("Loading....");
		var pos = this.divPill.position();	
		this.iTime = 0;
	},
	
	Start: function()
	{
		this.bAnimate = true;
		setTimeout(function() {StatusPill.Animate();}, 1);
	},
	
	Stop: function()
	{
		this.bAnimate = false;
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
