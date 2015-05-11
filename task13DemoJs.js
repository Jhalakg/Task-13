var vehicle_old;
var vehicle;
var map;
var markerArray = [];
var directionsDisplay;
var directionsService;
var stepDisplay;
var markerArray1 = [];

$( document ).on( "pagecreate", "#map-page", function() {

	directionsService = new google.maps.DirectionsService();

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
            zoom: 12,
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

		// Create a renderer for directions and bind it to the map.
	  var rendererOptions = {
	    map: map
	  }

	  directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions)

	  // Instantiate an info window to hold step text.
	  stepDisplay = new google.maps.InfoWindow();

		setInterval(function(){loadVehicle(); },10000);
    }
});

$(document).ready(function() {   
	$('#end').keyup(function (e) {
		if (e.keyCode == 13) {
			calcRoute();
		}
	});
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

function calcRoute() {

  // First, remove any existing markers from the map.
  for (var i = 0; i < markerArray1.length; i++) {
    markerArray1[i].setMap(null);
  }

  // Now, clear the array itself.
  markerArray1 = [];

  // Retrieve the start and end locations and create
  // a DirectionsRequest using WALKING directions.
  var start = document.getElementById('start').value;
  var end = document.getElementById('end').value;
  var request = {
      origin: start,
      destination: end,
      travelMode: google.maps.TravelMode.TRANSIT
  };

  // Route the directions and pass the response to a
  // function to create markers for each step.
  directionsService.route(request, function(response, status) {
    if (status == google.maps.DirectionsStatus.OK) {
      //var warnings = document.getElementById('warnings_panel');
      //warnings.innerHTML = '<b>' + response.routes[0].warnings + '</b>';
      directionsDisplay.setDirections(response);
      showSteps(response);
    }
  });
}

function showSteps(directionResult) {
  // For each step, place a marker, and add the text to the marker's
  // info window. Also attach the marker to an array so we
  // can keep track of it and remove it when calculating new
  // routes.
  var myRoute = directionResult.routes[0].legs[0];

  for (var i = 0; i < myRoute.steps.length; i++) {
    var marker = new google.maps.Marker({
      position: myRoute.steps[i].start_location,
      map: map
    });
    attachInstructionText(marker, myRoute.steps[i].instructions);
    markerArray[i] = marker;
  }
}

function attachInstructionText(marker, text) {
  google.maps.event.addListener(marker, 'click', function() {
    // Open an info window when the marker is clicked on,
    // containing the text of the step.
    stepDisplay.setContent(text);
    stepDisplay.open(map, marker);
  });
}