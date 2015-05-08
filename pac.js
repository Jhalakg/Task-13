(function(){

	function firstLoad(){

		var htmlString = "";

		jQuery.ajax(
			"http://realtime.portauthority.org/bustime/api/v2/getvehicles?key=8WhZtp3KqS6hSc4MBriZeA6uq&rt=71B,71D&format=json",
			{
				dataType: "json",
				type: "GET",
				error: function(jqXHR, textStatus, errorThrown) {
					alert(errorThrown);
				},
				success: function(data, textStatus, jqXHR) {					
					vehicle = data["bustime-response"].vehicle;

					vehicle.forEach(
						function(val, index, array) {
							htmlString += "lat: " + val.lat + "lon: " + val.lon + "next \\";
							$("#desc").html(htmlString);
						}
					);
				}
			}
		);
	}

	firstLoad();	

})(window);