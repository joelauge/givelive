flowchart TD

    subgraph UserJourney["Audience User (Mobile)"]
        A1[Scan QR Code] --> A2[Landing Funnel Page]
        A2 --> A3[Submit Phone Number]
        A3 --> A4[Start Journey Flow]
    end

    subgraph Backend["GiveLive Backend (API Server)"]
        API1[/Event API/]
        API2[/Journey Engine/]
        API3[/SMS Engine/]
        API4[/Analytics Collector/]
    end

    subgraph DB["Database (Supabase/Postgres)"]
        DB1[(Events)]
        DB2[(JourneyNodes)]
        DB3[(Users)]
        DB4[(UserProgress)]
        DB5[(Donations)]
    end
    
    subgraph External["External Services"]
        TW[Twilio SMS]
        ST[Stripe Payments]
        S3[(Supabase Storage / S3)]
    end

    A1 --> API1
    A2 --> API1
    A3 --> API1

    API1 --> DB1
    API1 --> DB3

    A4 --> API2
    API2 --> DB2
    API2 --> DB4

    API2 --> TW
    API2 --> ST

    API4 --> DB5
    API4 --> DB4

    API1 --> S3
