# Hscroll

Make element horizon scrollable.

See [example](https://chemzqm.github.io/hscroll) with your phone.

## Features

* Swipe and fix mode.
* Refresh on dom size changes.
* Works fine with vertical scroll component, like [iscroll](https://github.com/chemzqm/iscroll).
* Works fine with tap component, like [tap-event](https://github.com/chemzqm/tap-event).
* Light weight (no jquery) and high performance.

## Limitation

* Css `box-sizing` must be `border-box`.
* Single wrapper element as child of container element.
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

* `show` emit with the number of actived item index.

## API

### Hscroll(el, [opt])

Create Hscroll with element and optional option.
* `el` the element contains a wrapper child.
* `opt.type` could be `swipe` or `fix`.
* `opt.interval` interval of `play()` in ms, default 1000.
* `opt.duration` animation duration in ms, default 300.
* `opt.threshold` maximun duration in ms for fast swipe.
* `opt.fastThreshold` minimum moved distance for fast swipe.

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
