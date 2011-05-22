/**
 *  This would not have been possible without code from:
 *
 * Matteo Spinelli, http://cubiq.org/
 * Who releases his code under MIT license
 * http://cubiq.org/dropbox/mit-license.txt
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 */
 
 /* Note that all gesture stuff is for testing only at this point */
 
var hasTouch = 'ontouchstart' in window;
var START_EV = hasTouch ? 'touchstart' : 'mousedown';
var MOVE_EV = hasTouch ? 'touchmove' : 'mousemove';
var END_EV = hasTouch ? 'touchend' : 'mouseup';
var START_EV = hasTouch ? 'touchstart' : 'mousedown';
var CLICK_EV = 'click';

var WSCROLL_FLICK_LEFT = -1;
var WSCROLL_FLICK_RIGHT = 1;

var SCROLL_DRAW_SIMP = -1;

function wScroll()
{

	this.iFlickThresh = 25;

	this.fVal = 1.0;

	this.iMode = LIST_TYPE_INDEX;
	
	this.bAllowClick = true;
	
	this.bMouseOut = false;
	this.bIgnoreOutEvents = false;

	this.iCurFontSize = 22;
	
	
	this.bFixPalmFDown = false;
	this.bFixPalmFUp = false;
	
	this.funcFlickEvent = 0;
	this.funcCallBack = 0;
	this.ulParent = 0;
	
	this.ScrollbarWrapper = 0;
	this.ScrollbarIndicator = 0;
	
	this.handleEvent = function (e) 
	{ 

		if (e.type == START_EV)
		{
			this.wScrollMD(e);
		} 
		else if (e.type == MOVE_EV)
		{
			this.wScrollMM(e);
		} 
		else if (e.type == END_EV)
		{
			this.wScrollMU(e);
		}
		else if (e.type == 'mouseover')
		{
			this.ensureScroll();
		}
		else if (e.type == 'gesturestart')
		{
			this.pinchStart(e);
		}
		else if (e.type == 'gesturechange')
		{
			this.handleZoom(e);
		}
		else if (e.type == 'gestureend')
		{
			this.pinchEnd(e);
		}
		else if (e.type == 'mouseout')
		{
			this.mouseOutFix(e);
		}
		
	};
	
	wScroll.prototype.ensureScroll = function()
	{
		this._indicatorPos(1);
	}
	
	wScroll.prototype.pickItem = function(e)
	{
		e.stopPropagation();
		
		var domTarget = e.target;
		
		if (!domTarget)
			return;
		
		if (this.iMode == SCROLL_DRAW_SIMP)
		{
			this.funcCallBack(e, domTarget);
		}
		
		if (domTarget.nodeName.toLowerCase() == "#text")
			domTarget = $(domTarget).parent().get(0);

		if((domTarget.nodeName == "LI") && 
			(domTarget.className != "noshrink")) 
		{
			this.funcCallBack(e, domTarget);
		}

	}
	
	wScroll.prototype.mouseOutFix = function (e)
	{
		if((e.pageY < 475) && (e.pageY > 61)) 		
			return;
		
		if (this.bIgnoreOutEvents)
			return;
	
		this.bAllowClick = false;
	
		this.bMouseOut = true;
		
		var that = this;
		var point = hasTouch ? event.changedTouches[0] : event;
		var momentumX = { dist:0, time:0 };
		var momentumY = { dist:0, time:0 };
		var duration = event.timeStamp - that.startTime;
		var newPosY = that.y;
		
		
		if (!that.moved) 
		{
			return;
		}
		
		if (duration < 300) 
		{
			momentumY = newPosY ? 
				that._momentum(newPosY - that.startY, 
									duration, 
									-that.y, 
									(that.maxScrollY < 0 ? 
										that.scrollerH - that.wrapperH/2: 
										0
									), 
									that.wrapperH
								) 
				: momentumY;

			newPosY = that.y + momentumY.dist;

 			if ((that.y > 0 && newPosY > 0) || 
 						(that.y < that.maxScrollY && newPosY < that.maxScrollY))
			{			
				momentumY = { dist:0, time:0 };
			}
		}

		if (momentumY.dist) {
			newDuration = Math.max(momentumY.time, 10);

			that.scrollTo(newPosY, newDuration);
			return;
		}

		that._resetPos(200);
	}
	
	wScroll.prototype._bind = function (type, el) 
	{
		if (!(el))
			el = this.divWrapper;
		el.addEventListener(type, this, false);
	}

	wScroll.prototype._unbind = function (type, el) 
	{
		if (!(el))
			el = this.divWrapper;
		el.removeEventListener(type, this, false);
	}
	
	wScroll.prototype.pinchStart = function(e)
	{
		e.stopPropagation();
		this.bIgnoreOutEvents = true;
		
		this.noScroll = true;
		

	}
	
	wScroll.prototype.pinchEnd = function(e)
	{
		e.stopPropagation();
	
		this.bIgnoreOutEvents = false;
	
		this.noScroll = false;

	}
	
	
	wScroll.prototype._timedScroll = function (destY, runtime) 
	{
		var that = this;
		var startY = that.y;
		var	startTime = (new Date).getTime();

		that._transitionTime(0);
		
		if (that.scrollInterval) {
			clearInterval(that.scrollInterval);
			that.scrollInterval = null;
		}
		
		that.scrollInterval = setInterval(function () {
			var now = (new Date).getTime();
			var newY;
				
			if (now >= startTime + runtime) {
				clearInterval(that.scrollInterval);
				that.scrollInterval = null;

				that._pos(destY);
				that._transitionEnd();
				return;
			}
	
			now = (now - startTime) / runtime - 1;
			var easeOut = Math.sqrt(1 - now * now);
			newY = (destY - startY) * easeOut + startY;
			that._pos(newY);
		}, 20);
	};
	
	wScroll.prototype._transitionEnd = function (e) 
	{		
		var that = this;
	
		that._resetPos(that.returnTime);
		that.returnTime = 0;
		
		that._indicatorPos(0);
	};

	wScroll.prototype._momentum = function (dist, time, maxDistUpper, maxDistLower, size) 
	{
		var that = this;
		var deceleration = 0.0006;
		var speed = Math.abs(dist) / time;
		var newDist = (speed * speed) / (2 * deceleration);
		var newTime = 0;
		var outsideDist = 0;

		// Proportinally reduce speed if we are outside of the boundaries 
		if (dist > 0 && newDist > maxDistUpper) {
			outsideDist = size / (6 / (newDist / speed * deceleration));
			maxDistUpper = maxDistUpper + outsideDist;
			that.returnTime = 800 / size * outsideDist + 100;
			speed = speed * maxDistUpper / newDist;
			newDist = maxDistUpper;
		} else if (dist < 0 && newDist > maxDistLower) {
			outsideDist = size / (6 / (newDist / speed * deceleration));
			maxDistLower = maxDistLower + outsideDist;
			that.returnTime = 800 / size * outsideDist + 100;
			speed = speed * maxDistLower / newDist;
			newDist = maxDistLower;
		}

		newDist = newDist * (dist < 0 ? -1 : 1);
		newTime = speed / deceleration;

		return { dist: newDist, time: Math.round(newTime) };
	};
			
	wScroll.prototype.wScrollMD = function(event)
	{
		var that = this;
		var point = hasTouch ? event.changedTouches[0] : event;
		
		that.moved = false;
		this.bAllowClick = true;
		
		this.bMouseOut = false;
		
		event.preventDefault();

		// init variables
		that.distY = 0;
		that.absDistY = 0;
		that.dirY = 0;
		that.returnTime = 0;
		that.bFlick = false;
		
		that.startX = point.pageX;
		that.bXmoved = false;	
		
		that._transitionTime(0);
		
		if (that.scrollInterval) 
		{
			clearInterval(that.scrollInterval);
			that.scrollInterval = null;
			this.bAllowClick = false;
			
		}
		
		that.startY = that.y;
		that.SwipeStartY = point.pageY;
		that.pointY = point.pageY;
		
		that.startTime = event.timeStamp;
		that.iFlickTime = event.timeStamp;
		
		if (this.bMouseOut == false)
		{
			this._bind(MOVE_EV);
			this._bind(END_EV);
		}
		
		that._indicatorPos(1);
	};
	
	wScroll.prototype.wScrollMU = function(event)
	{
		
		var that = this;
		var point = hasTouch ? event.changedTouches[0] : event;
		var momentumX = { dist:0, time:0 };
		var momentumY = { dist:0, time:0 };
		var duration = event.timeStamp - that.startTime;
		var newPosY = that.y;
		
		this.bMouseOut = false;
		
		this._unbind(END_EV);
		this._unbind(MOVE_EV);
		
		that._indicatorPos(0);
		
		if ((!that.moved) && (!that.bXmoved))
		{
			if (this.bAllowClick)
			{
				this.pickItem(event);
			}
		
			return;
		}
				
		if (duration < 300) 
		{
			momentumY = newPosY ? 
				that._momentum(
					newPosY - that.startY, 
					duration, 
					-that.y, 
					(that.maxScrollY < 0 ? 
						that.scrollerH - 100 : 
						0
					), 
					that.wrapperH
				) :
				momentumY;

			newPosY = that.y + momentumY.dist;

 			if ((that.y > 0 && newPosY > 0) || 
 				(that.y < that.maxScrollY && 
 						newPosY < that.maxScrollY))
			{			
				momentumY = { dist:0, time:0 };
			}
		}

		if (momentumY.dist) {
			newDuration = Math.max(momentumY.time, 10);

			that.scrollTo(newPosY, newDuration);
			return;
		}

		that._resetPos(200);
	};

	wScroll.prototype._resetPos = function (time) 
	{
		var that = this;
		var resetY = that.y;

		if (that.y >= 0 || that.maxScrollY > 0) 
			resetY = 0;
		else if (that.y < that.maxScrollY) 
		{
			resetY = that.maxScrollY;
		}

		if (resetY == that.y) 
		{
			if (that.moved) 
			{
				that.moved = false;
			}

			return;
		}

		if (time === undefined) time = 200;

		that.scrollTo(resetY, time);
	};

	wScroll.prototype.scrollTo = function (y, time, relative) 
	{
		var that = this;

		if (relative) {
			y = that.y - y;
		}

		time = !time || (Math.round(that.y) == Math.round(y)) ? 0 : time;

		that.moved = true;
		this.bAllowClick = false;
		
		if (time)
		{
			that.transitionEnd = setTimeout(function () {that._transitionEnd();}, time+2);
		}
		that._timedScroll(y, time);
	};
	
	wScroll.prototype._transitionTime = function (time) 
	{
		/*var that = this;
		
		time += 'ms';
		var ulParent = document.getElementById(this.strParent);
		ulParent.style.webkitTransitionDuration = time;*/
	};
	
	wScroll.prototype.wScrollMM = function(event)
	{
		var that = this;
		var point = hasTouch ? event.changedTouches[0] : event;
		var deltaY = point.pageY - that.pointY;
		var newY = that.y + deltaY;

		event.preventDefault();

		that.pointY = point.pageY;
		that.pointX = point.pageX;

		// allow slightly move up/down movement for the swipe motion
		//	so track it seperate from slick
		//	also, don't send click for too much side
		var deltaX = Math.abs(that.pointX - that.startX);
		
		if (deltaX > 2)
			that.bXmoved = true;
		
		if ((deltaX > this.iFlickThresh) && 
			(!this.bFlick) &&
			(Math.abs(that.SwipeStartY - point.pageY) < 6))
		{
				that.bFlick = true;
			
                if (that.pointX > that.startX)
                {
					if (that.funcFlickEvent)
						that.funcFlickEvent(event, WSCROLL_FLICK_RIGHT);
                }
                else
                {
					if (that.funcFlickEvent)
						that.funcFlickEvent(event, WSCROLL_FLICK_LEFT);
                }
        }
		
		
		// Slow down if outside of the boundaries
		if (newY > 0 || newY < that.maxScrollY) 
		{ 
			newY = that.y + (deltaY / 2.4);
		}

		that.absDistY = Math.abs(that.distY);
		if (that.absDistY < 2) 
		{
			that.distY += deltaY;
			return;
		}
		
		
		that.moved = true;
		this.bAllowClick = false;
		that._pos(newY);
		that.dirY = deltaY > 0 ? -1 : deltaY < 0 ? 1 : 0;

		if (event.iFlickTime - that.startTime > 100)
		{
			that.startX = point.pageX;
			event.iFlickTime = that.startTime;
		}
		
		if (event.timeStamp - that.startTime > 300) 
		{
			that.startTime = event.timeStamp;
			that.startY = that.y;
			that.SwipeStartY = point.pageY;
			that.startX = point.pageX;
		}
	};
	
	wScroll.prototype._pos = function (y) 
	{
		clearTimeout(this.setInterval);
		
		var that = this;

		that.y = y;

		if (this.scrollerH < this.wrapperH)
			that.y = 0;
		else if (that.y < ((-1 * this.scrollerH) + this.wrapperH/4))
			that.y = ((-1 * this.scrollerH) + this.wrapperH/4);
		
		this.ulParent.style.webkitTransform = 'translate3d( 0px,' + that.y + 'px, 0)';

		that._indicatorPos(1);
	};
	
	
	wScroll.prototype.ListDestroy = function()
	{
		this._unbind(START_EV);
		this._unbind("gesturestart", this.touchPad);
		this._unbind("gesturechange", this.touchPad);
		this._unbind("gestureend", this.touchPad);
		
		this._unbind("mouseout");
		this._unbind("mouseout", document);
		
		this._unbind("mouseover");
		
		if (this.bMouseOut == false)
		{
			this._unbind(MOVE_EV);
			this._unbind(END_EV);
		}
		
		this._unbindScrollbar();
		
		
		document.removeEventListener("mouseout", this, false);
		
	}
	
	
	wScroll.prototype._unbindScrollbar = function ()
	{
		var that = this;
		var doc = document;
		var dir = 'v';
	
		if (that.ScrollbarWrapper) 
		{
			that.ScrollbarWrapper.style.webkitTransform = '';	// Should free some mem
			that.ScrollbarWrapper.parentNode.removeChild(that.ScrollbarWrapper);
			that.ScrollbarWrapper = null;
			that.ScrollbarIndicator = null;
		}
	}
	
	
	wScroll.prototype._scrollbar = function () 
	{
		var that = this;
		var doc = document;
		var dir = 'v';

		if (!that.ScrollbarWrapper) 
		{
			// Create the scrollbar wrapper
			bar = doc.createElement('div');

			bar.style.cssText = 'position:absolute;' +
								'z-index:500;' +
								'width:7px;' +
								'bottom:7px;' +
								'top:2px;' +
								'right:1px';

			bar.style.cssText += 'pointer-events:none; overflow:hidden; opacity: 1.0px;';

			that.divWrapper.appendChild(bar);
			that.ScrollbarWrapper = bar;

			// Create the scrollbar indicator
			bar = doc.createElement('div');

			bar.style.cssText = 'position:absolute;z-index:1000;' +
								'background:rgba(0,0,0,0.5);' + 
								'border:1px solid rgba(255,255,255,0.9);' +
								'-webkit-background-clip:padding-box;' +
								'-webkit-box-sizing:border-box; ' +
								'width:100%;' + 
								'-webkit-border-radius:3px 4px;';
			
			bar.style.cssText += 'pointer-events:none;' +
								 '-webkit-transition-property:-webkit-transform;' +
								 '-webkit-transition-duration:0;' + 
								 '-webkit-transform:translate3d(0,0,0)';

			that.ScrollbarWrapper.appendChild(bar);
			that.ScrollbarIndicator = bar;
		}


		that.vScrollbarSize = 408;
		that.vScrollbarIndicatorSize = 
								Math.max(Math.round(that.vScrollbarSize * 
													that.vScrollbarSize / 
													that.scrollerH), 
								8);
		that.ScrollbarIndicator.style.height = that.vScrollbarIndicatorSize + 'px';
		that.vScrollbarMaxScroll = that.vScrollbarSize - that.vScrollbarIndicatorSize;
		that.vScrollbarProp = that.vScrollbarMaxScroll / that.maxScrollY;


		// Reset position
		that._indicatorPos(0);
	}
	
	
	wScroll.prototype._indicatorPos = function (hidden) 
	{
		var that = this;
		var dir = 'v';
		
		var pos = that.y;
		
		
		pos = that[dir + 'ScrollbarProp'] * pos;
	
		if (pos < 0) 
		{
			pos = pos + pos*3;
			if (that.vScrollbarIndicatorSize + pos < 9) 
				pos = -that.vScrollbarIndicatorSize + 8;
		}
		else if (pos > that.vScrollbarMaxScroll) 
		{
			pos = pos + (pos - that.vScrollbarMaxScroll)*3;
			if (that.vScrollbarIndicatorSize + 
							that.vScrollbarMaxScroll - pos < 9)
			{
				pos = that.vScrollbarIndicatorSize + 
					  that.vScrollbarMaxScroll - 
					  8;
			}
		}
		
		that.ScrollbarWrapper.style.webkitTransitionDelay = '0';
		that.ScrollbarWrapper.style.opacity = hidden;
		that.ScrollbarIndicator.style.webkitTransform = 
									'translate3d(0,' + pos + 'px, 0)';
	}

	wScroll.prototype.filterList = function(strVal)
	{
	
		var arrayListItems = $(this.ulParent).children('ul').children();

		if (this.iMode == LIST_TYPE_FF)
		{
		
			if ( strVal ) 
			{
				arrayListItems.hide();
			
				// This handles hiding regular rows without the text we search for
				// and any list dividers without regular rows shown under it
				var item;
				var bSelAllVis = false;
				
				for (var i = arrayListItems.length; i >= 0; i--) 
				{
					item = $(arrayListItems[i]);

					if (item.is(".selallclass"))
					{
						continue;
					}
					else if (item.is(".noshrink"))
					{
						item.show();
					}
					else if (item.text().toLowerCase().indexOf( strVal ) === -1)
					{
						item.hide();
					}
					else
					{
						item.show();
						
						if (item.get(0).id.indexOf( "pla_" ) == -1)
							continue;
						
						if (bSelAllVis == false)
						{
							bSelAllVis = true;
							$('#sel_all').show();
						}
					} 
				}
				
				this.RecalcBottom();
				
				this._resetPos(0);
			}
			else
			{
				arrayListItems.show();
				this.RecalcBottom();
			}
		
		}
		else if (this.iMode == LIST_TYPE_INDEX)
		{

			if ( strVal ) 
			{
				arrayListItems.hide();
			
				// This handles hiding regular rows without the text we search for
				// and any list dividers without regular rows shown under it
				var item;

				for (var i = arrayListItems.length; i >= 0; i--) 
				{
					item = $(arrayListItems[i]);
					if (item.is(".selallclass"))
					{
						item.show();
					}
					else if ((item.is(".noshrink")) || 
							 (item.text().toLowerCase().indexOf( strVal ) === -1))
					{
						continue;
					}
					else
					{
						item.show();
						
						var charFirst = this.covertSpecChar(item.text().getFirstLetter());
						
						if ($('#' + charFirst).is(':visible'))
							continue;
							
						$('#' + charFirst).show();
					} 
				}
				
				this.RecalcBottom();
				
				this._resetPos(0);
			}
			else
			{
				arrayListItems.show();
				this.RecalcBottom();
			}
		}
	}

	wScroll.prototype.covertSpecChar = function(charIn)
	{
		var iChars = '!@#$%^&*()+=-[]\\\';,./{}|\":<>?"';

		var i = iChars.indexOf(charIn);
		if (i == -1)
			return charIn;
		else
			return "s" + Number(i).toString();
	} 
	
	wScroll.prototype.RecalcBottom = function()
	{
		
		this.wrapperH = $(this.ulParent).parent().height();
		
		this.scrollerH = $(this.ulParent).height();
		
		
		this.maxScrollY = (-1 * this.scrollerH) + this.wrapperH/2;
		this._resetPos();
		this._scrollbar();
	}
	
	wScroll.prototype.SimpleDraw = function(ulParent, 
											  funcCallBack, 
											  funcFlickEvent)
	{
		this.iMode = SCROLL_DRAW_SIMP;
		
		this.funcFlickEvent = funcFlickEvent;
		this.funcCallBack = funcCallBack;
		this.ulParent = ulParent;
		this.y = 0;
		
		ulParent.style.webkitTransform = 'translate3d( 0px, 0px, 0px)';
		this.divWrapper = ulParent.parentElement;
		
		this._bind(START_EV);
	
		this._bind("mouseout");
		this._bind("mouseout");
		this._bind("mouseover");
		
		this.RecalcBottom();
	}
	
	wScroll.prototype.FileDraw = function(objFile, 
										  ulParent,
										  funcCallBack, 
										  funcFlickEvent)
	{
	
		this.iMode = LIST_TYPE_FF;
		
		var that = this;

		this.funcFlickEvent = funcFlickEvent;
		this.funcCallBack = funcCallBack;
		this.ulParent = ulParent;
		var ul = $(this.ulParent).children('ul');
		
		ulParent.style.webkitTransform = 'translate3d( 0px, 0px, 0px)';
		this.divWrapper = ulParent.parentElement;
		this.divWrapper.setAttribute("style", "font-size: " + this.iCurFontSize + "px;");

		this.dirY = 0;
		
		this._bind(START_EV);
	
		/*this.touchPad = document;
		this._bind("gesturestart", this.touchPad);
		this._bind("gesturechange", this.touchPad);
		this._bind("gestureend", this.touchPad);*/
	
		this._bind("mouseout");
		this._bind("mouseout", document);

		this._bind("mouseover");
	
		this.y = 0;
		var idTracker = 1;

		var li = document.createElement("li");
		li.className = "noshrink";
		li.innerHTML = "Dirs";
		li.id = "Sep_Dir";
		ul.append(li);
		
		for (var i = 0; i < objFile.Dir.length; i++)
		{	
			li = document.createElement("li");
		
			li.innerHTML = "<BR>" + objFile.Dir[i].name; //arrayItems[i].name;
			li.id = "dir_" + Number(i).toString();

			ul.append(li);
		}

		if (objFile.Playable.length != 0)
		{
			li = document.createElement("li");
			li.className = "noshrink";
			li.innerHTML = "Playable";
			li.id = "Sep_Pla";
			ul.append(li);
			
			$('<li></li>', {
				"id": "sel_all",
				"class": "selallclass",
				text: "Add All To Playlist"
			}).appendTo(ul);
			
		}
		
		for (var i = 0; i < objFile.Playable.length; i++)
		{	
			li = document.createElement("li");
		
			li.innerHTML = "<BR>" + objFile.Playable[i].name; //arrayItems[i].name;
			li.id = "pla_" + Number(i).toString();

			ul.append(li);
		}

		if (objFile.Unknown.length != 0)
		{
			li = document.createElement("li");
			li.className = "noshrink";
			li.innerHTML = "Unknown";
			li.id = "Sep_Unk";
			ul.append(li);
		}
		
		for (var i = 0; i < objFile.Unknown.length; i++)
		{	
			li = document.createElement("li");
		
			li.innerHTML = "<BR>" + objFile.Unknown[i].name;
			li.id = "unk_" + Number(i).toString();
		
			ul.append(li);
		}
		
		this.RecalcBottom();
	}
	
	wScroll.prototype.IndexDraw = function(arrayItems, 
										   ulParent,
										   funcCallBack, 
										   funcFlickEvent)
	{
		this.iMode = LIST_TYPE_INDEX;
		
		this.ulParent = ulParent;
		this.funcFlickEvent = funcFlickEvent;
		this.funcCallBack = funcCallBack;
		
		this.iTotalLiCount = 0;
		this.iTotalSepCount  = 0;
		
		var that = this;
		var ul = $(this.ulParent).children('ul');

		ulParent.style.webkitTransform = 'translate3d( 0px, 0px, 0px)';
		this.divWrapper = ulParent.parentElement;

		this.dirY = 0;
		
		this._bind(START_EV);
	
		/*this.touchPad = document;
		this._bind("gesturestart", this.touchPad);
		this._bind("gesturechange", this.touchPad);
		this._bind("gestureend", this.touchPad);*/
	
		this._bind("mouseout");
		this._bind("mouseout", document);

		this._bind("mouseover");
	
		this.y = 0;
		var idTracker = 1;
		
		$('<li></li>', {
			"id": "sel_all",
			"class": "selallclass",
			text: "Add All To Playlist"
		}).appendTo(ul);
		
		var li = document.createElement("li");
		var charSep = arrayItems[0].DisplayText.getFirstLetter();
		li.className = "noshrink";
		li.innerHTML = charSep;
		li.id = this.covertSpecChar(charSep);
		ul.append(li);
		
		for (var i = 0; i < arrayItems.length; i++)
		{	
			li = document.createElement("li");
			
			// use the function we added to the string prototype to get
			//	the first letter of the text to see if we need a new Separator
			var charFirstLetter = arrayItems[i].DisplayText.getFirstLetter();
			
			if (charSep != charFirstLetter)
			{
				li.className = "noshrink";
				li.innerHTML = charFirstLetter;
				li.id = this.covertSpecChar(charFirstLetter);

				ul.append(li);
				li = document.createElement("li");
				charSep = charFirstLetter;
			}
			
			li.innerHTML = "<BR>" + arrayItems[i].DisplayText;
			li.id = arrayItems[i].IdHash;
			ul.append(li);
		}
	
		this.RecalcBottom();
	
	};

}