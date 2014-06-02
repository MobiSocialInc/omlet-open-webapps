var Mandelbrot = function (canvas, n_workers) {
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

    this.row_data = this.ctx.createImageData(canvas.width, 1);
    self.resize_to_parent(true);
    this.canvas.addEventListener("click", function(event) {
        self.click(event.clientX + document.body.scrollLeft +
                   document.documentElement.scrollLeft - canvas.offsetLeft,
                   event.clientY + document.body.scrollTop +
                   document.documentElement.scrollTop - canvas.offsetTop);
    }, false);
    window.addEventListener("resize", function(event) {
        self.resize_to_parent();
    }, false);

    this.workers = [];
    for (var i = 0; i < n_workers; i++) {
        var worker = new Worker("worker.js");
        worker.onmessage = function(event) {
                self.received_row(event.target, event.data)
        }
        worker.idle = true;
        this.workers.push(worker);
    }
    this.i_max = 1.5;
    this.i_min = -1.5;
    this.r_min = -2.5;
    this.r_max = 1.5;
    this.max_iter = 1024;
    this.escape = 4;


    this.generation = 0;
    this.nextrow = 0;

    this.make_palette()
}

Mandelbrot.prototype = {
    make_palette: function() {
        this.palette = []
        
        var st = Math.ceil(Math.random() * this.max_iter / 16) + 1;
        var cols = [];
        for (var i = 0; i <= st + 1; i++) {
          cols.push([255 * Math.random(), 255 * Math.random(), 255 * Math.random()]);
        }
        
        for (var i = 0; i <= this.max_iter; i++) {
            var pt = (this.max_iter / st);
            var l = Math.floor(i / pt);
            var u = Math.ceil(i / pt);
            var w = ((i % pt) / pt)
            var x = 1 - w;
            this.palette.push([cols[l][0] * w + cols[u][0] * x, cols[l][1] * w + cols[u][1] * x, cols[l][2] * w + cols[u][2] * x]);
        }
    },

    draw_row: function(data) {
        var values = data.values;
        var pdata = this.row_data.data;
        for (var i = 0; i < this.row_data.width; i++) {
            var pixel;
            var entry;
            if (values[i] < 0) {
              entry = this.palette[0];
            } else {
              entry = this.palette[values[i]];
            }
            pdata[4*i+3] = 255;
            pdata[4*i] = entry[0];
            pdata[4*i+1] = entry[1];
            pdata[4*i+2] = entry[2];
        }
        var l = data.realrow;
        l += this.blocks - data.realrow % this.blocks;
        for(var r = data.realrow; r <= l; ++r)
          this.ctx.putImageData(this.row_data, 0, r);
    },

    received_row: function (worker, data) {
        if (data.generation == this.generation) {
            // Interesting data: display it.
            this.draw_row(data);
        }
        this.process_row(worker);
    },

    process_row: function(worker) {
        var row = this.nextrow++;
        if (row >= this.canvas.height) {
            worker.idle = true;
        } else {
            worker.idle = false;
            worker.postMessage({
                row: row,
                realrow: this.rows[row],
                width: this.row_data.width,
                generation: this.generation,
                r_min: this.r_min,
                r_max: this.r_max,
                i: this.i_max + (this.i_min - this.i_max) * this.rows[row] / this.canvas.height,
                max_iter: this.max_iter,
                escape: this.escape,
           })
        }
    },

    redraw: function() {
        this.rows = [];
        this.blocks = 16;
        for(var j = 0; j < this.blocks; ++j)
          for(var i = 0; i + j < this.canvas.height; i+= this.blocks)
            this.rows.push(i + j);
        this.generation++;
        this.nextrow = 0;
        for (var i = 0; i < this.workers.length; i++) {
            var worker = this.workers[i];
            if (worker.idle)
                this.process_row(worker);
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
        this.canvas.style.width = window.innerWidth + "px";
        this.canvas.style.height = window.innerHeight + "px";
        this.canvas.width = window.innerWidth * this.ratio;
        this.canvas.height = window.innerHeight * this.ratio;
        // Adjust the horizontal scale to maintain aspect ratio
        var width = ((this.i_max - this.i_min) *
                     this.canvas.width / this.canvas.height);
        var r_mid = (this.r_max + this.r_min) / 2;
        this.r_min = r_mid - width/2;
        this.r_max = r_mid + width/2;

        // Reallocate the image data object used to draw rows.
        this.row_data = this.ctx.createImageData(this.canvas.width, 1);

        if(!skip_redraw)
          this.redraw();
    },
}
