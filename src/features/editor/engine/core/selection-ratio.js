export const SELECTION_RATIO_PRESETS = Object.freeze([
  Object.freeze({ numerator: 1, denominator: 4, label: '1/4' }),
  Object.freeze({ numerator: 1, denominator: 3, label: '1/3' }),
  Object.freeze({ numerator: 1, denominator: 2, label: '1/2' }),
  Object.freeze({ numerator: 2, denominator: 3, label: '2/3' }),
  Object.freeze({ numerator: 3, denominator: 4, label: '3/4' }),
  Object.freeze({ numerator: 1, denominator: 1, label: '1/1' }),
]);

function toPositiveInteger(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.round(number)) : 0;
}

export function normalizeSelectionBox(box) {
  if (!box) return null;

  const x = toPositiveInteger(box.x);
  const y = toPositiveInteger(box.y);
  const width = toPositiveInteger(box.width);
  const height = toPositiveInteger(box.height);

  if (width < 1 || height < 1) return null;
  return { x, y, width, height };
}

export function createRatioSelectionBox(mainBox, numerator, denominator) {
  const main = normalizeSelectionBox(mainBox);
  if (!main) return null;

  const ratioNumerator = Number(numerator);
  const ratioDenominator = Number(denominator);
  if (
    !Number.isFinite(ratioNumerator) ||
    !Number.isFinite(ratioDenominator) ||
    ratioNumerator <= 0 ||
    ratioDenominator <= 0 ||
    ratioNumerator > ratioDenominator
  ) {
    return null;
  }

  const width = Math.max(1, Math.min(main.width, Math.round(main.width * ratioNumerator / ratioDenominator)));
  const height = Math.max(1, Math.min(main.height, Math.round(main.height * ratioNumerator / ratioDenominator)));

  return {
    x: main.x + Math.floor((main.width - width) / 2),
    y: main.y + Math.floor((main.height - height) / 2),
    width,
    height,
  };
}

function normalizeReferenceSize(reference) {
  if (!reference) return null;
  const width = toPositiveInteger(reference.width);
  const height = toPositiveInteger(reference.height);
  if (width < 1 || height < 1) return null;
  return { width, height };
}

function createLocalRange(box, referenceSize, compareSize, mainBox) {
  const startRow = Math.round(((box.y - mainBox.y) * referenceSize.height) / mainBox.height) + 1;
  const startCol = Math.round(((box.x - mainBox.x) * referenceSize.width) / mainBox.width) + 1;
  return {
    startRow,
    startCol,
    endRow: startRow + compareSize.height - 1,
    endCol: startCol + compareSize.width - 1,
  };
}

export function calculateSelectionSizes(mainBox, compareBox, reference = null) {
  const main = normalizeSelectionBox(mainBox);
  if (!main) return null;

  const normalizedReference = normalizeReferenceSize(reference);
  const mainSize = normalizedReference || { width: main.width, height: main.height };
  const compare = normalizeSelectionBox(compareBox);
  const compareSize = compare
    ? {
        width: Math.max(1, Math.round((compare.width * mainSize.width) / main.width)),
        height: Math.max(1, Math.round((compare.height * mainSize.height) / main.height)),
      }
    : null;

  const mainRange = {
    startRow: 1,
    startCol: 1,
    endRow: mainSize.height,
    endCol: mainSize.width,
  };
  const compareRange = compare && compareSize
    ? createLocalRange(compare, mainSize, compareSize, main)
    : null;

  return {
    usesReference: Boolean(normalizedReference),
    mainSize,
    compareSize,
    mainRange,
    compareRange,
    mainArea: mainSize.width * mainSize.height,
    compareArea: compareSize ? compareSize.width * compareSize.height : 0,
  };
}

export function calculateSelectionComparison(mainBox, compareBox, reference = null) {
  const sizes = calculateSelectionSizes(mainBox, compareBox, reference);
  if (!sizes?.compareSize) return null;

  return {
    ...sizes,
    widthPercent: (sizes.compareSize.width / sizes.mainSize.width) * 100,
    heightPercent: (sizes.compareSize.height / sizes.mainSize.height) * 100,
    areaPercent: (sizes.compareArea / sizes.mainArea) * 100,
    pixelDifference: sizes.mainArea - sizes.compareArea,
  };
}
