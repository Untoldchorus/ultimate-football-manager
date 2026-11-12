/**
 * Batch 3: Complete 2024/25 – 2025/26 Official Club Directory for:
 * 11. United States (MLS 30 + USL Championship 24 = 54 clubs)
 * 12. Saudi Arabia (Saudi Pro League 18 + Saudi First Division 18 = 36 clubs)
 * 13. Turkey (Süper Lig 19 + 1. Lig 20 = 39 clubs)
 * 14. Belgium (Belgian Pro League 16 + Challenger Pro League 16 = 32 clubs)
 * 15. Scotland (Scottish Premiership 12 + Scottish Championship 10 = 22 clubs)
 * 16. Austria (Austrian Bundesliga 12 + 2. Liga 16 = 28 clubs)
 * 17. Switzerland (Swiss Super League 12 + Swiss Challenge League 10 = 22 clubs)
 * 18. Denmark (Danish Superliga 12 + 1st Division 12 = 24 clubs)
 * 19. Japan (J1 League 20 + J2 League 20 = 40 clubs)
 * 20. South Korea (K League 1 12 + K League 2 14 = 26 clubs)
 * Total in Batch 3: 323 real participating clubs.
 * Combined Across All 40 Divisions: 198 + 211 + 323 = 732 real participating clubs.
 */

import { CompactClubTuple } from './europeTop5';

export const GLOBAL_CONTENDERS_LEAGUE_CLUBS: Record<string, CompactClubTuple[]> = {
  // ============================================================================
  // 11A. UNITED STATES — MAJOR LEAGUE SOCCER (MLS, 30 Clubs)
  // ============================================================================
  'usa-mls': [
    ['usa-mls-atl', 'Atlanta United FC', 'ATL', 'Atlanta', 'Mercedes-Benz Stadium', 42500, 2014, '#80000A', '#000000', 76, 'Ronny Deila', ['Brad Guzan', 'Stian Gregersen', 'Bartosz Slisz', 'Aleksei Miranchuk', 'Saba Lobjanidze', 'Miguel Almirón', 'Emmanuel Latte Lath']],
    ['usa-mls-atx', 'Austin FC', 'ATX', 'Austin', 'Q2 Stadium', 20738, 2018, '#00B140', '#000000', 73, 'Nico Estévez', ['Brad Stuver', 'Sebastián Driussi', 'Osman Bukari', 'Brandon Vázquez']],
    ['usa-mls-clt', 'Charlotte FC', 'CLT', 'Charlotte', 'Bank of America Stadium', 38000, 2019, '#0085CA', '#000000', 74, 'Dean Smith', ['Kristijan Kahlina', 'Tim Ream', 'Ashley Westwood', 'Pep Biel', 'Liel Abada', 'Patrick Agyemang']],
    ['usa-mls-chi', 'Chicago Fire FC', 'CHI', 'Chicago', 'Soldier Field', 24995, 1997, '#C51D34', '#0A1E40', 72, 'Gregg Berhalter', ['Chris Brady', 'Andrew Gutman', 'Kellyn Acosta', 'Hugo Cuypers']],
    ['usa-mls-cin', 'FC Cincinnati', 'CIN', 'Cincinnati', 'TQL Stadium', 26000, 2015, '#F05323', '#003087', 77, 'Pat Noonan', ['Roman Celentano', 'Miles Robinson', 'Obinna Nwobodo', 'Luciano Acosta', 'Luca Orellano', 'Kévin Denkey']],
    ['usa-mls-col', 'Colorado Rapids', 'COL', 'Commerce City', 'Dick’s Sporting Goods Park', 18061, 1995, '#8A1538', '#87CEEB', 73, 'Chris Armas', ['Zack Steffen', 'Cole Bassett', 'Djordje Mihailovic', 'Rafael Navarro']],
    ['usa-mls-clb', 'Columbus Crew', 'CLB', 'Columbus', 'Lower.com Field', 20371, 1994, '#FFCC00', '#000000', 79, 'Wilfried Nancy', ['Patrick Schulte', 'Steven Moreira', 'Darlington Nagbe', 'Diego Rossi', 'Cucho Hernández', 'Christian Ramirez']],
    ['usa-mls-dc', 'D.C. United', 'DCU', 'Washington, D.C.', 'Audi Field', 20000, 1995, '#000000', '#E30613', 72, 'Troy Lesesne', ['Christian Benteke', 'Mateusz Klich', 'Aaron Herrera']],
    ['usa-mls-dal', 'FC Dallas', 'DAL', 'Frisco', 'Toyota Stadium', 20500, 1995, '#E30613', '#00205B', 73, 'Eric Quill', ['Maarten Paes', 'Sebastián Lletget', 'Petar Musa', 'Jesús Ferreira']],
    ['usa-mls-hou', 'Houston Dynamo FC', 'HOU', 'Houston', 'Shell Energy Stadium', 22039, 2005, '#FF6600', '#000000', 74, 'Ben Olsen', ['Steve Clark', 'Erik Sviatchenko', 'Artur', 'Amine Bassi', 'Ezequiel Ponce']],
    ['club-granite', 'Inter Miami CF', 'MIA', 'Miami', 'Chase Stadium', 21550, 2018, '#F7B5CD', '#231F20', 81, 'Javier Mascherano'],
    ['usa-mls-lag', 'LA Galaxy', 'LAG', 'Carson', 'Dignity Health Sports Park', 27000, 1994, '#00245D', '#FFD200', 79, 'Greg Vanney', ['John McCarthy', 'Maya Yoshida', 'Riqui Puig', 'Marco Reus', 'Gabriel Pec', 'Joseph Paintsil', 'Dejan Joveljić']],
    ['usa-mls-lafc', 'Los Angeles FC', 'LAFC', 'Los Angeles', 'BMO Stadium', 22000, 2014, '#000000', '#D4AF37', 79, 'Steve Cherundolo', ['Hugo Lloris', 'Aaron Long', 'Ilie Sánchez', 'Timothy Tillman', 'Denis Bouanga', 'Olivier Giroud', 'Cristian Olivera']],
    ['usa-mls-min', 'Minnesota United FC', 'MIN', 'Saint Paul', 'Allianz Field', 19400, 2015, '#87CEEB', '#000000', 74, 'Eric Ramsay', ['Dayne St. Clair', 'Michael Boxall', 'Robin Lod', 'Teemu Pukki', 'Kelvin Yeboah']],
    ['usa-mls-mtl', 'CF Montréal', 'MTL', 'Montreal', 'Stade Saputo', 19619, 2010, '#003399', '#000000', 72, 'Laurent Courtois', ['Jonathan Sirois', 'Joel Waterman', 'Samuel Piette', 'Caden Clark', 'Josef Martínez']],
    ['usa-mls-nsh', 'Nashville SC', 'NSH', 'Nashville', 'Geodis Park', 30000, 2016, '#FFCC00', '#00205B', 73, 'B.J. Callaghan', ['Joe Willis', 'Walker Zimmerman', 'Hany Mukhtar', 'Sam Surridge']],
    ['usa-mls-ne', 'New England Revolution', 'NER', 'Foxborough', 'Gillette Stadium', 20000, 1995, '#0A1E40', '#E30613', 73, 'Caleb Porter', ['Aljaž Ivačič', 'Carles Gil', 'Luca Langoni', 'Giacomo Vrioni']],
    ['usa-mls-nyc', 'New York City FC', 'NYC', 'New York', 'Yankee Stadium', 28000, 2013, '#6CADDF', '#041E42', 76, 'Pascal Jansen', ['Matt Freese', 'Thiago Martins', 'James Sands', 'Santiago Rodríguez', 'Alonso Martínez']],
    ['usa-mls-nyrb', 'New York Red Bulls', 'RBNY', 'Harrison', 'Sports Illustrated Stadium', 25000, 1994, '#E30613', '#FFFFFF', 76, 'Sandro Schwarz', ['Carlos Coronel', 'Sean Nealis', 'Emil Forsberg', 'Lewis Morgan', 'Eric Maxim Choupo-Moting', 'Dante Vanzeir']],
    ['usa-mls-orl', 'Orlando City SC', 'ORL', 'Orlando', 'Inter&Co Stadium', 25500, 2013, '#633492', '#D4AF37', 76, 'Óscar Pareja', ['Pedro Gallese', 'Robin Jansson', 'César Araújo', 'Martín Ojeda', 'Facundo Torres', 'Ramiro Enrique', 'Luis Muriel']],
    ['usa-mls-phi', 'Philadelphia Union', 'PHI', 'Chester', 'Subaru Park', 18500, 2008, '#002D62', '#D4AF37', 75, 'Bradley Carnell', ['Andre Blake', 'Kai Wagner', 'Alejandro Bedoya', 'Dániel Gazdag', 'Mikael Uhre', 'Tai Baribo']],
    ['usa-mls-por', 'Portland Timbers', 'POR', 'Portland', 'Providence Park', 25218, 2009, '#004812', '#D69A00', 75, 'Phil Neville', ['Maxime Crépeau', 'Evander Ferreira', 'Jonathan Rodríguez', 'Santiago Moreno', 'Felipe Mora']],
    ['usa-mls-rsl', 'Real Salt Lake', 'RSL', 'Sandy', 'America First Field', 20213, 2004, '#B30838', '#013A81', 75, 'Pablo Mastroeni', ['Zac MacMath', 'Justen Glad', 'Diego Luna', 'Diogo Gonçalves', 'Chicho Arango']],
    ['usa-mls-sd', 'San Diego FC', 'SDFC', 'San Diego', 'Snapdragon Stadium', 35000, 2023, '#00205B', '#C0C0C0', 74, 'Mikey Varas', ['CJ dos Santos', 'Paddy McNair', 'Luca de la Torre', 'Hirving Lozano', 'Marcus Ingvartsen']],
    ['usa-mls-sj', 'San Jose Earthquakes', 'SJE', 'San Jose', 'PayPal Park', 18000, 1994, '#0055A4', '#000000', 71, 'Bruce Arena', ['Daniel', 'Cristian Espinoza', 'Hernán López', 'Jeremy Ebobisse']],
    ['usa-mls-sea', 'Seattle Sounders FC', 'SEA', 'Seattle', 'Lumen Field', 37722, 2007, '#5D9741', '#005595', 77, 'Brian Schmetzer', ['Stefan Frei', 'Jackson Ragen', 'Nouhou Tolo', 'Cristian Roldan', 'Albert Rusnák', 'Pedro de la Vega', 'Jordan Morris', 'Jesús Ferreira']],
    ['usa-mls-skc', 'Sporting Kansas City', 'SKC', 'Kansas City', 'Children’s Mercy Park', 18467, 1995, '#93B1D7', '#002F65', 73, 'Peter Vermes', ['Tim Melia', 'Erik Thommy', 'Dániel Sallói', 'William Agada']],
    ['usa-mls-stl', 'St. Louis City SC', 'STL', 'St. Louis', 'Energizer Park', 22423, 2019, '#E30613', '#00205B', 74, 'Olof Mellberg', ['Roman Bürki', 'Eduard Löwen', 'Marcel Hartel', 'Cedric Teuchert', 'João Klauss']],
    ['usa-mls-tor', 'Toronto FC', 'TOR', 'Toronto', 'BMO Field', 28351, 2005, '#E31937', '#FFFFFF', 73, 'Robin Fraser', ['Sean Johnson', 'Richie Laryea', 'Jonathan Osorio', 'Federico Bernardeschi', 'Lorenzo Insigne']],
    ['usa-mls-van', 'Vancouver Whitecaps FC', 'VAN', 'Vancouver', 'BC Place', 22120, 2009, '#00245E', '#9DC2EA', 75, 'Jesper Sørensen', ['Yohei Takaoka', 'Ranko Veselinović', 'Andrés Cubas', 'Stuart Armstrong', 'Ryan Gauld', 'Brian White']],
  ],

  // ============================================================================
  // 11B. UNITED STATES — USL CHAMPIONSHIP (24 Clubs)
  // ============================================================================
  'usa-usl': [
    ['usa-usl-bhm', 'Birmingham Legion FC', 'BHM', 'Birmingham', 'Protective Stadium', 47100, 2017, '#000000', '#D4AF37', 65, 'Tom Soehn'],
    ['usa-usl-chs', 'Charleston Battery', 'CHS', 'Mount Pleasant', 'Patriots Point Soccer Complex', 5000, 1993, '#FFCC00', '#000000', 67, 'Ben Pirmann'],
    ['usa-usl-col', 'Colorado Springs Switchbacks FC', 'COS', 'Colorado Springs', 'Weidner Field', 8000, 2013, '#000000', '#009FE3', 67, 'James Chambers'],
    ['usa-usl-det', 'Detroit City FC', 'DET', 'Hamtramck', 'Keyworth Stadium', 7933, 2012, '#8A1538', '#D4AF37', 66, 'Danny Dichio'],
    ['usa-usl-elp', 'El Paso Locomotive FC', 'ELP', 'El Paso', 'Southwest University Park', 9500, 2018, '#002D62', '#87CEEB', 65, 'Wilmer Cabrera'],
    ['usa-usl-hfd', 'Hartford Athletic', 'HFD', 'Hartford', 'Trinity Health Stadium', 5500, 2018, '#008000', '#002D62', 64, 'Brendan Burke'],
    ['usa-usl-ind', 'Indy Eleven', 'IND', 'Indianapolis', 'Michael A. Carroll Stadium', 10524, 2013, '#002D62', '#E30613', 66, 'Sean McAuley'],
    ['usa-usl-lv', 'Las Vegas Lights FC', 'LVL', 'Las Vegas', 'Cashman Field', 9334, 2017, '#000000', '#FF69B4', 65, 'Antonio Nocerino'],
    ['usa-usl-lex', 'Lexington SC', 'LEX', 'Lexington', 'Lexington SC Stadium', 7500, 2021, '#008000', '#000000', 64, 'Terry Boss'],
    ['usa-usl-loud', 'Loudoun United FC', 'LDN', 'Leesburg', 'Segra Field', 5000, 2018, '#E30613', '#000000', 64, 'Ryan Martin'],
    ['usa-usl-lou', 'Louisville City FC', 'LOU', 'Louisville', 'Lynn Family Stadium', 15304, 2014, '#5E2784', '#D4AF37', 68, 'Danny Cruz'],
    ['usa-usl-mia', 'Miami FC', 'MFC', 'Miami', 'FIU Stadium', 20000, 2015, '#009FE3', '#FF6600', 63, 'Gastón Maddoni'],
    ['usa-usl-mb', 'Monterey Bay FC', 'MB', 'Seaside', 'Cardinale Stadium', 6000, 2021, '#002D62', '#87CEEB', 64, 'Jordan Stewart'],
    ['usa-usl-nm', 'New Mexico United', 'NMU', 'Albuquerque', 'Isotopes Park', 13500, 2018, '#FFCC00', '#000000', 66, 'Dennis Sanchez'],
    ['usa-usl-nc', 'North Carolina FC', 'NC', 'Cary', 'WakeMed Soccer Park', 10000, 2006, '#002D62', '#D4AF37', 65, 'John Bradford'],
    ['usa-usl-oak', 'Oakland Roots SC', 'OAK', 'Oakland', 'Oakland Coliseum', 15000, 2018, '#000000', '#00A650', 65, 'Gavin Glinton'],
    ['usa-usl-oc', 'Orange County SC', 'OC', 'Irvine', 'Championship Soccer Stadium', 5000, 2010, '#FF6600', '#000000', 66, 'Danny Stone'],
    ['usa-usl-phx', 'Phoenix Rising FC', 'PHX', 'Phoenix', 'Phoenix Rising Soccer Stadium', 10000, 2014, '#E30613', '#000000', 67, 'Pa-Modou Kah'],
    ['usa-usl-pit', 'Pittsburgh Riverhounds SC', 'PIT', 'Pittsburgh', 'Highmark Stadium', 5000, 1998, '#FFCC00', '#000000', 66, 'Bob Lilley'],
    ['usa-usl-ri', 'Rhode Island FC', 'RIFC', 'Pawtucket', 'Tidewater Landing Stadium', 10500, 2019, '#FFCC00', '#002D62', 66, 'Khano Smith'],
    ['usa-usl-sac', 'Sacramento Republic FC', 'SAC', 'Sacramento', 'Heart Health Park', 11569, 2012, '#8A1538', '#FFFFFF', 67, 'Neill Collins'],
    ['usa-usl-sa', 'San Antonio FC', 'SA', 'San Antonio', 'Toyota Field', 8296, 2016, '#000000', '#E30613', 66, 'Carlos Llamosa'],
    ['usa-usl-tbr', 'Tampa Bay Rowdies', 'TBR', 'St. Petersburg', 'Al Lang Stadium', 7227, 2008, '#008000', '#FFCC00', 67, 'Robbie Neilson'],
    ['usa-usl-tul', 'FC Tulsa', 'TUL', 'Tulsa', 'ONEOK Field', 7833, 2013, '#000000', '#D4AF37', 65, 'Luke Spencer'],
  ],

  // ============================================================================
  // 12A. SAUDI ARABIA — SAUDI PRO LEAGUE (18 Clubs)
  // ============================================================================
  'sau-spl': [
    ['sau-spl-ahl', 'Al-Ahli Saudi FC', 'AHL', 'Jeddah', 'King Abdullah Sports City', 62345, 1937, '#008000', '#FFFFFF', 81, 'Matthias Jaissle', ['Édouard Mendy', 'Roger Ibañez', 'Merih Demiral', 'Franck Kessié', 'Gabri Veiga', 'Riyad Mahrez', 'Roberto Firmino', 'Ivan Toney']],
    ['sau-spl-ett', 'Al-Ettifaq FC', 'ETT', 'Dammam', 'EGO Stadium', 15000, 1945, '#008000', '#E30613', 75, 'Saad Al-Shehri', ['Marek Rodák', 'Georginio Wijnaldum', 'Seko Fofana', 'Demarai Gray', 'Moussa Dembélé', 'Karl Toko Ekambi']],
    ['sau-spl-fat', 'Al-Fateh SC', 'FAT', 'Al-Mubarraz', 'Al-Fateh Club Stadium', 11000, 1958, '#0055A4', '#008000', 71, 'José Gomes'],
    ['sau-spl-fay', 'Al-Fayha FC', 'FAY', 'Al Majma’ah', 'Al Majma’ah Sports City', 7000, 1953, '#FF6600', '#003399', 71, 'Pedro Emanuel', ['Chris Smalling', 'Fashion Sakala', 'Henry Onyekuru']],
    ['club-meadow', 'Al-Hilal SFC', 'HIL', 'Riyadh', 'Kingdom Arena', 30000, 1957, '#004B9B', '#FFFFFF', 84, 'Jorge Jesus'],
    ['sau-spl-itt', 'Al-Ittihad Club', 'ITT', 'Jeddah', 'King Abdullah Sports City', 62345, 1927, '#FFCC00', '#000000', 82, 'Laurent Blanc', ['Predrag Rajković', 'Danilo Pereira', 'Mario Mitaj', 'N’Golo Kanté', 'Fabinho Tavares', 'Houssem Aouar', 'Moussa Diaby', 'Steven Bergwijn', 'Karim Benzema']],
    ['sau-spl-kha', 'Al-Khaleej FC', 'KHA', 'Saihat', 'Prince Mohamed bin Fahd Stadium', 26000, 1945, '#FFCC00', '#008000', 70, 'Georgios Donis', ['Ibrahim Šehić', 'Kostas Fortounis', 'Fábio Martins']],
    ['sau-spl-khl', 'Al-Kholood Club', 'KHL', 'Ar Rass', 'Al-Hazem Club Stadium', 8000, 1970, '#E30613', '#008000', 69, 'Noureddine Zekri'],
    ['sau-spl-nas', 'Al-Nassr FC', 'NAS', 'Riyadh', 'Al-Awwal Park', 25000, 1955, '#FFCC00', '#003399', 83, 'Stefano Pioli', ['Bento Krepski', 'Aymeric Laporte', 'Mohamed Simakan', 'Sultan Al-Ghannam', 'Marcelo Brozović', 'Otávio Monteiro', 'Sadio Mané', 'Ângelo Gabriel', 'Jhon Durán', 'Cristiano Ronaldo']],
    ['sau-spl-okh', 'Al-Okhdood Club', 'OKH', 'Najran', 'Prince Hathloul Sports City', 12000, 1976, '#0055A4', '#FFFFFF', 69, 'Stjepan Tomas'],
    ['sau-spl-oru', 'Al-Orobah FC', 'ORU', 'Sakakah', 'Al-Orobah Club Stadium', 6000, 1975, '#FFCC00', '#008000', 69, 'Adnan Hamad'],
    ['sau-spl-qad', 'Al-Qadsiah FC', 'QAD', 'Khobar', 'Prince Mohamed bin Fahd Stadium', 26000, 1967, '#E30613', '#FFCC00', 77, 'Míchel González', ['Koen Casteels', 'Nacho Fernández', 'Ezequiel Fernández', 'Nahitan Nández', 'Pierre-Emerick Aubameyang', 'Julián Quiñones']],
    ['sau-spl-rae', 'Al-Raed SFC', 'RAE', 'Buraidah', 'King Abdullah Sport City Stadium', 25000, 1954, '#E30613', '#000000', 70, 'Odair Hellmann'],
    ['sau-spl-riy', 'Al-Riyadh SC', 'RIY', 'Riyadh', 'Prince Turki bin Abdulaziz Stadium', 15000, 1953, '#E30613', '#000000', 70, 'Sabri Lamouchi'],
    ['sau-spl-sha', 'Al-Shabab FC', 'SHA', 'Riyadh', 'Al-Shabab Club Stadium', 15000, 1947, '#FFFFFF', '#000000', 76, 'Fatih Terim', ['Giacomo Bonaventura', 'Yannick Carrasco', 'Daniel Podence', 'Abderrazak Hamdallah']],
    ['sau-spl-taa', 'Al-Taawoun FC', 'TAA', 'Buraidah', 'Al-Taawoun Club Stadium', 5961, 1956, '#FFCC00', '#002D62', 74, 'Rodolfo Arruabarrena', ['Mailson', 'Andrei Girotto', 'Musa Barrow']],
    ['sau-spl-weh', 'Al-Wehda FC', 'WEH', 'Mecca', 'King Abdulaziz Sports City', 38000, 1945, '#E30613', '#FFFFFF', 70, 'José Daniel Carreño'],
    ['sau-spl-dam', 'Damac FC', 'DAM', 'Khamis Mushait', 'Damac Club Stadium', 5000, 1972, '#E30613', '#FFCC00', 71, 'Nuno Almeida', ['Georges-Kévin Nkoudou', 'Nicolae Stanciu']],
  ],

  // ============================================================================
  // 12B. SAUDI ARABIA — SAUDI FIRST DIVISION LEAGUE (YELO LEAGUE, 18 Clubs)
  // ============================================================================
  'sau-fdl': [
    ['sau-fdl-abh', 'Abha Club', 'ABH', 'Abha', 'Prince Sultan Sports City', 20000, 1966, '#0055A4', '#E30613', 68, 'Abderrazek Chebbi'],
    ['sau-fdl-ada', 'Al-Adalah FC', 'ADA', 'Al-Hulaylah', 'Prince Abdullah bin Jalawi', 19000, 1984, '#003399', '#E30613', 65, 'Martin Ševela'],
    ['sau-fdl-ain', 'Al-Ain FC (KSA)', 'AIN', 'Al Bahah', 'King Saud Sport City', 10000, 1978, '#0055A4', '#FFCC00', 64, 'Zoran Milinković'],
    ['sau-fdl-ara', 'Al-Arabi SC (KSA)', 'ARA', 'Unaizah', 'Department of Education Stadium', 10000, 1958, '#E30613', '#FFFFFF', 66, 'Yousef Anbar'],
    ['sau-fdl-bat', 'Al-Batin FC', 'BAT', 'Hafar Al-Batin', 'Al-Batin Club Stadium', 6000, 1979, '#87CEEB', '#000000', 66, 'Nacho Fernández'],
    ['sau-fdl-buk', 'Al-Bukiryah FC', 'BUK', 'Al Bukayriyah', 'Al-Bukiryah Club Stadium', 5000, 1962, '#8A1538', '#FFFFFF', 65, 'Nandinho'],
    ['sau-fdl-fai', 'Al-Faisaly FC', 'FAI', 'Harmah', 'Al Majma’ah Sports City', 7000, 1954, '#8A1538', '#FFFFFF', 68, 'Filipe Gouveia'],
    ['sau-fdl-haz', 'Al-Hazem SC', 'HAZ', 'Ar Rass', 'Al-Hazem Club Stadium', 8000, 1957, '#FFCC00', '#0055A4', 68, 'Saleh Al-Mohammadi'],
    ['sau-fdl-jab', 'Al-Jabalain FC', 'JAB', 'Ha’il', 'Prince Abdulaziz bin Musa’ed', 12000, 1959, '#624839', '#FFFFFF', 66, 'Jorge Mendonça'],
    ['sau-fdl-jub', 'Al-Jubail Club', 'JUB', 'Jubail', 'Prince Nayef bin Abdulaziz', 10000, 1984, '#0055A4', '#FFFFFF', 64, 'Pedro Rodrigues'],
    ['sau-fdl-jan', 'Al-Jandal SC', 'JAN', 'Dumat al-Jandal', 'Al-Orobah Club Stadium', 6000, 1976, '#008000', '#FFFFFF', 64, 'Ziyad Al-afar'],
    ['sau-fdl-naj', 'Al-Najma SC', 'NAJ', 'Unaizah', 'Al-Najma Club Stadium', 6000, 1960, '#008000', '#000000', 65, 'Mário Silva'],
    ['sau-fdl-saf', 'Al-Safa FC', 'SAF', 'Safwa', 'Prince Nayef bin Abdulaziz', 10000, 1948, '#FFCC00', '#000000', 64, 'Ruud Brood'],
    ['sau-fdl-tai', 'Al-Tai FC', 'TAI', 'Ha’il', 'Prince Abdulaziz bin Musa’ed', 12000, 1961, '#808080', '#FFFFFF', 68, 'Mohamed Kouki'],
    ['sau-fdl-zul', 'Al-Zulfi FC', 'ZUL', 'Al Zulfi', 'Al-Zulfi Club Stadium', 3000, 1969, '#FF6600', '#003399', 64, 'Zoran Manojlović'],
    ['sau-fdl-neo', 'NEOM SC', 'NEOM', 'Tabuk', 'King Khalid Sport City', 12000, 1965, '#002D62', '#D4AF37', 71, 'Péricles Chamusca', ['Romarinho', 'Salman Al-Faraj', 'Ahmed Hegazi']],
    ['sau-fdl-ohd', 'Ohod Club', 'OHD', 'Medina', 'Prince Mohammed bin Abdulaziz', 24000, 1936, '#FFCC00', '#624839', 65, 'Youssef المناعي'],
    ['sau-fdl-jed', 'Jeddah Club', 'JED', 'Jeddah', 'Prince Abdullah Al-Faisal', 27000, 1929, '#003399', '#E30613', 65, 'Iván Carrasco'],
  ],

  // ============================================================================
  // 13A. TURKEY — TRENDYOL SÜPER LİG (19 Clubs)
  // ============================================================================
  'tur-sl': [
    ['tur-sl-ads', 'Adana Demirspor', 'ADS', 'Adana', 'New Adana Stadium', 33543, 1940, '#003399', '#87CEEB', 70, 'Mustafa Dalcı'],
    ['tur-sl-ala', 'Alanyaspor', 'ALA', 'Alanya', 'Gain Park Stadium', 10128, 1948, '#FF6600', '#008000', 73, 'Sami Uğurlu'],
    ['tur-sl-ant', 'Antalyaspor', 'ANT', 'Antalya', 'Corendon Airlines Park', 29307, 1966, '#E30613', '#FFFFFF', 73, 'Emre Belözoğlu'],
    ['tur-sl-bas', 'İstanbul Başakşehir FK', 'IBFK', 'Istanbul', 'Başakşehir Fatih Terim Stadium', 17156, 1990, '#FF6600', '#002D62', 77, 'Çağdaş Atan', ['Muhammed Şengezer', 'Léo Duarte', 'Berkay Özcan', 'Deniz Türüç', 'Krzysztof Piątek']],
    ['tur-sl-bjk', 'Beşiktaş JK', 'BJK', 'Istanbul', 'Tüpraş Stadyumu', 42590, 1903, '#000000', '#FFFFFF', 81, 'Ole Gunnar Solskjær', ['Mert Günok', 'Gabriel Paulista', 'Felix Uduokhai', 'Arthur Masuaku', 'Gedson Fernandes', 'Al-Musrati', 'Rafa Silva', 'Milot Rashica', 'Ciro Immobile', 'Semih Kılıçsoy']],
    ['tur-sl-bod', 'Bodrum FK', 'BOD', 'Bodrum', 'Bodrum İlçe Stadium', 4563, 1931, '#008000', '#FFFFFF', 70, 'Volkan Demirel'],
    ['tur-sl-eyu', 'Eyüpspor', 'EYU', 'Istanbul', 'Recep Tayyip Erdoğan Stadium', 13856, 1919, '#FFCC00', '#5E2784', 74, 'Arda Turan', ['Berke Özer', 'Caner Erkin', 'Emre Akbaba', 'Ahmed Kutucu', 'Mame Thiam']],
    ['tur-sl-fb', 'Fenerbahçe SK', 'FB', 'Istanbul', 'Ülker Stadyumu', 47430, 1907, '#FFED00', '#00205B', 84, 'José Mourinho', ['Dominik Livaković', 'Çağlar Söyüncü', 'Alexander Djiku', 'Milan Škriniar', 'Jayden Oosterwolde', 'Sofyan Amrabat', 'Fred Rodrigues', 'Sebastian Szymański', 'Dušan Tadić', 'Allan Saint-Maximin', 'Youssef En-Nesyri', 'Edin Džeko', 'Anderson Talisca']],
    ['tur-sl-gs', 'Galatasaray SK', 'GS', 'Istanbul', 'RAMS Park', 52600, 1905, '#A90432', '#FDB912', 85, 'Okan Buruk', ['Fernando Muslera', 'Davinson Sánchez', 'Abdülkerim Bardakcı', 'Kaan Ayhan', 'Lucas Torreira', 'Gabriel Sara', 'Barış Alper Yılmaz', 'Yunus Akgün', 'Dries Mertens', 'Victor Osimhen', 'Mauro Icardi', 'Álvaro Morata']],
    ['tur-sl-gfk', 'Gaziantep FK', 'GFK', 'Gaziantep', 'Kalyon Stadium', 33502, 1988, '#E30613', '#000000', 72, 'Selçuk İnan'],
    ['tur-sl-goz', 'Göztepe SK', 'GOZ', 'İzmir', 'Gürsel Aksel Stadium', 20040, 1925, '#FFCC00', '#E30613', 73, 'Stanimir Stoilov'],
    ['tur-sl-hat', 'Hatayspor', 'HAT', 'Antakya', 'Mersin Stadyumu', 25534, 1967, '#8A1538', '#FFFFFF', 70, 'Murat Şahin'],
    ['tur-sl-kas', 'Kasımpaşa SK', 'KAS', 'Istanbul', 'Recep Tayyip Erdoğan Stadium', 13856, 1921, '#0055A4', '#FFFFFF', 73, 'Burak Yılmaz'],
    ['tur-sl-kay', 'Kayserispor', 'KAY', 'Kayseri', 'RHG Enertürk Enerji Stadium', 32864, 1966, '#FFCC00', '#E30613', 72, 'Sergej Jakirović'],
    ['tur-sl-kon', 'Konyaspor', 'KON', 'Konya', 'Medaş Konya Büyükşehir', 42000, 1922, '#008000', '#FFFFFF', 73, 'Recep Uçar'],
    ['tur-sl-riz', 'Çaykur Rizespor', 'RIZ', 'Rize', 'Çaykur Didi Stadyumu', 15332, 1953, '#008000', '#0055A4', 73, 'İlhan Palut'],
    ['tur-sl-sam', 'Samsunspor', 'SAM', 'Samsun', 'Samsun 19 Mayıs Stadyumu', 33919, 1965, '#E30613', '#FFFFFF', 75, 'Thomas Reis'],
    ['tur-sl-siv', 'Sivasspor', 'SIV', 'Sivas', 'BG Grup 4 Eylül Stadyumu', 27532, 1967, '#E30613', '#FFFFFF', 73, 'Ömer Erdoğan'],
    ['tur-sl-ts', 'Trabzonspor', 'TS', 'Trabzon', 'Papara Park', 40782, 1967, '#8A1538', '#009FE3', 79, 'Şenol Güneş', ['Uğurcan Çakır', 'Stefan Savić', 'Okay Yokuşlu', 'Edin Višća', 'Anthony Nwakaeme', 'Simon Banza']],
  ],

  // ============================================================================
  // 13B. TURKEY — TRENDYOL 1. LİG (20 Clubs)
  // ============================================================================
  'tur-1l': [
    ['tur-1l-ada', 'Adanaspor', 'ADA', 'Adana', 'New Adana Stadium', 33543, 1954, '#FF6600', '#FFFFFF', 65, 'Yusuf Şimşek'],
    ['tur-1l-ama', 'Amed SK', 'AMD', 'Diyarbakır', 'Diyarbakır Stadium', 33000, 1972, '#008000', '#E30613', 67, 'Servet Çetin'],
    ['tur-1l-ank', 'MKE Ankaragücü', 'ANK', 'Ankara', 'Eryaman Stadium', 20560, 1910, '#FFCC00', '#002D62', 70, 'Kemal Özdeş'],
    ['tur-1l-ban', 'Bandırmaspor', 'BAN', 'Bandırma', 'Bandırma 17 Eylül Stadium', 12725, 1965, '#8A1538', '#FFFFFF', 68, 'Mustafa Gürsel'],
    ['tur-1l-bol', 'Boluspor', 'BOL', 'Bolu', 'Bolu Atatürk Stadium', 8456, 1965, '#E30613', '#FFFFFF', 67, 'Ufuk Kahraman'],
    ['tur-1l-cor', 'Çorum FK', 'COR', 'Çorum', 'Çorum Şehir Stadium', 15000, 1997, '#E30613', '#000000', 68, 'Serkan Özbalta'],
    ['tur-1l-erz', 'Erzurumspor FK', 'ERZ', 'Erzurum', 'Kazım Karabekir Stadium', 21374, 2005, '#0055A4', '#FFFFFF', 68, 'Hakan Kutlu'],
    ['tur-1l-ero', 'Esenler Erokspor', 'ERO', 'Istanbul', 'Esenler Stadyumu', 5296, 1959, '#FFCC00', '#008000', 66, 'Mehmet Altıparmak'],
    ['tur-1l-fk', 'Fatih Karagümrük SK', 'FKG', 'Istanbul', 'Atatürk Olympic Stadium', 74753, 1926, '#E30613', '#000000', 70, 'Onur Can Korkmaz'],
    ['tur-1l-gen', 'Gençlerbirliği SK', 'GEN', 'Ankara', 'Eryaman Stadium', 20560, 1923, '#E30613', '#000000', 68, 'Hüseyin Eroğlu'],
    ['tur-1l-igf', 'Iğdır FK', 'IGD', 'Iğdır', 'Iğdır Şehir Stadium', 2700, 2016, '#008000', '#FFFFFF', 66, 'Osman Özköylü'],
    ['tur-1l-ist', 'İstanbulspor', 'IST', 'Istanbul', 'Esenyurt Necmi Kadıoğlu', 4488, 1926, '#FFCC00', '#000000', 68, 'Osman Zeki Korkmaz'],
    ['tur-1l-kec', 'Ankara Keçiörengücü', 'KEC', 'Ankara', 'Aktepe Stadium', 4883, 1945, '#5E2784', '#FFFFFF', 67, 'Erkan Sözeri'],
    ['tur-1l-koc', 'Kocaelispor', 'KOC', 'İzmit', 'Kocaeli Stadium', 34712, 1966, '#008000', '#000000', 70, 'İsmet Taşdemir'],
    ['tur-1l-man', 'Manisa FK', 'MAN', 'Manisa', 'Manisa 19 Mayıs Stadium', 16597, 1994, '#000000', '#FFFFFF', 67, 'Hakan Şapçı'],
    ['tur-1l-pen', 'Pendikspor', 'PEN', 'Istanbul', 'Pendik Stadium', 4105, 1950, '#E30613', '#FFFFFF', 68, 'Sedat Ağçay'],
    ['tur-1l-sak', 'Sakaryaspor', 'SAK', 'Adapazarı', 'Yeni Sakarya Atatürk', 28154, 1965, '#008000', '#000000', 68, 'Mesut Bakkal'],
    ['tur-1l-san', 'Şanlıurfaspor', 'SAN', 'Şanlıurfa', '11 Nisan Stadium', 28965, 1969, '#FFCC00', '#008000', 65, 'Sait Karafırtınalar'],
    ['tur-1l-umr', 'Ümraniyespor', 'UMR', 'Istanbul', 'Ümraniye Belediyesi Şehir', 3513, 1938, '#E30613', '#FFFFFF', 67, 'Tuncay Şanlı'],
    ['tur-1l-ym', 'Yeni Malatyaspor', 'YMS', 'Malatya', 'New Malatya Stadium', 27044, 1986, '#FFCC00', '#000000', 62, 'Adem Büyük'],
  ],

  // ============================================================================
  // 14A. BELGIUM — BELGIAN PRO LEAGUE (16 Clubs)
  // ============================================================================
  'bel-bpl': [
    ['bel-bpl-and', 'RSC Anderlecht', 'AND', 'Brussels', 'Lotto Park', 21500, 1908, '#5E2784', '#FFFFFF', 80, 'David Hubert', ['Colin Coosemans', 'Jan Vertonghen', 'Killian Sardella', 'Leander Dendoncker', 'Mario Stroeykens', 'Yari Verschaeren', 'Thorgan Hazard', 'Anders Dreyer', 'Kasper Dolberg']],
    ['bel-bpl-ant', 'Royal Antwerp FC', 'ANT', 'Antwerp', 'Bosuilstadion', 16144, 1880, '#E30613', '#FFFFFF', 78, 'Jonas De Roeck', ['Senne Lammens', 'Toby Alderweireld', 'Jelle Bataille', 'Dennis Praet', 'Tjaronn Chery', 'Gyrano Kerk', 'Vincent Janssen']],
    ['bel-bpl-bee', 'K Beerschot VA', 'BEE', 'Antwerp', 'Olympisch Stadion', 12771, 1899, '#5E2784', '#FFFFFF', 68, 'Dirk Kuyt'],
    ['bel-bpl-cer', 'Cercle Brugge KSV', 'CER', 'Bruges', 'Jan Breydel Stadium', 29062, 1899, '#008000', '#000000', 73, 'Ferdinand Feldhofer'],
    ['bel-bpl-cha', 'Royal Charleroi SC', 'CHA', 'Charleroi', 'Stade du Pays de Charleroi', 15000, 1904, '#000000', '#FFFFFF', 73, 'Rik De Mil'],
    ['bel-bpl-clu', 'Club Brugge KV', 'CLU', 'Bruges', 'Jan Breydel Stadium', 29062, 1891, '#0055A4', '#000000', 82, 'Nicky Hayen', ['Simon Mignolet', 'Brandon Mechele', 'Joel Ordóñez', 'Maxim De Cuyper', 'Raphael Onyedika', 'Ardon Jashari', 'Hans Vanaken', 'Andreas Skov Olsen', 'Christos Tzolis', 'Gustaf Nilsson']],
    ['bel-bpl-den', 'FCV Dender EH', 'DEN', 'Denderleeuw', ' Dender Football Complex', 6429, 1935, '#0055A4', '#000000', 69, 'Vincent Euvrard'],
    ['bel-bpl-gnk', 'KRC Genk', 'GNK', 'Genk', 'Cegeka Arena', 23718, 1988, '#0055A4', '#FFFFFF', 80, 'Thorsten Fink', ['Hendrik Van Crombrugge', 'Matte Smets', 'Zakaria El Ouahdi', 'Bryan Heynen', 'Patrik Hrošovský', 'Jarne Steuckers', 'Tolu Arokodare', 'Oh Hyeon-gyu']],
    ['bel-bpl-gnt', 'KAA Gent', 'GNT', 'Ghent', 'Planet Group arena', 20185, 1900, '#0055A4', '#FFFFFF', 78, 'Danijel Milićević', ['Davy Roef', 'Jordan Torunarigha', 'Tsuyoshi Watanabe', 'Sven Kums', 'Omri Gandelman', 'Max Dean', 'Andri Guðjohnsen']],
    ['bel-bpl-kort', 'KV Kortrijk', 'KVK', 'Kortrijk', 'Guldensporenstadion', 9399, 1901, '#E30613', '#FFFFFF', 70, 'Yves Vanderhaeghe'],
    ['bel-bpl-kvm', 'KV Mechelen', 'KVM', 'Mechelen', 'AFAS Stadion', 16672, 1904, '#E30613', '#FFCC00', 73, 'Besnik Hasi'],
    ['bel-bpl-ohl', 'OH Leuven', 'OHL', 'Leuven', 'King Power at Den Dreef', 10020, 2002, '#FFFFFF', '#000000', 72, 'Chris Coleman'],
    ['bel-bpl-sta', 'Standard Liège', 'STA', 'Liège', 'Stade Maurice Dufrasne', 27670, 1898, '#E30613', '#FFFFFF', 75, 'Ivan Leko'],
    ['bel-bpl-stvv', 'Sint-Truidense VV (STVV)', 'STVV', 'Sint-Truiden', 'Stayen', 14600, 1924, '#FFCC00', '#0055A4', 71, 'Felice Mazzù'],
    ['bel-bpl-usg', 'Royale Union Saint-Gilloise', 'USG', 'Brussels', 'Joseph Marien Stadium', 9400, 1897, '#FFCC00', '#003399', 80, 'Sébastien Pocognoli', ['Anthony Moris', 'Christian Burgess', 'Koki Machida', 'Charles Vanhoutte', 'Noah Sadiki', 'Mohammed Fuseini', 'Franjo Ivanović', 'Promise David']],
    ['bel-bpl-wes', 'KVC Westerlo', 'WES', 'Westerlo', 'Het Kuipje', 8035, 1933, '#FFCC00', '#0055A4', 72, 'Timmy Simons'],
  ],

  // ============================================================================
  // 14B. BELGIUM — CHALLENGER PRO LEAGUE (16 Clubs)
  // ============================================================================
  'bel-cpl': [
    ['bel-cpl-bev', 'SK Beveren', 'BEV', 'Beveren', 'Freethiel Stadion', 8190, 1936, '#FFCC00', '#0055A4', 67, 'Marink Reedijk'],
    ['bel-cpl-nxt', 'Club NXT', 'NXT', 'Roeselare', 'The NEST', 9500, 2020, '#0055A4', '#000000', 65, 'Robin Veldman'],
    ['bel-cpl-dei', 'KMSK Deinze', 'DEI', 'Deinze', 'Burgemeester Van de Wiele', 7515, 1926, '#FF6600', '#000000', 65, 'Hernán Losada'],
    ['bel-cpl-eup', 'KAS Eupen', 'EUP', 'Eupen', 'Kehrwegstadion', 8363, 1945, '#000000', '#FFFFFF', 68, 'Mersad Selimbegović'],
    ['bel-cpl-fb', 'Francs Borains', 'RFB', 'Boussu', 'Stade Robert Urbain', 6000, 1922, '#008000', '#FFFFFF', 64, 'Karim Belhocine'],
    ['bel-cpl-jgnk', 'Jong Genk', 'JGNK', 'Genk', 'Cegeka Arena', 23718, 2022, '#0055A4', '#FFFFFF', 64, 'Thomas Buffel'],
    ['bel-cpl-laa', 'RAAL La Louvière', 'RAAL', 'La Louvière', 'Stade du Tivoli', 12500, 2017, '#008000', '#FFFFFF', 66, 'Frédéric Taquin'],
    ['bel-cpl-lie', 'Lierse Kempenzonen', 'LIE', 'Lier', 'Herman Vanderpoortenstadion', 14538, 1943, '#FFCC00', '#000000', 66, 'Christophe Grégoire'],
    ['bel-cpl-lok', 'KSC Lokeren-Temse', 'LOK', 'Lokeren', 'Daknamstadion', 12000, 1923, '#FFFFFF', '#000000', 65, 'Hans Cornelis'],
    ['bel-cpl-lom', 'Lommel SK', 'LOM', 'Lommel', 'Soevereinstadion', 8000, 2003, '#008000', '#FFFFFF', 67, 'Ryan Garry'],
    ['bel-cpl-pat', 'Patro Eisden Maasmechelen', 'PAT', 'Maasmechelen', 'Patro Stadion', 5500, 1942, '#5E2784', '#FFFFFF', 66, 'Stijn Stijnen'],
    ['bel-cpl-rfc', 'RFC Liège', 'RFCL', 'Liège', 'Stade de Rocourt', 4147, 1892, '#E30613', '#003399', 65, 'Gaëtan Englebert'],
    ['bel-cpl-rsf', 'RSCA Futures', 'RSCAF', 'Brussels', 'King Baudouin Stadium', 50093, 2022, '#5E2784', '#FFFFFF', 64, 'Jelle Coen'],
    ['bel-cpl-rwm', 'RWD Molenbeek (RWDM)', 'RWDM', 'Molenbeek', 'Edmond Machtens Stadium', 12266, 1951, '#E30613', '#000000', 69, 'Yannick Ferrera'],
    ['bel-cpl-ser', 'RFC Seraing', 'SER', 'Seraing', 'Stade du Pairay', 8207, 1922, '#E30613', '#000000', 65, 'Mbaye Leye'],
    ['bel-cpl-zwa', 'SV Zulte Waregem', 'ZWA', 'Waregem', 'Elindus Arena', 12414, 2001, '#E30613', '#008000', 69, 'Sven Vandenbroeck'],
  ],

  // ============================================================================
  // 15A. SCOTLAND — SCOTTISH PREMIERSHIP (12 Clubs)
  // ============================================================================
  'sco-sp': [
    ['sco-sp-abe', 'Aberdeen FC', 'ABE', 'Aberdeen', 'Pittodrie Stadium', 20866, 1903, '#E2001A', '#FFFFFF', 73, 'Jimmy Thelin', ['Dimitar Mitov', 'Nicky Devlin', 'Graeme Shinnie', 'Leighton Clarkson', 'Jamie McGrath', 'Topi Keskinen', 'Kevin Nisbet']],
    ['sco-sp-cel', 'Celtic FC', 'CEL', 'Glasgow', 'Celtic Park', 60411, 1887, '#018749', '#FFFFFF', 82, 'Brendan Rodgers', ['Kasper Schmeichel', 'Cameron Carter-Vickers', 'Auston Trusty', 'Liam Scales', 'Greg Taylor', 'Alistair Johnston', 'Callum McGregor', 'Reo Hatate', 'Arne Engels', 'Daizen Maeda', 'Nicolas Kühn', 'Kyogo Furuhashi', 'Adam Idah', 'Jota Filipe']],
    ['sco-sp-dund', 'Dundee FC', 'DUN', 'Dundee', 'Kilmac Stadium at Dens Park', 11775, 1893, '#00205B', '#FFFFFF', 68, 'Tony Docherty'],
    ['sco-sp-dufc', 'Dundee United FC', 'DUFC', 'Dundee', 'Tannadice Park', 14223, 1909, '#FF6600', '#000000', 69, 'Jim Goodwin'],
    ['sco-sp-hea', 'Heart of Midlothian FC', 'HEA', 'Edinburgh', 'Tynecastle Park', 19852, 1874, '#8A1538', '#FFFFFF', 73, 'Neil Critchley', ['Craig Gordon', 'Kye Rowles', 'Beni Baningime', 'Lawrence Shankland']],
    ['sco-sp-hib', 'Hibernian FC', 'HIB', 'Edinburgh', 'Easter Road', 20421, 1875, '#007A33', '#FFFFFF', 72, 'David Gray', ['Jordan Smith', 'Joe Newell', 'Martin Boyle', 'Élie Youan']],
    ['sco-sp-kil', 'Kilmarnock FC', 'KIL', 'Kilmarnock', 'BBSP Stadium Rugby Park', 15003, 1869, '#0055A4', '#FFFFFF', 70, 'Derek McInnes'],
    ['sco-sp-moth', 'Motherwell FC', 'MOT', 'Motherwell', 'Fir Park', 13677, 1886, '#FFCC00', '#8A1538', 69, 'Stuart Kettlewell'],
    ['sco-sp-ran', 'Rangers FC', 'RAN', 'Glasgow', 'Ibrox Stadium', 51587, 1872, '#1B458F', '#FFFFFF', 80, 'Philippe Clement', ['Jack Butland', 'John Souttar', 'Robin Pröpper', 'Jefté Vital', 'James Tavernier', 'Nicolas Raskin', 'Mohamed Diomandé', 'Václav Černý', 'Nedim Bajrami', 'Cyriel Dessers', 'Hamza Igamane']],
    ['sco-sp-ros', 'Ross County FC', 'ROS', 'Dingwall', 'Global Energy Stadium', 6541, 1929, '#00205B', '#E30613', 67, 'Don Cowie'],
    ['sco-sp-stj', 'St Johnstone FC', 'STJ', 'Perth', 'McDiarmid Park', 10696, 1884, '#0055A4', '#FFFFFF', 67, 'Simo Valakari'],
    ['sco-sp-stm', 'St Mirren FC', 'STM', 'Paisley', 'The SMiSA Stadium', 7937, 1877, '#000000', '#FFFFFF', 70, 'Stephen Robinson'],
  ],

  // ============================================================================
  // 15B. SCOTLAND — SCOTTISH CHAMPIONSHIP (10 Clubs)
  // ============================================================================
  'sco-sc': [
    ['sco-sc-air', 'Airdrieonians FC', 'AIR', 'Airdrie', 'Albert Bartlett Stadium', 10101, 1878, '#FFFFFF', '#E30613', 62, 'Rhys McCabe'],
    ['sco-sc-ayr', 'Ayr United FC', 'AYR', 'Ayr', 'Somerset Park', 10185, 1910, '#FFFFFF', '#000000', 64, 'Scott Brown'],
    ['sco-sc-dun', 'Dunfermline Athletic FC', 'DAFC', 'Dunfermline', 'KDM Group East End Park', 11480, 1885, '#000000', '#FFFFFF', 63, 'Michael Tidser'],
    ['sco-sc-fal', 'Falkirk FC', 'FAL', 'Falkirk', 'Falkirk Stadium', 7937, 1876, '#00205B', '#FFFFFF', 66, 'John McGlynn'],
    ['sco-sc-gmfc', 'Greenock Morton FC', 'MOR', 'Greenock', 'Cappielow Park', 11589, 1874, '#0055A4', '#FFFFFF', 63, 'Dougie Imrie'],
    ['sco-sc-ham', 'Hamilton Academical FC', 'HAM', 'Hamilton', 'New Douglas Park', 6018, 1874, '#E30613', '#FFFFFF', 62, 'John Rankin'],
    ['sco-sc-liv', 'Livingston FC', 'LIV', 'Livingston', 'Home of the Set Fare Arena', 9713, 1943, '#FFCC00', '#000000', 66, 'David Martindale'],
    ['sco-sc-par', 'Partick Thistle FC', 'PAR', 'Glasgow', 'Wyre Stadium at Firhill', 10102, 1876, '#FFCC00', '#E30613', 65, 'Kris Doolan'],
    ['sco-sc-qp', 'Queen’s Park FC', 'QPFC', 'Glasgow', 'Hampden Park', 51866, 1867, '#000000', '#FFFFFF', 63, 'Callum Davidson'],
    ['sco-sc-rai', 'Raith Rovers FC', 'RAI', 'Kirkcaldy', 'Stark’s Park', 8867, 1883, '#00205B', '#FFFFFF', 64, 'Barry Robson'],
  ],

  // ============================================================================
  // 16A. AUSTRIA — AUSTRIAN BUNDESLIGA (12 Clubs)
  // ============================================================================
  'aut-bl': [
    ['aut-bl-alt', 'SCR Altach', 'ALT', 'Altach', 'Cashpoint Arena', 8500, 1929, '#000000', '#FFFFFF', 68, 'Fabio Ingolitsch'],
    ['aut-bl-fak', 'FK Austria Wien', 'FAK', 'Vienna', 'Generali Arena', 17656, 1911, '#5E2784', '#FFFFFF', 74, 'Stephan Helm', ['Samuel Sahin-Radlinger', 'Aleksandar Dragović', 'Manfred Fischer', 'Dominik Fitz', 'Maurice Malone']],
    ['aut-bl-bw', 'FC Blau-Weiß Linz', 'BWL', 'Linz', 'Hofmann Personal Stadion', 5595, 1997, '#0055A4', '#FFFFFF', 69, 'Gerald Scheiblehner'],
    ['aut-bl-gak', 'Grazer AK 1902', 'GAK', 'Graz', 'Merkur Arena', 16364, 1902, '#E30613', '#FFFFFF', 68, 'Rene Poms'],
    ['aut-bl-tsv', 'TSV Hartberg', 'TSV', 'Hartberg', 'Profertil Arena Hartberg', 5024, 1946, '#0055A4', '#FFFFFF', 70, 'Manfred Schmid'],
    ['aut-bl-aklu', 'SK Austria Klagenfurt', 'SKA', 'Klagenfurt', '28 Black Arena', 30000, 2007, '#5E2784', '#FFFFFF', 69, 'Peter Pacult'],
    ['aut-bl-lask', 'LASK', 'LASK', 'Linz', 'Raiffeisen Arena', 19080, 1908, '#000000', '#FFFFFF', 75, 'Markus Schopp', ['Tobias Lawal', 'Philipp Ziereis', 'Jérôme Boateng', 'Valon Berisha', 'Robert Žulj', 'Marin Ljubičić']],
    ['aut-bl-scr', 'SK Rapid Wien', 'SCR', 'Vienna', 'Allianz Stadion', 28600, 1899, '#008000', '#FFFFFF', 76, 'Robert Klauß', ['Niklas Hedl', 'Nenad Cvetković', 'Lukas Grgić', 'Mamadou Sangaré', 'Matthias Seidl', 'Guido Burgstaller', 'Dion Beljo']],
    ['aut-bl-rbs', 'FC Red Bull Salzburg', 'RBS', 'Salzburg', 'Red Bull Arena', 30188, 1933, '#E30613', '#FFFFFF', 79, 'Thomas Letsch', ['Alexander Schlager', 'Janis Blaswich', 'Kamil Piątkowski', 'Aleksa Terzić', 'Amar Dedić', 'Mads Bidstrup', 'Lucas Gourna-Douath', 'Oscar Gloukh', 'Karim Konaté', 'Dorgeles Nene']],
    ['aut-bl-stu', 'SK Sturm Graz', 'STU', 'Graz', 'Merkur Arena', 16364, 1909, '#000000', '#FFFFFF', 78, 'Jürgen Säumel', ['Kjell Scherpen', 'Gregory Wüthrich', 'Jusuf Gazibegović', 'Jon Gorenc Stanković', 'Otar Kiteishvili', 'Tomi Horvat', 'William Bøving', 'Mika Biereth']],
    ['aut-bl-wsg', 'WSG Tirol', 'WSG', 'Innsbruck', 'Tivoli Stadion Tirol', 16008, 1930, '#008000', '#FFFFFF', 67, 'Philipp Semlic'],
    ['aut-bl-wac', 'Wolfsberger AC', 'WAC', 'Wolfsberg', 'Lavanttal-Arena', 7300, 1931, '#000000', '#FFFFFF', 72, 'Dietmar Kühbauer'],
  ],

  // ============================================================================
  // 16B. AUSTRIA — ADMIRAL 2. LIGA (16 Clubs)
  // ============================================================================
  'aut-2l': [
    ['aut-2l-adm', 'FC Flyeralarm Admira', 'ADM', 'Maria Enzersdorf', '데이터pol Arena', 10600, 1905, '#E30613', '#000000', 67, 'Thomas Silberberger'],
    ['aut-2l-ams', 'SKU Amstetten', 'AMS', 'Amstetten', 'Ertl Glas Stadion', 2000, 1997, '#0055A4', '#FFFFFF', 63, 'Patrick Enengl'],
    ['aut-2l-breg', 'SC Schwarz-Weiß Bregenz', 'SWB', 'Bregenz', 'ImmoAgentur Stadion', 12000, 1919, '#000000', '#FFFFFF', 64, 'Regi Van Acker'],
    ['aut-2l-fac', 'Floridsdorfer AC (FAC)', 'FAC', 'Vienna', 'FAC-Platz', 3000, 1904, '#0055A4', '#FFFFFF', 65, 'Mitja Mörec'],
    ['aut-2l-fvi', 'First Vienna FC 1894', 'FVI', 'Vienna', 'Stadion Hohe Warte', 5000, 1894, '#FFCC00', '#0055A4', 66, 'Mehmet Sütçü'],
    ['aut-2l-hor', 'SV Horn', 'HOR', 'Horn', 'Sparkasse Horn Arena', 7800, 1922, '#0055A4', '#FFFFFF', 63, 'Philipp Riederer'],
    ['aut-2l-kap', 'Kapfenberger SV 1919', 'KSV', 'Kapfenberg', 'Franz-Fekete-Stadion', 10000, 1919, '#E30613', '#FFFFFF', 64, 'Ismail Atalan'],
    ['aut-2l-laf', 'SV Lafnitz', 'LAF', 'Lafnitz', 'Fußballarena Lafnitz', 3000, 1964, '#008000', '#FFFFFF', 63, 'Şaban Uzun'],
    ['aut-2l-lie', 'FC Liefering', 'LIE', 'Salzburg', 'Red Bull Arena', 30188, 1947, '#E30613', '#FFFFFF', 66, 'Daniel Beichler'],
    ['aut-2l-lus', 'SC Austria Lustenau', 'ALU', 'Lustenau', 'Reichshofstadion', 8800, 1914, '#008000', '#FFFFFF', 66, 'Martin Brenner'],
    ['aut-2l-rap2', 'SK Rapid II', 'SCR2', 'Vienna', 'Allianz Stadion', 28600, 1923, '#008000', '#FFFFFF', 63, 'Jürgen Kerber'],
    ['aut-2l-rie', 'SV Ried', 'SVR', 'Ried im Innkreis', 'Innviertel Arena', 7300, 1912, '#008000', '#000000', 68, 'Maximilian Senft'],
    ['aut-2l-stp', 'SKN St. Pölten', 'SKN', 'St. Pölten', 'NV Arena', 8000, 2000, '#FFCC00', '#0055A4', 66, 'Tugberk Tanrivermis'],
    ['aut-2l-str', 'SV Stripfing', 'STR', 'Weikendorf', 'Generali Arena', 17656, 1951, '#0055A4', '#FFCC00', 63, 'Alexander Grünwald'],
    ['aut-2l-stu2', 'SK Sturm Graz II', 'STU2', 'Gleisdorf', 'Solarstadion Gleisdorf', 4000, 2000, '#000000', '#FFFFFF', 63, 'Jürgen Säumel'],
    ['aut-2l-voi', 'ASK Voitsberg', 'VOI', 'Voitsberg', 'Münzer Bioindustrie Sportpark', 2500, 1921, '#000000', '#FFFFFF', 62, 'David Preiß'],
  ],

  // ============================================================================
  // 17A. SWITZERLAND — SWISS SUPER LEAGUE (12 Clubs)
  // ============================================================================
  'sui-sl': [
    ['sui-sl-bas', 'FC Basel 1893', 'FCB', 'Basel', 'St. Jakob-Park', 37500, 1893, '#E30613', '#003399', 76, 'Fabio Celestini', ['Marwin Hitz', 'Dominik Schmid', 'Taulant Xhaka', 'Xherdan Shaqiri', 'Bénie Traoré', 'Albian Ajeti', 'Kevin Carlos']],
    ['sui-sl-gc', 'Grasshopper Club Zürich', 'GCZ', 'Zurich', 'Letzigrund', 26104, 1886, '#0055A4', '#FFFFFF', 70, 'Tomas Oral'],
    ['sui-sl-lau', 'FC Lausanne-Sport', 'LS', 'Lausanne', 'Stade de la Tuilière', 12544, 1896, '#0055A4', '#FFFFFF', 72, 'Ludovic Magnin'],
    ['sui-sl-lug', 'FC Lugano', 'LUG', 'Lugano', 'Stadio di Cornaredo', 6330, 1908, '#000000', '#FFFFFF', 75, 'Mattia Croci-Torti', ['Amir Saipi', 'Albian Hajdari', 'Uran Bislimi', 'Renato Steffen', 'Kacper Przybyłko']],
    ['sui-sl-luz', 'FC Luzern', 'FCL', 'Lucerne', 'swissporarena', 16800, 1901, '#0055A4', '#FFFFFF', 73, 'Mario Frick'],
    ['sui-sl-sfc', 'Servette FC', 'SFC', 'Geneva', 'Stade de Genève', 30084, 1890, '#8A1538', '#FFFFFF', 75, 'Thomas Häberli', ['Joël Mall', 'Steve Rouiller', 'Keigo Tsunemoto', 'Timothé Cognat', 'Miroslav Stevanović', 'Enzo Crivelli']],
    ['sui-sl-sio', 'FC Sion', 'SIO', 'Sion', 'Stade de Tourbillon', 14283, 1909, '#E30613', '#FFFFFF', 71, 'Didier Tholot'],
    ['sui-sl-stg', 'FC St. Gallen 1879', 'FCSG', 'St. Gallen', 'kybunpark', 19694, 1879, '#008000', '#FFFFFF', 74, 'Enrico Maaßen'],
    ['sui-sl-win', 'FC Winterthur', 'FCW', 'Winterthur', 'Stadion Schützenwiese', 8400, 1896, '#E30613', '#FFFFFF', 69, 'Uli Forte'],
    ['sui-sl-yb', 'BSC Young Boys', 'YB', 'Bern', 'Stadion Wankdorf', 31500, 1898, '#FFCC00', '#000000', 78, 'Giorgio Contini', ['David von Ballmoos', 'Loris Benito', 'Mohamed Ali Camara', 'Filip Ugrinić', 'Łukasz Łakomy', 'Joël Monteiro', 'Cédric Itten', 'Silvère Ganvoula']],
    ['sui-sl-yve', 'Yverdon-Sport FC', 'YS', 'Yverdon-les-Bains', 'Stade Municipal', 6600, 1948, '#008000', '#FFFFFF', 69, 'Paolo Tramezzani'],
    ['sui-sl-fcz', 'FC Zürich', 'FCZ', 'Zurich', 'Letzigrund', 26104, 1896, '#FFFFFF', '#0055A4', 75, 'Ricardo Moniz', ['Yanick Brecher', 'Nikola Katić', 'Antonio Marchesano', 'Steven Zuber', 'Juan José Perea']],
  ],

  // ============================================================================
  // 17B. SWITZERLAND — SWISS CHALLENGE LEAGUE (10 Clubs)
  // ============================================================================
  'sui-cl': [
    ['sui-cl-aar', 'FC Aarau', 'FCA', 'Aarau', 'Stadion Brügglifeld', 8000, 1902, '#000000', '#FFFFFF', 66, 'Brunello Iacopetta'],
    ['sui-cl-bel', 'AC Bellinzona', 'ACB', 'Bellinzona', 'Stadio Comunale', 5000, 1904, '#8A1538', '#FFFFFF', 64, 'Manuel Benavente'],
    ['sui-cl-ec', 'Étoile Carouge FC', 'ECFC', 'Carouge', 'Stade de la Fontenette', 3690, 1904, '#002D62', '#FFFFFF', 64, 'Adrian Ursea'],
    ['sui-cl-slo', 'FC Stade Lausanne Ouchy', 'SLO', 'Lausanne', 'Stade Olympique de la Pontaise', 15850, 1901, '#E30613', '#FFFFFF', 66, 'Dalibor Stevanović'],
    ['sui-cl-nyo', 'FC Stade Nyonnais', 'NYO', 'Nyon', 'Centre sportif de Colovray', 7200, 1905, '#FFCC00', '#000000', 63, 'Christophe Caschili'],
    ['sui-cl-sch', 'FC Schaffhausen', 'FCS', 'Schaffhausen', 'FCS Arena', 8200, 1896, '#FFCC00', '#000000', 64, 'Ciriaco Sforza'],
    ['sui-cl-thu', 'FC Thun', 'THU', 'Thun', 'Stockhorn Arena', 10000, 1898, '#E30613', '#FFFFFF', 68, 'Mauro Lustrinelli'],
    ['sui-cl-vad', 'FC Vaduz', 'FCV', 'Vaduz', 'Rheinpark Stadion', 7584, 1932, '#E30613', '#FFFFFF', 66, 'Marc Schneider'],
    ['sui-cl-wil', 'FC Wil 1900', 'WIL', 'Wil', 'Lidl Arena', 6048, 1900, '#000000', '#FFFFFF', 65, 'Marco Hämmerli'],
    ['sui-cl-xam', 'Neuchâtel Xamax FCS', 'XAM', 'Neuchâtel', 'Stade de la Maladière', 11997, 1970, '#E30613', '#000000', 66, 'Anthony Braizat'],
  ],

  // ============================================================================
  // 18A. DENMARK — DANISH SUPERLIGA (12 Clubs)
  // ============================================================================
  'den-sl': [
    ['den-sl-aab', 'AaB Fodbold (Aalborg)', 'AAB', 'Aalborg', 'Aalborg Portland Park', 13797, 1885, '#E30613', '#FFFFFF', 70, 'Menno van Dam'],
    ['den-sl-agf', 'AGF (Aarhus)', 'AGF', 'Aarhus', 'Ceres Park', 19433, 1880, '#FFFFFF', '#00205B', 74, 'Uwe Rösler', ['Jesper Hansen', 'Frederik Tingager', 'Mads Emil Madsen', 'Patrick Mortensen']],
    ['den-sl-bif', 'Brøndby IF', 'BIF', 'Brøndbyvester', 'Brøndby Stadion', 28000, 1964, '#FFCC00', '#003399', 76, 'Frederik Birk', ['Patrick Pentz', 'Jacob Rasmussen', 'Daniel Wass', 'Nicolai Vallys', 'Yuito Suzuki', 'Mathias Kvistgaarden']],
    ['den-sl-fck', 'FC København', 'FCK', 'Copenhagen', 'Parken Stadium', 38065, 1992, '#FFFFFF', '#003399', 79, 'Jacob Neestrup', ['Nathan Trott', 'Denis Vavro', 'Kevin Diks', 'Thomas Delaney', 'Lukas Lerager', 'Mohamed Elyounoussi', 'Viktor Claesson', 'Andreas Cornelius']],
    ['den-sl-lyn', 'Lyngby Boldklub', 'LBK', 'Kongens Lyngby', 'Lyngby Stadion', 10100, 1921, '#003399', '#FFFFFF', 69, 'Morten Karlsen'],
    ['den-sl-fcm', 'FC Midtjylland', 'FCM', 'Herning', 'MCH Arena', 12148, 1999, '#000000', '#E30613', 79, 'Thomas Thomasberg', ['Elías Rafn Ólafsson', 'Mads Bech Sørensen', 'Ousmane Diao', 'Emiliano Martínez', 'Oliver Sørensen', 'Darío Osorio', 'Aral Şimşir', 'Franculino Djú', 'Adam Buksa']],
    ['den-sl-fcn', 'FC Nordsjælland', 'FCN', 'Farum', 'Right to Dream Park', 10300, 2003, '#E30613', '#FFCC00', 75, 'Jens Fønsskov Olsen', ['Andreas Hansen', 'Kian Hansen', 'Jeppe Tverskov', 'Benjamin Nygren', 'Marcus Ingvartsen']],
    ['den-sl-rfc', 'Randers FC', 'RFC', 'Randers', 'Cepheus Park Randers', 10300, 2003, '#87CEEB', '#00205B', 73, 'Rasmus Bertelsen'],
    ['den-sl-sif', 'Silkeborg IF', 'SIF', 'Silkeborg', 'JYSK Park', 10000, 1917, '#E30613', '#FFFFFF', 73, 'Kent Nielsen'],
    ['den-sl-sje', 'Sønderjyske Fodbold', 'SJF', 'Haderslev', 'Sydbank Park', 10100, 2004, '#87CEEB', '#00205B', 69, 'Thomas Nørgaard'],
    ['den-sl-vb', 'Vejle Boldklub', 'VB', 'Vejle', 'Vejle Stadion', 11060, 1891, '#E30613', '#FFFFFF', 68, 'Mihai Teja'],
    ['den-sl-vff', 'Viborg FF', 'VFF', 'Viborg', 'Energi Viborg Arena', 10066, 1896, '#008000', '#FFFFFF', 72, 'Jakob Poulsen'],
  ],

  // ============================================================================
  // 18B. DENMARK — DANISH 1ST DIVISION (NORDICBET LIGA, 12 Clubs)
  // ============================================================================
  'den-1d': [
    ['den-1d-b93', 'B.93 (Boldklubben af 1893)', 'B93', 'Copenhagen', 'Østerbro Stadion', 4400, 1893, '#FFFFFF', '#003399', 63, 'Kasper Lorentzen'],
    ['den-1d-efb', 'Esbjerg fB', 'EFB', 'Esbjerg', 'Blue Water Arena', 17442, 1924, '#0055A4', '#FFFFFF', 66, 'Lars Vind'],
    ['den-1d-fcfr', 'FC Fredericia', 'FCF', 'Fredericia', 'Monjasa Park', 4000, 1991, '#E30613', '#000000', 66, 'Michael Hansen'],
    ['den-1d-hbk', 'HB Køge', 'HBK', 'Køge', 'Capelli Sport Stadion', 4000, 2009, '#0055A4', '#000000', 63, 'Nicklas Pedersen'],
    ['den-1d-hif', 'Hillerød Fodbold', 'HIL', 'Hillerød', 'Right to Dream Park', 10300, 1937, '#FF6600', '#000000', 64, 'Christian Lønstrup'],
    ['den-1d-hob', 'Hobro IK', 'HOB', 'Hobro', 'DS Arena', 10700, 1913, '#FFCC00', '#003399', 65, 'Martin Thomsen'],
    ['den-1d-ach', 'AC Horsens', 'ACH', 'Horsens', 'Nordstern Arena Horsens', 10400, 1994, '#FFCC00', '#000000', 67, 'Martin Retov'],
    ['den-1d-hv', 'Hvidovre IF', 'HIF', 'Hvidovre', 'Pro Ventilation Arena', 12000, 1925, '#E30613', '#003399', 66, 'Per Frandsen'],
    ['den-1d-kol', 'Kolding IF', 'KIF', 'Kolding', 'Autocentralen Park', 10000, 1895, '#FFFFFF', '#003399', 65, 'Lasse Holmgaard'],
    ['den-1d-ob', 'Odense Boldklub (OB)', 'OB', 'Odense', 'Nature Energy Park', 15790, 1887, '#0055A4', '#FFFFFF', 70, 'Søren Krogh'],
    ['den-1d-fcrc', 'FC Roskilde', 'FCR', 'Roskilde', 'Roskilde Idrætspark', 6000, 2004, '#87CEEB', '#FFFFFF', 62, 'Mikkel Thygesen'],
    ['den-1d-ven', 'Vendsyssel FF', 'VEN', 'Hjørring', 'Nord Energi Arena', 10000, 2013, '#FFFFFF', '#003399', 64, 'Mads Kristensen'],
  ],

  // ============================================================================
  // 19A. JAPAN — MEIJI YASUDA J1 LEAGUE (20 Clubs)
  // ============================================================================
  'jpn-j1': [
    ['jpn-j1-alb', 'Albirex Niigata', 'ALB', 'Niigata', 'Denka Big Swan Stadium', 41684, 1955, '#FF6600', '#003399', 72, 'Daisuke Kimori'],
    ['jpn-j1-avi', 'Avispa Fukuoka', 'AVI', 'Fukuoka', 'Best Denki Stadium', 21562, 1982, '#00205B', '#C0C0C0', 73, 'Kim Myung-hwi'],
    ['jpn-j1-cer', 'Cerezo Osaka', 'CER', 'Osaka', 'Yodoko Sakura Stadium', 24481, 1957, '#F05A9B', '#00205B', 75, 'Arthur Papas', ['Kim Jin-hyeon', 'Shinji Kagawa', 'Léo Ceará', 'Lucas Fernandes']],
    ['jpn-j1-fag', 'Fagiano Okayama', 'FAG', 'Okayama', 'City Light Stadium', 20000, 1975, '#8A1538', '#003399', 70, 'Takashi Kiyama'],
    ['jpn-j1-fct', 'FC Tokyo', 'FCT', 'Tokyo', 'Ajinomoto Stadium', 47851, 1935, '#003399', '#E30613', 75, 'Rikizo Matsuhashi', ['Yuto Nagatomo', 'Keigo Higashi', 'Diego Oliveira']],
    ['jpn-j1-gam', 'Gamba Osaka', 'GAM', 'Suita', 'Panasonic Stadium Suita', 39694, 1980, '#003399', '#000000', 77, 'Dani Poyatos', ['Jun Ichimori', 'Shinnosuke Nakatani', 'Takashi Usami', 'Issam Jebali']],
    ['jpn-j1-ant', 'Kashima Antlers', 'ANT', 'Kashima', 'Kashima Soccer Stadium', 40728, 1947, '#A6192E', '#00205B', 78, 'Toru Oniki', ['Tomoki Hayakawa', 'Naomichi Ueda', 'Gaku Shibasaki', 'Yuma Suzuki']],
    ['jpn-j1-rey', 'Kashiwa Reysol', 'REY', 'Kashiwa', 'Sankyo Frontier Kashiwa Stadium', 15109, 1940, '#FFCC00', '#000000', 73, 'Ricardo Rodríguez'],
    ['jpn-j1-fro', 'Kawasaki Frontale', 'FRO', 'Kawasaki', 'Uvance Todoroki Stadium', 26827, 1955, '#009FE3', '#000000', 77, 'Shigetoshi Hasebe', ['Jung Sung-ryong', 'Yasuto Wakizaka', 'Akihiro Ienaga', 'Marcinho', 'Shin Yamada']],
    ['jpn-j1-kyo', 'Kyoto Sanga FC', 'KYO', 'Kyoto', 'Sanga Stadium by Kyocera', 21623, 1922, '#5E2784', '#FFFFFF', 72, 'Cho Kwi-jae'],
    ['jpn-j1-zel', 'FC Machida Zelvia', 'ZEL', 'Machida', 'Machida GION Stadium', 15489, 1989, '#0055A4', '#D4AF37', 76, 'Go Kuroda', ['Kosei Tani', 'Gen Shoji', 'Yuki Soma', 'Mitch Duke']],
    ['jpn-j1-gra', 'Nagoya Grampus', 'GRA', 'Nagoya', 'Toyota Stadium', 43739, 1939, '#E30613', '#FFCC00', 75, 'Kenta Hasegawa', ['Mitchell Langerak', 'Sho Inagaki', 'Kasper Junker']],
    ['jpn-j1-san', 'Sanfrecce Hiroshima', 'SAN', 'Hiroshima', 'Edion Peace Wing Hiroshima', 28520, 1938, '#5E2784', '#FFFFFF', 78, 'Michael Skibbe', ['Keisuke Osako', 'Sho Sasaki', 'Tolgay Arslan', 'Makoto Mitsuta', 'Gonçalo Paciência']],
    ['jpn-j1-ssp', 'Shimizu S-Pulse', 'SSP', 'Shizuoka', 'IAI Stadium Nihondaira', 19594, 1991, '#FF6600', '#FFFFFF', 72, 'Tadahiro Akiba'],
    ['jpn-j1-bel', 'Shonan Bellmare', 'BEL', 'Hiratsuka', 'Lemon Gas Stadium Hiratsuka', 15380, 1968, '#00A650', '#0055A4', 72, 'Satoshi Yamaguchi'],
    ['jpn-j1-ver', 'Tokyo Verdy', 'VER', 'Tokyo', 'Ajinomoto Stadium', 47851, 1969, '#008000', '#FFFFFF', 73, 'Hiroshi Jofuku'],
    ['jpn-j1-red', 'Urawa Red Diamonds', 'URA', 'Saitama', 'Saitama Stadium 2002', 62010, 1950, '#E30613', '#000000', 77, 'Maciej Skorża', ['Shusaku Nishikawa', 'Marius Høibråten', 'Samuel Gustafson', 'Genki Haraguchi', 'Thiago Santana']],
    ['jpn-j1-vis', 'Vissel Kobe', 'VIS', 'Kobe', 'Noevir Stadium Kobe', 30132, 1966, '#8A1538', '#FFFFFF', 79, 'Takayuki Yoshida', ['Daiya Maekawa', 'Tetsushi Yamakawa', 'Gotoku Sakai', 'Hotaru Yamaguchi', 'Yoshinori Muto', 'Yuya Osako']],
    ['jpn-j1-yfc', 'Yokohama FC', 'YFC', 'Yokohama', 'NHK Spring Mitsuzawa', 15454, 1998, '#87CEEB', '#FFFFFF', 71, 'Shuhei Yomoda'],
    ['jpn-j1-fmar', 'Yokohama F. Marinos', 'YFM', 'Yokohama', 'Nissan Stadium', 71822, 1972, '#003399', '#E30613', 77, 'Steve Holland', ['William Popp', 'Takuya Kida', 'Yan Matheus', 'Anderson Lopes', 'Elber']],
  ],

  // ============================================================================
  // 19B. JAPAN — MEIJI YASUDA J2 LEAGUE (20 Clubs)
  // ============================================================================
  'jpn-j2': [
    ['jpn-j2-bla', 'Blaublitz Akita', 'BLA', 'Akita', 'Soyu Stadium', 20125, 1965, '#0055A4', '#FFFFFF', 65, 'Ken Yoshida'],
    ['jpn-j2-ehi', 'Ehime FC', 'EHI', 'Matsuyama', 'Ningineer Stadium', 20000, 1970, '#FF6600', '#002D62', 64, 'Kiyotaka Ishimaru'],
    ['jpn-j2-fuj', 'Fujieda MYFC', 'FUJ', 'Fujieda', 'Fujieda Soccer Stadium', 13000, 2009, '#5E2784', '#FFFFFF', 65, 'Daisuke Sudo'],
    ['jpn-j2-con', 'Hokkaido Consadole Sapporo', 'CON', 'Sapporo', 'Daiwa House Premist Dome', 38794, 1935, '#E30613', '#000000', 71, 'Daiki Iwamasa'],
    ['jpn-j2-imab', 'FC Imabari', 'IMA', 'Imabari', 'ASICS Satoyama Stadium', 5316, 1976, '#003399', '#FFCC00', 64, 'Keiji Kuraishi'],
    ['jpn-j2-iwa', 'Iwaki FC', 'IWA', 'Iwaki', 'Hawaiians Stadium Iwaki', 5066, 2012, '#E30613', '#002D62', 66, 'Yuzo Tamura'],
    ['jpn-j2-jef', 'JEF United Chiba', 'JEF', 'Chiba', 'Fukuda Denshi Arena', 19781, 1946, '#FFCC00', '#008000', 68, 'Yoshiyuki Kobayashi'],
    ['jpn-j2-jub', 'Júbilo Iwata', 'JUB', 'Iwata', 'Yamaha Stadium', 15165, 1972, '#87CEEB', '#FFFFFF', 71, 'John Hutchinson'],
    ['jpn-j2-kat', 'Kataller Toyama', 'KAT', 'Toyama', 'Toyama Stadium', 25251, 2007, '#0055A4', '#FFFFFF', 63, 'Michiharu Otagiri'],
    ['jpn-j2-mit', 'Mito HollyHock', 'MIT', 'Mito', 'K’s denki Stadium Mito', 12000, 1994, '#003399', '#FFFFFF', 65, 'Naoki Mori'],
    ['jpn-j2-mon', 'Montedio Yamagata', 'MON', 'Tendō', 'ND Soft Stadium Yamagata', 20315, 1984, '#0055A4', '#FFCC00', 68, 'Susumu Watanabe'],
    ['jpn-j2-oita', 'Oita Trinita', 'OIT', 'Ōita', 'Resonac Dome Oita', 40000, 1994, '#0055A4', '#FFCC00', 67, 'Tomohiro Katanosaka'],
    ['jpn-j2-omi', 'RB Omiya Ardija', 'OMI', 'Saitama', 'NACK5 Stadium Omiya', 15500, 1969, '#FF6600', '#002D62', 67, 'Tetsu Nagasawa'],
    ['jpn-j2-ren', 'Renofa Yamaguchi FC', 'REN', 'Yamaguchi', 'Ishin Me-Life Stadium', 20000, 1949, '#FF6600', '#FFFFFF', 65, 'Ryo Shigaki'],
    ['jpn-j2-roa', 'Roasso Kumamoto', 'ROA', 'Kumamoto', 'Egao Kenko Stadium', 32000, 1969, '#E30613', '#000000', 65, 'Takeshi Oki'],
    ['jpn-j2-sag', 'Sagan Tosu', 'SAG', 'Tosu', 'Ekimae Real Estate Stadium', 24130, 1997, '#009FE3', '#F05A9B', 70, 'Akio Kogiku'],
    ['jpn-j2-tok', 'Tokushima Vortis', 'TOK', 'Naruto', 'Pocarisweat Stadium', 19637, 1955, '#003399', '#008000', 67, 'Kosaku Masuda'],
    ['jpn-j2-vnag', 'V-Varen Nagasaki', 'VVN', 'Isahaya', 'Peace Stadium Connected by SoftBank', 20027, 2005, '#0055A4', '#FF6600', 69, 'Takahiro Shimotaira'],
    ['jpn-j2-veg', 'Vegalta Sendai', 'VEG', 'Sendai', 'Yurtec Stadium Sendai', 19694, 1988, '#FFCC00', '#003399', 68, 'Yoshiro Moriyama'],
    ['jpn-j2-ven', 'Ventforet Kofu', 'VEN', 'Kōfu', 'JIT Recycle Ink Stadium', 17000, 1965, '#0055A4', '#E30613', 67, 'Shinji Otsuka'],
  ],

  // ============================================================================
  // 20A. SOUTH KOREA — HANA BANK K LEAGUE 1 (12 Clubs)
  // ============================================================================
  'kor-kl1': [
    ['kor-kl1-any', 'FC Anyang', 'ANY', 'Anyang', 'Anyang Stadium', 17143, 2013, '#5E2784', '#FFFFFF', 68, 'Ryu Byeong-hoon'],
    ['kor-kl1-dae', 'Daegu FC', 'DAE', 'Daegu', 'DGB Daegu Bank Park', 12415, 2002, '#87CEEB', '#00205B', 71, 'Park Chang-hyun', ['Cesinha', 'Edgar Silva']],
    ['kor-kl1-dj', 'Daejeon Hana Citizen', 'DJC', 'Daejeon', 'Daejeon World Cup Stadium', 40535, 1997, '#8A1538', '#008000', 72, 'Hwang Sun-hong', ['Lee Chang-geun', 'Joo Se-jong']],
    ['kor-kl1-gan', 'Gangwon FC', 'GAN', 'Chuncheon', 'Chuncheon Songam Sports Town', 20000, 2008, '#FF6600', '#008000', 73, 'Chung Kyung-ho'],
    ['kor-kl1-gim', 'Gimcheon Sangmu FC', 'GIM', 'Gimcheon', 'Gimcheon Stadium', 25000, 1984, '#E30613', '#002D62', 73, 'Chung Jung-yong'],
    ['kor-kl1-gwa', 'Gwangju FC', 'GWA', 'Gwangju', 'Gwangju Football Stadium', 10007, 2010, '#FFCC00', '#8A1538', 73, 'Lee Jung-hyo', ['Jasir Asani']],
    ['kor-kl1-jej', 'Jeju SK FC (Jeju United)', 'JEJ', 'Seogwipo', 'Jeju World Cup Stadium', 29791, 1982, '#FF6600', '#FFFFFF', 72, 'Kim Hak-bum'],
    ['kor-kl1-jhm', 'Jeonbuk Hyundai Motors', 'JHM', 'Jeonju', 'Jeonju World Cup Stadium', 42477, 1994, '#008000', '#002D62', 75, 'Gus Poyet', ['Kim Jin-su', 'Moon Seon-min', 'Tiago Orobó']],
    ['kor-kl1-poh', 'Pohang Steelers', 'POH', 'Pohang', 'Pohang Steel Yard', 17443, 1973, '#E30613', '#000000', 75, 'Park Tae-ha', ['Oberdan Alionço', 'Wanderson']],
    ['kor-kl1-fcs', 'FC Seoul', 'FCS', 'Seoul', 'Seoul World Cup Stadium', 66704, 1983, '#E30613', '#000000', 75, 'Kim Gi-dong', ['Jesse Lingard', 'Ki Sung-yueng', 'Stanislav Iljutcenko']],
    ['kor-kl1-suw', 'Suwon FC', 'SFC', 'Suwon', 'Suwon Sports Complex', 11808, 2003, '#E30613', '#003399', 72, 'Kim Eun-jung', ['Lee Seung-woo', 'Anderson Oliveira']],
    ['kor-kl1-uhd', 'Ulsan HD FC', 'UHD', 'Ulsan', 'Ulsan Munsu Football Stadium', 44102, 1983, '#003399', '#FFCC00', 77, 'Kim Pan-gon', ['Jo Hyeon-woo', 'Kim Young-gwon', 'Ko Seung-beom', 'Joo Min-kyu', 'Darijan Bojanić']],
  ],

  // ============================================================================
  // 20B. SOUTH KOREA — HANA BANK K LEAGUE 2 (14 Clubs)
  // ============================================================================
  'kor-kl2': [
    ['kor-kl2-ans', 'Ansan Greeners FC', 'ANS', 'Ansan', 'Ansan Wa~ Stadium', 35000, 2017, '#008000', '#002D62', 62, 'Lee Kwan-woo'],
    ['kor-kl2-buc', 'Bucheon FC 1995', 'BUC', 'Bucheon', 'Bucheon Stadium', 34456, 2007, '#E30613', '#000000', 65, 'Lee Young-min'],
    ['kor-kl2-bus', 'Busan IPark', 'BUS', 'Busan', 'Busan Asiad Main Stadium', 53769, 1979, '#E30613', '#FFFFFF', 67, 'Jo Sung-hwan'],
    ['kor-kl2-chc', 'Cheonan City FC', 'CHC', 'Cheonan', 'Cheonan Stadium', 26000, 2008, '#0055A4', '#FFFFFF', 63, 'Kim Tae-wan'],
    ['kor-kl2-cba', 'Chungbuk Cheongju FC', 'CBC', 'Cheongju', 'Cheongju Stadium', 16280, 2002, '#00205B', '#FF6600', 64, 'Kwon Oh-kyu'],
    ['kor-kl2-cna', 'Chungnam Asan FC', 'CNA', 'Asan', 'Yi Sun-sin Stadium', 19283, 2020, '#003399', '#FFCC00', 66, 'Bae Sung-jae'],
    ['kor-kl2-gim', 'Gimpo FC', 'GFC', 'Gimpo', 'Gimpo Solteo Football Field', 5076, 2013, '#004A2F', '#D4AF37', 65, 'Ko Jeong-woon'],
    ['kor-kl2-gng', 'Gyeongnam FC', 'GYE', 'Changwon', 'Changwon Football Center', 15074, 2006, '#E30613', '#000000', 65, 'Lee Eul-yong'],
    ['kor-kl2-hw', 'Hwaseong FC', 'HWA', 'Hwaseong', 'Hwaseong Stadium', 35270, 2013, '#FF6600', '#000000', 62, 'Cha Du-ri'],
    ['kor-kl2-inc', 'Incheon United FC', 'INC', 'Incheon', 'Incheon Football Stadium', 20891, 2003, '#0055A4', '#000000', 69, 'Yoon Jong-hwan', ['Stefan Mugoša', 'Gerso Fernandes']],
    ['kor-kl2-jeo', 'Jeonnam Dragons', 'JND', 'Gwangyang', 'Gwangyang Football Stadium', 13496, 1994, '#FFCC00', '#000000', 66, 'Kim Hyun-seok'],
    ['kor-kl2-seon', 'Seongnam FC', 'SFC2', 'Seongnam', 'Tancheon Stadium', 16146, 1989, '#000000', '#FFFFFF', 65, 'Jeon Kyung-jun'],
    ['kor-kl2-seoe', 'Seoul E-Land FC', 'SEFC', 'Seoul', 'Mokdong Stadium', 15511, 2014, '#00205B', '#D4AF37', 67, 'Kim Do-kyun'],
    ['kor-kl2-ssb', 'Suwon Samsung Bluewings', 'SSB', 'Suwon', 'Suwon World Cup Stadium', 44031, 1995, '#0055A4', '#FFFFFF', 69, 'Byun Sung-hwan'],
  ],
};
