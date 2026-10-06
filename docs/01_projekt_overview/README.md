# SC lõputöö – pelletitööstuse juhtimisvaade

Pelletitööstuse Supply Chain Management juhtimisvaate arendusprojekt.

**Status:** Power BI V1 core functionality complete – QA and documentation in progress  
**Last updated:** 06.10.2026

## Project Overview

Projekti eesmärk on luua Supply Chain Managerile juhtimisvaade, mis seob müügi, tootmise ja nende omavahelise takti ühtseks analüüsiks. V1 keskendub sellele, et oleks kiiresti nähtav:

- kas müük täidab eelarvet;
- kas tootmine täidab tootmisplaani;
- millisel perioodil, tehases või tootel kõrvalekalle tekib;
- kas tootmine ja müük liiguvad samas taktis;
- milline müügikanal, toode või tehas mõjutab tulemust;
- kui suur on tegeliku tootmise ja tegeliku müügi vahe ning milliste toodete juures see tekib.

Projekt kasutab sünteetilisi 2023–2025 andmeid nelja pelletitehase kohta.

Power BI V1 koosneb viiest omavahel seotud analüüsivaatest:

1. `SC Overview`
2. `Sales Analysis`
3. `Production Analysis`
4. `Plant Analysis`
5. `Product Analysis`

Overview seob loo kokku ning detailvaated võimaldavad kõrvalekalde põhjuseid edasi analüüsida.

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

Overview-leht annab juhtimiseks kiire tervikpildi ning seob Sales ja Production analüüsi üheks looks.

Realiseeritud:

- Sales KPI rida: Actual, Budget, Variance, Budget Attainment;
- Production KPI rida: Actual, Budget, Variance, Production Attainment;
- globaalsed slicerid: Year, Month, Plant, Product, Channel;
- Sales Actual vs Budget ajatelg;
- Production Actual vs Budget võrdlus;
- Production Actual vs Sales võrdlus;
- `Compare production with` valik, millega saab Production graafikut vahetada Budget ja Sales võrdluse vahel;
- dünaamiline Sales View;
- dünaamiline Production View;
- eraldi `Production vs Sales by Product` tabel;
- slicerite sünkroniseerimine analüüsilehtede vahel.

Overview kasutab kolme põhilist analüütilist graafikuvaadet:

1. Sales Actual vs Budget;
2. Production Actual vs Budget;
3. Production Actual vs Sales.

Productioni kaks võrdlust on koondatud ühte dünaamilisse graafikusse, mida juhib `Compare production with` selector.

Lehe alumine osa kasutab kolme tabelit:

1. `Sales View` – müügi Actual, Budget, Variance ja Attainment;
2. `Production View` – tootmise Actual, Budget, Variance ja Attainment;
3. `Production vs Sales by Product` – Production Actual, Sales Actual ja nende vahe toodete lõikes.

Uue `Production vs Sales by Product` tabeli eesmärk on näidata mitte ainult arvutuse tulemust, vaid ka selle lähteväärtuseid. Kasutaja näeb samas reas:

```text
Product | Production Actual | Sales Actual | Production vs Sales
```

See muudab tootmise ja müügi suhte läbipaistvaks ning võimaldab kohe näha, millise toote juures vahe tekib.

Sales ja Production KPI-d kasutavad sama visuaalset loogikat, kuid eristuvad värviga:

- Sales – sinepitoon;
- Production – heleroheline.

Sales Actual kasutatakse Production vs Sales võrdluses sinise tooniga, et müügi ja tootmise seos oleks visuaalselt eristatav.

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

Sales Analysis eesmärk on näha, millisel perioodil ja millise dimensiooni lõikes müügieelarve kõrvalekalle tekib.

### Production Analysis

Production Analysis keskendub tootmisplaani täitmisele ja tootmise suhtele tegeliku müügiga.

Realiseeritud:

- Selected Period Production KPI-d;
- Production Actual vs Budget ajateljel;
- Production Actual vs Sales ajateljel;
- Production Actual vs Budget Matrix;
- Production Actual vs Sales Matrix;
- dünaamiline `Production KPI Selector`;
- dünaamiline `Production View Selector`;
- negatiivsete variance-väärtuste tingimusvärvimine;
- ühtne täisarvude ja tuhandete eraldajaga tabeliformaat.

Production Analysis võimaldab eristada kahte eri juhtimisküsimust:

1. kas tootmine täitis tootmisplaani;
2. kas tegelik tootmismaht liikus tegeliku müügiga samas taktis.

See eristus on oluline, sest tootmine võib olla eelarve suhtes väga täpne, kuid tegelik müük võib samal ajal liikuda teises tempos.

### Plant Analysis

Plant Analysis on tehasepõhine detailvaade, mis aitab tuvastada, millises tehases tootmismaht ja kõrvalekalle tekivad.

Realiseeritud:

- Production vs Budget tehase lõikes;
- Product Mix by Plant;
- Plant Production Performance tabel;
- Production Share % by Plant;
- Year, Month, Plant ja Product slicerid.

Vaade võimaldab näha:

- milline tehas toodab valitud toodet;
- kuidas tehase Actual suhestub Budgetiga;
- milline on tehase osa valitud tootmismahust;
- kuidas erineb toodete mix tehaste vahel.

### Product Analysis

Product Analysis on tootepõhine detailvaade, mille keskne eesmärk on võrrelda tootmist müügiga ning näha, millistes tehastes valitud toodet toodetakse.

Realiseeritud:

- Production vs Budget toote vaates;
- Production vs Sales toote vaates;
- `Product performance by plant` tabel;
- `Production Share % by plant`;
- Year, Month, Plant ja Product slicerid;
- tootevaliku mõju kõikidele lehe visuaalidele.

Vaade võimaldab lugeda ühe toote kohta tervikliku loo:

- millal toodet toodeti;
- kui palju toodeti võrreldes tootmisplaaniga;
- kui palju samal perioodil müüdi;
- millised tehased toodet valmistasid;
- milline tehas tekitas Budgeti kõrvalekalde;
- kui suur osa valitud toote kogumahust tuli igast tehasest.

Product Analysis eesmärk ei ole dubleerida Plant Analysis vaadet, vaid vaadata sama tarneahela loogikat toote vaatenurgast.

## Production vs Sales logic

Üks V1 keskseid mõõdikuid on Production Actual ja Sales Actual vahe.

```DAX
Production vs Sales =
[Production Actual] - [Sales Actual]
```

Tõlgendus:

- positiivne tulemus → valitud perioodil toodeti rohkem kui müüdi;
- negatiivne tulemus → valitud perioodil müüdi rohkem kui toodeti;
- nullilähedane tulemus → tootmine ja müük liikusid valitud perioodil sarnases mahus.

Oluline: positiivne või negatiivne tulemus ei tähenda automaatselt head või halba tulemust.

Vahe võib olla põhjustatud näiteks:

- teadlikust hooajalisest varu kasvatamisest;
- varasemalt toodetud valmistoodangu müügist;
- müügi kõrvalekaldest prognoosist;
- tootmisplaani ja tegeliku nõudluse erinevast tempost.

Seetõttu kasutatakse mõõdikut eelkõige tähelepanu juhtimiseks ja edasise analüüsi lähtepunktina.

Overview tabelis kuvatakse arvutus koos lähteandmetega:

```text
Production Actual - Sales Actual = Production vs Sales
```

Negatiivne `Production vs Sales` väärtus kuvatakse tabelis punase tekstina, et juhtida tähelepanu olukorrale, kus Sales Actual ületab sama perioodi Production Actual väärtust.

## Analytical approach

Dashboardi analüütiline põhimõte on:

**Budget performance alone does not tell the full story.**

Tootmise 100% lähedane Budget Attainment võib esmapilgul näidata väga head tulemust. Supply Chain vaates ei piisa aga ainult sellest, et tootmine järgib plaani. Oluline on kontrollida, kas tootmine liigub ka tegeliku müügiga samas tempos.

Seetõttu seob juhtimisvaade kolm põhitasandit:

**Sales → Production → Production vs Sales**

Overview näitab, mis toimub tervikuna. Sales, Production, Plant ja Product Analysis aitavad seejärel leida, millal, kus ja millise toote või tehase juures erinevus tekib.

Pikemas versioonis seotakse sama loogika valmistoodangu laoseisuga, et näha, kuidas Production vs Sales erinevus mõjutab tegelikku inventory taset ja füüsilist laomahutavust.

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
0.00 – < 0.90    → Critical
0.90 – < 0.95    → Attention
0.95 – <= 1.05   → OK
> 1.05 – <= 1.10 → Attention
> 1.10           → Critical
```

Näiteks `101,4%` alusväärtus on Power BI-s `1.014`, mistõttu kuulub see vahemikku `0.95–1.05` ja kuvatakse rohelisena.

Kasutatav KPI staatuse värvipalett:

- OK / roheline: `#A8C9A0`
- Attention / sinep: `#D6A84B`
- Critical / punane: `#C94C4C`

Sama põhimõte rakendub nii Sales Budget Attainment kui ka Production Attainment KPI-dele.

Negatiivsete Variance ja Production vs Sales väärtuste tekstivärvina kasutatakse eraldi tugevat punast `#C00000`.

## Visual design principles

Dashboardi kujundamisel kasutatakse põhimõtet **less is more**.

Peamised kujundusreeglid:

- visualiseeritakse ainult juhtimisotsuse jaoks vajalik info;
- telgede tiitleid ei kuvata juhul, kui pealkiri, legend ja mõõdikud annavad sama info juba selgelt edasi;
- Sales ja Production kasutavad läbivalt samu põhivärve;
- tabelite kujundus on teadlikult tagasihoidlik;
- negatiivne kõrvalekalle tuuakse välja punase tekstiga, mitte liigsete ikoonide või signaalvärvidega;
- selectorid ja slicerid kasutavad võimalikult ühtset kujunduskeelt;
- sama filtreering annab eri lehtedel omavahel võrreldavad vaated.

Production vs Sales tabel seob teadlikult müügi ja tootmise värviloogika: Sales seostub sinisega ning Production sinepitooniga.

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

Sama kontrollipõhimõte kehtib ka visuaalide omavahelisel võrdlemisel: Overview annab koondpildi ning detailvaated peavad võimaldama sama tulemust perioodi, toote ja tehase tasandil lahti seletada.

## Current V1 status

Seisuga 06.10.2026:

- PostgreSQL Bronze / Silver / Gold mudel töötab;
- DIM / FACT mudel on loodud;
- SQL-kontrollid töötavad;
- Python ↔ PostgreSQL Gold ühendus töötab;
- Power BI ühendus töötab;
- SC Overview põhiloogika on valmis;
- Sales Analysis põhiloogika on valmis;
- Production Analysis põhiloogika on valmis;
- Plant Analysis põhiloogika on valmis;
- Product Analysis põhiloogika on valmis;
- viis peamist analüüsivaadet töötavad sama filtreerimisloogikaga;
- globaalsed slicerid on sünkroniseeritud;
- Production Budget ↔ Sales Actual võrdlus on dünaamilise selectoriga juhitav;
- `Production vs Sales` measure ja tootepõhine Overview tabel on lisatud;
- KPI-de K/M vorming on standardiseeritud;
- Sales ja Production Matrixite arvuvorming on ühtlustatud;
- negatiivsed variance-väärtused on analüüsivaadetes esile tõstetavad;
- negatiivne Production vs Sales väärtus on tingimusvorminguga esile tõstetav;
- visualiseerimise põhiline kujundus ja funktsionaalsus on paigas.

V1 järgmine etapp on:

- lõplik QA;
- lehtede ja selectorite viimased nimetuste / paigutuse kontrollid;
- navigation kontroll;
- dokumentatsiooni lõppkontroll;
- kaitsmise jaoks demo-loo ja põhijärelduste ettevalmistamine.

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

### Finished Goods Inventory

Pika versiooni üks olulisemaid järgmisi samme on Production vs Sales loogika sidumine valmistoodangu laoseisuga.

Planeeritud mõõdikud ja piirangud:

- Opening Stock;
- Closing / Current Stock;
- Min Stock;
- Target Stock;
- Max Stock / Physical Capacity;
- Utilization %;
- coverage;
- staatused nagu Below Min / OK / Near Full / Over Capacity.

See võimaldab vastata küsimusele, kas Production vs Sales erinevus oli teadlik varu kasvatamine või tekitas soovimatu laoseisu suurenemise.

### BOM / raw-material layer

Pikas versioonis lisatakse BOM-kiht, mis seob tootmisplaani tooraine vajadusega.

Planeeritud loogika:

- standardne kuivaineline toorainesegu 1 tonni pelleti kohta;
- märja tooraine vajaduse arvutamine niiskusesisalduse alusel;
- höövlilaastu, märja saepuru, hakke ja ümarpalgi vajadus;
- tootmisplaani teisendamine reaalseks sisseostu / tarnevajaduseks.

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

V1 põhiküsimus on:

**Kas müük ja tootmine liiguvad omavahel kooskõlas ning kus tekib kõrvalekalle?**

Pikk versioon laiendab sama loogikat varude, BOM-i, tooraine, forecast'i, OTIF-i ja füüsiliste tootmis- / laopiiranguteni.
