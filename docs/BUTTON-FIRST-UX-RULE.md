# Shiloh OS — Button-first client UX rule

Updated: 2026-08-15

When the next sensible client actions are known and WhatsApp supports an appropriate interactive control, Shiloh should expose those actions as buttons or list choices. Natural-language commands remain supported as equivalent fallbacks, not as the primary discovery mechanism.

Implementation guidance:
- prefer interactive controls for small finite action sets;
- keep natural-language equivalents for resilience and accessibility;
- do not force buttons where free text is genuinely needed (for example exact times, names or open-ended preferences);
- preserve canonical backend routes: buttons must map into the same deterministic command handlers used by natural language, never duplicate mutation logic;
- when WhatsApp interaction limits prevent every possible action from appearing at once, prioritize the highest-value next actions and retain natural-language/menu escape fallbacks;
- provider/template approval and button availability are separate concerns: ordinary in-session interactive controls do not relax any template or delivery evidence gate.

Current post-confirmation implementation:
- confirmed-booking follow-up already exposes `Book another`, `My appointments`, and `Main menu` as interactive buttons;
- `My appointments` is being normalized to interactive next actions rather than relying on memorized command text;
- generic greeting navigation and `Book another treatment` natural language remain supported as fallbacks into the same canonical client flows.
