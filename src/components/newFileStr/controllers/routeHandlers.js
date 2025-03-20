import { displayRoute } from '../utils/mapUtils.js';
import { getMapboxRoutes, getGraphhopperRoutes } from '../../../services/fetchRoutesData.js';
import getShortestRoute from '../../../controllers/getShortestRoute.js';
import getFastestRoute from '../../../controllers/getFastestRoute.js';
import getLeapRoute from '../../../controllers/getLeapRoute.js';
import getBalancedRoute from '../../../controllers/getBalancedRoute.js';
import getLeastCarbonRoute from '../../../controllers/getLeastCarbonRoute.js';
import { getAllRoutesLayered } from './allRoutesHandler.js';

export async function getAllRoutes({
  source,
  destination,
  mode,
  routePreference,
  setDistance,
  setTime,
  setInstructions,
  setExposure,
  setFastestRoute,
  setShortestRoute,
  setLeapRoute,
  setBalancedRoute,
  setLeastCarbonRoute,
  setIsLoading,
  carData,
}) {
  getAllRoutesLayered({
    source,
    destination,
    mode,
    routePreference,
    setDistance,
    setTime,
    setInstructions,
    setExposure,
    setFastestRoute,
    setShortestRoute,
    setLeapRoute,
    setBalancedRoute,
    setLeastCarbonRoute,
    setIsLoading,
    carData,
  });
  return;
}

export async function getRoutes({
  source,
  destination,
  mode,
  routePreference,
  setDistance,
  setTime,
  setInstructions,
  setExposure,
  setEnergyRequired,
  setFastestRoute,
  setShortestRoute,
  setLeapRoute,
  setBalancedRoute,
  setLeastCarbonRoute,
  setIsLoading,
  carData,
}) {
  // Check both source and destination is there ->
  if (source.value === '' || destination.value === '') {
    console.log('Please select a source and destination.');
    return;
  } else {
    console.log('Running getRoutes with mode:', mode, 'and routePreference:', routePreference);
    try {
      let temp_mode = mode;
      let temp_routePreference = routePreference;

      // Adjust the mode if needed based on the selected route preference.
      function adjustModeRoutePreference(pref) {
        switch (pref) {
          case 'leap':
            if (temp_mode === 'driving-traffic') {
              temp_mode = 'car'; // ignore traffic for LEAP path.
            }
            break;
          case 'fastest':
            if (temp_mode === 'car') {
              temp_mode = 'driving-traffic';
            }
            break;
          case 'emission':
            if (temp_mode === 'driving-traffic') {
              temp_mode = 'car';
            }
            break;
        }
      }

      // Adjust the mode if needed based on the selected route preference.
      adjustModeRoutePreference(temp_routePreference);

      let routes;
      if (temp_mode === 'driving-traffic') {
        routes = await getMapboxRoutes(source, destination);
        console.log('Getting routes from Mapbox API, routes: ', routes);
      } else {
        routes = await getGraphhopperRoutes(temp_mode, source, destination);
        console.log('Getting routes from Graphhopper API, routes: ', routes);
      }

      let geojson;
      let routeId = `${temp_mode}-${temp_routePreference}-${source.position[0]}-${source.position[1]}-${destination.position[0]}-${destination.position[1]}-route`;
      let temp_routes = [...routes];
      let shortestRouteTime;
      let shortestRouteDistance;

      if (temp_routePreference === 'fastest') {
        console.log('Fastest Path...');
        const res = await getFastestRoute(routes, temp_mode, carData);
        geojson = res.geojson;
        routes = res.routes;
        setDistance(routes[0].distance);
        if (temp_mode.includes('traffic')) {
          setTime(routes[0].duration);
          setInstructions(routes[0].legs[0].steps);
        } else {
          setTime(routes[0].time);
          setInstructions(routes[0].instructions);
        }
        setExposure(routes[0].totalExposure);
        routes[0].energyRequired && setEnergyRequired(routes[0].energyRequired);
        window.$map.getStyle().layers.forEach((layer) => {
          if (layer.id.includes('-route')) {
            window.$map.removeLayer(layer.id);
            window.$map.removeSource(layer.id);
          }
        });
        routeId = `${temp_mode}-${temp_routePreference}-${source.position[0]}-${source.position[1]}-${destination.position[0]}-${destination.position[1]}-route`;
        if (window.$map.getSource(routeId)) {
          window.$map.getSource(routeId).setData(geojson);
          setFastestRoute(routes[0]);
          setIsLoading(false);
        } else {
          setFastestRoute(routes[0]);
          displayRoute(geojson, source, destination, routeId, 'fastest');
          setIsLoading(false);
        }
      } else if (temp_routePreference === 'shortest') {
        console.log('Shortest Path...');
        ({ geojson, routes } = await getShortestRoute(routes, temp_mode, carData));
        setDistance(routes[0].distance);
        if (temp_mode.includes('traffic')) {
          setTime(routes[0].time);
          setInstructions(routes[0].legs[0].steps);
        } else {
          setTime(routes[0].time);
          setInstructions(routes[0].instructions);
        }
        // Remove any previous route layers.
        window.$map.getStyle().layers.forEach((layer) => {
          if (layer.id.includes('-route')) {
            window.$map.removeLayer(layer.id);
            window.$map.removeSource(layer.id);
          }
        });
        setExposure(routes[0].totalExposure);
        routeId = `${temp_mode}-${temp_routePreference}-${source.position[0]}-${source.position[1]}-${destination.position[0]}-${destination.position[1]}-route`;
        if (window.$map.getSource(routeId)) {
          window.$map.getSource(routeId).setData(geojson);
          setShortestRoute(routes[0]);
          setIsLoading(false);
        } else {
          setShortestRoute(routes[0]);
          displayRoute(geojson, source, destination, routeId, 'shortest');
          setIsLoading(false);
        }
      } else if (temp_routePreference === 'leap') {
        console.log('LEAP Path...');
        ({ geojson, routes } = await getLeapRoute(routes, temp_mode, carData));
        setDistance(routes[0].distance);
        temp_routes.sort((a, b) => a.distance - b.distance);
        shortestRouteTime = temp_routes[0].time;
        shortestRouteDistance = temp_routes[0].distance;
        routes[0].time = (routes[0].distance / shortestRouteDistance) * shortestRouteTime;
        setTime(routes[0].time);
        setInstructions(routes[0].instructions);
        window.$map.getStyle().layers.forEach((layer) => {
          if (layer.id.includes('-route')) {
            window.$map.removeLayer(layer.id);
            window.$map.removeSource(layer.id);
          }
        });
        setExposure(routes[0].totalExposure);
        routeId = `${temp_mode}-${temp_routePreference}-${source.position[0]}-${source.position[1]}-${destination.position[0]}-${destination.position[1]}-route`;
        if (window.$map.getSource(routeId)) {
          window.$map.getSource(routeId).setData(geojson);
          setLeapRoute(routes[0]);
          setIsLoading(false);
        } else {
          displayRoute(geojson, source, destination, routeId, 'leap');
          setLeapRoute(routes[0]);
          setIsLoading(false);
        }
      } else if (temp_routePreference === 'emission') {
        console.log('Emission Path...');
        ({ geojson, routes } = await getLeastCarbonRoute(source, destination, temp_mode, carData));
        setDistance(routes[0].distance);
        temp_routes.sort((a, b) => a.distance - b.distance);
        shortestRouteTime = temp_routes[0].time;
        shortestRouteDistance = temp_routes[0].distance;
        routes[0].time = (routes[0].distance / shortestRouteDistance) * shortestRouteTime;
        setTime(routes[0].time);
        setInstructions(routes[0].instructions);
        setExposure(routes[0].totalExposure);
        window.$map.getStyle().layers.forEach((layer) => {
          if (layer.id.includes('-route')) {
            window.$map.removeLayer(layer.id);
            window.$map.removeSource(layer.id);
          }
        });
        routeId = `${temp_mode}-${temp_routePreference}-${source.position[0]}-${source.position[1]}-${destination.position[0]}-${destination.position[1]}-route`;
        if (window.$map.getSource(routeId)) {
          window.$map.getSource(routeId).setData(geojson);
          setLeastCarbonRoute(routes[0]);
          setIsLoading(false);
        } else {
          displayRoute(geojson, source, destination, routeId, 'emission');
          setLeastCarbonRoute(routes[0]);
          setIsLoading(false);
        }
      } else if (temp_routePreference === 'balanced') {
        console.log('Balanced Path...');
        ({ geojson, routes } = await getBalancedRoute(routes, mode));
        setDistance(routes[0].distance);
        if (temp_mode.includes('traffic')) {
          setTime(routes[0].duration);
          setInstructions(routes[0].legs[0].steps);
        } else {
          setTime(routes[0].time);
          setInstructions(routes[0].instructions);
        }
        setExposure(routes[0].totalExposure);
        window.$map.getStyle().layers.forEach((layer) => {
          if (layer.id.includes('-route')) {
            window.$map.removeLayer(layer.id);
            window.$map.removeSource(layer.id);
          }
        });
        routeId = `${temp_mode}-${temp_routePreference}-${source.position[0]}-${source.position[1]}-${destination.position[0]}-${destination.position[1]}-route`;
        if (window.$map.getSource(routeId)) {
          window.$map.getSource(routeId).setData(geojson);
          setBalancedRoute(routes[0]);
          setIsLoading(false);
        } else {
          setBalancedRoute(routes[0]);
          displayRoute(geojson, source, destination, routeId, 'balanced');
          setIsLoading(false);
        }
      }
    } catch (e) {
      setIsLoading(false);
      console.log(e);
    }
  }
}
