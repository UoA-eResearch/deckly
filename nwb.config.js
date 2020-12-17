module.exports = {
  type: 'react-component',
  npm: {
    esModules: true,
    umd: {
      global: 'Deckly',
      externals: {
        react: 'React'
      }
    }
  }
}
