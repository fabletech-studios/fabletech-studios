import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';

const CUSTOMERS_FILE = path.join(process.cwd(), 'data', 'customers.json');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface Customer {
  id: string;
  email: string;
  password: string;
  name: string;
  credits: number;
  createdAt: string;
  resetToken?: string;
  resetTokenExpiry?: string;
  unlockedEpisodes?: Array<{
    seriesId: string;
    episodeNumber: number;
    unlockedAt: string;
  }>;
  stats?: {
    episodesUnlocked: number;
    creditsSpent: number;
  };
}

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (error) {
    console.error('Error creating data directory:', error);
  }
}

// Load customers from file
async function loadCustomers(): Promise<Customer[]> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(CUSTOMERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist yet
    return [];
  }
}

// Save customers to file
async function saveCustomers(customers: Customer[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(CUSTOMERS_FILE, JSON.stringify(customers, null, 2));
}

// Create new customer
export async function createCustomer(email: string, password: string, name: string): Promise<{ success: boolean; error?: string; customer?: Customer }> {
  const customers = await loadCustomers();
  
  // Check if email already exists
  if (customers.find(c => c.email === email)) {
    return { success: false, error: 'Email already registered' };
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Create new customer
  const newCustomer: Customer = {
    id: `customer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    email,
    password: hashedPassword,
    name,
    credits: 100, // Starting credits
    createdAt: new Date().toISOString()
  };
  
  customers.push(newCustomer);
  await saveCustomers(customers);
  
  return { success: true, customer: newCustomer };
}

// Verify customer credentials
export async function verifyCustomer(email: string, password: string): Promise<{ success: boolean; error?: string; customer?: Customer }> {
  const customers = await loadCustomers();
  const customer = customers.find(c => c.email === email);
  
  if (!customer) {
    return { success: false, error: 'Invalid email or password' };
  }
  
  const isValid = await bcrypt.compare(password, customer.password);
  if (!isValid) {
    return { success: false, error: 'Invalid email or password' };
  }
  
  return { success: true, customer };
}

// Generate JWT token
export function generateToken(customer: Customer): string {
  return jwt.sign(
    { 
      id: customer.id, 
      email: customer.email,
      name: customer.name,
      type: 'customer' 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Verify JWT token
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Get customer by ID
export async function getCustomerById(id: string): Promise<Customer | null> {
  const customers = await loadCustomers();
  return customers.find(c => c.id === id) || null;
}

// Update customer
export async function updateCustomer(id: string, updates: Partial<Customer>): Promise<boolean> {
  const customers = await loadCustomers();
  const index = customers.findIndex(c => c.id === id);
  
  if (index === -1) return false;
  
  customers[index] = { ...customers[index], ...updates };
  await saveCustomers(customers);
  return true;
}

// Generate password reset token
export async function generateResetToken(email: string): Promise<{ success: boolean; error?: string; token?: string }> {
  const customers = await loadCustomers();
  const customer = customers.find(c => c.email === email);
  
  if (!customer) {
    return { success: false, error: 'Email not found' };
  }
  
  const resetToken = Math.random().toString(36).substr(2, 32);
  const resetTokenExpiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour
  
  await updateCustomer(customer.id, { resetToken, resetTokenExpiry });
  
  return { success: true, token: resetToken };
}

// Reset password with token
export async function resetPasswordWithToken(token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  const customers = await loadCustomers();
  const customer = customers.find(c => 
    c.resetToken === token && 
    c.resetTokenExpiry && 
    new Date(c.resetTokenExpiry) > new Date()
  );
  
  if (!customer) {
    return { success: false, error: 'Invalid or expired reset token' };
  }
  
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await updateCustomer(customer.id, { 
    password: hashedPassword,
    resetToken: undefined,
    resetTokenExpiry: undefined
  });
  
  return { success: true };
}

// Update customer credits
export async function updateCustomerCredits(id: string, credits: number): Promise<boolean> {
  return await updateCustomer(id, { credits });
}