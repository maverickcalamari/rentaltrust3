import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { Property, InsertProperty, Unit, InsertUnit, Tenant, InsertTenant, Payment, InsertPayment, Notification } from "@shared/schema";
import { z } from "zod";
import { insertPaymentSchema, insertPropertySchema, insertTenantSchema, insertUnitSchema } from "@shared/schema";

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

// Middleware to check if user is a landlord
const isLandlord = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated() && req.user?.userType === "landlord") {
    return next();
  }
  return res.status(403).json({ message: "Forbidden: Landlord access required" });
};

// Middleware to check if user is a tenant
const isTenant = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated() && req.user?.userType === "tenant") {
    return next();
  }
  return res.status(403).json({ message: "Forbidden: Tenant access required" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // PROPERTY ROUTES
  // Get all properties for a landlord
  app.get("/api/properties", isLandlord, async (req, res) => {
    try {
      const properties = await storage.getPropertiesByLandlord(req.user!.id);
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  // Get a single property
  app.get("/api/properties/:id", isLandlord, async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const property = await storage.getProperty(propertyId);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      if (property.landlordId !== req.user!.id) {
        return res.status(403).json({ message: "You don't have access to this property" });
      }
      
      const units = await storage.getUnitsByProperty(propertyId);
      
      res.json({
        ...property,
        units
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch property" });
    }
  });

  // Create a new property
  app.post("/api/properties", isLandlord, async (req, res) => {
    try {
      const propertyData = insertPropertySchema.parse({
        ...req.body,
        landlordId: req.user!.id
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

  // Update a property
  app.put("/api/properties/:id", isLandlord, async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const property = await storage.getProperty(propertyId);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      if (property.landlordId !== req.user!.id) {
        return res.status(403).json({ message: "You don't have access to this property" });
      }
      
      const updatedProperty = await storage.updateProperty(propertyId, req.body);
      res.json(updatedProperty);
    } catch (error) {
      res.status(500).json({ message: "Failed to update property" });
    }
  });

  // Delete a property
  app.delete("/api/properties/:id", isLandlord, async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const property = await storage.getProperty(propertyId);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      if (property.landlordId !== req.user!.id) {
        return res.status(403).json({ message: "You don't have access to this property" });
      }
      
      await storage.deleteProperty(propertyId);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete property" });
    }
  });

  // UNIT ROUTES
  // Get all units for a property
  app.get("/api/properties/:propertyId/units", isLandlord, async (req, res) => {
    try {
      const propertyId = parseInt(req.params.propertyId);
      const property = await storage.getProperty(propertyId);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      if (property.landlordId !== req.user!.id) {
        return res.status(403).json({ message: "You don't have access to this property" });
      }
      
      const units = await storage.getUnitsByProperty(propertyId);
      res.json(units);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch units" });
    }
  });

  // Create a new unit
  app.post("/api/properties/:propertyId/units", isLandlord, async (req, res) => {
    try {
      const propertyId = parseInt(req.params.propertyId);
      const property = await storage.getProperty(propertyId);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      if (property.landlordId !== req.user!.id) {
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

  // Update a unit
  app.put("/api/units/:id", isLandlord, async (req, res) => {
    try {
      const unitId = parseInt(req.params.id);
      const unit = await storage.getUnit(unitId);
      
      if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
      }
      
      const property = await storage.getProperty(unit.propertyId);
      
      if (!property || property.landlordId !== req.user!.id) {
        return res.status(403).json({ message: "You don't have access to this unit" });
      }
      
      const updatedUnit = await storage.updateUnit(unitId, req.body);
      res.json(updatedUnit);
    } catch (error) {
      res.status(500).json({ message: "Failed to update unit" });
    }
  });

  // Delete a unit
  app.delete("/api/units/:id", isLandlord, async (req, res) => {
    try {
      const unitId = parseInt(req.params.id);
      const unit = await storage.getUnit(unitId);
      
      if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
      }
      
      const property = await storage.getProperty(unit.propertyId);
      
      if (!property || property.landlordId !== req.user!.id) {
        return res.status(403).json({ message: "You don't have access to this unit" });
      }
      
      await storage.deleteUnit(unitId);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete unit" });
    }
  });

  // TENANT ROUTES
  // Get all tenants for a landlord
  app.get("/api/tenants", isLandlord, async (req, res) => {
    try {
      const tenants = await storage.getTenantsByLandlord(req.user!.id);
      res.json(tenants);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tenants" });
    }
  });

  // Create a new tenant
  app.post("/api/tenants", isLandlord, async (req, res) => {
    try {
      const { userData, tenantData } = req.body;
      
      // First check if the unit belongs to this landlord
      const unit = await storage.getUnit(tenantData.unitId);
      if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
      }
      
      const property = await storage.getProperty(unit.propertyId);
      if (!property || property.landlordId !== req.user!.id) {
        return res.status(403).json({ message: "You don't have access to this unit" });
      }
      
      // Create the user account for the tenant
      const hashedPassword = await (await import("./auth")).hashPassword(userData.password);
      const user = await storage.createUser({
        ...userData,
        userType: "tenant",
        password: hashedPassword
      });
      
      // Create the tenant record
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

  // Get tenant details
  app.get("/api/tenants/:id", isLandlord, async (req, res) => {
    try {
      const tenantId = parseInt(req.params.id);
      const tenant = await storage.getTenant(tenantId);
      
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      
      // Check if landlord has access to this tenant
      const unit = await storage.getUnit(tenant.unitId);
      if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
      }
      
      const property = await storage.getProperty(unit.propertyId);
      if (!property || property.landlordId !== req.user!.id) {
        return res.status(403).json({ message: "You don't have access to this tenant" });
      }
      
      const user = await storage.getUser(tenant.userId);
      const payments = await storage.getPaymentsByTenant(tenantId);
      
      res.json({
        ...tenant,
        user,
        unit,
        property,
        payments
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tenant details" });
    }
  });

  // Update a tenant
  app.put("/api/tenants/:id", isLandlord, async (req, res) => {
    try {
      const tenantId = parseInt(req.params.id);
      const tenant = await storage.getTenant(tenantId);
      
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      
      // Check if landlord has access to this tenant
      const unit = await storage.getUnit(tenant.unitId);
      if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
      }
      
      const property = await storage.getProperty(unit.propertyId);
      if (!property || property.landlordId !== req.user!.id) {
        return res.status(403).json({ message: "You don't have access to this tenant" });
      }
      
      const updatedTenant = await storage.updateTenant(tenantId, req.body);
      res.json(updatedTenant);
    } catch (error) {
      res.status(500).json({ message: "Failed to update tenant" });
    }
  });

  // Delete a tenant
  app.delete("/api/tenants/:id", isLandlord, async (req, res) => {
    try {
      const tenantId = parseInt(req.params.id);
      const tenant = await storage.getTenant(tenantId);
      
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      
      // Check if landlord has access to this tenant
      const unit = await storage.getUnit(tenant.unitId);
      if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
      }
      
      const property = await storage.getProperty(unit.propertyId);
      if (!property || property.landlordId !== req.user!.id) {
        return res.status(403).json({ message: "You don't have access to this tenant" });
      }
      
      await storage.updateTenant(tenantId, { isActive: false });
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete tenant" });
    }
  });

  // PAYMENT ROUTES
  // Get all payments for a landlord
  app.get("/api/payments", isAuthenticated, async (req, res) => {
    try {
      let payments;
      
      if (req.user!.userType === "landlord") {
        payments = await storage.getPaymentsByLandlord(req.user!.id);
      } else {
        // For tenants, get their own payments
        const tenant = await storage.getTenantByUserId(req.user!.id);
        
        if (!tenant) {
          return res.status(404).json({ message: "Tenant profile not found" });
        }
        
        payments = await storage.getPaymentsByTenant(tenant.id);
      }
      
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  // Create a new payment
  app.post("/api/payments", isLandlord, async (req, res) => {
    try {
      const paymentData = insertPaymentSchema.parse(req.body);
      
      // Check if landlord has access to this tenant
      const tenant = await storage.getTenant(paymentData.tenantId);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      
      const unit = await storage.getUnit(tenant.unitId);
      if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
      }
      
      const property = await storage.getProperty(unit.propertyId);
      if (!property || property.landlordId !== req.user!.id) {
        return res.status(403).json({ message: "You don't have access to this tenant" });
      }
      
      const payment = await storage.createPayment(paymentData);
      
      // Create a notification for the tenant
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

  // Update a payment
  app.put("/api/payments/:id", isLandlord, async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      const payment = await storage.getPayment(paymentId);
      
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      // Check if landlord has access to this payment
      const tenant = await storage.getTenant(payment.tenantId);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      
      const unit = await storage.getUnit(tenant.unitId);
      if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
      }
      
      const property = await storage.getProperty(unit.propertyId);
      if (!property || property.landlordId !== req.user!.id) {
        return res.status(403).json({ message: "You don't have access to this payment" });
      }
      
      const updatedPayment = await storage.updatePayment(paymentId, req.body);
      
      // Create a notification for the tenant if status changed
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

  // Process a payment (for tenants)
  app.post("/api/payments/:id/process", isTenant, async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      const payment = await storage.getPayment(paymentId);
      
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      // Check if tenant has access to this payment
      const tenant = await storage.getTenantByUserId(req.user!.id);
      if (!tenant || tenant.id !== payment.tenantId) {
        return res.status(403).json({ message: "You don't have access to this payment" });
      }
      
      // Simulate payment processing
      const updatedPayment = await storage.updatePayment(paymentId, {
        status: "paid",
        paymentDate: new Date(),
        paymentMethod: req.body.paymentMethod || "Credit Card"
      });
      
      // Create notifications
      const unit = await storage.getUnit(tenant.unitId);
      const property = await storage.getProperty(unit!.propertyId);
      
      // Notify tenant
      await storage.createNotification({
        userId: tenant.userId,
        message: `Payment of $${payment.amount} processed successfully`,
        type: "payment",
        isRead: false
      });
      
      // Notify landlord
      await storage.createNotification({
        userId: property!.landlordId,
        message: `Payment of $${payment.amount} received from tenant`,
        type: "payment",
        isRead: false
      });
      
      res.json(updatedPayment);
    } catch (error) {
      res.status(500).json({ message: "Failed to process payment" });
    }
  });

  // NOTIFICATION ROUTES
  // Get notifications for the current user
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const notifications = await storage.getNotificationsByUser(req.user!.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Mark a notification as read
  app.put("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const notification = await storage.getNotification(notificationId);
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      if (notification.userId !== req.user!.id) {
        return res.status(403).json({ message: "You don't have access to this notification" });
      }
      
      const updatedNotification = await storage.markNotificationAsRead(notificationId);
      res.json(updatedNotification);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // DASHBOARD ROUTE
  app.get("/api/dashboard", isLandlord, async (req, res) => {
    try {
      const dashboardData = await storage.getDashboardData(req.user!.id);
      res.json(dashboardData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // TENANT PORTAL ROUTE
  app.get("/api/tenant-portal", isTenant, async (req, res) => {
    try {
      const tenant = await storage.getTenantByUserId(req.user!.id);
      
      if (!tenant) {
        return res.status(404).json({ message: "Tenant profile not found" });
      }
      
      const unit = await storage.getUnit(tenant.unitId);
      const property = await storage.getProperty(unit!.propertyId);
      const payments = await storage.getPaymentsByTenant(tenant.id);
      const notifications = await storage.getNotificationsByUser(req.user!.id);
      
      // Get the landlord
      const landlord = await storage.getUser(property!.landlordId);
      
      res.json({
        tenant,
        unit,
        property,
        payments,
        notifications,
        landlord: {
          id: landlord!.id,
          firstName: landlord!.firstName,
          lastName: landlord!.lastName,
          email: landlord!.email,
          phone: landlord!.phone
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tenant portal data" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
