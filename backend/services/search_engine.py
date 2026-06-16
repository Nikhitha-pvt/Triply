import logging
import asyncio
from duckduckgo_search import DDGS
from typing import List

logger = logging.getLogger(__name__)

# List of preferred booking domains by category
PREFERRED_DOMAINS = {
    'train': ['redbus.in', 'ixigo.com', 'makemytrip.com', 'railyatri.in', 'goibibo.com', 'confirmtkt.com', 'irctc.co.in'],
    'bus': ['redbus.in', 'abhibus.com', 'makemytrip.com', 'goibibo.com', 'paytm.com'],
    'flight': ['makemytrip.com', 'easemytrip.com', 'yatra.com', 'cleartrip.com', 'ixigo.com', 'goibibo.com', 'skyscanner.co.in', 'google.com/travel/flights'],
    'hotel': ['booking.com', 'agoda.com', 'makemytrip.com', 'goibibo.com', 'yatra.com', 'hostelworld.com', 'zostel.com', 'tajhotels.com', 'oberoihotels.com', 'lemontreehotels.com', 'gingerhotels.com', 'trivago.in'],
}

def search_booking_link(query: str, category: str, fallback_url: str) -> str:
    """
    Performs a DuckDuckGo search for the given query.
    Filters the results to find a direct link on standard booking websites.
    Returns the first matching booking URL, or fallback_url if no matches are found.
    """
    try:
        logger.info(f"Searching for direct booking link: query='{query}', category='{category}'")
        allowed = PREFERRED_DOMAINS.get(category, [])
        
        # Use ddgs to search
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=5))
            
        if not results:
            logger.warning("No search results found from DDGS. Using fallback.")
            return fallback_url
            
        # 1. First pass: look for preferred booking domains
        for r in results:
            url = r.get('href', '')
            if not url:
                continue
            for domain in allowed:
                if domain in url:
                    logger.info(f"Found preferred booking link: {url}")
                    return url
                    
        # 2. Second pass: return the top result url if no preferred domains match but it is a valid url
        if results and results[0].get('href'):
            top_url = results[0]['href']
            # Exclude generic search engine and spam links if possible
            if not any(blocked in top_url for blocked in ['google.com/search', 'bing.com', 'yahoo.com', 'duckduckgo.com']):
                logger.info(f"Using top search result booking link: {top_url}")
                return top_url
                
    except Exception as e:
        logger.error(f"Error searching booking link: {e}")
        
    return fallback_url

async def search_booking_link_async(query: str, category: str, fallback_url: str) -> str:
    """
    Asynchronously runs the synchronous DDGS search in the default executor.
    """
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, search_booking_link, query, category, fallback_url)
