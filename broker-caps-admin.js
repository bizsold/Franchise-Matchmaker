/* Backend-backed weekly cap controls. Uses the same access model as Brokers Admin. */
window.BrokerCapAdmin = (() => {
  let client, getAdminName, settings, rows = [], loading = false;
  const byId = (id) => document.getElementById(id);
  const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  function statusFor(row) {
    if (!settings.weekly_caps_enabled) return 'Tracking only';
    if (row.weekly_cap === null) return 'Unlimited';
    const remaining = Math.max(0, row.weekly_cap - Number(row.weekly_used));
    return remaining ? `${remaining} remaining` : 'At cap';
  }
  function summary() {
    const reset = rows[0]?.resets_at;
    const resetText = reset ? new Intl.DateTimeFormat('en-US', {timeZone:'America/New_York',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'}).format(new Date(reset)) : 'next Monday at midnight Eastern';
    byId('weekly-cap-feature-status').textContent = `${settings.weekly_caps_enabled ? 'On — limits are enforced for every booking.' : 'Off — bookings are counted, but weekly limits are not enforced.'} Resets ${resetText}. Blank limit = unlimited; 0 = no new bookings.`;
    document.querySelectorAll('[data-cap-status]').forEach((cell) => {
      const row = rows[Number(cell.dataset.capStatus)];
      if (row) cell.textContent = statusFor(row);
    });
  }
  function disableAll(disabled) {
    byId('weekly-caps-enabled').disabled = disabled;
    byId('weekly-cap-feature-save').disabled = disabled;
    document.querySelectorAll('[data-cap-input], [data-cap-save]').forEach((node) => { node.disabled = disabled; });
  }
  async function load() {
    if (loading) return;
    loading = true; disableAll(true); byId('weekly-cap-refresh').disabled = true;
    byId('weekly-cap-message').textContent = '';
    try {
      if (!client) throw new Error('No database connection.');
      const [feature, usage] = await Promise.all([
        client.from('broker_cap_settings').select('*').eq('id', true).single(),
        client.rpc('get_broker_weekly_usage')
      ]);
      if (feature.error || usage.error) throw feature.error || usage.error;
      if (!feature.data || !Array.isArray(usage.data)) throw new Error('Incomplete capacity response.');
      settings = feature.data; rows = usage.data.sort((a,b)=>a.broker_name.localeCompare(b.broker_name));
      byId('weekly-caps-enabled').checked = settings.weekly_caps_enabled;
      byId('weekly-cap-table').innerHTML = rows.length ? `<table><thead><tr><th>Broker</th><th>This week</th><th>Weekly limit</th><th>Status</th><th>Action</th></tr></thead><tbody>${rows.map((row,index)=>`<tr><td>${escape(row.broker_name)}</td><td>${Number(row.weekly_used)}</td><td><input aria-label="Weekly limit for ${escape(row.broker_name)}" data-cap-input="${index}" type="number" min="0" max="2147483647" step="1" placeholder="Unlimited" value="${row.weekly_cap === null ? '' : Number(row.weekly_cap)}" style="width:110px" /></td><td data-cap-status="${index}">${escape(statusFor(row))}</td><td><button type="button" data-cap-save="${index}">Save limit</button></td></tr>`).join('')}</tbody></table>` : '<p>No brokers are currently configured.</p>';
      summary(); disableAll(false);
    } catch (error) {
      byId('weekly-cap-message').textContent = `Could not load weekly controls: ${error.message || 'please retry'}`;
      byId('weekly-cap-feature-status').textContent = 'Current backend setting could not be verified. Refresh to retry.';
    } finally { loading = false; byId('weekly-cap-refresh').disabled = false; }
  }
  async function saveFeature(event) {
    event.preventDefault(); if (!settings || loading) return;
    const enabled = byId('weekly-caps-enabled').checked;
    loading = true; disableAll(true); byId('weekly-cap-refresh').disabled = true;
    try {
      const result = await client.rpc('set_broker_cap_settings', {p_enabled:enabled,p_revision:settings.revision,p_admin_name:getAdminName()});
      if (result.error) throw result.error;
      settings = result.data;
      byId('weekly-caps-enabled').checked = settings.weekly_caps_enabled;
      summary(); byId('weekly-cap-message').textContent = `Weekly cap enforcement ${settings.weekly_caps_enabled ? 'enabled' : 'disabled'} and saved.`;
    } catch (error) {
      byId('weekly-caps-enabled').checked = settings.weekly_caps_enabled;
      byId('weekly-cap-message').textContent = `Not saved: ${error.message || 'please retry'}`;
    } finally { loading = false; disableAll(false); byId('weekly-cap-refresh').disabled = false; }
  }
  async function saveLimit(event) {
    const button = event.target.closest('[data-cap-save]'); if (!button || loading) return;
    const index = Number(button.dataset.capSave), row = rows[index];
    const input = document.querySelector(`[data-cap-input="${index}"]`);
    const raw = input.value.trim(), cap = raw === '' ? null : Number(raw);
    if (!input.checkValidity() || (cap !== null && (!Number.isInteger(cap) || cap < 0 || cap > 2147483647))) {
      byId('weekly-cap-message').textContent = 'Enter a whole-number limit from 0 to 2147483647, or leave it blank for unlimited.'; return;
    }
    loading = true; disableAll(true); byId('weekly-cap-refresh').disabled = true;
    try {
      const result = await client.rpc('set_broker_weekly_cap',{p_broker_name:row.broker_name,p_cap:cap,p_revision:row.cap_revision,p_admin_name:getAdminName()});
      if (result.error) throw result.error;
      row.weekly_cap = result.data.weekly_cap; row.cap_revision = result.data.revision;
      summary(); byId('weekly-cap-message').textContent = `${row.broker_name}: ${cap === null ? 'unlimited' : `${cap} bookings per week`} saved.${settings.weekly_caps_enabled ? '' : ' Enforcement is currently off.'}`;
    } catch (error) { byId('weekly-cap-message').textContent = `Not saved: ${error.message || 'please retry'}`; }
    finally { loading = false; disableAll(false); byId('weekly-cap-refresh').disabled = false; }
  }
  async function init(options) {
    client = options.client; getAdminName = options.getAdminName;
    byId('weekly-cap-feature-form').addEventListener('submit',saveFeature);
    byId('weekly-cap-refresh').addEventListener('click',load);
    byId('weekly-cap-table').addEventListener('click',saveLimit);
    await load();
  }
  return {init};
})();
