window.addEventListener("load", function()
{
    var background = chrome.extension.getBackgroundPage();
    var status = document.getElementById("status");

    if (window.localStorage["store.settings.server"])
    {
        var server = JSON.parse(window.localStorage["store.settings.server"]);

        var uportconnect = window.uportconnect
        var uport = new uportconnect.Connect('Etherlynk', {network: 'rinkeby'});

        uport.requestCredentials().then((credentials) => {
            console.log("Credentials", credentials);

            status.innerHTML = "Please wait, processing..";

            var url = "https://" + server + "/rest/api/restapi/v1/ask/uport/register";
            var options = {method: "POST", body: JSON.stringify({name: credentials.name, address: credentials.address, publicKey: credentials.publicKey})};

            console.log("uport rest", url, options);

            fetch(url, options).then(function(response){ return response.text()}).then(function(userpass)
            {
                try {
                    userpass = JSON.parse(userpass);

                    console.log('uport register ok', userpass);

                    status.innerHTML = "User registered";

                    window.localStorage["store.settings.publicKey"] = JSON.stringify(credentials.publicKey);
                    window.localStorage["store.settings.address"] = JSON.stringify(credentials.address);
                    window.localStorage["store.settings.displayname"] = JSON.stringify(credentials.name);
                    window.localStorage["store.settings.username"] = JSON.stringify(userpass.username);
                    window.localStorage["store.settings.password"] = JSON.stringify("token-" + btoa(userpass.password));

                    background.reloadApp();

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