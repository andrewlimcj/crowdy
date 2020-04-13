import React, {Component} from 'react';
import mapboxgl from 'mapbox-gl';

import '../styles/map.css';

export default class Map extends Component {
  map;

  constructor(props) {
      super(props);
      this.state = {
          latitude: 37.5014043,
          longitude: 127.00244119999999,
          zoom: 12.9,
      };
  }

  componentDidMount() {
     mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
    this.map = new mapboxgl.Map({
      container: this.mapContainer,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [this.state.longitude, this.state.latitude],
      zoom: this.state.zoom
    });
    this.props.data.locations.forEach(loc => {
      if (loc.longitude && loc.latitude) {
        let el = document.createElement('div');
        el.className = 'pin' // TODO(lia): different className for each category
        new mapboxgl.Marker(el)
        .setLngLat({lng: loc.longitude, lat: loc.latitude})
        .addTo(this.map);
      }
    })
  }

  render() {
    const style = {
      height: '500px'
    };
    return (
      <div className="Fade">
        <div className="contentWrapper">
          <div style={style} ref={el => this.mapContainer = el} className='mapContainer'/>
        </div>
      </div>
    )
  }
}