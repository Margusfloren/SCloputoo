# SC lõputöö – pelletitööstuse juhtimisvaade

Pelletitööstuse Supply Chain Management juhtimisvaate arendusprojekt.

**Status:** Power BI V1 development in progress  
**Last updated:** 04.10.2026

## Project Overview

Projekti eesmärk on luua Supply Chain Managerile juhtimisvaade, mis seob müügi, tootmise ja nende omavahelise takti ühtseks analüüsiks. V1 keskendub sellele, et oleks kiiresti nähtav:

- kas müük täidab eelarvet;
- kas tootmine täidab tootmisplaani;
- millisel perioodil, tehases või tootel kõrvalekalle tekib;
- kas tootmine ja müük liiguvad samas taktis;
- milline müügikanal, toode või tehas mõjutab tulemust.

Projekt kasutab sünteetilisi 2023–2025 andmeid nelja pelletitehase kohta.

## Source data

Lähteandmete struktuur on üles ehitatud **Directo ERP andmemudeli põhimõtteid** järgides. Andmed liiguvad PostgreSQL-i kihilise mudeli kaudu ning neid valideeritakse enne visualiseerimist.

## Technical flow

```text
Source data
   ↓
PostgreSQL
   ↓
Bronze
   ↓
Silver / Gold
   ↓
SQL validation
   ↓
Python / pandas validation
   ↓
Power BI
```

Põhimõte on, et sama äriloogika peab andma sama tulemuse eri tööriistades:

**SQL = Python = Power BI**

## Data model

Power BI kasutab tähtskeemi / galaxy-modeli põhimõtet. Müügi ja tootmise fact-tabelid on seotud ühiste dimensioonidega.

Peamised dimensioonid:

- `gold.dim_date`
- `gold.dim_plant`
- `gold.dim_product`
- `gold.dim_channel`

Peamised fact-tabelid:

- `gold.fact_sales`
- `gold.fact_sales_budget`
- `gold.fact_production`
- `gold.fact_production_budget`

## SQL validation

SQL-kontrollidega valideeritakse vähemalt:

- Sales Actual
- Sales Budget
- Sales Variance
- Budget Attainment %
- Production Actual
- Production Budget
- Production Variance
- Production Attainment %

Kontrolle tehakse perioodi, tehase ja toote tasemel.

## Python

Pythoni V1 notebook:

```text
python/01_sales_analysis.ipynb
```

Python loeb Gold-kihi andmeid PostgreSQL-ist ning arvutab samad põhimõõdikud, mida kasutatakse SQL-is ja Power BI-s. Pythonit kasutatakse sõltumatu kontrollkihina, et veenduda tulemuste õigsuses.

Pikemas versioonis on plaan luua samast äriloogikast Python / Streamlit veebivaade.

## Power BI V1

### SC Overview

Overview-leht annab juhtimiseks kiire tervikpildi.

Praegu on realiseeritud:

- Sales KPI rida: Actual, Budget, Variance, Budget Attainment;
- Production KPI rida: Actual, Budget, Variance, Production Attainment;
- globaalsed slicerid: Year, Month, Plant, Product, Channel;
- Sales Actual vs Budget graafik;
- Production Actual vs Budget graafik;
- dünaamiline Sales View;
- dünaamiline Production View;
- slicerite sünkroniseerimine lehtede vahel.

Sales ja Production KPI-d kasutavad sama visuaalset loogikat, kuid eristuvad värviga:

- Sales – sinepitoon;
- Production – heleroheline.

### Sales Analysis

Sales Analysis leht võimaldab liikuda üldvaatest detaili.

Realiseeritud:

- Selected Period Sales KPI-d;
- Sales Actual vs Budget ajateljel;
- dünaamiline `Sales View Selector`;
- analüüs tehase, toote ja kanali lõikes;
- Sales Actual vs Budget by Selected View;
- detailne Sales Matrix;
- negatiivse Sales Variance väärtuse tingimusvärvimine punaseks;
- tuhandete eraldajaga tabeliformaat.

`Sales View Selector` võimaldab sama Matrixi ja graafikut ümber lülitada näiteks:

- `plant_name`
- `product_name`
- `channel_id`

### Product Analysis

Tootepõhine detailvaade Production Actual ↔ Sales Actual võrdluseks.

### Plant Analysis

Tehasepõhine detailvaade, mis aitab tuvastada, millises tehases kõrvalekalle tekkis.

## KPI display formatting

KPI-kaartidel kasutatakse dünaamilist K/M formaati, et väärtused oleksid kompaktsed ja üheselt loetavad.

Reegel:

- alla 10K → 2 kohta pärast koma;
- 10K kuni alla 100K → 1 koht pärast koma;
- 100K kuni alla 1M → 0 kohta pärast koma;
- 1M ja rohkem → 2 kohta pärast koma.

Näited:

```text
8 680      → 8,68K
68 300     → 68,3K
142 000    → 142K
1 630 000  → 1,63M
```

Oluline tehniline põhimõte: KPI Display measure'id jäävad numbriliseks ning `K` / `M` lisatakse **Dynamic format string** abil. See säilitab lokaadipõhise komakohavormingu ja väldib `FORMAT()`-iga tekstiks muutmist.

Budget Attainment ja Production Attainment kuvatakse ühtselt kahe komakohaga.


## KPI status logic / conditional formatting

Budget Attainment ja Production Attainment puhul ei kasutata loogikat **"mida kõrgem, seda parem"**. Juhtimisvaates on eesmärk püsida sihtvahemikus, sest liiga suur üle- või alatäitmine võib viidata ebatäpsele eelarvele / tootmisplaanile ning tekitada lisapingeid tootmises, varudes ja logistikas.

Kasutatav staatuseloogika:

- alla 90% → **Critical** / punane;
- 90% kuni alla 95% → **Attention** / sinep;
- 95% kuni 105% → **OK** / roheline;
- üle 105% kuni 110% → **Attention** / sinep;
- üle 110% → **Critical** / punane.

Power BI conditional formatting `Rules` kasutab protsendi alusväärtust kümnendmurruna. Seetõttu sisestatakse piirid reeglitesse kujul:

```text
0.00 – < 0.90   → Critical
0.90 – < 0.95   → Attention
0.95 – <= 1.05  → OK
> 1.05 – <= 1.10 → Attention
> 1.10           → Critical
```

Näiteks `101,4%` alusväärtus on Power BI-s `1.014`, mistõttu kuulub see vahemikku `0.95–1.05` ja kuvatakse rohelisena.

Kasutatav värvipalett:

- OK / roheline: `#A8C9A0`
- Attention / sinep: `#D6A84B`
- Critical / punane: `#C94C4C`

Sama põhimõte rakendub nii Sales Budget Attainment kui ka Production Attainment KPI-dele.


## Field parameters and Matrix formatting

Power BI dünaamilised Matrixid kasutavad field parameter'eid:

- `Sales KPI Selector`
- `Sales View Selector`
- `Production KPI Selector`
- `Production View Selector`

Üheks tehniliseks erijuhuks oli `Production Actual` kuvamine `Production KPI Selector` kaudu. Otse tabelisse lisatud `Production Actual` kasutas tuhandete eraldajat korrektselt, kuid field parameteri kaudu Matrixis vana vormingut ei rakendatud õigesti.

Lahendus:

```DAX
Production Actual View =
[Production Actual]
```

Uus helper-measure vormindati Whole Number + Thousands Separator kujul ning `Production KPI Selector` esimene viide muudeti:

```DAX
("Production Actual", NAMEOF('_Measures'[Production Actual View]), 0)
```

Pärast field parameteri sliceri valikute uuesti aktiveerimist kuvab Production View Matrix väärtused ühtselt:

```text
911 100
140 773
1 622 765
```

See lahendus jätab alusmeasure'i arvutusloogika puutumata ning lahendab ainult visuali / field parameteri vorminduskihi.

## V1 validation principle

V1-s kasutatakse eri lahendusi sama tulemuse kontrollimiseks.

Näiteks:

1. PostgreSQL arvutab Actual / Budget / Variance / Attainment.
2. Python loeb sama Gold-andmestikku ja teeb sõltumatu kontrolli.
3. Power BI kasutab sama Gold-andmestikku visualiseerimiseks.

Kui tulemused kattuvad, suureneb kindlus, et juhtimisvaate andmeid saab usaldada.

## Current V1 status

Seisuga 04.10.2026:

- PostgreSQL Bronze / Silver / Gold mudel töötab;
- DIM / FACT mudel on loodud;
- SQL-kontrollid töötavad;
- Python ↔ PostgreSQL Gold ühendus töötab;
- Power BI ühendus töötab;
- SC Overview põhiloogika töötab;
- Sales Analysis põhiloogika töötab;
- Product Analysis ja Plant Analysis vaated on olemas;
- globaalsed slicerid on sünkroniseeritud;
- KPI-de K/M vorming on standardiseeritud;
- Sales ja Production Matrixite arvuvorming on ühtlustatud;
- negatiivsed variance-väärtused on analüüsivaadetes esile tõstetavad.

Järgmine V1 etapp on Production Analysis lehe viimistlemine, navigation, QA ja dokumentatsiooni lõppkontroll.

## Long version backlog

Pärast V1 kaitsmist jätkub projekt täisversioonina.

Planeeritud laiendused:

- finished-goods inventory: opening / closing stock;
- Min Stock / Target / Max / Physical Capacity;
- inventory utilization % ja coverage;
- BOM / dry-matter raw-material mix;
- niiskuse põhine wet-tonnage conversion;
- packaging capacity ja backlog;
- bulk silo / port storage / vessel schedule;
- forecast snapshots, forecast accuracy ja bias;
- OTIF order / delivery grain;
- exception-based management view;
- Python / Streamlit veebivaade.

### Sales Channel Budget / Channel Mix

V1-s on Actual Sales kanalite lõikes olemas, kuid Sales Budget ei ole veel kanalitele eraldi jaotatud. Seetõttu ei käsitleta channel-tasemel praegust Budget Attainment väärtust kanali enda eelarve täitmisena.

Pikas versioonis lisatakse:

- Budget tonnes by channel: B2B / DIST / IND / RET;
- Actual Share %;
- Budget Share %;
- Channel Variance;
- Channel Attainment %;
- Actual vs Budget channel mix.

Eesmärk on näha mitte ainult kanalite tegelikku müügijaotust, vaid ka seda, kas müügimix vastab planeeritud kanalistruktuurile.

## Repository structure

```text
README.md

docs/

sql/

python/

powerbi/
```

- `docs/` – projekti vahedokumendid ja kirjeldused
- `sql/` – PostgreSQL skriptid ja kontrollpäringud
- `python/` – Python / pandas analüüs ja valideerimine
- `powerbi/` – Power BI Project (PBIP) failid

## Scope principle

V1 eesmärk ei ole realiseerida kogu pelletitööstuse Supply Chain mudelit korraga. V1 lukustab müügi, tootmise ja nende omavahelise takti analüüsiloogika ning loob usaldusväärse tehnilise vundamendi pikemale projektile.
