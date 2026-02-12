# 🇮🇹 Sèche Tracker — Objectif Italie

Ton app gamifiée pour ta sèche de 30 jours. Paris → Rome !

---

## 🚀 COMMENT METTRE EN LIGNE (5 minutes)

### Étape 1 — Installer les outils (une seule fois)

Tu as besoin de **Node.js** sur ton ordi. Si c'est pas fait :

👉 Va sur https://nodejs.org et télécharge la version LTS
👉 Installe-le (Next, Next, Next...)

Vérifie que ça marche en ouvrant un terminal :
```bash
node --version    # doit afficher v18+ ou v20+
npm --version     # doit afficher 9+ ou 10+
```

---

### Étape 2 — Tester en local

Ouvre un terminal dans le dossier du projet :

```bash
cd seche-tracker
npm install
npm run dev
```

Ça va te donner une URL genre `http://localhost:5173` — ouvre-la dans ton navigateur pour tester !

---

### Étape 3 — Créer un compte GitHub (gratuit)

1. Va sur https://github.com
2. Crée un compte (ou connecte-toi)
3. Clique sur **"New repository"** (le bouton vert +)
4. Nom : `seche-tracker`
5. Laisse en **Public**
6. Clique **Create repository**

---

### Étape 4 — Envoyer le code sur GitHub

Dans ton terminal :

```bash
cd seche-tracker
git init
git add .
git commit -m "Mon tracker de sèche 🇮🇹"
git branch -M main
git remote add origin https://github.com/TON-USERNAME/seche-tracker.git
git push -u origin main
```

> ⚠️ Remplace `TON-USERNAME` par ton nom GitHub

---

### Étape 5 — Déployer sur Vercel (GRATUIT, 2 min)

1. Va sur https://vercel.com
2. Clique **"Sign Up"** → connecte-toi avec GitHub
3. Clique **"Add New Project"**
4. Sélectionne ton repo `seche-tracker`
5. Framework : **Vite** (normalement détecté auto)
6. Clique **Deploy**

⏱️ Attends 1-2 minutes...

✅ **C'EST EN LIGNE !** Tu auras une URL genre :
```
https://seche-tracker.vercel.app
```

---

### Étape 6 — Installer sur ton téléphone 📱

#### Sur iPhone :
1. Ouvre l'URL dans **Safari**
2. Tape le bouton **Partager** (carré avec flèche vers le haut)
3. Tape **"Sur l'écran d'accueil"**
4. Tape **Ajouter**

#### Sur Android :
1. Ouvre l'URL dans **Chrome**
2. Tape les **3 points** en haut à droite
3. Tape **"Ajouter à l'écran d'accueil"**
4. Tape **Ajouter**

🎉 **L'app apparaît sur ton écran d'accueil comme une vraie app !**
- Pas de barre de navigateur
- Fonctionne hors-ligne
- Écran complet

---

## 🎨 PERSONNALISER

### Changer le titre du voyage
Dans `src/App.jsx`, cherche `Rome avec ma copine` et remplace par ce que tu veux.

### Changer les dates
En haut du fichier `src/App.jsx` :
```js
const START_DATE = "2026-02-17";  // Date de début
const TOTAL_DAYS = 30;             // Nombre de jours
```

### Changer les habitudes / repas / suppléments
Cherche les tableaux `HABITS`, `MEALS`, `SUPPS` dans `src/App.jsx` et modifie :
```js
{ id: "mon_truc", label: "Mon habitude", emoji: "🎯", xp: 15 },
```

### Changer les cadeaux
Cherche `WEEKLY_REWARDS` et `ACHIEVEMENT_REWARDS` :
```js
{ week: 1, emoji: "🍦", title: "Mon cadeau", desc: "Ma description", category: "food" },
```

### Changer les villes du trajet
Cherche `CITIES` et modifie les noms/paliers XP.

### Changer les couleurs
Les couleurs principales :
- `#e94560` = rouge accent
- `#0a0a1a` = fond noir
- `#ffeb3b` = jaune or
- `#4caf50` = vert succès

---

## 📁 Structure du projet

```
seche-tracker/
├── public/
│   ├── icon-192.png      ← Icône app (petite)
│   ├── icon-512.png      ← Icône app (grande)
│   └── icon.svg          ← Icône source
├── src/
│   ├── App.jsx           ← TOUTE l'app est ici
│   └── main.jsx          ← Point d'entrée
├── index.html            ← Page HTML
├── package.json          ← Dépendances
├── vite.config.js        ← Config + PWA
└── README.md             ← Ce fichier
```

---

## 🔄 Mettre à jour l'app

Après avoir modifié un fichier :

```bash
git add .
git commit -m "Mise à jour"
git push
```

Vercel redéploie automatiquement en 30 secondes ! 🚀

---

## ❓ Problèmes courants

**"npm install ne marche pas"**
→ Vérifie que Node.js est bien installé (`node --version`)

**"git push me demande un mot de passe"**
→ GitHub utilise maintenant des tokens. Va dans Settings → Developer settings → Personal access tokens → Generate new token

**"L'app ne s'installe pas sur iPhone"**
→ Il FAUT utiliser Safari (pas Chrome sur iPhone)

**"Mes données ont disparu"**
→ Les données sont stockées dans le navigateur (localStorage). Si tu vides le cache, elles sont perdues. Utilise toujours le même navigateur.

---

Bon courage pour la sèche, et profite bien de l'Italie ! 🇮🇹✈️
