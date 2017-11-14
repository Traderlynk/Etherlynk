var config = {};
var bgWindow = null;

window.addEventListener("load", function()
{
	function getUniqueID()
	{
	    return Math.random().toString(36).substr(2, 9);
	}

	chrome.runtime.getBackgroundPage(function(win)
	{
		bgWindow = win;

		if (window.localStorage["store.settings.server"])
		{
			var server = JSON.parse(window.localStorage["store.settings.server"]);
			var domain = JSON.parse(window.localStorage["store.settings.domain"]);
			var username = JSON.parse(window.localStorage["store.settings.username"]);
			var password = JSON.parse(window.localStorage["store.settings.password"]);
    		var displayname = JSON.parse(window.localStorage["store.settings.displayname"]);

			var autojoin = true;
			var room = urlParam("room");
			var jid = urlParam("jid");
			var name = urlParam("name");

			if (room)
			{
				autojoin = [room + "@" + "conference." + domain];
			}
			else

			if (jid)
			{
				autojoin = [];
				if (!name) name = Strophe.getNodeFromJid(jid);
			}

			Candy.init("wss://" + server + "/ws/", {core: {debug: false, autojoin: autojoin}, view: { assets: 'res/' }});
			Candy.Core.connect(username + "@" + domain + "/" + username  + "-" + Math.random().toString(36).substr(2,9), password, displayname);

			$(Candy).on('candy:core.chat.connection', function(obj, data)
			{
				switch(data.status)
				{
					case Strophe.Status.CONNECTED:
						if (jid)

						setTimeout(function()
						{
							Candy.View.Pane.PrivateRoom.open(jid, name, true, true);
						}, 500);
				}
			});

			CandyShop.SlashCommands.defaultConferenceDomain = "conference." + domain;
			CandyShop.SlashCommands.init();
			CandyShop.Timeago.init();
			CandyShop.TypingNotifications.init();
			CandyShop.Colors.init();
			CandyShop.OfMeet.init();
			CandyShop.Mam.init();
			CandyShop.NotifyMe.init();
			CandyShop.Fastpath.init();

		}
	});
});

function urlParam(name)
{
	var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
	if (!results) { return undefined; }
	return unescape(results[1] || undefined);
};
