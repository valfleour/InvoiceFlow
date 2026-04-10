import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import connectDB from './infrastructure/database/mongo/connection';

// Repositories
import { MongoBusinessProfileRepository } from './infrastructure/database/repositories/MongoBusinessProfileRepository';
import { MongoClientRepository } from './infrastructure/database/repositories/MongoClientRepository';
import { MongoInvoiceRepository } from './infrastructure/database/repositories/MongoInvoiceRepository';
import { MongoInvoiceCreationRequestRepository } from './infrastructure/database/repositories/MongoInvoiceCreationRequestRepository';
import { MongoPaymentRepository } from './infrastructure/database/repositories/MongoPaymentRepository';
import { MongoSessionRepository } from './infrastructure/database/repositories/MongoSessionRepository';
import { MongoUserRepository } from './infrastructure/database/repositories/MongoUserRepository';
import { MongoWorkspaceRepository } from './infrastructure/database/repositories/MongoWorkspaceRepository';

// Application Services
import { AuthService } from './application/auth/AuthService';
import { BusinessProfileService } from './application/business-profile/BusinessProfileService';
import { ClientService } from './application/clients/ClientService';
import { InvoiceService } from './application/invoices/InvoiceService';

// Routes
import { authenticate } from './api/middleware/authenticate';
import { authRoutes } from './api/routes/authRoutes';
import { businessProfileRoutes } from './api/routes/businessProfileRoutes';
import { clientRoutes } from './api/routes/clientRoutes';
import { invoiceRoutes } from './api/routes/invoiceRoutes';
import { errorHandler } from './api/middleware/errorHandler';

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

// Wire up DDD layers
const businessProfileRepo = new MongoBusinessProfileRepository();
const clientRepo = new MongoClientRepository();
const invoiceRepo = new MongoInvoiceRepository();
const invoiceCreationRequestRepo = new MongoInvoiceCreationRequestRepository();
const paymentRepo = new MongoPaymentRepository();
const sessionRepo = new MongoSessionRepository();
const userRepo = new MongoUserRepository();
const workspaceRepo = new MongoWorkspaceRepository();

const authService = new AuthService(userRepo, workspaceRepo, sessionRepo);
const businessProfileService = new BusinessProfileService(businessProfileRepo, invoiceRepo);
const clientService = new ClientService(clientRepo, invoiceRepo);
const invoiceService = new InvoiceService(
    invoiceRepo,
    paymentRepo,
    businessProfileRepo,
    clientRepo,
    invoiceCreationRequestRepo
);

// Routes (domain-aligned API)
app.use('/api/auth', authRoutes(authService));
app.use('/api/businesses', authenticate(authService), businessProfileRoutes(businessProfileService));
app.use('/api/clients', authenticate(authService), clientRoutes(clientService));
app.use('/api/invoices', authenticate(authService), invoiceRoutes(invoiceService, businessProfileService, clientService));

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use(errorHandler);

// Start
const PORT = process.env.PORT || 4000;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`InvoiceFlow API running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Failed to connect to MongoDB', err);
        process.exit(1);
    });

export default app;
