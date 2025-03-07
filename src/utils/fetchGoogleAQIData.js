export async function fetchGoogleAQIData(latitude, longitude, apiKey, forecastHourOffset) {
  const url = 'https://airquality.googleapis.com/v1/forecast:lookup';

  // Calculate start and end times for this forecast offset.
  const now = new Date();
  const startTime = new Date(now.getTime() + forecastHourOffset * 3600 * 1000).toISOString();
  // We assume we want a 1‐hour window forecast.
  const endTime = new Date(now.getTime() + (forecastHourOffset + 1) * 3600 * 1000).toISOString();

  const payload = {
    universal_aqi: true,
    location: {
      latitude: latitude, // Note: the Google API expects latitude/longitude as numbers.
      longitude: longitude,
    },
    period: {
      start_time: startTime,
      end_time: endTime,
    },
    language_code: 'en',
    extra_computations: ['DOMINANT_POLLUTANT_CONCENTRATION'],
    uaqi_color_palette: 'RED_GREEN',
  };

  try {
    const response = await fetch(`${url}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': '*',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching Google AQI data:', error);
    return null;
  }
}
