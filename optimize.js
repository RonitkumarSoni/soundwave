const fs = require('fs');
const path = require('path');

const directory = path.join(__dirname, 'src');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Replace Image imports
  if (content.includes('Image') && (content.includes("'react-native'") || content.includes('"react-native"'))) {
    // If it has Image from react-native
    const rnImportRegex = /import\s+{([^}]*?)}\s+from\s+['"]react-native['"]/g;
    content = content.replace(rnImportRegex, (match, imports) => {
      if (imports.includes('Image')) {
        let newImports = imports.split(',').map(i => i.trim()).filter(i => i !== 'Image' && i !== '');
        if (newImports.length === 0) return '';
        return `import { ${newImports.join(', ')} } from 'react-native'`;
      }
      return match;
    });
    
    if (originalContent.includes('Image') && !content.includes("from 'expo-image'") && !content.includes('from "expo-image"')) {
      content = `import { Image } from 'expo-image';\n` + content;
    }
  }

  // 2. Replace FlatList imports
  if (content.includes('FlatList') && (content.includes("'react-native'") || content.includes('"react-native"'))) {
    const rnImportRegex = /import\s+{([^}]*?)}\s+from\s+['"]react-native['"]/g;
    content = content.replace(rnImportRegex, (match, imports) => {
      if (imports.includes('FlatList')) {
        let newImports = imports.split(',').map(i => i.trim()).filter(i => i !== 'FlatList' && i !== '');
        if (newImports.length === 0) return '';
        return `import { ${newImports.join(', ')} } from 'react-native'`;
      }
      return match;
    });

    if (originalContent.includes('FlatList') && !content.includes("@shopify/flash-list")) {
      content = `import { FlashList } from '@shopify/flash-list';\n` + content;
    }
  }

  // 3. Replace JSX and refs
  if (content.includes('FlatList')) {
    content = content.replace(/<FlatList/g, '<FlashList estimatedItemSize={100}');
    content = content.replace(/<\/FlatList>/g, '</FlashList>');
    content = content.replace(/\bFlatList\b/g, 'FlashList');
  }

  // Check if we accidentally created empty imports
  content = content.replace(/import\s+{\s*}\s+from\s+['"]react-native['"];?\n?/g, '');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Optimized:', filePath);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

walkDir(directory);
console.log('Done!');
