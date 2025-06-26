document.addEventListener('DOMContentLoaded', function () {
  const urlInput = document.getElementById('instanceUrl');
  const sessionInput = document.getElementById('sessionId');
  const classInput = document.getElementById('classNames');
  const resultsDiv = document.getElementById('results');

  // Load saved values from localStorage
  urlInput.value = localStorage.getItem('sfUrl') || '';
  sessionInput.value = localStorage.getItem('sfSession') || '';
  classInput.value = localStorage.getItem('sfClasses') || '';

  // Save changes
  [urlInput, sessionInput, classInput].forEach(input => {
    input.addEventListener('input', () => {
      localStorage.setItem('sfUrl', urlInput.value);
      localStorage.setItem('sfSession', sessionInput.value);
      localStorage.setItem('sfClasses', classInput.value);
    });
  });

  document.getElementById('runBtn').addEventListener('click', async () => {
    const url = urlInput.value.trim();
    const sessionId = sessionInput.value.trim();
    const classList = classInput.value.split('\n').map(c => c.trim()).filter(Boolean);

    resultsDiv.innerText = '⏱ Running tests...';

    try {
      const runRes = await fetch(`${url}/services/data/v60.0/tooling/runTestsSynchronous`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionId}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tests: classList.map(c => ({ className: c }))
        })
      });
      const runData = await runRes.json();

      const covRes = await fetch(`${url}/services/data/v60.0/tooling/query/?q=${encodeURIComponent("SELECT ApexClassOrTrigger.Name, NumLinesCovered, NumLinesUncovered FROM ApexCodeCoverageAggregate")}`, {
        headers: {
          Authorization: `Bearer ${sessionId}`
        }
      });
      const covData = await covRes.json();

      const impacted = classList.map(c => c.replace(/Test$/, ''));
      const relevantCoverage = covData.records.filter(r =>
        impacted.includes(r.ApexClassOrTrigger.Name)
      );

      let html = '<h4>Code Coverage</h4><table><tr><th>Class</th><th>Covered</th><th>Uncovered</th><th>%</th></tr>';
      relevantCoverage.forEach(r => {
        const total = r.NumLinesCovered + r.NumLinesUncovered;
        const percent = total > 0 ? ((r.NumLinesCovered / total) * 100).toFixed(2) : '0.00';
        html += `<tr><td>${r.ApexClassOrTrigger.Name}</td><td>${r.NumLinesCovered}</td><td>${r.NumLinesUncovered}</td><td>${percent}%</td></tr>`;
      });
      html += '</table>';
      resultsDiv.innerHTML = html;

    } catch (e) {
      resultsDiv.innerText = `Error: ${e.message}`;
      console.error(e);
    }
  });
});
