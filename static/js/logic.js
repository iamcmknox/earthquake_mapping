// GeoJSON data query URL 
var url = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson'
var platesJson = 'https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json'

// Get data and call function to make the map 
d3.json(url).then(function (data) {
  createFeatures(data);
});

// Function to get marker size 
function markerSize(mag) {
  return mag * 5;
};

// Function to get color based on depth 
function markerColor(depth) {
  return depth > 90 ? '#b30000' :
    depth > 70 ? '#e34a33' :
      depth > 50 ? '#fc8d59' :
        depth > 30 ? '#fdbb84' :
          depth > 10 ? '#fdd49e' :
            '#fef0d9'
};

// Function to create map elements 
function createFeatures(data) {

  // Information popups for each marker 
  function popups(feature, layer) {
    layer.bindPopup(
      "<h3>" + feature.properties.place + "</h3><hr>" +
      "<p>Magnitude: " + feature.properties.mag +
      "<br></br>Depth: " + feature.geometry.coordinates[2] +
      "<br></br>Time: " + new Date(feature.properties.time) + "</p"
    );
  };

  // Read geoJSON data
  var earthquakes = L.geoJSON(data, {

    // Bind pop ups
    onEachFeature: popups,

    // Create circle markers
    pointToLayer: function (feature, coordinate) {

      // Marker style
      var marker = {
        radius: markerSize(feature.properties.mag),
        fillColor: markerColor(coordinate.alt),
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
      };

      return L.circleMarker(coordinate, marker)
    }
  });
  
  createMap(earthquakes);
}

function createMap(earthquakes) {

  // Map layers 
  var satelliteTile = L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
    attribution: "© <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> <strong><a href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a></strong>",
    tileSize: 512,
    maxZoom: 18,
    zoomOffset: -1,
    id: "mapbox/satellite-v9",
    accessToken: api_key
  });

  var lightMap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: "light-v10",
    accessToken: api_key
  });

  var outdoorsMap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: "outdoors-v11",
    accessToken: api_key
  });

  // Contain all the layers 
  var baseMaps = {
    "Outdoors": outdoorsMap,
    "Grayscale": lightMap,
    "Satellite": satelliteTile
  };

  // Default map display
  var myMap = L.map("map", {
    center: [
      38.09, -95.71
    ],
    zoom: 5,
    layers: [outdoorsMap, earthquakes]
  });

  // Read tectonic plate geodata 
  d3.json(platesJson).then(function(data) {
    
    // Plate lines  
    var plates = L.geoJSON(data, {
      style: {
        'color': 'yellow',
        'weight': 2
      }
    });

    // Marker layer
    var overlayMaps = {
      "Earthquakes": earthquakes,
      "Tectonic Plates": plates 
    };

    // Layer and overlay legend
    L.control.layers(baseMaps, overlayMaps, {
      collapsed: false
    }).addTo(myMap);
  });


  // Add color legend 
  var legend = L.control({ 
    position: 'bottomright' 
  });

  legend.onAdd = function() {

    var div = L.DomUtil.create('div', 'info legend'),
      grades = [-10, 10, 30, 50, 70, 90]

    // Loop through grades to create labels 
    for (var i = 0; i < grades.length; i++) {
      div.innerHTML +=
        
        // get marker color 
        '<i style="background:' + markerColor(grades[i]) + '"></i> ' +

        // Legend labels (if i+1 exists: add a dash and i+1. Else: current number and + sign )
        grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
    }
    return div;
  };

  legend.addTo(myMap);

};