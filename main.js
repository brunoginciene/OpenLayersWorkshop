import 'ol/ol.css';
import {Map, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import XYZSource from 'ol/source/XYZ';
import VectorSource from 'ol/source/Vector';
import {fromLonLat} from 'ol/proj';
import {GeoJSON, KML} from 'ol/format';
import sync from 'ol-hashed';
import DragAndDrop from 'ol/interaction/DragAndDrop';

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
        source: source
    })
map.addLayer(layer)

map.addInteraction(new DragAndDrop({
    source: source,
    formatConstructors: [
        GeoJSON,
        KML
    ]
}))