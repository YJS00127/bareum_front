// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import tailwindcss from '@tailwindcss/vite'

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [
//     react(),
//     tailwindcss(),
//   ],
// })

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})

// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // CSV 파일을 정적 텍스트로 안전하게 로드하기 위한 커스텀 로더 설정
// export default defineConfig({
//   plugins: [
//     react(),
//     {
//       name: 'raw-csv-loader',
//       transform(code, id) {
//         if (id.endsWith('.csv')) {
//           return {
//             code: `export default ${JSON.stringify(code)};`,
//             map: null
//           }
//         }
//       }
//     }
//   ]
// })



// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   server: {
//     proxy: {
//       // 프론트엔드에서 /api로 시작하는 모든 주소는 
//       // 자동으로 백엔드 서버(http://localhost:8080)로 연결되도록 길을 뚫어줍니다.
//       '/api': {
//         target: 'http://localhost:8080',
//         changeOrigin: true,
//         secure: false,
//       }
//     }
//   }
// })