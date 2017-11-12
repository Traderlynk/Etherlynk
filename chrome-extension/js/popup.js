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
		});

		channel.onDisconnect.addListener(function()
		{
			console.log("channel disconnect");
		});

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

			if (e.detail.button == 82) // chat button
			{
				toggleButton(82, "Open<br/>Chat");
			}
			else

			if (e.detail.button == 83) // video button toggle
			{
				toggleButton(83, "Open<br/>Video");
			}
			else

			if (e.detail.button == 84) // screen share button toggle
			{
				toggleButton(84, "Screen<br/>Share");
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

		if (getKeyColor(84) == "green")
		{
			handleVideoCall(call, "video");
			location.href = "jitsi-meet/chrome.index.html?room=" + call.lynk.etherlynk + "#config.startScreenSharing=true";
		}
		else

		if (getKeyColor(83) == "green")
		{
			handleVideoCall(call, "video");
			location.href = "jitsi-meet/chrome.index.html?room=" + call.lynk.etherlynk;
		}
		else

		if (getKeyColor(82) == "green")
		{
			//handleChatCall(call);
			//location.href = "groupchat/index.html";
		}
		else {

			if (call.button[1] == "redflash" && call.lynk.mode == "video") // ringing video call
			{
				handleVideoCall(call, "video");
				location.href = "jitsi-meet/chrome.index.html?room=" + call.lynk.etherlynk + "#config.startScreenSharing=true";

			} else {
				// default - voice
				channel.postMessage({event: "etherlynk.event.buttondown", button: e.detail.button});
			}
		}
	} else {
		channel.postMessage({event: "etherlynk.event.buttondown", button: e.detail.button});
	}
}

function handleConferenceButton(e)
{
	var i = e.detail.button - 64;
	console.info('conference button', bgWindow.lynkUI.conferences[i]);

	if (bgWindow.lynkUI.conferences[i])
	{
		if (getKeyColor(84) == "green")
		{
			// screen share first
			location.href = "jitsi-meet/chrome.index.html?room=" + bgWindow.lynkUI.conferences[i].lynk.name.toLowerCase() + "#config.startScreenSharing=true";
		}
		else

		if (getKeyColor(83) == "green")
		{
			// video second
			location.href = "jitsi-meet/chrome.index.html?room=" + bgWindow.lynkUI.conferences[i].lynk.name.toLowerCase();
		}
		else

		if (getKeyColor(82) == "green")
		{
			// chat last
			location.href = "groupchat/index.html";
		}
		else {
			// default - voice
			channel.postMessage({event: "etherlynk.event.buttondown", button: e.detail.button});
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

function toggleButton(button, label)
{
	if (getKeyColor(button) == "green")
	{
		bgWindow.changeButton(button, null, label)
	} else {
		bgWindow.changeButton(button, "green", label)
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