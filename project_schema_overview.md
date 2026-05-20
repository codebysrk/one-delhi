# One Delhi (railone-mobile) - डेटाबेस स्कीमा और सुरक्षा नीतियां

यह दस्तावेज़ **One Delhi** मोबाइल एप्लिकेशन के Firestore डेटाबेस स्कीमा और `firestore.rules` सुरक्षा नीतियों का एक विस्तृत विवरण प्रदान करता है।

---

## 1. Firestore कलेक्शन्स और स्कीमा संरचना (Database Schema)

डेटाबेस स्कीमा को `src/types/database.ts` में परिभाषित किया गया है। नीचे सभी संग्रहों (Collections) और उनके फ़ील्ड्स का विवरण दिया गया है:

### 1.1 `users` (User Profile)
यह संग्रह उपयोगकर्ताओं की प्रोफाइल जानकारी संग्रहीत करता है।

* **Firestore पथ:** `/users/{userId}`
* **TypeScript इंटरफ़ेस:** `User`

| फ़ील्ड का नाम | डेटा प्रकार | विवरण |
| :--- | :--- | :--- |
| `uid` | `string` | उपयोगकर्ता की यूनिक ऑथेंटिकेशन आईडी |
| `name` | `string` | उपयोगकर्ता का नाम |
| `email` | `string` | ईमेल पता |
| `phone` | `string` | मोबाइल नंबर |
| `role` | `'admin' \| 'user'` | उपयोगकर्ता की भूमिका (Role) |
| `status` | `'ACTIVE' \| 'BANNED'` | खाता स्थिति (सक्रिय या प्रतिबंधित) |
| `createdAt` | `number` | खाता निर्माण का समय (Epoch Milliseconds) |

---

### 1.2 `devices` (User Devices)
यह संग्रह उन उपकरणों को ट्रैक करता है जिनसे उपयोगकर्ताओं ने लॉग इन किया है।

* **Firestore पथ:** `/devices/{deviceId}`
* **TypeScript इंटरफ़ेस:** `Device`

| फ़ील्ड का नाम | डेटा प्रकार | विवरण |
| :--- | :--- | :--- |
| `deviceId` | `string` | उपकरण की यूनिक आईडी |
| `userId` | `string` | संबद्ध उपयोगकर्ता की `uid` |
| `userName` | `string` | उपयोगकर्ता का नाम |
| `userEmail` | `string` | उपयोगकर्ता का ईमेल |
| `deviceName` | `string` | डिवाइस का नाम |
| `brand` | `string` | डिवाइस का ब्रांड (जैसे: Samsung, Xiaomi) |
| `model` | `string` | डिवाइस का मॉडल नंबर |
| `platform` | `'android'` | ऑपरेटिंग सिस्टम प्लेटफॉर्म |
| `osVersion` | `string` | एंड्रॉइड ओएस संस्करण (OS Version) |
| `appVersion` | `string` | मोबाइल ऐप का वर्तमान वर्जन (जैसे: `2.0.1`) |
| `ipAddress` | `string` | डिवाइस का आईपी पता |
| `firstRegistered` | `number` | पहली बार रजिस्ट्रेशन का समय (Epoch MS) |
| `lastActive` | `number` | अंतिम बार सक्रिय होने का समय (Epoch MS) |
| `status` | `'APPROVED' \| 'BANNED'` | डिवाइस की स्थिति |
| `isCurrentDevice` | `boolean` | क्या यह वर्तमान में सक्रिय उपकरण है? |
| `forceLogout` | `boolean` | क्या इस डिवाइस से जबरन लॉगआउट (Force Logout) करना है? |

---

### 1.3 `tickets` (Bus Tickets Purchased)
यह संग्रह उपयोगकर्ताओं द्वारा खरीदे गए बस टिकटों की जानकारी रखता है।

* **Firestore पथ:** `/tickets/{ticketId}`
* **TypeScript इंटरफ़ेस:** `Ticket`

| फ़ील्ड का नाम | डेटा प्रकार | विवरण |
| :--- | :--- | :--- |
| `tid` | `string` | टिकट की यूनिक ट्रांजेक्शन आईडी |
| `userId` | `string` | टिकट खरीदने वाले उपयोगकर्ता की `uid` |
| `route` | `string` | बस का रूट नंबर (जैसे: `425`, `522`) |
| `source` | `string` | बोर्डिंग बस स्टैंड (Source Stop) |
| `dest` | `string` | गंतव्य बस स्टैंड (Destination Stop) |
| `busType` | `'AC' \| 'Non-AC'` | बस का प्रकार |
| `fare` | `number` | टिकट का किराया (मूल्य) |
| `baseFare` | `number` | आधार किराया |
| `finalFare` | `string` | अंतिम किराया (डिस्काउंट के बाद) |
| `total` | `string` | कुल भुगतान राशि |
| `qty` | `number` | टिकटों की संख्या |
| `status` | `'Active' \| 'Expired'` | टिकट की वैधता स्थिति |
| `date` | `string` | टिकट बुकिंग की तारीख (जैसे: DD/MM/YYYY) |
| `time` | `string` | टिकट बुकिंग का समय (जैसे: HH:MM:SS) |
| `timestamp` | `number` | बुकिंग का टाइमस्टैम्प (Epoch MS) |
| `fareSource` | `string` | किराया निर्धारण का स्रोत |
| `slab` | `Object` | किराया स्लैब जानकारी: |
| `slab.acFare` | `number` | एसी किराया दर |
| `slab.nonACFare`| `number` | नॉन-एसी किराया दर |
| `slab.maxStops` | `number` | स्लैब में अधिकतम स्टॉप्स |
| `slab.minStops` | `number` | स्लैब में न्यूनतम स्टॉप्स |

---

### 1.4 `notifications` (System Broadcasts)
यह संग्रह एडमिन द्वारा भेजे गए अलर्ट और सूचनाओं को संग्रहीत करता है।

* **Firestore पथ:** `/notifications/{notificationId}`
* **TypeScript इंटरफ़ेस:** `Notification`

| फ़ील्ड का नाम | डेटा प्रकार | विवरण |
| :--- | :--- | :--- |
| `title` | `string` | सूचना का शीर्षक |
| `message` | `string` | सूचना का मुख्य संदेश |
| `status` | `'SENT' \| 'PENDING'` | सूचना की डिलीवरी स्थिति |
| `targetRoute` | `string` | लक्षित मार्ग (जैसे `'ALL'` या कोई विशिष्ट रूट नंबर) |
| `readBy` | `Record<string, boolean>` | जिन यूज़र्स ने नोटिफिकेशन पढ़ा है, उनकी UID का मैप |
| `timestamp` | `number` | नोटिफिकेशन भेजने का समय (Epoch MS) |

---

### 1.5 `routes` (Bus Routes)
यह संग्रह दिल्ली परिवहन विभाग के सभी बस मार्गों और उनके बस स्टॉप्स के अनुक्रम को संग्रहीत करता है।

* **Firestore पथ:** `/routes/{routeId}`
* **TypeScript इंटरफ़ेस:** `Route`

| फ़ील्ड का नाम | डेटा प्रकार | विवरण |
| :--- | :--- | :--- |
| `route` | `string` | रूट नंबर (जैसे: `D-7103`, `463`) |
| `directions` | `Object` | दोनों दिशाओं के लिए मार्ग विवरण: |
| `directions.up` | `Object` | **जाने का मार्ग (Upward Journey)** |
| `- from` | `string` | प्रस्थान स्थान |
| `- to` | `string` | अंतिम गंतव्य स्थान |
| `- totalStops`| `number` | कुल बस स्टॉप्स की संख्या |
| `- stops` | `string[]` | क्रमबद्ध बस स्टॉप आईडी/नामों की सूची (Array) |
| `directions.down`| `Object` | **वापसी का मार्ग (Downward Journey)** |
| `- from` | `string` | प्रस्थान स्थान (वापसी में) |
| `- to` | `string` | अंतिम गंतव्य स्थान (वापसी में) |
| `- totalStops`| `number` | कुल बस स्टॉप्स की संख्या |
| `- stops` | `string[]` | क्रमबद्ध बस स्टॉप आईडी/नामों की सूची |

---

### 1.6 `stops` (Bus Stops Master Data)
यह संग्रह दिल्ली के सभी बस स्टॉप्स का मास्टर डेटाबेस है।

* **Firestore पथ:** `/stops/{stopId}`
* **TypeScript इंटरफ़ेस:** `Stop`

| फ़ील्ड का नाम | डेटा प्रकार | विवरण |
| :--- | :--- | :--- |
| `id` | `string` | बस स्टॉप की यूनिक आईडी |
| `name` | `string` | बस स्टॉप का नाम (हिंदी/अंग्रेजी) |
| `type` | `'bus_stop'` | स्टॉप का प्रकार (हमेशा `'bus_stop'`) |
| `updatedAt` | `number` | अंतिम अपडेट समय (Epoch MS) |

---

### 1.7 `logs` (Security & Audit Logs)
यह संग्रह सुरक्षा ऑडिट और उपयोगकर्ता गतिविधियों (जैसे बुकिंग, लॉगिन, प्रतिबंध) को लॉग करता है।

* **Firestore पथ:** `/logs/{logId}`
* **TypeScript इंटरफ़ेस:** `Log`

| फ़ील्ड का नाम | डेटा प्रकार | विवरण |
| :--- | :--- | :--- |
| `userId` | `string` | क्रिया करने वाले उपयोगकर्ता की `uid` |
| `userName` | `string` | उपयोगकर्ता का नाम |
| `userEmail` | `string` | उपयोगकर्ता का ईमेल |
| `action` | `string` | गतिविधि का नाम (जैसे: `'TICKET_BOOKED'`, `'LOGIN'`) |
| `details` | `string` | गतिविधि का विस्तृत विवरण |
| `type` | `'SYSTEM' \| 'USER'` | लॉग का प्रकार (सिस्टम या उपयोगकर्ता-जनित) |
| `deviceId` | `string` | प्रयुक्त उपकरण की यूनिक आईडी |
| `deviceName` | `string` | प्रयुक्त उपकरण का नाम |
| `ipAddress` | `string` | उपयोगकर्ता का आईपी पता |
| `timestamp` | `number` | लॉग जनरेट होने का समय (Epoch MS) |

---

### 1.8 `metadata` (System Configuration)
सिस्टम-स्तरीय सेटिंग्स और संग्रह मेटाडेटा।

* **Firestore पथ:** `/metadata/{documentId}`
* **TypeScript इंटरफ़ेस:** `Metadata`

| फ़ील्ड का नाम | डेटा प्रकार | विवरण |
| :--- | :--- | :--- |
| `system` | `Object` | सिस्टम विवरण |
| `system.activeCollections`| `string[]` | सक्रिय डेटाबेस संग्रहों की सूची |
| `system.lastInitialized` | `number` | अंतिम इनिशियलाइज़ेशन समय (Epoch MS) |

---

## 2. Firestore सुरक्षा नियम (Security Policies)

`firestore.rules` फ़ाइल के अनुसार सुरक्षा नियम और अनुमतियाँ निम्न प्रकार से कॉन्फ़िगर की गई हैं:

### 2.1 सहायक फ़ंक्शन्स (Helper Functions)
* `isAuthenticated()`: जाँचता है कि क्या अनुरोध करने वाला उपयोगकर्ता लॉग इन है (`request.auth != null`).
* `isAdmin()`: जाँचता है कि उपयोगकर्ता लॉग इन है और उसका रोल `/users/{uid}` दस्तावेज़ में `"admin"` है।
* `isNotBanned()`: जाँचता है कि उपयोगकर्ता प्रतिबंधित (Banned) नहीं है (स्थिति `"BANNED"` नहीं होनी चाहिए)।

### 2.2 अनुमतियाँ तालिका (Access Control Matrix)

| संग्रह (Collection) | पढ़ना (Read) | बनाना (Create) | अपडेट करना (Update) | हटाना (Delete) |
| :--- | :--- | :--- | :--- | :--- |
| **`users`** | एडमिन पढ़ सकते हैं; यूज़र केवल अपना देख सकता है। | एडमिन बना सकते हैं; यूज़र साइनअप पर अपना बना सकता है। | एडमिन रोल/स्टेटस बदल सकते हैं; यूज़र अपनी जानकारी अपडेट कर सकता है। | कोई नहीं (सख्त मनाही: `false`) |
| **`devices`** | एडमिन; या उपयोगकर्ता केवल अपने स्वयं के डिवाइस देख सकते हैं। | एडमिन; या केवल ऑथेंटिकेटेड उपयोगकर्ता अपने स्वयं के डिवाइस बना सकते हैं। | एडमिन; या केवल उपयोगकर्ता अपने स्वयं के डिवाइस अपडेट कर सकते हैं। | कोई नहीं |
| **`tickets`** | एडमिन; या उपयोगकर्ता केवल अपने टिकट देख सकते हैं। | एडमिन; या केवल उपयोगकर्ता अपने स्वयं के टिकट खरीद/बना सकते हैं। | कोई नहीं | कोई नहीं |
| **`notifications`**| सभी लॉग-इन उपयोगकर्ता पढ़ सकते हैं। | केवल एडमिन | केवल एडमिन | केवल एडमिन |
| **`routes`** | सभी लॉग-इन उपयोगकर्ता पढ़ सकते हैं। | केवल एडमिन | केवल एडमिन | केवल एडमिन |
| **`stops`** | सभी लॉग-इन उपयोगकर्ता पढ़ सकते हैं। | केवल एडमिन | केवल एडमिन | केवल एडमिन |
| **`logs`** | केवल एडमिन पढ़ सकते हैं। | सभी लॉग-इन और गैर-प्रतिबंधित उपयोगकर्ता बना सकते हैं। | केवल एडमिन | केवल एडमिन |
| **`metadata`** | सभी लॉग-इन उपयोगकर्ता पढ़ सकते हैं। | केवल एडमिन | केवल एडमिन | केवल एडमिन |
