module.exports = async function handler(req, res) {
    // Force anti-caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const target = req.query.target || (req.body && req.body.target);
    if (!target) return res.status(400).json({ error: "No target provided" });

    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;

    if (!url || !token) {
        return res.status(200).json({ error: "MISSING_ENV_VARIABLES" });
    }

    if (req.method === 'GET') {
        try {
            const getRes = await fetch(url, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(["GET", `deltas:${target}`])
            });
            const data = await getRes.json();
            
            if (data.result) {
                let parsed = data.result;
                // Safely unpack Vercel KV's double-stringified arrays
                if (typeof parsed === 'string') {
                    try { parsed = JSON.parse(parsed); } catch(e) {}
                }
                if (typeof parsed === 'string') {
                    try { parsed = JSON.parse(parsed); } catch(e) {}
                }
                return res.status(200).json({ deltas: parsed });
            } else {
                return res.status(200).json({ deltas: [] });
            }
        } catch (e) {
            return res.status(500).json({ error: "DB Read Failed", details: e.message });
        }
    }

    if (req.method === 'POST') {
        const { deltas } = req.body;
        if (!deltas || !Array.isArray(deltas)) {
            return res.status(400).json({ error: "Invalid data" });
        }

        try {
            const payload = JSON.stringify(deltas);
            await fetch(url, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(["SET", `deltas:${target}`, payload])
            });
            return res.status(200).json({ success: true });
        } catch (e) {
            return res.status(500).json({ error: "DB Write Failed", details: e.message });
        }
    }
    
    return res.status(405).json({ error: "Method not allowed" });
}
