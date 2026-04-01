# ParkWaze (Estacionei) - Backup Completo do Projeto
> Salvo em 2026-04-01 antes do reset para Expo Go

---

## 1. Visao Geral

App crowdsourced de estacionamento na rua. Usuarios reportam vagas disponiveis/ocupadas em guias altas. Pipeline de IA valida legalidade via Computer Vision + RAG.

**Nome:** ParkWaze / Estacionei
**Repo:** Estacionei (monorepo: mobile/ + backend/)

---

## 2. Arquitetura

```
[Mobile App] --supabase-js--> [Supabase Cloud]
                                   |
                              DB Webhook (INSERT parking_events)
                                   |
                                   v
                          [FastAPI Microservice] --> [Celery + Redis]
                                   |
                          AI Pipeline (Mapillary -> OpenCV -> RAG -> Decision)
                                   |
                                   v
                          [Supabase] (update event + reputation)
```

- **Mobile fala direto com Supabase** (anon key, RLS enforced) para CRUD, auth, realtime
- **Backend e so AI**: recebe webhook do Supabase no INSERT, roda Celery pipeline, escreve resultado de volta
- **Sem REST API pro mobile**: tudo via Supabase client SDK
- **Realtime**: Supabase Realtime subscription em parking_events
- **Cleanup**: pg_cron no Supabase (nao Celery beat)

---

## 3. Tech Stack

### Mobile (React Native / Expo)
- React Native 0.81, Expo 54
- TypeScript 5.9
- Zustand 5 (state management)
- TanStack Query 5 (server state)
- react-native-maps (MapView)
- NativeWind 5 (Tailwind 4 for RN)
- expo-location (GPS)
- expo-router 6 (file-based routing)
- @supabase/supabase-js (client SDK)

### Backend (Python AI Microservice)
- Python 3.11+
- FastAPI (webhook endpoint only)
- Celery 5.4+ com Redis (task queue)
- Supabase Python SDK (service_role admin client)
- OpenCV (opencv-python-headless) - color heuristics
- LangChain + langchain-openai + langchain-community - RAG
- pgvector - vector similarity search
- Mapillary API v4 - street imagery
- OpenAI gpt-4o-mini - LLM for RAG
- httpx + tenacity - HTTP client with retry

### Database (Supabase Cloud)
- PostgreSQL + PostGIS (spatial queries)
- pgvector (embeddings)
- RLS (Row Level Security)
- Realtime (subscriptions)
- RPCs (SECURITY DEFINER functions)
- pg_cron (cleanup job)

---

## 4. Dev Environment

- Windows 11 25H2
- Node.js + npm para mobile
- Android SDK 36.1.0, emulator: `Medium_Phone_API_36.1` -> device `emulator-5554`
- Run mobile: `cd mobile && npx expo start` (press `a` for Android)
- Run backend: `docker-compose up -d redis` then `cd backend && uvicorn app.main:app --reload`
- Celery: `cd backend && celery -A app.workers.celery_app worker --loglevel=info`
- Supabase: hosted cloud, migrations em `backend/supabase/migrations/`

---

## 5. DB Schema (Supabase)

### Tables

**users**
```sql
CREATE TABLE users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  device_id TEXT UNIQUE NOT NULL,
  reputation_score NUMERIC(5,2) DEFAULT 50.00,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**parking_events**
```sql
CREATE TABLE parking_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) NOT NULL,
  location GEOMETRY(Point, 4326) NOT NULL,
  status parking_status DEFAULT 'OCCUPIED',
  ai_validation_status ai_validation_status DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);
-- Indexes: GIST on location, B-tree on status, B-tree on user_id
```

**allowed_zones**
```sql
CREATE TABLE allowed_zones (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  polygon GEOMETRY(Polygon, 4326) NOT NULL,
  rule_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
-- Index: GIST on polygon
```

**transit_law_chunks** (RAG)
```sql
CREATE TABLE transit_law_chunks (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Enums
```sql
CREATE TYPE parking_status AS ENUM ('OCCUPIED', 'FREED', 'VALIDATING', 'EXPIRED');
CREATE TYPE ai_validation_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
```

### Extensions
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

## 6. RPC Functions (Supabase)

### get_zones_in_radius(p_lat, p_lng, p_radius)
- Mobile chama para carregar mapa
- Retorna parking_events + allowed_zones dentro do raio
- Filtra: OCCUPIED ou FREED recentes (15min)

### park_here(p_device_id, p_lat, p_lng)
- Mobile chama para reportar vaga
- Cria user se nao existe (upsert por device_id)
- Valida: max 1 evento OCCUPIED por usuario
- Retorna o evento criado

### leave_spot(p_device_id, p_event_id)
- Mobile chama quando usuario sai da vaga
- Muda status para FREED, seta updated_at

### get_active_event(p_device_id)
- Mobile chama no init para checar se tem evento ativo
- Retorna o evento OCCUPIED mais recente do device

### get_event_coords(p_event_id)
- Backend chama no pipeline AI
- Extrai lat/lng de GEOMETRY (nao e JSON-friendly)

### insert_allowed_zone(p_polygon_wkt, p_rule_reference)
- Backend chama quando AI cria zona permitida
- Recebe WKT polygon

### cleanup_expired_events()
- pg_cron chama periodicamente
- FREED + updated_at > 15min -> EXPIRED

---

## 7. RLS Policies

```sql
-- Users: public read, insert via RPC
"users_select" ON users FOR SELECT USING (true);
"users_insert" ON users FOR INSERT WITH CHECK (true);

-- Parking Events: public read, write via RPC (SECURITY DEFINER)
"events_select" ON parking_events FOR SELECT USING (true);
"events_insert" ON parking_events FOR INSERT WITH CHECK (true);
"events_update" ON parking_events FOR UPDATE USING (true);

-- Allowed Zones: public read, write only via service_role
"zones_select" ON allowed_zones FOR SELECT USING (true);
"zones_insert" ON allowed_zones FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Transit laws: service_role only
"laws_select" ON transit_law_chunks FOR SELECT USING (auth.role() = 'service_role');
"laws_insert" ON transit_law_chunks FOR INSERT WITH CHECK (auth.role() = 'service_role');
```

---

## 8. Seed Data - Transit Laws (RAG)

```sql
INSERT INTO transit_law_chunks (content, source) VALUES
('É proibido estacionar o veículo: I - nas esquinas e a menos de 5m...', 'CTB Art. 181'),
('Parar o veículo: I - nas pontes e viadutos...', 'CTB Art. 182'),
('Placas R-6a (proibido estacionar), R-6b (regulamentado), R-6c (proibido parar)...', 'Resolução CONTRAN 36/1998'),
('Estacionamento é permitido junto à guia quando: não houver sinalização proibitiva, guia alta, sem hidrante/ponto/faixa...', 'Resolução CONTRAN 160/2004'),
('Estacionar em desacordo: infração média, 4 pontos. Em local proibido: infração grave, 5 pontos.', 'CTB Art. 252'),
('Faixa amarela = proibido estacionar. Faixa vermelha = proibido parar. Sem sinalização + guia alta = permitido.', 'Resolução CONTRAN 302/2008'),
('Horários: "Seg-Sex 08-18h" = fora do horário permitido. Sem horário = proibição permanente.', 'CTB Art. 181 - Horários');
```

---

## 9. AI Pipeline (detalhado)

### Fluxo
1. Supabase webhook dispara no INSERT -> FastAPI `POST /webhook/parking-created`
2. Webhook valida Bearer token, extrai event_id
3. Celery task `validate_parking_spot` e enfileirada
4. Task busca evento no Supabase + coords via RPC
5. **Street Imagery**: Mapillary API v4 (bbox search narrow 111m, fallback 555m)
6. **Se sem imagem**: auto-aprova com confidence 0.2
7. **Vision**: OpenCV color heuristics (HSV)
   - Lower 1/3 da imagem = curb region
   - Upper 2/3 = signs, buildings, hydrants
   - Yellow curb > 5% = pintada (proibido)
   - Red > 2% upper = possivel placa/hidrante
   - Red > 3% lower = hidrante no chao
   - Blue > 1% upper = placa regulamentar
   - Gray > 30% lower = guia de concreto (alta)
8. **RAG** (so se placa detectada + OpenAI key presente):
   - LangChain RetrievalQA + PGVector + gpt-4o-mini
   - Prompt estruturado: PERMITIDO/ARTIGO/EXPLICACAO
9. **Decision Engine** (prioridade):
   - Hidrante -> rejeita (CTB 181 V)
   - Guia rebaixada/garagem -> rejeita (CTB 181 III)
   - Ponto de onibus -> rejeita (CTB 181 VI)
   - Placa + RAG confirma restricao -> rejeita
   - Placa + RAG diz permitido (fora do horario) -> aprova
   - Guia alta sem restricoes -> aprova
   - Fallback inconclusivo -> aprova com baixa confianca
10. Update parking_event (APPROVED/REJECTED) + reputation (+3/-5)
11. Se aprovado com confianca > 0.7 e guia alta: cria AllowedZone (retangulo ~25m)

### Fail-open
- Se pipeline crasha apos max_retries (3): aprova com confidence 0.1

---

## 10. Backend Code (completo)

### backend/app/core/config.py
```python
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)
    supabase_url: str = ""
    supabase_service_key: str = ""
    supabase_db_url: str = ""  # Direct PG for RAG/pgvector
    webhook_secret: str = ""
    mapillary_client_token: str = ""
    openai_api_key: str = ""
    redis_url: str = "redis://localhost:6379/0"

settings = Settings()
```

### backend/app/core/supabase_client.py
```python
from supabase import Client, create_client
from supabase.lib.client_options import ClientOptions
from app.core.config import settings

_client: Client | None = None

def get_supabase() -> Client:
    global _client
    if _client is None:
        _client = create_client(
            settings.supabase_url,
            settings.supabase_service_key,
            options=ClientOptions(auto_refresh_token=False, persist_session=False),
        )
    return _client
```

### backend/app/main.py
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.webhook import router as webhook_router
from app.core.config import settings
from app.core.supabase_client import get_supabase

def create_app() -> FastAPI:
    app = FastAPI(title="ParkWaze AI Service", version="0.2.0")
    app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
    app.include_router(webhook_router)

    @app.get("/")
    async def health_check() -> dict:
        status = {"service": "parkwaze-ai"}
        # checks Supabase + Redis connectivity
        ...
        return status

    return app

app = create_app()
```

### backend/app/api/webhook.py
```python
from fastapi import APIRouter, Header, HTTPException
from app.core.config import settings

router = APIRouter(prefix="/webhook", tags=["webhook"])

@router.post("/parking-created")
async def on_parking_created(payload: dict, authorization: str = Header(None)) -> dict:
    expected = f"Bearer {settings.webhook_secret}"
    if not authorization or authorization != expected:
        raise HTTPException(status_code=401, detail="Unauthorized")
    record = payload.get("record", {})
    event_id = record.get("id")
    if not event_id:
        raise HTTPException(status_code=400, detail="Missing event id")
    from app.workers.tasks import validate_parking_spot
    validate_parking_spot.delay(event_id)
    return {"status": "queued", "event_id": event_id}
```

### backend/app/workers/celery_app.py
```python
from celery import Celery
from app.core.config import settings

celery_app = Celery("parkwaze", broker=settings.redis_url, backend=settings.redis_url)
celery_app.conf.update(task_serializer="json", accept_content=["json"], result_serializer="json", timezone="UTC", enable_utc=True)
celery_app.autodiscover_tasks(["app.workers"])
```

### backend/app/workers/tasks.py
Pipeline completo com 6 steps - ver arquivo original.

### backend/app/services/vision.py
VisionService com OpenCV HSV color heuristics - ver arquivo original.

### backend/app/services/rag.py
RAGService com LangChain + PGVector + gpt-4o-mini - ver arquivo original.

### backend/app/services/decision.py
DecisionService com regras de prioridade - ver arquivo original.

### backend/app/services/street_imagery.py
StreetImageryService com Mapillary API v4 - ver arquivo original.

### backend/app/services/reputation.py
ReputationService com Supabase admin client - ver arquivo original.

### backend/app/services/transit_laws.py
TRANSIT_LAWS array com 7 documentos CTB/CONTRAN.

---

## 11. Env Vars

### Backend (.env)
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
SUPABASE_DB_URL=postgresql://postgres:password@db.xxxx.supabase.co:5432/postgres
WEBHOOK_SECRET=gerar-um-secret-aqui
MAPILLARY_CLIENT_TOKEN=your-token-here
OPENAI_API_KEY=your-key-here
REDIS_URL=redis://localhost:6379/0
```

### Mobile (.env)
```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 12. Docker Compose
```yaml
services:
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
  api:
    build: ./backend
    ports: ["8000:8000"]
    env_file: [./backend/.env]
    depends_on: [redis]
  celery-worker:
    build: ./backend
    command: celery -A app.workers.celery_app worker --loglevel=info
    env_file: [./backend/.env]
    depends_on: [redis]
```

---

## 13. Requirements (backend/requirements.txt)
```
fastapi>=0.111.0
uvicorn[standard]>=0.30.0
pydantic-settings>=2.3.0
python-dotenv>=1.0.0
celery[redis]>=5.4.0
redis>=5.0.0
supabase>=2.0.0
httpx>=0.27.0
tenacity>=8.2.0
opencv-python-headless>=4.9.0
numpy>=1.26.0
pillow>=10.3.0
shapely>=2.0.0
langchain>=0.2.0
langchain-community>=0.2.0
langchain-openai>=0.1.0
openai>=1.30.0
pgvector>=0.3.0
```

---

## 14. Mobile (estrutura anterior - Expo/RN)

### Estrutura de arquivos
```
mobile/
  app/                    # Expo Router pages
    (tabs)/
      map.tsx             # Tela principal do mapa
      profile.tsx         # Perfil do usuario
    onboarding.tsx        # Onboarding
    _layout.tsx           # Root layout
  src/
    lib/supabase.ts       # Supabase client init
    hooks/
      use-parking.ts      # TanStack Query hooks (park, leave, zones)
      use-realtime.ts     # Supabase Realtime subscription
    stores/
      parking-store.ts    # Zustand (activeEvent, isMonitoring)
      device-store.ts     # Device ID persistence
    services/
      location.ts         # Reverse geocode, speed calc
    types/models.ts       # TypeScript interfaces
    constants/config.ts   # Colors, map config
```

### Key patterns
- Supabase client com anon key (`EXPO_PUBLIC_SUPABASE_ANON_KEY`)
- RPCs via `supabase.rpc('park_here', {...})`, `supabase.rpc('leave_spot', {...})`
- TanStack Query para cache + refetch
- Zustand para estado local (evento ativo, monitoring)
- Realtime subscription no canal `parking_events`
- NativeWind 5 (Tailwind 4) para estilizacao
- expo-location para GPS

---

## 15. Regras de Dev
- pt-BR para conversacao e UI
- English para codigo (variaveis, funcoes, git)
- Build um modulo por vez
- Propor estrutura de diretorios antes de escrever codigo
- Um componente por resposta (nao misturar mobile + backend)

---

## 16. Issues Conhecidas
- backend/.env pode ter chaves reais - nunca commitar
- CORS `allow_origins=["*"]` no dev - fechar pra prod
- Backend nao foi testado rodando (precisa Supabase project + Redis)
- Plano Supabase Pro precisa pra pg_cron
