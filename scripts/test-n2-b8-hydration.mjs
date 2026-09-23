process.env.NEU_N2_HYDRATION_RUNNER = './test-n2-b8-hydration-browser.mjs';
await import('./test-n2-b7-hydration.mjs');
console.log('B8 InputMask Chromium SSR/hydration and first interactions PASS');
