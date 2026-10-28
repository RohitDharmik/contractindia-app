let razorpayScriptPromise;

export const loadRazorpay = () => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(new Error("Razorpay checkout requires a browser."));
  }

  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (razorpayScriptPromise) return razorpayScriptPromise;

  const existingScript = document.querySelector(
    'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
  );
  const script = existingScript || document.createElement("script");

  razorpayScriptPromise = new Promise((resolve, reject) => {
    script.onload = () => {
      if (window.Razorpay) {
        resolve(window.Razorpay);
      } else {
        reject(new Error("Razorpay checkout failed to initialize."));
      }
    };
    script.onerror = () => {
      script.remove();
      reject(new Error("Failed to load Razorpay checkout."));
    };

    if (!existingScript) {
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }).catch((error) => {
    razorpayScriptPromise = null;
    throw error;
  });

  return razorpayScriptPromise;
};
