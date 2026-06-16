import os
import logging
import asyncio
from datetime import date
from typing import List, Optional
import httpx
from dotenv import load_dotenv
from backend.models.itinerary import HotelOption
from backend.services.maps import search_places_overpass, geocode_city
from backend.services.search_engine import search_booking_link_async


# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

# NOTE: RapidAPI Hotels is a paid service.
# We use Overpass API (OpenStreetMap) as a free primary source,
# with a curated fallback based on hotel category per city.

# OSM hotel type tags to query
OSM_HOTEL_TAGS = {
    "5-star": [("tourism", "hotel")],
    "4-star": [("tourism", "hotel")],
    "3-star": [("tourism", "hotel"), ("tourism", "motel")],
    "Budget Hotel (1-2 star)": [("tourism", "hotel"), ("tourism", "motel"), ("tourism", "guest_house")],
    "Homestay": [("tourism", "guest_house"), ("tourism", "chalet")],
    "Hostel": [("tourism", "hostel")],
    "PG": [("tourism", "hostel"), ("amenity", "student_accommodation")],
    "Co-living": [("tourism", "hostel"), ("tourism", "guest_house")],
    "Lodge": [("tourism", "guest_house"), ("tourism", "motel")],
}

# Price per night estimates (INR) based on stay type
PRICE_PER_NIGHT = {
    "PG": 550.0,
    "Co-living": 850.0,
    "Hostel": 700.0,
    "Lodge": 1000.0,
    "Budget Hotel (1-2 star)": 1400.0,
    "3-star": 2500.0,
    "4-star": 5000.0,
    "5-star": 10000.0,
    "Homestay": 1800.0,
}

# Curated hotel names by stay type
CURATED_HOTEL_NAMES = {
    "PG": ["Sai Balaji PG Accommodation", "Zolo Stay Comfort", "Stanza Living Premium"],
    "Co-living": ["Zolo Stay Signature", "Union Co-living", "Cove Co-living Hub"],
    "Hostel": ["Zostel", "The Hosteller", "goSTOPS Hostel"],
    "Lodge": ["Tourist Lodge", "Balaji Guest House", "Shyam Sunder Lodge"],
    "Budget Hotel (1-2 star)": ["Hotel Landmark", "Hotel Park View", "Shree Residency Inn"],
    "3-star": ["Hotel Central Park", "Ginger Hotel", "Keys Select Hotel"],
    "4-star": ["Lemon Tree Premier", "Radisson Hotel", "Novotel Hotel"],
    "5-star": ["The Taj Palace", "The Oberoi Grand", "ITC Grand Hotel"],
    "Homestay": ["SaffronStays Cottage", "Vista Rooms Villa", "Rosewood Homestay"],
}

# City-specific popular hotels by stay type
CITY_HOTELS = {
    "delhi": {
        "5-star": [
            {"name": "The Leela Palace New Delhi", "area": "Chanakyapuri", "rating": 4.8, "price": 22000.0},
            {"name": "The Taj Mahal Hotel", "area": "Mansingh Road", "rating": 4.7, "price": 18000.0},
            {"name": "The Oberoi New Delhi", "area": "Dr. Zakir Hussain Road", "rating": 4.8, "price": 20000.0},
        ],
        "4-star": [
            {"name": "Radisson Blu Plaza Hotel", "area": "Mahipalpur", "rating": 4.3, "price": 5500.0},
            {"name": "Lemon Tree Premier", "area": "Aerocity", "rating": 4.2, "price": 4500.0},
        ],
        "3-star": [
            {"name": "Ginger Hotel Delhi Airport", "area": "Aerocity", "rating": 4.0, "price": 2800.0},
            {"name": "Keys Select Hotel", "area": "Kaushambi", "rating": 3.9, "price": 2500.0},
        ],
        "Hostel": [
            {"name": "Zostel Delhi", "area": "Paharganj", "rating": 4.3, "price": 700.0},
            {"name": "The Hosteller Hauz Khas", "area": "Hauz Khas", "rating": 4.5, "price": 900.0},
        ],
    },
    "mumbai": {
        "5-star": [
            {"name": "The Taj Mahal Palace", "area": "Colaba", "rating": 4.8, "price": 25000.0},
            {"name": "The Oberoi Mumbai", "area": "Nariman Point", "rating": 4.7, "price": 20000.0},
        ],
        "3-star": [
            {"name": "Hotel Residency Fort", "area": "Fort", "rating": 4.0, "price": 3000.0},
            {"name": "Ginger Hotel Mumbai Airport", "area": "Vile Parle", "rating": 3.9, "price": 2800.0},
        ],
        "Hostel": [
            {"name": "Zostel Mumbai", "area": "Colaba", "rating": 4.4, "price": 750.0},
        ],
    },
    "goa": {
        "5-star": [
            {"name": "Taj Exotica Resort & Spa", "area": "Benaulim South Goa", "rating": 4.7, "price": 20000.0},
            {"name": "The Leela Goa", "area": "Cavelossim", "rating": 4.8, "price": 22000.0},
        ],
        "Homestay": [
            {"name": "SaffronStays Casa De Goa", "area": "Assagao North Goa", "rating": 4.6, "price": 4000.0},
            {"name": "Old Portuguese Villa", "area": "Panjim", "rating": 4.5, "price": 3500.0},
        ],
        "Hostel": [
            {"name": "Zostel Goa", "area": "Candolim", "rating": 4.5, "price": 800.0},
            {"name": "The Hosteller Goa", "area": "Anjuna", "rating": 4.4, "price": 900.0},
        ],
    },
    "jaipur": {
        "5-star": [
            {"name": "Rambagh Palace (Taj)", "area": "Bhawani Singh Road", "rating": 4.8, "price": 28000.0},
            {"name": "Samode Palace", "area": "Gangapole", "rating": 4.7, "price": 20000.0},
        ],
        "Homestay": [
            {"name": "Dera Mandawa Haveli", "area": "Sansar Chandra Road", "rating": 4.5, "price": 3000.0},
        ],
    },
}


async def search_hotels(
    city: str,
    checkin_date: date,
    checkout_date: date,
    stay_type: str,
    amenities: List[str],
    max_price_inr: float
) -> List[HotelOption]:
    """
    Searches for hotels matching parameters.
    Fallback chain:
      1. City-specific curated list (best data quality)
      2. Overpass API (OpenStreetMap) real hotel data (free, no key)
      3. Generated fallback based on stay type
    """
    days = max((checkout_date - checkin_date).days, 1)
    city_lower = city.lower().strip()
    price_per_night = PRICE_PER_NIGHT.get(stay_type, 2000.0)
    selected_hotels = []

    # 1. Try curated city-specific hotel data (highest quality)
    city_data = None
    for c, data in CITY_HOTELS.items():
        if c in city_lower or city_lower in c:
            city_data = data
            break

    if city_data and stay_type in city_data:
        logger.info(f"Using curated hotel list for {city} / {stay_type}")
        hotels = []
        for idx, h in enumerate(city_data[stay_type]):
            pricepn = h["price"]
            total = pricepn * days
            if total > max_price_inr * 1.2:  # allow 20% over budget
                continue
            hotels.append(HotelOption(
                id=f"hotel_curated_{city_lower[:3]}_{idx}",
                name=h["name"],
                type=stay_type,
                rating=h["rating"],
                price_per_night_inr=pricepn,
                total_price_inr=total,
                amenities=amenities or _default_amenities(stay_type),
                booking_link=_make_booking_link(h["name"], city, checkin_date, checkout_date),
                location=f"{h['area']}, {city}"
            ))
        if hotels:
            selected_hotels = hotels[:3]

    # 2. Try Overpass API (OpenStreetMap) — completely free, no API key required
    if not selected_hotels:
        try:
            logger.info(f"Searching hotels in {city} via Overpass API (OpenStreetMap)")
            coords = await geocode_city(city)
            lat, lng = coords["lat"], coords["lng"]

            tags_to_try = OSM_HOTEL_TAGS.get(stay_type, [("tourism", "hotel")])
            osm_results = []
            for key, val in tags_to_try:
                results = await search_places_overpass(
                    f"{key}={val}", city, lat, lng, radius_m=5000, limit=8
                )
                osm_results.extend(results)
                if len(osm_results) >= 5:
                    break

            if osm_results:
                hotels = []
                seen_names = set()
                for idx, r in enumerate(osm_results):
                    name = r.get("name", "")
                    if not name or name in seen_names:
                        continue
                    seen_names.add(name)

                    total = price_per_night * days
                    if total > max_price_inr * 1.2:
                        continue

                    maps_url = r.get("maps_url", f"https://www.google.com/maps/search/{name.replace(' ', '+')}+{city}")

                    hotels.append(HotelOption(
                        id=f"hotel_osm_{idx}",
                        name=name,
                        type=stay_type,
                        rating=4.1 + (idx * 0.1 % 0.5),  # OSM has no ratings; use reasonable defaults
                        price_per_night_inr=price_per_night,
                        total_price_inr=total,
                        amenities=amenities or _default_amenities(stay_type),
                        booking_link=_make_booking_link(name, city, checkin_date, checkout_date),
                        location=r.get("address") or city
                    ))

                if len(hotels) >= 2:
                    logger.info(f"Found {len(hotels)} hotels via Overpass API")
                    selected_hotels = hotels[:3]
        except Exception as e:
            logger.warning(f"Overpass hotel search failed: {e}. Using generated fallback.")

    # 3. Generated fallback based on hotel type
    if not selected_hotels:
        logger.info(f"Generating fallback hotels for {city} / {stay_type}")
        names = CURATED_HOTEL_NAMES.get(stay_type, ["The Comfort Inn", "Sunrise Plaza", "Grand Royale"])
        total_price = price_per_night * days

        hotels = []
        for idx, name in enumerate(names[:3]):
            if total_price > max_price_inr * 1.5:
                continue
            hotels.append(HotelOption(
                id=f"hotel_fallback_{idx}",
                name=f"{name} — {city}",
                type=stay_type,
                rating=round(4.1 + (idx * 0.15), 1),
                price_per_night_inr=price_per_night,
                total_price_inr=total_price,
                amenities=amenities or _default_amenities(stay_type),
                booking_link=_make_booking_link(name, city, checkin_date, checkout_date),
                location=f"Central Area, {city}"
            ))
        selected_hotels = hotels

    # Resolve direct booking links asynchronously using web search
    search_tasks = []
    for h in selected_hotels:
        q = f"{h.name} {city} hotel booking checkin {checkin_date} booking.com agoda"
        search_tasks.append(search_booking_link_async(q, "hotel", h.booking_link))

    if search_tasks:
        resolved_links = await asyncio.gather(*search_tasks)
        for h, link in zip(selected_hotels, resolved_links):
            h.booking_link = link

    return selected_hotels



def _default_amenities(stay_type: str) -> List[str]:
    """Return sensible default amenities for a stay type."""
    base = ["WiFi"]
    extras = {
        "5-star": ["AC", "Pool", "Spa", "Restaurant", "Gym", "Concierge", "Room Service"],
        "4-star": ["AC", "Pool", "Restaurant", "Gym", "Room Service"],
        "3-star": ["AC", "Restaurant", "Parking"],
        "Budget Hotel (1-2 star)": ["AC", "Hot Water"],
        "Hostel": ["Locker", "Common Kitchen", "AC"],
        "PG": ["WiFi", "Hot Water", "Laundry"],
        "Co-living": ["AC", "Common Kitchen", "Gym"],
        "Lodge": ["Hot Water", "TV"],
        "Homestay": ["AC", "Home-cooked Meals", "Laundry"],
    }
    return base + extras.get(stay_type, ["AC"])


def _make_booking_link(hotel_name: str, city: str, checkin: date, checkout: date) -> str:
    """Generate a booking link for the hotel."""
    query = f"{hotel_name} {city} hotel booking checkin {checkin} checkout {checkout}"
    return f"https://www.google.com/search?q={query.replace(' ', '+')}"
