let currentAbortController = null;

export function abortCurrentTask() {
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }
}

export function isTaskRunning() {
  return currentAbortController !== null && !currentAbortController.signal.aborted;
}

export function startTask() {
  abortCurrentTask();
  currentAbortController = new AbortController();
  return currentAbortController.signal;
}

export function completeTask() {
  currentAbortController = null;
}
