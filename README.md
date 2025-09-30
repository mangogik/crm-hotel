# CRM Hotel Documentation

## Overview

CRM Hotel is a modern Customer Relationship Management system designed to help hotel operators manage guest interactions, bookings, rooms, and services efficiently. The system streamlines hotel operations and enhances guest satisfaction through an integrated dashboard and automation features.

**Tech Stack:**  
- JavaScript (Frontend: React + Inertia.js)
- PHP (Backend: Laravel)
- Other (Automation integrations)

---

## Features

### 1. User Authentication
- **Login/Register:** Secure authentication flow for hotel staff and admins.
- **Role-Based Access:** Different roles (Admin, Staff, etc.) provide access to appropriate dashboard features.

### 2. Dashboard
- **Main Navigation:** Sidebar with links to core modules (Bookings, Rooms, Customers, Services, Orders).
- **Personalized Role Display:** Sidebar adapts based on user role.

### 3. Bookings Management
- **Booking List & Table:** View all bookings, with expandable rows for details.
- **Filter & Search:** Filter bookings by customer, room, status, and date range ([BookingFilters.jsx](https://github.com/mangogik/crm-hotel/blob/main/resources/js/components/bookings/BookingFilters.jsx)).
- **CRUD Operations:** Create, edit, and delete bookings.  
  - Fields: customer, room, check-in/out dates, status (reserved, checked in, checked out, cancelled), notes ([BookingForm.jsx](https://github.com/mangogik/crm-hotel/blob/main/resources/js/components/bookings/BookingForm.jsx)).
- **Booking Status Tracking:** Update status as guests check in/out or cancel.

### 4. Room Management
- **Room Directory:** List all rooms with types and numbers.
- **Room Filters:** Filter and sort rooms by status, type, and room number ([Rooms.jsx](https://github.com/mangogik/crm-hotel/blob/main/resources/js/Pages/Rooms.jsx)).
- **CRUD Operations:** Add, edit, or delete rooms ([RoomForm.jsx](https://github.com/mangogik/crm-hotel/blob/main/resources/js/components/rooms/RoomForm.jsx)).

### 5. Customer Management
- **Customer List:** Manage hotel guest information (not detailed above, but implied by booking features).

### 6. Upselling and Automation
- **Integration with n8n:** Automated upselling messages sent via Telegram bot when guests check-in or interact with services ([AIController.php](https://github.com/mangogik/crm-hotel/blob/main/app/Http/Controllers/AIController.php)).
- **Behavior Analysis:** System analyzes guest behavior and suggests actionable promotions or trends in JSON format.

### 7. User Experience
- **Modern UI:** Clean interface with background images, overlays, and responsive design ([Welcome.jsx](https://github.com/mangogik/crm-hotel/blob/main/resources/js/Pages/Welcome.jsx)).
- **Notifications:** Success/error feedback for actions like booking creation.

---

## Getting Started

1. **Login/Register:** Access the dashboard via secure login or registration.
2. **Navigate:** Use the sidebar to manage rooms, bookings, customers, and services.
3. **Create Bookings:** Fill the booking form with customer and room details, select status, and add notes.
4. **Manage Rooms:** Add new rooms or update existing details.
5. **Automation:** Let the system handle upselling via Telegram.
6. **Analyze Trends:** Review automated recommendations for business optimization.

---

## Example Workflows

### Add a Booking
- Click "Add Booking" in the Bookings section.
- Select customer and room, set dates, choose status, and add notes.
- Submit and receive feedback.

### Add a Room
- Click "Add Room" in the Rooms section.
- Fill out room information and save.

### Filter Bookings
- Use filters to search by customer, room, status, or date.
- Clear filters to reset the view.

---

## Integration & Automation

- **n8n Workflows:** Integrates with n8n for event-driven automation.
- **Telegram Bot:** Automatically sends promotional messages to guests.

---
