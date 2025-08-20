var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/storage.ts
import bcrypt from "bcryptjs";
import session from "express-session";
import createMemoryStore from "memorystore";
var MemoryStore, MemStorage, storage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    MemoryStore = createMemoryStore(session);
    MemStorage = class {
      userMap;
      propertyMap;
      unitMap;
      tenantMap;
      paymentMap;
      notificationMap;
      currentId;
      sessionStore;
      constructor() {
        this.userMap = /* @__PURE__ */ new Map();
        this.propertyMap = /* @__PURE__ */ new Map();
        this.unitMap = /* @__PURE__ */ new Map();
        this.tenantMap = /* @__PURE__ */ new Map();
        this.paymentMap = /* @__PURE__ */ new Map();
        this.notificationMap = /* @__PURE__ */ new Map();
        this.currentId = {
          user: 1,
          property: 1,
          unit: 1,
          tenant: 1,
          payment: 1,
          notification: 1
        };
        this.sessionStore = new MemoryStore({
          checkPeriod: 864e5
          // prune expired entries every 24h
        });
      }
      // User operations
      async getUser(id) {
        return this.userMap.get(id);
      }
      async getUserByUsername(username) {
        return Array.from(this.userMap.values()).find(
          (user) => user.username === username
        );
      }
      async createUser(insertUser) {
        const id = this.currentId.user++;
        const now = /* @__PURE__ */ new Date();
        const user = { ...insertUser, id, createdAt: now };
        this.userMap.set(id, user);
        return user;
      }
      // Property operations
      async getProperty(id) {
        return this.propertyMap.get(id);
      }
      async getPropertiesByLandlord(landlordId) {
        return Array.from(this.propertyMap.values()).filter(
          (property) => property.landlordId === landlordId
        );
      }
      async createProperty(insertProperty) {
        const id = this.currentId.property++;
        const now = /* @__PURE__ */ new Date();
        const property = { ...insertProperty, id, createdAt: now };
        this.propertyMap.set(id, property);
        return property;
      }
      async updateProperty(id, propertyData) {
        const property = this.propertyMap.get(id);
        if (!property) return void 0;
        const updatedProperty = { ...property, ...propertyData };
        this.propertyMap.set(id, updatedProperty);
        return updatedProperty;
      }
      async deleteProperty(id) {
        return this.propertyMap.delete(id);
      }
      // Unit operations
      async getUnit(id) {
        return this.unitMap.get(id);
      }
      async getUnitsByProperty(propertyId) {
        return Array.from(this.unitMap.values()).filter(
          (unit) => unit.propertyId === propertyId
        );
      }
      async createUnit(insertUnit) {
        const id = this.currentId.unit++;
        const now = /* @__PURE__ */ new Date();
        const unit = { ...insertUnit, id, createdAt: now };
        this.unitMap.set(id, unit);
        return unit;
      }
      async updateUnit(id, unitData) {
        const unit = this.unitMap.get(id);
        if (!unit) return void 0;
        const updatedUnit = { ...unit, ...unitData };
        this.unitMap.set(id, updatedUnit);
        return updatedUnit;
      }
      async deleteUnit(id) {
        return this.unitMap.delete(id);
      }
      // Tenant operations
      async getTenant(id) {
        return this.tenantMap.get(id);
      }
      async getTenantsByLandlord(landlordId) {
        const properties2 = await this.getPropertiesByLandlord(landlordId);
        const propertyIds = properties2.map((p) => p.id);
        const units2 = Array.from(this.unitMap.values()).filter(
          (unit) => propertyIds.includes(unit.propertyId)
        );
        const unitIds = units2.map((u) => u.id);
        const tenants2 = Array.from(this.tenantMap.values()).filter(
          (tenant) => unitIds.includes(tenant.unitId)
        );
        return tenants2.map((tenant) => {
          const user = this.userMap.get(tenant.userId);
          const unit = this.unitMap.get(tenant.unitId);
          const property = this.propertyMap.get(unit.propertyId);
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
      async getTenantByUserId(userId) {
        return Array.from(this.tenantMap.values()).find(
          (tenant) => tenant.userId === userId
        );
      }
      async createTenant(insertTenant) {
        const id = this.currentId.tenant++;
        const now = /* @__PURE__ */ new Date();
        const tenant = { ...insertTenant, id, createdAt: now };
        this.tenantMap.set(id, tenant);
        const unit = await this.getUnit(tenant.unitId);
        if (unit) {
          await this.updateUnit(unit.id, { isOccupied: true });
        }
        return tenant;
      }
      async updateTenant(id, tenantData) {
        const tenant = this.tenantMap.get(id);
        if (!tenant) return void 0;
        if (tenantData.unitId && tenantData.unitId !== tenant.unitId) {
          const oldUnit = await this.getUnit(tenant.unitId);
          const newUnit = await this.getUnit(tenantData.unitId);
          if (oldUnit) {
            const otherTenants = Array.from(this.tenantMap.values()).filter(
              (t) => t.id !== id && t.unitId === oldUnit.id && t.isActive
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
      async deleteTenant(id) {
        const tenant = this.tenantMap.get(id);
        if (tenant) {
          const unit = await this.getUnit(tenant.unitId);
          if (unit) {
            const otherTenants = Array.from(this.tenantMap.values()).filter(
              (t) => t.id !== id && t.unitId === unit.id && t.isActive
            );
            if (otherTenants.length === 0) {
              await this.updateUnit(unit.id, { isOccupied: false });
            }
          }
        }
        return this.tenantMap.delete(id);
      }
      // Payment operations
      async getPayment(id) {
        return this.paymentMap.get(id);
      }
      async getPaymentsByTenant(tenantId) {
        return Array.from(this.paymentMap.values()).filter(
          (payment) => payment.tenantId === tenantId
        );
      }
      async getPaymentsByLandlord(landlordId) {
        const tenants2 = await this.getTenantsByLandlord(landlordId);
        const tenantIds = tenants2.map((t) => t.id);
        const payments2 = Array.from(this.paymentMap.values()).filter(
          (payment) => tenantIds.includes(payment.tenantId)
        );
        return payments2.map((payment) => {
          const tenant = tenants2.find((t) => t.id === payment.tenantId);
          return {
            ...payment,
            tenant
          };
        });
      }
      async createPayment(insertPayment) {
        const id = this.currentId.payment++;
        const now = /* @__PURE__ */ new Date();
        const payment = { ...insertPayment, id, createdAt: now };
        this.paymentMap.set(id, payment);
        return payment;
      }
      async updatePayment(id, paymentData) {
        const payment = this.paymentMap.get(id);
        if (!payment) return void 0;
        const updatedPayment = { ...payment, ...paymentData };
        this.paymentMap.set(id, updatedPayment);
        return updatedPayment;
      }
      async deletePayment(id) {
        return this.paymentMap.delete(id);
      }
      // Notification operations
      async getNotification(id) {
        return this.notificationMap.get(id);
      }
      async getNotificationsByUser(userId) {
        return Array.from(this.notificationMap.values()).filter(
          (notification) => notification.userId === userId
        ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }
      async createNotification(insertNotification) {
        const id = this.currentId.notification++;
        const now = /* @__PURE__ */ new Date();
        const notification = { ...insertNotification, id, createdAt: now };
        this.notificationMap.set(id, notification);
        return notification;
      }
      async updateNotification(id, notificationData) {
        const notification = this.notificationMap.get(id);
        if (!notification) return void 0;
        const updatedNotification = { ...notification, ...notificationData };
        this.notificationMap.set(id, updatedNotification);
        return updatedNotification;
      }
      async deleteNotification(id) {
        return this.notificationMap.delete(id);
      }
      async markNotificationAsRead(id) {
        const notification = this.notificationMap.get(id);
        if (!notification) return void 0;
        const updatedNotification = { ...notification, isRead: true };
        this.notificationMap.set(id, updatedNotification);
        return updatedNotification;
      }
      // Dashboard data
      async getDashboardData(landlordId) {
        const properties2 = await this.getPropertiesByLandlord(landlordId);
        const tenants2 = await this.getTenantsByLandlord(landlordId);
        const payments2 = await this.getPaymentsByLandlord(landlordId);
        const now = /* @__PURE__ */ new Date();
        const upcomingPayments = payments2.filter(
          (p) => p.status === "pending" && new Date(p.dueDate) > now
        );
        const overduePayments = payments2.filter(
          (p) => p.status === "overdue" || p.status === "pending" && new Date(p.dueDate) < now
        );
        const propertiesWithUnits = await Promise.all(properties2.map(async (property) => {
          const units2 = await this.getUnitsByProperty(property.id);
          return {
            ...property,
            units: units2
          };
        }));
        const tenantActivity = payments2.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);
        const today = /* @__PURE__ */ new Date();
        const monthlyIncome = [];
        for (let i = 5; i >= 0; i--) {
          const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
          const monthName = month.toLocaleString("default", { month: "long" });
          const yearShort = month.getFullYear().toString().slice(2);
          const monthPayments = payments2.filter((p) => {
            if (!p.paymentDate) return false;
            const paymentDate = new Date(p.paymentDate);
            return paymentDate.getMonth() === month.getMonth() && paymentDate.getFullYear() === month.getFullYear() && p.status === "paid";
          });
          const amount = monthPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
          monthlyIncome.push({
            month: `${monthName} '${yearShort}`,
            amount
          });
        }
        return {
          propertiesCount: properties2.length,
          tenantsCount: tenants2.length,
          upcomingPaymentsTotal: upcomingPayments.reduce((sum, p) => sum + Number(p.amount), 0),
          overduePaymentsTotal: overduePayments.reduce((sum, p) => sum + Number(p.amount), 0),
          properties: propertiesWithUnits,
          tenantActivity,
          monthlyIncome
        };
      }
    };
    storage = new MemStorage();
    (async () => {
      try {
        const hashPassword2 = async (password) => {
          const salt = await bcrypt.genSalt(10);
          return bcrypt.hash(password, salt);
        };
        const landlordPassword = await hashPassword2("password");
        const landlord = await storage.createUser({
          username: "landlord",
          password: landlordPassword,
          firstName: "John",
          lastName: "Smith",
          email: "landlord@example.com",
          phone: "555-123-4567",
          userType: "landlord"
        });
        const tenantPassword = await hashPassword2("password");
        const tenant = await storage.createUser({
          username: "tenant",
          password: tenantPassword,
          firstName: "Jane",
          lastName: "Doe",
          email: "tenant@example.com",
          phone: "555-987-6543",
          userType: "tenant"
        });
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
        const unit1 = await storage.createUnit({
          unitNumber: "101",
          propertyId: property.id,
          bedrooms: 2,
          bathrooms: 1,
          // number
          sqft: 950,
          monthlyRent: 1200,
          // number
          isOccupied: true
        });
        const unit2 = await storage.createUnit({
          unitNumber: "102",
          propertyId: property.id,
          bedrooms: 1,
          bathrooms: 1,
          // number
          sqft: 750,
          monthlyRent: 950,
          // number
          isOccupied: false
        });
        const tenantRecord = await storage.createTenant({
          userId: tenant.id,
          unitId: unit1.id,
          leaseStartDate: new Date(2023, 0, 1),
          leaseEndDate: new Date(2023, 11, 31),
          rentDueDay: 1,
          isActive: true
        });
        const now = /* @__PURE__ */ new Date();
        await storage.createPayment({
          tenantId: tenantRecord.id,
          amount: 1200,
          dueDate: new Date(now.getFullYear(), now.getMonth() - 2, 1),
          status: "paid",
          paymentDate: new Date(now.getFullYear(), now.getMonth() - 2, 3),
          paymentMethod: "Credit Card"
        });
        await storage.createPayment({
          tenantId: tenantRecord.id,
          amount: 1200,
          dueDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          status: "paid",
          paymentDate: new Date(now.getFullYear(), now.getMonth() - 1, 2),
          paymentMethod: "Credit Card"
        });
        await storage.createPayment({
          tenantId: tenantRecord.id,
          amount: 1200,
          dueDate: new Date(now.getFullYear(), now.getMonth(), 1),
          status: "pending",
          paymentDate: null,
          paymentMethod: null
        });
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
  }
});

// server/auth.ts
var auth_exports = {};
__export(auth_exports, {
  setupAuth: () => setupAuth
});
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session2 from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
function setupAuth(app2) {
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || "rentez-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1e3
      // 1 week
    }
  };
  app2.set("trust proxy", 1);
  app2.use(session2(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !await comparePasswords(password, user.password)) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    })
  );
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });
  app2.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password)
      });
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
var scryptAsync;
var init_auth = __esm({
  "server/auth.ts"() {
    "use strict";
    init_storage();
    scryptAsync = promisify(scrypt);
  }
});

// server/index.ts
import express2 from "express";

// server/routes.ts
init_auth();
init_storage();
import { createServer } from "http";
import { z } from "zod";

// shared/schema.ts
import { pgTable, text, serial, integer, boolean, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  userType: text("user_type").notNull(),
  // "landlord" or "tenant"
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  landlordId: integer("landlord_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zip: text("zip").notNull(),
  totalUnits: integer("total_units").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var units = pgTable("units", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id),
  unitNumber: text("unit_number").notNull(),
  monthlyRent: numeric("monthly_rent").notNull(),
  bedrooms: integer("bedrooms").notNull(),
  bathrooms: numeric("bathrooms").notNull(),
  sqft: integer("sqft"),
  description: text("description"),
  isOccupied: boolean("is_occupied").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  unitId: integer("unit_id").notNull().references(() => units.id),
  leaseStartDate: timestamp("lease_start_date").notNull(),
  leaseEndDate: timestamp("lease_end_date").notNull(),
  rentDueDay: integer("rent_due_day").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  amount: numeric("amount").notNull(),
  dueDate: timestamp("due_date").notNull(),
  paymentDate: timestamp("payment_date"),
  status: text("status").notNull(),
  // "paid", "pending", "overdue"
  paymentMethod: text("payment_method"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  type: text("type").notNull(),
  // "payment", "lease", "maintenance", etc.
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});
var insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true
});
var insertUnitSchema = createInsertSchema(units).omit({
  id: true,
  createdAt: true
});
var insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true
});
var insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true
});
var insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true
});

// server/routes.ts
var isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};
var isLandlord = (req, res, next) => {
  if (req.isAuthenticated() && req.user?.userType === "landlord") {
    return next();
  }
  return res.status(403).json({ message: "Forbidden: Landlord access required" });
};
var isTenant = (req, res, next) => {
  if (req.isAuthenticated() && req.user?.userType === "tenant") {
    return next();
  }
  return res.status(403).json({ message: "Forbidden: Tenant access required" });
};
async function registerRoutes(app2) {
  setupAuth(app2);
  app2.get("/api/properties", isLandlord, async (req, res) => {
    try {
      const properties2 = await storage.getPropertiesByLandlord(req.user.id);
      res.json(properties2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });
  app2.get("/api/properties/:id", isLandlord, async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      if (property.landlordId !== req.user.id) {
        return res.status(403).json({ message: "You don't have access to this property" });
      }
      const units2 = await storage.getUnitsByProperty(propertyId);
      res.json({
        ...property,
        units: units2
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch property" });
    }
  });
  app2.post("/api/properties", isLandlord, async (req, res) => {
    try {
      const propertyData = insertPropertySchema.parse({
        ...req.body,
        landlordId: req.user.id
      });
      const property = await storage.createProperty(propertyData);
      res.status(201).json(property);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid property data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create property" });
    }
  });
  app2.put("/api/properties/:id", isLandlord, async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      if (property.landlordId !== req.user.id) {
        return res.status(403).json({ message: "You don't have access to this property" });
      }
      const updatedProperty = await storage.updateProperty(propertyId, req.body);
      res.json(updatedProperty);
    } catch (error) {
      res.status(500).json({ message: "Failed to update property" });
    }
  });
  app2.delete("/api/properties/:id", isLandlord, async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      if (property.landlordId !== req.user.id) {
        return res.status(403).json({ message: "You don't have access to this property" });
      }
      await storage.deleteProperty(propertyId);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete property" });
    }
  });
  app2.get("/api/properties/:propertyId/units", isLandlord, async (req, res) => {
    try {
      const propertyId = parseInt(req.params.propertyId);
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      if (property.landlordId !== req.user.id) {
        return res.status(403).json({ message: "You don't have access to this property" });
      }
      const units2 = await storage.getUnitsByProperty(propertyId);
      res.json(units2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch units" });
    }
  });
  app2.post("/api/properties/:propertyId/units", isLandlord, async (req, res) => {
    try {
      const propertyId = parseInt(req.params.propertyId);
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      if (property.landlordId !== req.user.id) {
        return res.status(403).json({ message: "You don't have access to this property" });
      }
      const unitData = insertUnitSchema.parse({
        ...req.body,
        propertyId
      });
      const unit = await storage.createUnit(unitData);
      res.status(201).json(unit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid unit data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create unit" });
    }
  });
  app2.put("/api/units/:id", isLandlord, async (req, res) => {
    try {
      const unitId = parseInt(req.params.id);
      const unit = await storage.getUnit(unitId);
      if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
      }
      const property = await storage.getProperty(unit.propertyId);
      if (!property || property.landlordId !== req.user.id) {
        return res.status(403).json({ message: "You don't have access to this unit" });
      }
      const updatedUnit = await storage.updateUnit(unitId, req.body);
      res.json(updatedUnit);
    } catch (error) {
      res.status(500).json({ message: "Failed to update unit" });
    }
  });
  app2.delete("/api/units/:id", isLandlord, async (req, res) => {
    try {
      const unitId = parseInt(req.params.id);
      const unit = await storage.getUnit(unitId);
      if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
      }
      const property = await storage.getProperty(unit.propertyId);
      if (!property || property.landlordId !== req.user.id) {
        return res.status(403).json({ message: "You don't have access to this unit" });
      }
      await storage.deleteUnit(unitId);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete unit" });
    }
  });
  app2.get("/api/tenants", isLandlord, async (req, res) => {
    try {
      const tenants2 = await storage.getTenantsByLandlord(req.user.id);
      res.json(tenants2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tenants" });
    }
  });
  app2.post("/api/tenants", isLandlord, async (req, res) => {
    try {
      const { userData, tenantData } = req.body;
      const unit = await storage.getUnit(tenantData.unitId);
      if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
      }
      const property = await storage.getProperty(unit.propertyId);
      if (!property || property.landlordId !== req.user.id) {
        return res.status(403).json({ message: "You don't have access to this unit" });
      }
      const hashedPassword = await (await Promise.resolve().then(() => (init_auth(), auth_exports))).hashPassword(userData.password);
      const user = await storage.createUser({
        ...userData,
        userType: "tenant",
        password: hashedPassword
      });
      const tenant = await storage.createTenant({
        ...tenantData,
        userId: user.id
      });
      res.status(201).json({
        tenant,
        user
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to create tenant" });
    }
  });
  app2.get("/api/tenants/:id", isLandlord, async (req, res) => {
    try {
      const tenantId = parseInt(req.params.id);
      const tenant = await storage.getTenant(tenantId);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      const unit = await storage.getUnit(tenant.unitId);
      if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
      }
      const property = await storage.getProperty(unit.propertyId);
      if (!property || property.landlordId !== req.user.id) {
        return res.status(403).json({ message: "You don't have access to this tenant" });
      }
      const user = await storage.getUser(tenant.userId);
      const payments2 = await storage.getPaymentsByTenant(tenantId);
      res.json({
        ...tenant,
        user,
        unit,
        property,
        payments: payments2
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tenant details" });
    }
  });
  app2.put("/api/tenants/:id", isLandlord, async (req, res) => {
    try {
      const tenantId = parseInt(req.params.id);
      const tenant = await storage.getTenant(tenantId);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      const unit = await storage.getUnit(tenant.unitId);
      if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
      }
      const property = await storage.getProperty(unit.propertyId);
      if (!property || property.landlordId !== req.user.id) {
        return res.status(403).json({ message: "You don't have access to this tenant" });
      }
      const updatedTenant = await storage.updateTenant(tenantId, req.body);
      res.json(updatedTenant);
    } catch (error) {
      res.status(500).json({ message: "Failed to update tenant" });
    }
  });
  app2.delete("/api/tenants/:id", isLandlord, async (req, res) => {
    try {
      const tenantId = parseInt(req.params.id);
      const tenant = await storage.getTenant(tenantId);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      const unit = await storage.getUnit(tenant.unitId);
      if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
      }
      const property = await storage.getProperty(unit.propertyId);
      if (!property || property.landlordId !== req.user.id) {
        return res.status(403).json({ message: "You don't have access to this tenant" });
      }
      await storage.updateTenant(tenantId, { isActive: false });
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete tenant" });
    }
  });
  app2.get("/api/payments", isAuthenticated, async (req, res) => {
    try {
      let payments2;
      if (req.user.userType === "landlord") {
        payments2 = await storage.getPaymentsByLandlord(req.user.id);
      } else {
        const tenant = await storage.getTenantByUserId(req.user.id);
        if (!tenant) {
          return res.status(404).json({ message: "Tenant profile not found" });
        }
        payments2 = await storage.getPaymentsByTenant(tenant.id);
      }
      res.json(payments2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });
  app2.post("/api/payments", isLandlord, async (req, res) => {
    try {
      const paymentData = insertPaymentSchema.parse(req.body);
      const tenant = await storage.getTenant(paymentData.tenantId);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      const unit = await storage.getUnit(tenant.unitId);
      if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
      }
      const property = await storage.getProperty(unit.propertyId);
      if (!property || property.landlordId !== req.user.id) {
        return res.status(403).json({ message: "You don't have access to this tenant" });
      }
      const payment = await storage.createPayment(paymentData);
      await storage.createNotification({
        userId: tenant.userId,
        message: `New payment of $${payment.amount} due on ${new Date(payment.dueDate).toLocaleDateString()}`,
        type: "payment",
        isRead: false
      });
      res.status(201).json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid payment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create payment" });
    }
  });
  app2.put("/api/payments/:id", isLandlord, async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      const payment = await storage.getPayment(paymentId);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      const tenant = await storage.getTenant(payment.tenantId);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      const unit = await storage.getUnit(tenant.unitId);
      if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
      }
      const property = await storage.getProperty(unit.propertyId);
      if (!property || property.landlordId !== req.user.id) {
        return res.status(403).json({ message: "You don't have access to this payment" });
      }
      const updatedPayment = await storage.updatePayment(paymentId, req.body);
      if (req.body.status && req.body.status !== payment.status) {
        await storage.createNotification({
          userId: tenant.userId,
          message: `Payment status updated to ${req.body.status} for $${payment.amount}`,
          type: "payment",
          isRead: false
        });
      }
      res.json(updatedPayment);
    } catch (error) {
      res.status(500).json({ message: "Failed to update payment" });
    }
  });
  app2.post("/api/payments/:id/process", isTenant, async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      const payment = await storage.getPayment(paymentId);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      const tenant = await storage.getTenantByUserId(req.user.id);
      if (!tenant || tenant.id !== payment.tenantId) {
        return res.status(403).json({ message: "You don't have access to this payment" });
      }
      const updatedPayment = await storage.updatePayment(paymentId, {
        status: "paid",
        paymentDate: /* @__PURE__ */ new Date(),
        paymentMethod: req.body.paymentMethod || "Credit Card"
      });
      const unit = await storage.getUnit(tenant.unitId);
      const property = await storage.getProperty(unit.propertyId);
      await storage.createNotification({
        userId: tenant.userId,
        message: `Payment of $${payment.amount} processed successfully`,
        type: "payment",
        isRead: false
      });
      await storage.createNotification({
        userId: property.landlordId,
        message: `Payment of $${payment.amount} received from tenant`,
        type: "payment",
        isRead: false
      });
      res.json(updatedPayment);
    } catch (error) {
      res.status(500).json({ message: "Failed to process payment" });
    }
  });
  app2.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const notifications2 = await storage.getNotificationsByUser(req.user.id);
      res.json(notifications2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });
  app2.put("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const notification = await storage.getNotification(notificationId);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      if (notification.userId !== req.user.id) {
        return res.status(403).json({ message: "You don't have access to this notification" });
      }
      const updatedNotification = await storage.markNotificationAsRead(notificationId);
      res.json(updatedNotification);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });
  app2.get("/api/dashboard", isLandlord, async (req, res) => {
    try {
      const dashboardData = await storage.getDashboardData(req.user.id);
      res.json(dashboardData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });
  app2.get("/api/tenant-portal", isTenant, async (req, res) => {
    try {
      const tenant = await storage.getTenantByUserId(req.user.id);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant profile not found" });
      }
      const unit = await storage.getUnit(tenant.unitId);
      const property = await storage.getProperty(unit.propertyId);
      const payments2 = await storage.getPaymentsByTenant(tenant.id);
      const notifications2 = await storage.getNotificationsByUser(req.user.id);
      const landlord = await storage.getUser(property.landlordId);
      res.json({
        tenant,
        unit,
        property,
        payments: payments2,
        notifications: notifications2,
        landlord: {
          id: landlord.id,
          firstName: landlord.firstName,
          lastName: landlord.lastName,
          email: landlord.email,
          phone: landlord.phone
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tenant portal data" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [await import("@replit/vite-plugin-cartographer").then((m) => m.cartographer())] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  // 👇 Add this so Vite reads .env from the repo root instead of client/
  envDir: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
