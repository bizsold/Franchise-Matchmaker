const ADMIN_CODE = "528491";
const SUPABASE_URL = "https://ohiholwyaagawjqyocpq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oaWhvbHd5YWFnYXdqcXlvY3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMzkyNzMsImV4cCI6MjA5MzgxNTI3M30.qqQmNslJASRxGuR_kpGv6-x05_erZWq52o4yUTL6qDk";
const BROKER_STORAGE_KEY = "brokers-master-db-v1";
const BROKER_WINDOW_NAME_PREFIX = "BROKER_DB_SYNC::";
const SCRIPT_STORAGE_KEY = "matchmaker-script-config-v1";
const SCRIPT_WINDOW_NAME_PREFIX = "SCRIPT_CFG_SYNC::";

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

const STATE_MAP = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", delaware: "DE", florida: "FL", georgia: "GA", hawaii: "HI",
  idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA", kansas: "KS",
  kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD", massachusetts: "MA",
  michigan: "MI", minnesota: "MN", mississippi: "MS", missouri: "MO", montana: "MT",
  nebraska: "NE", nevada: "NV", "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM",
  "new york": "NY", "north carolina": "NC", "north dakota": "ND", ohio: "OH", oklahoma: "OK",
  oregon: "OR", pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC", "south dakota": "SD",
  tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT", virginia: "VA",
  washington: "WA", wisconsin: "WI", wyoming: "WY", "district of columbia": "DC"
};

const CANADIAN_PROVINCE_MAP = {
  alberta: "AB", "british columbia": "BC", manitoba: "MB", "new brunswick": "NB",
  "newfoundland and labrador": "NL", "nova scotia": "NS", "northwest territories": "NT",
  nunavut: "NU", ontario: "ON", "prince edward island": "PE", quebec: "QC",
  saskatchewan: "SK", yukon: "YT"
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

const DEFAULT_SCRIPT_CONFIG = {
  openingScript: `Hey [Name], this is [Your Name].
You had registered for a ticket to the franchise show. Quick question: are you still exploring the idea of owning your own business?

The reason I'm calling is I can connect you with a franchise advisor who can match you with opportunities that fit your goals, save you time, and help avoid costly mistakes. I have a few quick questions to make sure it's a good fit.

What drew you to the franchise show?

Are you looking to leave your current job, add income alongside it, or is this more of a longer-term plan?

Do you have any experience in franchising?

Have you looked at specific industries yet, or are you exploring?

Is there a particular reason why now feels like the right time to look at this?`,
  closingScript: "Great news - you would be a perfect fit for a conversation with one of our franchise advisors. Their role is to help you identify 2-3 brands that match your goals, budget and lifestyle. Just to confirm, you are in [Timezone] time? Let's get you booked in for a quick 15-30 minute call. There's no cost to you. I have [Day] at [Time] or [Day] at [Time], which works better for you? Is there anyone else who you'd like to bring on the call with you?",
  submissionLink: "https://api.leadconnectorhq.com/widget/survey/84dPjYE2rtzUulOqrxRQ",
  handoffScript: `Great! I just want to make sure you received the calendar invite from [Advisor Name] and it's on your schedule. [Advisor Name] has limited availability, and I want to make sure you get a spot that works for you.

Is there any reason you won't be able to make this call with [Franchise Consultant]?

If yes -> reinforce value:
Perfect! Looking forward to you getting a clearer picture of your options and which franchises fit your goals.

If no -> guide them gently:
No problem. Sometimes invites end up in spam or another folder. Could you check there? I want to make sure you have it so [Advisor Name]'s 15-minute call is on your calendar. It's a quick chat that will give you clarity and show the options that best fit your goals.`,
  questions: [
    { id: "liquidity", text: "Question 1: How much liquid capital do you have to invest?\nAre we talking under $50K, $50-$100K, $100-$250K, $500K or more?\nAre you open to using financing, things like SBA loans, 401K loans, home equity line of credit or are you looking to invest cash only?", type: "number_k" },
    { id: "status", text: "Question 2: There are lots of available funding options for US citizens, green card holders and visa holders. Are you a citizen, green card holder or visa holder? If so, which one do you have?", type: "buttons", options: [{ label: "US Citizen", value: "US Citizen" }, { label: "Green Card", value: "Green Card" }, { label: "Visa Holder", value: "Visa Holder" }, { label: "None of the above", value: "None of the above" }] },
    { id: "netWorth", text: "Question 3: Would you happen to know your approximate net worth, including assets like real estate and retirement accounts?", type: "number_k" },
    { id: "creditScore", text: "Question 4: Would you happen to know what your credit score is?", type: "buttons", options: [{ label: "680-699", value: 680 }, { label: "700-724", value: 700 }, { label: "725+", value: 725 }] },
    { id: "timeline", text: "Question 5: If the right opportunity came up, is this something you'd want to invest now, or 1-3 months, or 3-6 months?", type: "buttons", options: [{ label: "Now", value: "Now" }, { label: "1-3 months", value: "1-3 months" }, { label: "3-6 months", value: "3-6 months" }] },
    { id: "location", text: "Question 6: Where are you located currently, and are you thinking about opening a franchise there or somewhere else?", type: "location" }
  ]
};

function normalizeBrokerLocation(broker) {
  if (broker.location_mode && Array.isArray(broker.location_states)) return broker;
  let locationMode = "us_wide";
  let locationStates = [];
  if (broker.locations === "non_registration") {
    locationMode = "non_registration_only";
  } else if (broker.locations === "specific") {
    locationMode = "include_only";
    locationStates = Array.isArray(broker.include) ? broker.include : [];
  } else if (broker.locations === "us_wide" && Array.isArray(broker.exclude) && broker.exclude.length) {
    locationMode = "us_wide_exclude";
    locationStates = broker.exclude;
  }
  return {
    ...broker,
    location_mode: locationMode,
    location_states: locationStates,
    focus_for_date: broker.focus_for_date || null,
    focus_today: broker.focus_today === true
  };
}

function mergeFocusTodayFromStorage(incomingBrokers) {
  let existing = [];
  try {
    const raw = localStorage.getItem(BROKER_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) existing = parsed;
  } catch (err) {
    existing = [];
  }
  const existingByName = new Map(existing.map((b) => [b.name, b]));
  return incomingBrokers.map((broker) => {
    const existingBroker = existingByName.get(broker.name);
    return {
      ...broker,
      focus_today: existingBroker ? existingBroker.focus_today === true : broker.focus_today === true
    };
  });
}

function getMasterBrokers() {
  // Sync from brokers page when navigating back in same tab.
  if (typeof window.name === "string" && window.name.startsWith(BROKER_WINDOW_NAME_PREFIX)) {
    try {
      const payload = window.name.slice(BROKER_WINDOW_NAME_PREFIX.length);
      const parsed = JSON.parse(payload);
      if (Array.isArray(parsed) && parsed.length) {
        // Read current focus_today values from localStorage BEFORE overwriting
        const currentRaw = localStorage.getItem(BROKER_STORAGE_KEY);
        const currentBrokers = currentRaw ? JSON.parse(currentRaw) : [];
        const focusMap = new Map(currentBrokers.map(b => [b.name, b.focus_today === true]));

        // Merge window.name payload but preserve focus_today from localStorage
        const merged = parsed.map(normalizeBrokerLocation).map(b => ({
          ...b,
          focus_today: focusMap.has(b.name) ? focusMap.get(b.name) : b.focus_today === true
        }));
        localStorage.setItem(BROKER_STORAGE_KEY, JSON.stringify(merged));
      }
    } catch (err) {
      // Ignore malformed sync payload and continue with storage/defaults.
    }
  }

  const stored = localStorage.getItem(BROKER_STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length) {
        const normalized = mergeFocusTodayFromStorage(parsed.map(normalizeBrokerLocation));
        localStorage.setItem(BROKER_STORAGE_KEY, JSON.stringify(normalized));
        return normalized;
      }
    } catch (err) {
      // Fall through to defaults on malformed JSON.
    }
  }
  const normalizedDefaults = mergeFocusTodayFromStorage(DEFAULT_BROKERS.map(normalizeBrokerLocation));
  localStorage.setItem(BROKER_STORAGE_KEY, JSON.stringify(normalizedDefaults));
  return normalizedDefaults;
}

function getScriptConfig() {
  const tryParsedConfig = (raw) => {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.questions)) {
        parsed.questions = parsed.questions.map((q) => {
          if (q.id === "liquidity" || q.id === "netWorth") {
            return { ...q, type: "number_k", options: undefined };
          }
          return q;
        });
        return parsed;
      }
    } catch (err) {
      return null;
    }
    return null;
  };

  // Sync from script page when navigating back in same tab.
  if (typeof window.name === "string" && window.name.startsWith(SCRIPT_WINDOW_NAME_PREFIX)) {
    const payload = window.name.slice(SCRIPT_WINDOW_NAME_PREFIX.length);
    const parsed = tryParsedConfig(payload);
    if (parsed) {
      localStorage.setItem(SCRIPT_STORAGE_KEY, JSON.stringify(parsed));
      try {
        sessionStorage.setItem(SCRIPT_STORAGE_KEY, JSON.stringify(parsed));
      } catch (err) {
        // Ignore session storage failure.
      }
      return parsed;
    }
  }

  try {
    const sessionRaw = sessionStorage.getItem(SCRIPT_STORAGE_KEY);
    const sessionParsed = tryParsedConfig(sessionRaw);
    if (sessionParsed) {
      localStorage.setItem(SCRIPT_STORAGE_KEY, JSON.stringify(sessionParsed));
      return sessionParsed;
    }
  } catch (err) {
    // Ignore sessionStorage errors.
  }

  const localParsed = tryParsedConfig(localStorage.getItem(SCRIPT_STORAGE_KEY));
  if (localParsed) {
    localStorage.setItem(SCRIPT_STORAGE_KEY, JSON.stringify(localParsed));
    return localParsed;
  }
  localStorage.setItem(SCRIPT_STORAGE_KEY, JSON.stringify(DEFAULT_SCRIPT_CONFIG));
  return DEFAULT_SCRIPT_CONFIG;
}

const state = {
  role: "setter",
  isAdmin: false,
  answers: {},
  step: 0,
  bookingsToday: [],
  brokers: [],
  scriptConfig: DEFAULT_SCRIPT_CONFIG,
  db: null
};

const el = {
  role: document.getElementById("role"),
  adminCodeRow: document.getElementById("admin-code-row"),
  setterNameRow: document.getElementById("setter-name-row"),
  adminCode: document.getElementById("admin-code"),
  setterName: document.getElementById("setter-name"),
  startSession: document.getElementById("start-session"),
  scriptPanel: document.getElementById("script-panel"),
  adminPanel: document.getElementById("admin-panel"),
  questionsPanel: document.getElementById("questions-panel"),
  resultsPanel: document.getElementById("results-panel"),
  openingScript: document.getElementById("opening-script"),
  nextToQualifying: document.getElementById("next-to-qualifying"),
  questionContainer: document.getElementById("question-container"),
  prevQuestion: document.getElementById("prev-question"),
  nextQuestion: document.getElementById("next-question"),
  candidateSummary: document.getElementById("candidate-summary"),
  tier1: document.getElementById("tier1"),
  tier2: document.getElementById("tier2"),
  postMatchContent: document.getElementById("post-match-content"),
  restartSession: document.getElementById("restart-session")
};

// Prevent persisted password dots from showing in admin mode.
el.adminCode.value = "";

class BookingStore {
  constructor() {
    this.client = null;
    if (SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase?.createClient) {
      this.client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
  }

  currentDateEST() {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date());
  }

  async fetchTodayBookings() {
    const today = this.currentDateEST();
    if (!this.client) {
      return JSON.parse(localStorage.getItem(`bookings-${today}`) || "[]");
    }
    const { data, error } = await this.client.from("bookings").select("*").eq("date_est", today);
    if (error) return [];
    return data || [];
  }

  async saveBooking(entry) {
    const today = this.currentDateEST();
    const payload = { ...entry, date_est: today, created_at: new Date().toISOString() };
    if (!this.client) {
      const data = JSON.parse(localStorage.getItem(`bookings-${today}`) || "[]");
      data.push(payload);
      localStorage.setItem(`bookings-${today}`, JSON.stringify(data));
      return payload;
    }
    await this.client.from("bookings").insert(payload);
    return payload;
  }

  async fetchBrokerFocusMap() {
    if (!this.client) return null;
    try {
      const { data, error } = await this.client.from("broker_focus").select("broker_name, focus_today");
      if (error || !Array.isArray(data)) return null;
      const map = new Map();
      data.forEach((row) => map.set(row.broker_name, row.focus_today === true));
      return map;
    } catch (e) {
      return null;
    }
  }
}

function normalizeState(input) {
  if (!input) return "";
  const raw = input.trim().toLowerCase();
  if (raw.length === 2) return raw.toUpperCase();
  return STATE_MAP[raw] || CANADIAN_PROVINCE_MAP[raw] || "";
}

function getTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
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

function isBrokerEligibleForState(broker, candidateStateCode) {
  const state = (candidateStateCode || "").toUpperCase();
  switch (broker.location_mode) {
    case "us_wide":
      return true;
    case "us_wide_exclude":
      return !(broker.location_states || []).includes(state);
    case "non_registration_only":
      return NON_REGISTRATION_STATES.includes(state);
    case "include_only":
      return (broker.location_states || []).includes(state);
    case "canada_wide":
      return true;
    case "canada_wide_exclude":
      return !(broker.location_states || []).includes(state);
    default:
      return false;
  }
}

function matchesLocation(broker, leadState, country) {
  const isCanadaBroker = broker.location_mode === "canada_wide" || broker.location_mode === "canada_wide_exclude";
  if (country === "Canada" && !isCanadaBroker) return false;
  if (country === "USA" && isCanadaBroker) return false;
  return isBrokerEligibleForState(broker, leadState);
}

function isFinancialMatch(broker, lead) {
  return lead.liquidity >= broker.minLiquid &&
    lead.netWorth >= broker.minNetWorth &&
    lead.creditScore >= broker.minCredit &&
    (!broker.requiresStatus || broker.requiresStatus.includes(lead.status));
}

function getScore(broker, lead) {
  return Math.abs(lead.liquidity - broker.minLiquid) + Math.abs(lead.netWorth - broker.minNetWorth) + Math.abs(lead.creditScore - broker.minCredit) * 1000;
}

function renderQuestion() {
  const q = state.scriptConfig.questions[state.step];
  let html = `<p class="question-text"><strong>${q.text}</strong></p>`;
  if (q.type === "buttons") {
    html += `<div class="option-grid">` + q.options.map((opt) => {
      const active = state.answers[q.id] === opt.value ? "active" : "";
      return `<button class="option ${active}" data-qid="${q.id}" data-value="${opt.value}" type="button">${opt.label}</button>`;
    }).join("") + `</div>`;
  } else if (q.type === "number_k") {
    const rawValue = state.answers[q.id] !== undefined ? String(Math.floor(Number(state.answers[q.id]) / 1000)) : "";
    html += `
      <div class="row">
        <label>${q.id === "liquidity" ? "Liquid Capital" : "Net Worth"}</label>
        <input id="number-k-input" type="number" min="0" step="1" value="${rawValue}" placeholder="Enter amount in K" />
        <span>K</span>
      </div>`;
  } else {
    html += `
      <div class="row"><label>City</label><input id="city" value="${state.answers.city || ""}" placeholder="City" /></div>
      <div class="row"><label>State/Province</label><input id="lead-state" value="${state.answers.stateInput || ""}" placeholder="Ex: Florida or FL" /></div>
      <div class="row"><label>Country</label>
        <select id="country">
          <option ${state.answers.country === "USA" ? "selected" : ""}>USA</option>
          <option ${state.answers.country === "Canada" ? "selected" : ""}>Canada</option>
        </select>
      </div>`;
  }
  el.questionContainer.innerHTML = html;
  el.prevQuestion.disabled = state.step === 0;
  el.nextQuestion.textContent = state.step === state.scriptConfig.questions.length - 1 ? "Run Matching" : "Continue";
  document.querySelectorAll(".option").forEach((btn) => {
    btn.addEventListener("click", (evt) => {
      const target = evt.currentTarget;
      const value = target.dataset.value;
      const qid = target.dataset.qid;
      const numericValue = Number(value);
      const val = Number.isFinite(numericValue) && value !== "" ? numericValue : value;
      state.answers[qid] = val;
      renderQuestion();
    });
  });
}

function renderTable(matches) {
  if (!matches.length) return "<p>No matches.</p>";
  const rows = matches.map((b) => `
    <tr>
      <td>${b.name}</td>
      <td>$${b.minLiquid.toLocaleString()}</td>
      <td>$${b.minNetWorth.toLocaleString()}</td>
      <td>${b.minCredit}+</td>
      <td><a href="${b.booking}" target="_blank" rel="noopener noreferrer">${b.booking}</a></td>
      <td><button class="book-btn" data-name="${b.name}">Booked</button></td>
    </tr>`).join("");
  return `<table><thead><tr><th>Broker</th><th>Min Liquid</th><th>Min Net Worth</th><th>Credit</th><th>Booking URL</th><th>Daily Lock</th></tr></thead><tbody>${rows}</tbody></table>`;
}

async function runMatching() {
  // Always read latest broker master data before matching.
  state.brokers = getMasterBrokers();
  // Cross-page focus state lives in Supabase (file:// origins isolate localStorage); apply it here.
  const focusMap = state.db ? await state.db.fetchBrokerFocusMap() : null;
  if (focusMap) {
    state.brokers = state.brokers.map((b) => ({ ...b, focus_today: focusMap.get(b.name) === true }));
  }
  state.scriptConfig = getScriptConfig();
  const todayEST = currentDateEST();
  const leadState = normalizeState(state.answers.stateInput);
  const lead = {
    liquidity: state.answers.liquidity,
    status: state.answers.status,
    netWorth: state.answers.netWorth,
    creditScore: state.answers.creditScore,
    timeline: state.answers.timeline,
    city: state.answers.city,
    state: leadState,
    country: state.answers.country,
    timezone: getTimezone()
  };
  const bookedNames = new Set((state.bookingsToday || []).map((row) => row.broker_name));
  const allMatching = state.brokers
    .filter((b) => isFinancialMatch(b, lead) && matchesLocation(b, leadState, lead.country))
    .sort((a, b) => getScore(a, lead) - getScore(b, lead));

  const matchingAfterExclusion = allMatching
    .filter((b) => !bookedNames.has(b.name));

  // If nothing remains after exclusion audit, ignore daily exclusion.
  const eligibleBrokers = matchingAfterExclusion.length ? matchingAfterExclusion : allMatching;
  const exclusionAuditIgnored = !matchingAfterExclusion.length && allMatching.length > 0;
  const FOCUS_LIST = state.brokers.filter(b => b.focus_today === true).map(b => b.name);
  const tier1 = eligibleBrokers.filter(b => FOCUS_LIST.includes(b.name));
  const tier2 = eligibleBrokers.filter(b => !FOCUS_LIST.includes(b.name));

  el.candidateSummary.innerHTML = `
    <table><tbody>
      <tr><th>Liquidity</th><td>$${lead.liquidity.toLocaleString()}</td></tr>
      <tr><th>Net Worth</th><td>$${lead.netWorth.toLocaleString()}</td></tr>
      <tr><th>Credit</th><td>${lead.creditScore}+</td></tr>
      <tr><th>Status</th><td>${lead.status}</td></tr>
      <tr><th>Timeline</th><td>${lead.timeline}</td></tr>
      <tr><th>Location</th><td>${lead.city}, ${lead.state || state.answers.stateInput} (${lead.country})</td></tr>
      <tr><th>Timezone</th><td>${lead.timezone}</td></tr>
    </tbody></table>
  `;
  el.tier1.innerHTML = tier1.length ? renderTable(tier1) : "";
  el.tier2.innerHTML = tier2.length ? renderTable(tier2) : "";
  el.postMatchContent.innerHTML = `
    ${!eligibleBrokers.length ? `<p><strong>No matches found.</strong></p>` : ""}
    ${exclusionAuditIgnored ? `<p><strong>Note:</strong> No suitable brokers remained after today's exclusion audit, so daily exclusion was ignored and all matching brokers are shown.</p>` : ""}
    <h3>Closing Script</h3>
    <pre class="script-text">${state.scriptConfig.closingScript.replace("[Timezone]", lead.timezone)}</pre>
    <h3>Submission Form</h3>
    <p><a href="${state.scriptConfig.submissionLink}" target="_blank" rel="noopener noreferrer">${state.scriptConfig.submissionLink}</a></p>
    <h3>Hand Off Script</h3>
    <pre class="script-text">${state.scriptConfig.handoffScript}</pre>
  `;
  el.resultsPanel.classList.remove("hidden");

  document.querySelectorAll(".book-btn").forEach((btn) => {
    btn.addEventListener("click", async (evt) => {
      const brokerName = evt.currentTarget.dataset.name;
      await state.db.saveBooking({
        broker_name: brokerName,
        setter_name: el.setterName.value || "Unknown",
        lead_city: state.answers.city || "",
        lead_state: state.answers.stateInput || ""
      });
      alert(`${brokerName} marked as booked for today (EST).`);
      state.bookingsToday = await state.db.fetchTodayBookings();
      runMatching();
    });
  });
}

function openingText(setterName) {
  const base = state.scriptConfig.openingScript.replace("[Your Name]", setterName || "[Your Name]");
  // Enforce one blank line after the opener line for readability.
  return base.replace(/(\[Your Name\]\.?)(\n)(?!\n)/, "$1\n\n");
}

function resetSession() {
  state.answers = {};
  state.step = 0;
  state.bookingsToday = [];
  state.db = null;
  el.setterName.value = "";
  el.adminCode.value = "";
  el.role.value = "setter";
  el.adminCodeRow.classList.add("hidden");
  el.setterNameRow.classList.remove("hidden");
  el.scriptPanel.classList.add("hidden");
  el.adminPanel.classList.add("hidden");
  el.questionsPanel.classList.add("hidden");
  el.resultsPanel.classList.add("hidden");
  el.questionContainer.innerHTML = "";
  el.candidateSummary.innerHTML = "";
  el.tier1.innerHTML = "";
  el.tier2.innerHTML = "";
  el.postMatchContent.innerHTML = "";
}

el.role.addEventListener("change", () => {
  const isAdmin = el.role.value === "admin";
  el.adminCodeRow.classList.toggle("hidden", !isAdmin);
  el.setterNameRow.classList.toggle("hidden", isAdmin);
  if (isAdmin) {
    el.adminCode.value = "";
    setTimeout(() => {
      el.adminCode.value = "";
    }, 0);
  }
});

el.startSession.addEventListener("click", async () => {
  state.role = el.role.value;
  state.isAdmin = state.role === "admin" && el.adminCode.value === ADMIN_CODE;
  if (state.role === "admin" && !state.isAdmin) {
    alert("Admin code invalid.");
    return;
  }
  state.db = new BookingStore();
  state.brokers = getMasterBrokers();
  state.scriptConfig = getScriptConfig();
  state.bookingsToday = await state.db.fetchTodayBookings();
  if (state.isAdmin) {
    el.adminPanel.classList.remove("hidden");
    el.scriptPanel.classList.add("hidden");
    el.questionsPanel.classList.add("hidden");
    el.resultsPanel.classList.add("hidden");
    return;
  }
  el.openingScript.textContent = openingText(el.setterName.value);
  el.scriptPanel.classList.remove("hidden");
});

el.nextToQualifying.addEventListener("click", () => {
  el.questionsPanel.classList.remove("hidden");
  renderQuestion();
});

el.prevQuestion.addEventListener("click", () => {
  if (state.step > 0) {
    state.step -= 1;
    renderQuestion();
  }
});

el.nextQuestion.addEventListener("click", () => {
  const q = state.scriptConfig.questions[state.step];
  if (q.type === "buttons" && state.answers[q.id] === undefined) {
    alert("Please select an option to continue.");
    return;
  }
  if (q.type === "number_k") {
    const numberInput = document.getElementById("number-k-input");
    const raw = numberInput ? Number(numberInput.value) : NaN;
    if (!Number.isFinite(raw) || raw < 0) {
      alert("Please enter a valid number.");
      return;
    }
    state.answers[q.id] = raw * 1000;
  }
  if (q.type === "location") {
    const city = document.getElementById("city").value.trim();
    const stateInput = document.getElementById("lead-state").value.trim();
    const country = document.getElementById("country").value;
    if (!city || !stateInput) {
      alert("Please enter city and state/province.");
      return;
    }
    state.answers.city = city;
    state.answers.stateInput = stateInput;
    state.answers.country = country;
  }
  if (state.step < state.scriptConfig.questions.length - 1) {
    state.step += 1;
    renderQuestion();
  } else {
    runMatching();
  }
});

el.restartSession.addEventListener("click", () => {
  resetSession();
});
