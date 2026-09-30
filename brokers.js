const BROKER_STORAGE_KEY = "brokers-master-db-v1";
const BROKER_WINDOW_NAME_PREFIX = "BROKER_DB_SYNC::";
const FOCUS_DRAFT_KEY = "broker-focus-draft-v1";
const FOCUS_DRAFT_DIRTY_KEY = "broker-focus-draft-dirty-v1";
const ADMIN_NAME_STORAGE_KEY = "broker-admin-name-v1";
const SUPABASE_URL = "https://ohiholwyaagawjqyocpq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oaWhvbHd5YWFnYXdqcXlvY3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMzkyNzMsImV4cCI6MjA5MzgxNTI3M30.qqQmNslJASRxGuR_kpGv6-x05_erZWq52o4yUTL6qDk";
const REGISTRATION_STATES = ["CA","HI","IL","IN","MD","MI","MN","NY","ND","RI","VA","WA","WI"];
const NON_REGISTRATION_STATES = ["AL","AK","AZ","AR","CO","CT","DE","DC","FL","GA","ID","IA","KS","KY","LA","ME","MA","MS","MO","MT","NE","NV","NH","NJ","NM","NC","OH","OK","OR","PA","SC","SD","TN","TX","UT","VT","WV","WY"];
const INDUSTRY_OPTIONS = [
  { id: "food_restaurant", label: "Food/Restaurant" },
  { id: "health_senior_care", label: "Health & Senior Care" },
  { id: "vending", label: "Vending" }
];
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
const industryExclusionsPicker = document.getElementById("industry-exclusions-picker");
const saveBrokerBtn = document.getElementById("save-broker-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");
const saveFocusListBtn = document.getElementById("save-focus-list-btn");
const adminNameDisplay = document.getElementById("admin-name-display");
const auditLogList = document.getElementById("audit-log-list");
const auditLogMessage = document.getElementById("audit-log-message");
const refreshAuditLogBtn = document.getElementById("refresh-audit-log-btn");
let editingIndex = null;
const supabaseClient = window.supabase?.createClient ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

function getAdminName() {
  try {
    return sessionStorage.getItem(ADMIN_NAME_STORAGE_KEY)?.trim() || "Unknown Admin";
  } catch (err) {
    return "Unknown Admin";
  }
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function writeBrokerAuditLog({ action, brokerName, summary, beforeData = null, afterData = null }) {
  if (!supabaseClient) return false;
  try {
    const { error } = await supabaseClient.from("broker_audit_log").insert({
      admin_name: getAdminName(),
      action,
      broker_name: brokerName || null,
      summary: summary || action,
      before_data: beforeData,
      after_data: afterData
    });
    return !error;
  } catch (err) {
    return false;
  }
}

async function fetchRecentBrokerAuditLogs() {
  if (!supabaseClient) return null;
  try {
    const { data, error } = await supabaseClient
      .from("broker_audit_log")
      .select("id, changed_at, admin_name, action, broker_name, summary")
      .order("changed_at", { ascending: false })
      .limit(100);
    return error || !Array.isArray(data) ? null : data;
  } catch (err) {
    return null;
  }
}

async function renderAuditLog() {
  if (!auditLogList || !auditLogMessage) return;
  auditLogMessage.textContent = "Loading audit log...";
  const rows = await fetchRecentBrokerAuditLogs();
  if (rows === null) {
    auditLogList.innerHTML = "";
    auditLogMessage.textContent = "Audit log unavailable. Run broker_audit_log.sql in Supabase, then refresh.";
    return;
  }
  auditLogMessage.textContent = rows.length ? "" : "No broker changes have been logged yet.";
  auditLogList.innerHTML = rows.length ? `
    <table class="audit-log-table">
      <thead><tr><th>When</th><th>Admin</th><th>Action</th><th>Broker</th><th>Details</th></tr></thead>
      <tbody>${rows.map((row) => `
        <tr>
          <td>${escapeHTML(new Date(row.changed_at).toLocaleString())}</td>
          <td>${escapeHTML(row.admin_name)}</td>
          <td>${escapeHTML(String(row.action || "").replace(/_/g, " "))}</td>
          <td>${escapeHTML(row.broker_name || "—")}</td>
          <td>${escapeHTML(row.summary || "")}</td>
        </tr>
      `).join("")}</tbody>
    </table>
  ` : "";
}

function describeBrokerChanges(beforeBroker, afterBroker) {
  if (!beforeBroker) return "Broker added";
  const labels = {
    name: "name", minLiquid: "minimum liquid capital", minNetWorth: "minimum net worth",
    minCredit: "minimum credit", location_mode: "location mode", location_states: "locations",
    requiresStatus: "status criteria", specialRequests: "special requests", booking: "booking link",
    industry_exclusions: "industry exclusions", net_worth_limiter_enabled: "net worth limiter",
    net_worth_limiter: "maximum net worth", multi_unit_router: "Multi Unit",
    bypass_daily_limit: "Bypass Daily Limit"
  };
  const changed = Object.keys(labels).filter((key) => JSON.stringify(beforeBroker[key] ?? null) !== JSON.stringify(afterBroker[key] ?? null));
  return changed.length ? `Edited ${changed.map((key) => labels[key]).join(", ")}` : "Broker saved with no criteria changes";
}

function readFocusDraft() {
  try {
    const raw = sessionStorage.getItem(FOCUS_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (err) {
    return null;
  }
}

function writeFocusDraft(draft) {
  try {
    sessionStorage.setItem(FOCUS_DRAFT_KEY, JSON.stringify(draft));
  } catch (err) {
    // Ignore quota / private mode errors.
  }
}

function isFocusDraftDirty() {
  try {
    return sessionStorage.getItem(FOCUS_DRAFT_DIRTY_KEY) === "1";
  } catch (err) {
    return false;
  }
}

function setFocusDraftDirty(dirty) {
  try {
    if (dirty) sessionStorage.setItem(FOCUS_DRAFT_DIRTY_KEY, "1");
    else sessionStorage.removeItem(FOCUS_DRAFT_DIRTY_KEY);
  } catch (err) {
    // Ignore.
  }
}

function clearFocusDraft() {
  try {
    sessionStorage.removeItem(FOCUS_DRAFT_KEY);
    sessionStorage.removeItem(FOCUS_DRAFT_DIRTY_KEY);
  } catch (err) {
    // Ignore.
  }
}

function normalizeFocusAvailability(value, focusToday = false) {
  if (value === "morning" || value === "afternoon") return value;
  return focusToday === true ? "morning" : "";
}

function snapshotFocusSelectsToDraft() {
  const selects = document.querySelectorAll(".focus-availability-select");
  if (!selects.length) return;
  const draft = readFocusDraft() || {};
  selects.forEach((select) => {
    const name = select.dataset.brokerFocus;
    if (name) draft[name] = select.value;
  });
  writeFocusDraft(draft);
}

/** Prefer unsaved local edits only when the user has changed focus availability this session. */
function resolveFocusAvailability(broker, focusMap, draft) {
  const brokerName = broker.name;
  if (isFocusDraftDirty() && draft && Object.prototype.hasOwnProperty.call(draft, brokerName)) {
    return normalizeFocusAvailability(draft[brokerName]);
  }
  const focusToday = focusMap ? focusMap.get(brokerName) === true : broker.focus_today === true;
  return normalizeFocusAvailability(broker.focus_availability, focusToday);
}

function updateFocusListTodayFromDom() {
  const groups = { morning: [], afternoon: [] };
  document.querySelectorAll(".focus-availability-select").forEach((select) => {
    if (groups[select.value] && select.dataset.brokerFocus) groups[select.value].push(select.dataset.brokerFocus);
  });
  const sections = [
    groups.morning.length ? `<strong>Morning Available:</strong> ${groups.morning.join(", ")}` : "",
    groups.afternoon.length ? `<strong>Afternoon Available:</strong> ${groups.afternoon.join(", ")}` : ""
  ].filter(Boolean);
  focusListToday.innerHTML = sections.length
    ? sections.join("<br>")
    : "<span class=\"subtitle\">No brokers selected for focus today.</span>";
}

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

function brokerToSupabaseRow(broker) {
  // focus_today and hard_locked live in their own tables, not the brokers row.
  const { focus_today, hard_locked, ...rest } = broker;
  return {
    broker_name: broker.name,
    data: rest,
    updated_at: new Date().toISOString()
  };
}

function supabaseRowToBroker(row) {
  if (!row || !row.data) return null;
  return normalizeBrokerLocation({ ...row.data, name: row.broker_name });
}

async function fetchBrokersFromSupabase() {
  if (!supabaseClient) return null;
  try {
    const { data, error } = await supabaseClient
      .from("brokers")
      .select("broker_name, data")
      .order("broker_name");
    if (error || !Array.isArray(data)) return null;
    return data.map(supabaseRowToBroker).filter(Boolean);
  } catch (e) {
    return null;
  }
}

async function upsertBrokerToSupabase(broker) {
  if (!supabaseClient) return { ok: false, reason: "no-client" };
  const row = brokerToSupabaseRow(broker);
  const { error } = await supabaseClient
    .from("brokers")
    .upsert(row, { onConflict: "broker_name" });
  return { ok: !error, error };
}

async function deleteBrokerFromSupabase(brokerName) {
  if (!supabaseClient) return { ok: false, reason: "no-client" };
  // Clean focus/lock rows so a recreated broker with the same name starts fresh.
  await supabaseClient.from("broker_focus").delete().eq("broker_name", brokerName);
  await supabaseClient.from("broker_locks").delete().eq("broker_name", brokerName);
  const { error } = await supabaseClient.from("brokers").delete().eq("broker_name", brokerName);
  return { ok: !error, error };
}

async function seedBrokersToSupabaseIfEmpty() {
  if (!supabaseClient) return;
  const existing = await fetchBrokersFromSupabase();
  if (existing === null) return;
  if (existing.length > 0) return;
  const local = readBrokers();
  const seed = local.length
    ? local
    : DEFAULT_BROKERS.map((broker) => ({
        ...normalizeBrokerLocation(broker),
        specialRequests: broker.specialRequests || SPECIAL_REQUESTS_BY_BROKER[broker.name] || ""
      }));
  for (const broker of seed) {
    await upsertBrokerToSupabase(broker);
  }
}

function escapeAttr(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function formatCompactMoney(amount) {
  const n = Number(amount) || 0;
  if (n >= 1_000_000) {
    const millions = n / 1_000_000;
    return millions % 1 === 0 ? `$${millions}M` : `$${millions.toFixed(1)}M`;
  }
  if (n >= 1_000) return `$${Math.round(n / 1000)}K`;
  return `$${n.toLocaleString()}`;
}

async function logBookingEvent(event) {
  if (!supabaseClient) return false;
  const row = {
    event_type: event.event_type,
    broker_name: event.broker_name,
    setter_name: event.setter_name || "Unknown",
    date_est: event.date_est,
    lead_city: event.lead_city || null,
    lead_state: event.lead_state || null,
    booking_created_at: event.booking_created_at || null,
    success: event.success !== false,
    error_message: event.error_message || null,
    source: event.source || null
  };
  const { error } = await supabaseClient.from("booking_events").insert(row);
  return !error;
}

async function bookBrokerToday(brokerName) {
  if (!supabaseClient) return false;
  const todayEST = currentDateEST();
  const bookedNames = await fetchBookedTodayNames();
  if (bookedNames.has(brokerName)) return true;

  const created_at = new Date().toISOString();
  const payload = {
    broker_name: brokerName,
    setter_name: "Admin",
    lead_city: "",
    lead_state: "",
    date_est: todayEST,
    created_at
  };
  const { error } = await supabaseClient.from("bookings").insert(payload);
  await logBookingEvent({
    event_type: "booked",
    broker_name: brokerName,
    setter_name: "Admin",
    date_est: todayEST,
    lead_city: "",
    lead_state: "",
    booking_created_at: created_at,
    success: !error,
    error_message: error?.message || null,
    source: "admin_book"
  });
  return !error;
}

async function unbookBrokerToday(brokerName) {
  if (!supabaseClient) return false;
  const todayEST = currentDateEST();
  const { data: existingRows } = await supabaseClient
    .from("bookings")
    .select("broker_name, setter_name, date_est, lead_city, lead_state, created_at")
    .eq("date_est", todayEST)
    .eq("broker_name", brokerName);
  const rows = Array.isArray(existingRows) ? existingRows : [];

  const { error } = await supabaseClient
    .from("bookings")
    .delete()
    .eq("date_est", todayEST)
    .eq("broker_name", brokerName);

  if (rows.length) {
    for (const row of rows) {
      await logBookingEvent({
        event_type: "unbooked",
        broker_name: row.broker_name,
        setter_name: row.setter_name,
        date_est: row.date_est,
        lead_city: row.lead_city,
        lead_state: row.lead_state,
        booking_created_at: row.created_at,
        success: !error,
        error_message: error?.message || null,
        source: "admin_unbook"
      });
    }
  } else {
    await logBookingEvent({
      event_type: "unbooked",
      broker_name: brokerName,
      setter_name: "Unknown",
      date_est: todayEST,
      success: !error,
      error_message: error?.message || null,
      source: "admin_unbook"
    });
  }
  return !error;
}

async function setBrokerBookedTodayInSupabase(brokerName, booked) {
  if (booked) return bookBrokerToday(brokerName);
  return unbookBrokerToday(brokerName);
}

async function setBrokerMultiUnitRouterInSupabase(brokerName, enabled) {
  const supabaseBrokers = await fetchBrokersFromSupabase();
  const brokers = supabaseBrokers?.length ? supabaseBrokers : readBrokers();
  const broker = brokers.find((b) => b.name === brokerName);
  if (!broker) return false;
  const updated = { ...broker, multi_unit_router: enabled === true };
  const result = await upsertBrokerToSupabase(updated);
  if (result.ok) {
    const local = readBrokers();
    const idx = local.findIndex((b) => b.name === brokerName);
    if (idx >= 0) {
      local[idx] = { ...local[idx], multi_unit_router: enabled === true };
      saveBrokers(local);
    }
  }
  return result.ok;
}

async function setBrokerBypassDailyLimitInSupabase(brokerName, enabled) {
  const supabaseBrokers = await fetchBrokersFromSupabase();
  const brokers = supabaseBrokers?.length ? supabaseBrokers : readBrokers();
  const broker = brokers.find((b) => b.name === brokerName);
  if (!broker) return false;
  const updated = { ...broker, bypass_daily_limit: enabled === true };
  const result = await upsertBrokerToSupabase(updated);
  if (result.ok) {
    const local = readBrokers();
    const idx = local.findIndex((b) => b.name === brokerName);
    if (idx >= 0) {
      local[idx] = { ...local[idx], bypass_daily_limit: enabled === true };
      saveBrokers(local);
    }
  }
  return result.ok;
}

async function setBrokerTopPriorityInSupabase(brokerName, enabled) {
  const supabaseBrokers = await fetchBrokersFromSupabase();
  const brokers = supabaseBrokers?.length ? supabaseBrokers : readBrokers();
  const broker = brokers.find((b) => b.name === brokerName);
  if (!broker) return false;
  const updated = { ...broker, top_priority: enabled === true };
  const result = await upsertBrokerToSupabase(updated);
  if (result.ok) {
    const local = readBrokers();
    const idx = local.findIndex((b) => b.name === brokerName);
    if (idx >= 0) {
      local[idx] = { ...local[idx], top_priority: enabled === true };
      saveBrokers(local);
    }
  }
  return result.ok;
}

const ASSESSMENT_BROKER_NAME = "Daniel Purim";

function isAssessmentOnlyBroker(broker) {
  if (!broker) return false;
  return broker.assessmentOnly === true || broker.name === ASSESSMENT_BROKER_NAME;
}

function normalizeIndustryExclusions(values) {
  if (!Array.isArray(values)) return [];
  const allowed = new Set(INDUSTRY_OPTIONS.map((opt) => opt.id));
  return values.filter((id) => allowed.has(id));
}

function getIndustryExclusionLabels(exclusions) {
  const list = normalizeIndustryExclusions(exclusions);
  if (!list.length) return "-";
  return list.map((id) => INDUSTRY_OPTIONS.find((opt) => opt.id === id)?.label || id).join(", ");
}

function renderIndustryExclusionsPicker(selected = []) {
  if (!industryExclusionsPicker) return;
  const selectedSet = new Set(normalizeIndustryExclusions(selected));
  industryExclusionsPicker.innerHTML = INDUSTRY_OPTIONS.map((opt) => `
    <label class="location-option">
      <input type="checkbox" class="industry-exclusion-code" value="${opt.id}" ${selectedSet.has(opt.id) ? "checked" : ""} />
      <span>${opt.label}</span>
    </label>
  `).join("");
}

function getSelectedIndustryExclusions() {
  return normalizeIndustryExclusions(
    Array.from(document.querySelectorAll(".industry-exclusion-code:checked")).map((node) => node.value)
  );
}

async function syncStrippedIndustryExclusions(brokers) {
  if (!Array.isArray(brokers) || !brokers.length) return brokers;
  let changed = false;
  const synced = brokers.map((broker) => {
    const normalizedList = normalizeIndustryExclusions(broker.industry_exclusions);
    const previousList = Array.isArray(broker.industry_exclusions) ? broker.industry_exclusions : [];
    const listChanged = previousList.length !== normalizedList.length
      || previousList.some((id, index) => id !== normalizedList[index]);
    if (listChanged) changed = true;
    return normalizeBrokerLocation({ ...broker, industry_exclusions: normalizedList });
  });
  if (!changed) return synced;

  saveBrokers(synced);
  for (const broker of synced) {
    const before = brokers.find((b) => b.name === broker.name);
    const beforeList = Array.isArray(before?.industry_exclusions) ? before.industry_exclusions : [];
    const afterList = broker.industry_exclusions || [];
    const listChanged = beforeList.length !== afterList.length
      || beforeList.some((id, index) => id !== afterList[index]);
    if (listChanged) {
      await upsertBrokerToSupabase(broker);
    }
  }
  return synced;
}

function normalizeNetWorthLimiter(broker) {
  const enabled = broker.net_worth_limiter_enabled === true;
  const raw = Number(broker.net_worth_limiter);
  const limit = Number.isFinite(raw) && raw > 0 ? raw : null;
  return {
    net_worth_limiter_enabled: enabled && limit !== null,
    net_worth_limiter: enabled && limit !== null ? limit : null
  };
}

function setNetWorthLimiterForm(enabled, limit) {
  const enabledEl = document.getElementById("net-worth-limiter-enabled");
  const fieldsEl = document.getElementById("net-worth-limiter-fields");
  const limitEl = document.getElementById("net-worth-limiter");
  const isEnabled = enabled === true;
  if (enabledEl) enabledEl.checked = isEnabled;
  if (fieldsEl) fieldsEl.classList.toggle("hidden", !isEnabled);
  if (limitEl) {
    limitEl.value = isEnabled && limit != null ? String(limit) : "";
    limitEl.required = isEnabled;
  }
}

function getNetWorthLimiterFromForm() {
  const enabled = document.getElementById("net-worth-limiter-enabled")?.checked === true;
  const raw = Number(document.getElementById("net-worth-limiter")?.value);
  const limit = Number.isFinite(raw) && raw > 0 ? raw : null;
  return {
    net_worth_limiter_enabled: enabled && limit !== null,
    net_worth_limiter: enabled && limit !== null ? limit : null
  };
}

function normalizeBrokerLocation(broker) {
  const limiter = normalizeNetWorthLimiter(broker);
  const flags = {
    focus_for_date: broker.focus_for_date || null,
    focus_today: broker.focus_today === true,
    focus_availability: normalizeFocusAvailability(broker.focus_availability, broker.focus_today === true),
    hard_locked: broker.hard_locked === true,
    multi_unit_router: broker.multi_unit_router === true,
    bypass_daily_limit: broker.bypass_daily_limit === true,
    top_priority: broker.top_priority === true,
    assessmentOnly: isAssessmentOnlyBroker(broker),
    industry_exclusions: normalizeIndustryExclusions(broker.industry_exclusions),
    requiresStatus: normalizeRequiresStatus(broker.requiresStatus) || undefined,
    net_worth_limiter_enabled: limiter.net_worth_limiter_enabled,
    net_worth_limiter: limiter.net_worth_limiter
  };
  if (broker.location_mode && Array.isArray(broker.location_states)) {
    return { ...broker, ...flags };
  }
  const locationStates = Array.isArray(broker.exclude) ? broker.exclude : (Array.isArray(broker.include) ? broker.include : []);
  let mode = "us_wide";
  if (broker.locations === "non_registration") mode = "non_registration_only";
  else if (broker.locations === "specific") mode = "include_only";
  else if (broker.locations === "us_wide" && Array.isArray(broker.exclude) && broker.exclude.length) mode = "us_wide_exclude";
  return {
    ...broker,
    location_mode: mode,
    location_states: locationStates,
    ...flags
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
      focus_today: current ? current.focus_today === true : broker.focus_today === true,
      focus_availability: current
        ? normalizeFocusAvailability(current.focus_availability, current.focus_today === true)
        : normalizeFocusAvailability(broker.focus_availability, broker.focus_today === true)
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
  return normalizeRequiresStatus(statusText) || undefined;
}

const CITIZENSHIP_STATUS_CANONICAL = {
  "us citizen": "US Citizen",
  "citizen": "US Citizen",
  "u.s. citizen": "US Citizen",
  "green card": "Green Card",
  "green card holder": "Green Card",
  "permanent resident": "Green Card",
  "visa holder": "Visa Holder",
  "visa": "Visa Holder",
  "none of the above": "None of the above"
};

function normalizeCitizenshipStatus(value) {
  if (value === undefined || value === null) return "";
  const trimmed = String(value).trim();
  if (!trimmed) return "";
  return CITIZENSHIP_STATUS_CANONICAL[trimmed.toLowerCase()] || trimmed;
}

function normalizeRequiresStatus(requiresStatus) {
  if (requiresStatus === undefined || requiresStatus === null) return null;
  let parts = [];
  if (Array.isArray(requiresStatus)) {
    parts = requiresStatus.flatMap((item) => {
      if (typeof item !== "string") return [];
      return item.split(",").map((x) => x.trim()).filter(Boolean);
    });
  } else if (typeof requiresStatus === "string") {
    const cleaned = requiresStatus.trim();
    if (!cleaned || cleaned.toLowerCase() === "any") return null;
    parts = cleaned.split(",").map((x) => x.trim()).filter(Boolean);
  }
  const normalized = parts.map(normalizeCitizenshipStatus).filter(Boolean);
  return normalized.length ? [...new Set(normalized)] : null;
}

function getModeLabel(mode) {
  const labels = {
    us_wide: "USA Wide (all states)",
    us_wide_exclude: "USA Wide with Exclusions",
    non_registration_only: "Non-Registration States Only",
    include_only: "Specific States Only",
    canada_wide: "Canada Wide (all provinces)",
    canada_wide_exclude: "Canada Wide with Exclusions",
    north_america_wide: "USA & Canada (all)",
    north_america_wide_exclude: "USA & Canada w/ Exclusions"
  };
  return labels[mode] || mode;
}

function renderPickerOptions(codes, names, selected) {
  const selectedSet = new Set(selected || []);
  return codes.map((code) => `
    <label class="location-option">
      <input type="checkbox" class="location-code" value="${code}" ${selectedSet.has(code) ? "checked" : ""} />
      <span>${code} - ${names[code] || code}</span>
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
  } else if (mode === "north_america_wide_exclude") {
    locationPickerLabel.textContent = "Excluded States & Provinces";
    locationPicker.classList.remove("hidden");
    const selected = new Set(selectedCodes || []);
    const usSelected = ALL_US_STATES.filter((code) => selected.has(code));
    const caSelected = ALL_CANADIAN_PROVINCES.filter((code) => selected.has(code));
    locationPicker.innerHTML = `
      <p class="subtitle location-picker-section-label">Excluded US States</p>
      ${renderPickerOptions(ALL_US_STATES, US_STATE_NAMES, usSelected)}
      <p class="subtitle location-picker-section-label">Excluded Canadian Provinces</p>
      ${renderPickerOptions(ALL_CANADIAN_PROVINCES, CANADIAN_PROVINCE_NAMES, caSelected)}
    `;
  } else if (mode === "non_registration_only") {
    locationNote.textContent = "Matches: AL, AK, AZ, AR, CO, CT, DE, DC, FL, GA, ID, IA, KS, KY, LA, ME, MA, MS, MO, MT, NE, NV, NH, NJ, NM, NC, OH, OK, OR, PA, SC, SD, TN, TX, UT, VT, WV, WY";
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
  const multiUnitEl = document.getElementById("multi-unit-router");
  if (multiUnitEl) multiUnitEl.checked = broker.multi_unit_router === true;
  const bypassDailyLimitEl = document.getElementById("bypass-daily-limit");
  if (bypassDailyLimitEl) bypassDailyLimitEl.checked = broker.bypass_daily_limit === true;
  const limiter = normalizeNetWorthLimiter(broker);
  setNetWorthLimiterForm(limiter.net_worth_limiter_enabled, limiter.net_worth_limiter);
  renderIndustryExclusionsPicker(broker.industry_exclusions || []);
  locationModeSelect.value = broker.location_mode || "us_wide";
  updateLocationPicker(broker.location_states || []);
  saveBrokerBtn.textContent = "Save Broker";
  cancelEditBtn.classList.remove("hidden");
}

async function renderBrokers() {
  const bookedTodayNames = await fetchBookedTodayNames();
  const lockMap = await fetchBrokerLocksMap();
  const focusMap = await fetchBrokerFocusMap();
  const supabaseBrokers = await fetchBrokersFromSupabase();

  let sourceBrokers;
  if (supabaseBrokers && supabaseBrokers.length) {
    sourceBrokers = supabaseBrokers;
    // Mirror Supabase truth into the localStorage cache so app.js and offline reads stay in sync.
    try {
      localStorage.setItem(BROKER_STORAGE_KEY, JSON.stringify(supabaseBrokers));
    } catch (err) { /* ignore */ }
  } else {
    sourceBrokers = readBrokers();
  }

  sourceBrokers = await syncStrippedIndustryExclusions(sourceBrokers);

  // Drop stale drafts left over from older page sessions so Supabase wins.
  if (focusMap && !isFocusDraftDirty()) {
    clearFocusDraft();
  }

  const focusDraft = isFocusDraftDirty() ? readFocusDraft() : null;
  const rawBrokers = sourceBrokers.map((b) => ({
    ...b,
    hard_locked: lockMap ? (lockMap.get(b.name) === true) : (b.hard_locked === true),
    focus_availability: resolveFocusAvailability(b, focusMap, focusDraft),
    focus_today: Boolean(resolveFocusAvailability(b, focusMap, focusDraft))
  }));
  const brokers = rawBrokers
    .map((broker, originalIndex) => ({ broker, originalIndex }))
    .sort((a, b) => String(a.broker?.name || "").localeCompare(String(b.broker?.name || "")));
  brokerCount.textContent = String(brokers.length);

  if (!brokers.length) {
    brokerList.innerHTML = "<p>No brokers found.</p>";
    return;
  }

  const focusedGroups = { morning: [], afternoon: [] };
  brokers.forEach(({ broker }) => {
    if (focusedGroups[broker.focus_availability]) focusedGroups[broker.focus_availability].push(broker.name);
  });
  const focusSections = [
    focusedGroups.morning.length ? `<strong>Morning Available:</strong> ${focusedGroups.morning.join(", ")}` : "",
    focusedGroups.afternoon.length ? `<strong>Afternoon Available:</strong> ${focusedGroups.afternoon.join(", ")}` : ""
  ].filter(Boolean);
  focusListToday.innerHTML = focusSections.length ? focusSections.join("<br>") : "<span class=\"subtitle\">No brokers selected for focus today.</span>";

  const rows = brokers.map(({ broker, originalIndex }) => {
    const locked = broker.hard_locked === true;
    const bookedToday = bookedTodayNames.has(broker.name);
    const urgent = broker.top_priority === true;
    const rowClass = [
      locked ? "broker-row-hard-locked" : "",
      bookedToday ? "broker-row-booked-today" : ""
    ].filter(Boolean).join(" ");
    const statusText = (broker.requiresStatus || []).join(", ") || "Any";
    const bookingUrl = broker.booking || "";
    return `
      <tr class="${rowClass}">
        <td>${broker.name || ""}</td>
        <td class="broker-money-cell">${formatCompactMoney(broker.minLiquid)}</td>
        <td class="broker-money-cell">${formatCompactMoney(broker.minNetWorth)}</td>
        <td class="broker-credit-cell">${broker.minCredit || ""}+</td>
        <td>${getModeLabel(broker.location_mode)}</td>
        <td>${(broker.location_states || []).join(", ") || "-"}</td>
        <td class="broker-status-cell" title="${escapeAttr(statusText)}">${statusText}</td>
        <td>${broker.specialRequests || ""}</td>
        <td>${getIndustryExclusionLabels(broker.industry_exclusions)}</td>
        <td class="broker-link-cell">${bookingUrl ? `<a href="${escapeAttr(bookingUrl)}" target="_blank" rel="noopener noreferrer" title="${escapeAttr(bookingUrl)}">Link</a>` : "-"}</td>
        <td>
          <select class="focus-availability-select" data-index="${originalIndex}" data-broker-focus="${escapeAttr(broker.name || "")}" aria-label="Focus availability for ${escapeAttr(broker.name || "")}">
            <option value="" ${!broker.focus_availability ? "selected" : ""}></option>
            <option value="morning" ${broker.focus_availability === "morning" ? "selected" : ""}>Morning</option>
            <option value="afternoon" ${broker.focus_availability === "afternoon" ? "selected" : ""}>Afternoon</option>
          </select>
        </td>
        <td><input class="multi-unit-checkbox" type="checkbox" data-broker-name="${escapeAttr(broker.name || "")}" title="Multi-unit lead router" ${broker.multi_unit_router === true ? "checked" : ""} /></td>
        <td><input class="bypass-daily-limit-checkbox" type="checkbox" data-broker-name="${escapeAttr(broker.name || "")}" title="Continue showing this broker after they are booked today" ${broker.bypass_daily_limit === true ? "checked" : ""} /></td>
        <td><button type="button" class="urgent-btn${urgent ? " active" : ""}" data-broker-name="${escapeAttr(broker.name || "")}" title="Urgent: show above focus list when matched">${urgent ? "✓ Urgent" : "Urgent"}</button></td>
        <td><button type="button" class="hard-lock-btn${locked ? " active" : ""}" data-broker-name="${escapeAttr(broker.name || "")}" title="Hard lock: exclude from all matching">${locked ? "🔒 Locked" : "🔒 Hard Lock"}</button></td>
        <td><button type="button" class="booked-today-btn${bookedToday ? " active" : ""}" data-broker-name="${escapeAttr(broker.name || "")}" title="Mark as booked for today (EST)">${bookedToday ? "✓ Booked Today" : "Mark Booked"}</button></td>
        <td><button class="icon-btn edit-btn" data-index="${originalIndex}" title="Edit">✏️</button></td>
        <td><button class="icon-btn delete-btn broker-delete-btn" data-index="${originalIndex}" title="Delete">🗑</button></td>
      </tr>
    `;
  }).join("");

  brokerList.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Broker</th>
          <th>Min Liq</th>
          <th>Net Worth</th>
          <th>Cr.</th>
          <th>Location Mode</th>
          <th>Location States</th>
          <th>Status</th>
          <th>Special Requests</th>
          <th>Industry Excl.</th>
          <th>Link</th>
          <th>Focus</th>
          <th>Multi Unit</th>
          <th>Bypass Daily Limit</th>
          <th>Urgent</th>
          <th>Hard Lock</th>
          <th>Booked Today</th>
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
    btn.addEventListener("click", async (event) => {
      const index = Number(event.currentTarget.dataset.index);
      const brokersRaw = readBrokers();
      const deletedBroker = brokersRaw[index] ? JSON.parse(JSON.stringify(brokersRaw[index])) : null;
      const brokerName = deletedBroker?.name || "this broker";
      const confirmed = window.confirm(`Delete ${brokerName}? This cannot be undone.`);
      if (!confirmed) return;
      const result = await deleteBrokerFromSupabase(brokerName);
      brokersRaw.splice(index, 1);
      saveBrokers(brokersRaw);
      await writeBrokerAuditLog({
        action: "broker_deleted",
        brokerName,
        summary: result.ok ? "Broker deleted" : "Broker removed locally; Supabase broker delete failed",
        beforeData: deletedBroker,
        afterData: null
      });
      editingIndex = null;
      message.textContent = result.ok
        ? `${brokerName} deleted.`
        : `${brokerName} removed locally, but Supabase delete failed. Check network or the brokers table.`;
      await renderBrokers();
      await renderAuditLog();
    });
  });

  document.querySelectorAll(".booked-today-btn").forEach((btn) => {
    btn.addEventListener("click", async (event) => {
      const brokerName = event.currentTarget.dataset.brokerName;
      if (!brokerName) return;
      const wasBooked = event.currentTarget.classList.contains("active");
      const nextBooked = !wasBooked;
      const ok = await setBrokerBookedTodayInSupabase(brokerName, nextBooked);
      message.textContent = ok
        ? `${brokerName} ${nextBooked ? "marked booked" : "unbooked"} for today.`
        : `Could not update booked status for ${brokerName}. Check Supabase bookings table and network.`;
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
      if (ok) {
        await writeBrokerAuditLog({
          action: nextLocked ? "broker_locked" : "broker_unlocked",
          brokerName,
          summary: nextLocked ? "Hard Lock enabled" : "Hard Lock removed",
          beforeData: { hard_locked: wasLocked },
          afterData: { hard_locked: nextLocked }
        });
      }
      message.textContent = ok
        ? `${brokerName} ${nextLocked ? "hard locked" : "unlocked"}.`
        : `Could not update hard lock for ${brokerName}. Check Supabase broker_locks table and network.`;
      await renderBrokers();
      await renderAuditLog();
    });
  });

  document.querySelectorAll(".multi-unit-checkbox").forEach((cb) => {
    cb.addEventListener("change", async (event) => {
      const brokerName = event.currentTarget.dataset.brokerName;
      if (!brokerName) return;
      const enabled = event.currentTarget.checked;
      const ok = await setBrokerMultiUnitRouterInSupabase(brokerName, enabled);
      if (ok) {
        await writeBrokerAuditLog({
          action: enabled ? "multi_unit_enabled" : "multi_unit_disabled",
          brokerName,
          summary: `Multi Unit routing ${enabled ? "enabled" : "disabled"}`,
          beforeData: { multi_unit_router: !enabled },
          afterData: { multi_unit_router: enabled }
        });
      }
      message.textContent = ok
        ? `${brokerName} ${enabled ? "enabled" : "disabled"} for multi-unit routing.`
        : `Could not update multi-unit flag for ${brokerName}. Check Supabase brokers table and network.`;
      if (!ok) {
        event.currentTarget.checked = !enabled;
        return;
      }
      await renderBrokers();
      await renderAuditLog();
    });
  });

  document.querySelectorAll(".bypass-daily-limit-checkbox").forEach((cb) => {
    cb.addEventListener("change", async (event) => {
      const brokerName = event.currentTarget.dataset.brokerName;
      if (!brokerName) return;
      const enabled = event.currentTarget.checked;
      const ok = await setBrokerBypassDailyLimitInSupabase(brokerName, enabled);
      if (ok) {
        await writeBrokerAuditLog({
          action: enabled ? "daily_limit_bypass_enabled" : "daily_limit_bypass_disabled",
          brokerName,
          summary: `Bypass Daily Limit ${enabled ? "enabled" : "disabled"}`,
          beforeData: { bypass_daily_limit: !enabled },
          afterData: { bypass_daily_limit: enabled }
        });
      }
      message.textContent = ok
        ? `${brokerName} ${enabled ? "will now bypass" : "will now follow"} the daily booking limit.`
        : `Could not update daily-limit bypass for ${brokerName}. Check Supabase brokers table and network.`;
      if (!ok) {
        event.currentTarget.checked = !enabled;
        return;
      }
      await renderBrokers();
      await renderAuditLog();
    });
  });

  document.querySelectorAll(".urgent-btn[data-broker-name]").forEach((btn) => {
    btn.addEventListener("click", async (event) => {
      const brokerName = event.currentTarget.dataset.brokerName;
      if (!brokerName) return;
      const wasUrgent = event.currentTarget.classList.contains("active");
      const nextUrgent = !wasUrgent;
      const ok = await setBrokerTopPriorityInSupabase(brokerName, nextUrgent);
      if (ok) {
        await writeBrokerAuditLog({
          action: nextUrgent ? "urgent_enabled" : "urgent_disabled",
          brokerName,
          summary: `Urgent priority ${nextUrgent ? "enabled" : "disabled"}`,
          beforeData: { top_priority: wasUrgent },
          afterData: { top_priority: nextUrgent }
        });
      }
      message.textContent = ok
        ? `${brokerName} ${nextUrgent ? "marked" : "unmarked"} as Urgent.`
        : `Could not update Urgent for ${brokerName}. Check Supabase brokers table and network.`;
      await renderBrokers();
      await renderAuditLog();
    });
  });

  document.querySelectorAll(".focus-availability-select").forEach((select) => {
    select.addEventListener("change", () => {
      const draft = readFocusDraft() || {};
      const name = select.dataset.brokerFocus;
      if (name) draft[name] = select.value;
      writeFocusDraft(draft);
      setFocusDraftDirty(true);
      updateFocusListTodayFromDom();
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
  const multiUnitRouter = document.getElementById("multi-unit-router")?.checked === true;
  const bypassDailyLimit = document.getElementById("bypass-daily-limit")?.checked === true;
  const industryExclusions = getSelectedIndustryExclusions();
  const limiterEnabled = document.getElementById("net-worth-limiter-enabled")?.checked === true;
  const limiter = getNetWorthLimiterFromForm();

  if (!name || !booking) {
    message.textContent = "Please complete all required fields.";
    return;
  }
  if (limiterEnabled && !limiter.net_worth_limiter_enabled) {
    message.textContent = "Enter a valid Max Net Worth for the Net Worth Limiter (greater than 0).";
    return;
  }

  const brokers = readBrokers();
  const beforeBroker = editingIndex !== null && brokers[editingIndex]
    ? JSON.parse(JSON.stringify(brokers[editingIndex]))
    : null;
  // Urgent is table-only; keep the existing value when editing, default off for new brokers.
  const existingTopPriority = editingIndex !== null
    ? brokers[editingIndex]?.top_priority === true
    : false;
  const payload = {
    name,
    minLiquid,
    minNetWorth,
    minCredit,
    location_mode: locationMode,
    location_states: locationStates,
    requiresStatus: parseStatus(statusText),
    specialRequests,
    booking,
    multi_unit_router: multiUnitRouter,
    bypass_daily_limit: bypassDailyLimit,
    top_priority: existingTopPriority,
    industry_exclusions: industryExclusions,
    net_worth_limiter_enabled: limiter.net_worth_limiter_enabled,
    net_worth_limiter: limiter.net_worth_limiter
  };

  let savedBroker;
  let previousName = null;
  if (editingIndex === null) {
    if (brokers.some((b) => b.name === name)) {
      message.textContent = `A broker named ${name} already exists.`;
      return;
    }
    brokers.push(payload);
    savedBroker = payload;
  } else {
    previousName = brokers[editingIndex]?.name || null;
    brokers[editingIndex] = { ...brokers[editingIndex], ...payload };
    savedBroker = brokers[editingIndex];
  }

  // Supabase is the source of truth; write there first, then update the local cache.
  const upsertResult = await upsertBrokerToSupabase(savedBroker);
  if (previousName && previousName !== name) {
    await deleteBrokerFromSupabase(previousName);
  }
  saveBrokers(brokers);
  if (upsertResult.ok) {
    await writeBrokerAuditLog({
      action: beforeBroker ? "broker_criteria_edited" : "broker_added",
      brokerName: savedBroker.name,
      summary: describeBrokerChanges(beforeBroker, savedBroker),
      beforeData: beforeBroker,
      afterData: savedBroker
    });
  }

  form.reset();
  setNetWorthLimiterForm(false, null);
  editingIndex = null;
  saveBrokerBtn.textContent = "Add Broker";
  cancelEditBtn.classList.add("hidden");
  locationModeSelect.value = "us_wide";
  updateLocationPicker([]);
  renderIndustryExclusionsPicker([]);
  message.textContent = upsertResult.ok
    ? `${name} saved to master broker database.`
    : `${name} saved locally, but Supabase sync failed. Check network or that the brokers table exists.`;
  await renderBrokers();
  await renderAuditLog();
});

(async () => {
  try {
    if (getAdminName() === "Unknown Admin") {
      alert("Please enter the admin code and your name before opening the broker admin panel.");
      window.location.replace("./index.html");
      return;
    }
    syncFromWindowName();
    ensureDefaultRoster();
    await seedBrokersToSupabaseIfEmpty();
    await renderBrokers();
    await renderAuditLog();
  } catch (error) {
    brokerList.innerHTML = "<p>Unable to load broker list. Please refresh this page.</p>";
  }
})();

locationModeSelect.addEventListener("change", () => {
  updateLocationPicker([]);
});

cancelEditBtn.addEventListener("click", () => {
  editingIndex = null;
  form.reset();
  setNetWorthLimiterForm(false, null);
  saveBrokerBtn.textContent = "Add Broker";
  cancelEditBtn.classList.add("hidden");
  locationModeSelect.value = "us_wide";
  updateLocationPicker([]);
  renderIndustryExclusionsPicker([]);
  message.textContent = "Edit cancelled.";
});

document.getElementById("net-worth-limiter-enabled")?.addEventListener("change", (event) => {
  const enabled = event.currentTarget.checked === true;
  const currentLimit = document.getElementById("net-worth-limiter")?.value;
  setNetWorthLimiterForm(enabled, enabled && currentLimit ? Number(currentLimit) : null);
});

updateLocationPicker([]);
renderIndustryExclusionsPicker([]);
setNetWorthLimiterForm(false, null);

saveFocusListBtn.addEventListener("click", async () => {
  snapshotFocusSelectsToDraft();
  setFocusDraftDirty(true);
  const draft = readFocusDraft();
  const brokers = JSON.parse(localStorage.getItem(BROKER_STORAGE_KEY) || "[]");
  const previousFocusByName = new Map(brokers.map((broker) => [broker.name, {
    focus_today: broker.focus_today === true,
    focus_availability: normalizeFocusAvailability(broker.focus_availability, broker.focus_today === true)
  }]));
  brokers.forEach((broker) => {
    if (draft && Object.prototype.hasOwnProperty.call(draft, broker.name)) {
      broker.focus_availability = normalizeFocusAvailability(draft[broker.name]);
      broker.focus_today = Boolean(broker.focus_availability);
      return;
    }
    const select = Array.from(document.querySelectorAll(".focus-availability-select")).find((item) => item.dataset.brokerFocus === broker.name);
    if (select) {
      broker.focus_availability = normalizeFocusAvailability(select.value);
      broker.focus_today = Boolean(broker.focus_availability);
    }
  });

  localStorage.setItem(BROKER_STORAGE_KEY, JSON.stringify(brokers));

  const result = await persistBrokerFocusToSupabase(brokers);
  const brokerResults = await Promise.all(brokers.map(upsertBrokerToSupabase));
  const brokerSyncOk = brokerResults.every((item) => item?.ok !== false);

  if (!result.ok || !brokerSyncOk) {
    alert("Focus availability saved locally, but could not fully sync to Supabase. Check your network and Supabase tables.");
  } else {
    const auditEntries = brokers.flatMap((broker) => {
      const before = previousFocusByName.get(broker.name) || { focus_today: false, focus_availability: "" };
      const after = {
        focus_today: broker.focus_today === true,
        focus_availability: normalizeFocusAvailability(broker.focus_availability, broker.focus_today === true)
      };
      if (before.focus_today === after.focus_today && before.focus_availability === after.focus_availability) return [];
      const label = after.focus_availability === "morning"
        ? "Morning Available"
        : after.focus_availability === "afternoon" ? "Afternoon Available" : "Not on focus list";
      return [writeBrokerAuditLog({
        action: "focus_status_changed",
        brokerName: broker.name,
        summary: `Focus status changed to ${label}`,
        beforeData: before,
        afterData: after
      })];
    });
    await Promise.all(auditEntries);
    clearFocusDraft();
    alert("Focus availability saved successfully.");
  }
  await renderBrokers();
  await renderAuditLog();
});

if (adminNameDisplay) adminNameDisplay.textContent = getAdminName();
if (refreshAuditLogBtn) refreshAuditLogBtn.addEventListener("click", renderAuditLog);

// Refresh roster when another tab updates brokers.
window.addEventListener("storage", (event) => {
  if (event.key === BROKER_STORAGE_KEY) {
    // Keep intentional unsaved edits; otherwise refresh from Supabase/localStorage.
    if (isFocusDraftDirty()) snapshotFocusSelectsToDraft();
    else clearFocusDraft();
    renderBrokers();
  }
});

window.addEventListener("focus", () => {
  syncFromWindowName();
  // Do not snapshot checkboxes here — that locked stale focus lists over Supabase updates.
  renderBrokers();
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    if (isFocusDraftDirty()) snapshotFocusSelectsToDraft();
    return;
  }
  syncFromWindowName();
  renderBrokers();
});

window.addEventListener("pagehide", () => {
  if (isFocusDraftDirty()) snapshotFocusSelectsToDraft();
});
