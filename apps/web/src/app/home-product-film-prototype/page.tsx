import Image from "next/image";
import Link from "next/link";
import { ProductDisassemblyStage } from "@/components/product-disassembly-stage";
import { withLocale } from "@/config/site-routes";
import { getLocaleCopy } from "@/lib/copy/site-copy";
import { getRequestLocale } from "@/lib/request-locale";
import { buildRouteMetadata } from "@/lib/seo/metadata";

const heroPoster = "/images/product-motion/speaker-pair-premium/product-shot.webp";

export async function generateMetadata() {
  const locale = await getRequestLocale();

  return buildRouteMetadata({
    title: getLocaleCopy(locale, {
      en: "Homepage product film study | Montelar",
      de: "Homepage Product-Film Studie | Montelar",
      es: "Estudio de film de producto para home | Montelar",
      fr: "Etude de film produit pour l'accueil | Montelar",
      zh: "首页产品影片研究 | Montelar",
      ja: "ホーム製品フィルム検証 | Montelar",
      ru: "Исследование продуктового фильма для главной | Montelar",
    }),
    description: getLocaleCopy(locale, {
      en: "A hidden Montelar homepage route testing a scroll-controlled WebGL product disassembly without replacing the live homepage.",
      de: "Eine versteckte Montelar-Route, die eine scrollgesteuerte WebGL-Produktzerlegung testet, ohne die Live-Homepage zu ersetzen.",
      es: "Una ruta oculta de Montelar para probar un despiece de producto WebGL con scroll sin sustituir la home activa.",
      fr: "Une route Montelar masquee qui teste un eclate produit WebGL pilote par le scroll sans remplacer l'accueil en ligne.",
      zh: "Montelar 隐藏路线，用于测试滚动控制的 WebGL 产品拆解，不替换线上首页。",
      ja: "公開中のホームを置き換えずに、スクロール制御のWebGL製品分解を検証するMontelarの隠しルート。",
      ru: "Скрытая страница Montelar для проверки WebGL-раскрытия продукта по скроллу без замены живой главной.",
    }),
    path: "/home-product-film-prototype",
    locale,
    robots: {
      index: false,
      follow: false,
    },
  });
}

export default async function HomeProductFilmPrototypePage() {
  const locale = await getRequestLocale();
  const contactHref = withLocale("/contact", locale);
  const audioHref = withLocale("/audio/speakers", locale);
  const requestHref = withLocale("/request/prima-materia-lux-speaker", locale);

  const labels = [
    {
      at: 0,
      title: getLocaleCopy(locale, {
        en: "Object",
        de: "Objekt",
        es: "Objeto",
        fr: "Objet",
        zh: "物件",
        ja: "オブジェクト",
        ru: "Предмет",
      }),
      text: getLocaleCopy(locale, {
        en: "A single speaker enters as a material object: lacquer, bronze rings and a stable architectural stance.",
        de: "Ein einzelner Lautsprecher erscheint als Materialobjekt: Lack, Bronzerahmen und eine stabile architektonische Haltung.",
        es: "Un solo altavoz entra como objeto material: laca, aros de bronce y una postura arquitectonica estable.",
        fr: "Une enceinte apparait comme objet de matiere: laque, bagues bronze et posture architecturale stable.",
        zh: "单只音箱作为材质物件出现：漆面、青铜环和稳定的建筑式姿态。",
        ja: "一台のスピーカーが素材のオブジェクトとして現れます。ラッカー、ブロンズリング、安定した建築的な構え。",
        ru: "Одна колонка входит как материальный объект: лак, бронзовые кольца и устойчивая архитектурная посадка.",
      }),
    },
    {
      at: 0.34,
      title: getLocaleCopy(locale, {
        en: "Structure",
        de: "Struktur",
        es: "Estructura",
        fr: "Structure",
        zh: "结构",
        ja: "構造",
        ru: "Структура",
      }),
      text: getLocaleCopy(locale, {
        en: "The product separates along believable planes, so motion explains construction instead of decorating the page.",
        de: "Das Produkt trennt sich entlang glaubwurdiger Ebenen, damit Bewegung Konstruktion erklaert statt die Seite zu dekorieren.",
        es: "El producto se separa por planos creibles, para que el movimiento explique la construccion y no decore la pagina.",
        fr: "Le produit se separe selon des plans plausibles: le mouvement explique la construction plutot qu'il ne decore la page.",
        zh: "产品沿可信的结构面展开，让动效解释构造，而不是装饰页面。",
        ja: "製品は自然な分割面に沿って離れ、動きが装飾ではなく構造を説明します。",
        ru: "Предмет расходится по правдоподобным плоскостям: motion объясняет конструкцию, а не украшает страницу.",
      }),
    },
    {
      at: 0.68,
      title: getLocaleCopy(locale, {
        en: "System",
        de: "System",
        es: "Sistema",
        fr: "Systeme",
        zh: "系统",
        ja: "システム",
        ru: "Система",
      }),
      text: getLocaleCopy(locale, {
        en: "The film returns to a composed system: sound, electronics and conductors behave as one room architecture.",
        de: "Der Film kehrt zum komponierten System zuruck: Klang, Elektronik und Leiter wirken als eine Raumarchitektur.",
        es: "El film vuelve a un sistema compuesto: sonido, electronica y conductores como una sola arquitectura de sala.",
        fr: "Le film revient a un systeme compose: son, electronique et conducteurs deviennent une architecture de piece.",
        zh: "影片回到一个完整系统：声音、电子设备和导体共同成为空间建筑。",
        ja: "フィルムは構成されたシステムへ戻ります。音、電子機器、導体が一つの空間建築として働きます。",
        ru: "Фильм возвращается к собранной системе: звук, электроника и проводники работают как единая архитектура комнаты.",
      }),
    },
  ];

  const systemImages = [
    {
      src: "/images/home/product-series/paired-speakers.webp",
      alt: getLocaleCopy(locale, {
        en: "Paired walnut loudspeakers",
        de: "Gepaarte Walnuss-Lautsprecher",
        es: "Altavoces de nogal emparejados",
        fr: "Enceintes en noyer appairees",
        zh: "成对胡桃木音箱",
        ja: "ペアのウォールナットスピーカー",
        ru: "Парные деревянные колонки",
      }),
    },
    {
      src: "/images/home/product-series/amplifier-stack.webp",
      alt: getLocaleCopy(locale, {
        en: "Brushed-metal audio electronics",
        de: "Audio-Elektronik in geburstetem Metall",
        es: "Electronica de audio en metal cepillado",
        fr: "Electronique audio en metal brosse",
        zh: "拉丝金属音频电子设备",
        ja: "ブラッシュドメタルのオーディオ機器",
        ru: "Аудиоэлектроника в шлифованном металле",
      }),
    },
    {
      src: "/images/home/product-series/connected-system-four-plugs.webp",
      alt: getLocaleCopy(locale, {
        en: "Connected system with four conductors",
        de: "Verbundenes System mit vier Leitern",
        es: "Sistema conectado con cuatro conductores",
        fr: "Systeme connecte avec quatre conducteurs",
        zh: "连接四条导体的系统",
        ja: "四つの導体で接続されたシステム",
        ru: "Система с четырьмя подключенными проводниками",
      }),
    },
  ];

  return (
    <main className="home-product-film-prototype-page">
      <section className="home-film-hero">
        <div className="home-film-hero__copy">
          <p className="eyebrow">
            {getLocaleCopy(locale, {
              en: "Montelar product film",
              de: "Montelar Produktfilm",
              es: "Film de producto Montelar",
              fr: "Film produit Montelar",
              zh: "Montelar 产品影片",
              ja: "Montelar製品フィルム",
              ru: "Продуктовый фильм Montelar",
            })}
          </p>
          <h1>
            {getLocaleCopy(locale, {
              en: "The system opens before the room begins to speak.",
              de: "Das System offnet sich, bevor der Raum zu sprechen beginnt.",
              es: "El sistema se abre antes de que la sala empiece a hablar.",
              fr: "Le systeme s'ouvre avant que la piece ne commence a parler.",
              zh: "系统先展开，空间才开始发声。",
              ja: "空間が語り始める前に、システムが開いていく。",
              ru: "Система раскрывается до того, как пространство начинает звучать.",
            })}
          </h1>
          <p>
            {getLocaleCopy(locale, {
              en: "A calmer homepage study: one remembered object, a restrained page rhythm and a direct path to consultation.",
              de: "Eine ruhigere Homepage-Studie: ein erinnerbares Objekt, ein zuruckhaltender Seitenrhythmus und direkter Weg zur Beratung.",
              es: "Un estudio de home mas sereno: un objeto memorable, un ritmo de pagina contenido y ruta directa a consulta.",
              fr: "Une etude d'accueil plus calme: un objet memorable, un rythme de page retenu et un chemin direct vers le conseil.",
              zh: "更克制的首页研究：一个可被记住的物件、克制的页面节奏和直接的咨询路径。",
              ja: "より静かなホーム検証。一つの記憶に残る物体、抑制されたページリズム、相談への明確な導線。",
              ru: "Более спокойный сценарий главной: один запоминающийся объект, сдержанный ритм страницы и прямой путь к консультации.",
            })}
          </p>
          <div className="home-film-actions" aria-label={getLocaleCopy(locale, {
            en: "Product film actions",
            de: "Produktfilm Aktionen",
            es: "Acciones del film de producto",
            fr: "Actions du film produit",
            zh: "产品影片操作",
            ja: "製品フィルムの操作",
            ru: "Действия продуктового фильма",
          })}>
            <Link className="home-film-primary-link" href={requestHref}>
              {getLocaleCopy(locale, {
                en: "Request a system consultation",
                de: "Systemberatung anfragen",
                es: "Solicitar una consulta de sistema",
                fr: "Demander un conseil systeme",
                zh: "预约系统咨询",
                ja: "システム相談を依頼",
                ru: "Запросить консультацию по системе",
              })}
            </Link>
            <Link className="home-film-secondary-link" href={audioHref}>
              {getLocaleCopy(locale, {
                en: "View acoustic direction",
                de: "Akustikrichtung ansehen",
                es: "Ver direccion acustica",
                fr: "Voir la direction acoustique",
                zh: "查看声学方向",
                ja: "音響領域を見る",
                ru: "Смотреть акустическое направление",
              })}
            </Link>
          </div>
        </div>
        <figure className="home-film-hero__media">
          <Image
            alt={getLocaleCopy(locale, {
              en: "Montelar loudspeaker pair on a dark product stage",
              de: "Montelar Lautsprecherpaar auf dunkler Produktbuhne",
              es: "Pareja de altavoces Montelar en un escenario oscuro",
              fr: "Paire d'enceintes Montelar sur scene produit sombre",
              zh: "深色产品舞台上的 Montelar 扬声器组合",
              ja: "暗い製品ステージ上のMontelarスピーカーペア",
              ru: "Пара акустических систем Montelar на темной продуктовой сцене",
            })}
            fill
            priority
            quality={82}
            sizes="(max-width: 900px) 100vw, 48vw"
            src={heroPoster}
          />
        </figure>
      </section>

      <ProductDisassemblyStage labels={labels} />

      <section className="home-film-system">
        <div className="home-film-system__copy">
          <p className="eyebrow">
            {getLocaleCopy(locale, {
              en: "Image, sound, design",
              de: "Bild, Klang, Design",
              es: "Imagen, sonido, diseno",
              fr: "Image, son, design",
              zh: "图像、声音、设计",
              ja: "画像、音、デザイン",
              ru: "Изображение, звук, дизайн",
            })}
          </p>
          <h2>
            {getLocaleCopy(locale, {
              en: "Movement serves product comprehension, then disappears into the architecture.",
              de: "Bewegung dient dem Produktverstandnis und verschwindet danach in der Architektur.",
              es: "El movimiento sirve a la comprension del producto y despues desaparece en la arquitectura.",
              fr: "Le mouvement sert la comprehension du produit, puis disparait dans l'architecture.",
              zh: "动效服务于产品理解，随后融入建筑秩序。",
              ja: "動きは製品理解に役立ち、その後は建築の中へ静かに溶け込みます。",
              ru: "Движение помогает понять предмет, а затем растворяется в архитектуре.",
            })}
          </h2>
          <p>
            {getLocaleCopy(locale, {
              en: "The page keeps its rhythm: no catalogue grid, no product tiles, no long forced stop. The object unfolds, the copy follows, and the visitor can continue into the real inquiry path.",
              de: "Die Seite behalt ihren Rhythmus: kein Katalograster, keine Produktkacheln, kein langer Zwangsstopp. Das Objekt offnet sich, der Text folgt, der Besucher geht weiter zur Anfrage.",
              es: "La pagina conserva su ritmo: sin cuadricula de catalogo, sin fichas, sin parada larga. El objeto se despliega, el texto acompana y la visita sigue hacia la solicitud real.",
              fr: "La page garde son rythme: pas de grille catalogue, pas de tuiles produit, pas d'arret force. L'objet se deploie, le texte suit et le visiteur rejoint la demande.",
              zh: "页面保持自身节奏：没有目录网格、没有产品卡片、没有长时间强制停留。物件展开，文案跟随，访客继续进入真实咨询路径。",
              ja: "ページはリズムを保ちます。カタロググリッドも商品タイルも長い強制停止もありません。オブジェクトが開き、言葉が続き、訪問者は実際の問い合わせへ進みます。",
              ru: "Страница сохраняет ход: без каталожной сетки, товарных плиток и долгой принудительной остановки. Предмет раскрывается, текст следует за ним, посетитель продолжает путь к заявке.",
            })}
          </p>
        </div>
        <div className="home-film-system__media" aria-label={getLocaleCopy(locale, {
          en: "Montelar system media",
          de: "Montelar Systemmedien",
          es: "Medios del sistema Montelar",
          fr: "Medias du systeme Montelar",
          zh: "Montelar 系统媒体",
          ja: "Montelarシステムメディア",
          ru: "Медиа системы Montelar",
        })}>
          {systemImages.map((image, index) => (
            <figure className="home-film-system__image" key={image.src}>
              <Image
                alt={image.alt}
                fill
                quality={82}
                sizes={index === 0 ? "(max-width: 900px) 100vw, 42vw" : "(max-width: 900px) 48vw, 22vw"}
                src={image.src}
              />
            </figure>
          ))}
        </div>
      </section>

      <section className="home-film-close">
        <p className="eyebrow">Montelar</p>
        <h2>
          {getLocaleCopy(locale, {
            en: "A quiet luxury system should reveal itself without becoming a show effect.",
            de: "Ein System stillen Luxus soll sich zeigen, ohne zum Showeffekt zu werden.",
            es: "Un sistema de lujo silencioso debe revelarse sin convertirse en efecto de feria.",
            fr: "Un systeme de luxe discret doit se reveler sans devenir un effet de spectacle.",
            zh: "静奢系统应当被看见，而不变成炫技效果。",
            ja: "静かなラグジュアリーのシステムは、見世物にならずに姿を現すべきです。",
            ru: "Система тихой роскоши должна раскрываться, не превращаясь в шоу-эффект.",
          })}
        </h2>
        <Link className="home-film-primary-link" href={contactHref}>
          {getLocaleCopy(locale, {
            en: "Discuss a Montelar room",
            de: "Montelar Raum besprechen",
            es: "Hablar de una sala Montelar",
            fr: "Parler d'une piece Montelar",
            zh: "讨论 Montelar 空间",
            ja: "Montelar空間を相談する",
            ru: "Обсудить пространство Montelar",
          })}
        </Link>
      </section>
    </main>
  );
}
