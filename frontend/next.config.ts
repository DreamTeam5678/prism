const nextConfig = {
  experimental: {
    css: {
      // use the built-in Rust-powered transformer
      transform: 'lightningcss',
    },
  },
};

module.exports = nextConfig;
