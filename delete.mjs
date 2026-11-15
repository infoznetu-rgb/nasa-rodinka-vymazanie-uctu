const endpoint = 'https://pmrexbworebprrarhuxn.supabase.co/functions/v1/family-delete-account';
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
    } else if (result.error === 'shared_storage_ownership') {
      status.textContent = 'Výmaz sa nezačal, pretože účet nahral fotografie aj pre iných členov rodiny. Obráť sa na infoznetu@gmail.com. Kód obnovy neposielaj e-mailom.';
    } else if (result.error === 'invalid_proof') {
      status.textContent = 'Kód sa nepodarilo overiť alebo žiadosť už bola dokončená.';
    } else if (result.error === 'receipt_not_pending') {
      status.textContent = 'Pre tento kód už neevidujeme rozpracovaný výmaz.';
    } else if (response.ok && (result.deleted === true || (result.photosPending === true && result.receipt))) {
      form.reset();
      const receipt = result.receipt ?? body.receipt;
      status.textContent = result.photosPending
        ? 'Výmaz ešte prebieha. Odlož si tento kód na dokončenie: ' + receipt + '. Na dokončenie budeš potrebovať aj pôvodný kód obnovy. Bez oboch kódov výmaz fotiek nedokončíš.'
        : body.action === 'finish_photos'
          ? 'Výmaz účtu a fotiek bol dokončený.'
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
  const code = element('cleanup-code').value.replace(/[\s-]/g, '').toUpperCase();
  if (!/^[A-F0-9]{64}$/.test(code)) {
    element('cleanup-status').textContent = 'Skontroluj formát pôvodného kódu obnovy.';
    return;
  }
  void submit(event.currentTarget, { action: 'finish_photos', receipt, code });
});
for (const button of document.querySelectorAll('form button')) button.disabled = false;
