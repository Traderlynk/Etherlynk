/**
 * etherlynk-io-sip.js
 */
 
var etherlynkSip = (function(sip)
{
    sip.fetchEtherlynks = function(callback) 
    {  
    
    }
    
    sip.inviteToConference = function (lynk)
    {
        try {

        } catch (e) {           
            console.error(e);
        }
    }


    sip.leaveConference = function(lynk)      // user action event to far party
    {
        try {

        } catch (e) {           
            console.error(e);
        }
    }

    sip.broadcastConference = function(lynk, state)       // user feedback event to all participants
    {
        try {

            }

        } catch (e) {           
            console.error(e);
        }
    }
    
    
    return sip;
        
}(etherlynkSip || {}));     