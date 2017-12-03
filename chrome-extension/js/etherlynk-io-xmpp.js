/**
 * etherlynk-io-xmpp.js
 */

var etherlynkXmpp = (function(xmpp)
{
    xmpp.fetchEtherlynks = function(callback)
    {
        etherlynk.connection.addHandler(function(presence)
        {
            var to = $(presence).attr('to');
            var type = $(presence).attr('type');
            var from = Strophe.getBareJidFromJid($(presence).attr('from'));

            //console.log("presence handler", from, to, type);
            $(document).trigger("ofmeet.user.presence", {from : from, to: to, type: type});

            return true;

        }, null, 'presence');

        etherlynk.connection.addHandler(function(message)
        {
            var id = $(message).attr("from");
            var from = $(message).attr("from");
            var to = $(message).attr("to");
            var reason = null;
            var password = null;
            var composing = false;
            var offerer = null;
            var type = $(message).attr("type");
            var autoAccept = false;

            //console.log("message handler", from, to, type)

            $(message).find('active').each(function ()      // user joins conversation
            {
                var jid = $(this).attr("jid");
                var from = $(this).attr("from");
                var to = $(this).attr("to");

                if (jid && from && to)
                {
                    var conference = Strophe.getNodeFromJid(jid);
                    var userid = Strophe.getNodeFromJid(from);

                    $(document).trigger('ofmeet.user.active', [{id: userid, name: conference, to: to}]);
                }

                return true;
            });

            $(message).find('inactive').each(function ()   // user actually leaves conversation
            {
                var jid = $(this).attr("jid");
                var from = $(this).attr("from");
                var to = $(this).attr("to");

                if (jid && from && to)
                {
                    var conference = Strophe.getNodeFromJid(jid);
                    var userid = Strophe.getNodeFromJid(from);

                    $(document).trigger('ofmeet.user.inactive', [{id: userid, name: conference, to: to}]);
                }

                return true;
            });

            $(message).find('gone').each(function ()   // user signals to leave conversation
            {
                var jid = $(this).attr("jid");

                if (jid)
                {
                    var conference = Strophe.getNodeFromJid(jid);
                    var userid = Strophe.getNodeFromJid(from);

                    $(document).trigger('ofmeet.user.gone', [{id: userid, name: conference, user: Strophe.getBareJidFromJid(from)}]);
                }

                return true;
            });

            $(message).find('composing').each(function ()
            {
                $(document).trigger('ofmeet.conversation.composing', [{id: id}]);
                return true;
            });

            $(message).find('x').each(function ()
            {
                var namespace = $(this).attr("xmlns");

                $(message).find('offer').each(function()
                {
                    offerer = $(this).attr('jid');
                });

                if (namespace == "jabber:x:conference")
                {
                    $(message).find('invite').each(function()
                    {
                        offerer = $(this).attr('from');
                    });

                    id = $(this).attr('jid');
                    reason = $(this).attr('reason');
                    password = $(this).attr('password');
                    autoAccept = $(this).attr('autoaccept');
                    mode = $(this).attr('mode');

                    if (!reason)
                    {
                        $(message).find('reason').each(function()
                        {
                            reason = $(this).text();
                        });
                    }

                    if (!password)
                    {
                        $(message).find('password').each(function()
                        {
                            password = $(this).text();
                        });
                    }

                    $(document).trigger('ofmeet.conversation.invitation', [{id: id, from: from, autoAccept: autoAccept, reason: reason, offerer: offerer, password: password, mode: mode}]);

                } else if (namespace == "http://jabber.org/protocol/muc#user")  {

                    $(this).find('reason').each(function()
                    {
                        reason = $(this).text();
                    });

                    $(this).find('password').each(function()
                    {
                        password = $(this).text();
                    });

                    $(this).find('decline').each(function()
                    {
                        from = $(this).attr("from");
                        $(document).trigger("ofmeet.track.removed", {id : track.getParticipantId(), name: name});

                    });

                } else {

                }
            });

            return true;

        }, null, 'message');

        var contactPinId = 63;
        var confPinId = 7;

        etherlynk.connection.sendIQ($iq({type: "get"}).c("query", {xmlns: "jabber:iq:private"}).c("storage", {xmlns: "storage:bookmarks"}).tree(), function(resp)
        {
            //console.log("get bookmarks", resp)

            $(resp).find('conference').each(function()
            {
                var jid = $(this).attr("jid");
                var ether = Strophe.getNodeFromJid(jid);
                var muc = Strophe.getDomainFromJid(jid);
                var domain = muc.substring("conference.".length);           // ignore "conference."
                var server = domain + ":7443";

                //console.log('ofmeet.bookmark.conference.item', {name: $(this).attr("name"), jid: $(this).attr("jid"), autojoin: $(this).attr("autojoin")});

                if (callback && confPinId > -1) callback(
                {
                    pinId: confPinId--,
                    name: $(this).attr("name"),
                    pinned: $(this).attr("autojoin"),
                    open: $(this).attr("autojoin"),
                    etherlynk: ether,
                    server: server,
                    domain: domain
                });
            })

            $(resp).find('url').each(function()
            {
				var name = $(this).attr("name");
				var url = $(this).attr("url");

				if (lynkUI.enableSip && url.indexOf("sip:") == 0 && url.indexOf("@") > -1)
				{
					var uri = url.substring(4).split("@");

					//console.log('ofmeet.bookmark.url.item', {name: name, url: url, uri: uri});

					if (callback && contactPinId < 65) callback(
					{
						pinId: contactPinId--,
						name: name,
						pinned: "false",
						id: uri[0],
						jid: url.substring(4),
						presence: "gray",
						open: "false",
						active: false,
						type: "sip",
						server: uri[1],
						domain: uri[1]
					});
				}
            });

        }, function (error) {
            console.error(error);
        });

        etherlynk.connection.sendIQ($iq({type: "get"}).c("query", {xmlns: "jabber:iq:roster"}).tree(), function(resp)
        {
            ////console.log("get roster", resp)

            $(resp).find('item').each(function()
            {
                var jid = $(this).attr("jid");
                var id = Strophe.getNodeFromJid(jid);
                var name = $(this).attr("name");
                var domain = Strophe.getDomainFromJid(jid);
                var server = domain + ":7443";

                //console.log('ofmeet.roster.item',jid, name, server);

                if (callback && contactPinId < 65) callback(
                {
                    pinId: contactPinId--,
                    name: name,
                    pinned: "false",
                    id: id,
                    jid: jid,
                    presence: lynkUI.presence[jid],
                    open: "false",
                    active: false,
                    server: server,
                    type: "xmpp",
                    domain: domain
                });

            })


        }, function (error) {
            console.error(error);
        });

		if (lynkUI.enableSip)
		{
			etherlynk.connection.sendIQ($iq({type: 'get', to: "sipark." + etherlynk.connection.domain}).c('registration', {jid: etherlynk.connection.jid, xmlns: "http://www.jivesoftware.com/protocol/sipark"}).tree(), function(resp)
			{
				$(resp).find('jid').each(function()                 {lynkUI.sip.jid = $(this).text();});
				$(resp).find('username').each(function()            {lynkUI.sip.username = $(this).text();});
				$(resp).find('authUsername').each(function()        {lynkUI.sip.authUsername = $(this).text();});
				$(resp).find('displayPhoneNum').each(function()     {lynkUI.sip.displayPhoneNum = $(this).text();});
				$(resp).find('password').each(function()            {lynkUI.sip.password = $(this).text();});
				$(resp).find('server').each(function()              {lynkUI.sip.server = $(this).text();});
				$(resp).find('enabled').each(function()             {lynkUI.sip.enabled = $(this).text();});
				$(resp).find('outboundproxy').each(function()       {lynkUI.sip.outboundproxy = $(this).text();});
				$(resp).find('promptCredentials').each(function()   {lynkUI.sip.promptCredentials = $(this).text();});

				console.log("get sip profile", lynkUI.sip);
				etherlynk.loginSip();

			}, function (error) {
				console.warn("SIP profile not available");
				etherlynk.loginSip();
			});
		}
    }

    xmpp.inviteToConference = function (lynk, mode)
    {
        try {
            var jid = lynk.etherlynk + "@conference." + lynk.domain;
            etherlynk.connection.send($msg({to: lynk.jid}).c("x", {xmlns: "jabber:x:conference", jid: jid, mode: mode}).up());
        } catch (e) {
            console.error(e);
        }
    }


    xmpp.leaveConference = function(lynk)      // user action event to far party
    {
        try {
            var jid = lynk.etherlynk + "@conference." + lynk.domain;
            etherlynk.connection.send($msg({to: lynk.jid, type: "chat"}).c("gone", {xmlns: "http://jabber.org/protocol/chatstates", jid: jid}).up());
        } catch (e) {
            console.error(e);
        }
    }

    xmpp.broadcastConference = function(lynk, state)       // user feedback event to all participants
    {
        try {
            var items = Object.getOwnPropertyNames(lynkUI.presence);

            for(var z = 0; z< items.length; z++)
            {
                var target = items[z];

                var jid = lynk.etherlynk + "@conference." + lynk.domain;
                var from = lynkUI.username + "@" + lynkUI.domain;
                var to = lynk.jid;

                etherlynk.connection.send($msg({to: target, type: "chat"}).c(state, {xmlns: "http://jabber.org/protocol/chatstates", jid: jid, from: from, to: to}).up());

            }

        } catch (e) {
            console.error(e);
        }
    }

	xmpp.setSipStatus = function (status)
	{
		etherlynk.connection.sendIQ($iq({type: 'get', to: "sipark." + etherlynk.connection.domain}).c('registration', {jid: pade.connection.jid, xmlns: "http://www.jivesoftware.com/protocol/sipark"}).c('status').t(status).tree(), function(resp)
		{
			console.log("setSipStatus", status);

		}, function (error) {
			console.error("setSipStatus", error);
		});
	}


    return xmpp;

}(etherlynkXmpp || {}));