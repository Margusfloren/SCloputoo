# SQL

## Eesmärk

Selle kausta SQL-skriptide eesmärk on kontrollida ja valideerida PostgreSQL Gold-kihi andmeid enne nende kasutamist Power BI juhtimisvaates.

SQL-päringuid kasutatakse selleks, et kontrollida:

- kas andmed on õigesti koondatud
- kas Actual ja Budget tulemused klapivad
- kas KPI-de arvutusloogika on korrektne
- kas Power BI kuvab PostgreSQL-is olevate andmetega sama tulemuse

SQL valideerimine on osa projekti kontrolliprotsessist:

**PostgreSQL Gold → SQL validation → Python analysis → Power BI**

---

## Kasutatavad Gold-kihi tabelid

Praegused SQL kontrollpäringud kasutavad peamiselt järgmisi tabeleid:

- `gold.fact_sales`
- `gold.fact_sales_budget`
- `gold.dim_product`

Täiendavad Gold-kihi tabelid lisatakse vastavalt projekti järgmiste analüüsivaldkondade valmimisele.

---

## 01_sales_v1_checks.sql

Fail sisaldab V1 müügi ja müügieelarve kontrollpäringuid.

Kontrollitavad KPI-d:

- Actual Sales
- Sales Budget
- Variance
- Budget Fulfilment %

### Kontrolltasemed

Actual Sales ja Sales Budget tulemusi kontrollitakse järgmistes lõigetes:

1. kuu
2. aasta
3. aasta + tehas
4. aasta + tehas + toode

Kõige detailsemas kontrollis liidetakse juurde ka `gold.dim_product`, et tehnilise `product_id` kõrval oleks nähtav toote kirjeldus ja omadused.

Näiteks:

- product name
- product class
- quality class
- package type
- diameter

---

## KPI-de loogika

### Variance

Müügi ja eelarve erinevus:

`Variance = Actual Sales - Sales Budget`

Positiivne väärtus tähendab, et tegelik müük ületas eelarvet.

Negatiivne väärtus tähendab, et tegelik müük jäi eelarvest väiksemaks.

### Budget Fulfilment %

Eelarve täituvus:

`Budget Fulfilment % = Actual Sales / Sales Budget × 100`

Näiteks:

- 100% = eelarve täidetud
- üle 100% = eelarve ületatud
- alla 100% = eelarve jäi täitmata

SQL-is kasutatakse nulliga jagamise vältimiseks `NULLIF()` funktsiooni.

---

## Drill-down loogika

SQL kontrollid järgivad sama analüüsiloogikat, mida kasutatakse Power BI juhtimisvaates:

**Year → Plant → Product**

See võimaldab kontrollida, kas üldise tulemuse taga olevad erinevused on nähtavad ka detailsemal tasemel.

---

## SQL ja Power BI tulemuste kontroll

SQL-is saadud tulemusi võrreldakse Power BI tulemustega.

Näiteks kontrolliti aastate 2023–2025 Actual Sales tulemusi ning SQL-i ja Power BI tulemused kattusid.

Väikesed erinevused kuvatavates väärtustes võivad tuleneda ümardamisest.

Projekti eesmärk on, et sama äriloogika annaks kõigis analüüsikihtides sama tulemuse:

**SQL = Python = Power BI**

---

## Skriptide kasutamine

SQL-skriptid on kirjutatud PostgreSQL jaoks ning neid saab käivitada näiteks DBeaveris.

Eeldus on, et PostgreSQL andmebaasis on olemas vajalikud Gold-kihi tabelid.

Töövoog:

1. Ava PostgreSQL andmebaasi ühendus DBeaveris.
2. Ava GitHubi repo `sql` kaustast soovitud `.sql` fail.
3. Käivita soovitud kontrollpäring.
4. Võrdle tulemust Power BI või muu analüüsikihi tulemusega.

Praegused V1 kontrollpäringud on andmeid lugevad päringud ning ei muuda Gold-kihi lähteandmeid.

---

## Edasiarendus

V1 järgmistes etappides lisatakse SQL valideerimine ka teistele juhtimisvaldkondadele, näiteks:

- Production Actual vs Plan
- Inventory
- Raw Materials
- OTIF ja Delivery Performance

SQL kaust täieneb koos projekti andmemudeli ja Power BI juhtimisvaate arenguga.