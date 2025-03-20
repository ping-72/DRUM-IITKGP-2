import { displayRoute } from '../utils/mapUtils.js';
import { getMapboxRoutes, getGraphhopperRoutes } from '../../../services/fetchRoutesData.js';
import getShortestRoute from '../../../controllers/getShortestRoute.js';
import getFastestRoute from '../../../controllers/getFastestRoute.js';
import getLeapRoute from '../../../controllers/getLeapRoute.js';
import getBalancedRoute from '../../../controllers/getBalancedRoute.js';
import getLeastCarbonRoute from '../../../controllers/getLeastCarbonRoute.js';

export async function getAllRoutesLayered({
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
  // Validate that both source and destination are provided.
  if (source.value === '' || destination.value === '') {
    console.log('Please select a source and destination.');
    return;
  }
  console.log('Running getAllRoutes with mode:', mode);

  // Remove all previous route layers.
  const allLayers = window.$map.getStyle().layers;
  allLayers.forEach((layer) => {
    if (layer.id.includes('-route')) {
      window.$map.removeLayer(layer.id);
      window.$map.removeSource(layer.id);
    }
  });

  // Helper to generate a unique layer ID for each route type.
  const generateRouteId = (type) =>
    `${mode}-${type}-${source.position[0]}-${source.position[1]}-${destination.position[0]}-${destination.position[1]}-route`;

  let geojson, routes, temp_mode;
  let fastestRouteTime, fastestRouteDistance;

  try {
    // -------- FASTEST ROUTE --------
    temp_mode = mode;
    // For cars/trucks, if mode is "car" or "truck", use "driving-traffic"
    if (temp_mode === 'car' || temp_mode === 'truck') temp_mode = 'driving-traffic';

    // Get routes from the appropriate API.
    if (temp_mode.includes('traffic')) {
      routes = await getMapboxRoutes(source, destination);
    } else {
      routes = await getGraphhopperRoutes(temp_mode, source, destination);
    }
    ({ geojson, routes } = await getFastestRoute(routes, temp_mode, carData));
    fastestRouteTime = routes[0].time;
    fastestRouteDistance = routes[0].distance;
    // Update UI state with fastest route values.
    setDistance && setDistance(routes[0].distance);
    if (temp_mode.includes('traffic')) {
      setTime && setTime(routes[0].duration);
      setInstructions && setInstructions(routes[0].legs[0].steps);
    } else {
      setTime && setTime(routes[0].time);
      setInstructions && setInstructions(routes[0].instructions);
    }
    setExposure && setExposure(routes[0].totalExposure);
    displayRoute(geojson, source, destination, generateRouteId('fastest'), 'fastest');
    setFastestRoute && setFastestRoute(routes[0]);

    // -------- SHORTEST ROUTE --------
    temp_mode = mode; // Reset mode for shortest.
    if (temp_mode === 'driving-traffic') {
      routes = await getMapboxRoutes(source, destination);
    } else {
      routes = await getGraphhopperRoutes(temp_mode, source, destination);
    }
    ({ geojson, routes } = await getShortestRoute(routes, temp_mode, carData));
    displayRoute(geojson, source, destination, generateRouteId('shortest'), 'shortest');
    setShortestRoute(routes[0]);

    /* -------- LEAP ROUTE (Least Exposure) --------
    temp_mode = mode;
    // For LEAP, ignore traffic: convert "driving-traffic" to "car"
    if (temp_mode === 'driving-traffic') temp_mode = 'car';
    routes = await getGraphhopperRoutes(temp_mode, source, destination);
    ({ geojson, routes } = await getLeapRoute(routes, temp_mode, carData));
    // Adjust the LEAP route time relative to the fastest route.
    if (temp_mode === 'car') {
      routes[0].time = (routes[0].distance / fastestRouteDistance) * fastestRouteTime;
    }
    if (routes[0].time < fastestRouteTime) {
      routes[0].time = 1.01 * fastestRouteTime;
    }
    displayRoute(geojson, source, destination, generateRouteId('leap'), 'leap');
    setLeapRoute(routes[0]);

    // -------- LEAST CARBON EMISSION ROUTE --------
    temp_mode = mode;
    if (temp_mode === 'driving-traffic') temp_mode = 'car';
    routes = await getGraphhopperRoutes(temp_mode, source, destination);
    ({ geojson, routes } = await getLeastCarbonRoute(source, destination, temp_mode, carData));
    if (temp_mode === 'car') {
      routes[0].time = (routes[0].distance / fastestRouteDistance) * fastestRouteTime;
    }
    if (routes[0].time < fastestRouteTime) {
      routes[0].time = 1.01 * fastestRouteTime;
    }
    displayRoute(geojson, source, destination, generateRouteId('emission'), 'emission');
    setLeastCarbonRoute(routes[0]);

    // -------- BALANCED ROUTE (Optional) --------
    // If needed, you can similarly call getBalancedRoute and display its result. */
  } catch (error) {
    console.error(error);
  } finally {
    setIsLoading(false);
  }
}
