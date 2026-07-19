let fillWorker = null;

export function getFillWorker() {
  if (!fillWorker) {
    fillWorker = new Worker(new URL('./fill-worker.js', import.meta.url), { type: 'module' });
  }
  return fillWorker;
}

export function runWorkerTask(workerUrl, type, payload) {
  return new Promise((resolve, reject) => {
    const worker = getFillWorker();
    
    const onMessage = (e) => {
      const { success, data, error } = e.data;
      worker.removeEventListener('message', onMessage);
      worker.removeEventListener('error', onError);
      if (success) {
        resolve(data);
      } else {
        reject(new Error(error));
      }
    };
    
    const onError = (err) => {
      worker.removeEventListener('message', onMessage);
      worker.removeEventListener('error', onError);
      reject(err);
    };
    
    worker.addEventListener('message', onMessage);
    worker.addEventListener('error', onError);
    
    worker.postMessage({ type, payload });
  });
}
