module.exports = {
  presets: [[require.resolve('@babel/preset-env'), { targets: { node: 'current' } }]],
  plugins: [require.resolve('babel-plugin-transform-vite-meta-env')],
};
