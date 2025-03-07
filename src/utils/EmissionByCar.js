import { round } from 'lodash';

export function calculateFuelConsumption({ vehicleModel, fuelType = 'Petrol', vehicleType = 'Sedan', distanceDriven, averageSpeed = 50 }) {
  const baselineMileage = 18;

  let alphaBody;
  switch (vehicleType.toLowerCase()) {
    case 'hatchback':
      alphaBody = 1.0;
      break;
    case 'sedan':
      alphaBody = 0.95;
      break;
    case 'suv':
      alphaBody = 0.8;
      break;
    default:
      alphaBody = 1.0;
      break;
  }

  let alphaFuel;
  if (fuelType.toLowerCase() === 'diesel') {
    // console.log('inside 123 diesel');
    alphaFuel = 1.15;
  } else if (fuelType.toLowerCase() === 'petrol') {
    // console.log('inside 123 petrol');
    alphaFuel = 1.0;
  } else if (fuelType.toLowerCase() === 'ev') {
    // console.log('inside 123 ev');
    return {
      effectiveMileage: Infinity,
      fuelConsumption: 0,
      message: 'Electric Vehicle: No fuel consumption in litres',
    };
  } else {
    alphaFuel = 1.0;
  }

  const referenceYear = 2020;
  const modelYear = parseInt(vehicleModel, 10);
  let age = isNaN(modelYear) ? 0 : referenceYear - modelYear;
  if (age < 0) age = 0;
  const k = 0.01;
  const alphaYear = 1 - age * k;

  const vOpt = 50;
  const beta = 0.005;
  const alphaSpeed = 1 - beta * Math.abs(averageSpeed - vOpt);
  // console.log('The values are ', alphaBody, alphaFuel, alphaYear, alphaSpeed);

  const effectiveMileage = baselineMileage * alphaBody * alphaFuel * alphaYear * alphaSpeed;
  // console.log('Effective mileage', effectiveMileage);

  const fuelConsumption = distanceDriven / effectiveMileage;
  // console.log('Fuel consumption 123', fuelConsumption);

  return { fuelConsumption };
}
