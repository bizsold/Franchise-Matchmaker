const BROKER_STORAGE_KEY = "brokers-master-db-v1";
const BROKER_WINDOW_NAME_PREFIX = "BROKER_DB_SYNC::";
const SUPABASE_URL = "https://ohiholwyaagawjqyocpq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oaWhvbHd5YWFnYXdqcXlvY3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMzkyNzMsImV4cCI6MjA5MzgxNTI3M30.qqQmNslJASRxGuR_kpGv6-x05_erZWq52o4yUTL6qDk";
const REGISTRATION_STATES = ["CA","HI","IL","IN","MD","MI","MN","NY","ND","RI","VA","WA","WI"];
const NON_REGISTRATION_STATES = ["AL","AK","AZ","AR","CO","DE","DC","FL","GA","ID","IA","KS","LA","ME","MA","MS","MO","MT","NV","NH","NJ","NM","OH","OK","PA","TN","VT","WV","WY"];
const ALL_CANADIAN_PROVINCES = ["AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"];
const CANADIAN_PROVINCE_NAMES = {
  AB: "Alberta", BC: "British Columbia", MB: "Manitoba", NB: "New Brunswick",
  NL: "Newfoundland and Labrador", NS: "Nova Scotia", NT: "Northwest Territories",
  NU: "Nunavut", ON: "Ontario", PE: "Prince Edward Island",
  QC: "Quebec", SK: "Saskatchewan", YT: "Yukon"
};
const ALL_US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];
const US_STATE_NAMES = {
  AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",CO:"Colorado",CT:"Connecticut",DE:"Delaware",DC:"District of Columbia",
  FL:"Florida",GA:"Georgia",HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",
  MD:"Maryland",MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",
  NJ:"New Jersey",NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",
  SC:"South Carolina",SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming"
};

const SPECIAL_REQUESTS_BY_BROKER = {
  "Heather Rosen": "Industry: All but food.",
  "Dan Collins": "Industry: All except vending and food.",
  "Greg Mccartney": "Industry: Limit IT. Prioritize Medical, Health, Senior Care, Education, Property Management, Restaurants.",
  "Mike Chiodo": "Industry: No hotels, gas stations, laundromats, or vending. Do not show for matches between April 17th and May 4th.",
  "Eric Little": "Industry: No fast food, hotels, or fitness.",
  "Daniel Purim": "Assessment leads only.",
  "Bill Krassner": "Assessment leads preferred."
};

const DEFAULT_BROKERS = [
  { name: "Heather Rosen", minLiquid: 200000, minNetWorth: 500000, minCredit: 700, locations: "us_wide", exclude: ["TX", "TN", "CA"], booking: "https://calendly.com/vafranchise/30min" },
  { name: "Kim Boike", minLiquid: 100000, minNetWorth: 300000, minCredit: 725, locations: "us_wide", exclude: ["NY", "CA", "WA"], booking: "https://kboike.esourcecoach.com/schedule-a-call/" },
  { name: "Dan Collins", minLiquid: 100000, minNetWorth: 1000000, minCredit: 680, locations: "us_wide", exclude: ["CA", "WA"], booking: "https://connect.franchisee1stadvisors.com/meetings/dan-collins/bizsold-initial-call?uuid=7eff0b2c-0131-4568-9243-607f27a6cdd1" },
  { name: "Greg Mccartney", minLiquid: 100000, minNetWorth: 350000, minCredit: 700, requiresStatus: ["US Citizen"], locations: "us_wide", exclude: ["NY", "HI", "AK"], booking: "https://meetings.hubspot.com/afb/intro-bizsold" },
  { name: "Mike Chiodo", minLiquid: 100000, minNetWorth: 500000, minCredit: 700, locations: "us_wide", exclude: ["OR", "WA"], booking: "https://calendly.com/mike-theperfectfranchise/bz-franchise-business?month=2026-02" },
  { name: "Michael Head", minLiquid: 100000, minNetWorth: 250000, minCredit: 680, locations: "specific", include: ["FL", "GA", "NC", "VA", "SC", "PA", "TN", "CO", "AL", "TX", "AZ", "IN"], booking: "https://meetings.hubspot.com/brokenladderadvisors/clone?uuid=45477e45-aac9-4be7-898d-3dffa6ae891a" },
  { name: "Eric Little", minLiquid: 100000, minNetWorth: 200000, minCredit: 680, locations: "us_wide", exclude: ["CA", "WA", "NY"], booking: "https://calendly.com/eric-little-franchoice/15-minutes-franchise-landscape2?month=2026-02" },
  { name: "Daniel Purim", minLiquid: 75000, minNetWorth: 300000, minCredit: 700, locations: "us_wide", assessmentOnly: true, booking: "https://api.leadconnectorhq.com/widget/bookings/ss30mins" },
  { name: "Bill Krassner", minLiquid: 75000, minNetWorth: 300000, minCredit: 680, locations: "us_wide", exclude: ["WA", "OR", "TX"], booking: "https://calendly.com/bkrassner-frannet/15-minute-meeting-discovery-call-clone?back=1&month=2025-07" },
  { name: "Brad Zink", minLiquid: 75000, minNetWorth: 250000, minCredit: 700, locations: "us_wide", exclude: ["NY"], booking: "https://bzink.esourcecoach.com/schedule-a-call/" },
  { name: "David Whalen", minLiquid: 100000, minNetWorth: 250000, minCredit: 700, locations: "non_registration", booking: "https://meetings.hubspot.com/dwhalen/bizsold?uuid=d1b818cd-9015-46e8-9eba-9d997f4d50fc" },
  { name: "Michael Davis", minLiquid: 100000, minNetWorth: 250000, minCredit: 680, requiresStatus: ["US Citizen"], locations: "us_wide", exclude: ["NY"], booking: "https://meetings.hubspot.com/mikedavis337/michaels-bizsold-calendar?uuid=053724c3-829a-4ef2-b459-794a956eeaaa" },
  { name: "Emily Romero", minLiquid: 50000, minNetWorth: 500000, minCredit: 700, locations: "us_wide", exclude: ["WA", "NY"], booking: "https://calendly.com/emilyr-theperfectfranchise/15-minute-meeting-bizsold" },
  { name: "Mark Johnson", minLiquid: 75000, minNetWorth: 250000, minCredit: 700, locations: "us_wide", exclude: ["CA", "NY", "ND", "SD", "HI", "AK", "WA", "MD"], booking: "https://calendly.com/markjohnson322/30min" },
  { name: "John Jobson", minLiquid: 75000, minNetWorth: 250000, minCredit: 680, locations: "us_wide", booking: "https://calendar.app.google/JMo8GXQpYmpaUoKaA" },
  { name: "Shawn Gurn", minLiquid: 100000, minNetWorth: 250000, minCredit: 700, locations: "us_wide", exclude: ["MD", "VA", "AK", "HI", "CA"], booking: "https://calendly.com/shawn-franchiseconsulting/introduction" },
  { name: "Liz Lewis", minLiquid: 100000, minNetWorth: 300000, minCredit: 680, locations: "us_wide", exclude: ["TX", "TN"], booking: "https://calendly.com/llewis1/15min?back=1&month=2025-09" },
  { name: "TJ Corey", minLiquid: 100000, minNetWorth: 200000, minCredit: 720, requiresStatus: ["US Citizen"], locations: "us_wide", exclude: ["AK", "CA", "HI", "IL", "MD", "MN", "MT", "NY", "OR", "VT", "VA", "WA"], booking: "https://meetings.hubspot.com/tcorey/bizsold" },
  { name: "Marshall Bowden", minLiquid: 50000, minNetWorth: 250000, minCredit: 700, locations: "us_wide", exclude: ["CA", "WA"], booking: "https://marshallbowden.youcanbook.me" },
  { name: "Chris Cameron", minLiquid: 75000, minNetWorth: 250000, minCredit: 700, locations: "non_registration", booking: "https://ccameron.esourcecoach.com/schedule-a-call/" },
  { name: "Liam Hanley", minLiquid: 100000, minNetWorth: 500000, minCredit: 700, locations: "us_wide", exclude: ["WA", "CA"], booking: "https://lhanley-4.youcanbook.me/" },
  { name: "Craig Wells", minLiquid: 100000, minNetWorth: 500000, minCredit: 725, locations: "us_wide", exclude: ["HI", "AK", "MD", "ND", "SD"], booking: "https://calendly.com/craig-spectrum/30min" },
  { name: "Doug Yntema", minLiquid: 100000, minNetWorth: 500000, minCredit: 680, locations: "us_wide", exclude: ["CA"], booking: "https://meetings.hubspot.com/douglas-yntema/dougs-bizsold-calendar" },
  { name: "Marc Cayle", minLiquid: 100000, minNetWorth: 500000, minCredit: 680, locations: "us_wide", booking: "https://calendly.com/mcayle/30-min-call-with-marc" },
  { name: "Sean Caldwell", minLiquid: 75000, minNetWorth: 500000, minCredit: 725, locations: "us_wide", exclude: ["MD"], booking: "https://scaldwell-expo.youcanbook.me/" },
  { name: "Tim Stiff", minLiquid: 75000, minNetWorth: 500000, minCredit: 680, locations: "us_wide", exclude: ["WA", "CA", "MD", "NY"], booking: "https://tstiff-coaching.youcanbook.me/" },
  { name: "Linda Cayle", minLiquid: 100000, minNetWorth: 500000, minCredit: 680, locations: "us_wide", exclude: ["WA", "CA", "NY"], booking: "https://calendly.com/lcayle/30min?month=2026-04" },
  { name: "Matt May", minLiquid: 100000, minNetWorth: 250000, minCredit: 700, requiresStatus: ["US Citizen"], locations: "us_wide", exclude: ["MD", "CA", "MN", "NY", "WA", "IL", "HI"], booking: "https://mmay-7.youcanbook.me/" },
  { name: "Shawn Eudy", minLiquid: 75000, minNetWorth: 500000, minCredit: 700, locations: "us_wide", exclude: ["WA", "NY", "VA"], booking: "https://seudy-coach.youcanbook.me/" },
  { name: "John Senich", minLiquid: 100000, minNetWorth: 250000, minCredit: 700, locations: "us_wide", exclude: ["NY", "WA", "CA", "MD"], booking: "https://jsenich-biz.youcanbook.me/" },
  { name: "James Hilovsky", minLiquid: 100000, minNetWorth: 500000, minCredit: 700, locations: "us_wide", exclude: ["WA", "CA", "NY", "WI", "MI", "MN"], booking: "https://calendly.com/james-1014/60min" },
  { name: "Lance Graulich", minLiquid: 100000, minNetWorth: 250000, minCredit: 700, locations: "us_wide", exclude: ["WA"], booking: "https://link.franflow.io/widget/bookings/lance-graulich" },
  { name: "Peter Leung", minLiquid: 100000, minNetWorth: 150000, minCredit: 680, locations: "specific", include: ["NY", "WA"], booking: "https://link.franflow.io/widget/bookings/lance-graulich" },
  { name: "John Boland", minLiquid: 100000, minNetWorth: 250000, minCredit: 700, requiresStatus: ["US Citizen", "Green Card"], locations: "us_wide", booking: "https://jboland.esourcecoach.com/schedule-a-call/" }
];

const form = document.getElementById("broker-form");
const message = document.getElementById("broker-form-message");
const brokerList = document.getElementById("broker-list");
const brokerCount = document.getElementById("broker-count");
const focusListToday = document.getElementById("focus-list-today");
const locationModeSelect = document.getElementById("location-mode");
const locationPicker = document.getElementById("location-picker");
const locationPickerLabel = document.getElementById("location-picker-label");
const locationNote = document.getElementById("location-note");
const saveBrokerBtn = document.getElementById("save-broker-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");
const saveFocusListBtn = document.getElementById("save-focus-list-btn");
let editingIndex = null;
const supabaseClient = window.supabase?.createClient ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

function currentDateEST() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const year = parts.find((p) => p.type === "year")?.value || "0000";
  const month = parts.find((p) => p.type === "month")?.value || "00";
  const day = parts.find((p) => p.type === "day")?.value || "00";
  return `${year}-${month}-${day}`;
}

async function fetchBookedTodayNames() {
  if (!supabaseClient) return new Set();
  const todayEST = currentDateEST();
  const { data, error } = await supabaseClient
    .from("bookings")
    .select("broker_name")
    .eq("date_est", todayEST);
  if (error || !Array.isArray(data)) return new Set();
  return new Set(data.map((row) => row.broker_name).filter(Boolean));
}

async function fetchBrokerFocusMap() {
  if (!supabaseClient) return null;
  try {
    const { data, error } = await supabaseClient.from("broker_focus").select("broker_name, focus_today");
    if (error || !Array.isArray(data)) return null;
    const map = new Map();
    data.forEach((row) => map.set(row.broker_name, row.focus_today === true));
    return map;
  } catch (e) {
    return null;
  }
}

async function persistBrokerFocusToSupabase(brokers) {
  if (!supabaseClient) return { ok: false, reason: "no-client" };
  const rows = brokers.map((b) => ({ broker_name: b.name, focus_today: b.focus_today === true, updated_at: new Date().toISOString() }));
  const { error } = await supabaseClient.from("broker_focus").upsert(rows, { onConflict: "broker_name" });
  return { ok: !error, error };
}

async function fetchBrokerLocksMap() {
  if (!supabaseClient) return null;
  try {
    const { data, error } = await supabaseClient.from("broker_locks").select("broker_name, hard_locked");
    if (error || !Array.isArray(data)) return null;
    const map = new Map();
    data.forEach((row) => map.set(row.broker_name, row.hard_locked === true));
    return map;
  } catch (e) {
    return null;
  }
}

async function setBrokerHardLockInSupabase(brokerName, hardLocked) {
  if (!supabaseClient) return false;
  const { error } = await supabaseClient.from("broker_locks").upsert(
    { broker_name: brokerName, hard_locked: hardLocked, updated_at: new Date().toISOString() },
    { onConflict: "broker_name" }
  );
  return !error;
}

function escapeAttr(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

async function unbookBrokerToday(brokerName) {
  if (!supabaseClient) return false;
  const todayEST = currentDateEST();
  const { error } = await supabaseClient
    .from("bookings")
    .delete()
    .eq("date_est", todayEST)
    .eq("broker_name", brokerName);
  return !error;
}

function normalizeBrokerLocation(broker) {
  if (broker.location_mode && Array.isArray(broker.location_states)) return broker;
  const locationStates = Array.isArray(broker.exclude) ? broker.exclude : (Array.isArray(broker.include) ? broker.include : []);
  let mode = "us_wide";
  if (broker.locations === "non_registration") mode = "non_registration_only";
  else if (broker.locations === "specific") mode = "include_only";
  else if (broker.locations === "us_wide" && Array.isArray(broker.exclude) && broker.exclude.length) mode = "us_wide_exclude";
  return {
    ...broker,
    location_mode: mode,
    location_states: locationStates,
    focus_for_date: broker.focus_for_date || null,
    focus_today: broker.focus_today === true,
    hard_locked: broker.hard_locked === true
  };
}

function readBrokers() {
  const raw = localStorage.getItem(BROKER_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item === "object").map(normalizeBrokerLocation);
  } catch (err) {
    return [];
  }
}

function mergeFocusTodayFromStorage(incomingBrokers) {
  const existing = readBrokers();
  const existingByName = new Map(existing.map((b) => [b.name, b]));
  return incomingBrokers.map((broker) => {
    const current = existingByName.get(broker.name);
    return {
      ...broker,
      focus_today: current ? current.focus_today === true : broker.focus_today === true
    };
  });
}

function syncFromWindowName() {
  if (typeof window.name === "string" && window.name.startsWith(BROKER_WINDOW_NAME_PREFIX)) {
    try {
      const payload = window.name.slice(BROKER_WINDOW_NAME_PREFIX.length);
      const parsed = JSON.parse(payload);
      if (Array.isArray(parsed)) {
        const merged = mergeFocusTodayFromStorage(parsed.map(normalizeBrokerLocation));
        localStorage.setItem(BROKER_STORAGE_KEY, JSON.stringify(merged));
      }
    } catch (err) {
      // Ignore malformed sync payload.
    }
  }
}

function saveBrokers(brokers) {
  const merged = mergeFocusTodayFromStorage(brokers.map(normalizeBrokerLocation));
  localStorage.setItem(BROKER_STORAGE_KEY, JSON.stringify(merged));
  try {
    window.name = `${BROKER_WINDOW_NAME_PREFIX}${JSON.stringify(merged)}`;
  } catch (err) {
    // If window.name cannot be set, localStorage still persists.
  }
}

function ensureDefaultRoster() {
  const brokers = readBrokers();
  if (!brokers.length) {
    const seeded = DEFAULT_BROKERS.map((broker) => ({
      ...normalizeBrokerLocation(broker),
      specialRequests: broker.specialRequests || SPECIAL_REQUESTS_BY_BROKER[broker.name] || ""
    }));
    saveBrokers(seeded);
    return;
  }

  // One-time backfill for existing saved brokers missing special requests.
  let changed = false;
  const byName = new Map(brokers.map((b) => [b.name, b]));
  DEFAULT_BROKERS.forEach((defaultBroker) => {
    if (!byName.has(defaultBroker.name)) {
      brokers.push({
        ...normalizeBrokerLocation(defaultBroker),
        specialRequests: defaultBroker.specialRequests || SPECIAL_REQUESTS_BY_BROKER[defaultBroker.name] || ""
      });
      changed = true;
    }
  });
  const enriched = brokers.map((broker) => {
    if (!broker.specialRequests && SPECIAL_REQUESTS_BY_BROKER[broker.name]) {
      changed = true;
      return { ...broker, specialRequests: SPECIAL_REQUESTS_BY_BROKER[broker.name] };
    }
    return broker;
  });
  if (changed) {
    saveBrokers(enriched);
  }
}

function parseStatus(statusText) {
  const cleaned = statusText.trim();
  if (!cleaned || cleaned.toLowerCase() === "any") return undefined;
  return cleaned.split(",").map((x) => x.trim()).filter(Boolean);
}

function getModeLabel(mode) {
  const labels = {
    us_wide: "USA Wide (all states)",
    us_wide_exclude: "USA Wide with Exclusions",
    non_registration_only: "Non-Registration States Only",
    include_only: "Specific States Only",
    canada_wide: "Canada Wide (all provinces)",
    canada_wide_exclude: "Canada Wide with Exclusions"
  };
  return labels[mode] || mode;
}

function renderPickerOptions(codes, names, selected) {
  const selectedSet = new Set(selected || []);
  return codes.map((code) => `
    <label class="location-option">
      <input type="checkbox" class="location-code" value="${code}" ${selectedSet.has(code) ? "checked" : ""} />
      ${code} - ${names[code] || code}
    </label>
  `).join("");
}

function updateLocationPicker(selectedCodes = []) {
  const mode = locationModeSelect.value;
  locationPicker.classList.add("hidden");
  locationNote.classList.add("hidden");
  locationPicker.innerHTML = "";

  if (mode === "us_wide_exclude") {
    locationPickerLabel.textContent = "Excluded States";
    locationPicker.classList.remove("hidden");
    locationPicker.innerHTML = renderPickerOptions(ALL_US_STATES, US_STATE_NAMES, selectedCodes);
  } else if (mode === "include_only") {
    locationPickerLabel.textContent = "Allowed States Only";
    locationPicker.classList.remove("hidden");
    locationPicker.innerHTML = renderPickerOptions(ALL_US_STATES, US_STATE_NAMES, selectedCodes);
  } else if (mode === "canada_wide_exclude") {
    locationPickerLabel.textContent = "Excluded Provinces";
    locationPicker.classList.remove("hidden");
    locationPicker.innerHTML = renderPickerOptions(ALL_CANADIAN_PROVINCES, CANADIAN_PROVINCE_NAMES, selectedCodes);
  } else if (mode === "non_registration_only") {
    locationNote.textContent = "Matches: AL, AK, AZ, AR, CO, DE, DC, FL, GA, ID, IA, KS, LA, ME, MA, MS, MO, MT, NV, NH, NJ, NM, OH, OK, PA, TN, VT, WV, WY";
    locationNote.classList.remove("hidden");
  }
}

function getSelectedLocationCodes() {
  return Array.from(document.querySelectorAll(".location-code:checked")).map((node) => node.value);
}

function fillFormForEdit(broker, index) {
  editingIndex = index;
  document.getElementById("broker-name").value = broker.name || "";
  document.getElementById("min-liquid").value = broker.minLiquid || 0;
  document.getElementById("min-net-worth").value = broker.minNetWorth || 0;
  document.getElementById("credit").value = broker.minCredit || 0;
  document.getElementById("status").value = (broker.requiresStatus || []).join(", ");
  document.getElementById("special-requests").value = broker.specialRequests || "";
  document.getElementById("booking-link").value = broker.booking || "";
  locationModeSelect.value = broker.location_mode || "us_wide";
  updateLocationPicker(broker.location_states || []);
  saveBrokerBtn.textContent = "Save Broker";
  cancelEditBtn.classList.remove("hidden");
}

async function renderBrokers() {
  const bookedTodayNames = await fetchBookedTodayNames();
  const lockMap = await fetchBrokerLocksMap();
  const focusMap = await fetchBrokerFocusMap();
  const rawBrokers = readBrokers().map((b) => ({
    ...b,
    hard_locked: lockMap ? (lockMap.get(b.name) === true) : (b.hard_locked === true),
    focus_today: focusMap ? (focusMap.get(b.name) === true) : (b.focus_today === true)
  }));
  const brokers = rawBrokers
    .map((broker, originalIndex) => ({ broker, originalIndex }))
    .sort((a, b) => String(a.broker?.name || "").localeCompare(String(b.broker?.name || "")));
  brokerCount.textContent = String(brokers.length);

  if (!brokers.length) {
    brokerList.innerHTML = "<p>No brokers found.</p>";
    return;
  }

  const focusedNames = brokers
    .filter(({ broker }) => broker.focus_today === true)
    .map(({ broker }) => broker.name);
  focusListToday.innerHTML = focusedNames.length ? focusedNames.join(", ") : "<span class=\"subtitle\">No brokers selected for focus today.</span>";

  const rows = brokers.map(({ broker, originalIndex }) => {
    const locked = broker.hard_locked === true;
    const rowClass = locked ? " broker-row-hard-locked" : "";
    return `
      <tr class="${rowClass.trim()}">
        <td>${broker.name || ""}</td>
        <td>$${Number(broker.minLiquid || 0).toLocaleString()}</td>
        <td>$${Number(broker.minNetWorth || 0).toLocaleString()}</td>
        <td>${broker.minCredit || ""}+</td>
        <td>${getModeLabel(broker.location_mode)}</td>
        <td>${(broker.location_states || []).join(", ") || "-"}</td>
        <td>${(broker.requiresStatus || []).join(", ") || "Any"}</td>
        <td>${broker.specialRequests || ""}</td>
        <td><a href="${broker.booking}" target="_blank" rel="noopener noreferrer">${broker.booking}</a></td>
        <td><input class="focus-today-checkbox" type="checkbox" data-index="${originalIndex}" data-broker-focus="${broker.name}" ${broker.focus_today === true ? "checked" : ""} /></td>
        <td><button type="button" class="hard-lock-btn${locked ? " active" : ""}" data-broker-name="${escapeAttr(broker.name || "")}" title="Hard lock: exclude from all matching">${locked ? "🔒 Locked" : "🔒 Hard Lock"}</button></td>
        <td><input class="booked-today-indicator" type="checkbox" disabled ${bookedTodayNames.has(broker.name) ? "checked" : ""} /></td>
        <td>${bookedTodayNames.has(broker.name) ? `<button class="icon-btn unbook-btn" data-name="${broker.name}" title="Unbook">Unbook</button>` : "-"}</td>
        <td><button class="icon-btn edit-btn" data-index="${originalIndex}" title="Edit">✏️</button></td>
        <td><button class="icon-btn delete-btn" data-index="${originalIndex}" title="Delete">Delete</button></td>
      </tr>
    `;
  }).join("");

  brokerList.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Broker</th>
          <th>Min Liquid</th>
          <th>Min Net Worth</th>
          <th>Credit</th>
          <th>Location Mode</th>
          <th>Location States</th>
          <th>Status</th>
          <th>Special Requests</th>
          <th>Booking Link</th>
          <th>Focus Today</th>
          <th>Hard Lock</th>
          <th>Booked Today</th>
          <th>Unbook</th>
          <th>Edit</th>
          <th>Delete</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      const index = Number(event.currentTarget.dataset.index);
      const brokersRaw = readBrokers();
      fillFormForEdit(brokersRaw[index], index);
      message.textContent = `Editing ${brokersRaw[index].name}`;
    });
  });

  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      const index = Number(event.currentTarget.dataset.index);
      const brokersRaw = readBrokers();
      const brokerName = brokersRaw[index]?.name || "this broker";
      const confirmed = window.confirm(`Delete ${brokerName}? This cannot be undone.`);
      if (!confirmed) return;
      brokersRaw.splice(index, 1);
      saveBrokers(brokersRaw);
      editingIndex = null;
      message.textContent = `${brokerName} deleted.`;
      renderBrokers();
    });
  });

  document.querySelectorAll(".unbook-btn").forEach((btn) => {
    btn.addEventListener("click", async (event) => {
      const brokerName = event.currentTarget.dataset.name;
      const ok = await unbookBrokerToday(brokerName);
      message.textContent = ok ? `${brokerName} unbooked for today.` : `Unable to unbook ${brokerName}.`;
      await renderBrokers();
    });
  });

  document.querySelectorAll(".hard-lock-btn").forEach((btn) => {
    btn.addEventListener("click", async (event) => {
      const brokerName = event.currentTarget.dataset.brokerName;
      if (!brokerName) return;
      const wasLocked = event.currentTarget.classList.contains("active");
      const nextLocked = !wasLocked;
      const ok = await setBrokerHardLockInSupabase(brokerName, nextLocked);
      message.textContent = ok
        ? `${brokerName} ${nextLocked ? "hard locked" : "unlocked"}.`
        : `Could not update hard lock for ${brokerName}. Check Supabase broker_locks table and network.`;
      await renderBrokers();
    });
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = document.getElementById("broker-name").value.trim();
  const minLiquid = Number(document.getElementById("min-liquid").value);
  const minNetWorth = Number(document.getElementById("min-net-worth").value);
  const minCredit = Number(document.getElementById("credit").value);
  const locationMode = locationModeSelect.value;
  const locationStates = getSelectedLocationCodes();
  const statusText = document.getElementById("status").value.trim();
  const specialRequests = document.getElementById("special-requests").value.trim();
  const booking = document.getElementById("booking-link").value.trim();

  if (!name || !booking) {
    message.textContent = "Please complete all required fields.";
    return;
  }

  const brokers = readBrokers();
  const payload = {
    name,
    minLiquid,
    minNetWorth,
    minCredit,
    location_mode: locationMode,
    location_states: locationStates,
    requiresStatus: parseStatus(statusText),
    specialRequests,
    booking
  };
  if (editingIndex === null) {
    brokers.push(payload);
  } else {
    brokers[editingIndex] = { ...brokers[editingIndex], ...payload };
  }
  saveBrokers(brokers);
  form.reset();
  editingIndex = null;
  saveBrokerBtn.textContent = "Add Broker";
  cancelEditBtn.classList.add("hidden");
  locationModeSelect.value = "us_wide";
  updateLocationPicker([]);
  message.textContent = `${name} saved to master broker database.`;
  renderBrokers();
});

try {
  syncFromWindowName();
  ensureDefaultRoster();
  renderBrokers();
} catch (error) {
  brokerList.innerHTML = "<p>Unable to load broker list. Please refresh this page.</p>";
}

locationModeSelect.addEventListener("change", () => {
  updateLocationPicker([]);
});

cancelEditBtn.addEventListener("click", () => {
  editingIndex = null;
  form.reset();
  saveBrokerBtn.textContent = "Add Broker";
  cancelEditBtn.classList.add("hidden");
  locationModeSelect.value = "us_wide";
  updateLocationPicker([]);
  message.textContent = "Edit cancelled.";
});

updateLocationPicker([]);

saveFocusListBtn.addEventListener("click", async () => {
  const brokers = JSON.parse(localStorage.getItem(BROKER_STORAGE_KEY) || "[]");
  brokers.forEach((broker) => {
    const checkbox = document.querySelector(`[data-broker-focus="${broker.name}"]`);
    if (checkbox) {
      broker.focus_today = checkbox.checked;
    }
  });

  // Mirror to localStorage so the broker admin view is consistent on reload.
  localStorage.setItem(BROKER_STORAGE_KEY, JSON.stringify(brokers));

  // Durable cross-page state lives in Supabase (file:// origins isolate localStorage).
  const result = await persistBrokerFocusToSupabase(brokers);

  if (!result.ok) {
    alert("Focus list saved locally, but could not sync to Supabase. Check your network or that the broker_focus table exists.");
  } else {
    alert("Focus list saved successfully.");
  }
  renderBrokers();
});

// Keep broker admin view fresh when data changes in other pages/tabs.
window.addEventListener("storage", (event) => {
  if (event.key === BROKER_STORAGE_KEY) {
    renderBrokers();
  }
});

window.addEventListener("focus", () => {
  syncFromWindowName();
  renderBrokers();
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    syncFromWindowName();
    renderBrokers();
  }
});
