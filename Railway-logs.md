2025-12-05T18:01:04.000000000Z [inf] Starting Container
2025-12-05T18:01:05.317414976Z [err] npm warn config production Use `--omit=dev` instead.
2025-12-05T18:01:05.317421288Z [inf]  
2025-12-05T18:01:05.317427920Z [inf] > astrova-backend@1.0.0 start
2025-12-05T18:01:05.317434827Z [inf] > node server.js
2025-12-05T18:01:05.317440656Z [inf]  
2025-12-05T18:01:05.317447167Z [inf] [2025-12-05 18:01:04] [32minfo[39m: Astronomy Engine service initialized as fallback
2025-12-05T18:01:05.317459741Z [inf] [2025-12-05 18:01:04] [32minfo[39m: Swiss Ephemeris loaded successfully - will use for enhanced accuracy
2025-12-05T18:01:05.317467614Z [inf] [2025-12-05 18:01:04] [32minfo[39m: 🔧 DEBUG - Setting Lahiri Ayanamsa: SE_SIDM_LAHIRI = 1
2025-12-05T18:01:05.317473599Z [inf] [2025-12-05 18:01:04] [32minfo[39m: 🔧 DEBUG - Lahiri Ayanamsa set successfully
2025-12-05T18:01:05.317480039Z [inf] [2025-12-05 18:01:04] [32minfo[39m: Enhanced Swiss Ephemeris initialized with Lahiri Ayanamsa
2025-12-05T18:01:05.317487367Z [inf] [2025-12-05 18:01:04] [32minfo[39m: 🕉️ Vedic Aspects Service initialized with house-based drishti calculations
2025-12-05T18:01:05.317494459Z [inf] [2025-12-05 18:01:04] [32minfo[39m: 📐 Rahu/Ketu special aspects: DISABLED
2025-12-05T18:01:05.317500621Z [inf] [2025-12-05 18:01:04] [32minfo[39m: 🚀 Astrova Backend running on port 8080
2025-12-05T18:01:05.317507331Z [inf] [2025-12-05 18:01:04] [32minfo[39m: 📍 Environment: production
2025-12-05T18:01:05.317522407Z [inf] [2025-12-05 18:01:04] [32minfo[39m: 🔗 Health check: http://localhost:8080/health
2025-12-05T18:01:05.317528787Z [inf] [2025-12-05 18:01:04] [32minfo[39m: 📚 API docs: http://localhost:8080/
2025-12-05T18:01:44.877397159Z [err] ValidationError: The 'X-Forwarded-For' header is set but the Express 'trust proxy' setting is false (default). This could indicate a misconfiguration which would prevent express-rate-limit from accurately identifying users. See https://express-rate-limit.github.io/ERR_ERL_UNEXPECTED_X_FORWARDED_FOR/ for more information.
2025-12-05T18:01:44.877403188Z [err] at Object.xForwardedForHeader (/app/backend/node_modules/express-rate-limit/dist/index.cjs:185:13)
2025-12-05T18:01:44.877409139Z [err] at wrappedValidations.<computed> [as xForwardedForHeader] (/app/backend/node_modules/express-rate-limit/dist/index.cjs:397:22)
2025-12-05T18:01:44.877415334Z [err] at Object.keyGenerator (/app/backend/node_modules/express-rate-limit/dist/index.cjs:658:20)
2025-12-05T18:01:44.877421482Z [err] at /app/backend/node_modules/express-rate-limit/dist/index.cjs:710:32
2025-12-05T18:01:44.877428432Z [err] at async /app/backend/node_modules/express-rate-limit/dist/index.cjs:691:5 {
2025-12-05T18:01:44.877463739Z [err] code: 'ERR_ERL_UNEXPECTED_X_FORWARDED_FOR',
2025-12-05T18:01:44.877492826Z [err] help: 'https://express-rate-limit.github.io/ERR_ERL_UNEXPECTED_X_FORWARDED_FOR/'
2025-12-05T18:01:44.877506577Z [err] }
2025-12-05T18:01:44.877515580Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🔍 VALIDATION RESULT: {"date":"2000-09-30","time":"12:00","latitude":22.5726,"longitude":88.3639,"timezone":"Asia/Kolkata","name":"Rahul Jana","place":"Kolkata"}
2025-12-05T18:01:44.877542014Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🔍 EXTRACTED VALUES: date=2000-09-30, time=12:00, lat=22.5726, lng=88.3639, tz=Asia/Kolkata
2025-12-05T18:01:44.877550285Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🔍 TYPE CHECK: lat=number, lng=number
2025-12-05T18:01:44.877560233Z [inf] [2025-12-05 18:01:41] [32minfo[39m: Generating Kundli for 2000-09-30 12:00 at 22.5726, 88.3639
2025-12-05T18:01:44.877570266Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🌍 COORDINATES OBJECT: {"lat":22.5726,"lng":88.3639}
2025-12-05T18:01:44.880956189Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 📊 Coordinates: 22.5726°N, 88.3639°E
2025-12-05T18:01:44.880961296Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🕐 Julian Day calculation for: 2000-09-30 12:00 at Kolkata
2025-12-05T18:01:44.880966542Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 📍 Input Parameters: Date=2000-09-30, Time=12:00, Timezone=Asia/Kolkata
2025-12-05T18:01:44.880972251Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🗓️ Year: 2000 (Historical: NO)
2025-12-05T18:01:44.880972551Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🌍 Coordinates: Lat=22.5726, Lon=88.3639
2025-12-05T18:01:44.880977721Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🔧 Using enhanced historical timezone handler
2025-12-05T18:01:44.880982228Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🕐 Modern timezone conversion using Asia/Kolkata
2025-12-05T18:01:44.880983096Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🔍 TIMEZONE CONVERSION START:
2025-12-05T18:01:44.880988430Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 📅 Original: 2000-09-30 12:00
2025-12-05T18:01:44.880992673Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 📍 Place: Kolkata
2025-12-05T18:01:44.880997898Z [inf] [2025-12-05 18:01:41] [32minfo[39m: ✅ RESULT: 2000-09-30 06:30 UTC
2025-12-05T18:01:44.881000438Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🌐 Timezone: Asia/Kolkata
2025-12-05T18:01:44.881006641Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🔢 Offset source: Modern timezone data
2025-12-05T18:01:44.881014506Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 📊 Enhanced JD: 2451817.77083333 (Historical: false)
2025-12-05T18:01:44.881021819Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🔄 Enhanced UTC Conversion Details:
2025-12-05T18:01:44.881029259Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 📅 Original Local: 2000-09-30 12:00 (Asia/Kolkata)
2025-12-05T18:01:44.881035851Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🌐 Final UTC: 2000-09-30 Hour=6.5
2025-12-05T18:01:44.884840046Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🌐 UTC Decimal Hour: 6.5
2025-12-05T18:01:44.884850288Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 📊 Final Julian Day: 2451817.77083333
2025-12-05T18:01:44.884861037Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🎯 Julian Day Verification: JD=2451817.77083333 should correspond to UTC 2000-09-30 Hour=6.5
2025-12-05T18:01:44.884870170Z [inf] [2025-12-05 18:01:41] [31merror[39m: Error calculating Sun position:
2025-12-05T18:01:44.884880211Z [inf] [2025-12-05 18:01:41] [31merror[39m: Error calculating Moon position: Astronomy.MoonPosition is not a function
2025-12-05T18:01:44.884887474Z [err] Trace
2025-12-05T18:01:44.884897264Z [err] at VerifyBoolean (/app/backend/node_modules/astronomy-engine/astronomy.js:194:17)
2025-12-05T18:01:44.884906748Z [err] at Object.GeoVector (/app/backend/node_modules/astronomy-engine/astronomy.js:3888:5)
2025-12-05T18:01:44.884915973Z [err] at AstronomyEngineService.getPlanetaryPositions (/app/backend/services/astronomyEngine.js:98:34)
2025-12-05T18:01:44.884924844Z [err] at EnhancedSwissEphemerisService.getPlanetaryPositions (/app/backend/services/enhancedSwissEphemeris.js:218:46)
2025-12-05T18:01:44.884933056Z [err] at generateKundli (/app/backend/controllers/kundliController.js:201:62)
2025-12-05T18:01:44.884940516Z [err] at Layer.handle [as handle_request] (/app/backend/node_modules/express/lib/router/layer.js:95:5)
2025-12-05T18:01:44.884948356Z [err] at next (/app/backend/node_modules/express/lib/router/route.js:149:13)
2025-12-05T18:01:44.884956219Z [err] at Route.dispatch (/app/backend/node_modules/express/lib/router/route.js:119:3)
2025-12-05T18:01:44.884964664Z [err] at Layer.handle [as handle_request] (/app/backend/node_modules/express/lib/router/layer.js:95:5)
2025-12-05T18:01:44.884973622Z [err] at /app/backend/node_modules/express/lib/router/index.js:284:15
2025-12-05T18:01:44.887674028Z [inf] [2025-12-05 18:01:41] [31merror[39m: Error calculating Mercury position:
2025-12-05T18:01:44.887682798Z [err] Trace
2025-12-05T18:01:44.887690452Z [err] at VerifyBoolean (/app/backend/node_modules/astronomy-engine/astronomy.js:194:17)
2025-12-05T18:01:44.887699974Z [err] at Object.GeoVector (/app/backend/node_modules/astronomy-engine/astronomy.js:3888:5)
2025-12-05T18:01:44.887705441Z [err] at AstronomyEngineService.getPlanetaryPositions (/app/backend/services/astronomyEngine.js:98:34)
2025-12-05T18:01:44.887711320Z [err] at EnhancedSwissEphemerisService.getPlanetaryPositions (/app/backend/services/enhancedSwissEphemeris.js:218:46)
2025-12-05T18:01:44.887716662Z [err] at generateKundli (/app/backend/controllers/kundliController.js:201:62)
2025-12-05T18:01:44.887722270Z [err] at Layer.handle [as handle_request] (/app/backend/node_modules/express/lib/router/layer.js:95:5)
2025-12-05T18:01:44.887759302Z [err] at next (/app/backend/node_modules/express/lib/router/route.js:149:13)
2025-12-05T18:01:44.887771120Z [err] at Route.dispatch (/app/backend/node_modules/express/lib/router/route.js:119:3)
2025-12-05T18:01:44.887784292Z [err] at Layer.handle [as handle_request] (/app/backend/node_modules/express/lib/router/layer.js:95:5)
2025-12-05T18:01:44.887797856Z [err] at /app/backend/node_modules/express/lib/router/index.js:284:15
2025-12-05T18:01:44.887815055Z [inf] [2025-12-05 18:01:41] [31merror[39m: Error calculating Venus position:
2025-12-05T18:01:44.887823141Z [err] Trace
2025-12-05T18:01:44.887830389Z [err] at VerifyBoolean (/app/backend/node_modules/astronomy-engine/astronomy.js:194:17)
2025-12-05T18:01:44.887837938Z [err] at Object.GeoVector (/app/backend/node_modules/astronomy-engine/astronomy.js:3888:5)
2025-12-05T18:01:44.887844275Z [err] at AstronomyEngineService.getPlanetaryPositions (/app/backend/services/astronomyEngine.js:98:34)
2025-12-05T18:01:44.889981084Z [err] at generateKundli (/app/backend/controllers/kundliController.js:201:62)
2025-12-05T18:01:44.889990857Z [err] at Layer.handle [as handle_request] (/app/backend/node_modules/express/lib/router/layer.js:95:5)
2025-12-05T18:01:44.889991089Z [err] at Layer.handle [as handle_request] (/app/backend/node_modules/express/lib/router/layer.js:95:5)
2025-12-05T18:01:44.889997793Z [err] at EnhancedSwissEphemerisService.getPlanetaryPositions (/app/backend/services/enhancedSwissEphemeris.js:218:46)
2025-12-05T18:01:44.890000581Z [err] at next (/app/backend/node_modules/express/lib/router/route.js:149:13)
2025-12-05T18:01:44.890002752Z [err] at /app/backend/node_modules/express/lib/router/index.js:284:15
2025-12-05T18:01:44.890009798Z [err] at Route.dispatch (/app/backend/node_modules/express/lib/router/route.js:119:3)
2025-12-05T18:01:44.890011626Z [inf] [2025-12-05 18:01:41] [31merror[39m: Error calculating Mars position:
2025-12-05T18:01:44.890018400Z [err] at AstronomyEngineService.getPlanetaryPositions (/app/backend/services/astronomyEngine.js:98:34)
2025-12-05T18:01:44.890019807Z [err] Trace
2025-12-05T18:01:44.890026677Z [err] at VerifyBoolean (/app/backend/node_modules/astronomy-engine/astronomy.js:194:17)
2025-12-05T18:01:44.890031735Z [err] at EnhancedSwissEphemerisService.getPlanetaryPositions (/app/backend/services/enhancedSwissEphemeris.js:218:46)
2025-12-05T18:01:44.890035020Z [err] at Object.GeoVector (/app/backend/node_modules/astronomy-engine/astronomy.js:3888:5)
2025-12-05T18:01:44.890039965Z [err] at generateKundli (/app/backend/controllers/kundliController.js:201:62)
2025-12-05T18:01:44.890045537Z [err] at Layer.handle [as handle_request] (/app/backend/node_modules/express/lib/router/layer.js:95:5)
2025-12-05T18:01:44.890050907Z [err] at next (/app/backend/node_modules/express/lib/router/route.js:149:13)
2025-12-05T18:01:44.890057222Z [err] at Route.dispatch (/app/backend/node_modules/express/lib/router/route.js:119:3)
2025-12-05T18:01:44.892774604Z [err] at Layer.handle [as handle_request] (/app/backend/node_modules/express/lib/router/layer.js:95:5)
2025-12-05T18:01:44.892780605Z [err] at /app/backend/node_modules/express/lib/router/index.js:284:15
2025-12-05T18:01:44.892785572Z [inf] [2025-12-05 18:01:41] [31merror[39m: Error calculating Jupiter position:
2025-12-05T18:01:44.892790761Z [err] Trace
2025-12-05T18:01:44.892795804Z [err] at VerifyBoolean (/app/backend/node_modules/astronomy-engine/astronomy.js:194:17)
2025-12-05T18:01:44.892800803Z [err] at Object.GeoVector (/app/backend/node_modules/astronomy-engine/astronomy.js:3888:5)
2025-12-05T18:01:44.892805700Z [err] at AstronomyEngineService.getPlanetaryPositions (/app/backend/services/astronomyEngine.js:98:34)
2025-12-05T18:01:44.892810823Z [err] at EnhancedSwissEphemerisService.getPlanetaryPositions (/app/backend/services/enhancedSwissEphemeris.js:218:46)
2025-12-05T18:01:44.892814944Z [err] at generateKundli (/app/backend/controllers/kundliController.js:201:62)
2025-12-05T18:01:44.892819469Z [err] at Layer.handle [as handle_request] (/app/backend/node_modules/express/lib/router/layer.js:95:5)
2025-12-05T18:01:44.892824253Z [err] at next (/app/backend/node_modules/express/lib/router/route.js:149:13)
2025-12-05T18:01:44.892828922Z [err] at Route.dispatch (/app/backend/node_modules/express/lib/router/route.js:119:3)
2025-12-05T18:01:44.892834149Z [err] at Layer.handle [as handle_request] (/app/backend/node_modules/express/lib/router/layer.js:95:5)
2025-12-05T18:01:44.892839037Z [err] at /app/backend/node_modules/express/lib/router/index.js:284:15
2025-12-05T18:01:44.892843242Z [inf] [2025-12-05 18:01:41] [31merror[39m: Error calculating Saturn position:
2025-12-05T18:01:44.892847296Z [inf] [2025-12-05 18:01:41] [32minfo[39m: Astronomy Engine returned 2 planets
2025-12-05T18:01:44.892851249Z [inf] [2025-12-05 18:01:41] [32minfo[39m: useAstronomyEngine: false (has main planets: false)
2025-12-05T18:01:44.895267274Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🌙 Current sign: Libra (#7)
2025-12-05T18:01:44.895278019Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🌙 Final determination: Moon in Libra
2025-12-05T18:01:44.895284693Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🌙 ==========================================
2025-12-05T18:01:44.895293147Z [inf] [2025-12-05 18:01:41] [32minfo[39m: Using Swiss Ephemeris as primary calculation engine...
2025-12-05T18:01:44.895299942Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🔍 DEBUG - Julian Day: 2451817.7708333335
2025-12-05T18:01:44.895306292Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🔍 DEBUG - Calculation Type: SIDEREAL
2025-12-05T18:01:44.895318570Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🔍 DEBUG - Flags: 65792 (SEFLG_SIDEREAL: 65536)
2025-12-05T18:01:44.895324798Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🔄 Re-confirmed Lahiri Ayanamsa setting before planetary calculations
2025-12-05T18:01:44.895331295Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 📐 Ayanamsa (Lahiri) for JD 2451817.77083333: 23.867524°
2025-12-05T18:01:44.895339369Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 📐 Ayanamsa in DMS: 23°52'03"
2025-12-05T18:01:44.895345563Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🔍 DEBUG - Calculating SUN (ID: 0)
2025-12-05T18:01:44.895351901Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🔍 DEBUG - Calculating MOON (ID: 1)
2025-12-05T18:01:44.895358437Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🌙 ========== MOON DETAILED ANALYSIS ==========
2025-12-05T18:01:44.895364175Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🌙 Raw longitude: 194.47173739°
2025-12-05T18:01:44.895370434Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🌙 Sign boundary: 180° to 210°
2025-12-05T18:01:44.895378661Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🌙 Distance from sign start: 14.471737°
2025-12-05T18:01:44.895385960Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🌙 Distance from sign end: 15.528263°
2025-12-05T18:01:44.897298578Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🔍 DEBUG - Calculating MERCURY (ID: 2)
2025-12-05T18:01:44.897302206Z [inf] [2025-12-05 18:01:41] [32minfo[39m: Using Swiss Ephemeris for enhanced ascendant calculation...
2025-12-05T18:01:44.897310636Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🔍 DEBUG - Calculating VENUS (ID: 3)
2025-12-05T18:01:44.897316611Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🔄 Re-confirmed Lahiri Ayanamsa for Ascendant calculation
2025-12-05T18:01:44.897319260Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🔍 DEBUG - Calculating MARS (ID: 4)
2025-12-05T18:01:44.897327770Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🔍 DEBUG - Calculating JUPITER (ID: 5)
2025-12-05T18:01:44.897328264Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🌅 Calculating Ascendant with flags: 65536
2025-12-05T18:01:44.897336977Z [inf] 🌟 Starting Navamsa calculations...
2025-12-05T18:01:44.897338025Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🔍 DEBUG - Calculating SATURN (ID: 6)
2025-12-05T18:01:44.897346737Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🔍 DEBUG - Calculating RAHU (ID: 11)
2025-12-05T18:01:44.897347219Z [inf] 🔄 Navamsa Position Calc: 163.53771909397392° -> Virgo 13.54° -> Navamsa 5 -> Taurus 1.84°
2025-12-05T18:01:44.897354651Z [inf] 🔄 Sun: Virgo 13°32'15" -> Navamsa: Taurus 1°50'22"
2025-12-05T18:01:44.897360631Z [inf] 🔄 Navamsa Position Calc: 194.47173739166996° -> Libra 14.47° -> Navamsa 5 -> Aquarius 10.25°
2025-12-05T18:01:44.897368471Z [inf] 🔄 Moon: Libra 14°28'18" -> Navamsa: Aquarius 10°14'44"
2025-12-05T18:01:44.897375852Z [inf] 🔄 Navamsa Position Calc: 188.22186965586923° -> Libra 8.22° -> Navamsa 3 -> Sagittarius 14.00°
2025-12-05T18:01:44.897383241Z [inf] 🔄 Mercury: Libra 8°13'18" -> Navamsa: Sagittarius 13°59'48"
2025-12-05T18:01:44.897391895Z [inf] 🔄 Navamsa Position Calc: 193.012342921704° -> Libra 13.01° -> Navamsa 4 -> Capricorn 27.11°
2025-12-05T18:01:44.899744898Z [inf] navamsaAscendant: { longitude: 95.13892221946648, sign: 'Cancer', signNumber: 4 }
2025-12-05T18:01:44.899749646Z [inf] 🔄 Rahu: Gemini 27°25'25" -> Navamsa: Gemini 6°48'53"
2025-12-05T18:01:44.899751727Z [inf] ✅ Navamsa calculations completed
2025-12-05T18:01:44.899757878Z [inf] }
2025-12-05T18:01:44.899761375Z [inf] 🔄 Navamsa Position Calc: 267.42386177839836° -> Sagittarius 27.42° -> Navamsa 9 -> Sagittarius 6.81°
2025-12-05T18:01:44.899762353Z [inf] 🔄 Navamsa Position Calc: 250.5709913577185° -> Sagittarius 10.57° -> Navamsa 4 -> Cancer 5.14°
2025-12-05T18:01:44.899766861Z [inf] 🏠 Navamsa Planet Placement: Sun -> House 11 (Taurus)
2025-12-05T18:01:44.899770949Z [inf] 🔄 Ketu: Sagittarius 27°25'25" -> Navamsa: Sagittarius 6°48'53"
2025-12-05T18:01:44.899771584Z [inf] 🔍 Navamsa Ascendant Calculation: {
2025-12-05T18:01:44.899774504Z [inf] 🔄 Venus: Libra 13°00'44" -> Navamsa: Capricorn 27°06'39"
2025-12-05T18:01:44.899776377Z [inf] 🏠 Navamsa Planet Placement: Moon -> House 8 (Aquarius)
2025-12-05T18:01:44.899779778Z [inf] lagnaAscendant: { longitude: 250.5709913577185, sign: 'Sagittarius', signNumber: 9 },
2025-12-05T18:01:44.899786937Z [inf] 🔄 Navamsa Position Calc: 134.47996849287085° -> Leo 14.48° -> Navamsa 5 -> Leo 10.32°
2025-12-05T18:01:44.899786975Z [inf] 🔄 Jupiter: Taurus 17°22'15" -> Navamsa: Gemini 6°20'15"
2025-12-05T18:01:44.899795227Z [inf] 🔄 Navamsa Position Calc: 36.83296864660441° -> Taurus 6.83° -> Navamsa 3 -> Pisces 1.50°
2025-12-05T18:01:44.899795320Z [inf] 🔄 Mars: Leo 14°28'47" -> Navamsa: Leo 10°19'10"
2025-12-05T18:01:44.899803023Z [inf] 🔄 Saturn: Taurus 6°49'58" -> Navamsa: Pisces 1°29'48"
2025-12-05T18:01:44.899803237Z [inf] 🔄 Navamsa Position Calc: 47.3708374066324° -> Taurus 17.37° -> Navamsa 6 -> Gemini 6.34°
2025-12-05T18:01:44.899809323Z [inf] 🔄 Navamsa Position Calc: 87.42386177839836° -> Gemini 27.42° -> Navamsa 9 -> Gemini 6.81°
2025-12-05T18:01:44.901627221Z [inf] 🏠 Navamsa Planet Placement: Mercury -> House 6 (Sagittarius)
2025-12-05T18:01:44.901631734Z [inf] 🏠 Navamsa Planet Placement: Venus -> House 7 (Capricorn)
2025-12-05T18:01:44.901637085Z [inf] 🏠 Navamsa Planet Placement: Mars -> House 2 (Leo)
2025-12-05T18:01:44.901641635Z [inf] 🏠 Navamsa Planet Placement: Jupiter -> House 12 (Gemini)
2025-12-05T18:01:44.901645837Z [inf] 🏠 Navamsa Planet Placement: Saturn -> House 9 (Pisces)
2025-12-05T18:01:44.901650221Z [inf] 🏠 Navamsa Planet Placement: Rahu -> House 12 (Gemini)
2025-12-05T18:01:44.901654246Z [inf] 🏠 Navamsa Planet Placement: Ketu -> House 6 (Sagittarius)
2025-12-05T18:01:44.901659022Z [inf] 🎯 Final Navamsa Houses: [
2025-12-05T18:01:44.901664458Z [inf] { number: 1, sign: 'Cancer', planets: [] },
2025-12-05T18:01:44.901668624Z [inf] { number: 2, sign: 'Leo', planets: [ 'Mars' ] },
2025-12-05T18:01:44.901672580Z [inf] { number: 3, sign: 'Virgo', planets: [] },
2025-12-05T18:01:44.901676452Z [inf] { number: 4, sign: 'Libra', planets: [] },
2025-12-05T18:01:44.901680369Z [inf] { number: 5, sign: 'Scorpio', planets: [] },
2025-12-05T18:01:44.901685999Z [inf] { number: 6, sign: 'Sagittarius', planets: [ 'Mercury', 'Ketu' ] },
2025-12-05T18:01:44.901690104Z [inf] { number: 7, sign: 'Capricorn', planets: [ 'Venus' ] },
2025-12-05T18:01:44.901694751Z [inf] { number: 8, sign: 'Aquarius', planets: [ 'Moon' ] },
2025-12-05T18:01:44.901698765Z [inf] { number: 9, sign: 'Pisces', planets: [ 'Saturn' ] },
2025-12-05T18:01:44.901703031Z [inf] { number: 10, sign: 'Aries', planets: [] },
2025-12-05T18:01:44.901707303Z [inf] { number: 11, sign: 'Taurus', planets: [ 'Sun' ] },
2025-12-05T18:01:44.901711551Z [inf] { number: 12, sign: 'Gemini', planets: [ 'Jupiter', 'Rahu' ] }
2025-12-05T18:01:44.901716929Z [inf] ]
2025-12-05T18:01:44.901721378Z [inf] DEBUG - Before transform, planetaryPositions keys: [
2025-12-05T18:01:44.904558109Z [inf] 'sun', 'moon',
2025-12-05T18:01:44.904565801Z [inf] 'mercury', 'venus',
2025-12-05T18:01:44.904573087Z [inf] 'mars', 'jupiter',
2025-12-05T18:01:44.904590752Z [inf] 'saturn', 'rahu',
2025-12-05T18:01:44.904599480Z [inf] 'ketu'
2025-12-05T18:01:44.904605976Z [inf] ]
2025-12-05T18:01:44.904613664Z [inf] DEBUG - Moon exists: true
2025-12-05T18:01:44.904620202Z [inf] DEBUG - Moon sign: Libra
2025-12-05T18:01:44.904626980Z [inf] [2025-12-05 18:01:41] [32minfo[39m: Found 3 yogas in the chart
2025-12-05T18:01:44.904633886Z [inf] [2025-12-05 18:01:41] [32minfo[39m: Calculated 4 doshas for the chart
2025-12-05T18:01:44.904718400Z [inf] [2025-12-05 18:01:41] [32minfo[39m: Calculated 3 Vedic planetary aspects
2025-12-05T18:01:44.904726429Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🎯 Calculating Vedic planetary aspects to houses (Drishti)...
2025-12-05T18:01:44.904731729Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🌟 Sun in house 10 aspects houses: 4
2025-12-05T18:01:44.904736749Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🌟 Moon in house 11 aspects houses: 5
2025-12-05T18:01:44.904741367Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🌟 Mercury in house 11 aspects houses: 5
2025-12-05T18:01:44.904747811Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🌟 Venus in house 11 aspects houses: 5
2025-12-05T18:01:44.904755291Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🌟 Mars in house 9 aspects houses: 12, 3, 4
2025-12-05T18:01:44.904760317Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🌟 Jupiter in house 6 aspects houses: 10, 12, 2
2025-12-05T18:01:44.904766752Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🌟 Saturn in house 6 aspects houses: 8, 12, 3
2025-12-05T18:01:44.904772838Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🌟 Rahu in house 7 aspects houses: 1
2025-12-05T18:01:44.904777792Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🌟 Ketu in house 1 aspects houses: 7
2025-12-05T18:01:44.906671765Z [inf] [2025-12-05 18:01:41] [32minfo[39m: ✅ Calculated house aspects for 9 planets
2025-12-05T18:01:44.906682119Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 🎯 Calculated 3 planetary aspects and 9 house aspect sets
2025-12-05T18:01:44.906688721Z [inf] [2025-12-05 18:01:41] [32minfo[39m: Calculating Dasha timeline for birth: 2000-09-30 12:00, Moon in Swati
2025-12-05T18:01:44.906696117Z [inf] DEBUG - Planetary positions keys: [
2025-12-05T18:01:44.906703005Z [inf] 'sun', 'moon',
2025-12-05T18:01:44.906710306Z [inf] 'mercury', 'venus',
2025-12-05T18:01:44.906717423Z [inf] 'mars', 'jupiter',
2025-12-05T18:01:44.906724230Z [inf] 'saturn', 'rahu',
2025-12-05T18:01:44.906730107Z [inf] 'ketu'
2025-12-05T18:01:44.906737652Z [inf] ]
2025-12-05T18:01:44.906743463Z [inf] DEBUG - Moon object: {
2025-12-05T18:01:44.906750685Z [inf] name: 'Moon',
2025-12-05T18:01:44.906762871Z [inf] longitude: 194.47173739166996,
2025-12-05T18:01:44.906768177Z [inf] latitude: 4.809536068989356,
2025-12-05T18:01:44.906773452Z [inf] speed: 13.209036806073927,
2025-12-05T18:01:44.906778809Z [inf] sign: 'Libra',
2025-12-05T18:01:44.906785104Z [inf] signNumber: 7,
2025-12-05T18:01:44.906790569Z [inf] degreeInSign: 14.471737391669961,
2025-12-05T18:01:44.906796047Z [inf] degreeFormatted: `14°28'18"`,
2025-12-05T18:01:44.906801008Z [inf] nakshatra: 'Swati',
2025-12-05T18:01:44.906806856Z [inf] nakshatraPada: 3,
2025-12-05T18:01:44.906812640Z [inf] isRetrograde: false,
2025-12-05T18:01:44.906817785Z [inf] rawPosition: 194.47173739166996,
2025-12-05T18:01:44.906826765Z [inf] signLord: 'Venus'
2025-12-05T18:01:44.906835467Z [inf] }
2025-12-05T18:01:44.906841758Z [inf] DEBUG - Sun object: {
2025-12-05T18:01:44.906847653Z [inf] name: 'Sun',
2025-12-05T18:01:44.906853029Z [inf] longitude: 163.53771909397392,
2025-12-05T18:01:44.908602524Z [inf] latitude: 0.0002009590281054545,
2025-12-05T18:01:44.908614228Z [inf] speed: 0.9831688798435931,
2025-12-05T18:01:44.908621952Z [inf] sign: 'Virgo',
2025-12-05T18:01:44.908628263Z [inf] signNumber: 6,
2025-12-05T18:01:44.908640883Z [inf] rawPosition: 163.53771909397392,
2025-12-05T18:01:44.908643420Z [inf] degreeInSign: 13.53771909397392,
2025-12-05T18:01:44.908652805Z [inf] signLord: 'Mercury'
2025-12-05T18:01:44.908653158Z [inf] degreeFormatted: `13°32'15"`,
2025-12-05T18:01:44.908661417Z [inf] nakshatra: 'Hasta',
2025-12-05T18:01:44.908661724Z [inf] }
2025-12-05T18:01:44.908670638Z [inf] [2025-12-05 18:01:41] [32minfo[39m: 100.64.0.2 - - [05/Dec/2025:18:01:41 +0000] "POST /api/kundli HTTP/1.1" 200 - "-" "curl/8.7.1"
2025-12-05T18:01:44.908671345Z [inf] nakshatraPada: 2,
2025-12-05T18:01:44.908678892Z [inf] isRetrograde: false,
