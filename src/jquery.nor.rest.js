
/*global jQuery, ref_copy_self $ */

/** HTTP REST client plugin for jQuery */
(function ( $, Q ) {

	// Simply do nothing if Q is not available
	if( Q === undefined ) {
		Q = function noop(x) { return x; };
	}

	/** Copy object */
	function copy(o) {
		return JSON.parse(JSON.stringify(o));
	}

	/** Resource constructor
	 * @param obj {object} The resource object
	 */
	function Resource(obj) {
		//console.log( 'at new Resource(): obj = ' + JSON.stringify(obj) );
		var self = this;
		obj = copy(obj);
		ref_copy_self(self, obj);
	}

	/** 
	 * Returns a copy of variable `from` with any child objects with a property `$ref` 
	 * recursively converted as `function(opts)` which will call `Resource.get($ref, opts)`.
	 */
	function ref_copy(from) {
		//console.log( 'at ref_copy(): from = ' + JSON.stringify(from) );
		//console.log( 'typeof from = ' + (typeof from) );

		var to;

		// Handle arrays
		if( from && (typeof from === 'object') && (from instanceof Array) ) {
			//console.log( '^ from is Array: ' + JSON.stringify(from) );

			to = from.map(ref_copy);

		// Convert objects with a property `$ref` as a function shortcut to `Resource.get(url, opts)`;
		} else if( from && (typeof from === 'object') && (from.$ref !== undefined) ) {
			//console.log( '^ from is $ref-object: ' + JSON.stringify(from) );

			var url = from.$ref;
			function To() { }
			to = new To();

			To.prototype.get = function(opts) {
				return Resource.get(url, opts);
			};

			To.prototype.post = function(opts) {
				return Resource.post(url, opts);
			};
			To.prototype.update = to.post;

			To.prototype.del = function(opts) {
				return Resource.del(url, opts);
			};

			ref_copy_self(to, from);

		// Convert normal objects
		} else if( from && (typeof from === 'object') ) {

			to = {};
			//console.log( '^ from is plain object: ' + JSON.stringify(from) );
			ref_copy_self(to, from);

		// Anything else is passed directly back
		} else {
			//console.log( '^ from is other type: ' + JSON.stringify(from) );
			to = from;
		}

		//console.log('..returning ' + JSON.stringify(to) + ' of type ' + (typeof to));
		return to;
	}

	/** Copies recursively any child objects with property a `$ref` as a function calling `Resource.get()`
	 * @param self {object|function} The object where the properties should be copied
	 * @param obj {object} The object from the properties should be copied
	 */
	function ref_copy_self(self, obj) {
		//console.log( 'at ref_copy_self(): self = ' + JSON.stringify(self) + ', obj = ' + JSON.stringify(obj) );
		Object.keys(obj).forEach(function(key) {
			self[key] = ref_copy(obj[key]);
		});
	}

	/** Get JSON REST resource at `url` and returns promise of an interface */
	Resource.get = function(url, params) {
		//console.log(' at Resource.get(' + JSON.stringify(url) + ')' );

		var jqxhr = Q($.ajax({
			dataType: "json",
			url: url,
			data: params,
			cache: false
		}));

		var res = jqxhr.then(function success_handler(data) {
			//console.log( 'at jqxhr.then(): data = ' + JSON.stringify( data ) );
			if(data.$ref === undefined) {
				//console.log('Warning! Resource from ' + url + ' did not have $ref property. Using ' + url + ' instead.' );
				data.$ref = url;
			}

			var res = new Resource(data);
			//console.log('res.session is type of ' + typeof res.session);
			return res;
		}, function fail_handler(err) {
			//console.log( 'at jqxhr.fail(): err = ' + JSON.stringify( err ) );
			throw err;
		});
		return res;
	};

	/** POST to the JSON REST resource at `url`. Returns a promise of an interface. */
	Resource.post = function(url, params) {
		//console.log(' at Resource.get(' + JSON.stringify(url) + ')' );

		params = params || {};

		var jqxhr = Q($.ajax({
			type: 'POST',
			dataType: "json",
			contentType: 'application/json',
			processData: false,
			url: url,
			data: JSON.stringify(params)
		}));

		var res = jqxhr.then(function success_handler(data) {
			//console.log( 'at jqxhr.then(): data = ' + JSON.stringify( data ) );
			if(data.$ref === undefined) {
				//console.log('Warning! Resource from ' + url + ' did not have $ref property. Using ' + url + ' instead.' );
				data.$ref = url;
			}

			var res = new Resource(data);
			//console.log('res.session is type of ' + typeof res.session);
			return res;
		}, function fail_handler(err) {
			//console.log( 'at jqxhr.fail(): err = ' + JSON.stringify( err ) );
			return err;
		});
		return res;
	};

	/** DELETE to the JSON REST resource at `url`. Returns a promise of an interface. */
	Resource.del = function(url, params) {
		//console.log(' at Resource.get(' + JSON.stringify(url) + ')' );

		params = params || {};
		params._method = 'DELETE';

		//debug.log('url = ', url);
		//debug.log('params = ', params);

		var jqxhr = Q($.ajax({
			type: 'POST',
			dataType: "json",
			contentType: 'application/json',
			processData: false,
			url: url,
			data: JSON.stringify(params)
		}));

		var res = jqxhr.then(function success_handler(data) {
			//console.log( 'at jqxhr.then(): data = ' + JSON.stringify( data ) );
			if(data.$ref === undefined) {
				//console.log('Warning! Resource from ' + url + ' did not have $ref property. Using ' + url + ' instead.' );
				data.$ref = url;
			}

			var res = new Resource(data);
			//console.log('res.session is type of ' + typeof res.session);
			return res;
		}, function fail_handler(err) {
			//console.log( 'at jqxhr.fail(): err = ' + JSON.stringify( err ) );
			throw err;
		});
		return res;
	};

	// Export as `$.nor.rest`
	if( $.nor === undefined ) { $.nor = {}; }

	$.nor.rest = Resource;

	if(typeof module !== 'undefined') {
		module.exports = Resource;
	}

}( (typeof require !== 'undefined') ? require('jquery') : window.jQuery, (typeof require !== 'undefined') ? require('q') : window.Q ));

/* EOF */
