import { db } from "./index";
import { opicLevels, questionTopics, questions } from "./schema";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // 1. Seed OPIc Levels
    console.log("Seeding OPIc levels...");
    await db.insert(opicLevels).values([
      {
        levelCode: "NL",
        levelName: "Novice Low",
        levelOrder: 1,
        minUtterance: 3,
        minWords: 30,
        description: "단어나 구 단위 답변",
      },
      {
        levelCode: "NM",
        levelName: "Novice Mid",
        levelOrder: 2,
        minUtterance: 4,
        minWords: 40,
        description: "기본적인 문장 구성",
      },
      {
        levelCode: "NH",
        levelName: "Novice High",
        levelOrder: 3,
        minUtterance: 5,
        minWords: 50,
        description: "간단한 문장 나열",
      },
      {
        levelCode: "IL",
        levelName: "Intermediate Low",
        levelOrder: 4,
        minUtterance: 6,
        minWords: 70,
        description: "기본 의사소통 가능",
      },
      {
        levelCode: "IM1",
        levelName: "Intermediate Mid 1",
        levelOrder: 5,
        minUtterance: 7,
        minWords: 90,
        description: "일상 대화 가능",
      },
      {
        levelCode: "IM2",
        levelName: "Intermediate Mid 2",
        levelOrder: 6,
        minUtterance: 8,
        minWords: 110,
        description: "다양한 표현 시도",
      },
      {
        levelCode: "IM3",
        levelName: "Intermediate Mid 3",
        levelOrder: 7,
        minUtterance: 9,
        minWords: 130,
        description: "IH 근접 수준",
      },
      {
        levelCode: "IH",
        levelName: "Intermediate High",
        levelOrder: 8,
        minUtterance: 10,
        minWords: 150,
        description: "논리적 문단 구성",
      },
      {
        levelCode: "AL",
        levelName: "Advanced Low",
        levelOrder: 9,
        minUtterance: 15,
        minWords: 200,
        minConnectors: 3,
        minModifiers: 5,
        description: "능숙한 표현 구사",
      },
    ]).onConflictDoNothing();
    console.log("✅ OPIc levels seeded");

    // 2. Seed Question Topics
    console.log("Seeding question topics...");
    await db.insert(questionTopics).values([
      // 거주
      { topicName: "집", category: "residence", isCommonTopic: false },
      { topicName: "동네", category: "residence", isCommonTopic: false },
      // 여가
      { topicName: "카페", category: "leisure", isCommonTopic: false },
      { topicName: "영화", category: "leisure", isCommonTopic: false },
      { topicName: "공원", category: "leisure", isCommonTopic: false },
      // 취미
      { topicName: "음악", category: "hobby", isCommonTopic: false },
      { topicName: "독서", category: "hobby", isCommonTopic: false },
      { topicName: "요리", category: "hobby", isCommonTopic: false },
      // 운동
      { topicName: "수영", category: "exercise", isCommonTopic: false },
      { topicName: "헬스", category: "exercise", isCommonTopic: false },
      { topicName: "조깅", category: "exercise", isCommonTopic: false },
      // 여행
      { topicName: "국내여행", category: "travel", isCommonTopic: false },
      { topicName: "해외여행", category: "travel", isCommonTopic: false },
      // 돌발 주제
      { topicName: "재활용", category: "common", isCommonTopic: true },
      { topicName: "기술", category: "common", isCommonTopic: true },
      { topicName: "날씨", category: "common", isCommonTopic: true },
      { topicName: "가구", category: "common", isCommonTopic: true },
      { topicName: "패션", category: "common", isCommonTopic: true },
    ]).onConflictDoNothing();

    // 토픽 조회 (insert 후 반환값이 없을 수 있으므로 별도 조회)
    const topics = await db.select().from(questionTopics);
    console.log("✅ Question topics seeded");

    // 3. Seed Comprehensive OPIc Questions
    console.log("Seeding OPIc questions...");

    // 토픽 찾기 헬퍼
    const findTopic = (name: string) => topics.find(t => t.topicName === name);

    const cafeTopic = findTopic("카페");
    const houseTopic = findTopic("집");
    const neighborhoodTopic = findTopic("동네");
    const movieTopic = findTopic("영화");
    const parkTopic = findTopic("공원");
    const musicTopic = findTopic("음악");
    const readingTopic = findTopic("독서");
    const cookingTopic = findTopic("요리");
    const swimmingTopic = findTopic("수영");
    const gymTopic = findTopic("헬스");
    const joggingTopic = findTopic("조깅");
    const domesticTravelTopic = findTopic("국내여행");
    const internationalTravelTopic = findTopic("해외여행");
    const recyclingTopic = findTopic("재활용");
    const technologyTopic = findTopic("기술");
    const weatherTopic = findTopic("날씨");
    const furnitureTopic = findTopic("가구");
    const fashionTopic = findTopic("패션");

    const questionsToInsert = [];

    // ========== 집 (House/Residence) ==========
    if (houseTopic) {
      questionsToInsert.push(
        {
          topicId: houseTopic.id,
          questionType: "description",
          questionText: "Tell me about the place where you live. Describe your house or apartment in detail, including the location, rooms, and what you like about it.",
          expectedAnswerStructure: "Introduction → Location → Structure/Rooms → Favorite aspects",
          keyVocabulary: ["apartment", "neighborhood", "spacious", "cozy", "located"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: houseTopic.id,
          questionType: "description",
          questionText: "Describe your favorite room in your home. What does it look like? What furniture and items are in it? Why is it your favorite?",
          expectedAnswerStructure: "Introduction → Appearance/Furniture → Special items → Reason for liking",
          keyVocabulary: ["bedroom", "living room", "furniture", "comfortable", "relax"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: houseTopic.id,
          questionType: "routine",
          questionText: "What do you typically do when you're at home? Describe your daily routine at home from when you wake up to when you go to sleep.",
          expectedAnswerStructure: "Morning routine → Daytime activities → Evening routine → Bedtime",
          keyVocabulary: ["wake up", "routine", "relax", "chores", "evening"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: houseTopic.id,
          questionType: "comparison",
          questionText: "How has your home changed over the years? Compare your current home to where you lived in the past. What are the differences?",
          expectedAnswerStructure: "Past home → Current home → Differences → Feelings",
          keyVocabulary: ["used to live", "compared to", "changed", "different", "prefer"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: houseTopic.id,
          questionType: "experience",
          questionText: "Tell me about a problem you had in your home and how you solved it. For example, something broke or there was an issue with neighbors.",
          expectedAnswerStructure: "Problem introduction → Situation → Solution process → Result",
          keyVocabulary: ["problem", "issue", "repair", "fixed", "solution"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: houseTopic.id,
          questionType: "experience",
          questionText: "Describe a memorable event that happened at your home. It could be a party, a gathering with friends, or something unexpected.",
          expectedAnswerStructure: "Background → Event description → Memorable moment → Feelings",
          keyVocabulary: ["memorable", "gathering", "celebrate", "unexpected", "special"],
          createdBy: "admin",
          isAiGenerated: false,
        }
      );
    }

    // ========== 동네 (Neighborhood) ==========
    if (neighborhoodTopic) {
      questionsToInsert.push(
        {
          topicId: neighborhoodTopic.id,
          questionType: "description",
          questionText: "Describe the neighborhood where you live. What places and facilities are nearby? What do you like about living there?",
          expectedAnswerStructure: "Location intro → Nearby facilities → Amenities → Advantages",
          keyVocabulary: ["neighborhood", "convenient", "facilities", "nearby", "community"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: neighborhoodTopic.id,
          questionType: "comparison",
          questionText: "How has your neighborhood changed over time? What was it like before compared to now?",
          expectedAnswerStructure: "Past appearance → Current appearance → Changes → Feelings",
          keyVocabulary: ["development", "changed", "improved", "used to be", "nowadays"],
          createdBy: "admin",
          isAiGenerated: false,
        }
      );
    }

    // ========== 카페 (Cafe) ==========
    if (cafeTopic) {
      questionsToInsert.push(
        {
          topicId: cafeTopic.id,
          questionType: "description",
          questionText: "Tell me about a cafe you often go to. Where is it located? What does it look like? What do you usually order there?",
          expectedAnswerStructure: "Cafe intro → Location → Atmosphere/Interior → Menu",
          keyVocabulary: ["atmosphere", "cozy", "menu", "beverage", "favorite"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: cafeTopic.id,
          questionType: "routine",
          questionText: "Describe what you typically do when you visit a cafe. From entering to leaving, what is your usual routine?",
          expectedAnswerStructure: "Arrival → Order → Find seat → Activities → Leave",
          keyVocabulary: ["order", "find a seat", "enjoy", "spend time", "leave"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: cafeTopic.id,
          questionType: "experience",
          questionText: "Tell me about a memorable experience you had at a cafe. What happened and why was it memorable?",
          expectedAnswerStructure: "Background → Situation → Special moment → Feelings",
          keyVocabulary: ["memorable", "experience", "special", "happened", "remember"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: cafeTopic.id,
          questionType: "roleplay",
          questionText: "I'd like you to call a cafe to make a reservation for a group meeting. Ask about available times, seating capacity, and menu options.",
          roleplayContext: {
            scenario: "phone_call",
            role: "customer",
            context: "Making cafe reservation",
            expected_interactions: 3
          },
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: cafeTopic.id,
          questionType: "roleplay",
          questionText: "You ordered a drink at a cafe but received the wrong order. Explain the situation to the barista and ask them to fix it.",
          roleplayContext: {
            scenario: "complaint",
            role: "customer",
            context: "Fixing wrong order",
            expected_interactions: 3
          },
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: cafeTopic.id,
          questionType: "comparison",
          questionText: "Compare two cafes you have been to. What are the similarities and differences between them? Which one do you prefer and why?",
          expectedAnswerStructure: "Cafe A intro → Cafe B intro → Comparison → Preference",
          keyVocabulary: ["similar", "different", "prefer", "atmosphere", "quality"],
          createdBy: "admin",
          isAiGenerated: false,
        }
      );
    }

    // ========== 영화 (Movies) ==========
    if (movieTopic) {
      questionsToInsert.push(
        {
          topicId: movieTopic.id,
          questionType: "description",
          questionText: "What kinds of movies do you like to watch? Describe your favorite genre and explain why you enjoy it.",
          expectedAnswerStructure: "Favorite genre → Features → Reason for liking → Example movies",
          keyVocabulary: ["genre", "action", "comedy", "thriller", "prefer"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: movieTopic.id,
          questionType: "description",
          questionText: "Describe a movie theater you often go to. What does it look like? What facilities does it have?",
          expectedAnswerStructure: "Theater intro → Location → Facilities → Special features",
          keyVocabulary: ["theater", "screen", "seats", "snacks", "atmosphere"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: movieTopic.id,
          questionType: "routine",
          questionText: "What do you typically do when you go to watch a movie? Describe your routine from planning to leaving the theater.",
          expectedAnswerStructure: "Movie selection → Booking → Arrival → Watching → Leaving",
          keyVocabulary: ["book", "tickets", "snacks", "watch", "discuss"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: movieTopic.id,
          questionType: "experience",
          questionText: "Tell me about the most memorable movie you have ever watched. What was it about and why was it memorable?",
          expectedAnswerStructure: "Movie intro → Plot → Impressive scenes → Feelings",
          keyVocabulary: ["memorable", "impressed", "touching", "amazing", "recommend"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: movieTopic.id,
          questionType: "experience",
          questionText: "Tell me about a time when something unexpected happened while watching a movie at a theater.",
          expectedAnswerStructure: "Situation background → Unexpected event → Response → Result",
          keyVocabulary: ["unexpected", "happened", "suddenly", "problem", "solved"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: movieTopic.id,
          questionType: "roleplay",
          questionText: "You want to book movie tickets by phone. Call the theater and ask about available showtimes, seat selection, and ticket prices.",
          roleplayContext: {
            scenario: "phone_call",
            role: "customer",
            context: "Booking movie tickets",
            expected_interactions: 3
          },
          createdBy: "admin",
          isAiGenerated: false,
        }
      );
    }

    // ========== 공원 (Park) ==========
    if (parkTopic) {
      questionsToInsert.push(
        {
          topicId: parkTopic.id,
          questionType: "description",
          questionText: "Describe a park you often visit. What does it look like? What facilities does it have?",
          expectedAnswerStructure: "Park intro → Location → Facilities → Atmosphere",
          keyVocabulary: ["park", "trees", "benches", "playground", "peaceful"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: parkTopic.id,
          questionType: "routine",
          questionText: "What do you usually do when you visit a park? Describe your typical activities there.",
          expectedAnswerStructure: "Arrival → Activity 1 → Activity 2 → Wrap up",
          keyVocabulary: ["walk", "jog", "relax", "picnic", "exercise"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: parkTopic.id,
          questionType: "experience",
          questionText: "Tell me about a memorable experience you had at a park. What happened and why do you remember it?",
          expectedAnswerStructure: "Background → Situation → Special moment → Feelings",
          keyVocabulary: ["memorable", "happened", "enjoyed", "special", "remember"],
          createdBy: "admin",
          isAiGenerated: false,
        }
      );
    }

    // ========== 음악 (Music) ==========
    if (musicTopic) {
      questionsToInsert.push(
        {
          topicId: musicTopic.id,
          questionType: "description",
          questionText: "What kind of music do you like to listen to? Describe your favorite genre and artists.",
          expectedAnswerStructure: "Favorite genre → Reason → Favorite artist → Recommended songs",
          keyVocabulary: ["genre", "artist", "melody", "lyrics", "favorite"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: musicTopic.id,
          questionType: "routine",
          questionText: "When and where do you usually listen to music? Describe your music listening habits.",
          expectedAnswerStructure: "Listening time → Place → Method → Feelings",
          keyVocabulary: ["commute", "streaming", "headphones", "playlist", "mood"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: musicTopic.id,
          questionType: "experience",
          questionText: "Tell me about a memorable experience related to music, such as a concert you attended or discovering a new artist.",
          expectedAnswerStructure: "Background → Experience description → Impressive points → Feelings",
          keyVocabulary: ["concert", "live", "performance", "amazing", "unforgettable"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: musicTopic.id,
          questionType: "comparison",
          questionText: "How has your taste in music changed over time? What music did you like in the past compared to now?",
          expectedAnswerStructure: "Past taste → Current taste → Reason for change → Feelings",
          keyVocabulary: ["used to like", "nowadays", "changed", "evolved", "prefer"],
          createdBy: "admin",
          isAiGenerated: false,
        }
      );
    }

    // ========== 독서 (Reading) ==========
    if (readingTopic) {
      questionsToInsert.push(
        {
          topicId: readingTopic.id,
          questionType: "description",
          questionText: "What kinds of books do you like to read? Describe your favorite genre and why you enjoy reading.",
          expectedAnswerStructure: "Favorite genre → Reason → Favorite author/book → Joy of reading",
          keyVocabulary: ["genre", "novel", "author", "story", "imagination"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: readingTopic.id,
          questionType: "routine",
          questionText: "When and where do you usually read? Describe your reading habits and routine.",
          expectedAnswerStructure: "Reading time → Place → Atmosphere → Habits",
          keyVocabulary: ["bedtime", "commute", "library", "quiet", "concentrate"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: readingTopic.id,
          questionType: "experience",
          questionText: "Tell me about a book that had a significant impact on you. What was it about and why was it meaningful?",
          expectedAnswerStructure: "Book intro → Plot → Impressive part → Impact",
          keyVocabulary: ["impact", "meaningful", "inspired", "lesson", "changed"],
          createdBy: "admin",
          isAiGenerated: false,
        }
      );
    }

    // ========== 요리 (Cooking) ==========
    if (cookingTopic) {
      questionsToInsert.push(
        {
          topicId: cookingTopic.id,
          questionType: "description",
          questionText: "Do you enjoy cooking? Tell me about your favorite dish to make and describe how you prepare it.",
          expectedAnswerStructure: "Dish intro → Ingredients → Process → Taste/Feelings",
          keyVocabulary: ["ingredients", "recipe", "prepare", "delicious", "homemade"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: cookingTopic.id,
          questionType: "routine",
          questionText: "Describe your typical cooking routine. How often do you cook, and what do you usually make?",
          expectedAnswerStructure: "Frequency → Usual dishes → Process → Enjoyment",
          keyVocabulary: ["daily", "meal prep", "kitchen", "cook", "serve"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: cookingTopic.id,
          questionType: "experience",
          questionText: "Tell me about a memorable cooking experience. Maybe a dish that went wrong or a successful dinner party.",
          expectedAnswerStructure: "Situation → What happened → Result → Lesson",
          keyVocabulary: ["disaster", "success", "learned", "mistake", "proud"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: cookingTopic.id,
          questionType: "comparison",
          questionText: "How have your cooking skills changed over the years? Compare what you could cook before to what you can cook now.",
          expectedAnswerStructure: "Past skills → Current skills → Development process → Feelings",
          keyVocabulary: ["improved", "learned", "practice", "skill", "confident"],
          createdBy: "admin",
          isAiGenerated: false,
        }
      );
    }

    // ========== 수영 (Swimming) ==========
    if (swimmingTopic) {
      questionsToInsert.push(
        {
          topicId: swimmingTopic.id,
          questionType: "description",
          questionText: "Describe the swimming pool you usually go to. What does it look like and what facilities does it have?",
          expectedAnswerStructure: "Pool intro → Location → Facilities → Features",
          keyVocabulary: ["pool", "lanes", "locker room", "equipment", "clean"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: swimmingTopic.id,
          questionType: "routine",
          questionText: "Describe your swimming routine. How often do you go, what do you do there, and how long do you stay?",
          expectedAnswerStructure: "Frequency → Preparation → Swimming activities → Wrap up",
          keyVocabulary: ["warm up", "laps", "stroke", "cool down", "stretch"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: swimmingTopic.id,
          questionType: "experience",
          questionText: "Tell me about how you first started swimming. Who taught you and what was the experience like?",
          expectedAnswerStructure: "How I started → Learning process → Difficulties → Feelings",
          keyVocabulary: ["learned", "instructor", "difficult", "practice", "confident"],
          createdBy: "admin",
          isAiGenerated: false,
        }
      );
    }

    // ========== 헬스 (Gym/Fitness) ==========
    if (gymTopic) {
      questionsToInsert.push(
        {
          topicId: gymTopic.id,
          questionType: "description",
          questionText: "Describe the gym you go to. What equipment does it have and what is the atmosphere like?",
          expectedAnswerStructure: "Gym intro → Location → Equipment/Facilities → Atmosphere",
          keyVocabulary: ["gym", "equipment", "weights", "treadmill", "trainer"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: gymTopic.id,
          questionType: "routine",
          questionText: "Describe your typical workout routine at the gym. What exercises do you do and in what order?",
          expectedAnswerStructure: "Warm up → Exercise types → Order → Cool down",
          keyVocabulary: ["warm up", "cardio", "strength", "sets", "cool down"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: gymTopic.id,
          questionType: "experience",
          questionText: "Tell me about a memorable experience at the gym. Maybe you achieved a fitness goal or had an interesting encounter.",
          expectedAnswerStructure: "Background → Experience → Result → Feelings",
          keyVocabulary: ["goal", "achieved", "challenge", "proud", "motivated"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: gymTopic.id,
          questionType: "comparison",
          questionText: "How has your fitness routine changed over time? Compare your workout habits from the past to now.",
          expectedAnswerStructure: "Past workout habits → Current habits → Reason for change → Result",
          keyVocabulary: ["improved", "changed", "consistent", "progress", "health"],
          createdBy: "admin",
          isAiGenerated: false,
        }
      );
    }

    // ========== 조깅 (Jogging) ==========
    if (joggingTopic) {
      questionsToInsert.push(
        {
          topicId: joggingTopic.id,
          questionType: "description",
          questionText: "Describe where you usually go jogging. What does the area look like and why do you like jogging there?",
          expectedAnswerStructure: "Location intro → Environment → Good points → Atmosphere",
          keyVocabulary: ["path", "scenery", "fresh air", "peaceful", "route"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: joggingTopic.id,
          questionType: "routine",
          questionText: "Describe your jogging routine. When do you jog, how far do you run, and what do you do before and after?",
          expectedAnswerStructure: "Time → Preparation → Jogging process → Cool down",
          keyVocabulary: ["morning", "stretch", "distance", "pace", "cool down"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: joggingTopic.id,
          questionType: "experience",
          questionText: "Tell me about how you got into jogging. What motivated you to start and how has it affected your life?",
          expectedAnswerStructure: "How I started → Early experience → Changes → Present",
          keyVocabulary: ["started", "motivated", "health", "habit", "benefit"],
          createdBy: "admin",
          isAiGenerated: false,
        }
      );
    }

    // ========== 국내여행 (Domestic Travel) ==========
    if (domesticTravelTopic) {
      questionsToInsert.push(
        {
          topicId: domesticTravelTopic.id,
          questionType: "description",
          questionText: "Describe your favorite domestic travel destination. Where is it and what makes it special?",
          expectedAnswerStructure: "Place intro → Location → Features → Recommendation",
          keyVocabulary: ["destination", "scenery", "attraction", "famous", "recommend"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: domesticTravelTopic.id,
          questionType: "routine",
          questionText: "How do you usually prepare for a domestic trip? Describe your planning process from start to finish.",
          expectedAnswerStructure: "Planning stage → Booking → Packing → Departure",
          keyVocabulary: ["plan", "book", "pack", "itinerary", "research"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: domesticTravelTopic.id,
          questionType: "experience",
          questionText: "Tell me about your most memorable domestic trip. Where did you go and what made it special?",
          expectedAnswerStructure: "Destination → Companions → Special experience → Feelings",
          keyVocabulary: ["memorable", "adventure", "explore", "experience", "unforgettable"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: domesticTravelTopic.id,
          questionType: "comparison",
          questionText: "Compare two domestic destinations you have visited. What are the differences and similarities?",
          expectedAnswerStructure: "Place A → Place B → Comparison → Preference",
          keyVocabulary: ["compare", "different", "similar", "prefer", "unique"],
          createdBy: "admin",
          isAiGenerated: false,
        }
      );
    }

    // ========== 해외여행 (International Travel) ==========
    if (internationalTravelTopic) {
      questionsToInsert.push(
        {
          topicId: internationalTravelTopic.id,
          questionType: "description",
          questionText: "Describe a country you have visited or would like to visit. What interests you about that place?",
          expectedAnswerStructure: "Country intro → Reason for interest → Attractions → Expectations",
          keyVocabulary: ["country", "culture", "landmark", "cuisine", "experience"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: internationalTravelTopic.id,
          questionType: "routine",
          questionText: "How do you prepare for an international trip? Describe your preparation process including booking and packing.",
          expectedAnswerStructure: "Passport/Visa → Booking → Packing → Currency exchange",
          keyVocabulary: ["passport", "visa", "booking", "currency", "luggage"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: internationalTravelTopic.id,
          questionType: "experience",
          questionText: "Tell me about your most memorable international trip. What country did you visit and what did you experience?",
          expectedAnswerStructure: "Destination → Special experience → Impressive points → Feelings",
          keyVocabulary: ["memorable", "culture shock", "local food", "adventure", "lifetime"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: internationalTravelTopic.id,
          questionType: "experience",
          questionText: "Have you ever faced a problem while traveling abroad? Tell me what happened and how you solved it.",
          expectedAnswerStructure: "Problem situation → Details → Solution process → Lesson",
          keyVocabulary: ["problem", "language barrier", "lost", "solved", "learned"],
          createdBy: "admin",
          isAiGenerated: false,
        }
      );
    }

    // ========== 재활용 (Recycling - 돌발) ==========
    if (recyclingTopic) {
      questionsToInsert.push(
        {
          topicId: recyclingTopic.id,
          questionType: "description",
          questionText: "How do people in your country typically recycle? Describe the recycling system and process.",
          expectedAnswerStructure: "System intro → Sorting method → Collection process → Importance",
          keyVocabulary: ["separate", "garbage", "plastic", "paper", "environment"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: recyclingTopic.id,
          questionType: "routine",
          questionText: "What do you do to recycle in your daily life? Describe your recycling habits.",
          expectedAnswerStructure: "Sorting method → Disposal time → Habits → Feelings",
          keyVocabulary: ["sort", "bin", "collect", "reduce", "reuse"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: recyclingTopic.id,
          questionType: "comparison",
          questionText: "How has recycling changed in your country over the years? Compare the past and present.",
          expectedAnswerStructure: "Past situation → Current situation → Changes → Feelings",
          keyVocabulary: ["improved", "awareness", "policy", "convenient", "changed"],
          createdBy: "admin",
          isAiGenerated: false,
        }
      );
    }

    // ========== 기술 (Technology - 돌발) ==========
    if (technologyTopic) {
      questionsToInsert.push(
        {
          topicId: technologyTopic.id,
          questionType: "description",
          questionText: "What technology do you use most in your daily life? Describe the device and how you use it.",
          expectedAnswerStructure: "Device intro → Purpose → How to use → Importance",
          keyVocabulary: ["smartphone", "computer", "app", "convenient", "essential"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: technologyTopic.id,
          questionType: "comparison",
          questionText: "How has technology changed from the past to the present? Describe specific examples.",
          expectedAnswerStructure: "Past technology → Current technology → Changes → Impact",
          keyVocabulary: ["evolved", "advanced", "digital", "revolutionary", "impact"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: technologyTopic.id,
          questionType: "experience",
          questionText: "Tell me about a time when technology helped you solve a problem or made your life easier.",
          expectedAnswerStructure: "Situation → Technology used → Solution process → Feelings",
          keyVocabulary: ["helpful", "convenient", "solved", "efficient", "grateful"],
          createdBy: "admin",
          isAiGenerated: false,
        }
      );
    }

    // ========== 날씨 (Weather - 돌발) ==========
    if (weatherTopic) {
      questionsToInsert.push(
        {
          topicId: weatherTopic.id,
          questionType: "description",
          questionText: "Describe the typical weather in your country throughout the year. What are the seasons like?",
          expectedAnswerStructure: "Seasons intro → Each season features → Favorite season → Reason",
          keyVocabulary: ["spring", "summer", "fall", "winter", "temperature"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: weatherTopic.id,
          questionType: "comparison",
          questionText: "How has the weather in your area changed compared to the past? Have you noticed any differences?",
          expectedAnswerStructure: "Past weather → Current weather → Changes → Feelings",
          keyVocabulary: ["climate change", "extreme", "unusual", "noticed", "different"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: weatherTopic.id,
          questionType: "experience",
          questionText: "Tell me about a time when bad weather affected your plans. What happened and what did you do?",
          expectedAnswerStructure: "Plans → Weather problem → Response → Result",
          keyVocabulary: ["cancelled", "delayed", "storm", "adjusted", "unexpected"],
          createdBy: "admin",
          isAiGenerated: false,
        }
      );
    }

    // ========== 가구 (Furniture - 돌발) ==========
    if (furnitureTopic) {
      questionsToInsert.push(
        {
          topicId: furnitureTopic.id,
          questionType: "description",
          questionText: "Describe your favorite piece of furniture in your home. What does it look like and why do you like it?",
          expectedAnswerStructure: "Furniture intro → Appearance → Purpose → Reason for liking",
          keyVocabulary: ["furniture", "comfortable", "design", "quality", "useful"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: furnitureTopic.id,
          questionType: "experience",
          questionText: "Tell me about a time when you bought or assembled furniture. What was the experience like?",
          expectedAnswerStructure: "Purchase process → Assembly/Installation → Difficulties → Result",
          keyVocabulary: ["purchased", "assembled", "instructions", "challenging", "satisfied"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: furnitureTopic.id,
          questionType: "comparison",
          questionText: "How is furniture different now compared to the past? Describe changes in style, materials, or function.",
          expectedAnswerStructure: "Past furniture → Current furniture → Differences → Feelings",
          keyVocabulary: ["modern", "traditional", "material", "functional", "trendy"],
          createdBy: "admin",
          isAiGenerated: false,
        }
      );
    }

    // ========== 패션 (Fashion - 돌발) ==========
    if (fashionTopic) {
      questionsToInsert.push(
        {
          topicId: fashionTopic.id,
          questionType: "description",
          questionText: "Describe your personal style. What kind of clothes do you usually wear and why?",
          expectedAnswerStructure: "Style intro → Preferred clothes → Reason → Feelings",
          keyVocabulary: ["casual", "formal", "comfortable", "trendy", "style"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: fashionTopic.id,
          questionType: "routine",
          questionText: "How do you shop for clothes? Describe where you shop and how you decide what to buy.",
          expectedAnswerStructure: "Shopping place → Selection criteria → Process → Feelings",
          keyVocabulary: ["shopping", "online", "try on", "budget", "preference"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        {
          topicId: fashionTopic.id,
          questionType: "comparison",
          questionText: "How has your fashion style changed over the years? Compare what you wore before to what you wear now.",
          expectedAnswerStructure: "Past style → Current style → Reason for change → Feelings",
          keyVocabulary: ["used to wear", "changed", "mature", "evolved", "preference"],
          createdBy: "admin",
          isAiGenerated: false,
        }
      );
    }

    // 질문 삽입
    if (questionsToInsert.length > 0) {
      await db.insert(questions).values(questionsToInsert).onConflictDoNothing();
      console.log(`✅ ${questionsToInsert.length} OPIc questions seeded`);
    }

    console.log("✨ Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seed()
    .then(() => {
      console.log("Seed completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seed failed:", error);
      process.exit(1);
    });
}

export { seed };
