# Shopping Negotiator (SN)

An AI-powered shopping discovery and price-comparison platform. Describe a product by text, link, or photo — it searches shopping platforms, matches listings, and ranks them cheapest first.

> "Tell us what you want. We'll find where to get it cheapest."

## Tech Stack
- **Frontend:** HTML5, CSS3, JavaScript (vanilla) — 3 pages (search, results, product detail)
- **Backend:** Python, Flask, Flask-CORS, python-dotenv
- **External API:** Serpstack (real-time Google Shopping data)

## Features
Multi-modal input (text/link/photo) · Animated live search console · Real-time ranked results · Direct seller links · Fully responsive

## Setup
1. `cd Backend && pip install -r requirements.txt`
2. Create a `.env` file in the project root:
3.  Run backend: `python app.py` (port 5000)
4. Open `Frontend/index.html` with Live Server or `python -m http.server 5500`
5. Both must run at the same time.

## How It Works
User enters a product → Flask backend calls Serpstack for live prices → results are sorted cheapest-first → shown with an animated "negotiation console" loading experience.

## Limitations
Only text search is live (link/image not yet implemented) · No custom NLP, relies on Google Shopping's own matching · Most seller links go to search results, not exact product pages · Free-tier API limited to 100 requests/month

## Future Scope
Image recognition · Link parsing · More platforms · Price-drop alerts · User accounts

## Author
[Aman Raj] — college AI/ML project, Suresh Gyan Vihar University
