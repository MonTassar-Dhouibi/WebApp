module.exports = async function handler(req, res) {
    // 1. Force anti-caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const target = req.query.target || (req.body && req.body.target);
    if (!target) return res.status(400).json({ error: "No target provided" });

    // 2. Grab Vercel's hidden database credentials directly
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;

    if (!url || !token) {
        return res.status(200).json({ 
            error: "MISSING_ENV_VARIABLES", 
            message: "Vercel is not passing the database keys to this API." 
        });
    }

    // 3. READ THE SCORE (Using pure fetch, completely bypassing the package)
    if (req.method === 'GET') {
        try {
            const getRes = await fetch(url, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(["GET", `score:${target}`])
            });
            const data = await getRes.json();
            
            if (data.result) {
                return res.status(200).json(JSON.parse(data.result));
            } else {
                return res.status(200).json({ score: 0, privKey: "" });
            }
        } catch (e) {
            return res.status(500).json({ error: "DB Read Failed", details: e.message });
        }
    }

    // 4. UPDATE THE SCORE (Using pure fetch)
    if (req.method === 'POST') {
        const { score, privKey } = req.body;
        try {
            // First check the current score
            const getRes = await fetch(url, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(["GET", `score:${target}`])
            });
            const getData = await getRes.json();
            
            let oldScore = 0;
            if (getData.result) {
                const parsed = JSON.parse(getData.result);
                oldScore = parseInt(parsed.score, 10);
            }

            const newScore = parseInt(score, 10);
            
            // Strictly check if the new score actually beats the database
            if (newScore > oldScore) {
                const payload = JSON.stringify({ score: newScore, privKey });
                await fetch(url, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(["SET", `score:${target}`, payload])
                });
                return res.status(200).json({ success: true, updated: true });
            }
            return res.status(200).json({ success: true, updated: false });
        } catch (e) {
            return res.status(500).json({ error: "DB Write Failed", details: e.message });
        }
    }
    
    return res.status(405).json({ error: "Method not allowed" });
}
