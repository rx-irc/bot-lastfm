// NPM Dependencies
const debug = require('debug');

//  _
// | |    ___   __ _  __ _  ___ _ __
// | |   / _ \ / _` |/ _` |/ _ \ '__|
// | |__| (_) | (_| | (_| |  __/ |
// |_____\___/ \__, |\__, |\___|_|
//             |___/ |___/
//

let logger = module.exports = {
	debug: debug('rx-irc:bot:lastfm:debug'),
	log:   debug('rx-irc:bot:lastfm:log'),
	info:  debug('rx-irc:bot:lastfm:info'),
	warn:  debug('rx-irc:bot:lastfm:warn'),
	error: debug('rx-irc:bot:lastfm:error'),
};

for (let key in logger) {
	logger[key].log = console[key].bind(console);
}
