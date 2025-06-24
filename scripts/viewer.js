let mainMap = null;
let currentElement = "";

$("input[type=text]").focus(function () {
  currentElement = $(this).attr("id");
  console.log("Focused input ID:", currentElement);
});

$("#distance-slider").on("input", function () {
  $("#val").text($("#distance-slider")[0].value);
  drawCircle();
});

function drawCircle() {
  centroid = $("#" + currentElement)
    .val()
    .split(",");
  // console.log(centroid);
  centroid = [parseFloat(centroid[0]), parseFloat(centroid[1])];
  radius = parseFloat($("#val").text());
  // console.log(radius);

  let circle = new ol.geom.Circle(centroid, radius * 1000.0);

  const vectorSource = new ol.source.Vector({
    features: [new ol.Feature(circle)],
  });

  const vectorLayer = new ol.layer.Vector({
    name: "circle",
    source: vectorSource,
    style: new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: "#ff0000",
        width: 2,
      }),
      fill: new ol.style.Fill({
        color: "rgba(255, 255, 255, 0.4)",
      }),
    }),
  });
  removeLayerByName(mainMap, "circle");
  mainMap.addLayer(vectorLayer);
}

function init() {
  //Define th
  //
  // p view
  let mainView = new ol.View({
    extent: [3124925, -599644, 3537136, -158022],
    center: [3336467, -385622],
    minZoom: 6,
    maxZoom: 14,
    zoom: 9,
  });

  //Initialize the map
  mainMap = new ol.Map({
    controls: [],
    target: "map" /*Set the target to the ID of the map*/,
    view: mainView,
  });

  let baseLayer = getBaseMap("osm");

  mainMap.addLayer(baseLayer);

  mainMap.on("click", function (evt) {
    let val = evt.coordinate[0].toString() + "," + evt.coordinate[1].toString();
    if (currentElement != "") {
      $("#" + currentElement).val(val);
      let name = "location_1";
      let color = "#FF0000";

      if (currentElement == "end") {
        name = "location_2";
        color = "#15d758";
      }

      const feature = new ol.Feature({
        geometry: new ol.geom.Point([evt.coordinate[0], evt.coordinate[1]]),
      });

      feature.setStyle(
        new ol.style.Style({
          image: new ol.style.Icon({
            color: color,
            src: "./images/location-pin-svgrepo-com.svg",
            width: 30,
          }),
        })
      );

      const layer = new ol.layer.Vector({
        name: name,
        source: new ol.source.Vector({
          features: [feature],
        }),
      });
      layer.setZIndex(100);

      removeLayerByName(mainMap, name);
      mainMap.addLayer(layer);

      if (currentElement == "Location-search") {
        drawCircle();
      }
    }
  });
}

/* •  •  • */

function getBaseMap(name) {
  let baseMap = {
    osm: {
      url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      attributions: "",
    },
    otm: {
      url: "https://b.tile.opentopomap.org/{z}/{x}/{y}.png",
      attributions:
        "Kartendaten: © OpenStreetMap-Mitwirkende, SRTM | Kartendarstellung: © OpenTopoMap (CC-BY-SA)",
    },
    esri_wtm: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
      attributions:
        "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community",
    },
    esri_natgeo: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}",
      attributions:
        "Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC",
    },
    own: {
      url: "b_tiles/{z}/{x}/{y}.png",
    },
  };

  let layer = baseMap[name];
  if (layer === undefined) {
    layer = baseMap["osm"];
  }

  return new ol.layer.Tile({
    name: "base",
    source: new ol.source.TileImage(layer),
  });
}

/* •  •  • */

function showPanel(id) {
  document.getElementById(id).classList.remove("d-none");
}

// Optionnel : pour fermer le panneau en cliquant sur le bouton X
document.addEventListener("DOMContentLoaded", function () {
  const panels = [
    "pnl-contact",
    "pnl-about",
    "pnl-basemap",
    "pnl-service",
    "pnl-search",
    "pnl_route",
    "pnl-closest",
  ];

  panels.forEach((id) => {
    const closeBtn = document.querySelector(`#${id} .close`);
    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        document.getElementById(id).classList.add("d-none");
      });
    }
  });
});

function clearResults() {
  $("input[type=textbox]").val("");
  currentElement = "";
  layers = ["location_1", "location_2", "route", "markets", "area", "circle"];
  for (let i = 0; i < layers.length; i++) {
    removeLayerByName(mainMap, layers[i]);
  }
}

//To remove current layer map

function removeLayerByName(map, layer_name) {
  let layerToRemove = null;
  map.getLayers().forEach(function (layer) {
    if (layer.get("name") != undefined && layer.get("name") === layer_name) {
      layerToRemove = layer;
    }
  });

  map.removeLayer(layerToRemove);
}

// event listner for radio button JQuery
$("input[name=basemap]").click(function (evt) {
  removeLayerByName(mainMap, "base");
  let baseLayer = getBaseMap(evt.target.value);
  mainMap.addLayer(baseLayer);
});

$("#btnService").click(function () {
  removeLayerByName(mainMap, "area");

  $.ajax({
    url: "http://127.0.0.1:5000/get_area",
    data: {
      location: $("#Location-service").val(),
      size: $("input[name=size]:checked")[0].value,
      srid: 3857,
    },
    type: "GET",
    success: function (data) {
      if (data.length != 0) {
        let vectorLayer = new ol.layer.Vector({
          name: "area",
          source: new ol.source.Vector({
            features: new ol.format.GeoJSON().readFeatures(data[0].geom),
          }),
          style: new ol.style.Style({
            stroke: new ol.style.Stroke({
              color: "#ff0000",
              width: 2,
            }),
            fill: new ol.style.Fill({
              color: "rgba(255, 255, 255, 0.4)",
            }),
          }),
        });
        mainMap.addLayer(vectorLayer);
      }
    },
    error: function (data) {
      $("#pnl-service-alert").html(
        "Error: An error occurred while executing the tool."
      );
      $("#pnl-service-alert").show();
    },
  });
});

const sizes = {
  small_markets: 15,
  local_markets: 20,
  medium_markets: 25,
  capital_markets: 40,
};

$("#btnSearch").click(function () {
  removeLayerByName(mainMap, "markets");
  $("#pnl-service-alert").hide();

  $.ajax({
    url: "http://127.0.0.1:5000/search_markets",
    data: {
      location: $("#Location-search").val(),
      distance: $("#val").text(),
      srid: 3857,
    },
    type: "GET",
    success: function (data) {
      if (data.length != 0) {
        let features = [];
        for (let i = 0; i < data.length; i++) {
          const newFeatures = new ol.format.GeoJSON().readFeatures(
            data[i].geom
          );

          newFeatures.forEach((feature) => {
            feature.setStyle(
              new ol.style.Style({
                image: new ol.style.Icon({
                  src: "./images/market.png",
                  width: sizes[data[i].categorie],
                }),
              })
            );
          });
          features.push(...newFeatures);
        }
        const vectorSource = new ol.source.Vector({
          features: features,
        });

        const vectorLayer = new ol.layer.Vector({
          name: "markets",
          source: vectorSource,
        });

        mainMap.addLayer(vectorLayer);
      }
    },

    error: function (data) {
      $("#pnl-service-alert").html(
        "Error: An error occurred while executing the tool."
      );
      $("#pnl-service-alert").show();
    },
  });
});

$("#btnfind").click(function () {
  removeLayerByName(mainMap, "route");
  $("#pnl-route-alert").hide();

  $.ajax({
    url: "http://127.0.0.1:5000/short_route",
    data: {
      source: $("#start").val(),
      target: $("#end").val(),
      srid: 3857,
    },
    type: "GET",
    success: function (data) {
      if (data.path != null) {
        let vectorLayer = new ol.layer.Vector({
          name: "route",
          source: new ol.source.Vector({
            features: new ol.format.GeoJSON().readFeatures(data.path),
          }),
          style: new ol.style.Style({
            stroke: new ol.style.Stroke({
              color: "#ff0000",
              width: 4,
            }),
          }),
        });
        mainMap.addLayer(vectorLayer);
      }
    },
    error: function (data) {
      $("#pnl-route-alert").html(
        "Error: An error occurred while executing the tool."
      );
      $("#pnl-route-alert").show();
    },
  });
});

$("#btnClosest").click(function () {
  removeLayerByName(mainMap, "close");
  $("#pnl-route-alert").hide();

  $.ajax({
    url: "http://127.0.0.1:5000/closet_market",
    data: {
      location: $("#location-closest").val(),
      srid: 3857,
    },
    type: "GET",
    success: function (data) {
      if (data.length != 0) {
        let features = [];
        for (var i = 0; i < data.length; i++) {
          var feature = new ol.format.GeoJSON().readFeature(data[i].geometry);
          feature.setStyle(
            new ol.style.Style({
              image: new ol.style.Icon({
                src: "./images/market.png",
                width: sizes[data[i].categorie],
              }),
            })
          );
          features.push(feature);
        }

        const vectorSource = new ol.source.Vector({
          features: features,
        });

        const vectorLayer = new ol.layer.Vector({
          name: "markets",
          source: vectorSource,
        });

        mainMap.addLayer(vectorLayer);
      }
    },
    error: function (data) {
      $("#pnl-route-alert").html(
        "Error: An error occurred while executing the tool."
      );
      $("#pnl-route-alert").show();
    },
  });
});
