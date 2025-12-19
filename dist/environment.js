"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SYNC_DATA_CLIENTS_FILENAME = exports.SYNC_DATA_CODEPRICESTOCK_FILENAME = exports.SYNC_DATA_FTP_ADDRESS = exports.SYNC_DATA_FTP_USER = exports.SYNC_DATA_FTP_PASSWORD = exports.SYNC_DATA_ENDPOINT_PASSWORD = exports.ADJ_GOOGLE_PLACE_ID = exports.SERPAPI_GOOGLE_REVIEWS_API_KEY = exports.JWT3_SECRET = exports.GETSTREAM_APP_ID = exports.GETSTREAM_SECRET = exports.GETSTREAM_API_KEY = exports.JWT2_SECRET = exports.CART_REMINDER_WAIT_IN_HOURS = exports.CRON_API_KEY = exports.ADMINS_EMAILS_LIST = exports.BREVO_API_KEY = exports.FIREBASE_BUCKET_URL = exports.THUMBNAILS_WIDTH = exports.IMAGES_WIDTH = exports.SESSION_IDLE_TIMEOUT_DAYS = exports.JWT_EXPIRATION_TIME = exports.JWT_SECRET = exports.NODE_ENV = exports.DOCUMENTS_FIREBASE_ROUTE = exports.IMAGES_FIREBASE_ROUTE = exports.THUMBNAILS_FIREBASE_ROUTE = exports.BLOG_THUMBNAILS_ROUTE = exports.BLOG_IMAGES_ROUTE = exports.FAQS_IMAGES_ROUTE = exports.BRANDS_IMAGES_ROUTE = exports.THUMBNAILS_ROUTE = exports.IMAGES_ROUTE = exports.CORS_ALLOW_ORIGINS = exports.CURRENT_API_BASE_URL = exports.CURRENT_FRONT_BASE_URL = exports.CURRENT_DASHBOARD_BASE_URL = exports.mySQL_RemoteConfig = exports.mySQL_LocalConfig = void 0;
require("dotenv/config");
// Helper function to parse SSL configuration
const parseSSLConfig = (sslConfigString) => {
    if (!sslConfigString)
        return false;
    try {
        const parsed = JSON.parse(sslConfigString);
        // If it's a boolean, convert to appropriate object or boolean
        if (typeof parsed === "boolean") {
            // For managed databases (like DigitalOcean), true should be converted to SSL object
            return parsed ? { rejectUnauthorized: false } : false;
        }
        // If it's an object, return it as is
        if (typeof parsed === "object" && parsed !== null) {
            return parsed;
        }
        // Fallback to false for any other type
        return false;
    }
    catch (error) {
        // If JSON parsing fails, treat as boolean
        if (sslConfigString.toLowerCase() === "true") {
            // For managed databases, convert true to SSL object
            return { rejectUnauthorized: false };
        }
        if (sslConfigString.toLowerCase() === "false")
            return false;
        // Default to false for invalid values
        return false;
    }
};
exports.mySQL_LocalConfig = {
    host: process.env.mySQL_LocalHost,
    user: process.env.mySQL_LocalUser,
    password: process.env.mySQL_LocalPassword,
    databaseName: process.env.mySQL_LocalDatabaseName,
    ssl: parseSSLConfig(process.env.mySQL_LocalSSLConfig),
    port: parseInt(process.env.mySQL_LocalPort),
};
exports.mySQL_RemoteConfig = {
    host: process.env.mySQL_RemoteHost,
    user: process.env.mySQL_RemoteUser,
    password: process.env.mySQL_RemotePassword,
    databaseName: process.env.mySQL_RemoteDatabaseName,
    ssl: parseSSLConfig(process.env.mySQL_RemoteSSLConfig),
    port: parseInt(process.env.mySQL_RemotePort),
};
exports.CURRENT_DASHBOARD_BASE_URL = process.env.CURRENT_DASHBOARD_BASE_URL;
exports.CURRENT_FRONT_BASE_URL = process.env.NODE_ENV ? process.env.PROD_FRONT_BASE_URL : process.env.DEV_FRONT_BASE_URL;
exports.CURRENT_API_BASE_URL = process.env.NODE_ENV ? process.env.PROD_API_BASE_URL : process.env.DEV_API_BASE_URL;
exports.CORS_ALLOW_ORIGINS = (_a = process.env.CORS_ALLOW_ORIGINS) === null || _a === void 0 ? void 0 : _a.split(",").map((origin) => origin.trim());
exports.IMAGES_ROUTE = process.env.IMAGES_ROUTE;
exports.THUMBNAILS_ROUTE = process.env.THUMBNAILS_ROUTE;
exports.BRANDS_IMAGES_ROUTE = process.env.BRANDS_IMAGES_ROUTE;
exports.FAQS_IMAGES_ROUTE = process.env.FAQS_IMAGES_ROUTE;
exports.BLOG_IMAGES_ROUTE = process.env.BLOG_IMAGES_ROUTE;
exports.BLOG_THUMBNAILS_ROUTE = process.env.BLOG_THUMBNAILS_ROUTE;
exports.THUMBNAILS_FIREBASE_ROUTE = process.env.THUMBNAILS_FIREBASE_ROUTE;
exports.IMAGES_FIREBASE_ROUTE = process.env.IMAGES_FIREBASE_ROUTE;
exports.DOCUMENTS_FIREBASE_ROUTE = process.env.DOCUMENTS_FIREBASE_ROUTE;
exports.NODE_ENV = process.env.NODE_ENV;
exports.JWT_SECRET = process.env.JWT_SECRET;
exports.JWT_EXPIRATION_TIME = process.env.JWT_EXPIRATION_TIME;
exports.SESSION_IDLE_TIMEOUT_DAYS = process.env.SESSION_IDLE_TIMEOUT_DAYS ? parseFloat(process.env.SESSION_IDLE_TIMEOUT_DAYS) : 7;
exports.IMAGES_WIDTH = process.env.IMAGES_WIDTH;
exports.THUMBNAILS_WIDTH = process.env.THUMBNAILS_WIDTH;
exports.FIREBASE_BUCKET_URL = process.env.FIREBASE_BUCKET_URL;
exports.BREVO_API_KEY = process.env.BREVO_API_KEY;
const getAdminsEmailList = () => {
    if (!process.env.DEV_ADMIN_EMAIL_LIST && !process.env.NODE_ENV) { //Estamos en desarrollo y no hay lista de emails de admins en desarrollo
        return null;
    }
    else if (!process.env.PROD_ADMIN_EMAIL_LIST && process.env.NODE_ENV) { //Estamos en produccion y no hay lista de emails de admins de produccion
        return null;
    }
    else if (process.env.DEV_ADMIN_EMAIL_LIST && !process.env.NODE_ENV) { //Estamos en desarrollo y hay lista de emails de admins en desarrollo
        const DEV_ADMIN_EMAIL_LIST_ARR = process.env.DEV_ADMIN_EMAIL_LIST.split(",").map((email) => email.trim());
        const DEV_ADMIN_EMAIL_LIST_ARR_PARSED = DEV_ADMIN_EMAIL_LIST_ARR.map((email) => ({ email }));
        return DEV_ADMIN_EMAIL_LIST_ARR_PARSED;
    }
    else if (process.env.PROD_ADMIN_EMAIL_LIST && process.env.NODE_ENV) {
        const PROD_ADMIN_EMAIL_LIST_ARR = process.env.PROD_ADMIN_EMAIL_LIST.split(", ").map((email) => email.trim()); //Estamos en produccion y hay lista de emails de admins de produccion
        const PROD_ADMIN_EMAIL_LIST_ARR_PARSED = PROD_ADMIN_EMAIL_LIST_ARR.map((email) => ({ email }));
        return PROD_ADMIN_EMAIL_LIST_ARR_PARSED;
    }
    else {
        return null;
    }
};
exports.ADMINS_EMAILS_LIST = getAdminsEmailList();
exports.CRON_API_KEY = process.env.CRON_API_KEY;
exports.CART_REMINDER_WAIT_IN_HOURS = process.env.CART_REMINDER_WAIT_IN_HOURS ? parseFloat(process.env.CART_REMINDER_WAIT_IN_HOURS) : 48;
exports.JWT2_SECRET = process.env.JWT2_SECRET;
exports.GETSTREAM_API_KEY = process.env.GETSTREAM_API_KEY;
exports.GETSTREAM_SECRET = process.env.GETSTREAM_SECRET;
exports.GETSTREAM_APP_ID = process.env.GETSTREAM_APP_ID;
exports.JWT3_SECRET = process.env.JWT3_SECRET;
exports.SERPAPI_GOOGLE_REVIEWS_API_KEY = process.env.SERPAPI_GOOGLE_REVIEWS_API_KEY;
exports.ADJ_GOOGLE_PLACE_ID = process.env.ADJ_GOOGLE_PLACE_ID;
exports.SYNC_DATA_ENDPOINT_PASSWORD = process.env.SYNC_DATA_ENDPOINT_PASSWORD;
exports.SYNC_DATA_FTP_PASSWORD = process.env.SYNC_DATA_FTP_PASSWORD;
exports.SYNC_DATA_FTP_USER = process.env.SYNC_DATA_FTP_USER;
exports.SYNC_DATA_FTP_ADDRESS = process.env.SYNC_DATA_FTP_ADDRESS;
exports.SYNC_DATA_CODEPRICESTOCK_FILENAME = process.env.SYNC_DATA_CODEPRICESTOCK_FILENAME;
exports.SYNC_DATA_CLIENTS_FILENAME = process.env.SYNC_DATA_CLIENTS_FILENAME;
//# sourceMappingURL=environment.js.map