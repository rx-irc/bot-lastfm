// Node Dependencies
const http = require('http');

// NPM Depdendencies
const axios = require('axios');
const query = require('qs');

let lastfm = module.exports = {};
let audioscrobbler = { host: 'ws.audioscrobbler.com', port: 80 };

function call(classname, method, options, callback) {
	if (!options.api_key) {
		return callback.call(
			lastfm[classname],
			new Error('API key is missing.'),
			null
		);
	}

	if (!options.format) {
		options.format = 'json';
	}

	let path = '/2.0/?' + query.stringify({
		...options,
		method: classname + '.' + method,
	});

	http.get({ ...audioscrobbler, path }, function (response) {
		let data = '';
		let error = null;

		response.on('data', function (chunk) {
			data += chunk;
		});

		response.on('end', function () {
			// Unknown format let the caller handle the error response
			if (options.format != 'json') {
				callback.call(lastfm[classname], null, data);

				return;
			}

			data = JSON.parse(data);

			if (data.error) {
				error = new Error(data.message);

				error.type = data.error;

				if (error.type == lastfm.ERROR_INVALID_METHOD) {
					throw error;
				}

				callback.call(lastfm[classname], error, null);
			}

			callback.call(lastfm[classname], null, data);
		});
	}).on('error', function (error) {
		callback.call(lastfm[classname], error, null);
	});
}

// ERROR 1 does not exist
lastfm.ERROR_INVALID_SERVICE          =   2
lastfm.ERROR_INVALID_METHOD           =   3
lastfm.ERROR_AUTHENTICATION_FAILED    =   4
lastfm.ERROR_INVALID_FORMAT           =   5
lastfm.ERROR_INVALID_PARAMETERS       =   6
lastfm.ERROR_INVALID_RESOURCE         =   7
lastfm.ERROR_OPERATION_FAILED         =   8
lastfm.ERROR_INVALID_SESSION_KEY      =   9
lastfm.ERROR_INVALID_API_KEY          =  10
lastfm.ERROR_SERVICE_OFFLINE          =  11
lastfm.ERROR_SUBSCRIBERS_ONLY         =  12
lastfm.ERROR_INVALID_METHOD_SIGNATURE =  13
lastfm.ERROR_UNAUTHORIZED_TOKEN       =  14
lastfm.ERROR_ITEM_NOT_STREAMABLE      =  15
lastfm.ERROR_SERVICE_UNAVAILABLE      =  16
lastfm.ERROR_NOT_LOGGED_IN            =  17
lastfm.ERROR_TRIAL_EXPIRED            =  18
// ERROR 19 does not exist
lastfm.ERROR_NOT_ENOUGH_CONTENT       =  20
lastfm.ERROR_NOT_ENOUGH_MEMBERS       =  21
lastfm.ERROR_NOT_ENOUGH_FANS          =  22
lastfm.ERROR_NOT_ENOUGH_NEIGHBOURS    =  23
lastfm.ERROR_NO_PEAK_RADIO            =  24
lastfm.ERROR_RADIO_NOT_FOUND          =  25
lastfm.ERROR_API_KEY_SUSPENDED        =  26
lastfm.ERROR_DEPRECATED_REQUEST       =  27
lastfm.ERROR_RATE_LIMIT_EXCEEDED      =  28

let classes = [
	'Album',
	'Artist',
	'Auth',
	'Chart',
	'Event',
	'Geo',
	'Group',
	'Library',
	'Playlist',
	'Radio',
	'Tag',
	'Tasteometer',
	'Track',
	'User',
	'Venue',
];

for (let classname of classes) {
	lastfm[classname] = new Proxy({}, {
		get: function (proxy, property) {
			return function () {
				return call(classname, property, arguments[0], arguments[1]);
			};
		},
	});
}
