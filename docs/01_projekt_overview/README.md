# Project Overview

## Projekti eesmärk

Projekti eesmärk on luua pelletitööstuse Supply Chain Management juhtimisvaade, mis ühendab müügi, tootmise ja tarneahela juhtimiseks vajaliku info ühte tervikusse.

Juhtimisvaate eesmärk ei ole ainult näidata tulemusi, vaid aidata vastata juhtimisküsimustele:

- Kas müük liigub eelarve järgi?
- Millised tehased, tooted ja müügikanalid mõjutavad kõrvalekaldeid?
- Kas tootmine täidab plaani?
- Kas tootmine ja müük on omavahel tasakaalus?
- Millised on tootmise ja tarneahela võimalikud pudelikaelad?
- Kas toorme saadavus toetab tootmisplaani?
- Milline on valmistoodangu varude seis?
- Kas klientidele tarnitakse õigel ajal ja kokkulepitud koguses?

---

## Projekti ulatus

Projekt kasutab nelja pelletitehase näidisandmeid.

Peamised analüüsivaldkonnad on:

1. **Sales & Demand**
   - Sales Actual
   - Sales Budget
   - Variance
   - Budget Fulfilment %
   - analüüs aasta, kuu, tehase ja toote lõikes

2. **Production**
   - tootmisplaan
   - tegelik tootmine
   - tootmisplaani täitmine
   - tootmise ja müügi võrdlus

3. **Raw Materials**
   - peamised toormeliigid
   - toorme vajadus
   - toorme mix
   - tootmisplaani ja toorme vajaduse seos

4. **Inventory**
   - valmistoodangu varud
   - varude muutus
   - lao kasutus ja võimalikud piirangud

5. **Delivery Performance**
   - OTIF
   - tellimuste täitmine
   - klienditeeninduse KPI-d

---

## Tehniline lahendus

Projekti andmevoog:

 
→ PostgreSQL → Bronze → Silver → Gold  → SQL validation → Python analysis → Power BI**

Lähteandmed on sünteetilised, kuid nende struktuur järgib Directo ERP andmemudeli loogikat. Kasutatud on Directo-laadseid müügi-, tootmis-, ostu-, toote- ja objektitabeleid, et simuleerida realistlikku ettevõtte andmevoogu.

### PostgreSQL

Andmemudel on ehitatud PostgreSQL-is.

Peamised Gold-kihi tabelid:

- `gold.fact_sales`
- `gold.fact_sales_budget`
- `gold.fact_production`
- `gold.fact_production_budget`
- `gold.fact_purchase_invoice`
- `gold.dim_date`
- `gold.dim_plant`
- `gold.dim_product`
- `gold.dim_customer`
- `gold.dim_channel`
- `gold.dim_raw`
- `gold.dim_supplier`

Gold-kiht on mõeldud Power BI ja analüüsi jaoks ettevalmistatud andmekihiks.

---

## SQL valideerimine

Power BI tulemusi kontrollitakse SQL-päringutega.

Näiteks Sales Actual vs Sales Budget kontrollitakse:

- kuu tasemel
- aasta tasemel
- tehase tasemel
- tehase ja toote tasemel

Kontrollitavad KPI-d:

- Actual Sales
- Sales Budget
- Variance
- Budget Fulfilment %

SQL-i ja Power BI tulemused peavad andma sama tulemuse.

---

## Python

Pythonit kasutatakse V1-s andmete analüüsimiseks ja tulemuste valideerimiseks.

Python / pandas abil:

- loetakse andmed PostgreSQL-ist
- analüüsitakse Actual vs Budget tulemusi
- arvutatakse kõrvalekaldeid ja täituvust
- kontrollitakse tulemusi SQL-i vastu
- võrreldakse Pythonis saadud tulemusi Power BI tulemustega
- luuakse valitud analüüside jaoks visualiseeringuid

Python lisab projektile sõltumatu analüüsikihi, mille abil saab kontrollida, et sama äriloogika annab eri tööriistades sama tulemuse.

Eesmärk on:

**SQL = Python = Power BI**

---

## Power BI

Power BI juhtimisvaate eesmärk on võimaldada kasutajal liikuda üldiselt detailsemale tasemele.

Näiteks:

**Year → Month → Plant → Product**

Juhtimisvaade keskendub eelkõige kõrvalekallete tuvastamisele ning nende põhjuste analüüsimisele.

Power BI kasutab PostgreSQL Gold-kihi andmeid ning kuvab juhtimiseks vajalikud KPI-d ja drill-down vaated.

---

## V1 eesmärk

V1 on lõputöö kaitsmiseks loodav töötav juhtimisvaade.

V1 sisaldab:

- PostgreSQL andmemudelit
- Bronze ja Gold andmekihte
- Sales Actual vs Budget analüüsi
- Production vs Plan analüüsi
- põhilisi Supply Chain KPI-sid
- SQL-põhist tulemuste valideerimist
- Python / pandas analüüsi ja tulemuste kontrolli
- valitud Python visualiseeringuid
- Power BI juhtimisvaadet
- tulemuste kontrolli SQL-i, Pythoni ja Power BI vahel

V1 eesmärk on näidata terviklikku analüüsiprotsessi alates andmete ettevalmistamisest kuni juhtimisvaate ja tulemuste valideerimiseni.

---

## Projekti edasiarendus

Pikas versioonis on plaanis lisada:

- detailsem toormeplaneerimine
- pelletite BOM ja kuivainemassibilanss
- toorme niiskuse mõju tegelikule sisendkogusele
- lao min/max tasemed ja füüsilised mahupiirangud
- täiendavad OTIF ja delivery KPI-d
- forecast ja snapshot loogika
- automatiseeritud andmevoog
- Python-põhine täiendav analüüs
- Streamlit veebipõhine juhtimisvaade

Pika versiooni eesmärk on arendada lõputööst edasi terviklik Supply Chain Analytics portfoolioprojekt.