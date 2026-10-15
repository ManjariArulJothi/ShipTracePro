# 🏗️ ShipTrackPro — System Architecture & Design Document

**ShipTrackPro** is an enterprise-grade logistics and parcel tracking platform built on a modern Spring Boot + React stack with PostgreSQL.

---

## 1. High-Level System Architecture Diagram

```mermaid
flowchart TB
    subgraph ClientLayer ["Client Layer (Browser / Web UI)"]
        UI_Admin["Admin Console<br/>(System & Fleet Oversight)"]
        UI_Business["Business Client Portal<br/>(Shipment Creation & Analytics)"]
        UI_Operator["Operator Navigation<br/>(Route Execution & POD Capture)"]
        UI_Customer["Customer Portal<br/>(Tracking, Verification & Tickets)"]
        UI_Support["Support Desk<br/>(Ticket Management & Issue Resolution)"]
    end

    subgraph FrontendEngine ["Frontend Framework (Vite + React 18)"]
        Router["React Router v6<br/>Role-Based Route Guards"]
        StateManagement["TanStack React Query<br/>(Server State Cache & Auto-Polling)"]
        AuthContext["Auth Context<br/>(JWT Token & Session Storage)"]
        AxiosClient["Axios HTTP Interceptor<br/>(Bearer JWT Header Injection)"]
        STOMPClient["STOMP / WebSocket Client<br/>(Live Telemetry Updates)"]
    end

    subgraph APIGatewayLayer ["Backend Controller & Security Layer (Spring Boot 3.5.4)"]
        SecFilter["Spring Security Filter Chain<br/>(JwtAuthenticationFilter)"]
        RESTControllers["REST API Controllers<br/>/api/auth • /api/shipments • /api/pod<br/>/api/routes • /api/tickets • /api/admin"]
        WSEndpoint["WebSocket Broker<br/>/ws-tracking (/topic/tracking)"]
    end

    subgraph CoreServices ["Application Service Layer (Business Logic)"]
        AuthService["Auth & User Service<br/>(BCrypt, Role Checks, Profile)"]
        ShipmentService["Shipment Service<br/>(Lifecycle, Status Machine, Permissions)"]
        RouteService["Route & Network Engine<br/>(Hub Graphs, Shortest Path Routing)"]
        EtaService["ETA & Forecasting Engine<br/>(Speed, Distance, Weather/Traffic Factors)"]
        PODService["Proof of Delivery Service<br/>(Signature Canvas & Photo Storage)"]
        NotificationService["Notification & Mail Service<br/>(In-App Alerts & Thymeleaf HTML Email)"]
        TicketService["Support Ticket Service<br/>(Customer Issues & Resolution)"]
    end

    subgraph PersistenceLayer ["Persistence & External Services"]
        Flyway["Flyway Migration Engine<br/>(Auto Schema Versioning)"]
        PostgreSQL[("PostgreSQL 16 Database<br/>users • shipments • hubs<br/>pod • tickets • notifications")]
        Cloudinary["Cloudinary / Data URL Engine<br/>(POD Image Fallback)"]
        SMTP["SMTP Mail Server<br/>(Gmail / TLS Relay)"]
    end

    %% Connections
    UI_Admin & UI_Business & UI_Operator & UI_Customer & UI_Support --> Router
    Router --> StateManagement & AuthContext
    StateManagement --> AxiosClient
    StateManagement --> STOMPClient

    AxiosClient -->|HTTP/REST with JWT| SecFilter
    STOMPClient -->|WebSocket Handshake| WSEndpoint

    SecFilter --> RESTControllers
    RESTControllers --> CoreServices
    WSEndpoint --> CoreServices

    CoreServices --> Flyway
    CoreServices --> Cloudinary
    CoreServices --> SMTP
    CoreServices --> PostgreSQL
```

---

## 2. Multi-Role Interaction & Workflow Architecture

The platform orchestrates 5 distinct actors across the parcel lifecycle:

```mermaid
flowchart LR
    subgraph BusinessClient ["🏢 Business Client"]
        BC_Create["1. Create Shipment<br/>& Sender/Receiver Info"]
    end

    subgraph Admin ["🛡️ Administrator"]
        AD_Manage["Fleet & User Control<br/>System Monitoring"]
    end

    subgraph Operator ["🚚 Logistics Operator"]
        OP_Accept["2. Accept Assignment"]
        OP_Transit["3. Confirm Hubs<br/>& Update Journey"]
        OP_POD["4. Capture POD<br/>(Photo & Signature)"]
    end

    subgraph Customer ["👤 Customer"]
        CU_Track["Track Real-time Parcel"]
        CU_Verify["5. Verify Delivery POD"]
        CU_Ticket["Raise Support Ticket"]
    end

    subgraph SupportAgent ["🎧 Support Agent"]
        SA_Resolve["Investigate Shipment<br/>& Resolve Tickets"]
    end

    BC_Create -->|Assigns Dispatch| OP_Accept
    OP_Accept --> OP_Transit
    OP_Transit --> OP_POD
    OP_POD -->|Triggers Verification| CU_Verify
    CU_Ticket -->|Dispatches to| SA_Resolve
    AD_Manage -.->|Monitors All| BusinessClient & Operator & Customer & SupportAgent
```

---

## 3. Delivery Execution & Proof of Delivery (POD) Sequence

This sequence highlights the complete delivery loop, including the Cloudinary/Base64 photo fallback architecture:

```mermaid
sequenceDiagram
    autonumber
    actor Driver as Logistics Operator (Ragu)
    participant UI as Operator Navigation (React)
    participant API as Backend (Spring Boot)
    participant POD as CloudinaryService / Base64 Engine
    participant DB as PostgreSQL (ShiptrackPro)
    participant WS as WebSocket Topic (/topic/tracking)
    actor Customer as Customer (Manju)

    Driver->>UI: Selects "DELIVERED" status
    Driver->>UI: Draws signature + takes delivery photo
    Driver->>UI: Clicks "Complete Delivery"
    UI->>API: POST /api/pod (multipart/form-data: JSON + Photo File)
    activate API

    alt Cloudinary Configured
        API->>POD: uploadImage(photo) via Cloudinary API
        POD-->>API: secure_url (CDN link)
    else Demo Key / Network Offline
        API->>POD: Convert to Base64 Data URL (data:image/jpeg;base64,...)
        POD-->>API: Inline Data URL string
    end

    API->>DB: INSERT INTO proofs_of_delivery (signature_data, photo_url, status='PENDING')
    API->>DB: UPDATE shipments SET status='DELIVERED', delivered_at=NOW()
    API->>WS: Broadcast shipment update to subscribers
    WS-->>Customer: Real-time status update: "Delivered"
    API-->>UI: 200 OK (Delivery Completed)
    deactivate API

    Customer->>API: GET /api/pod/pending
    API-->>Customer: Returns POD with photo & signature
    Customer->>API: PUT /api/pod/{id}/verify
    API->>DB: UPDATE proofs_of_delivery SET verification_status='VERIFIED'
    API-->>Customer: 200 OK (POD Verified)
```

---

## 4. Database Entity-Relationship (ER) Architecture

```mermaid
erDiagram
    USERS ||--o{ SHIPMENTS : "creates / owns"
    USERS ||--o{ PROOFS_OF_DELIVERY : "verified by"
    USERS ||--o{ TICKETS : "reported / assigned"
    SHIPMENTS ||--|| PROOFS_OF_DELIVERY : "has"
    SHIPMENTS ||--o{ SHIPMENT_ROUTES : "follows"
    SHIPMENTS ||--o{ JOURNEY_UPDATES : "logs"
    HUBS ||--o{ HUB_CONNECTIONS : "origin / destination"
    HUBS ||--o{ SHIPMENT_ROUTES : "intermediate stop"

    USERS {
        bigint id PK
        string email UK
        string password
        string first_name
        string last_name
        string role "ADMIN, BUSINESS_CLIENT, CUSTOMER, LOGISTICS_OPERATOR, SUPPORT_AGENT"
        boolean is_active
        timestamp created_at
    }

    SHIPMENTS {
        bigint id PK
        string tracking_number UK
        bigint business_client_id FK
        bigint customer_id FK
        bigint driver_id FK
        string status "CREATED, PICKED_UP, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, FAILED_DELIVERY, CANCELLED"
        string sender_city
        string receiver_city
        decimal package_weight_kg
        timestamp estimated_delivery_at
        timestamp delivered_at
        boolean cancelled_by_customer
    }

    PROOFS_OF_DELIVERY {
        bigint id PK
        bigint shipment_id FK,UK
        text signature_data "Base64 canvas data"
        text photo_url "Cloudinary or Base64 data URL"
        string recipient_name
        string recipient_phone
        string verification_status "PENDING, VERIFIED, REJECTED"
        bigint verified_by FK
        timestamp captured_at
        timestamp verified_at
    }

    HUBS {
        bigint id PK
        string hub_name
        string city
        string pincode
        decimal latitude
        decimal longitude
    }

    HUB_CONNECTIONS {
        bigint id PK
        bigint origin_hub_id FK
        bigint destination_hub_id FK
        decimal distance_km
        int estimated_minutes
    }

    TICKETS {
        bigint id PK
        string ticket_number UK
        bigint customer_id FK
        bigint shipment_id FK
        string subject
        text description
        string status "OPEN, IN_PROGRESS, RESOLVED, CLOSED"
        string priority "LOW, MEDIUM, HIGH, URGENT"
        bigint assigned_to FK
    }
```

---

## 5. Technology Stack Summary

| Layer | Technology | Key Responsibility |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 + Vite | Single Page Application (SPA), lightning fast HMR |
| **Styling & UI Components** | Tailwind CSS + Radix UI | Modern accessible design system with dark/light theme |
| **Client State & Cache** | TanStack React Query v5 | Auto invalidation, refetch intervals, seamless async state |
| **Client Routing** | React Router DOM v6 | Role-based protected routes (`/app/admin`, `/app/operator`, etc.) |
| **Signature Capture** | Signature Pad (Canvas API) | Recipient physical signature vectorization |
| **Backend Framework** | Spring Boot 3.5.4 | Enterprise monolithic REST API & WebSocket server |
| **Language Runtime** | Java 21 LTS | Modern virtual threads, pattern matching, record types |
| **Security & Auth** | Spring Security + JJWT 0.12 | Stateless token-based security, role authorizations |
| **Database ORM** | Spring Data JPA + Hibernate 6 | Relational mapping, pessimistic locking (`PessimisticLock`) |
| **Database Migrations** | Flyway 11 | Version-controlled schema migrations (`db/migration/V*.sql`) |
| **Database** | PostgreSQL 16 | Relational store with ACID transactions and high throughput |
| **Real-time Engine** | Spring STOMP / WebSockets | Live parcel telemetry and GPS coordinates dispatch |
| **Media & Asset Engine** | Cloudinary SDK + Base64 Fallback | Resilient photo uploads that never fail offline |
| **Email Subsystem** | Spring Mail + Thymeleaf | Rich branded HTML transactional parcel emails |
