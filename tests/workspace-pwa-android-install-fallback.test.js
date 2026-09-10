'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { workspacePwaClientScript } = require('../src/presentation/workspacePwa');

test('#816 Android always gets an install path when not standalone', () => {
  const client = workspacePwaClientScript();
  assert.match(client, /function androidDevice\(\).*Android/s);
  assert.match(client, /if\(!deferredInstallPrompt&&!androidDevice\(\)\)return/);
  assert.match(client, /Install Shiloh on this Android phone/);
  assert.match(client, /tap the ⋮ menu, then choose Install app or Add to Home screen/);
  assert.match(client, /if\(iosDevice\(\)\|\|standalone\(\)\)return/);
});

test('#816 native Chromium prompt upgrades the Android fallback instead of duplicating it', () => {
  const client = workspacePwaClientScript();
  const listenerAt = client.indexOf("addEventListener('beforeinstallprompt'");
  const initialRenderAt = client.indexOf('installGuidance();installAction();');
  assert.ok(listenerAt >= 0 && initialRenderAt > listenerAt, 'capture listener must be installed before fallback rendering');
  assert.match(client, /beforeinstallprompt[\s\S]*event\.preventDefault\(\)[\s\S]*deferredInstallPrompt=event[\s\S]*removeInstallCard\('\[data-shiloh-browser-install\]'\)[\s\S]*installAction\(\)/);
  assert.match(client, /button\.textContent='Install Shiloh'/);
  assert.match(client, /await prompt\.prompt\(\)/);
});

test('#816 installed and iPhone paths remain bounded', () => {
  const client = workspacePwaClientScript();
  assert.match(client, /Add Shiloh to this iPhone/);
  assert.match(client, /Tap Share, choose Add to Home Screen, then tap Add/);
  assert.match(client, /appinstalled[\s\S]*removeInstallCard\('\[data-shiloh-browser-install\]'\)[\s\S]*removeInstallCard\('\[data-shiloh-ios-install\]'\)/);
  assert.match(client, /document\.documentElement\.dataset\.shilohPwaMode='standalone'/);
  assert.doesNotMatch(client, /localStorage|sessionStorage|indexedDB|document\.cookie|Authorization|Bearer\s|pushManager|showNotification/i);
});
