import os
import re
from pathlib import Path
from urllib.parse import quote_plus

import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS


PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")

app = Flask(__name__)
CORS(app)


def _parse_price(value):
	"""Return the first numeric value from a formatted INR price."""
	if value is None:
		return None

	match = re.search(r"\d[\d,]*(?:\.\d+)?", str(value))
	if not match:
		return None

	try:
		return float(match.group(0).replace(",", ""))
	except ValueError:
		return None

def _search_with_serpstack(query):
	api_key = os.getenv("SERP_API_KEY")
	print("API KEY LOADED:", bool(api_key), "LENGTH:", len(api_key) if api_key else 0)
	if not api_key:
		return []

	response = requests.get(
		"https://api.apilayer.net/serpstack/search",
		params={
			"access_key": api_key,
			"query": query,
			"type": "shopping",
			"gl": "in",
			"hl": "en",
		},
		timeout=15,
	)
	masked_key = api_key[:4] + "..." + api_key[-4:]
	print("HTTP STATUS:", response.status_code, "(key used:", masked_key, ")")
	print("RESPONSE BODY:", response.text)
	response.raise_for_status()
	payload = response.json()
	print("=== RAW SERPSTACK RESPONSE ===")
	print(payload)
	print("=== END RAW RESPONSE ===")
	if payload.get("error"):
		return []

	return payload.get("shopping_results", [])


def _search(query):
	provider = os.getenv("SERP_API_PROVIDER", "serpstack").lower()

	if provider == "serpstack":
		return _search_with_serpstack(query)
	if provider:
		return []
	return []


def _normalise_listings(raw_listings):
	listings = []
	for listing in raw_listings or []:
		price = _parse_price(listing.get("price"))
		title = listing.get("title")
		if price is None or not title:
			continue

		seller = str(listing.get("seller") or "").lower()
		encoded_title = quote_plus(title)
		if "amazon" in seller:
			url = f"https://www.amazon.in/s?k={encoded_title}"
		elif "croma" in seller:
			url = f"https://www.croma.com/search?q={encoded_title}"
		elif "flipkart" in seller:
			url = f"https://www.flipkart.com/search?q={encoded_title}"
		else:
			url = f"https://www.google.com/search?tbm=shop&q={encoded_title}"

		item = {
			"platform": listing.get("source") or listing.get("seller") or listing.get("merchant") or "",
			"title": title,
			"price": price,
			"url": url,
		}
		rating = listing.get("rating")
		if rating is not None:
			item["rating"] = rating
		listings.append(item)

	return sorted(listings, key=lambda listing: listing["price"])


@app.get("/api/health")
def health():
	return jsonify({"status": "ok"})


@app.post("/api/search")
def search():
	body = request.get_json(silent=True) or {}
	search_type = body.get("type")
	query = body.get("value")

	if search_type in ("link", "image"):
		return jsonify({"error": "not yet implemented"}), 501
	if search_type != "text" or not isinstance(query, str) or not query.strip():
		return jsonify({"error": "type must be text, link, or image and value is required"}), 400

	query = query.strip()
	try:
		listings = _normalise_listings(_search(query))
	except (requests.RequestException, ValueError, TypeError, AttributeError) as e:
		print("SEARCH FAILED WITH:", repr(e))
		listings = []

	return jsonify({"product_name": query, "listings": listings})


if __name__ == "__main__":
	app.run(host="0.0.0.0", port=5000, debug=True)
