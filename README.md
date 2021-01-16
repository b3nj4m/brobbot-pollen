# brobbot-pollen

A brobbot plugin for pollen forecasts.

```
brobbot pollen|cedar <query>
```

Searches MapBox for `query` and uses the result to query pollen.com for forecast data.

## Configuration (environment variables)

### MapBox Key

```bash
BROBBOT_POLLEN_MAPBOX_KEY=mysecretkey
```

Set the API key for MapBox
See https://www.mapbox.com/api-documentation/
