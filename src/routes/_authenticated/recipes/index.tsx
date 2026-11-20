import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Check, Clock, Plus, Search } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useProfile, useRecipes } from "@/hooks/use-mealmap";
import { EmptyState } from "@/components/Doodle";
import { RecipeImage } from "@/components/RecipeImage";
import { DIETS, DIET_TAGS, MEALS, MEAL_LABEL } from "@/lib/mealmap";
import { qk, saveRecipe } from "@/lib/api";
import { discoverRecipes, extractRecipeFromUrl } from "@/lib/spoonacular.functions";
import { IMPORT_DRAFT_KEY } from "@/lib/spoonacular";
import { cn } from "@/lib/utils";



export const Route = createFileRoute("/_authenticated/recipes/")({
  head: () => ({ meta: [{ title: "Recipe book — Forkcast" }, { name: "description", content: "Your recipes, plus a wider shelf to browse." }, { property: "og:title", content: "Recipe book — Forkcast" }, { property: "og:description", content: "Your recipes, plus a wider shelf to browse." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Recipes,
});

function Recipes() {
  const [tab, setTab] = useState<"mine" | "discover">("mine");
  return (
    <div>
      <h1 className="mb-4 text-4xl">Recipes</h1>
      <div className="mb-6 flex gap-6 border-b">
        {([["mine", "My recipes"], ["discover", "Discover"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={cn("-mb-px border-b-2 pb-2 text-sm uppercase tracking-[0.12em]", tab === k ? "border-primary text-foreground" : "border-transparent text-muted-foreground")}>{l}</button>
        ))}
      </div>
      {tab === "mine" ? <MyRecipes /> : <Discover />}
      <footer className="mt-12 border-t pt-4 text-center text-xs text-muted-foreground">
        <a href="https://spoonacular.com/food-api" target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">Powered by Spoonacular</a>
      </footer>
    </div>
  );
}

function MyRecipes() {
  const { data = [] } = useRecipes();
  const [q, setQ] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const list = data.filter((r) => r.title.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        <Button asChild className="rounded-lg"><Link to="/recipes/$id/edit" params={{ id: "new" }}><Plus className="mr-1 h-4 w-4" /> Add recipe</Link></Button>
        <Button variant="outline" className="rounded-lg" onClick={() => setImportOpen(true)}>Import from a link</Button>
      </div>
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your recipes…" className="mb-8 h-11 border-0 border-b bg-transparent px-0 shadow-none focus-visible:ring-0" />
      {list.length === 0 && <EmptyState kind="book"><p>No recipes here yet. Add the one you always come back to.</p></EmptyState>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((r) => (
          <Link key={r.id} to="/recipes/$id" params={{ id: r.id }} className="group block">
            <RecipeImage src={r.image_url} title={r.title} className="aspect-[4/5] w-full rounded-xl" />
            <div className="pt-3">
              <p className="font-display text-xl leading-snug">{r.title}</p>
              <div className="mt-1 flex flex-wrap gap-x-2">{r.diet_tags.map((t) => <span key={t} className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{DIETS.find((d) => d.id === t)?.label ?? t}</span>)}</div>
            </div>
          </Link>
        ))}
      </div>
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </>
  );
}

function ImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const extract = useServerFn(extractRecipeFromUrl);
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  async function go(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const draft = await extract({ data: { url } });
      sessionStorage.setItem(IMPORT_DRAFT_KEY, JSON.stringify(draft));
      onOpenChange(false);
      navigate({ to: "/recipes/$id/edit", params: { id: "new" } });
    } catch (err) { toast.error((err as Error).message || "That link didn't work."); }
    finally { setBusy(false); }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle className="font-display text-2xl">Import from a link</DialogTitle></DialogHeader>
        <form onSubmit={go} className="space-y-3">
          <p className="text-sm text-muted-foreground">Paste a recipe page. You'll get to check it before it's saved.</p>
          <Input required type="url" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} className="rounded-xl" />
          <Button type="submit" disabled={busy} className="w-full rounded-lg">{busy ? "Reading the recipe…" : "Fetch recipe"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Discover() {
  const { data: profile } = useProfile();
  const { data: mine = [] } = useRecipes();
  const qc = useQueryClient();
  const search = useServerFn(discoverRecipes);
  const [diets, setDiets] = useState<string[] | null>(null);
  const [meal, setMeal] = useState<string>("dinner");
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState<number | null>(null);
  const activeDiets = diets ?? (profile?.diets ?? []).filter((d) => d !== "balanced");
  const { data, isFetching, error } = useQuery({
    queryKey: ["discover", [...activeDiets].sort().join(","), meal, query],
    queryFn: () => search({ data: { diets: activeDiets, meal, query } }),
    enabled: !!profile, staleTime: 60 * 60_000, retry: false,
  });
  const owned = new Set(mine.map((r) => r.source_url).filter(Boolean));
  const toggle = (d: string) => setDiets(activeDiets.includes(d) ? activeDiets.filter((x) => x !== d) : [...activeDiets, d]);

  async function add(id: number) {
    const r = data?.find((x) => x.id === id); if (!r) return;
    setAdding(id);
    try {
      await saveRecipe(null, r.recipe as never);
      await qc.invalidateQueries({ queryKey: qk.recipes });
      toast.success(`${r.recipe.title} is in your book.`);
    } catch (err) { toast.error((err as Error).message); }
    finally { setAdding(null); }
  }

  return (
    <div>
      <form onSubmit={(e) => { e.preventDefault(); setQuery(text); }} className="mb-4 flex items-center gap-2 border-b">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Try “lentil”, “salmon”, “porridge”…" className="h-11 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0" />
      </form>
      <div className="mb-3 flex flex-wrap gap-2">{MEALS.map((m) => <Chip key={m} on={meal === m} onClick={() => setMeal(m)}>{MEAL_LABEL[m]}</Chip>)}</div>
      <div className="mb-6 flex flex-wrap gap-2">{DIET_TAGS.map((d) => <Chip key={d.id} on={activeDiets.includes(d.id)} onClick={() => toggle(d.id)}>{d.label}</Chip>)}</div>
      {error && <p className="py-8 text-center text-muted-foreground">{(error as Error).message}</p>}
      {isFetching && !data && <p className="py-8 text-center text-muted-foreground">Looking through the shelves…</p>}
      {data && data.length === 0 && <EmptyState kind="book"><p>Nothing matches all of that. Loosen a filter or two.</p></EmptyState>}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((r) => {
          const have = !!r.recipe.source_url && owned.has(r.recipe.source_url);
          return (
            <div key={r.id}>
              <RecipeImage src={r.recipe.image_url} title={r.recipe.title} className="aspect-[4/5] w-full rounded-xl" />
              <p className="pt-3 font-display text-xl leading-snug">{r.recipe.title}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs uppercase tracking-[0.12em] text-muted-foreground">
                <span className="tabular flex items-center gap-1"><Clock className="h-3 w-3" />{r.minutes} min</span>
                {r.recipe.diet_tags.map((t) => <span key={t}>{DIETS.find((d) => d.id === t)?.label ?? t}</span>)}
              </div>
              <Button size="sm" variant={have ? "secondary" : "default"} disabled={have || adding === r.id} onClick={() => add(r.id)} className="mt-3 rounded-lg">
                {have ? <><Check className="mr-1 h-4 w-4" /> In your book</> : adding === r.id ? "Adding…" : <><Plus className="mr-1 h-4 w-4" /> Add to my recipes</>}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={cn("rounded-lg border px-3 py-1.5 text-sm", on ? "border-primary bg-primary text-primary-foreground" : "bg-card")}>{children}</button>;
}
