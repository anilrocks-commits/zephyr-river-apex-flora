import { _ as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { a as allMetrics, i as PROGRAMS, m as opportunityScore, n as Badge, p as openingForecast, t as AppShell } from "./AppShell-Db6Ml76s.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CKKsQgHy.js
var import_jsx_runtime = require_jsx_runtime();
function Watchlist() {
	const ranked = [...PROGRAMS].sort((a, b) => opportunityScore(b) - opportunityScore(a));
	const live = PROGRAMS.filter((p) => p.events.some((e) => e.status === "live"));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex max-w-5xl flex-col gap-8 pb-16",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs uppercase tracking-[0.16em] text-subtle",
					children: "2027 class"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-1 font-display text-4xl font-medium tracking-tight text-fg",
					children: "Watch list"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 max-w-2xl text-sm leading-relaxed text-muted",
					children: "Ten programs, scored by likely 2027 openings — not by how many seniors are on the roster. Open a school to read tournament scorecards, lineup moves, and 5th-year probability. Clippd remains the live source; athletics recaps fill gaps and are labeled."
				})
			] }),
			live.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-[10px] font-medium uppercase tracking-[0.14em] text-subtle",
				children: "Live this week"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 grid gap-2 sm:grid-cols-3",
				children: live.map((p) => {
					const event = p.events.find((e) => e.status === "live");
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/team/$id",
						params: { id: p.id },
						className: "rounded-xl bg-surface px-4 py-4 shadow-[var(--shadow-border)] transition-colors duration-150 hover:bg-surface-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium text-fg",
									children: p.short
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "live",
									children: "Live"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-muted",
								children: event?.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs text-subtle",
								children: event?.venue
							})
						]
					}, p.id);
				})
			})] }) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "grid gap-3 sm:grid-cols-2",
				children: ranked.map((p) => {
					const f = openingForecast(p);
					const metrics = allMetrics(p);
					const liveEvent = p.events.find((e) => e.status === "live");
					const lastComplete = p.events.find((e) => e.status === "complete" || e.status === "historical");
					const topInsight = p.insights[0];
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/team/$id",
						params: { id: p.id },
						className: "flex flex-col rounded-xl bg-surface p-5 shadow-[var(--shadow-border)] transition-colors duration-150 hover:bg-surface-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "font-display text-xl font-medium text-fg",
										children: p.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										variant: p.div === "D3" ? "default" : "accent",
										children: p.div
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 text-xs text-muted",
									children: [
										p.conf,
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "mx-2 text-subtle",
											children: "·"
										}),
										p.coach
									]
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-right",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "font-display text-2xl tabular-nums text-fg",
										children: f.rangeLabel
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[10px] uppercase tracking-[0.12em] text-subtle",
										children: "openings"
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 line-clamp-3 text-sm leading-relaxed text-muted",
								children: topInsight?.title ?? p.intel
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 flex flex-wrap gap-2 text-[11px] text-subtle",
								children: [liveEvent ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-under",
									children: ["Live · ", liveEvent.name]
								}) : lastComplete ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
									"Last card · ",
									lastComplete.name,
									lastComplete.teamPlace ? ` · ${lastComplete.teamPlace}` : ""
								] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Awaiting first fall card" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "ml-auto font-mono tabular-nums",
									children: [metrics.filter((m) => m.likelyVacates).length, " likely vacate"]
								})]
							})
						]
					}, p.id);
				})
			})
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Watchlist, {}) });
}
//#endregion
export { Home as component };
