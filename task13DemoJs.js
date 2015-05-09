var vehicle_old;
var vehicle;
var map;
var markerArray = [];

$( document ).on( "pagecreate", "#map-page", function() {
    var defaultLatLng = new google.maps.LatLng(40.440876, -79.9497555);  // Default to Pittsburgh
    if ( navigator.geolocation ) {
        function success(pos) {
            // Location found, show map with these coordinates
            drawMap(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
        }
        function fail(error) {
            drawMap(defaultLatLng);  // Failed to find location, show default map
        }
        // Find the users current position.  Cache the location for 5 minutes, timeout after 6 seconds
        navigator.geolocation.getCurrentPosition(success, fail, {maximumAge: 500000, enableHighAccuracy:true, timeout: 6000});
    } else {
        drawMap(defaultLatLng);  // No geolocation support, show default map
    }
    function drawMap(latlng) {
        var myOptions = {
            zoom: 11,
            center: latlng,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        this.map = new google.maps.Map(document.getElementById("map-canvas"), myOptions);
//         // Add an overlay to the map of current lat/lng
//         var marker = new google.maps.Marker({
//             position: latlng,
//             map: map,
//             title: "Greetings!"
//         });
		
		//loadVehicle();

		setInterval(function(){loadVehicle(); },10000);
    }
});

function loadVehicle(){
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
				//vehicle.forEach(function(val, index, array) {	
			    	//createVehicleMarker(val, map);
				//}

			for (i = 0; i < markerArray.length; i++) {
    			markerArray[i].setMap(null);
  			}

			for (var i = 0; i < vehicle.length; i++) {
				var icon_url = "https://chart.googleapis.com/chart?chst=d_bubble_icon_text_small&chld=bus" 
								+ "|bbT|" + vehicle[i].rt + "|FFBB00|000000";
      			var marker = new google.maps.Marker({
        			icon: icon_url,
    				position: new google.maps.LatLng(vehicle[i].lat, vehicle[i].lon),
    				optimized: true,
    				map: map
      			});
      		markerArray[i] = marker;
  			}
			}
		}
	);
}

function createVehicleMarker(vehicle, map) {
  var icon_url = "https://chart.googleapis.com/chart?chst=d_bubble_icon_text_small&chld=bus" + "|bbT|" + vehicle.rt + "|FFBB00|000000";
  var marker = new google.maps.Marker({
    icon: icon_url,
    position: new google.maps.LatLng(vehicle.lat, vehicle.lon),
    optimized: true,
    map: map
  });
}







