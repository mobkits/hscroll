/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var Iscroll = __webpack_require__(1)
	var event = __webpack_require__(10)
	var Hscroll = __webpack_require__(22)
	var detect = __webpack_require__(2)
	var transform = detect.transform
	var ontap = __webpack_require__(24)
	
	var els = document.querySelectorAll('.hscroll')
	;[].slice.call(els).forEach(function (el) {
	  var type
	  if (el.classList.contains('swipe')) type = 'swipe'
	  if (el.classList.contains('fix')) type = 'fix'
	  var scroll = new Hscroll(el, {
	    type: type
	  })
	  //if (i == 0) scroll.play()
	  //scroll.play()
	})
	
	;(function () {
	  var el = document.querySelector('#carousel .imgs')
	  var scroll = new Hscroll(el, {
	    type: 'swipe',
	    interval: 2000
	  })
	  event.bind(el, 'touchstart', function () {
	    scroll.stop()
	  })
	  event.bind(el, 'mousedown', function () {
	    scroll.stop()
	  })
	  scroll.play()
	  scroll.on('show', function (n) {
	    var els = document.querySelectorAll('#carousel .indicator li')
	    for (var i = 0, l = els.length; i < l; i++) {
	      if (i == n) {
	        els[i].classList.add('active')
	      } else {
	        els[i].classList.remove('active')
	      }
	    }
	  })
	})()
	
	;(function () {
	  var els = document.querySelectorAll('#tab .scrollable')
	  ;[].slice.call(els).forEach(function (el) {
	    new Iscroll(el, {
	      handlebar: true
	    })
	  })
	  var tab = document.getElementById('tab')
	  var scroll = new Hscroll(tab.querySelector('.body'), {
	    type: 'swipe'
	  })
	  var tabs = tab.querySelectorAll('.header li')
	  var line = tab.querySelector('.header .line')
	  function active(n) {
	    for (var i = 0, l = tabs.length; i < l; i++) {
	      if (i == n) {
	        tabs[i].classList.add('active')
	      } else {
	        tabs[i].classList.remove('active')
	      }
	    }
	    line.style[transform] = 'translateX(' + 80*n + 'px)'
	  }
	  scroll.on('show', active)
	  ontap(tab.querySelector('.header'), function (e) {
	    var target = e.target
	    if (target.tagName.toLowerCase() == 'li') {
	      var n = [].slice.call(tabs).indexOf(target)
	      active(n)
	      scroll.show(n)
	    }
	  })
	})()
	


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var detect = __webpack_require__(2)
	var touchAction = detect.touchAction
	var transform = detect.transform
	var has3d = detect.has3d
	var Emitter = __webpack_require__(8)
	var events = __webpack_require__(9)
	var Tween = __webpack_require__(15)
	var raf = __webpack_require__(19)
	var throttle = __webpack_require__(20)
	var Handlebar = __webpack_require__(21)
	var max = Math.max
	var min = Math.min
	var now = Date.now
	
	var defineProperty = Object.defineProperty
	
	/**
	 * Create custom event
	 *
	 * @param {String} name
	 * @return {Event}
	 * @api private
	 */
	function customEvent(name) {
	  var e
	  try {
	    e = new CustomEvent(name)
	  } catch (error) {
	    try {
	      e = document.createEvent('CustomEvent')
	      e.initCustomEvent(name, false, false, 0)
	    } catch (err) {
	      return
	    }
	  }
	  return e
	}
	
	/**
	 * Init iscroll with el and optional options
	 * options.handlebar show handlebar if is true
	 *
	 * @param  {Element}  el
	 * @param {Object} opts
	 * @api public
	 */
	function Iscroll(el, opts) {
	  if (!(this instanceof Iscroll)) return new Iscroll(el, opts)
	  this.y = 0
	  this.scrollable = el
	  el.style.overflow = 'hidden'
	  var children = el.children
	  if (children.length !== 1) {
	    throw new Error('iscroll need single element child of scrollable to work')
	  }
	  this.el = children[0]
	  this.touchAction('none')
	  this.refresh()
	  this.bind()
	  var self = this
	  if (defineProperty) {
	    defineProperty(this.scrollable, 'scrollTop', {
	      set: function(v) {
	        return self.scrollTo(-v, 400)
	      },
	      get: function() {
	        return -self.y
	      }
	    })
	  }
	  this.on('scroll', function() {
	    var e = customEvent('scroll')
	    if (e) el.dispatchEvent(e)
	  })
	  opts = opts || {}
	  this.max = opts.max || 80
	  if (opts.handlebar) {
	    this.handlebar = new Handlebar(el)
	  }
	  this._refresh = this.refresh.bind(this)
	  window.addEventListener('orientationchange', this._refresh, false)
	  window.addEventListener('resize', this._refresh, false)
	}
	
	Emitter(Iscroll.prototype)
	
	/**
	 * Bind events
	 *
	 * @api private
	 */
	Iscroll.prototype.bind = function() {
	  this.events = events(this.scrollable, this)
	  this.docEvents = events(document, this)
	
	  // W3C touch events
	  this.events.bind('touchstart')
	  this.events.bind('touchmove')
	  this.events.bind('touchleave', 'ontouchend')
	  this.docEvents.bind('touchend')
	  this.docEvents.bind('touchcancel', 'ontouchend')
	}
	
	/**
	 * Recalculate the height
	 *
	 * @api public
	 */
	Iscroll.prototype.refresh = function() {
	  this.viewHeight = this.scrollable.getBoundingClientRect().height
	  this.height = this.el.getBoundingClientRect().height
	  this.minY = min(0, this.viewHeight - this.height)
	  if (this.y < this.minY) {
	    this.scrollTo(this.minY, 200)
	  }
	}
	
	/**
	 * Unbind all event listeners, and remove handlebar if necessary
	 *
	 * @api public
	 */
	Iscroll.prototype.unbind = function() {
	  this.off()
	  this.events.unbind()
	  this.docEvents.unbind()
	  window.removeEventListener('orientationchange', this._refresh, false)
	  window.removeEventListener('resize', this._refresh, false)
	  if (this.handlebar) this.scrollable.removeChild(this.handlebar.el)
	}
	
	
	/**
	 * touchstart event handler
	 *
	 * @param  {Event}  e
	 * @api private
	 */
	Iscroll.prototype.ontouchstart = function(e) {
	  this.speed = null
	  if (this.tween) this.tween.stop()
	  this.refresh()
	  var start = this.y
	  if (e.target === this.scrollable) {
	    start = min(start, 0)
	    start = max(start, this.minY)
	      // fix the invalid start position
	    if (start !== this.y) return this.scrollTo(start, 200)
	    return
	  }
	
	  var touch = this.getTouch(e)
	  var sx = touch.clientX
	  var sy = touch.clientY
	  var at = now()
	
	
	  this.onstart = function(x, y) {
	    // no moved up and down, so don't know
	    if (sy === y) return
	    this.onstart = null
	    var dx = Math.abs(x - sx)
	    var dy = Math.abs(y - sy)
	      // move left and right
	    if (dx > dy) return
	    this.clientY = touch.clientY
	    this.dy = 0
	    this.ts = now()
	    this.down = {
	      x: sx,
	      y: sy,
	      start: start,
	      at: at
	    }
	    if (this.handlebar) this.resizeHandlebar()
	    this.emit('start', this.y)
	    return true
	  }
	}
	
	/**
	 * touchmove event handler
	 *
	 * @param  {Event}  e
	 * @api private
	 */
	Iscroll.prototype.ontouchmove = function(e) {
	  e.preventDefault()
	  if (!this.down && !this.onstart) return
	  var touch = this.getTouch(e)
	  var x = touch.clientX
	  var y = touch.clientY
	  if (this.onstart) {
	    var started = this.onstart(x, y)
	    if (started !== true) return
	  }
	  var down = this.down
	  var dy = this.dy = y - down.y
	
	  //calculate speed every 100 milisecond
	  this.calcuteSpeed(touch.clientY, down.at)
	  var start = this.down.start
	  var dest = start + dy
	  dest = min(dest, this.max)
	  dest = max(dest, this.minY - this.max)
	  this.translate(dest)
	}
	
	/**
	 * Calcute speed by clientY
	 *
	 * @param {Number} y
	 * @api priavte
	 */
	Iscroll.prototype.calcuteSpeed = function(y, start) {
	  var ts = now()
	  var dt = ts - this.ts
	  if (ts - start < 100) {
	    this.distance = y - this.clientY
	    this.speed = Math.abs(this.distance / dt)
	  } else if (dt > 100) {
	    this.distance = y - this.clientY
	    this.speed = Math.abs(this.distance / dt)
	    this.ts = ts
	    this.clientY = y
	  }
	}
	
	/**
	 * Event handler for touchend
	 *
	 * @param  {Event}  e
	 * @api private
	 */
	Iscroll.prototype.ontouchend = function(e) {
	  if (!this.down) return
	  var at = this.down.at
	  this.down = null
	  var touch = this.getTouch(e)
	  this.calcuteSpeed(touch.clientY, at)
	  var m = this.momentum()
	  this.scrollTo(m.dest, m.duration, m.ease)
	  this.emit('release', this.y)
	}
	
	/**
	 * Calculate the animate props for moveon
	 *
	 * @return {Object}
	 * @api private
	 */
	Iscroll.prototype.momentum = function() {
	  var deceleration = 0.0008
	  var speed = this.speed
	  speed = min(speed, 0.6)
	  var y = this.y
	  var destination = y + (speed * speed) / (2 * deceleration) * (this.distance < 0 ? -1 : 1)
	  var duration = speed / deceleration
	  var ease
	  var minY = this.minY
	  if (y > 0 || y < minY) {
	    duration = 300
	    ease = 'out-circ'
	    destination = y > 0 ? 0 : minY
	  } else if (destination > 0) {
	    destination = 0
	    ease = 'out-back'
	  } else if (destination < minY) {
	    destination = minY
	    ease = 'out-back'
	  }
	  return {
	    dest: destination,
	    duration: duration,
	    ease: ease
	  }
	}
	
	
	/**
	 * Scroll to potions y with optional duration and ease function
	 *
	 * @param {Number} y
	 * @param {Number} duration
	 * @param {String} easing
	 * @api public
	 */
	Iscroll.prototype.scrollTo = function(y, duration, easing) {
	  if (this.tween) this.tween.stop()
	  var transition = (duration > 0 && y !== this.y)
	  if (!transition) {
	    this.translate(y)
	    return this.onScrollEnd()
	  }
	
	  easing = easing || 'out-cube'
	  var tween = this.tween = Tween({
	      y: this.y
	    })
	    .ease(easing)
	    .to({
	      y: y
	    })
	    .duration(duration)
	
	  var self = this
	  tween.update(function(o) {
	    self.translate(o.y)
	  })
	  var promise = new Promise(function(resolve) {
	    tween.on('end', function() {
	      resolve()
	      animate = function() {} // eslint-disable-line
	      if (!tween.stopped) {
	        self.onScrollEnd()
	      }
	    })
	  })
	
	  function animate() {
	    raf(animate)
	    tween.update()
	  }
	
	  animate()
	  return promise
	}
	
	/**
	 * Scrollend
	 *
	 * @api private
	 */
	Iscroll.prototype.onScrollEnd = function() {
	  this.hideHandlebar()
	  var y = this.y
	  this.emit('scrollend', {
	    top: y >= 0,
	    bottom: y <= this.minY
	  })
	}
	
	/**
	 * Gets the appropriate "touch" object for the `e` event. The event may be from
	 * a "mouse", "touch", or "Pointer" event, so the normalization happens here.
	 *
	 * @api private
	 */
	
	Iscroll.prototype.getTouch = function(e) {
	  // "mouse" and "Pointer" events just use the event object itself
	  var touch = e
	  if (e.changedTouches && e.changedTouches.length > 0) {
	    // W3C "touch" events use the `changedTouches` array
	    touch = e.changedTouches[0]
	  }
	  return touch
	}
	
	
	/**
	 * Translate to `x`.
	 *
	 *
	 * @api private
	 */
	
	Iscroll.prototype.translate = function(y) {
	  var s = this.el.style
	  if (isNaN(y)) return
	  y = Math.floor(y)
	    //reach the end
	  if (this.y !== y) {
	    this.y = y
	    this.emit('scroll', -y)
	    if (this.handlebar) this.transformHandlebar()
	  }
	  if (has3d) {
	    s[transform] = 'translate3d(0, ' + y + 'px' + ', 0)'
	  } else {
	    s[transform] = 'translateY(' + y + 'px)'
	  }
	}
	
	/**
	 * Sets the "touchAction" CSS style property to `value`.
	 *
	 * @api private
	 */
	
	Iscroll.prototype.touchAction = function(value) {
	  var s = this.el.style
	  if (touchAction) {
	    s[touchAction] = value
	  }
	}
	
	/**
	 * Transform handlebar
	 *
	 * @api private
	 */
	Iscroll.prototype.transformHandlebar = throttle(function() {
	  var vh = this.viewHeight
	  var h = this.height
	  var y = Math.round(-(vh - vh * vh / h) * this.y / (h - vh))
	  this.handlebar.translateY(y)
	}, 100)
	
	/**
	 * show the handlebar and size it
	 * @api public
	 */
	Iscroll.prototype.resizeHandlebar = function() {
	  var vh = this.viewHeight
	  var h = vh * vh / this.height
	  this.handlebar.resize(h)
	}
	
	/**
	 * Hide handlebar
	 *
	 * @api private
	 */
	Iscroll.prototype.hideHandlebar = function() {
	  if (this.handlebar) this.handlebar.hide()
	}
	
	module.exports = Iscroll


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	exports.transition = __webpack_require__(3)
	
	exports.transform = __webpack_require__(4)
	
	exports.touchAction = __webpack_require__(5)
	
	exports.transitionend = __webpack_require__(6)
	
	exports.has3d = __webpack_require__(7)


/***/ },
/* 3 */
/***/ function(module, exports) {

	var styles = [
	  'webkitTransition',
	  'MozTransition',
	  'OTransition',
	  'msTransition',
	  'transition'
	]
	
	var el = document.createElement('p')
	var style
	
	for (var i = 0; i < styles.length; i++) {
	  if (null != el.style[styles[i]]) {
	    style = styles[i]
	    break
	  }
	}
	el = null
	
	module.exports = style


/***/ },
/* 4 */
/***/ function(module, exports) {

	
	var styles = [
	  'webkitTransform',
	  'MozTransform',
	  'msTransform',
	  'OTransform',
	  'transform'
	];
	
	var el = document.createElement('p');
	var style;
	
	for (var i = 0; i < styles.length; i++) {
	  style = styles[i];
	  if (null != el.style[style]) {
	    module.exports = style;
	    break;
	  }
	}


/***/ },
/* 5 */
/***/ function(module, exports) {

	
	/**
	 * Module exports.
	 */
	
	module.exports = touchActionProperty();
	
	/**
	 * Returns "touchAction", "msTouchAction", or null.
	 */
	
	function touchActionProperty(doc) {
	  if (!doc) doc = document;
	  var div = doc.createElement('div');
	  var prop = null;
	  if ('touchAction' in div.style) prop = 'touchAction';
	  else if ('msTouchAction' in div.style) prop = 'msTouchAction';
	  div = null;
	  return prop;
	}


/***/ },
/* 6 */
/***/ function(module, exports) {

	/**
	 * Transition-end mapping
	 */
	
	var map = {
	  'WebkitTransition' : 'webkitTransitionEnd',
	  'MozTransition' : 'transitionend',
	  'OTransition' : 'oTransitionEnd',
	  'msTransition' : 'MSTransitionEnd',
	  'transition' : 'transitionend'
	};
	
	/**
	 * Expose `transitionend`
	 */
	
	var el = document.createElement('p');
	
	for (var transition in map) {
	  if (null != el.style[transition]) {
	    module.exports = map[transition];
	    break;
	  }
	}


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	
	var prop = __webpack_require__(4);
	
	// IE <=8 doesn't have `getComputedStyle`
	if (!prop || !window.getComputedStyle) {
	  module.exports = false;
	
	} else {
	  var map = {
	    webkitTransform: '-webkit-transform',
	    OTransform: '-o-transform',
	    msTransform: '-ms-transform',
	    MozTransform: '-moz-transform',
	    transform: 'transform'
	  };
	
	  // from: https://gist.github.com/lorenzopolidori/3794226
	  var el = document.createElement('div');
	  el.style[prop] = 'translate3d(1px,1px,1px)';
	  document.body.insertBefore(el, null);
	  var val = getComputedStyle(el).getPropertyValue(map[prop]);
	  document.body.removeChild(el);
	  module.exports = null != val && val.length && 'none' != val;
	}


/***/ },
/* 8 */
/***/ function(module, exports) {

	
	/**
	 * Expose `Emitter`.
	 */
	
	module.exports = Emitter;
	
	/**
	 * Initialize a new `Emitter`.
	 *
	 * @api public
	 */
	
	function Emitter(obj) {
	  if (obj) return mixin(obj);
	};
	
	/**
	 * Mixin the emitter properties.
	 *
	 * @param {Object} obj
	 * @return {Object}
	 * @api private
	 */
	
	function mixin(obj) {
	  for (var key in Emitter.prototype) {
	    obj[key] = Emitter.prototype[key];
	  }
	  return obj;
	}
	
	/**
	 * Listen on the given `event` with `fn`.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */
	
	Emitter.prototype.on =
	Emitter.prototype.addEventListener = function(event, fn){
	  this._callbacks = this._callbacks || {};
	  (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
	    .push(fn);
	  return this;
	};
	
	/**
	 * Adds an `event` listener that will be invoked a single
	 * time then automatically removed.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */
	
	Emitter.prototype.once = function(event, fn){
	  function on() {
	    this.off(event, on);
	    fn.apply(this, arguments);
	  }
	
	  on.fn = fn;
	  this.on(event, on);
	  return this;
	};
	
	/**
	 * Remove the given callback for `event` or all
	 * registered callbacks.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */
	
	Emitter.prototype.off =
	Emitter.prototype.removeListener =
	Emitter.prototype.removeAllListeners =
	Emitter.prototype.removeEventListener = function(event, fn){
	  this._callbacks = this._callbacks || {};
	
	  // all
	  if (0 == arguments.length) {
	    this._callbacks = {};
	    return this;
	  }
	
	  // specific event
	  var callbacks = this._callbacks['$' + event];
	  if (!callbacks) return this;
	
	  // remove all handlers
	  if (1 == arguments.length) {
	    delete this._callbacks['$' + event];
	    return this;
	  }
	
	  // remove specific handler
	  var cb;
	  for (var i = 0; i < callbacks.length; i++) {
	    cb = callbacks[i];
	    if (cb === fn || cb.fn === fn) {
	      callbacks.splice(i, 1);
	      break;
	    }
	  }
	  return this;
	};
	
	/**
	 * Emit `event` with the given args.
	 *
	 * @param {String} event
	 * @param {Mixed} ...
	 * @return {Emitter}
	 */
	
	Emitter.prototype.emit = function(event){
	  this._callbacks = this._callbacks || {};
	  var args = [].slice.call(arguments, 1)
	    , callbacks = this._callbacks['$' + event];
	
	  if (callbacks) {
	    callbacks = callbacks.slice(0);
	    for (var i = 0, len = callbacks.length; i < len; ++i) {
	      callbacks[i].apply(this, args);
	    }
	  }
	
	  return this;
	};
	
	/**
	 * Return array of callbacks for `event`.
	 *
	 * @param {String} event
	 * @return {Array}
	 * @api public
	 */
	
	Emitter.prototype.listeners = function(event){
	  this._callbacks = this._callbacks || {};
	  return this._callbacks['$' + event] || [];
	};
	
	/**
	 * Check if this emitter has `event` handlers.
	 *
	 * @param {String} event
	 * @return {Boolean}
	 * @api public
	 */
	
	Emitter.prototype.hasListeners = function(event){
	  return !! this.listeners(event).length;
	};


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * Module dependencies.
	 */
	
	try {
	  var events = __webpack_require__(10);
	} catch(err) {
	  var events = __webpack_require__(10);
	}
	
	try {
	  var delegate = __webpack_require__(11);
	} catch(err) {
	  var delegate = __webpack_require__(11);
	}
	
	/**
	 * Expose `Events`.
	 */
	
	module.exports = Events;
	
	/**
	 * Initialize an `Events` with the given
	 * `el` object which events will be bound to,
	 * and the `obj` which will receive method calls.
	 *
	 * @param {Object} el
	 * @param {Object} obj
	 * @api public
	 */
	
	function Events(el, obj) {
	  if (!(this instanceof Events)) return new Events(el, obj);
	  if (!el) throw new Error('element required');
	  if (!obj) throw new Error('object required');
	  this.el = el;
	  this.obj = obj;
	  this._events = {};
	}
	
	/**
	 * Subscription helper.
	 */
	
	Events.prototype.sub = function(event, method, cb){
	  this._events[event] = this._events[event] || {};
	  this._events[event][method] = cb;
	};
	
	/**
	 * Bind to `event` with optional `method` name.
	 * When `method` is undefined it becomes `event`
	 * with the "on" prefix.
	 *
	 * Examples:
	 *
	 *  Direct event handling:
	 *
	 *    events.bind('click') // implies "onclick"
	 *    events.bind('click', 'remove')
	 *    events.bind('click', 'sort', 'asc')
	 *
	 *  Delegated event handling:
	 *
	 *    events.bind('click li > a')
	 *    events.bind('click li > a', 'remove')
	 *    events.bind('click a.sort-ascending', 'sort', 'asc')
	 *    events.bind('click a.sort-descending', 'sort', 'desc')
	 *
	 * @param {String} event
	 * @param {String|function} [method]
	 * @return {Function} callback
	 * @api public
	 */
	
	Events.prototype.bind = function(event, method){
	  var e = parse(event);
	  var el = this.el;
	  var obj = this.obj;
	  var name = e.name;
	  var method = method || 'on' + name;
	  var args = [].slice.call(arguments, 2);
	
	  // callback
	  function cb(){
	    var a = [].slice.call(arguments).concat(args);
	    obj[method].apply(obj, a);
	  }
	
	  // bind
	  if (e.selector) {
	    cb = delegate.bind(el, e.selector, name, cb);
	  } else {
	    events.bind(el, name, cb);
	  }
	
	  // subscription for unbinding
	  this.sub(name, method, cb);
	
	  return cb;
	};
	
	/**
	 * Unbind a single binding, all bindings for `event`,
	 * or all bindings within the manager.
	 *
	 * Examples:
	 *
	 *  Unbind direct handlers:
	 *
	 *     events.unbind('click', 'remove')
	 *     events.unbind('click')
	 *     events.unbind()
	 *
	 * Unbind delegate handlers:
	 *
	 *     events.unbind('click', 'remove')
	 *     events.unbind('click')
	 *     events.unbind()
	 *
	 * @param {String|Function} [event]
	 * @param {String|Function} [method]
	 * @api public
	 */
	
	Events.prototype.unbind = function(event, method){
	  if (0 == arguments.length) return this.unbindAll();
	  if (1 == arguments.length) return this.unbindAllOf(event);
	
	  // no bindings for this event
	  var bindings = this._events[event];
	  if (!bindings) return;
	
	  // no bindings for this method
	  var cb = bindings[method];
	  if (!cb) return;
	
	  events.unbind(this.el, event, cb);
	};
	
	/**
	 * Unbind all events.
	 *
	 * @api private
	 */
	
	Events.prototype.unbindAll = function(){
	  for (var event in this._events) {
	    this.unbindAllOf(event);
	  }
	};
	
	/**
	 * Unbind all events for `event`.
	 *
	 * @param {String} event
	 * @api private
	 */
	
	Events.prototype.unbindAllOf = function(event){
	  var bindings = this._events[event];
	  if (!bindings) return;
	
	  for (var method in bindings) {
	    this.unbind(event, method);
	  }
	};
	
	/**
	 * Parse `event`.
	 *
	 * @param {String} event
	 * @return {Object}
	 * @api private
	 */
	
	function parse(event) {
	  var parts = event.split(/ +/);
	  return {
	    name: parts.shift(),
	    selector: parts.join(' ')
	  }
	}


/***/ },
/* 10 */
/***/ function(module, exports) {

	var bind = window.addEventListener ? 'addEventListener' : 'attachEvent',
	    unbind = window.removeEventListener ? 'removeEventListener' : 'detachEvent',
	    prefix = bind !== 'addEventListener' ? 'on' : '';
	
	/**
	 * Bind `el` event `type` to `fn`.
	 *
	 * @param {Element} el
	 * @param {String} type
	 * @param {Function} fn
	 * @param {Boolean} capture
	 * @return {Function}
	 * @api public
	 */
	
	exports.bind = function(el, type, fn, capture){
	  el[bind](prefix + type, fn, capture || false);
	  return fn;
	};
	
	/**
	 * Unbind `el` event `type`'s callback `fn`.
	 *
	 * @param {Element} el
	 * @param {String} type
	 * @param {Function} fn
	 * @param {Boolean} capture
	 * @return {Function}
	 * @api public
	 */
	
	exports.unbind = function(el, type, fn, capture){
	  el[unbind](prefix + type, fn, capture || false);
	  return fn;
	};

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Module dependencies.
	 */
	
	try {
	  var closest = __webpack_require__(12);
	} catch(err) {
	  var closest = __webpack_require__(12);
	}
	
	try {
	  var event = __webpack_require__(10);
	} catch(err) {
	  var event = __webpack_require__(10);
	}
	
	/**
	 * Delegate event `type` to `selector`
	 * and invoke `fn(e)`. A callback function
	 * is returned which may be passed to `.unbind()`.
	 *
	 * @param {Element} el
	 * @param {String} selector
	 * @param {String} type
	 * @param {Function} fn
	 * @param {Boolean} capture
	 * @return {Function}
	 * @api public
	 */
	
	exports.bind = function(el, selector, type, fn, capture){
	  return event.bind(el, type, function(e){
	    var target = e.target || e.srcElement;
	    e.delegateTarget = closest(target, selector, true, el);
	    if (e.delegateTarget) fn.call(el, e);
	  }, capture);
	};
	
	/**
	 * Unbind event `type`'s callback `fn`.
	 *
	 * @param {Element} el
	 * @param {String} type
	 * @param {Function} fn
	 * @param {Boolean} capture
	 * @api public
	 */
	
	exports.unbind = function(el, type, fn, capture){
	  event.unbind(el, type, fn, capture);
	};


/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Module Dependencies
	 */
	
	var matches = __webpack_require__(13)
	
	/**
	 * Export `closest`
	 */
	
	module.exports = closest
	
	/**
	 * Closest
	 *
	 * @param {Element} el
	 * @param {String} selector
	 * @param {Element} scope (optional)
	 */
	
	function closest (el, selector, scope) {
	  scope = scope || document.documentElement;
	
	  // walk up the dom
	  while (el && el !== scope) {
	    if (matches(el, selector)) return el;
	    el = el.parentNode;
	  }
	
	  // check scope for match
	  return matches(el, selector) ? el : null;
	}


/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Module dependencies.
	 */
	
	var query = __webpack_require__(14);
	
	/**
	 * Element prototype.
	 */
	
	var proto = Element.prototype;
	
	/**
	 * Vendor function.
	 */
	
	var vendor = proto.matches
	  || proto.webkitMatchesSelector
	  || proto.mozMatchesSelector
	  || proto.msMatchesSelector
	  || proto.oMatchesSelector;
	
	/**
	 * Expose `match()`.
	 */
	
	module.exports = match;
	
	/**
	 * Match `el` to `selector`.
	 *
	 * @param {Element} el
	 * @param {String} selector
	 * @return {Boolean}
	 * @api public
	 */
	
	function match(el, selector) {
	  if (!el || el.nodeType !== 1) return false;
	  if (vendor) return vendor.call(el, selector);
	  var nodes = query.all(selector, el.parentNode);
	  for (var i = 0; i < nodes.length; ++i) {
	    if (nodes[i] == el) return true;
	  }
	  return false;
	}


/***/ },
/* 14 */
/***/ function(module, exports) {

	function one(selector, el) {
	  return el.querySelector(selector);
	}
	
	exports = module.exports = function(selector, el){
	  el = el || document;
	  return one(selector, el);
	};
	
	exports.all = function(selector, el){
	  el = el || document;
	  return el.querySelectorAll(selector);
	};
	
	exports.engine = function(obj){
	  if (!obj.one) throw new Error('.one callback required');
	  if (!obj.all) throw new Error('.all callback required');
	  one = obj.one;
	  exports.all = obj.all;
	  return exports;
	};


/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * Module dependencies.
	 */
	
	var Emitter = __webpack_require__(8);
	var clone = __webpack_require__(16);
	var type = __webpack_require__(17);
	var ease = __webpack_require__(18);
	
	/**
	 * Expose `Tween`.
	 */
	
	module.exports = Tween;
	
	/**
	 * Initialize a new `Tween` with `obj`.
	 *
	 * @param {Object|Array} obj
	 * @api public
	 */
	
	function Tween(obj) {
	  if (!(this instanceof Tween)) return new Tween(obj);
	  this._from = obj;
	  this.ease('linear');
	  this.duration(500);
	}
	
	/**
	 * Mixin emitter.
	 */
	
	Emitter(Tween.prototype);
	
	/**
	 * Reset the tween.
	 *
	 * @api public
	 */
	
	Tween.prototype.reset = function(){
	  this.isArray = 'array' === type(this._from);
	  this._curr = clone(this._from);
	  this._done = false;
	  this._start = Date.now();
	  return this;
	};
	
	/**
	 * Tween to `obj` and reset internal state.
	 *
	 *    tween.to({ x: 50, y: 100 })
	 *
	 * @param {Object|Array} obj
	 * @return {Tween} self
	 * @api public
	 */
	
	Tween.prototype.to = function(obj){
	  this.reset();
	  this._to = obj;
	  return this;
	};
	
	/**
	 * Set duration to `ms` [500].
	 *
	 * @param {Number} ms
	 * @return {Tween} self
	 * @api public
	 */
	
	Tween.prototype.duration = function(ms){
	  this._duration = ms;
	  return this;
	};
	
	/**
	 * Set easing function to `fn`.
	 *
	 *    tween.ease('in-out-sine')
	 *
	 * @param {String|Function} fn
	 * @return {Tween}
	 * @api public
	 */
	
	Tween.prototype.ease = function(fn){
	  fn = 'function' == typeof fn ? fn : ease[fn];
	  if (!fn) throw new TypeError('invalid easing function');
	  this._ease = fn;
	  return this;
	};
	
	/**
	 * Stop the tween and immediately emit "stop" and "end".
	 *
	 * @return {Tween}
	 * @api public
	 */
	
	Tween.prototype.stop = function(){
	  this.stopped = true;
	  this._done = true;
	  this.emit('stop');
	  this.emit('end');
	  return this;
	};
	
	/**
	 * Perform a step.
	 *
	 * @return {Tween} self
	 * @api private
	 */
	
	Tween.prototype.step = function(){
	  if (this._done) return;
	
	  // duration
	  var duration = this._duration;
	  var now = Date.now();
	  var delta = now - this._start;
	  var done = delta >= duration;
	
	  // complete
	  if (done) {
	    this._from = this._to;
	    this._update(this._to);
	    this._done = true;
	    this.emit('end');
	    return this;
	  }
	
	  // tween
	  var from = this._from;
	  var to = this._to;
	  var curr = this._curr;
	  var fn = this._ease;
	  var p = (now - this._start) / duration;
	  var n = fn(p);
	
	  // array
	  if (this.isArray) {
	    for (var i = 0; i < from.length; ++i) {
	      curr[i] = from[i] + (to[i] - from[i]) * n;
	    }
	
	    this._update(curr);
	    return this;
	  }
	
	  // objech
	  for (var k in from) {
	    curr[k] = from[k] + (to[k] - from[k]) * n;
	  }
	
	  this._update(curr);
	  return this;
	};
	
	/**
	 * Set update function to `fn` or
	 * when no argument is given this performs
	 * a "step".
	 *
	 * @param {Function} fn
	 * @return {Tween} self
	 * @api public
	 */
	
	Tween.prototype.update = function(fn){
	  if (0 == arguments.length) return this.step();
	  this._update = fn;
	  return this;
	};

/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Module dependencies.
	 */
	
	var type;
	try {
	  type = __webpack_require__(17);
	} catch (_) {
	  type = __webpack_require__(17);
	}
	
	/**
	 * Module exports.
	 */
	
	module.exports = clone;
	
	/**
	 * Clones objects.
	 *
	 * @param {Mixed} any object
	 * @api public
	 */
	
	function clone(obj){
	  switch (type(obj)) {
	    case 'object':
	      var copy = {};
	      for (var key in obj) {
	        if (obj.hasOwnProperty(key)) {
	          copy[key] = clone(obj[key]);
	        }
	      }
	      return copy;
	
	    case 'array':
	      var copy = new Array(obj.length);
	      for (var i = 0, l = obj.length; i < l; i++) {
	        copy[i] = clone(obj[i]);
	      }
	      return copy;
	
	    case 'regexp':
	      // from millermedeiros/amd-utils - MIT
	      var flags = '';
	      flags += obj.multiline ? 'm' : '';
	      flags += obj.global ? 'g' : '';
	      flags += obj.ignoreCase ? 'i' : '';
	      return new RegExp(obj.source, flags);
	
	    case 'date':
	      return new Date(obj.getTime());
	
	    default: // string, number, boolean, …
	      return obj;
	  }
	}


/***/ },
/* 17 */
/***/ function(module, exports) {

	/**
	 * toString ref.
	 */
	
	var toString = Object.prototype.toString;
	
	/**
	 * Return the type of `val`.
	 *
	 * @param {Mixed} val
	 * @return {String}
	 * @api public
	 */
	
	module.exports = function(val){
	  switch (toString.call(val)) {
	    case '[object Date]': return 'date';
	    case '[object RegExp]': return 'regexp';
	    case '[object Arguments]': return 'arguments';
	    case '[object Array]': return 'array';
	    case '[object Error]': return 'error';
	  }
	
	  if (val === null) return 'null';
	  if (val === undefined) return 'undefined';
	  if (val !== val) return 'nan';
	  if (val && val.nodeType === 1) return 'element';
	
	  val = val.valueOf
	    ? val.valueOf()
	    : Object.prototype.valueOf.apply(val)
	
	  return typeof val;
	};


/***/ },
/* 18 */
/***/ function(module, exports) {

	
	// easing functions from "Tween.js"
	
	exports.linear = function(n){
	  return n;
	};
	
	exports.inQuad = function(n){
	  return n * n;
	};
	
	exports.outQuad = function(n){
	  return n * (2 - n);
	};
	
	exports.inOutQuad = function(n){
	  n *= 2;
	  if (n < 1) return 0.5 * n * n;
	  return - 0.5 * (--n * (n - 2) - 1);
	};
	
	exports.inCube = function(n){
	  return n * n * n;
	};
	
	exports.outCube = function(n){
	  return --n * n * n + 1;
	};
	
	exports.inOutCube = function(n){
	  n *= 2;
	  if (n < 1) return 0.5 * n * n * n;
	  return 0.5 * ((n -= 2 ) * n * n + 2);
	};
	
	exports.inQuart = function(n){
	  return n * n * n * n;
	};
	
	exports.outQuart = function(n){
	  return 1 - (--n * n * n * n);
	};
	
	exports.inOutQuart = function(n){
	  n *= 2;
	  if (n < 1) return 0.5 * n * n * n * n;
	  return -0.5 * ((n -= 2) * n * n * n - 2);
	};
	
	exports.inQuint = function(n){
	  return n * n * n * n * n;
	}
	
	exports.outQuint = function(n){
	  return --n * n * n * n * n + 1;
	}
	
	exports.inOutQuint = function(n){
	  n *= 2;
	  if (n < 1) return 0.5 * n * n * n * n * n;
	  return 0.5 * ((n -= 2) * n * n * n * n + 2);
	};
	
	exports.inSine = function(n){
	  return 1 - Math.cos(n * Math.PI / 2 );
	};
	
	exports.outSine = function(n){
	  return Math.sin(n * Math.PI / 2);
	};
	
	exports.inOutSine = function(n){
	  return .5 * (1 - Math.cos(Math.PI * n));
	};
	
	exports.inExpo = function(n){
	  return 0 == n ? 0 : Math.pow(1024, n - 1);
	};
	
	exports.outExpo = function(n){
	  return 1 == n ? n : 1 - Math.pow(2, -10 * n);
	};
	
	exports.inOutExpo = function(n){
	  if (0 == n) return 0;
	  if (1 == n) return 1;
	  if ((n *= 2) < 1) return .5 * Math.pow(1024, n - 1);
	  return .5 * (-Math.pow(2, -10 * (n - 1)) + 2);
	};
	
	exports.inCirc = function(n){
	  return 1 - Math.sqrt(1 - n * n);
	};
	
	exports.outCirc = function(n){
	  return Math.sqrt(1 - (--n * n));
	};
	
	exports.inOutCirc = function(n){
	  n *= 2
	  if (n < 1) return -0.5 * (Math.sqrt(1 - n * n) - 1);
	  return 0.5 * (Math.sqrt(1 - (n -= 2) * n) + 1);
	};
	
	exports.inBack = function(n){
	  var s = 1.70158;
	  return n * n * (( s + 1 ) * n - s);
	};
	
	exports.outBack = function(n){
	  var s = 1.70158;
	  return --n * n * ((s + 1) * n + s) + 1;
	};
	
	exports.inOutBack = function(n){
	  var s = 1.70158 * 1.525;
	  if ( ( n *= 2 ) < 1 ) return 0.5 * ( n * n * ( ( s + 1 ) * n - s ) );
	  return 0.5 * ( ( n -= 2 ) * n * ( ( s + 1 ) * n + s ) + 2 );
	};
	
	exports.inBounce = function(n){
	  return 1 - exports.outBounce(1 - n);
	};
	
	exports.outBounce = function(n){
	  if ( n < ( 1 / 2.75 ) ) {
	    return 7.5625 * n * n;
	  } else if ( n < ( 2 / 2.75 ) ) {
	    return 7.5625 * ( n -= ( 1.5 / 2.75 ) ) * n + 0.75;
	  } else if ( n < ( 2.5 / 2.75 ) ) {
	    return 7.5625 * ( n -= ( 2.25 / 2.75 ) ) * n + 0.9375;
	  } else {
	    return 7.5625 * ( n -= ( 2.625 / 2.75 ) ) * n + 0.984375;
	  }
	};
	
	exports.inOutBounce = function(n){
	  if (n < .5) return exports.inBounce(n * 2) * .5;
	  return exports.outBounce(n * 2 - 1) * .5 + .5;
	};
	
	// aliases
	
	exports['in-quad'] = exports.inQuad;
	exports['out-quad'] = exports.outQuad;
	exports['in-out-quad'] = exports.inOutQuad;
	exports['in-cube'] = exports.inCube;
	exports['out-cube'] = exports.outCube;
	exports['in-out-cube'] = exports.inOutCube;
	exports['in-quart'] = exports.inQuart;
	exports['out-quart'] = exports.outQuart;
	exports['in-out-quart'] = exports.inOutQuart;
	exports['in-quint'] = exports.inQuint;
	exports['out-quint'] = exports.outQuint;
	exports['in-out-quint'] = exports.inOutQuint;
	exports['in-sine'] = exports.inSine;
	exports['out-sine'] = exports.outSine;
	exports['in-out-sine'] = exports.inOutSine;
	exports['in-expo'] = exports.inExpo;
	exports['out-expo'] = exports.outExpo;
	exports['in-out-expo'] = exports.inOutExpo;
	exports['in-circ'] = exports.inCirc;
	exports['out-circ'] = exports.outCirc;
	exports['in-out-circ'] = exports.inOutCirc;
	exports['in-back'] = exports.inBack;
	exports['out-back'] = exports.outBack;
	exports['in-out-back'] = exports.inOutBack;
	exports['in-bounce'] = exports.inBounce;
	exports['out-bounce'] = exports.outBounce;
	exports['in-out-bounce'] = exports.inOutBounce;


/***/ },
/* 19 */
/***/ function(module, exports) {

	/**
	 * Expose `requestAnimationFrame()`.
	 */
	
	exports = module.exports = window.requestAnimationFrame
	  || window.webkitRequestAnimationFrame
	  || window.mozRequestAnimationFrame
	  || fallback;
	
	/**
	 * Fallback implementation.
	 */
	
	var prev = new Date().getTime();
	function fallback(fn) {
	  var curr = new Date().getTime();
	  var ms = Math.max(0, 16 - (curr - prev));
	  var req = setTimeout(fn, ms);
	  prev = curr;
	  return req;
	}
	
	/**
	 * Cancel.
	 */
	
	var cancel = window.cancelAnimationFrame
	  || window.webkitCancelAnimationFrame
	  || window.mozCancelAnimationFrame
	  || window.clearTimeout;
	
	exports.cancel = function(id){
	  cancel.call(window, id);
	};


/***/ },
/* 20 */
/***/ function(module, exports) {

	module.exports = throttle;
	
	/**
	 * Returns a new function that, when invoked, invokes `func` at most once per `wait` milliseconds.
	 *
	 * @param {Function} func Function to wrap.
	 * @param {Number} wait Number of milliseconds that must elapse between `func` invocations.
	 * @return {Function} A new function that wraps the `func` function passed in.
	 */
	
	function throttle (func, wait) {
	  var ctx, args, rtn, timeoutID; // caching
	  var last = 0;
	
	  return function throttled () {
	    ctx = this;
	    args = arguments;
	    var delta = new Date() - last;
	    if (!timeoutID)
	      if (delta >= wait) call();
	      else timeoutID = setTimeout(call, wait - delta);
	    return rtn;
	  };
	
	  function call () {
	    timeoutID = 0;
	    last = +new Date();
	    rtn = func.apply(ctx, args);
	    ctx = null;
	    args = null;
	  }
	}


/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	var detect = __webpack_require__(2)
	var has3d = detect.has3d
	var transform = detect.transform
	
	/**
	 * Handlebar contructor
	 *
	 * @param {Element} scrollable
	 * @contructor
	 * @api public
	 */
	function handlebar(scrollable) {
	  var el = this.el = document.createElement('div')
	  el.className = 'iscroll-handlebar'
	  scrollable.appendChild(el)
	}
	
	/**
	 * Show the handlebar and resize it
	 *
	 * @param {Number} h
	 * @api public
	 */
	handlebar.prototype.resize = function (h) {
	  var s = this.el.style
	  s.height = h + 'px'
	  s.backgroundColor = 'rgba(0,0,0,0.5)'
	}
	
	/**
	 * Hide this handlebar
	 *
	 * @api public
	 */
	handlebar.prototype.hide = function () {
	  this.el.style.backgroundColor = 'transparent'
	}
	
	/**
	 * Move handlebar by translateY
	 *
	 * @param {Number} y
	 * @api public
	 */
	handlebar.prototype.translateY= function(y){
	  var s = this.el.style
	  if (has3d) {
	    s[transform] = 'translate3d(0, ' + y + 'px' + ', 0)'
	  } else {
	    s[transform] = 'translateY(' + y + 'px)'
	  }
	}
	
	module.exports = handlebar


/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	var event = __webpack_require__(10)
	var raf = __webpack_require__(19)
	var Tween = __webpack_require__(15)
	var detect = __webpack_require__(2)
	var has3d = detect.has3d
	var transform = detect.transform
	var events = __webpack_require__(9)
	var Emitter = __webpack_require__(8)
	var ComputedStyle = __webpack_require__(23)
	
	/**
	 * Hscroll constructor
	 *
	 * @public
	 * @param  {Element}  el
	 * @param {Object} opt
	 */
	function Hscroll(el, opt) {
	  if (!(this instanceof Hscroll)) return new Hscroll(el, opt)
	  this.el = el
	  el.style.overflow = 'hidden'
	  if (el.children.length !== 1) {
	    throw new Error('Hscroll require single child as wrapper')
	  }
	  this.interval = opt.interval || 1000
	  this.duration = opt.duration || 300
	  this.wrapper = this.el.firstElementChild
	  this.type = opt.type || 'normal'
	  // maximun duration in ms for fast swipe
	  this.threshold = opt.threshold || 200
	  // minimum moved distance for fast swipe
	  this.fastThreshold = opt.fastThreshold || 30
	  // transformX
	  this.tx = 0
	  this.bind()
	  this.refresh()
	}
	
	Emitter(Hscroll.prototype)
	
	/**
	 * Bind event handlers.
	 *
	 * @api public
	 */
	
	Hscroll.prototype.bind = function(){
	  this.events = events(this.wrapper, this)
	  this.docEvents = events(document, this)
	
	  // standard mouse click events
	  this.events.bind('mousedown', 'ontouchstart')
	  this.events.bind('mousemove', 'ontouchmove')
	  this.docEvents.bind('mouseup', 'ontouchend')
	
	  // W3C touch events
	  this.events.bind('touchstart')
	  this.events.bind('touchmove')
	  this.docEvents.bind('touchend')
	
	  // MS IE touch events
	  this.events.bind('PointerDown', 'ontouchstart')
	  this.events.bind('PointerMove', 'ontouchmove')
	  this.docEvents.bind('PointerUp', 'ontouchstart')
	  this._refresh = this.refresh.bind(this)
	  event.bind(window, 'orientationchange', this._refresh)
	}
	
	Hscroll.prototype.getTouch = function (e) {
	  // "mouse" and "Pointer" events just use the event object itself
	  var touch = e
	  if (e.touches && e.touches.length > 1) return
	  if (e.changedTouches && e.changedTouches.length > 0) {
	    // W3C "touch" events use the `changedTouches` array
	    touch = e.changedTouches[0]
	  }
	  return touch
	}
	
	/**
	 * Handle touchstart.
	 *
	 * @api private
	 */
	
	Hscroll.prototype.ontouchstart = function(e){
	  if (this.animating) this.tween.stop()
	  var touch = this.getTouch(e)
	  if (!touch) return
	  this.speed = 0
	  var d = Date.now()
	  var sx = touch.pageX
	  var sy = touch.pageY
	  var self = this
	  var tx = this.tx
	  var limit = this.getLimitation()
	  var pad = 20
	  this.down = {
	    x: sx,
	    y: sy,
	    tx: tx,
	    at: d
	  }
	  this.move = function (e, touch) {
	    var cx = touch.pageX
	    var cy = touch.pageY
	    var px = self.previous ? self.previous.x : sx
	    var py = self.previous ? self.previous.y : sy
	    var leftOrRight = Math.abs(cx - px) > Math.abs(cy - py)
	    if (!leftOrRight) return
	    e.preventDefault()
	    e.stopPropagation()
	    self.calcuteSpeed(cx, cy)
	    var tx = self.down.tx + cx - sx
	    tx = tx < limit.min - pad ? limit.min - pad : tx
	    tx = tx > limit.max + pad ? limit.max + pad : tx
	    self.setTransform(tx)
	  }
	}
	
	/**
	 * Handle touchmove.
	 *
	 * @api private
	 */
	
	Hscroll.prototype.ontouchmove = function(e){
	  var touch = this.getTouch(e)
	  if (!touch || this.animating || !this.move) {
	    this.move = null
	    return
	  }
	  this.move(e, touch)
	}
	
	/**
	 * Handle touchend.
	 *
	 * @api private
	 */
	
	Hscroll.prototype.ontouchend = function(e){
	  if (!this.move || !this.down || this.animating) return
	  this.move = null
	  var touch = this.getTouch(e)
	  if (!touch) return
	  e.stopPropagation()
	  var t = Date.now()
	  var x = touch.pageX
	  var y = touch.pageY
	  var dx = Math.abs(x - this.down.x)
	  var dy = Math.abs(y - this.down.y)
	  if (this.type == 'swipe' &&
	      dx > dy && dx > this.fastThreshold &&
	      (t - this.down.at) < this.threshold ) {
	    // fast swipe
	    var dir = x > this.down.x ? 1 : -1
	    this.swipe(dir)
	  } else {
	    if (this.type == 'swipe') {
	      this.reset()
	    } else if (this.speed) {
	      this.momentum()
	    }
	  }
	  this.down = this.previous = null
	}
	
	Hscroll.prototype.momentum = function () {
	  var deceleration = 0.001
	  var speed = this.speed
	  var x = this.tx
	  speed = Math.min(speed, 2)
	  var limit = this.getLimitation()
	  var minX = limit.min
	  var rate = (4 - Math.PI)/2
	  var destination = x + rate*(speed*speed)/(2*deceleration)*this.direction
	  var duration = speed/deceleration
	  var newX
	  var ease = 'out-circ'
	  if (destination > 0) {
	    newX = 0
	    ease = 'out-back'
	  } else if (destination < minX) {
	    newX = minX
	    ease = 'out-back'
	  }
	  if (typeof newX === 'number') {
	    duration = duration*Math.abs((newX - x + 60)/(destination - x))
	    destination = newX
	  }
	  if (x > 0 || x < minX) {
	    duration = 500
	    ease = 'out-circ'
	  }
	  if (this.type == 'fix') {
	    var width = this.itemWidth
	    destination = Math.round(destination/width)*width
	  }
	  return this.animate(destination, duration, ease)
	}
	
	/**
	 * Unbind event handlers.
	 *
	 * @api public
	 */
	
	Hscroll.prototype.unbind = function(){
	  this.events.unbind()
	  this.docEvents.unbind()
	  event.unbind(window, 'orientationchange', this._refresh)
	}
	
	
	/**
	 * Show the previous item/slide, if any.
	 *
	 * @return {Swipe} self
	 * @api public
	 */
	
	Hscroll.prototype.prev = function() {
	  if (this.type == 'swipe') {
	    return this.swipe(1)
	  } else {
	    return this.show(this.curr() - 1)
	  }
	}
	
	/**
	 * Show the next item/slide, if any.
	 *
	 * @return {Swipe} self
	 * @api public
	 */
	
	Hscroll.prototype.next = function(){
	  if (this.type == 'swipe') {
	    return this.swipe(-1)
	  } else {
	    return this.show(this.curr() + 1)
	  }
	}
	
	/**
	 * swipe to previous/next piece
	 *
	 * @public
	 * @param {Number} dir 1 or -1
	 */
	Hscroll.prototype.swipe = function (dir) {
	  var curr = this.curr() - dir
	  curr = Math.max(0, curr)
	  curr = Math.min(this.itemCount - 1, curr)
	  var self = this
	  return this.animate(- curr*this.viewWidth).then(function () {
	    self.emit('show', curr)
	  })
	}
	
	/**
	 * show nth item with scroll and animation
	 *
	 * @public
	 * @param {Number} n
	 * @param {Number} duration
	 * @param {String} ease
	 */
	Hscroll.prototype.show = function (n, duration, ease) {
	  if (this.animating) this.tween.stop()
	  var width = this.type == 'swipe' ? this.viewWidth : this.itemWidth
	  n = Math.max(n , 0)
	  n = Math.min(n, this.itemCount)
	  var tx = - n * width
	  var limit = this.getLimitation()
	  tx = Math.max(tx, limit.min)
	  if (tx == this.tx) return Promise.resolve(null)
	  var self = this
	  return this.animate(tx, duration, ease).then(function () {
	    self.emit('show', n)
	  })
	}
	
	/**
	 * show last item with scroll
	 *
	 * @public
	 * @param {Number} n
	 */
	Hscroll.prototype.last = function () {
	  return this.show(Infinity)
	}
	
	/**
	 * show first item with scroll
	 *
	 * @public
	 * @param {Number} n
	 */
	Hscroll.prototype.first = function () {
	  return this.show(0)
	}
	
	/**
	 * autoplay like sliders
	 *
	 * @public
	 */
	Hscroll.prototype.play = function () {
	  this.playing = true
	  setTimeout(function () {
	    if (!this.playing) return
	    var curr = this.curr()
	    var p
	    var max = this.type == 'swipe' ? this.itemCount - 1
	              : this.itemCount - Math.floor(this.viewWidth/this.itemWidth)
	    if (curr >= max) {
	      p = this.first()
	    } else {
	      p = this.next()
	    }
	    var self = this
	    p.then(function () {
	      self.play()
	    })
	  }.bind(this), this.interval)
	}
	
	/**
	 * stop playing sliders
	 *
	 * @public
	 */
	Hscroll.prototype.stop = function () {
	  this.playing = false
	}
	
	/**
	 * Restore to sane position
	 *
	 * @public
	 */
	Hscroll.prototype.reset = function () {
	  var limit = this.getLimitation()
	  var tx = this.tx
	  if (tx < limit.min) {
	    this.animate(limit.min)
	  } else if (tx > limit.max) {
	    this.animate(limit.max)
	  } else if (this.type == 'swipe' && tx%this.viewWidth !== 0) {
	    this.swipe(0)
	  }
	}
	
	/**
	 * Get current item number
	 *
	 * @public
	 * @returns {Number}
	 */
	Hscroll.prototype.curr = function () {
	  if (this.type == 'swipe') {
	    return Math.round(- this.tx/this.viewWidth)
	  } else {
	    return Math.round(- this.tx/this.itemWidth)
	  }
	}
	
	/**
	 * Recalcute wrapper and set the position if invalid
	 *
	 * @public
	 */
	Hscroll.prototype.refresh = function () {
	  var parent = this.wrapper
	  this.viewWidth = this.el.getBoundingClientRect().width
	  var items = parent.children
	  this.itemWidth = items[0].getBoundingClientRect().width
	  var rect
	  var h = 0
	  // set height and width
	  for (var i = 0, l = items.length; i < l; i++) {
	    rect = items[i].getBoundingClientRect()
	    h = Math.max(h, rect.height)
	  }
	  var pb = numberStyle(this.wrapper, 'padding-bottom')
	  parent.style.height = (h + ( pb ? pb : 0)) + 'px'
	  var width = items.length * this.itemWidth
	  parent.style.width =  width + 'px'
	  if (this.type == 'swipe') {
	    this.itemCount = Math.ceil(width/this.viewWidth)
	  } else {
	    this.itemCount = items.length
	  }
	  this.reset()
	}
	
	/**
	 * get min and max value for transform
	 *
	 * @private
	 */
	Hscroll.prototype.getLimitation = function () {
	  var max
	  if (this.type == 'swipe') {
	    max = (this.itemCount - 1)* this.viewWidth
	  } else {
	    max = parseInt(ComputedStyle(this.wrapper, 'width'), 10) - this.viewWidth
	  }
	  return {
	    max: 0,
	    min: - max
	  }
	}
	
	/**
	 * set transform properties of element
	 *
	 * @public
	 * @param {Number} x
	 */
	Hscroll.prototype.setTransform = function (x) {
	  this.tx = x
	  if (has3d) {
	    this.wrapper.style[transform] = 'translate3d(' + x + 'px, 0, 0) '
	  } else {
	    this.wrapper.style[transform] = 'translateX(' + x + 'px)'
	  }
	}
	/**
	 * Set translateX with animate duration (in milisecond) and ease
	 *
	 * @private
	 * @param {Number} x
	 * @param {Number} duration
	 * @param {String} ease
	 */
	Hscroll.prototype.animate = function (x, duration, ease) {
	  ease = ease || 'out-circ'
	  duration = duration || this.duration
	  var self = this
	  this.animating = true
	  var tween = this.tween = Tween({x: this.tx})
	    .ease(ease)
	    .to({x: x})
	    .duration(duration)
	
	  tween.update(function(o){
	    self.setTransform(o.x)
	  })
	
	  var promise = new Promise(function (resolve) {
	    tween.on('end', function(){
	      animate = function(){} // eslint-disable-line
	      self.animating = false
	      resolve()
	    })
	  })
	
	  function animate() {
	    raf(animate)
	    tween.update()
	  }
	
	  animate()
	  return promise
	}
	
	Hscroll.prototype.calcuteSpeed = function(x, y) {
	  var previous = this.previous || this.down
	  var ts = Date.now()
	  var dt = ts - previous.at
	  if (ts - this.down.at < 100 || dt > 100) {
	    var distance = Math.abs(x - previous.x)
	    this.speed =distance / dt
	    this.direction = x > previous.x ? 1 : -1
	  }
	  if (dt > 100) {
	    this.previous = {x: x, y: y, at: ts}
	  }
	}
	
	function numberStyle(el, style) {
	  var n = parseInt(ComputedStyle(el, style), 10)
	  return isNaN(n) ? 0 :n
	}
	
	module.exports = Hscroll


/***/ },
/* 23 */
/***/ function(module, exports) {

	// DEV: We don't use var but favor parameters since these play nicer with minification
	function computedStyle(el, prop, getComputedStyle, style) {
	  getComputedStyle = window.getComputedStyle;
	  style =
	      // If we have getComputedStyle
	      getComputedStyle ?
	        // Query it
	        // TODO: From CSS-Query notes, we might need (node, null) for FF
	        getComputedStyle(el) :
	
	      // Otherwise, we are in IE and use currentStyle
	        el.currentStyle;
	  if (style) {
	    return style
	    [
	      // Switch to camelCase for CSSOM
	      // DEV: Grabbed from jQuery
	      // https://github.com/jquery/jquery/blob/1.9-stable/src/css.js#L191-L194
	      // https://github.com/jquery/jquery/blob/1.9-stable/src/core.js#L593-L597
	      prop.replace(/-(\w)/gi, function (word, letter) {
	        return letter.toUpperCase();
	      })
	    ];
	  }
	}
	
	module.exports = computedStyle;


/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	var hasTouch = __webpack_require__(25)
	var tap = __webpack_require__(26)
	var event = __webpack_require__(10)
	
	function now() {
	  return (new Date()).getTime()
	}
	var ms = now()
	
	module.exports = function (el, handler, forceTouch) {
	  if (hasTouch || forceTouch) {
	    event.bind(el, 'click', function (e) {
	      e.preventDefault()
	      if (now() - ms > 300) {
	        handler.call(this, e)
	      }
	    })
	    event.bind(el, 'touchstart', tap(function (e) {
	      ms = now()
	      handler.call(this, e)
	    }))
	  } else {
	    event.bind(el, 'click', function (e) {
	      e.preventDefault()
	      handler.call(this, e)
	    })
	  }
	}


/***/ },
/* 25 */
/***/ function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(global) {module.exports = 'ontouchstart' in global || (global.DocumentTouch && document instanceof DocumentTouch)
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 26 */
/***/ function(module, exports) {

	var endEvents = [
	  'touchend'
	]
	
	module.exports = Tap
	
	// default tap timeout in ms
	Tap.timeout = 200
	
	function Tap(callback, options) {
	  options = options || {}
	  // if the user holds his/her finger down for more than 200ms,
	  // then it's not really considered a tap.
	  // however, you can make this configurable.
	  var timeout = options.timeout || Tap.timeout
	
	  // to keep track of the original listener
	  listener.handler = callback
	
	  return listener
	
	  // el.addEventListener('touchstart', listener)
	  function listener(e1) {
	    // tap should only happen with a single finger
	    if (!e1.touches || e1.touches.length > 1) return
	
	    var el = e1.target
	    var context = this
	    var args = arguments;
	
	    var timeout_id = setTimeout(cleanup, timeout)
	
	    el.addEventListener('touchmove', cleanup)
	
	    endEvents.forEach(function (event) {
	      el.addEventListener(event, done)
	    })
	
	    function done(e2) {
	      // since touchstart is added on the same tick
	      // and because of bubbling,
	      // it'll execute this on the same touchstart.
	      // this filters out the same touchstart event.
	      if (e1 === e2) return
	
	      cleanup()
	
	      // already handled
	      if (e2.defaultPrevented) return
	
	      // overwrite these functions so that they all to both start and events.
	      var preventDefault = e1.preventDefault
	      var stopPropagation = e1.stopPropagation
	
	      e1.stopPropagation = function () {
	        stopPropagation.call(e1)
	        stopPropagation.call(e2)
	      }
	
	      e1.preventDefault = function () {
	        preventDefault.call(e1)
	        preventDefault.call(e2)
	      }
	
	      // calls the handler with the `end` event,
	      // but i don't think it matters.
	      callback.apply(context, args)
	    }
	
	    // cleanup end events
	    // to cancel the tap, just run this early
	    function cleanup(e2) {
	      // if it's the same event as the origin,
	      // then don't actually cleanup.
	      // hit issues with this - don't remember
	      if (e1 === e2) return
	
	      clearTimeout(timeout_id)
	
	      el.removeEventListener('touchmove', cleanup)
	
	      endEvents.forEach(function (event) {
	        el.removeEventListener(event, done)
	      })
	    }
	  }
	}


/***/ }
/******/ ]);
//# sourceMappingURL=bundle.js.map