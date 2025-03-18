// This file is a controller function that takes in routes and mode as parameters, and returns a geojson object and an array of routes. It fetches the shortest route from either Mapbox or Graphhopper API depending on the mode, calculates the energy consumption and exposure of the route, and returns the result. The flow is as follows:
import calculateRouteEnergy from '../utils/calculateRouteEnergy';
import calculateRouteExposureGraphhopper from '../utils/calculateRouteExposureGraphhopper';
import calculateRouteExposureMapbox from '../utils/calculateRouteExposureMapbox';
import calculateCCT from '../utils/calculateCCT';

export default async function getShortestRoute(routes, mode) {
  const geojson = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: '',
    },
  };
  console.log({ routes });

  const carData = JSON.parse(localStorage.getItem('carData'));
  routes.sort((a, b) => a.distance - b.distance);

  if (mode === 'driving-traffic') {
    mode = 'car';
    const source = routes[0].waypoints[0];
    const destination = routes[0].waypoints[1];
    console.log('calling console log inside shortest path for energy calculation');
    const query = await fetch(
      `https://graphhopper.com/api/1/route?point=${source.location[1]},${source.location[0]}&point=${destination.location[1]},${destination.location[0]}&vehicle=${mode}&debug=true&key=${process.env.REACT_APP_GRAPHHOPPER_API_KEY}&type=json&points_encoded=false&algorithm=alternative_route&alternative_route.max_paths=5&alternative_route.max_weight_factor=1.4&alternative_route.max_share_factor=0.6&details=max_speed&elevation=true`,
      { method: 'GET' }
    );
    const json = await query.json();
    const temp_routes = json.paths; // graphhopper routes between the same points

    temp_routes.sort((a, b) => a.distance - b.distance);
    routes[0].totalEnergy = calculateRouteEnergy(temp_routes[0], mode, carData);
    routes[0] = await calculateRouteExposureMapbox(routes[0]);
    geojson.geometry.coordinates = routes[0].geometry.coordinates;
  } else {
    routes[0].totalEnergy = calculateRouteEnergy(routes[0], mode, carData);
    routes[0] = await calculateRouteExposureGraphhopper(routes[0]);
    geojson.geometry.coordinates = routes[0].points.coordinates;
  }
  alert("Shortest round has base Carbon credits of Rs " + calculateCCT(routes[0].distance))

  return { geojson, routes };
}
