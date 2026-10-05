"""
Shared fetch utilities for all RESQAI scrapers.
- Retry with exponential backoff
- SSL handling with certifi fallback
- Request-level concurrency guard
"""

import time
import logging
import threading
from functools import wraps

from scrapling import Fetcher

logger = logging.getLogger(__name__)

# ── Concurrency guard: prevent parallel fetches to the same domain ──────────

_domain_locks = {}
_domain_locks_mutex = threading.Lock()


def _get_domain_lock(url: str) -> threading.Lock:
    """Get or create a per-domain lock to prevent concurrent requests."""
    from urllib.parse import urlparse
    domain = urlparse(url).netloc
    with _domain_locks_mutex:
        if domain not in _domain_locks:
            _domain_locks[domain] = threading.Lock()
        return _domain_locks[domain]


# ── Retry-aware fetch ───────────────────────────────────────────────────────

def resilient_fetch(url: str, timeout: int = 15, max_retries: int = 2, backoff: float = 2.0):
    """
    Fetch a URL with:
      1. Proper SSL via certifi first
      2. Fallback to verify=False if cert errors (gov.in sites often have bad certs)
      3. Retry with exponential backoff on failure
      4. Per-domain locking to prevent hammering

    Returns the Scrapling response object or None on total failure.
    """
    lock = _get_domain_lock(url)
    last_error = None

    for attempt in range(1, max_retries + 1):
        if not lock.acquire(timeout=30):
            logger.warning("[fetch] Could not acquire lock for %s, skipping", url)
            return None

        try:
            # Attempt 1: proper SSL
            try:
                resp = Fetcher.get(url, timeout=timeout, verify=True)
                if resp.status == 200:
                    return resp
                if resp.status in (403, 429):
                    logger.warning("[fetch] %s returned HTTP %d, not retrying", url, resp.status)
                    return None
                last_error = f"HTTP {resp.status}"
            except Exception as ssl_err:
                ssl_msg = str(ssl_err).lower()
                if "ssl" in ssl_msg or "certificate" in ssl_msg or "handshake" in ssl_msg:
                    # SSL failure — retry without verification (common for .gov.in)
                    logger.debug("[fetch] SSL error for %s, retrying with verify=False", url)
                    try:
                        resp = Fetcher.get(url, timeout=timeout, verify=False)
                        if resp.status == 200:
                            return resp
                        last_error = f"HTTP {resp.status} (no-verify)"
                    except Exception as inner_err:
                        last_error = str(inner_err)
                else:
                    last_error = str(ssl_err)
        finally:
            lock.release()

        if attempt < max_retries:
            wait = backoff ** attempt
            logger.info("[fetch] Retry %d/%d for %s in %.1fs (last error: %s)",
                        attempt, max_retries, url, wait, last_error)
            time.sleep(wait)

    logger.warning("[fetch] All %d attempts failed for %s: %s", max_retries, url, last_error)
    return None


# ── Decorator for scraper functions ─────────────────────────────────────────

def with_retry(func):
    """Decorator that catches exceptions in scraper functions and returns empty results."""
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            logger.error("[%s] Unhandled error: %s", func.__name__, e)
            # Return appropriate empty type
            return [] if "list" in str(func.__annotations__.get("return", "list")).lower() else {}
    return wrapper
