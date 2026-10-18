# Agent Swarm Architecture — Mermaid Diagrams

## 1. Data Flow: End-to-End (từ Zalo Group → Dashboard)

```mermaid
graph TB
    subgraph "Tầng 1 — Thu thập (Mac Studio)"
        ZG1[Zalo Group A<br/>BĐS Hà Nội]
        ZG2[Zalo Group B<br/>Chung cư SG]
        ZG3[Zalo Group C<br/>Môi giới MB]
        ZG4[Zalo Group N<br/>...]

        ZG1 --> OA1
        ZG2 --> OA1
        ZG3 --> OA2
        ZG4 --> OA2

        subgraph "OpenClaw Gateway"
            OA1[Agent #1<br/>Zalo cá nhân]
            OA2[Agent #2<br/>Zalo claw bot]
        end

        OA1 -->|"raw message"| LLM[Qwen 27B<br/>Local LLM<br/>:11434]
        OA2 -->|"raw message"| LLM

        LLM -->|"extract JSON<br/>{type, price, area,<br/>phường, bedrooms}"| API[Collector API<br/>:9210<br/>POST /agent-report]
    end

    subgraph "Tầng 2 — Xử lý (Mac Studio local)"
        API -->|"validate"| STG[stg_zalo_posts<br/>staging]
        STG -->|"transform-zalo<br/>parse + dedup"| OFFERS[sale_offers<br/>rent_lt_offers]
        OFFERS -->|"500_asset_stats"| STATS[market_asset_stats<br/>median + yield]
        STR[STR Data<br/>Airbnb + AirDNA] --> METRICS[market_metrics]
        STATS --> DASH_DATA[Dashboard Data]
        METRICS --> DASH_DATA
    end

    subgraph "Tầng 3 — Hiển thị (Cloud)"
        DASH_DATA -->|"sync 15 min"| SUPA[Supabase<br/>Cloud Postgres]
        SUPA --> VERCEL[Vercel<br/>Next.js Dashboard]
        VERCEL --> USER[👤 User<br/>admin]
        VERCEL -->|"read-only<br/>(optional)"| TEAM[👥 Teammates]
    end
```

## 2. Agent Detail: OpenClaw Skill Pipeline

```mermaid
graph LR
    subgraph "OpenClaw Agent on Mac Studio"
        HEART[Heartbeat<br/>30 seconds] --> READ[Read new<br/>group messages]
        READ --> FILTER{Is BĐS<br/>listing?}
        FILTER -->|"No (chat/social)"| SKIP[Skip<br/>return null]
        FILTER -->|"Yes"| EXTRACT[Extract fields:<br/>type, price, area,<br/>phường, bedrooms, phone]
        EXTRACT --> POST[POST JSON to<br/>localhost:9210<br/>/api/agent-report]
    end

    subgraph "Local LLM"
        OLLAMA[Ollama<br/>Qwen 27B<br/>4-bit quantized]
        EXTRACT -.->|"prompt"| OLLAMA
        OLLAMA -.->|"structured output"| EXTRACT
    end

    subgraph "Collector API"
        AUTH[API Key check]
        VALIDATE[Validate JSON<br/>schema]
        INSERT[Insert to<br/>stg_zalo_posts]
        POST --> AUTH --> VALIDATE --> INSERT
    end
```

## 3. Deployment Topology

```mermaid
graph TB
    subgraph "User's Home Network"
        subgraph "Mac Studio (always on, public IP)"
            OC[OpenClaw Gateway<br/>:18789]
            OLM[Ollama + Qwen 27B<br/>:11434]
            API[Collector API<br/>:9210]
            PG[(PostgreSQL<br/>+ PostGIS<br/>:5433)]
            SYNC[Sync Job<br/>cron 15 min]
        end

        subgraph "MacBook Pro M5 Max"
            DEV[Dev Machine<br/>ZCode + AI dev<br/>Deploy scripts]
        end
    end

    subgraph "Cloud"
        SUPA[(Supabase<br/>Cloud Postgres)]
        VERCEL[Vercel<br/>Next.js App]
        CF[Cloudflare<br/>DNS + Tunnel<br/>optional]
    end

    OC -->|"monitor groups"| ZALO[Zalo Cloud]
    OC -->|extract| OLM
    OC -->|POST| API
    API --> PG
    PG --> SYNC
    SYNC -->|push| SUPA
    SUPA --> VERCEL
    DEV -->|git push| VERCEL
    CF -.->|"tunnel to :9210"| API
```

## 4. Multi-Agent Scaling (thêm teammate agents)

```mermaid
graph TB
    subgraph "Mac Studio — One Gateway, Many Agents"
        GA[OpenClaw Gateway<br/>:18789]

        subgraph "Agent Pool"
            A1[Agent #1<br/>Zalo account chính<br/>20 groups]
            A2[Agent #2<br/>Zalo claw bot<br/>15 groups]
            A3[Agent #3<br/>Zalo backup<br/>15 groups]
            AN[Agent #N<br/>...]
        end

        GA --> A1
        GA --> A2
        GA --> A3
        GA --> AN
    end

    A1 -->|"extract"| QW[Qwen 27B<br/>shared LLM]
    A2 --> QW
    A3 --> QW
    AN --> QW

    QW --> CA[Collector API<br/>localhost:9210]

    CA -->|"agent_id: agent-1<br/>group: BĐS HN"| DB[(PostgreSQL)]
    CA -->|"agent_id: agent-2<br/>group: CC SG"| DB
    CA -->|"agent_id: agent-N"| DB

    DB --> SYNC[Sync → Supabase]
    SYNC --> VERC[Vercel Dashboard<br/>one-invest.vercel.app]
```

## 5. Sharing Model (ai thấy gì)

```mermaid
graph TB
    subgraph "Data Ownership"
        ALL[All Data<br/>user controls]
        ALL --> FULL[Full Dashboard<br/>yield, AirDNA, all phường]
        ALL --> LIMITED[Limited View<br/>phường-level, no AirDNA]
    end

    subgraph "Access Control"
        ADMIN[👤 User = Admin<br/>sees everything]
        BROKER[👥 Teammate = Read-only<br/>sees phường insights<br/>no raw data, no AirDNA]
        PUBLIC[🌐 Public = Landing<br/>market-level only<br/>no detail]
    end

    FULL --> ADMIN
    LIMITED --> BROKER
    PUBLIC --> PUBLIC_PAGE[Public landing<br/>market overview]
```

## 6. Security Model (đơn giản theo yêu cầu)

```mermaid
graph LR
    subgraph "Trust Boundaries"
        LOCAL[Localhost only<br/>agents + API + DB<br/>same machine]
        CLOUD[Cloud<br/>Supabase + Vercel<br/>public internet]
    end

    subgraph "Local (Mac Studio)"
        AGENT[OpenClaw<br/>agents] -->|API key<br/>one-invest-agent-{id}| API[Collector API]
        API -->|localhost only| DB[(PostgreSQL)]
    end

    subgraph "Cloud"
        SYNC[Sync job] -->|SUPABASE_URL<br/>service_role key| SUPA[(Supabase)]
        VERCEL[Vercel App] -->|anon key<br/>+ RLS policies| SUPA
        USER_B[User login] --> VERCEL
    end

    LOCAL -->|"sync job pushes<br/>(outbound only)"| CLOUD
```
