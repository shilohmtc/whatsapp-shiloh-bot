const test = require('node:test');
const assert = require('node:assert/strict');

const { workspacePwaClientScript } = require('../src/presentation/workspacePwa');

test('#794 iPhone browser install guidance is explicit and disappears in standalone mode', () => {
  const client = workspacePwaClientScript();

  assert.match(client, /iPhone\|iPad\|iPod/);
  assert.match(client, /navigator\.platform==='MacIntel'/);
  assert.match(client, /maxTouchPoints/);
  assert.match(client, /data-shiloh-ios-install/);
  assert.match(client, /Add Shiloh to this iPhone/);
  assert.match(client, /Tap Share, choose Add to Home Screen, then tap Add/);
  assert.match(client, /if\(!iosDevice\(\)\|\|standalone\(\)/);
  assert.match(client, /display-mode: standalone/);
  assert.match(client, /navigator\.standalone===true/);
});

test('#794 iPhone install guidance is presentation-only and stores no install or auth authority', () => {
  const client = workspacePwaClientScript();

  assert.doesNotMatch(client, /localStorage|sessionStorage|indexedDB|document\.cookie/i);
  assert.doesNotMatch(client, /beforeinstallprompt|PushManager|showNotification/i);
  assert.doesNotMatch(client, /INSERT INTO|UPDATE\s+staff_|DELETE FROM|Authorization|Bearer\s/i);
});
