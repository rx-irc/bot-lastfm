// NPM Dependencies
const assert = require('assert');
const { filter } = require('rxjs/operators');

// Local Depdendencies
const logger = require('./logger');
const lastfm = require('./lastfm');
const { version } = require('../package.json');

const REGEXP_BANG = /^!listen (\S+)/i;

let defaults = {};

module.exports = class LastfmModule {
	/**
	 * @param {ClientWrapper} client
	 * @param {object} options
	 * @param {string} options.apiKey
	 * @param {string} options.logLevel='error'
	 */
	constructor(client, options) {
		assert.strictEqual(typeof options.apiKey, 'string');

		/** @type {object} */
		this.settings = { ...defaults, ...options };
		/** @type {string} */
		this.version = version;

		//  ____  _
		// / ___|| |_ _ __ ___  __ _ _ __ ___  ___
		// \___ \| __| '__/ _ \/ _` | '_ ` _ \/ __|
		//  ___) | |_| | |  __/ (_| | | | | | \__ \
		// |____/ \__|_|  \___|\__,_|_| |_| |_|___/
		//

		let listen$ = client.raw$.pipe(
			filter(message => message.command === 'PRIVMSG'),
			filter(message => REGEXP_BANG.test(message.args[1]))
		);

		//  ____        _                   _       _   _
		// / ___| _   _| |__  ___  ___ _ __(_)_ __ | |_(_) ___  _ __  ___
		// \___ \| | | | '_ \/ __|/ __| '__| | '_ \| __| |/ _ \| '_ \/ __|
		//  ___) | |_| | |_) \__ \ (__| |  | | |_) | |_| | (_) | | | \__ \
		// |____/ \__,_|_.__/|___/\___|_|  |_| .__/ \__|_|\___/|_| |_|___/
		//                                   |_|
		//

		listen$.subscribe(message => {
			let target = message.args[0];
			let [, nick] = message.args[1].match(REGEXP_BANG);

			lastfm.User.getRecentTracks(
				{
					user: nick,
					limit: 1,
					api_key: this.settings.apiKey,
				},
				function (error, data) {
					if (error) {
						logger.error(error.message);
						client.tell(target, `Error: ${error.message}`);
						return;
					}

					logger.info(nick);

					let recent = data.recenttracks;
					let user = recent['@attr']?.user;
					let track = recent.track;

					if (!user) {
						return client.tell(target, `${nick} was not found on last.fm`);
					}

					if (Array.isArray(track)) {
						track = track[0];
					}

					if (!track || !track.name || !track.artist) {
						return client.tell(target, 'Could not lookup latest track...');
					}

					let title = track.name;
					let artist = track.artist['#text'];

					if (track['@attr']?.['nowplaying'] == 'true') {
						client.tell(target, `${user} is currently listening to:`);
					} else {
						client.tell(target, `${user} last played track was:`);
					}

					client.tell(target, `${artist} - ${title}`);
				}
			);
		});
	}
};