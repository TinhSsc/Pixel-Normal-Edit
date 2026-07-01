function uint32ToRgba(uint32) {
  if (uint32 === 0) return { r: 0, g: 0, b: 0, a: 0 };
  return {
    r: (uint32 >>> 24) & 255,
    g: (uint32 >>> 16) & 255,
    b: (uint32 >>> 8) & 255,
    a: uint32 & 255
  };
}

function colorDistance(r1, g1, b1, a1, r2, g2, b2, a2) {
  if (a1 === 0 && a2 === 0) return 0;
  if (a1 === 0 || a2 === 0) return 255;
  return Math.sqrt(
    Math.pow(r2 - r1, 2) +
    Math.pow(g2 - g1, 2) +
    Math.pow(b2 - b1, 2)
  );
}

self.onmessage = function(e) {
  const { type, payload } = e.data;
  
  if (type === 'floodFill') {
    const { pixelMap, startX, startY, fillUint32, tolerance, width, height } = payload;
    const startIdx = startY * width + startX;
    const startUint32 = pixelMap[startIdx];
    
    if (startUint32 === fillUint32 && tolerance === 0) {
      self.postMessage({ success: true, data: [] });
      return;
    }
    
    const startRgba = uint32ToRgba(startUint32);
    const visited = new Uint8Array(width * height);
    const changes = [];
    const queue = [startX, startY];
    let head = 0;
    
    while (head < queue.length) {
      const x = queue[head++];
      const y = queue[head++];
      const idx = y * width + x;
      
      if (visited[idx]) continue;
      visited[idx] = 1;
      
      const curUint32 = pixelMap[idx];
      if (tolerance === 0) {
        if (curUint32 !== startUint32) continue;
      } else {
        const curRgba = uint32ToRgba(curUint32);
        const dist = colorDistance(curRgba.r, curRgba.g, curRgba.b, curRgba.a, startRgba.r, startRgba.g, startRgba.b, startRgba.a);
        if (dist > tolerance) continue;
      }
      
      changes.push(idx);
      
      if (x + 1 < width && !visited[y * width + (x + 1)]) { queue.push(x + 1, y); }
      if (x - 1 >= 0 && !visited[y * width + (x - 1)]) { queue.push(x - 1, y); }
      if (y + 1 < height && !visited[(y + 1) * width + x]) { queue.push(x, y + 1); }
      if (y - 1 >= 0 && !visited[(y - 1) * width + x]) { queue.push(x, y - 1); }
    }
    
    self.postMessage({ success: true, data: changes });
  } else if (type === 'magicEraser') {
    const { pixelMap, startX, startY, tolerance, width, height } = payload;
    const startIdx = startY * width + startX;
    const startUint32 = pixelMap[startIdx];
    
    // In magic eraser, if it's transparent, we don't erase anything? Or maybe we do.
    // Let's just do standard flood fill search.
    const startRgba = uint32ToRgba(startUint32);
    const visited = new Uint8Array(width * height);
    const changes = [];
    const queue = [startX, startY];
    let head = 0;
    
    while (head < queue.length) {
      const x = queue[head++];
      const y = queue[head++];
      const idx = y * width + x;
      
      if (visited[idx]) continue;
      visited[idx] = 1;
      
      const curUint32 = pixelMap[idx];
      if (tolerance === 0) {
        if (curUint32 !== startUint32) continue;
      } else {
        const curRgba = uint32ToRgba(curUint32);
        const dist = colorDistance(curRgba.r, curRgba.g, curRgba.b, curRgba.a, startRgba.r, startRgba.g, startRgba.b, startRgba.a);
        if (dist > tolerance) continue;
      }
      
      changes.push(idx);
      
      if (x + 1 < width && !visited[y * width + (x + 1)]) { queue.push(x + 1, y); }
      if (x - 1 >= 0 && !visited[y * width + (x - 1)]) { queue.push(x - 1, y); }
      if (y + 1 < height && !visited[(y + 1) * width + x]) { queue.push(x, y + 1); }
      if (y - 1 >= 0 && !visited[(y - 1) * width + x]) { queue.push(x, y - 1); }
    }
    self.postMessage({ success: true, data: changes });
  }
};
