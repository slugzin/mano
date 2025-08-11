// Configuração de build para produção
export default {
  // Configurações de otimização
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        supabase: {
          test: /[\\/]node_modules[\\/]@supabase[\\/]/,
          name: 'supabase',
          chunks: 'all',
        },
        ui: {
          test: /[\\/]node_modules[\\/](framer-motion|lucide-react)[\\/]/,
          name: 'ui',
          chunks: 'all',
        }
      }
    }
  },
  
  // Configurações de performance
  performance: {
    hints: 'warning',
    maxEntrypointSize: 512000,
    maxAssetSize: 512000
  },
  
  // Configurações de cache
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename]
    }
  }
}; 