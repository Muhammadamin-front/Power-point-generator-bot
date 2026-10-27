import type { Lang, SectionId } from "./types";

type Strings = {
  sections: Record<SectionId, string>;
  start: string;
  startHover: string;
  toEnd: string;
  presenter: string;
  group: string;
  teacher: string;
  skip: string;
  section: string;
  keysShort: string;
  help: {
    title: string;
    close: string;
    next: string;
    prev: string;
    homeEnd: string;
    home: string;
    fullscreen: string;
    toggle: string;
    live: string;
    liveItems: [string, string][];
    clicker: string;
  };
  thanks: string;
  thanksLine: string;
  back: string;
  backHover: string;
  sources: string;
  sourcesNote: string;
  conclusion: string;
  similar: string;
  different: string;
  vs: string;
  tableView: string;
  ratio: string;
  proof: string;
};

export const STRINGS: Record<Lang, Strings> = {
  uz: {
    sections: { kirish: "Kirish", mavzu: "Mavzu", raqamlar: "Raqamlarda", tarix: "Tarix", tushunchalar: "Tushunchalar", muammolar: "Muammolar", kelajak: "Kelajak", taqqoslash: "Taqqoslash", xulosa: "Xulosa" },
    start: "Taqdimotni boshlash",
    startHover: "Boshlaymiz",
    toEnd: "Xulosaga",
    presenter: "Taqdimotchi",
    group: "Guruh",
    teacher: "Oʻqituvchi",
    skip: "Taqdimotga oʻtish",
    section: "Boʻlim",
    keysShort: "keyingi qadam · F toʻliq ekran · ? yordam",
    help: {
      title: "Taqdimotni boshqarish",
      close: "Yopish",
      next: "Keyingi qadam",
      prev: "Oldingi qadam",
      homeEnd: "Boshi / oxiri",
      home: "Home / End",
      fullscreen: "Toʻliq ekran",
      toggle: "Shu oynani ochish / yopish",
      live: "Jonli effektlar",
      liveItems: [
        ["Kirish", "Sichqonchani suring — halqalar siljiydi"],
        ["Tushunchalar", "Kartani bosing yoki ustiga olib boring — aylanadi"],
        ["Taqqoslash", "Qator ustiga olib boring — necha barobar farq"],
      ],
      clicker: "Klikker (pult) ham ishlaydi — u PageDown/PageUp yuboradi.",
    },
    thanks: "Rahmat!",
    thanksLine: "Eʼtiboringiz uchun rahmat. Savollaringiz boʻlsa — marhamat.",
    back: "Boshiga qaytish",
    backHover: "Yana bir bor",
    sources: "Manbalar",
    sourcesNote: "«~» — yaxlitlangan yoki taxminiy qiymat.",
    conclusion: "Xulosa",
    similar: "Oʻxshash",
    different: "Farqli",
    vs: "vs",
    tableView: "Jadval koʻrinishi",
    ratio: "barobar",
    proof: "Eʼtiboringiz uchun",
  },
  uz_cyrl: {
    sections: { kirish: "Кириш", mavzu: "Мавзу", raqamlar: "Рақамларда", tarix: "Тарих", tushunchalar: "Тушунчалар", muammolar: "Муаммолар", kelajak: "Келажак", taqqoslash: "Таққослаш", xulosa: "Хулоса" },
    start: "Тақдимотни бошлаш",
    startHover: "Бошлаймиз",
    toEnd: "Хулосага",
    presenter: "Тақдимотчи",
    group: "Гуруҳ",
    teacher: "Ўқитувчи",
    skip: "Тақдимотга ўтиш",
    section: "Бўлим",
    keysShort: "кейинги қадам · F тўлиқ экран · ? ёрдам",
    help: {
      title: "Тақдимотни бошқариш",
      close: "Ёпиш",
      next: "Кейинги қадам",
      prev: "Олдинги қадам",
      homeEnd: "Боши / охири",
      home: "Home / End",
      fullscreen: "Тўлиқ экран",
      toggle: "Шу ойнани очиш / ёпиш",
      live: "Жонли эффектлар",
      liveItems: [
        ["Кириш", "Сичқончани суринг — ҳалқалар силжийди"],
        ["Тушунчалар", "Картани босинг ёки устига олиб боринг — айланади"],
        ["Таққослаш", "Қатор устига олиб боринг — неча баравар фарқ"],
      ],
      clicker: "Кликкер (пульт) ҳам ишлайди — у PageDown/PageUp юборади.",
    },
    thanks: "Раҳмат!",
    thanksLine: "Эътиборингиз учун раҳмат. Саволларингиз бўлса — марҳамат.",
    back: "Бошига қайтиш",
    backHover: "Яна бир бор",
    sources: "Манбалар",
    sourcesNote: "«~» — яхлитланган ёки тахминий қиймат.",
    conclusion: "Хулоса",
    similar: "Ўхшаш",
    different: "Фарқли",
    vs: "vs",
    tableView: "Жадвал кўриниши",
    ratio: "баравар",
    proof: "Эътиборингиз учун",
  },
  ru: {
    sections: { kirish: "Введение", mavzu: "Тема", raqamlar: "В цифрах", tarix: "История", tushunchalar: "Понятия", muammolar: "Проблемы", kelajak: "Будущее", taqqoslash: "Сравнение", xulosa: "Выводы" },
    start: "Начать презентацию",
    startHover: "Начинаем",
    toEnd: "К выводам",
    presenter: "Докладчик",
    group: "Группа",
    teacher: "Преподаватель",
    skip: "Перейти к презентации",
    section: "Раздел",
    keysShort: "следующий шаг · F во весь экран · ? помощь",
    help: {
      title: "Управление презентацией",
      close: "Закрыть",
      next: "Следующий шаг",
      prev: "Предыдущий шаг",
      homeEnd: "Начало / конец",
      home: "Home / End",
      fullscreen: "Во весь экран",
      toggle: "Открыть / закрыть это окно",
      live: "Живые эффекты",
      liveItems: [
        ["Введение", "Двигайте мышью — кольца смещаются"],
        ["Понятия", "Нажмите на карточку или наведите — она перевернётся"],
        ["Сравнение", "Наведите на строку — во сколько раз разница"],
      ],
      clicker: "Кликер (пульт) тоже работает — он отправляет PageDown/PageUp.",
    },
    thanks: "Спасибо!",
    thanksLine: "Благодарю за внимание. Готов ответить на вопросы.",
    back: "Вернуться к началу",
    backHover: "Ещё раз",
    sources: "Источники",
    sourcesNote: "«~» — округлённое или приблизительное значение.",
    conclusion: "Выводы",
    similar: "Общее",
    different: "Различия",
    vs: "vs",
    tableView: "Табличный вид",
    ratio: "раза",
    proof: "За внимание",
  },
  en: {
    sections: { kirish: "Intro", mavzu: "Overview", raqamlar: "By numbers", tarix: "History", tushunchalar: "Concepts", muammolar: "Challenges", kelajak: "Outlook", taqqoslash: "Comparison", xulosa: "Conclusion" },
    start: "Start presentation",
    startHover: "Let's go",
    toEnd: "To conclusion",
    presenter: "Presenter",
    group: "Group",
    teacher: "Instructor",
    skip: "Skip to presentation",
    section: "Section",
    keysShort: "next step · F fullscreen · ? help",
    help: {
      title: "Presentation controls",
      close: "Close",
      next: "Next step",
      prev: "Previous step",
      homeEnd: "Start / end",
      home: "Home / End",
      fullscreen: "Fullscreen",
      toggle: "Open / close this window",
      live: "Live effects",
      liveItems: [
        ["Intro", "Move the mouse — the rings drift"],
        ["Concepts", "Click or hover a card — it flips"],
        ["Comparison", "Hover a row — how many times larger"],
      ],
      clicker: "A clicker works too — it sends PageDown/PageUp.",
    },
    thanks: "Thank you!",
    thanksLine: "Thank you for your attention. Questions are welcome.",
    back: "Back to start",
    backHover: "Once more",
    sources: "Sources",
    sourcesNote: "“~” marks a rounded or approximate value.",
    conclusion: "Conclusion",
    similar: "Similar",
    different: "Different",
    vs: "vs",
    tableView: "Table view",
    ratio: "×",
    proof: "Thank you",
  },
};
