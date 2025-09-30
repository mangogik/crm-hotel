# CRM Hotel Documentation

## Overview

CRM Hotel is a modern Customer Relationship Management system designed to help hotel operators manage guest interactions, bookings, rooms, services, and orders efficiently. The system streamlines hotel operations and enhances guest satisfaction through an integrated dashboard and automation features.

**Tech Stack:**  
- JavaScript (Frontend: React + Inertia.js)
- PHP (Backend: Laravel)
- n8n (Automation integrations)

---

## Features

### 1. User Authentication
- **Login/Register:** Secure authentication flow for hotel staff and manager.
- **Role-Based Access:** Different roles (Manager, Front Office) provide access to appropriate dashboard features.

### 2. Dashboard
- **Main Navigation:** Sidebar with links to core modules ( Dashboard, Customers, Bookings, Rooms, Services, Orders, AI Analytics).
- **Personalized Role Display:** Sidebar adapts based on user role.

### 3. Customer Management
- **Customer List:** View all hotel guests/customers with expandable rows for details.
- **Search, Filter, and Sort:** Search by name, email, and phone, or filter by Country, Membership, and Last Visit Date.
- **CRUD Operations:** Add, edit, delete customer profiles.

### 3. Bookings Management
- **Booking List:** View all bookings with expandable rows for details.
- **Search, Filter, and Sort:** Search by customer name, and room, or filter by booking status, and date range.
- **CRUD Operations:** Create, edit, delete bookings.

### 4. Room Management
- **Room List:** View all rooms with expandable rows for details.
- **Search, Filter, and Sort:** Search by room number or filter by room type and status.
- **CRUD Operations:** Add, edit, delete rooms.

### 6. Service Management
- **Service List:** View all services with expandable rows for details.
- **Search, Filter, and Sort:** Search by service name or filter by service type and fulfillment type.
- **CRUD Operations:** Add, edit, delete services.
- **Service Options:** Configure options/variants for each service.

### 7. Order Management
- **Order List:** View all orders with expandable rows for details.
- **Order Creation:** Create new orders by selecting customer and services. Support for multiple services per order.
- **Order Editing:** Update existing orders, including changing services, quantities, and statuses.
- **Order Status Tracking:** Track order status (pending, completed, cancelled, etc.).
- **Integration:** Orders can be created automatically by bot (n8n integration).
- **Order History:** Review order history for each guest and service.

### 8. AI Analytics
- **Automated Guest Behavior Analysis:** The system uses AI to analyze guest interactions and service usage.
- **Trend Detection:** Identify key behavioral trends, most popular products, and missed opportunities.
- **Actionable Recommendations:** Receive concrete recommendations for promotions and service improvements, tailored for hotel staff or automated bot actions.
- **Integrated Reporting:** AI-generated insights are presented in a clear, professional format for business decisions.
- **Customization:** AI analytics work with real-time data from bookings, orders, and guest behavior.

---

## Integration & Automation

- **n8n Workflows:** Integrates with n8n for event-driven automation (e.g., orders from Telegram bot).
- **Telegram Bot:** Automatically sends promotional messages to guests.

---
