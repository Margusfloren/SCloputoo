# Project Overview

## Projekti eesmärk

Projekti eesmärk on luua pelletitööstuse Supply Chain Management juhtimisvaade, mis ühendab müügi, tootmise ja tarnekindluse juhtimiseks vajaliku info ühte vaatesse.

Juhtimisvaate eesmärk ei ole ainult näidata tulemusi, vaid aidata vastata küsimustele:

- Kas müük liigub eelarve järgi?
- Kas tootmine täidab plaani?
- Kas klienditellimused täidetakse õigel ajal ja täies mahus?
- Kus tekivad kõrvalekalded plaanist?
- Millised teemad vajavad juhi tähelepanu?

---

## Äriprobleem

Pelletitööstuses on müük, tootmine, tooraine ja varud omavahel tugevalt seotud.

Kui müügiplaan, tootmisplaan ja tegelikud tulemused paiknevad erinevates süsteemides või failides, on keeruline saada kiiresti terviklikku pilti ettevõtte olukorrast.

Juhtimisvaade koondab olulise info ühte keskkonda ning võimaldab võrrelda plaani ja tegelikku tulemust.

---

## Sihtkasutaja

Juhtimisvaade on eelkõige mõeldud:

- Supply Chain Managerile
- tehase- ja tootmisjuhtidele
- müügi- ja planeerimisfunktsioonile
- ettevõtte juhtkonnale

Vaate eesmärk on toetada operatiivset ja taktikalist juhtimist.

---

# V1 – lõputöö kaitsmise versioon

V1 eesmärk on luua töötav juhtimisvaate põhiversioon, millega saab demonstreerida kogu lahenduse loogikat andmetest kuni Power BI raportini.

## V1 põhifookus

### Müük

- Sales Budget
- Sales Actual
- Budget vs Actual
- Budget Achievement %

### Tootmine

- Production Plan
- Production Actual
- Production Plan Achievement %

### Tarnekindlus

- OTIF %

V1 võimaldab hinnata, kas müük ja tootmine liiguvad plaani järgi ning kas klienditellimused täidetakse kokkulepitud tingimustel.

---

# Full Version – laiendatud juhtimisvaade

Pärast lõputöö kaitsmist jätkub projekti arendus täielikuks Supply Chain juhtimisvaateks.

Planeeritud laiendused hõlmavad muu hulgas:

- Sales Budget vs Forecast vs Actual
- snapshot / as-of date analüüsi
- kuu täitmise tempo analüüsi
- valmistoodangu varude juhtimist
- Min Stock ja Max Stock / Capacity loogikat
- lao täituvust
- tootmisvõimsuse kasutust
- tootmise pudelikaelte analüüsi
- toorme mix'i
- müügimix'i
- detailsemat OTIF analüüsi
- tooraine juhtimisvaadet

Täisversiooni eesmärk on siduda omavahel:

**müük → tootmine → tooraine → varud → tarnekindlus**

---

## Tehniline lahendus

Projekti põhiline tehniline töövoog:

**Andmeallikad → PostgreSQL → Power BI**

PostgreSQL-is kasutatakse andmete töötlemiseks kihilist ülesehitust:

- Bronze – algandmed
- Silver – puhastatud ja standardiseeritud andmed
- Gold – analüüsiks ja Power BI jaoks ettevalmistatud andmed

Power BI-s luuakse juhtimisvaade, KPI-d ja visualiseeringud.

---

## Edasiarendus

Pärast Power BI täisversiooni valmimist on plaan luua samast juhtimisloogikast ka Pythonil põhinev veebiversioon.

Planeeritud tehnoloogia:

**Python + Streamlit**

See võimaldab võrrelda Power BI ja Pythonil põhineva veebirakenduse võimalusi ning arendada projektist tervikliku portfooliotöö.

---

## Projekti arendusloogika

Projekt areneb etapiviisiliselt:

1. V1 – lõputöö kaitsmise versioon
2. Power BI täisversioon
3. GitHubi portfoolio korrastamine
4. Python / Streamlit veebiversioon