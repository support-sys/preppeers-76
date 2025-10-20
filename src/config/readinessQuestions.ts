// Interview Readiness Assessment Question Bank
// Static questions organized by role with 15 questions per assessment

export type QuestionCategory = 'technical' | 'behavioral' | 'scenario';

export interface ReadinessQuestion {
  id: string;
  category: QuestionCategory;
  question: string;
  options: string[];
  correctAnswer: number; // Index of correct option (0-3)
  explanation: string;
  weight: number; // 1-10 for scoring importance
}

// ============================================
// UNIVERSAL QUESTIONS (All Roles) - 5 Questions
// ============================================
const UNIVERSAL_QUESTIONS: ReadinessQuestion[] = [
  {
    id: 'U001',
    category: 'behavioral',
    question: 'What is the BEST way to structure your answer to "Tell me about yourself"?',
    options: [
      'Present role → Past experience → Why this company/role',
      'Start from childhood, education, then career chronologically',
      'List all your technical skills and certifications',
      'Talk about your hobbies and personal interests'
    ],
    correctAnswer: 0,
    explanation: 'The Present-Past-Future structure is concise, relevant, and professional. Focus on current role, highlight relevant experience, and explain your interest in this opportunity.',
    weight: 8
  },
  
  {
    id: 'U002',
    category: 'behavioral',
    question: 'When asked "What\'s your biggest weakness?", you should:',
    options: [
      'Say "I\'m a perfectionist" or "I work too hard"',
      'Share a real weakness with concrete steps you\'re taking to improve it',
      'Say you don\'t have any weaknesses',
      'Give a weakness that\'s critical for the job you\'re applying for'
    ],
    correctAnswer: 1,
    explanation: 'Show self-awareness and growth mindset. Pick a real (but not deal-breaking) weakness and demonstrate the specific actions you\'re taking to improve.',
    weight: 7
  },
  
  {
    id: 'U003',
    category: 'behavioral',
    question: 'What does STAR stand for in the STAR method for behavioral questions?',
    options: [
      'Skills, Timeline, Achievements, Results',
      'Situation, Task, Action, Result',
      'Story, Technique, Answer, Response',
      'Strategy, Tactics, Analysis, Review'
    ],
    correctAnswer: 1,
    explanation: 'STAR = Situation (set context), Task (your responsibility), Action (what you specifically did), Result (outcome with metrics). Essential framework for behavioral questions.',
    weight: 9
  },
  
  {
    id: 'U004',
    category: 'behavioral',
    question: 'The BEST question to ask at the end of an interview is:',
    options: [
      '"When do I start?" or "What\'s the salary range?"',
      '"No questions, I\'m all set"',
      '"What are the biggest challenges your team is currently facing?"',
      '"Do I have the job?"'
    ],
    correctAnswer: 2,
    explanation: 'Questions about team challenges show genuine interest and help you understand the role better. Avoid premature questions about salary/start date or having no questions at all.',
    weight: 6
  },
  
  {
    id: 'U005',
    category: 'scenario',
    question: 'The interviewer asks a question you don\'t know the answer to. You should:',
    options: [
      'Stay silent and hope they move on to the next question',
      'Make up an answer to appear knowledgeable',
      'Say "I don\'t know this specifically, but here\'s how I\'d approach finding the answer"',
      'Quickly change the topic to something you do know'
    ],
    correctAnswer: 2,
    explanation: 'Honesty + problem-solving approach wins trust. Show your thought process and learning ability rather than pretending to know everything or giving up.',
    weight: 8
  }
];

// ============================================
// FRONTEND DEVELOPER - 10 Questions
// ============================================
const FRONTEND_QUESTIONS: ReadinessQuestion[] = [
  // Technical Questions (4)
  {
    id: 'FE001',
    category: 'technical',
    question: 'What is the Virtual DOM in React?',
    options: [
      'A backup copy of the actual browser DOM',
      'A lightweight JavaScript representation of the real DOM used for efficient updates',
      'A debugging tool in React DevTools',
      'A server-side rendering optimization technique'
    ],
    correctAnswer: 1,
    explanation: 'Virtual DOM is a JavaScript object representing the actual DOM. React uses it to calculate minimal updates needed (diffing algorithm), making UI updates very efficient.',
    weight: 7
  },
  
  {
    id: 'FE002',
    category: 'technical',
    question: 'Your React component re-renders too often. What should you check FIRST?',
    options: [
      'Immediately wrap everything in React.memo()',
      'Use React DevTools Profiler to identify why it\'s re-rendering',
      'Rewrite the entire component from scratch',
      'Add more useEffect hooks to control renders'
    ],
    correctAnswer: 1,
    explanation: 'Always measure before optimizing! React DevTools Profiler shows you WHAT is re-rendering and WHY. Optimize based on actual data, not assumptions.',
    weight: 8
  },
  
  {
    id: 'FE003',
    category: 'technical',
    question: 'What is the purpose of keys in React lists?',
    options: [
      'To apply unique CSS styling to each item',
      'To help React identify which items changed, were added, or removed',
      'To make the code look more organized',
      'For search engine optimization (SEO)'
    ],
    correctAnswer: 1,
    explanation: 'Keys help React track list items across renders efficiently. Use unique, stable identifiers (not array index) to prevent bugs and improve performance.',
    weight: 6
  },
  
  {
    id: 'FE004',
    category: 'technical',
    question: 'What\'s the difference between useEffect and useLayoutEffect?',
    options: [
      'They are exactly the same, just different names',
      'useEffect runs after paint (async), useLayoutEffect runs before paint (sync)',
      'useLayoutEffect is only for animations',
      'useEffect is the newer, better version'
    ],
    correctAnswer: 1,
    explanation: 'useEffect runs asynchronously after browser paint. useLayoutEffect runs synchronously after DOM mutations but BEFORE paint. Use for DOM measurements to prevent flicker.',
    weight: 7
  },
  
  // Behavioral Questions (3)
  {
    id: 'FE005',
    category: 'behavioral',
    question: 'Code review reveals a critical bug in your code. What\'s your response?',
    options: [
      'Defend your code and argue it\'s not actually a bug',
      'Acknowledge the issue, understand it, fix it immediately, and thank the reviewer',
      'Ignore the comment and hope they forget about it',
      'Blame unclear requirements from product team'
    ],
    correctAnswer: 1,
    explanation: 'Professional response: acknowledge quickly, learn from it, fix promptly, appreciate the feedback. Code reviews are learning opportunities, not personal criticism.',
    weight: 7
  },
  
  {
    id: 'FE006',
    category: 'behavioral',
    question: 'You have 2 hours left before deadline and a complex feature to complete. You:',
    options: [
      'Rush the implementation without testing and hope it works',
      'Communicate the constraint, deliver a working MVP, and set timeline for full completion',
      'Work overnight without informing anyone',
      'Mark it as done in Jira without actual implementation'
    ],
    correctAnswer: 1,
    explanation: 'Transparency wins. Communicate constraints early, deliver working subset (not broken feature), set clear expectations. Quality matters more than rushed, broken code.',
    weight: 8
  },
  
  {
    id: 'FE007',
    category: 'behavioral',
    question: 'A teammate\'s poor code quality is slowing down the team. How do you handle it?',
    options: [
      'Complain about them to other teammates',
      'Silently fix their code without telling them',
      'Bring it up in team retrospective or offer to pair program with them',
      'Escalate directly to their manager'
    ],
    correctAnswer: 2,
    explanation: 'Constructive approach: team retrospective (addresses systemically) or pair programming (collaborative improvement). Avoid gossip or premature escalation.',
    weight: 7
  },
  
  // Scenario Questions (3)
  {
    id: 'FE008',
    category: 'scenario',
    question: 'Your production app crashes and users are complaining. What\'s your FIRST step?',
    options: [
      'Start debugging the code line by line',
      'Check error monitoring (Sentry/LogRocket), assess impact, rollback if critical, then debug',
      'Panic and call everyone on the team',
      'Wait for more bug reports to understand the pattern'
    ],
    correctAnswer: 1,
    explanation: 'Incident response: Check monitoring for scope/impact, rollback to stable version if critical, communicate to stakeholders, then debug systematically with data.',
    weight: 9
  },
  
  {
    id: 'FE009',
    category: 'scenario',
    question: 'Product manager wants a feature that violates accessibility best practices. You:',
    options: [
      'Refuse to build it and escalate immediately',
      'Build it exactly as requested without discussion',
      'Explain accessibility concerns with data, suggest alternatives, document decision if overruled',
      'Build it but complain to the team about poor decisions'
    ],
    correctAnswer: 2,
    explanation: 'Professional collaboration: voice technical/ethical concerns with data, offer alternatives, respect final decision while documenting risks. You\'re partners in product success.',
    weight: 8
  },
  
  {
    id: 'FE010',
    category: 'scenario',
    question: 'You need to learn React for a project starting in 2 weeks. Your approach?',
    options: [
      'Watch random YouTube tutorials until project starts',
      'Read the entire React documentation cover-to-cover',
      'Build a small project (todo app/blog) covering key concepts, reference docs as needed',
      'Ask teammates to handle React parts while you do CSS'
    ],
    correctAnswer: 2,
    explanation: 'Learn by doing: build a practical project, focus on concepts you\'ll actually use, supplement with official docs. Balance speed with understanding depth.',
    weight: 7
  }
];

// ============================================
// BACKEND DEVELOPER - 10 Questions
// ============================================
const BACKEND_QUESTIONS: ReadinessQuestion[] = [
  // Technical Questions (4)
  {
    id: 'BE001',
    category: 'technical',
    question: 'What is the N+1 query problem in databases?',
    options: [
      'A SQL syntax error involving N+1 tables',
      'Making 1 query to fetch N records, then N additional queries in a loop',
      'Having N+1 database connections simultaneously',
      'A performance optimization design pattern'
    ],
    correctAnswer: 1,
    explanation: 'N+1 problem: 1 query fetches N records, then you loop and make N more individual queries. Solution: Use JOINs, eager loading, or batch queries to reduce to 1-2 queries total.',
    weight: 8
  },
  
  {
    id: 'BE002',
    category: 'technical',
    question: 'What\'s the difference between authentication and authorization?',
    options: [
      'They are the same thing with different names',
      'Authentication = verifying who you are, Authorization = verifying what you can access',
      'Authorization always happens before authentication',
      'Authentication is for APIs only, Authorization is for web apps'
    ],
    correctAnswer: 1,
    explanation: 'Authentication verifies identity (who are you? - login). Authorization verifies permissions (what can you do? - access control). Always authenticate first, then authorize.',
    weight: 7
  },
  
  {
    id: 'BE003',
    category: 'technical',
    question: 'What does it mean for a REST API operation to be idempotent?',
    options: [
      'The API call completes very quickly',
      'Making the same request multiple times produces the same result',
      'Using the same endpoint for different resources',
      'The API requires authentication'
    ],
    correctAnswer: 1,
    explanation: 'Idempotent = same effect regardless of how many times called. GET, PUT, DELETE should be idempotent. POST usually isn\'t. Critical for reliability and retries.',
    weight: 7
  },
  
  {
    id: 'BE004',
    category: 'technical',
    question: 'Why use database indexes? What\'s the trade-off?',
    options: [
      'To organize database tables alphabetically',
      'Speed up SELECT queries, but slow down INSERT/UPDATE/DELETE operations',
      'To prevent duplicate data entries',
      'To automatically backup the database'
    ],
    correctAnswer: 1,
    explanation: 'Indexes create sorted data structures for fast lookups (B-trees). Trade-off: faster reads, slower writes. Index columns used in WHERE, JOIN, ORDER BY clauses.',
    weight: 6
  },
  
  // Behavioral Questions (3)
  {
    id: 'BE005',
    category: 'behavioral',
    question: 'You discover a security vulnerability in production code. What\'s your action plan?',
    options: [
      'Fix it quietly without alerting anyone to avoid panic',
      'Post about it on Twitter to warn users',
      'Immediately inform security team, assess impact, create hotfix, document incident',
      'Schedule it for the next sprint planning'
    ],
    correctAnswer: 2,
    explanation: 'Security incidents need immediate action: inform stakeholders, assess scope/severity, patch quickly, communicate appropriately, conduct post-mortem to prevent recurrence.',
    weight: 9
  },
  
  {
    id: 'BE006',
    category: 'behavioral',
    question: 'A junior developer asks for help debugging. You\'re in a deadline crunch. You:',
    options: [
      'Tell them you\'re too busy, they need to figure it out',
      'Do the debugging for them to save time',
      'Spend 10 minutes guiding them, share debugging resources, offer to help later if still stuck',
      'Ignore their message until after the deadline'
    ],
    correctAnswer: 2,
    explanation: 'Balance helping with deadlines. Quick guidance + resources empowers them to learn. Doing it for them creates dependency. Communication prevents future bottlenecks.',
    weight: 7
  },
  
  {
    id: 'BE007',
    category: 'behavioral',
    question: 'Your team wants to adopt a new technology you\'re unfamiliar with. You:',
    options: [
      'Reject it because you don\'t know it',
      'Research pros/cons, build a small proof-of-concept, discuss trade-offs with team',
      'Agree immediately without any research',
      'Insist on using only technologies you already know'
    ],
    correctAnswer: 1,
    explanation: 'Balanced approach: research objectively, validate with POC, discuss trade-offs (not opinions). Be open to new tech but evaluate critically. Neither blind adoption nor rejection.',
    weight: 7
  },
  
  // Scenario Questions (3)
  {
    id: 'BE008',
    category: 'scenario',
    question: 'Your API response time suddenly becomes 10x slower. What do you investigate FIRST?',
    options: [
      'Immediately provision more servers',
      'Check recent deployments, database slow query logs, and resource utilization metrics',
      'Start rewriting the entire API codebase',
      'Blame the database team or network issues'
    ],
    correctAnswer: 1,
    explanation: 'Systematic debugging: Check what changed (recent deployments), measure (DB query times, CPU, memory), identify bottleneck with data. Don\'t scale before understanding root cause.',
    weight: 9
  },
  
  {
    id: 'BE009',
    category: 'scenario',
    question: 'Your database is at 95% storage capacity. What\'s your immediate action?',
    options: [
      'Start randomly deleting old data',
      'Analyze table sizes, archive historical data, add storage, plan long-term retention policy',
      'Just add more disk space and ignore the problem',
      'Wait until it reaches 100% to see what breaks'
    ],
    correctAnswer: 1,
    explanation: 'Multi-layered approach: immediate relief (add space), tactical fix (archive old data), strategic solution (retention policy, partitioning). Never delete data without analysis.',
    weight: 8
  },
  
  {
    id: 'BE010',
    category: 'scenario',
    question: 'You discover significant tech debt slowing development. How do you address it?',
    options: [
      'Ignore it and keep building new features',
      'Stop all feature work to fix all tech debt',
      'Quantify the impact, propose incremental refactoring plan, get stakeholder buy-in',
      'Complain about it in team meetings but take no action'
    ],
    correctAnswer: 2,
    explanation: 'Business case for tech debt: quantify impact with metrics, propose incremental fixes (not big-bang rewrite), balance with feature delivery. Get leadership alignment.',
    weight: 8
  }
];

// ============================================
// DEVOPS ENGINEER - 10 Questions
// ============================================
const DEVOPS_QUESTIONS: ReadinessQuestion[] = [
  // Technical Questions (4)
  {
    id: 'DO001',
    category: 'technical',
    question: 'What is Infrastructure as Code (IaC)?',
    options: [
      'Writing code comments about infrastructure setup',
      'Managing infrastructure through declarative code/config files instead of manual setup',
      'Coding applications directly on production servers',
      'A specific cloud provider service'
    ],
    correctAnswer: 1,
    explanation: 'IaC = defining infrastructure (servers, networks, security) in code (Terraform, CloudFormation, Ansible). Benefits: version control, reproducibility, automation, disaster recovery.',
    weight: 8
  },
  
  {
    id: 'DO002',
    category: 'technical',
    question: 'In CI/CD pipelines, what does CI stand for and why is it important?',
    options: [
      'Cloud Integration for deploying to cloud',
      'Continuous Integration - frequently merging code and running automated tests',
      'Code Inspection for quality checks',
      'Centralized Infrastructure management'
    ],
    correctAnswer: 1,
    explanation: 'CI = Continuous Integration: developers merge code frequently, automated tests run, bugs caught early. Reduces integration hell. CD = Continuous Deployment/Delivery.',
    weight: 6
  },
  
  {
    id: 'DO003',
    category: 'technical',
    question: 'What is a Docker container and how is it different from a virtual machine?',
    options: [
      'Containers and VMs are exactly the same',
      'Container = lightweight app package with dependencies; shares OS kernel unlike VMs',
      'Containers are only for microservices',
      'VMs are better in every way'
    ],
    correctAnswer: 1,
    explanation: 'Containers package app + dependencies in isolated environment, share host OS kernel (lightweight). VMs include entire OS (heavier). Containers: faster startup, better resource efficiency.',
    weight: 7
  },
  
  {
    id: 'DO004',
    category: 'technical',
    question: 'What is Kubernetes (K8s) primarily used for?',
    options: [
      'Version control for infrastructure code',
      'Orchestrating and managing containerized applications at scale',
      'Monitoring application logs and metrics',
      'Database replication and backup'
    ],
    correctAnswer: 1,
    explanation: 'Kubernetes orchestrates containers: automated deployment, scaling, load balancing, self-healing, rolling updates. Essential for managing microservices at scale.',
    weight: 7
  },
  
  // Behavioral Questions (3)
  {
    id: 'DO005',
    category: 'behavioral',
    question: 'Production goes down at 2 AM and you\'re on call. What\'s your first step?',
    options: [
      'Start making changes randomly to fix it',
      'Check monitoring/logs, assess impact, rollback if possible, communicate to stakeholders, then debug',
      'Wake up the entire engineering team immediately',
      'Turn off your phone and deal with it in the morning'
    ],
    correctAnswer: 1,
    explanation: 'Incident response: Assess (what\'s down, how many affected), Mitigate (rollback/workaround), Communicate (stakeholders), Resolve (root cause), Post-mortem (prevent recurrence).',
    weight: 9
  },
  
  {
    id: 'DO006',
    category: 'behavioral',
    question: 'Your automation script fails during a critical deployment. You:',
    options: [
      'Manually deploy everything and fix the script later',
      'Rollback deployment, investigate failure locally, fix and test script, then re-deploy',
      'Keep retrying the broken script hoping it works eventually',
      'Blame the developer who made the last commit'
    ],
    correctAnswer: 1,
    explanation: 'Safety first in production: rollback to stable state, debug in non-prod environment, fix properly, test thoroughly, then deploy. Never rush fixes in production.',
    weight: 8
  },
  
  {
    id: 'DO007',
    category: 'behavioral',
    question: 'Developers complain the CI/CD pipeline is too slow (30 min builds). You:',
    options: [
      'Tell them that\'s just how long it takes',
      'Remove test suite to make it faster',
      'Analyze pipeline metrics, identify bottlenecks, parallelize tests, cache dependencies',
      'Just add more powerful build servers'
    ],
    correctAnswer: 2,
    explanation: 'Developer experience matters! Measure build stages, parallelize tests, cache dependencies, optimize Docker layers. Balance speed with reliability. Data-driven optimization.',
    weight: 7
  },
  
  // Scenario Questions (3)
  {
    id: 'DO008',
    category: 'scenario',
    question: 'Server CPU usage suddenly spikes to 100%. Your debugging approach?',
    options: [
      'Immediately restart the server',
      'Check top/htop for processes, review recent deployments, analyze application logs, then scale if needed',
      'Just add more CPU cores',
      'Ignore it if end users aren\'t complaining yet'
    ],
    correctAnswer: 1,
    explanation: 'Systematic debugging: Identify the consuming process (top/htop), check recent changes (deployments), review logs/metrics, understand root cause before scaling resources.',
    weight: 8
  },
  
  {
    id: 'DO009',
    category: 'scenario',
    question: 'How should you handle secrets (API keys, database passwords) in your infrastructure?',
    options: [
      'Hard-code them directly in application code',
      'Store them in Git repository in config files',
      'Use secret management tools (HashiCorp Vault, AWS Secrets Manager) with encryption and rotation',
      'Share them in team Slack channel for easy access'
    ],
    correctAnswer: 2,
    explanation: 'NEVER commit secrets to Git! Use dedicated secret management (Vault, AWS Secrets Manager), encrypt at rest and in transit, rotate regularly, audit access strictly.',
    weight: 9
  },
  
  {
    id: 'DO010',
    category: 'scenario',
    question: 'You want to deploy a new monitoring solution. What\'s the best approach?',
    options: [
      'Deploy directly to production to test it with real traffic',
      'Test in staging environment, document setup, deploy to prod with rollback plan and monitoring',
      'Let someone else handle the deployment',
      'Deploy it and hope everything works fine'
    ],
    correctAnswer: 1,
    explanation: 'Professional deployment: test thoroughly in non-prod, document for team knowledge, have rollback plan ready, monitor post-deployment. Infrastructure changes need careful handling.',
    weight: 7
  }
];

// ============================================
// MOBILE DEVELOPER - 10 Questions
// ============================================
const MOBILE_QUESTIONS: ReadinessQuestion[] = [
  // Technical Questions (4)
  {
    id: 'MB001',
    category: 'technical',
    question: 'What\'s the difference between native and cross-platform mobile development?',
    options: [
      'Native apps are always better, cross-platform is outdated',
      'Native uses platform-specific languages (Swift/Kotlin), cross-platform shares code (React Native/Flutter)',
      'There is no real difference',
      'Cross-platform apps don\'t work for production apps'
    ],
    correctAnswer: 1,
    explanation: 'Native = Swift/Kotlin, platform-specific. Cross-platform = React Native/Flutter, shared codebase. Trade-offs: native has better performance, cross-platform faster development.',
    weight: 7
  },
  
  {
    id: 'MB002',
    category: 'technical',
    question: 'What is the purpose of state management (Redux/MobX) in mobile apps?',
    options: [
      'For styling and theming the UI',
      'To manage and share application data across screens and components',
      'To save data to phone storage',
      'For navigation between screens'
    ],
    correctAnswer: 1,
    explanation: 'State management handles app-wide data flow, ensures consistency across screens, prevents prop drilling. Critical for complex apps with shared state.',
    weight: 7
  },
  
  {
    id: 'MB003',
    category: 'technical',
    question: 'Why is performance optimization crucial for mobile apps?',
    options: [
      'It only matters for gaming apps',
      'Poor performance leads to user uninstalls, bad reviews, and low retention',
      'Modern phones are fast enough, optimization doesn\'t matter',
      'Optimization is only needed for Android, not iOS'
    ],
    correctAnswer: 1,
    explanation: 'Mobile users are impatient. Slow apps get 1-star reviews and uninstalls. Optimize: app size, startup time, memory usage, battery consumption, network efficiency.',
    weight: 6
  },
  
  {
    id: 'MB004',
    category: 'technical',
    question: 'Best practice for handling API calls in mobile apps?',
    options: [
      'Make API calls directly from UI components without any error handling',
      'Implement loading states, error handling, retry logic, caching, and offline support',
      'Never cache API responses to always get fresh data',
      'Only make API calls when app starts'
    ],
    correctAnswer: 1,
    explanation: 'Robust mobile API handling: loading states (UX), comprehensive error handling, retry logic (poor connectivity), response caching (performance), offline mode (user experience).',
    weight: 8
  },
  
  // Behavioral Questions (3)
  {
    id: 'MB005',
    category: 'behavioral',
    question: 'iOS App Store rejects your app submission. You:',
    options: [
      'Argue with Apple reviewer',
      'Review rejection reasons, fix issues, improve app store listing, resubmit with notes',
      'Give up and only focus on Android',
      'Resubmit the same app without changes'
    ],
    correctAnswer: 1,
    explanation: 'Professional response: understand rejection reasons thoroughly, address all issues, improve metadata/screenshots, provide reviewer notes. App store approval is iterative.',
    weight: 7
  },
  
  {
    id: 'MB006',
    category: 'behavioral',
    question: 'Users report your app drains battery quickly. How do you investigate?',
    options: [
      'Tell users to buy better phones',
      'Use profiling tools (Xcode Instruments/Android Profiler), check background tasks, optimize',
      'Ignore complaints from a few users',
      'Remove features until battery usage improves'
    ],
    correctAnswer: 1,
    explanation: 'Data-driven debugging: use platform profiling tools, identify battery-heavy operations (location, network, background tasks), optimize culprits. User experience priority.',
    weight: 8
  },
  
  {
    id: 'MB007',
    category: 'behavioral',
    question: 'Design team provides mockups that are technically challenging to implement. You:',
    options: [
      'Tell them it\'s impossible and refuse',
      'Build it exactly as designed even if it performs poorly',
      'Explain technical challenges, suggest alternatives that maintain design intent, collaborate on solution',
      'Build a completely different design without telling them'
    ],
    correctAnswer: 2,
    explanation: 'Collaborative problem-solving: explain constraints clearly, suggest alternatives that preserve user experience, find middle ground. Design and engineering should work together.',
    weight: 7
  },
  
  // Scenario Questions (3)
  {
    id: 'MB008',
    category: 'scenario',
    question: 'Your app crashes only on specific Android devices. Debugging approach?',
    options: [
      'Drop support for those devices',
      'Check crash logs (Firebase Crashlytics), identify device/OS patterns, test on similar device, fix compatibility',
      'Tell users to buy newer phones',
      'Remove features randomly until crashes stop'
    ],
    correctAnswer: 1,
    explanation: 'Systematic mobile debugging: use crash reporting (Crashlytics), identify affected device/OS versions, reproduce locally or use cloud testing, fix compatibility issues professionally.',
    weight: 8
  },
  
  {
    id: 'MB009',
    category: 'scenario',
    question: 'How do you handle offline mode in your mobile app?',
    options: [
      'Disable all features when offline',
      'Implement local database (SQLite/Realm), queue mutations, sync when online, show cached data',
      'Just show an error message',
      'Offline mode is not necessary for mobile apps'
    ],
    correctAnswer: 1,
    explanation: 'Offline-first approach: local storage for data, queue write operations, sync when connected, show cached content. Essential for mobile where connectivity varies.',
    weight: 8
  },
  
  {
    id: 'MB010',
    category: 'scenario',
    question: 'App store reviews complain about confusing navigation. You:',
    options: [
      'Ignore reviews and focus on features',
      'Completely redesign navigation without user research',
      'Analyze user behavior data, conduct usability testing, iterate on navigation improvements',
      'Blame users for not understanding the app'
    ],
    correctAnswer: 2,
    explanation: 'User-centric approach: analyze in-app analytics, conduct usability tests, gather feedback, iterate incrementally. Navigation is critical for mobile UX.',
    weight: 7
  }
];

// ============================================
// FULL STACK DEVELOPER - 10 Questions
// ============================================
const FULLSTACK_QUESTIONS: ReadinessQuestion[] = [
  // Mix of Frontend and Backend (4 technical)
  {
    id: 'FS001',
    category: 'technical',
    question: 'What is a RESTful API and what are its key principles?',
    options: [
      'An API that never fails or crashes',
      'An API following REST principles: stateless, resource-based URLs, standard HTTP methods',
      'An API built with the REST.js framework',
      'Any API that returns JSON data'
    ],
    correctAnswer: 1,
    explanation: 'REST = Representational State Transfer. Principles: stateless communication, resource-based URLs (/users/123), HTTP methods (GET, POST, PUT, DELETE), standard status codes.',
    weight: 7
  },
  
  {
    id: 'FS002',
    category: 'technical',
    question: 'When should you use SQL vs NoSQL databases?',
    options: [
      'NoSQL is newer so always use it',
      'SQL for structured data with relations, NoSQL for flexible schema and horizontal scaling needs',
      'They solve the same problems',
      'SQL for small apps, NoSQL for big data only'
    ],
    correctAnswer: 1,
    explanation: 'SQL (PostgreSQL, MySQL) = structured, relational, ACID guarantees, complex queries. NoSQL (MongoDB, DynamoDB) = flexible schema, horizontal scaling. Choose based on data structure and scale.',
    weight: 7
  },
  
  {
    id: 'FS003',
    category: 'technical',
    question: 'What is CORS and why does it exist?',
    options: [
      'A React library for API calls',
      'Cross-Origin Resource Sharing - security feature preventing unauthorized cross-domain requests',
      'A CSS styling framework',
      'A database query optimization technique'
    ],
    correctAnswer: 1,
    explanation: 'CORS = browser security preventing scripts from one origin accessing resources from another origin without permission. Configure server to allow specific origins for legitimate cross-domain requests.',
    weight: 6
  },
  
  {
    id: 'FS004',
    category: 'technical',
    question: 'What is the purpose of environment variables in applications?',
    options: [
      'To make code run faster',
      'To store configuration that changes between environments (dev/staging/prod) without code changes',
      'For debugging purposes only',
      'To encrypt sensitive data'
    ],
    correctAnswer: 1,
    explanation: 'Environment variables separate config from code: different DB connections, API keys, feature flags per environment. Never hard-code environment-specific values.',
    weight: 7
  },
  
  // Behavioral Questions (3)
  {
    id: 'FS005',
    category: 'behavioral',
    question: 'Frontend and backend teams blame each other for a bug. You:',
    options: [
      'Take sides with your primary team',
      'Ignore the conflict and focus on your work',
      'Facilitate debugging session, check API contracts, reproduce issue, identify actual root cause',
      'Tell them to figure it out themselves'
    ],
    correctAnswer: 2,
    explanation: 'Full-stack advantage: bridge teams, check integration points (API contracts, data flow), reproduce end-to-end, find root cause with data. Collaboration over blame.',
    weight: 8
  },
  
  {
    id: 'FS006',
    category: 'behavioral',
    question: 'You need to implement a feature touching both frontend and backend. You:',
    options: [
      'Build frontend first, then backend',
      'Design API contract first, build backend and frontend in parallel, integration test last',
      'Build everything in one giant pull request',
      'Let separate teams handle each part without coordination'
    ],
    correctAnswer: 1,
    explanation: 'API-first approach: agree on contract (OpenAPI spec), allows parallel development, reduces integration issues, enables better testing. End with integration testing.',
    weight: 8
  },
  
  {
    id: 'FS007',
    category: 'behavioral',
    question: 'You\'re the only full-stack developer. Frontend AND backend have critical bugs. You:',
    options: [
      'Work on whichever seems easier first',
      'Assess business impact, fix user-facing critical issue first, communicate timeline for second',
      'Try to fix both simultaneously',
      'Escalate to manager and wait for direction'
    ],
    correctAnswer: 1,
    explanation: 'Prioritization by impact: assess which affects more users/revenue, communicate clearly about sequencing, focus for quality. Multitasking on critical bugs leads to mistakes.',
    weight: 8
  },
  
  // Scenario Questions (3)
  {
    id: 'FS008',
    category: 'scenario',
    question: 'Users report data discrepancy between frontend display and database. How do you debug?',
    options: [
      'Blame the backend team',
      'Check API response in browser DevTools, compare with DB query, check data transformations, identify mismatch point',
      'Clear browser cache and hope it fixes itself',
      'Tell users to refresh the page'
    ],
    correctAnswer: 1,
    explanation: 'End-to-end debugging: DB → API response → Frontend state → UI display. Check each layer, compare values, identify where transformation/display breaks. Systematic approach.',
    weight: 9
  },
  
  {
    id: 'FS009',
    category: 'scenario',
    question: 'How do you handle authentication in a full-stack application?',
    options: [
      'Store passwords in plain text in the database',
      'Use JWT/sessions for auth, hash passwords (bcrypt), implement refresh tokens, secure HTTP-only cookies',
      'Just use Basic Auth with username/password',
      'Authentication is not necessary for most apps'
    ],
    correctAnswer: 1,
    explanation: 'Secure auth stack: hash passwords (bcrypt/argon2), use JWT with refresh tokens, HTTP-only cookies, HTTPS only, implement session management and logout. Security is critical.',
    weight: 9
  },
  
  {
    id: 'FS010',
    category: 'scenario',
    question: 'Your application needs to scale to 10x users. What do you consider?',
    options: [
      'Just add more servers randomly',
      'Profile bottlenecks, implement caching, optimize DB queries, consider CDN, horizontal scaling strategy',
      'Rewrite the entire application from scratch',
      'Tell users to wait for the slow responses'
    ],
    correctAnswer: 1,
    explanation: 'Scalability strategy: measure current bottlenecks, implement caching (Redis), optimize DB (indexes, queries), CDN for static assets, horizontal scaling for stateless services.',
    weight: 9
  }
];

// ============================================
// QA ENGINEER - 10 Questions
// ============================================
const QA_QUESTIONS: ReadinessQuestion[] = [
  {
    id: 'QA001',
    category: 'technical',
    question: 'What is the testing pyramid and why is it important?',
    options: [
      'A project management tool',
      'More unit tests at bottom, fewer integration tests in middle, few E2E tests at top - balances speed and coverage',
      'All tests should be E2E for best coverage',
      'A hierarchy of testing team roles'
    ],
    correctAnswer: 1,
    explanation: 'Testing pyramid: many fast unit tests (base), fewer integration tests (middle), few slow E2E tests (top). Balances coverage, speed, and maintenance cost.',
    weight: 8
  },
  
  {
    id: 'QA002',
    category: 'technical',
    question: 'Difference between manual and automated testing?',
    options: [
      'Manual testing is always better for finding bugs',
      'Manual is human-exploratory, Automated is scripted-repeatable. Both are needed.',
      'Automation will replace all manual testing soon',
      'Manual testing is outdated'
    ],
    correctAnswer: 1,
    explanation: 'Manual = exploratory, usability, edge cases, human judgment. Automated = regression, repeatability, speed, consistency. Best QA strategy uses both strategically.',
    weight: 7
  },
  
  {
    id: 'QA003',
    category: 'technical',
    question: 'What is regression testing?',
    options: [
      'Testing only new features',
      'Re-testing existing functionality to ensure new changes didn\'t break anything',
      'Testing backwards compatibility',
      'Performance testing under load'
    ],
    correctAnswer: 1,
    explanation: 'Regression testing ensures new code doesn\'t break existing features. Should be automated for efficiency. Run on every release to catch unintended side effects.',
    weight: 7
  },
  
  {
    id: 'QA004',
    category: 'technical',
    question: 'What makes a good bug report?',
    options: [
      'Just say "It\'s broken, fix it"',
      'Steps to reproduce, expected vs actual behavior, environment details, screenshots/logs',
      'Write a long essay about all possible causes',
      'Only mention the symptom without context'
    ],
    correctAnswer: 1,
    explanation: 'Good bug report: clear title, reproduction steps, expected vs actual, environment (browser/OS), screenshots, logs. Helps developers fix faster and builds respect.',
    weight: 7
  },
  
  // Behavioral + Scenario (6)
  {
    id: 'QA005',
    category: 'behavioral',
    question: 'You find a critical bug 1 hour before release. You:',
    options: [
      'Stay quiet and let it go to production',
      'Immediately report to team, assess severity, recommend delay if critical, document',
      'Try to fix it yourself quickly without telling anyone',
      'Report it but say it\'s probably fine'
    ],
    correctAnswer: 1,
    explanation: 'Quality gate responsibility: report immediately, assess impact honestly, recommend delay if warranted, document decision. Better to delay than ship critical bugs.',
    weight: 9
  },
  
  {
    id: 'QA006',
    category: 'scenario',
    question: 'Developers push back on your bug reports saying they\'re "not real bugs". You:',
    options: [
      'Stop reporting bugs to avoid conflict',
      'Present evidence (steps, screenshots, user impact), document in tracking system, escalate if needed',
      'Argue aggressively to prove you\'re right',
      'Just mark them as closed'
    ],
    correctAnswer: 1,
    explanation: 'Professional persistence: provide clear evidence, focus on user impact, use bug tracking system for transparency, escalate constructively if dismissed without investigation.',
    weight: 8
  },
  
  {
    id: 'QA007',
    category: 'scenario',
    question: 'You have 100 test cases but only 2 days before release. You:',
    options: [
      'Skip testing and hope for the best',
      'Run all 100 tests even if you don\'t finish',
      'Prioritize critical path and high-risk areas, automate where possible, document coverage',
      'Tell team testing is impossible in this timeline'
    ],
    correctAnswer: 2,
    explanation: 'Risk-based testing: prioritize critical user flows, high-risk areas, recent changes. Automate smoke tests. Document what was/wasn\'t tested. Communicate coverage honestly.',
    weight: 8
  },
  
  {
    id: 'QA008',
    category: 'scenario',
    question: 'Automated tests are flaky (pass/fail randomly). You:',
    options: [
      'Just keep re-running until they pass',
      'Ignore flaky tests',
      'Investigate root cause (timing issues, test data, dependencies), fix or quarantine until stable',
      'Delete the flaky tests'
    ],
    correctAnswer: 2,
    explanation: 'Flaky tests destroy confidence in test suite. Investigate causes (race conditions, test isolation, external dependencies), fix properly, or quarantine and track until fixed.',
    weight: 7
  },
  
  {
    id: 'QA009',
    category: 'behavioral',
    question: 'Product wants to skip testing to meet deadline. You:',
    options: [
      'Agree to skip testing to be a team player',
      'Refuse and threaten to escalate',
      'Explain risks with data, propose minimum viable testing, document decision if overruled',
      'Secretly test anyway without telling them'
    ],
    correctAnswer: 2,
    explanation: 'Risk communication: quantify risks (what could break, user impact), propose minimum critical testing, respect final decision while documenting. Professional pushback with data.',
    weight: 8
  },
  
  {
    id: 'QA010',
    category: 'scenario',
    question: 'How do you test a payment flow without charging real money?',
    options: [
      'Use production payment gateway with real cards',
      'Use sandbox/test mode of payment gateway with test credentials and verify all states',
      'Skip payment testing, too risky',
      'Just test the UI, not actual transactions'
    ],
    correctAnswer: 1,
    explanation: 'Payment testing: use sandbox mode, test all scenarios (success, failure, timeout, retry), verify webhooks, check database states. Never test payments in production.',
    weight: 8
  }
];

// ============================================
// QUESTION BANK MAPPING
// ============================================
const ROLE_QUESTION_BANK: Record<string, ReadinessQuestion[]> = {
  'Frontend Developer': FRONTEND_QUESTIONS,
  'Backend Developer': BACKEND_QUESTIONS,
  'Java Backend Developer': BACKEND_QUESTIONS, // Reuse backend questions
  '.NET Backend Developer': BACKEND_QUESTIONS, // Reuse backend questions
  'Full Stack Developer': FULLSTACK_QUESTIONS,
  'DevOps Engineer': DEVOPS_QUESTIONS,
  'Cloud Engineer': DEVOPS_QUESTIONS, // Similar to DevOps
  'Mobile Developer': MOBILE_QUESTIONS,
  'Mobile Developer (iOS)': MOBILE_QUESTIONS,
  'Mobile Developer (Android)': MOBILE_QUESTIONS,
  'Mobile Developer (Cross-Platform)': MOBILE_QUESTIONS,
  'QA Engineer': QA_QUESTIONS,
  'Test Engineer': QA_QUESTIONS
};

// ============================================
// MAIN EXPORT FUNCTION
// ============================================
export const getQuestionsForRole = (targetRole: string): ReadinessQuestion[] => {
  // Get universal questions (5 questions)
  const universalQuestions = UNIVERSAL_QUESTIONS;
  
  // Get role-specific questions (10 questions)
  const roleSpecific = ROLE_QUESTION_BANK[targetRole] || BACKEND_QUESTIONS; // Fallback to backend
  
  // Combine: 5 universal + 10 role-specific = 15 total
  return [...universalQuestions, ...roleSpecific];
};

// Get all available roles for dropdown
export const getAvailableRoles = (): string[] => {
  return Object.keys(ROLE_QUESTION_BANK).sort();
};

// Export for testing
export { UNIVERSAL_QUESTIONS, FRONTEND_QUESTIONS, BACKEND_QUESTIONS, DEVOPS_QUESTIONS, MOBILE_QUESTIONS, FULLSTACK_QUESTIONS, QA_QUESTIONS };






