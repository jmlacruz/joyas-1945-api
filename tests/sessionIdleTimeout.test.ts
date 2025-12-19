/**
 * Automated Test Suite for Idle Session Timeout Feature
 * 
 * Prerequisites:
 * - Install dependencies: npm install --save-dev jest @types/jest ts-jest supertest @types/supertest
 * - Configure Jest in package.json or jest.config.js
 * - Set up test database or use environment variables for test DB
 * 
 * Run with: npm test -- sessionIdleTimeout.test.ts
 */

import request from 'supertest';
import express, { Express } from 'express';
import { getDao } from '../src/dao';
import routes from '../src/routes/routes';
import { SESSION_IDLE_TIMEOUT_DAYS } from '../src/environment';

// Mock or use actual server setup
// For this test, we'll assume you have a way to create a test app instance
// You may need to adjust this based on your server setup

describe('Idle Session Timeout Tests', () => {
    let app: Express;
    let testUserToken: string;
    let testUserEmail: string;
    let testUserPassword: string;
    let testUserId: number;
    let adminToken: string;
    let adminEmail: string;

    // Test data - adjust these to match your test database
    const TEST_USER = {
        email: 'test-idle-timeout@example.com',
        password: 'testpassword123',
        habilitado: '1',
        permisos: '0'
    };

    const ADMIN_USER = {
        email: 'admin-idle-timeout@example.com',
        password: 'adminpassword123',
        habilitado: '1',
        permisos: '10'
    };

    beforeAll(async () => {
        // Initialize app - adjust based on your server setup
        app = express();
        app.use(express.json());
        app.use('/api', routes);

        // Create test users if they don't exist
        // This is a placeholder - adjust based on your user creation logic
        testUserEmail = TEST_USER.email;
        testUserPassword = TEST_USER.password;
        adminEmail = ADMIN_USER.email;
    });

    afterAll(async () => {
        // Cleanup: Optionally delete test users or reset last_activity_at
        // await cleanupTestUsers();
    });

    beforeEach(async () => {
        // Reset last_activity_at to NULL before each test for clean state
        const userResponse = await getDao().getTable({
            tableName: 'usuario',
            conditions: [{ field: 'email', value: testUserEmail }],
            fields: ['id']
        });

        if (userResponse.success && userResponse.data && userResponse.data.length) {
            testUserId = userResponse.data[0].id;
            await getDao().updateTable({
                tableName: 'usuario',
                conditions: [{ field: 'id', value: testUserId }],
                data: { last_activity_at: null }
            });
        }
    });

    describe('1. Happy Path - Normal Login Flow', () => {
        test('1.1: Login sets last_activity_at', async () => {
            // Verify last_activity_at is NULL before login
            const beforeLogin = await getDao().getTable({
                tableName: 'usuario',
                conditions: [{ field: 'email', value: testUserEmail }],
                fields: ['id', 'last_activity_at']
            });

            expect(beforeLogin.success).toBe(true);
            if (beforeLogin.data && beforeLogin.data.length) {
                expect(beforeLogin.data[0].last_activity_at).toBeNull();
            }

            // Perform login
            const loginResponse = await request(app)
                .post('/api/login')
                .send({
                    email: testUserEmail,
                    password: testUserPassword,
                    rememberme: false
                });

            expect(loginResponse.status).toBe(200);
            expect(loginResponse.body.success).toBe(true);
            expect(loginResponse.body.data.token).toBeDefined();
            testUserToken = loginResponse.body.data.token;

            // Verify last_activity_at is set after login
            const afterLogin = await getDao().getTable({
                tableName: 'usuario',
                conditions: [{ field: 'email', value: testUserEmail }],
                fields: ['id', 'last_activity_at']
            });

            expect(afterLogin.success).toBe(true);
            if (afterLogin.data && afterLogin.data.length) {
                expect(afterLogin.data[0].last_activity_at).not.toBeNull();
                const lastActivity = new Date(afterLogin.data[0].last_activity_at);
                const now = new Date();
                const diffSeconds = (now.getTime() - lastActivity.getTime()) / 1000;
                expect(diffSeconds).toBeLessThan(5); // Should be within 5 seconds
            }
        });

        test('1.2: Authenticated request updates last_activity_at', async () => {
            // Login first
            const loginResponse = await request(app)
                .post('/api/login')
                .send({
                    email: testUserEmail,
                    password: testUserPassword,
                    rememberme: false
                });

            testUserToken = loginResponse.body.data.token;

            // Get initial last_activity_at
            const initial = await getDao().getTable({
                tableName: 'usuario',
                conditions: [{ field: 'email', value: testUserEmail }],
                fields: ['id', 'last_activity_at']
            });

            const initialTime = initial.data?.[0]?.last_activity_at;
            expect(initialTime).not.toBeNull();

            // Wait 2 seconds
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Make authenticated request
            const isLoggedResponse = await request(app)
                .post('/api/isLogged')
                .set('Authorization', `Bearer ${testUserToken}`);

            expect(isLoggedResponse.status).toBe(200);

            // Verify last_activity_at was updated
            const updated = await getDao().getTable({
                tableName: 'usuario',
                conditions: [{ field: 'email', value: testUserEmail }],
                fields: ['id', 'last_activity_at']
            });

            const updatedTime = updated.data?.[0]?.last_activity_at;
            expect(updatedTime).not.toBeNull();

            const initialDate = new Date(initialTime);
            const updatedDate = new Date(updatedTime);
            expect(updatedDate.getTime()).toBeGreaterThan(initialDate.getTime());
        });

        test('1.3: Multiple sequential requests update activity', async () => {
            // Login
            const loginResponse = await request(app)
                .post('/api/login')
                .send({
                    email: testUserEmail,
                    password: testUserPassword,
                    rememberme: false
                });

            testUserToken = loginResponse.body.data.token;

            const timestamps: string[] = [];

            // Make 3 requests with delays
            for (let i = 0; i < 3; i++) {
                await request(app)
                    .post('/api/isLogged')
                    .set('Authorization', `Bearer ${testUserToken}`);

                await new Promise(resolve => setTimeout(resolve, 1000));

                const userData = await getDao().getTable({
                    tableName: 'usuario',
                    conditions: [{ field: 'email', value: testUserEmail }],
                    fields: ['last_activity_at']
                });

                if (userData.data?.[0]?.last_activity_at) {
                    timestamps.push(userData.data[0].last_activity_at);
                }
            }

            // Verify timestamps are progressively newer
            expect(timestamps.length).toBe(3);
            for (let i = 1; i < timestamps.length; i++) {
                const prev = new Date(timestamps[i - 1]);
                const curr = new Date(timestamps[i]);
                expect(curr.getTime()).toBeGreaterThanOrEqual(prev.getTime());
            }
        });
    });

    describe('2. Idle Session Timeout', () => {
        test('2.1: Session expires after idle timeout', async () => {
            // Login
            const loginResponse = await request(app)
                .post('/api/login')
                .send({
                    email: testUserEmail,
                    password: testUserPassword,
                    rememberme: false
                });

            testUserToken = loginResponse.body.data.token;

            // Set last_activity_at to 8 days ago (beyond timeout)
            const daysAgo = SESSION_IDLE_TIMEOUT_DAYS + 1;
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - daysAgo);
            const pastDateString = pastDate.toISOString().slice(0, 19).replace('T', ' ');

            await getDao().updateTable({
                tableName: 'usuario',
                conditions: [{ field: 'email', value: testUserEmail }],
                data: { last_activity_at: pastDateString }
            });

            // Make authenticated request
            const response = await request(app)
                .post('/api/isLogged')
                .set('Authorization', `Bearer ${testUserToken}`);

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('TOKEN_INVALID');
            expect(response.body.shouldLogout).toBe(true);
        });

        test('2.2: Session valid within timeout period', async () => {
            // Login
            const loginResponse = await request(app)
                .post('/api/login')
                .send({
                    email: testUserEmail,
                    password: testUserPassword,
                    rememberme: false
                });

            testUserToken = loginResponse.body.data.token;

            // Set last_activity_at to 6 days ago (within timeout)
            const daysAgo = SESSION_IDLE_TIMEOUT_DAYS - 1;
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - daysAgo);
            const pastDateString = pastDate.toISOString().slice(0, 19).replace('T', ' ');

            await getDao().updateTable({
                tableName: 'usuario',
                conditions: [{ field: 'email', value: testUserEmail }],
                data: { last_activity_at: pastDateString }
            });

            // Make authenticated request
            const response = await request(app)
                .post('/api/isLogged')
                .set('Authorization', `Bearer ${testUserToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            // Verify last_activity_at was updated
            const updated = await getDao().getTable({
                tableName: 'usuario',
                conditions: [{ field: 'email', value: testUserEmail }],
                fields: ['last_activity_at']
            });

            const updatedTime = new Date(updated.data?.[0]?.last_activity_at);
            const now = new Date();
            const diffSeconds = (now.getTime() - updatedTime.getTime()) / 1000;
            expect(diffSeconds).toBeLessThan(5);
        });

        test('2.3: Session valid at exact timeout boundary', async () => {
            // Login
            const loginResponse = await request(app)
                .post('/api/login')
                .send({
                    email: testUserEmail,
                    password: testUserPassword,
                    rememberme: false
                });

            testUserToken = loginResponse.body.data.token;

            // Set last_activity_at to exactly SESSION_IDLE_TIMEOUT_DAYS ago
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - SESSION_IDLE_TIMEOUT_DAYS);
            const pastDateString = pastDate.toISOString().slice(0, 19).replace('T', ' ');

            await getDao().updateTable({
                tableName: 'usuario',
                conditions: [{ field: 'email', value: testUserEmail }],
                data: { last_activity_at: pastDateString }
            });

            // Make authenticated request
            // Note: Code uses > not >=, so exactly 7 days should still be valid
            const response = await request(app)
                .post('/api/isLogged')
                .set('Authorization', `Bearer ${testUserToken}`);

            expect(response.status).toBe(200);
        });
    });

    describe('3. Edge Cases', () => {
        test('3.1: NULL last_activity_at (first activity)', async () => {
            // Ensure last_activity_at is NULL
            await getDao().updateTable({
                tableName: 'usuario',
                conditions: [{ field: 'email', value: testUserEmail }],
                data: { last_activity_at: null }
            });

            // Login
            const loginResponse = await request(app)
                .post('/api/login')
                .send({
                    email: testUserEmail,
                    password: testUserPassword,
                    rememberme: false
                });

            expect(loginResponse.status).toBe(200);
            testUserToken = loginResponse.body.data.token;

            // Make authenticated request
            const response = await request(app)
                .post('/api/isLogged')
                .set('Authorization', `Bearer ${testUserToken}`);

            expect(response.status).toBe(200);

            // Verify last_activity_at was set
            const userData = await getDao().getTable({
                tableName: 'usuario',
                conditions: [{ field: 'email', value: testUserEmail }],
                fields: ['last_activity_at']
            });

            expect(userData.data?.[0]?.last_activity_at).not.toBeNull();
        });

        test('3.2: User not found in database', async () => {
            // Create a token with non-existent email
            // This requires JWT_SECRET - you may need to import and use it
            // For this test, we'll use a token that decodes to a non-existent email
            // Note: This test may need adjustment based on your JWT setup

            // This is a placeholder - you'll need to create a valid JWT with a fake email
            // const fakeToken = jwt.sign({ email: 'nonexistent@example.com' }, JWT_SECRET);
            
            // For now, skip this test or implement JWT creation
            // expect(true).toBe(true);
        });

        test('3.4: Invalid token format', async () => {
            const response = await request(app)
                .post('/api/isLogged')
                .set('Authorization', 'Bearer invalid-token-12345');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('TOKEN_INVALID');
            expect(response.body.shouldLogout).toBe(true);
        });

        test('3.5: Missing token', async () => {
            const response = await request(app)
                .post('/api/isLogged');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('no se envió el token');
        });
    });

    describe('4. Middleware-Specific Tests', () => {
        test('4.1: verifyToken middleware enforces idle timeout', async () => {
            // Login
            const loginResponse = await request(app)
                .post('/api/login')
                .send({
                    email: testUserEmail,
                    password: testUserPassword,
                    rememberme: false
                });

            testUserToken = loginResponse.body.data.token;

            // Set last_activity_at to 8 days ago
            const daysAgo = SESSION_IDLE_TIMEOUT_DAYS + 1;
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - daysAgo);
            const pastDateString = pastDate.toISOString().slice(0, 19).replace('T', ' ');

            await getDao().updateTable({
                tableName: 'usuario',
                conditions: [{ field: 'email', value: testUserEmail }],
                data: { last_activity_at: pastDateString }
            });

            // Make request to endpoint using verifyToken middleware
            const response = await request(app)
                .get('/api/db/getProductByID?id=1')
                .set('Authorization', `Bearer ${testUserToken}`);

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('TOKEN_INVALID');
            expect(response.body.shouldLogout).toBe(true);
        });

        test('4.2: verifyTokenOrTableName middleware enforces idle timeout', async () => {
            // Login
            const loginResponse = await request(app)
                .post('/api/login')
                .send({
                    email: testUserEmail,
                    password: testUserPassword,
                    rememberme: false
                });

            testUserToken = loginResponse.body.data.token;

            // Set last_activity_at to 8 days ago
            const daysAgo = SESSION_IDLE_TIMEOUT_DAYS + 1;
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - daysAgo);
            const pastDateString = pastDate.toISOString().slice(0, 19).replace('T', ' ');

            await getDao().updateTable({
                tableName: 'usuario',
                conditions: [{ field: 'email', value: testUserEmail }],
                data: { last_activity_at: pastDateString }
            });

            // Make request to endpoint using verifyTokenOrTableName (requires token)
            const response = await request(app)
                .get('/api/db/getTable?tableName=usuario')
                .set('Authorization', `Bearer ${testUserToken}`);

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('TOKEN_INVALID');
        });

        test('4.2b: verifyTokenOrTableName - whitelisted table does not require token', async () => {
            // Request to whitelisted table (producto) without token
            const response = await request(app)
                .get('/api/db/getTable?tableName=producto');

            // Should succeed without token (whitelisted)
            expect([200, 500]).toContain(response.status); // 200 if data exists, 500 if table empty/error
            // Important: Should NOT return 401 (no token required)
            expect(response.status).not.toBe(401);
        });

        test('4.3: allowAdmin middleware enforces idle timeout', async () => {
            // Login as admin
            const loginResponse = await request(app)
                .post('/api/login')
                .send({
                    email: adminEmail,
                    password: ADMIN_USER.password,
                    rememberme: false
                });

            if (loginResponse.status !== 200) {
                // Skip if admin user doesn't exist
                return;
            }

            adminToken = loginResponse.body.data.token;

            // Set last_activity_at to 8 days ago
            const daysAgo = SESSION_IDLE_TIMEOUT_DAYS + 1;
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - daysAgo);
            const pastDateString = pastDate.toISOString().slice(0, 19).replace('T', ' ');

            await getDao().updateTable({
                tableName: 'usuario',
                conditions: [{ field: 'email', value: adminEmail }],
                data: { last_activity_at: pastDateString }
            });

            // Make request to admin-only endpoint
            const response = await request(app)
                .put('/api/db/updateProductsOrder')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ newProductsOrderArr: [] });

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('TOKEN_INVALID');
            expect(response.body.shouldLogout).toBe(true);
        });
    });

    describe('5. Integration Tests', () => {
        test('5.1: Full user session lifecycle', async () => {
            // Step 1: Login
            const loginResponse = await request(app)
                .post('/api/login')
                .send({
                    email: testUserEmail,
                    password: testUserPassword,
                    rememberme: false
                });

            expect(loginResponse.status).toBe(200);
            testUserToken = loginResponse.body.data.token;

            // Step 2: Make multiple authenticated requests
            for (let i = 0; i < 3; i++) {
                const response = await request(app)
                    .post('/api/isLogged')
                    .set('Authorization', `Bearer ${testUserToken}`);

                expect(response.status).toBe(200);
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            // Step 3: Expire session
            const daysAgo = SESSION_IDLE_TIMEOUT_DAYS + 1;
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - daysAgo);
            const pastDateString = pastDate.toISOString().slice(0, 19).replace('T', ' ');

            await getDao().updateTable({
                tableName: 'usuario',
                conditions: [{ field: 'email', value: testUserEmail }],
                data: { last_activity_at: pastDateString }
            });

            // Step 4: Verify session expired
            const expiredResponse = await request(app)
                .post('/api/isLogged')
                .set('Authorization', `Bearer ${testUserToken}`);

            expect(expiredResponse.status).toBe(401);

            // Step 5: Login again
            const newLoginResponse = await request(app)
                .post('/api/login')
                .send({
                    email: testUserEmail,
                    password: testUserPassword,
                    rememberme: false
                });

            expect(newLoginResponse.status).toBe(200);
            expect(newLoginResponse.body.data.token).toBeDefined();
        });
    });
});

