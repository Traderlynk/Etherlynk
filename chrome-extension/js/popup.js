var bgWindow = null;
var etherlynkobj = null;

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
				etherlynkobj.setbutton(action.button)
			}
		}

		for (var i=0; i<win.lynkUI.conferences.length; i++)
		{
			var conference = win.lynkUI.conferences[i];

			if (conference)
			{
				etherlynkobj.setbutton(conference.button)
			}
		}

		for (var i=0; i<win.lynkUI.calls.length; i++)
		{
			var call = win.lynkUI.calls[i];

			if (call)
			{
				etherlynkobj.setbutton(call.button)
			}
		}


		var channel = chrome.runtime.connect();

		channel.onMessage.addListener(function (message)
		{
			if (message.value1 == 176) // midi slider data
			{
			  	etherlynkobj.sliders[etherlynkobj.slidermap[message.value2]].value = message.value3;
			}

			if (message.action == "button")
			{
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
				location.href = "groupchat/index.html";
			}
			else

			if (e.detail.button == 83) // video button toggle
			{
				if (getKeyColor(83) == "green")
				{
					bgWindow.changeButton(e.detail.button, null, "Open Video")
				} else {
					bgWindow.changeButton(e.detail.button, "green", "Open Video")
				}

			}
			else

			if (e.detail.button > 63 && e.detail.button < 72) // conference room button
			{
				var i = e.detail.button - 64;
				console.info('conference button', win.lynkUI.conferences[i]);

				if (win.lynkUI.conferences[i] && getKeyColor(83) == "green")
				{
					location.href = "jitsi-meet/chrome.index.html?room=" + win.lynkUI.conferences[i].lynk.name.toLowerCase();

				} else {
					channel.postMessage({event: "etherlynk.event.buttondown", button: e.detail.button});
				}
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