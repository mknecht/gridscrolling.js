(function ( $, window ) {
    var pluginName = "boxpath";
    var $w = $(window);
    var $d = $(document);
    var grid;
    var overview;
    
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
		 .addClass("box-overview")
		 .addClass(x === 0 ? 'box-ov-main' : 'box-ov-aside')
		);
	    }

	    var maxdepth = (
		$('div.box-main')
		    .map(function(_, el) { 
			return $(el).nextUntil('div.box-main', 'div.box-aside').length;
		    })
		    .get()
		    .reduce(function(left, right) { return Math.max(left, right); })
		    + 1 // number of aside elements + section in front
	    );
	    var overviewDiv = $('<div id="box-overview"></div>')
		.appendTo('body')
		    .css('position', 'fixed')
		    .css('top', 20)
		    .css('left', $w.width() - 20 - 15 * maxdepth - 5)
		    .height(5 + $('div.box-main').length * 15)
		    .width(5 + maxdepth * 15);
	    $('div.box-main').each(function(y, section) {
		placeSquare(0, y, overviewDiv);
		$(section).nextUntil('div.box-main', 'div.box-aside').each(function(x, aside) {
		    placeSquare(x + 1, y, overviewDiv);
		});
	    });
	    $(document).scroll(	function() { overview.update(); } );
	    this.update();
	},
	update: function() {
	    var that = this;
	    $('div.box-ov-main', '#box-overview').each(function(y, section) {
		that.updateOverviewBox($(section), 0, y);
		$(section).nextUntil('div.box-ov-main', 'div.box-ov-aside').each(function(x, aside) {
		    that.updateOverviewBox($(aside), x+1, y);
		});
	    });
	},
	updateOverviewBox: function(box, x, y) {
	    var isBeingLookedAt = grid.getCellAt({x:x, y:y}).isBeingLookedAt();
	    if (box.hasClass("box-looking-at") && !isBeingLookedAt) {
		box.removeClass("box-looking-at");
	    } else if (!box.hasClass("box-looking-at") && isBeingLookedAt) {
		box.addClass('box-looking-at');
	    }
	}
    };
    
    grid = {
	moveRel: function (xdiff, ydiff, options) {
	    var pos = this.getCurrentCell().getBoxCoordinates();
	    this.moveToCoord({y: pos.y + ydiff, x: pos.x + xdiff}, options);
	},
	moveToCoord: function(pos, custom) {
       	    if (pos.x < 0 || pos.y < 0) {
		return;
	    }
	    this.moveToCell(this.getCellAt(pos), custom);
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
		scrollLeft: cell.getBoxCoordinates().x * $w.width(),
		scrollTop: cell.offset().top - topMargin(cell) + ydiff
	    }, 400);
	    $('hgroup a[name]', cell).each(function(_, el) {
		var name = $(el).attr("name");
		$(el).attr('name', "");
		location.hash = name;
		$(el).attr('name', name);
	    });
	},
	handleArrowDown: function() {
	    if (this.isMoveDownPossible()) {
		this.moveRel(0, 1);
		return false;
	    }
	    return true;
	},
	handleArrowUp: function() {
	    if (this.isMoveUpPossible()) {
		this.moveRel(0, -1, {bottom: true});
		return false;
	    }
	    return true;
	},
	handleArrowLeft: function() {
	    if (this.isMoveLeftPossible()) {
		this.moveRel(-1, 0);
		return false;
	    }
	    return true;
	},
	handleArrowRight: function() {
	    if (this.isMoveRightPossible()) {
		grid.moveRel(+1, 0);
		return false;
	    }
	    return true;
	},
	getCurrentCell: function() {
	    return $('div.box-cell').filter(function(idx, el) {
		return $(this).isBeingLookedAt();
	    });
	},
	getCellAt: function(pos) {
	    return (
		$('div.box-main')
		    .eq(pos.y)
		    .nextUntil('div.box-main', 'div.box-aside')
		    .addBack() // 
		    .eq(pos.x)
	    );
	},
	getCellAtPos: function(pos) {
	    return $('div.box-cell').filter(function(_, el) {
		var cell = $(el);
		return (
		    cell.offset().left <= pos.left
			&& (cell.offset().left + cell.width()) >= pos.left
			&& cell.offset().top <= pos.top
			&& (cell.offset().top + cell.height()) >= pos.top
		);
	    });
	},
	createCells: function() {
	    $('header, section, footer').each(function() {
		var section_div = $(this).wrap("<div></div>").parent("div");
		section_div.nextUntil('section, footer', 'aside').each(function(idx) {
		    $(this).wrap("<div></div>").parent().addClass("box-cell box-aside");
		});
		section_div.addClass("box-cell box-main");
	    });
	},
	layoutCells: function() {
	    function positionCells() {
		$('div.box-main').each(function() {
		    var section = $(this);
		    var secOff = section.offset();
		    section.nextUntil('div.box-main', 'div.box-aside').each(function(idx) {
			var asideDiv = $(this);
			(asideDiv
			 .css('position', 'absolute')
			 .offset({top:secOff.top, left:secOff.left + $w.width() * (idx + 1)})
			);
		    });
		});
	    }
	    function homogenizeDimensions() {
		$('div.box-main').each(function() {
		    var section = $(this);
		    var maxHeight = Math.max(
			$w.height(),
			(
			    section
				.nextUntil('div.box-main', 'div.box-aside')
				.addBack()
				.map(function(_, el) { return $(el).height(); })
				.toArray()
				.reduce(function(left, right) {
				    return Math.max(left, right);
				})
			)
		    );
		    section.height(maxHeight);
		    section.nextUntil('div.box-main', 'div.box-aside').each(function() {
			$(this).height(maxHeight).width(section.width());
		    });
 		});
	    }
	    homogenizeDimensions();
	    positionCells();
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
	},
	isMoveUpPossible: function(cell) {
	    var cell = cell === undefined ? grid.getCurrentCell() : cell;
	    if (cell.length > 0) {
		return cell.getBoxCoordinates().y > 0 && !cell.hasContentAbove();
	    } else {
		return $w.scrollTop() > 0;
	    }
	},
	isMoveDownPossible: function(cell) {
	    var cell = cell === undefined ? grid.getCurrentCell() : cell;
	    if (cell.length > 0) {
		var co = cell.getBoxCoordinates();
		return ((grid.getCellAt({x: co.x, y: co.y + 1}).length > 0)
			&& !cell.hasContentBelow());
	    } else {
		return $(document).height() > $w.scrollTop() + $w.height();
	    }
	},
	isMoveLeftPossible: function(cell) {
	    var cell = cell === undefined ? grid.getCurrentCell() : cell;
	    if (cell.length > 0) {
		var co = cell.getBoxCoordinates();
		return (co.x > 0 && (grid.getCellAt({x: co.x - 1, y: co.y}).length > 0));
	    }
	    return false;
	},
	isMoveRightPossible: function(cell) {
	    var cell = cell === undefined ? grid.getCurrentCell() : cell;
	    if (cell.length > 0) {
		var co = cell.getBoxCoordinates();
		return (grid.getCellAt({x: co.x + 1, y: co.y}).length > 0);
	    }
	    return false;
	}
    };

    markers = {
	init: function() {
	    function placeMarker(el_id, pos) {
		var marker = (
		    $('<div></div>')
			.appendTo('body')
			.attr('id', el_id)
			.addClass('box-marker')
			.css('top', pos.top)
			.css('left', pos.left)
		);
	    }
	    var hiddenDiv = $('<div id="box-top-marker" style="display:none"></div>').appendTo('body');
	    var margin = 5;
	    var width = 2 * parseInt(hiddenDiv.css('border-left-width'));
	    var height = parseInt(hiddenDiv.css('border-bottom-width'));
	    hiddenDiv.remove();
	    
	    placeMarker(
		'box-top-marker',
		{top: margin, left: ($w.width() - width) / 2}
	    );
	    placeMarker(
		'box-bottom-marker',
		{top: $w.height() - margin - height, left: ($w.width() - width) / 2}
	    );
	    placeMarker(
		'box-left-marker',
		{top: ($w.height() - width)/2, left: margin}
	    );
	    placeMarker(
		'box-right-marker',
		{top: ($w.height() - width)/2, left: $w.width() - height - margin}
	    );
	    $(document).scroll(	function() { markers.update(grid.getCurrentCell()); } );
	    this.update(grid.getCurrentCell());
	},
	update: function(cell) {
	    function showOrHideMarker(el_id, condition) {
		var el = $('#' + el_id);
		(condition ? el.show : el.hide).apply(el);
	    }
	    showOrHideMarker('box-top-marker', grid.isMoveUpPossible(cell));
	    showOrHideMarker('box-bottom-marker', grid.isMoveDownPossible(cell));
	    showOrHideMarker('box-left-marker', grid.isMoveLeftPossible(cell));
	    showOrHideMarker('box-right-marker', grid.isMoveRightPossible(cell));
	}
    }

    $(window).load(function() {
	$.fn.isBeingLookedAt = function() {
	    var rect = this.get()[0].getBoundingClientRect();
	    return (
		rect.top < $w.height()/2 &&
		    rect.left < $w.width()/2 &&
		    rect.bottom > $w.height()/2 &&
		    rect.right > $w.width()/2
	    );
	};
	$.fn.getBoxCoordinates = function() {
	    return {
		y: $(this).prevAll('div.box-main').length - ($(this).hasClass('box-main') ? 0 : 1),
		x: $(this).hasClass('box-main') ? 0 : ($(this).prevUntil('div.box-main', 'div.box-aside').addBack().length)
	    };
	};
	$.fn.hasContentAbove = function() {
	    if (!$(this).hasClass('box-cell')) {
		return false;
	    }
	    var el = $(this).children();
	    var startOfScreen = $w.scrollTop();
	    var startOfContent = el.offset().top - parseInt(el.children().css('margin-top'));
	    return startOfContent < startOfScreen;
	};
	$.fn.hasContentBelow = function() {
	    if (!$(this).hasClass('box-cell')) {
		return false;
	    }
	    var el = $(this).children();
	    var endOfScreen = ($w.scrollTop() + $w.height());
	    var endOfContent = (el.offset().top + el.outerHeight(true)); // margin included twice, but should not matter.
	    return endOfScreen < endOfContent;
	};

	grid.createCells();
	grid.layoutCells();
	grid.replaceLinks();
	overview.init();
	markers.init();
	$(document).keydown(handleKeydown);
    });
})(jQuery, window);
