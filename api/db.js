// cache bust 1
module.exports = async function handler(req, res) {
  return res.status(200).json({
    url: req.url,
    method: req.method,
    query: req.query,
    keys: Object.keys(req.query || {}),
  });
}