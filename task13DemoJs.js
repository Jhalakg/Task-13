var vehicle_old;
var vehicle;
var map;
var markerArray = [];
var directionsDisplay;
var directionsService = new google.maps.DirectionsService();
var stepDisplay;
var markerArray1 = [];
var interval;
var autocomplete2;

function padDigits(number, digits) {
    return Array(Math.max(digits - String(number).length + 1, 0)).join(0) + number;
}

$( document ).on( "pagecreate", "#map-page", function() {
    // default location for pittsburgh
    var defaultLatLng = new google.maps.LatLng(40.440876, -79.9497555);
    // Getting current location
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
    // Drawing Google Map
    function drawMap(latlng) {
        var myOptions = {
            zoom: 12,
            center: latlng,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };

        this.map = new google.maps.Map(document.getElementById("map-canvas"), myOptions);

    		// Create a renderer for directions and bind it to the map.
    	  var rendererOptions = {
    	    map: map
    	  }

    	  directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);

        directionsDisplay.setPanel(document.getElementById('directions-panel'));

    	  // Instantiate an info window to hold step text.
    	  stepDisplay = new google.maps.InfoWindow();
        // Retrieving User Travel Origins and Destination Input Box
        var start = (document.getElementById('start'));
        var end = (document.getElementById('end'));
        // Embed it within Google Maps
        map.controls[google.maps.ControlPosition.TOP_LEFT].push(start);
        map.controls[google.maps.ControlPosition.TOP_LEFT].push(end);
        // Embed Menu button panel within google Maps
        map.controls[google.maps.ControlPosition.TOP_RIGHT].push(btnPanel);
        // Link the input box with google Autocomplete API to retrieve address suggestions
        var autocomplete1 = new google.maps.places.Autocomplete(start);
        autocomplete1.bindTo('bounds', map);

        autocomplete2 = new google.maps.places.Autocomplete(end);
        autocomplete2.bindTo('bounds', map);
        // If a user select a destination create a google direction line in the map
        google.maps.event.addListener(autocomplete2, 'place_changed', function() {
          calcRoute();
         });

        // load vehicle marker the first time
        loadVehicle();
        // Set new vehicle marker every ten secs
    		this.interval = setInterval(function(){loadVehicle(); },10000);
        // Add time list on departure and arrival time select box in menu panel
        addTimeOpt();
    }
});

function addTimeOpt() {
  // This function is to add option lists of travel departure and arrival time
  var depart = document.getElementById('depart');
  var arrive = document.getElementById('arrive');

  for (var i = 0; i < 24; i++) {
    if (i > 11) {
        z = i - 12;
        z = z < 10 ? '0' + z : z;
        amPM = " PM";
      } else {
        z = i < 10 ? '0' + i : i;
        amPM = " AM"
      }
    for (var j = 0; j < 60; j += 1) {
      var x = i < 10 ? '0' + i : i;
      var y = j < 10 ? '0' + j : j;

      timeVal = x + ':' + y;
      timeOpt = z + ':' + y + amPM;
      
      depart.innerHTML += '<option value=\"'+ timeVal+ '\">' + timeOpt + '</option>';
      arrive.innerHTML += '<option value=\"'+ timeVal+ '\">' + timeOpt + '</option>';
    }
  }
}

function loadVehicle(rt){ 
  // this function for running the bus real time tracking
  var pac_api = "http://realtime.portauthority.org/bustime/api/v2/getvehicles?key=8WhZtp3KqS6hSc4MBriZeA6uq&format=json&rt=";

  var bus_route="";

  if (!rt) {
    bus_route = "61A"; // default bus real time marker for first loading
  } else {
    for (var i = 0; i < rt.length; i++) {
      bus_route += rt[i];
      if (i != 0 || i != rt.length ){
        bus_route += ",";
      }
    }
  }

  pac_api += bus_route;

  // Get json object from PAAC API Vehicle Location Tracking
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
      // Create a bus marker for each route
      // First clear previous marker from the map  
			for (i = 0; i < markerArray.length; i++) {
    			markerArray[i].setMap(null);
  			}

      // Now, clear array of marker objects
      markerArray = [];
      // Create new marker for each bus
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

function calcRoute() { 
  // this is for creating route direction
  // First, remove any existing markers from the map.
  for (var i = 0; i < markerArray1.length; i++) {
    markerArray1[i].setMap(null);
  }

  // Now, clear array of bus marker objects
  markerArray1 = [];
  // Retrieve time departure
  var departure = document.getElementById('depart').value;

  if (departure == "Now") { // If user pick now get current time
    var departureTime = new Date();
  } else { // Prepare time object for departure
    var bits = departure.split(':');
    var now = new Date();

    var time = new Date();
    time.setHours(bits[0]);
    time.setMinutes(bits[1]);

    var ms = time.getTime();
    /*if (ms < now.getTime()) {
      ms += 24 * 60 * 60 * 1000;
    }*/

    var departureTime = new Date(ms);
  }

  // Retrieve the start and end locations
  var start = document.getElementById('start').value;
  var end = document.getElementById('end').value;
  // Create a DirectionsRequest using TRANSIT directions with departure time
  var request = {
      origin: start,
      destination: end,
      provideRouteAlternatives: true,
      travelMode: google.maps.TravelMode.TRANSIT,
      transitOptions: {
        departureTime: departureTime
      }
  };
  // Retrieve arrival time preference
  var arrival = document.getElementById('arrive').value;

  if (arrival != "None") { // If user not selecting none use arrival time instead of departure time
    var bits = arrival.split(':');
    var now = new Date();

    var time = new Date();
    time.setHours(bits[0]);
    time.setMinutes(bits[1]);

    var ms = time.getTime();
    /*if (ms < now.getTime()) {
      ms += 24 * 60 * 60 * 1000;
    }*/

    var arrivalTime = new Date(ms);
    // Create a DirectionsRequest using TRANSIT directions with arrival time
    var request = {
      origin: start,
      destination: end,
      provideRouteAlternatives: true,
      travelMode: google.maps.TravelMode.TRANSIT,
      transitOptions: {
        arrivalTime: arrivalTime
      }
    };
  }
  

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