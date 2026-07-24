/**
 * Open-Meteo Integration - Free Weather & Climate Data
 * 
 * Fetches weather data and agricultural indicators for African regions
 * No API key required - completely free
 */

import type { Env } from '../types';

// African capital/major city coordinates
const AFRICAN_LOCATIONS: Record<string, { lat: number; lon: number; city: string }> = {
    'Nigeria': { lat: 9.0579, lon: 7.4951, city: 'Abuja' },
    'South Africa': { lat: -25.7479, lon: 28.2293, city: 'Pretoria' },
    'Kenya': { lat: -1.2921, lon: 36.8219, city: 'Nairobi' },
    'Egypt': { lat: 30.0444, lon: 31.2357, city: 'Cairo' },
    'Morocco': { lat: 33.9716, lon: -6.8498, city: 'Rabat' },
    'Ghana': { lat: 5.6037, lon: -0.1870, city: 'Accra' },
    'Ethiopia': { lat: 9.0320, lon: 38.7469, city: 'Addis Ababa' },
    'Tanzania': { lat: -6.1630, lon: 35.7516, city: 'Dodoma' },
    'Uganda': { lat: 0.3136, lon: 32.5811, city: 'Kampala' },
    'Senegal': { lat: 14.6928, lon: -17.4467, city: 'Dakar' },
    'Côte d\'Ivoire': { lat: 6.8276, lon: -5.2893, city: 'Yamoussoukro' },
    'Rwanda': { lat: -1.9403, lon: 29.8739, city: 'Kigali' },
    'Botswana': { lat: -24.6282, lon: 25.9231, city: 'Gaborone' },
    'Mauritius': { lat: -20.1609, lon: 57.5012, city: 'Port Louis' },
    'Namibia': { lat: -22.5609, lon: 17.0658, city: 'Windhoek' },
    'Tunisia': { lat: 36.8065, lon: 10.1815, city: 'Tunis' },
    'Algeria': { lat: 36.7538, lon: 3.0588, city: 'Algiers' },
    'Angola': { lat: -8.8390, lon: 13.2894, city: 'Luanda' },
    'Zambia': { lat: -15.3875, lon: 28.3228, city: 'Lusaka' },
    'Zimbabwe': { lat: -17.8292, lon: 31.0522, city: 'Harare' },
    'Mozambique': { lat: -25.9692, lon: 32.5732, city: 'Maputo' },
    'DRC': { lat: -4.4419, lon: 15.2663, city: 'Kinshasa' },
    'Cameroon': { lat: 3.8480, lon: 11.5021, city: 'Yaoundé' },
};

export interface CurrentWeather {
    country: string;
    city: string;
    temperature: number;
    feelsLike: number;
    humidity: number;
    precipitation: number;
    windSpeed: number;
    weatherCode: number;
    weatherDescription: string;
    timestamp: string;
}

export interface AgriculturalConditions {
    country: string;
    soilMoisture: number; // 0-100%
    evapotranspiration: number; // mm/day
    precipitationLast7Days: number;
    precipitationLast30Days: number;
    temperatureAvg7Days: number;
    droughtRisk: 'low' | 'moderate' | 'high' | 'severe';
    growingConditions: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface ClimateAnomaly {
    country: string;
    temperatureAnomaly: number; // degrees above/below normal
    precipitationAnomaly: number; // % above/below normal
    period: string;
}

// Weather code to description mapping
const WEATHER_CODES: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
};

/**
 * Fetch current weather for a country
 */
export async function getCurrentWeather(
    env: Env,
    countryName: string
): Promise<CurrentWeather | null> {
    const cacheKey = `weather:current:${countryName}`;

    // Short cache - 30 minutes for current weather
    const cached = await env.CACHE.get(cacheKey, 'json') as CurrentWeather | null;
    if (cached) return cached;

    const location = AFRICAN_LOCATIONS[countryName];
    if (!location) return null;

    try {
        const url = new URL('https://api.open-meteo.com/v1/forecast');
        url.searchParams.set('latitude', location.lat.toString());
        url.searchParams.set('longitude', location.lon.toString());
        url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m');
        url.searchParams.set('timezone', 'auto');

        const response = await fetch(url.toString());
        if (!response.ok) return null;

        const data = await response.json() as Record<string, any>;
        const current = data.current;

        const weather: CurrentWeather = {
            country: countryName,
            city: location.city,
            temperature: current.temperature_2m,
            feelsLike: current.apparent_temperature,
            humidity: current.relative_humidity_2m,
            precipitation: current.precipitation,
            windSpeed: current.wind_speed_10m,
            weatherCode: current.weather_code,
            weatherDescription: WEATHER_CODES[current.weather_code] || 'Unknown',
            timestamp: current.time,
        };

        await env.CACHE.put(cacheKey, JSON.stringify(weather), { expirationTtl: 1800 });
        return weather;
    } catch (error) {
        console.error('Weather fetch error:', error);
        return null;
    }
}

/**
 * Fetch agricultural conditions for farming intelligence
 */
export async function getAgriculturalConditions(
    env: Env,
    countryName: string
): Promise<AgriculturalConditions | null> {
    const cacheKey = `weather:agri:${countryName}`;

    const cached = await env.CACHE.get(cacheKey, 'json') as AgriculturalConditions | null;
    if (cached) return cached;

    const location = AFRICAN_LOCATIONS[countryName];
    if (!location) return null;

    try {
        // Fetch historical data for last 30 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const url = new URL('https://archive-api.open-meteo.com/v1/archive');
        url.searchParams.set('latitude', location.lat.toString());
        url.searchParams.set('longitude', location.lon.toString());
        url.searchParams.set('start_date', startDate.toISOString().split('T')[0]);
        url.searchParams.set('end_date', endDate.toISOString().split('T')[0]);
        url.searchParams.set('daily', 'temperature_2m_mean,precipitation_sum,et0_fao_evapotranspiration,soil_moisture_0_to_10cm_mean');
        url.searchParams.set('timezone', 'auto');

        const response = await fetch(url.toString());
        if (!response.ok) return null;

        const data = await response.json() as Record<string, any>;
        const daily = data.daily;

        // Calculate metrics
        const temps = daily.temperature_2m_mean.filter((t: any) => t !== null) as number[];
        const precip = daily.precipitation_sum.filter((p: any) => p !== null) as number[];
        const et = daily.et0_fao_evapotranspiration.filter((e: any) => e !== null) as number[];
        const soil = daily.soil_moisture_0_to_10cm_mean?.filter((s: any) => s !== null) as number[] || [];

        const avgTemp = temps.length > 0 ? temps.reduce((a, b) => a + b, 0) / temps.length : 0;
        const totalPrecip30 = precip.reduce((a, b) => a + b, 0);
        const totalPrecip7 = precip.slice(-7).reduce((a, b) => a + b, 0);
        const avgET = et.length > 0 ? et.reduce((a, b) => a + b, 0) / et.length : 0;
        const avgSoilMoisture = soil.length > 0 ? soil.reduce((a, b) => a + b, 0) / soil.length : 50;

        // Assess drought risk
        let droughtRisk: 'low' | 'moderate' | 'high' | 'severe' = 'low';
        if (totalPrecip30 < 20) droughtRisk = 'severe';
        else if (totalPrecip30 < 50) droughtRisk = 'high';
        else if (totalPrecip30 < 100) droughtRisk = 'moderate';

        // Assess growing conditions
        let growingConditions: 'excellent' | 'good' | 'fair' | 'poor' = 'good';
        if (avgSoilMoisture < 20 || totalPrecip30 < 30) growingConditions = 'poor';
        else if (avgSoilMoisture < 40 || totalPrecip30 < 60) growingConditions = 'fair';
        else if (avgSoilMoisture > 60 && totalPrecip30 > 100) growingConditions = 'excellent';

        const conditions: AgriculturalConditions = {
            country: countryName,
            soilMoisture: avgSoilMoisture,
            evapotranspiration: avgET,
            precipitationLast7Days: totalPrecip7,
            precipitationLast30Days: totalPrecip30,
            temperatureAvg7Days: temps.slice(-7).reduce((a, b) => a + b, 0) / Math.min(7, temps.length),
            droughtRisk,
            growingConditions,
        };

        await env.CACHE.put(cacheKey, JSON.stringify(conditions), { expirationTtl: 21600 }); // 6 hour cache
        return conditions;
    } catch (error) {
        console.error('Agricultural conditions fetch error:', error);
        return null;
    }
}

/**
 * Get seasonal forecast summary
 */
export async function getSeasonalForecast(
    env: Env,
    countryName: string
): Promise<{ next7Days: { minTemp: number; maxTemp: number; totalPrecip: number }; outlook: string } | null> {
    const cacheKey = `weather:forecast:${countryName}`;

    const cached = await env.CACHE.get(cacheKey, 'json') as any | null;
    if (cached) return cached;

    const location = AFRICAN_LOCATIONS[countryName];
    if (!location) return null;

    try {
        const url = new URL('https://api.open-meteo.com/v1/forecast');
        url.searchParams.set('latitude', location.lat.toString());
        url.searchParams.set('longitude', location.lon.toString());
        url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max');
        url.searchParams.set('forecast_days', '7');
        url.searchParams.set('timezone', 'auto');

        const response = await fetch(url.toString());
        if (!response.ok) return null;

        const data = await response.json() as Record<string, any>;
        const daily = data.daily;

        const minTemp = Math.min(...daily.temperature_2m_min);
        const maxTemp = Math.max(...daily.temperature_2m_max);
        const totalPrecip = daily.precipitation_sum.reduce((a: number, b: number) => a + b, 0);
        const avgPrecipProb = daily.precipitation_probability_max.reduce((a: number, b: number) => a + b, 0) / 7;

        // Generate outlook
        let outlook = '';
        if (totalPrecip > 50) {
            outlook = 'Wet conditions expected with significant rainfall. Good for crops, potential flooding risk.';
        } else if (totalPrecip > 20) {
            outlook = 'Normal precipitation expected. Favorable growing conditions.';
        } else if (totalPrecip > 5) {
            outlook = 'Dry conditions with light rainfall. Irrigation may be needed.';
        } else {
            outlook = 'Very dry conditions expected. High drought risk for agriculture.';
        }

        const forecast = {
            next7Days: { minTemp, maxTemp, totalPrecip },
            outlook,
        };

        await env.CACHE.put(cacheKey, JSON.stringify(forecast), { expirationTtl: 21600 });
        return forecast;
    } catch (error) {
        console.error('Seasonal forecast fetch error:', error);
        return null;
    }
}

/**
 * Format weather data for article enrichment
 */
export function formatWeatherInsight(weather: CurrentWeather, agri?: AgriculturalConditions): string {
    let insight = `**Weather Update (${weather.city})**: ${weather.weatherDescription}, ${weather.temperature.toFixed(0)}°C`;

    if (agri) {
        insight += `. **Agricultural Outlook**: ${agri.growingConditions} growing conditions`;
        if (agri.droughtRisk !== 'low') {
            insight += `, ${agri.droughtRisk} drought risk`;
        }
        insight += `. Rainfall last 30 days: ${agri.precipitationLast30Days.toFixed(0)}mm.`;
    }

    return insight;
}

/**
 * Enrich article with weather data (especially for agriculture sector)
 */
export async function enrichWithWeatherData(
    env: Env,
    countryName: string,
    sector?: string
): Promise<string | null> {
    const weather = await getCurrentWeather(env, countryName);
    if (!weather) return null;

    // Include agricultural data for relevant sectors
    const agriSectors = ['agriculture', 'farming', 'food', 'commodities'];
    let agri: AgriculturalConditions | null = null;

    if (sector && agriSectors.some(s => sector.toLowerCase().includes(s))) {
        agri = await getAgriculturalConditions(env, countryName);
    }

    return formatWeatherInsight(weather, agri || undefined);
}

/**
 * Get weather alerts for all African countries
 */
export async function getAfricaWeatherAlerts(
    env: Env
): Promise<{ country: string; alert: string; severity: 'info' | 'warning' | 'danger' }[]> {
    const alerts: { country: string; alert: string; severity: 'info' | 'warning' | 'danger' }[] = [];

    for (const country of Object.keys(AFRICAN_LOCATIONS)) {
        const agri = await getAgriculturalConditions(env, country);
        if (!agri) continue;

        if (agri.droughtRisk === 'severe') {
            alerts.push({
                country,
                alert: 'Severe drought conditions detected',
                severity: 'danger',
            });
        } else if (agri.droughtRisk === 'high') {
            alerts.push({
                country,
                alert: 'High drought risk - water stress likely',
                severity: 'warning',
            });
        }

        if (agri.precipitationLast7Days > 150) {
            alerts.push({
                country,
                alert: 'Heavy rainfall - potential flooding',
                severity: 'warning',
            });
        }
    }

    return alerts;
}
