const fs = require('fs');
let content = fs.readFileSync('src/components/Rules.tsx', 'utf8');

// The lines we want to replace have <td className="py-3 px-6">NUMBER</td>
let currentNumber = 1;
content = content.replace(/<td className="py-3 px-6">(\d+)<\/td>/g, (match, p1) => {
    const res = `<td className="py-3 px-6">${currentNumber}</td>`;
    currentNumber++;
    return res;
});

fs.writeFileSync('src/components/Rules.tsx', content);
