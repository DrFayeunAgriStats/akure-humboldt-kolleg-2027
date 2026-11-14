
/* AKURE HUMBOLDT KOLLEG 2027 — CLIENT PRESENTATION PROTOTYPE
 * Demonstration only: no backend, real registration or uploads.
 * Never use this demo to collect actual conference registration information.
 */
(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
  const text = (el, val) => { if (el) el.textContent = val; };
  let activeRegistration = null;
  let activeAbstract = null;
  let toastTimer;
  const toast = (message) => {
    const t = $('#toast');
    text(t, message);
    t.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.add('hidden'), 4600);
  };

  // Mobile navigation
  const menuButton = $('#menu-toggle');
  const nav = $('#main-nav');
  menuButton?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });
  $$('#main-nav a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
  }));

  const registrationForm = $('#registration-form');
  const registrationSteps = [$('#reg-details'), $('#reg-review'), $('#reg-success')];
  const stepIndicators = [$('#reg-step-one'), $('#reg-step-two'), $('#reg-step-three')];
  function showRegStep(n) {
    registrationSteps.forEach((view, i) => view?.classList.toggle('hidden', i !== n));
    stepIndicators.forEach((step, i) => step?.classList.toggle('active', i === n));
  }
  const detailRow = (name, value) => {
    const div = document.createElement('div');
    const label = document.createElement('small');
    const strong = document.createElement('strong');
    label.textContent = name;
    strong.textContent = value;
    div.append(label, strong);
    return div;
  };
  registrationForm?.addEventListener('submit', event => {
    event.preventDefault();
    if (!registrationForm.reportValidity()) return;
    const f = new FormData(registrationForm);
    activeRegistration = Object.fromEntries(f.entries());
    const summary = $('#registration-summary');
    summary.replaceChildren(
      detailRow('Participant', (activeRegistration.firstName + ' ' + activeRegistration.lastName).trim()),
      detailRow('Email', activeRegistration.email),
      detailRow('Organisation', activeRegistration.institution),
      detailRow('Country', activeRegistration.country),
      detailRow('Category', activeRegistration.category),
      detailRow('Attendance', 'Free — fully sponsored'),
      detailRow('Registration status', 'Demonstration only')
    );
    showRegStep(1);
  });
  $('#reg-back')?.addEventListener('click', () => showRegStep(0));
  $('#reg-confirm')?.addEventListener('click', () => {
    if (!activeRegistration) return;
    text($('#registration-success-message'),
      'Thank you, ' + activeRegistration.firstName + '. You have completed a sample registration journey. No information was sent or saved to a conference database.');
    showRegStep(2);
    toast('Demo complete · No live registration created.');
  });
  $('#reset-registration')?.addEventListener('click', () => {
    registrationForm.reset();
    activeRegistration = null;
    showRegStep(0);
  });

  // Abstract submission: preview with safe DOM text and no uploaded files.
  const abstractForm = $('#abstract-form');
  const abstractText = $('#abstract-text');
  const abstractFile = $('#abstract-file');
  const wordCount = () => (abstractText?.value || '').trim().split(/\s+/).filter(Boolean).length;
  abstractText?.addEventListener('input', () => text($('#word-count'), String(wordCount())));
  abstractFile?.addEventListener('change', () => {
    const file = abstractFile.files?.[0];
    const allowed = ['pdf', 'doc', 'docx'];
    if (file && !allowed.includes((file.name.split('.').pop() || '').toLowerCase())) {
      abstractFile.value = '';
      toast('Please select a PDF, DOC or DOCX file for this demo.');
    }
    const selected = abstractFile.files?.[0];
    text($('#file-name'), selected ? selected.name + ' · not uploaded' : 'PDF or DOCX · File stays on your device');
  });
  abstractForm?.addEventListener('submit', event => {
    event.preventDefault();
    if (!abstractForm.reportValidity()) return;
    const fields = new FormData(abstractForm);
    activeAbstract = Object.fromEntries(fields.entries());
    const preview = $('#abstract-preview-content');
    preview.replaceChildren(
      detailRow('Research title', activeAbstract.title),
      detailRow('Corresponding author', activeAbstract.author),
      detailRow('Contact email', activeAbstract.email),
      detailRow('Affiliation', activeAbstract.affiliation),
      detailRow('Sub-theme', 'Track ' + activeAbstract.theme),
      detailRow('Presentation preference', activeAbstract.presentation),
      detailRow('Abstract (' + wordCount() + ' words)', activeAbstract.abstract),
      detailRow('Attachment', abstractFile.files?.[0]?.name || 'None — file stays on device'),
      detailRow('Submission status', 'Sample preview only — not sent')
    );
    abstractForm.classList.add('hidden');
    $('#abstract-preview').classList.remove('hidden');
  });
  $('#abstract-edit')?.addEventListener('click', () => {
    abstractForm.classList.remove('hidden');
    $('#abstract-preview').classList.add('hidden');
  });
  $('#abstract-confirm')?.addEventListener('click', () => {
    if (!activeAbstract) return;
    const randomId = 'DEMO-' + String(Math.floor(Math.random()*90000) + 10000);
    text($('#abstract-reference'), 'Sample reference: ' + randomId + ' · Not a real conference submission ID');
    $('#abstract-preview').classList.add('hidden');
    $('#abstract-success').classList.remove('hidden');
    // Only current-page in-memory data. Do not persist names or research to browser storage.
    const tr = document.createElement('tr');
    const vals = [randomId, activeAbstract.title + ' (DEMO)', '0' + activeAbstract.theme];
    vals.forEach(v => { const td = document.createElement('td'); td.textContent = v; tr.append(td); });
    const status = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = 'status status-new';
    badge.textContent = 'Demo submitted';
    status.append(badge);
    tr.append(status);
    $('#my-abstracts').append(tr);
    toast('Demo abstract completed · No file or data uploaded.');
  });
  $('#abstract-reset')?.addEventListener('click', () => {
    abstractForm.reset();
    abstractForm.classList.remove('hidden');
    $('#abstract-success').classList.add('hidden');
    activeAbstract = null;
    text($('#file-name'), 'PDF or DOCX · File stays on your device');
    text($('#word-count'), '0');
  });

  // Role-based UI simulations — these are NOT protected real user portals.
  const tabs = $$('.dashboard-tabs [data-tab]');
  const views = $$('.demo-view');
  tabs.forEach(tab => tab.addEventListener('click', () => {
    const wanted = tab.dataset.tab;
    tabs.forEach(t => {
      const isActive = t === tab;
      t.classList.toggle('active', isActive);
      t.setAttribute('aria-selected', String(isActive));
    });
    views.forEach(v => v.classList.toggle('hidden', v.id !== 'tab-' + wanted));
  }));
  $('#reviewer-form')?.addEventListener('submit', event => {
    event.preventDefault();
    const f = new FormData(event.target);
    const scores = ['relevance','rigour','clarity'].map(k => Number(f.get(k)));
    const average = (scores.reduce((a,b) => a+b, 0)/scores.length).toFixed(1);
    const fb = $('#review-feedback');
    text(fb, 'Sample reviewer score recorded in this page: ' + average + '/5. This is not a real review decision, and no author was notified.');
    fb.classList.remove('hidden');
    toast('Sample reviewer feedback recorded in demo only.');
  });
  $('#export-demo')?.addEventListener('click', () => {
    const rows = [
      ['Reference','Research title','Track','Status','Data type'],
      ['AKH-012','Nature-based approaches for community food resilience','03','Under review','FICTIONAL SAMPLE'],
      ['AKH-019','Youth participation in agroecological innovation','02','Accepted','FICTIONAL SAMPLE'],
      ['AKH-024','Data-informed biodiversity monitoring','05','Submitted','FICTIONAL SAMPLE']
    ];
    const csv = rows.map(row => row.map(cell => '"' + String(cell).replace(/"/g, '""') + '"').join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], {type:'text/csv;charset=utf-8'}));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'akure-humboldt-2027-SAMPLE-abstracts.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    toast('Downloaded sample-only CSV — no real participant data.');
  });
})();

