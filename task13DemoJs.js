var vehicle_old;
var vehicle;
var map;
var markerArray = [];
var directionsDisplay;
var directionsService;
var stepDisplay;
var markerArray1 = [];
var interval;

var autocomplete2;

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

	  directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);

    directionsDisplay.setPanel(document.getElementById('directions-panel'));

	  // Instantiate an info window to hold step text.
	  stepDisplay = new google.maps.InfoWindow();

    var start = (document.getElementById('start'));
    var end = (document.getElementById('end'));

    map.controls[google.maps.ControlPosition.TOP_LEFT].push(start);
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(end);

    var autocomplete1 = new google.maps.places.Autocomplete(start);
    autocomplete1.bindTo('bounds', map);

    autocomplete2 = new google.maps.places.Autocomplete(end);
    autocomplete2.bindTo('bounds', map);

    google.maps.event.addListener(autocomplete2, 'place_changed', function() {
      calcRoute();
     });

    // load vehicle marker the first time
    loadVehicle();
    
		this.interval = setInterval(function(){loadVehicle(); },10000);
    }
});

function askDirection(){ 
  if (event.keyCode === 13) {
    calcRoute();   
  }
}

function loadVehicle(rt){ // this for running the bus real time tracking

  var pac_api = "http://realtime.portauthority.org/bustime/api/v2/getvehicles?key=8WhZtp3KqS6hSc4MBriZeA6uq&format=json&rt=";

  var bus_route="";

  if (!rt) {
    bus_route = "61A";
  } else {
    for (var i = 0; i < rt.length; i++) {
      bus_route += rt[i];
      if (i != 0 || i != rt.length ){
        bus_route += ",";
      }
    }
  }

  pac_api += bus_route;  

	jQuery.ajax(
		pac_api,
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

      // Now, clear the array itself.
      markerArray = [];

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

function calcRoute() { // this is for creating route direction

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
      provideRouteAlternatives: true,
      travelMode: google.maps.TravelMode.TRANSIT
  };

  // Route the directions and pass the response to a
  // function to create markers for each step.
  directionsService.route(request, function(response, status) {
    if (status == google.maps.DirectionsStatus.OK) {
      //var warnings = document.getElementById('warnings_panel');
      //warnings.innerHTML = '<b>' + response.routes[0].warnings + '</b>';

      var multiRt = response.routes;
      var rt=[];
      var j = 0;

      for (var i = 0; i < multiRt.length; i++) {
        var myRt = multiRt[i].legs[0];
                
        for (var k =0; k < myRt.steps.length; k++) {
          if (myRt.steps[k].travel_mode === "TRANSIT") {
            rt[j] = myRt.steps[k].transit.line.short_name;
            j += 1;
          }
        }
      } 

      // clear old interval
      window.clearInterval(interval);

      // clear all previous bus marker
      for (var i = 0; i < markerArray.length; i++) {
          markerArray[i].setMap(null);
        }

      // load vehicle marker the first time
      loadVehicle(rt);

      // load vehicle marker using timer
      this.interval = setInterval(function(){loadVehicle(rt); },10000);

      directionsDisplay.setDirections(response);
      showSteps(response);
    }
  });
}

function showSteps(directionResult) { // this is for creating directions step
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

function attachInstructionText(marker, text) { // this for creating instructions
  google.maps.event.addListener(marker, 'click', function() {
    // Open an info window when the marker is clicked on,
    // containing the text of the step.
    stepDisplay.setContent(text);
    stepDisplay.open(map, marker);
  });
}