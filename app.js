
(function(){
  'use strict';

  // ===== Helpers =====
  function $(sel){ return document.querySelector(sel); }
  function isIOS(){
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  }
  function isSafari(){
    // iOS Safari is usually the only one that can install A2HS on iOS
    const ua = navigator.userAgent;
    const isChromium = !!window.chrome && !/Edg\//.test(ua);
    return /^((?!chrome|android).)*safari/i.test(ua) && !isChromium;
  }
  function isiOSSafari(){ return isIOS() && isSafari(); }

  // ===== Load iframe URL (allow override via ?app=) =====
  try{
    const qs = new URLSearchParams(location.search);
    const override = qs.get('app');
    const iframe = $('#app');
    if (override && /^https?:\/\//i.test(override)) {
      iframe.src = override;
      localStorage.setItem('iframe_url', override);
    } else {
      const saved = localStorage.getItem('iframe_url');
      if (saved) iframe.src = saved;
    }
  }catch(e){ /* ignore */ }

  // ===== Offline overlay =====
  function setOfflineUI(on){ $('#offline')?.classList.toggle('show', !!on); }
  addEventListener('online',  ()=>setOfflineUI(false));
  addEventListener('offline', ()=>setOfflineUI(true));
  setOfflineUI(!navigator.onLine);

  // ===== Service Worker (with BASE) =====
  try{
    const BASE = (location.pathname.endsWith('/')
      ? location.pathname
      : location.pathname.replace(/\/[^/]*$/, '/'));
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register(BASE + 'sw.js', {scope: BASE})
        .then(reg => console.log('[PWA] SW registered:', reg.scope))
        .catch(e => console.warn('[PWA] SW register failed:', e));
    }
  }catch(e){ console.warn('[PWA] SW error:', e); }

  // ===== Install Flow =====
  // On iOS Safari: show guidance banner (no beforeinstallprompt)
  if (isiOSSafari()){
    const tip = document.createElement('div');
    tip.setAttribute('role','note');
    tip.style.cssText = 'position:fixed;left:8px;right:8px;bottom:8px;z-index:9999;background:#0f172a;color:#e5e7eb;border:1px solid #334155;border-radius:12px;padding:10px 12px;box-shadow:0 6px 18px rgba(0,0,0,.24);font:600 14px system-ui,-apple-system,Segoe UI,Roboto,Arial';
    tip.innerHTML = 'Trên iPhone/iPad: mở bằng <b>Safari</b> → nhấn nút <b>Share</b> → <b>Add to Home Screen</b>.' +
                    '<button id="closeTip" style="float:right;margin-left:10px;padding:6px 10px;border-radius:10px;border:1px solid #41506a;background:#16243e;color:#fff;cursor:pointer">Đã hiểu</button>';
    document.body.appendChild(tip);
    tip.querySelector('#closeTip').onclick = ()=> tip.remove();
  } else {
    // Android/desktop Chrome: show a floating install button when eligible
    let deferredPrompt = null;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Cài đặt';
    btn.title = 'Cài đặt ứng dụng';
    btn.style.cssText = 'position:fixed;right:16px;bottom:16px;height:46px;padding:0 16px;border-radius:12px;border:1px solid #2a3b57;background:#173156;color:#e5f2ff;font-weight:800;z-index:9999;display:none;';
    document.body.appendChild(btn);

    window.addEventListener('beforeinstallprompt', (e)=>{
      e.preventDefault();
      deferredPrompt = e;
      btn.style.display = 'inline-flex';
    });

    btn.addEventListener('click', async ()=>{
      if (!deferredPrompt) { alert('Nếu không thấy cửa sổ cài đặt, vào menu trình duyệt → "Install app" hoặc "Add to Home screen".'); return; }
      deferredPrompt.prompt();
      await deferredPrompt.userChoice.catch(()=>{});
      deferredPrompt = null;
      btn.style.display = 'none';
    });
  }
})();
