import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { _ as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { a as Info, c as ChevronDown, o as Flag, r as Star, s as ExternalLink } from "../_libs/lucide-react.mjs";
import { a as allMetrics, c as formatPlace, d as getProgram, f as isSeniorYear, h as useIntelStore, l as formatRound, n as Badge, o as cn, p as openingForecast, r as Button, s as detectMoves, t as AppShell, u as formatToPar } from "./AppShell-Db6Ml76s.mjs";
import { n as Route } from "./router-ChiTYQ6d.mjs";
import { a as Bar, i as CartesianGrid, n as YAxis, o as ResponsiveContainer, r as XAxis, s as Tooltip, t as BarChart } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/team._id-BH_5w7rA.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ToPar({ value, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("font-mono tabular-nums", value == null ? "text-subtle" : value < 0 ? "text-under" : value > 0 ? "text-over" : "text-muted", className),
		children: formatToPar(value)
	});
}
function RoundCell({ score, par, counted }) {
	if (score == null) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "font-mono text-subtle",
		children: "—"
	});
	const rel = score - par;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("font-mono tabular-nums", rel < 0 ? "text-under" : rel > 0 ? "text-over" : "text-fg", counted === false && "text-subtle line-through decoration-subtle/70"),
		title: counted === false ? "Dropped from team score (5-count-4)" : counted ? "Counted toward team score" : void 0,
		children: formatRound(score)
	});
}
var statusVariant = {
	complete: "accent",
	live: "live",
	upcoming: "default",
	historical: "warn"
};
function TournamentCard({ program, event, defaultOpen }) {
	const hasScores = event.scores.length > 0;
	const hasPostedRounds = event.scores.some((s) => s.rounds.some((r) => r != null));
	const [open, setOpen] = (0, import_react.useState)(Boolean(defaultOpen ?? (hasScores || event.status === "live")));
	const playerName = (id) => program.players.find((p) => p.id === id)?.name ?? id;
	const playerYear = (id) => program.players.find((p) => p.id === id)?.year ?? "";
	const roundCount = Math.max(event.teamRounds.length, ...event.scores.map((s) => s.rounds.length), 3);
	const roundLabels = Array.from({ length: roundCount }, (_, i) => `R${i + 1}`);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: () => setOpen((v) => !v),
			className: "flex w-full items-start gap-3 px-4 py-4 text-left sm:px-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-display text-lg font-medium text-fg",
							children: event.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							variant: statusVariant[event.status] ?? "default",
							children: event.status
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-xs text-muted",
						children: [
							event.dates,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mx-2 text-subtle",
								children: "·"
							}),
							event.venue,
							event.fieldTeams ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mx-2 text-subtle",
									children: "·"
								}),
								event.fieldTeams,
								" teams"
							] }) : null
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "hidden shrink-0 text-right sm:block",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "font-display text-xl tabular-nums text-fg",
						children: formatPlace(event.teamPlace)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToPar, {
						value: event.teamToPar,
						className: "text-xs"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: cn("mt-1 size-4 shrink-0 text-subtle transition-transform duration-150", open && "rotate-180") })
			]
		}), open ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "border-t border-border px-4 pb-5 pt-4 sm:px-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TeamLine, {
					event,
					roundLabels
				}),
				event.lineupNote ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 rounded-lg bg-surface-2 px-3 py-2 text-xs leading-relaxed text-muted",
					children: event.lineupNote
				}) : null,
				hasScores ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "-mx-4 mt-4 overflow-x-auto sm:mx-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full min-w-[36rem] border-collapse text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "text-left text-[10px] uppercase tracking-[0.12em] text-subtle",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-3 py-2 font-medium",
									children: "Player"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-3 py-2 font-medium",
									children: "Role"
								}),
								roundLabels.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-3 py-2 font-medium",
									children: l
								}, l)),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-3 py-2 font-medium",
									children: "To par"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-3 py-2 font-medium",
									children: "Finish"
								})
							]
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: event.scores.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-t border-border/80",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "px-3 py-2.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "font-medium text-fg",
										children: playerName(row.playerId)
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[11px] text-subtle",
										children: playerYear(row.playerId)
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2.5",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleChip, { role: row.role })
								}),
								roundLabels.map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2.5",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoundCell, {
										score: row.rounds[i] ?? null,
										par: event.par,
										counted: row.counted[i]
									})
								}, i)),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2.5",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToPar, { value: row.toPar })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2.5 font-mono text-xs text-muted",
									children: row.finish ?? "—"
								})
							]
						}, row.playerId)) })]
					})
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 rounded-lg bg-surface-2 px-3 py-3 text-sm text-muted",
					children: event.status === "upcoming" ? "No lineup posted yet. This card will carry the five-man unit and round scores once Clippd or the athletics recap publishes them." : "Player scorecard not yet reconciled. Team totals are shown above when confirmed; individual rounds are not invented."
				}),
				!hasPostedRounds && hasScores ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-xs text-subtle",
					children: "Lineup is confirmed. Round scores will fill in from Clippd / the official recap — struck scores, when present, are the 5-count-4 drop."
				}) : null,
				event.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-xs leading-relaxed text-subtle",
					children: event.note
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
							"Source: ",
							event.sourceLabel,
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-subtle",
								children: [
									"(",
									event.source,
									")"
								]
							})
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: event.sourceUrl,
							target: "_blank",
							rel: "noreferrer",
							className: "inline-flex items-center gap-1 text-accent hover:underline",
							children: ["Recap ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "size-3" })]
						}),
						event.clippdUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: event.clippdUrl,
							target: "_blank",
							rel: "noreferrer",
							className: "inline-flex items-center gap-1 text-accent hover:underline",
							children: ["Clippd ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "size-3" })]
						}) : null
					]
				})
			]
		}) : null]
	});
}
function TeamLine({ event, roundLabels }) {
	if (!event.teamRounds.length && !event.teamPlace) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6",
		children: [
			roundLabels.map((label, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
				label,
				value: event.teamRounds[i] ?? "—"
			}, label)),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
				label: "Total",
				value: event.teamTotal ?? "—"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
				label: "To par",
				value: event.teamToPar != null ? event.teamToPar : "—",
				par: true
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
				label: "Finish",
				value: event.teamPlace ?? "—"
			})
		]
	});
}
function Stat({ label, value, par }) {
	const n = typeof value === "number" ? value : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg bg-surface-2 px-3 py-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-[10px] uppercase tracking-[0.12em] text-subtle",
			children: label
		}), par && n != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToPar, {
			value: n,
			className: "text-base font-medium"
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "font-mono text-base tabular-nums text-fg",
			children: value
		})]
	});
}
function RoleChip({ role }) {
	if (role === "team") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		variant: "accent",
		children: "Team"
	});
	if (role === "ind") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		variant: "warn",
		children: "IND"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: "DNP" });
}
var tabs = [
	{
		id: "tournaments",
		label: "Tournaments"
	},
	{
		id: "roster",
		label: "Roster"
	},
	{
		id: "selection",
		label: "Selection"
	},
	{
		id: "forecast",
		label: "2027 openings"
	}
];
function TeamView({ program }) {
	const [tab, setTab] = (0, import_react.useState)("tournaments");
	const forecast = openingForecast(program);
	const metrics = allMetrics(program);
	const starred = useIntelStore((s) => s.starred);
	const toggleStar = useIntelStore((s) => s.toggleStar);
	const isStarred = starred.includes(program.id);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex max-w-5xl flex-col gap-6 pb-16",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-2 text-xs text-muted",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: program.div }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-subtle",
								children: "·"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: program.conf }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-subtle",
								children: "·"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: program.coach })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-1 font-display text-3xl font-medium tracking-tight text-fg sm:text-4xl",
						children: program.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 max-w-2xl text-sm text-muted",
						children: program.intel
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: isStarred ? "default" : "secondary",
							size: "sm",
							onClick: () => toggleStar(program.id),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: cn("size-3.5", isStarred && "fill-current") }), isStarred ? "Watching" : "Watch"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							size: "sm",
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
								href: program.clippd,
								target: "_blank",
								rel: "noreferrer",
								children: ["Clippd ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "size-3.5" })]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							size: "sm",
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
								href: program.clippdSchedule,
								target: "_blank",
								rel: "noreferrer",
								children: ["Schedule ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "size-3.5" })]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							size: "sm",
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
								href: program.rosterUrl,
								target: "_blank",
								rel: "noreferrer",
								children: ["Roster ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "size-3.5" })]
							})
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "grid grid-cols-2 gap-2 lg:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Theoretical 2027 openings",
						value: forecast.theoretical
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Practical range",
						value: forecast.rangeLabel,
						hint: "Selection-weighted"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Senior / 5th-year cohort",
						value: forecast.seniorCount == null ? "?" : String(forecast.seniorCount)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Turnover signal",
						value: forecast.turnover,
						small: true
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs leading-relaxed text-subtle",
				children: forecast.notes
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex gap-1 overflow-x-auto rounded-xl bg-surface p-1 shadow-[var(--shadow-border)]",
				children: tabs.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setTab(t.id),
					className: cn("min-h-11 flex-1 rounded-lg px-3 text-sm font-medium transition-colors duration-150", tab === t.id ? "bg-surface-2 text-fg" : "text-muted hover:text-fg"),
					children: t.label
				}, t.id))
			}),
			tab === "tournaments" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tournaments, { program }) : null,
			tab === "roster" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Roster, {
				program,
				metrics
			}) : null,
			tab === "selection" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Selection, {
				program,
				metrics
			}) : null,
			tab === "forecast" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Forecast, {
				program,
				metrics
			}) : null
		]
	});
}
function Kpi({ label, value, hint, small }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl bg-surface px-4 py-4 shadow-[var(--shadow-border)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-[10px] uppercase tracking-[0.12em] text-subtle",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: cn("mt-1 font-display font-medium tabular-nums text-fg", small ? "text-lg leading-snug" : "text-2xl"),
				children: value
			}),
			hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1 text-[11px] text-muted",
				children: hint
			}) : null
		]
	});
}
function Tournaments({ program }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex flex-col gap-3",
		children: program.events.map((event, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TournamentCard, {
			program,
			event,
			defaultOpen: i === 0 || event.status === "live" || event.status === "complete"
		}, event.id))
	});
}
function Roster({ program, metrics }) {
	const notes = useIntelStore((s) => s.notes);
	const setNote = useIntelStore((s) => s.setNote);
	if (program.rosterUnknown || program.players.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "rounded-xl bg-surface px-5 py-8 text-sm text-muted shadow-[var(--shadow-border)]",
		children: "Roster reconciliation required. This is labeled Unknown rather than guessed."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "-mx-1 overflow-x-auto",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
			className: "w-full min-w-[52rem] border-collapse text-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
				className: "text-left text-[10px] uppercase tracking-[0.12em] text-subtle",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-3 py-2 font-medium",
						children: "Player"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-3 py-2 font-medium",
						children: "Year"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-3 py-2 font-medium",
						children: "Hometown"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-3 py-2 font-medium",
						children: "Starts"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-3 py-2 font-medium",
						children: "Avg / rd"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-3 py-2 font-medium",
						children: "Selection"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-3 py-2 font-medium",
						children: "5th-year"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-3 py-2 font-medium",
						children: "Signal"
					})
				]
			}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: metrics.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
				className: "border-t border-border",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
						className: "px-3 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "font-medium text-fg",
							children: m.player.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: notes[m.player.id] ?? "",
							onChange: (e) => setNote(m.player.id, e.target.value),
							placeholder: "Private note",
							className: "mt-1 w-full rounded-md border border-transparent bg-transparent text-[11px] text-muted outline-none placeholder:text-subtle focus:border-border focus:bg-surface-2"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-3 py-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: cn("font-medium", isSeniorYear(m.player.year) ? "text-warn" : "text-muted"),
							children: m.player.year
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-3 py-3 text-muted",
						children: m.player.hometown
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
						className: "px-3 py-3 font-mono text-xs text-muted",
						children: [
							m.teamStarts,
							" team / ",
							m.indStarts,
							" IND"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-3 py-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToPar, { value: m.avgToParPerRound })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-3 py-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScoreBar, { value: m.selectionScore })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-3 py-3",
						children: m.fifthYearProb == null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-subtle",
							children: "—"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "font-mono tabular-nums text-fg",
							children: [m.fifthYearProb, "%"]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "max-w-48 px-3 py-3 text-xs text-muted",
						children: m.player.signal
					})
				]
			}, m.player.id)) })]
		})
	});
}
function ScoreBar({ value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "h-1.5 w-16 overflow-hidden rounded-full bg-surface-3",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-full rounded-full bg-accent",
				style: { width: `${value}%` }
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "font-mono text-xs tabular-nums text-muted",
			children: value
		})]
	});
}
function Selection({ program, metrics }) {
	const moves = detectMoves(program).filter((m) => m.kind !== "held");
	const chartData = metrics.filter((m) => m.eventsPlayed > 0 || m.selectionScore > 0).slice(0, 8).map((m) => ({
		name: m.player.name.split(" ").slice(-1)[0],
		score: m.selectionScore
	}));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			program.insights.map((insight) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: cn("rounded-xl bg-surface px-4 py-4 shadow-[var(--shadow-border)] sm:px-5", "border-l-2", insight.tone === "up" && "border-l-under", insight.tone === "down" && "border-l-over", insight.tone === "watch" && "border-l-warn", insight.tone === "info" && "border-l-accent"),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-display text-base font-medium text-fg",
							children: insight.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							variant: insight.confidence === "confirmed" ? "accent" : insight.confidence === "unknown" ? "default" : "warn",
							children: insight.confidence
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm leading-relaxed text-muted",
						children: insight.body
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-xs text-subtle",
						children: insight.evidence
					})
				]
			}, insight.id)),
			moves.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl bg-surface px-4 py-4 shadow-[var(--shadow-border)] sm:px-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-display text-base font-medium",
						children: "Lineup moves"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-subtle",
						children: "Detected from consecutive cards with published lineups. Held starters are omitted."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-3 flex flex-col gap-2",
						children: moves.map((m, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex flex-wrap items-center gap-2 rounded-lg bg-surface-2 px-3 py-2 text-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MoveChip, { kind: m.kind }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium text-fg",
									children: m.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-muted",
									children: [
										m.from,
										" → ",
										m.to
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-xs text-subtle",
									children: [
										m.fromEvent,
										" → ",
										m.toEvent
									]
								})
							]
						}, `${m.playerId}-${i}`))
					})
				]
			}) : null,
			chartData.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl bg-surface px-4 py-4 shadow-[var(--shadow-border)] sm:px-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-display text-base font-medium",
						children: "Selection score"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-subtle",
						children: "Start rate, counted-round rate, scoring form, recency, IND penalty. Not a ranking of talent — a ranking of how much the coach is using the player."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 h-56",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
							width: "100%",
							height: "100%",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
								data: chartData,
								margin: {
									top: 8,
									right: 8,
									left: -16,
									bottom: 0
								},
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
										stroke: "rgba(232,238,233,0.06)",
										vertical: false
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
										dataKey: "name",
										tick: {
											fill: "#8b978f",
											fontSize: 11
										},
										axisLine: false,
										tickLine: false
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
										domain: [0, 100],
										tick: {
											fill: "#8b978f",
											fontSize: 11
										},
										axisLine: false,
										tickLine: false
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { contentStyle: {
										background: "#1b2420",
										border: "1px solid #24302a",
										borderRadius: 8,
										fontSize: 12,
										color: "#e8eee9"
									} }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
										dataKey: "score",
										fill: "#8fa894",
										radius: [
											4,
											4,
											0,
											0
										]
									})
								]
							})
						})
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-xl bg-surface px-4 py-6 text-sm text-muted shadow-[var(--shadow-border)]",
				children: "Selection scores appear after at least one published lineup."
			})
		]
	});
}
function MoveChip({ kind }) {
	const m = {
		promoted: {
			label: "Promoted",
			variant: "live"
		},
		relegated: {
			label: "Relegated",
			variant: "warn"
		},
		omitted: {
			label: "Omitted",
			variant: "down"
		},
		debut: {
			label: "Debut",
			variant: "accent"
		},
		held: {
			label: "Held",
			variant: "default"
		}
	}[kind] ?? {
		label: kind,
		variant: "default"
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		variant: m.variant,
		children: m.label
	});
}
function Forecast({ program, metrics }) {
	const forecast = openingForecast(program);
	const seniors = metrics.filter((m) => isSeniorYear(m.player.year));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl bg-surface px-4 py-5 shadow-[var(--shadow-border)] sm:px-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 text-xs text-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flag, { className: "size-3.5" }), "2027 recruiting math"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 font-display text-3xl font-medium text-fg",
						children: [forecast.rangeLabel, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "ml-2 text-base text-muted",
							children: "practical openings"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-sm text-muted",
						children: [
							"Theoretical ceiling ",
							forecast.theoretical,
							". Senior count is not a scholarship forecast."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-xs text-subtle",
						children: forecast.notes
					})
				]
			}),
			seniors.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-xl bg-surface px-4 py-6 text-sm text-muted shadow-[var(--shadow-border)]",
				children: program.rosterUnknown ? "No senior cohort until the roster is reconciled." : "No seniors on the current snapshot."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-col gap-2",
				children: seniors.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "flex flex-col gap-2 rounded-xl bg-surface px-4 py-4 shadow-[var(--shadow-border)] sm:flex-row sm:items-center sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "font-medium text-fg",
						children: [
							m.player.name,
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs font-normal text-warn",
								children: m.player.year
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-muted",
						children: m.fifthYearLabel
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-right",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[10px] uppercase tracking-[0.12em] text-subtle",
								children: "5th-year prob"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "font-mono text-lg tabular-nums text-fg",
								children: m.fifthYearProb == null ? "—" : `${m.fifthYearProb}%`
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-right",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[10px] uppercase tracking-[0.12em] text-subtle",
								children: "Vacate?"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: m.likelyVacates ? "text-under" : "text-warn",
								children: m.likelyVacates ? "Likely opens" : "Contested"
							})]
						})]
					})]
				}, m.player.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "flex items-start gap-2 text-xs leading-relaxed text-subtle",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, { className: "mt-0.5 size-3.5 shrink-0" }), "Confirmed means visible in Clippd or an official recap. Inferred is a recruiting read from that evidence. Unknown means we will not fill the gap. No 5th-year decision is treated as confirmed until a roster change or an explicit program/player confirmation."]
			})
		]
	});
}
function TeamPage() {
	const { id } = Route.useParams();
	const program = getProgram(id);
	if (!program) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-lg py-16 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-2xl",
				children: "Program not on the watch list"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted",
				children: "That school is not in the current 2027 set."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				className: "mt-4 inline-block text-sm text-accent hover:underline",
				children: "Back to watch list"
			})
		]
	}) });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		activeId: program.id,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TeamView, { program })
	});
}
//#endregion
export { TeamPage as component };
