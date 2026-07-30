// Wires a set of controls sharing a data-group attribute to one detail panel.
// Each entry in `store` needs: tag, name, where, resp[], ach[]. An optional
// `source` array renders as a third "Source" column; its entries may contain
// HTML (e.g. anchor tags for citations).
//
// Two kinds of control share this mechanism:
//   .disclose  — a short button inside a non-interactive <article> card. The
//                card itself is not focusable, so a screen reader announces
//                "Details for Context Window", not the card's entire text.
//   everything else (layer blocks, loop nodes, rail bars) — small controls
//                whose own text IS a reasonable accessible name.
function wireGroup(store, groupName, containerId) {
  const container = document.getElementById(containerId);
  const controls = Array.from(
    document.querySelectorAll(`[data-group="${groupName}"]`)
  );

  // A short status message carries the change instead of an aria-live region
  // on the panel itself: re-announcing the whole panel (which is what
  // aria-live + aria-atomic did) meant thousands of characters on every click.
  let status = document.getElementById('wg-status');
  if (!status) {
    status = document.createElement('div');
    status.id = 'wg-status';
    status.className = 'sr-only';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    document.body.appendChild(status);
  }

  if (container) {
    container.setAttribute('role', 'region');
    // Reachable so a keyboard/AT user can jump to it deliberately, but focus
    // is never stolen on click — that would lose their place in the card list.
    container.setAttribute('tabindex', '-1');
    if (!container.hasAttribute('aria-label')) {
      container.setAttribute('aria-label', 'Selected item detail');
    }
  }

  controls.forEach(el => {
    const isDisclosure = el.classList.contains('disclose');
    // A disclosure reveals content elsewhere; the others are a selection set.
    el.setAttribute(isDisclosure ? 'aria-expanded' : 'aria-pressed', 'false');
    if (containerId) el.setAttribute('aria-controls', containerId);
  });

  function render(id) {
    const d = store[id];
    if (!d || !container) return;
    const sourceCol = d.source
      ? `<div class="source"><h4>Source</h4><ul>${d.source.map(x => `<li>${x}</li>`).join('')}</ul></div>`
      : '';
    container.innerHTML = `
      <div class="detail-head">
        <span class="tag">${d.tag}</span>
        <div class="name">${d.name}</div>
        <div class="where"><b>Where</b><p>${d.where}</p></div>
      </div>
      <div class="detail-cols">
        <div class="responsibility"><h4>Responsibility</h4><ul>${d.resp.map(x => `<li>${x}</li>`).join('')}</ul></div>
        <div class="achieves"><h4>Achieves</h4><ul>${d.ach.map(x => `<li>${x}</li>`).join('')}</ul></div>
        ${sourceCol}
      </div>`;
    container.setAttribute('aria-label', d.name + ' — detail');

    controls.forEach(el => {
      const on = el.dataset.id === id;
      const isDisclosure = el.classList.contains('disclose');
      // For a disclosure the visual selected state belongs to its card, not
      // to the little button itself.
      const visual = isDisclosure ? (el.closest('.pattern-block') || el) : el;
      visual.classList.toggle('active', on);
      el.setAttribute(isDisclosure ? 'aria-expanded' : 'aria-pressed', on ? 'true' : 'false');
    });

    status.textContent = 'Showing detail for ' + d.name;
  }

  // Text is selectable, so a drag-select can end in a click. Ignore those, or
  // highlighting a caption to copy it would swap the panel out from under you.
  function selectingWithin(el) {
    const sel = window.getSelection();
    return !!(sel && !sel.isCollapsed && sel.toString().trim() &&
              sel.anchorNode && el.contains(sel.anchorNode));
  }

  controls.forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (selectingWithin(el)) return;
      render(el.dataset.id);
    });
  });

  return render;
}
