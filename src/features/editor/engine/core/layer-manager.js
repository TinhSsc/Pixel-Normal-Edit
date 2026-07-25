import { layers, activeLayerIndex, updateLayersInfo, setActiveLayerIndex, GRID_WIDTH, GRID_HEIGHT } from './state.js';
import { renderPixels } from './render.js';
import { syncCurrentStateToFrame } from './animation-state.js';
import { forceRedrawAllPreviews } from './preview-group-manager.js';
import { pushLayerState } from './history.js';

function triggerUpdate() {
  syncCurrentStateToFrame();
  renderPixels(); // Do a full render, not preview only
  forceRedrawAllPreviews();
}

export function addLayer() {
  const oldLayers = layers;
  const oldActiveIndex = activeLayerIndex;
  
  const newLayers = [...layers, {
    id: `layer_${Date.now()}_${layers.length}`,
    name: `Layer ${layers.length}`,
    visible: true,
    locked: false,
    pixelMap: new Uint32Array(GRID_WIDTH * GRID_HEIGHT)
  }];
  updateLayersInfo(newLayers);
  setActiveLayerIndex(newLayers.length - 1);
  pushLayerState(oldLayers, oldActiveIndex, layers, activeLayerIndex);
  triggerUpdate();
}

export function removeLayer(index) {
  const oldLayers = layers;
  const oldActiveIndex = activeLayerIndex;

  if (layers.length === 1) {
    // Clear instead of delete
    layers[0].pixelMap.fill(0);
    // Since we mutated pixelMap, it acts as a full state change
    pushLayerState(oldLayers, oldActiveIndex, layers, activeLayerIndex);
    triggerUpdate();
    return;
  }
  const newLayers = layers.filter((_, i) => i !== index);
  let newActiveIndex = activeLayerIndex;
  if (activeLayerIndex === index) {
    newActiveIndex = Math.max(0, index - 1);
  } else if (activeLayerIndex > index) {
    newActiveIndex--;
  }
  updateLayersInfo(newLayers);
  setActiveLayerIndex(newActiveIndex);
  pushLayerState(oldLayers, oldActiveIndex, layers, activeLayerIndex);
  triggerUpdate();
}

export function toggleLayerVisibility(index) {
  if (index < 0 || index >= layers.length) return;
  const newLayers = [...layers];
  newLayers[index].visible = !newLayers[index].visible;
  updateLayersInfo(newLayers);
  triggerUpdate();
}

export function moveLayerUp(index) {
  if (index >= layers.length - 1) return;
  const oldLayers = layers;
  const oldActiveIndex = activeLayerIndex;

  const newLayers = [...layers];
  const temp = newLayers[index];
  newLayers[index] = newLayers[index + 1];
  newLayers[index + 1] = temp;
  
  let newActiveIndex = activeLayerIndex;
  if (activeLayerIndex === index) newActiveIndex = index + 1;
  else if (activeLayerIndex === index + 1) newActiveIndex = index;
  
  updateLayersInfo(newLayers);
  setActiveLayerIndex(newActiveIndex);
  pushLayerState(oldLayers, oldActiveIndex, layers, activeLayerIndex);
  triggerUpdate();
}

export function moveLayerDown(index) {
  if (index <= 0) return;
  const oldLayers = layers;
  const oldActiveIndex = activeLayerIndex;

  const newLayers = [...layers];
  const temp = newLayers[index];
  newLayers[index] = newLayers[index - 1];
  newLayers[index - 1] = temp;
  
  let newActiveIndex = activeLayerIndex;
  if (activeLayerIndex === index) newActiveIndex = index - 1;
  else if (activeLayerIndex === index - 1) newActiveIndex = index;
  
  updateLayersInfo(newLayers);
  setActiveLayerIndex(newActiveIndex);
  pushLayerState(oldLayers, oldActiveIndex, layers, activeLayerIndex);
  triggerUpdate();
}

export function selectLayer(index) {
  if (index < 0 || index >= layers.length) return;
  setActiveLayerIndex(index);
  renderPixels(true);
}
