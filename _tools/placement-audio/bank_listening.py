# Listening scripts. Each line: (voice, text). Speed rises with level.
# Correct option written FIRST. Questions are shown before the recording plays (as in
# Cambridge/IELTS-style tests) and each recording can be played twice.

FULL_LISTENING = [
 dict(id='lA1', level='A1', title='A phone message', speed=0.88, b=0.0, lines=[
  ('bf_emma', "Hello, this is a message for Mr Jonas Berg. This is Sarah from Smile Dental Clinic. "
              "Your appointment is on Thursday at ten o'clock, but the dentist is not here on Thursday. "
              "Can you come on Friday at eleven o'clock? That's Friday at eleven. "
              "Please call us back on oh one six two, four nine three, eight eight five. Thank you. Goodbye."),
 ], questions=[
  ("Who is calling?", ["Someone from a dental clinic", "Mr Berg's doctor", "A friend of Mr Berg", "Someone from a hotel"]),
  ("When was the first appointment?", ["Thursday at 10:00", "Friday at 11:00", "Thursday at 11:00", "Friday at 10:00"]),
  ("What is the new appointment time?", ["Friday at 11:00", "Thursday at 10:00", "Friday at 10:00", "Monday at 11:00"]),
  ("What does Sarah ask Mr Berg to do?", ["Call the clinic back", "Send an email", "Come to the clinic today", "Call the dentist at home"]),
 ]),

 dict(id='lA2', level='A2', title='At the train station', speed=0.93, b=0.0, lines=[
  ('am_michael', "Hi. I'd like a ticket to Manchester, please."),
  ('bf_isabella', "Single or return?"),
  ('am_michael', "Return, please. I'm coming back on Sunday."),
  ('bf_isabella', "OK. The next train leaves at twenty past two, from platform six. It's forty-two pounds fifty."),
  ('am_michael', "Forty-two fifty? Is there anything cheaper?"),
  ('bf_isabella', "Well, if you take the three-fifteen train, it's only thirty pounds. But you have to change at Leeds."),
  ('am_michael', "That's fine. I'm not in a hurry. I'll take the three-fifteen."),
  ('bf_isabella', "Right. That train leaves from platform two. There's a café next to the platform if you want to wait there."),
  ('am_michael', "Great, thanks. Can I pay by card?"),
  ('bf_isabella', "Of course."),
 ], questions=[
  ("What kind of ticket does the man buy?", ["A return ticket", "A single ticket", "A weekly ticket", "A first-class ticket"]),
  ("How much does the man pay?", ["£30", "£42.50", "£24.50", "£15"]),
  ("Why is the man's ticket cheaper?", ["He has to change trains", "He is travelling on Sunday", "He is paying by card", "He is a student"]),
  ("Which platform does the man's train leave from?", ["Platform 2", "Platform 6", "Platform 3", "Platform 12"]),
 ]),

 dict(id='lB1', level='B1', title='A museum tour', speed=0.98, b=0.0, lines=[
  ('bm_george', "Good morning, everyone, and welcome to the City Science Museum. My name's Tom and I'll be your guide today. "
               "Before we start, just a few things. The tour takes about an hour and a half, and we'll finish in the space gallery on the top floor. "
               "Please don't touch the exhibits in the first two rooms, as some of them are over two hundred years old. "
               "In the space gallery, though, most things are interactive, so feel free to try everything there. "
               "You're welcome to take photos, but please switch off the flash. It can damage the older objects. "
               "Oh, and one more thing. The café on the ground floor is closed today for repairs, but you can get drinks and snacks from the machines next to the gift shop. "
               "Right, if you'd like to follow me, we'll begin with the history of clocks."),
 ], questions=[
  ("Where will the tour end?", ["In the space gallery", "In the gift shop", "In the clock room", "In the ground-floor café"]),
  ("Why should visitors not touch the objects in the first two rooms?", ["Some of them are very old", "They are going to be repaired", "They belong to another museum", "They are part of a new exhibition"]),
  ("What does the guide say about photographs?", ["They are allowed without flash", "They are only allowed upstairs", "They are not allowed at all", "They must be taken by the guide"]),
  ("Where can visitors buy something to drink today?", ["From the machines by the gift shop", "In the ground-floor café", "In the space gallery", "At the museum entrance"]),
 ]),

 dict(id='lB2', level='B2', title='A radio interview about sleep', speed=1.0, b=0.0, lines=[
  ('af_heart', "My guest today is Dr Martin Hale, who has spent fifteen years researching sleep. Dr Hale, we're always told we need eight hours a night. Is that true?"),
  ('bm_lewis', "Well, it's a useful average, but it's not a rule. Most adults need somewhere between seven and nine hours, and a small number genuinely manage well on less. "
               "What worries me more than the number is the regularity. People who go to bed at very different times each night often feel worse than people who sleep a bit less, but consistently."),
  ('af_heart', "So a lie-in at the weekend doesn't help us catch up?"),
  ('bm_lewis', "It helps a little, but it also shifts your body clock, which is why so many people feel terrible on Monday mornings. It's rather like giving yourself jet lag without leaving home."),
  ('af_heart', "And what about phones in the bedroom? Is the blue light really the problem?"),
  ('bm_lewis', "Interestingly, our research suggests the light itself is less important than people think. The bigger issue is what we're doing on the phone. "
               "Answering work emails or reading the news keeps the brain alert. Listening to calm music on the same device is far less harmful."),
  ('af_heart', "Any one piece of advice for our listeners?"),
  ('bm_lewis', "Get up at the same time every day, even at weekends. It sounds boring, but it's the single most effective change most people can make."),
 ], questions=[
  ("What does Dr Hale say about needing eight hours of sleep?", ["It is an average, not a fixed rule", "It is the minimum for every adult", "It is only true for young people", "It has recently been proved wrong"]),
  ("Why does Dr Hale compare a weekend lie-in to jet lag?", ["It changes the body clock", "It happens when people travel", "It makes people sleep too long", "It is common among older people"]),
  ("According to Dr Hale's research, what is the main problem with phones in the bedroom?", ["The activities people do on them", "The blue light from the screen", "The noise of notifications at night", "The time people spend charging them"]),
  ("What is Dr Hale's most important piece of advice?", ["Wake up at the same time every day", "Sleep for at least eight hours", "Never use a phone in the bedroom", "Go to bed earlier at weekends"]),
 ]),

 dict(id='lC1', level='C1', title='A lecture extract: the urban heat island', speed=1.05, b=0.0, lines=[
  ('bf_alice', "Last week we looked at how cities affect rainfall. Today I want to turn to temperature, and specifically to what's known as the urban heat island. "
               "On a still summer night, the centre of a large city can be as much as eight or nine degrees warmer than the surrounding countryside. "
               "Now, the usual explanation is that concrete and asphalt absorb heat during the day and release it slowly after dark, and that's certainly part of it. "
               "But I'd argue it's often overstated. Just as significant, and far easier to overlook, is the loss of vegetation. Trees don't simply provide shade; "
               "they release water vapour, which cools the air around them, rather in the way that sweating cools the body. "
               "Remove the trees, and you remove one of the city's natural air-conditioning systems. "
               "This matters because the policy responses differ enormously. If you believe the problem is mainly about building materials, you'll invest in reflective roofs and pale road surfaces, "
               "which are expensive and, frankly, only modestly effective. If, on the other hand, you take vegetation seriously, then planting trees along streets becomes one of the most cost-effective "
               "public health measures a city can take, particularly for older residents, who are by far the most vulnerable during heatwaves. "
               "I'm not suggesting reflective roofs are pointless, but I'd be wary of any city that relies on them alone."),
 ], questions=[
  ("What is the speaker's view of the usual explanation for urban heat islands?", ["It is partly correct but given too much importance", "It is completely wrong and should be ignored", "It is the only explanation supported by evidence", "It applies to rainfall rather than temperature"]),
  ("Why does the speaker mention sweating?", ["To explain how trees cool the air", "To show how heat affects older people", "To describe how buildings release heat", "To compare cities with the countryside"]),
  ("What does the speaker say about reflective roofs and pale roads?", ["They are costly and have limited effect", "They are the cheapest option available", "They work better than planting trees", "They are dangerous during heatwaves"]),
  ("Which statement best reflects the speaker's overall position?", ["Cities should prioritise trees rather than depend on materials alone", "Cities should stop using concrete and asphalt completely", "Cities cannot do anything to reduce night-time temperatures", "Cities should focus mainly on protecting their older buildings"]),
 ]),
]

DEMO_LISTENING = [
 dict(id='dlB1', level='B1', title='Planning a weekend trip', speed=0.98, b=0.0, lines=[
  ('bf_lily', "So, are we still going camping this weekend?"),
  ('am_adam', "I'd like to, but have you seen the weather forecast? It's going to rain all day on Saturday."),
  ('bf_lily', "Oh no. What about Sunday?"),
  ('am_adam', "Sunday looks much better. Sunny in the morning, a bit cloudy later."),
  ('bf_lily', "OK, so why don't we forget camping and just go for a day walk on Sunday? We could take the train to the lake."),
  ('am_adam', "Good idea. The train's cheaper than petrol anyway. There's one at eight fifteen."),
  ('bf_lily', "Eight fifteen on a Sunday? That's a bit early for me. Is there a later one?"),
  ('am_adam', "The next one's at nine forty-five."),
  ('bf_lily', "Perfect. I'll bring sandwiches if you bring something to drink."),
  ('am_adam', "Deal. I'll meet you at the station at half past nine."),
 ], questions=[
  ("Why do they change their plans?", ["The weather will be bad on Saturday", "The campsite is closed this weekend", "The train tickets are too expensive", "The woman has to work on Saturday"]),
  ("How will they travel to the lake?", ["By train", "By car", "By bus", "On foot"]),
  ("Which train will they take?", ["The 9:45", "The 8:15", "The 9:30", "The 8:45"]),
  ("What will the man bring?", ["Drinks", "Sandwiches", "A tent", "The train tickets"]),
 ]),

 dict(id='dlC1', level='C1', title='A podcast about language learning', speed=1.05, b=0.0, lines=[
  ('af_bella', "One of the most persistent myths I come across is that adults simply can't learn languages as well as children. "
               "There's a grain of truth in it: very few people who start as adults will ever sound exactly like a native speaker. "
               "But pronunciation is only one part of the picture. In controlled studies, adults often make faster progress than children in the early stages, "
               "precisely because they can understand explanations of grammar and apply strategies consciously. "
               "What adults tend to lack isn't ability; it's time, and, perhaps more importantly, a tolerance for sounding foolish. "
               "Children will happily repeat a new word ten times and get it wrong nine of them. Adults, on the whole, would rather stay silent than make a mistake in public. "
               "So if I had to give one piece of advice, it wouldn't be about apps or grammar books. It would be to find a setting where making mistakes feels safe, "
               "and then make as many of them as you possibly can."),
 ], questions=[
  ("What does the speaker accept about adults who learn a language?", ["Few will have a completely native-like accent", "Most will never become fluent speakers", "They find grammar harder than children do", "They learn more slowly in the early stages"]),
  ("According to the speaker, why do adults often progress quickly at first?", ["They can use grammar explanations consciously", "They have more free time than children", "They are less afraid of making mistakes", "They usually study with better materials"]),
  ("What does the speaker think holds many adults back?", ["Fear of looking foolish in front of others", "A lack of natural ability for languages", "Poor-quality apps and grammar books", "Having too many other responsibilities"]),
  ("What is the speaker's main advice?", ["Practise in a safe environment and accept mistakes", "Choose a good app rather than a grammar book", "Start learning a language as early as possible", "Repeat each new word at least ten times"]),
 ]),
]
