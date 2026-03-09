interface Window {
  addCleanup(fn: (...args: unknown[]) => void): void;
}
