const fs = require('fs');
const files = [
  'src/design/ThemeProvider.jsx',
  'src/pages/WorkspaceManager.jsx',
  'src/pages/SettingsCenter.jsx',
  'src/pages/PipelineMonitor.jsx',
  'src/pages/WorkflowDesigner.jsx',
  'src/components/workflow/NodeInspector.jsx',
  'src/components/workflow/CustomNode.jsx',
  'src/pages/ReviewQueue.jsx',
  'src/pages/InterviewMode.jsx'
];
for (const f of files) {
  if (fs.existsSync(f)) {
    let c = fs.readFileSync(f, 'utf8');
    c = c.split('\\' + '`').join('`');
    c = c.split('\\' + '$').join('$');
    fs.writeFileSync(f, c);
  }
}
