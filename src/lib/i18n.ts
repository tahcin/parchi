// UI strings for the farmer app. Kept short on purpose: most meaning is carried by
// pictures, colours and speech, so every string here is also read aloud.

export type LangCode =
  | "hi" | "mr" | "te" | "kn" | "ta" | "gu" | "pa" | "bn" | "or" | "ml" | "en";

export type CropId = "paddy" | "cotton" | "chilli" | "tomato" | "brinjal" | "other";

export interface Strings {
  chooseLanguage: string;
  whichCrop: string;
  takePhoto: string;
  gallery: string;
  sayProblem: string;
  stop: string;
  checking: string;
  listen: string;
  showDealer: string;
  callKcc: string;
  share: string;
  more: string;
  again: string;
  ok: string;
  careful: string;
  danger: string;
  example: string;
  back: string;
  errRead: string;
  errBusy: string; // the service is busy or out of quota, as opposed to an unreadable photo
  pickAfter: string;
  moreCrops: string;
  pumpQuestion: string;
  tanks: string;
  sprayTime: string;
  readAloud: string; // label for the header switch that turns automatic speaking on or off
  pastChecks: string; // heading of the saved-checks strip on the crop screen
  deleteCheck: string; // question shown before deleting one saved check
  stepRead: string; // checking screen, step 1
  stepAnswer: string; // checking screen, step 3 (step 2 reuses `checking`)
  crops: Record<CropId, string>;
}

export interface Language {
  code: LangCode;
  name: string; // in its own script
  english: string;
  speech: string; // BCP-47 tag for speech synthesis
  s: Strings;
}

export const LANGUAGES: Language[] = [
  {
    code: "hi", name: "हिन्दी", english: "Hindi", speech: "hi-IN",
    s: {
      chooseLanguage: "अपनी भाषा चुनें", whichCrop: "कौन सी फसल?", takePhoto: "पर्ची की फोटो लें",
      gallery: "गैलरी से चुनें", sayProblem: "समस्या बोलें", stop: "रोकें",
      checking: "सरकारी रिकॉर्ड से जाँच हो रही है", listen: "फिर से सुनें",
      showDealer: "दुकानदार को दिखाएँ", callKcc: "किसान हेल्पलाइन पर कॉल करें",
      share: "व्हाट्सऐप पर भेजें", more: "और जानकारी", again: "दूसरी पर्ची जाँचें",
      ok: "ठीक लगता है", careful: "सावधान रहें", danger: "यह दवा न छिड़कें",
      example: "उदाहरण देखें", back: "वापस", errRead: "फोटो पढ़ी नहीं जा सकी। साफ़ फोटो लें।", errBusy: "अभी बहुत लोग जाँच कर रहे हैं। एक मिनट बाद फिर से कोशिश करें।",
      pumpQuestion: "एक एकड़ में कितनी टंकी छिड़कते हैं?", tanks: "टंकी",
      moreCrops: "और फसलें", pickAfter: "तुड़ाई इसके बाद", sprayTime: "छिड़काव का सही समय", readAloud: "बोलकर सुनाएँ",
      pastChecks: "पिछली जाँचें", deleteCheck: "यह जाँच हटाएँ?",
      stepRead: "पर्ची पढ़ी जा रही है", stepAnswer: "आपका जवाब तैयार हो रहा है",
      crops: { paddy: "धान", cotton: "कपास", chilli: "मिर्च", tomato: "टमाटर", brinjal: "बैंगन", other: "अन्य" },
    },
  },
  {
    code: "mr", name: "मराठी", english: "Marathi", speech: "mr-IN",
    s: {
      chooseLanguage: "तुमची भाषा निवडा", whichCrop: "कोणते पीक?", takePhoto: "चिठ्ठीचा फोटो काढा",
      gallery: "गॅलरीतून निवडा", sayProblem: "समस्या सांगा", stop: "थांबवा",
      checking: "सरकारी नोंदींशी तपासणी सुरू आहे", listen: "पुन्हा ऐका",
      showDealer: "दुकानदाराला दाखवा", callKcc: "किसान हेल्पलाइनला कॉल करा",
      share: "व्हॉट्सॲपवर पाठवा", more: "अधिक माहिती", again: "दुसरी चिठ्ठी तपासा",
      ok: "ठीक वाटते", careful: "काळजी घ्या", danger: "हे औषध फवारू नका",
      example: "उदाहरण पहा", back: "मागे", errRead: "फोटो वाचता आला नाही. स्पष्ट फोटो काढा.", errBusy: "आत्ता खूप लोक तपासणी करत आहेत. एका मिनिटाने पुन्हा प्रयत्न करा.",
      pumpQuestion: "एका एकरात किती टाक्या फवारता?", tanks: "टाक्या",
      moreCrops: "आणखी पिके", pickAfter: "यानंतर तोडणी करा", sprayTime: "फवारणीची योग्य वेळ", readAloud: "मोठ्याने वाचा",
      pastChecks: "मागील तपासण्या", deleteCheck: "ही तपासणी काढून टाकायची?",
      stepRead: "चिठ्ठी वाचली जात आहे", stepAnswer: "तुमचे उत्तर तयार होत आहे",
      crops: { paddy: "भात", cotton: "कापूस", chilli: "मिरची", tomato: "टोमॅटो", brinjal: "वांगी", other: "इतर" },
    },
  },
  {
    code: "te", name: "తెలుగు", english: "Telugu", speech: "te-IN",
    s: {
      chooseLanguage: "మీ భాషను ఎంచుకోండి", whichCrop: "ఏ పంట?", takePhoto: "చీటీ ఫోటో తీయండి",
      gallery: "గ్యాలరీ నుండి ఎంచుకోండి", sayProblem: "సమస్య చెప్పండి", stop: "ఆపండి",
      checking: "ప్రభుత్వ రికార్డులతో తనిఖీ చేస్తోంది", listen: "మళ్ళీ వినండి",
      showDealer: "దుకాణదారుకు చూపించండి", callKcc: "కిసాన్ హెల్ప్‌లైన్‌కు కాల్ చేయండి",
      share: "వాట్సాప్‌లో పంపండి", more: "మరిన్ని వివరాలు", again: "మరో చీటీ తనిఖీ చేయండి",
      ok: "సరిగ్గా ఉంది", careful: "జాగ్రత్తగా ఉండండి", danger: "ఈ మందు పిచికారీ చేయవద్దు",
      example: "ఉదాహరణ చూడండి", back: "వెనుకకు", errRead: "ఫోటో చదవలేకపోయాం. స్పష్టమైన ఫోటో తీయండి.", errBusy: "ఇప్పుడు చాలా మంది తనిఖీ చేస్తున్నారు. ఒక నిమిషం తర్వాత మళ్ళీ ప్రయత్నించండి.",
      pumpQuestion: "ఒక ఎకరానికి ఎన్ని ట్యాంకులు పిచికారీ చేస్తారు?", tanks: "ట్యాంకులు",
      moreCrops: "మరిన్ని పంటలు", pickAfter: "దీని తర్వాత కోయండి", sprayTime: "పిచికారీకి సరైన సమయం", readAloud: "గట్టిగా చదవండి",
      pastChecks: "గత తనిఖీలు", deleteCheck: "ఈ తనిఖీని తొలగించాలా?",
      stepRead: "చీటీ చదువుతోంది", stepAnswer: "మీ సమాధానం సిద్ధమవుతోంది",
      crops: { paddy: "వరి", cotton: "పత్తి", chilli: "మిరప", tomato: "టమాటా", brinjal: "వంకాయ", other: "ఇతర" },
    },
  },
  {
    code: "kn", name: "ಕನ್ನಡ", english: "Kannada", speech: "kn-IN",
    s: {
      chooseLanguage: "ನಿಮ್ಮ ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ", whichCrop: "ಯಾವ ಬೆಳೆ?", takePhoto: "ಚೀಟಿಯ ಫೋಟೋ ತೆಗೆಯಿರಿ",
      gallery: "ಗ್ಯಾಲರಿಯಿಂದ ಆಯ್ಕೆಮಾಡಿ", sayProblem: "ಸಮಸ್ಯೆ ಹೇಳಿ", stop: "ನಿಲ್ಲಿಸಿ",
      checking: "ಸರ್ಕಾರಿ ದಾಖಲೆಗಳೊಂದಿಗೆ ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ", listen: "ಮತ್ತೆ ಕೇಳಿ",
      showDealer: "ಅಂಗಡಿಯವರಿಗೆ ತೋರಿಸಿ", callKcc: "ಕಿಸಾನ್ ಸಹಾಯವಾಣಿಗೆ ಕರೆ ಮಾಡಿ",
      share: "ವಾಟ್ಸಾಪ್‌ನಲ್ಲಿ ಕಳುಹಿಸಿ", more: "ಹೆಚ್ಚಿನ ವಿವರಗಳು", again: "ಇನ್ನೊಂದು ಚೀಟಿ ಪರಿಶೀಲಿಸಿ",
      ok: "ಸರಿಯಾಗಿದೆ", careful: "ಎಚ್ಚರಿಕೆಯಿಂದಿರಿ", danger: "ಈ ಔಷಧಿ ಸಿಂಪಡಿಸಬೇಡಿ",
      example: "ಉದಾಹರಣೆ ನೋಡಿ", back: "ಹಿಂದೆ", errRead: "ಫೋಟೋ ಓದಲಾಗಲಿಲ್ಲ. ಸ್ಪಷ್ಟ ಫೋಟೋ ತೆಗೆಯಿರಿ.", errBusy: "ಈಗ ತುಂಬಾ ಜನ ಪರಿಶೀಲಿಸುತ್ತಿದ್ದಾರೆ. ಒಂದು ನಿಮಿಷದ ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
      pumpQuestion: "ಒಂದು ಎಕರೆಗೆ ಎಷ್ಟು ಟ್ಯಾಂಕ್ ಸಿಂಪಡಿಸುತ್ತೀರಿ?", tanks: "ಟ್ಯಾಂಕ್",
      moreCrops: "ಇನ್ನಷ್ಟು ಬೆಳೆಗಳು", pickAfter: "ಇದರ ನಂತರ ಕೊಯ್ಲು ಮಾಡಿ", sprayTime: "ಸಿಂಪಡಣೆಗೆ ಸರಿಯಾದ ಸಮಯ", readAloud: "ಗಟ್ಟಿಯಾಗಿ ಓದಿ",
      pastChecks: "ಹಿಂದಿನ ಪರಿಶೀಲನೆಗಳು", deleteCheck: "ಈ ಪರಿಶೀಲನೆಯನ್ನು ಅಳಿಸಬೇಕೆ?",
      stepRead: "ಚೀಟಿ ಓದಲಾಗುತ್ತಿದೆ", stepAnswer: "ನಿಮ್ಮ ಉತ್ತರ ಸಿದ್ಧವಾಗುತ್ತಿದೆ",
      crops: { paddy: "ಭತ್ತ", cotton: "ಹತ್ತಿ", chilli: "ಮೆಣಸಿನಕಾಯಿ", tomato: "ಟೊಮೆಟೊ", brinjal: "ಬದನೆ", other: "ಇತರೆ" },
    },
  },
  {
    code: "ta", name: "தமிழ்", english: "Tamil", speech: "ta-IN",
    s: {
      chooseLanguage: "உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்", whichCrop: "எந்த பயிர்?", takePhoto: "சீட்டின் புகைப்படம் எடுக்கவும்",
      gallery: "கேலரியிலிருந்து தேர்வு செய்யவும்", sayProblem: "பிரச்சனையைச் சொல்லுங்கள்", stop: "நிறுத்து",
      checking: "அரசு பதிவுகளுடன் சரிபார்க்கிறது", listen: "மீண்டும் கேளுங்கள்",
      showDealer: "கடைக்காரரிடம் காட்டுங்கள்", callKcc: "கிசான் உதவி எண்ணை அழைக்கவும்",
      share: "வாட்ஸ்அப்பில் அனுப்பவும்", more: "மேலும் விவரங்கள்", again: "வேறு சீட்டைச் சரிபார்க்கவும்",
      ok: "சரியாக உள்ளது", careful: "கவனமாக இருங்கள்", danger: "இந்த மருந்தைத் தெளிக்க வேண்டாம்",
      example: "உதாரணம் பார்க்கவும்", back: "பின்செல்", errRead: "புகைப்படத்தைப் படிக்க முடியவில்லை. தெளிவான புகைப்படம் எடுக்கவும்.", errBusy: "இப்போது நிறைய பேர் சரிபார்க்கிறார்கள். ஒரு நிமிடம் கழித்து மீண்டும் முயற்சிக்கவும்.",
      pumpQuestion: "ஒரு ஏக்கருக்கு எத்தனை டேங்க் தெளிப்பீர்கள்?", tanks: "டேங்க்",
      moreCrops: "மேலும் பயிர்கள்", pickAfter: "இதற்குப் பிறகு அறுவடை", sprayTime: "தெளிக்க சரியான நேரம்", readAloud: "சத்தமாகப் படிக்கவும்",
      pastChecks: "முந்தைய சோதனைகள்", deleteCheck: "இந்தச் சோதனையை நீக்கவா?",
      stepRead: "சீட்டைப் படிக்கிறது", stepAnswer: "உங்கள் பதில் தயாராகிறது",
      crops: { paddy: "நெல்", cotton: "பருத்தி", chilli: "மிளகாய்", tomato: "தக்காளி", brinjal: "கத்தரி", other: "மற்றவை" },
    },
  },
  {
    code: "gu", name: "ગુજરાતી", english: "Gujarati", speech: "gu-IN",
    s: {
      chooseLanguage: "તમારી ભાષા પસંદ કરો", whichCrop: "કયો પાક?", takePhoto: "ચિઠ્ઠીનો ફોટો લો",
      gallery: "ગેલેરીમાંથી પસંદ કરો", sayProblem: "સમસ્યા કહો", stop: "રોકો",
      checking: "સરકારી રેકોર્ડ સાથે તપાસ ચાલુ છે", listen: "ફરી સાંભળો",
      showDealer: "દુકાનદારને બતાવો", callKcc: "કિસાન હેલ્પલાઇન પર કૉલ કરો",
      share: "વોટ્સએપ પર મોકલો", more: "વધુ માહિતી", again: "બીજી ચિઠ્ઠી તપાસો",
      ok: "બરાબર લાગે છે", careful: "સાવધાન રહો", danger: "આ દવા છાંટશો નહીં",
      example: "ઉદાહરણ જુઓ", back: "પાછા", errRead: "ફોટો વાંચી શકાયો નહીં. સ્પષ્ટ ફોટો લો.", errBusy: "અત્યારે ઘણા લોકો તપાસ કરી રહ્યા છે. એક મિનિટ પછી ફરી પ્રયત્ન કરો.",
      pumpQuestion: "એક એકરમાં કેટલી ટાંકી છાંટો છો?", tanks: "ટાંકી",
      moreCrops: "વધુ પાક", pickAfter: "આ પછી તોડણી કરો", sprayTime: "છંટકાવનો સાચો સમય", readAloud: "મોટેથી વાંચો",
      pastChecks: "અગાઉની તપાસ", deleteCheck: "આ તપાસ કાઢી નાખવી છે?",
      stepRead: "ચિઠ્ઠી વાંચી રહ્યા છીએ", stepAnswer: "તમારો જવાબ તૈયાર થઈ રહ્યો છે",
      crops: { paddy: "ડાંગર", cotton: "કપાસ", chilli: "મરચું", tomato: "ટામેટા", brinjal: "રીંગણ", other: "અન્ય" },
    },
  },
  {
    code: "pa", name: "ਪੰਜਾਬੀ", english: "Punjabi", speech: "pa-IN",
    s: {
      chooseLanguage: "ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ", whichCrop: "ਕਿਹੜੀ ਫ਼ਸਲ?", takePhoto: "ਪਰਚੀ ਦੀ ਫੋਟੋ ਲਓ",
      gallery: "ਗੈਲਰੀ ਵਿੱਚੋਂ ਚੁਣੋ", sayProblem: "ਸਮੱਸਿਆ ਦੱਸੋ", stop: "ਰੋਕੋ",
      checking: "ਸਰਕਾਰੀ ਰਿਕਾਰਡ ਨਾਲ ਜਾਂਚ ਹੋ ਰਹੀ ਹੈ", listen: "ਦੁਬਾਰਾ ਸੁਣੋ",
      showDealer: "ਦੁਕਾਨਦਾਰ ਨੂੰ ਦਿਖਾਓ", callKcc: "ਕਿਸਾਨ ਹੈਲਪਲਾਈਨ 'ਤੇ ਕਾਲ ਕਰੋ",
      share: "ਵਟਸਐਪ 'ਤੇ ਭੇਜੋ", more: "ਹੋਰ ਜਾਣਕਾਰੀ", again: "ਹੋਰ ਪਰਚੀ ਜਾਂਚੋ",
      ok: "ਠੀਕ ਲੱਗਦਾ ਹੈ", careful: "ਸਾਵਧਾਨ ਰਹੋ", danger: "ਇਹ ਦਵਾਈ ਨਾ ਛਿੜਕੋ",
      example: "ਉਦਾਹਰਨ ਵੇਖੋ", back: "ਵਾਪਸ", errRead: "ਫੋਟੋ ਪੜ੍ਹੀ ਨਹੀਂ ਜਾ ਸਕੀ। ਸਾਫ਼ ਫੋਟੋ ਲਓ।", errBusy: "ਇਸ ਵੇਲੇ ਬਹੁਤ ਲੋਕ ਜਾਂਚ ਕਰ ਰਹੇ ਹਨ। ਇੱਕ ਮਿੰਟ ਬਾਅਦ ਫਿਰ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
      pumpQuestion: "ਇੱਕ ਏਕੜ ਵਿੱਚ ਕਿੰਨੀਆਂ ਟੈਂਕੀਆਂ ਛਿੜਕਦੇ ਹੋ?", tanks: "ਟੈਂਕੀਆਂ",
      moreCrops: "ਹੋਰ ਫ਼ਸਲਾਂ", pickAfter: "ਇਸ ਤੋਂ ਬਾਅਦ ਤੋੜੋ", sprayTime: "ਛਿੜਕਾਅ ਦਾ ਸਹੀ ਸਮਾਂ", readAloud: "ਉੱਚੀ ਪੜ੍ਹ ਕੇ ਸੁਣਾਓ",
      pastChecks: "ਪਿਛਲੀਆਂ ਜਾਂਚਾਂ", deleteCheck: "ਕੀ ਇਹ ਜਾਂਚ ਮਿਟਾਉਣੀ ਹੈ?",
      stepRead: "ਪਰਚੀ ਪੜ੍ਹੀ ਜਾ ਰਹੀ ਹੈ", stepAnswer: "ਤੁਹਾਡਾ ਜਵਾਬ ਤਿਆਰ ਹੋ ਰਿਹਾ ਹੈ",
      crops: { paddy: "ਝੋਨਾ", cotton: "ਕਪਾਹ", chilli: "ਮਿਰਚ", tomato: "ਟਮਾਟਰ", brinjal: "ਬੈਂਗਣ", other: "ਹੋਰ" },
    },
  },
  {
    code: "bn", name: "বাংলা", english: "Bengali", speech: "bn-IN",
    s: {
      chooseLanguage: "আপনার ভাষা বেছে নিন", whichCrop: "কোন ফসল?", takePhoto: "চিরকুটের ছবি তুলুন",
      gallery: "গ্যালারি থেকে বাছুন", sayProblem: "সমস্যা বলুন", stop: "থামুন",
      checking: "সরকারি রেকর্ডের সঙ্গে মিলিয়ে দেখা হচ্ছে", listen: "আবার শুনুন",
      showDealer: "দোকানদারকে দেখান", callKcc: "কিষাণ হেল্পলাইনে ফোন করুন",
      share: "হোয়াটসঅ্যাপে পাঠান", more: "আরও তথ্য", again: "আরেকটি চিরকুট দেখুন",
      ok: "ঠিক আছে মনে হচ্ছে", careful: "সাবধান থাকুন", danger: "এই ওষুধ স্প্রে করবেন না",
      example: "উদাহরণ দেখুন", back: "ফিরে যান", errRead: "ছবিটি পড়া যায়নি। পরিষ্কার ছবি তুলুন।", errBusy: "এখন অনেকে পরীক্ষা করছেন। এক মিনিট পরে আবার চেষ্টা করুন।",
      pumpQuestion: "এক একরে কত ট্যাঙ্ক স্প্রে করেন?", tanks: "ট্যাঙ্ক",
      moreCrops: "আরও ফসল", pickAfter: "এর পরে তুলুন", sprayTime: "স্প্রে করার সঠিক সময়", readAloud: "জোরে পড়ে শোনান",
      pastChecks: "আগের পরীক্ষা", deleteCheck: "এই পরীক্ষাটি মুছে ফেলবেন?",
      stepRead: "চিরকুট পড়া হচ্ছে", stepAnswer: "আপনার উত্তর তৈরি হচ্ছে",
      crops: { paddy: "ধান", cotton: "তুলা", chilli: "লঙ্কা", tomato: "টমেটো", brinjal: "বেগুন", other: "অন্যান্য" },
    },
  },
  {
    code: "or", name: "ଓଡ଼ିଆ", english: "Odia", speech: "or-IN",
    s: {
      chooseLanguage: "ଆପଣଙ୍କ ଭାଷା ବାଛନ୍ତୁ", whichCrop: "କେଉଁ ଫସଲ?", takePhoto: "ଚିରକୁଟର ଫଟୋ ନିଅନ୍ତୁ",
      gallery: "ଗ୍ୟାଲେରୀରୁ ବାଛନ୍ତୁ", sayProblem: "ସମସ୍ୟା କୁହନ୍ତୁ", stop: "ବନ୍ଦ କରନ୍ତୁ",
      checking: "ସରକାରୀ ରେକର୍ଡ ସହ ଯାଞ୍ଚ ଚାଲିଛି", listen: "ପୁଣି ଶୁଣନ୍ତୁ",
      showDealer: "ଦୋକାନୀଙ୍କୁ ଦେଖାନ୍ତୁ", callKcc: "କିଷାନ ହେଲ୍ପଲାଇନକୁ କଲ କରନ୍ତୁ",
      share: "ହ୍ୱାଟସଆପରେ ପଠାନ୍ତୁ", more: "ଅଧିକ ବିବରଣୀ", again: "ଆଉ ଏକ ଚିରକୁଟ ଯାଞ୍ଚ କରନ୍ତୁ",
      ok: "ଠିକ ଅଛି", careful: "ସାବଧାନ ରୁହନ୍ତୁ", danger: "ଏହି ଔଷଧ ସିଞ୍ଚନ କରନ୍ତୁ ନାହିଁ",
      example: "ଉଦାହରଣ ଦେଖନ୍ତୁ", back: "ପଛକୁ", errRead: "ଫଟୋ ପଢ଼ିହେଲା ନାହିଁ। ସ୍ପଷ୍ଟ ଫଟୋ ନିଅନ୍ତୁ।", errBusy: "ଏବେ ବହୁତ ଲୋକ ଯାଞ୍ଚ କରୁଛନ୍ତି। ଗୋଟିଏ ମିନିଟ ପରେ ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।",
      pumpQuestion: "ଏକ ଏକରରେ କେତେ ଟାଙ୍କି ସିଞ୍ଚନ କରନ୍ତି?", tanks: "ଟାଙ୍କି",
      moreCrops: "ଅଧିକ ଫସଲ", pickAfter: "ଏହା ପରେ ତୋଳନ୍ତୁ", sprayTime: "ସିଞ୍ଚନର ଠିକ ସମୟ", readAloud: "ଜୋରରେ ପଢ଼ି ଶୁଣାନ୍ତୁ",
      pastChecks: "ପୂର୍ବ ଯାଞ୍ଚ", deleteCheck: "ଏହି ଯାଞ୍ଚ ହଟାଇବେ କି?",
      stepRead: "ଚିରକୁଟ ପଢ଼ାଯାଉଛି", stepAnswer: "ଆପଣଙ୍କ ଉତ୍ତର ପ୍ରସ୍ତୁତ ହେଉଛି",
      crops: { paddy: "ଧାନ", cotton: "କପା", chilli: "ଲଙ୍କା", tomato: "ଟମାଟୋ", brinjal: "ବାଇଗଣ", other: "ଅନ୍ୟ" },
    },
  },
  {
    code: "ml", name: "മലയാളം", english: "Malayalam", speech: "ml-IN",
    s: {
      chooseLanguage: "നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കുക", whichCrop: "ഏത് വിള?", takePhoto: "കുറിപ്പിന്റെ ഫോട്ടോ എടുക്കുക",
      gallery: "ഗാലറിയിൽ നിന്ന് തിരഞ്ഞെടുക്കുക", sayProblem: "പ്രശ്നം പറയുക", stop: "നിർത്തുക",
      checking: "സർക്കാർ രേഖകളുമായി പരിശോധിക്കുന്നു", listen: "വീണ്ടും കേൾക്കുക",
      showDealer: "കടക്കാരനെ കാണിക്കുക", callKcc: "കിസാൻ ഹെൽപ്‌ലൈനിൽ വിളിക്കുക",
      share: "വാട്ട്‌സ്ആപ്പിൽ അയയ്ക്കുക", more: "കൂടുതൽ വിവരങ്ങൾ", again: "മറ്റൊരു കുറിപ്പ് പരിശോധിക്കുക",
      ok: "ശരിയാണെന്ന് തോന്നുന്നു", careful: "ശ്രദ്ധിക്കുക", danger: "ഈ മരുന്ന് തളിക്കരുത്",
      example: "ഉദാഹരണം കാണുക", back: "തിരികെ", errRead: "ഫോട്ടോ വായിക്കാനായില്ല. വ്യക്തമായ ഫോട്ടോ എടുക്കുക.", errBusy: "ഇപ്പോൾ ധാരാളം പേർ പരിശോധിക്കുന്നു. ഒരു മിനിറ്റ് കഴിഞ്ഞ് വീണ്ടും ശ്രമിക്കുക.",
      pumpQuestion: "ഒരു ഏക്കറിൽ എത്ര ടാങ്ക് തളിക്കും?", tanks: "ടാങ്ക്",
      moreCrops: "കൂടുതൽ വിളകൾ", pickAfter: "ഇതിനു ശേഷം വിളവെടുക്കുക", sprayTime: "തളിക്കാൻ ശരിയായ സമയം", readAloud: "ഉറക്കെ വായിക്കുക",
      pastChecks: "മുമ്പത്തെ പരിശോധനകൾ", deleteCheck: "ഈ പരിശോധന നീക്കം ചെയ്യണോ?",
      stepRead: "കുറിപ്പ് വായിക്കുന്നു", stepAnswer: "നിങ്ങളുടെ ഉത്തരം തയ്യാറാകുന്നു",
      crops: { paddy: "നെല്ല്", cotton: "പരുത്തി", chilli: "മുളക്", tomato: "തക്കാളി", brinjal: "വഴുതന", other: "മറ്റുള്ളവ" },
    },
  },
  {
    code: "en", name: "English", english: "English", speech: "en-IN",
    s: {
      chooseLanguage: "Choose your language", whichCrop: "Which crop?", takePhoto: "Take a photo of the parchi",
      gallery: "Pick from gallery", sayProblem: "Say the problem", stop: "Stop",
      checking: "Checking with government records", listen: "Listen again",
      showDealer: "Show to dealer", callKcc: "Call Kisan helpline",
      share: "Send on WhatsApp", more: "More details", again: "Check another parchi",
      ok: "Looks OK", careful: "Be careful", danger: "Do not spray this",
      example: "Try an example", back: "Back", errRead: "Could not read the photo. Take a clearer photo.", errBusy: "Too many checks right now. Please try again in a minute.",
      pumpQuestion: "How many spray tanks per acre?", tanks: "tanks",
      moreCrops: "More crops", pickAfter: "Pick only after", sprayTime: "Best time to spray", readAloud: "Read aloud",
      pastChecks: "Past checks", deleteCheck: "Delete this check?",
      stepRead: "Reading the parchi", stepAnswer: "Preparing your answer",
      crops: { paddy: "Paddy", cotton: "Cotton", chilli: "Chilli", tomato: "Tomato", brinjal: "Brinjal", other: "Other" },
    },
  },
];

export const CROPS: CropId[] = ["paddy", "cotton", "chilli", "tomato", "brinjal", "other"];

export function getLanguage(code: string | null | undefined): Language {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}

// Kisan Call Centre, Ministry of Agriculture: toll free, 6 AM to 10 PM, 22 languages.
export const KCC_NUMBER = "18001801551";
