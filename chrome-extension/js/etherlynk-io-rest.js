function fetchEtherlynks(callback)
{
	var token = btoa(lynkUI.username + ":" + lynkUI.password);
	var options = {method: "GET", headers: {"Authorization":token, "Accept":"application/json", "Content-Type":"application/json"}}
	var url = "https://" + lynkUI.server + "/rest/api/restapi/v1/etherlynk/" + lynkUI.username;	
	
	fetch(url, options).then(function(response){ return response.json()}).then(function(json) 
	{
		console.log("getEtherlynks", json);
	
		if (json.lynk instanceof Array)
		{
			for (var i=0; i<json.lynk.length; i++)
			{	
				if (callback) callback(json.lynk[i]);
			}

		} else if (json.lynk) {
			if (callback) callback(json.lynk);
		}
		
	}).catch(function (err) {
		console.error('getEtherlynks error!', err);
	});
}

function restRequest(verb, url)
{
	console.debug("restRequest", url);
	var options = {method: verb, headers: {"Authorization": "Basic " + btoa(lynkUI.username + ":" + lynkUI.password)}}

	fetch(url, options).then(function(response) 
	{			
		console.debug('restRequest ok', url, response);
		
	}).catch(function (err) {
		console.error('restRequest error', err);
	});
}
