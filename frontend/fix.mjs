import fs from 'fs';
import path from 'path';

const files = [
  'src/design/ThemeProvider.jsx',
  'src/pages/PipelineMonitor.jsx',
  'src/pages/WorkflowDesigner.jsx',
  'src/components/workflow/NodeInspector.jsx',
  'src/components/workflow/CustomNode.jsx',
  'src/pages/ReviewQueue.jsx'
];

files.forEach(f => {
  const p = path.join(process.cwd(), f);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    content = content.replace(/\\\$/g, '$');
    content = content.replace(/\\`/g, '`');
    fs.writeFileSync(p, content);
    console.log(\`Fixed \${f}\`);
  }
});
