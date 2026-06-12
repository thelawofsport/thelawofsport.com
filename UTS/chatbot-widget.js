/**
 * The Law of Sport — AI Study Assistant Widget
 *
 * A self-contained chatbot widget for thelawofsport.com student portal.
 * Drop this script into any page and it adds a floating chat assistant.
 *
 * SETUP:
 * 1. Add <script src="chatbot-widget.js"></script> before </body> on any page
 * 2. Configure your API endpoint in CHATBOT_CONFIG below
 * 3. Customise course content, assessment dates, and Q&A page URLs
 *
 * For production, the API calls should go through YOUR backend proxy
 * so you never expose an API key in client-side code.
 */

(function() {
    'use strict';

    // =========================================================================
    // CONFIGURATION — Edit these to match your course setup
    // =========================================================================
    const CHATBOT_CONFIG = {
        // Your backend API endpoint (proxy to Claude/OpenAI — never expose keys client-side)
        apiEndpoint: '/api/chat', // Change to your actual endpoint

        // University context (auto-detected from URL path, or set manually)
        university: detectUniversity(),

        // Course content map — the bot uses this to direct students
        courseContent: {
            welcome: {
                title: 'Welcome to Sports Law',
                url: 'welcome.html',
                topics: ['lecturer bio', 'how the course works', 'what is a sports lawyer', 'key themes and tensions', 'intro to sport', 'lecture architecture', 'how to listen']
            },
            modules: [
                {
                    id: 1,
                    title: 'Module 1: Intro & Overview',
                    url: 'module1.html',
                    lectures: [
                        { id: 1, title: 'What is Sports Law', url: 'lecture1.html', topics: ['definition of sports law', 'scope', 'legal frameworks', 'sports regulation overview'] },
                        { id: 2, title: 'Sports Governance', url: 'lecture2.html', topics: ['governance structures', 'sporting bodies', 'federations', 'regulatory frameworks', 'autonomy of sport'] }
                    ]
                },
                {
                    id: 2,
                    title: 'Module 2: Challenging Decisions',
                    url: 'module2.html',
                    lectures: [
                        { id: 3, title: 'Sports Discipline & Disputes', url: 'lecture3.html', topics: ['disciplinary proceedings', 'natural justice', 'procedural fairness', 'CAS', 'arbitration', 'appeals', 'tribunal'] }
                    ]
                },
                {
                    id: 3,
                    title: 'Module 3: Athlete, Contracts & Control',
                    url: 'module3.html',
                    lectures: [
                        { id: 4, title: 'Player Contracting', url: 'lecture4.html', topics: ['player contracts', 'standard player agreements', 'restraint of trade', 'transfer systems', 'salary caps', 'collective bargaining'] },
                        { id: 5, title: 'Player Representation & Agency', url: 'lecture5.html', topics: ['sports agents', 'athlete management', 'fiduciary duties', 'regulation of agents', 'conflicts of interest'] }
                    ]
                },
                {
                    id: 4,
                    title: 'Module 4: Sports Integrity & Regulation',
                    url: 'module4.html',
                    lectures: [
                        { id: 6, title: 'Clean Sport', url: 'lecture6.html', topics: ['WADA', 'anti-doping', 'strict liability', 'therapeutic use exemptions', 'illicit drugs in sport', 'drug testing'] },
                        { id: 7, title: 'Anti-Corruption & Gambling', url: 'lecture7.html', topics: ['match-fixing', 'sports betting', 'corruption', 'integrity units', 'gambling regulation', 'insider information'] },
                        { id: 8, title: 'High Risk Sport & Permitted Harm', url: 'lecture8.html', topics: ['duty of care', 'negligence', 'consent', 'volenti non fit injuria', 'contact sports', 'concussion', 'CTE', 'inherent risk'] }
                    ]
                },
                {
                    id: 5,
                    title: 'Module 5: Commercialising Sports Rights',
                    url: 'module5.html',
                    lectures: [
                        { id: 9, title: 'From Right to Contract', url: 'lecture9.html', topics: ['intellectual property', 'sports rights', 'commercialisation', 'licensing', 'merchandising'] },
                        { id: 10, title: 'Sports Media Rights & Broadcasting', url: 'lecture10.html', topics: ['broadcasting rights', 'media rights', 'anti-siphoning', 'streaming', 'digital rights', 'collective selling'] },
                        { id: 11, title: 'Sports Sponsorship & Reputation', url: 'lecture11.html', topics: ['sponsorship agreements', 'ambush marketing', 'morality clauses', 'brand protection', 'athlete image rights', 'endorsements'] }
                    ]
                }
            ],
            assessments: [
                {
                    id: 1,
                    title: 'Assessment 1',
                    qnaPage: 'assessment1-qna.html', // Q&A page URL
                    dueDate: null, // Set to ISO date string e.g. '2026-10-15'
                    relatedModules: [1, 2],
                    relatedLectures: [1, 2, 3]
                },
                {
                    id: 2,
                    title: 'Assessment 2',
                    qnaPage: 'assessment2-qna.html',
                    dueDate: null,
                    relatedModules: [3, 4],
                    relatedLectures: [4, 5, 6, 7, 8]
                },
                {
                    id: 3,
                    title: 'Assessment 3',
                    qnaPage: 'assessment3-qna.html',
                    dueDate: null,
                    relatedModules: [4, 5],
                    relatedLectures: [8, 9, 10, 11]
                }
            ]
        },

        // Days before due date to tighten assessment guardrails
        assessmentGuardrailDays: 14,

        // Forum URL pattern (university-specific)
        forumUrl: 'https://moodle.une.edu.au', // Update per university
    };

    // =========================================================================
    // SYSTEM PROMPT — This defines the bot's personality and behaviour
    // =========================================================================
    const SYSTEM_PROMPT = buildSystemPrompt(CHATBOT_CONFIG);

    function buildSystemPrompt(config) {
        const courseMap = config.courseContent.modules.map(m =>
            `${m.title}:\n` + m.lectures.map(l => `  - Lecture ${l.id}: ${l.title} (${l.url})`).join('\n')
        ).join('\n');

        const assessmentInfo = config.courseContent.assessments.map(a => {
            const nearDue = a.dueDate && isNearDueDate(a.dueDate, config.assessmentGuardrailDays);
            return `${a.title}: Q&A Page: ${a.qnaPage}, Covers Modules ${a.relatedModules.join(' & ')}, Lectures ${a.relatedLectures.join(', ')}${nearDue ? ' [ASSESSMENT PERIOD ACTIVE — USE TIGHTER GUARDRAILS]' : ''}`;
        }).join('\n');

        return `You are a study assistant for "The Law of Sport" — a university Sports Law course taught by Mike Bricknell, a practising sports lawyer and university lecturer.

YOUR ROLE:
You help students navigate course materials, understand concepts, and find the right resources. You are NOT a replacement for the lectures, readings, or the lecturer. You are a guide.

RESPONSE STYLE — GUIDED DISCOVERY:
When answering questions:
1. Provide a DIRECTIONAL answer — indicate the key principles, considerations, or legal concepts involved. Use language like "the key considerations here include...", "you may want to look at...", "the relevant principles relate to...", "this area typically involves..."
2. NEVER state legal conclusions as absolute fact. Law is nuanced. Frame answers as "the general position is..." or "courts have tended to..." rather than definitive statements.
3. ALWAYS reference the specific module and lecture where the topic is covered in more detail. Use the course map below.
4. If the question relates to an assessment topic, direct students to the relevant Assessment Q&A page (listed below) where answers to common questions are compiled.
5. If you cannot confidently locate the answer in the course materials, tell the student: "I'm not sure that's covered in the materials I have access to. I'd suggest posting a question on the discussion forum for this module on your university's learning platform — Mike reviews those regularly."

COURSE CONTENT MAP:
${courseMap}

Welcome Section (welcome.html):
- Lecturer Bio, How the Course Works, What is a Sports Lawyer, Key Themes & Tensions, Intro to Sport, Lecture Architecture & How to Listen

ASSESSMENTS & Q&A PAGES:
${assessmentInfo}

ASSESSMENT GUARDRAILS:
- For assessment-related questions, ALWAYS direct students to the relevant Assessment Q&A page first: "Check the Q&A page for [Assessment X] — this topic has been addressed there with guidance on how to approach it."
- During active assessment periods (close to due dates), be MORE cautious. Do NOT provide structured analysis or step-by-step approaches that could serve as an answer template. Instead say something like: "This topic is closely related to your current assessment. I'd encourage you to work through the materials in [relevant Module/Lecture] and develop your own analysis. The Assessment Q&A page may also have helpful guidance."
- You can confirm which lectures/modules are relevant to an assessment, but should not outline how to structure an answer.

TONE:
- Approachable and encouraging, like a helpful senior student or tutor
- Professional but not stiff — this is a support tool, not a legal opinion
- If a student seems frustrated or confused, acknowledge that and point them to the most relevant starting point
- Never condescending — assume the student is capable and just needs direction

BOUNDARIES:
- You are an AI study assistant. You are not Mike, you are not a lawyer, and you are not providing legal advice.
- If asked for legal advice about a real-world situation, politely decline: "I'm here to help with your Sports Law studies, but I can't give legal advice about real situations. For that, you'd want to speak with a qualified lawyer."
- If asked about content outside this course, you can briefly acknowledge the topic but redirect: "That's an interesting area but falls outside what we cover in this course. The materials focus on [relevant scope]."
- Do not generate essay answers, model answers, or assessment submissions.

FORMAT:
- Keep responses concise — aim for 3-5 sentences for simple queries, up to a short paragraph for more complex ones
- Always include at least one specific reference (lecture, module, or Q&A page)
- Use the student's question to identify the most relevant single location in the course materials`;
    }

    // =========================================================================
    // UTILITY FUNCTIONS
    // =========================================================================
    function detectUniversity() {
        const path = window.location.pathname;
        if (path.includes('/demo/') || path.includes('/une/')) return 'UNE';
        if (path.includes('/uow/')) return 'UOW';
        return 'UNE'; // default
    }

    function isNearDueDate(dueDateStr, guardDays) {
        if (!dueDateStr) return false;
        const due = new Date(dueDateStr);
        const now = new Date();
        const diffDays = (due - now) / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= guardDays;
    }

    function detectCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop();
        const config = CHATBOT_CONFIG.courseContent;

        for (const mod of config.modules) {
            for (const lec of mod.lectures) {
                if (filename === lec.url) {
                    return { type: 'lecture', lecture: lec, module: mod };
                }
            }
            if (filename === mod.url) {
                return { type: 'module', module: mod };
            }
        }
        for (const assess of config.assessments) {
            if (filename === assess.qnaPage) {
                return { type: 'assessment', assessment: assess };
            }
        }
        return { type: 'general' };
    }

    // =========================================================================
    // CHAT ENGINE — Handles message history and API calls
    // =========================================================================
    class ChatEngine {
        constructor(config) {
            this.config = config;
            this.messages = [];
            this.systemPrompt = SYSTEM_PROMPT;
            this.isDemo = true; // Set to false when connected to real API
        }

        async sendMessage(userMessage) {
            this.messages.push({ role: 'user', content: userMessage });

            if (this.isDemo) {
                return this.generateDemoResponse(userMessage);
            }

            try {
                const response = await fetch(this.config.apiEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        system: this.systemPrompt,
                        messages: this.messages
                    })
                });
                const data = await response.json();
                const assistantMessage = data.content || data.message || 'Sorry, I had trouble processing that. Please try again.';
                this.messages.push({ role: 'assistant', content: assistantMessage });
                return assistantMessage;
            } catch (error) {
                console.error('Chat API error:', error);
                return 'I\'m having trouble connecting right now. Please try again in a moment, or post your question on the discussion forum.';
            }
        }

        generateDemoResponse(userMessage) {
            const msg = userMessage.toLowerCase();
            const page = detectCurrentPage();
            let response = '';

            // Assessment-related queries
            if (msg.includes('assessment') || msg.includes('assignment') || msg.includes('essay') || msg.includes('exam')) {
                const activeAssessments = this.config.courseContent.assessments.filter(a =>
                    a.dueDate && isNearDueDate(a.dueDate, this.config.assessmentGuardrailDays)
                );

                if (activeAssessments.length > 0) {
                    const a = activeAssessments[0];
                    response = `This topic is closely related to your current assessment. I'd encourage you to work through the materials in the relevant modules and develop your own analysis.\n\nThe <a href="${a.qnaPage}">Assessment Q&A page</a> compiles answers to common student questions and is a great starting point. If you can't find what you need there, post a question on your university's discussion forum — Mike reviews those regularly and the answers get added to the Q&A page.`;
                } else {
                    // Find most relevant assessment
                    let relevantAssessment = this.config.courseContent.assessments[0];
                    for (const a of this.config.courseContent.assessments) {
                        for (const lecId of a.relatedLectures) {
                            const lecTitle = this.findLecture(lecId)?.title?.toLowerCase() || '';
                            if (msg.includes(lecTitle.split(':')[0]?.toLowerCase().trim())) {
                                relevantAssessment = a;
                            }
                        }
                    }
                    response = `For assessment guidance, check the <a href="${relevantAssessment.qnaPage}">${relevantAssessment.title} Q&A page</a> — it has an evolving bank of answers to student questions that's regularly updated.\n\nThe relevant course materials are in Modules ${relevantAssessment.relatedModules.join(' and ')}, covering Lectures ${relevantAssessment.relatedLectures.join(', ')}. Work through those and form your own analysis. If you have a specific question that isn't addressed on the Q&A page, post it on the discussion forum and it'll be picked up.`;
                }
            }
            // Anti-doping / drugs
            else if (msg.includes('doping') || msg.includes('wada') || msg.includes('drug') || msg.includes('banned substance')) {
                response = `Anti-doping is covered in detail in <a href="lecture6.html">Lecture 6: Clean Sport</a> (Module 4). The key considerations include the WADA Code framework, the principle of strict liability for athletes, and the role of therapeutic use exemptions.\n\nThe general position is that athletes bear responsibility for what enters their body, though the case law shows some nuance around the level of fault required. You'll find the specific cases and principles explored in that lecture.\n\nIf you're looking at this for assessment purposes, also check the <a href="assessment2-qna.html">Assessment 2 Q&A page</a> for related guidance.`;
            }
            // Match-fixing / gambling
            else if (msg.includes('match') && msg.includes('fix') || msg.includes('gambling') || msg.includes('betting') || msg.includes('corruption')) {
                response = `Match-fixing and gambling regulation are the focus of <a href="lecture7.html">Lecture 7: Anti-Corruption & Gambling</a> in Module 4. The key themes involve how integrity units operate, the legal frameworks around sports betting, and how insider information provisions apply in the sporting context.\n\nYou may also want to consider how this intersects with the broader governance frameworks covered in <a href="lecture2.html">Lecture 2: Sports Governance</a>.\n\nIf you can't find what you're looking for in those materials, raise it on the discussion forum — it's a rich area and Mike can point you to additional resources.`;
            }
            // Contracts / agents
            else if (msg.includes('contract') || msg.includes('agent') || msg.includes('player') || msg.includes('transfer') || msg.includes('salary cap')) {
                response = `Player contracting and athlete representation are covered across Module 3. <a href="lecture4.html">Lecture 4: Player Contracting</a> deals with standard player agreements, restraint of trade, and salary cap mechanisms. <a href="lecture5.html">Lecture 5: Player Representation & Agency</a> covers the regulation of sports agents, fiduciary duties, and conflicts of interest.\n\nThe relevant principles tend to draw on both contract law and employment law, with some sport-specific regulatory overlay. The lectures walk through the key cases and frameworks.\n\nFor assessment-related questions on these topics, the <a href="assessment2-qna.html">Assessment 2 Q&A page</a> may have relevant guidance.`;
            }
            // Negligence / duty of care / injury
            else if (msg.includes('negligence') || msg.includes('duty of care') || msg.includes('injury') || msg.includes('concussion') || msg.includes('consent') || msg.includes('harm')) {
                response = `The duty of care and liability in sport context is explored in <a href="lecture8.html">Lecture 8: High Risk Sport & Permitted Harm</a> (Module 4). Key considerations include the concepts of voluntary assumption of risk (<em>volenti non fit injuria</em>), the standard of care owed by sporting organisations, and how the law distinguishes between inherent risks and negligent conduct.\n\nThe area has been evolving, particularly around concussion and CTE — the lecture covers the recent developments. If your question goes beyond what's covered there, it would make a great discussion forum post.`;
            }
            // Broadcasting / media / sponsorship
            else if (msg.includes('broadcast') || msg.includes('media') || msg.includes('sponsor') || msg.includes('rights') || msg.includes('ambush')) {
                response = `The commercial side of sport is covered in Module 5. <a href="lecture10.html">Lecture 10: Sports Media Rights & Broadcasting</a> covers broadcasting agreements, anti-siphoning rules, and digital rights. <a href="lecture11.html">Lecture 11: Sports Sponsorship & Reputation</a> deals with sponsorship agreements, ambush marketing, and athlete image rights.\n\nFor the foundational concepts of how sports rights are created and commercialised, start with <a href="lecture9.html">Lecture 9: From Right to Contract</a>.\n\nThe <a href="assessment3-qna.html">Assessment 3 Q&A page</a> may have relevant guidance if this relates to your assessment work.`;
            }
            // Governance
            else if (msg.includes('governance') || msg.includes('federation') || msg.includes('sporting bod')) {
                response = `Sports governance structures are the focus of <a href="lecture2.html">Lecture 2: Sports Governance</a> in Module 1. This covers how sporting bodies are organised, the relationship between international federations and national bodies, and the concept of the autonomy of sport.\n\nThis is foundational material that connects to many later topics — disputes (Lecture 3), integrity regulation (Lectures 6-7), and commercial rights (Module 5) all build on the governance framework.\n\nIf you're looking for something specific that you can't find in the lecture, post it on the discussion forum.`;
            }
            // Legal advice request
            else if (msg.includes('my case') || msg.includes('advice') || msg.includes('my situation') || msg.includes('should i sue')) {
                response = `I appreciate you reaching out, but I'm here to help with your Sports Law studies rather than provide advice about real-world legal situations. For that, you'd want to speak with a qualified sports lawyer who can consider your specific circumstances.\n\nIf your question relates to a concept you're studying in the course, I'm happy to point you to the relevant materials — just rephrase it as a study question and I can help.`;
            }
            // General / fallback
            else {
                if (page.type === 'lecture') {
                    response = `Good question! Based on where you are in the course, this likely connects to the material in <a href="${page.lecture.url}">${page.lecture.title}</a> (${page.module.title}).\n\nHave a look through that lecture material for the relevant principles and cases. If you can't find what you're after, the <a href="${this.config.courseContent.assessments[0].qnaPage}">Assessment Q&A pages</a> compile answers to common student questions.\n\nStill stuck? Post it on the discussion forum — questions there get answered and added to the Q&A bank so everyone benefits.`;
                } else {
                    response = `That's a good question. Let me point you in the right direction.\n\nI'd suggest starting with the <a href="modules.html">Modules overview</a> to find which topic area your question falls under. Each module page links to the relevant lectures with detailed coverage.\n\nIf you're looking for assessment guidance, check the relevant Assessment Q&A page — they have a growing bank of answers to student questions.\n\nIf you can't track down what you need, post a question on the discussion forum for the relevant module. Mike reviews those regularly and the answers get added to the Q&A pages.`;
                }
            }

            this.messages.push({ role: 'assistant', content: response });
            return response;
        }

        findLecture(id) {
            for (const mod of this.config.courseContent.modules) {
                for (const lec of mod.lectures) {
                    if (lec.id === id) return lec;
                }
            }
            return null;
        }

        reset() {
            this.messages = [];
        }
    }

    // =========================================================================
    // UI — Builds and manages the chat widget
    // =========================================================================
    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Chat Widget — matches The Law of Sport design system */
            .tlos-chat-toggle {
                position: fixed;
                bottom: 24px;
                right: 24px;
                width: 56px;
                height: 56px;
                border-radius: 50%;
                background: linear-gradient(135deg, #1B7A5A, #22976E);
                border: none;
                cursor: pointer;
                box-shadow: 0 4px 16px rgba(27, 122, 90, 0.35);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: transform 0.2s ease, box-shadow 0.2s ease;
            }
            .tlos-chat-toggle:hover {
                transform: scale(1.08);
                box-shadow: 0 6px 24px rgba(27, 122, 90, 0.45);
            }
            .tlos-chat-toggle svg {
                width: 26px;
                height: 26px;
                fill: white;
            }
            .tlos-chat-toggle .tlos-close-icon { display: none; }
            .tlos-chat-toggle.open .tlos-chat-icon { display: none; }
            .tlos-chat-toggle.open .tlos-close-icon { display: block; }

            /* Chat Panel */
            .tlos-chat-panel {
                position: fixed;
                bottom: 92px;
                right: 24px;
                width: 380px;
                max-height: 520px;
                background: var(--color-surface, #FFFFFF);
                border-radius: 16px;
                box-shadow: 0 8px 40px rgba(11, 29, 58, 0.18);
                z-index: 10000;
                display: none;
                flex-direction: column;
                overflow: hidden;
                border: 1px solid var(--color-border, #E5E7EB);
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            }
            .tlos-chat-panel.open {
                display: flex;
                animation: tlos-slideUp 0.25s ease;
            }
            @keyframes tlos-slideUp {
                from { opacity: 0; transform: translateY(12px); }
                to { opacity: 1; transform: translateY(0); }
            }

            /* Header */
            .tlos-chat-header {
                background: linear-gradient(135deg, #0B1D3A, #132B52);
                color: white;
                padding: 16px 18px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .tlos-chat-header-icon {
                width: 32px;
                height: 32px;
                background: rgba(212, 168, 71, 0.2);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                flex-shrink: 0;
            }
            .tlos-chat-header-text h3 {
                font-size: 14px;
                font-weight: 600;
                margin: 0;
                line-height: 1.3;
            }
            .tlos-chat-header-text p {
                font-size: 11px;
                opacity: 0.7;
                margin: 2px 0 0;
                line-height: 1.3;
            }

            /* Messages */
            .tlos-chat-messages {
                flex: 1;
                overflow-y: auto;
                padding: 16px;
                display: flex;
                flex-direction: column;
                gap: 12px;
                min-height: 280px;
                max-height: 340px;
                background: var(--color-bg-alt, #F7F8FA);
            }
            .tlos-chat-message {
                max-width: 88%;
                padding: 10px 14px;
                border-radius: 12px;
                font-size: 13px;
                line-height: 1.55;
                word-wrap: break-word;
            }
            .tlos-chat-message a {
                color: #1B7A5A;
                text-decoration: underline;
                text-underline-offset: 2px;
            }
            .tlos-chat-message a:hover {
                color: #22976E;
            }
            .tlos-chat-message.user {
                align-self: flex-end;
                background: linear-gradient(135deg, #1B7A5A, #22976E);
                color: white;
                border-bottom-right-radius: 4px;
            }
            .tlos-chat-message.user a {
                color: #F0DCA0;
            }
            .tlos-chat-message.assistant {
                align-self: flex-start;
                background: var(--color-surface, #FFFFFF);
                color: var(--color-text, #1F2937);
                border: 1px solid var(--color-border, #E5E7EB);
                border-bottom-left-radius: 4px;
            }
            .tlos-chat-message.system {
                align-self: center;
                background: transparent;
                color: var(--color-text-light, #6B7280);
                font-size: 11px;
                text-align: center;
                padding: 4px;
            }

            /* Typing indicator */
            .tlos-typing {
                display: flex;
                gap: 4px;
                padding: 10px 14px;
                align-self: flex-start;
                background: var(--color-surface, #FFFFFF);
                border: 1px solid var(--color-border, #E5E7EB);
                border-radius: 12px;
                border-bottom-left-radius: 4px;
            }
            .tlos-typing span {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: var(--color-text-light, #9CA3AF);
                animation: tlos-bounce 1.2s infinite;
            }
            .tlos-typing span:nth-child(2) { animation-delay: 0.15s; }
            .tlos-typing span:nth-child(3) { animation-delay: 0.3s; }
            @keyframes tlos-bounce {
                0%, 60%, 100% { transform: translateY(0); }
                30% { transform: translateY(-4px); }
            }

            /* Input */
            .tlos-chat-input-area {
                padding: 12px 14px;
                border-top: 1px solid var(--color-border, #E5E7EB);
                display: flex;
                gap: 8px;
                background: var(--color-surface, #FFFFFF);
            }
            .tlos-chat-input {
                flex: 1;
                padding: 9px 14px;
                border: 1px solid var(--color-border, #E5E7EB);
                border-radius: 10px;
                font-size: 13px;
                font-family: inherit;
                background: var(--color-bg-alt, #F7F8FA);
                color: var(--color-text, #1F2937);
                outline: none;
                transition: border-color 0.2s;
                resize: none;
                max-height: 60px;
                line-height: 1.4;
            }
            .tlos-chat-input:focus {
                border-color: #1B7A5A;
            }
            .tlos-chat-input::placeholder {
                color: var(--color-text-light, #9CA3AF);
            }
            .tlos-chat-send {
                width: 36px;
                height: 36px;
                border-radius: 10px;
                background: linear-gradient(135deg, #1B7A5A, #22976E);
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: opacity 0.2s;
                flex-shrink: 0;
            }
            .tlos-chat-send:disabled {
                opacity: 0.4;
                cursor: not-allowed;
            }
            .tlos-chat-send svg {
                width: 16px;
                height: 16px;
                fill: white;
            }

            /* Demo banner */
            .tlos-demo-banner {
                background: linear-gradient(135deg, #D4A847, #F0DCA0);
                color: #0B1D3A;
                font-size: 11px;
                text-align: center;
                padding: 6px 12px;
                font-weight: 500;
            }

            /* Quick suggestions */
            .tlos-suggestions {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                padding: 0 16px 12px;
                background: var(--color-bg-alt, #F7F8FA);
            }
            .tlos-suggestion {
                padding: 6px 12px;
                border-radius: 20px;
                border: 1px solid var(--color-border, #E5E7EB);
                background: var(--color-surface, #FFFFFF);
                font-size: 11.5px;
                color: var(--color-text, #1F2937);
                cursor: pointer;
                transition: all 0.2s;
                font-family: inherit;
            }
            .tlos-suggestion:hover {
                border-color: #1B7A5A;
                color: #1B7A5A;
                background: #E8F5F0;
            }

            /* Responsive */
            @media (max-width: 480px) {
                .tlos-chat-panel {
                    width: calc(100vw - 20px);
                    right: 10px;
                    bottom: 80px;
                    max-height: 70vh;
                }
                .tlos-chat-toggle {
                    right: 16px;
                    bottom: 16px;
                }
            }

            /* Dark mode support */
            [data-theme="dark"] .tlos-chat-panel {
                background: #1A2744;
                border-color: #2A3A5C;
            }
            [data-theme="dark"] .tlos-chat-messages {
                background: #0F1729;
            }
            [data-theme="dark"] .tlos-chat-message.assistant {
                background: #1A2744;
                border-color: #2A3A5C;
                color: #E5E7EB;
            }
            [data-theme="dark"] .tlos-chat-input-area {
                background: #1A2744;
                border-color: #2A3A5C;
            }
            [data-theme="dark"] .tlos-chat-input {
                background: #162036;
                border-color: #2A3A5C;
                color: #E5E7EB;
            }
            [data-theme="dark"] .tlos-suggestion {
                background: #1A2744;
                border-color: #2A3A5C;
                color: #E5E7EB;
            }
            [data-theme="dark"] .tlos-suggestion:hover {
                background: rgba(27, 122, 90, 0.15);
            }
        `;
        document.head.appendChild(style);
    }

    function createWidget() {
        const engine = new ChatEngine(CHATBOT_CONFIG);

        // Toggle button
        const toggle = document.createElement('button');
        toggle.className = 'tlos-chat-toggle';
        toggle.setAttribute('aria-label', 'Open study assistant');
        toggle.innerHTML = `
            <svg class="tlos-chat-icon" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"/><path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/></svg>
            <svg class="tlos-close-icon" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        `;

        // Chat panel
        const panel = document.createElement('div');
        panel.className = 'tlos-chat-panel';
        panel.innerHTML = `
            <div class="tlos-demo-banner">PROTOTYPE — Demo responses. Connect an API for live AI answers.</div>
            <div class="tlos-chat-header">
                <div class="tlos-chat-header-icon">&#9878;</div>
                <div class="tlos-chat-header-text">
                    <h3>Study Assistant</h3>
                    <p>The Law of Sport — AI study guide</p>
                </div>
            </div>
            <div class="tlos-chat-messages" id="tlos-messages">
                <div class="tlos-chat-message assistant">
                    Hi! I'm your Sports Law study assistant. I can help you find the right lecture materials, navigate course content, and point you toward assessment guidance.<br><br>
                    What are you working on?
                </div>
            </div>
            <div class="tlos-suggestions" id="tlos-suggestions">
                <button class="tlos-suggestion" data-q="What topics does Module 4 cover?">Module 4 topics</button>
                <button class="tlos-suggestion" data-q="Where can I find information about anti-doping?">Anti-doping info</button>
                <button class="tlos-suggestion" data-q="I have a question about my assessment">Assessment help</button>
                <button class="tlos-suggestion" data-q="How do player contracts work in sport?">Player contracts</button>
            </div>
            <div class="tlos-chat-input-area">
                <textarea class="tlos-chat-input" id="tlos-input" placeholder="Ask about Sports Law..." rows="1"></textarea>
                <button class="tlos-chat-send" id="tlos-send" aria-label="Send message">
                    <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                </button>
            </div>
        `;

        document.body.appendChild(toggle);
        document.body.appendChild(panel);

        // Elements
        const messages = panel.querySelector('#tlos-messages');
        const input = panel.querySelector('#tlos-input');
        const sendBtn = panel.querySelector('#tlos-send');
        const suggestions = panel.querySelector('#tlos-suggestions');

        // Toggle open/close
        toggle.addEventListener('click', () => {
            const isOpen = panel.classList.toggle('open');
            toggle.classList.toggle('open', isOpen);
            toggle.setAttribute('aria-label', isOpen ? 'Close study assistant' : 'Open study assistant');
            if (isOpen) input.focus();
        });

        // Send message
        async function sendMessage(text) {
            if (!text.trim()) return;

            // Hide suggestions after first message
            if (suggestions) suggestions.style.display = 'none';

            // Add user message
            const userDiv = document.createElement('div');
            userDiv.className = 'tlos-chat-message user';
            userDiv.textContent = text;
            messages.appendChild(userDiv);

            input.value = '';
            input.style.height = 'auto';
            sendBtn.disabled = true;

            // Typing indicator
            const typing = document.createElement('div');
            typing.className = 'tlos-typing';
            typing.innerHTML = '<span></span><span></span><span></span>';
            messages.appendChild(typing);
            messages.scrollTop = messages.scrollHeight;

            // Simulate delay for demo
            await new Promise(r => setTimeout(r, 600 + Math.random() * 800));

            // Get response
            const response = await engine.sendMessage(text);

            // Remove typing, add response
            typing.remove();
            const assistantDiv = document.createElement('div');
            assistantDiv.className = 'tlos-chat-message assistant';
            assistantDiv.innerHTML = response;
            messages.appendChild(assistantDiv);
            messages.scrollTop = messages.scrollHeight;

            sendBtn.disabled = false;
            input.focus();
        }

        sendBtn.addEventListener('click', () => sendMessage(input.value));
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input.value);
            }
        });

        // Auto-resize textarea
        input.addEventListener('input', () => {
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 60) + 'px';
        });

        // Quick suggestion clicks
        suggestions.querySelectorAll('.tlos-suggestion').forEach(btn => {
            btn.addEventListener('click', () => sendMessage(btn.dataset.q));
        });
    }

    // =========================================================================
    // INIT
    // =========================================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { injectStyles(); createWidget(); });
    } else {
        injectStyles();
        createWidget();
    }

})();
