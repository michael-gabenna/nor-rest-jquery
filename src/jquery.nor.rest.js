/** HTTP REST client plugin for jQuery */

"use strict";

/*global ref_copy_self */

var $ = require('jquery');
var $Q = require('q');
var copy = require('nor-data').copy;
var debug = require('nor-debug');
var _url = require('url');
var is = require('nor-is');
var ARRAY = require('nor-array');

// FIXME: Implement this support for POST, DELETE, etc
function replace_params(params) {
	return function replace_params_(match, key) {
		if(params && params.hasOwnProperty(key)) {
			var value = params[key];
			delete params[key];
			return value;
		}
		return ':' + key;
	};
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

		to = ARRAY(from).map(ref_copy).valueOf();

	// Convert objects with a property `$ref` as a function shortcut to `Resource.get(url, opts)`;
	} else if( from && (typeof from === 'object') && (from.$ref !== undefined) ) {
		//console.log( '^ from is $ref-object: ' + JSON.stringify(from) );

		var url = from.$ref;
		to = new Resource.Partial();

		ref_copy_self(to, from);

		if(!is.string(to.$ref)) {
			debug.log('Warning! Partial object from '+ url +' does not have property $ref!');
		}

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
	ARRAY(Object.keys(obj)).forEach(function(key) {
		self[key] = ref_copy(obj[key]);
	});
}

/** Get JSON REST resource at `url` and returns promise of an interface */
Resource.GET = function(url, params) {

	debug.assert(url).is('string');

	// Support for URL params
	params = copy(params);

	if(url === 'undefined') {
		throw new TypeError("Undefined as string!");
	}

	//debug.log('url = ', url, ' (type of ', typeof url, ')');
	url = url.replace(/:([a-zA-Z0-9\_]+)/g, replace_params(params));
	//debug.log('url = ', url, ' (type of ', typeof url, ')');

	debug.assert(url).is('string');

	//console.log(' at Resource.get(' + JSON.stringify(url) + ')' );
	var parsed_url = _url.parse(url, true);
	if(parsed_url.search) {
		delete parsed_url.search;
	}

	//debug.log('parsed_url = ', parsed_url, ' (type of ', typeof parsed_url, ')');

	//debug.log('url = ', url);
	//debug.log('params = ', params);
	//debug.log('parsed_url = ', parsed_url);

	// Remove overlapping keywords from url query parameters
	var keys = is.obj(params) ? Object.keys(params) : [];
	if(keys.length >= 1) {
		var removed = false;
		ARRAY(keys).forEach(function(key) {
			if(parsed_url.query.hasOwnProperty(key)) {
				removed = true;
				delete parsed_url.query[key];
			}
		});
		if(removed) {
			url = _url.format(parsed_url);
		}
		//debug.log('url (after) = ', url);
	}

	return $Q($.ajax({
		dataType: "json",
		url: url,
		data: params,
		cache: false
	})).then(function success_handler(data) {
		//console.log( 'at jqxhr.then(): data = ' + JSON.stringify( data ) );
		if(data.$ref === undefined) {
			//console.log('Warning! Resource from ' + url + ' did not have $ref property. Using ' + url + ' instead.' );
			data.$ref = url;
		}

		var res = new Resource(data);
		//console.log('res.session is type of ' + typeof res.session);
		return res;
	//}).fail(function fail_handler(err) {
	//	//console.log( 'at jqxhr.fail(): err = ' + JSON.stringify( err ) );
	//	throw err;
	});
};

/** POST to the JSON REST resource at `url`. Returns a promise of an interface. */
Resource.POST = function(url, params) {
	//console.log(' at Resource.get(' + JSON.stringify(url) + ')' );

	debug.assert(url).is('string');

	params = copy(params || {});

	// Support for URL params
	url = url.replace(/:([a-zA-Z0-9\_]+)/g, replace_params(params));

	return $Q($.ajax({
		type: 'POST',
		dataType: "json",
		contentType: 'application/json',
		processData: false,
		url: url,
		data: JSON.stringify(params)
	})).then(function success_handler(data) {
		//console.log( 'at jqxhr.then(): data = ' + JSON.stringify( data ) );
		if(data.$ref === undefined) {
			//console.log('Warning! Resource from ' + url + ' did not have $ref property. Using ' + url + ' instead.' );
			data.$ref = url;
		}

		var res = new Resource(data);
		//console.log('res.session is type of ' + typeof res.session);
		return res;
	//}, function fail_handler(err) {
	//	//console.log( 'at jqxhr.fail(): err = ' + JSON.stringify( err ) );
	//	return err;
	});
};

/** DELETE to the JSON REST resource at `url`. Returns a promise of an interface. */
Resource.DEL = function(url, params) {
	//console.log(' at Resource.get(' + JSON.stringify(url) + ')' );

	debug.assert(url).is('string');

	params = copy(params || {});
	params._method = 'DELETE';

	// Support for URL params
	url = url.replace(/:([a-zA-Z0-9\_]+)/g, replace_params(params));

	//debug.log('url = ', url);
	//debug.log('params = ', params);

	return $Q($.ajax({
		type: 'POST',
		dataType: "json",
		contentType: 'application/json',
		processData: false,
		url: url,
		data: JSON.stringify(params)
	})).then(function success_handler(data) {
		//console.log( 'at jqxhr.then(): data = ' + JSON.stringify( data ) );
		if(data.$ref === undefined) {
			//console.log('Warning! Resource from ' + url + ' did not have $ref property. Using ' + url + ' instead.' );
			data.$ref = url;
		}

		var res = new Resource(data);
		//console.log('res.session is type of ' + typeof res.session);
		return res;
	});
};

// These are for coherency
Resource.get    = debug.obsoleteMethod(Resource, 'get', 'GET');
Resource.post   = debug.obsoleteMethod(Resource, 'post', 'POST');
Resource.UPDATE = debug.obsoleteMethod(Resource, 'UPDATE', 'POST');
Resource.update = debug.obsoleteMethod(Resource, 'update', 'POST');
Resource.del    = debug.obsoleteMethod(Resource, 'del', 'DEL');
Resource['delete'] = debug.obsoleteMethod(Resource, 'delete', 'DEL');

/** PUT to the JSON REST resource at `url`. Returns a promise of an interface. */
Resource.PUT = function(url, params) {
	//console.log(' at Resource.get(' + JSON.stringify(url) + ')' );

	debug.assert(url).is('string');
	params = copy(params || {});
	params._method = 'PUT';

	// Support for URL params
	url = url.replace(/:([a-zA-Z0-9\_]+)/g, replace_params(params));

	//debug.log('url = ', url);
	//debug.log('params = ', params);

	return $Q($.ajax({
		type: 'POST',
		dataType: "json",
		contentType: 'application/json',
		processData: false,
		url: url,
		data: JSON.stringify(params)
	})).then(function success_handler(data) {
		//console.log( 'at jqxhr.then(): data = ' + JSON.stringify( data ) );
		if(data.$ref === undefined) {
			//console.log('Warning! Resource from ' + url + ' did not have $ref property. Using ' + url + ' instead.' );
			data.$ref = url;
		}

		var res = new Resource(data);
		//console.log('res.session is type of ' + typeof res.session);
		return res;
	});
};

/** Returns data from the server again */
Resource.prototype.GET = function(params) {
	var self = this;
	debug.assert(self.$ref).is('string');
	return Resource.GET(self.$ref, params);
};

Resource.prototype.get = debug.obsoleteMethod(Resource.prototype, 'get', 'GET');

/** Returns data from the server again */
Resource.prototype.POST = function(params) {
	var self = this;
	debug.assert(self.$ref).is('string');
	return Resource.POST(self.$ref, params);
};

Resource.prototype.UPDATE = debug.obsoleteMethod(Resource.prototype, 'UPDATE', 'POST');
Resource.prototype.update = debug.obsoleteMethod(Resource.prototype, 'update', 'POST');
Resource.prototype.post   = debug.obsoleteMethod(Resource.prototype, 'post', 'POST');

/** Returns data from the server again */
Resource.prototype.DELETE = function(params) {
	var self = this;
	debug.assert(self.$ref).typeOf('string');
	return Resource.DEL(self.$ref, params);
};

Resource.prototype.DEL = debug.obsoleteMethod(Resource.prototype, 'DEL', 'DELETE');
Resource.prototype.del = debug.obsoleteMethod(Resource.prototype, 'del', 'DELETE');
Resource.prototype['delete'] = debug.obsoleteMethod(Resource.prototype, 'delete', 'DELETE');

/** Returns data from the server again */
Resource.prototype.PUT = function(params) {
	var self = this;
	debug.assert(self.$ref).typeOf('string');
	return Resource.PUT(self.$ref, params);
};

/** Partial resources */
function PartialResource() { }

/** Refresh resource */
PartialResource.prototype.GET = function(opts) {
	debug.assert(this.$ref).typeOf('string');
	return Resource.GET(this.$ref, opts);
};

PartialResource.prototype.get = debug.obsoleteMethod(PartialResource.prototype, 'get', 'GET');

/** Update resource */
PartialResource.prototype.POST = function(opts) {
	debug.assert(this.$ref).typeOf('string');
	return Resource.POST(this.$ref, opts);
};

PartialResource.prototype.update = debug.obsoleteMethod(PartialResource.prototype, 'update', 'POST');
PartialResource.prototype.post   = debug.obsoleteMethod(PartialResource.prototype, 'post', 'POST');

/** PUT resource */
PartialResource.prototype.PUT = function(opts) {
	debug.assert(this.$ref).typeOf('string');
	return Resource.PUT(this.$ref, opts);
};

/** Delete resource */
PartialResource.prototype.DEL = function(opts) {
	debug.assert(this.$ref).typeOf('string');
	return Resource.DEL(this.$ref, opts);
};

PartialResource.prototype.del       = debug.obsoleteMethod(PartialResource.prototype, 'del', 'DEL');
PartialResource.prototype.DELETE    = debug.obsoleteMethod(PartialResource.prototype, 'DELETE', 'DEL');
PartialResource.prototype['delete'] = debug.obsoleteMethod(PartialResource.prototype, 'delete', 'DEL');

// Export PartialResource as Resource.Partial
Resource.Partial = PartialResource;

// Export as `$.nor.rest`
if( $.nor === undefined ) { $.nor = {}; }
$.nor.rest = Resource;
module.exports = Resource;

/* EOF */
