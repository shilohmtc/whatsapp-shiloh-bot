const discovery = require('../services/clientDiscoveryPackages');

const COUPLES_AND_PACKAGES_ACTION_ID = 'client_massage_couples_packages';
const COUPLES_MASSAGE_ACTION_ID = 'client_couples_massage';
const SPORTS_PACKAGE_ACTION_ID = 'client_couples_packages_sports';
const MASSAGE_FIRST_PAGE_ACTION_ID = 'client_massage_treatments_page_1';
const SPORTS_PACKAGE_SLUG = discovery.SPORTS_PACKAGE_SLUG || 'sports-massage-monthly';

function clean(value = '') {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function money(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? `R${amount.toFixed(2).replace(/\.00$/, '')}` : 'Price on request';
}

function sportsPackage(packages = []) {
  return packages.find((pkg) => pkg?.slug === SPORTS_PACKAGE_SLUG) || null;
}

function buildCouplesAndPackagesInteractive(packages = []) {
  const pkg = sportsPackage(packages);
  const rows = [
    {
      id: COUPLES_MASSAGE_ACTION_ID,
      title: 'Couples Massage',
      description: 'Arrange a coordinated couples booking',
    },
  ];

  if (pkg) {
    rows.push({
      id: SPORTS_PACKAGE_ACTION_ID,
      title: 'Sports Massage Package',
      description: `${Number(pkg.sessions_included)} sessions • ${money(pkg.package_price)} • valid ${Number(pkg.validity_days)} days`,
    });
  }

  rows.push({
    id: MASSAGE_FIRST_PAGE_ACTION_ID,
    title: 'Back',
    description: 'Back to Massage Treatments',
  });

  return {
    type: 'list',
    body: '*Couples & Packages*\nChoose a special massage booking:',
    buttonText: 'Choose option',
    rows,
    sectionTitle: 'Couples & Packages',
  };
}

function couplesMassageInteractive() {
  return {
    type: 'button',
    body: '*Couples Massage*\n\nCouples bookings need coordinated practitioner and treatment-space availability. Please contact Shiloh on 066 239 9138 and the team will arrange the booking with you.\n\nNo booking has been created yet.',
    buttons: [
      { id: COUPLES_AND_PACKAGES_ACTION_ID, title: 'Back' },
    ],
  };
}

function decorateMassageTreatmentsInteractive(interactive) {
  if (!interactive || interactive.type !== 'list' || !Array.isArray(interactive.rows)) return interactive;
  if (!/^\*Massage Treatments\*/i.test(clean(interactive.body))) return interactive;
  if (!/Showing page 1 of \d+/i.test(String(interactive.body || ''))) return interactive;

  const rows = interactive.rows.filter((row) => row?.id !== 'client_massage_packages' && row?.id !== COUPLES_AND_PACKAGES_ACTION_ID);
  rows.unshift({
    id: COUPLES_AND_PACKAGES_ACTION_ID,
    title: 'Couples & Packages',
    description: 'Couples massage & massage packages',
  });

  return {
    ...interactive,
    body: String(interactive.body || '').replace('Choose a treatment, or open Massage Packages.', 'Choose a treatment, or open Couples & Packages.'),
    rows,
  };
}

function decorateSportsPackageDetail(interactive) {
  if (!interactive || interactive.type !== 'button' || !Array.isArray(interactive.buttons)) return interactive;
  const buttons = interactive.buttons.filter((button) => button?.id !== COUPLES_AND_PACKAGES_ACTION_ID);
  if (buttons.length < 3) buttons.push({ id: COUPLES_AND_PACKAGES_ACTION_ID, title: 'Back' });
  return { ...interactive, buttons };
}

const originalProcessClientDiscoveryMessage = discovery.processClientDiscoveryMessage;

discovery.processClientDiscoveryMessage = async function processClientDiscoveryMessageWithCouplesPackages(sender, text) {
  const raw = clean(text);

  if (raw === COUPLES_AND_PACKAGES_ACTION_ID || /^couples\s*(?:&|and)\s*packages$/i.test(raw)) {
    const packages = await discovery.activePackages();
    return { handled: true, interactive: buildCouplesAndPackagesInteractive(packages) };
  }

  if (raw === COUPLES_MASSAGE_ACTION_ID || /^couples massage$/i.test(raw)) {
    return { handled: true, interactive: couplesMassageInteractive() };
  }

  if (raw === SPORTS_PACKAGE_ACTION_ID) {
    const pkg = sportsPackage(await discovery.activePackages());
    if (!pkg) return { handled: true, reply: 'The Sports Massage Package is not currently active. Nothing has been booked.' };
    const { entitlement } = await discovery.activeEntitlementForPhone(sender, pkg.id);
    return { handled: true, interactive: decorateSportsPackageDetail(discovery.packageDetailInteractive(pkg, entitlement)) };
  }

  const result = await originalProcessClientDiscoveryMessage(sender, text);
  if (!result?.handled || !result.interactive) return result;
  return { ...result, interactive: decorateMassageTreatmentsInteractive(result.interactive) };
};

module.exports = {
  COUPLES_AND_PACKAGES_ACTION_ID,
  COUPLES_MASSAGE_ACTION_ID,
  SPORTS_PACKAGE_ACTION_ID,
  buildCouplesAndPackagesInteractive,
  couplesMassageInteractive,
  decorateMassageTreatmentsInteractive,
  decorateSportsPackageDetail,
};
