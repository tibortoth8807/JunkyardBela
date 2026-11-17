/** UI texts in Hungarian, English and German. */
import type { PartId } from './game/teardown';

export type Lang = 'hu' | 'en' | 'de';
export const LANGS: Lang[] = ['hu', 'en', 'de'];

export interface Dict {
  docTitle: string;
  title: string;
  subtitle: string;
  intro: string;
  rules: string;
  start: string;
  soundTitle: string;
  footer: string;
  parts: Record<PartId, string>;
  trunkLid: string;
  whichBody: string;
  bodies: { sedan: string; touring: string };
  partsLabel: string;
  hint: string;
  hintDone: string;
  press: string;
  restart: string;
  locked: (names: string) => string;
  doneBanner: string;
  respect: string;
  resultTitle: string;
  resultText: (money: string, time: string, broken: number) => string;
  airbagNote: string;
  share: string;
  again: string;
  copied: string;
  shareFailed: string;
  ratings: [string, string, string];
  quotes: {
    start: string;
    removed: string[];
    locked: (names: string) => string;
    broken: string;
    airbag: string;
    engine: string;
    catalyst: string;
    done: string;
    crushed: string;
  };
  /** Converts a HUF amount for display. */
  money: (huf: number) => string;
  /** GTA-style padded counter. */
  counter: (huf: number) => string;
}

const huf = (n: number) => `${Math.round(n).toLocaleString('hu-HU').replace(/ /g, ' ')} Ft`;
const eur = (n: number, locale: string) => `${Math.round(n / 400).toLocaleString(locale)} €`;

const hu: Dict = {
  docTitle: 'Bontó Béla – E39 bontás',
  title: 'Bontó Béla',
  subtitle: 'E39 bontás',
  intro:
    'Béla telepére megérkezett egy kiöregedett E39. Szedd szét alkatrészenként, és nézd, ahogy pörög a pénz jobb fent!',
  rules:
    'Kattints egy alkatrészre, és csavarozd le – minden kattintás egy csavar. Van, ami csak más alkatrészek után jön le, és van, amit óvatosan kell: a lámpák és a tükör megrepednek, ha túl gyorsan kattintgatsz. A kormányban pedig légzsák lakik…',
  start: 'Bontás indul!',
  soundTitle: 'Hang be/ki',
  footer:
    'Rajongói minijáték, kitalált szereplővel. Nem a BMW terméke és nem kapcsolódik hozzá; logót, emblémát vagy gyári grafikát nem használ. Az árak kitaláltak.',
  parts: {
    wheelFront: 'Első kerék',
    wheelRear: 'Hátsó kerék',
    mirror: 'Visszapillantó',
    headlight: 'Fényszóró',
    taillight: 'Hátsó lámpa',
    frontBumper: 'Első lökhárító',
    rearBumper: 'Hátsó lökhárító',
    hood: 'Motorháztető',
    tailgate: 'Csomagtérajtó',
    frontDoor: 'Első ajtó',
    rearDoor: 'Hátsó ajtó',
    battery: 'Akkumulátor',
    radiator: 'Hűtő',
    engine: 'Motor (2.5 TDS)',
    gearbox: 'Váltó',
    frontSeats: 'Első ülések',
    rearSeat: 'Hátsó ülés',
    steering: 'Kormány (légzsákkal)',
    catalyst: 'Katalizátor',
    exhaust: 'Kipufogó',
  },
  trunkLid: 'Csomagtérfedél',
  whichBody: 'Melyik karosszéria érkezett?',
  bodies: { sedan: 'Szedán', touring: 'Touring (kombi)' },
  partsLabel: 'Alkatrész',
  hint: 'Kattints az alkatrészekre a lecsavarozáshoz. Lámpák, tükör: lassan! Kormány előtt nem árt kikötni az akksit.',
  hintDone: 'Kopasz a kaszni. Mehet a présbe!',
  press: '🗜️ Kaszni a présbe!',
  restart: '↺ Új autó',
  locked: (n) => `Előbb: ${n}`,
  doneBanner: 'BONTÁS KÉSZ!',
  respect: 'tisztelet +',
  resultTitle: 'Mára ennyi, fiam!',
  resultText: (m, t, b) => `${t} alatt ${m} jött össze. Törött alkatrész: ${b}.`,
  airbagNote: 'A légzsák is kioldott – Béla szemöldöke még nőni fog.',
  share: 'Megosztás',
  again: 'Új autó',
  copied: 'Vágólapra másolva!',
  shareFailed: 'Nem sikerült megosztani – másold ki kézzel.',
  ratings: ['Bontókirály 👑', 'Profi bontós 🔧', 'Kezdő csavarlazító 🪛'],
  quotes: {
    start: 'Na, ez az E39 ma megy szét. Hajrá, fiam!',
    removed: [
      'Ez még jó lesz valakinek!',
      'Ezt felrakom a netre, „megkímélt állapot”.',
      'Lassan, de biztosan. Mint a nyugdíjam.',
      'Hallod, ez még gyári csavar!',
      'Ha a vevő fizet, ez nem is volt rozsdás.',
      'Szép munka. Kávészünet viszont nincs.',
      'Ezért dolgozunk, fiam!',
    ],
    locked: (n) => `Nem úgy megy az! Előbb: ${n}.`,
    broken: 'Na tessék, cserépért nem fizet senki. Óvatosabban!',
    airbag: 'DURR! Mondtam, hogy előbb az akksit… Most nézd a szemöldököm!',
    engine: 'A szív! Ennek még 300 ezer van benne, esküszöm.',
    catalyst: 'A kati! Ezért éri meg reggel felkelni.',
    done: 'Kopasz, mint a térdem. Mehet a présbe!',
    crushed: 'Ennyi volt, öreg. Holnap jön a következő.',
  },
  money: huf,
  counter: (n) => `${String(Math.round(n)).padStart(8, '0')} Ft`,
};

const en: Dict = {
  docTitle: 'Junkyard Béla – E39 teardown',
  title: 'Junkyard Béla',
  subtitle: 'E39 teardown',
  intro: 'A tired old E39 just rolled into Béla’s yard. Strip it part by part and watch the cash counter roll up top right!',
  rules:
    'Click a part to unbolt it – every click is one bolt. Some parts only come off after others, and some need a gentle touch: the lights and the mirror crack if you click too fast. And there is an airbag living in that steering wheel…',
  start: 'Start stripping!',
  soundTitle: 'Sound on/off',
  footer:
    'Fan-made mini-game with a fictional character. Not made by or affiliated with BMW; it uses no logos, emblems or official artwork. Prices are made up.',
  parts: {
    wheelFront: 'Front wheel',
    wheelRear: 'Rear wheel',
    mirror: 'Mirror',
    headlight: 'Headlight',
    taillight: 'Tail light',
    frontBumper: 'Front bumper',
    rearBumper: 'Rear bumper',
    hood: 'Hood',
    tailgate: 'Tailgate',
    frontDoor: 'Front door',
    rearDoor: 'Rear door',
    battery: 'Battery',
    radiator: 'Radiator',
    engine: 'Engine (2.5 TDS)',
    gearbox: 'Gearbox',
    frontSeats: 'Front seats',
    rearSeat: 'Rear seat',
    steering: 'Steering wheel (with airbag)',
    catalyst: 'Catalytic converter',
    exhaust: 'Exhaust',
  },
  trunkLid: 'Boot lid',
  whichBody: 'Which body style came in?',
  bodies: { sedan: 'Sedan', touring: 'Touring (estate)' },
  partsLabel: 'Parts',
  hint: 'Click parts to unbolt them. Lights and mirror: slowly! Better disconnect the battery before the steering wheel.',
  hintDone: 'Bare shell. Off to the press!',
  press: '🗜️ Shell into the press!',
  restart: '↺ New car',
  locked: (n) => `First: ${n}`,
  doneBanner: 'TEARDOWN COMPLETE!',
  respect: 'respect +',
  resultTitle: 'That’s it for today, kid!',
  resultText: (m, t, b) => `${m} made in ${t}. Broken parts: ${b}.`,
  airbagNote: 'The airbag went off too – Béla’s eyebrows will grow back.',
  share: 'Share',
  again: 'New car',
  copied: 'Copied to the clipboard!',
  shareFailed: 'Couldn’t share – please copy it by hand.',
  ratings: ['Junkyard king 👑', 'Pro breaker 🔧', 'Rookie bolt-loosener 🪛'],
  quotes: {
    start: 'Right, this E39 comes apart today. Get to it, kid!',
    removed: [
      'Someone will be happy with that!',
      'Going online as “well looked after”.',
      'Slow and steady. Like my pension.',
      'Look at that, still a factory bolt!',
      'If the buyer pays, it was never rusty.',
      'Nice work. Still no coffee break though.',
      'That’s what we’re here for, kid!',
    ],
    locked: (n) => `Not like that! First: ${n}.`,
    broken: 'There you go – nobody pays for shards. Gently!',
    airbag: 'BANG! I said battery first… Look at my eyebrows now!',
    engine: 'The heart! Still 300k kilometres left in it, I swear.',
    catalyst: 'The cat! That’s what gets me out of bed.',
    done: 'Bald as my knee. Off to the press!',
    crushed: 'That’s all, old timer. Next one comes tomorrow.',
  },
  money: (n) => eur(n, 'en-GB'),
  counter: (n) => `€${String(Math.round(n / 400)).padStart(8, '0')}`,
};

const de: Dict = {
  docTitle: 'Schrott-Béla – E39 zerlegen',
  title: 'Schrott-Béla',
  subtitle: 'E39 zerlegen',
  intro: 'Ein müder alter E39 ist auf Bélas Schrottplatz gelandet. Zerleg ihn Teil für Teil und sieh zu, wie oben rechts das Geld hochzählt!',
  rules:
    'Klick auf ein Teil, um es abzuschrauben – jeder Klick ist eine Schraube. Manche Teile gehen erst ab, wenn andere weg sind, und manche brauchen Gefühl: Scheinwerfer und Spiegel springen, wenn du zu schnell klickst. Und im Lenkrad wohnt ein Airbag…',
  start: 'Zerlegen!',
  soundTitle: 'Ton an/aus',
  footer:
    'Fan-Minispiel mit einer erfundenen Figur. Kein Produkt von BMW und nicht mit BMW verbunden; es verwendet keine Logos, Embleme oder Originalgrafiken. Die Preise sind erfunden.',
  parts: {
    wheelFront: 'Vorderrad',
    wheelRear: 'Hinterrad',
    mirror: 'Außenspiegel',
    headlight: 'Scheinwerfer',
    taillight: 'Rückleuchte',
    frontBumper: 'Stoßstange vorn',
    rearBumper: 'Stoßstange hinten',
    hood: 'Motorhaube',
    tailgate: 'Heckklappe',
    frontDoor: 'Vordertür',
    rearDoor: 'Hintertür',
    battery: 'Batterie',
    radiator: 'Kühler',
    engine: 'Motor (2.5 TDS)',
    gearbox: 'Getriebe',
    frontSeats: 'Vordersitze',
    rearSeat: 'Rücksitz',
    steering: 'Lenkrad (mit Airbag)',
    catalyst: 'Katalysator',
    exhaust: 'Auspuff',
  },
  trunkLid: 'Kofferraumdeckel',
  whichBody: 'Welche Karosserie ist angekommen?',
  bodies: { sedan: 'Limousine', touring: 'Touring (Kombi)' },
  partsLabel: 'Teile',
  hint: 'Klick auf die Teile, um sie abzuschrauben. Scheinwerfer und Spiegel: langsam! Vor dem Lenkrad lieber die Batterie abklemmen.',
  hintDone: 'Nackte Karosse. Ab in die Presse!',
  press: '🗜️ Karosse in die Presse!',
  restart: '↺ Neues Auto',
  locked: (n) => `Zuerst: ${n}`,
  doneBanner: 'ZERLEGT!',
  respect: 'Respekt +',
  resultTitle: 'Feierabend, Junge!',
  resultText: (m, t, b) => `${m} in ${t} verdient. Kaputte Teile: ${b}.`,
  airbagNote: 'Der Airbag ist auch losgegangen – Bélas Augenbrauen wachsen nach.',
  share: 'Teilen',
  again: 'Neues Auto',
  copied: 'In die Zwischenablage kopiert!',
  shareFailed: 'Teilen fehlgeschlagen – bitte von Hand kopieren.',
  ratings: ['Schrottkönig 👑', 'Profi-Verwerter 🔧', 'Schrauben-Anfänger 🪛'],
  quotes: {
    start: 'So, der E39 wird heute zerlegt. Ran an die Arbeit, Junge!',
    removed: [
      'Da freut sich noch jemand drüber!',
      'Kommt online als „gepflegter Zustand“.',
      'Langsam, aber sicher. Wie meine Rente.',
      'Schau mal, noch die Werksschraube!',
      'Wenn der Kunde zahlt, war das nie rostig.',
      'Gute Arbeit. Kaffeepause gibt’s trotzdem nicht.',
      'Dafür sind wir hier, Junge!',
    ],
    locked: (n) => `So nicht! Zuerst: ${n}.`,
    broken: 'Na bitte – für Scherben zahlt keiner. Vorsichtiger!',
    airbag: 'PENG! Ich hab doch gesagt, erst die Batterie… Schau dir meine Augenbrauen an!',
    engine: 'Das Herz! Da sind noch 300.000 km drin, ehrlich.',
    catalyst: 'Der Kat! Dafür lohnt sich das Aufstehen.',
    done: 'Kahl wie mein Knie. Ab in die Presse!',
    crushed: 'Das war’s, Alter. Morgen kommt der Nächste.',
  },
  money: (n) => eur(n, 'de-DE'),
  counter: (n) => `€${String(Math.round(n / 400)).padStart(8, '0')}`,
};

export const DICTS: Record<Lang, Dict> = { hu, en, de };

export function detectLang(): Lang {
  try {
    const saved = localStorage.getItem('bela-lang');
    if (saved === 'hu' || saved === 'en' || saved === 'de') return saved;
  } catch {
    // storage unavailable
  }
  const nav = (navigator.language || 'hu').slice(0, 2);
  return nav === 'de' ? 'de' : nav === 'hu' ? 'hu' : 'en';
}

export function saveLang(lang: Lang): void {
  try {
    localStorage.setItem('bela-lang', lang);
  } catch {
    // ignore
  }
}
