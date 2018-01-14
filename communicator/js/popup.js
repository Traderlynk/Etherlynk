var bgWindow = null;
var etherlynkobj = null;
var channel = null

window.addEventListener("unload", function()
{
 	console.log("popup unloaded");
});

window.addEventListener("load", function()
{
	chrome.runtime.getBackgroundPage(function(win)
	{
		var container = document.getElementById('chat-content');

		bgWindow = win;

		etherlynkobj = document.getElementById('app-content');
		etherlynkobj.timeoutval=500;
		etherlynkobj.midienabled = false;
		etherlynkobj.style = "display: block;";
		container.style= "display: none;";

		console.log("setup actions, calls and conference buttons", win.lynkUI);

		for (var i=0; i<win.lynkUI.actions.length; i++)
		{
			var action = win.lynkUI.actions[i];

			if (action)
			{
				try {etherlynkobj.setbutton(action.button)} catch (e) {}
			}
		}

		for (var i=0; i<win.lynkUI.conferences.length; i++)
		{
			var conference = win.lynkUI.conferences[i];

			if (conference)
			{
				try {etherlynkobj.setbutton(conference.button)} catch (e) {}
			}
		}

		for (var i=0; i<win.lynkUI.calls.length; i++)
		{
			var call = win.lynkUI.calls[i];

			if (call)
			{
				try {etherlynkobj.setbutton(call.button)} catch (e) {}
			}
		}


		channel = chrome.runtime.connect();

		console.log("channel initialised", channel);

		channel.onMessage.addListener(function (message)
		{
			if (message.value1 == 176) // midi slider data
			{
			  	etherlynkobj.sliders[etherlynkobj.slidermap[message.value2]].value = message.value3;
			}

			if (message.action == "button")
			{
				// send event to UI component
				etherlynkobj.setbutton(message.data)
			}

			if (message.action == "load")
			{
				container.contentWindow.location.href = message.url;
				etherlynkobj.style = "display: none;";
				container.style= "display: block; width: 800px; height: 600px; border: 0;";
			}
		});

		channel.onDisconnect.addListener(function()
		{
			console.log("channel disconnect");
		});

		document.body.addEventListener('etherlynk.ui.settings', function (e)
		{
			location.href = "options/index.html";

		}, false);

		document.body.addEventListener('etherlynk.ui.event', function (e)
		{
		     if (e.detail.data1 == 176)		// slider events
		     {
		     	console.info('etherlynk.event.slider', e.detail.data2, e.detail.data3);
		     	channel.postMessage({event: "etherlynk.event.slider", slider: e.detail.data2, value: e.detail.data3});
		     }

		}, false);


		document.body.addEventListener('etherlynk.event.held', function (e)
		{
		     console.info('etherlynk.event.held', e.detail.button)
		     channel.postMessage({event: "etherlynk.event.held", button: e.detail.button});

		}, false);


		document.body.addEventListener('etherlynk.event.buttondown', function (e)
		{
			console.info('etherlynk.event.buttondown', e.detail.button)

			if (e.detail.button == 89) // settings button
			{
				location.href = "options/index.html";
			}
			else

			if (e.detail.button > -1 && e.detail.button < 64) // call button
			{
				handleCallButton(e);
			}
			else

			if (e.detail.button > 63 && e.detail.button < 72) // conference room button
			{
				handleConferenceButton(e);
			}

			else {
				channel.postMessage({event: "etherlynk.event.buttondown", button: e.detail.button});
			}

		}, false);

		document.body.addEventListener('etherlynk.event.buttonup', function (e)
		{
		     console.info('etherlynk.event.buttonup',e.detail.button)
		     channel.postMessage({event: "etherlynk.event.buttonup", button: e.detail.button});

		}, false);
	});
});

function handleCallButton(e)
{
	var i = e.detail.button;
	var call = bgWindow.lynkUI.calls[i];

	console.info('call button', call);

	if (call)
	{
		call.lynk.etherlynk = "etherlynk-" + Math.random().toString(36).substr(2, 9);

		if (getKeyColor(82) == "green")	 // audio, handle in background
		{
			channel.postMessage({event: "etherlynk.event.buttondown", button: e.detail.button});
		}
		else

		if (getKeyColor(84) == "green")
		{
			bgWindow.closeVideoWindow();

			handleVideoCall(call, "video");
			location.href = "jitsi-meet/chrome.index.html?room=" + call.lynk.etherlynk + "#config.startScreenSharing=true";
		}
		else

		if (getKeyColor(83) == "green")
		{
			bgWindow.closeVideoWindow();

			handleVideoCall(call, "video");
			location.href = "jitsi-meet/chrome.index.html?room=" + call.lynk.etherlynk;
		}

		else {

			if (call.button[1] == "redflash" && call.lynk.mode == "video") // ringing video call
			{
				handleVideoCall(call, "video");
				location.href = "jitsi-meet/chrome.index.html?room=" + call.lynk.etherlynk + "#config.startScreenSharing=true";

			} else {
				// default - chat
				bgWindow.closeChatWindow();
				location.href = "groupchat/index.html?jid=" + call.lynk.jid + "&name=" + call.lynk.name;
			}

		}
	} else {
		channel.postMessage({event: "etherlynk.event.buttondown", button: e.detail.button});
	}
}

function handleConferenceButton(e)
{
	var i = e.detail.button - 64;
	var conference = bgWindow.lynkUI.conferences[i];

	console.info('conference button', conference);

	if (conference)
	{
		if (getKeyColor(82) == "green")
		{
			// audio first
			channel.postMessage({event: "etherlynk.event.buttondown", button: e.detail.button});
		}
		else

		if (getKeyColor(84) == "green")
		{
			// screen share second
			bgWindow.closeVideoWindow();
			location.href = "jitsi-meet/chrome.index.html?room=" + conference.lynk.name.toLowerCase() + "#config.startScreenSharing=true";
		}
		else

		if (getKeyColor(83) == "green")
		{
			// video third
			bgWindow.closeVideoWindow();
			location.href = "jitsi-meet/chrome.index.html?room=" + conference.lynk.name.toLowerCase();
		}
		else {
			// chat last
			bgWindow.closeChatWindow();
			location.href = "groupchat/index.html?room=" + conference.lynk.etherlynk;
		}

	} else {
		channel.postMessage({event: "etherlynk.event.buttondown", button: e.detail.button});
	}
}

function handleVideoCall(call, mode)
{
	if (call.button[1] == call.lynk.presence)       // idle
	{
		bgWindow.clearActiveCall();

		if (call.lynk.jid)
		{
			bgWindow.setActiveLynk(call.lynk);
			bgWindow.etherlynkXmpp.inviteToConference(call.lynk, mode);
		}
	}
	else

	if (call.button[1] == "redflash")           // ringing
	{
		bgWindow.clearActiveCall();
		bgWindow.setActiveLynk(call.lynk);

		chrome.notifications.clear(call.lynk.etherlynk, function(wasCleared)
		{
			console.log("call answered", wasCleared);
		});
	}
}

function getKeyColor(button)
{
	var color = null;

	for (var i=0; i<etherlynkobj.data.length; i++)
	{
		if (etherlynkobj.data[i] && button == etherlynkobj.data[i][0])
		{
			color = etherlynkobj.data[i][1]
		}
	}
	return color;
}