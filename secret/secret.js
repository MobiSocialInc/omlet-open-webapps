var Secret = function (canvas) {
    var self = this; // for use in closures where 'this' is rebound
    
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    
    var devicePixelRatio = window.devicePixelRatio || 1;
    var backingStoreRatio = this.ctx.webkitBackingStorePixelRatio ||
                            this.ctx.mozBackingStorePixelRatio ||
                            this.ctx.msBackingStorePixelRatio ||
                            this.ctx.oBackingStorePixelRatio ||
                            this.ctx.backingStorePixelRatio || 1;

    this.ratio = devicePixelRatio / backingStoreRatio;
	this.r = 0;

	//chinese characters - taken from the unicode charset
	this.chinese = "如果你想读这一点，那么你最好知道的秘密。相信我，这是多汁的信息";
	//converting the string into an array of single characters
	this.chinese = this.chinese.split("");

	
    self.resize_to_parent(true);
    this.canvas.addEventListener("click", function(event) {
        self.click(event.clientX + document.body.scrollLeft +
                   document.documentElement.scrollLeft - canvas.offsetLeft,
                   event.clientY + document.body.scrollTop +
                   document.documentElement.scrollTop - canvas.offsetTop);
    }, false);
    window.addEventListener("resize", function(event) {
        self.resize_tocal_parent();
    }, false);
	window.setInterval(function() {self.redraw()}, 33);
}

Secret.prototype = {
	wrong: function() { 
		var x = 0;
		var self = this;
		var tok = window.setInterval(function() {
			x += 5;
			if(x < 256)
				self.r = x;
			else if(x < 512)
				self.r = 256 - (x - 256)
			else {
				self.r = 0;
				window.clearInterval(tok);
			}
		},16);
	},
    redraw: function() {
		//Black BG for the canvas
		//translucent BG to show trail
		this.ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
		
		this.ctx.fillStyle = "rgb("+this.r + "," + (255 - this.r) +",0)";
		this.ctx.font = this.font_size + "px arial";
		//looping over drops
		for(var i = 0; i < this.drops.length; i++)
		{
			//a random chinese character to print
			var text = this.chinese[Math.floor(Math.random()*this.chinese.length)];
			//x = i*font_size, y = value of drops[i]*font_size
			this.ctx.fillText(text, i*this.font_size, this.drops[i]*this.font_size);
			
			//sending the drop back to the top randomly after it has crossed the screen
			//adding a randomness to the reset to make the drops scattered on the Y axis
			if(this.drops[i]*this.font_size > this.canvas.height && Math.random() > 0.975)
				this.drops[i] = 0;
			
			//incrementing Y coordinate
			this.drops[i]++;
		}
    },

    click: function(x, y) {
        var width = this.r_max - this.r_min;
        var height = this.i_min - this.i_max;
        var click_r = this.r_min + width * x * this.ratio / this.canvas.width;
        var click_i = this.i_max + height * y * this.ratio / this.canvas.height;

        this.r_min = click_r - width/8;
        this.r_max = click_r + width/8;
        this.i_max = click_i - height/8;
        this.i_min = click_i + height/8;
        this.redraw()
    },

    resize_to_parent: function(skip_redraw) {
		this.font_size = 16;
		this.columns = this.canvas.width/this.font_size; //number of columns for the rain
		//an array of drops - one per column
		this.drops = [];
		//x below is the x coordinate
		//1 = y co-ordinate of the drop(same for every drop initially)
		for(var x = 0; x < this.columns; x++)
			this.drops[x] = 1; 
		
        this.canvas.style.width = window.innerWidth + "px";
        this.canvas.style.height = window.innerHeight + "px";
        this.canvas.width = window.innerWidth * this.ratio;
        this.canvas.height = window.innerHeight * this.ratio;
        if(!skip_redraw)
          this.redraw();
    },
}

