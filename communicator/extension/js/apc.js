var bgWindow = null;
var etherlynkobj = null;
var channel = null
var active = null;

window.addEventListener("beforeunload", function(e)
{
    console.log("popup unloaded");
    clearAllCalls();
    etherlynkobj.loaddefaults();
    e.returnValue = 'Ok';
});

window.addEventListener("load", function()
{
    chrome.runtime.getBackgroundPage(function(win)
    {
        bgWindow = win;

        etherlynkobj = document.getElementById('app-content');
        etherlynkobj.timeoutval=500;

        channel = chrome.runtime.connect();
        console.log("channel initialised", channel);

        channel.onMessage.addListener(function (message)
        {
            handleButtonState(message);
        });

        channel.onDisconnect.addListener(function()
        {
            console.log("channel disconnect");
        });

        document.body.addEventListener('etherlynk.ui.event', function (e)
        {
            if (e.detail.data1 == 176)     // slider events
            {
                handleSlider(e.detail.data2, e.detail.data3);
            }
        });

        document.body.addEventListener('etherlynk.event.held', function (e)
        {
            handleButtonHeld(e.detail.button);
        });


        document.body.addEventListener('etherlynk.event.buttondown', function (e)
        {
            handleButtonPress(e.detail.button);
        });

        document.body.addEventListener('webmidievent', function (e)
        {
            handleSlider(e.detail.data2, e.detail.data3);
        });

        setupApc();
    });
});


function setupApc()
{
    active = {page: 1, call: null, calls: {}, buttons: {}};

    var page = bgWindow.getSetting("selectedPage", 1);

    var buttonmap=[
      [null],
      [56,null],[57,null],[58,null],[59,null],[60,null],[61,null],[62,null],[63,null],   [82,null],
      [48,null],[49,null],[50,null],[51,null],[52,null],[53,null],[54,null],[55,null],   [83,null],
      [40,null],[41,null],[42,null],[43,null],[44,null],[45,null],[46,null],[47,null],   [84,null],
      [32,null],[33,null],[34,null],[35,null],[36,null],[37,null],[38,null],[39,null],   [85,null],
      [24,null],[25,null],[26,null],[27,null],[28,null],[29,null],[30,null],[31,null],   [86,null],
      [16,null],[17,null],[18,null],[19,null],[20,null],[21,null],[22,null],[23,null],   [87,null],
      [8,null] ,[9,null] ,[10,null],[11,null],[12,null],[13,null],[14,null],[15,null],   [88,null],
      [0,null] ,[1,null] ,[2,null] ,[3,null] ,[4,null] ,[5,null] ,[6,null] ,[7,null] ,   [89,null],

      [64,null],[65,null],[66,null],[67,null],[68,null],[69,null],[70,null],[71,null],   [98, "red", "Clear"]
    ]

    for (var p=1; p<6; p++)
    {
        if (bgWindow.getSetting("pageEnabled_" + p, false))
        {
            var label = bgWindow.getSetting("pageLabel_" + p, "Page " + p);
            var index = 81 + p;

            setButton([index, null, label], buttonmap);

            if (p == page)
            {
                setButton([index, "green", label], buttonmap);
                setPage(p, buttonmap);
            }
        }
    }

    if (bgWindow.getSetting("speakersEnabled", false))
    {
        for (var s=1; s<9; s++)
        {
            if (bgWindow.getSetting("speakerEnabled_" + s, false))
            {
                var label = bgWindow.getSetting("speakerLabel_" + s, "Blank");
                var value = bgWindow.getSetting("speakerValue_" + s, null);
                var index = 63 + s;

                setButton([index, null, label], buttonmap);
                setupConference(index, label, value);
            }
        }
    }

    etherlynkobj.data=buttonmap;
}

function setPage(p, buttonmap)
{
    for (var i=1; i<8; i++)     // row 8 is soft key area
    {
        for (var j=1; j<9; j++)
        {
            var index = ((i - 1) * 8) + (j - 1);
            setButton([index, null], buttonmap);

            if (bgWindow.getSetting("cellEnabled_" + p + "_" + i + "_" + j, false))
            {
                var label = bgWindow.getSetting("cellLabel_" + p + "_" + i + "_" + j, "Blank");
                var value = bgWindow.getSetting("cellValue_" + p + "_" + i + "_" + j, null);

                setButton([index, null, label], buttonmap);
                setupCall(p, index, label, value);
            }
        }
    }
}

function setButton(data, buttonmap)
{
    var index = buttonmap.findIndex(x => x[0]==data[0]);
    buttonmap[index]=data
}

function setupCall(page, index, label, value)
{
    console.log("setupCall", page, index, label, value);

    var call = {page: page, index: index, label: label, value: value, state: "bye", count: 0, missed: 0};

    active.calls[value] = call;
    active.buttons[index] = call;
}

function setupConference(index, label, value)
{
    console.log("setupConference", index, label, value);

    var conference = {page: 0, index: index, label: label, value: value, state: "bye"};

    active.calls[value] = conference;
    active.buttons[index] = conference;

    bgWindow.etherlynk.dial(value, {});
}

function clearAllCalls()
{
    var items = Object.getOwnPropertyNames(active.calls);

    for(var z = 0; z<items.length; z++)
    {
        var call = active.calls[items[z]];

        if (call.state == "accepted" || call.state == "muted")
        {
            bgWindow.etherlynk.hangup(call.value);
        }
    }
}

function handleButtonPress(button)
{
    if (button > 81 && button < 87)
    {
        handlePaging(button);
    }
    else

    if (button > 63 && button < 72)
    {
        handleConferenceAction(button);
    }
    else

    if (button > -1 && button < 64)
    {
        handleCallAction(button);
    }
    else

    if (button == 98)
    {
        if (active.call)
        {
            var call = active.calls[active.call];
            if (call) handleButtonHeld(call.index);
        }
    }
}

function handlePaging(button)
{
    console.log("handlePaging", button);

    // paging key pressed

    var p = button - 81;

    if (bgWindow.getSetting("pageEnabled_" + p, false))
    {
        active.page = p;
        bgWindow.setSetting("selectedPage", p);
        var buttonmap = etherlynkobj.data;

        // first clear all pages

        for (var i=82; i<87; i++)
        {
            var page = i - 81;

            if (bgWindow.getSetting("pageEnabled_" + page, false))
            {
                var label = bgWindow.getSetting("pageLabel_" + page, "Page " + page);
                setButton([i, null, label], buttonmap);
            }
        }

        // then show selected page

        var label = bgWindow.getSetting("pageLabel_" + p, "Page " + p);
        setButton([button, "green", label], buttonmap);
        setPage(p, buttonmap);

        etherlynkobj.data=buttonmap;
    }
}

function handleSlider(slider, value)
{
    if (slider == 56)       // handset slider
    {
        if (active.call)
        {
            var audio = bgWindow.document.getElementById("remoteAudio-" + active.call);
            if (audio) audio.volume = value /128;

            var audioSip = bgWindow.document.getElementById("remoteAudio-sip-" + active.call);
            if (audioSip) audioSip.volume = value /128;
        }
    }
    else                // speakers

    if (slider > 47 && slider < 56)
    {
        var index = (slider - 47) + 63;

        if (active.buttons[index])
        {
            var id = active.buttons[index].value;

            var audio = bgWindow.document.getElementById("remoteAudio-" + id);
            if (audio) audio.volume = value /128;

            var audioSip = bgWindow.document.getElementById("remoteAudio-sip-" + id);
            if (audioSip) audioSip.volume = value /128;
        }
    }
}

function handleButtonState(message)
{
    // {event: "connecting", id: "1002", uri: "sip:1002@192.168.1.252"}
    // connecting=yellow, accepted=green, bye=off

    console.log("handleButtonState", message);

    if (message.event == "etherlynk.event.sip.join" || message.event == "etherlynk.event.sip.leave")
    {
        var call = active.calls[message.conference];

        if (call)
        {
            console.log("handleButtonState call", call);

            if (message.event == "etherlynk.event.sip.join") call.count++;
            if (message.event == "etherlynk.event.sip.leave") call.count--;

            var badge = call.count > 1 ? call.count : null;

            if (active.page == call.page || call.page == 0)
            {
                if (call.state == "bye")
                {
                    var color = null;

                    if (call.count > 0)
                    {
                        color = "yellow";

                        if (call.count == 1)
                        {
                            if (message.event == "etherlynk.event.sip.join" && bgWindow.pade.sip.authUsername != message.source)
                            {
                                color = "redflash";
                                call.missed++;
                                bgWindow.notifyIncomingSipCall("Incoming Call", call.label, call.value);
                            }

                            if (message.event == "etherlynk.event.sip.leave" && bgWindow.pade.sip.authUsername == message.source)
                            {
                                color = "yellowflash";
                            }

                        }
                    }

                    if (color == null)
                    {
                        badge = call.missed > 0 ? call.missed : null;
                        call.missed = 0;
                    }

                    etherlynkobj.setbutton([call.index, color, call.label, badge]);
                }
                else

                if (call.state == "accepted" || call.state == "muted")
                {
                    etherlynkobj.setbutton([call.index, call.state == "accepted" ? "green" : "red", call.label, badge]);
                }

                if (call.page != 0 && bgWindow.pade.sip.authUsername == message.source)  // handset only
                {
                    if (message.event == "etherlynk.event.sip.join")
                    {
                        bgWindow.notifyAcceptedSipCall("Active Call", call.label, call.value);
                    }
                    else

                    if (message.event == "etherlynk.event.sip.leave")
                    {
                        bgWindow.clearNotification(call.value);
                    }
                }

            } else {    // soft keys TODO

            }
        }
        return;
    }

    if (active.calls[message.id])
    {
        var call = active.calls[message.id];
        var badge = call.count > 1 ? call.count : null;

        if (active.page == call.page || call.page == 0)
        {
            if (message.event == "connecting")
            {
                etherlynkobj.setbutton([call.index, "greenflash", call.label, badge]);
                call.state = message.event;
            }
            else

            if (message.event == "accepted")
            {
                if (call.page == 0)     // speaker
                {
                    var muted = bgWindow.etherlynk.muteLocal(message.id, true);
                    etherlynkobj.setbutton([call.index, muted ? "red": "redflash", call.label, badge]);
                    call.state = muted ? "muted": message.event;


                } else {
                    active.call = call.value;
                    call.missed--;
                    etherlynkobj.setbutton([call.index, "green", call.label, badge]);
                    call.state = message.event;
                }
            }
            else

            if (message.event == "bye" || message.event == "rejected" || message.event == "failed")
            {
                if (call.page != 0 && active.call == message.id) active.call = null;
                etherlynkobj.setbutton([call.index, call.count == 0 ? null : "yellow", call.label, badge]);
                call.state = message.event;
            }

        } else {    // soft keys TODO

        }
    }
}

function muteActiveCall(call)
{
    if (active.call && active.call != call.value)
    {
        var activeCall = active.calls[active.call];
        var badge = activeCall.count > 0 ? call.count : null;
        var muted = bgWindow.etherlynk.muteLocal(active.call, true);
        if (muted) activeCall.state = "muted";

        etherlynkobj.setbutton([activeCall.index, muted ? "red" : "green", activeCall.label, badge]);
    }
}

function handleButtonHeld(button)
{
    console.log("handleButtonHeld", button);

    if (active.buttons[button])
    {
        var call = active.buttons[button];
        bgWindow.etherlynk.hangup(call.value);
    }
}

function handleConferenceAction(button)
{
    console.log("handleConferenceAction", button, active);

    if (active.buttons[button])
    {
        var call = active.buttons[button];
        var badge = call.count > 1 ? call.count : null;

        if (call.state == "bye")
        {
            bgWindow.etherlynk.dial(call.value, {});
        }
        else

        if (call.state == "connecting" || call.state == "progress")
        {
            bgWindow.etherlynk.hangup(call.value);
        }
        else

        if (call.state == "accepted")
        {
            var muted = bgWindow.etherlynk.muteLocal(call.value, true);
            etherlynkobj.setbutton([call.index, muted ? "red" : "redflash", call.label, badge]);
            if (muted) call.state = "muted";
        }
        else

        if (call.state == "muted")
        {
            var muted = bgWindow.etherlynk.muteLocal(call.value, false);
            etherlynkobj.setbutton([call.index, muted ? "red" : "redflash", call.label, badge]);

            if (!muted)
            {
                call.state = "accepted";
            }
        }
    }
}

function handleCallAction(button)
{
    console.log("handleCallAction", button, active);

    if (active.buttons[button])
    {
        var call = active.buttons[button];
        var badge = call.count > 1 ? call.count : null;

        if (call.state == "bye")
        {
            muteActiveCall(call);
            bgWindow.etherlynk.dial(call.value, {});
        }
        else

        if (call.state == "connecting" || call.state == "progress")
        {
            bgWindow.etherlynk.hangup(call.value);
        }
        else

        if (call.state == "accepted")
        {
            var muted = bgWindow.etherlynk.muteLocal(call.value, true);
            etherlynkobj.setbutton([call.index, muted ? "red" : "green", call.label, badge]);
            if (muted) call.state = "muted";
        }
        else

        if (call.state == "muted")
        {
            muteActiveCall(call);

            var muted = bgWindow.etherlynk.muteLocal(call.value, false);
            etherlynkobj.setbutton([call.index, muted ? "red" : "green", call.label, badge]);

            if (!muted)
            {
                call.state = "accepted";
                active.call = call.value;
            }
        }
    }
}