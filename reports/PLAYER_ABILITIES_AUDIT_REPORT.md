# Real-World Football Player Ability Database & Ratings Report
**Season Reference**: 2026/27 Football Season  
**Audit Date**: November 18, 2026  
**Methodology**: EA SPORTS FC-Inspired Multi-Attribute Architecture & Calibrated Mathematical Scouting Model  

---

## 1. Executive Summary

| Metric | Result | Target Standard | Status |
|---|---:|:---:|:---:|
| **Total Domestic Clubs Audited** | **733** | 733 Clubs | PASS |
| **Total Registered Senior Footballers** | **18325** | 18,325 Players | PASS |
| **Players with 100% Complete Ability Profiles** | **18325 / 18325 (100.0%)** | 100.0% | PASS |
| **Missing Attributes Detected** | **0** | 0 Missing | ZERO TOLERANCE MET |
| **Attribute Out of Bounds (<1 or >99)** | **0** | 0 Violations | ZERO TOLERANCE MET |
| **Weak Foot Violations (not 1..5★)** | **0** | 0 Violations | ZERO TOLERANCE MET |
| **Skill Moves Violations (not 1..5★)** | **0** | 0 Violations | ZERO TOLERANCE MET |
| **Work Rates Violations (not Low/Med/High)** | **0** | 0 Violations | ZERO TOLERANCE MET |
| **Total PlayStyles Distributed** | **10923** | Natural Archetype | ACTIVE |
| **PlayStyle+ Signatures Assigned** | **250** | Elite Stars / Archetypes | ACTIVE |

---

## 2. Data Sourcing & Attribution Transparency

Every registered footballer is tagged with an explicit, auditable data origin to prevent unverified or fabricated ratings:

| Data Sourcing Tier | Player Count | Share | Description |
|---|---:|---:|---|
| **Verified Scouted** (`verified_scouted`) | **14** | Key Stars | Authentic real-world EA FC 24/25/26 ratings for marquee superstars (Mbappé, Haaland, Rodri, Vinícius Jr., Bellingham, De Bruyne, Kane, Salah, Van Dijk, Alisson, etc.) with verified PlayStyle+ signatures, weak foot, and skill moves. |
| **Calibrated Model** (`calibrated_model`) | **18311** | 99.8% | Original mathematical scouting model calibrated to each footballer's target overall rating, league level, age, position archetype, height, and preferred foot across all 20 countries and 40 divisions. |
| **Procedural Estimated** (`procedural_estimated`) | **0** | 0.0% (Academy Only) | Used exclusively for newly generated youth academy prospects and regens during multi-season rollovers. |

---

## 3. EA SPORTS FC-Grade 33 Individual Attributes Schema

Each player profile contains the complete 28 outfield attributes and 5 goalkeeper attributes:

```
├── Pace (PAC)
│   ├── Acceleration
│   └── Sprint Speed
├── Shooting (SHO)
│   ├── Attacking Positioning
│   ├── Finishing
│   ├── Shot Power
│   ├── Long Shots
│   ├── Volleys
│   └── Penalties
├── Passing (PAS)
│   ├── Vision
│   ├── Crossing
│   ├── Free Kick Accuracy
│   ├── Short Passing
│   ├── Long Passing
│   └── Curve
├── Dribbling (DRI)
│   ├── Agility
│   ├── Balance
│   ├── Reactions
│   ├── Ball Control
│   ├── Dribbling
│   └── Composure
├── Defending (DEF)
│   ├── Interceptions
│   ├── Heading Accuracy
│   ├── Defensive Awareness (Marking)
│   ├── Standing Tackle
│   └── Sliding Tackle
├── Physicality (PHY)
│   ├── Jumping
│   ├── Stamina
│   ├── Strength
│   └── Aggression
└── Goalkeeping (GK)
    ├── Diving
    ├── Handling
    ├── Kicking
    ├── Reflexes
    └── GK Positioning
```

---

## 4. Division-by-Division Calibration & Ability Statistics

| Country | Competition | Clubs | Players | Avg OVR | Verified Stars | Total PlayStyles | PlayStyle+ |
|---|---|---:|---:|:---:|---:|---:|---:|
| ENG | Premier League | 20 | 500 | **81.7** | 9 | 995 | 44 |
| ESP | La Liga EA Sports | 20 | 500 | **81.3** | 4 | 921 | 46 |
| GER | Bundesliga | 18 | 450 | **81.2** | 1 | 819 | 45 |
| ITA | Serie A Enilive | 20 | 500 | **81.2** | 0 | 893 | 62 |
| FRA | Ligue 1 McDonald's | 18 | 450 | **80.1** | 0 | 741 | 16 |
| BRA | Brasileirão Série A | 20 | 500 | **78.5** | 0 | 687 | 5 |
| MEX | Liga BBVA MX | 18 | 450 | **75.9** | 0 | 390 | 0 |
| NGA | Nigerian Professional Football League | 1 | 25 | **75.5** | 0 | 16 | 0 |
| POR | Primeira Liga (Liga Portugal Betclic) | 18 | 450 | **75.4** | 0 | 373 | 12 |
| USA | Major League Soccer (MLS) | 30 | 750 | **75.2** | 0 | 512 | 1 |
| TUR | Trendyol Süper Lig | 19 | 475 | **75** | 0 | 359 | 6 |
| ARG | Primera División (Liga Profesional) | 28 | 700 | **74.9** | 0 | 495 | 3 |
| BEL | Belgian Pro League (Jupiler Pro League) | 16 | 400 | **74.9** | 0 | 313 | 0 |
| JPN | Meiji Yasuda J1 League | 20 | 500 | **74.9** | 0 | 347 | 0 |
| NED | Eredivisie | 18 | 450 | **74.4** | 0 | 331 | 7 |
| SAU | Saudi Pro League (Roshn Saudi League) | 18 | 450 | **74.1** | 0 | 340 | 3 |
| ENG | EFL Championship | 24 | 600 | **73.4** | 0 | 265 | 0 |
| SUI | Swiss Super League | 12 | 300 | **73.4** | 0 | 149 | 0 |
| DEN | Danish Superliga (3F Superliga) | 12 | 300 | **73.3** | 0 | 170 | 0 |
| KOR | Hana Bank K League 1 | 12 | 300 | **73.2** | 0 | 103 | 0 |
| AUT | Austrian Bundesliga (Admiral Bundesliga) | 12 | 300 | **72.4** | 0 | 162 | 0 |
| GER | 2. Bundesliga | 18 | 450 | **72.3** | 0 | 172 | 0 |
| SCO | Scottish Premiership | 12 | 300 | **72** | 0 | 152 | 0 |
| ESP | Segunda División (LaLiga Hypermotion) | 22 | 550 | **71.3** | 0 | 143 | 0 |
| ITA | Serie BKT | 20 | 500 | **70.5** | 0 | 135 | 0 |
| BRA | Brasileirão Série B | 20 | 500 | **69.5** | 0 | 97 | 0 |
| FRA | Ligue 2 BKT | 18 | 450 | **69.4** | 0 | 93 | 0 |
| POR | Liga Portugal 2 Meu Super | 18 | 450 | **67.3** | 0 | 54 | 0 |
| TUR | Trendyol 1. Lig | 20 | 500 | **67.3** | 0 | 60 | 0 |
| JPN | Meiji Yasuda J2 League | 20 | 500 | **66.6** | 0 | 60 | 0 |
| ARG | Primera Nacional | 36 | 900 | **66.5** | 0 | 109 | 0 |
| NED | Eerste Divisie (Keuken Kampioen Divisie) | 20 | 500 | **66.1** | 0 | 60 | 0 |
| SAU | Saudi First Division League (Yelo League) | 18 | 450 | **65.8** | 0 | 56 | 0 |
| BEL | Challenger Pro League | 16 | 400 | **65.7** | 0 | 48 | 0 |
| MEX | Liga de Expansión MX | 15 | 375 | **65.5** | 0 | 45 | 0 |
| USA | USL Championship | 24 | 600 | **65.5** | 0 | 72 | 0 |
| KOR | Hana Bank K League 2 | 14 | 350 | **65.4** | 0 | 42 | 0 |
| DEN | Danish 1st Division (NordicBet Liga) | 12 | 300 | **65.3** | 0 | 36 | 0 |
| SUI | Swiss Challenge League | 10 | 250 | **64.9** | 0 | 30 | 0 |
| AUT | Austrian 2. Liga | 16 | 400 | **64.8** | 0 | 48 | 0 |
| SCO | Scottish Championship | 10 | 250 | **64** | 0 | 30 | 0 |

---

## 5. Dynamic Career Mode Evolution Integration

Player abilities dynamically evolve throughout Career Mode across 7 key vectors:
1. **Age-Progression Curve**: Young prospects (<21) develop rapidly; prime players (25-29) stabilize; veterans (30+) experience gradual physical decline (sprint speed, acceleration, stamina) balanced by enduring mental composure.
2. **Weekly Training Focus**: 7 focused training regimens (Attacking, Defending, Passing, Shooting, Fitness, Goalkeeping, Tactical) directly target individual EA FC attributes.
3. **Manager & Coaching Staff Quality**: Club coaching quality and player development attributes scale weekly training velocity by up to 1.45x.
4. **Playing Time & Squad Satisfaction**: Regular starters gain development momentum (1.25x), while neglected bench players suffer development stagnation (0.35x).
5. **Match Performance Momentum**: High match ratings (7.4+) grant acceleration momentum and trigger dynamic potential breakthroughs.
6. **Injury Setbacks**: Severe long-term injuries (4+ weeks) halt training growth and can reduce physical attributes.
7. **Season-End Maturation & Decline**: Multi-season rollovers execute physical maturation for youths and natural decline for veterans.
