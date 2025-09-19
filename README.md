# EduAI - Great AI Hack Frontend

A modern, type-safe frontend for the EduAI learning assistant built with TypeScript and Next.js for the Great AI Hack competition.

## 🚀 Features

- **TypeScript**: Full type safety and modern JavaScript features
- **Next.js**: React framework with server-side rendering and optimization
- **Modular Architecture**: Clean separation of concerns with classes and interfaces
- **Responsive Design**: Mobile-first approach with modern CSS
- **Accessibility**: ARIA labels, keyboard navigation, and screen reader support
- **Performance**: Optimized DOM manipulation and event handling
- **Error Handling**: Comprehensive error handling and user feedback
- **AI Integration**: Ready for AI-powered learning content generation

## 📁 Project Structure

```
TrialGreatHack/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   └── globals.css        # Global styles
│   ├── types/
│   │   └── index.ts           # TypeScript interfaces and types
│   ├── app.ts                 # Main application class
│   └── index.ts               # Application entry point
├── public/                    # Static assets
├── dist/                      # Compiled output (standalone)
├── index.html                 # Standalone HTML template
├── tsconfig.json              # TypeScript configuration
├── next.config.ts             # Next.js configuration
├── package.json               # Dependencies and scripts
└── README.md                  # This file
```

## 🛠️ Development Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run Next.js development server:**
   ```bash
   npm run dev
   ```

3. **Or run standalone TypeScript version:**
   ```bash
   npm run build-standalone
   npm run serve-standalone
   ```

## 🎯 Available Scripts

### Next.js Commands
- `npm run dev` - Start Next.js development server with Turbopack
- `npm run build` - Build Next.js application for production
- `npm start` - Start production Next.js server
- `npm run lint` - Run ESLint

### Standalone TypeScript Commands
- `npm run build-standalone` - Compile TypeScript to JavaScript
- `npm run serve-standalone` - Start local server for standalone version

## 🏗️ Architecture

### Next.js Integration
This project combines the power of Next.js with a standalone TypeScript frontend:

- **Next.js App Router**: Modern React routing and server components
- **TypeScript**: Full type safety throughout the application
- **Tailwind CSS**: Utility-first CSS framework
- **Standalone Mode**: Can run independently without Next.js

### TypeScript Classes

#### `EduAIApp`
Main application class that manages:
- Application state
- DOM element caching
- Event handling
- UI updates
- Content generation
- AI integration

#### Type Definitions
- `AppState` - Complete application state
- `InputMethod` - Input method configuration
- `OutputOption` - Output format options
- `LearningMode` - Learning mode settings
- `GeneratedContent` - Generated content structure

### Key Features

1. **State Management**: Centralized state with type safety
2. **Event Handling**: Type-safe event listeners with proper cleanup
3. **DOM Caching**: Efficient element selection and caching
4. **Error Handling**: Comprehensive error handling with user feedback
5. **Content Generation**: AI-powered content generation simulation
6. **Responsive UI**: Mobile-first responsive design
7. **Accessibility**: Full keyboard navigation and screen reader support

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

### Next.js Configuration (`next.config.ts`)
- Turbopack enabled for faster builds
- TypeScript support
- Optimized for production

## 🚀 Deployment

### Next.js Deployment (Recommended)

1. **Build for production:**
   ```bash
   npm run build
   ```

2. **Deploy to Vercel:**
   ```bash
   npx vercel
   ```

3. **Or deploy to any Node.js hosting service**

### Standalone Deployment

1. **Build standalone version:**
   ```bash
   npm run build-standalone
   ```

2. **Deploy the `dist/` directory** to any static hosting service

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

## 🏆 Great AI Hack

This project was created for the Great AI Hack competition, showcasing:
- Modern TypeScript development practices
- AI-powered learning assistant interface
- Responsive design and accessibility
- Clean architecture and code organization

---

**Built with ❤️ using TypeScript and Next.js for the Great AI Hack**