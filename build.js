#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building EduAI TypeScript Frontend...\n');

try {
    // Check if TypeScript is installed
    try {
        execSync('npx tsc --version', { stdio: 'pipe' });
    } catch (error) {
        console.log('📦 Installing TypeScript...');
        execSync('npm install typescript @types/node --save-dev', { stdio: 'inherit' });
    }

    // Create dist directory if it doesn't exist
    if (!fs.existsSync('dist')) {
        fs.mkdirSync('dist');
        console.log('📁 Created dist directory');
    }

    // Compile TypeScript
    console.log('🔨 Compiling TypeScript...');
    execSync('npx tsc', { stdio: 'inherit' });

    // Copy HTML file to dist
    if (fs.existsSync('index.html')) {
        fs.copyFileSync('index.html', 'dist/index.html');
        console.log('📄 Copied HTML to dist');
    }

    console.log('\n✅ Build completed successfully!');
    console.log('📂 Output files are in the dist/ directory');
    console.log('🌐 Open dist/index.html in your browser to view the application');
    
} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}
