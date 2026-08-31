const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const regex = /results\.forEach\(pair => \{\s*if \(pair\.signal !== 'neutral'\) \{\s*const key = `\$\{pair\.pair\}-\$\{pair\.signal\}`;\s*if \(pendingOrders\[key\]\) \{\s*if \(pair\.isVolatile\) \{[\s\S]*?\}\s*\}\s*\}\s*\}\);\s*\} catch/m;
code = code.replace(regex, '} catch');
fs.writeFileSync('src/components/Dashboard.tsx', code);
console.log('Removed old block');
