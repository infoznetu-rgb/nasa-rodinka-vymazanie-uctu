const endpoint = 'https://eqgipdmgquaiipsprjix.supabase.co/functions/v1/family-delete-account';
const element = id => document.getElementById(id);
const confirmation = 'VYMAZAŤ';

async function submit(form, body) {
  const button = form.querySelector('button');
  const status = element(form.id + '-status');
  button.disabled = true;
  status.textContent = 'Spracúvam žiadosť…';
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      cache: 'no-store',
    });
    if (response.status === 429) {
      status.textContent = 'Príliš veľa pokusov. Počkaj chvíľu a skús znova.';
      return;
    }
    const result = await response.json();
    if (result.error === 'last_parent') {
      status.textContent = 'Najprv pripoj ďalšieho rodiča, aby ostatní členovia mali správcu rodiny.';
    } else if (result.error === 'invalid_proof') {
      status.textContent = 'Kód sa nepodarilo overiť. Skontroluj, či je platný a patrí k účtu TEST.';
    } else if (response.ok && result.deleted === true) {
      form.reset();
      const receipt = result.receipt ?? body.receipt;
      status.textContent = result.photosPending
        ? 'Účet je vymazaný. Odlož si tento kód na dokončenie výmazu fotiek: ' + receipt
        : body.action === 'finish_photos'
          ? 'Pre tento kód už neevidujeme rozpracovaný výmaz fotiek.'
          : 'Účet a osobné cloudové údaje boli vymazané.';
    } else {
      status.textContent = 'Výmaz sa nepodarilo potvrdiť. Skús znova.';
    }
  } catch {
    status.textContent = 'Výmaz sa nepodarilo potvrdiť. Skontroluj pripojenie a skús znova.';
  } finally {
    button.disabled = false;
  }
}

element('delete').addEventListener('submit', event => {
  event.preventDefault();
  if (element('confirm').value !== confirmation) {
    element('delete-status').textContent = 'Na potvrdenie napíš VYMAZAŤ.';
    return;
  }
  const code = element('code').value.replace(/[\s-]/g, '').toUpperCase();
  if (!/^[A-F0-9]{64}$/.test(code)) {
    element('delete-status').textContent = 'Skontroluj formát kódu obnovy.';
    return;
  }
  void submit(event.currentTarget, { action: 'recovery', confirmation, code });
});
element('cleanup').addEventListener('submit', event => {
  event.preventDefault();
  const receipt = element('receipt').value.trim();
  if (!/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(receipt)) {
    element('cleanup-status').textContent = 'Skontroluj formát kódu na dokončenie výmazu.';
    return;
  }
  void submit(event.currentTarget, { action: 'finish_photos', receipt });
});
for (const button of document.querySelectorAll('form button')) button.disabled = false;
