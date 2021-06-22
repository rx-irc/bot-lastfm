// NPM Dependencies
const assert = require('assert');
const { filter } = require('rxjs/operators');
const axios = require('axios');

// Local Depdendencies
const logger = require('./logger');
const { version } = require('../package.json');

const REGEXP_BANG = /^!listen (\S+)/i;

let defaults = {};

module.exports = class LastfmModule {
	/**
	 * @param {ClientWrapper} client
	 * @param {object} options
	 * @param {string} options.apiKey
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

		let listen$ = client.privmsg$.pipe(
			filter(message => REGEXP_BANG.test(message.text))
		);

		//  ____        _                   _       _   _
		// / ___| _   _| |__  ___  ___ _ __(_)_ __ | |_(_) ___  _ __  ___
		// \___ \| | | | '_ \/ __|/ __| '__| | '_ \| __| |/ _ \| '_ \/ __|
		//  ___) | |_| | |_) \__ \ (__| |  | | |_) | |_| | (_) | | | \__ \
		// |____/ \__,_|_.__/|___/\___|_|  |_| .__/ \__|_|\___/|_| |_|___/
		//                                   |_|
		//

		listen$.subscribe(async message => {

			logger.info(nick);
			let target = message.target;
			let [, nick] = message.text.match(REGEXP_BANG);

			try {
				let { data } = await axios({
					url: 'https://ws.audioscrobbler.com/2.0/',
					params: {
						api_key: this.settings.apiKey,
						method: 'User.getRecentTracks',
						format: 'json',
						user: nick,
						limit: 1,
					},
				});

				if (data.error) {
					throw new Error(data.message);
				}

				let recent = data.recenttracks;
				let user = recent['@attr']?.user;
				let track = recent.track;

				if (!user) {
					client.actionOut$.next({
						command: 'PRIVMSG',
						target,
						text: `${nick} was not found on Last.fm`,
					});
					return;
				}

				if (Array.isArray(track)) {
					track = track[0];
				}

				if (!track || !track.name || !track.artist) {
					client.actionOut$.next({
						command: 'PRIVMSG',
						target,
						text: 'Could not lookup latest track.',
					});
					return;
				}

				let title = track.name;
				let artist = track.artist['#text'];
				let track_string = `${artist} - ${title}`;
				let text = [];

				if (track['@attr']?.['nowplaying'] == 'true') {
					text = [`${user} is listening to:`, track_string];
				} else {
					text = [`${user} last played:`, track_string];
				}

				client.actionOut$.next({
					command: 'PRIVMSG',
					target,
					text,
				});
			} catch (error) {
				logger.error(error.message);
				client.actionOut$.next({
					command: 'PRIVMSG',
					target,
					text: `Error: ${error.message}`,
				});
			}
		});
	}
};
