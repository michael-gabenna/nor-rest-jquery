nor-rest-jquery
===============

jQuery REST client plugin for Sendanor REST APIs


Usage
-----

First make sure you include our jQuery plugin file `jquery.nor.rest.js`.

### Fetching data with GET requests

When `/api` returns:

```javascript
{
  "$ref": "http://zeta3-lts-local:3000/api",
  "profile": {
    "$ref": "http://zeta3-lts-local:3000/api/profile",
	"username": "foo"
  }
}
```

...and `/api/profile` returns:

```javascript
{
  "$ref": "http://zeta3-lts-local:3000/api/profile",
  "username": "foo",
  "email": "foo@example.com"
}
```

Then you can call `$.nor.rest.get(url[, params])` like this:

```javascript
$.nor.rest.get('/api').done(function(api) {
	if(api.profile) {

		// Any partial data that's available can be used here
		console.log( api.profile.username );

		// Get full user resource. Calling `api.profile()` is same as calling 
		// `$.nor.rest.get('/api/profile')`.

		api.profile().done(function(profile) {
			console.log( profile );
		});

	}
});
```

### Changing the data with POST request

In this example the POST handler redirects the user back to `/api/profile`:

```javascript
$.nor.rest.get('/api').done(function(api) {
	if(api.profile) {

		// Get full user resource. Calling `api.profile.post()` is same as calling 
		// `$.nor.rest.post('/api/profile')`.
		api.profile.post({'foo':'bar'}).done(function(profile) {
			console.log( profile );
		});

	}
});
```

Commercial Support
------------------

You can buy commercial support from [Sendanor](http://sendanor.com/software).
