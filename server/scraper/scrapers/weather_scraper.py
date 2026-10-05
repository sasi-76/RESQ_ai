"""
IMD Weather Warning & Cyclone Bulletin Scraper
Sources: India Meteorological Department (mausam.imd.gov.in)
"""

import time
import re
import logging
from datetime import datetime, timezone

from scrapers.fetch_utils import resilient_fetch, with_retry

logger = logging.getLogger(__name__)

# -- Cache --------------------------------------------------------------------

_warnings_cache = {"data": [], "ts": 0}
_cyclone_cache = {"data": [], "ts": 0}
WARNINGS_TTL = 900   # 15 minutes
CYCLONE_TTL = 900    # 15 minutes

TN_DISTRICTS = [
    "chennai", "coimbatore", "cuddalore", "dharmapuri", "dindigul", "erode",
    "kanchipuram", "kanyakumari", "karur", "krishnagiri", "madurai",
    "nagapattinam", "namakkal", "nilgiris", "perambalur", "pudukkottai",
    "ramanathapuram", "salem", "sivaganga", "thanjavur", "theni",
    "thoothukudi", "tiruchirappalli", "tirunelveli", "tiruppur",
    "tiruvallur", "tiruvannamalai", "tiruvarur", "vellore", "viluppuram",
    "virudhunagar", "chengalpattu", "kallakurichi", "ranipet",
    "tenkasi", "tirupattur", "ariyalur", "mayiladuthurai",
]

SEVERITY_MAP = {
    "red": "critical",
    "orange": "high",
    "yellow": "moderate",
    "green": "low",
}

# -- Weather Warnings ---------------------------------------------------------

@with_retry
def scrape_weather_warnings() -> list[dict]:
    now = time.time()
    if _warnings_cache["data"] and (now - _warnings_cache["ts"]) < WARNINGS_TTL:
        logger.info("[WeatherScraper] Returning cached warnings (%d items)", len(_warnings_cache["data"]))
        return _warnings_cache["data"]

    warnings = []

    # Source 1: IMD district-level warnings page
    try:
        warnings.extend(_scrape_imd_warnings())
    except Exception as e:
        logger.error("[WeatherScraper] IMD warnings scrape failed: %s", e)

    # Source 2: IMD rainfall information
    try:
        warnings.extend(_scrape_imd_rainfall())
    except Exception as e:
        logger.error("[WeatherScraper] IMD rainfall scrape failed: %s", e)

    _warnings_cache["data"] = warnings
    _warnings_cache["ts"] = now
    logger.info("[WeatherScraper] Scraped %d weather warnings", len(warnings))
    return warnings


def _scrape_imd_warnings() -> list[dict]:
    results = []
    url = "https://mausam.imd.gov.in/responsive/wardisplay.php"
    logger.info("[WeatherScraper] Fetching IMD warnings: %s", url)

    page = resilient_fetch(url)
    if not page:
        return results

    # IMD warning page has tables with color-coded warning rows
    rows = page.css("table tr")
    for row in rows:
        cells = row.css("td")
        if len(cells) < 3:
            continue

        row_text = " ".join(c.text.strip() for c in cells).lower()

        # Check if this row mentions any Tamil Nadu district
        matched_district = None
        for dist in TN_DISTRICTS:
            if dist in row_text:
                matched_district = dist.title()
                break

        if not matched_district:
            if "tamil nadu" not in row_text and "tamilnadu" not in row_text:
                continue
            matched_district = "Tamil Nadu"

        # Determine severity from color attributes or text
        severity = "moderate"
        style = row.attrib.get("style", "") + row.attrib.get("class", "")
        for color_key, sev in SEVERITY_MAP.items():
            if color_key in style.lower() or color_key in row_text:
                severity = sev
                break

        # Determine warning type from content
        warning_type = _classify_warning(row_text)

        message_parts = [c.text.strip() for c in cells if c.text.strip()]
        message = " | ".join(message_parts)

        # Parse dates if present
        valid_from, valid_until = _extract_dates(row_text)

        results.append({
            "type": warning_type,
            "severity": severity,
            "district": matched_district,
            "message": message[:500],
            "validFrom": valid_from,
            "validUntil": valid_until,
            "source": "IMD Warning Bulletin",
            "scrapedAt": datetime.now(timezone.utc).isoformat(),
        })

    return results


def _scrape_imd_rainfall() -> list[dict]:
    results = []
    url = "https://mausam.imd.gov.in/responsive/rainfallinformation.php"
    logger.info("[WeatherScraper] Fetching IMD rainfall: %s", url)

    page = resilient_fetch(url)
    if not page:
        return results

    rows = page.css("table tr")
    for row in rows:
        cells = row.css("td")
        if len(cells) < 2:
            continue

        row_text = " ".join(c.text.strip() for c in cells).lower()

        is_tn = False
        matched_district = "Tamil Nadu"
        for dist in TN_DISTRICTS:
            if dist in row_text:
                is_tn = True
                matched_district = dist.title()
                break
        if not is_tn and "tamil nadu" not in row_text:
            continue

        # Try to extract rainfall amount
        rainfall_mm = _extract_number(row_text, r"(\d+\.?\d*)\s*mm")

        if rainfall_mm is not None and rainfall_mm > 30:
            severity = "critical" if rainfall_mm > 100 else "high" if rainfall_mm > 64 else "moderate"
            message_parts = [c.text.strip() for c in cells if c.text.strip()]

            results.append({
                "type": "heavy_rainfall",
                "severity": severity,
                "district": matched_district,
                "message": f"Rainfall: {rainfall_mm}mm recorded. " + " | ".join(message_parts)[:400],
                "validFrom": datetime.now(timezone.utc).isoformat(),
                "validUntil": None,
                "source": "IMD Rainfall Bulletin",
                "rainfallMm": rainfall_mm,
                "scrapedAt": datetime.now(timezone.utc).isoformat(),
            })

    return results


# -- Cyclone Bulletins --------------------------------------------------------

@with_retry
def scrape_cyclone_bulletins() -> list[dict]:
    now = time.time()
    if _cyclone_cache["data"] and (now - _cyclone_cache["ts"]) < CYCLONE_TTL:
        logger.info("[WeatherScraper] Returning cached cyclone data (%d items)", len(_cyclone_cache["data"]))
        return _cyclone_cache["data"]

    cyclones = []

    try:
        cyclones.extend(_scrape_imd_cyclones())
    except Exception as e:
        logger.error("[WeatherScraper] IMD cyclone scrape failed: %s", e)

    _cyclone_cache["data"] = cyclones
    _cyclone_cache["ts"] = now
    logger.info("[WeatherScraper] Scraped %d cyclone bulletins", len(cyclones))
    return cyclones


def _scrape_imd_cyclones() -> list[dict]:
    results = []
    url = "https://mausam.imd.gov.in/responsive/cycloneinformation.php"
    logger.info("[WeatherScraper] Fetching IMD cyclone info: %s", url)

    page = resilient_fetch(url)
    if not page:
        return results

    html = page.html_content.lower()

    # Check if there's "no current cyclone" type message
    no_cyclone_phrases = ["no current cyclone", "no active cyclone", "nil", "no tropical"]
    if any(phrase in html for phrase in no_cyclone_phrases):
        logger.info("[WeatherScraper] No active cyclones reported by IMD")
        return results

    # Parse cyclone bulletins - IMD uses structured text/table blocks
    # Use broad structural selectors that are stable across redesigns
    content_blocks = page.css("div[class*='content'], div[class*='bulletin'], #content, .main-content, main")
    if not content_blocks:
        content_blocks = page.css("table")

    for block in content_blocks:
        text = block.text.strip()
        if len(text) < 50:
            continue

        cyclone = _parse_cyclone_text(text)
        if cyclone:
            results.append(cyclone)

    # Also try parsing from paragraph text on the page
    paragraphs = page.css("p")
    full_text = " ".join(p.text.strip() for p in paragraphs)
    if len(full_text) > 100:
        cyclone = _parse_cyclone_text(full_text)
        if cyclone and cyclone not in results:
            results.append(cyclone)

    return results


def _parse_cyclone_text(text: str) -> dict | None:
    text_lower = text.lower()

    # Must contain cyclone-related keywords
    keywords = ["cyclone", "cyclonic storm", "depression", "deep depression", "severe", "typhoon"]
    if not any(kw in text_lower for kw in keywords):
        return None

    # Extract name (usually capitalized, after "cyclone" or in quotes)
    name_match = re.search(r'(?:cyclone|cyclonic storm)\s+["\']?([A-Z][a-z]+)', text)
    name = name_match.group(1) if name_match else "Unnamed System"

    # Extract category
    category = "Depression"
    if "super cyclonic" in text_lower:
        category = "Super Cyclonic Storm"
    elif "very severe" in text_lower:
        category = "Very Severe Cyclonic Storm"
    elif "severe cyclonic" in text_lower:
        category = "Severe Cyclonic Storm"
    elif "cyclonic storm" in text_lower:
        category = "Cyclonic Storm"
    elif "deep depression" in text_lower:
        category = "Deep Depression"

    # Extract coordinates
    lat = _extract_number(text, r"(\d+\.?\d*)\s*°?\s*[nN]")
    lng = _extract_number(text, r"(\d+\.?\d*)\s*°?\s*[eE]")

    # Extract wind speed
    wind_speed = _extract_number(text, r"(\d+)\s*(?:km/?h|kmph|knots)")

    # Extract movement/forecast text
    movement = ""
    for pattern in [r"mov(?:ing|ement)\s+(.{20,80}?)[\.\n]", r"likely to\s+(.{20,80}?)[\.\n]"]:
        m = re.search(pattern, text_lower)
        if m:
            movement = m.group(1).strip()
            break

    forecast_match = re.search(r"(?:forecast|expected|likely)\s*:?\s*(.{30,200}?)[\.\n]", text_lower)
    forecast = forecast_match.group(1).strip() if forecast_match else ""

    # Only return if we have at least coordinates or wind data — real signal
    if lat is None and lng is None and wind_speed is None:
        return None

    return {
        "name": name,
        "category": category,
        "lat": lat,
        "lng": lng,
        "windSpeed": wind_speed,
        "movement": movement[:200],
        "forecast": forecast[:300],
        "source": "IMD Cyclone Bulletin",
        "scrapedAt": datetime.now(timezone.utc).isoformat(),
    }


# -- Helpers ------------------------------------------------------------------

def _classify_warning(text: str) -> str:
    text = text.lower()
    if any(w in text for w in ["rain", "rainfall", "precipitation", "downpour"]):
        return "heavy_rainfall"
    if any(w in text for w in ["cyclone", "cyclonic", "storm"]):
        return "cyclone"
    if any(w in text for w in ["flood", "inundation", "deluge"]):
        return "flood"
    if any(w in text for w in ["thunder", "lightning", "thunderstorm"]):
        return "thunderstorm"
    if any(w in text for w in ["heat", "heatwave", "hot"]):
        return "heatwave"
    if any(w in text for w in ["wind", "gale", "squally"]):
        return "strong_wind"
    return "weather_warning"


def _extract_dates(text: str) -> tuple[str | None, str | None]:
    date_pattern = r"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})"
    matches = re.findall(date_pattern, text)
    valid_from = matches[0] if len(matches) > 0 else None
    valid_until = matches[1] if len(matches) > 1 else None
    return valid_from, valid_until


def _extract_number(text: str, pattern: str) -> float | None:
    m = re.search(pattern, text)
    if m:
        try:
            return float(m.group(1))
        except ValueError:
            pass
    return None
