// app.js
// San Diego County Public Restroom Map
// Blue = Open
// Red = Closed
// Gray = Unknown

document.addEventListener("DOMContentLoaded", () => {

  /* =========================================================
     CONFIG
     ========================================================= */

  const RESTROOM_CSV_URL =
    "data/restrooms_baseline_public_merged_2026-08-11.csv";


  /* =========================================================
     HELPERS
     ========================================================= */

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[char]));
  }

  function valueOf(value) {
    return String(value ?? "").trim();
  }

  function hasValue(value) {
    return valueOf(value) !== "";
  }

  function isYes(value) {
    const v = valueOf(value).toLowerCase();

    return [
      "1",
      "1.0",
      "true",
      "yes",
      "y",
      "open"
    ].includes(v);
  }

  function isNo(value) {
    const v = valueOf(value).toLowerCase();

    return [
      "0",
      "0.0",
      "false",
      "no",
      "n",
      "closed"
    ].includes(v);
  }

  function yesNo(value) {
    if (!hasValue(value)) return "";

    if (isYes(value)) return "Yes";
    if (isNo(value)) return "No";

    return valueOf(value);
  }

  function formatDate(value) {
    const raw = valueOf(value);

    if (!raw) return "";

    const date = new Date(raw);

    if (Number.isNaN(date.getTime())) {
      return raw;
    }

    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }


  /* =========================================================
     MAP
     ========================================================= */

  const map = L.map("map").setView(
  [33.05, -116.80],
  13
);

L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  }
).addTo(map);

const restroomMarkers = L.layerGroup().addTo(map);


  /* =========================================================
     CSV LOADING
     ========================================================= */

  async function loadCsv(url) {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Could not load CSV: ${response.status} ${response.statusText}`
      );
    }

    const csvText = await response.text();

    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0) {
      console.warn(
        "CSV parsing warnings:",
        parsed.errors
      );
    }

    return parsed.data;
  }


  /* =========================================================
     RESTROOM STATUS
     ========================================================= */

  function getRestroomStatus(row) {
    let rawStatus;

    if (hasValue(row.open_when_visited)) {
      rawStatus = row.open_when_visited;
    } else {
      rawStatus = row.restroom_open_status;
    }

    if (isYes(rawStatus)) {
      return "open";
    }

    if (isNo(rawStatus)) {
      return "closed";
    }

    return "unknown";
  }

  function getStatusLabel(row) {
    const status = getRestroomStatus(row);

    if (status === "open") {
      return "Open";
    }

    if (status === "closed") {
      return "Closed";
    }

    return "Unknown";
  }

  function getStatusColor(row) {
    const status = getRestroomStatus(row);

    if (status === "open") {
      return "#2563eb";
    }

    if (status === "closed") {
      return "#dc2626";
    }

    return "#808080";
  }


  /* =========================================================
     POPUP
     ========================================================= */

  function popupHtml(row) {

    const name =
      valueOf(row.restroom_name) ||
      valueOf(row.name) ||
      "Public Restroom";

    const address =
      valueOf(row.address);

    const status =
      getStatusLabel(row);

    const hours =
      valueOf(row.advertised_hours);

    const operatedBy =
      valueOf(row.operated_by);

    const accessMethod =
      valueOf(row.access_method);

    const findability =
      valueOf(row.findability);

    const ada =
      yesNo(row.ada_accessible);

    const genderNeutral =
      yesNo(row.gender_neutral);

    const menstrualProducts =
      yesNo(row.menstrual_products);

    const showers =
      yesNo(
        row.showers_available ||
        row.showers
      );

    const water =
      yesNo(row.water_refill_nearby);

    const signage =
      yesNo(row.visible_signage);

    const cameras =
      yesNo(row.security_cameras);

    const babyChanging =
      yesNo(row.baby_changing);

    const assessmentDate =
      formatDate(
        row.audit_datetime ||
        row.restroom_assessment_date ||
        row.timestamp
      );


    function rowHtml(label, value) {
      if (!hasValue(value)) {
        return "";
      }

      return `
        <div class="popupRow">
          <strong>${esc(label)}:</strong>
          ${esc(value)}
        </div>
      `;
    }


    let googleMapsLink = "";

    if (
      hasValue(row.latitude) &&
      hasValue(row.longitude)
    ) {

      const url =
        `https://www.google.com/maps?q=${encodeURIComponent(row.latitude)},${encodeURIComponent(row.longitude)}`;

      googleMapsLink = `
        <div class="popupActions">
          <a
            href="${url}"
            target="_blank"
            rel="noopener"
          >
            Open in Google Maps
          </a>
        </div>
      `;
    }


    return `
      <div class="restroomPopup">

        <div class="popupTitle">
          ${esc(name)}
        </div>

        ${
          address
            ? `<div class="popupAddress">${esc(address)}</div>`
            : ""
        }

        <div class="popupStatus popupStatus-${getRestroomStatus(row)}">
          ${esc(status)}
        </div>

        ${
          hours
            ? `
              <div class="popupHours">
                <strong>Hours:</strong>
                ${esc(hours)}
              </div>
            `
            : ""
        }

        ${
          assessmentDate
            ? `
              <div class="popupDate">
                Last assessed:
                ${esc(assessmentDate)}
              </div>
            `
            : ""
        }

        <div class="popupDetails">

          ${rowHtml("Operated by", operatedBy)}

          ${rowHtml("Access method", accessMethod)}

          ${rowHtml("Findability", findability)}

          ${rowHtml("ADA accessible", ada)}

          ${rowHtml(
            "Gender-neutral",
            genderNeutral
          )}

          ${rowHtml(
            "Menstrual products",
            menstrualProducts
          )}

          ${rowHtml("Showers", showers)}

          ${rowHtml(
            "Water refill nearby",
            water
          )}

          ${rowHtml(
            "Visible signage",
            signage
          )}

          ${rowHtml(
            "Security cameras",
            cameras
          )}

          ${rowHtml(
            "Baby changing",
            babyChanging
          )}

        </div>

        ${googleMapsLink}

      </div>
    `;
  }


  /* =========================================================
     DRAW RESTROOMS
     ========================================================= */

  function drawMarkers(rows) {

    restroomMarkers.clearLayers();

    const bounds = [];

    let mappedCount = 0;
    let skippedCount = 0;

    let openCount = 0;
    let closedCount = 0;
    let unknownCount = 0;

    rows.forEach((row) => {

      const lat =
        parseFloat(row.latitude);

      const lng =
        parseFloat(row.longitude);

      if (
        Number.isNaN(lat) ||
        Number.isNaN(lng)
      ) {

        skippedCount++;

        console.warn(
          "Skipping restroom with missing coordinates:",
          row.restroom_name ||
          row.name ||
          row
        );

        return;
      }

      const status =
        getRestroomStatus(row);

      if (status === "open") {
        openCount++;
      } else if (status === "closed") {
        closedCount++;
      } else {
        unknownCount++;
      }

      const markerColor =
        getStatusColor(row);

      const marker = L.circleMarker(
        [lat, lng],
        {
          radius: 7,
          color: "#ffffff",
          weight: 2,
          fillColor: markerColor,
          fillOpacity: 0.9,
        }
      );

      marker.bindPopup(
        popupHtml(row),
        {
          maxWidth: 380,
        }
      );

      marker.addTo(restroomMarkers);

      bounds.push([lat, lng]);

      mappedCount++;
    });

    if (bounds.length > 0) {
      map.fitBounds(
        bounds,
        {
          padding: [30, 30],
        }
      );
    }

    console.log(
      `Restrooms mapped: ${mappedCount}`
    );

    console.log(
      `Open: ${openCount}`
    );

    console.log(
      `Closed: ${closedCount}`
    );

    console.log(
      `Unknown: ${unknownCount}`
    );

    console.log(
      `Skipped because of missing coordinates: ${skippedCount}`
    );
  }


  /* =========================================================
     MAP LEGEND
     ========================================================= */

  const legend =
    L.control({
      position: "bottomright",
    });

  legend.onAdd = function () {

    const div =
      L.DomUtil.create(
        "div",
        "mapLegend"
      );

    div.innerHTML = `
      <div class="legendTitle">
        Restroom Status
      </div>

      <div class="legendItem">
        <span
          class="legendDot"
          style="background:#2563eb;"
        ></span>
        Open
      </div>

      <div class="legendItem">
        <span
          class="legendDot"
          style="background:#dc2626;"
        ></span>
        Closed
      </div>

      <div class="legendItem">
        <span
          class="legendDot"
          style="background:#808080;"
        ></span>
        Unknown
      </div>
    `;

    L.DomEvent.disableClickPropagation(div);

    return div;
  };

  legend.addTo(map);


  /* =========================================================
     LOAD DATA
     ========================================================= */

  async function initializeMap() {

    try {

      console.log(
        "Loading restroom data..."
      );

      const rows =
        await loadCsv(
          RESTROOM_CSV_URL
        );

      console.log(
        `CSV records loaded: ${rows.length}`
      );

      drawMarkers(rows);

      setTimeout(() => {
        map.invalidateSize();
      }, 200);

    } catch (error) {

      console.error(
        "Failed to load restroom map:",
        error
      );

    }
  }

  initializeMap();


  /* =========================================================
     RESIZE FIX
     ========================================================= */

  window.addEventListener(
    "resize",
    () => {

      setTimeout(() => {
        map.invalidateSize();
      }, 100);

    }
  );

});
