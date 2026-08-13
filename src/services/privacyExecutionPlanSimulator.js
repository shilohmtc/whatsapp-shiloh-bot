const SIMULATION_ONLY = true;
const SUPPORTED_ACTIONS = new Set(['retain', 'deidentify', 'erase', 'manual_review_required']);
const IDENTITY_FIELD_PATTERN = /(?:name|phone|mobile|email|contact|address|dob|birth|normalized_value|previous_response_id)$/i;

function clone(value) { return structuredClone(value); }
function baseResult(status) { return { status, simulationOnly: SIMULATION_ONLY, executionReady: false, destructiveActionAllowed: false }; }
function block(reason, extra = {}) { return { ...baseResult('blocked'), blockingReasons: [reason], ...extra }; }

function validateInputs(plan, fixture) {
  if (!fixture || fixture.synthetic !== true) return 'synthetic_fixture_required';
  if (!fixture.tables || typeof fixture.tables !== 'object' || Array.isArray(fixture.tables)) return 'synthetic_tables_required';
  if (!plan || plan.status !== 'preview_only') return 'preview_plan_required';
  if (plan.destructiveActionAllowed !== false) return 'non_destructive_preview_required';
  if (!Array.isArray(plan.decisions)) return 'plan_decisions_required';
  return null;
}

function deidentifyRecord(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return record;
  const copy = clone(record);
  for (const key of Object.keys(copy)) {
    if (key === 'id' || key === 'client_id') continue;
    if (IDENTITY_FIELD_PATTERN.test(key)) copy[key] = '[simulated-deidentified]';
  }
  return copy;
}

function prepareSteps(plan, fixture) {
  const steps = [];
  for (const item of plan.decisions) {
    const action = item?.decision?.action;
    const count = Number(item?.count || 0);
    const table = String(item?.table || '');
    if (!SUPPORTED_ACTIONS.has(action)) return { error: 'unsupported_action' };
    if (count < 0 || !Number.isFinite(count)) return { error: 'invalid_decision_count' };
    if (action === 'manual_review_required' && count > 0) return { error: 'manual_review_required' };
    if (count > 0 && !Array.isArray(fixture.tables[table])) return { error: 'synthetic_table_missing' };
    if (count > 0 && fixture.tables[table].length < count) return { error: 'synthetic_row_count_mismatch' };
    steps.push({ table, action, count });
  }
  return { steps };
}

function applyStep(state, step) {
  if (step.count === 0 || step.action === 'retain') return;
  const rows = state.tables[step.table];
  if (step.action === 'deidentify') {
    state.tables[step.table] = rows.map((row, index) => index < step.count ? deidentifyRecord(row) : row);
    return;
  }
  if (step.action === 'erase') state.tables[step.table] = rows.slice(step.count);
}

function simulatePrivacyExecutionPlan(plan, fixture, options = {}) {
  const inputError = validateInputs(plan, fixture);
  if (inputError) {
    if (inputError === 'synthetic_fixture_required') throw new Error('A synthetic fixture is required for privacy execution simulation.');
    return block(inputError);
  }
  const prepared = prepareSteps(plan, fixture);
  if (prepared.error) return block(prepared.error);
  const before = clone(fixture);
  const working = clone(fixture);
  const journal = [];
  try {
    for (let index = 0; index < prepared.steps.length; index += 1) {
      const stepNumber = index + 1;
      const step = prepared.steps[index];
      if (Number(options.failAtStep || 0) === stepNumber) {
        const injected = new Error(`Synthetic failure injected at step ${stepNumber}.`);
        injected.code = 'SIMULATED_STEP_FAILURE';
        throw injected;
      }
      applyStep(working, step);
      journal.push({ step: stepNumber, ...step, simulated: true });
    }
    return { ...baseResult('simulated_commit'), rolledBack: false, before, after: working, journal };
  } catch (error) {
    return {
      ...baseResult('simulated_rollback'), rolledBack: true, before, after: before, journal,
      failure: { code: error?.code || 'SIMULATED_FAILURE', message: String(error?.message || error) },
    };
  }
}

module.exports = { SIMULATION_ONLY, simulatePrivacyExecutionPlan };
