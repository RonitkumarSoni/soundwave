const fs = require('fs');
const path = require('path');

const directory = path.join(__dirname, 'src');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Revert FlashList back to FlatList
  if (content.includes('FlashList')) {
    // Replace <FlashList estimatedItemSize={100} with <FlatList
    content = content.replace(/<FlashList\s+estimatedItemSize=\{[^}]+\}/g, '<FlatList');
    content = content.replace(/<FlashList/g, '<FlatList');
    content = content.replace(/<\/FlashList>/g, '</FlatList>');
    content = content.replace(/\bFlashList\b/g, 'FlatList');

    // Remove FlashList import
    content = content.replace(/import\s+{\s*FlatList\s*}\s+from\s+['"]@shopify\/flash-list['"];?\n?/g, '');
    
    // Add FlatList back to react-native import if not there
    const rnImportRegex = /import\s+{([^}]*?)}\s+from\s+['"]react-native['"]/g;
    if (content.match(rnImportRegex)) {
      content = content.replace(rnImportRegex, (match, imports) => {
        if (!imports.includes('FlatList')) {
          return `import { FlatList, ${imports.trim()} } from 'react-native'`;
        }
        return match;
      });
    } else {
      content = `import { FlatList } from 'react-native';\n` + content;
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Reverted:', filePath);
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
console.log('Done reverting!');
