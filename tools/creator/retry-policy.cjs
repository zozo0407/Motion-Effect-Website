function shouldRetryStatus(status) {
  return status === 429 || status === 529 || status === 524 || status === 525;
}

function computeRetryDelayMs(attempt, initial, factor, max) {
  const base = Math.min(max, Math.floor(initial * Math.pow(factor, Math.max(0, attempt - 1))));
  const jitter = Math.floor(Math.random() * Math.min(250, Math.floor(base * 0.25) + 1));
  return base + jitter;
}

module.exports = {
  shouldRetryStatus,
  computeRetryDelayMs
};
