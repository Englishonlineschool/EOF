# EOF Placement Test for Schools — question bank.
# Two tests: JUNIOR (grades 5-7, Pre-A1 to B1) and TEENS (grades 8-11, A1 to C1),
# each with a Full and a Demo version. The demo uses different items from the full test.
#
# Convention: the CORRECT option is written FIRST. The build script stores options in a
# fixed shuffled order, and the test page shuffles them again for every student.
# 'pic' (optional) is a picture shown above a grammar item (emoji, drawn large).
# Listening items: 'lines' = [(voice, text)], 'speed' = Kokoro speed, 'pause' = gap (s)
# after each sentence, so lower levels stay slow and clear. Voices: af_/am_ American,
# bf_/bm_ British.

# =====================================================================================
# TEENS (grades 8-11)
# =====================================================================================
TEENS_GRAMMAR = [
 # A1
 dict(id='tg1', level='A1', prompt="My best friend ___ fourteen years old.", opts=["is", "are", "am", "be"]),
 dict(id='tg2', level='A1', prompt="We have Maths ___ Monday and Wednesday.", opts=["on", "in", "at", "to"]),
 dict(id='tg3', level='A1', prompt="___ your brother play football?", opts=["Does", "Do", "Is", "Are"]),
 dict(id='tg4', level='A1', prompt="The teacher writes on the board with a ___.", opts=["marker", "ruler", "schoolbag", "desk"]),
 dict(id='tg5', level='A1', prompt="There ___ thirty students in my class.", opts=["are", "is", "be", "has"]),
 # A2
 dict(id='tg6', level='A2', prompt="Yesterday we ___ a science test.", opts=["had", "have", "has", "having"]),
 dict(id='tg7', level='A2', prompt="My sister is ___ than me, but I'm taller.", opts=["older", "oldest", "more old", "the older"]),
 dict(id='tg8', level='A2', prompt="I can't play now. I ___ my homework.", opts=["'m doing", "do", "did", "does"]),
 dict(id='tg9', level='A2', prompt="You ___ use your phone during the exam. It's against the rules.", opts=["mustn't", "don't have to", "needn't", "can"]),
 dict(id='tg10', level='A2', prompt="Have you ever ___ sushi?", opts=["eaten", "ate", "eat", "eating"]),
 # B1
 dict(id='tg11', level='B1', prompt="If I ___ my exams, my parents will be really happy.", opts=["pass", "will pass", "passed", "would pass"]),
 dict(id='tg12', level='B1', prompt="Our school ___ in 1965.", opts=["was built", "built", "has built", "is building"]),
 dict(id='tg13', level='B1', prompt="I've been learning the guitar ___ three years.", opts=["for", "since", "during", "from"]),
 dict(id='tg14', level='B1', prompt="The new student asked me where I ___.", opts=["lived", "did I live", "do I live", "have I lived"]),
 dict(id='tg15', level='B1', prompt="I need to ___ up my mind about which club to join.", opts=["make", "do", "take", "have"]),
 # B2
 dict(id='tg16', level='B2', prompt="If I had studied harder, I ___ the test.", opts=["would have passed", "would pass", "had passed", "will have passed"]),
 dict(id='tg17', level='B2', prompt="By the time the bell rang, we ___ the experiment.", opts=["had finished", "have finished", "will finish", "are finishing"]),
 dict(id='tg18', level='B2', prompt="Our teacher made us ___ the essay again.", opts=["write", "to write", "writing", "written"]),
 dict(id='tg19', level='B2', prompt="Despite ___ tired, she went to basketball practice.", opts=["being", "she was", "be", "to be"]),
 dict(id='tg20', level='B2', prompt="Our class ___ money for the local animal shelter.", opts=["raised", "rose", "grew", "lifted"]),
 # C1
 dict(id='tg21', level='C1', prompt="Not only ___ the competition, but she also broke the national record.", opts=["did she win", "she won", "she did win", "won she"]),
 dict(id='tg22', level='C1', prompt="I'd rather you ___ my phone without asking.", opts=["didn't use", "don't use", "won't use", "not use"]),
 dict(id='tg23', level='C1', prompt="The results were ___ worse than we had expected.", opts=["considerably", "considerable", "consideration", "considerate"]),
 dict(id='tg24', level='C1', prompt="Had the bus been on time, we ___ the start of the film.", opts=["wouldn't have missed", "didn't miss", "hadn't missed", "won't have missed"]),
 dict(id='tg25', level='C1', prompt="The new rules ___ a lot of debate among students.", opts=["sparked", "lit", "fired", "burned"]),
]

TEENS_READING = [
 dict(id='trA1', level='A1', title="A message from Kenji", passage=
"""Hi Daria,

How are you? I'm at my new school now. It's very big! There are 900 students. My class is 8B and my teacher is Mr Lee. He teaches English and he is very funny.

School starts at eight o'clock and finishes at three. At lunchtime I play basketball with my new friends, Omar and Ben. On Thursdays I have art club. I love it!

The food in the canteen is OK, but I bring sandwiches from home.

Write soon!
Kenji""", qs=[
  ("How many students are there at Kenji's school?", ["900", "800", "300", "90"]),
  ("Who is Mr Lee?", ["Kenji's English teacher", "Kenji's new friend", "The head teacher", "The art club teacher"]),
  ("What does Kenji do at lunchtime?", ["He plays basketball", "He goes to art club", "He goes home", "He reads in the library"]),
  ("What does Kenji usually eat for lunch?", ["Sandwiches from home", "Food from the canteen", "Pizza with Omar", "Fruit from the shop"]),
 ]),
 dict(id='trA2', level='A2', title="Notice: School Science Fair", passage=
"""GREENFIELD SCHOOL SCIENCE FAIR
Friday 14 March, 2 p.m. – 5 p.m., Sports Hall

Do you have a great science idea? Show it at this year's Science Fair! Students from Grades 7 to 11 can take part, alone or in teams of up to three.

• Tell Ms Novak about your project by 28 February.
• Your project must fit on one table.
• You can't use fire or dangerous chemicals.

Parents and families are welcome to visit from 3 p.m. The best three projects will win a trip to the City Science Museum, and every student who takes part will get a certificate.

Questions? Visit Room 12 at lunchtime.""", qs=[
  ("Who can take part in the Science Fair?", ["Students in Grades 7 to 11", "Only students in Grade 11", "Students and their parents", "Teams of five students"]),
  ("What must students do by 28 February?", ["Tell Ms Novak about their project", "Bring their project to the Sports Hall", "Buy a ticket for the museum", "Find two team members"]),
  ("When can families visit the fair?", ["From 3 p.m.", "From 2 p.m.", "Only at lunchtime", "After 5 p.m."]),
  ("What will every student who takes part receive?", ["A certificate", "A trip to the museum", "A science book", "A prize from Ms Novak"]),
 ]),
 dict(id='trB1', level='B1', title="The school Repair Café", passage=
"""When sixteen-year-old Amira Hasan's laptop stopped working last year, the shop told her it would cost more to repair it than to buy a new one. "I just couldn't believe it," she says. "Only one small part was broken." With help from an online video and her uncle's tools, she fixed it herself in an afternoon.

That experience gave her an idea. In September, Amira and two friends started a "Repair Café" at their school. Every Wednesday after classes, students and teachers bring broken things – headphones, bikes, phone chargers, even a toaster – and the team tries to fix them for free. The physics teacher, Mr Clarke, checks that everything is safe, but the students do the actual repairs.

Not everything can be saved. "We fix about two out of three things," says Amira. "When we can't, we explain why, and people usually learn something anyway."

The café has become so popular that two other schools in the city want to copy the idea. Amira is pleased about that, but she says the best thing is something else: "Our school throws away much less rubbish since we started. That was the real point." """, qs=[
  ("Why did Amira repair her laptop herself?", ["A repair would cost more than a new laptop", "The shop could not find the broken part", "Her uncle refused to help her", "She wanted to make an online video"]),
  ("What is Mr Clarke's role in the Repair Café?", ["He makes sure the repairs are safe", "He does the most difficult repairs", "He started the café with Amira", "He pays for the tools and parts"]),
  ("What happens when the team cannot fix something?", ["They explain the reason to the owner", "They buy the owner a new one", "They send it to a repair shop", "They keep it to use for parts"]),
  ("According to Amira, what is the most important result of the café?", ["The school produces less rubbish", "Other schools want to copy it", "Students save a lot of money", "She has learned new skills"]),
 ]),
 dict(id='trB2', level='B2', title="Is homework worth it?", passage=
"""Few school traditions provoke as much argument as homework. For many parents, an evening at the kitchen table is simply part of growing up; for many teenagers, it is the main reason they feel tired and stressed. So what does the research actually say?

The answer, perhaps unsurprisingly, is that it depends. Studies of secondary school students generally find a modest link between homework and achievement, but the benefits appear to level off after about an hour and a half a night. Beyond that point, extra hours seem to add little to students' results while taking time away from sleep, sport and friends – all of which play their own part in learning.

The type of homework matters at least as much as the amount. Tasks that ask students to practise something they have just learned, or to prepare for the next lesson, tend to be more useful than work set simply because the timetable says homework is due. Several teachers interviewed for this article admitted that they had sometimes set homework mainly to satisfy parents, who might otherwise assume nothing was being done.

Rather than abolishing homework, then, the evidence points towards setting less of it, but with a clearer purpose. Some schools have already moved in that direction, replacing daily worksheets with a single weekly project. Early reports suggest that students complete these more carefully, perhaps because they can see why they are doing them.""", qs=[
  ("What does the research say about the amount of homework?", ["More than about 90 minutes a night adds little benefit", "Students should do at least two hours every night", "Homework has no effect on students' results", "The more homework students do, the better their grades"]),
  ("Why does the writer mention sleep, sport and friends?", ["They also contribute to learning", "They are the main causes of stress", "They matter more than school", "They help students finish homework faster"]),
  ("What did some teachers admit?", ["They had set homework partly to please parents", "They never check their students' homework", "They prefer weekly projects to worksheets", "They think homework should be abolished"]),
  ("What is the writer's conclusion?", ["Homework should be reduced and given a clearer purpose", "Homework should be banned in secondary schools", "Parents should decide how much homework is set", "Students should choose their own homework"]),
 ]),
 dict(id='trC1', level='C1', title="The science of the teenage body clock", passage=
"""Ask any secondary school teacher about their first lesson of the day and you are likely to hear a familiar complaint: rows of students who seem physically present but mentally elsewhere. It is tempting to blame late-night gaming or endless scrolling, and screens undoubtedly play a part. Yet a substantial body of research suggests that something more fundamental is going on.

During adolescence, the body's internal clock shifts later. Melatonin, the hormone that signals to the brain that it is time to sleep, is released up to two hours later than in younger children or adults. A fifteen-year-old who struggles to fall asleep before midnight is therefore not necessarily being undisciplined; in many cases, their biology is simply running on a different schedule. Since most teenagers still need between eight and ten hours of sleep, an eight o'clock start leaves many of them chronically short of rest.

Some education authorities have responded by moving school start times later, and the results have been striking. Studies in several countries have reported improvements in attendance, mood and, in some cases, exam results. Critics point out, reasonably enough, that later starts create practical difficulties for families and transport systems, and that teenagers may simply stay up later to compensate. The evidence on this last point, however, is reassuring: in most studies, bedtimes changed little, while total sleep increased.

None of this means that individual habits are irrelevant. But it does suggest that lecturing teenagers about willpower is unlikely to solve a problem that is, at least in part, written into their biology.""", qs=[
  ("What is the writer's view of screens as the cause of tired students?", ["They play a part but do not fully explain the problem", "They are the main reason students are tired", "They have no effect on teenagers' sleep", "They matter more than school start times"]),
  ("Why might a fifteen-year-old find it hard to sleep before midnight?", ["Their body releases melatonin later", "They need less sleep than adults", "They are naturally undisciplined", "They have too much homework"]),
  ("What does the writer say about the worry that teenagers would go to bed later?", ["Research suggests it rarely happens", "It is the main reason schools have not changed", "It has been proved correct in most countries", "It causes problems for families and transport"]),
  ("What does the final paragraph suggest?", ["Telling teenagers to try harder will not solve the problem alone", "Personal habits have no effect on sleep", "Schools should ban phones before bedtime", "Teenagers should choose their own start times"]),
 ]),
]

TEENS_LISTENING = [
 dict(id='tlA1', level='A1', title="A voice message from a friend", speed=0.8, pause=1.15, lines=[
  ('am_puck', "Hi Sofia, it's Daniel. Do you want to come to the cinema with me and Leo on Saturday? "
              "The film starts at four o'clock. Let's meet outside the cinema at half past three. "
              "It's on Park Street, next to the big bookshop. The tickets are six pounds. "
              "Oh, and bring your student card, because it's cheaper with a student card. "
              "Call me tonight. Bye!"),
 ], qs=[
  ("When does the film start?", ["At 4:00", "At 3:30", "At 3:00", "At 6:00"]),
  ("Where will they meet?", ["Outside the cinema", "In the bookshop", "At Leo's house", "At the bus stop"]),
  ("What should Sofia bring?", ["Her student card", "Some snacks", "A book", "Her camera"]),
  ("What does Daniel want Sofia to do tonight?", ["Call him", "Buy the tickets", "Meet Leo", "Send him a message"]),
 ]),
 dict(id='tlA2', level='A2', title="Choosing an after-school club", speed=0.86, pause=0.7, lines=[
  ('bf_emma', "Hey Max, have you chosen an after-school club yet? We have to decide by Friday."),
  ('am_puck', "Not yet. I wanted to do football, but it's on Tuesdays, and I have piano lessons then."),
  ('bf_emma', "What about the drama club? It's on Thursdays, and they're doing a musical this year."),
  ('am_puck', "Hmm. I'm not very good at acting. What are you doing?"),
  ('bf_emma', "I'm going to join the photography club. It's on Wednesdays, from four to five. And you don't need a camera. The school lends you one."),
  ('am_puck', "Really? That sounds good. My phone camera is terrible anyway."),
  ('bf_emma', "And at the end of the year, there's an exhibition in the school hall."),
  ('am_puck', "OK, I'll come with you. Who's the teacher?"),
  ('bf_emma', "Mr Patel. He's really nice."),
 ], qs=[
  ("Why can't Max join the football club?", ["He has piano lessons on Tuesdays", "He isn't good at football", "The club is full", "It's on Fridays"]),
  ("Why doesn't Max want to join the drama club?", ["He doesn't think he can act well", "It's on Wednesdays", "He doesn't like musicals", "His friends aren't in it"]),
  ("What does the girl say about cameras?", ["The school lends them to students", "Students must bring their own camera", "Students can only use their phones", "Cameras are very expensive"]),
  ("What happens at the end of the year?", ["There is an exhibition", "There is a musical", "There is a football match", "There is a trip with Mr Patel"]),
 ]),
 dict(id='tlB1', level='B1', title="An announcement about the school trip", speed=0.86, pause=0.75, lines=[
  ('bf_isabella', "Good morning, Grade 9. This is Ms Turner with some important news about next Friday's trip to the Natural History Museum. "
                "First of all, there's been a change of plan. The coach will now leave at eight fifteen, not eight thirty, because of roadworks on the motorway, "
                "so please be in the school car park by eight o'clock at the latest. We'll be back at school at about four. "
                "You don't need to bring money for the entrance, as the school has already paid, but you will need a packed lunch, "
                "because the museum café will be closed for a private event. "
                "Please wear your school uniform, and comfortable shoes, as we'll be walking a lot. "
                "Finally, if you haven't returned your permission form yet, you must give it to your form tutor by Wednesday. "
                "Students without a signed form won't be able to come. Thank you."),
 ], qs=[
  ("Why will the coach leave earlier?", ["There are roadworks on the motorway", "The museum opens earlier", "The museum café is closed", "Students must be back by four"]),
  ("What time should students arrive at school?", ["By 8:00", "By 8:15", "By 8:30", "By 4:00"]),
  ("Why do students need a packed lunch?", ["The museum café will be closed", "Food at the museum is expensive", "The school has not paid for lunch", "They will eat on the coach"]),
  ("What will happen if a student doesn't return the form by Wednesday?", ["They won't be able to go on the trip", "They will have to pay for the entrance", "Their parents will get a phone call", "They will have to wear their uniform"]),
 ]),
 dict(id='tlB2', level='B2', title="A podcast interview: the teenage app designer", speed=1.0, pause=0.14, lines=[
  ('am_michael', "Today on Young Minds I'm talking to Ella Morgan, who's seventeen and has just won a national award for an app she designed. Ella, congratulations. What does the app actually do?"),
  ('af_heart', "Thanks! It's called StudyBuddy, and basically it helps students plan their revision. You put in your exam dates and the topics you find difficult, and it builds a timetable for you. "
               "But the main thing is that it changes the plan if you fall behind, so you don't just give up after a bad week."),
  ('am_michael', "Where did the idea come from?"),
  ('af_heart', "Honestly, from my own mistakes. Before my exams last year, I made a beautiful revision timetable, with different colours and everything, and then I completely ignored it. "
               "I realised the problem wasn't making a plan. It was sticking to it when things went wrong."),
  ('am_michael', "And you taught yourself to code?"),
  ('af_heart', "Mostly, yes. I did a free online course, and my computer science teacher helped me whenever I got stuck. That was really important, actually. I nearly gave up twice."),
  ('am_michael', "So what's next for you?"),
  ('af_heart', "I'm going to study computer science at university. But first, I want to make the app work better for students with dyslexia, because a few users have told me the screens are hard to read. "
               "I think that's more important than adding new features."),
 ], qs=[
  ("What makes Ella's app different from a normal revision timetable?", ["It changes the plan when students fall behind", "It uses lots of different colours", "It chooses exam dates for students", "It teaches students how to code"]),
  ("What problem did Ella have last year?", ["She didn't follow the plan she had made", "She couldn't make a revision plan", "She failed her computer science exam", "She had no time to study at all"]),
  ("What does Ella say about her computer science teacher?", ["The teacher helped whenever she had a problem", "The teacher taught her everything she knows", "The teacher told her to give up the app", "The teacher gave her the idea for the app"]),
  ("What is Ella's next priority for the app?", ["Making it easier to read for students with dyslexia", "Adding new features for users", "Selling it to universities", "Translating it into other languages"]),
 ]),
 dict(id='tlC1', level='C1', title="A talk: why cramming doesn't work", speed=1.02, pause=0.14, lines=[
  ('af_bella', "Let me start with a confession. The night before my own final exams, I stayed up until three in the morning, reading my notes over and over again. "
               "I felt incredibly productive, and I passed. But if you'd asked me a month later what I'd learned, I'd have struggled to tell you very much at all. "
               "That experience is surprisingly typical, and psychologists have a good explanation for it. "
               "When we reread the same material many times in one session, it starts to feel familiar, and we mistake that sense of familiarity for genuine understanding. "
               "The information is in short-term memory, which is why it can survive until the next morning's exam, but very little of it is consolidated into long-term memory. "
               "The alternative is what researchers call spaced practice: returning to the same material several times over days or weeks, with gaps in between. "
               "Counter-intuitively, the gaps are the point. Each time you return to something you have partly forgotten, your brain has to work harder to retrieve it, "
               "and that effort is precisely what makes the memory last. "
               "The frustrating thing is that spaced practice feels less effective while you're doing it. You notice how much you've forgotten, which is uncomfortable. "
               "Cramming, by contrast, feels great. So if there's one message I'd like you to take away, it's this. "
               "When it comes to learning, the feeling of progress and actual progress are often two very different things."),
 ], qs=[
  ("Why does the speaker mention her own exams?", ["To show that passing doesn't mean long-term learning", "To prove that cramming never works", "To explain why she studied psychology", "To show how difficult her exams were"]),
  ("According to the speaker, why does rereading feel effective?", ["Familiarity is mistaken for understanding", "It moves information into long-term memory", "It helps students sleep better", "Psychologists recommend it"]),
  ("Why are the gaps in spaced practice important?", ["Recalling half-forgotten material strengthens memory", "They give students time to relax", "They stop students getting bored", "They let students cover more topics"]),
  ("What is the speaker's main message?", ["Feeling that you are learning is not the same as learning", "Students should never study the night before an exam", "Spaced practice feels more comfortable than cramming", "Short-term memory is more useful than people think"]),
 ]),
]

# ---- Teens demo (different items) ----
TEENS_DEMO_GRAMMAR = [
 dict(id='dtg1', level='A1', prompt="Where ___ you from?", opts=["are", "is", "do", "am"]),
 dict(id='dtg2', level='A1', prompt="My brother and I ___ to school by bus.", opts=["go", "goes", "going", "is going"]),
 dict(id='dtg3', level='A2', prompt="There isn't ___ milk in the fridge.", opts=["any", "some", "many", "a"]),
 dict(id='dtg4', level='A2', prompt="When I was younger, I ___ swim.", opts=["couldn't", "can't", "don't", "wasn't"]),
 dict(id='dtg5', level='A2', prompt="This is ___ book I've ever read!", opts=["the best", "the better", "best", "better"]),
 dict(id='dtg6', level='B1', prompt="I wish I ___ more free time.", opts=["had", "have", "will have", "am having"]),
 dict(id='dtg7', level='B1', prompt="The film was ___ boring that we left early.", opts=["so", "such", "too", "very"]),
 dict(id='dtg8', level='B1', prompt="He's the boy ___ won the chess tournament.", opts=["who", "which", "whose", "what"]),
 dict(id='dtg9', level='B2', prompt="She suggested ___ a study group before the exams.", opts=["starting", "to start", "start", "we starting"]),
 dict(id='dtg10', level='B2', prompt="I'm used to ___ early for swimming training.", opts=["getting up", "get up", "got up", "be getting up"]),
 dict(id='dtg11', level='C1', prompt="Little ___ that the exam had been cancelled.", opts=["did we know", "we knew", "knew we", "we did know"]),
 dict(id='dtg12', level='C1', prompt="The school decided to ___ the new timetable gradually.", opts=["phase in", "put down", "set off", "take after"]),
]
TEENS_DEMO_READING = [
 dict(id='dtrA2', level='A2', title="A message from the swimming coach", passage=
"""Hi everyone,

Great job at the competition on Saturday! Our team came second out of eight schools, and Lucy won a gold medal in the 100 metres.

Next week, training will be on Monday and Thursday as usual, but it will start at 5 p.m. instead of 4 p.m., because the pool is closed for cleaning in the afternoon. Please don't be late.

Also, someone left a blue towel and a pair of goggles in the changing room. If they're yours, ask at the reception desk.

See you next week!
Coach Ana""", qs=[
  ("How did the team do at the competition?", ["They came second", "They came first", "They came eighth", "They didn't finish"]),
  ("Why will training start later next week?", ["The pool is being cleaned", "The coach is busy", "There is another competition", "The reception is closed"]),
  ("What time does training usually start?", ["4 p.m.", "5 p.m.", "6 p.m.", "8 a.m."]),
  ("What should you do if you lost your goggles?", ["Ask at the reception desk", "Email Coach Ana", "Look in the pool", "Come to training early"]),
 ]),
 dict(id='dtrB2', level='B2', title="Gap years: time out or time wasted?", passage=
"""For many school leavers, the idea of taking a year off before university is appealing: a chance to travel, earn some money or simply recover from years of exams. Critics, however, warn that a gap year can easily turn into twelve months of sleeping late and scrolling through social media.

University admissions staff tend to take a more balanced view. Most say a gap year neither helps nor harms an application in itself; what matters is what students do with it. Volunteering, part-time work or learning a new skill can all strengthen an application, particularly if the applicant can explain what they gained from the experience. A year with no clear plan, on the other hand, is unlikely to impress anyone.

There is also some evidence that students who take a gap year arrive at university more motivated and are less likely to drop out, although it is hard to know whether the year itself is responsible or whether more independent students are simply more likely to take one. Either way, the key seems to be planning: students who decide in advance what they want to achieve are far more likely to describe the year as worthwhile.""", qs=[
  ("What do critics worry about?", ["The year may be spent doing nothing useful", "Students will spend too much money", "Students will forget what they learned", "Universities will reject these students"]),
  ("What do admissions staff say about gap years?", ["Their value depends on how the year is used", "They always improve an application", "They make an application weaker", "They are only useful for travelling"]),
  ("Why is the evidence about motivation hard to interpret?", ["Students who take gap years may already be more independent", "Very few students take a gap year", "Universities do not record this information", "Motivated students rarely go to university"]),
  ("What is the main advice of the article?", ["Plan in advance what you want to achieve", "Avoid taking a gap year if possible", "Travel abroad rather than work", "Apply to university during the year"]),
 ]),
]
TEENS_DEMO_LISTENING = [
 dict(id='dtlB1', level='B1', title="Planning a birthday surprise", speed=0.9, pause=0.5, lines=[
  ('af_heart', "Jack, it's Lily's birthday next Saturday. Shall we do something special for her?"),
  ('am_puck', "Definitely. What about a surprise party at my house?"),
  ('af_heart', "That's a nice idea, but your parents will be away that weekend, won't they?"),
  ('am_puck', "Oh, you're right. I forgot. OK, what about a picnic in the park instead?"),
  ('af_heart', "The forecast says it might rain. Why don't we take her to that new climbing centre? She's always saying she wants to try it."),
  ('am_puck', "Good idea. How much is it?"),
  ('af_heart', "Twelve pounds each, but it's cheaper if you book online. Only nine."),
  ('am_puck', "Great, I'll book it tonight. Should we invite anyone else?"),
  ('af_heart', "Let's ask Sam and Ruby. And we can go for pizza afterwards."),
  ('am_puck', "Perfect. Let's keep it a secret!"),
 ], qs=[
  ("Why can't they have a party at Jack's house?", ["Jack's parents will be away", "The house is too small", "It might rain", "Lily doesn't like parties"]),
  ("Why don't they choose the picnic?", ["The weather may be bad", "Lily doesn't like the park", "It is too expensive", "Jack forgot about it"]),
  ("How much is each ticket if Jack books online?", ["£9", "£12", "£21", "£15"]),
  ("What will they do after climbing?", ["Have pizza", "Have a picnic", "Go to Jack's house", "Go to the cinema"]),
 ]),
 dict(id='dtlC1', level='C1', title="A talk about failure", speed=1.0, pause=0.14, lines=[
  ('am_michael', "We tend to tell young people that failure is a valuable teacher, and in a sense it is. But I'd like to complicate that idea a little. "
                "Failure on its own teaches very little. Plenty of people fail at the same thing again and again without learning anything, because they never stop to ask why it happened. "
                "What makes failure useful is reflection: the willingness to look honestly at what went wrong, without either blaming everyone else or concluding that you're simply no good. "
                "That second reaction is particularly common among high-achieving students, for whom a single poor grade can feel like a judgement on their whole identity. "
                "Ironically, these are often the students who most need to experiment, because they've become so skilled at avoiding risk. "
                "So rather than celebrating failure for its own sake, I'd encourage schools to celebrate thoughtful risk-taking, "
                "and to give students the time and space to analyse what happened when things didn't go to plan."),
 ], qs=[
  ("What is the speaker's view of the idea that failure is a good teacher?", ["It is only true if people reflect on their failures", "It is completely wrong", "It applies only to young people", "It is true in every situation"]),
  ("Which reaction to failure is common among high-achieving students?", ["Seeing one bad grade as a judgement on themselves", "Blaming their teachers for the result", "Ignoring the result completely", "Trying again immediately"]),
  ("Why do high-achieving students most need to experiment?", ["They have learned to avoid taking risks", "They have more free time than others", "They are better at reflection", "They get the most help from schools"]),
  ("What does the speaker recommend schools do?", ["Reward thoughtful risk-taking and reflection", "Celebrate every failure", "Give students fewer grades", "Stop high achievers taking risks"]),
 ]),
]

# =====================================================================================
# JUNIOR (grades 5-7)
# =====================================================================================
JUNIOR_GRAMMAR = [
 # Pre-A1 (picture items)
 dict(id='jg1', level='Pre-A1', pic="🐘", prompt="This is an ___.", opts=["elephant", "umbrella", "orange", "egg"]),
 dict(id='jg2', level='Pre-A1', pic="🚲", prompt="I ride my ___ to school.", opts=["bike", "book", "bed", "ball"]),
 dict(id='jg3', level='Pre-A1', prompt="I ___ ten years old.", opts=["am", "is", "are", "be"]),
 dict(id='jg4', level='Pre-A1', pic="🍎🍎🍎", prompt="There are three ___.", opts=["apples", "apple", "an apple", "apple's"]),
 dict(id='jg5', level='Pre-A1', pic="🌧️", prompt="It's raining. Take your ___!", opts=["umbrella", "sunglasses", "kite", "swimsuit"]),
 # A1
 dict(id='jg6', level='A1', prompt="My sister ___ like spiders.", opts=["doesn't", "don't", "isn't", "aren't"]),
 dict(id='jg7', level='A1', prompt="We go to the park ___ Saturdays.", opts=["on", "in", "at", "to"]),
 dict(id='jg8', level='A1', prompt="Whose bag is this? — It's ___.", opts=["mine", "me", "my", "I"]),
 dict(id='jg9', level='A1', pic="🕒", prompt="What time is it? — It's ___.", opts=["three o'clock", "half past three", "quarter to three", "one o'clock"]),
 dict(id='jg10', level='A1', prompt="___ is your birthday? — In May.", opts=["When", "Where", "Who", "What"]),
 # A2
 dict(id='jg11', level='A2', prompt="Last weekend we ___ a cake for Grandma.", opts=["made", "make", "makes", "making"]),
 dict(id='jg12', level='A2', prompt="A cheetah is ___ animal in the world.", opts=["the fastest", "faster", "the most fast", "fast"]),
 dict(id='jg13', level='A2', prompt="Shh! The baby ___.", opts=["is sleeping", "sleeps", "sleep", "are sleeping"]),
 dict(id='jg14', level='A2', prompt="I ___ visit my cousins next summer.", opts=["am going to", "going to", "will to", "go to"]),
 dict(id='jg15', level='A2', pic="✂️", prompt="You cut paper with ___.", opts=["scissors", "glue", "a ruler", "a rubber"]),
 # B1
 dict(id='jg16', level='B1', prompt="If it's sunny tomorrow, we ___ to the beach.", opts=["will go", "would go", "went", "going"]),
 dict(id='jg17', level='B1', prompt="I have never ___ a real dinosaur skeleton.", opts=["seen", "saw", "see", "seeing"]),
 dict(id='jg18', level='B1', prompt="The Mona Lisa ___ by Leonardo da Vinci.", opts=["was painted", "painted", "is painting", "has painted"]),
 dict(id='jg19', level='B1', prompt="You ___ wear a coat. It isn't cold today.", opts=["don't have to", "mustn't", "can't", "haven't to"]),
 dict(id='jg20', level='B1', prompt="I'm really looking forward ___ the school trip.", opts=["to", "for", "at", "on"]),
]

JUNIOR_READING = [
 dict(id='jrP', level='Pre-A1', title="My cat", passage=
"""Hello! My name is Ana. I am eleven.

I have a cat. Her name is Luna. She is black and white. She is small and very funny.

Luna likes milk and fish. She sleeps on my bed. I love my cat!""", qs=[
  ("What is Luna?", ["A cat", "A dog", "A fish", "A girl"]),
  ("What colour is Luna?", ["Black and white", "Black", "Brown and white", "Grey"]),
  ("What does Luna like?", ["Milk and fish", "Milk and bread", "Fish and apples", "Water and cake"]),
  ("Where does Luna sleep?", ["On Ana's bed", "In the kitchen", "In the garden", "On the sofa"]),
 ]),
 dict(id='jrA1', level='A1', title="An email from Tom", passage=
"""Hi Jack,

We are in our new house now! It's in a small town near the mountains. My bedroom is upstairs and it's blue. I can see the mountains from my window.

My new school is near our house, so I walk there every morning. My teacher's name is Mrs Green. She is very kind.

On Saturdays I go swimming with my dad. On Sundays we visit Grandma. She makes a big chocolate cake!

Can you come and visit us in July?

Tom""", qs=[
  ("Where is Tom's new house?", ["Near the mountains", "Near the sea", "In a big city", "Next to Grandma's house"]),
  ("How does Tom go to school?", ["He walks", "By bus", "By car", "By bike"]),
  ("What does Tom do on Saturdays?", ["He goes swimming", "He visits Grandma", "He makes a cake", "He goes to school"]),
  ("What does Tom ask Jack?", ["To visit him in July", "To go swimming with him", "To write an email", "To make a cake"]),
 ]),
 dict(id='jrA2', level='A2', title="Our school garden", passage=
"""This year, Class 6B started a garden behind the school gym. At first, it was just grass and stones, but the students worked hard every Friday afternoon to make it beautiful.

Now there are carrots, tomatoes, beans and lots of flowers. The students water the plants before school, and their teacher, Mr Hall, shows them how to look after them. In June, the class picked their first vegetables. The school cook used the tomatoes to make soup for the whole school!

"It was hard work, but it was fun," says Zara, 11. "I didn't like tomatoes before, but now I love them, because we grew them ourselves."

Next year, Class 6B wants to build a small pond for frogs and birds. They are selling cakes at the school fair to get money for it.""", qs=[
  ("What was behind the gym before the garden?", ["Grass and stones", "Flowers and trees", "A small pond", "Vegetables"]),
  ("When do the students water the plants?", ["Before school", "On Friday afternoons", "After lunch", "At the weekend"]),
  ("Why does Zara like tomatoes now?", ["Her class grew them", "The cook made them into soup", "Mr Hall told her to try them", "She tried them at the fair"]),
  ("Why are the students selling cakes?", ["To pay for a pond", "To buy new flowers", "To help the school cook", "To buy more tomatoes"]),
 ]),
 dict(id='jrB1', level='B1', title="The night the beach came alive", passage=
"""Every summer, sea turtles come to the beaches of a small Greek island to lay their eggs in the sand. About two months later, the baby turtles hatch and crawl towards the sea, usually at night. It's a dangerous journey. Bright lights from hotels and restaurants can confuse them, and many go the wrong way.

Last year, a group of students from the island's secondary school decided to help. With a local wildlife charity, they spent their summer holidays checking the beach every morning for new nests. When they found one, they put a small fence around it so that people wouldn't step on it.

They also wrote letters to the hotels near the beach, asking them to turn off their outside lights after ten o'clock during the hatching season. To their surprise, almost all of them agreed.

"The best moment was in August," says 12-year-old Nikos. "We watched about sixty baby turtles run into the sea. I'll never forget it." This year, the students are training younger children to continue their work.""", qs=[
  ("Why are bright lights a problem for baby turtles?", ["The turtles go the wrong way", "The turtles cannot sleep", "The lights make the sand too hot", "The lights wake up the eggs"]),
  ("What did the students do when they found a nest?", ["They put a fence around it", "They moved the eggs to the sea", "They phoned the hotels", "They took photos of it"]),
  ("How did the hotels react to the students' letters?", ["Most of them agreed to help", "They ignored the letters", "They closed for the summer", "They gave money to the charity"]),
  ("What are the students doing this year?", ["Teaching younger children to help", "Building a new beach", "Writing to the government", "Working in the hotels"]),
 ]),
]

JUNIOR_LISTENING = [
 dict(id='jlP', level='Pre-A1', title="Sara and her family", speed=0.86, pause=0.8, lines=[
  ('bf_emma', "Hello! I'm Sara. I'm eleven years old. This is my family. "
               "I have one brother. His name is Ben. He is seven. "
               "I have a dog, too. His name is Rocky. He is big and brown. "
               "My favourite colour is green. I like playing tennis with my dad. Goodbye!"),
 ], qs=[
  ("How old is Sara?", ["11", "7", "10", "12"]),
  ("Who is Ben?", ["Her brother", "Her dad", "Her dog", "Her friend"]),
  ("What colour is Rocky?", ["Brown", "Green", "Black", "White"]),
  ("What does Sara like doing with her dad?", ["Playing tennis", "Walking the dog", "Playing football", "Swimming"]),
 ]),
 dict(id='jlA1', level='A1', title="A phone call from Mum", speed=0.88, pause=0.5, lines=[
  ('bf_isabella', "Hi, Leo. I'm at the supermarket. What do we need for your party tomorrow?"),
  ('am_puck', "Hi, Mum. We need a big cake, please. A chocolate cake!"),
  ('bf_isabella', "OK. And drinks?"),
  ('am_puck', "Yes, orange juice. Not apple juice. My friends don't like apple juice."),
  ('bf_isabella', "How many friends are coming?"),
  ('am_puck', "Eight friends. And Grandma and Grandpa."),
  ('bf_isabella', "OK. The party starts at three o'clock, right?"),
  ('am_puck', "No, Mum. At four o'clock."),
  ('bf_isabella', "Oh, yes. Four o'clock. See you soon!"),
 ], qs=[
  ("Where is Leo's mum?", ["At the supermarket", "At home", "At school", "At Grandma's house"]),
  ("What kind of cake does Leo want?", ["Chocolate", "Orange", "Apple", "Strawberry"]),
  ("How many friends are coming to the party?", ["8", "3", "4", "10"]),
  ("What time does the party start?", ["4:00", "3:00", "8:00", "2:00"]),
 ]),
 dict(id='jlA2', level='A2', title="A trip to the farm", speed=0.86, pause=0.75, lines=[
  ('bm_george', "OK, everyone, listen carefully, please. Tomorrow is our trip to Green Hill Farm. "
                "The bus leaves at nine o'clock, so please be at school by quarter to nine. Don't be late, because the bus can't wait! "
                "At the farm, we're going to feed the animals and see how cheese is made. "
                "It can be very muddy there, so please wear old clothes and boots, not your new trainers. "
                "Bring a packed lunch and a bottle of water. You don't need any money, because there isn't a shop at the farm. "
                "We'll be back at school at three o'clock. Oh, and yes, you can bring a camera!"),
 ], qs=[
  ("What time should students be at school?", ["8:45", "9:00", "9:15", "3:00"]),
  ("What will students see at the farm?", ["How cheese is made", "How milk goes into bottles", "How ice cream is made", "How bread is made"]),
  ("Why should students wear old clothes?", ["It can be muddy", "They will work in a shop", "It is going to rain", "The animals are dangerous"]),
  ("Why don't students need any money?", ["There isn't a shop at the farm", "The teacher will pay", "The trip is very short", "Lunch is free at the farm"]),
 ]),
 dict(id='jlB1', level='B1', title="A science project", speed=0.88, pause=0.5, lines=[
  ('bf_emma', "Sam, have you started the science project yet? It's due next Monday."),
  ('am_puck', "Not really. I wanted to make a volcano, but my brother said everyone does that."),
  ('bf_emma', "He's right. Mrs Clark said she wants something original this year."),
  ('am_puck', "What are you doing, Holly?"),
  ('bf_emma', "I'm testing which kind of paper bag is the strongest. I put heavier and heavier books in each bag until it breaks."),
  ('am_puck', "That's clever! Maybe I could do something with plants. Like, do plants grow faster with music?"),
  ('bf_emma', "Ooh, that's interesting. But plants grow really slowly. You'd need at least three weeks to see any difference."),
  ('am_puck', "Oh no, you're right. I've only got a week. Hmm. What about testing which drinks make your teeth dirty? I could use eggshells, because they're a bit like teeth."),
  ('bf_emma', "Gross, but cool! I think Mrs Clark would love that."),
  ('am_puck', "OK. I'll ask my mum for some eggs tonight."),
 ], qs=[
  ("Why doesn't Sam make a volcano?", ["His brother says it isn't original", "Mrs Clark doesn't like volcanoes", "It is too difficult to make", "He doesn't have the materials"]),
  ("What is Holly's project about?", ["How strong different paper bags are", "How heavy different books are", "How plants grow with music", "How drinks affect teeth"]),
  ("Why does Sam change his mind about the plant project?", ["There isn't enough time", "Plants don't like music", "His mum doesn't like plants", "Holly is already doing it"]),
  ("What will Sam use in his project?", ["Eggshells", "Paper bags", "Plants", "Books"]),
 ]),
]

# ---- Junior demo (different items) ----
JUNIOR_DEMO_GRAMMAR = [
 dict(id='djg1', level='Pre-A1', pic="🐶", prompt="This is a ___.", opts=["dog", "cat", "cow", "duck"]),
 dict(id='djg2', level='Pre-A1', prompt="She ___ my sister.", opts=["is", "are", "am", "be"]),
 dict(id='djg3', level='A1', prompt="I ___ breakfast at seven o'clock.", opts=["have", "has", "having", "am"]),
 dict(id='djg4', level='A1', prompt="Can you swim? — Yes, I ___.", opts=["can", "do", "am", "swim"]),
 dict(id='djg5', level='A2', prompt="We ___ to the zoo last Sunday.", opts=["went", "go", "goes", "are going"]),
 dict(id='djg6', level='A2', prompt="This box is ___ than that one.", opts=["heavier", "heavy", "heaviest", "more heavy"]),
 dict(id='djg7', level='B1', prompt="I've lived in this town ___ I was five.", opts=["since", "for", "from", "when"]),
 dict(id='djg8', level='B1', prompt="If you heat ice, it ___.", opts=["melts", "melted", "would melt", "is melted"]),
]
JUNIOR_DEMO_READING = [
 dict(id='djrA1', level='A1', title="A note on the fridge", passage=
"""Hi Emma,

I'm at work until six o'clock today. There's pasta for lunch in the fridge.

After school, please take Bobby for a walk in the park. Don't forget your piano lesson at half past four!

Grandma is coming for dinner tonight.

Love,
Dad""", qs=[
  ("Who wrote the note?", ["Emma's dad", "Emma's grandma", "Emma", "Emma's piano teacher"]),
  ("What must Emma do after school?", ["Take Bobby for a walk", "Go to work", "Make dinner", "Go to Grandma's house"]),
  ("What time is Emma's piano lesson?", ["4:30", "6:00", "5:30", "4:00"]),
  ("Who is coming for dinner tonight?", ["Grandma", "Bobby", "The piano teacher", "Dad's friend"]),
 ]),
 dict(id='djrA2', level='A2', title="The library's new robot", passage=
"""Our town library has a new helper: a robot called Max! Max is one metre tall and has a screen on his chest. If you can't find a book, you can tell Max the title, and he takes you to the right shelf.

Max can also read stories to young children. Every Saturday morning at ten, children sit on the carpet and listen to him. Some children were scared of Max at first, but now they love him.

The librarian, Mrs Ortiz, says Max can't do everything. "He can't fix the computers, and he can't answer every question," she laughs. "So people still need me!" """, qs=[
  ("How does Max help people find books?", ["He takes them to the right shelf", "He shows the book on his screen", "He brings the book to them", "He calls Mrs Ortiz"]),
  ("When does Max read stories?", ["On Saturday mornings", "Every evening", "On Sunday afternoons", "Every day at ten"]),
  ("How did some children feel about Max at first?", ["Scared", "Happy", "Bored", "Angry"]),
  ("What does Mrs Ortiz say?", ["Max can't do all of her jobs", "Max is better than her", "Max fixes the computers", "Max will take her job soon"]),
 ]),
]
JUNIOR_DEMO_LISTENING = [
 dict(id='djlA1', level='A1', title="Where is my bag?", speed=0.86, pause=0.7, lines=[
  ('am_puck', "Mum, where is my school bag? I can't find it."),
  ('bf_isabella', "Is it in your bedroom?"),
  ('am_puck', "No, it isn't. I looked under my bed, too."),
  ('bf_isabella', "What about the kitchen? You had breakfast there."),
  ('am_puck', "No. Oh, wait! It's in the car! I left it there yesterday."),
  ('bf_isabella', "OK. Here are the car keys. Be quick. The bus comes at eight o'clock!"),
  ('am_puck', "Thanks, Mum!"),
 ], qs=[
  ("What is the boy looking for?", ["His school bag", "The car keys", "His breakfast", "His bed"]),
  ("Where is the bag?", ["In the car", "In the kitchen", "Under the bed", "In the bedroom"]),
  ("When did he leave it there?", ["Yesterday", "This morning", "Last week", "At breakfast"]),
  ("What time does the bus come?", ["8:00", "7:00", "8:30", "9:00"]),
 ]),
 dict(id='djlB1', level='B1', title="Saving for a skateboard", speed=0.86, pause=0.7, lines=[
  ('af_heart', "Owen, did you buy that skateboard you wanted?"),
  ('am_puck', "Not yet. It costs sixty pounds, and I've only saved forty."),
  ('af_heart', "Can't your parents help?"),
  ('am_puck', "They said I should earn the money myself. So I'm washing our neighbours' cars on Saturdays. They pay me five pounds a car."),
  ('af_heart', "Nice. So how long will it take?"),
  ('am_puck', "If I wash two cars every week, I'll have enough in two weeks."),
  ('af_heart', "Hey, my cousin is selling her old skateboard. It's in really good condition, and she only wants thirty pounds."),
  ('am_puck', "Really? Then I could buy it now! But I really wanted a new one."),
  ('af_heart', "Well, you could buy hers and spend the rest on a helmet."),
  ('am_puck', "That's actually a really good idea. Can you send me her number?"),
 ], qs=[
  ("How much money has Owen saved?", ["£40", "£60", "£30", "£20"]),
  ("How is Owen earning money?", ["By washing cars", "By selling skateboards", "By helping his parents", "By working in a shop"]),
  ("What is good about the cousin's skateboard?", ["It's cheap and in good condition", "It's brand new", "It comes with a helmet", "It's the one Owen wanted"]),
  ("What will Owen probably do next?", ["Contact his friend's cousin", "Wash more cars", "Ask his parents for money", "Buy a new skateboard"]),
 ]),
]

TESTS = {
 'teens-full':  dict(grammar=TEENS_GRAMMAR, reading=TEENS_READING, listening=TEENS_LISTENING),
 'teens-demo':  dict(grammar=TEENS_DEMO_GRAMMAR, reading=TEENS_DEMO_READING, listening=TEENS_DEMO_LISTENING),
 'junior-full': dict(grammar=JUNIOR_GRAMMAR, reading=JUNIOR_READING, listening=JUNIOR_LISTENING),
 'junior-demo': dict(grammar=JUNIOR_DEMO_GRAMMAR, reading=JUNIOR_DEMO_READING, listening=JUNIOR_DEMO_LISTENING),
}
ALL_LISTENING = TEENS_LISTENING + TEENS_DEMO_LISTENING + JUNIOR_LISTENING + JUNIOR_DEMO_LISTENING
