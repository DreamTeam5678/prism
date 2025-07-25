import path from 'path';
console.log("🧠 Loading next.config.ts");

const nextConfig = {
 
  webpack(config: any) {
    config.resolve.alias['@backend'] = path.resolve(__dirname, '../backend');
    return config;
  },
  
};

export default nextConfig;
