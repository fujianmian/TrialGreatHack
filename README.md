# EduAI - TypeScript Frontend

A modern, type-safe frontend for the EduAI learning assistant built with TypeScript.

## 🚀 Features

- **TypeScript**: Full type safety and modern JavaScript features
- **Modular Architecture**: Clean separation of concerns with classes and interfaces
- **Responsive Design**: Mobile-first approach with modern CSS
- **Accessibility**: ARIA labels, keyboard navigation, and screen reader support
- **Performance**: Optimized DOM manipulation and event handling
- **Error Handling**: Comprehensive error handling and user feedback

## 📁 Project Structure

```
hack/
├── src/
│   ├── types/
│   │   └── index.ts          # TypeScript interfaces and types
│   ├── app.ts                # Main application class
│   └── index.ts              # Application entry point
├── dist/                     # Compiled output (generated)
├── index.html                # HTML template
├── tsconfig.json             # TypeScript configuration
├── package.json              # Dependencies and scripts
├── build.js                  # Build script
└── README.md                 # This file
```

## 🛠️ Development Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the project:**
   ```bash
   npm run build
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Serve the application:**
   ```bash
   npm run serve
   ```

## 🎯 Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Watch mode for development
- `npm run serve` - Start local server
- `npm start` - Build and serve the application

## 🏗️ Architecture

### TypeScript Classes

#### `EduAIApp`
Main application class that manages:
- Application state
- DOM element caching
- Event handling
- UI updates
- Timer functionality
- Content generation

#### Type Definitions
- `AppState` - Complete application state
- `InputMethod` - Input method configuration
- `OutputOption` - Output format options
- `LearningMode` - Learning mode settings
- `TimerState` - Study timer state
- `GeneratedContent` - Generated content structure

### Key Features

1. **State Management**: Centralized state with type safety
2. **Event Handling**: Type-safe event listeners with proper cleanup
3. **DOM Caching**: Efficient element selection and caching
4. **Error Handling**: Comprehensive error handling with user feedback
5. **Timer Functionality**: Study timer with start/pause/reset
6. **Content Generation**: Simulated AI content generation
7. **Responsive UI**: Mobile-first responsive design

## 🎨 Styling

The application uses CSS custom properties (variables) for consistent theming:

```css
:root {
    --primary: #4361ee;
    --secondary: #7209b7;
    --accent: #f72585;
    --success: #4cc9f0;
    /* ... more variables */
}
```

## 🔧 Configuration

### TypeScript Configuration (`tsconfig.json`)
- Target: ES2020
- Strict mode enabled
- Source maps for debugging
- Declaration files generated

### Build Configuration
- Output directory: `dist/`
- Source directory: `src/`
- Module system: ES2020

## 🚀 Deployment

1. **Build for production:**
   ```bash
   npm run build
   ```

2. **Deploy the `dist/` directory** to your web server

3. **Ensure your server serves `.js` files with proper MIME type**

## 🐛 Debugging

- Open browser developer tools
- Check the console for TypeScript errors
- Use `window.eduAIApp` to access the application instance
- Source maps are available for debugging

## 📱 Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and build
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
1. Check the browser console for errors
2. Ensure all dependencies are installed
3. Verify TypeScript compilation is successful
4. Check that the HTML file loads the correct JavaScript bundle

---

**Built with ❤️ using TypeScript**
