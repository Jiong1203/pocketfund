const state = {
  token: localStorage.getItem("pocketfund_token") || "",
  accounts: [],
  funds: [],
  query: {
    page: 1,
    pageSize: 20,
    type: "",
    startAt: "",
    endAt: "",
    fundId: ""
  }
};

const $ = (id) => document.getElementById(id);
const statusEl = $("status");
const consoleEl = $("console");
const txOutputEl = $("tx-output");
const pageInfoEl = $("page-info");

function log(message, data) {
  const line = `[${new Date().toISOString()}] ${message}`;
  const payload = data ? `${line}\n${JSON.stringify(data, null, 2)}\n\n` : `${line}\n`;
  consoleEl.textContent = payload + consoleEl.textContent;
}

function setStatus() {
  statusEl.textContent = state.token ? "Authenticated" : "Not authenticated";
}

async function api(path, options = {}, auth = true) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  if (auth && state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(path, {
    ...options,
    headers
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.error?.message || `HTTP ${response.status}`);
  }
  return body.data;
}

function renderAccounts() {
  const accountList = $("account-list");
  const txAccount = $("tx-account");
  accountList.innerHTML = "";
  txAccount.innerHTML = "";

  state.accounts.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = `${item.name} (${item.type})`;
    accountList.appendChild(li);

    const opt = document.createElement("option");
    opt.value = item.id;
    opt.textContent = `${item.name} (${item.type})`;
    txAccount.appendChild(opt);
  });
}

function renderFunds() {
  const fundList = $("fund-list");
  const txFund = $("tx-fund");
  const queryFund = $("query-fund");
  fundList.innerHTML = "";
  txFund.innerHTML = "";
  queryFund.innerHTML = "";

  state.funds.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = `${item.name} | cycle day: ${item.cycle_day}`;
    fundList.appendChild(li);

    const optA = document.createElement("option");
    optA.value = item.id;
    optA.textContent = item.name;
    txFund.appendChild(optA);

    const optB = document.createElement("option");
    optB.value = item.id;
    optB.textContent = item.name;
    queryFund.appendChild(optB);
  });

  if (!state.query.fundId && state.funds[0]) {
    state.query.fundId = state.funds[0].id;
    queryFund.value = state.query.fundId;
  }
}

async function loadAccounts() {
  state.accounts = await api("/accounts");
  renderAccounts();
}

async function loadFunds() {
  state.funds = await api("/funds");
  renderFunds();
}

function toIsoLocal(localValue) {
  if (!localValue) return "";
  return new Date(localValue).toISOString();
}

async function loadTransactions() {
  if (!state.query.fundId) return;
  const params = new URLSearchParams();
  params.set("page", String(state.query.page));
  params.set("pageSize", String(state.query.pageSize));
  if (state.query.type) params.set("type", state.query.type);
  if (state.query.startAt) params.set("startAt", state.query.startAt);
  if (state.query.endAt) params.set("endAt", state.query.endAt);

  const data = await api(`/funds/${state.query.fundId}/transactions?${params.toString()}`);
  txOutputEl.textContent = JSON.stringify(data.items, null, 2);
  pageInfoEl.textContent = `page ${data.meta.page} / size ${data.meta.pageSize} / total ${data.meta.total}`;
}

async function bootstrap() {
  setStatus();
  if (!state.token) return;
  await Promise.all([loadAccounts(), loadFunds()]);
  if (state.funds.length > 0) {
    state.query.fundId = state.funds[0].id;
    await loadTransactions();
  }
}

$("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    const data = await api(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify({
          email: fd.get("email"),
          password: fd.get("password")
        })
      },
      false
    );
    state.token = data.accessToken;
    localStorage.setItem("pocketfund_token", state.token);
    setStatus();
    await bootstrap();
    log("Registered and logged in.");
  } catch (error) {
    log("Register failed", { error: String(error) });
  }
});

$("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    const data = await api(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({
          email: fd.get("email"),
          password: fd.get("password")
        })
      },
      false
    );
    state.token = data.accessToken;
    localStorage.setItem("pocketfund_token", state.token);
    setStatus();
    await bootstrap();
    log("Logged in.");
  } catch (error) {
    log("Login failed", { error: String(error) });
  }
});

$("logout-btn").addEventListener("click", () => {
  state.token = "";
  localStorage.removeItem("pocketfund_token");
  setStatus();
  log("Logged out.");
});

$("account-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    await api("/accounts", {
      method: "POST",
      body: JSON.stringify({
        name: fd.get("name"),
        type: fd.get("type")
      })
    });
    await loadAccounts();
    log("Account created.");
  } catch (error) {
    log("Create account failed", { error: String(error) });
  }
});

$("fund-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    await api("/funds", {
      method: "POST",
      body: JSON.stringify({
        name: fd.get("name"),
        description: fd.get("description") || undefined,
        monthlyAmount: Number(fd.get("monthlyAmount") || 0) || undefined,
        cycleDay: Number(fd.get("cycleDay") || 1)
      })
    });
    await loadFunds();
    log("Fund created.");
  } catch (error) {
    log("Create fund failed", { error: String(error) });
  }
});

$("tx-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const fundId = fd.get("fundId");
  const actionType = fd.get("actionType");
  try {
    await api(`/funds/${fundId}/${actionType}`, {
      method: "POST",
      body: JSON.stringify({
        accountId: fd.get("accountId"),
        amount: Number(fd.get("amount")),
        description: fd.get("description") || undefined
      })
    });
    await loadTransactions();
    log(`Transaction submitted: ${actionType}`);
  } catch (error) {
    log("Submit transaction failed", { error: String(error) });
  }
});

$("query-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  state.query.fundId = String(fd.get("fundId"));
  state.query.type = String(fd.get("type") || "");
  state.query.startAt = toIsoLocal(String(fd.get("startAt") || ""));
  state.query.endAt = toIsoLocal(String(fd.get("endAt") || ""));
  state.query.pageSize = Number(fd.get("pageSize") || 20);
  state.query.page = 1;
  try {
    await loadTransactions();
    log("Loaded transactions.");
  } catch (error) {
    log("Load transactions failed", { error: String(error) });
  }
});

$("prev-page").addEventListener("click", async () => {
  if (state.query.page <= 1) return;
  state.query.page -= 1;
  await loadTransactions();
});

$("next-page").addEventListener("click", async () => {
  state.query.page += 1;
  await loadTransactions();
});

void bootstrap();
