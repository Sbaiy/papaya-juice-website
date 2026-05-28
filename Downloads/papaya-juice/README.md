# 🍹 Papaya Juice — Full Stack Project

> Restaurant management system — Mohammedia, Morocco

---

## 📁 Structure du projet

```
papaya-juice/
├── backend/                  ← Node.js + Express + Supabase
│   ├── server.js             ← Point d'entrée du serveur
│   ├── package.json
│   ├── .env.example          ← Copier en .env et remplir
│   ├── middleware/
│   │   └── auth.js           ← JWT middleware
│   └── routes/
│       ├── auth.js           ← POST /api/auth/login
│       ├── menu.js           ← CRUD produits & catégories
│       ├── orders.js         ← CRUD commandes + stats
│       └── personnel.js      ← CRUD personnel
│
└── frontend/                 ← Pages HTML
    ├── api.js                ← Helper — appels vers backend
    ├── index.html            ← Page d'accueil (public)
    ├── menu.html             ← Menu client + panier
    ├── dashboard.html        ← Tableau de bord admin
    ├── admin.html            ← Gestion menu (CRUD)
    ├── commandes-live.html   ← Commandes en temps réel
    └── personnel.html        ← Gestion du personnel
```

---

## 🚀 Démarrage rapide

### 1. Backend

```bash
cd backend

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# → Ouvrir .env et remplir SUPABASE_URL, SUPABASE_KEY, JWT_SECRET

# Démarrer le serveur
npm start          # production
npm run dev        # développement (avec nodemon — rechargement auto)
```

Le serveur démarre sur **http://localhost:3000**

### 2. Frontend

Ouvrir les fichiers HTML directement dans le navigateur,  
ou utiliser **Live Server** (VS Code) sur le dossier `frontend/`.

---

## ⚙️ Configuration (.env)

```env
# Supabase — copier depuis supabase.co > Project Settings > API
SUPABASE_URL=https://rlwshuurruvtnqwgbjkl.supabase.co
SUPABASE_KEY=your_anon_key_here

# JWT — choisir un secret fort (min 32 caractères)
JWT_SECRET=papaya_juice_super_secret_2026_change_me

# Admin par défaut
ADMIN_USER=sbaiy
ADMIN_PASS=2030

# URL du frontend (pour CORS)
PORT=3000
FRONTEND_URL=http://127.0.0.1:5500
```

---

## 🔌 API Endpoints

### Auth
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/login` | Connexion — retourne JWT |
| GET | `/api/auth/me` | Infos utilisateur connecté |

### Menu
| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/menu/products` | ❌ | Liste des produits |
| GET | `/api/menu/products/:id` | ❌ | Détail d'un produit |
| POST | `/api/menu/products` | ✅ | Ajouter un produit |
| PUT | `/api/menu/products/:id` | ✅ | Modifier un produit |
| PUT | `/api/menu/products/reorder` | ✅ | Réordonner |
| DELETE | `/api/menu/products/:id` | ✅ | Supprimer |
| GET | `/api/menu/categories` | ❌ | Liste des catégories |

### Commandes
| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/orders` | ✅ | Liste commandes |
| GET | `/api/orders/stats` | ✅ | Statistiques dashboard |
| GET | `/api/orders/:id` | ✅ | Détail commande |
| POST | `/api/orders` | ❌ | Nouvelle commande (client) |
| PUT | `/api/orders/:id/status` | ✅ | Changer le statut |
| DELETE | `/api/orders/:id` | ✅ | Supprimer |

### Personnel
| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/personnel` | ✅ | Liste du personnel |
| POST | `/api/personnel` | ✅ | Ajouter un employé |
| PUT | `/api/personnel/:id` | ✅ | Modifier |
| DELETE | `/api/personnel/:id` | ✅ | Supprimer |

---

## 🛠️ Tables Supabase requises

```sql
-- Products
create table products (
  id          serial primary key,
  title       text not null,
  description text default '-',
  price       numeric not null,
  category    text,
  image       text,
  disponible  boolean default true,
  sort_order  integer default 0,
  created_at  timestamptz default now()
);

-- Orders
create table orders (
  id           serial primary key,
  items        jsonb not null,
  table_number text,
  total        numeric default 0,
  note         text,
  status       text default 'pending',
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Personnel
create table personnel (
  id         serial primary key,
  name       text not null,
  role       text not null,
  email      text unique,
  password   text not null,
  active     boolean default true,
  created_at timestamptz default now()
);
```

---

## 📱 Frontend — `api.js`

Toutes les pages frontend utilisent `api.js` comme couche d'abstraction :

```javascript
// Login
const { token, user } = await API.auth.login('sbaiy', '2030');

// Récupérer le menu
const products = await API.menu.getAll();
const juices   = await API.menu.getAll('juice');

// Créer une commande
await API.orders.create({ items: cart, total: 150 });

// Dashboard stats
const stats = await API.orders.getStats();
```

---

*© 2026 Papaya Juice — Mohammedia, Morocco*
