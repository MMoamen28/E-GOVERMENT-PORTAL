const fs = require('fs');
const path = require('path');

async function deployWorkflow(filePath) {
  const fileName = path.basename(filePath);
  const url = 'http://localhost:8090/flowable-rest/service/repository/deployments';
  const auth = Buffer.from('admin:test').toString('base64');

  const formData = new FormData();
  const fileContent = fs.readFileSync(filePath);
  const blob = new Blob([fileContent], { type: 'application/xml' });
  formData.append('file', blob, fileName);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to deploy ${fileName}: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`Successfully deployed ${fileName}. Deployment ID: ${result.id}`);
  } catch (error) {
    console.error(`Error deploying ${fileName}:`, error.message);
  }
}

async function main() {
  const workflowDir = path.join(__dirname, '..', 'flowable');
  const files = fs.readdirSync(workflowDir).filter(f => f.endsWith('.bpmn20.xml'));

  for (const file of files) {
    await deployWorkflow(path.join(workflowDir, file));
  }
}

main();
