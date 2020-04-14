import React, { useState, useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { point, center, featureCollection, distance } from '@turf/turf';
import getInfoFromNowStatus from '../getInfoFromNowStatus';

import '../styles/map.css';

const getDirectionsUrl = (addr) => {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}`;
}

export const Map = ({
  data,
  userGps,
  setZoom,
  setMapCoords,
  loading,
  setLoading
}) => {
  const initialZoom = 12.9;
  const moveThreshold = 0.01;
  const [markers, setMarkers] = useState([]);
  const mapRef = useRef(null);
  const initialCoordsRef = useRef(null);

  const mapContainerRef = useCallback(ref => {
    if (!ref || !userGps.latitude || !userGps.longitude || mapRef.current) return;
    mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
    mapRef.current = new mapboxgl.Map({
      container: ref,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [userGps.longitude, userGps.latitude],
      zoom: initialZoom
    });
    const map = mapRef.current;
    initialCoordsRef.current = map.getCenter();
    setMapCoords({ lat: initialCoordsRef.current.lat.toFixed(), lng: initialCoordsRef.current.lng.toFixed(6) });
    map.on('load', () => {
      if (loading) {
        setLoading(false);
      }
    });
    map.on('mousedown', () => {
      console.log("MOUSEDOWN!", initialCoordsRef.current)
      if (!initialCoordsRef.current) {
        initialCoordsRef.current = map.getCenter();
      }
    });
    map.on('moveend', () => {
      const finalCoords = map.getCenter();
      console.log("initialCoords:", initialCoordsRef.current, "finalCoords:", finalCoords);
      if (initialCoordsRef.current && (Math.abs(finalCoords.lat - initialCoordsRef.current.lat) > moveThreshold ||
          Math.abs(finalCoords.lng - initialCoordsRef.current.lng) > moveThreshold)) {
        setMapCoords({ lat: map.getCenter().lat.toFixed(6), lng: map.getCenter().lng.toFixed(6) });
        setZoom(map.getZoom().toFixed(2));
      }
      initialCoordsRef.current = null;
    });
  }, [userGps]);

  useEffect(() => {
    if (!mapRef.current || !mapContainerRef) return;
    markers.forEach(marker => {
      marker.remove();
    });
    const fromPoint = userGps.longitude && userGps.latitude ? point([ userGps.longitude, userGps.latitude ]) : null;
    const newMarkers = [];
    const turfPoints = [];
    for (let loc of data.locations) {
      // console.log("adding..", loc)
      if (!isNaN(Number(loc.longitude)) && !isNaN(Number(loc.latitude))) {
        const lnglat = { lng: Number(loc.longitude), lat: Number(loc.latitude) };
        const toPoint = point([ lnglat.lng, lnglat.lat ]);
        turfPoints.push(toPoint);
        loc.distance = fromPoint ? Number(distance(fromPoint, toPoint)).toFixed(4) : '?';
        loc.directions = getDirectionsUrl(loc.address);
        const { status, live, img } = getInfoFromNowStatus(loc.nowStatus);

        let popupEl = document.createElement('div');
        popupEl.className = 'popup-inner';
        popupEl.innerHTML = `
          <div class="top">
            <div class="crowded-${status}">${loc.nowStatus}</div>
            ${live ?'<div class="live"><span class="dot"></span>Live</div>' : ''}
          </div>
          <div class="middle">
            <div>${loc.name}</div>
            <div>${loc.distance} km</div>
            <div>${loc.address}</div>
          </div>
          <div class="bottom">
            <a href=${encodeURI(loc.link)}>VIEW</a>
            <a href=${encodeURI(loc.directions)}>DIRECTIONS</a>
          </div>`;
        const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
        .setLngLat(lnglat)
        .setDOMContent(popupEl);

        let markerEl = document.createElement('div');
        markerEl.className = `marker${live ? ' live' : ''}`
        markerEl.innerHTML = `<img src="${process.env.PUBLIC_URL}${img}" />`
        newMarkers.push(new mapboxgl.Marker(markerEl)
        .setLngLat(lnglat)
        .setPopup(popup)
        .addTo(mapRef.current));
      }
    }
    if (turfPoints.length > 0) {
      const newCenter = center(featureCollection(turfPoints));
      mapRef.current.flyTo({
        center: newCenter.geometry.coordinates,
        speed: 0.5,
        curve: 0,
        essential: true
      })
      const bounds = new mapboxgl.LngLatBounds();
      turfPoints.forEach(function(pt) {
        bounds.extend(pt.geometry.coordinates);
      });
      mapRef.current.fitBounds(bounds, { padding: 100 });
    }
    
    setMarkers(newMarkers);
  }, [data]);

  const wrapperStyle = {
    height: '500px'
  };

  return (
    <div className="Fade">
      <div className="contentWrapper">
        <div style={wrapperStyle} ref={mapContainerRef} className='mapContainer'/>
      </div>
    </div>
  )
}

export default Map;