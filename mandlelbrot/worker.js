self.onmessage = function (event) {
    var data = event.data;
    var c_i = data.i;
    var max_iter = data.max_iter;
    var escape = data.escape * data.escape;
    data.values = [];
    for (var i = 0; i < data.width; i++) {
        var c_r = data.r_min + (data.r_max - data.r_min) * i / (data.width);
        var z_r = 0, z_i = 0;
        for (iter = 0; z_r*z_r + z_i*z_i < escape && iter < max_iter; iter++) {
            // z -> z^2 + c
            var tmp = z_r*z_r - z_i*z_i + c_r;
            z_i = 2 * z_r * z_i + c_i;
            z_r = tmp;
        }
        if (iter == max_iter) {
            iter = -1;
        }
        data.values.push(iter);
    }
    self.postMessage(data);
}
