## Installation:
Installera mongoDB

Du kan även behöva besöka APIet via webbläsaren en gång för att acceptera det egensignerade https certifikatet.

## Frågor:
1. Jag har implementerat HATEOAS genom att skicka med länkar till olika resurser som tillhör det man requestat. Det finns även instruktioner och förklaringar för de olika länkarna, samt vilken HTTP metod och hur headern ska se ut. Detta är för att förenkla för användaren av APIet då det blir ganska självförklarande hur det kan användas.

2. Det skulle jag nog hanterat genom content negotiation där man kan välja vad man vill ha för representation av objektet. Då skulle jag genom user agents i headern kunna specificera vilken version jag vill ha av objektet. Detta kan exempelvis vara olika språk.

3. Jag valde att använda mig av json web tokens för att det är ganska snabbt att implementera, inte behöver cookies, enkelt att använda och sätta sig in i. JWT med känslig information bör inte skickas genom HTTP. Skickas det däremot över HTTPS är JWT krypterat. Att skicka en JWT token över HTTPS ska vara säkrare än att endast skicka användarnamn och lösenord då en JWT har många tecken och är mer oläsligt än vanlig text. Några nackdelar med JWT är att dess tokens har en storleksbegränsning, tokens kan inte sägas upp och därmed bör tokens ha ett kort datum.

4. I APIet så kan en webhook adress registreras av en autentisierad användare. Varje gång en fångst läggs till så triggas webhooken och skickar en POST till alla payload adresser. Alla användare kan skapa en eller flera payload urler.

5. Jag skulle vilja ha löst registreringen med webhooks på ett bättre sätt genom att spara i databas istället för en json-fil. Jag skulle även vilja ha gjort att webhooks kan tas bort eller redigeras.

6. Kan skapa en användare med ett valfritt användarnamn och lösenord
