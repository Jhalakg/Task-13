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
var geocoder = new google.maps.Geocoder();
// this script is courtesy of pitlivebus.com
// Set the center as Firebase HQ
var locations = {
  "Pittsburgh": [40.440876, -79.9497555]
};

var center = locations["Pittsburgh"];
var pittsburgh_bounds = new google.maps.LatLngBounds(new google.maps.LatLng(40.323977, -80.291903), new google.maps.LatLng(40.540356, -79.616930))

// Query radius
var radiusInKm = 1.5;
var vehiclesInQuery = {};
var geoQueries = [];

function addFirebaseRef(url) {
  // Get a reference to the Firebase public transit open data set
  var transitFirebaseRef = new Firebase(url)

  // Create a new GeoFire instance, pulling data from the public transit data
  var geoFire = new GeoFire(transitFirebaseRef.child("_geofire"));

  // Create a new GeoQuery instance
  var geoQuery = geoFire.query({
    center: center,
    radius: radiusInKm
  });
  geoQueries.push(geoQuery);

  /* Adds new vehicle markers to the map when they enter the query */
  geoQuery.on("key_entered", function(vehicleId, vehicleLocation) {
    // Specify that the vehicle has entered this query
    dataset = vehicleId.split(":")[0];
    vehicleIdWithoutDataset = vehicleId.split(":")[1];
    vehiclesInQuery[vehicleId] = true;

    // Look up the vehicle's data in the Transit Open Data Set
    transitFirebaseRef.child(dataset).child("vehicles").child(vehicleIdWithoutDataset).once("value", function(dataSnapshot) {
      // Get the vehicle data from the Open Data Set
      vehicle = dataSnapshot.val();

      // If the vehicle has not already exited this query in the time it took to look up its data in the Open Data
      // Set, add it to the map
      if (vehicle !== null && vehiclesInQuery[vehicleId] === true) {
        // Add the vehicle to the list of vehicles in the query
        vehiclesInQuery[vehicleId] = vehicle;

        // Create a new marker for the vehicle
        vehicle.marker = createVehicleMarker(vehicle, getVehicleColor(vehicle));
      }
    });
  });

  /* Moves vehicles markers on the map when their location within the query changes */
  geoQuery.on("key_moved", function(vehicleId, vehicleLocation) {
    // Get the vehicle from the list of vehicles in the query
    var vehicle = vehiclesInQuery[vehicleId];

    // Animate the vehicle's marker
    if (typeof vehicle !== "undefined" && typeof vehicle.marker !== "undefined") {
      vehicle.marker.animatedMoveTo(vehicleLocation);
    }
  });

  /* Removes vehicle markers from the map when they exit the query */
  geoQuery.on("key_exited", function(vehicleId, vehicleLocation) {
    // Get the vehicle from the list of vehicles in the query
    var vehicle = vehiclesInQuery[vehicleId];

    // If the vehicle's data has already been loaded from the Open Data Set, remove its marker from the map
    if (vehicle !== true) {
      vehicle.marker.setMap(null);
    }

    // Remove the vehicle from the list of vehicles in the query
    delete vehiclesInQuery[vehicleId];
  });
}

addFirebaseRef("https://publicdata-transit.firebaseio.com/");
addFirebaseRef("https://alpire.firebaseio.com/");
// this script is courtesy of pitlivebus.com

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
      // this script is courtesy of pitlivebus.com

        // Get the location as a Google Maps latitude-longitude object
        var loc = latlng;

        if(!pittsburgh_bounds.contains(latlng)) {
          loc = locations["Pittsburgh"];
        }
        // this script is courtesy of pitlivebus.com

        var myOptions = {
            zoom: 16,
            center: loc,
            disableDefaultUI: true,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        location_overlay = new LocationOverlay(map);

        map = new google.maps.Map(document.getElementById("map-canvas"), myOptions);

        // Create the DIV to hold the control and
        // call the CenterControl() constructor passing
        // in this DIV.
        var centerControlDiv = document.createElement('div');
        var centerControl = new CenterControl(centerControlDiv, map, latlng);

        centerControlDiv.index = 1;
        map.controls[google.maps.ControlPosition.TOP_CENTER].push(centerControlDiv);

    		// Create a renderer for directions and bind it to the map.
    	  var rendererOptions = {
    	    map: map
    	  }

    	  directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);

        directionsDisplay.setPanel(document.getElementById('directions-panel'));

    	  // Instantiate an info window to hold step text.
    	  // stepDisplay = new google.maps.InfoWindow();
        // Retrieving User Travel Origins and Destination Input Box
        var start = (document.getElementById('start'));
        var end = (document.getElementById('end'));

        // Embed it within Google Maps
        //map.controls[google.maps.ControlPosition.TOP_LEFT].push(start);
        //map.controls[google.maps.ControlPosition.TOP_LEFT].push(end);

        // Embed Menu button panel within google Maps
        map.controls[google.maps.ControlPosition.TOP_RIGHT].push(btnPanel);
         // Embed Menu button panel within google Maps
        map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(adBox);

        // Link the input box with google Autocomplete API to retrieve address suggestions
        var autocomplete1 = new google.maps.places.Autocomplete(start);
        autocomplete1.bindTo('bounds', map);

        autocomplete2 = new google.maps.places.Autocomplete(end);
        autocomplete2.bindTo('bounds', map);
        // If a user select a destination create a google direction line in the map
        google.maps.event.addListener(autocomplete2, 'place_changed', function() {
          calcRoute();
         });
        // this script is courtesy of pitlivebus.com
        var updateCriteria = _.debounce(function() {
          var bounds = map.getBounds();
          if(typeof(Storage) !== "undefined") {
            localStorage.setItem("center", bounds.getCenter());
          }
          var criteria = {
            center: [bounds.getCenter().lat(), bounds.getCenter().lng()],
            radius: Math.min(getDistance(bounds.getNorthEast(), bounds.getSouthWest()) / 2 / 1000, 25)
          };
          for(geoQuery in geoQueries) {
            geoQueries[geoQuery].updateCriteria(criteria);
          }
        }, 10);

        google.maps.event.addListener(map, "bounds_changed", updateCriteria);
        // this script is courtesy of pitlivebuss.com
        
        // load vehicle marker the first time
        // loadVehicle();
        // Set new vehicle marker every ten secs
    		// this.interval = setInterval(function(){loadVehicle(); },10000);
        // Add time list on departure and arrival time select box in menu panel
        addTimeOpt();
        codeLatLng(latlng);

        $( "#refresh" ).click(function() {
          calcRoute();
        });
    }
});

function addTimeOpt() {
  // This function is to add option lists of travel departure and arrival time
  //var depart = document.getElementById('depart');
  //var arrive = document.getElementById('arrive');

  var hour = document.getElementById('hour');
  var minutes = document.getElementById('minute');
  var am = document.getElementById('ampm');
  var now = new Date();
  var nowHour = now.getHours();
  var nowMinute = now.getMinutes();
  var amVal = nowHour < 12 ? 1 : 2;
  var pmHour = nowHour - 12;

  
  for (var i = 0; i < 13; i++) {
      if (nowHour == i) {
        hour.innerHTML += '<option value=\"' + i + '\" selected=\"selected\">' + i + '</option>';
      } else if (pmHour == i) {
        hour.innerHTML += '<option value=\"' + i+ '\" selected=\"selected\">' + i + '</option>';
      } else {
        hour.innerHTML += '<option value=\"' + i + '\">' + i + '</option>';  
      }
  }

  var myselect = $("select#hour");
  myselect.selectmenu("refresh");  
    
  for (var j = 0; j < 60; j += 1) {
    var y = j < 10 ? '0' + j : j;
    if (j == nowMinute) {
      minute.innerHTML += '<option value=\"' + j + '\" selected=\"selected\">' + y + '</option>';
      
    } else {
      minute.innerHTML += '<option value=\"' + j + '\">' + y + '</option>';
    }    
  }

  var myselect = $("select#minute");
  myselect.selectmenu("refresh");

  am.innerHTML += '<option value=\"0\">' + "AM" + '</option>';
  am.innerHTML += '<option value=\"1\">' + "PM" + '</option>';
  if (amVal == 1) {
    $("#ampm option[value='0']").attr("selected","selected");
  } else {
    $("#ampm option[value='1']").attr("selected","selected");      
  }

  var myselect = $("select#ampm");
  myselect.selectmenu("refresh"); 
}

function codeLatLng(position) {
  // this function to automatically fill travel origin input box with user current position
  geocoder.geocode({'latLng': position}, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      if (results[0]) {
        $( "#start" ).val( results[0].formatted_address );
      } else {
        alert('No results found');
      }
    } else {
      alert('Geocoder failed due to: ' + status);
    }
  });
}

function loadVehicle(rt){ 
  // this function for running the bus real time tracking -- unused since pac server does not provide header tag of cross server origin
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
  // this function creates route direction
  // First, remove any existing markers from the map.
  for (var i = 0; i < markerArray1.length; i++) {
    markerArray1[i].setMap(null);
  }

  // Now, clear array of bus marker objects
  markerArray1 = [];

  // Retrieve time departure
  var hour = document.getElementById('hour').value;
  var minute = document.getElementById('minute').value;
  var am = document.getElementById('ampm').value;
  var realHour = Number(hour) + Number((am * 12));

  var time = new Date();
  time.setHours(realHour);
  time.setMinutes(minute);

  var ms = time.getTime();

  var askTime = new Date(ms);

  var start = document.getElementById('start').value;
  var end = document.getElementById('end').value;

  check = $( "#nav1" ).hasClass( "ui-btn-active" )

  if (check) {
    // Create a DirectionsRequest using TRANSIT directions with departure time
    var request = {
        origin: start,
        destination: end,
        provideRouteAlternatives: true,
        travelMode: google.maps.TravelMode.TRANSIT,
        transitOptions: {
          departureTime: askTime
        }
    };  
  } else {
    // Create a DirectionsRequest using TRANSIT directions with arrival time
    var request = {
      origin: start,
      destination: end,
      provideRouteAlternatives: true,
      travelMode: google.maps.TravelMode.TRANSIT,
      transitOptions: {
        arrivalTime: askTime
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
      //window.clearInterval(interval);

      // clear all previous bus marker
      /*for (var i = 0; i < markerArray.length; i++) {
          markerArray[i].setMap(null);
        }*/

      // load vehicle marker the first time
      //loadVehicle(rt);

      // load vehicle marker using timer
      //this.interval = setInterval(function(){loadVehicle(rt); },10000);

      directionsDisplay.setDirections(response);
      //showSteps(response);
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

function CenterControl(controlDiv, map, position) {

  // Set CSS for the control border
  var controlUI = document.createElement('div');
  controlUI.style.backgroundColor = '#eeeeee';
  controlUI.style.border = '2px solid #fff';
  controlUI.style.borderRadius = '3px';
  controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
  controlUI.style.cursor = 'pointer';
  controlUI.style.marginTop = '10px';
  controlUI.style.marginBottom = '22px';
  controlUI.style.marginRight = '5px';
  controlUI.style.textAlign = 'center';
  controlUI.title = 'Click to recenter the map';
  controlDiv.appendChild(controlUI);

  // Set CSS for the control interior
  var controlText = document.createElement('div');
  controlText.style.color = 'rgb(25,25,25)';
  controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
  controlText.style.fontSize = '10px';
  controlText.style.lineHeight = '25px';
  controlText.style.paddingLeft = '5px';
  controlText.style.paddingRight = '5px';
  controlText.innerHTML = 'My Location';
  controlUI.appendChild(controlText);

  // Setup the click event listeners: simply set the map to user location
  google.maps.event.addDomListener(controlUI, 'click', function() {
    map.setCenter(position);
    codeLatLng(position);
  });

}

// this script is courtesy of pitlivebus.com
/**********************/
/*  HELPER FUNCTIONS  */
/**********************/
/* Adds a marker for the inputted vehicle to the map */
function createVehicleMarker(vehicle, vehicleColor) {
  var icon_url;
  if(typeof vehicle.vtype !== "undefined") {
    icon_url = "https://chart.googleapis.com/chart?chst=d_bubble_icon_text_small&chld=" + vehicle.vtype + "|bbT|" + vehicle.routeTag + "|" + vehicleColor + "|eee";
  } else {
    icon_url = "https://chart.googleapis.com/chart?chst=d_bubble_text_small&chld=bbT|" + vehicle.routeTag + "|" + vehicleColor + "|eee";
  }
  var marker = new google.maps.Marker({
    icon: icon_url,
    position: new google.maps.LatLng(vehicle.lat, vehicle.lon),
    optimized: true,
    map: map
  });

  return marker;
}

function getVehicleColor(vehicle) {
  return getColor(vehicle.routeTag);
}

/* Returns true if the two inputted coordinates are approximately equivalent */
function coordinatesAreEquivalent(coord1, coord2) {
  return (Math.abs(coord1 - coord2) < 0.000001);
}

/* Animates the Marker class (based on https://stackoverflow.com/a/10906464) */
google.maps.Marker.prototype.animatedMoveTo = function(newLocation) {
  var toLat = newLocation[0];
  var toLng = newLocation[1];

  var fromLat = this.getPosition().lat();
  var fromLng = this.getPosition().lng();

  if (!coordinatesAreEquivalent(fromLat, toLat) || !coordinatesAreEquivalent(fromLng, toLng)) {
    var percent = 0;
    var latDistance = toLat - fromLat;
    var lngDistance = toLng - fromLng;
    var interval = window.setInterval(function () {
      percent += 0.01;
      var curLat = fromLat + (percent * latDistance);
      var curLng = fromLng + (percent * lngDistance);
      var pos = new google.maps.LatLng(curLat, curLng);
      this.setPosition(pos);
      if (percent >= 1) {
        window.clearInterval(interval);
      }
    }.bind(this), 50);
  }
};

var rad = function(x) {
  return x * Math.PI / 180;
};

var getDistance = function(p1, p2) {
  var R = 6378137; // Earth’s mean radius in meter
  var dLat = rad(p2.lat() - p1.lat());
  var dLong = rad(p2.lng() - p1.lng());
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad(p1.lat())) * Math.cos(rad(p2.lat())) *
    Math.sin(dLong / 2) * Math.sin(dLong / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d; // returns the distance in meter
};
    
var baseline = '0'.charCodeAt(0)
String.prototype.hashCode = function()
{
    var hash = 0.1;
    if (this.length === 0) return hash;
    for (var i = 0; i < this.length; i++) {
        var character  = this.charCodeAt(i) - baseline;
        hash += Math.pow(2, -i)*(character%8)/8
    }
    hash = hash % 1.0
    hash = Math.max(0, Math.min(1, Math.abs(hash)));
    return hash;
}
    
/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  l       The lightness
 * @return  Array           The RGB representation
 */
function hslToRgb(h, s, l){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [(r * 255), (g * 255), (b * 255)];
}

function decToHex(i)
{
    return (Math.floor(i)+0x10000).toString(16).substr(-2).toUpperCase();
}

function getColor(tag)
{
    code = tag.hashCode()
    
    if(code > 0.05 && code < 0.25)
    {
        code += 0.6;
    } 
    colors = hslToRgb(code, 0.6, 0.5);
    color = ""+decToHex(colors[0])+decToHex(colors[1])+decToHex(colors[2])
    
    //console.log(tag + " " + color + " " + code)
    return color;
}

LocationOverlay.prototype = new google.maps.OverlayView();

function LocationOverlay(map) {
  this.map_ = map;
  this.div_ = null;
  this.location_ = null;
  this.accuracy_ = null;
  this.setMap(map);
}

LocationOverlay.prototype.onAdd = function() {
  this.div_ = document.getElementById('location_overlay')

  var div = document.createElement('div');
  div.className = 'widget-mylocation-map-effect-holder';
  div.style.border = 'none';
  div.style.borderWidth = '0px';
  div.style.position = 'absolute';
  div.style.visibility = 'hidden';


  var div2 = document.createElement('div');
  div2.className = 'widget-mylocation-map-effect'

  var div3 = document.createElement('div');
  div3.className = 'widget-mylocation-map-effect-pulse'

  div.appendChild(div2);
  div.appendChild(div3);
  this.div_ = div;

  var panes = this.getPanes();
  panes.overlayImage.appendChild(this.div_);
};

LocationOverlay.prototype.updateLocation = function(location, accuracy) {
  this.location_ = location;
  this.accuracy_ = accuracy;
  this.draw();
}

LocationOverlay.prototype.draw = function() {
  if(this.location_ !== null) {
    var overlayProjection = this.getProjection();
    var position = overlayProjection.fromLatLngToDivPixel(this.location_);
    var div = this.div_;
    div.style.left = (position.x) + 'px';
    div.style.top = (position.y) + 'px';

    var circle = new google.maps.Circle({
      center: this.location_,
      radius: this.accuracy_,
      map: this.map,
      fillOpacity: 0,
      strokeOpacity: 0
    });

    var length = Math.abs(overlayProjection.fromLatLngToDivPixel(circle.getBounds().getSouthWest()).x - overlayProjection.fromLatLngToDivPixel(circle.getBounds().getNorthEast()).x);

    var dot = this.div_.childNodes[0];
    dot.style.left = '-6.5px';
    dot.style.top = '-6.5px';
    dot.style.position = 'absolute';

    var pulse = this.div_.childNodes[1];
    pulse.style.width = length + 'px';
    pulse.style.height = length + 'px';
    pulse.style.borderRadius = length + 'px';
    pulse.style.left = -length / 2.0 + 'px';
    pulse.style.top = -length / 2.0 + 'px';

    this.map_.panTo(circle.getCenter());
  }
};

LocationOverlay.prototype.onRemove = function() {
  this.div_.parentNode.removeChild(this.div_);
};


LocationOverlay.prototype.hide = function() {
  if (this.div_) {
    this.div_.style.visibility = 'hidden';
  }
};

LocationOverlay.prototype.show = function() {
  if (this.div_) {
    this.div_.style.visibility = 'visible';
  }
};

LocationOverlay.prototype.toggle = function() {
  if (this.div_) {
    if (this.div_.style.visibility == 'hidden') {
      this.show();
    } else {
      this.hide();
    }
  }
};

// Detach the map from the DOM via toggleDOM().
// Note that if we later reattach the map, it will be visible again,
// because the containing <div> is recreated in the overlay's onAdd() method.
LocationOverlay.prototype.toggleDOM = function() {
  if (this.getMap()) {
    // Note: setMap(null) calls OverlayView.onRemove()
    this.setMap(null);
  } else {
    this.setMap(this.map_);
  }
};
// this script is courtesy of pitlivebus.com
