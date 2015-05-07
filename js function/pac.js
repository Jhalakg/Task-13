(function(){

	function firstLoad(){

		var htmlString = "";

		jQuery.ajax(
			"http://realtime.portauthority.org/bustime/api/v2/gettime?key=dgAe22vfhjeAQuRFmpswKjye5&format=json",
			{
				dataType: "json",
				type: "GET",
				error: function(jqXHR, textStatus, errorThrown) {
					alert(errorThrown);
				},
				success: function(data, textStatus, jqXHR) {					
					htmlString = data.bustime_response.tm;
					$("#box").html(htmlString);
				}
			}
		);
	}

	firstLoad();	

})(window);