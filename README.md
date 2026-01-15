# Sheet Metal Profile Designer

A web-based 2D profile designer for sheet metal projects built with React and TypeScript.

## Features

- ✨ **Add Points**: Click to add points on a 2D canvas
- 🎯 **Select & Move**: Drag points to reposition them
- 📏 **Edit Segment Lengths**: Modify the length of segments between points
- 🔗 **Auto-Connect**: Points are automatically connected in sequence
- 📊 **Real-time Statistics**: Track total points, segments, and length
- 🎨 **Visual Grid**: Grid background for precise positioning
- 💾 **Properties Panel**: Edit point coordinates and segment lengths with precision

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at [http://localhost:5173/](http://localhost:5173/)

### Build for Production

```bash
npm run build
```

## How to Use

### Adding Points

1. Click the **"Add Point"** button in the toolbar
2. Click anywhere on the canvas to place a point
3. Points are automatically connected to the previous point

### Selecting and Moving Points

1. Click the **"Select"** button in the toolbar
2. Click on any point to select it
3. Drag the selected point to move it
4. The connected segments update automatically

### Editing Point Position

1. Select a point
2. In the Properties Panel (right side), enter new X and Y coordinates
3. Click **"Update Position"**

### Editing Segment Length

1. Click on a segment (line between two points) to select it
2. In the Properties Panel, enter the new length
3. Click **"Update Length"**
4. The end point will move to maintain the angle while achieving the new length

### Deleting Elements

- **Delete Point**: Select a point and click "Delete Point" in the Properties Panel
- **Delete Segment**: Select a segment and click "Delete Segment" in the Properties Panel
- **Clear All**: Click "Clear All" in the toolbar to remove everything

## Project Structure

```
src/
├── components/
│   ├── Canvas.tsx          # 2D canvas for drawing and interaction
│   ├── Canvas.css
│   ├── Toolbar.tsx         # Tool selection and actions
│   ├── Toolbar.css
│   ├── PropertiesPanel.tsx # Properties editor for selected elements
│   └── PropertiesPanel.css
├── types.ts                # TypeScript interfaces
├── App.tsx                 # Main application component
├── App.css
├── main.tsx               # Application entry point
└── index.css              # Global styles
```

## Technologies

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **HTML5 Canvas** - 2D graphics rendering

## License

MIT
