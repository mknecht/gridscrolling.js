/**
 * gridscrolling.js
 *
 * A jQuery plugin that will layout your HTML5 article
 * and give you easy navigation support.
 *
 * homepage: http://mknecht.github.io/gridscrolling.js/
 * license: MIT
 *
 * Copyright (c) 2014 Murat Knecht
 */
(function ($, window, document) {
  var $w = $(window);
  var $d = $(document);
  /** Representation of the article's structure and
    controller of the scrolling thru it. */
  var grid;
  /** Representation of the Overview Map in the upper right corner. */
  var overview;
  /** Controller of the arrows indicating in which direction movement
    is possible. */
  var indicators;

  function handleKeydown(e) {
    var handlers = {
      37: function moveLeft() { return grid.handleArrowLeft(); },
      38: function moveUp() { return grid.handleArrowUp(); },
      39: function moveRight() { return grid.handleArrowRight(); },
      40: function moveDown() { return grid.handleArrowDown(); }
    };
    function findHandler(keyCode) {
      if (handlers.hasOwnProperty(keyCode)) {
	return handlers[keyCode];
      }
      return function() { return true; };
    }
    if (e.altKey === true || e.shiftKey === true || e.ctrlKey === true) {
      return true;
    }
    return findHandler(e.keyCode)();
  }

  overview = {
    init: function() {
      var that = this;
      function placeSquare(x, y, overviewDiv) {
	($("<div></div>")
	.appendTo(overviewDiv)
	.css("position", "absolute")
	.css("top", 5 + y * 15)
	.css("left", 5 + x * 15)
	.css("width", 10)
	.css("height", 10)
	.addClass("gridscrolling-overview-square")
	.addClass(x === 0 ? 'gridscrolling-ov-main' : 'gridscrolling-ov-aside')
	);
      }

      this.maxdepth = (
	$('div.gridscrolling-main')
	.map(function(_, el) {
	  return $(el).nextUntil('div.gridscrolling-main', 'div.gridscrolling-aside').length;
	})
	.get()
	.reduce(function(left, right) { return Math.max(left, right); })
+ 1 // number of aside elements + section in front
      );
      var overviewDiv = $('<div id="gridscrolling-overview"></div>')
      .appendTo('body')
      .css('position', 'fixed')
      .css('display', 'none')
      .height(5 + $('div.gridscrolling-main').length * 15)
      .width(5 + that.maxdepth * 15);
      $('div.gridscrolling-main').each(function(y, section) {
	placeSquare(0, y, overviewDiv);
	$(section).nextUntil('div.gridscrolling-main', 'div.gridscrolling-aside').each(function(x, aside) {
	  placeSquare(x + 1, y, overviewDiv);
	});
      });
      $(document).scroll(	function() { overview.update(); } );
      this.updatePosition();
      this.update();
      $('div#gridscrolling-overview').show()
      $w.resize(function(){
        that.updatePosition();
      });
      $w.on('orientationchange', function(){
        that.updatePosition();
      });
    },
    update: function() {
      var that = this;
      $('div.gridscrolling-ov-main', '#gridscrolling-overview').each(function(y, section) {
	that.updateOverviewBox($(section), 0, y);
	$(section).nextUntil('div.gridscrolling-ov-main', 'div.gridscrolling-ov-aside').each(function(x, aside) {
	  that.updateOverviewBox($(aside), x+1, y);
	});
      });
    },
    updateOverviewBox: function(box, x, y) {
      var isBeingLookedAt = grid.getCellAt({x:x, y:y}).gridscrolling('isBeingLookedAt');
      if (box.hasClass("gridscrolling-looking-at") && !isBeingLookedAt) {
	box.removeClass("gridscrolling-looking-at");
      } else if (!box.hasClass("gridscrolling-looking-at") && isBeingLookedAt) {
	box.addClass('gridscrolling-looking-at');
      }
    },
    updatePosition: function() {
      $('div#gridscrolling-overview')
      .css('top', 20)
      .css('left', $w.width() - 20 - 15 * this.maxdepth - 5);
    }
  };

  grid = {
    canMoveDown: function(cell) {
      var cell = cell === undefined ? grid.getCurrentCell() : cell;
      if (cell.length > 0) {
	var co = cell.gridscrolling('getCoordinates');
	return ((grid.getCellAt({x: co.x, y: co.y + 1}).length > 0)
	      && !cell.gridscrolling('hasContentBelow'));
      }
    },
    canMoveLeft: function(cell) {
      var cell = cell === undefined ? grid.getCurrentCell() : cell;
      if (cell.length > 0) {
	var co = cell.gridscrolling('getCoordinates');
	return (co.x > 0 && (grid.getCellAt({x: co.x - 1, y: co.y}).length > 0));
      }
      return false;
    },
    canMoveRight: function(cell) {
      var cell = cell === undefined ? grid.getCurrentCell() : cell;
      if (cell.length > 0) {
	var co = cell.gridscrolling('getCoordinates');
	return (grid.getCellAt({x: co.x + 1, y: co.y}).length > 0);
      }
      return false;
    },
    canMoveUp: function(cell) {
      var cell = cell === undefined ? grid.getCurrentCell() : cell;
      if (cell.length > 0) {
	var co = cell.gridscrolling('getCoordinates');
	return (
	  cell.gridscrolling('getCoordinates').y > 0
		&& grid.getCellAt({x: co.x, y: co.y - 1}).length > 0
		&& !cell.gridscrolling('hasContentAbove')
	);
      }
    },
    createCells: function() {
      $('header, section, footer').each(function() {
	var section_div = $(this).wrap("<div></div>").parent("div");
	section_div.nextUntil('section, footer', 'aside').each(function(idx) {
	  $(this).wrap("<div></div>").parent().addClass("gridscrolling-cell gridscrolling-aside");
	});
	section_div.addClass("gridscrolling-cell gridscrolling-main");
      });
    },
    getCellAt: function(pos) {
      return (
	$('div.gridscrolling-main')
	.eq(pos.y)
	.nextUntil('div.gridscrolling-main', 'div.gridscrolling-aside')
	.addBack() //
	.eq(pos.x)
      );
    },
    getCellAtPos: function(pos) {
      return $('div.gridscrolling-cell').filter(function(_, el) {
	var cell = $(el);
	return (
	  cell.offset().left <= pos.left
		&& (cell.offset().left + cell.width()) >= pos.left
		&& cell.offset().top <= pos.top
		&& (cell.offset().top + cell.height()) >= pos.top
	);
      });
    },
    getCurrentCell: function() {
      return $('div.gridscrolling-cell').filter(function(idx, el) {
	return $(this).gridscrolling('isBeingLookedAt');
      });
    },
    handleArrowDown: function() {
      if (this.canMoveDown()) {
	this.moveRel(0, 1);
	return false;
      }
      return true;
    },
    handleArrowUp: function() {
      if (this.canMoveUp()) {
	this.moveRel(0, -1, {bottom: true});
	return false;
      }
      return true;
    },
    handleArrowLeft: function() {
      if (this.canMoveLeft()) {
	this.moveRel(-1, 0);
	return false;
      }
      return true;
    },
    handleArrowRight: function() {
      if (this.canMoveRight()) {
	grid.moveRel(+1, 0);
	return false;
      }
      return true;
    },
    init: function(options) {
      this.animationSpeed = options.animationSpeed;
    },
    layoutCells: function() {
      function positionCells() {
	$('div.gridscrolling-main').each(function() {
	  var section = $(this);
	  var secOff = section.children().eq(0).offset();
	  section.nextUntil('div.gridscrolling-main', 'div.gridscrolling-aside').each(function(idx) {
	    var asideDiv = $(this);
	    (asideDiv
	    .css('position', 'absolute')
	    .offset({top:secOff.top, left:secOff.left + $w.width() * (idx + 1)})
	    );
	  });
	});
      }
      function homogenizeDimensions() {
	$('div.gridscrolling-main').each(function() {
	  var section = $(this);
	  var maxHeight = Math.max(
	    $w.height(),
	    (
	      section
	      .nextUntil('div.gridscrolling-main', 'div.gridscrolling-aside')
	      .addBack()
	      .map(function(_, el) { return $(el).height(); })
	      .toArray()
	      .reduce(function(left, right) {
		return Math.max(left, right);
	      })
	    )
	  );
	  section.height(maxHeight);
	  section.nextUntil('div.gridscrolling-main', 'div.gridscrolling-aside').each(function() {
	    $(this).height(maxHeight).width(section.width());
	  });
 	});
      }
      homogenizeDimensions();
      positionCells();
    },
    moveRel: function (xdiff, ydiff, options) {
      var pos = this.getCurrentCell().gridscrolling('getCoordinates');
      this.moveToCoord({y: pos.y + ydiff, x: pos.x + xdiff}, options);
    },
    moveToCell: function(cell, custom) {
      function topMargin(cell) {
	return parseInt(cell.children().css('margin-top'));
      }
      function leftMargin(cell) {
	return parseInt(cell.children().css('margin-left'));
      }
      var defaults = {bottom:false};
      var options = $.extend({}, defaults, custom);
      if (cell.length === 0) {
	return;
      }
      var ydiff = (options.bottom && (cell.children().outerHeight(true) > $w.height())) ? (Math.max(cell.children().outerHeight(true) - $w.height())) : 0;
      $('html:not(:animated),body:not(:animated)').animate({
	scrollLeft: cell.gridscrolling('getCoordinates').x * $w.width(),
	scrollTop: cell.offset().top - topMargin(cell) + ydiff
      }, this.animationSpeed);
      $('hgroup a[name]', cell).each(function(_, el) {
	var name = $(el).attr("name");
	$(el).attr('name', "");
	location.hash = name;
	$(el).attr('name', name);
      });
    },
    moveToCoord: function(pos, custom) {
      if (pos.x < 0 || pos.y < 0) {
	return;
      }
      this.moveToCell(this.getCellAt(pos), custom);
    },
    replaceLinks: function() {
      $('a[href^="#"]').each(function(_, el) {
	var hash = $(el).attr('href').substr(1);
	var target = $('a[name="' + hash + '"]');
	var link = $(el);
	link.click(function() {
	  grid.moveToCell(grid.getCellAtPos(target.offset()));
	  return true;
	});
      });
    }
  };

  indicators = {
    init: function() {
      function placeMarker(el_id, pos) {
	var marker = (
	  $('<div></div>')
	  .appendTo('body')
	  .attr('id', el_id)
	  .addClass('gridscrolling-marker')
	  .css('top', pos.top)
	  .css('left', pos.left)
	);
      }
      var hiddenDiv = $('<div id="gridscrolling-top-marker" style="display:none"></div>').appendTo('body');
      var margin = 5;
      var width = 2 * parseInt(hiddenDiv.css('border-left-width'));
      var height = parseInt(hiddenDiv.css('border-bottom-width'));
      hiddenDiv.remove();

      placeMarker(
	'gridscrolling-top-marker',
	{top: margin, left: ($w.width() - width) / 2}
      );
      placeMarker(
	'gridscrolling-bottom-marker',
	{top: $w.height() - margin - height, left: ($w.width() - width) / 2}
      );
      placeMarker(
	'gridscrolling-left-marker',
	{top: ($w.height() - width)/2, left: margin}
      );
      placeMarker(
	'gridscrolling-right-marker',
	{top: ($w.height() - width)/2, left: $w.width() - height - margin}
      );
      $(document).scroll(	function() { indicators.update(grid.getCurrentCell()); } );
      this.update(grid.getCurrentCell());
    },
    update: function(cell) {
      function showOrHideMarker(el_id, condition) {
	var el = $('#' + el_id);
	(condition ? el.show : el.hide).apply(el);
      }
      showOrHideMarker('gridscrolling-top-marker', grid.canMoveUp(cell));
      showOrHideMarker('gridscrolling-bottom-marker', grid.canMoveDown(cell));
      showOrHideMarker('gridscrolling-left-marker', grid.canMoveLeft(cell));
      showOrHideMarker('gridscrolling-right-marker', grid.canMoveRight(cell));
    }
  }

  /** Possible actions for the plugin function. */
  var actions = {
    getCoordinates: function() {
      return {
	y: $(this).prevAll('div.gridscrolling-main').length - ($(this).hasClass('gridscrolling-main') ? 0 : 1),
	x: $(this).hasClass('gridscrolling-main') ? 0 : ($(this).prevUntil('div.gridscrolling-main', 'div.gridscrolling-aside').addBack().length)
      };
    },
    hasContentAbove: function() {
      if (!$(this).hasClass('gridscrolling-cell')) {
	return false;
      }
      var el = $(this).children();
      var startOfScreen = $w.scrollTop();
      var startOfContent = el.offset().top - parseInt(el.children().css('margin-top'));
      return startOfContent < startOfScreen;
    },
    hasContentBelow: function() {
      if (!$(this).hasClass('gridscrolling-cell')) {
	return false;
      }
      var el = $(this).children();
      var endOfScreen = ($w.scrollTop() + $w.height());
      var endOfContent = (el.offset().top + el.outerHeight(true)); // margin included twice, but should not matter.
      return endOfScreen < endOfContent;
    },
    init: function(custom) {
      var defaults = {
	'animationSpeed': 400,
        'hideOverviewMapOnTinyScreens': true,
	'showOverviewMap': true,
	'showMarker': true,
        'tinyScreenWidth': 500
      }
      var options = $.extend(defaults, custom);
      grid.init(options);
      grid.createCells();
      grid.layoutCells();
      grid.replaceLinks();

      if (options.showOverviewMap === true) {
        if (!options.hideOverviewMapOnTinyScreens
          || $w.width() > options.tinyScreenWidth) {
	  overview.init();
        }
      }
      if (options.showMarker === true) {
	indicators.init();
      }
      $(document).keydown(handleKeydown);
      return this;
    },
    isBeingLookedAt: function() {
      var rect = this.get()[0].getBoundingClientRect();
      return (
	rect.top < $w.height()/2 &&
	 rect.left < $w.width()/2 &&
	 rect.bottom > $w.height()/2 &&
	 rect.right > $w.width()/2
      );
    }
  }

  /** Register the plugin as recommended by the jQuery plugin site. */
  if ($.fn.gridscrolling === undefined) {
    $.fn.gridscrolling = function(action, options) {
      return actions[action].call(this, options);
    }
  }

})(jQuery, window, document);
