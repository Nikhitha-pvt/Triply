import os
import logging
from typing import List, Optional
import httpx
from dotenv import load_dotenv
from backend.models.itinerary import MealOption
from backend.services.maps import search_places_overpass, geocode_city

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

# NOTE: Zomato API is now discontinued for public use.
# We use Overpass API (OpenStreetMap) as a completely free alternative.
# No API key required.

# Curated restaurant specialties for major Indian cities (backup data)
CITY_SPECIALTIES = {
    "delhi": [
        {"name": "Karim's Restaurant", "cuisine": "Mughlai, North Indian", "rating": 4.4, "cost": 800.0, "area": "Jama Masjid"},
        {"name": "Haldiram's Connaught Place", "cuisine": "North Indian, Street Food, Sweets (Pure Veg)", "rating": 4.1, "cost": 400.0, "area": "Connaught Place"},
        {"name": "Paranthe Wali Gali", "cuisine": "Traditional Indian Flatbreads (Veg)", "rating": 4.3, "cost": 200.0, "area": "Chandni Chowk"},
        {"name": "Indian Accent", "cuisine": "Modern Indian", "rating": 4.7, "cost": 3500.0, "area": "The Lodhi"},
        {"name": "Bukhara (ITC Maurya)", "cuisine": "North-West Frontier, Tandoor", "rating": 4.6, "cost": 4000.0, "area": "Chanakyapuri"},
    ],
    "mumbai": [
        {"name": "Britannia & Co. Restaurant", "cuisine": "Parsi, Irani", "rating": 4.5, "cost": 900.0, "area": "Ballard Estate"},
        {"name": "Sardar Refreshments", "cuisine": "Fast Food, Pav Bhaji (Veg)", "rating": 4.2, "cost": 300.0, "area": "Tardeo"},
        {"name": "Leopold Cafe", "cuisine": "Continental, Chinese, North Indian", "rating": 4.1, "cost": 1000.0, "area": "Colaba"},
        {"name": "Khyber", "cuisine": "North Indian, Mughlai", "rating": 4.4, "cost": 2000.0, "area": "Fort"},
        {"name": "Trishna", "cuisine": "Seafood, Coastal", "rating": 4.5, "cost": 2500.0, "area": "Fort"},
    ],
    "bengaluru": [
        {"name": "MTR (Mavalli Tiffin Room)", "cuisine": "South Indian (Veg)", "rating": 4.6, "cost": 300.0, "area": "Lalbagh"},
        {"name": "Vidyarthi Bhavan", "cuisine": "South Indian Dosa (Veg)", "rating": 4.5, "cost": 200.0, "area": "Basavanagudi"},
        {"name": "Nagarjuna Restaurant", "cuisine": "Andhra, South Indian", "rating": 4.3, "cost": 800.0, "area": "Residency Road"},
        {"name": "Toit Brewpub", "cuisine": "Continental, Craft Beer", "rating": 4.3, "cost": 1500.0, "area": "Indiranagar"},
    ],
    "hyderabad": [
        {"name": "Paradise Biryani", "cuisine": "Biryani, Hyderabadi, Mughlai", "rating": 4.3, "cost": 600.0, "area": "Secunderabad"},
        {"name": "Bawarchi Restaurant", "cuisine": "Biryani, North Indian", "rating": 4.4, "cost": 500.0, "area": "RTC X Roads"},
        {"name": "Chutneys", "cuisine": "South Indian Vegetarian", "rating": 4.2, "cost": 450.0, "area": "Banjara Hills"},
        {"name": "Shah Ghouse Cafe", "cuisine": "Hyderabadi, Biryani", "rating": 4.5, "cost": 400.0, "area": "Tolichowki"},
    ],
    "chennai": [
        {"name": "Saravana Bhavan", "cuisine": "South Indian Vegetarian", "rating": 4.2, "cost": 350.0, "area": "Multiple Locations"},
        {"name": "Anjappar Chettinad", "cuisine": "Chettinad, South Indian Non-Veg", "rating": 4.1, "cost": 600.0, "area": "Anna Nagar"},
        {"name": "Murugan Idli Shop", "cuisine": "South Indian Tiffins (Veg)", "rating": 4.4, "cost": 250.0, "area": "T. Nagar"},
        {"name": "Buhari", "cuisine": "Biryani, North Indian", "rating": 4.0, "cost": 500.0, "area": "Mount Road"},
    ],
    "goa": [
        {"name": "Thalassa", "cuisine": "Greek, Mediterranean, Seafood", "rating": 4.5, "cost": 2500.0, "area": "Vagator"},
        {"name": "Fisherman's Wharf", "cuisine": "Goan, Seafood", "rating": 4.3, "cost": 1500.0, "area": "Cavelossim"},
        {"name": "Britto's", "cuisine": "Goan, Seafood, Continental", "rating": 4.2, "cost": 1200.0, "area": "Baga Beach"},
    ],
    "jaipur": [
        {"name": "Laxmi Misthan Bhandar (LMB)", "cuisine": "Rajasthani, Sweets (Veg)", "rating": 4.3, "cost": 600.0, "area": "Johari Bazaar"},
        {"name": "Chokhi Dhani", "cuisine": "Rajasthani Thali (Veg & Non-Veg)", "rating": 4.4, "cost": 1500.0, "area": "Tonk Road"},
        {"name": "1135 AD", "cuisine": "Rajput Royal Cuisine", "rating": 4.5, "cost": 3000.0, "area": "Amber Fort"},
    ],
    "kolkata": [
        {"name": "Peter Cat", "cuisine": "Continental, Mughlai", "rating": 4.2, "cost": 1200.0, "area": "Park Street"},
        {"name": "Flurys", "cuisine": "Bakery, Continental, Tea Room", "rating": 4.3, "cost": 800.0, "area": "Park Street"},
        {"name": "Arsalan", "cuisine": "Biryani, Awadhi", "rating": 4.4, "cost": 700.0, "area": "Park Circus"},
    ],
    "kochi": [
        {"name": "Dal Roti", "cuisine": "North Indian, Vegetarian", "rating": 4.2, "cost": 600.0, "area": "Marine Drive"},
        {"name": "Kayees Rahmathullah Hotel", "cuisine": "Kerala, Biriyani", "rating": 4.4, "cost": 300.0, "area": "Mattancherry"},
        {"name": "Fort House Restaurant", "cuisine": "Kerala, Seafood", "rating": 4.5, "cost": 1500.0, "area": "Fort Kochi"},
    ],
    "agra": [
        {"name": "Pind Balluchi", "cuisine": "North Indian, Mughlai", "rating": 4.1, "cost": 700.0, "area": "Fatehabad Road"},
        {"name": "Dasaprakash", "cuisine": "South Indian Vegetarian", "rating": 4.0, "cost": 500.0, "area": "Mehtab Bagh"},
        {"name": "Esphahan (The Oberoi Amarvilas)", "cuisine": "Fine Dining, Mughlai", "rating": 4.7, "cost": 5000.0, "area": "Taj East Gate"},
    ],
}

DEFAULT_RESTAURANTS = [
    {"name": "Hotel Saravana Grand", "cuisine": "South Indian Vegetarian", "rating": 4.2, "cost": 300.0, "area": "City Center"},
    {"name": "Royal Darbar Family Restaurant", "cuisine": "North Indian, Mughlai", "rating": 4.1, "cost": 600.0, "area": "Main Market"},
    {"name": "Udupi Sri Krishna", "cuisine": "Pure Veg South Indian", "rating": 4.3, "cost": 250.0, "area": "Station Road"},
    {"name": "Punjab Da Tadka", "cuisine": "North Indian, Punjabi", "rating": 4.0, "cost": 500.0, "area": "Commercial Street"},
    {"name": "Coastal Catch Seafood", "cuisine": "Seafood, Coastal", "rating": 4.2, "cost": 800.0, "area": "Beach Road"},
]


async def search_restaurants(
    city: str,
    diet_type: str,
    cuisines: List[str],
    max_meal_budget: float,
    min_rating: float = 3.5
) -> List[MealOption]:
    """
    Searches for restaurants matching food preferences.
    Fallback chain:
      1. Overpass API (OpenStreetMap) — real restaurant data, free, no key
      2. Curated city specialty list (Indian cities)
    """
    city_lower = city.lower().strip()

    # 1. Try Overpass API (OpenStreetMap) — completely free, no API key required
    try:
        logger.info(f"Searching restaurants in {city} via Overpass API (OpenStreetMap)")
        coords = await geocode_city(city)
        lat, lng = coords["lat"], coords["lng"]

        osm_results = await search_places_overpass(
            "amenity=restaurant", city, lat, lng, radius_m=4000, limit=10
        )

        # Also fetch cafes if few results
        if len(osm_results) < 3:
            cafe_results = await search_places_overpass(
                "amenity=cafe", city, lat, lng, radius_m=4000, limit=5
            )
            osm_results.extend(cafe_results)

        if osm_results:
            restaurants = []
            for r in osm_results:
                name = r.get("name", "")
                cuisine_str = r.get("cuisine", "Local Cuisine")
                if not cuisine_str:
                    cuisine_str = cuisines[0] if cuisines else "Local Cuisine"

                # OSM doesn't provide pricing; estimate based on diet/cuisine
                estimated_cost = _estimate_cost_for_two(cuisine_str, city_lower)

                # Apply budget filter
                if (estimated_cost / 2.0) > max_meal_budget:
                    continue

                # Apply diet filter (soft check using cuisine tags)
                if diet_type == "Vegetarian":
                    veg_keywords = ["veg", "vegetarian", "pure veg", "sattvic"]
                    non_veg_keywords = ["chicken", "meat", "fish", "seafood", "non-veg", "beef", "pork"]
                    if any(kw in cuisine_str.lower() for kw in non_veg_keywords):
                        continue

                maps_link = r.get("maps_url", f"https://www.google.com/maps/search/{name.replace(' ', '+')}+{city}")
                zomato_link = f"https://www.zomato.com/search?q={name.replace(' ', '+')}+{city_lower.replace(' ', '+')}"

                restaurants.append(MealOption(
                    restaurant_name=name,
                    cuisine=cuisine_str.replace(";", ", ").title() or "Local",
                    rating=4.0,  # OSM does not provide ratings; use neutral 4.0
                    avg_cost_for_two=estimated_cost,
                    google_maps_link=maps_link,
                    deep_link=zomato_link
                ))

            if len(restaurants) >= 2:
                logger.info(f"Found {len(restaurants)} restaurants via Overpass API")
                return restaurants[:5]
    except Exception as e:
        logger.warning(f"Overpass restaurant search failed: {e}. Using curated city list.")

    # 2. Curated city specialties fallback
    logger.info(f"Using curated restaurant list for {city}")
    selected = None
    for c, items in CITY_SPECIALTIES.items():
        if c in city_lower or city_lower in c:
            selected = items
            break

    if not selected:
        selected = DEFAULT_RESTAURANTS

    restaurants = []
    for item in selected:
        # Apply diet filter
        if diet_type == "Vegetarian" and any(
            kw in item["cuisine"].lower() for kw in ["non-veg", "seafood", "fish", "chicken", "meat"]
        ):
            continue

        # Apply budget filter (soft)
        if (item["cost"] / 2.0) > max_meal_budget * 1.5:
            continue

        zomato_link = f"https://www.zomato.com/search?q={item['name'].replace(' ', '+')}+{city_lower.replace(' ', '+')}"
        maps_link = f"https://www.google.com/maps/search/{item['name'].replace(' ', '+')}+{city}"

        restaurants.append(MealOption(
            restaurant_name=item["name"],
            cuisine=item["cuisine"],
            rating=item["rating"],
            avg_cost_for_two=item["cost"],
            google_maps_link=maps_link,
            deep_link=zomato_link
        ))

    return restaurants[:5] if restaurants else _get_default_meals(city, cuisines, max_meal_budget)


def _estimate_cost_for_two(cuisine_str: str, city_lower: str) -> float:
    """Estimate cost for two people based on cuisine type and city tier."""
    cuisine_lower = cuisine_str.lower()
    
    # Premium cuisines
    if any(kw in cuisine_lower for kw in ["continental", "italian", "french", "japanese", "chinese"]):
        base = 1200.0
    elif any(kw in cuisine_lower for kw in ["mughlai", "kebab", "biryani", "indian"]):
        base = 600.0
    elif any(kw in cuisine_lower for kw in ["south indian", "udupi", "idli", "dosa"]):
        base = 250.0
    elif any(kw in cuisine_lower for kw in ["fast food", "street food", "snack", "cafe"]):
        base = 300.0
    else:
        base = 500.0

    # City tier multiplier
    metro_cities = ["mumbai", "delhi", "bengaluru", "bangalore", "hyderabad", "chennai", "kolkata"]
    if any(m in city_lower for m in metro_cities):
        return base * 1.3
    return base


def _get_default_meals(city: str, cuisines: List[str], max_budget: float) -> List[MealOption]:
    """Last-resort fallback: return generic meal options."""
    city_lower = city.lower().replace(' ', '+')
    return [
        MealOption(
            restaurant_name="Local Dhaba",
            cuisine="North Indian, Thali",
            rating=4.0,
            avg_cost_for_two=300.0,
            google_maps_link=f"https://www.google.com/maps/search/dhaba+{city}",
            deep_link=f"https://www.zomato.com/search?q=dhaba+in+{city_lower}"
        ),
        MealOption(
            restaurant_name="City Udupi Restaurant",
            cuisine="South Indian Vegetarian",
            rating=4.1,
            avg_cost_for_two=200.0,
            google_maps_link=f"https://www.google.com/maps/search/udupi+restaurant+{city}",
            deep_link=f"https://www.zomato.com/search?q=udupi+restaurant+in+{city_lower}"
        ),
    ]
