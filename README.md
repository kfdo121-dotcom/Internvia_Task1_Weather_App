To run it

Get a free key at openweathermap.org/api. New keys can take up to about 2 hours to activate.
Paste the key into API_KEY at the top of app.js.
Put the three files in one folder and open index.html. A local server such as npx serve or VS Code Live Server also works.


What it does

Search: type a city name, or use “Use my location” to get weather for where you are. Adding a country code like “Paris, FR” helps with ambiguous names.
Current weather: temperature, feels-like, today’s high and low, humidity, wind, pressure, visibility, and sunrise and sunset. Times are shown in the searched city’s own timezone.
Forecast: a 5-day outlook built from OpenWeatherMap’s 3-hourly forecast data.
Sky changes with the weather: the background shifts between clear day, clear night, cloudy, rain, storm, snow and mist, based on conditions and whether it’s currently day or night there.
Units and history: a °C/°F toggle, plus your last five searches as quick buttons. Both are saved in the browser, and the last city reloads when you reopen the app.
Error messages: a bad key, an unknown city, rate limiting and being offline each show a clear message.
