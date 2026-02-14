
Google Map Platform - Core APIs 

Places API 
* Customer address input & discovery

What it does
	•	Address autocomplete
	•	Place search (businesses, landmarks)
	•	Place details (formatted address, hours, etc.)

Where you use it
	•	Customer types pickup address
	•	Prevents invalid or incomplete addresses

Geocoding API 
* Address ⇄ latitude/longitude

What it does
	•	Convert address → (lat, lng)
	•	Reverse geocode (lat, lng) → address

Where you use it
	•	Store pickup locations
	•	Distance calculations
	•	Route planning

Directions API
* Route + ETA between points

What it does
	•	Turn-by-turn routes
	•	Traffic-aware ETA
	•	Multi-stop routing (limited)

Where you use it
	•	Driver navigation
	•	ETA shown to customers

Routes API 
* More advanced routing
What it improves
	•	Faster
	•	More accurate ETAs
	•	Better traffic modeling
	•	Supports EV routing

Distance Matrix API
* Travel time between many points
What it does
	•	Compute travel time between:
	•	Driver ↔ pickups
	•	Pickup ↔ pickup

Where you use it
	•	Assign pickups to drivers
	•	Decide best driver for extra pickup

Map JavaScript API
* Map UI in browser
What it does
	•	Interactive maps
	•	Markers
	•	Polylines (routes)

Where you use it
	•	Admin dashboard
	•	Driver web app
	•	Customer tracking view

Roads API
* Snap GPS to real roads
What it does
	•	Correct noisy GPS data
	•	Match coordinates to actual roads

Where you use it
	•	Driver tracking accuracy
	•	Playback routes

Street View API
* Visual confirmation
What it does
	•	Street-level imagery

Optional use
	•	Verify pickup locations
	•	Reduce failed pickups

Mapbox 

Key features
	•	Address autocomplete & geocoding
	•	Route optimization (multi-stop routing)
	•	Turn-by-turn directions
	•	Custom maps & styling

APIs
	•	Geocoding API
	•	Directions API
	•	Optimization API (for route planning)

🔗 https://www.mapbox.com


HERE Maps API - 

Key features
	•	Very strong routing & traffic data
	•	Fleet & logistics optimized
	•	Address validation

APIs
	•	Geocoding & Search
	•	Routing
	•	Fleet Telematics

🔗 https://developer.here.com


OpenStreetMap + Open-source APIs 

Nominatim (Geocoding)
	•	OpenStreetMap-based geocoder
	•	Free (rate-limited)

🔗 https://nominatim.org

OSRM (Routing)
	•	Open-source routing engine
	•	Self-host or use public instances

🔗 https://project-osrm.org

OpenRouteService (All-in-one)
	•	Geocoding
	•	Routing
	•	Isochrones

🔗 https://openrouteservice.org


Tomtom map 

Key features
	•	Routing with traffic
	•	Address search
	•	ETA prediction

🔗 https://developer.tomtom.com


Radar 

Key features
	•	Geofencing
	•	Address validation
	•	Distance calculations

🔗 https://radar.com

