/**
 * Etherlynk  API for FreeSwitch Conferencing
 */
 
var etherlynkFS = (function(lynk)
{	
	//-------------------------------------------------------
	//
	//	etherlynkFS private
	//
	//-------------------------------------------------------

	function connectSIP(config)
	{		
		var getTurnServers = function()
		{
			var turnServers = null;

			if (config.iceServers && config.iceServers.iceServers)
			{
				turnServers = [];			
				
				for (var i=0; i<config.iceServers.iceServers.length; i++)
				{
					if (config.iceServers.iceServers[i].url.indexOf("turn:") > -1 || config.iceServers.iceServers[i].url.indexOf("turns:") > -1)
					{
						turnServers.push({urls: config.iceServers.iceServers[i].url, username: config.iceServers.iceServers[i].username, password: config.iceServers.iceServers[i].credential})
					}
				}
			}

			return turnServers;
		}

		var getStunServers = function()
		{
			var stunServers = null;

			if (config.iceServers && config.iceServers.iceServers)
			{
				stunServers = [];			
				
				for (var i=0; i<config.iceServers.iceServers.length; i++)
				{
					if (config.iceServers.iceServers[i].url.indexOf("stun:") > -1 || config.iceServers.iceServers[i].url.indexOf("stuns:") > -1)
					{
						stunServers.push(config.iceServers.iceServers[i].url)
					}
				}
			}		

			return stunServers;	
		}
				
		lynk.sipUI = new SIP.UA(
		{
		    password        : config.sip.password,
		    displayName     : config.sip.displayname,
		    uri             : 'sip:' + config.sip.authusername + '@' + config.sip.server,
		    wsServers       : "wss://" + window.location.host + "/sip/proxy?url=ws://" + config.sip.server + ":5066",
		    turnServers     : getTurnServers(),
		    stunServers     : getStunServers(),			    
		    registerExpires : 30,
		    traceSip        : true,
		    log             : {
			level : 99,
		    }		
		});

		lynk.sipUI.on('connected', function(e) {
			console.log("SIP Connected");
		});

		lynk.sipUI.on('disconnected', function(e) {
			console.log("SIP Disconnected");
		});

		lynk.sipUI.on('registered', function(e) {
			console.log("SIP Ready");
		});

		lynk.sipUI.on('registrationFailed', function(e) {
			console.log("Error: Registration Failed");
		});

		lynk.sipUI.on('unregistered', function(e) {
			console.log("Error: Registration Failed");
		});

		lynk.sipUI.on('message', function(message) {
			console.log("SIP Message", message.body);

			var data = {};

			if (message.body.substring(0, 1) == "{")
			{
				try {
					data = JSON.parse(message.body);

					console.log("JSON Object", data);

					if (data.action == "join")
					{
						lynk.join(data.muc, data.payload);
					}

					if (data.action == "leave")
					{
						lynk.leave(data.muc, data.payload);
					}						

				} catch (e) {
					console.error(e);
				}
			}
		});

		lynk.sipUI.on('invite', function (incomingSession) {

		});		     
	}	
	
	
	function cleanupConnection(name)
	{
		console.log("cleanupConnection", name);
	
		if (lynk.localAudioTracks[name])
		{
			console.info("cleanupConnection: remove localtrack");			
			
			lynk.localAudioTracks[name].stop();					
			delete lynk.localAudioTracks[name];
		}
		
		if (lynk.conferences[name])
		{
			console.info("cleanupConnection: leave", name);			

			if (lynk.conferences[name].startTime) {
				lynk.conferences[name].bye();
			
			} else if (lynk.conferences[name].reject) {
				lynk.conferences[name].reject();
			
			} else if (lynk.conferences[name].cancel) {
				lynk.conferences[name].cancel();
			}
			
			delete lynk.conferences[name];			
		}		
	}

	function setupRemoteAudio(name)
	{
		console.log("setupRemoteAudio!", name);
		
		var id = "remoteAudio-" + name;
		var audio = document.getElementById(id);

		if (!audio)
		{				
			audio = new Audio();
			audio.id = id;
			audio.controls = false;
			audio.autoplay = true;
			audio.muted = true;
			audio.volume = 1;
			document.body.appendChild(audio); 
		}

		lynk.remoteAudioElements[name] = audio;	
		return audio;		
	}
	
	function setupLocalAudio(name, stream)
	{
		console.log("setupLocalAudio!", name);
		
		var id = "localAudio-" + name;
		var audio = document.getElementById(id);

		if (!audio)
		{				
			audio = new Audio();
			audio.id = id;
			audio.controls = false;
			audio.autoplay = true;
			audio.muted = true;
			audio.volume = 1;
			document.body.appendChild(audio); 
		}

		lynk.localAudioTracks[name] = stream.getAudioTracks()[0];		
		return audio;
	}
	
	
	function setupSpeechRecognition()
	{
		lynk.recognition = new webkitSpeechRecognition();
		lynk.recognition.lang = "en-GB";
		lynk.recognition.continuous = true;
		lynk.recognition.interimResults = true;	
		lynk.currentTranslation = [];

		lynk.recognition.onresult = function(event) 
		{
			console.log("Speech recog event", event)
			
			lynk.currentTranslation = [];			

			for (var i = 0; i < event.results.length; i++) 
			{                  
				if(event.results[i].isFinal==true)
				{ 
					var transcript = event.results[i][0].transcript;
					console.log("Speech recog transcript", transcript);  
					lynk.currentTranslation.push(transcript);               
				}
			} 
		}
		
		lynk.recognition.onspeechend  = function(event) 
		{ 
			console.log("Speech recog ","speechend", event);
			sendSpeechRecognition()			
		}
		
		lynk.recognition.onerror = function(event) 
		{
			console.error("Speech to text error", event);
			sendSpeechRecognition()			
		}		
	}
	
	function sendSpeechRecognition()
	{			
		var result = lynk.currentTranslation.length ==1 ? lynk.currentTranslation[0] : lynk.currentTranslation.join();

		if (result != "")
		{				
			var items = Object.getOwnPropertyNames(lynk.conferences);	

			for(var z = 0; z<items.length; z++)
			{
/*			
				var conn = lynk.conferences[items[z]].xmpp.connection;
				var room = Object.getOwnPropertyNames(conn.emuc.rooms)[0];
				var alias = Strophe.getNodeFromJid(lynk.connection.jid);
				var message = "<" + alias + " says: " + result + ">"

				conn.send($msg({to:room, type:"groupchat"}).c("body").t(message).up());	
*/				
				console.log("Speech recog result", room, conn.jid, result); 					
			}

			lynk.currentTranslation = [];
		}	
	}

	//-------------------------------------------------------
	//
	//	etherlynkFS public
	//
	//-------------------------------------------------------

	lynk.login = function(server, domain, username, password, callback)
	{
		var xhr = new XMLHttpRequest();

		xhr.onreadystatechange = function() 
		{
			if (xhr.readyState == 4 && xhr.status == 200)
			{
				eval(xhr.responseText);			
				console.log("lynk.login", config);
				
				connectSIP(config);				

				lynk.connection = new Strophe.Connection("wss://" + server + "/ws/");
				//lynk.connection = new Strophe.Connection("https://" + server + "/http-bind/");			

				lynk.connection.connect(username + "@" + domain + "/" + username, password, function (status)
				{
					if (status === Strophe.Status.CONNECTED)
					{
						lynk.connection.send($pres());
						if (callback) callback(status);
					}
				});								

				setupSpeechRecognition();
			}

			if (xhr.status >= 400)
			{
				console.error("bad server, username or password");
			}
		};
		xhr.open("GET", "https://" + server + '/ofmeet/jitsi-meet/config.js', true);
		xhr.setRequestHeader("content-type", "application/javascript");
		xhr.setRequestHeader("accept", "application/javascript");		
		xhr.setRequestHeader("authorization", "Basic " + btoa(username + ":" + password));		
		xhr.send();	
	}
	
	lynk.logoff = function()
	{	
		if (lynk.connection) lynk.connection.disconnect();
		
		var items = Object.getOwnPropertyNames(lynk.conferences);	

		for(var z = 0; z<items.length; z++)
		{
			cleanupConnection(items[z]);			
		}
		
		console.log("Etherlynk logoff ok");		
	}	
	
	lynk.join = function(name, server, domain, params)
	{
		console.log("Etherlynk join",  name, server, domain);
		
		var getUserMediaFailure = function(e) 
		{
		    	console.error('getUserMedia failed:', e);
		}

		var getUserMediaSuccess = function(stream) 
		{
		     	console.log('getUserMedia ok:', stream);
		     	
		     	setupLocalAudio(name, stream)
		     
			var session = null;

			try {
				lynk.conferences[name] = lynk.sipUI.invite(name, 
				{
				    media : {
					stream      : stream,
					constraints : { audio : true, video : false },
					render      : { remote : setupRemoteAudio(name)},
				    }
				});

				lynk.conferences[name].direction = 'outgoing';
				lynk.conferences[name].sessionId  = name;

			} catch(e) {
				throw(e);
			}		     
		}
		
		navigator.getUserMedia({ audio : true, video : false }, getUserMediaSuccess, getUserMediaFailure);				
	}

	lynk.mute = function(name)
	{
		lynk.localAudioTracks[name].enabled = !lynk.localAudioTracks[name].enabled;
	}
	
	lynk.leave = function(name)
	{
		
		if (Object.getOwnPropertyNames(lynk.conferences).length == 1)
		{
			sendSpeechRecognition()
			lynk.recognition.stop();
			console.log("Etherlynk recognition stopped");				
		}
		
		if (lynk.conferences[name])
		{	
			cleanupConnection(name);			
			console.log("Etherlynk leave " + name);			
		}		
	}
	
	lynk.send = function(to, json)
	{
		if (json != null && typeof json === 'object')
		{		
			lynk.connection.sendIQ($iq({type:"set", to: to}).c("etherlynk", {xmlns: 'jabber:x:etherlynk'}).t(JSON.stringify(json)).up(),
			
				function(response) 
				{
					console.log("lynk.send.response", response);
				}, 
				
				function(error) 
				{
					console.log("lynk.send.error", error);
				}
			);
		}
	},	

	lynk.remoteAudioElements = {};
	lynk.localAudioTracks = {};
	lynk.conferences = {};
	
    	return lynk;
    	
}(etherlynkFS || {}));