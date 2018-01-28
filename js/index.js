// @license https://opensource.org/licenses/MIT
// copyright Paul Irish 2015


// Date.now() is supported everywhere except IE8. For IE8 we use the Date.now polyfill
//   github.com/Financial-Times/polyfill-service/blob/master/polyfills/Date.now/polyfill.js
// as Safari 6 doesn't have support for NavigationTiming, we use a Date.now() timestamp for relative values

// if you want values similar to what you'd get with real perf.now, place this towards the head of the page
// but in reality, you're just getting the delta between now() calls, so it's not terribly important where it's placed
(function(){

  if ("performance" in window == false) {
      window.performance = {};
  }

  Date.now = (Date.now || function () {  // thanks IE8
	  return new Date().getTime();
  });

  if ("now" in window.performance == false){

    var nowOffset = Date.now();

    if (performance.timing && performance.timing.navigationStart){
      nowOffset = performance.timing.navigationStart
    }

    window.performance.now = function now(){
      return Date.now() - nowOffset;
    }
  }

})();
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
// MIT license
(function(window) {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}( window ));

var Util = (function() {
  'use strict';

  var getRandomInt = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  return {
  	getRandomInt: getRandomInt
  };
}());

var Starfield = (function() {
 	'use strict';

  var canvas,
      ctx,
  		stars = [],
      starColors = ['purple', 'purple', 'yellow', 'purple', 'pink', 'purple'],
      movementFactors = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2],
      alphaValues = [255 / 255, 216 / 255, 192 / 255, 160 / 255, 128 / 255,
                96 / 255, 64 / 255, 32 / 255],
      width = 0,
      height = 0,
      starWidth = 4,
      starHeight = 4,
      numStars = 1000,
      fps = 30,
      frameDuration = 1000 / fps,
      lag = 0,
      previous = 0,
      startTime = 0;

  var begin = function() {
    init();
    requestAnimationFrame(animate);
  };

  var resetStar = function(star, isFirstIteration) {
    star.x = Util.getRandomInt(0, width);
    star.y = (isFirstIteration) ? Util.getRandomInt(0, height) :
        Util.getRandomInt(-100, 0);
    star.renderX = star.previousX = star.previousY = star.renderY = 0;
    star.color = starColors[Util.getRandomInt(0, starColors.length - 1)];
    star.doBlink = (Math.random() < 0.5);
    star.blinkFreq = Util.getRandomInt(500, 750);
}

  var init = function() {
  	canvas = document.getElementById('screen');
    ctx = canvas.getContext('2d');
    window.addEventListener('resize', resize.bind(this), false);
   	resize();

    for (var i = 0, l = numStars; i < l; ++i) {
      stars.push({x: 0, y: 0, renderX: 0, renderY: 0, color: 'black'});
      resetStar(stars[i], true);
    }

    startTime = window.performance.now();
  };

  var update = function() {
    for (var i = 0, l = numStars; i < l; ++i) {
      var star = stars[i];

      star.previousX = stars[i].x;
      star.previousY = stars[i].y;

      var depth = i % 8;
      if (star.y > height) {
      	resetStar(star, false);
      }
      star.y += movementFactors[depth] * 2;
    }
  };

  var interpolate = function(star, lagOffset) {
    star.renderX = star.previousX ? (star.x - star.previousX) * lagOffset + star.previousX : star.x;
    star.renderY = star.previousY ? (star.y - star.previousY) * lagOffset + star.previousY : star.y
  };

  var render = function(lagOffset) {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);

    for (var i = 0, l = numStars; i < l; ++i) {
      var star = stars[i],
      	  depth = i % 8;

     	interpolate(star, lagOffset);

      if (!star.doBlink || ~~(0.5 + Date.now() / star.blinkFreq) % 2) {
        ctx.save();
        ctx.fillStyle = star.color;
        if (alphaValues[depth] < 1.0) ctx.globalAlpha = alphaValues[depth];
        ctx.translate(star.renderX + (starWidth / 2), star.renderY + (starHeight / 2))
        ctx.fillRect(-starWidth / 2, -starHeight / 2, starWidth, starHeight);
        ctx.restore();
      }
    }
  };

  var animate = function() {
  	requestAnimationFrame(animate);

    // calculate the delta or elapsed time since the last frame
    var now = window.performance.now();
    var delta = now - previous;

    // correct any unexpected huge gaps in the delta time
    if (delta > 1000) {
      delta = frameDuration;
    }

    // accumulate the lag counter
    lag += delta;

    // perform an update if the lag counter exceeds or is equal to
    // the frame duration.
    // this means we are updating at a Fixed time-step.
    if (lag >= frameDuration) {
      // update the game logic
      update();

      // reduce the lag counter by the frame duration
      lag -= frameDuration;
    }

    // calculate the lag offset, this tells us how far we are
    // into the next frame
    var lagOffset = lag / frameDuration;

    // display the sprites passing in the lagOffset to interpolate the
    // sprites positions
    render(lagOffset);

    // set the current time to be used as the previous
    // for the next frame
    previous = now;
  };

  var resize = function() {
  	canvas.width = width = window.innerWidth;
    canvas.height = height = window.innerHeight;
  };

  return {
 		begin: begin
  };
}());

Starfield.begin();
