var shared_spinner;

function ShowSpinner(on_target) {
    var opts = {
        lines: 9, // The number of lines to draw
        length: 12, // The length of each line
        width: 6, // The line thickness
        radius: 10, // The radius of the inner circle
        corners: 1, // Corner roundness (0..1)
        rotate: 0, // The rotation offset
        direction: 1, // 1: clockwise, -1: counterclockwise
        color: '#64645a', // #rgb or #rrggbb or array of colors
        speed: 1, // Rounds per second
        trail: 60, // Afterglow percentage
        shadow: false, // Whether to render a shadow
        hwaccel: true, // Whether to use hardware acceleration
        className: 'spinner', // The CSS class to assign to the spinner
        zIndex: 2e9, // The z-index (defaults to 2000000000)
        top: 'auto', // Top position relative to parent in px
        left: 'auto' // Left position relative to parent in px
    };
    var target = document.getElementById(on_target);
    shared_spinner = new Spinner(opts).spin(target);
}

function StopSpinner() {
	shared_spinner.stop();
}
