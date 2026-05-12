const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: "onedelhii"
});

const db = admin.firestore();

async function seedAllRoutes() {
    console.log("📍 Seeding all DTC routes to Firebase...\n");

    const routes = [
        {
            route: "400",
            directions: {
                up: {
                    from: "Minto Road Terminal",
                    to: "Okhla Extn",
                    totalStops: 6,
                    stops: ["Minto Road Terminal", "Connaught Place", "India Gate", "AIIMS", "Lajpat Nagar", "Okhla Extn"]
                }
            }
        },
        {
            route: "401",
            directions: {
                up: {
                    from: "Terminal A",
                    to: "Terminal B",
                    totalStops: 5,
                    stops: ["Terminal A", "Stop 1", "Stop 2", "Stop 3", "Terminal B"]
                }
            }
        },
        {
            route: "402",
            directions: {
                up: {
                    from: "Mori Gate Terminal",
                    to: "Okhla Extn",
                    totalStops: 5,
                    stops: ["Mori Gate Terminal", "ISBT", "Red Fort", "Delhi Gate", "Okhla Extn"]
                }
            }
        },
        {
            route: "522",
            directions: {
                up: {
                    from: "Lado Sarai",
                    to: "Krishi Bhawan",
                    totalStops: 5,
                    stops: ["Lado Sarai", "Saket", "IIT Gate", "AIIMS", "Krishi Bhawan"]
                }
            }
        },
        {
            route: "425",
            directions: {
                up: {
                    from: "Hamdard Nagar",
                    to: "New Delhi Railway Station",
                    totalStops: 4,
                    stops: ["Hamdard Nagar", "Chirag Delhi", "Lajpat Nagar", "New Delhi Railway Station"]
                }
            }
        },
        {
            route: "502",
            directions: {
                up: {
                    from: "Old Delhi Railway Station",
                    to: "Mehrauli",
                    totalStops: 12,
                    stops: ["Old Delhi Railway Station", "Kashmere Gate", "Red Fort", "Delhi Gate", "ITO", "Mandi House", "Khan Market", "AIIMS", "Hauz Khas", "Malviya Nagar", "Saket Metro Station", "Mehrauli"]
                }
            }
        },
        {
            route: "534",
            directions: {
                up: {
                    from: "Anand Vihar ISBT",
                    to: "Mehrauli",
                    totalStops: 10,
                    stops: ["Anand Vihar ISBT", "Hasan Pur Village", "Shakarpur X-ing", "Laxmi Nagar", "Noida Mode", "Nehru Place", "IIT Gate", "Panchsheel Park", "Saket Metro Station", "Mehrauli"]
                }
            }
        },
        {
            route: "711",
            directions: {
                up: {
                    from: "Uttam Nagar",
                    to: "Sarai Kale Khan",
                    totalStops: 10,
                    stops: ["Uttam Nagar", "Janakpuri East", "Tilak Nagar", "Rajouri Garden", "Dhaula Kuan", "Moti Bagh", "AIIMS", "South Extension", "Lajpat Nagar", "Sarai Kale Khan ISBT"]
                }
            }
        },
        {
            route: "440",
            directions: {
                up: {
                    from: "Anand Vihar",
                    to: "New Delhi Railway Station",
                    totalStops: 10,
                    stops: ["Anand Vihar", "Gazipur Depot", "Nizamuddin", "Lajpat Nagar", "Moolchand", "AIIMS", "Lodhi Colony", "India Gate", "Patiala House", "New Delhi Railway Station"]
                }
            }
        },
        {
            route: "717",
            directions: {
                up: {
                    from: "Badarpur Border(T)",
                    to: "IGI Airport Terminal 2 (Air India Office)",
                    totalStops: 46,
                    stops: [
                        "Badarpur Border(T)",
                        "Jaitpur Crossing",
                        "Badarpur M B Road / Rajiv Gandhi Sta...",
                        "Pul Prehladpur ( BadarPur)",
                        "Surajkund Crossing",
                        "Lal Kuan",
                        "Prem Nagar",
                        "Tuglaqabad MB Road / Okhla more",
                        "Kaya Maya Hospital",
                        "Tughalqabad Village",
                        "Air Force Station",
                        "Air Force Station",
                        "Hamdard Nagar / Sangam Vihar",
                        "Batra Hospital (Satya Narayan Mandir)",
                        "Vayusenabad (Tigri)",
                        "Khanpur Extension / Devli Road Xing / ...",
                        "Ambedkar Nagar Depot",
                        "DIPSAR ( Institute of Pharmacy)",
                        "Asian Market",
                        "Saket Crossing",
                        "Maidan Garhi Crossing (SDM Court)",
                        "Saket Metro Station / Said-ul-Ajaib",
                        "Said ul zeb",
                        "Dhaula Peer",
                        "Dhaula Peer / Lado Sarai",
                        "Ahinsa Sthal",
                        "Qutub Minar Metro Station",
                        "Andheria Bagh More",
                        "Andheria Bagh More",
                        "Vasant Kunj Sec A Pkt B/C / Vasant V...",
                        "Vasant Kunj Sec - A (ILBS)",
                        "KISHAN GARH & NPD / Vasant Ku...",
                        "Vasant Kunj SecD/34 / Vasant Kunj F...",
                        "VASANT KUNJ BUS STAND / Vasant K...",
                        "Masood Pur Village",
                        "Masood Pur Dairy / Santushti Apparte...",
                        "Kathuria Public School (Sai Darbar Ma...",
                        "ISIC Hospital",
                        "Vasant Kunj C8 (Vasant Kunj Road)",
                        "Rang Puri Pahari",
                        "Mahipal Pur Village / Sec E Pkt 2 Vasan...",
                        "Mahipal Pur (NH8)",
                        "AeroCity Metro Station",
                        "AMPC (Automated Mail Processing Ce...",
                        "Air Traffic Control Office",
                        "IGI Airport Terminal 2 (Air India Office)"
                    ]
                },
                down: {
                    from: "IGI Airport Terminal 2 (Air India Office)",
                    to: "Badarpur Border(T)",
                    totalStops: 46,
                    stops: [
                        "IGI Airport Terminal 2 (Air India Office)",
                        "Air Traffic Control Office",
                        "AMPC (Automated Mail Processing Ce...",
                        "AeroCity Metro Station",
                        "Mahipal Pur (NH8)",
                        "Mahipal Pur Village / Sec E Pkt 2 Vasan...",
                        "Rang Puri Pahari",
                        "Vasant Kunj C8 (Vasant Kunj Road)",
                        "ISIC Hospital",
                        "Kathuria Public School (Sai Darbar Ma...",
                        "Masood Pur Dairy / Santushti Apparte...",
                        "Masood Pur Village",
                        "VASANT KUNJ BUS STAND / Vasant K...",
                        "Vasant Kunj SecD/34 / Vasant Kunj F...",
                        "KISHAN GARH & NPD / Vasant Ku...",
                        "Vasant Kunj Sec - A (ILBS)",
                        "Vasant Kunj Sec A Pkt B/C / Vasant V...",
                        "Andheria Bagh More",
                        "Andheria Bagh More",
                        "Qutub Minar Metro Station",
                        "Ahinsa Sthal",
                        "Dhaula Peer / Lado Sarai",
                        "Dhaula Peer",
                        "Said ul zeb",
                        "Saket Metro Station / Said-ul-Ajaib",
                        "Maidan Garhi Crossing (SDM Court)",
                        "Saket Crossing",
                        "Asian Market",
                        "DIPSAR ( Institute of Pharmacy)",
                        "Ambedkar Nagar Depot",
                        "Khanpur Extension / Devli Road Xing / ...",
                        "Vayusenabad (Tigri)",
                        "Batra Hospital (Satya Narayan Mandir)",
                        "Hamdard Nagar / Sangam Vihar",
                        "Air Force Station",
                        "Air Force Station",
                        "Tughalqabad Village",
                        "Kaya Maya Hospital",
                        "Tuglaqabad MB Road / Okhla more",
                        "Prem Nagar",
                        "Lal Kuan",
                        "Surajkund Crossing",
                        "Pul Prehladpur ( BadarPur)",
                        "Badarpur M B Road / Rajiv Gandhi Sta...",
                        "Jaitpur Crossing",
                        "Badarpur Border(T)"
                    ]
                }
            }
        }
    ];
            name: "522 (Lado Sarai - Krishi Bhawan)",
            stopSequence: ["Lado Sarai", "Saket", "IIT Gate", "AIIMS", "Krishi Bhawan"],
            timestamp: Date.now()
        },
        {
            id: "425UP",
            routeNumber: "425",
            origin: "Hamdard Nagar",
            destination: "New Delhi Railway Station",
            direction: "UP",
            name: "425 (Hamdard Nagar - New Delhi Rly Station)",
            stopSequence: ["Hamdard Nagar", "Chirag Delhi", "Lajpat Nagar", "New Delhi Railway Station"],
            timestamp: Date.now()
        },
        {
            id: "502UP",
            routeNumber: "502",
            origin: "Old Delhi Railway Station",
            destination: "Mehrauli",
            direction: "UP",
            name: "502 (Old Delhi Rly Station - Mehrauli)",
            stopSequence: ["Old Delhi Railway Station", "Kashmere Gate", "Red Fort", "Delhi Gate", "ITO", "Mandi House", "Khan Market", "AIIMS", "Hauz Khas", "Malviya Nagar", "Saket Metro Station", "Mehrauli"],
            timestamp: Date.now()
        },
        {
            id: "534UP",
            routeNumber: "534",
            origin: "Anand Vihar ISBT",
            destination: "Mehrauli",
            direction: "UP",
            name: "534 (Anand Vihar ISBT - Mehrauli)",
            stopSequence: ["Anand Vihar ISBT", "Hasan Pur Village", "Shakarpur X-ing", "Laxmi Nagar", "Noida Mode", "Nehru Place", "IIT Gate", "Panchsheel Park", "Saket Metro Station", "Mehrauli"],
            timestamp: Date.now()
        },
        {
            id: "711UP",
            routeNumber: "711",
            origin: "Uttam Nagar",
            destination: "Sarai Kale Khan",
            direction: "UP",
            name: "711 (Uttam Nagar - Sarai Kale Khan)",
            stopSequence: ["Uttam Nagar", "Janakpuri East", "Tilak Nagar", "Rajouri Garden", "Dhaula Kuan", "Moti Bagh", "AIIMS", "South Extension", "Lajpat Nagar", "Sarai Kale Khan ISBT"],
            timestamp: Date.now()
        },
        {
            id: "440UP",
            routeNumber: "440",
            origin: "Anand Vihar",
            destination: "New Delhi Railway Station",
            direction: "UP",
            name: "440 (Anand Vihar - New Delhi Rly Station)",
            stopSequence: ["Anand Vihar", "Gazipur Depot", "Nizamuddin", "Lajpat Nagar", "Moolchand", "AIIMS", "Lodhi Colony", "India Gate", "Patiala House", "New Delhi Railway Station"],
            timestamp: Date.now()
        },
        {
            id: "D036UP",
            routeNumber: "D036",
            origin: "Nizamuddin Railway Station",
            destination: "Mandi Village (T)",
            direction: "UP",
            name: "D036 (Nizamuddin Railway Station to Mandi Village (T))",
            stopSequence: [
                "Nizamuddin Railway Station", "Rajdoot Hotel", "Ashram (Hari Nagar)", "Nehru Nagar",
                "Sri Niwaspuri / PG DAV College", "Lajpat Nagar Ring Road", "Gupta Market",
                "Central School (MCKR)", "Sadiq Nagar", "Siri Fort Road", "Krishi Vihar",
                "Panchsheel Enclave", "Chirag Delhi", "Sheikh Sarai Phase II", "Sheikh Sarai More",
                "Vocational College", "PSRI", "Khirki Village", "Hauz Rani", "Saket M Block",
                "Saket Terminal", "Saket J Block", "Maidan Garhi Crossing (SDM Court)",
                "Saket Metro Station", "Saidulzeb", "Dhaula Peer", "Lado Sarai",
                "Qutub Minar Metro Station", "Andheria Bagh More", "Chhatarpur Metro Station",
                "New Mangla Puri", "Center for Development of Telematics", "Sultan Pur",
                "Gadaipur", "Triveni", "Jonapur Village", "Sonia Farm", "Bhim Basti",
                "Shanti Colony", "Jawahar Bal Bhawan", "Mandi Village (T)"
            ],
            timestamp: Date.now()
        },
        {
            id: "D036DOWN",
            routeNumber: "D036",
            origin: "Mandi Village (T)",
            destination: "Nizamuddin Railway Station",
            direction: "DOWN",
            name: "D036 (Mandi Village (T) to Nizamuddin Railway Station)",
            stopSequence: [
                "Mandi Village (T)", "Jawahar Bal Bhawan", "Shanti Colony", "Bhim Basti",
                "Sonia Farm", "Jonapur Village", "Triveni", "Gadaipur", "Sultan Pur",
                "Center for Development of Telematics", "New Mangla Puri", "Chhatarpur Metro Station",
                "Andheria Bagh More", "Qutub Minar Metro Station", "Lado Sarai", "Dhaula Peer",
                "Saidulzeb", "Saket Metro Station", "Maidan Garhi Crossing (SDM Court)",
                "Saket J Block", "Saket Terminal", "Saket M Block", "Hauz Rani", "Khirki Village",
                "PSRI", "Vocational College", "Sheikh Sarai More", "Sheikh Sarai Phase II",
                "Chirag Delhi", "Panchsheel Enclave", "Krishi Vihar", "Siri Fort Road",
                "Sadiq Nagar", "Central School (MCKR)", "Gupta Market", "Lajpat Nagar Ring Road",
                "Sri Niwaspuri / PG DAV College", "Nehru Nagar", "Ashram (Hari Nagar)",
                "Rajdoot Hotel", "Nizamuddin Railway Station"
            ],
            timestamp: Date.now()
        },
        {
            id: "857UP",
            routeNumber: "857",
            origin: "Hasan Pur Village",
            destination: "Shakarpur",
            direction: "UP",
            name: "857 (Hasan Pur Village - Shakarpur)",
            stopSequence: ["Hasan Pur Village", "Gazipur Crossing", "Karkardooma", "Preet Vihar", "Shakarpur X-ing"],
            timestamp: Date.now()
        },
        {
            id: "717UP",
            routeNumber: "717",
            origin: "Badarpur Border(T)",
            destination: "IGI Airport Terminal 2",
            direction: "UP",
            name: "717 (Badarpur Border(T) to IGI Airport Terminal 2)",
            stopSequence: [
                "Badarpur Border(T)", "Jaitpur Crossing", "Badarpur M B Road", "Pul Prehladpur",
                "Surajkund Crossing", "Lal Kuan", "Prem Nagar", "Tuglaqabad MB Road",
                "Kaya Maya Hospital", "Tughalqabad Village", "Air Force Station", "Hamdard Nagar",
                "Batra Hospital", "Vayusenabad (Tigri)", "Khanpur Extension", "Ambedkar Nagar Depot",
                "DIPSAR", "Asian Market", "Saket Crossing", "Maidan Garhi Crossing",
                "Saket Metro Station", "Saidulzeb", "Dhaula Peer", "Dhaula Peer / Lado Sarai",
                "Ahinsa Sthal", "Qutub Minar Metro Station", "Andheria Bagh More",
                "Vasant Kunj Sec A", "VASANT KUNJ BUS STAND", "Masood Pur Village",
                "Kathuria Public School", "ISIC Hospital", "Vasant Kunj C8", "Rang Puri Pahari",
                "Mahipal Pur Village", "Mahipal Pur (NH8)", "AeroCity Metro Station",
                "AMPC", "Air Traffic Control Office", "IGI Airport Terminal 2"
            ],
            timestamp: Date.now()
        },
        {
            id: "717DOWN",
            routeNumber: "717",
            origin: "IGI Airport Terminal 2",
            destination: "Badarpur Border(T)",
            direction: "DOWN",
            name: "717 (IGI Airport Terminal 2 to Badarpur Border(T))",
            stopSequence: [
                "IGI Airport Terminal 2", "Air Traffic Control Office", "AMPC", "AeroCity Metro Station",
                "Mahipal Pur (NH8)", "Mahipal Pur Village", "Rang Puri Pahari", "Vasant Kunj C8",
                "ISIC Hospital", "Kathuria Public School", "Masood Pur Village", "VASANT KUNJ BUS STAND",
                "Vasant Kunj Sec A", "Andheria Bagh More", "Qutub Minar Metro Station", "Ahinsa Sthal",
                "Dhaula Peer / Lado Sarai", "Dhaula Peer", "Saidulzeb", "Saket Metro Station",
                "Maidan Garhi Crossing", "Saket Crossing", "Asian Market", "DIPSAR", "Ambedkar Nagar Depot",
                "Khanpur Extension", "Vayusenabad (Tigri)", "Batra Hospital", "Hamdard Nagar",
                "Air Force Station", "Tughalqabad Village", "Kaya Maya Hospital", "Tuglaqabad MB Road",
                "Prem Nagar", "Lal Kuan", "Surajkund Crossing", "Pul Prehladpur", "Badarpur M B Road",
                "Jaitpur Crossing", "Badarpur Border(T)"
            ],
            timestamp: Date.now()
        },
        {
            id: "525STLUP",
            routeNumber: "525STL",
            origin: "Badarpur Border (T)",
            destination: "Mehrauli Terminal",
            direction: "UP",
            name: "525STL (Badarpur Border (T) - Mehrauli Terminal)",
            stopSequence: [
                "Badarpur Border (T)", "Badarpur M B Road", "Prehlad Pur (Badarpur)",
                "Surajkund Crossing", "Lal Kuan", "Prem Nagar", "MB Road / Okhla More",
                "Kaya Maya Hospital", "Tughlaqabad Village", "Tuglkabad Fort", "Air Force Station",
                "Hamdard Nagar", "Batra Hospital", "VayuSenaBad (Tigri)", "Khanpur Extension",
                "Ambedkar Nagar Depot", "Ambedkar Nagar Terminal", "DIPSAR College",
                "Asian Market", "Saket Crossing", "Maidan Garhi Crossing",
                "Said-ul-Ajaib", "Dhaula Peer Lado Sarai", "Lado Sarai", "Lado Sarai Crossing", "Mehrauli Terminal"
            ],
            timestamp: Date.now()
        },
        {
            id: "525STLDOWN",
            routeNumber: "525STL",
            origin: "Mehrauli Terminal",
            destination: "Badarpur Border (T)",
            direction: "DOWN",
            name: "525STL (Mehrauli Terminal - Badarpur Border (T))",
            stopSequence: [
                "Mehrauli Terminal", "Lado Sarai Crossing", "Lado Sarai", "Dhaula Peer Lado Sarai",
                "Said-ul-Ajaib", "Maidan Garhi Crossing", "Saket Crossing", "Asian Market",
                "DIPSAR College", "Ambedkar Nagar Terminal", "Ambedkar Nagar Depot",
                "Khanpur Extension", "VayuSenaBad (Tigri)", "Batra Hospital", "Hamdard Nagar",
                "Air Force Station", "Tuglkabad Fort", "Tughlaqabad Village", "Kaya Maya Hospital",
                "MB Road / Okhla More", "Prem Nagar", "Lal Kuan", "Surajkund Crossing",
                "Prehlad Pur (Badarpur)", "Badarpur M B Road", "Badarpur Border (T)"
            ],
            timestamp: Date.now()
        }
    ];

    try {
        let count = 0;
        for (const route of routes) {
            // Use route number as document ID
            const docId = route.route;
            
            await db.collection('routes').doc(docId).set(route);
            console.log(`✓ Route ${route.route} seeded`);
            count++;
        }
        console.log(`\n✅ Successfully seeded ${count} routes to Firebase!`);
        process.exit(0);
    } catch (err) {
        console.error("❌ Error seeding routes:", err.message);
        process.exit(1);
    }
}

seedAllRoutes();
