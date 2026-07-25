# Art Tree Module Reorganization Plan

## Current Issues

1. **Too many files**: 17+ separate `*_tools.js` files in one directory
2. **Inconsistent naming**: Mix of `_tools.js`, `_lessons.js`, `_shapes.js` suffixes
3. **Code duplication**: Every tool file repeats the same boilerplate (zod imports, hexColor schema, register function pattern)
4. **Hard to navigate**: Difficult to find related functionality
5. **Mixed concerns**: Tools, lessons, and shapes all mixed together

## Proposed Structure

```
domains/art-tree/
├── index.js                      # Main entry point - register all tools
├── README.md                     # Domain documentation
├── lib/                          # Shared utilities
│   ├── validators.js             # Common Zod schemas (hexColor, canvasSize, etc.)
│   └── tool-register.js          # Tool registration helper with common patterns
├── shapes/                       # Shape primitives (currently shapes.js)
│   ├── index.js                  # Export all shapes
│   ├── basic.js                  # Line, square, rect, circle, ellipse, triangle, polygon
│   ├── grid.js                   # Grid drawing
│   └── polyline.js               # Polyline drawing
├── lessons/                      # Lesson implementations
│   ├── index.js                  # Export all lessons + catalog functions
│   ├── basic/                    # Basic shape lessons
│   │   ├── lines.js
│   │   ├── squares.js
│   │   ├── circles.js
│   │   ├── ellipses.js
│   │   ├── triangles.js
│   │   ├── polygons.js
│   │   ├── composition.js
│   │   ├── freehand.js
│   │   ├── proportions.js
│   │   ├── curves.js
│   │   ├── spiral.js
│   │   ├── strokes.js
│   │   └── parallel-intersecting.js
│   ├── advanced/                 # Advanced property lessons
│   │   ├── ratios.js
│   │   ├── symmetry.js
│   │   ├── angles.js
│   │   ├── distances.js
│   │   └── relationships.js
│   ├── curves/                   # Curve-specific lessons
│   │   ├── types.js
│   │   ├── topology.js
│   │   └── properties.js
│   ├── 3d/                       # 3D form lessons
│   │   ├── box.js
│   │   ├── sphere.js
│   │   ├── cylinder.js
│   │   └── cone.js
│   ├── structure/                # Structure lessons
│   │   ├── xyz-axes.js
│   │   ├── bottle.js
│   │   └── orientation.js
│   ├── cross-sections/           # Cross-section lessons
│   │   ├── bottle.js
│   │   ├── glass.js
│   │   └── head.js
│   ├── transforms/               # Transform lessons
│   │   ├── stretch.js
│   │   ├── squash.js
│   │   ├── taper.js
│   │   ├── bend.js
│   │   ├── rotate.js
│   │   ├── cut.js
│   │   ├── hollow.js
│   │   └── combine.js
│   ├── surfaces/                 # Surface lessons
│   │   ├── types.js
│   │   ├── edges.js
│   │   ├── cup.js
│   │   └── chair.js
│   ├── perspective/              # Perspective lessons
│   │   ├── 1point.js
│   │   ├── 2point.js
│   │   ├── 3point.js
│   │   └── foreshorten.js
│   ├── hidden/                   # Hidden shapes lessons
│   │   ├── box.js
│   │   ├── head.js
│   │   └── cup.js
│   ├── lighting/                 # Lighting lessons
│   │   ├── zones.js
│   │   ├── direction.js
│   │   └── contact.js
│   ├── materials/                # Material lessons
│   │   ├── shiny.js
│   │   ├── glass.js
│   │   └── texture.js
│   ├── analysis/                 # Analysis lessons (capstone)
│   │   ├── step-1.js
│   │   ├── step-2.js
│   │   ├── ... (up to step-10)
│   │   └── index.js
│   ├── layers/                   # Layer structure lessons
│   │   ├── step-1.js
│   │   ├── ... (up to step-7)
│   │   └── index.js
│   └── sky/                      # Sky & sun lessons
│       ├── sun-shapes.js
│       ├── sunset-colors.js
│       └── sunset-sky.js
└── tools/                         # MCP tool registration
    ├── index.js                   # Main tool registration entry
    ├── basic.js                   # Basic shape tools
    ├── lessons.js                 # Lesson tools (catalog + individual)
    ├── advanced.js                # Advanced property tools
    ├── curves.js                  # Curve tools
    ├── ellipses.js                # Ellipse tools
    ├── 3d.js                      # 3D form tools
    ├── structure.js               # Structure tools
    ├── cross-sections.js          # Cross-section tools
    ├── transforms.js              # Transform tools
    ├── surfaces.js                # Surface tools
    ├── perspective.js             # Perspective tools
    ├── hidden.js                  # Hidden shapes tools
    ├── lighting.js                # Lighting tools
    ├── materials.js               # Material tools
    ├── analysis.js                # Analysis tools
    ├── layers.js                  # Layer tools
    └── sky.js                     # Sky tools
```

## Benefits

1. **Clear separation of concerns**: Shapes, lessons, and tools are separate
2. **Easier navigation**: Related files grouped together
3. **Less duplication**: Shared validators and registration helpers
4. **Scalable**: Easy to add new lessons/tools without cluttering
5. **Consistent naming**: Clear pattern for all files
6. **Better documentation**: Each subfolder can have its own README

## Migration Strategy

1. Create new directory structure
2. Move and refactor files in batches:
   - First: lib/ (shared utilities)
   - Second: shapes/ (no dependencies)
   - Third: lessons/ (depends on shapes)
   - Fourth: tools/ (depends on lessons)
3. Update index.js to use new structure
4. Test each batch before moving to next
5. Delete old files after verification

## Implementation Priority

**Phase 1 - Foundation (No breaking changes)**
- Create lib/ with validators and helpers
- Create shapes/ and move shapes.js

**Phase 2 - Lessons (Depends on Phase 1)**
- Create lessons/ structure
- Move all lesson files

**Phase 3 - Tools (Depends on Phase 2)**
- Create tools/ structure
- Move all tool files
- Update index.js

**Phase 4 - Cleanup**
- Remove old files
- Update documentation
- Verify all tests pass