/*
  DEMO DATA for LOUDMOUTH v3.

  A fully canned, offline dataset so the app runs end to end with no API
  keys and no network, for rehearsing the pitch and showing the UI when a
  live source is unavailable. This is illustrative sample content, not
  harvested evidence. Every receipt below is a placeholder written for the
  demo, not a real post, which is why none carry a permalink: the UI shows
  no "view source" link for them and stamps the whole run as DEMO. Culture
  specimens are real scenes, not named individuals, to avoid attributing
  anything invented to a real person. Swap this for live harvests the
  moment a working source is available.
*/

const uk = {
  tensions: [
    { id: "T1", name: "Jaw holds the stress", collision: "Anxiety x Body", currencies: ["EMO", "DAT"], note: "The day's tension surfaces at night as clenching and grinding, read as a health signal with no readout." },
    { id: "T2", name: "Teeth as class tell", collision: "Status x Access", currencies: ["AES", "ECO"], note: "Turkey-teeth aspiration collides with a two-year wait for an NHS dentist. The mouth becomes a marker of what you can afford." },
    { id: "T3", name: "Cheapest health tech", collision: "Tracking x Affordability", currencies: ["DAT", "ECO"], note: "A generation that tracks steps and sleep wants a number for the mouth without paying a clinic to get told off." },
  ],
  expressions: [
    { title: "Two-minute timer as anchor", platform: "Reddit", velocity: 4, tensionId: "T1", summary: "People lean on a fixed brushing timer as the one controllable ritual in an anxious day.", expiry: "Q4 2026", currencyGate: true, sensorGate: true, sensorAngle: "The 2-minute timer is the control ritual they already crave.", evidenceIds: ["E2", "E7"] },
    { title: "Pressure too hard, gums going", platform: "Reddit", velocity: 3, tensionId: "T1", summary: "Years of brushing too hard surface as gum-recession regret and a wish something had warned them.", expiry: "Q1 2027", currencyGate: true, sensorGate: true, sensorAngle: "Pressure sensor answers the gum-recession fear directly.", evidenceIds: ["E3", "E7"] },
    { title: "Turkey teeth regret threads", platform: "Reddit", velocity: 4, tensionId: "T2", summary: "Day-one dazzle turns into can't-eat regret, shared as cautionary tales about cheap cosmetic shortcuts.", expiry: "Q3 2026", currencyGate: true, sensorGate: false, sensorAngle: "Sub-50 price is the honest alternative to a five-grand regret.", evidenceIds: ["E4", "E6"] },
    { title: "Score my mouth like steps", platform: "Reddit", velocity: 3, tensionId: "T3", summary: "Self-trackers notice the mouth is the one organ with no daily number and want one.", expiry: "Q4 2026", currencyGate: true, sensorGate: false, sensorAngle: "App score is the missing daily number for the mouth.", evidenceIds: ["E5", "E1"] },
    { title: "Celebrity smile gossip", platform: "Reddit", velocity: 2, tensionId: "T2", summary: "Threads dissecting famous veneers pull attention but say nothing about anyone's own health behaviour.", expiry: "Q3 2026", currencyGate: false, sensorGate: false, sensorAngle: "No product truth answers celebrity gossip. Loud, strategically empty.", evidenceIds: ["E8", "E4"] },
  ],
  evidence: {
    E1: { id: "E1", source: "reddit (sample)", kind: "post", ctx: "r/CasualUK", text: "Anyone else wake up with their jaw absolutely aching? Grinding in my sleep again, third night running.", score: 214 },
    E2: { id: "E2", source: "reddit (sample)", kind: "comment", ctx: "r/AskUK", text: "Started using a two minute timer and weirdly it is the only part of my day that feels under control.", score: 88 },
    E3: { id: "E3", source: "reddit (sample)", kind: "comment", ctx: "r/britishproblems", text: "Brushed too hard for years, dentist says my gums are receding. Wish something had told me to ease off.", score: 132 },
    E4: { id: "E4", source: "reddit (sample)", kind: "post", ctx: "r/unitedkingdom", text: "Turkey teeth looked unreal on day one, now he can barely eat properly. The regret is real.", score: 340 },
    E5: { id: "E5", source: "reddit (sample)", kind: "comment", ctx: "r/CasualUK", text: "I track my steps, my sleep, my heart rate. Why is my mouth the one thing with no number?", score: 76 },
    E6: { id: "E6", source: "reddit (sample)", kind: "post", ctx: "r/AskUK", text: "Cannot get an NHS dentist for love nor money. Two year waiting list where I am.", score: 512 },
    E7: { id: "E7", source: "reddit (sample)", kind: "comment", ctx: "r/CasualUK", text: "Genuinely just want to know if I am brushing right without paying 60 quid to be told off.", score: 95 },
    E8: { id: "E8", source: "reddit (sample)", kind: "post", ctx: "r/CasualUK", text: "The whitening thing everyone is on about is just influencer nonsense isn't it.", score: 43 },
  },
  culture: {
    categories: [
      { cat: "CREATORS", items: [{ name: "UK get-ready-with-me TikTok", detail: "morning routine format", why: "where mouth-care habits are shown in passing, not lectured" }] },
      { cat: "MUSIC", items: [{ name: "UK drill and Afroswing", detail: "London-led scenes", why: "the register the jaw-tension language borrows from" }] },
      { cat: "SCREEN", items: [{ name: "Love Island", detail: "ITV summer format", why: "where teeth-as-status gets judged in real time" }] },
      { cat: "MOMENTS", items: [{ name: "Turkey teeth backlash", detail: "ongoing 2024-25 discourse", why: "the cautionary tale the affordability angle rides" }] },
    ],
  },
  brief: {
    hook: "Show the 3am jaw unclench, no words, just the wince.",
    format: "POV lo-fi, phone on the pillow, one take.",
    creator: "A micro creator who already posts sleep and anxiety content.",
    caption: "the jaw remembers what the day did. anyone else.",
    success: "Saves and 'this is me' replies outrun likes.",
  },
};

const us = {
  tensions: [
    { id: "T1", name: "Mouth is the last metric", collision: "Tracking x Blind spot", currencies: ["DAT", "EMO"], note: "A generation that quantifies everything has no number for the mouth, and notices the gap." },
    { id: "T2", name: "Dentist is a luxury", collision: "Health x Cost", currencies: ["ECO", "EMO"], note: "Without insurance, routine care becomes a dreaded expense and problems get deferred until they hurt." },
    { id: "T3", name: "Smile as job asset", collision: "Status x Work", currencies: ["AES", "ECO"], note: "Teeth read as employability and dating value, so cosmetic anxiety runs hot on a thin budget." },
  ],
  expressions: [
    { title: "Zyn gum-recession threads", platform: "Reddit", velocity: 4, tensionId: "T1", summary: "Heavy nicotine-pouch users trade worries about receding gums and want a way to see the damage early.", expiry: "Q4 2026", currencyGate: true, sensorGate: true, sensorAngle: "Pressure sensor gives the early readout the pouch anxiety wants.", evidenceIds: ["E1", "E5"] },
    { title: "Timer is the only routine", platform: "Reddit", velocity: 3, tensionId: "T1", summary: "For chaotic schedules the brushing timer is framed as the single reliable two-minute structure.", expiry: "Q1 2027", currencyGate: true, sensorGate: true, sensorAngle: "The 2-minute timer is the one routine that survives a chaotic day.", evidenceIds: ["E2", "E6"] },
    { title: "No insurance, DIY dentistry", platform: "Reddit", velocity: 4, tensionId: "T2", summary: "Uninsured users swap home fixes and prevention tips because a chair visit feels financially out of reach.", expiry: "Q3 2026", currencyGate: true, sensorGate: false, sensorAngle: "Sub-50 price makes prevention the affordable move before the crisis.", evidenceIds: ["E3", "E7"] },
    { title: "Rate my smile for interviews", platform: "Reddit", velocity: 3, tensionId: "T3", summary: "Job seekers ask whether their teeth cost them offers, tying the mouth to income anxiety.", expiry: "Q4 2026", currencyGate: true, sensorGate: false, sensorAngle: "App score reframes the smile as something you can improve, not just judge.", evidenceIds: ["E4", "E7"] },
    { title: "Celebrity veneer discourse", platform: "Reddit", velocity: 2, tensionId: "T3", summary: "Long threads on which stars got veneers pull clicks but do not touch anyone's own habits.", expiry: "Q3 2026", currencyGate: false, sensorGate: false, sensorAngle: "No product truth answers gossip. Attention without behaviour.", evidenceIds: ["E8", "E4"] },
  ],
  evidence: {
    E1: { id: "E1", source: "reddit (sample)", kind: "comment", ctx: "r/Anxiety", text: "Been on the pouches for two years and my gums look like they are pulling back. Freaking out a little.", score: 156 },
    E2: { id: "E2", source: "reddit (sample)", kind: "comment", ctx: "r/getdisciplined", text: "My whole life is a mess but the two minute brush timer is the one thing I never skip now.", score: 91 },
    E3: { id: "E3", source: "reddit (sample)", kind: "post", ctx: "r/povertyfinance", text: "No dental insurance and a cleaning quote came back at 300. So I just... do not go. Prevention is all I got.", score: 402 },
    E4: { id: "E4", source: "reddit (sample)", kind: "post", ctx: "r/dating", text: "Do you think bad teeth actually cost people interviews and dates? Being honest here.", score: 210 },
    E5: { id: "E5", source: "reddit (sample)", kind: "comment", ctx: "r/mildlyinfuriating", text: "I have a ring for my sleep and a watch for my heart. There is nothing that tells me about my mouth.", score: 73 },
    E6: { id: "E6", source: "reddit (sample)", kind: "comment", ctx: "r/getdisciplined", text: "Two minutes twice a day is the smallest promise I can actually keep to myself.", score: 64 },
    E7: { id: "E7", source: "reddit (sample)", kind: "comment", ctx: "r/povertyfinance", text: "Cheaper to spend forty bucks once than a thousand when a tooth finally goes.", score: 118 },
    E8: { id: "E8", source: "reddit (sample)", kind: "post", ctx: "r/mildlyinfuriating", text: "Every single one of them got veneers and now act like they were born with it.", score: 55 },
  },
  culture: {
    categories: [
      { cat: "CREATORS", items: [{ name: "Looksmaxxing TikTok", detail: "self-optimisation format", why: "where the mouth is scored as a feature to fix" }] },
      { cat: "MUSIC", items: [{ name: "Hip hop grill and smile imagery", detail: "long-running visual code", why: "teeth as wealth signal the budget angle argues against" }] },
      { cat: "SCREEN", items: [{ name: "Reality dating shows", detail: "streaming staple", why: "where the smile is openly ranked" }] },
      { cat: "MOMENTS", items: [{ name: "Nicotine pouch health scares", detail: "recurring 2025 discourse", why: "the anxiety the early-readout angle answers" }] },
    ],
  },
  brief: {
    hook: "Close on the gum line in the mirror, caption does the talking.",
    format: "Front camera, natural light, no edit.",
    creator: "Someone who already posts about quitting pouches.",
    caption: "checking my gums every morning now. tell me i am not the only one.",
    success: "Comments asking how to check, not how it looks.",
  },
};

const de = {
  tensions: [
    { id: "T1", name: "Kiefer traegt den Stress", collision: "Angst x Koerper", currencies: ["EMO", "DAT"], note: "Der Druck des Tages zeigt sich nachts als Zaehneknirschen, ein Gesundheitssignal ohne Anzeige." },
    { id: "T2", name: "Zahnarzt kostet Nerven", collision: "Gesundheit x Zugang", currencies: ["ECO", "EMO"], note: "Termine und Zuzahlungen machen Vorsorge zum Stressthema, Probleme werden aufgeschoben." },
    { id: "T3", name: "Daten fuer den Mund", collision: "Tracking x Preis", currencies: ["DAT", "ECO"], note: "Wer Schritte und Schlaf misst, vermisst eine Zahl fuer den Mund, ohne dafuer zu zahlen." },
  ],
  expressions: [
    { title: "Zwei-Minuten-Timer als Halt", platform: "Reddit", velocity: 4, tensionId: "T1", summary: "Der feste Putz-Timer wird als einziges kontrollierbares Ritual eines unruhigen Tages beschrieben.", expiry: "Q4 2026", currencyGate: true, sensorGate: true, sensorAngle: "Der 2-Minuten-Timer ist das Kontrollritual, das sie ohnehin suchen.", evidenceIds: ["E2", "E6"] },
    { title: "Zu fest geputzt, Zahnfleisch weg", platform: "Reddit", velocity: 3, tensionId: "T1", summary: "Jahrelanges zu festes Putzen zeigt sich als Zahnfleischrueckgang und spaete Reue.", expiry: "Q1 2027", currencyGate: true, sensorGate: true, sensorAngle: "Der Drucksensor beantwortet die Angst vor Zahnfleischrueckgang direkt.", evidenceIds: ["E3", "E1"] },
    { title: "Veneers aus der Tuerkei", platform: "Reddit", velocity: 3, tensionId: "T2", summary: "Guenstige Veneers aus dem Ausland kippen von Traum zu Reue, geteilt als Warnung.", expiry: "Q3 2026", currencyGate: true, sensorGate: false, sensorAngle: "Der Preis unter 50 ist die ehrliche Alternative zur teuren Reue.", evidenceIds: ["E4", "E7"] },
    { title: "Mund messen wie Schritte", platform: "Reddit", velocity: 3, tensionId: "T3", summary: "Selbst-Tracker merken, dass der Mund als einziges keine tagliche Zahl hat.", expiry: "Q4 2026", currencyGate: true, sensorGate: false, sensorAngle: "Der App-Score ist die fehlende tagliche Zahl fuer den Mund.", evidenceIds: ["E5", "E1"] },
    { title: "Promi-Laecheln Tratsch", platform: "Reddit", velocity: 2, tensionId: "T2", summary: "Threads ueber Promi-Zaehne holen Klicks, sagen aber nichts ueber eigenes Verhalten.", expiry: "Q3 2026", currencyGate: false, sensorGate: false, sensorAngle: "Keine Produktwahrheit beantwortet Tratsch. Laut, aber leer.", evidenceIds: ["E8", "E4"] },
  ],
  evidence: {
    E1: { id: "E1", source: "reddit (sample)", kind: "post", ctx: "r/de", text: "Wache jede Nacht mit verspanntem Kiefer auf. Knirsche im Schlaf, schon die dritte Nacht.", score: 188 },
    E2: { id: "E2", source: "reddit (sample)", kind: "comment", ctx: "r/FragReddit", text: "Seit ich einen Zwei-Minuten-Timer nutze, ist das der einzige Teil des Tages der sich geordnet anfuehlt.", score: 74 },
    E3: { id: "E3", source: "reddit (sample)", kind: "comment", ctx: "r/germany", text: "Jahrelang zu fest geputzt, jetzt geht das Zahnfleisch zurueck. Haette mir das mal jemand gesagt.", score: 96 },
    E4: { id: "E4", source: "reddit (sample)", kind: "post", ctx: "r/de", text: "Veneers aus der Tuerkei sahen top aus, jetzt kann er kaum noch richtig kauen. Bereue es fuer ihn.", score: 231 },
    E5: { id: "E5", source: "reddit (sample)", kind: "comment", ctx: "r/Finanzen", text: "Ich tracke Schritte, Schlaf, Puls. Warum gibt es fuer den Mund keine einzige Zahl?", score: 61 },
    E6: { id: "E6", source: "reddit (sample)", kind: "comment", ctx: "r/FragReddit", text: "Zwei Minuten morgens und abends sind das kleinste Versprechen das ich wirklich halte.", score: 52 },
    E7: { id: "E7", source: "reddit (sample)", kind: "comment", ctx: "r/Finanzen", text: "Lieber einmal vierzig Euro als spaeter tausend wenn ein Zahn kaputt geht.", score: 88 },
    E8: { id: "E8", source: "reddit (sample)", kind: "post", ctx: "r/de", text: "Die neue Aufhell-Sache von den Influencern ist doch nur Quatsch.", score: 39 },
  },
  culture: {
    categories: [
      { cat: "CREATORS", items: [{ name: "Routine-TikTok auf Deutsch", detail: "Morgenroutine-Format", why: "wo Mundpflege beilaeufig gezeigt wird" }] },
      { cat: "MUSIC", items: [{ name: "Deutschrap", detail: "dominante Jugendszene", why: "der Ton, aus dem die Sprache der Anspannung stammt" }] },
      { cat: "MOMENTS", items: [{ name: "Veneers-aus-der-Tuerkei Debatte", detail: "laufender Diskurs", why: "die Warnung, auf der das Preis-Argument reitet" }] },
    ],
  },
  brief: {
    hook: "Der verspannte Kiefer um 3 Uhr nachts, ohne Worte.",
    format: "POV, Handy auf dem Kissen, eine Einstellung.",
    creator: "Ein kleiner Creator der ueber Schlaf und Stress postet.",
    caption: "der kiefer merkt sich was der tag gemacht hat. nur ich?",
    success: "Speicherungen und 'genau ich' Kommentare vor Likes.",
  },
};

const fr = {
  tensions: [
    { id: "T1", name: "La machoire encaisse", collision: "Anxiete x Corps", currencies: ["EMO", "DAT"], note: "La tension du jour ressort la nuit en bruxisme, un signal de sante sans aucun affichage." },
    { id: "T2", name: "Le dentiste, un luxe", collision: "Sante x Acces", currencies: ["ECO", "EMO"], note: "Prix et rendez-vous rendent la prevention anxiogene, les problemes sont repousses." },
    { id: "T3", name: "Des donnees pour la bouche", collision: "Suivi x Prix", currencies: ["DAT", "ECO"], note: "On suit ses pas et son sommeil, mais la bouche n'a aucun chiffre, sans payer une clinique." },
  ],
  expressions: [
    { title: "Le minuteur comme repere", platform: "Reddit", velocity: 4, tensionId: "T1", summary: "Le minuteur de brossage devient le seul rituel maitrisable d'une journee tendue.", expiry: "Q4 2026", currencyGate: true, sensorGate: true, sensorAngle: "Le minuteur de 2 minutes est le rituel de controle deja recherche.", evidenceIds: ["E2", "E6"] },
    { title: "Brosse trop fort, gencives", platform: "Reddit", velocity: 3, tensionId: "T1", summary: "Un brossage trop appuye pendant des annees ressort en recul des gencives et en regret.", expiry: "Q1 2027", currencyGate: true, sensorGate: true, sensorAngle: "Le capteur de pression repond directement a la peur du recul des gencives.", evidenceIds: ["E3", "E1"] },
    { title: "Facettes en Turquie", platform: "Reddit", velocity: 3, tensionId: "T2", summary: "Les facettes a bas prix a l'etranger passent du reve au regret, partagees comme avertissement.", expiry: "Q3 2026", currencyGate: true, sensorGate: false, sensorAngle: "Le prix sous 50 est l'alternative honnete au regret couteux.", evidenceIds: ["E4", "E7"] },
    { title: "Noter ma bouche comme mes pas", platform: "Reddit", velocity: 3, tensionId: "T3", summary: "Les adeptes du suivi remarquent que la bouche est le seul organe sans chiffre quotidien.", expiry: "Q4 2026", currencyGate: true, sensorGate: false, sensorAngle: "Le score de l'appli est le chiffre quotidien qui manque a la bouche.", evidenceIds: ["E5", "E1"] },
    { title: "Ragots sur les sourires de stars", platform: "Reddit", velocity: 2, tensionId: "T2", summary: "Les fils sur les dents des celebrites font du clic mais ne disent rien des habitudes reelles.", expiry: "Q3 2026", currencyGate: false, sensorGate: false, sensorAngle: "Aucune verite produit ne repond aux ragots. Bruyant, mais vide.", evidenceIds: ["E8", "E4"] },
  ],
  evidence: {
    E1: { id: "E1", source: "reddit (sample)", kind: "post", ctx: "r/france", text: "Je me reveille chaque nuit la machoire serree. Je grince dans mon sommeil, troisieme nuit d'affilee.", score: 174 },
    E2: { id: "E2", source: "reddit (sample)", kind: "comment", ctx: "r/AskFrance", text: "Depuis que j'utilise un minuteur de deux minutes, c'est le seul moment de ma journee qui me semble maitrise.", score: 69 },
    E3: { id: "E3", source: "reddit (sample)", kind: "comment", ctx: "r/france", text: "J'ai brosse trop fort pendant des annees, le dentiste dit que mes gencives reculent. Si seulement on m'avait prevenu.", score: 92 },
    E4: { id: "E4", source: "reddit (sample)", kind: "post", ctx: "r/france", text: "Les facettes en Turquie etaient parfaites le premier jour, maintenant il mange a peine. Le regret est reel.", score: 205 },
    E5: { id: "E5", source: "reddit (sample)", kind: "comment", ctx: "r/vosfinances", text: "Je suis mes pas, mon sommeil, mon coeur. Pourquoi la bouche est la seule chose sans chiffre?", score: 58 },
    E6: { id: "E6", source: "reddit (sample)", kind: "comment", ctx: "r/AskFrance", text: "Deux minutes matin et soir, c'est la plus petite promesse que je tiens vraiment.", score: 47 },
    E7: { id: "E7", source: "reddit (sample)", kind: "comment", ctx: "r/vosfinances", text: "Plutot quarante euros une fois que mille plus tard quand une dent lache.", score: 81 },
    E8: { id: "E8", source: "reddit (sample)", kind: "post", ctx: "r/france", text: "Le nouveau truc de blanchiment des influenceurs, c'est du pipeau non.", score: 36 },
  },
  culture: {
    categories: [
      { cat: "CREATORS", items: [{ name: "TikTok routine du matin", detail: "format get ready", why: "ou les gestes de la bouche se montrent sans lecon" }] },
      { cat: "MUSIC", items: [{ name: "Rap francais et clash", detail: "scene jeune dominante", why: "le registre d'ou vient le langage de la tension" }] },
      { cat: "FASHION", items: [{ name: "Pharmacie francaise beaute", detail: "code soin accessible", why: "le cadre prix-raisonnable que l'angle economique rejoint" }] },
      { cat: "MOMENTS", items: [{ name: "Debat facettes Turquie", detail: "discours en cours", why: "l'avertissement sur lequel s'appuie l'angle prix" }] },
    ],
  },
  brief: {
    hook: "La machoire serree a 3h du matin, sans un mot.",
    format: "POV brut, telephone sur l'oreiller, une prise.",
    creator: "Un petit createur qui parle deja de sommeil et de stress.",
    caption: "la machoire retient ce que la journee a fait. y a que moi?",
    success: "Des enregistrements et des 'c'est moi' plus que des likes.",
  },
};

const es = {
  tensions: [
    { id: "T1", name: "La mandibula aguanta", collision: "Ansiedad x Cuerpo", currencies: ["EMO", "DAT"], note: "La tension del dia sale de noche como bruxismo, una senal de salud sin ninguna lectura." },
    { id: "T2", name: "El dentista es un lujo", collision: "Salud x Acceso", currencies: ["ECO", "EMO"], note: "Precio y citas vuelven la prevencion un estres, y los problemas se aplazan." },
    { id: "T3", name: "Datos para la boca", collision: "Registro x Precio", currencies: ["DAT", "ECO"], note: "Se miden pasos y sueno, pero la boca no tiene ni un numero, sin pagar una clinica." },
  ],
  expressions: [
    { title: "El temporizador como ancla", platform: "Reddit", velocity: 4, tensionId: "T1", summary: "El temporizador de cepillado se vuelve el unico ritual controlable de un dia tenso.", expiry: "Q4 2026", currencyGate: true, sensorGate: true, sensorAngle: "El temporizador de 2 minutos es el ritual de control que ya buscan.", evidenceIds: ["E2", "E6"] },
    { title: "Cepillado fuerte, encias", platform: "Reddit", velocity: 3, tensionId: "T1", summary: "Anos de cepillado demasiado fuerte salen como retraccion de encias y arrepentimiento.", expiry: "Q1 2027", currencyGate: true, sensorGate: true, sensorAngle: "El sensor de presion responde directo al miedo a la retraccion de encias.", evidenceIds: ["E3", "E1"] },
    { title: "Carillas en Turquia", platform: "Reddit", velocity: 3, tensionId: "T2", summary: "Las carillas baratas fuera pasan del sueno al arrepentimiento, compartidas como aviso.", expiry: "Q3 2026", currencyGate: true, sensorGate: false, sensorAngle: "El precio bajo 50 es la alternativa honesta al arrepentimiento caro.", evidenceIds: ["E4", "E7"] },
    { title: "Puntuar mi boca como pasos", platform: "Reddit", velocity: 3, tensionId: "T3", summary: "Los que se miden notan que la boca es el unico organo sin numero diario.", expiry: "Q4 2026", currencyGate: true, sensorGate: false, sensorAngle: "La puntuacion de la app es el numero diario que le falta a la boca.", evidenceIds: ["E5", "E1"] },
    { title: "Cotilleo de sonrisas famosas", platform: "Reddit", velocity: 2, tensionId: "T2", summary: "Los hilos sobre dientes de famosos dan clics pero no dicen nada del habito propio.", expiry: "Q3 2026", currencyGate: false, sensorGate: false, sensorAngle: "Ninguna verdad de producto responde al cotilleo. Ruidoso y vacio.", evidenceIds: ["E8", "E4"] },
  ],
  evidence: {
    E1: { id: "E1", source: "reddit (sample)", kind: "post", ctx: "r/es", text: "Me despierto cada noche con la mandibula apretada. Rechino en suenos, ya van tres noches.", score: 167 },
    E2: { id: "E2", source: "reddit (sample)", kind: "comment", ctx: "r/askspain", text: "Desde que uso un temporizador de dos minutos, es la unica parte del dia que siento bajo control.", score: 66 },
    E3: { id: "E3", source: "reddit (sample)", kind: "comment", ctx: "r/spain", text: "Me cepille muy fuerte durante anos, el dentista dice que las encias se retraen. Ojala alguien me lo hubiera dicho.", score: 89 },
    E4: { id: "E4", source: "reddit (sample)", kind: "post", ctx: "r/es", text: "Las carillas en Turquia se veian perfectas el primer dia, ahora apenas puede comer. El arrepentimiento es real.", score: 198 },
    E5: { id: "E5", source: "reddit (sample)", kind: "comment", ctx: "r/spain", text: "Registro pasos, sueno, pulso. Por que la boca es lo unico sin numero?", score: 54 },
    E6: { id: "E6", source: "reddit (sample)", kind: "comment", ctx: "r/askspain", text: "Dos minutos manana y noche es la promesa mas pequena que de verdad cumplo.", score: 44 },
    E7: { id: "E7", source: "reddit (sample)", kind: "comment", ctx: "r/spain", text: "Mejor cuarenta euros una vez que mil despues cuando se rompe una muela.", score: 77 },
    E8: { id: "E8", source: "reddit (sample)", kind: "post", ctx: "r/es", text: "Lo nuevo de blanqueamiento que promocionan los influencers es una tonteria no.", score: 33 },
  },
  culture: {
    categories: [
      { cat: "CREATORS", items: [{ name: "TikTok de rutina de manana", detail: "formato get ready", why: "donde los habitos de boca se ven de pasada" }] },
      { cat: "MUSIC", items: [{ name: "Reggaeton y urbano", detail: "escena joven dominante", why: "el registro del que sale el lenguaje de la tension" }] },
      { cat: "MOMENTS", items: [{ name: "Debate carillas Turquia", detail: "discurso en curso", why: "el aviso sobre el que va el angulo de precio" }] },
    ],
  },
  brief: {
    hook: "La mandibula apretada a las 3 de la madrugada, sin palabras.",
    format: "POV crudo, movil en la almohada, una toma.",
    creator: "Un micro creador que ya habla de sueno y estres.",
    caption: "la mandibula recuerda lo que hizo el dia. solo yo?",
    success: "Guardados y comentarios de 'soy yo' por encima de likes.",
  },
};

const it = {
  tensions: [
    { id: "T1", name: "La mascella incassa", collision: "Ansia x Corpo", currencies: ["EMO", "DAT"], note: "La tensione del giorno riemerge di notte come bruxismo, un segnale di salute senza alcuna lettura." },
    { id: "T2", name: "Il dentista e un lusso", collision: "Salute x Accesso", currencies: ["ECO", "EMO"], note: "Prezzi e appuntamenti rendono la prevenzione uno stress, i problemi vengono rimandati." },
    { id: "T3", name: "Dati per la bocca", collision: "Tracciamento x Prezzo", currencies: ["DAT", "ECO"], note: "Si misurano passi e sonno, ma la bocca non ha un numero, senza pagare una clinica." },
  ],
  expressions: [
    { title: "Il timer come ancora", platform: "Reddit", velocity: 4, tensionId: "T1", summary: "Il timer dello spazzolino diventa l'unico rituale controllabile di una giornata tesa.", expiry: "Q4 2026", currencyGate: true, sensorGate: true, sensorAngle: "Il timer di 2 minuti e il rituale di controllo che gia cercano.", evidenceIds: ["E2", "E6"] },
    { title: "Spazzolato forte, gengive", platform: "Reddit", velocity: 3, tensionId: "T1", summary: "Anni di spazzolamento troppo forte riemergono come recessione gengivale e rimpianto.", expiry: "Q1 2027", currencyGate: true, sensorGate: true, sensorAngle: "Il sensore di pressione risponde diretto alla paura della recessione gengivale.", evidenceIds: ["E3", "E1"] },
    { title: "Faccette in Turchia", platform: "Reddit", velocity: 3, tensionId: "T2", summary: "Le faccette economiche all'estero passano dal sogno al rimpianto, condivise come monito.", expiry: "Q3 2026", currencyGate: true, sensorGate: false, sensorAngle: "Il prezzo sotto i 50 e l'alternativa onesta al rimpianto costoso.", evidenceIds: ["E4", "E7"] },
    { title: "Dare un voto alla bocca", platform: "Reddit", velocity: 3, tensionId: "T3", summary: "Chi si misura nota che la bocca e l'unico organo senza un numero quotidiano.", expiry: "Q4 2026", currencyGate: true, sensorGate: false, sensorAngle: "Il punteggio dell'app e il numero quotidiano che manca alla bocca.", evidenceIds: ["E5", "E1"] },
    { title: "Gossip sui sorrisi dei vip", platform: "Reddit", velocity: 2, tensionId: "T2", summary: "I thread sui denti dei famosi fanno clic ma non dicono nulla sulle abitudini reali.", expiry: "Q3 2026", currencyGate: false, sensorGate: false, sensorAngle: "Nessuna verita di prodotto risponde al gossip. Rumoroso ma vuoto.", evidenceIds: ["E8", "E4"] },
  ],
  evidence: {
    E1: { id: "E1", source: "reddit (sample)", kind: "post", ctx: "r/italy", text: "Mi sveglio ogni notte con la mascella serrata. Digrigno nel sonno, terza notte di fila.", score: 161 },
    E2: { id: "E2", source: "reddit (sample)", kind: "comment", ctx: "r/Italia", text: "Da quando uso un timer di due minuti, e l'unica parte della giornata che sento sotto controllo.", score: 63 },
    E3: { id: "E3", source: "reddit (sample)", kind: "comment", ctx: "r/italy", text: "Ho spazzolato troppo forte per anni, il dentista dice che le gengive si ritirano. Se solo qualcuno me lo avesse detto.", score: 85 },
    E4: { id: "E4", source: "reddit (sample)", kind: "post", ctx: "r/italy", text: "Le faccette in Turchia erano perfette il primo giorno, ora mangia a fatica. Il rimpianto e reale.", score: 190 },
    E5: { id: "E5", source: "reddit (sample)", kind: "comment", ctx: "r/ItaliaPersonalFinance", text: "Traccio passi, sonno, battito. Perche la bocca e l'unica cosa senza un numero?", score: 51 },
    E6: { id: "E6", source: "reddit (sample)", kind: "comment", ctx: "r/Italia", text: "Due minuti mattina e sera e la promessa piu piccola che mantengo davvero.", score: 42 },
    E7: { id: "E7", source: "reddit (sample)", kind: "comment", ctx: "r/ItaliaPersonalFinance", text: "Meglio quaranta euro una volta che mille dopo quando un dente cede.", score: 74 },
    E8: { id: "E8", source: "reddit (sample)", kind: "post", ctx: "r/italy", text: "La nuova cosa dello sbiancamento degli influencer e una sciocchezza no.", score: 31 },
  },
  culture: {
    categories: [
      { cat: "CREATORS", items: [{ name: "TikTok routine del mattino", detail: "formato get ready", why: "dove i gesti per la bocca si mostrano di sfuggita" }] },
      { cat: "MUSIC", items: [{ name: "Trap italiana", detail: "scena giovane dominante", why: "il registro da cui arriva il linguaggio della tensione" }] },
      { cat: "MOMENTS", items: [{ name: "Dibattito faccette Turchia", detail: "discorso in corso", why: "il monito su cui poggia l'angolo prezzo" }] },
    ],
  },
  brief: {
    hook: "La mascella serrata alle 3 di notte, senza parole.",
    format: "POV grezzo, telefono sul cuscino, una ripresa.",
    creator: "Un micro creator che gia parla di sonno e stress.",
    caption: "la mascella ricorda cosa ha fatto la giornata. solo io?",
    success: "Salvataggi e commenti 'sono io' piu dei like.",
  },
};

// Demo vocabulary per market, illustrative only. Real local terms, but the
// DEMO banner marks the whole run as sample, not a live discovery.
const demoVocab = {
  UK: {
    AES: [{ term: "tooth gems", note: "jewellery on teeth as adornment" }, { term: "grillz revival", note: "mouth as status object" }],
    DAT: [{ term: "streak culture", note: "daily habit tracking" }, { term: "body-tracking apps", note: "quantified self" }],
    EMO: [{ term: "the ick", note: "instant turn-off discourse" }, { term: "jaw clenching", note: "anxiety held in the body" }],
    ECO: [{ term: "dupe culture", note: "cheaper lookalikes" }, { term: "NHS dentist crisis", note: "access read as cost" }],
  },
  US: {
    AES: [{ term: "grillz", note: "mouth adornment" }, { term: "looksmaxxing mouth", note: "optimising the smile" }],
    DAT: [{ term: "streak culture", note: "daily tracking" }, { term: "wearables", note: "quantified body" }],
    EMO: [{ term: "the ick", note: "turn-off discourse" }, { term: "mukbang", note: "eating as performance" }],
    ECO: [{ term: "loud budgeting", note: "openly spending less" }, { term: "dupe culture", note: "cheaper lookalikes" }],
  },
  DE: {
    AES: [{ term: "Tooth Gems", note: "Schmuck auf den Zaehnen" }, { term: "Grillz", note: "Mund als Statusobjekt" }],
    DAT: [{ term: "Streak Kultur", note: "taegliches Tracking" }, { term: "Wearables", note: "quantified self" }],
    EMO: [{ term: "the ick", note: "sofortige Abturn-Debatte" }, { term: "Kiefer Anspannung", note: "Angst im Koerper" }],
    ECO: [{ term: "Dupe Kultur", note: "guenstige Alternativen" }, { term: "Zahnarzt Kosten", note: "Zugang als Kostenfrage" }],
  },
  FR: {
    AES: [{ term: "tooth gems", note: "bijou sur les dents" }, { term: "grillz", note: "bouche comme statut" }],
    DAT: [{ term: "culture du streak", note: "suivi quotidien" }, { term: "wearables", note: "self quantifie" }],
    EMO: [{ term: "the ick", note: "discours du rejet immediat" }, { term: "machoire serree", note: "anxiete dans le corps" }],
    ECO: [{ term: "culture des dupes", note: "alternatives moins cheres" }, { term: "cout dentiste", note: "acces comme cout" }],
  },
  ES: {
    AES: [{ term: "tooth gems", note: "joya en los dientes" }, { term: "grillz", note: "boca como estatus" }],
    DAT: [{ term: "cultura del streak", note: "seguimiento diario" }, { term: "wearables", note: "yo cuantificado" }],
    EMO: [{ term: "the ick", note: "discurso del rechazo inmediato" }, { term: "mandibula apretada", note: "ansiedad en el cuerpo" }],
    ECO: [{ term: "cultura dupe", note: "alternativas mas baratas" }, { term: "coste dentista", note: "acceso como coste" }],
  },
  IT: {
    AES: [{ term: "tooth gems", note: "gioiello sui denti" }, { term: "grillz", note: "bocca come status" }],
    DAT: [{ term: "cultura dello streak", note: "monitoraggio quotidiano" }, { term: "wearables", note: "se quantificato" }],
    EMO: [{ term: "the ick", note: "discorso del rifiuto immediato" }, { term: "mascella serrata", note: "ansia nel corpo" }],
    ECO: [{ term: "cultura dupe", note: "alternative piu economiche" }, { term: "costo dentista", note: "accesso come costo" }],
  },
};

// Sample culture pulse, scaffold placeholders so the layer renders without
// passing off any invented track or meme as a real dated claim.
const samplePulse = () => ({
  tracks: [1, 2, 3, 4, 5].map((i) => ({
    title: `Sample chart track ${i}`,
    artist: "demo",
    source: "demo dataset",
    date: "sample",
    confidence: "low",
    context: i === 1 ? "illustrative, would ride a live sound" : "",
  })),
  memes: ["A", "B", "C"].map((x) => ({
    name: `Sample meme ${x}`,
    description: "placeholder for the live meme layer",
    platform: "demo",
    source: "demo dataset",
    date: "sample",
    confidence: "low",
  })),
});

const markets = { UK: uk, US: us, DE: de, FR: fr, ES: es, IT: it };
for (const [k, v] of Object.entries(markets)) {
  v.vocabulary = demoVocab[k];
  v.pulse = samplePulse();
}

export const DEMO = markets;
