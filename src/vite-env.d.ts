/// <reference types="vite/client" />

/**
 * Deklarasi modul untuk impor efek samping berkas gaya.
 *
 * Tanpa berkas ini `import './index.css'` di `src/main.tsx` memicu
 * TS2882 saat `npm run type-check`.
 */
declare module '*.css' {
	const content: string
	export default content
}
