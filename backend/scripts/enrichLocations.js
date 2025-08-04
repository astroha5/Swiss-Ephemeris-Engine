const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');

async function enrichLocations() {
  try {
    let totalProcessed = 0;
    let batchCount = 0;
    
    while (true) {
      batchCount++;
      logger.info(`🔍 Starting batch ${batchCount} - Querying event titles from world_events table for enrichment...`);
      
      const { data: events, error } = await supabase
        .from('world_events')
        .select('id, title')
        .or('location_name.is.null,latitude.is.null,longitude.is.null')
        .order('created_at', { ascending: false })
        .limit(100);
    
      if (error) {
        logger.error('❌ Error querying events:', error.message);
        return;
      }

      if (!events || events.length === 0) {
        logger.info(`✅ Batch ${batchCount}: No more events found that need location enrichment`);
        logger.info(`📊 Total events processed: ${totalProcessed}`);
        return;
      }

      let batchProcessed = 0;
      for (const event of events) {
        let locationData = getLocationData(event.title);
        if (locationData) {
          logger.info(`Enriching event: "${event.title}" with location data...`);
          const { error: updateError } = await supabase
            .from('world_events')
            .update(locationData)
            .eq('id', event.id);

          if (updateError) {
            logger.error(`❌ Failed to update event "${event.title}":`, updateError.message);
          } else {
            logger.info(`✅ Successfully updated event "${event.title}" with location data.`);
            batchProcessed++;
            totalProcessed++;
          }
        } else {
          logger.warn(`⚠️ No known location data for "${event.title}", skipping...`);
        }
      }
      
      logger.info(`📈 Batch ${batchCount} complete: ${batchProcessed} events enriched`);
      
      // If we processed fewer than 100 events, we're probably done
      if (events.length < 100) {
        logger.info(`📊 All batches complete. Total events processed: ${totalProcessed}`);
        return;
      }
    }
  } catch (error) {
    logger.error('❌ Failed to enrich locations:', error.message);
  }
}

function getLocationData(title) {
  // First try exact matches
  const exactMatch = getExactLocationMatch(title);
  if (exactMatch) return exactMatch;
  
  // Then try pattern matching for battles, treaties, etc.
  const patternMatch = getPatternLocationMatch(title);
  if (patternMatch) return patternMatch;
  
  // Finally try keyword matching
  const keywordMatch = getKeywordLocationMatch(title);
  if (keywordMatch) return keywordMatch;
  
  return null;
}

// Enhanced location database
const LOCATION_DATABASE = {
  // Space locations
  'Mir space station': { location_name: 'Pacific Ocean', country_code: 'INT', latitude: -45.0, longitude: 160.0 },
  'Pacific Ocean': { location_name: 'Pacific Ocean', country_code: 'INT', latitude: -10.0, longitude: -140.0 },
  
  // Countries and regions
  'Taiwan': { location_name: 'Taipei', country_code: 'TW', latitude: 25.0330, longitude: 121.5654 },
  'Sierra Leone': { location_name: 'Freetown', country_code: 'SL', latitude: 8.4840, longitude: -13.2299 },
  'Liberia': { location_name: 'Monrovia', country_code: 'LR', latitude: 6.2907, longitude: -10.7605 },
  
  // Battle locations
  'Waterloo': { location_name: 'Waterloo', country_code: 'BE', latitude: 50.7178, longitude: 4.3982 },
  'Hastings': { location_name: 'Hastings', country_code: 'GB', latitude: 50.8544, longitude: 0.5729 },
  'Gettysburg': { location_name: 'Gettysburg', country_code: 'US', latitude: 39.8309, longitude: -77.2311 },
  'Stalingrad': { location_name: 'Volgograd', country_code: 'RU', latitude: 48.7080, longitude: 44.5133 },
  'Normandy': { location_name: 'Normandy', country_code: 'FR', latitude: 49.1829, longitude: -0.3707 },
  
  // Treaty locations
  'Versailles': { location_name: 'Versailles', country_code: 'FR', latitude: 48.8014, longitude: 2.1301 },
  'Longjumeau': { location_name: 'Longjumeau', country_code: 'FR', latitude: 48.6945, longitude: 2.2967 },
  
  // Modern cities
  'Astana': { location_name: 'Nur-Sultan', country_code: 'KZ', latitude: 51.1605, longitude: 71.4704 },
  'Nur-Sultan': { location_name: 'Nur-Sultan', country_code: 'KZ', latitude: 51.1605, longitude: 71.4704 }
};

function getExactLocationMatch(title) {
  switch (title) {
    // === PANDEMICS AND DISEASE ===
    case "1918 Spanish Flu":
      return {
        location_name: "Kansas",
        country_code: "US",
        latitude: 39.0119,
        longitude: -98.4842
      };
      
    // === MODERN EVENTS ===
    case "Bitcoin Genesis Block":
      return {
        location_name: "London",
        country_code: "GB",
        latitude: 51.5074,
        longitude: -0.1278
      };
      
    case "Prime Minister Boris Johnson put the United Kingdom into its first national lockdown in response to COVID-19.":
      return {
        location_name: "London",
        country_code: "GB",
        latitude: 51.5074,
        longitude: -0.1278
      };
      
    case "Black Monday":
      return {
        location_name: "New York City",
        country_code: "US",
        latitude: 40.7128,
        longitude: -74.0060
      };
      
    case "A container ship runs aground and obstructs the Suez Canal for six days.":
      return {
        location_name: "Suez Canal",
        country_code: "EG",
        latitude: 30.5234,
        longitude: 32.3426
      };
      
    case "The Kazakh capital of Astana was renamed to Nur-Sultan.":
      return {
        location_name: "Nur-Sultan",
        country_code: "KZ",
        latitude: 51.1605,
        longitude: 71.4704
      };
      
    case "The Affordable Care Act becomes law in the United States.":
      return {
        location_name: "Washington DC",
        country_code: "US",
        latitude: 38.9072,
        longitude: -77.0369
      };
      
    // === EXPLORATION ===
    case "After traveling through the Louisiana Purchase and reaching the Pacific Ocean, explorers Lewis and Clark and their Corps of Discovery begin their arduous journey home.":
      return {
        location_name: "Fort Clatsop",
        country_code: "US",
        latitude: 46.1351,
        longitude: -123.8804
      };
      
    // === FRENCH WARS OF RELIGION ===
    case "The Peace of Longjumeau is signed, ending the second phase of the French Wars of Religion.":
      return {
        location_name: "Longjumeau",
        country_code: "FR",
        latitude: 48.6945,
        longitude: 2.2967
      };
      
    // === ISRAELI-PALESTINIAN CONFLICT ===
    case "Israel Defense Forces kill 15 aid workers in the Rafah paramedic massacre.":
      return {
        location_name: "Rafah",
        country_code: "PS",
        latitude: 31.2989,
        longitude: 34.2467
      };
      
    // === EXISTING CASES ===
    case "The Lisbon Massacre begins, in which accused Jews are slaughtered by Portuguese Catholics.":
      return {
        location_name: "Lisbon",
        country_code: "PT",
        latitude: 38.7223,
        longitude: -9.1393
      };
      
    case "Beginning of the Protestant Reformation: After the Second Diet of Speyer bans Lutheranism, a group of rulers (German: Fürst) and independent cities protest the reinstatement of the Edict of Worms.":
      return {
        location_name: "Speyer",
        country_code: "DE",
        latitude: 49.3189,
        longitude: 8.4317
      };
      
    case "The Treaty of Frankfurt between Protestants and the Holy Roman Emperor is signed.":
      return {
        location_name: "Frankfurt",
        country_code: "DE",
        latitude: 50.1109,
        longitude: 8.6821
      };
      
    case "In Ireland, O'Doherty's Rebellion is launched by the Burning of Derry.":
      return {
        location_name: "Derry",
        country_code: "IE",
        latitude: 54.9966,
        longitude: -7.3086
      };
      
    case "The French army captures the town of Cambrai held by Spanish troops.":
      return {
        location_name: "Cambrai",
        country_code: "FR",
        latitude: 50.1759,
        longitude: 3.2355
      };
      
    case "Marie Antoinette marries Louis XVI in a proxy wedding.":
      return {
        location_name: "Vienna",
        country_code: "AT",
        latitude: 48.2082,
        longitude: 16.3738
      };
      
    case "American Revolutionary War: Following the Battles of Lexington and Concord, the Siege of Boston begins with American militias blocking land access to the British-held city.":
      return {
        location_name: "Boston",
        country_code: "US",
        latitude: 42.3601,
        longitude: -71.0589
      };
      
    case "American Revolutionary War: The war begins during the Battles of Lexington and Concord with a victory of American minutemen and other militia over British forces, later referred to as the \"shot heard ":
      return {
        location_name: "Lexington",
        country_code: "US",
        latitude: 42.4473,
        longitude: -71.2245
      };
      
    case "John Adams secures Dutch recognition of the United States as an independent government. The house which he had purchased in The Hague becomes the first American embassy.":
      return {
        location_name: "The Hague",
        country_code: "NL",
        latitude: 52.0705,
        longitude: 4.3007
      };
      
    case "An Austrian corps is defeated by the forces of the Duchy of Warsaw in the Battle of Raszyn, part of the struggles of the Fifth Coalition. On the same day the Austrian main army is defeated by a First ":
      return {
        location_name: "Raszyn",
        country_code: "PL",
        latitude: 52.1547,
        longitude: 20.9316
      };
      
    case "Venezuela achieves home rule: Vicente Emparán, Governor of the Captaincy General is removed by the people of Caracas and a junta is installed.":
      return {
        location_name: "Caracas",
        country_code: "VE",
        latitude: 10.4806,
        longitude: -66.9036
      };
      
    case "The Treaty of London establishes Belgium as a kingdom and guarantees its neutrality.":
      return {
        location_name: "London",
        country_code: "GB",
        latitude: 51.5074,
        longitude: -0.1278
      };
      
    case "American Civil War: Baltimore riot of 1861: A pro-Secession mob in Baltimore attacks United States Army troops marching through the city.":
      return {
        location_name: "Baltimore",
        country_code: "US",
        latitude: 39.2904,
        longitude: -76.6122
      };
      
    case "The Kishinev pogrom in Kishinev (Bessarabia) begins, forcing tens of thousands of Jews to later seek refuge in Palestine and the Western world.":
      return {
        location_name: "Chișinău",
        country_code: "MD",
        latitude: 47.0105,
        longitude: 28.8638
      };
      
    case "The Jaffa riots commence, initiating the 1936–1939 Arab revolt in Palestine.":
      return {
        location_name: "Jaffa",
        country_code: "IL",
        latitude: 32.0568,
        longitude: 34.7518
      };
      
    case "World War II: In German-occupied Poland, the Warsaw Ghetto Uprising begins, after German troops enter the Warsaw Ghetto to round up the remaining Jews.":
      return {
        location_name: "Warsaw",
        country_code: "PL",
        latitude: 52.2297,
        longitude: 21.0122
      };
      
    case "Actress Grace Kelly marries Prince Rainier of Monaco.":
      return {
        location_name: "Monaco",
        country_code: "MC",
        latitude: 43.7384,
        longitude: 7.4246
      };
      
    case "Launch of Salyut 1, the first space station.":
      return {
        location_name: "Baikonur",
        country_code: "KZ",
        latitude: 45.9200,
        longitude: 63.3420
      };
      
    case "Sierra Leone becomes a republic, and Siaka Stevens the president.":
      return {
        location_name: "Freetown",
        country_code: "SL",
        latitude: 8.4840,
        longitude: -13.2299
      };
      
    case "The Portuguese Socialist Party is founded in the German town of Bad Münstereifel.":
      return {
        location_name: "Bad Münstereifel",
        country_code: "DE",
        latitude: 50.5519,
        longitude: 6.7628
      };
      
    case "South Vietnamese forces withdraw from the town of Xuan Loc in the last major battle of the Vietnam War.":
      return {
        location_name: "Xuân Lộc",
        country_code: "VN",
        latitude: 10.9319,
        longitude: 107.4126
      };
      
    case "India's first satellite Aryabhata launched in orbit from Kapustin Yar, Russia.":
      return {
        location_name: "Kapustin Yar",
        country_code: "RU",
        latitude: 48.5670,
        longitude: 46.2810
      };
      
    case "A violent F5 tornado strikes around Brownwood, Texas, injuring 11 people. Two people were thrown at least 1,000 yards (910 m) by the tornado and survived uninjured.":
      return {
        location_name: "Brownwood",
        country_code: "US",
        latitude: 31.7093,
        longitude: -98.9912
      };
      
    case "The 51-day FBI siege of the Branch Davidian building in Waco, Texas, USA, ends when a fire breaks out. Seventy-six Davidians, including 18 children under age 10, died in the fire.":
      return {
        location_name: "Waco",
        country_code: "US",
        latitude: 31.5493,
        longitude: -97.1467
      };
      
    case "Oklahoma City bombing: The Alfred P. Murrah Federal Building in Oklahoma City, USA, is bombed, killing 168 people including 19 children under the age of six.":
      return {
        location_name: "Oklahoma City",
        country_code: "US",
        latitude: 35.4676,
        longitude: -97.5164
      };
      
    case "The German Bundestag returns to Berlin.":
      return {
        location_name: "Berlin",
        country_code: "DE",
        latitude: 52.5200,
        longitude: 13.4050
      };
      
    case "Air Philippines Flight 541 crashes in Samal, Davao del Norte, killing all 131 people on board.":
      return {
        location_name: "Samal",
        country_code: "PH",
        latitude: 7.0739,
        longitude: 125.7081
      };
      
    case "Cardinal Joseph Ratzinger is elected to the papacy and becomes Pope Benedict XVI.":
      return {
        location_name: "Vatican City",
        country_code: "VA",
        latitude: 41.9029,
        longitude: 12.4534
      };
      
    case "Boston Marathon bombing suspect Tamerlan Tsarnaev is killed in a shootout with police. His brother Dzhokhar is later captured hiding in a boat inside a backyard in the suburb of Watertown.":
      return {
        location_name: "Boston",
        country_code: "US",
        latitude: 42.3601,
        longitude: -71.0589
      };
      
    case "A killing spree in Nova Scotia, Canada, leaves 22 people and the perpetrator dead, making it the deadliest rampage in the country's history.":
      return {
        location_name: "Portapique",
        country_code: "CA",
        latitude: 45.4150,
        longitude: -63.2950
      };
      
    case "The Ingenuity helicopter becomes the first aircraft to achieve flight on another planet.":
      return {
        location_name: "Jezero Crater",
        country_code: "MARS",
        latitude: 18.4447,
        longitude: 77.4508
      };
      
    case "Christopher Columbus sails from La Gomera in the Canary Islands, his final port of call before crossing the Atlantic Ocean for the first time.":
      return {
        location_name: "La Gomera",
        country_code: "ES",
        latitude: 28.0916,
        longitude: -17.1133
      };
      
    case "The Victoria returns to Sanlúcar de Barrameda in Spain, the only surviving ship of Ferdinand Magellan's expedition and the first known ship to circumnavigate the world.":
      return {
        location_name: "Sanlúcar de Barrameda",
        country_code: "ES",
        latitude: 36.7780,
        longitude: -6.3520
      };
      
    case "The Pilgrims sail from Plymouth, England on the Mayflower to settle in North America. (Old Style date; September 16 per New Style date.)":
      return {
        location_name: "Plymouth",
        country_code: "GB",
        latitude: 50.3755,
        longitude: -4.1427
      };
      
    case "Puritans settle Salem, which became part of Massachusetts Bay Colony.":
      return {
        location_name: "Salem",
        country_code: "US",
        latitude: 42.5195,
        longitude: -70.8967
      };
      
    case "With no living male heirs, Charles VI, Holy Roman Emperor, issues the Pragmatic Sanction of 1713 to ensure that Habsburg lands and the Austrian throne would be inheritable by a female; his daughter an":
      return {
        location_name: "Vienna",
        country_code: "AT",
        latitude: 48.2082,
        longitude: 16.3738
      };
      
    case "Captain James Cook, still holding the rank of lieutenant, sights the eastern coast of what is now Australia.":
      return {
        location_name: "Botany Bay",
        country_code: "AU",
        latitude: -34.0104,
        longitude: 151.1969
      };
      
    case "French physicist Augustin Fresnel signs his preliminary \"Note on the Theory of Diffraction\" (deposited on the following day). The document ends with what we now call the Fresnel integrals.":
      return {
        location_name: "Paris",
        country_code: "FR",
        latitude: 48.8566,
        longitude: 2.3522
      };
      
    case "Colo-Colo, the most successful and popular soccer football team in the South American nation of Chile, was founded at the El Llano Stadium in San Miguel, Santiago, by footballer David Arellano and som":
      return {
        location_name: "Santiago",
        country_code: "CL",
        latitude: -33.4489,
        longitude: -70.6693
      };
      
    case "Mae West is sentenced to ten days in jail for obscenity for her play Sex.":
      return {
        location_name: "New York City",
        country_code: "US",
        latitude: 40.7128,
        longitude: -74.0060
      };
      
    case "World War II: In German-occupied Poland, the Majdan-Tatarski ghetto is established, situated between the Lublin Ghetto and a Majdanek subcamp.":
      return {
        location_name: "Lublin",
        country_code: "PL",
        latitude: 51.2465,
        longitude: 22.5684
      };
      
    case "Albert Hofmann deliberately doses himself with LSD for the first time, three days after having discovered its effects on April 16, an event commonly known and celebrated as Bicycle Day.":
      return {
        location_name: "Basel",
        country_code: "CH",
        latitude: 47.5596,
        longitude: 7.5886
      };
      
    case "Students in South Korea hold a nationwide pro-democracy protest against president Syngman Rhee, eventually forcing him to resign.":
      return {
        location_name: "Seoul",
        country_code: "KR",
        latitude: 37.5665,
        longitude: 126.9780
      };
      
    case "Charles Manson is sentenced to death (later commuted to life imprisonment) for conspiracy in the Tate–LaBianca murders.":
      return {
        location_name: "Los Angeles",
        country_code: "US",
        latitude: 34.0522,
        longitude: -118.2437
      };
      
    case "Advance Australia Fair is proclaimed as Australia's national anthem, and green and gold as the national colours.":
      return {
        location_name: "Canberra",
        country_code: "AU",
        latitude: -35.2809,
        longitude: 149.1300
      };
      
    case "The Simpsons first appear as a series of shorts on The Tracey Ullman Show, first starting with \"Good Night\".":
      return {
        location_name: "Los Angeles",
        country_code: "US",
        latitude: 34.0522,
        longitude: -118.2437
      };
      
    case "Space Shuttle Endeavour is launched on STS-100 carrying the Canadarm2 to the International Space Station.":
      return {
        location_name: "Kennedy Space Center",
        country_code: "US",
        latitude: 28.5721,
        longitude: -80.6480
      };
      
    case "Fidel Castro resigns as First Secretary of the Communist Party of Cuba after holding the title since July 1961.":
      return {
        location_name: "Havana",
        country_code: "CU",
        latitude: 23.1136,
        longitude: -82.3666
      };
      
    case "Thirty Years' War: In the Battle of Nördlingen, the Catholic Imperial army defeats Swedish and German Protestant forces.":
      return {
        location_name: "Nördlingen",
        country_code: "DE",
        latitude: 48.8467,
        longitude: 10.4855
      };
      
    case "American Revolutionary War: The Battle of Groton Heights takes place, resulting in a British victory.":
      return {
        location_name: "Groton",
        country_code: "US",
        latitude: 41.3501,
        longitude: -72.0787
      };
      
    case "British scientist John Dalton begins using symbols to represent the atoms of different elements.":
      return {
        location_name: "Manchester",
        country_code: "GB",
        latitude: 53.4808,
        longitude: -2.2426
      };
      
    case "American Civil War: Forces under Union General Ulysses S. Grant bloodlessly capture Paducah, Kentucky, giving the Union control of the Tennessee River's mouth.":
      return {
        location_name: "Paducah",
        country_code: "US",
        latitude: 37.0834,
        longitude: -88.6001
      };
      
    case "American Civil War: Confederate forces evacuate Battery Wagner and Morris Island in South Carolina.":
      return {
        location_name: "Charleston",
        country_code: "US",
        latitude: 32.7767,
        longitude: -79.9311
      };
      
    case "Louisa Ann Swain of Laramie, Wyoming becomes the first woman in the United States to cast a vote legally after 1807.":
      return {
        location_name: "Laramie",
        country_code: "US",
        latitude: 41.3114,
        longitude: -105.5911
      };
      
    case "Eastern Rumelia declares its union with Bulgaria, thus accomplishing Bulgarian unification.":
      return {
        location_name: "Plovdiv",
        country_code: "BG",
        latitude: 42.1354,
        longitude: 24.7453
      };
      
    case "Leon Czolgosz, an unemployed anarchist, shoots and fatally wounds US president William McKinley at the Pan-American Exposition in Buffalo, New York.":
      return {
        location_name: "Buffalo",
        country_code: "US",
        latitude: 42.8864,
        longitude: -78.8784
      };
      
    case "World War I: The First Battle of the Marne, which would halt the Imperial German Army's advance into France, begins.":
      return {
        location_name: "Marne",
        country_code: "FR",
        latitude: 48.9450,
        longitude: 3.4750
      };
      
    case "World War I: The first tank prototype, developed by William Foster & Co. for the British army, was completed and given its first test drive.":
      return {
        location_name: "Lincoln",
        country_code: "GB",
        latitude: 53.2307,
        longitude: -0.5406
      };
      
    case "Democratically elected Argentine president Hipólito Yrigoyen is deposed in a military coup.":
      return {
        location_name: "Buenos Aires",
        country_code: "AR",
        latitude: -34.6118,
        longitude: -58.3960
      };
      
    case "Spanish Civil War: The Interprovincial Council of Asturias and León is established.":
      return {
        location_name: "Oviedo",
        country_code: "ES",
        latitude: 43.3619,
        longitude: -5.8494
      };
      
    case "World War II: Union of South Africa declares war on Germany.":
      return {
        location_name: "Cape Town",
        country_code: "ZA",
        latitude: -33.9249,
        longitude: 18.4241
      };
      
    case "World War II: The British Royal Air Force suffers its first fighter pilot casualty of the Second World War at the Battle of Barking Creek as a result of friendly fire.":
      return {
        location_name: "Barking",
        country_code: "GB",
        latitude: 51.5364,
        longitude: 0.0750
      };
      
    case "King Carol II of Romania abdicates and is succeeded by his son Michael. General Ion Antonescu becomes the Conducător of Romania.":
      return {
        location_name: "Bucharest",
        country_code: "RO",
        latitude: 44.4268,
        longitude: 26.1025
      };
      
    case "Pennsylvania Railroad's premier train derails at Frankford Junction in Philadelphia, killing 79 people and injuring 117 others.":
      return {
        location_name: "Philadelphia",
        country_code: "US",
        latitude: 39.9526,
        longitude: -75.1652
      };
      
    case "The Monterrey Institute of Technology is founded in Monterrey, Mexico as one of the largest and most influential private universities in Latin America.":
      return {
        location_name: "Monterrey",
        country_code: "MX",
        latitude: 25.6866,
        longitude: -100.3161
      };
      
    case "World War II: Soviet forces capture the city of Tartu, Estonia.":
      return {
        location_name: "Tartu",
        country_code: "EE",
        latitude: 58.3019,
        longitude: 26.7342
      };
      
    case "World War II: The city of Ypres, Belgium is liberated by Allied forces.":
      return {
        location_name: "Ypres",
        country_code: "BE",
        latitude: 50.8503,
        longitude: 2.8859
      };
      
    case "United States Secretary of State James F. Byrnes announces that the U.S. will follow a policy of economic reconstruction in postwar Germany.":
      return {
        location_name: "Stuttgart",
        country_code: "DE",
        latitude: 48.7758,
        longitude: 9.1829
      };
      
    case "A prototype aircraft crashes at the Farnborough Airshow in Hampshire, England, killing 29 spectators and the two on board.":
      return {
        location_name: "Farnborough",
        country_code: "GB",
        latitude: 51.2957,
        longitude: -0.7596
      };
      
    case "Istanbul's Greek, Jewish, and Armenian minorities are the target of a government-sponsored pogrom; dozens are killed in ensuing riots.":
      return {
        location_name: "Istanbul",
        country_code: "TR",
        latitude: 41.0082,
        longitude: 28.9784
      };
      
    case "Archaeologist Peter Marsden discovers the first of the Blackfriars Ships dating back to the second century AD in the Blackfriars area of the banks of the River Thames in London.":
      return {
        location_name: "London",
        country_code: "GB",
        latitude: 51.5074,
        longitude: -0.1278
      };
      
    case "Prime Minister Hendrik Verwoerd, the architect of apartheid, is stabbed to death in Cape Town, South Africa during a parliamentary meeting.":
      return {
        location_name: "Cape Town",
        country_code: "ZA",
        latitude: -33.9249,
        longitude: 18.4241
      };
      
    case "Swaziland becomes independent.":
      return {
        location_name: "Mbabane",
        country_code: "SZ",
        latitude: -26.3054,
        longitude: 31.1367
      };
      
    case "Two passenger jets bound from Europe to New York are simultaneously hijacked by Palestinian terrorist members of the PFLP and taken to Dawson's Field, Jordan.":
      return {
        location_name: "Zarqa",
        country_code: "JO",
        latitude: 32.0728,
        longitude: 36.0876
      };
      
    case "Paninternational Flight 112 crashes on the Bundesautobahn 7 highway near Hamburg Airport, in Hamburg, Germany, killing 22.":
      return {
        location_name: "Hamburg",
        country_code: "DE",
        latitude: 53.5511,
        longitude: 9.9937
      };
      
    case "Munich massacre: Nine Israeli athletes die (along with a German policeman) at the hands of the Palestinian \"Black September\" terrorist group after being taken hostage at the Munich Olympic Games. Two ":
      return {
        location_name: "Munich",
        country_code: "DE",
        latitude: 48.1351,
        longitude: 11.5820
      };
      
    case "Cold War: Soviet Air Defence Forces pilot Viktor Belenko lands a Mikoyan-Gurevich MiG-25 jet fighter at Hakodate in Japan and requests political asylum in the United States; his request is granted.":
      return {
        location_name: "Hakodate",
        country_code: "JP",
        latitude: 41.7687,
        longitude: 140.7290
      };
      
    case "The Soviet Union admits to shooting down Korean Air Lines Flight 007, stating that its operatives did not know that it was a civilian aircraft when it reportedly violated Soviet airspace.":
      return {
        location_name: "Sakhalin",
        country_code: "RU",
        latitude: 50.4265,
        longitude: 142.7975
      };
      
    case "Midwest Express Airlines Flight 105 crashes near Milwaukee Mitchell International Airport in Milwaukee, Wisconsin, killing all 31 people on board.":
      return {
        location_name: "Milwaukee",
        country_code: "US",
        latitude: 43.0389,
        longitude: -87.9065
      };
      
    case "In Istanbul, two terrorists from Abu Nidal's organization kill 22 and wound six congregants inside the Neve Shalom Synagogue during Shabbat services.":
      return {
        location_name: "Istanbul",
        country_code: "TR",
        latitude: 41.0082,
        longitude: 28.9784
      };
      
    case "The Russian parliament approves the name change of Leningrad back to Saint Petersburg. The change is effective October 1.":
      return {
        location_name: "Saint Petersburg",
        country_code: "RU",
        latitude: 59.9311,
        longitude: 30.3609
      };
      
    case "A gun turret explodes on the USS Iowa, killing 47 sailors.":
      return {
        location_name: "Caribbean Sea",
        country_code: "US",
        latitude: 16.0000,
        longitude: -75.0000
      };
      
    case "Two hundred ATF and FBI agents lay siege to the compound of the white supremacist survivalist group The Covenant, the Sword, and the Arm of the Lord in Arkansas; the CSA surrenders two days later.":
      return {
        location_name: "Bull Shoals",
        country_code: "US",
        latitude: 36.4006,
        longitude: -92.5812
      };
      
    case "The United States government begins the Exercise Spade Fork nuclear readiness drill.":
      return {
        location_name: "Colorado Springs",
        country_code: "US",
        latitude: 38.8339,
        longitude: -104.8214
      };
      
    case "India retaliates following Pakistan's Operation Grand Slam which results in the Indo-Pakistani War of 1965 that ends in a stalemate followed by the signing of the Tashkent Declaration.":
      return {
        location_name: "Kashmir",
        country_code: "IN",
        latitude: 34.0837,
        longitude: 74.7973
      };
      
    case "The Soviet Union recognizes the independence of the Baltic states Estonia, Latvia, and Lithuania.":
      return {
        location_name: "Moscow",
        country_code: "RU",
        latitude: 55.7558,
        longitude: 37.6176
      };
      
    case "A group of hunters at the Stampede trail near Healy, Alaska came across a male corpse in abandoned bus, later identified as Christopher McCandless.":
      return {
        location_name: "Healy",
        country_code: "US",
        latitude: 63.8558,
        longitude: -148.9689
      };
      
    case "Cal Ripken Jr. of the Baltimore Orioles plays in his 2,131st consecutive game, breaking a record that had stood for 56 years.":
      return {
        location_name: "Baltimore",
        country_code: "US",
        latitude: 39.2904,
        longitude: -76.6122
      };
      
    case "Royal Brunei Airlines Flight 238 crashes in the Lambir Hills National Park while on approach to Miri Airport in Malaysia, killing 10.":
      return {
        location_name: "Miri",
        country_code: "MY",
        latitude: 4.4148,
        longitude: 114.0089
      };
      
    case "The funeral of Diana, Princess of Wales takes place in London. Well over a million people line the streets and 21⁄2 billion watch around the world on television.":
      return {
        location_name: "London",
        country_code: "GB",
        latitude: 51.5074,
        longitude: -0.1278
      };
      
    case "Google is founded by Larry Page and Sergey Brin, two students at Stanford University.":
      return {
        location_name: "Menlo Park",
        country_code: "US",
        latitude: 37.4419,
        longitude: -122.1430
      };
      
    case "The first genetically modified food goes on sale in the United Kingdom.":
      return {
        location_name: "London",
        country_code: "GB",
        latitude: 51.5074,
        longitude: -0.1278
      };
      
    case "Yasser Arafat dies at a French military hospital.":
      return {
        location_name: "Paris",
        country_code: "FR",
        latitude: 48.8566,
        longitude: 2.3522
      };
      
    case "The Deepwater Horizon drilling rig explodes in the Gulf of Mexico, killing eleven workers and beginning an oil spill that would last five months.":
      return {
        location_name: "Gulf of Mexico",
        country_code: "US",
        latitude: 28.7380,
        longitude: -88.3650
      };
      
    case "Controversial WikiLeaks releases classified documents relating to the Iraq War.":
      return {
        location_name: "London",
        country_code: "GB",
        latitude: 51.5074,
        longitude: -0.1278
      };
      
    case "Steve Jobs, co-founder and former CEO of Apple Inc., dies at his home in Palo Alto, California, aged 56.":
      return {
        location_name: "Palo Alto",
        country_code: "US",
        latitude: 37.4419,
        longitude: -122.1430
      };
      
    case "Hurricane Sandy hits the east coast of the United States, killing at least 148 people.":
      return {
        location_name: "New York City",
        country_code: "US",
        latitude: 40.7128,
        longitude: -74.0060
      };
      
    case "Nelson Mandela, former President of South Africa and anti-apartheid activist, dies aged 95.":
      return {
        location_name: "Johannesburg",
        country_code: "ZA",
        latitude: -26.2041,
        longitude: 28.0473
      };
      
    case "The World Health Organization declares the Ebola outbreak in West Africa a Public Health Emergency of International Concern.":
      return {
        location_name: "Geneva",
        country_code: "CH",
        latitude: 46.2044,
        longitude: 6.1432
      };
      
    case "Charlie Hebdo shooting: Two gunmen kill 12 people and wound 11 others at the offices of the satirical weekly newspaper Charlie Hebdo in Paris.":
      return {
        location_name: "Paris",
        country_code: "FR",
        latitude: 48.8566,
        longitude: 2.3522
      };
      
    case "The United Kingdom votes to leave the European Union.":
      return {
        location_name: "London",
        country_code: "GB",
        latitude: 51.5074,
        longitude: -0.1278
      };
      
    case "Donald Trump is elected President of the United States.":
      return {
        location_name: "New York City",
        country_code: "US",
        latitude: 40.7128,
        longitude: -74.0060
      };
      
    case "The Las Vegas shooting occurs at the Route 91 Harvest music festival, leaving 58 people dead and 546 injured.":
      return {
        location_name: "Las Vegas",
        country_code: "US",
        latitude: 36.1699,
        longitude: -115.1398
      };
      
    case "Hurricane Maria devastates Puerto Rico as a Category 4 hurricane.":
      return {
        location_name: "San Juan",
        country_code: "PR",
        latitude: 18.4655,
        longitude: -66.1057
      };
      
    case "The Camp Fire becomes the deadliest wildfire in California history, killing 85 people.":
      return {
        location_name: "Paradise",
        country_code: "US",
        latitude: 39.7596,
        longitude: -121.6219
      };
      
    case "Notre-Dame de Paris catches fire, severely damaging the cathedral.":
      return {
        location_name: "Paris",
        country_code: "FR",
        latitude: 48.8566,
        longitude: 2.3522
      };
      
    case "The World Health Organization declares COVID-19 a pandemic.":
      return {
        location_name: "Geneva",
        country_code: "CH",
        latitude: 46.2044,
        longitude: 6.1432
      };
      
    case "George Floyd is killed by police officer Derek Chauvin in Minneapolis, sparking worldwide protests.":
      return {
        location_name: "Minneapolis",
        country_code: "US",
        latitude: 44.9778,
        longitude: -93.2650
      };
      
    case "The United States Capitol is stormed by supporters of President Donald Trump.":
      return {
        location_name: "Washington DC",
        country_code: "US",
        latitude: 38.9072,
        longitude: -77.0369
      };
      
    case "Russia invades Ukraine, beginning the largest military conflict in Europe since World War II.":
      return {
        location_name: "Kiev",
        country_code: "UA",
        latitude: 50.4501,
        longitude: 30.5234
      };
      
    case "Queen Elizabeth II dies at Balmoral Castle, aged 96, after reigning for 70 years.":
      return {
        location_name: "Balmoral",
        country_code: "GB",
        latitude: 57.0395,
        longitude: -3.2301
      };
      
    case "War of Saint Sabas: In the Battle of Trapani, the Venetians defeat a larger Genoese fleet, capturing all its ships.":
      return {
        location_name: "Trapani",
        country_code: "IT",
        latitude: 38.0176,
        longitude: 12.5365
      };
      
    case "The Spanish Reconquista: In the Battle of Moclín the Emirate of Granada ambush a superior pursuing force, killing most of them in a military disaster for the Kingdom of Castile.":
      return {
        location_name: "Moclín",
        country_code: "ES",
        latitude: 37.3217,
        longitude: -3.7889
      };
      
    case "A peace treaty between the Flemish and the French is signed at Athis-sur-Orge.":
      return {
        location_name: "Athis-sur-Orge",
        country_code: "FR",
        latitude: 48.7103,
        longitude: 2.3869
      };
      
    case "First War of Scottish Independence: The Battle of Bannockburn (south of Stirling) begins.":
      return {
        location_name: "Stirling",
        country_code: "GB",
        latitude: 56.1165,
        longitude: -3.9369
      };
      
    case "Henry VIII of England and Francis I of France sign the \"Treaty of Closer Amity With France\" (also known as the Pommeraye treaty), pledging mutual aid against Charles V, Holy Roman Emperor.":
      return {
        location_name: "Greenwich",
        country_code: "GB",
        latitude: 51.4816,
        longitude: -0.0059
      };
      
    case "Dragut, commander of the Ottoman navy, dies during the Great Siege of Malta.":
      return {
        location_name: "Valletta",
        country_code: "MT",
        latitude: 35.8989,
        longitude: 14.5146
      };
      
    case "The Action of Faial, Azores. The Portuguese carrack Cinco Chagas, loaded with slaves and treasure, is attacked and sunk by English ships with only 13 survivors out of over 700 on board.":
      return {
        location_name: "Faial",
        country_code: "PT",
        latitude: 38.5581,
        longitude: -28.7078
      };
      
    case "The mutinous crew of Henry Hudson's fourth voyage sets Henry, his son and seven loyal crew members adrift in an open boat in what is now Hudson Bay; they are never heard from again.":
      return {
        location_name: "Hudson Bay",
        country_code: "CA",
        latitude: 60.0000,
        longitude: -86.0000
      };
      
    case "William Penn signs a friendship treaty with Lenape Indians in Pennsylvania.":
      return {
        location_name: "Philadelphia",
        country_code: "US",
        latitude: 39.9526,
        longitude: -75.1652
      };
      
    case "The French residents of Acadia are given one year to declare allegiance to Britain or leave Nova Scotia, Canada.":
      return {
        location_name: "Halifax",
        country_code: "CA",
        latitude: 44.6488,
        longitude: -63.5752
      };
      
    case "Battle of Plassey: Three thousand British troops under Robert Clive defeat a 50,000-strong Indian army under Siraj ud-Daulah at Plassey.":
      return {
        location_name: "Palashi",
        country_code: "IN",
        latitude: 23.7955,
        longitude: 88.2485
      };
      
    case "Seven Years' War: Battle of Krefeld: British, Hanoverian, and Prussian forces defeat French troops at Krefeld in Germany.":
      return {
        location_name: "Krefeld",
        country_code: "DE",
        latitude: 51.3388,
        longitude: 6.5853
      };
      
    case "Seven Years' War: Battle of Landeshut: Austria defeats Prussia.":
      return {
        location_name: "Landeshut",
        country_code: "PL",
        latitude: 50.8429,
        longitude: 16.2834
      };
      
    case "American Revolution: Battle of Springfield fought in and around Springfield, New Jersey (including Short Hills, formerly of Springfield, now of Millburn Township).":
      return {
        location_name: "Springfield",
        country_code: "US",
        latitude: 40.6990,
        longitude: -74.3277
      };
      
    case "Empress Catherine II of Russia grants Jews permission to settle in Kyiv.":
      return {
        location_name: "Kiev",
        country_code: "UA",
        latitude: 50.4501,
        longitude: 30.5234
      };
      
    case "John Jacob Astor forms the Pacific Fur Company.":
      return {
        location_name: "New York City",
        country_code: "US",
        latitude: 40.7128,
        longitude: -74.0060
      };
      
    case "War of 1812: Great Britain revokes the restrictions on American commerce, thus eliminating one of the chief reasons for going to war.":
      return {
        location_name: "London",
        country_code: "GB",
        latitude: 51.5074,
        longitude: -0.1278
      };
      
    case "The United States Congress establishes the Government Printing Office.":
      return {
        location_name: "Washington DC",
        country_code: "US",
        latitude: 38.9072,
        longitude: -77.0369
      };
      
    case "American Civil War: At Fort Towson in the Oklahoma Territory, Confederate Brigadier General Stand Watie surrenders the last significant Confederate army.":
      return {
        location_name: "Fort Towson",
        country_code: "US",
        latitude: 33.9487,
        longitude: -95.2669
      };
      
    case "Christopher Latham Sholes received a patent for an invention he called the \"Type-Writer\".":
      return {
        location_name: "Washington DC",
        country_code: "US",
        latitude: 38.9072,
        longitude: -77.0369
      };
      
    case "The Rocky Mountains Park Act becomes law in Canada creating the nation's first national park, Banff National Park.":
      return {
        location_name: "Banff",
        country_code: "CA",
        latitude: 51.1784,
        longitude: -115.5708
      };
      
    case "The International Olympic Committee is founded at the Sorbonne in Paris, at the initiative of Baron Pierre de Coubertin.":
      return {
        location_name: "Paris",
        country_code: "FR",
        latitude: 48.8566,
        longitude: 2.3522
      };
      
    case "Second Balkan War: The Greeks defeat the Bulgarians in the Battle of Doiran.":
      return {
        location_name: "Doiran",
        country_code: "MK",
        latitude: 41.2333,
        longitude: 22.7167
      };
      
    case "Mexican Revolution: Pancho Villa takes Zacatecas from Victoriano Huerta.":
      return {
        location_name: "Zacatecas",
        country_code: "MX",
        latitude: 22.7709,
        longitude: -102.5832
      };
      
    case "Supreme Court of India decriminalised all consensual sex among adults in private, making homosexuality legal on the Indian lands.":
      return {
        location_name: "New Delhi",
        country_code: "IN",
        latitude: 28.6139,
        longitude: 77.2090
      };
      
    case "Boris Johnson resigns as Prime Minister of the United Kingdom, and is replaced by Liz Truss. Their meetings with Queen Elizabeth II at Balmoral Castle were the Queen's final official duties before her":
      return {
        location_name: "Balmoral",
        country_code: "GB",
        latitude: 57.0395,
        longitude: -3.2301
      };
      
    case "Israel executes the air strike Operation Orchard to destroy a nuclear reactor in Syria.":
      return {
        location_name: "Deir ez-Zor",
        country_code: "SY",
        latitude: 35.3394,
        longitude: 40.1467
      };
      
    case "Mahmoud Abbas resigns from his position of Palestinian Prime Minister.":
      return {
        location_name: "Ramallah",
        country_code: "PS",
        latitude: 31.9073,
        longitude: 35.1948
      };
      
    case "The ro-ro ferry SuperFerry 9 sinks off the Zamboanga Peninsula in the Philippines with 971 persons aboard; all but ten are rescued.":
      return {
        location_name: "Zamboanga",
        country_code: "PH",
        latitude: 6.9214,
        longitude: 122.0790
      };
      
    case "Sixty-one people die after a fishing boat capsizes off the İzmir Province coast of Turkey, near the Greek Aegean islands.":
      return {
        location_name: "İzmir",
        country_code: "TR",
        latitude: 38.4192,
        longitude: 27.1287
      };
      
    case "Forty-one elephants are poisoned with cyanide in salt pans, by poachers in Hwange National Park.":
      return {
        location_name: "Hwange",
        country_code: "ZW",
        latitude: -18.6209,
        longitude: 26.5093
      };
      
    case "Russo-Ukrainian War: Ukraine begins its Kharkiv counteroffensive, surprising Russian forces and retaking over 3,000 square kilometers of land, recapturing the entire Kharkiv Oblast west of the Oskil R":
      return {
        location_name: "Kharkiv",
        country_code: "UA",
        latitude: 49.9935,
        longitude: 36.2304
      };
      
    case "In a game against the Washington Senators, Boston Red Sox pitcher Ernie Shore retires 26 batters in a row after replacing Babe Ruth, who had been ejected for punching the umpire.":
      return {
        location_name: "Boston",
        country_code: "US",
        latitude: 42.3601,
        longitude: -71.0589
      };
      
    case "Estonian War of Independence: The decisive defeat of the Baltische Landeswehr in the Battle of Cēsis; this date is celebrated as Victory Day in Estonia.":
      return {
        location_name: "Cēsis",
        country_code: "LV",
        latitude: 57.3119,
        longitude: 25.2722
      };
      
    case "Shameen Incident: British Army and French Army soldiers stationed in the concession of Shameen open fire on Chinese protesters, resulting in at least 52 deaths.":
      return {
        location_name: "Guangzhou",
        country_code: "CN",
        latitude: 23.1291,
        longitude: 113.2644
      };
      
    case "The College Board administers the first SAT exam.":
      return {
        location_name: "New York City",
        country_code: "US",
        latitude: 40.7128,
        longitude: -74.0060
      };
      
    case "Wiley Post and Harold Gatty take off from Roosevelt Field, Long Island in an attempt to circumnavigate the world in a single-engine plane.":
      return {
        location_name: "Long Island",
        country_code: "US",
        latitude: 40.7891,
        longitude: -73.1350
      };
      
    case "The Civil Aeronautics Act is signed into law, forming the Civil Aeronautics Authority in the United States.":
      return {
        location_name: "Washington DC",
        country_code: "US",
        latitude: 38.9072,
        longitude: -77.0369
      };
      
    case "Henry Larsen begins the first successful west-to-east navigation of Northwest Passage from Vancouver, British Columbia, Canada.":
      return {
        location_name: "Vancouver",
        country_code: "CA",
        latitude: 49.2827,
        longitude: -123.1207
      };
      
    case "Adolf Hitler goes on a three-hour tour of the architecture of Paris with architect Albert Speer and sculptor Arno Breker in his only visit to the city.":
      return {
        location_name: "Paris",
        country_code: "FR",
        latitude: 48.8566,
        longitude: 2.3522
      };
      
    case "The Lithuanian Activist Front declares independence from the Soviet Union and forms the Provisional Government of Lithuania; it lasts only briefly as the Nazis will occupy Lithuania a few weeks later.":
      return {
        location_name: "Vilnius",
        country_code: "LT",
        latitude: 54.6872,
        longitude: 25.2797
      };
      
    case "World War II: Germany's latest fighter aircraft, a Focke-Wulf Fw 190, is captured intact when it mistakenly lands at RAF Pembrey in Wales.":
      return {
        location_name: "Pembrey",
        country_code: "GB",
        latitude: 51.7000,
        longitude: -4.3000
      };
      
    case "An F4 tornado tears through the Appalachian Mountains, killing over 100 people in West Virginia, particularly in the town of Shinnston.":
      return {
        location_name: "Shinnston",
        country_code: "US",
        latitude: 39.3957,
        longitude: -80.3009
      };
      
    case "The 1946 Vancouver Island earthquake strikes Vancouver Island, British Columbia, Canada.":
      return {
        location_name: "Victoria",
        country_code: "CA",
        latitude: 48.4284,
        longitude: -123.3656
      };
      
    case "The United States Senate follows the United States House of Representatives in overriding U.S. President Harry S. Truman's veto of the Taft–Hartley Act.":
      return {
        location_name: "Washington DC",
        country_code: "US",
        latitude: 38.9072,
        longitude: -77.0369
      };
      
    case "The ocean liner SS United States is christened and launched.":
      return {
        location_name: "Newport News",
        country_code: "US",
        latitude: 36.9771,
        longitude: -76.4951
      };
      
    case "The French National Assembly takes the first step in creating the French Community by passing the Loi Cadre, transferring a number of powers from Paris to elected territorial governments in French Wes":
      return {
        location_name: "Paris",
        country_code: "FR",
        latitude: 48.8566,
        longitude: 2.3522
      };
      
    case "Convicted Manhattan Project spy Klaus Fuchs is released after only nine years in prison and allowed to emigrate to Dresden, East Germany where he resumes a scientific career.":
      return {
        location_name: "Dresden",
        country_code: "DE",
        latitude: 51.0504,
        longitude: 13.7373
      };
      
    case "The United States Food and Drug Administration declares Enovid to be the first officially approved combined oral contraceptive pill in the world.":
      return {
        location_name: "Washington DC",
        country_code: "US",
        latitude: 38.9072,
        longitude: -77.0369
      };
      
    case "The Antarctic Treaty System, which sets aside Antarctica as a scientific preserve and limits military activity on the continent, its islands and ice shelves, comes into force.":
      return {
        location_name: "McMurdo Station",
        country_code: "AQ",
        latitude: -77.8458,
        longitude: 166.6757
      };
      
    case "Cold War: U.S. President Lyndon B. Johnson meets with Soviet Premier Alexei Kosygin in Glassboro, New Jersey for the three-day Glassboro Summit Conference.":
      return {
        location_name: "Glassboro",
        country_code: "US",
        latitude: 39.7029,
        longitude: -75.1118
      };
      
    case "Seventy-four people were killed and 150 other injured in a stampede at a football match between Boca Juniors and Club Atlético River Plate in Buenos Aires, Argentina.":
      return {
        location_name: "Buenos Aires",
        country_code: "AR",
        latitude: -34.6118,
        longitude: -58.3960
      };
      
    case "IBM announces that effective January 1970 it will price its software and services separately from hardware thus creating the modern software industry.":
      return {
        location_name: "New York City",
        country_code: "US",
        latitude: 40.7128,
        longitude: -74.0060
      };
      
    case "Warren E. Burger is sworn in as Chief Justice of the United States Supreme Court by retiring Chief Justice Earl Warren.":
      return {
        location_name: "Washington DC",
        country_code: "US",
        latitude: 38.9072,
        longitude: -77.0369
      };
      
    case "Title IX of the United States Civil Rights Act of 1964 is amended to prohibit sexual discrimination to any educational program receiving federal funds.":
      return {
        location_name: "Washington DC",
        country_code: "US",
        latitude: 38.9072,
        longitude: -77.0369
      };
      
    case "Watergate scandal: U.S. President Richard M. Nixon and White House Chief of Staff H. R. Haldeman are taped talking about illegally using the Central Intelligence Agency to obstruct the Federal Bureau ":
      return {
        location_name: "Washington DC",
        country_code: "US",
        latitude: 38.9072,
        longitude: -77.0369
      };
      
    case "A fire at a house in Hull, England, which kills a six-year-old boy is passed off as an accident; it later emerges as the first of 26 deaths by fire caused over the next seven years by serial arsonist ":
      return {
        location_name: "Hull",
        country_code: "GB",
        latitude: 53.7457,
        longitude: -0.3367
      };
      
    case "A terrorist bomb explodes at Narita International Airport near Tokyo, killing two and injuring four. An hour later, the same group detonates a second bomb aboard Air India Flight 182, bringing the Boe":
      return {
        location_name: "Tokyo",
        country_code: "JP",
        latitude: 35.6762,
        longitude: 139.6503
      };
      
    case "Sonic the Hedgehog is released in North America on the Sega Genesis platform, beginning the popular video game franchise.":
      return {
        location_name: "San Francisco",
        country_code: "US",
        latitude: 37.7749,
        longitude: -122.4194
      };
      
    case "NASA's Space Station Processing Facility, a new state-of-the-art manufacturing building for the International Space Station, officially opens at Kennedy Space Center.":
      return {
        location_name: "Kennedy Space Center",
        country_code: "US",
        latitude: 28.5721,
        longitude: -80.6480
      };
      
    case "The 8.4 Mw southern Peru earthquake shakes coastal Peru with a maximum Mercalli intensity of VIII (Severe). A destructive tsunami followed, leaving at least 74 people dead, and 2,687 injured.":
      return {
        location_name: "Arequipa",
        country_code: "PE",
        latitude: -16.4090,
        longitude: -71.5375
      };
      
    case "American social news and discussion site Reddit is founded in Medford, Massachusetts by Steve Huffman and Alexis Ohanian.":
      return {
        location_name: "Medford",
        country_code: "US",
        latitude: 42.4184,
        longitude: -71.1061
      };
      
    case "Dmitar Zvonimir is crowned King of Croatia.":
      return {
        location_name: "Zagreb",
        country_code: "HR",
        latitude: 45.8150,
        longitude: 15.9819
      };
      
    case "Isabella of Angoulême is crowned Queen consort of England.":
      return {
        location_name: "Westminster",
        country_code: "GB",
        latitude: 51.4994,
        longitude: -0.1269
      };
      
    case "The Great Stand on the Ugra River puts an end to Tatar rule over Moscow":
      return {
        location_name: "Moscow",
        country_code: "RU",
        latitude: 55.7558,
        longitude: 37.6176
      };
      
    case "End of the Spanish siege of Alkmaar, the first Dutch victory in the Eighty Years' War.":
      return {
        location_name: "Alkmaar",
        country_code: "NL",
        latitude: 52.6316,
        longitude: 4.7487
      };
      
    case "Jeanne Mance opens the first lay hospital of North America in Montreal.":
      return {
        location_name: "Montreal",
        country_code: "CA",
        latitude: 45.5017,
        longitude: -73.5673
      };
      
    case "The Treaty of Ried is signed between Bavaria and Austria.":
      return {
        location_name: "Ried",
        country_code: "AT",
        latitude: 48.2114,
        longitude: 13.4906
      };
      
    case "The Peruvian Navy is established during the War of Independence.":
      return {
        location_name: "Lima",
        country_code: "PE",
        latitude: -12.0464,
        longitude: -77.0428
      };
      
    case "Stephenson's Rocket wins the Rainhill Trials.":
      return {
        location_name: "Liverpool",
        country_code: "GB",
        latitude: 53.4084,
        longitude: -2.9916
      };
      
    case "Ashton Eaton breaks the decathlon world record at the United States Olympic Trials.":
      return {
        location_name: "Eugene",
        country_code: "US",
        latitude: 44.0521,
        longitude: -123.0868
      };
      
    case "Militants storm a high-altitude mountaineering base camp near Nanga Parbat in Gilgit–Baltistan, Pakistan, killing ten climbers and a local guide.":
      return {
        location_name: "Nanga Parbat",
        country_code: "PK",
        latitude: 35.2372,
        longitude: 74.5896
      };
      
    case "Nik Wallenda becomes the first man to successfully walk across the Grand Canyon on a tight rope.":
      return {
        location_name: "Grand Canyon",
        country_code: "US",
        latitude: 36.0544,
        longitude: -112.1401
      };
      
    case "The last of Syria's declared chemical weapons are shipped out for destruction.":
      return {
        location_name: "Latakia",
        country_code: "SY",
        latitude: 35.5213,
        longitude: 35.7981
      };
      
    case "The United Kingdom votes in a referendum to leave the European Union, by 52% to 48%.":
      return {
        location_name: "London",
        country_code: "GB",
        latitude: 51.5074,
        longitude: -0.1278
      };
      
    case "A series of terrorist attacks take place in Pakistan, resulting in 96 deaths and wounding 200 others.":
      return {
        location_name: "Lahore",
        country_code: "PK",
        latitude: 31.5497,
        longitude: 74.3436
      };
      
    case "Twelve boys and an assistant coach from a soccer team in Thailand are trapped in a flooding cave, leading to an 18-day rescue operation.":
      return {
        location_name: "Chiang Rai",
        country_code: "TH",
        latitude: 19.9105,
        longitude: 99.8406
      };
      
    case "Mladen II Šubić of Bribir is deposed as the Croatian Ban after the Battle of Bliska.":
      return {
        location_name: "Zagreb",
        country_code: "HR",
        latitude: 45.8150,
        longitude: 15.9819
      };
      
    case "The Second Opium War between several western powers and China begins with the Arrow Incident.":
      return {
        location_name: "Guangzhou",
        country_code: "CN",
        latitude: 23.1291,
        longitude: 113.2644
      };
      
    case "American Civil War: The Confederate invasion of Kentucky is halted at the Battle of Perryville.":
      return {
        location_name: "Perryville",
        country_code: "US",
        latitude: 37.6456,
        longitude: -84.9547
      };
      
    case "Slash-and-burn land management, months of drought, and the passage of a strong cold front cause the Peshtigo Fire, the Great Chicago Fire and the Great Michigan Fires to break out.":
      return {
        location_name: "Chicago",
        country_code: "US",
        latitude: 41.8781,
        longitude: -87.6298
      };
      
    case "War of the Pacific: The Chilean Navy defeats the Peruvian Navy in the Battle of Angamos.":
      return {
        location_name: "Angamos",
        country_code: "PE",
        latitude: -23.7000,
        longitude: -70.4000
      };
      
    case "Korean Empress Myeongseong is assassinated by Japanese infiltrators.":
      return {
        location_name: "Seoul",
        country_code: "KR",
        latitude: 37.5665,
        longitude: 126.9780
      };
      
    case "The First Balkan War begins when Montenegro declares war against the Ottoman Empire.":
      return {
        location_name: "Podgorica",
        country_code: "ME",
        latitude: 42.4304,
        longitude: 19.2594
      };
      
    case "World War I: Corporal Alvin C. York kills 28 German soldiers and captures 132 for which he was awarded the Medal of Honor.":
      return {
        location_name: "Argonne Forest",
        country_code: "FR",
        latitude: 49.2330,
        longitude: 4.8500
      };
      
    case "KDKA in Pittsburgh's Forbes Field conducts the first live broadcast of a football game.":
      return {
        location_name: "Pittsburgh",
        country_code: "US",
        latitude: 40.4406,
        longitude: -79.9959
      };
      
    case "World War II: Germany annexes western Poland.":
      return {
        location_name: "Warsaw",
        country_code: "PL",
        latitude: 52.2297,
        longitude: 21.0122
      };
      
    case "World War II: During the preliminaries of the Battle of Rostov, German forces reach the Sea of Azov with the capture of Mariupol.":
      return {
        location_name: "Mariupol",
        country_code: "UA",
        latitude: 47.0971,
        longitude: 37.5431
      };
      
    case "World War II: Around 30 civilians are executed by Friedrich Schubert's paramilitary group in Kallikratis, Crete.":
      return {
        location_name: "Crete",
        country_code: "GR",
        latitude: 35.2401,
        longitude: 24.8093
      };
      
    case "World War II: Captain Bobbie Brown earns a Medal of Honor for his actions during the Battle of Crucifix Hill, just outside Aachen.":
      return {
        location_name: "Aachen",
        country_code: "DE",
        latitude: 50.7753,
        longitude: 6.0839
      };
      
    case "The Harrow and Wealdstone rail crash kills 112 people.":
      return {
        location_name: "Harrow",
        country_code: "GB",
        latitude: 51.5794,
        longitude: -0.3370
      };
      
    case "The New York Yankees's Don Larsen pitches the only perfect game in a World Series.":
      return {
        location_name: "New York City",
        country_code: "US",
        latitude: 40.7128,
        longitude: -74.0060
      };
      
    case "Der Spiegel publishes an article disclosing the sorry state of the Bundeswehr, and is soon accused of treason.":
      return {
        location_name: "Hamburg",
        country_code: "DE",
        latitude: 53.5511,
        longitude: 9.9937
      };
      
    case "Guerrilla leader Che Guevara and his men are captured in Bolivia.":
      return {
        location_name: "Vallegrande",
        country_code: "BO",
        latitude: -18.4892,
        longitude: -64.1125
      };
      
    case "The opening rally of the Days of Rage occurs, organized by the Weather Underground in Chicago.":
      return {
        location_name: "Chicago",
        country_code: "US",
        latitude: 41.8781,
        longitude: -87.6298
      };
      
    case "Aleksandr Solzhenitsyn wins the Nobel Prize in literature.":
      return {
        location_name: "Stockholm",
        country_code: "SE",
        latitude: 59.3293,
        longitude: 18.0686
      };
      
    case "Spyros Markezinis begins his 48-day term as prime minister in an abortive attempt to lead Greece to parliamentary rule.":
      return {
        location_name: "Athens",
        country_code: "GR",
        latitude: 37.9755,
        longitude: 23.7348
      };
      
    case "Yom Kippur War: Israel loses more than 150 tanks in a failed attack on Egyptian-occupied positions.":
      return {
        location_name: "Sinai Peninsula",
        country_code: "EG",
        latitude: 28.5000,
        longitude: 33.8000
      };
      
    case "Franklin National Bank collapses due to fraud and mismanagement; at the time it is the largest bank failure in the history of the United States.":
      return {
        location_name: "New York City",
        country_code: "US",
        latitude: 40.7128,
        longitude: -74.0060
      };
      
    case "Australia's Ken Warby sets the current world water speed record of 275.97 knots at Blowering Dam, Australia.":
      return {
        location_name: "Tumut",
        country_code: "AU",
        latitude: -35.3053,
        longitude: 148.2186
      };
      
    case "After its London premiere, Cats opens on Broadway and runs for nearly 18 years before closing on September 10, 2000.":
      return {
        location_name: "New York City",
        country_code: "US",
        latitude: 40.7128,
        longitude: -74.0060
      };
      
    case "Poland bans Solidarity and all other trade unions.":
      return {
        location_name: "Warsaw",
        country_code: "PL",
        latitude: 52.2297,
        longitude: 21.0122
      };
      
    case "First Intifada: Israeli police kill 17 Palestinians and wound over 100 near the Dome of the Rock.":
      return {
        location_name: "Jerusalem",
        country_code: "IL",
        latitude: 31.7683,
        longitude: 35.2137
      };
      
    case "Upon the expiration of the Brioni Agreement, Croatia and Slovenia sever all official relations with Yugoslavia.":
      return {
        location_name: "Zagreb",
        country_code: "HR",
        latitude: 45.8150,
        longitude: 15.9819
      };
      
    case "U.S. President George W. Bush announces the establishment of the Office of Homeland Security.":
      return {
        location_name: "Washington DC",
        country_code: "US",
        latitude: 38.9072,
        longitude: -77.0369
      };
      
    case "A twin engine Cessna and a Scandinavian Airlines System jetliner collide in heavy fog during takeoff from Milan, Italy, killing 118 people.":
      return {
        location_name: "Milan",
        country_code: "IT",
        latitude: 45.4642,
        longitude: 9.1900
      };
      
    case "The 7.6 Mw Kashmir earthquake leaves 86,000–87,351 people dead, 69,000–75,266 injured, and 2.8 million homeless.":
      return {
        location_name: "Muzaffarabad",
        country_code: "PK",
        latitude: 34.3700,
        longitude: 73.4711
      };
      
    case "Thomas Eric Duncan, the first person in the United States to be diagnosed with Ebola, dies.":
      return {
        location_name: "Dallas",
        country_code: "US",
        latitude: 32.7767,
        longitude: -96.7970
      };
      
    case "In the wake of Hurricane Matthew, the death toll rises to nearly 900.":
      return {
        location_name: "Haiti",
        country_code: "HT",
        latitude: 18.9712,
        longitude: -72.2852
      };
      
    case "About 200 Extinction Rebellion activists block the gates of Leinster House (parliament) in the Republic of Ireland.":
      return {
        location_name: "Dublin",
        country_code: "IE",
        latitude: 53.3498,
        longitude: -6.2603
      };
      
    case "Second Nagorno-Karabakh War: Azerbaijan twice deliberately targeted the Church of the Holy Savior Ghazanchetsots of Shusha.":
      return {
        location_name: "Shusha",
        country_code: "AZ",
        latitude: 39.7611,
        longitude: 46.7519
      };
      
    case "Second Barons' War: Battle of Evesham: The army of Prince Edward (the future king Edward I of England) defeats the forces of rebellious barons led by Simon de Montfort, 6th Earl of Leicester, killing ":
      return {
        location_name: "Evesham",
        country_code: "GB",
        latitude: 52.0938,
        longitude: -1.9456
      };
      
    case "First War of Scottish Independence: James Douglas leads a raid into Weardale and almost kills Edward III of England.":
      return {
        location_name: "Durham",
        country_code: "GB",
        latitude: 54.7761,
        longitude: -1.5733
      };
      
    case "Battle of Al Kasr al Kebir: The Moroccans defeat the Portuguese. King Sebastian of Portugal is killed in the battle, leaving his elderly uncle, Cardinal Henry, as his heir. This initiates a succession":
      return {
        location_name: "Ksar el-Kebir",
        country_code: "MA",
        latitude: 34.9955,
        longitude: -5.9048
      };
      
    case "Date traditionally ascribed to Dom Perignon's invention of champagne; it is not clear whether he actually invented champagne, however he has been credited as an innovator who developed the techniques ":
      return {
        location_name: "Reims",
        country_code: "FR",
        latitude: 49.2583,
        longitude: 4.0317
      };
      
    case "Great Peace of Montreal between New France and First Nations is signed.":
      return {
        location_name: "Montreal",
        country_code: "CA",
        latitude: 45.5017,
        longitude: -73.5673
      };
      
    case "War of the Spanish Succession: Gibraltar is captured by an English and Dutch fleet, commanded by Admiral Sir George Rooke and allied with Archduke Charles.":
      return {
        location_name: "Gibraltar",
        country_code: "GI",
        latitude: 36.1408,
        longitude: -5.3536
      };
      
    case "Fourth Anglo-Dutch War, a fleet of six East India Company ships sets sail from Fort Marlborough to raid the Dutch VOC factories on the West coast of Sumatra including the major port of Padang.":
      return {
        location_name: "Padang",
        country_code: "ID",
        latitude: -0.9493,
        longitude: 100.3543
      };
      
    case "Mount Asama erupts in Japan, killing about 1,400 people (Tenmei eruption). The eruption causes a famine, which results in an additional 20,000 deaths.":
      return {
        location_name: "Mount Asama",
        country_code: "JP",
        latitude: 36.4064,
        longitude: 138.5273
      };
      
    case "France: abolition of feudalism by the National Constituent Assembly.":
      return {
        location_name: "Paris",
        country_code: "FR",
        latitude: 48.8566,
        longitude: 2.3522
      };
      
    // === ADDITIONAL SPACE EVENTS ===
    case "The Russian Mir space station is disposed of, breaking up in the atmosphere before falling into the southern Pacific Ocean near Fiji.":
      return {
        location_name: "Pacific Ocean",
        country_code: "INT",
        latitude: -45.0,
        longitude: 160.0
      };
      
    case "Taiwan holds its first direct elections and chooses Lee Teng-hui as President.":
      return {
        location_name: "Taipei",
        country_code: "TW",
        latitude: 25.0330,
        longitude: 121.5654
      };
      
    case "The Revolutionary United Front, with support from the special forces of Charles Taylor's National Patriotic Front of Liberia, invades Sierra Leone in an attempt to overthrow Joseph Saidu Momoh, sparki":
      return {
        location_name: "Freetown",
        country_code: "SL",
        latitude: 8.4840,
        longitude: -13.2299
      };

    default:
      return null;
  }
}

// Pattern matching function for battles, treaties, etc.
function getPatternLocationMatch(title) {
  const patterns = [
    // Battle patterns
    { regex: /Battle of ([^,\(]+)/i, type: 'battle' },
    { regex: /Siege of ([^,\(]+)/i, type: 'siege' },
    { regex: /Treaty of ([^,\(]+)/i, type: 'treaty' },
    { regex: /Peace of ([^,\(]+)/i, type: 'peace' },
    // Geographic patterns
    { regex: /\bin ([A-Z][a-zA-Z\s]+), ([A-Z][a-zA-Z]+)/i, type: 'geographic' },
    { regex: /\bat ([A-Z][a-zA-Z\s]+)/i, type: 'location' }
  ];
  
  for (const pattern of patterns) {
    const match = title.match(pattern.regex);
    if (match) {
      const locationName = match[1].trim();
      if (LOCATION_DATABASE[locationName]) {
        return LOCATION_DATABASE[locationName];
      }
    }
  }
  
  return null;
}

// Keyword matching function
function getKeywordLocationMatch(title) {
  const titleLower = title.toLowerCase();
  
  // Check for direct location matches in our database
  for (const [keyword, locationData] of Object.entries(LOCATION_DATABASE)) {
    if (titleLower.includes(keyword.toLowerCase())) {
      return locationData;
    }
  }
  
  // Context-based matching
  const contextMappings = {
    'united states': { location_name: 'Washington DC', country_code: 'US', latitude: 38.9072, longitude: -77.0369 },
    'united kingdom': { location_name: 'London', country_code: 'GB', latitude: 51.5074, longitude: -0.1278 },
    'soviet union': { location_name: 'Moscow', country_code: 'RU', latitude: 55.7558, longitude: 37.6176 },
    'space station': { location_name: 'Low Earth Orbit', country_code: 'SPACE', latitude: 0.0, longitude: 0.0 },
    'pacific ocean': { location_name: 'Pacific Ocean', country_code: 'INT', latitude: -10.0, longitude: -140.0 },
    'suez canal': { location_name: 'Suez Canal', country_code: 'EG', latitude: 30.5234, longitude: 32.3426 }
  };
  
  for (const [context, locationData] of Object.entries(contextMappings)) {
    if (titleLower.includes(context)) {
      return locationData;
    }
  }
  
  return null;
}

if (require.main === module) {
  enrichLocations();
}

module.exports = { enrichLocations, getLocationData };
