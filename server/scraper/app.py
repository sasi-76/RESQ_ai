import os
import sys
import time
import logging
import asyncio
from datetime import datetime

from flask import Flask, jsonify, request
from flask_cors import CORS

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from scrapers.hospital_scraper import scrape_hospital_data, scrape_blood_bank_availability
from scrapers.news_scraper import scrape_disaster_news

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(name)s] %(levelname)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("ScraperService")

app = Flask(__name__)
CORS(app, origins=[
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:5000",
])


def _safe_import(module_path, func_name):
    try:
        mod = __import__(module_path, fromlist=[func_name])
        return getattr(mod, func_name)
    except (ImportError, AttributeError) as e:
        logger.warning(f"Could not import {module_path}.{func_name}: {e}")
        return None


def _run_sync(func, *args, **kwargs):
    try:
        result = func(*args, **kwargs)
        if asyncio.iscoroutine(result):
            loop = asyncio.new_event_loop()
            try:
                return loop.run_until_complete(result)
            finally:
                loop.close()
        return result
    except Exception as e:
        logger.error(f"Error running {func.__name__}: {e}")
        raise


@app.before_request
def log_request():
    logger.info(f"{request.method} {request.path}")


@app.route("/api/scrape/health", methods=["GET"])
def health():
    return jsonify({
        "success": True,
        "data": {
            "status": "running",
            "name": "RESQAI Scraper Service",
            "version": "1.0.0",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "uptime": time.time() - _start_time,
            "scrapers": {
                "dams": _safe_import("scrapers.dam_scraper", "scrape_dam_levels") is not None,
                "weather": _safe_import("scrapers.weather_scraper", "scrape_weather_warnings") is not None,
                "river": _safe_import("scrapers.river_scraper", "scrape_river_levels") is not None,
                "disaster": _safe_import("scrapers.disaster_scraper", "scrape_ndma_alerts") is not None,
                "hospitals": True,
                "news": True,
            },
        },
    })


@app.route("/api/scrape/dams", methods=["GET"])
def get_dams():
    try:
        fn = _safe_import("scrapers.dam_scraper", "scrape_dam_levels")
        if not fn:
            return jsonify({"success": False, "error": "Dam scraper not available", "data": {}}), 503
        data = _run_sync(fn)
        return jsonify({"success": True, "data": data, "timestamp": datetime.utcnow().isoformat() + "Z"})
    except Exception as e:
        logger.error(f"Dam scrape error: {e}")
        return jsonify({"success": False, "error": str(e), "data": {}}), 500


@app.route("/api/scrape/weather-warnings", methods=["GET"])
def get_weather_warnings():
    try:
        fn = _safe_import("scrapers.weather_scraper", "scrape_weather_warnings")
        if not fn:
            return jsonify({"success": False, "error": "Weather scraper not available", "data": []}), 503
        data = _run_sync(fn)
        return jsonify({"success": True, "data": data, "count": len(data), "timestamp": datetime.utcnow().isoformat() + "Z"})
    except Exception as e:
        logger.error(f"Weather warning scrape error: {e}")
        return jsonify({"success": False, "error": str(e), "data": []}), 500


@app.route("/api/scrape/cyclone-bulletins", methods=["GET"])
def get_cyclone_bulletins():
    try:
        fn = _safe_import("scrapers.weather_scraper", "scrape_cyclone_bulletins")
        if not fn:
            return jsonify({"success": False, "error": "Cyclone scraper not available", "data": []}), 503
        data = _run_sync(fn)
        return jsonify({"success": True, "data": data, "count": len(data), "timestamp": datetime.utcnow().isoformat() + "Z"})
    except Exception as e:
        logger.error(f"Cyclone bulletin scrape error: {e}")
        return jsonify({"success": False, "error": str(e), "data": []}), 500


@app.route("/api/scrape/river-levels", methods=["GET"])
def get_river_levels():
    try:
        fn = _safe_import("scrapers.river_scraper", "scrape_river_levels")
        if not fn:
            return jsonify({"success": False, "error": "River scraper not available", "data": []}), 503
        data = _run_sync(fn)
        return jsonify({"success": True, "data": data, "count": len(data), "timestamp": datetime.utcnow().isoformat() + "Z"})
    except Exception as e:
        logger.error(f"River level scrape error: {e}")
        return jsonify({"success": False, "error": str(e), "data": []}), 500


@app.route("/api/scrape/ndma-alerts", methods=["GET"])
def get_ndma_alerts():
    try:
        fn = _safe_import("scrapers.disaster_scraper", "scrape_ndma_alerts")
        if not fn:
            return jsonify({"success": False, "error": "Disaster scraper not available", "data": []}), 503
        data = _run_sync(fn)
        return jsonify({"success": True, "data": data, "count": len(data), "timestamp": datetime.utcnow().isoformat() + "Z"})
    except Exception as e:
        logger.error(f"NDMA alert scrape error: {e}")
        return jsonify({"success": False, "error": str(e), "data": []}), 500


@app.route("/api/scrape/disaster-news", methods=["GET"])
def get_disaster_news():
    try:
        query = request.args.get("q", "Tamil Nadu disaster")
        data = _run_sync(scrape_disaster_news, query)
        return jsonify({"success": True, "data": data, "count": len(data), "timestamp": datetime.utcnow().isoformat() + "Z"})
    except Exception as e:
        logger.error(f"News scrape error: {e}")
        return jsonify({"success": False, "error": str(e), "data": []}), 500


@app.route("/api/scrape/hospitals", methods=["GET"])
def get_hospitals():
    try:
        data = _run_sync(scrape_hospital_data)
        return jsonify({"success": True, "data": data, "count": len(data), "timestamp": datetime.utcnow().isoformat() + "Z"})
    except Exception as e:
        logger.error(f"Hospital scrape error: {e}")
        return jsonify({"success": False, "error": str(e), "data": []}), 500


@app.route("/api/scrape/blood-banks", methods=["GET"])
def get_blood_banks():
    try:
        data = _run_sync(scrape_blood_bank_availability)
        return jsonify({"success": True, "data": data, "count": len(data), "timestamp": datetime.utcnow().isoformat() + "Z"})
    except Exception as e:
        logger.error(f"Blood bank scrape error: {e}")
        return jsonify({"success": False, "error": str(e), "data": []}), 500


@app.route("/api/scrape/all", methods=["GET"])
def get_all():
    results = {}

    scrapers = {
        "dams": ("scrapers.dam_scraper", "scrape_dam_levels"),
        "weatherWarnings": ("scrapers.weather_scraper", "scrape_weather_warnings"),
        "cycloneBulletins": ("scrapers.weather_scraper", "scrape_cyclone_bulletins"),
        "riverLevels": ("scrapers.river_scraper", "scrape_river_levels"),
        "ndmaAlerts": ("scrapers.disaster_scraper", "scrape_ndma_alerts"),
    }

    for key, (mod, func_name) in scrapers.items():
        try:
            fn = _safe_import(mod, func_name)
            if fn:
                results[key] = {"success": True, "data": _run_sync(fn)}
            else:
                results[key] = {"success": False, "error": "Scraper not loaded", "data": []}
        except Exception as e:
            results[key] = {"success": False, "error": str(e), "data": []}

    try:
        results["hospitals"] = {"success": True, "data": _run_sync(scrape_hospital_data)}
    except Exception as e:
        results["hospitals"] = {"success": False, "error": str(e), "data": []}

    try:
        results["bloodBanks"] = {"success": True, "data": _run_sync(scrape_blood_bank_availability)}
    except Exception as e:
        results["bloodBanks"] = {"success": False, "error": str(e), "data": []}

    try:
        results["disasterNews"] = {"success": True, "data": _run_sync(scrape_disaster_news)}
    except Exception as e:
        results["disasterNews"] = {"success": False, "error": str(e), "data": []}

    return jsonify({
        "success": True,
        "data": results,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    })


@app.errorhandler(404)
def not_found(e):
    return jsonify({"success": False, "error": f"Route {request.method} {request.path} not found"}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({"success": False, "error": "Internal server error"}), 500


_start_time = time.time()

if __name__ == "__main__":
    port = int(os.environ.get("SCRAPER_PORT", 5001))
    logger.info(f"")
    logger.info(f"  RESQAI Scraper Service (Scrapling)")
    logger.info(f"  ────────────────────────────────────")
    logger.info(f"  Port:    {port}")
    logger.info(f"  Health:  http://localhost:{port}/api/scrape/health")
    logger.info(f"  All:     http://localhost:{port}/api/scrape/all")
    logger.info(f"")
    app.run(host="0.0.0.0", port=port, debug=False)
