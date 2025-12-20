export function isPunctToken(t) {
  return /^[,.;:!?()\[\]{}—–-]+$/.test(t);
}

export function tokenize(text) {
  return (
    text
      .replace(/\s+/g, " ")
      .trim()
      .match(/[\w’']+|[.,;:!?()\[\]{}—–-]/g) || []
  );
}
