window.addEventListener("load", function()
{
    var background = chrome.extension.getBackgroundPage();
    var status = document.getElementById("status");

    if (window.localStorage["store.settings.server"])
    {
        var server = JSON.parse(window.localStorage["store.settings.server"]);
        var domain = JSON.parse(window.localStorage["store.settings.domain"]);

        var uportconnect = window.uportconnect
        var uport = new uportconnect.Connect(i18n.get("manifest_shortExtensionName"), {network: i18n.get("uport_ethereum_network"), clientId: i18n.get("uport_client_id"), signer: uportconnect.SimpleSigner(i18n.get("uport_signer"))});

        uport.requestCredentials({requested: ['name', 'email', 'phone', 'country', 'avatar']}).then((credentials) => {
            console.log("Credentials", credentials);

            status.innerHTML = "Please wait, processing..";

            var url = "https://" + server + "/rest/api/restapi/v1/ask/uport/register";
            var options = {method: "POST", body: JSON.stringify({name: credentials.name, email: credentials.email, phone: credentials.phone, country: credentials.country, address: credentials.address, publicKey: credentials.publicKey, avatar: credentials.avatar})};

            console.log("uport rest", url, options);

            fetch(url, options).then(function(response){ return response.text()}).then(function(userpass)
            {
                try {
                    userpass = JSON.parse(userpass);

                    console.log('uport register ok', userpass);

                    status.innerHTML = "";

                    window.localStorage["store.settings.publicKey"] =   JSON.stringify(credentials.publicKey);
                    window.localStorage["store.settings.address"] =     JSON.stringify(credentials.address);
                    window.localStorage["store.settings.email"] =       JSON.stringify(credentials.email);
                    window.localStorage["store.settings.phone"] =       JSON.stringify(credentials.phone);
                    window.localStorage["store.settings.country"] =     JSON.stringify(credentials.country);
                    window.localStorage["store.settings.displayname"] = JSON.stringify(credentials.name);

                    window.localStorage["store.settings.username"] = JSON.stringify(userpass.username);
                    window.localStorage["store.settings.password"] = JSON.stringify("token-" + btoa(userpass.password));

                    if (credentials.avatar && credentials.avatar.uri)
                    {
                        window.localStorage["store.settings.avatar"] = JSON.stringify(credentials.avatar.uri);

                        var avatarError = function (error)
                        {
                            console.error("uploadAvatar - error", error);
                            status.innerHTML = '<b>picture/avatar cannot be uploaded and saved</b>';
                        }

                        var jid = userpass.username + "@" + domain
                        var sourceImage = new Image();

                        sourceImage.onload = function() {
                            var canvas = document.createElement("canvas");
                            canvas.width = 32;
                            canvas.height = 32;
                            canvas.getContext("2d").drawImage(sourceImage, 0, 0, 32, 32);

                            background.getVCard(jid, function(vCard)
                            {
                                console.log("uploadAvatar - get vcard", vCard);
                                vCard.avatar = canvas.toDataURL();

                                background.setVCard(vCard, function(resp)
                                {
                                    console.log("uploadAvatar - set vcard", resp);
                                    setTimeout(function() {background.reloadApp();}, 500);

                                }, avatarError);

                            }, avatarError);
                        }

                        sourceImage.src = credentials.avatar.uri;
                    }
                    else {
                        background.reloadApp();
                    }

                } catch (e) {
                    console.error('Credentials error', e);
                    status.innerHTML = "uport registration failed";
                }

            }).catch(function (err) {
                console.error('Credentials error', err);
                status.innerHTML = err;
            });

        }, function(err) {
            console.error("Credentials", err);
            status.innerHTML = err;
        });

    } else {
       status.innerHTML = i18n.get("Please provide server and domain");
    }
});