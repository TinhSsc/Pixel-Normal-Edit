# Art Tree Domain Module

Art education domain providing interactive drawing lessons through MCP tools.

## Architecture

```
domains/art-tree/
├── index.js                      # Entry point - registers all tools
├── lib/                          # Shared utilities
│   ├── validators.js             # Common Zod schemas
│   └── tool-register.js          # Tool registration helpers
├── shapes/                       # Shape primitives (building blocks)
│   ├── index.js                  # Exports all shapes
│   ├── basic.js                  # Line, square, rect, circle, ellipse, triangle, polygon
│   ├── grid.js                   # Grid drawing
│   └── polyline.js               # Polyline drawing
├── lessons/                      # Lesson implementations
│   ├── index.js                  # Exports all lessons
│   ├── basic/                    # Basic shape lessons (13 lessons)
│   ├── advanced/                 # Advanced properties (5 lessons)
│   ├── curves/                   # Curve lessons (3 lessons)
│   ├── ellipses/                 # Ellipse lessons
│   ├── 3d/                       # 3D form lessons (4 lessons)
│   ├── structure/                # Structure lessons (3 lessons)
│   ├── cross-sections/           # Cross-section lessons (3 lessons)
│   ├── transforms/               # Transform lessons (8 lessons)
│   ├── surfaces/                 # Surface lessons (4 lessons)
│   ├── perspective/              # Perspective lessons (4 lessons)
│   ├── hidden/                   # Hidden shapes lessons (3 lessons)
│   ├── lighting/                 # Lighting lessons (3 lessons)
│   ├── materials/                # Material lessons (3 lessons)
│   ├── analysis/                 # Analysis capstone (10 steps)
│   ├── layers/                   # Layer structure lessons (7 steps)
│   └── sky/                      # Sky & sun lessons (3 lessons)
└── tools/                        # MCP tool registration
    ├── index.js                  # Registers all tool categories
    ├── basic.js                  # Basic shape tools
    ├── lessons.js                # Lesson tools
    ├── advanced.js               # Advanced tools
    ├── curves.js                 # Curve tools
    ├── ellipses.js               # Ellipse tools
    ├── 3d.js                     # 3D tools
    ├── structure.js              # Structure tools
    ├── cross-sections.js         # Cross-section tools
    ├── transforms.js             # Transform tools
    ├── surfaces.js               # Surface tools
    ├── perspective.js            # Perspective tools
    ├── hidden.js                 # Hidden tools
    ├── lighting.js               # Lighting tools
    ├── materials.js              # Material tools
    ├── analysis.js               # Analysis tools
    ├── layers.js                 # Layer tools
    └── sky.js                    # Sky tools
```

## Layer Separation

### 1. Shapes Layer (Primitives)
- **Purpose**: Low-level drawing primitives that map 1:1 to core drawing actions
- **Location**: `shapes/`
- **Returns**: Command payloads (not executed)
- **Example**: `drawLine()`, `drawCircle()`, `drawGrid()`

### 2. Lessons Layer (Educational Content)
- **Purpose**: Educational sequences that teach art concepts
- **Location**: `lessons/`
- **Returns**: Array of command payloads
- **Example**: `lessonLines()`, `lessonCircles()`, `lesson3DBox()`

### 3. Tools Layer (MCP API)
- **Purpose**: MCP tool definitions that expose shapes/lessons to AI agents
- **Location**: `tools/`
- **Returns**: MCP responses
- **Example**: `art_tree_draw_line`, `art_tree_lesson_lines`

## Design Principles

1. **Separation of Concerns**: Each layer has a single responsibility
2. **Composition over Inheritance**: Lessons compose shapes, tools compose lessons
3. **No Duplication**: Shared validators and registration helpers in `lib/`
4. **Consistent Naming**: Clear patterns for all files and functions
5. **Easy Navigation**: Related functionality grouped together

## Usage

### Registering Tools

```javascript
const { registerAll } = require('./domains/art-tree');
registerAll(server);
```

### Using Shapes

```javascript
const shapes = require('./domains/art-tree/shapes');
const cmd = shapes.drawCircle(10, 10, 5, '#ff0000');
// Returns: { action: 'drawCircle', cx: 10, cy: 10, r: 5, color: '#ff0000' }
```

### Using Lessons

```javascript
const lessons = require('./domains/art-tree/lessons');
const commands = lessons.lessonLines(32, '#ff0000');
// Returns: Array of command payloads
```

## Adding New Features

### New Shape
1. Add function to `shapes/basic.js` (or create new file in `shapes/`)
2. Export from `shapes/index.js`

### New Lesson
1. Create lesson function in appropriate `lessons/[category]/` folder
2. Export from `lessons/[category]/index.js`
3. Export from `lessons/index.js`

### New Tool
1. Create tool file in `tools/[category].js`
2. Use helpers from `lib/tool-register.js`
3. Import and call `register()` in `tools/index.js`

## Migration Notes

This is a refactored version of the original art-tree module. The old flat structure with 17+ `*_tools.js` files has been reorganized into:
- Clear layer separation (shapes → lessons → tools)
- Category-based organization
- Shared utilities to reduce duplication
- Consistent naming conventions

All original functionality is preserved, just better organized.