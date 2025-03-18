export default function calculateCCT(distance_in_km){
  const ef = 1200;
  const CO2_in_ton = (distance_in_km * ef) / 1000000;
  return Math.round(CO2_in_ton * 5);
}
