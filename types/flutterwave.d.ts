declare module "flutterwave-node-v3";

interface Window {
  FlutterwaveCheckout?: (...args: unknown[]) => void;
}
