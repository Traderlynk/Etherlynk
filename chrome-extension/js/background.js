var lynkUI = {}
var callbacks = {}
    
function reloadApp()
{
    chrome.runtime.reload();
}

function startTone(name)
{
    if (!lynkUI.ringtone)
    {
        lynkUI.ringtone = new Audio();
        lynkUI.ringtone.loop = true;
    }
    
    lynkUI.ringtone.src = chrome.extension.getURL("ringtones/" + name + ".mp3");    
    lynkUI.ringtone.play();    
}

function stopTone()
{
    if (lynkUI.ringtone)
    {
        lynkUI.ringtone.pause();
    }
}

/**
 *  buttons [{title: "accept", iconUrl: "accept.png"}]
 *  items [{ title: "Item1", message: "This is item 1."}]
 *  progress 0 - 100
 */

function notifyText(message, context, iconUrl, buttons, callback, notifyId)
{           
    var opt = {
      type: "basic",
      title: "TraderLynk",        
      iconUrl: iconUrl ? iconUrl : chrome.extension.getURL("tl_icon.png"),

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
      title: "TraderLynk",        
      iconUrl: chrome.extension.getURL("tl_icon.png"),

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
      title: "TraderLynk",        
      iconUrl: chrome.extension.getURL("tl_icon.png"),

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
      title: "TraderLynk",        
      iconUrl: chrome.extension.getURL("tl_icon.png"),

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

function closeChatWindow()
{
    if (lynkUI.chatWindow != null)
    {
        chrome.windows.remove(lynkUI.chatWindow.id);
        lynkUI.chatWindow = null;
    }
}

function openChatWindow(focus)
{
    var url = chrome.extension.getURL("groupchat/index.html");

    if (lynkUI.chatWindow == null)
    {
        chrome.windows.create({url: url, focused: focus, type: "popup"}, function (win) 
        {
            lynkUI.chatWindow = win;
            chrome.windows.update(lynkUI.chatWindow.id, {drawAttention: focus, width: 800, height: 600});
        });

    } else {
        chrome.windows.update(lynkUI.chatWindow.id, {drawAttention: true, width: 800, height: 600});        
    }   
}

function doOptions()
{
    chrome.tabs.getAllInWindow(null, function(tabs)
    {
        var setupUrl = chrome.extension.getURL('options/index.html');
        
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

window.addEventListener("load", function() 
{
    console.log("loaded");  
    
         document.body.addEventListener('webmidievent', function (e) 
         {
            //console.log("webmidievent", e);
            
            if (lynkUI.popup && e.detail.data1 == 176)
            {
                lynkUI.port.postMessage({value1: e.detail.data1, value2: e.detail.data2, value3: e.detail.data3});
            }
            
            handleSlider(e.detail.data2, e.detail.data3);
            
            if (e.detail.data1 == 144)
            {
                handleButtonPress(e.detail.data2);
                
                lynkUI.timeouts[e.detail.data2] = setTimeout(function()
                {
                    handleButtonHeld(e.detail.data2);
                    
                }, 500);
            }
            else
            
            if (e.detail.data1 == 128)
            {
                clearTimeout(lynkUI.timeouts[e.detail.data2])
                delete lynkUI.timeouts[e.detail.data2]
            }

         }, false); 
    
    Strophe.addConnectionPlugin('etherlynk', 
    {
        init: function (connection) 
        {
            console.log("strophe plugin: etherlynk enabled", connection.jid);       
            this.connection = connection;

            this.connection.addHandler(function(message)
            {
                $(message).find('etherlynk').each(function ()   
                {
                    try {
                        var json = JSON.parse($(this).text());

                        if (json.event) handleEvent(json, $(message).attr("to"));                       
                        if (json.action) handleAction(json, $(message).attr("to"));

                    } catch (e) {}
                });

                return true;

            }, "jabber:x:etherlynk", 'message');            
        },  
        statusChanged: function(status, condition)
        {
            console.log("strophe plugin: statusChanged", this.connection.jid);
            
            if (Strophe.getNodeFromJid(this.connection.jid) != lynkUI.username) return;

            if (status == 5)
            {
                console.log("XMPPConnection.connected");                        
                chrome.browserAction.setBadgeText({ text: "" });

                getEtherlynks();
            }
            else 

            if (status == 6)
            {
                console.log("XMPPConnection.disconnected");             
                chrome.browserAction.setBadgeText({ text: "off" });
            }   
        }
    }); 
    
    chrome.contextMenus.removeAll();
    
    chrome.contextMenus.create({title: "Etherlynk Chat", contexts: ["browser_action"],  onclick: function() 
    {
        openChatWindow();
    }});    
    
    chrome.runtime.onConnect.addListener(function(port) 
    {
        console.log("popup connect");   
        lynkUI.popup = true;
        lynkUI.port = port;
                
        port.onMessage.addListener(function(msg) 
        {                       
            if (msg.event == "etherlynk.event.buttondown")
            {
                handleButtonPress(msg.button);
            }
            
            if (msg.event == "etherlynk.event.held")
            {
                handleButtonHeld(msg.button);
            }
            
            if (msg.event == "etherlynk.event.slider")
            {
                handleSlider(msg.slider, msg.value);
            }                       
        });
        
        port.onDisconnect.addListener(function() 
        {
            console.log("popup disconnect");
            lynkUI.popup = false;
            lynkUI.port = null;
        });     
    }); 
    
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
        doOptions();        
    });
    
    chrome.notifications.onButtonClicked.addListener(function(notificationId, buttonIndex)
    {
        var callback = callbacks[notificationId];   

        if (callback)
        {
            callback(notificationId, buttonIndex);

            chrome.notifications.clear(notificationId, function(wasCleared)
            {
                callbacks[notificationId] = null;
                delete callbacks[notificationId];
            });
        }
    });
    
    chrome.windows.onRemoved.addListener(function(win) 
    {
        console.log("closing window ", win);    
        
        if (lynkUI.chatWindow && win == lynkUI.chatWindow.id)
        {               
            lynkUI.chatWindow = null;
        }
        
        if (lynkUI.videoWindow && win == lynkUI.videoWindow.id)
        {               
            lynkUI.videoWindow = null;
        }               
    }); 
    
    if (window.localStorage["store.settings.server"] && window.localStorage["store.settings.domain"] && window.localStorage["store.settings.username"] && window.localStorage["store.settings.password"])
    {
        lynkUI.server = JSON.parse(window.localStorage["store.settings.server"]);
        lynkUI.domain = JSON.parse(window.localStorage["store.settings.domain"]);   
        lynkUI.username = JSON.parse(window.localStorage["store.settings.username"]);   
        lynkUI.password = JSON.parse(window.localStorage["store.settings.password"]);
        
        chrome.browserAction.setBadgeBackgroundColor({ color: '#ff0000' });
        chrome.browserAction.setBadgeText({ text: 'off' });
        

        if (lynkUI.server && lynkUI.domain && lynkUI.username && lynkUI.password)
        {
            if (window.localStorage["store.settings.enableMidi"] && JSON.parse(window.localStorage["store.settings.enableMidi"]))
            {
                Tletherlynk.Midi.init()
            }
            
            if (window.localStorage["store.settings.enableSip"] && JSON.parse(window.localStorage["store.settings.enableSip"]))
            {
                lynkUI.enableSip = true;
            }
            
            etherlynk.login(lynkUI.server, lynkUI.domain, lynkUI.username, lynkUI.password);            

        } else doOptions();
        
    } else doOptions();
});

window.addEventListener("beforeunload", function () 
{
    if (lynkUI.window) chrome.windows.remove(lynkUI.window.id); 
    etherlynk.logoff();
});

window.addEventListener("unload", function () 
{
    etherlynk.logoff(); 
});
    