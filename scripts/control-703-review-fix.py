from pathlib import Path


def replace_once(path, old, new):
    p = Path(path)
    text = p.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one replacement target, found {count}')
    p.write_text(text.replace(old, new, 1))


booking = 'src/services/customerBookingConfirmation.js'
replace_once(
    booking,
    """       AND next_attempt_at<=NOW()
       AND (COALESCE(last_error,'')<>'provider_async_failed'
         OR attempt_count<${MAX_AUTOMATIC_ASYNC_PROVIDER_ATTEMPTS})
""",
    """       AND next_attempt_at<=NOW()
       AND provider_delivered_at IS NULL
       AND provider_read_at IS NULL
       AND (provider_sent_at IS NULL
         OR (provider_failed_at IS NOT NULL AND provider_failed_at>provider_sent_at))
       AND (COALESCE(last_error,'')<>'provider_async_failed'
         OR attempt_count<${MAX_AUTOMATIC_ASYNC_PROVIDER_ATTEMPTS})
""",
)

test_path = 'tests/booking-confirmation-async-provider-retry.test.js'
replace_once(
    test_path,
    """  assert.match(source, /attempt_count<\\$\\{MAX_AUTOMATIC_ASYNC_PROVIDER_ATTEMPTS\\}/);
  assert.match(source, /automaticProviderRecovery\\?\\{recovery:true\\}:\\{\\}/);
""",
    """  assert.match(source, /attempt_count<\\$\\{MAX_AUTOMATIC_ASYNC_PROVIDER_ATTEMPTS\\}/);
  assert.match(source, /automaticProviderRecovery\\?\\{recovery:true\\}:\\{\\}/);
  const scanner = source.slice(source.indexOf('async function flushCustomerBookingConfirmations'), source.indexOf('function startCustomerBookingConfirmationScheduler'));
  assert.match(scanner, /provider_delivered_at IS NULL/);
  assert.match(scanner, /provider_read_at IS NULL/);
  assert.match(scanner, /provider_failed_at>provider_sent_at/);
""",
)
