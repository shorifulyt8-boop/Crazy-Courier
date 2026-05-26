import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { User, Shipment, SupportTicket, NotificationLog, ShipmentStatus, Rider, DeliveryBatch } from "./src/types.js";

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 11);
const generateTracking = () => "TRK-" + Math.floor(100000 + Math.random() * 900000);
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory Database
  let users: User[] = [
    {
      id: "u1",
      email: "admin@example.com",
      name: "Global Admin",
      role: "admin",
      phone: "+123456789",
      createdAt: "2026-01-10T10:00:00Z"
    },
    {
      id: "u2",
      email: "merchant@example.com",
      name: "Apex Electronics Corp",
      role: "merchant",
      phone: "+198765432",
      companyName: "Apex Electronics Corp",
      createdAt: "2026-02-15T11:30:00Z"
    },
    {
      id: "u3",
      email: "user@example.com",
      name: "Shoriful Islam",
      role: "customer",
      phone: "+1555123456",
      createdAt: "2026-05-20T08:00:00Z"
    },
    {
      id: "u4",
      email: "support@example.com",
      name: "Support Desk Agent",
      role: "support",
      phone: "+144499999",
      createdAt: "2026-05-25T12:00:00Z"
    },
    {
      id: "u_rider_1",
      email: "karim@swift.com",
      name: "Karim Uddin",
      role: "rider",
      phone: "+880175512591",
      createdAt: "2026-05-25T10:00:00Z"
    },
    {
      id: "u_rider_2",
      email: "rahim@swift.com",
      name: "Abdur Rahim",
      role: "rider",
      phone: "+880182255792",
      createdAt: "2026-05-25T11:15:00Z"
    },
    {
      id: "u_rider_3",
      email: "sumon@swift.com",
      name: "Sumon Driver",
      role: "rider",
      phone: "+880191144882",
      createdAt: "2026-05-25T12:30:00Z"
    }
  ];

  // Store password hashes/strings in simple dictionary
  let userPasswords: Record<string, string> = {
    "admin@example.com": "password",
    "merchant@example.com": "password",
    "user@example.com": "password",
    "support@example.com": "support123", // Default password, can be changed by admin
    "karim@swift.com": "password",
    "rahim@swift.com": "password",
    "sumon@swift.com": "password"
  };

  // Logged-in or seeded riders fleet coordinate telemetry
  let ridersList: Rider[] = [
    {
      id: "u_rider_1",
      name: "Karim Uddin",
      email: "karim@swift.com",
      phone: "+880175512591",
      vehicle: "Bike",
      currentHub: "Dhaka Central Hub",
      status: "Idle",
      lat: 23.8103,
      lng: 90.4125
    },
    {
      id: "u_rider_2",
      name: "Abdur Rahim",
      email: "rahim@swift.com",
      phone: "+880182255792",
      vehicle: "Bicycle",
      currentHub: "Chittagong Sorting Hub",
      status: "Idle",
      lat: 22.3569,
      lng: 91.7832
    },
    {
      id: "u_rider_3",
      name: "Sumon Driver",
      email: "sumon@swift.com",
      phone: "+880191144882",
      vehicle: "Covered Van",
      currentHub: "Dhaka Central Hub",
      status: "Idle",
      lat: 23.8223,
      lng: 90.4219
    }
  ];

  let deliveryBatches: DeliveryBatch[] = [
    {
      id: "b1",
      batchCode: "BAT-101",
      hub: "Dhaka Central Hub",
      riderId: "u_rider_1",
      shipmentIds: ["sh1"],
      status: "In Transit",
      createdAt: "2026-05-25T13:00:00Z"
    }
  ];

  let merchantPayoutHistory: any[] = [
    {
      id: "pay_1",
      merchantEmail: "merchant@example.com",
      amount: 450.00,
      paymentMethod: "bKash Transfer",
      accountNo: "01755112233",
      status: "Completed",
      createdAt: "2026-05-24T15:30:00Z"
    },
    {
      id: "pay_2",
      merchantEmail: "merchant@example.com",
      amount: 180.50,
      paymentMethod: "Nagad Transfer",
      accountNo: "01822334455",
      status: "Completed",
      createdAt: "2026-05-25T16:20:00Z"
    }
  ];

  let shipments: Shipment[] = [
    {
      id: "sh1",
      trackingNumber: "TRK-1001",
      senderName: "Apex Electronics Corp",
      senderEmail: "merchant@example.com",
      receiverName: "Shoriful Islam",
      receiverEmail: "user@example.com",
      receiverAddress: "123 Green Road, Sector 4, Dhaka, 1215",
      receiverPhone: "+1555123456",
      status: "In Transit",
      weight: 2.4,
      price: 25.0,
      paid: true,
      paymentMethod: "Credit Card",
      createdAt: "2026-05-24T09:00:00Z",
      estimatedDelivery: "2026-05-28T18:00:00Z",
      courierNotes: "Fragile handles with care.",
      deliveryHub: "Dhaka Central Hub",
      assignedRiderId: "u_rider_1",
      deliveryBatchId: "b1",
      otp: "4215",
      proofType: "Signature",
      updates: [
        {
          id: "up1_1",
          timestamp: "2026-05-24T09:30:00Z",
          status: "Pending",
          location: "Merchant Warehouse (Dhaka)",
          description: "Shipment registered & packaging completed by merchant."
        },
        {
          id: "up1_2",
          timestamp: "2026-05-25T11:00:00Z",
          status: "In Transit",
          location: "Central Sorting Hub",
          description: "Package received at the cargo hub. Dispatched towards local distribution center."
        }
      ]
    },
    {
      id: "sh2",
      trackingNumber: "TRK-1002",
      senderName: "Apex Electronics Corp",
      senderEmail: "merchant@example.com",
      receiverName: "Shoriful Islam",
      receiverEmail: "user@example.com",
      receiverAddress: "Apartment 4B, 78 Sunshine Avenue, Rajshahi",
      receiverPhone: "+1555123456",
      status: "Pending",
      weight: 1.2,
      price: 15.00,
      paid: false, // Unpaid shipping fee
      createdAt: "2026-05-26T08:15:00Z",
      estimatedDelivery: "2026-05-30T17:00:00Z",
      courierNotes: "Contact receiver before delivery",
      deliveryHub: "Dhaka Central Hub",
      otp: "3892",
      proofType: "OTP",
      updates: [
        {
          id: "up2_1",
          timestamp: "2026-05-26T08:15:00Z",
          status: "Pending",
          location: "Merchant Warehouse",
          description: "Shipment details uploaded. Customer shipping fee payment pending."
        }
      ]
    },
    {
      id: "sh3",
      trackingNumber: "TRK-1003",
      senderName: "Mega Hardware Store",
      senderEmail: "mega@hardware.com",
      receiverName: "Alice Johnson",
      receiverEmail: "alice@example.com",
      receiverAddress: "90 Main St, Block B, Chittagong",
      receiverPhone: "+1122334455",
      status: "Delivered",
      weight: 12.0,
      price: 95.0,
      paid: true,
      paymentMethod: "Bank Transfer",
      createdAt: "2026-05-22T10:00:00Z",
      estimatedDelivery: "2026-05-25T14:00:00Z",
      courierNotes: "Deliver to security guard room if unavailable.",
      deliveryHub: "Chittagong Sorting Hub",
      assignedRiderId: "u_rider_2",
      otp: "1092",
      proofType: "Signature",
      completedAt: "2026-05-25T14:30:00Z",
      proofSignature: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='30'><path d='M10,15 Q30,5 60,25 T90,10' stroke='black' stroke-width='2' fill='none'/></svg>",
      updates: [
        {
          id: "up3_1",
          timestamp: "2026-05-22T10:15:00Z",
          status: "Pending",
          location: "Chittagong Hub Office",
          description: "Package booked and paid."
        },
        {
          id: "up3_2",
          timestamp: "2026-05-23T14:00:00Z",
          status: "In Transit",
          location: "Chittagong Sorting Facility",
          description: "Processed through Sorting Hub."
        },
        {
          id: "up3_3",
          timestamp: "2026-05-24T10:00:00Z",
          status: "Out for Delivery",
          location: "Chittagong North Depot",
          description: "Out for delivery with courier agent (Abdur Rahim)."
        },
        {
          id: "up3_4",
          timestamp: "2026-05-25T14:30:00Z",
          status: "Delivered",
          location: "Chittagong Receiver Address",
          description: "Delivered successfully. Signed by Alice Johnson."
        }
      ]
    }
  ];

  let supportTickets: SupportTicket[] = [
    {
      id: "t1",
      userEmail: "user@example.com",
      userName: "Shoriful Islam",
      trackingNumber: "TRK-1001",
      subject: "In transit delay",
      message: "My courier TRK-1001 has been in transit since yesterday. Can you please check if it is on schedule?",
      status: "Open",
      createdAt: "2026-05-26T09:00:00Z"
    },
    {
      id: "t2",
      userEmail: "alice@example.com",
      userName: "Alice Johnson",
      trackingNumber: "TRK-1003",
      subject: "Delivered package quality check",
      message: "The box looks slightly dented, but the electronics inside are safe. Thank you for the quick delivery!",
      status: "Resolved",
      createdAt: "2026-05-25T16:00:00Z",
      replyMessage: "We apologize for the dented box. We will report this to our sorting team to ensure packages are treated extra gently. Glad to hear your items are safe!",
      repliedAt: "2026-05-25T17:15:00Z",
      repliedBy: "Support Desk Agent"
    }
  ];

  let emailNotificationLog: NotificationLog[] = [
    {
      id: "n1",
      email: "user@example.com",
      subject: "📦 Your package TRK-1001 has been dispatched!",
      content: "Hello Shoriful Islam,\n\nWe are pleased to inform you that package TRK-1001 is now IN TRANSIT.\n\nStatus: In Transit\nLast Location: Central Sorting Hub\nDescription: Package received at the cargo hub and dispatched.\nEstimated Delivery: 2026-05-28.\n\nYou can track your shipment anytime on our courier portal.\n\nBest regards,\nSwift Courier Logistics System",
      timestamp: "2026-05-25T11:00:00Z",
      trackingNumber: "TRK-1001",
      status: "In Transit"
    },
    {
      id: "n2",
      email: "user@example.com",
      subject: "💳 Shipment TRK-1002 generated - Payment Pending",
      content: "Hello Shoriful Islam,\n\nA new package with tracking number TRK-1002 has been registered. Before we dispatch this shipment, please log into your dashboard and complete the secure shipping payment of $15.00.\n\nBest regards,\nSwift Courier Team",
      timestamp: "2026-05-26T08:15:00Z",
      trackingNumber: "TRK-1002",
      status: "Pending"
    }
  ];

  // Helper function to simulate sending email
  const sendMockEmailNotification = (shipment: Shipment, status: ShipmentStatus, description: string, location: string) => {
    const subjectLine = `📦 Shipment ${shipment.trackingNumber} Update: ${status}`;
    const emailBody = `Hello ${shipment.receiverName},\n\nThe status of your shipment (${shipment.trackingNumber}) has been updated!\n\nNew Status: ${status}\nLocation: ${location}\nDescription: ${description}\n\nEstimated Delivery Date: ${new Date(shipment.estimatedDelivery).toLocaleDateString()}\n\nTrack your package in real-time here: ${process.env.APP_URL || 'https://swiftcourier.com'}/track/${shipment.trackingNumber}\n\nThank you for choosing Swift Courier Services.\n\nBest regards,\nSwift Courier Notifications System`;

    const log: NotificationLog = {
      id: "email_" + generateId(),
      email: shipment.receiverEmail,
      subject: subjectLine,
      content: emailBody,
      timestamp: new Date().toISOString(),
      trackingNumber: shipment.trackingNumber,
      status: status
    };

    emailNotificationLog.unshift(log);
    console.log(`[MOCK EMAIL SENT] to ${shipment.receiverEmail} Subject: "${subjectLine}"`);
    return log;
  };

  // --- API Routes ---

  // Auth: Login
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = users.find(u => u.email.toLowerCase() === trimmedEmail);
    const correctPassword = userPasswords[trimmedEmail];

    if (!user || correctPassword !== password) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    res.json({ user });
  });

  // Auth: Register
  app.post("/api/auth/register", (req, res) => {
    const { email, name, password, role, phone, companyName } = req.body;
    if (!email || !name || !password || !role) {
      return res.status(400).json({ error: "All field inputs are required (email, name, password, role)." });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const exists = users.some(u => u.email.toLowerCase() === trimmedEmail);
    if (exists) {
      return res.status(400).json({ error: "An account with this email already exists." });
    }

    const newUser: User = {
      id: "u_" + generateId(),
      email: trimmedEmail,
      name,
      role,
      phone,
      companyName: role === "merchant" ? (companyName || `${name} Ltd`) : undefined,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    userPasswords[trimmedEmail] = password;

    res.status(201).json({ user: newUser });
  });

  // Auth: Set Support Password (Admin Panel control)
  app.post("/api/auth/support-password", (req, res) => {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ error: "Password must be at least 4 characters long." });
    }

    // Set for support agent
    const supportAgentEmail = "support@example.com";
    userPasswords[supportAgentEmail] = newPassword;

    // Check if support agent exists, if not, create one
    let supportUser = users.find(u => u.email === supportAgentEmail);
    if (!supportUser) {
      supportUser = {
        id: "u4",
        email: supportAgentEmail,
        name: "Support Desk Agent",
        role: "support",
        phone: "+144499999",
        createdAt: new Date().toISOString()
      };
      users.push(supportUser);
    }

    res.json({ success: true, message: "Customer support password updated successfully.", supportUser });
  });

  // GET users list (so admin can view everyone)
  app.get("/api/admin/users", (req, res) => {
    // Return users with their password so admin can inspect or set support passwords
    const usersWithPasswords = users.map(u => ({
      ...u,
      password: userPasswords[u.email.toLowerCase()] || "N/A"
    }));
    res.json(usersWithPasswords);
  });

  // Shipments: Track Specific Publically
  app.get("/api/shipments/track/:trackingNumber", (req, res) => {
    const tracking = req.params.trackingNumber.toUpperCase().trim();
    const shipment = shipments.find(s => s.trackingNumber === tracking);
    if (!shipment) {
      return res.status(404).json({ error: `No shipment found with tracking number '${tracking}'` });
    }
    res.json(shipment);
  });

  // Shipments: List all
  app.get("/api/shipments", (req, res) => {
    const { email, role } = req.query;

    if (!role) {
      return res.json(shipments);
    }

    const filteredEmail = (email as string || "").trim().toLowerCase();

    if (role === "admin" || role === "support") {
      // Admins and Support can see all shipments
      return res.json(shipments);
    } else if (role === "merchant") {
      // Merchants see shipments where they are the sender
      const filtered = shipments.filter(s => s.senderEmail.toLowerCase() === filteredEmail);
      return res.json(filtered);
    } else {
      // Customers see shipments where they are sender OR receiver
      const filtered = shipments.filter(s => 
        s.senderEmail.toLowerCase() === filteredEmail || 
        s.receiverEmail.toLowerCase() === filteredEmail
      );
      return res.json(filtered);
    }
  });

  // Shipments: Create
  app.post("/api/shipments", (req, res) => {
    const { 
      senderName, 
      senderEmail, 
      receiverName, 
      receiverEmail, 
      receiverAddress, 
      receiverPhone, 
      weight, 
      courierNotes,
      paid,
      merchantRef,
      deliveryHub
    } = req.body;

    if (!senderName || !senderEmail || !receiverName || !receiverEmail || !receiverAddress || !receiverPhone) {
      return res.status(400).json({ error: "Missing required sender/receiver info or delivery coordinates." });
    }

    const weightNum = Number(weight) || 1.0;
    // Base shipping price calculation
    const basePrice = Math.max(10, weightNum * 7.5);

    const trackingNum = generateTracking();
    const dateNow = new Date();
    const estimatedDate = new Date();
    estimatedDate.setDate(dateNow.getDate() + 3); // 3 days delivery window

    const recordStatus: ShipmentStatus = paid ? "In Transit" : "Pending";

    const newShipment: Shipment = {
      id: "sh_" + generateId(),
      trackingNumber: trackingNum,
      senderName,
      senderEmail: senderEmail.toLowerCase(),
      receiverName,
      receiverEmail: receiverEmail.toLowerCase(),
      receiverAddress,
      receiverPhone,
      status: recordStatus,
      weight: weightNum,
      price: parseFloat(basePrice.toFixed(2)),
      paid: !!paid,
      paymentMethod: paid ? "Simulated Gateway" : undefined,
      createdAt: dateNow.toISOString(),
      estimatedDelivery: estimatedDate.toISOString(),
      courierNotes,
      merchantRef,
      deliveryHub: deliveryHub || undefined,
      updates: [
        {
          id: "up_" + generateId(),
          timestamp: dateNow.toISOString(),
          status: "Pending",
          location: deliveryHub ? `${deliveryHub} (Initiation)` : "Initiation Depot",
          description: paid 
            ? "Shipment registered & payment processed. Ready for logistics dispatch."
            : "Shipment registered. Awaiting shipping fee payment."
        }
      ]
    };

    if (paid) {
      newShipment.updates.push({
        id: "up_" + generateId(),
        timestamp: new Date().toISOString(),
        status: "In Transit",
        location: "Logistics Terminal",
        description: "Dispatched from warehouse to delivery dispatch hub."
      });
    }

    shipments.unshift(newShipment);

    // Notify Receiver via mock email
    sendMockEmailNotification(
      newShipment, 
      newShipment.status, 
      newShipment.updates[newShipment.updates.length - 1].description, 
      newShipment.updates[newShipment.updates.length - 1].location
    );

    res.status(201).json(newShipment);
  });

  // Shipments: Pay Fee Secure simulated Payment gateway
  app.post("/api/shipments/:id/pay", (req, res) => {
    const { id } = req.params;
    const { paymentMethod, cardHolder, cardNumber } = req.body;

    const shipment = shipments.find(s => s.id === id);
    if (!shipment) {
      return res.status(404).json({ error: "Shipment record not found." });
    }

    if (shipment.paid) {
      return res.status(400).json({ error: "This shipping fee is already fully paid." });
    }

    // Complete transaction
    shipment.paid = true;
    shipment.paymentMethod = paymentMethod || "Credit Card Simulator";
    shipment.status = "In Transit";

    const dateStr = new Date().toISOString();
    
    // Add updates
    shipment.updates.push(
      {
        id: "up_" + generateId(),
        timestamp: dateStr,
        status: "Pending",
        location: "Payment Verification Gateway",
        description: `Successfully processed fee payment of $${shipment.price} via ${shipment.paymentMethod}. Holder: ${cardHolder || 'Customer'}.`
      },
      {
        id: "up_" + generateId(),
        timestamp: dateStr,
        status: "In Transit",
        location: "Main Transit Sorting Hub",
        description: "Package sorting finished. Dispatched for interstate transport."
      }
    );

    // Send mock email
    sendMockEmailNotification(
      shipment, 
      "In Transit", 
      `Payment of $${shipment.price} verified! Package has been activated and sent for logistics transit.`,
      "Sorting Facility"
    );

    res.json({ success: true, shipment });
  });

  // Shipments: Update Status (Support, Admin, Merchant)
  app.post("/api/shipments/:id/status", (req, res) => {
    const { id } = req.params;
    const { status, location, description } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status field is required." });
    }

    const shipment = shipments.find(s => s.id === id);
    if (!shipment) {
      return res.status(404).json({ error: "Shipment record not found." });
    }

    shipment.status = status as ShipmentStatus;
    
    if (status === "Delivered") {
      shipment.completedAt = new Date().toISOString();
      shipment.paid = true; // COD cash collected transitions shipping state to paid
      shipment.codCollected = true;
      if (shipment.assignedRiderId) {
        const rider = ridersList.find(r => r.id === shipment.assignedRiderId);
        if (rider) {
          rider.status = "Idle";
        }
      }
    }

    const updateLoc = location || (status === "Delivered" ? "Hub Delivery Handover" : "Varying Transit Depot");
    const updateDesc = description || `Status updated to ${status}.`;

    const newUpdate = {
      id: "up_" + generateId(),
      timestamp: new Date().toISOString(),
      status: status as ShipmentStatus,
      location: updateLoc,
      description: updateDesc
    };

    shipment.updates.push(newUpdate);

    // Send mock email
    sendMockEmailNotification(shipment, status as ShipmentStatus, updateDesc, updateLoc);

    res.json(shipment);
  });

  // List Email Logs (Notifications)
  app.get("/api/notifications/logs", (req, res) => {
    const { email } = req.query;
    if (email) {
      const filtered = emailNotificationLog.filter(log => log.email.toLowerCase() === (email as string).trim().toLowerCase());
      return res.json(filtered);
    }
    res.json(emailNotificationLog);
  });

  // Support: List Tickets
  app.get("/api/support/tickets", (req, res) => {
    const { email } = req.query;
    if (email) {
      const filtered = supportTickets.filter(t => t.userEmail.toLowerCase() === (email as string).trim().toLowerCase());
      return res.json(filtered);
    }
    res.json(supportTickets);
  });

  // Support: Create Ticket
  app.post("/api/support/tickets", (req, res) => {
    const { userEmail, userName, trackingNumber, subject, message, userRole, companyName } = req.body;
    if (!userEmail || !userName || !subject || !message) {
      return res.status(400).json({ error: "User info, subject and message are required." });
    }

    const newTicket: SupportTicket = {
      id: "t_" + generateId(),
      userEmail: userEmail.toLowerCase(),
      userName,
      trackingNumber,
      subject,
      message,
      status: "Open",
      createdAt: new Date().toISOString(),
      userRole,
      companyName
    };

    supportTickets.unshift(newTicket);
    res.status(201).json(newTicket);
  });

  // Support: Reply Ticket
  app.post("/api/support/tickets/:id/reply", (req, res) => {
    const { id } = req.params;
    const { replyMessage, replierName } = req.body;

    if (!replyMessage) {
      return res.status(400).json({ error: "Reply message cannot be empty." });
    }

    const ticket = supportTickets.find(t => t.id === id);
    if (!ticket) {
      return res.status(404).json({ error: "Support ticket not found." });
    }

    ticket.status = "Resolved";
    ticket.replyMessage = replyMessage;
    ticket.repliedAt = new Date().toISOString();
    ticket.repliedBy = replierName || "Support Representative";

    // Simulate notification about resolved ticket
    const subjectLine = `📨 Ticket Resolved: ${ticket.subject}`;
    const emailBody = `Hello ${ticket.userName},\n\nYour support ticket regarding "${ticket.subject}" has been updated with a resolution by ${ticket.repliedBy}.\n\n--- Agent Resolution ---\n${replyMessage}\n\nThank you for reaching out to Swift Courier services.\n\nBest regards,\nCustomer Care Desk`;

    emailNotificationLog.unshift({
      id: "ticket_email_" + generateId(),
      email: ticket.userEmail,
      subject: subjectLine,
      content: emailBody,
      timestamp: new Date().toISOString(),
      trackingNumber: ticket.trackingNumber || "N/A",
      status: "Delivered"
    });

    res.json(ticket);
  });

  // --- Advanced Logistics & Multi-User Dispatch API Routes ---

  // 1. Get Riders
  app.get("/api/riders", (req, res) => {
    res.json(ridersList);
  });

  // Update Rider Telemetry Coordinates
  app.post("/api/riders/:id/telemetry", (req, res) => {
    const { id } = req.params;
    const { lat, lng, status } = req.body;
    const rider = ridersList.find(r => r.id === id);
    if (!rider) {
      return res.status(404).json({ error: "Rider not found." });
    }
    if (lat !== undefined) rider.lat = Number(lat);
    if (lng !== undefined) rider.lng = Number(lng);
    if (status !== undefined) rider.status = status;
    res.json({ success: true, rider });
  });

  // 2. Get Delivery Batches
  app.get("/api/batches", (req, res) => {
    res.json(deliveryBatches);
  });

  // Create Delivery Batch
  app.post("/api/batches", (req, res) => {
    const { hub, riderId, shipmentIds } = req.body;
    if (!hub || !shipmentIds || !Array.isArray(shipmentIds) || shipmentIds.length === 0) {
      return res.status(400).json({ error: "Hub and selection of parcels are required to create a batch." });
    }

    const batchCode = "BAT-" + Math.floor(100 + Math.random() * 900);
    const newBatch: DeliveryBatch = {
      id: "b_" + generateId(),
      batchCode,
      hub,
      riderId: riderId || null,
      shipmentIds,
      status: "Created",
      createdAt: new Date().toISOString()
    };

    deliveryBatches.unshift(newBatch);

    // Update associated shipments to lock batch ID & set rider if provided
    shipments.forEach(s => {
      if (shipmentIds.includes(s.id)) {
        s.deliveryBatchId = newBatch.id;
        if (riderId) {
          s.assignedRiderId = riderId;
          s.status = "Out for Delivery";
          const rider = ridersList.find(r => r.id === riderId);
          if (rider) {
            rider.status = "Delivering";
          }
          if (!s.otp) {
            s.otp = generateOTP();
          }
          s.updates.push({
            id: "up_" + generateId(),
            timestamp: new Date().toISOString(),
            status: "Out for Delivery",
            location: hub,
            description: `Parcel group scheduled in batch ${batchCode}. Dispatched to delivery rider ${rider?.name || 'Assigned Courier'}. Contact: ${rider?.phone || 'N/A'}`
          });
        }
      }
    });

    res.status(201).json(newBatch);
  });

  // Update Batch Status
  app.post("/api/batches/:id/status", (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'In Transit' | 'Out for Delivery' | 'Completed'

    const batch = deliveryBatches.find(b => b.id === id);
    if (!batch) {
      return res.status(404).json({ error: "Batch not found." });
    }

    batch.status = status;

    // Sync status of all shipments inside the batch
    shipments.forEach(s => {
      if (batch.shipmentIds.includes(s.id)) {
        if (status === "Out for Delivery") {
          s.status = "Out for Delivery";
          if (!s.otp) s.otp = generateOTP();
          s.updates.push({
            id: "up_" + generateId(),
            timestamp: new Date().toISOString(),
            status: "Out for Delivery",
            location: batch.hub,
            description: `Batch dispatch in transit progress update. Assigned rider is en route to receiver.`
          });
        } else if (status === "Completed") {
          s.status = "Delivered";
          s.completedAt = new Date().toISOString();
          s.paid = true; // payment assured on delivery / prepaid
          s.updates.push({
            id: "up_" + generateId(),
            timestamp: new Date().toISOString(),
            status: "Delivered",
            location: "Receiver Destination",
            description: "Delivered successfully via Bulk Batch route confirmation."
          });
        }
      }
    });

    // If batch is completed, update rider status to Idle
    if (status === "Completed" && batch.riderId) {
      const rider = ridersList.find(r => r.id === batch.riderId);
      if (rider) {
        rider.status = "Idle";
      }
    }

    res.json(batch);
  });

  // 3. SMART AUTOMATED DISPATCH (অটোমেটেড ডিসপ্যাচিং)
  app.post("/api/dispatch/auto", (req, res) => {
    let matchedCount = 0;
    const logs: string[] = [];
    logs.push(`[${new Date().toLocaleTimeString()}] Smart Dispatch Core engine started...`);
    logs.push(`Analyzing ${shipments.length} current warehousing items...`);

    // We search for paid shipments that are Pending or In Transit, and have no rider assigned
    const unassignedShipments = shipments.filter(s => 
      s.paid && 
      (s.status === "In Transit" || s.status === "Pending") && 
      !s.assignedRiderId
    );

    logs.push(`Identified ${unassignedShipments.length} candidate parcels awaiting hub injection.`);

    if (unassignedShipments.length === 0) {
      logs.push("No unassigned, active shipments found for dispatching.");
      return res.json({ success: true, matchedCount, logs });
    }

    unassignedShipments.forEach(s => {
      // Find a rider that is "Idle" and ideally belongs to the same hub as the shipment deliveryHub
      let candidateRider = ridersList.find(r => r.status === "Idle" && r.currentHub === (s.deliveryHub || "Dhaka Central Hub"));

      // Fallback: any Idle rider
      if (!candidateRider) {
        candidateRider = ridersList.find(r => r.status === "Idle");
      }

      if (candidateRider) {
        s.assignedRiderId = candidateRider.id;
        s.status = "Out for Delivery";
        s.otp = s.otp || generateOTP();
        candidateRider.status = "Delivering";

        s.updates.push({
          id: "up_" + generateId(),
          timestamp: new Date().toISOString(),
          status: "Out for Delivery",
          location: s.deliveryHub || candidateRider.currentHub,
          description: `[Auto-Dispatch Engine] Package automatically dispatched to closest optimal courier ${candidateRider.name} (Vehicle: ${candidateRider.vehicle}) based on hub workload optimization.`
        });

        matchedCount++;
        logs.push(`✓ MATCH SUCCESS: Parcel ${s.trackingNumber} (${s.receiverName}) assigned to '${candidateRider.name}' using weight/hub affinity routing.`);
      } else {
        logs.push(`✗ MATCH FAIL: Parcel ${s.trackingNumber} (${s.receiverName}) could not be matched. Reason: All delivery riders currently on critical workload saturation.`);
      }
    });

    logs.push(`Dispatch run finished. Handled ${matchedCount} parcels.`);
    res.json({ success: true, matchedCount, logs });
  });

  // 4. Bulk Shipment Importer via CSV
  app.post("/api/shipments/bulk", (req, res) => {
    const { senderEmail, senderName, parcelList } = req.body;
    if (!senderEmail || !parcelList || !Array.isArray(parcelList) || parcelList.length === 0) {
      return res.status(400).json({ error: "Missing sender details or bulk shipment elements." });
    }

    const importedShipments: Shipment[] = [];
    const dateNow = new Date();

    parcelList.forEach((item, index) => {
      const weightNum = Number(item.weight) || 1.5;
      const basePrice = Math.max(10, weightNum * 7.5);
      const trackingNum = "TRK-" + Math.floor(100000 + Math.random() * 900000);
      const estimatedDate = new Date();
      estimatedDate.setDate(dateNow.getDate() + 3);

      const newShipment: Shipment = {
        id: "sh_bulk_" + generateId() + "_" + index,
        trackingNumber: trackingNum,
        senderName: senderName || "Bulk Merchant",
        senderEmail: senderEmail.toLowerCase(),
        receiverName: item.receiverName || `Bulk Client ${index + 1}`,
        receiverEmail: (item.receiverEmail || `client${index}@example.com`).toLowerCase(),
        receiverAddress: item.receiverAddress || "Dhaka, Bangladesh",
        receiverPhone: item.receiverPhone || "+880 1700-000000",
        status: "Pending",
        weight: weightNum,
        price: parseFloat(basePrice.toFixed(2)),
        paid: false, // Merchant central billing handles payments later
        createdAt: dateNow.toISOString(),
        estimatedDelivery: estimatedDate.toISOString(),
        courierNotes: item.courierNotes || "Bulk uploaded parcel",
        deliveryHub: item.deliveryHub || "Dhaka Central Hub",
        otp: generateOTP(),
        updates: [
          {
            id: "up_" + generateId(),
            timestamp: dateNow.toISOString(),
            status: "Pending",
            location: item.deliveryHub || "Dhaka Central Hub",
            description: "Cargo batch registered successfully via Excel/CSV Bulk Data integration."
          }
        ]
      };

      shipments.unshift(newShipment);
      importedShipments.push(newShipment);

      // Simple notification
      sendMockEmailNotification(newShipment, "Pending", "Shipment bulk-registered in sorting queue.", newShipment.deliveryHub);
    });

    res.status(201).json({ success: true, count: importedShipments.length, importedShipments });
  });

  // 5. Digital Proof of Delivery (ePOD File Record)
  app.post("/api/shipments/:id/proof", (req, res) => {
    const { id } = req.params;
    const { proofType, proofSignature, proofPhoto, proofGps, verificationOtp, codAmount } = req.body;

    const shipment = shipments.find(s => s.id === id);
    if (!shipment) {
      return res.status(404).json({ error: "Shipment logistics ID not found." });
    }

    if (shipment.status === "Delivered") {
      return res.status(400).json({ error: "This parcel has already been completed and signed." });
    }

    // Verify OTP if OTP check is triggered
    if (proofType === "OTP" || proofType === "All" || (shipment.otp && verificationOtp)) {
      if (shipment.otp !== verificationOtp) {
        return res.status(400).json({ error: "Invalid Electronic Verification OTP code! Please verify with secure cell phone owner." });
      }
    }

    // Capture delivery coordinates & signatures
    shipment.status = "Delivered";
    shipment.completedAt = new Date().toISOString();
    shipment.paid = true; // Collected balance settles the invoice
    shipment.proofType = proofType || "Signature";
    shipment.proofSignature = proofSignature || null;
    shipment.proofPhoto = proofPhoto || null;
    shipment.proofGps = proofGps ? { lat: Number(proofGps.lat), lng: Number(proofGps.lng) } : { lat: 23.8103, lng: 90.4125 };
    shipment.codCollected = true;

    // Reset assigned Rider status
    if (shipment.assignedRiderId) {
      const rider = ridersList.find(r => r.id === shipment.assignedRiderId);
      if (rider) {
        rider.status = "Idle";
        if (proofGps) {
          rider.lat = Number(proofGps.lat);
          rider.lng = Number(proofGps.lng);
        }
      }
    }

    const desc = `Package delivered successfully. ePOD Authenticated via [${proofType || "Digital Signature"}] and COD collected. GPS Latitude: ${shipment.proofGps.lat}, Longitude: ${shipment.proofGps.lng}`;
    shipment.updates.push({
      id: "up_" + generateId(),
      timestamp: new Date().toISOString(),
      status: "Delivered",
      location: "Customer Residence",
      description: desc
    });

    sendMockEmailNotification(shipment, "Delivered", "Delivery verified using Electronic ePOD signature systems.", "Receiver Address");

    res.json({ success: true, shipment });
  });

  // 6. Get Merchant Billing Central accounts ledger
  app.get("/api/merchant/billing", (req, res) => {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: "Merchant email parameter is required." });
    }

    const mEmail = (email as string).trim().toLowerCase();
    const mShipments = shipments.filter(s => s.senderEmail.toLowerCase() === mEmail);

    // Sum details
    const totalDispatches = mShipments.length;
    
    // We assume every shipped item has a COD (Cash on Delivery) commodity value
    // Let's assume Commodity Value is $100 + $50 * weight for cash on delivery unless pre-paid
    const calcCODValue = (s: Shipment) => {
      if (s.courierNotes?.toLowerCase().includes("prepaid") || s.paymentMethod) {
        return 0; // Prepaid
      }
      return parseFloat((80 + s.weight * 35).toFixed(2));
    };

    const totalShippingFee = mShipments.reduce((sum, s) => sum + s.price, 0);
    const paidShippingFee = mShipments.filter(s => s.paid).reduce((sum, s) => sum + s.price, 0);
    const unpaidShippingFee = mShipments.filter(s => !s.paid).reduce((sum, s) => sum + s.price, 0);

    // Collected Cash On Delivery values
    const codEarned = mShipments
      .filter(s => s.status === "Delivered")
      .reduce((sum, s) => sum + calcCODValue(s), 0);

    const codPending = mShipments
      .filter(s => s.status !== "Delivered" && s.status !== "Cancelled")
      .reduce((sum, s) => sum + calcCODValue(s), 0);

    // Payout transactions
    const mPayouts = merchantPayoutHistory.filter(p => p.merchantEmail.toLowerCase() === mEmail);
    const totalPayoutsCollected = mPayouts
      .filter(p => p.status === "Completed")
      .reduce((sum, p) => sum + p.amount, 0);

    const availableBalance = Math.max(0, parseFloat((codEarned - totalPayoutsCollected).toFixed(2)));

    // Ledger records list representation
    const ledger = mShipments.map(s => {
      const cod = calcCODValue(s);
      return {
        id: s.id,
        trackingNumber: s.trackingNumber,
        receiverName: s.receiverName,
        status: s.status,
        shippingFee: s.price,
        codCollected: s.status === "Delivered" ? cod : 0,
        codPending: s.status !== "Delivered" ? cod : 0,
        createdAt: s.createdAt
      };
    });

    res.json({
      summary: {
        totalDispatches,
        totalShippingFee,
        paidShippingFee,
        unpaidShippingFee,
        codEarned: parseFloat(codEarned.toFixed(2)),
        codPending: parseFloat(codPending.toFixed(2)),
        totalPayoutsCollected: parseFloat(totalPayoutsCollected.toFixed(2)),
        availableBalance
      },
      ledger,
      payouts: mPayouts
    });
  });

  // Request Payout
  app.post("/api/merchant/payout", (req, res) => {
    const { email, amount, paymentMethod, accountNo } = req.body;
    if (!email || !amount || !paymentMethod || !accountNo) {
      return res.status(400).json({ error: "Missing email, payout amount, method, or account credentials." });
    }

    const mEmail = email.trim().toLowerCase();
    const amountNum = Number(amount);

    if (amountNum <= 0) {
      return res.status(400).json({ error: "Payout collection amount must be a positive number." });
    }

    // Validate available balance
    const mShipments = shipments.filter(s => s.senderEmail.toLowerCase() === mEmail);
    const calcCODValue = (s: Shipment) => {
      if (s.courierNotes?.toLowerCase().includes("prepaid") || s.paymentMethod) return 0;
      return parseFloat((80 + s.weight * 35).toFixed(2));
    };

    const codEarned = mShipments
      .filter(s => s.status === "Delivered")
      .reduce((sum, s) => sum + calcCODValue(s), 0);

    const mPayouts = merchantPayoutHistory.filter(p => p.merchantEmail.toLowerCase() === mEmail);
    const totalPayoutsCollected = mPayouts
      .filter(p => p.status === "Completed")
      .reduce((sum, p) => sum + p.amount, 0);

    const currentBalance = codEarned - totalPayoutsCollected;

    if (amountNum > currentBalance) {
      return res.status(400).json({ error: `Insufficient COD balance. Your maximum withdrawal limit is $${currentBalance.toFixed(2)}` });
    }

    const payoutRequest = {
      id: "pay_" + generateId(),
      merchantEmail: mEmail,
      amount: amountNum,
      paymentMethod,
      accountNo,
      status: "Completed", // instantly auto-settled in simulation!
      createdAt: new Date().toISOString()
    };

    merchantPayoutHistory.unshift(payoutRequest);

    res.status(201).json({ success: true, payoutRequest });
  });

  // --- End of API Routes ---

  // Vite development integration or static files serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
