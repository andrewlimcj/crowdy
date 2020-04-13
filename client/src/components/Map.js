import React, { useState, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import _ from 'lodash';

import '../styles/map.css';

export const Map = ({
  data,
  userGps,
  setZoom,
  setMapCoords,
  loading,
  setLoading
}) => {
  const [map, setMap] = useState(null);
  const [mapContainer, setMapContainer] = useState(null);
  const [markers, setMarkers] = useState([]);
  const initialZoom = 12.9

  useEffect(() => {
    if (!mapContainer || !userGps.latitude || !userGps.longitude || map) return;
    mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
    setMap(new mapboxgl.Map({
      container: mapContainer,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [userGps.longitude, userGps.latitude],
      zoom: initialZoom
    }));
  }, [mapContainer, userGps]);

  useEffect(() => {
    if (!map) {
      return;
    }
    map.on('load', () => {
      if (loading) {
        setLoading(false);
      }
    });
    map.on('moveend', () => {
      setMapCoords({ lat: map.getCenter().lat.toFixed(6), lng: map.getCenter().lng.toFixed(6) });
      setZoom(map.getZoom().toFixed(2));
    });
  }, [map]);

  useEffect(() => {
    if (!map || !mapContainer) return;
    markers.forEach(marker => {
      marker.remove();
    });
    const newMarkers = [];
    data.locations.forEach(loc => {
      // console.log("adding..", loc)
      if (loc.longitude && loc.latitude && loc.longitude !== 'null' && loc.latitude !== 'null') {
        const lnglat = { lng: Number(loc.longitude), lat: Number(loc.latitude) };

        let popupEl = document.createElement('div');
        popupEl.innerHTML = loc.name;
        const popup = new mapboxgl.Popup({ offset: 25 })
        .setLngLat(lnglat)
        .setDOMContent(popupEl);

        let markerEl = document.createElement('div');
        markerEl.className = 'pin' // TODO(lia): different className for each category
        newMarkers.push(new mapboxgl.Marker(markerEl)
        .setLngLat(lnglat)
        .setPopup(popup)
        .addTo(map));
      }
    });
    setMarkers(newMarkers);
  }, [mapContainer, map, data]);

  const wrapperStyle = {
    height: '500px'
  };

  return (
    <div className="Fade">
      <div className="contentWrapper">
        <div style={wrapperStyle} ref={el => setMapContainer(el)} className='mapContainer'/>
      </div>
    </div>
  )
}

export default Map;