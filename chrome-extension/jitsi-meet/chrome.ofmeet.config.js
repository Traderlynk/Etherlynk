var room = urlParam("room");

if (window.localStorage["store.settings.server"])
{
    var __server = JSON.parse(window.localStorage["store.settings.server"]);
    var __domain = JSON.parse(window.localStorage["store.settings.domain"]);
    var __username = JSON.parse(window.localStorage["store.settings.username"]);
    var __password = JSON.parse(window.localStorage["store.settings.password"]);
    var __enableSip = window.localStorage["store.settings.enableSip"] && JSON.parse(window.localStorage["store.settings.enableSip"]);

	var OFMEET_CONFIG = {
		emailAddress:'',
		nickName:__username,
		userAvatar: null,
		authorization: btoa(__username + ":" + __password),

		isSwitchAvailable: __enableSip,
		callcontrol:'callcontrol.' + __domain,
		sip:__server,
		hostname: __server,
		room: room,
		domain:__domain
	};
}

function urlParam(name)
{
	var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
	if (!results) { return undefined; }
	return unescape(results[1] || undefined);
};