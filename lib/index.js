var raf = require('raf')
var Tween = require('tween')
var detect = require('prop-detect')
var has3d = detect.has3d
var transform = detect.transform
var events = require('events')
var Emitter = require('emitter')
var computedStyle = require('computed-style')
var hasTouch = require('has-touch')
var debounce = require('debounce')
var wheel = require('mouse-wheel-event')
var resize = require('resizelistener')

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
  this.interval = opt.interval || 1000
  this.duration = opt.duration || 300
  this.wrapper = firstChild(this.el)
  if (!this.wrapper) throw new Error('Child element required for hscroll')
  this.type = opt.type || 'normal'
  // maximun duration in ms for fast swipe
  this.threshold = opt.threshold || 200
  // minimum moved distance for fast swipe
  this.fastThreshold = opt.fastThreshold || 30
  this.autoWidth = opt.autoWidth || false
  this.autoHeight = opt.autoHeight || false
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
  if (!hasTouch && document.addEventlistener) {
    this.events.bind('mousedown', 'ontouchstart')
    this.events.bind('mousemove', 'ontouchmove')
    this.docEvents.bind('mouseup', 'ontouchend')
    this._wheelUnbind = wheel(this.el, this.onwheel.bind(this), false)
  } else if (hasTouch) {
    // W3C touch events
    this.events.bind('touchstart')
    this.events.bind('touchmove')
    this.docEvents.bind('touchend')

    // MS IE touch events
    this.events.bind('PointerDown', 'ontouchstart')
    this.events.bind('PointerMove', 'ontouchmove')
    this.docEvents.bind('PointerUp', 'ontouchstart')
  }

  this.unbindResize = resize(this.el, debounce(this.refresh.bind(this), 100))
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
  var target = e.target || e.srcElement
  if (target.tagName.toLowerCase() == 'input') {
    if (/^(text|password|tel|search|number|email|url)$/.test(target.type)
    && target.value) return
  }
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
    this.show(this.curr() - dir)
  } else {
    if (this.type == 'swipe') {
      this.reset()
    } else if (this.speed) {
      this.momentum()
    }
  }
  this.down = this.previous = null
}

Hscroll.prototype.onwheel = function (dx, dy) {
  if (Math.abs(dy) > Math.abs(dx)) return
  this.stop()
  if (this.ts && !this.animating) {
    var speed = Math.abs(dx)/(Date.now() - this.ts)
    if (this.type == 'swipe' && speed > 2) this.swipe(dx < 0 ? 1 : -1)
    if (this.type == 'normal') {
      var tx = this.tx - dx
      var limit = this.getLimitation()
      tx = Math.max(limit.min, tx)
      tx = Math.min(limit.max, tx)
      this.setTransform(tx)
    }
  }
  this.ts = Date.now()
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
  this.animate(destination, duration, ease)
  return
}

/**
 * Unbind event handlers.
 *
 * @api public
 */

Hscroll.prototype.unbind = function(){
  this.events.unbind()
  this.docEvents.unbind()
  this.unbindResize()
  if (this._wheelUnbind) this._wheelUnbind()
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
    return this.show(this.toFixed(1))
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
    return this.show(this.toFixed(-1))
  }
}

/**
 * Swipe to previous/next piece
 *
 * @public
 * @param {Number} dir 1 or -1
 */
Hscroll.prototype.swipe = function (dir) {
  var to = this.toFixed(dir)
  var self = this
  var x = - to*this.viewWidth
  if (x === this.tx) return Promise.resolve(null)
  return this.animate(x).then(function (stopped) {
    if (stopped) return
    self.emit('show', to)
  })
}

Hscroll.prototype.toFixed = function (dir) {
  var to = this.curr() - dir
  var max = this.type == 'swipe' ? this.itemCount - 1
            : this.itemCount - Math.floor(this.viewWidth/this.itemWidth)
  if (to < 0) {
    to = max
  } else if (to > max) {
    to = 0
  }
  return to
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
  n = Math.min(n, this.itemCount - 1)
  var tx = - n * width
  var limit = this.getLimitation()
  tx = Math.max(tx, limit.min)
  if (tx == this.tx) return Promise.resolve(null)
  var self = this
  if (duration === 0) {
    this.setTransform(tx)
    this.emit('show', n)
    return Promise.resolve(null)
  }
  return this.animate(tx, duration, ease).then(function (stopped) {
    if (stopped) return
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
  if (this.playing) return
  this.playing = true
  if (this.inter != null) clearInterval(this.inter)
  this.inter = setInterval(function () {
    if (!this.playing) return
    var curr = this.curr()
    var max = this.type == 'swipe' ? this.itemCount - 1
              : this.itemCount - Math.floor(this.viewWidth/this.itemWidth)
    if (curr >= max) {
      this.first()
    } else {
      this.next()
    }
  }.bind(this), this.interval)
}

/**
 * stop playing sliders
 *
 * @public
 */
Hscroll.prototype.stop = function () {
  this.playing = false
  window.clearInterval(this.inter)
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
  this.viewWidth = this.el.clientWidth
  var items = parent.children
  this.itemWidth = this.autoWidth ? this.viewWidth:items[0].clientWidth
  var h = 0
  var pb = numberStyle(this.wrapper, 'padding-bottom')
  if (this.autoWidth || this.autoHeight) {
    // set height and width
    for (var i = 0, l = items.length; i < l; i++) {
      h = Math.max(h, items[i].clickHeight)
      if (this.autoWidth) items[i].style.width = this.viewWidth + 'px'
    }
  }
  if (this.autoHeight) parent.style.height = (h + ( pb ? pb : 0)) + 'px'
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
    max = parseInt(computedStyle(this.wrapper, 'width'), 10) - this.viewWidth
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
  if (typeof transform === 'string') {
    if (has3d) {
      this.wrapper.style[transform] = 'translate3d(' + x + 'px, 0, 0) '
    } else {
      this.wrapper.style[transform] = 'translateX(' + x + 'px)'
    }
  } else {
    // for old ie which have no transform
    this.wrapper.style.left = x + 'px'
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
      resolve(tween.stopped)
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
  var n = parseInt(computedStyle(el, style), 10)
  return isNaN(n) ? 0 :n
}

function firstChild(el) {
  el = el.firstChild
  if (!el) return null
  do {
    if (el.nodeType === 1) return el
    el = el.nextSibling
  } while(el)
  return null
}

module.exports = Hscroll
