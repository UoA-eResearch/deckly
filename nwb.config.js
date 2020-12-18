module.exports = {
  type: 'react-component',
  npm: {
    esModules: true,
    umd: {
      global: 'Deckly'
    }
  },
  webpack: {
    extractCSS: {
      filename: 'deckly.css'
    }
  }
}
