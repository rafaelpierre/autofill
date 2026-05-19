(function () {
  chrome.storage.local.get(['username', 'password', 'sites'], (data) => {
    const { username, password, sites } = data;
    if (!username || !password || !sites || sites.length === 0) return;

    const here = window.location.href;
    const site = sites.find(s => s.url && here.includes(s.url));
    if (!site) return;

    // --- tunable timings ---
    const POLL_INTERVAL = 300;   // ms between attempts to find fields
    const MAX_WAIT      = 10000; // ms total before giving up
    const SETTLE_DELAY  = 500;   // ms to wait after filling before submit

    function byXPath(expr) {
      if (!expr) return null;
      try {
        const r = document.evaluate(
          expr, document, null,
          XPathResult.FIRST_ORDERED_NODE_TYPE, null
        );
        return r.singleNodeValue;
      } catch (e) {
        console.warn('Autofill: invalid XPath:', expr, e);
        return null;
      }
    }

    function findFields() {
      const pwField =
        byXPath(site.xpPass) ||
        document.querySelector('input[type="password"]');

      const userField =
        byXPath(site.xpUser) ||
        document.querySelector('input[type="email"]') ||
        document.querySelector('input[type="text"]') ||
        document.querySelector('input[name*="user" i]') ||
        document.querySelector('input[name*="email" i]');

      return { pwField, userField };
    }

    // Poll until both fields are present (or timeout)
    const start = Date.now();
    const poll = setInterval(() => {
      const { pwField, userField } = findFields();

      if (pwField && userField) {
        clearInterval(poll);
        fillAndSubmit(userField, pwField);
      } else if (Date.now() - start > MAX_WAIT) {
        clearInterval(poll);
        console.warn('Autofill: gave up waiting for login fields.');
      }
    }, POLL_INTERVAL);

    function fillAndSubmit(userField, pwField) {
      setNativeValue(userField, username);
      setNativeValue(pwField, password);

      // Safety sleep so any framework re-render settles before we verify
      setTimeout(() => {
        // Verify the values actually landed before submitting
        if (userField.value !== username || pwField.value !== password) {
          console.warn(
            'Autofill: fields not filled correctly, skipping submit.',
            { userOk: userField.value === username,
              passOk: pwField.value === password }
          );
          return;
        }

        const form = pwField.closest('form');
        const submitBtn =
          byXPath(site.xpSubmit) ||
          (form && form.querySelector('button[type="submit"], input[type="submit"]')) ||
          document.querySelector('button[type="submit"], input[type="submit"]') ||
          (form && form.querySelector('button'));

        if (submitBtn) {
          submitBtn.click();
        } else if (form) {
          form.submit();
        } else {
          console.warn('Autofill: no submit target found.');
        }
      }, SETTLE_DELAY);
    }

    function setNativeValue(el, value) {
      const proto = Object.getPrototypeOf(el);
      const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
      setter.call(el, value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
})();