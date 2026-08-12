# San Diego County Public Restroom Map

An interactive web map of public restroom locations throughout San Diego County.

The map is built with Leaflet and displays restroom locations from a CSV dataset.

## Live Map

https://psj-sdsu.github.io/mapping-sd-county/

## Map Legend

- 🔵 Blue = Open
- 🔴 Red = Closed
- ⚪ Gray = Unknown / no current status information

## Data

Restroom information is stored in:

`data/restrooms_baseline_public_merged_2026-08-11.csv`

The dataset includes information such as:

- Restroom name
- Address
- Latitude and longitude
- Open/closed status
- Advertised hours
- ADA accessibility
- Gender-neutral availability
- Menstrual products
- Showers
- Water refill availability
- Signage
- Access information
- Additional field observations

Not every restroom has information available for every field.

## Project Files

```text
mapping-sd-county/
├── index.html
├── app.js
├── style.css
├── README.md
└── data/
    └── restrooms_baseline_public_merged_2026-08-11.csv
