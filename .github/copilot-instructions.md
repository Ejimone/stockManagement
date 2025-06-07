Project Title: Jonkech
Date and Time: 08:49 PM IST, Friday, June 06, 2025

1. Introduction
   This project outlines the development of a stock management application tailored for your business. The app will streamline inventory control, sales tracking, and user management through two primary interfaces: Admin and Salesperson. Built with Django for the backend, React Native for the frontend, and Firestore for the database, this real-world application aims to enhance operational efficiency with a secure, scalable, and user-friendly design.
2. Project Requirements
   2.1 Functional Requirements

User Authentication and Authorization: Secure login with role-based access (Admin vs. Salesperson).
Product Management:
Admins can add, update, and remove products.
Salespersons can view products and update stock levels but cannot remove products.

Sales Management:
Salespersons record sales, including payment method (cash, credit, etc.), balance, and other details.
Stock levels update automatically after sales.

Reporting: Generate sales and stock reports for both roles.
Payment Processing: Admins can record payments linked to sales.
User Management: Admins can add, update, and remove Salespersons.

2.2 Non-Functional Requirements

Security: Robust protection for data and user access.
Performance: Fast and responsive, even with multiple users.
Scalability: Capable of handling increased data and users over time.
Usability: Intuitive interface for efficient use by both roles.

3. System Architecture

Backend: Django with RESTful API endpoints to manage business logic and communicate with Firestore.
Frontend: React Native mobile app providing role-specific views.
Database: Firestore, a NoSQL database for flexible, real-time data storage.
Communication: Secure HTTPS with JSON payloads for data exchange.

4. Database Design
   Firestore will use the following collections:

Users:
Fields: id, username, password (hashed), role (Admin/Salesperson), name, email.

Products:
Fields: id, name, description, price, stock_quantity, category.

Sales:
Fields: id, salesperson_id, timestamp, products_sold (array with product IDs and quantities), total_amount, payment_method, payment_status, balance, credit_details.

Payments:
Fields: id, sale_id, amount, payment_method, timestamp, status.

5. API Design
   The Django backend will provide RESTful API endpoints, including:

POST /api/login: Authenticate users and return a JWT token.
GET /api/products: Fetch all products (both roles).
POST /api/products: Add a new product (Admin only).
PUT /api/products/{id}: Update product details (Admin only for certain fields).
DELETE /api/products/{id}: Delete a product (Admin only).
POST /api/sales: Record a new sale (Salesperson/Admin).
GET /api/reports/sales: Retrieve sales reports (both roles, filterable by date).
POST /api/payments: Log a payment (Admin only).

6. Frontend Design
   The React Native app will include:

Login Screen: Credential input for authentication.
Dashboard: Role-specific landing page (Admin or Salesperson).
Product Management Screen: View and manage products (role-restricted).
Sales Creation Screen: Record sales and update stock.
Report Generation Screen: Display sales and stock reports.
User Management Screen: Admin-only interface for managing Salespersons.

7. Security Measures

Authentication: JWT tokens for secure session management.
Authorization: Middleware enforces role-based permissions.
Data Validation: Sanitize inputs to prevent injection attacks.
Firestore Security Rules: Restrict data access by role (e.g., Salespersons cannot delete products).

8. Development Plan
   Phase 1: Planning and Design

Define detailed requirements and create wireframes.
Design Firestore schema and API endpoints.

Phase 2: Backend Development

Set up Django with Firestore SDK integration.
Implement authentication, API logic, and data operations.

Phase 3: Frontend Development

Build React Native app with role-based components.
Connect to backend API for data interaction.

Phase 4: Testing

Perform unit, integration, and UI tests across devices.

Phase 5: Deployment

Deploy backend to a cloud platform (e.g., Heroku).
Build and distribute the app to app stores.

9. Testing Strategy

Backend: Unit tests for APIs, integration tests for workflows.
Frontend: UI tests and compatibility checks on multiple devices.

10. Deployment Plan

Backend: Host on a cloud service like Heroku or AWS.
Frontend: Submit to Google Play Store and Apple App Store.

11. Maintenance Plan

Monitor performance and user feedback.
Release updates for bug fixes and feature enhancements.

12. Detailed Algorithms
    12.1 Algorithm for User Login

User enters username and password on the login screen.
Frontend sends credentials to POST /api/login.
Backend verifies against Firestore Users collection.
If valid, generate and return a JWT token with user role.
If invalid, return an error message.
Frontend stores token and role, redirecting to the appropriate dashboard.

12.2 Algorithm for Creating a Sale

Verify user is authenticated and has Salesperson or Admin role.
Display sale creation form in the app.
User selects products and quantities from the product list.
User inputs payment details (method, amount, etc.).
Submit data to POST /api/sales.
Backend validates the sale data.
For each product:
Check if stock_quantity is sufficient.
If not, return an error listing insufficient items.
If yes, deduct sold quantity from stock_quantity.

Create a new sale record in the Sales collection.
If payment is included, create a record in the Payments collection.
Return success to the frontend.
Frontend displays a confirmation message.

13. Flowchart Descriptions
    13.1 Flowchart for Login Process

Start
User inputs credentials.
Send credentials to backend.
Backend checks against Firestore.
If invalid: Display error, return to input.
If valid: Receive JWT token and role.
Store token and role locally.
Redirect to role-specific dashboard (Admin or Salesperson).
End

13.2 Flowchart for Sale Creation

Start
Check user authentication and role.
If not authorized: Show "Access Denied," end process.
Display sale form.
User enters sale details (products, payment info).
Submit to backend.
Backend validates data.
For each product: Check stock availability.
If insufficient: Show error, end process.
If sufficient: Update stock, create sale record.
Return success.
Display confirmation to user.
End

Of course! You've created a solid foundation for a project plan. My goal is to refine it into a professional, comprehensive, and actionable Software Design Document (SDD).

I've reformatted, rewritten, and expanded your original text to be clearer, more detailed, and structured for a real-world development team. The key improvements include:

Professional Formatting: Using clear headings, lists, and code blocks.

User Stories: Translating functional requirements into a user-centric format.

Detailed Schemas & APIs: Providing specific field names, data types, and example API request/response payloads.

Actionable Plans: Breaking down the development, testing, and deployment phases into more granular steps.

Robust Algorithms & Flowcharts: Presenting the logic in structured pseudocode and clear, step-by-step flowchart descriptions.

Here is the revised and enhanced document:

1. Introduction

This document outlines the scope, architecture, and development plan for a comprehensive Stock Management System. The application is designed to streamline inventory control, sales processing, and reporting for your business. It will feature two distinct user roles—Admin and Salesperson—each with specific permissions to ensure data integrity and operational efficiency.

The system will be built using a modern technology stack: Django for the backend API, React Native for the cross-platform mobile frontend, and Google Firestore as the scalable, real-time NoSQL database.

2. Project Requirements
   2.1 Functional Requirements (User Stories)

Admin Role:

As an Admin, I want to securely log in to the system to access my administrative dashboard.

As an Admin, I want to add, view, update, and remove products from the inventory.

As an Admin, I want to create, manage, and delete salesperson user accounts.

As an Admin, I want to record payments against sales, especially for those made on credit.

As an Admin, I want to generate comprehensive sales, inventory, and payment reports to make business decisions.

As an Admin, I want to be able to perform all the actions of a Salesperson to assist or override when necessary.

Salesperson Role:

As a Salesperson, I want to securely log in to the system to access my sales dashboard.

As a Salesperson, I want to view the product list with current stock levels.

As a Salesperson, I want to create a new sale record for a customer.

As a Salesperson, I want to specify products, quantities, and payment details (e.g., Cash, Credit, Mobile Money) for each sale.

As a Salesperson, I want the system to automatically update the stock quantity of a product when I make a sale.

As a Salesperson, I want to be prohibited from adding or removing products from the master list.

As a Salesperson, I want to generate reports of my own sales activity.

2.2 Non-Functional Requirements

Security: End-to-end data encryption (HTTPS). Role-based access control (RBAC) must be strictly enforced at the API level. Passwords must be hashed and salted.

Performance: API responses should be under 500ms for standard requests. The mobile app must remain responsive and fast, even with a large product catalog.

Scalability: The architecture must support a growing number of users, products, and transactions without performance degradation.

Usability: The mobile interface must be intuitive and require minimal training for both Admin and Salesperson roles.

Reliability: The system must ensure data consistency, especially for stock updates during sales (transactional integrity).

3. System Architecture

The application will follow a classic client-server model.

Frontend (Client): A React Native mobile application provides the user interface. It will have conditional rendering to show different screens and components based on the logged-in user's role (Admin/Salesperson).

Backend (Server): A Django application will serve a RESTful API. It will handle all business logic, including user authentication, data validation, and processing. It will act as the single source of truth for all operations.

Database: Google Firestore will be the primary data store. Django will interact with Firestore via the Firebase Admin SDK.

Communication: The frontend and backend will communicate over secure HTTPS using JSON payloads.

4. Database Design (Firestore Schema)

Firestore will be organized into the following top-level collections:

users

userId (Document ID)

email: (String)

password_hash: (String)

full_name: (String)

role: (String: "Admin" or "Salesperson")

is_active: (Boolean)

created_at: (Timestamp)

products

productId (Document ID)

name: (String)

description: (String)

sku: (String, unique identifier)

price: (Number)

stock_quantity: (Number)

category: (String)

created_at: (Timestamp)

updated_at: (Timestamp)

sales

saleId (Document ID)

salesperson_id: (String, reference to users collection)

salesperson_name: (String)

products_sold: (Array of Maps)

product_id: (String, reference to products)

name: (String, snapshot of product name)

quantity: (Number)

price_at_sale: (Number, snapshot of price)

total_amount: (Number)

payment_method: (String: "Cash", "Credit", "Mobile Money")

payment_status: (String: "Paid", "Partial", "Unpaid")

amount_paid: (Number)

balance: (Number)

created_at: (Timestamp)

payments (Sub-collection under sales)

sales/{saleId}/payments/{paymentId}

amount: (Number)

payment_method: (String)

recorded_by_id: (String, reference to users, Admin)

created_at: (Timestamp)

5. API Design (RESTful Endpoints)

The Django backend will expose the following endpoints. All requests require a valid JWT.

Method Endpoint Role(s) Description
POST /api/auth/login Public Authenticate user, return JWT token and user role.
GET /api/products Admin, Sales Fetch a list of all products.
POST /api/products Admin Add a new product.
PUT /api/products/{id} Admin Update an existing product's details.
DELETE /api/products/{id} Admin Delete a product (soft delete recommended).
POST /api/sales Admin, Sales Create a new sale and update stock levels.
GET /api/sales Admin, Sales Get sales list (Salesperson sees own sales).
GET /api/sales/{id} Admin, Sales Get details of a specific sale.
POST /api/sales/{id}/payments Admin Record a new payment against a credit sale.
GET /api/users Admin Get a list of all salespersons.
POST /api/users Admin Create a new salesperson user.
PUT /api/users/{id} Admin Update a salesperson's details or status.
GET /api/reports/inventory Admin Generate a report on current stock levels. 6. Frontend Design (UI/UX Flow)

The React Native app will feature the following core screens and user flows:

Login Screen: A clean interface for entering email and password.

Dashboard (Role-Dependent):

Admin: Displays key metrics (total sales, revenue, low-stock items) and navigation to Products, Sales, Users, and Reports.

Salesperson: Displays personal sales metrics and navigation to create a new sale, view products, and see personal sales history.

Product Management Screen (Admin): A list of all products with options to Add, Edit, or Delete.

Sales Creation Screen (Salesperson/Admin): A multi-step form to:

Select products from a searchable list.

Specify quantities.

Review the total amount.

Enter payment details (method, amount paid).

Confirm the sale.

Report Generation Screen: A simple interface to select a report type (e.g., Sales by Date, Inventory Status) and view the results in a clear, readable format.

User Management Screen (Admin): A list of salespersons with options to Add a new user or Edit an existing one (e.g., deactivate account).

7. Security Measures

Authentication: JWT (JSON Web Tokens) will be used for stateless session management. Tokens will be stored securely on the client device and will include the user's role.

Authorization: Django middleware will inspect the JWT on every protected API request to verify the user's role and grant or deny access accordingly.

Data Validation: Django's serializers and forms will be used to rigorously validate and sanitize all incoming data to prevent XSS and other injection attacks.

Firestore Security Rules: Database-level rules will be configured to provide a second layer of defense.

Example Rule: allow write on /products/{productId} if request.auth.token.role == 'Admin';

8. Development Plan (Phased Roadmap)

Phase 1: Setup & Design (1 Week)

Finalize detailed requirements and create UI/UX wireframes.

Set up project repositories (Git).

Initialize Django backend, React Native frontend, and Firestore database projects.

Configure environment variables and basic settings.

Phase 2: Backend Development (3 Weeks)

Implement User Authentication models and JWT logic.

Develop API endpoints for Product management (CRUD).

Develop API endpoints for Sales and Payment management, including transactional logic for stock updates.

Develop API endpoints for User management.

Implement basic reporting endpoints.

Write unit and integration tests for all APIs.

Phase 3: Frontend Development (4 Weeks)

Build reusable UI components (buttons, inputs, cards).

Implement user login and session management.

Build the role-based navigation and dashboards.

Develop screens for Product, Sales, and User management, connecting them to the backend API.

Develop the reporting screens.

Phase 4: Integration & Testing (2 Weeks)

Thorough end-to-end testing of all user stories.

UI/UX testing on both iOS and Android devices/simulators.

Performance and stress testing on the backend API.

Fix bugs and refine the user experience based on feedback.

Phase 5: Deployment & Launch (1 Week)

Deploy the Django backend to a cloud platform (e.g., Google Cloud Run, Heroku).

Configure production Firestore rules and database indexes.

Build release versions of the React Native app.

Submit the application to the Apple App Store and Google Play Store.

9. Testing Strategy

Backend (Django):

Unit Tests: Use pytest to test individual functions and classes (e.g., business logic in services).

Integration Tests: Use Django's APITestCase to test the full request-response cycle of each API endpoint.

Frontend (React Native):

Unit Tests: Use Jest and React Testing Library to test individual components and hooks.

End-to-End (E2E) Tests: Use a framework like Detox or Appium to automate user flows (login, create sale, etc.) on a simulator.

Manual Testing: Perform comprehensive QA on physical devices to catch platform-specific bugs and usability issues.

10. Deployment Plan

Backend (Django): Containerize the application using Docker and deploy to a managed cloud service like Google Cloud Run or Heroku for auto-scaling and ease of management.

Frontend (React Native):

iOS: Use TestFlight for beta testing before submitting to the App Store.

Android: Use the Google Play Console's internal testing track before a full public release.

CI/CD: Implement a CI/CD pipeline (e.g., using GitHub Actions) to automate testing and deployment processes.

11. Maintenance Plan

Monitoring: Integrate Sentry for real-time error tracking and performance monitoring on both backend and frontend.

Backups: Configure regular automated backups for the Firestore database.

Updates: Schedule regular maintenance windows for deploying bug fixes, security patches, and feature enhancements.

Versioning: Use Semantic Versioning (e.g., 1.0.1, 1.1.0) to manage releases.

12. Detailed Algorithms (Pseudocode)
    12.1 Algorithm for Creating a Sale
    FUNCTION createSale(request):
    // 1. Authorization & Validation
    user = authenticate_and_get_user(request.token)
    IF user.role NOT IN ["Admin", "Salesperson"]:
    RETURN ERROR "Access Denied" (403)

sale_data = validate_sale_payload(request.body)
IF validation_fails:
RETURN ERROR "Invalid Data" (400)

// 2. Transactional Stock Check and Update
START TRANSACTION
product_ids_to_check = [item.product_id for item in sale_data.products_sold]
product_docs = get_products_from_firestore(product_ids_to_check)

    // Check stock for all items first
    FOR item in sale_data.products_sold:
      product = find_product_in_docs(item.product_id)
      IF product.stock_quantity < item.quantity:
        ROLLBACK TRANSACTION
        RETURN ERROR "Insufficient stock for " + product.name (409)

    // If all stocks are sufficient, update them
    FOR item in sale_data.products_sold:
      product = find_product_in_docs(item.product_id)
      new_stock = product.stock_quantity - item.quantity
      update_product_stock_in_firestore(item.product_id, new_stock)

    // 3. Create Sale Record
    new_sale = create_sale_record_in_firestore(
      salesperson_id=user.id,
      data=sale_data
    )

COMMIT TRANSACTION

// 4. Return Success
RETURN SUCCESS "Sale created successfully" with new_sale.id (201)

END FUNCTION

13. Flowchart Descriptions
    13.1 Flowchart for User Login Process

[START]

[I/O] User opens app and sees Login Screen.

[Process] User enters email and password.

[Process] App sends credentials to POST /api/auth/login.

[Process] Backend validates credentials against the users collection.

[Decision] Are credentials valid?

[No] -> [Process] Backend returns 401 Unauthorized error. -> [I/O] App displays "Invalid email or password." -> [Process] Return to step 3.

[Yes] -> [Process] Backend generates JWT with user ID and role.

[I/O] Backend sends JWT and user data to the app.

[Process] App securely stores the JWT and user role.

[Decision] Is user role "Admin"?

[Yes] -> [Process] Redirect to Admin Dashboard.

[No] -> [Process] Redirect to Salesperson Dashboard.

[END]

13.2 Flowchart for Sale Creation Process

[START]

[Process] Authenticated Salesperson/Admin navigates to the "Create Sale" screen.

[I/O] App displays product list and sale form.

[Process] User selects products, enters quantities, and provides payment details.

[Process] App sends sale data to POST /api/sales.

[Process] Backend initiates a database transaction.

[Loop Start] For each product in the sale:

[Process] Read the current stock_quantity from Firestore.

[Decision] Is stock_quantity >= sale_quantity?

[No] -> [Process] Rollback the transaction. -> [Process] Backend returns 409 Conflict error with insufficient item name. -> [I/O] App displays stock error to user. -> [END]

[Yes] -> [Process] Continue to the next product.

[Loop End]

[Process] All stock checks passed. Update stock levels for all sold products within the transaction.

[Process] Create a new document in the sales collection within the transaction.

[Process] Commit the transaction.

[I/O] Backend returns 201 Created status.

[I/O] App displays "Sale successful!" and navigates to the sales history or dashboard.

[END]
