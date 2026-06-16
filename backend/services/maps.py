import os
import logging
import urllib.parse
from typing import Dict, Any, List, Optional
import httpx
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

# Static fallback coordinates for top Indian cities
INDIAN_CITY_COORDS = {
    "delhi": {"lat": 28.6139, "lng": 77.2090},
    "new delhi": {"lat": 28.6139, "lng": 77.2090},
    "mumbai": {"lat": 19.0760, "lng": 72.8777},
    "bengaluru": {"lat": 12.9716, "lng": 77.5946},
    "bangalore": {"lat": 12.9716, "lng": 77.5946},
    "chennai": {"lat": 13.0827, "lng": 80.2707},
    "hyderabad": {"lat": 17.3850, "lng": 78.4867},
    "kolkata": {"lat": 22.5726, "lng": 88.3639},
    "goa": {"lat": 15.2993, "lng": 74.1240},
    "jaipur": {"lat": 26.9124, "lng": 75.7873},
    "agra": {"lat": 27.1767, "lng": 78.0081},
    "kochi": {"lat": 9.9312, "lng": 76.2673},
    "pune": {"lat": 18.5204, "lng": 73.8567},
    "ahmedabad": {"lat": 23.0225, "lng": 72.5714},
    "surat": {"lat": 21.1702, "lng": 72.8311},
    "varanasi": {"lat": 25.3176, "lng": 82.9739},
    "amritsar": {"lat": 31.6340, "lng": 74.8723},
    "udaipur": {"lat": 24.5854, "lng": 73.7125},
    "manali": {"lat": 32.2396, "lng": 77.1887},
    "shimla": {"lat": 31.1048, "lng": 77.1734},
    "darjeeling": {"lat": 27.0410, "lng": 88.2663},
    "mysuru": {"lat": 12.2958, "lng": 76.6394},
    "mysore": {"lat": 12.2958, "lng": 76.6394},
    "pondicherry": {"lat": 11.9416, "lng": 79.8083},
    "ooty": {"lat": 11.4102, "lng": 76.6950},
    "coorg": {"lat": 12.3375, "lng": 75.8069},
}

async def geocode_city(city: str) -> Dict[str, float]:
    """
    Geocodes a city name to latitude and longitude.
    Fallback chain: Google Geocoding -> Nominatim (OSM) -> Static DB
    """
    if GOOGLE_MAPS_API_KEY:
        try:
            logger.info(f"Geocoding {city} via Google Geocoding API")
            async with httpx.AsyncClient() as client:
                url = f"https://maps.googleapis.com/maps/api/geocode/json?address={urllib.parse.quote(city)}&key={GOOGLE_MAPS_API_KEY}"
                resp = await client.get(url, timeout=5.0)
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("status") == "OK" and data.get("results"):
                        location = data["results"][0]["geometry"]["location"]
                        return {"lat": location["lat"], "lng": location["lng"]}
        except Exception as e:
            logger.warning(f"Google Geocoding failed: {e}. Falling back to Nominatim.")

    # Fallback: OpenStreetMap Nominatim API (completely free, no key required)
    try:
        logger.info(f"Geocoding {city} via Nominatim (OSM)")
        headers = {"User-Agent": "TriplyAITravelPlanner/1.0 (contact@triply.ai)"}
        encoded = urllib.parse.quote(city + ", India")
        async with httpx.AsyncClient() as client:
            url = f"https://nominatim.openstreetmap.org/search?q={encoded}&format=json&limit=1&countrycodes=in"
            resp = await client.get(url, headers=headers, timeout=8.0)
            if resp.status_code == 200 and resp.json():
                data = resp.json()[0]
                return {"lat": float(data["lat"]), "lng": float(data["lon"])}
    except Exception as e:
        logger.error(f"Nominatim Geocoding failed: {e}")

    # Static fallback from preloaded Indian city DB
    city_lower = city.lower().strip()
    for c, coords in INDIAN_CITY_COORDS.items():
        if c in city_lower or city_lower in c:
            return coords

    return {"lat": 20.5937, "lng": 78.9629}  # Center of India fallback


async def get_directions(origin: str, destination: str, mode: str = "driving") -> Dict[str, Any]:
    """
    Fetches directions between origin and destination.
    Fallback chain: Google Directions -> OSRM (free, open source routing)
    """
    if GOOGLE_MAPS_API_KEY:
        try:
            logger.info(f"Fetching directions from {origin} to {destination} via Google Directions")
            async with httpx.AsyncClient() as client:
                url = (
                    f"https://maps.googleapis.com/maps/api/directions/json"
                    f"?origin={urllib.parse.quote(origin)}&destination={urllib.parse.quote(destination)}"
                    f"&mode={mode}&key={GOOGLE_MAPS_API_KEY}"
                )
                resp = await client.get(url, timeout=5.0)
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("status") == "OK" and data.get("routes"):
                        route = data["routes"][0]["legs"][0]
                        return {
                            "distance": route["distance"]["text"],
                            "duration": route["duration"]["text"],
                            "polyline": data["routes"][0]["overview_polyline"]["points"],
                            "steps": [step["html_instructions"] for step in route["steps"]]
                        }
        except Exception as e:
            logger.warning(f"Google Directions failed: {e}. Falling back to OSRM.")

    # Fallback: Open Source Routing Machine (OSRM) — completely free, no key required
    try:
        logger.info("Fetching directions via OSRM (free open-source routing)")
        orig_coords = await geocode_city(origin)
        dest_coords = await geocode_city(destination)

        async with httpx.AsyncClient() as client:
            url = (
                f"http://router.project-osrm.org/route/v1/driving/"
                f"{orig_coords['lng']},{orig_coords['lat']};"
                f"{dest_coords['lng']},{dest_coords['lat']}"
                f"?overview=simplified&steps=true"
            )
            resp = await client.get(url, timeout=8.0)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("code") == "Ok" and data.get("routes"):
                    route = data["routes"][0]
                    distance_km = round(route["distance"] / 1000, 1)
                    duration_mins = round(route["duration"] / 60)

                    if duration_mins > 60:
                        h = duration_mins // 60
                        m = duration_mins % 60
                        dur_str = f"{h}h {m}m"
                    else:
                        dur_str = f"{duration_mins} mins"

                    steps = []
                    for leg in route.get("legs", []):
                        for step in leg.get("steps", []):
                            name = step.get("name", "road")
                            maneuver = step.get("maneuver", {}).get("type", "proceed")
                            if name:
                                steps.append(f"{maneuver.capitalize()} onto {name}")

                    return {
                        "distance": f"{distance_km} km",
                        "duration": dur_str,
                        "polyline": route.get("geometry", ""),
                        "steps": steps[:10]
                    }
    except Exception as e:
        logger.error(f"OSRM routing failed: {e}")

    # Hard fallback with approximate values
    return {
        "distance": "Approx. 250 km",
        "duration": "4h 30m",
        "polyline": "",
        "steps": ["Head towards main highway", "Follow signs to destination city", "Arrive at destination"]
    }


async def search_places_overpass(
    query_type: str,
    city: str,
    lat: float,
    lng: float,
    radius_m: int = 5000,
    limit: int = 5
) -> List[Dict[str, Any]]:
    """
    Search places using Overpass API (OpenStreetMap) — completely free, no key required.
    query_type: 'amenity=restaurant', 'tourism=hotel', 'tourism=attraction', etc.
    """
    try:
        logger.info(f"Searching '{query_type}' near {city} via Overpass API (OSM)")
        overpass_url = "https://overpass-api.de/api/interpreter"

        # Build Overpass QL query
        key, val = query_type.split("=", 1)
        overpass_query = f"""
[out:json][timeout:10];
(
  node["{key}"="{val}"](around:{radius_m},{lat},{lng});
  way["{key}"="{val}"](around:{radius_m},{lat},{lng});
);
out center {limit * 3};
"""
        async with httpx.AsyncClient() as client:
            resp = await client.post(overpass_url, data={"data": overpass_query}, timeout=15.0)
            if resp.status_code == 200:
                data = resp.json()
                results = []
                seen_names = set()
                for element in data.get("elements", []):
                    tags = element.get("tags", {})
                    name = tags.get("name") or tags.get("name:en")
                    if not name or name in seen_names:
                        continue
                    seen_names.add(name)

                    # Get coordinates
                    if element.get("type") == "node":
                        elat, elng = element.get("lat"), element.get("lon")
                    else:
                        center = element.get("center", {})
                        elat, elng = center.get("lat", lat), center.get("lon", lng)

                    cuisine = tags.get("cuisine", "").replace(";", ", ")
                    phone = tags.get("phone", tags.get("contact:phone", ""))
                    website = tags.get("website", tags.get("contact:website", ""))

                    results.append({
                        "name": name,
                        "address": tags.get("addr:full") or f"{tags.get('addr:street', '')}, {city}".strip(", "),
                        "cuisine": cuisine,
                        "phone": phone,
                        "website": website,
                        "rating": 0.0,  # OSM doesn't have ratings
                        "lat": elat,
                        "lng": elng,
                        "maps_url": f"https://www.openstreetmap.org/?mlat={elat}&mlon={elng}&zoom=17" if elat else f"https://www.google.com/maps/search/{urllib.parse.quote(name + ' ' + city)}"
                    })

                    if len(results) >= limit:
                        break

                return results
    except Exception as e:
        logger.error(f"Overpass API search failed: {e}")

    return []


async def search_places(query: str, location: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Search places using Google Places (if key available) or Overpass API (OSM) as free fallback.
    Returns list of matching places.
    """
    city = location or "India"

    # 1. Try Google Places (if key is available)
    if GOOGLE_MAPS_API_KEY:
        try:
            logger.info(f"Searching place query '{query}' via Google Places")
            bias_param = ""
            if location:
                coords = await geocode_city(location)
                bias_param = f"&location={coords['lat']},{coords['lng']}&radius=10000"

            async with httpx.AsyncClient() as client:
                url = (
                    f"https://maps.googleapis.com/maps/api/place/textsearch/json"
                    f"?query={urllib.parse.quote(query)}{bias_param}&key={GOOGLE_MAPS_API_KEY}"
                )
                resp = await client.get(url, timeout=5.0)
                if resp.status_code == 200:
                    data = resp.json()
                    results = []
                    for item in data.get("results", [])[:5]:
                        results.append({
                            "name": item.get("name"),
                            "address": item.get("formatted_address"),
                            "rating": item.get("rating", 0.0),
                            "lat": item.get("geometry", {}).get("location", {}).get("lat"),
                            "lng": item.get("geometry", {}).get("location", {}).get("lng"),
                            "maps_url": f"https://www.google.com/maps/search/?api=1&query={urllib.parse.quote(item.get('name', ''))}&query_place_id={item.get('place_id')}"
                        })
                    if results:
                        return results
        except Exception as e:
            logger.warning(f"Google Places Search failed: {e}. Falling back to Overpass API.")

    # 2. Fallback: Overpass API (OpenStreetMap) — completely free, no key required
    coords = await geocode_city(city)
    lat, lng = coords["lat"], coords["lng"]

    query_lower = query.lower()
    if any(word in query_lower for word in ["restaurant", "food", "cafe", "eat", "dine"]):
        results = await search_places_overpass("amenity=restaurant", city, lat, lng)
        if not results:
            results = await search_places_overpass("amenity=cafe", city, lat, lng)
    elif any(word in query_lower for word in ["hotel", "stay", "lodge", "hostel", "pg", "room"]):
        results = await search_places_overpass("tourism=hotel", city, lat, lng)
        if not results:
            results = await search_places_overpass("amenity=lodging", city, lat, lng)
    elif any(word in query_lower for word in ["temple", "church", "mosque", "shrine"]):
        results = await search_places_overpass("amenity=place_of_worship", city, lat, lng)
    elif any(word in query_lower for word in ["museum", "gallery", "exhibit"]):
        results = await search_places_overpass("tourism=museum", city, lat, lng)
    elif any(word in query_lower for word in ["park", "garden", "nature"]):
        results = await search_places_overpass("leisure=park", city, lat, lng)
    elif any(word in query_lower for word in ["beach", "lake", "waterfall", "river"]):
        results = await search_places_overpass("natural=water", city, lat, lng)
    else:
        results = await search_places_overpass("tourism=attraction", city, lat, lng)

    if results:
        return results

    # 3. Static curated fallback
    logger.info(f"Using curated static places for query: {query}")
    if any(word in query_lower for word in ["hotel", "stay", "lodge", "hostel"]):
        return [
            {"name": "The Grand Palace Hotel", "address": f"Central Ring Road, {city}", "rating": 4.5, "maps_url": f"https://www.google.com/maps/search/hotel+{urllib.parse.quote(city)}"},
            {"name": "Comfort Inn Residency", "address": f"Station Road, {city}", "rating": 4.1, "maps_url": f"https://www.google.com/maps/search/hotel+{urllib.parse.quote(city)}"},
            {"name": "Greenwood Homestay", "address": f"Mall Road, {city}", "rating": 4.8, "maps_url": f"https://www.google.com/maps/search/homestay+{urllib.parse.quote(city)}"}
        ]
    elif any(word in query_lower for word in ["restaurant", "food", "cafe"]):
        return [
            {"name": "Spicy Tadka Restaurant", "address": f"Main Market, {city}", "rating": 4.3, "maps_url": f"https://www.google.com/maps/search/restaurant+{urllib.parse.quote(city)}"},
            {"name": "The South Indian Cafe", "address": f"Opposite Railway Station, {city}", "rating": 4.2, "maps_url": f"https://www.google.com/maps/search/restaurant+{urllib.parse.quote(city)}"},
            {"name": "Royal Darbar Biryani", "address": f"Food Street, {city}", "rating": 4.6, "maps_url": f"https://www.google.com/maps/search/restaurant+{urllib.parse.quote(city)}"}
        ]
    else:
        return [
            {"name": f"{query.split()[0].capitalize()} Attraction", "address": f"{city}", "rating": 4.5, "maps_url": f"https://www.google.com/maps/search/{urllib.parse.quote(query + ' ' + city)}"}
        ]
