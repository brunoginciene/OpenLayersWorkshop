import 'ol/ol.css';
import {Map, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import XYZSource from 'ol/source/XYZ';
import VectorSource from 'ol/source/Vector';
import {fromLonLat} from 'ol/proj';
import {GeoJSON, KML} from 'ol/format';
import sync from 'ol-hashed';
import {DragAndDrop, Modify, Draw, Snap} from 'ol/interaction';
import {Style, Fill, Stroke} from 'ol/style';
import {getArea} from 'ol/sphere';
import colormap from 'colormap';

const map = new Map({
  target: 'map-container',
  layers: [
    new TileLayer({
      source: new XYZSource({
        url: 'http://tile.stamen.com/terrain/{z}/{x}/{y}.jpg'
      })
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



