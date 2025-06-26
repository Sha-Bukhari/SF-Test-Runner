export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { url, sessionId, body } = req.body;

  if (!url || !sessionId) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    const sfRes = await fetch(url, {
      method: body ? 'POST' : 'GET',
      headers: {
        Authorization: `Bearer ${sessionId}`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });

    const data = await sfRes.json();
    res.status(sfRes.status).json(data);
  } catch (e) {
    res.status(500).json({ error: 'Salesforce request failed', details: e.message });
  }
}
