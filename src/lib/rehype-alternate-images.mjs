function walk(node, state) {
  if (node.type === 'element' && node.tagName === 'img') {
    const side = state.count % 2 === 0 ? 'img-right' : 'img-left';
    state.count += 1;
    node.properties ??= {};
    const existing = node.properties.className;
    node.properties.className = Array.isArray(existing) ? [...existing, side] : [side];
    return;
  }
  for (const child of node.children ?? []) {
    walk(child, state);
  }
}

export default function rehypeAlternateImages() {
  return tree => {
    walk(tree, { count: 0 });
  };
}
