# TerraRush 🎯

### *Walk. Claim. Customize. Conquer Absolutely Nothing.*

## Basic Details

### Team Name: Arakunnam 99

### Team Members

* **Team Lead:** Aswathy Gopinath — Toc H Institute of Science and Technology
* **Member:** Irine Paul — Toc H Institute of Science and Technology

---

## Project Description

**TerraRush** is a real-world virtual game layered directly onto our college campus. Using GPS, students physically walk around the campus to explore, claim territories, and populate them with completely unnecessary virtual objects.

The physical campus becomes a shared digital world where **your real-world movement changes the virtual world**.

---

## The Problem (that doesn't exist)

Students walk around campus every single day and get absolutely nothing in return.

They walk to class.
They walk to the canteen.
They walk to the library.

But where is the **land ownership**?

Where is the **territorial dominance**?

Where is the virtual tree they planted beside their favourite spot?

We decided this was an unacceptable problem.

---

## The Solution (that nobody asked for)

We turned the college campus into a **persistent virtual world**.

Students use their smartphones as a window into this world. GPS tracks their physical movement, and their movement translates into actions inside the virtual campus.

**Walk around an area → Claim it.**

**Claim land → Customize it.**

**Plant a tree → Do absolutely nothing with it.**

**Enter someone else's territory → Become an intruder.**

The more you physically walk, the more useless virtual power you acquire.

### Core Features

* 📍 **Live GPS Tracking** — Your physical location controls your virtual location.
* 🗺️ **Interactive Campus Map** — A digital representation of the real college campus.
* 🏴 **Territory Claiming** — Physically walk around an area to create and claim virtual territory.
* 🌳 **Virtual Objects** — Plant trees, flowers, benches, statues, animals, buildings, and more.
* 👥 **Shared Virtual World** — Every player sees the same campus and everyone else's creations.
* 🚨 **Territory Intrusion** — Get notified when someone enters your territory.
* 🏆 **Achievements** — Earn useless achievements for doing useless things.
* 👑 **Leaderboard** — Compete to become the biggest campus landlord.
* ⚰️ **Virtual Cemetery** — Because even a useless virtual world needs a cemetery.

---

## How It Works

### 1. Open TerraRush

The player opens the app and grants location access.

### 2. Walk Around

The player physically walks around the college campus.

Their GPS coordinates are continuously recorded.

### 3. Create a Loop

The player walks around an area:

```text
        A ───────── B
        │           │
        │           │
        │     🌳    │
        │           │
        D ───────── C
```

The app detects when the player returns close to their starting point.

### 4. Claim Territory

The GPS trail is converted into a polygon.

The player receives:

> 🏆 AREA CLAIMED!
> You now own **327 m² of absolutely useless land.**

### 5. Customize

The owner can place virtual objects inside their territory.

🌳 Trees
🌸 Flowers
🪑 Benches
🗿 Statues
🐈 Animals
🏠 Buildings
🚩 Flags
⚰️ Cemeteries

### 6. Share the World

Other players can open TerraRush and see the same territories and objects.

If another player enters your territory:

> 🚨 **INTRUDER DETECTED**
> Welcome to Aswathy's extremely unnecessary land.

---

# Technical Details

## Technologies/Components Used

### For Software

* **Languages:** JavaScript, HTML, CSS, Python
* **Frontend:** React
* **Backend:** Flask
* **Database:** MongoDB
* **Maps:** Leaflet + OpenStreetMap
* **Location:** Browser Geolocation API
* **Styling:** Tailwind CSS
* **API:** REST API
* **Version Control:** Git + GitHub
* **Deployment:** Vercel / Render

### For Hardware

No additional hardware is required.

The project uses:

* 📱 Smartphone with GPS
* 💻 Laptop
* 🌐 Internet connection

---

# Implementation

## For Software

### Installation

Clone the repository:

```bash
git clone https://github.com/[username]/[repository-name].git
cd [repository-name]
```

Install frontend dependencies:

```bash
cd frontend
npm install
```

Install backend dependencies:

```bash
cd ../backend
pip install -r requirements.txt
```

---

## Environment Variables

Create a `.env` file inside the backend directory:

```env
MONGO_URI=your_mongodb_connection_string
```

---

## Run

Start the backend:

```bash
cd backend
python app.py
```

Start the frontend:

```bash
cd frontend
npm run dev
```

Open the application in your browser and allow location access.

---

# Project Documentation

## System Architecture

```text
                 📱 PLAYER
                    │
                    │ GPS
                    ▼
          ┌───────────────────┐
          │     FRONTEND      │
          │      React        │
          │                   │
          │  Campus Map       │
          │  Player Location  │
          │  Territories      │
          │  Virtual Objects  │
          └─────────┬─────────┘
                    │
                  REST API
                    │
                    ▼
          ┌───────────────────┐
          │      BACKEND      │
          │      Flask        │
          │                   │
          │ GPS Processing    │
          │ Territory Logic   │
          │ Object Management │
          └─────────┬─────────┘
                    │
                    ▼
          ┌───────────────────┐
          │     MongoDB       │
          │                   │
          │ Users             │
          │ Territories       │
          │ Objects           │
          └───────────────────┘
```

---

# GPS → Territory Workflow

```text
Physical movement
       ↓
GPS coordinates collected
       ↓
Coordinates sent to backend
       ↓
Movement path stored
       ↓
Closed loop detected
       ↓
GPS path converted to polygon
       ↓
Territory created
       ↓
Territory stored in database
       ↓
Virtual objects added
       ↓
Shared with other players
```

---

# Screenshots

## 1. Campus Map

![Campus Map](screenshots/campus-map.png)

*The main TerraRush campus map showing the player's real-time location and existing territories.*

## 2. Territory Claiming

![Territory Claim](screenshots/territory-claim.png)

*The player physically walks around an area while TerraRush records the GPS trail.*

## 3. Virtual World

![Virtual World](screenshots/virtual-world.png)

*The shared campus world containing territories and virtual objects created by different players.*

## 4. Territory Customization

![Territory Customization](screenshots/territory-customization.png)

*Players can customize their claimed land using completely unnecessary virtual objects.*

---

# Diagrams

![Workflow](diagrams/workflow.png)

*Workflow showing how physical GPS movement is converted into virtual territory and objects.*

---

# Useless Game Mechanics

Because making something useful would completely defeat the purpose.

### 🌱 Touch Grass

Walk 100 metres.

> **Achievement Unlocked:** Touch Grass.

### 🌳 Professional Tree Planter

Plant your first virtual tree.

> **Achievement Unlocked:** Botanist (Unemployed Edition).

### 🚨 Get Off My Land

Someone enters your territory.

> **INTRUDER DETECTED.**

### 👑 Campus Landlord

Own the largest territory on campus.

### ⚰️ Rest In Peace

Create your first virtual cemetery.

### 🗿 Interior Designer

Place 10 completely useless objects.

### 🐌 Slow Walker

Walk around campus for 10 minutes without claiming anything.

---

# Project Demo

## Video

[Add your demo video link here]

*The demo demonstrates real-time GPS tracking, physical movement, territory creation, virtual object placement, and interaction with the shared virtual campus.*

---

## Demo Flow

1. Open TerraRush.
2. Allow GPS/location access.
3. Show the player's current location.
4. Physically walk around a small campus area.
5. Complete the loop.
6. TerraRush detects the closed loop.
7. The territory is generated.
8. Claim the territory.
9. Plant a virtual tree.
10. Open TerraRush using another user/device.
11. Show the same territory and tree.
12. Walk into another player's territory.
13. Trigger the **INTRUDER DETECTED** notification.

---

# Additional Demos

* 🌍 Shared campus world
* 🏴 Territory ownership
* 🌳 Virtual object placement
* 🏆 Achievement system
* 👑 Territory leaderboard
* 🚨 Intruder detection

---

# Team Contributions

### Aswathy Gopinath — Team Lead

* Project coordination
* Concept development
* Frontend development
* GPS/map integration
* UI/UX
* Hackathon presentation

### Irine Paul — Member

* Project concept and ideation
* UI/UX design
* Frontend development
* Virtual object system
* Testing and documentation

---

# Why Is This Useless?

Because we took something that already works perfectly in the real world...

**and added a virtual version nobody needed.**

You already have a campus.

You can already walk around it.

You can already sit under a tree.

But now...

### You can digitally own the tree. 🌳

**And that's progress.**

---

# Future Possibilities

If we ever decide to make TerraRush slightly less useless:

* 🎮 Multiplayer events
* 🧭 Location-based quests
* 🏆 Campus-wide competitions
* 🧑‍🤝‍🧑 Team territories
* 🏗️ Collaborative building
* 🌎 AR mode
* 📱 Native mobile application
* 🗺️ 3D campus visualization
* 🎒 Campus treasure hunts

But for now...

**we are perfectly happy making students fight over imaginary land.**

---

Made with ❤️ at **TinkerHub Useless Projects**

![Static Badge](https://img.shields.io/badge/TinkerHub-24?color=%23000000\&link=https%3A%2F%2Fwww.tinkerhub.org%2F)

![Static Badge](https://img.shields.io/badge/UselessProjects--26-26?link=https%3A%2F%2Ftinkerhub.org%2Fevents%2F1M8ORET9A1%2Fuseless-projects-3.0)
