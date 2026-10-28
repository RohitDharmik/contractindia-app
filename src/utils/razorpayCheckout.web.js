import { loadRazorpay } from "./loadRazorpay";

export const openRazorpay = async (options) => {
  const Razorpay = await loadRazorpay();

  return new Promise((resolve, reject) => {
    const checkout = new Razorpay({
      ...options,
      handler: resolve,
      modal: {
        ...options.modal,
        ondismiss: () => reject({ code: 0, description: "Checkout closed." }),
      },
    });

    checkout.on("payment.failed", (response) => {
      reject(response?.error || response);
    });
    checkout.open();
  });
};