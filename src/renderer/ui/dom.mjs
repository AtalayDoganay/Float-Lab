// Tiny DOM helpers. No framework; markup is built with elements, never
// string-concatenated with content, so text is always escaped.

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') node.className = value;
    // Inline style attributes are blocked by the CSP; CSSOM assignment is not.
    else if (key === 'style') node.style.cssText = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'html') node.innerHTML = value;
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (value === true) node.setAttribute(key, '');
    else node.setAttribute(key, String(value));
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

export function replace(node, ...children) {
  clear(node);
  node.append(...children.flat().filter(Boolean));
  return node;
}

export function helpButton(controlId, extraClass = '') {
  return el('button', {
    type: 'button',
    class: `help-btn ${extraClass}`.trim(),
    'data-help-for': controlId,
    'aria-label': `Help for this control`,
    title: 'Help (F1)',
    text: '?',
  });
}

export function evidenceChip(level) {
  const labels = {
    observed: 'observed in photos',
    manual: 'from the manual',
    simplified: 'teaching simplification',
    unverified: 'unverified',
  };
  return el('span', { class: `evidence ${level}`, text: labels[level] || level });
}
