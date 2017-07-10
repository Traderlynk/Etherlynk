var bgWindow = null;
var lynkUI = null;

window.addEventListener("unload", function() 
{
 	console.log("popup unloaded");
});

window.addEventListener("load", function() 
{ 
	chrome.runtime.getBackgroundPage(function(win) 
	{ 	
		bgWindow = win;
		
		var etherlynkobj = document.getElementById('app-content');
		var container = document.getElementById('chat-content');
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
		     console.info('etherlynk.event.buttondown',e.detail.button)
		     channel.postMessage({event: "etherlynk.event.buttondown", button: e.detail.button});	     
		     
		}, false);

		document.body.addEventListener('etherlynk.event.buttonup', function (e) 
		{
		     console.info('etherlynk.event.buttonup',e.detail.button)
		     channel.postMessage({event: "etherlynk.event.buttonup", button: e.detail.button});	
		     
		}, false);		
	});	
});