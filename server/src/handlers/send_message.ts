
import { db } from '../db';
import { messagesTable } from '../db/schema';
import { type SendMessageInput, type Message, type AiAgentType } from '../schema';

export const sendMessage = async (input: SendMessageInput): Promise<Message> => {
  try {
    // 1. Save the user's message to the database
    await db.insert(messagesTable)
      .values({
        conversation_id: input.conversation_id,
        role: 'user',
        content: input.content,
        ai_agent_type: null // User messages don't have an agent type
      })
      .execute();

    // 2. Generate AI response based on agent type
    const aiAgentType = input.ai_agent_type || 'general_qa';
    
    /* 
     * PRODUCTION IMPLEMENTATION NOTE:
     * Replace the mock generateAIResponse function below with actual external AI service integration.
     * This is where you would:
     * 
     * 1. Call external AI APIs (OpenAI GPT, Claude, Gemini, etc.)
     * 2. Implement secure API key management using environment variables
     * 3. Add proper error handling for API failures and rate limiting
     * 4. Implement user authentication and authorization checks
     * 5. Add request/response logging for monitoring and debugging
     * 6. Consider implementing response caching for common queries
     * 7. Add content filtering and safety checks for responses
     * 
     * Example production structure:
     * const aiResponse = await callExternalAIService({
     *   message: input.content,
     *   agentType: aiAgentType,
     *   userId: authenticatedUserId, // from auth middleware
     *   conversationHistory: await getRecentMessages(input.conversation_id)
     * });
     */
    const aiResponse = await generateAIResponse(input.content, aiAgentType);

    // 3. Save the AI response message to the database
    const result = await db.insert(messagesTable)
      .values({
        conversation_id: input.conversation_id,
        role: 'assistant',
        content: aiResponse,
        ai_agent_type: aiAgentType
      })
      .returning()
      .execute();

    // 4. Return the AI response message
    return result[0];
  } catch (error) {
    console.error('Send message failed:', error);
    throw error;
  }
};

/**
 * PLACEHOLDER AI RESPONSE GENERATOR
 * This function demonstrates how different AI agent types can provide specialized responses.
 * In production, this would be replaced with actual external AI service calls.
 */
async function generateAIResponse(userMessage: string, agentType: AiAgentType): Promise<string> {
  // Simulate API call delay (remove in production)
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 400));
  
  // Extract key information from user message for more contextual responses
  const lowerMessage = userMessage.toLowerCase();
  
  switch (agentType) {
    case 'emotional_support':
      if (lowerMessage.includes('sad') || lowerMessage.includes('depressed') || lowerMessage.includes('down')) {
        return "我能感受到你现在情绪低落。这些感受是完全正常的，每个人都会有这样的时刻。记住，你并不孤单，而且这种感受是暂时的。你愿意分享一下是什么让你感到难过吗？💙";
      }
      if (lowerMessage.includes('anxious') || lowerMessage.includes('worried') || lowerMessage.includes('stress')) {
        return "焦虑和担心是很常见的情绪反应。让我们试着一起分析一下：深呼吸几次，专注于当下这一刻。你能告诉我具体是什么让你感到焦虑吗？我们可以一起找到应对的方法。🌸";
      }
      if (lowerMessage.includes('angry') || lowerMessage.includes('frustrated') || lowerMessage.includes('mad')) {
        return "愤怒是一种自然的情绪，它通常在我们感到不公平或受挫时出现。承认这种感受是健康的第一步。你能描述一下是什么触发了这种愤怒吗？让我们一起找到建设性的处理方式。🍃";
      }
      return "我理解你正在经历一些情感上的波动。无论你现在感受如何，请记住：你的感受都是有效的，你有权利感受它们。我在这里倾听和支持你。你想聊聊发生了什么吗？❤️";

    case 'psychology':
      if (lowerMessage.includes('behavior') || lowerMessage.includes('habit')) {
        return "从心理学角度来看，行为模式通常受到认知、情感和环境因素的共同影响。根据行为心理学理论，习惯的形成遵循「触发-行为-奖励」的循环。你提到的情况可能涉及条件反射或认知偏差。让我们深入分析一下具体的触发因素。";
      }
      if (lowerMessage.includes('memory') || lowerMessage.includes('forget')) {
        return "记忆是一个复杂的认知过程，涉及编码、存储和提取三个阶段。遗忘往往不是记忆的缺陷，而是大脑的保护机制。根据艾宾浩斯遗忘曲线，我们可以通过间隔重复和关联记忆来提高记忆效果。你具体在哪方面遇到了记忆问题？";
      }
      if (lowerMessage.includes('decision') || lowerMessage.includes('choice')) {
        return "决策心理学告诉我们，人类的决策过程既有理性分析，也有直觉判断。认知偏差如确认偏误、损失厌恶等会影响我们的选择。建议使用决策矩阵分析利弊，或者采用「10-10-10法则」：考虑10分钟、10个月、10年后的感受。";
      }
      return "从心理学视角来看，你描述的情况涉及认知、情感和行为的相互作用。人类心理的复杂性在于我们的思维模式、情绪反应和行为表现都会相互影响。让我们一起分析其中的心理机制，找到更好的应对策略。";

    case 'sociology':
      if (lowerMessage.includes('relationship') || lowerMessage.includes('social')) {
        return "从社会学角度分析，人际关系反映了社会结构和文化规范的影响。个体的社交行为受到社会角色期待、群体归属感和社会资本等因素塑造。现代社会的快节奏和数字化交流也在重新定义人际互动模式。你在社交方面遇到的挑战可能与这些宏观社会变迁有关。";
      }
      if (lowerMessage.includes('work') || lowerMessage.includes('career') || lowerMessage.includes('job')) {
        return "工作和职业发展深深嵌入在社会经济结构中。从社会学角度看，职业不仅是经济活动，更是社会身份和地位的重要标识。现代社会的职业分化、就业竞争和工作-生活平衡问题，都反映了更大的社会变革趋势。让我们分析一下你面临的职业挑战在社会背景中的位置。";
      }
      if (lowerMessage.includes('family') || lowerMessage.includes('parent')) {
        return "家庭作为社会的基本单位，其结构和功能在不断演变。现代家庭面临传统价值观与现代生活方式的碰撞，代际关系、性别角色、教育期望等都在发生变化。从社会学角度看，个体的家庭经历往往反映了更广泛的社会文化转型。";
      }
      return "你提到的情况体现了个体经验与社会结构的交互作用。社会学帮助我们理解个人困扰往往根源于更大的社会问题。通过分析社会制度、文化规范和群体动力，我们可以更好地理解和应对这些挑战。";

    case 'general_qa':
      if (lowerMessage.includes('weather') || lowerMessage.includes('天气')) {
        return "关于天气信息，我建议你查看权威的天气预报应用或网站，如中国天气网、天气通等。它们提供详细的温度、湿度、降水概率和空气质量信息。如果你需要特定地区的天气建议，请告诉我具体的城市名称。";
      }
      if (lowerMessage.includes('health') || lowerMessage.includes('健康')) {
        return "健康相关的问题建议咨询专业医生。不过我可以分享一些基本的健康建议：保持规律作息、均衡饮食、适量运动、充足睡眠。如果有具体的健康担忧，请及时就医。你有什么特定的健康问题想了解吗？";
      }
      if (lowerMessage.includes('technology') || lowerMessage.includes('科技')) {
        return "科技发展日新月异，从人工智能到量子计算，从5G到元宇宙，每个领域都在快速演进。如果你对某个具体的科技话题感兴趣，我很乐意和你深入探讨。你想了解哪个方面的科技知识？";
      }
      return "谢谢你的提问！我会根据你分享的信息尽力帮助解答。如果你需要更专业的建议，建议咨询相关领域的专家。你还有其他想了解的问题吗？";

    case 'meal_planning':
      if (lowerMessage.includes('breakfast') || lowerMessage.includes('早餐')) {
        return "早餐规划建议：\n🥣 主食：燕麦粥、全麦面包、杂粮包子\n🥚 蛋白质：鸡蛋、牛奶、豆浆、酸奶\n🍌 维生素：新鲜水果、蔬菜汁\n⏰ 时间安排：提前准备，15-20分钟完成\n\n你有特殊的饮食需求或偏好吗？比如素食、低糖、无麸质等？";
      }
      if (lowerMessage.includes('dinner') || lowerMessage.includes('晚餐')) {
        return "晚餐规划要点：\n🥗 清淡为主：避免过于油腻和辛辣\n🍚 碳水适量：粗粮搭配，控制分量\n🥬 多吃蔬菜：深色蔬菜，纤维丰富\n🐟 优质蛋白：鱼类、瘦肉、豆制品\n⏰ 时间控制：睡前2-3小时完成进食\n\n你平时几点吃晚餐？有什么不能吃的食物吗？";
      }
      if (lowerMessage.includes('weight') || lowerMessage.includes('减肥') || lowerMessage.includes('lose')) {
        return "健康减重饮食建议：\n📊 热量控制：创造合理的热量缺口（每日300-500卡）\n🍽 餐食搭配：蛋白质25%，碳水45%，脂肪30%\n⏰ 进食时间：规律三餐，避免夜宵\n💧 充足水分：每日8-10杯水\n🏃 配合运动：有氧+力量训练\n\n请告诉我你的身高、体重和目标，我可以制定更个性化的方案。";
      }
      return "为你制定个性化饮食计划，我需要了解：\n📝 基本信息：年龄、性别、身高、体重、活动量\n🎯 目标：增重、减重、维持、增肌等\n🚫 限制：过敏、疾病、饮食偏好\n⏰ 作息：工作时间、运动安排\n💰 预算：食材预算范围\n\n你可以分享这些信息，我来为你定制专属的饮食方案！🍽️";

    case 'travel_planning':
      if (lowerMessage.includes('japan') || lowerMessage.includes('日本')) {
        return "日本旅行规划建议：\n🗾 热门城市：东京、大阪、京都、奈良、北海道\n🌸 最佳时节：春季樱花(3-5月)、秋季红叶(9-11月)\n🚄 交通：JR Pass、地铁卡，新干线很方便\n🏠 住宿：温泉旅馆、商务酒店、胶囊旅馆\n🍱 美食：寿司、拉面、和牛、抹茶甜品\n💰 预算：每日500-1500元人民币\n\n你计划什么时候去？想体验哪些特色文化？";
      }
      if (lowerMessage.includes('europe') || lowerMessage.includes('欧洲')) {
        return "欧洲旅行规划要点：\n🏰 经典路线：法国-意大利-瑞士-德国\n🚂 交通：欧洲火车通票，城际交通便利\n📋 签证：申根签证，可游玩26个国家\n🏛 文化：博物馆、教堂、城堡、艺术馆\n💶 消费：西欧较贵，东欧相对便宜\n🎒 行程：建议15-30天，深度体验\n\n你偏好历史文化还是自然风光？预算大概多少？";
      }
      if (lowerMessage.includes('budget') || lowerMessage.includes('便宜') || lowerMessage.includes('省钱')) {
        return "省钱旅行攻略：\n✈️ 交通：提前订票、选择中转、淡季出行\n🏠 住宿：青旅、民宿、沙发客、胶囊旅馆\n🍜 餐饮：当地市场、路边摊、自己做饭\n🎫 景点：免费景点、city pass、学生票\n🛍 购物：奥特莱斯、退税、本地特产\n📱 通讯：当地电话卡、免费WiFi\n\n你的预算大概是多少？想去哪个地区？";
      }
      return "旅行规划服务开启！✈️\n\n我需要了解：\n📍 目的地：国内/国外，城市偏好\n📅 时间：出行日期、天数\n👥 人数：独行、情侣、家庭、朋友\n💰 预算：交通、住宿、餐饮、娱乐\n🎯 兴趣：自然风光、历史文化、美食体验、购物娱乐\n🚗 交通：飞机、火车、自驾游偏好\n\n分享这些信息，我来为你制定完美的行程计划！🗺️";

    default:
      return "感谢你的提问！我会尽力为你提供帮助。如果你需要更专业的建议，建议咨询相关领域的专家。你还有其他问题吗？";
  }
}
