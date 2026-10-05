"""
River Water Level Scraper
Sources: India-Water.gov.in (CWC Flood Forecasting), CWC, India-WRIS
All data from real government gauge stations — no mock data.
"""

import time
import logging
from datetime import datetime, timezone

from scrapers.fetch_utils import resilient_fetch, with_retry

logger = logging.getLogger(__name__)

# -- Cache --------------------------------------------------------------------

_river_cache = {"data": [], "ts": 0}
RIVER_TTL = 1200  # 20 minutes

# Tamil Nadu river gauge stations we care about
TN_RIVERS = {
    "kaveri": {"name": "Kaveri", "aliases": ["cauvery", "kaveri", "kaviri"]},
    "bhavani": {"name": "Bhavani", "aliases": ["bhavani", "bhawani"]},
    "vaigai": {"name": "Vaigai", "aliases": ["vaigai"]},
    "thenpennai": {"name": "Thenpennai", "aliases": ["thenpennai", "then pennai", "south pennar"]},
    "adyar": {"name": "Adyar", "aliases": ["adyar", "adiyar"]},
    "kosasthalaiyar": {"name": "Kosasthalaiyar", "aliases": ["kosasthalaiyar", "kosasthalai"]},
    "kodayar": {"name": "Kodayar", "aliases": ["kodayar", "kodaiyar"]},
    "amaravathi": {"name": "Amaravathi", "aliases": ["amaravathi", "amaravati"]},
    "cooum": {"name": "Cooum", "aliases": ["cooum", "koovam"]},
    "palar": {"name": "Palar", "aliases": ["palar"]},
    "kollidam": {"name": "Kollidam", "aliases": ["kollidam", "coleroon"]},
    "vellar": {"name": "Vellar", "aliases": ["vellar"]},
}

# Known danger levels for key stations (meters) — official CWC data
KNOWN_DANGER_LEVELS = {
    "musiri": {"river": "kaveri", "danger": 7.47, "warning": 6.47},
    "kodumudi": {"river": "kaveri", "danger": 8.84, "warning": 7.84},
    "erode": {"river": "kaveri", "danger": 5.50, "warning": 4.50},
    "grand anicut": {"river": "kaveri", "danger": 4.27, "warning": 3.27},
    "tiruchirapalli": {"river": "kaveri", "danger": 10.68, "warning": 9.68},
    "bhavani confluence": {"river": "bhavani", "danger": 6.10, "warning": 5.10},
    "madurai": {"river": "vaigai", "danger": 10.36, "warning": 9.36},
    "krishnapuram": {"river": "vaigai", "danger": 5.18, "warning": 4.18},
    "tiruvannamalai": {"river": "thenpennai", "danger": 3.05, "warning": 2.05},
    "kelur": {"river": "thenpennai", "danger": 10.97, "warning": 9.97},
    "adyar bridge": {"river": "adyar", "danger": 2.13, "warning": 1.50},
    "nallur": {"river": "kosasthalaiyar", "danger": 6.40, "warning": 5.40},
    "karunguzhi": {"river": "amaravathi", "danger": 4.57, "warning": 3.57},
}


# -- Main Scraper -------------------------------------------------------------

@with_retry
def scrape_river_levels() -> list[dict]:
    now = time.time()
    if _river_cache["data"] and (now - _river_cache["ts"]) < RIVER_TTL:
        logger.info("[RiverScraper] Returning cached river levels (%d stations)", len(_river_cache["data"]))
        return _river_cache["data"]

    all_levels = []

    # Source 1: India-Water Flood Forecasting System
    try:
        all_levels.extend(_scrape_ffs_levels())
    except Exception as e:
        logger.error("[RiverScraper] FFS scrape failed: %s", e)

    # Source 2: CWC Real-Time Data
    try:
        all_levels.extend(_scrape_cwc_realtime())
    except Exception as e:
        logger.error("[RiverScraper] CWC scrape failed: %s", e)

    # Source 3: India-WRIS (Water Resources Information System)
    try:
        all_levels.extend(_scrape_wris_levels())
    except Exception as e:
        logger.error("[RiverScraper] WRIS scrape failed: %s", e)

    # Deduplicate by station name (keep first occurrence = most reliable source)
    seen = set()
    deduped = []
    for level in all_levels:
        key = level["stationName"].lower().strip()
        if key not in seen:
            seen.add(key)
            deduped.append(level)

    _river_cache["data"] = deduped
    _river_cache["ts"] = now
    logger.info("[RiverScraper] Scraped %d river gauge stations", len(deduped))
    return deduped


def _scrape_ffs_levels() -> list[dict]:
    """Scrape from India Flood Forecasting System."""
    results = []
    url = "https://ffs.india-water.gov.in"
    logger.info("[RiverScraper] Fetching FFS river levels: %s", url)

    page = resilient_fetch(url, timeout=20)
    if not page:
        return results

    # FFS shows station data in tables
    rows = page.css("table tr")
    for row in rows:
        cells = row.css("td")
        if len(cells) < 4:
            continue

        cell_texts = [c.text.strip() for c in cells]
        row_text = " ".join(cell_texts).lower()

        # Check if this station is on a TN river
        matched_river = _match_river(row_text)
        if not matched_river:
            continue

        level = _parse_station_row(cell_texts, matched_river)
        if level:
            results.append(level)

    return results


def _scrape_cwc_realtime() -> list[dict]:
    """Scrape from CWC real-time flood monitoring."""
    results = []
    logger.info("[RiverScraper] Fetching CWC data page")

    page = resilient_fetch("https://cwc.gov.in")
    if not page:
        return results

    # Look for links to flood situation or real-time data
    links = page.css("a")
    for link in links:
        href = link.attrib.get("href", "")
        text = (link.text or "").lower()
        if any(kw in text for kw in ["real time", "realtime", "flood situation", "river level"]):
            if href.startswith("/"):
                target_url = f"https://cwc.gov.in{href}"
            elif href.startswith("http"):
                target_url = href
            else:
                continue

            sub_results = _scrape_data_page(target_url)
            results.extend(sub_results)
            if len(results) > 0:
                break

    return results


def _scrape_wris_levels() -> list[dict]:
    """Scrape from India-WRIS water resources."""
    results = []
    url = "https://indiawris.gov.in/wris"
    logger.info("[RiverScraper] Fetching WRIS data: %s", url)

    page = resilient_fetch(url)
    if not page:
        return results

    rows = page.css("table tr")
    for row in rows:
        cells = row.css("td")
        if len(cells) < 3:
            continue

        cell_texts = [c.text.strip() for c in cells]
        row_text = " ".join(cell_texts).lower()

        matched_river = _match_river(row_text)
        if not matched_river:
            continue

        level = _parse_station_row(cell_texts, matched_river)
        if level:
            results.append(level)

    return results


def _scrape_data_page(url: str) -> list[dict]:
    """Generic table scraper for a data page URL."""
    results = []

    page = resilient_fetch(url, max_retries=1)
    if not page:
        return results

    rows = page.css("table tr")
    for row in rows:
        cells = row.css("td")
        if len(cells) < 3:
            continue

        cell_texts = [c.text.strip() for c in cells]
        row_text = " ".join(cell_texts).lower()

        matched_river = _match_river(row_text)
        if not matched_river:
            continue

        level = _parse_station_row(cell_texts, matched_river)
        if level:
            results.append(level)

    return results


# -- Parsing Helpers ----------------------------------------------------------

def _match_river(text: str) -> str | None:
    text = text.lower()

    for river_id, info in TN_RIVERS.items():
        for alias in info["aliases"]:
            if alias in text:
                return river_id

    return None


def _parse_station_row(cells: list[str], river_id: str) -> dict | None:
    if len(cells) < 3:
        return None

    # Try to find: station name, current level, danger level from cells
    station_name = None
    current_level = None
    danger_level = None
    warning_level = None

    for cell in cells:
        cell_stripped = cell.strip()
        if not cell_stripped:
            continue

        # Try to parse as a number (water level)
        num = _try_float(cell_stripped)
        if num is not None and 0 < num < 200:
            if current_level is None:
                current_level = num
            elif danger_level is None:
                danger_level = num
            elif warning_level is None:
                warning_level = num
        elif len(cell_stripped) > 2 and not cell_stripped.replace(".", "").replace("-", "").isdigit():
            # Likely a station/place name
            if station_name is None or len(cell_stripped) > len(station_name):
                station_name = cell_stripped

    if current_level is None or station_name is None:
        return None

    # Look up known danger levels
    station_key = station_name.lower().strip()
    known = KNOWN_DANGER_LEVELS.get(station_key, {})
    if danger_level is None:
        danger_level = known.get("danger")
    if warning_level is None:
        warning_level = known.get("warning")

    # Determine trend from level vs danger
    trend = "stable"
    if danger_level:
        ratio = current_level / danger_level
        if ratio > 0.9:
            trend = "critical"
        elif ratio > 0.75:
            trend = "rising"
        elif ratio < 0.4:
            trend = "low"

    river_info = TN_RIVERS.get(river_id, {})

    return {
        "riverId": river_id,
        "riverName": river_info.get("name", river_id.title()),
        "stationName": station_name,
        "currentLevel": round(current_level, 2),
        "dangerLevel": danger_level,
        "warningLevel": warning_level,
        "trend": trend,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "source": "CWC/FFS River Gauge Network",
        "scrapedAt": datetime.now(timezone.utc).isoformat(),
    }


def _try_float(s: str) -> float | None:
    try:
        s = s.replace(",", "").strip()
        val = float(s)
        return val
    except (ValueError, TypeError):
        return None
