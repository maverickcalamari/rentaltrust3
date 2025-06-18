import { 
  users, User, InsertUser, 
  properties, Property, InsertProperty,
  units, Unit, InsertUnit,
  tenants, Tenant, InsertTenant,
  payments, Payment, InsertPayment,
  notifications, Notification, InsertNotification
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Property operations
  getProperty(id: number): Promise<Property | undefined>;
  getPropertiesByLandlord(landlordId: number): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property | undefined>;
  deleteProperty(id: number): Promise<boolean>;
  
  // Unit operations
  getUnit(id: number): Promise<Unit | undefined>;
  getUnitsByProperty(propertyId: number): Promise<Unit[]>;
  createUnit(unit: InsertUnit): Promise<Unit>;
  updateUnit(id: number, unit: Partial<InsertUnit>): Promise<Unit | undefined>;
  deleteUnit(id: number): Promise<boolean>;
  
  // Tenant operations
  getTenant(id: number): Promise<Tenant | undefined>;
  getTenantsByLandlord(landlordId: number): Promise<Array<Tenant & { user: User, unit: Unit & { property: Property } }>>;
  getTenantByUserId(userId: number): Promise<Tenant | undefined>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  updateTenant(id: number, tenant: Partial<InsertTenant>): Promise<Tenant | undefined>;
  deleteTenant(id: number): Promise<boolean>;
  
  // Payment operations
  getPayment(id: number): Promise<Payment | undefined>;
  getPaymentsByTenant(tenantId: number): Promise<Payment[]>;
  getPaymentsByLandlord(landlordId: number): Promise<Array<Payment & { tenant: Tenant & { user: User, unit: Unit & { property: Property } } }>>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, payment: Partial<InsertPayment>): Promise<Payment | undefined>;
  deletePayment(id: number): Promise<boolean>;
  
  // Notification operations
  getNotification(id: number): Promise<Notification | undefined>;
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  updateNotification(id: number, notification: Partial<InsertNotification>): Promise<Notification | undefined>;
  deleteNotification(id: number): Promise<boolean>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  
  // Dashboard data
  getDashboardData(landlordId: number): Promise<{
    propertiesCount: number,
    tenantsCount: number,
    upcomingPaymentsTotal: number,
    overduePaymentsTotal: number,
    properties: Array<Property & { units: Unit[] }>,
    tenantActivity: Array<Payment & { tenant: Tenant & { user: User, unit: Unit & { property: Property } } }>,
    monthlyIncome: Array<{ month: string, amount: number }>
  }>;
  
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private userMap: Map<number, User>;
  private propertyMap: Map<number, Property>;
  private unitMap: Map<number, Unit>;
  private tenantMap: Map<number, Tenant>;
  private paymentMap: Map<number, Payment>;
  private notificationMap: Map<number, Notification>;
  currentId: { [key: string]: number };
  sessionStore: session.SessionStore;
  
  constructor() {
    this.userMap = new Map();
    this.propertyMap = new Map();
    this.unitMap = new Map();
    this.tenantMap = new Map();
    this.paymentMap = new Map();
    this.notificationMap = new Map();
    
    this.currentId = {
      user: 1,
      property: 1,
      unit: 1,
      tenant: 1,
      payment: 1,
      notification: 1
    };
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.userMap.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.userMap.values()).find(
      (user) => user.username === username,
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.user++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.userMap.set(id, user);
    return user;
  }
  
  // Property operations
  async getProperty(id: number): Promise<Property | undefined> {
    return this.propertyMap.get(id);
  }
  
  async getPropertiesByLandlord(landlordId: number): Promise<Property[]> {
    return Array.from(this.propertyMap.values()).filter(
      (property) => property.landlordId === landlordId
    );
  }
  
  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const id = this.currentId.property++;
    const now = new Date();
    const property: Property = { ...insertProperty, id, createdAt: now };
    this.propertyMap.set(id, property);
    return property;
  }
  
  async updateProperty(id: number, propertyData: Partial<InsertProperty>): Promise<Property | undefined> {
    const property = this.propertyMap.get(id);
    if (!property) return undefined;
    
    const updatedProperty = { ...property, ...propertyData };
    this.propertyMap.set(id, updatedProperty);
    return updatedProperty;
  }
  
  async deleteProperty(id: number): Promise<boolean> {
    return this.propertyMap.delete(id);
  }
  
  // Unit operations
  async getUnit(id: number): Promise<Unit | undefined> {
    return this.unitMap.get(id);
  }
  
  async getUnitsByProperty(propertyId: number): Promise<Unit[]> {
    return Array.from(this.unitMap.values()).filter(
      (unit) => unit.propertyId === propertyId
    );
  }
  
  async createUnit(insertUnit: InsertUnit): Promise<Unit> {
    const id = this.currentId.unit++;
    const now = new Date();
    const unit: Unit = { ...insertUnit, id, createdAt: now };
    this.unitMap.set(id, unit);
    return unit;
  }
  
  async updateUnit(id: number, unitData: Partial<InsertUnit>): Promise<Unit | undefined> {
    const unit = this.unitMap.get(id);
    if (!unit) return undefined;
    
    const updatedUnit = { ...unit, ...unitData };
    this.unitMap.set(id, updatedUnit);
    return updatedUnit;
  }
  
  async deleteUnit(id: number): Promise<boolean> {
    return this.unitMap.delete(id);
  }
  
  // Tenant operations
  async getTenant(id: number): Promise<Tenant | undefined> {
    return this.tenantMap.get(id);
  }
  
  async getTenantsByLandlord(landlordId: number): Promise<Array<Tenant & { user: User, unit: Unit & { property: Property } }>> {
    const properties = await this.getPropertiesByLandlord(landlordId);
    const propertyIds = properties.map(p => p.id);
    
    const units = Array.from(this.unitMap.values()).filter(
      unit => propertyIds.includes(unit.propertyId)
    );
    
    const unitIds = units.map(u => u.id);
    
    const tenants = Array.from(this.tenantMap.values()).filter(
      tenant => unitIds.includes(tenant.unitId)
    );
    
    return tenants.map(tenant => {
      const user = this.userMap.get(tenant.userId)!;
      const unit = this.unitMap.get(tenant.unitId)!;
      const property = this.propertyMap.get(unit.propertyId)!;
      
      return {
        ...tenant,
        user,
        unit: {
          ...unit,
          property
        }
      };
    });
  }
  
  async getTenantByUserId(userId: number): Promise<Tenant | undefined> {
    return Array.from(this.tenantMap.values()).find(
      tenant => tenant.userId === userId
    );
  }
  
  async createTenant(insertTenant: InsertTenant): Promise<Tenant> {
    const id = this.currentId.tenant++;
    const now = new Date();
    const tenant: Tenant = { ...insertTenant, id, createdAt: now };
    this.tenantMap.set(id, tenant);
    
    // Update the unit's occupancy status
    const unit = await this.getUnit(tenant.unitId);
    if (unit) {
      await this.updateUnit(unit.id, { isOccupied: true });
    }
    
    return tenant;
  }
  
  async updateTenant(id: number, tenantData: Partial<InsertTenant>): Promise<Tenant | undefined> {
    const tenant = this.tenantMap.get(id);
    if (!tenant) return undefined;
    
    // If the unit ID is changing, update the occupancy status of both units
    if (tenantData.unitId && tenantData.unitId !== tenant.unitId) {
      const oldUnit = await this.getUnit(tenant.unitId);
      const newUnit = await this.getUnit(tenantData.unitId);
      
      if (oldUnit) {
        // Check if any other tenant is still using this unit
        const otherTenants = Array.from(this.tenantMap.values()).filter(
          t => t.id !== id && t.unitId === oldUnit.id && t.isActive
        );
        
        if (otherTenants.length === 0) {
          await this.updateUnit(oldUnit.id, { isOccupied: false });
        }
      }
      
      if (newUnit) {
        await this.updateUnit(newUnit.id, { isOccupied: true });
      }
    }
    
    const updatedTenant = { ...tenant, ...tenantData };
    this.tenantMap.set(id, updatedTenant);
    return updatedTenant;
  }
  
  async deleteTenant(id: number): Promise<boolean> {
    const tenant = this.tenantMap.get(id);
    if (tenant) {
      // Update the unit's occupancy status if there are no other active tenants
      const unit = await this.getUnit(tenant.unitId);
      if (unit) {
        const otherTenants = Array.from(this.tenantMap.values()).filter(
          t => t.id !== id && t.unitId === unit.id && t.isActive
        );
        
        if (otherTenants.length === 0) {
          await this.updateUnit(unit.id, { isOccupied: false });
        }
      }
    }
    
    return this.tenantMap.delete(id);
  }
  
  // Payment operations
  async getPayment(id: number): Promise<Payment | undefined> {
    return this.paymentMap.get(id);
  }
  
  async getPaymentsByTenant(tenantId: number): Promise<Payment[]> {
    return Array.from(this.paymentMap.values()).filter(
      payment => payment.tenantId === tenantId
    );
  }
  
  async getPaymentsByLandlord(landlordId: number): Promise<Array<Payment & { tenant: Tenant & { user: User, unit: Unit & { property: Property } } }>> {
    const tenants = await this.getTenantsByLandlord(landlordId);
    const tenantIds = tenants.map(t => t.id);
    
    const payments = Array.from(this.paymentMap.values()).filter(
      payment => tenantIds.includes(payment.tenantId)
    );
    
    return payments.map(payment => {
      const tenant = tenants.find(t => t.id === payment.tenantId)!;
      
      return {
        ...payment,
        tenant
      };
    });
  }
  
  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = this.currentId.payment++;
    const now = new Date();
    const payment: Payment = { ...insertPayment, id, createdAt: now };
    this.paymentMap.set(id, payment);
    return payment;
  }
  
  async updatePayment(id: number, paymentData: Partial<InsertPayment>): Promise<Payment | undefined> {
    const payment = this.paymentMap.get(id);
    if (!payment) return undefined;
    
    const updatedPayment = { ...payment, ...paymentData };
    this.paymentMap.set(id, updatedPayment);
    return updatedPayment;
  }
  
  async deletePayment(id: number): Promise<boolean> {
    return this.paymentMap.delete(id);
  }
  
  // Notification operations
  async getNotification(id: number): Promise<Notification | undefined> {
    return this.notificationMap.get(id);
  }
  
  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return Array.from(this.notificationMap.values()).filter(
      notification => notification.userId === userId
    ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.currentId.notification++;
    const now = new Date();
    const notification: Notification = { ...insertNotification, id, createdAt: now };
    this.notificationMap.set(id, notification);
    return notification;
  }
  
  async updateNotification(id: number, notificationData: Partial<InsertNotification>): Promise<Notification | undefined> {
    const notification = this.notificationMap.get(id);
    if (!notification) return undefined;
    
    const updatedNotification = { ...notification, ...notificationData };
    this.notificationMap.set(id, updatedNotification);
    return updatedNotification;
  }
  
  async deleteNotification(id: number): Promise<boolean> {
    return this.notificationMap.delete(id);
  }
  
  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = this.notificationMap.get(id);
    if (!notification) return undefined;
    
    const updatedNotification = { ...notification, isRead: true };
    this.notificationMap.set(id, updatedNotification);
    return updatedNotification;
  }
  
  // Dashboard data
  async getDashboardData(landlordId: number): Promise<{
    propertiesCount: number,
    tenantsCount: number,
    upcomingPaymentsTotal: number,
    overduePaymentsTotal: number,
    properties: Array<Property & { units: Unit[] }>,
    tenantActivity: Array<Payment & { tenant: Tenant & { user: User, unit: Unit & { property: Property } } }>,
    monthlyIncome: Array<{ month: string, amount: number }>
  }> {
    const properties = await this.getPropertiesByLandlord(landlordId);
    const tenants = await this.getTenantsByLandlord(landlordId);
    const payments = await this.getPaymentsByLandlord(landlordId);
    
    const now = new Date();
    const upcomingPayments = payments.filter(p => 
      p.status === 'pending' && 
      new Date(p.dueDate) > now
    );
    
    const overduePayments = payments.filter(p => 
      p.status === 'overdue' || 
      (p.status === 'pending' && new Date(p.dueDate) < now)
    );
    
    const propertiesWithUnits = await Promise.all(properties.map(async property => {
      const units = await this.getUnitsByProperty(property.id);
      return {
        ...property,
        units
      };
    }));
    
    // Get the last 10 tenant activities (payments)
    const tenantActivity = payments
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
    
    // Calculate monthly income for the last 6 months
    const today = new Date();
    const monthlyIncome = [];
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = month.toLocaleString('default', { month: 'long' });
      const yearShort = month.getFullYear().toString().slice(2);
      
      const monthPayments = payments.filter(p => {
        if (!p.paymentDate) return false;
        const paymentDate = new Date(p.paymentDate);
        return paymentDate.getMonth() === month.getMonth() && 
               paymentDate.getFullYear() === month.getFullYear() &&
               p.status === 'paid';
      });
      
      const amount = monthPayments.reduce((sum, payment) => 
        sum + Number(payment.amount), 0);
      
      monthlyIncome.push({
        month: `${monthName} '${yearShort}`,
        amount
      });
    }
    
    return {
      propertiesCount: properties.length,
      tenantsCount: tenants.length,
      upcomingPaymentsTotal: upcomingPayments.reduce((sum, p) => sum + Number(p.amount), 0),
      overduePaymentsTotal: overduePayments.reduce((sum, p) => sum + Number(p.amount), 0),
      properties: propertiesWithUnits,
      tenantActivity,
      monthlyIncome
    };
  }
}

// Create storage instance
export const storage = new MemStorage();

// Add seed data for testing
(async () => {
  try {
    // Import the authentication utilities
    const { scrypt, randomBytes } = await import('crypto');
    const { promisify } = await import('util');
    
    // Implementation of hashPassword function
    const scryptAsync = promisify(scrypt);
    const hashPassword = async (password: string) => {
      const salt = randomBytes(16).toString("hex");
      const buf = (await scryptAsync(password, salt, 64)) as Buffer;
      return `${buf.toString("hex")}.${salt}`;
    };
    
    // Create a landlord user
    const landlordPassword = await hashPassword("password");
    const landlord = await storage.createUser({
      username: "landlord",
      password: landlordPassword,
      firstName: "John",
      lastName: "Smith",
      email: "landlord@example.com",
      phone: "555-123-4567",
      userType: "landlord"
    });

    // Create a tenant user
    const tenantPassword = await hashPassword("password");
    const tenant = await storage.createUser({
      username: "tenant",
      password: tenantPassword,
      firstName: "Jane",
      lastName: "Doe",
      email: "tenant@example.com",
      phone: "555-987-6543",
      userType: "tenant"
    });

    // Create a property
    const property = await storage.createProperty({
      name: "Maple Apartments",
      address: "123 Maple Street",
      city: "Springfield",
      state: "IL",
      zip: "62701",
      totalUnits: 4,
      landlordId: landlord.id,
      isActive: true
    });

    // Create units
    const unit1 = await storage.createUnit({
      unitNumber: "101",
      propertyId: property.id,
      bedrooms: 2,
      bathrooms: "1",
      sqft: 950,
      monthlyRent: "1200",
      isOccupied: true
    });

    const unit2 = await storage.createUnit({
      unitNumber: "102",
      propertyId: property.id,
      bedrooms: 1,
      bathrooms: "1",
      sqft: 750,
      monthlyRent: "950",
      isOccupied: false
    });

    // Create tenant record
    const tenantRecord = await storage.createTenant({
      userId: tenant.id,
      unitId: unit1.id,
      leaseStartDate: new Date(2023, 0, 1),
      leaseEndDate: new Date(2023, 11, 31),
      rentDueDay: 1,
      isActive: true
    });

    // Create payments
    const now = new Date();
    
    await storage.createPayment({
      tenantId: tenantRecord.id,
      amount: "1200",
      dueDate: new Date(now.getFullYear(), now.getMonth() - 2, 1),
      status: "paid",
      paymentDate: new Date(now.getFullYear(), now.getMonth() - 2, 3),
      paymentMethod: "Credit Card"
    });

    await storage.createPayment({
      tenantId: tenantRecord.id,
      amount: "1200",
      dueDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      status: "paid",
      paymentDate: new Date(now.getFullYear(), now.getMonth() - 1, 2),
      paymentMethod: "Credit Card"
    });

    await storage.createPayment({
      tenantId: tenantRecord.id,
      amount: "1200",
      dueDate: new Date(now.getFullYear(), now.getMonth(), 1),
      status: "pending",
      paymentDate: null,
      paymentMethod: null
    });

    // Create notifications
    await storage.createNotification({
      userId: tenant.id,
      message: "Your rent payment is due tomorrow",
      type: "payment",
      isRead: false
    });

    console.log("Seed data created successfully");
  } catch (error) {
    console.error("Error creating seed data:", error);
  }
})();
