import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { _ as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { i as Menu, o as Flag, r as Star, t as X } from "../_libs/lucide-react.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { n as create, t as persist } from "../_libs/zustand.mjs";
import { a as DialogPortal, i as DialogOverlay, n as DialogClose, o as DialogTitle, p as Slot, r as DialogContent, s as DialogTrigger, t as Dialog } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { i as Viewport, n as Scrollbar, r as Thumb, t as Root } from "../_libs/radix-ui__react-scroll-area.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/AppShell-Db6Ml76s.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var PROGRAMS = [
	{
		id: "siu",
		name: "Southern Illinois",
		short: "SIU",
		div: "D1",
		conf: "MVC",
		coach: "Justin Fetcho",
		clippd: "https://scoreboard.clippd.com/teams/4127",
		clippdSchedule: "https://scoreboard.clippd.com/teams/4127/schedule",
		rosterUrl: "https://siusalukis.com/sports/mens-golf/roster",
		seniors: 3,
		intel: "One listed senior in the original snapshot plus a 5th-year and another senior (Ulrich) on the current athletics roster. The 2027 question is whether Bellino, Na and Ulrich actually vacate scoring-five seats. Fetcho's Wildcat opener mixed experience (Ulrich, Norman) with a transfer (Petersen), a second transfer (Stilley) and a freshman (Sanders) — that mix is the first 2026-27 selection read.",
		players: [
			{
				id: "siu-bellino",
				name: "Frank Bellino",
				year: "Sr",
				hometown: "Sarasota, FL",
				signal: "Senior watch — not in Wildcat five"
			},
			{
				id: "siu-ulrich",
				name: "Oliver Ulrich",
				year: "Sr",
				hometown: "Aarhus, Denmark",
				signal: "Wildcat team start"
			},
			{
				id: "siu-petersen",
				name: "Emil Elkjaer Petersen",
				year: "Jr",
				hometown: "Odder, Denmark",
				signal: "Core return / transfer"
			},
			{
				id: "siu-lockwood",
				name: "Francis Lockwood",
				year: "So",
				hometown: "Rotorua, NZ",
				signal: "Core return"
			},
			{
				id: "siu-mikus",
				name: "Michael Mikus",
				year: "So",
				hometown: "Cariari, Costa Rica",
				signal: "Core return"
			},
			{
				id: "siu-na",
				name: "Jaeseung Na",
				year: "5th",
				hometown: "Seoul, South Korea",
				signal: "5th-year / eligibility"
			},
			{
				id: "siu-norman",
				name: "Cy Norman",
				year: "R-Jr",
				hometown: "Benton, IL",
				signal: "Wildcat team start"
			},
			{
				id: "siu-stilley",
				name: "River Stilley",
				year: "So",
				hometown: "Benton, IL",
				signal: "Wildcat team start / transfer"
			},
			{
				id: "siu-sanders",
				name: "Jamen Sanders",
				year: "Fr",
				hometown: "Goose Creek, SC",
				signal: "Wildcat team start / development"
			}
		],
		events: [
			{
				id: "siu-wildcat-2026",
				name: "K-State Wildcat Invitational",
				dates: "Sep 14–15, 2026",
				venue: "Colbert Hills · Manhattan, KS",
				par: 72,
				fieldTeams: null,
				fieldPlayers: null,
				status: "live",
				teamPlace: null,
				teamRounds: [null, null],
				teamTotal: null,
				teamToPar: null,
				source: "athletics",
				sourceLabel: "SIU preview (Sep 13) — lineup confirmed, scores pending Clippd",
				sourceUrl: "https://siusalukis.com/news/2026/9/13/mens-golf-saluki-mens-golf-opens-season-at-k-state-wildcat-invitational",
				clippdUrl: "https://scoreboard.clippd.com/teams/4127/schedule",
				lineupNote: "Opener five mixes a senior, a redshirt-junior, two transfers and a freshman. Bellino (Sr) and Na (5th) are not in this five.",
				scores: [
					{
						playerId: "siu-ulrich",
						role: "team",
						rounds: [null, null],
						toPar: null,
						finish: null,
						counted: [null, null]
					},
					{
						playerId: "siu-norman",
						role: "team",
						rounds: [null, null],
						toPar: null,
						finish: null,
						counted: [null, null]
					},
					{
						playerId: "siu-petersen",
						role: "team",
						rounds: [null, null],
						toPar: null,
						finish: null,
						counted: [null, null]
					},
					{
						playerId: "siu-stilley",
						role: "team",
						rounds: [null, null],
						toPar: null,
						finish: null,
						counted: [null, null]
					},
					{
						playerId: "siu-sanders",
						role: "team",
						rounds: [null, null],
						toPar: null,
						finish: null,
						counted: [null, null]
					}
				]
			},
			{
				id: "siu-highlands-2026",
				name: "Highlands Invitational",
				dates: "Sep 21–22, 2026",
				venue: "Westchester, IL",
				par: 72,
				fieldTeams: null,
				fieldPlayers: null,
				status: "upcoming",
				teamPlace: null,
				teamRounds: [],
				teamTotal: null,
				teamToPar: null,
				scores: [],
				source: "athletics",
				sourceLabel: "SIU schedule",
				sourceUrl: "https://siusalukis.com/sports/mens-golf/schedule",
				clippdUrl: "https://scoreboard.clippd.com/teams/4127/schedule",
				note: "Second fall start — compare this five to Wildcat. A senior returning after being omitted would raise 5th-year probability."
			},
			{
				id: "siu-mvc-2027",
				name: "MVC Championship",
				dates: "Apr 25–27, 2027",
				venue: "Cape Girardeau, MO",
				par: 72,
				fieldTeams: null,
				fieldPlayers: null,
				status: "upcoming",
				teamPlace: null,
				teamRounds: [],
				teamTotal: null,
				teamToPar: null,
				scores: [],
				source: "athletics",
				sourceLabel: "SIU schedule",
				sourceUrl: "https://siusalukis.com/sports/mens-golf/schedule",
				clippdUrl: "https://scoreboard.clippd.com/teams/4127/schedule"
			}
		],
		insights: [{
			id: "siu-1",
			tone: "watch",
			title: "Senior / 5th-year pair sitting out the opener",
			body: "Fetcho's Wildcat five is Ulrich, Norman, Petersen, Stilley and Sanders. Frank Bellino (Sr) and Jaeseung Na (5th) are not in that group. One opener is not a season, but the first lineup is the first 5th-year tell.",
			evidence: "SIU season-opening preview, Sep 13, 2026.",
			confidence: "confirmed",
			playerIds: [
				"siu-bellino",
				"siu-na",
				"siu-ulrich"
			],
			eventId: "siu-wildcat-2026"
		}, {
			id: "siu-2",
			tone: "info",
			title: "Freshman and transfers occupying scoring seats",
			body: "Sanders (Fr) and Stilley (transfer So) starting the year in the five compresses the theoretical 2027 opening if they hold. Younger players selected ahead of seniors is the selection model working as designed.",
			evidence: "Wildcat lineup vs current athletics roster.",
			confidence: "inferred",
			playerIds: ["siu-sanders", "siu-stilley"],
			eventId: "siu-wildcat-2026"
		}]
	},
	{
		id: "ksu",
		name: "Kennesaw State",
		short: "KSU",
		div: "D1",
		conf: "CUSA",
		coach: "Bryant Odom",
		clippd: "https://scoreboard.clippd.com/teams/4172",
		clippdSchedule: "https://scoreboard.clippd.com/teams/4172/schedule",
		rosterUrl: "https://ksuowls.com/sports/mens-golf/roster",
		seniors: 3,
		intel: "Two seniors plus an existing 5th-year create multiple turnover paths — but only if they actually hold lineup seats. The Myrtle Beach opener put freshmen Salierno and Caraballo in the scoring five, sophomore Gantt as the low man, and 5th-year Sweigart as an individual. Seniors Gillard and Todd did not play. That is a louder 2027 signal than the raw senior count.",
		players: [
			{
				id: "ksu-sweigart",
				name: "Reed Sweigart",
				year: "5th",
				hometown: "Roswell, GA",
				signal: "5th-year / IND at opener"
			},
			{
				id: "ksu-gillard",
				name: "Hunter Gillard",
				year: "Sr",
				hometown: "Hobart, Tasmania",
				signal: "Senior — DNP opener"
			},
			{
				id: "ksu-todd",
				name: "Joshua Todd",
				year: "Sr",
				hometown: "Sydney, NSW",
				signal: "Senior — DNP opener; sparse 2025-26"
			},
			{
				id: "ksu-gallingani",
				name: "Luca Gallingani",
				year: "Jr",
				hometown: "Buenos Aires, Argentina",
				signal: "Core return"
			},
			{
				id: "ksu-gantt",
				name: "Walker Gantt",
				year: "So",
				hometown: "Augusta, GA",
				signal: "Opener low man"
			},
			{
				id: "ksu-brash",
				name: "James Brash",
				year: "So",
				hometown: "Windlesham, England",
				signal: "Team five, high round"
			},
			{
				id: "ksu-caraballo",
				name: "Alejandro Caraballo",
				year: "Fr",
				hometown: "Williamsburg, VA",
				signal: "Development / team start"
			},
			{
				id: "ksu-drum",
				name: "Kaiden Drum",
				year: "Fr",
				hometown: "Marietta, GA",
				signal: "Development"
			},
			{
				id: "ksu-salierno",
				name: "AJ Salierno",
				year: "Fr",
				hometown: "Newnan, GA",
				signal: "Development / co-low at opener"
			}
		],
		events: [
			{
				id: "ksu-myrtle-2026",
				name: "Myrtle Beach Golf Trips Intercollegiate",
				dates: "Sep 6–8, 2026",
				venue: "Grande Dunes Resort Club · Myrtle Beach, SC",
				par: 72,
				fieldTeams: 16,
				fieldPlayers: null,
				status: "complete",
				teamPlace: "T6 through 36",
				teamRounds: [
					282,
					289,
					null
				],
				teamTotal: 571,
				teamToPar: -5,
				source: "athletics",
				sourceLabel: "KSU recaps Sep 6–7. R3 not yet on the athletics recap — shown as pending, not guessed.",
				sourceUrl: "https://ksuowls.com/news/2026/9/7/mens-golf-salierno-gantt-lead-owls-at-myrtle-beach-golf-trips-intercollegiate-monday.aspx",
				clippdUrl: "https://scoreboard.clippd.com/teams/4172/schedule",
				lineupNote: "Scoring five: Gantt, Caraballo, Salierno, Gallingani, Brash. Sweigart IND. Gillard and Todd DNP.",
				note: "Round 3 scores were not on the athletics recap as of Sep 14. R1/R2 below are from official recaps. Gantt R2 reconstructed as 72 from team 289 + published splits (prose 'even-par 70' does not reconcile).",
				scores: [
					{
						playerId: "ksu-gantt",
						role: "team",
						rounds: [
							68,
							72,
							null
						],
						toPar: -4,
						finish: "T11 thru 36",
						counted: [
							true,
							true,
							null
						]
					},
					{
						playerId: "ksu-salierno",
						role: "team",
						rounds: [
							70,
							70,
							null
						],
						toPar: -4,
						finish: "T11 thru 36",
						counted: [
							true,
							true,
							null
						]
					},
					{
						playerId: "ksu-caraballo",
						role: "team",
						rounds: [
							69,
							78,
							null
						],
						toPar: 3,
						finish: "T48 thru 36",
						counted: [
							true,
							false,
							null
						]
					},
					{
						playerId: "ksu-gallingani",
						role: "team",
						rounds: [
							75,
							70,
							null
						],
						toPar: 1,
						finish: "T34 thru 36",
						counted: [
							true,
							true,
							null
						]
					},
					{
						playerId: "ksu-brash",
						role: "team",
						rounds: [
							78,
							77,
							null
						],
						toPar: 11,
						finish: "T87 thru 36",
						counted: [
							false,
							true,
							null
						]
					},
					{
						playerId: "ksu-sweigart",
						role: "ind",
						rounds: [
							73,
							80,
							null
						],
						toPar: 9,
						finish: null,
						counted: [
							false,
							false,
							null
						]
					}
				]
			},
			{
				id: "ksu-poston-2026",
				name: "J.T. Poston Invitational",
				dates: "Sep 13–15, 2026",
				venue: "Waynesville Inn & Golf Club · Waynesville, NC",
				par: 71,
				fieldTeams: null,
				fieldPlayers: null,
				status: "live",
				teamPlace: null,
				teamRounds: [
					null,
					null,
					null
				],
				teamTotal: null,
				teamToPar: null,
				scores: [],
				source: "athletics",
				sourceLabel: "KSU schedule — in progress. Lineup not posted on the recap feed yet.",
				sourceUrl: "https://ksuowls.com/sports/mens-golf/schedule",
				clippdUrl: "https://scoreboard.clippd.com/teams/4172/schedule",
				note: "Watch whether Gillard or Todd enter the five, and whether Sweigart stays IND. That is the next 5th-year read."
			},
			{
				id: "ksu-cusa-2027",
				name: "Conference USA Championship",
				dates: "Apr 26–28, 2027",
				venue: "Pearland, TX",
				par: 72,
				fieldTeams: 11,
				fieldPlayers: null,
				status: "upcoming",
				teamPlace: null,
				teamRounds: [],
				teamTotal: null,
				teamToPar: null,
				scores: [],
				source: "athletics",
				sourceLabel: "KSU schedule",
				sourceUrl: "https://ksuowls.com/sports/mens-golf/schedule"
			}
		],
		insights: [
			{
				id: "ksu-1",
				tone: "down",
				title: "Both seniors omitted from the season opener",
				body: "Hunter Gillard and Joshua Todd did not play Myrtle Beach. A senior who is not in the first five — and not even in the IND slot — starts the year with a depressed 5th-year probability. Gillard was a regular in 2025-26 (26 rounds, 71.92). Todd was already sparse (3 rounds, 79.67). Same year, two very different watches.",
				evidence: "KSU Sep 6–7 recaps; 2025-26 season stats PDF.",
				confidence: "confirmed",
				playerIds: ["ksu-gillard", "ksu-todd"],
				eventId: "ksu-myrtle-2026"
			},
			{
				id: "ksu-2",
				tone: "down",
				title: "5th-year Sweigart used as an individual, then faded",
				body: "Reed Sweigart opened 73 as IND and followed with 80. He is already in extra eligibility. If Poston keeps him IND or omits him, treat the 2027 slot as closer to open than occupied.",
				evidence: "Myrtle Beach IND scoring, athletics recaps.",
				confidence: "confirmed",
				playerIds: ["ksu-sweigart"],
				eventId: "ksu-myrtle-2026"
			},
			{
				id: "ksu-3",
				tone: "up",
				title: "Freshmen occupying the seats seniors would need",
				body: "Salierno (Fr) matched Gantt at 4-under through 36. Caraballo (Fr) was in the five and counted R1 (69). When freshmen count in the four, a returning senior has to beat them, not just exist on the roster.",
				evidence: "Myrtle Beach team scorecard, R1 282 / R2 289.",
				confidence: "inferred",
				playerIds: [
					"ksu-salierno",
					"ksu-caraballo",
					"ksu-gantt"
				],
				eventId: "ksu-myrtle-2026"
			}
		]
	},
	{
		id: "shu",
		name: "Seton Hall",
		short: "Seton Hall",
		div: "D1",
		conf: "BIG EAST",
		coach: "Seton Hall Men's Golf",
		clippd: "https://scoreboard.clippd.com/teams/3163",
		clippdSchedule: "https://scoreboard.clippd.com/teams/3163/schedule",
		rosterUrl: "https://shupirates.com/sports/mens-golf/roster",
		seniors: 3,
		intel: "Best current example of the selection model. Lagowitz: Goodnight T3 and De Jesus T5 as individuals; Holmes T5 in the team; Shah never counted. RedHawk then moves Goodnight and De Jesus into the five-man team and sends Williams to IND. Senior status alone is not enough. Recent performance and the coach's next card are the signal.",
		players: [
			{
				id: "shu-dejesus",
				name: "Jacob De Jesus",
				year: "Sr",
				hometown: "Bridgewater, NJ",
				signal: "Promoted to RedHawk five after T5 IND"
			},
			{
				id: "shu-goodnight",
				name: "Blake Goodnight",
				year: "So",
				hometown: "Dallas, TX",
				signal: "Promoted to RedHawk five after T3 IND"
			},
			{
				id: "shu-hennessee",
				name: "Will Hennessee",
				year: "Jr",
				hometown: "Tulsa, OK",
				signal: "Locked — 2nd at Lagowitz"
			},
			{
				id: "shu-holmes",
				name: "Dylan Holmes",
				year: "Fr",
				hometown: "Wicklow, Ireland",
				signal: "Freshman held the five after T5 debut"
			},
			{
				id: "shu-nolan",
				name: "Luke Nolan",
				year: "Jr",
				hometown: "Austin, TX",
				signal: "Held the five"
			},
			{
				id: "shu-oriordan",
				name: "Will O'Riordan",
				year: "Fr",
				hometown: "Wicklow, Ireland",
				signal: "Development / DNP both cards"
			},
			{
				id: "shu-shah",
				name: "Eli Shah",
				year: "Sr",
				hometown: "Newtown Square, PA",
				signal: "Omitted after never counting"
			},
			{
				id: "shu-williams",
				name: "Isaiah Williams",
				year: "Sr",
				hometown: "Flemington, NJ",
				signal: "Relegated to RedHawk IND"
			}
		],
		events: [
			{
				id: "shu-lagowitz-2026",
				name: "Alex Lagowitz Memorial",
				dates: "Sep 5–6, 2026",
				venue: "Seven Oaks Golf Club · Hamilton, NY",
				par: 72,
				fieldTeams: 13,
				fieldPlayers: null,
				status: "complete",
				teamPlace: "1st of 13",
				teamRounds: [
					278,
					286,
					289
				],
				teamTotal: 853,
				teamToPar: -11,
				source: "athletics",
				sourceLabel: "Seton Hall recap — Pirates Claim Lagowitz Title (Sep 6)",
				sourceUrl: "https://shupirates.com/news/2026/9/6/mens-golf-pirates-claim-lagowitz-title-as-four-place-in-top-5",
				clippdUrl: "https://scoreboard.clippd.com/teams/3163",
				lineupNote: "Team: Hennessee, Holmes, Williams, Nolan, Shah. IND: Goodnight, De Jesus. 5-count-4; Shah was the drop in all three rounds.",
				scores: [
					{
						playerId: "shu-hennessee",
						role: "team",
						rounds: [
							70,
							71,
							70
						],
						toPar: -5,
						finish: "2nd",
						counted: [
							true,
							true,
							true
						]
					},
					{
						playerId: "shu-goodnight",
						role: "ind",
						rounds: [
							74,
							70,
							68
						],
						toPar: -4,
						finish: "T3",
						counted: [
							false,
							false,
							false
						]
					},
					{
						playerId: "shu-holmes",
						role: "team",
						rounds: [
							67,
							74,
							72
						],
						toPar: -3,
						finish: "T5",
						counted: [
							true,
							false,
							true
						]
					},
					{
						playerId: "shu-dejesus",
						role: "ind",
						rounds: [
							72,
							70,
							71
						],
						toPar: -3,
						finish: "T5",
						counted: [
							false,
							false,
							false
						]
					},
					{
						playerId: "shu-williams",
						role: "team",
						rounds: [
							72,
							69,
							73
						],
						toPar: -2,
						finish: "T11",
						counted: [
							true,
							true,
							true
						]
					},
					{
						playerId: "shu-nolan",
						role: "team",
						rounds: [
							69,
							72,
							74
						],
						toPar: -1,
						finish: "T14",
						counted: [
							true,
							true,
							true
						]
					},
					{
						playerId: "shu-shah",
						role: "team",
						rounds: [
							74,
							74,
							79
						],
						toPar: 11,
						finish: "T61",
						counted: [
							false,
							false,
							false
						]
					}
				]
			},
			{
				id: "shu-redhawk-2026",
				name: "RedHawk Invitational",
				dates: "Sep 14–15, 2026",
				venue: "Pittsburgh Field Club · Pittsburgh, PA",
				par: 71,
				fieldTeams: null,
				fieldPlayers: null,
				status: "live",
				teamPlace: null,
				teamRounds: [
					null,
					null,
					null
				],
				teamTotal: null,
				teamToPar: null,
				source: "athletics",
				sourceLabel: "Seton Hall preview — Pirates Take On RedHawk (Sep 13). Lineup confirmed; live scores belong on Clippd.",
				sourceUrl: "https://shupirates.com/news/2026/9/13/mens-golf-pirates-take-on-redhawk-invitational-monday",
				clippdUrl: "https://scoreboard.clippd.com/teams/3163/schedule",
				lineupNote: "Team: Hennessee, Goodnight, De Jesus, Nolan, Holmes. IND: Williams. Shah omitted.",
				scores: [
					{
						playerId: "shu-hennessee",
						role: "team",
						rounds: [
							null,
							null,
							null
						],
						toPar: null,
						finish: null,
						counted: [
							null,
							null,
							null
						]
					},
					{
						playerId: "shu-goodnight",
						role: "team",
						rounds: [
							null,
							null,
							null
						],
						toPar: null,
						finish: null,
						counted: [
							null,
							null,
							null
						]
					},
					{
						playerId: "shu-dejesus",
						role: "team",
						rounds: [
							null,
							null,
							null
						],
						toPar: null,
						finish: null,
						counted: [
							null,
							null,
							null
						]
					},
					{
						playerId: "shu-nolan",
						role: "team",
						rounds: [
							null,
							null,
							null
						],
						toPar: null,
						finish: null,
						counted: [
							null,
							null,
							null
						]
					},
					{
						playerId: "shu-holmes",
						role: "team",
						rounds: [
							null,
							null,
							null
						],
						toPar: null,
						finish: null,
						counted: [
							null,
							null,
							null
						]
					},
					{
						playerId: "shu-williams",
						role: "ind",
						rounds: [
							null,
							null,
							null
						],
						toPar: null,
						finish: null,
						counted: [
							false,
							false,
							false
						]
					}
				]
			},
			{
				id: "shu-macdonald-2026",
				name: "MacDonald Cup",
				dates: "Fall 2026",
				venue: "Yale Golf Club · New Haven, CT",
				par: 70,
				fieldTeams: null,
				fieldPlayers: null,
				status: "upcoming",
				teamPlace: null,
				teamRounds: [],
				teamTotal: null,
				teamToPar: null,
				scores: [],
				source: "athletics",
				sourceLabel: "Seton Hall 2026-27 schedule",
				sourceUrl: "https://shupirates.com/sports/mens-golf/schedule",
				note: "Third card of the fall — the first chance to see whether RedHawk's new five is sticky."
			}
		],
		insights: [
			{
				id: "shu-1",
				tone: "up",
				title: "IND performance forced the next lineup",
				body: "Goodnight (T3, 74-70-68) and De Jesus (T5, 72-70-71) beat every Pirate except Hennessee as individuals. The RedHawk five is Hennessee, Goodnight, De Jesus, Nolan, Holmes. That is coach selection tracking the scoreboard, not class year.",
				evidence: "Lagowitz recap + RedHawk preview lineup.",
				confidence: "confirmed",
				playerIds: ["shu-goodnight", "shu-dejesus"],
				eventId: "shu-redhawk-2026"
			},
			{
				id: "shu-2",
				tone: "down",
				title: "Williams moved from scoring five to IND",
				body: "Isaiah Williams counted all three Lagowitz rounds (72-69-73, T11, −2) and still lost his team seat. A senior who is selected, then immediately relegated, is not a locked 5th-year. Treat him as contested, not retained.",
				evidence: "Lagowitz team scorecard vs RedHawk preview.",
				confidence: "confirmed",
				playerIds: ["shu-williams"],
				eventId: "shu-redhawk-2026"
			},
			{
				id: "shu-3",
				tone: "down",
				title: "Shah never counted, then was omitted",
				body: "Eli Shah's Lagowitz card was 74-74-79. He was the drop in R1, R2 and R3, and he is not on the RedHawk team or IND list. A senior who does not count and then does not travel has the lowest 5th-year probability on this roster.",
				evidence: "5-count-4 reconstruction of 278-286-289; RedHawk preview omits Shah.",
				confidence: "confirmed",
				playerIds: ["shu-shah"],
				eventId: "shu-lagowitz-2026"
			},
			{
				id: "shu-4",
				tone: "up",
				title: "Freshman Holmes kept the seat he earned",
				body: "Dylan Holmes opened with 67, finished T5, and is in the RedHawk five ahead of a senior who had been in the previous five. Freshman lock-in is the other half of the 2027 math: seats taken now are seats not opening later.",
				evidence: "Lagowitz T5 + RedHawk team listing.",
				confidence: "confirmed",
				playerIds: ["shu-holmes"],
				eventId: "shu-redhawk-2026"
			}
		]
	},
	{
		id: "ucsb",
		name: "UC Santa Barbara",
		short: "UCSB",
		div: "D1",
		conf: "Big West",
		coach: "UCSB Men's Golf",
		clippd: "https://scoreboard.clippd.com/teams/2520",
		clippdSchedule: "https://scoreboard.clippd.com/teams/2520/schedule",
		rosterUrl: "https://ucsbgauchos.com/sports/mens-golf/roster",
		seniors: 2,
		intel: "Two seniors, but Waldock and Reyes do not have the same performance profile. Reyes was already used as an individual at the 2026 UC San Diego Invitational while Watters (then So, now Jr) posted T5. A strong senior who is repeatedly in the scoring five should carry a much higher 5th-year probability than a senior outside it.",
		players: [
			{
				id: "ucsb-birolini",
				name: "Andrea Birolini",
				year: "Fr",
				hometown: "Milan, Italy",
				signal: "Development"
			},
			{
				id: "ucsb-gahr",
				name: "Harrison Gahr",
				year: "So",
				hometown: "Calabasas, CA",
				signal: "Core return"
			},
			{
				id: "ucsb-ma",
				name: "Dylan Ma",
				year: "Jr",
				hometown: "Beijing, China",
				signal: "Strong performance signal"
			},
			{
				id: "ucsb-reyes",
				name: "Andrew Reyes",
				year: "Sr",
				hometown: "Perry, GA",
				signal: "5th-year watch / often IND"
			},
			{
				id: "ucsb-schwab",
				name: "Zach Schwab",
				year: "So",
				hometown: "Los Angeles, CA",
				signal: "Core return"
			},
			{
				id: "ucsb-turner",
				name: "Jackson Turner",
				year: "Jr",
				hometown: "Thousand Oaks, CA",
				signal: "Selection watch"
			},
			{
				id: "ucsb-waldock",
				name: "Nick Waldock",
				year: "Sr",
				hometown: "Westlake Village, CA",
				signal: "5th-year watch / regular"
			},
			{
				id: "ucsb-watters",
				name: "Jack Watters",
				year: "Jr",
				hometown: "Austin, TX",
				signal: "Strong performance signal"
			}
		],
		events: [
			{
				id: "ucsb-ram-2026",
				name: "Ram Masters Invitational",
				dates: "Sep 10–11, 2026",
				venue: "Fort Collins Country Club · Fort Collins, CO",
				par: 70,
				fieldTeams: null,
				fieldPlayers: null,
				status: "complete",
				teamPlace: "12th",
				teamRounds: [
					293,
					290,
					292
				],
				teamTotal: 875,
				teamToPar: null,
				scores: [],
				source: "athletics",
				sourceLabel: "UCSB 2026-27 schedule (team totals). Player scorecard not yet reconciled from Clippd — not invented.",
				sourceUrl: "https://ucsbgauchos.com/sports/mens-golf/schedule",
				clippdUrl: "https://scoreboard.clippd.com/teams/2520/schedule",
				note: "Team line is confirmed. Individual R1/R2/R3 for the 2026 event still needs a Clippd or recap pull."
			},
			{
				id: "ucsb-ucsd-2026",
				name: "UC San Diego Invitational (prior spring)",
				dates: "Mar 22–24, 2026",
				venue: "Torrey Pines · San Diego, CA",
				par: 72,
				fieldTeams: null,
				fieldPlayers: null,
				status: "historical",
				teamPlace: "2nd",
				teamRounds: [
					280,
					288,
					285
				],
				teamTotal: 853,
				teamToPar: -11,
				source: "athletics",
				sourceLabel: "UCSB recap — Gauchos Finish Runner-Up (Mar 24, 2026). Reyes IND from the Holy Cross results sheet.",
				sourceUrl: "https://ucsbgauchos.com/news/2026/3/24/mens-golf-gauchos-finish-runner-up-at-uc-san-diego-invitational.aspx",
				clippdUrl: "https://scoreboard.clippd.com/teams/2520",
				lineupNote: "Team: Watters, Gay (graduated), Ma, Schwab, Waldock. Reyes competed IND.",
				scores: [
					{
						playerId: "ucsb-watters",
						role: "team",
						rounds: [
							71,
							73,
							66
						],
						toPar: -6,
						finish: "T5",
						counted: [
							true,
							true,
							true
						]
					},
					{
						playerId: "ucsb-ma",
						role: "team",
						rounds: [
							71,
							71,
							75
						],
						toPar: 1,
						finish: "T31",
						counted: [
							true,
							true,
							true
						]
					},
					{
						playerId: "ucsb-schwab",
						role: "team",
						rounds: [
							69,
							78,
							74
						],
						toPar: 5,
						finish: "T51",
						counted: [
							true,
							false,
							true
						]
					},
					{
						playerId: "ucsb-waldock",
						role: "team",
						rounds: [
							74,
							70,
							78
						],
						toPar: 6,
						finish: "T59",
						counted: [
							false,
							true,
							false
						]
					},
					{
						playerId: "ucsb-reyes",
						role: "ind",
						rounds: [
							73,
							75,
							72
						],
						toPar: 4,
						finish: "T43",
						counted: [
							false,
							false,
							false
						]
					}
				]
			},
			{
				id: "ucsb-gaucho-2027",
				name: "Gaucho Invitational",
				dates: "Apr 5–6, 2027",
				venue: "Sandpiper Golf Club · Santa Barbara, CA",
				par: 72,
				fieldTeams: null,
				fieldPlayers: null,
				status: "upcoming",
				teamPlace: null,
				teamRounds: [],
				teamTotal: null,
				teamToPar: null,
				scores: [],
				source: "athletics",
				sourceLabel: "UCSB schedule",
				sourceUrl: "https://ucsbgauchos.com/sports/mens-golf/schedule"
			},
			{
				id: "ucsb-bigwest-2027",
				name: "Big West Championship",
				dates: "May 2–4, 2027",
				venue: "La Quinta Country Club · Palm Desert, CA",
				par: 72,
				fieldTeams: null,
				fieldPlayers: null,
				status: "upcoming",
				teamPlace: null,
				teamRounds: [],
				teamTotal: null,
				teamToPar: null,
				scores: [],
				source: "athletics",
				sourceLabel: "UCSB schedule",
				sourceUrl: "https://ucsbgauchos.com/sports/mens-golf/schedule"
			}
		],
		insights: [{
			id: "ucsb-1",
			tone: "watch",
			title: "Waldock vs Reyes is the 5th-year split",
			body: "Both are seniors. At Torrey Pines, Waldock was in the five (and counted R2). Reyes was IND (73-75-72, T43). Selection already disagrees with the raw senior count. Fall 2026 player cards will confirm whether that split held.",
			evidence: "UCSD Invite recap + results sheet.",
			confidence: "confirmed",
			playerIds: ["ucsb-waldock", "ucsb-reyes"],
			eventId: "ucsb-ucsd-2026"
		}, {
			id: "ucsb-2",
			tone: "info",
			title: "Watters is the player seniors have to beat",
			body: "Jack Watters closed Torrey Pines 66 to T5. He is a junior, not a 2027 vacancy. Any 5th-year case for a UCSB senior has to outrank Watters, Ma and Schwab in the four, not merely post a respectable IND number.",
			evidence: "UCSD Invite individual standings.",
			confidence: "inferred",
			playerIds: ["ucsb-watters", "ucsb-ma"],
			eventId: "ucsb-ucsd-2026"
		}]
	},
	{
		id: "howard",
		name: "Howard",
		short: "Howard",
		div: "D1",
		conf: "MEAC",
		coach: "Sam Puryear",
		clippd: "https://scoreboard.clippd.com/",
		clippdSchedule: "https://scoreboard.clippd.com/",
		rosterUrl: "https://hubison.com/sports/mgolf/roster",
		seniors: 6,
		intel: "Six seniors make this the highest-turnover watch on the list. Six seniors does not mean six openings. Selection frequency, scoring performance, and whether Puryear keeps a player in the five-man unit should drive 5th-year probability. Fall Clippd cards are the missing input.",
		players: [
			{
				id: "how-dimosi",
				name: "Kezaia Dimosi",
				year: "Sr",
				hometown: "London, England",
				signal: "5th-year watch"
			},
			{
				id: "how-grey",
				name: "Mitchell Grey",
				year: "Sr",
				hometown: "Mississauga, Canada",
				signal: "5th-year watch"
			},
			{
				id: "how-huff",
				name: "Bear Huff",
				year: "Sr",
				hometown: "Riverside, CA",
				signal: "5th-year watch"
			},
			{
				id: "how-jones",
				name: "Marlon Jones",
				year: "Sr",
				hometown: "Berkeley, CA",
				signal: "5th-year watch"
			},
			{
				id: "how-mahy",
				name: "Nino Mahy",
				year: "Fr",
				hometown: "Louvain, Belgium",
				signal: "Development"
			},
			{
				id: "how-martinez",
				name: "Ander Martinez",
				year: "So",
				hometown: "Alvarado, Mexico",
				signal: "Core return"
			},
			{
				id: "how-perez",
				name: "Francisco Perez",
				year: "Sr",
				hometown: "Los Mochis, Mexico",
				signal: "5th-year watch"
			},
			{
				id: "how-perroni",
				name: "Mathis Perroni",
				year: "Sr",
				hometown: "Metz, France",
				signal: "5th-year watch"
			},
			{
				id: "how-perusse",
				name: "Michael Perusse",
				year: "Jr",
				hometown: "Pearland, TX",
				signal: "Core / selection watch"
			},
			{
				id: "how-szpak",
				name: "Nathan Szpakowicz",
				year: "Fr",
				hometown: "—",
				signal: "Development"
			}
		],
		events: [{
			id: "how-fall-2026",
			name: "Fall tournament block",
			dates: "Fall 2026",
			venue: "Use Clippd team schedule",
			par: 72,
			fieldTeams: null,
			fieldPlayers: null,
			status: "upcoming",
			teamPlace: null,
			teamRounds: [],
			teamTotal: null,
			teamToPar: null,
			scores: [],
			source: "athletics",
			sourceLabel: "Howard roster confirmed; Clippd team page still needs a stable ID.",
			sourceUrl: "https://hubison.com/sports/mgolf/roster",
			note: "No fall 2026 player scorecard is published here yet. Theoretical openings stay 0–6 until a five-man unit is observed."
		}, {
			id: "how-meac-2027",
			name: "MEAC Championship",
			dates: "Spring 2027",
			venue: "Conference championship",
			par: 72,
			fieldTeams: null,
			fieldPlayers: null,
			status: "upcoming",
			teamPlace: null,
			teamRounds: [],
			teamTotal: null,
			teamToPar: null,
			scores: [],
			source: "athletics",
			sourceLabel: "Conference championship placeholder",
			sourceUrl: "https://hubison.com/sports/mgolf/roster"
		}],
		insights: [{
			id: "how-1",
			tone: "watch",
			title: "Highest theoretical pool, lowest current evidence",
			body: "Six seniors is the ceiling, not the forecast. Until Clippd shows who is in the scoring five, this monitor will not convert 0–6 into a narrower range.",
			evidence: "Howard 2026-27 athletics roster.",
			confidence: "unknown",
			playerIds: []
		}]
	},
	{
		id: "man",
		name: "Manhattan",
		short: "Manhattan",
		div: "D1",
		conf: "MAAC",
		coach: "Manhattan Men's Golf",
		clippd: "https://scoreboard.clippd.com/teams/3652",
		clippdSchedule: "https://scoreboard.clippd.com/teams/3652/schedule",
		rosterUrl: "https://gojaspers.com/sports/mens-golf/roster",
		seniors: 1,
		intel: "Only one senior on the snapshot means the 2027 opening range is narrow. The monitor should focus on whether Dimitri Mihelakos is a regular scoring-five selection. If he is not, 5th-year probability should fall and the practical opening stays close to one.",
		players: [
			{
				id: "man-carley",
				name: "Walter Carley",
				year: "Jr",
				hometown: "Peterborough, Ontario",
				signal: "Core return"
			},
			{
				id: "man-faulkner",
				name: "Cabell Faulkner",
				year: "So",
				hometown: "Potomac, MD",
				signal: "Core return"
			},
			{
				id: "man-huang",
				name: "Aaron Huang",
				year: "So",
				hometown: "Sarasota, FL",
				signal: "Core return"
			},
			{
				id: "man-mandadapu",
				name: "Akshay Mandadapu",
				year: "Jr",
				hometown: "Dallas, TX",
				signal: "Core return"
			},
			{
				id: "man-mihelakos",
				name: "Dimitri Mihelakos",
				year: "Sr",
				hometown: "Halifax, Nova Scotia",
				signal: "Lone senior / 5th-year watch"
			},
			{
				id: "man-sica",
				name: "Carter Sica",
				year: "Fr",
				hometown: "—",
				signal: "Development"
			}
		],
		events: [{
			id: "man-fall-2026",
			name: "Fall tournament block",
			dates: "Fall 2026",
			venue: "Clippd schedule / results",
			par: 72,
			fieldTeams: null,
			fieldPlayers: null,
			status: "upcoming",
			teamPlace: null,
			teamRounds: [],
			teamTotal: null,
			teamToPar: null,
			scores: [],
			source: "clippd",
			sourceLabel: "Clippd team 3652 — player cards not yet loaded into this monitor",
			sourceUrl: "https://scoreboard.clippd.com/teams/3652/schedule",
			clippdUrl: "https://scoreboard.clippd.com/teams/3652/schedule",
			note: "Need the first fall scorecard to see whether Mihelakos is in the five or already IND/DNP."
		}, {
			id: "man-maac-2027",
			name: "MAAC Championship",
			dates: "Spring 2027",
			venue: "Conference championship",
			par: 72,
			fieldTeams: null,
			fieldPlayers: null,
			status: "upcoming",
			teamPlace: null,
			teamRounds: [],
			teamTotal: null,
			teamToPar: null,
			scores: [],
			source: "athletics",
			sourceLabel: "Manhattan schedule placeholder",
			sourceUrl: "https://gojaspers.com/sports/mens-golf/roster"
		}],
		insights: [{
			id: "man-1",
			tone: "info",
			title: "Single-senior geometry",
			body: "With one senior, Manhattan cannot produce a 2027 class from eligibility alone. The only way the range moves is Mihelakos returning (shrinks to ~0) or an unexpected transfer/cut among underclassmen.",
			evidence: "Current athletics roster snapshot.",
			confidence: "inferred",
			playerIds: ["man-mihelakos"]
		}]
	},
	{
		id: "fdu",
		name: "Fairleigh Dickinson",
		short: "FDU",
		div: "D1",
		conf: "NEC",
		coach: "FDU Men's Golf",
		clippd: "https://scoreboard.clippd.com/",
		clippdSchedule: "https://scoreboard.clippd.com/",
		rosterUrl: "https://fduknights.com/sports/mens-golf/roster",
		seniors: 6,
		intel: "Six seniors create a large theoretical turnover pool. The useful question is which seniors are actually trusted in the five-man unit. Selection history can convert a 0–6 theoretical range into a much narrower practical range once fall Clippd cards land.",
		players: [
			{
				id: "fdu-chen",
				name: "Ruoshi Chen",
				year: "Fr",
				hometown: "Beijing, China",
				signal: "Development"
			},
			{
				id: "fdu-dhupia",
				name: "Ranveer Dhupia",
				year: "So",
				hometown: "Delhi, India",
				signal: "Core return"
			},
			{
				id: "fdu-howell",
				name: "James Howell",
				year: "Sr",
				hometown: "Cardiff, Wales",
				signal: "5th-year watch"
			},
			{
				id: "fdu-nutthachai",
				name: "Nutthachai Khamkhokgruad",
				year: "So",
				hometown: "—",
				signal: "Core return"
			},
			{
				id: "fdu-kudlac",
				name: "Matus Kudlac",
				year: "Sr",
				hometown: "Bratislava, Slovakia",
				signal: "5th-year watch"
			},
			{
				id: "fdu-mckernan",
				name: "Will McKernan",
				year: "Sr",
				hometown: "Saffron Walden, England",
				signal: "5th-year watch"
			},
			{
				id: "fdu-piccoli",
				name: "Pietro Maria Piccoli",
				year: "So",
				hometown: "Verona, Italy",
				signal: "Core return"
			},
			{
				id: "fdu-portugal",
				name: "Jake Portugal",
				year: "Sr",
				hometown: "South Salem, NY",
				signal: "5th-year watch"
			},
			{
				id: "fdu-sanmathy",
				name: "Shreyas Sanmathy",
				year: "So",
				hometown: "Hampshire, England",
				signal: "Core return"
			},
			{
				id: "fdu-singh",
				name: "Angad Singh",
				year: "So",
				hometown: "Karnataka, India",
				signal: "Core return"
			},
			{
				id: "fdu-sutter",
				name: "Thomas Sutter Jr.",
				year: "Sr",
				hometown: "White Plains, NY",
				signal: "5th-year watch"
			},
			{
				id: "fdu-velasquez",
				name: "Ricardo Velasquez",
				year: "Sr",
				hometown: "Pereira, Colombia",
				signal: "5th-year watch"
			},
			{
				id: "fdu-wen",
				name: "Eric Wen",
				year: "So",
				hometown: "Waterloo, Ontario",
				signal: "Core return"
			}
		],
		events: [{
			id: "fdu-fall-2026",
			name: "Fall tournament block",
			dates: "Fall 2026",
			venue: "Clippd schedule / results",
			par: 72,
			fieldTeams: null,
			fieldPlayers: null,
			status: "upcoming",
			teamPlace: null,
			teamRounds: [],
			teamTotal: null,
			teamToPar: null,
			scores: [],
			source: "athletics",
			sourceLabel: "FDU roster confirmed; Clippd team identity still unreconciled",
			sourceUrl: "https://fduknights.com/sports/mens-golf/roster",
			note: "Do not treat six seniors as six scholarships. Wait for the first five-man card."
		}, {
			id: "fdu-nec-2027",
			name: "NEC Championship",
			dates: "Spring 2027",
			venue: "Conference championship",
			par: 72,
			fieldTeams: null,
			fieldPlayers: null,
			status: "upcoming",
			teamPlace: null,
			teamRounds: [],
			teamTotal: null,
			teamToPar: null,
			scores: [],
			source: "athletics",
			sourceLabel: "FDU schedule placeholder",
			sourceUrl: "https://fduknights.com/sports/mens-golf/roster"
		}],
		insights: [{
			id: "fdu-1",
			tone: "watch",
			title: "Convert 0–6 with the first scoring five",
			body: "Six names in the senior column is a list, not a forecast. Rank them by start frequency and counted-round rate as soon as a Clippd event posts. The bottom two in that ranking should carry the lowest 5th-year probabilities.",
			evidence: "FDU 2026-27 roster snapshot.",
			confidence: "inferred",
			playerIds: [
				"fdu-howell",
				"fdu-kudlac",
				"fdu-mckernan",
				"fdu-portugal",
				"fdu-sutter",
				"fdu-velasquez"
			]
		}]
	},
	{
		id: "umhb",
		name: "UMHB",
		short: "UMHB",
		div: "D3",
		conf: "ASC",
		coach: "UMHB Men's Golf",
		clippd: "https://scoreboard.clippd.com/",
		clippdSchedule: "https://scoreboard.clippd.com/",
		rosterUrl: "https://cruathletics.com/sports/mens-golf/roster",
		seniors: null,
		rosterUnknown: true,
		intel: "Current roster needs a fresh Clippd / athletics reconciliation before a credible 2027 opening estimate is shown. This monitor labels unknowns rather than guessing a senior count.",
		players: [],
		events: [{
			id: "umhb-transy-2026",
			name: "Transylvania Fall Invitational",
			dates: "Fall 2026",
			venue: "Season-opening result reported by UMHB",
			par: 72,
			fieldTeams: null,
			fieldPlayers: null,
			status: "upcoming",
			teamPlace: null,
			teamRounds: [],
			teamTotal: null,
			teamToPar: null,
			scores: [],
			source: "athletics",
			sourceLabel: "Clippd should be the primary results source once the team page is mapped",
			sourceUrl: "https://cruathletics.com/sports/mens-golf/roster",
			note: "Roster reconciliation required before player scorecards."
		}],
		insights: [{
			id: "umhb-1",
			tone: "info",
			title: "Unknown on purpose",
			body: "No senior count, no five-man unit, no 5th-year probabilities. Publishing a fake range would be worse than leaving this blank.",
			evidence: "No reconciled Clippd or athletics roster snapshot.",
			confidence: "unknown",
			playerIds: []
		}]
	},
	{
		id: "rochester",
		name: "University of Rochester",
		short: "Rochester",
		div: "D3",
		conf: "Liberty League",
		coach: "Dan Wesley",
		clippd: "https://scoreboard.clippd.com/teams/2457",
		clippdSchedule: "https://scoreboard.clippd.com/teams/2457/schedule",
		rosterUrl: "https://uofrathletics.com/sports/mens-golf/roster",
		seniors: 1,
		intel: "One senior means the 2027 turnover question is concentrated in Arjun Aujla. Clippd identifies Rochester as a nationally relevant D3 program, so selection consistency and senior performance should be tracked closely. First-years Haden Wang and Tommy Wang expand the underclass depth around him.",
		players: [
			{
				id: "roc-aujla",
				name: "Arjun Aujla",
				year: "Sr",
				hometown: "Greenbrae, CA",
				signal: "Lone senior / 5th-year watch"
			},
			{
				id: "roc-fowles",
				name: "Galen Fowles",
				year: "Jr",
				hometown: "Florence, MA",
				signal: "Core return"
			},
			{
				id: "roc-liu",
				name: "Harley Liu",
				year: "So",
				hometown: "Surrey, BC",
				signal: "Core return"
			},
			{
				id: "roc-palm",
				name: "Anderson Palm",
				year: "So",
				hometown: "Western Springs, IL",
				signal: "Core return"
			},
			{
				id: "roc-su",
				name: "Ray Su",
				year: "So",
				hometown: "Xiamen, China",
				signal: "Core return"
			},
			{
				id: "roc-hwang",
				name: "Haden Wang",
				year: "Fr",
				hometown: "Richmond Hill, Ontario",
				signal: "Development"
			},
			{
				id: "roc-twang",
				name: "Tommy Wang",
				year: "Fr",
				hometown: "Winter Garden, FL",
				signal: "Development"
			},
			{
				id: "roc-zhong",
				name: "Henry Zhong",
				year: "So",
				hometown: "Irving, TX",
				signal: "Core return"
			}
		],
		events: [{
			id: "roc-fall-2026",
			name: "Fall tournament block",
			dates: "Fall 2026",
			venue: "Clippd schedule / results",
			par: 72,
			fieldTeams: null,
			fieldPlayers: null,
			status: "upcoming",
			teamPlace: null,
			teamRounds: [],
			teamTotal: null,
			teamToPar: null,
			scores: [],
			source: "clippd",
			sourceLabel: "Clippd team 2457 — wait for the first 2026-27 scorecard",
			sourceUrl: "https://scoreboard.clippd.com/teams/2457/schedule",
			clippdUrl: "https://scoreboard.clippd.com/teams/2457/schedule",
			note: "Aujla's start rate vs Fowles / Liu / Palm is the entire 2027 model for this program."
		}, {
			id: "roc-liberty-2027",
			name: "Liberty League Championship",
			dates: "Spring 2027",
			venue: "Conference championship",
			par: 72,
			fieldTeams: null,
			fieldPlayers: null,
			status: "upcoming",
			teamPlace: null,
			teamRounds: [],
			teamTotal: null,
			teamToPar: null,
			scores: [],
			source: "athletics",
			sourceLabel: "Rochester schedule placeholder",
			sourceUrl: "https://uofrathletics.com/sports/mens-golf/roster"
		}],
		insights: [{
			id: "roc-1",
			tone: "watch",
			title: "One name, one vacancy path",
			body: "If Aujla is a regular in the scoring five through the fall, 5th-year probability rises and 2027 openings compress toward zero. If he is IND or omitted, treat the seat as likely open. Do not invent a multi-spot class here.",
			evidence: "2026-27 athletics roster (Wesley).",
			confidence: "inferred",
			playerIds: ["roc-aujla"]
		}]
	},
	{
		id: "cmu",
		name: "Carnegie Mellon",
		short: "Carnegie Mellon",
		div: "D3",
		conf: "UAA",
		coach: "CMU Men's Golf",
		clippd: "https://scoreboard.clippd.com/",
		clippdSchedule: "https://scoreboard.clippd.com/",
		rosterUrl: "https://athletics.cmu.edu/sports/mgolf/roster",
		seniors: null,
		rosterUnknown: true,
		intel: "Roster and Clippd team identity need reconciliation before assigning a 2027 opening range. Keep this as Unknown rather than manufacturing a senior count.",
		players: [],
		events: [{
			id: "cmu-fall-2026",
			name: "Fall tournament block",
			dates: "Fall 2026",
			venue: "Clippd schedule / results",
			par: 72,
			fieldTeams: null,
			fieldPlayers: null,
			status: "upcoming",
			teamPlace: null,
			teamRounds: [],
			teamTotal: null,
			teamToPar: null,
			scores: [],
			source: "athletics",
			sourceLabel: "Awaiting Clippd team map",
			sourceUrl: "https://athletics.cmu.edu/sports/mgolf/roster"
		}, {
			id: "cmu-uaa-2027",
			name: "UAA Championship",
			dates: "Spring 2027",
			venue: "Conference championship",
			par: 72,
			fieldTeams: null,
			fieldPlayers: null,
			status: "upcoming",
			teamPlace: null,
			teamRounds: [],
			teamTotal: null,
			teamToPar: null,
			scores: [],
			source: "athletics",
			sourceLabel: "CMU schedule placeholder",
			sourceUrl: "https://athletics.cmu.edu/sports/mgolf/roster"
		}],
		insights: [{
			id: "cmu-1",
			tone: "info",
			title: "No manufactured senior count",
			body: "Until the athletics roster and Clippd agree, this program stays in the unknown column.",
			evidence: "No reconciled snapshot.",
			confidence: "unknown",
			playerIds: []
		}]
	}
];
var PROGRAM_BY_ID = Object.fromEntries(PROGRAMS.map((p) => [p.id, p]));
function getProgram(id) {
	return PROGRAM_BY_ID[id];
}
function formatToPar(n) {
	if (n === null || n === void 0) return "—";
	if (n === 0) return "E";
	return n > 0 ? `+${n}` : `${n}`;
}
function formatRound(n) {
	if (n === null || n === void 0) return "—";
	return String(n);
}
function formatPlace(place) {
	if (!place) return "—";
	return place;
}
function isSeniorYear(year) {
	return year === "Sr" || year === "5th" || year === "Gr";
}
function eventsWithLineup(program) {
	return program.events.filter((e) => e.scores.length > 0);
}
function playerMetrics(program, player) {
	const events = eventsWithLineup(program);
	const scoredEvents = events.filter((e) => e.scores.some((s) => s.playerId === player.id && s.role !== "dnp"));
	let teamStarts = 0;
	let indStarts = 0;
	let countedRounds = 0;
	let teamRounds = 0;
	let toParSum = 0;
	let roundCount = 0;
	let lastRole = "none";
	for (const event of events) {
		const row = event.scores.find((s) => s.playerId === player.id);
		if (!row) {
			lastRole = "dnp";
			continue;
		}
		lastRole = row.role;
		if (row.role === "team") teamStarts += 1;
		if (row.role === "ind") indStarts += 1;
		if (row.role === "team") {
			for (let i = 0; i < row.rounds.length; i++) if (row.rounds[i] != null) {
				teamRounds += 1;
				if (row.counted[i]) countedRounds += 1;
			}
		}
		for (const r of row.rounds) if (r != null && event.par) {
			toParSum += r - event.par;
			roundCount += 1;
		}
	}
	const available = Math.max(events.length, 1);
	const startRate = teamStarts / available;
	const countedRate = teamRounds > 0 ? countedRounds / teamRounds : 0;
	const avgToParPerRound = roundCount > 0 ? toParSum / roundCount : null;
	let form = 50;
	if (avgToParPerRound != null) form = Math.max(0, Math.min(100, 62 - avgToParPerRound * 8));
	const recency = lastRole === "team" ? 100 : lastRole === "ind" ? 40 : lastRole === "dnp" ? 10 : 50;
	const indPenalty = events.length ? 1 - indStarts / available : 1;
	const selectionScore = Math.round(Math.max(0, Math.min(100, startRate * 38 + countedRate * 18 + form * .22 + recency * .14 + indPenalty * 8)));
	let fifthYearProb = null;
	let fifthYearLabel = "Not in the 2027 eligibility window";
	if (player.year === "5th" || player.year === "Gr") {
		fifthYearProb = 12;
		fifthYearLabel = "Already in extra year — likely gone unless confirmed return";
	} else if (player.year === "Sr") {
		let p = 32 + selectionScore * .38;
		if (lastRole === "ind") p -= 18;
		if (lastRole === "dnp") p -= 28;
		if (startRate < .4) p -= 12;
		if (countedRate < .4 && teamStarts > 0) p -= 10;
		fifthYearProb = Math.round(Math.max(8, Math.min(82, p)));
		fifthYearLabel = fifthYearProb >= 55 ? "Trusted scoring-five senior — higher return risk" : fifthYearProb >= 35 ? "Unsettled — watch next two lineups" : "Low return probability on current selection";
	} else if (player.year === "Jr" || player.year === "R-Jr") {
		fifthYearProb = null;
		fifthYearLabel = "2028 window";
	}
	return {
		player,
		eventsPlayed: scoredEvents.length,
		teamStarts,
		indStarts,
		dnpEvents: Math.max(0, events.length - scoredEvents.length),
		startRate,
		countedRounds,
		teamRounds,
		countedRate,
		avgToParPerRound,
		lastRole,
		selectionScore,
		fifthYearProb,
		fifthYearLabel,
		likelyVacates: player.year === "Sr" && (fifthYearProb ?? 100) < 45 || player.year === "5th" || player.year === "Gr"
	};
}
function allMetrics(program) {
	return program.players.map((p) => playerMetrics(program, p)).sort((a, b) => b.selectionScore - a.selectionScore);
}
function openingForecast(program) {
	if (program.rosterUnknown || program.seniors === null) return {
		theoretical: "Unknown",
		seniorCount: null,
		likely: null,
		possible: null,
		rangeLabel: "Unknown",
		turnover: "Roster unreconciled",
		confidence: "unknown",
		notes: "No opening range is published until Clippd and the official roster agree on the senior / 5th-year cohort."
	};
	const seniors = allMetrics(program).filter((m) => isSeniorYear(m.player.year));
	const likely = seniors.filter((m) => m.likelyVacates).length;
	const possible = seniors.filter((m) => (m.fifthYearProb ?? 100) < 65).length;
	const theoretical = `0–${program.seniors}`;
	const hasLineups = eventsWithLineup(program).length > 0;
	let turnover = "Low theoretical turnover";
	if (program.seniors >= 5) turnover = "High theoretical pool";
	else if (program.seniors >= 2) turnover = "Moderate theoretical pool";
	return {
		theoretical,
		seniorCount: program.seniors,
		likely: hasLineups ? likely : null,
		possible: hasLineups ? possible : null,
		rangeLabel: hasLineups ? `${likely}–${program.seniors}` : theoretical,
		turnover,
		confidence: hasLineups ? "inferred" : "inferred",
		notes: hasLineups ? "Practical range weights coach selection, not senior count. A senior repeatedly outside the scoring five is treated as more likely to vacate." : "Senior count is the theoretical ceiling only. Fall lineups will narrow the practical range."
	};
}
function detectMoves(program) {
	const events = eventsWithLineup(program).filter((e) => e.status === "complete" || e.status === "live" || e.status === "historical");
	if (events.length < 2) return [];
	const moves = [];
	for (let i = 1; i < events.length; i++) {
		const prev = events[i - 1];
		const next = events[i];
		const ids = /* @__PURE__ */ new Set([...prev.scores.map((s) => s.playerId), ...next.scores.map((s) => s.playerId)]);
		for (const id of ids) {
			const player = program.players.find((p) => p.id === id);
			if (!player) continue;
			const a = prev.scores.find((s) => s.playerId === id)?.role ?? "dnp";
			const b = next.scores.find((s) => s.playerId === id)?.role ?? "dnp";
			if (a === b) {
				if (a === "team") moves.push({
					playerId: id,
					name: player.name,
					from: a,
					to: b,
					kind: "held",
					fromEvent: prev.name,
					toEvent: next.name
				});
				continue;
			}
			let kind = "held";
			if (a === "dnp" && b === "team") kind = "debut";
			else if ((a === "ind" || a === "dnp") && b === "team") kind = "promoted";
			else if (a === "team" && b === "ind") kind = "relegated";
			else if ((a === "team" || a === "ind") && b === "dnp") kind = "omitted";
			else if (a === "dnp" && b === "ind") kind = "debut";
			moves.push({
				playerId: id,
				name: player.name,
				from: a,
				to: b,
				kind,
				fromEvent: prev.name,
				toEvent: next.name
			});
		}
	}
	return moves.filter((m) => m.kind !== "held" || events.length <= 2);
}
function opportunityScore(program) {
	const f = openingForecast(program);
	if (f.seniorCount == null) return 15;
	const likely = f.likely ?? Math.min(1, f.seniorCount);
	const evidence = eventsWithLineup(program).length > 0 ? 12 : 0;
	return Math.min(100, likely * 22 + f.seniorCount * 6 + evidence);
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var badgeVariants = cva("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase", {
	variants: { variant: {
		default: "bg-surface-2 text-muted border border-border",
		accent: "bg-accent/15 text-accent",
		live: "bg-under/15 text-under",
		down: "bg-over/15 text-over",
		warn: "bg-warn/15 text-warn",
		senior: "bg-warn/15 text-warn"
	} },
	defaultVariants: { variant: "default" }
});
function Badge({ className, variant, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn(badgeVariants({ variant }), className),
		...props
	});
}
var useIntelStore = create()(persist((set, get) => ({
	notes: {},
	starred: [],
	setNote: (playerId, note) => set({ notes: {
		...get().notes,
		[playerId]: note
	} }),
	toggleStar: (programId) => {
		set({ starred: get().starred.includes(programId) ? get().starred.filter((id) => id !== programId) : [...get().starred, programId] });
	}
}), { name: "arjun-golf-intel" }));
function ProgramNav({ activeId, onNavigate }) {
	const starred = useIntelStore((s) => s.starred);
	const d1 = PROGRAMS.filter((p) => p.div === "D1");
	const d3 = PROGRAMS.filter((p) => p.div === "D3");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
		className: "flex flex-col gap-1 px-2 pb-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Group, {
			label: "Division I",
			children: d1.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavItem, {
				id: p.id,
				name: p.name,
				div: p.div,
				live: p.events.some((e) => e.status === "live"),
				range: openingForecast(p).rangeLabel,
				active: activeId === p.id,
				starred: starred.includes(p.id),
				onNavigate
			}, p.id))
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Group, {
			label: "Division III",
			children: d3.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavItem, {
				id: p.id,
				name: p.name,
				div: p.div,
				live: p.events.some((e) => e.status === "live"),
				range: openingForecast(p).rangeLabel,
				active: activeId === p.id,
				starred: starred.includes(p.id),
				onNavigate
			}, p.id))
		})]
	});
}
function Group({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "px-3 pb-1.5 pt-2 text-[10px] font-medium uppercase tracking-[0.14em] text-subtle",
			children: label
		}), children]
	});
}
function NavItem({ id, name, div, live, range, active, starred, onNavigate }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to: "/team/$id",
		params: { id },
		onClick: onNavigate,
		className: cn("flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors duration-150", active ? "bg-surface-2 text-fg shadow-[var(--shadow-border)]" : "text-muted hover:bg-surface-2/70 hover:text-fg"),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "min-w-0 flex-1 truncate font-medium",
				children: name
			}),
			starred ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "size-3 shrink-0 fill-accent text-accent" }) : null,
			live ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "size-1.5 shrink-0 rounded-full bg-live",
				title: "Live this week"
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
				variant: div === "D3" ? "default" : "accent",
				children: div
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "w-10 shrink-0 text-right font-mono text-[10px] text-subtle",
				children: range
			})
		]
	});
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0", {
	variants: {
		variant: {
			default: "bg-accent text-accent-fg hover:bg-accent/90",
			secondary: "bg-surface-2 text-fg border border-border hover:border-border-strong",
			ghost: "text-muted hover:text-fg hover:bg-surface-2",
			outline: "border border-border bg-transparent text-fg hover:bg-surface-2",
			link: "text-accent underline-offset-4 hover:underline"
		},
		size: {
			default: "h-10 px-4",
			sm: "h-8 px-3 text-xs",
			lg: "h-11 px-5",
			icon: "size-10"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var Button = import_react.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		ref,
		...props
	});
});
Button.displayName = "Button";
var Sheet = Dialog;
var SheetTrigger = DialogTrigger;
function SheetContent({ className, children, side = "left" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, { className: "fixed inset-0 z-50 bg-bg/70 data-[state=open]:animate-in" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
		className: cn("fixed z-50 flex h-full w-[min(20rem,92vw)] flex-col bg-surface shadow-[var(--shadow-border)] outline-none", side === "left" ? "inset-y-0 left-0" : "inset-y-0 right-0", className),
		children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogClose, {
			className: "absolute right-3 top-3 rounded-md p-2 text-muted hover:text-fg",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "sr-only",
				children: "Close"
			})]
		})]
	})] });
}
function SheetTitle({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
		className: cn("font-display text-lg font-medium", className),
		...props
	});
}
function ScrollArea({ className, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Root, {
		className: cn("overflow-hidden", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Viewport, {
			className: "h-full w-full",
			children
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scrollbar, {
			orientation: "vertical",
			className: "flex w-2 touch-none select-none bg-transparent p-0.5",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Thumb, { className: "relative flex-1 rounded-full bg-border-strong" })
		})]
	});
}
function AppShell({ children, activeId }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-bg text-fg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-bg/90 px-3 py-3 backdrop-blur-sm sm:px-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Sheet, {
					open,
					onOpenChange: setOpen,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTrigger, {
						asChild: true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "icon",
							className: "lg:hidden",
							"aria-label": "Open programs",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "size-5" })
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "px-4 pb-2 pt-5",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, { children: "Programs" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScrollArea, {
						className: "h-[calc(100%-4rem)]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProgramNav, {
							activeId,
							onNavigate: () => setOpen(false)
						})
					})] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/",
					className: "flex min-w-0 items-center gap-2.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "flex size-8 items-center justify-center rounded-md bg-surface-2 text-accent",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flag, { className: "size-4" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block font-display text-lg font-medium leading-none tracking-tight",
							children: "Arjun Golf"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-0.5 hidden text-[11px] text-subtle sm:block",
							children: "2027 recruiting intelligence"
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "ml-auto flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "hidden rounded-full border border-border px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-muted sm:inline",
						children: "Updated Sep 14, 2026"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/model",
						className: "rounded-md px-3 py-2 text-xs text-muted hover:text-fg",
						children: "Model"
					})]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
				className: "sticky top-[3.35rem] hidden h-[calc(100vh-3.35rem)] w-64 shrink-0 border-r border-border bg-surface lg:block",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ScrollArea, {
					className: "h-full",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "px-3 pt-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/",
								className: "block rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-fg",
								children: "Watch list"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProgramNav, { activeId }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "px-5 pb-8 pt-2 text-[11px] leading-relaxed text-subtle",
							children: "Senior count is the theoretical ceiling. Actual 2027 opportunity is turnover plus coach selection plus performance."
						})
					]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8",
				children
			})]
		})]
	});
}
//#endregion
export { allMetrics as a, formatPlace as c, getProgram as d, isSeniorYear as f, useIntelStore as h, PROGRAMS as i, formatRound as l, opportunityScore as m, Badge as n, cn as o, openingForecast as p, Button as r, detectMoves as s, AppShell as t, formatToPar as u };
