const fs = require('fs');
const content = fs.readFileSync('/home/vinman/arogyamitra/ArogyaMitra/frontend/src/app/live-map/LiveMapClient.tsx', 'utf8');

let stack = [];
let line = 1;
let col = 1;
let inString = null; // '"', "'", "`"
let inComment = false; // '//', '/*'

for (let i = 0; i < content.length; i++) {
  const char = content[i];
  const nextChar = content[i + 1];

  if (char === '\n') {
    line++;
    col = 1;
  } else {
    col++;
  }

  // Handle comments
  if (inComment) {
    if (inComment === '//' && char === '\n') {
      inComment = false;
    } else if (inComment === '/*' && char === '*' && nextChar === '/') {
      inComment = false;
      i++; // skip /
    }
    continue;
  }

  // Handle string literals
  if (inString) {
    if (char === '\\') {
      i++; // skip next char
      continue;
    }
    if (char === inString) {
      inString = null;
    }
    continue;
  }

  // Check comment start
  if (char === '/' && nextChar === '/') {
    inComment = '//';
    i++;
    continue;
  }
  if (char === '/' && nextChar === '*') {
    inComment = '/*';
    i++;
    continue;
  }

  // Check string start
  if (char === '"' || char === "'" || char === '`') {
    inString = char;
    continue;
  }

  if (char === '{') {
    stack.push({ char, line, col });
  } else if (char === '}') {
    if (stack.length === 0) {
      console.log(`Unmatched closing brace } at line ${line}, col ${col}`);
    } else {
      stack.pop();
    }
  } else if (char === '(') {
    stack.push({ char, line, col });
  } else if (char === ')') {
    if (stack.length === 0) {
      console.log(`Unmatched closing paren ) at line ${line}, col ${col}`);
    } else {
      const top = stack.pop();
      if (top.char !== '(') {
        console.log(`Mismatched closing paren ) matching ${top.char} from line ${top.line}, col ${top.col} at line ${line}, col ${col}`);
      }
    }
  } else if (char === '[') {
    stack.push({ char, line, col });
  } else if (char === ']') {
    if (stack.length === 0) {
      console.log(`Unmatched closing bracket ] at line ${line}, col ${col}`);
    } else {
      const top = stack.pop();
      if (top.char !== '[') {
        console.log(`Mismatched closing bracket ] matching ${top.char} from line ${top.line}, col ${top.col} at line ${line}, col ${col}`);
      }
    }
  }
}

if (stack.length > 0) {
  console.log('Unclosed brackets/braces/parens at end of file:');
  stack.forEach(item => {
    console.log(`- '${item.char}' at line ${item.line}, col ${item.col}`);
  });
} else {
  console.log('All braces match perfectly!');
}

// Active: 2026-07-04

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
