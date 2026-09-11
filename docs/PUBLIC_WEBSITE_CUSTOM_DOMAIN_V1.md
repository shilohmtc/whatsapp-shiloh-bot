# Public Website + Custom Domain V1 release contract

Issue: #882

## Runtime decision

V1 deliberately reuses the existing Render web service, database, repository and canonical `/book` booking route. Engineering A does **not** rename the Render service, create a second host, change DNS, or change provider callbacks.

The existing Render service name/default hostname remain compatibility identifiers until Shiloh Control performs a separate release-time dependency check. A public-site release does not require a Render rename.

## Canonical authority

- `/book` remains the canonical public booking path and booking presentation/runtime seam.
- Public Treatments calls `getPublicServiceCatalogue()` and displays its returned active client-bookable service/pricing projection.
- Public website code does not own availability, booking validation, client identity, practitioner eligibility, provider messaging, services, or prices.
- No migration, datastore, CMS, second catalogue, or second booking engine is introduced.

## Custom-domain sequence

Custom-domain work is a release/configuration step after the website PR is accepted. Control should execute it in this order:

1. Confirm the deployed website and `/book` are healthy on the existing Render hostname at the exact released SHA.
2. Inventory current absolute-host/callback dependencies again at release time; do not infer that a Render display-name or slug change is required.
3. Prefer adding the intended custom domain to the existing Render web service rather than creating a second service.
4. Obtain the exact DNS target/verification records from Render.
5. The domain owner applies the required DNS record(s) where external-account action is required.
6. Wait for Render domain verification and managed TLS issuance; do not remove the default Render hostname during validation.
7. Prove HTTPS Home → Treatments → `/book` on Phone and Desktop and verify webhook/provider callbacks remain unaffected.
8. Only after that proof, decide separately whether a Render service display-name/slug rename creates enough operational value to justify compatibility risk. A rename is not part of #882 Engineering A execution.

## Rollback

If custom-domain verification fails, remove or correct only the new custom-domain/DNS mapping and continue serving the exact released application through the existing Render hostname. Application code and canonical booking authority require no rollback solely because DNS/TLS activation fails.
