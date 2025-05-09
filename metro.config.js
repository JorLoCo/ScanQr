// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Agregar soporte a recursos wasm
config.resolver.assetExts.push('wasm');

// Agregar headers COEP y COOP para SharedArrayBuffer
config.server.enhanceMiddleware = (middleware) => {
    return (rq, res, next) =>{
        res.setHeader('Cross-Origin-Embedder-Policy', 'credentialles')
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
        middleware(rq, res, next);
    }
};

module.exports = config;
