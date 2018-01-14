var bgWindow = null;
var etherlynkobj = null;
var channel = null
var active = null;

window.addEventListener("unload", function()
{
    console.log("popup unloaded");
    etherlynkobj.loaddefaults();
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

        });

        channel.onDisconnect.addListener(function()
        {
            console.log("channel disconnect");
        });

        document.body.addEventListener('etherlynk.event.held', function (e) {
            handleButtonHeld(e.detail.button);
        }, false);


        document.body.addEventListener('etherlynk.event.buttondown', function (e) {
            handleButtonPress(e.detail.button);
        }, false);

     document.body.addEventListener('webmidievent', function (e)
     {
        handleSlider(e.detail.data2, e.detail.data3);

     }, false);

        setupApc();
    });
});


function setupApc()
{
    active = {page: 1, call: null, conference: []};

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
            }
        }
    }

    etherlynkobj.data=buttonmap;
}

function setPage(p, buttonmap)
{
    for (var i=1; i<9; i++)
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
            }
        }
    }
}

function setButton(data, buttonmap)
{
    var index = buttonmap.findIndex(x => x[0]==data[0]);
    buttonmap[index]=data
}

function handleButtonPress(button)
{
    console.log("handleButtonPress", button);

    if (button > 81 && button < 87)
    {
        var p = button - 81;

        if (bgWindow.getSetting("pageEnabled_" + p, false))
        {
            active.page = p;
            bgWindow.setSetting("selectedPage", p);
            var buttonmap = etherlynkobj.data;

            for (var i=82; i<87; i++)
            {
                var page = i - 81;

                if (bgWindow.getSetting("pageEnabled_" + page, false))
                {
                    var label = bgWindow.getSetting("pageLabel_" + page, "Page " + page);
                    setButton([i, null, label], buttonmap);
                }
            }

            var label = bgWindow.getSetting("pageLabel_" + p, "Page " + p);
            setButton([button, "green", label], buttonmap);
            setPage(p, buttonmap);

            etherlynkobj.data=buttonmap;
        }
    }
}

function handleButtonHeld(button)
{
    console.log("handleButtonHeld", button);
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
        var index = slider - 47;

        if (active.conference[index])
        {
            var audio = bgWindow.document.getElementById("remoteAudio-" + active.conference[index]);
            if (audio) audio.volume = value /128;

            var audioSip = bgWindow.document.getElementById("remoteAudio-sip-" + active.conference[index]);
            if (audioSip) audioSip.volume = value /128;
        }
    }
}