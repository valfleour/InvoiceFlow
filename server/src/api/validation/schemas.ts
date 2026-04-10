import { z } from 'zod';

const hasAllowedScale = (value: number, maxScale: number) => Number(value.toFixed(maxScale)) === value;
const strongPasswordSchema = z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters')
    .refine((value) => /[a-z]/.test(value), 'Password must include at least one lowercase letter')
    .refine((value) => /[A-Z]/.test(value), 'Password must include at least one uppercase letter')
    .refine((value) => /\d/.test(value), 'Password must include at least one number');

const AddressSchema = z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    country: z.string().min(1, 'Country is required'),
});

export const SignUpSchema = z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name must be at most 100 characters'),
    email: z.string().trim().email('Valid email is required'),
    password: strongPasswordSchema,
});

export const SignInSchema = z.object({
    email: z.string().trim().email('Valid email is required'),
    password: z.string().min(1, 'Password is required'),
});

export const ForgotPasswordSchema = z.object({
    email: z.string().trim().email('Valid email is required'),
});

export const RequestEmailVerificationSchema = z.object({
    email: z.string().trim().email('Valid email is required'),
});

export const VerifyEmailSchema = z.object({
    token: z.string().trim().min(1, 'Email verification token is required'),
});

export const ResetPasswordSchema = z.object({
    token: z.string().trim().min(1, 'Password reset token is required'),
    password: strongPasswordSchema,
});

export const UpdateProfileSchema = z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name must be at most 100 characters'),
});

export const CreateBusinessProfileSchema = z.object({
    isActive: z.boolean().default(false),
    businessName: z.string().min(1, 'Business name is required'),
    logoUrl: z.string().url().optional(),
    address: AddressSchema,
    email: z.string().email('Valid email is required'),
    phone: z.string().min(7, 'Valid phone is required'),
    website: z.string().url().optional(),
    taxId: z.string().optional(),
    defaultCurrency: z.string().min(1).default('USD'),
    paymentInstructions: z.string().optional(),
});

export const UpdateBusinessProfileSchema = CreateBusinessProfileSchema.partial();

export const CreateClientSchema = z.object({
    businessId: z.string().min(1, 'Business ID is required'),
    isActive: z.boolean().default(true),
    clientName: z.string().min(1, 'Client name is required'),
    companyName: z.string().optional(),
    billingAddress: AddressSchema,
    email: z.string().email('Valid email is required'),
    phone: z.string().optional(),
    taxId: z.string().optional(),
    notes: z.string().optional(),
});

export const UpdateClientSchema = CreateClientSchema.omit({ businessId: true }).partial();

const LineItemSchema = z.object({
    id: z.string().optional(),
    itemName: z.string().min(1, 'Item name is required'),
    description: z.string().optional(),
    unit: z.string().optional(),
    quantity: z.number().positive('Quantity must be greater than zero')
        .refine((value) => hasAllowedScale(value, 3), 'Quantity must use no more than 3 decimal places'),
    unitPrice: z.number().min(0, 'Unit price cannot be negative')
        .refine((value) => hasAllowedScale(value, 2), 'Unit price must use no more than 2 decimal places'),
    discountType: z.literal('Percentage').default('Percentage'),
    discountPercent: z.number().min(0).max(100).default(0),
    taxPercent: z.number().min(0).max(100).optional(),
    taxes: z.array(
        z.object({
            code: z.string().min(1, 'Tax code is required'),
            name: z.string().optional(),
            calculationType: z.literal('Percentage').default('Percentage'),
            ratePercent: z.number().min(0).max(100),
        })
    ).optional(),
});

const RequiredDateStringSchema = z.string().min(1, 'Due date is required');
const OptionalDateStringSchema = z.union([z.string().min(1), z.null()]).optional();

export const CreateInvoiceSchema = z.object({
    businessId: z.string().min(1, 'Business ID is required'),
    clientId: z.string().min(1, 'Client ID is required'),
    invoiceDate: z.string().min(1, 'Invoice date is required'),
    dueDate: RequiredDateStringSchema,
    currency: z.string().min(1).default('USD'),
    lineItems: z.array(LineItemSchema).min(1, 'At least one line item is required'),
    extraFees: z.number().min(0).default(0)
        .refine((value) => hasAllowedScale(value, 2), 'Extra fees must use no more than 2 decimal places'),
    notes: z.string().optional(),
    terms: z.string().optional(),
});

export const UpdateDraftInvoiceSchema = z.object({
    invoiceDate: z.string().optional(),
    dueDate: OptionalDateStringSchema,
    currency: z.string().optional(),
    lineItems: z.array(LineItemSchema).min(1, 'At least one line item is required').optional(),
    extraFees: z.number().min(0).optional()
        .refine((value) => value === undefined || hasAllowedScale(value, 2), 'Extra fees must use no more than 2 decimal places'),
    notes: z.string().optional(),
    terms: z.string().optional(),
});

export const RecordPaymentSchema = z.object({
    paymentDate: z.string().min(1, 'Payment date is required'),
    amount: z.number().positive('Payment amount must be greater than zero')
        .refine((value) => hasAllowedScale(value, 2), 'Payment amount must use no more than 2 decimal places'),
    method: z.string().min(1, 'Payment method is required'),
    referenceNumber: z.string().optional(),
    note: z.string().optional(),
});

export const CancelInvoiceSchema = z.object({
    reason: z.string().trim().min(1, 'Cancellation reason is required'),
});

export const VoidInvoiceSchema = z.object({
    reason: z.string().trim().min(1, 'Void reason is required'),
});
