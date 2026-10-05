"""
Disaster News Scraper — Tamil Nadu
Sources: Google News RSS, Times of India, The Hindu
Uses RSS feeds where possible (stable), HTML scraping as supplement.
"""

import time
import logging
import xml.etree.ElementTree as ET
from datetime import datetime

from scrapers.fetch_utils import resilient_fetch, with_retry

logger = logging.getLogger(__name__)

_news_cache = {}
NEWS_CACHE_TTL = 1800

DISASTER_QUERIES = [
    "Tamil Nadu flood",
    "Tamil Nadu cyclone",
    "Tamil Nadu earthquake",
    "Tamil Nadu disaster",
    "Tamil Nadu rain warning",
    "Chennai flood",
    "Tamil Nadu NDRF",
]

DISASTER_KEYWORDS = [
    "flood", "rain", "cyclone", "earthquake", "disaster", "rescue",
    "warning", "alert", "storm", "damage", "relief", "NDRF",
    "evacuation", "water", "dam", "submerge", "inundate",
]


def _parse_rss_date(date_str):
    if not date_str:
        return datetime.utcnow().isoformat() + "Z"
    formats = [
        "%a, %d %b %Y %H:%M:%S %Z",
        "%a, %d %b %Y %H:%M:%S %z",
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%dT%H:%M:%SZ",
        "%d %b %Y %H:%M:%S",
    ]
    for fmt in formats:
        try:
            return datetime.strptime(date_str.strip(), fmt).isoformat() + "Z"
        except (ValueError, TypeError):
            continue
    return date_str


def _fetch_google_news_rss(query):
    """Fetch news via Google News RSS feed — stable, no fragile CSS selectors."""
    articles = []
    encoded = query.replace(" ", "+")
    url = f"https://news.google.com/rss/search?q={encoded}&hl=en-IN&gl=IN&ceid=IN:en"

    page = resilient_fetch(url, max_retries=2)
    if not page:
        logger.warning("Google News RSS unavailable for '%s'", query)
        return articles

    try:
        root = ET.fromstring(page.body.decode("utf-8", errors="replace"))

        for item in root.iter("item"):
            title_el = item.find("title")
            link_el = item.find("link")
            pub_el = item.find("pubDate")
            desc_el = item.find("description")
            source_el = item.find("source")

            title = title_el.text.strip() if title_el is not None and title_el.text else ""
            if not title:
                continue

            link = link_el.text.strip() if link_el is not None and link_el.text else ""
            pub_date = _parse_rss_date(pub_el.text if pub_el is not None else None)
            summary = ""
            if desc_el is not None and desc_el.text:
                import re as _re
                summary = _re.sub(r'<[^>]+>', '', desc_el.text).strip()[:300]
            source = source_el.text.strip() if source_el is not None and source_el.text else "Google News"

            articles.append({
                "title": title,
                "summary": summary,
                "url": link,
                "publishedAt": pub_date,
                "source": source,
                "query": query,
            })

        logger.info("Google News RSS: %d articles for '%s'", len(articles), query)
    except ET.ParseError as e:
        logger.warning("RSS parse error for '%s': %s", query, e)
    except Exception as e:
        logger.warning("Google News fetch failed for '%s': %s", query, e)

    return articles


def _scrape_times_of_india():
    """Scrape TOI Chennai section for disaster-related headlines."""
    articles = []

    page = resilient_fetch("https://timesofindia.indiatimes.com/city/chennai")
    if not page:
        return articles

    # TOI article links contain /articleshow/ — this is a stable URL pattern
    links = page.css("a[href*='/articleshow/']")
    seen = set()
    for link in links[:30]:
        title = link.text.strip() if link.text else ""
        href = link.attrib.get("href", "")
        if not title or len(title) < 15 or title in seen:
            continue
        if any(kw in title.lower() for kw in DISASTER_KEYWORDS):
            seen.add(title)
            full_url = href if href.startswith("http") else f"https://timesofindia.indiatimes.com{href}"
            articles.append({
                "title": title,
                "summary": "",
                "url": full_url,
                "publishedAt": datetime.utcnow().isoformat() + "Z",
                "source": "Times of India",
                "query": "TOI Chennai disaster",
            })
    logger.info("TOI: %d disaster-related articles", len(articles))

    return articles


def _scrape_the_hindu():
    """Scrape The Hindu TN section for disaster-related headlines."""
    articles = []

    page = resilient_fetch("https://www.thehindu.com/news/national/tamil-nadu/")
    if not page:
        return articles

    # The Hindu article links contain /article — stable URL pattern
    links = page.css("a[href*='/article']")
    seen = set()
    for link in links[:30]:
        title = link.text.strip() if link.text else ""
        href = link.attrib.get("href", "")
        if not title or len(title) < 15 or title in seen:
            continue
        if any(kw in title.lower() for kw in DISASTER_KEYWORDS):
            seen.add(title)
            full_url = href if href.startswith("http") else f"https://www.thehindu.com{href}"
            articles.append({
                "title": title,
                "summary": "",
                "url": full_url,
                "publishedAt": datetime.utcnow().isoformat() + "Z",
                "source": "The Hindu",
                "query": "The Hindu TN disaster",
            })
    logger.info("The Hindu: %d disaster-related articles", len(articles))

    return articles


@with_retry
def scrape_disaster_news(query="Tamil Nadu disaster"):
    cache_key = query.lower().strip()
    now = time.time()
    if cache_key in _news_cache and (now - _news_cache[cache_key]["ts"]) < NEWS_CACHE_TTL:
        logger.info("Returning cached news for '%s'", query)
        return _news_cache[cache_key]["data"]

    all_articles = []

    # Primary source: Google News RSS (stable, structured)
    for q in DISASTER_QUERIES:
        articles = _fetch_google_news_rss(q)
        all_articles.extend(articles)

    # Supplementary: newspaper HTML scraping (uses stable URL-pattern selectors)
    try:
        all_articles.extend(_scrape_times_of_india())
    except Exception as e:
        logger.warning("TOI scrape failed: %s", e)

    try:
        all_articles.extend(_scrape_the_hindu())
    except Exception as e:
        logger.warning("The Hindu scrape failed: %s", e)

    # Deduplicate by title
    seen_titles = set()
    unique = []
    for a in all_articles:
        title_lower = a["title"].lower().strip()
        if title_lower not in seen_titles:
            seen_titles.add(title_lower)
            unique.append(a)

    unique.sort(key=lambda x: x.get("publishedAt", ""), reverse=True)
    unique = unique[:20]

    _news_cache[cache_key] = {"data": unique, "ts": now}
    logger.info("News data ready: %d unique articles", len(unique))
    return unique
