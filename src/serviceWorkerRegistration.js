// CRA PWA Service Worker
const isLocalhost = Boolean(
    window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(
      /^127(?:\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)){3}$/
    )
  );
  
  export function register(config) {
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;
  
      if (isLocalhost) {
        checkValidServiceWorker(swUrl, config);
      } else {
        registerValidSW(swUrl, config);
      }
    }
  }
  
  function registerValidSW(swUrl, config) {
    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        if (registration.waiting) {
          if (config && config.onUpdate) {
            config.onUpdate(registration);
          }
        }
  
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (
                installingWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                if (config && config.onUpdate) {
                  config.onUpdate(registration);
                }
              } else if (installingWorker.state === 'installed') {
                if (config && config.onSuccess) {
                  config.onSuccess(registration);
                }
              }
            };
          }
        };
      })
      .catch(console.error);
  }
  
  function checkValidServiceWorker(swUrl, config) {
    fetch(swUrl)
      .then((response) => {
        const contentType = response.headers.get('content-type');
        if (
          response.status === 404 ||
          (contentType && contentType.indexOf('javascript') === -1)
        ) {
          navigator.serviceWorker.ready.then((registration) =>
            registration.unregister().then(() => window.location.reload())
          );
        } else {
          registerValidSW(swUrl, config);
        }
      })
      .catch(() =>
        console.log('No internet connection found. App is running in offline mode.')
      );
  }
  
  export function unregister() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((registration) => registration.unregister())
        .catch(console.error);
    }
  }
  