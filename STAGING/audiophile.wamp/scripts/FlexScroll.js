function FlexScroll()
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
	this.funcLongPress = 0;
	this.ulParent = 0;
	
	this.ScrollbarWrapper = 0;
	this.ScrollbarIndicator = 0;
	
	this.tmoutLongPress = 0;
	
	this.jqobjTopLabelClone = 0;
	
	this.bIgnoreInput = 0;
	
	FlexScroll.prototype.IgnoreInput = function()
	{
		this.bIgnoreInput = 1;
	};
	
	FlexScroll.prototype.AllowInput = function()
	{
		this.bIgnoreInput = 0;
	};
	
	this.handleEvent = function (e) 
	{ 
		if (this.bIgnoreInput)
			return;
	
		if (e.type == START_EV)
		{
			this.FlexScrollMD(e);
		} 
		else if (e.type == MOVE_EV)
		{
			this.FlexScrollMM(e);
		} 
		else if (e.type == END_EV)
		{
			this.FlexScrollMU(e);
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
		else if (e.type == TOUCHOUT_EV)
		{
			this.mouseOutFix(e);
		}
	};
	
	FlexScroll.prototype.ensureScroll = function()
	{
		this._indicatorPos(1);
	}
	
	FlexScroll.prototype.pickItem = function(e)
	{
		e.stopPropagation();
		
		var domTarget = e.target;
		
		if (!domTarget)
			return;
		
		this.funcCallBack(e, domTarget);
	}
	
	FlexScroll.prototype.mouseOutFix = function (event)
	{
		/*for (var i in event)
			console.log("Prop:" + i + " Val:" + event[i]);*/
	
		var point = hasTouch ? event.changedTouches[0] : event;
	
		var iTop = $(this.divWrapper).offset().top;
		
		if((point.pageY < (iTop + 10)) && 
				(point.pageY > (iTop + $(this.divWrapper).height() - 10)))
		{
			return;
		}
		
		if (this.bIgnoreOutEvents)
			return;
	
		this._indicatorPos(0);
	
		this.bAllowClick = false;
	
		this.bMouseOut = true;
		
		var that = this;
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
	
	FlexScroll.prototype._bind = function (type, el) 
	{
		if (!(el))
			el = this.divWrapper;
		el.addEventListener(type, this, false);
	}

	FlexScroll.prototype._unbind = function (type, el) 
	{
		if (!(el))
			el = this.divWrapper;
		el.removeEventListener(type, this, false);
	}
	
	FlexScroll.prototype.pinchStart = function(e)
	{
		e.stopPropagation();
		this.bIgnoreOutEvents = true;
		
		this.noScroll = true;
		

	}
	
	FlexScroll.prototype.pinchEnd = function(e)
	{
		e.stopPropagation();
	
		this.bIgnoreOutEvents = false;
	
		this.noScroll = false;

	}
	
	
	FlexScroll.prototype._timedScroll = function (destY, runtime) 
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
	
	FlexScroll.prototype._transitionEnd = function (e) 
	{		
		var that = this;
	
		if (this.bAddScrollClass)
			$(this.ulParent).removeClass("classScrollInProg");
	
		that._resetPos(that.returnTime);
		that.returnTime = 0;
		
		that._indicatorPos(0);
	};

	FlexScroll.prototype._momentum = function (dist, time, maxDistUpper, maxDistLower, size) 
	{
		var that = this;
		var deceleration = 0.0006;
		var speed = Math.abs(dist) / time;
		var newDist = (speed * speed) * 833.33; // / (2 * deceleration);
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
		newTime = speed * 1666.66; // / deceleration;

		return { dist: newDist, time: Math.round(newTime) };
	};
			
	FlexScroll.prototype.FlexScrollMD = function(event)
	{
		var that = this;
		var point = hasTouch ? event.changedTouches[0] : event;
		var target = event.target;
		var lpX = point.pageX;
		var lpY = point.pageY;
	
		this.tmoutLongPress = setTimeout(function()
		{
			if (that.funcLongPress)
				that.funcLongPress(lpX, lpY, target);
		}, 500);
	
		if (this.bAddScrollClass)
			$(this.ulParent).addClass("classScrollInProg");
		
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
	
	FlexScroll.prototype.FlexScrollMU = function(event)
	{
		clearTimeout(this.tmoutLongPress);
		
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
		
			if (this.bAddScrollClass)
				$(this.ulParent).removeClass("classScrollInProg");
		
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

		if (this.bAddScrollClass)
			$(this.ulParent).removeClass("classScrollInProg");
		
		that._resetPos(200);
	};

	FlexScroll.prototype._resetPos = function (time) 
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

	FlexScroll.prototype.scrollTo = function (y, time, relative) 
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
			that.transitionEnd = setTimeout(function () 
			{
				that._transitionEnd();
			}, time+2);
		}
		that._timedScroll(y, time);
	};
	
	FlexScroll.prototype._transitionTime = function (time) 
	{
		/*var that = this;
		
		time += 'ms';
		var ulParent = document.getElementById(this.strParent);
		ulParent.style.webkitTransitionDuration = time;*/
	};
	
	FlexScroll.prototype.FlexScrollMM = function(event)
	{
		clearTimeout(this.tmoutLongPress);
	
		var that = this;
		var point = hasTouch ? event.changedTouches[0] : event;
		var deltaY = point.pageY - that.pointY;
		var newY = that.y + deltaY;
		var duration = event.timeStamp - that.startTime;

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
						that.funcFlickEvent(event, FlexScroll_FLICK_RIGHT);
                }
                else
                {
					if (that.funcFlickEvent)
						that.funcFlickEvent(event, FlexScroll_FLICK_LEFT);
                }
        }
		
		// Slow down if outside of the boundaries
		if (newY > 0 || newY < that.maxScrollY) 
		{ 
			newY = that.y + (deltaY / 2.4);
		}

		that.absDistY = Math.abs(that.distY);
		if (that.absDistY < 5) 
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
	
	FlexScroll.prototype._SetFirstVisLabel = function(iTrigger)
	{
		if (iTrigger)
		{
			if (this.jqobjTopLabelClone)
			{
				this.jqobjTopLabelClone[0].innerHTML = 
							$(this.ulParent).children(".listItemHeader").get(0).innerHTML;
				this.jqobjTopLabelClone[0].setAttribute('style', "");
			}
			return;
		}
			
		var me = this;
		
		var iHeight = 0;
		
		var jqobjSeletor = $(this.ulParent).children(".listItemHeader"); 
		
		var i;
		if ((i = jqobjSeletor.length) == 0) 
			return;
		
		var bQuickFix = 0;
		var iOuterHeight = jqobjSeletor.outerHeight();
		var wrapperHeight = $(this.divWrapper).offset().top;
		
		while (i--) 
		{
			if (jqobjSeletor[i].style.cssText.indexOf('none') != -1)
			{
				continue;
			}
			
			iHeight = $(jqobjSeletor[i]).offset().top - wrapperHeight;
						
			if ((i == 0) && me.jqobjTopLabelClone)
			{
				if (iHeight > 0)
				{
					me.jqobjTopLabelClone.remove();
					me.jqobjTopLabelClone = 0;
					return;
				}
			}
			
			if (iHeight < iOuterHeight)
			{				
				if ((iHeight > 0) && me.jqobjTopLabelClone)
				{						
					me.jqobjTopLabelClone[0].setAttribute('style', 
								'				-webkit-transform: translate3d( 0px,' + 
														(0 - (iOuterHeight - iHeight)) + 'px, 0)');
					return;
				}
				else if (iHeight < 0)
				{

					
					if (me.jqobjTopLabelClone)
					{
						me.jqobjTopLabelClone[0].innerHTML = jqobjSeletor.get(i).innerHTML;
						me.jqobjTopLabelClone[0].setAttribute('style', "");					
						return;
					}
							
					me.jqobjTopLabelClone = $(jqobjSeletor.get(i)).clone();
					
					me.jqobjTopLabelClone.removeClass();
					me.jqobjTopLabelClone.addClass("classListItemHeader-Out");
					me.jqobjTopLabelClone.css({
						'top': 0
					});			
			
					me.jqobjTopLabelClone.appendTo($(me.divWrapper));
					return;
				}
			}
				
		};
	}
	
	FlexScroll.prototype._pos = function (y) 
	{
		clearTimeout(this.setInterval);
		
		var that = this;

		that.y = y;

		if (this.scrollerH < this.wrapperH)
			that.y = 0;
		else if (that.y < ((-1 * this.scrollerH) + (this.wrapperH * .8)))
			that.y = ((-1 * this.scrollerH) + (this.wrapperH * .8));
		
		this.ulParent.style.webkitTransform = 'translate3d( 0px,' + that.y + 'px, 0)';

		that._indicatorPos(1);
		this._SetFirstVisLabel();
	};
	
	
	FlexScroll.prototype.ListDestroy = function()
	{
		this._unbind(START_EV);
		this._unbind("gesturestart", this.touchPad);
		this._unbind("gesturechange", this.touchPad);
		this._unbind("gestureend", this.touchPad);
		
		this._unbind(TOUCHOUT_EV);
		this._unbind(TOUCHOUT_EV, document);
		
		this._unbind("mouseover");
		
		if (this.bMouseOut == false)
		{
			this._unbind(MOVE_EV);
			this._unbind(END_EV);
		}
		
		this._unbindScrollbar();
		
	}
	
	
	FlexScroll.prototype._unbindScrollbar = function ()
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
	
	
	FlexScroll.prototype._scrollbar = function () 
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
	
	
	FlexScroll.prototype._indicatorPos = function (hidden) 
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


	FlexScroll.prototype.covertSpecChar = function(charIn)
	{
		var iChars = '!@#$%^&*()+=-[]\\\';,./{}|\":<>?"';

		var i = iChars.indexOf(charIn);
		if (i == -1)
			return charIn;
		else
			return "s" + Number(i).toString();
	} 
	
	FlexScroll.prototype.RecalcParams = function(iScrollTo)
	{
		if (iScrollTo == undefined)
			iScrollTo = this.y;
		else if (iScrollTo == 0)
			this._SetFirstVisLabel(-1);		
		
		//console.log(iScrollTo);
		
		this.wrapperW = $(this.divWrapper).width();
		
		this.scrollerW = $(this.ulParent).width();
		
		this.maxScrollX = (-1 * this.scrollerW) + (this.wrapperW);
		
		this.wrapperX = $(this.divWrapper).offset().left;
		
		this._resetPos();
		this._scrollbar();
		this.scrollTo(iScrollTo);

	}
	
	FlexScroll.prototype.SimpleDraw = function(ulParent,
											bAddClass,
											  funcCallBack, 
											  funcFlickEvent,
											  funcLongPress)
	{
		this.bAddScrollClass = bAddClass;
		
		this.iMode = SCROLL_DRAW_SIMP;
		
		this.funcFlickEvent = funcFlickEvent;
		this.funcCallBack = funcCallBack;
		this.funcLongPress = funcLongPress;
		this.ulParent = ulParent;		
		this.x = 0;
		
		ulParent.style.webkitTransform = 'translate3d( 0px, 0px, 0px)';
		this.divWrapper = ulParent.parentElement;
		
		this._bind(START_EV);
	
		//this._bind(TOUCHOUT_EV);
		//this._bind("mouseover");
		
		this.RecalcParams();
	}

}