# 🍽️ DineFlow AI

### The Restaurant That Listens, Understands & Operates in Real Time.

DineFlow AI is a next-generation AI-powered restaurant automation and dining orchestration platform that connects customers, kitchen staff, waiters, and restaurant managers through a unified real-time ecosystem.

Customers can reserve tables, browse menus, and place orders using **QR Codes, Voice, Text, or Telegram**, while restaurant staff can manage kitchen operations, inventory, reservations, and analytics from dedicated dashboards.

---

## 🚀 Why DineFlow AI?

Traditional restaurant workflows often depend on manual ordering, waiter coordination, and disconnected systems. This can lead to:

- Long customer waiting times
- Manual order-taking errors
- Poor communication between front-of-house and kitchen
- Difficulty tracking inventory
- Lack of real-time operational insights

DineFlow AI solves these problems by bringing **AI-powered conversational ordering + real-time restaurant operations** into one platform.

---

# ✨ Key Features

## 🗣️ Multi-Channel Ordering

Customers can interact with the restaurant through multiple channels:

- 📱 Table-specific QR Menu
- 🎤 AI Voice Ordering
- 💬 Text-based AI Ordering
- 🤖 Telegram Bot

No complicated app navigation is required.

---

## 🤖 AI Voice & Text Ordering

Customers can place natural-language orders such as:

> "Order two Butter Naan at Table 3."

The AI processes the request and converts it into a structured order automatically.

### AI Pipeline

```text
Voice / Text Input
       ↓
Speech-to-Text
       ↓
Natural Language Processing
       ↓
Intent & Entity Extraction
       ↓
Order Validation
       ↓
Structured Order
       ↓
Kitchen Display System

The system can understand:

Food items
Quantities
Table numbers
Multiple items
Custom preferences
Natural-language commands

📱 QR-Based Digital Menu

Each restaurant table can have a unique QR code.

Customers can:

Scan the QR code
Access the digital menu
View item availability
Place orders
Receive loyalty rewards
Track order status

The menu is dynamically synchronized with inventory availability.

Telegram Restaurant Assistant

DineFlow AI integrates with Telegram to provide a conversational restaurant experience.

Customers can use Telegram to:

Reserve tables
Check restaurant information
Place orders
Receive order updates
Track reservations

Example
👋 Welcome to DineFlow AI

🍽️ View Menu
🪑 Reserve Table
🎤 Voice Order
💬 Text Order
📦 Track Order
🧾 Request Bill
⭐ Loyalty Rewards

👨‍🍳 Real-Time Kitchen Display System

All orders are instantly pushed to the Kitchen Display System using Socket.IO / WebSockets.

Kitchen staff can manage orders through:

IN QUEUE
    ↓
PREPARING
    ↓
READY
    ↓
DELIVERED

Customers receive real-time order status updates without needing to refresh the page.

📦 Automated Inventory Management

DineFlow AI automatically connects orders with inventory.

When the kitchen marks an order as Ready, the backend automatically deducts the corresponding quantity from the item's stock.

If stock reaches zero:

stockCount = 0
        ↓
isAvailable = false
        ↓
Item becomes unavailable

This prevents customers from ordering unavailable dishes.

🎁 Customer Loyalty Engine

DineFlow AI includes a loyalty system that can track customer visits and provide rewards or randomized discounts.

This helps restaurants:

Increase repeat visits
Improve customer engagement
Encourage loyalty
Create personalized experiences
🔐 Authentication & Role-Based Access

DineFlow AI provides secure authentication using:

Google OAuth 2.0
Email + 6-Digit OTP Verification
User Roles

📊 Manager Dashboard

Restaurant managers get a centralized operational dashboard with insights such as:

📈 Revenue Analytics
Daily revenue
Order statistics
Sales trends
🪑 Table Management
Active table occupancy
Available tables
Reservations
📦 Inventory
Stock availability
Menu item status
Low-stock monitoring
🍽️ Operations
Active orders
Kitchen status
Order completion tracking

🏗️ System Architecture
<img width="1024" height="559" alt="image" src="https://github.com/user-attachments/assets/3aa2447c-a81e-43c5-97e0-41f1eb2e0163" />

🛠️ Technology Stack
Frontend
Next.js
React
App Router
Backend
Node.js
Express.js
Database
MongoDB
AI / NLP
Voice-to-Text
Natural Language Processing
Intent & Entity Extraction
AI-powered Order Parsing
Real-Time Communication
Socket.IO
WebSockets
Authentication
Google OAuth 2.0
Email + OTP
Integrations
Telegram Bot API
QR Code Technology
REST APIs

End-to-End Workflow
<img width="1024" height="559" alt="image" src="https://github.com/user-attachments/assets/170a4b88-f31b-4a22-a85c-ed68aca98396" />
Key Use Cases
Customer
Reserve a table
Scan QR menu
Place voice/text orders
Order through Telegram
Track order status
Earn loyalty rewards
Kitchen Staff
View incoming orders
Update preparation status
Manage order queue
Trigger inventory deduction
Restaurant Manager
Monitor revenue
Track table occupancy
Manage reservations
Monitor inventory
Analyze restaurant operations
🌍 Real-World Applications

DineFlow AI can be deployed across:

🍽️ Restaurants
☕ Cafés
🏨 Hotels & Resorts
🏬 Food Courts
🍳 Cloud Kitchens
🏢 Multi-Branch Restaurant Chains

Impact

DineFlow AI aims to achieve:

↓ Waiting Time
↓ Order Errors
↓ Stock Waste

↑ Staff Efficiency
↑ Customer Satisfaction
↑ Operational Visibility
↑ Customer Engagement

The platform bridges the gap between customer experience and restaurant operations through AI and real-time automation.

🔮 Future Enhancements

Future versions can include:

🌐 Multilingual AI Voice Assistant
📊 AI-Based Demand Forecasting
🍽️ Personalized Food Recommendations
📦 Predictive Inventory Management
👨‍🍳 AI Kitchen Workload Optimization
💳 Online Payment Integration
🧾 POS Integration
🚚 Delivery Platform Integration
🤝 CRM Integration
📈 Advanced AI Business Analytics
📌 Scalability

DineFlow AI is designed to evolve from a single-restaurant solution into a scalable Restaurant SaaS Platform.

Future expansion can support:

Single Restaurant
       ↓
Multi-Branch Restaurant
       ↓
Restaurant Chain
       ↓
Multi-Tenant SaaS Platform

Each restaurant can have its own:

Menu
Tables
Staff
Inventory
Orders
Customers
Analytics

🔐 Security

The system incorporates:

OAuth-based authentication
OTP verification
Role-based authorization
Protected API routes
Environment-based secret management
Secure database access

Sensitive credentials and API keys should be stored using environment variables.

## 🤖 Telegram Restaurant Assistant

DineFlow AI integrates with Telegram to provide a conversational restaurant experience.

Customers can use Telegram to:
- Reserve tables
- Place orders
- Send voice notes
- Receive order confirmations
- Track active orders

### 📱 Telegram Ordering Demo
<img width="720" height="1600" alt="image" src="https://github.com/user-attachments/assets/c699a9a8-4f9f-4e82-b008-3206338790d6" />

# 👨‍🍳 Real-Time Kitchen Display System

All customer orders are instantly pushed to the Kitchen Display System using Socket.IO / WebSockets.

Kitchen staff can manage orders through:

```text
IN QUEUE → PREPARING → READY → DELIVERED

<img width="1600" height="900" alt="image" src="https://github.com/user-attachments/assets/4aecf56e-5e67-4715-a84d-759b01210c83" />

# 3. Inventory Screenshot

Third image — **Chef Dish Inventory & Availability Control** — ise directly:

### `## 📦 Automated Inventory Management`

ke andar lagao.

```markdown
# 📦 Automated Inventory Management

DineFlow AI automatically connects customer orders with inventory.

When the kitchen marks an order as **Ready**, the backend automatically deducts the corresponding quantity from the item's stock.

If stock reaches zero:

```text
stockCount = 0
      ↓
isAvailable = false
      ↓
Item becomes unavailable

<img width="1600" height="900" alt="image" src="https://github.com/user-attachments/assets/93ede34c-7434-4a0d-999d-62be6f113fff" />





