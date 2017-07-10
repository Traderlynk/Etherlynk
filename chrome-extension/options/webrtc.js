window.addEventListener("load", function()
{
 	navigator.webkitGetUserMedia({ audio: true, video: true },
                function (stream) {
               
                    setTimeout(function() 
                    {
			    stream.getAudioTracks().forEach(function (track) 
			    {
				track.stop();
			    });
                    
                    }, 1000);

                },
                function (error) {
                    alert("To experience the full functionality of TraderLynk Belfry, please connect audio and video devices.");
                    console.error("Error trying to get the stream:: " + error.message);
                }
        );
        
	navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
	
	function onMIDISuccess(midiAccess) {
	    console.log('MIDI Access Object', midiAccess);
	}

	function onMIDIFailure(e) {
	    console.error("No access to MIDI devices or your browser doesn't support WebMIDI API. Please use WebMIDIAPIShim " + e);
	}	
       
});