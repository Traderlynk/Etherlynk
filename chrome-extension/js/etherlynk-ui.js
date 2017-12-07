function getEtherlynks()
{
    lynkUI.calls = [];
    lynkUI.conferences = [];
    lynkUI.timeouts = [];
    lynkUI.actions = [];
    lynkUI.currentLynk = null;
    lynkUI.presence = {};
    lynkUI.participants = {};
    lynkUI.sip = {};

    resetMidiLights()

    etherlynkXmpp.fetchEtherlynks(function(lynk)
    {
        handleEtherlynk(lynk);
    });

    $(document).bind("ofmeet.user.presence", function(event, presence)
    {
        //console.log'ofmeet.user.presence', presence);

        var pres = null;
        if (presence.type != "unavailable") pres = "gray";

        lynkUI.presence[presence.from] = pres;

        for(var z = 0; z<lynkUI.calls.length; z++)
        {
            if (lynkUI.calls[z])
            {
                var lynk = lynkUI.calls[z].lynk;

                if (presence.from == lynk.jid)
                {
                    changeButton(parseInt(lynk.pinId), pres, lynk.name);
                    lynk.presence = pres;
                    break;
                }
            }
        }
    });

    $(document).bind("ofmeet.user.active", function(event, activity)
    {
        if (activity.id == lynkUI.username) return;

        for(var z = 0; z<lynkUI.calls.length; z++)
        {
            if (lynkUI.calls[z])
            {
                var lynk = lynkUI.calls[z].lynk;

                if (activity.to == lynk.jid)
                {
                    //console.log'ofmeet.user.active', activity, lynk);

                    changeButton(parseInt(lynk.pinId), "yellow", lynk.name);
                    lynk.etherlynk = activity.name;

                    if (!lynkUI.participants[activity.name]) lynkUI.participants[activity.name] = 0;
                    lynkUI.participants[activity.name]++;
                    break;
                }
            }
        }
    });

    $(document).bind("ofmeet.user.inactive", function(event, activity)
    {
        if (activity.id == lynkUI.username) return;

        if (lynkUI.currentLynk && lynkUI.currentLynk.jid == activity.to)
        {
            clearActiveButton();
        }

        for(var z = 0; z<lynkUI.calls.length; z++)
        {
            if (lynkUI.calls[z])
            {
                var lynk = lynkUI.calls[z].lynk;

                if (activity.to == lynk.jid)
                {
                    //console.log'ofmeet.user.inactive', activity, lynk);

                    lynkUI.participants[activity.name]--;
                    changeButton(parseInt(lynk.pinId), lynk.presence, lynk.name);

                    break;
                }
            }
        }
    });

    $(document).bind('ofmeet.conversation.sip.bye', function(event, bye)
    {
        console.log('ofmeet.user.gone', bye);

        if (lynkUI.ringtone) stopTone();

        chrome.notifications.clear(bye.id, function(wasCleared)
        {
            //console.log"call cleared", wasCleared);
        });

        for(var z = 0; z<lynkUI.calls.length; z++)
        {
            if (lynkUI.calls[z])
            {
                var lynk = lynkUI.calls[z].lynk;

                if (bye.id.indexOf(lynk.id) > -1)
                {
                    changeButton(parseInt(lynk.pinId), lynk.presence, lynk.name);
                    clearActiveButton();
                    setActiveLynk(null);
                    break;
                }
            }
        }
	});

    $(document).bind('ofmeet.conversation.sip.outgoing', function(event, outgoing)
    {
		console.log("ofmeet.conversation.sip.outgoing", outgoing);

        for(var z = 0; z<lynkUI.calls.length; z++)
        {
            if (lynkUI.calls[z])
            {
                var lynk = lynkUI.calls[z].lynk;

                if (outgoing.id == lynk.id)
                {
					console.log("ofmeet.conversation.sip.outgoing found", lynk);

					makeCall(lynkUI.calls[lynk.pinId]);
					break
				}
			}
		}
	});


    $(document).bind('ofmeet.conversation.sip.incoming', function(event, invite)
    {
		console.log("ofmeet.conversation.sip.incoming", invite);

        for(var z = 0; z<lynkUI.calls.length; z++)
        {
            if (lynkUI.calls[z])
            {
                var lynk = lynkUI.calls[z].lynk;

                if (invite.id == lynk.id)
                {
					console.log("ofmeet.conversation.sip.accepted found", lynk);

					if (invite.autoAccept)
					{
						etherlynk.acceptSipCall();
						lynk.autoAccept = true;
						setActiveLynk(lynk);

						etherlynk.muteLocal(lynk.etherlynk, true);
						changeButton(parseInt(lynk.pinId), "red", lynk.name);
					}
					else {
						changeButton(parseInt(lynk.pinId), "redflash", lynk.name);
						startTone("Diggztone_Vibe");

						lynk.autoAccept = false;

						notifyText(lynk.name, lynk.jid, null, [{title: "Accept Conversation?", iconUrl: chrome.extension.getURL("success-16x16.gif")}, {title: "Reject Conversation?", iconUrl: chrome.extension.getURL("forbidden-16x16.gif")}], function(notificationId, buttonIndex)
						{
							//console.log"handleAction callback", notificationId, buttonIndex);

							if (buttonIndex == 0)   // accept
							{
								etherlynk.acceptSipCall();
								setActiveLynk(lynk);
							}
							else

							if (buttonIndex == 1)   // reject
							{
								changeButton(parseInt(lynk.pinId), lynk.presence, lynk.name);
								if (lynkUI.ringtone) stopTone();
							}

						}, invite.id);
					}
					break;
				}
			}
		}
	});

    $(document).bind('ofmeet.conversation.invitation', function(event, invite)
    {
        //console.log'ofmeet.conversation.invitation', invite);

        var jid = Strophe.getBareJidFromJid(invite.from);
        var room = Strophe.getNodeFromJid(invite.id);

        for(var z = 0; z<lynkUI.calls.length; z++)
        {
            if (lynkUI.calls[z])
            {
                var lynk = lynkUI.calls[z].lynk;

                if (jid == lynk.jid)
                {
					lynk.etherlynk = room;
					lynk.mode = invite.mode;

					if (invite.autoAccept)
					{
						lynk.autoAccept = true;

						etherlynk.join(lynk.etherlynk, lynk.server, lynk.domain, {mute: true});
						setActiveLynk(lynk);

						etherlynk.muteLocal(lynk.etherlynk, true);
						changeButton(parseInt(lynk.pinId), "red", lynk.name);
					}
					else {
						changeButton(parseInt(lynk.pinId), "redflash", lynk.name);
						startTone("Diggztone_Vibe");

						lynk.autoAccept = false;

						notifyText(lynk.name, lynk.jid, null, [{title: "Accept Conversation?", iconUrl: chrome.extension.getURL("success-16x16.gif")}, {title: "Reject Conversation?", iconUrl: chrome.extension.getURL("forbidden-16x16.gif")}], function(notificationId, buttonIndex)
						{
							//console.log"handleAction callback", notificationId, buttonIndex);

							if (buttonIndex == 0)   // accept
							{
								etherlynk.join(lynk.etherlynk, lynk.server, lynk.domain);
								setActiveLynk(lynk);
							}
							else

							if (buttonIndex == 1)   // reject
							{
								changeButton(parseInt(lynk.pinId), lynk.presence, lynk.name);
								if (lynkUI.ringtone) stopTone();
								etherlynkXmpp.leaveConference(lynk);
							}

						}, room);
					}

					break;
                }
            }
        }
    });

    $(document).bind('ofmeet.conference.joined', function(event, conf)
    {
        //console.log'ofmeet.media.joined', event, conf);

        for(var z = 0; z<lynkUI.conferences.length; z++)
        {
            if (lynkUI.conferences[z])					// auto-mute hoot conferences
            {
                var lynk = lynkUI.conferences[z].lynk;

                if (conf.name == lynk.etherlynk)
                {
                    etherlynk.mute(lynk.etherlynk);
                    changeButton(64 + parseInt(lynk.pinId), "red", lynk.name);
                    break;
                }
            }
        }

        if (lynkUI.currentLynk)
        {
			var status = "green";
			if (lynkUI.currentLynk.autoAccept) status = "red";

            changeButton(parseInt(lynkUI.currentLynk.pinId), status, lynkUI.currentLynk.name);
            changeButton(98, "green", "CLEAR");

            notifyText(lynkUI.currentLynk.name, lynkUI.currentLynk.jid, null, [{title: "Clear Conversation?", iconUrl: chrome.extension.getURL("success-16x16.gif")}], function(notificationId, buttonIndex)
            {
                //console.log"active call callback", notificationId, buttonIndex);

                if (buttonIndex == 0)   // terminate
                {
                    etherlynkXmpp.leaveConference(lynkUI.currentLynk);
                    etherlynk.leave(lynkUI.currentLynk.etherlynk);
                }

            }, lynkUI.currentLynk.etherlynk);
        }
    });

    $(document).bind('ofmeet.conference.left', function(event, conf)
    {
        //console.log'ofmeet.conference.left', event, conf);

        for(var z = 0; z<lynkUI.conferences.length; z++)
        {
            if (lynkUI.conferences[z])
            {
                var lynk = lynkUI.conferences[z].lynk;

                if (conf.name == lynk.etherlynk)
                {
                    var color = lynkUI.participants[lynk.etherlynk] && lynkUI.participants[lynk.etherlynk] > 0 ? "yellow" : lynk.presence;
                    changeButton(64 + parseInt(lynk.pinId), color, lynk.name);
                    break;
                }
            }
        }

        if (lynkUI.currentLynk)
        {
            clearActiveButton();
            setActiveLynk(null);
        }
    });

    $(document).bind('ofmeet.track.removed', function(event, conf)
    {
        if (lynkUI.ringtone) stopTone();
    });

    $(document).bind('ofmeet.track.added', function(event, conf)
    {
        if (lynkUI.ringtone) stopTone();
    });

    $(document).bind('ofmeet.user.joined', function(event, conf)
    {

    });

    $(document).bind('ofmeet.user.left', function(event, conf)
    {

    });

    $(document).bind('ofmeet.user.gone', function(event, conf)
    {
        //console.log'ofmeet.user.gone', conf, lynkUI.participants[conf.name]);

        if (conf.id == lynkUI.username) return;

        if (lynkUI.ringtone) stopTone();

        chrome.notifications.clear(conf.name, function(wasCleared)
        {
            //console.log"call cleared", wasCleared);
        });

        for(var z = 0; z<lynkUI.calls.length; z++)
        {
            if (lynkUI.calls[z])
            {
                var lynk = lynkUI.calls[z].lynk;

                if (conf.user == lynk.jid && conf.name == lynk.etherlynk)
                {
                    changeButton(parseInt(lynk.pinId), lynk.presence, lynk.name);
                    break;
                }
            }
        }

        etherlynk.leave(conf.name);
    });

	setTimeout(function()
	{
		// signal we are ready
		changeButton(89, "green", "");
	}, 3000);
}

function handleEtherlynk(lynk)
{
    //console.log"handleEtherlynk", lynk);

    if (!lynk.pinId) return;

    if (lynk.pinned && lynk.pinned == "true")
    {
        lynkUI.conferences[lynk.pinId] = {button: [64 + parseInt(lynk.pinId), null, lynk.name], lynk: lynk};

        if (!lynk.server) lynk.server = lynkUI.server;
        if (!lynk.domain) lynk.domain = lynkUI.domain;
    }
    else {
        lynkUI.calls[lynk.pinId] = {button: [parseInt(lynk.pinId), lynk.presence, lynk.name], lynk: lynk};
    }
}

function resetMidiLights()
{
    for (var i=0; i<64; i++)
    {
        Tletherlynk.Midi.sendlight("144", i, 0)
    }

    for (var i=64; i<72; i++)
    {
        Tletherlynk.Midi.sendlight("144", i, 0)
    }

    var labels = ["Audio", "Video", "Screen", "", "Auto Answer", "Private", "Invite/Add", ""]

    for (var i=82; i<90; i++)
    {
        Tletherlynk.Midi.sendlight("144", i, 0);
        lynkUI.actions[i - 82] = {button: [i, null, labels[i - 82]]}
    }

    Tletherlynk.Midi.sendlight("144", 98, 0);
    lynkUI.actions[8] = {button: [98, null, "CLEAR"]};
}


function changeButton(button, color, label)
{
    if (lynkUI.port)
    {
        lynkUI.port.postMessage({action: "button", data: [button, color, label]});
    }

    var colorcode = "00";

    switch(color) {
        case "red":
        colorcode="03";
        break;
        case "green":
        colorcode="01";
        break;
        case "yellow":
        colorcode="05";
        break;
        case "redflash":
        colorcode="04";
        break;
        case "greenflash":
        colorcode="02";
        break;
        case "yellowflash":
        colorcode="06";
        break;
        default:
        colorcode="00";
    }

    if (button > 63  && color == "red") colorcode = "01";
    if (button > 63  && color == "redflash") colorcode = "02";

    Tletherlynk.Midi.sendlight("144", button, colorcode)        // midi
    handleButton(button, [button, color, label]);           // UI
}

function handleButton(button, newButton)
{
    var oldData = {};

    if (button > -1 && button < 64)
    {
        if (!lynkUI.calls[button])
        {
            lynkUI.calls[button] = {}
        }

        oldData = lynkUI.calls[button];
        oldData.type = "call";
        if (newButton) lynkUI.calls[button].button = newButton;
    }
    else

    if (button > 63 && button < 72)
    {
        if (!lynkUI.conferences[button - 64])
        {
            lynkUI.conferences[button - 64] = {}
        }

        oldData = lynkUI.conferences[button - 64];
        oldData.type = "conference";
        if (newButton) lynkUI.conferences[button - 64].button = newButton;
    }
    else

    if (button > 81 && button < 90)
    {
        oldData = lynkUI.actions[button - 82];
        oldData.type = "action";
        lynkUI.actions[button - 82] = {button: newButton};
    }
    else {
        oldData.type = "clear";
        lynkUI.actions[8] = {button: newButton};
    }

    return oldData;
}

function clearActiveCall()
{
    if (lynkUI.currentLynk && lynkUI.currentLynk.etherlynk)
    {
        etherlynk.leave(lynkUI.currentLynk.etherlynk);

        clearActiveButton();
        setActiveLynk(null);
    }
}

function clearActiveButton()
{
    if (lynkUI.currentLynk)
    {
        chrome.notifications.clear(lynkUI.currentLynk.etherlynk, function(wasCleared)
        {
            //console.log"call cleared", wasCleared);
        });

        var color = lynkUI.participants[lynkUI.currentLynk.etherlynk] && lynkUI.participants[lynkUI.currentLynk.etherlynk] > 0 ? "yellow" : lynkUI.currentLynk.presence;
        changeButton(parseInt(lynkUI.currentLynk.pinId), color, lynkUI.currentLynk.name);
        changeButton(98, null, "CLEAR");

        lynkUI.currentLynk.autoAccept = false;
    }
}

function setActiveLynk(lynk)
{
    if (lynk)
    {
        lynk.active = true;
        etherlynkXmpp.broadcastConference(lynk, "active");

    } else {
        if (lynkUI.currentLynk)
        {
			lynkUI.currentLynk.active = false;
        	if (!lynkUI.currentLynk.barge) etherlynkXmpp.broadcastConference(lynkUI.currentLynk, "inactive");
		}
    }

    lynkUI.currentLynk = lynk;
}

function makeCall(data)
{
	clearActiveCall();
	startTone("ringback-uk");
	etherlynk.join(data.lynk.etherlynk, data.lynk.server, data.lynk.domain, {mute: false, sip: lynkUI.enableSip, xmpp: data.lynk.type == "xmpp", jid: data.lynk.jid});
	changeButton(data.button[0], "greenflash", data.button[2]);

	if (data.lynk.jid)
	{
		setActiveLynk(data.lynk);

		if (data.lynk.type == "xmpp")
		{
			etherlynkXmpp.inviteToConference(data.lynk);
		}
	}
}

function handleButtonPress(button)
{
	// actions for button presses are handled here

    var data = handleButton(button);
    //console.log("button press", button, data, lynkUI.currentLynk);

    if (data.type == "call")
    {
		if (lynkUI.actions[0].button[1] == "green") // audio button
		{
			if (data.button[1] == data.lynk.presence)       // idle
			{
				makeCall(data);
			}
			else

			if (data.button[1] == "redflash")           // ringing
			{
				clearActiveCall();

				etherlynk.join(data.lynk.etherlynk, data.lynk.server, data.lynk.domain);
				setActiveLynk(data.lynk);

				chrome.notifications.clear(data.lynk.etherlynk, function(wasCleared)
				{
					//console.log"call answered", wasCleared);
				});
			}
			else

			if (data.button[1] == "green")             // connected
			{
				etherlynk.mute(data.lynk.etherlynk);
				changeButton(button, "red", data.button[2])
			}
			else

			if (data.button[1] == "red")               // held/muted
			{
				etherlynk.mute(data.lynk.etherlynk);
				changeButton(button, "green", data.button[2])
			}
			else

			if (data.button[1] == "greenflash")       // originate/delivered
			{
				changeButton(button, data.lynk.presence, data.button[2])
				etherlynk.leave(data.lynk.etherlynk);
			}
			else

			if (data.button[1] == "yellow")       // busy elsewhere
			{
				lynkUI.currentLynk = data.lynk;
				lynkUI.currentLynk.barge = true;
				etherlynk.join(data.lynk.etherlynk);
			}
		}
		else

		if (lynkUI.actions[2].button[1] == "green") // screen share button toggle
		{
			openVideo(data.lynk.etherlynk + "#config.startScreenSharing=true");
		}
		else

		if (lynkUI.actions[1].button[1] == "green") // video button toggle
		{
			openVideo(data.lynk.etherlynk);
		}
		else { // chat is default

			openPrivateChat(data.lynk);
		}
    }
    else

    if (data.type == "conference")
    {
		if (lynkUI.actions[0].button[1] == "green") // audio button
		{
			if (data.button[1] == "red")
			{
				etherlynk.muteLocal(data.lynk.etherlynk, false);
				changeButton(button, "redflash", data.button[2])
			}
			else

			if (data.button[1] == "redflash")
			{
				etherlynk.muteLocal(data.lynk.etherlynk, true);
				changeButton(button, "red", data.button[2]);
			}
		}
		else

		if (lynkUI.actions[2].button[1] == "green") // screen share button toggle
		{
			openVideo(data.lynk.etherlynk + "#config.startScreenSharing=true");
		}
		else

		if (lynkUI.actions[1].button[1] == "green") // video button toggle
		{
			openVideo(data.lynk.etherlynk);
		}
		else { // chat is default

			openChat(data.lynk.etherlynk);
		}
    }
    else

    if (button == 98) // handset button
    {
        if (lynkUI.currentLynk)
        {
			handleExit(lynkUI.currentLynk);
        }

    }
    else

    if (button == 83) // video button
    {
		changeButton(83, data.button[1] == "green" ? null : "green", "Video")
	}
	else

    if (button == 84) // screen share button
    {
		changeButton(84, data.button[1] == "green" ? null : "green", "Screen")
	}
	else

    if (button == 82) // audio button
    {
        for(var z = 0; z<lynkUI.conferences.length; z++)
        {
            if (lynkUI.conferences[z])
            {
                var lynk = lynkUI.conferences[z].lynk;

                if (data.button[1] == null)
                {
        			etherlynk.join(lynk.etherlynk, lynk.server, lynk.domain, {mute: true, sip: lynk.open == "true"});
				}
				else {
        			etherlynk.leave(lynk.etherlynk);
				}
            }
        }

        changeButton(82, data.button[1] == "green" ? null : "green", "Audio")
	}
}

function openChat(room)
{
    //console.log"openChat", parameter);

	var url = "groupchat/index.html"
	if (room) url = url + "?room=" + room;

	if (lynkUI.popup && lynkUI.port)
	{
		lynkUI.port.postMessage({action: "load", url: url});

	} else {
		openChatWindow(url);
	}
}

function openPrivateChat(lynk)
{
    //console.log"openChat", lynk);

	var url = "groupchat/index.html?jid=" + lynk.jid + "&name=" + lynk.name;

	if (lynkUI.popup && lynkUI.port)
	{
		lynkUI.port.postMessage({action: "load", url: url});

	} else {
		openChatWindow(url);
	}
}

function openVideo(parameter)
{
    //console.log"openVideo", parameter);

	if (lynkUI.popup && lynkUI.port)
	{
		lynkUI.port.postMessage({action: "load", url: "jitsi-meet/chrome.index.html?room=" + parameter});

	} else {
		openVideoWindow(parameter);
	}
}

function handleButtonHeld(button)
{
    var data = handleButton(button);
    //console.log"handleButtonHeld", data);

    if (data.type == "call")
    {
		if (!lynkUI.currentLynk) lynkUI.currentLynk = data.lynk;	// HACK TODO

        if (data.button[1] == "greenflash" || data.button[1] == "red" || data.button[1] == "green")
        {
			handleExit(data.lynk);
        }
    }
}

function handleExit(lynk)
{
	if (lynk.type == "xmpp")
	{
		etherlynkXmpp.leaveConference(lynk);
	}
	else

	if (lynk.type == "sip")
	{
		etherlynk.hangupSipCall();
	}

	etherlynk.leave(lynk.etherlynk);
}


function handleSlider(slider, value)
{
    //console.log("handleSlider", slider, value, lynkUI.currentLynk);

    if (slider == 56)       // handset slider
    {
        if (lynkUI.currentLynk != null)
        {
            var audio = document.getElementById("remoteAudio-" + lynkUI.currentLynk.etherlynk);
            if (audio) audio.volume = value /128;

            var audioSip = document.getElementById("remoteAudio-sip-" + lynkUI.currentLynk.etherlynk);
            if (audioSip) audioSip.volume = value /128;
        }
    }
    else                // speakers

    if (lynkUI.conferences[slider - 48])
    {
        var lynk = lynkUI.conferences[slider - 48].lynk;

        if (lynk)
        {
            var audio = document.getElementById("remoteAudio-" + lynk.etherlynk);
            if (audio) audio.volume = value /128;

            var audioSip = document.getElementById("remoteAudio-sip-" + lynk.etherlynk);
            if (audioSip) audioSip.volume = value /128;
        }
    }
}
