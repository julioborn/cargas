import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development", // Desactiva PWA en desarrollo
});

module.exports = withPWA({
  reactStrictMode: true,
});


export default nextConfig;
