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
		
			Candy.init("wss://" + server + "/ws/", {core: {debug: true, autojoin: true}, view: { assets: 'res/' }});
			Candy.Core.connect(username + "@" + domain + "/" + username  + "-" + Math.random().toString(36).substr(2,9), password, username);	

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
