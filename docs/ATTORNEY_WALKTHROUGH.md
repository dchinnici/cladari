# Cladari — Self-Guided Tour

## What You're Looking At

Cladari is a plant breeding management platform built for serious collectors and breeders of high-value Anthurium species. Think of it as a combination of a medical records system, a genealogy tracker, and a breeding program manager — but for plants.

This demo account contains real data from an active breeding program (~75 plants, valued at ~$15K collectively). Everything you see — care histories, photos, breeding records — represents the kind of data a real user generates over months of daily use.

---

## Login

- **URL:** https://www.cladari.co/login
- **Email:** *(provided separately)*
- **Password:** *(provided separately)*

After logging in, you'll land on the **Dashboard**.

---

## Quick Tour: Follow One Plant Through the System

### Step 1: Open the Plants Page

Tap **Plants** in the navigation. You'll see a grid of ~75 plants with photos, names, and care status indicators. Each card shows:

- **Plant photo** (cover image from a collection of dated photos)
- **Name** (hybrid name or species)
- **Plant ID** (unique identifier, e.g., ANT-2025-0039)
- **Last care activity** with color-coded urgency (green = recent, yellow = due, red = overdue)
- **Location** if assigned

### Step 2: Open "Magnificum" (ANT-2025-0039)

This is one of the most data-rich entries — a Colombian *Anthurium magnificum* with months of documented care. Search for "Magnificum" or scroll to find it. Tapping opens the full plant record with multiple tabs:

#### Overview Tab
- **Identity:** Plant ID, species, hybrid name, breeder, section (taxonomic group)
- **Status:** Health status, current pot size, last repot date, acquisition cost, market value
- **Location:** Which grow space the plant lives in
- **Quick Actions:** Buttons to log care (watering/fertilizing), record a flowering event, add a note, or upload a photo

#### Journal Tab
- **Unified timeline** of all interactions with this plant — care logs, notes, photos, AI consultations
- **Care logs** include input/output EC (electrical conductivity) and pH measurements, tracking the water/fertilizer chemistry over time. Input readings show what went into the pot; output readings show what came out in the runoff — this is how breeders monitor substrate health.
- **Filters** to view just care events, just notes, just photos, etc.
- This plant has **21 care logs** (17 with full input/output chemistry), **3 morphometric measurements**, and **7 journal entries**

#### Photos Tab
- **21 dated photos** documenting the plant's visual history over time
- Photos are timestamped and can be classified by type (whole plant, leaf detail, roots, etc.)
- Any photo can be set as the **cover photo** for the plant card

#### Traits Tab
- **23 recorded phenotypic traits** — velvety texture, silver venation patterns, leaf shape characteristics
- Each trait has an expression score (how strongly the trait presents)
- This is the data that informs breeding selection decisions

#### Flowering Tab
- **1 recorded flowering cycle** with dates for each stage: spathe emergence, female phase, male phase, spathe close
- Tracks whether pollen was collected and stored (critical for breeding)
- This plant's pollen was collected and stored at 4°C for future crosses
- This is the reproductive data that drives the breeding pipeline

#### Genetics Tab
- **Provenance** tracking (this specimen is from Colombia)
- **Breeding value** score — a numeric assessment of the plant's worth in the breeding program
- **Ploidy** — chromosome count (2n = diploid, standard for the species)

#### Lineage Tab
- Shows parent-offspring relationships (female parent, male parent)
- Links to the breeding record (cross) that produced this plant
- Clone relationships for vegetatively propagated plants

### Step 3: Try the AI Assistant

From any plant's page, tap the **chat icon** to open the AI assistant. The AI has access to:
- The plant's full care history (EC/pH trends, watering frequency)
- All photos (it can analyze leaf health, pest damage, growth patterns)
- Environmental data from connected sensors (temperature, humidity, VPD)
- Breeding and lineage information

Try asking: *"How is this plant doing?"* or *"Analyze the EC/pH trend — is the substrate building up salts?"*

The AI will pull from the Magnificum's 21 care logs, 21 photos, trait observations, and environmental sensor data to give a data-grounded response.

### Step 4: Check the Breeding Page

Tap **Breed** in the navigation. This shows the breeding pipeline:

- **4 documented crosses** (controlled pollination events between specific parent plants)
- Each cross tracks: parent plants, pollination method, target traits, harvest dates
- **Harvests → Seed Batches → Seedlings → Graduated Plants**: The full pipeline from pollination to independent plant records
- Cross categories: intraspecific (same section), intersectional (different sections — harder, more novel)

### Step 5: Explore Locations

Tap **Locations** to see grow spaces. Each location can have:
- Environmental sensor data (temperature, humidity, VPD) from connected SensorPush devices
- List of plants currently in that space
- Light level, zone, and other environmental parameters

---

## Data Types Collected

For your reference in drafting the data use agreement, here is a comprehensive list of data types the platform collects and stores:

### User Account Data
| Data Type | Description | Source |
|-----------|-------------|--------|
| Email address | Login credential | User-provided (Google OAuth or email/password) |
| Display name | Profile name | User-provided |
| Authentication tokens | Session management | Supabase Auth (Google OAuth or email/password) |
| Timezone | For date display | User-provided in settings |
| City/region | Optional, for weather data | User-provided in settings |

### Plant Records
| Data Type | Description | Source |
|-----------|-------------|--------|
| Plant identity | ID, species, hybrid name, section, generation | User-provided |
| Provenance | Breeder name/code, vendor, acquisition cost | User-provided |
| Health status | Current condition assessment | User-provided |
| Care history | Watering/fertilizing logs with EC/pH chemistry data | User-provided per event |
| Photos | Dated, classified plant images (stored in cloud) | User-uploaded |
| Measurements | Leaf dimensions, petiole length, vigor scores | User-provided |
| Trait observations | Phenotypic traits (velvety, crystalline, etc.) with expression scores | User-provided |
| Growth metrics | Leaf count, growth rate, health indicators over time | User-provided |
| Notes/journal entries | Free-text observations | User-provided |
| Market value | Estimated or actual dollar value | User-provided |
| Location assignment | Which grow space the plant is in | User-provided |

### Breeding & Genetics
| Data Type | Description | Source |
|-----------|-------------|--------|
| Breeding records | Cross details: parents, date, method, target traits | User-provided |
| Harvest data | Berry/seed counts, viability assessments | User-provided |
| Seed batch tracking | Germination substrate, conditions, emergence dates | User-provided |
| Seedling records | Individual seedling health, selection status | User-provided |
| Lineage relationships | Parent-offspring links, clone source tracking | User-provided / system-derived |
| Genetic markers | RA codes, provenance, breeding value scores | User-provided |

### Environmental Data
| Data Type | Description | Source |
|-----------|-------------|--------|
| Temperature | Grow space temperature readings | SensorPush API (automated) |
| Humidity | Relative humidity readings | SensorPush API (automated) |
| VPD | Vapor pressure deficit (calculated) | SensorPush API (automated) |
| Weather data | Outdoor conditions (temperature, rain) | Open-Meteo API (automated, based on user city) |

### AI Interactions
| Data Type | Description | Source |
|-----------|-------------|--------|
| Chat conversations | Questions asked and AI responses about plants | User-initiated, AI-generated |
| Photo analysis | AI interpretation of plant photos | System-generated from user photos |
| Quality scores | User ratings of AI response quality (0-4 scale) | User-provided |

### System / Technical
| Data Type | Description | Source |
|-----------|-------------|--------|
| QR code scans | Quick-access events for plant/location tags | System-generated on scan |
| Print jobs | Label generation for plant tags | User-initiated |

---

## Key Points for the Data Agreement

1. **All plant data is user-generated.** The system does not scrape or infer data from external sources about the user. Environmental sensor data and weather data are the only automated inputs, both opt-in.

2. **Photos are stored in Supabase Storage** (cloud hosting by Supabase/AWS). They are access-controlled per user — no public URLs without authentication.

3. **AI conversations are processed through Anthropic's Claude API.** Plant data (care logs, photos) is sent to the API for analysis. Anthropic's data retention policies apply to these API calls.

4. **Financial data** (acquisition cost, market value) is optionally entered by users for their own portfolio tracking. It is not shared externally.

5. **No social features.** There is no user-to-user communication, no public profiles, no shared collections. Each user's data is fully isolated.

6. **Multi-tenant architecture.** Each user sees only their own data. Database queries are filtered by authenticated user ID at every layer.

7. **Data export is available.** Users can export their full plant database as CSV.

8. **Account deletion** removes all associated data (plants, care logs, photos, breeding records). This is a cascading delete — no orphaned data remains.
