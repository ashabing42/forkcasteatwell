import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Archive, Copy, Plus, Search, Trash2 } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/Doodle";
import { WeekNav } from "@/components/WeekNav";
import { useActivePlan, usePlan, useRecipes, useSavePlan } from "@/hooks/use-mealmap";
import { addCustomItem, addPantryItem, deleteCustomItem, deletePantryItem, fetchCustomItems, fetchPantry, qk, toggleCustomItem } from "@/lib/api";
import { STORES, storeLogoUrl, storeSearchUrl, plainList, type StoreId } from "@/lib/stores";
import { buildShoppingList, splitByPantry, CATEGORIES, CATEGORY_LABEL, formatQty, isStaple, pantryKey, planStartDate, shoppingSlots, shoppingName, toISODate, weekStartOf, type ShoppingLine } from "@/lib/mealmap";

export const Route = createFileRoute("/_authenticated/shopping")({
  head: () => ({ meta: [{ title: "Shopping list — Forkcast" }, { name: "description", content: "Your week's groceries, grouped by aisle." }, { property: "og:title", content: "Shopping list — Forkcast" }, { property: "og:description", content: "Your week's groceries, grouped by aisle." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Shopping,
});

function Shopping() {
  const [week, setWeek] = useState(weekStartOf(new Date()));
  const active = useActivePlan();
  const [navigated, setNavigated] = useState(false);
  useEffect(() => { if (!navigated) setWeek(active.week); }, [active.week, navigated]);
  const [wholeWeek, setWholeWeek] = useState(false);
  const { settings, slots, checked, needed } = usePlan(week);
  const recipes = useRecipes().data ?? [];
  const save = useSavePlan(week);
  const qc = useQueryClient();
  const custom = useQuery({ queryKey: qk.custom(week), queryFn: () => fetchCustomItems(week) });
  const pantry = useQuery({ queryKey: qk.pantry, queryFn: fetchPantry });
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [store, setStore] = useState<StoreId>("mercadona");
  useEffect(() => { const s = localStorage.getItem("forkcast-store"); if (s === "mercadona" || s === "carrefour" || s === "dia") setStore(s); }, []);
  const all = buildShoppingList(shoppingSlots(slots, toISODate(new Date()), wholeWeek), recipes, settings?.servings ?? 2);
  const { toBuy, atHome } = splitByPantry(all, (pantry.data ?? []).map((p) => p.name));
  const extras = custom.data ?? [];
  // A manual "ran out" entry is a need-it decision for the same canonical ingredient.
  const explicit = new Set(extras.map((e) => pantryKey(e.name)));
  const staples = toBuy.filter((l) => isStaple(l) && !needed.includes(pantryKey(l.name)) && !explicit.has(pantryKey(l.name)));
  const lines = toBuy.filter((l) => !staples.includes(l));
  const standalone = extras.filter((e) => !all.some((l) => pantryKey(l.name) === pantryKey(e.name)) && !(pantry.data ?? []).some((p) => pantryKey(p.name) === pantryKey(e.name)));
  const storeLabel = STORES.find((s) => s.id === store)?.label ?? "Mercadona";
  const refresh = async () => { await Promise.all([qc.invalidateQueries({ queryKey: qk.pantry }), qc.invalidateQueries({ queryKey: qk.custom(week) })]); };
  async function run(action: () => Promise<void>) { setBusy(true); try { await action(); } catch { toast.error("Couldn't update your list. Please try again."); } finally { setBusy(false); } }
  async function stock(itemName: string, category: string, key?: string, customId?: string, bought = false) {
    await run(async () => {
      const added = await addPantryItem(itemName, category === "frozen" ? "freezer" : "pantry");
      try {
        if (key && bought) await save.mutateAsync({ slots, checked_keys: [...new Set([...checked, key])] });
        if (customId && bought) await toggleCustomItem(customId, true);
        else if (customId) await deleteCustomItem(customId);
      } catch (error) { if (added.created) await deletePantryItem(added.id); throw error; }
      await refresh();
      toast.success(bought ? "Added to pantry" : "Already at home", { action: { label: "Undo", onClick: () => { void run(async () => {
        if (added.created) await deletePantryItem(added.id);
        if (key && bought) await save.mutateAsync({ slots, checked_keys: checked.filter((k) => k !== key) });
        if (customId && bought) await toggleCustomItem(customId, false);
        else if (customId) await addCustomItem(week, itemName, category);
        await refresh();
      }); } } });
    });
  }
  async function need(itemName: string) {
    await run(async () => {
      const existing = (pantry.data ?? []).filter((p) => pantryKey(p.name) === pantryKey(itemName));
      for (const p of existing) await deletePantryItem(p.id);
      await save.mutateAsync({ slots, needed_keys: [...new Set([...needed, pantryKey(itemName)])], checked_keys: checked.filter((k) => !all.some((l) => l.key === k && pantryKey(l.name) === pantryKey(itemName))) });
      await refresh();
    });
  }
  const SearchLink = ({ item }: { item: string }) => <a href={storeSearchUrl(store, item)} target="_blank" rel="noopener noreferrer" aria-label={`Search ${item} at ${storeLabel}`} title={`Search at ${storeLabel}`} className="p-2"><Search className="h-4 w-4 text-muted-foreground" /></a>;
  const HomeButton = ({ item, category, customId }: { item: string; category: string; customId?: string }) => <Button type="button" size="icon" variant="ghost" disabled={busy} aria-label={`I have ${item} at home`} title="Already have it — move to pantry" onClick={() => stock(item, category, undefined, customId)}><Archive className="h-4 w-4" /></Button>;
  function Line({ l }: { l: ShoppingLine }) {
    const on = checked.includes(l.key);
    return <li className="dotted-rule flex items-start gap-3 py-3">
      <Checkbox className="mt-1 h-5 w-5 shrink-0" aria-label={`Bought ${l.name}`} disabled={busy} checked={on} onCheckedChange={(v) => { if (v) void stock(l.name, l.category, l.key, undefined, true); else void run(async () => { await save.mutateAsync({ slots, checked_keys: checked.filter((k) => k !== l.key) }); }); }} />
      <div className="min-w-0 flex-1"><span data-on={on} className={on ? "scribble text-muted-foreground" : "scribble"}>{shoppingName(l)}</span><details className="mt-1 text-xs text-muted-foreground"><summary className="cursor-pointer">Used in {l.recipeTitles?.length ?? 0} recipes</summary>{l.recipeTitles?.join(" · ")}</details></div>
      <span className="pt-1 text-sm text-muted-foreground tabular whitespace-nowrap">{formatQty(l.quantity, l.unit)}</span><SearchLink item={l.name} /><HomeButton item={l.name} category={l.category} />
    </li>;
  }
  return <div>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-3xl">Shopping list</h1><p className="text-sm text-muted-foreground">For {settings?.servings ?? "…"} people · {lines.length + standalone.length} items to buy</p></div><WeekNav week={week} start={planStartDate(week, settings?.start_day)} days={settings?.days ?? 7} onChange={(w) => { setNavigated(true); setWeek(w); }} /></div>
    <div className="mb-4 flex flex-wrap items-center gap-2 border-b pb-4"><span className="text-sm text-muted-foreground">Shop at</span>{STORES.map((s) => <Button key={s.id} variant="ghost" size="sm" aria-pressed={store === s.id} className={store === s.id ? "bg-highlight" : "text-muted-foreground"} onClick={() => { setStore(s.id); localStorage.setItem("forkcast-store", s.id); }}><img src={storeLogoUrl(s.domain)} alt="" className="mr-2 h-5 w-5" />{s.label}</Button>)}<Button variant="outline" size="sm" onClick={async () => { try { await navigator.clipboard.writeText(plainList([...lines.filter((l) => !checked.includes(l.key)).map((l) => ({ name: shoppingName(l), qty: formatQty(l.quantity, l.unit) })), ...standalone.filter((e) => !e.checked)])); toast.success("List copied."); } catch { toast.error("Couldn't copy the list."); } }}><Copy className="mr-1 h-4 w-4" />Copy list</Button></div>
    <label className="mb-6 flex items-center gap-2 text-sm"><Checkbox checked={wholeWeek} onCheckedChange={(v) => setWholeWeek(!!v)} />Show whole week</label>
    {!wholeWeek && <p className="mb-4 text-xs text-muted-foreground">Today onwards · cooked meals excluded</p>}
    {staples.length > 0 && <details open className="mb-8 border-y py-4"><summary className="cursor-pointer font-display text-xl">Check you have these ({staples.length})</summary><ul className="mt-3">{staples.map((l) => <li key={l.key} className="dotted-rule flex flex-wrap items-center gap-2 py-3"><span className="min-w-0 flex-1">{l.name}</span><Button size="sm" variant="secondary" disabled={busy} onClick={() => stock(l.name, l.category)}>Got it</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => need(l.name)}>Need it</Button></li>)}</ul></details>}
    <form className="mb-6 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (name.trim()) void run(async () => { await addCustomItem(week, name.trim(), "other"); setName(""); await refresh(); }); }}><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Add something else…" /><Button type="submit" size="icon" disabled={busy} aria-label="Add item"><Plus className="h-5 w-5" /></Button></form>
    {lines.length === 0 && standalone.length === 0 && <EmptyState kind="basket"><p>Nothing to buy for these days.</p></EmptyState>}
    <div className="space-y-8">{CATEGORIES.map((cat) => { const items = lines.filter((l) => l.category === cat), extras = standalone.filter((e) => e.category === cat); if (!items.length && !extras.length) return null; return <section key={cat}><h2 className="mb-1 border-b pb-2 font-sans text-xs font-semibold uppercase text-muted-foreground">{CATEGORY_LABEL[cat]}</h2><ul>{items.map((l) => <Line key={l.key} l={l} />)}{extras.map((e) => <li key={e.id} className="dotted-rule flex items-center gap-2 py-3"><Checkbox disabled={busy} aria-label={`Bought ${e.name}`} checked={e.checked} onCheckedChange={(v) => { if (v) void stock(e.name, e.category, undefined, e.id, true); else void run(async () => { await toggleCustomItem(e.id, false); await refresh(); }); }} /><span className="min-w-0 flex-1">{e.name}</span><SearchLink item={e.name} /><HomeButton item={e.name} category={e.category} customId={e.id} /><Button size="icon" variant="ghost" disabled={busy} aria-label={`Remove ${e.name}`} onClick={() => run(async () => { await deleteCustomItem(e.id); await refresh(); })}><Trash2 className="h-4 w-4" /></Button></li>)}</ul></section>; })}</div>
    {atHome.length > 0 && <section className="mt-10"><h2 className="border-b pb-2 font-sans text-xs font-semibold uppercase text-muted-foreground">Already at home</h2><ul>{atHome.map((l) => <li key={l.key} className="dotted-rule flex items-center gap-3 py-3 text-muted-foreground"><Checkbox checked disabled /><span className="min-w-0 flex-1 scribble" data-on="true">{l.name}</span><Button size="sm" variant="outline" disabled={busy} onClick={() => need(l.name)}>Ran out</Button></li>)}</ul></section>}
  </div>;
}
