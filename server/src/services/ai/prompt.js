export const BASE_PROMPT = `Output in JSON format as an array with EXACTLY ONE item per image. Only valid JSON is accepted.
For each image, generate:
[
  {
    "title": "generated title for image 1",
    "description": "generated description for image 1",
    "keywords": ["keyword1", "keyword2", ...]
  },
  {
    "title": "generated title for image 2",
    "description": "generated description for image 2",
    "keywords": ["keyword1", "keyword2", ...]
  },
  ...and so on for EACH image
]
`;

export const prompt = (titleLength, descriptionLength, keywordCount) => {
  return `Please give me long perfect titles of about ${titleLength} characters, descriptions of about ${descriptionLength} characters and ${keywordCount} related single SEO keywords for EACH image based on the Micro stock site and follow (Anatomy of Titles: Style, Subject, Location or background). Don't use (:,&, |) symbols in titles and descriptions.
    
You MUST create metadata for ALL images. Each image must have its own title, description, and keywords.

Never use these words in any titles, descriptions, and keywords`;
};

export const FORBIDDEN_KEYWORDS = [
  "thanksgiving",
  "valentine",
  "vintage",
  "heaven",
  "heavenly",
  "retro",
  "god",
  "love",
  "valentines",
  "paradise",
  "majestic",
  "magic",
  "music",
  "rejuvenating",
  "habitat",
  "pristine",
  "revival",
  "residence",
  "primitive",
  "zen",
  "graceful",
  "fashion",
  "cinema",
  "movie",
  "club",
  "bar",
  "matrix",
  "nightlife",
  "fantasy",
  "sci-fi",
  "romantic",
  "wedding",
  "party",
  "Christmas",
  "celebration",
  "easter",
  "winery",
  "wine",
  "spooky",
  "majestic",
  "pork",
  "kaleidoscopic",
  "mandala",
  "bohemian",
  "ethnic",
  "folk",
  "fairy tale",
  "story",
  "celestial",
  "minimalistic",
];
