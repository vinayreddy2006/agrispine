import axios from 'axios';

/**
 * Calculates Dew Point in °C using the standard Magnus-Tetens formula.
 * @param {number} temp - Temperature in Celsius
 * @param {number} humidity - Relative humidity in %
 * @returns {number} Dew Point in °C rounded to 1 decimal place
 */
export const calculateDewPoint = (temp, humidity) => {
    if (temp === undefined || humidity === undefined || humidity <= 0) return null;
    const a = 17.27;
    const b = 237.7;
    const alpha = ((a * temp) / (b + temp)) + Math.log(humidity / 100);
    const dewPoint = (b * alpha) / (a - alpha);
    return Math.round(dewPoint * 10) / 10;
};

/**
 * Converts wind degrees (0-360) into 16 cardinal compass directions.
 * @param {number} deg - Wind degrees
 * @returns {string} Compass direction (e.g., 'N', 'NNW', 'ESE')
 */
export const getWindDirection = (deg) => {
    if (deg === undefined || deg === null) return 'N/A';
    const directions = [
        'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
        'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'
    ];
    const index = Math.round((deg % 360) / 22.5) % 16;
    return directions[index];
};

/**
 * Deterministic, agrometeorologically sound rule-based recommendation engine.
 * Covers Spraying, Irrigation, Harvesting, and Field Work/Fertilization.
 */
export const generateRuleBasedRecommendations = ({ weather, forecast, userCrops = [], userProfile = {}, locationName = '' }) => {
    const currentTemp = weather?.main?.temp ?? 25;
    const feelsLike = weather?.main?.feels_like ?? currentTemp;
    const humidity = weather?.main?.humidity ?? 50;
    const windSpeed = weather?.wind?.speed ?? 2; // m/s
    const windGust = weather?.wind?.gust ?? windSpeed;
    const pressure = weather?.main?.pressure ?? 1013;
    const clouds = weather?.clouds?.all ?? 0;
    const weatherMain = (weather?.weather?.[0]?.main || '').toLowerCase();
    const isCurrentlyRaining = weatherMain.includes('rain') || weatherMain.includes('drizzle') || weatherMain.includes('thunderstorm');

    // Forecast analysis over the next 12 and 24 hours
    const next12hList = (forecast?.list || []).slice(0, 4); // 4 * 3h = 12 hours
    const next24hList = (forecast?.list || []).slice(0, 8); // 8 * 3h = 24 hours

    const maxRainProb12h = next12hList.reduce((max, item) => Math.max(max, Math.round((item.pop || 0) * 100)), 0);
    const maxRainProb24h = next24hList.reduce((max, item) => Math.max(max, Math.round((item.pop || 0) * 100)), 0);
    const rainExpected12h = next12hList.some(item => (item.weather?.[0]?.main || '').toLowerCase().includes('rain') || (item.pop || 0) > 0.35);
    const maxWindForecast12h = next12hList.reduce((max, item) => Math.max(max, item.wind?.speed || 0), windSpeed);

    // Crop names array for contextualization
    const cropNames = userCrops.map(c => c.cropName || c).filter(Boolean);
    const cropsContextString = cropNames.length > 0 ? cropNames.join(', ') : 'All general crops';

    const recommendations = [];

    // -------------------------------------------------------------
    // 1. SPRAYING OPERATIONS (Pesticides, Fungicides, Foliar Sprays)
    // -------------------------------------------------------------
    let sprayingStatus = 'favorable';
    let sprayingAdvice = 'Optimal conditions for foliar and pesticide spraying. Gentle breeze and moderate humidity favor uniform droplet deposition.';
    let sprayingReason = `Wind is ${windSpeed} m/s with 0% rain chance in the near forecast window. Droplet drift risk is minimal.`;

    if (isCurrentlyRaining || maxRainProb12h >= 45 || rainExpected12h) {
        sprayingStatus = 'unfavorable';
        sprayingAdvice = 'Halt all spraying operations. Rain is currently occurring or expected within the 6-hour rainfastness window.';
        sprayingReason = `Precipitation probability is ${maxRainProb12h}%. Active rainfall will wash active chemicals off leaves into the soil, causing chemical waste and loss of efficacy.`;
    } else if (windSpeed > 5.5 || windGust > 7.0 || maxWindForecast12h > 6.0) {
        sprayingStatus = 'unfavorable';
        sprayingAdvice = 'Postpone chemical spraying. Strong winds create a high risk of spray drift.';
        sprayingReason = `Current wind speed is ${windSpeed} m/s (gusts up to ${windGust} m/s). Spraying in winds exceeding 5 m/s risks chemical contamination of adjacent plots and uneven coverage.`;
    } else if (windSpeed < 1.0 && clouds < 30 && currentTemp > 28) {
        sprayingStatus = 'caution';
        sprayingAdvice = 'Exercise caution: Potential thermal inversion. Prefer spraying early morning (06:00–09:00) or late evening.';
        sprayingReason = `Very low wind (< 1 m/s) with warm ground temperatures can trap fine spray droplets in stagnant air, reducing canopy penetration.`;
    } else if (currentTemp > 33 && humidity < 40) {
        sprayingStatus = 'caution';
        sprayingAdvice = 'Avoid spraying during mid-day heat. Schedule application during early morning or after 17:00.';
        sprayingReason = `High temperature (${currentTemp}°C) combined with dry air causes rapid droplet evaporation before reaching target leaves, risking chemical scorch (phytotoxicity).`;
    } else if (maxRainProb12h >= 25 && maxRainProb12h < 45) {
        sprayingStatus = 'caution';
        sprayingAdvice = 'Check local cloud build-up before spraying. Use a surfactant/adjuvant sticker if application is critical.';
        sprayingReason = `Rain probability is ${maxRainProb12h}% within 12 hours. Ensure products have a short rainfastness duration.`;
    }

    recommendations.push({
        id: 'spraying',
        activity: 'Spraying Operations',
        status: sprayingStatus,
        statusLabel: sprayingStatus === 'favorable' ? 'Favorable' : sprayingStatus === 'caution' ? 'Caution' : 'Unfavorable',
        advice: sprayingAdvice,
        reason: sprayingReason,
        metrics: {
            wind: `${windSpeed} m/s (${getWindDirection(weather?.wind?.deg)})`,
            gust: windGust ? `${windGust} m/s` : 'None',
            temp: `${currentTemp}°C`,
            humidity: `${humidity}%`,
            rainChance12h: `${maxRainProb12h}%`
        },
        timeWindow: 'Next 6–12 Hours',
        crops: cropNames
    });

    // -------------------------------------------------------------
    // 2. IRRIGATION PLANNING
    // -------------------------------------------------------------
    let irrigationStatus = 'favorable';
    let irrigationAdvice = 'Maintain standard irrigation schedule. Soil moisture depletion expected due to dry atmospheric conditions.';
    let irrigationReason = `No significant rainfall forecast in the next 24–48 hours (${maxRainProb24h}% chance). Solar exposure and temperature support active crop uptake.`;

    if (isCurrentlyRaining || maxRainProb24h >= 50) {
        irrigationStatus = 'unfavorable';
        irrigationAdvice = 'Pause irrigation. Significant rainfall is forecast for your fields.';
        irrigationReason = `Expected rain probability is ${maxRainProb24h}% in the next 24 hours. Irrigating now risks root asphyxiation, nutrient leaching, and fungal root diseases.`;
    } else if (maxRainProb24h >= 25 && maxRainProb24h < 50) {
        irrigationStatus = 'caution';
        irrigationAdvice = 'Reduce or postpone scheduled watering by 24 hours to monitor incoming cloud systems.';
        irrigationReason = `There is a ${maxRainProb24h}% chance of precipitation. Light rainfall may satisfy immediate crop evapotranspiration needs.`;
    } else if (currentTemp >= 34) {
        irrigationStatus = 'caution';
        irrigationAdvice = 'High evapotranspiration demand. Irrigate during early morning or night via drip or furrow to minimize surface evaporation.';
        irrigationReason = `Ambient temperature of ${currentTemp}°C increases crop transpiration demand. Mid-day watering leads to significant water loss.`;
    }

    recommendations.push({
        id: 'irrigation',
        activity: 'Irrigation Planning',
        status: irrigationStatus,
        statusLabel: irrigationStatus === 'favorable' ? 'Favorable' : irrigationStatus === 'caution' ? 'Caution' : 'Unfavorable',
        advice: irrigationAdvice,
        reason: irrigationReason,
        metrics: {
            rainChance24h: `${maxRainProb24h}%`,
            humidity: `${humidity}%`,
            temp: `${currentTemp}°C`,
            pressure: `${pressure} hPa`
        },
        timeWindow: 'Next 24–48 Hours',
        crops: cropNames
    });

    // -------------------------------------------------------------
    // 3. HARVESTING & POST-HARVEST DRYING
    // -------------------------------------------------------------
    let harvestStatus = 'favorable';
    let harvestAdvice = 'Safe and favorable weather for harvesting, cotton picking, threshing, and sun-drying produce.';
    let harvestReason = `Dry skies with low precipitation likelihood (${maxRainProb24h}%). Humidity is suitable for maintaining grain and fiber quality.`;

    if (isCurrentlyRaining || maxRainProb24h >= 40) {
        harvestStatus = 'unfavorable';
        harvestAdvice = 'Halt all harvesting and threshing activities. Secure harvested produce under waterproof tarpaulins.';
        harvestReason = `Rain forecast of ${maxRainProb24h}% in the next 24h. Wet crop batches face severe risks of grain discoloration, premature sprouting, and fungal aflatoxin development.`;
    } else if (humidity > 78 || maxRainProb24h >= 20) {
        harvestStatus = 'caution';
        harvestAdvice = 'Proceed with caution for mature plots. Ensure immediate transport to sheltered storage or covered threshing floors.';
        harvestReason = `Elevated atmospheric humidity (${humidity}%) and a ${maxRainProb24h}% chance of showers will slow down sun-drying and cotton fiber drying.`;
    }

    recommendations.push({
        id: 'harvesting',
        activity: 'Harvesting & Post-Harvest Drying',
        status: harvestStatus,
        statusLabel: harvestStatus === 'favorable' ? 'Favorable' : harvestStatus === 'caution' ? 'Caution' : 'Unfavorable',
        advice: harvestAdvice,
        reason: harvestReason,
        metrics: {
            rainChance24h: `${maxRainProb24h}%`,
            humidity: `${humidity}%`,
            clouds: `${clouds}%`
        },
        timeWindow: 'Next 24–48 Hours',
        crops: cropNames
    });

    // -------------------------------------------------------------
    // 4. FIELD WORK, SOWING & FERTILIZER APPLICATION
    // -------------------------------------------------------------
    let fieldStatus = 'favorable';
    let fieldAdvice = 'Weather is favorable for tractor intercultural operations, seedbed preparation, weeding, and fertilizer top-dressing.';
    let fieldReason = `Firm soil moisture, calm winds (${windSpeed} m/s), and zero heavy rain threats ensure efficient machinery traction and fertilizer uptake.`;

    if (isCurrentlyRaining || maxRainProb24h >= 55) {
        fieldStatus = 'unfavorable';
        fieldAdvice = 'Avoid heavy machinery tillage and nitrogen/urea top-dressing. High risk of soil compaction and fertilizer run-off.';
        fieldReason = `Heavy moisture/rain (${maxRainProb24h}% chance) will wash away broadcast fertilizers and cause tractor tires to sink, destroying soil structure.`;
    } else if (windSpeed > 5.0) {
        fieldStatus = 'caution';
        fieldAdvice = 'Caution during broadcast fertilizer application. High winds cause uneven field spread.';
        fieldReason = `Wind speed of ${windSpeed} m/s will blow granular fertilizers and fine soil particles away from target rows.`;
    } else if (maxRainProb12h >= 25 && maxRainProb12h <= 45) {
        fieldStatus = 'caution';
        fieldAdvice = 'Suitable for split-dose nitrogen top-dressing if followed by gentle light showers, but withhold if downpour threatens.';
        fieldReason = `Light rain helps dissolve broadcast urea into root zone without volatilization, but monitor clouds closely.`;
    }

    recommendations.push({
        id: 'field_work',
        activity: 'Field Work & Fertilizer Application',
        status: fieldStatus,
        statusLabel: fieldStatus === 'favorable' ? 'Favorable' : fieldStatus === 'caution' ? 'Caution' : 'Unfavorable',
        advice: fieldAdvice,
        reason: fieldReason,
        metrics: {
            wind: `${windSpeed} m/s`,
            temp: `${currentTemp}°C`,
            soilWorkability: isCurrentlyRaining ? 'Saturated' : 'Dry / Workable'
        },
        timeWindow: 'Today / Next 24 Hours',
        crops: cropNames
    });

    return recommendations;
};

/**
 * Attempts to generate contextual agricultural recommendations using the Gemini API.
 * Falls back to deterministic rule-based engine upon any timeout, error, or quota limitation.
 */
export const getAgriculturalRecommendations = async ({ weather, forecast, userCrops = [], userProfile = {}, locationName = '' }) => {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const baseRecommendations = generateRuleBasedRecommendations({ weather, forecast, userCrops, userProfile, locationName });

    if (!geminiApiKey || geminiApiKey.trim() === '' || geminiApiKey.startsWith('YOUR_')) {
        return {
            recommendations: baseRecommendations,
            source: 'rule-based',
            model: 'Agrometeorological Rules Engine',
            note: 'Generated using deterministic agronomic meteorology guidelines.'
        };
    }

    try {
        // Attempt Gemini call with a 6-second timeout
        const cropListStr = userCrops.map(c => c.cropName || c).filter(Boolean).join(', ') || 'General agricultural crops';
        
        const prompt = `
You are an expert Indian agronomist and agricultural meteorologist for AgriSpine.
Analyze the following real weather data and farm context, and generate actionable recommendations for 4 agricultural activities:
1. Spraying Operations (Pesticides/Fungicides/Herbicides)
2. Irrigation Planning
3. Harvesting & Post-Harvest Drying
4. Field Work & Fertilizer Application

FARM & WEATHER DATA:
- Location: ${locationName || weather?.name || 'Local Farm'}
- Current Temp: ${weather?.main?.temp}°C (Feels like: ${weather?.main?.feels_like}°C)
- Humidity: ${weather?.main?.humidity}%
- Wind: ${weather?.wind?.speed} m/s (Direction: ${weather?.wind?.deg}°, Gusts: ${weather?.wind?.gust || 'N/A'} m/s)
- Pressure: ${weather?.main?.pressure} hPa
- Clouds: ${weather?.clouds?.all}%
- Current Weather: ${weather?.weather?.[0]?.description || 'Clear'}
- 12h Rain Probability: ${forecast?.list?.slice(0, 4).reduce((m, i) => Math.max(m, Math.round((i.pop || 0) * 100)), 0)}%
- 24h Rain Probability: ${forecast?.list?.slice(0, 8).reduce((m, i) => Math.max(m, Math.round((i.pop || 0) * 100)), 0)}%
- Cultivated Crops: ${cropListStr}

CRITICAL RULES:
1. Status must strictly be one of: "favorable", "caution", "unfavorable", "insufficient_data".
2. Never claim conditions are favorable if wind > 5 m/s or rain chance > 40% for spraying.
3. Ground all recommendations strictly in the provided measurements. Do not hallucinate.
4. Output MUST be a valid JSON array matching this exact schema:
[
  {
    "id": "spraying",
    "activity": "Spraying Operations",
    "status": "favorable | caution | unfavorable | insufficient_data",
    "statusLabel": "Favorable | Caution | Unfavorable | Insufficient Data",
    "advice": "1 concise sentence with practical instruction",
    "reason": "1 clear sentence explaining why based on wind/rain/temp",
    "metrics": { "wind": "string", "rainChance": "string", "temp": "string" },
    "timeWindow": "Next 6–12 Hours",
    "crops": ["Crop names if relevant"]
  },
  ... (same for irrigation, harvesting, field_work)
]
Return ONLY the raw JSON array. No markdown, no filler.
`;

        // Priority models: gemini-2.5-flash as configured in AgriSpine, falling back to gemini-3.8-flash / gemini-1.5-flash
        const modelNames = ['gemini-2.5-flash', 'gemini-3.8-flash', 'gemini-1.5-flash'];
        let geminiResponse = null;

        for (const model of modelNames) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
                const response = await axios.post(
                    url,
                    {
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.1,
                            responseMimeType: "application/json"
                        }
                    },
                    { timeout: 5000 }
                );

                if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                    const text = response.data.candidates[0].content.parts[0].text.trim();
                    const cleanText = text.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
                    const parsed = JSON.parse(cleanText);
                    if (Array.isArray(parsed) && parsed.length >= 3) {
                        geminiResponse = { data: parsed, modelUsed: model };
                        break;
                    }
                }
            } catch (err) {
                // Try next model if current model errors
                continue;
            }
        }

        if (geminiResponse) {
            return {
                recommendations: geminiResponse.data,
                source: 'gemini',
                model: geminiResponse.modelUsed,
                note: 'Generated using Gemini agricultural intelligence tailored to real-time weather and crop profiles.'
            };
        }
    } catch (err) {
        console.warn('Gemini recommendation call failed, using rule-based fallback:', err.message);
    }

    // Safe fallback to deterministic rules
    return {
        recommendations: baseRecommendations,
        source: 'rule-based',
        model: 'Agrometeorological Rules Engine',
        note: 'Generated using deterministic agronomic meteorology guidelines.'
    };
};

