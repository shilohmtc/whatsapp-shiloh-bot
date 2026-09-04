from pathlib import Path

RULES = Path('docs/SHILOH_CONTROL_RULES.md')
CI = Path('.github/workflows/ci.yml')
TEST = Path('tests/control-clean-change-gate.test.js')
SELF = Path('scripts/control-temp-708-apply.py')
WORKFLOW = Path('.github/workflows/control-temp-708.yml')

rules = RULES.read_text()

pointer_anchor = """- last completed verification/release gate;\n- exact next executable action;\n- completed/do-not-redo state;\n- any separate authorization/release gate;\n- whether any owner action is actually required.\n"""
pointer_replacement = """- last completed verification/release gate;\n- exact next executable action;\n- compact **Clean Change** record for meaningful implementation units: existing authority reused; why the change is the smallest practical solution; permanent vs temporary artifacts; duplicate-authority judgment; one-year maintenance judgment; replacement/retirement disposition;\n- completed/do-not-redo state;\n- any separate authorization/release gate;\n- whether any owner action is actually required.\n"""
assert rules.count(pointer_anchor) == 1, 'durable pointer anchor drifted'
rules = rules.replace(pointer_anchor, pointer_replacement)

simplicity_anchor = """Stable invariants belong in code. Changeable business policy belongs in canonical data/config. Runtime authority must be capability-driven and data-configured, never person-name hard-coded. Domain scopes/capabilities must not silently grant unrelated domains.\n\n## 9. Project Tracker and Master Status reconciliation\n"""
clean_change = """Stable invariants belong in code. Changeable business policy belongs in canonical data/config. Runtime authority must be capability-driven and data-configured, never person-name hard-coded. Domain scopes/capabilities must not silently grant unrelated domains.\n\n### Clean Change and Complexity Gate\n\nFor every meaningful implementation change, Shiloh Control must answer the following before implementation and again before merge/release/reconciliation judgment. `No` or `nothing` are valid answers; do not manufacture cleanup work merely to satisfy the gate.\n\n1. **Reuse** — what existing canonical authority, service, queue, datastore, capability, route or presentation surface can be extended instead of creating another one?\n2. **Smallest change** — is there a materially smaller safe solution that satisfies the authorized acceptance criteria?\n3. **Permanent vs temporary** — which artifacts deliberately belong on `main`, and which exist only to execute, diagnose, migrate or prove the change?\n4. **Authority duplication** — does the change create another sender, queue, scheduler, datastore, permission source, business-rule source, API authority or overlapping operator surface for something Shiloh already owns? If so, consolidate or justify why coexistence is intentional.\n5. **One-year test** — would Shiloh deliberately choose to own and maintain this code or process a year from now, given its operational value and failure surface?\n6. **Retirement** — what existing code, configuration, surface or process can now be removed, consolidated or explicitly scheduled for retirement because the new capability supersedes it?\n\nTemporary Control engineering artifacts must be unmistakable and branch-only. Use `.control-temp/` for temporary directories or `control-temp-*` names for temporary files under `.github/workflows/` and `scripts/`. These artifacts must be removed before a release PR and must never remain on release `main` unless they are deliberately reclassified as permanent with an explicit Clean Change justification and renamed accordingly.\n\nWhen a new capability overlaps an older one, record exactly one replacement disposition:\n\n- **REPLACES NOW** — remove the superseded path in the same controlled unit;\n- **COEXISTS FOR A REASON** — both remain because they serve distinct, stated operational jobs;\n- **REPLACES LATER** — identify the concrete future unit or event that permits retirement, and reassess at that boundary.\n\nCI may mechanically enforce only facts it can know reliably, such as forbidden temporary-artifact conventions or stable security invariants. Architectural duplication, one-year value and retirement judgment remain Shiloh Control review responsibilities; do not build a generic architecture linter to imitate judgment.\n\nTerminal reconciliation includes a deletion/consolidation pass: remove execution scaffolding, superseded helpers and dead flags/config where safe; record intentionally permanent technical-only tooling; and preserve deferred retirement only when a named dependency justifies it. Leaving Shiloh no more complex than necessary is part of the definition of complete.\n\n## 9. Project Tracker and Master Status reconciliation\n"""
assert rules.count(simplicity_anchor) == 1, 'simplicity anchor drifted'
rules = rules.replace(simplicity_anchor, clean_change)
RULES.write_text(rules)

ci = CI.read_text()
ci_anchor = """      - name: Run focused controlled release migration tests\n        run: npm run test:controlled-release-migration\n      - name: Run focused SchedulingTimeline parity tests\n"""
ci_replacement = """      - name: Run focused controlled release migration tests\n        run: npm run test:controlled-release-migration\n      - name: Run focused Clean Change hygiene test\n        run: node --test tests/control-clean-change-gate.test.js\n      - name: Run focused SchedulingTimeline parity tests\n"""
assert ci.count(ci_anchor) == 1, 'CI anchor drifted'
CI.write_text(ci.replace(ci_anchor, ci_replacement))

TEST.write_text(r'''const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

function forbiddenTemporaryArtifacts() {
  const found = [];
  const tempDir = path.join(root, '.control-temp');
  if (fs.existsSync(tempDir)) found.push('.control-temp/');

  for (const [directory, prefix] of [
    ['.github/workflows', 'control-temp-'],
    ['scripts', 'control-temp-'],
  ]) {
    const absolute = path.join(root, directory);
    if (!fs.existsSync(absolute)) continue;
    for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
      if (entry.name.startsWith(prefix)) found.push(`${directory}/${entry.name}`);
    }
  }
  return found.sort();
}

test('canonical governance makes Clean Change part of meaningful implementation and completion', () => {
  const rules = read('docs/SHILOH_CONTROL_RULES.md');
  assert.match(rules, /### Clean Change and Complexity Gate/);
  for (const marker of [
    '**Reuse**', '**Smallest change**', '**Permanent vs temporary**',
    '**Authority duplication**', '**One-year test**', '**Retirement**',
    '**REPLACES NOW**', '**COEXISTS FOR A REASON**', '**REPLACES LATER**',
  ]) assert.ok(rules.includes(marker), `missing Clean Change marker: ${marker}`);
  assert.match(rules, /before implementation and again before merge\/release\/reconciliation judgment/);
  assert.match(rules, /Leaving Shiloh no more complex than necessary is part of the definition of complete/);
  assert.match(rules, /compact \*\*Clean Change\*\* record/);
});

test('release tree contains no explicitly temporary Control engineering artifacts', () => {
  assert.deepEqual(forbiddenTemporaryArtifacts(), []);
});

test('canonical CI runs the focused Clean Change hygiene gate', () => {
  const ci = read('.github/workflows/ci.yml');
  assert.match(ci, /Run focused Clean Change hygiene test/);
  assert.match(ci, /node --test tests\/control-clean-change-gate\.test\.js/);
});
''')

# Temporary execution artifacts remove themselves before verification/PR.
if WORKFLOW.exists(): WORKFLOW.unlink()
if SELF.exists(): SELF.unlink()
