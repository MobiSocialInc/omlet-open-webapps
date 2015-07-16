
// ensure that you have included jquery before you include this script
// then to use it just call the following: $('#element').center();
$.fn.centerHorizontally = function() {
	this.css({
		'position:' : 'absolute',
		'left': '50%',
		'margin-left': - this.outerWidth() / 2 + 'px',
	});

	return this;
};

$.fn.center = function() {
    this.css({
        left: ($(window).width() - this.outerWidth()) / 2,
        top: ($(window).height() - this.outerHeight()) / 2
    });
};