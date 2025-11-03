# Cube Evolution

Un jeu navigateur minimaliste où les joueurs interagissent avec un cube pour le faire évoluer.

## Architecture

- **Frontend**: Nginx + HTML/CSS/JavaScript + Three.js
- **Backend**: Node.js + Express + Socket.io
- **Base de données**: MongoDB

## Prérequis

- Docker
- Docker Compose

## Installation et Déploiement

1. Clonez le repository ou naviguez vers le répertoire du projet

2. Lancez l'application avec Docker Compose:
```bash
docker compose up -d
```

3. Accédez à l'application:
   - Ouvrez votre navigateur à l'adresse: `http://localhost`
   - Backend API (direct): `http://localhost:3010`

## Arrêter l'application

```bash
docker compose down
```

## Fonctionnalités

### Débloquables par nombre de clics:

- **100 clics**: Nommer le cube
- **200 clics**: Changer la couleur du cube
- **500 clics**: Remplissage du cube (opacité complète)
- **1000 clics**: Passage en 3D

## Structure du Projet

```
Cube/
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   ├── cube.js
│   ├── nginx.conf
│   └── Dockerfile
├── backend/
│   ├── app.js
│   ├── package.json
│   └── Dockerfile
├── db_data/           (créé automatiquement)
├── docker-compose.yml
└── README.md
```

## Accès depuis Internet

Pour exposer votre jeu sur Internet, vous pouvez utiliser ngrok:

```bash
ngrok http 80
```

Ngrok générera une URL publique (ex: `https://xxxx.ngrok.io`) que vous pourrez partager.

## API Endpoints

- `POST /api/cube` - Créer un nouveau cube
- `GET /api/cube/:id` - Récupérer l'état d'un cube
- `GET /api/cubes` - Récupérer tous les cubes (top 10)
- `GET /health` - Health check

## WebSocket Events

### Client → Server
- `joinCube` - Rejoindre un cube
- `clickCube` - Cliquer sur le cube
- `updateCubeName` - Mettre à jour le nom du cube
- `updateCubeColor` - Mettre à jour la couleur du cube

### Server → Client
- `cubeState` - État actuel du cube
- `userJoined` - Un utilisateur a rejoint le cube
- `error` - Message d'erreur

## Maintenance

### Voir les logs
```bash
docker compose logs -f
```

### Voir les logs d'un service spécifique
```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db
```

### Reconstruire les images
```bash
docker compose up -d --build
```

### Nettoyer les données
```bash
docker compose down -v
```

## Développement

Pour développer localement sans Docker:

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
Servez les fichiers avec un serveur HTTP de votre choix.

## Licence

Ce projet est sous licence libre.
