// Rangi: co 20 piw nowy poziom. Indeks i = piwa od i*20. Przedostatnia: 2120-2136, ostatnia: 2137+
const RANKS=[
'Abstynent','Stażysta','Praktykant','Degustator-amator','Piwny Raczkujący','Kapsel Ucznia','Piwosz Okazjonalny','Znawca Pianki','Kolega z Podwórka','Bywalec Ogródka',
'Czeladnik Chmielu','Pomocnik Piwowara','Wąsacz Początkujący','Fan Kapsla','Specjalista od Gorzkiego','Sąsiad z Ławeczki','Stały Klient Monopolowego','Ekspert od Piany','Poszukiwacz IPA','Łowca Promocji',
'Mistrz Czeladniczy','Ambasador Lagera','Doktor Chmielu','Magister Słodu','Znawca Stoutów','Zdobywca Kufla','Pan Kierownik Piwoszów','Rycerz Kufla','Baron Pianki','Hrabia Chmielu',
'Książę Fermentacji','Wielki Książę Lagera','Lord Gorycz','Sir Kapsel','Mistrz Browaru','Generał Piany','Marszałek Butelki','Admirał Kufla','Wódz Chmielowego Plemienia','Szaman Słodu',
'Strażnik Tanków','Piwna Legenda Osiedla','Król Ławeczki','Cesarz Pianki','Mistrz Zacieru','Arcymistrz Nalewania','Człowiek-Keg','Chodząca Beczka','Pogromca Paletek','Mózg Piwnego Podziemia',
'Szef Kuchni Chmielowej','Dyrektor Naczelny Kufla','Prezes Kapsli','Wielki Mistrz Pianki','Czarodziej Chmielu','Alchemik Słodu','Smok Spiżarni','Tytan Lodówki','Piwny Półbóg','Heros Gorzkości',
'Bóg Piany','Bogowie Browaru','Piwny Archanioł','Patron Barów','Święty Florian Kufla','Wielki Inkwizytor Wody','Pogromca Pragnienia','Strażnik Wiecznej Pianki','Mistrz Jedi Chmielu','Gandalf Piwowarów',
'Yoda Kufla','Terminator Półlitrówek','Rambo Rozlewni','Chuck Norris Chmielu','Syzyf Lodówki','Herkules Skrzynek','Atlas Browaru','Bohater Tysiąca Kapsli','Odkrywca Piwnych Wszechświatów','Kolumb Piwoszy',
'Kapitan Bursztynu','Admirał Pianki Galaktycznej','Pionier Kosmicznego Browaru','Astronauta Chmielu','Pan Pienistego Wszechświata','Piwny Sensei','Wielki Mistrz Zakonu Kufla','Najwyższy Kapłan Chmielu','Prorok Pianki','Oświecony Piwosz',
'Nirwana Kufla','Zen-Mistrz Gorzkości','Piwna Wieczność','Legenda Nad Legendami','Mit Browarów','Pomnik Ławeczki','Cud Nad Wisłą (Piwną)','Muzeum Chmielu','Wiecznie Żywy Kufel','Najwyższy Sędzia Smaku',
'Setka Setek','Człowiek-Legenda 2.0','Piwowarski Hall of Fame','Żywa Encyklopedia Piwa','Król Królów Chmielu','Gigant Pianki','Prawie Papież','Piwny Papież 2137'
];
function rankIndex(n){return n>=2137?RANKS.length-1:Math.min(RANKS.length-2,Math.floor(n/20));}
function rankFrom(i){return i>=RANKS.length-1?2137:i===RANKS.length-2?2120:i*20;}
function rankTo(i){return i>=RANKS.length-1?null:i===RANKS.length-2?2137:(i+1)*20;}
function rangeLabel(i){const t=rankTo(i);return t===null?'2137+':rankFrom(i)+'–'+(t-1);}
