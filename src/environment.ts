import "dotenv/config";

// Helper function to parse SSL configuration
const parseSSLConfig = (sslConfigString: string | undefined) => {
    if (!sslConfigString) return false;
    
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
    } catch (error) {
        // If JSON parsing fails, treat as boolean
        if (sslConfigString.toLowerCase() === "true") {
            // For managed databases, convert true to SSL object
            return { rejectUnauthorized: false };
        }
        if (sslConfigString.toLowerCase() === "false") return false;
        
        // Default to false for invalid values
        return false;
    }
};

export const mySQL_LocalConfig = {
    host: process.env.mySQL_LocalHost,
    user: process.env.mySQL_LocalUser,
    password: process.env.mySQL_LocalPassword,
    databaseName: process.env.mySQL_LocalDatabaseName,
    ssl: parseSSLConfig(process.env.mySQL_LocalSSLConfig),
    port: parseInt(process.env.mySQL_LocalPort as string),
};

export const mySQL_RemoteConfig = {
    host: process.env.mySQL_RemoteHost,
    user: process.env.mySQL_RemoteUser,
    password: process.env.mySQL_RemotePassword,
    databaseName: process.env.mySQL_RemoteDatabaseName,
    ssl: parseSSLConfig(process.env.mySQL_RemoteSSLConfig),
    port: parseInt(process.env.mySQL_RemotePort as string),
};

export const CURRENT_DASHBOARD_BASE_URL = process.env.CURRENT_DASHBOARD_BASE_URL;

export const CURRENT_FRONT_BASE_URL = process.env.NODE_ENV ? process.env.PROD_FRONT_BASE_URL : process.env.DEV_FRONT_BASE_URL;
export const CURRENT_API_BASE_URL = process.env.NODE_ENV ? process.env.PROD_API_BASE_URL : process.env.DEV_API_BASE_URL;

export const CORS_ALLOW_ORIGINS = process.env.CORS_ALLOW_ORIGINS?.split(",").map((origin: string) => origin.trim());

export const IMAGES_ROUTE = process.env.IMAGES_ROUTE;
export const THUMBNAILS_ROUTE = process.env.THUMBNAILS_ROUTE;
export const BRANDS_IMAGES_ROUTE = process.env.BRANDS_IMAGES_ROUTE;
export const FAQS_IMAGES_ROUTE = process.env.FAQS_IMAGES_ROUTE;
export const BLOG_IMAGES_ROUTE = process.env.BLOG_IMAGES_ROUTE;
export const BLOG_THUMBNAILS_ROUTE = process.env.BLOG_THUMBNAILS_ROUTE;

export const THUMBNAILS_FIREBASE_ROUTE = process.env.THUMBNAILS_FIREBASE_ROUTE;
export const IMAGES_FIREBASE_ROUTE = process.env.IMAGES_FIREBASE_ROUTE;
export const DOCUMENTS_FIREBASE_ROUTE = process.env.DOCUMENTS_FIREBASE_ROUTE;

export const NODE_ENV = process.env.NODE_ENV;

export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_EXPIRATION_TIME = process.env.JWT_EXPIRATION_TIME;
export const SESSION_IDLE_TIMEOUT_DAYS = process.env.SESSION_IDLE_TIMEOUT_DAYS ? parseFloat(process.env.SESSION_IDLE_TIMEOUT_DAYS) : 7;

export const IMAGES_WIDTH = process.env.IMAGES_WIDTH;
export const THUMBNAILS_WIDTH = process.env.THUMBNAILS_WIDTH;

export const FIREBASE_BUCKET_URL = process.env.FIREBASE_BUCKET_URL;

export const BREVO_API_KEY = process.env.BREVO_API_KEY;

const getAdminsEmailList = () => {
    if (!process.env.DEV_ADMIN_EMAIL_LIST && !process.env.NODE_ENV) {                                                               //Estamos en desarrollo y no hay lista de emails de admins en desarrollo
        return null;
    } else if (!process.env.PROD_ADMIN_EMAIL_LIST && process.env.NODE_ENV) {                                                        //Estamos en produccion y no hay lista de emails de admins de produccion
        return null;
    } else if (process.env.DEV_ADMIN_EMAIL_LIST && !process.env.NODE_ENV) {                                                         //Estamos en desarrollo y hay lista de emails de admins en desarrollo
        const DEV_ADMIN_EMAIL_LIST_ARR = process.env.DEV_ADMIN_EMAIL_LIST.split(",").map((email: string) => email.trim());
        const DEV_ADMIN_EMAIL_LIST_ARR_PARSED = DEV_ADMIN_EMAIL_LIST_ARR.map((email: string) => ({email}));
        return DEV_ADMIN_EMAIL_LIST_ARR_PARSED;
    } else if (process.env.PROD_ADMIN_EMAIL_LIST && process.env.NODE_ENV) {
        const PROD_ADMIN_EMAIL_LIST_ARR = process.env.PROD_ADMIN_EMAIL_LIST.split(", ").map((email: string) => email.trim());       //Estamos en produccion y hay lista de emails de admins de produccion
        const PROD_ADMIN_EMAIL_LIST_ARR_PARSED = PROD_ADMIN_EMAIL_LIST_ARR.map((email: string) => ({email}));
        return PROD_ADMIN_EMAIL_LIST_ARR_PARSED;
    } else {
        return null;
    }
};
export const ADMINS_EMAILS_LIST = getAdminsEmailList();

export const CART_REMINDER_WAIT_IN_HOURS = process.env.CART_REMINDER_WAIT_IN_HOURS ? parseFloat(process.env.CART_REMINDER_WAIT_IN_HOURS) : 48;
export const JWT2_SECRET = process.env.JWT2_SECRET;

export const GETSTREAM_API_KEY = process.env.GETSTREAM_API_KEY;
export const GETSTREAM_SECRET = process.env.GETSTREAM_SECRET;
export const GETSTREAM_APP_ID = process.env.GETSTREAM_APP_ID;

export const JWT3_SECRET = process.env.JWT3_SECRET;

export const API_GOOGLE_REVIEWS_API_KEY = process.env.API_GOOGLE_REVIEWS_API_KEY;
export const GOOGLE_PLACE_ID = process.env.GOOGLE_PLACE_ID;

export const SYNC_DATA_ENDPOINT_PASSWORD = process.env.SYNC_DATA_ENDPOINT_PASSWORD;

export const SYNC_DATA_FTP_PASSWORD = process.env.SYNC_DATA_FTP_PASSWORD;
export const SYNC_DATA_FTP_USER = process.env.SYNC_DATA_FTP_USER;
export const SYNC_DATA_FTP_ADDRESS = process.env.SYNC_DATA_FTP_ADDRESS;
export const SYNC_DATA_CODEPRICESTOCK_FILENAME = process.env.SYNC_DATA_CODEPRICESTOCK_FILENAME;
export const SYNC_DATA_CLIENTS_FILENAME = process.env.SYNC_DATA_CLIENTS_FILENAME;

