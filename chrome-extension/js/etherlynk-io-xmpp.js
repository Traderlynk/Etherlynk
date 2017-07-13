function fetchEtherlynks(callback) 
{   
    etherlynk.connection.addHandler(function(message)
    {
        var id = $(message).attr("from");
        var from = $(message).attr("from");
        var to = $(message).attr("to");     
        var reason = null;
        var password = null;
        var composing = false;
        var offerer = null;
        var type = $(message).attr("type");
        
        console.log("message handler", from, to, type)      

        $(message).find('gone').each(function ()   
        {
            var jid = $(this).attr("jid");
            
            if (jid)
            {
                var conference = Strophe.getNodeFromJid(jid);
                var userid = Strophe.getNodeFromJid(from);
                
                $(document).trigger('ofmeet.user.gone', [{id: userid, name: conference}]);
            }
        });
        
        $(message).find('composing').each(function ()      
        {
            composing = true;
        });

        $(document).trigger('ofmeet.conversation.composing', [{id: id}]);          
        
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
            
                $(document).trigger('ofmeet.conversation.invitation', [{id: id, from: from, reason: reason, offerer: offerer, password: password}]);                
                
            } else if (namespace == "http://jabber.org/protocol/muc#user")  {           
                
                $(this).find('reason').each(function() 
                {               
                    reason = $(this).text();
                });
                
                $(this).find('password').each(function() 
                {               
                    password = $(this).text();
                });
                
                $(this).find('decline').each(function() 
                {               
                    from = $(this).attr("from");
                    $(document).trigger("ofmeet.track.removed", {id : track.getParticipantId(), name: name});             
                    
                });

            } else {
                             
            }
        });
        
        return true;
        
    }, null, 'message');
    
    var pinId = 7;
    
    etherlynk.connection.sendIQ($iq({type: "get"}).c("query", {xmlns: "jabber:iq:private"}).c("storage", {xmlns: "storage:bookmarks"}).tree(), function(resp)
    {
        console.log("get bookmarks", resp)

        $(resp).find('conference').each(function() 
        {   
            var jid = $(this).attr("jid");
            var etherlynk = Strophe.getNodeFromJid(jid);
            var muc = Strophe.getDomainFromJid(jid);
            var domain = muc.substring("conference.".length);           // ignore "conference."
            var server = domain + ":7443";
                        
            console.log('ofmeet.bookmark.conference.item', {name: $(this).attr("name"), jid: $(this).attr("jid"), autojoin: $(this).attr("autojoin")});             
            
            if (callback && pinId > -1) callback(
            {
                pinId: pinId--, 
                name: $(this).attr("name"),                 
                pinned: $(this).attr("autojoin"),               
                open: $(this).attr("autojoin"),
                etherlynk: etherlynk, 
                server: server, 
                domain: domain
            });
        })

        $(resp).find('url').each(function() 
        {
            console.log('ofmeet.bookmark.url.item', {name: $(this).attr("name"), url: $(this).attr("url")});
        });

    }, function (error) {       
        console.error(error);
    }); 
    
    etherlynk.connection.sendIQ($iq({type: "get"}).c("query", {xmlns: "jabber:iq:roster"}).tree(), function(resp)
    {
        //console.log("get roster", resp)
        var pinId = 63;
        
        $(resp).find('item').each(function() 
        {   
            var jid = $(this).attr("jid");
            var id = Strophe.getNodeFromJid(jid);
            var name = $(this).attr("name");
            var domain = Strophe.getDomainFromJid(jid);
            var server = domain + ":7443";          
            
            console.log('ofmeet.roster.item',jid, name, server);    
            
            if (callback && pinId < 65) callback(
            {
                pinId: pinId--, 
                name: name,                 
                pinned: "false", 
                id: id,
                jid: jid,
                open: "false", 
                server: server, 
                domain: domain
            });         
            
        })      


    }, function (error) {       
        console.error(error);
    }); 
}

function inviteToConference(lynk)
{
    try {
        var jid = lynk.etherlynk + "@conference." + lynk.domain;
        etherlynk.connection.send($msg({to: lynk.jid}).c("x", {xmlns: "jabber:x:conference", jid: jid}).up());
    } catch (e) {           
        console.error(e);
    }
}


function leaveConference(lynk)
{
    try {
        var jid = lynk.etherlynk + "@conference." + lynk.domain;    
        etherlynk.connection.send($msg({to: lynk.jid, type: "chat"}).c("gone", {xmlns: "http://jabber.org/protocol/chatstates", jid: jid}).up());
    } catch (e) {           
        console.error(e);
    }
}