# V1 KPI-d

V1 on pelletite müügi ja tootmise tulemuslikkuse juhtimisvaade, mis kasutab sünteetilisi andmeid aastatest 2023–2025.

## Müük

- **Sales Actual, t** – tegelik müügikogus.
- **Sales Budget, t** – eelarvestatud müügikogus.
- **Sales Variance, t** – Sales Actual − Sales Budget.
- **Sales Attainment, %** – Sales Actual / Sales Budget (kui eelarve võimaldab suhtarvu arvutada).

Müüki ja müügieelarvet saab analüüsida ka **müügikanali lõikes**, sest eelarve on kanalitele jaotatud ning filtreerimiseks kasutatakse `dim_channel` dimensiooni.

## Tootmine

- **Production Actual, t** – tegelik tootmiskogus.
- **Production Budget, t** – eelarvestatud tootmiskogus.
- **Production Variance, t** – Production Actual − Production Budget.
- **Production Attainment, %** – Production Actual / Production Budget (kui eelarve võimaldab suhtarvu arvutada).

Tootmisele ei ole omistatud müügikanalit.

## Tootmise ja müügi tasakaal

- **Production vs Sales, t** – Production Actual − Sales Actual.
- **Production vs Sales, %** – Production Actual / Sales Actual (kui müügikogus võimaldab suhtarvu arvutada).

V1 Dashboardi ja QA Validationi tasakaaluvõrdluses kasutatakse **kõigi kanalite müüki**, sõltumata valitud müügikanalist. See näitaja **ei ole laoseisu mõõdik**: varude täpseks analüüsiks on vaja ka algvaru ja muid laoliikumisi.

## Vaated ja filtrid

V1 sisaldab valitud perioodi mõõdikuid, Actual vs Budget võrdlusi, kõrvalekaldeid ning aasta, kuu, tehase ja toote filtreid. Müügikanali filter mõjutab müügi analüüsi, mitte tootmiskoguse jaotust.

## V1 piirang

**OTIF (On-Time In-Full) ei ole V1-s rakendatud.** Tellimuste õigeaegse ja täieliku täitmise analüüs on kavandatud V2-sse.
