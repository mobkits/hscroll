var Iscroll = require('iscroll')
var event = require('event')
var Hscroll = require('..')
var detect = require('prop-detect')
var transform = detect.transform
var ontap = require('ontap')

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

