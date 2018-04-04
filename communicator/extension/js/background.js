var pade = {}
var callbacks = {}

// strophe SASL

if (getSetting("useClientCert", false))
{
    console.log("useClientCert enabled");

    Strophe.addConnectionPlugin('externalsasl',
    {
        init: function (connection)
        {
            Strophe.SASLExternal = function() {};
            Strophe.SASLExternal.prototype = new Strophe.SASLMechanism("EXTERNAL", true, 2000);

            Strophe.SASLExternal.test = function (connection)
            {
                return connection.authcid !== null;
            };

            Strophe.SASLExternal.prototype.onChallenge = function(connection)
            {
                return connection.authcid === connection.authzid ? '' : connection.authzid;
            };

            connection.mechanisms[Strophe.SASLExternal.prototype.name] = Strophe.SASLExternal;
            console.log("strophe plugin: externalsasl enabled");
        }
    });
}

if (getSetting("useTotp", false))
{
    console.log("useTotp enabled");

    Strophe.addConnectionPlugin('ofchatsasl',
    {
        init: function (connection)
        {
            Strophe.SASLOFChat = function () { };
            Strophe.SASLOFChat.prototype = new Strophe.SASLMechanism("OFCHAT", true, 2000);

            Strophe.SASLOFChat.test = function (connection)
            {
                return getSetting("password", null) !== null;
            };

            Strophe.SASLOFChat.prototype.onChallenge = function (connection)
            {
                var token = getSetting("username", null) + ":" + getSetting("password", null);
                console.log("Strophe.SASLOFChat", token);
                return token;
            };

            connection.mechanisms[Strophe.SASLOFChat.prototype.name] = Strophe.SASLOFChat;
            console.log("strophe plugin: ofchatsasl enabled");
        }
    });
}


window.addEventListener("beforeunload", function ()
{

});


window.addEventListener("unload", function ()
{
    console.log("pade unloaded");

    etherlynk.disconnect();
    if (pade.connection) pade.connection.disconnect();

    closeChatWindow();
    closeVideoWindow();
    closePhoneWindow();
    closeBlogWindow();
    closeBlastWindow();
});

window.addEventListener("load", function()
{
    chrome.runtime.onInstalled.addListener(function(details)
    {
        if (details.reason == "install")
        {
            console.log("This is a first install!");
            doExtensionPage("changelog.html");

        } else if (details.reason == "update"){
            var thisVersion = chrome.runtime.getManifest().version;
            console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");

            if (thisVersion != details.previousVersion)
            {
                doExtensionPage("changelog.html");
            }
        }
    });


    // support Jitsi domain controlled screen share

    chrome.runtime.onMessageExternal.addListener(function(request, sender, sendResponse)
    {
        console.log("Got deskshare request", request, sender);

        if(request.getVersion)
        {
            sendResponse({ version: chrome.runtime.getManifest().version });
            return false;

        } else if(request.getStream) {

            var sources = ["screen", "window"];
            var tab = sender.tab;
            tab.url = sender.url;

            chrome.desktopCapture.chooseDesktopMedia(
            sources, tab,
            function(streamId) {
                sendResponse({ streamId: streamId });
            });
            return true;

        } else {
            console.error("Unknown request");
            sendResponse({ error : "Unknown request" });
            return false;
        }
    });

    // support ofmeet 0.3.x any domain screen share

    chrome.runtime.onConnect.addListener(function(port)
    {
        console.log("popup connect");
        pade.popup = true;
        pade.port = port;

        port.onMessage.addListener(function(message)
        {
            if (message.action == "pade.invite.contact")
            {
                inviteToConference(pade.activeContact.jid, pade.activeContact.room);
            }
            else

            if (message.event == "pade.popup.open")
            {
                stopTone();
            }
            else {  // desktop share backward compatiblity for openfire meetings 0.3.x

                switch(message.type)
                {
                case 'ofmeetGetScreen':
                    //server = message.server;
                    //sendRemoteControl('action=' + message.type + '&resource=' + message.resource + '&server=' + message.server)

                    var pending = chrome.desktopCapture.chooseDesktopMedia(message.options || ['screen', 'window'], port.sender.tab, function (streamid)
                    {
                        message.type = 'ofmeetGotScreen';
                        message.sourceId = streamid;
                        port.postMessage(message);
                    });

                    // Let the app know that it can cancel the timeout
                    message.type = 'ofmeetGetScreenPending';
                    message.request = pending;
                    port.postMessage(message);
                    break;

                case 'ofmeetCancelGetScreen':
                    chrome.desktopCapture.cancelChooseDesktopMedia(message.request);
                    message.type = 'ofmeetCanceledGetScreen';
                    port.postMessage(message);
                    break;
                }

            }
        });

        port.onDisconnect.addListener(function()
        {
            console.log("popup disconnect");
            pade.popup = false;
            pade.port = null;
        });
    });


    if (getSetting("desktopShareMode", false))
    {
        console.log("pade screen share mode only");
        return;
    }

    console.log("pade loaded");

    chrome.contextMenus.removeAll();
    chrome.contextMenus.create({id: "pade_rooms", title: "Meetings", contexts: ["browser_action"]});
    chrome.contextMenus.create({id: "pade_conversations", title: "Conversations", contexts: ["browser_action"]});
    chrome.contextMenus.create({id: "pade_applications", title: "Applications", contexts: ["browser_action"]});

    addChatMenu();
    addInverseMenu();
    addBlogMenu();
    addBlastMenu();
    addTouchPadMenu();

    chrome.notifications.onClosed.addListener(function(notificationId, byUser)
    {
        if (notificationId.startsWith("audioconf-")) etherlynk.leave(notificationId.substring(10));
    });

    chrome.notifications.onButtonClicked.addListener(function(notificationId, buttonIndex)
    {
        var callback = callbacks[notificationId];

        if (callback)
        {
            callback(notificationId, buttonIndex);

            callbacks[notificationId] = null;
            delete callbacks[notificationId];

            chrome.notifications.clear(notificationId, function(wasCleared)
            {

            });
        }
    });

    chrome.browserAction.onClicked.addListener(function()
    {
        if (getSetting("enableTouchPad", false))
        {
            if (getSetting("popupWindow", false))
            {
                chrome.browserAction.setPopup({popup: ""});
                openApcWindow();

            } else {
                chrome.browserAction.setPopup({popup: "popup.html"});
            }
        } else {
          doJitsiMeet();
        }
    });

    chrome.commands.onCommand.addListener(function(command)
    {
        console.log('Command:', command);

        if (command == "activate_chat" && getSetting("enableInverse", false)) openChatWindow("inverse/index.html");
        if (command == "activate_chat" && getSetting("enableChat", false)) openChatWindow("groupchat/index.html");

        if (command == "activate_blogger_communicator" && getSetting("enableTouchPad", false)) openApcWindow();
        if (command == "activate_blogger_communicator" && !getSetting("enableTouchPad", false)) openBlogWindow();

        if (command == "activate_phone") openPhoneWindow(true)
        if (command == "activate_meeting") openVideoWindow(pade.activeContact.room);

    });

    chrome.windows.onFocusChanged.addListener(function(win)
    {
        if (pade.chatWindow)
        {
            if (win == -1) pade.minimised = true;
            if (win == pade.chatWindow.id) pade.minimised = false;
        }
        else

        if (pade.videoWindow)
        {
            if (win == -1) pade.minimised = true;
            if (win == pade.videoWindow.id) pade.minimised = false;
        }
        else

        if (pade.apcWindow)
        {
            if (win == -1) pade.minimised = true;
            if (win == pade.apcWindow.id) pade.minimised = false;
        }

        //console.log("minimised", pade.minimised);
    });

    chrome.windows.onRemoved.addListener(function(win)
    {
        //console.log("closing window ", win);

        if (pade.chatWindow && win == pade.chatWindow.id)
        {
            pade.chatWindow = null;
            pade.minimised = false;
        }

        if (pade.sip.window && win == pade.sip.window.id)
        {
            pade.sip.window = null;
        }

        if (pade.blogWindow && win == pade.blogWindow.id)
        {
            pade.blogWindow = null;
        }

        if (pade.blastWindow && win == pade.blastWindow.id)
        {
            pade.blastWindow = null;
        }

        if (pade.videoWindow && win == pade.videoWindow.id)
        {
            sendToJabra("onhook");

            pade.videoWindow = null;
            pade.minimised = false;
            pade.connection.send($pres());  // needed because JitsiMeet send unavailable
        }

        if (pade.apcWindow && win == pade.apcWindow.id)
        {
            pade.apcWindow = null;
            pade.minimised = false;
        }
    });

    pade.server = getSetting("server", null);
    pade.domain = getSetting("domain", null);
    pade.username = getSetting("username", null);
    pade.password = getSetting("password", null);

    chrome.browserAction.setBadgeBackgroundColor({ color: '#ff0000' });
    chrome.browserAction.setBadgeText({ text: 'off' });


    if (pade.server && pade.domain && pade.username && pade.password)
    {
        pade.jid = pade.username + "@" + pade.domain;
        pade.displayName = getSetting("displayname", pade.username);

        // setup popup

        if (getSetting("popupWindow", false))
        {
            chrome.browserAction.setPopup({popup: ""});

        } else {
            chrome.browserAction.setPopup({popup: "popup.html"});
        }

        // setup jabra speak

        if (getSetting("useJabra", false))
        {
            pade.jabraPort = chrome.runtime.connectNative("pade.igniterealtime.org");

            if (pade.jabraPort)
            {
                console.log("jabra connected");

                pade.jabraPort.onMessage.addListener(function(data)
                {
                    //console.log("jabra incoming", data);
                    handleJabraMessage(data.message);
                });

                pade.jabraPort.onDisconnect.addListener(function()
                {
                    console.log("jabra disconnected");
                    pade.jabraPort = null;
                });

                pade.jabraPort.postMessage({ message: "getdevices" });
                pade.jabraPort.postMessage({ message: "getactivedevice" });
                pade.jabraPort.postMessage({ message: "onhook" });
            }
        }

        // setup SIP
        pade.sip = {};
        pade.enableSip = getSetting("enableSip", false);

        var connUrl = "https://" + pade.server + "/http-bind/";

        if (getSetting("useWebsocket", false))
        {
            connUrl = "wss://" + pade.server + "/ws/";
        }

        pade.connection = getConnection(connUrl);

        pade.connection.connect(pade.username + "@" + pade.domain + "/" + pade.username + "-" + Math.random().toString(36).substr(2,9), pade.password, function (status)
        {
            console.log("pade.connection ===>", status);

            if (status === Strophe.Status.CONNECTED)
            {
                addHandlers();

                chrome.browserAction.setBadgeText({ text: "" });
                pade.connection.send($pres());

                chrome.browserAction.setTitle({title: chrome.i18n.getMessage('manifest_shortExtensionName') + " - Connected"});

                pade.presence = {};
                pade.participants = {};

                setTimeout(function()
                {
                    fetchContacts(function(contact)
                    {
                        handleContact(contact);
                    });
                });
            }
            else

            if (status === Strophe.Status.DISCONNECTED)
            {
                chrome.browserAction.setBadgeText({ text: "off" });
                chrome.browserAction.setTitle({title: chrome.i18n.getMessage('manifest_shortExtensionName') + " - Disconnected"});
            }
            else

            if (status === Strophe.Status.AUTHFAIL)
            {
               doExtensionPage("options/index.html");
            }

        });

    } else doExtensionPage("options/index.html");
});

function getConnection(connUrl)
{
    return new Strophe.Connection(connUrl);
}

function handleContact(contact)
{
    //console.log("handleContact", contact);

    if (contact.type == "url")
    {
        if (contact.id == 0)
        {
            chrome.contextMenus.create({id: "pade_content", type: "normal", title: "Shared Documents", contexts: ["browser_action"]});
            pade.activeUrl = contact.url; // default
        }

        contact.created = true;
        chrome.contextMenus.create({parentId: "pade_content", type: "radio", id: contact.url, title: contact.name, contexts: ["browser_action"],  onclick: handleUrlClick});

    }
    else

    if (contact.type == "room")
    {
        if (contact.id == 0)
        {
            setActiveContact(contact);
        }

        pade.participants[contact.jid] = contact;
        contact.created = true;
        chrome.contextMenus.create({parentId: "pade_rooms", type: "radio", id: contact.jid, title: contact.name, contexts: ["browser_action"],  onclick: handleContactClick});
    }
    else

    if (contact.type == "conversation")
    {
        if (contact.id == 0)
        {
            if (!pade.activeContact) setActiveContact(contact);
        }

        if (showUser(contact))
        {
            pade.participants[contact.jid] = contact;
            contact.created = true;
            chrome.contextMenus.create({parentId: "pade_conversations", type: "radio", id: contact.jid, title: contact.name + " - " + contact.presence, contexts: ["browser_action"],  onclick: handleContactClick});
        }
    }
    else

    if (contact.type == "workgroup")
    {
        if (contact.id == 0)
        {
            chrome.contextMenus.create({id: "pade_workgroups", title: "Workgroups", contexts: ["browser_action"]});
            setActiveWorkgroup(contact);
        }

        pade.participants[contact.jid] = contact;
        contact.created = true;
        chrome.contextMenus.create({parentId: "pade_workgroups", type: "radio", id: contact.jid, title: contact.name, contexts: ["browser_action"],  onclick: handleWorkgroupClick});
    }
}

function setActiveContact(contact)
{
    pade.activeContact = contact;
    chrome.browserAction.setTitle({title: chrome.i18n.getMessage('manifest_shortExtensionName') + " - " + pade.activeContact.name + " (" + pade.activeContact.type + ")"});
}

function setActiveWorkgroup(contact)
{
    if (pade.activeWorkgroup)
    {
        pade.connection.send($pres({to: pade.activeWorkgroup.jid, type: "unavailable"}).c("status").t("Online").up().c("priority").t("1"));
    }

    pade.activeWorkgroup = contact;

    pade.connection.send($pres({to: pade.activeWorkgroup.jid}).c('agent-status', {'xmlns': "http://jabber.org/protocol/workgroup"}));
    pade.connection.send($pres({to: pade.activeWorkgroup.jid}).c("status").t("Online").up().c("priority").t("1"));
    pade.connection.sendIQ($iq({type: 'get', to: pade.activeWorkgroup.jid}).c('agent-status-request', {xmlns: "http://jabber.org/protocol/workgroup"}));

}

function handleContactClick(info)
{
    //console.log("handleContactClick", info, pade.participants[info.menuItemId]);
    setActiveContact(pade.participants[info.menuItemId]);
    doJitsiMeet();
}

function doJitsiMeet()
{
    if (getSetting("popupWindow", false))
    {
        chrome.browserAction.setPopup({popup: ""});

        if (pade.activeContact)
        {
            closeVideoWindow();

            if (isAudioOnly())
            {
                joinAudioCall(pade.activeContact.name, pade.activeContact.jid, pade.activeContact.room)

            } else {
                openVideoWindow(pade.activeContact.room);
            }

            if (pade.activeContact.type == "conversation")
            {
                inviteToConference(pade.activeContact.jid, pade.activeContact.room);
            }

        } else {
            openVideoWindow();
        }

    } else {

        if (isAudioOnly())
        {
            chrome.browserAction.setPopup({popup: ""});
            joinAudioCall(pade.activeContact.name, pade.activeContact.jid, pade.activeContact.room)

            if (pade.activeContact.type == "conversation")
            {
                inviteToConference(pade.activeContact.jid, pade.activeContact.room);
            }

        } else {
            chrome.browserAction.setPopup({popup: "popup.html"});
        }
    }
}

function handleWorkgroupClick(info)
{
    //console.log("handleWorkgroupClick", info, pade.participants[info.menuItemId]);
    setActiveWorkgroup(pade.participants[info.menuItemId]);
}

function handleUrlClick(info)
{
    //console.log("handleUrlClick", info);
    pade.activeUrl = info.menuItemId;
}

function reloadApp()
{
    chrome.runtime.reload();
}

function startTone(name)
{
    if (getSetting("enableRingtone", false))
    {
        //console.log("startTone", name);

        if (!pade.ringtone)
        {
            pade.ringtone = new Audio();
            pade.ringtone.loop = true;
        }

        pade.ringtone.src = chrome.extension.getURL("ringtones/" + name + ".mp3");
        pade.ringtone.play();
    }
}

function stopTone()
{
    if (pade.ringtone)
    {
        pade.ringtone.pause();
    }
}


function notifyText(message, context, iconUrl, buttons, callback, notifyId)
{
    var opt = {
      type: "basic",
      title: chrome.i18n.getMessage('manifest_extensionName'),
      iconUrl: iconUrl ? iconUrl : chrome.extension.getURL("image.png"),

      message: message,
      buttons: buttons,
      contextMessage: context,
      requireInteraction: !!buttons && !!callback
    }
    if (!notifyId) notifyId = Math.random().toString(36).substr(2,9);

    chrome.notifications.create(notifyId, opt, function(notificationId)
    {
        if (callback) callbacks[notificationId] = callback;
    });
};

function notifyImage(message, context, imageUrl, buttons, callback)
{
    var opt = {
      type: "image",
      title: chrome.i18n.getMessage('manifest_extensionName'),
      iconUrl: chrome.extension.getURL("image.png"),

      message: message,
      buttons: buttons,
      contextMessage: context,
      imageUrl: imageUrl
    }
    var id = Math.random().toString(36).substr(2,9);

    chrome.notifications.create(id, opt, function(notificationId)
    {
        if (callback) callbacks[notificationId] = callback;
    });
};

function notifyProgress(message, context, progress, buttons, callback)
{
    var opt = {
      type: "progress",
      title: chrome.i18n.getMessage('manifest_extensionName'),
      iconUrl: chrome.extension.getURL("image.png"),

      message: message,
      buttons: buttons,
      contextMessage: context,
      progress: progress
    }
    var id = Math.random().toString(36).substr(2,9);

    chrome.notifications.create(id, opt, function(notificationId)
    {
        if (callback) callbacks[notificationId] = callback;
    });
};


function notifyList(message, context, items, buttons, callback)
{
    var opt = {
      type: "list",
      title: chrome.i18n.getMessage('manifest_extensionName'),
      iconUrl: chrome.extension.getURL("image.png"),

      message: message,
      buttons: buttons,
      contextMessage: context,
      items: items
    }
    var id = Math.random().toString(36).substr(2,9);

    chrome.notifications.create(id, opt, function(notificationId){
        if (callback) callbacks[notificationId] = callback;
    });
};

function closeApcWindow()
{
    if (pade.apcWindow != null)
    {
        chrome.windows.remove(pade.apcWindow.id);
        pade.apcWindow = null;
    }
}

function openApcWindow()
{
    if (pade.apcWindow == null)
    {
        chrome.windows.create({url: chrome.extension.getURL("apc.html"), focused: true, type: "popup"}, function (win)
        {
            pade.apcWindow = win;
            chrome.windows.update(pade.apcWindow.id, {drawAttention: true, width: 820, height: 640});
        });

    } else {
        chrome.windows.update(pade.apcWindow.id, {drawAttention: true, focused: true, width: 820, height: 640});
    }
}

function closePhoneWindow()
{
    if (pade.sip && pade.sip.window != null)
    {
        chrome.windows.remove(pade.sip.window.id);
        pade.sip.window = null;
    }
}

function openPhoneWindow(focus)
{
    var url = chrome.extension.getURL("phone/index-ext.html");

    if (pade.sip.window == null)
    {
        chrome.windows.create({url: url, focused: focus, type: "popup"}, function (win)
        {
            pade.sip.window = win;
            chrome.windows.update(pade.sip.window.id, {drawAttention: focus, width: 350, height: 725});
        });

    } else {
        chrome.windows.update(pade.sip.window.id, {drawAttention: true, width: 350, height: 725});
    }
}

function closeChatWindow()
{
    if (pade.chatWindow)
    {
        chrome.windows.remove(pade.chatWindow.id);
        pade.chatWindow = null;
    }
}

function openChatWindow(url, update)
{
    if (!pade.chatWindow || update)
    {
        if (update && pade.chatWindow != null) chrome.windows.remove(pade.chatWindow.id);

        chrome.windows.create({url: chrome.extension.getURL(url), focused: true, type: "popup"}, function (win)
        {
            pade.chatWindow = win;
            chrome.windows.update(pade.chatWindow.id, {drawAttention: true, width: 1024, height: 800});
        });

    } else {
        chrome.windows.update(pade.chatWindow.id, {drawAttention: true, focused: true, width: 1024, height: 800});
    }
}

function closeVideoWindow()
{
    if (pade.videoWindow != null)
    {
        try {
            chrome.windows.remove(pade.videoWindow.id);
        } catch (e) {}
    }
}

function openVideoWindow(room)
{
    var url = chrome.extension.getURL("jitsi-meet/chrome.index.html");
    if (room) url = url + "?room=" + room;
    openVideoWindowUrl(url);
}

function openVideoWindowUrl(url)
{
    if (pade.videoWindow != null)
    {
        chrome.windows.remove(pade.videoWindow.id);
    }

    chrome.windows.create({url: url, width: 1024, height: 800, focused: true, type: "popup"}, function (win)
    {
        pade.videoWindow = win;
        chrome.windows.update(pade.videoWindow.id, {drawAttention: true});

        sendToJabra("offhook");
    });
}

function closeBlogWindow()
{
    if (pade.blogWindow != null)
    {
        try {
            chrome.windows.remove(pade.blogWindow.id);
        } catch (e) {}
    }
}

function openBlogWindow()
{
    if (!pade.blogWindow)
    {
        var url = "https://" + pade.server + "/" + getSetting("blogName", "solo") + "/admin-index.do#main";

        chrome.windows.create({url: url, width: 1024, height: 800, focused: true, type: "popup"}, function (win)
        {
            pade.blogWindow = win;
            chrome.windows.update(pade.blogWindow.id, {drawAttention: true});
        });
    } else {
        chrome.windows.update(pade.blogWindow.id, {drawAttention: true, focused: true, width: 1024, height: 800});
    }
}

function closeBlastWindow()
{
    if (pade.blastWindow != null)
    {
        try {
            chrome.windows.remove(pade.blastWindow.id);
        } catch (e) {}
    }
}

function openBlastWindow()
{
    if (!pade.blastWindow)
    {
        var url = "https://" + pade.server + "/dashboard/blast";

        chrome.windows.create({url: url, width: 1024, height: 800, focused: true, type: "popup"}, function (win)
        {
            pade.blastWindow = win;
            chrome.windows.update(pade.blastWindow.id, {drawAttention: true});
        });
    } else {
        chrome.windows.update(pade.blastWindow.id, {drawAttention: true, focused: true, width: 1024, height: 800});
    }
}

function doExtensionPage(url)
{
    chrome.tabs.getAllInWindow(null, function(tabs)
    {
        var setupUrl = chrome.extension.getURL(url);

        if (tabs)
        {
            var option_tab = tabs.filter(function(t) { return t.url === setupUrl; });

            if (option_tab.length)
            {
            chrome.tabs.update(option_tab[0].id, {highlighted: true, active: true});

            }else{
            chrome.tabs.create({url: setupUrl, active: true});
            }
        }
    });
}

function addHandlers()
{
    pade.connection.addHandler(function(iq)
    {
        //console.log('fastpath handler', iq);

        var iq = $(iq);
        var workgroupJid = iq.attr('from');

        pade.connection.send($iq({type: 'result', to: iq.attr('from'), id: iq.attr('id')}));

        iq.find('offer').each(function()
        {
            var id = $(this).attr('id');
            var jid = $(this).attr('jid').toLowerCase();
            var properties = {id: id, jid: jid, workgroupJid: workgroupJid};

            iq.find('value').each(function()
            {
                var name = $(this).attr('name');
                var value = $(this).text();
                properties[name] = value;
            });

            //console.log("fastpath handler offer", properties, workgroupJid);

            acceptRejectOffer(properties);
        });

        iq.find('offer-revoke').each(function()
        {
            id = $(this).attr('id');
            jid = $(this).attr('jid').toLowerCase();

            //console.log("fastpath handler offer-revoke", workgroupJid);
        });

        return true;

    }, "http://jabber.org/protocol/workgroup", 'iq', 'set');

    pade.connection.addHandler(function(presence)
    {
        var to = $(presence).attr('to');
        var type = $(presence).attr('type');
        var from = Strophe.getBareJidFromJid($(presence).attr('from'));

        //console.log("presence handler", from, to, type);

        var pres = "online";
        if (type == "unavailable") pres = "unavailable";

        pade.presence[from] = pres;
        var contact = pade.participants[from];

        if (contact && contact.type == "conversation")
        {
            if (contact.created)
            {
                chrome.contextMenus.remove(from);
            }

            contact.created = false;
            contact.presence = pres;

            if (showUser(contact))
            {
                contact.created = true;
                chrome.contextMenus.create({parentId: "pade_conversations", type: "radio", id: contact.jid, title: contact.name + " - " + contact.presence, contexts: ["browser_action"],  onclick: handleContactClick});
            }
         }

        return true;

    }, null, 'presence');

    pade.connection.addHandler(function(message)
    {
        var id = $(message).attr("from");
        var from = $(message).attr("from");
        var to = $(message).attr("to");
        var reason = null;
        var password = null;
        var composing = false;
        var offerer = null;
        var type = $(message).attr("type");
        var room = null;
        var autoaccept = null;

        console.log("message handler", from, to, type)

        $(message).find('body').each(function ()
        {
            var body = $(this).text();
            var pos1 = body.indexOf("/ofmeet/");
            var pos2 = body.indexOf("https://" + pade.server)

            offerer = Strophe.getBareJidFromJid(from);

            console.log("message handler body", body, offerer);

            if ( pos1 > -1 && pos2 > -1 )
            {
                room = body.substring(pos1 + 8);
                handleInvitation({room: room, offerer: offerer});
            }
        });

        $(message).find('x').each(function ()
        {
            var namespace = $(this).attr("xmlns");

            $(message).find('offer').each(function()
            {
                offerer = $(this).attr('jid');
            });

            if (namespace == "jabber:x:conference")
            {
                $(message).find('invite').each(function()
                {
                    offerer = $(this).attr('from');
                });

                id = $(this).attr('jid');
                autoaccept = $(this).attr('autoaccept');
                room = Strophe.getNodeFromJid(id);
                reason = $(this).attr('reason');
                password = $(this).attr('password');

                if (!reason)
                {
                    $(message).find('reason').each(function()
                    {
                        reason = $(this).text();
                    });
                }

                if (!password)
                {
                    $(message).find('password').each(function()
                    {
                        password = $(this).text();
                    });
                }

                handleInvitation({room: room, offerer: offerer, autoaccept: autoaccept});
            }
        });

        return true;

    }, null, 'message');
}

function fetchContacts(callback)
{
    var urlCount = 0;
    var roomCount = 0;
    var contactCount = 0;
    var workgroupCount = 0;

    pade.connection.sendIQ($iq({type: "get"}).c("query", {xmlns: "jabber:iq:private"}).c("storage", {xmlns: "storage:bookmarks"}).tree(), function(resp)
    {
        //console.log("get bookmarks", resp)

        $(resp).find('conference').each(function()
        {
            var jid = $(this).attr("jid");
            var room = Strophe.getNodeFromJid(jid);
            var muc = Strophe.getDomainFromJid(jid);
            var domain = muc.substring("conference.".length);           // ignore "conference."

            //console.log('ofmeet.bookmark.conference.item', {name: $(this).attr("name"), jid: $(this).attr("jid"), autojoin: $(this).attr("autojoin")});

            if (callback) callback(
            {
                id: roomCount++,
                type: "room",
                jid: jid,
                presence: "room",
                name: $(this).attr("name"),
                pinned: $(this).attr("autojoin"),
                open: $(this).attr("autojoin"),
                room: room,
                domain: domain
            });
        })

        $(resp).find('url').each(function()
        {
            //console.log('ofmeet.bookmark.url.item', {name: $(this).attr("name"), url: $(this).attr("url")});

            if (callback) callback(
            {
                id: urlCount++,
                type: "url",
                url: $(this).attr("url"),
                name: $(this).attr("name")

            });
        });

    }, function (error) {
        console.error(error);
    });

    pade.connection.sendIQ($iq({type: "get"}).c("query", {xmlns: "jabber:iq:roster"}).tree(), function(resp)
    {
        //console.log("get roster", resp)

        $(resp).find('item').each(function()
        {
            var jid = $(this).attr("jid");
            var node = Strophe.getNodeFromJid(jid);
            var name = $(this).attr("name");
            var domain = Strophe.getDomainFromJid(jid);

            //console.log('ofmeet.roster.item',jid, name);

            if (callback) callback(
            {
                id: contactCount++,
                type: "conversation",
                name: name,
                room: makeRoomName(pade.username, node),
                node: node,
                jid: jid,
                presence: pade.presence[jid] ? pade.presence[jid] : "unavailable",
                open: "false",
                active: false,
                domain: domain
            });

        })


    }, function (error) {
        console.error(error);
    });

    pade.connection.sendIQ($iq({type: "get"}).c("vCard", {xmlns: "vcard-temp"}).tree(), function(resp)
    {
        var vCard = $(resp).find("vCard");
        var img = vCard.find('BINVAL').text();
        var type = vCard.find('TYPE').text();
        var img_src = 'data:'+type+';base64,'+img;

        //console.log("get vcard", img_src);

        if (img_src != 'data:;base64,')
        {
            pade.avatar = img_src;
        }

    }, function (error) {
        console.error(error);
    });

    pade.connection.sendIQ($iq({type: 'get', to: "workgroup." + pade.connection.domain}).c('workgroups', {jid: pade.connection.jid, xmlns: "http://jabber.org/protocol/workgroup"}).tree(), function(resp)
    {
        $(resp).find('workgroup').each(function()
        {
            var jid = $(this).attr('jid');
            var name = Strophe.getNodeFromJid(jid);
            var room = 'workgroup-' + name + "@conference." + pade.connection.domain;

            //console.log("get workgroups", room, jid);

            if (callback) callback(
            {
                id: roomCount++,
                type: "room",
                jid: room,
                presence: "room",
                name: name,
                pinned: true,
                open: true,
                room: room,
                domain: pade.connection.domain
            });

            if (callback) callback(
            {
                id: workgroupCount++,
                type: "workgroup",
                jid: jid,
                presence: "open",
                name: name,
                domain: pade.connection.domain
            });
        });

    }, function (error) {
        console.warn("Fastpath not available");
    });

    etherlynk.connect();

    if (pade.enableSip)
    {
        pade.connection.sendIQ($iq({type: 'get', to: "sipark." + pade.connection.domain}).c('registration', {jid: pade.connection.jid, xmlns: "http://www.jivesoftware.com/protocol/sipark"}).tree(), function(resp)
        {
            $(resp).find('jid').each(function()                 {pade.sip.jid = $(this).text();});
            $(resp).find('username').each(function()            {pade.sip.username = $(this).text();});
            $(resp).find('authUsername').each(function()        {pade.sip.authUsername = $(this).text();});
            $(resp).find('displayPhoneNum').each(function()     {pade.sip.displayPhoneNum = $(this).text();});
            $(resp).find('password').each(function()            {pade.sip.password = $(this).text();});
            $(resp).find('server').each(function()              {pade.sip.server = $(this).text();});
            $(resp).find('enabled').each(function()             {pade.sip.enabled = $(this).text();});
            $(resp).find('outboundproxy').each(function()       {pade.sip.outboundproxy = $(this).text();});
            $(resp).find('promptCredentials').each(function()   {pade.sip.promptCredentials = $(this).text();});

            console.log("get sip profile", pade.sip);

            if (pade.sip.authUsername)
            {
                etherlynk.connectSIP();

                chrome.contextMenus.create({parentId: "pade_applications", id: "pade_phone", type: "normal", title: "Phone", contexts: ["browser_action"],  onclick: function()
                {
                    openPhoneWindow(true);
                }});
            }

        }, function (error) {
            console.warn("SIP profile not available");
            connectSIP();
        });
    }

}

function findUsers(search, callback)
{
    //console.log('findUsers', search);

    var iq = $iq({type: 'set', to: "search." + pade.connection.domain}).c('query', {xmlns: 'jabber:iq:search'}).c('x').t(search).up().c('email').t(search).up().c('nick').t(search);

    pade.connection.sendIQ(iq, function(response)
    {
        var users = [];

        $(response).find('item').each(function()
        {
            var current = $(this);
            var jid = current.attr('jid');
            var username = Strophe.getNodeFromJid(jid);

            var name = current.find('nick').text();
            var email = current.find('email').text();
            var room = makeRoomName(pade.username, username);

            //console.log('findUsers response', name, jid, room);

            users.push({username: username, name: name, email: email, jid: jid, room: room});
        });

        if (callback) callback(users);

    }, function (error) {
        console.error('findUsers', error);
    });
};

function inviteToConference(jid, room)
{
    //console.log("inviteToConference", jid, room);

    try {
        var invite = "Please join me in https://" + pade.server + "/ofmeet/" + room;
        pade.connection.send($msg({type: "chat", to: jid}).c("body").t(invite));
    } catch (e) {
        console.error(e);
    }
}

function injectMessage(message, room, nickname)
{
    //console.log("injectMessage", message, room);

    try {
        var msg = $msg({to: room + "@conference." + pade.domain, type: "groupchat"});
        msg.c("body", message).up();
        msg.c("nick", {xmlns: "http://jabber.org/protocol/nick"}).t(nickname).up().up();
        pade.connection.send(msg);

    } catch (e) {
        console.error(e);
    }
}

function handleInvitation(invite)
{
    //console.log("handleInvitation", invite);

    var jid = Strophe.getBareJidFromJid(invite.offerer);

    if (pade.participants[jid])
    {
        var participant = pade.participants[jid];
        processInvitation(participant.name, participant.jid, invite.room, invite.autoaccept);
    }
    else

    if (invite.offerer == pade.domain)
    {
        processInvitation("Administrator", "admin@"+pade.domain, invite.room, invite.autoaccept);
    }
    else {
        processInvitation("Unknown User", invite.offerer, invite.room);
    }

    if (pade.port) pade.port.postMessage({event: "invited", id : invite.offerer, name: invite.room});
}

function processInvitation(title, label, room, autoaccept)
{
    //console.log("processInvitation", title, label, room);

    if (!autoaccept || autoaccept != "true")
    {
        startTone("Diggztone_Vibe");

        notifyText(title, label, null, [{title: "Accept " + chrome.i18n.getMessage('manifest_extensionName') + "?", iconUrl: chrome.extension.getURL("success-16x16.gif")}, {title: "Reject " + chrome.i18n.getMessage('manifest_extensionName') + "?", iconUrl: chrome.extension.getURL("forbidden-16x16.gif")}], function(notificationId, buttonIndex)
        {
            //console.log("handleAction callback", notificationId, buttonIndex);

            if (buttonIndex == 0)   // accept
            {
                stopTone();
                acceptCall(title, label, room);
            }
            else

            if (buttonIndex == 1)   // reject
            {
                stopTone();
            }

        }, room);

        // jabra
        pade.activeRoom = {title: title, label: label, room: room};
        sendToJabra("ring");

    } else {
        acceptCall(title, label, room);
    }
}

function acceptCall(title, label, room)
{
    //console.log("acceptCall", title, label, room);

    if (isAudioOnly())
    {
        joinAudioCall(title, label, room);

    } else {
        openVideoWindow(room);
    }
}

function acceptRejectOffer(properties)
{
    if (pade.participants[properties.workgroupJid])
    {
        var agent = pade.participants[properties.workgroupJid];

        var question = properties.question;
        if (!question) question = "Fastpath Assistance";

        var email = properties.email;
        if (!email) email = Strophe.getBareJidFromJid(properties.jid);

        //console.log("acceptRejectOffer", question, email, agent);

        startTone("Diggztone_DigitalSanity");

        notifyText(question, email, null, [{title: "Accept - Fastpath Assistance", iconUrl: chrome.extension.getURL("success-16x16.gif")}, {title: "Reject - Fastpath Assistance?", iconUrl: chrome.extension.getURL("forbidden-16x16.gif")}], function(notificationId, buttonIndex)
        {
            //console.log("handleAction callback", notificationId, buttonIndex);

            if (buttonIndex == 0)   // accept
            {
                pade.connection.send($iq({type: 'set', to: properties.workgroupJid}).c('offer-accept', {xmlns: "http://jabber.org/protocol/workgroup", jid: properties.jid, id: properties.id}));
                stopTone();
            }
            else

            if (buttonIndex == 1)   // reject
            {
                pade.connection.send($iq({type: 'set', to: properties.workgroupJid}).c('offer-reject', {xmlns: "http://jabber.org/protocol/workgroup", jid: properties.jid, id: properties.id}));
                stopTone();
            }

        }, properties.id);

    } else {
        console.warn("workgroup offer from unknown source", properties.workgroupJid);
    }
}
function handleJabraMessage(message)
{
    if (message.startsWith("Event: Version ")) {
        console.log("Jabra " + message);
    }

    if (message == "Event: mute") {

    }
    if (message == "Event: unmute") {

    }
    if (message == "Event: device attached") {

    }
    if (message == "Event: device detached") {

    }

    if (message == "Event: acceptcall")
    {
        if (pade.activeRoom)
        {
            stopTone();
            clearNotification(pade.activeRoom.room);

            if (isAudioOnly())
            {
                joinAudioCall(pade.activeRoom.title, pade.activeRoom.label, pade.activeRoom.room);

            } else {
                openVideoWindow(pade.activeRoom.room);
            }
            pade.activeRoom = null;
        }
    }

    if (message == "Event: endcall")
    {
        if (isAudioOnly())
        {
            if (pade.activeRoom) clearNotification(pade.activeRoom.room);

        } else {
            closeVideoWindow();
        }
    }

    if (message == "Event: reject")
    {
        if (pade.activeRoom)
        {
            stopTone();
            clearNotification(pade.activeRoom.room);
            sendToJabra("onhook");
            pade.activeRoom = null;
        }
    }

    if (message == "Event: flash") {

    }

    if (message.startsWith("Event: devices")) {

    }

    if (message.startsWith("Event: activedevice")) {

    }
}

function sendToJabra(message)
{
    if (pade.jabraPort)
    {
        //console.log("sendToJabra " + message);
        pade.jabraPort.postMessage({ message: message });
    }
}

function clearNotification(room)
{
    chrome.notifications.clear(room, function(wasCleared)
    {
        //console.log("notification cleared", room, wasCleared);
    });
}

function joinAudioCall(title, label, room)
{
    etherlynk.join(room);
    sendToJabra("offhook");

    notifyText(title, label, null, [{title: "Clear Conversation?", iconUrl: chrome.extension.getURL("success-16x16.gif")}], function(notificationId, buttonIndex)
    {
        if (buttonIndex == 0)   // terminate
        {
            etherlynk.leave(room);
        }

    }, room);
}

function removeSetting(name)
{
    localStorage.removeItem("store.settings." + name);
}

function setSetting(name, value)
{
    //console.log("setSetting", name, value);
    window.localStorage["store.settings." + name] = JSON.stringify(value);
}

function getSetting(name, defaultValue)
{
    //console.log("getSetting", name, defaultValue);

    var value = defaultValue;

    if (window.localStorage["store.settings." + name])
    {
        value = JSON.parse(window.localStorage["store.settings." + name]);

        if (name == "password") value = getPassword(value);

    } else {
        if (defaultValue) window.localStorage["store.settings." + name] = JSON.stringify(defaultValue);
    }

    return value;
}

function getPassword(password)
{
    if (!password || password == "") return null;
    if (password.startsWith("token-")) return atob(password.substring(6));

    window.localStorage["store.settings.password"] = JSON.stringify("token-" + btoa(password));
    return password;
}


function addChatMenu()
{
    if (getSetting("enableChat", false))
    {
        chrome.contextMenus.create({parentId: "pade_applications", id: "pade_chat", type: "normal", title: "Candy Chat", contexts: ["browser_action"],  onclick: function()
        {
            openChatWindow("groupchat/index.html");
        }});
    }
}

function removeChatMenu()
{
    closeChatWindow();
    chrome.contextMenus.remove("pade_chat");
}

function addInverseMenu()
{
    if (getSetting("enableInverse", false))
    {
        chrome.contextMenus.create({parentId: "pade_applications", id: "pade_inverse", type: "normal", title: "Inverse Client", contexts: ["browser_action"],  onclick: function()
        {
            openChatWindow("inverse/index.html");
        }});
    }
}

function removeInverseMenu()
{
    closeChatWindow();
    chrome.contextMenus.remove("pade_inverse");
}

function addBlogMenu()
{
    if (getSetting("enableBlog", false))
    {
        chrome.contextMenus.create({parentId: "pade_applications", id: "pade_blog", type: "normal", title: "Blogger", contexts: ["browser_action"],  onclick: function()
        {
            openBlogWindow();
        }});
    }
}

function removeBlogMenu()
{
    closeBlogWindow();
    chrome.contextMenus.remove("pade_blog");
}

function addBlastMenu()
{
    if (getSetting("enableBlast", false))
    {
        chrome.contextMenus.create({parentId: "pade_applications", id: "pade_blast", type: "normal", title: "Message Blast", contexts: ["browser_action"],  onclick: function()
        {
            openBlastWindow();
        }});
    }
}

function removeBlastMenu()
{
    closeBlastWindow();
    chrome.contextMenus.remove("pade_blast");
}

function addTouchPadMenu()
{
    if (getSetting("enableTouchPad", false))
    {
        chrome.contextMenus.create({id: "pade_apc", type: "normal", title: "Communicator TouchPad", contexts: ["browser_action"],  onclick: function()
        {
            openApcWindow();
        }});
    }
}

function removeTouchPadMenu()
{
    closeApcWindow();
    chrome.contextMenus.remove("pade_apc");
}

function isAudioOnly()
{
    return getSetting("audioOnly", false);
}

function showUser(contact)
{
    return !getSetting("showOnlyOnlineUsers", true) || (getSetting("showOnlyOnlineUsers", true) && contact.presence != "unavailable");
}

function makeRoomName(me, contact)
{
    if (me <= contact)
    {
        return me + "-" + contact;
    }
    else return contact + "-" + me;
}

function setSipStatus(status)
{
    pade.connection.sendIQ($iq({type: 'get', to: "sipark." + pade.connection.domain}).c('registration', {jid: pade.connection.jid, xmlns: "http://www.jivesoftware.com/protocol/sipark"}).c('status').t(status).tree(), function(resp)
    {
        console.log("setSipStatus", status);

    }, function (error) {
        console.error("setSipStatus", error);
    });
}

function logCall(target, direction, duration)
{
    if (direction == "dialed")
    {
        numA = pade.sip.username;
        numB = target;
    }
    else {
        numB = pade.sip.username;
        numA = target;
    }

/*
    pade.connection.sendIQ($iq({type: 'get', to: "logger." + pade.connection.domain}).c('logger', {jid: pade.connection.jid, xmlns: "http://www.jivesoftware.com/protocol/log"}).c('callLog').c('numA').t(numA).up().c('numB').t(numB).up().c('direction').t(direction).up().c('duration').t(duration).up().tree(), function(resp)
    {
        console.log("logCall", numA, numB, direction, duration);

    }, function (error) {
        console.error("logCall", error);
    });
*/
}

function getVCard(jid, callback, errorback)
{
    pade.connection.vCard.get(jid, function(vCard)
    {
        if (callback) callback(vCard);

    }, function(error) {
        if (errorback) errorback(error);
        console.error(error);
    });

}

function setVCard(vCard, callback, errorback)
{
    pade.connection.vCard.set(vCard, function(resp)
    {
        if (callback) callback(resp);

    }, function(error) {
        if (errorback) errorback(error);
        console.error(error);
    });
}


