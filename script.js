const SCRIPT_STORAGE_KEY = "matchmaker-script-config-v1";
const SCRIPT_WINDOW_NAME_PREFIX = "SCRIPT_CFG_SYNC::";
const SUPABASE_URL = "https://ohiholwyaagawjqyocpq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oaWhvbHd5YWFnYXdqcXlvY3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMzkyNzMsImV4cCI6MjA5MzgxNTI3M30.qqQmNslJASRxGuR_kpGv6-x05_erZWq52o4yUTL6qDk";
const supabaseClient = window.supabase?.createClient
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

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

const el = {
  opening: document.getElementById("opening-script-input"),
  closing: document.getElementById("closing-script-input"),
  handoff: document.getElementById("handoff-script-input"),
  submissionLink: document.getElementById("submission-link-input"),
  questionsList: document.getElementById("questions-list"),
  newQuestionId: document.getElementById("new-question-id"),
  newQuestionText: document.getElementById("new-question-text"),
  newQuestionType: document.getElementById("new-question-type"),
  questionOptionsRow: document.getElementById("question-options-row"),
  newQuestionOptions: document.getElementById("new-question-options"),
  addQuestionBtn: document.getElementById("add-question-btn"),
  saveBtn: document.getElementById("save-script-btn"),
  saveMessage: document.getElementById("script-save-message")
};

let config = loadConfig();
let editingQuestionIndex = null;

function normalizeConfig(parsed) {
  if (!parsed || !Array.isArray(parsed.questions)) return null;
  parsed.questions = parsed.questions.map((q) => {
    if (q.id === "liquidity" || q.id === "netWorth") {
      return { ...q, type: "number_k", options: undefined };
    }
    return q;
  });
  return parsed;
}

function loadConfig() {
  const raw = localStorage.getItem(SCRIPT_STORAGE_KEY);
  if (!raw) return structuredClone(DEFAULT_SCRIPT_CONFIG);
  try {
    return normalizeConfig(JSON.parse(raw)) || structuredClone(DEFAULT_SCRIPT_CONFIG);
  } catch (err) {
    return structuredClone(DEFAULT_SCRIPT_CONFIG);
  }
}

async function fetchScriptConfigFromSupabase() {
  if (!supabaseClient) return null;
  try {
    const { data, error } = await supabaseClient
      .from("app_script")
      .select("config")
      .eq("id", 1)
      .maybeSingle();
    if (error || !data || !data.config) return null;
    return normalizeConfig(data.config);
  } catch (e) {
    return null;
  }
}

async function persistScriptConfigToSupabase(nextConfig) {
  if (!supabaseClient) return { ok: false, reason: "no-client" };
  const row = { id: 1, config: nextConfig, updated_at: new Date().toISOString() };
  const { error } = await supabaseClient
    .from("app_script")
    .upsert(row, { onConflict: "id" });
  return { ok: !error, error };
}

function updateQuestionOptionsVisibility() {
  const isButtons = el.newQuestionType.value === "buttons";
  el.questionOptionsRow.classList.toggle("hidden", !isButtons);
}

function renderForm() {
  el.opening.value = config.openingScript || "";
  el.closing.value = config.closingScript || "";
  el.handoff.value = config.handoffScript || "";
  el.submissionLink.value = config.submissionLink || "";
  renderQuestions();
}

function renderQuestions() {
  if (!config.questions.length) {
    el.questionsList.innerHTML = "<p>No qualifying questions configured.</p>";
    return;
  }
  const rows = config.questions.map((q, index) => `
    <tr>
      <td>${q.id}</td>
      <td>${q.type}</td>
      <td>${q.text.replaceAll("\n", "<br>")}</td>
      <td>${(q.options || []).map((opt) => opt.label).join(", ")}</td>
      <td><button class="icon-btn edit-question-btn" data-index="${index}" type="button">Edit</button></td>
      <td><button class="icon-btn delete-question-btn" data-index="${index}" type="button">Delete</button></td>
    </tr>
  `).join("");

  el.questionsList.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Type</th>
          <th>Question Text</th>
          <th>Options</th>
          <th>Edit</th>
          <th>Delete</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  document.querySelectorAll(".edit-question-btn").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      const index = Number(event.currentTarget.dataset.index);
      const question = config.questions[index];
      if (!question) return;
      editingQuestionIndex = index;
      el.newQuestionId.value = question.id || "";
      el.newQuestionText.value = question.text || "";
      el.newQuestionType.value = question.type || "buttons";
      el.newQuestionOptions.value = (question.options || []).map((opt) => opt.label).join("\n");
      updateQuestionOptionsVisibility();
      el.addQuestionBtn.textContent = "Update Question";
      el.saveMessage.textContent = `Editing question: ${question.id}`;
    });
  });

  document.querySelectorAll(".delete-question-btn").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      const index = Number(event.currentTarget.dataset.index);
      config.questions.splice(index, 1);
      if (editingQuestionIndex === index) {
        editingQuestionIndex = null;
        el.addQuestionBtn.textContent = "Add Question";
      }
      renderQuestions();
    });
  });
}

function parseOptionValue(input) {
  const numeric = Number(input);
  return Number.isFinite(numeric) && input.trim() !== "" ? numeric : input.trim();
}

function buildQuestionFromForm() {
  const id = el.newQuestionId.value.trim();
  const text = el.newQuestionText.value.trim();
  const type = el.newQuestionType.value;
  if (!id || !text) return null;
  const question = { id, text, type };
  if (type === "buttons") {
    const optionLines = el.newQuestionOptions.value.split("\n").map((line) => line.trim()).filter(Boolean);
    if (!optionLines.length) return null;
    question.options = optionLines.map((line) => ({
      label: line,
      value: parseOptionValue(line.replaceAll("$", "").replaceAll(",", "").replaceAll("+", ""))
    }));
  }
  return question;
}

el.addQuestionBtn.addEventListener("click", () => {
  const question = buildQuestionFromForm();
  if (!question) {
    el.saveMessage.textContent = "Question ID and text are required.";
    return;
  }
  if (config.questions.some((q, idx) => q.id === question.id && idx !== editingQuestionIndex)) {
    el.saveMessage.textContent = "Question ID must be unique.";
    return;
  }
  if (editingQuestionIndex === null) {
    config.questions.push(question);
  } else {
    config.questions[editingQuestionIndex] = question;
  }
  editingQuestionIndex = null;
  el.newQuestionId.value = "";
  el.newQuestionText.value = "";
  el.newQuestionOptions.value = "";
  el.newQuestionType.value = "buttons";
  updateQuestionOptionsVisibility();
  el.addQuestionBtn.textContent = "Add Question";
  el.saveMessage.textContent = "Question saved. Click Save Script Changes.";
  renderQuestions();
});

el.saveBtn.addEventListener("click", async () => {
  // If a question is currently being edited in the form, apply it automatically.
  if (editingQuestionIndex !== null && el.newQuestionId.value.trim() && el.newQuestionText.value.trim()) {
    const question = buildQuestionFromForm();
    if (question) {
      config.questions[editingQuestionIndex] = question;
      editingQuestionIndex = null;
      el.addQuestionBtn.textContent = "Add Question";
      el.newQuestionId.value = "";
      el.newQuestionText.value = "";
      el.newQuestionOptions.value = "";
      renderQuestions();
    }
  }
  config.openingScript = el.opening.value;
  config.closingScript = el.closing.value;
  config.handoffScript = el.handoff.value;
  config.submissionLink = el.submissionLink.value;
  localStorage.setItem(SCRIPT_STORAGE_KEY, JSON.stringify(config));
  try {
    sessionStorage.setItem(SCRIPT_STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    // Ignore sessionStorage issues.
  }
  try {
    window.name = `${SCRIPT_WINDOW_NAME_PREFIX}${JSON.stringify(config)}`;
  } catch (err) {
    // localStorage save still works if window.name fails.
  }
  el.saveMessage.textContent = "Saving to Supabase...";
  const result = await persistScriptConfigToSupabase(config);
  el.saveMessage.textContent = result.ok
    ? "Script settings saved (live for all setters)."
    : "Saved locally, but Supabase sync failed. Check network or that the app_script table exists.";
});

el.newQuestionType.addEventListener("change", () => {
  updateQuestionOptionsVisibility();
});

updateQuestionOptionsVisibility();
renderForm();

(async () => {
  const remote = await fetchScriptConfigFromSupabase();
  if (remote) {
    config = remote;
    localStorage.setItem(SCRIPT_STORAGE_KEY, JSON.stringify(config));
    renderForm();
  } else if (supabaseClient) {
    // First boot: push current config so other devices can read it.
    await persistScriptConfigToSupabase(config);
  }
})();
