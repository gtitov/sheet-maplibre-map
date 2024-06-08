const map = new maplibregl.Map({
  container: "map", // container id
  style:
    "https://raw.githubusercontent.com/gtitov/basemaps/master/dark-matter-nolabels.json", // style URL
  center: [0, 0], // starting position [lng, lat]
  zoom: 1, // starting zoom
});

map.on("load", function () {
  fetch(
    "https://docs.google.com/spreadsheets/d/1f0waZduz5CXdNig_WWcJDWWntF-p5gN2-P-CNTLxEa0/gviz/tq?tqx=out:csv&sheet=Sheet1"
  )
    .then((response) => response.text())
    .then((text) => makeMap(text));
});

const makeMap = (csvData) => {
  csv2geojson.csv2geojson(
    csvData,
    {
      latfield: "lat",
      lonfield: "lon",
      delimiter: ",",
    },
    function (error, data) {
      console.log(data);
      data.features.map((f) => {
        document.getElementById(
          "list-all"
        ).innerHTML += `<h4>${f.properties["Вакансия"]}</h4><a href='#' onclick="map.flyTo({center: [${f.geometry.coordinates}], zoom: 10})">Найти на карте</a><hr>`;
      });

      map.addSource("vacancies", {
        type: "geojson",
        data: data,
        cluster: true,
        clusterRadius: 20,
      });

      map.addLayer({
        id: "clusters",
        source: "vacancies",
        type: "circle",
        paint: {
          "circle-color": "#7EC8E3",
          "circle-stroke-width": 1,
          "circle-stroke-color": "#FFFFFF",
          "circle-radius": ["step", ["get", "point_count"], 12, 3, 20, 6, 30],
        },
      });

      map.addLayer({
        id: "clusters-labels",
        type: "symbol",
        source: "vacancies",
        layout: {
          "text-field": "{point_count}",
          "text-font": ["Noto Sans Regular"],
          "text-size": 10,
        },
      });

      map.on("click", function (event) {
        const features = map.queryRenderedFeatures(event.point, {
          layers: ["clusters"],
        });
        if (features[0].properties.cluster_id) {
          const clusterId = features[0].properties.cluster_id;
          const pointCount = features[0].properties.point_count;
          const clusterSource = map.getSource("vacancies");

          clusterSource
            .getClusterLeaves(clusterId, pointCount, 0)
            .then((clusterFeatures) => {
              document.getElementById("list-selected").innerHTML =
                "<h2>Выбранные вакансии</h2>";
              clusterFeatures.map((feature) => {
                document.getElementById(
                  "list-selected"
                ).innerHTML += `<h4>${feature.properties["Вакансия"]}</h4><a target="blank_" href='${feature.properties["Ссылка на сайте Картетики"]}'>Подробнее</a><hr>`;
              });
            });
        } else {
          const unclusteredFeature = features[0];
          document.getElementById(
            "list-selected"
          ).innerHTML = `<h2>Выбранные вакансии</h2><h4>${unclusteredFeature.properties["Вакансия"]}</h4><a target="blank_" href='${unclusteredFeature.properties["Ссылка на сайте Картетики"]}'>Подробнее</a><hr>`;
        }

        //   console.log(features);
      });

      map.on("mouseenter", "clusters", function () {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "clusters", function () {
        map.getCanvas().style.cursor = "";
      });
    }
  );
};
