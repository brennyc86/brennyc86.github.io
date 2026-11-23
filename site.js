// Gedeeld script voor de startpagina en de mappen (apps, games, webtools).
// Gebruik: <script src="…/site.js" data-soort="game" data-basis="../"></script>
const MAPPEN = {
  app: { map: 'apps', naam: 'Apps', icoon: '📱', uitleg: 'Apps om echt mee te werken: ze worden gebruikt en verder ontwikkeld, met opslag van je gegevens.' },
  game: { map: 'games', naam: 'Games', icoon: '🎮', uitleg: 'Spellen om te spelen en te testen. Ze zijn nog volop in ontwikkeling: verwacht veranderingen en af en toe iets dat niet werkt.' },
  webtool: { map: 'webtools', naam: 'Webtools', icoon: '🛠️', uitleg: 'Kleine hulpmiddelen en experimenten: zoekers, planners en handigheidjes, vaak gemaakt voor één doel.' },
};
const STATUS = {
  experiment: ['Experiment', 'Een proefje of hulpmiddel; werkt voor het doel waarvoor het gemaakt is, zonder belofte.'],
  'pre-alpha': ['Pre-alpha', 'Vroeg in ontwikkeling: veel ontbreekt nog en dingen veranderen voortdurend.'],
  alpha: ['Alpha', 'De kern werkt en wordt gebruikt; nog niet compleet en er kunnen fouten in zitten.'],
  beta: ['Bèta', 'Vrijwel compleet; vooral nog testen en schaven.'],
  stabiel: ['Stabiel', 'Af en betrouwbaar in gebruik.'],
};
const AI = 'Alles hier zijn AI-gegenereerde apps, games en webtools, gemaakt met Claude naar idee van Brendan Koster.';

const script = document.currentScript, soort = script.dataset.soort || '', basis = script.dataset.basis || '';
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const datum = d => d ? new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

// laatste aanpassing: datum van de laatste commit op de hoofdtak (een uur bewaard, om de GitHub-limiet te sparen)
async function laatsteAanpassing(repo) {
  const sl = 'laatst:' + repo, oud = JSON.parse(sessionStorage.getItem(sl) || 'null');
  if (oud && Date.now() - oud.t < 3600e3) return oud.d;
  try {
    const r = await fetch(`https://api.github.com/repos/brennyc86/${repo}/commits?per_page=1`);
    if (!r.ok) return null;
    const d = (await r.json())[0]?.commit?.committer?.date || null;
    sessionStorage.setItem(sl, JSON.stringify({ t: Date.now(), d }));
    return d;
  } catch { return null; }
}

const kaart = (s, nieuw) => `<a class="k ${nieuw ? 'nieuw' : ''}" href="${esc(s.url)}"><span class="i">${esc(s.icoon || '🔗')}</span><span>
  <span class="n">${esc(s.naam)}</span>${nieuw ? '<span class="tag">nieuw gevonden</span>' : ''}<br><span class="o">${esc(s.omschrijving || '')}</span>
  <span class="regel">${s.status ? `<span class="st st-${esc(s.status)}" title="${esc(STATUS[s.status]?.[1] || '')}">${esc(STATUS[s.status]?.[0] || s.status)}</span>` : ''}
  <span data-laatst="${esc(s.repo || '')}">${s.laatst ? 'laatst aangepast ' + datum(s.laatst) : ''}</span></span></span></a>`;

const statusUitleg = () => `<div class="statusuitleg"><h2>Wat betekent de status?</h2><dl>${Object.entries(STATUS).map(([k, [n, u]]) => `<dt><span class="st st-${k}">${n}</span></dt><dd>${u}</dd>`).join('')}</dl></div>`;

async function start() {
  // logo (beige gekleurd), anders het monogram
  const im = new Image(); im.onload = () => { $('logo').style.setProperty('--logo', `url(${basis}logo.svg)`); $('logo').style.display = 'block'; $('mono').style.display = 'none'; }; im.src = basis + 'logo.svg';
  $('ai').textContent = AI;
  const cfg = await (await fetch(basis + 'sites.json?' + Date.now())).json();
  const sites = cfg.sites.filter(s => !soort || s.soort === soort);
  let h = '';
  if (soort) {
    h = `<div class="grid">${sites.map(s => kaart(s)).join('') || '<p class="o">Hier staat nog niets.</p>'}</div>`;
  } else {
    h = `<div class="mappen">${Object.entries(MAPPEN).map(([k, m]) => { const n = cfg.sites.filter(s => s.soort === k).length;
      return `<a class="map" href="${m.map}/"><span class="n">${m.icoon} ${m.naam}</span><div class="o">${esc(m.uitleg)}</div><div class="aantal">${n} ${n === 1 ? 'item' : 'items'} · /${m.map}/</div></a>`; }).join('')}</div>`;
    for (const [k, m] of Object.entries(MAPPEN)) { const l = sites.filter(s => s.soort === k); if (l.length) h += `<h2><a href="${m.map}/" style="color:inherit;text-decoration:none">${m.naam}</a></h2><div class="grid">${l.map(s => kaart(s)).join('')}</div>`; }
  }
  $('inh').innerHTML = h + statusUitleg();
  // datums invullen
  for (const repo of [...new Set(sites.map(s => s.repo).filter(Boolean))]) laatsteAanpassing(repo).then(d => { if (d) document.querySelectorAll(`[data-laatst="${CSS.escape(repo)}"]`).forEach(e => { e.textContent = 'laatst aangepast ' + datum(d); }); });
  // alleen op de hoofdpagina: GitHub Pages-sites die nog niet in de lijst staan
  if (!soort) try {
    const bekend = new Set([...cfg.sites.map(s => s.repo), ...(cfg.verborgen || [])].map(x => x.toLowerCase()));
    const repos = await (await fetch('https://api.github.com/users/brennyc86/repos?per_page=100&type=owner')).json();
    const nieuw = repos.filter(r => r.has_pages && !r.private && !bekend.has(r.name.toLowerCase())).map(r => ({ naam: r.name, icoon: '🆕', url: `https://brennyc86.github.io/${r.name}/`, omschrijving: r.description || 'Nog niet ingedeeld', laatst: r.pushed_at }));
    if (nieuw.length) $('inh').insertAdjacentHTML('beforeend', `<h2>Automatisch gevonden</h2><div class="grid">${nieuw.map(s => kaart(s, true)).join('')}</div>`);
  } catch { /* GitHub niet bereikbaar */ }
  $('vt').textContent = 'De lijst staat in sites.json in de repo brennyc86.github.io';
}
start().catch(e => { $('inh').textContent = 'Kon de lijst niet laden: ' + e; });
