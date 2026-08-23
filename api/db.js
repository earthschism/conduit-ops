module.exports = async function handler(req, res) {
  // Return everything for debugging
  return res.status(200).json({
    url: req.url,
    method: req.method,
    query: req.query,
    keys: Object.keys(req.query || {}),
  });
}