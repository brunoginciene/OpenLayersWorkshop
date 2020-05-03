import 'ol/ol.css';
import {Map, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import OSMSource from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import {fromLonLat} from 'ol/proj';
import {GeoJSON, KML} from 'ol/format';
import sync from 'ol-hashed';
import {DragAndDrop, Modify, Draw, Snap} from 'ol/interaction';
import {Style, Fill, Stroke, Icon} from 'ol/style';
import {getArea} from 'ol/sphere';
import colormap from 'colormap';
import Feature from 'ol/Feature';
import {circular} from 'ol/geom/Polygon';
import Point from 'ol/geom/Point';
import Control from 'ol/control/Control';
import Kompas from 'kompas';

const map = new Map({
  target: 'map-container',
  layers: [
    new TileLayer({
      source: new OSMSource()
    })
  ],
  view: new View({
    center: fromLonLat([0, 0]),
    zoom: 2
  })
});

sync(map);


const source = new VectorSource()

const layer = new VectorLayer({
        source: source,
        style: function(feature) {
            return new Style({
                fill: new Fill({
                    color: getColor(feature)
                }),
                stroke: new Stroke({
                    color: 'rgba(255,255,255,0.8)'
                })
            });
        }
})

map.addLayer(layer)

map.addInteraction(new DragAndDrop({
    source: source,
    formatConstructors: [
        GeoJSON,
        KML
    ]
}))

map.addInteraction(new Modify({
  source: source
}))

map.addInteraction(new Draw({
    type: 'Polygon',
    source: source
}))

map.addInteraction(new Snap({
  source: source
}));

const clear = document.getElementById('clear')
clear.addEventListener('click', function(){
    source.clear()
})

const format = new GeoJSON({featureProjection: 'EPSG:3857'});
const download = document.getElementById('download');
source.on('change', function() {
  const features = source.getFeatures();
  const json = format.writeFeatures(features);
  download.href = 'data:text/json;charset=utf-8,' + json;
});

const min = 1e8; // the smallest area
const max = 2e13; // the biggest area
const steps = 50;
const ramp = colormap({
  colormap: 'blackbody',
  nshades: steps
});

function clamp(value, low, high) {
  return Math.max(low, Math.min(value, high));
}

function getColor(feature) {
  const area = getArea(feature.getGeometry());
  const f = Math.pow(clamp((area - min) / (max - min), 0, 1), 1 / 2);
  const index = Math.round(f * (steps - 1));
  return ramp[index];
}

const sourcePontoGeo = new VectorSource()

const layerPontoGeo = new VectorLayer({
    source: sourcePontoGeo
})

map.addLayer(layerPontoGeo)

navigator.geolocation.watchPosition(function(pos){
    const coords = [pos.coords.longitude, pos.coords.latitude]
    const accuracy = circular(coords, pos.coords.accuracy)
    sourcePontoGeo.clear(true)
    sourcePontoGeo.addFeatures([
        new Feature(accuracy.transform('EPSG:4326', map.getView().getProjection())),
        new Feature(new Point(fromLonLat(coords)))
    ])
}, function(error){
    alert(`ERROR: ${error.message}`)
}, {
    enableHighAccuracy: true
})

const locate = document.createElement('div')
locate.className = 'ol-control ol-unselectable locate'
locate.innerHTML = '<button title="Locate me">◎</button>'
locate.addEventListener('click', function(){
    if (!sourcePontoGeo.isEmpty()){
        map.getView().fit(sourcePontoGeo.getExtent(),{
            maxZoom: 18,
            duration: 500
        })
    }
})
map.addControl(new Control({
    element: locate
}))

const style = new Style({
    fill: new Fill({
        color: 'rgba(0, 0, 255, 0.2)'
    }),
    image: new Icon({
        src: 'data/location-heading.svg',
        imgSize: [27, 55],
        rotateWithView: true
    })
})
layerPontoGeo.setStyle(style)

const compass = new Kompas()
compass.watch()
compass.on('heading', function(heading){
    style.getImage().setRotation(Math.PI / 180 * heading)
})






