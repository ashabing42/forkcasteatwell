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
import { usePlan, useRecipes, useSavePlan } from "@/hooks/use-mealmap";
import { addCustomItem, addPantryItem, deleteCustomItem, fetchCustomItems, fetchPantry, qk, toggleCustomItem } from "@/lib/api";
import { STORES, storeLogoUrl, storeSearchUrl, plainList, type StoreId } from "@/lib/stores";
import { buildShoppingList, splitByPantry, CATEGORIES, CATEGORY_LABEL, formatQty, weekStartOf } from "@/lib/mealmap";

export const Route = createFileRoute("/_authenticated/shopping")({
  head: () => ({ meta: [{ title: "Shopping list — Forkcast" }, { name: "description", content: "Your week's groceries, grouped by aisle." }, { property: "og:title", content: "Shopping list — Forkcast" }, { property: "og:description", content: "Your week's groceries, grouped by aisle." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Shopping,
});

function Shopping() {
  const [week, setWeek] = useState(weekStartOf(new Date()));
  const { settings, slots, checked } = usePlan(week);
  const recipes = useRecipes().data ?? [];
  const save = useSavePlan(week);
  const qc = useQueryClient();
  const custom = useQuery({ queryKey: qk.custom(week), queryFn: () => fetchCustomItems(week) });
  const [name, setName] = useState("");
  const pantry = useQuery({ queryKey: qk.pantry, queryFn: fetchPantry });
  const all = buildShoppingList(slots, recipes, settings?.servings ?? 2);
  const { toBuy: lines, atHome } = splitByPantry(all, (pantry.data ?? []).map((p) => p.name));
  const haveIt = async (name: string, category: string) => {
    await addPantryItem(name, category === "frozen" ? "freezer" : "pantry");
    qc.invalidateQueries({ queryKey: qk.pantry });
  };
  const refresh = () => qc.invalidateQueries({ queryKey: qk.custom(week) });
  const [store, setStore] = useState<StoreId>("mercadona");
  useEffect(() => { const s = localStorage.getItem("forkcast-store") as StoreId | null; if (s && STORES.some((x) => x.id === s)) setStore(s); }, []);
  const pickStore = (s: StoreId) => { setStore(s); localStorage.setItem("forkcast-store", s); };
  const storeLabel = STORES.find((s) => s.id === store)!.label;
  const copyList = async () => {
    const rows = [...lines.filter((l) => !checked.includes(l.key)).map((l) => ({ name: l.name, qty: formatQty(l.quantity, l.unit) })), ...(custom.data ?? []).filter((c) => !c.checked).map((c) => ({ name: c.name }))];
    await navigator.clipboard.writeText(plainList(rows));
    toast.success("List copied. Paste it wherever you shop.");
  };
  const SearchLink = ({ item }: { item: string }) => (
    <a href={storeSearchUrl(store, item)} target="_blank" rel="noopener noreferrer" aria-label={`Search ${item} at ${storeLabel}`} title={`Search at ${storeLabel}`} className="p-1" onClick={(e) => e.stopPropagation()}><Search className="h-4 w-4 text-muted-foreground" /></a>
  );
  const toggle = (key: string) => save.mutate({ slots, checked_keys: checked.includes(key) ? checked.filter((k) => k !== key) : [...checked, key] });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-3xl">Shopping list</h1><p className="text-sm text-muted-foreground">For {settings?.servings ?? "…"} people · {lines.length} items</p></div>
        <WeekNav week={week} onChange={setWeek} />
      </div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Shop at</span>
          {STORES.map((s) => (
            <button key={s.id} type="button" onClick={() => pickStore(s.id)} aria-pressed={store === s.id} className={store === s.id ? "flex items-center gap-2 rounded-lg bg-highlight px-3 py-1 font-medium" : "flex items-center gap-2 rounded-lg px-3 py-1 text-muted-foreground hover:text-foreground"}><img src={storeLogoUrl(s.domain)} alt="" className="h-5 w-5 rounded" loading="lazy" />{s.label}</button>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={copyList}><Copy className="mr-1 h-4 w-4" />Copy list</Button>
      </div>
      <form className="mb-6 flex gap-2" onSubmit={async (e) => { e.preventDefault(); if (!name.trim()) return; await addCustomItem(week, name.trim(), "other"); setName(""); refresh(); }}>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Add something else… (e.g. coffee)" className="h-11 border-0 border-b bg-transparent px-0 shadow-none focus-visible:ring-0" />
        <Button type="submit" size="icon" className="h-11 w-11 shrink-0 rounded-lg" aria-label="Add item"><Plus className="h-5 w-5" /></Button>
      </form>
      {lines.length === 0 && (custom.data ?? []).length === 0 && <EmptyState kind="basket"><p>Nothing to buy yet. Plan the week and the list writes itself.</p></EmptyState>}
      <div className="space-y-8">
        {CATEGORIES.map((cat) => {
          const items = lines.filter((l) => l.category === cat);
          const extras = (custom.data ?? []).filter((c) => c.category === cat);
          if (!items.length && !extras.length) return null;
          return (
            <section key={cat}>
              <h2 className="mb-1 border-b pb-2 font-sans text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{CATEGORY_LABEL[cat]}</h2>
              <ul>
                {items.map((l) => { const on = checked.includes(l.key); return (
                  <li key={l.key} className="dotted-rule"><label className="flex cursor-pointer items-center gap-3 py-3">
                    <Checkbox checked={on} onCheckedChange={() => toggle(l.key)} className="h-5 w-5 rounded-md" />
                    <span className="flex-1"><span data-on={on} className={on ? "scribble text-muted-foreground transition-colors" : "scribble transition-colors"}>{l.name}</span></span>
                    <span className="text-sm text-muted-foreground tabular">{formatQty(l.quantity, l.unit)}</span>
                    <SearchLink item={l.name} />
                    <button type="button" aria-label={`I have ${l.name} at home`} title="I have this at home" className="p-1" onClick={(e) => { e.preventDefault(); haveIt(l.name, l.category); }}><Archive className="h-4 w-4 text-muted-foreground" /></button>
                  </label></li>); })}
                {extras.map((c) => (
                  <li key={c.id} className="dotted-rule flex items-center gap-3 py-3">
                    <Checkbox checked={c.checked} onCheckedChange={async (v) => { await toggleCustomItem(c.id, !!v); refresh(); }} className="h-5 w-5 rounded-md" />
                    <span className="flex-1"><span data-on={c.checked} className={c.checked ? "scribble text-muted-foreground" : "scribble"}>{c.name}</span></span>
                    <SearchLink item={c.name} />
                    <button aria-label={`I have ${c.name} at home`} title="I have this at home" onClick={async () => { await haveIt(c.name, c.category); await deleteCustomItem(c.id); refresh(); }}><Archive className="h-4 w-4 text-muted-foreground" /></button>
                    <button aria-label="Remove" onClick={async () => { await deleteCustomItem(c.id); refresh(); }}><Trash2 className="h-4 w-4 text-muted-foreground" /></button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      {atHome.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-1 border-b pb-2 font-sans text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Already at home</h2>
          <p className="py-2 text-sm text-muted-foreground">Skip these. Ran out? Take them off the Pantry page.</p>
          <ul>
            {atHome.map((l) => (
              <li key={l.key} className="dotted-rule flex items-center gap-3 py-3 text-muted-foreground">
                <Checkbox checked disabled className="h-5 w-5 rounded-md" />
                <span className="flex-1"><span data-on="true" className="scribble">{l.name}</span></span>
                <span className="text-sm tabular">{formatQty(l.quantity, l.unit)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
