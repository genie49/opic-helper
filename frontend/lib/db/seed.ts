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
    ]);
    console.log("✅ OPIc levels seeded");

    // 2. Seed Question Topics
    console.log("Seeding question topics...");
    const topics = await db.insert(questionTopics).values([
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
    ]).returning();
    console.log("✅ Question topics seeded");

    // 3. Seed Sample Questions
    console.log("Seeding sample questions...");

    // 카페 주제 찾기
    const cafeTopic = topics.find(t => t.topicName === "카페");
    const houseTopic = topics.find(t => t.topicName === "집");
    const swimmingTopic = topics.find(t => t.topicName === "수영");

    if (cafeTopic && houseTopic && swimmingTopic) {
      await db.insert(questions).values([
        // 카페 - 경험
        {
          topicId: cafeTopic.id,
          questionType: "experience",
          difficultyLevel: "IM3",
          questionText: "카페에서 있었던 기억에 남는 경험에 대해 말해주세요. 언제, 어디서, 누구와 갔는지, 그리고 어떤 일이 있었는지 자세히 설명해주세요.",
          expectedAnswerStructure: "도입 → 시간/장소 → 상황 전개 → 느낀 점",
          keyVocabulary: ["memorable", "experience", "atmosphere", "conversation"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        // 집 - 묘사
        {
          topicId: houseTopic.id,
          questionType: "description",
          difficultyLevel: "IM2",
          questionText: "현재 살고 있는 집에 대해 설명해주세요. 위치, 외관, 방 구조 등을 포함해서 말해주세요.",
          expectedAnswerStructure: "도입 → 위치 설명 → 외관/구조 → 좋은 점",
          keyVocabulary: ["apartment", "location", "spacious", "comfortable"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        // 수영 - 루틴
        {
          topicId: swimmingTopic.id,
          questionType: "routine",
          difficultyLevel: "IM2",
          questionText: "수영을 할 때의 일상적인 루틴에 대해 설명해주세요. 언제 가는지, 어떻게 준비하는지, 무엇을 하는지 말해주세요.",
          expectedAnswerStructure: "도입 → 준비 과정 → 수영장에서 하는 일 → 마무리",
          keyVocabulary: ["routine", "swimming pool", "warm up", "exercise"],
          createdBy: "admin",
          isAiGenerated: false,
        },
        // 카페 - 롤플레이
        {
          topicId: cafeTopic.id,
          questionType: "roleplay",
          difficultyLevel: "IH",
          questionText: "친구와 카페에서 만나기로 했는데, 친구가 길을 모릅니다. 전화로 카페 위치와 특징을 설명하고 3-4가지 질문에 답해주세요.",
          roleplayContext: {
            scenario: "phone_call",
            role: "guide",
            context: "친구에게 카페 위치 안내",
            expected_interactions: 3
          },
          createdBy: "admin",
          isAiGenerated: false,
        },
      ]);
      console.log("✅ Sample questions seeded");
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
