/**
 * @file translate_all_cns.cjs
 * @description 将所有非中文cns字段翻译为中文并应用到QUEST_INFO.js
 * @returns {void}
 */

const fs = require('fs');
const path = require('path');

// 翻译映射表：英文原文 -> 中文翻译
const translationMap = {
  "[Knight Master] Karandur even wrote you a letter of introduction just to send you to me.": "[骑士大师] Karandur 甚至为你写了一封介绍信，专门送你来我这里。",
  "See the orbs scattered around Kaillun? Choose the one that draws you and bring it to me. I need to look into your past.": "看到凯伦周围散落的光球了吗？选择吸引你的那个，带来给我。我需要查看你的过去。",
  "Stay right where you are.\nIt's done. I need to rest now, so you may leave.": "站在那里别动。\n完成了。我现在需要休息，你可以离开了。",
  "The New Beginning": "全新的开始",
  "The ritual definitely worked. Take a bit more time to reflect on yourself, then come to me again.": "仪式确实奏效了。再花些时间反思自己，然后再来找我。",
  "Welcome, adventurer. Have you finally awakened?\nThis is my first time seeing a transcendent in person.": "欢迎，冒险者。你终于觉醒了吗？\n这是我第一次亲眼见到超越者。",
  "You say you haven't awakened, yet I can clearly sense your power.\nSo, what happened?": "你说你还没觉醒，但我能清楚地感受到你的力量。\n那么，发生了什么？",
  "Wisdom's Legacy": "智慧的传承",
  "She has dedicated her life to preserving knowledge, and this book deserves a place in her archives. If you deliver it to her, I'm sure she'll reward you well enough to take your next step… your first specialization. What do you say?": "她一生致力于保存知识，这本书应该在她的档案室中占有一席之地。如果你把它送给她，我相信她会给你丰厚的报酬，足以让你迈出下一步……你的第一次转职。你觉得如何？",
  "Thank you! I knew you would understand the importance of preserving knowledge. The historian will be thrilled to receive such a rare manuscript. Go, adventurer, and take this final step toward your destiny!": "谢谢你！我就知道你会理解保存知识的重要性。历史学家收到如此珍贵的手稿一定会非常高兴。去吧，冒险者，迈出通往你命运的最后一步！",
  "Oh… I see. That's unfortunate. This book holds so much wisdom, it would be a shame to let it go to waste. If you ever change your mind, please reconsider. This could be the final key to unlocking your future.": "哦……我明白了。真遗憾。这本书蕴含了太多智慧，浪费掉太可惜了。如果你改变主意了，请重新考虑。这可能是开启你未来的最后一把钥匙。",
  "Take this, consider it a token of my gratitude. With it, you should have everything you need to take the next step in your journey. May your path be filled with knowledge and greatness!": "收下这个，当作我的一点谢意。有了它，你应该拥有了一切所需的条件来迈出旅途的下一步。愿你的道路充满知识与荣耀！",
  "The book is still with you? Hmm… I don't mean to rush, but knowledge like this should not be kept hidden for too long. The historian is waiting, and so is your destiny. When you're ready, make sure it reaches the right hands.": "书还在你那里？嗯……我不是要催你，但这样的知识不应该藏太久。历史学家在等着，你的命运也是如此。准备好了的话，确保它送到对的人手中。",
  "Leave This to the Experts": "交给专家处理",
  "Meet [Elementor Master] Horison": "去见[元素大师] Horison",
  "So, is this your grand discovery?": "那么，这就是你的重大发现？",
  "She's an expert on ancient artifacts. Even if it doesn't help your awakening, at least it'll satisfy your curiosity.": "她是古代文物的专家。即使对你的觉醒没有帮助，至少能满足你的好奇心。",
  "There's plenty of time. Once you've handled your urgent matters, come back. I'll let them know in advance.": "时间还很充裕。处理完紧急事务后再回来吧。我会提前通知他们的。",
  "You have something to show me, and you're searching for clues about awakening?": "你有东西要给我看，而且在寻找关于觉醒的线索？",
  "Let me see the item first.": "先让我看看那件物品。",
  "What are you waiting for? She's expecting you.": "你还在等什么？她在等你。",
  "The Call of the Lawolf": "狼嚎的呼唤",
  "You know, adventurer, now that my spirits are lifted, I can finally get back to writing!": "你知道吗，冒险者，既然我精神好多了，终于可以继续写作了！",
  "The problem is, I don't know enough about them! Would you be willing to gather some information on these creatures for me?": "问题是，我对它们的了解还不够！你愿意帮我收集一些关于这些生物的信息吗？",
  "Oh… I see. That's disappointing, but I suppose I'll have to manage without it. I just hope my story won't end up being full of mistakes… If you change your mind, let me know!": "哦……我明白了。真令人失望，不过我想没有它我也能凑合。我只希望我的故事不会满是错误……如果你改变主意了，告诉我！",
  "Thank you, adventurer, you've been an invaluable help. Now, it's time to turn these notes into an unforgettable story!": "谢谢你，冒险者，你的帮助无可估量。现在，是时候把这些笔记变成一个令人难忘的故事了！",
  "Still no news on the Lawolfs? I don't mean to rush you, but I'm eager to continue my novel! The more I wait, the more my ideas fade… Please, if you have time, I'd really appreciate your help!": "还是没有狼嚎的消息吗？我不是要催你，但我急着继续写小说呢！等得越久，我的灵感就越淡……拜托了，如果你有时间，我真的很需要你的帮助！",
  "These days, my master is secretly building a tower. He should still be there.": "最近，我的师父在秘密建造一座塔。他应该还在那里。",
  "Show him my letter. He won't ignore it.": "把我的信给他看。他不会忽视的。",
  "Only a handful of people know I'm here. Who are you, and what do you want?": "只有极少数人知道我在这里。你是谁，想做什么？",
  "Reach level 140 and bring $QUEST_END_ITEM_COUNT$x $QUEST_END_ITEM_NAME$.": "达到140级并带来$QUEST_END_ITEM_COUNT$x $QUEST_END_ITEM_NAME$。",
  "Reach level 180 and bring $QUEST_END_ITEM_COUNT$x $QUEST_END_ITEM_NAME$.": "达到180级并带来$QUEST_END_ITEM_COUNT$x $QUEST_END_ITEM_NAME$。",
  "Rumor has it that the mayor of Flarine is eager to personally reward you for your recent achievement! You should definitely pay him a visit": "有传言说弗拉林市长很想亲自奖励你最近的成就！你一定要去拜访他",
  "That's awesome! Hurry and go see the mayor!": "太棒了！快去见市长吧！",
  "What do you mean, no?! You've already done everything.. You just need to claim your reward from the mayor of Flarine!": "什么意思，不去？！你已经做了一切……你只需要去弗拉林市长那里领取奖励就行了！",
  "Thanks to you, we finally have real hope to repel the darkness threatening Madrigal. You accomplished the impossible, where so many others would have failed.": "多亏了你，我们终于有了真正的希望来击退威胁马德里加尔的黑暗。你完成了不可能的事，而许多人都会失败的。",
  "Take this… It's a well-deserved reward. As the Mayor of Flaris, I thank you from the bottom of my heart for your courage and bravery!": "收下这个……这是你应得的奖励。作为弗拉里斯市长，我由衷感谢你的勇气和勇敢！",
  "Oh, you're back… but you still haven't told Sovann? This is monumental news... Herneos has been confirmed! Please, don't delay any longer. Sovann must hear this right away; the implications are too important to keep to ourselves!": "哦，你回来了……但你还没有告诉 Sovann？这是重大消息……Herneos 已被确认！请不要再拖延了。Sovann 必须立刻知道这件事；这太重要了，不能只让我们自己知道！",
  "To Awakening": "走向觉醒",
  "Meet [Assist Master] Maki.": "去见[辅助大师] Maki。",
  "Welcome, adventurer. I can sense great power within you.": "欢迎，冒险者。我能感受到你体内蕴含的强大力量。",
  "Oh ho… this is interesting. It seems your experiences are finally paying off.": "哦呵……这很有意思。看来你的经历终于有了回报。",
  "That power is the foundation of awakening as a transcendent being.": "那股力量是觉醒为超越者的基础。",
  "This is the first step toward something much greater. Why hesitate? If you change your mind, you know where to find me.": "这是迈向更伟大事物的第一步。为什么要犹豫？如果你改变主意，你知道去哪里找我。",
  "Long time no see, adventurer.": "好久不见，冒险者。",
  "You still haven't gone to see him? He's probably waiting impatiently.": "你还没去见他？他大概等得不耐烦了。",
  "Return to Dr. Estly": "回到 Estly 博士那里",
  "Now, go see Dr. Estly; he should have finished the analysis of the water by now. We're one step closer to uncovering the truth about Herneos!": "现在，去见 Estly 博士；他应该已经完成了水质分析。我们离揭开 Herneos 的真相又近了一步！",
  "Really? You're choosing not to follow up on this? Dr. Estly's analysis could be the key to understanding Herneos and possibly even stopping Shade. But if you won't go, we'll have to hope someone else steps up to the task.": "真的吗？你要选择不跟进这件事？Estly 博士的分析可能是理解 Herneos 甚至阻止 Shade 的关键。但如果你不去，我们只能指望别人来承担这个任务了。",
  "The analysis is complete, but... (annoyed look)": "分析完成了，但是……（不悦的表情）",
  "You haven't visited Dr. Estly yet? The analysis of the water might hold crucial answers about Herneos! Time is ticking, and we need that information to understand what Shade might be planning. Please, head to him as soon as possible.": "你还没去见 Estly 博士？水质分析可能包含关于 Herneos 的关键答案！时间紧迫，我们需要这些信息来了解 Shade 在计划什么。请尽快去找他。",
  "Reporting Back to Sovann": "向 Sovann 汇报",
  "Very well! You're truly dedicated to uncovering the mysteries of Herneos. Report back to Sovann with the details it's crucial he knows about Shade's forces. Thank you for stepping up; your bravery will be invaluable in this journey!": "很好！你确实致力于揭开 Herneos 的秘密。向 Sovann 汇报详情——他知道 Shade 的军队情况至关重要。感谢你挺身而出；你的勇敢在这段旅途中将无可替代！",
  "What?! You're turning back now? Reporting this information to Sovann is essential if we're to understand Shade's reach! But fine, if you're not willing… Just remember, this discovery could change everything. Don't let this chance slip by.": "什么？！你现在要折返？向 Sovann 汇报这些信息对于了解 Shade 的影响范围至关重要！但好吧，如果你不愿意……记住，这个发现可能改变一切。别让这个机会溜走了。",
  "Thank you for reporting back to me. If Shade is behind these creatures, we need to assess the situation carefully. Go now and prepare yourself I fear this may only be the beginning.": "感谢你回来向我汇报。如果 Shade 是这些生物的幕后主使，我们需要仔细评估局势。去吧，做好准备——我担心这可能只是开始。",
  "You didn't deliver the message yet? We need to be fully aware of what's happening in Herneos. Hurry back and let Sovann know what you encountered.": "你还没传达消息？我们需要全面了解 Herneos 发生了什么。赶快回去让 Sovann 知道你遇到了什么。",
  "The Final Battle for Herneos": "Herneos 的最终之战",
  "Kill $QUEST_END_KILL_NAME$ and return back to me.": "击杀$QUEST_END_KILL_NAME$然后回来找我。",
  "Now that you've weakened the boss by taking out the two generals of Shade's army, it would be wise for you to face her right hand before he regains his full power.": "既然你已经通过击败 Shade 军队的两名将军削弱了首领，在她右手恢复全部力量之前去面对他是明智之举。",
  "Me, go with you?!? (nervous laugh) Oh no, no… they always say not to change a winning team, and our way of teaming up is simply perfect, don't you think?": "我，跟你一起去？！？（紧张地笑）哦不不……常言道不要更换胜利的队伍，我们组队的方式简直完美，你不觉得吗？",
  "What?! You're refusing? After all we've done to get this far? This is the final step! If you don't finish this, Shade's influence will only grow stronger. But… if you won't go, we'll just have to hope someone else has the courage. I only hope it's not too late.": "什么？！你要拒绝？我们费了这么大力气才走到这一步？这是最后一步！如果你不完成它，Shade 的影响只会越来越强。但……如果你不去，只能指望别人有勇气了。我只希望不会太迟。",
  "You did it! You've defeated Shade's right hand! This is a monumental victory for Madrigal that will be remembered for ages. You've truly saved Herneos and brought hope back to our people.": "你做到了！你击败了 Shade 的右手！这是马德里加尔的一场重大胜利，将被铭记千古。你真的拯救了 Herneos，为我们的人民带回了希望。",
  "Yes, I heard everything from Radyon.": "是的，我从 Radyon 那里听说了所有事情。",
  "Why not dive in? You might find something unique and awaken your true potential.": "为何不试试呢？你可能会发现独特的东西，觉醒你真正的潜力。",
  "You should hurry. If others get there first, there might be nothing left to find.": "你应该快点。如果别人先到，可能什么都不剩了。",
  "Trophies from the Depths": "来自深处的战利品",
  "While I compare the results, could you bring me samples or souvenirs from each creature? That would allow me to enrich our archives on these strange appearances.": "在我比较结果的时候，你能给我带来每种生物的样本或纪念品吗？这样我就能丰富关于这些奇怪现象的档案。",
  "Really? You're refusing? (Sighs) I suppose not everyone appreciates the importance of history… But fine, go ahead just remember that these discoveries are rare. Who knows if you'll get another chance to contribute to our knowledge of Herneos.": "真的吗？你要拒绝？（叹气）我想不是每个人都重视历史的重要性……但好吧，去吧——只记得这些发现很珍贵。谁知道你还能不能有机会为我们对 Herneos 的认知做出贡献。",
  "Ohhh, thank you for these souvenirs! I can finally… continue my collection... uh, enrich the city archives! (clears throat) Yes, of course, the archives!": "哦哦哦，谢谢你带来这些纪念品！我终于可以……继续我的收藏……呃，丰富城市档案！（清嗓子）对，当然，是档案！",
  "Let's Find the Real Clue": "寻找真正的线索",
  "Kill $QUEST_END_KILL_COUNT$ $QUEST_END_KILL_NAME$s": "击杀$QUEST_END_KILL_COUNT$个$QUEST_END_KILL_NAME$",
  "Oh… this has nothing to do with awakening.": "哦……这跟觉醒没有关系。",
  "This is exactly the kind of thing the Strange Collector in Saint City loves. He'd be thrilled if you brought it to him.": "这正是圣城那位奇异收藏家喜欢的东西。如果你带给他，他一定会非常高兴。",
  "Now then… shall we speak about your awakening?": "那么……我们可以谈谈你的觉醒了吗？",
  "True strength awakens when you fight with your life on the line. It's always been that way.": "真正的力量在你拼上性命战斗时觉醒。一直都是这样。",
  "Well done. But you still haven't awakened? How strange…": "做得好。但你还没觉醒？真奇怪……",
  "You haven't finished yet? Hmm… I thought you'd be done by now.": "你还没完成？嗯……我以为你现在已经搞定了。",
  "Kill 50 Hundur Sharpfoots": "击杀50只洪都尔锐爪",
  "The Expedition Is…": "探险队是……",
  "Meet with [Expedition] Beck": "去见[探险队] Beck",
  "So now… you're heading back? That's something you'll need to report.": "那么现在……你要回去了？这件事你需要汇报。",
  "Well, returning can wait.": "嗯，回去的事可以等等。",
  "Oh, you're back. How was the village?": "哦，你回来了。村庄怎么样？",
  "Meet with Artin": "去见 Artin",
  "Only Myurang and adventurers live here, but I've caught a faint whiff of those wolf fiends. It was stronger near the southern outskirts. Maybe ask Artin? He's a skilled hunter—he might have noticed more.": "这里只有穆兰人和冒险者居住，但我闻到了那些狼妖的淡淡气味。在南郊那边味道更浓。也许去问问 Artin？他是个出色的猎人——可能注意到更多。",
  "Other than that? Hmm, let me think…": "除此之外？嗯，让我想想……",
  "Something strange lately? Hmm…": "最近有什么奇怪的事？嗯……",
  "The Ever-Turning Vicious Cycle of Blood": "永不停歇的血腥轮回",
  "The Lycans worship the demon Ankou as their god. The traitor must have made a deal, selling us out to fuel this war. To fully summon a demon, a great amount of blood is required.": "狼人族崇拜恶魔 Ankou 为神。叛徒一定做了交易，出卖我们来为这场战争提供燃料。要完全召唤恶魔，需要大量的鲜血。",
  "You are a hero of Muran. You must finish this. If this continues, the whole continent will be soaked in blood.": "你是穆兰的英雄。你必须结束这一切。如果继续下去，整个大陆都将被鲜血浸透。",
  "You've already done so much, but if I may, I'd like to ask you once more.": "你已经做了很多，但如果可以的话，我想再拜托你一次。",
  "So… you've come all the way here.": "所以……你一路来到了这里。",
  "Meet [Magician Master] Hee.": "去见[魔法大师] Hee。",
  "Meet [Psykeeper Master] Cylor": "去见[精神守护者大师] Cylor",
  "Meet with [Elder] Silar": "去见[长老] Silar",
  "We've been covering our tracks while retreating. There's no way the Lycans should've found us. We'll hold as long as we can. Please, report our situation to the elder.": "我们撤退时一直在掩盖踪迹。狼人族不该发现我们的。我们会坚持尽量久。请向长老汇报我们的情况。",
  "Please! We can't last much longer alone.": "求你了！我们独自支撑不了多久了。",
  "The Lycans… are they swarming again?": "狼人族……又在大举进攻了吗？",
  "We won't hold out for long.": "我们坚持不了多久了。",
  "Where Did the Expedition Go 1": "探险队去了哪里 1",
  "Search the forest and obtain \u201cUnknown Fur Ball\u201d": "搜索森林并取得\u201c未知毛球\u201d",
  "So, what brought you all the way here? Hmm… I don't remember seeing anything like that. I rarely leave the forest, so I wouldn't know.": "那么，是什么让你一路来到这里？嗯……我不记得见过那样的东西。我很少离开森林，所以我不会知道。",
  "Wait… yes, there were reports of several loud explosions from the east. I'm not sure if it's related, but do you want to check it out?": "等等……对，有报告说东边传来了几声巨大的爆炸。我不确定是否有关联，但你想去看看吗？",
  "You might find other clues elsewhere too. Don't worry if you want to follow your own leads.": "你可能在其他地方也会找到线索。如果你想按自己的线索走，不用担心。",
  "You should be fine, but stay careful.": "你应该没问题，但要小心。",
  "Thinking of all the chaos that traitor caused… honestly. Anyway, it seems your name has spread. A lot of people around the village have been asking to meet you. Once you're done with your own business, why not visit them?": "想到那个叛徒造成的混乱……真是的。总之，你的名声似乎传开了。村里很多人都在打听想见你。忙完自己的事之后，何不去看看他们？",
  "Of course, take care of your matters first.": "当然，先处理你的事情。",
  "Oh, so you've learned something about the natives? A book written by the village elder himself… May I see it? I see… very nice work. If you learn anything else, be sure to share it.": "哦，你了解到了关于原住民的事情？村长亲手写的书……可以让我看看吗？我看看……做得不错。如果你还了解到其他什么，一定要分享。",
  "The Gateway to Awakening": "觉醒之门",
  "Still, you have the potential to reach a whole new realm.": "不过，你有潜力达到一个全新的境界。",
  "[Ranger Master] Eliff even wrote you a letter of introduction just to send you to me.": "[游侠大师] Eliff 甚至为你写了一封介绍信，专门送你来我这里。",
  "Kill 50 Small Kyouchish": "击杀50只小红犬",
  "Small Kyouchish are getting out of control and causing trouble. We could really use your help cutting their numbers.": "小红犬越来越失控，制造了不少麻烦。我们真的需要你帮忙减少它们的数量。",
  "This should be no challenge for you.": "这对你来说应该不费吹灰之力。",
  "Kill 30 Captain Hundur Sharpfoots": "击杀30只洪都尔锐爪队长",
  "You already know how this works. No need for me to explain.": "你已经知道怎么做了。不需要我解释。",
  "Kill 15 Samosets": "击杀15只萨莫塞特",
  "We need to crush them before they attack the village. That's what matters.": "我们需要在它们攻击村庄之前粉碎它们。这才是关键。",
  "New Survivor of the Expedition? 1": "探险队的新幸存者？ 1",
  "Obtain a \u201cPitch-black Sphere\u201d": "取得一个\u201c漆黑球体\u201d",
  "Oh, adventurer, do you have a moment? You're looking for traces of the vanished expedition, right?": "哦，冒险者，有空吗？你在寻找失踪探险队的踪迹，对吧？",
  "While hunting, I found tracks that didn't belong to Myurang or Lycan. Interested?": "打猎的时候，我发现了一些不属于穆兰人或狼人的脚印。有兴趣吗？",
  "No worries. I'll keep a record of it, so come back whenever you want the location again.": "别担心。我会记录下来，想再知道位置的话随时回来。",
  "Well… that's not exactly what I saw, but…": "嗯……那跟我看到的不太一样，不过……",
  "Peace at Last?": "终于和平了？",
  "Meet with the Mayor of Saint City": "去见圣城市长",
  "Whatever the truth, you've saved this land from the demon and those filthy beasts. You have my deepest thanks. Trade with your continent? Of course. I fully support it. I'll guarantee free passage for anyone coming to our village. Take this approval token.": "无论真相如何，你拯救了这片土地，免受恶魔和那些肮脏野兽的侵害。我向你致以最深的谢意。与你们的大陆通商？当然。我完全支持。我会保证任何来我们村庄的人自由通行。拿上这个批准令牌。",
  "Still, some formalities must be followed, don't you think?": "不过，有些礼节还是要遵守的，你觉得呢？",
  "Kill 25 Kyouchish": "击杀25只红犬",
  "They're near the enemy camp.": "它们在敌方营地附近。",
  "Meet with Kaela": "去见 Kaela",
  "My parents sent you?": "我父母派你来的？",
  "Kill 50 Samosets": "击杀50只萨莫塞特",
  "Samosets have been swarming the grasslands lately, making patrols difficult. Could you thin them out a bit?": "萨莫塞特最近在草原上大量聚集，让巡逻变得困难。你能帮忙减少一些吗？",
  "Thank you. You know where to find them, don't you?": "谢谢。你知道去哪里找它们吧？",
  "This should be an easy job for you.": "这对你来说应该很轻松。",
  "Kill 50 Small Kanonicus": "击杀50只小型 Kanonicus",
  "You did a great job. Now I can finally tell everyone they're safe.": "你做得很好。现在我终于可以告诉大家安全了。",
  "You know where it is, don't you?": "你知道在哪里吧？",
  "Seeking the Witness… 2": "寻找目击者…… 2",
  "Meet with Inisis": "去见 Inisis",
  "There was no one on board, even when I searched it the first time. Not a single body. I checked around to see if there was anything useful, but all I found was a book full of strange codes. Curious what it says?": "船上没有人，即使我第一次搜查时也是。没有一具尸体。我四处检查看有没有什么有用的东西，但只找到一本满是奇怪代码的书。好奇上面写了什么吗？",
  "Not curious? Well, that's your choice.": "不好奇？嗯，那是你的选择。",
  "Kaillun Daily Quests": "凯伦日常任务",
  "Toward the Final Battle": "迈向最终之战",
  "Meet with [Elder] Ayr": "去见[长老] Ayr",
  "Leave the rest to us.": "剩下的交给我们。",
  "We can clean up what's left on our own.": "我们能自己处理剩下的。",
  "Welcome back, adventurer.": "欢迎回来，冒险者。",
  "[Blade Master] Corel even wrote you a letter of introduction just to send you to me.": "[刀锋大师] Corel 甚至为你写了一封介绍信，专门送你来我这里。",
  "Meet [Billposter Master] Ride": "去见[战斗大师] Ride",
  "To the Jarl": "去见族长",
  "Obtain \u201c???'s Serial Diary\u201d": "取得\u201c???的序列日记\u201d",
  "So, you're that adventurer. Thanks to you, the village is finally settling down. Because of that—or maybe because he suddenly has time—the jarl wants to meet you. I'll put in a good word, so go see him when you can.": "你就是那位冒险者啊。多亏了你，村庄终于安定了下来。正因为如此——也许是因为他突然有空了——族长想见你。我会帮你美言几句，有空就去见他吧。",
  "Well then, come back when you're free.": "那么，有空再回来吧。",
  "So, you're the adventurer I've heard so much about.": "你就是那位我听说过很多的冒险者。",
  "You still haven't gone? He may be an old man with little to do, but you should probably hurry.": "你还没去？他可能是个闲来无事的老人，但你最好还是快点。",
  "Meet [Acrobat Master] Pyre.": "去见[杂技大师] Pyre。",
  "You still haven't gone to see her? She's probably waiting impatiently.": "你还没去见她？她大概等得不耐烦了。",
  "Reunion 4": "重逢 4",
  "Meet with Taila": "去见 Taila",
  "Well, I think this will be your final visitor. Any guesses who?": "嗯，我想这会是你最后一位访客。猜猜是谁？",
  "Taila is next. Whatever happens, I have a feeling it will be something meaningful.": "下一位是 Taila。无论发生什么，我有一种感觉，这会是很有意义的事。",
  "Thanks to you, adventurer, I found my parents' hidden will. My father exposed the jarl's crimes, and my grandfather had him killed. Branded a traitor, he was nearly murdered. Please avenge them. Take this, and let it fuel your revenge.": "多亏了你，冒险者，我找到了父母隐藏的遗嘱。我父亲揭露了族长的罪行，而我祖父下令杀了他。他被扣上叛徒的罪名，差点被杀。请为他们复仇。拿着这个，让它助你复仇。",
  "Kill 1 Chief Keokuk and obtain \u201cChief Keokuk's Notebook\u201d": "击杀1名基奥库克首领并取得\u201c基奥库克首领的笔记本\u201d",
  "The Lycan forces keep growing, and their numbers make it hard to get close. I… lost sight of the target. This area is under Chief Keokuk's direct control, so getting any closer is almost impossible.": "狼人的兵力不断增加，他们的数量让人难以接近。我……跟丢了目标。这片区域在基奥库克首领的直接控制下，想要再靠近几乎不可能。",
  "The fact that the traitor went this far suggests they're more closely allied than we thought. In any case, we'll have to defeat this enemy to uncover any proof.": "叛徒走到这一步，说明他们的联盟比我们想象的更紧密。无论如何，我们必须击败这个敌人才能找到证据。",
  "Thank you. Once you secure evidence, I think you should return to the Elder.": "谢谢。一旦你拿到证据，我觉得你应该回到长老那里。",
  "This is the best plan I can think of. Do you have a better one?": "这是我能想到的最好计划。你有更好的吗？",
  "New Survivor of the Expedition? 2": "探险队的新幸存者？ 2",
  "No matter how I look at it, those tracks aren't ours, and they don't match those wolf fiends either.": "不管我怎么看，那些脚印不是我们的，也不像那些狼妖的。",
  "Was something like this among the expedition supplies?": "探险队的物资里有类似这样的东西吗？",
  "Obtain \u201cFragment of Scroll\u201d": "取得\u201c残卷碎片\u201d",
  "Magic disguises… I never thought they were real. Belia taught our children—who knows what would've happened if that Lycan had stayed hidden. Thank you. I'll report this to the elder.": "魔法伪装……我从没想到它们是真的。Belia 教了我们的孩子——谁知道那只狼人如果一直隐藏下去会发生什么。谢谢。我会向长老汇报这件事。",
  "What… I don't remember the past few days at all. Are you saying they did that to me? Adventurer, you saved me. Thank you so much.": "什么……我完全不记得过去几天的事了。你是说他们对我做了那种事？冒险者，你救了我。太感谢了。",
  "Meet with the Jarl": "去见族长",
  "The Lycans resisted fiercely, so the jarl has returned to town for now.": "狼人激烈反抗，族长暂时回到了镇上。",
  "Let's go back as well. I was ordered to wait here and report to you when you returned.": "我们也回去吧。我奉命在这里等你回来后向你汇报。",
  "The jarl? He's probably back at the town quarters.": "族长？他可能回到镇上的住所了。",
  "Meet [Knight Master] Karandur.": "去见[骑士大师] Karandur。",
  "What are you waiting for? He's expecting you.": "你还在等什么？他在等你。",
  "Searching for Parents 1": "寻找父母 1",
  "Obtain \u201c???'s Serial Chain\u201d": "取得\u201c???的序列链条\u201d",
  "My grandfather is the jarl, but my father was exiled and sent on a mission… he never returned. I fear they sent him to die. Please help me find his remains.": "我祖父是族长，但我父亲被流放并被派去执行任务……再也没有回来。我恐怕他们是派他去送死。请帮我找到他的遗骸。",
  "Meet with Belia": "去见 Belia",
  "Oh, the wolf scent? I'm used to it from the forest, but… now that you mention it, yeah, I've noticed it too. sniff Hmm… will you believe me?": "哦，狼的气味？我在森林里闻惯了，但……既然你提到了，是的，我也注意到了。嗅嗅 嗯……你会相信我吗？",
  "The Truth of the Expedition": "探险队的真相",
  "Meet with Helgar": "去见 Helgar",
  "Straggler": "掉队者",
  "Our captain didn't even check if everyone was on board before taking off. When the attack started, I just happened to be wasting time in the forest. Thanks to that, I survived.": "我们的船长起飞前甚至没有检查所有人是否都上了船。攻击开始时，我恰好在森林里消磨时间。多亏了这一点，我活了下来。",
  "Those creatures went that way!": "那些生物往那边走了！",
  "Meet [Ringmaster Master] Ellend": "去见[环术大师] Ellend",
  "Reignited Passion": "重燃的热情",
  "This time, we plan to send a scouting party before the main group. Would you be willing to be part of that team?": "这次，我们计划在主力出发前先派一支侦察队。你愿意成为这支队伍的一员吗？",
  "Welcome, adventurer.": "欢迎，冒险者。",
  "You know where the mayor is, right?": "你知道市长在哪里吧？",
  "The Truth": "真相",
  "Kill 10 Captain Kyouchish": "击杀10只红犬队长",
  "So… the others… I'm the only survivor… sniff… Are you going back to Saint City?": "所以……其他人……我是唯一的幸存者……抽泣……你要回圣城吗？",
  "Please tell them I'm alive. I'll join the second expedition when they arrive and return home. I don't want to stay in this land any longer. I know it's a lot to ask, but… could you avenge my fallen comrades before you leave for Madrigal?": "请告诉他们我还活着。第二批探险队到了之后我就加入他们一起回家。我不想再待在这片土地上了。我知道这个要求有点过分，但……你回马德里加尔之前能替我死去的战友报仇吗？",
  "Oh… I see. I guess it can't be helped. Never mind, then.": "哦……我明白了。没办法了。那就算了。",
  "The howl came from that direction. I doubt it went far.": "嚎叫声是从那边传来的。我猜它没跑远。",
  "New Beginning": "新的开始",
  "Obtain 4 different \u201cTorn Scrolls\u201d": "取得4张不同的\u201c残破卷轴\u201d",
  "So, how was the New Continent? And this… what is it? Hmm… a document I've never seen before. This alone isn't enough to understand it. Could you find more of these?": "那么，新大陆怎么样？还有这个……是什么？嗯……我从没见过的文献。光凭这个还不足以理解。你能找到更多吗？",
  "Sigh… I suppose there's no other choice.": "唉……我想没有别的选择了。",
  "The Gear Begins to Turn Again": "齿轮再次转动",
  "Meet with the Strange Collector": "去见奇异收藏家",
  "So that's how it was… What on earth happened to the crew of that ship? For now, let me examine this strange material.": "原来是这样……那艘船的船员到底发生了什么？目前，让我检查一下这种奇怪的材料。",
  "Well, if you change your mind, you can come back anytime.": "嗯，如果你改变主意了，随时都可以回来。",
  "Welcome back. How did it go? I knew it—my research wasn't wrong after all. I truly owe you. It's not much, but please accept this as my thanks. Things are going to get busy from here on…": "欢迎回来。怎么样？我就知道——我的研究毕竟没有错。我真的欠你一份人情。不多，但请收下这个作为我的谢意。接下来要忙起来了……",
  "Searching for Parents 2": "寻找父母 2",
  "Obtain \u201c???'s Diary\u201d": "取得\u201c???的日记\u201d",
  "Thank you so much. Anything you can find—no matter how small—would mean the world to me.": "太感谢了。你能找到的任何东西——无论多小——对我来说都意义非凡。",
  "This handwriting… it's definitely my father's. Thank you so much. It looks like he tried to write in code. I need to decode it right away.": "这字迹……绝对是我父亲的。太感谢了。看来他试图用密码书写。我需要马上破译它。",
  "There's really nothing else? Ah…": "真的没有别的了吗？啊……",
  "Meeting with Elders": "与长老会面",
  "Meet with [Elder] Melak": "去见[长老] Melak",
  "Oh? You want to know more about us?": "哦？你想更多了解我们？",
  "Then you should speak with the jarl or one of the elders. They've lived long and know our history well. However, it won't be easy for an outsider to meet the jarl. I'll introduce you to my superior, one of the elders. I'll tell him in advance so you can go straight to him.": "那你应该去和族长或其中一位长老谈谈。他们活得久，很了解我们的历史。不过，外人要见族长不容易。我会介绍你给我的上级，一位长老。我会提前告诉他，这样你就可以直接去找他。",
  "Well… you could try finding them on your own too.": "嗯……你也可以试着自己去找他们。",
  "So, you're the one the captain mentioned.": "你就是船长提到的那个人。",
  "The elder is busy, so if you want to meet him quickly, you should hurry.": "长老很忙，所以如果你想快点见到他，应该抓紧。",
  "[Billposter Master] Ride even wrote you a letter of introduction just to send you to me.": "[战斗大师] Ride 甚至为你写了一封介绍信，专门送你来我这里。",
  "Proficiency Test": "能力测试",
  "Kill 20 Hundur Sharpfoots": "击杀20只洪都尔锐爪",
  "Oy! Halt! Who are you? …That's quite a story. Suspicious. Are you a Lycan spy? If not, prove it.": "喂！站住！你是谁？……这故事还挺离谱的。可疑。你是狼人族的间谍吗？如果不是，证明一下。",
  "What? You can't even handle that? Pathetic. There's no way I can let you into the village like this.": "什么？连这都搞不定？真没用。我可不能就这样让你进村子。",
  "Reunion 3": "重逢 3",
  "Meet with Livia": "去见 Livia",
  "Now it's Livia's turn. I'm not sure what she has planned either, but I'm sure it'll be something special.": "现在轮到 Livia 了。我不确定她有什么计划，但我确信一定会是特别的事。",
  "There's no hurry. Go when you're ready.": "不急。准备好了再去。",
  "So in the end, that turned out to be something completely different… In any case, I can only imagine how much you've endured for us, even though we aren't of the same kind. This is just a small token of our gratitude. Please accept it.": "结果那完全是另一回事……无论如何，我能想象你为我们承受了多少，即使我们并非同类。这只是我们的一点心意。请收下。",
  "Kill 25 Small Samosets": "击杀25只小型萨莫塞特",
  "Kill 25 Small Samosets. That'll at least get us talking.": "击杀25只小型萨莫塞特。这样我们至少有话可说了。",
  "Meet with Rohan": "去见 Rohan",
  "Kill 30 Captain Samosets": "击杀30只萨莫塞特队长",
  "Those Captain Samosets keep slipping into the forest. Could you clear some of them out?": "那些萨莫塞特队长总是溜进森林。你能清理一些吗？",
  "We're grateful for your help. You know the area well enough to track them, right?": "感谢你的帮忙。你对这一带足够熟悉，能追踪到它们吧？",
  "This should be a simple task for you.": "这对你来说应该很轻松。",
  "This Is Nothing": "不值一提",
  "Kill 30 Small Taiahas": "击杀30只小型泰亚哈",
  "So, you've met everyone now? The Lycans are moving faster than we expected. I thought they'd need more time to regroup, but they're already organizing their forces.": "那么，你见过所有人了？狼人族的行动比我们预想的要快。我以为他们需要更多时间重整，但他们已经在集结兵力了。",
  "Thank you. I couldn't ask for a more reliable ally.": "谢谢。我找不到比你更可靠的盟友了。",
  "You've done wonderfully.": "你做得太好了。",
  "Searching for Clues… 1": "寻找线索…… 1",
  "Meet with Amadolka": "去见 Amadolka",
  "You haven't left yet?": "你还没走？",
  "Searching for Clues… 2": "寻找线索…… 2",
  "That sharp woman… How did she know to send you without me saying anything? Do you really need this?": "那个精明的女人……我没说什么她怎么知道派你来的？你真的需要这个吗？",
  "Sigh… Fine, take it. You can find it right next to me. I tried to analyze that material at Erons Factory, but I couldn't even figure out what it's made of.": "唉……好吧，拿去。就在我旁边就能找到。我试过在 Erons 工厂分析那种材料，但连它是用什么做的都搞不清楚。",
  "This logbook…!": "这本航海日志……！",
  "So I can keep this? Tch… the more I look at it, the more uneasy I feel. Just take it and go.": "我可以留着这个？啧……越看越觉得不安。拿走它走吧。",
  "Meet [Mercenary Master] Andy.": "去见[佣兵大师] Andy。",
  "Meet [Blade Master] Corel": "去见[刀锋大师] Corel",
  "Meet with [Captain] Baron": "去见[船长] Baron",
  "Thank you. I hope we meet again there soon.": "谢谢。希望我们很快能在那边再见。",
  "You know you're the only one suited for this. If you change your mind, let me know. I'll make it worth your while.": "你知道你是唯一适合做这件事的人。如果改变主意，告诉我。我会好好报答你。",
  "You're still here… When do you think you'll leave?": "你还在这里……你打算什么时候出发？",
  "Trapped in the Maze": "困在迷宫中",
  "Meet with the Mayor of Flarine": "去见弗拉林市长",
  "Well… I don't know much, but lately the mayor of Flaris has been visiting his house quite often. Why don't you try talking to Flarine?": "嗯……我知道的不多，但最近弗拉里斯市长经常去他家。你何不试着和弗拉林谈谈？",
  "You know the way, right?": "你知道路吧？",
  "You're the one asking, and yet… If it's nothing important, could you step aside?": "是你在问，然而……如果没什么重要的事，能让一下吗？",
  "That's all I know. Go see Flarine.": "我知道的就这些。去见弗拉林吧。",
  "Look at this Saint City logo. I thought I should let him know, so I brought it to him.": "看看这个圣城的标志。我觉得应该让他知道，所以带给他了。",
  "Wait… this is…! How did you get this?": "等等……这是……！你是怎么得到这个的？",
  "Meet [Ranger Master] Eliff": "去见[游侠大师] Eliff",
  "Territorial Cats": "领地猫",
  "Kill 11 Captain Hundur Sharpfoots and bring 1 Piece of Hundur Bone": "击杀11只洪都尔锐爪队长并带来1块洪都尔骨头",
  "That's still not enough to convince me. I don't even know who you really are. If you want to live alongside our village, you'll need to prove yourself with your strength. Then at least we can rely on each other.": "这还不够说服我。我甚至不知道你到底是谁。如果你想和我们村子住在一起，你需要用实力证明自己。这样至少我们可以互相依靠。",
  "Still not done? When exactly do you plan to enter the village?": "还没完成？你到底打算什么时候进村？",
  "Kill 50 Kyouchish": "击杀50只红犬",
  "Our guards are worn down dealing with Kyouchish. If you could defeat a few, it'd be a huge help.": "我们的守卫应对红犬已经筋疲力尽了。如果你能击退几只，那将是巨大的帮助。",
  "Thank you. You know how to find them, right?": "谢谢。你知道怎么找到它们吧？",
  "This should be simple work for someone of your skill.": "以你的实力，这应该很简单。",
  "Kill 30 Taiahas": "击杀30只泰亚哈",
  "That's reassuring.": "那我就放心了。",
  "Kill 5 Captain Kyouchish and obtain 1 \u201cLycan Orders\u201d": "击杀5只红犬队长并取得1份\u201c狼人命令\u201d",
  "Ugh, fine, whatever. Yeah, I've been hanging out with the wolves. The other kids here don't get me, and this village is doomed sooner or later. What's the point? If you want to drag me back, then deal with all my friends first.": "呃，好吧，随便吧。是的，我一直跟那些狼混在一起。这里其他孩子不理解我，这个村子迟早要完。有什么意义？如果你想把我拉回去，先解决我所有的朋友。",
  "Scout Party": "侦察队",
  "Thanks to what you brought back, I convinced the other investors, and we've decided to organize a second expedition. But considering the first expedition vanished and their ship crashed…": "多亏了你带回来的东西，我说服了其他投资者，我们决定组织第二次探险。但考虑到第一次探险队消失了，他们的船也坠毁了……",
  "No matter how I look at it, you're the only one fit for this job. I'll be waiting for your answer.": "不管怎么看，你是唯一适合这份工作的人。我会等你的答复。",
  "Meet [Jester Master] Lorein": "去见[弄臣大师] Lorein",
  "Prelude to the Counterattack": "反击的序曲",
  "Kill 40 Kanonicus": "击杀40只 Kanonicus",
  "Thanks to you, we were finally able to breathe. And those Lycans… they never imagined an adventurer would appear, so now they're on the back foot. This is our chance. Will you help us?": "多亏了你，我们终于能喘口气了。而那些狼人……他们万万没想到会出现一位冒险者，所以现在他们处于下风。这是我们的机会。你愿意帮忙吗？",
  "The enemy's gathering point is here.": "敌人的集合点在这里。",
  "Kill 30 Captain Kyouchish": "击杀30只红犬队长",
  "There are so many Captain Kyouchish around that I can't rest in peace. Could you take care of them?": "周围有太多红犬队长了，我不得安宁。你能处理一下吗？",
  "Thank you. I heard their howls coming from that way.": "谢谢。我听到它们的嚎叫从那边传来。",
  "You're the only one I can rely on.": "你是我唯一能依靠的人。",
  "Now I can finally rest easy until the next ship arrives. Thank you.": "现在我终于可以安心等到下一艘船来了。谢谢。",
  "What is Lifestyle?": "什么是生活方式？",
  "Welcome. There are times when you want to achieve different type of strengths. Do you wish to try something new that's not related to hunting monsters?": "欢迎。有时候你想获得不同类型的力量。你是否想尝试一些与猎杀怪物无关的新事物？",
  "Lost your chain again?": "又弄丢链条了？",
  "Kill 50 Small Hundur Sharpfoots and obtain 1 Abandoned Serial Number Chain": "击杀50只小型洪都尔锐爪并取得1条废弃编号链条",
  "Oh gods, thank you.": "天啊，谢谢你。",
  "Think of it as helping the dead, just this once… Please, I beg you.": "就当是帮死者一个忙，就这一次……求你了。",
  "There should have been at least a letter by now. My investors keep nagging me to take responsibility, but the mayor of Saint City, who invested the most, hasn't said a single word. Isn't it obvious he knows something? Could you ask him about the expedition for me?": "现在至少应该有封信了。我的投资者一直催我负责，但投资最多的圣城市长却一句话都没说。他显然知道什么吧？你能替我向他打听一下探险队的事吗？",
  "Thank you! You know where to find him.": "谢谢！你知道去哪里找他。",
  "Oh, a great adventurer. What brings you here?": "哦，伟大的冒险者。什么风把你吹来了？",
  "Where Is the Mole": "内鬼在哪里",
  "Thanks to you, life in the village—and even the war—has become a bit more manageable. I should answer your questions as thanks, but… I have one more thing to ask.": "多亏了你，村里的生活——甚至战争——都变得好应付了一些。作为感谢我应该回答你的问题，但……我还有一件事要拜托。",
  "We suspect there's a Lycan spy in a high position. Our operations keep getting sabotaged, and supplies for one squad were stolen. Can you investigate and, if possible, get them back?": "我们怀疑有一个身居高位的狼人间谍。我们的行动不断遭到破坏，一个小队的物资被偷了。你能调查一下，可能的话把物资夺回来吗？",
  "The last known location was here. If they're acting as they usually do, they shouldn't be far.": "最后已知的位置在这里。如果他们照常行动的话，应该走不远。",
  "There was? Then… did you find any trace of the expedition? My gods… what a disaster. At least there's one survivor. For now, we must keep this quiet.": "有？那么……你找到探险队的踪迹了吗？天啊……真是灾难。至少有一名幸存者。目前，我们必须保密。",
  "We can't hide it forever, of course, but if we reveal it now, everything we're planning will collapse. I'll make an official announcement when we begin recruiting for the second expedition. Did you meet the Strange Collector?": "当然，我们不可能永远隐瞒，但如果现在揭露，我们计划的一切都会崩塌。等我们开始招募第二批探险队时，我会正式宣布。你见过那位奇异收藏家了吗？",
  "You're back. Good. I can sense good news.": "你回来了。很好。我能感觉到好消息。",
  "New Town Life?": "新城镇生活？",
  "Welcome, stranger. You're now in Eillun Town, the refuge of the Myurangs. Wait, you defeated Captain Hundur Sharpfoot? Ah, so you fell for his trick. I only sent him out for training because he's always slacking off.": "欢迎，陌生人。你现在在艾伦镇，穆兰人的避难所。等等，你打败了洪都尔锐爪队长？啊，所以你中了他的计了。我派他出去训练只是因为他总是偷懒。",
  "You can find him over there. Go talk to him yourself.": "你可以在那边找到他。自己过去跟他谈吧。",
  "What will he ask you to do? No idea.": "他会让你做什么？不知道。",
  "Just know that without his approval, you won't be able to do much in this village.": "只要知道，没有他的批准，你在这个村子里做不了什么。",
  "You've done an incredible job.": "你做得非常出色。",
  "We can continue our talk afterwards.": "我们可以之后再谈。",
  "Meet with [Eillun Guard] Dreon": "去见[艾伦守卫] Dreon",
  "What is that man thinking…? He's always been suspicious.": "那个人在想什么……？他一直很可疑。",
  "No, outside…! A whole group of Lycan mages appeared out of nowhere.": "不，外面……！一整群狼人法师凭空出现了。",
  "Why aren't you checking the situation outside? What's going on?": "你为什么不去看看外面的情况？发生什么事了？",
  "Where Did the Expedition Go 2": "探险队去了哪里 2",
  "Kill 25 Small Kyouchish and get 1 Lycan Operation Plan": "击杀25只小型红犬并取得1份狼人作战计划",
  "This is Kyouchish fur. Kyouchish are elite Lycan warriors.": "这是红犬的毛。红犬是精英狼人战士。",
  "You remember the place, right?": "你记得那个地方吧？",
  "Reunion 1": "重逢 1",
  "Meet with [Eillun Guard] Gard": "去见[艾伦守卫] Gard",
  "Once things calm down, we're planning a counterattack. Would you help us again? Oh, and before that, some villagers have been looking for you. They want to thank you personally.": "等事情平息下来，我们计划发动反击。你愿意再帮我们一次吗？哦，在那之前，有些村民一直在找你。他们想亲自向你道谢。",
  "Why don't you visit [Eillun Guard] Gard first? I heard you helped him a lot—and he might be preparing something big for you.": "你何不先去见见[艾伦守卫] Gard？听说你帮了他很多——而且他可能在为你准备一份大礼。",
  "You've done more than enough, so don't feel pressured.": "你已经做得够多了，别有压力。",
  "You've worked incredibly hard. Every battle was tough, but I'm sure you'll bring us victory again. This isn't much, but please accept it.": "你辛苦了。每场战斗都很艰难，但我相信你会再次为我们带来胜利。这不算什么，但请收下。",
  "Trap": "陷阱",
  "Kill 20 Mage Redclouds": "击杀20只赤云法师",
  "Something has gone terribly wrong. We've clearly walked into a trap. The jarl may be shady, but he wouldn't abandon his own people… or would he? Where did the information leak?": "出大问题了。我们显然走进了一个陷阱。族长可能不太靠谱，但他不会抛弃自己的人……还是说他会？信息是从哪里泄露的？",
  "Thank you. We'll talk more after this is over.": "谢谢。等这件事结束我们再详谈。",
  "That's a relief. Thank you.": "那就放心了。谢谢。",
  "The elder should be waiting for you there.": "长老应该在那里等你。",
  "Who's there? Come out and identify yourself!": "谁在那里？出来报上名来！",
  "Pursuit": "追击",
  "Kill 10 Captain Kanonicus": "击杀10只 Kanonicus 队长",
  "Thanks to your work, we launched a surprise attack and sent them running. We even found some who couldn't keep up. Would you finish them off and send them to their gods?": "多亏了你的努力，我们发动了突袭，把他们打跑了。甚至还发现了一些掉队的。你能否了结他们，送他们去见他们的神？",
  "We're moving to chase down the main force.": "我们要去追击主力部队了。",
  "Oh, you did it?": "哦，你做到了？",
  "Perfect. We'll leave them to you and continue the pursuit.": "完美。我们把它们留给你，继续追击。",
  "Traitor": "叛徒",
  "Meet with [Eillun Scout] Merk": "去见[艾伦侦察兵] Merk",
  "Our operation was a success as well, but… some soldiers say they saw the jarl in the enemy's camp, retreating with them. Now their morale is shaken.": "我们的行动也成功了，但……一些士兵说他们在敌方阵营中看到了族长，跟他们一起撤退。现在士气动摇了。",
  "The soldiers will never fight at full strength while that traitor is free. You must track him down. There will be Lycans along his escape route, including Captain Taiaha, but I doubt they'll be a problem for you.": "只要那个叛徒还逍遥在外，士兵们就无法全力战斗。你必须追踪到他。他的逃跑路线上会有狼人，包括泰亚哈队长，但我猜对你来说不是问题。",
  "Thank you for your efforts, sir. I'm Merk, a scout ordered to track the traitor by the Elder.": "感谢你的努力，先生。我是 Merk，奉长老之命追踪叛徒的侦察兵。",
  "Mission Failed": "任务失败",
  "Kill 30 Small Mage Redclouds": "击杀30只小型赤云法师",
  "We need to regroup our forces, so… could you handle them in our place?": "我们需要重新集结兵力，所以……你能替我们去处理它们吗？",
  "Thank you. We'll wait for good news.": "谢谢。我们等你的好消息。",
  "Kill 10 Captain Samosets and bring 1 Piece of Samoset Bone": "击杀10只萨莫塞特队长并带来1块萨莫塞特骨头",
  "There are even more reinforcements gathering. Sadly, our troops are tied up elsewhere and can't handle them right now. This is the last task—teach them a lesson.": "还有更多援军在集结。遗憾的是，我们的部队被牵制在其他地方，暂时无法应对。这是最后一个任务——给他们点颜色看看。",
  "You'd better decide before they launch an attack.": "你最好在他们发动进攻之前做决定。",
  "Well done. I'll issue your residency permit.": "做得好。我会给你签发居住证。",
  "Still not finished? Hmm…": "还没完成？嗯……",
  "Kill [Elder] Traitus": "击杀[长老] Traitus",
  "We had reports that he left the village in a hurry, but… to think a village elder would betray us. It's tragic, but we don't have enough soldiers to both defend the village and track him. Could you do it?": "有报告说他匆忙离开了村庄，但……没想到一位村长会背叛我们。这很悲惨，但我们没有足够的士兵既守卫村庄又追踪他。你能做到吗？",
  "Right now, you're the only one who can move freely. We'll be waiting.": "目前，你是唯一能自由行动的人。我们会等着。",
  "You did well. Here, I've compiled what you were looking for. Take your time reading it—you'll learn plenty about our history.": "你做得好。来，我整理了你要找的东西。慢慢看吧——你会了解到很多关于我们的历史。",
  "We must make an example of this traitor, or the village won't be safe for long. Please, see it through.": "我们必须以此叛徒为戒，否则村庄不会安全太久。请务必完成。",
  "Kill 20 Captain Mage Redclouds": "击杀20只赤云法师队长",
  "Thinking about it… those Lycans are mages. They might have tracked us with some kind of magic. Or… maybe the jarl really did abandon us.": "想想看……那些狼人是法师。他们可能用某种魔法追踪了我们。或者……也许族长真的抛弃了我们。",
  "One of our scouts reported a pack of Lycans heading toward the village. Please go help defend it.": "我们的一名侦察兵报告说一群狼人正朝村庄进发。请去帮忙防守。",
  "We might not have much time left.": "我们可能没剩多少时间了。",
  "You arrived just in time. Without you, the village would have been in serious danger.": "你来得正是时候。没有你的话，村庄就危险了。",
  "W-What? I said I was wrong already. What now? You want me to read this?": "什-什么？我已经说我知道错了。现在又怎样？你要我读这个？",
  "What do you want now?": "你现在想怎样？",
  "\u201cFind a foolish child, play along, and turn them into a perfect puppet to sow chaos in the village.\u201d So I was just a piece in their stupid game…? Ugh… I can't believe I fell for it. You want me to go home and apologize to my parents? Tch, I already know that much.": "\u201c找一个愚蠢的孩子，顺水推舟，把他们变成完美的傀儡在村里制造混乱。\u201d所以我只是他们愚蠢游戏中的棋子……？呃……我真不敢相信我上当了。你要我回家向父母道歉？切，这我还用你说。",
  "Kill 50 Kanonicus": "击杀50只 Kanonicus",
  "What's wrong? Are you afraid now that you have to face a demon? It's too late for that.": "怎么了？面对恶魔就害怕了？现在害怕已经太迟了。",
  "What happened? Is Ankou defeated? The handwriting on this page… so the traitor is gone as well.": "发生了什么？Ankou 被击败了吗？这页上的字迹……那么叛徒也不在了。"
};

// 归一化函数：将弯引号统一为普通引号
function normalize(str) {
  return str
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"');
}

// 构建归一化后的翻译映射表（键也做相同归一化）
const normalizedMap = {};
for (const [key, val] of Object.entries(translationMap)) {
  normalizedMap[normalize(key)] = val;
}
// 保留原始映射表作为回退
Object.assign(normalizedMap, translationMap);

// 读取非中文cns条目
const nonChinesePath = path.join(__dirname, 'non_chinese_cns.json');
const items = JSON.parse(fs.readFileSync(nonChinesePath, 'utf-8'));
console.log(`待处理条目数: ${items.length}`);
console.log(`翻译映射表条目数: ${Object.keys(normalizedMap).length}`);

// 读取QUEST_INFO.js
const questInfoPath = path.join(__dirname, '..', 'src', 'data', 'QUEST_INFO.js');
let content = fs.readFileSync(questInfoPath, 'utf-8');
let lines = content.split('\n');

let appliedCount = 0;
let skippedCount = 0;
let notFoundCount = 0;
let failedCount = 0;

// cns字段正则
const cnsRegex = /['"]cns['"]\s*:\s*['"]((?:[^'"\\]|\\.)*)['"]/;

for (const item of items) {
  const lineIdx = item.line - 1; // 0-based
  if (lineIdx >= lines.length) {
    console.error(`行号超出范围: ${item.line}`);
    failedCount++;
    continue;
  }

  // 跳过"……"等纯标点
  if (item.value === '……' || item.value.trim() === '') {
    skippedCount++;
    continue;
  }

  // 查找翻译（将弯引号归一化为普通引号再匹配，保留省略号和破折号原样）
  const normalizedValue = item.value
    .replace(/[\u2018\u2019]/g, "'")  // ' ' -> '
    .replace(/[\u201C\u201D]/g, '"'); // " " -> "
  const translation = normalizedMap[normalizedValue] || normalizedMap[item.value];
  if (!translation) {
    console.error(`未找到翻译 [行${item.line}]: ${item.value.substring(0, 80)}`);
    notFoundCount++;
    continue;
  }

  const oldLine = lines[lineIdx];
  const match = oldLine.match(cnsRegex);
  if (!match) {
    console.error(`行${item.line}未找到cns字段: ${oldLine.substring(0, 80)}`);
    failedCount++;
    continue;
  }

  // 转义翻译文本中的单引号
  const escapedTranslation = translation.replace(/'/g, "\\'");

  // 构建新的cns值
  const newCnsValue = `'cns': '${escapedTranslation}'`;
  const newLine = oldLine.replace(cnsRegex, newCnsValue);

  if (newLine === oldLine) {
    console.error(`行${item.line}替换失败`);
    failedCount++;
    continue;
  }

  lines[lineIdx] = newLine;
  appliedCount++;
}

// 写回文件
content = lines.join('\n');
fs.writeFileSync(questInfoPath, content, 'utf-8');

console.log(`\n翻译应用完成:`);
console.log(`成功翻译: ${appliedCount} 条`);
console.log(`跳过(标点): ${skippedCount} 条`);
console.log(`未找到翻译: ${notFoundCount} 条`);
console.log(`失败: ${failedCount} 条`);
console.log(`已写入: ${questInfoPath}`);
