// Trivial change to force redeploy
module.exports = (req, res) => {
  res.status(200).json({ message: 'Hello from Vercel!' });
}; 