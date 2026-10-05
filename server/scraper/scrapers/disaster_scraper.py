"""
Disaster Alert Scraper
Sources: NDMA (ndma.gov.in), SACHET early warning, TN SDMA

Note: News scraping is handled exclusively by news_scraper.py (RSS-based).
This module focuses only on official government disaster alerts.
"""

import time
import re
import hashlib
import logging
from datetime import datetime, timezone

from scrapers.fetch_utils import resilient_fetch, with_retry

logger = logging.getLogger(__name__)

# -- Cache --------------------------------------------------------------------

_alerts_cache = {"data": [], "ts": 0}
ALERTS_TTL = 600    # 10 minutes

DISASTER_KEYWORDS = ["flood", "cyclone", "earthquake", "tsunami", "landslide", "storm", "rain", "drought"]

TN_GEO_CENTER = {"lat": 11.13, "lng": 78.66}
DISTRICT_COORDS = {
    "chennai": (13.08, 80.27),
    "coimbatore": (11.02, 76.96),
    "madurai": (9.93, 78.12),
    "cuddalore": (11.75, 79.77),
    "tirunelveli": (8.71, 77.76),
    "tiruchirappalli": (10.79, 78.70),
    "salem": (11.66, 78.15),
    "nagapattinam": (10.77, 79.84),
    "ramanathapuram": (9.37, 78.83),
    "thanjavur": (10.79, 79.14),
    "kanyakumari": (8.09, 77.55),
    "vellore": (12.92, 79.13),
    "erode": (11.34, 77.73),
    "theni": (10.01, 77.48),
    "nilgiris": (11.41, 76.69),
    "villupuram": (11.94, 79.49),
    "tiruvannamalai": (12.23, 79.07),
    "chengalpattu": (12.69, 79.98),
}


# -- NDMA Alerts --------------------------------------------------------------

@with_retry
def scrape_ndma_alerts() -> list[dict]:
    now = time.time()
    if _alerts_cache["data"] and (now - _alerts_cache["ts"]) < ALERTS_TTL:
        logger.info("[DisasterScraper] Returning cached NDMA alerts (%d items)", len(_alerts_cache["data"]))
        return _alerts_cache["data"]

    alerts = []

    # Source 1: SACHET early warning system
    try:
        alerts.extend(_scrape_sachet())
    except Exception as e:
        logger.error("[DisasterScraper] SACHET scrape failed: %s", e)

    # Source 2: NDMA main site
    try:
        alerts.extend(_scrape_ndma_main())
    except Exception as e:
        logger.error("[DisasterScraper] NDMA main scrape failed: %s", e)

    # Source 3: TN SDMA
    try:
        alerts.extend(_scrape_tn_sdma())
    except Exception as e:
        logger.error("[DisasterScraper] TN SDMA scrape failed: %s", e)

    # Deduplicate by content hash
    seen = set()
    deduped = []
    for alert in alerts:
        key = hashlib.md5((alert["title"] + alert.get("area", "")).encode()).hexdigest()[:12]
        if key not in seen:
            seen.add(key)
            alert["id"] = f"ndma-{key}"
            deduped.append(alert)

    _alerts_cache["data"] = deduped
    _alerts_cache["ts"] = now
    logger.info("[DisasterScraper] Scraped %d disaster alerts", len(deduped))
    return deduped


def _scrape_sachet() -> list[dict]:
    results = []
    url = "https://sachet.ndma.gov.in"
    logger.info("[DisasterScraper] Fetching SACHET: %s", url)

    page = resilient_fetch(url)
    if not page:
        return results

    # SACHET displays alert cards/list items — use broad structural selectors
    alert_elements = page.css("[class*='alert'], [class*='warning'], [class*='card'], .list-group-item")
    if not alert_elements:
        alert_elements = page.css("table tr")

    for elem in alert_elements:
        text = elem.text.strip()
        if len(text) < 20:
            continue

        text_lower = text.lower()

        # Filter for Tamil Nadu
        is_tn = any(kw in text_lower for kw in [
            "tamil nadu", "tamilnadu", "chennai", "tn coast", "bay of bengal",
        ] + list(DISTRICT_COORDS.keys()))
        if not is_tn:
            continue

        alert = _parse_alert_text(text, "SACHET Early Warning System")
        if alert:
            results.append(alert)

    return results


def _scrape_ndma_main() -> list[dict]:
    results = []
    url = "https://ndma.gov.in"
    logger.info("[DisasterScraper] Fetching NDMA: %s", url)

    page = resilient_fetch(url)
    if not page:
        return results

    # Use broad structural selectors that survive redesigns
    selectors = [
        "[class*='alert']", "[class*='ticker']", "[class*='marquee']",
        "[class*='advisory']", "[class*='warning']", "[class*='news']",
        "[class*='press']", "marquee",
    ]

    for selector in selectors:
        elements = page.css(selector)
        for elem in elements:
            text = elem.text.strip()
            if len(text) < 20:
                continue

            text_lower = text.lower()
            is_tn = any(kw in text_lower for kw in [
                "tamil nadu", "tamilnadu", "chennai",
            ] + list(DISTRICT_COORDS.keys()))
            if not is_tn:
                continue

            alert = _parse_alert_text(text, "NDMA Advisory")
            if alert:
                results.append(alert)

    # Check links for alert-related sub-pages
    links = page.css("a")
    for link in links:
        link_text = (link.text or "").strip().lower()
        href = link.attrib.get("href", "")
        if any(kw in link_text for kw in ["alert", "warning", "advisory", "cyclone", "flood"]):
            if "tamil" in link_text or "chennai" in link_text:
                target = href if href.startswith("http") else f"https://ndma.gov.in{href}"
                sub_page = resilient_fetch(target, timeout=10, max_retries=1)
                if sub_page:
                    sub_text = sub_page.get_all_text() or ""
                    alert = _parse_alert_text(sub_text, "NDMA Advisory")
                    if alert:
                        results.append(alert)

    return results


def _scrape_tn_sdma() -> list[dict]:
    results = []
    url = "https://sdma.tn.gov.in"
    logger.info("[DisasterScraper] Fetching TN SDMA: %s", url)

    page = resilient_fetch(url)
    if not page:
        return results

    # Use broad structural selectors
    all_elements = page.css("[class*='alert'], [class*='warning'], [class*='notice'], [class*='news'], [class*='ticker'], marquee, [class*='panel-body']")
    if not all_elements:
        all_elements = page.css("p, li, td")

    for elem in all_elements:
        text = elem.text.strip()
        if len(text) < 30:
            continue

        text_lower = text.lower()
        has_disaster_keyword = any(kw in text_lower for kw in DISASTER_KEYWORDS)
        if not has_disaster_keyword:
            continue

        alert = _parse_alert_text(text, "TN State Disaster Management Authority")
        if alert:
            results.append(alert)

    return results


# -- Parsing Helpers ----------------------------------------------------------

def _parse_alert_text(text: str, source: str) -> dict | None:
    text = text.strip()
    if len(text) < 30:
        return None

    text_lower = text.lower()

    # Must contain some disaster-related keyword
    has_keyword = any(kw in text_lower for kw in DISASTER_KEYWORDS + ["warning", "alert", "advisory", "evacuation"])
    if not has_keyword:
        return None

    # Classify type
    alert_type = "weather_warning"
    for kw in DISASTER_KEYWORDS:
        if kw in text_lower:
            alert_type = kw
            break

    # Determine severity
    severity = "moderate"
    if any(w in text_lower for w in ["extreme", "very severe", "critical", "red alert", "evacuat"]):
        severity = "critical"
    elif any(w in text_lower for w in ["severe", "high", "orange", "serious", "major"]):
        severity = "high"
    elif any(w in text_lower for w in ["moderate", "yellow", "caution"]):
        severity = "moderate"
    elif any(w in text_lower for w in ["low", "green", "minor", "light"]):
        severity = "low"

    # Extract area / district
    area = "Tamil Nadu"
    for district, coords in DISTRICT_COORDS.items():
        if district in text_lower:
            area = district.title()
            break

    # Get coordinates for the area
    coords = DISTRICT_COORDS.get(area.lower(), (TN_GEO_CENTER["lat"], TN_GEO_CENTER["lng"]))

    # Title: first sentence or first 120 chars
    title = text.split(".")[0].strip()[:120]
    if len(title) < 15:
        title = text[:120]

    description = text[:500]

    # Extract date
    issued_at = datetime.now(timezone.utc).isoformat()
    date_match = re.search(r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', text)
    if date_match:
        issued_at = date_match.group(1)

    return {
        "id": "",  # filled by caller
        "type": alert_type,
        "severity": severity,
        "title": title,
        "description": description,
        "area": area,
        "lat": coords[0],
        "lng": coords[1],
        "issuedAt": issued_at,
        "source": source,
        "scrapedAt": datetime.now(timezone.utc).isoformat(),
    }
