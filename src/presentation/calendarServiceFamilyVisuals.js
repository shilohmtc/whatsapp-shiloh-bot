const SERVICE_FAMILIES = Object.freeze({
  facial_skin: Object.freeze({
    key: 'facial_skin',
    label: 'Facial / skin',
    icon: 'sparkle',
  }),
  foot_pedicure: Object.freeze({
    key: 'foot_pedicure',
    label: 'Foot / pedicure',
    icon: 'foot',
  }),
  targeted_therapeutic: Object.freeze({
    key: 'targeted_therapeutic',
    label: 'Targeted / therapeutic',
    icon: 'botanical',
  }),
  massage_body: Object.freeze({
    key: 'massage_body',
    label: 'Massage / body treatment',
    icon: 'massage',
  }),
  permanent_makeup_beauty: Object.freeze({
    key: 'permanent_makeup_beauty',
    label: 'Permanent makeup / beauty',
    icon: 'beauty',
  }),
});

// Restrained icon-stroke accents only. Text, cards, practitioner identity and
// appointment status retain the Calendar palette and remain independent.
const SERVICE_FAMILY_ACCENTS = Object.freeze({
  facial_skin: '#8A6518',
  foot_pedicure: '#9A503C',
  targeted_therapeutic: '#3F6653',
  massage_body: '#3F6785',
  permanent_makeup_beauty: '#80506E',
});

// Canonical catalogue category authority. Historical spelling variants are
// enumerated deliberately because catalogue polish did not change every
// environment atomically. This is exact matching, never fuzzy name inference.
const CATEGORY_FAMILY = new Map([
  ['Pedicures & Foot Care', 'foot_pedicure'],
  ['Facials', 'facial_skin'],
  ['Microneedling', 'facial_skin'],
  ['Mikroneedling', 'facial_skin'],
  ['Profosma Jet Plasma', 'facial_skin'],
  ['Plasma Fybroblast Consultation', 'facial_skin'],
  ['Plasma Fybroblast Prices', 'facial_skin'],
  ['1. SQT BioMicroneedling', 'facial_skin'],
  ['1. SQT BoiMicroneedling', 'facial_skin'],
  ['2. SQT BioMicroneedling', 'facial_skin'],
  ['HIFU', 'facial_skin'],
  ['Massage', 'massage_body'],
  ['Ozone & Far Infrared', 'targeted_therapeutic'],
  ['Neo Pelvic Therapy', 'targeted_therapeutic'],
  ['Vaginal Tightening & Rejuvenation', 'targeted_therapeutic'],
  ['Permanent Makeup', 'permanent_makeup_beauty'],
  ['Permanant Makeup', 'permanent_makeup_beauty'],
  ['Facial Waxing', 'permanent_makeup_beauty'],
]);

function externalKey(source, id) {
  const cleanSource = String(source || '').trim();
  const cleanId = String(id || '').trim();
  return cleanSource && cleanId ? `${cleanSource}:${cleanId}` : null;
}

// The Massage catalogue contains both broad body treatments and deliberately
// targeted treatments. Stable external identities keep those exceptions
// explicit and auditable without classifying display names at runtime.
const SERVICE_FAMILY_OVERRIDE = new Map([
  ['goldie:9f2f6452-f1ce-4525-88f2-3dc57f74caa6', 'targeted_therapeutic'], // Quick Relief: Back & Neck
  ['goldie:2d5b6147-ee9f-4a97-8e27-6270751c2673', 'targeted_therapeutic'], // Targeted Area-Specific Sports Massage
  ['goldie:b5c96105-f534-406d-89ec-68e78c65cf8b', 'targeted_therapeutic'], // Upper Back, Neck & Jaw Release (historical)
  ['goldie:b39dcaf1-7894-40e0-8a51-c7ab4eba553a', 'targeted_therapeutic'], // Lower Back, Hip & Psoas Release
  ['goldie:409ef0e8-2063-47b2-86db-ca0af30787de', 'targeted_therapeutic'], // Cupping Area Specific
  ['goldie:6a0c9c5e-d7e7-4a82-8795-e8281a0bd526', 'targeted_therapeutic'], // Bamboo Sports Massage - Area Specific
  ['goldie:729fc549-c353-48ac-9cbc-abba4cc2ed66', 'foot_pedicure'], // Renew & Revive Leg and Foot Massage
]);

const ICON_PATHS = Object.freeze({
  sparkle: '<path d="M12 2.8l1.1 3.1L16.2 7l-3.1 1.1-1.1 3.1-1.1-3.1L7.8 7l3.1-1.1L12 2.8Z"/><path d="M5.7 11.4l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7.7-1.9Z"/><path d="M17.2 12.2l.5 1.3 1.3.5-1.3.5-.5 1.3-.5-1.3-1.3-.5 1.3-.5.5-1.3Z"/>',
  foot: '<path d="M10.2 8.2c-1.8 1-3 3.2-3.3 5.7-.3 2.4.7 4.4 2.6 5 2 .7 4.2-.4 4.9-2.4.6-1.8-.2-3.2-1.1-4.6-.9-1.4-1.4-2.7-1.2-4.1.2-1.1-.9-1.3-1.9.4Z"/><circle cx="13.2" cy="4.2" r="1.35"/><circle cx="16" cy="5.2" r="1.15"/><circle cx="18" cy="7.2" r=".95"/><circle cx="19" cy="9.5" r=".75"/>',
  botanical: '<path d="M5 18.5c4.4-1.8 7.5-5 9.7-9.8"/><path d="M8.1 15.8C5.2 15.9 3.5 14.6 3 12c2.7-.7 4.9.2 5.8 2.5"/><path d="M11.5 12.4c-1.7-2.4-1.4-4.5.7-6.3 2 1.9 2.2 4.2.4 6.4"/><path d="M14.3 8.8c.2-2.8 1.7-4.4 4.4-4.8.5 2.8-.6 4.8-3.1 5.8"/>',
  massage: '<circle cx="12" cy="5.3" r="2.3"/><path d="M6.2 18.7c.7-4.8 2.5-7.3 5.8-7.3s5.1 2.5 5.8 7.3"/><path d="M3.5 15.2c1.6-.2 2.9.3 3.8 1.6M20.5 15.2c-1.6-.2-2.9.3-3.8 1.6"/>',
  beauty: '<path d="M8.2 20h7.6M9.3 17.3h5.4V20H9.3zM10 9.5h4v7.8h-4zM10 9.5V5.2l4-2v6.3"/><path d="M14 3.2v6.3"/>',
});

function resolveServiceFamily(service = {}) {
  const key = externalKey(service.externalSource ?? service.external_source, service.externalId ?? service.external_id);
  const familyKey = (key && SERVICE_FAMILY_OVERRIDE.get(key))
    || CATEGORY_FAMILY.get(String(service.categoryName ?? service.category_name ?? '').trim())
    || null;
  return familyKey ? SERVICE_FAMILIES[familyKey] : null;
}

function renderServiceFamilyIcon(service, { className = '' } = {}) {
  const family = typeof service === 'string' ? SERVICE_FAMILIES[service] : resolveServiceFamily(service);
  if (!family) return '';
  const classes = ['service-family-icon', className].filter(Boolean).join(' ');
  return `<svg class="${classes}" data-service-family="${family.key}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[family.icon]}</svg>`;
}

function desktopAppointmentCardDensityCss() {
  return `@media(min-width:701px){
.workspace-main .positioned-event{container-type:size}
.workspace-main .positioned-event .event-card[data-kind="appointment"] .event-operation{min-width:44px!important;min-height:32px!important;padding:4px 8px!important}
@container (max-width:260px){
.workspace-main .positioned-event .event-card[data-kind="appointment"]{padding:4px 5px!important}
.workspace-main .positioned-event .event-card[data-kind="appointment"] .kind-pill{display:none!important}
.workspace-main .positioned-event .event-card[data-kind="appointment"] .event-card-top{min-height:12px;padding-right:54px!important}
.workspace-main .positioned-event .event-card[data-kind="appointment"] .event-time{line-height:1.05}
.workspace-main .positioned-event .event-card[data-kind="appointment"] h4{margin:1px 0!important;padding-right:54px!important;line-height:1.08!important;white-space:nowrap;overflow:hidden!important;text-overflow:ellipsis}
.workspace-main .positioned-event .event-card[data-kind="appointment"] .event-client-mobile{margin:0!important;padding-right:54px!important;line-height:1.05!important;white-space:nowrap;overflow:hidden!important;text-overflow:ellipsis}
.workspace-main .positioned-event .event-card[data-kind="appointment"] .event-meta{display:grid!important;gap:1px!important;margin:2px 0 0!important;padding-right:0!important;line-height:1.08!important}
.workspace-main .positioned-event .event-card[data-kind="appointment"] .event-detail-separator{display:none!important}
.workspace-main .positioned-event .event-card[data-kind="appointment"] .event-service-context{display:flex!important;align-items:flex-start!important;gap:3px!important;min-width:0}
.workspace-main .positioned-event .event-card[data-kind="appointment"] .service-family-icon{width:12px!important;height:12px!important;flex:0 0 12px!important}
.workspace-main .positioned-event .event-card[data-kind="appointment"] .event-service-context>span:last-child{display:-webkit-box;overflow:hidden;-webkit-box-orient:vertical;-webkit-line-clamp:2}
.workspace-main .positioned-event .event-card[data-kind="appointment"] .event-detail-separator+span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.workspace-main .positioned-event .event-card[data-kind="appointment"] .event-card-actions{top:3px!important;right:3px!important;bottom:auto!important;margin:0!important}
.workspace-main .positioned-event .event-card[data-kind="appointment"] .event-operation{min-width:44px!important;min-height:32px!important;padding:3px 8px!important}
}
@container (max-width:260px) and (max-height:60px){
.workspace-main .positioned-event .event-card[data-kind="appointment"] .event-meta{display:none!important}
}
@container (max-width:260px) and (min-height:61px) and (max-height:82px){
.workspace-main .positioned-event .event-card[data-kind="appointment"] .event-service-context>span:last-child{-webkit-line-clamp:1}
.workspace-main .positioned-event .event-card[data-kind="appointment"] .event-detail-separator+span{display:none!important}
}
}`;
}

function serviceFamilyAccentCss() {
  const accents = Object.entries(SERVICE_FAMILY_ACCENTS)
    .map(([familyKey, color]) => `.service-family-icon[data-service-family="${familyKey}"]{color:${color}}`)
    .join('');
  return `${accents}${desktopAppointmentCardDensityCss()}`;
}

function withServiceFamily(service = {}) {
  const family = resolveServiceFamily(service);
  return {
    ...service,
    serviceFamily: family ? { key: family.key, label: family.label, icon: family.icon } : null,
  };
}

module.exports = {
  SERVICE_FAMILIES,
  SERVICE_FAMILY_ACCENTS,
  CATEGORY_FAMILY,
  SERVICE_FAMILY_OVERRIDE,
  resolveServiceFamily,
  renderServiceFamilyIcon,
  serviceFamilyAccentCss,
  desktopAppointmentCardDensityCss,
  withServiceFamily,
  externalKey,
};
