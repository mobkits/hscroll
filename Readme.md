# Hscroll

Make element horizon scrollable.

See [example](https://chemzqm.github.io/hscroll) with your phone.

Works on IE >= 8 ([child elements polyfill](https://github.com/Alhadis/Snippets/blob/master/js/polyfills/IE8-child-elements.js) is required) and all modern browsers.

TODO: support mutation oberserver

## Features

* Support touch, mouse, and wheel events.
* Auto refresh on dom size changes.
* Support items dynamic add and remove (need to call refresh)
* Swipe and fix mode.
* Works fine with vertical scroll component, like [iscroll](https://github.com/chemzqm/iscroll).
* Works fine with tap component, like [tap-event](https://github.com/chemzqm/tap-event).
* Light weight (no jquery) and high performance.

## Limitation

* Css `box-sizing` must be `border-box`.
* First element child of container have to be wrapper element.
* Children elements should not have `display:none` and margin css applied.

## Example

``` html
<div class="container">
  <ul>
    <li class="item"><div class="one">one</div></li>
    <li class="item"><div class="two">two</div></li>
    <li class="item"><div class="three">three</div></li>
  </ul>
</div>
```

``` js
var el = document.querySelector('.container')
var Hscroll = require('hscroll')
new Hscroll(el, {
  type: 'swipe'
})
```

## Event

* `show` emitted with the number of actived item index.
* `unbind` emitted when unbind called.
* `select` emitted with item index on item tap (not emmited when moved)

## API

### Hscroll(el, [opt])

Create Hscroll with element and optional option.
* `el` the element contains a wrapper child.
* `opt.type` default `normal`, could be `swipe` or `fix`.
* `opt.interval` interval of `play()` in ms, default 1000.
* `opt.duration` animation duration in ms, default 300.
* `opt.threshold` maximun duration in ms for fast swipe.
* `opt.fastThreshold` minimum moved distance for fast swipe.
* `opt.autoWidth` set item width to swiper width.
* `opt.autoHeight` set swiper height to be max item height.

### .unbind()

Unbind all event listeners.

### .show(n)

Show nth-child of wrapper element.

### .play()

Start iterate items.

### .stop()

Stop iterate items.

### .prev()
### .next()

Show previous/next item.

### .swipe(dir)

Swipe to previous or next slider.

`dir` is number, 1 for previous -1 for next

### .refresh()

Recalcute wrapper and set the position if invalid

## LICENSE

Copyright 2016 chemzqm@gmail.com

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the "Software"),
to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
