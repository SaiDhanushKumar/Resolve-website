# 🚀 ResolveNow Central

### PS027 — Enterprise Issue Escalation & Service Desk Management System

> **ResolveNow Central** is a modern, enterprise-grade **microservices-based service desk platform** designed to automate customer complaint management, department assignment, ticket tracking, and real-time notifications.

The platform helps organizations efficiently manage customer grievances from the moment a complaint is created until it is completely resolved. By using **Spring Boot Microservices, JWT Authentication, Eureka Service Discovery, API Gateway, Load Balancing, and automated notifications**, ResolveNow provides a scalable and reliable support-management solution.

---

## 🎯 Business Use Case

**ResolveNow Service Desk** requires an automated platform to:

* 📝 Log and manage customer grievances
* 🏢 Assign issues to specialized departments
* 🔄 Track the complete complaint lifecycle
* ⚡ Provide real-time ticket status updates
* 🔔 Send automated progress notifications
* 👥 Maintain transparent department assignments
* 🔐 Secure APIs using JWT authentication
* 🌐 Route requests through a centralized API Gateway
* 🔎 Discover services dynamically using Eureka
* ⚖️ Support load balancing during high-volume support periods

The system follows a **microservices architecture**, where complaint management, department assignment, authentication, and notification delivery are independently developed and deployed.

---

# 🏗️ System Architecture

ResolveNow Central is divided into multiple independent services:

```text
                         👤 USER
                           │
                           ▼
                  🌐 API GATEWAY
                     Port: 8080
                           │
             ┌─────────────┼─────────────┐
             │             │             │
             ▼             ▼             ▼
        🔐 AUTH       📝 COMPLAINT    📢 NOTIFICATION
        SERVICE         SERVICE         SERVICE
             │             │
             │             ▼
             │       🏢 ASSIGNMENT
             │          SERVICE
             │
             └──────────────┐
                            ▼
                    🔎 EUREKA SERVER
                    Service Discovery
                            │
                            ▼
                    ⚖️ LOAD BALANCING
```

---

# 🧩 Microservices

## 🔐 1. Auth Service

Responsible for user authentication and authorization.

### Responsibilities

* 👤 User registration and login
* 🔑 JWT token generation
* 🛡️ JWT-based authentication
* 🚫 Unauthorized request protection
* 👮 Role-based access control

---

## 📝 2. Complaint Service

Responsible for creating and managing customer complaints.

### Responsibilities

* ➕ Create complaints
* 📋 View complaints
* 🔄 Update complaint status
* 🔎 Track complaint lifecycle
* 🗄️ Store complaint information
* 🔗 Communicate with Assignment Service

### Example Lifecycle

```text
🆕 Created
   ↓
📌 Assigned
   ↓
🔧 In Progress
   ↓
⏳ Waiting / Escalated
   ↓
✅ Resolved
   ↓
🔒 Closed
```

---

## 🏢 3. Assignment Service

Responsible for assigning complaints to the appropriate departments or support teams.

### Responsibilities

* 🏢 Identify the required department
* 👨‍💼 Assign complaints to teams
* 🔄 Update assignment status
* 📊 Track department workload
* ⚡ Support high-volume ticket assignment

### Example

```text
Customer Complaint
       │
       ▼
   🔍 Analyze Issue
       │
 ┌─────┼───────────┐
 ▼     ▼           ▼
💻 IT  💳 Finance  📦 Operations
```

---

## 📢 4. Notification Service

Responsible for keeping users informed about complaint progress.

### Responsibilities

* 🔔 Send complaint updates
* 📩 Notify users about assignments
* ⚡ Send status-change notifications
* 🚨 Send escalation alerts
* 📬 Notify users when complaints are resolved

### Example

```text
Complaint Created
       ↓
🔔 "Complaint received"

Department Assigned
       ↓
🔔 "Your complaint has been assigned"

Complaint Updated
       ↓
🔔 "Your complaint is being processed"

Complaint Resolved
       ↓
🎉 "Your complaint has been resolved"
```

---

# 🌐 API Gateway

The **API Gateway** acts as the single entry point for clients.

Instead of users directly accessing individual microservices:

```text
❌ User → Complaint Service
❌ User → Assignment Service
❌ User → Notification Service
```

All requests pass through:

```text
👤 User
   ↓
🌐 API Gateway
   ↓
🔐 Authentication
   ↓
🔎 Service Discovery
   ↓
⚖️ Load Balancing
   ↓
🧩 Required Microservice
```

### Responsibilities

* 🌐 Centralized API entry point
* 🛣️ Request routing
* 🔐 Authentication filtering
* ⚖️ Load balancing
* 🚫 Unauthorized request blocking
* 🔄 Service discovery integration

---

# 🔎 Eureka Server

**Eureka Server** provides service discovery for the microservices.

Each service registers itself with Eureka:

```text
🔎 Eureka Server
      │
      ├── 🔐 Auth Service
      ├── 📝 Complaint Service
      ├── 🏢 Assignment Service
      ├── 📢 Notification Service
      └── 🌐 API Gateway
```

This prevents services from depending on fixed IP addresses and makes the architecture easier to scale.

### Benefits

* 🔍 Automatic service discovery
* ⚖️ Client-side load balancing
* 🔄 Dynamic service registration
* 📈 Better scalability
* 🛡️ Improved service availability

---

# 🔐 JWT Authentication

ResolveNow uses **JSON Web Tokens (JWT)** to secure the application.

### Authentication Flow

```text
👤 User
   │
   ▼
🔐 Login
   │
   ▼
🎫 JWT Token
   │
   ▼
🌐 API Gateway
   │
   ▼
🛡️ JWT Validation
   │
   ▼
✅ Authorized Request
   │
   ▼
🧩 Microservice
```

This ensures that only authenticated users can access protected APIs.

---

# 🔄 Inter-Service Communication

The services communicate with each other to complete the complaint workflow.

### Main Flow

```text
📝 Complaint Service
        │
        ▼
🏢 Assignment Service
        │
        ▼
📢 Notification Service
        │
        ▼
👤 User
```

### Example

When a customer creates a complaint:

1. 📝 Complaint Service records the complaint.
2. 🏢 Assignment Service determines the appropriate department.
3. 👨‍💼 The complaint is assigned to the responsible team.
4. 📢 Notification Service sends an update to the customer.
5. 🔄 Further status changes trigger additional notifications.

---

# ⚡ High-Volume Support & Load Balancing

ResolveNow is designed to handle increased support traffic.

Multiple instances of a service can run simultaneously:

```text
                    🌐 API Gateway
                          │
                          ▼
                    🔎 Eureka
                          │
              ⚖️ Load Balancer
                 ┌────────┼────────┐
                 ▼        ▼        ▼
              📝 App-1  📝 App-2  📝 App-3
```

If one instance becomes unavailable, requests can be redirected to another available instance.

This improves:

* 📈 Scalability
* ⚡ Performance
* 🛡️ Availability
* 🔄 Fault tolerance

---

# 🗄️ Database Architecture

Each microservice follows the **database-per-service principle**.

```text
🔐 Auth Service
      ↓
🗄️ Auth Database

📝 Complaint Service
      ↓
🗄️ Complaint Database

📢 Notification Service
      ↓
🗄️ Notification Database
```

This keeps services independent and prevents one service from directly depending on another service's database.

---

# 🧪 Testing

The project includes testing to verify that individual services and APIs work correctly.

### Testing Areas

* 🔐 Authentication testing
* 📝 Complaint API testing
* 🏢 Assignment API testing
* 📢 Notification testing
* 🌐 Gateway routing testing
* 🔎 Eureka registration testing
* 🔄 Inter-service communication testing
* 🚫 Unauthorized request testing

---

# 🚀 Deployment

The application is designed to be deployable as independent microservices.

Each service can be packaged and deployed separately, allowing the system to scale based on demand.

### Deployment Flow

```text
💻 Source Code
      ↓
📦 Build Services
      ↓
🧪 Run Tests
      ↓
🐳 Containerize
      ↓
☁️ Deploy
      ↓
🌐 API Gateway
      ↓
👤 End Users
```

---

# 🛠️ Technology Stack

| Layer                | Technology                         |
| -------------------- | ---------------------------------- |
| 🎨 Frontend          | React / Modern Web UI              |
| ⚙️ Backend           | Java + Spring Boot                 |
| 🧩 Architecture      | Microservices                      |
| 🌐 Gateway           | Spring Cloud Gateway               |
| 🔎 Service Discovery | Netflix Eureka                     |
| 🔐 Security          | Spring Security + JWT              |
| 🗄️ Database         | MySQL                              |
| 🔄 Communication     | REST APIs                          |
| ⚖️ Load Balancing    | Spring Cloud LoadBalancer          |
| 🧪 Testing           | JUnit / Spring Boot Test           |
| 📦 Build Tool        | Maven                              |
| 🔀 Version Control   | Git + GitHub                       |
| ☁️ Deployment        | Cloud / Container-based deployment |

---

# 📋 Project Tasks

### Core Development

* [x] 🔐 Implement JWT Authentication
* [x] 📝 Implement Complaint Service
* [x] 🏢 Implement Assignment Service
* [x] 📢 Implement Notification Service
* [x] 🌐 Implement API Gateway
* [x] 🔎 Configure Eureka Server
* [x] 🔄 Implement inter-service communication
* [x] ⚖️ Enable service load balancing
* [x] 🗄️ Configure databases
* [x] 🧪 Write API and service tests
* [x] 🚀 Deploy complete application

---

# 💻 Development

This project was built with **Lovable**.

### 🌐 Live Application

**ResolveNow Central**

[Open Live Application](https://concern-conqueror.lovable.app?utm_source=chatgpt.com)

### 🎨 Continue Development

You can continue developing the project directly in the **Lovable editor**:

[Open Lovable Project](https://lovable.dev/projects/8ae8d28c-73fd-458a-ba01-afaaa1f3cbae?utm_source=chatgpt.com)

Lovable provides:

* ⚡ **Faster Development** — Describe the feature you need and Lovable generates the implementation.
* 🔄 **GitHub Synchronization** — Changes can be synchronized with your GitHub repository.
* 💻 **Local Development** — Clone the repository and continue development locally.
* 🔑 **Full Code Ownership** — The project source code remains available for further development.

---

# 💻 Run Locally

Make sure **Node.js** and **npm** are installed.

### 1️⃣ Clone the repository

```bash
git clone <this-repository-url>
```

### 2️⃣ Open the project

```bash
cd <repository-name>
```

### 3️⃣ Install dependencies

```bash
npm install
```

### 4️⃣ Start the development server

```bash
npm run dev
```

The application can then be accessed through the local development URL provided by the development server.

---

# 🌟 Key Benefits

### 🔐 Secure

JWT-based authentication protects sensitive APIs and user information.

### 🧩 Modular

Each business function is implemented as an independent microservice.

### 📈 Scalable

Individual services can be scaled independently based on demand.

### ⚡ Reliable

Eureka service discovery and load balancing improve service availability.

### 🔄 Real-Time Updates

Users can receive notifications as their complaints progress through different stages.

### 🏢 Enterprise Ready

The architecture follows modern microservices principles suitable for large-scale service desk applications.

---

# 🎯 Final Objective

The primary goal of **ResolveNow Central** is to transform traditional complaint handling into a **secure, automated, scalable, and transparent digital service desk**.

By combining **Microservices + JWT Security + API Gateway + Eureka + Load Balancing + Automated Notifications**, ResolveNow provides an end-to-end solution for managing customer issues efficiently.

> 🚀 **ResolveNow Central — From Complaint to Resolution, Seamlessly.**
>
> https://resolvenow-2400032097.lovable.app/auth
