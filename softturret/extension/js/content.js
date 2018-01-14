/* The chrome content script which can listen to the page dom events */

var channel = chrome.runtime.connect();

if (channel)
{
	channel.onMessage.addListener(function (message) {
		console.log('ofmeet extension channel message', message);
		window.postMessage(message, '*');
	});

	window.addEventListener('message', function (event) {
		if (event.source != window)
			return;
		if (!event.data || (event.data.type != 'ofmeetGetScreen' &&	event.data.type != 'ofmeetCancelGetScreen' && event.data.type != 'ofmeetSetRequestorOn' && event.data.type != 'ofmeetSetRequestorOff' && event.data.type != 'ofmeetSetConfig' && event.data.type != 'ofmeetOpenPopup'  && event.data.type != 'ofmeetDrawAttention' && event.data.type != 'ofmeetPaste'))
			return;
		channel.postMessage(event.data);
	});

	var div = document.createElement('div');
	div.id = "ofmeet-extension-installed";
	div.style = "display: none;";
	document.body.appendChild(div);
}
