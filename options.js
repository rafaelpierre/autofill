const usernameEl = document.getElementById('username');
const passwordEl = document.getElementById('password');
const sitesEl = document.getElementById('sites');
const statusEl = document.getElementById('status');
const tpl = document.getElementById('siteTemplate');

function addSiteRow(site = {}) {
  const node = tpl.content.cloneNode(true);
  node.querySelector('.url').value = site.url || '';
  node.querySelector('.xpUser').value = site.xpUser || '';
  node.querySelector('.xpPass').value = site.xpPass || '';
  node.querySelector('.xpSubmit').value = site.xpSubmit || '';
  node.querySelector('.remove').addEventListener('click', (e) => {
    e.target.closest('.site').remove();
  });
  sitesEl.appendChild(node);
}

// Load existing settings
chrome.storage.local.get(['username', 'password', 'sites'], (data) => {
  usernameEl.value = data.username || '';
  passwordEl.value = data.password || '';
  const sites = data.sites && data.sites.length ? data.sites : [{}];
  sites.forEach(addSiteRow);
});

document.getElementById('addSite').addEventListener('click', () => addSiteRow());

document.getElementById('save').addEventListener('click', () => {
  const sites = [...sitesEl.querySelectorAll('.site')].map(el => ({
    url: el.querySelector('.url').value.trim(),
    xpUser: el.querySelector('.xpUser').value.trim(),
    xpPass: el.querySelector('.xpPass').value.trim(),
    xpSubmit: el.querySelector('.xpSubmit').value.trim(),
  })).filter(s => s.url);

  chrome.storage.local.set({
    username: usernameEl.value,
    password: passwordEl.value,
    sites,
  }, () => {
    statusEl.textContent = 'Saved!';
    setTimeout(() => (statusEl.textContent = ''), 1500);
  });
});