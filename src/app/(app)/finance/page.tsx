"use client";

import { useMemo, useState } from "react";
import { Wallet, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { useLifeOSStore } from "@/stores/use-lifeos-store";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6", "#06b6d4"];

export default function FinancePage() {
  const finance = useLifeOSStore((s) => s.finance);
  const addFinance = useLifeOSStore((s) => s.addFinance);
  const deleteFinance = useLifeOSStore((s) => s.deleteFinance);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("Food");

  const filtered = finance.filter(
    (f) => f.title.toLowerCase().includes(q.toLowerCase()) || f.category.toLowerCase().includes(q.toLowerCase())
  );

  const income = finance.filter((f) => f.type === "income").reduce((a, f) => a + f.amount, 0);
  const expense = finance.filter((f) => f.type === "expense").reduce((a, f) => a + f.amount, 0);

  const byCat = useMemo(() => {
    const map = new Map<string, number>();
    finance.filter((f) => f.type === "expense").forEach((f) => {
      map.set(f.category, (map.get(f.category) || 0) + f.amount);
    });
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [finance]);

  const create = () => {
    const n = Number(amount);
    if (!title.trim() || !n) return;
    addFinance({ title: title.trim(), amount: n, type, category, date: new Date().toISOString() });
    setTitle("");
    setAmount("");
    setOpen(false);
    toast.success("Transaction added");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance"
        description="Cashflow, categories, and recurring costs."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4" /> Add</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Transaction</DialogTitle></DialogHeader>
              <div className="space-y-2">
                <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
                <Input placeholder="Amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
                <Input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
                <div className="flex gap-2">
                  <Button variant={type === "expense" ? "default" : "secondary"} onClick={() => setType("expense")}>Expense</Button>
                  <Button variant={type === "income" ? "default" : "secondary"} onClick={() => setType("income")}>Income</Button>
                </div>
                <Button onClick={create}>Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass"><CardContent className="p-5"><p className="text-sm text-[var(--fg-muted)]">Income</p><p className="font-display text-2xl font-semibold text-emerald-500">${income.toLocaleString()}</p></CardContent></Card>
        <Card className="glass"><CardContent className="p-5"><p className="text-sm text-[var(--fg-muted)]">Expenses</p><p className="font-display text-2xl font-semibold text-rose-500">${expense.toLocaleString()}</p></CardContent></Card>
        <Card className="glass"><CardContent className="p-5"><p className="text-sm text-[var(--fg-muted)]">Net</p><p className="font-display text-2xl font-semibold">${(income - expense).toLocaleString()}</p></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass">
          <CardHeader><CardTitle>By category</CardTitle></CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byCat} dataKey="value" nameKey="name" outerRadius={80}>
                  {byCat.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardHeader><CardTitle>Spend bars</CardTitle></CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCat}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--fg-muted)" fontSize={11} />
                <YAxis stroke="var(--fg-muted)" fontSize={11} />
                <Tooltip />
                <Bar dataKey="value" fill="var(--accent)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Input placeholder="Search transactions…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-md" />

      {filtered.length === 0 ? (
        <EmptyState icon={Wallet} title="No transactions" description="Add income or expenses to start tracking." />
      ) : (
        <div className="space-y-2">
          {filtered.map((f) => (
            <Card key={f.id} className="glass">
              <CardContent className="flex items-center gap-3 p-3 text-sm">
                <div className="flex-1">
                  <p className="font-medium">{f.title}</p>
                  <p className="text-xs text-[var(--fg-muted)]">{f.category} · {f.date.slice(0, 10)}</p>
                </div>
                {f.recurring && <Badge variant="secondary">Recurring</Badge>}
                <span className={f.type === "income" ? "text-emerald-500 font-semibold" : "text-rose-500 font-semibold"}>
                  {f.type === "income" ? "+" : "-"}${f.amount.toLocaleString()}
                </span>
                <Button variant="ghost" size="icon" onClick={() => deleteFinance(f.id)}><Trash2 className="h-4 w-4" /></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
