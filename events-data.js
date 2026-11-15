'use strict';

/* 花蓮活動 — events for 樂 → 花蓮活動 (events.js).
   From a friend's project "Hualien Events & Reminders" (data updated 2026-11-09).
   Each event: id, area (township), start / end (YYYY-MM-DD, or null for regular
   programs), and zh / en { kind, title, when, place }. Events whose end date has
   passed are hidden automatically. */
const EVENTS_UPDATED = '2026-11-09';
const HL_EVENTS = [
 {
  "id": "art-museum-stone-poem",
  "area": "花蓮市",
  "start": "2026-10-31",
  "end": "2027-01-24",
  "zh": {
   "kind": "展覽",
   "place": "花蓮美術館",
   "title": "石的詩意：地底、表層與回聲",
   "when": "2026/10/31 – 2027/1/24（免費）"
  },
  "en": {
   "kind": "Exhibition",
   "place": "Hualien Art Museum (花蓮美術館)",
   "title": "Exhibition: The Poetics of Stone",
   "when": "Oct 31, 2026 – Jan 24, 2027 (free)"
  }
 },
 {
  "id": "creative-farm-2026",
  "area": "花蓮市",
  "start": "2026-05-23",
  "end": "2026-11-29",
  "zh": {
   "kind": "親子",
   "place": "花蓮文化創意園區 第七棟",
   "title": "花創角色嗨農場",
   "when": "2026/5/23 – 11/29"
  },
  "en": {
   "kind": "Family",
   "place": "Hualien Cultural & Creative Industries Park, Building 7",
   "title": "Character Fun Farm",
   "when": "May 23 – Nov 29, 2026"
  }
 },
 {
  "id": "education-showcase-2026",
  "area": "花蓮市",
  "start": "2026-11-08",
  "end": "2026-11-29",
  "zh": {
   "kind": "展覽",
   "place": "花蓮文化創意產業園區",
   "title": "山海之間的逍遙遙遊 教育成果展",
   "when": "2026/11/8 – 11/29（免費）"
  },
  "en": {
   "kind": "Exhibition",
   "place": "Hualien Cultural & Creative Industries Park",
   "title": "Between Mountains and Sea: Education Showcase",
   "when": "Nov 8 – Nov 29, 2026 (free)"
  }
 },
 {
  "id": "hotspring-2026",
  "area": "瑞穗鄉",
  "start": "2026-10-17",
  "end": "2026-11-15",
  "zh": {
   "kind": "溫泉",
   "place": "瑞穗溫泉區、安通溫泉區",
   "title": "2026花蓮太平洋溫泉季",
   "when": "2026/10/17 – 11/15"
  },
  "en": {
   "kind": "Hot springs",
   "place": "Ruisui and Antong hot spring areas",
   "title": "2026 Hualien Pacific Hot Spring Festival",
   "when": "Oct 17 – Nov 15, 2026"
  }
 },
 {
  "id": "hualien-creative-craft",
  "area": "花蓮市",
  "start": "2026-09-04",
  "end": "2026-11-22",
  "zh": {
   "kind": "展覽",
   "place": "花蓮文化創意產業園區",
   "title": "2026-2027工藝遶境",
   "when": "至2026/11/22（免費）"
  },
  "en": {
   "kind": "Exhibition",
   "place": "Hualien Cultural & Creative Industries Park (花創)",
   "title": "2026-2027 Craft Procession Exhibition",
   "when": "Until Nov 22, 2026 (free)"
  }
 },
 {
  "id": "hualien-creative-table",
  "area": "花蓮市",
  "start": "2026-10-08",
  "end": "2026-12-06",
  "zh": {
   "kind": "展覽",
   "place": "花蓮文化創意產業園區",
   "title": "《三分之二》打撈記憶餐桌特展",
   "when": "2026/10/8 – 12/6（免費）"
  },
  "en": {
   "kind": "Exhibition",
   "place": "Hualien Cultural & Creative Industries Park (花創)",
   "title": "Dining Table Special Exhibition: Salvaging Memories",
   "when": "Oct 8 – Dec 6, 2026 (free)"
  }
 },
 {
  "id": "mermaid-carnival-2026",
  "area": "壽豐鄉",
  "start": "2026-09-05",
  "end": "2026-12-31",
  "zh": {
   "kind": "親子",
   "place": "遠雄海洋公園",
   "title": "夢幻降臨｜美人魚嘉年華",
   "when": "2026/9/5 – 12/31"
  },
  "en": {
   "kind": "Family",
   "place": "Farglory Ocean Park",
   "title": "Dreamy Arrival: Mermaid Carnival",
   "when": "Sep 5 – Dec 31, 2026"
  }
 },
 {
  "id": "slc-fengbin",
  "area": "豐濱鄉",
  "start": null,
  "end": null,
  "zh": {
   "kind": "樂齡課程",
   "place": "豐濱鄉樂齡學習中心",
   "title": "樂齡學習中心｜豐濱鄉",
   "when": "每月課表，請見官方資訊"
  },
  "en": {
   "kind": "Senior classes",
   "place": "Fengbin Township Senior Learning Center",
   "title": "Senior Learning Center – Fengbin",
   "when": "Monthly schedule, see official info"
  }
 },
 {
  "id": "slc-fenglin",
  "area": "鳳林鎮",
  "start": null,
  "end": null,
  "zh": {
   "kind": "樂齡課程",
   "place": "鳳林鎮樂齡學習中心",
   "title": "樂齡學習中心｜鳳林鎮",
   "when": "每月課表，請見官方資訊"
  },
  "en": {
   "kind": "Senior classes",
   "place": "Fenglin Township Senior Learning Center",
   "title": "Senior Learning Center – Fenglin",
   "when": "Monthly schedule, see official info"
  }
 },
 {
  "id": "slc-guangfu",
  "area": "光復鄉",
  "start": null,
  "end": null,
  "zh": {
   "kind": "樂齡課程",
   "place": "光復鄉樂齡學習中心",
   "title": "樂齡學習中心｜光復鄉",
   "when": "每月課表，請見官方資訊"
  },
  "en": {
   "kind": "Senior classes",
   "place": "Guangfu Township Senior Learning Center",
   "title": "Senior Learning Center – Guangfu",
   "when": "Monthly schedule, see official info"
  }
 },
 {
  "id": "slc-hualien-city",
  "area": "花蓮市",
  "start": null,
  "end": null,
  "zh": {
   "kind": "樂齡課程",
   "place": "花蓮市樂齡學習中心",
   "title": "樂齡學習中心｜花蓮市",
   "when": "每月課表，請見官方資訊"
  },
  "en": {
   "kind": "Senior classes",
   "place": "Hualien City Senior Learning Center",
   "title": "Senior Learning Center – Hualien City",
   "when": "Monthly schedule, see official info"
  }
 },
 {
  "id": "slc-jian",
  "area": "吉安鄉",
  "start": null,
  "end": null,
  "zh": {
   "kind": "樂齡課程",
   "place": "吉安鄉樂齡學習中心",
   "title": "樂齡學習中心｜吉安鄉",
   "when": "每月課表，請見官方資訊"
  },
  "en": {
   "kind": "Senior classes",
   "place": "Jian Township Senior Learning Center",
   "title": "Senior Learning Center – Jian",
   "when": "Monthly schedule, see official info"
  }
 },
 {
  "id": "slc-ruisui",
  "area": "瑞穗鄉",
  "start": null,
  "end": null,
  "zh": {
   "kind": "樂齡課程",
   "place": "瑞穗鄉樂齡學習中心",
   "title": "樂齡學習中心｜瑞穗鄉",
   "when": "每月課表，請見官方資訊"
  },
  "en": {
   "kind": "Senior classes",
   "place": "Ruisui Township Senior Learning Center",
   "title": "Senior Learning Center – Ruisui",
   "when": "Monthly schedule, see official info"
  }
 },
 {
  "id": "slc-shoufeng",
  "area": "壽豐鄉",
  "start": null,
  "end": null,
  "zh": {
   "kind": "樂齡課程",
   "place": "壽豐鄉樂齡學習優質中心",
   "title": "樂齡學習優質中心｜壽豐鄉",
   "when": "每月課表，請見官方資訊"
  },
  "en": {
   "kind": "Senior classes",
   "place": "Shoufeng Township Senior Learning Center",
   "title": "Senior Learning Center – Shoufeng",
   "when": "Monthly schedule, see official info"
  }
 },
 {
  "id": "slc-xiulin",
  "area": "秀林鄉",
  "start": null,
  "end": null,
  "zh": {
   "kind": "樂齡課程",
   "place": "秀林鄉樂齡學習中心",
   "title": "樂齡學習中心｜秀林鄉",
   "when": "每月課表，請見官方資訊"
  },
  "en": {
   "kind": "Senior classes",
   "place": "Xiulin Township Senior Learning Center",
   "title": "Senior Learning Center – Xiulin",
   "when": "Monthly schedule, see official info"
  }
 },
 {
  "id": "slc-zhuoxi",
  "area": "卓溪鄉",
  "start": null,
  "end": null,
  "zh": {
   "kind": "樂齡課程",
   "place": "卓溪鄉樂齡學習中心",
   "title": "樂齡學習中心｜卓溪鄉",
   "when": "每月課表，請見官方資訊"
  },
  "en": {
   "kind": "Senior classes",
   "place": "Zhuoxi Township Senior Learning Center",
   "title": "Senior Learning Center – Zhuoxi",
   "when": "Monthly schedule, see official info"
  }
 },
 {
  "id": "stone-sculpture-2026",
  "area": "花蓮市",
  "start": "2026-10-31",
  "end": "2026-11-29",
  "zh": {
   "kind": "展覽",
   "place": "花蓮縣文化局園區 你來廣場",
   "title": "2026花蓮國際石雕藝術季",
   "when": "2026/10/31 – 11/29（免費）"
  },
  "en": {
   "kind": "Exhibition",
   "place": "Nilai Plaza (你來廣場), Hualien Cultural Affairs Bureau park",
   "title": "2026 Hualien International Stone Sculpture Festival",
   "when": "Oct 31 – Nov 29, 2026 (free)"
  }
 },
 {
  "id": "stone-workshop-2026",
  "area": "花蓮市",
  "start": "2026-10-31",
  "end": "2026-11-28",
  "zh": {
   "kind": "工作坊",
   "place": "花蓮縣文化局園區 你來廣場",
   "title": "裂石新生創作坊",
   "when": "2026/10/31 – 11/28（免費）"
  },
  "en": {
   "kind": "Workshop",
   "place": "Nilai Plaza, Hualien Cultural Affairs Bureau park",
   "title": "Stone Rebirth Creative Workshop",
   "when": "Oct 31 – Nov 28, 2026 (free)"
  }
 },
 {
  "id": "sustain-expo-2026",
  "area": "花蓮市",
  "start": "2026-10-15",
  "end": "2026-11-21",
  "zh": {
   "kind": "展覽",
   "place": "花蓮縣運動休閒園區",
   "title": "大山大海．花現未來 花蓮永續風格展",
   "when": "2026/10/15 – 11/21（免費）"
  },
  "en": {
   "kind": "Exhibition",
   "place": "Hualien County Sports & Leisure Park",
   "title": "Mountains and Sea: Hualien Sustainable Lifestyle Expo",
   "when": "Oct 15 – Nov 21, 2026 (free)"
  }
 },
 {
  "id": "taroko-concert-2026",
  "area": "秀林鄉",
  "start": "2026-04-25",
  "end": "2026-12-12",
  "zh": {
   "kind": "音樂",
   "place": "太魯閣臺地",
   "title": "2026太魯閣部落音樂會系列活動",
   "when": "2026/4/25 – 12/12（免費）"
  },
  "en": {
   "kind": "Music",
   "place": "Taroko Terrace (太魯閣臺地)",
   "title": "2026 Taroko Tribal Concert Series",
   "when": "Apr 25 – Dec 12, 2026 (free)"
  }
 },
 {
  "id": "valley-music-2026",
  "area": "秀林鄉",
  "start": "2026-11-14",
  "end": "2026-11-15",
  "zh": {
   "kind": "音樂",
   "place": "秀林鄉銅門部落（銅門多功能運動場）",
   "title": "2026山谷音樂會",
   "when": "2026/11/14 – 11/15"
  },
  "en": {
   "kind": "Music",
   "place": "Tongmen tribe multipurpose field (銅門多功能運動場)",
   "title": "2026 Valley Music Concert",
   "when": "Nov 14–15, 2026"
  }
 }
];
