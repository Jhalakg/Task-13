var vehicle_old = [];
var vehicle = [];

$( document ).on( "pagecreate", "#map-page", function() {
    var defaultLatLng = new google.maps.LatLng(34.0983425, -118.3267434);  // Default to Hollywood, CA when no geolocation support
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
            zoom: 10,
            center: latlng,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        var map = new google.maps.Map(document.getElementById("map-canvas"), myOptions);
        // Add an overlay to the map of current lat/lng
        var marker = new google.maps.Marker({
            position: latlng,
            map: map,
            title: "Greetings!"
        });
		
		loadVehicle();
		vehicle.forEach(
			function(val, index, array) {
			    createVehicleMarker(val, map);
			}
		);
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







