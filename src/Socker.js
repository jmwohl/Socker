Socker = (function() {

    /**
     * Utility function for extending an object.
     * @param  {[type]} obj [description]
     * @return {[type]}     [description]
     */
    function _extend(obj) {
        Array.prototype.slice.call(arguments, 1).forEach(function(source) {
            if (source) {
                for (var prop in source) {
                    obj[prop] = source[prop];
                }
            }
        });
        return obj;
    }

    Socker = function(url, opts) {
        this._opts = {};
        this._timer;
        this._connected = false;
        this._eventHandlers = {};

        this._url = url;
        if (opts) _extend(this._opts, opts);

        if (!this._url) {
            throw new Error('The WebSocket server url is required.');
        }

        this.connect();
    }

    Socker.prototype.connect = function() {
        this._ws = new WebSocket(this._url);

        this._ws.onopen = function() {
            console.log('this._ws.onopen');
            this._connected = true;
            if (this._opts.onOpen) this._opts.onOpen();
        };

        this._ws.onclose = function() {
            console.log('this._ws.onclose');
            this._connected = false;
            if (this._opts.onClose) this._opts.onClose();
        };

        this._ws.onmessage = function(evt) {
            var message = JSON.parse(evt.data),
                name = message.name,
                data = message.data;

            if (this._eventHandlers[name]) {
                // for each event handler, call the callback
                for (var i = 0; i < this._eventHandlers[name].length; i++) {
                    this._eventHandlers[name][i](data);
                }
            } else {
                console.log(name + " event not handled.");
            }
        };

        if (this._opts.keepAlive) {
            clearInterval(this._timer);
            this._timer = setInterval(this._checkConnection, this._opts.checkInterval);
        }
    }

    Socker.prototype._checkConnection = function() {
        if (!this._connected) {
            this.connect();
        }
    }

    Socker.prototype.on = function(name, callback) {
        if (this._eventHandlers[name]) {
            this._eventHandlers[name].push(callback);
        } else {
            this._eventHandlers[name] = [callback];
        }
    }

    Socker.prototype.off = function(name, callback) {
        if (this._eventHandlers[name]) {
            var index = this._eventHandlers[name].indexOf(callback);
            if (index > -1) {
                this._eventHandlers[name].splice(index, 1);
            }
        }
    }

    Socker.prototype.send = function(name, data) {
        var message = {
            name: name,
            data: data
        };

        this._ws.send(JSON.stringify(message));
    }

    return Socker;
})()