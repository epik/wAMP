/*!
 * iScroll Lite base on iScroll v4.1.6 ~ Copyright (c) 2011 Matteo Spinelli, http://cubiq.org
 * Released under MIT license, http://cubiq.org/license
 */

 arraySqrtLookUpTable = new Array(101);
 
 var fNow = 0;
 
 for (var lcv=0; lcv<100; lcv++)
 {
	arraySqrtLookUpTable[lcv] = Math.sqrt(1 - fNow * fNow);
	fNow -= 0.01;
 }
 
 arraySqrtLookUpTable[100] = 0;
 
(function(){
var m = Math,
	vendor = (/webkit/i).test(navigator.appVersion) ? 'webkit' :
		(/firefox/i).test(navigator.userAgent) ? 'Moz' :
		'opera' in window ? 'O' : '',

	// Browser capabilities
	has3d = 'WebKitCSSMatrix' in window && 'm11' in new WebKitCSSMatrix(),
	hasTouch = 'ontouchstart' in window,
	hasTransform = vendor + 'Transform' in document.documentElement.style,
	isIDevice = (/iphone|ipad/gi).test(navigator.appVersion),
	isPlaybook = (/playbook/gi).test(navigator.appVersion),
	hasTransitionEnd = isIDevice || isPlaybook,

	// Events
	//RESIZE_EV = 'onorientationchange' in window ? 'orientationchange' : 'resize',
	START_EV = hasTouch ? 'touchstart' : 'mousedown',
	MOVE_EV = hasTouch ? 'touchmove' : 'mousemove',
	END_EV = hasTouch ? 'touchend' : 'mouseup',
	CANCEL_EV = hasTouch ? 'touchcancel' : 'mouseup',

	// Helpers
	trnOpen = 'translate' + (has3d ? '3d(' : '('),
	trnClose = has3d ? ',0)' : ')',

	// Constructor
	iScroll = function (el, options) {
		var that = this,
			doc = document,
			i;

		that.wrapper = typeof el == 'object' ? el : doc.getElementById(el);
		//that.wrapper.style.overflow = 'hidden';
		that.scroller = that.wrapper.children[0];

		// Default options
		that.options = {
			hScroll: true,
			vScroll: true,
			bounce: true,
			bounceLock: false,
			momentum: true,
			lockDirection: true,
			useTransform: true,
			useTransition: false,
			useScrollBar: true,
			useBufAndTarg: false,
			iFlickThresh: 20,

			// Events
			onRefresh: null,
			onBeforeScrollStart: function (e) { e.preventDefault(); },
			onScrollStart: null,
			onBeforeScrollMove: null,
			onScrollMove: null,
			onBeforeScrollEnd: null,
			onScrollEnd: null,
			onTouchEnd: null,
			onDestroy: null,
			onClick: null,
			onLongPress: null,
			onSwipe: null,
			onAnimationStart: null,
			onRefresh: null,
			
			callEachPos: null,
			
			// this allows us to use an alternate dom object
			//	for handling input
			altTouchTarget: null
		};

		// User defined options
		for (i in options) that.options[i] = options[i];
		
		// Normalize options
		that.options.useTransform = hasTransform ? that.options.useTransform : false;
		that.options.hScrollbar = that.options.hScroll && that.options.hScrollbar;
		that.options.vScrollbar = that.options.vScroll && that.options.vScrollbar;
		that.options.useTransition = hasTransitionEnd && that.options.useTransition;
		
		if (!that.options.callEachPos)
			that.options.callEachPos = function() {};
		
		
		// Set some default styles
		that.scroller.style[vendor + 'TransitionProperty'] = 
						that.options.useTransform ? 
							'-' + vendor.toLowerCase() + '-transform' : 
							'top left';
		that.scroller.style[vendor + 'TransitionDuration'] = '0';
		that.scroller.style[vendor + 'TransformOrigin'] = '0 0';
		/*if (that.options.useTransition)
		{ 
			that.scroller.style[vendor + 'TransitionTimingFunction'] = 
							'cubic-bezier(0.33,0.66,0.66,1)';
		}*/
		
		if (that.options.useTransform) 
			that.scroller.style[vendor + 'Transform'] = trnOpen + '0,0' + trnClose;
		else 
			that.scroller.style.cssText += ';position:absolute;top:0;left:0';
				
		//that.refresh();

		//that._bind(RESIZE_EV, window);
		if (this.options.altTouchTarget)
			that._bind(START_EV, that.options.altTouchTarget);
		else
			that._bind(START_EV);
			
		if (!hasTouch)
		{		
			if (that.options.altTouchTarget)
				that._bind('mouseout', that.options.altTouchTarget);
			else
				that._bind('mouseout', that.wrapper);		
		}
		
		if (that.options.useScrollBar)
		{
			var bar = doc.createElement('div');

			bar.style.cssText = 'position:absolute;' +
								'z-index:500;' +
								'width:7px;' +
								'bottom:7px;' +
								'top:2px;' +
								'right:1px';

			bar.style.cssText += 'pointer-events:none; ' +
								 '-webkit-transition-duration:0; ' + 
								 'overflow:hidden; display: block;';

			that.wrapper.appendChild(bar);
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
	};

// Prototype
iScroll.prototype = {
	enabled: true,
	x: 0,
	y: 0,
	tmoutLongPress: 0,
	steps: 0,
	bLongClick: 0,
	domBufTarget: 0,
	
	handleEvent: function (e) {
		var that = this;
		switch(e.type) {
			case START_EV:
				if (!hasTouch && e.button !== 0) return;
				that._start(e);
				break;
			case MOVE_EV: that._move(e); break;
			case END_EV:
			case CANCEL_EV: that._end(e); break;
			//case RESIZE_EV: that._resize(); break;
			case 'mouseout': that._mouseout(e); break;
			case 'webkitTransitionEnd': that._transitionEnd(e); break;
		}
	},

	_resize: function () {
		//this.refresh();
	},
	
	_pos: function (x, y) 
	{
		this.scroller.style.webkitTransform = 
						'translate3d(0px,' + y + 'px,0)';

		this.ScrollbarIndicator.style.webkitTransform = 
									'translate3d(0,' + 
									(this.vScrollbarProp * y)
									+ 'px, 0)';
		
		this.options.callEachPos.call(this, 0, (this.y = y));
	},

	_start: function (e) {

			var that = this,
				point = hasTouch ? e.touches[0] : e,
				matrix, x, y;

			that.bLongClick = 0;
			//that.domBufTarget = e.target;
				
			if (!that.enabled) return;

			if (that.options.onBeforeScrollStart) that.options.onBeforeScrollStart.call(that, e);

			that.tmoutLongPress = setTimeout(function()
			{
				if (that.options.onLongPress)
				{
					that.options.onLongPress.call(that, point.pageX, point.pageY, e.target);
					that.bLongClick = 1;
				}
			}, 400);
			
			if (that.options.useTransition) that._transitionTime(0);

			that.bFlick = that.moved = that.animating = that.zoomed = false;
			that.distY = that.absDistY = 0;
			
			if (that.options.momentum) 
			{
				// Very lame general purpose alternative to CSSMatrix
				matrix = getComputedStyle(that.scroller, 
								null)[vendor + 'Transform'].replace(/[^0-9-.,]/g, '').split(',');
				
				if ((y = matrix[5] * 1) != that.y) {
					if (that.options.useTransition) that._unbind('webkitTransitionEnd');
					else clearTimeout(that.aniTime);
					that.steps = 0;
					that._pos(0, y);
				}
			}

			that.absStartY = that.startY = that.y;
			that.pointY = that.iTouchStartY = point.pageY;

			that.startTime = e.timeStamp || (new Date()).getTime();

			if (that.options.onScrollStart) 
				that.options.onScrollStart.call(that, e);

			if (this.options.altTouchTarget)
				that._bind(MOVE_EV, this.options.altTouchTarget);
			else
				that._bind(MOVE_EV);

			if (this.options.altTouchTarget)
				that._bind(END_EV, this.options.altTouchTarget);
			else
				that._bind(END_EV);
			
			if (this.options.altTouchTarget)
				that._bind(CANCEL_EV, this.options.altTouchTarget);
			else
				that._bind(CANCEL_EV);
			
	},
	
	_move: function (e) 
	{
		
		var that = this,
			point = hasTouch ? e.touches[0] : e,
			deltaY = point.pageY - that.pointY,
			newY = that.y + deltaY,
			timestamp = e.timeStamp || (new Date()).getTime();
		
		if (that.options.onBeforeScrollMove) that.options.onBeforeScrollMove.call(that, e);
		
		that.pointY = point.pageY;

		// Slow down if outside of the boundaries
		if (newY > 0 || newY < that.maxScrollY) { 
			newY = that.options.bounce ? 
				that.y + (deltaY / 2) : 
				newY >= 0 || that.maxScrollY >= 0 ? 0 : that.maxScrollY;
		}

		if (that.absDistY < 4) {
			that.distY += deltaY;
			that.absDistY = m.abs(that.distY);
			return;
		}

		clearTimeout(this.tmoutLongPress);
		
		that.moved = true;

		that._pos(0, newY);

		if (timestamp - that.startTime > 300) {
			that.startTime = timestamp;
			that.startY = that.y;
		}
		
		if (that.options.onScrollMove) that.options.onScrollMove.call(that, e);
	},
	
	_end: function (e) {

		clearTimeout(this.tmoutLongPress);
		
		if (hasTouch && e.touches.length != 0) return;

		var that = this,
			point = hasTouch ? e.changedTouches[0] : e,
			target, ev,
			//momentumX = { dist:0, time:0 },
			momentumY = { dist:0, time:0 },
			duration = (e.timeStamp || (new Date()).getTime()) - that.startTime,
			//newPosX = that.x,
			newPosY = that.y;

		if (this.options.altTouchTarget)
			that._unbind(MOVE_EV, this.options.altTouchTarget);
		else
			that._unbind(MOVE_EV);

		if (this.options.altTouchTarget)
			that._unbind(END_EV, this.options.altTouchTarget);
		else
			that._unbind(END_EV);
		
		if (this.options.altTouchTarget)
			that._unbind(CANCEL_EV, this.options.altTouchTarget);
		else
			that._unbind(CANCEL_EV);		

		if (that.options.onBeforeScrollEnd) that.options.onBeforeScrollEnd.call(that, e);

		if (that.bLongClick)
			return;
		
		if (!that.moved) 
		{
			if (that.options.onClick)
				that.options.onClick.call(that, e, e.target);

			that._resetPos(200);

			if (that.options.onTouchEnd) that.options.onTouchEnd.call(that, e);
			return;
		}

		if (that.options.onAnimationStart) 
				that.options.onAnimationStart.call(that);
		
		if (duration < 300) {
			if (newPosY)
			{
				momentumY = that._momentum(newPosY - that.startY, 
										duration, 
										-that.y, 
										(that.maxScrollY < 0 ? 
											that.scrollerH - that.wrapperH + that.y : 
											0), 
										that.wrapperH);
			}

			newPosY = that.y + momentumY.dist;

 			if ((that.y > 0 && newPosY > 0) || 
				(that.y < that.maxScrollY && newPosY < that.maxScrollY)) 
			{
				momentumY = { dist:0, time:0 };
			}
		}

		if ( momentumY.dist) 
		{
			that.scrollTo(0, newPosY, m.max(momentumY.time, 10));

			if (that.options.onTouchEnd) 
				that.options.onTouchEnd.call(that, e);
			return;
		}

		that._resetPos(200);
		if (that.options.onTouchEnd) that.options.onTouchEnd.call(that, e);
	},
	
	_resetPos: function (time) 
	{
		var that = this,
			//resetX = that.x >= 0 ? 0 : that.x < that.maxScrollX ? that.maxScrollX : that.x,
			resetY = that.y >= 0 || 
					that.maxScrollY > 0 ? 
						0 : 
						that.y < that.maxScrollY ? that.maxScrollY : that.y;

		if (resetY == that.y) {
			if (that.moved) {
				if (that.options.onScrollEnd) 
					that.options.onScrollEnd.call(that);
				that.moved = false;
			}

			return;
		}

		that.scrollTo(0, resetY, time || 0);
	},
	
	_mouseout: function (e) 
	{
		/*var t = e.relatedTarget;

		if (!t) {
			this._end(e);
			return;
		}

		while (t = t.parentNode) if (t == this.wrapper) return;

		this.moved = true;
		
		this._end(e);*/
	},

	_transitionEnd: function (e) {
		var that = this;

		if (e.target != that.scroller) return;

		that._unbind('webkitTransitionEnd');
		
		that._startAni();
	},

	/**
	 *
	 * Utilities
	 *
	 */

	_startAni: function () {
		var that = this,
			startY = that.y,
			startTime = (new Date).getTime(),
			step;

		if (that.animating) return;

		if (!that.steps) {
			that._resetPos(400);
			return;
		}

		step = that.steps.y;
		
		that.steps = 0;

		if (step == startY)
		{
			that.sTime = that.sTimeDiv = 0;
		}
		that.animating = that.moved = true;

		(function animate () {
			var now = (new Date).getTime() - startTime;

			if (now >= that.sTime) 
			{
				that._pos(0, step);
				that.animating = false;
				
				// Execute custom code on animation end
				if (that.options.onAnimationEnd) 
					that.options.onAnimationEnd.call(that);

				that._startAni();
				return;
			}

			if ((now = 100 - (0 | (now * that.sTimeDiv))) < 0)
				that._pos(0, step);
			else
				that._pos(0, (step - startY) * arraySqrtLookUpTable[now] + startY);
				
			if (that.animating) 
				that.aniTime = setTimeout(animate, 25);
		})();
	},

	_transitionTime: function (time) {
		this.scroller.style[vendor + 'TransitionDuration'] = time + 'ms';
	},
	
	_momentum: function (dist, time, maxDistUpper, maxDistLower, size) {
		var speed = m.abs(dist) / time,
			newTime = speed * 813,
			newDist = speed * newTime,
			outsideDist = 0;

		// Proportinally reduce speed if we are outside of the boundaries 
		if (dist > 0 && newDist > maxDistUpper) {
			outsideDist = size * speed / 6;
			maxDistUpper = maxDistUpper + outsideDist;
			speed = maxDistUpper / newTime;
			newDist = maxDistUpper;
		} else if (dist < 0 && newDist > maxDistLower) {
			outsideDist = size * speed / 6;
			maxDistLower = maxDistLower + outsideDist;
			speed = maxDistLower / newTime;
			newDist = maxDistLower;
		}

		newDist = newDist * (dist < 0 ? -1 : 1);
		
		return { dist: newDist, time: (0 | newTime) };
	},

	_offset: function (el) {
		var left = -el.offsetLeft,
			top = -el.offsetTop;
			
		while (el = el.offsetParent) {
			left -= el.offsetLeft;
			top -= el.offsetTop;
		} 

		return { left: left, top: top };
	},
	
	_offsetTop: function (el) {
		var top = -el.offsetTop;
			
		while (el = el.offsetParent) {
			top -= el.offsetTop;
		} 

		return -top;
	},

	_bind: function (type, el, bubble) {
		(el || this.scroller).addEventListener(type, this, !!bubble);
	},

	_unbind: function (type, el, bubble) {
		(el || this.scroller).removeEventListener(type, this, !!bubble);
	},


	/**
	 *
	 * Public methods
	 *
	 */
	destroy: function () {
		var that = this;

		that.scroller.style[vendor + 'Transform'] = '';

		// Remove the event listeners
		//that._unbind(RESIZE_EV, window);
		if (this.options.altTouchTarget)
			that._unbind(START_EV, this.options.altTouchTarget);
		else
			that._unbind(START_EV);	
		
		if (this.options.altTouchTarget)
			that._unbind(MOVE_EV, this.options.altTouchTarget);
		else
			that._unbind(MOVE_EV);
		
		if (this.options.altTouchTarget)
			that._unbind(END_EV, this.options.altTouchTarget);
		else
			that._unbind(END_EV);
		
		if (this.options.altTouchTarget)
			that._unbind(CANCEL_EV, this.options.altTouchTarget);
		else
			that._unbind(CANCEL_EV);
			
		that._unbind('mouseout', that.wrapper);
		if (that.options.useTransition) that._unbind('webkitTransitionEnd');
		
		that._unbindScrollbar();
		
		if (that.options.onDestroy) that.options.onDestroy.call(that);
	},

	refresh: function()
	{
		this.RecalcBottom();
	},
	
	RecalcAll: function()
	{
		var that = this,
			offset;

		that.wrapperW = that.wrapper.clientWidth;
		that.wrapperH = that.wrapper.clientHeight;

		that.scrollerW = that.scroller.offsetWidth;
		that.scrollerH = that.scroller.offsetHeight;
		that.maxScrollX = that.wrapperW - that.scrollerW;
		that.maxScrollY = that.wrapperH - that.scrollerH;

		that.hScroll = that.options.hScroll && that.maxScrollX < 0;
		that.vScroll = that.options.vScroll && 
						(!that.options.bounceLock && !that.hScroll || 
						 that.scrollerH > that.wrapperH);

		offset = that._offset(that.wrapper);
		that.wrapperOffsetLeft = -offset.left;
		that.wrapperOffsetTop = -offset.top;


		that.scroller.style[vendor + 'TransitionDuration'] = '0';

		that._resetPos(200);
		that._scrollbar();
		
		if (that.options.onRefresh)
			that.options.onRefresh.call(that);	
	},
	
	RecalcBottom: function () 
	{
		var that = this,
			offset;

		that.wrapperH = that.wrapper.clientHeight;

		that.scrollerH = that.scroller.offsetHeight;

		that.maxScrollY = that.wrapperH - that.scrollerH;

		that.vScroll = that.scrollerH > that.wrapperH;

		that.scroller.style[vendor + 'TransitionDuration'] = '0';

		that._resetPos(200);
		that._scrollbar();
		
		if (that.options.onRefresh)
			that.options.onRefresh.call(that);
	},

	YScrollTo: function(y, time, relative)
	{
		this.stop();
		
		if (!(this.sTime = (time || 0)))
			this.sTimeDiv = 0;
		else
			this.sTimeDiv = 100/time;
		
		this.steps = {y: (relative ? (this.y - y) : y)};
				
		this._startAni();
	},
	
	scrollTo: function (x, y, time, relative) {
		
		this.stop();
		
		if (!(this.sTime = (time || 0)))
			this.sTimeDiv = 0;
		else
			this.sTimeDiv = 100/time;
		
		this.steps = {y: (relative ? (this.y - y) : y)};
				
		this._startAni();
	},

	scrollToElement: function (el, time) {
		var that = this, pos;
		el = el.nodeType ? el : that.scroller.querySelector(el);
		if (!el) return;

		pos = that._offset(el);
		pos.left += that.wrapperOffsetLeft;
		pos.top += that.wrapperOffsetTop;

		pos.left = pos.left > 0 ? 0 : pos.left < that.maxScrollX ? that.maxScrollX : pos.left;
		pos.top = pos.top > 0 ? 0 : pos.top < that.maxScrollY ? that.maxScrollY : pos.top;
		time = time === undefined ? m.max(m.abs(pos.left)*2, m.abs(pos.top)*2) : time;

		that.scrollTo(pos.left, pos.top, time);
	},

	disable: function()
	{
		this.IngoreInput();
	},
	
	IgnoreInput: function () {
		this.stop();
		this._resetPos(0);
		this.enabled = false;

		// If disabled after touchstart we make sure that there are no left over events
		if (this.options.altTouchTarget)
			this._unbind(MOVE_EV, this.options.altTouchTarget);
		else
			this._unbind(MOVE_EV);	
		
		if (this.options.altTouchTarget)
			this._unbind(END_EV, this.options.altTouchTarget);
		else
			this._unbind(END_EV);
		
		if (this.options.altTouchTarget)
			this._unbind(CANCEL_EV, this.options.altTouchTarget);
		else
			this._unbind(CANCEL_EV);
	},
	
	enable: function()
	{
		this.AllowInput();
	},
	
	AllowInput: function () {
		this.enabled = true;
	},
	
	stop: function () {
		clearTimeout(this.aniTime);
		this.steps = 0;
		this.moved = false;
		this.animating = false;
	},
	
	_unbindScrollbar: function ()
	{
		var that = this;
	
		if (that.ScrollbarWrapper) 
		{
			that.ScrollbarWrapper.style.webkitTransform = '';	// Should free some mem
			that.ScrollbarWrapper.parentNode.removeChild(that.ScrollbarWrapper);
			that.ScrollbarWrapper = null;
			that.ScrollbarIndicator = null;
		}
	},
	
	_scrollbar: function () 
	{
		//var that = this;

		this.vScrollbarSize = this.ScrollbarWrapper.clientHeight;
		this.vScrollbarIndicatorSize = 
								Math.max(Math.round(this.vScrollbarSize *
													this.vScrollbarSize / 
													this.scrollerH), 
								8);
		this.ScrollbarIndicator.style.height = this.vScrollbarIndicatorSize + 'px';
		this.vScrollbarMaxScroll = this.vScrollbarSize - this.vScrollbarIndicatorSize;
		this.vScrollbarProp = this.vScrollbarMaxScroll / this.maxScrollY;
		this.vScrollbarMaxScroll += this.vScrollbarIndicatorSize;
		
		// Reset position
		this.ScrollbarIndicator.style.webkitTransform = 
									'translate3d(0, 0, 0)';
	}
};

if (typeof exports !== 'undefined') exports.iScroll = iScroll;
else window.iScroll = iScroll;

})();
