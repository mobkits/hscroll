import raf from 'raf'
import Tween from 'tween'
import detect from 'prop-detect'
import events from 'events'
import Emitter from 'emitter'
import computedStyle from 'computed-style'
import hasTouch from 'has-touch'
import debounce from 'debounce'
import wheel from 'mouse-wheel-event'
import resize from 'resizelistener'
import removed from 'removed'

const has3d = detect.has3d
const transform = detect.transform

/**
 * Hscroll constructor
 *
 * @public
 * @param  {Element}  el
 * @param {Object} opt
 */
class Hscroll extends Emitter {
  constructor(el, opt = {}) {
    super()
    this.el = el
    el.style.overflow = 'hidden'
    this.loop = opt.loop || false
    this.interval = opt.interval || 1000
    this.duration = opt.duration || 300
    this.wrapper = this.el.firstElementChild
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
    removed(el, () => {
      this.unbind()
    })
  }

  /**
   * Bind event handlers.
   *
   * @api public
   */

  bind() {
    this.events = events(this.wrapper, this)
    this.docEvents = events(document, this)

    // standard mouse click events
    if (!hasTouch && document.addEventListener) {
      this.events.bind('mousedown', 'ontouchstart')
      this.events.bind('mousemove', 'ontouchmove')
      this.events.bind('mouseup', 'ontouchend')
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

  getTouch(e) {
    // "mouse" and "Pointer" events just use the event object itself
    let touch = e
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

  ontouchstart(e) {
    if (this.animating) this.tween.stop()
    let target = e.target || e.srcElement
    if (target.tagName.toLowerCase() == 'input') {
      if (/^(text|password|tel|search|number|email|url)$/.test(target.type)
      && target.value) return
    }
    let touch = this.getTouch(e)
    if (!touch) return
    this.start = this.curr()
    this.speed = 0
    let d = Date.now()
    let sx = touch.pageX
    let sy = touch.pageY
    let self = this
    let tx = this.tx
    let limit = this.getLimitation()
    let pad = 20
    this.down = {
      x: sx,
      y: sy,
      tx,
      at: d
    }
    this.move = (e, touch) => {
      let cx = touch.pageX
      let cy = touch.pageY
      let px = self.previous ? self.previous.x : sx
      let py = self.previous ? self.previous.y : sy
      let leftOrRight = Math.abs(cx - px) > Math.abs(cy - py)
      if (!leftOrRight) return
      e.preventDefault()
      e.stopPropagation()
      self.calcuteSpeed(cx, cy)
      let tx = self.down.tx + cx - sx
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

  ontouchmove(e) {
    let touch = this.getTouch(e)
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

  ontouchend(e) {
    if (!this.move || !this.down || this.animating) return
    this.move = null
    let touch = this.getTouch(e)
    if (!touch) return
    let t = Date.now()
    let x = touch.pageX
    let y = touch.pageY
    let dx = Math.abs(x - this.down.x)
    let dy = Math.abs(y - this.down.y)
    if (dx > 5) {
      e.stopPropagation()
      e.stopImmediatePropagation()
    }
    if (Math.sqrt(dx*dx + dy*dy) < 5) {
      this.emit('select', this.curr())
    }
    if (this.type == 'swipe' &&
        dx > dy && dx > this.fastThreshold &&
        (t - this.down.at) < this.threshold ) {
      // fast swipe
      let dir = x > this.down.x ? 1 : -1
      this.show(this.start - dir)
    } else {
      if (this.type == 'swipe') {
        this.reset()
      } else if (this.speed) {
        this.momentum()
      }
    }
    this.down = this.previous = null
  }

  onwheel(dx, dy, dz, e) {
    if (Math.abs(dy) > Math.abs(dx)) return
    e.preventDefault()
    this.stop()
    if (this.ts && !this.animating) {
      let speed = Math.abs(dx)/(Date.now() - this.ts)
      if (this.type == 'swipe' && speed > 2) this.swipe(dx < 0 ? 1 : -1)
      if (this.type == 'normal') {
        let tx = this.tx - dx
        let limit = this.getLimitation()
        tx = Math.max(limit.min, tx)
        tx = Math.min(limit.max, tx)
        this.setTransform(tx)
      }
    }
    this.ts = Date.now()
  }

  momentum() {
    let deceleration = 0.001
    let speed = this.speed
    let x = this.tx
    speed = Math.min(speed, 2)
    let limit = this.getLimitation()
    let minX = limit.min
    let rate = (4 - Math.PI)/2
    let destination = x + rate*(speed*speed)/(2*deceleration)*this.direction
    let duration = speed/deceleration
    let newX
    let ease = 'out-circ'
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
      let width = this.itemWidth
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

  unbind() {
    this.emit('ubind')
    this.stop()
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

  prev() {
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

  next() {
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
  swipe(dir) {
    let to = this.toFixed(dir)
    let self = this
    let x = - to*this.viewWidth
    if (x === this.tx) return Promise.resolve(null)
    return this.animate(x).then(stopped => {
      if (stopped) return
      self.emit('show', to)
    })
  }

  /**
   * Get a sane item index from direction
   *
   * @private
   * @param {Number} dir
   * @returns {Number}
   */
  toFixed(dir) {
    let to = this.curr() - dir
    let max = this.type == 'swipe' ? this.itemCount - 1
              : this.itemCount - Math.floor(this.viewWidth/this.itemWidth)
    if (to < 0) {
      to = this.loop ? max : 0
    } else if (to > max) {
      to = this.loop ? 0 : max
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
  show(n, duration, ease) {
    if (this.animating) this.tween.stop()
    let width = this.type == 'swipe' ? this.viewWidth : this.itemWidth
    n = Math.max(n , 0)
    n = Math.min(n, this.itemCount - 1)
    let tx = - n * width
    let limit = this.getLimitation()
    tx = Math.max(tx, limit.min)
    if (tx == this.tx) return Promise.resolve(null)
    let self = this
    if (duration === 0) {
      this.setTransform(tx)
      this.refresh()
      this.emit('show', n)
      return Promise.resolve(null)
    }
    return this.animate(tx, duration, ease).then(stopped => {
      if (stopped) return
      this.refresh()
      self.emit('show', n)
    })
  }

  /**
   * show last item with scroll
   *
   * @public
   * @param {Number} n
   */
  last() {
    return this.show(Infinity)
  }

  /**
   * show first item with scroll
   *
   * @public
   * @param {Number} n
   */
  first() {
    return this.show(0)
  }

  /**
   * autoplay like sliders
   *
   * @public
   */
  play() {
    if (this.playing) return
    this.playing = true
    if (this.inter != null) clearInterval(this.inter)
    this.inter = setInterval(() => {
      if (!this.playing) return
      let curr = this.curr()
      let max = this.type == 'swipe' ? this.itemCount - 1
                : this.itemCount - Math.floor(this.viewWidth/this.itemWidth)
      if (curr >= max) {
        this.first()
      } else {
        this.next()
      }
    }, this.interval)
  }

  /**
   * stop playing sliders
   *
   * @public
   */
  stop() {
    this.playing = false
    window.clearInterval(this.inter)
  }

  /**
   * Restore to sane position
   *
   * @public
   */
  reset() {
    let limit = this.getLimitation()
    let tx = this.tx
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
  curr() {
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
  refresh() {
    let parent = this.wrapper
    this.viewWidth = this.el.clientWidth
    if (this.viewWidth == 0) return
    let items = parent.children
    this.itemWidth = this.autoWidth ? this.viewWidth:items[0].clientWidth
    if (this.autoWidth) {
      // set height and width
      for (let i = 0, l = items.length; i < l; i++) {
        if (this.autoWidth) items[i].style.width = `${this.viewWidth}px`
      }
    }
    let item = items[this.curr()]
    if (!item) return
    let h = item.clientHeight
    let pb = parseInt(computedStyle(parent, 'padding-bottom'), 10) || 0
    if (this.autoHeight) parent.style.height = `${h + pb}px`
    let width = items.length * this.itemWidth
    parent.style.width =  `${width}px`
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
  getLimitation() {
    let max
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
  setTransform(x) {
    this.tx = x
    if (typeof transform === 'string') {
      if (has3d) {
        this.wrapper.style[transform] = `translate3d(${x}px, 0, 0) `
      } else {
        this.wrapper.style[transform] = `translateX(${x}px)`
      }
    } else {
      // for old ie which have no transform
      this.wrapper.style.left = `${x}px`
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
  animate(x, duration=this.duration, ease='out-circ') {
    let self = this
    this.animating = true
    let tween = this.tween = Tween({x: this.tx})
      .ease(ease)
      .to({x})
      .duration(duration)

    tween.update(o => {
      self.setTransform(o.x)
    })

    let promise = new Promise(resolve => {
      tween.on('end', () => {
        animate = () => {} // eslint-disable-line
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

  calcuteSpeed(x, y) {
    let previous = this.previous || this.down
    let ts = Date.now()
    let dt = ts - previous.at
    if (ts - this.down.at < 100 || dt > 100) {
      let distance = Math.abs(x - previous.x)
      this.speed =distance / dt
      this.direction = x > previous.x ? 1 : -1
    }
    if (dt > 100) {
      this.previous = {x, y, at: ts}
    }
  }
}

export default Hscroll
