"use strict";

exports.config = {
    port:process.env.PORT || 3000,
    auth:process.env.AUTH || true,
    secretKey: process.env.SECRET_KEY || '',
    jwtSecret:process.env.SECRET_KEY || '',
    mongoUrl: {
        'dev': process.env.DB_CONNECTION_DEV || '',
        'local': process.env.DB_CONNECTION_LOCAL || '',
        'prod': process.env.DB_CONNECTION_PROD || '',
        'admin': process.env.DB_CONNECTION_ADMIN || '',
        'cluster': process.env.DB_CONNECTION_CLUSTER || ''
    },
    facebook: {
        'clientId': process.env.FACEBOOK_CLIENT_ID || '',
        'clientSecret': process.env.FACEBOOK_CLIENT_SECRET || ''
    }
};
