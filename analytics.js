// GA4計測(script.jsを読み込まない静的ページ用の共有スニペット)。
// ローカル開発サーバーからのアクセスは除外し、本番GA4へのダミーpageview記録を防ぐ。
(function () {
  const GA_MEASUREMENT_ID = 'G-NHH50DVLVN';
  const isLocalDev = ['localhost', '127.0.0.1', ''].includes(location.hostname);
  if (!GA_MEASUREMENT_ID || isLocalDev) return;
  const gaScript = document.createElement('script');
  gaScript.async = true;
  gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(gaScript);
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, { page_location: location.origin + location.pathname });
})();
