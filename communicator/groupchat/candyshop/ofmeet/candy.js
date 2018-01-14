var CandyShop = (function(self) { return self; }(CandyShop || {}));

CandyShop.OfMeet = (function(self, Candy, $) {
		
	self.init = function() {
		var html = '<li id="ofmeet-control-icon" data-tooltip="Openfire Meetings"><img id="ofmeet-control" src="candyshop/ofmeet/webcam.png"></span></li>';
		$('#emoticons-icon').after(html);
				
		
		$('#ofmeet-control-icon').click(function(event) 
		{
			var roomJid = Candy.View.getCurrent().roomJid;
			
			if (!Strophe.getResourceFromJid(roomJid))
			{
				Candy.Core.Action.Jabber.Room.Leave(roomJid);
			}
			
			self.showOfMeet(roomJid);
		});
		
		$(Candy).on("candy:view.message.before-show", function(e, args) 
		{
			if (args && args.message && args.message.match(/^{"action":"on"/i)) 
			{
				args.message = "is now talking...";
				return true;
			}
			
			if (args && args.message && args.message.match(/^{"action":"off"/i)) 
			{
				args.message =  "is now quiet...";			
				return true;
			}			
		});		
	};

	self.showOfMeet = function(roomJid) 
	{
		var room = Strophe.getNodeFromJid(roomJid);
				
		if (Strophe.getResourceFromJid(roomJid))
		{
			var fromUser = Strophe.escapeNode(Strophe.getResourceFromJid(roomJid));
			var toUser = Strophe.escapeNode(Candy.Core.getUser().getNick());	
		
			room = fromUser > toUser ? toUser + fromUser : fromUser + toUser;
		}
		
		if (window.localStorage["store.settings.server"])
		{
			var server = JSON.parse(window.localStorage["store.settings.server"]);		
			window.location.href = "https://" + server + "/ofmeet/r/" + room 
		}
		return true;
	};	

	return self;
}(CandyShop.OfMeet || {}, Candy, jQuery));
