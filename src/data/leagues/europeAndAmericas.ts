/**
 * Batch 2: Complete 2024/25 – 2025/26 Official Club Directory for:
 * 6. Portugal (Primeira Liga 18 + Liga Portugal 2 18 = 36 clubs)
 * 7. Netherlands (Eredivisie 18 + Eerste Divisie 20 = 38 clubs)
 * 8. Brazil (Série A 20 + Série B 20 = 40 clubs)
 * 9. Argentina (Primera División 28 + Primera Nacional 36 = 64 clubs)
 * 10. Mexico (Liga MX 18 + Liga de Expansión MX 15 = 33 clubs)
 * Total in Batch 2: 211 real participating clubs.
 */

import { CompactClubTuple } from './europeTop5';

export const EUROPE_AND_AMERICAS_LEAGUE_CLUBS: Record<string, CompactClubTuple[]> = {
  // ============================================================================
  // 6A. PORTUGAL — PRIMEIRA LIGA (18 Clubs)
  // ============================================================================
  'por-pl': [
    ['por-pl-aro', 'FC Arouca', 'ARO', 'Arouca', 'Estádio Municipal de Arouca', 5600, 1951, '#FFCC00', '#003399', 72, 'Vasco Seabra', ['Nico Mantl', 'Chico Lamba', 'David Simão', 'Morlaye Sylla', 'Jason Remeseiro', 'Henrique Araújo']],
    ['por-pl-avs', 'AVS Futebol SAD', 'AVS', 'Vila das Aves', 'Estádio do CD Aves', 6230, 2023, '#E30613', '#FFFFFF', 70, 'Daniel Ramos', ['Guillermo Ochoa', 'Jorge Teixeira', 'Lucas Piazon', 'Giorgi Aburjania', 'Nené Bonilha']],
    ['por-pl-slb', 'SL Benfica', 'BEN', 'Lisbon', 'Estádio da Luz', 64642, 1904, '#E83030', '#FFFFFF', 86, 'Bruno Lage', ['Anatoliy Trubin', 'António Silva', 'Nicolás Otamendi', 'Álvaro Carreras', 'Alexander Bah', 'Florentino Luís', 'Orkun Kökçü', 'Fredrik Aursnes', 'Ángel Di María', 'Kerem Aktürkoğlu', 'Vangelis Pavlidis', 'Arthur Cabral', 'Renato Sanches']],
    ['por-pl-boa', 'Boavista FC', 'BOA', 'Porto', 'Estádio do Bessa', 28263, 1903, '#000000', '#FFFFFF', 72, 'Cristiano Bacci', ['César Dutra', 'Rodrigo Abascal', 'Sebastián Pérez', 'Ilija Vukotić', 'Salvador Agra', 'Róbert Boženík']],
    ['por-pl-scb', 'SC Braga', 'BRA', 'Braga', 'Estádio Municipal de Braga', 30286, 1921, '#E30613', '#FFFFFF', 81, 'Carlos Carvalhal', ['Matheus Magalhães', 'Sikou Niakaté', 'Paulo Oliveira', 'João Moutinho', 'Vitor Carvalho', 'Rodrigo Zalazar', 'Ricardo Horta', 'Bruma', 'Amine El Ouazzani']],
    ['por-pl-cpac', 'Casa Pia AC', 'CAS', 'Lisbon', 'Estádio Municipal de Rio Maior', 7000, 1920, '#000000', '#FFFFFF', 71, 'João Pereira', ['Patrick Sequeira', 'João Goulart', 'Duplexe Tchamba', 'Telasco Segovia', 'Nuno Moreira', 'Cassiano Dias']],
    ['por-pl-est', 'GD Estoril Praia', 'EST', 'Estoril', 'Estádio António Coimbra da Mota', 5094, 1939, '#FFCC00', '#0055A4', 72, 'Ian Cathro', ['Joel Robles', 'Pedro Álvaro', 'Wagner Pina', 'Jordan Holsgrove', 'Vinícius Zanocelo', 'Alejandro Marqués']],
    ['por-pl-eam', 'CF Estrela da Amadora', 'AMA', 'Amadora', 'Estádio José Gomes', 9288, 1932, '#E30613', '#008000', 70, 'José Faria', ['Bruno Brígido', 'Miguel Lopes', 'Danilo Veiga', 'Léo Cordeiro', 'Alan Ruiz', 'Kikas', 'Nani']],
    ['por-pl-fam', 'FC Famalicão', 'FAM', 'Vila Nova de Famalicão', 'Estádio Municipal 22 de Junho', 5186, 1931, '#003399', '#FFFFFF', 74, 'Hugo Oliveira', ['Ivan Zlobin', 'Enea Mihaj', 'Justin de Haas', 'Zaydou Youssouf', 'Mirko Topić', 'Gustavo Sá', 'Rochinha', 'Óscar Aranda']],
    ['por-pl-far', 'SC Farense', 'FAR', 'Faro', 'Estádio de São Luís', 7000, 1910, '#000000', '#FFFFFF', 70, 'Tozé Marreco', ['Ricardo Velho', 'Marco Matias', 'Cláudio Falcão', 'Álex Bermejo', 'Tomané']],
    ['por-pl-gil', 'Gil Vicente FC', 'GIL', 'Barcelos', 'Estádio Cidade de Barcelos', 12046, 1924, '#E30613', '#003399', 72, 'Bruno Pinheiro', ['Andrew Ventura', 'Rúben Fernandes', 'Mory Gbane', 'Kanya Fujimoto', 'Félix Correia', 'Jorge Aguirre']],
    ['por-pl-mor', 'Moreirense FC', 'MOR', 'Moreira de Cónegos', 'Parque de Jogos Comendador Joaquim de Almeida Freitas', 6150, 1938, '#008000', '#FFFFFF', 73, 'César Peixoto', ['Kewin Silva', 'Maracás', 'Godfried Frimpong', 'Lawrence Ofori', 'Alan', 'Luís Asué']],
    ['por-pl-nac', 'CD Nacional', 'NAC', 'Funchal', 'Estádio da Madeira', 5200, 1910, '#000000', '#FFFFFF', 70, 'Tiago Margarido', ['Lucas França', 'Ulisses Rocha', 'Luís Esteves', 'Nigel Thomas', 'Isaac Tomich']],
    ['por-pl-fcp', 'FC Porto', 'POR', 'Porto', 'Estádio do Dragão', 50033, 1893, '#00428C', '#FFFFFF', 86, 'Martín Anselmi', ['Diogo Costa', 'Nehuén Pérez', 'Otávio Ataíde', 'Wendell Borges', 'João Mário', 'Alan Varela', 'Nico González', 'Stephen Eustáquio', 'Fábio Vieira', 'Pepê Aquino', 'Galeno', 'Samu Omorodion', 'Danny Namaso']],
    ['por-pl-rio', 'Rio Ave FC', 'RIO', 'Vila do Conde', 'Estádio dos Arcos', 5300, 1939, '#008000', '#FFFFFF', 72, 'Petit', ['Cezary Miszta', 'Aderllan Santos', 'Amine Oudrhiri', 'Brandon Aguilera', 'Clayton Silva', 'Kiko Bondoso']],
    ['por-pl-sta', 'CD Santa Clara', 'STA', 'Ponta Delgada', 'Estádio de São Miguel', 12500, 1921, '#E30613', '#FFFFFF', 73, 'Vasco Matos', ['Gabriel Batista', 'Sidney Lima', 'Pedro Ferreira', 'Adriano Firmino', 'Vinícius Lopes', 'Alisson Safira']],
    ['club-emerald', 'Sporting CP', 'SCP', 'Lisbon', 'Estádio José Alvalade', 50095, 1906, '#008057', '#FFFFFF', 85, 'Rui Borges'],
    ['por-pl-vsc', 'Vitória SC (Guimarães)', 'VIT', 'Guimarães', 'Estádio D. Afonso Henriques', 30029, 1922, '#FFFFFF', '#000000', 78, 'Luís Freire', ['Bruno Varela', 'Tomás Ribeiro', 'Bruno Gaspar', 'Tomás Händel', 'Tiago Silva', 'Nuno Santos', 'Kaio César', 'Nélson Oliveira']],
  ],

  // ============================================================================
  // 6B. PORTUGAL — LIGA PORTUGAL 2 MEU SUPER (18 Clubs)
  // ============================================================================
  'por-lp2': [
    ['por-lp2-alv', 'FC Alverca', 'ALV', 'Alverca do Ribatejo', 'Complexo Desportivo FC Alverca', 7705, 1939, '#E30613', '#003399', 65, 'Vasco Botelho da Costa'],
    ['por-lp2-benb', 'SL Benfica B', 'SLBB', 'Seixal', 'Benfica Campus', 2644, 1999, '#E30613', '#FFFFFF', 68, 'Nélson Veríssimo'],
    ['por-lp2-cha', 'GD Chaves', 'CHA', 'Chaves', 'Estádio Municipal Eng. Manuel Branco Teixeira', 8400, 1949, '#8B0000', '#003399', 69, 'Marco Alves'],
    ['por-lp2-fei', 'CD Feirense', 'FEI', 'Santa Maria da Feira', 'Estádio Marcolino de Castro', 5401, 1918, '#003399', '#FFFFFF', 67, 'Vítor Martins'],
    ['por-lp2-fel', 'FC Felgueiras 1932', 'FEL', 'Felgueiras', 'Estádio Dr. Machado de Matos', 7540, 1932, '#003399', '#E30613', 65, 'Agostinho Bento'],
    ['por-lp2-lei', 'UD Leiria', 'LEI', 'Leiria', 'Estádio Dr. Magalhães Pessoa', 23888, 1966, '#E30613', '#FFFFFF', 68, 'Filipe Cândido'],
    ['por-lp2-lsc', 'Leixões SC', 'LXS', 'Matosinhos', 'Estádio do Mar', 9730, 1907, '#E30613', '#FFFFFF', 67, 'Carlos Fangueiro'],
    ['por-lp2- maf', 'CD Mafra', 'MAF', 'Mafra', 'Estádio Municipal de Mafra', 1257, 1965, '#008000', '#FFCC00', 65, 'Carlos Vaz Pinto'],
    ['por-lp2-mar', 'CS Marítimo', 'MAR', 'Funchal', 'Estádio do Marítimo', 10600, 1910, '#008000', '#E30613', 70, 'Rui Duarte'],
    ['por-lp2-oli', 'UD Oliveirense', 'OLI', 'Oliveira de Azeméis', 'Estádio Carlos Osório', 1750, 1922, '#E30613', '#003399', 65, 'Filó'],
    ['por-lp2-pac', 'FC Paços de Ferreira', 'PAC', 'Paços de Ferreira', 'Estádio Capital do Móvel', 9076, 1950, '#FFCC00', '#008000', 69, 'Ricardo Silva'],
    ['por-lp2-pen', 'FC Penafiel', 'PEN', 'Penafiel', 'Estádio Municipal 25 de Abril', 5230, 1951, '#E30613', '#000000', 68, 'Hélder Cristóvão'],
    ['por-lp2-por', 'Portimonense SC', 'PTM', 'Portimão', 'Estádio Municipal de Portimão', 6204, 1914, '#000000', '#FFFFFF', 69, 'Ricardo Pessoa'],
    ['por-lp2-fcpb', 'FC Porto B', 'FCPB', 'Vila Nova de Gaia', 'Estádio Luís Filipe Menezes', 3800, 1999, '#00428C', '#FFFFFF', 67, 'João Brandão'],
    ['por-lp2-ton', 'CD Tondela', 'TON', 'Tondela', 'Estádio João Cardoso', 5000, 1933, '#008000', '#FFCC00', 68, 'Luís Pinto'],
    ['por-lp2-tor', 'SCU Torreense', 'TOR', 'Torres Vedras', 'Estádio Manuel Marques', 2431, 1917, '#003399', '#8B0000', 67, 'Tiago Fernandes'],
    ['por-lp2-viz', 'FC Vizela', 'VIZ', 'Vizela', 'Estádio do FC Vizela', 6000, 1939, '#0055A4', '#FFFFFF', 69, 'Fábio Pereira'],
    ['por-lp2-vfc', 'Académico de Viseu FC', 'ACV', 'Viseu', 'Estádio do Fontelo', 6912, 1914, '#000000', '#FFFFFF', 67, 'Sérgio Vieira'],
  ],

  // ============================================================================
  // 7A. NETHERLANDS — EREDIVISIE (18 Clubs)
  // ============================================================================
  'ned-ere': [
    ['club-westminster', 'AFC Ajax', 'AJA', 'Amsterdam', 'Johan Cruijff ArenA', 55865, 1900, '#D2122E', '#FFFFFF', 84, 'Francesco Farioli'],
    ['ned-ere-alm', 'Almere City FC', 'ALM', 'Almere', 'Yanmar Stadion', 4501, 2001, '#E30613', '#000000', 69, 'Jeroen Rijsdijk'],
    ['ned-ere-az', 'AZ Alkmaar', 'AZ', 'Alkmaar', 'AFAS Stadion', 19478, 1967, '#DB0029', '#FFFFFF', 80, 'Maarten Martens', ['Rome-Jayden Owusu-Oduro', 'Wouter Goes', 'Alexandre Penetra', 'David Møller Wolfe', 'Seiya Maikuma', 'Jordy Clasie', 'Peer Koopmeiners', 'Sven Mijnans', 'Ruben van Bommel', 'Troy Parrott']],
    ['ned-ere-fey', 'Feyenoord Rotterdam', 'FEY', 'Rotterdam', 'De Kuip', 47500, 1908, '#E30613', '#FFFFFF', 83, 'Brian Priske', ['Timon Wellenreuther', 'Justin Bijlow', 'Dávid Hancko', 'Gernot Trauner', 'Thomas Beelen', 'Quilindschy Hartman', 'Jordan Lotomba', 'Quinten Timber', 'In-beom Hwang', 'Antoni Milambo', 'Igor Paixão', 'Santiago Giménez', 'Ayase Ueda']],
    ['ned-ere-for', 'Fortuna Sittard', 'FOR', 'Sittard', 'Fortuna Sittard Stadion', 12500, 1968, '#FFCC00', '#008000', 71, 'Danny Buijs'],
    ['ned-ere-gae', 'Go Ahead Eagles', 'GAE', 'Deventer', 'De Adelaarshorst', 10000, 1902, '#E30613', '#FFCC00', 72, 'Paul Simonis'],
    ['ned-ere-gro', 'FC Groningen', 'GRO', 'Groningen', 'Euroborg', 22550, 1971, '#008000', '#FFFFFF', 72, 'Dick Lukkien'],
    ['ned-ere-hee', 'SC Heerenveen', 'HEE', 'Heerenveen', 'Abe Lenstra Stadion', 27224, 1920, '#0055A4', '#FFFFFF', 73, 'Robin van Persie'],
    ['ned-ere-her', 'Heracles Almelo', 'HER', 'Almelo', 'Asito Stadion', 12080, 1903, '#000000', '#FFFFFF', 70, 'Erwin van de Looi'],
    ['ned-ere-nac', 'NAC Breda', 'NAC', 'Breda', 'Rat Verlegh Stadion', 19000, 1912, '#FFCC00', '#000000', 71, 'Carl Hoefkens'],
    ['ned-ere-nec', 'NEC Nijmegen', 'NEC', 'Nijmegen', 'Goffertstadion', 12500, 1900, '#E30613', '#008000', 72, 'Rogier Meijer'],
    ['ned-ere-pec', 'PEC Zwolle', 'PEC', 'Zwolle', 'MAC³PARK stadion', 14000, 1910, '#0055A4', '#FFFFFF', 71, 'Johnny Jansen'],
    ['ned-ere-psv', 'PSV Eindhoven', 'PSV', 'Eindhoven', 'Philips Stadion', 35000, 1913, '#ED1C24', '#FFFFFF', 85, 'Peter Bosz', ['Walter Benítez', 'Olivier Boscagli', 'Ryan Flamingo', 'Mauro Júnior', 'Rick Karsdorp', 'Jerdy Schouten', 'Joey Veerman', 'Malik Tillman', 'Guus Til', 'Ismael Saibari', 'Noa Lang', 'Johan Bakayoko', 'Luuk de Jong', 'Ricardo Pepi']],
    ['ned-ere-rkc', 'RKC Waalwijk', 'RKC', 'Waalwijk', 'Mandemakers Stadion', 7500, 1940, '#FFCC00', '#0055A4', 69, 'Henk Fraser'],
    ['ned-ere-spa', 'Sparta Rotterdam', 'SPA', 'Rotterdam', 'Spartastadion Het Kasteel', 11000, 1888, '#E30613', '#FFFFFF', 72, 'Maurice Steijn'],
    ['ned-ere-twe', 'FC Twente', 'TWE', 'Enschede', 'De Grolsch Veste', 30205, 1965, '#E30613', '#FFFFFF', 79, 'Joseph Oosting', ['Lars Unnerstall', 'Mees Hilgers', 'Alec Van Hoorenbeeck', 'Anass Salah-Eddine', 'Bart van Rooij', 'Michal Sadílek', 'Youri Regeer', 'Sem Steijn', 'Michel Vlap', 'Sam Lammers', 'Ricky van Wolfswinkel']],
    ['ned-ere-utr', 'FC Utrecht', 'UTR', 'Utrecht', 'Stadion Galgenwaard', 23750, 1970, '#E30613', '#FFFFFF', 76, 'Ron Jans'],
    ['ned-ere-wil', 'Willem II', 'WIL', 'Tilburg', 'Koning Willem II Stadion', 14700, 1896, '#E30613', '#003399', 71, 'Peter Maes'],
  ],

  // ============================================================================
  // 7B. NETHERLANDS — EERSTE DIVISIE (20 Clubs)
  // ============================================================================
  'ned-ed': [
    ['ned-ed-ado', 'ADO Den Haag', 'ADO', 'The Hague', 'Bingoal Stadion', 15000, 1905, '#008000', '#FFCC00', 68, 'Darije Kalezić'],
    ['ned-ed-jaj', 'Jong Ajax', 'JAJ', 'Amsterdam', 'Sportpark De Toekomst', 2250, 2013, '#D2122E', '#FFFFFF', 66, 'Frank Peereboom'],
    ['ned-ed-jaz', 'Jong AZ', 'JAZ', 'Wijdewormer', 'AFAS Trainingscomplex', 2000, 2016, '#DB0029', '#FFFFFF', 65, 'Leeroy Echteld'],
    ['ned-ed-cam', 'SC Cambuur', 'CAM', 'Leeuwarden', 'Kooi Stadion', 15000, 1964, '#FFCC00', '#0055A4', 69, 'Henk de Jong'],
    ['ned-ed-gra', 'De Graafschap', 'GRA', 'Doetinchem', 'De Vijverberg', 12600, 1954, '#0055A4', '#FFFFFF', 68, 'Marinus Dijkhuizen'],
    ['ned-ed-den', 'FC Den Bosch', 'DBO', '’s-Hertogenbosch', 'Stadion De Vliert', 8500, 1965, '#0055A4', '#FFFFFF', 65, 'Ulrich Landvreugd'],
    ['ned-ed-dor', 'FC Dordrecht', 'DOR', 'Dordrecht', 'M-Scores Stadion', 4235, 1883, '#008000', '#FFFFFF', 66, 'Melvin Boel'],
    ['ned-ed-ein', 'FC Eindhoven', 'EIN', 'Eindhoven', 'Jan Louwers Stadion', 4200, 1909, '#0055A4', '#FFFFFF', 65, 'Maurice Verberne'],
    ['ned-ed-emm', 'FC Emmen', 'EMM', 'Emmen', 'De Oude Meerdijk', 8600, 1925, '#E30613', '#FFFFFF', 68, 'Robin Peter'],
    ['ned-ed-exc', 'Excelsior Rotterdam', 'EXC', 'Rotterdam', 'Van Donge & De Roo Stadion', 4500, 1902, '#000000', '#E30613', 69, 'Ruben den Uil'],
    ['ned-ed-hel', 'Helmond Sport', 'HEL', 'Helmond', 'GS Staalwerken Stadion', 4100, 1967, '#E30613', '#000000', 65, 'Kevin Hofland'],
    ['ned-ed-mvv', 'MVV Maastricht', 'MVV', 'Maastricht', 'De Geusselt', 10000, 1902, '#E30613', '#FFFFFF', 65, 'Edwin Hermans'],
    ['ned-ed-jpsv', 'Jong PSV', 'JPSV', 'Eindhoven', 'PSV Campus De Herdgang', 2500, 2013, '#ED1C24', '#FFFFFF', 65, 'Alfons Groenendijk'],
    ['ned-ed-rod', 'Roda JC Kerkrade', 'ROD', 'Kerkrade', 'Parkstad Limburg Stadion', 19979, 1962, '#FFCC00', '#000000', 68, 'Bas Sibum'],
    ['ned-ed-tel', 'SC Telstar', 'TEL', 'Velsen-Zuid', '711 Stadion', 3060, 1963, '#FFFFFF', '#0055A4', 65, 'Anthony Correia'],
    ['ned-ed-top', 'TOP Oss', 'TOP', 'Oss', 'Frans Heesen Stadion', 4560, 1928, '#E30613', '#FFFFFF', 64, 'Sjors Ultee'],
    ['ned-ed-jutr', 'Jong FC Utrecht', 'JUTR', 'Utrecht', 'Sportcomplex Zoudenbalch', 550, 2016, '#E30613', '#FFFFFF', 64, 'Ivar van Dinteren'],
    ['ned-ed-vit', 'Vitesse Arnhem', 'VIT', 'Arnhem', 'GelreDome', 21248, 1892, '#FFCC00', '#000000', 67, 'John van den Brom'],
    ['ned-ed-vol', 'FC Volendam', 'VOL', 'Volendam', 'Kras Stadion', 7384, 1977, '#FF6600', '#000000', 68, 'Rick Kruys'],
    ['ned-ed-vvv', 'VVV-Venlo', 'VVV', 'Venlo', 'Covebo Stadion – De Koel', 8000, 1903, '#FFCC00', '#000000', 66, 'John Lammers'],
  ],

  // ============================================================================
  // 8A. BRAZIL — BRASILEIRÃO SÉRIE A (20 Clubs)
  // ============================================================================
  'bra-sa': [
    ['bra-sa-cam', 'Atlético Mineiro', 'CAM', 'Belo Horizonte', 'Arena MRV', 44892, 1908, '#000000', '#FFFFFF', 81, 'Cuca', ['Everson', 'Junior Alonso', 'Guilherme Arana', 'Gustavo Scarpa', 'Hulk Paraíba', 'Paulinho', 'Deyverson']],
    ['bra-sa-bah', 'EC Bahia', 'BAH', 'Salvador', 'Arena Fonte Nova', 50025, 1931, '#0055A4', '#E30613', 77, 'Rogério Ceni', ['Marcos Felipe', 'Kanu', 'Caio Alexandre', 'Jean Lucas', 'Éverton Ribeiro', 'Cauly', 'Thaciano']],
    ['bra-sa-bot', 'Botafogo FR', 'BOT', 'Rio de Janeiro', 'Estádio Nilton Santos', 44661, 1904, '#000000', '#FFFFFF', 83, 'Artur Jorge', ['John Victor', 'Alexander Barboza', 'Bastos', 'Alex Telles', 'Marlon Freitas', 'Gregore', 'Thiago Almada', 'Luiz Henrique', 'Jefferson Savarino', 'Igor Jesus', 'Tiquinho Soares']],
    ['bra-sa-cea', 'Ceará SC', 'CEA', 'Fortaleza', 'Arena Castelão', 63903, 1914, '#000000', '#FFFFFF', 73, 'Léo Condé'],
    ['bra-sa-cor', 'SC Corinthians Paulista', 'COR', 'São Paulo', 'Neo Química Arena', 49205, 1910, '#FFFFFF', '#000000', 81, 'Ramón Díaz', ['Hugo Souza', 'Félix Torres', 'André Ramalho', 'Rodrigo Garro', 'André Carrillo', 'Memphis Depay', 'Yuri Alberto', 'Ángel Romero']],
    ['bra-sa-cru', 'Cruzeiro EC', 'CRU', 'Belo Horizonte', 'Mineirão', 61927, 1921, '#0055A4', '#FFFFFF', 79, 'Fernando Diniz', ['Cássio Ramos', 'João Marcelo', 'Marlon Xavier', 'William Furtado', 'Lucas Romero', 'Matheus Henrique', 'Matheus Pereira', 'Kaio Jorge', 'Gabriel Veron']],
    ['club-cobalt', 'CR Flamengo', 'FLA', 'Rio de Janeiro', 'Estádio do Maracanã', 78838, 1895, '#C52613', '#000000', 84, 'Filipe Luís'],
    ['bra-sa-flu', 'Fluminense FC', 'FLU', 'Rio de Janeiro', 'Estádio do Maracanã', 78838, 1902, '#8A1538', '#008000', 79, 'Mano Menezes', ['Fábio Lopes', 'Thiago Silva', 'Jhon Arias', 'Paulo Henrique Ganso', 'Germán Cano', 'Kauã Elias']],
    ['bra-sa-for', 'Fortaleza EC', 'FOR', 'Fortaleza', 'Arena Castelão', 63903, 1918, '#0055A4', '#E30613', 78, 'Juan Pablo Vojvoda', ['João Ricardo', 'Titi', 'Hércules', 'Tomás Pochettino', 'Marinho', 'Juan Martín Lucero', 'Yago Pikachu']],
    ['bra-sa-gre', 'Grêmio FBPA', 'GRE', 'Porto Alegre', 'Arena do Grêmio', 55662, 1903, '#009FE3', '#000000', 79, 'Gustavo Quinteros', ['Agustín Marchesín', 'Walter Kannemann', 'Mathías Villasanti', 'Franco Cristaldo', 'Yeferson Soteldo', 'Martin Braithwaite']],
    ['bra-sa-int', 'SC Internacional', 'INT', 'Porto Alegre', 'Estádio Beira-Rio', 50842, 1909, '#E30613', '#FFFFFF', 80, 'Roger Machado', ['Sergio Rochet', 'Vitão', 'Alexandro Bernabei', 'Fernando Reges', 'Alan Patrick', 'Wesley Ribeiro', 'Rafael Borré', 'Enner Valencia']],
    ['bra-sa-juv', 'EC Juventude', 'JUV', 'Caxias do Sul', 'Estádio Alfredo Jaconi', 19924, 1913, '#008000', '#FFFFFF', 72, 'Fábio Matias'],
    ['bra-sa-mir', 'Mirassol FC', 'MIR', 'Mirassol', 'Estádio José Maria de Campos Maia', 15000, 1925, '#FFCC00', '#008000', 71, 'Eduardo Barroca'],
    ['bra-sa-pal', 'SE Palmeiras', 'PAL', 'São Paulo', 'Allianz Parque', 43713, 1914, '#006437', '#FFFFFF', 84, 'Abel Ferreira', ['Weverton Pereira', 'Gustavo Gómez', 'Murilo Cerqueira', 'Joaquín Piquerez', 'Aníbal Moreno', 'Richard Ríos', 'Raphael Veiga', 'Estêvão Willian', 'Felipe Anderson', 'José Manuel López']],
    ['bra-sa-rbb', 'Red Bull Bragantino', 'RBB', 'Bragança Paulista', 'Estádio Nabi Abi Chedid', 15010, 1928, '#FFFFFF', '#E30613', 76, 'Fernando Seabra'],
    ['bra-sa-san', 'Santos FC', 'SAN', 'Santos', 'Vila Belmiro', 16068, 1912, '#FFFFFF', '#000000', 78, 'Pedro Caixinha', ['João Paulo', 'Gil', 'João Schmidt', 'Diego Pituca', 'Giuliano', 'Guilherme Augusto', 'Wendel Silva']],
    ['bra-sa-sao', 'São Paulo FC', 'SAO', 'São Paulo', 'MorumBIS', 66795, 1930, '#E30613', '#000000', 81, 'Luis Zubeldía', ['Rafael Pires', 'Robert Arboleda', 'Alan Franco', 'Alisson Castro', 'Luiz Gustavo', 'Lucas Moura', 'Luciano Neves', 'Jonathan Calleri']],
    ['bra-sa-spo', 'Sport Club do Recife', 'SPO', 'Recife', 'Ilha do Retiro', 26418, 1905, '#E30613', '#000000', 73, 'Pepa'],
    ['bra-sa-vas', 'CR Vasco da Gama', 'VAS', 'Rio de Janeiro', 'Estádio São Januário', 21880, 1898, '#000000', '#FFFFFF', 78, 'Fábio Carille', ['Léo Jardim', 'João Victor', 'Lucas Piton', 'Hugo Moura', 'Philippe Coutinho', 'Dimitri Payet', 'Pablo Vegetti']],
    ['bra-sa-vit', 'EC Vitória', 'VIT', 'Salvador', 'Barradão', 30793, 1899, '#E30613', '#000000', 73, 'Thiago Carpini'],
  ],

  // ============================================================================
  // 8B. BRAZIL — BRASILEIRÃO SÉRIE B (20 Clubs)
  // ============================================================================
  'bra-sb': [
    ['bra-sb-ama', 'Amazonas FC', 'AMA', 'Manaus', 'Arena da Amazônia', 44000, 2019, '#FFCC00', '#000000', 67, 'Rafael Lacerda'],
    ['bra-sb-ame', 'América Mineiro', 'AME', 'Belo Horizonte', 'Arena Independência', 23018, 1912, '#008000', '#000000', 71, 'William Batista'],
    ['bra-sb-ath', 'Athletico Paranaense', 'CAP', 'Curitiba', 'Ligga Arena', 42372, 1924, '#E30613', '#000000', 77, 'Maurício Barbieri', ['Mycael', 'Thiago Heleno', 'Fernandinho', 'Erick', 'Bruno Zapelli', 'Agustín Canobbio', 'Gonzalo Mastriani']],
    ['bra-sb-acg', 'Atlético Goianiense', 'ACG', 'Goiânia', 'Estádio Antônio Accioly', 12500, 1937, '#E30613', '#000000', 72, 'Rafael Guanaes'],
    ['bra-sb-athf', 'Athletic Club (MG)', 'ATH', 'São João del-Rei', 'Arena Sicredi', 4600, 1909, '#000000', '#FFFFFF', 65, 'Roger Silva'],
    ['bra-sb-ava', 'Avaí FC', 'AVA', 'Florianópolis', 'Ressacada', 17800, 1923, '#0055A4', '#FFFFFF', 69, 'Enderson Moreira'],
    ['bra-sb-bsp', 'Botafogo-SP', 'BSP', 'Ribeirão Preto', 'Arena Nicnet', 29292, 1918, '#E30613', '#000000', 67, 'Márcio Zanardi'],
    ['bra-sb-cha', 'Associação Chapecoense', 'CHA', 'Chapecó', 'Arena Condá', 20089, 1973, '#008000', '#FFFFFF', 69, 'Gilmar Dal Pozzo'],
    ['bra-sb-cor', 'Coritiba FBC', 'CFC', 'Curitiba', 'Couto Pereira', 40502, 1909, '#008000', '#FFFFFF', 72, 'Mozart'],
    ['bra-sb-crb', 'Clube de Regatas Brasil (CRB)', 'CRB', 'Maceió', 'Estádio Rei Pelé', 17126, 1912, '#E30613', '#FFFFFF', 68, 'Umberto Louzer'],
    ['bra-sb-cri', 'Criciúma EC', 'CRI', 'Criciúma', 'Heriberto Hülse', 19225, 1947, '#FFCC00', '#000000', 72, 'Zé Ricardo'],
    ['bra-sb-cui', 'Cuiabá EC', 'CUI', 'Cuiabá', 'Arena Pantanal', 44097, 2001, '#008000', '#FFCC00', 73, 'Bernardo Franco'],
    ['bra-sb-fer', 'Ferroviária', 'FER', 'Araraquara', 'Fonte Luminosa', 20000, 1950, '#8A1538', '#FFFFFF', 66, 'Júnior Rocha'],
    ['bra-sb-goi', 'Goiás EC', 'GOI', 'Goiânia', 'Estádio da Serrinha', 14525, 1943, '#008000', '#FFFFFF', 72, 'Jair Ventura'],
    ['bra-sb-nov', 'Grêmio Novorizontino', 'NOV', 'Novo Horizonte', 'Jorge Ismael de Biasi', 12398, 2010, '#FFCC00', '#000000', 70, 'Eduardo Baptista'],
    ['bra-sb-ope', 'Operário Ferroviário', 'OPE', 'Ponta Grossa', 'Germano Krüger', 10632, 1912, '#000000', '#FFFFFF', 68, 'Bruno Pivetti'],
    ['bra-sb-pay', 'Paysandu SC', 'PAY', 'Belém', 'Curuzu', 16200, 1914, '#009FE3', '#FFFFFF', 68, 'Márcio Fernandes'],
    ['bra-sb-rem', 'Clube do Remo', 'REM', 'Belém', 'Baenão', 13792, 1905, '#00205B', '#FFFFFF', 67, 'Rodrigo Santana'],
    ['bra-sb-vil', 'Vila Nova FC', 'VIL', 'Goiânia', 'OBA', 11788, 1943, '#E30613', '#FFFFFF', 69, 'Rafael Lacerda'],
    ['bra-sb-vol', 'Volta Redonda FC', 'VOL', 'Volta Redonda', 'Raulino de Oliveira', 18230, 1976, '#FFCC00', '#000000', 66, 'Rogério Corrêa'],
  ],

  // ============================================================================
  // 9A. ARGENTINA — PRIMERA DIVISIÓN (LIGA PROFESIONAL, 28 Clubs)
  // ============================================================================
  'arg-lpf': [
    ['arg-lpf-arg', 'Argentinos Juniors', 'AAAJ', 'Buenos Aires', 'Diego Armando Maradona', 26000, 1904, '#E30613', '#FFFFFF', 75, 'Nicolás Diez'],
    ['arg-lpf-atu', 'Atlético Tucumán', 'ATU', 'San Miguel de Tucumán', 'Monumental José Fierro', 35200, 1902, '#87CEEB', '#FFFFFF', 73, 'Facundo Sava'],
    ['arg-lpf-ban', 'CA Banfield', 'BAN', 'Banfield', 'Florencio Sola', 34901, 1896, '#008000', '#FFFFFF', 72, 'Ariel Broggi'],
    ['arg-lpf-bar', 'Barracas Central', 'BAR', 'Buenos Aires', 'Claudio Chiqui Tapia', 4400, 1904, '#E30613', '#FFFFFF', 70, 'Rubén Darío Insúa'],
    ['arg-lpf-bel', 'CA Belgrano', 'BEL', 'Córdoba', 'Julio César Villagra', 34830, 1905, '#87CEEB', '#000000', 74, 'Walter Erviti'],
    ['club-amber', 'CA Boca Juniors', 'BOC', 'Buenos Aires', 'La Bombonera', 54000, 1905, '#003399', '#FFCC00', 82, 'Fernando Gago'],
    ['arg-lpf-cco', 'Central Córdoba (SdE)', 'CCO', 'Santiago del Estero', 'Único Madre de Ciudades', 30000, 1919, '#000000', '#FFFFFF', 71, 'Omar De Felippe'],
    ['arg-lpf-def', 'Defensa y Justicia', 'DYJ', 'Florencio Varela', 'Norberto Tomaghello', 20000, 1935, '#008000', '#FFCC00', 75, 'Pablo de Muner'],
    ['arg-lpf-ri', 'Deportivo Riestra', 'RIE', 'Buenos Aires', 'Guillermo Laza', 3000, 1931, '#000000', '#FFFFFF', 69, 'Cristian Fabbiani'],
    ['arg-lpf-est', 'Estudiantes de La Plata', 'EDLP', 'La Plata', 'Jorge Luis Hirschi (UNO)', 32530, 1905, '#E30613', '#FFFFFF', 79, 'Eduardo Domínguez', ['Matías Mansilla', 'Santiago Ascacíbar', 'Enzo Pérez', 'José Sosa', 'Guido Carrillo']],
    ['arg-lpf-gim', 'Gimnasia y Esgrima La Plata', 'GELP', 'La Plata', 'Juan Carmelo Zerillo', 30973, 1887, '#003399', '#FFFFFF', 73, 'Marcelo Méndez'],
    ['arg-lpf-god', 'Godoy Cruz', 'GOD', 'Godoy Cruz', 'Feliciano Gambarte', 21000, 1921, '#0055A4', '#FFFFFF', 75, 'Ernesto Pedernera'],
    ['arg-lpf-hur', 'CA Huracán', 'HUR', 'Buenos Aires', 'Tomás Adolfo Ducó', 48314, 1908, '#FFFFFF', '#E30613', 76, 'Frank Darío Kudelka'],
    ['arg-lpf-ind', 'CA Independiente', 'IND', 'Avellaneda', 'Libertadores de América', 42069, 1905, '#E30613', '#FFFFFF', 78, 'Julio Vaccari', ['Rodrigo Rey', 'Kevin Lomónaco', 'Iván Marcone', 'Santiago Montiel', 'Gabriel Ávalos']],
    ['arg-lpf-iriv', 'Independiente Rivadavia', 'CSIR', 'Mendoza', 'Bautista Gargantini', 24000, 1913, '#00205B', '#FFFFFF', 70, 'Alfredo Berti'],
    ['arg-lpf-ins', 'Instituto ACC', 'INS', 'Córdoba', 'Juan Domingo Perón', 26000, 1918, '#E30613', '#FFFFFF', 73, 'Pedro Troglio'],
    ['arg-lpf-lan', 'CA Lanús', 'LAN', 'Lanús', 'Ciudad de Lanús', 47027, 1915, '#8A1538', '#FFFFFF', 77, 'Mauricio Pellegrino', ['Nahuel Losada', 'Carlos Izquierdoz', 'Marcelino Moreno', 'Walter Bou']],
    ['arg-lpf-nob', 'Newell’s Old Boys', 'NOB', 'Rosario', 'Marcelo Bielsa', 42000, 1903, '#E30613', '#000000', 75, 'Mariano Soso'],
    ['arg-lpf-pla', 'CA Platense', 'PLA', 'Vicente López', 'Ciudad de Vicente López', 28530, 1905, '#624839', '#FFFFFF', 72, 'Favio Orsi'],
    ['arg-lpf-rac', 'Racing Club', 'RAC', 'Avellaneda', 'Presidente Perón (El Cilindro)', 51389, 1903, '#87CEEB', '#FFFFFF', 81, 'Gustavo Costas', ['Gabriel Arias', 'Marco Di Cesare', 'Gastón Martirena', 'Juan Nardoni', 'Agustín Almendra', 'Juan Fernando Quintero', 'Adrián Martínez', 'Maximiliano Salas']],
    ['arg-lpf-riv', 'CA River Plate', 'RIV', 'Buenos Aires', 'Mâs Monumental', 84567, 1901, '#FFFFFF', '#E30613', 84, 'Marcelo Gallardo', ['Franco Armani', 'Germán Pezzella', 'Paulo Díaz', 'Marcos Acuña', 'Fabricio Bustos', 'Matías Kranevitter', 'Santiago Simón', 'Franco Mastantuono', 'Claudio Echeverri', 'Miguel Borja', 'Facundo Colidio']],
    ['arg-lpf-ros', 'Rosario Central', 'ROS', 'Rosario', 'Gigante de Arroyito', 41465, 1889, '#003399', '#FFCC00', 76, 'Ariel Holan'],
    ['arg-lpf-slo', 'CA San Lorenzo de Almagro', 'SLO', 'Buenos Aires', 'Pedro Bidegain', 47964, 1908, '#003399', '#E30613', 77, 'Miguel Ángel Russo', ['Gastón Gómez', 'Jhohan Romaña', 'Iker Muniain', 'Nahuel Barrios']],
    ['arg-lpf-sar', 'CA Sarmiento (Junín)', 'SAR', 'Junín', 'Eva Perón', 22000, 1911, '#008000', '#FFFFFF', 70, 'Javier Sanguinetti'],
    ['arg-lpf-tal', 'CA Talleres (Córdoba)', 'TAL', 'Córdoba', 'Mario Alberto Kempes', 57000, 1913, '#00205B', '#FFFFFF', 78, 'Alexander Medina', ['Guido Herrera', 'Juan Carlos Portillo', 'Rubén Botta', 'Federico Girotti']],
    ['arg-lpf-tig', 'CA Tigre', 'TIG', 'Victoria', 'José Dellagiovanna', 26282, 1902, '#003399', '#E30613', 72, 'Diego Dabove'],
    ['arg-lpf-uni', 'CA Unión (Santa Fe)', 'UNI', 'Santa Fe', '15 de Abril', 30000, 1907, '#E30613', '#FFFFFF', 74, 'Kily González'],
    ['arg-lpf-vel', 'CA Vélez Sarsfield', 'VEL', 'Buenos Aires', 'José Amalfitani', 49540, 1910, '#FFFFFF', '#0055A4', 80, 'Sebastián Domínguez', ['Tomás Marchiori', 'Valentín Gómez', 'Christian Ordóñez', 'Claudio Aquino', 'Thiago Fernández', 'Braian Romero']],
  ],

  // ============================================================================
  // 9B. ARGENTINA — PRIMERA NACIONAL (36 Clubs)
  // ============================================================================
  'arg-pn': [
    ['arg-pn-aga', 'Agropecuario Argentino', 'AGR', 'Carlos Casares', 'Ofelia Rosenzuaig', 8000, 2011, '#008000', '#E30613', 65, 'Adrián Adrover'],
    ['arg-pn-ald', 'CA Aldosivi', 'ALD', 'Mar del Plata', 'José María Minella', 35180, 1913, '#008000', '#FFCC00', 70, 'Andrés Yllana'],
    ['arg-pn-all', 'CA All Boys', 'ALL', 'Buenos Aires', 'Islas Malvinas', 21500, 1913, '#FFFFFF', '#000000', 67, 'Mariano Campodónico'],
    ['arg-pn-alm', 'Club Almagro', 'ALM', 'José Ingenieros', 'Tres de Febrero', 19000, 1911, '#0055A4', '#000000', 65, 'Lucas Sparapani'],
    ['arg-pn-alt', 'CA Alvarado', 'ALV', 'Mar del Plata', 'José María Minella', 35180, 1928, '#003399', '#FFFFFF', 65, 'Alexis Matteo'],
    ['arg-pn-abr', 'Almirante Brown', 'ABR', 'Isidro Casanova', 'Fragata Presidente Sarmiento', 25000, 1922, '#FFCC00', '#000000', 66, 'Fabián Nardozza'],
    ['arg-pn-atl', 'CA Atlanta', 'ATL', 'Buenos Aires', 'Don León Kolbowski', 18000, 1904, '#003399', '#FFCC00', 67, 'Luis García'],
    ['arg-pn-raf', 'Atlético de Rafaela', 'RAF', 'Rafaela', 'Nuevo Monumental', 20660, 1907, '#87CEEB', '#FFFFFF', 66, 'Iván Juárez'],
    ['arg-pn-bro', 'Guillermo Brown (PM)', 'GBR', 'Puerto Madryn', 'Raúl Conti', 15000, 1945, '#003399', '#FFFFFF', 64, 'Arnaldo Sialle'],
    ['arg-pn-cha', 'CA Chacarita Juniors', 'CHA', 'Villa Maipú', 'Chacarita Juniors', 24300, 1906, '#E30613', '#000000', 68, 'Manuel Fernández'],
    ['arg-pn-cno', 'Chaco For Ever', 'CFE', 'Resistencia', 'Juan Alberto García', 25000, 1913, '#000000', '#FFFFFF', 65, 'Ricardo Pancaldo'],
    ['arg-pn-col', 'CA Colón (Santa Fe)', 'COL', 'Santa Fe', 'Brigadier General Estanislao López', 40000, 1905, '#E30613', '#000000', 71, 'Ariel Pereyra'],
    ['arg-pn-def', 'Defensores de Belgrano', 'DEF', 'Buenos Aires', 'Juan Pasquale', 10000, 1906, '#E30613', '#000000', 67, 'Carlos Mayor'],
    ['arg-pn-cad', 'Defensores Unidos (CADU)', 'CADU', 'Zárate', 'Mario Losinno', 6000, 1914, '#87CEEB', '#FFFFFF', 64, 'Darío Lema'],
    ['arg-pn-mad', 'Deportivo Madryn', 'DMA', 'Puerto Madryn', 'Abel Sastre', 8000, 1924, '#FFCC00', '#000000', 66, 'Leandro Gracián'],
    ['arg-pn-mai', 'Deportivo Maipú', 'MAI', 'Maipú', 'Omar Higinio Sperdutti', 8000, 1927, '#E30613', '#000000', 66, 'Juan Manuel Sara'],
    ['arg-pn-mor', 'Deportivo Morón', 'MOR', 'Morón', 'Nuevo Francisco Urbano', 32000, 1947, '#E30613', '#FFFFFF', 67, 'Walter Otta'],
    ['arg-pn-eba', 'Estudiantes (BA)', 'EBA', 'Caseros', 'Ciudad de Caseros', 16740, 1898, '#000000', '#FFFFFF', 67, 'Andrés Montenegro'],
    ['arg-pn-erc', 'Estudiantes (Río Cuarto)', 'ERC', 'Río Cuarto', 'Antonio Candini', 12000, 1912, '#87CEEB', '#FFFFFF', 66, 'Iván Delfino'],
    ['arg-pn-fer', 'Ferro Carril Oeste', 'FCO', 'Buenos Aires', 'Arquitecto Ricardo Etcheverri', 24442, 1904, '#008000', '#FFFFFF', 68, 'Alfredo Grelak'],
    ['arg-pn-gju', 'Gimnasia y Esgrima (Jujuy)', 'GEJ', 'San Salvador de Jujuy', '23 de Agosto', 24000, 1931, '#87CEEB', '#FFFFFF', 67, 'Matías Módolo'],
    ['arg-pn-gme', 'Gimnasia y Esgrima (Mendoza)', 'GEM', 'Mendoza', 'Víctor Legrotaglie', 14000, 1908, '#000000', '#FFFFFF', 68, 'Ezequiel Medrán'],
    ['arg-pn-gti', 'Gimnasia y Tiro (Salta)', 'GYT', 'Salta', 'El Gigante del Norte', 24300, 1902, '#87CEEB', '#FFFFFF', 66, 'Fernando Quiroz'],
    ['arg-pn-gue', 'CA Güemes', 'GUE', 'Santiago del Estero', 'Arturo Miranda', 12000, 1932, '#003399', '#E30613', 65, 'Marcelo Vázquez'],
    ['arg-pn-mit', 'CA Mitre (SdE)', 'MIT', 'Santiago del Estero', 'Doctores José y Antonio Castiglione', 21000, 1907, '#FFCC00', '#000000', 66, 'Mario Sciacqua'],
    ['arg-pn-nch', 'Nueva Chicago', 'NCH', 'Buenos Aires', 'Nueva Chicago', 25000, 1911, '#008000', '#000000', 68, 'Rodrigo Braña'],
    ['arg-pn-pat', 'CA Patronato', 'PAT', 'Paraná', 'Presbítero Bartolomé Grella', 22000, 1914, '#E30613', '#000000', 67, 'Gabriel Gómez'],
    ['arg-pn-qui', 'Quilmes AC', 'QUI', 'Quilmes', 'Centenario Ciudad de Quilmes', 30200, 1887, '#FFFFFF', '#003399', 69, 'Sergio Rondina'],
    ['arg-pn-rco', 'Racing de Córdoba', 'RCO', 'Córdoba', 'Miguel Sancho', 22000, 1924, '#87CEEB', '#FFFFFF', 66, 'Diego Cochas'],
    ['arg-pn-sma', 'San Martín de San Juan', 'SMSJ', 'San Juan', 'Hilario Sánchez', 26000, 1907, '#008000', '#000000', 69, 'Raúl Antuña'],
    ['arg-pn-smt', 'San Martín de Tucumán', 'SMT', 'San Miguel de Tucumán', 'La Ciudadela', 30500, 1909, '#E30613', '#FFFFFF', 70, 'Ariel Martos'],
    ['arg-pn-smi', 'CA San Miguel', 'SMI', 'Los Polvorines', 'Malvinas Argentinas', 7176, 1922, '#008000', '#FFFFFF', 66, 'Sebastián Battaglia'],
    ['arg-pn-ste', 'CA San Telmo', 'STE', 'Isla Maciel', 'Osvaldo Baletto', 7500, 1904, '#0055A4', '#87CEEB', 67, 'César Monasterio'],
    ['arg-pn-tde', 'CA Talleres (RdE)', 'TRE', 'Remedios de Escalada', 'Pablo Comelli', 16000, 1906, '#E30613', '#FFFFFF', 65, 'Cristian Tula'],
    ['arg-pn-tem', 'CA Temperley', 'TEM', 'Temperley', 'Alfredo Beranger', 18000, 1912, '#87CEEB', '#FFFFFF', 67, 'Aníbal Biggeri'],
    ['arg-pn-tri', 'Tristán Suárez', 'TSU', 'Tristán Suárez', '20 de Octubre', 15000, 1929, '#003399', '#FFFFFF', 65, 'José María Martínez'],
  ],

  // ============================================================================
  // 10A. MEXICO — LIGA BBVA MX (18 Clubs)
  // ============================================================================
  'mex-lmx': [
    ['mex-lmx-ame', 'Club América', 'AME', 'Mexico City', 'Estadio Ciudad de los Deportes', 36681, 1916, '#FFCC00', '#002D62', 81, 'André Jardine', ['Luis Malagón', 'Sebastián Cáceres', 'Israel Reyes', 'Cristian Borja', 'Kevin Álvarez', 'Álvaro Fidalgo', 'Jonathan dos Santos', 'Diego Valdés', 'Alejandro Zendejas', 'Brian Rodríguez', 'Henry Martín', 'Rodrigo Aguirre']],
    ['mex-lmx-atl', 'Atlas FC', 'ATL', 'Guadalajara', 'Estadio Jalisco', 55020, 1916, '#E30613', '#000000', 74, 'Gonzalo Pineda'],
    ['mex-lmx-asl', 'Atlético de San Luis', 'ASL', 'San Luis Potosí', 'Estadio Alfonso Lastras', 25709, 2013, '#E30613', '#FFFFFF', 74, 'Domènec Torrent'],
    ['mex-lmx-caz', 'Cruz Azul', 'CAZ', 'Mexico City', 'Estadio Olímpico Universitario', 72000, 1927, '#0055A4', '#E30613', 80, 'Martín Anselmi', ['Kevin Mier', 'Willer Ditta', 'Gonzalo Piovi', 'Carlos Rotondi', 'Jorge Sánchez', 'Erik Lira', 'Carlos Rodríguez', 'Lorenzo Faravelli', 'Luis Romo', 'Giorgos Giakoumakis', 'Ángel Sepúlveda']],
    ['mex-lmx-gdl', 'CD Guadalajara (Chivas)', 'GDL', 'Zapopan', 'Estadio Akron', 46232, 1906, '#E30613', '#FFFFFF', 78, 'Óscar García Junyent', ['Raúl Rangel', 'Gilberto Sepúlveda', 'Alan Mozo', 'Erick Gutiérrez', 'Fernando Beltrán', 'Roberto Alvarado', 'Cade Cowell', 'Javier Hernández']],
    ['mex-lmx-jua', 'FC Juárez', 'JUA', 'Ciudad Juárez', 'Estadio Olímpico Benito Juárez', 19703, 2015, '#008000', '#E30613', 71, 'Martín Varini'],
    ['mex-lmx-leo', 'Club León', 'LEO', 'León', 'Estadio León', 31297, 1944, '#008000', '#FFFFFF', 76, 'Eduardo Berizzo', ['Alfonso Blanco', 'Stiven Barreiro', 'Andrés Guardado', 'James Rodríguez', 'Jhonder Cádiz']],
    ['mex-lmx-maz', 'Mazatlán FC', 'MAZ', 'Mazatlán', 'Estadio El Encanto', 20195, 2020, '#5E2784', '#000000', 71, 'Víctor Manuel Vucetich'],
    ['mex-lmx-mty', 'CF Monterrey (Rayados)', 'MTY', 'Guadalupe', 'Estadio BBVA', 53500, 1945, '#002D62', '#FFFFFF', 80, 'Martín Demichelis', ['Esteban Andrada', 'Sergio Ramos', 'Stefan Medina', 'Gerardo Arteaga', 'Jorge Rodríguez', 'Óliver Torres', 'Sergio Canales', 'Lucas Ocampos', 'Jesús Corona', 'Germán Berterame', 'Brandon Vázquez']],
    ['mex-lmx-nec', 'Club Necaxa', 'NEC', 'Aguascalientes', 'Estadio Victoria', 23851, 1923, '#E30613', '#FFFFFF', 73, 'Nicolás Larcamón'],
    ['mex-lmx-pac', 'CF Pachuca', 'PAC', 'Pachuca', 'Estadio Hidalgo', 25922, 1892, '#002D62', '#FFFFFF', 77, 'Guillermo Almada', ['Carlos Moreno', 'Gustavo Cabral', 'Nelson Deossa', 'Oussama Idrissi', 'Salomón Rondón']],
    ['mex-lmx-pue', 'Club Puebla', 'PUE', 'Puebla', 'Estadio Cuauhtémoc', 51726, 1944, '#0055A4', '#FFFFFF', 71, 'Pablo Guede'],
    ['mex-lmx-qro', 'Querétaro FC', 'QRO', 'Querétaro', 'Estadio Corregidora', 34107, 1950, '#003399', '#000000', 71, 'Benjamín Mora'],
    ['mex-lmx-san', 'Santos Laguna', 'SAN', 'Torreón', 'Estadio Corona', 29101, 1983, '#008000', '#FFFFFF', 73, 'Fernando Ortiz'],
    ['mex-lmx-tij', 'Club Tijuana (Xolos)', 'TIJ', 'Tijuana', 'Estadio Caliente', 27333, 2007, '#E30613', '#000000', 74, 'Juan Carlos Osorio'],
    ['mex-lmx-tol', 'Deportivo Toluca FC', 'TOL', 'Toluca', 'Estadio Nemesio Díez', 30000, 1917, '#E30613', '#FFFFFF', 79, 'Antonio Mohamed', ['Tiago Volpi', 'Luan Garcia', 'Marcel Ruiz', 'Alexis Vega', 'Paulinho']],
    ['mex-lmx-tig', 'Tigres UANL', 'TIG', 'San Nicolás de los Garza', 'Estadio Universitario', 41886, 1960, '#FFCC00', '#003399', 80, 'Veljko Paunović', ['Nahuel Guzmán', 'Guido Pizarro', 'Fernando Gorriarán', 'Juan Brunetta', 'Sebastián Córdova', 'Diego Lainez', 'André-Pierre Gignac']],
    ['mex-lmx-pum', 'Pumas UNAM', 'PUM', 'Mexico City', 'Estadio Olímpico Universitario', 72000, 1954, '#002D62', '#D4AF37', 76, 'Gustavo Lema', ['Julio González', 'Lisandro Magallán', 'César Huerta', 'Guillermo Martínez']],
  ],

  // ============================================================================
  // 10B. MEXICO — LIGA DE EXPANSIÓN MX (15 Clubs)
  // ============================================================================
  'mex-exp': [
    ['mex-exp-ale', 'Alebrijes de Oaxaca', 'OAX', 'Oaxaca', 'Tecnológico de Oaxaca', 14598, 2012, '#FF6600', '#000000', 64, 'Carlos Gutiérrez'],
    ['mex-exp-atl', 'Atlante FC', 'ATN', 'Zacatepec', 'Agustín Coruco Díaz', 24313, 1916, '#003399', '#E30613', 68, 'Miguel de Jesús Fuentes'],
    ['mex-exp-atlp', 'Club Atlético La Paz', 'LAP', 'La Paz', 'Guaycura', 5209, 2022, '#000000', '#FFFFFF', 65, 'Raúl Rico'],
    ['mex-exp-mor', 'Atlético Morelia', 'MOR', 'Morelia', 'Estadio Morelos', 34795, 1950, '#FFCC00', '#E30613', 67, 'Ignacio Castro'],
    ['mex-exp-can', 'Cancún FC', 'CAN', 'Cancún', 'Estadio Andrés Quintana Roo', 18844, 2020, '#009FE3', '#000000', 66, 'Luis Arce'],
    ['mex-exp-cel', 'Celaya FC', 'CEL', 'Celaya', 'Miguel Alemán Valdés', 23182, 1954, '#0055A4', '#FFFFFF', 67, 'Sergio Blanco'],
    ['mex-exp-cor', 'Correcaminos UAT', 'UAT', 'Ciudad Victoria', 'Marte R. Gómez', 10520, 1980, '#FF6600', '#002D62', 64, 'Héctor Eugui'],
    ['mex-exp-dor', 'Dorados de Sinaloa', 'DOR', 'Culiacán', 'Estadio Dorados', 20108, 2003, '#D4AF37', '#000000', 65, 'Sebastián Abreu'],
    ['mex-exp-udg', 'Leones Negros UdeG', 'UDG', 'Guadalajara', 'Estadio Jalisco', 55020, 1970, '#FFCC00', '#E30613', 68, 'Alfonso Sosa'],
    ['mex-exp-min', 'Mineros de Zacatecas', 'MIN', 'Zacatecas', 'Carlos Vega Villalba', 20068, 2014, '#E30613', '#FFFFFF', 66, 'Mario García'],
    ['mex-exp-tam', 'Jaiba Brava (Tampico Madero)', 'TAM', 'Tampico', 'Estadio Tamaulipas', 19667, 1982, '#87CEEB', '#FFFFFF', 65, 'Gastón Obledo'],
    ['mex-exp-tap', 'CD Tapatío', 'TAP', 'Zapopan', 'Estadio Akron', 46232, 1973, '#E30613', '#FFFFFF', 67, 'Arturo Ortega'],
    ['mex-exp-tep', 'Tepatitlán FC', 'TEP', 'Tepatitlán', 'Gregorio Tepa Gómez', 8085, 1944, '#003399', '#E30613', 65, 'Héctor Jair Real'],
    ['mex-exp-tlx', 'Tlaxcala FC (Coyotes)', 'TLX', 'Tlaxcala', 'Estadio Tlahuicole', 11135, 2014, '#E30613', '#000000', 64, 'Luis Orozco'],
    ['mex-exp-ven', 'Venados FC Yucatán', 'VEN', 'Mérida', 'Carlos Iturralde', 15087, 1988, '#FFCC00', '#008000', 66, 'Rigoberto Esparza'],
  ],
};
