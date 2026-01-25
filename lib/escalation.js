/**
 * Escalation keywords that trigger human intervention
 */
const ESCALATION_KEYWORDS = [
  'cancel',
  'cancellation',
  'cancel my',
  'refund',
  'money back',
  'speak to someone',
  'talk to someone',
  'human',
  'manager',
  'supervisor',
  'complaint',
  'sue',
  'lawsuit',
  'legal',
  'attorney',
  'lawyer'
];

/**
 * Profanity words (common ones - can be expanded)
 */
const PROFANITY_WORDS = [
  'damn',
  'hell',
  'crap',
  'screw',
  'piss',
  'ass',
  'bitch',
  'bastard'
];

/**
 * Check if message contains escalation keywords
 */
export function checkEscalationKeywords(message) {
  const messageLower = message.toLowerCase();
  
  for (const keyword of ESCALATION_KEYWORDS) {
    if (messageLower.includes(keyword)) {
      return {
        shouldEscalate: true,
        reason: `Keyword detected: "${keyword}"`,
        keyword: keyword
      };
    }
  }
  
  return { shouldEscalate: false };
}

/**
 * Check if message contains profanity
 */
export function checkProfanity(message) {
  const messageLower = message.toLowerCase();
  const words = messageLower.split(/\s+/);
  
  for (const word of words) {
    if (PROFANITY_WORDS.some(profanity => word.includes(profanity))) {
      return {
        shouldEscalate: true,
        reason: 'Profanity detected',
        word: word
      };
    }
  }
  
  return { shouldEscalate: false };
}

/**
 * Simple sentiment analysis - check for negative indicators
 */
export function checkNegativeSentiment(message) {
  const messageLower = message.toLowerCase();
  
  const negativeIndicators = [
    'terrible',
    'awful',
    'horrible',
    'worst',
    'hate',
    'disgusted',
    'furious',
    'angry',
    'frustrated',
    'disappointed',
    'unacceptable',
    'ridiculous',
    'absurd',
    'pathetic'
  ];
  
  const negativeCount = negativeIndicators.filter(indicator => 
    messageLower.includes(indicator)
  ).length;
  
  // If multiple negative indicators, likely frustrated
  if (negativeCount >= 2) {
    return {
      shouldEscalate: true,
      reason: 'Multiple negative sentiment indicators detected',
      negativeCount: negativeCount
    };
  }
  
  return { shouldEscalate: false };
}

/**
 * Check if client explicitly requests human
 */
export function checkHumanRequest(message) {
  const messageLower = message.toLowerCase();
  
  const humanRequestPatterns = [
    /(?:i\s+)?(?:want|need|would like|would love)\s+(?:to\s+)?(?:speak|talk)\s+(?:to|with)\s+(?:a\s+)?(?:human|person|someone|agent|representative)/i,
    /(?:can|could|may)\s+(?:i\s+)?(?:speak|talk)\s+(?:to|with)\s+(?:a\s+)?(?:human|person|someone|agent|representative)/i,
    /(?:let|get)\s+(?:me\s+)?(?:speak|talk)\s+(?:to|with)\s+(?:a\s+)?(?:human|person|someone|agent|representative)/i,
    /(?:connect|transfer)\s+(?:me\s+)?(?:to|with)\s+(?:a\s+)?(?:human|person|someone|agent|representative)/i
  ];
  
  for (const pattern of humanRequestPatterns) {
    if (pattern.test(message)) {
      return {
        shouldEscalate: true,
        reason: 'Explicit request for human agent',
        matchedPattern: pattern.toString()
      };
    }
  }
  
  return { shouldEscalate: false };
}

/**
 * Comprehensive escalation check
 */
export function shouldEscalate(message) {
  // Check keywords
  const keywordCheck = checkEscalationKeywords(message);
  if (keywordCheck.shouldEscalate) {
    return keywordCheck;
  }
  
  // Check profanity
  const profanityCheck = checkProfanity(message);
  if (profanityCheck.shouldEscalate) {
    return profanityCheck;
  }
  
  // Check human request
  const humanRequestCheck = checkHumanRequest(message);
  if (humanRequestCheck.shouldEscalate) {
    return humanRequestCheck;
  }
  
  // Check sentiment
  const sentimentCheck = checkNegativeSentiment(message);
  if (sentimentCheck.shouldEscalate) {
    return sentimentCheck;
  }
  
  return { shouldEscalate: false };
}

/**
 * Determine escalation reason from multiple checks
 */
export function getEscalationReason(message) {
  const escalation = shouldEscalate(message);
  
  if (!escalation.shouldEscalate) {
    return null;
  }
  
  return escalation.reason || 'Escalation triggered';
}
