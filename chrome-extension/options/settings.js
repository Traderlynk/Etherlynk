window.addEvent("domready", function () {

    doDefaults();

    new FancySettings.initWithManifest(function (settings)
    {
        var background = chrome.extension.getBackgroundPage();

        settings.manifest.connect.addEvent("action", function ()
        {
            reloadApp()
        });

        settings.manifest.popupWindow.addEvent("action", function ()
        {
            if (getSetting("popupWindow"))
            {
                chrome.browserAction.setPopup({popup: ""});

            } else {
                chrome.browserAction.setPopup({popup: "popup.html"});
            }
        });

        function reloadApp(){

            openAppWindow()
        }

	function openAppWindow()
	{
		if (window.localStorage["store.settings.server"] && window.localStorage["store.settings.domain"] && window.localStorage["store.settings.username"] && window.localStorage["store.settings.password"])
		{
			var lynks = {};

			lynks.server = JSON.parse(window.localStorage["store.settings.server"]);
			lynks.domain = JSON.parse(window.localStorage["store.settings.domain"]);
			lynks.username = JSON.parse(window.localStorage["store.settings.username"]);
			lynks.password = JSON.parse(window.localStorage["store.settings.password"]);

			if (lynks.server && lynks.domain && lynks.username && lynks.password)
			{
				background.reloadApp();
			}
			else {
				if (!lynks.server) settings.manifest.status.element.innerHTML = '<b>bad server</b>';
				if (!lynks.domain) settings.manifest.status.element.innerHTML = '<b>bad domain</b>';
				if (!lynks.username) settings.manifest.status.element.innerHTML = '<b>bad username</b>';
				if (!lynks.password) settings.manifest.status.element.innerHTML = '<b>bad password</b>';
			}

	     	} else settings.manifest.status.element.innerHTML = '<b>bad bad server, domain, username or password</b>';
	}
    });
});

function doDefaults()
{
    window.localStorage["store.settings.config"] = null;

    // preferences
    setSetting("popupWindow", true);
}
function setSetting(name, defaultValue)
{
    console.log("setSetting", name, defaultValue);

    if (!window.localStorage["store.settings." + name])
    {
        if (defaultValue) window.localStorage["store.settings." + name] = JSON.stringify(defaultValue);
    }
}

function getSetting(name)
{
    //console.log("getSetting", name);
    var value = null;

    if (window.localStorage["store.settings." + name])
    {
        value = JSON.parse(window.localStorage["store.settings." + name]);
    }

    return value;
}